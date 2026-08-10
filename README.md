# PokéDex Manager

Aplicación full-stack para gestionar una colección personal de Pokémon, con capa de IA:
identificación de Pokémon por imagen (modelo multimodal) y un asistente conversacional
con tool calling sobre la colección del usuario.

**Demo en vivo:** https://209-50-54-47.sslip.io · **AI service:** https://api.209-50-54-47.sslip.io/docs

Instalable como **PWA** (Chrome/Edge: ícono de instalar en la barra de direcciones;
móvil: "Agregar a pantalla de inicio").

> **Cuenta demo** para probar la demo en vivo sin registrarse (la confirmación de
> email está activa a propósito, ver D8): `pokedex-qa-01@e2etest.dev` /
> `TestPass123!` — con equipo, avatar y medallero ya poblados.

![PokéDex Manager](docs/screenshot.jpg)

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend + app API | Next.js 16 (App Router, Server Components/Actions), TypeScript, Tailwind | Productividad y UI responsive con estado mínimo en el cliente |
| Auth + DB | Supabase (Auth + Postgres + **RLS**) | Auth production-grade sin construirla a mano; el aislamiento por usuario vive en la base de datos |
| Servicio de IA | Python 3.12 + FastAPI | Estándar del ecosistema de IA; Pydantic como contrato de salida |
| Datos Pokémon | [PokéAPI](https://pokeapi.co/) | Fuente de verdad externa; la DB solo guarda la relación usuario↔pokémon + snapshot |
| LLMs | Groq (qwen3.6 visión / llama-3.3 texto) → Gemini → Anthropic | Cadena con fallback; con una sola API key configurada funciona |

## Arquitectura

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
             │  Auth + Postgres│   │       │  │ Anthropic        │
             │  RLS por user   │   │       │  │ (fallback chain) │
             └─────────────────┘   └───────┘  └──────────────────┘
```

**Principios que gobiernan el diseño** (detalle en `docs/DECISIONS.md`):

1. **RLS es la seguridad, no el código de app.** Todo acceso a la colección viaja con el
   JWT del usuario. El ai-service *no tiene* service key a propósito: aunque tuviera un
   bug o el LLM pidiera algo indebido, Postgres impide tocar filas ajenas.
2. **El LLM nunca toca la DB ni decide datos críticos.** Propone herramientas; código
   determinista las ejecuta. Los errores de tools regresan al modelo, nunca se ocultan.
3. **Outputs del modelo siempre validados**: Pydantic + verificación anti-alucinación
   contra PokéAPI — si el modelo "identifica" un Pokémon que no existe, `found: false`.

## Correrlo localmente

Requisitos: Docker + un proyecto de Supabase (gratis) + una API key de Groq (gratis).

```bash
git clone <este-repo> && cd pokedex-manager

# 1. Supabase: crear proyecto nuevo → SQL Editor → pegar y correr supabase/schema.sql

# 2. Variables de entorno (ver tabla abajo)
cp web/.env.example web/.env.local        # llenar
cp ai-service/.env.example ai-service/.env # llenar

# 3. Todo junto
docker compose up --build
# web:      http://localhost:3000
# ai-service: http://localhost:8000 (Swagger en /docs)
```

Modo desarrollo sin Docker:

```bash
cd web && npm install && npm run dev                          # :3000
cd ai-service && pip install -r requirements.txt \
  && set -a && source .env && set +a \
  && uvicorn app.main:app --reload                            # :8000
python evals/run_evals.py                                     # evals (ai-service corriendo)
```

### Variables de entorno

| Archivo | Variable | Qué es |
|---|---|---|
| `web/.env.local` | `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key (pública por diseño; la seguridad es RLS) |
| | `NEXT_PUBLIC_AI_SERVICE_URL` | URL del ai-service que llama el navegador |
| `ai-service/.env` | `GROQ_API_KEY` | Con una basta; la cadena salta providers sin key |
| | `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` | Opcionales (fallback) |
| | `CORS_ORIGINS` | Orígenes permitidos, separados por coma |
| | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Mismo proyecto que la web |

> Nota: las `NEXT_PUBLIC_*` se inlinean en build time — `web/.env.local` debe existir
> **antes** de `docker compose build`.

> **Confirmación de email activa** (decisión D8): una cuenta nueva no puede iniciar
> sesión hasta confirmar el correo. Usar un correo real o alias `+tag@gmail.com`.

## Funcionalidades

**Core**
- Registro / login / logout (Supabase Auth, Server Actions, middleware de rutas
  protegidas) + **login con Google** (OAuth PKCE, callback propio; el perfil
  público se crea solo en el primer login — ver D14)
- `/pokedex` — lista paginada con búsqueda, tipos coloreados y banner del entrenador
  (pokébolas del equipo)
- `/pokedex/[name]` — detalle con sprite **animado**, grito (audio), barras de stats,
  **movimientos como botones** (tocar = tipo/poder/precisión/PP desde PokéAPI) y
  flechas anterior/siguiente
- `/collection` — perfil de entrenador (nombre + foto desde galería o cámara,
  **medallero** de 8 medallas por logros) y listado del equipo **estilo Game Boy**
  (sprites pixelados, barra de PS); soltar, editar nota; **solo tuya** (RLS)
- Capturar dispara **confetti** y te lleva a la ficha del Pokémon atrapado
- `/trainers` — comunidad: directorio público de entrenadores y perfil de cada uno
  (foto, medallero y equipo — las notas personales siguen privadas, ver D12)
- `/quien-es` — juego "¿Quién es ese Pokémon?" como en la serie (silueta + racha)
- **PWA instalable** con tab bar inferior tipo app en mobile (botón central = cámara)
  y banner de sugerencia de instalación
- Responsive mobile-first

**Bonus 1 — Identificación por imagen (LMM)**
- `/identify` — sube una foto o usa el **Modo Pokédex**: cámara del dispositivo con
  visor y obturador, como una Pokédex real → el modelo de visión identifica →
  verificación contra PokéAPI → capturar en un clic
- Parseo defensivo del output del modelo (fences markdown, bloques `<think>` de modelos
  razonadores, extracción de JSON balanceado)

**Bonus 2 — Servidor MCP (Model Context Protocol)**
- `ai-service/mcp_server.py` — servidor MCP sobre **stdio** (SDK oficial de Python)
  que conecta la colección a cualquier cliente MCP (Claude Desktop, Claude Code):
  las 3 herramientas del agente (`query_collection`, `search_pokeapi`, `add_pokemon`)
  más la colección completa como **resource** de solo lectura (`collection://mine`)
- Cero lógica duplicada: importa las mismas implementaciones deterministas del
  agente (`app/agent.py`) — la fuente de verdad de cada herramienta es una sola
- Misma postura de seguridad que todo el sistema: el servidor se autentica como un
  **usuario real** (login contra Supabase Auth, JWT cacheado con renovación) — RLS
  decide qué ve, sin service key
- Registro (ejemplo con Claude Code; Claude Desktop usa el mismo comando en su
  `claude_desktop_config.json`):
  ```bash
  claude mcp add pokedex \
    -e SUPABASE_URL=https://<proyecto>.supabase.co \
    -e SUPABASE_ANON_KEY=<anon-key> \
    -e POKEDEX_EMAIL=<email-de-tu-cuenta> -e POKEDEX_PASSWORD=<password> \
    -- <repo>/ai-service/.venv/bin/python <repo>/ai-service/mcp_server.py
  ```
- Distinción honesta: el agente de `/chat` usa function calling estilo OpenAI
  (loop a mano, ver D3); este servidor habla el **protocolo MCP** real. Son dos
  mecanismos distintos y el repo demuestra ambos (ver D13)

**Bonus 3 — Asistente con tool calling y análisis de la colección**
- `/chat` — agente conversacional con 3 herramientas: `query_collection`,
  `search_pokeapi`, `add_pokemon`. Loop de tool calling escrito a mano (~100 líneas,
  sin frameworks — ver D3), traza de tools visible en la UI, historial persistente
  (tabla `chat_messages` con RLS) y cards visuales de Pokémon dentro de la conversación
- Cubre (parcialmente) el análisis inteligente del bonus 3: responde preguntas
  analíticas sobre TU colección con datos reales ("¿cuál de los míos tiene más
  ataque?"), comparativas entre Pokémon y sugerencias — siempre vía tools, nunca
  inventando datos
- Las tools llaman a Supabase con el JWT del usuario → RLS aplica también dentro del agente

## QA

Todo lo anterior está verificado contra el deploy de producción con dos pases de
hard testing en browser real (21 checks el último: flujos completos de captura,
chat con tools, comunidad, juego, OAuth, RLS anónimo, MCP con cliente real) —
matriz completa y quirks conocidos en [`docs/QA-TESTING.md`](docs/QA-TESTING.md).

## Evals

Un agente sin evals es una demo. `evals/run_evals.py` corre 10 casos contra `/identify`
en 3 niveles de dificultad (artwork oficial, renders 3D, sprites pixelados de 96px) más
un control negativo. Resultado real (`evals/RESULTS.txt`):

```
PASS pikachu_artwork.png     esperado=pikachu     obtenido=pikachu     (conf=1.00)
PASS charizard_artwork.png   esperado=charizard   obtenido=charizard   (conf=1.00)
PASS bulbasaur_artwork.png   esperado=bulbasaur   obtenido=bulbasaur   (conf=1.00)
PASS gengar_artwork.png      esperado=gengar      obtenido=gengar      (conf=1.00)
PASS eevee_artwork.png       esperado=eevee       obtenido=eevee       (conf=1.00)
PASS squirtle_home.png       esperado=squirtle    obtenido=squirtle    (conf=1.00)
PASS snorlax_home.png        esperado=snorlax     obtenido=snorlax     (conf=1.00)
FAIL mewtwo_pixel.png        esperado=mewtwo      obtenido=meowth      (conf=0.95)
FAIL jigglypuff_pixel.png    esperado=jigglypuff  obtenido=clefairy    (conf=0.90)
PASS not_a_pokemon.png       esperado=None        obtenido=None        (conf=0.00)

8/10 casos correctos
```

**Limitación conocida y documentada a propósito:** sprites pixelados de 96px confunden
al modelo de visión (confidence alta y respuesta equivocada — el peor tipo de error).
Con imágenes normales (fotos, cartas, artwork) el desempeño es consistente. Mitigación
futura: upscaling previo o few-shot con ejemplos pixelados.

## Decisiones y trade-offs

Versión corta (completa en `docs/DECISIONS.md`, D1–D14):

- **Monorepo TS + Python** — cada lenguaje donde es más fuerte (D1)
- **Supabase con RLS** en vez de auth artesanal — la seguridad no depende de no
  equivocarse en cada endpoint (D2)
- **Tool calling a mano, sin LangChain** — para 3 herramientas, un framework agrega
  opacidad sin retorno; el loop explícito demuestra el mecanismo (D3)
- **Cadena de providers con fallback** — nunca un proveedor único; esta decisión se pagó
  sola cuando Groq retiró su modelo de visión a mitad del desarrollo (D4, D10)
- **Anti-alucinación**: el nombre que devuelve el modelo se verifica contra PokéAPI antes
  de aceptarse (D5)
- **ai-service sin service key** — un compromiso del servicio de IA no compromete datos
  de otros usuarios (D6)
- **Confirmación de email activa** — comportamiento production-grade sobre conveniencia
  de demo (D8)
- **Deploy en un VPS con el mismo docker-compose del repo** en vez de Vercel — evita
  partir la infra en dos y el problema de mixed content (frontend HTTPS llamando a un
  ai-service HTTP); el mismo `docker compose up` que corre el evaluador es el que corre
  producción. HTTPS con Caddy + sslip.io (certs automáticos de Let's Encrypt, sin
  comprar dominio) — ver `docker-compose.prod.yml` + `Caddyfile` (D11).
- **PWA instalable** — manifest + iconos generados de la pokébola SVG; requiere el
  HTTPS anterior (Chrome no ofrece instalación en contextos no seguros).
- **Capa social sin abrir la colección** — el directorio y los perfiles públicos de
  entrenadores exponen solo datos de exhibición vía funciones `security definer` con
  contrato mínimo; la tabla `collection` y las notas personales siguen tras RLS (D12).
- **Servidor MCP que reutiliza las tools del agente** — una sola implementación
  determinista por herramienta, dos mecanismos de exposición (function calling en
  `/chat`, protocolo MCP para clientes externos); autentica como usuario real,
  nunca con service key (D13).
- **`profiles` como identidad canónica del entrenador** — el login con Google
  sobreescribe `user_metadata` con la foto de Google en cada inicio de sesión,
  así que nombre/foto visibles salen siempre de `profiles` (app-owned) con
  metadata solo de fallback (D14).

## Estructura

```
web/                  Next.js — UI, auth, colección (Server Components/Actions)
ai-service/app/       FastAPI — main.py (/identify), agent.py (loop+tools), providers.py (cadena LLM)
ai-service/mcp_server.py  Servidor MCP stdio sobre la colección (bonus 2)
supabase/schema.sql   Tabla collection + políticas RLS (correr en SQL Editor)
evals/                Runner + imágenes + resultados
docs/                 ARCHITECTURE.md, DECISIONS.md (ADR-lite), PLAN.md, QA-TESTING.md
docker-compose.yml    Todo junto
```
