import React, { useState, useEffect } from 'react';
import { 
  X, Warehouse, Refrigerator, Snowflake, Wine, GlassWater, 
  Trash2, Check, Sparkles, Thermometer, Droplets, Box
} from 'lucide-react';
import { audio } from '../../services/audioService';
import { confirmDialog } from '../../services/notice';

const PRESETS = [
  { name: 'Cava Principal', type: 'WINE_CELLAR', temp: '14°C', humidity: '70%', capacity: 120, notes: 'Control de humedad 70%, 14°C constante' },
  { name: 'Cava de Vinos', type: 'WINE_CELLAR', temp: '14°C', humidity: '72%', capacity: 80, notes: 'Botellas de guarda y cosechas especiales' },
  { name: 'Cava Don Paco', type: 'WINE_CELLAR', temp: '15°C', humidity: '68%', capacity: 150, notes: 'Cava personal de gran reserva' },
  { name: 'Alacena Principal', type: 'DRY_PANTRY', temp: '21°C', humidity: '45%', capacity: 80, notes: 'Abarrotes secos, harinas, pastas y condimentos' },
  { name: 'Alacena de Cocina', type: 'DRY_PANTRY', temp: '22°C', humidity: '40%', capacity: 40, notes: 'Despensa de uso diario para la cocinera' },
  { name: 'Refrigerador', type: 'FRIDGE', temp: '4°C', humidity: '60%', capacity: 50, notes: 'Lácteos, carnes frescas y vegetales' },
  { name: 'Cuarto Frío', type: 'COLD_ROOM', temp: '2°C', humidity: '65%', capacity: 60, notes: 'Cámara fría industrial y cortes prime' },
  { name: 'Congelador', type: 'COLD_ROOM', temp: '-18°C', humidity: '50%', capacity: 40, notes: 'Proteínas congeladas y reserva' },
  { name: 'Bar & Destilados', type: 'BAR', temp: '20°C', humidity: '40%', capacity: 50, notes: 'Tequilas, mezcales, whiskies y cristalería' },
];

