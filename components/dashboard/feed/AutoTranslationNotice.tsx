import React from 'react';
import { LanguageIcon } from '@heroicons/react/24/outline';
import { useTranslations } from '../../../hooks/useTranslations';
import type { AutoTranslationState } from '../../../hooks/useAutoTranslation';

interface AutoTranslationNoticeProps {
  state: Pick<AutoTranslationState, 'sourceLang' | 'isTranslated' | 'isTranslating' | 'showOriginal' | 'toggleOriginal'>;
  /** Versión corta ("Traducido · Ver original") para tarjetas y comentarios. */
  compact?: boolean;
  className?: string;
}

/**
 * Aviso "Traducido automáticamente del inglés · Ver original".
 * No pinta nada si el contenido ya está en el idioma de la interfaz.
 */
const AutoTranslationNotice: React.FC<AutoTranslationNoticeProps> = ({ state, compact = false, className = '' }) => {
  const t = useTranslations();
  const ta = t.feed.autoTranslation;
  const { sourceLang, isTranslated, isTranslating, showOriginal, toggleOriginal } = state;

  if (isTranslating) {
    return (
      <p
        className={`flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 ${className}`}
        role="status"
        aria-live="polite"
        data-testid="auto-translation-loading"
      >
        <LanguageIcon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
        {ta.translating}
      </p>
    );
  }

  if (!isTranslated) return null;

  const label = compact
    ? ta.translatedShort
    : (ta.translatedFrom[sourceLang as 'en' | 'es'] || ta.translatedShort);

  return (
    <p
      className={`flex flex-wrap items-center gap-x-1 text-xs text-gray-500 dark:text-gray-400 ${className}`}
      data-testid="auto-translation-notice"
    >
      <LanguageIcon className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
      {!showOriginal && <span>{label}</span>}
      {!showOriginal && <span aria-hidden="true">·</span>}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggleOriginal(); }}
        className="font-semibold text-cv-blue hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue/40 rounded"
      >
        {showOriginal ? ta.seeTranslation : ta.seeOriginal}
      </button>
    </p>
  );
};

export default AutoTranslationNotice;
