import { test, expect, type Page, type Route, type TestInfo } from '@playwright/test';

/**
 * QA local de Comunidad y Dashboard (#3, #8/#9, #10, #13).
 *
 * App local (Vite) con sesión y Supabase MOCKEADOS vía page.route:
 * - Nada sale a producción: todo *.supabase.co se responde aquí y cualquier
 *   otro origen externo se aborta (Google Translate, MyMemory, avatares...).
 * - /api/translate (plugin de Vite que llamaría a Google desde Node) se aborta.
 * - La RPC increment_post_views se responde localmente y se registra.
 *
 * Ejecutar:
 *   QA_PORT=5330 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/comunidad.local.spec.ts
 */

import { SAFE_CONTEXT_OPTIONS } from './helpers/supabaseMock';

test.use({ ...SAFE_CONTEXT_OPTIONS, timezoneId: 'UTC', locale: 'es-ES' });

// ───────────────────────────── Datos mock ─────────────────────────────
const ME = '00000000-0000-4000-8000-0000000c0001';
const AUTHOR_EN = '00000000-0000-4000-8000-0000000c0002';
const AUTHOR_ES = '00000000-0000-4000-8000-0000000c0003';
const GROUP_ID = '00000000-0000-4000-8000-0000000c0100';
const POST_EN = '00000000-0000-4000-8000-0000000c1001';
const POST_ES = '00000000-0000-4000-8000-0000000c1002';
const POST_POLL = '00000000-0000-4000-8000-0000000c1003';
const POST_SEEDED = '00000000-0000-4000-8000-0000000c1004';
const COMMENT_1 = '00000000-0000-4000-8000-0000000c2001';
const COMMENT_2 = '00000000-0000-4000-8000-0000000c2002';
const REPLY_1 = '00000000-0000-4000-8000-0000000c2003';

const DAY = 86400000;
const now = Date.now();
const isoDaysAgo = (n: number) => new Date(now - n * DAY).toISOString();
/** 'YYYY-MM-DD' (UTC; el navegador del test también está en UTC) a mediodía para evitar bordes */
const dateKeyDaysAgo = (n: number) => new Date(now - n * DAY).toISOString().slice(0, 10);
const noonIso = (n: number, minute = 0) => `${dateKeyDaysAgo(n)}T12:${String(minute).padStart(2, '0')}:00.000Z`;

// Textos en inglés y sus traducciones "devueltas por la Edge Function"
const EN_POST = 'Just finished my certification in cloud architecture. Happy to share tips with anyone preparing the exam!';
const ES_POST_TR = 'Acabo de terminar mi certificación en arquitectura cloud. ¡Encantado de compartir consejos con quien prepare el examen!';
const ES_POST = 'Hola a todos, ¿qué tal la semana? Busco compañeros para practicar entrevistas en inglés.';
const POLL_CONTENT = 'Quick survey for the community about how we work today';
const POLL_CONTENT_TR = 'Encuesta rápida para la comunidad sobre cómo trabajamos hoy';
const POLL_Q = "What's your current remote work situation?";
const POLL_Q_TR = '¿Cuál es tu situación actual de teletrabajo?';
const POLL_OPTS = ['Fully remote', 'Hybrid', 'Back in the office'];
const POLL_OPTS_TR = ['Totalmente en remoto', 'Híbrido', 'De vuelta en la oficina'];
const SEEDED_POST = 'Monthly challenge: share the best advice you ever received in your career';
const SEEDED_POST_TR = 'Reto del mes: comparte el mejor consejo que hayas recibido en tu carrera';
const GROUP_NAME = 'Tutors & Mentors Pro';
const GROUP_NAME_TR = 'Tutores y Mentores Pro';
const GROUP_DESC = 'A space for tutors and mentors to share resources and best practices.';
const GROUP_DESC_TR = 'Un espacio para que tutores y mentores compartan recursos y buenas prácticas.';
const COMMENT_EN = 'Great advice, thanks for sharing this with everyone';
const GROUP_POST = 'Welcome to the group! Introduce yourself and tell us what you teach.';
const GROUP_POST_TR = '¡Bienvenidos al grupo! Preséntate y cuéntanos qué enseñas.';
const COMMENT_EN_TR = 'Gran consejo, gracias por compartirlo con todos';

