// Servicio de avisos no bloqueantes — reemplazo de alert()/confirm() nativos.
//   notify('mensaje')             → toast inferior que se cierra solo
//   await confirmDialog('¿...?')  → Promise<boolean> con modal propio
// El componente <NoticeHost/> (components/common/NoticeHost.jsx) debe estar
// montado una vez en el árbol para renderizar los avisos.

const listeners = new Set();
let toastSeq = 0;
let confirmReq = null;

function emit(state) {
  listeners.forEach((fn) => fn(state));
}

export function subscribeNotice(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(message, ms = 4200) {
  const id = ++toastSeq;
  emit({ toast: { id, message } });
  setTimeout(() => emit({ toast: null, toastId: id }), ms);
}

export function confirmDialog(message, { okLabel = 'Sí, continuar', cancelLabel = 'Cancelar', danger = true } = {}) {
  return new Promise((resolve) => {
    confirmReq = { message, okLabel, cancelLabel, danger, resolve };
    emit({ confirm: confirmReq });
  });
}

export function settleConfirm(value) {
  const req = confirmReq;
  confirmReq = null;
  emit({ confirm: null });
  if (req) req.resolve(value);
}
