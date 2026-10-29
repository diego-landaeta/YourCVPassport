/**
 * SEO estático (auditoría del 25/10/2026, hallazgos 02, 03, 04, 09, 11, 16 y 08 en el sitemap).
 *
 * Genera un `dist` de pruebas en una carpeta temporal (index.html de la raíz + los tres
 * generadores con datos simulados de tests/qa/fixtures/seo, sin Supabase ni vite build) y
 * comprueba sobre el HTML CRUDO, sin ejecutar JavaScript:
 *   - canonical y og:url autorreferentes en la home y en cada perfil (sin barra final);
 *   - un solo H1 propio por ruta (distinto de «YourCVPassport») en blog, páginas y perfiles;
 *   - cuerpo de más de 1500 caracteres en los artículos, JSON-LD BlogPosting y Person;
 *   - sin «...» y con longitudes dentro de rango: título 50-60, descripción 120-155;
 *   - perfiles de prueba/internos fuera del sitemap y con noindex;
 *   - hreflang es/en/x-default recíproco en los pares de artículos traducidos;
 *   - el sitemap sin /empleos ni /jobs con 0 ofertas (y con ellos si hay ofertas);
 *   - /default-avatar.png existe de verdad.
 *
 *   npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/seo-estatico.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const FIXTURES = path.join(HERE, 'fixtures', 'seo');
const BASE = 'https://yourcvpassport.com';

// Los 20 artículos con «...» en el título que señaló la auditoría (hallazgo 11)
const ARTICULOS_SENALADOS = [
  'bienestar-holistico-profesional', 'certificaciones-online-gratuitas-hispanos', 'contratacion-basada-habilidades-espanol',
  'cv-recien-graduado-universidad', 'marca-personal-profesionales-hispanos', 'nomada-digital-hispano-cv',
  'trabajo-remoto-latam-guia-cv-2026', 'academic-conference-cv', 'ai-resume-builder-comparison-2026', 'cv-for-military-veterans',
  'cybersecurity-industry-hiring-trends-2026', 'digital-credentials-blockchain-cv', 'executive-cv-guide',
  'freelance-cv-template-guide-2026', 'gig-economy-cv-guide', 'how-to-list-languages-on-cv', 'how-to-write-cv-for-united-kingdom',
  'networking-for-introverts', 'research-assistant-cv-guide', 'salary-negotiation-guide-2026',
];

type Page = { path: string; lang: 'es' | 'en'; title: string; description: string; slug?: string; canonical?: string; h1?: string };
type Profile = { slug: string; is_test?: boolean };

let dist = '';
let pages: Page[] = [];
let profiles: Profile[] = [];
let sitemap = '';
let sitemapConOfertas = '';

const read = (p: string) => fs.readFileSync(path.join(dist, ...p.split('/').filter(Boolean), 'index.html'), 'utf8');
const readHome = () => fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
const decode = (s: string) => s.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

const title = (html: string) => decode(html.match(/<title>([\s\S]*?)<\/title>/)![1]);
const meta = (html: string, attr: 'name' | 'property', key: string) => {
  const m = html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`));
  return m ? decode(m[1]) : null;
};
const canonicals = (html: string) => [...html.matchAll(/<link rel="canonical" href="([^"]*)"/g)].map((m) => decode(m[1]));
const h1s = (html: string) => [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => decode(m[1].replace(/<[^>]*>/g, '').trim()));
const hreflangs = (html: string) => Object.fromEntries([...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
const jsonLd = (html: string) => [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const mainText = (html: string) => {
  const m = html.match(/<main id="static-home"[\s\S]*?<\/main>/);
  expect(m, 'el HTML inicial lleva <main id="static-home">').not.toBeNull();
  return decode(m![0].replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
};
const locs = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].slice(BASE.length) || '/');

/** Título 50-60 y descripción 120-155, sin «...» ni «…». */
function expectSeoText(label: string, t: string, d: string) {
  expect(t, `${label}: título sin puntos suspensivos`).not.toMatch(/\.\.\.|…/);
  expect(d, `${label}: descripción sin puntos suspensivos`).not.toMatch(/\.\.\.|…/);
  expect(t.length, `${label}: título «${t}» (${t.length})`).toBeGreaterThanOrEqual(50);
  expect(t.length, `${label}: título «${t}» (${t.length})`).toBeLessThanOrEqual(60);
  expect(d.length, `${label}: descripción «${d}» (${d.length})`).toBeGreaterThanOrEqual(120);
  expect(d.length, `${label}: descripción «${d}» (${d.length})`).toBeLessThanOrEqual(155);
  expect(d, `${label}: la descripción termina en frase completa`).toMatch(/[.!?]$/);
}