const EDGE_DICTIONARY: Record<string, string> = {
  [EN_POST]: ES_POST_TR,
  [POLL_CONTENT]: POLL_CONTENT_TR,
  [POLL_Q]: POLL_Q_TR,
  [POLL_OPTS[0]]: POLL_OPTS_TR[0],
  [POLL_OPTS[2]]: POLL_OPTS_TR[2],
  [SEEDED_POST]: SEEDED_POST_TR,
  [GROUP_NAME]: GROUP_NAME_TR,
  [GROUP_DESC]: GROUP_DESC_TR,
  [COMMENT_EN]: COMMENT_EN_TR,
  [GROUP_POST]: GROUP_POST_TR,
};

// Una opción viene de la caché compartida (text_translations, solo lectura)
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
const DB_CACHE_ROWS = [
  { text_hash: hashText(POLL_OPTS[1]), source_lang: 'en', target_lang: 'es', original_text: POLL_OPTS[1], translated_text: POLL_OPTS_TR[1] },
];

interface MockOptions {
  role?: 'professional' | 'admin';
  wizardCompleted?: boolean;
  createdDaysAgo?: number;
  viewsIso?: string[];
}

interface MockLog {
  edgeBodies: { texts: string[]; sourceLang: string; targetLang: string }[];
  writes: { method: string; path: string; body: string | null }[];
  incrementPostViews: number;
  external: string[];
}

function b64url(o: unknown) {
  return Buffer.from(JSON.stringify(o)).toString('base64url');
}

function buildSession() {
  const exp = Math.floor(now / 1000) + 3600 * 24;
  const jwt = `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url({ sub: ME, role: 'authenticated', exp, aud: 'authenticated', email: 'qa@example.test' })}.firma-falsa`;
  const user = { id: ME, aud: 'authenticated', role: 'authenticated', email: 'qa@example.test', app_metadata: { provider: 'email' }, user_metadata: { full_name: 'QA Usuario' }, created_at: isoDaysAgo(3) };
  return { access_token: jwt, token_type: 'bearer', expires_in: 86400, expires_at: exp, refresh_token: 'refresh-falso', user };
}

