/**
 * QA U11: enlaces de relleno.
 *
 * Comprueba contra la app local (Supabase mockeado, nada sale a produccion) que en las
 * paginas publicas tocadas no queda ningun enlace a "#", vacio ni al repo inexistente
 * github.com/yourusername, y que cada enlace interno lleva a una ruta que NO pinta la 404.
 * Tambien abre el feed con una sesion falsa y revisa el pie lateral (rutas reales y año actual).
 *
 *   QA_PORT=5411 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u11-enlaces.local.spec.ts --output=test-results/u11
 *
 * Capturas: con U11_SHOTS=antes|despues se guardan en test-results/u11/capturas/<fase>-*.png
 * (sin la variable no se hacen; asi se pueden sacar las del commit base con el mismo spec).
 */
import { test, expect, type Page, type BrowserContext, type TestInfo, type Locator } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SAFE_CONTEXT_OPTIONS, ADMIN_ID, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHOTS_DIR = path.resolve(HERE, '..', '..', 'test-results', 'u11', 'capturas');
const SHOTS_PHASE = process.env.U11_SHOTS;

type Lang = 'es' | 'en';

const PAGES: Record<Lang, string[]> = {
  es: ['/', '/profesionales/ayuda', '/empresas/integraciones', '/empresas/seguridad', '/nosotros/contacto'],
  en: ['/', '/professionals/help', '/companies/integrations', '/companies/security', '/about/contact'],
};

