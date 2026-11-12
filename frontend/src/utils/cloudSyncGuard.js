// Guardia de primera conexión a la nube (E1, crítico).
// Regla: un snapshot vacío DEL SERVIDOR nunca puede vaciar datos locales.
// Solo lógica pura y testeable: sin Firebase, sin window, sin localStorage.
// El cableado con la app vive en App.jsx; el almacenamiento se inyecta
// como adaptador { get, set, remove } para poder probarlo sin DOM.

export const PRE_CLOUD_BACKUP_KEY = 'alacena_before_cloud_connection';
export const FIRST_CONNECT_DECISION_KEY = 'alacena_cloud_first_connect_decided';

// ¿Debe ignorarse este snapshot de la nube?
// - Con filas: nunca se ignora.
// - Vacío y desde caché: se ignora (comportamiento previo: la caché
//   vacía no significa que la nube esté vacía).
// - Vacío y del servidor con datos locales: se ignora (es el vaciado
//   que esta guardia impide).
// - Vacío y del servidor sin datos locales: se aplica (no hay nada que perder).
export function shouldIgnoreSnapshot({ rowCount, fromCache, localCount }) {
  if (rowCount > 0) return false;
  if (fromCache) return true;
  return localCount > 0;
}

export function isUsablePreCloudBackup(backup) {
  return !!backup && typeof backup === 'object' &&
    (Array.isArray(backup.products) || Array.isArray(backup.shoppingList));
}

// Guarda la copia previa a la nube SOLO si aún no hay una usable.
// Antes se sobrescribía en cada reconexión y la red de seguridad era
// de un solo uso; ahora la primera copia sobrevive hasta restaurarse.
export function ensurePreCloudBackup(storage, { products, shoppingList }) {
  const existing = storage.get(PRE_CLOUD_BACKUP_KEY);
  if (isUsablePreCloudBackup(existing)) return { written: false, kept: true };
  storage.set(PRE_CLOUD_BACKUP_KEY, {
    products,
    shoppingList,
    savedAt: new Date().toISOString(),
  });
  return { written: true, kept: false };
}

// Devuelve la copia previa a la nube y la consume: al restaurarla se
// borra, para que la próxima conexión pueda guardar una copia fresca.
export function consumePreCloudBackup(storage) {
  const backup = storage.get(PRE_CLOUD_BACKUP_KEY);
  if (!isUsablePreCloudBackup(backup)) return null;
  storage.remove(PRE_CLOUD_BACKUP_KEY);
  return backup;
}

// ¿Hay que preguntar al usuario antes de sincronizar por primera vez?
// Solo cuando hay datos locales y aún no hay una decisión guardada.
// Sin datos locales no hay nada que perder: se descarga sin preguntar.
// La decisión ('upload' | 'download') se guarda una sola vez por dispositivo.
export function needsFirstConnectChoice({ localCount, decided }) {
  return !decided && localCount > 0;
}

// Elección explícita de «usar solo en este dispositivo» (3.12.0): sin
// esta decisión guardada, una app sin sesión muestra la puerta de
// conexión a la casa en vez de arrancar en modo local silencioso.
export const LOCAL_ONLY_CHOICE_KEY = 'alacena_local_only_choice';

// Conexión derivada de la CUENTA (3.12.0): con sesión, la casa activa
// se re-deriva de las casas autorizadas en los claims del token
// (`households`), no del aparato. Si la casa activa ya está entre las
// autorizadas, no hay nada que cambiar (null). Si no, se elige la casa
// principal conocida entre las autorizadas; en su defecto, la primera
// conocida; y si ninguna es conocida, la primera autorizada tal cual.
export function pickClaimsHouse(claimHouseIds, knownHouses, activeHouseId) {
  if (!Array.isArray(claimHouseIds) || !claimHouseIds.length) return null;
  if (claimHouseIds.includes(activeHouseId)) return null;
  const known = Array.isArray(knownHouses) ? knownHouses.filter((h) => h && claimHouseIds.includes(h.id)) : [];
  return known.find((h) => h.isPrimary) || known[0] || { id: claimHouseIds[0] };
}