function buildDb(opts: MockOptions) {
  const me = {
    id: ME, full_name: 'QA Usuario', email: 'qa@example.test', role: opts.role ?? 'professional',
    wizard_completed: opts.wizardCompleted ?? true, first_login_completed: true, dashboard_tour_completed: true,
    template: 'classic', slug: 'qa-usuario', headline: 'QA Engineer', summary: 'Perfil de prueba completo para QA.',
    avatar_url: 'https://example.test/avatar.png', plan: 'free', is_active: true,
    created_at: isoDaysAgo(opts.createdDaysAgo ?? 200), updated_at: isoDaysAgo(1),
  };
  const authors = [
    me,
    { id: AUTHOR_EN, full_name: 'Sarah Johnson', headline: 'Cloud Architect', avatar_url: null, slug: 'sarah-johnson' },
    { id: AUTHOR_ES, full_name: 'Laura García', headline: 'Reclutadora', avatar_url: null, slug: 'laura-garcia' },
  ];
  const basePost = { visibility: 'PUBLIC', is_hidden: false, is_pinned: false, is_edited: false, image_urls: [], shares_count: 0, views_count: 0, group_id: null, achievement_type: null, achievement_data: {}, updated_at: isoDaysAgo(1) };
  const posts = [
    // Contador sembrado (34) sin filas reales: solo existen 2 comentarios de primer nivel + 1 respuesta
    { ...basePost, id: POST_SEEDED, author_id: AUTHOR_EN, content: SEEDED_POST, content_type: 'TEXT', likes_count: 57, comments_count: 34, metadata: {}, created_at: isoDaysAgo(1) },
    { ...basePost, id: POST_EN, author_id: AUTHOR_EN, content: EN_POST, content_type: 'TEXT', likes_count: 0, comments_count: 0, metadata: {}, created_at: isoDaysAgo(2) },
    { ...basePost, id: POST_ES, author_id: AUTHOR_ES, content: ES_POST, content_type: 'TEXT', likes_count: 0, comments_count: 0, metadata: {}, created_at: isoDaysAgo(3) },
    { ...basePost, id: POST_POLL, author_id: AUTHOR_EN, content: POLL_CONTENT, content_type: 'POLL', likes_count: 0, comments_count: 0, created_at: isoDaysAgo(4),
      metadata: { poll: { question: POLL_Q, options: POLL_OPTS, duration: '1w', expires_at: isoDaysAgo(-5) } } },
    { ...basePost, id: '00000000-0000-4000-8000-0000000c1005', author_id: AUTHOR_EN, group_id: GROUP_ID, content: GROUP_POST, content_type: 'TEXT', likes_count: 0, comments_count: 0, metadata: {}, created_at: isoDaysAgo(5) },
  ];
  const comments = [
    { id: COMMENT_1, post_id: POST_SEEDED, author_id: AUTHOR_ES, parent_id: null, content: 'Mi mejor consejo: pedir feedback siempre después de cada entrevista.', likes_count: 0, replies_count: 1, is_hidden: false, is_edited: false, created_at: isoDaysAgo(1), updated_at: isoDaysAgo(1), metadata: {} },
    { id: COMMENT_2, post_id: POST_SEEDED, author_id: AUTHOR_EN, parent_id: null, content: COMMENT_EN, likes_count: 0, replies_count: 0, is_hidden: false, is_edited: false, created_at: isoDaysAgo(1), updated_at: isoDaysAgo(1), metadata: {} },
    { id: REPLY_1, post_id: POST_SEEDED, author_id: AUTHOR_EN, parent_id: COMMENT_1, content: '@Laura totally agree', likes_count: 0, replies_count: 0, is_hidden: false, is_edited: false, created_at: isoDaysAgo(1), updated_at: isoDaysAgo(1), metadata: {} },
  ];
  const groups = [
    { id: GROUP_ID, owner_id: AUTHOR_EN, name: GROUP_NAME, description: GROUP_DESC, slug: 'tutors-mentors-pro', is_private: false, member_count: 2, post_count: 1, metadata: { type: 'group' }, avatar_url: null, cover_url: null, created_at: isoDaysAgo(30) },
  ];
  const analytics_views = (opts.viewsIso ?? []).map((viewed_at, i) => ({ id: `v${i}`, profile_id: ME, viewed_at, referrer: null, country: null }));
  // Filas mínimas para que calculateProfileCompleteness dé 100%
  const own = (n: number, extra: Record<string, unknown> = {}) =>
    Array.from({ length: n }, (_, i) => ({ id: `00000000-0000-4000-8000-0000000d${String(i).padStart(4, '0')}`, profile_id: ME, created_at: isoDaysAgo(100), ...extra }));
  return { experiences: own(1, { title: 'QA', company: 'ACME', start_date: '2020-01-01' }), education: own(1, { institution: 'UPM', degree: 'Ing.', start_date: '2015-01-01' }),
    skills: own(3, { name: 'Testing' }), languages: own(1, { language: 'Español', level: 'native' }),
    profiles: authors, feed_posts: posts, feed_comments: comments, groups, group_members: [] as any[], analytics_views, text_translations: DB_CACHE_ROWS } as Record<string, any[]>;
}

