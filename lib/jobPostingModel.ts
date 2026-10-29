/**
 * Modelo de datos del asistente de ofertas (fase 2, #7).
 *
 * Una sola fuente de verdad para:
 *   - los códigos que se guardan en `job_postings` (contrato, jornada, salario...),
 *   - el estado del formulario (`JobForm`) y su conversión desde/hacia la fila,
 *   - las validaciones por paso (las mismas reglas que `_job_submit`, más estrictas
 *     solo donde no hay riesgo de discrepancia),
 *   - la lectura de los errores de las RPC por prefijo (`JOB_INVALID: ...`).
 *
 * No hace llamadas a Supabase ni usa React: se puede probar suelto.
 */
import { jobTextLength, descriptionToHtml, sanitizeJobHtml } from './jobPostingHtml';
import { isJobCategory } from './jobCategories';

// ---------------------------------------------------------------------------
// Códigos
// ---------------------------------------------------------------------------
export const WORK_MODES = ['ONSITE', 'HYBRID', 'REMOTE'] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const CONTRACT_TYPES = ['INDEFINITE', 'TEMPORARY', 'PROJECT', 'INTERNSHIP', 'TRAINING', 'FREELANCE', 'VOLUNTEER'] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

export const SCHEDULES = ['FULL_TIME', 'PART_TIME', 'HOURLY'] as const;
export type Schedule = (typeof SCHEDULES)[number];

export const SALARY_MODES = ['RANGE', 'FROM', 'UP_TO', 'EXACT'] as const;
export type SalaryMode = (typeof SALARY_MODES)[number];

export const SALARY_PERIODS = ['HOURLY', 'MONTHLY', 'YEARLY'] as const;
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];

/**
 * Formación mínima. Los códigos están pensados para que `jobs_edu_level()` (fase 3)
 * los puntúe bien: none=0, secondary=1, vocational=2, bachelor=3, master=4, doctorate=5.
 */
export const EDUCATION_LEVELS = ['NONE', 'SECONDARY', 'VOCATIONAL', 'BACHELOR', 'MASTER', 'DOCTORATE'] as const;
export type EducationLevel = (typeof EDUCATION_LEVELS)[number];

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

/** Códigos de idioma que se pueden pedir. `languages` = [{ language: 'en', level: 'B2' }]. */
export const JOB_LANGUAGES = ['es', 'en', 'fr', 'de', 'it', 'pt', 'ca', 'eu', 'gl', 'nl', 'pl', 'ro', 'ru', 'zh', 'ar', 'ja'] as const;

export const COVER_LETTER_MODES = ['NONE', 'OPTIONAL', 'REQUIRED'] as const;
export type CoverLetterMode = (typeof COVER_LETTER_MODES)[number];

export const NOTIFY_FREQUENCIES = ['EACH', 'DAILY'] as const;
export type NotifyFrequency = (typeof NOTIFY_FREQUENCIES)[number];

export const QUESTION_TYPES = ['YES_NO', 'NUMBER', 'MULTIPLE_CHOICE', 'TEXT', 'TEXTAREA'] as const;
export type QuestionType = (typeof QUESTION_TYPES)[number];

/**
 * `NUMBER` NO existe en el CHECK de `job_posting_questions.question_type` de la
 * migración 20261031 (solo TEXT, TEXTAREA, YES_NO, MULTIPLE_CHOICE), aunque
 * `jobs_answer_meets()` ya sabe puntuar tipos numéricos. Mientras la migración no
 * lo admita, poner esto a false oculta el tipo «Número» del asistente.
 */
export const QUESTION_NUMBER_SUPPORTED = true;

/** Tipos de pregunta que admiten «Imprescindible» (los de texto libre no se pueden puntuar). */
export const KNOCKOUT_TYPES: readonly QuestionType[] = ['YES_NO', 'NUMBER', 'MULTIPLE_CHOICE'];

