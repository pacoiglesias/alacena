export function authErrorMessage(code) {
  const messages = {
    'auth/gis-load-failed':'No se pudo cargar el botón de Google. Revisa tu conexión o si algún bloqueador lo impide, y reinténtalo; tus datos siguen guardados en este dispositivo.',
    'auth/gis-no-credential':'Google no devolvió la credencial de acceso. Vuelve a pulsar el botón de Google e inténtalo de nuevo.',
    'auth/gis-unavailable':'El acceso de Google no está disponible en este navegador ahora mismo. Reinténtalo o pruébalo en otro navegador.',
    'auth/network-request-failed':'No pudimos contactar con Google. Revisa internet y vuelve a intentarlo.',
    'auth/timeout':'Google no respondió en 60 segundos. Puedes volver a intentarlo.',
    'auth/unauthorized-domain':'Este dominio no está autorizado para el acceso. Tus datos siguen en este dispositivo.',
    'auth/web-storage-unsupported':'Tu navegador bloquea el almacenamiento que el acceso de Google necesita. Permite las cookies de este sitio o inténtalo en otro navegador.',
    'auth/internal-error':'Google devolvió un error interno al completar el acceso. Vuelve a intentarlo; tus datos siguen guardados en este dispositivo.',
  };
  return messages[code] || 'No se pudo completar el acceso. Reintenta; tus datos siguen guardados en este dispositivo.';
}
export function withAuthTimeout(action, ms = 60000) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error('timeout'), {code:'auth/timeout'})), ms); });
  return Promise.race([Promise.resolve().then(action), timeout]).finally(() => clearTimeout(timer));
}
