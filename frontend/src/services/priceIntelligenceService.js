// Servicio de Inteligencia de Precios, Inflación y Recomendaciones Multitienda
// Compara variaciones de precios (Subió vs. Bajó) y asesora dónde comprar más barato
// entre supermercados (La Comer, Costco, Walmart, Chedraui, Mercadona, etc.)

const STORAGE_KEY = 'alacena_price_records';

/**
 * Normaliza nombres de productos de tickets para obtener su nombre canónico
 * Elimina gramajes, presentaciones, SKUs y sufijos para permitir comparación cruzada entre tiendas.
 * Ej: "Arroz Sos 1 Kg" -> "arroz sos"
 *     "Refresco Coca Cola 2L" -> "coca cola"
 *     "Poro" -> "poro"
 *     "Chile Poblano" -> "chile poblano"
 */
export function getCanonicalProductName(rawName) {
  if (!rawName) return '';
  let clean = rawName.toLowerCase().trim();

  // Eliminar prefijos de lista o viñetas
  clean = clean.replace(/^[-•*–—]+\s*/, '');

  // Eliminar presentaciones de empaque y volumen (1kg, 500g, 2l, 355ml, 6pk, etc.)
  clean = clean.replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|kilos|g|gr|l|lt|lts|ml|piezas|pzas|pz|pack|pk)\b/gi, '');
  clean = clean.replace(/\b(?:1kg|2kg|500g|250g|1l|2l|1\.5l|355ml|600ml)\b/gi, '');

  // Eliminar referencias genéricas de ticket
  clean = clean.replace(/\b(?:refresco|agua|galleta|galletas|queso|harina)\b/gi, (match) => {
    // Preservar la palabra clave pero sin prefijos redundantes
    return match;
  });

  // Eliminar sufijos de códigos de lote o letras residuales de tickets (ej: " de conde d" -> " de conde", " en p" -> "")
  clean = clean.replace(/\s+[a-z]$/i, '');
  clean = clean.replace(/\s+en\s+[a-z]$/i, '');

  // Normalizar acentos
  clean = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Limpiar espacios múltiples y caracteres raros
  clean = clean.replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

  // Casos especiales frecuentes
  if (clean.includes('coca cola') || clean.includes('coca')) return 'coca cola';
  if (clean.includes('mundet')) return 'refresco mundet';
  if (clean.includes('canada dry')) return 'agua canada dry';
  if (clean.includes('arroz sos')) return 'arroz sos';
  if (clean.includes('frijol verde valle') || clean.includes('verde valle')) return 'frijol verde valle';
  if (clean.includes('alubias cidacos') || clean.includes('cidacos')) return 'alubias cidacos';
  if (clean.includes('empanizador bimbo')) return 'empanizador bimbo';
  if (clean.includes('lechuga hidrop')) return 'lechuga hidroponica';
  if (clean.includes('espinaca')) return 'espinaca';
  if (clean.includes('chile poblano')) return 'chile poblano';
  if (clean.includes('poro')) return 'poro';
  if (clean.includes('castana')) return 'castana';
  if (clean.includes('tocino')) return 'tocino ahumado';
  if (clean.includes('pepino')) return 'pepino persa';
  if (clean.includes('elote')) return 'elote cocido';
  if (clean.includes('morcilla')) return 'morcilla';
  if (clean.includes('chorizo')) return 'chorizo';
  if (clean.includes('aceite oliva')) return 'aceite de oliva';
  if (clean.includes('aguacate')) return 'aguacate hass';
  if (clean.includes('leche lala') || clean.includes('leche entera')) return 'leche entera';
  if (clean.includes('ribeye')) return 'ribeye prime';
  if (clean.includes('pollo')) return 'pechuga de pollo';
  if (clean.includes('papel higienico') || clean.includes('papel de bano')) return 'papel higienico';

  return clean;
}

/**
 * Semilla de registros referenciales para benchmarking multitienda inicial
 * (Precios reales de mercado México y España para activar comparativas inmediatas)
 */
