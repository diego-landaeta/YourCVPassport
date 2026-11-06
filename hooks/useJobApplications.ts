import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../supabase/client';
import { fetchMyApplications, type CandidateStatus, type MyApplicationRow } from '../lib/jobsApi';

// Estados de la candidatura tal como los ve el candidato en la vista my_job_applications
// (NOT_QUALIFIED nunca llega: la vista lo muestra como NEW).
export type JobApplicationStatus =
  | 'NEW'
  | 'REVIEWING'
  | 'SHORTLISTED'
  | 'INTERVIEW'
  | 'OFFER'
  | 'HIRED'
  | 'REJECTED'
  | 'WITHDRAWN';

// Active statuses that count towards "in progress" applications
export const ACTIVE_APPLICATION_STATUSES: JobApplicationStatus[] = [
  'NEW',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEW',
  'OFFER'
];

export interface JobApplication {
  id: string;
  created_at: string;
  updated_at: string;
  job_posting_id: string;
  profile_id: string;
  status: JobApplicationStatus;
  /** Estado en lenguaje del candidato: SENT, VIEWED, IN_PROGRESS, NOT_SELECTED, SELECTED, WITHDRAWN. */
  candidate_status: CandidateStatus;
  cover_letter: string | null;
  resume_url: string | null;
  answers: unknown;
  viewed_by_company: boolean;
  viewed_at: string | null;
  match_score: number | null;
  job_status: string | null;
  job_posting?: {
    id: string;
    title: string;
    slug: string;
    company_id: string;
    company?: {
      id: string;
      company_name: string;
      logo_url: string | null;
    };
  };
}

interface UseJobApplicationsOptions {
  /** Se conserva por compatibilidad: la vista siempre trae oferta y empresa. */
  includeJobDetails?: boolean;
  statusFilter?: JobApplicationStatus[];
}

const POLL_MS = 60_000;

function toApplication(r: MyApplicationRow): JobApplication {
  return {
    id: r.id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    job_posting_id: r.job_posting_id,
    profile_id: r.profile_id,
    status: r.status as JobApplicationStatus,
    candidate_status: r.candidate_status,
    cover_letter: r.cover_letter,
    resume_url: r.resume_url,
    answers: r.answers,
    viewed_by_company: !!r.viewed_by_company,
    viewed_at: r.viewed_at,
    match_score: r.match_score,
    job_status: r.job_status,
    job_posting: {
      id: r.job_posting_id,
      title: r.job_title || '',
      slug: r.job_slug || '',
      company_id: r.company_id,
      company: { id: r.company_id, company_name: r.company_name || '', logo_url: r.company_logo_url },
    },
  };
}

/**
 * Candidaturas del usuario. Lee la VISTA `my_job_applications` (sin notas internas ni
 * valoracion), no la tabla: el candidato ya no tiene SELECT sobre job_applications.
 *
 * Actualizacion en vivo:
 *  - suscripcion realtime a job_applications (solo llega si la base da SELECT al candidato;
 *    las vistas no emiten eventos),
 *  - refresco cada minuto y al volver a la pestana, que es lo que de verdad funciona hoy.
 */
export const useJobApplications = (
  profileId: string | undefined | null,
  options: UseJobApplicationsOptions = {}
) => {
  const { statusFilter } = options;

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCount, setActiveCount] = useState(0);
  const requestId = useRef(0);
  const filterKey = JSON.stringify(statusFilter ?? null);

  const loadApplications = useCallback(async (silent = false) => {
    if (!profileId) {
      setApplications([]);
      setActiveCount(0);
      setLoading(false);
      return;
    }
    const id = ++requestId.current;
    try {
      if (!silent) setLoading(true);
      setError(null);
      const rows = await fetchMyApplications();
      if (id !== requestId.current) return;
      const all = rows.map(toApplication);
      const filter = JSON.parse(filterKey) as JobApplicationStatus[] | null;
      const apps = filter && filter.length > 0 ? all.filter((a) => filter.includes(a.status)) : all;
      setApplications(apps);
      setActiveCount(all.filter((a) => ACTIVE_APPLICATION_STATUSES.includes(a.status)).length);
    } catch (err) {
      if (id !== requestId.current) return;
      console.error('Error loading job applications:', err);
      setError((err as { message?: string })?.message || 'Failed to load applications');
      if (!silent) {
        setApplications([]);
        setActiveCount(0);
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, [profileId, filterKey]);

  // Initial load
  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  // Realtime (si la base lo permite) + refresco periodico y al volver a la pestana
  useEffect(() => {
    if (!profileId) return;

    const channel = supabase
      .channel(`job-applications-${profileId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'job_applications', filter: `profile_id=eq.${profileId}` },
        () => { void loadApplications(true); }
      )
      .subscribe();

    const refresh = () => { if (document.visibilityState === 'visible') void loadApplications(true); };
    const timer = window.setInterval(refresh, POLL_MS);
    document.addEventListener('visibilitychange', refresh);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
      channel.unsubscribe();
    };
  }, [profileId, loadApplications]);

  return {
    applications,
    loading,
    error,
    activeCount,
    refetch: loadApplications
  };
};
