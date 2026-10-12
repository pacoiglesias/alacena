═══════════════════════════════════════════════════════════════════════════════
🤖 MASTER PROMPT: ALACENA Enterprise & CavaPro
═══════════════════════════════════════════════════════════════════════════════

Versión Actual:      v3.2.0-Titanium-Aurora-Flutter
Versión Base:        v3.1.0 (React — obsoleta tras auditoría de repo real)
Documento:           Prompt Maestro Unificado (Flutter + Funcional + Visual)
Autor:               Ruenisco Domestic Engine
Repositorio:         https://github.com/pacoiglesias/alacena
Deploy Actual:       https://alacena.cobertores.com
Estatus:             CANÓNICO — gobierna toda iteración futura

═══════════════════════════════════════════════════════════════════════════════
NOTA DE RECTIFICACIÓN IMPORTANTE
═══════════════════════════════════════════════════════════════════════════════

La versión anterior de este documento (v3.1.0) asumía un stack React + Vite +
TypeScript + TailwindCSS. Tras auditar el repositorio real
(pacoiglesias/alacena), se confirma que el stack REAL es:

  Flutter 3.47 + Riverpod 3.x + Firebase (Spark tier $0/mes) + Gemini Flash.

Este documento reemplaza íntegramente al v3.1.0 y adapta:
  - Los design tokens CSS → ThemeData de Flutter
  - Los componentes React → Widgets de Flutter
  - Dexie.js / IndexedDB → Firestore offline cache + Hive/Isar local
  - TailwindCSS → Estilos programáticos en Dart con ThemeExtension

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 0 — CÓMO USAR ESTE DOCUMENTO
═══════════════════════════════════════════════════════════════════════════════

Este archivo es el PROMPT MAESTRO ÚNICO de ALACENA. Se copia íntegro al
inicio de cualquier sesión de desarrollo: nueva ventana de IA, nuevo
colaborador humano, nueva rama del repo, nueva iteración de versión.

Reglas de gobernanza:
  1. Si algo contradice una decisión previa, ESTE DOCUMENTO GANA.
  2. Solo se reemplaza por una versión superior (v3.2.1, v3.3.0, v4.0.0).
  3. Toda mejora debe registrarse simultáneamente en:
       a) Este documento (sección correspondiente).
       b) ChangelogModal / ChangelogScreen.
       c) Header visible de la app (bump de versión).
       d) README.md del repositorio.
  4. Si una mejora no está aquí, no existe.
  5. Si no está en el changelog, no se entregó.
  6. Si no está en el header, no se desplegó.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 1 — FICHA TÉCNICA DE PRODUCCIÓN
═══════════════════════════════════════════════════════════════════════════════

URL Producción:      https://alacena.cobertores.com
Repositorio:         https://github.com/pacoiglesias/alacena
Firebase Project:    alacena-enterprise-prod (verificar en .firebaserc)
Hosting Target:      alacena-app (verificar en firebase.json)

Stack REAL confirmado:
  - Flutter 3.47
  - Dart (versión declarada en pubspec.yaml)
  - Riverpod 3.x (gestión de estado)
  - Firebase (Auth, Firestore, Storage, Hosting)
  - Cloud Functions (Node.js 22)
  - Gemini 1.5 Flash (visión + IA zero-waste, tier $0)
  - Audio: audio_feedback_service.dart (Web Audio + háptico móvil)
  - Escáner: EAN/QR láser + NFC + Modo Lote
  - Etiquetas térmicas 50x30mm

Persistencia:
  - Firestore con offline persistence nativa
  - Cache local en dispositivo
  - Sync bidireccional al reconectar

Moneda Estricta:     Pesos Mexicanos (MXN / $)
Locale:              es-MX
Zona Horaria:        America/Mexico_City
Costo Servidor:      $0 USD/mes (Firebase Spark + Gemini free tier)

Validación Build:
  flutter analyze         (cero errores, cero warnings bloqueantes)
  flutter test            (todos los tests pasan)
  flutter build web --release
  flutter build apk --release (Android)
  flutter build ios --release (iOS)

Comando Deploy:
  firebase deploy --only hosting:alacena-app --project alacena-enterprise-prod

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

REGLA DE ORO DE ESTÉTICA (v3.2.0-Luxe):
  - El sistema debe VERSE de alta gama, aunque cueste $0/mes.
  - Tipografía editorial en títulos (Fraunces), no sans genérica.
  - Paleta cálida, nunca fría ni clínica.
  - Sombras multicapa, nunca una sola BoxShadow.
  - Micro-interacciones en cada acción, nunca cambios bruscos.
  - Modo oscuro propio (Midnight Cava), nunca inversión automática.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 3 — ESTRUCTURA REAL DEL REPOSITORIO
═══════════════════════════════════════════════════════════════════════════════

