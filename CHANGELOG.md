# CHANGELOG — Alacena

Historial de versiones de la app web (React + Vite + Firebase).
Fuente: `frontend/src/components/changelog/ChangelogModal.jsx`, el historial que
la propia app muestra en pantalla. Este archivo es solo el espejo en la raíz
del repo; la fuente canónica sigue siendo el modal.

## 3.12.1 — 11 noviembre 2026 · El botón de Google, que mande al login

Corrección urgente sobre la 3.12.0, reportada por Paco desde su iPhone:
«Al apretar Entrar con Google no abre nada ni hace nada; debía de
mandarme a un login».

- **Causa:** la puerta y el bloque de conexión intentaban SIEMPRE
  primero la ventana emergente (`signInWithPopup`). En el iPhone
  (Safari o la app instalada en pantalla de inicio) la emergente no
  se abre o queda colgada; la promesa no se resolvía hasta el corte
  de 60 s y el error se pintaba solo en el bloque «Alacena & QR»,
  lejos del botón pulsado. Para el usuario: un minuto de «no hace
  nada».
- **Flujo según dispositivo (`utils/authFlow.js`, puro y con
  tests):** en entorno móvil/táctil (UA de iOS/Android o
  `pointer: coarse`) o instalado/standalone, la primera vía es la
  REDIRECCIÓN en esta pestaña, que manda a la página de login de
  Google (viable como vía principal desde que la 3.12.0 fijó el
  `authDomain` al dominio propio). En escritorio se mantiene la
  emergente primero.
- **La puerta responde en su sitio:** `ConnectHouseGate` muestra su
  propio estado al pulsar («Abriendo el acceso de Google…») y pinta
  el error dentro de su panel, escuchando `alacena-auth-error`
  (CloudStatus ahora también anuncia sus fallos terminales con ese
  evento). Si la redirección volvió vacía, el botón de la puerta
  ofrece la ventana de Google como plan B en el mismo sitio.
- **Respaldo automático ampliado:** si la emergente falla con
  `auth/popup-closed-by-user`, `auth/cancelled-popup-request` o
  `auth/timeout` (además de bloqueada o no admitida), el acceso
  continúa solo por redirección avisando «Te llevo a la página de
  Google…». Sin regresiones: escritorio, sello de conexión,
  reconexión por claims y REVIEW_MODE quedan como estaban.

## 3.12.0 — 11 noviembre 2026 · Conexión siempre viva

Ronda pedida por Paco tras el incidente del súper (la app se abría «toda vacía»
sin pedir usuario, con la lista real en la nube):

- **Causa raíz del acceso roto:** la app se sirve en alacena.cobertores.com pero
  el `authDomain` quedaba fijo en `alacena-enterprise-prod.firebaseapp.com`; con
  el almacenamiento particionado de los navegadores actuales, `signInWithRedirect`
  volvía sin resultado y la sesión nunca se completaba. Ahora el `authDomain` se
  deriva del dominio que sirve la app (`utils/authDomain.js`, con test), y el
  handler `/__/auth/handler` responde en el propio dominio.
- **La conexión se deriva de la cuenta:** al arrancar con sesión, si la casa
  activa del dispositivo no está entre las casas autorizadas de los claims
  (`households`), la app conecta sola la principal de la cuenta
  (`pickClaimsHouse`, con tests). Lo guardado en el aparato es solo caché.
- **Nada de vacíos silenciosos:** sin sesión y sin elección expresa, la primera
  pantalla es la puerta «Tu casa aún no está conectada en este dispositivo» con
  el acceso de Google delante; «Usar solo en este dispositivo» es una elección
  explícita y secundaria. Sin conectar, la lista se etiqueta «Lista de este
  dispositivo (sin conectar)» en la tarjeta de próxima compra y con un aviso en
  la lista y en el Modo Súper; con casa conectada pero lectura fallida, se
  muestra un estado de ERROR distinto del vacío real.
- **Acceso resiliente:** si la ventana emergente no puede abrirse, el acceso
  continúa automáticamente por redirección; si la redirección vuelve sin
  usuario, la app lo detecta (marca de intento) y explica el motivo ofreciendo
  la ventana emergente. Ningún botón se queda sin abrir nada ni sin explicación.
