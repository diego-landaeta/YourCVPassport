/**
 * Mocks reutilizables para los specs `*.local.spec.ts`.
 *
 * - Sesion falsa de Supabase inyectada en localStorage (`yourcvpassport-auth`) con
 *   un JWT inventado. No hay login real.
 * - Router de Supabase que responde en local TODO lo que va a `*.supabase.co`:
 *     REST (PostgREST): entiende `select`, `order`, `limit`/`offset`, cabecera `Range`,
 *     filtros `eq|neq|gt|gte|lt|lte|is|in|like|ilike` (tambien con `not.`), grupos
 *     `or=(...)`/`and(...)` con valores entre comillas, `Prefer: count=exact`,
 *     `HEAD` y la cabecera `Content-Range` de respuesta.
 *   Las escrituras (POST/PATCH/PUT/DELETE) NO se aplican: se registran y se responde OK.
 * - Cualquier otro origen externo se aborta y los WebSocket se cierran.
 *
 * Nada de lo que se hace aqui sale a produccion.
 */
import type { BrowserContext, Page, Route } from '@playwright/test';

export type Row = Record<string, any>;
export type MockDb = Record<string, Row[]>;

export interface RecordedRequest {
  method: string;
  table: string;
  /** Query string decodificada (para asserts legibles). */
  query: string;
  params: Record<string, string[]>;
  range: string | null;
  prefer: string | null;
  accept: string | null;
}

export interface SupabaseMock {
  db: MockDb;
  requests: RecordedRequest[];
  writes: { method: string; url: string; body: string | null }[];
  /** Peticiones REST a una tabla (opcionalmente solo GET/HEAD de listado). */
  requestsTo(table: string): RecordedRequest[];
  clear(): void;
}

// ---------------------------------------------------------------------------
// Opciones de contexto OBLIGATORIAS para specs con mocks
// ---------------------------------------------------------------------------

/**
 * Usar siempre con `test.use(SAFE_CONTEXT_OPTIONS)` o al crear contextos a mano.
 *
 * - `serviceWorkers: 'block'`: la app registra /sw.js; en WebKit, una vez que el
 *   service worker controla la pagina, sus peticiones NO pasan por `route` y
 *   saldrian a la Supabase real (comprobado con Playwright 1.57).
 * - `proxy` muerto: red de seguridad. Cualquier peticion externa que no
 *   intercepte el router falla con "could not connect" en vez de llegar a produccion.
 */
export const SAFE_CONTEXT_OPTIONS = {
  serviceWorkers: 'block' as const,
  proxy: { server: 'http://127.0.0.1:9', bypass: 'localhost,127.0.0.1' },
};

// ---------------------------------------------------------------------------
// Datos de prueba
// ---------------------------------------------------------------------------

export const ADMIN_ID = '00000000-0000-4000-8000-00000000a001';

const ROLES_CYCLE = ['professional', 'professional', 'professional', 'employer', 'profile_manager', null] as const;
const PLANS_CYCLE = ['free', 'free', 'basic', 'pro', 'enterprise'] as const;

/**
 * Genera `n` perfiles deterministas. El primero es el admin de la sesion falsa.
 * Los roles siguen `profiles_role_check` (professional | employer | admin |
 * profile_manager) mas `null`, que el trigger normalizador puede producir.
 */
