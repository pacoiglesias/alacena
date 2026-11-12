import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProductExpiryDate,
  migrateProductExpiry,
  migrateProductsExpiry,
  daysUntilExpiry,
  formatExpiryDate,
  EXPIRY_SOON_DAYS,
  isExpiringSoon,
} from '../src/utils/productExpiry.js';

// Fecha `YYYY-MM-DD` en hora local, para construir casos sin depender de UTC.
function localIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function daysFromNow(n, hour = 12) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// E4: la app usa UN SOLO campo de caducidad: `expiryDate`.
// `expirationDate` es un campo muerto que nada escribe; estos tests fijan
// que la migración lo convierte y que los lectores solo conocen `expiryDate`.

test('getProductExpiryDate lee expiryDate y solo expiryDate', () => {
  assert.equal(getProductExpiryDate({ expiryDate: '2026-11-05' }), '2026-11-05');
  // Aunque un documento viejo traiga expirationDate, el lector no lo usa:
  // esos documentos se migran al cargar (ver abajo).
  assert.equal(getProductExpiryDate({ expirationDate: '2026-11-05' }), null);
  assert.equal(getProductExpiryDate({}), null);
  assert.equal(getProductExpiryDate(null), null);
});

test('migrar un documento viejo mueve expirationDate a expiryDate y suelta la llave vieja', () => {
  const migrated = migrateProductExpiry({ id: 'p1', name: 'Leche', expirationDate: '2026-11-05' });
  assert.equal(migrated.expiryDate, '2026-11-05');
  assert.ok(!('expirationDate' in migrated));
  assert.equal(migrated.name, 'Leche');
});

test('si ya trae expiryDate, la fecha buena gana y la llave vieja se suelta', () => {
  const migrated = migrateProductExpiry({ id: 'p1', expiryDate: '2026-11-01', expirationDate: '2026-12-01' });
  assert.equal(migrated.expiryDate, '2026-11-01');
  assert.ok(!('expirationDate' in migrated));
});

test('sin fechas no se toca el documento', () => {
  const doc = { id: 'p1', name: 'Arroz' };
  assert.equal(migrateProductExpiry(doc), doc);
});

test('migrar una lista convierte solo los documentos viejos', () => {
  const migrated = migrateProductsExpiry([
    { id: 'p1', expirationDate: '2026-11-05' },
    { id: 'p2', expiryDate: '2026-11-06' },
    { id: 'p3' },
  ]);
  assert.equal(migrated[0].expiryDate, '2026-11-05');
  assert.ok(!('expirationDate' in migrated[0]));
  assert.equal(migrated[1].expiryDate, '2026-11-06');
  assert.equal(migrated[2].expiryDate, undefined);
  assert.equal(migrateProductsExpiry(null), null);
});

// Días de calendario: hoy = 0, mañana = 1, ayer = -1.
test('daysUntilExpiry cuenta días de calendario, no milisegundos', () => {
  assert.equal(daysUntilExpiry(localIso(daysFromNow(0))), 0);
  assert.equal(daysUntilExpiry(localIso(daysFromNow(1))), 1);
  assert.equal(daysUntilExpiry(localIso(daysFromNow(3))), 3);
  assert.equal(daysUntilExpiry(localIso(daysFromNow(-1))), -1);
  assert.equal(daysUntilExpiry(localIso(daysFromNow(15))), 15);
});

test('daysUntilExpiry es estable durante el día: mismo día, mismo número', () => {
  // Antes, con Math.ceil sobre milisegundos, un producto que vence en
  // 3 días marcaba 2 por la noche y 3 por la mañana.
  const target = localIso(daysFromNow(3));
  assert.equal(daysUntilExpiry(target, daysFromNow(0, 0)), 3);
  assert.equal(daysUntilExpiry(target, daysFromNow(0, 23)), 3);
  assert.equal(daysUntilExpiry(target, daysFromNow(2, 23)), 1);
});

test('daysUntilExpiry acepta fecha-hora ISO y devuelve null si no es válida', () => {
  assert.equal(daysUntilExpiry(new Date(daysFromNow(2)).toISOString()), 2);
  assert.equal(daysUntilExpiry(new Date(daysFromNow(-2))), -2);
  assert.equal(daysUntilExpiry('no-es-una-fecha'), null);
  assert.equal(daysUntilExpiry('2026-13-40'), null);
  assert.equal(daysUntilExpiry(''), null);
  assert.equal(daysUntilExpiry(null), null);
  assert.equal(daysUntilExpiry(undefined), null);
});

test('formatExpiryDate muestra la fecha legible y no inventa nada si es inválida', () => {
  const formatted = formatExpiryDate('2026-11-08');
  assert.match(formatted, /2026/);
  assert.notEqual(formatted, '2026-11-08');
  assert.equal(formatExpiryDate('no-es-una-fecha'), 'no-es-una-fecha');
  assert.equal(formatExpiryDate(null), '');
});

// 3.14.0: «por vencer» es UNA definición (la de Despensa, 15 días)
// compartida por cabecera, Resumen Diario y Despensa.
test('isExpiringSoon: definición única de «por vencer» (15 días, con existencia)', () => {
  assert.equal(EXPIRY_SOON_DAYS, 15);
  const now = daysFromNow(0);
  // Dentro del umbral, con existencia → sí.
  assert.equal(isExpiringSoon({ expiryDate: localIso(daysFromNow(15)), quantity: 2 }, now), true);
  assert.equal(isExpiringSoon({ expiryDate: localIso(daysFromNow(0)), quantity: 1 }, now), true);
  // Ya caducado pero con existencia → también cuenta (hay que tirarlo/consumirlo).
  assert.equal(isExpiringSoon({ expiryDate: localIso(daysFromNow(-2)), quantity: 1 }, now), true);
  // Fuera del umbral → no.
  assert.equal(isExpiringSoon({ expiryDate: localIso(daysFromNow(16)), quantity: 2 }, now), false);
  // Sin existencia no hay nada que vencer → no.
  assert.equal(isExpiringSoon({ expiryDate: localIso(daysFromNow(3)), quantity: 0 }, now), false);
  // Sin fecha válida → no.
  assert.equal(isExpiringSoon({ quantity: 2 }, now), false);
  assert.equal(isExpiringSoon({ expiryDate: 'no-es-una-fecha', quantity: 2 }, now), false);
  assert.equal(isExpiringSoon(null, now), false);
});
