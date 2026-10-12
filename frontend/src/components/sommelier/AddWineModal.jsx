import React, { useState } from 'react';
import { 
  X, Wine, Check, DollarSign, Calendar, MapPin, 
  Sparkles, Thermometer, Star, ShieldCheck, Compass 
} from 'lucide-react';
import { audio } from '../../services/audioService';

export const WINE_COUNTRIES = [
  { code: 'MX', name: 'México', flag: '🇲🇽', regions: ['Valle de Guadalupe, B.C.', 'Parras, Coahuila', 'Querétaro', 'Aguascalientes', 'San Miguel de Allende'] },
  { code: 'ES', name: 'España', flag: '🇪🇸', regions: ['Ribera del Duero', 'Rioja', 'Priorat', 'Rías Baixas', 'Toro', 'Penedès'] },
  { code: 'FR', name: 'Francia', flag: '🇫🇷', regions: ['Bordeaux', 'Burgundy (Borgoña)', 'Champagne', 'Rhône Valley', 'Alsace'] },
  { code: 'IT', name: 'Italia', flag: '🇮🇹', regions: ['Toscana (Brunello / Chianti)', 'Piemonte (Barolo)', 'Veneto (Amarone)', 'Sicilia'] },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', regions: ['Mendoza (Valle de Uco)', 'Salta (Cafayate)', 'Patagonia'] },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸', regions: ['Napa Valley, CA', 'Sonoma County, CA', 'Willamette Valley, OR'] },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', regions: ['Valle de Colchagua', 'Valle del Maipo', 'Valle de Casablanca'] },
];

export const WINE_TYPES = [
  'Tinto Gran Reserva',
  'Tinto Reserva',
  'Tinto Crianza',
  'Tinto Joven / Roble',
  'Blanco Fermentado en Barrica',
  'Blanco Joven Fresco',
  'Rosado Provenzal',
  'Espumoso / Champagne Brut',
  'Vino Generoso / Oporto / Jerez',
];

export const GRAPES = [
  'Tempranillo / Tinto Fino',
  'Cabernet Sauvignon',
  'Nebbiolo',
  'Malbec',
  'Pinot Noir',
  'Syrah / Shiraz',
  'Merlot',
  'Chardonnay',
  'Sauvignon Blanc',
  'Garnacha',
  'Sangiovese',
  'Blend / Ensamble Reserva',
];

