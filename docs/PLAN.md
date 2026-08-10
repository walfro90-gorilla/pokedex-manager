# Plan por fases con acceptance criteria

## F1 — Core web (lunes) — TODO
**AC:** un usuario nuevo puede registrarse, loguearse, navegar la pokédex paginada
con búsqueda, ver detalle con stats/tipos, capturar/soltar pokémon con nota, y su
colección persiste y es SOLO suya (verificar con 2 cuentas). Responsive en 375px.
Deploy en Vercel funcionando al cierre del día.

Tareas: setup Supabase clients (browser/server) → páginas auth + middleware →
/pokedex lista+búsqueda → /pokedex/[name] detalle → /collection CRUD → responsive
pass → deploy.

## F2 — IA en frontend (martes) — TODO
**AC:** subir una foto de un Pokémon lo identifica y permite agregarlo en 2 clics;
el chat responde preguntas sobre MI colección usando tools (verificable en la traza);
evals corren con ≥10 imágenes y el resultado queda en el README; ai-service deployado
y conectado al frontend de producción.

Tareas: componente upload+preview → integrar /identify → card de resultado con CTA →
chat UI con history en estado → integrar /agent con JWT de sesión → llenar
evals/images + CASES → correr evals → deploy ai-service → CORS/env de prod.

## F3+F4 — Entrega (miércoles) — TODO
**AC:** un evaluador clona el repo, sigue el README y lo levanta con docker compose
sin ayuda; README con arquitectura, decisiones y evals; video Loom ≤5 min; correo
enviado a cfernandez@febara.com.mx antes de mediodía con repo + deploy + video.

REGLA: el miércoles NO se construye. Solo documentación, verificación y envío.
