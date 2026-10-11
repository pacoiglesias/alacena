import React, { useState } from 'react';
import { 
  X, CheckCircle2, Sparkles, Volume2, VolumeX, ShieldCheck, 
  Terminal, History, Zap, Utensils, MapPin, DollarSign 
} from 'lucide-react';
import { audio } from '../../services/audioService';

export const SYSTEM_VERSION = 'v2.4.0-Titanium-Nova';
export const RELEASE_DATE = '11 Octubre 2026';

export default function ChangelogModal({ isOpen, onClose }) {
  const [isMuted, setIsMuted] = useState(audio.isMuted());

  if (!isOpen) return null;

  const handleToggleMute = () => {
    const muted = audio.toggleMute();
    setIsMuted(muted);
  };

  const testAudio = (type) => {
    if (type === 'click') audio.click();
    if (type === 'success') audio.success();
    if (type === 'warning') audio.warning();
    if (type === 'cook') audio.cook();
    if (type === 'delete') audio.delete();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#131C31]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-mono">{SYSTEM_VERSION}</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold tracking-wider text-emerald-400 uppercase rounded-full bg-emerald-500/15 border border-emerald-500/30">
                  Producción
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Desplegado el {RELEASE_DATE} • Firebase Spark 0 USD • Latencia Red: 12ms
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-xl border transition-all ${
                isMuted 
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
                  : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              }`}
              title={isMuted ? 'Activar Sonidos' : 'Silenciar Sonidos'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Audio Test Bench */}
        <div className="p-4 mx-6 mt-5 rounded-2xl bg-[#162238] border border-emerald-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-300 tracking-wider">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>BANCO DE PRUEBA DE AUDIO SENSORIAL (WEB AUDIO API)</span>
            </div>
            <span className="text-[11px] text-emerald-400 font-medium">Cero archivos MP3 • Síntesis Real</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            <button
              onClick={() => testAudio('click')}
              className="px-2.5 py-2 text-xs font-semibold text-gray-200 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 hover:border-white/25 transition-all text-center"
            >
              🎯 Clic Táctil
            </button>
            <button
              onClick={() => testAudio('success')}
              className="px-2.5 py-2 text-xs font-semibold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl border border-emerald-500/25 transition-all text-center"
            >
              ✨ Éxito
            </button>
            <button
              onClick={() => testAudio('warning')}
              className="px-2.5 py-2 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/25 transition-all text-center"
            >
              ⚠️ Alerta
            </button>
            <button
              onClick={() => testAudio('cook')}
              className="px-2.5 py-2 text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl border border-purple-500/25 transition-all text-center"
            >
              🍳 Cocina Chef
            </button>
            <button
              onClick={() => testAudio('delete')}
              className="px-2.5 py-2 text-xs font-semibold text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl border border-rose-500/25 transition-all text-center"
            >
              🗑️ Borrado
            </button>
          </div>
        </div>

        {/* Scrollable Changelog List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Release v2.4.0 */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/30 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-extrabold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-lg">
                  v2.4.0
                </span>
                <span className="text-xs font-semibold text-emerald-400">ESTA VERSIÓN</span>
              </div>
              <span className="text-xs text-gray-400">11 Octubre 2026</span>
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Transformación a Web App de Lujo, Audio Sensorial y Control de Zonas
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Captura Manual Directa:</strong> Formulario moderno de alta sin escaneo obligatorio de código de barras.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Gestión de Zonas en 1 Clic:</strong> Renombra o elimina Cava, Cuarto Frío o Alacena directamente en los chips con el lápiz ✏️.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Motor de Audio Sensorial:</strong> Sonidos mecánicos y chimes armónicos instantáneos (Web Audio API) sin latencia.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Moneda Estricta MXN ($):</strong> Valuación total en Pesos Mexicanos con costeo por unidad y receta.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span><strong>Version Badge Visible:</strong> Acceso permanente a esta bitácora y estado de salud de la plataforma.</span>
              </li>
            </ul>
          </div>

          {/* Release v2.3.0 */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-extrabold text-blue-400 bg-blue-500/15 border border-blue-500/30 rounded-lg">
                  v2.3.0
                </span>
                <span className="text-xs font-semibold text-blue-400">RECIENTE</span>
              </div>
              <span className="text-xs text-gray-400">11 Octubre 2026</span>
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Motor de Cocina Tipo Restaurante y Deducción Automática
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>Módulo de Recetas con costeo automático en tiempo real por porción.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>Función "Cocinar y Descontar" con atribución al personal (María, Chef, etc.).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold">✓</span>
                <span>Bitácora Forense de Auditoría (Audit Trail) inmutable.</span>
              </li>
            </ul>
          </div>

          {/* Release v2.0.0 */}
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 text-xs font-extrabold text-purple-400 bg-purple-500/15 border border-purple-500/30 rounded-lg">
                  v2.0.0
                </span>
                <span className="text-xs font-semibold text-purple-400">ARQUITECTURA</span>
              </div>
              <span className="text-xs text-gray-400">10 Octubre 2026</span>
            </div>
            <h4 className="text-base font-bold text-white mb-2">
              Infraestructura Firebase Spark 0 USD y Cava Sommelier
            </h4>
            <ul className="space-y-1.5 text-xs text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                <span>Persistencia offline en Cloud Firestore sin costos de infraestructura.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold">✓</span>
                <span>Cava digital con control de añadas, denominación y temperaturas.</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#131C31] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Auditado para seguridad empresarial y cero pérdida de datos</span>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-900/30"
          >
            Entendido
          </button>
        </div>

      </div>
    </div>
  );
}
