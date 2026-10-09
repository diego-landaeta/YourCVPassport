/**
 * U18 — Plantillas de CV (todas menos Passport) en /cv/:slug con Supabase mockeado.
 *
 * Para cada plantilla, con un perfil mínimo (solo nombre, titular y resumen) y uno
 * completo, en español e inglés:
 *  - ningún texto fijo en el idioma equivocado (literales prohibidos por idioma,
 *    mirando también las pestañas ocultas: se usa textContent);
 *  - ningún `a[href="#"]` ni `javascript:`; todo enlace con target=_blank lleva
 *    rel="noopener noreferrer"; un proyecto sin URL (o con `javascript:`) sale sin <a>;
 *  - con <html class="dark"> y `cv-force-light` en el contenedor no queda texto
 *    claro sobre fondo claro (paridad claro/oscuro en exportaciones).
 * Plantillas con pestañas (gradient-blue, coral-pink, minimalist-yellow): con
 * `data-pdf-export="true"` en un ancestro y con emulateMedia('print') se ven todas
 * las pestañas seguidas con su título y sin los controles.
 *
 * Nada sale a producción: helpers/supabaseMock.ts responde todo en local.
 */
import { test, expect, type Page } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, mockSupabase, installInitState, makeProfiles, type MockDb, type Row } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);

const TEMPLATES = [
  'classic', 'modern-professional', 'corporate-classic', 'professional-classic', 'academic-standard',
  'creative-minimalist', 'creative-bold', 'creative-orange', 'creative-modern', 'urban',
  'gradient-blue', 'modern-clean', 'modern-minimalist', 'professional-blue', 'elegant-minimal',
  'minimalist-yellow', 'coral-pink', 'green-minimal', 'classic-sidebar', 'healthcare-professional',
] as const;
const TABBED = ['gradient-blue', 'coral-pink', 'minimalist-yellow'] as const;

// Literales que no pueden aparecer en cada idioma (los datos mock evitan estas palabras).
const FORBIDDEN: Record<'es' | 'en', RegExp[]> = {
  es: [
    /No experience listed/, /No education listed/, /No projects to display/, /No portfolio items/,
    /My Projects/, /View Project/, /View Profile/, /Get in Touch/, /Hello, I'm/, /Hi, I'm/,
    /About Me/, /Contact Me/, /Work Experience/, /A little about me/, /Featured Projects/,
    /Let's Work Together/, /\bPresent\b/, /\bOngoing\b/, /Track Record/, /Manifesto/,
    /Testimonials/, /HELLO_MY_NAME_IS/, /\bExperience\b/, /\bEducation\b/, /\bPortfolio\b/,
    /\bSkills\b/, /\bResume\b/, /\bProjects\b/, /\bContact\b/, /\bAbout\b/, /\bLocation\b/,
    /\bServices\b/, /\bLanguages\b/, /Collaborations/, /Credentials/, /\bExpert\b/,
    /Remote/, /\bYears\b/, /\bAwards\b/, /N\/A/,
  ],
  en: [
    /Experiencia/, /Educación/, /Formación/, /\bPresente\b/, /\bActual\b/, /Perfil/i,
    /Competencias/, /Habilidades/, /Información adicional/i, /Referencias/, /Resumen/,
    /Sobre mí/i, /Contáctame/, /Hola, soy/, /Proyectos/, /Ubicación/, /Certificaciones/,
    /Idiomas/, /Trayectoria/, /Portafolio/, /En curso/, /Agendar/, /Funcionalidad/,
    /Remote/, /\bYears\b/, /\bAwards\b/, /N\/A/,
  ],
};

// ---------------------------------------------------------------------------
// Datos mock (sin palabras de los literales prohibidos)
// ---------------------------------------------------------------------------

