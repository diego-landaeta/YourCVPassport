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

/** Pregunta imprescindible tal como la devuelve `get_job_questions_for_company`. */
export interface KeyQuestion {
  id: string;
  question_text: string;
  is_knockout: boolean | null;
  order_index: number | null;
}

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Respuesta en texto corto (SÍ/NO traducidos, listas separadas por coma). */
export function shortAnswer(v: unknown, lang: 'es' | 'en'): string {
  if (v == null) return '';
  const raw = Array.isArray(v) ? v.join(', ') : String(v);
  const s = raw === 'YES' ? (lang === 'es' ? 'Sí' : 'Yes') : raw === 'NO' ? 'No' : raw;
  return clip(s.replace(/\s+/g, ' ').trim(), 28);
}

/**
 * Las dos primeras respuestas clave de la candidatura: las de las preguntas imprescindibles
 * (en el orden de la oferta), resumidas. Si la oferta no tiene ninguna, no hay nada que resumir.
 */
export function keyAnswers(
  questions: readonly KeyQuestion[] | undefined,
  answers: Record<string, unknown> | null,
  lang: 'es' | 'en',
  max = 2,
): Array<{ id: string; question: string; answer: string }> {
  return (questions || [])
    .filter((q) => q.is_knockout)
    .slice()
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .slice(0, max)
    .map((q) => ({ id: q.id, question: clip(q.question_text.replace(/\s+/g, ' ').trim().replace(/[¿?]/g, ''), 34), answer: shortAnswer(answers?.[q.id], lang) || '—' }));
}

/**
 * «Cumple» / «No cumple» respecto a las preguntas imprescindibles. null = la oferta no tiene
 * ninguna (no hay nada que comprobar). «No cumple» si el sistema la descartó o la empresa la
 * movió a «No cumple requisitos».
 */
export function meetsRequirements(
  app: Pick<CompanyApp, 'status' | 'descartada_auto' | 'metadata'>,
  questions: readonly KeyQuestion[] | undefined,
): boolean | null {
  const failed = (app.metadata?.failed_questions || []).length > 0;
  if (app.descartada_auto || failed || app.status === 'NOT_QUALIFIED') return false;
  return (questions || []).some((q) => q.is_knockout) ? true : null;
}
