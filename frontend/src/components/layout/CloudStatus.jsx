import { useEffect, useRef, useState } from 'react';
import { Cloud, CloudOff, LogIn, LogOut, LoaderCircle } from 'lucide-react';
import { connectGoogle, disconnectGoogle, getCloudUser, connectReviewUser } from '../../services/cloudGateway';
import { authErrorMessage, withAuthTimeout } from '../../utils/authFeedback';
import { currentSignInEnv, preferredSignInFlow, shouldFallbackToRedirect } from '../../utils/authFlow';
import { readLocalState, writeLocalState } from '../../services/localState';

export default function CloudStatus({ state, isOnline, hasLocalData = false, onDownloadBackup }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [viaRedirect, setViaRedirect] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeHidden, setNoticeHidden] = useState(() => readLocalState('alacena_local_notice_hidden', false));
  const attempt = useRef(0);
  const user = getCloudUser();
  const messages = {
    local: 'Guardado sólo en este dispositivo', connecting: 'Conectando con tu casa…',
    unauthorized: 'Esta cuenta aún no tiene acceso a la casa. Tus cambios siguen en este dispositivo.',
    synced: 'Lista conectada · cambios confirmados en la nube', pending: 'Guardando cambios en la nube…',
    cached: 'Mostrando copia guardada · esperando confirmación de la nube',
    migration: 'La nube está vacía · conservamos los datos de este dispositivo',
    error: 'No se pudo sincronizar · revisa la conexión y tu cuenta',
  };
  useEffect(() => {
    if (user) { attempt.current++; setBusy(false); setError(''); setNotice(''); }
  }, [user?.uid]);
  useEffect(() => {
    const failed = (event) => setError(authErrorMessage(event.detail));
    window.addEventListener('alacena-auth-error', failed);
    return () => { attempt.current++; window.removeEventListener('alacena-auth-error', failed); };
  }, []);
  // Fallo terminal de un intento iniciado aquí: se pinta en este
  // bloque Y se anuncia con el evento que ya escucha la puerta
  // (ConnectHouseGate), para que el error se vea también en el mismo
  // sitio donde el usuario pulsó, no solo aquí lejos del toque.
  const failWith = (code) => {
    setError(authErrorMessage(code));
    window.dispatchEvent(new CustomEvent('alacena-auth-error', { detail: code }));
  };
  // 3.12.1: la vía primera depende del dispositivo (utils/authFlow):
  // en móvil/táctil o app instalada se entra por redirección en esta
  // pestaña — la ventana emergente de Firebase en el iPhone no se
  // abre o queda colgada y el toque parecía «no hacer nada» —; en
  // escritorio sigue la ventana emergente primero.
  const connect = async (redirect = preferredSignInFlow(currentSignInEnv()) === 'redirect') => {
    const id = ++attempt.current;
    setBusy(true); setError(''); setNotice(''); setViaRedirect(redirect);
    try { await withAuthTimeout(() => user ? disconnectGoogle() : connectGoogle(redirect)); }
    catch (err) {
      if (id !== attempt.current) return;
      // Respaldo automático: si la ventana emergente no dio acceso —
      // bloqueada, no admitida, cerrada, cancelada por otro intento o
      // colgada hasta el corte de tiempo (3.12.0 + 3.12.1) — el acceso
      // continúa solo por redirección en esta pestaña, avisando antes:
      // ningún botón se queda «sin abrir nada» ni ningún aviso sin salida.
      if (!user && !redirect && shouldFallbackToRedirect(err.code)) {
        setNotice('Te llevo a la página de Google…');
        try { await connectGoogle(true); return; }
        catch (err2) { if (id === attempt.current) failWith(err2.code); return; }
      }
      failWith(err.code);
    }
    finally { if (id === attempt.current) setBusy(false); }
  };
  // La puerta de conexión (ConnectHouseGate) pide el acceso con estos
  // eventos para reutilizar este mismo flujo, con su estado y errores:
  // el general sigue la vía del dispositivo; el «popup» fuerza la
  // ventana emergente como plan B cuando la redirección volvió vacía.
  const connectRef = useRef(null);
  connectRef.current = connect;
  useEffect(() => {
    const requested = () => { if (!getCloudUser()) connectRef.current?.(); };
    const requestedPopup = () => { if (!getCloudUser()) connectRef.current?.(false); };
    window.addEventListener('alacena-request-connect', requested);
    window.addEventListener('alacena-request-connect-popup', requestedPopup);
    return () => {
      window.removeEventListener('alacena-request-connect', requested);
      window.removeEventListener('alacena-request-connect-popup', requestedPopup);
    };
  }, []);
  return <aside className="cloud-status" aria-label="Estado de guardado">
    <div className="min-w-0 space-y-1">
      <div role="status" className="flex items-center gap-2 flex-wrap">
        {isOnline && state === 'synced' ? <Cloud size={17} /> : <CloudOff size={17} />}
        <span>{busy ? (viaRedirect ? 'Te llevo a la página de Google…' : 'Abriendo Google… completa el acceso en la ventana de Google.') : error || notice || (!isOnline ? 'Sin conexión · cambios guardados en este dispositivo' : messages[state])}</span>
        {user?.email && <span className="text-xs opacity-80">{user.email}</span>}
      </div>
      {hasLocalData && !user && !noticeHidden && <p className="text-xs">Si borras los datos del navegador puedes perder esta copia. Conecta tu casa o descarga un respaldo. <button onClick={() => { setNoticeHidden(true); writeLocalState('alacena_local_notice_hidden', true); }}>Entendido</button></p>}
    </div>
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {hasLocalData && !user && <button type="button" onClick={onDownloadBackup}>Descargar respaldo (JSON)</button>}
      <button type="button" onClick={() => connect()} disabled={busy || !isOnline}>
        {busy ? <LoaderCircle size={15} className="animate-spin" /> : user ? <LogOut size={15} /> : <LogIn size={15} />}
        {busy ? 'Conectando…' : user ? 'Cerrar sesión' : error ? 'Reintentar conexión' : 'Conectar mi casa'}
      </button>
      {!user && error && <button type="button" onClick={() => connect(true)} disabled={busy || !isOnline}>Acceder en esta pestaña</button>}
      {import.meta.env.VITE_REVIEW_MODE === 'true' && !user && <button onClick={async () => {attempt.current++;setBusy(true);try{await connectReviewUser();}catch(err){setError(authErrorMessage(err.code));}finally{setBusy(false);}}}>Entrar con cuenta ficticia</button>}
    </div>
  </aside>;
}
