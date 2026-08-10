# Plan por fases con acceptance criteria

> Alineado contra el brief oficial del cliente (evaluación recibida, ver D9 en
> DECISIONS.md). Requisito explícito del brief: **"No es necesario que la aplicación
> esté desplegada en producción"** — deploy queda como stretch goal, no como AC
> bloqueante de ninguna fase. Se mantiene en el plan si el tiempo alcanza porque
> reduce fricción de evaluación, pero nunca a costa de core/bonus documentados.

## F1 — Core web (lunes) — CASI LISTO
**AC:** un usuario nuevo puede registrarse, loguearse, navegar la pokédex paginada
con búsqueda, ver detalle con stats/tipos, capturar/soltar pokémon con nota, y su
colección persiste y es SOLO suya (verificar con 2 cuentas). Responsive en 375px.
Deploy en Vercel es stretch, no bloqueante.

Tareas: setup Supabase clients (browser/server) ✅ → páginas auth + middleware ✅ →
/pokedex lista+búsqueda ✅ → /pokedex/[name] detalle ✅ → /collection CRUD ✅ →
responsive pass (⚠️ pendiente confirmar visualmente a 375px — implementado
mobile-first pero sin verificación real en browser, ver Estado actual en CLAUDE.md)
→ (stretch) deploy.

## F2 — IA en frontend (martes) — CASI LISTO (adelantado)
**AC:** subir una foto de un Pokémon lo identifica y permite agregarlo en 2 clics;
el chat responde preguntas sobre MI colección usando tools (verificable en la traza);
evals corren con ≥10 imágenes y el resultado queda en el README. Deploy del
ai-service es stretch, no bloqueante.

Tareas: componente upload+preview ✅ → integrar /identify ✅ → card de resultado con
CTA ✅ → chat UI con history en estado ✅ → integrar /agent con JWT de sesión ✅ →
llenar evals/images + CASES ✅ → correr evals ✅ (8/10, RESULTS.txt; fallan solo
sprites pixelados 96px — documentar en README) → (stretch) deploy ai-service →
CORS/env de prod (CORS ya configurable vía CORS_ORIGINS).

Todo verificado en browser real: upload→identifica pikachu (100% groq)→captura
autenticada; chat responde con datos reales de la colección + traza de tools.

## F3+F4 — Entrega (miércoles) — TODO
**AC:** un evaluador clona el repo, sigue el README y lo levanta con docker compose
sin ayuda; README con arquitectura, decisiones y evals; video Loom ≤5 min; correo
enviado a cfernandez@febara.com.mx antes de mediodía con repo + video (+ deploy si
se completó como stretch).

REGLA: el miércoles NO se construye. Solo documentación, verificación y envío.