export default function AddWineModal({ isOpen, onClose, onSave, zones }) {
  const [wineName, setWineName] = useState('');
  const [winery, setWinery] = useState('');
  const [vintage, setVintage] = useState(new Date().getFullYear() - 3);
  const [countryCode, setCountryCode] = useState('ES');
  const [region, setRegion] = useState('Ribera del Duero');
  const [wineType, setWineType] = useState('Tinto Gran Reserva');
  const [grape, setGrape] = useState('Tempranillo / Tinto Fino');
  const [alcoholPct, setAlcoholPct] = useState(14.5);
  const [bottles, setBottles] = useState(6);
  const [bottlePriceMxn, setBottlePriceMxn] = useState(1500);
  const [cellarZone, setCellarZone] = useState('Cava Subterránea');
  const [cavaLocation, setCavaLocation] = useState('Cava 1 - Estante A, Nivel 2');
  const [rating, setRating] = useState(5);
  const [tastingNotes, setTastingNotes] = useState('');
  const [pairing, setPairing] = useState('Cortes de carne marmoleados, lechón, quesos curados');
  const [servingTemp, setServingTemp] = useState('16°C a 18°C');

  if (!isOpen) return null;

  const currentCountry = WINE_COUNTRIES.find(c => c.code === countryCode) || WINE_COUNTRIES[1];

  const handleCountryChange = (e) => {
    const code = e.target.value;
    setCountryCode(code);
    const found = WINE_COUNTRIES.find(c => c.code === code);
    if (found && found.regions.length > 0) {
      setRegion(found.regions[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!wineName.trim()) return;

    audio.success();
    const fullName = `${wineName.trim()} ${vintage} (${winery.trim() || currentCountry.name})`;

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
      isWine: true,
      vintage: parseInt(vintage, 10),
      country: currentCountry.name,
      countryFlag: currentCountry.flag,
      region,
      winery: winery.trim(),
      grape,
      wineType,
      alcoholPct: parseFloat(alcoholPct) || 14.0,
      cavaLocation,
      rating,
      tastingNotes: tastingNotes.trim() || `Excelente expresión de ${grape}. Servir a ${servingTemp}.`,
      foodPairing: pairing.trim(),
      recommendedServingTemp: servingTemp.trim(),
      notes: `Uva: ${grape} • ${currentCountry.flag} ${currentCountry.name} (${region}) • ${wineType}`,
      updatedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#151D2A] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
              <Wine className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Ingreso de Vino a Cava (Módulo Sommelier Pro)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-rose-300 bg-rose-500/20 border border-rose-500/30 rounded-full">
                  CAVAPRO v5.0
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Añada, país de origen, denominación, notas de cata, estantería y calificación.
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
          
          {/* Nombre y Bodega */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Etiqueta / Nombre del Vino *
              </label>
              <input
                type="text"
                required
                autoFocus
                placeholder="Ej. Vega Sicilia Único, Gran Ricardo, Château Margaux..."
                value={wineName}
                onChange={(e) => setWineName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-rose-500 font-semibold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Añada (Año Cosecha) *
              </label>
              <input
                type="number"
                required
                min="1950"
                max="2035"
                value={vintage}
                onChange={(e) => setVintage(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono font-bold"
              />
            </div>
          </div>

          {/* Bodega y Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Bodega / Productor
              </label>
              <input
                type="text"
                placeholder="Ej. Monte Xanic, Vega Sicilia, Antinori..."
                value={winery}
                onChange={(e) => setWinery(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Estilo / Clasificación
              </label>
              <select
                value={wineType}
                onChange={(e) => setWineType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
              >
                {WINE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* País y Región / D.O. */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                País de Origen
              </label>
              <select
                value={countryCode}
                onChange={handleCountryChange}
                className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm font-bold"
              >
                {WINE_COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Región / Denominación de Origen
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm"
              >
                {currentCountry.regions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
                <option value="Otra Región">Otra Región Especial</option>
              </select>
            </div>
          </div>

          {/* Varietal y Graduación Alcohólica */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Variedad de Uva (Cepa)
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
                Graduación Alcohólica (% Vol.)
              </label>
              <input
                type="number"
                step="0.5"
                min="5"
                max="25"
                value={alcoholPct}
                onChange={(e) => setAlcoholPct(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono"
              />
            </div>
          </div>

          {/* Cantidad y Precio en MXN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Cantidad de Botellas en Cava *
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

          {/* Ubicación en Cava y Estantería Física */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Zona de Almacén
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
                Ubicación Física en Estante
              </label>
              <input
                type="text"
                placeholder="Ej. Cava 1 - Estante A, Nivel 3"
                value={cavaLocation}
                onChange={(e) => setCavaLocation(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm"
              />
            </div>
          </div>

          {/* Calificación Inicial de Estrellas */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-amber-300 uppercase">
                Calificación Sommelier Inicial
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => {
                      audio.click();
                      setRating(star);
                    }}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold font-mono text-white ml-2">
                  {rating} / 5 ⭐
                </span>
              </div>
            </div>

            <div>
              <input
                type="text"
                placeholder="Notas de cata iniciales (aroma a frutos negros, madera noble, taninos pulidos)..."
                value={tastingNotes}
                onChange={(e) => setTastingNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500"
              />
            </div>
          </div>

          {/* Maridaje y Temperatura */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Maridaje Recomendado
              </label>
              <input
                type="text"
                value={pairing}
                onChange={(e) => setPairing(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Temp. de Servicio
              </label>
              <input
                type="text"
                value={servingTemp}
                onChange={(e) => setServingTemp(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 rounded-xl transition-all shadow-lg shadow-rose-950/40"
            >
              <Check className="w-4 h-4" />
              <span>Guardar en Cava con Ficha Sommelier</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
