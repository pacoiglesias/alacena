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
    if (products && products.length) {
      await db.products.bulkPut(products);
    }
    if (shoppingList && shoppingList.length) {
      await db.shoppingList.bulkPut(shoppingList);
    }
    if (recipes && recipes.length) {
      await db.recipes.bulkPut(recipes);
    }
    if (auditLogs && auditLogs.length) {
      await db.auditLogs.bulkPut(auditLogs);
    }
  } catch (err) {
    console.warn('[Dexie DB] Background sync warning:', err);
  }
}
