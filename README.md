# 🏛️ ALACENA Enterprise & CavaPro — Sistema Operativo de Gestión Doméstica & Cava Inteligente

Sistema integral de gestión de inventario, cava patrimonial de vinos, control de compras por pasillos físicos, costeo de cocina gourmet, auditoría forense con cadena SHA-256 e impresión de etiquetas QR para residencias de alto nivel.

**Versión Actual:** `v3.5.3-Enterprise-Luxe`  
**Producción Web:** [https://alacena-enterprise-prod.web.app](https://alacena-enterprise-prod.web.app)  
**Proyecto Firebase:** `alacena-enterprise-prod`  
**Hosting Target:** `alacena-app`  
**Moneda Oficial:** Pesos Mexicanos (MXN / $) — `es-MX`

---

## 🏗️ Arquitectura del Sistema

```text
ALACENA Enterprise (v3.5.3-Enterprise-Luxe)
├── Frontend Web (React 19 + Vite 8 + TailwindCSS 4 + Lucide)
│   ├── /frontend/src/components/layout/     → Header con indicador de versión, modales globales, tabs
│   ├── /frontend/src/components/inventory/  → Despensa inteligente, zonas, semáforos de stock y FEFO
│   ├── /frontend/src/components/sommelier/  → CavaPro: notas de cata, vintage, ROI, ubicación física
│   ├── /frontend/src/components/shopping/   → Supermercado por pasillos físicos, ticket térmico y librito QR
│   ├── /frontend/src/components/recipes/    → Recetario gourmet, costeo por porción con merma y modo cocinar
│   ├── /frontend/src/components/scanner/    → Visor híbrido WebRTC (QR, EAN-13, UPC) con retroalimentación sonora
│   ├── /frontend/src/components/catalogs/   → Gestor CRUD completo de tiendas, personal, categorías y unidades
│   ├── /frontend/src/components/audit/      → Bitácora forense append-only con encadenamiento criptográfico SHA-256
│   └── /frontend/src/services/              → qrPdfService, catalogsService, deduplication engine, IndexedDB
├── Backend & Nube (Firebase Serverless)
│   ├── Firestore Rules                      → Seguridad RBAC, aislamiento multi-tenant y reglas de auditoría
│   ├── Firebase Hosting                     → Distribución global ultra-rápida con caché HTTP y PWA
│   └── Firebase Cloud Functions             → Cron jobs y triggers de cálculo predictivo
├── Scripts de Operación & DevOps (/scripts/)
│   ├── hacer_respaldo_local.bat / .ps1      → Generador automatizado de backups comprimidos en /backups/
│   ├── deploy_hosting.bat                   → Compilación y publicación instantánea a Firebase Hosting
│   ├── deploy_all.bat                       → Despliegue de reglas, índices, hosting y funciones
│   └── reconectar_firebase_y_mcp.bat        → Diagnóstico y reconexión de credenciales Firebase/MCP
└── Respaldos del Sistema (/backups/)
    └── ALACENA_backup_[TIMESTAMP]_v3.5.3.zip → Snapshots completos sin dependencias pesadas
```

---

## 🛡️ Características & Módulos Clave

### 1. 🛒 Lista del Súper por Pasillos Físicos
- **Organización Óptima:** Agrupada por el orden físico de compra en tienda:
  1. 🥩 Carnicería & Pescados
  2. 🧀 Lácteos & Quesos
  3. 🥬 Frutas & Verduras
  4. 🥫 Abarrotes & Despensa
  5. 🍷 Cava, Vinos & Licores
  6. ☕ Café, Panadería & Desayuno
  7. 🧼 Limpieza & Hogar
- **Motor de Deduplicación:** Normalización NFD insensible a mayúsculas, tildes y terminaciones en plural (`deduplication.js`).
- **Control Táctil Móvil:** Botones de incremento/decremento `+`/`-` de alta respuesta para una mano en pasillo.

### 2. 🖨️ Motor de Impresión QR Físico Aislado
- **Cero Páginas en Blanco:** Los diálogos de impresión (Librito de Despensa, Ticket de Compra, Etiquetas de Productos) utilizan iframes aislados de `900x1200px` con imágenes QR rasterizadas en Base64, evitando colapsos CSS causados por modales con posición `fixed`.
- **Compatibilidad Térmica & Carta:** Generación de etiquetas tipo ticket y planillas en PDF de 12 QRs por hoja.

### 3. 🍷 CavaPro & Sommelier Inteligente
- Registro patrimonial de botellas: bodega, añada (vintage), país, región, cepa, temperatura óptima y ventana de guarda.
- Localización física exacta en cava (estante, nivel, casilla).
- Descorche atómico: reduce inventario, solicita nota de cata y firma bitácora forense.

### 4. ⚙️ Catálogos Dinámicos con CRUD Completo
- Administración en tiempo real de:
  - 🏪 Tiendas y Proveedores (con emojis y notas de compra).
  - 👤 Personal de Servicio (roles: admin, cocinera, chofer, camarista).
  - 🏷️ Categorías de Almacén.
  - 📏 Unidades de Medida.
- Búsqueda instantánea, edición con lápiz interactivo y normalización defensiva de datos legacy.

### 5. 🔐 Bitácora Forense SHA-256
- Cada movimiento (ingreso, merma, descorche, cocinado) genera una entrada inmutable con hash SHA-256 encadenado.
- Detección inmediata de inconsistencias o manipulaciones de stock.

---

## 🛠️ Guía Rápida de Operación

### 📦 Generar Respaldo Local
Para crear una copia comprimida de seguridad del código fuente y configuraciones:
```cmd
scripts\hacer_respaldo_local.bat
```
El archivo ZIP resultante se guardará en la carpeta `backups/` con fecha, hora y versión.

### 💻 Desarrollo Local (Frontend Web)
```cmd
cd frontend
npm install
npm run dev
```

### 🚀 Despliegue a Producción
```cmd
scripts\deploy_hosting.bat
```
O de forma manual:
```cmd
cd frontend
npm run build
firebase deploy --only hosting --project alacena-enterprise-prod
```

---

## 🌐 Dominio Personalizado: `alacena.cobertores.com`

Para conectar tu dominio registrado en **Hostinger** con Firebase Hosting, consulta la guía detallada:
👉 [CONFIGURAR_DOMINIO_HOSTINGER.md](file:///c:/Users/pacoi/ALACENA/CONFIGURAR_DOMINIO_HOSTINGER.md)
