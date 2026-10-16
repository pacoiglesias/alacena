import { 
  collection, writeBatch, increment,
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { readLocalState } from './localState';
import { getIdTokenResult } from 'firebase/auth';

async function canSync() {
  if (!auth.currentUser) return false;
  const cached = readLocalState('alacena_cloud_access', {});
  if (!navigator.onLine && cached.uid === auth.currentUser.uid && cached.allowed) return true;
  try {
    const { claims } = await getIdTokenResult(auth.currentUser);
    return claims.alacenaAccess === true && claims.email_verified === true;
  } catch (error) { reportSyncError(error); return false; }
}

function reportSyncError(error) {
  window.dispatchEvent(new CustomEvent('alacena-sync-error'));
  console.warn('[Firestore] No se pudo confirmar el cambio en la nube:', error);
}

/**
 * Servicio de Sincronización en Tiempo Real con Firestore (México ⇄ España)
 * Permite que los cambios realizados en España aparezcan en México en < 1 segundo y viceversa.
 */

// 1. Escuchar productos filtrados por Hogar / Residencia (México o España)
export function subscribeToProducts(householdId, onUpdate, onError) {
  if (!db) return () => {};
  
  try {
    const productsRef = collection(db, 'products');
    // Si se especifica hogar, filtra por ese hogar
    const q = householdId 
      ? query(productsRef, where('householdId', '==', householdId))
      : query(productsRef);

    const unsubscribe = onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...docSnap.data(), id: docSnap.id });
      });
      onUpdate(items, snapshot.metadata);
    }, (error) => {
      console.warn('[Firestore] Error en suscripción de productos:', error);
      if (onError) onError(error);
    });

    return unsubscribe;
  } catch (err) {
    console.warn('[Firestore] Excepción al suscribir productos:', err);
    return () => {};
  }
}

// 2. Guardar o actualizar un producto en Firestore
export async function saveProductToCloud(product, options = {}) {
  if (!await canSync()) return;
  if (!db || !product?.id) return;
  try {
    const docRef = doc(db, 'products', String(product.id));
    const payload = {
      ...product,
      ...(Number.isFinite(options.delta) ? { quantity: increment(options.delta) } : {}),
      householdId: product.householdId || 'house-1',
      updatedAt: new Date().toISOString(),
      cloudSyncedAt: serverTimestamp(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    reportSyncError(err);
  }
}

// 3. Eliminar producto de Firestore
export async function deleteProductFromCloud(productId) {
  if (!await canSync()) return;
  if (!db || !productId) return;
  try {
    await deleteDoc(doc(db, 'products', String(productId)));
  } catch (err) {
    reportSyncError(err);
  }
}

// 4. Escuchar Lista del Súper por Hogar
export function subscribeToShoppingList(householdId, onUpdate, onError) {
  if (!db) return () => {};
  try {
    const ref = collection(db, 'shopping_list');
    const q = householdId 
      ? query(ref, where('householdId', '==', householdId))
      : query(ref);

    return onSnapshot(q, { includeMetadataChanges: true }, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push({ ...docSnap.data(), id: docSnap.id });
      });
      onUpdate(items, snapshot.metadata);
    }, (err) => { reportSyncError(err); onError?.(err); });
  } catch (e) {
    return () => {};
  }
}

// 5. Guardar elemento de la lista del súper
export async function saveShoppingItemToCloud(item) {
  if (!await canSync()) return;
  if (!db || !item?.id) return;
  try {
    const docRef = doc(db, 'shopping_list', String(item.id));
    await setDoc(docRef, { ...item, householdId: item.householdId || 'house-1', updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    reportSyncError(err);
  }
}

// 6. Eliminar elemento de la lista del súper
export async function deleteShoppingItemFromCloud(itemId) {
  if (!await canSync()) return;
  if (!db || !itemId) return;
  try {
    await deleteDoc(doc(db, 'shopping_list', String(itemId)));
  } catch (err) {
    reportSyncError(err);
  }
}

// 7. Bitácora Forense Global (Consumos y Compras México ⇄ España)
export async function logAuditEventToCloud(logEntry) {
  if (!await canSync()) return;
  if (!db || !logEntry?.id) return;
  try {
    const docRef = doc(db, 'audit_logs', String(logEntry.id));
    await setDoc(docRef, {
      ...logEntry,
      timestamp: logEntry.timestamp || new Date().toISOString(),
      cloudTimestamp: serverTimestamp(),
    });
  } catch (err) {
    reportSyncError(err);
  }
}

// 8. Escuchar Bitácora en Tiempo Real (para ver qué consumió cada casa)
export function subscribeToAuditLogs(onUpdate, onError) {
  if (!db) return () => {};
  try {
    const ref = collection(db, 'audit_logs');
    return onSnapshot(ref, (snapshot) => {
      const logs = [];
      snapshot.forEach((docSnap) => {
        logs.push({ ...docSnap.data(), id: docSnap.id });
      });
      // Ordenar por fecha descendente
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      onUpdate(logs);
    }, (err) => { reportSyncError(err); onError?.(err); });
  } catch (e) {
    return () => {};
  }
}

// 9. Inicializar datos semilla en la nube si está vacía
export async function seedCloudIfEmpty(initialProducts, initialHouseholds) {
  if (!await canSync()) return;
  if (!db) return;
  try {
    const checkSnap = await getDocs(collection(db, 'products'));
    if (checkSnap.empty && initialProducts?.length) {
      console.log('🌱 Inicializando despensa inicial en Firestore...');
      for (const p of initialProducts) {
        await saveProductToCloud(p);
      }
    }
  } catch (e) {
    console.warn('[Firestore] Fallo al sembrar datos iniciales:', e);
  }
}

// The inventory, outstanding list and receipt are committed atomically in Firebase.
export async function savePurchaseTransaction(productWrites, shoppingChanges, receipt) {
  if (!await canSync()) return;
  const batch = writeBatch(db);
  const consolidated = new Map();
  for (const write of productWrites) {
    const previous = consolidated.get(write.product.id);
    consolidated.set(write.product.id, previous ? { product: write.product, delta: Number.isFinite(previous.delta) && Number.isFinite(write.delta) ? previous.delta + write.delta : undefined } : write);
  }
  for (const { product, delta } of consolidated.values()) {
    batch.set(doc(db, 'products', String(product.id)), { ...product,
      quantity: Number.isFinite(delta) ? increment(delta) : product.quantity,
      householdId: product.householdId || 'house-1', cloudSyncedAt: serverTimestamp() }, { merge: true });
  }
  for (const id of shoppingChanges.removedIds) batch.delete(doc(db, 'shopping_list', String(id)));
  for (const item of shoppingChanges.updated) batch.set(doc(db, 'shopping_list', String(item.id)), item, { merge: true });
  batch.set(doc(db, 'purchase_history', String(receipt.id)), receipt);
  window.dispatchEvent(new CustomEvent('alacena-sync-pending'));
  try { await batch.commit(); window.dispatchEvent(new CustomEvent('alacena-sync-complete')); }
  catch (error) { reportSyncError(error); }
}

export function subscribeToPurchaseHistory(onUpdate, onError) {
  return onSnapshot(collection(db, 'purchase_history'), (snapshot) => {
    if (snapshot.empty && snapshot.metadata.fromCache) return;
    const receipts = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
    receipts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
    onUpdate(receipts.slice(0, 30));
  }, onError);
}
