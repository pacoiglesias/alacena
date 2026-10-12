# ═══════════════════════════════════════════════════════════════════════════════
# 🤖 MASTER PROMPT: ALACENA Enterprise & CavaPro
# ═══════════════════════════════════════════════════════════════════════════════
#
# Versión Canónica:  v3.5.3-Enterprise-Luxe
# Documento:        Prompt Maestro de Gobernanza & Mejora Continua
# Entorno:          Producción Activa (Firebase: alacena-enterprise-prod)
# URL:              https://alacena-enterprise-prod.web.app
# Moneda:           Pesos Mexicanos (MXN / $) — es-MX
#
# ═══════════════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 0 — PROTOCOLO DE GOBERNANZA & MEJORA CONTINUA (REGLA ABSOLUTA)
═══════════════════════════════════════════════════════════════════════════════

Este documento es la constitución técnica inmutable de ALACENA. Cualquier agente
de IA, desarrollador o mantenedor que interactúe con el repositorio DEBE seguir
estos 5 pasos obligatorios en cada sesión de trabajo:

1. AUDITORÍA PREVIA Y LECTURA DE CONTRATOS:
   - Antes de tocar cualquier línea de código, auditar el estado del repositorio (`git status`).
   - Respetar los hooks de React: NUNCA colocar condicionales de salida (`if (!isOpen) return null;`)
     antes de declaraciones de hooks (`useState`, `useEffect`, `useMemo`, `useCallback`). Todos
     los hooks deben invocarse incondicionalmente al inicio del componente.
   - Preservar la normalización defensiva de datos: nunca asumir que las colecciones en
     `localStorage` o `IndexedDB` son objetos uniformes; sanitizar strings y formatos antiguos.

2. ARQUITECTURA DE IMPRESIÓN FÍSICA AISLADA (REGLA ANTI-HOJAS EN BLANCO):
   - Al generar impresiones (PDFs térmicos, stickers de QR, librito de despensa), NUNCA imprimir
     directamente desde la ventana principal cuando un modal con `position: fixed` esté abierto.
   - Utilizar el motor de iframe aislado fuera de pantalla (`top: -10000px, width: 900px, height: 1200px`).
   - Rasterizar todos los códigos QR como Data URLs PNG en Base64 con corrección de error 'H'.
   - Aplicar CSS estricto `@media print` eliminando márgenes de body e insertando saltos de página
     limpios (`page-break-after: always`).

3. DEDUPLICACIÓN INTELIGENTE:
   - El motor de compras y recetas debe utilizar `frontend/src/utils/deduplication.js`.
   - Normalizar caracteres mediante NFD, eliminando tildes, diacríticos y homogeneizando plurales
     (ej. 'salmón' == 'salmon', 'tomates' == 'tomate').

4. CONTROL DE RESPALDOS Y REGRESIONES:
   - Toda iteración que altere la estructura de datos o flujos principales debe contar con un
     respaldo local mediante `scripts/hacer_respaldo_local.bat` antes de su despliegue.
   - Realizar commits atómicos en Git con mensajes semánticos y sincronizar con `origin/main`.

5. REGISTRO VISIBLE Y BUMP DE VERSIÓN:
   - Toda mejora entregada debe actualizar simultáneamente:
     a) El indicador de versión en `frontend/src/components/layout/Header.jsx`.
     b) La lista de cambios en `frontend/src/components/changelog/ChangelogModal.jsx`.
     c) Este archivo maestro (`MASTER_PROMPT.md`).

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 1 — FICHA TÉCNICA Y STACK TECNOLÓGICO
═══════════════════════════════════════════════════════════════════════════════

URL Producción:      https://alacena-enterprise-prod.web.app
Proyecto Firebase:   alacena-enterprise-prod
Hosting Target:      alacena-app
Moneda Estricta:     Pesos Mexicanos (MXN / $)
Locale:              es-MX
Zona Horaria:        America/Mexico_City
Costo Mensual:       $0 USD/mes (Arquitectura Serverless Optimizada)

