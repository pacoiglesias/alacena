import React from 'react';
import { 
  Warehouse, Refrigerator, Snowflake, Wine, GlassWater, 
  Pencil, Plus, CheckCircle, Layers 
} from 'lucide-react';
import { audio } from '../../services/audioService';

const ICON_MAP = {
  DRY_PANTRY: Warehouse,
  COLD_ROOM: Snowflake,
  FRIDGE: Refrigerator,
  WINE_CELLAR: Wine,
  BAR: GlassWater,
};

export default function ZonesBar({ 
  zones, 
  selectedZone, 
  onSelectZone, 
  onEditZone, 
  onAddZone, 
  productCountsByZone 
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
            Zonas Físicas de Almacén
          </span>
          <span className="text-[11px] text-gray-500 font-medium">
            (Haz clic en ✏️ para cambiar nombres como Cava o Cuarto Frío)
          </span>
        </div>

        {/* Botón "+ Nueva Zona" */}
        <button
          onClick={() => {
            audio.click();
            onAddZone();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/35 rounded-xl transition-all shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ Nueva Zona / Cuarto Frío</span>
        </button>
      </div>

      {/* Horizontal Zone Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        
        {/* Chip "Todas las Zonas" */}
        <button
          onClick={() => {
            audio.click();
            onSelectZone(null);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 border ${
            selectedZone === null
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/40'
              : 'bg-white/5 text-gray-400 hover:text-white border-white/10 hover:border-white/20'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Todas las Zonas</span>
        </button>

        {/* Chips de cada Zona con botón de edición inline */}
        {zones.map((zone) => {
          const IconComp = ICON_MAP[zone.type] || Warehouse;
          const isSelected = selectedZone === zone.name;
          const count = productCountsByZone[zone.name] || 0;

          return (
            <div
              key={zone.id}
              className={`flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 border ${
                isSelected
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-sm'
                  : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
              }`}
            >
              <button
                onClick={() => {
                  audio.click();
                  onSelectZone(isSelected ? null : zone.name);
                }}
                className="flex items-center gap-2 text-left"
              >
                <IconComp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="font-bold">{zone.name}</span>
                <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-mono text-gray-300">
                  {count}
                </span>
              </button>

              {/* Botón de lápiz inline para renombrar/editar/eliminar en 1 clic */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  audio.click();
                  onEditZone(zone);
                }}
                className="p-1 text-gray-400 hover:text-emerald-300 rounded-lg hover:bg-white/10 transition-colors ml-1"
                title={`Renombrar o editar ${zone.name}`}
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          );
        })}

      </div>
    </div>
  );
}
