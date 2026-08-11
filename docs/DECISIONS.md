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

## D11 — PWA + HTTPS con Caddy y sslip.io (2026-08-10)
La app es instalable como PWA (manifest tipado de Next + iconos rasterizados de la
pokébola SVG con un script de Python puro — sin deps de imagen). Chrome exige contexto
seguro para ofrecer instalación, y el deploy era HTTP sobre IP pelada: se agregó un
overlay de producción (`docker-compose.prod.yml` + `Caddyfile`) con Caddy como reverse
proxy y certificados automáticos de Let's Encrypt usando sslip.io (DNS wildcard gratis
que resuelve <ip-con-guiones>.sslip.io a la IP — sin comprar dominio). El compose base
queda intacto para la evaluación local. Descartado: service worker con soporte offline
— Chrome ya no lo exige para instalar, y el shell offline de una app cuyo contenido
vive en APIs externas aporta poco (documentado como mejora futura).

## D12 — Capa social y gamificación sin romper RLS (2026-08-10)
Se agregó comunidad de entrenadores (directorio + perfiles públicos), medallero,
juego "¿Quién es ese Pokémon?", modo cámara y chat visual persistente. La decisión
de seguridad clave: **la tabla `collection` nunca se abrió al público**. Lo público
sale por dos funciones `security definer` con contrato explícito y mínimo
(`trainer_directory()`: nombre/foto/conteo; `trainer_pokemons(uuid)`: solo datos de
exhibición del equipo — las notas personales y todo lo demás siguen tras RLS). El
perfil (nombre/foto) vive en `profiles` con lectura pública y escritura solo propia;
el avatar sube a Storage con políticas por carpeta de usuario. El medallero se
computa de las filas ya cargadas (cero contadores que mantener). Gamificación con
datos derivados, no con estado nuevo.

## D13 — Servidor MCP reutilizando las tools del agente (2026-08-10)
El bonus #2 del brief pide MCP (Model Context Protocol) específicamente — distinto
del function calling del agente (ver D9). Implementado como servidor **stdio**
(`ai-service/mcp_server.py`) con el SDK oficial de Python (FastMCP): expone las
mismas 3 herramientas del agente más la colección como resource de solo lectura
(`collection://mine`). Decisiones clave: (1) **cero duplicación** — importa
`TOOL_IMPL` de `app/agent.py`, la lógica determinista de cada herramienta existe
una sola vez y ambos mecanismos (function calling y MCP) la comparten;
(2) **misma postura de seguridad** — el servidor se autentica como un usuario real
(login por password contra Supabase Auth, JWT cacheado con renovación al expirar),
RLS decide qué ve, sin service key; (3) **stdio y no HTTP** — es el transporte
estándar para clientes MCP locales (Claude Desktop/Code) y no abre superficie de
red nueva. Verificado con un cliente MCP real (SDK oficial): initialize,
list_tools, list_resources, call_tool de las tres herramientas y read_resource
contra el proyecto Supabase vivo. La distinción honesta de D9 se mantiene en el
README: `/chat` es function calling, esto es MCP — el repo demuestra ambos.
**Ampliación (2026-08-11):** el servidor creció a los tres primitivos del
protocolo — 6 tools (gestión completa: + `remove_pokemon`, `update_note`,
`trainer_directory`, implementadas en el registry compartido de `agent.py` sin
tocar el schema del agente del chat), 2 prompts que Claude Code expone como
slash commands, y fallback a `ai-service/.env` para que el registro del
evaluador sea una sola línea (solo email/password de la cuenta demo).

## D14 — Login con Google y la identidad canónica del entrenador (2026-08-10)
Se agregó OAuth con Google (botón en /login y /register vía Server Action +
`/auth/callback` con intercambio PKCE — cero JS de cliente). Dos lecciones que
quedaron en el diseño: (1) detrás del reverse proxy, `request.url` en un route
handler trae el host interno del contenedor — el origen público para redirects
se construye con `x-forwarded-host`/`x-forwarded-proto` (Caddy los manda);
(2) Supabase vincula la identidad de Google a la cuenta existente por email
verificado y **sobreescribe `user_metadata.avatar_url` con la foto de Google en
cada login** — por eso `profiles` es la fuente canónica de nombre/foto del
entrenador en toda la UI (`web/lib/trainer.ts`) y `user_metadata` es solo
fallback. El callback hace upsert del perfil público con `ignoreDuplicates`:
un usuario nuevo de Google aparece en /trainers con su nombre y foto de Google,
pero un perfil ya personalizado jamás se pisa. El template branded del correo
de confirmación (`supabase/email-confirm-signup.html`) queda en el repo sin
aplicar: Supabase hosted exige SMTP custom para editar templates y no se
justifica para la evaluación.

## D15 — Resiliencia ante `tool_use_failed` de Groq + observabilidad (2026-08-10)
Bug real de producción: el chat fallaba ("Error consultando servicios externos")
solo en cuentas con historial largo. No era el historial — el replay exacto del
payload devolvía 200. Causa (capturada tras agregar el body del error del
provider al log de main.py; antes solo había un status 400 mudo): el modelo
llama de Groq a veces emite la llamada de herramienta con sintaxis cruda
malformada (`<function=...>`) y Groq rechaza la generación completa con
`tool_use_failed` — estocástico, y el historial largo sesga al modelo hacia ese
modo de fallo. Fix en `_chat_completion`: reintentar (suele bastar) y, si
persiste, repetir con `tool_choice: "none"` — ese turno degrada a texto en vez
de tirar 502 al usuario (el schema de tools se conserva porque el loop puede
traer ya mensajes `role: tool`). Stress test contra producción: 5/5 preguntas
gatillo respondidas, con 12 fallos internos absorbidos por el retry. Lección
registrada: nunca "resetear el historial" como remedio — el bug es del provider.

## Fuera de alcance (por tiempo, documentado a propósito)
- Tests e2e del frontend; se priorizaron evals de la capa de IA (mayor riesgo).
- Cache de PokéAPI en DB propia; el cache de fetch de Next.js cubre el caso.
