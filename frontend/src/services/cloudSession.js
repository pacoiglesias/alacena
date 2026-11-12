import { onAuthStateChanged, getIdTokenResult, GoogleAuthProvider, signInWithCredential, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, REVIEW_MODE, GOOGLE_WEB_CLIENT_ID } from './firebase';
import { loadGoogleIdentityScript, initGoogleIdentity, renderGoogleSignInButton } from '../utils/googleIdentity.js';
import { withAuthTimeout } from '../utils/authFeedback.js';
export const getUserAccess = (user) => getIdTokenResult(user);

// 3.13.0: el acceso con Google ya NO pasa por el handler de Firebase
// (signInWithPopup/signInWithRedirect devolvían auth/internal-error
// al completar, en el dominio propio y en el de Firebase, con el
// proveedor y el cliente OAuth sanos). Ahora el botón oficial de
// Google Identity Services entrega el id_token y la sesión se abre
// con signInWithCredential, probado en vivo contra este proyecto.
// Una vez existe la sesión, todo lo demás (claims households → la
// casa conecta sola) sigue igual que en 3.12.0.
export const signInWithGoogleIdToken = (idToken) =>
  withAuthTimeout(() => signInWithCredential(auth, GoogleAuthProvider.credential(idToken)));

const dispatchAuthError = (error) => window.dispatchEvent(new CustomEvent('alacena-auth-error', { detail: error?.code }));
let gisInitialized = false;

// Monta el botón oficial de Google en el elemento dado. La
// inicialización de GIS es global y se hace una sola vez; cada
// montaje pinta su propio botón. Los errores de carga se lanzan con
// su código para que el panel que monta enseñe el motivo dentro de
// sí mismo; los errores al canjear la credencial viajan por el bus
// 'alacena-auth-error', como hasta ahora.
export async function mountGoogleSignInButton(element) {
  const googleObj = await loadGoogleIdentityScript();
  if (!gisInitialized) {
    const ready = initGoogleIdentity({
      googleObj,
      clientId: GOOGLE_WEB_CLIENT_ID,
      onCredential: (idToken) => { signInWithGoogleIdToken(idToken).catch(dispatchAuthError); },
      onError: dispatchAuthError,
    });
    if (!ready) throw Object.assign(new Error('El cliente de acceso de Google no está disponible.'), { code: 'auth/gis-unavailable' });
    gisInitialized = true;
  }
  if (!renderGoogleSignInButton(googleObj, element)) {
    throw Object.assign(new Error('No se pudo pintar el botón de Google.'), { code: 'auth/gis-unavailable' });
  }
}

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
  // 3.13.0: sin flujo de redirección ya no hay resultado que recoger
  // al volver (getRedirectResult queda retirado); la suscripción a
  // la sesión es la única fuente, como en el resto de la app.
  return onAuthStateChanged(auth, callback);
}
