// 3.13.0: acceso con Google Identity Services (GIS). El flujo
// anterior (signInWithPopup/signInWithRedirect contra el handler
// /__/auth/handler de Firebase) falla al 100 % al completar en este
// proyecto (auth/internal-error en ambos dominios, verificado en
// producción), mientras que signInWithCredential con el id_token de
// GIS entra a la primera. Aquí vive solo la mecánica de GIS, sin
// Firebase: cargar el script oficial una sola vez, inicializar el
// cliente con el ID web del proyecto y pintar el botón oficial de
// Google (renderButton; One Tap/prompt() puede ser suprimido por el
// navegador y no sirve como único camino).
export const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
export const GIS_LOAD_ERROR_CODE = 'auth/gis-load-failed';
export const GIS_NO_CREDENTIAL_CODE = 'auth/gis-no-credential';
export const GIS_UNAVAILABLE_CODE = 'auth/gis-unavailable';
export const GIS_BUTTON_OPTIONS = {
  theme: 'outline',
  size: 'large',
  text: 'signin_with',
  shape: 'rectangular',
  logo_alignment: 'left',
  locale: 'es',
};

const gisError = (code, message) => Object.assign(new Error(message), { code });

let scriptPromise = null;
// Solo para tests y reintentos controlados: olvida la promesa de
// carga (tras un fallo la propia carga ya se resetea sola).
export function resetGoogleIdentityScriptCache() { scriptPromise = null; }

export function loadGoogleIdentityScript(env = {}) {
  const win = env.window ?? (typeof window !== 'undefined' ? window : undefined);
  const doc = env.document ?? (typeof document !== 'undefined' ? document : undefined);
  if (win?.google?.accounts?.id) return Promise.resolve(win.google);
  if (!win || !doc) return Promise.reject(gisError(GIS_LOAD_ERROR_CODE, 'No hay ventana ni documento donde cargar el acceso de Google.'));
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    const script = doc.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (win.google?.accounts?.id) resolve(win.google);
      else reject(gisError(GIS_LOAD_ERROR_CODE, 'El script de Google cargó pero no dejó su cliente de acceso.'));
    };
    script.onerror = () => reject(gisError(GIS_LOAD_ERROR_CODE, 'No se pudo cargar el script de acceso de Google.'));
    (doc.head || doc.body).appendChild(script);
  }).catch((error) => { scriptPromise = null; throw error; });
  return scriptPromise;
}

// Inicializa google.accounts.id: la credencial (id_token JWT) llega
// por onCredential y cualquier ausencia de credencial o de cliente
// sale por onError con código propio, nunca en silencio.
export function initGoogleIdentity({ googleObj, clientId, onCredential, onError }) {
  const id = googleObj?.accounts?.id;
  if (!id?.initialize) {
    onError?.(gisError(GIS_UNAVAILABLE_CODE, 'El cliente de acceso de Google no está disponible.'));
    return false;
  }
  id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response?.credential) onCredential(response.credential);
      else onError?.(gisError(GIS_NO_CREDENTIAL_CODE, 'Google no devolvió la credencial de acceso.'));
    },
  });
  return true;
}

export function renderGoogleSignInButton(googleObj, element, options = {}) {
  const id = googleObj?.accounts?.id;
  if (!id?.renderButton || !element) return false;
  id.renderButton(element, { ...GIS_BUTTON_OPTIONS, ...options });
  return true;
}
