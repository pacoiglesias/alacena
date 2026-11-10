import test from 'node:test';
import assert from 'node:assert/strict';
import { missingProductFields, isProductIncomplete } from '../src/utils/productCompleteness.js';

const complete = { barcode: '7501234567890', expiryDate: '2027-01-01', zone: 'Alacena Principal', minStock: 2 };

test('un producto con código, caducidad, zona y mínimo está completo', () => {
  assert.deepEqual(missingProductFields(complete), []);
  assert.equal(isProductIncomplete(complete), false);
});

test('señala cada campo que falta, sin bloquear', () => {
  assert.deepEqual(missingProductFields({}), ['código', 'caducidad', 'zona', 'stock mínimo']);
  assert.deepEqual(missingProductFields({ ...complete, barcode: '' }), ['código']);
  assert.deepEqual(missingProductFields({ ...complete, barcode: null, expiryDate: null }), ['código', 'caducidad']);
  assert.deepEqual(missingProductFields({ ...complete, zone: '  ' }), ['zona']);
});

test('el stock mínimo debe ser mayor que cero: 0 o ausente es incompleto', () => {
  assert.deepEqual(missingProductFields({ ...complete, minStock: 0 }), ['stock mínimo']);
  const { minStock, ...sinMinimo } = complete;
  assert.deepEqual(missingProductFields(sinMinimo), ['stock mínimo']);
});

test('un código propio ALC- también cuenta como código', () => {
  assert.equal(isProductIncomplete({ ...complete, barcode: 'ALC-MV73WWIR-513' }), false);
});
