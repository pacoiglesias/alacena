import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import InventoryView from './components/inventory/InventoryView';
import ManualProductModal from './components/inventory/ManualProductModal';
import ShoppingListView from './components/shopping/ShoppingListView';
import RecipesView from './components/recipes/RecipesView';
import AuditTrailView from './components/audit/AuditTrailView';
import CameraScannerModal from './components/scanner/CameraScannerModal';
import AddWineModal from './components/sommelier/AddWineModal';
import WineTastingModal from './components/sommelier/WineTastingModal';
import CavaProCommandCenterModal from './components/layout/CavaProCommandCenterModal';
import ZoneModal from './components/zones/ZoneModal';
import HouseholdsModal from './components/households/HouseholdsModal';
import ChangelogModal from './components/changelog/ChangelogModal';
import PurchaseHistoryModal from './components/shopping/PurchaseHistoryModal';
import QuickScanActionModal from './components/scanner/QuickScanActionModal';
import PantryQrBookletModal from './components/shopping/PantryQrBookletModal';
import { audio } from './services/audioService';
import { syncPantryToIndexedDb } from './services/db';
import { findProductByScanCode, extractCodeFromScan } from './utils/scanHelper';
import { 
  subscribeToProducts, 
  saveProductToCloud, 
  deleteProductFromCloud, 
  subscribeToShoppingList, 
  saveShoppingItemToCloud, 
  deleteShoppingItemFromCloud, 
  logAuditEventToCloud, 
  subscribeToAuditLogs,
  seedCloudIfEmpty
} from './services/firestoreSyncService';
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
    const saved = localStorage.getItem('alacena_products');
    return saved ? deduplicateInventoryProducts(JSON.parse(saved)) : INITIAL_PRODUCTS;
  });

  const [shoppingList, setShoppingList] = useState(() => {
    const saved = localStorage.getItem('alacena_shopping_list');
    return saved ? deduplicateShoppingItems(JSON.parse(saved)) : INITIAL_SHOPPING_LIST;
  });

  const [zones, setZones] = useState(() => {
    const saved = localStorage.getItem('alacena_zones');
    return saved ? JSON.parse(saved) : INITIAL_ZONES;
  });

  const [recipes, setRecipes] = useState(() => {
    const saved = localStorage.getItem('alacena_recipes');
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [households, setHouseholds] = useState(() => {
    const saved = localStorage.getItem('alacena_households');
    return saved ? JSON.parse(saved) : INITIAL_HOUSEHOLDS;
  });

  const [activeHouse, setActiveHouse] = useState(() => {
    const saved = localStorage.getItem('alacena_active_house');
    return saved ? JSON.parse(saved) : INITIAL_HOUSEHOLDS[0];
  });

  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('alacena_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  const [staffList] = useState(INITIAL_STAFF);

  // UI state
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'shopping' | 'recipes' | 'audit'
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCommandCenterOpen, setIsCommandCenterOpen] = useState(false);
  const [isAddWineOpen, setIsAddWineOpen] = useState(false);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [isHouseModalOpen, setIsHouseModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
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
        const { product: found, cleanCode } = findProductByScanCode(products, scanParam);
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
      const saved = localStorage.getItem('alacena_purchase_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('alacena_purchase_history', JSON.stringify(purchaseHistory));
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
    localStorage.setItem('alacena_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('alacena_shopping_list', JSON.stringify(shoppingList));
  }, [shoppingList]);

  useEffect(() => {
    localStorage.setItem('alacena_zones', JSON.stringify(zones));
  }, [zones]);

  useEffect(() => {
    localStorage.setItem('alacena_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem('alacena_households', JSON.stringify(households));
  }, [households]);

  useEffect(() => {
    localStorage.setItem('alacena_active_house', JSON.stringify(activeHouse));
  }, [activeHouse]);

  useEffect(() => {
    localStorage.setItem('alacena_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // IndexedDB Primario (Dexie.js) - Persistencia Offline Real en Segundo Plano
  useEffect(() => {
    syncPantryToIndexedDb(products, shoppingList, recipes, auditLogs);
  }, [products, shoppingList, recipes, auditLogs]);

  // 🌐 Sincronización en Tiempo Real México ⇄ España (Firestore Cloud onSnapshot)
  useEffect(() => {
    // 1. Inicializar semillas si Firestore está vacío
    seedCloudIfEmpty(INITIAL_PRODUCTS, INITIAL_HOUSEHOLDS);

    // 2. Suscribirse a productos del hogar activo (o todos con etiquetado)
    const unsubProducts = subscribeToProducts(null, (cloudProducts) => {
      if (cloudProducts && cloudProducts.length > 0) {
        setProducts(cloudProducts);
      }
    });

    // 3. Suscribirse a la lista del súper
    const unsubShopping = subscribeToShoppingList(null, (cloudShopping) => {
      if (cloudShopping && cloudShopping.length > 0) {
        setShoppingList(cloudShopping);
      }
    });

    // 4. Suscribirse a la bitácora forense de consumo y compras
    const unsubAudit = subscribeToAuditLogs((cloudLogs) => {
      if (cloudLogs && cloudLogs.length > 0) {
        setAuditLogs(cloudLogs);
      }
    });

    return () => {
      unsubProducts();
      unsubShopping();
      unsubAudit();
    };
  }, []);

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
      id: `log-${Date.now()}`,
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
    const itemWithHouse = {
      ...productData,
      householdId: productData.householdId || activeHouse?.id || 'house-1',
      householdName: productData.householdName || activeHouse?.name || 'Casa México',
    };

    setProducts((prev) => {
      const exists = prev.find((p) => p.id === itemWithHouse.id);
      if (exists) {
        addAuditEntry(
          itemWithHouse.lastLoggedBy,
          'MODIFICACION_ARTICULO',
          `Modificó datos de ${itemWithHouse.name} en ${itemWithHouse.zone}`,
          `Cantidad: ${itemWithHouse.quantity} ${itemWithHouse.unit}`
        );
        saveProductToCloud(itemWithHouse);
        return prev.map((p) => (p.id === itemWithHouse.id ? itemWithHouse : p));
      } else {
        // Verificar si ya existe un insumo equivalente para evitar registros duplicados
        const duplicateIdx = prev.findIndex((p) => 
          areItemsEquivalent(p.name, itemWithHouse.name) || 
          (p.barcode && itemWithHouse.barcode && p.barcode === itemWithHouse.barcode)
        );

        if (duplicateIdx >= 0) {
          const existing = prev[duplicateIdx];
          const newQty = parseFloat(((existing.quantity || 0) + (itemWithHouse.quantity || 0)).toFixed(2));
          addAuditEntry(
            itemWithHouse.lastLoggedBy,
            'CONSOLIDACION_ARTICULO',
            `Consolidó +${itemWithHouse.quantity} ${itemWithHouse.unit} en insumo existente "${existing.name}" (Total: ${newQty} ${existing.unit})`,
            `Evitó registro duplicado en inventario`
          );
          const updated = [...prev];
          const mergedItem = {
            ...existing,
            quantity: newQty,
            minStock: Math.max(existing.minStock || 1, itemWithHouse.minStock || 1),
            idealStock: Math.max(existing.idealStock || 5, itemWithHouse.idealStock || 5),
            unitPriceMxn: itemWithHouse.unitPriceMxn > 0 ? itemWithHouse.unitPriceMxn : existing.unitPriceMxn,
            updatedAt: new Date().toISOString(),
          };
          updated[duplicateIdx] = mergedItem;
          saveProductToCloud(mergedItem);
          return updated;
        }

        addAuditEntry(
          itemWithHouse.lastLoggedBy,
          'ALTA_MANUAL',
          `Registró manualmente ${itemWithHouse.name} (${itemWithHouse.quantity} ${itemWithHouse.unit}) en ${itemWithHouse.zone}`,
          `Costo: ${activeHouse?.currency === 'EUR' ? '€' : '$'}${itemWithHouse.unitPriceMxn.toFixed(2)} ${activeHouse?.currency || 'MXN'}`
        );
        saveProductToCloud(itemWithHouse);
        return [itemWithHouse, ...prev];
      }
    });
    setEditingProduct(null);
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
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === productId);
      if (exists) {
        const delta = newQuantity - (exists.quantity || 0);
        if (delta !== 0) {
          addAuditEntry(
            exists.lastLoggedBy || 'Personal de Cocina',
            delta > 0 ? 'INCREMENTO_STOCK' : 'CONSUMO_STOCK',
            `${delta > 0 ? 'Aumentó' : 'Ajustó/Consumió'} ${Math.abs(delta).toFixed(1)} ${exists.unit} de ${exists.name}${reason ? ` (${reason})` : ''}`,
            `Nuevo stock: ${newQuantity} ${exists.unit}`
          );
        }
        const updatedItem = { ...exists, quantity: newQuantity, updatedAt: new Date().toISOString() };
        saveProductToCloud(updatedItem);
        return prev.map((p) => (p.id === productId ? updatedItem : p));
      } else if (quickScanProduct && quickScanProduct.id === productId) {
        // Guardar producto nuevo descubierto vía escáner
        const newProductObj = {
          ...quickScanProduct,
          id: `prod-${Date.now()}`,
          quantity: newQuantity,
          householdId: activeHouse?.id || 'house-1',
          householdName: activeHouse?.name || 'Casa México',
          updatedAt: new Date().toISOString(),
        };
        addAuditEntry(
          'Administrador / Escáner',
          'ALTA_PRODUCTO_ESCANEO',
          `Registró nuevo insumo "${newProductObj.name}" (${newQuantity} ${newProductObj.unit}) vía QR/NFC`,
          `Ubicación: ${newProductObj.zone}`
        );
        saveProductToCloud(newProductObj);
        return [newProductObj, ...prev];
      }
      return prev;
    });
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
        item.id === itemId ? { ...item, quantity: parseFloat(newQuantity.toFixed(2)) } : item
      );
      const target = updated.find((i) => i.id === itemId);
      if (target) saveShoppingItemToCloud(target);
      return updated;
    });
  };

  // Shopping list actions con DEDUPLICACIÓN Y CONSOLIDACIÓN ESTRICTA
  const handleAddShoppingItem = (item) => {
    const itemWithHouse = {
      ...item,
      householdId: item.householdId || activeHouse?.id || 'house-1',
      householdName: item.householdName || activeHouse?.name || 'Casa México',
      currency: activeHouse?.currency || 'MXN',
    };

    setShoppingList((prev) => {
      const existingIdx = prev.findIndex(
        (i) => areItemsEquivalent(i.name, itemWithHouse.name) || (i.barcode && itemWithHouse.barcode && i.barcode === itemWithHouse.barcode)
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
    setShoppingList((prev) => {
      const deduplicated = deduplicateShoppingItems(prev);
      const mergedCount = prev.length - deduplicated.length;

      if (mergedCount > 0) {
        alert(`🧹 ¡Lista de compras desduplicada con éxito! Se consolidaron ${mergedCount} registros repetidos en ${deduplicated.length} insumos únicos.`);
      } else {
        alert('✨ Tu lista de compras está 100% limpia y sin ningún producto duplicado.');
      }
      return deduplicated;
    });
  };

  const handleClearCheckedShoppingItems = () => {
    setShoppingList((prev) => prev.filter((i) => !i.checked));
    audio.click();
  };

  const handleClearAllShoppingItems = () => {
    if (confirm('¿Deseas vaciar por completo la lista de compras?')) {
      setShoppingList([]);
      audio.click();
    }
  };

  const handleUndoPurchasedItem = (receiptId, item) => {
    // 1. Descontar o eliminar del inventario
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.name.toLowerCase() === item.name.toLowerCase());
      if (idx >= 0) {
        const prod = prev[idx];
        const newQty = (prod.quantity || 0) - (item.quantity || 0);
        if (newQty <= 0) {
          return prev.filter((_, i) => i !== idx);
        } else {
          const updated = [...prev];
          updated[idx] = { ...prod, quantity: newQty, updatedAt: new Date().toISOString() };
          return updated;
        }
      }
      return prev;
    });

    // 2. Marcar como devuelto en el recibo
    setPurchaseHistory((prev) =>
      prev.map((r) => {
        if (r.id === receiptId) {
          return {
            ...r,
            items: r.items.map((it) => (it.name.toLowerCase() === item.name.toLowerCase() ? { ...it, reversed: true } : it)),
          };
        }
        return r;
      })
    );

    // 3. Auditoría
    addAuditEntry(
      'Administrador General',
      'DEVOLUCION_COMPRA',
      `Devolvió/eliminó ${item.quantity} ${item.unit} de "${item.name}" de la alacena`,
      `Insumo comprado por error o devuelto al supermercado`
    );

    audio.success();
    alert(`✅ Insumo "${item.name}" devuelto / descontado del inventario.`);
  };

  const handleAutoGenerateShoppingList = () => {
    // Escanear artículos con stock bajo
    const lowStockItems = products.filter((p) => (p.quantity || 0) <= (p.minStock || 0));
    let addedCount = 0;

    setShoppingList((prev) => {
      const updated = [...prev];
      lowStockItems.forEach((p) => {
        const existingIdx = updated.findIndex((i) => 
          areItemsEquivalent(i.name, p.name) || 
          (i.barcode && p.barcode && i.barcode === p.barcode)
        );
        const deficit = Math.max(1, (p.idealStock || 5) - (p.quantity || 0));

        if (existingIdx >= 0) {
          // Si ya existe, reactivar y asegurar cantidad mínima necesaria
          updated[existingIdx] = {
            ...updated[existingIdx],
            quantity: Math.max(updated[existingIdx].quantity, deficit),
            checked: false,
          };
        } else {
          updated.push({
            id: `shop-${Date.now()}-${Math.random()}`,
            name: p.name,
            quantity: deficit,
            unit: p.unit,
            store: p.store || 'Costco',
            estimatedPriceMxn: p.unitPriceMxn || 0,
            targetZone: p.zone || 'Alacena Principal',
            checked: false,
          });
          addedCount++;
        }
      });
      return deduplicateShoppingItems(updated);
    });

    if (addedCount > 0) {
      alert(`⚡ Se agregaron automáticamente ${addedCount} insumos con stock bajo a la lista de compras.`);
    } else {
      alert('¡Todo tu inventario tiene stock óptimo! No hay insumos por debajo del mínimo.');
    }
  };

  const handleCompletePurchaseToPantry = (purchasePayload) => {
    const isPayloadObj = !Array.isArray(purchasePayload) && purchasePayload?.checkedItems;
    const checkedItems = isPayloadObj ? purchasePayload.checkedItems : purchasePayload;
    const realTotalPurchased = isPayloadObj && purchasePayload.realTotalMxn !== undefined 
      ? purchasePayload.realTotalMxn 
      : null;
    const buyer = isPayloadObj?.buyerName || 'Administrador General';
    const notes = isPayloadObj?.ticketNotes || '';

    let totalEstimatedPurchasedMxn = 0;

    // Transferir al inventario
    setProducts((prev) => {
      let currentList = [...prev];

      checkedItems.forEach((purchased) => {
        const existingIdx = currentList.findIndex(
          (p) => areItemsEquivalent(p.name, purchased.name) || (p.barcode && purchased.barcode && p.barcode === purchased.barcode)
        );

        const cost = (purchased.quantity || 1) * (purchased.estimatedPriceMxn || 0);
        totalEstimatedPurchasedMxn += cost;

        if (existingIdx >= 0) {
          const existing = currentList[existingIdx];
          currentList[existingIdx] = {
            ...existing,
            quantity: parseFloat(((existing.quantity || 0) + (purchased.quantity || 1)).toFixed(2)),
            unitPriceMxn: purchased.estimatedPriceMxn > 0 ? purchased.estimatedPriceMxn : existing.unitPriceMxn,
            lastLoggedBy: buyer,
            updatedAt: new Date().toISOString(),
          };
        } else {
          currentList.unshift({
            id: `prod-${Date.now()}-${Math.random()}`,
            name: purchased.name,
            zone: purchased.targetZone || zones[0]?.name || 'Alacena Principal',
            category: 'Abarrotes',
            quantity: purchased.quantity || 1,
            unit: purchased.unit || 'kg',
            minStock: 2,
            idealStock: 5,
            unitPriceMxn: purchased.estimatedPriceMxn || 0,
            store: purchased.store || 'Supermercado',
            lastLoggedBy: `${buyer} (Recepción Compra)`,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      return deduplicateInventoryProducts(currentList);
    });

    // Limpiar comprados de la lista de compras
    const checkedIds = new Set(checkedItems.map((i) => i.id));
    setShoppingList((prev) => prev.filter((i) => !checkedIds.has(i.id)));

    const finalRecordedTotal = realTotalPurchased !== null ? realTotalPurchased : totalEstimatedPurchasedMxn;

    // Guardar en historial de compras para devoluciones o anulaciones
    const newReceipt = {
      id: `rec-${Date.now()}`,
      date: new Date().toISOString(),
      items: checkedItems.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity || 1,
        unit: i.unit || 'piezas',
        store: i.store || 'Supermercado',
        estimatedPriceMxn: i.estimatedPriceMxn || 0,
        zone: i.targetZone || 'Alacena Principal',
        reversed: false,
      })),
      totalMxn: finalRecordedTotal,
      estimatedMxn: totalEstimatedPurchasedMxn,
      buyer,
      notes,
    };
    setPurchaseHistory((prev) => [newReceipt, ...prev.slice(0, 30)]);

    // Registrar en auditoría
    addAuditEntry(
      buyer,
      'INGRESO_COMPRA_SUPER',
      `Ingresó compra de ${checkedItems.length} artículos a la residencia por ${buyer}`,
      `Importe cobrado en ticket: $${finalRecordedTotal.toFixed(2)} MXN (Estimado: $${totalEstimatedPurchasedMxn.toFixed(2)} MXN)${notes ? ` · Notas: ${notes}` : ''}`
    );

    setActiveTab('inventory');
  };

  // Direct scanner add & subtract
  const handleAddStockDirect = (productOrId, amount = 1, targetZone = null) => {
    const isObj = typeof productOrId === 'object' && productOrId !== null;
    const searchId = isObj ? (productOrId.id || productOrId.barcode) : productOrId;
    const prod = products.find((p) => p.id === searchId || (p.barcode && p.barcode === searchId));

    if (prod) {
      const newQty = (prod.quantity || 0) + amount;
      if (targetZone && targetZone !== prod.zone) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, quantity: newQty, zone: targetZone, updatedAt: new Date().toISOString() } : p))
        );
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
      // Es un artículo nuevo descubierto por escáner de código de barras
      const newProductObj = {
        id: `prod-${Date.now()}`,
        name: isObj ? productOrId.name : `Artículo ${searchId}`,
        category: (isObj && productOrId.category) ? productOrId.category : 'Abarrotes',
        unit: (isObj && productOrId.unit) ? productOrId.unit : 'piezas',
        quantity: amount,
        minStock: 2,
        idealStock: 5,
        unitPriceMxn: (isObj && productOrId.price) ? productOrId.price : 0,
        zone: targetZone || (isObj && productOrId.zone) || zones[0]?.name || 'Alacena Principal',
        store: (isObj && productOrId.store) || 'Supermercado',
        barcode: (isObj && productOrId.barcode) ? productOrId.barcode : String(searchId),
        photo: isObj ? productOrId.photo : null,
        isWine: isObj ? productOrId.isWine : false,
        updatedAt: new Date().toISOString(),
      };
      setProducts((prev) => [newProductObj, ...prev]);
      addAuditEntry(
        'Administrador / Escáner',
        'ALTA_PRODUCTO_ESCANEO',
        `Registró nuevo insumo "${newProductObj.name}" vía código de barras ${newProductObj.barcode} (+${amount})`,
        `Ubicado en ${newProductObj.zone}`
      );
    }
  };

  const handleSubtractStockDirect = (productId, amount = 1) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      const newQty = Math.max(0, (prod.quantity || 0) - amount);
      handleUpdateQuantity(productId, newQty);
      addAuditEntry(
        'Cocinera / Personal',
        'CONSUMO_DIRECTO',
        `Consumo de ${amount} ${prod.unit} de "${prod.name}" vía QR/NFC`,
        `Stock actual restante: ${newQty} ${prod.unit}`
      );
    }
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
    alert(`✅ "${product.name}" agregado a tu Lista de Compras.`);
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
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alacena-cavapro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('💾 Copia de seguridad descargada exitosamente en formato JSON.');
  };

  // Reset demo data
  const handleResetDemoData = () => {
    if (window.confirm('¿Deseas restaurar los datos de demostración con precios en MXN?')) {
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
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenCommandCenter={() => setIsCommandCenterOpen(true)}
        onOpenQrBooklet={() => setIsQrBookletOpen(true)}
        shoppingCount={shoppingList.filter((i) => !i.checked).length}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isOnline={isOnline}
        zones={zones}
        products={products}
        shoppingList={shoppingList}
        recipes={recipes}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Tab 1: Inventario & Zonas */}
        {activeTab === 'inventory' && (
          <InventoryView
            products={products}
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
            auditLogs={auditLogs}
            activeHouse={activeHouse}
          />
        )}

        {/* Tab 2: Lista de Compras (Modo Súper Interactivo con QR) */}
        {activeTab === 'shopping' && (
          <ShoppingListView
            shoppingList={shoppingList}
            products={products}
            zones={zones}
            activeHouse={activeHouse}
            onToggleItem={handleToggleShoppingItem}
            onRemoveItem={handleRemoveShoppingItem}
            onAddItem={handleAddShoppingItem}
            onUpdateItemQuantity={handleUpdateShoppingItemQuantity}
            onAutoGenerateFromPantry={handleAutoGenerateShoppingList}
            onCompletePurchaseToPantry={handleCompletePurchaseToPantry}
            onOpenScanner={() => setIsScannerOpen(true)}
            onDeduplicateList={handleDeduplicateShoppingList}
            onClearChecked={handleClearCheckedShoppingItems}
            onClearAll={handleClearAllShoppingItems}
            onOpenPurchaseHistory={() => setIsPurchaseHistoryOpen(true)}
            purchaseHistoryCount={purchaseHistory.length}
          />
        )}

        {/* Tab 3: Recetas de Cocina */}
        {activeTab === 'recipes' && (
          <RecipesView
            recipes={recipes}
            products={products}
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
      <ManualProductModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSave={handleSaveProduct}
        onDelete={handleDeleteProduct}
        zones={zones}
        staffList={staffList}
        initialProduct={editingProduct}
        activeHouse={activeHouse}
      />

      <AddWineModal
        isOpen={isAddWineOpen}
        onClose={() => setIsAddWineOpen(false)}
        onSave={handleSaveProduct}
        zones={zones}
      />

      <WineTastingModal
        isOpen={isWineTastingOpen}
        onClose={() => setIsWineTastingOpen(false)}
        wine={selectedWineForTasting}
        onSaveRating={handleSaveWineRating}
        onUncorkBottle={handleUncorkWine}
      />

      <CavaProCommandCenterModal
        isOpen={isCommandCenterOpen}
        onClose={() => setIsCommandCenterOpen(false)}
        onOpenAddProduct={() => {
          setEditingProduct(null);
          setIsManualModalOpen(true);
        }}
        onOpenAddWine={() => setIsAddWineOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
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

      <CameraScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        zones={zones}
        onAddStockDirect={handleAddStockDirect}
        onSubtractStockDirect={handleSubtractStockDirect}
        onAddToShoppingList={handleAddToShoppingListFromScan}
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

      <ZoneModal
        isOpen={isZoneModalOpen}
        onClose={() => setIsZoneModalOpen(false)}
        onSave={handleSaveZone}
        onDelete={handleDeleteZone}
        initialZone={editingZone}
      />

      <HouseholdsModal
        isOpen={isHouseModalOpen}
        onClose={() => setIsHouseModalOpen(false)}
        households={households}
        activeHouse={activeHouse}
        onSelectHouse={setActiveHouse}
        onAddHouse={(h) => setHouseholds((prev) => [...prev, h])}
      />

      <ChangelogModal
        isOpen={isChangelogOpen}
        onClose={() => setIsChangelogOpen(false)}
      />

      {/* Modal de Historial de Compras y Devoluciones */}
      <PurchaseHistoryModal
        isOpen={isPurchaseHistoryOpen}
        onClose={() => setIsPurchaseHistoryOpen(false)}
        purchases={purchaseHistory}
        onUndoPurchasedItem={handleUndoPurchasedItem}
      />

      {/* Modal de Acción Rápida por Escaneo QR o Toque NFC */}
      <QuickScanActionModal
        isOpen={isQuickScanOpen}
        onClose={() => {
          setIsQuickScanOpen(false);
          setQuickScanProduct(null);
        }}
        product={quickScanProduct}
        onUpdateQuantity={handleUpdateQuantity}
        onAddToShoppingList={handleAddShoppingItem}
        onOpenWineTasting={handleOpenWineTasting}
      />

      {/* Catálogo Imprimible de QR, Stickers para Frascos y Tuppers */}
      <PantryQrBookletModal
        isOpen={isQrBookletOpen}
        onClose={() => setIsQrBookletOpen(false)}
        products={products}
        zones={zones}
        activeHouse={activeHouse}
        onQuickAddToShoppingList={handleAddShoppingItem}
      />

    </div>
  );
}