// Mini evaluador de filtros PostgREST (eq, neq, in, not.in, is, gte, lte, gt, lt, ilike)
function matchFilter(row: any, column: string, raw: string): boolean {
  let negate = false;
  let expr = raw;
  if (expr.startsWith('not.')) { negate = true; expr = expr.slice(4); }
  const dot = expr.indexOf('.');
  const op = expr.slice(0, dot);
  const val = expr.slice(dot + 1);
  const cell = row[column];
  let ok = true;
  switch (op) {
    case 'eq': ok = String(cell) === val; break;
    case 'neq': ok = String(cell) !== val; break;
    case 'in': ok = val.replace(/^\(|\)$/g, '').split(',').map(s => s.replace(/^"|"$/g, '')).includes(String(cell)); break;
    case 'is': ok = val === 'null' ? cell === null || cell === undefined : String(cell) === val; break;
    case 'gte': ok = String(cell) >= val; break;
    case 'lte': ok = String(cell) <= val; break;
    case 'gt': ok = String(cell) > val; break;
    case 'lt': ok = String(cell) < val; break;
    case 'ilike': ok = new RegExp('^' + val.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/%/g, '.*') + '$', 'i').test(String(cell ?? '')); break;
    default: ok = true;
  }
  return negate ? !ok : ok;
}

const RESERVED = new Set(['select', 'order', 'limit', 'offset', 'on_conflict', 'columns', 'or', 'and']);

async function setupMocks(page: Page, opts: MockOptions = {}): Promise<MockLog> {
  const db = buildDb(opts);
  const profilesById = new Map(db.profiles.map((p) => [p.id, p]));
  const log: MockLog = { edgeBodies: [], writes: [], incrementPostViews: 0, external: [] };

  await page.routeWebSocket(/.*/, (ws) => ws.close());
  await page.route('**/*', async (route: Route) => {
    const req = route.request();
    const url = new URL(req.url());
    const method = req.method();
    const cors = { 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' };
    const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
      route.fulfill({ status, contentType: 'application/json', headers: { ...cors, ...headers }, body: body === undefined ? '' : JSON.stringify(body) });

    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      // El plugin de Vite /api/translate llamaría a Google desde Node: prohibido en QA
      if (url.pathname.startsWith('/api/translate')) { log.external.push(req.url()); return route.abort(); }
      return route.continue();
    }
    if (!url.hostname.endsWith('supabase.co')) { log.external.push(url.hostname + url.pathname); return route.abort(); }

    // Preflight: se devuelven explícitamente las cabeceras pedidas (el comodín '*' no cubre Authorization en WebKit)
    if (method === 'OPTIONS') {
      const requested = req.headers()['access-control-request-headers'] || 'authorization, apikey, content-type, x-client-info, prefer, range, accept-profile, content-profile, x-supabase-api-version';
      return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': requested, 'access-control-allow-methods': 'GET, POST, PATCH, PUT, DELETE, HEAD, OPTIONS', 'access-control-max-age': '600' } });
    }
    if (url.pathname.startsWith('/auth/v1/user')) return json(200, buildSession().user);
    if (url.pathname.startsWith('/auth/v1/')) return json(200, {});

    if (url.pathname === '/functions/v1/translate-texts') {
      const body = JSON.parse(req.postData() || '{}');
      log.edgeBodies.push(body);
      const translations: Record<string, string> = {};
      for (const t of body.texts || []) if (EDGE_DICTIONARY[t]) translations[t] = EDGE_DICTIONARY[t];
      return json(200, { translations });
    }
    if (url.pathname.startsWith('/functions/v1/')) return json(200, {});

    if (url.pathname.startsWith('/rest/v1/rpc/')) {
      const fn = url.pathname.replace('/rest/v1/rpc/', '');
      if (fn === 'increment_post_views') { log.incrementPostViews++; return route.fulfill({ status: 204, headers: cors, body: '' }); }
      if (fn === 'get_poll_vote_counts') return json(200, []);
      return json(200, null);
    }
    if (!url.pathname.startsWith('/rest/v1/')) return json(404, {});

    const table = url.pathname.replace('/rest/v1/', '');
    const accept = req.headers()['accept'] || '';
    const wantsObject = accept.includes('vnd.pgrst.object');

    if (method !== 'GET' && method !== 'HEAD') {
      log.writes.push({ method, path: url.pathname + url.search, body: req.postData() });
      if (table === 'feed_comments' && method === 'POST') {
        const input = JSON.parse(req.postData() || '{}');
        const row = { id: `00000000-0000-4000-8000-${String(Date.now()).slice(-12)}`, likes_count: 0, replies_count: 0, is_hidden: false, is_edited: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), metadata: {}, ...input };
        db.feed_comments.push(row);
        const withAuthor = { ...row, author: profilesById.get(row.author_id) || null };
        return json(201, wantsObject ? withAuthor : [withAuthor]);
      }
      return json(wantsObject ? 200 : 201, wantsObject ? {} : []);
    }

    // profiles_full (perfil propio completo) y public_stamps son vistas sobre profiles/stamps
    const source = db[table]
      || (table === 'profiles_full' ? db.profiles : undefined)
      || (table === 'public_stamps' ? (db.stamps || []).filter((s: any) => s.status === 'VERIFIED') : undefined)
      || [];
    let rows = source.slice();
    url.searchParams.forEach((value, key) => {
      if (RESERVED.has(key)) return;
      rows = rows.filter((r) => matchFilter(r, key, value));
    });
    const select = url.searchParams.get('select') || '';
    if (/author:profiles/.test(select)) rows = rows.map((r) => ({ ...r, author: profilesById.get(r.author_id) || null }));
    if (/owner:profiles/.test(select)) rows = rows.map((r) => ({ ...r, owner: profilesById.get(r.owner_id) || null }));
    const order = url.searchParams.get('order');
    if (order) {
      const [col, dir] = order.split('.');
      rows.sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : String(a[col]) > String(b[col]) ? 1 : 0) * (dir === 'desc' ? -1 : 1));
    }
    const total = rows.length;
    const offset = Number(url.searchParams.get('offset') || 0);
    const limit = url.searchParams.get('limit');
    if (offset || limit) rows = rows.slice(offset, limit ? offset + Number(limit) : undefined);

    const range = `${rows.length ? `${offset}-${offset + rows.length - 1}` : '*'}/${total}`;
    if (method === 'HEAD') return route.fulfill({ status: 200, headers: { ...cors, 'content-range': range }, body: '' });
    if (wantsObject) {
      if (rows.length === 0) return json(406, { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned', details: 'The result contains 0 rows' });
      return json(200, rows[0], { 'content-range': range });
    }
    return json(200, rows, { 'content-range': range });
  });
  return log;
}

