import React, { useState, useMemo } from 'react';
import { 
  BarChart3, PieChart, TrendingUp, AlertTriangle, 
  Clock, ShieldCheck, ChevronDown, ChevronUp, Warehouse, Wine, Sparkles
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { getExpiryStatus } from './InventoryView';

export default function InventoryChartsWidget({
  products = [],
  zones = [],
  activeHouse,
  selectedZone,
  onSelectZone,
  statusFilter,
  onSelectStatusFilter,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const currencySymbol = activeHouse?.currency === 'EUR' ? '€' : '$';
  const currencyCode = activeHouse?.currency || 'MXN';

  // 1. Análisis de Caducidad FEFO
  const expiryStats = useMemo(() => {
    let optimal = 0;
    let warning = 0; // 4-15 días
    let critical = 0; // <= 3 días o vencido
    let noDate = 0;

    products.forEach((p) => {
      if (!p.expiryDate) {
        noDate++;
        return;
      }
      const st = getExpiryStatus(p.expiryDate);
      if (!st) {
        noDate++;
      } else if (st.level === 'expired' || st.level === 'critical') {
        critical++;
      } else if (st.level === 'warning') {
        warning++;
      } else {
        optimal++;
      }
    });

    const total = products.length || 1;
    return {
      optimal,
      warning,
      critical,
      noDate,
      total: products.length,
      pctOptimal: Math.round((optimal / total) * 100),
      pctWarning: Math.round((warning / total) * 100),
      pctCritical: Math.round((critical / total) * 100),
      pctNoDate: Math.round((noDate / total) * 100),
    };
  }, [products]);

  // 2. Análisis por Zona Física (Valor Patrimonial y Cantidad)
  const zoneStats = useMemo(() => {
    const map = {};
    let grandTotalValuation = 0;

    products.forEach((p) => {
      const zName = p.zone || 'Sin Zona';
      const val = (p.quantity || 0) * (p.unitPriceMxn || 0);
      grandTotalValuation += val;

      if (!map[zName]) {
        map[zName] = { name: zName, count: 0, valuation: 0 };
      }
      map[zName].count += 1;
      map[zName].valuation += val;
    });

    const list = Object.values(map).sort((a, b) => b.valuation - a.valuation);
    return {
      list,
      grandTotalValuation,
    };
  }, [products]);

  // 3. Top Categorías por Número de Insumos
  const categoryStats = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      const cat = p.category || 'Otros';
      map[cat] = (map[cat] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [products]);

  return (
    <div className="rounded-2xl bg-[#121622] border border-[#1E2638] overflow-hidden shadow-sm transition-all">
      {/* Header interactivo: en móvil se muestra resumen compacto y botón expandir */}
      <button
        type="button"
        onClick={() => {
          audio.click();
          setIsExpanded(!isExpanded);
        }}
        className="w-full p-3.5 sm:p-4 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white text-xs sm:text-sm truncate">
                Gráficos & Analítica del Hogar
              </span>
              <span className="hidden xs:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono font-bold">
                En Vivo
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">
              Semáforo FEFO ({expiryStats.critical} urgentes) • {zoneStats.list.length} Zonas activas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-2">
          <span className="text-[11px] font-medium text-emerald-400 hidden sm:inline">
            {isExpanded ? 'Ocultar Gráficos' : 'Ver Gráficos Detallados'}
          </span>
          <div className="w-7 h-7 rounded-lg bg-[#1A2030] border border-[#252E42] flex items-center justify-center text-[#94A3B8]">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </button>

      {/* Mini Semáforo Rápido visible siempre (incluso cuando está colapsado) */}
      <div className="px-3.5 sm:px-4 pb-3.5 pt-1 border-t border-[#1E2638]/60">
        <div className="flex items-center justify-between text-[11px] text-[#94A3B8] mb-1.5 font-medium">
          <span className="text-emerald-400 font-bold">Salud del Inventario (FEFO)</span>
          <span className="font-mono text-[10px]">
            {expiryStats.pctOptimal + expiryStats.pctWarning}% Óptimo / Estable
          </span>
        </div>

        {/* Barra Segmentada Responsiva SVG / CSS */}
        <div className="w-full h-3 rounded-full bg-[#1A2030] overflow-hidden flex border border-[#252E42] p-0.5 gap-0.5">
          {expiryStats.optimal > 0 && (
            <div 
              style={{ width: `${expiryStats.pctOptimal}%` }}
              className="h-full bg-emerald-500 rounded-sm transition-all"
              title={`Óptimo: ${expiryStats.optimal} insumos (${expiryStats.pctOptimal}%)`}
            />
          )}
          {expiryStats.warning > 0 && (
            <div 
              style={{ width: `${expiryStats.pctWarning}%` }}
              className="h-full bg-amber-400 rounded-sm transition-all"
              title={`Consumir pronto: ${expiryStats.warning} insumos (${expiryStats.pctWarning}%)`}
            />
          )}
          {expiryStats.critical > 0 && (
            <div 
              style={{ width: `${expiryStats.pctCritical}%` }}
              className="h-full bg-rose-500 rounded-sm transition-all animate-pulse"
              title={`Urgente / Vencido: ${expiryStats.critical} insumos (${expiryStats.pctCritical}%)`}
            />
          )}
          {expiryStats.noDate > 0 && (
            <div 
              style={{ width: `${expiryStats.pctNoDate}%` }}
              className="h-full bg-[#334155] rounded-sm transition-all"
              title={`Sin fecha: ${expiryStats.noDate} insumos (${expiryStats.pctNoDate}%)`}
            />
          )}
        </div>

        {/* Botones de Filtro Rápido en 1 toque */}
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mt-2 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => {
              audio.click();
              onSelectStatusFilter(statusFilter === 'OPTIMAL' ? 'ALL' : 'OPTIMAL');
            }}
            className={`p-1.5 rounded-lg border text-center transition-all ${
              statusFilter === 'OPTIMAL'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-[#161B26] border-[#1E2638] text-[#94A3B8] hover:text-white'
            }`}
          >
            <span className="block text-emerald-400 font-bold">{expiryStats.optimal}</span>
            <span className="truncate block">🟢 Óptimos</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.click();
              onSelectStatusFilter(statusFilter === 'EXPIRING' ? 'ALL' : 'EXPIRING');
            }}
            className={`p-1.5 rounded-lg border text-center transition-all ${
              statusFilter === 'EXPIRING'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-[#161B26] border-[#1E2638] text-[#94A3B8] hover:text-white'
            }`}
          >
            <span className="block text-amber-400 font-bold">{expiryStats.warning}</span>
            <span className="truncate block">🟡 ≤15 días</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audio.click();
              onSelectStatusFilter(statusFilter === 'LOW' ? 'ALL' : 'LOW');
            }}
            className={`p-1.5 rounded-lg border text-center transition-all ${
              statusFilter === 'LOW'
                ? 'bg-rose-500/20 border-rose-500 text-rose-300 font-bold'
                : 'bg-[#161B26] border-[#1E2638] text-[#94A3B8] hover:text-white'
            }`}
          >
            <span className="block text-rose-400 font-bold">{expiryStats.critical}</span>
            <span className="truncate block">🔴 Urgentes</span>
          </button>
        </div>
      </div>

      {/* Contenido Extendido al Abrir el Desplegable */}
      {isExpanded && (
        <div className="p-3.5 sm:p-5 border-t border-[#1E2638] space-y-5 bg-[#0D111A]/60 animate-fade-in">
          
          {/* Gráfico 2: Distribución Patrimonial por Zona */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Warehouse className="w-3.5 h-3.5 text-sky-400" />
                Inversión por Zona del Hogar
              </span>
              <span className="text-[11px] font-mono text-[#94A3B8]">
                Total: {currencySymbol}{Math.round(zoneStats.grandTotalValuation).toLocaleString('es-MX')} {currencyCode}
              </span>
            </div>

            <div className="space-y-2">
              {zoneStats.list.slice(0, 6).map((z) => {
                const pct = zoneStats.grandTotalValuation > 0
                  ? Math.round((z.valuation / zoneStats.grandTotalValuation) * 100)
                  : 0;
                const isSelected = selectedZone === z.name;

                return (
                  <button
                    key={z.name}
                    type="button"
                    onClick={() => {
                      audio.click();
                      onSelectZone(isSelected ? null : z.name);
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-500/50 shadow-sm'
                        : 'bg-[#121622] border-[#1E2638] hover:border-[#2A364E]'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-white truncate">{z.name}</span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">({z.count} arts)</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] shrink-0 ml-2">
                        <span className="text-[#94A3B8]">{pct}%</span>
                        <span className="font-bold text-emerald-400">
                          {currencySymbol}{Math.round(z.valuation).toLocaleString('es-MX')}
                        </span>
                      </div>
                    </div>

                    {/* Barra de Progreso */}
                    <div className="w-full h-1.5 rounded-full bg-[#1A2030] overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          isSelected ? 'bg-sky-400' : 'bg-gradient-to-r from-emerald-500 to-sky-400'
                        }`}
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gráfico 3: Top Categorías en el Hogar */}
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2.5">
              📦 Categorías con Más Insumos
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {categoryStats.map((c) => (
                <div 
                  key={c.name}
                  className="p-2.5 rounded-xl bg-[#121622] border border-[#1E2638] text-center"
                >
                  <span className="text-base font-black text-white font-mono block">
                    {c.count}
                  </span>
                  <span className="text-[10px] text-[#94A3B8] truncate block mt-0.5">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
