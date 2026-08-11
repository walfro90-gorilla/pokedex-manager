# Guion del video de entrega — PokéDex Manager (Loom ≤ 5 min)

> Objetivo: 4:00–4:30. Límite duro: 5:00. Una sola toma si sale bien; si te
> trabas, sigue — el evaluador valora ver el producto corriendo, no la perfección.
> Narrar en español, ritmo tranquilo. El orden sigue los criterios de evaluación
> del brief: funcionalidad → código/UI → arquitectura → bonus.

## Pre-flight (antes de grabar)

- [x] Producción viva: https://209-50-54-47.sslip.io (web) y
      https://api.209-50-54-47.sslip.io/health — verificado 2026-08-11
- [x] Cuenta demo en cero: colección y chat de `pokedex-qa-01@e2etest.dev`
      vacíos (el video muestra el viaje desde cero y la deja poblada para el
      evaluador, como anuncia el README)
- [ ] Ventana de **incógnito** (o localStorage limpio): así aparece el tour de
      bienvenida al primer login y el banner de instalación PWA
- [ ] Pestañas abiertas en orden: (1) /login del deploy, (2) repo en GitHub
      con el README, (3) Swagger https://api.209-50-54-47.sslip.io/docs,
      (4) Claude Code/Desktop con el servidor MCP `pokedex` registrado
- [ ] Una imagen Pokémon a la mano para /identify (carta física al teléfono o
      un JPG de artwork en el escritorio)
- [ ] Notificaciones del sistema apagadas, Loom a 720p+, micrófono probado

## Escenas

### 1. Hook (0:00–0:15)
**Pantalla:** /login del deploy.
**Dices:** "Esta es PokéDex Manager, mi entrega para la evaluación: una app
full-stack — Next.js, Supabase con RLS y un microservicio de IA en Python —
desplegada y funcionando en esta URL, e instalable como PWA. Les muestro lo que
hace y luego las decisiones de arquitectura."

### 2. Auth + tour (0:15–0:40)
**Haces:** login con la cuenta demo (`pokedex-qa-01@e2etest.dev`). Sale el tour
de bienvenida; pasa 2–3 pasos rápido y ciérralo.
**Dices:** "El registro pide confirmar el correo — lo dejé activo a propósito,
es el comportamiento production-grade; está documentado en el README. El tour
guía a usuarios nuevos por las nueve funciones."

### 3. Pokédex + captura (0:40–1:25)
**Haces:** en /pokedex busca "pika" → abre a Pikachu (se oye el grito, sprite
animado) → toca un movimiento para ver su detalle → **Capturar** → confetti y
redirect a la ficha → ve a "Mi colección": perfil de entrenador, medallero y
equipo estilo Game Boy.
**Dices:** "La pokédex corre sobre PokéAPI, que es la fuente de verdad; con
búsqueda, paginación y detalle completo. Capturar guarda un snapshot en mi
colección — y la colección es solo mía: el aislamiento lo hace Postgres con
Row Level Security, no el código de la aplicación."

### 4. Bonus 1 — Identificación por imagen (1:25–2:10)
**Haces:** /identify → sube la imagen preparada (o usa el Modo Pokédex con la
cámara si grabas también el teléfono) → la IA identifica → **¡Capturar!**.
**Dices:** "El bonus de visión: la foto va a un microservicio FastAPI con una
cadena de providers — Groq, Gemini, Anthropic, con fallback. El modelo propone
un nombre y el servicio lo verifica contra PokéAPI antes de confiar: si alucina,
se rechaza. Corrí evals sobre 10 imágenes: 8/10 — las dos que fallan son
sprites de 96 pixeles, y esa limitación quedó documentada en el README."

### 5. Bonus 3 — Chat con tool calling (2:10–2:55)
**Haces:** /chat → chip o pregunta "¿Qué Pokémon tengo?" → se ven las cards de
tu equipo real → sigue con "¿Qué Pokémon me recomiendas agregar según mi
equipo?". Muestra que la respuesta usa datos reales.
**Dices:** "El asistente es un loop de tool calling escrito a mano, sin
frameworks: el modelo pide herramientas y código determinista las ejecuta.
Las herramientas llaman a Supabase con MI token de usuario — la RLS aplica
también dentro del agente, y el servicio de IA no tiene service key. El
historial persiste entre dispositivos."

### 6. Comunidad + juego + PWA (2:55–3:20) — montaje rápido
**Haces:** /trainers (directorio con medalleros) → perfil de un entrenador →
/quien-es (una ronda) → si estás en incógnito desktop, muestra el ícono de
instalar PWA.
**Dices:** "Capa social sin abrir los datos: el directorio sale de funciones
security definer con contrato mínimo — la colección y las notas privadas jamás
se exponen. Y la app es instalable: HTTPS con Caddy y certificados automáticos
sobre el mismo VPS."

### 7. Bonus 2 — Servidor MCP (3:20–3:50)
**Pantalla:** Claude Code/Desktop. Pide: "¿qué pokémon tengo en mi colección?"
→ el cliente llama `query_collection` del servidor MCP `pokedex`.
**Dices:** "El segundo bonus pedía MCP específicamente: escribí un servidor MCP
stdio con el SDK oficial, que reutiliza las mismas implementaciones de las
herramientas del agente — cero duplicación — y se autentica como un usuario
real, con RLS. El chat usa function calling; esto es el protocolo MCP real. El
repo demuestra ambos."

### 8. Arquitectura + cierre (3:50–4:30)
**Pantalla:** README en GitHub (diagrama de arquitectura) → scroll a
Decisiones → sección "Correrlo localmente".
**Dices:** "Todo lo que vieron corre con el mismo docker compose que está en el
repo: clonar, llenar dos archivos de entorno, `docker compose up`. Las
decisiones clave están en el README y en docs/DECISIONS.md: RLS como seguridad
real, cadena de providers con fallback — que se pagó sola cuando Groq retiró su
modelo de visión a mitad del desarrollo — y validación anti-alucinación en
toda salida del modelo. Gracias por ver; los links están en el correo."

## Post-grabación

- [ ] Pegar el link de Loom en el borrador de Gmail (texto listo abajo)
- [ ] Verificar que la cuenta demo quedó con los pokémon capturados en el video
      (el README promete "equipo, avatar y medallero ya poblados" — si falta
      avatar/nombre, ponérselos rápido desde /collection)
- [ ] Enviar a **cfernandez@febara.com.mx** antes del miércoles mediodía
- [ ] Actualizar "Estado actual" en CLAUDE.md
