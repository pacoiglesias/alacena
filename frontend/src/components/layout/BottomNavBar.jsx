import React from 'react';
import { 
  Package, ShoppingCart, Camera, UtensilsCrossed, Wine, MoreHorizontal 
} from 'lucide-react';
import { audio } from '../../services/audioService';

export default function BottomNavBar({
  activeTab,
  setActiveTab,
  shoppingCount = 0,
  onOpenScanner,
  onFilterWines,
  onOpenCommandCenter,
}) {
  const navItems = [
    {
      id: 'inventory',
      label: 'Despensa',
      icon: Package,
      action: () => {
        audio.click();
        setActiveTab('inventory');
      },
      isActive: activeTab === 'inventory',
    },
    {
      id: 'shopping',
      label: 'Súper',
      icon: ShoppingCart,
      badge: shoppingCount,
      action: () => {
        audio.click();
        setActiveTab('shopping');
      },
      isActive: activeTab === 'shopping',
    },
    {
      id: 'scanner',
      label: 'Escanear',
      icon: Camera,
      isCenterAction: true,
      action: () => {
        audio.click();
        onOpenScanner();
      },
    },
    {
      id: 'recipes',
      label: 'Cocina',
      icon: UtensilsCrossed,
      action: () => {
        audio.click();
        setActiveTab('recipes');
      },
      isActive: activeTab === 'recipes',
    },
    {
      id: 'cava',
      label: 'Cava / Más',
      icon: Wine,
      action: () => {
        audio.click();
        if (onOpenCommandCenter) {
          onOpenCommandCenter();
        } else if (onFilterWines) {
          onFilterWines();
        }
      },
      isActive: false,
    },
  ];

  return (
    <nav 
      aria-label="Navegación Móvil Principal" 
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0F1218]/95 backdrop-blur-xl border-t border-[#1E2638] shadow-[0_-8px_24px_rgba(0,0,0,0.6)] px-2 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-1.5 transition-all"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const IconComponent = item.icon;

          if (item.isCenterAction) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={item.action}
                className="relative -top-4 flex flex-col items-center group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-full"
                title="Escanear Código de Barras o Ticket de Compra"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-amber-500 p-0.5 shadow-lg shadow-emerald-950/60 transition-transform active:scale-95 group-hover:scale-105 border-2 border-[#090B0E]">
                  <div className="w-full h-full rounded-full bg-[#0D1117] flex items-center justify-center text-emerald-400 group-hover:text-emerald-300">
                    <IconComponent className="w-6 h-6 animate-pulse" />
                  </div>
                </div>
                <span className="text-[10px] font-extrabold tracking-tight text-emerald-400 mt-0.5 font-sans">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.action}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-xl min-w-[58px] transition-all active:scale-95 ${
                item.isActive
                  ? 'text-emerald-400 font-bold'
                  : 'text-[#94A3B8] hover:text-white font-medium'
              }`}
            >
              <div className="relative">
                <IconComponent className={`w-5 h-5 transition-transform ${item.isActive ? 'scale-110 text-emerald-400' : 'text-[#94A3B8]'}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-[#E5724A] text-white shadow-sm shadow-[#E5724A]/40 min-w-[16px] text-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 truncate ${item.isActive ? 'text-emerald-400 font-bold' : 'text-[#94A3B8]'}`}>
                {item.label}
              </span>
              {item.isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
