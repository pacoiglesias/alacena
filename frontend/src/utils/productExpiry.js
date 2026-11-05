// Utilidad de caducidad: la app usa UN SOLO campo, `expiryDate`.
// Los documentos viejos que traen `expirationDate` se migran al cargar
// (nada escribe `expirationDate` en toda la app; los lectores solo
// conocen `expiryDate`).

export function getProductExpiryDate(product) {
  if (!product || typeof product !== 'object') return null;
  return product.expiryDate ?? null;
}

export function migrateProductExpiry(product) {
  if (!product || typeof product !== 'object') return product;
  if (!('expirationDate' in product)) return product;
  const { expirationDate, ...rest } = product;
  if (rest.expiryDate !== undefined && rest.expiryDate !== null) {
    // Ya trae fecha buena: se suelta la llave vieja sin tocarla.
    return rest;
  }
  return { ...rest, expiryDate: expirationDate ?? null };
}

export function migrateProductsExpiry(list) {
  if (!Array.isArray(list)) return list;
  return list.map(migrateProductExpiry);
}
