# Siguientes pasos (borrar este archivo antes de entregar)

## Esta noche (10 min)
1. `npx create-next-app@latest web --typescript --tailwind --app --eslint` (dentro del repo; di NO a src/ para mantenerlo simple, o sí si prefieres — consistencia es lo que importa)
2. Proyecto Supabase NUEVO → SQL Editor → pegar `supabase/schema.sql` → correr
3. Copiar `.env.example` → `.env` / `.env.local` con tus keys reales
4. `git init && git add . && git commit -m "chore: scaffold monorepo (web + ai-service + evals)"` → crear repo en GitHub → push

## Lunes — Core (todo en /web)
- [ ] Supabase Auth: páginas /login y /register, cliente browser + server, middleware de rutas protegidas
- [ ] /pokedex: lista paginada de PokéAPI (server components + fetch cacheado), búsqueda por nombre
- [ ] /pokedex/[name]: detalle con stats, tipos, sprite oficial
- [ ] /collection: mis Pokémon (query a Supabase con el cliente del usuario → RLS), capturar desde el detalle, soltar, editar nota
- [ ] Responsive pass con Tailwind (mobile-first)
- [ ] Deploy a Vercel al final del día
- Commits atómicos: `feat(auth): ...`, `feat(pokedex): ...`, `feat(collection): ...`

## Martes — IA (el ai-service ya está escrito)
- [ ] Levantar: `cd ai-service && cp .env.example .env` (llenar) `&& pip install -r requirements.txt && uvicorn app.main:app --reload`
- [ ] Probar /identify con curl y una imagen real ANTES de tocar frontend:
      `curl -F "file=@pikachu.jpg" localhost:8000/identify`
- [ ] LEER providers.py, agent.py y main.py línea por línea — este código lo defiendes tú
- [ ] Frontend: componente de upload con preview → llama /identify → muestra card del Pokémon identificado → botón "Agregar a mi colección"
- [ ] Frontend: chat del asistente → llama /agent con el JWT de la sesión de Supabase (supabase.auth.getSession() → access_token) y mantiene history en estado
- [ ] Llenar evals/images/ con ~10 imágenes + completar CASES en run_evals.py → correr → guardar output para el README
- [ ] Deploy del ai-service (Cloud Run o Railway) + actualizar NEXT_PUBLIC_AI_SERVICE_URL en Vercel + CORS

## Miércoles — Entrega (nada nuevo)
- [ ] README.md final: qué es, screenshot, diagrama de arquitectura, decisiones y trade-offs (honestidad = criterio explícito), instrucciones `docker compose up` + tabla de env vars, sección bonus documentada, resultados de evals pegados
- [ ] Clone limpio en carpeta nueva → seguir el README al pie de la letra → debe correr
- [ ] Video Loom 4 min: demo (2) + arquitectura (2)
- [ ] Borrar ESTE archivo
- [ ] Correo a cfernandez@febara.com.mx con: link repo + link deploy + link video — ANTES de mediodía

## Notas técnicas que ya quedaron resueltas en el código
- Cadena de visión Groq→Gemini→Anthropic con skip de keys ausentes (providers.py)
- Loop de tool calling a mano, errores de tools regresan al modelo (agent.py)
- Validación Pydantic del output + verificación anti-alucinación contra PokéAPI (main.py /identify)
- El ai-service usa el JWT del usuario → RLS aplica también en el agente (sin service key a propósito)
- Parseo defensivo del JSON del modelo (fences + extracción balanceada)