function buildProfile(template: string, full: boolean, n: number): { profile: Row; rows: MockDb } {
  const id = `00000000-0000-4000-8000-0000001${String(n).padStart(5, '0')}`;
  const profile: Row = {
    id,
    slug: `u18-${full ? 'full' : 'min'}-${template}`,
    full_name: full ? 'Nora Quintana Ruiz' : 'Leo Mira',
    headline: full ? 'QA Lead' : 'QA',
    summary: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    meta_description: full ? 'nora@example.test' : null,
    linkedin_url: full ? 'linkedin.com/in/nora-qa' : null,
    github_url: full ? 'javascript:alert(1)' : null,
    location: full ? 'Madrid' : null,
    template,
    template_color: null,
    avatar_url: null,
    photo_url: null,
    role: 'professional',
    plan: 'pro',
    is_active: true,
    is_open_to_messages: true,
    wizard_completed: true,
    country_code: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  };
  if (!full) {
    return { profile, rows: { experiences: [], education: [], skills: [], languages: [], portfolio_items: [], stamps: [] } };
  }
  const experiences = [0, 1].map((i) => ({
    id: `${id}-e${i}`, profile_id: id, company_name: `Acme ${i + 1} SL`, position: `QA Lead ${i + 1}`,
    start_date: `${2022 - i * 3}-01-01`, end_date: i === 0 ? null : '2021-06-01', is_current: i === 0,
    description: 'Lorem ipsum dolor sit amet.', location: 'Madrid', sort_order: i,
  }));
  const education = [{
    id: `${id}-ed0`, profile_id: id, institution_name: 'Uni Norte', degree: 'MSc Data',
    field_of_study: 'Data', start_date: '2014-09-01', end_date: null, description: null, sort_order: 0,
  }];
  const skills = ['TypeScript', 'SQL', 'Figma'].map((name, i) => ({
    id: `${id}-s${i}`, profile_id: id, name, level: 'EXPERT', percentage: 80, category: 'Tech', sort_order: i,
  }));
  const languages = [{ id: `${id}-l0`, profile_id: id, name: 'Euskera', level: 'C1', is_native: false, sort_order: 0 }];
  const portfolio_items = [
    { id: `${id}-p0`, profile_id: id, title: 'Atlas', description: 'Lorem ipsum.', type: 'PROJECT', url: 'https://example.com/atlas', sort_order: 0 },
    { id: `${id}-p1`, profile_id: id, title: 'Boreal', description: 'Lorem ipsum.', type: 'PROJECT', url: null, sort_order: 1 },
    { id: `${id}-p2`, profile_id: id, title: 'Cirrus', description: 'Lorem ipsum.', type: 'PROJECT', url: 'javascript:alert(1)', sort_order: 2 },
    { id: `${id}-c0`, profile_id: id, title: 'AWS SAA', issuer: 'Amazon', type: 'CERTIFICATION', issue_date: '2023-01-01', sort_order: 3 },
    { id: `${id}-k0`, profile_id: id, title: 'Open Data', organization: 'Civic Lab', type: 'COLLABORATION', start_date: '2023-01-01', is_current: true, sort_order: 4 },
  ];
  return { profile, rows: { experiences, education, skills, languages, portfolio_items, stamps: [] } };
}

function buildDb(): MockDb {
  const db: MockDb = { profiles: makeProfiles(2), experiences: [], education: [], skills: [], languages: [], portfolio_items: [], stamps: [] };
  TEMPLATES.forEach((template, ti) => {
    for (const full of [false, true]) {
      const { profile, rows } = buildProfile(template, full, ti * 2 + (full ? 1 : 0));
      db.profiles.push(profile);
      for (const [table, list] of Object.entries(rows)) db[table].push(...list);
    }
  });
  return db;
}

// ---------------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------------

async function openCv(page: Page, slug: string) {
  await page.goto(`/cv/${slug}`);
  await expect(page.locator('.cv-template h1').first()).toBeVisible({ timeout: 30_000 });
}

