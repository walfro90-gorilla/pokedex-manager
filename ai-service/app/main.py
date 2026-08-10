"""
PokéDex AI Service — FastAPI

Dos responsabilidades, nada más:
  POST /identify  -> imagen de un Pokémon -> {pokemon_id, name, confidence, ...}
  POST /agent     -> chat con tool calling sobre la colección del usuario

La app Next.js es el único cliente. La auth del usuario viaja como JWT de
Supabase en Authorization: Bearer — este servicio lo reenvía a Supabase,
donde RLS decide qué puede tocar. Este servicio NO tiene service key:
no puede leer datos de otros usuarios ni aunque tenga un bug.
"""

from __future__ import annotations

import json
import logging
import os
import re

import httpx
from fastapi import FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .agent import run_agent
from .providers import vision_completion

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("main")

app = FastAPI(title="PokéDex AI Service", version="1.0.0")

# CORS_ORIGINS: lista separada por comas. Default cubre el puerto estándar de
# `next dev`; en dev con puertos alternos (ej. 3000 ocupado) o en prod (dominio
# de Vercel) se agrega vía env sin tocar código.
_cors_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_MIME = {"image/jpeg", "image/png", "image/webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024  # 5 MB

IDENTIFY_PROMPT = """Identifica el Pokémon en esta imagen (puede ser una carta, \
juguete, screenshot o dibujo). Responde ÚNICAMENTE un objeto JSON, sin markdown \
ni texto adicional, con este formato exacto:
{"name": "<nombre en inglés en minúsculas>", "confidence": <0.0-1.0>, "reasoning": "<una frase>"}
Si no hay un Pokémon reconocible responde: {"name": null, "confidence": 0, "reasoning": "..."}"""


class IdentifyResponse(BaseModel):
    """Contrato de salida validado — el frontend recibe esto o un error, nunca texto suelto."""
    found: bool
    name: str | None = None
    pokemon_id: int | None = None
    sprite_url: str | None = None
    types: list[str] = Field(default_factory=list)
    confidence: float = 0
    reasoning: str = ""
    provider: str = ""


def _parse_model_json(text: str) -> dict:
    """Los modelos a veces envuelven el JSON en ```json ... ``` o agregan texto.
    Estrategia: strip de bloques <think> (modelos razonadores tipo qwen3, que citan
    el formato JSON DENTRO del razonamiento y rompen la extracción por regex) ->
    strip de fences -> parse; si falla, extraer el primer {...} balanceado."""
    clean = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL)
    clean = re.sub(r"```(?:json)?|```", "", clean).strip()
    try:
        return json.loads(clean)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", clean, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/identify", response_model=IdentifyResponse)
async def identify(file: UploadFile = File(...)):
    if file.content_type not in ALLOWED_MIME:
        raise HTTPException(415, f"Formato no soportado: {file.content_type}")
    image = await file.read()
    if len(image) > MAX_IMAGE_BYTES:
        raise HTTPException(413, "Imagen mayor a 5 MB")

    result = await vision_completion(image, file.content_type, IDENTIFY_PROMPT)

    try:
        data = _parse_model_json(result.text)
    except json.JSONDecodeError:
        log.error("output no parseable de %s: %s", result.provider, result.text[:200])
        raise HTTPException(502, "El modelo no devolvió un formato válido")

    if not data.get("name"):
        return IdentifyResponse(found=False,
                                reasoning=data.get("reasoning", "Sin Pokémon reconocible"),
                                provider=result.provider)

    # Verificación contra la fuente de verdad: PokéAPI.
    # Si el modelo alucina un nombre, aquí se detecta (found=False + reasoning).
    name = str(data["name"]).strip().lower()
    async with httpx.AsyncClient(timeout=15) as client:
        r = await client.get(f"https://pokeapi.co/api/v2/pokemon/{name}")
    if r.status_code == 404:
        return IdentifyResponse(found=False, confidence=float(data.get("confidence", 0)),
                                reasoning=f"El modelo dijo '{name}' pero no existe en PokéAPI",
                                provider=result.provider)
    p = r.json()

    return IdentifyResponse(
        found=True,
        name=p["name"],
        pokemon_id=p["id"],
        sprite_url=p["sprites"]["other"]["official-artwork"]["front_default"],
        types=[t["type"]["name"] for t in p["types"]],
        confidence=float(data.get("confidence", 0)),
        reasoning=str(data.get("reasoning", "")),
        provider=result.provider,
    )


class AgentRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[dict] = Field(default_factory=list, max_length=40)


@app.post("/agent")
async def agent(body: AgentRequest, authorization: str = Header(default="")):
    if not authorization.startswith("Bearer "):
        raise HTTPException(401, "Falta el token de usuario")
    user_jwt = authorization.removeprefix("Bearer ").strip()
    try:
        return await run_agent(user_jwt, body.history, body.message)
    except httpx.HTTPStatusError as e:
        # el body del provider dice POR QUÉ (modelo caído, payload inválido...)
        body_preview = e.response.text[:300] if e.response is not None else ""
        log.error("agent upstream error: %s | body: %s", e, body_preview)
        raise HTTPException(502, "Error consultando servicios externos")
