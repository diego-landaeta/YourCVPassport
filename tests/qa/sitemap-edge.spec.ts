/**
 * Edge Function `sitemap` (supabase/functions/sitemap/index.ts) ejecutada de verdad:
 * se compila con esbuild sustituyendo `serve` (Deno std) y supabase-js por stubs, se
 * llama a su handler con un Request y se comprueba el XML que devuelve:
 *
 * - mismas rutas estáticas que scripts/generate-sitemap.mjs (sin /resources/success,
 *   con términos, privacidad y comunidad, sin las raíces de sección duplicadas);
 * - cada artículo del blog solo bajo la ruta de su idioma;
 * - todas las URLs cargan en local sin la página 404 ni redirección.
 *
 * Contra el build de producción (las etiquetas de Helmet son estables):
 *   QA_PORT=5302 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/sitemap-edge.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { installInitState, mockSupabase, SAFE_CONTEXT_OPTIONS } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const BASE = 'https://yourcvpassport.com';
// Título por defecto de index.html (en español desde el issue #5)
const INDEX_TITLE = 'YourCVPassport - Plataforma de CV profesional verificado';
const CV_SLUG = 'perfil-qa-sitemap';

/** Compila la función con stubs y devuelve el XML que responde su handler. */
async function runEdgeFunction(outDir: string): Promise<{ status: number; type: string | null; xml: string }> {
  const outfile = path.join(outDir, 'sitemap-fn.mjs');
  await build({
    entryPoints: [path.join(ROOT, 'supabase', 'functions', 'sitemap', 'index.ts')],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    logLevel: 'silent',
    plugins: [{
      name: 'stubs-deno',
      setup(b) {
        b.onResolve({ filter: /^https:\/\/deno\.land\/std@[^/]+\/http\/server\.ts$/ }, () => ({ path: 'serve', namespace: 'stub' }));
        b.onResolve({ filter: /^https:\/\/esm\.sh\/@supabase\/supabase-js/ }, () => ({ path: 'supabase', namespace: 'stub' }));
        b.onLoad({ filter: /^serve$/, namespace: 'stub' }, () => ({
          contents: 'export function serve(handler) { globalThis.__sitemapHandler = handler; }',
          loader: 'js',
        }));
        // Un perfil público: la función lo debe listar como /cv/:slug
        b.onLoad({ filter: /^supabase$/, namespace: 'stub' }, () => ({
          contents: `export function createClient() {
            const result = { data: [{ slug: '${CV_SLUG}', updated_at: '2026-10-01T00:00:00Z' }], error: null };
            const chain = { select: () => chain, eq: () => chain, not: () => chain, then: (ok, ko) => Promise.resolve(result).then(ok, ko) };
            return { from: () => chain };
          }`,
          loader: 'js',
        }));
      },
    }],
  });
  (globalThis as any).Deno = { env: { get: () => undefined } };
  await import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
  const handler = (globalThis as any).__sitemapHandler as (req: Request) => Promise<Response>;
  expect(typeof handler, 'la función registra su handler con serve()').toBe('function');
  const res = await handler(new Request('https://example.test/functions/v1/sitemap'));
  return { status: res.status, type: res.headers.get('content-type'), xml: await res.text() };
}

const locsOf = (xml: string) => [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const isDynamic = (p: string) => /^\/(resources\/blog|recursos\/blog|cv|jobs|empleos)\/./.test(p);

test('Edge Function sitemap: rutas correctas, blog por idioma y todas cargan sin 404', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Función y recorrido completo: basta con un navegador');
  test.setTimeout(30 * 60_000);

  const { status, type, xml } = await runEdgeFunction(testInfo.outputPath());
  expect(status).toBe(200);
  expect(type).toContain('application/xml');
  fs.writeFileSync(testInfo.outputPath('sitemap-edge.xml'), xml);

  const locs = locsOf(xml);
  expect(new Set(locs).size, 'sin URLs repetidas').toBe(locs.length);
  for (const l of locs) expect(l.startsWith(`${BASE}/`), l).toBe(true);
  const paths = locs.map(l => l.slice(BASE.length) || '/');

  // Rutas estáticas: las mismas que el generador del sitemap
  const genOut = testInfo.outputPath('sitemap-generador.xml');
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'generate-sitemap.mjs'), `--output=${genOut}`], {
    cwd: ROOT,
    env: { ...process.env, VITE_SUPABASE_URL: '', VITE_SUPABASE_ANON_KEY: '' },
    stdio: 'pipe',
  });
  const genPaths = locsOf(fs.readFileSync(genOut, 'utf8')).map(l => l.slice(BASE.length) || '/');
  const staticEdge = paths.filter(p => !isDynamic(p)).sort();
  const staticGen = genPaths.filter(p => !isDynamic(p)).sort();
  expect(staticEdge).toEqual(staticGen);

  expect(paths).not.toContain('/resources/success');
  for (const p of ['/resources/success-stories', '/recursos/exito', '/terms', '/terminos', '/privacy', '/privacidad', '/feed', '/comunidad']) {
    expect(paths, p).toContain(p);
  }
  for (const p of ['/product', '/producto', '/professionals', '/profesionales', '/companies', '/empresas', '/resources', '/recursos']) {
    expect(paths, p).not.toContain(p);
  }

  // Blog: cada artículo solo bajo la ruta de su idioma (igual que el generador)
  const meta = fs.readFileSync(path.join(ROOT, 'content', 'posts', 'index.ts'), 'utf8');
  const posts = [...meta.slice(meta.indexOf('allPostsMeta:')).matchAll(/\{[^{}]*"slug":\s*"([^"]+)"[^{}]*"published_at":\s*"([^"]+)"[^{}]*"lang":\s*"([a-z]+)"[^{}]*\}/g)]
    .map(m => ({ slug: m[1], published: m[2], lang: m[3] }))
    .filter(p => new Date(p.published) <= new Date());
  expect(posts.length).toBeGreaterThan(100);
  for (const p of posts) {
    const own = `${p.lang === 'en' ? '/resources/blog/' : '/recursos/blog/'}${p.slug}`;
    const other = `${p.lang === 'en' ? '/recursos/blog/' : '/resources/blog/'}${p.slug}`;
    expect(paths, own).toContain(own);
    expect(paths, other).not.toContain(other);
  }
  // Perfiles públicos desde la BD
  expect(paths).toContain(`/cv/${CV_SLUG}`);

  // Todas las URLs (salvo el CV de prueba, que no existe en el mock) cargan sin 404
  await installInitState(context, { language: 'es', theme: 'light' });
  await mockSupabase(context, { blog_posts: [], job_postings: [] });
  const failed: string[] = [];
  for (const p of paths.filter(x => !x.startsWith('/cv/'))) {
    await page.goto(p, { waitUntil: 'domcontentloaded' });
    try {
      await expect.poll(() => page.title(), { timeout: 30_000 }).not.toBe(INDEX_TITLE);
      await page.waitForTimeout(150);
      const noindex = await page.locator('meta[name="robots"][content*="noindex"]').count();
      const now = new URL(page.url()).pathname;
      if (noindex > 0 || now !== p) failed.push(`${p} -> ${now}${noindex ? ' (404/noindex)' : ''}`);
    } catch {
      failed.push(`${p} -> sin título propio`);
    }
  }
  expect(failed).toEqual([]);
});
