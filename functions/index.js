/**
 * ALACENA Enterprise - Cloud Functions
 * Módulo de Consumo Predictivo (ML Heurístico), Disparadores de Stock y Sincronización Multi-Tenant.
 */

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. Consumo Predictivo (Cron Diario a las 03:00 AM)
 * Analiza el historial de Audit Logs de los últimos 30 días para calcular la
 * frecuencia_consumo_promedio y sugerir artículos a la lista de compras antes de que se agoten.
 */
exports.predictiveConsumptionCron = onSchedule(
  {
    schedule: "every day 03:00",
    timeZone: "America/Mexico_City",
    memory: "256MiB",
  },
  async (event) => {
    console.log("Iniciando análisis de consumo predictivo multi-tenant...");
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Iterar workspaces (inquilinos/familias)
    const workspacesSnap = await db.collection("workspaces").get();

    for (const workspaceDoc of workspacesSnap.docs) {
      const workspaceId = workspaceDoc.id;
      const inventoryRef = db.collection(`workspaces/${workspaceId}/inventory`);
      const auditRef = db.collection(`workspaces/${workspaceId}/audit_logs`);
      const shoppingRef = db.collection(`workspaces/${workspaceId}/shopping_list`);

      // 1. Obtener consumos de los últimos 30 días
      const consumeLogsSnap = await auditRef
        .where("action", "==", "SCAN_CONSUME")
        .where("timestamp", ">=", thirtyDaysAgo)
        .get();

      if (consumeLogsSnap.empty) continue;

      // 2. Agrupar consumos por itemId
      const consumptionMap = {};
      consumeLogsSnap.forEach((doc) => {
        const data = doc.data();
        const itemId = data.itemId;
        if (!itemId) return;

        if (!consumptionMap[itemId]) {
          consumptionMap[itemId] = {
            totalConsumed: 0,
            timestamps: [],
            itemName: data.itemName,
            unit: data.unit || "pza",
          };
        }
        consumptionMap[itemId].totalConsumed += Math.abs(data.quantityDelta || 1);
        consumptionMap[itemId].timestamps.push(data.timestamp.toDate());
      });

      // 3. Evaluar cada producto contra su stock actual
      const batch = db.batch();
      let suggestionsCount = 0;

      for (const [itemId, stats] of Object.entries(consumptionMap)) {
        const itemDoc = await inventoryRef.doc(itemId).get();
        if (!itemDoc.exists) continue;

        const item = itemDoc.data();
        const currentQty = item.currentQuantity || 0;
        const dailyRunRate = stats.totalConsumed / 30.0; // Unidades consumidas por día
        const daysRemaining = dailyRunRate > 0 ? currentQty / dailyRunRate : 999;

        // Frecuencia promedio en días entre reposiciones
        const avgFrequencyDays = dailyRunRate > 0 ? (1 / dailyRunRate) : 30;

        // Actualizar métrica en el documento del producto
        batch.update(inventoryRef.doc(itemId), {
          frecuencia_consumo_promedio: Number(avgFrequencyDays.toFixed(1)),
          run_rate_diario: Number(dailyRunRate.toFixed(2)),
          dias_estimados_restantes: Number(daysRemaining.toFixed(1)),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Si se proyecta que el stock se agote en <= 3 días y no está ya en la lista
        if (daysRemaining <= 3 && currentQty <= item.minAlertQuantity * 1.5) {
          const existingShopSnap = await shoppingRef
            .where("itemId", "==", itemId)
            .where("isPurchased", "==", false)
            .limit(1)
            .get();

          if (existingShopSnap.empty) {
            const neededQty = Math.max(1, (item.idealQuantity || 3) - currentQty);
            const newShopDoc = shoppingRef.doc();
            batch.set(newShopDoc, {
              id: newShopDoc.id,
              householdId: item.householdId,
              itemId: itemId,
              name: item.name,
              category: item.category,
              neededQuantity: neededQty,
              unit: item.unit || "pza",
              estimatedPrice: item.unitPrice || 0,
              isPurchased: false,
              source: "AI_PREDICTIVE",
              cheapestVendor: item.lastPurchasePlace || "Costco Wholesale",
              createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            suggestionsCount++;
          }
        }
      }

      await batch.commit();
      console.log(`Workspace ${workspaceId}: Generadas ${suggestionsCount} sugerencias predictivas.`);
    }

    return { success: true };
  }
);

/**
 * 2. Disparador de Stock Bajo en Tiempo Real
 * Cuando el stock de un producto baja de su umbral mínimo tras un escaneo,
 * lo añade de forma reactiva a la lista de compras del hogar.
 */
exports.onStockLevelAlert = onDocumentWritten(
  "workspaces/{workspaceId}/inventory/{itemId}",
  async (event) => {
    const afterData = event.data.after.data();
    if (!afterData) return; // Eliminación

    const currentQty = afterData.currentQuantity || 0;
    const minAlert = afterData.minAlertQuantity || 1;

    if (currentQty <= minAlert) {
      const { workspaceId, itemId } = event.params;
      const shoppingRef = db.collection(`workspaces/${workspaceId}/shopping_list`);

      const existingSnap = await shoppingRef
        .where("itemId", "==", itemId)
        .where("isPurchased", "==", false)
        .limit(1)
        .get();

      if (existingSnap.empty) {
        const needed = Math.max(1, (afterData.idealQuantity || 3) - currentQty);
        await shoppingRef.add({
          householdId: afterData.householdId,
          itemId: itemId,
          name: afterData.name,
          category: afterData.category,
          neededQuantity: needed,
          unit: afterData.unit || "pza",
          estimatedPrice: afterData.unitPrice || 0,
          isPurchased: false,
          source: "LOW_STOCK_RULE",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      }
    }
  }
);

/**
 * 3. Endpoint de Fallback Global EAN / UPC
 */
exports.globalEanLookup = onRequest(async (req, res) => {
  const barcode = req.query.barcode;
  if (!barcode) {
    return res.status(400).json({ error: "Falta el parámetro barcode" });
  }

  // Consulta en catálogo maestro cacheado de Firestore
  const cached = await db.collection("global_ean_cache").doc(barcode).get();
  if (cached.exists) {
    return res.json({ source: "CACHE", product: cached.data() });
  }

  return res.json({
    source: "NOT_FOUND",
    requires_metadata_update: true,
    barcode: barcode,
  });
});
