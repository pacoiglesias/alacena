import React, { useMemo } from 'react';
import { 
  Sun, AlertCircle, Clock, ShoppingCart, 
  Wine, CheckCircle2, Share2, Sparkles, X, ChevronRight, Utensils 
} from 'lucide-react';
import { audio } from '../../services/audioService';

export default function KitchenDaySummaryModal({
  isOpen,
  onClose,
  products = [],
  shoppingList = [],
  recipes = [],
  activeHouse,
  onAddMissingToShoppingList,
  onCookRecipe,
}) {
  // Hooks al inicio incondicionalmente
  const expiringItems = useMemo(() => {
    const now = new Date();
    return products.filter((p) => {
      if (!p.expirationDate) return false;
      const exp = new Date(p.expirationDate);
      const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
      return diffDays <= 4 && (p.quantity || 0) > 0;
    }).sort((a, b) => new Date(a.expirationDate) - new Date(b.expirationDate));
  }, [products]);

  const lowStockItems = useMemo(() => {
    return products.filter((p) => {
      const isLow = (p.quantity || 0) <= (p.minStock || 0);
      return isLow;
    });
  }, [products]);

  const recommendedWines = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return products.filter((p) => {
      const isWine = p.category?.toLowerCase().includes('vino') || p.category?.toLowerCase().includes('cava') || p.vintage;
      if (!isWine || (p.quantity || 0) <= 0) return false;
      // Ventana de guarda
      if (p.drinkWindowEnd && p.drinkWindowStart) {
        return currentYear >= p.drinkWindowStart && currentYear <= p.drinkWindowEnd;
      }
      return true;
    }).slice(0, 3);
  }, [products]);

  if (!isOpen) return null;

  // Compartir resumen del día por WhatsApp para la cocinera
  const handleShareDaySummary = () => {
    audio.click();
    let text = `☀️ *RESUMEN DIARIO DE COCINA & HOGAR*\n`;
    text += `📍 *${activeHouse?.name?.toUpperCase() || 'RESIDENCIA'}* — ${new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}\n\n`;

    if (expiringItems.length > 0) {
      text += `🚨 *URGE CONSUMIR HOY O MAÑANA (Caducidad Próxima):*\n`;
      expiringItems.forEach((it) => {
        text += `• ${it.name} (${it.quantity} ${it.unit}) — Vence: ${it.expirationDate}\n`;
      });
      text += `\n`;
    } else {
      text += `✅ *Caducidades:* Todos los insumos frescos están en fecha óptima.\n\n`;
    }

    if (lowStockItems.length > 0) {
      text += `⚠️ *INSUMOS POR AGOTARSE EN DESPENSA:*\n`;
      lowStockItems.slice(0, 6).forEach((it) => {
        text += `• ${it.name} (Quedan ${it.quantity} ${it.unit} / Mínimo: ${it.minStock})\n`;
      });
      text += `\n`;
    }

    if (recommendedWines.length > 0) {
      text += `🍷 *SUGERENCIA DE VINO PARA LA CENA:*\n`;
      recommendedWines.forEach((w) => {
        text += `• ${w.name} (${w.vintage || 'Cava'}) — ${w.zone || 'Cava'}\n`;
      });
      text += `\n`;
    }

    text += `_Generado con ALACENA Enterprise_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#1C1814] border border-[#3D3630] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-[#2A2521] bg-gradient-to-r from-[#1C1814] via-[#261E14] to-[#1C1814] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Sun className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-white tracking-tight">
                ☀️ Resumen Diario de Cocina & Hogar
              </h3>
              <p className="text-xs text-[#B8AFA3] mt-0.5">
                Estado matutino de caducidades, insumos críticos y sugerencias del chef
              </p>
            </div>
          </div>
          <button aria-label="Cerrar ajustes"
            onClick={() => { audio.click(); onClose(); }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          
          {/* 1. Caducidades Críticas */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                <span>Urge Consumir en Cocina (≤ 4 Días)</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                {expiringItems.length} insumos
              </span>
            </div>

            {expiringItems.length > 0 ? (
              <div className="space-y-2">
                {expiringItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs bg-black/30 p-2.5 rounded-xl border border-rose-500/20">
                    <div>
                      <span className="text-white font-bold block">{item.name}</span>
                      <span className="text-[11px] text-gray-400">{item.quantity} {item.unit} · {item.zone}</span>
                    </div>
                    <span className="text-rose-400 font-mono font-bold text-[11px] bg-rose-950/60 px-2 py-1 rounded-lg">
                      Vence: {item.expirationDate}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                ✓ No hay alimentos con fecha de caducidad crítica en los próximos 4 días.
              </p>
            )}
          </div>

          {/* 2. Stock Bajo */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                <Clock className="w-4 h-4" />
                <span>Insumos Bajo Mínimo en Despensa</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                {lowStockItems.length} insumos
              </span>
            </div>

            {lowStockItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {lowStockItems.slice(0, 6).map((item) => (
                  <div key={item.id} className="text-xs bg-black/30 p-2.5 rounded-xl border border-amber-500/20 flex items-center justify-between">
                    <span className="text-white font-medium truncate max-w-[140px]">{item.name}</span>
                    <span className="text-amber-400 font-mono font-bold">
                      {item.quantity}/{item.minStock} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">
                ✓ Todo el inventario se encuentra por encima del stock mínimo establecido.
              </p>
            )}
          </div>

          {/* 3. Vinos Sugeridos de Cava */}
          {recommendedWines.length > 0 && (
            <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-300 font-bold text-xs uppercase tracking-wider">
                  <Wine className="w-4 h-4 text-purple-400" />
                  <span>Sugerencia de Cava (Ventana Óptima de Guarda)</span>
                </div>
              </div>

              <div className="space-y-2">
                {recommendedWines.map((wine) => (
                  <div key={wine.id} className="flex items-center justify-between text-xs bg-black/30 p-2.5 rounded-xl border border-purple-500/20">
                    <div>
                      <span className="text-white font-bold block">{wine.name}</span>
                      <span className="text-[11px] text-gray-400">{wine.vintage ? `Añada ${wine.vintage}` : 'Cava'} · {wine.zone}</span>
                    </div>
                    <span className="text-purple-300 font-semibold bg-purple-950/60 px-2 py-1 rounded-lg text-[10px]">
                      Listo para beber
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[#2A2521] bg-[#12100E] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handleShareDaySummary}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Share2 className="w-4 h-4" />
            <span>📲 Enviar Reporte a Cocina por WhatsApp</span>
          </button>

          <button
            onClick={() => { audio.click(); onClose(); }}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all text-center"
          >
            Cerrar Resumen
          </button>
        </div>

      </div>
    </div>
  );
}
