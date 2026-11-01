// Executes the original handlers in an isolated VM, with fake state and no network.
import { execFileSync } from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const read = (path) => execFileSync('git', ['show', `305a0df:frontend/src/${path}`], { encoding: 'utf8' });
const app = read('App.jsx');
const context = {
  products: [
    { id: 'mx', name: 'Arroz', quantity: 10, unit: 'kg', householdId: 'house-1' },
    { id: 'es', name: 'Arroz', quantity: 10, unit: 'kg', householdId: 'house-spain' },
    { id: 'cafe', name: 'Café', quantity: 10, unit: 'kg', householdId: 'house-1' },
  ], zones: [], activeHouse: { id: 'house-1' }, writes: [], Date, Math, Number, parseFloat,
  addAuditEntry() {}, setActiveTab() {}, recordPricePoints() {}, learnProduct() {}, syncPantryToIndexedDb() {},
  sameStockItem(a, b) { return a.name === b.name && a.householdId === b.householdId; },
  sanitizeAllInventory: (rows) => rows, deduplicateInventoryProducts: (rows) => rows,
  saveProductToCloud(...args) { context.writes.push(args); },
  setProducts(value) { context.products = typeof value === 'function' ? value(context.products) : value; },
};
vm.createContext(context);
const cooking = app.slice(app.indexOf('const handleCookRecipe ='), app.indexOf('const handleCreateRecipe ='));
vm.runInContext(`${cooking}; handleCookRecipe({ name:'Prueba', portions:2, ingredients:[{ productName:'Arroz', amount:1, unit:'kg' }, { productName:'cafe', amount:1, unit:'kg' }] }, 'Prueba');`, context);
assert.equal(context.products[0].quantity, 9); // Four portions should consume 2 kg, not 1.
assert.equal(context.products[1].quantity, 9); // Other house was incorrectly changed.
assert.equal(context.products[2].quantity, 10); // Accent-equivalent ingredient not consumed.
assert.equal(context.writes.length, 0);
const findings = { baseline: '305a0df', cooking: { scaledPortionsLost: true, changedOtherHouse: true, equivalentNameMissed: true, cloudWrites: 0 } };
const batch = app.slice(app.indexOf('const handleBatchAddToInventory ='), app.indexOf('// Direct scanner add'));
vm.runInContext(`${batch}; handleBatchAddToInventory([{ name:'Arroz', quantity:2, unit:'kg' }], 'Prueba');`, context);
assert.equal(context.writes[0][1], undefined);
findings.ticketBatch = { absoluteWriteWithoutDelta: true };
const sync = read('services/firestoreSyncService.js');
const history = sync.slice(sync.indexOf('export function subscribeToPurchaseHistory')).replace('export ', '');
let received;
const historyContext = { db: {}, collection: () => ({}), onSnapshot: (_, callback) => callback({ empty:false, metadata:{ fromCache:false }, docs:Array.from({length:35}, (_, i) => ({ id:String(i), data:() => ({ date:`2026-10-${String(i % 28 + 1).padStart(2,'0')}` }) })) }) };
historyContext.receive = (rows) => { received = rows; };
vm.runInNewContext(`${history}; subscribeToPurchaseHistory(receive);`, historyContext);
assert.equal(received.length, 30);
findings.history = { storedOnServer:35, deliveredToInterface:received.length };
findings.restore = { exportPresent:app.includes('handleExportBackupJson'), restoreHandlerPresent:/handleRestoreBackup|Restaurar respaldo/.test(app) };
const callback = app.match(/subscribeToProducts\(null, (\(rows, metadata\) => \{[^\n]+\}), fail\)/)[1];
let visible = [{ name:'Producto local' }];
vm.runInNewContext(`(${callback})([], { fromCache:false });`, { setProducts: (rows) => { visible = rows; } });
assert.equal(visible.length, 0);
findings.emptyCloud = { localRowsBefore:1, localRowsAfter:visible.length };
const demo = app.slice(app.indexOf('const handleResetDemoData ='), app.indexOf('\n  return (', app.indexOf('const handleResetDemoData =')));
findings.demo = { hasConnectedGuard:/cloudAllowed|auth.currentUser/.test(demo) };
assert.equal(findings.demo.hasConnectedGuard, false);
console.log(JSON.stringify(findings, null, 2));
