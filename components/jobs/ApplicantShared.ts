import type { ProfileSnapshot } from '../../lib/jobsApi';
import type { Tone } from './PanelBits';

/** Fila de job_applications tal como la ve la empresa (COMPANY_APPLICATION_COLUMNS). */
export interface CompanyApp {
  id: string;
  created_at: string;
  updated_at: string;
  job_posting_id: string;
  profile_id: string;
  company_id: string;
  status: string;
  cover_letter: string | null;
  answers: Record<string, unknown> | null;
  viewed_by_company: boolean | null;
  viewed_at: string | null;
  internal_notes: string | null;
  rating: number | null;
  match_score: number | null;
  perfil_copia: ProfileSnapshot | null;
  consent_at: string | null;
  consent_doc_version: string | null;
  descartada_auto: boolean | null;
  metadata: { failed_questions?: string[] } | null;
}

export interface JobLite { id: string; title: string; location_city: string | null }

/** Punto de color del estado (el texto siempre lo acompana). */
export const STATUS_TONE: Record<string, Tone> = {
  NEW: 'info',
  REVIEWING: 'info',
  SHORTLISTED: 'active',
  INTERVIEW: 'active',
  OFFER: 'active',
  HIRED: 'success',
  REJECTED: 'danger',
  WITHDRAWN: 'neutral',
  NOT_QUALIFIED: 'warn',
};

export function totalYears(exps: Array<Record<string, any>> | undefined): number {
  let months = 0;
  for (const e of exps || []) {
    const start = Date.parse(e.start_date);
    const end = e.is_current || !e.end_date ? Date.now() : Date.parse(e.end_date);
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) months += (end - start) / (30.44 * 86400000);
  }
  return Math.floor(months / 12);
}

export function currentRole(exps: Array<Record<string, any>> | undefined): string {
  const list = exps || [];
  return (list.find((e) => e.is_current) || list[0])?.position || '';
}

/** Color de la cifra de afinidad: solo lo alto se destaca; lo bajo se atenua, sin rojo (no es un error). */
export const matchCls = (score: number) =>
  score >= 80
    ? 'text-green-700 dark:text-green-400'
    : score >= 60
      ? 'text-slate-900 dark:text-dark-text-primary'
      : 'text-slate-600 dark:text-dark-text-secondary';
