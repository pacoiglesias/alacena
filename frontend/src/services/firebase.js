import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator, memoryLocalCache } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { resolveAuthDomain } from '../utils/authDomain.js';

// 3.12.0: el authDomain se deriva del dominio que sirve la app
// (alacena.cobertores.com → su propio handler /__/auth/handler), para
// que el acceso con redirección de Google sea de mismo sitio y no se
// rompa con el almacenamiento particionado de los navegadores.
const firebaseConfig = {
  projectId: "alacena-enterprise-prod",
  appId: "1:563016091019:web:0c5c9fee493e64de8edb8e",
  storageBucket: "alacena-enterprise-prod.firebasestorage.app",
  apiKey: "AIzaSyAP3PU-9GeICGzmWQSQ-JnRQuqwjiYcVKE",
  authDomain: resolveAuthDomain(typeof window !== 'undefined' ? window.location.hostname : ''),
  messagingSenderId: "563016091019",
};

// 3.13.0: ID del cliente web OAuth del proyecto («Web client (auto
// created by Google Service)»). Es un identificador público — va en
// cada URL de autorización de Google — y lo usa Google Identity
// Services para entregar el id_token que luego canjea Firebase.
export const GOOGLE_WEB_CLIENT_ID = '563016091019-2mv9qfe5nugggt64u383cunlc27tf4nr.apps.googleusercontent.com';

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
