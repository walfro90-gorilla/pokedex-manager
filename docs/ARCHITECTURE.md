# Arquitectura — PokéDex Manager

```
                    ┌─────────────────────────────┐
                    │        NAVEGADOR             │
                    └──────┬──────────────┬───────┘
                           │              │
                    (páginas, auth)   (upload img, chat)
                           │              │
                ┌──────────▼─────┐  ┌─────▼──────────────┐
                │  WEB (Next.js) │  │ AI-SERVICE (FastAPI)│
                │  - Auth UI     │  │  POST /identify     │
                │  - /pokedex    │  │  POST /agent        │
                │  - /collection │  │  (sin service key)  │
                └───┬───────┬────┘  └──┬───────────┬──────┘
                    │       │          │           │
              JWT usuario   │     JWT usuario   cadena LLM
                    │       │          │           │
             ┌──────▼───────▼──┐   ┌──▼────┐  ┌────▼─────────────┐
             │    SUPABASE     │   │PokéAPI│  │ Groq → Gemini →  │
             │  Auth + Postgres│   │(verdad│  │ Anthropic        │
             │  RLS por user   │   │Pokémon│  │ (fallback chain) │
             └─────────────────┘   └───────┘  └──────────────────┘
```

## Flujos clave

**Identificación por imagen:** navegador sube imagen → /identify → cadena de visión
devuelve JSON {name, confidence} → parseo defensivo → verificación contra PokéAPI
(anti-alucinación) → respuesta validada (Pydantic) → el usuario confirma y se agrega
a su colección (con SU JWT → RLS).

**Agente:** navegador manda {message, history} + JWT → loop de tool calling en Groq →
tools deterministas (query_collection con RLS, search_pokeapi, add_pokemon) → errores
de tools regresan al modelo → respuesta final + history actualizado (memoria de corto
plazo vive en el cliente; el servicio es stateless).

## Aislamiento de seguridad

El ai-service reenvía el JWT del usuario a Supabase y NO posee service key: aunque
tuviera un bug o el LLM pidiera algo indebido, Postgres (RLS) impide tocar filas de
otros usuarios. La seguridad vive en la capa de datos, no en la de aplicación.
