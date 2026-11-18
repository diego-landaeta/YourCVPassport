import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslations } from '../../hooks/useTranslations';
import { useLanguage } from '../../contexts/LanguageContext';
import { useConsent } from '../../hooks/useConsent';
import { CONSENT_OPEN_EVENT, setConsent } from '../../lib/consent';

// Aviso de cookies (issue #11, YCV-001) y panel de configuración.
//
// - Aparece mientras el visitante no ha decidido (lib/consent.ts). «Rechazar» tiene
//   el mismo peso visual que «Aceptar todo» (mismo estilo y tamaño): rechazar debe
//   ser tan fácil como aceptar (guía de cookies de la AEPD).
// - No es un modal: no bloquea la página. El panel «Configurar» sí es un diálogo
//   (foco dentro, Escape para cerrar) y se abre también desde el pie o la política
//   de cookies (openCookieSettings).
// - No se muestra en las rutas internas de captura de plantillas (/dev/...), que
//   se usan para generar imágenes.
// - Mientras el aviso está visible publica su alto en la variable CSS `--cookie-banner-h`
//   (en px, sobre <html>) y la deja en `0px` al decidir o cerrarlo. Las barras fijas de la parte
//   inferior (p. ej. la barra «Inscribirme» de la ficha de oferta en móvil) deben usar
//   `bottom: var(--cookie-banner-h, 0px)` para no quedar tapadas por el aviso (z-index 90).

const HIDDEN_PREFIXES = ['/dev/'];

/** Variable CSS (sobre <html>) con el alto en px del aviso de cookies visible; 0px si no se ve. */
export const COOKIE_BANNER_HEIGHT_VAR = '--cookie-banner-h';

const ShieldIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg aria-hidden="true" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
  </svg>
);

