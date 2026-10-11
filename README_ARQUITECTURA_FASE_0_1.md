# 🏛️ ALACENA ENTERPRISE - ARQUITECTURA DE DATOS Y SEGURIDAD

**Versión:** 1.0.0-Enterprise  
**Stack:** Flutter + Firebase (Firestore, Auth, Storage, Functions, Hosting)  
**Dominio:** [alacena.cobertores.com](https://alacena.cobertores.com)  
**Repositorio:** [github.com/pacoiglesias/alacena](https://github.com/pacoiglesias/alacena)

---

## 📑 Índice
1. [Esquema NoSQL de Firestore (Multi-Hogar)](#1-esquema-nosql-de-firestore)
2. [Modelo de Trazabilidad Total (Audit Trail Inalterable)](#2-audit-trail-inalterable)
3. [Seguridad y Control de Roles (RBAC Anti-Robos)](#3-rbac-y-seguridad-anti-robos)
4. [Estrategia Offline-First](#4-estrategia-offline-first)
5. [Guía de Ejecución de Scripts (Fase 0)](#5-guia-de-ejecucion-fase-0)

---

## 1. Esquema NoSQL de Firestore

Diseño jerárquico optimizado para **Multi-Hogar** con aislamiento estricto de datos y consultas de baja latencia indexadas:

```text
/users/{userId}
/households/{householdId}
  ├── /members/{userId}
  ├── /zones/{zoneId}
  ├── /items/{itemId}
  ├── /audit_trail/{auditId}
  └── /shopping_list/{listItemId}
/system_alerts/{alertId}
```

### 1.1. Colección `/users/{userId}`
Perfiles de usuario y asignación de roles globales.

```json
{
  "uid": "USER_UID_STRING",
  "email": "paco@cobertores.com",
  "displayName": "Paco Iglesias",
  "role": "admin", // "admin" | "service"
  "defaultHouseholdId": "casa-principal",
  "fcmToken": "fcm_token_para_push_alerts",
  "createdAt": "TIMESTAMP",
  "updatedAt": "TIMESTAMP"
}
```

### 1.2. Colección `/households/{householdId}`
Representa cada propiedad o residencia (ej. "Casa Principal", "Casa de Campo", "Rancho").

```json
{
  "id": "casa-principal",
  "name": "Casa Principal",
  "address": "Av. Principal 123",
  "ownerUid": "USER_UID_STRING",
  "createdAt": "TIMESTAMP"
}
```

#### Subcolección `/households/{householdId}/zones/{zoneId}`
Zonas de almacenamiento dentro del hogar (ej. "Alacena 1", "Cava Subterránea", "Cuarto Frío", "Bar").

```json
{
  "id": "cava-subterranea",
  "name": "Cava Subterránea",
  "type": "cellar", // "pantry" | "cellar" | "refrigerated" | "general"
  "icon": "wine_bar",
  "temperatureSensor": true,
  "createdAt": "TIMESTAMP"
}
```

#### Subcolección `/households/{householdId}/items/{itemId}` (Inventario Core)
Artículos inventariados con códigos únicos y parámetros de stock óptimo.

```json
{
  "id": "item_uuid_12345",
  "householdId": "casa-principal",
  "zoneId": "cava-subterranea",
  "name": "Vino Vega Sicilia Único 2010",
  "category": "Vinos & Licores",
  "barcode": "8414444000123", // Código de barras comercial
  "qrCode": "ALACENA:casa-principal:cava-subterranea:item_uuid_12345", // QR Interno para etiquetas
  "nfcTagId": "04:5A:2F:B2:89:12:80", // ID tag NFC opcional
  "currentQuantity": 6,
  "idealQuantity": 12,
  "minAlertQuantity": 3,
  "unit": "botella", // "botella", "pza", "kg", "paquete"
  "stockStatus": "OPTIMAL", // "OPTIMAL" (verde), "LOW" (amarillo), "OUT_OF_STOCK" (rojo)
  "unitPrice": 8500.00, // Visible solo para rol Admin
  "currency": "MXN",
  "isHighValue": true, // Dispara alerta Push si se descuenta
  "isSensitive": true,
  "expiryDate": "TIMESTAMP_OPCIONAL",
  "imageUrl": "https://firebasestorage.googleapis.com/.../products/item_12345.jpg",
  "lastScannedAt": "TIMESTAMP",
  "lastScannedBy": "USER_UID_STRING",
  "createdAt": "TIMESTAMP",
  "updatedAt": "TIMESTAMP"
}
```

#### Subcolección `/households/{householdId}/audit_trail/{auditId}` (Inalterable)
Registro forense e histórico de cada interacción humana o de IA.

```json
{
  "id": "audit_uuid_998877",
  "householdId": "casa-principal",
  "itemId": "item_uuid_12345",
  "itemName": "Vino Vega Sicilia Único 2010",
  "userId": "USER_UID_STRING",
  "userEmail": "empleado@cobertores.com",
  "userRole": "service",
  "action": "SCAN_CONSUME", // "SCAN_CONSUME" | "SCAN_RESTOCK" | "MANUAL_ADJUST" | "CREATE_ITEM" | "DELETE_ITEM"
  "previousQuantity": 6,
  "newQuantity": 5,
  "quantityDelta": -1,
  "scanMethod": "NFC", // "NFC" | "QR" | "MANUAL" | "AI_VISION"
  "timestamp": "SERVER_TIMESTAMP",
  "metadata": {
    "device": "iPhone 15 Pro",
    "location": "Cava Subterránea"
  }
}
```

#### Subcolección `/households/{householdId}/shopping_list/{listItemId}`
Lista de compras interactiva sincronizada en tiempo real.

```json
{
  "id": "shop_item_001",
  "householdId": "casa-principal",
  "itemId": "item_uuid_12345", // Vinculado al inventario
  "name": "Vino Vega Sicilia Único 2010",
  "category": "Vinos & Licores",
  "neededQuantity": 6,
  "unit": "botella",
  "estimatedPrice": 8500.00,
  "isPurchased": false, // Al marcar true se actualiza el stock automáticamente
  "purchasedAt": null,
  "purchasedBy": null,
  "source": "AI_AUTO_DETECT", // "AI_AUTO_DETECT" | "LOW_STOCK_RULE" | "MANUAL"
  "createdAt": "TIMESTAMP"
}
```

---

## 2. Audit Trail Inalterable

Para cumplir con la directiva **Anti-Robos** de nivel empresarial:

1. **Garantía Criptográfica / Seguridad en Firestore:**
   - La subcolección `audit_trail` tiene la regla estricta:
     ```text
     allow update, delete: if false;
     ```
   - Ni siquiera el Administrador en la app puede alterar un evento ya ocurrido. Los logs son **Append-Only**.
2. **Validación de Identidad e Integridad de Tiempo:**
   - Se valida matemáticamente que `request.resource.data.userId == request.auth.uid`.
   - Se impone `request.resource.data.timestamp == request.time` para impedir falsificación de marcas de tiempo del pasado.
3. **Visibilidad Asimétrica:**
   - Rol `admin`: Visualiza la pestaña Timeline con trazabilidad completa (Quién tomó qué, a qué hora y con qué método).
   - Rol `service`: Los logs están bloqueados por reglas (`allow read: if isAdmin();`), evitando que operadores de servicio sepan cómo o cuándo se audita.

---

## 3. RBAC y Seguridad Anti-Robos

| Característica / Permiso | Rol `admin` (Familia) | Rol `service` (Servicio) |
| :--- | :--- | :--- |
| **Ver Inventario y Cantidades** | Sí | Sí (Vista simplificada) |
| **Ver Precios y Valores Totales** | Sí | ❌ Oculto / Restringido |
| **Escanear y Descontar Stock** | Sí | Sí (Operación en 2 taps) |
| **Editar Precios / Metadatos** | Sí | ❌ Prohibido en Rules |
| **Eliminar Productos del Catálogo** | Sí | ❌ Imposible en Rules (`delete: false`) |
| **Ver Logs Históricos (Audit Trail)**| Sí | ❌ Bloqueado (`read: false`) |
| **Modificar / Borrar Logs** | ❌ Imposible (`false`) | ❌ Imposible (`false`) |
| **Lista de Compras** | Total (Crear, Editar, Borrar) | Marcar comprados (✓) y añadir |
| **Alertas Push en Artículos Sensibles** | Recibe notificación instantánea | No recibe alertas de seguridad |

---

## 4. Estrategia Offline-First

Para garantizar que la app funcione sin contratiempos en sótanos, bodegas o cavas sin cobertura de red:

1. **Habilitación de Caché Persistente en Firestore:**
   ```dart
   FirebaseFirestore.instance.settings = const Settings(
     persistenceEnabled: true,
     cacheSizeBytes: Settings.CACHE_SIZE_UNLIMITED,
   );
   ```
2. **Lectura Inteligente con Fallback:**
   - La UI escucha mediante `snapshots()` que entrega datos locales inmediatamente (`fromCache: true`) y se sincroniza en segundo plano cuando hay conexión (`hasPendingWrites: false`).
3. **Escritura en Cola Local:**
   - Cuando el personal de servicio escanea un QR/NFC en la cava y descuenta `-1`, la operación se aplica al instante en local (Feedback visual cero lag).
   - Firestore guarda la mutación en su base de datos IndexedDB/SQLite local y, en cuanto el dispositivo recupera señal Wi-Fi o datos, replica la mutación y genera el evento de Audit Trail en la nube.

---

## 5. Guía de Ejecución (Fase 0)

Los scripts automatizados han sido creados en la carpeta `scripts/`:

```text
scripts/
├── 00_setup_env.bat            -> Verifica e instala Git, Firebase y Flutter SDK
├── 01_init_repo.bat            -> Enlaza https://github.com/pacoiglesias/alacena y crea .gitignore
├── 02_setup_firebase.bat       -> Vincula Firebase y el Hosting para alacena.cobertores.com
├── 03_init_flutter_project.bat -> Genera la app Flutter y añade paquetes empresariales
└── setup_all.bat               -> Orquestador maestro (ejecuta todo de un clic)
```

### Para ejecutar todo de una sola vez:
Haz doble clic en `scripts\setup_all.bat` o ejecútalo desde la consola.
