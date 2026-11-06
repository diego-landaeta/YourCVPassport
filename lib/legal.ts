/**
 * Bolsa de empleo, fase 1 (#6): acceso a los textos legales, registro de la
 * aceptacion, control de edad y paises.
 *
 * Contrato SQL: supabase/migrations/20261029_legal_aceptaciones_idioma.sql
 *   - documentos_legales: anon lee la version vigente de cada (tipo, idioma).
 *   - registrar_aceptacion(...): solo authenticated; la IP y el navegador los
 *     toma el SERVIDOR de las cabeceras, nunca se envian desde aqui.
 *   - documentos_pendientes(): versiones vigentes que el usuario aun no acepto.
 *   - countries: lectura publica.
 */
import { supabase } from '../supabase/client';
import { getLocalizedPath } from '../utils/canonicalUrl';

export type LegalTipo = 'terminos_candidato' | 'terminos_empleador' | 'condiciones_publicacion' | 'privacidad' | 'cookies';
export type LegalLang = 'es' | 'en';
export type LegalContexto = 'registro' | 'inscripcion' | 'publicacion' | 'nueva_version';
export type LegalAudiencia = 'todos' | 'candidato' | 'empleador';

export interface LegalDocument {
  id: string;
  tipo: LegalTipo;
  version: string;
  idioma: string;
  titulo: string;
  texto: string;
  audiencia: LegalAudiencia;
  casillas_obligatorias: string[];
  borrador: boolean;
  vigente_desde: string;
}

/** Fila que devuelve documentos_pendientes() (el id viene como documento_id). */
export interface PendingLegalDocument extends Omit<LegalDocument, 'id'> {
  documento_id: string;
}

export const LEGAL_DOC_COLUMNS =
  'id, tipo, version, idioma, titulo, texto, audiencia, casillas_obligatorias, borrador, vigente_desde' as const;

export const normalizeLegalLang = (lang: string | null | undefined): LegalLang =>
  (lang || '').toLowerCase().startsWith('en') ? 'en' : 'es';

/**
 * Ruta de la pagina legal en el idioma de la interfaz (/terminos, /privacidad en
 * espanol; /terms, /privacy en ingles). La ruta fija el idioma de la SPA: enlazar a
 * /terms desde la UI en espanol la cambiaria a ingles.
 */
export function legalPagePath(page: 'terms' | 'privacy', lang: string, query = '', hash = ''): string {
  const base = `/${page}`;
  const path = getLocalizedPath(base, normalizeLegalLang(lang)) ?? base;
  return `${path}${query}${hash}`;
}

// ---------------------------------------------------------------------------
// Casillas (claves exactas del contrato SQL)
// ---------------------------------------------------------------------------

export const CANDIDATE_REQUIRED = ['acepto_condiciones_privacidad', 'datos_verdaderos'] as const;
export const CANDIDATE_OPTIONAL = ['perfil_publico', 'aparecer_google', 'empresas_contacto', 'alertas_novedades'] as const;
/** Solo se exige a los candidatos de 16 y 17 anos (clausula 2.4). */
export const GUARDIAN_KEY = 'autorizacion_tutores';
export const EMPLOYER_REQUIRED = ['poder_representacion', 'ofertas_reales_no_discriminatorias', 'anexo_encargo_tratamiento'] as const;
export const EMPLOYER_OPTIONAL = ['novedades_comerciales'] as const;

export type Casillas = Record<string, boolean>;

export const emptyCasillas = (keys: readonly string[]): Casillas =>
  Object.fromEntries(keys.map((k) => [k, false]));

/** Id del <input> de cada casilla (el de condiciones conserva el historico). */
export const consentFieldId = (key: string): string =>
  key === 'acepto_condiciones_privacidad' ? 'agreeToTerms' : `consent-${key}`;

// ---------------------------------------------------------------------------
// Edad (fecha de nacimiento AAAA-MM-DD)
// ---------------------------------------------------------------------------

export const MIN_AGE = 16;
export const ADULT_AGE = 18;

/** Fecha valida (no futura, desde 1900) o null. Sin zona horaria: calendario local. */
export function parseBirthDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '');
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  if (y < 1900) return null;
  if (date.getTime() > Date.now()) return null;
  return date;
}