const CookieConsent: React.FC = () => {
  const t = useTranslations().cookieConsent;
  const { lang } = useLanguage();
  const location = useLocation();
  const consent = useConsent();
  const [dialogOpen, setDialogOpen] = useState(false);
  // Selección del panel «Configurar» (por defecto, lo opcional desactivado).
  const [choice, setChoice] = useState({ analytics: false, thirdParty: false });
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);
  const bannerRef = useRef<HTMLElement>(null);

  const policyPath = lang === 'es' ? '/politica-de-cookies' : '/cookie-policy';

  const openDialog = useCallback(() => {
    openerRef.current = document.activeElement;
    setChoice({ analytics: consent?.analytics ?? false, thirdParty: consent?.thirdParty ?? false });
    setDialogOpen(true);
  }, [consent]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    // Devuelve el foco a quien abrió el panel (accesibilidad).
    const opener = openerRef.current as HTMLElement | null;
    if (opener && typeof opener.focus === 'function') opener.focus();
  }, []);

  useEffect(() => {
    window.addEventListener(CONSENT_OPEN_EVENT, openDialog);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, openDialog);
  }, [openDialog]);

  // Foco al primer control del panel y Escape para cerrar.
  useEffect(() => {
    if (!dialogOpen) return;
    dialogRef.current?.querySelector<HTMLElement>('button, [href], input')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDialog();
      if (e.key === 'Tab' && dialogRef.current) {
        const items = [...dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input')];
        if (!items.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialogOpen, closeDialog]);

  const hiddenRoute = HIDDEN_PREFIXES.some(p => location.pathname.startsWith(p));
  const bannerVisible = !consent && !dialogOpen && !hiddenRoute;

  // Publica el alto del aviso en --cookie-banner-h mientras se ve y lo pone a 0px al decidir/cerrar.
  useLayoutEffect(() => {
    const root = document.documentElement;
    const el = bannerRef.current;
    if (!bannerVisible || !el) {
      root.style.setProperty(COOKIE_BANNER_HEIGHT_VAR, '0px');
      return;
    }
    const publish = () => root.style.setProperty(COOKIE_BANNER_HEIGHT_VAR, `${Math.ceil(el.getBoundingClientRect().height)}px`);
    publish();
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(publish) : null;
    observer?.observe(el);
    window.addEventListener('resize', publish);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', publish);
      root.style.setProperty(COOKIE_BANNER_HEIGHT_VAR, '0px');
    };
  }, [bannerVisible]);

  if (hiddenRoute) return null;

  const decide = (next: { analytics: boolean; thirdParty: boolean }) => {
    setConsent(next);
    setDialogOpen(false);
  };
  const all = { analytics: true, thirdParty: true };
  const none = { analytics: false, thirdParty: false };

  const focusRing = 'focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-dark-bg-secondary';
  const btnBase = `inline-flex items-center justify-center px-5 py-2.5 min-h-[44px] rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${focusRing}`;
  // Aceptar y Rechazar comparten estilo: misma visibilidad para las dos opciones.
  const btnChoice = `${btnBase} bg-cv-blue text-white shadow-sm hover:bg-cv-blue-dark`;
  const btnQuiet = `${btnBase} text-gray-700 dark:text-dark-text-primary border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-dark-bg-primary`;

  // Interruptor accesible (role="switch") de cada categoría opcional.
  const optional = (key: 'analytics' | 'thirdParty', title: string, text: string) => (
    <li className={`rounded-xl border p-4 transition-colors ${choice[key] ? 'border-cv-blue/40 bg-cv-blue/5 dark:bg-cv-blue/10' : 'border-gray-200 dark:border-dark-border'}`}>
      <div className="flex items-center justify-between gap-4">
        <h3 id={`cookie-${key}`} className="font-semibold text-gray-900 dark:text-dark-text-primary">{title}</h3>
        <button
          type="button"
          role="switch"
          aria-checked={choice[key]}
          aria-labelledby={`cookie-${key}`}
          data-testid={`cookie-switch-${key}`}
          onClick={() => setChoice(c => ({ ...c, [key]: !c[key] }))}
          className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${focusRing} ${choice[key] ? 'bg-cv-blue' : 'bg-gray-300 dark:bg-dark-bg-tertiary'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${choice[key] ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-dark-text-secondary">{text}</p>
    </li>
  );

  return (
    <>
      {!consent && !dialogOpen && (
        <section
          ref={bannerRef}
          role="region"
          aria-label={t.title}
          data-testid="cookie-banner"
          className="ycp-consent-in fixed inset-x-0 bottom-0 z-[90] print:hidden px-3 pb-3 sm:px-4 sm:pb-4"
        >
          <div className="mx-auto max-w-5xl rounded-2xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-bg-secondary shadow-[0_12px_40px_-12px_rgba(15,23,42,0.35)] p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                <span className="hidden sm:flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-cv-blue/10 text-cv-blue dark:bg-cv-blue-light/15 dark:text-cv-blue-light">
                  <ShieldIcon className="h-6 w-6" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-dark-text-primary">{t.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-dark-text-secondary">
                    {t.text}{' '}
                    <Link to={policyPath} className="font-medium text-cv-blue dark:text-cv-blue-light underline underline-offset-2 hover:no-underline">
                      {t.policyLink}
                    </Link>
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-shrink-0 sm:justify-end">
                <button type="button" className={`${btnQuiet} col-span-2 order-last sm:order-none`} onClick={openDialog}>{t.settings}</button>
                <button type="button" className={btnChoice} onClick={() => decide(none)}>{t.reject}</button>
                <button type="button" className={btnChoice} onClick={() => decide(all)}>{t.accept}</button>
              </div>
            </div>
          </div>
        </section>
      )}

      {dialogOpen && (
        <div className="ycp-consent-fade fixed inset-0 z-[9000] flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm sm:p-4 print:hidden" onClick={closeDialog}>
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-dialog-title"
            data-testid="cookie-dialog"
            className="ycp-consent-in w-full sm:max-w-lg max-h-[92vh] sm:max-h-[85vh] flex flex-col rounded-t-2xl sm:rounded-2xl bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-cv-blue/10 text-cv-blue dark:bg-cv-blue-light/15 dark:text-cv-blue-light">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="cookie-dialog-title" className="text-lg font-semibold text-gray-900 dark:text-dark-text-primary">{t.dialogTitle}</h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-dark-text-secondary">{t.dialogIntro}</p>
              </div>
              <button type="button" onClick={closeDialog} aria-label={t.close} className={`-mr-2 -mt-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-dark-text-secondary dark:hover:text-dark-text-primary dark:hover:bg-dark-bg-tertiary ${focusRing}`}>
                <svg aria-hidden="true" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <ul className="mt-4 flex-1 overflow-y-auto space-y-3 px-5 sm:px-6 pb-1">
              <li className="rounded-xl border border-gray-200 dark:border-dark-border bg-gray-50 dark:bg-dark-bg-tertiary/60 p-4">
                <div className="flex items-center justify-between gap-4">
                  <h3 className="font-semibold text-gray-900 dark:text-dark-text-primary">{t.necessaryTitle}</h3>
                  <span className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/30 px-2.5 py-1 text-xs font-semibold text-green-800 dark:text-green-300">{t.alwaysOn}</span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-dark-text-secondary">{t.necessaryText}</p>
              </li>
              {optional('analytics', t.analyticsTitle, t.analyticsText)}
              {optional('thirdParty', t.thirdPartyTitle, t.thirdPartyText)}
            </ul>

            <div className="mt-4 border-t border-gray-100 dark:border-dark-border px-5 py-4 sm:px-6 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                <button type="button" className={btnChoice} onClick={() => decide(none)}>{t.reject}</button>
                <button type="button" className={btnChoice} onClick={() => decide(all)}>{t.accept}</button>
                <button type="button" className={`${btnQuiet} col-span-2 sm:col-span-1 sm:order-first`} onClick={() => decide(choice)}>{t.save}</button>
              </div>
              <p className="mt-3 text-center sm:text-left text-xs text-gray-500 dark:text-dark-text-tertiary">
                <Link to={policyPath} onClick={closeDialog} className="underline underline-offset-2 hover:text-cv-blue dark:hover:text-cv-blue-light">{t.policyLink}</Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
