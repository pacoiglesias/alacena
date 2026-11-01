import {beforeAll,afterAll,it,expect,vi} from 'vitest';
import {signInWithEmailAndPassword,signOut} from 'firebase/auth';
import {doc,setDoc,getDoc,writeBatch,serverTimestamp,terminate} from 'firebase/firestore';
import {deleteApp} from 'firebase/app';
import {db,auth} from '../src/services/firebase';
import app from '../src/services/firebase';
import {saveProductToCloud,restoreCloudSnapshot,fetchPurchaseHistoryPage,seedCloudIfEmpty} from '../src/services/firestoreSyncService';
vi.stubGlobal('window',{dispatchEvent:vi.fn()});
vi.stubGlobal('navigator',{onLine:true});
const stock={id:'check-increment',name:'Insumo de prueba concurrente',quantity:3,unit:'kg',householdId:'house-1'};
beforeAll(async()=>{
  expect(app.options.projectId).toBe('demo-alacena-review');
  await signInWithEmailAndPassword(auth,'revision@alacena.test','solo-emulador-2026');
});
afterAll(async()=>{await signOut(auth);await terminate(db);await deleteApp(app);});
it('concurrent devices add deltas instead of overwriting quantities',async()=>{
  await setDoc(doc(db,'products',stock.id),stock);
  await Promise.all([saveProductToCloud(stock,{delta:1.125}),saveProductToCloud(stock,{delta:2.375})]);
  expect((await getDoc(doc(db,'products',stock.id))).data().quantity).toBe(6.5);
});
it('restore aborts atomically when another device changed the preview',async()=>{
  const reference=doc(db,'products',stock.id);
  const before={...(await getDoc(reference)).data(),id:stock.id};
  await setDoc(reference,{...before,quantity:7});
  await expect(restoreCloudSnapshot({products:[{...before,quantity:20}]},{products:[before]})).rejects.toThrow(/otro dispositivo/);
  expect((await getDoc(reference)).data().quantity).toBe(7);
});
it('restore writes a valid preview and preserves existing audit records',async()=>{
  const before={...(await getDoc(doc(db,'products',stock.id))).data(),id:stock.id};
  const auditId=`check-audit-${Date.now()}`;
  await setDoc(doc(db,'audit_logs',auditId),{id:auditId,description:'Original de prueba',timestamp:'2026-11-01T00:00:00Z',cloudTimestamp:serverTimestamp()});
  await restoreCloudSnapshot({products:[{...before,quantity:8}],auditLogs:[{id:auditId,description:'No sobrescribir'}]},{products:[before]});
  expect((await getDoc(doc(db,'products',stock.id))).data().quantity).toBe(8);
  expect((await getDoc(doc(db,'audit_logs',auditId))).data().description).toBe('Original de prueba');
});
it('oversized restore and nonempty cloud import reject before overwriting',async()=>{
  await expect(restoreCloudSnapshot({products:Array.from({length:401},(_,i)=>({...stock,id:`oversize-${i}`}))},{})).rejects.toThrow(/400/);
  expect((await getDoc(doc(db,'products','oversize-0'))).exists()).toBe(false);
  await expect(seedCloudIfEmpty({products:[]})).rejects.toThrow(/ya contiene datos/);
});
it('history pages reach tickets older than 30 and expose returnable items',async()=>{
  const batch=writeBatch(db);
  batch.set(doc(db,'products','review-old-product'),{id:'review-old-product',name:'Producto de compra antigua',quantity:5,unit:'piezas',householdId:'house-1'});
  for(let i=0;i<40;i++)batch.set(doc(db,'purchase_history',`review-ticket-${i}`),{
    id:`review-ticket-${i}`,date:new Date(Date.UTC(2025,0,1+i)).toISOString(),totalMxn:25,householdId:'house-1',currency:'MXN',buyer:'Persona de prueba',notes:`Folio de prueba ${i}`,
    items:[{id:`old-item-${i}`,name:'Producto de compra antigua',quantity:1,unit:'piezas',estimatedPriceMxn:25,reversed:false}],
  });
  await batch.commit();
  const first=await fetchPurchaseHistoryPage();const second=await fetchPurchaseHistoryPage(first.cursor);
  expect(first.rows).toHaveLength(30);expect(first.hasMore).toBe(true);
  expect([...first.rows,...second.rows].some((r)=>r.id==='review-ticket-0')).toBe(true);
  expect(second.rows.find((r)=>r.id==='review-ticket-0').items[0].reversed).toBe(false);
});
