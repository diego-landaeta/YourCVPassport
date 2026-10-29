/**
 * Acceso a datos del asistente de ofertas y de «Mis ofertas».
 *
 * Todo contra las tablas/RPC de la migración 20261030 (fase 2) y 20261031
 * (preguntas). Sin `select('*')` sobre `job_postings` ni `job_posting_questions`.
 * No se envía ningún correo desde aquí.
 */
import { supabase } from '../../../supabase/client';
import { sanitizeJobHtml } from '../../../lib/jobPostingHtml';
import {
  JOB_EDIT_COLUMNS,
  formToPayload,
  questionToRow,
  questionRowToDraft,
  type CountryRow,
  type JobForm,
  type JobRow,
  type QuestionDraft,
  type QuestionRow,
} from '../../../lib/jobPostingModel';

export interface CompanyContext {
  userId: string;
  companyId: string;
  companyName: string;
  companyLogo: string | null;
}

export interface LegalDoc {
  id: string;
  tipo: string;
  version: string;
  idioma: string;
  titulo: string;
  texto: string;
  casillas_obligatorias: string[];
  borrador: boolean;
}

export interface OfferListItem {
  id: string;
  title: string;
  status: string;
  location_city: string | null;
  created_at: string;
}

/** Usuario y empresa de la sesión. Lanza 'AUTH' o 'NO_COMPANY'. */
export async function loadCompanyContext(): Promise<CompanyContext> {
  const { data: auth } = await supabase.auth.getUser();
  const user = auth?.user;
  if (!user) throw new Error('AUTH');
  const { data: cu, error } = await supabase.from('company_users').select('company_id').eq('user_id', user.id).maybeSingle();
  if (error) throw error;
  if (!cu) throw new Error('NO_COMPANY');
  const { data: company } = await supabase.from('companies').select('id, company_name, logo_url').eq('id', cu.company_id).maybeSingle();
  return {
    userId: user.id,
    companyId: cu.company_id as string,
    companyName: (company?.company_name as string) || '',
    companyLogo: (company?.logo_url as string) || null,
  };
}

/** País de la empresa (fase 1: companies.country_code). null si aún no existe la columna o no está informado. */
export async function loadCompanyCountry(companyId: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.from('companies_full').select('country_code').eq('id', companyId).maybeSingle();
    if (error) return null;
    const code = (data as { country_code?: string } | null)?.country_code;
    return code ? String(code).toUpperCase() : null;
  } catch {
    return null;
  }
}

export async function loadCountries(): Promise<CountryRow[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('code, name_es, name_en, currency, active')
    .eq('active', true)
    .order('name_es', { ascending: true });
  if (error) throw error;
  return (data || []) as CountryRow[];
}

export async function loadJobRow(jobId: string, companyId: string): Promise<JobRow | null> {
  const { data, error } = await supabase.from('job_postings').select(JOB_EDIT_COLUMNS).eq('id', jobId).eq('company_id', companyId).maybeSingle();
  if (error) throw error;
  return (data as unknown as JobRow) || null;
}

/** Preguntas con `expected_answer`: solo se leen por la RPC de la empresa. */
export async function loadQuestionRows(jobId: string): Promise<QuestionRow[]> {
  const { data, error } = await supabase.rpc('get_job_questions_for_company', { p_job_posting_id: jobId });
  if (error) throw error;
  return (Array.isArray(data) ? data : []) as QuestionRow[];
}

