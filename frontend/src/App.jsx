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
import { audio } from './services/audioService';
import { syncPantryToIndexedDb } from './services/db';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ZONES, 
  INITIAL_RECIPES, 
  INITIAL_HOUSEHOLDS, 
  INITIAL_STAFF, 
  INITIAL_AUDIT_LOGS 
} from './services/demoData';

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
  // Local storage persisted state
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('alacena_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [shoppingList, setShoppingList] = useState(() => {
    const saved = localStorage.getItem('alacena_shopping_list');
    return saved ? JSON.parse(saved) : INITIAL_SHOPPING_LIST;
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
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Product actions
  const handleSaveProduct = (productData) => {
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === productData.id);
      if (exists) {
        addAuditEntry(
          productData.lastLoggedBy,
          'MODIFICACION_ARTICULO',
          `Modificó datos de ${productData.name} en ${productData.zone}`,
          `Cantidad: ${productData.quantity} ${productData.unit}`
        );
        return prev.map((p) => (p.id === productData.id ? productData : p));
      } else {
        addAuditEntry(
          productData.lastLoggedBy,
          'ALTA_MANUAL',
          `Registró manualmente ${productData.name} (${productData.quantity} ${productData.unit}) en ${productData.zone}`,
          `Costo: $${productData.unitPriceMxn.toFixed(2)} MXN`
        );
        return [productData, ...prev];
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
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleUpdateQuantity = (productId, newQuantity) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const delta = newQuantity - (p.quantity || 0);
          if (delta !== 0) {
            addAuditEntry(
              p.lastLoggedBy || 'Personal de Cocina',
              delta > 0 ? 'INCREMENTO_STOCK' : 'CONSUMO_STOCK',
              `${delta > 0 ? 'Aumentó' : 'Ajustó/Consumió'} ${Math.abs(delta).toFixed(1)} ${p.unit} de ${p.name}`,
              `Nuevo stock: ${newQuantity} ${p.unit}`
            );
          }
          return { ...p, quantity: newQuantity, updatedAt: new Date().toISOString() };
        }
        return p;
      })
    );
  };

  // Shopping list actions
  const handleToggleShoppingItem = (itemId) => {
    setShoppingList((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleRemoveShoppingItem = (itemId) => {
    setShoppingList((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleAddShoppingItem = (item) => {
    setShoppingList((prev) => [item, ...prev]);
  };

  const handleAutoGenerateShoppingList = () => {
    // Escanear artículos con stock bajo
    const lowStockItems = products.filter((p) => (p.quantity || 0) <= (p.minStock || 0));
    let addedCount = 0;

    setShoppingList((prev) => {
      const updated = [...prev];
      lowStockItems.forEach((p) => {
        const alreadyInList = updated.find((i) => i.name.toLowerCase() === p.name.toLowerCase());
        if (!alreadyInList) {
          const deficit = Math.max(1, (p.idealStock || 5) - (p.quantity || 0));
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
      return updated;
    });

    if (addedCount > 0) {
      alert(`⚡ Se agregaron automáticamente ${addedCount} insumos con stock bajo a la lista de compras.`);
    } else {
      alert('¡Todo tu inventario tiene stock óptimo! No hay insumos por debajo del mínimo.');
    }
  };

  const handleCompletePurchaseToPantry = (checkedItems) => {
    let totalPurchasedMxn = 0;

    // Transferir al inventario
    setProducts((prev) => {
      let currentList = [...prev];

      checkedItems.forEach((purchased) => {
        const existingIdx = currentList.findIndex(
          (p) => p.name.toLowerCase() === purchased.name.toLowerCase()
        );

        const cost = (purchased.quantity || 1) * (purchased.estimatedPriceMxn || 0);
        totalPurchasedMxn += cost;

        if (existingIdx >= 0) {
          const existing = currentList[existingIdx];
          currentList[existingIdx] = {
            ...existing,
            quantity: (existing.quantity || 0) + (purchased.quantity || 1),
            unitPriceMxn: purchased.estimatedPriceMxn > 0 ? purchased.estimatedPriceMxn : existing.unitPriceMxn,
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
            lastLoggedBy: 'Administrador General (Recepción Compra)',
            updatedAt: new Date().toISOString(),
          });
        }
      });

      return currentList;
    });

    // Limpiar comprados de la lista de compras
    const checkedIds = new Set(checkedItems.map((i) => i.id));
    setShoppingList((prev) => prev.filter((i) => !checkedIds.has(i.id)));

    // Registrar en auditoría
    addAuditEntry(
      'Administrador General',
      'INGRESO_COMPRA_SUPER',
      `Ingresó compra de ${checkedItems.length} artículos a la residencia`,
      `Valor total ingresado: $${totalPurchasedMxn.toFixed(2)} MXN`
    );

    setActiveTab('inventory');
  };

  // Direct scanner add & subtract
  const handleAddStockDirect = (productId, amount = 1, targetZone = null) => {
    const prod = products.find((p) => p.id === productId);
    if (prod) {
      const newQty = (prod.quantity || 0) + amount;
      if (targetZone && targetZone !== prod.zone) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, quantity: newQty, zone: targetZone, updatedAt: new Date().toISOString() } : p))
        );
      } else {
        handleUpdateQuantity(productId, newQty);
      }
      addAuditEntry(
        'Administrador / Compras',
        'INGRESO_DIRECTO',
        `Ingresó +${amount} ${prod.unit} de "${prod.name}" a ${targetZone || prod.zone}`,
        `Stock total: ${newQty} ${prod.unit}`
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
    <div className="min-h-screen bg-[#12100E] text-[#F2EDE4] flex flex-col font-body selection:bg-[#6B1F2E]/30 selection:text-white">
      
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
        shoppingCount={shoppingList.filter((i) => !i.checked).length}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        isOnline={isOnline}
        zones={zones}
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
            onAutoGenerateFromPantry={handleAutoGenerateShoppingList}
            onCompletePurchaseToPantry={handleCompletePurchaseToPantry}
            onOpenScanner={() => setIsScannerOpen(true)}
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
        zones={zones}
        staffList={staffList}
        initialProduct={editingProduct}
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

    </div>
  );
}
