import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, Check, Plus, Sparkles, CheckSquare, 
  Square, X, Layers, AlertCircle, RefreshCw 
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { areItemsEquivalent } from '../../utils/deduplication';
import { notify } from '../../services/notice';

export const RECURRING_HOUSEHOLD_STAPLES = [
  { id: 'st-1', name: 'Leche Entera Pasteurizada', quantity: 2, unit: 'L', department: 'LACTEOS', store: 'Costco', estimatedPriceMxn: 38.00, emoji: '🥛' },
  { id: 'st-2', name: 'Huevos Blancos Seleccionados', quantity: 30, unit: 'piezas', department: 'LACTEOS', store: 'City Market', estimatedPriceMxn: 95.00, emoji: '🥚' },
  { id: 'st-3', name: 'Aguacate Hass Maduro', quantity: 1.0, unit: 'kg', department: 'VERDURAS', store: 'Supermercado', estimatedPriceMxn: 85.00, emoji: '🥑' },
  { id: 'st-4', name: 'Jitomate Bola Fresco', quantity: 1.5, unit: 'kg', department: 'VERDURAS', store: 'Supermercado', estimatedPriceMxn: 45.00, emoji: '🍅' },
  { id: 'st-5', name: 'Pechuga de Pollo Fresca en Filetes', quantity: 1.5, unit: 'kg', department: 'CARNES', store: 'Costco', estimatedPriceMxn: 175.00, emoji: '🍗' },
  { id: 'st-6', name: 'Carne Molida de Res 90/10', quantity: 1.0, unit: 'kg', department: 'CARNES', store: 'Supermercado', estimatedPriceMxn: 180.00, emoji: '🥩' },
  { id: 'st-7', name: 'Tortillas de Maíz Nixtamalizadas', quantity: 1.0, unit: 'kg', department: 'ABARROTES', store: 'Tortillería', estimatedPriceMxn: 26.00, emoji: '🫓' },
  { id: 'st-8', name: 'Pan de Caja Integral de Grano Entero', quantity: 1, unit: 'paquete', department: 'PANADERIA', store: 'City Market', estimatedPriceMxn: 68.00, emoji: '🍞' },
  { id: 'st-9', name: 'Aceite de Oliva Extra Virgen 1L', quantity: 1, unit: 'L', department: 'ABARROTES', store: 'Costco', estimatedPriceMxn: 240.00, emoji: '🫒' },
  { id: 'st-10', name: 'Café de Especialidad Grano Entero', quantity: 1.0, unit: 'kg', department: 'PANADERIA', store: 'Tostador Local', estimatedPriceMxn: 360.00, emoji: '☕' },
  { id: 'st-11', name: 'Papel Higiénico Doble Hoja', quantity: 1, unit: 'paquete', department: 'LIMPIEZA', store: 'Costco', estimatedPriceMxn: 280.00, emoji: '🧻' },
  { id: 'st-12', name: 'Detergente Líquido para Ropa', quantity: 1, unit: 'botella', department: 'LIMPIEZA', store: 'Costco', estimatedPriceMxn: 210.00, emoji: '🧼' },
];

