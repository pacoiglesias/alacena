import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator, memoryLocalCache } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  projectId: "alacena-enterprise-prod",
  appId: "1:563016091019:web:0c5c9fee493e64de8edb8e",
  storageBucket: "alacena-enterprise-prod.firebasestorage.app",
  apiKey: "AIzaSyAP3PU-9GeICGzmWQSQ-JnRQuqwjiYcVKE",
  authDomain: "alacena-enterprise-prod.firebaseapp.com",
  messagingSenderId: "563016091019",
};

export const REVIEW_MODE = import.meta.env.VITE_REVIEW_MODE === 'true';
const app = initializeApp(REVIEW_MODE ? { ...firebaseConfig, projectId:'demo-alacena-review', apiKey:'review-only', authDomain:'localhost', storageBucket:'demo-alacena-review.appspot.com' } : firebaseConfig);

// Inicializar Firestore con caché persistente y soporte multi-pestaña moderno (sin deprecation warnings)
export const db = initializeFirestore(app, {
  ignoreUndefinedProperties: true,
  localCache: typeof indexedDB === 'undefined' ? memoryLocalCache() : persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const auth = getAuth(app);
export const storage = getStorage(app);
if (REVIEW_MODE) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9199', { disableWarnings:true });
  connectFirestoreEmulator(db, '127.0.0.1', 8189);
  connectStorageEmulator(storage, '127.0.0.1', 9198);
}

export default app;
