import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BookmarkIcon, CheckCircleIcon, SparklesIcon } from '@heroicons/react/24/outline';
import CompanyMark from '../../jobs/ui/CompanyMark';
import {
  BTN_PRIMARY, BTN_SECONDARY, FOCUS, LIFT, MatchMeter, PanelEmpty, PanelError, PanelSkeleton, SEARCH_FROM, SURFACE,
  SearchBox, TEXT_META, TEXT_STRONG, norm, notifyError, useReveal,
} from '../../jobs/PanelBits';
import { useAuth } from '../../../contexts/AuthContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { pkey, usePanelText, type PanelText } from '../../jobs/textosPanel';
import { fmt } from '../../../lib/bolsaText';
import { errorCode, fetchRecommendedJobs, fetchSavedJobIds, toggleSavedJob, type RecommendedJob } from '../../../lib/jobsApi';
import { workModeLabel } from '../../../lib/jobsCatalog';
import { daysUntil, formatDate, jobHref, jobsRootPath, timeAgo } from '../../../lib/jobsFormat';

interface RecommendedJobsTabProps {
  profileId: string;
  onSwitchToAllJobs?: () => void;
  /** Avisa del numero de recomendaciones (para el contador de la pestana). */
  onCount?: (n: number) => void;
}

/** Puntos maximos de cada parte de la afinidad (get_recommended_jobs: 40/20/15/15/10). */
const FACTOR_MAX: Record<string, number> = { skills: 40, experience: 20, education: 15, languages: 15, location: 10 };

/**
 * «Por que encaja» en una linea, a partir de match_breakdown (puntos por parte).
 * Solo afirma lo que se ve claro: una parte "encaja" con >= 75 % de sus puntos y "a mejorar"
 * con < 35 %. El resto no se menciona (los valores por defecto de lo que la oferta no pide no cuentan).
 */
function whyItFits(
  breakdown: Record<string, unknown> | null | undefined,
  tx: PanelText,
  lang: 'es' | 'en'
): { fit: string | null; weak: string | null } {
  if (!breakdown) return { fit: null, weak: null };
  const parts = Object.keys(FACTOR_MAX)
    .map((k) => ({ k, ratio: typeof breakdown[k] === 'number' ? (breakdown[k] as number) / FACTOR_MAX[k] : null }))
    .filter((p): p is { k: string; ratio: number } => p.ratio != null);
  if (parts.length === 0) return { fit: null, weak: null };
  const list = (items: string[]) => new Intl.ListFormat(lang, { style: 'long', type: 'conjunction' }).format(items);
  const label = (k: string) => pkey(tx, `mf_${k}`, k);
  const strong = parts.filter((p) => p.ratio >= 0.75).sort((a, b) => b.ratio - a.ratio).slice(0, 3);
  const weak = parts.filter((p) => p.ratio < 0.35).sort((a, b) => a.ratio - b.ratio).slice(0, 2);
  const best = parts.filter((p) => p.ratio >= 0.5).sort((a, b) => b.ratio - a.ratio).slice(0, 2);
  return {
    fit: strong.length
      ? fmt(tx.matchWhy, { list: list(strong.map((p) => label(p.k))) })
      : best.length ? fmt(tx.matchPartial, { list: list(best.map((p) => label(p.k))) }) : null,
    weak: weak.length ? fmt(tx.matchWeak, { list: list(weak.map((p) => label(p.k))) }) : null,
  };
}

/**
 * Ofertas recomendadas: las ordena el servidor (RPC get_recommended_jobs) por afinidad con el
 * perfil: habilidades, experiencia, formacion, idiomas y ubicacion.
 * El salario no se pinta: la RPC lo devuelve aunque la oferta no lo muestre.
 */
