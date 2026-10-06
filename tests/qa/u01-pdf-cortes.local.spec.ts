/**
 * U1 — PDF del CV sin cortes.
 *
 * Problema: generateCVPDF capturaba el CV como una imagen alta y la troceaba en paginas
 * A4 a altura fija, asi que el salto de pagina atravesaba tarjetas, lineas de texto e
 * incluso letras.
 *
 * Este spec ejecuta la funcion REAL `generateCVPDF` (utils/pdfGenerator.ts) servida por
 * Vite sobre perfiles largos (Supabase mockeado con helpers/supabaseMock.ts, nada sale a
 * produccion), intercepta el PDF y analiza la imagen que jsPDF incrusta: en cada salto de
 * pagina, las filas de pixeles a ambos lados del corte tienen que ser fondo (sin texto).
 * Una fila que cruza texto tiene muchos "bordes" (cambios bruscos de luminancia); una de
 * fondo solo los de las columnas o los bordes laterales de alguna tarjeta.
 * Tambien comprueba que la ultima pagina no queda solo con el pie (#11).
 *
 * Ademas comprueba que el iframe de exportacion carga `/cv/:slug?export=1` y que el
 * contenedor del CV lleva `data-pdf-export="true"` durante la captura.
 *
 * Evidencias: los PDF se guardan en la carpeta de salida del test; si existe
 * U01_PDF_EVIDENCE se copian tambien ahi (para renderizar capturas antes/despues).
 */
import { test, expect, type Page, type TestInfo } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { SAFE_CONTEXT_OPTIONS, mockSupabase, installInitState, makeProfiles, type MockDb, type Row } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

// ---------------------------------------------------------------------------
// Datos mock: perfiles largos (varias paginas) en plantillas de una y dos columnas
// ---------------------------------------------------------------------------

const PARRAFO =
  'Lideré la migración de la plataforma a una arquitectura de microservicios, coordinando a un equipo ' +
  'de ocho personas y reduciendo los tiempos de despliegue en un 60 %. Diseñé procesos de calidad, ' +
  'automatización de pruebas y observabilidad, y acompañé a perfiles junior en su crecimiento técnico. ' +
  'Definí la hoja de ruta técnica con producto y negocio, y presenté resultados trimestrales a dirección.';

const TEMPLATES = ['passport', 'classic', 'modern-professional', 'classic-sidebar', 'professional-blue', 'gradient-blue'] as const;

