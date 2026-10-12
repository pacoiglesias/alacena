import React, { useState, useEffect } from 'react';
import { 
  X, Check, RotateCcw, Sparkles, ShoppingCart, 
  Wine, Utensils, History, Layers, Sliders, Edit3
} from 'lucide-react';
import { audio } from '../../services/audioService';

export const DEFAULT_TAB_LABELS = {
  shopping: 'Lista del Súper',
  cava: 'CavaPro Vinos',
  recipes: 'Cocina & Recetas',
  audit: 'Bitácora Forense',
  inventory: 'Alacena & QR',
};

const PRESETS = [
  {
    name: '🏰 Residencia Familiar (Cálido & Sencillo)',
    labels: {
      shopping: 'Mandado & Súper',
      cava: 'Cava de Vinos',
      recipes: 'Cocina de Casa',
      audit: 'Historial Familiar',
      inventory: 'Mi Despensa',
    },
  },
  {
    name: '🍷 Cava & Sommelier de Lujo',
    labels: {
      shopping: 'Compras Selectas',
      cava: 'Cava Gran Reserva',
      recipes: 'Recetario de Autor',
      audit: 'Bitácora de Descorche',
      inventory: 'Alacena & Cava',
    },
  },
  {
    name: '⚡ Minimalista / Práctico',
    labels: {
      shopping: 'Compras',
      cava: 'Vinos',
      recipes: 'Cocina',
      audit: 'Historial',
      inventory: 'Despensa',
    },
  },
  {
    name: '👨‍🍳 Personal Doméstico (Chofer & Cocinera)',
    labels: {
      shopping: 'Lista para el Chofer',
      cava: 'Cava & Bar',
      recipes: 'Menú de la Cocinera',
      audit: 'Registro de Salidas',
      inventory: 'Almacén Central',
    },
  },
];

export default function CustomTabNamesModal({ isOpen, onClose, tabLabels, onSaveTabLabels }) {
  const [labels, setLabels] = useState(DEFAULT_TAB_LABELS);

  useEffect(() => {
    if (tabLabels) {
      setLabels({ ...DEFAULT_TAB_LABELS, ...tabLabels });
    }
  }, [tabLabels, isOpen]);

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setLabels((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyPreset = (preset) => {
    audio.click();
    setLabels(preset.labels);
  };

  const handleResetDefaults = () => {
    audio.delete();
    setLabels(DEFAULT_TAB_LABELS);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    audio.success();
    onSaveTabLabels(labels);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#14110F] border border-[#E0B441]/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[#2A2521] bg-[#1C1814]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#E0B441]/15 text-[#E0B441] border border-[#E0B441]/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                Personalizar Nombres del Menú
              </h3>
              <p className="text-xs text-[#B8AFA3]">
                Cambia el nombre de las 5 secciones a tu gusto para que se adapte 100% a tu casa.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Presets Rápidos */}
          <div>
            <label className="block text-[11px] font-extrabold text-[#E0B441] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Estilos Listos en 1 Toque (Presets):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="p-2.5 rounded-xl bg-[#1C1814] hover:bg-[#2A2521] border border-[#2A2521] hover:border-[#E0B441]/40 text-left transition-all group"
                >
                  <span className="text-xs font-bold text-white group-hover:text-[#E0B441] block">
                    {p.name}
                  </span>
                  <span className="text-[10px] text-[#8B8378] block truncate mt-0.5">
                    {Object.values(p.labels).join(' • ')}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Edición de cada una de las 5 Pestañas */}
          <div className="space-y-3 pt-1">
            <label className="block text-xs font-bold text-white uppercase tracking-wider">
              Nombres de las 5 Secciones:
            </label>

            {/* 1. Lista del Súper */}
            <div className="p-3 rounded-2xl bg-[#1C1814] border border-[#2A2521] flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#E5724A]/20 text-[#E5724A] shrink-0">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-[#8B8378] font-bold uppercase block">Pestaña 1 (Compras)</span>
                <input
                  type="text"
                  required
                  value={labels.shopping}
                  onChange={(e) => handleChange('shopping', e.target.value)}
                  placeholder="Ej. Mandado, Lista del Súper..."
                  className="w-full bg-transparent text-white text-xs font-bold focus:outline-none border-b border-[#2A2521] focus:border-[#E5724A] py-1"
                />
              </div>
            </div>

            {/* 2. CavaPro Vinos */}
            <div className="p-3 rounded-2xl bg-[#1C1814] border border-[#2A2521] flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#A83A50]/20 text-[#E0B441] shrink-0">
                <Wine className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-[#8B8378] font-bold uppercase block">Pestaña 2 (Cava & Vinos)</span>
                <input
                  type="text"
                  required
                  value={labels.cava}
                  onChange={(e) => handleChange('cava', e.target.value)}
                  placeholder="Ej. Mi Cava, Cava Don Paco, Vinos..."
                  className="w-full bg-transparent text-white text-xs font-bold focus:outline-none border-b border-[#2A2521] focus:border-[#A83A50] py-1"
                />
              </div>
            </div>

            {/* 3. Cocina & Recetas */}
            <div className="p-3 rounded-2xl bg-[#1C1814] border border-[#2A2521] flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#E0B441]/20 text-[#E0B441] shrink-0">
                <Utensils className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-[#8B8378] font-bold uppercase block">Pestaña 3 (Cocina & Recetas)</span>
                <input
                  type="text"
                  required
                  value={labels.recipes}
                  onChange={(e) => handleChange('recipes', e.target.value)}
                  placeholder="Ej. Cocina de Casa, Menú Semanal, Recetario..."
                  className="w-full bg-transparent text-white text-xs font-bold focus:outline-none border-b border-[#2A2521] focus:border-[#E0B441] py-1"
                />
              </div>
            </div>

            {/* 4. Bitácora Forense */}
            <div className="p-3 rounded-2xl bg-[#1C1814] border border-[#2A2521] flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#5C8894]/20 text-[#5C8894] shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-[#8B8378] font-bold uppercase block">Pestaña 4 (Historial & Auditoría)</span>
                <input
                  type="text"
                  required
                  value={labels.audit}
                  onChange={(e) => handleChange('audit', e.target.value)}
                  placeholder="Ej. Historial, Movimientos de Casa, Auditoría..."
                  className="w-full bg-transparent text-white text-xs font-bold focus:outline-none border-b border-[#2A2521] focus:border-[#5C8894] py-1"
                />
              </div>
            </div>

            {/* 5. Alacena & QR */}
            <div className="p-3 rounded-2xl bg-[#1C1814] border border-[#2A2521] flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[#3D8B6E]/20 text-[#3D8B6E] shrink-0">
                <Layers className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] text-[#8B8378] font-bold uppercase block">Pestaña 5 (Alacena & Despensa)</span>
                <input
                  type="text"
                  required
                  value={labels.inventory}
                  onChange={(e) => handleChange('inventory', e.target.value)}
                  placeholder="Ej. Mi Despensa, Alacena Principal, Inventario..."
                  className="w-full bg-transparent text-white text-xs font-bold focus:outline-none border-b border-[#2A2521] focus:border-[#3D8B6E] py-1"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-[#2A2521] gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#8B8378] hover:text-white rounded-xl transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Originales</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  audio.click();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-[#B8AFA3] hover:text-white rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#C8542A] to-[#E0B441] hover:brightness-110 rounded-xl transition-all shadow-md shadow-[#C8542A]/20"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Nombres</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
