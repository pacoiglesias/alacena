import test from 'node:test';
import assert from 'node:assert/strict';
import { belongsToHouse, sameStockItem, positiveQuantity, purchaseSummary, stepForUnit, roundQty3, inferShoppingUnit, pushRemovedItem, mergeHouseholdRows } from '../src/utils/householdShopping.js';
import { deduplicateInventoryProducts, deduplicateShoppingItems } from '../src/utils/deduplication.js';
import { readLocalState, writeLocalState } from '../src/services/localState.js';

test('legacy items belong only to the original house', () => {
  assert.equal(belongsToHouse({}, 'house-1'), true);
  assert.equal(belongsToHouse({}, 'house-spain'), false);
  assert.equal(belongsToHouse({ householdId: 'house-spain' }, 'house-spain'), true);
});

for (const deduplicate of [deduplicateShoppingItems, deduplicateInventoryProducts]) {
  test(`${deduplicate.name}: preserve separate houses and units`, () => {
    const rows = [
      { id: '1', name: 'Limón', quantity: 2, unit: 'kg', householdId: 'house-1' },
      { id: '2', name: 'limon', quantity: 3, unit: 'kg', householdId: 'house-spain' },
      { id: '3', name: 'Limón', quantity: 4, unit: 'piezas', householdId: 'house-1' },
      { id: '4', name: 'limon', quantity: 0.5, unit: 'kg', householdId: 'house-1' },
    ];
    const result = deduplicate(rows);
    assert.equal(result.length, 3);
    assert.equal(result.find((r) => r.id === '1').quantity, 2.5);
    assert.equal(result.find((r) => r.id === '2').quantity, 3);
    assert.equal(result.find((r) => r.id === '3').quantity, 4);
    assert.equal(rows[0].quantity, 2);
  });
}

test('same barcode cannot combine different homes or incompatible units', () => {
  const a = { name: 'Leche', barcode: '123', householdId: 'a', unit: 'l' };
  assert.equal(sameStockItem(a, { ...a, householdId: 'b' }), false);
  assert.equal(sameStockItem(a, { ...a, unit: 'piezas' }), false);
  assert.equal(sameStockItem(a, { ...a, name: 'LECHE' }), true);
});

test('purchase totals preserve buyer, notes and a zero actual total', () => {
  const result = purchaseSummary({ checkedItems: [{ quantity: 2, estimatedPriceMxn: 25 }], buyerName: ' Ana ', ticketNotes: ' Folio 24 ', realTotalMxn: 0 });
  assert.equal(result.buyer, 'Ana');
  assert.equal(result.notes, 'Folio 24');
  assert.equal(result.estimated, 50);
  assert.equal(result.total, 0);
});

test('decimal purchases calculate the total before updating React state', () => {
  const result = purchaseSummary([{ quantity: 0.75, estimatedPriceMxn: 100 }, { quantity: 2, realPrice: 0, estimatedPriceMxn: 90 }]);
  assert.equal(result.total, 75);
  assert.equal(result.items.length, 2);
  assert.equal(purchaseSummary({ checkedItems: [], realTotalMxn: -100 }).total, 0);
});

test('invalid quantities never become negative or infinite', () => {
  for (const value of [-1, 0, NaN, Infinity, 'oops']) assert.equal(positiveQuantity(value), 1);
  assert.equal(positiveQuantity('0.25'), 0.25);
  assert.equal(positiveQuantity(1.2356), 1.236);
});

test('corrupt storage and wrong types fall back without crashing', () => {
  globalThis.localStorage = { getItem: () => '{broken' };
  assert.deepEqual(readLocalState('list', []), []);
  globalThis.localStorage = { getItem: () => '{}' };
  assert.deepEqual(readLocalState('list', []), []);
  globalThis.localStorage = { getItem: () => '[{"name":"Leche"}]' };
  assert.equal(readLocalState('list', [])[0].name, 'Leche');
});

test('full device storage reports the failure', () => {
  const events = [];
  globalThis.localStorage = { setItem: () => { throw new Error('quota'); } };
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  assert.equal(writeLocalState('list', []), false);
  assert.deepEqual(events, ['alacena-storage-error']);
});

// Q1/Q3: paso por unidad y redondeo a 3 decimales para pesados.
test('steppers use 0.1 for weighed units and 1 for the rest, rounded to 3 decimals', () => {
  assert.equal(stepForUnit('kg'), 0.1);
  assert.equal(stepForUnit('l'), 0.1);
  assert.equal(stepForUnit('litros'), 0.1);
  assert.equal(stepForUnit('piezas'), 1);
  assert.equal(stepForUnit('botellas'), 1);
  assert.equal(stepForUnit('g'), 1);
  assert.equal(roundQty3(1.255 + 0.1), 1.355);
  assert.equal(roundQty3(1.26 - 0.1), 1.16);
});

// Q2: el alta rápida sugiere la unidad por el nombre en vez de fijar piezas.
test('quick add infers litres or kilos from the name', () => {
  assert.equal(inferShoppingUnit('Leche entera'), 'l');
  assert.equal(inferShoppingUnit('Carne de res'), 'kg');
  assert.equal(inferShoppingUnit('Limón'), 'kg');
  assert.equal(inferShoppingUnit('Jabón líquido'), 'piezas');
  assert.equal(inferShoppingUnit(''), 'piezas');
});

// Q7: la pila de deshacer recuerda los últimos 3 borrados.
test('undo stack keeps the last 3 removed items without duplicates', () => {
  const a = { id: 'a' }, b = { id: 'b' }, c = { id: 'c' }, d = { id: 'd' };
  let stack = pushRemovedItem([], a);
  stack = pushRemovedItem(stack, b);
  stack = pushRemovedItem(stack, c);
  stack = pushRemovedItem(stack, d);
  assert.deepEqual(stack.map((i) => i.id), ['d', 'c', 'b']);
  assert.deepEqual(pushRemovedItem(stack, b).map((i) => i.id), ['b', 'd', 'c']);
});

// E5: un snapshot filtrado por casa solo reemplaza las filas de esa casa.
test('household snapshot merge keeps the other house rows and drops removed ones', () => {
  const prev = [
    { id: 'mx1', name: 'Café', quantity: 1, householdId: 'house-1' },
    { id: 'mx2', name: 'Arroz', quantity: 2, householdId: 'house-1' },
    { id: 'es1', name: 'Café', quantity: 5, householdId: 'house-spain' },
    { id: 'old', name: 'Sal', quantity: 1 },
  ];
  const incoming = [{ id: 'mx1', name: 'Café', quantity: 0.5, householdId: 'house-1' }];
  const merged = mergeHouseholdRows(prev, incoming, 'house-1');
  assert.equal(merged.find((r) => r.id === 'mx1').quantity, 0.5);
  assert.equal(merged.find((r) => r.id === 'mx2'), undefined);
  assert.equal(merged.find((r) => r.id === 'es1').quantity, 5);
  assert.equal(merged.find((r) => r.id === 'old'), undefined);
  const mergedEs = mergeHouseholdRows(prev, [], 'house-spain');
  assert.equal(mergedEs.find((r) => r.id === 'es1'), undefined);
  assert.equal(mergedEs.find((r) => r.id === 'mx1').quantity, 1);
  assert.equal(mergedEs.find((r) => r.id === 'old').quantity, 1);
});
