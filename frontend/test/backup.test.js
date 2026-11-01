import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackup,validateBackup,planRestore,preserveSafetyBackup,persistSnapshot,mergeHistory} from '../src/utils/backup.js';
const current={products:[{id:'p',name:'Arroz',quantity:2,unit:'kg',householdId:'house-1'}],shoppingList:[],zones:[{id:'z',name:'Alacena'}],recipes:[],households:[{id:'house-1',name:'Casa'}],activeHouse:{id:'house-1',name:'Casa'},auditLogs:[{id:'a',description:'Real',timestamp:'2026-10-01T00:00:00Z'}],purchaseHistory:[{id:'h',date:'2026-10-01T00:00:00Z',items:[],totalMxn:10}]};
test('backup roundtrip and older supported versions validate',() => {
  assert.equal(validateBackup(JSON.stringify(createBackup(current))).products[0].quantity,2);
  assert.equal(validateBackup(JSON.stringify({...createBackup(current),version:'3.8.0'})).products.length,1);
});
test('invalid files, schema, future version, quantities, duplicate IDs and poisoned keys are rejected before mutation',() => {
  for(const data of ['bad','{}',JSON.stringify({...createBackup(current),version:'4.0.0'}),JSON.stringify({...createBackup(current),schemaVersion:2}),JSON.stringify({...createBackup(current),products:[{...current.products[0],quantity:-1}]}),JSON.stringify({...createBackup(current),products:[...current.products,...current.products]}),'{"__proto__":{"admin":true}}']) assert.throws(() => validateBackup(data));
  assert.equal(current.products[0].quantity,2);
});
test('combine never doubles stock and replace preserves immutable history and logs',() => {
  const incoming={...current,products:[{...current.products[0],quantity:9}],auditLogs:[],purchaseHistory:[]};
  assert.equal(planRestore(current,incoming,'combine').next.products[0].quantity,2);
  const replaced=planRestore(current,incoming,'replace');
  assert.equal(replaced.next.products[0].quantity,9);assert.equal(replaced.next.auditLogs.length,1);assert.equal(replaced.next.purchaseHistory.length,1);assert.equal(current.products[0].quantity,2);
});
test('a failed safety backup prevents restore; failed writes attempt rollback',() => {
  assert.throws(() => preserveSafetyBackup(current,{setItem(){throw new Error('full');}}));
  const store=new Map([['alacena_products','original']]);let first=true;
  const storage={getItem:(k)=>store.get(k)??null,setItem(k,v){if(k==='alacena_zones'&&first){first=false;throw Error('full');}store.set(k,v);},removeItem(k){store.delete(k);}};
  assert.throws(()=>persistSnapshot(current,storage));assert.equal(store.get('alacena_products'),'original');
});
test('history merge keeps more than 30 tickets and refreshed return flags',() => {
  const old=Array.from({length:65},(_,i)=>({id:String(i),date:'2026-10-01',items:[]}));
  const merged=mergeHistory(old,[{...old[0],items:[{reversed:true}]}]);
  assert.equal(merged.length,65);assert.equal(merged.find((r)=>r.id==='0').items[0].reversed,true);
});