function longProfile(template: string, n: number): { profile: Row; rows: MockDb } {
  const id = `00000000-0000-4000-8000-0000000d${String(n).padStart(4, '0')}`;
  const profile: Row = {
    id,
    slug: `u01-${template}`,
    full_name: `Lucía Fernández Cortes ${n}`,
    headline: 'Directora de Ingeniería de Software',
    summary: `${PARRAFO} ${PARRAFO}`,
    email: `u01-${n}@example.test`,
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
  const experiences = Array.from({ length: 10 }, (_, i) => ({
    id: `${id}-e${i}`,
    profile_id: id,
    company_name: `Empresa ${i + 1} S.L.`,
    position: `Responsable de área ${i + 1}`,
    start_date: `${2024 - i * 2}-01-01`,
    end_date: i === 0 ? null : `${2025 - i * 2}-12-01`,
    is_current: i === 0,
    // Longitudes distintas para que los bloques no caigan siempre en la misma posicion
    description: i % 3 === 0 ? `${PARRAFO} ${PARRAFO}` : PARRAFO,
    achievements: ['Reduje costes un 20 % en dos ejercicios', 'Lancé tres productos nuevos', 'Formé a 12 personas del equipo'].slice(0, 1 + (i % 3)),
    location: 'Madrid',
    sort_order: i,
  }));
  const education = Array.from({ length: 5 }, (_, i) => ({
    id: `${id}-ed${i}`,
    profile_id: id,
    institution_name: `Universidad ${i + 1}`,
    degree: i === 0 ? 'Máster' : 'Grado',
    field_of_study: 'Ingeniería Informática',
    start_date: `${2014 - i * 2}-09-01`,
    end_date: `${2016 - i * 2}-06-30`,
    description: 'Proyecto final sobre sistemas distribuidos, tolerancia a fallos y consenso en redes de baja latencia.',
    sort_order: i,
  }));
  const skills = Array.from({ length: 24 }, (_, i) => ({
    id: `${id}-s${i}`,
    profile_id: id,
    name: `Habilidad ${i + 1}`,
    level: (['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const)[i % 4],
    percentage: 40 + ((i * 13) % 60),
    category: i % 2 ? 'Herramientas' : 'Lenguajes',
    sort_order: i,
  }));
  const languages = ['Español', 'Inglés', 'Francés', 'Alemán'].map((name, i) => ({
    id: `${id}-l${i}`,
    profile_id: id,
    name,
    level: i === 0 ? 'NATIVE' : 'B2',
    is_native: i === 0,
    sort_order: i,
  }));
  const portfolio_items = Array.from({ length: 4 }, (_, i) => ({
    id: `${id}-p${i}`,
    profile_id: id,
    title: `Proyecto ${i + 1}`,
    description: 'Plataforma interna de analítica en tiempo real con paneles para dirección y equipos.',
    type: 'PROJECT',
    url: null,
    thumbnail_url: null,
    sort_order: i,
  }));
  return { profile, rows: { experiences, education, skills, languages, portfolio_items, stamps: [] } };
}

function buildDb(): MockDb {
  const db: MockDb = { profiles: makeProfiles(3), experiences: [], education: [], skills: [], languages: [], portfolio_items: [], stamps: [] };
  TEMPLATES.forEach((template, n) => {
    const { profile, rows } = longProfile(template, n);
    db.profiles.push(profile);
    for (const [table, list] of Object.entries(rows)) db[table].push(...list);
  });
  return db;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

const EVIDENCE = process.env.U01_PDF_EVIDENCE || '';

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

/** Lector minimo de los PDF de jsPDF: paginas e imagen JPEG incrustada (la primera). */
function parseJsPdf(buf: Buffer): { pages: number; width: number; height: number; jpeg: Buffer; images: number } {
  const s = buf.toString('latin1');
  const pages = (s.match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length;
  const images = (s.match(/\/Subtype\s*\/Image/g) || []).length;
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
  return { pages, width: num('Width'), height: num('Height'), jpeg: Buffer.from(data), images };
}

/** Margen (filas de la imagen) que se analiza a cada lado de un salto de pagina. */
const ROWS_AROUND_CUT = 2;

/**
 * Para cada salto de pagina (filas `round(p * bandPx)`), el maximo de "bordes" por fila
 * en las filas de alrededor. Un borde es un cambio de luminancia > 40 entre pixeles a
 * distancia 2 (robusto a antialiasing y a los artefactos del JPEG).
 */
async function edgesAtCuts(page: Page, jpeg: Buffer, bandPx: number, pages: number): Promise<number[]> {
  return page.evaluate(async ([b64, band, n, around]) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${b64}`;
    await img.decode();
    const w = img.naturalWidth;
    const out: number[] = [];
    const c = document.createElement('canvas');
    c.width = w;
    c.height = 2 * (around as number) + 1;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    for (let p = 1; p < (n as number); p++) {
      const y = Math.round(p * (band as number));
      const y0 = y - (around as number);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, y0, w, c.height, 0, 0, w, c.height);
      const px = ctx.getImageData(0, 0, w, c.height).data;
      let worst = 0;
      for (let r = 0; r < c.height; r++) {
        const lum = (x: number) => {
          const i = (r * w + x) * 4;
          return 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        };
        let edges = 0;
        let inEdge = false;
        for (let x = 2; x < w; x++) {
          const isEdge = Math.abs(lum(x) - lum(x - 2)) > 40;
          if (isEdge && !inEdge) edges++;
          inEdge = isEdge;
        }
        worst = Math.max(worst, edges);
      }
      out.push(worst);
    }
    return out;
  }, [jpeg.toString('base64'), bandPx, pages, ROWS_AROUND_CUT] as const);
}

/**
 * Lineas de texto (grupos de filas consecutivas con muchos bordes) en la ultima pagina.
 * El pie ("Powered by" + URL) son 2: con solo eso la pagina estaria vacia (#11).
 */
async function textLinesOnLastPage(page: Page, jpeg: Buffer, bandPx: number, pages: number): Promise<number> {
  return page.evaluate(async ([b64, band, n, minEdges]) => {
    const img = new Image();
    img.src = `data:image/jpeg;base64,${b64}`;
    await img.decode();
    const w = img.naturalWidth;
    const y0 = Math.round(((n as number) - 1) * (band as number));
    const h = Math.max(1, img.naturalHeight - y0);
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(img, 0, y0, w, h, 0, 0, w, h);
    const px = ctx.getImageData(0, 0, w, h).data;
    let lines = 0;
    let inLine = false;
    for (let r = 0; r < h; r++) {
      let edges = 0;
      let inEdge = false;
      for (let x = 2; x < w; x++) {
        const i = (r * w + x) * 4;
        const j = (r * w + x - 2) * 4;
        const l1 = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
        const l0 = 0.299 * px[j] + 0.587 * px[j + 1] + 0.114 * px[j + 2];
        const isEdge = Math.abs(l1 - l0) > 40;
        if (isEdge && !inEdge) edges++;
        inEdge = isEdge;
      }
      const textRow = edges > (minEdges as number);
      if (textRow && !inLine) lines++;
      inLine = textRow;
    }
    return lines;
  }, [jpeg.toString('base64'), bandPx, pages, MAX_BACKGROUND_EDGES] as const);
}

/**
 * Bordes maximos que se aceptan en una fila de fondo: limites de columnas, bordes
 * laterales de tarjetas o barras. Una fila que cruza una linea de texto pasa de 30.
 */
const MAX_BACKGROUND_EDGES = 16;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('U1 generateCVPDF: los saltos de pagina no cortan texto', () => {
  for (const template of TEMPLATES) {
    test(`${template} / perfil largo`, async ({ page, context }, testInfo) => {
      // Vite en modo dev sirve cientos de modulos: con la maquina cargada el primer
      // render puede tardar bastante, de ahi los margenes amplios.
      test.setTimeout(300_000);
      await installInitState(context, { language: 'es', theme: 'light' });
      await mockSupabase(context, buildDb());

      const slug = `u01-${template}`;
      await page.goto(`/cv/${slug}`, { waitUntil: 'commit' });
      await expect(page.locator('.cv-template h1, .cv-template h2').first()).toBeVisible({ timeout: 150_000 });

      const result = await page.evaluate(async (s) => {
        let pdfBlob: Blob | null = null;
        const orig = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (obj: Blob | MediaSource) => {
          if (obj instanceof Blob && obj.type === 'application/pdf') pdfBlob = obj;
          return orig(obj);
        };
        // Lo que se ve dentro del iframe de exportacion mientras se genera el PDF
        const seen = { src: '', exportAttr: false };
        const timer = setInterval(() => {
          const ifr = document.querySelector<HTMLIFrameElement>('iframe[aria-hidden="true"]');
          if (!ifr) return;
          seen.src = ifr.getAttribute('src') || seen.src;
          const marked = ifr.contentDocument?.querySelector('.cv-template[data-pdf-export="true"]');
          if (marked) seen.exportAttr = true;
        }, 50);
        const m = await import('/utils/pdfGenerator.ts');
        let error: string | null = null;
        await m.generateCVPDF({ profileSlug: s, profileId: '', fileName: `${s}.pdf`, onError: (e: Error) => { error = e.message; } });
        clearInterval(timer);
        URL.createObjectURL = orig;
        const b64 = pdfBlob
          ? await new Promise<string>((res) => {
              const fr = new FileReader();
              fr.onload = () => res(String(fr.result).split(',')[1]);
              fr.readAsDataURL(pdfBlob as Blob);
            })
          : null;
        return { error, b64, seen };
      }, slug);

      expect(result.error).toBeNull();
      expect(result.b64, 'no se genero el PDF').toBeTruthy();

      const buf = Buffer.from(result.b64!, 'base64');
      const file = saveEvidence(testInfo, `u01-${template}.pdf`, buf);
      const pdf = parseJsPdf(buf);

      // Banda de imagen por pagina (mismo reparto que computePdfLayout)
      const imgHeightMm = (pdf.height * 210) / pdf.width;
      const ceilPages = Math.ceil(imgHeightMm / 297 - 1e-6);
      const lastSlice = imgHeightMm - (ceilPages - 1) * 297;
      const shrunk = ceilPages > 1 && lastSlice < 297 * 0.05;
      const bandPx = shrunk ? pdf.height / (ceilPages - 1) : (pdf.width * 297) / 210;
      const edges = await edgesAtCuts(page, pdf.jpeg, bandPx, pdf.pages);
      const lastPageLines = await textLinesOnLastPage(page, pdf.jpeg, bandPx, pdf.pages);

      testInfo.annotations.push({
        type: 'pdf',
        description: `${path.basename(file)}: ${pdf.pages} pag, imagen ${pdf.width}x${pdf.height}, bordes en cada corte: ${edges.join(', ') || '(sin cortes)'}, lineas en la ultima pag: ${lastPageLines}; iframe ${result.seen.src}`,
      });
      console.log(`[${testInfo.project.name}] ${testInfo.annotations.at(-1)!.description}`);

      // El perfil es largo: tiene que haber al menos un salto de pagina que comprobar
      expect(pdf.pages).toBeGreaterThanOrEqual(2);
      expect(pdf.width * pdf.height).toBeLessThanOrEqual(16_777_216);
      for (let i = 0; i < edges.length; i++) {
        expect(edges[i], `el corte entre las paginas ${i + 1} y ${i + 2} atraviesa texto`).toBeLessThanOrEqual(MAX_BACKGROUND_EDGES);
      }
      // La ultima pagina lleva contenido ademas del pie (2 lineas)
      expect(lastPageLines, 'la ultima pagina solo tiene el pie').toBeGreaterThan(2);

      // Señales para otras unidades: URL de exportacion y atributo en el contenedor
      expect(result.seen.src).toMatch(new RegExp(`/cv/${slug}\\?export=1$`));
      expect(result.seen.exportAttr).toBe(true);
    });
  }
});
