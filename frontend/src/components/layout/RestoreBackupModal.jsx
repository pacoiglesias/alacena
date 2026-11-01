import { useState } from 'react';
import { validateBackup, planRestore, createBackup } from '../../utils/backup';
import DialogLayer from './DialogLayer';
const names = {products:'Productos',shoppingList:'Lista del súper',zones:'Zonas',recipes:'Recetas',households:'Casas',auditLogs:'Bitácora',purchaseHistory:'Compras'};
export default function RestoreBackupModal({ current, recovery, connected, online, onApply, onClose }) {
  const [base,setBase] = useState(() => JSON.parse(JSON.stringify(current)));
  const [incoming,setIncoming] = useState(null), [mode,setMode] = useState('combine'), [error,setError] = useState(''), [busy,setBusy] = useState(false), [confirmed,setConfirmed] = useState(false);
  const plan = incoming ? planRestore(base,incoming,mode) : null;
  const read = async (e) => {
    setError(''); setIncoming(null); setConfirmed(false);
    try { const file = e.target.files?.[0]; if (!file) return; if (file.size > 20*1024*1024) throw new Error('El respaldo supera 20 MB.'); setIncoming(validateBackup(await file.text())); setBase(JSON.parse(JSON.stringify(current))); }
    catch(err) { setError(err.message); }
  };
  const apply = async () => {
    if (!plan || !confirmed || busy) return;
    setBusy(true); setError('');
    try { await onApply(plan); onClose(); }
    catch(err) { setError(err.message); }
    finally { setBusy(false); }
  };
  return <DialogLayer label="Restaurar respaldo" onClose={() => { if (!busy) onClose(); }}>
    <div className="review-panel">
      <header className="flex justify-between gap-4"><div><h2>Restaurar respaldo</h2><p>Primero revisa. Nada cambia al seleccionar el archivo.</p></div><button disabled={busy} onClick={onClose} aria-label="Cerrar restauración">×</button></header>
      <label className="block">Respaldo JSON<input aria-label="Seleccionar respaldo JSON" type="file" accept="application/json,.json" onChange={read} disabled={busy} /></label>
      {recovery?.products?.length > 0 && <button disabled={busy} onClick={() => {try {setBase(JSON.parse(JSON.stringify(current)));setIncoming(validateBackup(JSON.stringify(createBackup({...current,...recovery}))));setConfirmed(false);}catch(err){setError(err.message);}}}>Revisar copia anterior a conectar la nube</button>}
      {plan && <>
        <fieldset disabled={busy} className="space-y-2"><legend>Cómo restaurar</legend>
          <label className="block"><input type="radio" name="restore-mode" checked={mode==='combine'} onChange={() => {setMode('combine');setConfirmed(false);}} /> Combinar: conservar lo actual y añadir lo que falta</label>
          <label className="block"><input type="radio" name="restore-mode" checked={mode==='replace'} onChange={() => {setMode('replace');setConfirmed(false);}} /> Reemplazar productos, lista, zonas, casas y recetas</label>
        </fieldset>
        <div className="overflow-x-auto"><table className="w-full text-sm"><caption>Vista previa, sin cambios</caption><thead><tr><th>Colección</th><th>Actual</th><th>Resultado</th></tr></thead><tbody>{plan.counts.map((c) => <tr key={c.key}><td>{names[c.key]}{c.preserved ? ' · se conserva' : ''}{c.conflicts ? ` · ${c.conflicts} conflictos: prevalece lo actual` : ''}</td><td>{c.before}</td><td>{c.after}</td></tr>)}</tbody></table></div>
        <details><summary>Ver productos y cantidades del resultado</summary><ul className="space-y-2 mt-3">{plan.next.products.slice(0,100).map((p) => <li key={p.id}>{p.name}: {base.products.find((old) => old.id===p.id)?.quantity ?? 'nuevo'} → {p.quantity} {p.unit}</li>)}{base.products.filter((p) => !plan.next.products.some((row) => row.id===p.id)).slice(0,100).map((p) => <li key={p.id}>Se quitará del inventario: {p.name} ({p.quantity} {p.unit})</li>)}</ul>{plan.next.products.length>100 && <p>Mostrando los primeros 100 de {plan.next.products.length} productos.</p>}</details>
        <p>Bitácora e historial sólo incorporan registros nuevos. Nunca se borran ni se sobrescriben. Antes de aplicar se guarda y descarga automáticamente un respaldo de lo actual.</p>
        {connected && <p>La casa está conectada: se comprobarán cambios simultáneos antes de escribir en la nube. Para seguridad, cada restauración conectada admite hasta 400 documentos cambiados.</p>}
        <label className="flex gap-2"><input type="checkbox" checked={confirmed} disabled={busy} onChange={(e) => setConfirmed(e.target.checked)} /> Revisé la vista previa y elegí {mode==='combine' ? 'combinar' : 'reemplazar'}.</label>
      </>}
      {error && <p role="alert">{error}</p>}
      {connected && !online && <p role="alert">Vuelve a tener conexión antes de restaurar una casa conectada.</p>}
      <footer className="flex flex-wrap justify-end gap-2"><button disabled={busy} onClick={onClose}>Cancelar</button><button className="review-primary" disabled={!plan || !confirmed || busy || (connected && !online)} onClick={apply}>{busy ? 'Restaurando… conserva esta ventana abierta' : 'Crear respaldo previo y restaurar'}</button></footer>
    </div>
  </DialogLayer>;
}
