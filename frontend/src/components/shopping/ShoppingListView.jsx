import React, { useState, useMemo, useEffect, useCallback, lazy, Suspense } from 'react';
import { 
  ShoppingCart, Plus, Check, Trash2, Share2, 
  Sparkles, Store, CheckSquare, Square, Camera, 
  ArrowRight, Warehouse, DollarSign, RefreshCw, 
  AlertCircle, QrCode, Printer, CheckCircle2, ListChecks,
  Beef, Milk, Apple, Package, Wine, Coffee, Layers, ChevronDown, BookOpen, ShoppingBag,
  MoreHorizontal, Receipt, Award, Search, ArrowUpRight, Undo2, FileText
} from 'lucide-react';
import { audio } from '../../services/audioService';
import ProductPhoto from '../common/ProductPhoto';
const ItemQrModal = lazy(() => import('./ItemQrModal'));
const ShoppingListQrTicketModal = lazy(() => import('./ShoppingListQrTicketModal'));
const PantryQrBookletModal = lazy(() => import('./PantryQrBookletModal'));
const QuickStaffShoppingModal = lazy(() => import('./QuickStaffShoppingModal'));
const PrintableShoppingListModal = lazy(() => import('./PrintableShoppingListModal'));
const SmartListImportModal = lazy(() => import('./SmartListImportModal'));
const ReceiptReconciliationModal = lazy(() => import('./ReceiptReconciliationModal'));
const WeeklyStaplesModal = lazy(() => import('./WeeklyStaplesModal'));
const PriceComparisonModal = lazy(() => import('./PriceComparisonModal'));
import { getCatalogs } from '../../services/catalogsService';
import { belongsToHouse, positiveQuantity } from '../../utils/householdShopping';
import { readLocalState, writeLocalState } from '../../services/localState';
import { normalizeItemName, areItemsEquivalent, deduplicateShoppingItems } from '../../utils/deduplication';
import { notify, confirmDialog } from '../../services/notice';

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
  const explicit = SUPERMARKET_DEPARTMENTS.find((d) => d.id !== 'ALL' && (d.id === item.department || normalizeItemName(d.name.replace(/^[^a-zA-Z]+/, '')) === normalizeItemName(item.department || '')));
  if (explicit) return explicit.id;
  const text = `${item.name || ''} ${item.category || ''}`.toLowerCase();
  for (const dept of SUPERMARKET_DEPARTMENTS) {
    if (dept.keywords && dept.keywords.some((kw) => text.includes(kw))) {
      return dept.id;
    }
  }
  return 'ABARROTES';
}


