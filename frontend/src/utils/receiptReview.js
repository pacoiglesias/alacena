import { sameStockItem, belongsToHouse } from './householdShopping.js';

export function parseReceiptTotal(text = '') {
  const matches = [...text.matchAll(/^\s*(?:total(?:\s+a\s+pagar)?|importe\s+total)\s*(?:\([^)]*\))?\s*[:$€]?\s*([\d.,]+)\s*(?:MXN|EUR|€|\$)?\s*$/gim)];
  if (!matches.length) return null;
  let value = matches.at(-1)[1];
  const decimal = Math.max(value.lastIndexOf('.'), value.lastIndexOf(','));
  if (decimal >= 0 && value.length - decimal === 3) value = value.slice(0, decimal).replace(/[.,]/g, '') + '.' + value.slice(decimal + 1);
  else value = value.replace(/[.,]/g, '');
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function receiptFingerprint(text, store, items) {
  const value = JSON.stringify([store?.trim().toLowerCase(), text?.replace(/\s+/g, ' ').trim().toLowerCase(), items.map((i) => [i.name.trim().toLowerCase(), Number(i.quantity), i.unit, Number(i.realPrice ?? i.estimatedPriceMxn)])]);
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return 'receipt-' + (hash >>> 0).toString(16);
}

export function reconcileReceiptList(list, purchased, householdId) {
  let remaining = list.map((i) => ({ ...i }));
  const removedIds = [], updated = [];
  for (const item of purchased) {
    const match = remaining.find((i) => belongsToHouse(i, householdId) && sameStockItem(i, { ...item, householdId }));
    if (!match) continue;
    const quantity = Math.round((Number(match.quantity) - Number(item.quantity)) * 1000) / 1000;
    if (quantity <= 0) { remaining = remaining.filter((i) => i.id !== match.id); removedIds.push(match.id); }
    else { match.quantity = quantity; match.checked = false; updated.push({ ...match }); }
  }
  return { remaining, removedIds, updated };
}