alacena/
├── lib/
│   ├── core/
│   │   └── services/
│   │       ├── audio_feedback_service.dart
│   │       ├── audio_feedback_stub.dart
│   │       ├── audio_feedback_web.dart
│   │       ├── audio_feedback_mobile.dart   ← ¿EXISTE? VERIFICAR
│   │       ├── ean_lookup_service.dart
│   │       ├── firestore_offline_service.dart
│   │       └── gemini_vision_service.dart
│   │
│   ├── features/
│   │   ├── inventory/          → Inventario glanceable, short IDs, badges
│   │   ├── sommelier/          → Cava inteligente, maridajes, notas cata
│   │   ├── shopping_list/      → Lista colaborativa + bloqueo en tienda
│   │   ├── zero_waste/         → Chef IA para rescate de ingredientes
│   │   ├── analytics/          → Tablero financiero, valuación activos
│   │   ├── hardware/           → Escáner EAN/QR, NFC, Modo Lote
│   │   ├── labels/             → Generador etiquetas térmicas 50x30mm
│   │   ├── audit_trail/        → Log forense de usuarios
│   │   ├── auth/               → Autenticación
│   │   ├── cycle_counts/       → Conteos cíclicos
│   │   └── households/         → Multi-propiedad
│   │
│   └── main.dart
│
├── functions/
│   ├── index.js                → predictiveConsumptionCron
│   │                             onStockLevelAlert
│   │                             globalEanLookup
│   └── package.json            → Node.js 22
│
├── test/                       → ¿EXISTE? VERIFICAR
├── integration_test/           → ¿EXISTE? VERIFICAR
├── docs/                       → ¿EXISTE? VERIFICAR
├── assets/                     → ¿EXISTE? VERIFICAR
│
├── firestore.rules             → ¿DÓNDE? VERIFICAR
├── storage.rules               → ¿DÓNDE? VERIFICAR
├── firebase.json
├── .firebaserc
├── pubspec.yaml
├── analysis_options.yaml
└── README.md

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 4 — LOS 5 PILARES OPERATIVOS (ADAPTADOS AL REPO REAL)
═══════════════════════════════════════════════════════════════════════════════

PILAR 1 — 🛒 LISTA DEL SÚPER POR PASILLOS FÍSICOS
-------------------------------------------------------------------------------
Feature: lib/features/shopping_list/

Orden fijo de pasillos:
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
      → Limpia carrito, escribe entrada firmada en audit_trail.

Visual (v3.2.0-Luxe):
  - Modo "Caminando por el Súper": fondo alto contraste, tipografía 2xl,
    checkbox 56x56, auto-scroll al siguiente, contador sticky, barra progreso.
  - Pasillos como secciones con encabezado sticky y emoji grande.
  - Cambio de color de fondo sutil al cambiar pasillo.

PILAR 2 — 📖 CATÁLOGO / LIBRITO FÍSICO EN QR
-------------------------------------------------------------------------------
Feature: lib/features/labels/ + lib/features/hardware/

Funcional:
  - Generador de etiquetas térmicas 50x30mm (impresora térmica).
  - PDF imprimible A4 como fallback con QR de productos esenciales.
  - Deep link: alacena://add/{productId}
  - Escaneo desde app → añade 1 unidad directo a lista.
  - Escaneo desde cámara nativa → formulario web prellenado.
  - Botón: "📝 ¿Qué Falta en Casa?" con 12 insumos frecuentes (1 toque).
  - Auto-poblado por alertas de stock mínimo y caducidad.

Visual (v3.2.0-Luxe):
  - PDF A4, 3 columnas × 4 filas = 12 QRs por hoja.
  - Borde punteado por celda, QR 40x40mm corrección H (30%).
  - Nombre producto: Fraunces 20px, centrado.
  - Foto: 20x20mm, unidad y proveedor en 12px.
  - Texto inferior: "Si se acabó, escanea aquí".
  - QR siempre negro sobre blanco, incluso en modo oscuro.

PILAR 3 — 🍷 CAVA & SOMMELIER PRO (CavaPro v6.0)
-------------------------------------------------------------------------------
Feature: lib/features/sommelier/

Campos obligatorios:
  Vintage, País con bandera, Región/D.O., Bodega, Cepa, Estilo, % Alcohol,
  Ubicación física (Cava 1 - Estante A, Nivel 2), Maridaje, Temperatura.

Campos v6.0 (a implementar si no existen):
  Precio compra MXN + fecha → ROI, Proveedor, Importador, País origen,
  Ventana de guarda (año inicio–fin) → alerta "listo para beber",
  Historial de descorches por botella.

Ficha de Cata:
  1-5 estrellas, 80-100 puntos sommelier, notas aroma/boca,
  foto de etiqueta con OCR opcional vía Gemini Vision.

Acciones:
  - Sugerencia de maridaje cruzando con recetas existentes.
  - Descorche atómico: descuenta botella, exige nota, firma audit_trail,
    si stock ≤1 ofrece recompra, si 0 marca agotado conservando historial.

Visual (v3.2.0-Luxe):
  - Card horizontal 2:1 tipo etiqueta editorial.
  - Silueta SVG/CustomPaint de botella según tipo (borgoña, burdeos,
    flauta, jerez).
  - Bodega en Fraunces grande, vintage abajo, región en chip.
  - Puntaje 80-100 en tabular XL, estrellas debajo.
  - Borde izquierdo 6px según estilo:
      tinto #6B1F2E / blanco #C9B24A / rosado #D88A9C
      / espumoso #E8D9A0 / naranja #C8752E
  - Alerta "listo para beber": badge dorado pulsante sutil.
  - Stock: 5 mini-botellas SVG rellenas/llenas.
  - Modal descorche: BackdropFilter blur 16px + foto con vignette +
    sliders grandes + chips de aroma (cereza, cuero, vainilla, tabaco,
    tierra, frutos rojos).

