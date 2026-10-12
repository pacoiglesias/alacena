import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, Plus, Check, Trash2, Share2, 
  Sparkles, Store, CheckSquare, Square, Camera, 
  ArrowRight, Warehouse, DollarSign, RefreshCw, 
  AlertCircle, QrCode, Printer, CheckCircle2, ListChecks,
  Beef, Milk, Apple, Package, Wine, Coffee, Layers, ChevronDown, BookOpen
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../../services/audioService';
import ItemQrModal from './ItemQrModal';
import ShoppingListQrTicketModal from './ShoppingListQrTicketModal';
import PantryQrBookletModal from './PantryQrBookletModal';
import QuickStaffShoppingModal from './QuickStaffShoppingModal';

// Departamentos estándar de supermercado físico
export const SUPERMARKET_DEPARTMENTS = [
  { id: 'ALL', name: 'Todos los Pasillos', icon: ShoppingCart, color: 'emerald' },
  { id: 'CARNES', name: '🥩 Carnicería & Pescados', icon: Beef, color: 'rose', keywords: ['ribeye', 'carne', 'salmon', 'salmón', 'pollo', 'res', 'cerdo', 'pescado', 'camaron', 'marisco', 'corte'] },
  { id: 'LACTEOS', name: '🧀 Lácteos & Quesos', icon: Milk, color: 'amber', keywords: ['queso', 'leche', 'mantequilla', 'parmigiano', 'yogurt', 'crema', 'huevo'] },
  { id: 'VERDURAS', name: '🥬 Frutas & Verduras', icon: Apple, color: 'emerald', keywords: ['manzana', 'limon', 'limón', 'cebolla', 'jitomate', 'tomate', 'aguacate', 'verdura', 'fruta', 'papas', 'papa', 'lechuga', 'ajo'] },
  { id: 'ABARROTES', name: '🥫 Abarrotes & Despensa', icon: Package, color: 'blue', keywords: ['harina', 'arroz', 'frijol', 'aceite', 'pasta', 'azucar', 'azúcar', 'sal', 'especias', 'condimento', 'abarrotes', 'coca'] },
  { id: 'VINOS', name: '🍷 Cava, Vinos & Licores', icon: Wine, color: 'purple', keywords: ['vino', 'cava', 'cerveza', 'tequila', 'whisky', 'licor', 'tinto', 'blanco', 'botella'] },
  { id: 'PANADERIA', name: '☕ Café, Panadería & Desayuno', icon: Coffee, color: 'amber', keywords: ['cafe', 'café', 'pan', 'galleta', 'cereal', 'mermelada', 'te', 'té'] },
  { id: 'LIMPIEZA', name: '🧼 Limpieza & Hogar', icon: Sparkles, color: 'cyan', keywords: ['jabon', 'jabón', 'detergente', 'cloro', 'papel', 'servilleta', 'limpieza', 'bolsa'] },
];

export function getDepartmentForItem(item) {
  if (item.department) return item.department;
  const text = `${item.name || ''} ${item.category || ''}`.toLowerCase();
  for (const dept of SUPERMARKET_DEPARTMENTS) {
    if (dept.keywords && dept.keywords.some((kw) => text.includes(kw))) {
      return dept.id;
    }
  }
  return 'ABARROTES';
}