export function makeProfiles(n = 117): Row[] {
  const rows: Row[] = [];
  for (let i = 0; i < n; i++) {
    const isAdmin = i < 2;
    const role = isAdmin ? 'admin' : ROLES_CYCLE[i % ROLES_CYCLE.length];
    rows.push({
      id: i === 0 ? ADMIN_ID : `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`,
      full_name: isAdmin ? `Admin ${i + 1}` : `Profesional ${String(i).padStart(3, '0')}`,
      email: isAdmin ? `admin${i + 1}@example.test` : `pro${i}@example.test`,
      role,
      // Cada 10 perfiles uno suspendido; algunos con is_active null (= activo).
      is_active: i % 10 === 9 ? false : i % 7 === 3 ? null : true,
      plan: isAdmin ? 'enterprise' : PLANS_CYCLE[i % PLANS_CYCLE.length],
      slug: `perfil-${i}`,
      headline: i % 2 ? 'Ingeniera de datos' : 'Product manager',
      location: i % 3 ? 'Madrid, ES' : 'Austin, US',
      country_code: i % 3 ? 'ES' : 'US',
      photo_url: null,
      avatar_url: null,
      // Todos el mismo dia para i par: obliga a desempatar por id (orden estable).
      created_at: new Date(Date.UTC(2026, 0, 1) + Math.floor(i / 2) * 86400000).toISOString(),
      updated_at: new Date(Date.UTC(2026, 0, 1) + i * 86400000).toISOString(),
      template: 'classic',
      wizard_completed: true,
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Sesion falsa
// ---------------------------------------------------------------------------

function b64url(o: unknown): string {
  return Buffer.from(JSON.stringify(o)).toString('base64url');
}

export function buildFakeSession(profile: Row) {
  const exp = Math.floor(Date.now() / 1000) + 3600 * 24;
  const fakeJwt = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: profile.id, role: 'authenticated', exp, aud: 'authenticated', email: profile.email })}.firma-falsa`;
  const user = {
    id: profile.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: profile.email,
    app_metadata: { provider: 'email' },
    user_metadata: { full_name: profile.full_name },
    created_at: '2026-01-01T00:00:00Z',
  };
  return { access_token: fakeJwt, token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'refresh-falso', user };
}

export interface InitOptions {
  /** Perfil con el que se crea la sesion; sin el, no hay sesion. */
  sessionProfile?: Row | null;
  theme?: 'light' | 'dark';
  language?: 'es' | 'en';
}

/** Inyecta sesion, idioma y tema en localStorage antes de que cargue la app. */
export async function installInitState(context: BrowserContext, opts: InitOptions = {}) {
  const session = opts.sessionProfile ? buildFakeSession(opts.sessionProfile) : null;
  await context.addInitScript(([s, theme, language]) => {
    try {
      if (s) localStorage.setItem('yourcvpassport-auth', JSON.stringify(s));
      localStorage.setItem('language', language as string);
      localStorage.setItem('theme', theme as string);
    } catch { /* storage bloqueado: la app arranca sin sesion */ }
  }, [session, opts.theme ?? 'light', opts.language ?? 'es'] as const);
}

// ---------------------------------------------------------------------------
// Motor PostgREST minimo
// ---------------------------------------------------------------------------

/** Separa por comas de primer nivel respetando parentesis y comillas. */
function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0, inQ = false, cur = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQ) {
      if (c === '\\' && i + 1 < s.length) { cur += c + s[++i]; continue; }
      if (c === '"') inQ = false;
      cur += c;
      continue;
    }
    if (c === '"') { inQ = true; cur += c; continue; }
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  if (cur) out.push(cur);
  return out;
}

function unquote(v: string): string {
  if (v.length >= 2 && v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\(.)/g, '$1');
  }
  return v;
}

function likeToRegex(pattern: string, insensitive: boolean): RegExp {
  // PostgREST traduce `*` a `%` en like/ilike.
  const p = pattern.replace(/\*/g, '%');
  let re = '';
  for (const ch of p) {
    if (ch === '%') re += '.*';
    else if (ch === '_') re += '.';
    else re += ch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`, insensitive ? 'is' : 's');
}

function cmpValues(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a) < String(b) ? -1 : String(a) > String(b) ? 1 : 0;
}

function coerce(raw: string): any {
  if (raw === 'null') return null;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return raw;
}

type Predicate = (row: Row) => boolean;

/** `op.value` (con `not.` opcional) -> predicado sobre la columna. */
function opPredicate(column: string, opExpr: string): Predicate {
  let negate = false;
  let expr = opExpr;
  if (expr.startsWith('not.')) { negate = true; expr = expr.slice(4); }
  const dot = expr.indexOf('.');
  const op = expr.slice(0, dot);
  const rawVal = unquote(expr.slice(dot + 1));
  let p: Predicate;
  switch (op) {
    case 'eq': p = r => String(r[column]) === rawVal && r[column] != null; break;
    case 'neq': p = r => r[column] != null && String(r[column]) !== rawVal; break;
    case 'gt': p = r => cmpValues(r[column], rawVal) > 0 && r[column] != null; break;
    case 'gte': p = r => cmpValues(r[column], rawVal) >= 0 && r[column] != null; break;
    case 'lt': p = r => cmpValues(r[column], rawVal) < 0 && r[column] != null; break;
    case 'lte': p = r => cmpValues(r[column], rawVal) <= 0 && r[column] != null; break;
    case 'is': { const v = coerce(rawVal); p = r => (v === null ? r[column] == null : r[column] === v); break; }
    case 'in': {
      const list = splitTopLevel(rawVal.replace(/^\(|\)$/g, '')).map(unquote);
      p = r => r[column] != null && list.includes(String(r[column]));
      break;
    }
    case 'like':
    case 'ilike': {
      const re = likeToRegex(rawVal, op === 'ilike');
      p = r => r[column] != null && re.test(String(r[column]));
      break;
    }
    default:
      // Operador no soportado por el mock: no filtra (se ve en `requests`).
      p = () => true;
  }
  return negate ? (r => !p(r)) : p;
}

