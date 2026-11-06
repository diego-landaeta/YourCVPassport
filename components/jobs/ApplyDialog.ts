import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Anillo de foco comun de la ficha y los dialogos (con el desplazamiento correcto en oscuro). */
export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-dark-bg-secondary';

/**
 * Comportamiento comun de un dialogo modal: foco al abrir (en el propio dialogo), foco atrapado con Tab,
 * Escape para cerrar (salvo si `canClose` es false, p. ej. mientras se envia), scroll de fondo bloqueado
 * y foco devuelto al elemento que lo abrio.
 */
export function useDialogBehavior(ref: RefObject<HTMLElement | null>, onClose: () => void, canClose = true) {
  const closeRef = useRef(onClose);
  const canRef = useRef(canClose);
  closeRef.current = onClose;
  canRef.current = canClose;

  useEffect(() => {
    const opener = document.activeElement;
    const root = ref.current;
    root?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (canRef.current) { e.stopPropagation(); closeRef.current(); }
        return;
      }
      const dlg = ref.current;
      if (e.key !== 'Tab' || !dlg) return;
      const items = Array.from(dlg.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
      if (items.length === 0) { e.preventDefault(); dlg.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      if (!dlg.contains(active)) { e.preventDefault(); first.focus(); return; }
      if (e.shiftKey && (active === first || active === dlg)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [ref]);
}
