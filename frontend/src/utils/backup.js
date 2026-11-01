import { APP_VERSION } from '../version.js';
import { sameStockItem } from './householdShopping.js';
export const BACKUP_KEYS = { products:'alacena_products', shoppingList:'alacena_shopping_list', zones:'alacena_zones', recipes:'alacena_recipes', households:'alacena_households', auditLogs:'alacena_audit_logs', purchaseHistory:'alacena_purchase_history' };
export const SNAPSHOT_FIELDS = Object.keys(BACKUP_KEYS);
const immutable = new Set(['auditLogs','purchaseHistory']);
const clone = (value) => JSON.parse(JSON.stringify(value));
export function createBackup(snapshot) { return { app:'ALACENA_ENTERPRISE_CAVAPRO', schemaVersion:1, version:APP_VERSION, exportDate:new Date().toISOString(), ...clone(snapshot) }; }
function inspect(value, depth = 0) {
  if (depth > 20) throw new Error('El archivo tiene una estructura demasiado profunda.');
  if (typeof value === 'number' && !Number.isFinite(value)) throw new Error('Hay números no válidos.');
  if (typeof value === 'string' && value.length > 2000000) throw new Error('Hay un campo demasiado grande.');
  if (value && typeof value === 'object') for (const key of Object.keys(value)) {
    if (['__proto__','constructor','prototype'].includes(key)) throw new Error('El archivo contiene campos no permitidos.');
    inspect(value[key], depth + 1);
  }
}
export function validateBackup(text) {
  if (typeof text !== 'string' || new Blob([text]).size > 20 * 1024 * 1024) throw new Error('Selecciona un respaldo JSON de hasta 20 MB.');
  let source;
  try { source = JSON.parse(text); } catch { throw new Error('No es un archivo JSON válido.'); }
  inspect(source);
  if (source?.app !== 'ALACENA_ENTERPRISE_CAVAPRO' || !/^3\.\d+\.\d+(?:[-+].*)?$/.test(source.version || '') || (source.schemaVersion != null && source.schemaVersion !== 1)) throw new Error('Este archivo no es un respaldo compatible de ALACENA.');
  const parts = (v) => v.split(/[.+-]/).slice(0,3).map(Number);
  const [a,b,c] = parts(source.version), [x,y,z] = parts(APP_VERSION);
  if (a > x || (a === x && (b > y || (b === y && c > z)))) throw new Error('El respaldo pertenece a una versión más nueva. Actualiza ALACENA antes de restaurarlo.');
  if (!Array.isArray(source.products) || !Array.isArray(source.zones)) throw new Error('Faltan las colecciones de productos o zonas.');
  const snapshot = {};
  for (const key of SNAPSHOT_FIELDS) {
    const rows = source[key] ?? [];
    if (!Array.isArray(rows) || rows.length > 10000) throw new Error(`La colección ${key} no es válida o supera 10 000 registros.`);
    const ids = new Set();
    snapshot[key] = rows.map((raw) => {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error(`Hay un registro inválido en ${key}.`);
      const row = { ...raw, id:String(raw.id ?? '') };
      if (!row.id.trim() || row.id.length > 200 || row.id.includes('/') || ids.has(row.id)) throw new Error(`Hay identificadores inválidos o repetidos en ${key}.`);
      ids.add(row.id);
      if (['products','shoppingList','zones','recipes','households'].includes(key) && (typeof row.name !== 'string' || !row.name.trim() || row.name.length > 300)) throw new Error(`Revisa el nombre de ${row.id}.`);
      if (['products','shoppingList'].includes(key)) {
        if (typeof row.quantity !== 'number' || row.quantity < 0 || row.quantity > 1000000 || (key === 'shoppingList' && row.quantity <= 0) || typeof row.unit !== 'string' || !row.unit.trim()) throw new Error(`Cantidad o unidad inválida: ${row.name}.`);
        row.householdId ||= 'house-1';
        if (key === 'shoppingList') row.checked = Boolean(row.checked);
      }
      if (key === 'recipes' && (!Array.isArray(row.ingredients) || row.ingredients.some((i) => !i.productName || typeof i.amount !== 'number' || i.amount <= 0 || !i.unit))) throw new Error(`Ingredientes inválidos: ${row.name}.`);
      if (key === 'purchaseHistory' && (!Array.isArray(row.items) || row.items.length > 150 || typeof row.totalMxn !== 'number' || row.totalMxn < 0 || !Number.isFinite(Date.parse(row.date)))) throw new Error('El historial de compras contiene un registro inválido.');
      if (key === 'auditLogs' && (typeof row.description !== 'string' || row.description.length > 4000 || !Number.isFinite(Date.parse(row.timestamp)))) throw new Error('La bitácora contiene un movimiento inválido.');
      return row;
    });
  }
  snapshot.activeHouse = source.activeHouse || source.household || snapshot.households[0];
  return snapshot;
}
export function snapshotSignature(snapshot) { return JSON.stringify(SNAPSHOT_FIELDS.map((k) => snapshot[k] || [])); }
export function planRestore(current, incoming, mode = 'combine') {
  if (!['combine','replace'].includes(mode)) throw new Error('Elige combinar o reemplazar.');
  const next = {}, counts = [];
  for (const key of SNAPSHOT_FIELDS) {
    const old = current[key] || [], rows = incoming[key] || [];
    let conflicts = 0;
    if (mode === 'replace' && !immutable.has(key)) next[key] = clone(rows);
    else {
      next[key] = clone(old);
      for (const row of rows) {
        const match = next[key].find((p) => p.id === row.id || (['products','shoppingList'].includes(key) && sameStockItem(p,row)));
        if (match) { if (JSON.stringify(match) !== JSON.stringify(row)) conflicts++; continue; }
        next[key].push(clone(row));
      }
    }
    counts.push({ key, before:old.length, after:next[key].length, imported:rows.length, conflicts, preserved:immutable.has(key) });
  }
  next.purchaseHistory.sort((a,b) => String(b.date).localeCompare(String(a.date)));
  next.auditLogs.sort((a,b) => String(b.timestamp).localeCompare(String(a.timestamp)));
  next.activeHouse = next.households.find((h) => h.id === current.activeHouse?.id) || next.households.find((h) => h.id === incoming.activeHouse?.id) || next.households[0] || current.activeHouse;
  return { mode, next, counts, baseSignature:snapshotSignature(current) };
}
export function downloadBackup(snapshot, prefix = 'alacena-respaldo') {
  const url = URL.createObjectURL(new Blob([JSON.stringify(createBackup(snapshot),null,2)], {type:'application/json'}));
  const link = document.createElement('a'); link.href = url; link.download = `${prefix}-${new Date().toISOString().replace(/[:.]/g,'-')}.json`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function preserveSafetyBackup(snapshot, storage = localStorage) {
  const backup = JSON.stringify(createBackup(snapshot));
  try { storage.setItem('alacena_restore_safety_backup', backup); }
  catch { throw new Error('No hay espacio para el respaldo automático. Descarga un respaldo y libera espacio antes de restaurar. No se cambió ningún dato.'); }
  return backup;
}
export function persistSnapshot(snapshot, storage = localStorage) {
  const keys = {...BACKUP_KEYS,activeHouse:'alacena_active_house'};
  const original = Object.fromEntries(Object.values(keys).map((key) => [key,storage.getItem(key)]));
  try { for (const [field,key] of Object.entries(keys)) storage.setItem(key, JSON.stringify(snapshot[field])); }
  catch {
    for (const [key,value] of Object.entries(original)) { try { if (value === null) storage.removeItem(key); else storage.setItem(key,value); } catch { /* Safety backup remains downloadable. */ } }
    throw new Error('No se pudo completar el guardado local. Conservamos el respaldo automático anterior.');
  }
}
export function mergeHistory(old, rows, field = 'date') { const byId = new Map(old.map((r) => [r.id,r])); rows.forEach((r) => byId.set(r.id,r)); return [...byId.values()].sort((a,b) => String(b[field]).localeCompare(String(a[field]))); }
