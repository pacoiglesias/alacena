/**
 * Motor de Deduplicación y Consolidación Inteligente para ALACENA Enterprise
 * Evita la duplicación de insumos, ingredientes en recetas y listas de compras.
 */

/**
 * Normaliza nombres eliminando mayúsculas, acentos, caracteres especiales y espacios redundantes
 */
function sameScope(a, b) {
  if (a.barcode && b.barcode && String(a.barcode) !== String(b.barcode)) return false;
  return (a.householdId || 'house-1') === (b.householdId || 'house-1') &&
    normalizeItemName(a.unit || 'piezas') === normalizeItemName(b.unit || 'piezas');
}

export function normalizeItemName(str = '') {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar acentos (á -> a, é -> e)
    .replace(/[°º]/g, '')            // Normalizar símbolos de grado y ordinales (5° -> 5)
    .replace(/[^\w\s]/g, ' ')        // Quitar signos de puntuación y paréntesis
    .trim()
    .replace(/\s+/g, ' ');           // Colapsar espacios múltiples
}

/**
 * Compara dos nombres y determina si son el mismo insumo (soporta singulares, plurales y variaciones)
 */
export function areItemsEquivalent(nameA = '', nameB = '') {
  const normA = normalizeItemName(nameA);
  const normB = normalizeItemName(nameB);
  if (!normA || !normB) return false;
  if (normA === normB) return true;

  // Normalizar singular / plural en español (ej. "tomates" -> "tomate", "huevos" -> "huevo")
  const toSingular = (w) => {
    const common = { tomates: 'tomate', jitomates: 'jitomate', chiles: 'chile', elotes: 'elote', aguacates: 'aguacate', aceites: 'aceite', quesos: 'queso', huevos: 'huevo' };
    if (common[w]) return common[w];
    if (w.endsWith('ces')) return w.slice(0, -3) + 'z'; // peces -> pez
    if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
    if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) return w.slice(0, -1);
    return w;
  };

  const singA = normA.split(' ').map(toSingular).join(' ');
  const singB = normB.split(' ').map(toSingular).join(' ');
  if (singA === singB) return true;

  return false;
}

/**
 * Desduplica y consolida una lista de insumos de compras sumando cantidades
 */
export function deduplicateShoppingItems(items = []) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const result = [];

  items.forEach((item) => {
    if (!item || !item.name) return;
    const existingIdx = result.findIndex((r) => 
      sameScope(r, item) && (areItemsEquivalent(r.name, item.name) || (r.barcode && item.barcode && r.barcode === item.barcode))
    );

    if (existingIdx >= 0) {
      const existing = result[existingIdx];
      const newQty = parseFloat(((parseFloat(existing.quantity) || 0) + (parseFloat(item.quantity) || 1)).toFixed(3));
      result[existingIdx] = {
        ...existing,
        quantity: newQty,
        store: item.store || existing.store,
        estimatedPriceMxn: (item.estimatedPriceMxn > 0 ? item.estimatedPriceMxn : existing.estimatedPriceMxn) || 0,
        targetZone: item.targetZone || existing.targetZone,
        checked: false, // reactivar si se añade de nuevo
      };
    } else {
      result.push({ ...item });
    }
  });

  return result;
}

/**
 * Desduplica una lista de ingredientes de recetas sumando sus cantidades
 */
export function deduplicateRecipeIngredients(ingredients = []) {
  if (!Array.isArray(ingredients) || ingredients.length === 0) return [];
  const map = new Map();

  ingredients.forEach((ing) => {
    const rawName = ing.productName || ing.name || '';
    const norm = normalizeItemName(rawName);
    if (!norm) return;

    if (map.has(norm)) {
      const existing = map.get(norm);
      existing.amount = parseFloat(((parseFloat(existing.amount) || 0) + (parseFloat(ing.amount) || 1)).toFixed(3));
    } else {
      map.set(norm, {
        productName: rawName.trim(),
        amount: parseFloat(ing.amount) || 1,
        unit: ing.unit || 'kg',
      });
    }
  });

  return Array.from(map.values());
}

/**
 * Desduplica y consolida el catálogo de inventario evitando productos repetidos
 */
export function deduplicateInventoryProducts(products = []) {
  if (!Array.isArray(products) || products.length === 0) return [];
  const result = [];

  products.forEach((prod) => {
    if (!prod || !prod.name) return;
    const existingIdx = result.findIndex((r) => 
      sameScope(r, prod) && (areItemsEquivalent(r.name, prod.name) || (r.barcode && prod.barcode && r.barcode === prod.barcode))
    );

    if (existingIdx >= 0) {
      const existing = result[existingIdx];
      const newQty = parseFloat(((parseFloat(existing.quantity) || 0) + (parseFloat(prod.quantity) || 0)).toFixed(3));
      result[existingIdx] = {
        ...existing,
        quantity: newQty,
        minStock: Math.max(existing.minStock || 1, prod.minStock || 1),
        idealStock: Math.max(existing.idealStock || 5, prod.idealStock || 5),
        unitPriceMxn: (prod.unitPriceMxn > 0 ? prod.unitPriceMxn : existing.unitPriceMxn) || 0,
        updatedAt: new Date().toISOString(),
      };
    } else {
      result.push({ ...prod });
    }
  });

  return result;
}