PILAR 4 — 📷 ESCÁNER UNIVERSAL HÍBRIDO v2
-------------------------------------------------------------------------------
Feature: lib/features/hardware/

Códigos soportados:
  EAN-13, EAN-8, UPC-A, UPC-E, Code 128, Code 39, ITF, QR, DataMatrix, NFC.

Funcional:
  - Retícula adaptativa con láser animado.
  - Modo alta velocidad (Modo Lote): pistoleo continuo sin cerrar,
    contador visible.
  - Código desconocido → modal "Producto nuevo" prellenado.
  - Fallback EAN remoto vía Cloud Function globalEanLookup.
  - Cola offline: guarda escaneos y procesa al reconectar.

Visual (v3.2.0-Luxe):
  - Retícula con esquinas animadas (CustomPaint), no solo cuadro.
  - Feedback triple al detectar: tono 880Hz + HapticFeedback.mediumImpact()
    + flash verde.
  - Contador en Modo Lote: tipografía tabular XL 48px.

PILAR 5 — 🍳 COCINA DE RESTAURANTE & BITÁCORA FORENSE v2
-------------------------------------------------------------------------------
Features: lib/features/inventory/ + lib/features/audit_trail/ +
          lib/features/zero_waste/

Funcional:
  - Costeo por plato y porción en $ MXN con merma.
  - Chef IA Zero-Waste: Gemini Vision sugiere recetas con ingredientes
    próximos a caducar.
  - Modo "Cocinar" paso a paso con timers y audio de aviso.
  - Validación stock: si falta, ofrece "🛒 Agregar Faltantes" sin bloquear.
  - "Cocinar y Descontar": resta insumos + firma audit_trail.
  - Foto del platillo → se guarda como "resultado real".
  - Audit trail forense: append-only en Firestore, validación de cadena
    hash SHA-256, banner rojo si se detecta alteración, export PDF firmado.

Visual (v3.2.0-Luxe):
  - Receta: header foto full-bleed 16:9 + gradiente + nombre Fraunces 3xl.
  - Meta: chips de tiempo/porciones/dificultad. Costo porción destacado.
  - Ingredientes: checkboxes visuales, tachado sutil + badge rojo si falta.
  - Modo Cocinar: pantalla completa, tipografía XL, timer circular gigante.
  - Bitácora: timeline visual, NO tabla. Nodos circulares con ícono por
    acción (🛒 compra, 🍷 descorche, 🍳 cocinar, ✏️ edición, 🗑️ eliminación).
  - Encabezado fecha relativa + actor. Delta JSON colapsable en mono.
  - Hash: chip mono 8 chars + ícono candado. Banner integridad
    verde/rojo pulsante.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 5 — ARQUITECTURA OBLIGATORIA
═══════════════════════════════════════════════════════════════════════════════

5.1 CAPA DE DATOS
-------------------------------------------------------------------------------
- Firestore con offline persistence nativa habilitada en main.dart:
    FirebaseFirestore.instance.settings = Settings(
      persistenceEnabled: true,
      cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
    );
- Cache local en dispositivo (Hive o Isar si se requiere estructurado).
- SharedPreferences SOLO para: tema, idioma, última vista, rol activo.
- Esquema versionado (migraciones Firestore documentadas en docs/DATA_MODEL.md).
- Cada entidad tiene SIEMPRE:
    id (String, autogenerado o short ID)
    createdAt (Timestamp server)
    updatedAt (Timestamp server)
    createdBy ({ uid, rol, nombre })
    deletedAt (Timestamp | null) — soft delete obligatorio
    syncStatus (inferido por Firestore)

5.2 MODELO DE DATOS (INFERIDO DEL CÓDIGO REAL — VERIFICAR)
-------------------------------------------------------------------------------
type Rol        = 'admin' | 'cocinera' | 'chofer' | 'camarista' | 'invitado';
type Unidad     = 'pza' | 'kg' | 'g' | 'L' | 'ml' | 'caja' | 'botella' | 'lata';
type Pasillo    = 'carniceria' | 'lacteos' | 'frutas-verduras' | 'abarrotes'
                | 'cava' | 'cafe-panaderia' | 'limpieza';

Product {
  id, shortId, nombre, marca, categoria: Pasillo, unidad: Unidad,
  stockActual, stockMinimo, caducidad?, costoUnitMXN,
  proveedorPreferido?, codigoBarras?, qrAlacena?,
  ubicacionFisica, foto?, notas?,
  createdAt, updatedAt, createdBy, deletedAt
}

