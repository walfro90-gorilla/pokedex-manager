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
- [x] Site URL de Supabase Auth corregido a http://209.50.54.47:3000 (dashboard, manual).
      Verificado: correo de confirmación nuevo redirige a la IP del server.
- [x] RLS verificado con 2 cuentas (AC de F1): QA2 no ve filas de QA1; insert con
      user_id ajeno (spoof) rechazado 403 por policy; insert propio vía default
      auth.uid() OK; anon sin JWT ve []. Cuentas: pokedex-qa-01@e2etest.dev y
      walfre.am+pokedexqa2@gmail.com (confirmada por correo real).
- [x] F4 (parcial) — README.md final escrito (arquitectura, setup, env vars, evals 8/10,
      D1-D10 condensadas, bonus con distinción honesta MCP vs tool-calling, screenshot
      del deploy en docs/screenshot.jpg)
- [x] Rediseño UI con branding Pokémon: paleta Pokédex + Rubik + Press Start 2P +
      colores de los 18 tipos (lib/pokemon-theme.ts) + pokébola SVG. Chat visual con
      cards de pokémon (datos de tools del agente) y memoria persistente en DB
      (tabla chat_messages + RLS, migración chat_messages_history aplicada).
      Verificado local y redeploy a UpCloud con el rediseño vivo.
- [x] Responsive 375px verificado por el usuario (ojos reales, devtools móvil)
- [x] PWA instalable (D11): manifest + iconos pokébola + HTTPS en el deploy vía Caddy +
      sslip.io (docker-compose.prod.yml overlay). URLs nuevas de producción:
      https://209-50-54-47.sslip.io (web) y https://api.209-50-54-47.sslip.io (ai).
      Los puertos HTTP :3000/:8000 siguen abiertos como fallback.
- [x] Nav mobile con hamburger (details/summary, sin JS de cliente) + banner de
      instalación PWA (beforeinstallprompt + hint iOS + dismiss en localStorage).
      Verificado en el deploy https.
- [ ] PENDIENTE: Site URL de Supabase → https://209-50-54-47.sslip.io (dashboard manual,
      hoy apunta a http://209.50.54.47:3000 — los correos de confirmación siguen
      funcionando pero aterrizan en la versión http)
- NOTA dev: NO correr `npm run build` con `next dev` activo — comparten .next/ y el
  build mata al dev server silenciosamente. Bajar dev, build, relanzar.
- [x] Validación de clone limpio (AC de entrega): clone fresco de GitHub → pasos del
      README (cp .env.example + llenar) → docker compose up --build en el server con
      puertos alternos → web 200, /health OK, /identify identifica correcto. El flujo
      del evaluador funciona tal como está documentado.
- [x] Polish final: skeletons (pokedex+detalle), error.tsx global, not-found.tsx
      branded, favicon pokébola. Desplegado. Nota: 404 en rutas con loading.tsx
      responde HTTP 200 por streaming — usuario ve la página 404 correcta.
- [x] Modo Pokédex en /identify: cámara del dispositivo (getUserMedia trasera) con
      visor + obturador → frame a canvas → JPEG → mismo /identify. Requiere HTTPS
      (ya cubierto). Deliberado: un tap = un escaneo, NO detección continua (cada
      frame = llamada al LLM de visión). Desplegado; falta prueba real en teléfono
      del usuario (el permiso de cámara es diálogo nativo, no automatizable).
- [x] Lote grande de features (2026-08-10, madrugada): tab bar inferior tipo app con
      botón central de cámara; sonidos (cries) + sprites animados + movimientos como
      botones con detalle (fetch a /move) + flechas prev/next en el detalle; confetti
      al capturar + redirect a la ficha (?captured=1); perfil de entrenador en
      /collection (nombre en user_metadata, foto a Storage bucket avatars con RLS por
      carpeta, galería o cámara) + medallero de 8 medallas derivado de la colección;
      listado del equipo estilo Game Boy; comunidad /trainers (tabla profiles pública
      + funciones security definer trainer_directory/trainer_pokemons — collection
      NUNCA se abrió, notas privadas, ver D12) + perfil público /trainers/[id];
      juego /quien-es; banner de entrenador con pokébolas en /pokedex. Migraciones
      aplicadas: chat_messages_history, avatars_storage_bucket,
      trainer_profiles_directory, trainer_public_profile. Cuenta demo "Gary"
      (walfre.am+gary@gmail.com / GaryOak151!) con 3 pokémon.
