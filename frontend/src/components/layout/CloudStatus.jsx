import { useState } from 'react';
import { Cloud, CloudOff, LogIn, LogOut, LoaderCircle } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth } from '../../services/firebase';

export default function CloudStatus({ state, isOnline }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const messages = {
    local: 'Guardado en este dispositivo · inicia sesión para conectar tu casa',
    connecting: 'Conectando con tu casa…',
    unauthorized: 'Tu cuenta aún no tiene acceso a esta casa. Tus cambios siguen en este dispositivo.',
    synced: 'Lista conectada · cambios de la lista confirmados en la nube',
    pending: 'Guardando cambios de la lista en la nube…',
    cached: 'Mostrando la copia guardada · esperando confirmación de la nube',
    error: 'No se pudo sincronizar · revisa la conexión y el acceso de tu cuenta',
  };
  const connect = async () => {
    setBusy(true); setError('');
    try {
      if (auth.currentUser) await signOut(auth);
      else await signInWithPopup(auth, new GoogleAuthProvider());
    } catch { setError('No se pudo completar el acceso. Puedes seguir usando este dispositivo.'); }
    finally { setBusy(false); }
  };
  return <aside className="cloud-status" aria-label="Estado de guardado">
    <div role="status" className="flex items-center gap-2 min-w-0">
      {isOnline && state === 'synced' ? <Cloud size={17} /> : <CloudOff size={17} />}
      <span>{error || (!isOnline ? 'Sin conexión · los cambios se guardan en este dispositivo' : messages[state])}</span>
      {auth.currentUser?.email && <span className="text-xs opacity-70">{auth.currentUser.email}</span>}
    </div>
    <button type="button" onClick={connect} disabled={busy || !isOnline}>
      {busy ? <LoaderCircle size={15} className="animate-spin" /> : auth.currentUser ? <LogOut size={15} /> : <LogIn size={15} />}
      {auth.currentUser ? 'Cerrar sesión' : 'Conectar mi casa'}
    </button>
  </aside>;
}
