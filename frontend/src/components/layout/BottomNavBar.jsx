import React from 'react';
import { Camera } from 'lucide-react';
import { audio } from '../../services/audioService';
import { DEFAULT_MENU_TABS, ICON_MAP } from './menuConfig';

// 3.14.0 (B-2): la barra móvil enseña LAS MISMAS pestañas que el
// escritorio (DEFAULT_MENU_TABS, en su orden y con su nombre),
// con Escanear en el centro. Antes traía nombres cortos propios
// («Súper», «Cocina») y cerraba con un «Más» que abría el Centro
// de Mando: la Bitácora no existía en móvil. El Centro de Mando
// sigue alcanzable desde el menú de herramientas de la cabecera.
export default function BottomNavBar({
  activeTab,
  setActiveTab,
  shoppingCount = 0,
  onOpenScanner,
  onFilterWines,
  onNavigate,
}) {
  const goTab = (tab) => {
    audio.click();
    if (onNavigate) {
      onNavigate(tab);
      return;
    }
    if (tab.id === 'cava') {
      setActiveTab('inventory');
      if (onFilterWines) onFilterWines();
      return;
    }
    setActiveTab(tab.key);
  };

  const items = [];
  DEFAULT_MENU_TABS.forEach((tab, idx) => {
    items.push({ type: 'tab', tab });
    if (idx === 1) items.push({ type: 'scanner', id: 'scanner' });
  });

  return (
    <nav
      aria-label="Navegación Móvil Principal"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--bg-elevated)]/95 backdrop-blur-xl border-t border-[var(--border-soft)] shadow-[0_-8px_24px_rgba(0,0,0,0.6)] px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 transition-all"
    >
      <div className="flex items-end justify-around max-w-lg mx-auto">
        {items.map((item) => {
          if (item.type === 'scanner') {
            return (
              <button
                key="scanner"
                type="button"
                onClick={() => {
                  audio.click();
                  onOpenScanner();
                }}
                aria-label="Escanear"
                className="relative -top-4 flex flex-col items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full shrink-0"
                title="Escanear Código de Barras o Ticket de Compra"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 p-0.5 shadow-lg shadow-emerald-950/60 transition-transform active:scale-95 group-hover:scale-105 border-2 border-[var(--bg-sunken)]">
                  <div className="w-full h-full rounded-full bg-[var(--bg-elevated)] flex items-center justify-center text-emerald-400 group-hover:text-emerald-300">
                    <Camera className="w-6 h-6" />
                  </div>
                </div>
                <span className="text-[10px] font-extrabold tracking-tight text-emerald-400 mt-0.5 font-sans">
                  Escanear
                </span>
              </button>
            );
          }

          const tab = item.tab;
          const IconComponent = ICON_MAP[tab.icon] || Camera;
          const isActive = activeTab === tab.id;
          const badge = tab.id === 'shopping' ? shoppingCount : undefined;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => goTab(tab)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl min-w-0 min-h-[52px] transition-all active:scale-95 ${
                isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-[var(--ink-secondary)] hover:text-white font-medium'
              }`}
            >
              <div className="relative">
                <IconComponent className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-emerald-400' : 'text-[var(--ink-secondary)]'}`} />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[var(--ember)] text-white shadow-sm shadow-[var(--ember)]/40 min-w-[16px] text-center">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 truncate max-w-full ${isActive ? 'text-emerald-400 font-bold' : 'text-[var(--ink-secondary)]'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