Wine {
  id, nombre, bodega, vintage, pais, regionDO, cepa, estilo,
  alcoholPct, precioMXN, fechaCompra, proveedor, paisOrigen, importador,
  ubicacionCava: { cava, estante, nivel }, temperaturaServicioC,
  ventanaGuarda: { inicio, fin }, maridaje[],
  notasCata: { aroma, boca, puntos: 80..100, estrellas: 1..5 },
  stockBotellas, historialDescorches[],
  createdAt, updatedAt, createdBy, deletedAt
}

Recipe {
  id, nombre, porciones, tiempoMin, dificultad,
  ingredientes: [{ productId, cantidad, unidad, mermaPct }],
  costoTotalMXN, costoPorcionMXN, pasos[], foto?, etiquetas[],
  resultadoRealFoto?,
  createdAt, updatedAt, createdBy, deletedAt
}

AuditLog (APPEND-ONLY, sin update ni delete permitidos) {
  id, timestamp, actor: { uid, rol, nombre },
  accion, entidad, entidadId, delta,
  hashPrevio, hashActual
}

5.3 REGLAS DE NEGOCIO CRÍTICAS
-------------------------------------------------------------------------------
R1. Audit trail forense real:
      hashActual = SHA256(hashPrevio + JSON(entrada))
    Validación de cadena al arrancar. Banner rojo si se rompe.
    Firestore rules DEBEN prohibir update/delete en esta colección.

R2. Alerta stock: si stockActual ≤ stockMinimo → auto-add a "¿Qué Falta?"

R3. Alerta caducidad: ≤7 días ámbar, ≤2 días rojo.

R4. Descorche atómico: descuento + nota + audit_trail + stock. Cero → agotado.

R5. Costeo receta: cantidad * (1 + mermaPct/100) * costoUnitMXN
    Recalcular SIEMPRE al abrir receta con costo vigente.

R6. Conversión unidades: kg↔g, L↔ml, botella↔ml (750 default).
    NUNCA sumar unidades incompatibles sin convertir.

R7. Offline-first real: escrituras Firestore con persistencia offline,
    UI optimista, sync al reconectar, reintentos exponenciales.

5.4 ROLES Y PERMISOS
-------------------------------------------------------------------------------
| Acción                | admin | cocinera | chofer | camarista | invitado |
|-----------------------|-------|----------|--------|-----------|----------|
| Ver despensa          |  ✅   |    ✅    |   ✅   |    ✅     |    ✅    |
| Editar stock          |  ✅   |    ✅    |   ❌   |    ✅     |    ❌    |
| Añadir a lista súper  |  ✅   |    ✅    |   ✅   |    ✅     |    ✅    |
| Editar cava           |  ✅   |    ❌    |   ❌   |    ❌     |    ❌    |
| Descorchar vino       |  ✅   |    ❌    |   ❌   |    ❌     |    ❌    |
| Cocinar y descontar   |  ✅   |    ✅    |   ❌   |    ❌     |    ❌    |
| Ver audit trail       |  ✅   |  ✅(prop)|✅(prop)|  ✅(prop) |    ❌    |

Selección de rol en primer arranque (persistida). Cambio requiere PIN admin.
Validación OBLIGATORIA en firestore.rules por custom claims:
    request.auth.token.rol == 'admin'

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 6 — SISTEMA DE DISEÑO (FLUTTER THEME v3.2.0-Luxe)
═══════════════════════════════════════════════════════════════════════════════

Estructura a crear:
lib/core/theme/
├── app_theme.dart           → ThemeData claro + oscuro
├── app_colors.dart          → Paleta Luxe Cream + Midnight Cava
├── app_typography.dart      → TextTheme Fraunces/Inter/JetBrains
├── app_spacing.dart         → Constantes de espaciado (4px scale)
├── app_shadows.dart         → BoxShadow multicapa
├── app_radius.dart          → BorderRadius constantes
└── app_theme_extension.dart → ThemeExtension para tokens custom

6.1 TIPOGRAFÍA (Google Fonts)
-------------------------------------------------------------------------------
- Fraunces    → TextTheme.displayLarge / displayMedium / headlineLarge
- Inter       → TextTheme.bodyLarge / bodyMedium / labelLarge
- JetBrainsMono → TextStyle custom para precios/códigos (fontFeatures:
                 [FontFeature.tabularFigures()])

Escala:
  displayHero:   48px / 1.05 / w600  (Fraunces)
  displayLarge:  36px / 1.15 / w600  (Fraunces)
  displayMedium: 28px / 1.25 / w600  (Fraunces)
  headlineLarge: 22px / 1.35 / w500  (Inter)
  bodyLarge:     16px / 1.6  / w400  (Inter)
  bodyMedium:    14px / 1.5  / w400  (Inter)
  labelSmall:    12px / 1.4  / w500  (Inter)
  numericLarge:  24px / 1.2  / w600  (JetBrains Mono, tabular)

6.2 COLORES MODO CLARO — Luxe Cream
-------------------------------------------------------------------------------
surface:          #FAF7F2   (fondo base)
surfaceContainer: #FFFFFF   (elevated)
surfaceContainerHighest: #F0EBE2 (sunken)
onSurface:        #1A1614   (tinta primaria)
onSurfaceVariant: #5C544D   (tinta secundaria)
outline:          #E8E1D5   (borde suave)
outlineVariant:   #C9BFAD   (borde fuerte)

