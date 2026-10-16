import { useEffect, useState } from 'react';
import { APP_VERSION } from '../../version';

export default function OfflineStatus() {
  const [ready, setReady] = useState(false);
  const [update, setUpdate] = useState(null);
  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
    let live = true;
    const hadController = Boolean(navigator.serviceWorker.controller);
    let refreshing = false;
    const onController = () => { if (hadController && !refreshing) { refreshing = true; window.location.reload(); } };
    navigator.serviceWorker.addEventListener('controllerchange', onController);
    const check = (registration) => {
      if (registration.waiting && navigator.serviceWorker.controller && live) setUpdate(registration.waiting);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed') check(registration); });
      }, { once: true });
    };
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(check).catch(() => {});
    navigator.serviceWorker.ready.then(() => { if (live) setReady(true); });
    return () => { live = false; navigator.serviceWorker.removeEventListener('controllerchange', onController); };
  }, []);
  return <div className="max-w-7xl w-full mx-auto px-4 sm:px-8 pt-2 text-[11px] text-[var(--ink-secondary)] flex flex-wrap justify-between gap-2" role="status">
    <span>{import.meta.env.PROD ? ready ? 'Lista, escáner y OCR disponibles sin conexión en este dispositivo' : 'Preparando el uso sin conexión; mantén esta página abierta con internet…' : 'Vista de desarrollo · el modo sin conexión se prepara al compilar'}</span>
    {update ? <button className="font-bold text-emerald-400" onClick={() => update.postMessage('ACTIVATE_UPDATE')}>Actualizar ALACENA</button> : <span>v{APP_VERSION}</span>}
  </div>;
}
