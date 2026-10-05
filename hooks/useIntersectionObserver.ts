import { useState, useEffect, useRef, MutableRefObject } from 'react';

/**
 * Marca un elemento como visible la primera vez que entra en el viewport.
 *
 * - Las opciones se comparan por valor (threshold/rootMargin/root), no por referencia:
 *   los llamadores pasan un objeto literal nuevo en cada render y, si se usara como
 *   dependencia, el observer se recrearia en cada render.
 * - Si el elemento es tan alto que nunca puede alcanzar el umbral pedido (p. ej. una
 *   cuadricula de 30.000 px con threshold 0.1), se considera visible en cuanto asoma.
 *   Sin esto, el contenido envuelto en animaciones de entrada se quedaba invisible.
 */
export const useIntersectionObserver = (
  options?: IntersectionObserverInit
): [MutableRefObject<any>, boolean] => {
  const containerRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  const root = options?.root ?? null;
  const rootMargin = options?.rootMargin;
  const thresholdKey = JSON.stringify(options?.threshold ?? 0);

  useEffect(() => {
    if (isVisible) return;
    const currentRef = containerRef.current;
    if (!currentRef) return;

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }

    const parsed = JSON.parse(thresholdKey) as number | number[];
    const requested = Array.isArray(parsed) ? parsed : [parsed];
    const minThreshold = Math.min(...requested);
    // Se observa tambien el umbral 0 para detectar cuando asoma un elemento muy alto.
    const thresholds = Array.from(new Set([0, ...requested])).sort((a, b) => a - b);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        const rootHeight = entry.rootBounds?.height ?? window.innerHeight;
        const elementHeight = entry.boundingClientRect.height;
        const reachedThreshold = entry.intersectionRatio >= minThreshold;
        const tooTallForThreshold = elementHeight > 0 && rootHeight / elementHeight < minThreshold;
        if (reachedThreshold || tooTallForThreshold) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { root, rootMargin, threshold: thresholds }
    );

    observer.observe(currentRef);
    return () => observer.disconnect();
  }, [root, rootMargin, thresholdKey, isVisible]);

  return [containerRef, isVisible];
};
