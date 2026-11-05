import React from 'react';
import { CloudUpload, CloudDownload, ShieldAlert } from 'lucide-react';
import { audio } from '../../services/audioService';

// Decisión obligatoria la primera vez que este dispositivo conecta la nube
// con datos locales: nunca se sube ni se descarga en silencio.
// Sin botón de cierre: elegir es obligatorio para no dejar la sincronización
// en un estado a medias (los snapshots de la nube quedan retenidos hasta aquí).
export default function CloudFirstConnectModal({
  isOpen,
  localCount,
  cloudCount,
  bothArrived,
  onUpload,
  onDownload,
}) {
  if (!isOpen) return null;
  const cloudEmpty = bothArrived && cloudCount === 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[var(--bg-sunken)] border border-white/10 shadow-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-white">
            Primera conexión a la nube
          </h2>
        </div>

        <p className="text-sm text-gray-300">
          Este dispositivo tiene <b>{localCount} elementos</b> guardados y la
          nube trae <b>{cloudCount} elementos</b>. Elige qué debe pasar:
        </p>

        {cloudEmpty && (
          <p className="mt-3 text-sm font-bold text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">
            ⚠️ La nube está vacía: si eliges descargar, tu despensa y tu lista
            quedarán vacías en este dispositivo. Tu copia previa queda guardada
            y podrás restaurarla desde Mantenimiento.
          </p>
        )}

        {!bothArrived && (
          <p className="mt-3 text-xs text-gray-400">
            Esperando a que la nube termine de responder para mostrar el total…
          </p>
        )}

        <div className="mt-5 space-y-2.5">
          <button
            onClick={() => { audio.click(); onUpload(); }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-left transition-all"
          >
            <CloudUpload className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>
              <span className="text-sm font-bold text-white block">Subir mi despensa</span>
              <span className="text-xs text-gray-400">Lo de este dispositivo sube a la nube y se conserva.</span>
            </span>
          </button>

          <button
            disabled={!bothArrived}
            onClick={() => { audio.click(); onDownload(); }}
            className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all disabled:opacity-40"
          >
            <CloudDownload className="w-5 h-5 text-sky-400 shrink-0" />
            <span>
              <span className="text-sm font-bold text-white block">Descargar la nube</span>
              <span className="text-xs text-gray-400">Lo local se reemplaza con lo de la nube (hay copia previa guardada).</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
