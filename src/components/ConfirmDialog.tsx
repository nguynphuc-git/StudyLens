import { lockBodyScroll } from '../scroll-lock';
import { useEffect, useRef } from 'react';
export interface Confirmation { title: string; description: string; action: string; cancel?: string }
export function ConfirmDialog({ title, description, action, cancel: cancelLabel = 'Keep working', onClose }: Confirmation & { onClose: (accepted: boolean) => void }) {
  const dialog = useRef<HTMLElement>(null); const cancel = useRef<HTMLButtonElement>(null); const close = useRef(onClose); close.current = onClose;
  useEffect(() => {
    const previous = window.document.activeElement instanceof HTMLElement ? window.document.activeElement : null;
    cancel.current?.focus();
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close.current(false); }
      if (e.key !== 'Tab') return;
      const buttons = dialog.current?.querySelectorAll<HTMLButtonElement>('button'); if (!buttons?.length) return;
      const first=buttons[0], last=buttons[buttons.length-1];
      if (e.shiftKey && window.document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && window.document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    const release=lockBodyScroll();
    window.document.addEventListener('keydown',handle);
    return () => { window.document.removeEventListener('keydown',handle); release(); previous?.focus(); };
  }, []);
  return <div className="modal-backdrop confirmation-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose(false); }}><section ref={dialog} className="paper confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-heading" aria-describedby="confirm-description"><span className="confirm-icon" aria-hidden="true">✎</span><p className="eyebrow">YOUR NOTEBOOK</p><h2 id="confirm-heading">{title}</h2><p id="confirm-description">{description}</p><div className="row"><button ref={cancel} onClick={() => onClose(false)}>{cancelLabel}</button><button className="primary" onClick={() => onClose(true)}>{action}</button></div></section></div>;
}