- **Indicador permanente en cabecera:** sello «Casa conectada / Conectando… /
  Sin conectar / Error de conexión» junto al ONLINE (que es solo la red), con
  el nombre real de la casa en el título.
- **Lotes FEFO en todas las vías (P1):** cocinar (`planRecipe`, con test),
  descorchar, devolver una compra y recibir la compra (lista y ticket) ya
  descuentan o alimentan los lotes por caducidad igual que el QR; la recepción
  usa la caducidad de la línea si la trae.

## 3.11.0 — 10 noviembre 2026 · Inventario y QR

Ronda pedida por Paco («arregla todo y mejora todo») SIN tocar recetas ni cocinar:

- **Stock bajo → lista (arreglo):** diagnóstico del producto bajo mínimo que no
  entraba en la lista y test de regresión en functions (ver informe de la ronda).
- **QR con cantidad real:** chips por unidad (kg/l: 0,1 · 0,25 · 0,5 · 1, a 3
  decimales; piezas/botellas: 1) y botón «Deshacer» en el modal de escaneo rápido;
  el modal ya muestra la existencia viva tras cada movimiento.
- **Ficha «Incompleto»:** marca en Inventario (tarjetas y tabla), contador en el
  resumen y filtro propio para productos sin código, sin caducidad, sin zona o
  sin stock mínimo. No bloquea guardar: solo señala.
- **Lotes por caducidad (FEFO):** `lots: [{expiryDate, quantity}]` por producto,
  editor en el modal de producto; al consumir se descuenta primero del lote que
  antes vence y la fecha visible sigue al lote vigente más próximo. Productos
  sin lotes: comportamiento idéntico al anterior.
- **Recibir la compra en un paso:** la confirmación de compra permite corregir
  la cantidad real por artículo (0 = no comprado); todas las vías reconcilian
  parcial: el resto no comprado queda pendiente en la lista.
- **Alta rápida por zonas:** zona destino visible y persistente en el escáner
  (misma clave que el alta manual), foco en el nombre cuando el código es
  desconocido (nunca se inventa) y «Guardar y siguiente» en el alta manual
  conservando la zona.

## Funciones en la nube — 6 noviembre 2026 · DESPLEGADAS · PRODUCCIÓN

El consumo predictivo y las alertas de stock ya corren en la nube.

- **Tres funciones en vivo:** la búsqueda de códigos (EAN), las alertas de stock
  al cambiar un producto y el consumo predictivo diario ya están desplegados y
  corriendo (us-central1, Node 22, despliegue automático con WIF, plan Blaze).
- **Reescritas al modelo real:** ahora trabajan sobre `products`, `shopping_list`
  y `audit_logs` por `householdId`, como hace la app. Antes usaban el modelo
  antiguo de `workspaces`, que la app ya no usa.

## Sin publicar (rama `fix/mejoras-seguras-2026-11-05`, PR #2)

Revisión final antes de fusionar: sin cambios de comportamiento salvo lo indicado.

- **Caducidad en días de calendario:** inventario, badge de alertas, Resumen Diario
  y Chef Zero-Waste ya no calculan `Math.ceil` sobre milisegundos (el mismo producto
  marcaba 2d por la noche y 3d por la mañana, y una fecha inválida acababa en
  "Vence en NaNd"). Nuevo `daysUntilExpiry()` en `utils/productExpiry.js` (hoy = 0,
  mañana = 1, ayer = -1), con los mismos umbrales (3/4/6/15 días); el Resumen Diario
  muestra "8 nov 2026" en vez del ISO y "Vence hoy" para el día 0. 4 tests nuevos.
- **Accesibilidad:** los 24 botones de cierre de modal que solo mostraban una ✕ ya
  tienen `aria-label="Cerrar"` (el escáner y el diagnóstico ya lo tenían).
- **PWA:** colores del manifiesto alineados con el tema oscuro de la app.
- **Limpieza:** dos variables muertas menos en `depletionPredictorService`.

