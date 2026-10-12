═══════════════════════════════════════════════════════════════════════════════
🤖 MASTER PROMPT: ALACENA Enterprise & CavaPro
═══════════════════════════════════════════════════════════════════════════════

Versión Actual:      v3.3.0-Titanium-Aurora-Perfection
Versión Base:        v3.2.0 (Unificación Arquitectónica + Web Luxe + Mobile)
Documento:           Prompt Maestro Canónico Unificado
Autor:               Ruenisco Domestic Engine
Repositorio:         https://github.com/pacoiglesias/alacena
Deploy Producción:   https://alacena-enterprise-prod.web.app (Hosting Activo)
Dominio Custom:      https://alacena.cobertores.com
Estatus:             CANÓNICO Y DEFINITIVO — gobierna toda iteración futura

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 0 — CLARIFICACIÓN ARQUITECTÓNICA DEFINITIVA (¿FLUTTER O REACT?)
═══════════════════════════════════════════════════════════════════════════════

Este repositorio es una PLATAFORMA DE GESTIÓN PATRIMONIAL DUAL con dos capas
especializadas perfectamente sincronizadas sobre el mismo backend de Firebase:

1. WEB APP DE ALTA GAMA (Activa en Producción):
   - Carpeta: `/frontend/`
   - Stack: React 19 + Vite + TailwindCSS + Lucide Icons + Web Audio API
   - Build: `cd frontend && npm run build` → genera `/frontend/dist/`
   - Deploy: Firebase Hosting (`firebase.json` apunta a `frontend/dist`)
   - URL Activa: https://alacena-enterprise-prod.web.app
   - Propósito: Experiencia web de escritorio, tabletas y teléfonos con
     fichas sommelier 2:1, modo caminando por el súper, hoja imprimible PDF
     en A4/Carta con códigos QR, y centro de mando CAVAPRO.

2. APLICACIÓN MÓVIL NATIVA (Android / iOS):
   - Carpeta: `/lib/`
   - Stack: Flutter 3.47 + Dart 3.13 + Riverpod 3.x + Mobile Scanner
   - Build: `flutter build apk --release` / `flutter build ios --release`
   - Propósito: Aplicación nativa instalable en smartphones para chofer,
     camarista o cocinera con escaneo láser por cámara, NFC y hápticos nativos.

3. REGLA SUPREMA DE DESPLIEGUE WEB:
   Firebase Hosting despliega `/frontend/dist`. Todo cambio visible en la web
   se implementa y prueba en `/frontend/` y se valida con `npm run build`.
   Todo cambio móvil se implementa en `/lib/` y se valida con `flutter analyze`
   y `flutter test`. AMBOS SUBSISTEMAS DEBEN MANTENER CERO ERRORES DE BUILD.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 1 — FICHA TÉCNICA DE PRODUCCIÓN
═══════════════════════════════════════════════════════════════════════════════

Firebase Project:    alacena-enterprise-prod
Hosting Target:      alacena-app
Hosting URL:         https://alacena-enterprise-prod.web.app
Dominio Alterno:     https://alacena.cobertores.com

Backend / DB:        Google Cloud Firestore (Spark Tier $0 USD/mes)
Reglas de DB:        firestore.rules en raíz (Multi-tenant + RBAC)
Cloud Functions:     functions/ (Node.js 22)

Moneda Estricta:     Pesos Mexicanos (MXN / $) — NUNCA divisas extranjeras
Locale:              es-MX
Zona Horaria:        America/Mexico_City
Formato Moneda:      NumberFormat.currency(locale: 'es_MX', symbol: '$')

Validaciones Obligatorias:
  - Web:     cd frontend && npm run build    (0 errores)
  - Flutter: flutter analyze                 (0 errores)
  - Tests:   flutter test                    (todos pasan)
  - Deploy:  firebase deploy --only hosting:alacena-app --project alacena-enterprise-prod

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 2 — FILOSOFÍA OPERATIVA (VIDA PRÁCTICA EN EL HOGAR)
═══════════════════════════════════════════════════════════════════════════════

ALACENA gestiona la despensa, cava de vinos y cocina de alta gama para hogares
con personal de servicio (cocinera, chofer, camarista, mayordomo).

1. CERO CAPACITACIÓN:
   Cualquier miembro del personal debe entender qué hacer en < 5 segundos.
   Botones grandes (≥ 56px), icono + texto SIEMPRE juntos.

2. OFFLINE-FIRST:
   La app debe operar en sótanos, cuartos fríos, cavas y pasillos de tiendas
   sin conexión a internet. Cache local y sincronización al reconectar.

3. CATÁLOGO FÍSICO EN PAPEL (LIBRITO QR & HOJA DE SÚPER):
   El personal no necesita teclear en una computadora:
   - Puede escanear un librito impreso con códigos QR de insumos agotados.
   - O llevarse una hoja de compras impresa A4 con casillas [ ] para pluma.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 3 — LOS 5 PILARES OPERATIVOS
═══════════════════════════════════════════════════════════════════════════════

