import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Plus, Filter, AlertTriangle, CheckCircle, 
  Trash2, Pencil, ArrowUpDown, DollarSign, Layers, Warehouse,
  LayoutGrid, Table as TableIcon, Wine, Sparkles, MapPin, Star, ShoppingCart,
  Clock, FileSpreadsheet, Utensils, Check, QrCode, Radio, Camera, ChevronDown, BarChart3
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { isCavaZone } from '../../utils/cavaGuard';
import ZonesBar from '../zones/ZonesBar';
import ProactiveHomeAdvisor from '../assistant/ProactiveHomeAdvisor';
import ProductPhoto from '../common/ProductPhoto';
import ItemQrModal from '../shopping/ItemQrModal';
import PantryQrBookletModal from '../shopping/PantryQrBookletModal';
import InventoryChartsWidget from './InventoryChartsWidget';
import { confirmDialog } from '../../services/notice';

// Helper: cálculo del estado de caducidad FEFO
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Caducado', days: diffDays, level: 'expired', badgeClass: 'bg-rose-600 text-white border border-rose-400 font-extrabold shadow-sm' };
  if (diffDays <= 3) return { label: `Vence en ${diffDays}d`, days: diffDays, level: 'critical', badgeClass: 'bg-rose-500 text-white border border-rose-300 font-extrabold shadow-sm animate-pulse' };
  if (diffDays <= 15) return { label: `Vence en ${diffDays}d`, days: diffDays, level: 'warning', badgeClass: 'bg-amber-400 text-[var(--on-gold)] border border-amber-200 font-extrabold shadow-sm' };
  return { label: `Vence en ${diffDays}d`, days: diffDays, level: 'good', badgeClass: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' };
}

// Helper: estilo de vino para borde izquierdo y silueta
function getWineStyleColor(wine) {
  const type = `${wine.wineType || ''} ${wine.name || ''} ${wine.category || ''}`.toLowerCase();
  if (type.includes('blanco') || type.includes('chardonnay') || type.includes('sauvignon blanc')) return '#C9B24A';
  if (type.includes('rosado') || type.includes('rosé') || type.includes('rose')) return '#D88A9C';
  if (type.includes('espumoso') || type.includes('champagne') || type.includes('cava') || type.includes('prosecco')) return '#E8D9A0';
  if (type.includes('naranja') || type.includes('orange')) return '#C8752E';
  return '#6B1F2E'; // Tinto por defecto
}

