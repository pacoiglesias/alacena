import React, { useState } from 'react';
import { X, MapPin, Check, Plus, Home } from 'lucide-react';
import { audio } from '../../services/audioService';

export default function HouseholdsModal({ 
  isOpen, 
  onClose, 
  households, 
  activeHouse, 
  onSelectHouse, 
  onAddHouse 
}) {
  const [newHouseName, setNewHouseName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newHouseName.trim()) return;

    audio.success();
    onAddHouse({
      id: `house-${Date.now()}`,
      name: newHouseName.trim(),
      isPrimary: false,
    });
    setNewHouseName('');
    setIsAdding(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Residencias y Propiedades
              </h3>
              <p className="text-xs text-gray-400">
                Selecciona la casa activa o agrega una nueva sucursal.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="p-1.5 text-gray-400 hover:text-white rounded-xl hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Houses List */}
        <div className="space-y-2">
          {households.map((house) => {
            const isSelected = activeHouse?.id === house.id;

            return (
              <button
                key={house.id}
                onClick={() => {
                  audio.click();
                  onSelectHouse(house);
                  onClose();
                }}
                className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`text-2xl p-2 rounded-xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-emerald-500/20 shadow-sm' : 'bg-white/5'
                  }`}>
                    {house.currency === 'EUR' || house.id.includes('spain') ? '🇪🇸' : '🇲🇽'}
                  </div>
                  <div>
                    <span className="text-sm font-bold block">{house.name}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-emerald-400 font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
                        {house.currency === 'EUR' ? 'Moneda: € EUR' : 'Moneda: $ MXN'}
                      </span>
                      {house.isPrimary && (
                        <span className="text-[10px] text-amber-300 font-semibold">Residencia Principal</span>
                      )}
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-5 h-5 text-emerald-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Add House form or trigger */}
        {isAdding ? (
          <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
            <input
              type="text"
              required
              autoFocus
              placeholder="Nombre de la nueva residencia..."
              value={newHouseName}
              onChange={(e) => setNewHouseName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl"
              >
                Guardar Casa
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => {
              audio.click();
              setIsAdding(true);
            }}
            className="w-full py-2.5 px-4 text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar Otra Residencia</span>
          </button>
        )}

      </div>
    </div>
  );
}
