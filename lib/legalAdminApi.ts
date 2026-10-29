/**
 * Panel de administracion: paises y versiones de las condiciones legales.
 *
 * Todo va contra la base REAL y bajo RLS de admin (`current_user_is_admin()`): el cliente solo da
 * mensajes claros y valida lo evidente; la autoridad es el servidor.
 *   - `countries`: SELECT publico; INSERT/UPDATE/DELETE solo admin.
 *   - `documentos_legales`: el admin lee TODAS las versiones (politica FOR ALL).
 *   - `legal_publicar_version(...)`: solo admin; exige >= 15 dias de antelacion (salvo la primera
 *     version de un tipo/idioma), inserta y encola el aviso por correo a los usuarios afectados.
 */
import { supabase } from '../supabase/client';
import type { LegalTipo } from './legal';

export const LEGAL_MIN_NOTICE_DAYS = 15;
export const LEGAL_TIPOS: readonly LegalTipo[] = ['terminos_candidato', 'terminos_empleador', 'condiciones_publicacion', 'privacidad', 'cookies'];
export const LEGAL_IDIOMAS = ['es', 'en'] as const;
export type LegalIdioma = (typeof LEGAL_IDIOMAS)[number];

/** Casillas obligatorias que se proponen para cada tipo (las claves exactas del contrato SQL). */
export const CASILLAS_POR_TIPO: Record<LegalTipo, string[]> = {
  terminos_candidato: ['acepto_condiciones_privacidad', 'datos_verdaderos'],
  terminos_empleador: ['poder_representacion', 'ofertas_reales_no_discriminatorias', 'anexo_encargo_tratamiento'],
  // Condiciones de publicación de ofertas (migración 20261035): casilla propia, se acepta en cada publicación.
  condiciones_publicacion: ['acepto_condiciones_publicacion'],
  privacidad: [],
  cookies: [],
};

// ---------------------------------------------------------------------------
// Paises
// ---------------------------------------------------------------------------

export interface AdminCountry {
  code: string;
  name_es: string;
  name_en: string;
  currency: string;
  active: boolean;
}

export interface CountryDraft {
  code: string;
  name_es: string;
  name_en: string;
  currency: string;
}

export type CountryField = keyof CountryDraft;
export type CountryError = 'required' | 'code' | 'currency' | 'duplicate' | 'long';

/** Errores por campo o {} si es valido. `existing` = codigos ya dados de alta (en mayusculas). */
export function validateCountry(d: CountryDraft, existing: ReadonlySet<string>): Partial<Record<CountryField, CountryError>> {
  const err: Partial<Record<CountryField, CountryError>> = {};
  const code = d.code.trim().toUpperCase();
  if (!code) err.code = 'required';
  else if (!/^[A-Z]{2}$/.test(code)) err.code = 'code';
  else if (existing.has(code)) err.code = 'duplicate';
  if (!d.name_es.trim()) err.name_es = 'required';
  else if (d.name_es.trim().length > 80) err.name_es = 'long';
  if (!d.name_en.trim()) err.name_en = 'required';
  else if (d.name_en.trim().length > 80) err.name_en = 'long';
  const cur = d.currency.trim().toUpperCase();
  if (!cur) err.currency = 'required';
  else if (!/^[A-Z]{3}$/.test(cur)) err.currency = 'currency';
  return err;
}

export async function fetchAdminCountries(): Promise<AdminCountry[]> {
  const { data, error } = await supabase
    .from('countries')
    .select('code, name_es, name_en, currency, active')
    .order('name_es', { ascending: true });
  if (error) throw error;
  return (data || []) as AdminCountry[];
}

export async function setCountryActive(code: string, active: boolean): Promise<void> {
  const { error } = await supabase.from('countries').update({ active }).eq('code', code);
  if (error) throw error;
}

export async function addCountry(d: CountryDraft): Promise<AdminCountry> {
  const row: AdminCountry = {
    code: d.code.trim().toUpperCase(),
    name_es: d.name_es.trim(),
    name_en: d.name_en.trim(),
    currency: d.currency.trim().toUpperCase(),
    active: true,
  };
  const { error } = await supabase.from('countries').insert(row);
  if (error) throw error;
  return row;
}

// ---------------------------------------------------------------------------
// Versiones de las condiciones
// ---------------------------------------------------------------------------

export interface AdminLegalVersion {
  id: string;
  tipo: LegalTipo;
  version: string;
  idioma: string;
  titulo: string;
  audiencia: string;
  requiere_aceptacion: boolean;
  casillas_obligatorias: string[];
  borrador: boolean;
  vigente_desde: string;
  created_at: string;
}

export const LEGAL_LIST_COLUMNS =
  'id, tipo, version, idioma, titulo, audiencia, requiere_aceptacion, casillas_obligatorias, borrador, vigente_desde, created_at';

export type LegalVersionStatus = 'vigente' | 'proxima' | 'anterior';

export async function fetchLegalVersions(): Promise<AdminLegalVersion[]> {
  const { data, error } = await supabase
    .from('documentos_legales')
    .select(LEGAL_LIST_COLUMNS)
    .order('vigente_desde', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data || []) as AdminLegalVersion[];
}

export async function fetchLegalVersionText(id: string): Promise<string> {
  const { data, error } = await supabase.from('documentos_legales').select('texto').eq('id', id).maybeSingle();
  if (error) throw error;
  return (data as { texto?: string } | null)?.texto ?? '';
}

