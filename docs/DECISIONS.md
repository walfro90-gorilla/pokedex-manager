# Decisiones técnicas (ADR-lite)

> Este documento alimenta la sección "Decisiones y trade-offs" del README final.
> Formato: decisión → por qué → qué se descartó y por qué.

## D1 — Monorepo con dos runtimes (TS + Python)
Cada lenguaje donde es más fuerte: TypeScript para producto/UI (mi stack de mayor
productividad), Python para la capa de IA (estándar del ecosistema, Pydantic para
contratos). Descartado: todo-en-Node (no demuestra Python, pedido en el perfil) y
todo-en-Python (frontend de menor calidad en el tiempo disponible).

## D2 — Supabase (Auth + Postgres + RLS)
Auth production-grade sin construirla a mano en 3 días, y RLS mueve el aislamiento
por usuario a la base de datos. Descartado: JWT artesanal + SQLite (auth casera =
riesgo y tiempo; sin RLS la seguridad depende de no equivocarse en cada endpoint).

## D3 — Loop de tool calling a mano, sin frameworks
~100 líneas explícitas > LangChain para 3 herramientas: menos dependencias, cero
opacidad, y en una evaluación demuestra comprensión del mecanismo. Descartado:
LangChain/CrewAI (abstracción sin retorno a esta escala).

## D4 — Cadena de providers con fallback (Groq → Gemini → Anthropic)
Nunca un proveedor único en producción. Orden por costo/latencia; interfaz
normalizada; keys ausentes se saltan (el proyecto corre con una sola key).
Descartado: agregar más providers (Kimi, DeepSeek) — la arquitectura extensible ya
queda demostrada; cada provider extra es superficie de falla en un demo de 3 días.

## D5 — Verificación anti-alucinación en /identify
El nombre que devuelve el modelo se valida contra PokéAPI antes de aceptarse; si no
existe, found=false con el razonamiento. El LLM propone, la fuente de verdad dispone.

## D6 — ai-service sin service key
Reenvía el JWT del usuario; RLS aplica también dentro del agente. Un compromiso del
servicio de IA no compromete datos de otros usuarios.

## D7 — PokéAPI como fuente de verdad, DB como snapshot
La colección guarda user↔pokemon + snapshot (name/types/stats/sprite) para render
sin N llamadas a PokéAPI. Trade-off aceptado: el snapshot puede quedar desactualizado
(los datos base de Pokémon son casi estáticos — riesgo mínimo).

## Fuera de alcance (por tiempo, documentado a propósito)
- MCP server sobre la colección (bonus #2): diseñado, no implementado — ver README.
- Tests e2e del frontend; se priorizaron evals de la capa de IA (mayor riesgo).
- Cache de PokéAPI en DB propia; el cache de fetch de Next.js cubre el caso.
