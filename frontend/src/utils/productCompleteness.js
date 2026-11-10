// Ficha mínima de un producto (ronda 3.11.0): para que el inventario sea
// fiable, cada producto debería tener código (QR propio o EAN), fecha de
// caducidad, zona y un stock mínimo mayor que cero. La app NO bloquea
// guardar productos incompletos: solo los señala en Inventario para que
// se completen cuando se pueda.

export const PRODUCT_REQUIRED_FIELDS = [
  { key: 'barcode', label: 'código' },
  { key: 'expiryDate', label: 'caducidad' },
  { key: 'zone', label: 'zona' },
  { key: 'minStock', label: 'stock mínimo' },
];

export function missingProductFields(product) {
  if (!product || typeof product !== 'object') return PRODUCT_REQUIRED_FIELDS.map((f) => f.label);
  const missing = [];
  if (!String(product.barcode || '').trim()) missing.push('código');
  if (!String(product.expiryDate || '').trim()) missing.push('caducidad');
  if (!String(product.zone || '').trim()) missing.push('zona');
  if (!(Number(product.minStock) > 0)) missing.push('stock mínimo');
  return missing;
}

export function isProductIncomplete(product) {
  return missingProductFields(product).length > 0;
}