## v3.10.2-Casa — 5 noviembre 2026 · ACTUAL · PRODUCCIÓN

Cocinar descuenta bien, el súper afina los kilos y la nube ya separa las casas.

- **Cocinar sin sorpresas:** antes de descontar se ve qué se descuenta y qué falta
  (porciones escaladas, unidades convertidas y solo la casa activa); si falta algo,
  no se descuenta nada y lo dice con nombres.
- **Súper y despensa a 3 decimales:** los steppers de kilos y litros van de 0,1 en 0,1
  y la cantidad de una tarjeta del súper se corrige tocándola, sin borrarla.
  El alta rápida ya sugiere litros o kilos según lo que escribas.
- **Nube por casa:** la sincronización ya solo trae la casa activa (la otra casa no se
  toca al cambiar) y el deshacer del súper recuerda los 3 últimos borrados.
- **Datos de ejemplo en zona de peligro:** el botón ahora dice que borra todo, va en
  rojo y separado, y no se puede usar con una casa conectada. El silencio está a un
  toque en la barra principal y el botón Escanear ya no pulsa sin parar.
- **Foto propia y escáner simple:** el alta manual admite foto del producto (cámara o
  galería) y el escáner abre en modo simple con el modo recordado visible y los demás
  colapsados.

## v3.10.1 — 5 noviembre 2026

Guardia anti-vaciado y caducidad unificada (ítems E1 y E4 de la auditoría del 30-oct).
Esta versión no tiene entrada propia en el modal; el contenido procede del commit
`39e94a8` y de la auditoría del 5-nov-2026.

- **E1 — Guardia anti-vaciado en primera conexión a la nube:** al conectar por primera
  vez, modal para elegir subir o descargar, nunca vaciar (`CloudFirstConnectModal`,
  con tests en `cloudSyncGuard.test.js`).
- **E4 — Caducidad unificada a `expiryDate`:** badge de alertas y Resumen Diario
  contando por vencer (con tests en `productExpiry.test.js`).
- Pendiente de veredicto de Paco en su iPhone (segundo teléfono para E1; badge y
  Resumen Diario para E4).

## v3.9.5-Casa — 29 octubre 2026

El escáner ya abre su propia cámara, y deja registro de lo que pasa.

- **Adiós a la cámara prestada:** la app abre la cámara ella misma y muestra su propio
  video, en vez de depender de la librería que se quedaba en negro en el iPhone.
  Si el video no abre, ahora se sabe por qué.
- **Lectura en dos motores:** si el teléfono trae detector nativo de códigos se usa;
  si no, o si falla, entra ZXing. Los mismos códigos de siempre: QR, EAN, UPC,
  Code 128, Code 39 e ITF.
- **Diagnóstico del escáner en el menú de herramientas:** cada intento de cámara queda
  registrado (permiso, apertura, primer fotograma, reinicios, errores) con botones
  Copiar y Limpiar. Solo datos técnicos: sin fotos, sin códigos y sin contenido de tu
  lista. Si algo falla, copia el registro y pásalo a quien lo revisa.
- **Lo demás intacto:** QR/Barras, Ticket, Escribir, las cuatro acciones al detectar,
  Modo Súper y Tomar Foto con Cámara Nativa siguen igual.

## v3.9.4-Casa — 29 octubre 2026

La cámara nunca más en negro en silencio, y botones sin encimarse.

- **Aviso visible mientras conecta:** con la cámara activa pero sin imagen todavía, el
  marco muestra "Conectando imagen…". Ya no hay cuadro negro sin explicación.
- **Error rápido, no a los 20 segundos:** si en 12 segundos no llega un solo fotograma
  real, aparece el error con Reintentar y Tomar Foto, aunque queden reinicios. Y si la
  cámara tarda más de 15 segundos en abrir (aviso de permiso sin contestar), también
  avisa qué revisar.
- **El vigilante solo sigue el video de verdad:** ignora el video oculto sin stream que
  dejaba la librería, y al reiniciar deja 300 ms para que el iPhone libere la cámara
  antes de reabrirla.