export function ageOn(birth: Date, ref: Date = new Date()): number {
  let age = ref.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    ref.getMonth() < birth.getMonth() ||
    (ref.getMonth() === birth.getMonth() && ref.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export type AgeStatus = 'empty' | 'invalid' | 'underage' | 'minor' | 'adult';

/**
 * - underage: menor de 16, no puede registrarse.
 * - minor: de 16 a 17 (menos de 18), registro con autorizacion de padres o tutores.
 */
export function ageStatus(value: string, ref: Date = new Date()): AgeStatus {
  if (!value) return 'empty';
  const birth = parseBirthDate(value);
  if (!birth) return 'invalid';
  const age = ageOn(birth, ref);
  if (age < MIN_AGE) return 'underage';
  if (age < ADULT_AGE) return 'minor';
  return 'adult';
}

// ---------------------------------------------------------------------------
// Documentos
// ---------------------------------------------------------------------------

/**
 * Version vigente de cada tipo en el idioma pedido (cae a espanol si no hay).
 * La RLS ya limita a las vigentes, pero un usuario con sesion tambien lee las
 * versiones antiguas que acepto: se elige la mas reciente que ya haya entrado
 * en vigor.
 */
export async function fetchLegalDocuments(
  tipos: LegalTipo[],
  lang: string,
): Promise<{ docs: Partial<Record<LegalTipo, LegalDocument>>; error: unknown }> {
  const wanted = normalizeLegalLang(lang);
  const idiomas = wanted === 'es' ? ['es'] : [wanted, 'es'];
  const { data, error } = await supabase
    .from('documentos_legales')
    .select(LEGAL_DOC_COLUMNS)
    .in('tipo', tipos)
    .in('idioma', idiomas);
  if (error || !data) return { docs: {}, error };

  const now = Date.now();
  const docs: Partial<Record<LegalTipo, LegalDocument>> = {};
  for (const tipo of tipos) {
    for (const idioma of idiomas) {
      const best = (data as LegalDocument[])
        .filter((d) => d.tipo === tipo && d.idioma === idioma && new Date(d.vigente_desde).getTime() <= now)
        .sort((a, b) => new Date(b.vigente_desde).getTime() - new Date(a.vigente_desde).getTime())[0];
      if (best) {
        docs[tipo] = best;
        break; // primer idioma de la lista que tenga texto
      }
    }
  }
  return { docs, error: null };
}

export async function fetchPendingLegalDocuments(): Promise<{ docs: PendingLegalDocument[]; error: unknown }> {
  const { data, error } = await supabase.rpc('documentos_pendientes');
  if (error) return { docs: [], error };
  return { docs: (data || []) as PendingLegalDocument[], error: null };
}

export interface AcceptInput {
  documentIds: string[];
  casillas: Casillas;
  contexto: LegalContexto;
  companyId?: string | null;
  ofertaId?: string | null;
}

/** Registra la aceptacion. La IP y el navegador NO se envian: los toma el servidor. */
export async function registerAcceptance(input: AcceptInput): Promise<{ error: unknown }> {
  const { error } = await supabase.rpc('registrar_aceptacion', {
    p_documento_ids: input.documentIds,
    p_casillas: input.casillas,
    p_contexto: input.contexto,
    p_oferta_id: input.ofertaId ?? null,
    p_company_id: input.companyId ?? null,
  });
  return { error };
}

/** Descarga el texto como .txt (clausula 2.3: el candidato puede descargar las condiciones). */
export function downloadLegalText(doc: Pick<LegalDocument, 'tipo' | 'version' | 'idioma' | 'titulo' | 'texto' | 'vigente_desde'>): void {
  const header = `${doc.titulo}\nv${doc.version} (${doc.idioma}) - ${doc.vigente_desde.slice(0, 10)}\nYourCVPassport\n\n`;
  const blob = new Blob([header + doc.texto + '\n'], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${doc.tipo}-v${doc.version}-${doc.idioma}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Paises
// ---------------------------------------------------------------------------

export interface CountryOption {
  code: string;
  name_es: string;
  name_en: string;
  currency: string;
}

export async function fetchActiveCountries(): Promise<{ countries: CountryOption[]; error: unknown }> {
  const { data, error } = await supabase
    .from('countries')
    .select('code, name_es, name_en, currency')
    .eq('active', true);
  if (error || !data) return { countries: [], error };
  return { countries: data as CountryOption[], error: null };
}

export const countryName = (c: CountryOption, lang: string): string =>
  normalizeLegalLang(lang) === 'en' ? c.name_en : c.name_es;

// ---------------------------------------------------------------------------
// Fecha de nacimiento tras el alta (S4): usuarios OAuth y anteriores a #6
// ---------------------------------------------------------------------------

/**
 * Fecha de nacimiento guardada del propio usuario (vista profiles_full).
 * - `string`: ya la tiene.
 * - `null`: la columna existe y esta vacia (OAuth, cuentas antiguas): hay que pedirla.
 * - `undefined`: no se pudo saber (sin perfil aun, columna inexistente, fallo de red).
 *   Quien llama NO bloquea en ese caso: el servidor exige la edad en apply_to_job/_job_submit.
 */
export async function fetchMyBirthDate(userId: string): Promise<string | null | undefined> {
  try {
    const { data, error } = await supabase
      .from('profiles_full')
      .select('fecha_nacimiento')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return undefined;
    const v = (data as { fecha_nacimiento?: string | null }).fecha_nacimiento;
    return v === undefined ? undefined : v;
  } catch {
    return undefined;
  }
}

export type SetBirthDateStatus = 'ok' | 'underage' | 'invalid' | 'already_set';

/** RPC set_my_birth_date: solo guarda si estaba vacia; <16 anos no se guarda (la edad la calcula el servidor en UTC). */
export async function setMyBirthDate(birthDate: string): Promise<{ status: SetBirthDateStatus | null; error: unknown }> {
  const { data, error } = await supabase.rpc('set_my_birth_date', { p_birth_date: birthDate });
  if (error) return { status: null, error };
  const status = (data as { status?: string } | null)?.status;
  if (status === 'ok' || status === 'underage' || status === 'invalid' || status === 'already_set') {
    return { status, error: null };
  }
  return { status: null, error: new Error('set_my_birth_date: respuesta inesperada') };
}

// Aviso «menor de 16» que sobrevive al cierre de sesion hasta que /login lo muestra.
const UNDERAGE_NOTICE_KEY = 'ycvp.underage-notice';

export function rememberUnderageNotice(): void {
  try { sessionStorage.setItem(UNDERAGE_NOTICE_KEY, '1'); } catch { /* sin almacenamiento: se pierde solo el aviso */ }
}

export function hasUnderageNotice(): boolean {
  try { return sessionStorage.getItem(UNDERAGE_NOTICE_KEY) === '1'; } catch { return false; }
}

export function clearUnderageNotice(): void {
  try { sessionStorage.removeItem(UNDERAGE_NOTICE_KEY); } catch { /* ignorar */ }
}

// ---------------------------------------------------------------------------
// Aviso de nueva version (15 dias de antelacion)
// ---------------------------------------------------------------------------

/** Fila de `legal_aviso_proximo()`: version futura (<= 15 dias) que el usuario aun no ha aceptado. */
export interface LegalNotice {
  tipo: LegalTipo;
  version: string;
  idioma: string;
  titulo: string;
  vigente_desde: string;
  dias_restantes: number;
}

const LEGAL_TIPOS: ReadonlySet<string> = new Set(['terminos_candidato', 'terminos_empleador', 'condiciones_publicacion', 'privacidad', 'cookies']);

/**
 * Avisos de versiones proximas para el usuario con sesion. Falla EN SILENCIO (devuelve []): si la RPC
 * aun no existe (migracion sin aplicar), no hay sesion o la red falla, la app sigue igual.
 */
export async function fetchLegalNotices(): Promise<LegalNotice[]> {
  try {
    const { data, error } = await supabase.rpc('legal_aviso_proximo');
    if (error || !Array.isArray(data)) return [];
    return (data as Partial<LegalNotice>[])
      .filter((n): n is LegalNotice =>
        !!n && typeof n.tipo === 'string' && LEGAL_TIPOS.has(n.tipo) && typeof n.version === 'string'
        && typeof n.vigente_desde === 'string' && !Number.isNaN(new Date(n.vigente_desde).getTime()))
      .map((n) => ({ ...n, titulo: n.titulo || '', idioma: n.idioma || 'es', dias_restantes: Number(n.dias_restantes) || 0 }));
  } catch {
    return [];
  }
}

/** Tipos de documento que afectan a cada ambito (los mismos que pide la puerta de aceptacion). */
export const noticeTiposFor = (scope: 'candidato' | 'empleador'): LegalTipo[] =>
  scope === 'candidato' ? ['terminos_candidato', 'privacidad'] : ['terminos_empleador', 'condiciones_publicacion', 'privacidad'];

export const noticeKey = (n: Pick<LegalNotice, 'tipo' | 'version' | 'idioma'>): string => `${n.tipo}:${n.version}:${n.idioma}`;

// Avisos descartados: solo durante la sesion del navegador (vuelven en la proxima).
const NOTICE_DISMISSED_KEY = 'ycvp.legal-notice-dismissed';

export function readDismissedNotices(): Set<string> {
  try {
    const raw = sessionStorage.getItem(NOTICE_DISMISSED_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function dismissNotice(key: string): void {
  try {
    const set = readDismissedNotices();
    set.add(key);
    sessionStorage.setItem(NOTICE_DISMISSED_KEY, JSON.stringify([...set]));
  } catch { /* sin almacenamiento: el aviso se oculta solo en esta vista */ }
}

/**
 * Texto de una version aun no vigente. La politica de `documentos_legales` deja leer a un usuario con
 * sesion las versiones futuras <= 15 dias (no borrador); sin sesion devuelve null.
 */
export async function fetchUpcomingLegalDocument(
  tipo: LegalTipo,
  version: string,
  idioma: string,
): Promise<LegalDocument | null> {
  try {
    const { data, error } = await supabase
      .from('documentos_legales')
      .select(LEGAL_DOC_COLUMNS)
      .eq('tipo', tipo)
      .eq('version', version)
      .eq('idioma', idioma)
      .maybeSingle();
    if (error || !data) return null;
    return data as LegalDocument;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Casillas opcionales (consent_prefs)
// ---------------------------------------------------------------------------

/** Las unicas claves que acepta `save_consent_prefs`. Cualquier otra se ignora aqui antes de enviar. */
export const CONSENT_PREF_KEYS = ['perfil_publico', 'aparecer_google', 'empresas_contacto', 'alertas_novedades'] as const;
export type ConsentPrefKey = (typeof CONSENT_PREF_KEYS)[number];

/** Se queda solo con las 4 claves permitidas y con valores booleanos. */
export function pickConsentPrefs(casillas: Record<string, unknown> | null | undefined): Partial<Record<ConsentPrefKey, boolean>> {
  const out: Partial<Record<ConsentPrefKey, boolean>> = {};
  if (!casillas) return out;
  for (const key of CONSENT_PREF_KEYS) {
    if (typeof casillas[key] === 'boolean') out[key] = casillas[key] as boolean;
  }
  return out;
}

/**
 * Guarda las casillas opcionales con `save_consent_prefs(p_prefs)`: solo las 4 claves, fusionadas en
 * `profiles.consent_prefs`. NO cambia la visibilidad del perfil (`profile_hidden`/`search_blocked`).
 * No lanza: si la RPC no existe todavia o falla, devuelve el error y la app sigue.
 */
export async function saveConsentPrefs(casillas: Record<string, unknown> | null | undefined): Promise<{ saved: boolean; error: unknown }> {
  const prefs = pickConsentPrefs(casillas);
  if (Object.keys(prefs).length === 0) return { saved: false, error: null };
  try {
    const { error } = await supabase.rpc('save_consent_prefs', { p_prefs: prefs });
    return { saved: !error, error };
  } catch (error) {
    return { saved: false, error };
  }
}

/** Casillas opcionales ya guardadas del propio usuario (profiles_full.consent_prefs). {} si no se puede leer. */
export async function fetchMyConsentPrefs(userId: string): Promise<Partial<Record<ConsentPrefKey, boolean>>> {
  try {
    const { data, error } = await supabase
      .from('profiles_full')
      .select('consent_prefs')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data) return {};
    return pickConsentPrefs((data as { consent_prefs?: Record<string, unknown> | null }).consent_prefs);
  } catch {
    return {};
  }
}
