import { CloudOff, LogIn, Smartphone } from 'lucide-react';

// Puerta de conexión a la casa (3.12.0). Sin sesión, la app NO arranca
// en modo local silencioso enseñando contadores a cero como si fueran
// la verdad del hogar: primero se dice con claridad que este
// dispositivo aún no está conectado, con el acceso delante. El modo
// «solo en este dispositivo» queda como elección explícita y
// secundaria de quien lo pulsa, nunca como arranque por defecto.
export default function ConnectHouseGate({ onUseLocalOnly }) {
  const requestConnect = () => window.dispatchEvent(new CustomEvent('alacena-request-connect'));
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
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button type="button" className="connect-house-gate-primary" onClick={requestConnect}>
            <LogIn size={16} /> Entrar con Google y conectar mi casa
          </button>
          <button type="button" className="connect-house-gate-secondary" onClick={onUseLocalOnly}>
            <Smartphone size={15} /> Usar solo en este dispositivo, sin conectar
          </button>
        </div>
      </div>
    </section>
  );
}