PILAR 1 — 🛒 LISTA DEL SÚPER & HOJA IMPRIMIBLE A4 / PDF
  - Orden estricto de pasillos físicos:
      1. 🥩 Carnicería & Pescados
      2. 🧀 Lácteos & Quesos
      3. 🥬 Frutas & Verduras
      4. 🥫 Abarrotes & Despensa
      5. 🍷 Cava, Vinos & Licores
      6. ☕ Café, Panadería & Desayuno
      7. 🧼 Limpieza & Hogar
  - Modo "Caminando por el Súper": Interfaz táctil de alto contraste con
    checkboxes de 56x56, auto-scroll y vibración/audio al palomear.
  - Módulo Imprimible A4 / Carta: Hoja en blanco y negro puro sin tinta oscura,
    casillas cuadradas [ ] para tachar con pluma, notas de frescura, código QR
    para re-escanear desde el móvil, y bloques de firma de compra y recepción.
  - Recepción de Compras: Botón "✅ Ya compré todo: Guardar en la despensa"
    que transfiere automáticamente el stock a su zona, actualiza el valor
    en $ MXN y genera registro forense en la bitácora.

PILAR 2 — 📖 CATÁLOGO / LIBRITO FÍSICO EN QR
  - Impresión A4 de 12 códigos QR por hoja con corrección de error H (30%).
  - Al escanear con la cámara nativa del celular, agrega directamente 1 unidad
    a la lista de compras sin abrir menús complejos.
  - Modal "¿Qué Falta en Casa?" con 12 insumos esenciales para apunte rápido.

PILAR 3 — 🍷 CAVA & SOMMELIER PRO (CavaPro v6.0)
  - Ficha editorial sommelier 2:1 con silueta SVG de botella coloreada según estilo:
      Tinto (#6B1F2E) · Blanco (#C9B24A) · Rosado (#D88A9C)
      Espumoso (#E8D9A0) · Naranja (#C8752E)
  - Puntuación Sommelier 80-100 en tipografía tabular XL + estrellas.
  - Chips de Maridaje Rápido:
      🥩 Cortes & Asados · 🐟 Pescados & Aves · 🥂 Brindis · ⭐ Gran Reserva
  - Modal de Descorche & Cata: Descuento atómico de botella, notas de aroma
    (cereza, cuero, vainilla, roble) y alerta si stock ≤ 1 para recompra.

PILAR 4 — 📷 ESCÁNER UNIVERSAL HÍBRIDO (EAN-13, QR, LÁSER, MODO LOTE)
  - Detección instantánea por cámara WebRTC y Mobile Scanner.
  - Modo Lote para inventarios trimestrales continuos sin cerrar la cámara.
  - Fallback a formulario de captura rápida si el producto es nuevo.

PILAR 5 — 🍳 COCINA DE RESTAURANTE & BITÁCORA FORENSE
  - Costeo de recetas con merma en $ MXN.
  - Modo cocinar paso a paso con timers y audio de aviso.
  - "Cocinar y Descontar": Deduce insumos del stock y solicita firma de cocinera.
  - Bitácora Forense (Audit Trail): Registro inmutable con fecha, hora, actor,
    acción y hash SHA-256. Prohibido update/delete en firestore.rules.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 4 — RESPUESTAS CANÓNICAS A PREGUNTAS ABIERTAS (AUDITORÍA OFICIAL)
═══════════════════════════════════════════════════════════════════════════════

P1. ¿Dónde está firestore.rules?
    → En la raíz: `firestore.rules`. Gobernado por `firebase.json`.

P2. ¿El audit_trail permite update/delete?
    → Es APPEND-ONLY. No permite update ni delete; solo creación y lectura.

P3. ¿El RBAC usa custom claims o campo en documento de usuario?
    → Soporta ambos: `request.auth.token.role` (custom claim) y documento en
      `/workspaces/{workspaceId}/members/{userId}` con fallback seguro.

P4. ¿Existe firebase_options.dart y está protegido?
    → Sí, está listado en `.gitignore` para prevenir fugas de credenciales.

P5. ¿Existe audio_feedback_mobile.dart?
    → Sí, implementado en `lib/core/services/audio_feedback_mobile.dart`
      con `SystemSound` y `HapticFeedback` nativo.

P6. ¿Existe carpeta test/ con tests reales?
    → Sí, `test/restaurant_kitchen_recipes_and_settings_test.dart` y
      `test/widget_test.dart` (100% pasando).

P7. ¿La web app es React o Flutter?
    → La web app de producción es React 19 + Vite (`/frontend/`). Flutter
      en `/lib/` es el cliente móvil nativo Android/iOS.

P8. ¿Qué versión de Flutter y Dart está en uso?
    → Dart SDK `^3.13.5` y Flutter 3.47 con `flutter_riverpod: ^3.4.3`.

P9. ¿Existe sistema de diseño en Flutter?
    → Sí, `lib/core/theme/app_theme.dart` y `lib/core/theme/tokens.dart`
      junto con `frontend/src/styles/tokens.css` en la web.

P10. ¿Cuál es el dominio canónico?
     → `https://alacena-enterprise-prod.web.app` (Firebase Hosting activo).

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 5 — PROTOCOLO DE DESPLIEGUE Y CONFIRMACIÓN
═══════════════════════════════════════════════════════════════════════════════

Antes de dar por concluida cualquier sesión de trabajo:
  1. `cd frontend && npm run build` (debe salir 0 errores).
  2. `C:\src\flutter\bin\flutter.bat analyze` (debe salir 0 issues).
  3. `C:\src\flutter\bin\flutter.bat test` (todos los tests pasan).
  4. `firebase deploy --only hosting:alacena-app --project alacena-enterprise-prod`.
  5. `git add .` + commit convencional + `git push origin main`.
  6. Versión reflejada en Header (`v3.3.0 · Perfection`) y ChangelogModal.

═══════════════════════════════════════════════════════════════════════════════
FIN DEL MASTER PROMPT CANÓNICO v3.3.0
═══════════════════════════════════════════════════════════════════════════════
