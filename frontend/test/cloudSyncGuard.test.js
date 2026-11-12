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

// 3.12.0: la casa activa se deriva de los claims de la cuenta.
import { pickClaimsHouse, LOCAL_ONLY_CHOICE_KEY } from '../src/utils/cloudSyncGuard.js';

const knownHouses = [
  { id: 'house-1', name: 'Casa México', isPrimary: true },
  { id: 'house-spain', name: 'Casa España', isPrimary: false },
  { id: 'house-2', name: 'Casa Valle', isPrimary: false },
];

test('sin claims de casas no se toca la casa activa', () => {
  assert.equal(pickClaimsHouse(null, knownHouses, 'house-2'), null);
  assert.equal(pickClaimsHouse([], knownHouses, 'house-2'), null);
  assert.equal(pickClaimsHouse(undefined, knownHouses, 'house-2'), null);
});

test('si la casa activa ya está autorizada, no se cambia', () => {
  assert.equal(pickClaimsHouse(['house-1', 'house-2'], knownHouses, 'house-2'), null);
});

test('casa activa fuera de los claims: se conecta la principal autorizada', () => {
  const target = pickClaimsHouse(['house-1', 'house-spain'], knownHouses, 'casa-ajena');
  assert.equal(target.id, 'house-1');
  assert.equal(target.isPrimary, true);
});

test('sin principal conocida entre las autorizadas, va la primera conocida', () => {
  const target = pickClaimsHouse(['house-2', 'house-spain'], knownHouses, 'casa-ajena');
  assert.equal(target.id, 'house-spain'); // orden de la lista conocida, no de los claims
});

test('ninguna casa conocida: se devuelve la primera autorizada por id', () => {
  assert.deepEqual(pickClaimsHouse(['house-x'], knownHouses, 'casa-ajena'), { id: 'house-x' });
});

test('la clave de elección local existe y es estable', () => {
  assert.equal(LOCAL_ONLY_CHOICE_KEY, 'alacena_local_only_choice');
});
