/**
 * QA #11 (PDF con paginas vacias) y #18 (imprimir sale en blanco).
 *
 * Todo en local: Supabase mockeado (helpers/supabaseMock.ts), sesion falsa cuando hace
 * falta y ninguna peticion a produccion.
 *
 * #11: ejecuta la funcion REAL `generateCVPDF` (utils/pdfGenerator.ts) servida por Vite
 *      sobre perfiles mock cortos y largos en varias plantillas (Passport incluida),
 *      intercepta el PDF generado, cuenta las paginas y comprueba que ninguna esta vacia
 *      analizando la imagen que jsPDF incrusta (una banda de la imagen por pagina).
 * #18: (a) "Imprimir" del Testing Hub, (b) Ctrl+P en /cv/:slug, (c) descarga
 *      "selectable" (printablePDFGenerator) y (d) "Imprimir / PDF" del panel de
 *      analiticas. Se comprueba en modo print (emulateMedia) que sale el contenido y,
 *      en Chromium, se genera ademas el PDF real con page.pdf().
 *
 * Evidencias: si existe QA_PDF_EVIDENCE se copian ahi los PDF generados.
 */
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { SAFE_CONTEXT_OPTIONS, mockSupabase, installInitState, makeProfiles, ADMIN_ID, type MockDb, type Row } from './helpers/supabaseMock';

// La app registra /sw.js: en WebKit las peticiones que pasan por el service worker
// esquivan page.route y llegarian a produccion. Se bloquea para que el mock lo cubra todo.
test.use(SAFE_CONTEXT_OPTIONS);

// ---------------------------------------------------------------------------
// Datos mock
// ---------------------------------------------------------------------------

const LOREM =
  'Lideré la migración de la plataforma a una arquitectura de microservicios, coordinando a un equipo ' +
  'de ocho personas y reduciendo los tiempos de despliegue en un 60 %. Diseñé procesos de calidad, ' +
  'automatización de pruebas y observabilidad, y acompañé a perfiles junior en su crecimiento técnico.';