export const MAX_QUESTIONS = 5;
export const MAX_NOTIFY_EMAILS = 5;
export const MAX_TITLE = 100;
export const MIN_DESCRIPTION = 300;
export const MAX_DESCRIPTION = 20000;
export const MAX_SALARY = 10_000_000;
export const DEFAULT_DEADLINE_DAYS = 30;
export const MAX_DEADLINE_DAYS = 60;

export const JOB_STATUSES = ['DRAFT', 'AI_REVIEW', 'MANUAL_REVIEW', 'REJECTED', 'PUBLISHED', 'PAUSED', 'CLOSED', 'FILLED', 'EXPIRED'] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/** Estados en los que el asistente permite editar la oferta. */
export const EDITABLE_STATUSES: readonly string[] = ['DRAFT', 'REJECTED', 'PUBLISHED', 'PAUSED'];
/** Estados en los que se puede enviar a revisión (submit_job_for_review). */
export const SUBMITTABLE_STATUSES: readonly string[] = ['DRAFT', 'REJECTED'];

export interface CountryRow {
  code: string;
  name_es: string;
  name_en: string;
  currency: string;
  active: boolean;
}

// ---------------------------------------------------------------------------
// Formulario
// ---------------------------------------------------------------------------
export interface LanguageReq {
  language: string;
  level: string;
}

export interface QuestionDraft {
  /** Clave de React estable (no es el id de la base). */
  key: string;
  /** id de job_posting_questions si ya está guardada. */
  id?: string;
  text: string;
  type: QuestionType;
  options: string[];
  /** Obligatoria de responder (los «Imprescindible» lo son siempre). */
  required: boolean;
  knockout: boolean;
  /** Respuesta que cumple el requisito: YES|NO, ">=3", o opciones separadas por «|». */
  expected: string;
}

export interface JobForm {
  // Paso 1
  country_code: string;
  title: string;
  category: string;
  category2: string;
  work_mode: WorkMode | '';
  location_city: string;
  location_state: string;
  allowed_countries: string[];
  vacancies: string;
  // Paso 2
  description: string; // HTML saneado
  responsibilities: string; // una por línea
  requirements: string; // una por línea
  nice_to_have: string; // una por línea
  education_min: EducationLevel | '';
  experience_years: string;
  languages: LanguageReq[];
  required_skills: string[];
  optional_skills: string[];
  // Paso 3
  contract_types: ContractType[];
  schedule: Schedule | '';
  duration: string;
  start_immediate: boolean;
  start_date: string;
  salary_mode: SalaryMode | '';
  salary_min: string;
  salary_max: string;
  salary_period: SalaryPeriod;
  show_salary: boolean | null;
  benefits: string[];
  // Paso 4
  questions: QuestionDraft[];
  cover_letter_mode: CoverLetterMode;
  notify_emails: string; // separados por coma o salto de línea
  notify_frequency: NotifyFrequency;
  application_deadline: string; // AAAA-MM-DD (local)
}

let keyCounter = 0;
export function newQuestionKey(): string {
  keyCounter += 1;
  return `q${Date.now().toString(36)}${keyCounter}`;
}

export function emptyQuestion(type: QuestionType = 'YES_NO'): QuestionDraft {
  return { key: newQuestionKey(), text: '', type, options: type === 'MULTIPLE_CHOICE' ? ['', ''] : [], required: false, knockout: false, expected: '' };
}

export function emptyForm(defaultCountry = ''): JobForm {
  return {
    country_code: defaultCountry,
    title: '',
    category: '',
    category2: '',
    work_mode: '',
    location_city: '',
    location_state: '',
    allowed_countries: [],
    vacancies: '1',
    description: '',
    responsibilities: '',
    requirements: '',
    nice_to_have: '',
    education_min: '',
    experience_years: '',
    languages: [],
    required_skills: [],
    optional_skills: [],
    contract_types: [],
    schedule: '',
    duration: '',
    start_immediate: true,
    start_date: '',
    salary_mode: '',
    salary_min: '',
    salary_max: '',
    salary_period: 'MONTHLY',
    show_salary: null,
    benefits: [],
    questions: [],
    cover_letter_mode: 'NONE',
    notify_emails: '',
    notify_frequency: 'DAILY',
    application_deadline: dateInDays(DEFAULT_DEADLINE_DAYS),
  };
}

