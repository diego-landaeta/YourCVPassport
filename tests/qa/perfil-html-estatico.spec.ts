/**
 * scripts/generate-profile-html.mjs: el HTML estático de /cv/:slug lleva en <title> y
 * en las meta etiquetas datos que escribe el usuario (nombre, titular, resumen...).
 * Antes solo se escapaban las comillas y, al usar String.replace con un string, `$&`
 * o `$'` en los datos reinyectaban HTML. Se genera el HTML con un perfil malicioso,
 * se carga en el navegador y se comprueba que no se ejecuta nada y que los textos
 * aparecen literales.
 *
 *   npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/perfil-html-estatico.spec.ts
 */
import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');

const EVIL = `Ana</title><script>window.__pwned=1</script>$&$'"><img src=x onerror="window.__pwned=2">`;

test('HTML estático del perfil: datos del usuario escapados, sin scripts inyectados', async ({ page }) => {
  const mod = await import(pathToFileURL(path.join(ROOT, 'scripts', 'generate-profile-html.mjs')).href);
  const profile = {
    slug: 'ana-qa',
    full_name: EVIL,
    headline: `Analista ${EVIL}`,
    summary: `Resumen ${EVIL}`,
    location: 'Madrid',
    avatar_url: `https://cdn.example.test/a.png"><script>window.__pwned=3</script>`,
    meta_title: null,
    meta_description: null,
  };
  const metaTags = mod.generateMetaTags(profile, [{ name: `Skill ${EVIL}` }], [{ title: 'Puesto' }]);
  const base = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const html: string = mod.injectMetaTags(base, metaTags);

  // Un solo <title> y ningún <script>/<img> nuevo en el <head>
  const head = html.slice(0, html.indexOf('</head>'));
  expect(head.match(/<title>/g)).toHaveLength(1);
  expect(head).not.toContain('<script>window.__pwned');
  expect(head).not.toMatch(/<img src=x/);

  // En el navegador: nada se ejecuta y los textos son literales
  await page.route('**/*', route => route.request().url().startsWith('http://qa.local/') ? route.fulfill({ contentType: 'text/html', body: html }) : route.abort());
  await page.goto('http://qa.local/cv/ana-qa');
  expect(await page.evaluate(() => (window as any).__pwned)).toBeUndefined();
  expect(await page.title()).toBe(metaTags.title);
  const meta = (sel: string) => page.locator(sel).getAttribute('content');
  expect(await meta('meta[name="description"]')).toBe(metaTags.description);
  expect(await meta('meta[property="og:title"]')).toBe(metaTags.title);
  expect(await meta('meta[property="og:image"]')).toBe(profile.avatar_url);
  expect(await meta('meta[property="og:url"]')).toBe('https://yourcvpassport.com/cv/ana-qa');
  expect(await meta('meta[name="twitter:title"]')).toBe(metaTags.title);
  expect(await page.locator('head script:not([src]):not([type="application/ld+json"])').evaluateAll(els => els.map(e => e.textContent).filter(t => t?.includes('__pwned')))).toEqual([]);
  expect(await page.locator('head img').count()).toBe(0);
});