/** Parsea el contenido de un grupo `or(...)`/`and(...)`. */
function groupPredicate(kind: 'or' | 'and', inner: string): Predicate {
  const parts = splitTopLevel(inner).map(part => {
    const m = part.match(/^(not\.)?(or|and)\((.*)\)$/s);
    if (m) {
      const g = groupPredicate(m[2] as 'or' | 'and', m[3]);
      return m[1] ? ((r: Row) => !g(r)) : g;
    }
    const dot = part.indexOf('.');
    return opPredicate(part.slice(0, dot), part.slice(dot + 1));
  });
  return kind === 'or' ? (r => parts.some(p => p(r))) : (r => parts.every(p => p(r)));
}

const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns']);

function applyQuery(rows: Row[], params: URLSearchParams): Row[] {
  let out = rows.slice();
  for (const [key, value] of params.entries()) {
    if (RESERVED.has(key)) continue;
    if (key === 'or' || key === 'and') {
      out = out.filter(groupPredicate(key, value.replace(/^\(|\)$/g, '')));
      continue;
    }
    if (key === 'not.or' || key === 'not.and') {
      const g = groupPredicate(key.slice(4) as 'or' | 'and', value.replace(/^\(|\)$/g, ''));
      out = out.filter(r => !g(r));
      continue;
    }
    out = out.filter(opPredicate(key, value));
  }
  const order = params.get('order');
  if (order) {
    const keys = order.split(',').map(k => {
      const [col, ...mods] = k.split('.');
      return { col, desc: mods.includes('desc'), nullsFirst: mods.includes('nullsfirst') };
    });
    out.sort((a, b) => {
      for (const k of keys) {
        const av = a[k.col], bv = b[k.col];
        if (av == null || bv == null) {
          if (av == null && bv == null) continue;
          const nullCmp = av == null ? -1 : 1;
          return k.nullsFirst ? nullCmp : -nullCmp;
        }
        const c = cmpValues(av, bv);
        if (c !== 0) return k.desc ? -c : c;
      }
      return 0;
    });
  }
  return out;
}

function project(row: Row, select: string | null): Row {
  if (!select || select.split(',').some(c => c.trim() === '*')) return row;
  const out: Row = {};
  for (const raw of splitTopLevel(select)) {
    const part = raw.trim();
    const embed = part.match(/^(?:(\w+):)?(\w+)(?:!\w+)?\((.*)\)$/s);
    if (embed) { out[embed[1] || embed[2]] = row[embed[2]] ?? []; continue; }
    const [aliasOrCol, col] = part.includes(':') && !part.includes('::') ? part.split(':') : [part, part];
    const clean = col.split('::')[0];
    out[aliasOrCol.split('::')[0]] = row[clean] ?? null;
  }
  return out;
}

/**
 * Filas de una tabla del mock. Las vistas de la BD real se sirven a partir de
 * su tabla base si el spec no las define:
 *   - profiles_full: vista con todas las columnas (perfil propio / gestor / admin);
 *   - public_stamps: sellos VERIFIED sin evidence.
 * (El mock no aplica privilegios ni RLS: eso se prueba en PGlite.)
 */