const RecommendedJobsTab: React.FC<RecommendedJobsTabProps> = ({ profileId, onSwitchToAllJobs, onCount }) => {
  const tx = usePanelText();
  const { lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [state, setState] = useState<'loading' | 'ready' | 'error' | 'noprofile'>('loading');
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setState('loading');
    try {
      const [recs, saved] = await Promise.all([
        fetchRecommendedJobs(20),
        fetchSavedJobIds(user?.id || profileId).catch(() => new Set<string>()),
      ]);
      setJobs(recs);
      setSavedIds(saved);
      setState('ready');
      onCount?.(recs.length);
    } catch (e) {
      console.error('Error loading recommended jobs', e);
      setState(errorCode(e) === 'PROFILE_NOT_FOUND' ? 'noprofile' : 'error');
    }
    // onCount es estable en quien la pasa; no debe relanzar la carga
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId, user?.id]);

  useEffect(() => { void load(); }, [load]);

  const toggleSave = async (job: RecommendedJob) => {
    const wasSaved = savedIds.has(job.job_posting_id);
    try {
      await toggleSavedJob(job.job_posting_id);
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (wasSaved) next.delete(job.job_posting_id); else next.add(job.job_posting_id);
        return next;
      });
      toast.success(wasSaved ? tx.saveRemoved : tx.saveDone);
    } catch {
      notifyError(tx.saveError, tx.closeNotice);
    }
  };

  const visible = useMemo(() => {
    const q = norm(query.trim());
    return q ? jobs.filter((j) => norm(`${j.title} ${j.company_name} ${j.location_city || ''}`).includes(q)) : jobs;
  }, [jobs, query]);

  const listRef = useReveal<HTMLUListElement>(state === 'ready' && jobs.length > 0);
  const goAll = () => (onSwitchToAllJobs ? onSwitchToAllJobs() : navigate(jobsRootPath(lang)));

  if (state === 'loading') return <PanelSkeleton rows={3} label={tx.recLoading} />;

  if (state === 'error' || state === 'noprofile') {
    return <PanelError message={state === 'noprofile' ? tx.recProfileMissing : tx.recError} retryLabel={state === 'error' ? tx.retry : undefined} onRetry={state === 'error' ? () => void load() : undefined} />;
  }

  if (jobs.length === 0) {
    return <PanelEmpty icon={SparklesIcon} title={tx.recEmptyTitle} text={tx.recEmptyText} action={{ label: tx.exploreJobs, onClick: goAll }} />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h2 className="sr-only">{tx.recTitle}</h2>
          <p className={`max-w-prose text-[15px] leading-relaxed ${TEXT_META}`}>{tx.recText}</p>
        </div>
        {jobs.length >= SEARCH_FROM && (
          <SearchBox className="sm:w-72 sm:shrink-0" value={query} onChange={setQuery} label={tx.searchLabel} placeholder={tx.searchPlaceholder} clearLabel={tx.searchClear} />
        )}
      </div>

      {visible.length === 0 ? (
        <PanelEmpty icon={SparklesIcon} title={tx.searchEmpty} action={{ label: tx.searchClear, onClick: () => setQuery('') }} />
      ) : (
        <ul ref={listRef} className="space-y-3">
          {visible.map((job) => {
            const saved = savedIds.has(job.job_posting_id);
            const place = job.work_mode === 'REMOTE' || job.is_remote
              ? tx.remote
              : [job.location_city, job.location_country].filter(Boolean).join(', ');
            const mode = job.work_mode && job.work_mode !== 'REMOTE' ? workModeLabel(job.work_mode, lang) : '';
            const meta = [mode, place, timeAgo(job.published_at, lang)].filter(Boolean).join(' · ');
            const left = daysUntil(job.application_deadline);
            const soon = left != null && left >= 0 && left <= 7;
            const why = whyItFits(job.match_breakdown, tx, lang);
            const path = jobHref(job, lang);
            return (
              <li key={job.job_posting_id}>
                <article className={`${SURFACE} ${LIFT} p-5`} aria-labelledby={`rec-${job.job_posting_id}`}>
                  <div className="flex items-start gap-4">
                    <CompanyMark name={job.company_name} logoUrl={job.company_logo_url} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 id={`rec-${job.job_posting_id}`} className={`text-lg font-semibold leading-snug break-words ${TEXT_STRONG}`}>
                            <a
                              href={path}
                              onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); navigate(path); } }}
                              className={`rounded hover:underline hover:decoration-slate-400 hover:underline-offset-4 ${FOCUS}`}
                            >
                              {job.title}
                            </a>
                          </h3>
                          <p className={`mt-0.5 text-[15px] ${TEXT_META}`}>{job.company_name}</p>
                        </div>
                        <MatchMeter score={job.match_score || 0} label={fmt(tx.matchMeterLabel, { n: job.match_score || 0 })} word={tx.matchWord} />
                      </div>

                      {meta && <p className={`mt-2 text-sm ${TEXT_META}`}>{meta}</p>}

                      {(why.fit || why.weak) && (
                        <p className={`mt-2 flex items-start gap-1.5 text-sm ${TEXT_STRONG}`}>
                          {why.fit && <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden="true" />}
                          <span>
                            {why.fit}
                            {why.fit && why.weak && <span className={TEXT_META}> · </span>}
                            {why.weak && <span className={TEXT_META}>{why.weak}</span>}
                          </span>
                        </p>
                      )}

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => navigate(path)} className={job.already_applied ? BTN_SECONDARY : BTN_PRIMARY}>{tx.viewJob}</button>
                        <button type="button" onClick={() => void toggleSave(job)} aria-pressed={saved} className={BTN_SECONDARY}>
                          <BookmarkIcon className={`h-4 w-4 ${saved ? 'fill-current text-cv-blue dark:text-cv-blue-light' : ''}`} aria-hidden="true" />
                          {saved ? tx.saved : tx.save}
                        </button>
                        <p className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          {job.already_applied && (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-green-700 dark:text-green-400">
                              <CheckCircleIcon className="h-4 w-4" aria-hidden="true" />{tx.alreadyApplied}
                            </span>
                          )}
                          {job.application_deadline && (
                            <span className={soon ? 'font-medium text-amber-700 dark:text-amber-400' : TEXT_META}>
                              {fmt(tx.closesOn, { date: formatDate(job.application_deadline, lang) })}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default RecommendedJobsTab;