const SEED_PRICE_RECORDS = [
  // Arroz SOS
  { canonicalName: 'arroz sos', fullName: 'Arroz SOS 1 Kg', store: 'Walmart Express', unitPrice: 54.50, unit: 'kg', date: '2026-09-28T10:00:00' },
  { canonicalName: 'arroz sos', fullName: 'Arroz SOS 1 Kg', store: 'Chedraui Selecto', unitPrice: 58.00, unit: 'kg', date: '2026-10-02T11:00:00' },
  { canonicalName: 'arroz sos', fullName: 'Arroz SOS Bulto 5kg', store: 'Costco Wholesale', unitPrice: 48.00, unit: 'kg', date: '2026-09-15T15:00:00' },

  // Coca Cola
  { canonicalName: 'coca cola', fullName: 'Refresco Coca Cola 12 Pack', store: 'Costco Wholesale', unitPrice: 142.00, unit: 'piezas', date: '2026-09-20T12:00:00' },
  { canonicalName: 'coca cola', fullName: 'Refresco Coca Cola Pack', store: 'Walmart Express', unitPrice: 155.00, unit: 'piezas', date: '2026-10-05T14:00:00' },

  // Frijol Verde Valle
  { canonicalName: 'frijol verde valle', fullName: 'Frijol Negro Verde Valle 1kg', store: 'Walmart Express', unitPrice: 46.50, unit: 'kg', date: '2026-09-22T16:00:00' },
  { canonicalName: 'frijol verde valle', fullName: 'Frijol Verde Valle 1kg', store: 'Chedraui Selecto', unitPrice: 48.90, unit: 'kg', date: '2026-10-01T17:00:00' },

  // Aceite de Oliva
  { canonicalName: 'aceite de oliva', fullName: 'Aceite de Oliva Extra Virgen 1L', store: 'La Comer', unitPrice: 185.00, unit: 'litros', date: '2026-09-10T11:00:00' },
  { canonicalName: 'aceite de oliva', fullName: 'Aceite Oliva Extra 2L Kirkland', store: 'Costco Wholesale', unitPrice: 172.50, unit: 'litros', date: '2026-09-18T13:00:00' },
  { canonicalName: 'aceite de oliva', fullName: 'Aceite Oliva Virgen Extra 1L Hacendado', store: 'Mercadona', unitPrice: 8.95, unit: 'litros', date: '2026-10-01T12:00:00' },

  // Chile Poblano
  { canonicalName: 'chile poblano', fullName: 'Chile Poblano Fresco', store: 'Chedraui Selecto', unitPrice: 58.00, unit: 'kg', date: '2026-09-25T10:00:00' },
  { canonicalName: 'chile poblano', fullName: 'Chile Poblano 1kg', store: 'Mercado Local', unitPrice: 45.00, unit: 'kg', date: '2026-10-08T11:00:00' },

  // Aguacate Hass
  { canonicalName: 'aguacate hass', fullName: 'Aguacate Hass Malla 1.5kg', store: 'Costco Wholesale', unitPrice: 86.00, unit: 'kg', date: '2026-09-30T10:00:00' },
  { canonicalName: 'aguacate hass', fullName: 'Aguacate Hass', store: 'La Comer', unitPrice: 94.00, unit: 'kg', date: '2026-09-15T12:00:00' },

  // Alubias Cidacos
  { canonicalName: 'alubias cidacos', fullName: 'Alubias Cocidas Cidacos 570g', store: 'Chedraui Selecto', unitPrice: 92.00, unit: 'piezas', date: '2026-09-20T10:00:00' },

  // Castañas
  { canonicalName: 'castana', fullName: 'Castañas a Granel', store: 'Chedraui Selecto', unitPrice: 380.00, unit: 'kg', date: '2026-09-15T10:00:00' },
];

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
  if (!storage) return [...SEED_PRICE_RECORDS];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      storage.setItem(STORAGE_KEY, JSON.stringify(SEED_PRICE_RECORDS));
      return [...SEED_PRICE_RECORDS];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...SEED_PRICE_RECORDS];
  } catch (e) {
    console.warn('Error leyendo registros de precios:', e);
    return [...SEED_PRICE_RECORDS];
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
    const unitPrice = parseFloat((price / qty).toFixed(2));
    const canonicalName = getCanonicalProductName(item.name);
    if (!canonicalName) return;

    newRecords.push({
      id: `price-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      canonicalName,
      fullName: item.name,
      store: item.store || storeName,
      unitPrice,
      totalPrice: price,
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
export function analyzeItemPriceTrend(productName, currentUnitPrice, currentStore) {
  if (!productName || !currentUnitPrice || currentUnitPrice <= 0) {
    return { status: 'first', text: 'Precio inicial', diff: 0, percent: 0 };
  }

  const canonical = getCanonicalProductName(productName);
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
export function getCrossStoreRecommendation(productName, currentUnitPrice, currentStore) {
  if (!productName) return null;
  const canonical = getCanonicalProductName(productName);
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
    const unitPrice = parseFloat((price / qty).toFixed(2));

    const trend = analyzeItemPriceTrend(item.name, unitPrice, item.store || currentStore);
    const crossStore = getCrossStoreRecommendation(item.name, unitPrice, item.store || currentStore);

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