export default function InventoryView({
  products,
  zones,
  onOpenManualModal,
  onEditProduct,
  onDeleteProduct,
  onUpdateQuantity,
  onEditZone,
  onAddZone,
  onOpenWineTasting,
  onOpenShoppingTab,
  onOpenRecipesTab,
  onAddToShoppingList,
  recipes = [],
  activeHouse,
  onOpenScanner,
}) {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPTIMAL, LOW, OUT, EXPIRING
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [quickAddedId, setQuickAddedId] = useState(null);
  const [selectedQrProduct, setSelectedQrProduct] = useState(null);
  const [isQrBookletOpen, setIsQrBookletOpen] = useState(false);
  // Resumen colapsable: abierto en escritorio, colapsado en móvil (la grilla manda)
  const [showSummary, setShowSummary] = useState(
    () => typeof window !== 'undefined' && window.innerWidth >= 1024
  );
  const searchInputRef = useRef(null);

  // Botellas exclusivas en la Cava
  const cavaBottlesCount = useMemo(() => {
    return products
      .filter((p) => isCavaZone(p.zone, zones))
      .reduce((sum, p) => sum + (Number(p.quantity) || 0), 0);
  }, [products, zones]);

  // Atajo global de teclado: presionar '/' o 'Ctrl+K' para enfocar búsqueda
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === '/' || (e.ctrlKey && e.key === 'k')) && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Counts by zone
  const productCountsByZone = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      counts[p.zone] = (counts[p.zone] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Metrics (incluyendo caducidades FEFO)
  const metrics = useMemo(() => {
    let totalItems = products.length;
    let lowStockCount = 0;
    let totalValuationMxn = 0;
    let expiringSoonCount = 0;

    products.forEach((p) => {
      totalValuationMxn += (p.quantity || 0) * (p.unitPriceMxn || 0);
      if (p.quantity <= p.minStock) {
        lowStockCount++;
      }
      const expStatus = getExpiryStatus(p.expiryDate);
      if (expStatus && expStatus.days <= 15) {
        expiringSoonCount++;
      }
    });

    return { totalItems, lowStockCount, totalValuationMxn, expiringSoonCount };
  }, [products]);

  // Filtered products (Filtrados por Residencia Activa México vs España)
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Si el producto tiene hogar asignado y la app tiene un hogar activo seleccionado, filtrar por hogar
      if (activeHouse?.id && p.householdId && p.householdId !== activeHouse.id) {
        return false;
      }
      if (selectedZone && p.zone !== selectedZone) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (statusFilter === 'LOW' && p.quantity > p.minStock) return false;
      if (statusFilter === 'OUT' && p.quantity > 0) return false;
      if (statusFilter === 'OPTIMAL' && p.quantity <= p.minStock) return false;
      if (statusFilter === 'EXPIRING') {
        const expStatus = getExpiryStatus(p.expiryDate);
        if (!expStatus || expStatus.days > 15) return false;
      }

      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesZone = p.zone?.toLowerCase().includes(query);
        const matchesCat = p.category?.toLowerCase().includes(query);
        const matchesStore = p.store?.toLowerCase().includes(query);
        if (!matchesName && !matchesZone && !matchesCat && !matchesStore) return false;
      }

      return true;
    });
  }, [products, selectedZone, selectedCategory, statusFilter, search, activeHouse]);

  const handleAdjustQuantity = (product, delta) => {
    const newQty = Math.max(0, (product.quantity || 0) + delta);
    if (delta > 0) {
      audio.click();
    } else {
      audio.delete();
    }
    onUpdateQuantity(product.id, newQty);
  };

  // Enviar a la lista de compras con 1 solo toque
  const handleQuickAddShopping = (p) => {
    audio.success();
    if (onAddToShoppingList) {
      onAddToShoppingList({
        id: `shop-${Date.now()}`,
        name: p.name,
        quantity: Math.max(1, (p.idealStock || 5) - (p.quantity || 0)),
        unit: p.unit,
        store: p.store || 'Supermercado',
        estimatedPriceMxn: p.unitPriceMxn || 0,
        targetZone: p.zone || 'Alacena Principal',
        checked: false,
      });
      setQuickAddedId(p.id);
      setTimeout(() => setQuickAddedId(null), 2200);
    }
  };

  // Exportar todo el inventario a CSV / Excel con codificación UTF-8
  const handleExportCsv = () => {
    audio.click();
    const headers = ['Nombre', 'Categoría', 'Zona', 'Existencia', 'Unidad', 'Stock Mínimo', 'Precio Unitario MXN', 'Valuación Total MXN', 'Proveedor', 'Caducidad'];
    const rows = products.map((p) => [
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.zone || '').replace(/"/g, '""')}"`,
      p.quantity || 0,
      `"${(p.unit || '').replace(/"/g, '""')}"`,
      p.minStock || 0,
      (p.unitPriceMxn || 0).toFixed(2),
      ((p.quantity || 0) * (p.unitPriceMxn || 0)).toFixed(2),
      `"${(p.store || '').replace(/"/g, '""')}"`,
      `"${p.expiryDate || 'N/A'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_alacena_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isCavaFilter = selectedCategory === 'Vinos & Licores' || selectedZone?.toLowerCase().includes('cava');

  return (
    <div className="space-y-6">
      
      {/* ═════════════════════════════════════════════════════════════════
          RESUMEN COLAPSABLE — métricas, gráficas y asistente.
          La grilla de productos es la protagonista.
         ═════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-elevated)]/60 overflow-hidden">
        <button
          onClick={() => { audio.click(); setShowSummary((v) => !v); }}
          aria-expanded={showSummary}
          className="w-full min-h-[44px] flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]">
            <BarChart3 className="w-4 h-4 text-[var(--gold)]" />
            Resumen
            <span className="text-[11px] font-medium text-[var(--ink-tertiary)]">
              {metrics.totalItems} insumos · {metrics.lowStockCount} por agotarse · {metrics.expiringSoonCount} por vencer
            </span>
          </span>
          <ChevronDown className={`w-4 h-4 text-[var(--ink-tertiary)] transition-transform duration-200 ${showSummary ? 'rotate-180' : ''}`} />
        </button>
        {showSummary && (
          <div className="px-3 pb-4 sm:px-4 space-y-6 animate-fade-in">
      {/* Top Metrics Cards (Luxe Look in MXN) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        
        {/* 1. Total Artículos en Casa */}
        <div className="rounded-2xl p-3.5 sm:p-5 flex items-center justify-between border border-[var(--border-soft)] bg-[var(--bg-elevated)] shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-[var(--ink-secondary)] uppercase tracking-wider block truncate">
              En Despensa & Cava
            </span>
            <div className="text-xl sm:text-3xl font-black text-white mt-0.5 sm:mt-1 font-mono-num truncate">
              {metrics.totalItems} <span className="text-[10px] sm:text-xs text-[var(--ink-secondary)] font-sans font-normal">insumos</span>
            </div>
            <span className="text-[10px] sm:text-xs text-[var(--ink-secondary)] mt-0.5 sm:mt-1 block truncate">
              {zones.length} zonas de tu casa
            </span>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 ml-1.5">
            <Warehouse className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* 2. Stock Bajo / Por Agotarse */}
        <div 
          onClick={() => { audio.click(); setStatusFilter(statusFilter === 'LOW' ? 'ALL' : 'LOW'); }}
          className={`rounded-2xl p-3.5 sm:p-5 flex items-center justify-between border transition-all cursor-pointer shadow-sm ${
            statusFilter === 'LOW'
              ? 'bg-rose-500/10 border-rose-500/50'
              : 'border-[var(--border-soft)] bg-[var(--bg-elevated)] hover:border-rose-500/40'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-rose-400 uppercase tracking-wider block truncate">
              Por Agotarse
            </span>
            <div className="text-xl sm:text-3xl font-black text-rose-400 mt-0.5 sm:mt-1 font-mono-num truncate">
              {metrics.lowStockCount} <span className="text-[10px] sm:text-xs text-[var(--ink-secondary)] font-sans font-normal">faltantes</span>
            </div>
            <span className="text-[10px] sm:text-xs text-[var(--ink-secondary)] mt-0.5 sm:mt-1 block truncate">
              {statusFilter === 'LOW' ? '✓ Filtro activo' : 'Filtrar faltantes'}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0 ml-1.5">
            <AlertTriangle className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* 3. Por Vencer Pronto (Caducidad) */}
        <div 
          onClick={() => { audio.click(); setStatusFilter(statusFilter === 'EXPIRING' ? 'ALL' : 'EXPIRING'); }}
          className={`rounded-2xl p-3.5 sm:p-5 flex items-center justify-between border transition-all cursor-pointer shadow-sm ${
            statusFilter === 'EXPIRING'
              ? 'bg-amber-500/10 border-amber-500/50'
              : 'border-[var(--border-soft)] bg-[var(--bg-elevated)] hover:border-amber-500/40'
          }`}
        >
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-400 uppercase tracking-wider block truncate">
              Vence Pronto (&le;15d)
            </span>
            <div className="text-xl sm:text-3xl font-black text-amber-300 mt-0.5 sm:mt-1 font-mono-num truncate">
              {metrics.expiringSoonCount} <span className="text-[10px] sm:text-xs text-[var(--ink-secondary)] font-sans font-normal">por consumir</span>
            </div>
            <span className="text-[10px] sm:text-xs text-[var(--ink-secondary)] mt-0.5 sm:mt-1 block truncate">
              {statusFilter === 'EXPIRING' ? '✓ Filtro activo' : 'Evita mermas'}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 ml-1.5">
            <Clock className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

        {/* 4. Valor Estimado de la Despensa (Moneda dinámica según el Hogar: EUR o MXN) */}
        <div className="rounded-2xl p-3.5 sm:p-5 flex items-center justify-between border border-[var(--border-soft)] bg-[var(--bg-elevated)] shadow-sm hover:border-emerald-500/30 transition-all">
          <div className="min-w-0">
            <span className="text-[10px] sm:text-[11px] font-bold text-sky-400 uppercase tracking-wider block truncate">
              Valor Despensa
            </span>
            <div className="text-xl sm:text-3xl font-black text-white mt-0.5 sm:mt-1 font-mono-num truncate">
              {activeHouse?.currency === 'EUR' ? '€' : '$'}
              {Math.round(metrics.totalValuationMxn).toLocaleString(activeHouse?.currency === 'EUR' ? 'es-ES' : 'es-MX')}
            </div>
            <span className="text-[10px] sm:text-xs text-[var(--ink-secondary)] mt-0.5 sm:mt-1 block truncate">
              {activeHouse?.currency || 'MXN'} • {activeHouse?.name || 'Hogar'}
            </span>
          </div>
          <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0 ml-1.5">
            <DollarSign className="w-4 h-4 sm:w-6 sm:h-6" />
          </div>
        </div>

      </div>

      {/* ═════════════════════════════════════════════════════════════════
          GRÁFICOS & ANALÍTICA RESPONSIVA (Mobile-First Data Viz)
         ═════════════════════════════════════════════════════════════════ */}
      <InventoryChartsWidget
        products={products}
        zones={zones}
        activeHouse={activeHouse}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
        statusFilter={statusFilter}
        onSelectStatusFilter={setStatusFilter}
      />

      {/* ═════════════════════════════════════════════════════════════════
          ASISTENTE PROACTIVO DEL HOGAR (Recomendaciones, Cava & Desabasto)
         ═════════════════════════════════════════════════════════════════ */}
      <ProactiveHomeAdvisor
        products={products}
        recipes={recipes}
        onAddToShoppingList={onAddToShoppingList}
        onOpenShoppingTab={onOpenShoppingTab}
        onOpenRecipesTab={onOpenRecipesTab}
        onOpenWineTasting={onOpenWineTasting}
      />
          </div>
        )}
      </div>

      {/* ═════════════════════════════════════════════════════════════════
          BANNER PROACTIVO DE REPOSICIÓN INTELIGENTE (Auto-Restock Engine)
         ═════════════════════════════════════════════════════════════════ */}
      {metrics.lowStockCount > 0 && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[var(--wine)]/30 via-[var(--terracotta)]/20 to-[var(--bg-elevated)] border border-[var(--terracotta)]/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[var(--terracotta)]/25 border border-[var(--terracotta)]/50 flex items-center justify-center text-[var(--ember)] shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white font-display">
                  Alerta Proactiva de Abastecimiento
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[var(--terracotta)] text-white text-[10px] font-mono-num font-extrabold tracking-wide">
                  {metrics.lowStockCount} insumos críticos
                </span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                Existen artículos por debajo del inventario mínimo de seguridad. Genera la orden con un solo toque para el personal.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
            <button
              onClick={() => {
                audio.click();
                setStatusFilter('LOW');
              }}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white border border-white/10 transition-all"
            >
              🔍 Ver Faltantes
            </button>
            <button
              onClick={() => {
                audio.click();
                if (onOpenShoppingTab) onOpenShoppingTab();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--terracotta)] hover:bg-[var(--ember)] text-white transition-all shadow-md shadow-[var(--terracotta)]/30 flex items-center gap-2 active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>🛒 Generar Lista del Súper</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="card-luxe p-6 border border-[var(--border-soft)] bg-[var(--bg-elevated)] space-y-5">
        
        {/* Action Bar: Search + View Switcher + "+ Capturar Producto" Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar con atajo de teclado [/] */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[var(--ink-tertiary)]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por insumo, bodega, cepa, zona... (o pulsa /)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white placeholder-[var(--ink-tertiary)] text-xs sm:text-sm focus:outline-none focus:border-[var(--gold)] transition-all"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 p-1 rounded-md text-[var(--ink-secondary)] hover:text-white"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            ) : (
              <kbd className="absolute right-3 top-3 px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-[var(--border-soft)] text-[10px] text-[var(--ink-tertiary)] font-mono pointer-events-none hidden sm:inline">
                /
              </kbd>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón Exportar CSV / Excel */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--bg-base)] hover:bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:text-white border border-[var(--border-soft)] transition-all active:scale-95"
              title="Descargar inventario completo en formato CSV compatible con Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Exportar Excel</span>
            </button>

            {/* Botón Centro de Impresión de Stickers y QR */}
            <button
              onClick={() => {
                audio.click();
                setIsQrBookletOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 text-[var(--gold)] border border-[var(--gold)]/35 transition-all active:scale-95 shadow-sm"
              title="Abrir Centro de Impresión de Stickers para Frascos, Botes y Tablero de Pedidos"
            >
              <QrCode className="w-3.5 h-3.5 text-[var(--gold)]" />
              <span className="hidden sm:inline">Stickers & QR</span>
            </button>

            {/* Botón Menú Zero-Waste Proactivo */}
            {onOpenRecipesTab && (
              <button
                onClick={() => {
                  audio.click();
                  onOpenRecipesTab();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[var(--wine)]/25 hover:bg-[var(--wine)]/40 text-[var(--gold)] border border-[var(--wine-bright)]/40 transition-all active:scale-95"
                title="Ver recetas sugeridas con lo que hay en existencia"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cocinemos Hoy</span>
              </button>
            )}

            {/* View Mode Toggle: Grid Luxe vs Table */}
            <div className="flex items-center p-1 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)]">
              <button
                onClick={() => { audio.click(); setViewMode('grid'); }}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-[var(--wine)] text-white shadow-md' 
                    : 'text-[var(--ink-tertiary)] hover:text-white'
                }`}
                title="Vista Fichas Editoriales Luxe"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => { audio.click(); setViewMode('table'); }}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table' 
                    ? 'bg-[var(--wine)] text-white shadow-md' 
                    : 'text-[var(--ink-tertiary)] hover:text-white'
                }`}
                title="Vista Tabla Contable"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Botón Escanear Cámara / Barcode */}
            {onOpenScanner && (
              <button
                onClick={() => {
                  audio.click();
                  onOpenScanner();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[var(--on-gold)] bg-gradient-to-r from-[var(--gold)] to-[var(--ember)] hover:brightness-110 transition-all shadow-md shadow-[var(--gold)]/25 active:scale-95"
                title="Escanear códigos de barras, etiquetas QR o NFC desde la cámara del móvil"
              >
                <Camera className="w-4 h-4" />
                <span>📸 Escanear</span>
              </button>
            )}

            {/* "+ Capturar Producto" Button */}
            <button
              onClick={() => {
                audio.click();
                onOpenManualModal();
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[var(--accent-qr)] to-[var(--success-bright)] hover:brightness-110 transition-all shadow-md shadow-[var(--accent-qr)]/40 active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Capturar</span>
            </button>
          </div>
        </div>

        {/* Zones Navigation Bar */}
        <ZonesBar
          zones={zones}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          productCountsByZone={productCountsByZone}
          countsByZone={productCountsByZone}
          onEditZone={onEditZone}
          onAddZone={onAddZone}
        />

        {/* 🍷 Banner de Regla Estricta y Maridaje Cava (Solo Botellas) */}
        {isCavaFilter && (
          <div className="p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--wine)]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fade-in shadow-lg">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-[var(--wine)] text-[var(--gold)] border border-[var(--gold)]/30">
                <Wine className="w-4 h-4" />
              </span>
              <div>
                <span className="text-white font-bold block">
                  Cava Principal: <strong className="text-[var(--gold)] font-mono-num">{cavaBottlesCount}</strong> Botellas
                </span>
                <span className="text-[11px] text-[var(--ink-secondary)]">
                  Regla del Sistema: En la Cava sólo se resguardan botellas de vinos, licores y destilados.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[var(--gold)] font-bold flex items-center gap-1 mr-1">
                <Sparkles className="w-3.5 h-3.5" />
                Maridaje:
              </span>
            {[
              { id: 'ALL_WINE', label: '🍷 Todas las Botellas', q: '' },
              { id: 'CARNES', label: '🥩 Cortes & Asados (Tintos)', q: 'tinto' },
              { id: 'PESCADOS', label: '🐟 Pescados & Aves (Blancos)', q: 'blanco' },
              { id: 'BRINDIS', label: '🥂 Espumosos & Cava', q: 'espumoso' },
              { id: 'RESERVA', label: '⭐ Gran Reserva (90+ Pts)', q: 'reserva' },
            ].map((pair) => (
              <button
                key={pair.id}
                onClick={() => {
                  audio.click();
                  setSearch(pair.q);
                }}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  search === pair.q
                    ? 'bg-[var(--wine)] text-white border border-[var(--wine-bright)] shadow-sm'
                    : 'bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:text-white border border-[var(--border-soft)]'
                }`}
              >
                {pair.label}
              </button>
            ))}
            </div>
          </div>
        )}

        {/* Categorías y Filtros de Estado */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                audio.click();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all shrink-0 border ${
                selectedCategory === cat
                  ? 'bg-[var(--wine)]/30 text-[var(--gold)] border-[var(--wine-bright)]/50 font-bold'
                  : 'bg-[var(--bg-base)] text-[var(--ink-tertiary)] hover:text-white border-[var(--border-soft)]'
              }`}
            >
              {cat === 'ALL' ? 'Todas las Categorías' : cat}
            </button>
          ))}

          <div className="h-4 w-px bg-[var(--border-soft)] mx-1 shrink-0" />

          {[
            { id: 'ALL', label: 'Todos' },
            { id: 'OPTIMAL', label: 'Stock Óptimo' },
            { id: 'LOW', label: `Stock Bajo (${metrics.lowStockCount})` },
            { id: 'EXPIRING', label: `⏰ Por Vencer (${metrics.expiringSoonCount})` },
            { id: 'OUT', label: 'Agotados' },
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => {
                audio.click();
                setStatusFilter(st.id);
              }}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                statusFilter === st.id
                  ? 'bg-white/10 text-white border border-[var(--border-strong)]'
                  : 'bg-transparent text-[var(--ink-tertiary)] hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[var(--border-strong)] rounded-3xl bg-[var(--bg-base)]/40 p-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[var(--wine)]/20 border border-[var(--wine-bright)]/30 flex items-center justify-center text-[var(--gold)]">
              {isCavaFilter ? <Wine className="w-8 h-8" /> : <Warehouse className="w-8 h-8" />}
            </div>
            <h4 className="font-display text-xl font-bold text-white">
              {isCavaFilter 
                ? '🍷 Tu cava está esperando su primera botella.' 
                : '📖 La historia comienza con tu primera acción.'}
            </h4>
            <p className="text-xs text-[var(--ink-tertiary)] mt-1 max-w-sm mx-auto">
              {isCavaFilter 
                ? 'Registra cosechas, bodegas, añadas y fichas de cata con valuación en MXN.'
                : 'No se encontraron artículos con los filtros actuales. Registra un nuevo producto o ajusta la búsqueda.'}
            </p>
            <button
              onClick={() => {
                audio.click();
                onOpenManualModal();
              }}
              className="mt-5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[var(--wine)] to-[var(--wine-bright)] hover:brightness-110 rounded-xl transition-all shadow-md"
            >
              {isCavaFilter ? '➕ Añadir Vino a la Cava' : '+ Capturar Producto Ahora'}
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          
          /* ═════════════════════════════════════════════════════════════════
             VISTA FICHAS LUXE (8.4 & 8.6)
             ═════════════════════════════════════════════════════════════════ */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((p) => {
              const isWine = p.isWine || p.category === 'Vinos & Licores';
              const isLow = (p.quantity || 0) <= (p.minStock || 0);
              const isOut = (p.quantity || 0) <= 0;
              const wineColor = getWineStyleColor(p);

              if (isWine) {
                // FICHA VISUAL TIPO SOMMELIER (Fase 8.6 - Formato horizontal 2:1)
                return (
                  <div
                    key={p.id}
                    className="group relative rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-soft)] hover:border-[var(--border-strong)] shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between overflow-hidden"
                    style={{ borderLeftWidth: '6px', borderLeftColor: wineColor }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Izquierda: Silueta SVG de Botella */}
                      <div className="w-12 h-20 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] flex items-center justify-center shrink-0">
                        <svg className="w-6 h-14" viewBox="0 0 24 64" fill="none" stroke={wineColor} strokeWidth="1.8">
                          <path d="M10 2h4v10c0 2 3 5 4 8v38a4 4 0 01-4 4h-4a4 4 0 01-4-4V20c1-3 4-6 4-8V2z" fill={`${wineColor}22`} />
                          <line x1="8" y1="28" x2="16" y2="28" stroke="#E0B441" strokeWidth="1.5" />
                        </svg>
                      </div>

                      {/* Centro: Bodega Fraunces, Vintage y Región */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs text-[var(--gold)] font-semibold">
                          <span>{p.countryFlag || '🍷'}</span>
                          <span className="truncate">{p.country || 'D.O.'} • {p.region || 'Cava'}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-white truncate mt-0.5">
                          {p.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--ink-secondary)] mt-1">
                          {p.vintage && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--gold)] font-mono-num font-bold text-[11px] border border-[var(--border-strong)]">
                              Añada {p.vintage}
                            </span>
                          )}
                          {p.cavaLocation && (
                            <span className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--ink-secondary)] font-mono text-[11px] border border-[var(--border-soft)] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[var(--gold)]" />
                              <span>{p.cavaLocation}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Derecha: Puntaje Sommelier 80-100 Tabular XL */}
                      <div className="text-right shrink-0">
                        <div className="font-display text-2xl font-black text-[var(--gold)] font-mono-num leading-none">
                          {p.sommelierPoints || 92}
                        </div>
                        <div className="flex items-center justify-end gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (p.rating || 5)
                                  ? 'fill-[var(--gold)] text-[var(--gold)]'
                                  : 'text-[var(--border-strong)]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Fila Inferior: Stock en Botellas + Acciones */}
                    <div className="mt-4 pt-3 border-t border-[var(--border-soft)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* 5 mini botellas indicadoras */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <div 
                              key={idx}
                              className={`w-2 h-4 rounded-sm ${
                                idx <= (p.quantity || 0)
                                  ? 'bg-[var(--gold)]'
                                  : 'bg-[var(--border-soft)]'
                              }`}
                              title={`${p.quantity} botellas en cava`}
                            />
                          ))}
                        </div>
                        <span className="font-mono-num text-xs font-bold text-[var(--ink-primary)] ml-1">
                          {p.quantity} {p.unit || 'botellas'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            audio.click();
                            if (onOpenWineTasting) onOpenWineTasting(p);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[var(--wine)]/30 hover:bg-[var(--wine)]/50 border border-[var(--wine-bright)]/40 text-[var(--gold)] text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Wine className="w-3.5 h-3.5" />
                          <span>Descorche & Cata</span>
                        </button>

                        <button
                          onClick={() => {
                            audio.click();
                            setSelectedQrProduct(p);
                          }}
                          className="p-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border-soft)] border border-[var(--border-soft)] text-[var(--gold)] transition-all"
                          title="Ver / Imprimir Etiqueta QR o Grabar NFC de esta botella"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleAdjustQuantity(p, 1)}
                          className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border-soft)] border border-[var(--border-soft)] text-white flex items-center justify-center font-bold text-xs"
                          title="Añadir 1 botella"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }

              // TARJETA DE PRODUCTO ESTÁNDAR
              return (
                <div
                  key={p.id}
                  className="rounded-2xl p-4 bg-[var(--bg-elevated)] border border-[var(--border-soft)] hover:border-[var(--border-strong)] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar / Foto 48px */}
                      <ProductPhoto
                        photo={p.photo}
                        alt={p.name}
                        size={48}
                        fallback={
                          <span className="text-xl">
                            {p.category.includes('Carnes') ? '🥩' :
                             p.category.includes('Lácteos') ? '🧀' :
                             p.category.includes('Frutas') ? '🥬' :
                             p.category.includes('Café') ? '☕' : '🥫'}
                          </span>
                        }
                      />
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-white truncate">
                          {p.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--ink-secondary)] mt-0.5">
                          <span>{p.category}</span>
                          <span>•</span>
                          <span className="truncate">{p.store || 'Supermercado'}</span>
                          {(() => {
                            const exp = getExpiryStatus(p.expiryDate);
                            if (!exp) return null;
                            return (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono-num font-bold flex items-center gap-1 ${exp.badgeClass}`}>
                                <Clock className="w-2.5 h-2.5" />
                                {exp.label}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </div>

                    {/* Stock Badge Pill */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-num font-extrabold uppercase shrink-0 ${
                      isOut
                        ? 'bg-rose-600 text-white border border-rose-400'
                        : isLow
                        ? 'bg-amber-400 text-[var(--on-gold)] border border-amber-300'
                        : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {isOut ? 'Agotado' : isLow ? 'Bajo' : 'OK'}
                    </span>
                  </div>

                  {/* Fila Inferior: Precios, Steppers ± y +Súper */}
                  <div className="mt-4 pt-3 border-t border-[var(--border-soft)] flex items-center justify-between">
                    <div>
                      <div className="font-mono-num text-sm font-black text-white">
                        {p.quantity} <span className="text-xs text-[var(--ink-secondary)] font-sans font-normal">{p.unit}</span>
                      </div>
                      <div className="text-[10px] text-[var(--ink-secondary)] font-mono-num">
                        {activeHouse?.currency === 'EUR' ? '€' : '$'}
                        {(p.unitPriceMxn || 0).toFixed(2)} {activeHouse?.currency || 'MXN'} c/u
                      </div>
                      <div className="w-24 bg-[var(--bg-elevated)] rounded-full h-1.5 mt-1 overflow-hidden border border-[var(--border-strong)]" title={`Capacidad máx: ${p.maxStock || p.idealStock || 6} ${p.unit}`}>
                        <div 
                          className={`h-full rounded-full transition-all ${
                            p.quantity > (p.maxStock || p.idealStock || 6)
                              ? 'bg-amber-400'
                              : p.quantity <= p.minStock
                              ? 'bg-rose-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.round(((p.quantity || 0) / (p.maxStock || p.idealStock || 6)) * 100))}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Botón Rápido: Enviar a Lista de Compras */}
                      <button
                        onClick={() => handleQuickAddShopping(p)}
                        className={`px-2.5 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 active:scale-95 cursor-pointer ${
                          quickAddedId === p.id
                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                            : 'bg-[var(--bg-elevated)] hover:bg-[var(--border-strong)] border-[var(--border-strong)] text-[var(--ink-secondary)] hover:text-white'
                        }`}
                        title="Añadir a la Lista de Compras con 1 solo toque"
                      >
                        {quickAddedId === p.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-[10px]">¡Añadido!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span className="text-[10px] hidden sm:inline">+ Súper</span>
                          </>
                        )}
                      </button>

                      {/* Botones Táctiles Grandes + / - */}
                      <button
                        onClick={() => handleAdjustQuantity(p, -1)}
                        className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] hover:bg-rose-500/20 border border-[var(--border-strong)] hover:border-rose-500/40 text-[var(--ink-secondary)] hover:text-rose-300 flex items-center justify-center font-black text-sm transition-all active:scale-95 cursor-pointer"
                        title="Consumir 1 unidad (-1)"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAdjustQuantity(p, 1)}
                        className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] hover:bg-emerald-500/20 border border-[var(--border-strong)] hover:border-emerald-500/40 text-[var(--ink-secondary)] hover:text-emerald-300 flex items-center justify-center font-black text-sm transition-all active:scale-95 cursor-pointer"
                        title="Ingresar / Reabastecer 1 unidad (+1)"
                      >
                        +
                      </button>
                      <button
                        onClick={() => {
                          audio.click();
                          setSelectedQrProduct(p);
                        }}
                        className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border-strong)] border border-[var(--border-strong)] text-[var(--gold)] flex items-center justify-center transition-all ml-0.5 cursor-pointer"
                        title="Ver / Imprimir Etiqueta QR o Grabar en NFC"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { audio.click(); onEditProduct(p); }}
                        className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border-strong)] border border-[var(--border-strong)] text-[var(--ink-secondary)] hover:text-white flex items-center justify-center transition-all ml-0.5 cursor-pointer"
                        title="Editar insumo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={async () => {
                          audio.click();
                          if (await confirmDialog(`¿Estás seguro de que deseas eliminar permanentemente "${p.name}" del inventario?`)) {
                            onDeleteProduct(p.id);
                          }
                        }}
                        className="w-8 h-8 rounded-xl bg-[var(--bg-elevated)] hover:bg-rose-500/20 border border-[var(--border-soft)] hover:border-rose-500/40 text-[var(--ink-tertiary)] hover:text-rose-400 flex items-center justify-center transition-all ml-0.5"
                        title="Eliminar producto del inventario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Barra de stock 4px sobre el borde inferior */}
                  <div 
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{
                      backgroundColor: isOut ? '#B33A3A' : isLow ? '#C08A1E' : '#2F7D5C'
                    }}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          
          /* ═════════════════════════════════════════════════════════════════
             VISTA TABLA CONTABLE (Optimizada para Móvil y Desktop)
             ═════════════════════════════════════════════════════════════════ */
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-soft)] bg-[var(--bg-elevated)]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[var(--border-soft)] text-[var(--ink-secondary)] uppercase tracking-wider font-bold text-[10px] bg-[var(--bg-elevated)]">
                  <th className="py-3 px-3 sm:px-4">Artículo</th>
                  <th className="py-3 px-3 hidden md:table-cell">Zona</th>
                  <th className="py-3 px-2 sm:px-3">Existencia</th>
                  <th className="py-3 px-3 hidden sm:table-cell">Precio</th>
                  <th className="py-3 px-3 hidden lg:table-cell">Valuación</th>
                  <th className="py-3 px-2 sm:px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-soft)]">
                {filteredProducts.map((p) => {
                  const isLow = (p.quantity || 0) <= (p.minStock || 0);
                  const isOut = (p.quantity || 0) <= 0;
                  const totalRowValuation = (p.quantity || 0) * (p.unitPriceMxn || 0);

                  return (
                    <tr 
                      key={p.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-2.5 sm:py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          {p.isWine && <span className="text-sm sm:text-base">{p.countryFlag || '🍷'}</span>}
                          <span className="font-bold text-white text-xs sm:text-sm truncate max-w-[130px] xs:max-w-[170px] sm:max-w-none block">{p.name}</span>
                          {p.rating > 0 && (
                            <span className="text-[var(--gold)] text-[10px] sm:text-xs font-bold font-mono shrink-0">
                              ⭐ {p.rating}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[var(--ink-secondary)] text-[10px] sm:text-xs">
                          <span className="md:hidden px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono text-[9px]">
                            {p.zone}
                          </span>
                          <span className="truncate">{p.category}</span>
                          <span className="sm:hidden font-mono text-emerald-400/90 font-bold">
                            • ${totalRowValuation.toFixed(0)}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
                          {p.zone}
                        </span>
                      </td>

                      <td className="py-2.5 sm:py-3 px-2 sm:px-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                          <span className="font-mono-num font-bold text-xs sm:text-sm text-white whitespace-nowrap">
                            {p.quantity} <span className="text-[10px] sm:text-xs text-[var(--ink-secondary)] font-sans">{p.unit}</span>
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-extrabold font-mono-num inline-block w-fit ${
                            isOut
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {isOut ? 'AGOTADO' : isLow ? 'BAJO' : 'OK'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono-num text-gray-300 hidden sm:table-cell text-xs">
                        ${(p.unitPriceMxn || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 font-mono-num font-bold text-emerald-400 hidden lg:table-cell text-xs">
                        ${totalRowValuation.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="py-2.5 sm:py-3 px-2 sm:px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleAdjustQuantity(p, -1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--bg-elevated)] hover:bg-rose-500/20 border border-[var(--border-strong)] text-gray-300 hover:text-white flex items-center justify-center font-bold text-xs active:scale-95 cursor-pointer"
                            title="Consumir 1 unidad"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleAdjustQuantity(p, 1)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--bg-elevated)] hover:bg-emerald-500/20 border border-[var(--border-strong)] text-gray-300 hover:text-white flex items-center justify-center font-bold text-xs active:scale-95 cursor-pointer"
                            title="Añadir 1 unidad"
                          >
                            +
                          </button>
                          <button
                            onClick={() => { audio.click(); onEditProduct(p); }}
                            className="p-1.5 text-gray-400 hover:text-white rounded-lg hidden xs:inline-flex"
                            title="Editar insumo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={async () => {
                              audio.click();
                              if (await confirmDialog(`¿Estás seguro de que deseas eliminar "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hidden sm:inline-flex"
                            title="Eliminar del inventario"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal de Etiqueta QR / NFC del Insumo */}
      <ItemQrModal
        isOpen={!!selectedQrProduct}
        onClose={() => setSelectedQrProduct(null)}
        item={selectedQrProduct}
        activeHouse={activeHouse}
      />

      {/* Modal de Catálogo Completo de Stickers QR */}
      <PantryQrBookletModal
        isOpen={isQrBookletOpen}
        onClose={() => setIsQrBookletOpen(false)}
        products={products}
        activeHouse={activeHouse}
        onQuickAddToShoppingList={onAddToShoppingList}
      />

    </div>
  );
}
