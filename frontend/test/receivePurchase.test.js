import test from 'node:test';
import assert from 'node:assert/strict';
import { applyReceivedQuantities } from '../src/utils/householdShopping.js';
import { reconcileReceiptList } from '../src/utils/receiptReview.js';

const items = [
  { id: 'a', name: 'Leche', unit: 'litros', quantity: 3, householdId: 'house-1' },
  { id: 'b', name: 'Huevo', unit: 'piezas', quantity: 12, householdId: 'house-1' },
  { id: 'c', name: 'Café', unit: 'kg', quantity: 1, householdId: 'house-1' },
];

test('recibir compra: corrige la cantidad real por línea a 3 decimales', () => {
  const { received, notPurchased } = applyReceivedQuantities(items, { a: 2.5 });
  assert.equal(received.find((i) => i.id === 'a').quantity, 2.5);
  assert.equal(received.find((i) => i.id === 'b').quantity, 12);
  assert.equal(notPurchased.length, 0);
});

test('recibir compra: cantidad 0 = no comprado, no entra a despensa', () => {
  const { received, notPurchased } = applyReceivedQuantities(items, { c: 0 });
  assert.deepEqual(received.map((i) => i.id), ['a', 'b']);
  assert.deepEqual(notPurchased.map((i) => i.id), ['c']);
});

test('compra parcial: el resto no comprado se queda pendiente en la lista', () => {
  const list = items.map((i) => ({ ...i, checked: true }));
  const { received } = applyReceivedQuantities(items, { a: 2 });
  const match = reconcileReceiptList(list, received, 'house-1');
  const leche = match.remaining.find((i) => i.id === 'a');
  assert.equal(leche.quantity, 1);
  assert.equal(leche.checked, false);
  // Lo comprado entero (huevo, y el café sin corrección) sale de la lista.
  assert.ok(match.removedIds.includes('b'));
  assert.ok(match.removedIds.includes('c'));
  assert.deepEqual(match.remaining.map((i) => i.id), ['a']);
});
