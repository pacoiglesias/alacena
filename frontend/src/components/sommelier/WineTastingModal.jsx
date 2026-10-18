import React, { useState } from 'react';
import { 
  X, Wine, Star, Check, Sparkles, Award, 
  ThumbsUp, ThumbsDown, Layers 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../../services/audioService';

const AROMA_SUGGESTIONS = [
  'Cereza', 'Cuero', 'Vainilla', 'Tabaco', 'Tierra húmeda', 
  'Frutos rojos', 'Roble tostado', 'Pimienta negra', 'Ciruela pasa', 'Cacao'
];

export default function WineTastingModal({
  isOpen,
  onClose,
  wine,
  onSaveRating,
  onUncorkBottle,
}) {
  const [rating, setRating] = useState(wine?.rating || 5);
  const [sommelierPoints, setSommelierPoints] = useState(wine?.sommelierPoints || 92);
  const [olfactiveNotes, setOlfactiveNotes] = useState(wine?.tastingNotes || 'Frutos rojos maduros, vainilla y roble tostado');
  const [gustativeNotes, setGustativeNotes] = useState('Taninos pulidos, cuerpo redondo, acidez equilibrada y final largo');
  const [reviewerName, setReviewerName] = useState('Sommelier de la Casa');
  const [shouldRebuy, setShouldRebuy] = useState('YES'); // 'YES' | 'NO'
  const [pairingUsed, setPairingUsed] = useState(wine?.foodPairing || 'Cortes finos y quesos curados');

  if (!isOpen || !wine) return null;

  const handleAddAromaChip = (chip) => {
    audio.click();
    if (!olfactiveNotes.includes(chip)) {
      setOlfactiveNotes((prev) => (prev ? `${prev}, ${chip}` : chip));
    }
  };

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
    audio.haptic(50);
    try {
      confetti({
        particleCount: 85,
        spread: 75,
        origin: { y: 0.6 },
      });
    } catch (_) {}

    onUncorkBottle(wine.id, {
      rating,
      sommelierPoints,
      reviewerName,
      tastingNotes: `[Descorche de Cata] ${reviewerName} calificó con ${rating}⭐ (${sommelierPoints} pts). ${olfactiveNotes} — ${gustativeNotes}.`,
      shouldRebuy: shouldRebuy === 'YES',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--bg-sunken)]/75 backdrop-blur-[16px] animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[94vh] overflow-y-auto rounded-3xl bg-[var(--bg-elevated)] border border-[var(--border-strong)] shadow-2xl text-[var(--ink-primary)]">
        
        {/* Header con Blur */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-soft)] bg-[var(--bg-base)]/90 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[var(--wine)]/30 border border-[var(--wine-bright)]/40 flex items-center justify-center text-[var(--gold)]">
              <Wine className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display text-xl font-bold text-white tracking-tight">
                  Descorche & Ficha Sommelier Luxe
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold text-[var(--gold)] bg-[var(--gold)]/10 border border-[var(--gold)]/25 rounded-full">
                  CavaPro
                </span>
              </div>
              <p className="text-xs text-[var(--ink-tertiary)]">
                Registro sensorial oficial, calificación de añada y descorche atómico.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              audio.click();
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center text-[var(--ink-tertiary)] hover:text-white rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wine Hero Card con Vignette */}
        <div className="relative p-6 bg-gradient-to-b from-[var(--wine)]/25 via-[var(--bg-elevated)] to-[var(--bg-elevated)] border-b border-[var(--border-soft)] overflow-hidden">
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--gold)] uppercase tracking-wider">
                <span>{wine.countryFlag || '🍷'}</span>
                <span>{wine.country || 'D.O. Selecto'} • {wine.region || 'Región'}</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-white mt-1">
                {wine.name}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-[var(--ink-secondary)]">
                <span className="px-2.5 py-0.5 rounded-lg bg-[var(--bg-base)] border border-[var(--border-soft)] font-mono font-bold text-white">
                  Añada {wine.vintage || 'Reserva'}
                </span>
                <span>•</span>
                <span>{wine.grape || 'Uva no especificada'}</span>
                <span>•</span>
                <span className="text-[var(--gold)] font-semibold">{wine.wineType || 'Vino Tinto'}</span>
                <span>•</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {wine.quantity} {wine.unit || 'botellas'} en Cava
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] text-[var(--ink-tertiary)] uppercase font-bold block">Ubicación en Cava:</span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--bg-base)] border border-[var(--border-strong)] font-mono text-xs font-bold text-[var(--gold)] inline-block mt-0.5">
                {wine.cavaLocation || wine.zone || 'Cava 1 - Nivel A'}
              </span>
            </div>
          </div>
        </div>

        {/* Tasting Form */}
        <div className="p-6 space-y-6">
          
          {/* 1. Slider de Estrellas Grandes (48px) y Puntos Sommelier (80-100) */}
          <div className="p-5 rounded-2xl bg-[var(--bg-base)] border border-[var(--wine-bright)]/30 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Estrellas Grandes */}
              <div className="text-center sm:text-left">
                <span className="text-xs font-extrabold text-[var(--gold)] uppercase tracking-wider block">
                  Calificación en Estrellas
                </span>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        audio.click();
                        setRating(star);
                      }}
                      className="p-1 hover:scale-115 transition-transform"
                      title={`${star} estrellas`}
                    >
                      <Star
                        className={`w-12 h-12 transition-all ${
                          star <= rating
                            ? 'fill-[#E0B441] text-[var(--gold)] drop-shadow-[0_0_12px_rgba(224,180,65,0.6)]'
                            : 'text-[var(--border-strong)]'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Puntos Sommelier Tabular XL */}
              <div className="text-center sm:text-right">
                <span className="text-[11px] font-bold text-[var(--ink-tertiary)] uppercase block">
                  Puntaje Sommelier
                </span>
                <div className="font-display text-4xl font-black text-[var(--gold)] font-mono-num mt-1">
                  {sommelierPoints} <span className="text-sm font-sans text-[var(--ink-tertiary)]">/ 100</span>
                </div>
              </div>
            </div>

            {/* Slider de Puntos con Marcas (80-100) */}
            <div>
              <div className="flex justify-between text-[11px] text-[var(--ink-tertiary)] font-mono mb-1">
                <span>80 (Bueno)</span>
                <span>85 (Muy Bueno)</span>
                <span>90 (Excelente)</span>
                <span>95 (Excepcional)</span>
                <span>100 (Obra de Arte)</span>
              </div>
              <input
                type="range"
                min="80"
                max="100"
                value={sommelierPoints}
                onChange={(e) => {
                  audio.click();
                  setSommelierPoints(parseInt(e.target.value, 10));
                }}
                className="w-full accent-[#E0B441] cursor-pointer h-2 bg-[var(--border-soft)] rounded-lg"
              />
            </div>
          </div>

          {/* 2. Sugerencias de Aroma / Notas de Boca con Chips de un Toque */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1.5">
                Aroma & Notas Olfativas
              </label>
              <input
                type="text"
                value={olfactiveNotes}
                onChange={(e) => setOlfactiveNotes(e.target.value)}
                placeholder="Aromas primarios, barrica, especias..."
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs font-medium focus:border-[var(--gold)] outline-none"
              />
              {/* Chips de Sugerencia */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {AROMA_SUGGESTIONS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleAddAromaChip(chip)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[var(--bg-base)] hover:bg-[var(--wine)]/30 text-[var(--ink-secondary)] hover:text-[var(--gold)] border border-[var(--border-soft)] transition-all"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider mb-1">
                Sensaciones en Boca (Taninos, Cuerpo, Acidez, Retrogusto)
              </label>
              <input
                type="text"
                value={gustativeNotes}
                onChange={(e) => setGustativeNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs font-medium focus:border-[var(--gold)] outline-none"
              />
            </div>
          </div>

          {/* 3. Evaluador & Decisión de Recompra */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase mb-1">
                Evaluado Por:
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                placeholder="Sommelier, Anfitrión..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase mb-1">
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
                      : 'bg-[var(--bg-base)] border-[var(--border-soft)] text-gray-400 hover:text-white'
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
                      : 'bg-[var(--bg-base)] border-[var(--border-soft)] text-gray-400 hover:text-white'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>No Recomprar</span>
                </button>
              </div>
            </div>
          </div>

          {/* 4. Botones de Acción Luxe: Botón de Descorche de 64px de alto con texto XL */}
          <div className="pt-4 border-t border-[var(--border-soft)] flex flex-col gap-3">
            <button
              type="button"
              onClick={handleUncorkAndSave}
              className="w-full h-16 rounded-2xl bg-gradient-to-r from-[var(--wine)] via-[var(--wine-bright)] to-[var(--wine-bright)] hover:brightness-110 text-white font-display text-lg sm:text-xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-[var(--wine)]/40 border border-[var(--wine-bright)]/50 transition-all active:scale-[0.98]"
            >
              <Wine className="w-6 h-6 text-[var(--gold)]" />
              <span>🍾 Descorchar Botella (-1) & Registrar en Bitácora</span>
            </button>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  audio.click();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-[var(--ink-tertiary)] hover:text-white"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleSaveOnly}
                className="px-5 py-2.5 text-xs font-bold text-[var(--gold)] bg-[var(--gold)]/10 hover:bg-[var(--gold)]/20 border border-[var(--gold)]/30 rounded-xl transition-all"
              >
                ⭐ Guardar Ficha de Cata (Sin Descorchar)
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