const FEED_LINKS: Record<Lang, { label: string; href: string }[]> = {
  es: [
    { label: 'Acerca de', href: '/nosotros' },
    { label: 'Privacidad', href: '/privacidad' },
    { label: 'Condiciones', href: '/terminos' },
    { label: 'Centro de ayuda', href: '/profesionales/ayuda' },
  ],
  en: [
    { label: 'About', href: '/about' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Help center', href: '/professionals/help' },
  ],
};

async function setup(context: BrowserContext, lang: Lang, sessionProfile: Record<string, any> | null = null, db: Record<string, any[]> = {}) {
  await installInitState(context, { language: lang, theme: 'light', sessionProfile });
  return mockSupabase(context, { blog_posts: [], ...db });
}

/**
 * Espera a que la ruta perezosa pinte su contenido dentro de <main>: un titulo o un
 * formulario (el login en movil no muestra h1/h2 visibles, solo el formulario).
 */
async function waitForContent(page: Page) {
  await expect(page.locator('main').locator('h1:visible, h2:visible, form:visible').first()).toBeVisible({ timeout: 30000 });
}

/**
 * goto + espera a que React monte algo en #root. Con varios navegadores en paralelo contra
 * el mismo Vite, a veces la primera carga se queda en blanco (Vite re-optimizando
 * dependencias): en ese caso se recarga una vez.
 */
async function gotoApp(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  const mounted = page.locator('#root > *').first();
  try {
    await expect(mounted).toBeAttached({ timeout: 30000 });
  } catch {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(mounted).toBeAttached({ timeout: 30000 });
  }
}

/** La 404 de la app pinta un h1 con el texto "404" (t.notFoundPage.code). */
async function expectNot404(page: Page, from: string) {
  await waitForContent(page);
  expect(new URL(page.url()).pathname, `${from} acabó en /404`).not.toBe('/404');
  await expect(page.locator('h1', { hasText: /^\s*404\s*$/ }), `${from} muestra la página 404`).toHaveCount(0);
}

async function shot(page: Page, testInfo: TestInfo, name: string, element?: Locator) {
  if (!SHOTS_PHASE) return;
  const file = path.join(SHOTS_DIR, `${SHOTS_PHASE}-${testInfo.project.name}-${name}.png`);
  if (element) await element.screenshot({ path: file });
  else await page.screenshot({ path: file, fullPage: true });
}

/** Enlaces <a> de la pagina: href crudo (atributo) y ruta resuelta. */
async function collectLinks(page: Page) {
  return page.locator('a').evaluateAll(els => els.map(el => ({
    raw: el.getAttribute('href'),
    text: (el.textContent || '').trim().slice(0, 60),
    resolved: (el as HTMLAnchorElement).href,
  })));
}

for (const lang of ['es', 'en'] as Lang[]) {
  test.describe(`U11 enlaces (${lang.toUpperCase()})`, () => {
    test('sin enlaces de relleno y todos los internos llevan a una ruta existente', async ({ page, context }, testInfo) => {
      test.setTimeout(480_000); // ~40 rutas por idioma contra un Vite de desarrollo
      await setup(context, lang);
      const internal = new Map<string, string>(); // ruta -> pagina donde aparece

      for (const route of PAGES[lang]) {
        await gotoApp(page, route);
        await expectNot404(page, route);
        // Footer y bloques animados: bajar hasta el final para que todo este montado
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await shot(page, testInfo, `${lang}${route === '/' ? '-home' : route.replace(/\//g, '-')}`);

        const links = await collectLinks(page);
        const bad = links.filter(l =>
          l.raw === null || l.raw.trim() === '' || l.raw.trim() === '#' ||
          /github\.com\/yourusername/i.test(l.raw));
        expect(bad, `enlaces de relleno en ${route}`).toEqual([]);

        for (const l of links) {
          const u = new URL(l.resolved);
          if (u.origin !== new URL(page.url()).origin) continue;
          if (u.pathname === new URL(page.url()).pathname) continue; // anclas de la propia pagina
          if (!internal.has(u.pathname)) internal.set(u.pathname, route);
        }
      }

      expect(internal.size).toBeGreaterThan(0);
      const broken: string[] = [];
      for (const [target, from] of internal) {
        await gotoApp(page, target);
        try {
          await expectNot404(page, `${target} (enlazada desde ${from})`);
        } catch (e) {
          broken.push(`${target} (desde ${from}): ${(e as Error).message.split('\n')[0]}`);
        }
      }
      // Fuera del alcance de U11: los bloques de la home Pricing.tsx y Security.tsx anteponen
      // "/es" a rutas inglesas (/es/pricing, /es/companies/plans, /es/companies/security) y
      // dan 404. Se dejan anotados en el informe en vez de fallar aquí; el resto debe estar limpio.
      const outOfScope = broken.filter(b => b.startsWith('/es/'));
      for (const b of outOfScope) testInfo.annotations.push({ type: 'fuera-de-U11', description: b });
      expect(broken.filter(b => !b.startsWith('/es/')), 'enlaces internos que acaban en 404').toEqual([]);
    });

    test('el pie lateral del feed enlaza a rutas reales y muestra el año actual', async ({ page, context }, testInfo) => {
      test.setTimeout(120_000);
      const me = {
        id: ADMIN_ID, full_name: 'QA Usuario', email: 'qa@example.test', role: 'professional',
        wizard_completed: true, first_login_completed: true, dashboard_tour_completed: true,
        template: 'classic', slug: 'qa-usuario', headline: 'QA', plan: 'free', is_active: true,
        created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-02T00:00:00Z',
      };
      await setup(context, lang, me, { profiles: [me], feed_posts: [], groups: [], group_members: [] });
      await gotoApp(page, lang === 'es' ? '/comunidad' : '/feed');

      const year = String(new Date().getFullYear());
      const footer = page.locator('aside').filter({ hasText: 'YourCVPassport' }).filter({ has: page.locator(`a[href="${FEED_LINKS[lang][0].href}"]`) });
      await expect(footer).toHaveCount(1, { timeout: 60000 });
      // En móvil el aside derecho está oculto (hidden lg:flex): se comprueba el DOM igual
      const isDesktop = !testInfo.project.name.startsWith('mobile');
      if (isDesktop) await expect(footer).toBeVisible();

      for (const { label, href } of FEED_LINKS[lang]) {
        await expect(footer.locator(`a[href="${href}"]`)).toHaveText(label);
      }
      await expect(footer.locator('a[href="#"]')).toHaveCount(0);
      await expect(footer.getByText(lang === 'es' ? 'Accesibilidad' : 'Accessibility', { exact: true })).toHaveCount(0);
      await expect(footer).toContainText(`© ${year} YourCVPassport`);
      if (isDesktop) {
        // Solo el bloque del pie (el aside es sticky y en la captura de pagina no se ve)
        const pie = footer.locator(`a[href="${FEED_LINKS[lang][0].href}"]`).locator('..');
        await pie.scrollIntoViewIfNeeded();
        await shot(page, testInfo, `${lang}-feed`, pie);
      }

      // Cada enlace del pie lleva a una pagina real (no a la 404)
      for (const { href } of FEED_LINKS[lang]) {
        await gotoApp(page, href);
        await expectNot404(page, href);
      }
    });
  });
}
