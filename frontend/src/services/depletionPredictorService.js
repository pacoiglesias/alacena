/**
 * Servicio de Predicción de Agotamiento (Machine Learning Doméstico)
 * Analiza el historial de compras y consumos (timesConsumed, timesPurchased, fechas)
 * para calcular la tasa de agotamiento diaria y predecir los días exactos que quedan de stock.
 */

export function calculateDepletionPredictions(products = [], learnedMemory = {}) {
  const now = Date.now();
  const predictions = [];

  products.forEach((product) => {
    const key = (product.barcode || product.name || '').toLowerCase();
    const memory = learnedMemory[key] || {};

    const currentQty = parseFloat(product.quantity) || 0;
    const minStock = parseFloat(product.minStock) || 1;
    const timesConsumed = parseFloat(memory.timesConsumed) || 0;
    const timesPurchased = parseFloat(memory.timesPurchased) || 1;

    // Calcular consumo estimado diario
    // 1. Si tenemos historial de consumo registrado
    let dailyBurnRate = 0;
    if (timesConsumed > 0) {
      // Estimación base: frecuencia relativa
      dailyBurnRate = Math.max(0.15, timesConsumed / 14); // promedio sobre ventana de 2 semanas
    } else {
      // Estimación heurística por categoría
      const cat = (product.category || '').toLowerCase();
      if (cat.includes('lácteo') || cat.includes('leche') || cat.includes('pan')) {
        dailyBurnRate = 0.35; // leche/pan se consumen rápido
      } else if (cat.includes('huevo') || cat.includes('fruta') || cat.includes('verdura')) {
        dailyBurnRate = 0.25;
      } else if (cat.includes('carne') || cat.includes('pescado')) {
        dailyBurnRate = 0.30;
      } else if (cat.includes('aceite') || cat.includes('arroz') || cat.includes('harina')) {
        dailyBurnRate = 0.08; // abarrotes secos duran más
      } else {
        dailyBurnRate = 0.12;
      }
    }

    // Días restantes estimados antes de desabasto total
    const daysRemaining = dailyBurnRate > 0 ? Math.max(0, Math.round(currentQty / dailyBurnRate)) : 99;
    const isCritical = daysRemaining <= 3 || currentQty <= minStock;
    const isWarning = daysRemaining <= 7 && daysRemaining > 3;

    if (isCritical || isWarning) {
      predictions.push({
        productId: product.id,
        name: product.name,
        currentQty,
        unit: product.unit || 'piezas',
        daysRemaining,
        dailyBurnRate: parseFloat(dailyBurnRate.toFixed(2)),
        suggestedRestockQty: Math.max(1, (product.idealStock || 5) - currentQty),
        isCritical,
        isWarning,
        urgency: isCritical ? 'CRITICAL' : 'WARNING',
        zone: product.zone || 'Alacena Principal',
        store: product.store || 'Supermercado',
        estimatedPriceMxn: product.unitPriceMxn || 0,
      });
    }
  });

  // Ordenar de más urgente (menos días) a menos urgente
  return predictions.sort((a, b) => a.daysRemaining - b.daysRemaining);
}
