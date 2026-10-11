import React, { useState, useMemo } from 'react';
import { 
  Search, Plus, Filter, AlertTriangle, CheckCircle, 
  Trash2, Pencil, ArrowUpDown, DollarSign, Layers, Warehouse 
} from 'lucide-react';
import { audio } from '../../services/audioService';
import ZonesBar from '../zones/ZonesBar';

export default function InventoryView({
  products,
  zones,
  onOpenManualModal,
  onEditProduct,
  onDeleteProduct,
  onUpdateQuantity,
  onEditZone,
  onAddZone,
}) {
  const [search, setSearch] = useState('');
  const [selectedZone, setSelectedZone] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, OPTIMAL, LOW, OUT

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
      // Zone filter
      if (selectedZone && p.zone !== selectedZone) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;

      // Status filter
      if (statusFilter === 'LOW' && p.quantity > p.minStock) return false;
      if (statusFilter === 'OUT' && p.quantity > 0) return false;
      if (statusFilter === 'OPTIMAL' && p.quantity <= p.minStock) return false;

      // Search query
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

  return (
    <div className="space-y-6">
      
      {/* Top Metrics Cards (Luxury Look in MXN) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Total Artículos */}
        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border border-white/10">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Total de Artículos en Alacena
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">
              {metrics.totalItems}
            </div>
            <span className="text-xs text-gray-400 mt-1 block">
              Distribuidos en {zones.length} zonas físicas
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
            <Warehouse className="w-6 h-6" />
          </div>
        </div>

        {/* Alertas de Reabastecimiento */}
        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border border-white/10">
          <div>
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
              Alertas de Stock Bajo
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-300 mt-1 font-mono">
              {metrics.lowStockCount}
            </div>
            <span className="text-xs text-gray-400 mt-1 block">
              Artículos por debajo del mínimo
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/25 text-amber-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Valuación Patrimonial en MXN */}
        <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border border-white/10">
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              Valuación Total de Inventario
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">
              ${metrics.totalValuationMxn.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-emerald-400 font-sans font-bold">MXN</span>
            </div>
            <span className="text-xs text-gray-400 mt-1 block">
              Precios estrictamente en Pesos Mexicanos
            </span>
          </div>
          <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Main Content Area */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5">
        
        {/* Action Bar: Search + Filters + Big Emerald Capture Button */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por artículo, zona, tienda o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Prominent "+ Capturar Producto" Button */}
          <button
            onClick={() => {
              audio.click();
              onOpenManualModal();
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-950/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Capturar Producto</span>
          </button>
        </div>

        {/* Zones Bar (Inline editable chips for Cava, Cuarto Frío, etc.) */}
        <ZonesBar
          zones={zones}
          selectedZone={selectedZone}
          onSelectZone={setSelectedZone}
          onEditZone={onEditZone}
          onAddZone={onAddZone}
          productCountsByZone={productCountsByZone}
        />

        {/* Status Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-gray-400 font-semibold mr-1">Estado:</span>
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
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all shrink-0 ${
                statusFilter === st.id
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* Products Table (Desktop) / Cards (Mobile) */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-white/10 rounded-2xl">
            <Warehouse className="w-10 h-10 text-gray-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">No se encontraron artículos</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Prueba cambiando los filtros o utiliza el botón verde para registrar tu primer artículo.
            </p>
            <button
              onClick={() => {
                audio.click();
                onOpenManualModal();
              }}
              className="mt-4 px-4 py-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all"
            >
              + Capturar Producto Ahora
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="py-3 px-4">Artículo & Categoría</th>
                  <th className="py-3 px-3">Ubicación Física</th>
                  <th className="py-3 px-3">Existencia</th>
                  <th className="py-3 px-3">Costo Unitario ($ MXN)</th>
                  <th className="py-3 px-3">Valuación Total</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredProducts.map((p) => {
                  const isLow = (p.quantity || 0) <= (p.minStock || 0);
                  const isOut = (p.quantity || 0) <= 0;
                  const totalRowValuation = (p.quantity || 0) * (p.unitPriceMxn || 0);

                  return (
                    <tr 
                      key={p.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Name & Category */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5 text-gray-400">
                          <span>{p.category}</span>
                          {p.store && (
                            <>
                              <span>•</span>
                              <span className="text-gray-500">{p.store}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Physical Location */}
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {p.zone}
                        </span>
                      </td>

                      {/* Stock Quantity & Visual Indicator */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <div className="font-mono font-bold text-sm text-white">
                            {p.quantity} <span className="text-xs text-gray-400 font-sans">{p.unit}</span>
                          </div>
                          {isOut ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              AGOTADO
                            </span>
                          ) : isLow ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              STOCK BAJO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              ÓPTIMO
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          Mín: {p.minStock} {p.unit} • Ideal: {p.idealStock} {p.unit}
                        </div>
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3 font-mono text-gray-200">
                        ${(p.unitPriceMxn || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-[10px] text-gray-500">MXN</span>
                      </td>

                      {/* Total Row Valuation */}
                      <td className="py-3 px-3 font-mono font-bold text-emerald-300">
                        ${totalRowValuation.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-[10px] text-gray-500">MXN</span>
                      </td>

                      {/* Actions: + / - buttons, edit, delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Restar */}
                          <button
                            onClick={() => handleAdjustQuantity(p, -1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center justify-center font-bold text-sm transition-all"
                            title="Restar 1 unidad"
                          >
                            -
                          </button>

                          {/* Botón Sumar */}
                          <button
                            onClick={() => handleAdjustQuantity(p, 1)}
                            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 flex items-center justify-center font-bold text-sm transition-all"
                            title="Sumar 1 unidad"
                          >
                            +
                          </button>

                          {/* Botón Editar */}
                          <button
                            onClick={() => {
                              audio.click();
                              onEditProduct(p);
                            }}
                            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors ml-1"
                            title="Editar artículo"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            onClick={() => {
                              if (window.confirm(`¿Eliminar ${p.name} del inventario?`)) {
                                audio.delete();
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="Eliminar artículo"
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

    </div>
  );
}
