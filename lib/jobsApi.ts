/**
 * Acceso a datos de la bolsa de empleo (publico, candidato y empresa).
 * Contrato: supabase/migrations/20261030_ofertas_fase2.sql y 20261031_candidaturas_fase3.sql.
 * Sin select('*') sobre job_postings ni job_posting_questions (columnas privadas).
 */
import { supabase } from '../supabase/client';
import { FALLBACK_COUNTRIES, type JobCountry } from './jobsCatalog';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface PublicJobRow {
  id: string;
  title: string;
  slug: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  country_code: string | null;
  location_city: string | null;
  work_mode: string | null;
  is_remote: boolean | null;
  contract_types: string[] | null;
  schedule: string | null;
  category: string | null;
  category2: string | null;
  vacancies: number | null;
  experience_years: number | null;
  summary: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  salary_mode: string | null;
  show_salary: boolean;
  published_at: string;
  application_deadline: string | null;
  already_applied: boolean;
  total_count: number;
}

export interface JobSearchParams {
  country?: string | null;
  category?: string | null;
  workMode?: string | null;
  contract?: string | null;
  schedule?: string | null;
  minSalary?: number | null;
  postedWithinDays?: number | null;
  /** Ofertas que piden como mucho X años de experiencia (o ninguna). */
  maxExperienceYears?: number | null;
  search?: string | null;
  city?: string | null;
  limit?: number;
  offset?: number;
}

export interface JobLanguageReq {
  language?: string; name?: string; level?: string;
}

export interface JobDetail {
  id: string;
  title: string;
  slug: string;
  company_id: string;
  department: string | null;
  employment_type: string | null;
  work_mode: string | null;
  experience_level: string | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  is_remote: boolean | null;
  description: string | null;
  responsibilities: string[] | null;
  requirements: string[] | null;
  nice_to_have: string[] | null;
  benefits: string[] | null;
  required_skills: string[] | null;
  optional_skills: string[] | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: string | null;
  show_salary: boolean;
  application_deadline: string | null;
  application_email: string | null;
  application_url: string | null;
  application_instructions: string | null;
  published_at: string | null;
  company_name: string;
  company_logo_url: string | null;
  company_website: string | null;
  company_description: string | null;
  status: string;
  accepting_applications: boolean;
  closed_at: string | null;
  country_code: string | null;
  category: string | null;
  category2: string | null;
  vacancies: number | null;
  contract_types: string[] | null;
  schedule: string | null;
  duration: string | null;
  start_date: string | null;
  start_immediate: boolean | null;
  salary_mode: string | null;
  education_min: string | null;
  experience_years: number | null;
  languages: Array<JobLanguageReq | string> | null;
  cover_letter_mode: string | null;
  allowed_countries: string[] | null;
}

export interface JobQuestion {
  id: string;
  job_posting_id: string;
  question_text: string;
  question_type: string;
  options: unknown;
  is_required: boolean;
  order_index: number | null;
  is_knockout: boolean | null;
}

/** Columnas publicas de job_posting_questions (expected_answer es privada). */
export const JOB_QUESTION_COLUMNS =
  'id, job_posting_id, question_text, question_type, options, is_required, order_index, is_knockout';

export type CandidateStatus = 'SENT' | 'VIEWED' | 'IN_PROGRESS' | 'NOT_SELECTED' | 'SELECTED' | 'WITHDRAWN';

export interface MyApplicationRow {
  id: string;
  created_at: string;
  updated_at: string;
  job_posting_id: string;
  profile_id: string;
  company_id: string;
  status: string;
  candidate_status: CandidateStatus;
  cover_letter: string | null;
  resume_url: string | null;
  answers: unknown;
  viewed_by_company: boolean | null;
  viewed_at: string | null;
  match_score: number | null;
  consent_at: string | null;
  consent_doc_version: string | null;
  job_title: string | null;
  job_slug: string | null;
  job_status: string | null;
  company_name: string | null;
  company_logo_url: string | null;
}

export interface ProfileSnapshot {
  version?: number;
  captured_at?: string;
  profile?: Record<string, any>;
  contact?: { email?: string | null; phone?: string | null };
  experiences?: Array<Record<string, any>>;
  education?: Array<Record<string, any>>;
  skills?: Array<Record<string, any>>;
  languages?: Array<Record<string, any>>;
}

export interface ApplicationPreview {
  profile: ProfileSnapshot;
  gaps: string[];
}