- **"Modo Súper" ya no tapa a "Guardar artículos":** cuando la barra de guardar está
  visible, el botón naranja sube por encima de ella.
- **Una sola versión en toda la app:** el menú Más y el menú de herramientas ya no
  presumen versiones sueltas (v5.0, v3.7.0): ambos muestran la versión real de Alacena.
- **Botones del escáner completos:** las acciones ("+1 Entrada Despensa", "−1 Salida
  Consumo") ya no salen cortadas; el texto se ajusta en dos líneas si hace falta.
- **El menú de herramientas ya se cierra al navegar:** tocar fuera del menú (incluida la
  barra inferior) lo cierra; antes quedaba abierto tapando la vista nueva.
- **Modo Súper con salida a la vista:** además del botón pequeño de arriba, ahora hay un
  botón grande "Salir del modo súper" abajo, y el contador solo muestra ✓ cuando de
  verdad llevas todo.
- **Nada queda bajo la barra inferior:** la lista deja aire al final para que el filtro
  "Todas las tiendas" y el último contenido nunca queden tapados por la navegación.

## v3.9.3-Casa — 28 octubre 2026

Escáner con vigilante persistente: el video negro ya no se esconde tras los metadatos.

- **Sano solo si hay fotogramas de verdad:** el vigilante ya no se fía de que el video
  tenga metadatos y ancho (en iOS eso puede ser negro total); ahora exige que el reloj
  del video avance entre muestras. Reloj quieto = video negro, aunque todo lo demás
  parezca bien.
- **El vigilante ya no se retira nunca:** mientras el escáner esté abierto y activo, sigue
  vigilando el flujo. Un apagón tardío (aviso del sistema, cambio de app) también se
  recupera: reinicia el escáner hasta 3 veces y, si sigue sin imagen, muestra el error
  con Reintentar y Foto en vez de un cuadro negro muerto.
- **El fallo de play() ya no se traga en silencio:** si arrancar el video falla (típico
  tras el aviso de permiso), reintenta una vez y si sigue fallando dispara el reinicio
  del vigilante.

## v3.9.2-Casa — 28 octubre 2026

Auditoría de practicidad: nada que borre datos sin respaldo, acciones diarias a un toque
y botones de 44 px.

- **"Datos de Ejemplo" ya no borra sin respaldo:** antes de reemplazar despensa, lista,
  zonas, recetas, casas y bitácora, descarga automáticamente una copia de seguridad
  JSON de tus datos reales, y la confirmación advierte que los BORRA.
- **📸 Foto de lista en el home del Súper:** botón primario junto a "Modo Súper" y
  "Escanear / Ticket", ya no escondido en el menú "…". En la barra móvil,
  "Cava / Más" ahora es "Más".
- **El escáner recuerda su modo:** el último modo elegido (Consultar, Entrada, Consumo
  o Súper) queda guardado y se restaura al abrir; solo la primera vez abre en
  Consultar. La foto de código ya abre la cámara directa.
- **Borrar una zona ya no deja huérfanos:** sus productos se mueven a la primera ubicación
  restante y la confirmación lo dice así.
- **Foto-lista con OCR automático:** al confirmar la foto, el OCR arranca solo (con botón
  Cancelar) y el botón queda solo como reintento.
- **Botones táctiles de 44 px en inventario y "+ Súper" visible en iPhone;** cambiar a un
  rol no-admin avisa que el menú es reducido y cómo volver a Admin; el respaldo ya
  escribe la versión real de la app y las importaciones usan la tienda del ticket o
  "Supermercado", nunca una inventada.

## v3.7.0-Enterprise-Luxe — 13 octubre 2026

Escáner Dual Acelerado por Hardware, Cámara OCR para Tickets y Rediseño Ergonómico Móvil.

- **Escáner de Códigos de Barra Reparado:** Eliminación de restricciones restrictivas de
  resolución WebRTC que crasheaban la cámara en móviles; motor dual con detección
  nativa por BarcodeDetector (GPU/Hardware) y fallback instantáneo a Html5Qrcode para
  EAN-13, EAN-8, UPC y QR.
- **Lector de Tickets y Recibos con Cámara OCR:** Nueva interfaz directa en el escáner
  para fotografiar tickets de compra (Mercadona, Costco, Chedraui, Walmart, Dia),
  extrayendo importes reales, unidades y nombres de producto con inserción en 1 toque
  en la Lista del Súper o ingreso directo a la Despensa.
- **Barra de Navegación Móvil Inferior (Bottom Navigation):** Control ergonómico total
  con el pulgar para teléfonos móviles (Despensa, Súper, Botón central flotante de
  Escáner, Cocina y Cava).
- **Descongestión y Limpieza Visual Integral:** Sustitución de la barra saturada de 12
  botones en la Lista de Compras por 3 acciones primarias táctiles y menú de
  herramientas desplegable `⋯`. Header despejado con menú unificado de Ajustes del Hogar.

## v3.5.4-Enterprise-Luxe — 12 octubre 2026

Reconciliación de Ticket de Compra, Canasta Básica Semanal, Resumen Diario y Chef
Zero-Waste.

- **Reconciliación y Recepción de Ticket de Supermercado:** Al ingresar las compras a la
  despensa, modal interactivo para declarar el cobro real de caja en $ MXN, quién
  realizó la compra (chofer, cocinera, etc.) y desglose de ahorro/varianza contra el
  estimado.
- **Canasta Básica Semanal del Hogar:** Botón directo en la lista de compras que
  despliega los 12 insumos indispensables de la casa para agregarlos a la lista en
  1 toque sin escribir.
- **Resumen Diario de Cocina & WhatsApp:** Centro matutino en el encabezado que resume
  alimentos por caducar en ≤4 días, faltantes de stock y botón para enviar el reporte
  formateado a la cocinera por WhatsApp.
- **Chef Zero-Waste (Rescate de Insumos):** Detector en el recetario que cruza
  ingredientes perecederos próximos a vencer con las recetas disponibles para sugerir
  qué cocinar de inmediato.

## v3.5.3-Enterprise-Luxe — 12 octubre 2026

Edición de Catálogos en Línea, Búsqueda Instantánea y Corrección Integral de Impresión QR.

- **Edición y Alta Completa de Catálogos:** Interfaz responsiva que permite crear y
  modificar en línea tiendas, personal que registra, categorías y unidades de medida
  con selector de emojis.
- **Resolución de Hojas QR en Blanco:** Corrección de interpolación en el motor HTML y
  dimensionamiento de iframe (900x1200px) para impresión física 100% nítida y fiel.
- **Diseño Web-Responsive Total:** Optimización en teléfonos móviles (iPhone / Android)
  y tabletas con tap-targets de mínimo 44px y navegación sin recortes.

## v3.5.2-Enterprise-Luxe — 12 octubre 2026

Motor Anti-Duplicados Unificado, Ajuste Directo de Cantidades e Impresión QR en Iframe
Aislado.

- **Motor de Deduplicación Fonética y Ortográfica (`deduplication.js`):** Normalización
  de acentos, plurales (`tomates` vs `tomate`) y raíces compuestas. Se evitan duplicados
  en despensa, lista de compras y recetas.
- **Steppers Táctiles Directos en Lista de Compra:** Botones rápidos `+` y `-` integrados
  en cada tarjeta para alterar cantidades en un solo toque sin abrir formularios modales.
- **Impresión Física QR sin Páginas en Blanco:** Generación a través de iframe aislado
  invisible que renderiza HTML puro blanco con códigos QR en base64 de alto contraste
  para impresión física infalible.

## v3.5.1-Enterprise-Luxe — 12 octubre 2026

Resolución de Hojas QR en Blanco, Vectorización PDF Real y Aislamiento de Impresión.

- **Corrección de Hook Ordering en Modal QR:** Eliminación de condición temprana que
  rompía la ejecución de React (#310), asegurando apertura instantánea sin pantallas
  blancas.
- **Aislamiento CSS @media print:** Desbloqueo de contenedores con scroll para que la
  impresión física (`window.print()`) pagine limpiamente en papel blanco con tinta
  negra de máximo contraste.
- **Motor Vectorial de QR con qrcode:** Generación de matrices QR reales en los 4
  formatos (Stickers para frascos, Tablero maestro de cocina, Collarines de cava y
  Catálogo) para escaneo 100% certero con teléfonos móviles.

## v3.5.0-Enterprise-Luxe — 11 octubre 2026

Multi-Tema y Colores, Catálogos Proactivos, Desduplicación Estricta y Devolución de Compras.

- **Personalización de Temas & Paletas:** 6 temas de lujo (Luxe Noir, Cava Forest, Borgoña
  Gran Reserva, Zafiro Presidencial, Espresso Cobrizo y Modo Claro Luxe Cream) con
  inyección dinámica de CSS variables y guardado local.
- **Centro de Catálogos & Opciones Desplegables:** Gestión centralizada y menús
  interactivos para Tiendas Habituales (Costco, City Market, etc.) y Personal que
  Registra (María, Chef, Chofer, Patrón) con chips de 1 toque y adición instantánea
  en formularios.
- **Motor de Desduplicación y Consolidación de Compras:** Fusión estricta de insumos
  repetidos con suma de cantidades en vez de duplicar filas, más botón "🧹 Desduplicar"
  y "🗑️ Limpiar Marcados".
- **Historial de Compras & Devoluciones:** Registro de órdenes de compra con capacidad de
  eliminar o revertir artículos ingresados por error descontándolos automáticamente
  de la despensa.
- **Eliminación Directa en Inventario:** Botón de borrado con confirmación en tarjetas de
  alacena, cava, tabla y modal de edición.
- **Ecosistema QR Vectorial:** Generador de stickers con líneas de envasado/caducidad para
  botes/sobres, collarines de cava y tablero maestro de pedidos para puertas.

## v3.4.0-Master — 11 octubre 2026

Importador Inteligente OCR, Manual Operativo y Menú Dinámico Configurable.

- **Importador Bidireccional & OCR:** Extracción visual con visión artificial
  Tesseract.js de libretas y tickets con pre-procesamiento de contraste, además de
  soporte para WhatsApp y archivos PDF/TXT.
- **Auditoría & Test Suite Aprobada:** 100% de éxito en pruebas automatizadas de
  extracción de datos, filtrado de saludos y normalización de fracciones (1/2 kg).
- **Menú Dinámico (Ocultar & Agregar Pestañas):** Posibilidad de apagar visibilidad de
  secciones que no se utilicen, renombrar cualquiera y agregar nuevas pestañas
  personalizadas vinculadas a zonas del hogar.
- **Manual e Instructivo Integral en Pantalla:** Guía interactiva de 9 secciones con
  buscador y opción de impresión/PDF para la carpeta del personal.
- **Web NFC & Códigos ALC-XXXX:** Grabación de chips adhesivos con 1 toque y
  auto-generación de códigos permanentes.

## v3.3.0-Perfection — 11 octubre 2026

Operación Proactiva, Lista Imprimible A4/PDF, Maridaje Cava & Respaldo Integral.

- **Hoja de Compras Imprimible & PDF:** Vista previa editorial A4/Carta en blanco y negro
  puro, casillas para pluma [ ], código QR de sincronización y firmas de entrega y
  recepción.
- **Alertas Proactivas de Despensa:** Detección automática en tiempo real de insumos bajo
  stock mínimo de seguridad con generación de lista en 1 clic.
- **CavaPro & Sommelier Maridaje Rápido:** Filtros por ocasión (Cortes & Asados, Pescados,
  Brindis, Gran Reserva) y ventana óptima de consumo.
- **Recepción Rápida de Compras:** Transferencia atómica de insumos comprados a su zona
  física de alacena con actualización patrimonial en $ MXN.
- **Master Prompt Canónico v3.3.0:** Documento de gobernanza unificado y respaldado en
  repositorio con auditoría completa.

## v3.1.0-Luxe — 11 octubre 2026

Fase 8: Experiencia Visual Luxe & Sistema Editorial Patrimonial.

- **Design Tokens Luxe & Tipografía Editorial:** Tipografías Fraunces (títulos
  editoriales), Inter (cuerpo) y JetBrains Mono (valores numéricos tabulares).
- **Paletas Duales:** Luxe Cream y Midnight Cava con acentos por pilar (Súper, CavaPro,
  Cocina, Bitácora, Catálogo QR).
- **Modo "Caminando por el Súper":** Checkboxes táctiles gigantes 56px, tono Web Audio
  660Hz 120ms, vibración háptica y contador sticky de avance.
- **Fichas Sommelier CavaPro:** Vista horizontal 2:1 editorial, silueta SVG de botellas,
  bordes por estilo de vino y descorche luxe con notas sensoriales.
- **Layout Revista en Recetas:** Portadas 16:9 full-bleed, pasos circulares grandes y
  modo cocina inmersivo a pantalla completa.
- **Bitácora Forense Visual:** Timeline vertical con nodos circulares por acción, hash
  SHA-256 de integridad y deltas colapsables.
- **Persistencia Offline Dexie (IndexedDB):** Sincronización transparente sin depender de
  conexión para cuartos fríos y cavas.

## v2.5.0 — 11 octubre 2026

Sommelier Pro, Escáner Dual Súper (EAN-13 / QR), Librito Físico Cocina y Modo Offline.

1. **Sommelier Pro & Añadas:** Vinos con año, país con bandera 🇲🇽 🇪🇸 🇫🇷 🇮🇹, región
   D.O., bodega, uva y estantería de cava.
2. **Ficha de Cata & Calificación:** 1 a 5 estrellas ⭐⭐⭐⭐⭐, puntos sommelier (80-100),
   notas de aroma, boca y descorche con registro a bitácora.
3. **Escáner Híbrido Universal:** Lee códigos de barras lineales de súper (EAN-13 / UPC
   como Coca-Cola) y códigos QR de recipientes.
4. **Librito Físico de Códigos QR:** Catálogo imprimible para pegar en cocina; el personal
   sólo apunta la cámara de su celular al producto terminado.
5. **Captura Rápida "¿Qué Falta en Casa?":** Botones táctiles de insumos frecuentes
   (Coca-Cola, Leche, Huevos) sin enredos.
6. **Impresión y PDF de la Lista del Súper:** Formato físico limpio organizado por
   pasillos con casillas [ ] para tachar con pluma.
7. **Modo Offline Resiliente:** Funciona en sótanos, cámaras frías y supermercados sin
   señal; todo se guarda en el teléfono.
8. **Indicador de Red en Vivo:** Insignia 🟢 Online o 🟡 Offline en la barra superior.
9. **WhatsApp por Pasillos:** Envío de la lista ordenada por departamentos con casillas
   interactivas de texto.
10. **Trazabilidad Forense Automática:** Registro de cada descorche y consumo de cocina
    con responsable y hora exacta.

## v2.4.0 — 11 octubre 2026

Transformación a Web App de Lujo, Audio Sensorial y Control de Zonas.

- **Captura Manual Directa:** Formulario moderno de alta sin escaneo obligatorio de
  código de barras.
- **Gestión de Zonas en 1 Clic:** Renombra o elimina Cava, Cuarto Frío o Alacena
  directamente en los chips con el lápiz ✏️.
- **Motor de Audio Sensorial:** Sonidos mecánicos y chimes armónicos instantáneos
  (Web Audio API) sin latencia.
- **Moneda Estricta MXN ($):** Valuación total en Pesos Mexicanos con costeo por unidad
  y receta.
- **Version Badge Visible:** Acceso permanente a esta bitácora y estado de salud de la
  plataforma.

## v2.3.0 — 11 octubre 2026

Motor de Cocina Tipo Restaurante y Deducción Automática.

- Módulo de Recetas con costeo automático en tiempo real por porción.
- Función "Cocinar y Descontar" con atribución al personal (María, Chef, etc.).
- Bitácora Forense de Auditoría (Audit Trail) inmutable.

## v2.0.0 — 10 octubre 2026

Infraestructura Firebase Spark 0 USD y Cava Sommelier.

- Persistencia offline en Cloud Firestore sin costos de infraestructura.
- Cava digital con control de añadas, denominación y temperaturas.