export default function WeeklyStaplesModal({
  isOpen,
  onClose,
  shoppingList = [],
  products = [],
  onAddStaples,
}) {
  // Todos los hooks al inicio incondicionalmente
  const [selectedIds, setSelectedIds] = useState(() => {
    return new Set(RECURRING_HOUSEHOLD_STAPLES.map((s) => s.id));
  });

  // Evaluar cuáles ya están en la lista de compras o con stock suficiente
  const enrichedStaples = useMemo(() => {
    return RECURRING_HOUSEHOLD_STAPLES.map((staple) => {
      const inShopping = shoppingList.some((it) => areItemsEquivalent(it.name, staple.name));
      const inInventory = products.find((p) => areItemsEquivalent(p.name, staple.name));
      const hasGoodStock = inInventory && (inInventory.quantity || 0) > (inInventory.minStock || 0);

      return {
        ...staple,
        inShopping,
        inInventory,
        hasGoodStock,
      };
    });
  }, [shoppingList, products]);

  if (!isOpen) return null;

  const handleToggleStaple = (id) => {
    audio.click();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleAll = () => {
    audio.click();
    if (selectedIds.size === RECURRING_HOUSEHOLD_STAPLES.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(RECURRING_HOUSEHOLD_STAPLES.map((s) => s.id)));
    }
  };

  const handleConfirmAdd = () => {
    audio.success();
    const itemsToAdd = enrichedStaples
      .filter((s) => selectedIds.has(s.id) && !s.inShopping)
      .map((s) => ({
        id: `staple-${Date.now()}-${Math.random()}`,
        name: s.name,
        quantity: s.quantity,
        unit: s.unit,
        department: s.department,
        store: s.store,
        estimatedPriceMxn: s.estimatedPriceMxn,
        targetZone: 'Alacena Principal',
        checked: false,
      }));

    if (itemsToAdd.length === 0) {
      notify('Los artículos seleccionados ya se encontraban presentes en la lista de compras.');
      onClose();
      return;
    }

    onAddStaples(itemsToAdd);
    onClose();
  };

  const selectedCount = selectedIds.size;
  const newToAddCount = enrichedStaples.filter((s) => selectedIds.has(s.id) && !s.inShopping).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-[var(--border-soft)] bg-gradient-to-r from-[var(--bg-elevated)] via-[var(--bg-elevated)] to-[var(--bg-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-white tracking-tight">
                🧺 Canasta Básica Semanal del Hogar
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                Insumos esenciales recurrentes para llenar la lista en 1 toque sin escribir
              </p>
            </div>
          </div>
          <button
            onClick={() => { audio.click(); onClose(); }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Subbar */}
        <div className="px-6 py-3 border-b border-[var(--border-soft)] bg-white/5 flex items-center justify-between text-xs">
          <button
            onClick={handleToggleAll}
            className="flex items-center gap-2 font-bold text-[var(--gold)] hover:text-[var(--gold)] transition-all"
          >
            {selectedIds.size === RECURRING_HOUSEHOLD_STAPLES.length ? (
              <CheckSquare className="w-4 h-4 text-[var(--gold)]" />
            ) : (
              <Square className="w-4 h-4 text-gray-400" />
            )}
            <span>
              {selectedIds.size === RECURRING_HOUSEHOLD_STAPLES.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
            </span>
          </button>

          <span className="text-[var(--ink-tertiary)]">
            {selectedCount} seleccionados ({newToAddCount} nuevos a agregar)
          </span>
        </div>

        {/* List of Staples */}
        <div className="p-6 overflow-y-auto space-y-2.5 max-h-[55vh]">
          {enrichedStaples.map((staple) => {
            const isSelected = selectedIds.has(staple.id);

            return (
              <div
                key={staple.id}
                onClick={() => handleToggleStaple(staple.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected 
                    ? 'bg-[var(--gold)]/10 border-[var(--gold)]/40 text-white' 
                    : 'bg-white/5 border-white/5 text-[var(--ink-tertiary)] hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-2xl shrink-0">{staple.emoji}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs sm:text-sm font-bold truncate ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                        {staple.name}
                      </span>
                      {staple.inShopping && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold shrink-0">
                          Ya en lista
                        </span>
                      )}
                      {staple.hasGoodStock && !staple.inShopping && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold shrink-0">
                          Hay en despensa ({staple.inInventory.quantity} {staple.inInventory.unit})
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[var(--ink-secondary)] block mt-0.5">
                      {staple.quantity} {staple.unit} · {staple.store} · ~${staple.estimatedPriceMxn.toFixed(2)} MXN
                    </span>
                  </div>
                </div>

                <div className="shrink-0">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-lg bg-[var(--gold)] text-black flex items-center justify-center font-bold">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-lg border border-gray-600 bg-black/20" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--border-soft)] bg-[var(--bg-base)] flex items-center justify-between gap-3">
          <span className="text-xs text-[var(--ink-secondary)]">
            {newToAddCount > 0 ? `Se sumarán ${newToAddCount} insumos a la lista` : 'Sin artículos nuevos'}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { audio.click(); onClose(); }}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleConfirmAdd}
              disabled={newToAddCount === 0}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-all ${
                newToAddCount > 0
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 shadow-lg shadow-amber-950/50 hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-800 text-gray-500 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Agregar a la Lista ({newToAddCount})</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