async function boot(page: Page, path: string, opts: MockOptions = {}) {
  const session = buildSession();
  await page.addInitScript(([s]) => {
    localStorage.setItem('yourcvpassport-auth', JSON.stringify(s));
    localStorage.setItem('language', 'es');
    localStorage.setItem('sidebar-collapsed', 'false');
  }, [session]);
  const log = await setupMocks(page, opts);
  if (process.env.QA_DEBUG) {
    page.on('console', (m) => console.log('[console]', m.type(), m.text().slice(0, 300)));
    page.on('request', (r) => { if (/functions|text_translations/.test(r.url())) console.log('[req]', r.method(), r.url().slice(0, 160)); });
  }
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  return log;
}

const isMobile = (testInfo: TestInfo) => testInfo.project.name.startsWith('mobile');

/** Fija un <article> por posición (su texto cambia al alternar original/traducción). */
async function lockArticle(page: Page, text: string) {
  const articles = page.locator('article');
  await expect(articles.filter({ hasText: text }).first()).toBeVisible({ timeout: 60000 });
  const n = await articles.count();
  for (let i = 0; i < n; i++) {
    if ((await articles.nth(i).innerText()).includes(text)) return articles.nth(i);
  }
  throw new Error(`No se encontró el artículo con: ${text}`);
}

