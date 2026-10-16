import Dexie from 'dexie';

export const db = new Dexie('AlacenaEnterpriseDB');

// Define Schema for v3.1.0-Luxe
db.version(1).stores({
  products: 'id, name, category, unit, quantity, minStock, zone, barcode, qrId, syncStatus',
  shoppingList: 'id, name, department, store, checked, targetZone',
  recipes: 'id, name, difficulty, tiempoMin',
  auditLogs: 'id, timestamp, accion, entidad, hashActual',
  zones: 'id, name',
  households: 'id, name'
});

db.version(2).stores({
  priceRecords: 'id, canonicalName, fullName, store, unitPrice, date'
});

// Helper sync utilities
export async function syncPantryToIndexedDb(products, shoppingList, recipes, auditLogs) {
  try {
    const entries = [[db.products, products], [db.shoppingList, shoppingList],
      [db.recipes, recipes], [db.auditLogs, auditLogs]].filter(([, rows]) => Array.isArray(rows));
    if (!entries.length) return;
    await db.transaction('rw', entries.map(([table]) => table), async () => {
      for (const [table, rows] of entries) {
        await table.clear();
        if (rows.length) await table.bulkPut(rows);
      }
    });
  } catch (err) {
    console.warn('[Dexie DB] Background sync warning:', err);
  }
}
