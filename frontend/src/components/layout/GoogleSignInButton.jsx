import { useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { mountGoogleSignInButton } from '../../services/cloudGateway';
import { authErrorMessage } from '../../utils/authFeedback';

// Botón oficial de Google (Google Identity Services) montado en un
// contenedor (3.13.0). El botón lo pinta Google con su texto y tema;
// aquí solo vive el estado veraz alrededor: cargando, listo o error
// DENTRO de este mismo panel (lección de la 3.12.1: el error lejos
// del toque no sirve). Si el script de GIS no carga (sin conexión o
// bloqueado), el aviso lo dice y ofrece reintentar el montaje.
export default function GoogleSignInButton() {
  const containerRef = useRef(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [round, setRound] = useState(0);

  useEffect(() => {
    const failed = (event) => {
      if (!event.detail) return;
      setError(authErrorMessage(event.detail));
      setStatus('error');
    };
    window.addEventListener('alacena-auth-error', failed);
    return () => window.removeEventListener('alacena-auth-error', failed);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError('');
    mountGoogleSignInButton(containerRef.current)
      .then(() => { if (!cancelled) setStatus('ready'); })
      .catch((err) => {
        if (cancelled) return;
        setError(authErrorMessage(err?.code));
        setStatus('error');
      });
    return () => { cancelled = true; };
  }, [round]);

  return (
    <div className="google-signin">
      <div ref={containerRef} className="google-signin-button" aria-label="Acceso con Google" />
      {status === 'loading' && (
        <p className="google-signin-status"><LoaderCircle size={14} className="animate-spin" /> Cargando el botón de Google…</p>
      )}
      {status === 'error' && (
        <p className="google-signin-status" role="alert">
          {error}{' '}
          <button type="button" onClick={() => setRound((value) => value + 1)}>Reintentar</button>
        </p>
      )}
    </div>
  );
}
