import React from 'react';
import { 
  X, Sparkles, Plus, Wine, ShoppingCart, RefreshCw, 
  Share2, QrCode, Camera, ShieldCheck, Database, 
  Trash2, FileText, Bell, CheckCircle2, ChevronRight, 
  History, Download, Volume2, Layers, Warehouse 
} from 'lucide-react';
import { audio } from '../../services/audioService';

export default function CavaProCommandCenterModal({
  isOpen,
  onClose,
  onOpenAddProduct,
  onOpenAddWine,
  onOpenScanner,
  onAutoGenerateShopping,
  onOpenShoppingTab,
  onOpenInventoryTab,
  onOpenRecipesTab,
  onOpenAuditTab,
  onExportBackupJson,
  onResetDemoData,
  onOpenChangelog,
  onToggleMute,
  isMuted,
  lowStockCount,
}) {
  if (!isOpen) return null;

  const handleAction = (actionFn) => {
    audio.click();
    onClose();
    if (actionFn) actionFn();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl">
        
        {/* Header: CAVAPRO v5.0 */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#141E33]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-lg shadow-rose-950/40">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white font-mono">
                  CAVAPRO • MENÚ MAESTRO v5.0
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300 bg-amber-500/20 border border-amber-500/30 rounded-full">
                  Centro de Mando
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Acceso directo a todas las operaciones de Alacena, Cava, Supermercado y Auditoría.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Command Grid Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Sección 1: Añadir Nuevo */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5">
              <span>➕ Añadir Nuevo...</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleAction(onOpenAddProduct)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-emerald-500/15 border border-white/10 hover:border-emerald-500/30 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Warehouse className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">🛒 Producto a la Alacena</span>
                    <span className="text-[11px] text-gray-400">Captura manual sin código</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-emerald-400" />
              </button>

              <button
                onClick={() => handleAction(onOpenAddWine)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                    <Wine className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">🍷 Vino a la Cava (Sommelier)</span>
                    <span className="text-[11px] text-gray-400">Añadas, uvas y maridaje</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-rose-400" />
              </button>
            </div>
          </div>

          {/* Sección 2: Gestión Rápida de Stock & Escáner */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2.5">
              <span>📦 Gestión Rápida de Stock & Escáner</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleAction(onOpenScanner)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500 text-white">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">📷 Abrir Escáner de Cámara</span>
                    <span className="text-[11px] text-emerald-300">Códigos de barras y QRs</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-emerald-400" />
              </button>

              <button
                onClick={() => handleAction(onOpenInventoryTab)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">➕ / ➖ Entrada y Salida Rápida</span>
                    <span className="text-[11px] text-gray-400">Ajustes directos con botones + y -</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400" />
              </button>
            </div>
          </div>

          {/* Sección 3: Lista de Compras */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2.5">
              <span>🛒 Lista de Compras & Súper</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => {
                  audio.success();
                  onClose();
                  onAutoGenerateShopping();
                  onOpenShoppingTab();
                }}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-purple-500/15 border border-white/10 hover:border-purple-500/30 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                    <RefreshCw className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">💡 Generar Lista Automática</span>
                    <span className="text-[11px] text-gray-400">Calcula lo que falta en casa</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
              </button>

              <button
                onClick={() => handleAction(onOpenShoppingTab)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-amber-500/15 border border-white/10 hover:border-amber-500/30 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">🛒 Modo Supermercado</span>
                    <span className="text-[11px] text-gray-400">Checklist, QR y WhatsApp</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-amber-400" />
              </button>
            </div>
          </div>

          {/* Sección 4: Reportes, Recetas y Auditoría */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-wider mb-2.5">
              <span>📊 Control de Cocina, Reportes & Kardex</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={() => handleAction(onOpenRecipesTab)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-purple-500/15 border border-white/10 hover:border-purple-500/30 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">🍳 Recetas de Cocina & Costeo</span>
                    <span className="text-[11px] text-gray-400">Deducción y cálculo en $ MXN</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-purple-400" />
              </button>

              <button
                onClick={() => handleAction(onOpenAuditTab)}
                className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 hover:bg-blue-500/15 border border-white/10 hover:border-blue-500/30 text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">📋 Bitácora Forense (Audit Log)</span>
                    <span className="text-[11px] text-gray-400">Quién consumió qué y cuándo</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-blue-400" />
              </button>
            </div>
          </div>

          {/* Sección 5: Mantenimiento y Respaldos */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              <span>⚙️ Mantenimiento & Copia de Seguridad</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <button
                onClick={() => {
                  audio.success();
                  onExportBackupJson();
                }}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all"
              >
                <Download className="w-4 h-4 text-emerald-400 mb-1" />
                <span className="text-xs font-bold text-white block">💾 Descargar Backup</span>
                <span className="text-[10px] text-gray-400">Archivo JSON local</span>
              </button>

              <button
                onClick={() => handleAction(onResetDemoData)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all"
              >
                <RefreshCw className="w-4 h-4 text-amber-400 mb-1" />
                <span className="text-xs font-bold text-white block">📦 Datos de Ejemplo</span>
                <span className="text-[10px] text-gray-400">Restaurar catálogo MXN</span>
              </button>

              <button
                onClick={() => handleAction(onOpenChangelog)}
                className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-all"
              >
                <ShieldCheck className="w-4 h-4 text-purple-400 mb-1" />
                <span className="text-xs font-bold text-white block">🩺 Salud del Sistema</span>
                <span className="text-[10px] text-gray-400">Ver versión y audio</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-[#131C31] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>ALACENA Enterprise (CavaPro v5.0 Engine) • Spark 0 USD</span>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="px-5 py-2 text-xs font-bold text-white bg-white/10 hover:bg-white/20 rounded-xl transition-all"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
