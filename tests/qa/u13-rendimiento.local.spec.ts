/**
 * U13 — Rendimiento. App local (Vite) con Supabase mockeado.
 *
 *  1. Traducciones bajo demanda: al entrar en espanol solo se descarga translations/es.ts;
 *     al cambiar ES <-> EN el texto pasa de un idioma al otro de golpe (sin pantalla en
 *     blanco, sin claves crudas ni textos intermedios).
 *  2. Exportacion ATS (PDF y DOCX) con useATSExport, cuyas librerias (@react-pdf/renderer,
 *     docx, file-saver) ahora se importan al exportar: produce una descarga. Tambien la
 *     exportacion en servidor, que antes llamaba a `undefined/functions/v1/...`.
 *  3. La imagen principal de las paginas de producto (HeroImage) carga con prioridad alta.
 *
 * Uso: QA_PORT=5413 npx playwright test -c tests/qa/playwright.qa.config.ts u13-rendimiento --output=test-results/u13
 */
import { test, expect, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, mockSupabase, makeProfiles } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const ATS_ES = '/producto/ats';
const ATS_EN = '/product/ats';

/** Peticiones del servidor de Vite a los diccionarios (`/translations/en.ts?...`). */
function trackDictionaries(page: Page) {
  const seen = { en: 0, es: 0 };
  page.on('request', (req) => {
    const m = new URL(req.url()).pathname.match(/\/translations\/(en|es)\.ts$/);
    if (m) seen[m[1] as 'en' | 'es']++;
  });
  return seen;
}

/** Registra cada texto que toma el <h1> y si #root llega a quedarse vacio. */
async function watchHeading(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    w.__u13 = { h1: [] as string[], rootEmptied: false };
    const root = document.getElementById('root')!;
    const check = () => {
      if (root.childElementCount === 0) w.__u13.rootEmptied = true;
      const text = document.querySelector('main h1, h1')?.textContent?.trim() ?? '';
      const list: string[] = w.__u13.h1;
      if (list[list.length - 1] !== text) list.push(text);
    };
    check();
    new MutationObserver(check).observe(root, { subtree: true, childList: true, characterData: true });
  });
}

async function switchLanguage(page: Page, to: 'en' | 'es') {
  // Movil: boton rapido con la bandera. Escritorio: desplegable del Header.
  const quick = page.getByRole('button', { name: to === 'en' ? 'Switch to English' : 'Cambiar a español' });
  if (await quick.isVisible()) {
    await quick.click();
    return;
  }
  await page.locator('header button', { hasText: to === 'en' ? /^\s*ES\s*$/ : /^\s*EN\s*$/ }).first().click();
  await page.getByRole('button', { name: to === 'en' ? 'English (EN)' : 'Español (ES)' }).click();
}

