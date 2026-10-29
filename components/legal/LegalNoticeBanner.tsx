import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { fmt } from '../../lib/bolsaText';
import {
  dismissNotice,
  fetchLegalNotices,
  legalPagePath,
  noticeKey,
  noticeTiposFor,
  readDismissedNotices,
  type LegalNotice,
  type LegalTipo,
} from '../../lib/legal';
import { useNoticeText } from './noticeText';

/**
 * Aviso de «nueva versión de las condiciones» con 15 días de antelación.
 *
 * Lee `legal_aviso_proximo()` (versiones futuras, <= 15 días, que el usuario aún no ha aceptado).
 * Es discreto, no bloquea y se descarta por sesión (sessionStorage). Si la RPC no existe todavía,
 * no hay sesión o falla la red, no se pinta nada y no pasa nada: `fetchLegalNotices` no lanza.
 */

/** Avisos del usuario (los del ámbito dado). Una sola consulta por usuario y montaje. */
/** `todos` no filtra por ambito (paginas legales); `null` no consulta nada. */
export function useLegalNotices(scope: 'candidato' | 'empleador' | 'todos' | null): LegalNotice[] {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [notices, setNotices] = useState<LegalNotice[]>([]);

  useEffect(() => {
    if (!userId || !scope) {
      setNotices([]);
      return;
    }
    let alive = true;
    void fetchLegalNotices().then((rows) => {
      if (alive) setNotices(rows);
    });
    return () => {
      alive = false;
    };
  }, [userId, scope]);

  if (!scope) return [];
  if (scope === 'todos') return notices;
  const tipos = noticeTiposFor(scope);
  return notices.filter((n) => tipos.includes(n.tipo));
}

/** Página donde se lee cada tipo de documento. */
export function noticePagePath(tipo: LegalTipo, lang: string): string {
  if (tipo === 'privacidad') return legalPagePath('privacy', lang);
  return legalPagePath('terms', lang, tipo === 'terminos_empleador' ? '?tipo=empleador' : '');
}

export function useNoticeDate(): (iso: string) => string {
  const { lang } = useLanguage();
  return (iso: string) =>
    new Intl.DateTimeFormat(lang === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
}

export function useDaysLeftText(): (days: number) => string {
  const tx = useNoticeText();
  return (days: number) => (days <= 0 ? tx.leftToday : days === 1 ? tx.leftOne : fmt(tx.leftMany, { n: days }));
}

interface BannerProps {
  scope: 'candidato' | 'empleador';
}

const LegalNoticeBanner: React.FC<BannerProps> = ({ scope }) => {
  const { lang } = useLanguage();
  const tx = useNoticeText();
  const dateFmt = useNoticeDate();
  const daysLeft = useDaysLeftText();
  const notices = useLegalNotices(scope);
  const [dismissed, setDismissed] = useState<Set<string>>(() => readDismissedNotices());

  const visible = notices.filter((n) => !dismissed.has(noticeKey(n)));
  if (visible.length === 0) return null;

  const close = (n: LegalNotice) => {
    dismissNotice(noticeKey(n));
    setDismissed((prev) => new Set(prev).add(noticeKey(n)));
  };

  return (
    <div
      role="region"
      aria-label={tx.bannerLabel}
      data-testid="legal-notice-banner"
      className="border-b border-amber-300 bg-amber-50 dark:border-amber-400/30 dark:bg-amber-500/10"
    >
      <ul className="mx-auto max-w-7xl divide-y divide-amber-200 px-4 sm:px-6 lg:px-8 dark:divide-amber-400/20">
        {visible.map((n) => (
          <li key={noticeKey(n)} className="flex items-start gap-3 py-3">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
            <div className="min-w-0 flex-1 text-sm leading-relaxed text-amber-950 dark:text-amber-100">
              <p className="font-semibold">{tx.bannerTitle}</p>
              <p className="mt-0.5 text-amber-900 dark:text-amber-200">
                {fmt(tx.line, { titulo: n.titulo, version: n.version, date: dateFmt(n.vigente_desde) })}{' '}
                <span className="tabular-nums">{daysLeft(n.dias_restantes)}</span> {tx.afterwards}
              </p>
              <Link
                to={noticePagePath(n.tipo, lang)}
                className="mt-1.5 inline-flex min-h-8 items-center rounded font-medium text-amber-950 underline underline-offset-2 hover:text-amber-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:text-amber-100 dark:hover:text-white dark:focus-visible:ring-offset-dark-bg-primary"
              >
                {tx.read}
              </Link>
            </div>
            <button
              type="button"
              onClick={() => close(n)}
              aria-label={fmt(tx.dismissFor, { titulo: n.titulo })}
              title={tx.dismiss}
              className="-mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-amber-900 transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cv-blue focus-visible:ring-offset-2 dark:text-amber-200 dark:hover:bg-amber-500/20 dark:focus-visible:ring-offset-dark-bg-primary"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LegalNoticeBanner;
