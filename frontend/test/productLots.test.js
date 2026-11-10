import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLots, consumeFromLots, addToLots, totalLotsQuantity, applyMovementToLots } from '../src/utils/productLots.js';
import { inventoryMovement } from '../src/utils/inventoryMovement.js';

const lots = [
  { expiryDate: '2026-12-20', quantity: 2 },
  { expiryDate: '2026-11-15', quantity: 1.5 },
  { expiryDate: '2026-11-15', quantity: 0 },
  { expiryDate: '', quantity: 3 },
];

test('normalizeLots ordena por caducidad y descarta lotes vacíos o sin fecha', () => {
  const normalized = normalizeLots({ lots });
  assert.deepEqual(normalized, [
    { expiryDate: '2026-11-15', quantity: 1.5 },
    { expiryDate: '2026-12-20', quantity: 2 },
  ]);
  assert.equal(totalLotsQuantity(normalized), 3.5);
});

test('consumeFromLots descuenta primero del lote que antes vence (FEFO)', () => {
  const { lots: remaining, consumed, unassigned } = consumeFromLots(lots, 2);
  assert.deepEqual(consumed, [
    { expiryDate: '2026-11-15', quantity: 1.5 },
    { expiryDate: '2026-12-20', quantity: 0.5 },
  ]);
  assert.deepEqual(remaining, [{ expiryDate: '2026-12-20', quantity: 1.5 }]);
  assert.equal(unassigned, 0);
});

test('addToLots suma a la misma fecha o crea lote nuevo ordenado', () => {
  const grown = addToLots(lots, 0.5, '2026-11-15');
  assert.equal(grown[0].quantity, 2);
  const created = addToLots(lots, 1, '2026-11-01');
  assert.equal(created[0].expiryDate, '2026-11-01');
  assert.deepEqual(addToLots(lots, 1, null), normalizeLots({ lots }));
});

test('un producto sin lotes no se lotea: applyMovementToLots devuelve null', () => {
  assert.equal(applyMovementToLots({ quantity: 3 }, -1), null);
  assert.equal(applyMovementToLots({ lots: [], quantity: 3 }, -1), null);
});

test('inventoryMovement con lotes: consumir actualiza lotes y la fecha visible', () => {
  const products = [{
    id: 'milk', name: 'Leche', unit: 'litros', quantity: 3.5, householdId: 'house-1',
    expiryDate: '2026-11-15',
    lots: [
      { expiryDate: '2026-11-15', quantity: 1.5 },
      { expiryDate: '2026-12-20', quantity: 2 },
    ],
  }];
  const result = inventoryMovement(products, { id: 'milk', amount: 1.5, direction: 'out', householdId: 'house-1' });
  assert.equal(result.updated.quantity, 2);
  assert.deepEqual(result.updated.lots, [{ expiryDate: '2026-12-20', quantity: 2 }]);
  assert.equal(result.updated.expiryDate, '2026-12-20');
  // El original no se muta
  assert.equal(products[0].lots.length, 2);
});

test('inventoryMovement con lotes: reponer suma al lote de la fecha visible', () => {
  const products = [{
    id: 'milk', name: 'Leche', unit: 'litros', quantity: 2, householdId: 'house-1',
    expiryDate: '2026-12-20',
    lots: [{ expiryDate: '2026-12-20', quantity: 2 }],
  }];
  const result = inventoryMovement(products, { id: 'milk', amount: 0.5, direction: 'in', householdId: 'house-1' });
  assert.equal(result.updated.quantity, 2.5);
  assert.deepEqual(result.updated.lots, [{ expiryDate: '2026-12-20', quantity: 2.5 }]);
  assert.equal(result.updated.expiryDate, '2026-12-20');
});
