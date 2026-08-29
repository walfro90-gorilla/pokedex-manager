# QA — Hard testing contra producción

> **Registro histórico (agosto 2026):** este pase se corrió contra el deploy de
> producción, que se dio de baja tras la entrega (D17). Las URLs de abajo ya no
> responden; el documento se conserva como evidencia de lo que se probó y cómo.

Método: pruebas manuales automatizadas en browser real (Chrome) contra el deploy
de producción `https://209-50-54-47.sslip.io`, más batería HTTP (curl) y un
cliente MCP real para el servidor del bonus 2. Cuenta de prueba: la cuenta demo
del README (`pokedex-qa-01@e2etest.dev`). El estado de datos se restaura al
final de cada prueba destructiva (capturar → soltar; filas de prueba borradas).

## Pase 2 — 2026-08-10 (todo verde, 21 checks)

**Batería HTTP / servicios**

| # | Check | Resultado |
|---|---|---|
| 1 | Páginas 200: /pokedex /login /register /trainers /quien-es /identify | ✅ 6/6 |
| 2 | 404 branded ("¡Este Pokémon huyó!") en ruta inexistente | ✅ |
| 3 | `manifest.webmanifest` 200 (PWA) | ✅ |
| 4 | ai-service `/health` → `{"status":"ok"}` | ✅ |
| 5 | `/identify` real con eevee_artwork.png → `found: true`, conf 1.0 | ✅ |
| 6 | RLS: REST anónimo sin JWT a `collection` → `[]` | ✅ |
| 7 | `/auth/callback` sin code → redirect a /login con error, origen público correcto (fix x-forwarded) | ✅ |
| 8 | Servidor MCP (cliente real): initialize, 3 tools, resource `collection://mine`, add+cleanup | ✅ |

**Flujos en browser (sesión demo)**

| # | Flujo | Resultado |
|---|---|---|
| 9 | Login con password → /pokedex con banner del entrenador | ✅ |
| 10 | Botón "Continuar con Google" visible en /login | ✅ |
| 11 | Detalle (pikachu): sprite animado, chip de grito, flechas #0024/#0026 | ✅ |
| 12 | Movimiento expandible: Thunder Shock → ELECTRIC · Poder 40 · Precisión 100 · PP 30 · Especial | ✅ |
| 13 | Captura (meowth) → redirect `?captured=1` + confetti visible | ✅ |
| 14 | Colección Game Boy: nuevo aparece (8), SOLTAR lo quita (7) | ✅ |
| 15 | Avatar de colección = archivo de `profiles` (fuente canónica) | ✅ |
| 16 | Chat: historial restaurado tras reload completo | ✅ |
| 17 | Chat: comparativa E2E ("mis dos más fuertes" → análisis con datos reales + cards) | ✅ |
| 18 | Directorio /trainers: 3 entrenadores; perfil público de Gary: medallero 4/8, equipo 3, notas privadas | ✅ |
| 19 | ¿Quién es?: silueta, 4 opciones, feedback al responder | ✅ |
| 20 | Botón Google en /register | ✅ |
| 21 | Logout → /collection redirige a /login | ✅ |

## Pase 1 — 2026-08-10 (features del lote grande, 12 flujos, todo verde)

Detalle con sprite animado/grito/movimientos; captura→confetti→redirect;
colección GB + medallero 6/8 computado correcto; subida de avatar a Storage con
write-through; directorio con 3 entrenadores; perfil público (medallero 4/8);
juego con racha; **persistencia de chat cross-device** (mismo historial desde
otra sesión); banner del entrenador con pokébolas; flechas prev/next;
login/redirects; 404 + manifest.

## Verificaciones puntuales adicionales

- **RLS con 2 cuentas** (2026-08-10): aislamiento de lectura en ambos sentidos;
  insert con `user_id` ajeno (spoof) → 403/42501; insert propio vía
  `default auth.uid()` → 201; anónimo → `[]`.
- **Google OAuth E2E** (2026-08-10): login vincula por email verificado a la
  cuenta existente; sesión correcta post-callback; avatar consistente en
  banner/colección/directorio tras el fix de identidad canónica en `profiles`.
- **Evals de /identify**: 8/10 (ver `evals/RESULTS.txt` y README).
- **Clone limpio**: repo fresco + pasos del README + `docker compose up --build`
  → web 200, health OK, identify correcto.

## Incidente de producción: cazado, arreglado y verificado (2026-08-10)

El chat fallaba con 502 **solo en cuentas con historial largo**. Diagnóstico:
se agregó el body del error del provider a los logs (antes solo un 400 mudo) y
apareció la causa — `tool_use_failed` de Groq: el modelo emite a veces sintaxis
de herramienta malformada y Groq rechaza la generación completa (estocástico;
el replay exacto del payload devolvía 200). Fix: retry + degradación a
`tool_choice: "none"` (ver D15). **Verificación**: 5/5 preguntas gatillo contra
producción respondidas, con 12 fallos internos absorbidos según los logs.

## Pase MCP — ciclo de vida completo (2026-08-11, cliente MCP real)

initialize → list_tools (6) → list_resources → list_prompts (2, con argumento) →
`search_pokeapi` → `add_pokemon` → `update_note` → `trainer_directory` →
`remove_pokemon` → el resource `collection://mine` confirma la ausencia.
Todo contra el Supabase vivo con JWT de la cuenta demo (RLS activo). Verde.

## Quirks conocidos (de testing, no bugs de producto)

- Los forms de Server Actions no disparan con click/Enter simulados del
  automatizador — requieren `form.requestSubmit()`.
- La pantalla de consentimiento de Google rechaza clicks simulados (anti-bot);
  ese paso se hace a mano.
- Los chips de sugerencia del chat solo aparecen con el historial vacío (por
  diseño).
- Rutas 404 bajo segmentos con `loading.tsx` responden HTTP 200 por streaming;
  el usuario ve la página 404 correcta (trade-off aceptado de Next).
