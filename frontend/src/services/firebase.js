import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
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
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Habilitar persistencia offline en el navegador para velocidad instantánea
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistencia de Firestore en múltiples pestañas');
    } else if (err.code === 'unimplemented') {
      console.warn('El navegador no soporta persistencia IndexedDB');
    }
  });
} catch (e) {
  // Ignorar si ya está inicializado
}

export default app;
