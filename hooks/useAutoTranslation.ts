import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  detectContentLanguage,
  isMeaningfulTranslation,
  peekAutoTranslation,
  requestAutoTranslation,
} from '../services/translation/autoTranslate';
import type { TranslationLanguage } from '../services/translation';

/**
 * Traduce automáticamente un bloque de contenido de usuario al idioma de la UI.
 *
 * `texts` son las partes de UNA unidad de contenido (p. ej. [post, pregunta,
 * ...opciones] o [nombre, descripción]); el idioma se detecta sobre el
 * conjunto. Si ya está en el idioma de la UI, no se pide nada.
 *
 * Devuelve `texts` traducidos (o los originales si se pulsa "Ver original" o
 * si aún no hay traducción) y el estado para pintar AutoTranslationNotice.
 */
export function useAutoTranslation(
  texts: Array<string | null | undefined>,
  options: { enabled?: boolean } = {}
) {
  const { enabled = true } = options;
  const { lang } = useLanguage();
  const target = lang as TranslationLanguage;

  // Clave estable del contenido (los arrays cambian de identidad en cada render)
  const textsKey = JSON.stringify(texts);
  const originals = useMemo<Array<string | null | undefined>>(() => JSON.parse(textsKey), [textsKey]);

  const sourceLang = useMemo(() => detectContentLanguage(originals), [originals]);
  const hasContent = originals.some((t) => !!t && t.trim() !== '');
  const needsTranslation = enabled && hasContent && sourceLang !== target;

  const fromMemory = useCallback(
    () => originals.map((t) => (t && needsTranslation ? peekAutoTranslation(t, sourceLang, target) ?? null : null)),
    [originals, needsTranslation, sourceLang, target]
  );

  const [translated, setTranslated] = useState<Array<string | null>>(fromMemory);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (!needsTranslation) {
      setTranslated(originals.map(() => null));
      setIsTranslating(false);
      return;
    }
    const initial = fromMemory();
    setTranslated(initial);
    const missing = originals.some((t, i) => !!t && t.trim() !== '' && initial[i] === null);
    if (!missing) {
      setIsTranslating(false);
      return;
    }

    let cancelled = false;
    setIsTranslating(true);
    Promise.all(
      originals.map((t) => (t && t.trim() !== '' ? requestAutoTranslation(t, sourceLang, target) : Promise.resolve(null)))
    ).then((results) => {
      if (cancelled) return;
      setTranslated(results.map((r, i) => (r !== null && isMeaningfulTranslation(originals[i] || '', r) ? r : null)));
      setIsTranslating(false);
    });
    return () => { cancelled = true; };
  }, [originals, needsTranslation, sourceLang, target, fromMemory]);

  const isTranslated = needsTranslation && translated.some((t) => t !== null);
  const showTranslation = isTranslated && !showOriginal;

  const display = useMemo(
    () => originals.map((t, i) => (showTranslation && translated[i] ? (translated[i] as string) : (t ?? ''))),
    [originals, translated, showTranslation]
  );

  const toggleOriginal = useCallback(() => setShowOriginal((v) => !v), []);

  return {
    /** Textos a pintar (traducidos u originales). */
    texts: display,
    sourceLang,
    /** Hay traducción disponible para alguna parte. */
    isTranslated,
    /** Pidiendo traducción (se muestra el original mientras tanto). */
    isTranslating: needsTranslation && isTranslating && !isTranslated,
    showOriginal,
    toggleOriginal,
  };
}

export type AutoTranslationState = ReturnType<typeof useAutoTranslation>;