test.describe.configure({ mode: 'serial' });

test.beforeAll(async ({}, testInfo) => {
  if (testInfo.project.name !== 'chromium') return;
  test.setTimeout(180_000);
  dist = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-estatico-'));
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(dist, 'index.html'));
  // Sin credenciales: ningún generador consulta Supabase (dotenv no pisa variables ya definidas)
  const env = { ...process.env, NODE_OPTIONS: '', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', SEO_FIXTURE_DIR: '' };
  const node = (script: string, ...args: string[]) =>
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], { cwd: ROOT, env, stdio: 'pipe' });

  node('generate-static-meta.mjs', dist);
  node('generate-profile-html.mjs', '--all', `--fixture=${FIXTURES}`, `--dist=${dist}`);
  node('generate-sitemap.mjs', `--fixture=${FIXTURES}`, `--output=${path.join(dist, 'sitemap.xml')}`);
  node('generate-sitemap.mjs', `--fixture=${FIXTURES}`, '--fixture-jobs=jobs-publicadas.json', `--output=${path.join(dist, 'sitemap-ofertas.xml')}`);
  sitemap = fs.readFileSync(path.join(dist, 'sitemap.xml'), 'utf8');
  sitemapConOfertas = fs.readFileSync(path.join(dist, 'sitemap-ofertas.xml'), 'utf8');

  const mod = await import(pathToFileURL(path.join(ROOT, 'scripts', 'generate-static-meta.mjs')).href);
  pages = mod.listPages();
  profiles = JSON.parse(fs.readFileSync(path.join(FIXTURES, 'profiles.json'), 'utf8'));
});

test.afterAll(() => {
  if (dist) fs.rmSync(dist, { recursive: true, force: true });
});

test.beforeEach(({}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Generadores y lectura de ficheros: basta con un navegador');
});

test('home: canonical y og:url autorreferentes, una sola vez, y JSON-LD Organization y WebSite', () => {
  const html = readHome();
  expect(canonicals(html)).toEqual([`${BASE}/`]);
  expect(meta(html, 'property', 'og:url')).toBe(`${BASE}/`);
  const types = jsonLd(html).map((j) => j['@type']);
  expect(types).toEqual(expect.arrayContaining(['Organization', 'WebSite']));
  // La home conserva su contenido y su H1 de marca
  expect(h1s(html)).toEqual(['YourCVPassport']);
  // Idempotente: pasar de nuevo el generador por el index.html ya generado no duplica etiquetas
  const again = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'generate-static-meta.mjs'), dist], { cwd: ROOT, env: { ...process.env, NODE_OPTIONS: '' } });
  expect(again.status, String(again.stderr)).toBe(0);
  const after = readHome();
  expect(canonicals(after)).toEqual([`${BASE}/`]);
  expect(after.match(/<script type="application\/ld\+json"/g)).toHaveLength(2);
});

