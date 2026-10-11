import React, { useState, useEffect } from 'react';
import { X, Warehouse, Refrigerator, Snowflake, Wine, GlassWater, Trash2, Check } from 'lucide-react';
import { audio } from '../../services/audioService';

export default function ZoneModal({ isOpen, onClose, onSave, onDelete, initialZone }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('DRY_PANTRY');
  const [tempNotes, setTempNotes] = useState('');

  useEffect(() => {
    if (initialZone) {
      setName(initialZone.name || '');
      setType(initialZone.type || 'DRY_PANTRY');
      setTempNotes(initialZone.tempNotes || '');
    } else {
      setName('');
      setType('DRY_PANTRY');
      setTempNotes('');
    }
  }, [initialZone, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    audio.success();
    onSave({
      id: initialZone?.id || `zone-${Date.now()}`,
      name: name.trim(),
      type,
      tempNotes: tempNotes.trim(),
    });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de eliminar la zona "${name}"?`)) {
      audio.delete();
      onDelete(initialZone.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#131C31]">
          <h3 className="text-lg font-bold text-white">
            {initialZone ? 'Editar / Renombrar Zona' : 'Nueva Zona de Almacén'}
          </h3>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Nombre de la Ubicación
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej. Cuarto Frío #2, Cava Reserva, Alacena Seca..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Tipo de Espacio Físico
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'DRY_PANTRY', label: 'Alacena Seca', icon: Warehouse },
                { id: 'COLD_ROOM', label: 'Cuarto Frío / Cámara', icon: Snowflake },
                { id: 'FRIDGE', label: 'Refrigerador', icon: Refrigerator },
                { id: 'WINE_CELLAR', label: 'Cava de Vinos', icon: Wine },
                { id: 'BAR', label: 'Bar & Destilados', icon: GlassWater },
              ].map((item) => {
                const IconComponent = item.icon;
                const isSelected = type === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      audio.click();
                      setType(item.id);
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Notas de Temperatura / Control (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Control 2°C a 4°C, Humedad 70%..."
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-between border-t border-white/10 gap-3">
            {initialZone ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Zona</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  audio.click();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-all shadow-lg shadow-emerald-950/40"
              >
                <Check className="w-4 h-4" />
                <span>{initialZone ? 'Guardar Cambios' : 'Crear Zona'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
