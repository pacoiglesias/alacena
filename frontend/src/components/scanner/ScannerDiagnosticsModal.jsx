// Vista del registro de diagnóstico del escáner (Alacena 3.9.5).
//
// Se abre desde el menú de engranaje ("Diagnóstico del escáner").
// Muestra los últimos eventos técnicos de la cámara (permiso, apertura,
// primer fotograma, reinicios, timeouts, errores) para que, si el
// escáner falla en un teléfono real, el usuario pueda copiar el
// registro y pasarlo a quien revisa el problema — sin que nadie tenga
// que estar delante del teléfono.
//
// El registro NUNCA contiene fotos, códigos decodificados ni contenido
// de la lista/despensa: solo eventos técnicos (ver scannerDiag.js).
import React, { useState } from 'react';
import { X, Copy, Trash2, Terminal, Check } from 'lucide-react';
import { getDiagEvents, clearDiag, diagText } from '../../utils/scannerDiag';
import { APP_VERSION } from '../../version';
import { audio } from '../../services/audioService';

export default function ScannerDiagnosticsModal({ isOpen, onClose }) {
  const [events, setEvents] = useState(() => getDiagEvents());
  const [copied, setCopied] = useState(false);
  const [cleared, setCleared] = useState(false);

  if (!isOpen) return null;

  const refresh = () => setEvents(getDiagEvents());

  const handleCopy = async () => {
    const text = diagText();
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Respaldo para navegadores sin acceso al portapapeles.
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* Sin portapapeles. */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    clearDiag();
    setEvents([]);
    setCleared(true);
    setTimeout(() => setCleared(false), 2000);
  };

  const shown = [...events].reverse();

  return (
    <div role="dialog" aria-modal="true" aria-label="Diagnóstico del escáner" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] rounded-3xl bg-[var(--bg-base)] border border-[var(--gold)]/35 shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-[var(--border-soft)] bg-[var(--bg-sunken)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-cocina)]/20 to-[var(--gold)]/20 border border-[var(--accent-cocina)]/40 text-[var(--accent-cocina)]">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">Diagnóstico del escáner</h3>
              <p className="text-[11px] text-[var(--ink-secondary)]">
                Alacena v{APP_VERSION} · {events.length} eventos · solo datos técnicos, sin fotos ni códigos
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Cerrar diagnóstico"
            onClick={() => { audio.click(); onClose(); }}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 px-4 sm:px-6 py-3 border-b border-[var(--border-soft)]">
          <button
            type="button"
            onClick={() => { audio.click(); refresh(); }}
            className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
          >
            Actualizar
          </button>
          <button
            type="button"
            onClick={() => { audio.click(); handleCopy(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
          <button
            type="button"
            onClick={() => { audio.click(); handleClear(); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold"
          >
            <Trash2 className="w-4 h-4" />
            {cleared ? '¡Limpio!' : 'Limpiar'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          {shown.length === 0 ? (
            <p className="text-sm text-[var(--ink-secondary)]">
              Aún no hay eventos. Abre el escáner y vuelve aquí: cada intento de cámara queda registrado.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {shown.map((e, i) => (
                <li key={`${e.t}-${i}`} className="font-mono text-[11px] leading-relaxed text-gray-300 bg-black/30 border border-white/10 rounded-lg px-3 py-2 break-words">
                  <span className="text-gray-500">{e.t.slice(11, 19)}</span>
                  {' '}
                  <span className="text-emerald-300 font-bold">[{e.ev}]</span>
                  {' '}
                  <span>{JSON.stringify(e.d)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-[var(--ink-secondary)] mt-4">
            Si el escáner falla, toca Copiar y pasa el texto a quien lo revisa: ahí se ve si fue el permiso, la cámara o la decodificación.
          </p>
        </div>
      </div>
    </div>
  );
}
