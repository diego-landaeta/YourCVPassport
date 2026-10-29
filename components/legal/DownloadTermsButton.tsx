import React, { useState } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../contexts/LanguageContext';
import { downloadLegalText, fetchLegalDocuments } from '../../lib/legal';
import { useLegalText } from './legalText';

/**
 * «Descargar condiciones» (#6, cláusula 2.3: el candidato puede descargar las condiciones
 * que aceptó). Descarga como .txt la versión vigente de las condiciones de candidato en el
 * idioma de la interfaz (cae a español si no hay texto en ese idioma).
 */
const DownloadTermsButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const tx = useLegalText();
  const { lang } = useLanguage();
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  const onClick = async () => {
    if (state === 'loading') return;
    setState('loading');
    const { docs, error } = await fetchLegalDocuments(['terminos_candidato'], lang);
    const doc = docs.terminos_candidato;
    if (error || !doc) {
      setState('error');
      return;
    }
    downloadLegalText(doc);
    setState('idle');
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => { void onClick(); }}
        disabled={state === 'loading'}
        className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors duration-150 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-slate-200 dark:hover:bg-dark-bg-tertiary dark:focus-visible:ring-offset-dark-bg-primary"
      >
        <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
        {state === 'loading' ? tx.downloadTermsLoading : tx.downloadTerms}
      </button>
      <div aria-live="polite">
        {state === 'error' && (
          <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-400">{tx.downloadTermsError}</p>
        )}
      </div>
    </div>
  );
};

export default DownloadTermsButton;