// ---------------------------------------------------------------------------
// Fechas (siempre locales: el usuario piensa en «el 20 de noviembre», no en UTC)
// ---------------------------------------------------------------------------
function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toDateInput(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function dateInDays(days: number, from: Date = new Date()): string {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + days);
  return toDateInput(d);
}

/**
 * Fecha de cierre elegida -> instante. Fin del día, sin pasar nunca de ahora + 61 días: el
 * trigger de la base limita el cierre a `now() + 61 días` CONTANDO DESDE AHORA (no desde
 * `published_at`: renovar o editar una oferta antigua ya no falla). El selector deja elegir
 * hasta hoy + 60 días (MAX_DEADLINE_DAYS), cuyo fin de día cabe siempre dentro de ese margen.
 */
export function deadlineToInstant(dateStr: string, now: Date = new Date()): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr || '');
  if (!m) return null;
  const end = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 0);
  const max = new Date(now.getTime() + (MAX_DEADLINE_DAYS + 1) * 86400000 - 60000);
  return (end.getTime() > max.getTime() ? max : end).toISOString();
}

export function instantToDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : toDateInput(d);
}

// ---------------------------------------------------------------------------
// Fila de la base <-> formulario
// ---------------------------------------------------------------------------
/** Columnas que lee el asistente (explícitas: sin select('*')). */
export const JOB_EDIT_COLUMNS = [
  'id', 'company_id', 'status', 'title', 'slug', 'department', 'employment_type', 'experience_level',
  'work_mode', 'location_city', 'location_state', 'location_country', 'is_remote', 'description',
  'responsibilities', 'requirements', 'nice_to_have', 'benefits', 'required_skills', 'optional_skills',
  'salary_min', 'salary_max', 'salary_currency', 'salary_period', 'show_salary', 'application_deadline',
  'published_at', 'closed_at', 'country_code', 'category', 'category2', 'vacancies', 'contract_types',
  'schedule', 'duration', 'start_date', 'start_immediate', 'salary_mode', 'education_min',
  'experience_years', 'languages', 'cover_letter_mode', 'allowed_countries', 'notify_emails',
  'notify_frequency', 'review_reason', 'created_at', 'updated_at',
].join(', ');

export type JobRow = Record<string, any>;
export type QuestionRow = Record<string, any>;

function strArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function numStr(v: unknown): string {
  return v === null || v === undefined || v === '' ? '' : String(v);
}

export function questionRowToDraft(r: QuestionRow): QuestionDraft {
  const type = (QUESTION_TYPES as readonly string[]).includes(r.question_type) ? (r.question_type as QuestionType) : 'TEXT';
  return {
    key: newQuestionKey(),
    id: r.id,
    text: r.question_text || '',
    type,
    options: Array.isArray(r.options) ? r.options.filter((o: unknown): o is string => typeof o === 'string') : [],
    required: !!r.is_required,
    knockout: !!r.is_knockout,
    expected: r.expected_answer || '',
  };
}

