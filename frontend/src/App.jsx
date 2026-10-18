import React, { useState, useEffect, lazy, Suspense } from 'react';
import { belongsToHouse, sameStockItem, positiveQuantity, purchaseSummary } from './utils/householdShopping';
import { readLocalState, writeLocalState } from './services/localState';
import { reconcileReceiptList } from './utils/receiptReview';
import { inventoryMovement } from './utils/inventoryMovement';
import OfflineStatus from './components/layout/OfflineStatus';
import CloudStatus from './components/layout/CloudStatus';
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth';
import { auth } from './services/firebase';
import Header from './components/layout/Header';
import BottomNavBar from './components/layout/BottomNavBar';
import NoticeHost from './components/common/NoticeHost';
import { notify, confirmDialog } from './services/notice';
const InventoryView = lazy(() => import('./components/inventory/InventoryView'));
const ManualProductModal = lazy(() => import('./components/inventory/ManualProductModal'));
import ShoppingListView from './components/shopping/ShoppingListView';
const RecipesView = lazy(() => import('./components/recipes/RecipesView'));
const AuditTrailView = lazy(() => import('./components/audit/AuditTrailView'));
const CameraScannerModal = lazy(() => import('./components/scanner/CameraScannerModal'));
const AddWineModal = lazy(() => import('./components/sommelier/AddWineModal'));
const WineTastingModal = lazy(() => import('./components/sommelier/WineTastingModal'));
const CavaProCommandCenterModal = lazy(() => import('./components/layout/CavaProCommandCenterModal'));
const ZoneModal = lazy(() => import('./components/zones/ZoneModal'));
const HouseholdsModal = lazy(() => import('./components/households/HouseholdsModal'));
const ChangelogModal = lazy(() => import('./components/changelog/ChangelogModal'));
const PurchaseHistoryModal = lazy(() => import('./components/shopping/PurchaseHistoryModal'));
const QuickScanActionModal = lazy(() => import('./components/scanner/QuickScanActionModal'));
const PantryQrBookletModal = lazy(() => import('./components/shopping/PantryQrBookletModal'));
import { audio } from './services/audioService';
import { syncPantryToIndexedDb } from './services/db';
import { findProductByScanCode, extractCodeFromScan } from './utils/scanHelper';
import { lookupBarcode } from './services/barcodeLookupService';
import { recordPricePoints } from './services/priceIntelligenceService';
import {
  subscribeToProducts, savePurchaseTransaction, subscribeToPurchaseHistory,
  saveProductToCloud,
  deleteProductFromCloud,
  subscribeToShoppingList,
  saveShoppingItemToCloud,
  deleteShoppingItemFromCloud,
  logAuditEventToCloud,
  subscribeToAuditLogs
} from './services/firestoreSyncService';
import { learnProduct, trackConsumption } from './services/learningService';
import {
  INITIAL_PRODUCTS,
  INITIAL_ZONES,
  INITIAL_RECIPES,
  INITIAL_HOUSEHOLDS,
  INITIAL_STAFF,
  INITIAL_AUDIT_LOGS
} from './services/demoData';
import {
  areItemsEquivalent,
  deduplicateShoppingItems,
  deduplicateInventoryProducts
} from './utils/deduplication';
import { sanitizeAllInventory, sanitizeCavaProduct } from './utils/cavaGuard';

// Initial shopping list generated from low stock items
const INITIAL_SHOPPING_LIST = [
  {
    id: 'shop-1',
    name: 'Salmón Salvaje Canadiense en Porciones',
    quantity: 3.5,
    unit: 'kg',
    store: 'Costco',
    estimatedPriceMxn: 520.00,
    targetZone: 'Cuarto Frío',
    checked: false,
  },
  {
    id: 'shop-2',
    name: 'Café de Especialidad Grano Veracruz',
    quantity: 2.4,
    unit: 'kg',
    store: 'Tostador Local',
    estimatedPriceMxn: 390.00,
    targetZone: 'Alacena Principal',
    checked: false,
  },
  {
    id: 'shop-3',
    name: 'Queso Parmigiano Reggiano 24 Meses',
    quantity: 2.0,
    unit: 'kg',
    store: 'City Market',
    estimatedPriceMxn: 890.00,
    targetZone: 'Refrigerador',
    checked: false,
  },
];

