import React, { useState, useMemo } from 'react';
import { 
  Sparkles, AlertCircle, ShoppingCart, Utensils, Wine, 
  TrendingUp, Check, ChevronRight, Clock, Zap, ArrowRight, ShieldCheck, Flame
} from 'lucide-react';
import { audio } from '../../services/audioService';

export default function ProactiveHomeAdvisor({
  products = [],
  recipes = [],
  onAddToShoppingList,
  onOpenShoppingTab,
  onOpenRecipesTab,
  onOpenWineTasting,
}) {
  const [addedItems, setAddedItems] = useState({});
  const [activeCardTab, setActiveCardTab] = useState('all'); // 'all' | 'alerts' | 'meals' | 'cellar'

  // 1. Análisis Inteligente de Desabasto Preventivo (Burn Rate & Predictor)
  const predictiveAlerts = useMemo(() => {
    return products
      .map((p) => {
        const qty = p.quantity || 0;
        const min = p.minStock || 2;
        const max = p.maxStock || p.idealStock || 5;
        const weeklyBurn = p.burnRateWeekly || (qty <= min ? 1.5 : 1.0);
        
        // Días estimados hasta quedarse sin producto
        const daysLeft = weeklyBurn > 0 ? Math.max(1, Math.round((qty / weeklyBurn) * 7)) : 99;
        const isUrgent = qty <= min || daysLeft <= 4;
        const suggestedBuy = Math.max(1, Math.round(max - qty));

        return {
          product: p,
          qty,
          min,
          max,
          weeklyBurn,
          daysLeft,
          isUrgent,
          suggestedBuy,
        };
      })
      .filter((item) => item.isUrgent)
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 4);
  }, [products]);

  // 2. Recomendación de Recetas de Hoy (100% realizables con lo que hay en casa)
  const cookingSuggestions = useMemo(() => {
    return recipes.map((recipe) => {
      let availableCount = 0;
      const totalCount = recipe.ingredients?.length || 1;

      recipe.ingredients?.forEach((ing) => {
        const found = products.find(
          (p) => p.name.toLowerCase().includes(ing.productName.toLowerCase()) || 
                 ing.productName.toLowerCase().includes(p.name.toLowerCase())
        );
        if (found && (found.quantity || 0) >= (ing.amount || 0.1)) {
          availableCount++;
        }
      });

      const matchPct = Math.round((availableCount / totalCount) * 100);
      return {
        recipe,
        matchPct,
        isReadyNow: matchPct === 100,
      };
    }).sort((a, b) => b.matchPct - a.matchPct);
  }, [recipes, products]);

  // 3. Recomendación de Cava y Maridaje del Sommelier
  const sommelierPick = useMemo(() => {
    const wines = products.filter((p) => p.isWine || p.category === 'Vinos & Licores');
    if (wines.length === 0) return null;

    // Buscar una botella con excelente calificación y stock disponible
    const readyWine = wines.find((w) => (w.quantity || 0) > 0 && (w.rating || 5) >= 5) || wines[0];
    
    // Buscar si hay proteína en casa que combine
    const matchingMeat = products.find(
      (p) => (p.category.includes('Carnes') || p.category.includes('Pescados')) && (p.quantity || 0) > 0
    );

    return {
      wine: readyWine,
      pairWith: matchingMeat?.name || readyWine.foodPairing || 'Cortes finos y quesos curados',
      location: readyWine.cavaLocation || 'Cava Principal',
    };
  }, [products]);

  // Agregar 1 sugerencia a la lista de compras
  const handleAddSingleSuggestion = (item) => {
    audio.success();
    if (onAddToShoppingList) {
      onAddToShoppingList({
        id: `shop-${Date.now()}-${Math.random()}`,
        name: item.product.name,
        quantity: item.suggestedBuy,
        unit: item.product.unit,
        store: item.product.store || 'Supermercado',
        estimatedPriceMxn: item.product.unitPriceMxn || 0,
        targetZone: item.product.zone || 'Alacena Principal',
        checked: false,
      });

      setAddedItems((prev) => ({ ...prev, [item.product.id]: true }));
    }
  };

  // Agregar TODAS las sugerencias preventivas con 1 solo clic
  const handleAddAllSuggestions = () => {
    audio.cook();
    if (onAddToShoppingList && predictiveAlerts.length > 0) {
      predictiveAlerts.forEach((item) => {
        onAddToShoppingList({
          id: `shop-${Date.now()}-${Math.random()}`,
          name: item.product.name,
          quantity: item.suggestedBuy,
          unit: item.product.unit,
          store: item.product.store || 'Supermercado',
          estimatedPriceMxn: item.product.unitPriceMxn || 0,
          targetZone: item.product.zone || 'Alacena Principal',
          checked: false,
        });
      });

      const newAdded = {};
      predictiveAlerts.forEach((item) => { newAdded[item.product.id] = true; });
      setAddedItems(newAdded);
      alert(`⚡ ¡Listo! Se agregaron ${predictiveAlerts.length} productos sugeridos a tu lista del súper.`);
    }
  };

  return (
    <div className="rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-[#1C1814] via-[#161311] to-[#0F0D0B] border border-[#E0B441]/30 shadow-2xl relative overflow-hidden space-y-5 animate-fade-in">
      
      {/* Resplandor decorativo de fondo */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#E0B441]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#6B1F2E]/10 rounded-full blur-2xl pointer-events-none" />

      {/* Cabecera del Asistente Proactivo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E0B441]/25 to-[#C8542A]/20 border border-[#E0B441]/40 flex items-center justify-center text-[#E0B441] shadow-lg shadow-[#E0B441]/10 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg sm:text-xl font-bold text-white tracking-wide">
                Asistente Proactivo del Hogar
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E0B441]/20 text-[#E0B441] border border-[#E0B441]/40 text-[10px] font-mono-num font-extrabold uppercase">
                IA Activa
              </span>
            </div>
            <p className="text-xs text-[#B8AFA3] mt-0.5">
              Aprende el ritmo de consumo de tu casa y te sugiere qué cocinar, qué descorchar y qué pedir antes de que se agote.
            </p>
          </div>
        </div>

        {/* Botón Maestro: Agregar Todo con 1 Clic */}
        {predictiveAlerts.length > 0 && (
          <button
            onClick={handleAddAllSuggestions}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#C8542A] to-[#E5724A] hover:brightness-110 transition-all shadow-md shadow-[#C8542A]/30 active:scale-95 shrink-0 self-stretch sm:self-auto justify-center"
          >
            <Zap className="w-4 h-4 text-amber-200" />
            <span>⚡ Pedir Todo lo Sugerido ({predictiveAlerts.length})</span>
          </button>
        )}
      </div>

      {/* Grid de 3 Pilares Inteligentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 relative z-10">
        
        {/* PILAR 1: Predicción de Desabasto en Casa */}
        <div className="p-4 rounded-2xl bg-[#12100E] border border-[#2A2521] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#E0B441] uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Predicciones de Desabasto
              </span>
              <span className="text-[10px] text-[#8B8378] font-mono">
                {predictiveAlerts.length} por terminar
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {predictiveAlerts.length === 0 ? (
                <div className="p-3 text-center text-xs text-[#8B8378] bg-[#1C1916] rounded-xl">
                  ✓ Despensa completa: No se prevén desabastos esta semana.
                </div>
              ) : (
                predictiveAlerts.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-[#1C1916] border border-[#2A2521] flex items-center justify-between gap-2 hover:border-[#3D3630] transition-all"
                  >
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {item.product.name}
                      </h4>
                      <div className="text-[10px] text-amber-300 flex items-center gap-1 mt-0.5">
                        <span>⏳ Se acaba en ~{item.daysLeft} días</span>
                        <span>•</span>
                        <span className="text-[#8B8378]">Quedan {item.qty} {item.product.unit}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleAddSingleSuggestion(item)}
                      disabled={addedItems[item.product.id]}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                        addedItems[item.product.id]
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#C8542A] hover:bg-[#E5724A] text-white'
                      }`}
                    >
                      {addedItems[item.product.id] ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Listo</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-3 h-3" />
                          <span>+{item.suggestedBuy}</span>
                        </>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-[10px] text-[#8B8378] pt-2 border-t border-[#2A2521] flex items-center justify-between">
            <span>Calculado según el consumo semanal familiar</span>
            <span className="text-amber-400 font-bold">100% Automático</span>
          </div>
        </div>

        {/* PILAR 2: ¿Qué Cocinamos Hoy con lo que Hay? */}
        <div className="p-4 rounded-2xl bg-[#12100E] border border-[#2A2521] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5" />
                ¿Qué Cocinamos Hoy?
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                100% En Despensa
              </span>
            </div>

            {cookingSuggestions.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/25 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white truncate">
                    {cookingSuggestions[0].recipe.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    {cookingSuggestions[0].matchPct}% Listo
                  </span>
                </div>
                <p className="text-[11px] text-[#B8AFA3] line-clamp-2">
                  {cookingSuggestions[0].recipe.description}
                </p>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[10px] text-[#8B8378]">
                    {cookingSuggestions[0].recipe.portions} porciones familiares
                  </span>
                  <button
                    onClick={() => {
                      audio.click();
                      if (onOpenRecipesTab) onOpenRecipesTab();
                    }}
                    className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                  >
                    <span>Ver Receta</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-[#8B8378] pt-2 border-t border-[#2A2521]">
            Aprovecha los insumos que ya tienes para no desperdiciar nada.
          </div>
        </div>

        {/* PILAR 3: Recomendación Sommelier para el Fin de Semana */}
        <div className="p-4 rounded-2xl bg-[#12100E] border border-[#2A2521] flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#E0B441] uppercase tracking-wider flex items-center gap-1.5">
                <Wine className="w-3.5 h-3.5" />
                Descorche del Sommelier
              </span>
              <span className="text-[10px] text-[#E0B441] font-mono">
                Cava Pro
              </span>
            </div>

            {sommelierPick?.wine ? (
              <div className="mt-3 p-3 rounded-xl bg-[#6B1F2E]/20 border border-[#A83A50]/30 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {sommelierPick.wine.name}
                    </h4>
                    <span className="text-[10px] text-[#E0B441] font-semibold block mt-0.5">
                      {sommelierPick.wine.vintage ? `Añada ${sommelierPick.wine.vintage}` : ''} • {sommelierPick.wine.region || 'Cava'}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-[#1C1916] text-[#E0B441] text-[10px] font-mono-num font-bold">
                    {sommelierPick.wine.sommelierPoints || 94} Pts
                  </span>
                </div>

                <div className="text-[11px] text-[#B8AFA3] bg-[#12100E]/60 p-2 rounded-lg">
                  <span className="text-[#E0B441] font-bold">Maridaje sugerido: </span>
                  {sommelierPick.pairWith}
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-[#8B8378]">
                    📍 {sommelierPick.location}
                  </span>
                  <button
                    onClick={() => {
                      audio.click();
                      if (onOpenWineTasting) onOpenWineTasting(sommelierPick.wine);
                    }}
                    className="text-xs font-bold text-[#E0B441] hover:underline flex items-center gap-1"
                  >
                    <span>Ficha de Cata</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-3 p-3 text-center text-xs text-[#8B8378] bg-[#1C1916] rounded-xl">
                Agrega botellas a la cava para recibir sugerencias de maridaje.
              </div>
            )}
          </div>

          <div className="text-[10px] text-[#8B8378] pt-2 border-t border-[#2A2521]">
            Seleccionado automáticamente para la comida o cena de hoy.
          </div>
        </div>

      </div>
    </div>
  );
}
