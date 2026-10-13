import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "alacena-enterprise-prod",
  appId: "1:563016091019:web:0c5c9fee493e64de8edb8e",
  storageBucket: "alacena-enterprise-prod.firebasestorage.app",
  apiKey: "AIzaSyAP3PU-9GeICGzmWQSQ-JnRQuqwjiYcVKE",
  authDomain: "alacena-enterprise-prod.firebaseapp.com",
  messagingSenderId: "563016091019",
};

const app = initializeApp(firebaseConfig);

// Inicializar Firestore con caché persistente y soporte multi-pestaña moderno (sin deprecation warnings)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
export const auth = getAuth(app);
export const storage = getStorage(app);

export default app;
