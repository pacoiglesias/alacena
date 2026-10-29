import test from 'node:test';
import assert from 'node:assert/strict';
import { createScannerDiag, sanitizeDiagDetails, SCANNER_DIAG_MAX_EVENTS } from '../src/utils/scannerDiag.js';
import { APP_VERSION } from '../src/version.js';

// localStorage falso para node (el módulo lo usa si existe).
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
};

test('el registro guarda eventos técnicos con versión y fecha', () => {
  const diag = createScannerDiag('test:diag-1');
  diag.log('gum_ok', { tracks: [{ kind: 'video', readyState: 'live' }] });
  const events = diag.getEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].ev, 'gum_ok');
  assert.equal(events[0].v, APP_VERSION);
  assert.match(events[0].t, /^\d{4}-\d{2}-\d{2}T/);
});

test('el registro se acota a los últimos 200 eventos', () => {
  assert.equal(SCANNER_DIAG_MAX_EVENTS, 200);
  const diag = createScannerDiag('test:diag-2');
  for (let i = 0; i < 250; i++) diag.log('tick', { n: i });
  const events = diag.getEvents();
  assert.equal(events.length, 200);
  assert.equal(events[0].d.n, 50);
  assert.equal(events[199].d.n, 249);
});

test('nunca se guardan códigos, nombres ni contenido del hogar', () => {
  const clean = sanitizeDiagDetails({
    code: '7501234567890',
    barcode: '7501234567890',
    name: 'Leche entera',
    product: { name: 'Leche' },
    items: ['a', 'b'],
    text: 'secreto',
    engine: 'zxing',
    width: 1920,
  });
  assert.equal(clean.code, undefined);
  assert.equal(clean.barcode, undefined);
  assert.equal(clean.name, undefined);
  assert.equal(clean.product, undefined);
  assert.equal(clean.items, undefined);
  assert.equal(clean.text, undefined);
  assert.equal(clean.engine, 'zxing');
  assert.equal(clean.width, 1920);
});

test('los textos largos se recortan', () => {
  const clean = sanitizeDiagDetails({ message: 'x'.repeat(500) });
  assert.equal(clean.message.length, 200);
});

test('limpiar vacía el registro y el texto incluye versión y eventos', () => {
  const diag = createScannerDiag('test:diag-3');
  diag.log('permission', { state: 'granted' });
  assert.ok(diag.toText().includes(APP_VERSION));
  assert.match(diag.toText(), /permission/);
  diag.clear();
  assert.equal(diag.getEvents().length, 0);
});
