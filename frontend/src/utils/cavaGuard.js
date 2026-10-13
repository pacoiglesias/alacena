// Utilidad de Guardia y Regla Estricta de Cava (Cava Guard)
// Regla del Hogar: En la Cava ÚNICAMENTE se almacenan BOTELLAS (Vinos, Destilados, Cavas, Champagnes).
// Prohíbe alimentos, harinas, abarrotes o carnes en la Cava, y fija la unidad exclusivamente a 'botellas'.

export function isCavaZone(zoneName = '', zones = []) {
  if (!zoneName) return false;
  const lower = zoneName.toLowerCase();
  if (lower.includes('cava') || lower.includes('cellar') || lower.includes('bodega')) return true;

  const foundZone = zones.find(z => z.name === zoneName || z.id === zoneName);
  return Boolean(foundZone && (foundZone.type === 'WINE_CELLAR' || (foundZone.name || '').toLowerCase().includes('cava')));
}

export function isAlcoholicOrBeverage(name = '', category = '') {
  const text = `${name} ${category}`.toLowerCase();
  const wineKeywords = [
    'vino', 'tinto', 'blanco', 'rosado', 'crianza', 'reserva', 'gran reserva',
    'ribera', 'rioja', 'champagne', 'cava', 'prosecco', 'espumoso', 'tequila',
    'mezcal', 'ron', 'whisky', 'whiskey', 'gin', 'ginebra', 'vodka', 'brandy',
    'cognac', 'licor', 'vermut', 'aperitivo', 'bodega', 'añada', 'chardonnay',
    'cabernet', 'malbec', 'tempranillo', 'sauvignon', 'syrah', 'merlot', 'pinot',
    'nebbiolo', 'oporto', 'jerez', 'botella'
  ];
  return wineKeywords.some(kw => text.includes(kw));
}

/**
 * Aplica la regla estricta de Cava a un producto:
 * - Si está en Cava:
 *   1. Si NO es bebida alcohólica/botella (es comida, carne, harina, limpieza), lo reubica a la Alacena o Refrigerador.
 *   2. Si es bebida alcohólica/vino: fuerza la unidad a 'botellas', categoría a 'Vinos & Licores' y marca isWine = true.
 */
export function sanitizeCavaProduct(product, zones = []) {
  if (!product) return product;

  const inCava = isCavaZone(product.zone, zones);

  if (inCava) {
    const isBeverage = isAlcoholicOrBeverage(product.name, product.category) || Boolean(product.isWine);

    if (!isBeverage) {
      // Reubicar insumos no vínicos a Alacena o Refrigerador
      const text = `${product.name || ''} ${product.category || ''}`.toLowerCase();
      const isCold = text.includes('carn') || text.includes('lact') || text.includes('queso') || 
                     text.includes('pescad') || text.includes('marisc') || text.includes('pollo') || 
                     text.includes('jamon') || text.includes('embutid') || text.includes('fresco') ||
                     text.includes('congelad');
      const defaultNonWineZone = isCold ? 'Refrigerador' : 'Alacena Principal';

      return {
        ...product,
        zone: defaultNonWineZone,
        isWine: false,
      };
    }

    // Es vino / botella en cava: forzar estrictamente 'botellas'
    return {
      ...product,
      unit: 'botellas',
      category: 'Vinos & Licores',
      isWine: true,
    };
  }

  return product;
}

/**
 * Sanea y purifica todo el inventario aplicando la regla estricta de Cava
 */
export function sanitizeAllInventory(products = [], zones = []) {
  if (!Array.isArray(products)) return [];
  return products.map(p => sanitizeCavaProduct(p, zones));
}
