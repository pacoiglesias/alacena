import { onAuthStateChanged, getIdTokenResult, getRedirectResult, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, REVIEW_MODE } from './firebase';
export const getUserAccess = (user) => getIdTokenResult(user);
export const connectGoogle = (redirect = false) => redirect ? signInWithRedirect(auth, new GoogleAuthProvider()) : signInWithPopup(auth, new GoogleAuthProvider());
export const disconnectGoogle = () => signOut(auth);
export function connectReviewUser() {
  if (!REVIEW_MODE || auth.app.options.projectId !== 'demo-alacena-review') throw new Error('Cuenta de prueba no disponible en producción.');
  // AL-6: la contraseña de la cuenta ficticia ya NO vive en el repo (antes
  // estaba literal aquí, en un repo público). Se lee de frontend/.env.local
  // (VITE_REVIEW_TEST_PASSWORD, nunca commiteada: .env* está en .gitignore)
  // y es la misma que crea el seed del emulador
  // (frontend/review/seed-owner.mjs). Sin ella, la revisión no entra.
  const password = import.meta.env.VITE_REVIEW_TEST_PASSWORD;
  if (!password) throw Object.assign(new Error('Falta VITE_REVIEW_TEST_PASSWORD en frontend/.env.local (solo emulador).'), { code: 'auth/missing-review-password' });
  return signInWithEmailAndPassword(auth, 'revision@alacena.test', password);
}
export function observeUser(callback) {
  getRedirectResult(auth).catch((error) => window.dispatchEvent(new CustomEvent('alacena-auth-error', { detail:error.code })));
  return onAuthStateChanged(auth, callback);
}