test('perfiles: los tres sin copia estática (y todos) tienen la suya con canonical, og:url y Person', () => {
  for (const slug of ['delsy-romero', 'diego-do-santos', 'louis-garnier']) {
    expect(fs.existsSync(path.join(dist, 'cv', slug, 'index.html')), `/cv/${slug}`).toBe(true);
  }
  for (const p of profiles) {
    const html = read(`/cv/${p.slug}`);
    const url = `${BASE}/cv/${p.slug}`;
    expect(canonicals(html), p.slug).toEqual([url]);
    expect(url.endsWith('/'), 'sin barra final').toBe(false);
    expect(meta(html, 'property', 'og:url'), p.slug).toBe(url);
    const person = jsonLd(html).find((j) => j['@type'] === 'Person');
    expect(person, `${p.slug}: JSON-LD Person`).toBeTruthy();
    expect(person.url).toBe(url);
    expect(person.name.length).toBeGreaterThan(1);
    expect(person.name).not.toBe('YourCVPassport');
    // Ningún dato privado en el JSON-LD ni en el cuerpo
    expect(html).not.toMatch(/"(email|telephone)"/);
    expectSeoText(p.slug, title(html), meta(html, 'name', 'description')!);
    expect(meta(html, 'property', 'og:title')).toBe(title(html));
    expect(meta(html, 'property', 'og:image'), p.slug).toMatch(/^https?:\/\//);
  }
});

test('perfiles: H1 único y propio (el nombre), no «YourCVPassport», y texto de datos de usuario escapado', () => {
  for (const p of profiles) {
    const html = read(`/cv/${p.slug}`);
    const hs = h1s(html);
    expect(hs, p.slug).toHaveLength(1);
    expect(hs[0]).not.toBe('YourCVPassport');
    expect(hs[0].length).toBeGreaterThan(1);
    expect(mainText(html).length, p.slug).toBeGreaterThan(40);
  }
  const xss = read('/cv/ana-xss');
  expect(xss).not.toContain('<script>window.__pwned');
  expect(xss).not.toMatch(/<img src=x/);
  expect(xss.match(/<title>/g)).toHaveLength(1);
});

test('perfiles de prueba o internos: noindex en su copia y fuera del sitemap; los demás dentro', () => {
  const excluidos = ['diana-ziegler', 'support-yourcvpassport-com', 'qa-marcado-prueba']; // el último, por is_test
  const paths = locs(sitemap);
  for (const slug of excluidos) {
    expect(read(`/cv/${slug}`), slug).toMatch(/<meta name="robots" content="noindex, nofollow"/);
    expect(read(`/cv/${slug}`).match(/<meta name="robots"/g), 'una sola meta robots').toHaveLength(1);
    expect(paths, slug).not.toContain(`/cv/${slug}`);
    expect(sitemapConOfertas, slug).not.toContain(`/cv/${slug}`);
  }
  for (const p of profiles.filter((x) => !excluidos.includes(x.slug))) {
    expect(paths, p.slug).toContain(`/cv/${p.slug}`);
    expect(read(`/cv/${p.slug}`), p.slug).not.toMatch(/content="noindex/);
  }
  // Marcas en la lista de exclusión configurable
  const conf = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo', 'excluded-profiles.json'), 'utf8'));
  expect(conf.slugs).toEqual(expect.arrayContaining(['diana-ziegler', 'support-yourcvpassport-com']));
  // La Edge Function lleva su copia de la misma lista
  const edge = JSON.parse(fs.readFileSync(path.join(ROOT, 'supabase', 'functions', 'sitemap', 'excluded-profiles.json'), 'utf8'));
  expect(edge.slugs).toEqual(conf.slugs);
});

test('og:image por defecto: /default-avatar.png es un PNG real', () => {
  const file = path.join(ROOT, 'public', 'default-avatar.png');
  expect(fs.existsSync(file)).toBe(true);
  const buf = fs.readFileSync(file);
  expect(buf.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  expect(buf.length).toBeGreaterThan(1000);
  // Perfil sin avatar: usa ese recurso
  expect(meta(read('/cv/diego-do-santos'), 'property', 'og:image')).toBe(`${BASE}/default-avatar.png`);
  // Y con avatar propio, el suyo
  expect(meta(read('/cv/delsy-romero'), 'property', 'og:image')).toBe('https://cdn.example.test/avatars/delsy.png');
});

test('blog: cada artículo con H1 propio, >1500 caracteres, BlogPosting, canonical, og:type article y longitudes en rango', () => {
  const blog = pages.filter((p) => p.slug);
  expect(blog.length).toBeGreaterThanOrEqual(300);
  const slugs = new Set(blog.map((p) => p.slug));
  for (const s of ARTICULOS_SENALADOS) expect(slugs.has(s), `artículo señalado ${s}`).toBe(true);

  for (const p of blog) {
    const html = read(p.path);
    const url = `${BASE}${p.path}`;
    expect(canonicals(html), p.path).toEqual([url]);
    expect(meta(html, 'property', 'og:url'), p.path).toBe(url);
    expect(meta(html, 'property', 'og:type'), p.path).toBe('article');
    expectSeoText(p.path, title(html), meta(html, 'name', 'description')!);

    const hs = h1s(html);
    expect(hs, p.path).toHaveLength(1);
    expect(hs[0], p.path).not.toBe('YourCVPassport');
    expect(hs[0].length).toBeGreaterThan(10);

    expect(mainText(html).length, `${p.path}: cuerpo`).toBeGreaterThan(1500);
    const ld = jsonLd(html);
    const post = ld.find((j) => j['@type'] === 'BlogPosting');
    expect(post, `${p.path}: BlogPosting`).toBeTruthy();
    expect(post.headline).toBe(hs[0]);
    expect(post.datePublished).toMatch(/^20\d\d-\d\d-\d\dT/);
    expect(ld.some((j) => j['@type'] === 'BreadcrumbList'), `${p.path}: BreadcrumbList`).toBe(true);
    // Enlaces a otros artículos y de vuelta al blog
    expect(html).toMatch(new RegExp(`<a href="/${p.lang === 'es' ? 'recursos' : 'resources'}/blog">`));
    // Lista de H2 del propio artículo
    expect(html).toMatch(/<nav aria-label="[^"]+">\s*<h2>/);
  }
});

test('blog: el contenido estático vive dentro de #root (React lo sustituye al montar) y no es el bloque genérico', () => {
  const html = read('/recursos/blog/cv-pdf-vs-docx-cual-enviar');
  expect(html).toMatch(/<div id="root">\s*<main id="static-home"/);
  expect(html).not.toContain('Tu CV profesional verificado: destaca y avanza en tu carrera');
  expect(html.match(/<main id="static-home"/g)).toHaveLength(1);
});

test('páginas estáticas: H1 propio, título 50-60, descripción 120-155 sin «...» y canonical', () => {
  const stat = pages.filter((p) => !p.slug);
  expect(stat.length).toBeGreaterThanOrEqual(40);
  for (const p of stat) {
    const html = read(p.path);
    expectSeoText(p.path, title(html), meta(html, 'name', 'description')!);
    const hs = h1s(html);
    expect(hs, p.path).toHaveLength(1);
    expect(hs[0], p.path).not.toBe('YourCVPassport');
    expect(canonicals(html), p.path).toEqual([`${BASE}${p.canonical ?? p.path}`]);
    expect(mainText(html).length, p.path).toBeGreaterThan(100);
    // enlaces principales
    expect((html.match(/<main id="static-home"[\s\S]*?<\/main>/)![0].match(/<a href=/g) || []).length, p.path).toBeGreaterThanOrEqual(8);
  }
  // Las 29 páginas con la descripción cortada de la auditoría ya no llevan «...»
  expect(stat.filter((p) => /\.\.\.|…/.test(p.description)).map((p) => p.path)).toEqual([]);
  // La portada del blog enlaza a todos sus artículos
  const idx = read('/recursos/blog');
  expect((idx.match(/href="\/recursos\/blog\//g) || []).length).toBeGreaterThanOrEqual(150);
});

test('artículos traducidos: hreflang es/en/x-default recíproco, empezando por cv-pdf-vs-docx', () => {
  const conf = JSON.parse(fs.readFileSync(path.join(ROOT, 'seo', 'blog-translations.json'), 'utf8')) as { pairs: Array<{ es: string; en: string }> };
  expect(conf.pairs[0]).toEqual({ es: 'cv-pdf-vs-docx-cual-enviar', en: 'cv-pdf-vs-docx-format' });
  expect(conf.pairs.length).toBeGreaterThanOrEqual(10);
  const seen = new Set<string>();
  for (const pair of conf.pairs) {
    expect(seen.has(pair.es) || seen.has(pair.en), `par repetido ${pair.es}`).toBe(false);
    seen.add(pair.es); seen.add(pair.en);
    const esUrl = `${BASE}/recursos/blog/${pair.es}`;
    const enUrl = `${BASE}/resources/blog/${pair.en}`;
    const esHtml = read(`/recursos/blog/${pair.es}`);
    const enHtml = read(`/resources/blog/${pair.en}`);
    for (const html of [esHtml, enHtml]) {
      expect(hreflangs(html)).toEqual({ es: esUrl, en: enUrl, 'x-default': enUrl });
    }
    expect(canonicals(esHtml)).toEqual([esUrl]);
    expect(canonicals(enHtml)).toEqual([enUrl]);
    // En el sitemap, mismo juego en ambas entradas
    for (const loc of [esUrl, enUrl]) {
      const block = sitemap.match(new RegExp(`<url>\\s*<loc>${loc.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</loc>[\\s\\S]*?</url>`))![0];
      const alt = Object.fromEntries([...block.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map((m) => [m[1], m[2]]));
      expect(alt, loc).toEqual({ en: enUrl, es: esUrl, 'x-default': enUrl });
    }
  }
  // Un artículo sin traducción declarada no inventa hreflang
  expect(hreflangs(read('/recursos/blog/como-hacer-cv-mexico'))).toEqual({});
});

test('sitemap: sin /empleos ni /jobs con 0 ofertas; con ofertas vuelven con su ficha', () => {
  const sin = locs(sitemap);
  expect(sin).not.toContain('/empleos');
  expect(sin).not.toContain('/jobs');
  expect(sin.filter((p) => /(^|\/)(empleos|jobs)(\/|$)/.test(p))).toEqual([]);
  // El resto de páginas estáticas siguen
  for (const p of ['/precios', '/pricing', '/comunidad', '/feed', '/recursos/blog']) expect(sin).toContain(p);
  expect(sin).not.toContain('/recursos');
  expect(sin).not.toContain('/resources');

  const con = locs(sitemapConOfertas);
  expect(con).toEqual(expect.arrayContaining(['/empleos', '/jobs', '/es/ofertas/analista-datos-madrid', '/es/jobs/analista-datos-madrid']));
  // Sin URLs repetidas
  expect(new Set(sin).size).toBe(sin.length);
});

test('generador de perfiles: sin credenciales no escribe nada (falla, o sale limpio con --optional)', () => {
  const vacio = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-vacio-'));
  fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(vacio, 'index.html'));
  try {
    const env = { ...process.env, NODE_OPTIONS: '', VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '', SEO_FIXTURE_DIR: '' };
    const script = path.join(ROOT, 'scripts', 'generate-profile-html.mjs');
    const estricto = spawnSync(process.execPath, [script, '--all', `--dist=${vacio}`], { cwd: ROOT, env });
    expect(estricto.status).not.toBe(0);
    const opcional = spawnSync(process.execPath, [script, '--all', '--optional', `--dist=${vacio}`], { cwd: ROOT, env });
    expect(opcional.status).toBe(0);
    expect(fs.existsSync(path.join(vacio, 'cv')), 'dist/cv intacto').toBe(false);
    // El sitemap con datos simulados exige --output: nunca toca public/sitemap.xml
    const sinSalida = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'generate-sitemap.mjs'), `--fixture=${FIXTURES}`], { cwd: ROOT, env });
    expect(sinSalida.status).not.toBe(0);
  } finally {
    fs.rmSync(vacio, { recursive: true, force: true });
  }
});

/** Compila la Edge Function `sitemap` con stubs de Deno y supabase-js y devuelve las rutas de su XML. */
async function rutasDeLaEdgeFunction(rpc: { data: unknown; error: unknown }): Promise<string[]> {
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'seo-edge-'));
  const outfile = path.join(outDir, 'sitemap-fn.mjs');
  try {
    await build({
      entryPoints: [path.join(ROOT, 'supabase', 'functions', 'sitemap', 'index.ts')],
      bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'silent',
      plugins: [{
        name: 'stubs-deno',
        setup(b) {
          b.onResolve({ filter: /^https:\/\/deno\.land\/std@[^/]+\/http\/server\.ts$/ }, () => ({ path: 'serve', namespace: 'stub' }));
          b.onResolve({ filter: /^https:\/\/esm\.sh\/@supabase\/supabase-js/ }, () => ({ path: 'supabase', namespace: 'stub' }));
          b.onLoad({ filter: /^serve$/, namespace: 'stub' }, () => ({ contents: 'export function serve(handler) { globalThis.__seoSitemapHandler = handler; }', loader: 'js' }));
          b.onLoad({ filter: /^supabase$/, namespace: 'stub' }, () => ({
            contents: `export function createClient() {
              const rows = [
                { slug: 'perfil-normal', updated_at: '2026-10-01T00:00:00Z' },
                { slug: 'diana-ziegler', updated_at: '2026-10-01T00:00:00Z' },
                { slug: 'marcado-test', updated_at: '2026-10-01T00:00:00Z', is_test: true },
              ];
              const result = { data: rows, error: null };
              const chain = { select: () => chain, eq: () => chain, not: () => chain, then: (ok, ko) => Promise.resolve(result).then(ok, ko) };
              return { from: () => chain, rpc: async () => (${JSON.stringify(rpc)}) };
            }`,
            loader: 'js',
          }));
        },
      }],
    });
    (globalThis as any).Deno = { env: { get: () => undefined } };
    await import(pathToFileURL(outfile).href + `?t=${Date.now()}-${Math.random()}`);
    const handler = (globalThis as any).__seoSitemapHandler as (req: Request) => Promise<Response>;
    const res = await handler(new Request('https://example.test/functions/v1/sitemap'));
    expect(res.status).toBe(200);
    return locs(await res.text());
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
}

test('Edge Function sitemap: sin /empleos ni /jobs con 0 ofertas, sin perfiles de prueba, y con ofertas vuelven', async () => {
  const sinOfertas = await rutasDeLaEdgeFunction({ data: [], error: null });
  expect(sinOfertas).not.toContain('/empleos');
  expect(sinOfertas).not.toContain('/jobs');
  expect(sinOfertas.filter((p) => p.startsWith('/cv/'))).toEqual(['/cv/perfil-normal']);
  expect(sinOfertas).toContain('/precios');

  // Si la lectura de ofertas falla no se sabe que haya 0: se dejan los listados
  const conError = await rutasDeLaEdgeFunction({ data: null, error: { message: 'no existe la funcion' } });
  expect(conError).toEqual(expect.arrayContaining(['/empleos', '/jobs']));

  const conOfertas = await rutasDeLaEdgeFunction({ data: [{ slug: 'oferta-1', published_at: '2026-10-20T00:00:00Z', country_code: 'ES', total_count: 1 }], error: null });
  expect(conOfertas).toEqual(expect.arrayContaining(['/empleos', '/jobs', '/es/ofertas/oferta-1', '/es/jobs/oferta-1']));
});
