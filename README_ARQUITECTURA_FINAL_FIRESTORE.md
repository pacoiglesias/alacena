# 🏛️ ALACENA ENTERPRISE - ESQUEMA MAESTRO DE FIRESTORE (V3.0.0-PRO)

**Versión:** 3.0.0-Titanium-SaaS-Enterprise  
**Modelo de Negocio:** Multi-Tenant SaaS B2B/B2C (Cuentas/Familias independientes)  
**Dominio:** [alacena.cobertores.com](https://alacena.cobertores.com)  
**Repositorio:** [github.com/pacoiglesias/alacena](https://github.com/pacoiglesias/alacena)

---

## 🗺️ Mapa de Colecciones del Sistema

```text
/global_products_catalog/{barcode}       <- Caché EAN-13/UPC compartido (OpenFoodFacts/Vivino)
/users/{userId}                           <- Perfiles y tokens de notificaciones
/tenants/{tenantId}                       <- Workspace SaaS / Cuenta Familiar (Multi-Tenant Root)
  ├── /members/{userId}                   <- Membresía, RBAC y suscripción
  └── /households/{householdId}           <- Residencias (Casa Principal, Rancho, Cava Valle)
        ├── /zones/{zoneId}               <- Alacena, Cava de Vinos, Cuarto Frío, Bar
        ├── /items/{itemId}               <- Catálogo, Precios, Sommelier, ML Predictivo
        ├── /audit_trail/{auditId}        <- Bitácora forense inalterable con impacto financiero
        ├── /shopping_list/{listItemId}   <- Sincronización en vivo ("En Carrito") & Comparador Web
        ├── /zero_waste_recipes/{recipeId}<- Chef IA y cálculo de dinero salvado
        └── /analytics/{periodId}         <- Métricas financieras mensuales y valuación
```

---

## 🗂️ 1. Colección Compartida: `/global_products_catalog/{barcode}`
Base de datos colectiva para autocompletar códigos de barras comerciales estándar (EAN-13/UPC) y vinos reconocidos sin duplicar llamadas a APIs externas.

```typescript
interface GlobalProductCatalog {
  barcode: string;                     // "8414444000123" (EAN-13)
  barcodeType: "EAN_13" | "UPC_A" | "QR";
  name: string;                        // "Vega Sicilia Único Cosecha 2010"
  brand: string;                       // "Bodegas Vega Sicilia"
  category: "Vinos Tintos" | "Despensa" | "Lácteos" | "Insumos";
  standardUnit: string;                // "botella 750ml"
  imageUrl: string;
  source: "OPEN_FOOD_FACTS" | "VIVINO" | "USER_CONTRIBUTED";
  
  // Datos Sommelier enriquecidos (si es vino/licor)
  wineProfile?: {
    vintage: number;                   // 2010
    region: string;                    // "Ribera del Duero, España"
    grapeVarieties: string[];          // ["Tempranillo", "Cabernet Sauvignon"]
    tastingNotes: string[];            // ["Roble", "Cereza negra", "Cuero", "Vainilla"]
    pairings: string[];                // ["Cortes de carne", "Caza mayor", "Quesos curados"]
    drinkingWindow: {
      startYear: number;               // 2022
      endYear: number;                 // 2045
    };
    vivinoRating: number;              // 4.8
  };

  averageMarketPrice: number;          // 8500.00
  currency: string;                    // "MXN"
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🏢 2. Colección Tenant Root: `/tenants/{tenantId}`
Aislamiento matemático de datos por cada cliente o familia suscriptora del SaaS.

```typescript
interface Tenant {
  tenantId: string;                    // "tenant_iglesias_family"
  name: string;                        // "Familia Iglesias"
  ownerUid: string;                    // UID del comprador de la suscripción
  subscription: {
    plan: "STARTER" | "PRO" | "ENTERPRISE";
    status: "ACTIVE" | "TRIAL" | "PAST_DUE" | "CANCELED";
    stripeCustomerId: string;
    billingPeriodEnd: Timestamp;
    maxHouseholds: number;             // ej. 5
    maxUsers: number;                  // ej. 20
    aiCreditsRemaining: number;        // ej. 450
  };
  settings: {
    defaultCurrency: "MXN" | "USD" | "EUR";
    enableLiveShoppingSync: boolean;   // Sincronización en vivo entre familiares
    enablePredictiveRestock: boolean;  // ML predictivo automático
    zeroWasteThresholdDays: number;    // Días de aviso de caducidad (default: 4)
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### Subcolección: `/tenants/{tenantId}/members/{userId}`
```typescript
interface TenantMember {
  userId: string;
  email: string;
  displayName: string;
  role: "owner" | "admin" | "service" | "guest";
  assignedHouseholdIds: string[];      // Hogares a los que tiene acceso
  fcmToken: string;                    // Token para alertas Push
  joinedAt: Timestamp;
}
```

---

## 🏡 3. Residencias: `/tenants/{tenantId}/households/{householdId}`

```typescript
interface Household {
  id: string;                          // "casa-principal"
  tenantId: string;
  name: string;                        // "Casa Principal (Lomas)"
  address: string;
  isMainResidence: boolean;
  createdAt: Timestamp;
}
```

#### Subcolección: `/zones/{zoneId}`
Diferenciación estructural entre **Alacena**, **Cava de Vinos**, **Refrigerado** e **Insumos**.

```typescript
interface Zone {
  id: string;                          // "cava-subterranea"
  householdId: string;
  name: string;                        // "Cava Subterránea Climatizada"
  type: "cellar" | "pantry" | "fridge" | "bar" | "cleaning";
  icon: string;                        // "wine_bar" | "kitchen" | "ac_unit"
  targetTemperatureCelsius?: number;   // 14.0 (para cavas)
  targetHumidityPercent?: number;      // 70.0
  createdAt: Timestamp;
}
```

---

## 📦 4. Inventario Maestro: `/items/{itemId}`
Incorpora **EAN comercial, QR interno, Finanzas, Sommelier, ML Predictivo y Zero-Waste**.

```typescript
interface InventoryItem {
  id: string;                          // "item_uuid_1001"
  tenantId: string;
  householdId: string;
  zoneId: string;                      // "cava-subterranea"
  zoneName: string;                    // "Cava Subterránea"
  zoneType: "cellar" | "pantry" | "fridge" | "bar";

  // --- Identificación de Hardware y Escaneo ---
  name: string;                        // "Vega Sicilia Único Cosecha 2010"
  brand: string;                       // "Bodegas Vega Sicilia"
  category: string;                    // "Vinos Tintos"
  barcode: string;                     // EAN-13: "8414444000123"
  qrCode: string;                      // "ALACENA:tenant_id:casa-principal:cava:item_uuid_1001"
  nfcTagId?: string;                   // "04:5A:2F:B2:89:12:80"

  // --- Stock y Semáforo Glanceable ---
  currentQuantity: number;             // 4
  idealQuantity: number;               // 8
  minAlertQuantity: number;            // 2
  unit: string;                        // "botella 750ml"
  stockStatus: "OPTIMAL" | "LOW" | "OUT_OF_STOCK";

  // --- Inteligencia Financiera e Inflación ---
  unitPrice: number;                   // 8500.00 (Oculto para rol Servicio)
  currency: "MXN" | "USD" | "EUR";
  lastPurchasePlace: string;           // "La Europea Lomas"
  lastPurchasedAt: Timestamp;
  priceHistory: Array<{
    price: number;
    place: string;
    date: Timestamp;
    inflationDeltaPercent?: number;
  }>;

  // --- Consumo Predictivo (ML Básico) ---
  consumptionPredictor: {
    averageDailyConsumption: number;   // ej. 0.14 botellas/día
    averageDaysBetweenRestocks: number;// ej. 28 días
    predictedRunoutDate: Timestamp;    // Fecha estimada en que llegará a 0
    recommendedRestockDate: Timestamp; // Fecha ideal de compra anticipada
    lastConsumedAt: Timestamp;
  };

  // --- Módulo Sommelier (Exclusivo si zoneType == 'cellar') ---
  sommelierDetails?: {
    vintage: number;                   // 2010
    region: string;                    // "Ribera del Duero D.O."
    country: string;                   // "España"
    grapeVarieties: string[];          // ["Tempranillo", "Cabernet Sauvignon"]
    tastingNotes: string[];            // ["Frutos negros maduros", "Tabaco", "Cedro"]
    pairings: string[];                // ["Lechazo asado", "Jamón Ibérico", "Ribeye"]
    drinkingWindow: {
      optimalStartYear: number;        // 2024
      optimalEndYear: number;          // 2042
    };
    storageRecommendation: string;     // "Temperatura constante de 12-14°C, tumbado"
    vivinoUrl?: string;
  };

  // --- Seguridad y Módulo Zero-Waste ---
  isHighValue: boolean;                // true (Dispara Push si baja el stock)
  isSensitive: boolean;
  expiryDate?: Timestamp;              // Fecha de caducidad
  daysUntilExpiry?: number;            // Calculado: si <= 4 activa alertas
  imageUrl?: string;
  
  lastScannedAt: Timestamp;
  lastScannedBy: string;               // UID
  updatedAt: Timestamp;
}
```

---

## 🔒 5. Trazabilidad Forense Inalterable: `/audit_trail/{auditId}`
Garantiza el **registro económico exacto y anti-robos (Append-Only)**.

```typescript
interface AuditTrailLog {
  id: string;                          // UUID v4
  tenantId: string;
  householdId: string;
  itemId: string;
  itemName: string;
  userId: string;
  userEmail: string;
  userRole: "owner" | "admin" | "service";
  
  action: 
    | "SCAN_CONSUME" 
    | "SCAN_RESTOCK" 
    | "MANUAL_ADJUST" 
    | "CREATE_ITEM" 
    | "DELETE_ITEM" 
    | "VOICE_ASSISTANT_ADD" 
    | "SHOPPING_CART_CHECK"
    | "AUTO_SEED";

  previousQuantity: number;
  newQuantity: number;
  quantityDelta: number;               // ej. -1

  // --- TRAZABILIDAD ECONÓMICA ---
  unitPriceAtMoment: number;           // 8500.00
  economicValueDelta: number;          // -8500.00 MXN
  currency: string;                    // "MXN"

  scanMethod: "NFC" | "EAN_BARCODE" | "INTERNAL_QR" | "VOICE_INTENT" | "MANUAL";
  deviceMetadata: {
    platform: "iOS" | "Android" | "Web";
    deviceModel: string;               // "iPhone 15 Pro"
  };
  timestamp: Timestamp;                // SERVER_TIMESTAMP inalterable
}
```

---

## 🛒 6. Lista de Compras en Vivo & Comparador: `/shopping_list/{listItemId}`
Sincronización en tiempo real con **bloqueo "En Carrito" para evitar compras duplicadas**.

```typescript
interface ShoppingListItem {
  id: string;
  tenantId: string;
  householdId: string;
  itemId?: string;                     // Vinculado al inventario si ya existe
  name: string;                        // "Café de Grano Geisha"
  category: string;
  neededQuantity: number;              // 3
  unit: string;                        // "bolsa 500g"
  estimatedUnitPrice: number;          // 650.00

  // --- SINCRONIZACIÓN COLABORATIVA EN TIEMPO REAL ---
  status: "pending" | "in_cart" | "purchased";
  inCartByUserId?: string;             // UID de quien lo echó al carrito
  inCartByName?: string;               // "Paco Iglesias"
  inCartAt?: Timestamp;                // Momento en que se bloquea en la app del cónyuge
  isLocked: boolean;                   // true mientras esté en el carrito físico

  // --- AGENTE IA DE COMPARACIÓN WEB (Google Shopping / Retail) ---
  webComparison?: {
    cheapestVendor: string;            // "Amazon México"
    cheapestPrice: number;             // 580.00
    potentialSavingsTotal: number;     // (650 - 580) * 3 = 210.00 MXN
    offers: Array<{
      vendor: string;
      price: number;
      productUrl: string;
      inStock: boolean;
    }>;
    suggestedAlternative?: {
      alternativeName: string;         // "Café Punta del Cielo Chiapas 500g"
      price: number;                   // 280.00
      savingsTotal: number;            // 1110.00 MXN
    };
    lastCheckedAt: Timestamp;
  };

  source: 
    | "AI_PREDICTIVE_ML"               // Generado por Cloud Function predictiva
    | "VOICE_ASSISTANT"                // Agregado por Siri o Google Assistant
    | "LOW_STOCK_RULE" 
    | "AI_VISION_DETECT" 
    | "MANUAL";

  createdAt: Timestamp;
}
```

---

## 🍳 7. Chef IA Zero-Waste: `/zero_waste_recipes/{recipeId}`

```typescript
interface ZeroWasteRecipe {
  id: string;
  tenantId: string;
  householdId: string;
  title: string;                       // "Risotto de Parmigiano y Jamón Ibérico"
  summary: string;                     // "Diseñado para rescatar 2 ingredientes por caducar"
  prepTimeMinutes: number;             // 30
  difficulty: "Fácil" | "Media" | "Avanzada";
  
  expiringIngredientsSaved: Array<{
    itemId: string;
    name: string;
    daysRemaining: number;
    valueSaved: number;                // 350.00 MXN
  }>;

  totalMoneySaved: number;             // 480.00 MXN
  ingredientsList: string[];
  cookingSteps: string[];
  winePairingSuggested?: string;       // "Maridar con Matarromera Crianza de la cava"
  generatedByAiModel: "gpt-4o" | "gemini-1.5-pro";
  createdAt: Timestamp;
}
```

---

## 📊 8. Dashboard Financiero (Analytics): `/analytics/{periodId}`
Precalculado mensualmente para gráficas ejecutivas ultrarrápidas en el panel de Administrador.

```typescript
interface MonthlyFinancialAnalytics {
  id: string;                          // "2026-10"
  tenantId: string;
  householdId: string;
  month: number;                       // 10
  year: number;                        // 2026

  // Valuación Patrimonial del Hogar
  totalInventoryValuation: number;     // $128,450.00 MXN
  cellarValuation: number;             // $94,500.00 MXN (Solo vinos)
  pantryValuation: number;             // $33,950.00 MXN (Despensa e insumos)

  // Gastos y Consumos del Mes
  monthlyTotalExpenditure: number;     // $18,200.00 MXN
  monthlyTotalConsumedValue: number;   // $16,400.00 MXN
  
  expenditureByCategory: {
    [category: string]: number;        // { "Vinos": 8500, "Despensa": 4200, ... }
  };

  // Métricas de Impacto
  zeroWasteMoneySavedThisMonth: number;// $1,850.00 MXN (Alimentos rescatados)
  personalInflationIndexWeighted: number;// +4.2% frente al trimestre anterior
  
  updatedAt: Timestamp;
}
```

---

## 🎙️ 9. Arquitectura de Comandos de Voz (Deep Linking / Intents)

Estructura de URI Schemes y Universal Links para Siri Shortcuts y Google Assistant App Actions:

```text
# Agregar producto mediante Siri o Google Assistant:
alacena://shopping-list/add?tenantId=...&householdId=...&item=Leche%20Deslactosada&quantity=2&unit=litros

# Escaneo rápido directo a cámara:
alacena://scan?mode=camera

# Ver vinos listos para beber en la cava (Sommelier):
alacena://cellar/ready-to-drink
```

Al disparar la intención de voz, la app procesa el deep link en segundo plano o abre directamente la lista con el producto agregado mediante `source: 'VOICE_ASSISTANT'`.
