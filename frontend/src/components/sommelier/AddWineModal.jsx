import React, { useState } from 'react';
import { X, Wine, Check, DollarSign, Calendar, MapPin, Sparkles, Thermometer } from 'lucide-react';
import { audio } from '../../services/audioService';

const GRAPES = [
  'Cabernet Sauvignon',
  'Tempranillo',
  'Nebbiolo',
  'Malbec',
  'Pinot Noir',
  'Syrah / Shiraz',
  'Merlot',
  'Chardonnay',
  'Sauvignon Blanc',
  'Blend / Ensamble Reserva',
];

const REGIONS = [
  'Ribera del Duero (España)',
  'Rioja (España)',
  'Valle de Guadalupe (México)',
  'Mendoza (Argentina)',
  'Bordeaux (Francia)',
  'Toscana (Italia)',
  'Napa Valley (EE.UU.)',
  'Colchagua (Chile)',
];

export default function AddWineModal({ isOpen, onClose, onSave, zones }) {
  const [wineName, setWineName] = useState('');
  const [winery, setWinery] = useState('');
  const [vintage, setVintage] = useState(new Date().getFullYear() - 3);
  const [grape, setGrape] = useState('Tempranillo');
  const [region, setRegion] = useState('Ribera del Duero (España)');
  const [bottles, setBottles] = useState(6);
  const [bottlePriceMxn, setBottlePriceMxn] = useState(1200);
  const [cellarZone, setCellarZone] = useState('Cava Subterránea');
  const [pairing, setPairing] = useState('Cortes de carne marmoleados, lechón, quesos añejos');
  const [servingTemp, setServingTemp] = useState('16°C a 18°C');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!wineName.trim()) return;

    audio.success();
    const fullName = `${wineName.trim()} ${vintage} (${winery.trim() || grape})`;

    onSave({
      id: `wine-${Date.now()}`,
      name: fullName,
      zone: cellarZone,
      category: 'Vinos & Licores',
      quantity: parseFloat(bottles) || 1,
      unit: 'botellas',
      minStock: 2,
      idealStock: 12,
      unitPriceMxn: parseFloat(bottlePriceMxn) || 0,
      store: 'La Europea / Cava Directa',
      lastLoggedBy: 'Sommelier Privado (CavaPro)',
      notes: `Uva: ${grape} • Región: ${region} • Maridaje: ${pairing} • Servicio: ${servingTemp}`,
      updatedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#151D2A] sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-rose-500/15 border border-rose-500/25 text-rose-400">
              <Wine className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Ingresar Vino a la Cava (Módulo Sommelier)
              </h3>
              <p className="text-xs text-gray-400">
                Control de añadas, denominación de origen, maridaje y temperatura.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Nombre de la Etiqueta / Vino *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej. Vega Sicilia Valbuena 5°, Gran Reserva..."
              value={wineName}
              onChange={(e) => setWineName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Bodega / Productor
              </label>
              <input
                type="text"
                placeholder="Ej. Casa Madero, Bodegas Vega Sicilia..."
                value={winery}
                onChange={(e) => setWinery(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Añada (Cosecha) *
              </label>
              <input
                type="number"
                required
                min="1950"
                max="2035"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Variedad de Uva
              </label>
              <select
                value={grape}
                onChange={(e) => setGrape(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
              >
                {GRAPES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Región / País
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
              >
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Cantidad de Botellas *
              </label>
              <input
                type="number"
                min="1"
                required
                value={bottles}
                onChange={(e) => setBottles(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Precio / Botella ($ MXN) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-400 font-bold">$</span>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={bottlePriceMxn}
                  onChange={(e) => setBottlePriceMxn(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono font-bold"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Ubicación Física
              </label>
              <select
                value={cellarZone}
                onChange={(e) => setCellarZone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
              >
                {zones.map((z) => (
                  <option key={z.id} value={z.name}>{z.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Temp. de Servicio
              </label>
              <input
                type="text"
                value={servingTemp}
                onChange={(e) => setServingTemp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
              Sugerencia de Maridaje (Cocina)
            </label>
            <input
              type="text"
              placeholder="Ej. Cortes marmoleados, estofados, quesos curados..."
              value={pairing}
              onChange={(e) => setPairing(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
            />
          </div>

          <div className="pt-3 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-all shadow-lg shadow-rose-950/40"
            >
              <Check className="w-4 h-4" />
              <span>Guardar en Cava</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
