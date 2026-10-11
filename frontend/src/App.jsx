import React, { useState, useEffect } from 'react';
import Header from './components/layout/Header';
import InventoryView from './components/inventory/InventoryView';
import ManualProductModal from './components/inventory/ManualProductModal';
import RecipesView from './components/recipes/RecipesView';
import AuditTrailView from './components/audit/AuditTrailView';
import ZoneModal from './components/zones/ZoneModal';
import HouseholdsModal from './components/households/HouseholdsModal';
import ChangelogModal from './components/changelog/ChangelogModal';
import { audio } from './services/audioService';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ZONES, 
  INITIAL_RECIPES, 
  INITIAL_HOUSEHOLDS, 
  INITIAL_STAFF, 
  INITIAL_AUDIT_LOGS 
} from './services/demoData';

export default function App() {
  // Local storage persisted state
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('alacena_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
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
  const [activeTab, setActiveTab] = useState('inventory');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState(null);
  const [isHouseModalOpen, setIsHouseModalOpen] = useState(false);
  const [isChangelogOpen, setIsChangelogOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(audio.isMuted());

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('alacena_products', JSON.stringify(products));
  }, [products]);

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

  // Audio mute toggle
  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
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

  // Zone actions
  const handleSaveZone = (zoneData) => {
    setZones((prev) => {
      const exists = prev.find((z) => z.id === zoneData.id);
      if (exists) {
        // If name changed, update all products assigned to that zone
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
    // Deduct exact ingredients
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

  // Reset demo data
  const handleResetDemoData = () => {
    if (window.confirm('¿Deseas restaurar los datos de demostración con precios en MXN?')) {
      setProducts(INITIAL_PRODUCTS);
      setZones(INITIAL_ZONES);
      setRecipes(INITIAL_RECIPES);
      setHouseholds(INITIAL_HOUSEHOLDS);
      setActiveHouse(INITIAL_HOUSEHOLDS[0]);
      setAuditLogs(INITIAL_AUDIT_LOGS);
      audio.success();
    }
  };

  return (
    <div className="min-h-screen bg-[#090D14] text-gray-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-white">
      
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeHouse={activeHouse}
        onOpenHouseModal={() => setIsHouseModalOpen(true)}
        onOpenChangelog={() => setIsChangelogOpen(true)}
        onResetDemoData={handleResetDemoData}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        {activeTab === 'recipes' && (
          <RecipesView
            recipes={recipes}
            products={products}
            staffList={staffList}
            onCookRecipe={handleCookRecipe}
            onCreateRecipe={handleCreateRecipe}
          />
        )}

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
