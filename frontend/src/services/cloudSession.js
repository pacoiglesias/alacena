import { onAuthStateChanged, getIdTokenResult, getRedirectResult, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, REVIEW_MODE } from './firebase';
export const getUserAccess = (user) => getIdTokenResult(user);
export const connectGoogle = (redirect = false) => redirect ? signInWithRedirect(auth, new GoogleAuthProvider()) : signInWithPopup(auth, new GoogleAuthProvider());
export const disconnectGoogle = () => signOut(auth);
export function connectReviewUser() {
  if (!REVIEW_MODE || auth.app.options.projectId !== 'demo-alacena-review') throw new Error('Cuenta de prueba no disponible en producción.');
  return signInWithEmailAndPassword(auth,'revision@alacena.test','solo-emulador-2026');
}
export function observeUser(callback) {
  getRedirectResult(auth).catch((error) => window.dispatchEvent(new CustomEvent('alacena-auth-error', { detail:error.code })));
  return onAuthStateChanged(auth, callback);
}
