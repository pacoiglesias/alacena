import React, { useState, useEffect, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { useDismissablePopover } from '../../hooks/useDismissablePopover';
import {
  Volume2, VolumeX,
  ChevronDown, Utensils, History, Layers, RefreshCw,
  ShoppingCart, Camera, Wine, User, Shield, Check, Sliders,
  BookOpen, Palette, Store, Sun, QrCode, Settings,
  Cloud, CloudOff, LoaderCircle
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { notify } from '../../services/notice';
import { isExpiringSoon } from '../../utils/productExpiry';
import { APP_VERSION } from '../../version';
import { DEFAULT_MENU_TABS, ICON_MAP } from './menuConfig';
const CustomTabNamesModal = lazy(() => import('./CustomTabNamesModal'));
const SystemManualModal = lazy(() => import('../manual/SystemManualModal'));
const CatalogsConfigModal = lazy(() => import('../catalogs/CatalogsConfigModal'));
const ThemeCustomizerModal = lazy(() => import('../theme/ThemeCustomizerModal'));
const KitchenDaySummaryModal = lazy(() => import('./KitchenDaySummaryModal'));

export const SYSTEM_ROLES = [
  { id: 'admin', name: 'Paco I.', label: 'Patrón / Admin', icon: Shield, color: 'text-amber-400 bg-amber-500/20' },
  { id: 'cocinera', name: 'Chef / Cocina', label: 'Cocinera Mayor', icon: Utensils, color: 'text-purple-400 bg-purple-500/20' },
  { id: 'chofer', name: 'Chofer / Compras', label: 'Abastecimiento', icon: ShoppingCart, color: 'text-orange-400 bg-orange-500/20' },
  { id: 'camarista', name: 'Camarista', label: 'Ama de Llaves', icon: User, color: 'text-emerald-400 bg-emerald-500/20' },
];

export default function Header({ 
  activeTab, activeNavId, onNavigate, onOpenRestore, onExportBackup,
  setActiveTab, 
  activeHouse, 
  onOpenHouseModal, 
  onOpenChangelog, 
  onOpenScanner,
  onOpenCommandCenter,
  onOpenQrBooklet,
  shoppingCount = 0,
  isMuted,
  onToggleMute,
  isOnline = true,
  cloudBadge = null,
  onFilterWines,
  onSelectZoneFilter,
  zones = [],
  products = [],
  shoppingList = [],
  recipes = [],
  onAddMissingToShoppingList,
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeRole, setActiveRole] = useState(() => {
    const saved = localStorage.getItem('alacena_active_role');
    try { return saved ? SYSTEM_ROLES.find((role) => role.id === JSON.parse(saved).id) || SYSTEM_ROLES[0] : SYSTEM_ROLES[0]; } catch { return SYSTEM_ROLES[0]; }
  });
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const roleMenuRef = useDismissablePopover(isRoleMenuOpen, () => setIsRoleMenuOpen(false));
  const settingsMenuRef = useDismissablePopover(isSettingsMenuOpen, () => setIsSettingsMenuOpen(false));
  // Modo simple: los roles no-admin ven un menú reducido (sin ajustes de sistema)
  const isAdmin = activeRole.id === 'admin';
  const [isTabConfigModalOpen, setIsTabConfigModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isCatalogsModalOpen, setIsCatalogsModalOpen] = useState(false);
  const [isKitchenDayModalOpen, setIsKitchenDayModalOpen] = useState(false);

  // Alertas del día — 3.14.0 (M-12): la insignia cuenta ELEMENTOS
  // (productos por vencer + productos con stock bajo), no conceptos:
  // antes sumaba «+1 si hay stock bajo» aunque faltaran veinte.
  // «Por vencer» usa la definición única de la app (isExpiringSoon,
  // 15 días con existencia), la misma de Despensa y del Resumen.
  const criticalAlertCount = React.useMemo(() => {
    const expiring = products.filter((p) => isExpiringSoon(p)).length;
    const lowStock = products.filter((p) => (p.quantity || 0) <= (p.minStock || 0)).length;
    return expiring + lowStock;
  }, [products]);
  
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
    // Los roles no-admin ven un menú reducido sin avisar: advertirlo al
    // cambiar y decir cómo volver a Admin.
    if (role.id !== 'admin') {
      notify(`Menú reducido con el rol ${role.label}: Centro Sommelier, Catálogo QR, Personalizar pestañas, Tema y Catálogos solo se ven como Admin. Para volver, abre este selector y elige Patrón / Admin.`);
    }
  };

  // Manejar click en una pestaña (sistema o personalizada)
  const handleTabClick = (tab) => {
    audio.click();
    if (onNavigate) { onNavigate(tab); return; }
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
        ? 'py-1.5 bg-[var(--bg-sunken)]/95 border-[var(--border-soft)] shadow-md shadow-black/40' 
        : 'py-2.5 bg-[var(--bg-sunken)]/90 border-[var(--border-soft)]'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Row: Logo, Brand Identity, Role Avatar & Top Controls */}
        <div className={`flex items-center justify-between gap-3 sm:gap-4 transition-all duration-300 ${
          isScrolled ? 'h-12' : 'h-16'
        }`}>
          
          {/* Logo & Brand Identity */}
          <div className="home-brand-row flex items-center gap-2.5 sm:gap-4 min-w-0">
            {/* Monograma "A" en cuadrado redondeado */}
            <div className="flex items-center gap-2.5 group cursor-pointer" onClick={() => { audio.click(); setActiveTab('inventory'); }}>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[var(--accent-cocina)] via-[var(--success-bright)] to-[var(--success-bright)] flex items-center justify-center text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-transform group-hover:scale-105">
                <span className="font-display font-black text-xl leading-none">A</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display text-[22px] font-black tracking-tight text-white block leading-none">
                    ALACENA
                  </span>
                  {/* Chip de versión */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.click();
                      onOpenChangelog();
                    }}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[var(--bg-elevated)] border border-[var(--border-soft)] hover:border-emerald-500/50 text-[10px] font-mono font-bold text-emerald-400 transition-all cursor-pointer shrink-0"
                    title="Ver Ficha Técnica y Mejoras del Hogar" data-home-version
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="hidden sm:inline">v{APP_VERSION} · Casa</span>
                    <span className="sm:hidden">v{APP_VERSION}</span>
                  </button>
                </div>
                {!isScrolled && (
                  <span className="text-[11px] font-medium text-[var(--ink-secondary)] tracking-wide block truncate">
                    Despensa, Cava & Hogar
                  </span>
                )}
              </div>
            </div>

            {/* Selector de Residencia Activa con Bandera Nacional */}
            <button
              onClick={() => {
                audio.click();
                onOpenHouseModal();
              }}
              className="home-house-select flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated)] border border-[var(--border-soft)] hover:border-emerald-500/40 transition-all shrink-0 cursor-pointer shadow-sm"
              title="Cambiar entre Casa México y Casa España"
            >
              <span className="text-base leading-none">
                {activeHouse?.currency === 'EUR' || activeHouse?.id?.includes('spain') ? '🇪🇸' : '🇲🇽'}
              </span>
              <span className="font-bold">{activeHouse?.name || '🇲🇽 Casa México (Principal)'}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-emerald-300 font-bold">
                {activeHouse?.currency === 'EUR' ? '€ EUR' : '$ MXN'}
              </span>
              <ChevronDown className="w-3 h-3 text-[var(--ink-secondary)]" />
            </button>
          </div>

          {/* Right Action Icons & Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            
            {/* Estado de la red — 3.14.0: en español y sin mono:
                «En línea» / «Sin conexión», como lo lee cualquiera. */}
            <div className={`hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold border ${
              isOnline
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`} title={isOnline ? 'Hay conexión a internet' : 'Sin conexión a internet'}>
              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'}`} />
              <span>{isOnline ? 'En línea' : 'Sin conexión'}</span>
            </div>

            {/* Conexión a la casa (3.12.0): siempre visible y con nombre
                propio, separada del ONLINE de red para que nadie lea
                «todo vacío» como «todo conectado». */}
            {cloudBadge && (
              <div
                className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono font-bold border ${
                  cloudBadge.tone === 'ok'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : cloudBadge.tone === 'error'
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-400'
                      : cloudBadge.tone === 'busy'
                        ? 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                        : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
                }`}
                title={cloudBadge.title}
                role="status"
                aria-label={cloudBadge.title}
              >
                {cloudBadge.tone === 'ok' ? <Cloud className="w-3 h-3" /> : cloudBadge.tone === 'busy' ? <LoaderCircle className="w-3 h-3 animate-spin" /> : <CloudOff className="w-3 h-3" />}
                <span className="hidden sm:inline">{cloudBadge.label}</span>
              </div>
            )}

            {/* Selector de Rol Doméstico */}
            <div className="relative" ref={roleMenuRef}>
              <button
                onClick={() => {
                  audio.click();
                  setIsSettingsMenuOpen(false); setIsRoleMenuOpen(!isRoleMenuOpen);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isRoleMenuOpen 
                    ? 'bg-[var(--bg-elevated)] border-emerald-500/50 text-white' 
                    : 'bg-[var(--bg-elevated)] border-[var(--border-soft)] text-[var(--ink-secondary)] hover:text-white'
                }`}
                aria-expanded={isRoleMenuOpen} title="Cambiar Rol de Operación en el Hogar" data-home-role
              >
                {React.createElement(activeRole.icon, { className: 'w-3.5 h-3.5 text-emerald-400' })}
                <span className="hidden sm:inline font-medium">{activeRole.label}</span>
                <ChevronDown className="w-3 h-3 text-[var(--ink-secondary)]" />
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl p-2 z-50 animate-fade-in">
                  <div className="px-2 py-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider border-b border-[var(--border-soft)] mb-1">
                    Cambiar Perfil de Operación
                  </div>
                  {SYSTEM_ROLES.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => handleSelectRole(role)}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                        activeRole.id === role.id ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30' : 'text-[var(--ink-secondary)] hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {React.createElement(role.icon, { className: 'w-4 h-4 text-[var(--gold)]' })}
                        <div className="text-left">
                          <span className="block font-medium">{role.name}</span>
                          <span className="text-[10px] text-[var(--ink-tertiary)] block">{role.label}</span>
                        </div>
                      </div>
                      {activeRole.id === role.id && <Check className="w-3.5 h-3.5 text-[var(--gold)]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Q6: silencio a un toque en la barra principal (antes solo
                dentro del menú de herramientas, a 2 toques). */}
            <button
              onClick={onToggleMute}
              className="flex items-center gap-1.5 px-2.5 py-2 min-h-[44px] rounded-xl text-xs font-semibold border border-[var(--border-soft)] bg-[var(--bg-elevated)] text-[var(--ink-secondary)] hover:text-white transition-all cursor-pointer"
              title={isMuted ? 'Activar efectos de sonido' : 'Silenciar efectos de sonido'}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
              aria-pressed={isMuted}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
              <span className="hidden lg:inline">{isMuted ? 'Silenciado' : 'Sonido'}</span>
            </button>

            {/* Escáner Universal 1-Tap (Códigos & Tickets) */}
            <button
              onClick={() => {
                audio.click();
                onOpenScanner();
              }}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:brightness-110 border border-emerald-400/40 shadow-lg shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              title="Abrir Escáner de Códigos de Barra y Lector de Tickets de Compra (OCR)" data-home-scan
            >
              <Camera className="w-4 h-4 text-emerald-100" />
              <span>Escanear</span>
            </button>

            {/* Menú Desplegable: Ajustes, Herramientas & Hogar */}
            <div className="relative" ref={settingsMenuRef}>
              <button
                onClick={() => {
                  audio.click();
                  setIsRoleMenuOpen(false); setIsSettingsMenuOpen(!isSettingsMenuOpen);
                }}
                className={`relative flex items-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer ${
                  isSettingsMenuOpen
                    ? 'bg-[var(--bg-elevated)] border-emerald-500/50 text-white'
                    : 'bg-[var(--bg-elevated)] border-[var(--border-soft)] text-[var(--ink-secondary)] hover:text-white hover:bg-white/5'
                }`}
                aria-expanded={isSettingsMenuOpen} title="Menú de Ajustes, Hogar y Herramientas"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                {criticalAlertCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse absolute -top-0.5 -right-0.5" />
                )}
              </button>

              {isSettingsMenuOpen && (
                <>
                {/* Fondo que cierra el menú al tocar fuera (incluida la navegación inferior) */}
                <button
                  type="button"
                  aria-label="Cerrar menú de herramientas"
                  onClick={() => setIsSettingsMenuOpen(false)}
                  className="fixed inset-0 z-40 cursor-default"
                />
                <div
                  className="absolute right-0 mt-2 w-64 max-h-[70vh] overflow-y-auto rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl p-2 z-50 animate-fade-in space-y-1 text-xs"
                  onClick={() => setIsSettingsMenuOpen(false)}
                >
                  <button type="button" onClick={onExportBackup} className="review-menu-action">Descargar respaldo (JSON)</button>
                  <button type="button" onClick={onOpenRestore} className="review-menu-action">Restaurar respaldo</button>
                  <div className="px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider border-b border-[var(--border-soft)] mb-1 flex items-center justify-between">
                    <span>Herramientas del Hogar</span>
                    <span className="text-[9px] text-[var(--ink-tertiary)] font-mono">v{APP_VERSION}</span>
                  </div>

                  {/* Resumen Diario de Cocina */}
                  <button
                    type="button"
                    onClick={() => setIsKitchenDayModalOpen(true)}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <Sun className="w-4 h-4 text-amber-400" />
                      <span>Resumen Diario & Caducidades</span>
                    </div>
                    {criticalAlertCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-rose-500/30 text-rose-300 text-[10px] font-mono font-bold">
                        {criticalAlertCount}
                      </span>
                    )}
                  </button>

                  {/* Centro de Mando CavaPro — solo admin */}
                  {isAdmin && (
                  <button
                    type="button"
                    onClick={onOpenCommandCenter}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                  >
                    <Wine className="w-4 h-4 text-[var(--gold)]" />
                    <span>Centro Sommelier CavaPro</span>
                  </button>
                  )}

                  {/* Catálogo de QR y Stickers — solo admin */}
                  {isAdmin && (
                  <button
                    type="button"
                    onClick={() => { if (onOpenQrBooklet) onOpenQrBooklet(); }}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                  >
                    <QrCode className="w-4 h-4 text-purple-400" />
                    <span>Catálogo QR & Stickers Alacena</span>
                  </button>
                  )}

                  {/* Instructivo y Manual Completo */}
                  <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                  >
                    <BookOpen className="w-4 h-4 text-blue-400" />
                    <span>Manual e Instructivo</span>
                  </button>

                  {/* Personalizar Menú — solo admin */}
                  {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsTabConfigModalOpen(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                  >
                    <Sliders className="w-4 h-4 text-teal-400" />
                    <span>Personalizar Pestañas del Menú</span>
                  </button>
                  )}

                  {/* Color y Tema — solo admin */}
                  {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsThemeModalOpen(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                  >
                    <Palette className="w-4 h-4 text-pink-400" />
                    <span>Tema Visual y Color</span>
                  </button>
                  )}

                  {/* Catálogos y Opciones — solo admin */}
                  {isAdmin && (
                  <button
                    type="button"
                    onClick={() => setIsCatalogsModalOpen(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                  >
                    <Store className="w-4 h-4 text-orange-400" />
                    <span>Catálogos (Tiendas y Personal)</span>
                  </button>
                  )}

                  {/* 3.14.0: fuera «Diagnóstico del escáner» del menú
                      de usuario — es una herramienta técnica, no una
                      acción de la casa. El modal sigue existiendo
                      para soporte, pero ya no se ofrece aquí. */}

                  {/* Silenciar / Activar Sonido */}
                  <div className="pt-1 border-t border-[var(--border-soft)]">
                    <button
                      type="button"
                      onClick={onToggleMute}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-[var(--ink-secondary)] hover:text-white hover:bg-white/5 transition-all text-left font-medium"
                    >
                      <div className="flex items-center gap-2">
                        {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                        <span>Efectos de Sonido</span>
                      </div>
                      <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isMuted ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                        {isMuted ? 'Silenciado' : 'Activo'}
                      </span>
                    </button>
                  </div>
                </div>
                </>
              )}
            </div>

          </div>
        </div>

        {/* Bottom Row: Pilares Dinámicos y Configurables de Navegación */}
        <nav className="hidden md:flex items-center gap-1.5 sm:gap-2 pt-1 pb-1.5 overflow-x-auto no-scrollbar">
          
          {enabledTabs.map((tab) => {
            const IconComponent = ICON_MAP[tab.icon] || Layers;
            const isTabActive = tab.id === (activeNavId || activeTab);
            const isShoppingTab = tab.id === 'shopping' || tab.key === 'shopping';

            return (
              <button
                key={tab.id}
                aria-current={isTabActive ? 'page' : undefined} onClick={() => handleTabClick(tab)}
                className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shrink-0 ${
                  isTabActive
                    ? 'text-white shadow-lg'
                    : 'text-[var(--ink-secondary)] hover:text-white hover:bg-white/5'
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
                    isTabActive ? 'bg-black/30 text-white' : 'bg-[var(--ember)]/25 text-[var(--ember)]'
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



        </nav>

        {createPortal(<Suspense fallback={<div role="status" className="fixed inset-0 z-[90] bg-black/70 grid place-items-center">Abriendo herramienta…</div>}>
        {/* Modal para Renombrar, Ocultar y Agregar Pestañas */}
        {isTabConfigModalOpen && <CustomTabNamesModal
          isOpen={isTabConfigModalOpen}
          onClose={() => setIsTabConfigModalOpen(false)}
          menuTabs={menuTabs}
          onSaveMenuTabs={handleSaveMenuTabs}
          zones={zones}
        />}

        {/* Modal del Manual e Instructivo Completo */}
        {isManualModalOpen && <SystemManualModal
          isOpen={isManualModalOpen}
          onClose={() => setIsManualModalOpen(false)}
        />}

        {/* Modal para Personalizar Color & Tema del Sistema */}
        {isThemeModalOpen && <ThemeCustomizerModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
        />}

        {/* Modal de Catálogos y Opciones Desplegables */}
        {isCatalogsModalOpen && <CatalogsConfigModal
          isOpen={isCatalogsModalOpen}
          onClose={() => setIsCatalogsModalOpen(false)}
        />}

        {/* Modal: Resumen Diario de Cocina & Alertas de Hogar */}
        {isKitchenDayModalOpen && <KitchenDaySummaryModal
          isOpen={isKitchenDayModalOpen}
          onClose={() => setIsKitchenDayModalOpen(false)}
          products={products}
          shoppingList={shoppingList}
          recipes={recipes}
          activeHouse={activeHouse}
          onAddMissingToShoppingList={onAddMissingToShoppingList}
        />}

        </Suspense>, document.body)}
      </div>
    </header>
  );
}
