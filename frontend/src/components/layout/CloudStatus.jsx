import { useEffect, useState } from 'react';
import { Cloud, CloudOff, LogOut, LoaderCircle } from 'lucide-react';
import { disconnectGoogle, getCloudUser, connectReviewUser } from '../../services/cloudGateway';
import { authErrorMessage } from '../../utils/authFeedback';
import { readLocalState, writeLocalState } from '../../services/localState';
import GoogleSignInButton from './GoogleSignInButton';

export default function CloudStatus({ state, isOnline, hasLocalData = false, onDownloadBackup }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [noticeHidden, setNoticeHidden] = useState(() => readLocalState('alacena_local_notice_hidden', false));
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
    if (user) { setBusy(false); setError(''); }
  }, [user?.uid]);
  useEffect(() => {
    const failed = (event) => { if (event.detail) setError(authErrorMessage(event.detail)); };
    window.addEventListener('alacena-auth-error', failed);
    return () => window.removeEventListener('alacena-auth-error', failed);
  }, []);
  // 3.13.0: sin sesión, el acceso es el botón oficial de Google
  // (GoogleSignInButton) montado aquí mismo; ya no hay flujo propio
  // de ventana emergente ni de redirección que coordinar. Con sesión,
  // este botón solo cierra sesión.
  const disconnect = async () => {
    setBusy(true); setError('');
    try { await disconnectGoogle(); }
    catch (err) { setError(authErrorMessage(err.code)); }
    finally { setBusy(false); }
  };
  return <aside className="cloud-status" aria-label="Estado de guardado">
    <div className="min-w-0 space-y-1">
      <div role="status" className="flex items-center gap-2 flex-wrap">
        {isOnline && state === 'synced' ? <Cloud size={17} /> : <CloudOff size={17} />}
        <span>{error || (!isOnline ? 'Sin conexión · cambios guardados en este dispositivo' : messages[state])}</span>
        {user?.email && <span className="text-xs opacity-80">{user.email}</span>}
      </div>
      {hasLocalData && !user && !noticeHidden && <p className="text-xs">Si borras los datos del navegador puedes perder esta copia. Conecta tu casa o descarga un respaldo. <button onClick={() => { setNoticeHidden(true); writeLocalState('alacena_local_notice_hidden', true); }}>Entendido</button></p>}
    </div>
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      {hasLocalData && !user && <button type="button" onClick={onDownloadBackup}>Descargar respaldo (JSON)</button>}
      {!user && isOnline && <GoogleSignInButton />}
      {user && <button type="button" onClick={disconnect} disabled={busy}>
        {busy ? <LoaderCircle size={15} className="animate-spin" /> : <LogOut size={15} />}
        {busy ? 'Cerrando…' : 'Cerrar sesión'}
      </button>}
      {import.meta.env.VITE_REVIEW_MODE === 'true' && !user && <button onClick={async () => {setBusy(true);try{await connectReviewUser();}catch(err){setError(authErrorMessage(err.code));}finally{setBusy(false);}}}>Entrar con cuenta ficticia</button>}
    </div>
  </aside>;
}
