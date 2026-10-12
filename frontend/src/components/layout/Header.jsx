import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Volume2, VolumeX, MapPin, 
  ChevronDown, Utensils, History, Layers, RefreshCw, 
  ShoppingCart, Camera, Wine, User, Shield, Check, Sliders
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { SYSTEM_VERSION } from '../changelog/ChangelogModal';
import CustomTabNamesModal, { DEFAULT_TAB_LABELS } from './CustomTabNamesModal';

export const SYSTEM_ROLES = [
  { id: 'admin', name: 'Paco I.', label: 'Patrón / Admin', icon: Shield, color: 'text-amber-400 bg-amber-500/20' },
  { id: 'cocinera', name: 'Chef / Cocina', label: 'Cocinera Mayor', icon: Utensils, color: 'text-purple-400 bg-purple-500/20' },
  { id: 'chofer', name: 'Chofer / Compras', label: 'Abastecimiento', icon: ShoppingCart, color: 'text-orange-400 bg-orange-500/20' },
  { id: 'camarista', name: 'Camarista', label: 'Ama de Llaves', icon: User, color: 'text-emerald-400 bg-emerald-500/20' },
];

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
  onToggleMute,
  isOnline = true,
  onFilterWines
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeRole, setActiveRole] = useState(() => {
    const saved = localStorage.getItem('alacena_active_role');
    return saved ? JSON.parse(saved) : SYSTEM_ROLES[0];
  });
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isTabConfigModalOpen, setIsTabConfigModalOpen] = useState(false);
  const [tabLabels, setTabLabels] = useState(() => {
    try {
      const saved = localStorage.getItem('alacena_tab_labels');
      return saved ? JSON.parse(saved) : DEFAULT_TAB_LABELS;
    } catch (e) {
      return DEFAULT_TAB_LABELS;
    }
  });

  const handleSaveTabLabels = (newLabels) => {
    setTabLabels(newLabels);
    try {
      localStorage.setItem('alacena_tab_labels', JSON.stringify(newLabels));
    } catch (e) {}
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSelectRole = (role) => {
    setActiveRole(role);
    localStorage.setItem('alacena_active_role', JSON.stringify(role));
    audio.click();
    setIsRoleMenuOpen(false);
  };

  return (
    <header className={`sticky top-0 z-40 w-full border-b transition-all duration-300 backdrop-blur-xl ${
      isScrolled 
        ? 'py-1.5 bg-[#12100E]/95 border-[#2A2521] shadow-md' 
        : 'py-2.5 bg-[#12100E]/90 border-[#2A2521]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Row: Logo, Brand Identity, Role Avatar & Top Controls */}
        <div className={`flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 ${
          isScrolled ? 'h-12' : 'h-16'
        }`}>
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            {/* Monograma "A" en cuadrado redondeado --accent-cava */}
            <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => { audio.click(); setActiveTab('inventory'); }}>
              <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#6B1F2E] to-[#45121D] flex items-center justify-center text-[#F2EDE4] shadow-md shadow-[#6B1F2E]/30 border border-[#A83A50]/40 transition-transform group-hover:scale-105">
                <span className="font-display font-bold text-xl leading-none">A</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[22px] font-extrabold tracking-tight text-[#F2EDE4] block leading-none">
                    ALACENA
                  </span>
                  {/* Chip de versión: v3.1.0 Luxe */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.click();
                      onOpenChangelog();
                    }}
                    className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#1C1916] border border-[#3D3630] hover:border-[#E0B441]/50 text-[10px] font-mono font-bold text-[#E0B441] transition-all"
                    title="Ver Ficha Técnica y Changelog Luxe"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>v3.3.0 · Perfection</span>
                  </button>
                </div>
                {!isScrolled && (
                  <span className="text-[11px] font-medium tracking-wide text-[#7A7268] block mt-0.5 transition-opacity duration-200">
                    Despensa · Cava · Cocina
                  </span>
                )}
              </div>
            </div>

            {/* Casa Activa Minimalist Pill */}
            <button
              onClick={() => {
                audio.click();
                onOpenHouseModal();
              }}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1C1916] hover:bg-[#2A2521] border border-[#2A2521] hover:border-[#6B1F2E]/60 transition-all text-left group"
            >
              <div className="p-1 rounded-full bg-[#6B1F2E]/30 text-[#E0B441]">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[9px] font-extrabold tracking-wider text-[#7A7268] block uppercase leading-none">
                  RESIDENCIA
                </span>
                <span className="text-xs font-bold text-[#F2EDE4] truncate block max-w-[130px]">
                  {activeHouse?.name || 'Principal'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#7A7268] group-hover:text-[#E0B441] transition-colors ml-0.5" />
            </button>
          </div>

          {/* Right Controls: Role Selector, Scanner, Sound Toggle & Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Selector de rol visible como avatar+nombre (no dropdown técnico) */}
            <div className="relative">
              <button
                onClick={() => {
                  audio.click();
                  setIsRoleMenuOpen(!isRoleMenuOpen);
                }}
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#1C1916] hover:bg-[#2A2521] border border-[#3D3630] transition-all text-left group"
                title="Cambiar rol activo"
              >
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${activeRole.color}`}>
                  {activeRole.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left leading-none">
                  <span className="text-[9px] font-extrabold tracking-wider text-[#7A7268] block uppercase">
                    ROL ACTIVO
                  </span>
                  <span className="text-xs font-semibold text-[#F2EDE4]">
                    {activeRole.name}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#7A7268] group-hover:text-[#F2EDE4] transition-colors" />
              </button>

              {/* Menú flotante de roles */}
              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#1C1916] border border-[#3D3630] shadow-xl p-2 z-50 animate-modal-in">
                  <div className="px-3 py-1.5 text-[10px] font-extrabold text-[#7A7268] uppercase tracking-wider">
                    Seleccionar Personal / Rol
                  </div>
                  {SYSTEM_ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => handleSelectRole(r)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-medium transition-all ${
                        activeRole.id === r.id 
                          ? 'bg-[#6B1F2E]/30 text-[#F2EDE4] font-bold border border-[#A83A50]/40' 
                          : 'text-[#B8AFA3] hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${r.color}`}>
                          {r.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white text-xs">{r.name}</div>
                          <div className="text-[10px] text-[#7A7268]">{r.label}</div>
                        </div>
                      </div>
                      {activeRole.id === r.id && <Check className="w-3.5 h-3.5 text-[#E0B441]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Centro de Mando CAVAPRO v6.0 */}
            <button
              onClick={() => {
                audio.click();
                onOpenCommandCenter();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#E0B441] bg-[#6B1F2E]/30 hover:bg-[#6B1F2E]/50 border border-[#A83A50]/40 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Abrir Centro de Mando Sommelier & Cava"
            >
              <Wine className="w-3.5 h-3.5 text-[#E0B441]" />
              <span className="hidden sm:inline">CavaPro</span>
              <span className="text-[10px] text-[#E0B441]">▾</span>
            </button>

            {/* Escáner Universal 1-Tap */}
            <button
              onClick={() => {
                audio.click();
                onOpenScanner();
              }}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#1F4D3A] to-[#2E6B52] hover:from-[#275e47] hover:to-[#388264] border border-[#3D8B6E]/40 shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
              title="Abrir Escáner de Códigos de Barra y QR"
            >
              <Camera className="w-4 h-4" />
              <span>Escáner</span>
            </button>

            {/* Sound Toggle */}
            <button
              onClick={onToggleMute}
              className={`p-2 rounded-xl border transition-all ${
                isMuted 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' 
                  : 'bg-white/5 border-[#2A2521] hover:border-[#E0B441]/40 text-[#E0B441]'
              }`}
              title={isMuted ? 'Activar Efectos de Sonido' : 'Silenciar Efectos de Sonido'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

          </div>
        </div>

        {/* Bottom Row: 5 Pilares de Navegación con Acentos Específicos */}
        <nav className="flex items-center gap-1.5 sm:gap-2 pt-1 pb-1.5 overflow-x-auto no-scrollbar">
          
          {/* Pilar 1: Súper (--accent-super #E5724A) */}
          <button
            onClick={() => {
              audio.click();
              setActiveTab('shopping');
            }}
            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'shopping'
                ? 'bg-[#E5724A] text-white shadow-lg shadow-[#E5724A]/25'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>{tabLabels.shopping || 'Lista del Súper'}</span>
            {shoppingCount > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                activeTab === 'shopping' ? 'bg-black/30 text-white' : 'bg-[#E5724A]/25 text-[#E5724A]'
              }`}>
                {shoppingCount}
              </span>
            )}
            {activeTab === 'shopping' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white absolute -bottom-0.5 left-1/2 -translate-x-1/2" />
            )}
          </button>

          {/* Pilar 2: CavaPro (--accent-cava #A83A50) */}
          <button
            onClick={() => {
              audio.click();
              setActiveTab('inventory');
              if (onFilterWines) onFilterWines();
            }}
            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'cava'
                ? 'bg-[#A83A50] text-white shadow-lg shadow-[#A83A50]/25'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Wine className="w-4 h-4" />
            <span>{tabLabels.cava || 'CavaPro Vinos'}</span>
            {activeTab === 'cava' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white absolute -bottom-0.5 left-1/2 -translate-x-1/2" />
            )}
          </button>

          {/* Pilar 3: Recetas de Cocina (--accent-cocina #E0B441) */}
          <button
            onClick={() => {
              audio.click();
              setActiveTab('recipes');
            }}
            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'recipes'
                ? 'bg-[#E0B441] text-[#12100E] font-bold shadow-lg shadow-[#E0B441]/25'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>{tabLabels.recipes || 'Cocina & Recetas'}</span>
            {activeTab === 'recipes' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#12100E] absolute -bottom-0.5 left-1/2 -translate-x-1/2" />
            )}
          </button>

          {/* Pilar 4: Bitácora Forense (--accent-audit #5C8894) */}
          <button
            onClick={() => {
              audio.click();
              setActiveTab('audit');
            }}
            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'audit'
                ? 'bg-[#5C8894] text-white shadow-lg shadow-[#5C8894]/25'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{tabLabels.audit || 'Bitácora Forense'}</span>
            {activeTab === 'audit' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white absolute -bottom-0.5 left-1/2 -translate-x-1/2" />
            )}
          </button>

          {/* Pilar 5: Alacena & Catálogo QR (--accent-qr #3D8B6E) */}
          <button
            onClick={() => {
              audio.click();
              setActiveTab('inventory');
            }}
            className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
              activeTab === 'inventory'
                ? 'bg-[#3D8B6E] text-white shadow-lg shadow-[#3D8B6E]/25'
                : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{tabLabels.inventory || 'Alacena & QR'}</span>
            {activeTab === 'inventory' && (
              <span className="w-1.5 h-1.5 rounded-full bg-white absolute -bottom-0.5 left-1/2 -translate-x-1/2" />
            )}
          </button>

          {/* Botón para Renombrar / Configurar las 5 Pestañas */}
          <button
            onClick={() => {
              audio.click();
              setIsTabConfigModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 border border-transparent hover:border-[#E0B441]/30 transition-all shrink-0 ml-auto"
            title="Personalizar o renombrar los 5 nombres del menú"
          >
            <Sliders className="w-3.5 h-3.5 text-[#E0B441]" />
            <span className="hidden sm:inline">Renombrar Menú</span>
          </button>

        </nav>

        {/* Modal para Renombrar y Configurar Pestañas del Hogar */}
        <CustomTabNamesModal
          isOpen={isTabConfigModalOpen}
          onClose={() => setIsTabConfigModalOpen(false)}
          tabLabels={tabLabels}
          onSaveTabLabels={handleSaveTabLabels}
        />

      </div>
    </header>
  );
}