export default function App() {
  // Local storage persisted state con saneamiento de duplicados
  const [products, setProducts] = useState(() => {
    const saved = readLocalState('alacena_products', []);
    return saved
      ? sanitizeAllInventory(deduplicateInventoryProducts(saved), INITIAL_ZONES)
      : [];
  });

  const [shoppingList, setShoppingList] = useState(() => {
    const saved = readLocalState('alacena_shopping_list', []);
    return saved ? deduplicateShoppingItems(saved) : [];
  });

  const [zones, setZones] = useState(() => {
    const saved = readLocalState('alacena_zones', INITIAL_ZONES);
    return saved ? saved : INITIAL_ZONES;
  });

  const [recipes, setRecipes] = useState(() => {
    const saved = readLocalState('alacena_recipes', INITIAL_RECIPES);
    return saved ? saved : INITIAL_RECIPES;
  });

  const [households, setHouseholds] = useState(() => {
    const saved = readLocalState('alacena_households', INITIAL_HOUSEHOLDS);
    return saved ? saved : INITIAL_HOUSEHOLDS;
  });

  const [activeHouse, setActiveHouse] = useState(() => {
    const saved = readLocalState('alacena_active_house', INITIAL_HOUSEHOLDS[0]);
    return saved ? saved : INITIAL_HOUSEHOLDS[0];
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = readLocalState('alacena_audit_logs', []);
    return saved ? saved : [];
  });

  const [staffList] = useState(INITIAL_STAFF);

  // UI state
  const [activeTab, setActiveTab] = useState('shopping'); // 'inventory' | 'shopping' | 'recipes' | 'audit'
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  // iOS exige que el permiso de cámara se solicite directamente desde el gesto
  // del usuario (sin setTimeout). Lo pedimos aquí al tocar el botón y abrimos el modal.
  const handleOpenScanner = async () => {
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((t) => t.stop());
      }
    } catch {
      // Si el usuario deniega o no hay cámara, el modal muestra el mensaje correspondiente.
    }
    setIsScannerOpen(true);
  };
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isAddWineOpen, setIsAddWineOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [isHouseModalOpen, setIsHouseModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [operationNotice, setOperationNotice] = useState('');
  const [isMuted, setIsMuted] = useState(audio.isMuted());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isWineTastingOpen, setIsWineTastingOpen] = useState(false);
  const [selectedWineForTasting, setSelectedWineForTasting] = useState(null);
  const [isPurchaseHistoryOpen, setIsPurchaseHistoryOpen] = useState(false);
  const [isQrBookletOpen, setIsQrBookletOpen] = useState(false);
  const [isQuickScanOpen, setIsQuickScanOpen] = useState(false);
  const [quickScanProduct, setQuickScanProduct] = useState(null);

  // Detección automática de Escaneo QR o Toque NFC por parámetro URL (?scan=... / ?qr=... / ?id=...)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const scanParam = params.get('scan') || params.get('qr') || params.get('id');
      if (scanParam) {
        const { product: found, cleanCode } = findProductByScanCode(products.filter((p) => belongsToHouse(p, activeHouse.id)), scanParam);
        if (found) {
          setQuickScanProduct(found);
          setIsQuickScanOpen(true);
          audio.success();
        } else if (cleanCode) {
          // Si no está en inventario local, buscar en catálogo comercial y abrir tarjeta de descubrimiento
          lookupBarcode(cleanCode).then((discovered) => {
            if (discovered) {
              setQuickScanProduct({
                id: `prod-temp-${Date.now()}`,
                name: discovered.name,
                category: discovered.category || 'Abarrotes',
                quantity: 1,
                unit: discovered.unit || 'piezas',
                barcode: discovered.barcode || cleanCode,
                brand: discovered.brand || '',
                zone: discovered.zone || zones[0]?.name || 'Alacena Principal',
                unitPriceMxn: discovered.price || 0,
                photo: discovered.photo || null,
                isWine: discovered.isWine || false,
                isNewDiscovered: true,
              });
              setIsQuickScanOpen(true);
              audio.success();
            }
          });
        }
        // Limpiar parámetros de URL suavemente sin recargar la página
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, '', cleanUrl);
      }
    } catch (e) {
      console.warn('Error leyendo parámetros de escaneo:', e);
    }
  }, [products]);

  // Historial de compras para devoluciones y auditoría
  const [purchaseHistory, setPurchaseHistory] = useState(() => {
    try {
      const saved = readLocalState('alacena_purchase_history', []);
      return saved ? saved : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      writeLocalState('alacena_purchase_history', purchaseHistory);
    } catch (e) {}
  }, [purchaseHistory]);

  // Online / Offline network event detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      audio.success();
    };
    const handleOffline = () => {
      setIsOnline(false);
      audio.alert();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage
  useEffect(() => {
    writeLocalState('alacena_products', products);
  }, [products]);

  useEffect(() => {
    writeLocalState('alacena_shopping_list', shoppingList);
  }, [shoppingList]);

  useEffect(() => {
    writeLocalState('alacena_zones', zones);
  }, [zones]);

  useEffect(() => {
    writeLocalState('alacena_recipes', recipes);
  }, [recipes]);

  useEffect(() => {
    writeLocalState('alacena_households', households);
  }, [households]);

  useEffect(() => {
    writeLocalState('alacena_active_house', activeHouse);
  }, [activeHouse]);

  useEffect(() => {
    writeLocalState('alacena_audit_logs', auditLogs);
  }, [auditLogs]);

  // IndexedDB Primario (Dexie.js) - Persistencia Offline Real en Segundo Plano
  useEffect(() => {
    syncPantryToIndexedDb(products, shoppingList, recipes, auditLogs);
  }, [products, shoppingList, recipes, auditLogs]);

  const [cloudAllowed, setCloudAllowed] = useState(false);
  const [cloudState, setCloudState] = useState('local');
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    let currentUser;
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      currentUser = user;
      setCloudAllowed(false);
      setCloudState('local');
      if (!user) return;
      try {
        const token = await getIdTokenResult(user);
        if (currentUser !== user) return;
        const allowed = token.claims.alacenaAccess === true && token.claims.email_verified === true;
        writeLocalState('alacena_cloud_access', { uid: user.uid, allowed });
        setCloudAllowed(allowed);
        setCloudState(allowed ? 'connecting' : 'unauthorized');
      } catch { if (currentUser === user) { const cached = readLocalState('alacena_cloud_access', {}); if (cached.uid === user.uid && cached.allowed) { setCloudAllowed(true); setCloudState('cached'); } else setCloudState('error'); } }
    });
    const onStorageError = () => setStorageError(true);
    window.addEventListener('alacena-storage-error', onStorageError);
    const onSyncError = () => setCloudState('error');
    window.addEventListener('alacena-sync-error', onSyncError);
    const pending = () => setCloudState('pending'), complete = () => setCloudState('synced');
    window.addEventListener('alacena-sync-pending', pending); window.addEventListener('alacena-sync-complete', complete);
    return () => { window.removeEventListener('alacena-sync-pending', pending); window.removeEventListener('alacena-sync-complete', complete); currentUser = null; unsubscribe(); window.removeEventListener('alacena-sync-error', onSyncError); window.removeEventListener('alacena-storage-error', onStorageError); };
  }, []);

  useEffect(() => {
    if (!cloudAllowed) return;
    const fail = () => setCloudState('error');
    // Preserve the device copy before switching to the authoritative cloud snapshot.
    writeLocalState('alacena_before_cloud_connection', { products: readLocalState('alacena_products', []), shoppingList: readLocalState('alacena_shopping_list', []), savedAt: new Date().toISOString() });
    const unsubProducts = subscribeToProducts(null, (rows, metadata) => { if (!rows.length && metadata?.fromCache) return; setProducts(rows); }, fail);
    const unsubShopping = subscribeToShoppingList(null, (items, metadata) => {
      if (!items.length && metadata?.fromCache) return;
      setShoppingList(items);
      setCloudState(metadata?.hasPendingWrites ? 'pending' : metadata?.fromCache ? 'cached' : 'synced');
    }, fail);
    const unsubAudit = subscribeToAuditLogs(setAuditLogs, fail);
    const unsubHistory = subscribeToPurchaseHistory(setPurchaseHistory, fail);
    return () => { unsubProducts(); unsubShopping(); unsubAudit(); unsubHistory(); };
  }, [cloudAllowed]);

  // Audio mute toggle
  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const handleOpenWineTasting = (wine) => {
    setSelectedWineForTasting(wine);
    setIsWineTastingOpen(true);
  };

  const handleSaveWineRating = (wineId, ratingData) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === wineId) {
          addAuditEntry(
            ratingData.reviewerName || 'Sommelier CavaPro',
            'CALIFICACION_VINO',
            `Calificó ${p.name} con ${ratingData.rating}⭐ (${ratingData.sommelierPoints} pts)`,
            ratingData.tastingNotes
          );
          return {
            ...p,
            rating: ratingData.rating,
            sommelierPoints: ratingData.sommelierPoints,
            tastingNotes: ratingData.tastingNotes,
            foodPairing: ratingData.foodPairing || p.foodPairing,
          };
        }
        return p;
      })
    );
  };

  const handleUncorkWine = (wineId, tastingData) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === wineId) {
          const newQty = Math.max(0, (p.quantity || 1) - 1);
          addAuditEntry(
            tastingData.reviewerName || 'Sommelier CavaPro',
            'DESCORCHE_VINO',
            `Descorchó 1 botella de ${p.name}. Stock restante: ${newQty} botellas.`,
            `Reseña: ${tastingData.rating}⭐ (${tastingData.sommelierPoints} pts). ${tastingData.tastingNotes}`
          );
          return {
            ...p,
            quantity: newQty,
            rating: tastingData.rating,
            sommelierPoints: tastingData.sommelierPoints,
            tastingNotes: tastingData.tastingNotes,
          };
        }
        return p;
      })
    );
  };

  // Helper to add audit log
  const addAuditEntry = (staff, action, description, details = '') => {
    const newLog = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      staff: staff || 'Administrador General',
      action,
      description,
      details,
      householdId: activeHouse?.id || 'house-1',
      householdName: activeHouse?.name || 'Casa México',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    logAuditEventToCloud(newLog);
  };

  // Product actions
  const handleSaveProduct = (productData) => {
    if (!productData?.name?.trim() || !Number.isFinite(Number(productData.quantity)) || Number(productData.quantity) < 0) {
      setOperationNotice('Escribe el nombre y una existencia válida mayor o igual a cero.'); return false;
    }
    const item = sanitizeCavaProduct({ ...productData, id: productData.id || crypto.randomUUID(),
      name: productData.name.trim(), quantity: Number(productData.quantity), unit: productData.unit || 'piezas',
      unitPriceMxn: Math.max(0, Number(productData.unitPriceMxn) || 0),
      householdId: activeHouse.id, householdName: activeHouse.name }, zones);
    const existing = products.find((p) => belongsToHouse(p, activeHouse.id) && (p.id === item.id || sameStockItem(p, item)));
    const consolidate = existing && existing.id !== item.id;
    const saved = consolidate ? { ...existing, quantity: Math.round((Number(existing.quantity || 0) + item.quantity) * 1000) / 1000, updatedAt: new Date().toISOString() } : item;
    setProducts((previous) => existing ? previous.map((p) => p.id === existing.id ? saved : p) : [saved, ...previous]);
    saveProductToCloud(saved, consolidate ? { delta: item.quantity } : {});
    learnProduct(saved);
    addAuditEntry(item.lastLoggedBy || 'Personal de casa', existing ? 'MODIFICACION_ARTICULO' : 'ALTA_MANUAL',
      saved.name + ': ' + saved.quantity + ' ' + saved.unit, consolidate ? 'Ingreso consolidado con un producto equivalente de esta casa.' : 'Captura revisada');
    setEditingProduct(null); setOperationNotice(saved.name + ' guardado: ' + saved.quantity + ' ' + saved.unit + '.');
    return true;
  };

  const handleDeleteProduct = (productId) => {
    const target = products.find((p) => p.id === productId);
    if (target) {
      addAuditEntry(
        'Administrador General',
        'BAJA_ARTICULO',
        `Eliminó del sistema el artículo ${target.name} de ${target.zone}`
      );
    }
    deleteProductFromCloud(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleUpdateQuantity = (productId, newQuantity, reason = '') => {
    const existing = products.find((p) => p.id === productId && belongsToHouse(p, activeHouse.id));
    if (!existing) { if (quickScanProduct?.id === productId && quickScanProduct.isNewDiscovered) return handleSaveProduct({ ...quickScanProduct, quantity: newQuantity }); setOperationNotice('No encontramos ese producto en esta casa.'); return false; }
    const next = Number(newQuantity);
    if (!Number.isFinite(next) || next < 0) { setOperationNotice('La existencia debe ser un número mayor o igual a cero.'); return false; }
    const delta = next - Number(existing.quantity || 0);
    if (!delta) return true;
    try {
      const movement = inventoryMovement(products, { id: productId, amount: Math.abs(delta), direction: delta > 0 ? 'in' : 'out', householdId: activeHouse.id });
      setProducts(movement.products);
      saveProductToCloud(movement.updated, { delta: movement.delta });
      if (delta < 0) trackConsumption(existing, Math.abs(delta));
      else learnProduct(movement.updated);
      addAuditEntry(existing.lastLoggedBy || 'Personal de casa', delta > 0 ? 'INCREMENTO_STOCK' : 'CONSUMO_STOCK',
        (delta > 0 ? 'Ingresó ' : 'Consumió ') + Math.abs(delta) + ' ' + existing.unit + ' de ' + existing.name,
        'Existencia: ' + movement.updated.quantity + (reason ? ' · ' + reason : ''));
      setOperationNotice(existing.name + ': quedan ' + movement.updated.quantity + ' ' + existing.unit + '.');
      return true;
    } catch (error) { setOperationNotice(error.message); return false; }
  };

  // Shopping list actions
  const handleToggleShoppingItem = (itemId) => {
    setShoppingList((prev) => {
      const updated = prev.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item));
      const target = updated.find((i) => i.id === itemId);
      if (target) saveShoppingItemToCloud(target);
      return updated;
    });
  };

  const handleRemoveShoppingItem = (itemId) => {
    deleteShoppingItemFromCloud(itemId);
    setShoppingList((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleUpdateShoppingItemQuantity = (itemId, newQuantity) => {
    setShoppingList((prev) => {
      const updated = prev.map((item) =>
        item.id === itemId ? { ...item, quantity: positiveQuantity(newQuantity, item.quantity) } : item
      );
      const target = updated.find((i) => i.id === itemId);
      if (target) saveShoppingItemToCloud(target);
      return updated;
    });
  };

  // Shopping list actions con DEDUPLICACIÓN Y CONSOLIDACIÓN ESTRICTA
  const handleAddShoppingItem = (item) => {
    if (!item?.name?.trim()) return;
    const itemWithHouse = {
      ...item,
      householdId: item.householdId || activeHouse?.id || 'house-1',
      householdName: item.householdName || activeHouse?.name || 'Casa México',
      currency: activeHouse?.currency || 'MXN',
      id: item.id || crypto.randomUUID(),
      name: item.name.trim(),
      quantity: positiveQuantity(item.quantity),
      unit: item.unit || 'piezas',
      checked: Boolean(item.checked),
      estimatedPriceMxn: Math.max(0, Number(item.estimatedPriceMxn) || 0),
    };

    setShoppingList((prev) => {
      const existingIdx = prev.findIndex(
        (i) => sameStockItem(i, itemWithHouse)
      );

      if (existingIdx >= 0) {
        // Consolidar insumo existente sumando su cantidad
        const updated = [...prev];
        const existing = updated[existingIdx];
        const newQty = parseFloat(((parseFloat(existing.quantity) || 0) + (parseFloat(itemWithHouse.quantity) || 1)).toFixed(2));
        const merged = {
          ...existing,
          quantity: newQty,
          store: itemWithHouse.store || existing.store,
          estimatedPriceMxn: itemWithHouse.estimatedPriceMxn > 0 ? itemWithHouse.estimatedPriceMxn : existing.estimatedPriceMxn,
          targetZone: itemWithHouse.targetZone || existing.targetZone,
          checked: false, // desmarcar para comprar de nuevo
        };
        updated[existingIdx] = merged;
        saveShoppingItemToCloud(merged);
        return deduplicateShoppingItems(updated);
      }

      saveShoppingItemToCloud(itemWithHouse);
      return deduplicateShoppingItems([itemWithHouse, ...prev]);
    });
  };

  const handleDeduplicateShoppingList = () => {
    const clean = deduplicateShoppingItems(shoppingList);
    const ids = new Set(clean.map((i) => i.id));
    shoppingList.filter((i) => !ids.has(i.id)).forEach((i) => deleteShoppingItemFromCloud(i.id));
    clean.forEach(saveShoppingItemToCloud);
    setShoppingList(clean);
    notify(clean.length < shoppingList.length ? 'Se combinaron los productos repetidos de la misma casa y unidad.' : 'Tu lista no tiene productos repetidos.');
  };

  const handleClearCheckedShoppingItems = () => {
    const removed = shoppingList.filter((i) => i.checked && belongsToHouse(i, activeHouse.id));
    removed.forEach((i) => deleteShoppingItemFromCloud(i.id));
    const ids = new Set(removed.map((i) => i.id));
    setShoppingList((prev) => prev.filter((i) => !ids.has(i.id)));
    audio.click();
  };

  const handleClearAllShoppingItems = async () => {
    if (await confirmDialog('¿Deseas vaciar por completo la lista de compras?')) {
      shoppingList.filter((i) => belongsToHouse(i, activeHouse.id)).forEach((i) => deleteShoppingItemFromCloud(i.id));
      setShoppingList((prev) => prev.filter((i) => !belongsToHouse(i, activeHouse.id)));
      audio.click();
    }
  };

  const handleUndoPurchasedItem = (receiptId, item) => {
    const receipt = purchaseHistory.find((r) => r.id === receiptId);
    const recorded = receipt?.items.find((i) => i.id === item.id && i.name === item.name);
    if (!recorded || recorded.reversed || !belongsToHouse(receipt, activeHouse.id)) return;
    const target = products.find((p) => sameStockItem(p, { ...item, householdId: activeHouse.id }));
    if (!target || target.quantity < item.quantity) {
      notify('No hay suficiente existencia para devolver esta cantidad. Revisa si ya se consumió parte de la compra.'); return;
    }
    const updated = { ...target, quantity: Math.round((target.quantity - item.quantity) * 1000) / 1000, updatedAt: new Date().toISOString() };
    const updatedReceipt = { ...receipt, items: receipt.items.map((i) => i.id === item.id && i.name === item.name ? { ...i, reversed: true } : i) };
    savePurchaseTransaction([{ product: updated, delta: -Number(item.quantity) }], { removedIds: [], updated: [] }, updatedReceipt);
    setProducts((prev) => prev.map((p) => p.id === target.id ? updated : p));
    setPurchaseHistory((prev) => prev.map((r) => r.id === receiptId ? { ...r, items: r.items.map((i) => i.id === item.id && i.name === item.name ? { ...i, reversed: true } : i) } : r));
    addAuditEntry('Administrador General', 'DEVOLUCION_COMPRA', 'Devolvió ' + item.quantity + ' ' + item.unit + ' de ' + item.name);
  };

  const handleAutoGenerateShoppingList = () => {
    const low = products.filter((p) => belongsToHouse(p, activeHouse.id) && Number(p.quantity || 0) <= Number(p.minStock || 0));
    const additions = low.filter((p) => !shoppingList.some((i) => sameStockItem(i, p)));
    additions.forEach((p) => handleAddShoppingItem({
      name: p.name, barcode: p.barcode || '', unit: p.unit,
      quantity: Math.max(0.01, (p.idealStock ?? 5) - (p.quantity || 0)),
      store: p.store || 'Supermercado', estimatedPriceMxn: p.unitPriceMxn || 0,
      targetZone: p.zone || zones[0]?.name || 'Alacena Principal', checked: false,
    }));
    notify(additions.length ? 'Se agregaron ' + additions.length + ' artículos que faltan en esta casa.' : low.length ? 'Los faltantes ya están en tu lista.' : 'La despensa de esta casa tiene suficiente stock.');
  };

  const handleCompletePurchaseToPantry = (purchasePayload) => {
    if (purchasePayload?.receiptFingerprint && purchaseHistory.some((r) => r.receiptFingerprint === purchasePayload.receiptFingerprint && belongsToHouse(r, activeHouse.id))) { setOperationNotice('Este ticket ya está registrado. Revisa tu historial para evitar duplicarlo.'); return false; }
    const summary = purchaseSummary(purchasePayload);
    const checkedItems = summary.items.map((i) => ({ ...i, householdId: i.householdId || activeHouse.id })).filter((i) => belongsToHouse(i, activeHouse.id));
    if (!checkedItems.length || checkedItems.some((i) => !i.name?.trim() || !Number.isFinite(Number(i.quantity)) || Number(i.quantity) <= 0)) { setOperationNotice('Revisa los nombres y cantidades de la compra.'); return false; }
    const buyer = summary.buyer;
    const notes = summary.notes;
    const totalEstimatedPurchasedMxn = purchaseSummary(checkedItems).estimated;
    const realTotalPurchased = summary.total;

    if (checkedItems.length > 150) { setOperationNotice('Revisa esta compra en grupos de hasta 150 artículos.'); return false; }
    const productWrites = [];
    let shoppingChanges;
    // Transferir al inventario
    {
      let currentList = [...products];

      checkedItems.forEach((purchased) => {
        const existingIdx = currentList.findIndex(
          (p) => sameStockItem(p, { ...purchased, householdId: activeHouse.id })
        );




        if (existingIdx >= 0) {
          const existing = currentList[existingIdx];
          const newQty = parseFloat((Number(existing.quantity || 0) + Number(purchased.quantity || 1)).toFixed(3));
          const unitPrice = (purchased.realPrice || purchased.estimatedPriceMxn || 0) > 0 ? (purchased.realPrice || purchased.estimatedPriceMxn) : existing.unitPriceMxn;
          const merged = {
            ...existing,
            quantity: newQty,
            unitPriceMxn: unitPrice,
            lastLoggedBy: buyer,
            updatedAt: new Date().toISOString(),
          };
          currentList[existingIdx] = merged;
          productWrites.push({ product: merged, delta: Number(purchased.quantity || 1) });
          learnProduct(merged);
        } else {
          const newProd = sanitizeCavaProduct({
            id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: purchased.name,
            zone: purchased.targetZone || purchased.zone || zones[0]?.name || 'Alacena Principal',
            category: purchased.category || purchased.department || 'Abarrotes',
            quantity: purchased.quantity || 1,
            unit: purchased.unit || 'kg',
            minStock: 2,
            idealStock: 5,
            unitPriceMxn: purchased.realPrice || purchased.estimatedPriceMxn || 0,
            store: purchased.store || 'Supermercado',
            barcode: purchased.barcode || `ALC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
            householdId: activeHouse?.id || 'house-1',
            householdName: activeHouse?.name || 'Casa México',
            lastLoggedBy: `${buyer} (Recepción Compra)`,
            updatedAt: new Date().toISOString(),
          }, zones);
          currentList.unshift(newProd);
          productWrites.push({ product: newProd });
          learnProduct(newProd);
        }
      });

      const sanitizedList = sanitizeAllInventory(deduplicateInventoryProducts(currentList), zones);
      syncPantryToIndexedDb(sanitizedList);
      setProducts(sanitizedList);
    }

    // A receipt may satisfy only part of an outstanding quantity.
    if (purchasePayload?.source === 'receipt') {
      const match = reconcileReceiptList(shoppingList, checkedItems, activeHouse.id);
      shoppingChanges = match;
      setShoppingList(match.remaining);
    } else {
      const checkedIds = new Set(checkedItems.map((i) => i.id));
      shoppingChanges = { removedIds: checkedItems.map((i) => i.id), updated: [] };
      setShoppingList((prev) => prev.filter((i) => !checkedIds.has(i.id)));
    }

    const finalRecordedTotal = realTotalPurchased !== null ? realTotalPurchased : totalEstimatedPurchasedMxn;

    // Guardar en historial de compras para devoluciones o anulaciones
    const newReceipt = {
      id: purchasePayload?.receiptFingerprint ? `${activeHouse.id}-${purchasePayload.receiptFingerprint}` : crypto.randomUUID(),
      date: new Date().toISOString(),
      items: checkedItems.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity || 1,
        unit: i.unit || 'piezas',
        store: i.store || 'Supermercado',
        estimatedPriceMxn: i.realPrice || i.estimatedPriceMxn || 0,
        zone: i.targetZone || 'Alacena Principal',
        reversed: false,
      })),
      receiptFingerprint: purchasePayload?.receiptFingerprint || null,
      source: purchasePayload?.source || 'shopping',
      totalMxn: finalRecordedTotal,
      estimatedMxn: totalEstimatedPurchasedMxn,
      buyer,
      notes,
      householdId: activeHouse.id,
      currency: activeHouse.currency || 'MXN',
    };
    setPurchaseHistory((prev) => [newReceipt, ...prev.slice(0, 29)]);
    savePurchaseTransaction(productWrites, shoppingChanges, newReceipt);

    // Registrar precios en el motor de inteligencia multitienda
    recordPricePoints(checkedItems.map((i) => ({ ...i, currency: activeHouse.currency || 'MXN' })), checkedItems[0]?.store || 'Supermercado', newReceipt.date, notes);

    // Registrar en auditoría
    addAuditEntry(
      buyer,
      'INGRESO_COMPRA_SUPER',
      `Ingresó compra de ${checkedItems.length} artículos a la residencia por ${buyer}`,
      `Importe cobrado en ticket: $${finalRecordedTotal.toFixed(2)} MXN (Estimado: $${totalEstimatedPurchasedMxn.toFixed(2)} MXN)${notes ? ` · Notas: ${notes}` : ''}`
    );

    setActiveTab('inventory');
  };

  // Ingreso masivo al inventario desde Tickets (Foto, PDF, o importación OCR)
  const handleBatchAddToInventory = (itemsToAdd, storeName = 'Supermercado', buyer = 'Administrador General') => {
    if (!itemsToAdd || itemsToAdd.length === 0) return;

    let totalRecordedMxn = 0;
    let addedCount = 0;
    let updatedCount = 0;

    {
      let currentList = [...products];

      itemsToAdd.forEach((item) => {
        const itemQty = parseFloat(item.quantity) || 1;
        const itemPrice = parseFloat(item.realPrice || item.estimatedPriceMxn || item.unitPriceMxn || item.price) || 0;
        totalRecordedMxn += itemQty * itemPrice;

        const existingIdx = currentList.findIndex(
          (p) => sameStockItem(p, { ...item, householdId: activeHouse.id })
        );

        if (existingIdx >= 0) {
          const existing = currentList[existingIdx];
          const newQty = parseFloat((Number(existing.quantity || 0) + itemQty).toFixed(3));
          const merged = {
            ...existing,
            quantity: newQty,
            unitPriceMxn: itemPrice > 0 ? itemPrice : existing.unitPriceMxn,
            lastLoggedBy: buyer,
            updatedAt: new Date().toISOString(),
          };
          currentList[existingIdx] = merged;
          saveProductToCloud(merged);
          learnProduct(merged);
          updatedCount++;
        } else {
          const newProd = sanitizeCavaProduct({
            id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            name: item.name,
            category: item.category || item.department || 'Abarrotes',
            unit: item.unit || 'piezas',
            quantity: itemQty,
            minStock: 2,
            idealStock: 5,
            unitPriceMxn: itemPrice,
            zone: item.targetZone || item.zone || zones[0]?.name || 'Alacena Principal',
            store: item.store || storeName || 'Supermercado',
            barcode: item.barcode || `ALC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
            photo: item.photo || null,
            isWine: Boolean(item.isWine),
            householdId: activeHouse?.id || 'house-1',
            householdName: activeHouse?.name || 'Casa México',
            lastLoggedBy: buyer,
            updatedAt: new Date().toISOString(),
          }, zones);
          currentList.unshift(newProd);
          saveProductToCloud(newProd);
          learnProduct(newProd);
          addedCount++;
        }
      });

      const sanitizedList = sanitizeAllInventory(deduplicateInventoryProducts(currentList), zones);
      syncPantryToIndexedDb(sanitizedList);
      setProducts(sanitizedList);
    }

    recordPricePoints(itemsToAdd, storeName);

    addAuditEntry(
      buyer,
      'INGRESO_TICKET_DESPENSA',
      `Ingresó ${itemsToAdd.length} artículos a la Despensa (${addedCount} nuevos, ${updatedCount} actualizados) desde ticket (${storeName})`,
      `Total registrado en ticket: $${totalRecordedMxn.toFixed(2)} MXN`
    );

    setActiveTab('inventory');
  };

  // Direct scanner add & subtract
  const handleAddStockDirect = (productOrId, amount = 1, targetZone = null) => {
    const isObj = typeof productOrId === 'object' && productOrId !== null;
    if (isObj && (productOrId.realPrice || productOrId.estimatedPriceMxn || productOrId.price || productOrId.unitPriceMxn)) {
      recordPricePoints([productOrId], productOrId.store || 'Supermercado');
    }
    const searchId = isObj ? (productOrId.id || productOrId.barcode) : productOrId;
    const prod = products.find((p) => belongsToHouse(p, activeHouse.id) && (
      (searchId && (p.id === searchId || (p.barcode && p.barcode === searchId))) ||
      (isObj && p.name && productOrId.name && areItemsEquivalent(p.name, productOrId.name))
    ));

    if (prod) {
      const newQty = Number(prod.quantity || 0) + Number(amount);
      const effectivePrice = isObj && (productOrId.realPrice || productOrId.estimatedPriceMxn || productOrId.price || productOrId.unitPriceMxn)
        ? (productOrId.realPrice || productOrId.estimatedPriceMxn || productOrId.price || productOrId.unitPriceMxn)
        : prod.unitPriceMxn;

      if (targetZone && targetZone !== prod.zone) {
        const updated = sanitizeCavaProduct({
          ...prod,
          quantity: newQty,
          unitPriceMxn: effectivePrice,
          zone: targetZone,
          updatedAt: new Date().toISOString()
        }, zones);
        setProducts((prev) => prev.map((p) => (p.id === prod.id ? updated : p)));
        saveProductToCloud(updated);
      } else {
        handleUpdateQuantity(prod.id, newQty);
      }
      addAuditEntry(
        'Administrador / Compras',
        'INGRESO_DIRECTO',
        `Ingresó +${amount} ${prod.unit} de "${prod.name}" a ${targetZone || prod.zone}`,
        `Stock total: ${newQty} ${prod.unit}`
      );
    } else if (isObj || productOrId) {
      // Es un artículo nuevo descubierto por escáner o ticket
      const newProductObj = sanitizeCavaProduct({
        id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: isObj ? productOrId.name : `Artículo ${searchId}`,
        category: (isObj && (productOrId.category || productOrId.department)) ? (productOrId.category || productOrId.department) : 'Abarrotes',
        unit: (isObj && productOrId.unit) ? productOrId.unit : 'piezas',
        quantity: amount,
        minStock: 2,
        idealStock: 5,
        unitPriceMxn: (isObj && (productOrId.realPrice || productOrId.estimatedPriceMxn || productOrId.price || productOrId.unitPriceMxn)) ? (productOrId.realPrice || productOrId.estimatedPriceMxn || productOrId.price || productOrId.unitPriceMxn) : 0,
        zone: targetZone || (isObj && (productOrId.zone || productOrId.targetZone)) || zones[0]?.name || 'Alacena Principal',
        store: (isObj && productOrId.store) || 'Supermercado',
        barcode: (isObj && productOrId.barcode) ? productOrId.barcode : (typeof searchId === 'string' && searchId.startsWith('ALC') ? searchId : `ALC-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`),
        photo: isObj ? productOrId.photo : null,
        isWine: isObj ? Boolean(productOrId.isWine) : false,
        householdId: activeHouse?.id || 'house-1',
        householdName: activeHouse?.name || 'Casa México',
        updatedAt: new Date().toISOString(),
      }, zones);

      setProducts((prev) => {
        const next = [newProductObj, ...prev];
        syncPantryToIndexedDb(next);
        return next;
      });
      saveProductToCloud(newProductObj);
      learnProduct(newProductObj);

      addAuditEntry(
        'Administrador / Escáner',
        'ALTA_PRODUCTO_ESCANEO',
        `Registró nuevo insumo "${newProductObj.name}" vía escáner/código (+${amount})`,
        `Ubicado en ${newProductObj.zone}`
      );
    }
  };

  const handleSubtractStockDirect = (productId, amount = 1) => {
    const existing = products.find((p) => p.id === productId && belongsToHouse(p, activeHouse.id));
    if (!existing || Number(amount) <= 0 || Number(amount) > Number(existing.quantity)) {
      setOperationNotice('No hay suficiente existencia para registrar ese consumo.'); return false;
    }
    return handleUpdateQuantity(productId, Number(existing.quantity) - Number(amount), 'Escáner QR / barras');
  };

  const handleAddToShoppingListFromScan = (product, amount) => {
    handleAddShoppingItem({
      id: `shop-${Date.now()}`,
      name: product.name,
      quantity: amount || 1,
      unit: product.unit || 'kg',
      store: product.store || 'Supermercado',
      estimatedPriceMxn: product.unitPriceMxn || product.price || 0,
      targetZone: product.zone || 'Alacena Principal',
      checked: false,
    });
    notify(`✅ "${product.name}" agregado a tu Lista de Compras.`);
  };

  const handleOpenManualCaptureWithBarcode = (barcodeData) => {
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: barcodeData.name || '',
      category: barcodeData.category || 'Abarrotes',
      unit: barcodeData.unit || 'kg',
      unitPriceMxn: barcodeData.price || 0,
      zone: barcodeData.zone || zones[0]?.name || 'Alacena Principal',
      barcode: barcodeData.barcode,
    });
    setIsManualModalOpen(true);
  };

  // Zone actions
  const handleSaveZone = (zoneData) => {
    setZones((prev) => {
      const exists = prev.find((z) => z.id === zoneData.id);
      if (exists) {
        if (exists.name !== zoneData.name) {
          setProducts((currentProds) =>
            currentProds.map((p) => (p.zone === exists.name ? { ...p, zone: zoneData.name } : p))
          );
        }
        addAuditEntry(
          'Administrador General',
          'EDICION_ZONA',
          `Renombró zona física a "${zoneData.name}"`,
          zoneData.tempNotes
        );
        return prev.map((z) => (z.id === zoneData.id ? zoneData : z));
      } else {
        addAuditEntry(
          'Administrador General',
          'CREACION_ZONA',
          `Creó nueva zona física "${zoneData.name}"`,
          zoneData.tempNotes
        );
        return [...prev, zoneData];
      }
    });
    setEditingZone(null);
  };

  const handleDeleteZone = (zoneId) => {
    const target = zones.find((z) => z.id === zoneId);
    if (target) {
      addAuditEntry(
        'Administrador General',
        'ELIMINACION_ZONA',
        `Eliminó la zona física "${target.name}"`
      );
    }
    setZones((prev) => prev.filter((z) => z.id !== zoneId));
  };

  // Recipe actions
  const handleCookRecipe = (recipe, staffName) => {
    setProducts((prev) =>
      prev.map((product) => {
        const requiredIng = recipe.ingredients.find(
          (ing) => ing.productName.toLowerCase() === product.name.toLowerCase()
        );
        if (requiredIng) {
          const newQty = Math.max(0, (product.quantity || 0) - requiredIng.amount);
          return { ...product, quantity: newQty, updatedAt: new Date().toISOString() };
        }
        return product;
      })
    );

    const ingSummary = recipe.ingredients
      .map((i) => `${i.amount} ${i.unit} de ${i.productName}`)
      .join(', ');

    addAuditEntry(
      staffName,
      'CONSUMO_RECETA',
      `${staffName} consumió: ${ingSummary} para preparar "${recipe.name}"`,
      `Porciones preparadas: ${recipe.portions}`
    );
  };

  const handleCreateRecipe = (newRecipe) => {
    setRecipes((prev) => [newRecipe, ...prev]);
    addAuditEntry(
      'Chef Carlos (Parrilla & Cava)',
      'ALTA_RECETA',
      `Creó nueva receta "${newRecipe.name}" con ${newRecipe.ingredients.length} ingredientes`
    );
  };

  // Backup Export
  const handleExportBackupJson = () => {
    const backup = {
      app: 'ALACENA_ENTERPRISE_CAVAPRO',
      version: 'v2.4.0-Titanium-Nova',
      exportDate: new Date().toISOString(),
      household: activeHouse,
      products,
      shoppingList,
      zones,
      recipes,
      auditLogs,
      purchaseHistory,
      households,
      activeHouse,
      beforeCloudConnection: readLocalState('alacena_before_cloud_connection', {}),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alacena-cavapro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('💾 Copia de seguridad descargada exitosamente en formato JSON.');
  };

  // Reset demo data
  const handleResetDemoData = async () => {
    if (await confirmDialog('¿Deseas restaurar los datos de demostración con precios en MXN?')) {
      setProducts(INITIAL_PRODUCTS);
      setShoppingList(INITIAL_SHOPPING_LIST);
      setZones(INITIAL_ZONES);
      setRecipes(INITIAL_RECIPES);
      setHouseholds(INITIAL_HOUSEHOLDS);
      setActiveHouse(INITIAL_HOUSEHOLDS[0]);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      audio.success();
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base,#090B0E)] text-[var(--ink-primary,#F8FAFC)] flex flex-col font-body selection:bg-emerald-500/30 selection:text-white transition-colors duration-200">

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeHouse={activeHouse}
        onOpenHouseModal={() => setIsHouseModalOpen(true)}
        onOpenChangelog={() => setIsChangelogOpen(true)}
        onResetDemoData={handleResetDemoData}
        onOpenScanner={handleOpenScanner}
        onOpenCommandCenter={() => setIsCommandCenterOpen(true)}
        onOpenQrBooklet={() => setIsQrBookletOpen(true)}
        shoppingCount={shoppingList.filter((i) => !i.checked && belongsToHouse(i, activeHouse.id)).length}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isOnline={isOnline}
        zones={zones}
        products={products.filter((p) => belongsToHouse(p, activeHouse.id))}
        shoppingList={shoppingList.filter((i) => belongsToHouse(i, activeHouse.id))}
        recipes={recipes}
      />

      <CloudStatus state={cloudState} isOnline={isOnline} />
      <OfflineStatus />
      {operationNotice && <div role="status" className="mx-auto w-full max-w-7xl px-4 pt-3 text-sm text-emerald-400 flex justify-between gap-3"><span>{operationNotice}</span><button onClick={() => setOperationNotice('')} aria-label="Cerrar aviso">×</button></div>}
      {storageError && <div role="alert" className="mx-4 p-4 rounded-xl bg-rose-950 text-white">No se pudo guardar en este dispositivo. Descarga un respaldo desde Más antes de cerrar la página.</div>}
      <Suspense fallback={<div role="status" className="p-12 text-center">Preparando tu alacena…</div>}>
      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">

        {/* Tab 1: Inventario & Zonas */}
        {activeTab === 'inventory' && (
          <InventoryView
            products={products.filter((p) => belongsToHouse(p, activeHouse.id))}
            zones={zones}
            onOpenManualModal={() => {
              setEditingProduct(null);
              setIsManualModalOpen(true);
            }}
            onEditProduct={(prod) => {
              setEditingProduct(prod);
              setIsManualModalOpen(true);
            }}
            onDeleteProduct={handleDeleteProduct}
            onUpdateQuantity={handleUpdateQuantity}
            onOpenWineTasting={handleOpenWineTasting}
            onEditZone={(zone) => {
              setEditingZone(zone);
              setIsZoneModalOpen(true);
            }}
            onAddZone={() => {
              setEditingZone(null);
              setIsZoneModalOpen(true);
            }}
            onOpenShoppingTab={() => setActiveTab('shopping')}
            onOpenRecipesTab={() => setActiveTab('recipes')}
            onAddToShoppingList={handleAddShoppingItem}
            recipes={recipes}
            auditLogs={auditLogs.filter((r) => belongsToHouse(r, activeHouse.id))}
            activeHouse={activeHouse}
            onOpenScanner={handleOpenScanner}
          />
        )}

        {/* Tab 2: Lista de Compras (Modo Súper Interactivo con QR) */}
        {activeTab === 'shopping' && (
          <ShoppingListView
            shoppingList={shoppingList.filter((i) => belongsToHouse(i, activeHouse.id))}
            products={products.filter((p) => belongsToHouse(p, activeHouse.id))}
            zones={zones}
            activeHouse={activeHouse}
            onToggleItem={handleToggleShoppingItem}
            onRemoveItem={handleRemoveShoppingItem}
            onAddItem={handleAddShoppingItem}
            onUpdateItemQuantity={handleUpdateShoppingItemQuantity}
            onAutoGenerateFromPantry={handleAutoGenerateShoppingList}
            onCompletePurchaseToPantry={handleCompletePurchaseToPantry}
            onOpenScanner={handleOpenScanner}
            onDeduplicateList={handleDeduplicateShoppingList}
            onClearChecked={handleClearCheckedShoppingItems}
            onClearAll={handleClearAllShoppingItems}
            onOpenPurchaseHistory={() => setIsPurchaseHistoryOpen(true)}
            purchaseHistoryCount={purchaseHistory.filter((r) => belongsToHouse(r, activeHouse.id)).length}
          />
        )}

        {/* Tab 3: Recetas de Cocina */}
        {activeTab === 'recipes' && (
          <RecipesView
            recipes={recipes}
            products={products.filter((p) => belongsToHouse(p, activeHouse.id))}
            staffList={staffList}
            onCookRecipe={handleCookRecipe}
            onCreateRecipe={handleCreateRecipe}
            onAddMissingToShoppingList={(missingItems) => {
              missingItems.forEach((item) => {
                const deficit = Math.max(1, (item.required || 1) - (item.available || 0));
                handleAddShoppingItem({
                  id: `shop-${Date.now()}-${item.name}`,
                  name: item.name,
                  quantity: deficit,
                  unit: item.unit || 'kg',
                  department: 'ABARROTES',
                  store: 'Supermercado',
                  estimatedPriceMxn: 0,
                  targetZone: 'Alacena Principal',
                  checked: false,
                });
              });
              setActiveTab('shopping');
            }}
          />
        )}

        {/* Tab 4: Bitácora Forense */}
        {activeTab === 'audit' && (
          <AuditTrailView logs={auditLogs} />
        )}
      </main>

      {/* Modals */}
      {isManualModalOpen && (<ManualProductModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        zones={zones}
        staffList={staffList}
        initialProduct={editingProduct}
        activeHouse={activeHouse}
      />
      )}

      {isAddWineOpen && (<AddWineModal
        isOpen={isAddWineOpen}
        onClose={() => setIsAddWineOpen(false)}
        onSave={handleSaveProduct}
        zones={zones}
      />
      )}

      {isWineTastingOpen && (<WineTastingModal
        isOpen={isWineTastingOpen}
        onClose={() => setIsWineTastingOpen(false)}
        wine={selectedWineForTasting}
        onSaveRating={handleSaveWineRating}
        onUncorkBottle={handleUncorkWine}
      />
      )}

      {isCommandCenterOpen && (<CavaProCommandCenterModal
        isOpen={isCommandCenterOpen}
        onClose={() => setIsCommandCenterOpen(false)}
        onOpenAddProduct={() => {
          setEditingProduct(null);
          setIsManualModalOpen(true);
        }}
        onOpenAddWine={() => setIsAddWineOpen(true)}
        onOpenScanner={handleOpenScanner}
        onAutoGenerateShopping={handleAutoGenerateShoppingList}
        onOpenShoppingTab={() => setActiveTab('shopping')}
        onOpenInventoryTab={() => setActiveTab('inventory')}
        onOpenRecipesTab={() => setActiveTab('recipes')}
        onOpenAuditTab={() => setActiveTab('audit')}
        onExportBackupJson={handleExportBackupJson}
        onResetDemoData={handleResetDemoData}
        onOpenChangelog={() => setIsChangelogOpen(true)}
        onToggleMute={handleToggleMute}
        isMuted={isMuted}
        lowStockCount={products.filter((p) => (p.quantity || 0) <= (p.minStock || 0)).length}
      />
      )}

      {isScannerOpen && (<CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products.filter((p) => belongsToHouse(p, activeHouse.id))}
        zones={zones}
        onAddStockDirect={handleAddStockDirect}
        onBatchAddToInventory={handleBatchAddToInventory}
        onConfirmReceipt={handleCompletePurchaseToPantry}
        shoppingList={shoppingList.filter((i) => belongsToHouse(i, activeHouse.id))}
        currency={activeHouse.currency || 'MXN'}
        onSubtractStockDirect={handleSubtractStockDirect}
        onAddToShoppingList={handleAddShoppingItem}
        onOpenManualCaptureWithBarcode={handleOpenManualCaptureWithBarcode}
        onEditZone={(zone) => {
          setEditingZone(zone);
          setIsZoneModalOpen(true);
        }}
        onAddZone={() => {
          setEditingZone(null);
          setIsZoneModalOpen(true);
        }}
      />
      )}

      {isZoneModalOpen && (<ZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        onSave={handleSaveZone}
        onDelete={handleDeleteZone}
        initialZone={editingZone}
      />
      )}

      {isHouseModalOpen && (<HouseholdsModal
        isOpen={isHouseModalOpen}
        onClose={() => setIsHouseModalOpen(false)}
        households={households}
        activeHouse={activeHouse}
        onSelectHouse={setActiveHouse}
        onAddHouse={(h) => setHouseholds((prev) => [...prev, h])}
      />
      )}

      {isChangelogOpen && (<ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />
      )}

      {/* Modal de Historial de Compras y Devoluciones */}
      {isPurchaseHistoryOpen && (<PurchaseHistoryModal
        isOpen={isPurchaseHistoryOpen}
        onClose={() => setIsPurchaseHistoryOpen(false)}
        purchases={purchaseHistory.filter((r) => belongsToHouse(r, activeHouse.id))}
        onUndoPurchasedItem={handleUndoPurchasedItem}
      />
      )}

      {/* Modal de Acción Rápida por Escaneo QR o Toque NFC */}
      {isQuickScanOpen && (<QuickScanActionModal
        isOpen={isQuickScanOpen}
        onClose={() => {
          setIsQuickScanOpen(false);
          setQuickScanProduct(null);
        }}
        product={quickScanProduct}
        onUpdateQuantity={handleUpdateQuantity}
        onAddToShoppingList={handleAddToShoppingListFromScan}
        onOpenWineTasting={handleOpenWineTasting}
      />
      )}

      {/* Catálogo Imprimible de QR, Stickers para Frascos y Tuppers */}
      {isQrBookletOpen && (<PantryQrBookletModal
        isOpen={isQrBookletOpen}
        onClose={() => setIsQrBookletOpen(false)}
        products={products.filter((p) => belongsToHouse(p, activeHouse.id))}
        zones={zones}
        activeHouse={activeHouse}
        onQuickAddToShoppingList={handleAddShoppingItem}
      />
      )}

      {/* Barra de Navegación Ergonómica para Dispositivos Móviles */}
      </Suspense>
      <BottomNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        shoppingCount={shoppingList.filter((i) => !i.checked && belongsToHouse(i, activeHouse.id)).length}
        onOpenScanner={handleOpenScanner}
        onOpenCommandCenter={() => setIsCommandCenterOpen(true)}
      />
      <NoticeHost />

    </div>
  );
}
