import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, Plus, Filter, AlertTriangle, CheckCircle, 
  Trash2, Pencil, ArrowUpDown, DollarSign, Layers, Warehouse,
  LayoutGrid, Table as TableIcon, Wine, Sparkles, MapPin, Star, ShoppingCart,
  Clock, FileSpreadsheet, Utensils, Check, QrCode, Radio
} from 'lucide-react';
import { audio } from '../../services/audioService';
import ZonesBar from '../zones/ZonesBar';
import ProactiveHomeAdvisor from '../assistant/ProactiveHomeAdvisor';
import ItemQrModal from '../shopping/ItemQrModal';
import PantryQrBookletModal from '../shopping/PantryQrBookletModal';

// Helper: cálculo del estado de caducidad FEFO
export function getExpiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const now = new Date();
  const exp = new Date(expiryDate);
  const diffTime = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Caducado', days: diffDays, level: 'expired', badgeClass: 'bg-rose-500/20 text-rose-400 border border-rose-500/40' };
  if (diffDays <= 3) return { label: `Vence en ${diffDays}d`, days: diffDays, level: 'critical', badgeClass: 'bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse' };
  if (diffDays <= 15) return { label: `Vence en ${diffDays}d`, days: diffDays, level: 'warning', badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40' };
  return { label: `Vence en ${diffDays}d`, days: diffDays, level: 'good', badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' };
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
}) {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPTIMAL, LOW, OUT, EXPIRING
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [quickAddedId, setQuickAddedId] = useState(null);
  const [selectedQrProduct, setSelectedQrProduct] = useState(null);
  const [isQrBookletOpen, setIsQrBookletOpen] = useState(false);
  const searchInputRef = useRef(null);

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
      
      {/* Top Metrics Cards (Luxe Look in MXN) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Total Artículos en Casa */}
        <div className="rounded-2xl p-5 flex items-center justify-between border border-[#1E2638] bg-[#121622] shadow-sm hover:border-emerald-500/30 transition-all">
          <div>
            <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider block">
              En Despensa & Cava
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono-num">
              {metrics.totalItems} <span className="text-xs text-[#94A3B8] font-sans font-normal">insumos</span>
            </div>
            <span className="text-xs text-[#94A3B8] mt-1 block">
              Repartidos en {zones.length} zonas de tu casa
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Warehouse className="w-6 h-6" />
          </div>
        </div>

        {/* 2. Stock Bajo / Por Agotarse */}
        <div 
          onClick={() => { audio.click(); setStatusFilter(statusFilter === 'LOW' ? 'ALL' : 'LOW'); }}
          className={`rounded-2xl p-5 flex items-center justify-between border transition-all cursor-pointer shadow-sm ${
            statusFilter === 'LOW'
              ? 'bg-rose-500/10 border-rose-500/50'
              : 'border-[#1E2638] bg-[#121622] hover:border-rose-500/40'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">
              Por Agotarse
            </span>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 mt-1 font-mono-num">
              {metrics.lowStockCount} <span className="text-xs text-[#94A3B8] font-sans font-normal">artículos</span>
            </div>
            <span className="text-xs text-[#94A3B8] mt-1 block">
              {statusFilter === 'LOW' ? '✓ Filtro activo (clic para quitar)' : 'Clic para filtrar faltantes'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* 3. Por Vencer Pronto (Caducidad) */}
        <div 
          onClick={() => { audio.click(); setStatusFilter(statusFilter === 'EXPIRING' ? 'ALL' : 'EXPIRING'); }}
          className={`rounded-2xl p-5 flex items-center justify-between border transition-all cursor-pointer shadow-sm ${
            statusFilter === 'EXPIRING'
              ? 'bg-amber-500/10 border-amber-500/50'
              : 'border-[#1E2638] bg-[#121622] hover:border-amber-500/40'
          }`}
        >
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Vence Pronto (&le;15 días)
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 mt-1 font-mono-num">
              {metrics.expiringSoonCount} <span className="text-xs text-[#94A3B8] font-sans font-normal">por consumir</span>
            </div>
            <span className="text-xs text-[#94A3B8] mt-1 block">
              {statusFilter === 'EXPIRING' ? '✓ Filtro activo (clic para quitar)' : 'Evita tirar comida en el refri'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        {/* 4. Valor Estimado de la Despensa (Moneda dinámica según el Hogar: EUR o MXN) */}
        <div className="rounded-2xl p-5 flex items-center justify-between border border-[#1E2638] bg-[#121622] shadow-sm hover:border-emerald-500/30 transition-all">
          <div>
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
              Valor de tu Despensa
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white mt-1 font-mono-num">
              {activeHouse?.currency === 'EUR' ? '€' : '$'}
              {Math.round(metrics.totalValuationMxn).toLocaleString(activeHouse?.currency === 'EUR' ? 'es-ES' : 'es-MX')}{' '}
              <span className="text-xs text-[#94A3B8] font-sans font-normal">
                {activeHouse?.currency || 'MXN'}
              </span>
            </div>
            <span className="text-xs text-[#94A3B8] mt-1 block">
              Inversión total en {activeHouse?.name || 'la casa'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

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

      {/* ═════════════════════════════════════════════════════════════════
          BANNER PROACTIVO DE REPOSICIÓN INTELIGENTE (Auto-Restock Engine)
         ═════════════════════════════════════════════════════════════════ */}
      {metrics.lowStockCount > 0 && (
        <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#6B1F2E]/30 via-[#C8542A]/20 to-[#1C1916] border border-[#C8542A]/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#C8542A]/25 border border-[#C8542A]/50 flex items-center justify-center text-[#E5724A] shrink-0 shadow-sm">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white font-display">
                  Alerta Proactiva de Abastecimiento
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-[#C8542A] text-white text-[10px] font-mono-num font-extrabold tracking-wide">
                  {metrics.lowStockCount} insumos críticos
                </span>
              </div>
              <p className="text-xs text-[#B8AFA3] mt-0.5">
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
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#C8542A] hover:bg-[#E5724A] text-white transition-all shadow-md shadow-[#C8542A]/30 flex items-center gap-2 active:scale-95"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>🛒 Generar Lista del Súper</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="card-luxe p-6 border border-[#2A2521] bg-[#1C1916] space-y-5">
        
        {/* Action Bar: Search + View Switcher + "+ Capturar Producto" Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar con atajo de teclado [/] */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8B8378]" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar por insumo, bodega, cepa, zona... (o pulsa /)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white placeholder-[#7A7268] text-xs sm:text-sm focus:outline-none focus:border-[#E0B441] transition-all"
            />
            <kbd className="absolute right-3 top-3 px-1.5 py-0.5 rounded bg-[#1C1916] border border-[#2A2521] text-[10px] text-[#8B8378] font-mono pointer-events-none">
              /
            </kbd>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botón Exportar CSV / Excel */}
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#12100E] hover:bg-[#1C1916] text-[#B8AFA3] hover:text-white border border-[#2A2521] transition-all active:scale-95"
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
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#E0B441]/10 hover:bg-[#E0B441]/20 text-[#E0B441] border border-[#E0B441]/35 transition-all active:scale-95 shadow-sm"
              title="Abrir Centro de Impresión de Stickers para Frascos, Botes y Tablero de Pedidos"
            >
              <QrCode className="w-3.5 h-3.5 text-[#E0B441]" />
              <span className="hidden sm:inline">Stickers & QR</span>
            </button>

            {/* Botón Menú Zero-Waste Proactivo */}
            {onOpenRecipesTab && (
              <button
                onClick={() => {
                  audio.click();
                  onOpenRecipesTab();
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#6B1F2E]/25 hover:bg-[#6B1F2E]/40 text-[#E0B441] border border-[#A83A50]/40 transition-all active:scale-95"
                title="Ver recetas sugeridas con lo que hay en existencia"
              >
                <Utensils className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cocinemos Hoy</span>
              </button>
            )}

            {/* View Mode Toggle: Grid Luxe vs Table */}
            <div className="flex items-center p-1 rounded-xl bg-[#12100E] border border-[#2A2521]">
              <button
                onClick={() => { audio.click(); setViewMode('grid'); }}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-[#6B1F2E] text-white shadow-md' 
                    : 'text-[#8B8378] hover:text-white'
                }`}
                title="Vista Fichas Editoriales Luxe"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => { audio.click(); setViewMode('table'); }}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'table' 
                    ? 'bg-[#6B1F2E] text-white shadow-md' 
                    : 'text-[#8B8378] hover:text-white'
                }`}
                title="Vista Tabla Contable"
              >
                <TableIcon className="w-4 h-4" />
              </button>
            </div>

            {/* "+ Capturar Producto" Button */}
            <button
              onClick={() => {
                audio.click();
                onOpenManualModal();
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#1F4D3A] to-[#2E6B52] hover:brightness-110 transition-all shadow-md shadow-[#1F4D3A]/40 active:scale-95"
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

        {/* 🍷 Chips de Maridaje Rápido Sommelier (Visibles en Cava / Vinos) */}
        {isCavaFilter && (
          <div className="p-3 rounded-2xl bg-[#12100E] border border-[#2A2521] flex flex-wrap items-center gap-2 text-xs animate-fade-in">
            <span className="text-[#E0B441] font-bold flex items-center gap-1.5 mr-1">
              <Sparkles className="w-3.5 h-3.5" />
              Maridaje Sugerido:
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
                    ? 'bg-[#6B1F2E] text-white border border-[#A83A50] shadow-sm'
                    : 'bg-[#1C1916] text-[#B8AFA3] hover:text-white border border-[#2A2521]'
                }`}
              >
                {pair.label}
              </button>
            ))}
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
                  ? 'bg-[#6B1F2E]/30 text-[#E0B441] border-[#A83A50]/50 font-bold'
                  : 'bg-[#12100E] text-[#8B8378] hover:text-white border-[#2A2521]'
              }`}
            >
              {cat === 'ALL' ? 'Todas las Categorías' : cat}
            </button>
          ))}

          <div className="h-4 w-px bg-[#2A2521] mx-1 shrink-0" />

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
                  ? 'bg-white/10 text-white border border-[#3D3630]'
                  : 'bg-transparent text-[#8B8378] hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Empty State */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-[#3D3630] rounded-3xl bg-[#12100E]/40 p-6">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#6B1F2E]/20 border border-[#A83A50]/30 flex items-center justify-center text-[#E0B441]">
              {isCavaFilter ? <Wine className="w-8 h-8" /> : <Warehouse className="w-8 h-8" />}
            </div>
            <h4 className="font-display text-xl font-bold text-white">
              {isCavaFilter 
                ? '🍷 Tu cava está esperando su primera botella.' 
                : '📖 La historia comienza con tu primera acción.'}
            </h4>
            <p className="text-xs text-[#8B8378] mt-1 max-w-sm mx-auto">
              {isCavaFilter 
                ? 'Registra cosechas, bodegas, añadas y fichas de cata con valuación en MXN.'
                : 'No se encontraron artículos con los filtros actuales. Registra un nuevo producto o ajusta la búsqueda.'}
            </p>
            <button
              onClick={() => {
                audio.click();
                onOpenManualModal();
              }}
              className="mt-5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#6B1F2E] to-[#852538] hover:brightness-110 rounded-xl transition-all shadow-md"
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
                    className="group relative rounded-2xl bg-[#121622] border border-[#1E2638] hover:border-[#2A364E] shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col justify-between overflow-hidden"
                    style={{ borderLeftWidth: '6px', borderLeftColor: wineColor }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Izquierda: Silueta SVG de Botella */}
                      <div className="w-12 h-20 rounded-2xl bg-[#1A2030] border border-[#252E42] flex items-center justify-center shrink-0">
                        <svg className="w-6 h-14" viewBox="0 0 24 64" fill="none" stroke={wineColor} strokeWidth="1.8">
                          <path d="M10 2h4v10c0 2 3 5 4 8v38a4 4 0 01-4 4h-4a4 4 0 01-4-4V20c1-3 4-6 4-8V2z" fill={`${wineColor}22`} />
                          <line x1="8" y1="28" x2="16" y2="28" stroke="#E0B441" strokeWidth="1.5" />
                        </svg>
                      </div>

                      {/* Centro: Bodega Fraunces, Vintage y Región */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-xs text-[#E0B441] font-semibold">
                          <span>{p.countryFlag || '🍷'}</span>
                          <span className="truncate">{p.country || 'D.O.'} • {p.region || 'Cava'}</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-white truncate mt-0.5">
                          {p.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#94A3B8] mt-1">
                          {p.vintage && (
                            <span className="px-2 py-0.5 rounded-md bg-[#1A2030] text-[#E0B441] font-mono-num font-bold text-[11px] border border-[#252E42]">
                              Añada {p.vintage}
                            </span>
                          )}
                          {p.cavaLocation && (
                            <span className="px-2 py-0.5 rounded-md bg-[#1C1916] text-[#B8AFA3] font-mono text-[11px] border border-[#2A2521] flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#E0B441]" />
                              <span>{p.cavaLocation}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Derecha: Puntaje Sommelier 80-100 Tabular XL */}
                      <div className="text-right shrink-0">
                        <div className="font-display text-2xl font-black text-[#E0B441] font-mono-num leading-none">
                          {p.sommelierPoints || 92}
                        </div>
                        <div className="flex items-center justify-end gap-0.5 mt-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${
                                s <= (p.rating || 5)
                                  ? 'fill-[#E0B441] text-[#E0B441]'
                                  : 'text-[#3D3630]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Fila Inferior: Stock en Botellas + Acciones */}
                    <div className="mt-4 pt-3 border-t border-[#2A2521] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* 5 mini botellas indicadoras */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((idx) => (
                            <div 
                              key={idx}
                              className={`w-2 h-4 rounded-sm ${
                                idx <= (p.quantity || 0)
                                  ? 'bg-[#E0B441]'
                                  : 'bg-[#2A2521]'
                              }`}
                              title={`${p.quantity} botellas en cava`}
                            />
                          ))}
                        </div>
                        <span className="font-mono-num text-xs font-bold text-[#F2EDE4] ml-1">
                          {p.quantity} {p.unit || 'botellas'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            audio.click();
                            if (onOpenWineTasting) onOpenWineTasting(p);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#6B1F2E]/30 hover:bg-[#6B1F2E]/50 border border-[#A83A50]/40 text-[#E0B441] text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Wine className="w-3.5 h-3.5" />
                          <span>Descorche & Cata</span>
                        </button>

                        <button
                          onClick={() => {
                            audio.click();
                            setSelectedQrProduct(p);
                          }}
                          className="p-2 rounded-xl bg-[#1C1916] hover:bg-[#2A2521] border border-[#2A2521] text-[#E0B441] transition-all"
                          title="Ver / Imprimir Etiqueta QR o Grabar NFC de esta botella"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleAdjustQuantity(p, 1)}
                          className="w-8 h-8 rounded-xl bg-[#1C1916] hover:bg-[#2A2521] border border-[#2A2521] text-white flex items-center justify-center font-bold text-xs"
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
                  className="rounded-2xl p-4 bg-[#121622] border border-[#1E2638] hover:border-[#2A364E] shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar / Icono 48px */}
                      <div className="w-12 h-12 rounded-2xl bg-[#1A2030] border border-[#252E42] flex items-center justify-center text-xl shrink-0">
                        {p.category.includes('Carnes') ? '🥩' :
                         p.category.includes('Lácteos') ? '🧀' :
                         p.category.includes('Frutas') ? '🥬' :
                         p.category.includes('Café') ? '☕' : '🥫'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-white truncate">
                          {p.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8] mt-0.5">
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
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isLow
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {isOut ? 'Agotado' : isLow ? 'Bajo' : 'OK'}
                    </span>
                  </div>

                  {/* Fila Inferior: Precios, Steppers ± y +Súper */}
                  <div className="mt-4 pt-3 border-t border-[#1E2638] flex items-center justify-between">
                    <div>
                      <div className="font-mono-num text-sm font-black text-white">
                        {p.quantity} <span className="text-xs text-[#94A3B8] font-sans font-normal">{p.unit}</span>
                      </div>
                      <div className="text-[10px] text-[#94A3B8] font-mono-num">
                        {activeHouse?.currency === 'EUR' ? '€' : '$'}
                        {(p.unitPriceMxn || 0).toFixed(2)} {activeHouse?.currency || 'MXN'} c/u
                      </div>
                      <div className="w-24 bg-[#1A2030] rounded-full h-1.5 mt-1 overflow-hidden border border-[#252E42]" title={`Capacidad máx: ${p.maxStock || p.idealStock || 6} ${p.unit}`}>
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
                            : 'bg-[#1A2030] hover:bg-[#252E42] border-[#252E42] text-[#94A3B8] hover:text-white'
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
                        className="w-9 h-9 rounded-xl bg-[#1A2030] hover:bg-rose-500/20 border border-[#252E42] hover:border-rose-500/40 text-[#94A3B8] hover:text-rose-300 flex items-center justify-center font-black text-sm transition-all active:scale-95 cursor-pointer"
                        title="Consumir 1 unidad (-1)"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAdjustQuantity(p, 1)}
                        className="w-9 h-9 rounded-xl bg-[#1A2030] hover:bg-emerald-500/20 border border-[#252E42] hover:border-emerald-500/40 text-[#94A3B8] hover:text-emerald-300 flex items-center justify-center font-black text-sm transition-all active:scale-95 cursor-pointer"
                        title="Ingresar / Reabastecer 1 unidad (+1)"
                      >
                        +
                      </button>
                      <button
                        onClick={() => {
                          audio.click();
                          setSelectedQrProduct(p);
                        }}
                        className="w-9 h-9 rounded-xl bg-[#1A2030] hover:bg-[#252E42] border border-[#252E42] text-[#E0B441] flex items-center justify-center transition-all ml-0.5 cursor-pointer"
                        title="Ver / Imprimir Etiqueta QR o Grabar en NFC"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { audio.click(); onEditProduct(p); }}
                        className="w-9 h-9 rounded-xl bg-[#1A2030] hover:bg-[#252E42] border border-[#252E42] text-[#94A3B8] hover:text-white flex items-center justify-center transition-all ml-0.5 cursor-pointer"
                        title="Editar insumo"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          audio.click();
                          if (confirm(`¿Estás seguro de que deseas eliminar permanentemente "${p.name}" del inventario?`)) {
                            onDeleteProduct(p.id);
                          }
                        }}
                        className="w-8 h-8 rounded-xl bg-[#1C1916] hover:bg-rose-500/20 border border-[#2A2521] hover:border-rose-500/40 text-[#8B8378] hover:text-rose-400 flex items-center justify-center transition-all ml-0.5"
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
             VISTA TABLA CONTABLE (Para auditoría rápida)
             ═════════════════════════════════════════════════════════════════ */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#2A2521] text-[#8B8378] uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-4">Artículo & Categoría</th>
                  <th className="py-3 px-3">Ubicación Física</th>
                  <th className="py-3 px-3">Existencia</th>
                  <th className="py-3 px-3">Costo Unitario ($ MXN)</th>
                  <th className="py-3 px-3">Valuación Total</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2A2521]">
                {filteredProducts.map((p) => {
                  const isLow = (p.quantity || 0) <= (p.minStock || 0);
                  const isOut = (p.quantity || 0) <= 0;
                  const totalRowValuation = (p.quantity || 0) * (p.unitPriceMxn || 0);

                  return (
                    <tr 
                      key={p.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {p.isWine && <span className="text-base">{p.countryFlag || '🍷'}</span>}
                          <span className="font-bold text-white text-sm">{p.name}</span>
                          {p.rating > 0 && (
                            <span className="text-[#E0B441] text-xs font-bold font-mono">
                              ⭐ {p.rating}/5
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[#8B8378]">
                          <span>{p.category}</span>
                          {p.vintage && (
                            <>
                              <span>•</span>
                              <span className="text-[#E0B441] font-mono-num">Añada {p.vintage}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1F4D3A]/20 text-[#3D8B6E] border border-[#1F4D3A]/40 font-mono">
                          {p.zone}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="font-mono-num font-bold text-sm text-white">
                            {p.quantity} <span className="text-xs text-[#8B8378] font-sans">{p.unit}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono-num ${
                            isOut
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {isOut ? 'AGOTADO' : isLow ? 'STOCK BAJO' : 'ÓPTIMO'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-mono-num text-gray-200">
                        ${(p.unitPriceMxn || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </td>

                      <td className="py-3 px-3 font-mono-num font-bold text-emerald-400">
                        ${totalRowValuation.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleAdjustQuantity(p, -1)}
                            className="w-7 h-7 rounded-lg bg-[#12100E] border border-[#2A2521] text-gray-300 hover:text-white flex items-center justify-center font-bold text-xs"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleAdjustQuantity(p, 1)}
                            className="w-7 h-7 rounded-lg bg-[#12100E] border border-[#2A2521] text-gray-300 hover:text-white flex items-center justify-center font-bold text-xs"
                          >
                            +
                          </button>
                          {(p.isWine || p.category === 'Vinos & Licores') && (
                            <button
                              onClick={() => {
                                audio.click();
                                if (onOpenWineTasting) onOpenWineTasting(p);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-[#6B1F2E]/30 text-[#E0B441] border border-[#A83A50]/40 text-[11px] font-bold flex items-center gap-1 ml-1"
                            >
                              <span>🍷</span>
                              <span>Cata</span>
                            </button>
                          )}
                          <button
                            onClick={() => { audio.click(); onEditProduct(p); }}
                            className="p-1.5 text-gray-400 hover:text-white rounded-lg ml-1"
                            title="Editar insumo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              audio.click();
                              if (confirm(`¿Estás seguro de que deseas eliminar "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-500/20 rounded-lg ml-1"
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
