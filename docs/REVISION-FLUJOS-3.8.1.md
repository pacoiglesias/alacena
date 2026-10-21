# Revisión de flujos · ALACENA 3.8.1

## Fallo reproducido y corregido

Con artículos marcados en Modo Súper, pulsar Guardar abría una confirmación detrás de la pantalla inmersiva. Ambas capas tenían el mismo z-index y la pantalla del súper aparecía después en el documento. El usuario no veía ninguna respuesta.

La confirmación y su indicador de carga ahora se muestran en una capa independiente en el cuerpo de la página, por encima del modo inmersivo. Cancelar conserva los artículos seleccionados y devuelve el foco al botón Guardar. Confirmar admite importe real, responsable y notas; impide dos envíos simultáneos y mantiene abierta la ventana con un aviso si se rechaza la operación. Un registro correcto muestra un aviso e ingresa la compra al inventario e historial.

## Otras correcciones

- Las ventanas de ajustes se dibujan fuera de la cabecera fija para evitar que su desenfoque altere el posicionamiento y las superposiciones.
- Menús de herramientas y ajustes: cierre con Escape o pulsación exterior; el menú de perfil y ajustes no permanecen abiertos simultáneamente. Los menús largos admiten desplazamiento en teléfono.
- Botones de cierre identificables y navegación por teclado en los artículos de Modo Súper.
- Modo Súper muestra la moneda de la casa y distingue importe del carrito y estimado total.
- Las pestañas Cava y zonas personalizadas envían el filtro al inventario; abrir el inventario general o completar una compra limpia el filtro de navegación.
- La dependencia de Node `@grpc/grpc-js`, arrastrada por Firebase, queda fijada mediante override en 1.13.6. Corrige el aviso [GHSA-m9gg-hp2v-232j](https://github.com/grpc/grpc-node/security/advisories/GHSA-m9gg-hp2v-232j), sin retroceder Firebase a una versión antigua. La auditoría npm resultó sin vulnerabilidades conocidas al instalar esta revisión.

## Verificación

`npm test`: pruebas numéricas, registro, consumos, lectura y tickets. `npm run test:ui`: pruebas de interacción de compra, cancelar, total inválido, doble pulsación, rechazo, excepción/reintento, menús y filtros. La integración continua ejecuta ambas suites.

En navegador local aislado, sin sesión ni escrituras de producción: reproducido el fallo antes de corregirlo; apertura visible después; cancelar conservó el carrito; compra sintética de 27.50 ingresada en despensa e historial con notas. Comprobación de Modo Súper y confirmación a 390 px de ancho. Las pruebas de la revisión anterior de Firestore siguen documentadas en AUDITORIA-3.8.0.md; esta corrección no cambia sus reglas.

Esta revisión cubre los flujos indicados; no certifica todas las combinaciones posibles de teléfonos, impresión física, aplicaciones externas o conexión entre dispositivos.
