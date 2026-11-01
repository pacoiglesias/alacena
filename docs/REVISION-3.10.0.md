# Revisión integral de ALACENA · 3.10.0

Base: `305a0df`, versión 3.9.5. Rama: `codex/revision-integral-3-10`. El propietario autorizó posteriormente build, GitHub y deploy en alacena.cobertores.com. Reglas, Storage, Functions y datos de producción sin modificar. Los directorios locales `output/` y `tmp/` son ajenos a esta revisión y se excluyen del repositorio.

## Diagnóstico reproducido antes de corregir

`node frontend/review/reproduce-baseline.mjs` ejecuta los manejadores originales en una máquina virtual sin red y con datos sintéticos:

| Hallazgo | Resultado observado en la base |
| --- | --- |
| Cocina: porciones | La vista evalúa porciones escaladas pero entrega la receta base al manejador. |
| Cocina: casas | Arroz con 10 kg en dos casas termina en 9 kg en ambas al consumir 1 kg en una casa. |
| Cocina: equivalencia | «cafe» no descuenta «Café». |
| Cocina: nube | Cero llamadas de escritura de productos. |
| Ticket masivo | Escritura de cantidad absoluta, sin delta. |
| Historial | 35 documentos del servidor producen sólo 30 elementos visibles. |
| Respaldo | Existe exportación pero no manejador de restauración. |
| Nube vacía | Un producto local pasa a cero filas visibles al recibir el primer resultado vacío del servidor. |
| Demo | No hay guardia de casa conectada. |

Otros diagnósticos: el acceso ya captura errores de Firebase, pero su mensaje es genérico y una promesa pendiente no tiene plazo; no se puede atribuir todo bloqueo a cerrar la ventana. La bitácora no ejecuta verificación SHA-256 y también presenta hashes de adorno para registros sin firma: no basta con ocultar el sello cuando está vacía. El asistente supone un ritmo semanal cuando no hay historial. Las pestañas de cava y zonas no tienen callbacks conectados desde App.

## Entrega

## Correcciones

- Cocina: un único cálculo para disponibilidad y consumo; porciones elegidas, equivalencias de nombres y unidades compatibles, precisión de tres decimales y sólo la casa activa. El consumo se envía como delta a la nube. No se consumen ingredientes faltantes ni unidades incompatibles.
- Compra: confirmación por encima del Modo Súper, estado de guardado, prevención de doble envío y errores visibles. Tickets que reabastecen un producto existente usan deltas para no pisar compras concurrentes.
- Restauración JSON: validación de formato, versión, cantidades y límites; vista previa combinar/reemplazar, confirmación explícita, respaldo previo descargado y copia local. Historial y bitácora existentes no se sobrescriben. Conflictos entre vista previa y confirmación abortan la transacción. Si la nube guardó pero el almacenamiento local falló, el mensaje lo distingue.
- Nube vacía: conserva datos locales hasta elegir subirlos o desconectar; no reemplaza silenciosamente la despensa. Ofrece recuperar la copia anterior a conectar. Demo bloqueada con sesión conectada.
- Acceso: mensajes concretos, reintento, alternativa en la misma pestaña y plazo de 60 segundos para evitar esperas indefinidas. Aviso persistente de almacenamiento exclusivamente local y descarga de respaldo.
- Historial: páginas adicionales sin recorte permanente a 30 registros; conserva los indicadores de devolución.
- Bitácora y asesor: eliminados hashes de adorno, sellos de integridad no comprobada y predicciones sin historial. Se explica cuándo faltan datos.
- Navegación: cava y zonas conectadas; una pestaña activa; menú de perfil cierra con Escape o clic fuera y devuelve el foco. Confirmación de compra y restauración usan diálogo con foco y bloqueo de desplazamiento.
- Móvil: objetivos táctiles de 44 px, estados y paneles adaptables, tema consistente y pasillos sin chips vacíos. Detectado y corregido un fallo adicional: productos antiguos sin categoría bloqueaban el inventario; ahora abren y no generan un filtro vacío.
- Rendimiento: Firebase, base local y herramientas pesadas se cargan por separado; modales sólo se montan al abrir. Dependencias actualizadas sin cambios mayores forzados; auditoría npm sin vulnerabilidades conocidas al revisar.
- Limpieza: eliminado diagnóstico de ticket sin aserciones, conservadas las pruebas útiles e integradas en `npm test`; excluidos artefactos, builds y archivos personales ajenos. No se borraron los archivos personales locales.

