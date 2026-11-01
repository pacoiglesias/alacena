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