export function jobRowToForm(row: JobRow, questions: QuestionRow[] = [], opts: { keepIds?: boolean } = {}): JobForm {
  const keepIds = opts.keepIds !== false;
  const mode: SalaryMode | '' = (SALARY_MODES as readonly string[]).includes(row.salary_mode)
    ? row.salary_mode
    : row.salary_min != null || row.salary_max != null
      ? 'RANGE'
      : '';
  const exact = mode === 'EXACT';
  return {
    country_code: row.country_code || '',
    title: row.title || '',
    category: row.category || '',
    category2: row.category2 || '',
    work_mode: (WORK_MODES as readonly string[]).includes(row.work_mode) ? row.work_mode : '',
    location_city: row.location_city || '',
    location_state: row.location_state || '',
    allowed_countries: strArray(row.allowed_countries),
    vacancies: numStr(row.vacancies) || '1',
    description: descriptionToHtml(row.description),
    responsibilities: strArray(row.responsibilities).join('\n'),
    requirements: strArray(row.requirements).join('\n'),
    nice_to_have: strArray(row.nice_to_have).join('\n'),
    education_min: (EDUCATION_LEVELS as readonly string[]).includes(row.education_min) ? row.education_min : '',
    experience_years: numStr(row.experience_years),
    languages: Array.isArray(row.languages)
      ? row.languages
          .filter((l: any) => l && typeof l === 'object' && typeof l.language === 'string')
          .map((l: any) => ({ language: l.language, level: typeof l.level === 'string' ? l.level : 'B2' }))
      : [],
    required_skills: strArray(row.required_skills),
    optional_skills: strArray(row.optional_skills),
    contract_types: strArray(row.contract_types).filter((c): c is ContractType => (CONTRACT_TYPES as readonly string[]).includes(c)),
    schedule: (SCHEDULES as readonly string[]).includes(row.schedule) ? row.schedule : '',
    duration: row.duration || '',
    start_immediate: row.start_immediate === undefined || row.start_immediate === null ? !row.start_date : !!row.start_immediate,
    start_date: row.start_date || '',
    salary_mode: mode,
    salary_min: numStr(exact ? row.salary_min ?? row.salary_max : row.salary_min),
    salary_max: exact ? '' : numStr(row.salary_max),
    salary_period: (SALARY_PERIODS as readonly string[]).includes(row.salary_period) ? row.salary_period : 'MONTHLY',
    // En un borrador, show_salary=false es el valor por defecto de la columna: si no hay salario no se sabe si lo eligió.
    show_salary: row.show_salary === true ? true : row.status !== 'DRAFT' || mode ? false : null,
    benefits: strArray(row.benefits),
    questions: questions.map((q) => {
      const d = questionRowToDraft(q);
      if (!keepIds) delete d.id;
      return d;
    }),
    cover_letter_mode: (COVER_LETTER_MODES as readonly string[]).includes(row.cover_letter_mode) ? row.cover_letter_mode : 'NONE',
    notify_emails: strArray(row.notify_emails).join(', '),
    notify_frequency: row.notify_frequency === 'EACH' ? 'EACH' : 'DAILY',
    application_deadline: instantToDateInput(row.application_deadline) || dateInDays(DEFAULT_DEADLINE_DAYS),
  };
}

/** Líneas no vacías de un textarea «una por línea». */
export function linesOf(text: string): string[] {
  return (text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 30);
}

export function parseEmails(text: string): { valid: string[]; invalid: string[] } {
  const parts = (text || '')
    .split(/[\s,;]+/)
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const p of parts) {
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p) && p.length <= 254) {
      if (!valid.includes(p)) valid.push(p);
    } else {
      invalid.push(p);
    }
  }
  return { valid, invalid };
}

/** employment_type de la columna antigua (la usan el buscador viejo y el CHECK), derivado del contrato y la jornada. */
export function legacyEmploymentType(contracts: readonly string[], schedule: string): string {
  const first = contracts[0];
  switch (first) {
    case 'TEMPORARY':
      return 'TEMPORARY';
    case 'PROJECT':
      return 'CONTRACT';
    case 'INTERNSHIP':
    case 'TRAINING':
      return 'INTERNSHIP';
    case 'FREELANCE':
      return 'FREELANCE';
    case 'VOLUNTEER':
      return 'PART_TIME';
    default:
      return schedule === 'PART_TIME' || schedule === 'HOURLY' ? 'PART_TIME' : 'FULL_TIME';
  }
}

