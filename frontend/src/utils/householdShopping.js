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