// ─── Tarjeta de artículo memoizada: solo re-renderiza si cambian sus props ───
const ShoppingItemCard = React.memo(function ShoppingItemCard({
  item, onToggle, onUpdateQuantity, onRemove, onShowQr, money,
}) {
  const step = ['kg', 'l', 'litros'].includes(item.unit) ? 0.25 : 1;
  const changeQty = (delta) => {
    audio.click();
    const next = parseFloat(
      (Math.max(0.01, (parseFloat(item.quantity) || 1) + delta)).toFixed(2)
    );
    onUpdateQuantity(item.id, next);
  };
  return (
    <div
      onClick={() => { audio.superCheck(); onToggle(item.id); }}
      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none active:scale-[0.98] ${
        item.checked
          ? 'bg-emerald-500/15 border-emerald-500/40 text-gray-400 shadow-sm'
          : 'bg-white/[0.03] border-white/10 hover:border-emerald-500/30 hover:bg-white/[0.05] text-white'
      }`}
    >
      {/* Casilla Táctil Grande & Datos */}
      <div className="flex items-center gap-3.5 min-w-0">
        <ProductPhoto photo={item.photo} alt={item.name} size={44} />
        <button
          type="button"
          role="checkbox" aria-checked={Boolean(item.checked)} aria-label={`Marcar ${item.name}`}
          onClick={(e) => { e.stopPropagation(); audio.superCheck(); onToggle(item.id); }}
          className={`w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center border transition-all shrink-0 ${
            item.checked
              ? 'bg-emerald-500 border-emerald-500 text-white shadow-md'
              : 'border-white/30 bg-white/5 hover:border-emerald-400'
          }`}
        >
          {item.checked && <Check className="w-6 h-6 stroke-[3] animate-check-pop" />}
        </button>

        <div className="min-w-0">
          <span className={`text-sm font-bold block truncate ${
            item.checked ? 'line-through text-gray-400 font-normal' : 'text-white'
          }`}>
            {item.name}
          </span>
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-1 flex-wrap">
            <div
              className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-lg px-1 py-0.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => changeQty(-step)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-sm text-gray-300 hover:text-white font-bold cursor-pointer rounded-md active:bg-white/10"
                title="Restar"
                aria-label={`Quitar ${step} ${item.unit || ''}`}
              >−</button>
              <span className="font-mono text-emerald-300 font-bold text-xs px-1">
                {item.quantity} {item.unit}
              </span>
              <button
                type="button"
                onClick={() => changeQty(step)}
                className="min-w-[40px] min-h-[40px] flex items-center justify-center text-sm text-gray-300 hover:text-white font-bold cursor-pointer rounded-md active:bg-white/10"
                title="Sumar"
                aria-label={`Agregar ${step} ${item.unit || ''}`}
              >+</button>
            </div>
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
              {money((item.estimatedPriceMxn || 0) * (item.quantity || 1))}
            </span>
            <span className="text-[10px] text-gray-500">MXN</span>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); audio.click(); onShowQr(item); }}
          className="min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center text-gray-400 hover:text-emerald-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all"
          title="Ver código QR para recipientes / frascos"
          aria-label={`QR de ${item.name}`}
        >
          <QrCode className="w-4 h-4 text-emerald-400" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); audio.delete(); onRemove(item); }}
          className="min-w-[44px] min-h-[44px] p-2.5 flex items-center justify-center text-gray-500 hover:text-rose-400 rounded-xl hover:bg-rose-500/10 transition-colors"
          title="Quitar de la lista"
          aria-label={`Quitar ${item.name} de la lista`}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

export default function ShoppingListView({
  shoppingList,
  products,
  zones,
  activeHouse,
  onToggleItem,
  onRemoveItem,
  onAddItem,
  onUpdateItemQuantity,
  onAutoGenerateFromPantry,
  onCompletePurchaseToPantry,
  onOpenScanner,
  onDeduplicateList,
  onClearChecked,
  onClearAll,
  onOpenPurchaseHistory,
  purchaseHistoryCount = 0,
}) {
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStore, setSelectedStore] = useState('ALL');
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [selectedQrItem, setSelectedQrItem] = useState(null);
  const [isOrderTicketQrOpen, setIsOrderTicketQrOpen] = useState(false);
  const [isQrBookletOpen, setIsQrBookletOpen] = useState(false);
  const [isQuickStaffOpen, setIsQuickStaffOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isWalkingMode, setIsWalkingMode] = useState(() => {
    try { return localStorage.getItem('alacena:walkingMode') === '1'; } catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem('alacena:walkingMode', isWalkingMode ? '1' : '0'); } catch { /* sin almacenamiento */ }
  }, [isWalkingMode]);
  const [isSmartImportOpen, setIsSmartImportOpen] = useState(false);
  // Con qué pestaña y modo abre el importador: la entrada "Foto de lista"
  // lo abre directo en la pestaña de foto con el modo foto-lista activo.
  const [smartImportInitial, setSmartImportInitial] = useState({ subTab: 'text', photoListMode: false });
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false);
  const [isWeeklyStaplesOpen, setIsWeeklyStaplesOpen] = useState(false);
  const [isPriceComparisonOpen, setIsPriceComparisonOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [hideChecked, setHideChecked] = useState(false);
  const [search, setSearch] = useState('');
  const [quickName, setQuickName] = useState('');
  const [removedItem, setRemovedItem] = useState(null);
  const [notice, setNotice] = useState('');
  const budgetKey = 'alacena-budget-' + (activeHouse?.id || 'house-1');
  const [budgets, setBudgets] = useState(() => readLocalState('alacena_budgets', {}));
  const budget = Number(budgets[budgetKey]) || 0;
  const currency = activeHouse?.currency || 'MXN';
  const money = useCallback((value) => new Intl.NumberFormat(currency === 'EUR' ? 'es-ES' : 'es-MX', { style: 'currency', currency }).format(value), [currency]);
  const removeItem = (item) => { setRemovedItem(item); onRemoveItem(item.id); setNotice('Artículo eliminado.'); };
  // Callbacks estables para las tarjetas memoizadas
  const handleToggleItem = useCallback((id) => onToggleItem(id), [onToggleItem]);
  const handleUpdateItemQuantity = useCallback(
    (id, qty) => { if (onUpdateItemQuantity) onUpdateItemQuantity(id, qty); },
    [onUpdateItemQuantity]
  );
  const handleRemoveItem = useCallback((item) => removeItem(item), [onRemoveItem]);
  const handleShowQrItem = useCallback((item) => setSelectedQrItem(item), []);
  const quickAdd = (e) => {
    e.preventDefault();
    if (!quickName.trim()) return;
    onAddItem({ name: quickName.trim(), quantity: 1, unit: 'piezas', checked: false,
      estimatedPriceMxn: 0, store: selectedStore === 'ALL' ? 'Supermercado' : selectedStore,
      targetZone: zones[0]?.name || 'Alacena Principal' });
    setRemovedItem(null); setNotice('Agregaste ' + quickName.trim() + ' a tu lista.'); setQuickName('');
  };

  // Batch import callback con desduplicación previa
  const handleBatchImportItems = (importedItems) => {
    if (!importedItems || importedItems.length === 0) return;
    const cleanBatch = deduplicateShoppingItems(importedItems);
    cleanBatch.forEach((item) => {
      onAddItem({
        name: item.name,
        quantity: item.quantity || 1,
        unit: item.unit || 'piezas',
        department: getDepartmentForItem(item),
        store: item.store || 'Costco',
        estimatedPriceMxn: item.estimatedPriceMxn || 0,
        targetZone: item.targetZone || zones[0]?.name || 'Alacena Principal',
      });
    });
  };

  // New manual item state
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('kg');
  const [department, setDepartment] = useState('ABARROTES');
  const [store, setStore] = useState('Costco');
  const [estimatedPriceMxn, setEstimatedPriceMxn] = useState(0);
  const [targetZone, setTargetZone] = useState(zones[0]?.name || 'Alacena Principal');

  // Detección proactiva inteligente con equivalencia (evita duplicar salmón / salmon)
  const proactiveLowStockItems = useMemo(() => {
    return products.filter((p) => {
      if (!belongsToHouse(p, activeHouse?.id)) return false;
      const isLow = (p.quantity || 0) <= (p.minStock || 0);
      const alreadyInList = shoppingList.some((i) => areItemsEquivalent(i.name, p.name));
      return isLow && !alreadyInList;
    });
  }, [products, shoppingList, activeHouse]);

  // Enriquecer artículos con departamento y filtrar por el Hogar Activo (México o España)
  const enrichedList = useMemo(() => {
    return shoppingList
      .filter((item) => {
        return belongsToHouse(item, activeHouse?.id);
      })
      .map((item) => ({
        ...item,
        computedDept: getDepartmentForItem(item),
      }));
  }, [shoppingList, activeHouse]);

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
      // Filtrar si el usuario activó 'Solo Pendientes'
      if (hideChecked && item.checked) return;
      if (search && !normalizeItemName(item.name).includes(normalizeItemName(search))) return;

      const deptId = item.computedDept || 'ABARROTES';
      if (!groups[deptId]) groups[deptId] = [];
      groups[deptId].push(item);
    });

    return groups;
  }, [enrichedList, selectedStore, hideChecked, search]);

  // Tiendas disponibles
  const stores = useMemo(() => {
    const list = new Set(enrichedList.map((i) => i.store || 'Supermercado'));
    return ['ALL', ...Array.from(list)];
  }, [enrichedList]);

  // Exportar a WhatsApp formateado POR DEPARTAMENTOS
  const handleShareWhatsAppByDept = () => {
    audio.click();
    const pending = enrichedList.filter((i) => !i.checked);
    if (pending.length === 0) {
      notify('No hay artículos pendientes por comprar.');
      return;
    }

    let text = `🛒 *LISTA DEL SÚPER POR DEPARTAMENTOS*\n`;
    text += `📍 *${activeHouse?.name?.toUpperCase() || 'RESIDENCIA'}*\n`;
    text += `Total por comprar: ${pending.length} artículos (~${money(metrics.totalEstimatedMxn - metrics.cartTotalMxn)} ${currency})\n\n`;

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

    text += `_Generado con ALACENA Casa_ 🏡✨`;

    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
      }
    } catch (_) {}

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
      quantity: positiveQuantity(quantity),
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

  const handleToggleWalkingItem = (itemId) => {
    audio.superCheck();
    onToggleItem(itemId);
    setTimeout(() => {
      const nextUnchecked = document.querySelector('[data-walk-unchecked="true"]');
      if (nextUnchecked) {
        nextUnchecked.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 800);
  };

  const handleFinishPurchase = () => {
    const checkedItems = enrichedList.filter((i) => i.checked);
    if (checkedItems.length === 0) {
      notify('Toca los artículos que ya compraste para marcarlos con palomita verde antes de guardar.');
      return;
    }
    audio.click();
    setIsReconciliationOpen(true);
  };

  return (
    <div className="shopping-home space-y-5">
      <section className="shopping-hero">
        <div className="shopping-hero-copy">
          <span className="shopping-eyebrow"><span /> TU CASA, EN ORDEN</span>
          <h1>Menos vueltas.<br /><em>Todo en tu lista.</em></h1>
          <p>Anota lo que hace falta, marca lo que llevas y guarda tu compra en la despensa.</p>
          <form onSubmit={quickAdd} className="shopping-quick-add">
            <Plus size={20} aria-hidden="true" />
            <input aria-label="Qué hace falta en casa" placeholder="¿Qué hace falta en casa?" value={quickName} maxLength={300} onChange={(e) => setQuickName(e.target.value)} />
            <button type="submit" disabled={!quickName.trim()}>Agregar <ArrowUpRight size={17} /></button>
          </form>
          <span className="shopping-hero-hint">Escribe un producto y presiona Enter. Puedes ajustar la cantidad después.</span>
        </div>
        <div className="shopping-plan">
          <ShoppingBag size={28} strokeWidth={1.5} />
          <span>TU PRÓXIMA COMPRA</span>
          <strong>{metrics.pendingCount}<small> pendientes</small></strong>
          <div className="shopping-plan-rule" />
          <div className="flex justify-between gap-2"><span>Estimado de la lista</span><b>{money(metrics.totalEstimatedMxn)}</b></div>
          <label htmlFor="shopping-budget">Mi límite de gasto ({currency})</label>
          <input id="shopping-budget" type="number" inputMode="decimal" min="0" step="0.01" placeholder="Sin límite" value={budgets[budgetKey] || ''} onChange={(e) => {
            const next = { ...budgets, [budgetKey]: e.target.value }; setBudgets(next); writeLocalState('alacena_budgets', next);
          }} />
          {budget > 0 && <span role="status" className={metrics.totalEstimatedMxn > budget ? 'shopping-over-budget' : ''}>{metrics.totalEstimatedMxn > budget ? 'Superas tu límite por ' : 'Disponible: '}{money(Math.abs(budget - metrics.totalEstimatedMxn))}</span>}
          {enrichedList.some((i) => !i.estimatedPriceMxn) && <small>Hay productos sin precio. El estimado está incompleto.</small>}
        </div>
      </section>
      {notice && <div className="shopping-notice" role="status"><span>{notice}</span>{removedItem && <button type="button" onClick={() => { onAddItem(removedItem); setRemovedItem(null); setNotice('Artículo restaurado.'); }}><Undo2 size={15} /> Deshacer</button>}</div>}
      
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
                Tu lista del súper
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Por pasillos, como haces tus compras.
              </p>
            </div>
          </div>
        </div>

        {/* Barra de Acciones Ergonómica para el Comprador */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto relative">
          
          {/* 1. Modo Súper Táctil */}
          <button
            type="button"
            onClick={() => {
              audio.superCheck();
              setIsWalkingMode(!isWalkingMode);
            }}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 rounded-2xl text-sm sm:text-base font-extrabold transition-all shadow-lg cursor-pointer ${
              isWalkingMode
                ? 'bg-gradient-to-r from-amber-500 to-[var(--terracotta)] text-white ring-2 ring-amber-400 shadow-amber-950/40 animate-pulse'
                : 'bg-gradient-to-r from-[var(--terracotta)] to-[var(--ember)] text-white hover:brightness-110 hover:scale-[1.03] shadow-[var(--terracotta)]/40 ring-2 ring-[var(--ember)]/50'
            }`}
            title="Activar vista táctil gigante para caminar en el supermercado"
          >
            <span className="text-base leading-none">👟</span>
            <span>{isWalkingMode ? 'Salir del modo súper' : 'Modo Súper'}</span>
          </button>

          {/* 2. Escanear Códigos o Tickets de Compra */}
          <button
            type="button"
            onClick={() => {
              audio.click();
              onOpenScanner();
            }}
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
            title="Escanear códigos de barra o leer ticket de compra con OCR"
          >
            <Camera className="w-4 h-4 text-emerald-200" />
            <span>Escanear / Ticket</span>
          </button>

          {/* 3. Agregar Artículo Manual Rápido */}
          <button
            type="button"
            onClick={() => {
              audio.click();
              setIsManualAddOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 transition-all cursor-pointer"
            title="Agregar un insumo nuevo manualmente"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Agregar</span>
          </button>

          {/* 4. Comparador de Precios & Dónde Comprar Más Barato */}
          <button
            type="button"
            onClick={() => {
              audio.click();
              setIsPriceComparisonOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[var(--gold)] bg-[var(--gold)]/15 hover:bg-[var(--gold)]/25 border border-[var(--gold)]/35 transition-all shadow-md cursor-pointer"
            title="Comparador multitienda y asesor de dónde comprar más barato"
          >
            <Award className="w-4 h-4 text-[var(--gold)]" />
            <span className="hidden sm:inline">⚖️ Precios</span>
            <span className="sm:hidden">⚖️</span>
          </button>

          {/* 5. Menú Desplegable: Más Herramientas */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                audio.click();
                setIsMoreMenuOpen(!isMoreMenuOpen);
              }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                isMoreMenuOpen
                  ? 'bg-[var(--gold)]/20 border-[var(--gold)] text-[var(--gold)]'
                  : 'bg-white/5 border-white/10 text-[var(--ink-secondary)] hover:text-white hover:bg-white/10'
              }`}
              title="Más herramientas y opciones"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            {isMoreMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-64 rounded-2xl bg-[var(--bg-sunken)] border border-[var(--border-soft)] shadow-2xl p-2 z-50 animate-fade-in space-y-1 text-xs"
                onClick={() => setIsMoreMenuOpen(false)}
              >
                <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-[var(--gold)] uppercase tracking-wider border-b border-white/5 mb-1">
                  Herramientas del Súper
                </div>

                {/* Comparador Multitienda */}
                <button
                  type="button"
                  onClick={() => setIsPriceComparisonOpen(true)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                >
                  <Award className="w-4 h-4 text-[var(--gold)]" />
                  <span>⚖️ Comparador Multitienda & Ahorro</span>
                </button>

                {/* WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsAppByDept}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                >
                  <Share2 className="w-4 h-4 text-emerald-400" />
                  <span>Compartir por WhatsApp</span>
                </button>

                {/* Imprimir / PDF */}
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(true)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                >
                  <Printer className="w-4 h-4 text-blue-400" />
                  <span>Imprimir Lista en PDF</span>
                </button>

                {/* Canasta Básica Semanal */}
                <button
                  type="button"
                  onClick={() => setIsWeeklyStaplesOpen(true)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  <span>Canasta Básica Semanal</span>
                </button>

                {/* ¿Qué Falta en Casa? */}
                <button
                  type="button"
                  onClick={() => setIsQuickStaffOpen(true)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                >
                  <Sparkles className="w-4 h-4 text-orange-400" />
                  <span>¿Qué Falta en Casa? (Personal)</span>
                </button>

                {/* Importador WhatsApp / Texto */}
                <button
                  type="button"
                  onClick={() => { setSmartImportInitial({ subTab: 'text', photoListMode: false }); setIsSmartImportOpen(true); }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                >
                  <FileText className="w-4 h-4 text-[var(--gold)]" />
                  <span>Importar Texto / WhatsApp</span>
                </button>

                {/* Foto de lista manuscrita */}
                <button
                  type="button"
                  onClick={() => { setSmartImportInitial({ subTab: 'ocr', photoListMode: true }); setIsSmartImportOpen(true); }}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                >
                  <Camera className="w-4 h-4 text-emerald-300" />
                  <span>📸 Foto de lista (manuscrita)</span>
                </button>

                {/* Librito QR de Despensa */}
                <button
                  type="button"
                  onClick={() => setIsQrBookletOpen(true)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                >
                  <BookOpen className="w-4 h-4 text-purple-400" />
                  <span>Librito QR de Cocina</span>
                </button>

                {/* Ticket QR de Orden */}
                <button
                  type="button"
                  onClick={() => setIsOrderTicketQrOpen(true)}
                  className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                >
                  <QrCode className="w-4 h-4 text-gray-300" />
                  <span>Ticket QR Digital</span>
                </button>

                {/* Desduplicar Lista */}
                {onDeduplicateList && (
                  <button
                    type="button"
                    onClick={onDeduplicateList}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                  >
                    <Sparkles className="w-4 h-4 text-[var(--gold)]" />
                    <span>Desduplicar y Consolidar</span>
                  </button>
                )}

                {/* Historial de Compras / Devoluciones */}
                {onOpenPurchaseHistory && (
                  <button
                    type="button"
                    onClick={onOpenPurchaseHistory}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                  >
                    <div className="flex items-center gap-2.5">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>Historial / Devoluciones</span>
                    </div>
                    {purchaseHistoryCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                        {purchaseHistoryCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Vaciar Toda la Lista */}
                {shoppingList.length > 0 && onClearAll && (
                  <div className="pt-1 border-t border-white/5">
                    <button
                      type="button"
                      onClick={onClearAll}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all text-left font-medium"
                    >
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span>Vaciar toda la lista</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Métricas Visuales en Tiempo Real */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        
        {/* Por Comprar */}
        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center justify-between border border-white/10">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-wider block truncate">
              Por Comprar
            </span>
            <div className="text-xl sm:text-3xl font-extrabold text-white mt-0.5 sm:mt-1 font-mono truncate">
              {metrics.pendingCount} <span className="text-[10px] sm:text-xs text-gray-400 font-sans font-normal">arts</span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5 block truncate">
              Pendientes
            </span>
          </div>
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400 shrink-0 ml-1">
            <ShoppingCart className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* En el Carrito & Barra de Progreso */}
        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/10 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider block truncate">
                Carrito ({metrics.progressPercent}%)
              </span>
              <div className="text-xl sm:text-3xl font-extrabold text-emerald-300 mt-0.5 sm:mt-1 font-mono truncate">
                {metrics.inCartCount} / {metrics.totalItems}
              </div>
            </div>
            <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 shrink-0 ml-1">
              <CheckSquare className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>
          
          <div className="w-full bg-white/10 h-2 sm:h-2.5 rounded-full overflow-hidden mt-2 sm:mt-3">
            <div 
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${metrics.progressPercent}%` }}
            />
          </div>
        </div>

        {/* Presupuesto Estimado (Moneda Dinámica: EUR o MXN según el Hogar) */}
        <div className="glass-panel p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl flex items-center justify-between border border-white/10 col-span-2 sm:col-span-1">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-400 uppercase tracking-wider block truncate">
              Presupuesto ({activeHouse?.currency || 'MXN'})
            </span>
            <div className="text-xl sm:text-3xl font-extrabold text-white mt-0.5 sm:mt-1 font-mono truncate">
              {activeHouse?.currency === 'EUR' ? '€' : '$'}
              {metrics.totalEstimatedMxn.toLocaleString(activeHouse?.currency === 'EUR' ? 'es-ES' : 'es-MX', { minimumFractionDigits: 2 })}{' '}
              <span className="text-[10px] sm:text-xs text-emerald-400 font-sans font-bold">
                {activeHouse?.currency || 'MXN'}
              </span>
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 mt-0.5 block truncate">
              En carrito: {activeHouse?.currency === 'EUR' ? '€' : '$'}{metrics.cartTotalMxn.toFixed(2)}
            </span>
          </div>
          <div className="p-2.5 sm:p-3.5 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 shrink-0 ml-1">
            <DollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>
      </div>

      <div className="shopping-filters">
        <label className="shopping-search"><Search size={18} /><input aria-label="Buscar en la lista" placeholder="Buscar un producto…" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
        <label className="shopping-store"><Store size={18} /><select aria-label="Filtrar por tienda" value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>{stores.map((name) => <option key={name} value={name}>{name === 'ALL' ? 'Todas las tiendas' : name}</option>)}</select></label>
      </div>
      {enrichedList.length > 0 && !Object.entries(groupedByDepartment).some(([id, rows]) => rows.length && (selectedDept === 'ALL' || selectedDept === id)) && <div className="shopping-empty"><Search size={28} /><h3>No hay productos con estos filtros</h3><button onClick={() => { setSearch(''); setSelectedStore('ALL'); setSelectedDept('ALL'); setHideChecked(false); }}>Mostrar toda mi lista</button></div>}
      {/* 4. Selector de Pasillos / Departamentos del Supermercado */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Pasillos:</span>
            </span>

            {/* Toggle Ergonómico: Solo Faltantes / Ocultar Marcados */}
            <button
              type="button"
              onClick={() => {
                audio.click();
                setHideChecked(!hideChecked);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                hideChecked
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                  : 'bg-white/5 text-gray-400 hover:text-white border-white/10'
              }`}
              title="Ocultar los productos que ya metiste al carrito para despejar la vista"
            >
              <span>{hideChecked ? '👁️ Solo Faltantes' : '👁️ Ocultar en Carrito'}</span>
              {metrics.inCartCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-black/40 text-[10px] font-mono">
                  {metrics.inCartCount}
                </span>
              )}
            </button>
          </div>
          {metrics.inCartCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleFinishPurchase}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-1.5"
              >
                <Warehouse className="w-4 h-4" />
                <span>🏁 Guardar {metrics.inCartCount} en la Despensa</span>
              </button>

              {onClearChecked && (
                <button
                  onClick={async () => {
                    audio.click();
                    if (await confirmDialog(`¿Deseas eliminar de la lista los ${metrics.inCartCount} artículos marcados sin guardarlos en el inventario?`)) {
                      onClearChecked();
                    }
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all flex items-center gap-1.5"
                  title="Eliminar de la lista solo los productos marcados"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Marcados ({metrics.inCartCount})</span>
                </button>
              )}
            </div>
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
        <div className="card-luxe text-center py-20 border border-dashed border-[var(--border-strong)] rounded-3xl bg-[var(--bg-elevated)]/40 p-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--terracotta)]/15 border border-[var(--terracotta)]/30 flex items-center justify-center text-[var(--ember)] shadow-md">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h4 className="font-display text-xl sm:text-2xl font-bold text-[var(--ink-primary)]">
            🛒 Tu carrito está limpio. Añade lo que falta en casa.
          </h4>
          <p className="text-xs text-[var(--ink-tertiary)] mt-2 max-w-md mx-auto">
            El personal de servicio puede agregar faltantes con 1 toque o el sistema detecta lo que está por agotarse en la alacena.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={() => {
                audio.success();
                setIsQuickStaffOpen(true);
              }}
              className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-[var(--terracotta)] to-[var(--ember)] hover:brightness-110 rounded-2xl transition-all shadow-lg shadow-[var(--terracotta)]/30 active:scale-95"
            >
              📝 ¿Qué Falta en Casa?
            </button>
            <button
              onClick={() => {
                audio.success();
                onAutoGenerateFromPantry();
              }}
              className="px-5 py-3 text-xs font-bold text-[var(--gold)] bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 border border-[var(--gold)]/30 rounded-2xl transition-all"
            >
              ⚡ Auto-Detectar Faltantes de Casa
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
                    <ShoppingItemCard
                      key={item.id}
                      item={item}
                      onToggle={handleToggleItem}
                      onUpdateQuantity={handleUpdateItemQuantity}
                      onRemove={handleRemoveItem}
                      onShowQr={handleShowQrItem}
                      money={money}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. Botón Flotante Gigante al Finalizar para Guardar en Casa */}
      {metrics.inCartCount > 0 && (
        <div className="sticky bottom-24 md:bottom-6 z-30">
          <div className="max-w-xl mx-auto p-2 bg-[var(--bg-elevated)]/90 backdrop-blur-xl rounded-2xl border border-emerald-500/40 shadow-2xl">
            <button
              onClick={handleFinishPurchase}
              className="w-full py-4 px-6 rounded-xl text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-950/60"
            >
              <Warehouse className="w-5 h-5" />
              <span>Guardar {metrics.inCartCount} artículos comprados en casa</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal: Agregar Artículo Manual a la Lista */}
      {isManualAddOpen && (
        <div role="dialog" aria-modal="true" aria-label="Agregar artículo" onKeyDown={(e) => { if (e.key === 'Escape') setIsManualAddOpen(false); }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md max-h-[90dvh] overflow-y-auto rounded-3xl bg-[var(--bg-sunken)] border border-white/10 shadow-2xl p-6 space-y-4">
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
                  className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-white/10 text-white text-sm focus:outline-none focus:border-emerald-500"
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
                    step="0.01"
                    min="0.01"
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
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-white/10 text-white text-sm"
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
                    list="shopping-stores-datalist"
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
                    placeholder="Costco, City Market..."
                  />
                  <datalist id="shopping-stores-datalist">
                    {getCatalogs().stores.map((s) => (
                      <option key={s.id} value={s.name} />
                    ))}
                  </datalist>
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
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-elevated)] border border-white/10 text-white text-sm"
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
      {selectedQrItem && <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white">Abriendo herramienta…</div>}><ItemQrModal
        isOpen={!!selectedQrItem}
        onClose={() => setSelectedQrItem(null)}
        item={selectedQrItem}
        activeHouse={activeHouse}
      />
      </Suspense>}

      {/* Modal: Ticket QR de Orden Maestro */}
      {isOrderTicketQrOpen && <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white">Abriendo herramienta…</div>}><ShoppingListQrTicketModal
        isOpen={isOrderTicketQrOpen}
        onClose={() => setIsOrderTicketQrOpen(false)}
        shoppingList={enrichedList}
        activeHouse={activeHouse}
        totalEstimatedMxn={metrics.totalEstimatedMxn}
      />
      </Suspense>}

      {/* Modal: Librito de Códigos QR para Personal de Servicio */}
      {isQrBookletOpen && <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white">Abriendo herramienta…</div>}><PantryQrBookletModal
        isOpen={isQrBookletOpen}
        onClose={() => setIsQrBookletOpen(false)}
        products={products}
        activeHouse={activeHouse}
        onQuickAddToShoppingList={onAddItem}
      />
      </Suspense>}

      {/* Modal: ¿Qué Falta en Casa? (Apuntar Rápido) */}
      {isQuickStaffOpen && <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white">Abriendo herramienta…</div>}><QuickStaffShoppingModal
        isOpen={isQuickStaffOpen}
        onClose={() => setIsQuickStaffOpen(false)}
        onAddItem={onAddItem}
      />
      </Suspense>}

      {/* Modal Editorial: Lista de Compras Imprimible / Exportar PDF */}
      {isPrintModalOpen && <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white">Abriendo herramienta…</div>}><PrintableShoppingListModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        shoppingList={enrichedList}
        activeHouse={activeHouse}
        totalEstimatedMxn={metrics.totalEstimatedMxn}
      />
      </Suspense>}

      {/* Modal: Importador Bidireccional Inteligente & OCR */}
      {isSmartImportOpen && <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white">Abriendo herramienta…</div>}><SmartListImportModal
        isOpen={isSmartImportOpen}
        onClose={() => setIsSmartImportOpen(false)}
        initialSubTab={smartImportInitial.subTab}
        initialPhotoListMode={smartImportInitial.photoListMode}
        onImportItems={handleBatchImportItems}
        onImportDirectToPantry={(items) => {
          if (onCompletePurchaseToPantry) {
            return onCompletePurchaseToPantry(items);
          } else {
            items.forEach((it) => onAddItem(it));
          }
        }}
        existingProducts={products}
        zones={zones}
        activeHouse={activeHouse}
      />
      </Suspense>}

      {/* Modal: Reconciliación de Ticket y Costo Real de Compra */}
      {isReconciliationOpen && <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white">Abriendo herramienta…</div>}><ReceiptReconciliationModal
        currency={currency}
        isOpen={isReconciliationOpen}
        onClose={() => setIsReconciliationOpen(false)}
        checkedItems={enrichedList.filter((i) => i.checked)}
        onConfirmPurchase={(purchasePayload) => {
          onCompletePurchaseToPantry(purchasePayload);
          setIsWalkingMode(false);
        }}
      />
      </Suspense>}

      {/* Modal: Canasta Básica Semanal del Hogar */}
      {isWeeklyStaplesOpen && <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white">Abriendo herramienta…</div>}><WeeklyStaplesModal
        isOpen={isWeeklyStaplesOpen}
        onClose={() => setIsWeeklyStaplesOpen(false)}
        shoppingList={shoppingList}
        products={products}
        onAddStaples={(items) => {
          items.forEach((it) => onAddItem(it));
        }}
      />
      </Suspense>}

      {/* Modal: Comparador de Precios Multitienda & Ahorro */}
      {isPriceComparisonOpen && <Suspense fallback={<div role="status" className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center text-white">Abriendo herramienta…</div>}><PriceComparisonModal
        isOpen={isPriceComparisonOpen}
        onClose={() => setIsPriceComparisonOpen(false)}
        shoppingList={enrichedList}
        onAddShoppingItem={onAddItem}
      />
      </Suspense>}


      {/* Botón Flotante Permanente: Modo Súper (Fase 8.5) */}
      {enrichedList.length > 0 && !isWalkingMode && (
        <button
          onClick={() => {
            audio.superCheck();
            setIsWalkingMode(true);
          }}
          className="fixed bottom-24 md:bottom-6 right-6 z-30 flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-gradient-to-r from-[var(--terracotta)] to-[var(--ember)] text-white font-bold text-sm shadow-xl shadow-[var(--terracotta)]/40 hover:scale-105 active:scale-95 transition-all border border-white/20"
          title="Abrir modo táctil caminando por el súper"
        >
          <span className="text-lg">👟</span>
          <span>Modo Súper</span>
        </button>
      )}

      {/* MODO CAMINANDO POR EL SÚPER (Fase 8.5 - Experiencia Táctil Inmersiva) */}
      {isWalkingMode && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-sunken)] text-[var(--ink-primary)] overflow-y-auto p-4 sm:p-6 pb-28 animate-modal-in">
          {/* Header Sticky con Contador y Barra de Progreso */}
          <div className="sticky top-0 z-20 bg-[var(--bg-base)]/95 backdrop-blur-md -mx-4 -mt-4 sm:-mx-6 sm:-mt-6 px-4 py-3 sm:px-6 border-b border-[var(--border-soft)] shadow-xl">
            {/* Barra de progreso full-width 6px --accent-super */}
            <div className="w-full bg-[var(--bg-elevated)] h-1.5 rounded-full overflow-hidden mb-3">
              <div 
                className="bg-[var(--ember)] h-full transition-all duration-300"
                style={{ width: `${metrics.progressPercent}%` }}
              />
            </div>
            
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="font-display text-xl sm:text-2xl font-bold text-white block">
                  {metrics.inCartCount} de {metrics.totalItems} ✓
                </span>
                <span className="font-mono-num text-xs sm:text-sm text-[var(--gold)] font-semibold">
                  ${metrics.totalEstimatedMxn.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN estimado
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Botón Solo Faltantes en Modo Súper Táctil */}
                <button
                  type="button"
                  onClick={() => {
                    audio.click();
                    setHideChecked(!hideChecked);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${
                    hideChecked
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
                      : 'bg-[var(--bg-elevated)] text-gray-300 border-[var(--border-strong)]'
                  }`}
                  title="Ocultar los artículos ya metidos al carrito"
                >
                  <span>{hideChecked ? '👁️ Solo Faltantes' : '👁️ Ver Todos'}</span>
                </button>

                {metrics.inCartCount > 0 && (
                  <button
                    onClick={handleFinishPurchase}
                    className="px-3 sm:px-4 py-2 rounded-xl text-xs font-bold text-white bg-[var(--success)] hover:bg-[var(--success)]/90 shadow-md flex items-center gap-1.5"
                  >
                    <Warehouse className="w-4 h-4" />
                    <span>Guardar ({metrics.inCartCount})</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    audio.click();
                    setIsWalkingMode(false);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--ink-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--border-soft)] border border-[var(--border-strong)]"
                >
                  ✕ Salir
                </button>
              </div>
            </div>
          </div>

          {/* Pasillos en Modo Caminando */}
          <div className="max-w-3xl mx-auto mt-6 space-y-8">
            {SUPERMARKET_DEPARTMENTS.filter(d => d.id !== 'ALL').map((dept) => {
              const items = groupedByDepartment[dept.id] || [];
              if (items.length === 0) return null;

              return (
                <section key={dept.id} className="space-y-4">
                  {/* Encabezado sticky por pasillo */}
                  <div className="sticky top-16 z-10 py-2.5 px-4 rounded-2xl bg-[var(--bg-elevated)]/90 backdrop-blur-md border border-[var(--border-strong)] flex items-center justify-between shadow-md">
                    <h3 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                      <span>{dept.name}</span>
                    </h3>
                    <span className="font-mono-num text-xs font-bold text-[var(--ember)] bg-[var(--ember)]/10 px-2.5 py-0.5 rounded-full border border-[var(--ember)]/25">
                      {items.filter(i => !i.checked).length} pendientes
                    </span>
                  </div>

                  {/* Artículos en el pasillo: Checkbox 56x56, tipografía 2xl */}
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        data-walk-unchecked={!item.checked ? "true" : undefined}
                        onClick={() => handleToggleWalkingItem(item.id)}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-center gap-4 select-none ${
                          item.checked
                            ? 'bg-[var(--success)]/15 border-[var(--success)]/50 text-[var(--ink-tertiary)]'
                            : 'bg-[var(--bg-elevated)] border-[var(--border-soft)] hover:border-[var(--ember)]/50 text-[var(--ink-primary)] shadow-sm'
                        }`}
                      >
                        {/* Checkbox cuadrado 56x56 con borde 3px */}
                        <div
                          className={`w-14 h-14 min-w-[56px] min-h-[56px] rounded-2xl border-[3px] flex items-center justify-center transition-all shrink-0 ${
                            item.checked
                              ? 'bg-[var(--success)] border-[var(--success)] text-white shadow-lg'
                              : 'border-[var(--ink-primary)] bg-[var(--bg-sunken)] hover:border-[var(--ember)]'
                          }`}
                        >
                          {item.checked && (
                            <svg className="w-8 h-8 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24">
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        {/* Foto del producto */}
                        <ProductPhoto photo={item.photo} alt={item.name} size={56} />

                        {/* Datos del producto en tamaño 2xl */}
                        <div className="min-w-0 flex-1">
                          <span className={`font-display text-xl sm:text-2xl font-bold block leading-snug ${
                            item.checked ? 'line-through text-[var(--ink-tertiary)]' : 'text-white'
                          }`}>
                            {item.name}
                          </span>
                          <div className="flex items-center gap-3 mt-1 text-sm text-[var(--ink-secondary)]">
                            <span className="font-mono-num font-bold text-[var(--ember)] bg-[var(--ember)]/10 px-2.5 py-0.5 rounded-lg border border-[var(--ember)]/25">
                              {item.quantity} {item.unit}
                            </span>
                            <span>•</span>
                            <span>{item.store || 'Supermercado'}</span>
                            {item.estimatedPriceMxn > 0 && (
                              <>
                                <span>•</span>
                                <span className="font-mono-num text-[var(--gold)] font-bold">
                                  ${((item.estimatedPriceMxn || 0) * (item.quantity || 1)).toFixed(2)} MXN
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
