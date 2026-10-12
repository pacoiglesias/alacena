import React, { useState, useEffect } from 'react';
import { 
  Utensils, ChefHat, CheckCircle2, AlertCircle, Sparkles, 
  Plus, Users, DollarSign, X, Check, ShoppingCart, Clock, 
  Flame, Play, Pause, RotateCcw, Volume2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../../services/audioService';

const SAMPLE_RECIPE_PHOTOS = [
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80', // Ribeye
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80', // Salmón
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80', // Pasta / Postre
];

export default function RecipesView({
  recipes,
  products,
  staffList,
  onCookRecipe,
  onCreateRecipe,
  onAddMissingToShoppingList,
}) {
  const [cookingRecipe, setCookingRecipe] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
  const [activeCookModeRecipe, setActiveCookModeRecipe] = useState(null);

  // Timer state for Modo Cocinar
  const [timerSeconds, setTimerSeconds] = useState(900); // 15 mins default
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [initialTimerSeconds, setInitialTimerSeconds] = useState(900);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      audio.cook();
      audio.haptic(50);
      alert('⏰ ¡Tiempo cumplido en cocina!');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // New recipe state
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeDesc, setNewRecipeDesc] = useState('');
  const [newRecipePortions, setNewRecipePortions] = useState(4);
  const [newRecipeTime, setNewRecipeTime] = useState(35);
  const [newRecipeDifficulty, setNewRecipeDifficulty] = useState('Media');
  const [newIngredients, setNewIngredients] = useState([
    { productName: products[0]?.name || '', amount: 1, unit: 'kg' },
  ]);

  // Evaluate recipe readiness and costing in MXN
  const evaluateRecipe = (recipe) => {
    let canCook = true;
    let missingIngredients = [];
    let totalCostMxn = 0;

    recipe.ingredients.forEach((ing) => {
      const product = products.find((p) => p.name.toLowerCase() === ing.productName.toLowerCase());
      if (!product || (product.quantity || 0) < ing.amount) {
        canCook = false;
        missingIngredients.push({
          name: ing.productName,
          required: ing.amount,
          available: product ? product.quantity : 0,
          unit: ing.unit,
        });
      }

      if (product) {
        totalCostMxn += ing.amount * (product.unitPriceMxn || 0);
      }
    });

    const costPerPortionMxn = recipe.portions > 0 ? totalCostMxn / recipe.portions : totalCostMxn;

    return { canCook, missingIngredients, totalCostMxn, costPerPortionMxn };
  };

  const handleStartCook = (recipe) => {
    audio.click();
    setCookingRecipe(recipe);
    setSelectedStaff(staffList[0]?.name || 'María (Jefa de Cocina)');
  };

  const handleOpenCookMode = (recipe) => {
    audio.cook();
    setActiveCookModeRecipe(recipe);
    const secs = (recipe.tiempoMin || 25) * 60;
    setTimerSeconds(secs);
    setInitialTimerSeconds(secs);
    setIsTimerRunning(false);
  };

  const handleConfirmCook = () => {
    if (!cookingRecipe) return;

    audio.cook();
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (_) {}

    onCookRecipe(cookingRecipe, selectedStaff);
    setCookingRecipe(null);
  };

  const handleAddIngredientRow = () => {
    audio.click();
    setNewIngredients([
      ...newIngredients,
      { productName: products[0]?.name || '', amount: 1, unit: 'kg' },
    ]);
  };

  const handleSaveNewRecipe = (e) => {
    e.preventDefault();
    if (!newRecipeName.trim()) return;

    audio.success();
    onCreateRecipe({
      id: `rec-${Date.now()}`,
      name: newRecipeName.trim(),
      description: newRecipeDesc.trim(),
      portions: parseInt(newRecipePortions) || 4,
      tiempoMin: parseInt(newRecipeTime) || 35,
      dificultad: newRecipeDifficulty,
      category: 'Platos de Cocina',
      ingredients: newIngredients,
      pasos: [
        'Mise en place: preparar y medir todos los insumos.',
        'Iniciar cocción al punto exacto deseado.',
        'Montar y servir de inmediato para alta presentación patrimonial.'
      ]
    });

    setIsNewRecipeModalOpen(false);
    setNewRecipeName('');
    setNewRecipeDesc('');
  };

  const formatTimer = (secs) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const timerProgress = initialTimerSeconds > 0 
    ? ((initialTimerSeconds - timerSeconds) / initialTimerSeconds) * 100 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Header Bar con Estilo Editorial */}
      <div className="card-luxe p-6 border border-[#2A2521] bg-[#1C1916] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#E0B441]/15 border border-[#E0B441]/30 flex items-center justify-center text-[#E0B441] shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                Cocina de Alta Gama & Recetas
              </h2>
              <p className="text-xs text-[#8B8378] mt-0.5">
                Costeo riguroso en MXN, deducción atómica de alacena y modo cocina paso a paso.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            audio.click();
            setIsNewRecipeModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-[#12100E] bg-gradient-to-r from-[#E0B441] to-[#F3C85B] hover:brightness-110 transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Receta</span>
        </button>
      </div>

      {/* Recipes Empty State */}
      {recipes.length === 0 ? (
        <div className="card-luxe text-center py-20 border border-dashed border-[#3D3630] rounded-3xl bg-[#1C1916]/40 p-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#E0B441]/15 border border-[#E0B441]/30 flex items-center justify-center text-[#E0B441]">
            <Utensils className="w-8 h-8" />
          </div>
          <h4 className="font-display text-xl font-bold text-white">
            🍳 Aún no hay recetas. Empieza con un clásico.
          </h4>
          <p className="text-xs text-[#8B8378] mt-1.5 max-w-sm mx-auto">
            Registra platillos familiares o de autor para costear por porción y descontar insumos automáticamente.
          </p>
          <button
            onClick={() => {
              audio.click();
              setIsNewRecipeModalOpen(true);
            }}
            className="mt-6 px-6 py-3 text-xs font-bold text-[#12100E] bg-gradient-to-r from-[#E0B441] to-[#F3C85B] rounded-2xl shadow-md transition-all"
          >
            + Crear Primera Receta
          </button>
        </div>
      ) : (
        /* Recipes Editorial Grid (8.7) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, index) => {
            const evalResult = evaluateRecipe(recipe);
            const photoUrl = recipe.foto || SAMPLE_RECIPE_PHOTOS[index % SAMPLE_RECIPE_PHOTOS.length];

            return (
              <div
                key={recipe.id}
                className="card-luxe rounded-3xl border border-[#2A2521] bg-[#12100E] overflow-hidden flex flex-col justify-between group"
              >
                <div>
                  {/* Header con Foto Full-Bleed 16:9 + Gradiente */}
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#1C1916]">
                    <img
                      src={photoUrl}
                      alt={recipe.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#12100E] via-[#12100E]/40 to-transparent" />
                    
                    {/* Nombre sobre la foto en Fraunces */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <span className="px-2 py-0.5 rounded-full bg-[#12100E]/80 backdrop-blur-md text-[10px] font-mono-num font-bold text-[#E0B441] border border-[#E0B441]/30 uppercase">
                        {recipe.category || 'Cocina'}
                      </span>
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight mt-1">
                        {recipe.name}
                      </h3>
                    </div>
                  </div>

                  {/* Pills de Meta: Tiempo, Porciones, Dificultad */}
                  <div className="p-4 border-b border-[#2A2521] flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#1C1916] border border-[#2A2521] text-[#B8AFA3]">
                      <Clock className="w-3.5 h-3.5 text-[#E0B441]" />
                      <span>{recipe.tiempoMin || 35} min</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#1C1916] border border-[#2A2521] text-[#B8AFA3]">
                      <Users className="w-3.5 h-3.5 text-purple-400" />
                      <span>{recipe.portions} porc.</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#1C1916] border border-[#2A2521] text-[#B8AFA3]">
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>{recipe.dificultad || 'Media'}</span>
                    </div>
                  </div>

                  {/* Costo por Porción Destacado con --accent-cocina */}
                  <div className="p-4 bg-gradient-to-r from-[#E0B441]/10 to-transparent border-b border-[#2A2521] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#E0B441] block">
                        Costo por Porción
                      </span>
                      <span className="font-display text-xl font-black text-[#F2EDE4] font-mono-num">
                        ${evalResult.costPerPortionMxn.toFixed(2)} <span className="text-xs font-sans text-[#8B8378]">MXN</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-[#8B8378] block">Costo Total</span>
                      <span className="font-mono-num text-xs text-[#B8AFA3]">
                        ${evalResult.totalCostMxn.toFixed(2)} MXN
                      </span>
                    </div>
                  </div>

                  {/* Ingredientes con Checkboxes Visuales */}
                  <div className="p-4 space-y-2">
                    <span className="text-[11px] font-bold text-[#8B8378] uppercase tracking-wider block">
                      Ingredientes Necesarios:
                    </span>
                    {recipe.ingredients.map((ing, idx) => {
                      const product = products.find(
                        (p) => p.name.toLowerCase() === ing.productName.toLowerCase()
                      );
                      const isAvailable = product && (product.quantity || 0) >= ing.amount;

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1 border-b border-[#2A2521]/60"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {/* Checkbox visual */}
                            <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${
                              isAvailable 
                                ? 'bg-[#2F7D5C]/20 border-[#2F7D5C] text-[#2F7D5C]' 
                                : 'bg-[#B33A3A]/20 border-[#B33A3A] text-[#B33A3A]'
                            }`}>
                              {isAvailable ? '✓' : '✕'}
                            </div>
                            <span className={`truncate ${!isAvailable ? 'text-[#8B8378] line-through' : 'text-gray-200'}`}>
                              {ing.productName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="font-mono-num text-xs text-[#8B8378]">
                              {ing.amount} {ing.unit}
                            </span>
                            {!isAvailable && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#B33A3A]/20 text-rose-400 border border-[#B33A3A]/30">
                                Falta
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="p-4 pt-2 border-t border-[#2A2521] space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCookMode(recipe)}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#1C1916] hover:bg-[#2A2521] border border-[#3D3630] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-[#E0B441]" />
                      <span>Modo Cocinar</span>
                    </button>

                    {evalResult.canCook && (
                      <button
                        onClick={() => handleStartCook(recipe)}
                        className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-[#12100E] bg-gradient-to-r from-[#E0B441] to-[#F3C85B] hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Descontar</span>
                      </button>
                    )}
                  </div>

                  {!evalResult.canCook && onAddMissingToShoppingList && (
                    <button
                      onClick={() => {
                        audio.success();
                        onAddMissingToShoppingList(evalResult.missingIngredients);
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-[#C8542A]/20 hover:bg-[#C8542A]/30 border border-[#C8542A]/40 text-[#E5724A] text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>🛒 Agregar Faltantes al Súper (1 Toque)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODO COCINAR A PANTALLA COMPLETA (Fase 8.7) */}
      {activeCookModeRecipe && (
        <div className="fixed inset-0 z-50 bg-[#0A0908] text-[#F2EDE4] overflow-y-auto p-4 sm:p-8 animate-modal-in flex flex-col justify-between">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-[#2A2521] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E0B441]/20 border border-[#E0B441]/40 flex items-center justify-center text-[#E0B441]">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#E0B441] uppercase tracking-wider block">
                    Modo Cocinar Activo
                  </span>
                  <h2 className="font-display text-2xl font-bold text-white">
                    {activeCookModeRecipe.name}
                  </h2>
                </div>
              </div>

              <button
                onClick={() => {
                  audio.click();
                  setActiveCookModeRecipe(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#1C1916] hover:bg-[#2A2521] border border-[#3D3630] text-xs font-bold text-white"
              >
                ✕ Salir
              </button>
            </div>

            {/* Timer Gigante Circular */}
            <div className="p-8 rounded-3xl bg-[#12100E] border border-[#2A2521] text-center space-y-4">
              <span className="text-xs font-extrabold uppercase tracking-widest text-[#8B8378] block">
                Temporizador de Cocina
              </span>
              <div className="font-display text-6xl sm:text-7xl font-black text-[#E0B441] font-mono-num tracking-tight">
                {formatTimer(timerSeconds)}
              </div>

              {/* Barra de progreso */}
              <div className="max-w-md mx-auto h-2 bg-[#2A2521] rounded-full overflow-hidden">
                <div 
                  className="bg-[#E0B441] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${timerProgress}%` }}
                />
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    audio.click();
                    setIsTimerRunning(!isTimerRunning);
                  }}
                  className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                    isTimerRunning
                      ? 'bg-amber-600 text-white'
                      : 'bg-[#E0B441] text-[#12100E]'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isTimerRunning ? 'Pausar' : 'Iniciar'}</span>
                </button>

                <button
                  onClick={() => {
                    audio.click();
                    setIsTimerRunning(false);
                    setTimerSeconds(initialTimerSeconds);
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#1C1916] hover:bg-[#2A2521] border border-[#3D3630] text-xs font-bold text-gray-300"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>

            {/* Pasos Numerados con Círculos Grandes en Fraunces */}
            <div className="space-y-4">
              <h3 className="font-display text-xl font-bold text-white">
                Pasos de la Preparación
              </h3>
              {(activeCookModeRecipe.pasos || [
                'Mise en place: medir y preparar todos los ingredientes en la mesa de trabajo.',
                'Control de temperatura y cocción siguiendo los tiempos de la receta.',
                'Emplatado de alta cocina y presentación patrimonial para servicio.'
              ]).map((paso, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-[#12100E] border border-[#2A2521] flex items-start gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E0B441]/15 border border-[#E0B441]/40 flex items-center justify-center font-display font-bold text-lg text-[#E0B441] shrink-0">
                    {idx + 1}
                  </div>
                  <p className="text-base sm:text-lg font-medium text-gray-200 mt-1 leading-relaxed">
                    {paso}
                  </p>
                </div>
              ))}
            </div>

          </div>

          <div className="max-w-3xl mx-auto w-full pt-6">
            <button
              onClick={() => {
                handleStartCook(activeCookModeRecipe);
                setActiveCookModeRecipe(null);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#E0B441] to-[#F3C85B] text-[#12100E] font-display text-lg font-bold shadow-xl shadow-[#E0B441]/20"
            >
              🏁 Terminar y Descontar Insumos de la Despensa
            </button>
          </div>
        </div>
      )}

      {/* Modal: Confirm Cook with Staff Attribution */}
      {cookingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#1C1916] border border-[#3D3630] shadow-2xl p-6 space-y-5 text-[#F2EDE4]">
            <div className="flex items-center justify-between border-b border-[#2A2521] pb-4">
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-5 h-5 text-[#E0B441]" />
                <h3 className="font-display text-lg font-bold text-white">
                  Confirmar Preparación
                </h3>
              </div>
              <button
                onClick={() => setCookingRecipe(null)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#B8AFA3]">
              Se descontarán los ingredientes de <strong>{cookingRecipe.name}</strong> automáticamente del inventario.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#8B8378] uppercase tracking-wider mb-2">
                ¿Quién realizó la preparación? (Para Auditoría)
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm focus:outline-none focus:border-[#E0B441]"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCookingRecipe(null)}
                className="px-4 py-2 text-xs font-bold text-[#8B8378] hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCook}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#12100E] bg-gradient-to-r from-[#E0B441] to-[#F3C85B] shadow-md"
              >
                ✓ Confirmar y Descontar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: New Recipe Creation */}
      {isNewRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#1C1916] border border-[#3D3630] shadow-2xl p-6 space-y-4 text-[#F2EDE4]">
            <div className="flex items-center justify-between border-b border-[#2A2521] pb-3">
              <div className="flex items-center gap-2.5">
                <Utensils className="w-5 h-5 text-[#E0B441]" />
                <h3 className="font-display text-lg font-bold text-white">
                  Crear Nueva Receta
                </h3>
              </div>
              <button
                onClick={() => setIsNewRecipeModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRecipe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#8B8378] uppercase mb-1">
                  Nombre del Platillo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Ribeye con Mantequilla de Romero"
                  value={newRecipeName}
                  onChange={(e) => setNewRecipeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs font-semibold focus:border-[#E0B441] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-[#8B8378] uppercase mb-1">
                    Porciones:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRecipePortions}
                    onChange={(e) => setNewRecipePortions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8B8378] uppercase mb-1">
                    Tiempo (min):
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={newRecipeTime}
                    onChange={(e) => setNewRecipeTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8B8378] uppercase mb-1">
                    Dificultad:
                  </label>
                  <select
                    value={newRecipeDifficulty}
                    onChange={(e) => setNewRecipeDifficulty(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs font-bold"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8B8378] uppercase mb-1">
                  Descripción / Notas:
                </label>
                <textarea
                  rows="2"
                  value={newRecipeDesc}
                  onChange={(e) => setNewRecipeDesc(e.target.value)}
                  placeholder="Detalles sobre presentación, guarnición o preparación..."
                  className="w-full px-4 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs"
                />
              </div>

              {/* Ingredientes dinámicos */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#8B8378] uppercase">
                    Ingredientes del Almacén:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs font-bold text-[#E0B441] hover:underline"
                  >
                    + Agregar Insumo
                  </button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {newIngredients.map((ing, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={ing.productName}
                        onChange={(e) => {
                          const updated = [...newIngredients];
                          updated[idx].productName = e.target.value;
                          setNewIngredients(updated);
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-[#12100E] border border-[#2A2521] text-white text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} ({p.unit})
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={ing.amount}
                        onChange={(e) => {
                          const updated = [...newIngredients];
                          updated[idx].amount = parseFloat(e.target.value) || 1;
                          setNewIngredients(updated);
                        }}
                        className="w-16 px-2 py-1.5 rounded-lg bg-[#12100E] border border-[#2A2521] text-white text-xs font-mono font-bold"
                      />

                      <span className="text-xs text-[#8B8378] w-8">
                        {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2A2521]">
                <button
                  type="button"
                  onClick={() => setIsNewRecipeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#8B8378] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#12100E] bg-gradient-to-r from-[#E0B441] to-[#F3C85B] shadow-md"
                >
                  ✓ Guardar Receta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
