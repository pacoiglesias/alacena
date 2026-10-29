import test from 'node:test';
import assert from 'node:assert/strict';
import { extractCodeFromScan, findProductByScanCode, cameraErrorMessage, isScannerVideoHealthy, isScannerVideoFlowing, isScannerStreamingVideo, isBlackBudgetExceeded, SCANNER_BLACK_BUDGET_MS } from '../src/utils/scanHelper.js';

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

test('black-video watchdog only trusts video with frames', () => {
  assert.equal(isScannerVideoHealthy({ readyState: 2, videoWidth: 640 }), true);
  assert.equal(isScannerVideoHealthy({ readyState: 3, videoWidth: 1280 }), true);
  assert.equal(isScannerVideoHealthy({ readyState: 4, videoWidth: 1920 }), true);
  assert.equal(isScannerVideoHealthy(null), false);
  assert.equal(isScannerVideoHealthy(undefined), false);
  assert.equal(isScannerVideoHealthy({ readyState: 0, videoWidth: 0 }), false);
  assert.equal(isScannerVideoHealthy({ readyState: 1, videoWidth: 640 }), false);
  assert.equal(isScannerVideoHealthy({ readyState: 2, videoWidth: 0 }), false);
  assert.equal(isScannerVideoHealthy({ readyState: 3, videoWidth: 0 }), false);
});

test('flow watchdog: still clock means black video even with metadata', () => {
  // iOS puede tener readyState y ancho real sin un solo fotograma: el
  // reloj quieto es paro, aunque los metadatos digan lo contrario.
  assert.equal(isScannerVideoFlowing(1.2, { currentTime: 1.2, readyState: 4, videoWidth: 1920 }), false);
  assert.equal(isScannerVideoFlowing(0, { currentTime: 0, readyState: 4, videoWidth: 1920 }), false);
  assert.equal(isScannerVideoFlowing(1.2, { currentTime: 0.9 }), false);
  // Reloj que avanza = fotogramas reales = sano.
  assert.equal(isScannerVideoFlowing(1.2, { currentTime: 1.35 }), true);
  assert.equal(isScannerVideoFlowing(0, { currentTime: 0.04 }), true);
  // Sin muestra anterior no se puede afirmar flujo; sin video, nunca.
  assert.equal(isScannerVideoFlowing(undefined, { currentTime: 1.35 }), false);
  assert.equal(isScannerVideoFlowing(null, { currentTime: 1.35 }), false);
  assert.equal(isScannerVideoFlowing(1.2, null), false);
  assert.equal(isScannerVideoFlowing(1.2, undefined), false);
  assert.equal(isScannerVideoFlowing(1.2, {}), false);
});

test('watchdog only follows videos with a real stream attached', () => {
  // El <video> oculto sin srcObject nunca fluye y no debe mezclarse
  // con el video real en las muestras del vigilante.
  assert.equal(isScannerStreamingVideo({ srcObject: null, videoWidth: 640 }), false);
  assert.equal(isScannerStreamingVideo({ videoWidth: 640 }), false);
  assert.equal(isScannerStreamingVideo({ srcObject: {}, videoWidth: 0, clientWidth: 0 }), false);
  assert.equal(isScannerStreamingVideo({ srcObject: {}, videoWidth: 640 }), true);
  assert.equal(isScannerStreamingVideo({ srcObject: {}, videoWidth: 0, clientWidth: 320 }), true);
  assert.equal(isScannerStreamingVideo(null), false);
});

test('black budget: 12 s of no frames ends silent black even with restarts left', () => {
  assert.equal(SCANNER_BLACK_BUDGET_MS, 12000);
  assert.equal(isBlackBudgetExceeded(1000, 1000 + 11999), false);
  assert.equal(isBlackBudgetExceeded(1000, 1000 + 12000), true);
  assert.equal(isBlackBudgetExceeded(1000, 1000 + 30000), true);
  assert.equal(isBlackBudgetExceeded(null, 50000), false);
});
