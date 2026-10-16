import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs } from 'firebase/firestore';
import { db, auth } from './firebase';

/**
 * Servicio de Aprendizaje Autónomo y Estadísticas de Consumo Frecuente
 * - Memoriza cada producto que el usuario registra (nombre, marca, foto, código, precio, zona, tienda).
 * - Registra métricas de frecuencia: cuántas veces se ha comprado, cuántas veces se ha consumido.
 * - Sincroniza la "Memoria Maestra" en Firestore (/learned_products/) y en LocalStorage (0 ms).
 */

const LOCAL_LEARNED_KEY = 'alacena_learned_products_memory_v1';

// 1. Obtener la memoria local inmediata (0 ms)
export function getLocalLearnedProducts() {
  try {
    const raw = localStorage.getItem(LOCAL_LEARNED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

// 2. Aprender y memorizar un producto recién registrado o modificado
export async function learnProduct(product) {
  if (!product) return;
  const barcode = (product.barcode || product.id || '').toString().trim();
  const name = (product.name || '').trim();
  if (!name) return;

  const memoryEntry = {
    barcode: barcode || null,
    name,
    category: product.category || 'Abarrotes',
    unit: product.unit || 'piezas',
    brand: product.brand || '',
    store: product.store || 'Supermercado',
    unitPriceMxn: parseFloat(product.unitPriceMxn) || 0,
    zone: product.zone || 'Alacena Principal',
    photo: product.photo || null,
    isWine: Boolean(product.isWine),
    lastUsedAt: new Date().toISOString(),
  };

  // A. Guardar en memoria local inmediata
  try {
    const memory = getLocalLearnedProducts();
    const key = barcode || name.toLowerCase();
    memory[key] = {
      ...memory[key],
      ...memoryEntry,
      timesPurchased: (memory[key]?.timesPurchased || 0) + 1,
    };
    localStorage.setItem(LOCAL_LEARNED_KEY, JSON.stringify(memory));
  } catch (e) {
    console.warn('Error guardando memoria local:', e);
  }

  // B. Guardar en la Nube Firestore si hay conexión
  if (db && auth.currentUser) {
    try {
      const docId = barcode || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const docRef = doc(db, 'learned_products', docId);
      await setDoc(docRef, {
        ...memoryEntry,
        timesPurchased: increment(1),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (err) {
      console.warn('[Learning Service] Error sincronizando memoria en Firestore:', err);
    }
  }
}

// 3. Registrar consumo de un producto (para saber qué es lo que más se usa)
export async function trackConsumption(product, quantity = 1) {
  if (!product) return;
  const barcode = (product.barcode || product.id || '').toString().trim();
  const name = (product.name || '').trim();

  try {
    const memory = getLocalLearnedProducts();
    const key = barcode || name.toLowerCase();
    if (memory[key]) {
      memory[key].timesConsumed = (memory[key].timesConsumed || 0) + (parseFloat(quantity) || 1);
      memory[key].lastConsumedAt = new Date().toISOString();
      localStorage.setItem(LOCAL_LEARNED_KEY, JSON.stringify(memory));
    }
  } catch (e) {}

  if (db && auth.currentUser) {
    try {
      const docId = barcode || name.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const docRef = doc(db, 'learned_products', docId);
      await updateDoc(docRef, {
        timesConsumed: increment(parseFloat(quantity) || 1),
        lastConsumedAt: new Date().toISOString(),
      }).catch(() => {});
    } catch (e) {}
  }
}

// 4. Buscar en la memoria aprendida (llamado por el escáner de códigos de barras)
export function findLearnedProduct(rawCodeOrName) {
  if (!rawCodeOrName) return null;
  const memory = getLocalLearnedProducts();
  const clean = rawCodeOrName.toString().trim();
  const lower = clean.toLowerCase();

  // Buscar por coincidencia exacta de código
  if (memory[clean]) {
    return { ...memory[clean], source: 'MEMORIZED_HISTORY' };
  }

  // Buscar por nombre normalizado
  if (memory[lower]) {
    return { ...memory[lower], source: 'MEMORIZED_HISTORY' };
  }

  // Buscar parcial
  for (const key of Object.keys(memory)) {
    const item = memory[key];
    if (item.barcode === clean || (item.name && item.name.toLowerCase() === lower)) {
      return { ...item, source: 'MEMORIZED_HISTORY' };
    }
  }

  return null;
}

// 5. Obtener el Top de Productos Más Comprados y Más Consumidos
export function getTopHouseholdInsights() {
  const memory = getLocalLearnedProducts();
  const list = Object.values(memory);

  const mostPurchased = [...list]
    .filter(p => (p.timesPurchased || 0) > 0)
    .sort((a, b) => (b.timesPurchased || 0) - (a.timesPurchased || 0))
    .slice(0, 10);

  const mostConsumed = [...list]
    .filter(p => (p.timesConsumed || 0) > 0)
    .sort((a, b) => (b.timesConsumed || 0) - (a.timesConsumed || 0))
    .slice(0, 10);

  return {
    mostPurchased,
    mostConsumed,
    totalMemorizedItems: list.length,
  };
}
