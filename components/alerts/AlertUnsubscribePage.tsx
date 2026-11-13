import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { BellSlashIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import PageSEO from '../shared/PageSEO';
import { useLanguage } from '../../contexts/LanguageContext';
import { unsubscribeJobAlerts } from '../../lib/jobsApi';
import { jobsRootPath } from '../../lib/jobsFormat';
import { BTN_PRIMARY, BTN_SECONDARY, SURFACE, TEXT_META, TEXT_STRONG } from '../jobs/PanelBits';
import { useAlertUnsubText } from './textos';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Phase = 'working' | 'done' | 'notfound' | 'invalid' | 'error';

/**
 * Baja de las alertas de ofertas desde el enlace del correo (`/alertas/baja?token=…` en español,
 * `/alerts/unsubscribe?token=…` en inglés). Es pública (no pide sesión): el token identifica la
 * alerta y la RPC `unsubscribe_job_alerts` la desactiva. No se indexa ni se incluye en el sitemap.
 */
const AlertUnsubscribePage: React.FC = () => {
  const tx = useAlertUnsubText();
  const { lang, setLang } = useLanguage();
  const location = useLocation();
  const [params] = useSearchParams();
  const token = (params.get('token') || '').trim();
  const [phase, setPhase] = useState<Phase>(UUID_RE.test(token) ? 'working' : 'invalid');

  // /alertas/baja fija el español y /alerts/unsubscribe el inglés (rutas fuera de pathMappings).
  const pathLang = location.pathname.startsWith('/alerts') ? 'en' : 'es';
  useEffect(() => {
    if (lang !== pathLang) setLang(pathLang);
    // Solo al entrar: el selector de idioma puede cambiarlo después.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathLang]);

  // La baja se pide UNA vez por token (aunque React monte el efecto dos veces en desarrollo): una segunda
  // llamada devolvería «ya estaba de baja» y pisaría el resultado bueno de la primera.
  const requestedFor = useRef<string | null>(null);
  const run = useCallback(async () => {
    if (!UUID_RE.test(token)) {
      setPhase('invalid');
      return;
    }
    requestedFor.current = token;
    setPhase('working');
    try {
      const done = await unsubscribeJobAlerts(token);
      if (requestedFor.current === token) setPhase(done ? 'done' : 'notfound');
    } catch (e) {
      console.warn('[alertas] baja', e);
      if (requestedFor.current === token) setPhase('error');
    }
  }, [token]);

  useEffect(() => {
    if (requestedFor.current === token) return;
    void run();
  }, [run, token]);

  const Icon = phase === 'done' ? CheckCircleIcon : phase === 'working' ? BellSlashIcon : phase === 'notfound' ? BellSlashIcon : ExclamationTriangleIcon;
  const tone = phase === 'done' ? 'text-green-700 dark:text-green-400' : phase === 'error' || phase === 'invalid' ? 'text-amber-700 dark:text-amber-400' : 'text-slate-500 dark:text-dark-text-secondary';
  const title = phase === 'done' ? tx.doneTitle : phase === 'notfound' ? tx.notFoundTitle : phase === 'invalid' ? tx.invalidTitle : phase === 'error' ? tx.errorTitle : tx.working;
  const text = phase === 'done' ? tx.doneText : phase === 'notfound' ? tx.notFoundText : phase === 'invalid' ? tx.invalidText : phase === 'error' ? tx.errorText : '';

  return (
    <div className="min-h-[60vh] bg-slate-50 px-4 py-16 dark:bg-dark-bg-primary sm:px-6">
      <PageSEO title={tx.seoTitle} description={tx.seoDescription} lang={lang} noindex alternates={null} />
      <div className={`${SURFACE} mx-auto max-w-xl p-8 text-center sm:p-10`} data-testid="unsub-card" data-phase={phase}>
        <Icon className={`mx-auto h-12 w-12 ${tone}`} aria-hidden="true" />
        <h1 className={`mt-4 text-balance text-2xl font-extrabold tracking-tight ${TEXT_STRONG}`} role={phase === 'working' ? 'status' : undefined}>
          {title}
        </h1>
        {text && <p className={`mx-auto mt-3 max-w-[48ch] text-[15px] leading-relaxed ${TEXT_META}`} role={phase === 'error' ? 'alert' : undefined}>{text}</p>}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {phase === 'error' && (
            <button type="button" onClick={() => void run()} className={BTN_PRIMARY}>{tx.retry}</button>
          )}
          {phase !== 'working' && phase !== 'error' && (
            <Link to="/dashboard" className={BTN_PRIMARY}>{tx.manage}</Link>
          )}
          {phase !== 'working' && (
            <Link to={jobsRootPath(lang)} className={BTN_SECONDARY}>{tx.seeJobs}</Link>
          )}
          {phase !== 'working' && (
            <Link to="/" className={BTN_SECONDARY}>{tx.home}</Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertUnsubscribePage;
