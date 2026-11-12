// Elección de la vía de acceso con Google (3.12.1).
//
// En el iPhone (Safari o la app instalada en la pantalla de inicio) la
// ventana emergente de Firebase no se abre o queda colgada: la promesa
// no se resuelve y el usuario ve «no hace nada» hasta que el corte de
// 60 s pinta el error lejos del botón. Por eso la vía PRIMERA depende
// del entorno: en móvil/táctil o en modo instalado se entra por
// REDIRECCIÓN en esta pestaña (la página de login de Google, que es lo
// que el usuario espera al pulsar «Entrar con Google»); en escritorio
// se mantiene la ventana emergente primero.
//
// La detección es una función pura sobre un objeto de entorno
// inyectable para poder forzarla en los tests; `currentSignInEnv()`
// lee el entorno real del navegador.

export function isMobileSignInEnv(env = {}) {
  const ua = String(env.userAgent || '');
  if (/(iPhone|iPad|iPod|Android)/i.test(ua)) return true;
  if (env.standalone === true || env.navigatorStandalone === true) return true;
  if (env.pointerCoarse === true) return true;
  return false;
}

// 'redirect' | 'popup': la primera vía a intentar en este entorno.
export function preferredSignInFlow(env = {}) {
  return isMobileSignInEnv(env) ? 'redirect' : 'popup';
}

// Códigos con los que la ventana emergente no llegó a dar acceso y la
// redirección en esta pestaña es la salida automática: además de los
// ya cubiertos en 3.12.0 (bloqueada / no admitida), la cerrada por el
// usuario, la cancelada por un intento anterior y el corte por tiempo
// (la emergente colgada del iPhone). Ningún toque se queda sin salida.
export const REDIRECT_FALLBACK_CODES = [
  'auth/popup-blocked',
  'auth/operation-not-supported-in-this-environment',
  'auth/popup-closed-by-user',
  'auth/cancelled-popup-request',
  'auth/timeout',
];
export function shouldFallbackToRedirect(code) {
  return REDIRECT_FALLBACK_CODES.includes(code);
}

// Entorno real del navegador, con la misma forma que aceptan las
// funciones puras de arriba.
export function currentSignInEnv() {
  if (typeof window === 'undefined') return {};
  const coarse = typeof window.matchMedia === 'function'
    ? window.matchMedia('(pointer: coarse)').matches
    : false;
  const standalone = typeof window.matchMedia === 'function'
    ? window.matchMedia('(display-mode: standalone)').matches
    : false;
  return {
    userAgent: window.navigator?.userAgent || '',
    pointerCoarse: coarse,
    standalone,
    navigatorStandalone: window.navigator?.standalone === true,
  };
}
