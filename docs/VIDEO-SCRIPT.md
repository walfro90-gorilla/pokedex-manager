# Guion del video de entrega — PokéDex Manager (Loom ≤ 5 min)

> Objetivo: 3:30–4:30. Límite duro: 5:00. Si una escena sale mal, corta y
> repite SOLO esa (Loom permite recortar) — no regrabes todo. Narrar en
> español, ritmo tranquilo. El orden sigue los criterios del brief:
> funcionalidad → UI → arquitectura → bonus (cierra con el MCP, lo más raro
> de ver en un take-home).

## Pre-flight (antes de grabar)

- [ ] Producción viva: https://209-50-54-47.sslip.io y
      https://api.209-50-54-47.sslip.io/health responde ok
- [ ] Cuenta demo (`pokedex-qa-01@e2etest.dev` / `TestPass123!`) **en cero** —
      el video muestra el viaje desde cero Y la deja poblada para el evaluador,
      como promete el README
- [ ] Ventana de **incógnito** con SONIDO permitido: así aparece el tour de
      bienvenida y se escucha el grito al capturar
- [ ] Pestañas en orden: (1) /login del deploy, (2) /collection (para el
      momento MCP), (3) repo en GitHub con el README
- [ ] Terminal con **Claude Code** abierto en el repo (server MCP `pokedex` ya
      registrado — verificar con `claude mcp list`)
- [ ] `evals/images/bulbasaur_artwork.png` a la mano para /identify
- [ ] Notificaciones apagadas, Loom a 720p+, micrófono probado

## Escenas

### 1. Hook + tour (0:00–0:25)
**Pantalla:** /login del deploy.
**Haces:** señala el botón "Continuar con Google" (no lo uses), entra con la
cuenta demo. Aparece el tour: pasa 2 pasos, "Saltar".
**Dices:** "PokéDex Manager: full-stack con Next.js, Supabase con Row Level
Security y un microservicio de IA en Python, desplegada con HTTPS e instalable
como PWA. Hay login con correo y con Google, toda la app requiere sesión, y al
primer ingreso un tour de 9 pasos te presenta cada función."

### 2. Pokédex viva (0:25–0:55)
**Haces:** en el buscador teclea "meow" → aparece el dropdown con sprites en
tiempo real. Antes de abrir, click en GEN IV (2 seg, muestra turtwig y cía),
regresa a TODAS. Señala el contador "0 / 1351 capturados". Abre **meowth**
desde el dropdown.
**Dices:** "Búsqueda en tiempo real sobre más de mil trescientos Pokémon,
filtro por generación calculado por rangos de id — cero llamadas extra — y un
contador de progreso de captura."

### 3. Ficha + captura (0:55–1:30)
**Haces:** en la ficha de meowth: sprite animado, badge GEN I, click en un
movimiento (se expande con tipo/poder/precisión/PP), señala las flechas
◀ ▶. Click **¡Capturar!** → suena el grito → confetti + brinco del sprite +
toast "¡GOTCHA!". Click "Ver en mi colección" → tarjeta de entrenador,
medallero (cae la primera medalla), equipo estilo Game Boy.
**Dices:** "Ficha viva: sprite animado, movimientos con datos en vivo de
PokéAPI. Y al capturar: su grito, confetti y directo a mi colección — que
persiste en Postgres, aislada por usuario con RLS. La seguridad vive en la
base de datos, no en el código."

### 4. Bonus 1 — Identificar por imagen (1:30–2:00)
**Haces:** /identify → sube `bulbasaur_artwork.png` → identifica → capturar
en un click. (Si tienes webcam: 5 seg del Modo Pokédex con el visor.)
**Dices:** "Identificación con un modelo de visión multimodal — y el nombre
que devuelve se verifica contra PokéAPI antes de aceptarse: anti-alucinación.
Está medido con evals: ocho de diez, con las fallas documentadas en el README."

### 5. Bonus 3 — Asistente (2:00–2:30)
**Haces:** /chat (pantalla completa) → click al chip contextual "¿Qué Pokémon
complementaría a Meowth en mi equipo?" → responde con análisis + cards.
**Dices:** "Agente conversacional con tool calling escrito a mano, sin
frameworks. Los chips se generan de MI equipo real, el historial persiste en
la base, y nunca inventa datos: cada respuesta sale de sus herramientas."

### 6. Bonus 2 — MCP, el cierre fuerte (2:30–3:15)
**Pantalla:** dividida — Claude Code izquierda, /collection derecha.
**Haces:** en Claude Code escribe **"agrega a eevee a mi colección"** → el
server MCP ejecuta add_pokemon → refresca /collection → eevee aparece en el
equipo.
**Dices:** "Y esto es un servidor MCP real — el protocolo, no solo function
calling: seis herramientas, la colección como resource, y prompts que Claude
expone como slash commands. Reutiliza las mismas implementaciones del agente y
se autentica como un usuario normal: RLS aplica igual que en la web. Lo que
Claude captura aquí… aparece allá."

### 7. Comunidad + cierre (3:15–3:45)
**Haces:** /trainers (directorio, perfil público de Gary con su medallero,
3 seg) → /quien-es (una silueta, 3 seg) → pestaña del README en GitHub
(scroll rápido por decisiones y QA).
**Dices:** "Hay también comunidad de entrenadores con perfiles públicos — sin
exponer jamás la tabla de colecciones — y el juego de la serie. Todo el
razonamiento está documentado: dieciséis decisiones técnicas con sus
trade-offs, matriz de QA contra producción y evals. Gracias por la revisión."

## Post-grabación

- [ ] La cuenta demo quedó poblada por el video mismo (meowth + bulbasaur +
      eevee, medallero iniciado) — cumple lo que el README promete ✓
- [ ] Subir a Loom → pegar el link en el borrador de Gmail (ya existe, a
      cfernandez@febara.com.mx) y enviarlo antes del miércoles mediodía
- [ ] Opcional: link del video también en el README (una línea junto a la
      demo en vivo)
