# 🏛️ ALACENA Enterprise — Smart Pantry & Asset Tracking SaaS

Sistema integral de gestión de inventario, cava inteligente de vinos, asset tracking por hardware y despensa con inteligencia artificial para hogares premium y entornos residenciales multi-propiedad.

---

## 🎯 Arquitectura del Sistema (5 Fases Completadas al 100%)

```text
ALACENA Enterprise (Flutter 3.47 + Riverpod 3.x + Firebase)
├── Frontend (iOS / Android / Web)
│   ├── /lib/features/inventory/       → Inventario glanceable, Short IDs, badges semafóricos, 1-tap quick adjust
│   ├── /lib/features/sommelier/       → Cava Inteligente de Vinos (maridajes, notas de cata, drinking windows)
│   ├── /lib/features/shopping_list/   → Lista de compras colaborativa con bloqueo en tienda y comparativa web
│   ├── /lib/features/zero_waste/      → Chef IA para rescate de ingredientes por caducar y ahorro financiero
│   ├── /lib/features/analytics/       → Tablero financiero, valuación de activos, desglose e inflación
│   ├── /lib/features/hardware/        → Visor láser cámara (EAN/QR), Sensor NFC, Modo Lote continuo
│   ├── /lib/features/labels/          → Generador de etiquetas térmicas (50x30mm) con QR + Short ID legible
│   └── /lib/core/services/            → IA Gemini 1.5 Flash ($0 Tier), EAN OpenFoodFacts, Caché Offline
├── Backend Cloud Functions (Node.js 22)
│   ├── predictiveConsumptionCron     → Cron diario: run-rate, frecuencia promedio y auto-sugerencias
│   ├── onStockLevelAlert             → Disparador reactivo de stock bajo hacia la lista de compras
│   └── globalEanLookup               → Fallback de catálogo maestro de códigos comerciales
├── Firestore & Seguridad
│   ├── firestore.rules                → Aislamiento Multi-Tenant, Audit Trail append-only inalterable, RBAC
│   └── firestore.indexes.json         → Índices compuestos para consultas ordenadas por fecha/zona
└── Infraestructura & DevOps
    ├── Hosting: alacena.cobertores.com (Target: alacena-app)
    └── Scripts automatizados en /scripts/
```

---

## 🛡️ Resiliencia y Manejo de "Edge Cases" en Entornos Reales

Para operar sin fallos en cocinas húmedas, cuartos fríos y al descargar grandes volúmenes de compras:

1. **Fallback Alfanumérico (Short ID) & "Replace Tag":**
   - Cada etiqueta térmica impresa lleva un **Short ID** en fuente monoespaciada justo debajo del QR (ej. `ALC-7K9B`).
   - El escáner cuenta con teclado numérico/alfanumérico integrado para teclear el código manualmente si la etiqueta está grasienta o rota.
   - **Flujo "Replace Tag":** Permite escanear un nuevo QR en blanco y asignarlo a un producto preexistente, invalidando el QR dañado pero preservando el 100% del historial de auditoría y precios.

2. **Modo de Escaneo Continuo (Batch / Rapid Scan Mode):**
   - Interruptor en la cámara para activar `MODO LOTE ON`.
   - Permite escanear decenas de productos seguidos sin que se abra ningún modal ni se interrumpa el visor láser.
   - Retroalimentación auditiva y háptica inmediata con contador en tiempo real (`X artículos leídos`).
   - Botón `[ Procesar Lote ]` para impactar todas las lecturas de una sola vez.

3. **Manejo de Fallos en Códigos Comerciales (EAN/UPC) — "Flujo Express":**
   - Si un código de barras de supermercado no existe en Firestore ni en bases públicas (OpenFoodFacts): **el usuario jamás se bloquea**.
   - Se crea al instante con `requiresMetadataUpdate: true` y código `EXP-XXXX`.
   - El ingreso físico a la despensa continúa sin fricción y el usuario puede completar la foto o marca posteriormente.

---

## 💰 Regla de "Cost-Zero" e Inteligencia Artificial Híbrida

- **Escaneo Local a $0:** Todo el procesamiento óptico de Códigos QR, Códigos de Barras (EAN-13, UPC) y tags NFC se procesa **en el dispositivo** a costo cero.
- **IA de Visión On-Demand:** El análisis fotográfico de alacena ("Auto-Shopping List") utiliza la API de **Google Gemini 1.5 Flash (Free Tier)** únicamente bajo petición explícita del usuario.
- **Caché Offline Agresiva:** Firestore opera con `persistenceEnabled: true` y suscripciones optimizadas para proteger las cuotas gratuitas de Firebase Spark.

---

## 🚀 Despliegue y Ejecución

### Ejecución Local
```bash
# Análisis estático (0 advertencias)
flutter analyze

# Suite de pruebas unitarias y de widgets
flutter test

# Ejecución en dispositivo o navegador
flutter run -d chrome
```

### Despliegue a Producción
```cmd
# Desplegar únicamente Hosting Web (alacena.cobertores.com)
scripts\deploy_hosting.bat

# Despliegue completo (Reglas, Índices, Storage, Hosting y Cloud Functions)
scripts\deploy_all.bat
```
