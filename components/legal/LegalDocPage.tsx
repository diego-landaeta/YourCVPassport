import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { downloadLegalText, fetchLegalDocuments, fetchUpcomingLegalDocument, type LegalDocument, type LegalTipo } from '../../lib/legal';
import { fmt } from '../../lib/bolsaText';
import { ArrowDownTrayIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import LegalTextBody from './LegalTextBody';
import { useLegalText } from './legalText';
import { useLegalNotices, useNoticeDate } from './LegalNoticeBanner';
import { useNoticeText } from './noticeText';
import SeoLinks from '../shared/SeoLinks';

/** Texto estático de respaldo (el que había antes de existir documentos_legales). */
export interface LegalFallbackContent {
  title: string;
  metaDescription: string;
  lastUpdated: string;
  intro: string;
  sections: ReadonlyArray<{ heading: string; body: string }>;
}

interface LegalDocPageProps {
  /** terms: candidatos o empleadores (?tipo=empleador); privacy: única. */
  kind: 'terms' | 'privacy';
  fallback: LegalFallbackContent;
  /** Fecha del texto estático de respaldo (AAAA-MM-DD) y su versión ya formateada. */
  fallbackDate: string;
  fallbackDateLabel: string;
}

/**
 * Página de condiciones / privacidad que lee `documentos_legales` (versión
 * vigente, idioma de la interfaz, caída a español). Marca el borrador cuando
 * `borrador = true`. Si la lectura falla (migración sin aplicar, sin red), cae al
 * texto estático para que la página nunca quede en blanco.
 */
const LegalDocPage: React.FC<LegalDocPageProps> = ({ kind, fallback, fallbackDate, fallbackDateLabel }) => {
  const { lang } = useLanguage();
  const tx = useLegalText();
  const [params, setParams] = useSearchParams();
  const employer = kind === 'terms' && params.get('tipo') === 'empleador';
  const publication = kind === 'terms' && params.get('tipo') === 'publicacion';
  const tipo: LegalTipo = kind === 'privacy' ? 'privacidad' : publication ? 'condiciones_publicacion' : employer ? 'terminos_empleador' : 'terminos_candidato';

  const nx = useNoticeText();
  const noticeDate = useNoticeDate();
  // Aviso de la proxima version (solo con sesion: la RPC es de usuarios autenticados y falla en silencio)
  const notice = useLegalNotices('todos').find((n) => n.tipo === tipo) ?? null;
  const [next, setNext] = useState<{ state: 'idle' | 'loading' | 'ok' | 'error'; doc: LegalDocument | null }>({ state: 'idle', doc: null });
  const [showNext, setShowNext] = useState(false);

  const [doc, setDoc] = useState<LegalDocument | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'fallback'>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    (async () => {
      const { docs, error } = await fetchLegalDocuments([tipo], lang);
      if (cancelled) return;
      const found = docs[tipo];
      if (error || !found) {
        setDoc(null);
        setState('fallback');
      } else {
        setDoc(found);
        setState('ok');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tipo, lang]);

  // Cambiar de documento o de idioma vuelve al texto vigente
  useEffect(() => {
    setShowNext(false);
    setNext({ state: 'idle', doc: null });
  }, [tipo, lang]);

  const toggleNext = async () => {
    if (showNext) { setShowNext(false); return; }
    setShowNext(true);
    if (!notice || next.doc) return;
    setNext({ state: 'loading', doc: null });
    const found = await fetchUpcomingLegalDocument(notice.tipo, notice.version, notice.idioma);
    setNext(found ? { state: 'ok', doc: found } : { state: 'error', doc: null });
  };

  // Salto al ancla (#anexo) cuando el texto ya está pintado.
  useEffect(() => {
    if (state === 'ok' && window.location.hash) {
      document.getElementById(window.location.hash.slice(1))?.scrollIntoView();
    }
  }, [state, doc?.id]);

  const dateFmt = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));

  const title = doc?.titulo ?? fallback.title;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <SeoLinks />
      <Helmet>
        <title>{`${title} | YourCVPassport`}</title>
        <meta name="description" content={fallback.metaDescription} />
      </Helmet>

      {kind === 'terms' && (
        <div role="tablist" aria-label={tx.docTabsLabel} className="mb-6 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-dark-border dark:bg-dark-bg-tertiary">
          {([false, true] as const).map((isEmployer) => {
            const active = employer === isEmployer;
            return (
              <button
                key={String(isEmployer)}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setParams(isEmployer ? { tipo: 'empleador' } : {}, { replace: true })}
                className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-primary ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-dark-bg-secondary dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {isEmployer ? tx.tabEmployers : tx.tabCandidates}
              </button>
            );
          })}
        </div>
      )}

      <h1 className="text-balance text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">{title}</h1>

      {state === 'loading' && (
        <p role="status" className="mt-4 text-sm text-slate-600 dark:text-dark-text-secondary">{tx.docLoading}</p>
      )}

      {state === 'ok' && doc && (
        <div className="mt-5">
          {doc.borrador && (
            <p role="note" className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm leading-snug text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{fmt(tx.docDraftNotice, { version: doc.version })}</span>
            </p>
          )}
          {notice && (
            <div role="note" data-testid="legal-doc-upcoming" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm leading-snug text-amber-950 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
              <p className="flex items-start gap-2.5">
                <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                <span>{fmt(nx.docNotice, { version: notice.version, date: noticeDate(notice.vigente_desde) })}</span>
              </p>
              <button
                type="button"
                onClick={() => void toggleNext()}
                aria-expanded={showNext}
                className="ml-7 mt-2 rounded font-medium text-amber-950 underline underline-offset-2 hover:text-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:text-amber-100 dark:hover:text-white dark:focus-visible:ring-offset-dark-bg-primary"
              >
                {showNext ? nx.docShowCurrent : nx.docShowNext}
              </button>
            </div>
          )}
          {showNext && notice ? (
            <div data-testid="legal-doc-next">
              {next.state === 'loading' && <p role="status" className="text-sm text-slate-600 dark:text-dark-text-secondary">{nx.docNextLoading}</p>}
              {next.state === 'error' && <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">{nx.docNextError}</p>}
              {next.state === 'ok' && next.doc && (
                <>
                  <h2 className="mb-6 border-b border-slate-200 pb-4 text-lg font-semibold tracking-tight text-slate-900 dark:border-dark-border dark:text-white">
                    {fmt(nx.docNextHeading, { version: next.doc.version, date: noticeDate(next.doc.vigente_desde) })}
                  </h2>
                  <LegalTextBody texto={next.doc.texto} />
                </>
              )}
            </div>
          ) : (
          <>
          <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-slate-200 pb-6 dark:border-dark-border">
            <p className="m-0 text-sm tabular-nums text-slate-600 dark:text-dark-text-secondary">
              {fmt(tx.docVersionLine, { version: doc.version, date: dateFmt(doc.vigente_desde) })}
            </p>
            <button
              type="button"
              onClick={() => downloadLegalText(doc)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:border-dark-border dark:bg-dark-bg-secondary dark:text-slate-200 dark:hover:bg-dark-bg-tertiary dark:focus-visible:ring-offset-dark-bg-primary"
            >
              <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
              {tx.docDownload}
            </button>
          </div>
          <LegalTextBody texto={doc.texto} anchors />
          </>
          )}
        </div>
      )}

      {state === 'fallback' && (
        <div className="mt-5 max-w-[68ch] text-[15px] leading-7 text-slate-700 dark:text-slate-300">
          <p role="note" className="mb-5 flex items-start gap-2.5 rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-sm leading-snug text-amber-900 dark:border-amber-400/30 dark:bg-amber-500/10 dark:text-amber-100">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{tx.docFallback}</span>
          </p>
          <p className="mb-6 text-sm text-slate-600 dark:text-dark-text-secondary">{fallback.lastUpdated}: <time dateTime={fallbackDate}>{fallbackDateLabel}</time></p>
          <section className="mb-6">
            <p className="mb-4">{fallback.intro}</p>
          </section>
          {fallback.sections.map((section) => (
            <section key={section.heading} className="mb-6">
              <h2 className="mb-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-white">{section.heading}</h2>
              <p className="mb-4">{section.body}</p>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default LegalDocPage;
