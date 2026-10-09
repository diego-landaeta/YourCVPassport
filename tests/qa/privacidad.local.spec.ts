/**
 * Privacidad de `profiles` y `stamps` (auditoría 2026-10-05, C1 y A1).
 *
 * Desde 20261006_cerrar_columnas_privadas_profiles_stamps.sql anon y authenticated
 * solo pueden leer columnas públicas de `profiles`, y `stamps` no es legible para
 * terceros (lo público sale de la vista `public_stamps`). Aquí se comprueba, con
 * Supabase MOCKEADO (nada sale a producción), que las páginas públicas:
 *   - piden a `profiles` (directamente o embebido en otra tabla) solo columnas
 *     públicas: nunca `*`, email, phone, plan, salario, managed_by, moderación...;
 *   - leen los sellos de `public_stamps`, nunca de `stamps`;
 *   - siguen mostrando los datos mock.
 * Que la BD deniegue de verdad esas columnas se prueba aparte en PGlite.
 *
 *   QA_PORT=5370 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/privacidad.local.spec.ts --output=test-results/qa-privacidad
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, makeProfiles, installInitState, mockSupabase, type SupabaseMock, type RecordedRequest, type Row } from './helpers/supabaseMock';
import {
  PUBLIC_PROFILE_COLUMN_LIST,
  PUBLIC_PROFILE_COLUMNS,
  PRIVATE_PROFILE_COLUMN_LIST,
} from '../../lib/publicProfileColumns';

test.use(SAFE_CONTEXT_OPTIONS);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

const PRIVATE = new Set<string>(PRIVATE_PROFILE_COLUMN_LIST);
const PUBLIC = new Set<string>(PUBLIC_PROFILE_COLUMN_LIST);
const STAMP_PRIVATE = ['evidence', 'admin_notes', 'verified_by'];

// ---------------------------------------------------------------------------
// Análisis del parámetro select de PostgREST
// ---------------------------------------------------------------------------

/** Separa por comas de primer nivel (respeta paréntesis). */
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = '';
  for (const c of s) {
    if (c === '(') depth++;
    if (c === ')') depth--;
    if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Nombre de columna de un elemento simple del select (quita alias y casts). */
function columnName(item: string): string {
  const noCast = item.split('::')[0];
  const parts = noCast.split(':');
  return parts[parts.length - 1].trim();
}

/**
 * Listas de columnas pedidas a `profiles` en una petición: el select directo
 * si la tabla es profiles, y cada embed `profiles(...)`, `alias:profiles!fk(...)`
 * o `profiles:fk(...)` dentro de cualquier otra tabla.
 */
function profileColumnLists(req: RecordedRequest): string[][] {
  const select = req.params.select?.[0] ?? '*';
  const lists: string[][] = [];
  const walk = (sel: string, isProfiles: boolean) => {
    const own: string[] = [];
    for (const item of splitTop(sel)) {
      const m = item.match(/^(?:([\w]+):)?([\w]+)(?:!([\w]+))?\s*\(([\s\S]*)\)$/);
      if (m) {
        const [, alias, target] = m;
        // `profiles:profile_id(...)` (columna FK) también apunta a profiles
        const embedsProfiles = target === 'profiles' || (alias === 'profiles' && /_id$/.test(target));
        walk(m[4], embedsProfiles);
        continue;
      }
      own.push(columnName(item));
    }
    if (isProfiles) lists.push(own);
  };
  walk(select, req.table === 'profiles');
  return lists;
}

function assertOnlyPublicProfileColumns(mock: SupabaseMock) {
  const offenders: string[] = [];
  let checked = 0;
  for (const req of mock.requests) {
    for (const cols of profileColumnLists(req)) {
      checked++;
      for (const c of cols) {
        if (c === '*' || PRIVATE.has(c) || !PUBLIC.has(c)) offenders.push(`${req.table}?select=${req.params.select?.[0] ?? '(sin select)'} -> ${c}`);
      }
    }
    // Filtros/orden sobre columnas privadas también darían 42501
    if (req.table === 'profiles') {
      for (const key of Object.keys(req.params)) {
        if (PRIVATE.has(key)) offenders.push(`profiles filtro ${key}`);
      }
      const order = req.params.order?.[0] || '';
      for (const o of order.split(',')) if (PRIVATE.has(o.split('.')[0])) offenders.push(`profiles order ${o}`);
      const or = req.params.or?.[0] || '';
      for (const c of PRIVATE) if (new RegExp(`\\b${c}\\.`).test(or)) offenders.push(`profiles or= ${c}`);
    }
  }
  expect(offenders, 'columnas no públicas pedidas a profiles').toEqual([]);
  return checked;
}

function assertNoStampsTable(mock: SupabaseMock) {
  const direct = mock.requests.filter((r) => r.table === 'stamps');
  expect(direct.map((r) => r.query), 'las páginas públicas no leen la tabla stamps').toEqual([]);
  for (const r of mock.requestsTo('public_stamps')) {
    const sel = r.params.select?.[0] ?? '*';
    for (const c of STAMP_PRIVATE) expect(sel.includes(c), `public_stamps select pide ${c}`).toBe(false);
  }
  // Embeds de stamps en otras tablas (p. ej. profiles?select=*,stamps(...))
  for (const r of mock.requests) {
    expect(/(^|,|\()\s*stamps\s*\(/.test(r.params.select?.[0] ?? ''), `embed de stamps en ${r.table}`).toBe(false);
  }
}

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------

const SECRET_PHONE = '+34 600 111 222';
const SECRET_EMAIL = 'laura.privada@example.test';

function withPrivateData(rows: Row[]): Row[] {
  return rows.map((r, i) => ({
    ...r,
    email: r.email ?? `p${i}@example.test`,
    phone: `+34 600 000 ${String(i).padStart(3, '0')}`,
    salary_min: 30000 + i,
    salary_max: 50000 + i,
    salary_currency: 'EUR',
    managed_by: null,
    suspension_reason: null,
    search_blocked: false,
    messages_blocked: false,
    gender: i % 2 ? 'female' : 'male',
    summary: r.summary ?? 'Resumen profesional de prueba con experiencia.',
    is_premium: r.plan ? r.plan !== 'free' : false,
    profile_hidden: false,
  }));
}

const CV_ID = '00000000-0000-4000-8000-0000000c0001';
const cvProfile: Row = {
  id: CV_ID,
  full_name: 'Laura Privacidad',
  headline: 'Ingeniera de datos',
  summary: 'Diez años construyendo plataformas de datos.',
  slug: 'laura-privacidad',
  template: 'green-minimal',
  template_color: null,
  email: SECRET_EMAIL,
  phone: SECRET_PHONE,
  plan: 'pro',
  is_premium: true,
  salary_min: 60000,
  salary_max: 80000,
  role: 'professional',
  is_active: true,
  profile_hidden: false,
  wizard_completed: true,
  gender: 'female',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-02T00:00:00Z',
};

const stampsFor = (profileId: string): Row[] => [
  { id: `${profileId.slice(0, -3)}s01`, profile_id: profileId, type: 'EMAIL', status: 'VERIFIED', verified_at: '2026-02-01T00:00:00Z', evidence: { email: SECRET_EMAIL }, admin_notes: 'nota interna', verified_by: ADMIN_ID, metadata: {} },
  { id: `${profileId.slice(0, -3)}s02`, profile_id: profileId, type: 'IDENTITY', status: 'VERIFIED', verified_at: '2026-02-02T00:00:00Z', evidence: { document_number: '****9876' }, admin_notes: null, verified_by: ADMIN_ID, metadata: {} },
  { id: `${profileId.slice(0, -3)}s03`, profile_id: profileId, type: 'EDUCATION', status: 'PENDING', verified_at: null, evidence: { degree: 'x' }, admin_notes: null, verified_by: null, metadata: {} },
];

async function gotoAndWait(page: Page, route: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
}

// ---------------------------------------------------------------------------
// Coherencia de las listas de columnas (frontend, Edge Functions, migración)
// ---------------------------------------------------------------------------
test.describe('listas de columnas públicas', () => {
  test('frontend, Edge Functions y migración usan la misma lista', async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'comprobación estática: basta un navegador');
    expect(PUBLIC_PROFILE_COLUMN_LIST.join(', ')).toBe(PUBLIC_PROFILE_COLUMNS);
    for (const c of PRIVATE_PROFILE_COLUMN_LIST) expect(PUBLIC.has(c), `${c} no puede ser pública`).toBe(false);

    const edge = fs.readFileSync(path.join(ROOT, 'supabase/functions/_shared/publicProfileColumns.ts'), 'utf8');
    const edgeList = [...edge.slice(edge.indexOf('['), edge.indexOf(']')).matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(edgeList).toEqual([...PUBLIC_PROFILE_COLUMN_LIST]);

    const sql = fs.readFileSync(path.join(ROOT, 'supabase/migrations/20261006_cerrar_columnas_privadas_profiles_stamps.sql'), 'utf8');
    const block = sql.slice(sql.indexOf('v_public text[] := ARRAY['), sql.indexOf('];', sql.indexOf('v_public text[] := ARRAY[')));
    const sqlList = [...block.matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(sqlList).toEqual([...PUBLIC_PROFILE_COLUMN_LIST]);
    const priv = sql.slice(sql.indexOf('v_private text[] := ARRAY['), sql.indexOf('];', sql.indexOf('v_private text[] := ARRAY[')));
    expect([...priv.matchAll(/'([a-z_]+)'/g)].map((m) => m[1])).toEqual([...PRIVATE_PROFILE_COLUMN_LIST]);
  });
});

// ---------------------------------------------------------------------------
// /cv/:slug (visitante anónimo)
// ---------------------------------------------------------------------------
test.describe('perfil público /cv/:slug', () => {
  test('pide solo columnas públicas, sellos de public_stamps, y renderiza', async ({ page, context }) => {
    test.setTimeout(90_000);
    await installInitState(context, { language: 'es', theme: 'light' });
    const mock = await mockSupabase(context, {
      profiles: [cvProfile],
      stamps: stampsFor(CV_ID),
      experiences: [{ id: 'e1', profile_id: CV_ID, position: 'Data Engineer', company_name: 'ACME', start_date: '2020-01-01', end_date: null, is_current: true, description: 'Pipelines', achievements: [] }],
      education: [], skills: [{ id: 'k1', profile_id: CV_ID, name: 'SQL', sort_order: 1 }], portfolio_items: [], languages: [],
    });

    await gotoAndWait(page, `/cv/${cvProfile.slug}`);
    await expect(page.getByText('Laura Privacidad').first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText('Ingeniera de datos').first()).toBeVisible();
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const profileReqs = mock.requestsTo('profiles');
    expect(profileReqs.length).toBeGreaterThan(0);
    // supabase-js quita los espacios del select
    expect(profileReqs[0].params.select?.[0]).toBe(PUBLIC_PROFILE_COLUMNS.replace(/\s/g, ''));
    const checked = assertOnlyPublicProfileColumns(mock);
    expect(checked).toBeGreaterThan(0);
    assertNoStampsTable(mock);
    expect(mock.requestsTo('public_stamps').length).toBeGreaterThan(0);
    expect(mock.requestsTo('profiles_full'), 'un visitante no usa profiles_full').toEqual([]);

    // La plantilla green-minimal pinta el teléfono si lo recibe: no debe llegar.
    const html = await page.content();
    expect(html.includes(SECRET_PHONE)).toBe(false);
    expect(html.includes(SECRET_EMAIL)).toBe(false);
    expect(html.includes('****9876')).toBe(false);
  });

  test('un slug con forma de UUID sigue buscando por id', async ({ page, context }) => {
    test.setTimeout(90_000);
    await installInitState(context, { language: 'es', theme: 'light' });
    const mock = await mockSupabase(context, { profiles: [cvProfile], stamps: [], experiences: [], education: [], skills: [], portfolio_items: [], languages: [] });
    await gotoAndWait(page, `/cv/${CV_ID}`);
    await expect(page.getByText('Laura Privacidad').first()).toBeVisible({ timeout: 45_000 });
    expect(mock.requestsTo('profiles').some((r) => r.params.id?.[0] === `eq.${CV_ID}`)).toBe(true);
    assertOnlyPublicProfileColumns(mock);
  });
});

// ---------------------------------------------------------------------------
// Búsqueda de talento (CompanyTalentSearchPage, en /admin/search)
// ---------------------------------------------------------------------------
test.describe('búsqueda de talento', () => {
  test('lista perfiles sin columnas privadas y con sellos de public_stamps', async ({ page, context }) => {
    test.setTimeout(120_000);
    const profiles = withPrivateData(makeProfiles(40));
    const admin = profiles.find((p) => p.id === ADMIN_ID)!;
    // El más reciente (sale en la página 1, orden created_at desc), profesional y activo
    const target = profiles[38];
    expect(target.role).toBe('professional');
    await installInitState(context, { sessionProfile: admin, language: 'es', theme: 'light' });
    const mock = await mockSupabase(context, { profiles, stamps: stampsFor(target.id), skills: [] });

    await gotoAndWait(page, '/admin/search');
    await expect(page.getByText(/Page 1 of \d+/)).toBeVisible({ timeout: 45_000 });
    // En móvil la tarjeta queda bajo el panel de filtros: basta con que esté en el DOM
    await expect(page.getByText(target.full_name).first()).toBeAttached();
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    // Consultas de la búsqueda: solo columnas públicas; ordenar por is_premium (no plan)
    const search = mock.requestsTo('profiles').filter((r) => r.prefer?.includes('count=exact'));
    expect(search.length).toBeGreaterThan(0);
    for (const r of search) {
      const cols = profileColumnLists(r)[0];
      expect(cols).toContain('is_premium');
      expect(cols).not.toContain('plan');
    }
    assertOnlyPublicProfileColumns(mock);
    assertNoStampsTable(mock);
    expect(mock.requestsTo('public_stamps').length).toBeGreaterThan(0);
    // profiles_full solo para el perfil propio de la sesión (AuthContext)
    for (const r of mock.requestsTo('profiles_full')) expect(r.params.id?.[0]).toBe(`eq.${ADMIN_ID}`);

    const html = await page.content();
    expect(html.includes(String(target.email))).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Comunidad pública (/comunidad sin sesión)
// ---------------------------------------------------------------------------
test.describe('comunidad pública', () => {
  test('feed con autores: embeds de profiles solo con columnas públicas', async ({ page, context }) => {
    test.setTimeout(90_000);
    const authors = withPrivateData(makeProfiles(6)).slice(2);
    const pick = (a: Row) => ({ id: a.id, full_name: a.full_name, headline: a.headline, avatar_url: a.avatar_url, slug: a.slug, email: a.email, phone: a.phone });
    const posts = authors.map((a, i) => ({
      id: `00000000-0000-4000-8000-00000000f${String(i).padStart(3, '0')}`,
      author_id: a.id,
      content: `Publicación pública número ${i}`,
      content_type: 'TEXT',
      visibility: 'PUBLIC',
      is_hidden: false,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
      metadata: {},
      hashtags: [],
      created_at: new Date(Date.UTC(2026, 5, 1 + i)).toISOString(),
      updated_at: new Date(Date.UTC(2026, 5, 1 + i)).toISOString(),
      // Con select=*,author:profiles!author_id(...) el mock devuelve la fila tal cual
      author: pick(a),
    }));
    await installInitState(context, { language: 'es', theme: 'light' });
    const mock = await mockSupabase(context, { profiles: authors, feed_posts: posts, feed_likes: [], feed_comments: [], groups: [], text_translations: [] });

    await gotoAndWait(page, '/comunidad');
    await expect(page.getByText('Publicación pública número 3').first()).toBeVisible({ timeout: 45_000 });
    await expect(page.getByText(authors[3].full_name).first()).toBeVisible();
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    const embeds = mock.requests.filter((r) => r.table !== 'profiles' && profileColumnLists(r).length > 0);
    expect(embeds.length, 'el feed embebe autores').toBeGreaterThan(0);
    assertOnlyPublicProfileColumns(mock);
    assertNoStampsTable(mock);
    expect(mock.requestsTo('profiles_full')).toEqual([]);
  });
});
