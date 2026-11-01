import { belongsToHouse } from './householdShopping.js';
import { areItemsEquivalent, normalizeItemName } from './deduplication.js';
const rounded = (n) => Math.round(n * 1000) / 1000;
const units = { g:['mass',0.001], gr:['mass',0.001], gramos:['mass',0.001], kg:['mass',1], kilos:['mass',1], ml:['volume',0.001], l:['volume',1], lt:['volume',1], litros:['volume',1], pieza:['count',1], piezas:['count',1], pz:['count',1], unidad:['count',1], unidades:['count',1], botellas:['bottle',1] };
export function amountInUnit(amount, from, to) {
  const a = units[normalizeItemName(from || 'piezas')], b = units[normalizeItemName(to || 'piezas')];
  if (normalizeItemName(from || 'piezas') === normalizeItemName(to || 'piezas')) return amount;
  return a && b && a[0] === b[0] ? amount * a[1] / b[1] : null;
}
// The card, confirmation and inventory consumption all use this same allocation.
export function planRecipe(products, recipe, householdId, portions = recipe.portions || 1) {
  const base = Number(recipe.portions || 1), count = Number(portions);
  if (!Number.isFinite(base) || base <= 0 || !Number.isFinite(count) || count <= 0 || !recipe.ingredients?.length) throw new Error('Revisa las porciones e ingredientes de la receta.');
  const remaining = new Map(products.map((p) => [p.id, Number(p.quantity) || 0]));
  const used = new Map(), missingIngredients = [];
  const evaluatedIngredients = recipe.ingredients.map((ing) => {
    const requiredAmount = rounded(Number(ing.amount) * count / base);
    if (!Number.isFinite(requiredAmount) || requiredAmount <= 0) throw new Error(`Revisa la cantidad de ${ing.productName}.`);
    const candidates = products.filter((p) => belongsToHouse(p, householdId) && areItemsEquivalent(p.name, ing.productName) && amountInUnit(1, p.unit, ing.unit) !== null);
    const availableQty = rounded(candidates.reduce((s, p) => s + amountInUnit(remaining.get(p.id), p.unit, ing.unit), 0));
    let needed = requiredAmount;
    for (const p of candidates) {
      const inStockUnits = amountInUnit(needed, ing.unit, p.unit);
      const take = Math.min(remaining.get(p.id), inStockUnits);
      if (take <= 0) continue;
      remaining.set(p.id, rounded(remaining.get(p.id) - take));
      used.set(p.id, rounded((used.get(p.id) || 0) + take));
      needed = Math.max(0, needed - amountInUnit(take, p.unit, ing.unit));
      if (needed < 0.0005) break;
    }
    const isEnough = availableQty + 0.0005 >= requiredAmount;
    if (!isEnough) missingIngredients.push({ name:ing.productName, required:requiredAmount, available:availableQty, deficit:rounded(requiredAmount - availableQty), unit:ing.unit, store:candidates[0]?.store || 'Supermercado', unitPriceMxn:candidates[0]?.unitPriceMxn || 0 });
    return { ...ing, requiredAmount, availableQty, isEnough, foundProduct:candidates[0] };
  });
  const writes = [...used].map(([id, amount]) => ({ product:{ ...products.find((p) => p.id === id), quantity:remaining.get(id) }, delta:-amount }));
  const totalCostMxn = writes.reduce((s, w) => s - w.delta * (Number(w.product.unitPriceMxn) || 0), 0);
  return { canCook:missingIngredients.length === 0, currentPortions:count, evaluatedIngredients, missingIngredients, writes,
    matchPct:Math.round(evaluatedIngredients.filter((i) => i.isEnough).length / evaluatedIngredients.length * 100), totalCostMxn, costPerPortionMxn:totalCostMxn/count };
}
