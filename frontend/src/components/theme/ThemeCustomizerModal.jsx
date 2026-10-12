import React, { useState, useEffect } from 'react';
import { 
  X, Check, Palette, Sparkles, Sun, Moon, 
  Wine, Droplet, Eye, ShieldCheck
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { SYSTEM_THEMES, getActiveTheme, applyTheme } from '../../services/themeService';

export default function ThemeCustomizerModal({ isOpen, onClose }) {
  const [currentTheme, setCurrentTheme] = useState(() => getActiveTheme());

  useEffect(() => {
    if (isOpen) {
      setCurrentTheme(getActiveTheme());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectTheme = (theme) => {
    audio.click();
    const applied = applyTheme(theme);
    setCurrentTheme(applied);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#14110F] border border-[#E0B441]/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#2A2521] bg-[#1C1814]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E0B441]/15 text-[#E0B441] border border-[#E0B441]/30">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-display font-bold text-[#F2EDE4] flex items-center gap-2">
                <span>Personalización de Color & Tema del Sistema</span>
                <span className="px-2 py-0.5 rounded-full bg-[#E0B441]/20 text-[#E0B441] text-[10px] font-mono font-bold">
                  Luxe Multi-Tema
                </span>
              </h2>
              <p className="text-xs text-[#B8AFA3] mt-0.5">
                Adapta la apariencia visual de la Alacena a la iluminación y estética de tu residencia
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-2 rounded-xl text-[#B8AFA3] hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="text-xs font-bold text-[#B8AFA3] uppercase tracking-wider mb-1">
            Paletas de Color Diseñadas para Uso Real & Residencial
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {SYSTEM_THEMES.map((theme) => {
              const isSelected = currentTheme.id === theme.id;
              const c = theme.colors;

              return (
                <div
                  key={theme.id}
                  onClick={() => handleSelectTheme(theme)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all relative overflow-hidden group ${
                    isSelected
                      ? 'border-[#E0B441] shadow-lg shadow-[#E0B441]/15 scale-[1.01]'
                      : 'border-[#2A2521] hover:border-[#3D3630] hover:bg-white/5'
                  }`}
                  style={{ backgroundColor: c.bgElevated }}
                >
                  {/* Visual theme badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
                        style={{ backgroundColor: theme.previewDot }}
                      />
                      <span className="text-xs sm:text-sm font-bold truncate" style={{ color: c.inkPrimary }}>
                        {theme.name}
                      </span>
                    </div>
                    {isSelected ? (
                      <span className="w-5 h-5 rounded-full bg-[#E0B441] text-[#12100E] flex items-center justify-center text-xs shrink-0 font-bold">
                        ✓
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/30 text-[#8B8378]">
                        {theme.isDark ? '🌙 Oscuro' : '☀️ Claro'}
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] mb-3 leading-relaxed" style={{ color: c.inkSecondary }}>
                    {theme.description}
                  </p>

                  {/* Swatches strip */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-white/10">
                    <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: c.bgBase }} title="Fondo Base" />
                    <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: c.borderStrong }} title="Bordes" />
                    <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: c.accentSuper }} title="Acento Súper" />
                    <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: c.accentCocina }} title="Acento Cocina" />
                    <div className="flex-1 h-3 rounded-full" style={{ backgroundColor: c.accentCava }} title="Acento Cava" />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#1C1814] border border-[#2A2521] flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-xs text-[#B8AFA3]">
              El tema seleccionado se guarda automáticamente en tu dispositivo y se aplica de inmediato en la alacena, inventario, lista del súper y modo cata.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end p-4 border-t border-[#2A2521] bg-[#1C1814]">
          <button
            type="button"
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#E0B441] text-[#12100E] font-bold text-xs sm:text-sm hover:brightness-110 shadow-md shadow-[#E0B441]/20"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar & Cerrar</span>
          </button>
        </div>

      </div>
    </div>
  );
}