## Evidencia y pruebas

`npm test`: 52 pruebas Node y 13 de interfaz, todas aprobadas. `npm run lint -- --quiet`: aprobado. Compilaciones de producción y de revisión: aprobadas; quedan avisos de tamaño para módulos diferidos de Firebase/OCR.

`npm run test:emulator`: cinco pruebas aprobadas en `demo-alacena-review`, usando Auth y Firestore locales: deltas concurrentes, rechazo atómico de restauración conflictiva, restauración válida conservando bitácora, límites de importación y paginación de 40 tickets. Se usan las reglas existentes; no se escriben datos de prueba en producción.

Comprobación visual real con datos sintéticos: restaurar archivo, conectar cuenta ficticia, elegir subir una nube vacía, cocinar cuatro porciones y guardar una compra desde Modo Súper. El salmón quedó en 1.5 kg en México y permaneció en 2 kg en España; la leche subió de 3 a 4 piezas y el estado confirmó la nube. Cancelar Google mostró un error recuperable. Inventario abierto correctamente después de corregir productos sin categoría.

Compilación aislada reabierta con su servidor estático apagado: la aplicación cargó desde caché y permitió agregar un producto a la lista local. Esto comprueba caché y captura local, no sustituye una prueba completa en modo avión en un teléfono. El primer uso necesita descargar los recursos hasta mostrar que están disponibles sin conexión. Los códigos desconocidos requieren internet o captura manual; no se inventan datos.

Capturas móvil 390×844 y escritorio guardadas como `alacena-3.10-mobile.png` y `alacena-3.10-desktop.png` en los artefactos locales de esta revisión. No se observó desbordamiento horizontal en el inicio a 390 px ni en escritorio.

## Mediciones antes/después

| Medida | 3.9.5 | 3.10.0 |
| --- | ---: | ---: |
| JavaScript inicial referenciado en HTML | 1,202,188 bytes | 388,094 bytes |
| JavaScript inicial gzip | 353,419 bytes | 119,732 bytes |
| Primera apertura escritorio local | 1,408 ms | 1,209 ms |
| Aperturas móviles calientes | 631 / 345 / 303 ms | 666 / 517 / 416 ms |
| Mediana móvil local | 345 ms | 517 ms |

JavaScript inicial reducido 67.7% (gzip 66.1%). Estas cifras excluyen descargas diferidas y la precarga posterior del paquete sin conexión; no representan el tráfico total. Las mediciones de inicio usan la aparición del campo rápido más un cuadro de pintado en el mismo equipo, sin limitar CPU ni red, mediante Vite preview local. La mediana móvil no mejoró en esta muestra; no se afirma una aceleración medida en redes móviles. Datos crudos en `frontend/review/metrics-*.json`.

| Flujo | Pasos y resultado |
| --- | --- |
| Agregar a lista | Escribir y Enter; dos acciones, conservadas. |
| Guardar compra seleccionada | Guardar, revisar importe, confirmar; diálogo visible y error recuperable. |
| Cerrar menú de perfil | Un Escape o clic fuera; foco recuperado. |
| Comprar con porciones ajustadas | El mismo ajuste de porciones ahora determina el consumo real. |
| Ver tickets anteriores | Cargar más; antes eran inaccesibles tras el recorte. |
| Restaurar | Archivo, vista previa, elección, confirmación; flujo nuevo deliberadamente explícito. |

## Límites pendientes

La cámara y el enfoque deben comprobarse con productos físicos en iPhone y Android; las pruebas automáticas de QR/códigos, errores de cámara y vigilantes de imagen pasan, pero no certifican el hardware. No se reemplazó el motor nativo de cámara de 3.9.5. OCR conserva revisión humana de cantidades, precios y coincidencias antes de registrar. La restauración conectada admite hasta 400 operaciones por transacción y rechaza tamaños superiores antes de escribir. Cocinar envía deltas por producto, sin transacción conjunta para todos los ingredientes. La bitácora no ofrece certificación criptográfica. No se declara que ya no exista nada por mejorar.

## Publicación

Destino autorizado: Hosting target `alacena-app`, proyecto/sitio `alacena-enterprise-prod`; dominio `https://alacena.cobertores.com`. El identificador exacto de la compilación publicada se consulta en `/version.json` y debe coincidir con Git. No desplegar reglas, Functions ni Storage en esta entrega.