function cvProfile(slug: string, template: string, long: boolean, n: number): { profile: Row; rows: MockDb } {
  const id = `00000000-0000-4000-8000-0000000c${String(n).padStart(4, '0')}`;
  const profile: Row = {
    id,
    slug,
    full_name: long ? `Lucía Fernández Prueba ${n}` : `Pablo Corto Prueba ${n}`,
    headline: long ? 'Directora de Ingeniería de Software' : 'Analista de datos',
    summary: long ? `${LOREM} ${LOREM}` : 'Analista de datos con experiencia en informes y paneles.',
    email: `qa${n}@example.test`,
    location: 'Madrid, España',
    template,
    template_color: null,
    avatar_url: null,
    photo_url: null,
    role: 'professional',
    plan: 'pro',
    language: 'es',
    is_active: true,
    is_open_to_messages: true,
    wizard_completed: true,
    country_code: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  const nExp = long ? 8 : 1;
  const experiences = Array.from({ length: nExp }, (_, i) => ({
    id: `${id}-e${i}`,
    profile_id: id,
    company_name: `Empresa ${i + 1} S.L.`,
    position: `Puesto ${i + 1}`,
    start_date: `${2024 - i * 2}-01-01`,
    end_date: i === 0 ? null : `${2025 - i * 2}-12-01`,
    is_current: i === 0,
    description: long ? LOREM : 'Elaboración de informes mensuales.',
    achievements: long ? ['Reduje costes un 20 %', 'Lancé tres productos', 'Formé a 12 personas'] : null,
    location: 'Madrid',
    sort_order: i,
  }));
  const education = Array.from({ length: long ? 4 : 1 }, (_, i) => ({
    id: `${id}-ed${i}`,
    profile_id: id,
    institution_name: `Universidad ${i + 1}`,
    degree: i === 0 ? 'Máster' : 'Grado',
    field_of_study: 'Ingeniería Informática',
    start_date: `${2014 - i * 2}-09-01`,
    end_date: `${2016 - i * 2}-06-30`,
    description: long ? 'Proyecto final sobre sistemas distribuidos y tolerancia a fallos.' : null,
    sort_order: i,
  }));
  const skills = Array.from({ length: long ? 20 : 3 }, (_, i) => ({
    id: `${id}-s${i}`,
    profile_id: id,
    name: `Habilidad ${i + 1}`,
    level: (['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const)[i % 4],
    percentage: 40 + ((i * 13) % 60),
    category: i % 2 ? 'Herramientas' : 'Lenguajes',
    sort_order: i,
  }));
  const languages = (long ? ['Español', 'Inglés', 'Francés', 'Alemán'] : ['Español']).map((name, i) => ({
    id: `${id}-l${i}`,
    profile_id: id,
    name,
    level: i === 0 ? 'NATIVE' : 'B2',
    is_native: i === 0,
    sort_order: i,
  }));
  const portfolio_items = long
    ? Array.from({ length: 3 }, (_, i) => ({
        id: `${id}-p${i}`,
        profile_id: id,
        title: `Proyecto ${i + 1}`,
        description: 'Plataforma interna de analítica en tiempo real.',
        type: 'PROJECT',
        url: null,
        thumbnail_url: null,
        sort_order: i,
      }))
    : [];
  return { profile, rows: { experiences, education, skills, languages, portfolio_items, stamps: [] } };
}

const TEMPLATES = ['passport', 'classic', 'gradient-blue', 'creative-orange'] as const;
const CASES = TEMPLATES.flatMap((template, ti) =>
  (['corto', 'largo'] as const).map((len, li) => ({ template, len, slug: `qa-${len}-${template}`, n: ti * 2 + li }))
);

function buildDb(): MockDb {
  const db: MockDb = {
    profiles: makeProfiles(3),
    experiences: [],
    education: [],
    skills: [],
    languages: [],
    portfolio_items: [],
    stamps: [],
  };
  for (const c of CASES) {
    const { profile, rows } = cvProfile(c.slug, c.template, c.len === 'largo', c.n);
    db.profiles.push(profile);
    for (const [table, list] of Object.entries(rows)) db[table].push(...list);
  }
  return db;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const EVIDENCE = process.env.QA_PDF_EVIDENCE || '';

function saveEvidence(testInfo: TestInfo, name: string, data: Buffer): string {
  const file = testInfo.outputPath(name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, data);
  if (EVIDENCE) {
    fs.mkdirSync(EVIDENCE, { recursive: true });
    fs.writeFileSync(path.join(EVIDENCE, `${testInfo.project.name}-${name}`), data);
  }
  return file;
}

interface ParsedPdf {
  pages: number;
  width: number;
  height: number;
  jpeg: Buffer;
}

/** Lector minimo de los PDF de jsPDF: paginas e imagen JPEG incrustada. */
function parseJsPdf(buf: Buffer): ParsedPdf {
  const s = buf.toString('latin1');
  const pages = (s.match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length;
  const at = s.indexOf('/Subtype /Image');
  if (at < 0) throw new Error('El PDF no contiene ninguna imagen');
  const dictStart = s.lastIndexOf('<<', at);
  const streamKw = s.indexOf('stream', at);
  const dict = s.slice(dictStart, streamKw);
  const num = (k: string) => Number((dict.match(new RegExp(`/${k}\\s+(\\d+)`)) || [])[1]);
  let dataStart = streamKw + 'stream'.length;
  if (s[dataStart] === '\r') dataStart++;
  if (s[dataStart] === '\n') dataStart++;
  let data = buf.subarray(dataStart, dataStart + num('Length'));
  if (/FlateDecode/.test(dict)) data = zlib.inflateSync(data);
  return { pages, width: num('Width'), height: num('Height'), jpeg: Buffer.from(data) };
}

/**
 * Analiza en el navegador la imagen del PDF: para cada pagina, el % de pixeles
 * "de tinta" en la banda de la imagen que muestra esa pagina.
 */
async function inkPerPage(page: Page, jpeg: Buffer, bandPx: number, pages: number): Promise<number[]> {
  return page.evaluate(async ([b64, band, n]) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${b64}`;
    await img.decode();
    const k = 300 / img.naturalWidth; // reducido: suficiente para detectar texto
    const w = 300;
    const h = Math.max(1, Math.round(img.naturalHeight * k));
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    const out: number[] = [];
    for (let p = 0; p < (n as number); p++) {
      const y0 = Math.floor(p * (band as number) * k);
      const y1 = Math.min(h, Math.floor((p + 1) * (band as number) * k));
      // Fondo = luminancia mediana de la banda; "tinta" = pixeles que se apartan > 60 de
      // ella (texto, iconos, bordes). Un fondo liso o en degradado suave da ~0 %.
      const lums: number[] = [];
      for (let y = y0; y < y1; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          lums.push(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
        }
      }
      if (!lums.length) { out.push(0); continue; }
      const median = [...lums].sort((a, b) => a - b)[Math.floor(lums.length / 2)];
      const ink = lums.filter((l) => Math.abs(l - median) > 60).length;
      out.push((ink / lums.length) * 100);
    }
    return out;
  }, [jpeg.toString('base64'), bandPx, pages] as const);
}

/** Textos visibles en modo print fuera de un contenedor (para detectar cabecera/navegacion del sitio). */
async function visibleTextOutside(page: Page, containerSelector: string): Promise<string[]> {
  return page.evaluate((sel) => {
    const out: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = (n.textContent || '').trim();
      const el = n.parentElement;
      if (!text || !el || el.closest(sel) || el.closest('script,style,noscript')) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility === 'visible') out.push(text.slice(0, 60));
    }
    return out;
  }, containerSelector);
}

async function isVisible(page: Page, selector: string, text: string): Promise<boolean> {
  return page.evaluate(([sel, txt]) => {
    return Array.from(document.querySelectorAll<HTMLElement>(sel)).some((el) => {
      if (!(el.textContent || '').includes(txt)) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility === 'visible';
    });
  }, [selector, text] as const);
}

async function printPdf(page: Page, testInfo: TestInfo, name: string): Promise<{ pages: number; file: string } | null> {
  if (testInfo.project.name !== 'chromium' && testInfo.project.name !== 'mobile-chromium') return null;
  const buf = await page.pdf({ format: 'A4', printBackground: true });
  const pages = (buf.toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length;
  return { pages, file: saveEvidence(testInfo, name, buf) };
}

// ---------------------------------------------------------------------------
// #11 PDF "exacto" (generateCVPDF)
// ---------------------------------------------------------------------------

test.describe('#11 generateCVPDF: paginas = contenido, ninguna vacia', () => {
  for (const c of CASES) {
    test(`${c.template} / perfil ${c.len}`, async ({ page, context }, testInfo) => {
      test.setTimeout(120_000);
      await installInitState(context, { language: 'es', theme: 'light' });
      await mockSupabase(context, buildDb());

      await page.goto(`/cv/${c.slug}`);
      await expect(page.locator('.cv-template h1, .cv-template h2').first()).toBeVisible({ timeout: 30_000 });
      // La web muestra los botones de contacto a un visitante (Passport y ProfileContactButtons)
      if (c.template === 'passport') {
        await expect(page.locator('.cv-template').getByText('Contáctame').first()).toBeVisible();
      }

      const result = await page.evaluate(async (slug) => {
        // Captura el Blob del PDF (jsPDF -> FileSaver -> URL.createObjectURL)
        let pdfBlob: Blob | null = null;
        const orig = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (obj: Blob | MediaSource) => {
          if (obj instanceof Blob && obj.type === 'application/pdf') pdfBlob = obj;
          return orig(obj);
        };
        // Foto del contenido que se captura (el iframe se elimina al terminar)
        let captured: { text: string; height: number } | null = null;
        const timer = setInterval(() => {
          const ifr = document.querySelector<HTMLIFrameElement>('iframe[aria-hidden="true"]');
          const body = ifr?.contentDocument?.body;
          const wrapper = body?.firstElementChild as HTMLElement | null;
          if (body && wrapper && body.childElementCount === 1 && (wrapper.textContent || '').includes('Powered by')) {
            captured = { text: wrapper.textContent || '', height: wrapper.scrollHeight };
          }
        }, 50);
        const m = await import('/utils/pdfGenerator.ts');
        let error: string | null = null;
        await m.generateCVPDF({
          profileSlug: slug,
          profileId: '',
          fileName: `${slug}.pdf`,
          onError: (e: Error) => { error = e.message; },
        });
        clearInterval(timer);
        URL.createObjectURL = orig;
        const b64 = pdfBlob
          ? await new Promise<string>((res) => {
              const fr = new FileReader();
              fr.onload = () => res(String(fr.result).split(',')[1]);
              fr.readAsDataURL(pdfBlob as Blob);
            })
          : null;
        return { error, b64, captured, iframesLeft: document.querySelectorAll('iframe[aria-hidden="true"]').length };
      }, c.slug);

      expect(result.error).toBeNull();
      expect(result.b64, 'no se genero el PDF').toBeTruthy();
      expect(result.iframesLeft).toBe(0);

      const buf = Buffer.from(result.b64!, 'base64');
      const file = saveEvidence(testInfo, `pdf11-${c.slug}.pdf`, buf);
      const pdf = parseJsPdf(buf);

      // Altura real capturada (px CSS) y paginas esperadas
      const scale = pdf.width / 1200;
      const cssHeight = pdf.height / scale;
      const imgHeightMm = (pdf.height * 210) / pdf.width;
      const ceilPages = Math.ceil(imgHeightMm / 297 - 1e-6);
      const lastSlice = imgHeightMm - (ceilPages - 1) * 297;
      const expectedPages = ceilPages > 1 && lastSlice < 297 * 0.05 ? ceilPages - 1 : ceilPages;
      const shrunk = expectedPages !== ceilPages;
      const bandPx = shrunk ? pdf.height / expectedPages : (pdf.width * 297) / 210;
      const ink = await inkPerPage(page, pdf.jpeg, bandPx, pdf.pages);

      testInfo.annotations.push({
        type: 'pdf',
        description: `${path.basename(file)}: ${pdf.pages} pag, imagen ${pdf.width}x${pdf.height} (scale ${scale.toFixed(2)}, ${Math.round(cssHeight)} px CSS), tinta/pag ${ink.map((v) => v.toFixed(2) + '%').join(' ')}`,
      });
      console.log(`[${testInfo.project.name}] ${testInfo.annotations.at(-1)!.description}`);

      // El contenido capturado ya no lleva los botones ni la caja "Contact Information"
      expect(result.captured, 'no se pudo observar el contenido capturado').not.toBeNull();
      const capturedText = result.captured!.text;
      // Algunas plantillas (creative-orange) solo muestran el nombre de pila
      expect(capturedText).toContain(c.len === 'largo' ? 'Lucía' : 'Pablo');
      expect(capturedText).toContain(c.len === 'largo' ? 'Directora de Ingeniería de Software' : 'Analista de datos');
      expect(capturedText).not.toContain('Contáctame');
      expect(capturedText).not.toContain('Agendar Reunión');
      expect(capturedText).not.toContain('Contact Information');

      // Antes: 8000 px de alto minimo y 5 paginas siempre
      expect(cssHeight).toBeLessThan(7000);
      expect(pdf.pages).toBe(expectedPages);
      // Canvas por debajo del limite de Safari/iOS
      expect(pdf.width * pdf.height).toBeLessThanOrEqual(16_777_216);
      // Ninguna pagina vacia (solo fondo o solo el pie)
      for (let i = 0; i < ink.length; i++) {
        expect(ink[i], `pagina ${i + 1} de ${ink.length} sin contenido`).toBeGreaterThan(0.2);
      }
      if (c.len === 'corto' && c.template === 'passport') expect(pdf.pages).toBe(1);
      // creative-orange no pinta la experiencia: su perfil largo cabe en una pagina
      if (c.len === 'largo' && c.template !== 'creative-orange') expect(pdf.pages).toBeGreaterThanOrEqual(2);
      expect(pdf.pages).toBeLessThan(5);
    });
  }
});

// ---------------------------------------------------------------------------
// #18 Impresion
// ---------------------------------------------------------------------------

test.describe('#18 imprimir no sale en blanco', () => {
  test('(a) Testing Hub: "Imprimir" muestra el CV con su cabecera', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    const db = buildDb();
    await installInitState(context, { sessionProfile: db.profiles.find((p) => p.id === ADMIN_ID), language: 'es', theme: 'light' });
    await mockSupabase(context, db);

    await page.goto('/admin');
    // En movil un elemento flotante tapa la tarjeta: se pulsa por DOM (mismo onClick)
    const hubCard = page.getByRole('button', { name: /Hub de Testing/ });
    await expect(hubCard).toBeVisible({ timeout: 45_000 });
    await hubCard.evaluate((el: HTMLElement) => el.click());
    await page.getByText('Datos de Muestra', { exact: true }).click();
    await expect(page.getByText('Vista Previa del CV')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('.cv-template').getByText('María González').first()).toBeVisible();

    await page.evaluate(() => { (window as any).__printCalls = 0; window.print = () => { (window as any).__printCalls++; }; });
    await page.getByRole('button', { name: 'Imprimir' }).click();
    expect(await page.evaluate(() => (window as any).__printCalls)).toBe(1);

    await page.emulateMedia({ media: 'print' });
    await page.evaluate(() => window.scrollTo(0, 0));
    const state = await page.evaluate(() => {
      const cv = document.querySelector('.cv-template')!.getBoundingClientRect();
      const name = Array.from(document.querySelectorAll('.cv-template h1')).find((h) => (h.textContent || '').includes('María González'));
      return {
        rootDisplay: getComputedStyle(document.getElementById('root')!).display,
        printMountDisplay: getComputedStyle(document.getElementById('print-mount')!).display,
        cvHeight: cv.height,
        // Posicion del nombre en el documento: tiene que caer en la primera pagina A4 (1123 px)
        nameTop: name ? name.getBoundingClientRect().top + window.scrollY : -1,
      };
    });
    expect(state.rootDisplay).not.toBe('none');
    expect(state.printMountDisplay).toBe('none');
    expect(state.cvHeight).toBeGreaterThan(300);
    expect(state.nameTop).toBeGreaterThanOrEqual(0);
    expect(state.nameTop).toBeLessThan(1000);
    expect(await isVisible(page, '.cv-template h1', 'María González')).toBe(true);
    expect(await isVisible(page, '.cv-template p', 'Senior Full Stack Developer')).toBe(true);
    expect(await visibleTextOutside(page, '.cv-template')).toEqual([]);
    await page.screenshot({ path: testInfo.outputPath('hub-print.png') });

    const pdf = await printPdf(page, testInfo, 'pdf18a-hub.pdf');
    if (pdf) expect(pdf.pages).toBeGreaterThanOrEqual(1);
  });

  test('(b) Ctrl+P en /cv/:slug: sale el CV sin la cabecera del sitio', async ({ page, context }, testInfo) => {
    await installInitState(context, { language: 'es', theme: 'light' });
    await mockSupabase(context, buildDb());

    await page.goto('/cv/qa-corto-passport');
    await expect(page.locator('.cv-template h1')).toHaveText(/Pablo Corto Prueba/, { timeout: 30_000 });

    await page.emulateMedia({ media: 'print' });
    const state = await page.evaluate(() => {
      const cv = document.querySelector('.cv-template')!.getBoundingClientRect();
      return {
        rootDisplay: getComputedStyle(document.getElementById('root')!).display,
        cvTop: cv.top + window.scrollY,
        cvHeight: cv.height,
        docHeight: document.documentElement.scrollHeight,
      };
    });
    expect(state.rootDisplay).not.toBe('none');
    expect(state.cvHeight).toBeGreaterThan(300);
    expect(state.cvTop).toBeLessThan(5);
    expect(await isVisible(page, '.cv-template header h1', 'Pablo Corto Prueba')).toBe(true);
    expect(await isVisible(page, '.cv-template header p', 'Analista de datos')).toBe(true);
    // Ni cabecera/navegacion/pie del sitio ni botones de contacto
    expect(await visibleTextOutside(page, '.cv-template')).toEqual([]);
    expect(await isVisible(page, '.cv-template button', 'Contáctame')).toBe(false);
    await page.screenshot({ path: testInfo.outputPath('cv-print.png'), fullPage: true });

    const pdf = await printPdf(page, testInfo, 'pdf18b-cv-ctrlP.pdf');
    if (pdf) {
      expect(pdf.pages).toBeGreaterThanOrEqual(1);
      expect(pdf.pages).toBeLessThanOrEqual(2);
    }
  });

  test('(c) descarga "selectable" (printablePDFGenerator) imprime el CV y limpia despues', async ({ page, context }, testInfo) => {
    test.setTimeout(90_000);
    await installInitState(context, { language: 'es', theme: 'light' });
    await mockSupabase(context, buildDb());

    await page.goto('/cv/qa-largo-classic');
    await expect(page.locator('.cv-template').getByText('Lucía Fernández Prueba').first()).toBeVisible({ timeout: 30_000 });

    const during = await page.evaluate(async () => {
      const w = window as any;
      w.__printCalls = 0;
      w.__success = 0;
      window.print = () => {
        w.__printCalls++;
        w.__duringPrint = {
          bodyClass: document.body.className,
          mountChildren: document.getElementById('print-mount')!.childElementCount,
        };
      };
      const m = await import('/utils/printablePDFGenerator.ts');
      await m.generatePrintablePDF({ profileSlug: 'qa-largo-classic', profileId: '', onSuccess: () => { w.__success++; } });
      return { calls: w.__printCalls, ...w.__duringPrint, copiedStyles: document.querySelectorAll('[data-from-iframe]').length };
    });
    expect(during.calls).toBe(1);
    expect(during.bodyClass).toContain('printing-cv');
    expect(during.mountChildren).toBe(1);

    // Mientras el dialogo esta abierto: se imprime #print-mount, no la app
    await page.emulateMedia({ media: 'print' });
    const printState = await page.evaluate(() => ({
      root: getComputedStyle(document.getElementById('root')!).display,
      mount: getComputedStyle(document.getElementById('print-mount')!).display,
    }));
    expect(printState.root).toBe('none');
    expect(printState.mount).toBe('block');
    expect(await isVisible(page, '#print-mount .cv-template *', 'Lucía Fernández Prueba')).toBe(true);
    const pdf = await printPdf(page, testInfo, 'pdf18c-selectable.pdf');
    if (pdf) expect(pdf.pages).toBeGreaterThanOrEqual(1);

    // Al cerrar el dialogo (afterprint) se deshace todo
    await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
    const after = await page.evaluate(() => ({
      bodyHasClass: document.body.classList.contains('printing-cv'),
      mountChildren: document.getElementById('print-mount')!.childElementCount,
      copiedStyles: document.querySelectorAll('[data-from-iframe]').length,
      success: (window as any).__success,
      root: getComputedStyle(document.getElementById('root')!).display,
      mount: getComputedStyle(document.getElementById('print-mount')!).display,
    }));
    expect(after).toEqual({ bodyHasClass: false, mountChildren: 0, copiedStyles: 0, success: 1, root: 'block', mount: 'none' });
    // Un Ctrl+P posterior vuelve a imprimir la pagina (el CV), no un #print-mount vacio
    expect(await isVisible(page, '.cv-template h1, .cv-template h2', 'Lucía Fernández Prueba')).toBe(true);

    // Si window.print() falla, tambien se limpia
    const onError = await page.evaluate(async () => {
      window.print = () => { throw new Error('print bloqueado'); };
      const m = await import('/utils/printablePDFGenerator.ts');
      let rejected = false;
      let success = 0;
      let errors = 0;
      try {
        await m.generatePrintablePDF({ profileSlug: 'qa-largo-classic', profileId: '', onSuccess: () => { success++; }, onError: () => { errors++; } });
      } catch {
        rejected = true;
      }
      return {
        rejected,
        success,
        errors,
        bodyHasClass: document.body.classList.contains('printing-cv'),
        mountChildren: document.getElementById('print-mount')!.childElementCount,
      };
    });
    expect(onError).toEqual({ rejected: true, success: 0, errors: 1, bodyHasClass: false, mountChildren: 0 });
  });

  test('(d) panel de analiticas: "Imprimir / PDF" no sale en blanco', async ({ page, context }, testInfo) => {
    await installInitState(context, { language: 'es', theme: 'light' });
    await mockSupabase(context, buildDb());
    const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script type="module">
import RefreshRuntime from "/@react-refresh";
RefreshRuntime.injectIntoGlobalHook(window);
window.$RefreshReg$ = () => {};
window.$RefreshSig$ = () => (type) => type;
window.__vite_plugin_react_preamble_installed__ = true;
</script></head>
<body><div id="root"></div><div id="print-mount"></div>
<script type="module" src="/tests/qa/fixtures/analyticsPrintHarness.tsx"></script></body></html>`;
    await page.route('**/__qa/analytics-print', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: html }));
    await page.goto('/__qa/analytics-print');
    await page.waitForFunction(() => (window as any).__harnessMounted === true, null, { timeout: 30_000 });
    await expect(page.getByText('321').first()).toBeVisible({ timeout: 20_000 });

    await page.evaluate(() => { (window as any).__printCalls = 0; window.print = () => { (window as any).__printCalls++; }; });
    await page.getByRole('button', { name: 'Exportar', exact: true }).click();
    await page.getByRole('button', { name: /Imprimir \/ PDF/ }).click();
    expect(await page.evaluate(() => (window as any).__printCalls)).toBe(1);

    await page.emulateMedia({ media: 'print' });
    const state = await page.evaluate(() => {
      const root = document.getElementById('root')!;
      const visibleTexts = Array.from(root.querySelectorAll<HTMLElement>('p, span, h1, h2, h3, div')).filter((el) => {
        const r = el.getBoundingClientRect();
        return el.childElementCount === 0 && (el.textContent || '').trim() && r.width > 0 && r.height > 0 && getComputedStyle(el).visibility === 'visible';
      }).length;
      return { root: getComputedStyle(root).display, visibleTexts };
    });
    expect(state.root).not.toBe('none');
    expect(state.visibleTexts).toBeGreaterThan(5);
    expect(await isVisible(page, '#root *', '321')).toBe(true);

    const pdf = await printPdf(page, testInfo, 'pdf18d-analytics.pdf');
    if (pdf) expect(pdf.pages).toBeGreaterThanOrEqual(1);
  });
});
