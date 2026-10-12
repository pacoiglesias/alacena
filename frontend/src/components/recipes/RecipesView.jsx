import React, { useState, useEffect, useMemo } from 'react';
import { 
  Utensils, ChefHat, CheckCircle2, AlertCircle, Sparkles, 
  Plus, Users, DollarSign, X, Check, ShoppingCart, Clock, 
  Flame, Play, Pause, RotateCcw, Volume2, Trash2, ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../../services/audioService';
import { areItemsEquivalent, deduplicateRecipeIngredients } from '../../utils/deduplication';

const SAMPLE_RECIPE_PHOTOS = [
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80', // Ribeye
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800&auto=format&fit=crop&q=80', // Salmón
  'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800&auto=format&fit=crop&q=80', // Pasta / Postre
];

export default function RecipesView({
  recipes = [],
  products = [],
  staffList = [],
  onCookRecipe,
  onCreateRecipe,
  onAddMissingToShoppingList,
}) {
  const [cookingRecipe, setCookingRecipe] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
  const [activeCookModeRecipe, setActiveCookModeRecipe] = useState(null);
  
  // Porciones escalables por receta { [recipeId]: portions }
  const [scaledPortions, setScaledPortions] = useState({});

  // Timer state for Modo Cocinar
  const [timerSeconds, setTimerSeconds] = useState(900);
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

  // Estado del creador de recetas
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeDesc, setNewRecipeDesc] = useState('');
  const [newRecipePortions, setNewRecipePortions] = useState(4);
  const [newRecipeTime, setNewRecipeTime] = useState(35);
  const [newRecipeDifficulty, setNewRecipeDifficulty] = useState('Media');
  const [autoAddMissingToShopping, setAutoAddMissingToShopping] = useState(true);
  const [newIngredients, setNewIngredients] = useState([
    { productName: '', amount: 1, unit: 'kg' },
  ]);

  // Evaluar receta con porciones escaladas
  const evaluateRecipeWithPortions = (recipe, customPortions = null) => {
    const basePortions = recipe.portions || 1;
    const currentPortions = customPortions || scaledPortions[recipe.id] || basePortions;
    const scaleFactor = currentPortions / basePortions;

    let canCook = true;
    let missingIngredients = [];
    let availableCount = 0;
    let totalCostMxn = 0;

    const evaluatedIngredients = (recipe.ingredients || []).map((ing) => {
      const requiredAmount = parseFloat((ing.amount * scaleFactor).toFixed(2));
      
      // Buscar en el inventario de casa usando equivalencia inteligente
      const foundProduct = products.find(
        (p) => areItemsEquivalent(p.name, ing.productName)
      );

      const availableQty = foundProduct ? (foundProduct.quantity || 0) : 0;
      const isEnough = availableQty >= requiredAmount;

      if (isEnough) {
        availableCount++;
      } else {
        canCook = false;
        const deficit = parseFloat((requiredAmount - availableQty).toFixed(2));
        missingIngredients.push({
          name: ing.productName,
          required: requiredAmount,
          available: availableQty,
          deficit: Math.max(0.1, deficit),
          unit: ing.unit,
          store: foundProduct?.store || 'Supermercado',
          unitPriceMxn: foundProduct?.unitPriceMxn || 0,
        });
      }

      if (foundProduct) {
        totalCostMxn += requiredAmount * (foundProduct.unitPriceMxn || 0);
      }

      return {
        ...ing,
        requiredAmount,
        availableQty,
        isEnough,
        foundProduct,
      };
    });

    const totalIngs = recipe.ingredients?.length || 1;
    const matchPct = Math.round((availableCount / totalIngs) * 100);
    const costPerPortionMxn = currentPortions > 0 ? totalCostMxn / currentPortions : totalCostMxn;

    return {
      canCook,
      matchPct,
      currentPortions,
      missingIngredients,
      evaluatedIngredients,
      totalCostMxn,
      costPerPortionMxn,
    };
  };

  const handleAdjustPortions = (recipeId, delta) => {
    audio.click();
    setScaledPortions((prev) => {
      const current = prev[recipeId] || recipes.find((r) => r.id === recipeId)?.portions || 4;
      const next = Math.max(1, current + delta);
      return { ...prev, [recipeId]: next };
    });
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
      { productName: '', amount: 1, unit: 'kg' },
    ]);
  };

  const handleRemoveIngredientRow = (idx) => {
    audio.delete();
    setNewIngredients(newIngredients.filter((_, i) => i !== idx));
  };

  const handleSaveNewRecipe = (e) => {
    e.preventDefault();
    if (!newRecipeName.trim()) return;

    audio.success();
    const cleanIngredients = deduplicateRecipeIngredients(
      newIngredients.filter((i) => i.productName.trim())
    );

    const createdRecipe = {
      id: `rec-${Date.now()}`,
      name: newRecipeName.trim(),
      description: newRecipeDesc.trim(),
      portions: parseInt(newRecipePortions) || 4,
      tiempoMin: parseInt(newRecipeTime) || 35,
      dificultad: newRecipeDifficulty,
      category: 'Platos de Cocina',
      ingredients: cleanIngredients,
      pasos: [
        'Mise en place: preparar y medir todos los insumos.',
        'Iniciar cocción al punto exacto deseado.',
        'Montar y servir de inmediato para alta presentación patrimonial.'
      ]
    };

    onCreateRecipe(createdRecipe);

    // Revisar y agregar faltantes al súper si el usuario lo activó
    if (autoAddMissingToShopping && onAddMissingToShoppingList) {
      const evalRes = evaluateRecipeWithPortions(createdRecipe, createdRecipe.portions);
      if (evalRes.missingIngredients.length > 0) {
        onAddMissingToShoppingList(evalRes.missingIngredients);
      }
    }

    setIsNewRecipeModalOpen(false);
    setNewRecipeName('');
    setNewRecipeDesc('');
    setNewIngredients([{ productName: '', amount: 1, unit: 'kg' }]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Bar con Estilo Editorial */}
      <div className="card-luxe p-6 border border-[#2A2521] bg-[#1C1814] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E0B441]/25 to-[#C8542A]/20 border border-[#E0B441]/40 flex items-center justify-center text-[#E0B441] shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                Cocina del Hogar & Recetario Inteligente
              </h2>
              <p className="text-xs text-[#B8AFA3] mt-0.5">
                Verifica existencias en despensa en tiempo real y manda los ingredientes faltantes al súper con 1 clic.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            audio.click();
            setIsNewRecipeModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#C8542A] to-[#E0B441] hover:brightness-110 transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agregar Nueva Receta</span>
        </button>
      </div>

      {/* Recipes Empty State */}
      {recipes.length === 0 ? (
        <div className="card-luxe text-center py-20 border border-dashed border-[#3D3630] rounded-3xl bg-[#1C1916]/40 p-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#E0B441]/15 border border-[#E0B441]/30 flex items-center justify-center text-[#E0B441]">
            <Utensils className="w-8 h-8" />
          </div>
          <h4 className="font-display text-xl font-bold text-white">
            🍳 Aún no hay recetas registradas.
          </h4>
          <p className="text-xs text-[#8B8378] mt-1.5 max-w-sm mx-auto">
            Agrega los platillos favoritos de la familia para revisar automáticamente qué ingredientes tienes y cuáles faltan en el súper.
          </p>
          <button
            onClick={() => {
              audio.click();
              setIsNewRecipeModalOpen(true);
            }}
            className="mt-6 px-6 py-3 text-xs font-bold text-white bg-gradient-to-r from-[#C8542A] to-[#E0B441] rounded-2xl shadow-md transition-all"
          >
            + Crear Primera Receta
          </button>
        </div>
      ) : (
        /* Recipes Editorial Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map((recipe, index) => {
            const evalResult = evaluateRecipeWithPortions(recipe);
            const photoUrl = recipe.foto || SAMPLE_RECIPE_PHOTOS[index % SAMPLE_RECIPE_PHOTOS.length];

            return (
              <div
                key={recipe.id}
                className="card-luxe rounded-3xl border border-[#2A2521] bg-[#14110F] overflow-hidden flex flex-col justify-between group shadow-xl hover:border-[#E0B441]/40 transition-all"
              >
                <div>
                  {/* Header con Foto Full-Bleed 16:9 + Gradiente */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[#1C1814]">
                    <img
                      src={photoUrl}
                      alt={recipe.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-90"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14110F] via-[#14110F]/40 to-transparent" />

                    {/* Badge de Disponibilidad en Despensa */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide border shadow-md flex items-center gap-1.5 ${
                        evalResult.canCook
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 backdrop-blur-md'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/50 backdrop-blur-md'
                      }`}>
                        {evalResult.canCook ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>100% En Despensa</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3 h-3 text-amber-400" />
                            <span>{evalResult.matchPct}% Listo ({evalResult.missingIngredients.length} por pedir)</span>
                          </>
                        )}
                      </span>
                    </div>

                    {/* Tiempo y Dificultad */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white font-mono flex items-center gap-1 border border-white/10">
                        <Clock className="w-3 h-3 text-[#E0B441]" />
                        <span>{recipe.tiempoMin || 30}m</span>
                      </span>
                    </div>

                    {/* Título en Base de Foto */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-display text-lg font-bold text-white leading-snug drop-shadow-md">
                        {recipe.name}
                      </h3>
                      {recipe.description && (
                        <p className="text-[11px] text-[#B8AFA3] line-clamp-1 mt-0.5">
                          {recipe.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Barra de Control de Porciones Dinámicas */}
                  <div className="p-4 bg-[#1A1613] border-b border-[#2A2521] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#B8AFA3]">Porciones:</span>
                      <div className="flex items-center gap-1 bg-[#12100E] p-1 rounded-xl border border-[#2A2521]">
                        <button
                          onClick={() => handleAdjustPortions(recipe.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center transition-all"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-xs text-[#E0B441]">
                          {evalResult.currentPortions}
                        </span>
                        <button
                          onClick={() => handleAdjustPortions(recipe.id, 1)}
                          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center transition-all"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#8B8378] block">Costo estimado:</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        ${evalResult.totalCostMxn.toFixed(2)} MXN
                      </span>
                    </div>
                  </div>

                  {/* Lista de Ingredientes con Verificación en Tiempo Real */}
                  <div className="p-4 space-y-2">
                    <span className="text-[11px] font-extrabold text-[#E0B441] uppercase tracking-wider block">
                      Ingredientes Requeridos:
                    </span>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {evalResult.evaluatedIngredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-[#12100E] border border-[#2A2521]/80"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                              ing.isEnough 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}>
                              {ing.isEnough ? '✓' : '✕'}
                            </div>
                            <span className={`truncate font-medium ${ing.isEnough ? 'text-[#F2EDE4]' : 'text-rose-200'}`}>
                              {ing.productName}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 text-right font-mono">
                            <span className="text-xs font-bold text-white">
                              {ing.requiredAmount} {ing.unit}
                            </span>
                            {!ing.isEnough && (
                              <span className="text-[10px] text-amber-300">
                                (hay {ing.availableQty})
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Botones de Acción */}
                <div className="p-4 pt-2 border-t border-[#2A2521] space-y-2 bg-[#12100E]/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCookMode(recipe)}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[#1C1814] hover:bg-[#2A2521] border border-[#3D3630] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-[#E0B441]" />
                      <span>Modo Cocinar</span>
                    </button>

                    {evalResult.canCook && (
                      <button
                        onClick={() => handleStartCook(recipe)}
                        className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#E0B441] to-[#F3C85B] hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-md"
                      >
                        <ChefHat className="w-3.5 h-3.5" />
                        <span>Descontar Stock</span>
                      </button>
                    )}
                  </div>

                  {/* Botón Proactivo: Pedir Faltantes al Súper */}
                  {!evalResult.canCook && onAddMissingToShoppingList && (
                    <button
                      onClick={() => {
                        audio.success();
                        onAddMissingToShoppingList(evalResult.missingIngredients);
                      }}
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#C8542A] to-[#E5724A] hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[#C8542A]/20 active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-amber-200" />
                      <span>🛒 Pedir {evalResult.missingIngredients.length} Faltantes al Súper (1 Clic)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CREAR NUEVA RECETA CON VERIFICACIÓN INTELIGENTE */}
      {isNewRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[#14110F] border border-[#E0B441]/30 shadow-2xl p-6 space-y-4 text-[#F2EDE4]">
            
            <div className="flex items-center justify-between border-b border-[#2A2521] pb-3">
              <div className="flex items-center gap-2.5">
                <Utensils className="w-5 h-5 text-[#E0B441]" />
                <h3 className="font-display text-lg font-bold text-white">
                  Crear Receta con Verificación Automática
                </h3>
              </div>
              <button
                onClick={() => setIsNewRecipeModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRecipe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#B8AFA3] uppercase mb-1">
                  Nombre del Platillo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Salmón Sellado con Costra de Parmesano"
                  value={newRecipeName}
                  onChange={(e) => setNewRecipeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-sm font-semibold focus:border-[#E0B441] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[#B8AFA3] uppercase mb-1">
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
                  <label className="block text-[11px] font-bold text-[#B8AFA3] uppercase mb-1">
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
                  <label className="block text-[11px] font-bold text-[#B8AFA3] uppercase mb-1">
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
                <label className="block text-xs font-bold text-[#B8AFA3] uppercase mb-1">
                  Descripción o Notas de Presentación:
                </label>
                <textarea
                  rows="2"
                  value={newRecipeDesc}
                  onChange={(e) => setNewRecipeDesc(e.target.value)}
                  placeholder="Detalles sobre cocción, emplatado o guarniciones..."
                  className="w-full px-4 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs"
                />
              </div>

              {/* Ingredientes dinámicos con autocompletado y validación de stock */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#E0B441] uppercase tracking-wider">
                    Ingredientes Necesarios:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs font-bold text-[#E0B441] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir Ingrediente</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {newIngredients.map((ing, idx) => {
                    const matchedProduct = products.find(
                      (p) => p.name.toLowerCase() === ing.productName.toLowerCase()
                    );
                    const isAvailableInHouse = matchedProduct && (matchedProduct.quantity || 0) >= (ing.amount || 0);

                    return (
                      <div key={idx} className="p-2.5 rounded-xl bg-[#12100E] border border-[#2A2521] space-y-1.5">
                        <div className="flex items-center gap-2">
                          {/* Campo de Texto con lista sugerida de la alacena */}
                          <input
                            type="text"
                            required
                            list="pantry-products-list"
                            placeholder="Nombre del ingrediente (ej. Salmón, Harina)..."
                            value={ing.productName}
                            onChange={(e) => {
                              const updated = [...newIngredients];
                              updated[idx].productName = e.target.value;
                              // Auto-completar unidad si existe en la despensa
                              const found = products.find(p => p.name.toLowerCase() === e.target.value.toLowerCase());
                              if (found) updated[idx].unit = found.unit;
                              setNewIngredients(updated);
                            }}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[#1C1814] border border-[#2A2521] text-white text-xs font-semibold focus:border-[#E0B441] outline-none"
                          />

                          <input
                            type="number"
                            step="0.1"
                            min="0.1"
                            required
                            placeholder="Cant."
                            value={ing.amount}
                            onChange={(e) => {
                              const updated = [...newIngredients];
                              updated[idx].amount = parseFloat(e.target.value) || 1;
                              setNewIngredients(updated);
                            }}
                            className="w-16 px-2 py-1.5 rounded-lg bg-[#1C1814] border border-[#2A2521] text-white text-xs font-mono font-bold text-center"
                          />

                          <input
                            type="text"
                            placeholder="kg/L"
                            value={ing.unit}
                            onChange={(e) => {
                              const updated = [...newIngredients];
                              updated[idx].unit = e.target.value;
                              setNewIngredients(updated);
                            }}
                            className="w-16 px-2 py-1.5 rounded-lg bg-[#1C1814] border border-[#2A2521] text-white text-xs text-center"
                          />

                          {newIngredients.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveIngredientRow(idx)}
                              className="p-1.5 text-gray-500 hover:text-rose-400 rounded-lg"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Feedback inteligente de inventario */}
                        {ing.productName.trim() && (
                          <div className="text-[10px] flex items-center justify-between px-1">
                            {matchedProduct ? (
                              <span className={isAvailableInHouse ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                                {isAvailableInHouse 
                                  ? `✓ Hay ${matchedProduct.quantity} ${matchedProduct.unit} en ${matchedProduct.zone || 'Alacena'}` 
                                  : `⚠️ Solo hay ${matchedProduct.quantity} ${matchedProduct.unit} (Falta compra)`}
                              </span>
                            ) : (
                              <span className="text-[#8B8378]">
                                ℹ️ Ingrediente nuevo (no está en alacena aún)
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Datalist con todos los productos de la despensa para autocompletar */}
                <datalist id="pantry-products-list">
                  {products.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>

              {/* Opción Proactiva: Mandar al súper al guardar */}
              <div className="p-3 rounded-xl bg-[#1C1814] border border-[#2A2521] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    🛒 Auto-enviar faltantes a la lista del súper
                  </span>
                  <span className="text-[10px] text-[#8B8378]">
                    Si algún ingrediente no alcanza, se agrega al súper automáticamente al guardar.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={autoAddMissingToShopping}
                  onChange={(e) => setAutoAddMissingToShopping(e.target.checked)}
                  className="w-4 h-4 accent-[#E0B441] rounded"
                />
              </div>

              {/* Botones de Acción */}
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
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#C8542A] to-[#E0B441] shadow-md hover:brightness-110 active:scale-95"
                >
                  ✓ Guardar y Analizar Despensa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODO COCINAR A PANTALLA COMPLETA */}
      {activeCookModeRecipe && (
        <div className="fixed inset-0 z-50 bg-[#0A0908] text-[#F2EDE4] overflow-y-auto p-4 sm:p-8 animate-modal-in flex flex-col justify-between">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            <div className="flex items-center justify-between border-b border-[#2A2521] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#E0B441]/20 border border-[#E0B441]/40 flex items-center justify-center text-[#E0B441]">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#E0B441] uppercase tracking-wider block">
                    Modo Cocina Activo
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
                Cerrar Modo Cocina
              </button>
            </div>

            {/* Temporizador */}
            <div className="p-6 rounded-2xl bg-[#14110F] border border-[#2A2521] text-center space-y-3">
              <span className="text-xs font-bold text-[#8B8378] uppercase tracking-wider">
                Temporizador de Cocción
              </span>
              <div className="font-mono text-5xl font-black text-[#E0B441]">
                {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                    isTimerRunning ? 'bg-amber-500 text-black' : 'bg-emerald-600 text-white'
                  }`}
                >
                  {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isTimerRunning ? 'Pausar' : 'Iniciar'}</span>
                </button>
                <button
                  onClick={() => {
                    setIsTimerRunning(false);
                    setTimerSeconds(initialTimerSeconds);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reiniciar</span>
                </button>
              </div>
            </div>

            {/* Pasos */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Pasos de Preparación:
              </h4>
              {(activeCookModeRecipe.pasos || [
                'Mise en place: preparar y medir todos los insumos.',
                'Iniciar cocción al punto exacto deseado.',
                'Montar y servir de inmediato para alta presentación patrimonial.'
              ]).map((paso, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#14110F] border border-[#2A2521] flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[#E0B441]/20 text-[#E0B441] font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-sm text-gray-200">{paso}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR DESCUENTO DE STOCK POR CONSUMO */}
      {cookingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#14110F] border border-[#E0B441]/30 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Descontar Insumos del Hogar
                </h3>
                <p className="text-xs text-[#B8AFA3]">
                  Se descontarán automáticamente las porciones de la alacena.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1C1814] border border-[#2A2521] space-y-2 text-xs">
              <div className="flex justify-between text-white font-bold">
                <span>Platillo:</span>
                <span>{cookingRecipe.name}</span>
              </div>
              <div className="flex justify-between text-[#B8AFA3]">
                <span>Porciones a descontar:</span>
                <span className="font-mono text-[#E0B441] font-bold">
                  {scaledPortions[cookingRecipe.id] || cookingRecipe.portions || 4} porciones
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#B8AFA3] uppercase mb-1">
                ¿Quién preparó el platillo?
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#12100E] border border-[#2A2521] text-white text-xs font-bold"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setCookingRecipe(null)}
                className="px-4 py-2 text-xs font-bold text-[#B8AFA3] hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCook}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 shadow-md flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar y Descontar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