export default function ShoppingListView({
  shoppingList,
  products,
  zones,
  activeHouse,
  onToggleItem,
  onRemoveItem,
  onAddItem,
  onAutoGenerateFromPantry,
  onCompletePurchaseToPantry,
  onOpenScanner,
}) {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [selectedQrItem, setSelectedQrItem] = useState(null);
  const [isOrderTicketQrOpen, setIsOrderTicketQrOpen] = useState(false);
  const [isQrBookletOpen, setIsQrBookletOpen] = useState(false);
  const [isQuickStaffOpen, setIsQuickStaffOpen] = useState(false);

  // New manual item state
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('kg');
  const [department, setDepartment] = useState('ABARROTES');
  const [store, setStore] = useState('Costco');
  const [estimatedPriceMxn, setEstimatedPriceMxn] = useState(0);
  const [targetZone, setTargetZone] = useState(zones[0]?.name || 'Alacena Principal');

  // Detección proactiva de productos que necesitan compra en casa
  const proactiveLowStockItems = useMemo(() => {
    return products.filter((p) => {
      const isLow = (p.quantity || 0) <= (p.minStock || 0);
      const alreadyInList = shoppingList.some((i) => i.name.toLowerCase() === p.name.toLowerCase());
      return isLow && !alreadyInList;
    });
  }, [products, shoppingList]);

  // Enriquecer artículos con departamento
  const enrichedList = useMemo(() => {
    return shoppingList.map((item) => ({
      ...item,
      computedDept: item.department || getDepartmentForItem(item),
    }));
  }, [shoppingList]);

  // Métricas
  const metrics = useMemo(() => {
    let pendingCount = 0;
    let inCartCount = 0;
    let totalEstimatedMxn = 0;
    let cartTotalMxn = 0;

    enrichedList.forEach((item) => {
      const itemCost = (item.quantity || 1) * (item.estimatedPriceMxn || 0);
      totalEstimatedMxn += itemCost;
      if (item.checked) {
        inCartCount++;
        cartTotalMxn += itemCost;
      } else {
        pendingCount++;
      }
    });

    const totalItems = enrichedList.length;
    const progressPercent = totalItems > 0 ? Math.round((inCartCount / totalItems) * 100) : 0;

    return { pendingCount, inCartCount, totalEstimatedMxn, cartTotalMxn, totalItems, progressPercent };
  }, [enrichedList]);

  // Lista agrupada por departamentos
  const groupedByDepartment = useMemo(() => {
    const groups = {};
    SUPERMARKET_DEPARTMENTS.forEach((dept) => {
      if (dept.id !== 'ALL') {
        groups[dept.id] = [];
      }
    });

    enrichedList.forEach((item) => {
      // Filtrar por tienda si aplica
      if (selectedStore !== 'ALL' && (item.store || 'Supermercado') !== selectedStore) return;

      const deptId = item.computedDept || 'ABARROTES';
      if (!groups[deptId]) groups[deptId] = [];
      groups[deptId].push(item);
    });

    return groups;
  }, [enrichedList, selectedStore]);

  // Tiendas disponibles
  const stores = useMemo(() => {
    const list = new Set(shoppingList.map((i) => i.store || 'Supermercado'));
    return ['ALL', ...Array.from(list)];
  }, [shoppingList]);

  // Exportar a WhatsApp formateado POR DEPARTAMENTOS
  const handleShareWhatsAppByDept = () => {
    audio.click();
    const pending = enrichedList.filter((i) => !i.checked);
    if (pending.length === 0) {
      alert('No hay artículos pendientes por comprar.');
      return;
    }

    let text = `🛒 *LISTA DEL SÚPER POR DEPARTAMENTOS*\n`;
    text += `📍 *${activeHouse?.name?.toUpperCase() || 'RESIDENCIA'}*\n`;
    text += `Total por comprar: ${pending.length} artículos (~$${metrics.totalEstimatedMxn.toFixed(2)} MXN)\n\n`;

    SUPERMARKET_DEPARTMENTS.forEach((dept) => {
      if (dept.id === 'ALL') return;
      const itemsInDept = pending.filter((i) => i.computedDept === dept.id);
      if (itemsInDept.length > 0) {
        text += `*${dept.name.toUpperCase()}*:\n`;
        itemsInDept.forEach((it) => {
          text += `• [ ] ${it.name} - ${it.quantity} ${it.unit} (${it.store || 'Super'})\n`;
        });
        text += `\n`;
      }
    });

    text += `_Generado automáticamente con ALACENA Enterprise_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (!itemName.trim()) return;

    audio.success();
    onAddItem({
      id: `shop-${Date.now()}`,
      name: itemName.trim(),
      quantity: parseFloat(quantity) || 1,
      unit,
      department,
      store: store.trim(),
      estimatedPriceMxn: parseFloat(estimatedPriceMxn) || 0,
      targetZone: targetZone || zones[0]?.name || 'Alacena Principal',
      checked: false,
    });

    setItemName('');
    setQuantity(1);
    setEstimatedPriceMxn(0);
    setIsManualAddOpen(false);
  };

  const handleFinishPurchase = () => {
    const checkedItems = enrichedList.filter((i) => i.checked);
    if (checkedItems.length === 0) {
      alert('Toca los artículos que ya compraste para marcarlos con palomita verde antes de guardar.');
      return;
    }

    audio.cook();
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    onCompletePurchaseToPantry(checkedItems);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Banner Proactivo Inteligente: Alerta Automática de Alacena */}
      {proactiveLowStockItems.length > 0 && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-transparent border border-amber-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/30 text-amber-300 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 block">
                Sugerencia Proactiva del Sistema
              </span>
              <p className="text-xs text-white font-medium mt-0.5">
                Detectamos <strong>{proactiveLowStockItems.length} insumos</strong> por agotarse en la alacena ({proactiveLowStockItems.slice(0, 3).map(p => p.name).join(', ')}{proactiveLowStockItems.length > 3 ? '...' : ''}).
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              audio.success();
              onAutoGenerateFromPantry();
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-xl transition-all shadow-md shadow-amber-950/40 shrink-0"
          >
            <RefreshCw className="w-4 h-4" />
            <span>⚡ Agregar Faltantes a la Lista (1 Toque)</span>
          </button>
        </div>
      )}

      {/* 2. Encabezado Principal y Acciones para el Súper */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Lista de Compras Organizada por Departamentos
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Diseñada para caminar por los pasillos del súper sin dar vueltas. Toca con un dedo para marcar lo que echas al carrito.
              </p>
            </div>
          </div>
        </div>

        {/* Botones de Acción Inmediata para el Súper y Personal */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* 1. ¿Qué Falta en Casa? (Para personal de servicio) */}
          <button
            onClick={() => {
              audio.click();
              setIsQuickStaffOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all shadow-md shadow-amber-950/40"
            title="Apuntar lo que se terminó en casa (Coca-Cola, Leche, Huevos, etc.)"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>📝 ¿Qué Falta en Casa?</span>
          </button>

          {/* 2. Librito QR para Cocina / Personal */}
          <button
            onClick={() => {
              audio.click();
              setIsQrBookletOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-purple-300 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 transition-all"
            title="Ver o imprimir el catálogo de códigos QR para el personal"
          >
            <BookOpen className="w-4 h-4" />
            <span>📖 Librito QR Cocina</span>
          </button>

          {/* 3. Imprimir / Guardar PDF */}
          <button
            onClick={() => {
              audio.click();
              window.print();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 transition-all"
            title="Imprimir lista en papel o guardar en PDF"
          >
            <Printer className="w-4 h-4" />
            <span>🖨️ Imprimir / PDF</span>
          </button>

          {/* 4. Escáner en el Súper */}
          <button
            onClick={() => {
              audio.click();
              onOpenScanner();
            }}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/40"
          >
            <Camera className="w-4 h-4" />
            <span>📷 Escanear</span>
          </button>

          {/* 5. Compartir por WhatsApp organizado por pasillos */}
          <button
            onClick={handleShareWhatsAppByDept}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 transition-all"
            title="Enviar lista por WhatsApp a la cocinera o chofer"
          >
            <Share2 className="w-4 h-4" />
            <span>📲 WhatsApp</span>
          </button>

          {/* 6. Ticket QR de Orden */}
          <button
            onClick={() => {
              audio.click();
              setIsOrderTicketQrOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
            title="Ver ticket QR"
          >
            <QrCode className="w-4 h-4" />
            <span>Ticket QR</span>
          </button>

          {/* 7. Agregar artículo manual */}
          <button
            onClick={() => {
              audio.click();
              setIsManualAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Manual</span>
          </button>
        </div>
      </div>

      {/* 3. Métricas Visuales en Tiempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Por Comprar */}
        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border border-white/10">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Faltan por Comprar
            </span>
            <div className="text-3xl font-extrabold text-white mt-1 font-mono">
              {metrics.pendingCount} <span className="text-xs text-gray-400 font-sans font-normal">artículos</span>
            </div>
            <span className="text-xs text-gray-400 mt-1 block">
              Distribuidos en los departamentos
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400">
            <ShoppingCart className="w-6 h-6" />
          </div>
        </div>

        {/* En el Carrito & Barra de Progreso */}
        <div className="glass-panel p-5 rounded-3xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                En el Carrito ({metrics.progressPercent}%)
              </span>
              <div className="text-3xl font-extrabold text-emerald-300 mt-1 font-mono">
                {metrics.inCartCount} de {metrics.totalItems}
              </div>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <CheckSquare className="w-6 h-6" />
            </div>
          </div>
          
          <div className="w-full bg-white/10 h-2.5 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${metrics.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Presupuesto en Pesos Mexicanos (MXN) */}
        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border border-white/10">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Presupuesto Estimado
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">
              ${metrics.totalEstimatedMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs text-emerald-400 font-sans font-bold">MXN</span>
            </div>
            <span className="text-xs text-gray-400 mt-1 block">
              Llevas en carrito: ${metrics.cartTotalMxn.toFixed(2)} MXN
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* 4. Selector de Pasillos / Departamentos del Supermercado */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Pasillos del Supermercado:</span>
          </span>
          {metrics.inCartCount > 0 && (
            <button
              onClick={handleFinishPurchase}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950/50 animate-pulse flex items-center gap-1.5"
            >
              <Warehouse className="w-4 h-4" />
              <span>🏁 Guardar {metrics.inCartCount} Comprados en la Despensa</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {SUPERMARKET_DEPARTMENTS.map((dept) => {
            const isSelected = selectedDept === dept.id;
            const itemsInDept = dept.id === 'ALL' 
              ? enrichedList.length 
              : (groupedByDepartment[dept.id] || []).length;

            return (
              <button
                key={dept.id}
                onClick={() => {
                  audio.click();
                  setSelectedDept(dept.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-950/50'
                    : 'bg-white/5 text-gray-300 hover:text-white border-white/10 hover:bg-white/10'
                }`}
              >
                <span>{dept.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-black/25 text-white' : 'bg-white/10 text-gray-400'
                }`}>
                  {itemsInDept}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Lista Agrupada por Departamentos con Tarjetas Táctiles Gigantes */}
      {enrichedList.length === 0 ? (
        <div className="glass-panel text-center py-20 border border-dashed border-white/10 rounded-3xl">
          <ShoppingCart className="w-12 h-12 text-gray-500 mx-auto mb-3" />
          <h4 className="text-lg font-bold text-white">No hay compras pendientes</h4>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            Presiona el botón de abajo para que el sistema detecte automáticamente qué productos están por agotarse en la alacena.
          </p>
          <div className="flex justify-center gap-3 mt-5">
            <button
              onClick={() => {
                audio.success();
                onAutoGenerateFromPantry();
              }}
              className="px-5 py-2.5 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/35 rounded-xl transition-all shadow-md"
            >
              ⚡ Auto-Detectar Faltantes de Casa
            </button>
            <button
              onClick={() => {
                audio.click();
                setIsManualAddOpen(true);
              }}
              className="px-5 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
            >
              + Agregar Artículo Manual
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {SUPERMARKET_DEPARTMENTS.filter(d => d.id !== 'ALL').map((dept) => {
            const items = groupedByDepartment[dept.id] || [];
            if (selectedDept !== 'ALL' && selectedDept !== dept.id) return null;
            if (items.length === 0 && selectedDept === 'ALL') return null;

            return (
              <div 
                key={dept.id} 
                className="glass-panel p-5 rounded-3xl border border-white/10 space-y-3"
              >
                {/* Título del Pasillo / Departamento */}
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-extrabold text-white tracking-tight">
                      {dept.name}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-white/10 text-emerald-300">
                      {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium hidden sm:inline">
                    Toca para marcar al echar al carrito
                  </span>
                </div>

                {/* Tarjetas Táctiles Gigantes de Artículos en este pasillo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        audio.click();
                        onToggleItem(item.id);
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none ${
                        item.checked
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-gray-400 shadow-sm'
                          : 'bg-white/[0.03] border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.05] text-white'
                      }`}
                    >
                      {/* Casilla Táctil Grande & Datos */}
                      <div className="flex items-center gap-3.5 min-w-0">
                        <button
                          type="button"
                          className={`w-7 h-7 rounded-xl flex items-center justify-center border transition-all shrink-0 ${
                            item.checked
                              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
                              : 'border-white/30 bg-white/5 hover:border-emerald-400'
                          }`}
                        >
                          {item.checked && <Check className="w-5 h-5 stroke-[3]" />}
                        </button>

                        <div className="min-w-0">
                          <span className={`text-sm font-bold block truncate ${
                            item.checked ? 'line-through text-gray-400 font-normal' : 'text-white'
                          }`}>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                            <span className="font-mono text-emerald-300 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                              {item.quantity} {item.unit}
                            </span>
                            <span>•</span>
                            <span className="truncate">{item.store || 'Supermercado'}</span>
                            {item.targetZone && (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="text-gray-500 hidden sm:inline">Destino: {item.targetZone}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Precio & Botón Etiqueta QR */}
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {item.estimatedPriceMxn > 0 && (
                          <div className="text-right font-mono text-xs">
                            <span className="text-emerald-300 font-bold block">
                              ${((item.estimatedPriceMxn || 0) * (item.quantity || 1)).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-gray-500">MXN</span>
                          </div>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.click();
                            setSelectedQrItem(item);
                          }}
                          className="p-2 text-gray-400 hover:text-emerald-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
                          title="Ver código QR para recipientes / frascos"
                        >
                          <QrCode className="w-4 h-4 text-emerald-400" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            audio.delete();
                            onRemoveItem(item.id);
                          }}
                          className="p-2 text-gray-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
                          title="Quitar de la lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Botón Flotante Gigante al Finalizar para Guardar en Casa */}
      {metrics.inCartCount > 0 && (
        <div className="sticky bottom-6 z-30">
          <div className="max-w-xl mx-auto p-2 bg-[#090D14]/90 backdrop-blur-xl rounded-2xl border border-emerald-500/40 shadow-2xl">
            <button
              onClick={handleFinishPurchase}
              className="w-full py-4 px-6 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-950/60"
            >
              <Warehouse className="w-5 h-5" />
              <span>✅ YA COMPRÉ TODO: GUARDAR {metrics.inCartCount} ARTÍCULOS EN LA DESPENSA</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Agregar Artículo Manual a la Lista */}
      {isManualAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">
              Agregar Artículo a la Lista de Compras
            </h3>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Ej. Pechuga de Pollo, Jitomate, Leche..."
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Pasillo / Departamento del Supermercado
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
                >
                  {SUPERMARKET_DEPARTMENTS.filter(d => d.id !== 'ALL').map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Unidad
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="litros">litros</option>
                    <option value="piezas">piezas</option>
                    <option value="botellas">botellas</option>
                    <option value="paquetes">paquetes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Tienda Sugerida
                  </label>
                  <input
                    type="text"
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    placeholder="Costco, City Market..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Precio Estimado ($ MXN)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={estimatedPriceMxn}
                    onChange={(e) => setEstimatedPriceMxn(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Zona de Destino al Llegar a Casa
                </label>
                <select
                  value={targetZone}
                  onChange={(e) => setTargetZone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.name}>
                      {z.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsManualAddOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
                >
                  Agregar a la Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Etiqueta QR del Artículo */}
      <ItemQrModal
        isOpen={!!selectedQrItem}
        onClose={() => setSelectedQrItem(null)}
        item={selectedQrItem}
        activeHouse={activeHouse}
      />

      {/* Modal: Ticket QR de Orden Maestro */}
      <ShoppingListQrTicketModal
        isOpen={isOrderTicketQrOpen}
        onClose={() => setIsOrderTicketQrOpen(false)}
        shoppingList={enrichedList}
        activeHouse={activeHouse}
        totalEstimatedMxn={metrics.totalEstimatedMxn}
      />

      {/* Modal: Librito de Códigos QR para Personal de Servicio */}
      <PantryQrBookletModal
        isOpen={isQrBookletOpen}
        onClose={() => setIsQrBookletOpen(false)}
        products={products}
        activeHouse={activeHouse}
        onQuickAddToShoppingList={onAddItem}
      />

      {/* Modal: ¿Qué Falta en Casa? (Apuntar Rápido) */}
      <QuickStaffShoppingModal
        isOpen={isQuickStaffOpen}
        onClose={() => setIsQuickStaffOpen(false)}
        onAddItem={onAddItem}
      />

      {/* Vista de Impresión en Papel / PDF (Visible solo al imprimir) */}
      <div className="hidden print:block text-black bg-white p-4">
        <div className="border-b-2 border-black pb-3 mb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              LISTA DE COMPRAS DEL SUPERMERCADO
            </h1>
            <p className="text-xs font-bold text-gray-700">
              {activeHouse?.name?.toUpperCase() || 'RESIDENCIA'} • Organizada por Pasillos
            </p>
          </div>
          <div className="text-right text-xs">
            <div>Fecha: {new Date().toLocaleDateString('es-MX')}</div>
            <div className="font-bold">Presupuesto Aprox: ${metrics.totalEstimatedMxn.toFixed(2)} MXN</div>
          </div>
        </div>

        <div className="space-y-4">
          {SUPERMARKET_DEPARTMENTS.filter(d => d.id !== 'ALL').map((dept) => {
            const items = enrichedList.filter(i => i.computedDept === dept.id && !i.checked);
            if (items.length === 0) return null;

            return (
              <div key={dept.id} className="break-inside-avoid">
                <div className="bg-gray-100 px-3 py-1 font-bold text-xs uppercase border border-gray-400 mb-1">
                  {dept.name} ({items.length})
                </div>
                <table className="w-full text-xs border-collapse">
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-b border-gray-200">
                        <td className="w-6 py-1.5 text-center font-mono">[ ]</td>
                        <td className="py-1.5 font-bold">{it.name}</td>
                        <td className="w-24 py-1.5 text-right font-mono">{it.quantity} {it.unit}</td>
                        <td className="w-32 py-1.5 text-right text-gray-600">{it.store || 'Super'}</td>
                        <td className="w-20 py-1.5 text-right font-mono">${((it.estimatedPriceMxn || 0) * (it.quantity || 1)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-4 border-t border-black flex justify-between text-xs">
          <div>Firma Encargado de Compras: ____________________</div>
          <div>Recibido en Alacena: ____________________</div>
        </div>
      </div>

    </div>
  );
}
