import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCodeFromScan, findProductByScanCode, cameraErrorMessage } from '../src/utils/scanHelper.js';

test('QR links decode once and preserve barcode zeroes', () => {
  assert.equal(extractCodeFromScan('https://example.test/?scan=ALC%2D42'), 'ALC-42');
  assert.equal(extractCodeFromScan('https://example.test/?id=abc&qr=0012345678905'), '0012345678905');
  assert.equal(extractCodeFromScan('https://example.test/?scan=ABC%2520DEF'), 'ABC%20DEF');
  assert.equal(extractCodeFromScan('https://example.test/product/0012345678905'), '0012345678905');
});

test('damaged and unrelated JSON do not crash or register garbage', () => {
  assert.equal(extractCodeFromScan('{broken}'), '');
  assert.equal(extractCodeFromScan('{"name":"Milk"}'), '');
  assert.equal(extractCodeFromScan('{"barcode":"0012345678905"}'), '0012345678905');
  assert.equal(extractCodeFromScan('{"id":"prod-42"}'), 'prod-42');
  assert.equal(extractCodeFromScan('x'.repeat(4097)), '');
});

test('all household QR encodings resolve the same product', () => {
  const product = { id: 'prod-42', qrId: 'jar-42', barcode: '012345678905', name: 'Arroz' };
  for (const code of ['prod-42', 'ALC-42', 'jar-42', '012345678905', '0012345678905', '{"id":"prod-42"}', 'https://example.test/?scan=ALC-42']) {
    assert.equal(findProductByScanCode([product], code).product, product, code);
  }
});

test('unknown codes stay unknown instead of matching another product', () => {
  assert.equal(findProductByScanCode([{ id: 'prod-42', name: 'Arroz', barcode: 12345678 }], '87654321').product, null);
  assert.equal(findProductByScanCode([], '7501234567893').cleanCode, '7501234567893');
});

test('camera errors explain a practical recovery action', () => {
  assert.match(cameraErrorMessage({ name: 'NotAllowedError' }), /permiso/i);
  assert.match(cameraErrorMessage({ name: 'NotFoundError' }), /foto/i);
  assert.match(cameraErrorMessage({ name: 'NotReadableError' }), /Otra aplicación/i);
});
