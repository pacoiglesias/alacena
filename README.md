# ALACENA · La lista de compras de tu casa

Versión web **3.10.2**, React + Vite + Firebase. Consulta la [revisión integral y sus límites](docs/REVISION-3.10.0.md).

Producción: [alacena.cobertores.com](https://alacena.cobertores.com/) · [Firebase Hosting](https://alacena-enterprise-prod.web.app/).
Proyecto Firebase: `alacena-enterprise-prod`, target: `alacena-app`. `alacena.bolsas.com` no está configurado.

Lista del súper, inventario por casa, QR y códigos de barras, revisión de tickets, compras parciales e historial de devoluciones. Consulta [la auditoría, comprobaciones y límites de esta versión](docs/AUDITORIA-3.8.0.md) y [el análisis de reglas](docs/firebase-security-audit.json).

## Estado de los servicios (actualizado 7 nov 2026)

- **Hosting y Firestore: en producción.** La 3.10.2 sirve en `alacena.cobertores.com`
  (`version.json` verificado en vivo).
- **Cloud Functions: DESPLEGADAS (6 nov 2026, 23:14 CST).** Las 3 funciones v2 en
  `us-central1` (Node 22), verificadas en vivo: `globalEanLookup` (HTTPS),
  `onStockLevelAlert` (trigger Firestore sobre `products/{productId}`) y
  `predictiveConsumptionCron` (programada, diaria a las 03:00 CST). Despliegue
  automático con GitHub Actions + federación WIF (sin clave JSON) y plan Blaze
  activo desde el 6 nov 2026. Reescritas el 6 nov (PR #10) al modelo real que usa
  la app (`products`, `shopping_list`, `audit_logs` por `householdId`).
  Seguridad (PR #11, 7 nov): `globalEanLookup` exige token y claim
  `alacenaAccess`; las reglas Firestore/Storage con aislamiento por hogar están
  en el repo, pero su despliegue es manual y exige ANTES actualizar el claim del
  propietario (`scripts/configure_owner_access.cjs`) y que Paco cierre y vuelva
  a abrir sesión — sin eso, las reglas nuevas niegan el acceso.
- **Storage: NO provisionado.** El proyecto no tiene ningún bucket de Cloud Storage
  (la lista de buckets devuelve vacía), así que las reglas de `storage.rules` no
  están publicadas ni en uso; las fotos de producto se guardan por otra vía.
  No subir fotos a Storage hasta provisionarlo y publicar sus reglas.

## Desarrollo y comprobación

Requiere Node 24 y Firebase CLI autenticado para publicar. Desde `frontend`:

```sh
npm ci
npm test
npm run lint -- --quiet
npm run build
npm run preview -- --host 127.0.0.1 --port 4174
```

El build copia el modelo OCR español desde npm y genera el paquete sin conexión. No descargar modelos desde una CDN durante la lectura de tickets. No usar el servidor de desarrollo para verificar el servicio sin conexión.

## En el supermercado

Abre la aplicación con internet, conecta tu casa con Google y espera el aviso de disponibilidad sin conexión. Los códigos conocidos se buscan primero en los datos guardados. Los códigos nuevos consultan Open Food Facts cuando hay conexión; pueden faltar productos. Sin internet, escribe el nombre y revisa los datos. Los precios se obtienen de tus registros y tickets, no de precios supuestos del código de barras.

Fotografía el ticket completo, con buena luz y sin sombras, o selecciona imagen/PDF. Corrige el resultado antes de guardar. El precio es por unidad y la cantidad admite tres decimales. Una diferencia con el total pagado requiere revisión explícita. Se descuentan de los pendientes las cantidades compradas y se conserva el resto.

No borres los datos del navegador mientras haya cambios pendientes de sincronizar. Cada dispositivo debe abrir previamente la aplicación con internet. La cámara física y los tickets reales deben verificarse en los teléfonos del hogar.

## Acceso y publicación

Google está configurado para el propietario autorizado. El permiso `alacenaAccess` se asigna administrativamente; no se obtiene eligiendo un rol en la pantalla. Comprobar acceso real del propietario antes de cerrar reglas públicas. No probar escrituras con datos sintéticos en producción.

Confirmar cambios y subir a GitHub; después compilar para incluir el commit correcto en `version.json`. Publicar desde la raíz:

```sh
firebase deploy --only hosting:alacena-app --project alacena-enterprise-prod --non-interactive
```

Las reglas se publican separadamente después de la prueba de acceso. Revisar `version.json` del dominio público y la aplicación móvil después del despliegue. Las pruebas de reglas sólo apuntan al emulador `demo-alacena-audit:8089`.

El árbol Flutter y las funciones históricas no forman parte de esta versión web. No se afirma una auditoría integral de esos módulos.
