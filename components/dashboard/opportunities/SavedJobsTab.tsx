import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../supabase/client';
import { BookmarkIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useTranslations } from '../../../hooks/useTranslations';
import toast from 'react-hot-toast';
import CompanyMark from '../../jobs/ui/CompanyMark';
import {
  BTN_GHOST, BTN_SECONDARY, FOCUS, LIFT, PanelEmpty, PanelError, PanelSkeleton, SEARCH_FROM, SURFACE, SearchBox,
  TEXT_META, TEXT_STRONG, norm, notifyError, useReveal,
} from '../../jobs/PanelBits';
import { usePanelText } from '../../jobs/textosPanel';
import { fmt } from '../../../lib/bolsaText';
import { formatJobSalary, jobHref, jobsRootPath, timeAgo } from '../../../lib/jobsFormat';
import { contractLabel } from '../../../lib/jobsCatalog';

interface SavedJob {
  saved_id: string;
  saved_at: string;
  notes: string | null;
  job_id: string;
  job_title: string;
  job_slug: string;
  company_name: string;
  company_logo_url: string | null;
  location_city: string | null;
  location_country: string | null;
  is_remote: boolean;
  employment_type: string;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
}

interface SavedJobsTabProps {
  profileId: string;
  /** Avisa del numero de ofertas guardadas (para el contador de la pestana). */
  onCount?: (n: number) => void;
}

const SavedJobsTab: React.FC<SavedJobsTabProps> = ({ profileId, onCount }) => {
  const { lang } = useLanguage();
  const t = useTranslations();
  const tx = usePanelText();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');

  useEffect(() => {
    void loadSavedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  useEffect(() => {
    if (state === 'ready') onCount?.(savedJobs.length);
  }, [state, savedJobs.length, onCount]);

  const loadSavedJobs = async () => {
    try {
      setState('loading');
      const { data, error } = await supabase.rpc('get_saved_jobs', {
        p_profile_id: profileId,
        p_limit: 100,
        p_offset: 0
      });

      if (error) throw error;
      setSavedJobs(data || []);
      setState('ready');
    } catch (error: unknown) {
      console.error('Error loading saved jobs:', error);
      setState('error');
    }
  };

  const unsaveJob = async (savedId: string, jobTitle: string) => {
    try {
      const { error } = await supabase
        .from('saved_job_postings')
        .delete()
        .eq('id', savedId);

      if (error) throw error;

      setSavedJobs(prev => prev.filter(job => job.saved_id !== savedId));
      toast.success(
        t.dashboard.opportunities.jobRemovedFromSaved(jobTitle)
      );
    } catch (error: unknown) {
      console.error('Error unsaving job:', error);
      notifyError(t.dashboard.opportunities.errorRemovingSavedJob, tx.closeNotice);
    }
  };

  const visible = useMemo(() => {
    const q = norm(query.trim());
    return q ? savedJobs.filter((j) => norm(`${j.job_title} ${j.company_name} ${j.location_city || ''}`).includes(q)) : savedJobs;
  }, [savedJobs, query]);

  const listRef = useReveal<HTMLUListElement>(state === 'ready' && savedJobs.length > 0);

  if (state === 'loading') return <PanelSkeleton rows={3} label={t.dashboard.opportunities.loadingSavedJobs} />;
  if (state === 'error') {
    return <PanelError message={t.dashboard.opportunities.errorLoadingSavedJobs} retryLabel={tx.retry} onRetry={() => void loadSavedJobs()} />;
  }

  if (savedJobs.length === 0) {
    return (
      <PanelEmpty
        icon={BookmarkIcon}
        title={t.dashboard.opportunities.noSavedJobs}
        text={t.dashboard.opportunities.noSavedJobsDescription}
        action={{ label: t.dashboard.opportunities.exploreJobs, onClick: () => navigate(jobsRootPath(lang)) }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={`text-[15px] tabular-nums ${TEXT_META}`}>
          {savedJobs.length === 1 ? tx.savedCountOne : fmt(tx.savedCountMany, { n: savedJobs.length })}
        </p>
        {savedJobs.length >= SEARCH_FROM && (
          <SearchBox className="sm:w-72" value={query} onChange={setQuery} label={tx.searchLabel} placeholder={tx.searchPlaceholder} clearLabel={tx.searchClear} />
        )}
      </div>

      {visible.length === 0 ? (
        <PanelEmpty icon={BookmarkIcon} title={tx.searchEmpty} action={{ label: tx.searchClear, onClick: () => setQuery('') }} />
      ) : (
        <ul ref={listRef} className="space-y-3">
          {visible.map((job) => {
            const salary = formatJobSalary(
              { show_salary: true, salary_min: job.salary_min, salary_max: job.salary_max, salary_currency: job.salary_currency },
              lang
            );
            const place = job.is_remote ? t.dashboard.opportunities.remote : [job.location_city, job.location_country].filter(Boolean).join(', ');
            const contract = job.employment_type ? contractLabel(job.employment_type, lang) || '' : '';
            const meta = [contract, place, tx.savedAgo.replace('{when}', timeAgo(job.saved_at, lang))].filter(Boolean).join(' · ');
            const path = jobHref({ slug: job.job_slug, location_country: job.location_country }, lang);
            return (
              <li key={job.saved_id}>
                <article className={`${SURFACE} ${LIFT} p-5`} aria-labelledby={`sv-${job.saved_id}`}>
                  <div className="flex items-start gap-4">
                    <CompanyMark name={job.company_name} logoUrl={job.company_logo_url} size="card" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <div className="min-w-0">
                          <h3 id={`sv-${job.saved_id}`} className={`text-lg font-semibold leading-snug break-words ${TEXT_STRONG}`}>
                            <a
                              href={path}
                              onClick={(e) => { if (!e.metaKey && !e.ctrlKey && !e.shiftKey) { e.preventDefault(); navigate(path); } }}
                              className={`rounded hover:underline hover:decoration-slate-400 hover:underline-offset-4 ${FOCUS}`}
                            >
                              {job.job_title}
                            </a>
                          </h3>
                          <p className={`mt-0.5 text-[15px] ${TEXT_META}`}>{job.company_name}</p>
                        </div>
                        {salary && <p className={`text-base font-bold tabular-nums ${TEXT_STRONG}`}>{salary}</p>}
                      </div>
                      {meta && <p className={`mt-2 text-sm ${TEXT_META}`}>{meta}</p>}
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => navigate(path)} className={BTN_SECONDARY}>{t.dashboard.opportunities.viewDetails}</button>
                        <button
                          type="button"
                          onClick={() => void unsaveJob(job.saved_id, job.job_title)}
                          className={`${BTN_GHOST} hover:!text-red-700 dark:hover:!text-red-300`}
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                          {t.dashboard.opportunities.remove}
                        </button>
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

export default SavedJobsTab;
