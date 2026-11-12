import { onAuthStateChanged, getIdTokenResult, getRedirectResult, signInWithPopup, signInWithRedirect, GoogleAuthProvider, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { auth, REVIEW_MODE } from './firebase';
export const getUserAccess = (user) => getIdTokenResult(user);

// 3.12.0: marca del intento de acceso por redirección. Antes de saltar
// al handler de Google dejamos constancia en sessionStorage; al
// volver, si getRedirectResult no trae usuario ni error, sabemos que
// la redirección se perdió por el camino (almacenamiento particionado
// del navegador) y avisamos con un código propio para que la interfaz
// ofrezca la ventana emergente con un motivo claro, en vez del aviso
// muerto «No se pudo completar el acceso» sin salida.
export const REDIRECT_ATTEMPT_KEY = 'alacena_redirect_attempt';
const REDIRECT_ATTEMPT_TTL_MS = 10 * 60 * 1000;
function markRedirectAttempt() {
  try { sessionStorage.setItem(REDIRECT_ATTEMPT_KEY, String(Date.now())); } catch { /* sin sessionStorage el flujo sigue igual */ }
}
function consumeRedirectAttempt() {
  try {
    const marked = Number(sessionStorage.getItem(REDIRECT_ATTEMPT_KEY) || 0);
    sessionStorage.removeItem(REDIRECT_ATTEMPT_KEY);
    return marked > 0 && Date.now() - marked <= REDIRECT_ATTEMPT_TTL_MS;
  } catch { return false; }
}

export const connectGoogle = (redirect = false) => {
  if (!redirect) return signInWithPopup(auth, new GoogleAuthProvider());
  markRedirectAttempt();
  return signInWithRedirect(auth, new GoogleAuthProvider());
};
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
  getRedirectResult(auth)
    .then((result) => {
      const attempted = consumeRedirectAttempt();
      if (attempted && !result?.user) window.dispatchEvent(new CustomEvent('alacena-auth-error', { detail: 'auth/redirect-returned-empty' }));
    })
    .catch((error) => { consumeRedirectAttempt(); window.dispatchEvent(new CustomEvent('alacena-auth-error', { detail: error.code })); });
  return onAuthStateChanged(auth, callback);
}
