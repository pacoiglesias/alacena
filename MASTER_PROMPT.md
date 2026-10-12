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

Funcional:
  - Modo Táctil Móvil: tarjetas ≥64px, palomeo 1 toque, audio confirmación.
  - Agrupación por proveedor sugerido dentro de cada pasillo.
  - Estimado de costo total en $ MXN antes de salir.
  - Presupuesto semanal configurable con barra de progreso.
  - Exportación 1 toque: WhatsApp (• [ ]), PDF imprimible, CSV.
  - Botón final: "✅ Ya compré todo: Guardar en la despensa"
      → Transfiere cantidades, actualiza costoUnitMXN si cambió.
      → Limpia carrito, escribe entrada firmada en bitácora.

Visual (v3.1.0):
  - Modo "Caminando por el Súper": fondo alto contraste, tipografía 2xl,
    checkbox 56x56, auto-scroll al siguiente, contador sticky, barra progreso.
  - Pasillos como secciones con encabezado sticky y emoji grande.
  - Cambio de color de fondo sutil (2% tint) al cambiar pasillo.

PILAR 2 — 📖 CATÁLOGO / LIBRITO FÍSICO EN QR
-------------------------------------------------------------------------------
Archivo: PantryQrBookletModal.jsx

Funcional:
  - PDF imprimible con QR de productos esenciales.
  - Deep link: alacena://add/{productId}
  - Escaneo desde app → añade 1 unidad directo a lista.
  - Escaneo desde cámara nativa → formulario web prellenado.
  - Botón: "📝 ¿Qué Falta en Casa?" con 12 insumos frecuentes (1 toque).
  - Auto-poblado por alertas de stock mínimo y caducidad.

Visual (v3.1.0):
  - PDF A4, 3 columnas × 4 filas = 12 QRs por hoja.
  - Borde punteado por celda, QR 40x40mm corrección H (30%).
  - Nombre producto: Fraunces 20px, centrado.
  - Foto: 20x20mm, unidad y proveedor en 12px.
  - Texto inferior: "Si se acabó, escanea aquí".
  - QR siempre negro sobre blanco, incluso en modo oscuro.

PILAR 3 — 🍷 CAVA & SOMMELIER PRO (CavaPro v6.0)
-------------------------------------------------------------------------------
Archivos: AddWineModal.jsx, WineTastingModal.jsx, CavaProView.tsx

Campos obligatorios:
  Vintage, País con bandera, Región/D.O., Bodega, Cepa, Estilo, % Alcohol,
  Ubicación física (Cava 1 - Estante A, Nivel 2), Maridaje, Temperatura.

Campos v6.0:
  Precio compra MXN + fecha → ROI, Proveedor, Importador, País origen,
  Ventana de guarda (año inicio–fin) → alerta "listo para beber",
  Historial de descorches por botella.

Ficha de Cata:
  1-5 estrellas, 80-100 puntos sommelier, notas aroma/boca,
  foto de etiqueta con OCR opcional.

Acciones:
  - Sugerencia de maridaje cruzando con recetas existentes.
  - Descorche atómico: descuenta botella, exige nota, firma bitácora,
    si stock ≤1 ofrece recompra, si 0 marca agotado conservando historial.

Visual (v3.1.0):
  - Card horizontal 2:1 tipo etiqueta editorial.
  - Silueta SVG de botella según tipo (borgoña, burdeos, flauta, jerez).
  - Bodega en Fraunces grande, vintage abajo, región en pill.
  - Puntaje 80-100 en tabular XL, estrellas debajo.
  - Borde izquierdo 6px según estilo:
      tinto #6B1F2E / blanco #C9B24A / rosado #D88A9C
      / espumoso #E8D9A0 / naranja #C8752E
  - Alerta "listo para beber": badge dorado pulsante sutil.
  - Stock: 5 mini-botellas SVG rellenas/llenas.
  - Modal descorche: blur 16px + foto con vignette + sliders grandes +
    chips de aroma (cereza, cuero, vainilla, tabaco, tierra, frutos rojos).

PILAR 4 — 📷 ESCÁNER UNIVERSAL HÍBRIDO v2
-------------------------------------------------------------------------------
Archivo: CameraScannerModal.jsx

Códigos soportados:
  EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF, QR, DataMatrix.

Funcional:
  - Retícula adaptativa con láser animado, WebRTC async, fallback foto.
  - Modo alta velocidad: pistoleo continuo sin cerrar modal, contador visible.
  - Código desconocido → modal "Producto nuevo" prellenado.
  - Cola offline: guarda escaneos y procesa al reconectar.

