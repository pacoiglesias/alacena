import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { subscribeNotice, settleConfirm } from '../../services/notice';

/** Host global de avisos: montarlo una vez en App. Renderiza toasts y el modal de confirmación. */
export default function NoticeHost() {
  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => subscribeNotice((state) => {
    if (state.toast !== undefined) setToast(state.toast);
    if (state.confirm !== undefined) setConfirm(state.confirm);
  }), []);

  const closeToast = useCallback(() => setToast(null), []);

  return (
    <>
      {toast && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[120] max-w-[92vw] animate-modal-in"
        >
          <div className="flex items-center gap-3 bg-[var(--bg-elevated)]/95 backdrop-blur border border-[var(--border-strong)] text-[var(--ink-primary)] text-sm font-medium rounded-2xl px-4 py-3 shadow-2xl">
            <span className="flex-1">{toast.message}</span>
            <button
              type="button"
              onClick={closeToast}
              aria-label="Cerrar aviso"
              className="shrink-0 w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {confirm && (
        <div
          className="fixed inset-0 z-[130] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-modal-in"
          onClick={() => settleConfirm(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-sm bg-[var(--bg-sunken)] border border-[var(--border-strong)] rounded-3xl p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                confirm.danger ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <p className="text-[var(--ink-primary)] text-base font-medium leading-snug pt-1">
                {confirm.message}
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => settleConfirm(false)}
                className="flex-1 py-3 rounded-2xl font-bold text-sm bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 min-h-[48px]"
              >
                {confirm.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => settleConfirm(true)}
                autoFocus
                className={`flex-1 py-3 rounded-2xl font-bold text-sm text-white min-h-[48px] ${
                  confirm.danger
                    ? 'bg-red-600 hover:bg-red-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {confirm.okLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
