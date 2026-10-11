# 🏛️ ALACENA ENTERPRISE - ARQUITECTURA MULTI-TENANT SaaS & FINANCIERA

**Versión:** 2.0.0-MultiTenant-Enterprise  
**Modelo:** B2C / B2B SaaS (Multi-Tenant por `tenant_id` / Familia / Workspace)  
**Dominio:** [alacena.cobertores.com](https://alacena.cobertores.com)  
**Repositorio:** [github.com/pacoiglesias/alacena](https://github.com/pacoiglesias/alacena)

---

## 🎯 Confirmación de Requerimientos Comerciales y Estratégicos

1. **SaaS Multi-Tenant:** Aislamiento estricto por `tenant_id` (Familia / Cuenta Suscriptora). Escalable a miles de clientes concurrentes con suscripción sin colisión de datos.
2. **Inteligencia Financiera & Trazabilidad de Inflación:**
   - Precios actuales, historial cronológico de precios (`price_history`), último lugar de compra (`Costco`, `City Market`, `La Europea`, etc.).
   - Registro del **valor económico del movimiento** en el Audit Trail (`economic_value` = `delta * precio`).
3. **Escáner Global EAN-13 / UPC & Autocompletado:**
   - Lectura simultánea de QRs internos generados y códigos de barras comerciales estándar.
   - Conexión e indexación con API externa (OpenFoodFacts / UPCitemdb) mediante `/global_products_catalog`.
4. **Onboarding & Autorelleno ("Alacena Base"):**
   - Catálogo predefinido de 50-100 artículos básicos y gourmet para inicializar residencias sin fricción.
5. **Agente IA de Compras & Comparación Web:**
   - Comparador de precios y sugerencia de tiendas / alternativas económicas (Google Shopping / SerpApi vía Firebase Functions).
6. **Módulo Zero-Waste (Chef IA):**
   - Generación de recetas automáticas basadas en ingredientes con fecha de caducidad próxima (`expiryDate`).

---

## 🗄️ 1. Esquema NoSQL de Firestore (Multi-Tenant SaaS)

```text
/global_products_catalog/{barcode}       <- Caché Global EAN/UPC compartido
/users/{userId}                           <- Perfiles de usuario globales
/tenants/{tenantId}                       <- Cuentas SaaS / Familias (Tenant Root)
  ├── /members/{userId}                   <- Membresía, suscripción y roles en el Tenant
  └── /households/{householdId}           <- Residencias del Tenant (Casa, Rancho, etc.)
        ├── /zones/{zoneId}               <- Zonas (Alacena, Cava, Refrigerador, Bar)
        ├── /items/{itemId}               <- Catálogo, Precios, EAN e Historial
        ├── /audit_trail/{auditId}        <- Bitácora forense y valor financiero
        ├── /shopping_list/{listItemId}   <- Lista con comparativa web de precios
        └── /zero_waste_recipes/{recipeId}<- Recetas IA para evitar desperdicio
```

---

### 1.1. Colección Global: `/global_products_catalog/{barcode}`
Base de datos colectiva y caché de códigos de barras comerciales (EAN-13 y UPC-A). Al escanear un producto nuevo en el supermercado, se consulta aquí primero; si no existe, Cloud Functions consulta OpenFoodFacts / UPCitemdb y lo cachea.

```json
{
  "barcode": "8410001234567",
  "barcodeType": "EAN_13",
  "name": "Aceite de Oliva Extra Virgen Reserva",
  "brand": "Oro Bailén",
  "category": "Aceites & Vinagres",
  "standardUnit": "botella 500ml",
  "imageUrl": "https://images.openfoodfacts.org/.../front_es.jpg",
  "nutritionGrade": "A",
  "averageMarketPrice": 485.00,
  "currency": "MXN",
  "source": "OPEN_FOOD_FACTS",
  "createdAt": "TIMESTAMP",
  "updatedAt": "TIMESTAMP"
}
```

---

### 1.2. Colección Tenant Root: `/tenants/{tenantId}`
Representa la cuenta del cliente / familia en el SaaS.

```json
{
  "tenantId": "tenant_fam_iglesias_01",
  "companyOrFamilyName": "Familia Iglesias",
  "ownerUid": "USER_UID_PROPIETARIO",
  "subscription": {
    "plan": "ENTERPRISE_FAMILY", // "STARTER" | "PRO" | "ENTERPRISE_FAMILY"
    "status": "ACTIVE",          // "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELED"
    "currentPeriodEnd": "2027-04-18T00:00:00Z",
    "stripeCustomerId": "cus_N998877",
    "aiCreditsMonthly": 500,
    "aiCreditsUsed": 14
  },
  "settings": {
    "defaultCurrency": "MXN",
    "enableAntiTheftAlerts": true,
    "inflationAlertThresholdPercent": 5.0,
    "zeroWasteDaysWarning": 4
  },
  "createdAt": "TIMESTAMP",
  "updatedAt": "TIMESTAMP"
}
```

#### Subcolección: `/tenants/{tenantId}/members/{userId}`
Asignación de roles por usuario dentro de la cuenta SaaS.

```json
{
  "userId": "USER_UID_01",
  "email": "paco@cobertores.com",
  "displayName": "Paco Iglesias",
  "role": "owner", // "owner" | "admin" | "service" | "guest"
  "assignedHouseholds": ["casa-principal", "rancho-valle"],
  "joinedAt": "TIMESTAMP"
}
```

---

### 1.3. Subcolección: `/tenants/{tenantId}/households/{householdId}/items/{itemId}`
El núcleo del inventario con **EAN comercial, QR interno, finanzas e inflación**.

```json
{
  "id": "item_uuid_8831",
  "tenantId": "tenant_fam_iglesias_01",
  "householdId": "casa-principal",
  "zoneId": "cava-subterranea",
  "zoneName": "Cava Subterránea",

  // --- Identificación de Producto (EAN + QR Interno + NFC) ---
  "name": "Vino Vega Sicilia Único Cosecha 2010",
  "brand": "Vega Sicilia",
  "category": "Vinos & Cava",
  "barcode": "8414444000123", // Código EAN-13 comercial
  "qrCode": "ALACENA:tenant_fam_iglesias_01:casa-principal:cava:item_uuid_8831",
  "nfcTagId": "04:5A:2F:B2:89:12:80",

  // --- Cantidades y Semáforo ---
  "currentQuantity": 5,
  "idealQuantity": 10,
  "minAlertQuantity": 2,
  "unit": "botella 750ml",
  "stockStatus": "OPTIMAL", // "OPTIMAL" | "LOW" | "OUT_OF_STOCK"

  // --- Inteligencia Financiera e Inflación ---
  "currentPrice": 8500.00,
  "currency": "MXN",
  "lastPurchasePlace": "La Europea Lomas",
  "lastPurchasedAt": "2026-02-14T18:30:00Z",
  "totalInventoryValue": 42500.00, // currentQuantity * currentPrice
  "priceHistory": [
    {
      "price": 7600.00,
      "date": "2024-11-20T12:00:00Z",
      "place": "City Market",
      "currency": "MXN"
    },
    {
      "price": 8100.00,
      "date": "2025-08-10T14:30:00Z",
      "place": "La Europea",
      "currency": "MXN"
    },
    {
      "price": 8500.00,
      "date": "2026-02-14T18:30:00Z",
      "place": "La Europea Lomas",
      "currency": "MXN",
      "inflationDeltaPercent": 4.94
    }
  ],

  // --- Seguridad y Caducidad Zero-Waste ---
  "isHighValue": true,
  "isSensitive": true,
  "expiryDate": "2035-12-31T00:00:00Z",
  "imageUrl": "https://images.openfoodfacts.org/.../front.jpg",
  "lastScannedAt": "TIMESTAMP",
  "lastScannedBy": "USER_UID_01",
  "updatedAt": "TIMESTAMP"
}
```

---

### 1.4. Subcolección: `/tenants/{tenantId}/households/{householdId}/audit_trail/{auditId}`
Bitácora forense inalterable con **Trazabilidad Económica Anti-Robos**.

```json
{
  "id": "audit_log_9001",
  "tenantId": "tenant_fam_iglesias_01",
  "householdId": "casa-principal",
  "itemId": "item_uuid_8831",
  "itemName": "Vino Vega Sicilia Único Cosecha 2010",
  "userId": "service_user_03",
  "userEmail": "personal@cobertores.com",
  "userRole": "service",
  "action": "SCAN_CONSUME", // "SCAN_CONSUME" | "SCAN_RESTOCK" | "MANUAL_ADJUST" | "AUTO_SEED"
  "previousQuantity": 6,
  "newQuantity": 5,
  "quantityDelta": -1,
  
  // --- IMPACTO FINANCIERO DEL MOVIMIENTO ---
  "unitPriceAtMoment": 8500.00,
  "economicValueDelta": -8500.00, // Descuento de $8,500 MXN en valor de inventario
  "currency": "MXN",

  "scanMethod": "NFC", // "NFC" | "EAN_BARCODE" | "INTERNAL_QR" | "MANUAL"
  "timestamp": "SERVER_TIMESTAMP",
  "deviceInfo": {
    "platform": "iOS",
    "model": "iPhone 15 Pro",
    "locationZone": "Cava Subterránea"
  }
}
```

---

### 1.5. Subcolección: `/tenants/{tenantId}/households/{householdId}/shopping_list/{listItemId}`
Lista de compras con **Comparación de Precios Web y Sugerencias de Ahorro**.

```json
{
  "id": "shop_item_55",
  "tenantId": "tenant_fam_iglesias_01",
  "householdId": "casa-principal",
  "itemId": "pantry_cafe_06",
  "name": "Café de Grano Especialidad Chiapas",
  "neededQuantity": 3,
  "unit": "bolsa 500g",
  "lastBoughtPrice": 650.00,
  "source": "AI_AUTO_DETECT", // "AI_AUTO_DETECT" | "LOW_STOCK_RULE" | "MANUAL"
  "isPurchased": false,

  // --- AGENTE DE COMPARACIÓN WEB (Google Shopping / Retail APIs) ---
  "webPriceComparison": {
    "cheapestVendor": "Amazon México",
    "cheapestPrice": 580.00,
    "potentialSavings": 210.00, // (650 - 580) * 3
    "vendorsFound": [
      { "name": "Amazon México", "price": 580.00, "url": "https://amazon.com.mx/..." },
      { "name": "Mercado Libre", "price": 620.00, "url": "https://mercadolibre.com.mx/..." },
      { "name": "City Market", "price": 665.00, "url": "https://citymarket.com.mx/..." }
    ],
    "suggestedAlternative": {
      "name": "Café Punta del Cielo Chiapas 500g",
      "price": 280.00,
      "savings": 1110.00
    },
    "lastComparedAt": "TIMESTAMP"
  },
  "createdAt": "TIMESTAMP"
}
```

---

### 1.6. Subcolección: `/tenants/{tenantId}/households/{householdId}/zero_waste_recipes/{recipeId}`
Recetas generadas por el **Chef IA (OpenAI)** para ingredientes a punto de caducar.

```json
{
  "id": "recipe_001",
  "tenantId": "tenant_fam_iglesias_01",
  "householdId": "casa-principal",
  "title": "Risotto de Parmigiano Reggiano y Jamón Ibérico",
  "aiPromptSummary": "Prioriza queso que caduca en 3 días y arroz blanco en exceso",
  "expiringIngredientsUsed": [
    { "itemId": "fridge_queso_01", "name": "Queso Parmigiano Reggiano", "daysToExpiry": 3 },
    { "itemId": "pantry_arroz_01", "name": "Arroz Grano Largo", "daysToExpiry": 180 }
  ],
  "difficulty": "Media",
  "prepTimeMinutes": 30,
  "servings": 4,
  "instructions": [
    "Paso 1: Dorar el arroz en aceite de oliva virgen extra...",
    "Paso 2: Incorporar caldo caliente y mantecar con el Parmigiano..."
  ],
  "estimatedCostSavings": 380.00,
  "createdAt": "TIMESTAMP"
}
```

---

## 🔒 2. Seguridad Matemática en `firestore.rules`

1. **Aislamiento Multi-Tenant Estricto:**
   - La regla `isTenantMember(tenantId)` impide matemáticamente que cualquier cliente o familia lea o escriba en los documentos de otro tenant.
2. **Rol de Servicio Blindado:**
   - Solo puede registrar consumos y marcar compras.
   - **No puede acceder a precios, historial de costos ni al Audit Trail.**
   - No puede eliminar ningún documento (`allow delete: if false`).
3. **Audit Trail Inalterable:**
   - Registro de transacciones con sello `SERVER_TIMESTAMP` y valor económico.
   - Inmune a modificaciones y borrados (`allow update, delete: if false`).
