"""
Servidor MCP (Model Context Protocol) sobre la colección — bonus #2 del brief.

Expone las MISMAS herramientas del agente (app/agent.py) vía MCP sobre stdio,
para conectar la colección a cualquier cliente MCP (Claude Desktop, Claude
Code, etc.). Cero lógica de datos nueva: reutiliza TOOL_IMPL tal cual.

Autenticación: igual que el resto del sistema — JWT del USUARIO (login por
password contra Supabase Auth), nunca service key. RLS aplica también aquí:
este servidor solo ve/toca la colección de la cuenta configurada.

Registro en un cliente MCP (ejemplo con Claude Code):

    claude mcp add pokedex \
      -e SUPABASE_URL=https://<proyecto>.supabase.co \
      -e SUPABASE_ANON_KEY=<anon-key> \
      -e POKEDEX_EMAIL=<email-de-tu-cuenta> \
      -e POKEDEX_PASSWORD=<password> \
      -- python /ruta/a/ai-service/mcp_server.py
"""

from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

import httpx

# Importable sin importar desde qué cwd lance el cliente MCP este script
sys.path.insert(0, str(Path(__file__).resolve().parent))

from app.agent import TOOL_IMPL  # noqa: E402
from mcp.server.fastmcp import FastMCP  # noqa: E402

mcp = FastMCP("pokedex")

_token: dict = {"jwt": None, "exp": 0.0}


async def _user_jwt() -> str:
    """Login por password contra Supabase Auth; cachea el JWT y re-loguea al
    expirar. La sesión pertenece a un usuario real — RLS decide qué ve.

    El reloj es time.time() (wall-clock), no monotonic: la vida del JWT se
    valida en tiempo real. Con monotonic, suspender la máquina congelaba el
    reloj del proceso y dejaba un token muerto que el cache creía fresco
    (401 permanente hasta reiniciar el servidor)."""
    if _token["jwt"] and time.time() < _token["exp"]:
        return _token["jwt"]
    url = os.environ["SUPABASE_URL"]
    anon = os.environ["SUPABASE_ANON_KEY"]
    async with httpx.AsyncClient(timeout=15.0) as client:
        r = await client.post(
            f"{url}/auth/v1/token",
            params={"grant_type": "password"},
            headers={"apikey": anon},
            json={"email": os.environ["POKEDEX_EMAIL"],
                  "password": os.environ["POKEDEX_PASSWORD"]},
        )
    r.raise_for_status()
    data = r.json()
    _token["jwt"] = data["access_token"]
    _token["exp"] = time.time() + data.get("expires_in", 3600) - 60
    return _token["jwt"]


async def _call_tool(name: str, args: dict):
    """Ejecuta una tool del agente con el JWT del usuario. Si el token sale
    401 (revocado o reloj), invalida el cache, re-loguea y reintenta UNA vez.
    Seguro incluso en escrituras: un 401 significa que la petición fue
    rechazada antes de ejecutarse — no hubo efecto que duplicar."""
    try:
        return await TOOL_IMPL[name](await _user_jwt(), args)
    except httpx.HTTPStatusError as e:
        if e.response is None or e.response.status_code != 401:
            raise
        _token["jwt"] = None
        return await TOOL_IMPL[name](await _user_jwt(), args)


@mcp.tool()
async def query_collection() -> list:
    """Consulta la colección del usuario autenticado: Pokémon capturados
    con tipos, stats, notas y fecha de captura."""
    return await _call_tool("query_collection", {})


@mcp.tool()
async def search_pokeapi(name_or_id: str) -> dict:
    """Busca un Pokémon por nombre en inglés o número de Pokédex en PokéAPI
    (fuente de verdad). Devuelve id, nombre, tipos, stats y sprite."""
    return await TOOL_IMPL["search_pokeapi"]("", {"name_or_id": name_or_id})


@mcp.tool()
async def add_pokemon(pokemon_id: int, notes: str | None = None) -> dict:
    """Agrega un Pokémon a la colección por su id numérico de PokéAPI.
    Se verifica contra PokéAPI antes de insertar (anti-alucinación)."""
    return await _call_tool("add_pokemon", {"pokemon_id": pokemon_id, "notes": notes})


@mcp.resource("collection://mine")
async def collection_resource() -> str:
    """La colección completa del usuario como recurso JSON de solo lectura."""
    rows = await _call_tool("query_collection", {})
    return json.dumps(rows, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    mcp.run()  # transporte stdio: el cliente MCP lanza y habla por stdin/stdout