6.3 COLORES MODO OSCURO — Midnight Cava
-------------------------------------------------------------------------------
surface:          #12100E
surfaceContainer: #1C1916
surfaceContainerHighest: #0A0908
onSurface:        #F2EDE4
onSurfaceVariant: #B8AFA3
outline:          #2A2521
outlineVariant:   #3D3630

6.4 ACENTOS POR PILAR (extensión ThemeExtension)
-------------------------------------------------------------------------------
accentSuper:  #C8542A → #E5724A    (terracota, shopping_list)
accentCava:   #6B1F2E → #A83A50    (vino tinto, sommelier)
accentCocina: #B8860B → #E0B441    (dorado antiguo, recipes)
accentAudit:  #2C4A52 → #5C8894    (azul pizarra, audit_trail)
accentQR:     #1F4D3A → #3D8B6E    (verde bosque, labels)

6.5 SEMÁNTICOS
-------------------------------------------------------------------------------
success: #2F7D5C
warning: #C08A1E
danger:  #B33A3A
info:    #3A6EA5

6.6 SOMBRAS MULTICAPA (BoxShadow)
-------------------------------------------------------------------------------
shadowSm: [
  BoxShadow(color: Color(0x0F1A1614), blurRadius: 2, offset: Offset(0,1)),
  BoxShadow(color: Color(0x0A1A1614), blurRadius: 3, offset: Offset(0,1)),
]
shadowMd: [
  BoxShadow(color: Color(0x0D1A1614), blurRadius: 4, offset: Offset(0,2)),
  BoxShadow(color: Color(0x0F1A1614), blurRadius: 12, offset: Offset(0,4)),
]
shadowLg: [
  BoxShadow(color: Color(0x0D1A1614), blurRadius: 8, offset: Offset(0,4)),
  BoxShadow(color: Color(0x141A1614), blurRadius: 32, offset: Offset(0,12)),
]
shadowXl: [
  BoxShadow(color: Color(0x0F1A1614), blurRadius: 16, offset: Offset(0,8)),
  BoxShadow(color: Color(0x1A1A1614), blurRadius: 48, offset: Offset(0,24)),
]

6.7 RADIOS
-------------------------------------------------------------------------------
radiusSm:   BorderRadius.circular(6)
radiusMd:   BorderRadius.circular(10)
radiusLg:   BorderRadius.circular(16)
radiusXl:   BorderRadius.circular(24)
radiusFull: BorderRadius.circular(999)

6.8 ESPACIADO (escala 4px)
-------------------------------------------------------------------------------
space1:  4.0   space2:  8.0   space3:  12.0   space4: 16.0
space5: 24.0   space6: 32.0   space7:  48.0   space8: 64.0

6.9 MOVIMIENTO (Curves + Duration)
-------------------------------------------------------------------------------
easeOut:    Curves.easeOutCubic
easeInOut:  Curves.easeInOutCubic
easeSpring: Curves.elasticOut  (o Curve personalizada)

durFast: Duration(milliseconds: 150)
durBase: Duration(milliseconds: 240)
durSlow: Duration(milliseconds: 400)

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 7 — ESTÁNDARES VISUALES POR COMPONENTE (FLUTTER)
═══════════════════════════════════════════════════════════════════════════════

7.1 HEADER (AppBar)
-------------------------------------------------------------------------------
- Logotipo "ALACENA" en Fraunces 22px, letterSpacing negativo.
- Subtítulo "Despensa · Cava · Cocina" en onSurfaceVariant.
- Chip de versión: Container con surfaceContainerHighest, radiusFull.
- Selector de rol como CircleAvatar + nombre, no dropdown técnico.
- Sticky con BackdropFilter blur(12) si es posible.
- Borde inferior 1px outline, sin sombra dura.

7.2 NAVEGACIÓN
-------------------------------------------------------------------------------
- NavigationBar de Material 3 en móvil.
- NavigationRail en desktop/tablet.
- Color de acento por pilar (usar ThemeExtension).
- Ítem activo: relleno + color acento. Inactivo: outline + tertiary.
- Transición: PageTransitionSwitcher con cross-fade 240ms + slide Y 8px.

7.3 CARDS BASE (ProductCard)
-------------------------------------------------------------------------------
- Container con surfaceContainer, borde 1px outline, radius lg, shadowSm.
- Hover/press: translateY(-2px) + shadowMd, 240ms easeOut.
- Foto 64x64 radius md (ClipRRect). Nombre bodyLarge w500.
- Marca bodyMedium onSurfaceVariant.
- Precio JetBrainsMono tabular numericLarge, alineado derecha.
- Badge stock: Container pill esquina superior derecha.
- Barra stock: 4px alto sobre borde inferior, color según estado.
- Tap target completo ≥64px (InkWell + padding).

7.4 MODALES (showDialog / showModalBottomSheet)
-------------------------------------------------------------------------------
- BackdropFilter blur(16) + Container color: Colors.black54.
- Modal: surfaceContainer, radius xl, shadowXl.
- Entrada: scale(0.96→1) + fade 240ms easeOut.
- Salida: scale(1→0.98) + fade 180ms.
- Close: IconButton 48x48 arriba derecha.
- Cerrar con Escape (Shortcuts/Actions) y swipe-down.
- FocusScope con autofocus. Body scroll lock.
- Móvil: showModalBottomSheet con handle (drag handle) visible.

