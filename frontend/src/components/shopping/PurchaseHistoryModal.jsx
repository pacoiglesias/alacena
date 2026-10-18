import React, { useState, useEffect } from 'react';
import { 
  X, Check, Trash2, RotateCcw, ShoppingBag, Calendar, 
  Store, AlertCircle, ArrowLeft, CheckCircle2
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { confirmDialog } from '../../services/notice';

export default function PurchaseHistoryModal({ 
  isOpen, 
  onClose, 
  purchases = [], 
  onUndoPurchasedItem 
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[var(--bg-base)] border border-[var(--border-soft)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border-soft)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-[var(--ink-primary)] flex items-center gap-2">
                <span>Historial de Compras & Devolución de Insumos</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                  Auditoría
                </span>
              </h2>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                Revisa los insumos ingresados por compras y elimina o devuelve artículos comprados por error
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {purchases.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[var(--border-soft)] rounded-2xl p-6 bg-[var(--bg-base)]">
              <ShoppingBag className="w-10 h-10 mx-auto text-[var(--ink-tertiary)] mb-2" />
              <h4 className="text-sm font-bold text-white">No hay compras registradas recientemente</h4>
              <p className="text-xs text-[var(--ink-tertiary)] mt-1 max-w-sm mx-auto">
                Cuando finalices tus compras en el supermercado y toques "Ya compré todo", aparecerá aquí el desglose para devoluciones o cancelaciones.
              </p>
            </div>
          ) : (
            purchases.map((receipt, rIdx) => (
              <div 
                key={receipt.id || rIdx} 
                className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] space-y-3"
              >
                <div className="flex items-center justify-between text-xs border-b border-[var(--border-soft)] pb-2">
                  <div className="flex items-center gap-2 text-[var(--gold)] font-mono font-bold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(receipt.date).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <span className="font-mono-num font-bold text-white">
                    Total: {new Intl.NumberFormat('es-MX', { style: 'currency', currency: receipt.currency || 'MXN' }).format(receipt.totalMxn || 0)} {receipt.currency || 'MXN'}
                  </span>
                </div>

                <p className="text-xs text-[var(--ink-secondary)]">Compró: {receipt.buyer || 'Sin registrar'}{receipt.notes ? ` · ${receipt.notes}` : ''}</p>
                <div className="space-y-2">
                  {receipt.items.map((item, iIdx) => (
                    <div 
                      key={item.id || iIdx}
                      className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">
                          {item.name}
                        </div>
                        <div className="text-[var(--ink-tertiary)] text-[11px] mt-0.5">
                          Cantidad: <strong className="text-[var(--gold)] font-mono">{item.quantity} {item.unit}</strong> • Tienda: {item.store || 'Supermercado'}
                          {item.zone && ` • Destino: ${item.zone}`}
                        </div>
                      </div>

                      {/* Botón para eliminar o devolver lo que se compró */}
                      <div>
                        {item.reversed ? (
                          <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[10px] font-bold">
                            Devuelto / Eliminado
                          </span>
                        ) : (
                          <button
                            onClick={async () => {
                              audio.click();
                              if (await confirmDialog(`¿Deseas devolver o eliminar "${item.name}" (${item.quantity} ${item.unit}) del inventario de la alacena? Se descontará la existencia.`)) {
                                onUndoPurchasedItem(receipt.id, item);
                              }
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all font-bold text-[11px]"
                            title="Eliminar o devolver insumo comprado por error"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar / Devolver</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-[var(--border-soft)] bg-[var(--bg-elevated)]">
          <button
            type="button"
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