/**
 * Estado de cada version dentro de su (tipo, idioma): la mas reciente que ya entro en vigor es la
 * `vigente`; las posteriores a hoy son `proxima`; las anteriores a la vigente, `anterior`.
 * Devuelve un mapa id -> estado.
 */
export function legalStatuses(rows: ReadonlyArray<AdminLegalVersion>, now: number = Date.now()): Map<string, LegalVersionStatus> {
  const out = new Map<string, LegalVersionStatus>();
  const groups = new Map<string, AdminLegalVersion[]>();
  for (const r of rows) {
    const k = `${r.tipo}:${r.idioma}`;
    const g = groups.get(k);
    if (g) g.push(r);
    else groups.set(k, [r]);
  }
  for (const group of groups.values()) {
    const past = group
      .filter((r) => new Date(r.vigente_desde).getTime() <= now)
      .sort((a, b) => new Date(b.vigente_desde).getTime() - new Date(a.vigente_desde).getTime());
    for (const r of group) {
      if (new Date(r.vigente_desde).getTime() > now) out.set(r.id, 'proxima');
      else out.set(r.id, past[0]?.id === r.id ? 'vigente' : 'anterior');
    }
  }
  return out;
}

/**
 * Fecha minima de entrada en vigor de una version nueva: 15 dias desde ahora, salvo que sea la
 * primera version de ese tipo/idioma o un documento que no requiere aceptacion (cookies), que
 * pueden entrar en vigor desde ahora.
 */
export function minEffectiveDate(
  tipo: LegalTipo,
  idioma: string,
  rows: ReadonlyArray<AdminLegalVersion>,
  now: number = Date.now(),
): { min: number; days: number } {
  const first = !rows.some((r) => r.tipo === tipo && r.idioma === idioma);
  const days = first || tipo === 'cookies' ? 0 : LEGAL_MIN_NOTICE_DAYS;
  return { min: now + days * 86400000, days };
}

export interface LegalDraft {
  tipo: LegalTipo;
  version: string;
  idioma: LegalIdioma;
  titulo: string;
  texto: string;
  /** Valor de un <input type="datetime-local"> (hora local, sin zona). */
  vigente_desde: string;
  casillas: string[];
}

export type LegalDraftError =
  | 'version_required' | 'version_long' | 'version_duplicate'
  | 'titulo_required' | 'texto_required' | 'fecha_required' | 'fecha_invalid' | 'fecha_early';

export type LegalDraftField = 'version' | 'titulo' | 'texto' | 'vigente_desde';

export function validateLegalDraft(
  d: LegalDraft,
  rows: ReadonlyArray<AdminLegalVersion>,
  now: number = Date.now(),
): Partial<Record<LegalDraftField, LegalDraftError>> {
  const err: Partial<Record<LegalDraftField, LegalDraftError>> = {};
  const v = d.version.trim();
  if (!v) err.version = 'version_required';
  else if (v.length > 20) err.version = 'version_long';
  else if (rows.some((r) => r.tipo === d.tipo && r.idioma === d.idioma && r.version === v)) err.version = 'version_duplicate';
  if (!d.titulo.trim()) err.titulo = 'titulo_required';
  if (!d.texto.trim()) err.texto = 'texto_required';
  if (!d.vigente_desde) err.vigente_desde = 'fecha_required';
  else {
    const t = new Date(d.vigente_desde).getTime();
    if (Number.isNaN(t)) err.vigente_desde = 'fecha_invalid';
    else if (t < minEffectiveDate(d.tipo, d.idioma, rows, now).min) err.vigente_desde = 'fecha_early';
  }
  return err;
}

/** Valor para <input type="datetime-local"> (hora local) de un instante. */
export function toLocalInput(ms: number): string {
  const d = new Date(ms);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Fecha por defecto de una version nueva: la primera hora en punto posterior al plazo minimo. */
export function defaultEffectiveInput(days: number, now: number = Date.now()): string {
  const base = new Date(now + days * 86400000 + 3600000);
  base.setMinutes(0, 0, 0);
  return toLocalInput(base.getTime());
}

export interface PublishResult {
  /** Usuarios a los que se ha encolado el aviso, si la RPC lo devuelve. */
  notified: number | null;
}

/** RPC `legal_publicar_version`: valida antelacion, inserta y encola el aviso por correo. */
export async function publishLegalVersion(d: LegalDraft): Promise<PublishResult> {
  const { data, error } = await supabase.rpc('legal_publicar_version', {
    p_tipo: d.tipo,
    p_version: d.version.trim(),
    p_idioma: d.idioma,
    p_titulo: d.titulo.trim(),
    p_texto: d.texto,
    p_vigente_desde: new Date(d.vigente_desde).toISOString(),
    p_casillas: d.casillas,
  });
  if (error) throw error;
  const obj = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const n = [obj.avisos, obj.encolados, obj.notified, typeof data === 'number' ? data : null]
    .find((x): x is number => typeof x === 'number');
  return { notified: n ?? null };
}

/** Mensaje del servidor -> codigo de error conocido (prefijo `CODIGO:`) o null. */
export function legalRpcCode(err: unknown): string | null {
  const e = err as { message?: string; code?: string } | null | undefined;
  const raw = String(e?.message || '');
  const m = /^\s*([A-Z][A-Z0-9_]{2,})\b/.exec(raw);
  if (m) return m[1];
  if (e?.code === '42501') return 'FORBIDDEN';
  if (e?.code === '23505') return 'DUPLICATE';
  return null;
}
