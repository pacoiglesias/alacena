import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllPriceRecords, recordPricePoints, analyzeTicketPriceIntelligence, getCanonicalProductName } from '../src/services/priceIntelligenceService.js';

test('price comparisons contain no invented baseline or mixed packs, units and currencies', () => {
  const values = new Map();
  globalThis.window = { localStorage: { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) } };
  assert.deepEqual(getAllPriceRecords(), []);
  recordPricePoints([{ name: 'Alubias 570g', unit: 'piezas', quantity: 2, realPrice: 95, currency: 'MXN' }], 'La Comer');
  assert.equal(getAllPriceRecords()[0].unitPrice, 95);
  assert.equal(getAllPriceRecords()[0].totalPrice, 190);
  const result = analyzeTicketPriceIntelligence([{ name: 'Alubias 570g', unit: 'piezas', quantity: 2, realPrice: 100, currency: 'MXN' }], 'La Comer');
  assert.equal(result.itemsAnalysis[0].unitPrice, 100);
  assert.equal(result.itemsAnalysis[0].trend.status, 'up');
  for (const change of [{ unit: 'kg' }, { currency: 'EUR' }]) {
    assert.equal(analyzeTicketPriceIntelligence([{ name: 'Alubias 570g', unit: 'piezas', quantity: 2, realPrice: 100, currency: 'MXN', ...change }], 'La Comer').itemsAnalysis[0].trend.status, 'first');
  }
  assert.notEqual(getCanonicalProductName('Arroz 1kg'), getCanonicalProductName('Arroz 5kg'));
});
