import { useState } from 'react';
import { parseReceiptTotal, receiptFingerprint } from '../../utils/receiptReview';

export default function TicketReview({ items, setItems, selectedIds, setSelectedIds, rawText, store, setStore, onSave, onClose, currency = 'MXN', shoppingList = [] }) {
  const [paid, setPaid] = useState(() => parseReceiptTotal(rawText) ?? '');
  const [reviewed, setReviewed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const selected = items.filter((i) => selectedIds.has(i.id));
  const sum = selected.reduce((total, i) => total + Number(i.quantity) * Number(i.realPrice ?? i.estimatedPriceMxn ?? 0), 0);
  const total = paid === '' ? sum : Number(paid);
  const difference = total - sum;
  const valid = selected.length && selected.every((i) => i.name?.trim() && Number(i.quantity) > 0 && Number.isFinite(Number(i.quantity)) && Number(i.realPrice ?? i.estimatedPriceMxn) >= 0) && Number.isFinite(total) && total >= 0;
  const patch = (id, field, value) => { setReviewed(false); setItems((previous) => previous.map((i) => i.id === id ? { ...i, [field]: value } : i)); };
  const money = (value) => new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(value);
  const save = async () => {
    if (!valid || (Math.abs(difference) > 0.05 && !reviewed) || saving) return;
    setSaving(true);
    try {
      const result = await onSave({ checkedItems: selected.map((i) => ({ ...i, quantity: Number(i.quantity), realPrice: Number(i.realPrice ?? i.estimatedPriceMxn ?? 0), store: store || 'Supermercado' })), realTotalMxn: total, source: 'receipt', receiptFingerprint: receiptFingerprint(rawText, store, selected), ticketNotes: Math.abs(difference) > 0.05 ? `Diferencia revisada: ${difference.toFixed(2)} ${currency}` : 'Ticket revisado' });
      if (result !== false) onClose(); else setMessage('Este ticket ya estaba registrado o no se pudo guardar. Revisa el historial de compras.');
    } catch (error) { setMessage(error.message || 'No se pudo guardar el ticket.'); }
    finally { setSaving(false); }
  };
  return <section className="space-y-3 rounded-2xl border border-emerald-500/30 p-3 text-sm text-white">
    <h3 className="font-bold">Revisa tu compra antes de guardarla</h3>
    <p className="text-xs text-gray-400">Corrige lo que leyó el ticket. Cada precio corresponde a una unidad; el importe se calcula con la cantidad.</p>
    <label className="block text-xs">Tienda<input aria-label="Tienda del ticket" className="block mt-1 w-full p-2 rounded-lg bg-black/30 border border-white/20" value={store} onChange={(e) => setStore(e.target.value)} /></label>
    <div className="space-y-2 max-h-80 overflow-y-auto">
      {items.map((i) => <div key={i.id} className="p-3 bg-white/5 rounded-xl space-y-2">
        <div className="flex items-center gap-2"><input type="checkbox" aria-label={`Incluir ${i.name}`} checked={selectedIds.has(i.id)} onChange={() => { const next = new Set(selectedIds); if (next.has(i.id)) next.delete(i.id); else next.add(i.id); setSelectedIds(next); setReviewed(false); }} /><input aria-label={`Producto ${i.name}`} className="min-w-0 w-full p-2 bg-black/20 rounded-lg" value={i.name} onChange={(e) => patch(i.id, 'name', e.target.value)} /></div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <label>Cantidad<input aria-label={`Cantidad de ${i.name}`} type="number" min="0.001" step="0.001" value={i.quantity} onChange={(e) => patch(i.id, 'quantity', e.target.value)} className="block w-full p-2 bg-black/20 rounded-lg" /></label>
          <label>Unidad<input aria-label={`Unidad de ${i.name}`} value={i.unit} onChange={(e) => patch(i.id, 'unit', e.target.value)} className="block w-full p-2 bg-black/20 rounded-lg" /></label>
          <label>Precio unitario<input aria-label={`Precio de ${i.name}`} type="number" min="0" step="0.01" value={i.realPrice ?? i.estimatedPriceMxn ?? 0} onChange={(e) => patch(i.id, 'realPrice', e.target.value)} className="block w-full p-2 bg-black/20 rounded-lg" /></label>
        </div>
        <div className="flex justify-between text-xs text-gray-400"><span>{shoppingList.some((p) => p.name.toLowerCase() === i.name.toLowerCase()) ? 'Estaba en tu lista' : 'No coincide exactamente con un pendiente'}</span><b>{money(Number(i.quantity || 0) * Number(i.realPrice ?? i.estimatedPriceMxn ?? 0))}</b></div>
      </div>)}
    </div>
    <div className="flex justify-between"><span>Suma de productos seleccionados</span><b>{money(sum)}</b></div>
    <label className="block text-xs">Total pagado del ticket ({currency})<input aria-label="Total pagado del ticket" type="number" min="0" step="0.01" value={paid} placeholder={sum.toFixed(2)} onChange={(e) => { setPaid(e.target.value); setReviewed(false); }} className="block mt-1 w-full p-2 bg-black/30 rounded-lg border border-white/20" /></label>
    {Math.abs(difference) > 0.05 && <label className="flex gap-2 p-3 rounded-xl bg-amber-500/10 text-amber-200 text-xs"><input type="checkbox" checked={reviewed} onChange={(e) => setReviewed(e.target.checked)} />Revisé la diferencia de {money(difference)}. Puede corresponder a descuentos, cargos o artículos no seleccionados.</label>}
    <p className="text-xs text-gray-400">Al guardar, se ingresan los artículos a la despensa y se descuentan de tu lista las cantidades compradas. Los pendientes parciales se conservan.</p>
    {message && <p role="alert" className="text-amber-300">{message}</p>}
    <button disabled={!valid || saving || (Math.abs(difference) > 0.05 && !reviewed)} onClick={save} className="w-full rounded-xl bg-emerald-700 text-white py-3 font-bold disabled:opacity-40">{saving ? 'Guardando…' : `Guardar ${selected.length} artículos y comprobar mi lista`}</button>
  </section>;
}
