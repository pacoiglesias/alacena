import React, { useState } from 'react';
import { 
  X, Wine, Star, Check, Sparkles, AlertCircle, 
  ThumbsUp, ThumbsDown, MessageSquare, GlassWater, 
  Calendar, MapPin, Award 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../../services/audioService';

export default function WineTastingModal({
  isOpen,
  onClose,
  wine,
  onSaveRating,
  onUncorkBottle,
}) {
  const [rating, setRating] = useState(wine?.rating || 5);
  const [sommelierPoints, setSommelierPoints] = useState(92);
  const [visualNotes, setVisualNotes] = useState('Rojo rubí brillante con ribete violáceo');
  const [olfactiveNotes, setOlfactiveNotes] = useState('Frutas rojas maduras, vainilla, pimienta negra y sutil roble francés');
  const [gustativeNotes, setGustativeNotes] = useState('Taninos pulidos y redondos, acidez equilibrada, final largo y persistente');
  const [reviewerName, setReviewerName] = useState('Sommelier Carlos');
  const [shouldRebuy, setShouldRebuy] = useState('YES'); // 'YES' | 'NO'
  const [pairingUsed, setPairingUsed] = useState(wine?.foodPairing || 'Cortes al carbón y quesos maduros');

  if (!isOpen || !wine) return null;

  const handleSaveOnly = (e) => {
    e.preventDefault();
    audio.success();
    onSaveRating(wine.id, {
      rating,
      sommelierPoints,
      tastingNotes: `[${reviewerName} - ${rating}⭐ / ${sommelierPoints} pts] Nariz: ${olfactiveNotes}. Boca: ${gustativeNotes}. Recomprar: ${shouldRebuy === 'YES' ? 'Sí' : 'No'}.`,
      foodPairing: pairingUsed,
    });
    onClose();
  };

  const handleUncorkAndSave = (e) => {
    e.preventDefault();
    audio.cook();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    onUncorkBottle(wine.id, {
      rating,
      sommelierPoints,
      reviewerName,
      tastingNotes: `[Descorche de Cata] ${reviewerName} calificó con ${rating}⭐ (${sommelierPoints} pts). ${gustativeNotes}.`,
      shouldRebuy: shouldRebuy === 'YES',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#162035] sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-lg shadow-rose-950/50">
              <Wine className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">
                  Ficha de Cata & Calificación de Vino
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-extrabold text-amber-300 bg-amber-500/20 border border-amber-500/30 rounded-full">
                  Sommelier Tasting
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Evalúa vista, aroma, cuerpo, maridaje y califica la botella con estrellas.
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

        {/* Wine Identity Card */}
        <div className="p-6 bg-gradient-to-b from-rose-950/20 to-transparent border-b border-white/5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{wine.countryFlag || '🍷'}</span>
                <span className="text-xs font-bold text-gray-300 uppercase">
                  {wine.country || 'Origen Selecto'} • {wine.region || 'Región'}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white mt-1">
                {wine.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400 mt-1.5">
                <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white font-mono font-bold">
                  Añada {wine.vintage || 'Reserva'}
                </span>
                <span>•</span>
                <span>{wine.grape || 'Uva no especificada'}</span>
                <span>•</span>
                <span className="text-amber-400 font-semibold">{wine.wineType || 'Vino Tinto'}</span>
                <span>•</span>
                <span className="text-emerald-400 font-bold font-mono">
                  {wine.quantity} {wine.unit || 'botellas'} en Cava
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-gray-400 block">Ubicación Cava:</span>
              <span className="text-xs font-bold text-purple-300 block">
                {wine.cavaLocation || wine.zone || 'Cava Subterránea'}
              </span>
            </div>
          </div>
        </div>

        {/* Rating & Tasting Form */}
        <div className="p-6 space-y-5">
          
          {/* 1. Calificación con Estrellas Gigantes y Puntos Sommelier */}
          <div className="p-4 rounded-2xl bg-white/[0.04] border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs font-extrabold text-amber-300 uppercase tracking-wider block">
                Calificación General
              </span>
              <div className="flex items-center gap-1.5 mt-2 justify-center sm:justify-start">
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
                      className={`w-7 h-7 ${
                        star <= rating
                          ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-center">
                <span className="text-[11px] font-bold text-gray-400 uppercase block">
                  Puntos Sommelier (80-100)
                </span>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={sommelierPoints}
                  onChange={(e) => setSommelierPoints(parseInt(e.target.value, 10) || 90)}
                  className="w-20 px-2 py-1.5 mt-1 rounded-xl bg-white/10 border border-white/20 text-center text-lg font-mono font-bold text-amber-300"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400">
                <Award className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* 2. ¿Quién lo Cató / Descorchó? */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Evaluado Por:
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Ej. Sommelier Carlos, Anfitrión, Invitado..."
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                ¿Recomprar para la Cava?
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    audio.click();
                    setShouldRebuy('YES');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    shouldRebuy === 'YES'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Sí, Recomprar</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    audio.click();
                    setShouldRebuy('NO');
                  }}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                    shouldRebuy === 'NO'
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-sm'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>No Recomprar</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Fases de la Cata */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Fase Olfativa (Aromas, Fruta, Madera, Especias)
              </label>
              <input
                type="text"
                value={olfactiveNotes}
                onChange={(e) => setOlfactiveNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Fase Gustativa (Boca, Taninos, Acidez, Final)
              </label>
              <input
                type="text"
                value={gustativeNotes}
                onChange={(e) => setGustativeNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                Maridaje con el Plato
              </label>
              <input
                type="text"
                value={pairingUsed}
                onChange={(e) => setPairingUsed(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
              />
            </div>
          </div>

          {/* 4. Botones de Acción */}
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                audio.click();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSaveOnly}
              className="w-full sm:w-auto px-5 py-2.5 text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/35 rounded-xl transition-all"
            >
              ⭐ Guardar Calificación (Sin Descorchar)
            </button>

            <button
              type="button"
              onClick={handleUncorkAndSave}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 rounded-xl transition-all shadow-lg shadow-rose-950/50"
            >
              <Wine className="w-4 h-4" />
              <span>🍾 Descorchar Botella (-1) & Registrar en Bitácora</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
