import React, { useState } from 'react';
import { 
  Utensils, ChefHat, CheckCircle2, AlertCircle, Sparkles, 
  Plus, Users, DollarSign, X, Check 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { audio } from '../../services/audioService';

export default function RecipesView({
  recipes,
  products,
  staffList,
  onCookRecipe,
  onCreateRecipe,
}) {
  const [cookingRecipe, setCookingRecipe] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [isNewRecipeModalOpen, setIsNewRecipeModalOpen] = useState(false);

  // New recipe state
  const [newRecipeName, setNewRecipeName] = useState('');
  const [newRecipeDesc, setNewRecipeDesc] = useState('');
  const [newRecipePortions, setNewRecipePortions] = useState(4);
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
      category: 'Platos de Cocina',
      ingredients: newIngredients,
    });

    setIsNewRecipeModalOpen(false);
    setNewRecipeName('');
    setNewRecipeDesc('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-purple-500/15 border border-purple-500/25 text-purple-400">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Control de Cocina & Recetas de Restaurante
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                Evalúa ingredientes disponibles en tu despensa y cámara fría, costea por plato y deduce el inventario con atribución al personal.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            audio.click();
            setIsNewRecipeModalOpen(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all shadow-lg shadow-purple-950/40"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nueva Receta</span>
        </button>
      </div>

      {/* Recipes Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map((recipe) => {
          const evalResult = evaluateRecipe(recipe);

          return (
            <div
              key={recipe.id}
              className="glass-card p-6 rounded-3xl border border-white/10 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-500/15 px-2 py-0.5 rounded-md border border-purple-500/25">
                      {recipe.category || 'Cocina'}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2 leading-snug">
                      {recipe.name}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-400 font-semibold bg-white/5 px-2.5 py-1 rounded-lg">
                    <Users className="w-3.5 h-3.5" />
                    <span>{recipe.portions} porc.</span>
                  </div>
                </div>

                {recipe.description && (
                  <p className="text-xs text-gray-400 mb-4 line-clamp-2">
                    {recipe.description}
                  </p>
                )}

                {/* Financial Costing in MXN */}
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 mb-4 grid grid-cols-2 gap-2 text-center">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-semibold">Costo Total Receta</span>
                    <span className="text-sm font-mono font-bold text-white">
                      ${evalResult.totalCostMxn.toFixed(2)} <span className="text-[10px] text-gray-500">MXN</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-emerald-400 block font-semibold">Costo / Porción</span>
                    <span className="text-sm font-mono font-bold text-emerald-300">
                      ${evalResult.costPerPortionMxn.toFixed(2)} <span className="text-[10px] text-gray-500">MXN</span>
                    </span>
                  </div>
                </div>

                {/* Ingredients list with availability tag */}
                <div className="space-y-2 mb-5">
                  <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                    Ingredientes Requeridos:
                  </span>
                  {recipe.ingredients.map((ing, idx) => {
                    const product = products.find(
                      (p) => p.name.toLowerCase() === ing.productName.toLowerCase()
                    );
                    const isAvailable = product && (product.quantity || 0) >= ing.amount;

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs py-1 border-b border-white/5"
                      >
                        <span className="text-gray-300 truncate max-w-[180px]">
                          {ing.productName}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-gray-400">
                            {ing.amount} {ing.unit}
                          </span>
                          {isAvailable ? (
                            <span className="w-2 h-2 rounded-full bg-emerald-400" title="Stock suficiente" />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-rose-400" title="Stock insuficiente" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Cook Action Button */}
              <div>
                {evalResult.canCook ? (
                  <button
                    onClick={() => handleStartCook(recipe)}
                    className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40"
                  >
                    <ChefHat className="w-4 h-4" />
                    <span>🍳 Cocinar y Descontar</span>
                  </button>
                ) : (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Faltan Insumos en Alacena:</span>
                    </div>
                    <ul className="text-[11px] text-gray-400 list-disc list-inside">
                      {evalResult.missingIngredients.map((m, i) => (
                        <li key={i}>
                          {m.name} (Tienes {m.available} de {m.required} {m.unit})
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Confirm Cook with Staff Attribution */}
      {cookingRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <ChefHat className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">
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

            <p className="text-xs text-gray-300">
              Se descontarán los ingredientes de <strong>{cookingRecipe.name}</strong> automáticamente del inventario.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                ¿Quién realizó la preparación? (Para Auditoría)
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#1E293B] border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
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
                className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmCook}
                className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-lg shadow-purple-950/40"
              >
                <Check className="w-4 h-4" />
                <span>Confirmar y Descontar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create Recipe */}
      {isNewRecipeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0F172A] border border-white/10 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-base font-bold text-white">Nueva Receta de Cocina</h3>
              <button
                onClick={() => setIsNewRecipeModalOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewRecipe} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                  Nombre del Platillo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Risotto con Hongos y Parmesano..."
                  value={newRecipeName}
                  onChange={(e) => setNewRecipeName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Porciones *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newRecipePortions}
                    onChange={(e) => setNewRecipePortions(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-300 uppercase mb-1">
                    Descripción Breve
                  </label>
                  <input
                    type="text"
                    placeholder="Instrucciones o notas..."
                    value={newRecipeDesc}
                    onChange={(e) => setNewRecipeDesc(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-gray-300 uppercase">
                    Ingredientes Requeridos
                  </label>
                  <button
                    type="button"
                    onClick={handleAddIngredientRow}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300"
                  >
                    + Agregar Ingrediente
                  </button>
                </div>

                <div className="space-y-2">
                  {newIngredients.map((ing, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        value={ing.productName}
                        onChange={(e) => {
                          const updated = [...newIngredients];
                          updated[i].productName = e.target.value;
                          setNewIngredients(updated);
                        }}
                        className="flex-1 px-3 py-2 rounded-lg bg-[#1E293B] border border-white/10 text-white text-xs"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="any"
                        min="0.01"
                        required
                        value={ing.amount}
                        onChange={(e) => {
                          const updated = [...newIngredients];
                          updated[i].amount = parseFloat(e.target.value) || 0;
                          setNewIngredients(updated);
                        }}
                        className="w-20 px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                      />
                      <input
                        type="text"
                        value={ing.unit}
                        onChange={(e) => {
                          const updated = [...newIngredients];
                          updated[i].unit = e.target.value;
                          setNewIngredients(updated);
                        }}
                        className="w-16 px-2 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono"
                        placeholder="kg, l..."
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewRecipeModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-400"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl"
                >
                  Guardar Receta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