test.describe('U13 rendimiento', () => {
  test('carga solo el diccionario del idioma activo y cambia ES <-> EN sin parpadeo', async ({ page, context }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await installInitState(context, { language: 'es' });
    await mockSupabase(context, {});
    const dicts = trackDictionaries(page);

    await page.goto(ATS_ES);
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const esTitle = (await h1.textContent())!.trim();
    expect(esTitle.length).toBeGreaterThan(5);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    expect(dicts.es).toBeGreaterThan(0);
    expect(dicts.en, 'el diccionario ingles no debe descargarse si no se usa').toBe(0);

    await watchHeading(page);
    await switchLanguage(page, 'en');
    await expect(page).toHaveURL(new RegExp(`${ATS_EN}$`));
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(h1).not.toHaveText(esTitle);
    const enTitle = (await h1.textContent())!.trim();
    expect(dicts.en).toBeGreaterThan(0);

    await switchLanguage(page, 'es');
    await expect(page).toHaveURL(new RegExp(`${ATS_ES}$`));
    await expect(h1).toHaveText(esTitle);

    const seen = await page.evaluate(() => (window as any).__u13);
    expect(seen.rootEmptied, '#root no debe vaciarse al cambiar de idioma').toBe(false);
    // Solo los dos titulos reales: ni vacio, ni claves crudas, ni textos intermedios
    for (const text of seen.h1) expect([esTitle, enTitle]).toContain(text);
    expect(seen.h1).toEqual([esTitle, enTitle, esTitle]);
    await expect(page.locator('body')).not.toContainText('atsPage.');
    expect(errors).toEqual([]);
  });

  test('la imagen principal (HeroImage) carga con prioridad alta y sin lazy', async ({ page, context }) => {
    await installInitState(context, { language: 'es' });
    await mockSupabase(context, {});
    await page.goto(ATS_ES);
    const hero = page.locator('img[fetchpriority="high"]').first();
    await expect(hero).toBeAttached();
    await expect(hero).toHaveAttribute('loading', 'eager');
    await expect(hero).toHaveAttribute('decoding', 'async');
    await expect(hero).toHaveAttribute('width', /^\d+$/);
    await expect(hero).toHaveAttribute('height', /^\d+$/);
    await expect(page.locator('img[loading="lazy"][fetchpriority="high"]')).toHaveCount(0);
  });

  for (const format of ['pdf', 'docx'] as const) {
    for (const mode of ['cliente', 'servidor'] as const) {
      test(`exportacion ATS ${format.toUpperCase()} (${mode}) produce una descarga`, async ({ page, context }) => {
        test.setTimeout(120_000);
        const [me] = makeProfiles(1);
        await installInitState(context, { language: 'es', sessionProfile: me });
        await mockSupabase(context, { profiles: [me] });

        // Edge Functions de exportacion: se responde un fichero falso y se guarda la URL
        const fnCalls: string[] = [];
        const FAKE = `fichero-${format}-servidor-qa`;
        await page.route(/\/functions\/v1\/export-(pdf|docx)/, (route) => {
          fnCalls.push(route.request().url());
          if (route.request().method() === 'OPTIONS') {
            return route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization,content-type', 'access-control-allow-methods': 'POST,OPTIONS' } });
          }
          return route.fulfill({ status: 200, headers: { 'access-control-allow-origin': '*' }, contentType: 'application/octet-stream', body: FAKE });
        });

        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');

        const [download] = await Promise.all([
          page.waitForEvent('download', { timeout: 90_000 }),
          page.evaluate(async ({ format, preferServerSide }) => {
            // Mismo React que la app: se toman las URLs de deps que Vite reescribe en /index.tsx
            const idx = await (await fetch('/index.tsx')).text();
            const pick = (re: RegExp) => {
              const m = idx.match(re);
              if (!m) throw new Error(`no encontrado: ${re}`);
              return m[1];
            };
            const reactMod: any = await import(/* @vite-ignore */ pick(/["'](\/node_modules\/\.vite\/deps\/react\.js[^"']*)["']/));
            const rdcMod: any = await import(/* @vite-ignore */ pick(/["'](\/node_modules\/\.vite\/deps\/react-dom_client\.js[^"']*)["']/));
            const React = reactMod.default ?? reactMod;
            const createRoot = (rdcMod.default ?? rdcMod).createRoot;

            const { useATSExport }: any = await import(/* @vite-ignore */ '/hooks/useATSExport.ts');
            const { processProfileForATS }: any = await import(/* @vite-ignore */ '/utils/pdf/ats-optimizer.ts');
            const { ModernATSTemplate }: any = await import(/* @vite-ignore */ '/components/ats-export/templates/ModernATSTemplate.tsx');

            let api: any;
            const Harness = () => { api = useATSExport({ preferServerSide }); return null; };
            const mount = document.createElement('div');
            document.body.appendChild(mount);
            createRoot(mount).render(React.createElement(Harness));
            for (let i = 0; i < 50 && !api; i++) await new Promise((r) => setTimeout(r, 20));

            const profile = {
              profile: {
                id: 'qa-u13', full_name: 'Ana QA', email: 'ana@example.test', headline: 'Ingeniera de datos',
                summary: 'Perfil de prueba para la exportacion ATS.', location: 'Madrid, ES', phone: null,
              },
              experiences: [{ id: 'e1', position: 'Data Engineer', company_name: 'ACME', start_date: '2022-01-01', end_date: null, is_current: true, description: 'ETL y analitica de datos.', achievements: null, location: 'Madrid' }],
              education: [{ id: 'd1', degree: 'Grado', institution_name: 'UPM', field_of_study: 'Informatica', grade: null, start_date: '2015-09-01', end_date: '2019-06-30', is_current: false }],
              skills: [{ id: 's1', name: 'Python', level: 'expert' }],
              languages: [{ id: 'l1', name: 'Ingles', level: 'C1', is_native: false }],
              certifications: [], portfolioItems: [], visas: [],
            };
            const data = processProfileForATS(profile, [], 'es');
            const doc = React.createElement(ModernATSTemplate, { data, language: 'es' });
            await api.exportAndDownload('qa-u13', { template: 'modern', language: 'es', format }, doc, data, `cv-qa.${format}`);
          }, { format, preferServerSide: mode === 'servidor' }),
        ]);

        expect(download.suggestedFilename()).toBe(`cv-qa.${format}`);
        const file = await download.path();
        const fs = await import('fs');
        const bytes = fs.readFileSync(file!);
        if (mode === 'servidor') {
          // Antes la URL era `undefined/functions/v1/...`: ahora sale del cliente de Supabase
          expect(fnCalls.some((u) => /^https:\/\/[a-z0-9]+\.supabase\.co\/functions\/v1\/export-/.test(u))).toBe(true);
          expect(bytes.toString('utf8')).toBe(FAKE);
        } else {
          expect(fnCalls).toEqual([]);
          // Cabecera real: %PDF para PDF y ZIP (PK) para DOCX
          expect(bytes.subarray(0, format === 'pdf' ? 4 : 2).toString('latin1')).toBe(format === 'pdf' ? '%PDF' : 'PK');
        }
      });
    }
  }
});
