import React, { useState, useMemo } from 'react';
import { 
  X, Search, Store, TrendingDown, TrendingUp, Sparkles, 
  DollarSign, ArrowUpDown, Award, CheckCircle2, ShoppingBag, 
  RefreshCw, Calendar, Tag, ShieldCheck, ChevronRight
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { 
  getTrackedProductsComparison, 
  recordPricePoints 
} from '../../services/priceIntelligenceService';
import { notify } from '../../services/notice';

export default function PriceComparisonModal({
  isOpen,
  onClose,
  shoppingList = [],
  onAddShoppingItem,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState('ALL');
  const [refreshKey, setRefreshKey] = useState(0);

  // Obtener comparativas de todos los productos monitoreados
  const comparisons = useMemo(() => {
    return getTrackedProductsComparison();
  }, [refreshKey, isOpen]);

  // Extraer tiendas únicas
  const availableStores = useMemo(() => {
    const set = new Set();
    comparisons.forEach((c) => {
      c.storePrices.forEach((sp) => set.add(sp.store));
    });
    return Array.from(set);
  }, [comparisons]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return comparisons.filter((item) => {
      const matchesSearch = 
        !searchTerm || 
        item.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.canonicalName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStore = 
        selectedStoreFilter === 'ALL' || 
        item.storePrices.some((sp) => sp.store === selectedStoreFilter);

      return matchesSearch && matchesStore;
    });
  }, [comparisons, searchTerm, selectedStoreFilter]);

  // Estadísticas globales
  const stats = useMemo(() => {
    const totalMonitored = comparisons.length;
    const maxSavingsProduct = comparisons.length > 0 ? comparisons[0] : null;
    const storeWins = {};
    comparisons.forEach((c) => {
      if (c.cheapestStore && c.cheapestStore !== 'N/A') {
        storeWins[c.cheapestStore] = (storeWins[c.cheapestStore] || 0) + 1;
      }
    });

    return {
      totalMonitored,
      maxSavingsProduct,
      storeWins,
    };
  }, [comparisons]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[var(--bg-base)] border border-[var(--gold)]/35 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header Modal */}
        <div className="p-4 sm:p-6 border-b border-[var(--border-soft)] bg-gradient-to-r from-[var(--bg-elevated)] via-[var(--bg-elevated)] to-[var(--bg-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-[var(--gold)]/20 to-[var(--ember)]/20 text-[var(--gold)] border border-[var(--gold)]/40 shadow-lg shadow-[var(--gold)]/10">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-[var(--ink-primary)] flex items-center gap-2">
                <span>Inteligencia de Precios & Asesor Multitienda</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  Súper vs. Súper
                </span>
              </h2>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                Compara dónde sale más barato cada insumo entre La Comer, Costco, Walmart, Chedraui y Mercadona
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard de Métricas Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 sm:p-6 border-b border-[var(--border-soft)] bg-[var(--bg-base)]">
          
          <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
            <span className="text-[11px] font-semibold text-[var(--ink-tertiary)] block">Insumos Auditados</span>
            <div className="text-xl font-bold font-mono text-white mt-0.5">
              {stats.totalMonitored}
            </div>
            <span className="text-[10px] text-gray-400">con historial multitienda</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[11px] font-semibold text-emerald-400 block">Mayor Ahorro Cruzado</span>
            <div className="text-xl font-bold font-mono text-emerald-300 mt-0.5">
              ${stats.maxSavingsProduct?.maxDifference?.toFixed(2) || '0.00'} MXN
            </div>
            <span className="text-[10px] text-emerald-400/80 truncate block">
              en {stats.maxSavingsProduct?.displayName || 'Insumos'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/20">
            <span className="text-[11px] font-semibold text-[var(--gold)] block">Líder en Precios Bajos</span>
            <div className="text-xl font-bold font-mono text-[var(--gold)] mt-0.5 truncate">
              {Object.entries(stats.storeWins).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Costco'}
            </div>
            <span className="text-[10px] text-[var(--gold)]/80">
              con {Object.entries(stats.storeWins).sort((a, b) => b[1] - a[1])[0]?.[1] || 0} artículos más baratos
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--ember)]/10 border border-[var(--ember)]/20">
            <span className="text-[11px] font-semibold text-[var(--ember)] block">Brecha de Precios</span>
            <div className="text-xl font-bold font-mono text-[var(--ember)] mt-0.5">
              {stats.maxSavingsProduct?.maxDiffPct || 0}%
            </div>
            <span className="text-[10px] text-[var(--ember)]/80">diferencia máx. entre súper</span>
          </div>

        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-soft)] bg-[var(--bg-base)] flex flex-col sm:flex-row items-center gap-3">
          
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-[var(--ink-tertiary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar insumo (ej. Arroz, Coca Cola, Aceite, Poro, Chile)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-sm text-[var(--ink-primary)] placeholder:text-[var(--ink-tertiary)] focus:outline-none focus:border-[var(--gold)] transition-all"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSelectedStoreFilter('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedStoreFilter === 'ALL'
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-[var(--ink-tertiary)] hover:text-white'
              }`}
            >
              Todas las Tiendas
            </button>
            {availableStores.map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStoreFilter(st)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStoreFilter === st
                    ? 'bg-[var(--gold)] text-[var(--on-gold)] font-bold shadow-md'
                    : 'bg-white/5 text-[var(--ink-tertiary)] hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

        </div>

        {/* Lista de Insumos Comparados */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--border-soft)] rounded-2xl p-6 bg-[var(--bg-base)]">
              <Search className="w-10 h-10 mx-auto text-[var(--ink-tertiary)] mb-2" />
              <h4 className="text-sm font-bold text-white">No se encontraron productos para esta búsqueda</h4>
              <p className="text-xs text-[var(--ink-tertiary)] mt-1 max-w-sm mx-auto">
                Prueba buscando otro término o sube un ticket de compra para que el sistema aprenda más precios automáticamente.
              </p>
            </div>
          ) : (
            filteredProducts.map((item) => (
              <div
                key={item.canonicalName}
                className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-sunken)] border border-[var(--border-soft)] hover:border-[var(--border-strong)] transition-all space-y-3.5"
              >
                {/* Cabecera del Artículo */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <span>{item.displayName}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/10 text-gray-300 text-[10px] font-mono">
                        por {item.unit}
                      </span>
                    </h3>
                    <p className="text-xs text-[var(--ink-tertiary)] mt-0.5">
                      Comparado en {item.storesCount} {item.storesCount === 1 ? 'supermercado' : 'supermercados'}
                    </p>
                  </div>

                  {item.maxDifference > 0 && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <div className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Ahorras hasta ${item.maxDifference.toFixed(2)} ({item.maxDiffPct}%)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Desglose Comparativo por Supermercado */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {item.storePrices.map((sp, sIdx) => {
                    const isCheapest = sIdx === 0;
                    const isMostExpensive = sIdx === item.storePrices.length - 1 && item.storePrices.length > 1;

                    return (
                      <div
                        key={sp.store}
                        className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                          isCheapest
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200 shadow-sm'
                            : isMostExpensive
                            ? 'bg-rose-500/5 border-rose-500/25 text-rose-200'
                            : 'bg-white/5 border-white/5 text-gray-300'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-1.5 font-bold text-xs truncate">
                            {isCheapest && <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                            <span className="truncate">{sp.store}</span>
                          </div>
                          <span className="text-[10px] text-gray-400 block mt-0.5">
                            {new Date(sp.date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-mono font-bold text-sm">
                            ${sp.price.toFixed(2)}
                          </div>
                          {isCheapest ? (
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold uppercase tracking-wider">
                              Ganador 🏆
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">
                              +${(sp.price - item.cheapestPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Resumen de Asesoría */}
                <div className="p-3 rounded-xl bg-black/30 border border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 text-[var(--gold)]">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>
                      <strong>Recomendación:</strong> Compra en <strong>{item.cheapestStore}</strong> a <strong>${item.cheapestPrice.toFixed(2)}</strong> para obtener el mejor rendimiento.
                    </span>
                  </div>

                  {onAddShoppingItem && (
                    <button
                      onClick={() => {
                        audio.click();
                        onAddShoppingItem({
                          name: item.displayName,
                          quantity: 1,
                          unit: item.unit,
                          store: item.cheapestStore,
                          estimatedPriceMxn: item.cheapestPrice,
                        });
                        notify(`✅ "${item.displayName}" agregado a la lista de compras asignado a ${item.cheapestStore} ($${item.cheapestPrice.toFixed(2)})`);
                      }}
                      className="px-3 py-1 rounded-lg bg-[var(--gold)]/15 hover:bg-[var(--gold)]/25 text-[var(--gold)] border border-[var(--gold)]/30 font-bold text-[11px] transition-all flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Agregar con mejor precio</span>
                    </button>
                  )}
                </div>

              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-[var(--border-soft)] bg-[var(--bg-elevated)] flex items-center justify-between">
          <span className="text-xs text-[var(--ink-tertiary)]">
            💡 Los precios se actualizan de forma automática cada vez que escaneas o importas un ticket de supermercado.
          </span>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
