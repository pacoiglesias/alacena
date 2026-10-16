import test from 'node:test';
import assert from 'node:assert/strict';
import { inventoryMovement } from '../src/utils/inventoryMovement.js';
const products = [{ id: 'milk', name: 'Leche', unit: 'litros', quantity: 2.5, householdId: 'house-1' }];

test('receiving adds numbers rather than concatenating strings', () => {
  const result = inventoryMovement(products, { id: 'milk', amount: '1.25', direction: 'in', householdId: 'house-1' });
  assert.equal(result.updated.quantity, 3.75);
  assert.equal(products[0].quantity, 2.5);
});
test('consuming handles decimals and can reach zero exactly', () => {
  const first = inventoryMovement(products, { id: 'milk', amount: 0.5, direction: 'out', householdId: 'house-1' });
  assert.equal(first.updated.quantity, 2);
  const second = inventoryMovement(first.products, { id: 'milk', amount: 2, direction: 'out', householdId: 'house-1' });
  assert.equal(second.updated.quantity, 0);
});
test('overconsumption, invalid quantities and another house never change inventory', () => {
  for (const amount of [3, -1, 0, Infinity, 'bad']) {
    assert.throws(() => inventoryMovement(products, { id: 'milk', amount, direction: 'out', householdId: 'house-1' }));
  }
  assert.throws(() => inventoryMovement(products, { id: 'milk', amount: 1, direction: 'in', householdId: 'house-spain' }));
  assert.equal(products[0].quantity, 2.5);
});