function tableRows(db: MockDb, table: string): Row[] {
  if (db[table]) return db[table];
  if (table === 'profiles_full') return db.profiles ?? [];
  if (table === 'public_stamps') {
    return (db.stamps ?? [])
      .filter(s => s.status === 'VERIFIED')
      .map(({ evidence, admin_notes, verified_by, ...rest }) => rest);
  }
  return [];
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export interface MockOptions {
  /** Respuestas fijas para `/rest/v1/rpc/<fn>`. Por defecto `null`. */
  rpc?: Record<string, unknown>;
  /** Hosts locales permitidos (por defecto localhost y 127.0.0.1). */
  allowHosts?: string[];
  /** Responder 503 a `/api/*` del servidor local (por defecto true). */
  stubLocalApi?: boolean;
}

/**
 * Instala el router en el contexto. Todas las paginas del contexto quedan
 * aisladas de produccion.
 */
export async function mockSupabase(target: BrowserContext | Page, db: MockDb, opts: MockOptions = {}): Promise<SupabaseMock> {
  const requests: RecordedRequest[] = [];
  const writes: SupabaseMock['writes'] = [];
  const allow = new Set(opts.allowHosts ?? ['localhost', '127.0.0.1']);

  await target.routeWebSocket(/.*/, ws => ws.close());

  await target.route('**/*', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (allow.has(url.hostname)) {
      // `/api/*` lo sirve el middleware de Vite (p. ej. /api/translate), que desde
      // Node llama a proveedores externos: se corta aqui con un 503.
      if (url.pathname.startsWith('/api/') && opts.stubLocalApi !== false) {
        return route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'stub QA: /api deshabilitada' }) });
      }
      return route.continue();
    }
    if (!url.hostname.endsWith('supabase.co')) return route.abort();

    const method = req.method();
    const headers = req.headers();
    const cors = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' };
    const json = (status: number, body?: unknown, extra: Record<string, string> = {}) =>
      route.fulfill({ status, contentType: 'application/json', headers: { ...cors, ...extra }, body: body === undefined ? '' : JSON.stringify(body) });

    if (method === 'OPTIONS') {
      // `*` no cubre `Authorization` segun la especificacion (WebKit lo aplica):
      // se devuelven explicitamente las cabeceras que pide el preflight.
      const askedHeaders = headers['access-control-request-headers'] || 'authorization,apikey,content-type,prefer,range,x-client-info,accept-profile,content-profile';
      return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': askedHeaders, 'access-control-allow-methods': 'GET,HEAD,POST,PATCH,PUT,DELETE,OPTIONS', 'access-control-max-age': '600' } });
    }
    if (url.pathname.startsWith('/auth/v1/user')) {
      const admin = (db.profiles || []).find(p => p.id === ADMIN_ID);
      return json(200, admin ? buildFakeSession(admin).user : {});
    }
    if (url.pathname.startsWith('/auth/v1/')) return json(200, {});
    if (url.pathname.startsWith('/functions/v1/')) return json(200, {});
    if (url.pathname.startsWith('/storage/v1/')) return json(200, []);
    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const fn = url.pathname.replace('/rest/v1/rpc/', '');
      return json(200, opts.rpc?.[fn] ?? null);
    }
    if (!url.pathname.startsWith('/rest/v1/')) return json(404, {});

    const table = url.pathname.replace('/rest/v1/', '');
    if (method !== 'GET' && method !== 'HEAD') {
      writes.push({ method, url: decodeURIComponent(url.pathname + url.search), body: req.postData() });
      return json(200, []);
    }

    const params: Record<string, string[]> = {};
    for (const [k, v] of url.searchParams.entries()) (params[k] ||= []).push(v);
    requests.push({
      method,
      table,
      query: decodeURIComponent(url.search),
      params,
      range: headers['range'] ?? null,
      prefer: headers['prefer'] ?? null,
      accept: headers['accept'] ?? null,
    });

    const all = applyQuery(tableRows(db, table), url.searchParams);
    const total = all.length;
    const wantsCount = (headers['prefer'] || '').includes('count=');

    let from = 0;
    let to = total - 1;
    const rangeHdr = headers['range'];
    if (rangeHdr) {
      const m = rangeHdr.match(/(\d+)-(\d*)/);
      if (m) { from = Number(m[1]); if (m[2]) to = Number(m[2]); }
    }
    const offset = url.searchParams.get('offset');
    const limit = url.searchParams.get('limit');
    if (offset) from = Number(offset);
    if (limit) to = from + Number(limit) - 1;
    to = Math.min(to, total - 1);

    const page = from <= to ? all.slice(from, to + 1) : [];
    const contentRange = page.length ? `${from}-${from + page.length - 1}/${wantsCount ? total : '*'}` : `*/${wantsCount ? total : '*'}`;

    if (method === 'HEAD') return json(200, undefined, { 'content-range': contentRange });

    const select = url.searchParams.get('select');
    const body = page.map(r => project(r, select));
    if ((headers['accept'] || '').includes('vnd.pgrst.object')) {
      if (body.length !== 1) return json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: `Results contain ${body.length} rows`, hint: null });
      return json(200, body[0], { 'content-range': contentRange });
    }
    return json(200, body, { 'content-range': contentRange });
  });

  return {
    db,
    requests,
    writes,
    requestsTo: (table: string) => requests.filter(r => r.table === table),
    clear: () => { requests.length = 0; writes.length = 0; },
  };
}

// ---------------------------------------------------------------------------
// Utilidades de color / contraste
// ---------------------------------------------------------------------------

function luminance(rgb: string): number {
  const m = (rgb.match(/[\d.]+/g) || []).map(Number);
  const c = m.slice(0, 3).map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

/** Ratio de contraste WCAG entre dos colores `rgb(...)`. */
export function contrastRatio(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Desactiva transiciones/animaciones para leer colores finales estables. */
export async function freezeMotion(page: Page) {
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important;caret-color:transparent!important}' });
}