async function linkAudit(page: Page) {
  return page.evaluate(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.cv-template a'));
    return {
      hashLinks: links.filter((a) => a.getAttribute('href') === '#').length,
      jsLinks: links.filter((a) => /^\s*javascript:/i.test(a.getAttribute('href') || '')).length,
      blankWithoutRel: links
        .filter((a) => a.target === '_blank')
        .filter((a) => !/noopener/.test(a.rel) || !/noreferrer/.test(a.rel))
        .map((a) => a.outerHTML.slice(0, 120)),
      // Enlaces de proyecto por título
      projectLinks: links.filter((a) => /Atlas|Boreal|Cirrus/.test(a.textContent || '')).map((a) => ({
        text: (a.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        href: a.getAttribute('href'),
        rel: a.rel,
      })),
      linkedin: links.filter((a) => /linkedin/i.test(a.getAttribute('href') || '')).map((a) => a.getAttribute('href')),
    };
  });
}

/** Textos visibles claros (luminancia > 0,8) sobre un fondo efectivo claro. */
async function lightOnLight(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const lum = (c: string) => {
      const m = (c.match(/[\d.]+/g) || []).map(Number);
      const ch = m.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
      return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
    };
    const alpha = (c: string) => { const m = (c.match(/[\d.]+/g) || []).map(Number); return m.length > 3 ? m[3] : 1; };
    const out: string[] = [];
    const root = document.querySelector('.cv-template')!;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      const text = (n.textContent || '').trim();
      const el = n.parentElement;
      if (!text || !el) continue;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (r.width === 0 || r.height === 0 || cs.visibility !== 'visible' || alpha(cs.color) === 0) continue;
      // Opacidad acumulada (p. ej. capas que solo aparecen al pasar el ratón)
      let op = 1;
      for (let e: Element | null = el; e; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
      if (op < 0.05) continue;
      // Fondo efectivo: primer ancestro con color opaco; si antes hay una imagen/degradado, no se juzga
      let bg: string | null = null;
      for (let e: Element | null = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.backgroundImage !== 'none') { bg = null; break; }
        if (alpha(s.backgroundColor) >= 0.9) { bg = s.backgroundColor; break; }
      }
      if (!bg) continue;
      if (lum(cs.color) > 0.8 && lum(bg) > 0.8) out.push(`${text.slice(0, 40)} (${cs.color} sobre ${bg})`);
    }
    return out;
  });
}

