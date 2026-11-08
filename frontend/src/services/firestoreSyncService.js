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
  getDocs, limit, startAfter, runTransaction
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { readLocalState } from './localState';
import { getIdTokenResult } from 'firebase/auth';
import { cloudWritesPaused } from './cloudGateway';

async function canSync(allowPaused = false) {
  if (cloudWritesPaused() && !allowPaused) return false;
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

// 7. Escuchar Recetas por Hogar (mismo patrón que productos y lista)
// AL-1: la consulta filtra por householdId porque las reglas lo exigen
// (existingHouseholdAllowed deniega documentos sin casa o de otra casa).
// Las recetas locales antiguas sin householdId se sellan con la casa
// actual al guardarlas (saveRecipeToCloud), así que entran en la
// suscripción en cuanto se suben.
export function subscribeToRecipes(householdId, onUpdate, onError) {
  if (!db) return () => {};
  try {
    const ref = collection(db, 'recipes');
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
  } catch {
    return () => {};
  }
}

// 8. Guardar o actualizar una receta en Firestore
export async function saveRecipeToCloud(recipe) {
  if (!await canSync()) return;
  if (!db || !recipe?.id) return;
  try {
    const docRef = doc(db, 'recipes', String(recipe.id));
    await setDoc(docRef, { ...recipe, householdId: recipe.householdId || 'house-1', updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    reportSyncError(err);
  }
}

// 9. Eliminar receta de Firestore
export async function deleteRecipeFromCloud(recipeId) {
  if (!await canSync()) return;
  if (!db || !recipeId) return;
  try {
    await deleteDoc(doc(db, 'recipes', String(recipeId)));
  } catch (err) {
    reportSyncError(err);
  }
}

// 10. Bitácora Forense Global (Consumos y Compras México ⇄ España)
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

// 11. Escuchar Bitácora en Tiempo Real (para ver qué consumió cada casa)
// AL-1: filtrada por la casa activa. Sin el filtro, las reglas (que exigen
// householdId en las casas del claim) deniegan la consulta: las reglas no
// son filtros.
export function subscribeToAuditLogs(householdId, onUpdate, onError) {
  if (!db) return () => {};
  if (!householdId) { onError?.(new Error('Falta la casa activa para leer la bitácora.')); return () => {}; }
  try {
    const ref = collection(db, 'audit_logs');
    const q = query(ref, where('householdId', '==', householdId));
    return onSnapshot(q, (snapshot) => {
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

// 12. Inicializar datos semilla en la nube si está vacía
export async function seedCloudIfEmpty(snapshot) {
  if (!await canSync(true) || !navigator.onLine) throw new Error('Conecta la cuenta autorizada y vuelve a tener internet antes de subir tus datos.');
  // AL-1: la comprobación se acota a la casa activa; una consulta sin
  // filtrar por householdId la deniegan las reglas.
  const houseId = snapshot.activeHouse?.id || 'house-1';
  const [products, list, history] = await Promise.all(['products','shopping_list','purchase_history'].map((name) => getDocs(query(collection(db,name),where('householdId','==',houseId),limit(1)))));
  if (!products.empty || !list.empty || !history.empty) throw new Error('La nube ya contiene datos de esta casa. No se subió nada: conserva tu copia y revisa la restauración para combinar.');
  return restoreCloudSnapshot(snapshot, {}, true);
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

const HISTORY_PAGE_SIZE = 30;
// AL-1: historial filtrado por la casa activa (las reglas exigen householdId
// en las casas del claim). Requiere el índice compuesto purchase_history
// (householdId ASC, date DESC) de firestore.indexes.json.
export function subscribeToPurchaseHistory(householdId, onUpdate, onError) {
  if (!householdId) { onError?.(new Error('Falta la casa activa para leer el historial de compras.')); return () => {}; }
  return onSnapshot(query(collection(db,'purchase_history'),where('householdId','==',householdId),orderBy('date','desc'),limit(HISTORY_PAGE_SIZE)), (snapshot) => {
    if (snapshot.empty && snapshot.metadata.fromCache) return;
    onUpdate(snapshot.docs.map((d) => ({...d.data(),id:d.id})), {cursor:snapshot.docs.at(-1),hasMore:snapshot.size===HISTORY_PAGE_SIZE,fromCache:snapshot.metadata.fromCache});
  },onError);
}
export async function fetchPurchaseHistoryPage(householdId, cursor) {
  if (!await canSync() || !navigator.onLine) throw new Error('Conéctate a internet para cargar compras anteriores.');
  if (!householdId) throw new Error('Falta la casa activa para cargar compras anteriores.');
  const q = query(collection(db,'purchase_history'),where('householdId','==',householdId),orderBy('date','desc'),...(cursor ? [startAfter(cursor)] : []),limit(HISTORY_PAGE_SIZE));
  const page = await getDocs(q);
  return {rows:page.docs.map((d) => ({...d.data(),id:d.id})),cursor:page.docs.at(-1),hasMore:page.size===HISTORY_PAGE_SIZE};
}

const RESTORE_COLLECTIONS = {products:'products',shoppingList:'shopping_list',zones:'zones',recipes:'recipes',households:'households',auditLogs:'audit_logs',purchaseHistory:'purchase_history'};
const stable = (value) => JSON.stringify(sortObject(JSON.parse(JSON.stringify(value))));
function sortObject(value) {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value==='object') return Object.fromEntries(Object.keys(value).sort().map((k) => [k,sortObject(value[k])]));
  return value;
}
export async function restoreCloudSnapshot(next, current, importing = false) {
  if (!await canSync(importing) || !navigator.onLine) throw new Error('La cuenta debe tener acceso y conexión para restaurar en la nube.');
  // AL-1: las reglas exigen householdId en las casas del claim. Las filas
  // locales antiguas (zonas, recetas, documentos de casa) no siempre lo
  // traen: se sella aquí con la casa activa (o el propio id en households)
  // para que la restauración no se deniegue. Los productos, la lista, la
  // bitácora y el historial ya lo traen desde la app; si falta, se sella
  // igual. Nota: si en la nube ya hay documentos antiguos SIN householdId,
  // la lectura de conflicto (tx.get) se deniega y la restauración falla;
  // en ese caso hay que sellarlos una vez con el Admin SDK.
  const houseIdFor = (field, id, row) => row.householdId || (field === 'households' ? String(id) : (next.activeHouse?.id || 'house-1'));
  const operations = [];
  for (const [field,name] of Object.entries(RESTORE_COLLECTIONS)) {
    const immutable = ['auditLogs','purchaseHistory'].includes(field);
    const before = new Map((current[field] || []).map((r) => [r.id,r]));
    const after = new Map((next[field] || []).map((r) => [r.id,r]));
    for (const [id,row] of after) if (!before.has(id) || (!immutable && stable(before.get(id))!==stable(row))) operations.push({ref:doc(db,name,String(id)),row:{...row,householdId:houseIdFor(field,id,row)},before:before.get(id),immutable,field});
    if (!immutable && !importing) for (const [id,row] of before) if (!after.has(id)) operations.push({ref:doc(db,name,String(id)),row:null,before:row,field});
  }
  if (operations.length>400) throw new Error('Esta restauración cambia más de 400 documentos. No se cambió nada. Restaura un respaldo más pequeño o trabaja primero en una copia local.');
  await runTransaction(db,async (tx) => {
    const existing = await Promise.all(operations.map((op) => tx.get(op.ref)));
    for (let i=0;i<operations.length;i++) {
      const op=operations[i], server=existing[i];
      if (op.immutable && server.exists()) continue;
      if (server.exists()) {
        const data={...server.data(),id:server.id};
        if (importing || !op.before || stable(data)!==stable(op.before)) throw new Error('Los datos cambiaron en otro dispositivo. No se reemplazó nada. Genera una nueva vista previa.');
      } else if (op.before && ['products','shoppingList'].includes(op.field)) throw new Error('Un artículo cambió en la nube. Actualiza la vista previa antes de restaurar.');
      if (op.row===null) tx.delete(op.ref);
      else tx.set(op.ref,{...op.row,...(op.field==='auditLogs' ? {cloudTimestamp:serverTimestamp()} : {})});
    }
  });
}