// ───────────────────────────── #10 Visitas ─────────────────────────────
test.describe('#10 Visitas al perfil (sin datos inventados)', () => {
  test('cuenta nueva sin visitas: 0 en vista mensual y semanal, estable entre renders', async ({ page }) => {
    await boot(page, '/dashboard', { createdDaysAgo: 3, viewsIso: [] });
    const chart = page.locator('[data-tour="chart"]');
    await expect(chart).toBeVisible({ timeout: 60000 });

    // Vista mensual (calendario, por defecto)
    await expect(chart.getByTestId('monthly-visits-total')).toHaveText(/^0\s+visitas$/);
    await expect(chart.getByTestId('visits-empty-state')).toBeVisible();
    expect(await chart.locator('[data-visits]:not([data-visits="0"])').count()).toBe(0);
    // Los días anteriores a la creación de la cuenta no se pintan como días con datos
    const beforeKey = dateKeyDaysAgo(4);
    if (beforeKey.slice(0, 7) === dateKeyDaysAgo(0).slice(0, 7)) {
      await expect(chart.locator(`[data-date="${beforeKey}"]`)).toHaveAttribute('data-unavailable', 'true');
    }

    // Vista semanal (barras y sectores) y vuelta: siempre 0
    const [calBtn, barBtn, pieBtn] = await chart.locator('button[title]').all();
    for (let i = 0; i < 3; i++) {
      await barBtn.click();
      await expect(chart.getByTestId('weekly-visits-total')).toHaveText('0');
      await expect(chart.getByTestId('visits-empty-state')).toBeVisible();
      await expect(chart.getByTestId('weekly-bar-chart')).toHaveCount(0);
      await pieBtn.click();
      await expect(chart.getByTestId('weekly-visits-total')).toHaveText('0');
      await calBtn.click();
      await expect(chart.getByTestId('monthly-visits-total')).toHaveText(/^0\s+visitas$/);
    }
  });

  test('con visitas reales: se muestran exactamente', async ({ page }) => {
    // hoy: 3, hace 2 días: 2, hace 10 días: 4 (fuera de la semana)
    const views = [noonIso(0, 1), noonIso(0, 2), noonIso(0, 3), noonIso(2, 1), noonIso(2, 2), noonIso(10, 1), noonIso(10, 2), noonIso(10, 3), noonIso(10, 4)];
    await boot(page, '/dashboard', { createdDaysAgo: 200, viewsIso: views });
    const chart = page.locator('[data-tour="chart"]');
    await expect(chart).toBeVisible({ timeout: 60000 });

    const thisMonth = dateKeyDaysAgo(0).slice(0, 7);
    const expectedMonth = views.filter((v) => v.slice(0, 7) === thisMonth).length;
    await expect(chart.getByTestId('monthly-visits-total')).toHaveText(new RegExp(`^${expectedMonth}\\s+visitas$`));
    await expect(chart.locator(`[data-date="${dateKeyDaysAgo(0)}"]`)).toHaveAttribute('data-visits', '3');
    if (dateKeyDaysAgo(2).slice(0, 7) === thisMonth) {
      await expect(chart.locator(`[data-date="${dateKeyDaysAgo(2)}"]`)).toHaveAttribute('data-visits', '2');
    }

    const [, barBtn] = await chart.locator('button[title]').all();
    await barBtn.click();
    await expect(chart.getByTestId('weekly-visits-total')).toHaveText('5');
    await expect(chart.getByTestId('weekly-bar-chart')).toBeVisible();
    await expect(chart.getByTestId('visits-empty-state')).toHaveCount(0);
  });
});

