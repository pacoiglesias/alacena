import React from 'react';
import { 
  Warehouse, Sparkles, Volume2, VolumeX, MapPin, 
  ChevronDown, Utensils, History, Layers, RefreshCw, 
  ShoppingCart, Camera 
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { SYSTEM_VERSION } from '../changelog/ChangelogModal';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  activeHouse, 
  onOpenHouseModal, 
  onOpenChangelog, 
  onResetDemoData,
  onOpenScanner,
  onOpenCommandCenter,
  shoppingCount = 0,
  isMuted,
  onToggleMute 
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090D14]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Row: Logo, House Pill, Scanner Button & Controls */}
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Logo & House Pill */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-lg shadow-emerald-950/40">
                <Warehouse className="w-5 h-5" />
              </div>
              <div className="hidden md:block">
                <span className="text-base font-extrabold tracking-tight text-white block leading-none">
                  ALACENA
                </span>
                <span className="text-[10px] font-semibold tracking-widest text-emerald-400 uppercase">
                  Enterprise
                </span>
              </div>
            </div>

            {/* Casa Activa Minimalist Pill */}
            <button
              onClick={() => {
                audio.click();
                onOpenHouseModal();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 transition-all text-left group"
            >
              <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-extrabold tracking-wider text-gray-400 block uppercase leading-none">
                  CASA ACTIVA
                </span>
                <span className="text-xs font-bold text-white truncate block max-w-[120px] sm:max-w-[180px]">
                  {activeHouse?.name || 'Residencia Principal'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-400 transition-colors ml-0.5" />
            </button>
          </div>

          {/* Right Controls: Scanner, Version Badge & Sound Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Centro de Mando CAVAPRO v5.0 */}
            <button
              onClick={() => {
                audio.click();
                onOpenCommandCenter();
              }}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Abrir Centro de Mando CAVAPRO (Menú Maestro)"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Centro de Mando</span>
              <span className="text-[10px] text-amber-400">▾</span>
            </button>

            {/* Prominent Scanner Button (Available anywhere in 1-tap) */}
            <button
              onClick={() => {
                audio.click();
                onOpenScanner();
              }}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-md shadow-emerald-950/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Abrir Escáner de Código de Barras y QR"
            >
              <Camera className="w-4 h-4" />
              <span>Escáner</span>
            </button>

            {/* Version Badge (User requested visible version) */}
            <button
              onClick={() => {
                audio.click();
                onOpenChangelog();
              }}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/20 hover:to-teal-500/20 border border-emerald-500/30 transition-all group"
              title="Ver Registro de Mejoras del Sistema"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono font-bold text-emerald-300">
                {SYSTEM_VERSION}
              </span>
            </button>

            {/* Quick Demo Data Seeder */}
            <button
              onClick={() => {
                audio.success();
                onResetDemoData();
              }}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl border border-amber-500/30 transition-all"
              title="Restaurar datos demo en MXN"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Demo</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition-all ${
                isMuted 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                  : 'bg-white/5 border-white/10 hover:border-emerald-500/30 text-emerald-400'
              }`}
              title={isMuted ? 'Activar Efectos de Sonido' : 'Silenciar Efectos de Sonido'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

          </div>
        </div>

        {/* Bottom Row: 4 Main Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 pb-2.5 overflow-x-auto no-scrollbar">
          
          {/* Tab 1: Inventario */}
          <button
            onClick={() => {
              audio.click();
              setActiveTab('inventory');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Inventario & Zonas</span>
          </button>

          {/* Tab 2: Lista de Compras para el Súper */}
          <button
            onClick={() => {
              audio.click();
              setActiveTab('shopping');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'shopping'
                ? 'bg-amber-500 text-white shadow-lg shadow-amber-950/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Lista de Compras (Súper)</span>
            {shoppingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'shopping' ? 'bg-black/25 text-white' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {shoppingCount}
              </span>
            )}
          </button>

          {/* Tab 3: Recetas de Cocina */}
          <button
            onClick={() => {
              audio.click();
              setActiveTab('recipes');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'recipes'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>Recetas (Restaurante)</span>
          </button>

          {/* Tab 4: Bitácora Forense */}
          <button
            onClick={() => {
              audio.click();
              setActiveTab('audit');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'audit'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Bitácora de Consumo</span>
          </button>

        </div>

      </div>
    </header>
  );
}
