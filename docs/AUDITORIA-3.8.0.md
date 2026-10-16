# ALACENA Casa 3.8.0 · revisión del 16 de octubre de 2026

## Cambios revisados

- Lista del súper como inicio, captura rápida, búsqueda, filtros, presupuesto por casa, avisos de precios pendientes y deshacer la última eliminación.
- Entradas y consumos numéricos con tres decimales, validación de existencias y separación por casa, unidad y código. No se mezclan productos con códigos distintos.
- Un único lector de cámara para QR y barras; selección de cámara, luz cuando el dispositivo la permite, foto y captura manual. Una lectura requiere rearmar explícitamente antes de repetirla.
- Búsqueda de productos: inventario de la casa, historial aprendido y Open Food Facts con internet y tiempo límite. Un código desconocido requiere nombre; no se inventan productos ni precios.
- Tickets: OCR español local, reconstrucción de renglones PDF, edición de nombres/cantidades/unidades/precios, selección de artículos y revisión explícita de diferencias contra el total pagado.
- Se conserva el precio unitario válido de la columna del ticket y se calcula correctamente el importe por cantidad. Las compras parciales dejan pendientes en la lista.
- Inventario, pendientes e historial de compra se guardan juntos en un lote de Firestore. El identificador del ticket y las reglas impiden volver a aplicar el mismo ticket sin cambios. La revisión humana sigue siendo necesaria si se modifica su contenido o la fotografía produce un texto diferente.
- Historial con comprador/notas y devolución validada. Se retiraron comparativas precargadas y se separan presentaciones, unidades y monedas en precios.
- Persistencia local tolerante a errores, caché de Firestore y paquete sin conexión con los archivos del lector y OCR. El aviso de disponibilidad aparece después de completar la instalación.
- Google habilitado para el propietario autorizado. Las reglas propuestas requieren correo verificado y permiso de administrador `alacenaAccess`; el selector visual de rol no concede acceso al servidor.
- Carga diferida: JavaScript inicial aproximado de 2.46 MB a 1.19 MB antes de compresión. Persisten módulos grandes y avisos de mantenimiento del código antiguo.

## Comprobaciones reproducibles

Desde `frontend`: `npm ci`, `npm test`, `npm run lint -- --quiet`, `npm run build`.

Las 24 pruebas cubren movimientos, lectura de códigos, casas/unidades, totales, precios, compras parciales, PDFs y fallos de almacenamiento. El comprobador OCR (`node security-checks/ocr-check.mjs`) usa una imagen sintética: confianza 94, dos artículos, total 220. La confianza no garantiza que todo ticket real se lea correctamente.

Las reglas se comprueban con un emulador separado, proyecto `demo-alacena-audit` y puerto 8089: `node security-checks/firestore-check.mjs`. Incluye acceso anónimo/no aprobado/no verificado denegado, tipos/cantidades, auditoría inmutable y rechazo atómico de un ticket repetido. Nunca ejecutar estas pruebas contra producción.

En navegador local se revisaron agregar, marcar, comprar, comprador/notas, historial, consumo fraccionario, lectura de una imagen QR y ticket de demostración con diferencia revisada. Ancho móvil 390 px sin desbordamiento general. No se hicieron compras de prueba en producción.

Se comprobó además recarga de la aplicación con el servidor local apagado. Se corrigió la coincidencia de caché de archivos propios frente a cabeceras Vary del servidor. Firebase Hosting y reglas Firestore publicados; ambos dominios respondieron con la misma revisión y el acceso REST anónimo a productos devolvió 403. Storage no está provisionado: no se publicaron sus reglas ni se crearon servicios de pago.

## Uso sin internet

Abrir una vez con internet y esperar «Lista, escáner y OCR disponibles sin conexión». Iniciar sesión y cargar la casa antes de ir al supermercado. El lector y OCR funcionan con archivos del dispositivo; los productos ya conocidos se reconocen localmente. Un código nuevo no puede consultar internet sin conexión: escribir el nombre y revisar sus datos. No borrar los datos del navegador mientras haya cambios pendientes. La sincronización requiere recuperar conexión y conservar acceso autorizado.

## Límites y trabajo pendiente

- Inicio de sesión real comprobado en navegador: «Lista conectada» y carga de la casa antes del cierre del acceso público. El propietario tiene correo verificado y permiso administrado.
- Prueba física pendiente en iPhone/Android: cámara, enfoque, iluminación, tickets arrugados/largos y cambios de red. La lectura de imagen QR y la prueba OCR no certifican la cámara de todos los teléfonos.
- Las reglas de la aplicación doméstica consideran a las cuentas aprobadas como familia de confianza con acceso a las casas; el aislamiento visual por casa no es aislamiento entre clientes SaaS.
- Las rutas heredadas de workspace requieren una revisión adicional de esquemas/tamaños antes de ofrecer el producto como servicio a terceros. Flutter y funciones antiguas quedan fuera de esta publicación web.
- Las predicciones heredadas son orientativas y no sustituyen un historial real de consumo.
- Datos locales anteriores a conectar la nube se conservan en el respaldo exportable; no se mezclan automáticamente con la casa remota para evitar duplicados.

## Publicación

Producción: https://alacena.cobertores.com y https://alacena-enterprise-prod.web.app. `alacena.bolsas.com` no tiene DNS configurado. `version.json` identifica versión, revisión Git y fecha de compilación. Compilar después del commit y verificar ese identificador tras publicar.
