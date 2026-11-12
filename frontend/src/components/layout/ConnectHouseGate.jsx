import { useEffect, useState } from 'react';
import { CloudOff, LogIn, LoaderCircle, Smartphone } from 'lucide-react';
import { authErrorMessage } from '../../utils/authFeedback';

// Puerta de conexión a la casa (3.12.0). Sin sesión, la app NO arranca
// en modo local silencioso enseñando contadores a cero como si fueran
// la verdad del hogar: primero se dice con claridad que este
// dispositivo aún no está conectado, con el acceso delante. El modo
// «solo en este dispositivo» queda como elección explícita y
// secundaria de quien lo pulsa, nunca como arranque por defecto.
//
// 3.12.1: la puerta responde EN SU SITIO. Al pulsar, el botón dice al
// instante «Abriendo el acceso de Google…» y cualquier error del
// intento se pinta dentro de este mismo panel — en el iPhone el error
// ya no puede quedar escondido en el bloque «Alacena & QR», lejos del
// toque. Si la redirección volvió sin completar, el botón pasa a
// ofrecer la ventana de Google como plan B, aquí mismo.
export default function ConnectHouseGate({ onUseLocalOnly }) {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState('');
  const [offerPopup, setOfferPopup] = useState(false);
  useEffect(() => {
    const failed = (event) => {
      setOpening(false);
      setError(authErrorMessage(event.detail));
      setOfferPopup(event.detail === 'auth/redirect-returned-empty');
    };
    window.addEventListener('alacena-auth-error', failed);
    return () => window.removeEventListener('alacena-auth-error', failed);
  }, []);
  const requestConnect = () => {
    setOpening(true); setError('');
    window.dispatchEvent(new CustomEvent(offerPopup ? 'alacena-request-connect-popup' : 'alacena-request-connect'));
  };
  return (
    <section className="connect-house-gate" aria-label="Tu casa aún no está conectada">
      <div className="connect-house-gate-panel">
        <div className="flex items-start gap-3 min-w-0">
          <span className="connect-house-gate-icon"><CloudOff size={22} /></span>
          <div className="min-w-0">
            <h2>Tu casa aún no está conectada en este dispositivo</h2>
            <p>
              Lo que ves ahora es solo la copia de este dispositivo, que puede estar vacía o desactualizada.
              Entra con tu cuenta de Google y tu casa se conecta sola: tu lista, tu despensa y tus casas
              aparecen tal como están en la nube, en este y en cualquier dispositivo.
            </p>
            {error && <p role="alert" className="connect-house-gate-error">{error}</p>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button type="button" className="connect-house-gate-primary" onClick={requestConnect} disabled={opening}>
            {opening ? <LoaderCircle size={16} className="animate-spin" /> : <LogIn size={16} />}
            {opening ? 'Abriendo el acceso de Google…' : offerPopup ? 'Entrar con la ventana de Google' : 'Entrar con Google y conectar mi casa'}
          </button>
          <button type="button" className="connect-house-gate-secondary" onClick={onUseLocalOnly}>
            <Smartphone size={15} /> Usar solo en este dispositivo, sin conectar
          </button>
        </div>
      </div>
    </section>
  );
}