export interface RecommendedJob {
  job_posting_id: string;
  title: string;
  slug: string;
  company_id: string;
  company_name: string;
  company_logo_url: string | null;
  location_city: string | null;
  location_country: string | null;
  is_remote: boolean | null;
  work_mode: string | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  published_at: string;
  application_deadline: string | null;
  match_score: number;
  match_breakdown: Record<string, any> | null;
  already_applied: boolean;
}

export interface ApplicationHistoryRow {
  from_status: string | null;
  to_status: string;
  changed_by_role: string;
  created_at: string;
  /** Solo para la empresa/admin: p. ej. «message:rejected» cuando se envio un correo con plantilla. */
  note?: string | null;
}

export interface JobAlertSubscription {
  id?: string;
  profile_id: string;
  categories: string[];
  country: string | null;
  keywords: string[];
  frequency: 'DAILY' | 'WEEKLY';
  active: boolean;
  last_sent_at?: string | null;
}

// ---------------------------------------------------------------------------
// Errores con codigo al inicio del mensaje («ALREADY_APPLIED: ...»)
// ---------------------------------------------------------------------------

export function errorCode(error: unknown): string {
  const msg = String((error as { message?: string } | null)?.message ?? error ?? '');
  const m = msg.match(/^\s*([A-Z][A-Z0-9_]{2,})\b/);
  if (m) return m[1];
  // Textos antiguos de la RPC
  if (/already applied/i.test(msg)) return 'ALREADY_APPLIED';
  if (/job not available|job posting not found/i.test(msg)) return 'JOB_NOT_AVAILABLE';
  if (/not authenticated|jwt|auth/i.test(msg) && /required|expired|invalid/i.test(msg)) return 'AUTH_REQUIRED';
  const pg = (error as { code?: string } | null)?.code;
  if (pg === '42501') return 'UNAUTHORIZED';
  return 'UNKNOWN';
}

// ---------------------------------------------------------------------------
// Publico
// ---------------------------------------------------------------------------

