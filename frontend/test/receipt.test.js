import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRawShoppingText } from '../src/services/smartListParser.js';
import { parseReceiptTotal, receiptFingerprint, reconcileReceiptList } from '../src/utils/receiptReview.js';
import { pdfTextLines } from '../src/utils/pdfTextLines.js';

test('receipt column totals become unit prices exactly once', () => {
  const rows = parseRawShoppingText('LA COMER\n2 869 ALUBIAS CIDACOS 570 95.00 190.00\n0.645 029 PORO 49.90 32.19\nTOTAL $ 222.19');
  const beans = rows.find((i) => /alubias/i.test(i.name));
  const leek = rows.find((i) => /poro/i.test(i.name));
  assert.equal(beans.quantity, 2);
  assert.equal(beans.realPrice, 95);
  assert.equal(beans.lineTotalMxn, 190);
  assert.equal(leek.quantity, 0.645);
  assert.equal(leek.realPrice, 49.90);
  assert.equal(Math.round(leek.realPrice * leek.quantity * 100) / 100, 32.19);
});
test('unpriced shopping text never receives an invented price', () => {
  const rows = parseRawShoppingText('2 arroz\n1 leche');
  assert.ok(rows.length > 0);
  assert.ok(rows.every((i) => i.estimatedPriceMxn === 0));
});
test('grand totals support Mexican and Spanish separators, ignore subtotal', () => {
  assert.equal(parseReceiptTotal('SUBTOTAL 100.00\nTOTAL $ 1,234.50'), 1234.5);
  assert.equal(parseReceiptTotal('SUBTOTAL 100,00\nTOTAL (€) 1.234,50'), 1234.5);
  assert.equal(parseReceiptTotal('SUBTOTAL 100.00'), null);
});
test('receipt matching keeps partial quantities and other houses', () => {
  const list = [{ id: 'a', name: 'Arroz', unit: 'kg', quantity: 3, householdId: 'house-1' }, { id: 'b', name: 'Arroz', unit: 'kg', quantity: 4, householdId: 'house-spain' }];
  const result = reconcileReceiptList(list, [{ name: 'Arroz', unit: 'kg', quantity: 1.25 }], 'house-1');
  assert.equal(result.remaining[0].quantity, 1.75);
  assert.equal(result.remaining[1].quantity, 4);
  assert.equal(list[0].quantity, 3);
});
test('identical tickets have the same fingerprint, distinct folios differ', () => {
  const rows = [{ name: 'Leche', unit: 'piezas', quantity: 2, realPrice: 30 }];
  assert.equal(receiptFingerprint('Folio 1', 'La Comer', rows), receiptFingerprint('Folio 1', 'La Comer', rows));
  assert.notEqual(receiptFingerprint('Folio 1', 'La Comer', rows), receiptFingerprint('Folio 2', 'La Comer', rows));
});
test('PDF cells are reconstructed as ordered rows instead of separate products', () => {
  assert.equal(pdfTextLines([{ str: '190.00', transform: [1, 0, 0, 1, 200, 500] }, { str: 'ALUBIAS', transform: [1, 0, 0, 1, 30, 500] }, { str: 'TOTAL 190.00', transform: [1, 0, 0, 1, 20, 450] }]), 'ALUBIAS  190.00\nTOTAL 190.00');
});
