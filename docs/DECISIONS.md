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

## D8 — Confirmación de email activa (default de Supabase Auth)
Se deja "Confirm email" ON en vez de desactivarlo para la demo. Más fiel a un
comportamiento production-grade; el costo es que una cuenta nueva no puede loguear
hasta confirmar el correo — el evaluador necesita revisar el inbox de cada cuenta de
prueba que cree (o usar un alias `+tag@gmail.com` sobre un correo real). Documentar
esto explícitamente en el README y mencionarlo en el video para que no se lea como un
bug. Descartado: desactivar la confirmación — más simple para la demo pero es un
downgrade de seguridad real que no refleja cómo se corre este flujo en producción.

## D9 — Revisión de alineación contra el brief oficial del cliente (2026-08-09)
Se comparó `docs/PLAN.md` línea por línea contra el correo de evaluación recibido.
Resultado: requerimientos funcionales (auth, PokéAPI, persistencia, UI responsive) y
el orden de criterios de evaluación (funcionalidad > código > UI > arquitectura >
documentación > bonus) ya coincidían con lo que CLAUDE.md tenía documentado. Único
gap real: el brief dice explícitamente **"No es necesario que la aplicación esté
desplegada en producción"**, mientras que el plan trataba el deploy como AC
bloqueante en F1 y F2. Corregido: deploy pasa a stretch goal en las tres fases (ver
PLAN.md) — no bloquea ninguna AC, se intenta si el tiempo alcanza después de core +
bonus documentados. Se reafirma también que el bonus #2 del brief pide MCP (Model
Context Protocol) específicamente, no "tool calling" genérico — el agente
implementado (`ai-service/app/agent.py`, ver D3) es un loop de function-calling a
mano, NO el protocolo MCP; esa distinción ya estaba correcta en "Fuera de alcance"
abajo, pero el README final debe ser explícito sobre esto para no sobre-vender el
bonus.

## D10 — Ajustes forzados por deprecación de modelos en Groq (2026-08-09)
Al probar en vivo, Groq ya había retirado `llama-4-scout` (el default de visión del
código): el único modelo con visión disponible en la key es `qwen/qwen3.6-27b`, un
modelo razonador que emite bloques `<think>` citando el formato JSON dentro del
razonamiento — eso rompía la extracción por regex del parser defensivo. Dos cambios
mínimos: (1) el parser de main.py ahora quita bloques `<think>` antes de parsear
(generaliza a cualquier provider razonador futuro), (2) default de visión actualizado
a qwen. La cadena de fallback demostró su valor en esta misma sesión: el 404 de Groq
saltó limpio a los siguientes providers. Bonus del mismo test en vivo: el tool
`add_pokemon` del agente fallaba con 403 porque inserta sin `user_id`; fix a nivel DB
(`user_id default auth.uid()`) — el valor sale del JWT, RLS lo sigue validando, cero
código nuevo en el servicio.

## Fuera de alcance (por tiempo, documentado a propósito)
- MCP server sobre la colección (bonus #2, protocolo específico — distinto del
  tool-calling que sí está implementado en agent.py, ver D9): diseñado, no
  implementado — ver README.
- Tests e2e del frontend; se priorizaron evals de la capa de IA (mayor riesgo).
- Cache de PokéAPI en DB propia; el cache de fetch de Next.js cubre el caso.
