import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRE_CLOUD_BACKUP_KEY,
  shouldIgnoreSnapshot,
  isUsablePreCloudBackup,
  ensurePreCloudBackup,
  consumePreCloudBackup,
  needsFirstConnectChoice,
} from '../src/utils/cloudSyncGuard.js';

// Almacenamiento falso en memoria (misma interfaz que el adaptador de App.jsx).
function memoryStorage(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    get: (key) => (store.has(key) ? store.get(key) : null),
    set: (key, value) => { store.set(key, value); },
    remove: (key) => { store.delete(key); },
  };
}

// E1: un snapshot vacío DEL SERVIDOR nunca puede vaciar datos locales.

test('snapshot vacío del servidor con datos locales se ignora', () => {
  assert.equal(shouldIgnoreSnapshot({ rowCount: 0, fromCache: false, localCount: 3 }), true);
});

test('snapshot vacío del servidor sin datos locales se aplica (no hay nada que perder)', () => {
  assert.equal(shouldIgnoreSnapshot({ rowCount: 0, fromCache: false, localCount: 0 }), false);
});

test('snapshot vacío desde caché se ignora aunque no haya datos locales (comportamiento previo)', () => {
  assert.equal(shouldIgnoreSnapshot({ rowCount: 0, fromCache: true, localCount: 0 }), true);
  assert.equal(shouldIgnoreSnapshot({ rowCount: 0, fromCache: true, localCount: 2 }), true);
});

test('snapshot con filas nunca se ignora', () => {
  assert.equal(shouldIgnoreSnapshot({ rowCount: 5, fromCache: false, localCount: 3 }), false);
  assert.equal(shouldIgnoreSnapshot({ rowCount: 1, fromCache: true, localCount: 0 }), false);
});

// La copia previa a la nube: se guarda una sola vez, no en cada reconexión.

test('la copia previa se guarda cuando no hay ninguna y se conserva en reconexiones', () => {
  const storage = memoryStorage();
  const first = ensurePreCloudBackup(storage, { products: [{ id: 'p1' }], shoppingList: [] });
  assert.equal(first.written, true);
  assert.deepEqual(storage.get(PRE_CLOUD_BACKUP_KEY).products, [{ id: 'p1' }]);

  // Segunda conexión con datos distintos: la primera copia NO se sobrescribe.
  const second = ensurePreCloudBackup(storage, { products: [{ id: 'p9' }], shoppingList: [] });
  assert.equal(second.kept, true);
  assert.equal(second.written, false);
  assert.deepEqual(storage.get(PRE_CLOUD_BACKUP_KEY).products, [{ id: 'p1' }]);
});

test('una copia guardada rota o vacía no cuenta como usable y se reemplaza', () => {
  const storage = memoryStorage({ [PRE_CLOUD_BACKUP_KEY]: {} });
  assert.equal(isUsablePreCloudBackup(storage.get(PRE_CLOUD_BACKUP_KEY)), false);
  const result = ensurePreCloudBackup(storage, { products: [{ id: 'p1' }], shoppingList: [] });
  assert.equal(result.written, true);
});

test('restaurar devuelve la copia y la consume para que la próxima conexión guarde una fresca', () => {
  const storage = memoryStorage({
    [PRE_CLOUD_BACKUP_KEY]: { products: [{ id: 'p1' }], shoppingList: [{ id: 's1' }], savedAt: '2026-10-30' },
  });
  const backup = consumePreCloudBackup(storage);
  assert.deepEqual(backup.products, [{ id: 'p1' }]);
  assert.equal(storage.get(PRE_CLOUD_BACKUP_KEY), null);
  assert.equal(consumePreCloudBackup(storage), null);
});

// Primera conexión: preguntar siempre que haya datos locales y no haya decisión.

test('hay que preguntar si hay datos locales y no hay decisión guardada', () => {
  assert.equal(needsFirstConnectChoice({ localCount: 2, decided: false }), true);
  assert.equal(needsFirstConnectChoice({ localCount: 0, decided: false }), false);
  assert.equal(needsFirstConnectChoice({ localCount: 2, decided: true }), false);
});
