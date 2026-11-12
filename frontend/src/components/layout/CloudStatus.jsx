import { useEffect, useRef, useState } from 'react';
import { Cloud, CloudOff, LogIn, LogOut, LoaderCircle } from 'lucide-react';
import { connectGoogle, disconnectGoogle, getCloudUser, connectReviewUser } from '../../services/cloudGateway';
import { authErrorMessage, withAuthTimeout } from '../../utils/authFeedback';
import { readLocalState, writeLocalState } from '../../services/localState';

export default function CloudStatus({ state, isOnline, hasLocalData = false, onDownloadBackup }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
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
    if (user) { attempt.current++; setBusy(false); setError(''); }
  }, [user?.uid]);
  useEffect(() => {
    const failed = (event) => setError(authErrorMessage(event.detail));
    window.addEventListener('alacena-auth-error', failed);
    return () => { attempt.current++; window.removeEventListener('alacena-auth-error', failed); };
  }, []);
  const connect = async (redirect = false) => {
    const id = ++attempt.current;
    setBusy(true); setError('');
    try { await withAuthTimeout(() => user ? disconnectGoogle() : connectGoogle(redirect)); }
    catch (err) {
      if (id !== attempt.current) return;
      // 3.12.0: si la ventana emergente no puede abrirse (bloqueada o
      // no admitida en este navegador), el acceso continúa solo por
      // redirección en esta pestaña: ningún botón se queda «sin abrir
      // nada» ni ningún aviso sin salida.
      if (!user && !redirect && ['auth/popup-blocked', 'auth/operation-not-supported-in-this-environment'].includes(err.code)) {
        try { await connectGoogle(true); return; }
        catch (err2) { if (id === attempt.current) setError(authErrorMessage(err2.code)); return; }
      }
      setError(authErrorMessage(err.code));
    }
    finally { if (id === attempt.current) setBusy(false); }
  };
  // La puerta de conexión (ConnectHouseGate) pide el acceso con este
  // evento para reutilizar este mismo flujo, con su estado y errores.
  const connectRef = useRef(null);
  connectRef.current = connect;
  useEffect(() => {
    const requested = () => { if (!getCloudUser()) connectRef.current?.(); };
    window.addEventListener('alacena-request-connect', requested);
    return () => window.removeEventListener('alacena-request-connect', requested);
  }, []);
  return <aside className="cloud-status" aria-label="Estado de guardado">
    <div className="min-w-0 space-y-1">
      <div role="status" className="flex items-center gap-2 flex-wrap">
        {isOnline && state === 'synced' ? <Cloud size={17} /> : <CloudOff size={17} />}
        <span>{busy ? 'Abriendo Google… completa el acceso en la ventana de Google.' : error || (!isOnline ? 'Sin conexión · cambios guardados en este dispositivo' : messages[state])}</span>
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
