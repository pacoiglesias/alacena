import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getProductExpiryDate,
  migrateProductExpiry,
  migrateProductsExpiry,
} from '../src/utils/productExpiry.js';

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