async function tabState(page: Page) {
  return page.evaluate(() => {
    const visible = (el: Element | null) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && getComputedStyle(el).display !== 'none';
    };
    const panels = Array.from(document.querySelectorAll('.cv-template [data-cv-tab]'));
    return {
      panels: panels.map((p) => ({ tab: p.getAttribute('data-cv-tab'), visible: visible(p), title: visible(p.querySelector('h2')) })),
      tablistVisible: visible(document.querySelector('.cv-template [role="tablist"]')),
      text: (document.querySelector('.cv-template') as HTMLElement).innerText,
    };
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('U18 plantillas: idioma, enlaces y claro forzado', () => {
  // El idioma lo fija installInitState en cada navegacion: un test por idioma.
  for (const template of TEMPLATES) {
    for (const lang of ['es', 'en'] as const) {
      test(`${template} (${lang})`, async ({ page, context }) => {
        test.setTimeout(150_000); // el primer test de WebKit compila la app en frío
        await installInitState(context, { language: lang, theme: 'light' });
        await mockSupabase(context, buildDb());

        for (const full of [false, true]) {
          const slug = `u18-${full ? 'full' : 'min'}-${template}`;
          await openCv(page, slug);
          const label = `${template} ${lang} ${full ? 'completo' : 'minimo'}`;

          // 1) Idioma: todo el texto del CV, incluidas las pestañas ocultas
          const text = await page.locator('.cv-template').evaluate((el) => (el.textContent || '').replace(/\s+/g, ' '));
          const wrong = FORBIDDEN[lang].filter((re) => re.test(text)).map(String);
          expect(wrong, `${label}: literales en el idioma equivocado`).toEqual([]);
          expect(text.toLowerCase()).toContain(full ? 'nora' : 'leo');

          // 2) Enlaces
          const links = await linkAudit(page);
          expect(links.hashLinks, `${label}: a[href="#"]`).toBe(0);
          expect(links.jsLinks, `${label}: javascript:`).toBe(0);
          expect(links.blankWithoutRel, `${label}: target=_blank sin rel`).toEqual([]);
          for (const l of links.projectLinks) {
            expect(l.text, `${label}: proyecto sin URL enlazado`).toMatch(/Atlas/);
            expect(l.href).toBe('https://example.com/atlas');
            expect(l.rel).toContain('noopener');
          }
          for (const href of links.linkedin) expect(href).toBe('https://linkedin.com/in/nora-qa');
          if (full && ['gradient-blue', 'coral-pink', 'minimalist-yellow'].includes(template)) {
            expect(links.projectLinks.map((l) => l.text.slice(0, 5))).toEqual(['Atlas']);
          }

          // 3) Claro forzado con la pagina en oscuro: sin texto claro sobre fondo claro
          if (lang === 'es') {
            await page.evaluate(() => {
              document.documentElement.classList.add('dark');
              document.querySelector('.cv-template')!.classList.add('cv-force-light');
            });
            expect(await lightOnLight(page), `${label}: texto claro sobre claro con cv-force-light`).toEqual([]);
            await page.evaluate(() => {
              document.documentElement.classList.remove('dark');
              document.querySelector('.cv-template')!.classList.remove('cv-force-light');
            });
          }
        }
      });
    }
  }
});

test.describe('U18 plantillas con pestañas: exportación e impresión', () => {
  for (const template of TABBED) {
    test(`${template}: data-pdf-export y print muestran todas las pestañas`, async ({ page, context }, testInfo) => {
      test.setTimeout(90_000);
      await installInitState(context, { language: 'es', theme: 'light' });
      await mockSupabase(context, buildDb());
      await page.goto(`/cv/u18-full-${template}`);
      await expect(page.locator('.cv-template h1').first()).toBeVisible({ timeout: 30_000 });

      // En pantalla: solo la pestaña activa y los controles visibles
      const screen = await tabState(page);
      expect(screen.panels.length).toBeGreaterThanOrEqual(3);
      expect(screen.panels.filter((p) => p.visible)).toHaveLength(1);
      expect(screen.panels.every((p) => !p.title)).toBe(true);
      expect(screen.tablistVisible).toBe(true);

      const expectAll = (s: Awaited<ReturnType<typeof tabState>>, mode: string) => {
        expect(s.panels.every((p) => p.visible), `${mode}: ${JSON.stringify(s.panels)}`).toBe(true);
        expect(s.panels.every((p) => p.title), `${mode}: titulos`).toBe(true);
        expect(s.tablistVisible, `${mode}: controles`).toBe(false);
        // Contenido de las distintas pestañas
        expect(s.text).toContain('QA Lead 1');
        expect(s.text).toContain('Atlas');
        if (template !== 'minimalist-yellow') expect(s.text).toContain('Lorem ipsum dolor sit amet, consectetur');
      };

      // data-pdf-export="true" en un ancestro (lo pone el generador de PDF)
      await page.evaluate(() => document.querySelector('.cv-template')!.setAttribute('data-pdf-export', 'true'));
      expectAll(await tabState(page), 'data-pdf-export');
      await page.screenshot({ path: testInfo.outputPath(`${template}-pdf-export.png`), fullPage: true });
      await page.evaluate(() => document.querySelector('.cv-template')!.removeAttribute('data-pdf-export'));
      expect((await tabState(page)).panels.filter((p) => p.visible)).toHaveLength(1);

      // Impresion
      await page.emulateMedia({ media: 'print' });
      expectAll(await tabState(page), 'print');
      if (testInfo.project.name === 'chromium' && template === 'gradient-blue') {
        const pdf = await page.pdf({ format: 'A4', printBackground: true });
        expect((pdf.toString('latin1').match(/\/Type\s*\/Page(?![a-zA-Z])/g) || []).length).toBeGreaterThanOrEqual(1);
      }
      await page.emulateMedia({ media: 'screen' });
      expect((await tabState(page)).panels.filter((p) => p.visible)).toHaveLength(1);
    });
  }
});