7.5 FORMULARIOS
-------------------------------------------------------------------------------
- Agrupación visual por secciones, separadores space6.
- Inputs 48px alto (TextField con contentPadding), radius md.
- Focus: borde accent 2px + sombra suave.
- Error: borde danger + helper + ícono.
- Éxito: AnimatedSwitcher con checkmark verde.
- Cantidad: stepper ± 56x56.
- Unidad: ChoiceChip pills, NO DropdownButton.
- Ubicación cava: mapa visual mini (CustomPaint).

7.6 ESTADOS VACÍOS
-------------------------------------------------------------------------------
Por pilar con ilustración SVG (flutter_svg) minimalista:
  - Súper:   "🛒 Tu carrito está limpio. Añade lo que falta en casa."
  - Cava:    "🍷 Tu cava está esperando su primera botella."
  - Recetas: "🍳 Aún no hay recetas. Empieza con un clásico."
  - Bitácora:"📖 La historia comienza con tu primera acción."

7.7 SKELETONS
-------------------------------------------------------------------------------
- Package: shimmer o skeletonizer.
- Nunca CircularProgressIndicator en listas.
- Shimmer 1.5s easeInOut infinite.
- Misma forma que contenido final (sin saltos de layout).

7.8 MICRO-INTERACCIONES
-------------------------------------------------------------------------------
Feedback triple en acciones críticas:
  1. Visual (AnimatedContainer / ScaleTransition)
  2. Audio (audio_feedback_service.dart con 440/660/880Hz)
  3. Háptico (HapticFeedback.lightImpact / mediumImpact / heavyImpact)

Animaciones obligatorias:
  - Botón presionado: ScaleTransition scale(0.97) 100ms.
  - Palomear: checkmark con AnimatedCheck (SVG stroke-dasharray).
  - Guardar: card pulsa + partícula hacia arriba (CustomPaint).
  - Eliminar: AnimatedSize + fade 240ms.
  - Cambio vista: PageTransitionSwitcher 240ms.
  - Modal abrir: scale(0.96→1) + fade 240ms.
  - Toast: Overlay desde arriba con Curves.elasticOut.
  - Error: shake horizontal 300ms (AnimationController custom).

CERO: CircularProgressIndicator en listas, fade-in página completa,
bounce excesivo, rotaciones 360°.

7.9 MODO OSCURO
-------------------------------------------------------------------------------
- Paleta propia Midnight Cava, no inversión.
- Fondos cálidos oscuros, texto cálido claro.
- Acentos MÁS saturados en oscuro.
- Imágenes: ColorFiltered brightness(.9) contrast(1.05).
- QR: NUNCA invertir (siempre negro sobre blanco).
- Auto-switch 20:00–07:00 con override manual.
- Transición: AnimatedTheme 400ms, sin flash blanco.

7.10 ACCESIBILIDAD
-------------------------------------------------------------------------------
- Contraste AA mínimo, AAA en textos críticos.
- Focus visible SIEMPRE (FocusableActionDetector + outline).
- Nunca comunicar solo por color.
- MediaQuery.disableAnimations respetado.
- MediaQuery.platformBrightness respetado.
- Tamaño tocable mínimo 48x48.
- Zoom 200% sin romper layout (Flexible + FittedBox).
- Semantics(label:) en cada ícono funcional.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 8 — REGLAS TÉCNICAS OBLIGATORIAS
═══════════════════════════════════════════════════════════════════════════════

1.  MONEDA: siempre $ MXN, NumberFormat.currency(locale:'es_MX', symbol:'\$').
2.  SERVIDOR: $0/mes Spark, sin Cloud Functions facturables.
    Si Gemini se usa, mantener dentro del free tier.
3.  OFFLINE: Firestore persistence + UI optimista + cola sync.
4.  BUILD: flutter analyze + flutter test + flutter build web --release.
5.  DEPLOY: firebase deploy --only hosting:alacena-app
             --project alacena-enterprise-prod
6.  VERSIONADO: MAJOR.MINOR.PATCH-Nombre-Codename.
    Visible en AppBar y en ChangelogScreen.
7.  ACCESIBILIDAD: WCAG AA mínimo.
8.  IDIOMA: español de México, cero términos técnicos visibles.
9.  PRUEBAS: units, costos receta, hash audit_trail, migraciones.
10. DEPENDENCIAS: justificación escrita (peso/mantenimiento/licencia/costo).

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 9 — FASES DE EJECUCIÓN
═══════════════════════════════════════════════════════════════════════════════

FASE 0 — AUDITORÍA Y CORRECCIONES CRÍTICAS (v3.0.0)
  - Verificar firestore.rules (audit_trail append-only).
  - Verificar secrets (firebase_options.dart en .gitignore).
  - Verificar audio_feedback_mobile.dart existe.
  - Añadir tests base (units, costeo, audit hash).

