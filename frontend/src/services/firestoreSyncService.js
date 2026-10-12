import { 
  collection, 
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
import { db } from './firebase';

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

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      onUpdate(items);
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
export async function saveProductToCloud(product) {
  if (!db || !product?.id) return;
  try {
    const docRef = doc(db, 'products', String(product.id));
    const payload = {
      ...product,
      updatedAt: new Date().toISOString(),
      cloudSyncedAt: serverTimestamp(),
    };
    await setDoc(docRef, payload, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Error al guardar producto:', err);
  }
}

// 3. Eliminar producto de Firestore
export async function deleteProductFromCloud(productId) {
  if (!db || !productId) return;
  try {
    await deleteDoc(doc(db, 'products', String(productId)));
  } catch (err) {
    console.warn('[Firestore] Error al eliminar producto:', err);
  }
}

// 4. Escuchar Lista del Súper por Hogar
export function subscribeToShoppingList(householdId, onUpdate) {
  if (!db) return () => {};
  try {
    const ref = collection(db, 'shopping_list');
    const q = householdId 
      ? query(ref, where('householdId', '==', householdId))
      : query(ref);

    return onSnapshot(q, (snapshot) => {
      const items = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      onUpdate(items);
    }, (err) => console.warn('[Firestore] Error en lista del súper:', err));
  } catch (e) {
    return () => {};
  }
}

// 5. Guardar elemento de la lista del súper
export async function saveShoppingItemToCloud(item) {
  if (!db || !item?.id) return;
  try {
    const docRef = doc(db, 'shopping_list', String(item.id));
    await setDoc(docRef, { ...item, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Error al guardar en súper:', err);
  }
}

// 6. Eliminar elemento de la lista del súper
export async function deleteShoppingItemFromCloud(itemId) {
  if (!db || !itemId) return;
  try {
    await deleteDoc(doc(db, 'shopping_list', String(itemId)));
  } catch (err) {
    console.warn('[Firestore] Error eliminando ítem de súper:', err);
  }
}

// 7. Bitácora Forense Global (Consumos y Compras México ⇄ España)
export async function logAuditEventToCloud(logEntry) {
  if (!db || !logEntry?.id) return;
  try {
    const docRef = doc(db, 'audit_logs', String(logEntry.id));
    await setDoc(docRef, {
      ...logEntry,
      timestamp: logEntry.timestamp || new Date().toISOString(),
      cloudTimestamp: serverTimestamp(),
    });
  } catch (err) {
    console.warn('[Firestore] Error registrando bitácora en la nube:', err);
  }
}

// 8. Escuchar Bitácora en Tiempo Real (para ver qué consumió cada casa)
export function subscribeToAuditLogs(onUpdate) {
  if (!db) return () => {};
  try {
    const ref = collection(db, 'audit_logs');
    return onSnapshot(ref, (snapshot) => {
      const logs = [];
      snapshot.forEach((docSnap) => {
        logs.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Ordenar por fecha descendente
      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      onUpdate(logs);
    }, (err) => console.warn('[Firestore] Error en bitácora:', err));
  } catch (e) {
    return () => {};
  }
}

// 9. Inicializar datos semilla en la nube si está vacía
export async function seedCloudIfEmpty(initialProducts, initialHouseholds) {
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
