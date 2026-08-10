"""
Agente de colección con tool calling (loop completo, sin frameworks).

Decisión de diseño: el loop está escrito a mano en ~100 líneas en lugar de
usar LangChain/CrewAI. Para tres herramientas, un framework agrega
dependencias y opacidad sin aportar valor — y en una evaluación técnica,
el loop explícito demuestra comprensión del mecanismo:

    usuario -> LLM -> (tool_calls?) -> ejecutar tools -> resultados -> LLM -> respuesta

Reglas de producción aplicadas:
- El LLM NUNCA toca la base de datos: pide herramientas, el código las
  ejecuta de forma determinista (con el token del usuario -> RLS aplica).
- Los errores de una tool se regresan al modelo como resultado, para que
  se recupere o lo comunique — nunca se asume éxito.
- Límite de iteraciones (MAX_TURNS) para impedir loops infinitos.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

import httpx

log = logging.getLogger("agent")

MAX_TURNS = 6
TIMEOUT = httpx.Timeout(45.0, connect=10.0)

SYSTEM_PROMPT = """Eres el asistente de una PokéDex personal. Ayudas al usuario a \
explorar y gestionar su colección de Pokémon. Responde en el idioma del usuario, \
breve y útil. Usa las herramientas disponibles para consultar datos reales — \
nunca inventes contenido de la colección ni stats. Si una herramienta falla, \
comunícalo con claridad."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "query_collection",
            "description": "Consulta la colección del usuario autenticado. "
                           "Devuelve la lista de Pokémon capturados con tipos y stats.",
            "parameters": {"type": "object", "properties": {}, "required": []},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_pokeapi",
            "description": "Busca un Pokémon por nombre o id en PokéAPI. "
                           "Devuelve id, nombre, tipos, stats y sprite.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name_or_id": {"type": "string",
                                   "description": "Nombre en inglés o número de Pokédex"}
                },
                "required": ["name_or_id"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "add_pokemon",
            "description": "Agrega un Pokémon a la colección del usuario. "
                           "Requiere el id numérico de PokéAPI.",
            "parameters": {
                "type": "object",
                "properties": {
                    "pokemon_id": {"type": "integer"},
                    "notes": {"type": "string", "description": "Nota opcional"},
                },
                "required": ["pokemon_id"],
            },
        },
    },
]


# ---------------------------------------------------------------------------
# Implementación de las herramientas (lado determinista)
# ---------------------------------------------------------------------------

async def _tool_query_collection(user_jwt: str, args: dict) -> Any:
    """Lee la colección vía la API REST de Supabase CON el JWT del usuario.
    El aislamiento lo garantiza RLS, no este código."""
    url = os.environ["SUPABASE_URL"]
    anon = os.environ["SUPABASE_ANON_KEY"]
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(
            f"{url}/rest/v1/collection",
            params={"select": "pokemon_id,name,sprite_url,types,stats,notes,captured_at",
                    "order": "captured_at.desc"},
            headers={"apikey": anon, "Authorization": f"Bearer {user_jwt}"},
        )
    r.raise_for_status()
    return r.json()


async def _tool_search_pokeapi(_user_jwt: str, args: dict) -> Any:
    name_or_id = str(args["name_or_id"]).strip().lower()
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.get(f"https://pokeapi.co/api/v2/pokemon/{name_or_id}")
    if r.status_code == 404:
        return {"error": f"No existe el Pokémon '{name_or_id}' en PokéAPI"}
    r.raise_for_status()
    p = r.json()
    return {
        "pokemon_id": p["id"],
        "name": p["name"],
        "types": [t["type"]["name"] for t in p["types"]],
        "stats": {s["stat"]["name"]: s["base_stat"] for s in p["stats"]},
        "sprite_url": p["sprites"]["other"]["official-artwork"]["front_default"],
    }


async def _tool_add_pokemon(user_jwt: str, args: dict) -> Any:
    poke = await _tool_search_pokeapi(user_jwt, {"name_or_id": args["pokemon_id"]})
    if "error" in poke:
        return poke
    url = os.environ["SUPABASE_URL"]
    anon = os.environ["SUPABASE_ANON_KEY"]
    row = {**poke, "notes": args.get("notes")}
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(
            f"{url}/rest/v1/collection",
            headers={"apikey": anon, "Authorization": f"Bearer {user_jwt}",
                     "Prefer": "return=representation"},
            json=row,
        )
    if r.status_code == 409:
        return {"error": "Ese Pokémon ya está en tu colección"}
    r.raise_for_status()
    return {"ok": True, "added": poke["name"]}


TOOL_IMPL = {
    "query_collection": _tool_query_collection,
    "search_pokeapi": _tool_search_pokeapi,
    "add_pokemon": _tool_add_pokemon,
}


# ---------------------------------------------------------------------------
# El loop
# ---------------------------------------------------------------------------

async def _chat_completion(messages: list[dict]) -> dict:
    """Llamada de texto a Groq (primario). El fallback de texto reutilizaría
    providers.py; se mantiene simple aquí porque el agente necesita
    tool-calling nativo, y Groq lo soporta con el formato OpenAI."""
    key = os.environ["GROQ_API_KEY"]
    model = os.getenv("GROQ_TEXT_MODEL", "llama-3.3-70b-versatile")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={"model": model, "messages": messages,
                  "tools": TOOLS, "tool_choice": "auto", "temperature": 0.3},
        )
    r.raise_for_status()
    return r.json()["choices"][0]["message"]


async def run_agent(user_jwt: str, history: list[dict], user_message: str) -> dict:
    """Ejecuta el loop de tool calling.

    `history` es la memoria de corto plazo: la conversación previa que el
    frontend manda en cada request (el LLM no tiene estado entre llamadas).
    Devuelve la respuesta final + el historial actualizado + traza de tools.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}, *history,
                {"role": "user", "content": user_message}]
    tool_trace: list[dict] = []

    for _ in range(MAX_TURNS):
        msg = await _chat_completion(messages)

        if not msg.get("tool_calls"):
            # Respuesta final — el modelo terminó de razonar
            final = msg.get("content", "")
            new_history = [*history,
                           {"role": "user", "content": user_message},
                           {"role": "assistant", "content": final}]
            return {"reply": final, "history": new_history, "tools_used": tool_trace}

        # El modelo pidió herramientas: ejecutarlas y devolver resultados
        messages.append(msg)
        for call in msg["tool_calls"]:
            name = call["function"]["name"]
            try:
                args = json.loads(call["function"]["arguments"] or "{}")
                result = await TOOL_IMPL[name](user_jwt, args)
            except Exception as e:  # el error VUELVE al modelo, no se oculta
                log.warning("tool %s falló: %s", name, e)
                result = {"error": f"La herramienta {name} falló: {e}"}
            # result completo para que el frontend pueda renderizar cards
            # (sprites/tipos/stats); preview corto para logs y traza compacta.
            tool_trace.append({"tool": name, "result_preview": str(result)[:120],
                               "result": result})
            messages.append({"role": "tool", "tool_call_id": call["id"],
                             "content": json.dumps(result, ensure_ascii=False)})

    return {"reply": "No pude completar la tarea en el número máximo de pasos.",
            "history": history, "tools_used": tool_trace}
