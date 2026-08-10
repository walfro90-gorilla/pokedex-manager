"""
Provider chain con fallback para visión y texto.

Decisión de diseño (documentada también en el README):
- Nunca un proveedor único en producción. La cadena degrada en orden de
  costo/latencia: Groq (rápido y barato) -> Gemini (free tier sólido)
  -> Anthropic (máxima calidad, último recurso).
- Cada provider se normaliza a una interfaz común (texto en, texto out;
  o imagen+prompt en, texto out) para que el resto del sistema no sepa
  ni le importe qué proveedor respondió.
- Un provider sin API key configurada simplemente se salta (permite
  correr el proyecto con una sola key).
"""

from __future__ import annotations

import base64
import logging
import os
from dataclasses import dataclass

import httpx

log = logging.getLogger("providers")

TIMEOUT = httpx.Timeout(30.0, connect=10.0)


@dataclass
class LLMResult:
    text: str
    provider: str
    model: str


class ProviderError(Exception):
    """Error recuperable de un provider — dispara el fallback al siguiente."""


# ---------------------------------------------------------------------------
# Providers de VISIÓN (imagen + prompt -> texto)
# ---------------------------------------------------------------------------

async def _groq_vision(image_b64: str, mime: str, prompt: str) -> LLMResult:
    key = os.getenv("GROQ_API_KEY")
    if not key:
        raise ProviderError("GROQ_API_KEY no configurada")
    model = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {key}"},
            json={
                "model": model,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url",
                         "image_url": {"url": f"data:{mime};base64,{image_b64}"}},
                    ],
                }],
                "temperature": 0.1,
            },
        )
    if r.status_code != 200:
        raise ProviderError(f"groq {r.status_code}: {r.text[:200]}")
    return LLMResult(
        text=r.json()["choices"][0]["message"]["content"],
        provider="groq", model=model,
    )


async def _gemini_vision(image_b64: str, mime: str, prompt: str) -> LLMResult:
    key = os.getenv("GEMINI_API_KEY")
    if not key:
        raise ProviderError("GEMINI_API_KEY no configurada")
    model = os.getenv("GEMINI_VISION_MODEL", "gemini-2.0-flash")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent",
            params={"key": key},
            json={"contents": [{"parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": mime, "data": image_b64}},
            ]}]},
        )
    if r.status_code != 200:
        raise ProviderError(f"gemini {r.status_code}: {r.text[:200]}")
    return LLMResult(
        text=r.json()["candidates"][0]["content"]["parts"][0]["text"],
        provider="gemini", model=model,
    )


async def _anthropic_vision(image_b64: str, mime: str, prompt: str) -> LLMResult:
    key = os.getenv("ANTHROPIC_API_KEY")
    if not key:
        raise ProviderError("ANTHROPIC_API_KEY no configurada")
    model = os.getenv("ANTHROPIC_VISION_MODEL", "claude-sonnet-4-6")
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        r = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={"x-api-key": key, "anthropic-version": "2023-06-01"},
            json={
                "model": model,
                "max_tokens": 500,
                "messages": [{
                    "role": "user",
                    "content": [
                        {"type": "image", "source": {
                            "type": "base64", "media_type": mime, "data": image_b64}},
                        {"type": "text", "text": prompt},
                    ],
                }],
            },
        )
    if r.status_code != 200:
        raise ProviderError(f"anthropic {r.status_code}: {r.text[:200]}")
    return LLMResult(
        text=r.json()["content"][0]["text"],
        provider="anthropic", model=model,
    )


VISION_CHAIN = [_groq_vision, _gemini_vision, _anthropic_vision]


async def vision_completion(image_bytes: bytes, mime: str, prompt: str) -> LLMResult:
    """Recorre la cadena de visión hasta obtener respuesta. Falla solo si TODOS fallan."""
    image_b64 = base64.b64encode(image_bytes).decode()
    errors: list[str] = []
    for provider in VISION_CHAIN:
        try:
            result = await provider(image_b64, mime, prompt)
            log.info("vision ok via %s (%s)", result.provider, result.model)
            return result
        except ProviderError as e:
            log.warning("vision fallback: %s", e)
            errors.append(str(e))
    raise RuntimeError(f"Todos los providers de visión fallaron: {errors}")
