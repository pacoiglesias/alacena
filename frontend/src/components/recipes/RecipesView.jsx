import React, { useState, useEffect, useMemo } from 'react';
import {
  Utensils, ChefHat, CheckCircle2, AlertCircle, Sparkles,
  Plus, X, Check, ShoppingCart, Clock, Search,
  Flame, Play, Pause, RotateCcw, Trash2, Pencil,
  Camera, ImageOff, ArrowUp, ArrowDown
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../../services/audioService';
import { areItemsEquivalent, deduplicateRecipeIngredients } from '../../utils/deduplication';
import { getProductExpiryDate, daysUntilExpiry } from '../../utils/productExpiry';
import { notify } from '../../services/notice';
import { planRecipe } from '../../utils/cookRecipe';
import { formatHouseMoney } from '../../utils/formatMoney';

// Categorías del recetario: las que ya usan las recetas de la app
// («Platos de Cocina» era la única que el formulario podía guardar)
// más «Postres», que faltaba para dulces como la Bala baiana.
const RECIPE_CATEGORIES = [
  'Platos de Cocina',
  'Platos Fuertes',
  'Cenas & Almuerzos',
  'Pescados',
  'Postres',
];

export default function RecipesView({
  recipes = [],
  products = [],
  staffList = [],
  onCookRecipe,
  onCreateRecipe,
  onUpdateRecipe,
  onDeleteRecipe,
  onAddMissingToShoppingList,
  householdId = 'house-1',
  activeHouse,
}) {
  const [cookingRecipe, setCookingRecipe] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  // 3.14.0 (C-11): buscador de recetas por nombre o ingrediente y
  // filtro «puedo cocinarla» — el recetario no tenía ni un buscador.
  const [recipeSearch, setRecipeSearch] = useState('');
  const [onlyCookable, setOnlyCookable] = useState(false);
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
      notify('⏰ ¡Tiempo cumplido en cocina!');
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  // Estado del creador de recetas
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeDesc, setNewRecipeDesc] = useState('');
  const [newRecipePortions, setNewRecipePortions] = useState(4);
  const [newRecipeTime, setNewRecipeTime] = useState(35);
  const [newRecipeDifficulty, setNewRecipeDifficulty] = useState('Media');
  const [newRecipeCategory, setNewRecipeCategory] = useState('Platos de Cocina');
  const [newRecipePhoto, setNewRecipePhoto] = useState('');
  const [newSteps, setNewSteps] = useState(['']);
  const [autoAddMissingToShopping, setAutoAddMissingToShopping] = useState(true);
  const [newIngredients, setNewIngredients] = useState([
    { productName: '', amount: 1, unit: 'kg' },
  ]);

  // Detección proactiva de recetas para rescate de insumos (Chef Zero-Waste)
  const zeroWasteSuggestions = useMemo(() => {
    // Insumos que caducan en <= 6 días con existencia
    const expiring = products.filter((p) => {
      const expiry = getProductExpiryDate(p);
      const diffDays = daysUntilExpiry(expiry);
      if (diffDays === null || (p.quantity || 0) <= 0) return false;
      return diffDays <= 6;
    });

    if (expiring.length === 0 || recipes.length === 0) return [];

    const matched = [];
    recipes.forEach((recipe) => {
      const rescued = [];
      recipe.ingredients?.forEach((ing) => {
        const found = expiring.find((ep) => areItemsEquivalent(ep.name, ing.productName));
        if (found) {
          rescued.push(found);
        }
      });

      if (rescued.length > 0) {
        matched.push({
          recipe,
          rescuedItems: rescued,
        });
      }
    });

    return matched.slice(0, 2);
  }, [products, recipes]);

  // Evaluar receta con porciones escaladas
  const evaluateRecipeWithPortions = (recipe, customPortions = null) => planRecipe(products, recipe, householdId, customPortions || scaledPortions[recipe.id] || recipe.portions || 1);
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

    const saved = onCookRecipe(cookingRecipe, selectedStaff, scaledPortions[cookingRecipe.id] || cookingRecipe.portions);
    if (saved === false) return;
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

  // Foto propia de la receta: mismo patrón E7 que la foto de producto
  // (ManualProductModal): cámara o galería, reducida a 512 px y guardada
  // como data URL en el campo `foto` del documento de la receta.
  const handleRecipePhotoFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, 512 / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        setNewRecipePhoto(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Editor de pasos: lista de textos editable y reordenable.
  const handleAddStep = () => {
    audio.click();
    setNewSteps([...newSteps, '']);
  };

  const handleUpdateStep = (idx, value) => {
    const updated = [...newSteps];
    updated[idx] = value;
    setNewSteps(updated);
  };

  const handleRemoveStep = (idx) => {
    audio.delete();
    // Siempre queda al menos una fila (vacía) para seguir escribiendo.
    setNewSteps(newSteps.length > 1 ? newSteps.filter((_, i) => i !== idx) : ['']);
  };

  const handleMoveStep = (idx, delta) => {
    const target = idx + delta;
    if (target < 0 || target >= newSteps.length) return;
    audio.click();
    const updated = [...newSteps];
    [updated[idx], updated[target]] = [updated[target], updated[idx]];
    setNewSteps(updated);
  };

  const resetRecipeForm = () => {
    setEditingRecipe(null);
    setNewRecipeName('');
    setNewRecipeDesc('');
    setNewRecipePortions(4);
    setNewRecipeTime(35);
    setNewRecipeDifficulty('Media');
    setNewRecipeCategory('Platos de Cocina');
    setNewRecipePhoto('');
    setNewSteps(['']);
    setNewIngredients([{ productName: '', amount: 1, unit: 'kg' }]);
  };

  const handleOpenNewRecipe = () => {
    resetRecipeForm();
    setIsNewRecipeModalOpen(true);
  };

  const handleEditRecipe = (recipe) => {
    audio.click();
    setEditingRecipe(recipe);
    setNewRecipeName(recipe.name || '');
    setNewRecipeDesc(recipe.description || '');
    setNewRecipePortions(recipe.portions || 4);
    setNewRecipeTime(recipe.tiempoMin || 35);
    setNewRecipeDifficulty(recipe.dificultad || 'Media');
    setNewRecipeCategory(recipe.category || 'Platos de Cocina');
    setNewRecipePhoto(recipe.foto || '');
    setNewSteps(
      recipe.pasos?.length ? recipe.pasos.map((p) => String(p)) : ['']
    );
    setNewIngredients(
      recipe.ingredients?.length
        ? recipe.ingredients.map((i) => ({ productName: i.productName || '', amount: i.amount || 1, unit: i.unit || 'kg' }))
        : [{ productName: '', amount: 1, unit: 'kg' }]
    );
    setIsNewRecipeModalOpen(true);
  };

  const handleSaveNewRecipe = (e) => {
    e.preventDefault();
    if (!newRecipeName.trim()) return;

    audio.success();
    const cleanIngredients = deduplicateRecipeIngredients(
      newIngredients.filter((i) => i.productName.trim())
    );

    // Pasos escritos por el usuario, sin filas vacías; si no escribió
    // ninguno, la receta queda sin pasos y el Modo Cocinar usa su guía
    // genérica de respaldo (ya no se fuerzan los 3 pasos de relleno).
    const cleanSteps = newSteps.map((s) => s.trim()).filter(Boolean);

    const formFields = {
      name: newRecipeName.trim(),
      description: newRecipeDesc.trim(),
      portions: parseInt(newRecipePortions) || 4,
      tiempoMin: parseInt(newRecipeTime) || 35,
      dificultad: newRecipeDifficulty,
      category: newRecipeCategory,
      foto: newRecipePhoto || null,
      pasos: cleanSteps,
      ingredients: cleanIngredients,
    };

    // Editar conserva id y casa de la receta; el resto sale del formulario.
    const savedRecipe = editingRecipe
      ? { ...editingRecipe, ...formFields }
      : {
          id: `rec-${Date.now()}`,
          ...formFields,
        };

    if (editingRecipe) {
      onUpdateRecipe?.(savedRecipe);
    } else {
      onCreateRecipe(savedRecipe);
    }

    // Revisar y agregar faltantes al súper si el usuario lo activó
    if (autoAddMissingToShopping && onAddMissingToShoppingList) {
      const evalRes = evaluateRecipeWithPortions(savedRecipe, savedRecipe.portions);
      if (evalRes.missingIngredients.length > 0) {
        onAddMissingToShoppingList(evalRes.missingIngredients);
      }
    }

    setIsNewRecipeModalOpen(false);
    resetRecipeForm();
  };

  // E3: la confirmación de cocinar muestra la evaluación ya escalada
  // (qué se descuenta y qué falta) antes de deducir nada.
  const cookPlan = cookingRecipe ? evaluateRecipeWithPortions(cookingRecipe) : null;

  // Recetas visibles tras el buscador y el filtro «puedo cocinarla».
  const visibleRecipes = useMemo(() => {
    const query = recipeSearch.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (onlyCookable && !evaluateRecipeWithPortions(recipe).canCook) return false;
      if (!query) return true;
      if ((recipe.name || '').toLowerCase().includes(query)) return true;
      return (recipe.ingredients || []).some((ing) => (ing.productName || '').toLowerCase().includes(query));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipes, recipeSearch, onlyCookable, products, scaledPortions]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Header Bar con Estilo Editorial */}
      <div className="card-luxe p-6 border border-[var(--border-soft)] bg-[var(--bg-elevated)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[var(--gold)]/25 to-[var(--terracotta)]/20 border border-[var(--gold)]/40 flex items-center justify-center text-[var(--gold)] shadow-md">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                Cocina del Hogar & Recetario Inteligente
              </h2>
              <p className="text-xs text-[var(--ink-secondary)] mt-0.5">
                Verifica existencias en despensa en tiempo real y manda los ingredientes faltantes al súper con 1 clic.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            audio.click();
            handleOpenNewRecipe();
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[var(--terracotta)] to-[var(--gold)] hover:brightness-110 transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Agregar Nueva Receta</span>
        </button>
      </div>

      {/* Banner Proactivo: Chef Zero-Waste / Rescate de Insumos */}
      {zeroWasteSuggestions.length > 0 && (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in shadow-lg">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                  Chef Zero-Waste · Rescate de Insumos Próximos a Vencer
                </span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-200 text-[10px] font-bold">
                  Recomendado Hoy
                </span>
              </div>
              <p className="text-xs text-white font-medium mt-1">
                Detectamos ingredientes en alacena que vencen pronto ({zeroWasteSuggestions[0].rescuedItems.map(i => i.name).join(', ')}). 
                ¡Aprovecha para cocinar <strong>{zeroWasteSuggestions[0].recipe.name}</strong> y evitar desperdicio!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => {
                handleOpenCookMode(zeroWasteSuggestions[0].recipe);
              }}
              className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:brightness-110 shadow-md shadow-amber-950/40 transition-all active:scale-95"
            >
              <Flame className="w-4 h-4 text-amber-200" />
              <span>Cocinar {zeroWasteSuggestions[0].recipe.name}</span>
            </button>
          </div>
        </div>
      )}

      {/* Buscador de recetas (3.14.0, C-11) */}
      {recipes.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-[var(--ink-tertiary)]" />
            <input
              type="text"
              value={recipeSearch}
              onChange={(e) => setRecipeSearch(e.target.value)}
              placeholder="Buscar por receta o ingrediente…"
              aria-label="Buscar recetas"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-soft)] text-white placeholder-[var(--ink-tertiary)] text-sm focus:outline-none focus:border-[var(--gold)] transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => { audio.click(); setOnlyCookable((v) => !v); }}
            aria-pressed={onlyCookable}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
              onlyCookable
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-[var(--bg-elevated)] border-[var(--border-soft)] text-[var(--ink-secondary)] hover:text-white'
            }`}
          >
            Puedo cocinarla hoy
          </button>
        </div>
      )}

      {/* Recipes Empty State */}
      {recipes.length === 0 ? (
        <div className="card-luxe text-center py-20 border border-dashed border-[var(--border-strong)] rounded-3xl bg-[var(--bg-elevated)]/40 p-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)]">
            <Utensils className="w-8 h-8" />
          </div>
          <h4 className="font-display text-xl font-bold text-white">
            Aún no hay recetas registradas.
          </h4>
          <p className="text-xs text-[var(--ink-tertiary)] mt-1.5 max-w-sm mx-auto">
            Agrega los platillos favoritos de la familia para revisar automáticamente qué ingredientes tienes y cuáles faltan en el súper.
          </p>
          <button
            onClick={() => {
              audio.click();
              handleOpenNewRecipe();
            }}
            className="mt-6 px-6 py-3 text-xs font-bold text-white bg-gradient-to-r from-[var(--terracotta)] to-[var(--gold)] rounded-2xl shadow-md transition-all"
          >
            + Crear Primera Receta
          </button>
        </div>
      ) : visibleRecipes.length === 0 ? (
        <div className="card-luxe text-center py-14 border border-dashed border-[var(--border-strong)] rounded-3xl bg-[var(--bg-elevated)]/40 p-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[var(--gold)]/15 border border-[var(--gold)]/30 flex items-center justify-center text-[var(--gold)]">
            <Search className="w-7 h-7" />
          </div>
          <h4 className="font-display text-lg font-bold text-white">
            Ninguna receta coincide con ese filtro.
          </h4>
          <p className="text-xs text-[var(--ink-tertiary)] mt-1.5 max-w-sm mx-auto">
            Prueba con otro nombre o ingrediente, o quita el filtro de «puedo cocinarla».
          </p>
          <button
            onClick={() => {
              audio.click();
              setRecipeSearch('');
              setOnlyCookable(false);
            }}
            className="mt-5 px-5 py-2.5 text-xs font-bold text-white bg-white/10 hover:bg-white/20 border border-white/15 rounded-xl transition-all"
          >
            Ver todas las recetas
          </button>
        </div>
      ) : (
        /* Recipes Editorial Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleRecipes.map((recipe) => {
            const evalResult = evaluateRecipeWithPortions(recipe);

            return (
              <div
                key={recipe.id}
                className="card-luxe rounded-3xl border border-[var(--border-soft)] bg-[var(--bg-base)] overflow-hidden flex flex-col justify-between group shadow-xl hover:border-[var(--gold)]/40 transition-all"
              >
                <div>
                  {/* Header con Foto Full-Bleed 16:9 + Gradiente */}
                  <div className="relative aspect-video w-full overflow-hidden bg-[var(--bg-elevated)]">
                    {recipe.foto ? (
                      <img
                        src={recipe.foto}
                        alt={recipe.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 brightness-90"
                      />
                    ) : (
                      /* Sin foto propia: marcador neutro, nada de fotos de stock. */
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--ink-tertiary)]">
                        <ImageOff className="w-10 h-10" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Sin foto</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)] via-[var(--bg-base)]/40 to-transparent" />

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

                    {/* Tiempo y Categoría — 3.14.0 (C-3): sin tiempo
                        real no se inventan «30m»; no sale insignia. */}
                    <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
                      {recipe.tiempoMin > 0 && (
                        <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-white font-mono flex items-center gap-1 border border-white/10">
                          <Clock className="w-3 h-3 text-[var(--gold)]" />
                          <span>{recipe.tiempoMin}m</span>
                        </span>
                      )}
                      {recipe.category && (
                        <span className="px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-[10px] text-[var(--gold)] font-bold border border-white/10">
                          {recipe.category}
                        </span>
                      )}
                    </div>

                    {/* Título en Base de Foto */}
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="font-display text-lg font-bold text-white leading-snug drop-shadow-md">
                        {recipe.name}
                      </h3>
                      {recipe.description && (
                        <p className="text-[11px] text-[var(--ink-secondary)] line-clamp-1 mt-0.5">
                          {recipe.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Barra de Control de Porciones Dinámicas */}
                  <div className="p-4 bg-[var(--bg-sunken)] border-b border-[var(--border-soft)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[var(--ink-secondary)]">Porciones:</span>
                      <div className="flex items-center gap-1 bg-[var(--bg-base)] p-1 rounded-xl border border-[var(--border-soft)]">
                        <button
                          onClick={() => handleAdjustPortions(recipe.id, -1)}
                          className="w-6 h-6 rounded-lg bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center transition-all"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-mono font-bold text-xs text-[var(--gold)]">
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
                      <span className="text-[10px] text-[var(--ink-tertiary)] block">Costo estimado:</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {formatHouseMoney(activeHouse, evalResult.totalCostMxn)}
                      </span>
                    </div>
                  </div>

                  {/* Lista de Ingredientes con Verificación en Tiempo Real */}
                  <div className="p-4 space-y-2">
                    <span className="text-[11px] font-extrabold text-[var(--gold)] uppercase tracking-wider block">
                      Ingredientes Requeridos:
                    </span>
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {evalResult.evaluatedIngredients.map((ing, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)]/80"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
                              ing.isEnough 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            }`}>
                              {ing.isEnough ? '✓' : '✕'}
                            </div>
                            <span className={`truncate font-medium ${ing.isEnough ? 'text-[var(--ink-primary)]' : 'text-rose-200'}`}>
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
                <div className="p-4 pt-2 border-t border-[var(--border-soft)] space-y-2 bg-[var(--bg-base)]/80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenCookMode(recipe)}
                      className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-white bg-[var(--bg-elevated)] hover:bg-[var(--border-soft)] border border-[var(--border-strong)] transition-all flex items-center justify-center gap-1.5"
                    >
                      <Play className="w-3.5 h-3.5 text-[var(--gold)]" />
                      <span>Modo Cocinar</span>
                    </button>

                    {evalResult.canCook && (
                      <button
                        onClick={() => handleStartCook(recipe)}
                        className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[var(--gold)] to-[var(--gold)] hover:brightness-110 transition-all flex items-center justify-center gap-1.5 shadow-md"
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
                      className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[var(--terracotta)] to-[var(--ember)] hover:brightness-110 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-[var(--terracotta)]/20 active:scale-95"
                    >
                      <ShoppingCart className="w-3.5 h-3.5 text-amber-200" />
                      <span>🛒 Pedir {evalResult.missingIngredients.length} Faltantes al Súper (1 Clic)</span>
                    </button>
                  )}

                  {/* Editar / Borrar: se guardan en la nube al momento */}
                  {(onUpdateRecipe || onDeleteRecipe) && (
                    <div className="flex items-center gap-2">
                      {onUpdateRecipe && (
                        <button
                          onClick={() => handleEditRecipe(recipe)}
                          className="flex-1 py-2 px-3 rounded-xl text-[11px] font-bold text-[var(--ink-secondary)] bg-[var(--bg-elevated)] hover:text-white border border-[var(--border-soft)] transition-all flex items-center justify-center gap-1.5"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>Editar</span>
                        </button>
                      )}
                      {onDeleteRecipe && (confirmDeleteId === recipe.id ? (
                        <>
                          <button
                            onClick={() => { audio.delete(); onDeleteRecipe(recipe.id); setConfirmDeleteId(null); }}
                            className="flex-1 py-2 px-3 rounded-xl text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all"
                          >
                            Sí, borrar
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="flex-1 py-2 px-3 rounded-xl text-[11px] font-bold text-[var(--ink-secondary)] bg-[var(--bg-elevated)] border border-[var(--border-soft)] transition-all"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { audio.click(); setConfirmDeleteId(recipe.id); }}
                          className="flex-1 py-2 px-3 rounded-xl text-[11px] font-bold text-[var(--ink-secondary)] hover:text-rose-300 bg-[var(--bg-elevated)] border border-[var(--border-soft)] transition-all flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Borrar</span>
                        </button>
                      ))}
                    </div>
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
          <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl bg-[var(--bg-base)] border border-[var(--gold)]/30 shadow-2xl p-6 space-y-4 text-[var(--ink-primary)]">
            
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-3">
              <div className="flex items-center gap-2.5">
                <Utensils className="w-5 h-5 text-[var(--gold)]" />
                <h3 className="font-display text-lg font-bold text-white">
                  {editingRecipe ? 'Editar Receta' : 'Crear Receta con Verificación Automática'}
                </h3>
              </div>
              <button aria-label="Cerrar"
                onClick={() => { setIsNewRecipeModalOpen(false); resetRecipeForm(); }}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRecipe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase mb-1">
                  Nombre del Platillo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Salmón Sellado con Costra de Parmesano"
                  value={newRecipeName}
                  onChange={(e) => setNewRecipeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-sm font-semibold focus:border-[var(--gold)] outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-secondary)] uppercase mb-1">
                    Porciones:
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newRecipePortions}
                    onChange={(e) => setNewRecipePortions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-secondary)] uppercase mb-1">
                    Tiempo (min):
                  </label>
                  <input
                    type="number"
                    min="5"
                    value={newRecipeTime}
                    onChange={(e) => setNewRecipeTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[var(--ink-secondary)] uppercase mb-1">
                    Dificultad:
                  </label>
                  <select
                    value={newRecipeDifficulty}
                    onChange={(e) => setNewRecipeDifficulty(e.target.value)}
                    className="w-full px-2 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs font-bold"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase mb-1">
                  Descripción o Notas de Presentación:
                </label>
                <textarea
                  rows="2"
                  value={newRecipeDesc}
                  onChange={(e) => setNewRecipeDesc(e.target.value)}
                  placeholder="Detalles sobre cocción, emplatado o guarniciones..."
                  className="w-full px-4 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase mb-1">
                  Categoría:
                </label>
                <select
                  value={newRecipeCategory}
                  onChange={(e) => setNewRecipeCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs font-bold"
                >
                  {(RECIPE_CATEGORIES.includes(newRecipeCategory)
                    ? RECIPE_CATEGORIES
                    : [newRecipeCategory, ...RECIPE_CATEGORIES]
                  ).map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Foto propia de la receta (mismo patrón E7 que productos) */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)]">
                {newRecipePhoto ? (
                  <img src={newRecipePhoto} alt="Foto de la receta" className="w-14 h-14 rounded-xl object-cover border border-[var(--border-soft)]" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/5 border border-[var(--border-soft)] flex items-center justify-center text-[var(--ink-tertiary)]">
                    <Camera className="w-5 h-5" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-[var(--ink-secondary)] uppercase tracking-wider">Foto del platillo</span>
                  <span className="block text-[11px] text-[var(--ink-tertiary)]">Se ve en la tarjeta de la receta. Sin foto, la tarjeta muestra «Sin foto». Opcional.</span>
                </div>
                <label className="px-3 py-2 rounded-xl bg-[var(--gold)] text-[var(--on-gold)] text-xs font-bold cursor-pointer shrink-0">
                  {newRecipePhoto ? 'Cambiar foto' : 'Tomar foto'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleRecipePhotoFile(e.target.files?.[0])}
                  />
                </label>
                {newRecipePhoto && (
                  <button type="button" onClick={() => setNewRecipePhoto('')} className="px-2 py-2 text-xs font-bold text-rose-400 hover:text-white shrink-0" aria-label="Quitar foto">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Ingredientes dinámicos con autocompletado y validación de stock */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider">
                    Ingredientes Necesarios:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs font-bold text-[var(--gold)] hover:underline flex items-center gap-1"
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
                      <div key={idx} className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] space-y-1.5">
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
                            className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-soft)] text-white text-xs font-semibold focus:border-[var(--gold)] outline-none"
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
                            className="w-16 px-2 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-soft)] text-white text-xs font-mono font-bold text-center"
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
                            className="w-16 px-2 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-soft)] text-white text-xs text-center"
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
                              <span className="text-[var(--ink-tertiary)]">
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

              {/* Editor de pasos reales de la receta */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider">
                    Pasos de Preparación:
                  </span>
                  <button
                    type="button"
                    onClick={handleAddStep}
                    className="text-xs font-bold text-[var(--gold)] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Añadir Paso</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {newSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)]">
                      <span className="w-6 h-6 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] font-bold text-xs flex items-center justify-center shrink-0 mt-1">
                        {idx + 1}
                      </span>
                      <textarea
                        rows="2"
                        value={step}
                        onChange={(e) => handleUpdateStep(idx, e.target.value)}
                        placeholder={`Paso ${idx + 1}: describe qué hay que hacer...`}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-soft)] text-white text-xs focus:border-[var(--gold)] outline-none"
                      />
                      <div className="flex flex-col gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-gray-500 hover:text-white rounded-lg disabled:opacity-30"
                          aria-label="Subir paso"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStep(idx, 1)}
                          disabled={idx === newSteps.length - 1}
                          className="p-1 text-gray-500 hover:text-white rounded-lg disabled:opacity-30"
                          aria-label="Bajar paso"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveStep(idx)}
                          className="p-1 text-gray-500 hover:text-rose-400 rounded-lg"
                          aria-label="Borrar paso"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--ink-tertiary)]">
                  Estos son los pasos que se ven en el Modo Cocinar. Si los dejas vacíos, se usa una guía genérica.
                </p>
              </div>

              {/* Opción Proactiva: Mandar al súper al guardar */}
              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-soft)] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">
                    🛒 Auto-enviar faltantes a la lista del súper
                  </span>
                  <span className="text-[10px] text-[var(--ink-tertiary)]">
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
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-soft)]">
                <button
                  type="button"
                  onClick={() => { setIsNewRecipeModalOpen(false); resetRecipeForm(); }}
                  className="px-4 py-2 text-xs font-bold text-[var(--ink-tertiary)] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[var(--terracotta)] to-[var(--gold)] shadow-md hover:brightness-110 active:scale-95"
                >
                  {editingRecipe ? '✓ Guardar Cambios' : '✓ Guardar y Analizar Despensa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODO COCINAR A PANTALLA COMPLETA */}
      {activeCookModeRecipe && (
        <div className="fixed inset-0 z-50 bg-[var(--bg-sunken)] text-[var(--ink-primary)] overflow-y-auto p-4 sm:p-8 animate-modal-in flex flex-col justify-between">
          <div className="max-w-3xl mx-auto w-full space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--border-soft)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/20 border border-[var(--gold)]/40 flex items-center justify-center text-[var(--gold)]">
                  <ChefHat className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[var(--gold)] uppercase tracking-wider block">
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
                className="px-4 py-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--border-soft)] border border-[var(--border-strong)] text-xs font-bold text-white"
              >
                Cerrar Modo Cocina
              </button>
            </div>

            {/* Temporizador */}
            <div className="p-6 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-center space-y-3">
              <span className="text-xs font-bold text-[var(--ink-tertiary)] uppercase tracking-wider">
                Temporizador de Cocción
              </span>
              <div className="font-mono text-5xl font-black text-[var(--gold)]">
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
              {(activeCookModeRecipe.pasos?.length ? activeCookModeRecipe.pasos : [
                'Mise en place: preparar y medir todos los insumos.',
                'Iniciar cocción al punto exacto deseado.',
                'Montar y servir de inmediato para alta presentación patrimonial.'
              ]).map((paso, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-[var(--gold)]/20 text-[var(--gold)] font-bold text-xs flex items-center justify-center shrink-0">
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
          <div className="relative w-full max-w-md rounded-3xl bg-[var(--bg-base)] border border-[var(--gold)]/30 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <ChefHat className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Descontar Insumos del Hogar
                </h3>
                <p className="text-xs text-[var(--ink-secondary)]">
                  Se descontarán automáticamente las porciones de la alacena.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-soft)] space-y-2 text-xs">
              <div className="flex justify-between text-white font-bold">
                <span>Platillo:</span>
                <span>{cookingRecipe.name}</span>
              </div>
              <div className="flex justify-between text-[var(--ink-secondary)]">
                <span>Porciones a descontar:</span>
                <span className="font-mono text-[var(--gold)] font-bold">
                  {scaledPortions[cookingRecipe.id] || cookingRecipe.portions || 4} porciones
                </span>
              </div>
            </div>

            {/* E3: qué se descuenta y qué falta, antes de confirmar. */}
            {cookPlan && (
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-soft)] space-y-1.5 text-xs">
                <div className="font-bold text-white">Se descontará de la despensa:</div>
                {cookPlan.evaluatedIngredients.map((ing, idx) => (
                  <div key={idx} className="flex justify-between gap-2">
                    <span className={ing.isEnough ? 'text-[var(--ink-secondary)]' : 'text-rose-300 font-bold'}>
                      {ing.productName} — {ing.requiredAmount} {ing.unit}
                    </span>
                    <span className={ing.isEnough ? 'text-emerald-300 font-mono' : 'text-rose-300 font-mono font-bold'}>
                      {ing.isEnough ? `tienes ${ing.availableQty}` : `tienes ${ing.availableQty} · faltan ${Math.round((ing.requiredAmount - ing.availableQty) * 1000) / 1000}`}
                    </span>
                  </div>
                ))}
                {!cookPlan.canCook && (
                  <div className="pt-1.5 text-rose-300 font-bold" role="alert">
                    ⚠️ Faltan ingredientes: no se descontará nada. Manda los faltantes al súper o ajusta las porciones.
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[var(--ink-secondary)] uppercase mb-1">
                ¿Quién preparó el platillo?
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-soft)] text-white text-xs font-bold"
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
                className="px-4 py-2 text-xs font-bold text-[var(--ink-secondary)] hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCook}
                disabled={!!cookPlan && !cookPlan.canCook}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-emerald-500 hover:brightness-110 shadow-md flex items-center gap-1.5 disabled:opacity-40 disabled:hover:brightness-100"
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
