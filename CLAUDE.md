# CLAUDE.md — PokéDex Manager

Contexto para Claude Code. Leer completo antes de trabajar. Documentos hermanos:
- `docs/ARCHITECTURE.md` — diagrama y flujo de datos
- `docs/DECISIONS.md` — decisiones técnicas y sus porqués (alimenta el README final)
- `docs/PLAN.md` — fases con acceptance criteria y estado

## Qué es esto

Take-home de evaluación (deadline: **miércoles 12 ago, entrega antes de mediodía**) para
la posición AI Solutions Engineer en Febara Consulting. App full-stack: PokéDex con auth,
colección personal persistente, y capa de IA (identificación de Pokémon por imagen +
agente con tool calling). Evalúan: funcionalidad, calidad de código, UI responsive,
arquitectura, documentación y bonus de IA — **en ese orden. El core manda sobre los bonus.**

## Layout del monorepo

| Ruta | Qué es | Stack | Corre con |
|---|---|---|---|
| `web/` | Frontend + API de app | Next.js 14+ App Router, TS, Tailwind | `cd web && npm run dev` (:3000) |
| `ai-service/` | Microservicio de IA — **ya escrito, no reescribir** | Python 3.12, FastAPI | `cd ai-service && uvicorn app.main:app --reload` (:8000) |
| `supabase/schema.sql` | Schema + RLS (correr en SQL Editor del proyecto) | Postgres | — |
| `evals/` | Mini-evals de /identify | Python stdlib | `python evals/run_evals.py` |
| `docker-compose.yml` | Todo junto | — | `docker compose up` |

## Comandos

**ai-service** (ya escrito — instalar y correr para probar o extender):
```
cd ai-service && pip install -r requirements.txt
cd ai-service && uvicorn app.main:app --reload          # :8000
curl -F "file=@pikachu.jpg" localhost:8000/identify     # probar /identify directo
```

**evals** (requiere ai-service corriendo en :8000; llenar `evals/images/` y `CASES` primero):
```
python evals/run_evals.py
```

**web** (scaffolded con create-next-app, sin src/, App Router):
```
cd web && npm run dev       # :3000
cd web && npm run build
cd web && npm run lint
```

**todo junto:**
```
docker compose up
```

No hay suite de tests para web todavía (F1 apenas arrancando); no inventar comandos de
test que no existen — verificar `web/package.json` antes de asumir uno nuevo.

## ai-service — mapa de código

Ya escrito y verificado; leerlo antes de tocar el frontend que lo consume. Tres archivos:

