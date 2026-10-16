// Servicio de Inteligencia de Precios, Inflación y Recomendaciones Multitienda
// Compara variaciones de precios (Subió vs. Bajó) y asesora dónde comprar más barato
// entre supermercados (La Comer, Costco, Walmart, Chedraui, Mercadona, etc.)

const STORAGE_KEY = 'alacena_price_records_verified_v2';

/**
 * Normaliza nombres de productos de tickets para obtener su nombre canónico
 * Elimina gramajes, presentaciones, SKUs y sufijos para permitir comparación cruzada entre tiendas.
 * Ej: "Arroz Sos 1 Kg" -> "arroz sos"
 *     "Refresco Coca Cola 2L" -> "coca cola"
 *     "Poro" -> "poro"
 *     "Chile Poblano" -> "chile poblano"
 */
export function getCanonicalProductName(rawName) {
  return String(rawName || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}
function getStorage() {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

/**
 * Carga todos los registros históricos de precios
 */
export function getAllPriceRecords() {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      storage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [];
  } catch (e) {
    console.warn('Error leyendo registros de precios:', e);
    return [];
  }
}

/**
 * Guarda registros de precios desde un ticket o compra confirmada
 */
export function recordPricePoints(items, storeName = 'Supermercado', receiptDate = null, receiptFolio = '') {
  if (!items || !items.length) return [];
  const current = getAllPriceRecords();
  const dateStr = receiptDate ? new Date(receiptDate).toISOString() : new Date().toISOString();

  const newRecords = [];

  items.forEach((item) => {
    const price = Number(item.realPrice || item.estimatedPriceMxn || item.price || 0);
    const qty = Number(item.quantity) || 1;
    if (price <= 0) return;

    // Calcular precio unitario o por kg
    const unitPrice = price;
    const canonicalName = getCanonicalProductName(item.name) + ' | ' + (item.unit || 'piezas') + ' | ' + (item.currency || 'MXN');
    if (!canonicalName) return;

    newRecords.push({
      id: `price-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      canonicalName,
      fullName: item.name,
      store: item.store || storeName,
      unitPrice,
      totalPrice: Math.round(price * qty * 100) / 100,
      quantity: qty,
      unit: item.unit || 'piezas',
      date: dateStr,
      receiptFolio: receiptFolio || '',
      isPromotion: Boolean(item.isPromotion),
    });
  });

  const updated = [...newRecords, ...current];
  // Limitar a los últimos 3,000 registros para óptimo rendimiento
  const trimmed = updated.slice(0, 3000);
  const storage = getStorage();
  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (e) {
      console.warn('Error guardando registros de precios:', e);
    }
  }

  return newRecords;
}

/**
 * Compara la variación de precio de un artículo (Subió vs. Bajó)
 * Compara con la compra anterior más reciente en la misma tienda o general.
 */
export function analyzeItemPriceTrend(productName, currentUnitPrice, currentStore, unit = 'piezas', currency = 'MXN') {
  if (!productName || !currentUnitPrice || currentUnitPrice <= 0) {
    return { status: 'first', text: 'Precio inicial', diff: 0, percent: 0 };
  }

  const canonical = getCanonicalProductName(productName) + ' | ' + unit + ' | ' + currency;
  const records = getAllPriceRecords().filter((r) => r.canonicalName === canonical);

  if (records.length === 0) {
    return { status: 'first', text: 'Primera compra registrada', diff: 0, percent: 0 };
  }

  // Buscar última compra previa en la misma tienda
  const sameStoreRecords = records
    .filter((r) => r.store.toLowerCase().trim() === (currentStore || '').toLowerCase().trim())
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const referenceRecord = sameStoreRecords[0] || records.sort((a, b) => new Date(b.date) - new Date(a.date))[0];

  if (!referenceRecord) {
    return { status: 'first', text: 'Primera compra', diff: 0, percent: 0 };
  }

  const prevPrice = referenceRecord.unitPrice;
  const diff = parseFloat((currentUnitPrice - prevPrice).toFixed(2));
  const percent = prevPrice > 0 ? parseFloat(((diff / prevPrice) * 100).toFixed(1)) : 0;

  // Umbral de tolerancia de centavos (0.50 MXN o 1%)
  if (Math.abs(diff) <= 0.20 || Math.abs(percent) < 0.5) {
    return {
      status: 'same',
      text: 'Sin variación (Precio estable)',
      diff: 0,
      percent: 0,
      previousPrice: prevPrice,
      previousDate: referenceRecord.date,
      previousStore: referenceRecord.store,
    };
  }

  if (diff < 0) {
    return {
      status: 'down',
      text: `Bajó $${Math.abs(diff).toFixed(2)} (${Math.abs(percent)}%)`,
      diff: Math.abs(diff),
      percent: Math.abs(percent),
      previousPrice: prevPrice,
      previousDate: referenceRecord.date,
      previousStore: referenceRecord.store,
      isSavings: true,
    };
  } else {
    return {
      status: 'up',
      text: `Subió +$${diff.toFixed(2)} (+${percent}%)`,
      diff,
      percent,
      previousPrice: prevPrice,
      previousDate: referenceRecord.date,
      previousStore: referenceRecord.store,
      isInflation: true,
    };
  }
}

/**
 * Asesor Multitienda: "¿Dónde comprarlo más barato?"
 * Analiza todas las tiendas donde se ha comprado este producto y encuentra la opción más barata.
 */
export function getCrossStoreRecommendation(productName, currentUnitPrice, currentStore, unit = 'piezas', currency = 'MXN') {
  if (!productName) return null;
  const canonical = getCanonicalProductName(productName) + ' | ' + unit + ' | ' + currency;
  const records = getAllPriceRecords().filter((r) => r.canonicalName === canonical);

  if (records.length === 0) return null;

  // Agrupar por tienda y tomar el precio más reciente de cada tienda
  const storeMap = new Map();
  records.forEach((r) => {
    const st = r.store || 'Supermercado';
    if (!storeMap.has(st) || new Date(r.date) > new Date(storeMap.get(st).date)) {
      storeMap.set(st, r);
    }
  });

  const storeBreakdown = Array.from(storeMap.values()).map((r) => ({
    store: r.store,
    unitPrice: r.unitPrice,
    unit: r.unit,
    date: r.date,
  })).sort((a, b) => a.unitPrice - b.unitPrice);

  if (storeBreakdown.length === 0) return null;

  const cheapest = storeBreakdown[0];
  const currentPrice = Number(currentUnitPrice) || 0;

  // Si no tenemos precio actual, solo devolver la tienda más económica
  if (currentPrice <= 0) {
    return {
      cheapestStore: cheapest.store,
      cheapestPrice: cheapest.unitPrice,
      storeBreakdown,
      recommendationText: `Más barato en ${cheapest.store} ($${cheapest.unitPrice.toFixed(2)})`,
      isBestPrice: false,
    };
  }

  const isCurrentCheapest = cheapest.store.toLowerCase().trim() === (currentStore || '').toLowerCase().trim() || currentPrice <= cheapest.unitPrice;

  if (isCurrentCheapest) {
    return {
      cheapestStore: currentStore || cheapest.store,
      cheapestPrice: currentPrice,
      storeBreakdown,
      isBestPrice: true,
      recommendationText: `🏆 ¡Mejor precio aquí en ${currentStore}!`,
    };
  }

  // Hay una tienda que lo vende más barato
  const savings = parseFloat((currentPrice - cheapest.unitPrice).toFixed(2));
  const savingsPct = parseFloat(((savings / currentPrice) * 100).toFixed(1));

  return {
    cheapestStore: cheapest.store,
    cheapestPrice: cheapest.unitPrice,
    currentPrice,
    savings,
    savingsPct,
    storeBreakdown,
    isBestPrice: false,
    recommendationText: `💡 En ${cheapest.store} está a $${cheapest.unitPrice.toFixed(2)} (Ahorras $${savings.toFixed(2)} / -${savingsPct}%)`,
  };
}

/**
 * Análisis Global de Inteligencia de Precios para un Ticket Completo
 */
export function analyzeTicketPriceIntelligence(items, currentStore = 'Supermercado') {
  if (!items || !items.length) {
    return {
      totalItems: 0,
      priceDropsCount: 0,
      priceHikesCount: 0,
      stableCount: 0,
      totalSavedVsPrevious: 0,
      totalInflationCost: 0,
      totalCrossStoreSavingsPotential: 0,
      recommendations: [],
      itemsAnalysis: [],
    };
  }

  let priceDropsCount = 0;
  let priceHikesCount = 0;
  let stableCount = 0;
  let totalSavedVsPrevious = 0;
  let totalInflationCost = 0;
  let totalCrossStoreSavingsPotential = 0;
  const recommendations = [];

  const itemsAnalysis = items.map((item) => {
    const price = Number(item.realPrice || item.estimatedPriceMxn || 0);
    const qty = Number(item.quantity) || 1;
    const unitPrice = price;

    const trend = analyzeItemPriceTrend(item.name, unitPrice, item.store || currentStore, item.unit || 'piezas', item.currency || 'MXN');
    const crossStore = getCrossStoreRecommendation(item.name, unitPrice, item.store || currentStore, item.unit || 'piezas', item.currency || 'MXN');

    if (trend.status === 'down') {
      priceDropsCount++;
      totalSavedVsPrevious += trend.diff * qty;
    } else if (trend.status === 'up') {
      priceHikesCount++;
      totalInflationCost += trend.diff * qty;
    } else {
      stableCount++;
    }

    if (crossStore && !crossStore.isBestPrice && crossStore.savings > 0) {
      const lineSavings = crossStore.savings * qty;
      totalCrossStoreSavingsPotential += lineSavings;
      recommendations.push({
        productName: item.name,
        currentStore: item.store || currentStore,
        currentPrice: unitPrice,
        cheapestStore: crossStore.cheapestStore,
        cheapestPrice: crossStore.cheapestPrice,
        lineSavings: parseFloat(lineSavings.toFixed(2)),
        savingsPct: crossStore.savingsPct,
      });
    }

    return {
      ...item,
      unitPrice,
      trend,
      crossStore,
    };
  });

  return {
    totalItems: items.length,
    priceDropsCount,
    priceHikesCount,
    stableCount,
    totalSavedVsPrevious: parseFloat(totalSavedVsPrevious.toFixed(2)),
    totalInflationCost: parseFloat(totalInflationCost.toFixed(2)),
    totalCrossStoreSavingsPotential: parseFloat(totalCrossStoreSavingsPotential.toFixed(2)),
    recommendations: recommendations.sort((a, b) => b.lineSavings - a.lineSavings),
    itemsAnalysis,
  };
}

/**
 * Consulta la lista de todos los productos monitoreados con su resumen multitienda
 */
export function getTrackedProductsComparison() {
  const records = getAllPriceRecords();
  const productsMap = new Map();

  records.forEach((r) => {
    if (!productsMap.has(r.canonicalName)) {
      productsMap.set(r.canonicalName, {
        canonicalName: r.canonicalName,
        displayName: r.fullName,
        unit: r.unit,
        stores: {},
        latestDate: r.date,
      });
    }
    const entry = productsMap.get(r.canonicalName);
    const st = r.store || 'Supermercado';

    if (!entry.stores[st] || new Date(r.date) > new Date(entry.stores[st].date)) {
      entry.stores[st] = {
        price: r.unitPrice,
        date: r.date,
        isPromotion: r.isPromotion,
      };
    }
    if (new Date(r.date) > new Date(entry.latestDate)) {
      entry.latestDate = r.date;
    }
  });

  return Array.from(productsMap.values()).map((p) => {
    const storePrices = Object.entries(p.stores).map(([stName, stData]) => ({
      store: stName,
      price: stData.price,
      date: stData.date,
      isPromotion: stData.isPromotion,
    })).sort((a, b) => a.price - b.price);

    const cheapest = storePrices[0];
    const mostExpensive = storePrices[storePrices.length - 1];
    const maxDifference = storePrices.length > 1 ? parseFloat((mostExpensive.price - cheapest.price).toFixed(2)) : 0;
    const maxDiffPct = storePrices.length > 1 && mostExpensive.price > 0 ? parseFloat(((maxDifference / mostExpensive.price) * 100).toFixed(1)) : 0;

    return {
      canonicalName: p.canonicalName,
      displayName: p.displayName,
      unit: p.unit,
      cheapestStore: cheapest?.store || 'N/A',
      cheapestPrice: cheapest?.price || 0,
      mostExpensiveStore: mostExpensive?.store || 'N/A',
      mostExpensivePrice: mostExpensive?.price || 0,
      maxDifference,
      maxDiffPct,
      storesCount: storePrices.length,
      storePrices,
      latestDate: p.latestDate,
    };
  }).sort((a, b) => b.maxDifference - a.maxDifference);
}