export async function searchPublicJobs(p: JobSearchParams): Promise<{ rows: PublicJobRow[]; total: number }> {
  const { data, error } = await supabase.rpc('search_public_jobs_v2', {
    p_country: p.country || null,
    p_category: p.category || null,
    p_work_mode: p.workMode || null,
    p_contract: p.contract || null,
    p_schedule: p.schedule || null,
    p_min_salary: p.minSalary ?? null,
    p_posted_within_days: p.postedWithinDays ?? null,
    p_max_experience_years: p.maxExperienceYears ?? null,
    p_search: p.search?.trim() || null,
    p_city: p.city?.trim() || null,
    p_limit: p.limit ?? 20,
    p_offset: p.offset ?? 0,
  });
  if (error) throw error;
  const rows = (data || []) as PublicJobRow[];
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

/** null = la oferta no existe (404 real). Cualquier otro fallo lanza. */
export async function fetchJobDetail(slug: string): Promise<JobDetail | null> {
  const { data, error } = await supabase.rpc('get_job_posting_detail', { p_slug: slug });
  if (error) throw error;
  const row = (Array.isArray(data) ? data[0] : data) as JobDetail | undefined;
  if (!row) return null;
  // La RPC antigua (sin la migracion 20261030) no devuelve accepting_applications: se deduce del estado
  if (row.accepting_applications == null) {
    const open = !row.application_deadline || new Date(row.application_deadline).getTime() > Date.now();
    row.accepting_applications = row.status === 'PUBLISHED' && open;
  }
  return row;
}

export async function fetchJobQuestions(jobId: string): Promise<JobQuestion[]> {
  const { data, error } = await supabase
    .from('job_posting_questions')
    .select(JOB_QUESTION_COLUMNS)
    .eq('job_posting_id', jobId)
    .order('order_index');
  if (error) throw error;
  return (data || []) as JobQuestion[];
}

export async function loadCountries(): Promise<JobCountry[]> {
  try {
    const { data, error } = await supabase
      .from('countries')
      .select('code, name_es, name_en, currency')
      .eq('active', true)
      .order('name_es');
    if (error || !data || data.length === 0) return [...FALLBACK_COUNTRIES];
    return data as JobCountry[];
  } catch {
    return [...FALLBACK_COUNTRIES];
  }
}

export async function reportJob(jobId: string, userId: string, reason: string, details: string): Promise<void> {
  const { error } = await supabase.from('job_reports').insert({
    job_id: jobId,
    reporter_id: userId,
    reason,
    details: details.trim() || null,
  });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Candidato
// ---------------------------------------------------------------------------

export const MY_APPLICATION_COLUMNS =
  'id, created_at, updated_at, job_posting_id, profile_id, company_id, status, candidate_status, cover_letter, resume_url, answers, viewed_by_company, viewed_at, match_score, consent_at, consent_doc_version, job_title, job_slug, job_status, company_name, company_logo_url';

export async function fetchMyApplications(): Promise<MyApplicationRow[]> {
  const { data, error } = await supabase
    .from('my_job_applications')
    .select(MY_APPLICATION_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as MyApplicationRow[];
}

export async function previewApplicationProfile(): Promise<ApplicationPreview> {
  const { data, error } = await supabase.rpc('preview_application_profile');
  if (error) throw error;
  const d = (data || {}) as { profile?: ProfileSnapshot; gaps?: string[] };
  return { profile: d.profile || {}, gaps: Array.isArray(d.gaps) ? d.gaps : [] };
}

export interface ApplyPayload {
  jobId: string;
  coverLetter: string | null;
  answers: Record<string, string>;
  consentDocVersion: string | null;
}

export async function applyToJob(p: ApplyPayload): Promise<{ application_id: string; match_score: number; warnings: string[] }> {
  const { data, error } = await supabase.rpc('apply_to_job', {
    p_job_posting_id: p.jobId,
    p_cover_letter: p.coverLetter,
    p_answers: p.answers,
    p_consent: true,
    p_consent_doc_version: p.consentDocVersion,
  });
  if (error) throw error;
  const d = (data || {}) as { application_id?: string; match_score?: number; warnings?: string[] };
  return { application_id: d.application_id || '', match_score: d.match_score ?? 0, warnings: d.warnings || [] };
}

export interface LegalDoc {
  id: string;
  tipo: string;
  version: string;
  idioma: string;
  titulo: string;
  casillas_obligatorias: string[];
}

/** Version vigente de un documento legal (la RLS solo deja ver las vigentes). */
export async function fetchLegalDoc(tipo: string, idioma: string): Promise<LegalDoc | null> {
  const { data, error } = await supabase
    .from('documentos_legales')
    .select('id, tipo, version, idioma, titulo, casillas_obligatorias, vigente_desde')
    .eq('tipo', tipo)
    .eq('idioma', idioma)
    .order('vigente_desde', { ascending: false })
    .limit(1);
  if (error) throw error;
  return ((data || [])[0] as LegalDoc) || null;
}

export async function registerAcceptance(docIds: string[], casillas: Record<string, boolean>, jobId: string): Promise<void> {
  const { error } = await supabase.rpc('registrar_aceptacion', {
    p_documento_ids: docIds,
    p_casillas: casillas,
    p_contexto: 'inscripcion',
    p_oferta_id: jobId,
    p_company_id: null,
  });
  if (error) throw error;
}

export async function withdrawApplication(id: string): Promise<void> {
  const { error } = await supabase.rpc('withdraw_application', { p_id: id });
  if (error) throw error;
}

export async function fetchApplicationHistory(applicationId: string): Promise<ApplicationHistoryRow[]> {
  const { data, error } = await supabase.rpc('get_application_history', { p_application_id: applicationId });
  if (error) throw error;
  return (data || []) as ApplicationHistoryRow[];
}

export async function fetchRecommendedJobs(limit = 20): Promise<RecommendedJob[]> {
  const { data, error } = await supabase.rpc('get_recommended_jobs', { p_limit: limit });
  if (error) throw error;
  return (data || []) as RecommendedJob[];
}

export async function fetchSavedJobIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('saved_job_postings').select('job_posting_id').eq('profile_id', userId);
  return new Set((data || []).map((r: { job_posting_id: string }) => r.job_posting_id));
}

export async function toggleSavedJob(jobId: string): Promise<void> {
  const { error } = await supabase.rpc('toggle_job_save', { p_job_posting_id: jobId });
  if (error) throw error;
}

export async function fetchMyAlert(userId: string): Promise<JobAlertSubscription | null> {
  const { data, error } = await supabase
    .from('job_alert_subscriptions')
    .select('id, profile_id, categories, country, keywords, frequency, active, last_sent_at')
    .eq('profile_id', userId)
    .maybeSingle();
  if (error) throw error;
  return (data as JobAlertSubscription) || null;
}

export async function saveMyAlert(a: JobAlertSubscription): Promise<void> {
  const fields = {
    categories: a.categories,
    country: a.country || null,
    keywords: a.keywords,
    frequency: a.frequency,
    active: a.active,
  };
  // No se usa upsert: UPDATE no tiene privilegio sobre profile_id y PostgREST lo incluiria
  // en el DO UPDATE. Primero UPDATE (sin profile_id); si no habia fila, INSERT.
  const { data: updated, error: updErr } = await supabase
    .from('job_alert_subscriptions')
    .update(fields)
    .eq('profile_id', a.profile_id)
    .select('id');
  if (updErr) throw updErr;
  if (updated && updated.length > 0) return;
  const { error } = await supabase.from('job_alert_subscriptions').insert({ profile_id: a.profile_id, ...fields });
  if (error) throw error;
}

/**
 * Casilla opcional «alertas_novedades» del registro (F15): crea la alerta de ofertas del usuario
 * (sin filtros, semanal) si aun no tiene ninguna. Nunca pisa una alerta existente y NUNCA lanza:
 * si la tabla aun no existe (migracion 20261031 sin aplicar) o falla, simplemente no se crea.
 */
export async function ensureAlertSubscription(userId: string): Promise<boolean> {
  try {
    if (await fetchMyAlert(userId)) return false;
    await saveMyAlert({ profile_id: userId, categories: [], country: null, keywords: [], frequency: 'WEEKLY', active: true });
    return true;
  } catch (e) {
    console.warn('[alertas_novedades] no se pudo crear la alerta:', e);
    return false;
  }
}

export async function deleteMyAlert(userId: string): Promise<void> {
  const { error } = await supabase.from('job_alert_subscriptions').delete().eq('profile_id', userId);
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Empresa
// ---------------------------------------------------------------------------

export const COMPANY_APPLICATION_COLUMNS =
  'id, created_at, updated_at, job_posting_id, profile_id, company_id, status, cover_letter, answers, viewed_by_company, viewed_at, internal_notes, rating, match_score, perfil_copia, consent_at, consent_doc_version, descartada_auto, metadata';

export async function markApplicationViewed(id: string): Promise<void> {
  const { error } = await supabase.rpc('mark_application_viewed', { p_id: id });
  if (error) throw error;
}

export async function updateApplicationStatus(args: {
  applicationId: string; companyId: string; userId: string; status: string; notes: string | null; rating: number | null;
  /** «Quitar valoración»: la RPC hace coalesce(p_rating, rating), con null no borra; hace falta p_clear_rating. */
  clearRating?: boolean;
}): Promise<void> {
  const { error } = await supabase.rpc('update_application_status', {
    p_application_id: args.applicationId,
    p_company_id: args.companyId,
    p_user_id: args.userId,
    p_new_status: args.status,
    p_internal_notes: args.notes,
    p_rating: args.clearRating ? null : args.rating,
    // Solo se envia cuando se quiere borrar: la firma antigua de la RPC no lo conoce.
    ...(args.clearRating ? { p_clear_rating: true } : {}),
  });
  if (error) throw error;
}

export type ApplicationMessageTemplate = 'rejected' | 'interview';

/** Correo con plantilla al candidato (se encola en email_outbox; 1 por candidatura y plantilla cada 24 h). */
export async function sendApplicationMessage(applicationId: string, template: ApplicationMessageTemplate): Promise<void> {
  const { data, error } = await supabase.rpc('send_application_message', {
    p_application_id: applicationId,
    p_template: template,
  });
  if (error) throw error;
  const d = (data || {}) as { ok?: boolean; status?: string; error?: string };
  if (d.ok === false) throw new Error(String(d.error || d.status || 'MESSAGE_NOT_SENT'));
}

export async function fetchJobQuestionsForCompany(jobId: string): Promise<Array<JobQuestion & { expected_answer: string | null }>> {
  const { data, error } = await supabase.rpc('get_job_questions_for_company', { p_job_posting_id: jobId });
  if (error) throw error;
  return (data || []) as Array<JobQuestion & { expected_answer: string | null }>;
}

/** job_posting_id -> estado de la candidatura del usuario (para «Ya inscrito» en listados). */
export async function fetchMyApplicationStatuses(): Promise<Map<string, CandidateStatus>> {
  const { data, error } = await supabase.from('my_job_applications').select('job_posting_id, candidate_status');
  if (error) throw error;
  return new Map((data || []).map((r: { job_posting_id: string; candidate_status: CandidateStatus }) => [r.job_posting_id, r.candidate_status]));
}
