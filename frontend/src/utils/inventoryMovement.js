import { belongsToHouse } from './householdShopping.js';

export function inventoryMovement(products, { id, amount, direction, householdId }) {
  const product = products.find((p) => p.id === id && belongsToHouse(p, householdId));
  if (!product) throw new Error('No encontramos ese producto en esta casa.');
  const quantity = Number(amount);
  const current = Number(product.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(current) || current < 0)
    throw new Error('Escribe una cantidad válida mayor que cero.');
  if (!['in', 'out'].includes(direction)) throw new Error('Movimiento no válido.');
  if (direction === 'out' && quantity > current)
    throw new Error(`Solo hay ${current} ${product.unit || 'piezas'} de ${product.name}.`);
  const delta = Math.round(quantity * (direction === 'in' ? 1 : -1) * 1000) / 1000;
  if (!delta) throw new Error('La cantidad mínima es 0.001.');
  const updated = { ...product, quantity: Math.round((current + delta) * 1000) / 1000, updatedAt: new Date().toISOString() };
  return { product, updated, delta, products: products.map((p) => p.id === id ? updated : p) };
}
