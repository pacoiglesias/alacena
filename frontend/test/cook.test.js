import test from 'node:test';
import assert from 'node:assert/strict';
import { planRecipe } from '../src/utils/cookRecipe.js';
const products = [{id:'mx', name:'Café', quantity:1, unit:'kg', householdId:'house-1'}, {id:'es',name:'Café',quantity:10,unit:'kg',householdId:'es'}];
test('scaled portions, equivalent names and compatible units consume only the active house', () => {
  const p = planRecipe(products, { portions:2, ingredients:[{productName:'cafe',amount:125,unit:'g'}] }, 'house-1', 4);
  assert.equal(p.canCook,true); assert.equal(p.writes.length,1); assert.equal(p.writes[0].product.quantity,0.75); assert.equal(p.writes[0].delta,-0.25); assert.equal(products[1].quantity,10);
});
test('repeated ingredients share available stock; incompatible units and deficits block cooking', () => {
  const recipe = { portions:1, ingredients:[{productName:'cafe',amount:.7,unit:'kg'},{productName:'cafe',amount:.7,unit:'kg'}] };
  assert.equal(planRecipe(products,recipe,'house-1').canCook,false);
  assert.equal(planRecipe(products,{...recipe,ingredients:[{productName:'cafe',amount:1,unit:'piezas'}]},'house-1').canCook,false);
  assert.throws(() => planRecipe(products,recipe,'house-1',-1));
});

test('missing ingredients list names, required and available amounts for the confirmation', () => {
  const p = planRecipe(products, { portions: 2, ingredients: [{ productName: 'cafe', amount: 125, unit: 'g' }, { productName: 'azucar', amount: 100, unit: 'g' }] }, 'house-1', 4);
  assert.equal(p.canCook, false);
  assert.equal(p.missingIngredients.length, 1);
  assert.equal(p.missingIngredients[0].name, 'azucar');
  assert.equal(p.missingIngredients[0].required, 200);
  assert.equal(p.missingIngredients[0].available, 0);
  assert.equal(p.missingIngredients[0].unit, 'g');
  assert.equal(p.evaluatedIngredients[0].isEnough, true);
  assert.equal(p.evaluatedIngredients[0].requiredAmount, 250);
});

test('kitchen volume units (cucharada, cucharadita, taza) match stock in litres or ml', () => {
  const oil = [{ id: 'a', name: 'Aceite', quantity: 1, unit: 'litros', householdId: 'house-1' }];
  const p = planRecipe(oil, { portions: 1, ingredients: [{ productName: 'aceite', amount: 2, unit: 'cucharadas' }] }, 'house-1');
  assert.equal(p.canCook, true);
  assert.equal(p.writes[0].delta, -0.03);
  assert.equal(p.writes[0].product.quantity, 0.97);

  const salt = [{ id: 's', name: 'Sal', quantity: 3, unit: 'cucharaditas', householdId: 'house-1' }];
  const q = planRecipe(salt, { portions: 1, ingredients: [{ productName: 'sal', amount: 1, unit: 'cucharada' }] }, 'house-1');
  assert.equal(q.canCook, true);
  assert.equal(q.writes[0].product.quantity, 0);

  const milk = [{ id: 'l', name: 'Leche', quantity: 500, unit: 'ml', householdId: 'house-1' }];
  const r = planRecipe(milk, { portions: 1, ingredients: [{ productName: 'leche', amount: 3, unit: 'tazas' }] }, 'house-1');
  assert.equal(r.canCook, false);
  assert.equal(r.missingIngredients[0].deficit, 0.917);
});
