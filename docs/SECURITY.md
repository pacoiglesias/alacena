# 🛡️ ALACENA Enterprise & CavaPro — Arquitectura de Seguridad y Reglas de Acceso

**Versión del Sistema:** v3.3.0-Titanium-Aurora-Perfection  
**Rama de Endurecimiento:** `security/firestore-hardening`  
**Estatus:** Endurecido y Auditado (10 Commits Atómicos + Suite de Tests)  
**Proyecto Firebase:** `alacena-enterprise-prod`

---

## 🏛️ 1. Modelo de Amenazas (Threat Modeling)

ALACENA Enterprise gestiona inventarios de alto valor (vinos de colección, cavas subterráneas, alimentos gourmet, charcutería fina) y opera bajo un modelo híbrido:
1. **Personal Doméstico / Servicio (Rol: `service`):** Operan en cocina y alacena mediante tablets/móviles para registrar consumo y reposición rápida.
2. **Administradores / Dueños de Residencia (Rol: `admin` / `owner`):** Acceso a precios de compra, trazabilidad financiera, auditoría inalterable y configuración patrimonial.
3. **Escáneres y Dispositivos de Acceso Rápido:** Lecturas públicas de códigos de barra para enriquecimiento de datos sin comprometer inventarios privados.

### Amenazas Mitigadas
- **Escalada de Privilegios en Perfiles (`users/{userId}`):** Impedir que un usuario modifique campos administrativos (`role`, `workspaceId`, `isAdmin`) inyectándolos en su propio perfil.
- **Inyección en Catálogo Global (`global_ean_cache/{barcode}`):** Impedir creación de registros basura o scripts maliciosos validando tamaño de cadenas, autoría obligatoria y whitelist estricto de campos.
- **Acceso No Autorizado a Costos Privados (`private_financial`):** Aislamiento criptográfico y de reglas donde el rol `service` tiene prohibida la lectura y escritura de precios unitarios o históricos de compra.
- **Falsificación de Bitácora Forense (`audit_trail`):** Inmutabilidad absoluta (`allow update, delete: if false;`), validación de `hasOnly` en campos de log y verificación de `request.resource.data.userId == request.auth.uid`.
- **Ruptura de Aislamiento Multi-Tenant:** Eliminación definitiva del comodín legado `/tenants/{tenantId}/{document=**}`.

---

## 📋 2. Matriz de Correcciones Aplicadas (Fixes 1 a 10)

| Fix | Nivel | Commit Hash | Descripción |
| :--- | :--- | :--- | :--- |
| **FIX 1** | CRÍTICO | `e92a2e1` | `fix(firestore): remove legacy tenants wildcard write access` — Eliminado el comodín que bypassaba reglas de subcolecciones. |
| **FIX 2** | CRÍTICO | `8c6588d` | `fix(firestore): restrict shopping_list update to whitelisted fields` — Reemplazado `hasAny` por `hasOnly` para rol servicio en Live Shopping. |
| **FIX 3** | CRÍTICO | `7299a1c` | `fix(firestore): validate global_ean_cache create fields` — Validación de campos requeridos, autoría (`createdBy == request.auth.uid`) y límite de 200 caracteres. |
| **FIX 4** | ALTO | `f8e0d11` | `fix(firestore): restrict user profile update fields` — Bloqueo de escalada de privilegios en perfiles de usuario. |
| **FIX 5** | ALTO | `c3f0a2a` | `fix(firestore): validate workspace creation structure` — Validación de autoría (`ownerId`, `createdBy`) y límite de nombre en nuevo workspace. |
| **FIX 6** | ALTO | `cd9ba2c` | `fix(firestore): verify workspace membership via document, not claim` — Comprobación canónica vía `exists(/workspaces/.../members/uid)`. |
| **FIX 7** | ALTO | `e54d2d3` | `fix(firestore): guard isWorkspaceAdmin against missing member doc` — Blindaje contra fallos de ejecución si el documento de miembro no existe. |
| **FIX 8** | MEDIO | `5c97c4c` | `fix(firestore): restrict audit_trail field names` — Validación con `hasOnly` de todos los campos forenses escritos por los clientes. |
| **FIX 9** | MEDIO | `3d9fab1` | `fix(firestore): make cellar_profiles and recipes soft-delete only` — Prohibición de borrado físico (`allow delete: if false;`) en cava y recetas. |
| **FIX 10**| MEDIO | `9773647` | `fix(firestore): validate workspaceId/householdId on creates` — Integridad referencial forzada en ajustes y conteos cíclicos. |

---

## 🔑 3. Gestión y Revocación de Custom Claims

Cuando un miembro es desvinculado de un Workspace:
1. La regla de seguridad en Firestore utiliza `exists(...)` en `/workspaces/{workspaceId}/members/{uid}` (Fix 6), por lo que **el acceso se revoca de manera instantánea** en cuanto se elimina el documento de miembro en Firestore, sin esperar la expiración del token JWT (1 hora).
2. Para revocar tokens activos de forma inmediata desde backend (Firebase Admin SDK):
```javascript
const admin = require('firebase-admin');

async function revokeUserSession(uid) {
  // 1. Invalidar refresh tokens
  await admin.auth().revokeRefreshTokens(uid);
  // 2. Limpiar custom claims
  await admin.auth().setCustomUserClaims(uid, { role: null, workspaceId: null });
}
```

---

## 🧪 4. Suite de Pruebas Automatizadas

Ubicación: `test/firestore_rules/firestore_rules.test.js`
- **Test 1:** Usuario `service` NO puede escribir logs maliciosos con campos no autorizados en `audit_trail`.
- **Test 2:** Usuario `service` NO puede leer subcolección `private_financial`.
- **Test 3:** Usuario ajeno NO miembro NO puede leer inventario `items`.
- **Test 4:** Usuario `admin` SÍ puede dar de alta nuevos productos en el inventario.
- **Test 5:** Usuario regular puede modificar su propio perfil, pero NO el de otro usuario.

Compilación de Reglas:
```bash
firebase deploy --only firestore:rules --dry-run
# Output: rules file firestore.rules compiled successfully
```