/** Ofertas de la empresa para el selector «duplicar» (columnas mínimas). */
export async function loadOfferList(companyId: string): Promise<OfferListItem[]> {
  const { data, error } = await supabase
    .from('job_postings')
    .select('id, title, status, location_city, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data || []) as OfferListItem[];
}

/** Última versión vigente de las condiciones del empleador en el idioma (o en español). */
export async function loadEmployerTerms(lang: 'es' | 'en'): Promise<LegalDoc | null> {
  const nowIso = new Date().toISOString();
  for (const idioma of lang === 'es' ? ['es'] : ['en', 'es']) {
    const { data, error } = await supabase
      .from('documentos_legales')
      .select('id, tipo, version, idioma, titulo, texto, casillas_obligatorias, borrador')
      .eq('tipo', 'terminos_empleador')
      .eq('idioma', idioma)
      .lte('vigente_desde', nowIso)
      .order('vigente_desde', { ascending: false })
      .limit(1);
    if (error) throw error;
    const row = (data || [])[0] as LegalDoc | undefined;
    if (row) return { ...row, casillas_obligatorias: Array.isArray(row.casillas_obligatorias) ? row.casillas_obligatorias : [] };
  }
  return null;
}

export interface SaveResult {
  id: string;
  status: string;
  /** Preguntas con el id que les ha dado la base. */
  questions: QuestionDraft[];
}

/**
 * Guarda la oferta (insert si no hay id, update si lo hay) y sincroniza las
 * preguntas. Nunca toca `status`: una oferta nueva nace DRAFT por defecto y las
 * demás conservan el suyo (el trigger puede devolver una PUBLISHED a AI_REVIEW
 * si cambian título o descripción; por eso se lee el estado de vuelta).
 */
export async function saveJob(
  form: JobForm,
  ctx: CompanyContext,
  jobId: string | null,
  currency: string | null,
  originalDescription: string | null = null,
): Promise<SaveResult> {
  const payload = formToPayload(form, currency);
  // Si el texto no ha cambiado de verdad, se reenvía el original byte a byte: el trigger compara
  // la descripción tal cual y un simple cambio de formato devolvería la oferta a revisión.
  if (jobId && originalDescription !== null && sanitizeJobHtml(originalDescription) === payload.description) {
    payload.description = originalDescription;
  }
  let id = jobId;
  let status = 'DRAFT';

  if (id) {
    const { data, error } = await supabase.from('job_postings').update(payload).eq('id', id).eq('company_id', ctx.companyId).select('id, status').single();
    if (error) throw error;
    status = (data as { status: string }).status;
  } else {
    const { data, error } = await supabase
      .from('job_postings')
      .insert({ ...payload, company_id: ctx.companyId, created_by: ctx.userId, status: 'DRAFT' })
      .select('id, status')
      .single();
    if (error) throw error;
    id = (data as { id: string }).id;
    status = (data as { status: string }).status;
  }

  const questions = await syncQuestions(id!, form.questions, !jobId);
  return { id: id!, status, questions };
}

/**
 * Deja en la base exactamente las preguntas del formulario. Orden: primero se
 * borran las quitadas (el tope de 5 se comprueba al insertar), luego se
 * actualizan las existentes y por último se insertan las nuevas.
 */
async function syncQuestions(jobId: string, drafts: QuestionDraft[], isNewJob: boolean): Promise<QuestionDraft[]> {
  let existingIds: string[] = [];
  if (!isNewJob) {
    const rows = await loadQuestionRows(jobId);
    existingIds = rows.map((r) => r.id as string);
  }
  const keepIds = new Set(drafts.filter((d) => d.id).map((d) => d.id as string));
  const toDelete = existingIds.filter((id) => !keepIds.has(id));
  if (toDelete.length) {
    const { error } = await supabase.from('job_posting_questions').delete().in('id', toDelete);
    if (error) throw error;
  }

  const result: QuestionDraft[] = drafts.map((d) => ({ ...d }));
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    if (!d.id) continue;
    const { job_posting_id: _omit, ...row } = questionToRow(d, jobId, i);
    void _omit;
    const { error } = await supabase.from('job_posting_questions').update(row).eq('id', d.id);
    if (error) throw error;
  }

  const fresh = drafts.map((d, i) => ({ d, i })).filter(({ d }) => !d.id);
  if (fresh.length) {
    const rows = fresh.map(({ d, i }) => questionToRow(d, jobId, i));
    const { data, error } = await supabase.from('job_posting_questions').insert(rows).select('id, order_index');
    if (error) throw error;
    for (const r of (data || []) as { id: string; order_index: number }[]) {
      if (result[r.order_index]) result[r.order_index].id = r.id;
    }
  }
  return result;
}

export interface SubmitResult {
  status: 'AI_REVIEW' | 'MANUAL_REVIEW';
  flags: string[];
  application_deadline: string | null;
}

export async function submitForReview(jobId: string): Promise<SubmitResult> {
  const { data, error } = await supabase.rpc('submit_job_for_review', { p_job_id: jobId });
  if (error) throw error;
  const r = (data || {}) as { status?: string; flags?: unknown; application_deadline?: string };
  return {
    status: r.status === 'MANUAL_REVIEW' ? 'MANUAL_REVIEW' : 'AI_REVIEW',
    flags: Array.isArray(r.flags) ? (r.flags as string[]) : [],
    application_deadline: r.application_deadline || null,
  };
}

/** Registra la aceptación de las condiciones del empleador para esta publicación (la IP la pone el servidor). */
export async function registerPublishAcceptance(doc: LegalDoc, casillas: Record<string, boolean>, jobId: string, companyId: string): Promise<void> {
  const { error } = await supabase.rpc('registrar_aceptacion', {
    p_documento_ids: [doc.id],
    p_casillas: casillas,
    p_contexto: 'publicacion',
    p_oferta_id: jobId,
    p_company_id: companyId,
  });
  if (error) throw error;
}

/** Cambio de estado permitido a la empresa (pausar, reanudar, cerrar, cubrir). Devuelve el estado resultante. */
export async function setJobStatus(jobId: string, status: 'PAUSED' | 'PUBLISHED' | 'CLOSED' | 'FILLED' | 'DRAFT', extra: Record<string, unknown> = {}): Promise<string> {
  const { data, error } = await supabase.from('job_postings').update({ status, ...extra }).eq('id', jobId).select('id, status').single();
  if (error) throw error;
  return (data as { status: string }).status;
}

export async function deleteDraft(jobId: string): Promise<void> {
  const { error } = await supabase.from('job_postings').delete().eq('id', jobId).eq('status', 'DRAFT');
  if (error) throw error;
}

export { questionRowToDraft };
