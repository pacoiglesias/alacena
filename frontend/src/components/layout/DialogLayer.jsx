import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
export default function DialogLayer({ children, label, onClose }) {
  const panel = useRef(null), close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement, overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const controls = () => [...panel.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex="0"]')];
    (panel.current.querySelector('input') || controls()[0] || panel.current).focus();
    const key = (event) => {
      if (event.key === 'Escape') {event.preventDefault();event.stopPropagation();close.current?.();}
      if (event.key !== 'Tab') return;
      const nodes = controls(), first = nodes[0], last = nodes.at(-1);
      if (!first) {event.preventDefault();panel.current.focus();}
      else if (event.shiftKey && (document.activeElement === first || !panel.current.contains(document.activeElement))) {event.preventDefault();last.focus();}
      else if (!event.shiftKey && (document.activeElement === last || !panel.current.contains(document.activeElement))) {event.preventDefault();first.focus();}
    };
    document.addEventListener('keydown', key, true);
    return () => {document.removeEventListener('keydown',key,true);document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};
  }, []);
  return createPortal(<div ref={panel} role="dialog" aria-label={label} aria-modal="true" tabIndex={-1} className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm grid place-items-center p-3">{children}</div>,document.body);
}