Visual (v3.1.0):
  - Retícula con esquinas animadas, no solo cuadro.
  - Feedback triple al detectar: tono 880Hz + vibrate(30) + flash verde.
  - Contador en modo alta velocidad: tipografía tabular XL 48px.

PILAR 5 — 🍳 COCINA DE RESTAURANTE & BITÁCORA FORENSE v2
-------------------------------------------------------------------------------
Archivos: RecipesView.tsx, AuditTrailView.tsx, CookModeModal.tsx

Funcional:
  - Costeo por plato y porción en $ MXN con merma.
  - Modo "Cocinar" paso a paso con timers y audio de aviso.
  - Validación stock: si falta, ofrece "🛒 Agregar Faltantes" sin bloquear.
  - "Cocinar y Descontar": resta insumos + firma bitácora.
  - Foto del platillo → se guarda como "resultado real".
  - Bitácora forense cadena SHA-256, verificación al abrir,
    banner rojo si se rompe, export PDF firmado.

Visual (v3.1.0):
  - Receta: header foto full-bleed 16:9 + gradiente + nombre Fraunces 3xl.
  - Meta: pills tiempo/porciones/dificultad. Costo porción en card acento.
  - Ingredientes: checkboxes visuales, tachado sutil + badge rojo si falta.
  - Modo Cocinar: pantalla completa, tipografía XL, timer circular gigante.
  - Bitácora: timeline visual, NO tabla. Nodos circulares con ícono por
    acción (🛒 compra, 🍷 descorche, 🍳 cocinar, ✏️ edición, 🗑️ eliminación).
  - Encabezado fecha relativa + actor. Delta JSON colapsable en mono.
  - Hash: pill mono 8 chars + candado. Banner integridad verde/rojo pulsante.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 4 — ARQUITECTURA OBLIGATORIA
═══════════════════════════════════════════════════════════════════════════════

4.1 CAPA DE DATOS
-------------------------------------------------------------------------------
- IndexedDB (Dexie.js) PRIMARIO: despensa, cava, recetas, bitácora, catálogo.
- LocalStorage SOLO: tema, idioma, última vista, flags onboarding, rol activo.
- Esquema versionado con migraciones.
- Cada entidad tiene SIEMPRE:
    id (uuid v4), createdAt, updatedAt,
    createdBy ({ rol, nombre }), deletedAt (soft delete),
    syncStatus: 'local' | 'synced' | 'conflict'

4.2 MODELO DE DATOS
-------------------------------------------------------------------------------
type Rol     = 'admin' | 'cocinera' | 'chofer' | 'camarista' | 'invitado';
type Unidad  = 'pza' | 'kg' | 'g' | 'L' | 'ml' | 'caja' | 'botella' | 'lata';
type Pasillo = 'carniceria' | 'lacteos' | 'frutas-verduras' | 'abarrotes'
             | 'cava' | 'cafe-panaderia' | 'limpieza';

4.3 REGLAS DE NEGOCIO CRÍTICAS
-------------------------------------------------------------------------------
R1. Bitácora forense real:
      hashActual = SHA256(hashPrevio + JSON(entrada))
    Validación de cadena al arrancar. Banner rojo si se rompe.
R2. Alerta stock: si stockActual ≤ stockMinimo → auto-add a "¿Qué Falta?"
R3. Alerta caducidad: ≤7 días ámbar, ≤2 días rojo.
R4. Descorche atómico: descuento + nota + AuditLog + stock. Cero → agotado.
R5. Costeo receta: cantidad * (1 + mermaPct/100) * costoUnitMXN
R6. Conversión unidades: kg↔g, L↔ml, botella↔ml (750 default).
R7. Offline-first real: SW cachea shell, escrituras IndexedDB primero.

4.4 ROLES Y PERMISOS
-------------------------------------------------------------------------------
| Acción                | admin | cocinera | chofer | camarista | invitado |
|-----------------------|-------|----------|--------|-----------|----------|
| Ver despensa          |  ✅   |    ✅    |   ✅   |    ✅     |    ✅    |
| Editar stock          |  ✅   |    ✅    |   ❌   |    ✅     |    ❌    |
| Añadir a lista súper  |  ✅   |    ✅    |   ✅   |    ✅     |    ✅    |
| Editar cava           |  ✅   |    ❌    |   ❌   |    ❌     |    ❌    |
| Descorchar vino       |  ✅   |    ❌    |   ❌   |    ❌     |    ❌    |
| Cocinar y descontar   |  ✅   |    ✅    |   ❌   |    ❌     |    ❌    |
| Ver bitácora          |  ✅   |  ✅(prop)|✅(prop)|  ✅(prop) |    ❌    |

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 5 — SISTEMA DE DISEÑO (DESIGN TOKENS v3.1.0-Luxe)
═══════════════════════════════════════════════════════════════════════════════

