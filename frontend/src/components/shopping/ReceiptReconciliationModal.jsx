import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, DollarSign, User, Receipt, 
  Sparkles, AlertCircle, TrendingDown, TrendingUp, X, ShoppingBag 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../../services/audioService';
import { getCatalogs } from '../../services/catalogsService';
import { applyReceivedQuantities, stepForUnit } from '../../utils/householdShopping';
import { formatHouseMoney, houseCurrencyCode, houseCurrencySymbol } from '../../utils/formatMoney';
import DialogLayer from '../layout/DialogLayer';

export default function ReceiptReconciliationModal({
  isOpen,
  onClose,
  checkedItems = [],
  onConfirmPurchase,
  currency = 'MXN',
  activeHouse,
}) {
  // 3.14.0: el dinero sale de la función única, con la casa activa.
  const moneyHouse = activeHouse || { currency };
  // Todos los hooks al inicio incondicionalmente
  const catalogs = useMemo(() => getCatalogs(), []);

  // Cantidad REAL comprada por línea (3.11.0 «Recibir compra»): editable
  // en este modal; 0 = no comprado (no entra a la despensa y la línea
  // sigue pendiente en la lista). Se inicializa con lo que pedía la lista.
  const [receivedQty, setReceivedQty] = useState({});
  React.useEffect(() => {
    if (isOpen) {
      const initial = {};
      checkedItems.forEach((item) => { if (item.id) initial[item.id] = String(item.quantity ?? 1); });
      setReceivedQty(initial);
    }
  }, [isOpen, checkedItems]);

  const receivedMap = useMemo(() => {
    const map = {};
    Object.entries(receivedQty).forEach(([id, value]) => { map[id] = Number(value); });
    return map;
  }, [receivedQty]);
  const { received: receivedItems } = useMemo(
    () => applyReceivedQuantities(checkedItems, receivedMap),
    [checkedItems, receivedMap]
  );

  const totalEstimatedMxn = useMemo(() => {
    return receivedItems.reduce((acc, item) => {
      return acc + ((item.quantity || 1) * (item.estimatedPriceMxn || 0));
    }, 0);
  }, [receivedItems]);

  const [realTotalMxn, setRealTotalMxn] = useState('');
  const [buyerName, setBuyerName] = useState(() => {
    const defaultStaff = catalogs.staff?.[0]?.name || 'Chofer / Compras';
    return defaultStaff;
  });
  const [ticketNotes, setTicketNotes] = useState('');
  const [saving,setSaving] = useState(false), [error,setError] = useState('');
  const submitting = React.useRef(false);

  // Sincronizar precio real inicial SOLO al abrir (con las cantidades de
  // la lista); corregir cantidades después no debe pisar el total tecleado.
  React.useEffect(() => {
    if (isOpen) {
      const initial = checkedItems.reduce((acc, item) => acc + ((item.quantity || 1) * (item.estimatedPriceMxn || 0)), 0);
      setRealTotalMxn(initial.toFixed(2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedRealTotal = Number(realTotalMxn);
  const validTotal = realTotalMxn.trim() !== '' && Number.isFinite(parsedRealTotal) && parsedRealTotal >= 0;
  const varianceMxn = parsedRealTotal - totalEstimatedMxn;
  const variancePct = totalEstimatedMxn > 0 ? (varianceMxn / totalEstimatedMxn) * 100 : 0;
  const isOverBudget = varianceMxn > 0.01;
  const isUnderBudget = varianceMxn < -0.01;

  const handleConfirm = async () => {
    if (!validTotal || submitting.current || !receivedItems.length) {
      if (!receivedItems.length) setError('Marca al menos un artículo como comprado: todos están en 0.');
      return;
    }
    submitting.current=true;setSaving(true);setError('');
    try {
    const result = await onConfirmPurchase({checkedItems:receivedItems,realTotalMxn:parsedRealTotal,buyerName:buyerName || 'Administrador',ticketNotes:ticketNotes.trim(),varianceMxn});
    if(result===false){setError('No se pudo registrar. Tu selección se conserva; revisa los artículos y vuelve a intentar.');return;}
    audio.cook();
    audio.haptic(50);
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    onClose();
    } catch {setError('No se pudo registrar la compra. Tu selección se conserva.');}
    finally {submitting.current=false;setSaving(false);}
  };

  return (
    <DialogLayer label="Guardar mi compra" onClose={() => {if(!submitting.current)onClose();}}>
      <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] border border-[var(--border-strong)] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-[var(--border-soft)] bg-gradient-to-r from-[var(--bg-elevated)] via-[var(--bg-elevated)] to-[var(--bg-elevated)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-white tracking-tight">
                Recibir compra
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                Confirma cuánto compraste de verdad por artículo: eso es lo que entra a la despensa. Lo puesto a 0 sigue pendiente en la lista.
              </p>
            </div>
          </div>
          <button aria-label="Cerrar"
            disabled={saving} onClick={() => { audio.click(); onClose(); }}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5">

          {/* Resumen de Artículos a Transferir */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink-secondary)] mb-2">
              <span>Artículos a ingresar ({receivedItems.length} de {checkedItems.length}) · cantidad real comprada</span>
              <span>Total Estimado: {formatHouseMoney(moneyHouse, totalEstimatedMxn)}</span>
            </div>
            <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {checkedItems.map((item, idx) => {
                const qtyValue = receivedQty[item.id] ?? String(item.quantity ?? 1);
                const bought = Number(qtyValue) > 0;
                return (
                <div key={item.id || idx} className="flex items-center justify-between gap-2 text-xs py-1 border-b border-white/5">
                  <span className={`font-medium truncate max-w-[200px] ${bought ? 'text-white' : 'text-gray-500 line-through'}`}>
                    • {item.name} <span className="text-gray-400">({item.unit})</span>
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <input
                      aria-label={`Cantidad comprada de ${item.name}`}
                      type="number"
                      min="0"
                      step={stepForUnit(item.unit)}
                      value={qtyValue}
                      onChange={(e) => setReceivedQty((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      className="w-20 px-2 py-1 rounded-lg bg-black/40 border border-white/15 text-white font-mono text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setReceivedQty((prev) => ({ ...prev, [item.id]: bought ? '0' : String(item.quantity ?? 1) }))}
                      className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-semibold text-gray-300 hover:text-white"
                    >
                      {bought ? 'No comprado' : 'Deshacer'}
                    </button>
                    <span className="text-emerald-400 font-mono w-16 text-right">
                      {formatHouseMoney(moneyHouse, (Number(qtyValue) > 0 ? Number(qtyValue) : 0) * (item.estimatedPriceMxn || 0))}
                    </span>
                  </span>
                </div>
                );
              })}
            </div>
          </div>

          {/* Comparador de Gasto Real vs Estimado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            
            {/* Estimado de la app */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-[11px] font-semibold text-[var(--ink-tertiary)] block">Estimado en Lista</span>
              <div className="text-xl font-display font-bold text-gray-300 mt-1 font-mono">
                {formatHouseMoney(moneyHouse, totalEstimatedMxn)}
              </div>
              <span className="text-[10px] text-gray-400">Precios promedio de catálogo</span>
            </div>

            {/* Cobro real en caja */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
              <label className="text-[11px] font-bold text-emerald-400 block">
                Total Real Cobrado en Ticket *
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">{houseCurrencySymbol(moneyHouse)}</span>
                <input
                  aria-label="Total pagado" type="number"
                  step="0.01"
                  min="0"
                  value={realTotalMxn}
                  onChange={(e) => setRealTotalMxn(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-black/40 border border-emerald-500/50 text-white font-bold font-mono text-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                  autoFocus
                />
              </div>
              <span className="text-[10px] text-emerald-300/80 mt-1 block">Importe final de caja en {houseCurrencyCode(moneyHouse)}</span>
            </div>

          </div>

          {/* Varianza Presupuestal */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
            isOverBudget 
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
              : isUnderBudget 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-white/5 border-white/10 text-gray-300'
          }`}>
            <div className="flex items-center gap-2">
              {isOverBudget ? (
                <TrendingUp className="w-4 h-4 text-rose-400" />
              ) : isUnderBudget ? (
                <TrendingDown className="w-4 h-4 text-emerald-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-amber-400" />
              )}
              <span className="font-semibold">
                {isOverBudget ? 'Exceso sobre estimado:' : isUnderBudget ? 'Ahorro sobre estimado:' : 'Exacto al estimado'}
              </span>
            </div>
            <span className="font-mono font-bold text-sm">
              {varianceMxn >= 0 ? '+' : '-'}{formatHouseMoney(moneyHouse, Math.abs(varianceMxn))} ({variancePct >= 0 ? `+${variancePct.toFixed(1)}%` : `${variancePct.toFixed(1)}%`})
            </span>
          </div>

          {/* Responsable de la Compra */}
          <div>
            <label className="block text-xs font-bold text-[var(--gold)] mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>Personal que realizó la compra</span>
            </label>
            <select
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
            >
              {catalogs.staff?.map((s) => (
                <option key={s.id || s.name} value={s.name} className="bg-[var(--bg-elevated)] text-white">
                  {s.name} ({s.role || 'Servicio'})
                </option>
              ))}
              <option value="Patrón / Administrador" className="bg-[var(--bg-elevated)] text-white">Patrón / Administrador</option>
            </select>
          </div>

          {/* Folio / Notas de Ticket */}
          <div>
            <label className="block text-xs font-semibold text-[var(--ink-secondary)] mb-1.5">
              Folio de Ticket o Notas (opcional)
            </label>
            <input
              type="text"
              value={ticketNotes}
              onChange={(e) => setTicketNotes(e.target.value)}
              aria-label="Notas de la compra" placeholder="Ej. Ticket #88492 Costco Valle, pago con tarjeta corporativa"
              className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[var(--gold)]"
            />
          </div>

        </div>

        {error && <p role="alert" className="p-4">{error}</p>}
        {/* Footer Actions */}
        <div className="p-6 border-t border-[var(--border-soft)] bg-[var(--bg-base)] flex items-center justify-end gap-3">
          <button
            disabled={saving} onClick={() => { audio.click(); onClose(); }}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>
          
          <button
            disabled={!validTotal || saving || !receivedItems.length} onClick={handleConfirm}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{saving ? 'Registrando compra…' : 'Confirmar e Ingresar a Despensa'}</span>
          </button>
        </div>

      </div>
    </DialogLayer>
  );
}