- [x] HARD TESTING completo contra producción https: 12 flujos verificados en browser
      real (detalle con sprite animado/grito/movimientos, captura→confetti→redirect,
      colección GB + medallero 6/8 correcto, avatar upload a Storage + write-through,
      directorio con 3 entrenadores, perfil público de Gary con medallero 4/8, juego
      con racha, chat persistente CROSS-DEVICE, banner con pokébolas, flechas,
      login/redirects). Quirk de testing: forms de Server Actions no disparan con
      click/Enter simulados del MCP de Chrome — usar form.requestSubmit() vía
      javascript_tool.
- [x] Bonus 2 MCP (2026-08-10) — ai-service/mcp_server.py: servidor MCP stdio con
      FastMCP (SDK oficial, dep nueva mcp==1.* en requirements). Reutiliza TOOL_IMPL
      de agent.py (cero duplicación); autentica como usuario real (login password
      contra Supabase Auth, JWT cacheado, sin service key — RLS intacto); expone
      3 tools + resource collection://mine. Smoke test verde con cliente MCP real
      contra Supabase vivo (tools, resource, add+cleanup en cuenta QA). README
      (sección Bonus 2 reescrita: ya NO dice "no implementado"), D13 en DECISIONS,
      bullet en trade-offs. Los 3 bonus del brief ahora cubiertos.
- [x] Chips bonus 3 en /chat (recomendaciones/comparativas/curiosidades/análisis)
      + cuenta demo QA1 en README (pokedex-qa-01@e2etest.dev — evaluador entra sin
      confirmar email). Redeploy a UpCloud y verificado en prod: chip de
      recomendación end-to-end (query_collection con cards del equipo real +
      recomendación razonada de Gengar). Nota: chips solo en chat vacío — QA1
      tenía historial, hubo que borrarlo para verlos.
- [x] Site URL a https verificado (correo real trae redirect_to=https://209-50-54-47
      .sslip.io); cuentas de prueba de verificación borradas de auth.users.
- [x] Google OAuth end-to-end: botón "Continuar con Google" en /login y /register
      (Server Action + /auth/callback PKCE). Fixes reales: (1) detrás de Caddy,
      request.url trae host interno — el callback usa x-forwarded-host/proto;
      (2) Google VINCULA por email verificado y sobreescribe
      user_metadata.avatar_url con la foto de Google en cada login → profiles es
      ahora la fuente canónica de nombre/avatar (lib/trainer.ts, banner y
      colección la usan; metadata solo fallback) y el callback hace upsert de
      profiles con ignoreDuplicates (primer login Google = aparece en /trainers).
      Verificado en prod: banner, colección y directorio muestran el MISMO avatar.
      Nota: Google no acepta clicks simulados en su consent (el usuario clickeó).
- [ ] Template de email branded (supabase/email-confirm-signup.html) queda en el
      repo pero NO aplicado: Supabase hosted exige SMTP custom para editar
      templates — decisión del usuario no activarlo. Documentado, no bloquea.
- [ ] F4 — falta: video Loom ≤5 min, borrar SIGUIENTE-PASOS.md, correo a
      cfernandez@febara.com.mx antes del miércoles mediodía, repo público o
      invitar al evaluador (hoy es PRIVADO)
- NOTA sesión: ai-service NO carga .env solo — arrancar con `set -a; source .env; set +a`
  antes de uvicorn (o usar docker compose que sí usa env_file). GROQ_API_KEY real ya
  está en ai-service/.env (gitignored).