Archivo: src/styles/tokens.css

TIPOGRAFÍA:
  --font-display: 'Fraunces', serif;
  --font-body:    'Inter', sans-serif;
  --font-mono:    'JetBrains Mono', monospace;
  --font-numeric: 'Inter', tabular-nums;

  Escala:
    --text-xs:   12px / 1.4
    --text-sm:   14px / 1.5
    --text-base: 16px / 1.6
    --text-lg:   18px / 1.5
    --text-xl:   22px / 1.35
    --text-2xl:  28px / 1.25
    --text-3xl:  36px / 1.15
    --text-hero: 48px / 1.05

COLOR MODO CLARO — Luxe Cream:
  --bg-base:      #FAF7F2
  --bg-elevated:  #FFFFFF
  --bg-sunken:    #F0EBE2
  --ink-primary:  #1A1614
  --ink-secondary:#5C544D
  --ink-tertiary: #8B8378
  --border-soft:  #E8E1D5
  --border-strong:#C9BFAD

COLOR MODO OSCURO — Midnight Cava:
  --bg-base:      #12100E
  --bg-elevated:  #1C1916
  --bg-sunken:    #0A0908
  --ink-primary:  #F2EDE4
  --ink-secondary:#B8AFA3
  --ink-tertiary: #7A7268
  --border-soft:  #2A2521
  --border-strong:#3D3630

ACENTOS POR PILAR (claro → oscuro más saturado):
  --accent-super:  #C8542A → #E5724A   (terracota)
  --accent-cava:   #6B1F2E → #A83A50   (vino tinto)
  --accent-cocina: #B8860B → #E0B441   (dorado antiguo)
  --accent-audit:  #2C4A52 → #5C8894   (azul pizarra)
  --accent-qr:     #1F4D3A → #3D8B6E   (verde bosque)

SEMÁNTICOS:
  --success: #2F7D5C
  --warning: #C08A1E
  --danger:  #B33A3A
  --info:    #3A6EA5

ELEVACIÓN MULTICAPA:
  --shadow-sm: 0 1px 2px rgba(26,22,20,.06), 0 1px 3px rgba(26,22,20,.04);
  --shadow-md: 0 2px 4px rgba(26,22,20,.05), 0 4px 12px rgba(26,22,20,.06);
  --shadow-lg: 0 4px 8px rgba(26,22,20,.05), 0 12px 32px rgba(26,22,20,.08);
  --shadow-xl: 0 8px 16px rgba(26,22,20,.06), 0 24px 48px rgba(26,22,20,.10);
  --shadow-inset: inset 0 1px 0 rgba(255,255,255,.6);

RADIOS:
  --radius-sm: 6px / --radius-md: 10px / --radius-lg: 16px
  --radius-xl: 24px / --radius-full: 9999px

ESPACIADO (escala 4px):
  --space-1:4 / --space-2:8 / --space-3:12 / --space-4:16
  --space-5:24 / --space-6:32 / --space-7:48 / --space-8:64

MOVIMIENTO:
  --ease-out:    cubic-bezier(.16,1,.3,1)
  --ease-in-out: cubic-bezier(.4,0,.2,1)
  --ease-spring: cubic-bezier(.34,1.56,.64,1)
  --dur-fast: 150ms / --dur-base: 240ms / --dur-slow: 400ms

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 11 — PROTOCOLO DE MEJORA CONTINUA
═══════════════════════════════════════════════════════════════════════════════

CICLO OBLIGATORIO EN CADA ITERACIÓN:
  PASO 1 — AUDITORÍA: verificar estado y pruebas sin romper lógica.
  PASO 2 — EJECUCIÓN ATÓMICA: implementar cambios respetando tokens y contratos.
  PASO 3 — VERIFICACIÓN: build limpio con 0 advertencias críticas.
  PASO 4 — DESPLIEGUE & REGISTRO: bump de versión en Header y ChangelogModal, deploy a producción.