FASE 1 — ALERTAS (v3.0.1)
  - Stock mínimo visible en Home.
  - Caducidad próxima destacada.
  - Vinos listos para beber.

FASE 2 — CAVAPRO v6 (v3.0.2)
  - ROI, ventana de guarda, historial, maridaje cruzado.

FASE 3 — RECETAS v2 (v3.0.3)
  - Merma, modo cocinar, costo recalculado, foto resultado.

FASE 4 — AUDIT TRAIL v2 (v3.0.4)
  - Cadena SHA-256, verificación, export PDF firmado.

FASE 5 — PWA + OFFLINE REAL (v3.0.5)
  - Persistencia Firestore confirmada, cola sync robusta.

FASE 6 — ESCÁNER v2 (v3.0.6)
  - Modo Lote, cola offline, alta producto nuevo.

FASE 7 — QA + ACCESIBILIDAD (v3.0.7)
  - Pruebas con cocinera/chofer, ajustes contraste.

FASE 8 — SISTEMA DE DISEÑO LUXE (v3.1.0)
  - Tokens en lib/core/theme/.
  - Tipografía editorial.
  - Paleta Luxe Cream + Midnight Cava.
  - Sombras multicapa, radios, espaciado, movimiento.

FASE 9 — UI OVERHAUL POR PILAR (v3.2.0)
  - Header con identidad de marca.
  - Cards unificadas.
  - Modo "Caminando por el Súper".
  - CavaPro ficha editorial + modal descorche luxe.
  - Recetas layout revista.
  - Bitácora timeline visual.
  - Estados vacíos ilustrados.
  - Skeletons.
  - Micro-interacciones triple.

CADA FASE:
  → Termina con flutter analyze limpio.
  → Commit atómico.
  → Bump de PATCH.
  → Entrada en ChangelogScreen.
  → Actualización del AppBar visible.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 10 — ENTREGABLES POR VERSIÓN
═══════════════════════════════════════════════════════════════════════════════

v3.0.0 — Correcciones críticas y tests base:
  1.  firestore.rules verificado y endurecido
  2.  firebase_options.dart fuera de git (si aplica)
  3.  audio_feedback_mobile.dart completo
  4.  test/core/services/units_test.dart
  5.  test/features/recipes/costeo_test.dart
  6.  test/features/audit_trail/hash_chain_test.dart

v3.0.1 → v3.0.7 — Features por pilar (ver Fases 1-7)

v3.1.0 — Sistema de diseño Luxe:
  1.  lib/core/theme/app_theme.dart
  2.  lib/core/theme/app_colors.dart
  3.  lib/core/theme/app_typography.dart
  4.  lib/core/theme/app_spacing.dart
  5.  lib/core/theme/app_shadows.dart
  6.  lib/core/theme/app_radius.dart
  7.  lib/core/theme/app_theme_extension.dart

v3.2.0 — UI Overhaul por pilar:
  1.  Header refactorizado con identidad de marca
  2.  NavigationBar con color por pilar
  3.  ProductCard unificada
  4.  Modo "Caminando por el Súper"
  5.  CavaPro ficha editorial + modal descorche luxe
  6.  Recetas layout revista + modo cocinar full screen
  7.  Bitácora timeline visual
  8.  Estados vacíos ilustrados por pilar
  9.  Sistema de skeletons con shimmer
  10. Motor de micro-interacciones (visual+audio+háptico)
  11. Modal base con blur backdrop + spring
  12. Formularios con agrupación visual
  13. QR imprimible A4 3x4 pulido
  14. Modo oscuro Midnight Cava pulido

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 11 — MEJORAS "WOW" EN COLA (REQUIEREN APROBACIÓN)
═══════════════════════════════════════════════════════════════════════════════

B1. MODO INVENTARIO TRIMESTRAL
    Escáner Modo Lote + conteo ciego + reporte diferencias firmado.

B2. LISTA INTELIGENTE DE RECOMPRA
    Cruza audit_trail + stock mínimo + caducidad → sugiere lista antes
    de que la pidan. Reactivo → predictivo sin IA, solo reglas.
    (Ya existe predictiveConsumptionCron en functions/index.js — evaluar
    si reemplaza o complementa esta mejora).

B3. MODO FIESTA / CENA
    Dado N invitados + receta → cantidades exactas, mermas multiplicadas,
    lista de súper generada, maridaje de vinos sugerido desde cava.

B4. RECONOCIMIENTO DE ETIQUETAS DE VINO POR FOTO (OCR)
    Gemini Vision → prellenar AddWineModal automáticamente.

B5. TIMELINE DE CONSUMO POR PRODUCTO
    "Este aceite de oliva te duró 23 días. Recompra sugerida: viernes."

B6. ASISTENTE CONVERSACIONAL
    "¿Qué puedo cocinar con lo que tengo?" → Gemini analiza despensa.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 12 — PROTOCOLO DE MEJORA CONTINUA
═══════════════════════════════════════════════════════════════════════════════

