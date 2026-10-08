import { useEffect, useRef, useState, type RefObject } from 'react';

/**
 * Widget de reseñas de Opynio (testimonios de la home, /precios, /recursos/exito...).
 *
 * El widget (https://web.opynio.com/widget.js) pinta dentro de un shadow DOM del
 * contenedor `.opynio-widget` y solo carga cuando el contenedor entra en pantalla.
 * Al terminar pone `data-loaded="true"` en el contenedor y:
 *   - con reseñas: tarjetas `.opynio-review-card` en el shadow DOM;
 *   - sin reseñas: el texto "No hay reseñas con texto para mostrar.";
 *   - si su API (widget-proxy) falla: nada (alto 0).
 * Antes la sección se pintaba siempre: con la API vacía o caída quedaba el spinner y
 * luego solo el título. Este hook dice si hay reseñas para que el llamador oculte la
 * sección entera cuando no las hay (comportamiento observado en la versión v6.10 del widget).
 */

export const OPYNIO_SCRIPT_SRC = 'https://web.opynio.com/widget.js';
export const OPYNIO_BUSINESS_ID = 'cee0e351-db95-4024-a5e0-2646e49b2756';

/** loading: aún no se sabe; ready: hay reseñas; empty: no hay (o falló la carga). */
export type OpynioStatus = 'loading' | 'ready' | 'empty';

const REVIEW_SELECTOR = '.opynio-review-card';
// Tras data-loaded, comprobaciones escalonadas por si las tarjetas llegan un poco después
const CHECK_DELAYS_MS = [0, 400, 1500];
// Si el widget no termina en este tiempo desde que el contenedor es visible, se oculta
const VISIBLE_TIMEOUT_MS = 20_000;

/**
 * Inserta el script del widget y vigila su contenedor.
 * @param reloadKey cambia cuando hay que volver a pintar el widget (idioma, tema). Debe
 *   coincidir con la `key` del contenedor para que el ref apunte al nodo nuevo.
 */
export function useOpynioWidget(reloadKey: string): { ref: RefObject<HTMLDivElement>; status: OpynioStatus } {
  const ref = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<OpynioStatus>('loading');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let settled = false;
    const timers: number[] = [];
    const hasReviews = () =>
      !!(el.shadowRoot?.querySelector(REVIEW_SELECTOR) || el.querySelector(REVIEW_SELECTOR));
    const settle = (next: OpynioStatus) => {
      if (settled) return;
      settled = true;
      setStatus(next);
    };

    const onLoaded = () => {
      if (settled || el.getAttribute('data-loaded') !== 'true') return;
      CHECK_DELAYS_MS.forEach((ms, i) => {
        timers.push(window.setTimeout(() => {
          if (hasReviews()) settle('ready');
          else if (i === CHECK_DELAYS_MS.length - 1) settle('empty');
        }, ms));
      });
    };

    const mutationObserver = new MutationObserver(onLoaded);
    mutationObserver.observe(el, { attributes: true, attributeFilter: ['data-loaded'] });

    // Red de seguridad: widget que carga pero nunca termina
    let intersectionObserver: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver((entries) => {
        if (!entries.some(e => e.isIntersecting)) return;
        intersectionObserver?.disconnect();
        timers.push(window.setTimeout(() => settle(hasReviews() ? 'ready' : 'empty'), VISIBLE_TIMEOUT_MS));
      });
      intersectionObserver.observe(el);
    }

    // El widget solo escanea los contenedores al ejecutarse: se vuelve a insertar el script
    const existing = document.querySelector('script[src*="opynio.com/widget"]');
    if (existing) existing.remove();
    const script = document.createElement('script');
    script.src = OPYNIO_SCRIPT_SRC;
    script.async = true;
    // Opynio caído o bloqueador de anuncios: no hay reseñas que enseñar
    script.onerror = () => settle('empty');
    document.head.appendChild(script);
    onLoaded();

    return () => {
      settled = true;
      mutationObserver.disconnect();
      intersectionObserver?.disconnect();
      timers.forEach(t => window.clearTimeout(t));
    };
  }, [reloadKey]);

  return { ref, status };
}