// ───────────────────────────── #13 Acceso admin ─────────────────────────────
// El admin no usa el dashboard personal: /dashboard le lleva directo a /admin (ver
// tests/qa/u02-admin-redireccion.local.spec.ts). El sidebar ya no tiene "Panel admin".
test.describe('#13 Acceso al panel admin desde el dashboard', () => {
  test('admin (incluso con asistente sin completar) entra en /dashboard y acaba en /admin sin ver el asistente', async ({ page }) => {
    await boot(page, '/dashboard', { role: 'admin', wizardCompleted: false });
    await expect(page).toHaveURL(/\/admin$/, { timeout: 60000 });
    await expect(page.locator('[data-tour="sidebar"]')).toHaveCount(0);
    await expect(page.locator('[data-tour="mobile-menu-toggle"]')).toHaveCount(0);
  });

  test('usuario normal no ve "Panel admin"', async ({ page }, testInfo) => {
    await boot(page, '/dashboard', { role: 'professional' });
    if (isMobile(testInfo)) {
      await page.locator('[data-tour="mobile-menu-toggle"]').click();
      const menu = page.locator('[data-tour="mobile-menu"]');
      await expect(menu.getByRole('button', { name: /Ajustes|Configuración|Settings/ }).first()).toBeVisible({ timeout: 60000 });
      await expect(menu.getByRole('button', { name: 'Panel admin' })).toHaveCount(0);
    } else {
      await expect(page.locator('[data-section-btn="ajustes"]')).toBeVisible({ timeout: 60000 });
      await expect(page.getByRole('button', { name: 'Panel admin' })).toHaveCount(0);
    }
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

// ───────────────────────────── #3 Contadores ─────────────────────────────
test.describe('#3 Contador de comentarios', () => {
  test('el contador coincide con los comentarios mostrados y una respuesta no lo infla', async ({ page }) => {
    const log = await boot(page, '/comunidad');
    const post = page.locator('article', { hasText: SEEDED_POST_TR });
    await expect(post).toBeVisible({ timeout: 60000 });

    // El valor sembrado (34) no se muestra: hay 2 comentarios reales de primer nivel
    await expect(post).not.toContainText('34 comentarios');
    const counter = post.getByText(/^\d+ comentarios$/);
    await expect(counter).toHaveText('2 comentarios');
    await expect(post).not.toContainText('57');

    await post.getByRole('button', { name: 'Comentar', exact: true }).click();
    await expect(post.getByText('Mi mejor consejo: pedir feedback')).toBeVisible();
    await expect(post.getByText('Sé el primero en comentar')).toHaveCount(0);
    await expect(counter).toHaveText('2 comentarios');
    // Los comentarios en inglés también se traducen solos
    await expect(post.getByText(COMMENT_EN_TR)).toBeVisible();

    // Responder a un comentario: el contador de comentarios del post no cambia
    await post.getByRole('button', { name: 'Responder' }).first().click();
    const replyInput = post.getByPlaceholder('Escribe tu respuesta...');
    await replyInput.fill('Totalmente de acuerdo');
    await replyInput.press('Enter');
    await expect.poll(() => log.writes.filter((w) => w.method === 'POST' && w.path.startsWith('/rest/v1/feed_comments')).length).toBe(1);
    await expect(post.getByText('Totalmente de acuerdo')).toBeVisible();
    await expect(counter).toHaveText('2 comentarios');
    expect(log.incrementPostViews).toBeGreaterThanOrEqual(0); // respondida localmente, nunca sale a producción
  });
});

// ───────────────────────────── #8/#9 Traducción automática ─────────────────────────────
test.describe('#8/#9 Traducción automática del feed, encuestas y grupos', () => {
  test('posts y encuestas en inglés se ven en español sin pulsar nada; "Ver original" funciona; lo español no se traduce', async ({ page }) => {
    const log = await boot(page, '/comunidad');
    const enPost = await lockArticle(page, ES_POST_TR);
    await expect(enPost).not.toContainText(EN_POST);
    await expect(enPost.getByTestId('auto-translation-notice')).toContainText('Traducido automáticamente del inglés');

    // Ver original / Ver traducción
    await enPost.getByRole('button', { name: 'Ver original' }).click();
    await expect(enPost).toContainText(EN_POST);
    await enPost.getByRole('button', { name: 'Ver traducción' }).click();
    await expect(enPost).toContainText(ES_POST_TR);

    // Encuesta: pregunta y opciones traducidas (una opción sale de la caché compartida)
    const poll = page.locator('article', { hasText: POLL_Q_TR });
    await expect(poll).toBeVisible();
    for (const opt of POLL_OPTS_TR) await expect(poll.getByRole('button', { name: opt })).toBeVisible();
    await expect(poll).not.toContainText(POLL_Q);

    // Post en español: sin aviso y sin pedir traducción
    const esPost = page.locator('article', { hasText: ES_POST });
    await expect(esPost).toBeVisible();
    await expect(esPost.getByTestId('auto-translation-notice')).toHaveCount(0);
    const allSent = log.edgeBodies.flatMap((b) => b.texts);
    expect(allSent).not.toContain(ES_POST);
    expect(allSent).not.toContain(POLL_OPTS[1]); // ya estaba en la caché de BD
    expect(log.edgeBodies.every((b) => b.sourceLang === 'en' && b.targetLang === 'es')).toBe(true);
    // Por lotes: varios textos en la misma llamada
    expect(Math.max(...log.edgeBodies.map((b) => b.texts.length))).toBeGreaterThan(1);

    // El navegador ya no escribe en la caché compartida ni llama a MyMemory/Google
    expect(log.writes.filter((w) => w.path.includes('text_translations'))).toEqual([]);
    expect(log.external.filter((h) => /mymemory|translate\.googleapis|\/api\/translate/.test(h))).toEqual([]);
  });

  test('nombre y descripción del grupo en español', async ({ page }) => {
    await boot(page, `/comunidad?grupo=${GROUP_ID}`);
    await expect(page.getByRole('heading', { name: GROUP_NAME_TR })).toBeVisible({ timeout: 60000 });
    await expect(page.getByText(GROUP_DESC_TR).first()).toBeVisible();
    await expect(page.getByRole('heading', { name: GROUP_NAME })).toHaveCount(0);
    // Ver original en la cabecera del grupo
    const header = page.locator('div', { has: page.getByRole('heading', { name: GROUP_NAME_TR }) }).last();
    await header.getByRole('button', { name: 'Ver original' }).first().click();
    await expect(page.getByRole('heading', { name: GROUP_NAME })).toBeVisible();
  });
});

// ───────────────────────────── Capturas (solo con QA_SHOTS=<carpeta>) ─────────────────────────────
test.describe('Capturas de evidencia', () => {
  test.skip(!process.env.QA_SHOTS, 'Solo se ejecuta con QA_SHOTS=<carpeta>');
  // En WebKit las páginas secundarias del mismo contexto no se pintan en segundo plano
  test.skip(({ browserName }) => browserName === 'webkit', 'Capturas solo en chromium/firefox/mobile');

  for (const theme of ['light', 'dark'] as const) {
    test(`capturas ${theme}`, async ({ page }, testInfo) => {
      const dir = process.env.QA_SHOTS as string;
      const tag = `${testInfo.project.name}-${theme}`;
      await page.emulateMedia({ colorScheme: theme });
      await page.addInitScript((t) => localStorage.setItem('theme', t), theme);

      await boot(page, '/dashboard', { createdDaysAgo: 3, viewsIso: [] });
      const chart = page.locator('[data-tour="chart"]');
      await expect(chart).toBeVisible({ timeout: 60000 });
      await chart.screenshot({ path: `${dir}/10-visitas-vacio-calendario-${tag}.png` });
      await chart.locator('button[title]').nth(1).click();
      await chart.screenshot({ path: `${dir}/10-visitas-vacio-semana-${tag}.png` });

      const page2 = await page.context().newPage();
      await setupMocks(page2);
      await page2.goto('/comunidad', { waitUntil: 'domcontentloaded' });
      const enPost = await lockArticle(page2, ES_POST_TR);
      await enPost.screenshot({ path: `${dir}/08-post-traducido-${tag}.png` });
      const poll = await lockArticle(page2, POLL_Q_TR);
      await poll.screenshot({ path: `${dir}/08-encuesta-traducida-${tag}.png` });
      const seeded = await lockArticle(page2, SEEDED_POST_TR);
      await seeded.getByRole('button', { name: 'Comentar', exact: true }).click();
      await expect(seeded.getByText(COMMENT_EN_TR)).toBeVisible();
      await seeded.screenshot({ path: `${dir}/03-comentarios-contador-${tag}.png` });

      const page3 = await page.context().newPage();
      await setupMocks(page3);
      await page3.goto(`/comunidad?grupo=${GROUP_ID}`, { waitUntil: 'domcontentloaded' });
      await expect(page3.getByRole('heading', { name: GROUP_NAME_TR })).toBeVisible({ timeout: 60000 });
      await page3.screenshot({ path: `${dir}/09-grupo-traducido-${tag}.png` });
    });
  }
});
