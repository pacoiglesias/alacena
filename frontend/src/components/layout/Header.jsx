import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Volume2, VolumeX, MapPin, 
  ChevronDown, Utensils, History, Layers, RefreshCw, 
  ShoppingCart, Camera, Wine, User, Shield, Check, Sliders,
  BookOpen
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { SYSTEM_VERSION } from '../changelog/ChangelogModal';
import CustomTabNamesModal, { DEFAULT_MENU_TABS, ICON_MAP } from './CustomTabNamesModal';
import SystemManualModal from '../manual/SystemManualModal';

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
  onFilterWines,
  onSelectZoneFilter,
  zones = []
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeRole, setActiveRole] = useState(() => {
    const saved = localStorage.getItem('alacena_active_role');
    return saved ? JSON.parse(saved) : SYSTEM_ROLES[0];
  });
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isTabConfigModalOpen, setIsTabConfigModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  
  // Menú dinámico configurable (renombrar, ocultar, y agregar pestañas)
  const [menuTabs, setMenuTabs] = useState(() => {
    try {
      const saved = localStorage.getItem('alacena_menu_tabs_v2');
      if (saved) return JSON.parse(saved);
      // Migración suave si existían tabLabels antiguos
      const oldLabels = localStorage.getItem('alacena_tab_labels');
      if (oldLabels) {
        const parsed = JSON.parse(oldLabels);
        return DEFAULT_MENU_TABS.map((t) => ({
          ...t,
          label: parsed[t.key] || t.label,
        }));
      }
      return DEFAULT_MENU_TABS;
    } catch (e) {
      return DEFAULT_MENU_TABS;
    }
  });

  const handleSaveMenuTabs = (newTabs) => {
    setMenuTabs(newTabs);
    try {
      localStorage.setItem('alacena_menu_tabs_v2', JSON.stringify(newTabs));
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

  // Manejar click en una pestaña (sistema o personalizada)
  const handleTabClick = (tab) => {
    audio.click();
    if (tab.id === 'cava') {
      setActiveTab('inventory');
      if (onFilterWines) onFilterWines();
    } else if (tab.targetZone) {
      setActiveTab('inventory');
      if (onSelectZoneFilter) onSelectZoneFilter(tab.targetZone);
    } else if (tab.isSystem) {
      setActiveTab(tab.key);
    } else {
      setActiveTab('inventory');
    }
  };

  const enabledTabs = menuTabs.filter((t) => t.enabled !== false);

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
            {/* Monograma "A" en cuadrado redondeado */}
            <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => { audio.click(); setActiveTab('inventory'); }}>
              <div className="w-10 h-10 rounded-[10px] bg-gradient-to-br from-[#6B1F2E] to-[#45121D] flex items-center justify-center text-[#F2EDE4] shadow-md shadow-[#6B1F2E]/30 border border-[#A83A50]/40 transition-transform group-hover:scale-105">
                <span className="font-display font-bold text-xl leading-none">A</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[22px] font-extrabold tracking-tight text-[#F2EDE4] block leading-none">
                    ALACENA
                  </span>
                  {/* Chip de versión */}
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
                    <span>v3.4.0 · Pro Master</span>
                  </button>
                </div>
                {!isScrolled && (
                  <span className="text-[11px] font-medium text-[#B8AFA3] tracking-wide block truncate">
                    Control Residencial & Cava
                  </span>
                )}
              </div>
            </div>

            {/* Selector de Residencia Activa */}
            <button
              onClick={() => {
                audio.click();
                onOpenHouseModal();
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-[#F2EDE4] bg-white/5 hover:bg-white/10 border border-[#2A2521] transition-all shrink-0"
              title="Cambiar o Administrar Casas del Hogar"
            >
              <MapPin className="w-3.5 h-3.5 text-[#E0B441]" />
              <span className="font-bold">{activeHouse?.name || 'Residencia Principal'}</span>
              <ChevronDown className="w-3 h-3 text-[#B8AFA3]" />
            </button>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Status Online / Offline */}
            <div className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono font-bold border ${
              isOnline 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </div>

            {/* Selector de Rol Doméstico */}
            <div className="relative">
              <button
                onClick={() => {
                  audio.click();
                  setIsRoleMenuOpen(!isRoleMenuOpen);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isRoleMenuOpen 
                    ? 'bg-white/15 border-[#E0B441]/50 text-white' 
                    : 'bg-white/5 border-[#2A2521] text-[#B8AFA3] hover:text-white'
                }`}
                title="Cambiar Rol de Operación en el Hogar"
              >
                {React.createElement(activeRole.icon, { className: 'w-3.5 h-3.5 text-[#E0B441]' })}
                <span className="hidden sm:inline font-medium">{activeRole.label}</span>
                <ChevronDown className="w-3 h-3 text-[#B8AFA3]" />
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#1C1814] border border-[#3D3630] shadow-2xl p-2 z-50 animate-fade-in">
                  <div className="px-2 py-1.5 text-[10px] font-mono font-bold text-[#E0B441] uppercase tracking-wider border-b border-[#2A2521] mb-1">
                    Cambiar Perfil de Operación
                  </div>
                  {SYSTEM_ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleSelectRole(role)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                        activeRole.id === role.id ? 'bg-[#E0B441]/15 text-[#E0B441] font-bold' : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {React.createElement(role.icon, { className: 'w-4 h-4 text-[#E0B441]' })}
                        <div className="text-left">
                          <span className="block font-medium">{role.name}</span>
                          <span className="text-[10px] text-[#8B8378] block">{role.label}</span>
                        </div>
                      </div>
                      {activeRole.id === role.id && <Check className="w-3.5 h-3.5 text-[#E0B441]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Botón: Instructivo y Manual Completo */}
            <button
              onClick={() => {
                audio.click();
                setIsManualModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#E0B441] bg-[#E0B441]/10 hover:bg-[#E0B441]/20 border border-[#E0B441]/30 transition-all hover:scale-105 active:scale-95 shadow-sm"
              title="Abrir Manual e Instructivo Completo del Sistema"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#E0B441]" />
              <span className="hidden sm:inline">Instructivo</span>
            </button>

            {/* Centro de Mando CAVAPRO */}
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

        {/* Bottom Row: Pilares Dinámicos y Configurables de Navegación */}
        <nav className="flex items-center gap-1.5 sm:gap-2 pt-1 pb-1.5 overflow-x-auto no-scrollbar">
          
          {enabledTabs.map((tab) => {
            const IconComponent = ICON_MAP[tab.icon] || Layers;
            const isTabActive = activeTab === tab.key || (tab.id === 'cava' && activeTab === 'cava');
            const isShoppingTab = tab.id === 'shopping' || tab.key === 'shopping';

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  isTabActive
                    ? 'text-white shadow-lg'
                    : 'text-[#B8AFA3] hover:text-white hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: isTabActive ? tab.color : undefined,
                  boxShadow: isTabActive ? `0 10px 15px -3px ${tab.color}40` : undefined,
                }}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
                {isShoppingTab && shoppingCount > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isTabActive ? 'bg-black/30 text-white' : 'bg-[#E5724A]/25 text-[#E5724A]'
                  }`}>
                    {shoppingCount}
                  </span>
                )}
                {isTabActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white absolute -bottom-0.5 left-1/2 -translate-x-1/2" />
                )}
              </button>
            );
          })}

          {/* Botón para Configurar Menú (Renombrar, Ocultar, Agregar) */}
          <button
            onClick={() => {
              audio.click();
              setIsTabConfigModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-[#8B8378] hover:text-[#E0B441] hover:bg-white/5 border border-transparent hover:border-[#E0B441]/30 transition-all shrink-0 ml-auto"
            title="Personalizar, renombrar, ocultar o agregar pestañas al menú"
          >
            <Sliders className="w-3.5 h-3.5 text-[#E0B441]" />
            <span className="hidden sm:inline">Configurar Menú</span>
          </button>

        </nav>

        {/* Modal para Renombrar, Ocultar y Agregar Pestañas */}
        <CustomTabNamesModal
          isOpen={isTabConfigModalOpen}
          onClose={() => setIsTabConfigModalOpen(false)}
          menuTabs={menuTabs}
          onSaveMenuTabs={handleSaveMenuTabs}
          zones={zones}
        />

        {/* Modal del Manual e Instructivo Completo */}
        <SystemManualModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
        />

      </div>
    </header>
  );
}