CICLO OBLIGATORIO EN CADA ITERACIÓN:

  PASO 1 — AUDITORÍA
    Antes de tocar código, listar:
      - Archivos a modificar.
      - Archivos a crear.
      - Riesgos detectados.
      - Preguntas abiertas.

  PASO 2 — CONFIRMACIÓN
    Esperar aprobación explícita del usuario antes de codificar.

  PASO 3 — IMPLEMENTACIÓN
    Un commit atómico por cambio lógico.
    Conventional commits: feat, fix, refactor, docs, test, chore.

  PASO 4 — VALIDACIÓN
    flutter analyze → cero errores.
    flutter test → todos pasan.
    flutter build web --release → compila.

  PASO 5 — REGISTRO
    - ChangelogScreen actualizado.
    - Version bump en AppBar.
    - README.md actualizado si aplica.

  PASO 6 — DESPLIEGUE
    firebase deploy --only hosting:alacena-app
      --project alacena-enterprise-prod

  PASO 7 — QA VISUAL
    - Probar en móvil real (Android + iOS).
    - Probar en modo oscuro.
    - Probar sin conexión.
    - Probar con cocinera/chofer si es feature crítica.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 13 — INSTRUCCIÓN FINAL PARA LA IA EJECUTORA
═══════════════════════════════════════════════════════════════════════════════

Antes de escribir una sola línea de código:

  1. Leer este documento completo.
  2. Listar archivos a tocar y a crear.
  3. Confirmar el modelo de datos y las reglas de Firestore.
  4. Preguntar cualquier ambigüedad ANTES de codificar.
  5. Ejecutar fase por fase, mostrando diff y build limpio al cierre.
  6. NO inventar features fuera de este prompt.
     Si detecta mejora crítica, proponer explícitamente y esperar aprobación.
  7. Si un cambio visual obliga a tocar lógica → descartar.
     La lógica ya funciona. Solo se viste mejor.
  8. Idioma de respuesta al usuario: español MX.
  9. Idioma del código (comentarios, nombres): inglés.
  10. Idioma de la UI visible: español MX.

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 14 — CHECKLIST DE ACEPTACIÓN v3.2.0
═══════════════════════════════════════════════════════════════════════════════

[ ] firestore.rules: audit_trail es append-only verificado
[ ] Secrets fuera del repo (firebase_options.dart en .gitignore)
[ ] Tests base: units, costeo, audit hash — todos pasan
[ ] Los 5 pilares operativos funcionan offline
[ ] Audit trail con cadena SHA-256 verificable
[ ] Roles y permisos aplicados (custom claims + rules)
[ ] Modelo de datos documentado en docs/DATA_MODEL.md
[ ] Design tokens en lib/core/theme/ completos
[ ] Tipografía: Fraunces + Inter + JetBrains Mono cargadas
[ ] Paleta claro (Luxe Cream) y oscuro (Midnight Cava) completas
[ ] Header con logo, subtítulo, versión, selector de rol
[ ] Nav con color de acento por pilar
[ ] Cards con sombras multicapa y hover elevado
[ ] Modo "Caminando por el Súper" funcional con audio + háptico
[ ] CavaPro con fichas editoriales y modal de descorche luxe
[ ] Recetas con layout revista y modo cocinar full screen
[ ] Bitácora como timeline visual, no tabla
[ ] Estados vacíos con ilustración en cada pilar
[ ] Skeletons con shimmer en todos los listados
[ ] Micro-interacciones triple (visual + audio + háptico)
[ ] Modales con blur backdrop y animación spring
[ ] Formularios con agrupación visual y steppers grandes
[ ] QR imprimible con layout A4 3x4 pulido
[ ] Dark mode Midnight Cava pulido y validado
[ ] Contraste AA verificado en cada par
[ ] flutter analyze limpio
[ ] flutter test: todos pasan
[ ] flutter build web --release: compila
[ ] Deploy exitoso a alacena.cobertores.com
[ ] ChangelogScreen actualizado a v3.2.0
[ ] AppBar refleja v3.2.0-Titanium-Aurora-Flutter
[ ] QA manual firmado por al menos un usuario no técnico

═══════════════════════════════════════════════════════════════════════════════
SECCIÓN 15 — PREGUNTAS ABIERTAS (RESOLVER ANTES DE v3.0.0)
═══════════════════════════════════════════════════════════════════════════════

P1. ¿Dónde está firestore.rules exactamente? ¿En raíz, firebase/, functions/?
P2. ¿El audit_trail actual permite update/delete o es append-only?
P3. ¿El RBAC usa custom claims o campo en documento de usuario?
P4. ¿Existe firebase_options.dart y está commiteado con secrets reales?
P5. ¿Existe audio_feedback_mobile.dart o solo stub + web?
P6. ¿Existe carpeta test/ con tests reales?
P7. ¿La migración a React 19 está activa o es experimental?
P8. ¿Qué versión de Flutter y Dart está en uso real?
P9. ¿Existe lib/core/theme/ o los colores están hardcodeados?
P10. ¿Cuál es el dominio canónico final: alacena.cobertores.com
     o alacena-enterprise-prod.web.app?

═══════════════════════════════════════════════════════════════════════════════
FIN DEL PROMPT MAESTRO — v3.2.0-Titanium-Aurora-Flutter
═══════════════════════════════════════════════════════════════════════════════
