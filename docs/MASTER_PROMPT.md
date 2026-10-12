# ═══════════════════════════════════════════════════════════════════════════════
# 🤖 MASTER PROMPT: ALACENA Enterprise & CavaPro
# ═══════════════════════════════════════════════════════════════════════════════
#
# Versión Actual:   v3.0.0-Titanium-Aurora-Enterprise
# Versión Destino:  v3.1.0-Titanium-Aurora-Luxe
# Documento:        Prompt Maestro Unificado (Funcional + Visual + Continuidad)
# Autor:            Ruenisco Domestic Engine
# Estatus:          CANÓNICO — este archivo gobierna toda iteración futura
#
# ═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 0 — CÓMO USAR ESTE DOCUMENTO
═══════════════════════════════════════════════════════════════════════════════

Este archivo es el PROMPT MAESTRO ÚNICO de ALACENA. Se copia íntegro al
inicio de cualquier sesión de desarrollo: nueva ventana de IA, nuevo
colaborador humano, nueva rama del repo, nueva iteración de versión.

Reglas de gobernanza:
  1. Si algo contradice una decisión previa, ESTE DOCUMENTO GANA.
  2. Solo se reemplaza por una versión superior (v3.0.1, v3.1.0, v4.0.0...).
  3. Toda mejora debe registrarse simultáneamente en:
       a) Este documento (sección correspondiente).
       b) ChangelogModal.jsx.
       c) Header visible de la app (bump de versión).
  4. Si una mejora no está aquí, no existe. Si no está en el changelog,
     no se entregó. Si no está en el header, no se desplegó.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 1 — FICHA TÉCNICA DE PRODUCCIÓN
═══════════════════════════════════════════════════════════════════════════════

URL Producción:      https://alacena-enterprise-prod.web.app
Proyecto Firebase:   alacena-enterprise-prod
Hosting Target:      alacena-app
Moneda Estricta:     Pesos Mexicanos (MXN / $)
Locale:              es-MX
Zona Horaria:        America/Mexico_City
Costo Servidor:      $0 USD/mes (Firebase Spark Tier)

Stack Frontend:      React 19 + Vite + TypeScript / JSX + TailwindCSS
Persistencia:        IndexedDB (Dexie.js) primario
                     LocalStorage solo para preferencias
Offline:             PWA + Service Worker + cola de sync
Audio:               Web Audio API (tonos sintetizados de confirmación)
Cámara:              WebRTC + fallback fotográfico
Integridad:          SHA-256 (Web Crypto API) para bitácora forense
Tipografía:          Fraunces (display) + Inter (body) + JetBrains Mono (num)

Validación Build:    cd frontend && npm run build    (cero errores)
Comando Deploy:      firebase deploy --only hosting:alacena-app \
                       --project alacena-enterprise-prod

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 2 — FILOSOFÍA CENTRAL (NO NEGOCIABLE)
═══════════════════════════════════════════════════════════════════════════════

ALACENA es un sistema de gestión patrimonial de despensa, cava de vinos y
cocina de alta gama, diseñado para la vida práctica y real de un hogar con
personal de servicio.

CONDICIONES ABSOLUTAS DE OPERACIÓN:
  1. SIN SEÑAL — sótanos, cuartos fríos, cavas, alacenas profundas.
  2. SIN CAPACITACIÓN — cocinera, chofer o camarista entienden en <5 seg.
  3. SIN COSTO DE SERVIDOR — $0 USD/mes, Firebase Spark.
  4. SIN AMBIGÜEDAD DE MONEDA — siempre $ MXN, es-MX, sin excepciones.

REGLA DE ORO DE USABILIDAD:
  - Botones ≥56px (≥64px en flujos críticos).
  - Ícono + texto SIEMPRE juntos. Nunca solo ícono.
  - Contraste WCAG AA mínimo (≥4.5:1), AAA en textos críticos.
  - Audio + vibración + visual en cada acción de guardado o destructiva.
  - Cero jerga técnica visible al usuario final.
  - Cero abreviaturas ambiguas.
  - Cero íconos sin etiqueta.

REGLA DE ORO DE ESTÉTICA (v3.1.0-Luxe):
  - El sistema debe VERSE de alta gama, aunque cueste $0/mes.
  - Tipografía editorial en títulos, no sans genérica.
  - Paleta cálida, nunca fría ni clínica.
  - Sombras multicapa, nunca una sola shadow-md.
  - Micro-interacciones en cada acción, nunca cambios bruscos.
  - Modo oscuro propio (Midnight Cava), nunca inversión.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 3 — LOS 5 PILARES OPERATIVOS
═══════════════════════════════════════════════════════════════════════════════

PILAR 1 — 🛒 LISTA DEL SÚPER POR PASILLOS FÍSICOS
-------------------------------------------------------------------------------
Orden fijo y no reordenable:
  1. 🥩 Carnicería & Pescados
  2. 🧀 Lácteos & Quesos
  3. 🥬 Frutas & Verduras
  4. 🥫 Abarrotes & Despensa
  5. 🍷 Cava, Vinos & Licores
  6. ☕ Café, Panadería & Desayuno
  7. 🧼 Limpieza & Hogar

Visual (v3.1.0):
  - Modo "Caminando por el Súper": fondo alto contraste, tipografía 2xl,
    checkbox 56x56, auto-scroll al siguiente, contador sticky, barra progreso.
  - Pasillos como secciones con encabezado sticky y emoji grande.
  - Cambio de color de fondo sutil (2% tint) al cambiar pasillo.

PILAR 2 — 📖 CATÁLOGO / LIBRITO FÍSICO EN QR
-------------------------------------------------------------------------------
Archivo: PantryQrBookletModal.jsx

PILAR 3 — 🍷 CAVA & SOMMELIER PRO (CavaPro v6.0)
-------------------------------------------------------------------------------
Archivos: AddWineModal.jsx, WineTastingModal.jsx

PILAR 4 — 📷 ESCÁNER UNIVERSAL HÍBRIDO v2
-------------------------------------------------------------------------------
Archivo: CameraScannerModal.jsx

PILAR 5 — 🍳 COCINA DE RESTAURANTE & BITÁCORA FORENSE v2
-------------------------------------------------------------------------------
Archivos: RecipesView.tsx, AuditTrailView.tsx