Stack Frontend:      React 19 + Vite 8 + TailwindCSS 4 + Lucide React
Persistencia:        IndexedDB (Dexie.js) primario + LocalStorage para catálogos y preferencias
Offline:             PWA + Service Worker + Almacenamiento local resiliente
Audio & Feedback:    Web Audio API (tonos sintetizados a 880Hz) + Vibración háptica
Cámara & Escáner:    WebRTC adaptativo (html5-qrcode + fallback manual de código corto)
Impresión:           jsPDF + qrcode.react + Iframe Print Engine aislado
Tipografía:          Fraunces (editorial display) + Inter (cuerpo) + JetBrains Mono (claves)

Comando Build:       cd frontend && npm run build (0 errores)
Comando Deploy:      scripts\deploy_hosting.bat
Comando Backup:      scripts\hacer_respaldo_local.bat

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 2 — PILARES FUNCIONALES DEL HOGAR
═══════════════════════════════════════════════════════════════════════════════

PILAR 1 — 🛒 LISTA DEL SÚPER POR PASILLOS FÍSICOS
- Organización por recorrido físico en tienda comercial:
  1. 🥩 Carnicería & Pescados
  2. 🧀 Lácteos & Quesos
  3. 🥬 Frutas & Verduras
  4. 🥫 Abarrotes & Despensa
  5. 🍷 Cava, Vinos & Licores
  6. ☕ Café, Panadería & Desayuno
  7. 🧼 Limpieza & Hogar
- Controles táctiles grandes (botones +/- con objetivo táctil de 48px).
- Agrupación por tienda asignada (Costco, City Market, Chedraui, Walmart, etc.).
- Botón final de guardado atómico: "✅ Ya compré todo: Guardar en despensa".

PILAR 2 — 📖 LIBRITO FÍSICO Y ETIQUETAS QR
- Generación de tarjetas imprimibles para estanterías de despensa.
- Cada tarjeta contiene: QR de alta densidad, Short ID legible (ej. ALC-4B7), nombre,
  categoría, y leyenda de acción ("Si se acabó, escanea aquí").
- Motor de impresión por iframe aislado que erradica impresiones en blanco.

PILAR 3 — 🍷 CAVAPRO & SOMMELIER PATRIMONIAL
- Control exhaustivo de botellas de vino: añada, bodega, denominación de origen, cepa,
  temperatura de servicio recomendada y ventana óptima de consumo.
- Ubicación física tridimensional en cava (estante, fila, nivel).
- Descorche con registro de cata (aroma, cuerpo, calificación de 80-100 pts) y auditoría.

PILAR 4 — 📷 ESCÁNER HÍBRIDO CONTINUO
- Escaneo rápido de códigos QR y de barras (EAN-13, UPC).
- Modo lote para registro masivo de productos sin interrupción de pantalla.
- Fallback manual mediante Short ID alfanumérico para etiquetas dañadas o húmedas.

PILAR 5 — 🍳 COCINA, COSTEO & AUDITORÍA FORENSE SHA-256
- Recetario inteligente con costeo automático por plato y porción calculando mermas.
- Modo "Cocinar y Descontar" que resta inventario de forma inmediata.
- Bitácora forense de auditoría inmutable: cada movimiento genera un hash SHA-256
  ligado al registro previo para prevenir pérdidas o discrepancias.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 3 — DESIGN SYSTEM LUXE & GUÍA DE ESTILO
═══════════════════════════════════════════════════════════════════════════════

- Colores Principales:
  * Fondo Claro: #FAF7F2 (Luxe Cream)
  * Fondo Oscuro: #12100E (Midnight Cava)
  * Acento Terracota (Súper): #C8542A
  * Acento Vino Tinto (Cava): #6B1F2E
  * Acento Dorado (Cocina): #B8860B
  * Acento Pizarra (Auditoría): #2C4A52
  * Acento Bosque (QR/Inventario): #1F4D3A
- Contraste mínimo WCAG AA garantizado en todas las vistas.
- Interacciones fluidas, micro-animaciones y botones táctiles ergonómicos.