/** experience_level de la columna antigua, derivado de los años pedidos. */
export function legacyExperienceLevel(years: string): string {
  const n = Number(years);
  if (!years || !Number.isFinite(n) || n <= 0) return 'ENTRY';
  if (n < 3) return 'JUNIOR';
  if (n < 5) return 'MID';
  if (n < 8) return 'SENIOR';
  return 'LEAD';
}

export function salaryAmounts(f: Pick<JobForm, 'salary_mode' | 'salary_min' | 'salary_max'>): { min: number | null; max: number | null } {
  const parse = (v: string): number | null => {
    if (v.trim() === '') return null;
    const n = Math.round(Number(v));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const lo = parse(f.salary_min);
  const hi = parse(f.salary_max);
  switch (f.salary_mode) {
    case 'RANGE':
      return { min: lo, max: hi };
    case 'FROM':
      return { min: lo, max: null };
    case 'UP_TO':
      return { min: null, max: hi };
    case 'EXACT':
      return { min: lo, max: lo };
    default:
      return { min: null, max: null };
  }
}

/** Carga útil de job_postings. `currency` sale de countries.currency del país elegido. */
export function formToPayload(f: JobForm, currency: string | null): Record<string, any> {
  const { min, max } = salaryAmounts(f);
  // Un borrador a medias no debe romper los CHECK de la base: un salario incoherente o fuera de rango
  // no se guarda (la validación del paso 3 y del resumen impide publicarlo así).
  const salaryBroken =
    (min !== null && max !== null && max < min) || (min !== null && min > MAX_SALARY) || (max !== null && max > MAX_SALARY);
  const hasSalary = f.salary_mode !== '' && (min !== null || max !== null) && !salaryBroken;
  const remote = f.work_mode === 'REMOTE';
  const description = sanitizeJobHtml(f.description);
  return {
    title: f.title.trim(),
    description,
    department: null,
    employment_type: legacyEmploymentType(f.contract_types, f.schedule),
    experience_level: legacyExperienceLevel(f.experience_years),
    work_mode: f.work_mode || null,
    is_remote: remote,
    location_city: remote ? null : f.location_city.trim() || null,
    location_state: remote ? null : f.location_state.trim() || null,
    location_country: f.country_code || null,
    country_code: f.country_code || null,
    category: f.category || null,
    category2: f.category2 || null,
    vacancies: Math.max(1, Math.round(Number(f.vacancies) || 1)),
    allowed_countries: remote && f.allowed_countries.length ? f.allowed_countries : null,
    contract_types: f.contract_types,
    schedule: f.schedule || null,
    duration: f.duration.trim() || null,
    start_immediate: f.start_immediate,
    start_date: f.start_immediate ? null : f.start_date || null,
    responsibilities: linesOf(f.responsibilities),
    requirements: linesOf(f.requirements),
    nice_to_have: linesOf(f.nice_to_have),
    education_min: f.education_min || null,
    experience_years: f.experience_years.trim() === '' ? null : Math.max(0, Math.round(Number(f.experience_years))),
    languages: f.languages.map((l) => ({ language: l.language, level: l.level })),
    required_skills: f.required_skills,
    optional_skills: f.optional_skills,
    benefits: f.benefits,
    salary_mode: hasSalary ? f.salary_mode : null,
    salary_min: hasSalary ? min : null,
    salary_max: hasSalary ? max : null,
    salary_currency: currency || null,
    salary_period: hasSalary ? f.salary_period : null,
    show_salary: f.show_salary === true,
    cover_letter_mode: f.cover_letter_mode,
    notify_emails: parseEmails(f.notify_emails).valid.slice(0, MAX_NOTIFY_EMAILS),
    notify_frequency: f.notify_frequency,
    application_deadline: futureDeadline(f.application_deadline),
  };
}

/** Instante de cierre o null si la fecha no es válida o ya pasó (la base exige cierre > creación). */
function futureDeadline(dateStr: string): string | null {
  const iso = deadlineToInstant(dateStr);
  return iso && new Date(iso).getTime() > Date.now() ? iso : null;
}

export function questionToRow(q: QuestionDraft, jobId: string, index: number): Record<string, any> {
  const knockout = q.knockout && KNOCKOUT_TYPES.includes(q.type);
  return {
    job_posting_id: jobId,
    question_text: q.text.trim(),
    question_type: q.type,
    options: q.type === 'MULTIPLE_CHOICE' ? q.options.map((o) => o.trim()).filter(Boolean) : null,
    is_required: q.required || knockout,
    is_knockout: knockout,
    expected_answer: knockout ? q.expected.trim() : null,
    order_index: index,
  };
}

// ---------------------------------------------------------------------------
// Validación
// ---------------------------------------------------------------------------
export type FieldErrors = Record<string, string>;

export type StepId = 'basics' | 'description' | 'conditions' | 'screening' | 'review';
/**
 * Orden de los pasos del asistente, el de la issue #7: 1 Básicos, 2 Condiciones y compensación,
 * 3 Descripción y requisitos, 4 Filtros y candidaturas, 5 Revisar y publicar.
 * Cambiarlo aquí cambia el recorrido completo (barra de pasos, validaciones y `?paso=`).
 */
export const STEP_IDS: readonly StepId[] = ['basics', 'conditions', 'description', 'screening', 'review'];

const EMOJI_RE = /[\u{1F300}-\u{1FAFF}☀-➿]/u;

/** Problema del título según las reglas de la issue #7 (y de `_job_submit`), o null. */
export function titleIssue(title: string): 'required' | 'too_long' | 'all_caps' | 'emoji' | null {
  const t = title.trim();
  if (!t) return 'required';
  if (t.length > MAX_TITLE) return 'too_long';
  const letters = t.replace(/[^\p{L}]/gu, '');
  if (letters.length >= 8 && t === t.toUpperCase() && t !== t.toLowerCase()) return 'all_caps';
  if (EMOJI_RE.test(t)) return 'emoji';
  return null;
}

export function isValidDateInput(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(`${s}T00:00:00`);
  return !Number.isNaN(d.getTime()) && toDateInput(d) === s;
}

function validateQuestion(q: QuestionDraft, prefix: string, errs: FieldErrors) {
  if (!q.text.trim()) errs[`${prefix}.text`] = 'v_question_text';
  else if (q.text.trim().length > 300) errs[`${prefix}.text`] = 'v_question_long';
  if (q.type === 'MULTIPLE_CHOICE') {
    const opts = q.options.map((o) => o.trim()).filter(Boolean);
    if (opts.length < 2) errs[`${prefix}.options`] = 'v_question_options';
    else if (new Set(opts.map((o) => o.toLowerCase())).size !== opts.length) errs[`${prefix}.options`] = 'v_question_options_dup';
  }
  if (q.knockout && KNOCKOUT_TYPES.includes(q.type)) {
    const exp = q.expected.trim();
    if (q.type === 'YES_NO' && exp !== 'YES' && exp !== 'NO') errs[`${prefix}.expected`] = 'v_question_expected';
    if (q.type === 'NUMBER' && !/^(>=|<=|=)?\s*\d+([.,]\d+)?$/.test(exp)) errs[`${prefix}.expected`] = 'v_question_expected_number';
    if (q.type === 'MULTIPLE_CHOICE' && !exp) errs[`${prefix}.expected`] = 'v_question_expected_options';
  }
}

export function validateStep(step: StepId, f: JobForm, countries: readonly CountryRow[], now: Date = new Date()): FieldErrors {
  const errs: FieldErrors = {};
  switch (step) {
    case 'basics': {
      if (!f.country_code) errs.country_code = 'v_country';
      else if (countries.length && !countries.some((c) => c.code === f.country_code && c.active)) errs.country_code = 'v_country';
      const ti = titleIssue(f.title);
      if (ti) errs.title = `v_title_${ti}`;
      if (!f.category) errs.category = 'v_category';
      else if (!isJobCategory(f.category)) errs.category = 'v_category';
      if (f.category2 && !isJobCategory(f.category2)) errs.category2 = 'v_category';
      if (f.category2 && f.category2 === f.category) errs.category2 = 'v_category2_same';
      if (!f.work_mode) errs.work_mode = 'v_work_mode';
      if ((f.work_mode === 'ONSITE' || f.work_mode === 'HYBRID') && !f.location_city.trim()) errs.location_city = 'v_city';
      const v = Number(f.vacancies);
      if (!Number.isInteger(v) || v < 1 || v > 999) errs.vacancies = 'v_vacancies';
      break;
    }
    case 'description': {
      const len = jobTextLength(f.description);
      if (len < MIN_DESCRIPTION) errs.description = 'v_description_short';
      else if (f.description.length > MAX_DESCRIPTION) errs.description = 'v_description_long';
      if (f.experience_years.trim() !== '') {
        const y = Number(f.experience_years);
        if (!Number.isFinite(y) || y < 0 || y > 60) errs.experience_years = 'v_experience';
      }
      const langs = f.languages.map((l) => l.language);
      if (new Set(langs).size !== langs.length) errs.languages = 'v_languages_dup';
      break;
    }
    case 'conditions': {
      if (f.contract_types.length === 0) errs.contract_types = 'v_contract';
      if (!f.schedule) errs.schedule = 'v_schedule';
      if (!f.start_immediate) {
        if (!isValidDateInput(f.start_date)) errs.start_date = 'v_start_date';
        else if (f.start_date < toDateInput(now)) errs.start_date = 'v_start_date_past';
      }
      if (f.show_salary === null) errs.show_salary = 'v_show_salary';
      const lo = f.salary_min.trim() === '' ? null : Number(f.salary_min);
      const hi = f.salary_max.trim() === '' ? null : Number(f.salary_max);
      if (f.salary_mode) {
        const needsMin = f.salary_mode === 'RANGE' || f.salary_mode === 'FROM' || f.salary_mode === 'EXACT';
        const needsMax = f.salary_mode === 'RANGE' || f.salary_mode === 'UP_TO';
        if (needsMin && (lo === null || !Number.isFinite(lo) || lo <= 0)) errs.salary_min = 'v_salary_amount';
        if (needsMax && (hi === null || !Number.isFinite(hi) || hi <= 0)) errs.salary_max = 'v_salary_amount';
        if (!errs.salary_min && lo !== null && lo > MAX_SALARY) errs.salary_min = 'v_salary_max_value';
        if (!errs.salary_max && hi !== null && hi > MAX_SALARY) errs.salary_max = 'v_salary_max_value';
        if (!errs.salary_min && !errs.salary_max && f.salary_mode === 'RANGE' && lo !== null && hi !== null && hi < lo) errs.salary_max = 'v_salary_order';
      } else if (f.show_salary === true) {
        errs.salary_mode = 'v_salary_show_empty';
      }
      break;
    }
    case 'screening': {
      if (f.questions.length > MAX_QUESTIONS) errs.questions = 'v_questions_max';
      f.questions.forEach((q, i) => validateQuestion(q, `questions.${i}`, errs));
      const { invalid, valid } = parseEmails(f.notify_emails);
      if (invalid.length) errs.notify_emails = 'v_emails_invalid';
      else if (valid.length > MAX_NOTIFY_EMAILS) errs.notify_emails = 'v_emails_max';
      if (!isValidDateInput(f.application_deadline)) errs.application_deadline = 'v_deadline';
      else if (f.application_deadline < dateInDays(1, now)) errs.application_deadline = 'v_deadline_past';
      else if (f.application_deadline > dateInDays(MAX_DEADLINE_DAYS, now)) errs.application_deadline = 'v_deadline_far';
      break;
    }
    default:
      break;
  }
  return errs;
}

/** Errores de todos los pasos, con el paso al que pertenece cada uno. */
export function validateAll(f: JobForm, countries: readonly CountryRow[], now: Date = new Date()): { step: StepId; field: string; message: string }[] {
  const out: { step: StepId; field: string; message: string }[] = [];
  for (const step of STEP_IDS) {
    const errs = validateStep(step, f, countries, now);
    for (const [field, message] of Object.entries(errs)) out.push({ step, field, message });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Errores de las RPC
// ---------------------------------------------------------------------------
export interface RpcErrorInfo {
  /** Prefijo del mensaje (JOB_INVALID, IN_REVIEW...) o null si no hay. */
  code: string | null;
  /** Códigos de detalle (JOB_INVALID: title_required, description_too_short). */
  details: string[];
  raw: string;
}

const KNOWN_CODES = [
  'JOB_INVALID', 'PUBLISH_REQUIRES_REVIEW', 'IN_REVIEW', 'STATUS_RESERVED', 'PROTECTED_FIELD', 'FORBIDDEN',
  'MOTIVO_REQUIRED', 'AUTH_REQUIRED', 'COMPANY_NOT_APPROVED', 'INVALID_STATE', 'INVALID_DECISION',
  'JOB_NOT_FOUND', 'DEADLINE_TOO_FAR', 'JOB_EXPIRED', 'MAX_QUESTIONS_REACHED', 'ACEPTACION_INVALIDA',
  'NO_AUTENTICADO', 'ACCEPTANCE_REQUIRED', 'UNDERAGE', 'QUESTION_HAS_ANSWERS', 'QUESTIONS_LOCKED', 'TITLE_TOO_LONG',
] as const;

export function parseRpcError(err: unknown): RpcErrorInfo {
  const e = err as { message?: string; details?: string; code?: string } | null | undefined;
  const raw = String(e?.message || (typeof err === 'string' ? err : '') || '');
  const m = /^\s*([A-Z][A-Z0-9_]{2,})\s*:/.exec(raw) || /^\s*([A-Z][A-Z0-9_]{2,})\b/.exec(raw);
  let code: string | null = m && (KNOWN_CODES as readonly string[]).includes(m[1]) ? m[1] : null;
  if (!code && /^\s*unauthorized/i.test(raw)) code = 'FORBIDDEN';
  if (!code && e?.code === '42501') code = 'FORBIDDEN';
  let details: string[] = [];
  if (code === 'JOB_INVALID') {
    const src = e?.details && /^[a-z_,\s]+$/.test(e.details) ? e.details : raw.replace(/^[^:]*:\s*/, '');
    details = src
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter((s) => /^[a-z][a-z_]+$/.test(s));
  }
  return { code, details, raw };
}

/** Texto de resumen del estado resultante de enviar a revisión. */
export function isReviewStatus(s: string | null | undefined): s is 'AI_REVIEW' | 'MANUAL_REVIEW' {
  return s === 'AI_REVIEW' || s === 'MANUAL_REVIEW';
}

/** Abre en el asistente la oferta de un id (rutas ya existentes en App.tsx). */
export function editJobPath(id: string, step?: number): string {
  return `/company/jobs/edit/${id}${step ? `?paso=${step}` : ''}`;
}

export function duplicateJobPath(id: string): string {
  return `/company/jobs/new?duplicar=${encodeURIComponent(id)}`;
}

/** Fecha corta localizada para tablas y fichas. */
export function formatDate(iso: string | null | undefined, lang: 'es' | 'en'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatMoney(amount: number | null | undefined, currency: string | null | undefined, lang: 'es' | 'en'): string {
  if (amount === null || amount === undefined) return '';
  try {
    return new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'es-ES', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${amount} ${currency || ''}`.trim();
  }
}
