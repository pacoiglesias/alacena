import { useEffect, useRef } from 'react';
export function useDismissablePopover(open, onClose) {
  const root = useRef(null), close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    if (!open) return;
    const dismiss = () => { close.current(); root.current?.querySelector('button')?.focus(); };
    const pointer = (event) => { if (!root.current?.contains(event.target)) dismiss(); };
    const key = (event) => { if (event.key === 'Escape') { event.stopPropagation(); dismiss(); } };
    document.addEventListener('pointerdown', pointer); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', pointer); document.removeEventListener('keydown', key); };
  }, [open]);
  return root;
}
