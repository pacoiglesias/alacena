import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, serverTimestamp, terminate, writeBatch, increment } from 'firebase/firestore';
const clients = [];
function client(name, claims) {
  const app = initializeApp({ projectId: 'demo-alacena-audit' }, name);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8089, claims ? { mockUserToken: { sub: name, ...claims } } : undefined);
  clients.push([app, db]);
  return db;
}
try {
  const anonymous = client('anonymous');
  const stranger = client('stranger', { email_verified: true });
  const owner = client('owner', { email_verified: true, alacenaAccess: true });
  const unverified = client('unverified', { email_verified: false, alacenaAccess: true });
  const payload = { name: 'Leche prueba', quantity: 2, unit: 'piezas', householdId: 'house-1', checked: false };
  const denied = (promise) => assert.rejects(promise, (e) => e.code === 'permission-denied');
  await denied(getDoc(doc(anonymous, 'shopping_list/test')));
  await denied(setDoc(doc(anonymous, 'shopping_list/test'), payload));
  await denied(setDoc(doc(stranger, 'shopping_list/test'), payload));
  await denied(setDoc(doc(unverified, 'shopping_list/test'), payload));
  await setDoc(doc(owner, 'shopping_list/test'), payload);
  assert.equal((await getDoc(doc(owner, 'shopping_list/test'))).data().quantity, 2);
  await denied(updateDoc(doc(owner, 'shopping_list/test'), { quantity: -1 }));
  await denied(updateDoc(doc(owner, 'shopping_list/test'), { quantity: 'bad' }));
  await setDoc(doc(owner, 'audit_logs/test'), { description: 'Prueba', cloudTimestamp: serverTimestamp() });
  await denied(updateDoc(doc(owner, 'audit_logs/test'), { description: 'Alterado' }));
  await denied(deleteDoc(doc(owner, 'audit_logs/test')));
  const receipt = { items: [], totalMxn: 95, date: '2026-10-16', householdId: 'house-1' };
  await setDoc(doc(owner, 'purchase_history/receipt-test'), receipt);
  await setDoc(doc(owner, 'products/receipt-test'), payload);
  const duplicate = writeBatch(owner);
  duplicate.update(doc(owner, 'products/receipt-test'), { quantity: increment(2) });
  duplicate.set(doc(owner, 'purchase_history/receipt-test'), { ...receipt, date: '2026-10-17' });
  await denied(duplicate.commit());
  assert.equal((await getDoc(doc(owner, 'products/receipt-test'))).data().quantity, 2);
  await updateDoc(doc(owner, 'purchase_history/receipt-test'), { items: [{ reversed: true }] });
  console.log('Firestore: 13 access, validation, immutable-audit and atomic duplicate-receipt checks passed. Demo emulator only.');
} finally {
  for (const [app, db] of clients) { await terminate(db); await deleteApp(app); }
}
