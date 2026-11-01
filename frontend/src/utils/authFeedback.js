export function authErrorMessage(code) {
  const messages = {
    'auth/popup-closed-by-user':'Cerraste la ventana de Google. Puedes volver a intentarlo.',
    'auth/cancelled-popup-request':'Se canceló el intento anterior. Puedes volver a conectar tu casa.',
    'auth/popup-blocked':'El navegador bloqueó la ventana de Google. Permite ventanas emergentes o usa el acceso en esta pestaña.',
    'auth/network-request-failed':'No pudimos contactar con Google. Revisa internet y vuelve a intentarlo.',
    'auth/timeout':'Google no respondió en 60 segundos. Puedes reintentar o abrir el acceso en esta pestaña.',
    'auth/unauthorized-domain':'Este dominio no está autorizado para el acceso. Tus datos siguen en este dispositivo.',
  };
  return messages[code] || 'No se pudo completar el acceso. Reintenta; tus datos siguen guardados en este dispositivo.';
}
export function withAuthTimeout(action, ms = 60000) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('timeout'), {code:'auth/timeout'})), ms); });
  return Promise.race([Promise.resolve().then(action), timeout]).finally(() => clearTimeout(timer));
}
