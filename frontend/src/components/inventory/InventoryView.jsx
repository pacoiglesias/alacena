import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Filter, AlertTriangle, CheckCircle, 
  Trash2, Pencil, ArrowUpDown, DollarSign, Layers, Warehouse,
  LayoutGrid, Table as TableIcon, Wine, Sparkles, MapPin, Star
} from 'lucide-react';
import { audio } from '../../services/audioService';
import ZonesBar from '../zones/ZonesBar';

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
}) {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPTIMAL, LOW, OUT
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

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

  // Metrics
  const metrics = useMemo(() => {
    let totalItems = products.length;
    let lowStockCount = 0;
    let totalValuationMxn = 0;

    products.forEach((p) => {
      totalValuationMxn += (p.quantity || 0) * (p.unitPriceMxn || 0);
      if (p.quantity <= p.minStock) {
        lowStockCount++;
      }
    });

    return { totalItems, lowStockCount, totalValuationMxn };
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (selectedZone && p.zone !== selectedZone) return false;
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
      if (statusFilter === 'LOW' && p.quantity > p.minStock) return false;
      if (statusFilter === 'OUT' && p.quantity > 0) return false;
      if (statusFilter === 'OPTIMAL' && p.quantity <= p.minStock) return false;

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
  }, [products, selectedZone, selectedCategory, statusFilter, search]);

  const handleAdjustQuantity = (product, delta) => {
    const newQty = Math.max(0, (product.quantity || 0) + delta);
    if (delta > 0) {
      audio.click();
    } else {
      audio.delete();
    }
    onUpdateQuantity(product.id, newQty);
  };

  const isCavaFilter = selectedCategory === 'Vinos & Licores' || selectedZone?.toLowerCase().includes('cava');

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Cards (Luxe Look in MXN) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Artículos */}
        <div className="card-luxe p-5 flex items-center justify-between border border-[#2A2521] bg-[#1C1916]">
          <div>
            <span className="text-[11px] font-bold text-[#8B8378] uppercase tracking-wider block">
              Total de Existencias
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#F2EDE4] mt-1 font-mono-num font-display">
              {metrics.totalItems} <span className="text-xs text-[#8B8378] font-sans font-normal">insumos</span>
            </div>
            <span className="text-xs text-[#8B8378] mt-1 block">
              En {zones.length} zonas físicas auditadas
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#3D8B6E]/15 border border-[#3D8B6E]/30 text-[#3D8B6E]">
            <Warehouse className="w-6 h-6" />
          </div>
        </div>

        {/* Alertas de Reabastecimiento */}
        <div className="card-luxe p-5 flex items-center justify-between border border-[#2A2521] bg-[#1C1916]">
          <div>
            <span className="text-[11px] font-bold text-[#E0B441] uppercase tracking-wider block">
              Stock Crítico / Bajo
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#E0B441] mt-1 font-mono-num font-display">
              {metrics.lowStockCount} <span className="text-xs text-[#8B8378] font-sans font-normal">por agotarse</span>
            </div>
            <span className="text-xs text-[#8B8378] mt-1 block">
              Insumos bajo mínimo de seguridad
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-[#E0B441]/15 border border-[#E0B441]/30 text-[#E0B441]">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Valuación Patrimonial en MXN */}
        <div className="card-luxe p-5 flex items-center justify-between border border-[#2A2521] bg-[#1C1916]">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Valuación de Almacén ($ MXN)
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#F2EDE4] mt-1 font-mono-num font-display">
              ${metrics.totalValuationMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-xs text-[#8B8378] mt-1 block">
              Moneda estricta en Pesos Mexicanos
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="card-luxe p-6 border border-[#2A2521] bg-[#1C1916] space-y-5">
        
        {/* Action Bar: Search + View Switcher + "+ Capturar Producto" Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8B8378]" />
            <input
              type="text"
              placeholder="Buscar por insumo, bodega, cepa, zona..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white placeholder-[#7A7268] text-xs sm:text-sm focus:outline-none focus:border-[#E0B441] transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
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
              <span>+ Capturar Producto</span>
            </button>
          </div>
        </div>

        {/* Zones Navigation Bar */}
        <ZonesBar
          zones={zones}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          countsByZone={productCountsByZone}
          onEditZone={onEditZone}
          onAddZone={onAddZone}
        />

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
            { id: 'LOW', label: 'Stock Bajo' },
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
                    className="group relative rounded-2xl bg-[#12100E] border border-[#2A2521] hover:border-[#3D3630] shadow-sm hover:shadow-md transition-all duration-240 p-4 flex flex-col justify-between overflow-hidden"
                    style={{ borderLeftWidth: '6px', borderLeftColor: wineColor }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Izquierda: Silueta SVG de Botella */}
                      <div className="w-12 h-20 rounded-xl bg-[#1C1916] border border-[#2A2521] flex items-center justify-center shrink-0">
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
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#8B8378] mt-1">
                          {p.vintage && (
                            <span className="px-2 py-0.5 rounded-md bg-[#1C1916] text-[#E0B441] font-mono-num font-bold text-[11px] border border-[#2A2521]">
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

              // TARJETA DE PRODUCTO ESTÁNDAR (Fase 8.4)
              return (
                <div
                  key={p.id}
                  className="card-luxe p-4 bg-[#12100E] border border-[#2A2521] hover:border-[#3D3630] flex flex-col justify-between relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar / Icono 48px */}
                      <div className="w-12 h-12 rounded-xl bg-[#1C1916] border border-[#2A2521] flex items-center justify-center text-lg shrink-0">
                        {p.category.includes('Carnes') ? '🥩' :
                         p.category.includes('Lácteos') ? '🧀' :
                         p.category.includes('Frutas') ? '🥬' :
                         p.category.includes('Café') ? '☕' : '🥫'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-display text-base font-bold text-white truncate">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-[#8B8378] mt-0.5">
                          <span>{p.category}</span>
                          <span>•</span>
                          <span className="truncate">{p.store || 'Supermercado'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stock Badge Pill */}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono-num font-extrabold uppercase shrink-0 ${
                      isOut
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : isLow
                        ? 'bg-[#C08A1E]/20 text-[#E0B441] border border-[#C08A1E]/30'
                        : 'bg-[#2F7D5C]/20 text-[#2F7D5C] border border-[#2F7D5C]/30'
                    }`}>
                      {isOut ? 'Agotado' : isLow ? 'Bajo' : 'OK'}
                    </span>
                  </div>

                  {/* Fila Inferior: Precios y Steppers ± */}
                  <div className="mt-4 pt-3 border-t border-[#2A2521] flex items-center justify-between">
                    <div>
                      <div className="font-mono-num text-sm font-bold text-white">
                        {p.quantity} <span className="text-xs text-[#8B8378] font-sans">{p.unit}</span>
                      </div>
                      <div className="text-[10px] text-[#8B8378] font-mono-num">
                        ${(p.unitPriceMxn || 0).toFixed(2)} MXN c/u
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustQuantity(p, -1)}
                        className="w-8 h-8 rounded-xl bg-[#1C1916] hover:bg-[#2A2521] border border-[#2A2521] text-[#8B8378] hover:text-white flex items-center justify-center font-bold text-sm transition-all"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAdjustQuantity(p, 1)}
                        className="w-8 h-8 rounded-xl bg-[#1C1916] hover:bg-[#2A2521] border border-[#2A2521] text-white flex items-center justify-center font-bold text-sm transition-all"
                      >
                        +
                      </button>
                      <button
                        onClick={() => { audio.click(); onEditProduct(p); }}
                        className="w-8 h-8 rounded-xl bg-[#1C1916] hover:bg-[#2A2521] border border-[#2A2521] text-[#8B8378] hover:text-white flex items-center justify-center transition-all ml-1"
                        title="Editar"
                      >
                        <Pencil className="w-3.5 h-3.5" />
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
                          >
                            <Pencil className="w-3.5 h-3.5" />
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

    </div>
  );
}