- **`app/main.py`** — FastAPI, dos rutas: `POST /identify` (multipart, valida MIME/tamaño
  de imagen, llama `providers.vision_completion`, parsea el JSON del modelo de forma
  defensiva — quita fences ```json, si falla extrae el primer `{...}` balanceado — y es el
  único lugar que golpea PokéAPI para verificar el nombre devuelto antes de confiar en él)
  y `POST /agent` (exige `Authorization: Bearer <jwt>`, delega a `agent.run_agent`).
- **`app/providers.py`** — `VISION_CHAIN = [_groq_vision, _gemini_vision, _anthropic_vision]`;
  cada función normaliza su respuesta a `LLMResult(text, provider, model)` y lanza
  `ProviderError` si falta la API key o la llamada falla, lo que hace que
  `vision_completion` pase al siguiente provider. Agregar un provider = nueva función con
  esta firma + agregarla a `VISION_CHAIN` — pero ver regla #3 arriba, no hacerlo sin razón.
- **`app/agent.py`** — loop de tool calling a mano contra Groq (texto, no la cadena de
  visión). `TOOLS` declara el schema (formato OpenAI function-calling); `TOOL_IMPL` mapea
  nombre → función async `(user_jwt, args) -> Any`. Las tres tools
  (`query_collection`, `search_pokeapi`, `add_pokemon`) llaman a la REST API de Supabase
  con el JWT del usuario, nunca con service key. Un error de tool se serializa y se manda
  de vuelta al modelo como mensaje `role: tool` — nunca se oculta ni se asume éxito.
  `MAX_TURNS = 6` corta loops infinitos.

## Reglas de arquitectura (NO romper)

1. **RLS es la seguridad, no el código de app.** Todo acceso a `collection` viaja con el
   JWT del usuario (browser client de Supabase en web; header Authorization en ai-service).
   El ai-service **no tiene service key a propósito** — no agregar una "para que funcione".
2. **El LLM nunca toca la DB ni decide datos críticos.** Pide herramientas; el código
   determinista ejecuta. Los errores de tools REGRESAN al modelo, nunca se ocultan.
3. **Cadena de providers** (`ai-service/app/providers.py`): Groq → Gemini → Anthropic,
   interfaz normalizada, keys ausentes se saltan. No agregar providers nuevos.
4. **Outputs del modelo siempre validados**: Pydantic + verificación contra PokéAPI
   (anti-alucinación). Nunca confiar en texto suelto del modelo.
5. **PokéAPI es la fuente de verdad** de datos Pokémon; la DB solo guarda la relación
   usuario↔pokémon + snapshot (name/types/stats/sprite) para render rápido de la colección.

## Convenciones

- Commits atómicos en español o inglés consistente: `feat(auth): ...`, `feat(pokedex): ...`,
  `fix(collection): ...`, `docs: ...`. El historial de Git ES parte de la evaluación.
- TypeScript estricto; componentes server por default, client solo donde hay interacción.
- Sin librerías de estado global (el scope no lo amerita); estado local + server components.
- Estilo visual: limpio y responsive mobile-first. Usable > espectacular.
- Español en UI (el evaluador es mexicano); código y nombres en inglés.

## Env vars

Ver `web/.env.example` y `ai-service/.env.example`. NUNCA commitear `.env*` reales
(ya cubierto en .gitignore). Verificar antes de cada push: `git diff --cached --name-only`.

## Prohibido en este repo

- Service keys de Supabase en cualquier parte
- Datos o referencias de clientes de Gorilla Labs (este repo será revisado por terceros)
- Dependencias pesadas no justificadas (LangChain, ORMs — ver docs/DECISIONS.md)
- Trabajar features nuevas el miércoles (día de entrega: solo docs, video, envío)

## Estado actual

Actualizar esta sección al cerrar cada sesión de trabajo (esta es la memoria entre sesiones):

- [x] Scaffold: ai-service completo (providers/agent/main verificados), schema, compose, evals
- [x] Repo en GitHub (walfro90-gorilla/pokedex-manager), primer commit hecho
- [x] web/ scaffolded (create-next-app, TS+Tailwind+App Router+ESLint, lint y build OK)
- [x] Proyecto Supabase "pokedex" (zadorhfbhgkxczenkevf, org walfre.am@gmail.com) creado,
      schema.sql aplicado (tabla collection + RLS), sin advisories de seguridad
- [x] web/.env.local y ai-service/.env con URL+anon key reales (gitignored, no en repo)
- [x] F1 — auth: /login, /register, /logout (Server Actions) + proxy.ts protege /collection.
      Probado en browser end-to-end. Confirmación de email queda ACTIVA (ver D8 en
      docs/DECISIONS.md) — cuentas nuevas no loguean hasta confirmar correo.
- [x] F1 — /pokedex (lista+búsqueda+paginación sobre PokéAPI, cache 24h), /pokedex/[name]
      (detalle+captura), /collection (listar/soltar/editar nota vía RLS), nav global.
      Probado en browser end-to-end incl. RLS (sin filtro user_id manual — la política lo
      hace). Fix aplicado: badges de tipo eran invisibles en dark mode (texto heredado
      blanco sobre bg-gray-100), ya corregido con text-gray-800 explícito.
- [ ] F1 — falta: responsive pass verificado a 375px (el tool de resize de browser no
      funcionó en este entorno — WM ignora el resize; el grid/nav ya usan clases
      mobile-first pero falta confirmación visual real), deploy a Vercel (stretch, ver D9)
- [x] Revisión de alineación contra el brief oficial del cliente (D9 en DECISIONS.md):
      deploy bajado de AC bloqueante a stretch goal; bonus MCP (#2) reafirmado como
      protocolo específico, distinto del tool-calling ya implementado en agent.py
- [x] F2 — /identify (upload+preview+card+captura) y /chat (history+JWT+traza de tools)
      verificados en browser end-to-end contra el ai-service vivo. Fixes en ai-service
      forzados por deprecación de Groq (D10): default de visión a qwen/qwen3.6-27b,
      reasoning_effort=none, strip de <think> en el parser. Migración aplicada:
      user_id default auth.uid() (el tool add_pokemon del agente insertaba sin user_id).
- [x] F2 — evals: 10 casos en 3 dificultades, 8/10 (evals/RESULTS.txt). Fallan solo
      sprites pixelados de 96px (mewtwo→persian/meowth, jigglypuff→clefairy) —
      documentar como limitación conocida en README.
- [x] F3 — Deploy en UpCloud: server "pokedex" (209.50.54.47, Ubuntu 26.04, 2vCPU/4GB,
      root via SSH, key de esta laptop). Código en /opt/pokedex (rsync, sin git en server),
      docker compose build+up ahí mismo. web:3000 y ai-service:8000 públicos por IP.
      Verificado en browser contra el deploy: login, colección, chat con tools. Los .env
      del server tienen NEXT_PUBLIC_AI_SERVICE_URL y CORS_ORIGINS apuntando a la IP.
      Redeploy = rsync + docker compose build + up -d en el server.
- [ ] PENDIENTE deploy: Site URL de Supabase Auth sigue en localhost:3000 — los correos
      de confirmación de cuentas nuevas apuntan mal. Cambiar en dashboard: Authentication
      → URL Configuration → Site URL = http://209.50.54.47:3000 (acción manual del usuario;
      el MCP de Supabase quedó conectado a otro proyecto).
- [ ] F4 — README final + video + entrega a cfernandez@febara.com.mx
- NOTA sesión: ai-service NO carga .env solo — arrancar con `set -a; source .env; set +a`
  antes de uvicorn (o usar docker compose que sí usa env_file). GROQ_API_KEY real ya
  está en ai-service/.env (gitignored).
