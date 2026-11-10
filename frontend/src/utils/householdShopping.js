import { areItemsEquivalent, normalizeItemName } from './deduplication.js';

// Legacy records without a house belong to the original home, never every home.
export function belongsToHouse(item, houseId = 'house-1') {
  return (item.householdId || 'house-1') === houseId;
}

export function sameStockItem(a, b) {
  return (a.householdId || 'house-1') === (b.householdId || 'house-1') &&
    normalizeItemName(a.unit || 'piezas') === normalizeItemName(b.unit || 'piezas') &&
    (a.barcode && b.barcode ? String(a.barcode) === String(b.barcode) : areItemsEquivalent(a.name, b.name));
}

export function positiveQuantity(value, fallback = 1) {
  const number = Number(value);
  const rounded = Math.round(number * 1000) / 1000;
  return Number.isFinite(number) && rounded > 0 ? rounded : fallback;
}

export function purchaseSummary(payload) {
  const details = Array.isArray(payload) ? { checkedItems: payload } : payload;
  const items = details?.checkedItems || [];
  const estimated = items.reduce((sum, item) => sum + positiveQuantity(item.quantity) *
    Math.max(0, Number(item.realPrice ?? item.estimatedPriceMxn) || 0), 0);
  const actual = details?.realTotalMxn;
  return { items, estimated, total: actual != null && Number.isFinite(Number(actual)) && Number(actual) >= 0 ? Number(actual) : estimated,
    buyer: details?.buyerName?.trim() || 'Administrador General', notes: details?.ticketNotes?.trim() || '' };
}

// Paso del ajuste rápido según la unidad (Q1/Q3): los pesados se afinan
// de 0,1 en 0,1 kg/l; piezas, botellas y el resto, de 1 en 1. Las
// cantidades de pesados llevan 3 decimales en toda la app.
export function stepForUnit(unit) {
  const u = normalizeItemName(unit || 'piezas');
  return ['kg', 'kilos', 'l', 'lt', 'litros'].includes(u) ? 0.1 : 1;
}

export function roundQty3(value) {
  return Math.round(Number(value) * 1000) / 1000;
}

// Cantidades REALES compradas al recibir la compra (3.11.0): el modal de
// confirmación permite corregir por línea cuánto se compró de verdad.
// `receivedById` mapea id de la línea -> cantidad comprada (número).
// Una cantidad 0 (o inválida) significa «no comprado»: la línea NO entra
// a la despensa y se devuelve aparte para que siga pendiente en la lista.
// Las líneas sin corrección conservan la cantidad de la lista.
export function applyReceivedQuantities(items, receivedById = {}) {
  const received = [];
  const notPurchased = [];
  for (const item of items || []) {
    const hasCorrection = Object.prototype.hasOwnProperty.call(receivedById, item.id);
    const raw = hasCorrection ? Number(receivedById[item.id]) : Number(item.quantity);
    const quantity = Math.round(raw * 1000) / 1000;
    if (Number.isFinite(quantity) && quantity > 0) received.push({ ...item, quantity });
    else notPurchased.push(item);
  }
  return { received, notPurchased };
}

// Unidad que sugiere el alta rápida del súper por el nombre (Q2): el alta
// ya no fija siempre 'piezas' cuando se escribe leche, carne o verdura.
// Solo una sugerencia editable: la tarjeta permite corregir la cantidad
// y la unidad se puede cambiar al editar el artículo.
const UNIT_BY_KEYWORD = [
  ['l', ['leche', 'crema', 'yogur', 'yogurt', 'jugo', 'aceite', 'agua', 'refresco', 'vinagre']],
  ['kg', ['carne', 'pollo', 'res', 'cerdo', 'pescado', 'salmon', 'camaron', 'queso', 'jamon', 'arroz', 'frijol', 'azucar', 'harina', 'cafe', 'papa', 'jitomate', 'tomate', 'cebolla', 'limon', 'aguacate', 'manzana', 'platano', 'zanahoria', 'mantequilla']],
];
export function inferShoppingUnit(name) {
  const text = normalizeItemName(name || '');
  for (const [unit, keywords] of UNIT_BY_KEYWORD) {
    if (keywords.some((kw) => text.includes(kw))) return unit;
  }
  return 'piezas';
}

// Pila de deshacer del súper (Q7): recuerda los últimos 3 borrados en
// vez de solo el último; borrar el mismo artículo dos veces no lo duplica.
export function pushRemovedItem(stack, item, max = 3) {
  return [item, ...(stack || []).filter((i) => i.id !== item.id)].slice(0, max);
}

// Fusión por casa de un snapshot de la nube (E5): la suscripción ya viene
// filtrada por householdId, así que el snapshot solo reemplaza las filas
// de esa casa; las filas locales de las demás casas se conservan tal cual.
// Los registros sin casa son de la casa original ('house-1').
export function mergeHouseholdRows(prevRows, incomingRows, householdId) {
  const kept = (prevRows || []).filter((row) => !belongsToHouse(row, householdId));
  const incoming = new Map();
  for (const row of incomingRows || []) incoming.set(row.id, row);
  return [...kept, ...incoming.values()];
}