export default function ZoneModal({ isOpen, onClose, onSave, onDelete, initialZone }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('DRY_PANTRY');
  const [tempNotes, setTempNotes] = useState('');
  const [targetTemp, setTargetTemp] = useState('20°C');
  const [targetHumidity, setTargetHumidity] = useState('50%');
  const [maxCapacity, setMaxCapacity] = useState(60);

  useEffect(() => {
    if (initialZone) {
      setName(initialZone.name || '');
      setType(initialZone.type || 'DRY_PANTRY');
      setTempNotes(initialZone.tempNotes || '');
      setTargetTemp(initialZone.targetTemp || (initialZone.type === 'WINE_CELLAR' ? '14°C' : '20°C'));
      setTargetHumidity(initialZone.targetHumidity || (initialZone.type === 'WINE_CELLAR' ? '70%' : '50%'));
      setMaxCapacity(initialZone.maxCapacity || (initialZone.type === 'WINE_CELLAR' ? 120 : 60));
    } else {
      setName('');
      setType('DRY_PANTRY');
      setTempNotes('');
      setTargetTemp('20°C');
      setTargetHumidity('50%');
      setMaxCapacity(60);
    }
  }, [initialZone, isOpen]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    audio.click();
    setName(preset.name);
    setType(preset.type);
    setTargetTemp(preset.temp);
    setTargetHumidity(preset.humidity);
    setMaxCapacity(preset.capacity);
    setTempNotes(preset.notes);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    audio.success();
    onSave({
      id: initialZone?.id || `zone-${Date.now()}`,
      name: name.trim(),
      type,
      tempNotes: tempNotes.trim(),
      targetTemp: targetTemp.trim(),
      targetHumidity: targetHumidity.trim(),
      maxCapacity: Number(maxCapacity) || 60,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (await confirmDialog(`¿Estás seguro de eliminar la ubicación "${name}"? Los productos que estaban aquí se moverán a la primera ubicación restante, para que ninguno quede huérfano.`)) {
      audio.delete();
      onDelete(initialZone.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl bg-[var(--bg-sunken)] border border-[var(--gold)]/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-[var(--border-soft)] bg-[var(--bg-elevated)]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${type === 'WINE_CELLAR' ? 'bg-[var(--wine)]/30 text-[var(--gold)] border-[var(--wine-bright)]/40' : 'bg-[var(--gold)]/20 text-[var(--gold)] border-[var(--gold)]/30'}`}>
              {type === 'WINE_CELLAR' ? <Wine className="w-5 h-5" /> : <Warehouse className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white font-display">
                {initialZone ? 'Configurar / Renombrar Ubicación' : 'Nueva Ubicación en Casa'}
              </h3>
              <p className="text-xs text-[var(--ink-secondary)]">
                Personaliza Cava, Alacena, Refrigerador o cualquier espacio del hogar.
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
            <label className="block text-[11px] font-extrabold text-[var(--gold)] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Sugerencias Rápidas para la Casa (1 Clic)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                    name === p.name
                      ? 'bg-[var(--gold)]/20 text-[var(--gold)] border-[var(--gold)]'
                      : 'bg-[var(--bg-elevated)] text-[var(--ink-secondary)] border-[var(--border-soft)] hover:border-[var(--gold)]/40 hover:text-white'
                  }`}
                >
                  {p.type === 'WINE_CELLAR' ? '🍷' : p.type === 'FRIDGE' ? '❄️' : '🏠'} {p.name}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre de la Ubicación */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
              Nombre de la Ubicación / Espacio
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej. Cava Principal, Alacena Seca, Cava Don Paco..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white placeholder-gray-500 text-sm focus:outline-none focus:border-[var(--gold)] focus:ring-1 focus:ring-[var(--gold)] transition-all"
            />
          </div>

          {/* Tipo de Espacio */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1.5">
              Tipo de Espacio
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: 'WINE_CELLAR', label: 'Cava de Vinos', icon: Wine, color: 'text-amber-400' },
                { id: 'DRY_PANTRY', label: 'Alacena Seca', icon: Warehouse, color: 'text-emerald-400' },
                { id: 'FRIDGE', label: 'Refrigerador', icon: Refrigerator, color: 'text-blue-400' },
                { id: 'COLD_ROOM', label: 'Cuarto Frío / Cava Fría', icon: Snowflake, color: 'text-cyan-400' },
                { id: 'BAR', label: 'Bar & Destilados', icon: GlassWater, color: 'text-orange-400' },
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
                      if (item.id === 'WINE_CELLAR') {
                        setTargetTemp('14°C');
                        setTargetHumidity('70%');
                        setMaxCapacity(120);
                      }
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all text-left ${
                      isSelected
                        ? 'bg-[var(--gold)]/15 border-[var(--gold)] text-[var(--gold)] shadow-sm'
                        : 'bg-[var(--bg-base)] border-[var(--border-soft)] text-[var(--ink-secondary)] hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 shrink-0 ${isSelected ? 'text-[var(--gold)]' : item.color}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Variables de Control (Temperatura, Humedad, Capacidad) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                Temp. Ideal
              </label>
              <input
                type="text"
                placeholder="Ej. 14°C"
                value={targetTemp}
                onChange={(e) => setTargetTemp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Humedad
              </label>
              <input
                type="text"
                placeholder="Ej. 70%"
                value={targetHumidity}
                onChange={(e) => setTargetHumidity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs focus:outline-none focus:border-[var(--gold)]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Box className="w-3.5 h-3.5 text-amber-400" />
                Capacidad Máx.
              </label>
              <input
                type="number"
                min="1"
                placeholder="Ej. 120 botellas"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs focus:outline-none focus:border-[var(--gold)]"
              />
            </div>
          </div>

          {/* Notas de Ubicación */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">
              Notas y Detalles de Ubicación
            </label>
            <input
              type="text"
              placeholder="Ej. Subsuelo Ala Norte, Estantes 1 a 6 de madera de roble..."
              value={tempNotes}
              onChange={(e) => setTempNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white placeholder-gray-500 text-xs focus:outline-none focus:border-[var(--gold)] transition-all"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 flex items-center justify-between border-t border-[var(--border-soft)] gap-3">
            {initialZone ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-all border border-rose-500/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Eliminar Ubicación</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  audio.click();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold text-[var(--ink-secondary)] hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[var(--terracotta)] to-[var(--gold)] hover:brightness-110 rounded-xl transition-all shadow-lg shadow-[var(--terracotta)]/20"
              >
                <Check className="w-4 h-4" />
                <span>{initialZone ? 'Guardar Cambios' : 'Crear Ubicación'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
