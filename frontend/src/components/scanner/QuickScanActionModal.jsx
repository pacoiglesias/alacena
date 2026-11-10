import React, { useState } from 'react';
import {
  X, Minus, Plus, ShoppingCart, Wine, Calendar,
  Sparkles, CheckCircle2, Radio, AlertTriangle, ArrowRight,
  Package, MapPin, Check, Undo2
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { getItemScanUrl } from '../../services/qrPdfService';
import { normalizeItemName } from '../../utils/deduplication';
import { roundQty3 } from '../../utils/householdShopping';

// Cantidades del escaneo rápido (3.11.0): ya no es «1 fijo». En piezas y
// botellas el paso natural es 1; en pesados (kg/l) se ofrecen fracciones
// y todo se redondea a 3 decimales, como en el resto de la app.
const HEAVY_UNITS = ['kg', 'kilos', 'l', 'lt', 'litros'];
export function scanAmountsForUnit(unit) {
  return HEAVY_UNITS.includes(normalizeItemName(unit || 'piezas')) ? [0.1, 0.25, 0.5, 1] : [1];
}

export default function QuickScanActionModal({
  isOpen,
  onClose,
  product,
  onUpdateQuantity,
  onAddToShoppingList,
  onOpenWineTasting,
}) {
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [nfcStatus, setNfcStatus] = useState(null); // null | 'writing' | 'success' | 'error'
  // Cantidad elegida con los chips y último movimiento deshacible de ESTA
  // sesión del modal (3.11.0). Se reinicia al cambiar de producto.
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [lastMovement, setLastMovement] = useState(null);
  const productId = product?.id;
  React.useEffect(() => {
    setSelectedAmount(null);
    setLastMovement(null);
  }, [productId]);

  if (!isOpen || !product) return null;

  const currentQty = product.quantity || 0;
  const isWine = (product.category || '').toLowerCase().includes('vino') ||
                 (product.zone || '').toLowerCase().includes('cava') ||
                 Boolean(product.wineType);
  const amounts = scanAmountsForUnit(product.unit);
  const amount = selectedAmount !== null && amounts.includes(selectedAmount)
    ? selectedAmount
    : (amounts.includes(0.25) ? 0.25 : amounts[0]);
  const fmtAmount = (n) => String(roundQty3(n));

  // Acción 1: Consumir la cantidad elegida
  const handleConsume = (qty = amount) => {
    const used = Math.min(roundQty3(qty), roundQty3(currentQty));
    if (!(used > 0)) return;
    audio.success();
    const newQty = roundQty3(Math.max(0, currentQty - used));
    const previousQty = roundQty3(currentQty);
    const ok = onUpdateQuantity(product.id, newQty, `Consumo rápido QR/NFC (-${used} ${product.unit || 'pza'})`);
    if (ok === false) return;
    setLastMovement({ previousQty });
    setFeedbackMsg(used < roundQty3(qty)
      ? `¡Consumido todo lo que quedaba (${used} ${product.unit || 'piezas'})!`
      : `¡Consumido! Te quedan ${newQty} ${product.unit || 'piezas'}`);
    setTimeout(() => setFeedbackMsg(null), 3000);

    // Si llega a stock mínimo o 0, sugerir agregar a la lista
    if (newQty <= (product.minStock || 0) && onAddToShoppingList) {
      setTimeout(() => {
        audio.alert();
      }, 400);
    }
  };

  // Acción 2: Reabastecer (+ cantidad elegida). En un producto recién
  // descubierto, «registrar» FIJA la cantidad de alta (la elegida), no la
  // suma al 1 temporal con el que nace el descubrimiento: antes el alta
  // guardaba 1 + cantidad sin decirlo.
  const handleRestock = (qty = amount) => {
    const used = roundQty3(qty);
    if (!(used > 0)) return;
    audio.click();
    const newQty = product.isNewDiscovered ? used : roundQty3(currentQty + used);
    const previousQty = roundQty3(currentQty);
    const ok = onUpdateQuantity(product.id, newQty, `Reabastecimiento QR/NFC (+${used} ${product.unit || 'pza'})`);
    if (ok === false) return;
    // En un producto recién descubierto, «deshacer» no aplica: el alta
    // misma es el registro (quedaría un producto fantasma a 0).
    if (!product.isNewDiscovered) setLastMovement({ previousQty });
    setFeedbackMsg(`¡Stock aumentado a ${newQty} ${product.unit || 'piezas'}!`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Deshacer: restaura la cantidad anterior a este último movimiento.
  const handleUndo = () => {
    if (!lastMovement) return;
    audio.click();
    const ok = onUpdateQuantity(product.id, lastMovement.previousQty, 'Deshacer movimiento QR/NFC');
    if (ok === false) return;
    setLastMovement(null);
    setFeedbackMsg(`Deshecho: vuelves a ${lastMovement.previousQty} ${product.unit || 'piezas'}`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  // Acción 3: Mandar al súper
  const handleSendToShopping = () => {
    audio.success();
    if (onAddToShoppingList) {
      onAddToShoppingList(product, amount);
      setFeedbackMsg('🛒 ¡Agregado a tu lista del súper!');
      setTimeout(() => setFeedbackMsg(null), 3000);
    }
  };

  // Acción 4: Grabar en Sticker NFC usando Web NFC API
  const handleWriteNfc = async () => {
    const scanUrl = getItemScanUrl(product);

    if (!('NDEFReader' in window)) {
      setNfcStatus('unsupported');
      return;
    }

    try {
      setNfcStatus('writing');
      audio.click();
      const ndef = new window.NDEFReader();
      await ndef.write({
        records: [
          { recordType: 'url', data: scanUrl }
        ]
      });
      audio.success();
      setNfcStatus('success');
      setTimeout(() => setNfcStatus(null), 4000);
    } catch (err) {
      console.warn('Error escribiendo tag NFC:', err);
      setNfcStatus('error');
      setTimeout(() => setNfcStatus(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-md rounded-3xl bg-[var(--bg-sunken)] border border-[var(--border-soft)] shadow-2xl overflow-hidden flex flex-col text-[var(--ink-primary)] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del modal */}
        <div className="p-5 border-b border-[var(--border-soft)] flex items-center justify-between bg-gradient-to-r from-[var(--bg-elevated)] to-[var(--bg-sunken)]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest text-emerald-400 uppercase">
                Escaneo Rápido • QR / NFC
              </span>
              <h3 className="text-base font-extrabold text-white leading-tight">
                Acción Instantánea
              </h3>
            </div>
          </div>

          <button aria-label="Cerrar"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[var(--ink-secondary)] hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback flotante si ocurrió una acción */}
        {feedbackMsg && (
          <div className="mx-5 mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Ficha del Producto */}
        <div className="p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3 p-4 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-soft)]">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-xs text-[var(--ink-secondary)] mb-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-semibold text-white/90">{product.zone || 'Alacena'}</span>
                <span>•</span>
                <span>{product.category || 'General'}</span>
              </div>
              <h2 className="text-lg font-black text-white leading-snug">
                {product.name}
              </h2>
              {product.barcode && (
                <span className="inline-block mt-1 font-mono text-[10px] text-[var(--ink-secondary)] bg-black/40 px-2 py-0.5 rounded-md border border-white/5">
                  {product.barcode}
                </span>
              )}
            </div>

            {/* Contador de Stock Actual */}
            <div className="text-right shrink-0">
              <span className="text-[10px] font-bold text-[var(--ink-secondary)] uppercase block">
                Existencia
              </span>
              <span className={`text-2xl font-black ${currentQty <= (product.minStock || 0) ? 'text-rose-400' : 'text-emerald-400'}`}>
                {currentQty}
              </span>
              <span className="text-xs text-[var(--ink-secondary)] ml-1 font-medium">
                {product.unit || 'pzas'}
              </span>
            </div>
          </div>

          {/* Chips de cantidad (3.11.0): la cantidad ya no es «1 fijo» */}
          <div>
            <span className="text-[10px] font-bold text-[var(--ink-secondary)] uppercase tracking-wider block mb-1.5">
              Cantidad ({product.unit || 'piezas'})
            </span>
            <div className="flex items-center gap-1.5" role="group" aria-label="Cantidad del movimiento">
              {amounts.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { audio.click(); setSelectedAmount(value); }}
                  aria-pressed={amount === value}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold font-mono transition-all cursor-pointer ${
                    amount === value
                      ? 'bg-emerald-500/25 border border-emerald-400 text-emerald-200'
                      : 'bg-white/5 border border-white/10 text-[var(--ink-secondary)] hover:text-white'
                  }`}
                >
                  {fmtAmount(value)}
                </button>
              ))}
              {lastMovement && !product.isNewDiscovered && (
                <button
                  type="button"
                  onClick={handleUndo}
                  className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 border border-amber-400/40 text-amber-300 hover:bg-amber-500/25 transition-all cursor-pointer"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  Deshacer
                </button>
              )}
            </div>
          </div>

          {/* Botones de Acción Primaria */}
          <div className="grid grid-cols-2 gap-3">
            {product.isNewDiscovered ? (
              /* Si es nuevo: Registrar en Casa */
              <button
                onClick={() => handleRestock(amount)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 hover:from-emerald-500/30 hover:to-emerald-600/20 border border-emerald-500/35 text-emerald-300 font-bold transition-all active:scale-95 cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm font-extrabold text-white">Registrar (+{fmtAmount(amount)})</span>
                <span className="text-[11px] text-emerald-300/80 font-normal mt-0.5">Guardar en despensa</span>
              </button>
            ) : (
              /* Consumir la cantidad elegida si ya existe */
              <button
                onClick={() => handleConsume(amount)}
                disabled={currentQty <= 0}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-600/10 hover:from-rose-500/30 hover:to-rose-600/20 border border-rose-500/35 text-rose-300 font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 mb-2 group-hover:scale-110 transition-transform">
                  <Minus className="w-5 h-5" />
                </div>
                <span className="text-sm font-extrabold text-white">Consumir {fmtAmount(amount)}</span>
                <span className="text-[11px] text-rose-300/80 font-normal mt-0.5">Descontar de casa</span>
              </button>
            )}

            {/* Agregar al Súper */}
            <button
              onClick={handleSendToShopping}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 hover:from-amber-500/30 hover:to-amber-600/20 border border-amber-500/35 text-amber-300 font-bold transition-all active:scale-95 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="text-sm font-extrabold text-white">Pedir al Súper</span>
              <span className="text-[11px] text-amber-300/80 font-normal mt-0.5">+1 a lista de compras</span>
            </button>
          </div>

          {/* Acciones Secundarias */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => handleRestock(amount)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Compré más (+{fmtAmount(amount)})</span>
            </button>

            {isWine && onOpenWineTasting && (
              <button
                onClick={() => {
                  onClose();
                  onOpenWineTasting(product);
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-semibold text-purple-300 transition-all active:scale-95 cursor-pointer"
              >
                <Wine className="w-4 h-4 text-purple-400" />
                <span>Descorchar Vino</span>
              </button>
            )}
          </div>

          {/* Módulo de Grabación NFC */}
          <div className="mt-2 p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-soft)] flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white/90">
                <Radio className="w-4 h-4 text-sky-400" />
                <span>Sticker NFC para este producto</span>
              </div>
              <span className="text-[10px] text-sky-400/80 font-mono">
                {('NDEFReader' in window) ? 'Web NFC Disponible' : 'QR / NFC Ready'}
              </span>
            </div>

            <p className="text-[11px] text-[var(--ink-secondary)] leading-relaxed">
              Pega un sticker NFC (NTAG213/215) en la repisa, frasco o bote. Al acercar tu celular, abrirá esta tarjeta en 1 segundo.
            </p>

            <button
              onClick={handleWriteNfc}
              className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                nfcStatus === 'writing'
                  ? 'bg-sky-500 text-white animate-pulse'
                  : nfcStatus === 'success'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>
                {nfcStatus === 'writing' && 'Acerca el sticker NFC al reverso de tu teléfono...'}
                {nfcStatus === 'success' && '¡Sticker grabado exitosamente!'}
                {nfcStatus === 'error' && 'Error al grabar. Intenta de nuevo.'}
                {nfcStatus === 'unsupported' && 'En iPhone usa la app gratuita NFC Tools o escanea el QR'}
                {!nfcStatus && 'Grabar este insumo en Sticker NFC'}
              </span>
            </button>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="p-4 bg-[var(--bg-elevated)] border-t border-[var(--border-soft)] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-[var(--ink-secondary)] hover:text-white transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
