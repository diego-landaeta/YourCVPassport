/**
 * Bolsa de empleo: prueba de TECLADO (Tab, Shift+Tab, Enter, Escape) con Supabase MOCKEADO.
 *
 * Recorre con el teclado, sin ratón:
 *  - el listado /empleos (barra de búsqueda, pills de filtro, filas de oferta),
 *  - la ficha (Inscribirme, Guardar),
 *  - el modal de inscripción (foco atrapado; Escape cierra y devuelve el foco al disparador),
 *  - el asistente de ofertas de empresa (barra de pasos),
 *  - la puerta de aceptación de condiciones (LegalGate).
 *
 * Y comprueba en cada parada de foco que:
 *  - el elemento enfocado MUESTRA un anillo visible: su contorno o su sombra cambian respecto a cuando
 *    no tiene el foco (en las casillas/radios ocultos cuenta el anillo de su etiqueta o de su tarjeta);
 *  - no hay trampas de teclado: ninguna parada se repite dos veces seguidas, Shift+Tab vuelve a la
 *    parada anterior y, fuera de un modal, el foco avanza hasta salir del bloque.
 *
 *   QA_PORT=5442 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/teclado-bolsa.local.spec.ts --project=chromium
 */
import { test, expect, type BrowserContext, type Locator, type Page, type Route } from '@playwright/test';
import { buildFakeSession, installInitState, makeProfiles, mockSupabase, SAFE_CONTEXT_OPTIONS, type Row } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);
test.describe.configure({ timeout: 150_000 });

// ---------------------------------------------------------------------------
// Datos
// ---------------------------------------------------------------------------

const JOB_ID = '11111111-1111-4111-8111-111111111111';
const SLUG = 'enfermera-uci-madrid-11111111';
const CANON = `/es/ofertas/${SLUG}`;
const Q_CHOICE = '33333333-3333-4333-8333-333333333331';
const Q_YESNO = '33333333-3333-4333-8333-333333333332';

function listRow(i: number): Row {
  return {
    id: `00000000-0000-4000-8000-0000000001${String(i).padStart(2, '0')}`,
    title: `Oferta de prueba ${i}`,
    slug: `oferta-de-prueba-${i}-0000000${i}`,
    company_id: 'c1', company_name: `Empresa ${i}`, company_logo_url: null,
    country_code: 'ES', location_city: 'Madrid', work_mode: 'ONSITE', is_remote: false,
    contract_types: ['INDEFINITE'], schedule: 'FULL_TIME', category: 'IT_SOFTWARE', category2: null,
    vacancies: 1, experience_years: 2, summary: 'Descripcion corta de la oferta.',
    salary_min: 1800, salary_max: 2400, salary_currency: 'EUR', salary_period: 'MONTHLY', salary_mode: 'RANGE', show_salary: true,
    published_at: new Date(Date.now() - i * 3600_000).toISOString(),
    application_deadline: new Date(Date.now() + 20 * 86400_000).toISOString(),
    already_applied: false, total_count: 8,
  };
}
const LIST = Array.from({ length: 8 }, (_, i) => listRow(i + 1));

const DETAIL: Row = {
  id: JOB_ID, title: 'Enfermera UCI', slug: SLUG, company_id: 'c1', department: null,
  employment_type: null, work_mode: 'ONSITE', experience_level: null,
  location_city: 'Madrid', location_state: 'Madrid', location_country: 'ES', is_remote: false,
  description: '<p>Buscamos <strong>enfermera</strong> con experiencia.</p>',
  responsibilities: ['Cuidar pacientes'], requirements: ['Grado en Enfermería'], nice_to_have: null, benefits: ['Seguro médico'],
  required_skills: ['UCI'], optional_skills: null,
  salary_min: 1800, salary_max: 2400, salary_currency: 'EUR', salary_period: 'MONTHLY', show_salary: true,
  application_deadline: new Date(Date.now() + 25 * 86400_000).toISOString(), application_email: null, application_url: null,
  application_instructions: null, published_at: new Date(Date.now() - 5 * 86400_000).toISOString(),
  company_name: 'Hospital Norte', company_logo_url: null, company_website: 'https://hospital.example.com', company_description: 'Hospital de referencia.',
  status: 'PUBLISHED', accepting_applications: true, closed_at: null, country_code: 'ES', category: 'HEALTH_MEDICINE', category2: null,
  vacancies: 2, contract_types: ['INDEFINITE'], schedule: 'FULL_TIME', duration: null, start_date: null, start_immediate: true,
  salary_mode: 'RANGE', education_min: 'Grado', experience_years: 2, languages: [{ language: 'Inglés', level: 'B2' }],
  cover_letter_mode: 'OPTIONAL', allowed_countries: null,
};

const QUESTIONS: Row[] = [
  { id: Q_CHOICE, job_posting_id: JOB_ID, question_text: '¿Qué turno prefieres?', question_type: 'MULTIPLE_CHOICE', options: ['Mañana', 'Tarde', 'Noche'], is_required: true, order_index: 0, is_knockout: false },
  { id: Q_YESNO, job_posting_id: JOB_ID, question_text: '¿Tienes el título homologado?', question_type: 'YES_NO', options: null, is_required: true, order_index: 1, is_knockout: true },
];

const LEGAL_DOC = { id: '44444444-4444-4444-8444-444444444444', tipo: 'terminos_candidato', version: '1.0', idioma: 'es', titulo: 'Condiciones', casillas_obligatorias: ['acepto_condiciones_privacidad', 'datos_verdaderos'], vigente_desde: '2026-10-01T00:00:00Z' };

const RPC = {
  search_public_jobs_v2: LIST,
  get_job_posting_detail: [DETAIL],
  preview_application_profile: {
    profile: {
      profile: { full_name: 'Profesional 002', headline: 'Enfermera', location: 'Madrid' },
      contact: { email: 'pro2@example.test', phone: null },
      experiences: [], education: [{ degree: 'Grado' }], skills: [{ name: 'UCI' }], languages: [],
    },
    gaps: ['NO_EXPERIENCE'],
  },
  apply_to_job: { success: true, application_id: '55555555-5555-4555-8555-555555555555', match_score: 72, warnings: [] },
};

async function setupPublic(context: BrowserContext, opts: { session?: boolean; rpc?: Record<string, unknown>; db?: Record<string, Row[]> } = {}) {
  const candidate = { ...makeProfiles(4)[2], role: 'professional', country_code: 'ES' };
  await installInitState(context, { sessionProfile: opts.session ? candidate : null, language: 'es', theme: 'light' });
  await mockSupabase(context, { profiles: [candidate], job_posting_questions: QUESTIONS, documentos_legales: [LEGAL_DOC], my_job_applications: [], ...(opts.db || {}) }, { rpc: { ...RPC, ...(opts.rpc || {}) } });
}

// ---------------------------------------------------------------------------
// Sonda de foco
// ---------------------------------------------------------------------------

interface Stop {
  /** Identificador estable del elemento (atributo data-kbd que pone la sonda). */
  id: string;
  tag: string;
  name: string;
  tabIndex: number;
  /** El foco esta dentro de <main> o de un dialogo (el resto es la cabecera/pie del sitio, que no se toca aqui). */
  inScope: boolean;
  inDialog: boolean;
  /** true si el anillo de foco se ve (o el contorno/sombra cambia al perder el foco). null = aun sin medir. */
  ring: boolean | null;
}

/** Instala la sonda una vez por pagina (despues de cada navegacion completa hay que repetirlo). */
async function installProbe(page: Page) {
  await page.evaluate(() => {
    const w = window as any;
    if (w.__kbd) return;
    let seq = 0;
    const sig = (n: Element) => {
      const cs = getComputedStyle(n);
      const outlineVisible = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 && !/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)|transparent/.test(cs.outlineColor);
      return `${outlineVisible ? `${cs.outlineStyle}/${cs.outlineWidth}/${cs.outlineColor}` : 'no-outline'}|${cs.boxShadow}|${cs.borderTopColor}|${getComputedStyle(n, '::after').boxShadow}|${getComputedStyle(n, '::before').boxShadow}`;
    };
    // Elementos cuyo estilo puede mostrar el foco: el propio, su etiqueta, su tarjeta y el hermano siguiente
    // (radios y casillas ocultos pintan el anillo en la etiqueta o en un <span> hermano: peer-focus-visible).
    // Sombra «de anillo» (sin desplazamiento ni difuminado, con grosor y color no transparente): ring-2 de Tailwind.
    const hasRingShadow = (n: Element) => ['', '::after', '::before'].some((pseudo) => hasRing(getComputedStyle(n, pseudo || null).boxShadow));
    const hasRing = (bs: string) => {
      if (!bs || bs === 'none') return false;
      const re = /(rgba?\([^)]*\))\s+0px\s+0px\s+0px\s+(\d+(?:\.\d+)?)px/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(bs))) {
        const alpha = /rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([\d.]+)\s*\)/.exec(m[1]);
        if (parseFloat(m[2]) > 0 && (!alpha || parseFloat(alpha[1]) > 0)) return true;
      }
      return false;
    };
    const candidates = (el: HTMLElement): Element[] => {
      const out: Element[] = [el];
      const lab = (el as HTMLInputElement).labels?.[0] || el.closest('label');
      if (lab) { out.push(lab); out.push(...Array.from(lab.querySelectorAll('span')).slice(0, 4)); }
      if (el.nextElementSibling) out.push(el.nextElementSibling);
      if (el.parentElement) out.push(el.parentElement);
      // Un candidato que es a su vez enfocable (otro enlace, otro boton) cambia de estilo cuando RECIBE el foco: no vale
      return out.filter((n) => n === el || !n.matches('a[href],button,input,select,textarea,summary,[tabindex]'));
    };
    const name = (el: HTMLElement) =>
      (el.getAttribute('aria-label') || (el as HTMLInputElement).labels?.[0]?.textContent || el.textContent || el.getAttribute('placeholder') || el.getAttribute('href') || el.tagName)
        .replace(/\s+/g, ' ').trim().slice(0, 60);
    w.__kbd = {
      pending: null as null | { id: string; ringNow: boolean; cands: { n: Element; s: string }[] },
      /** Cierra la medida de la parada anterior (ya sin foco) y devuelve si tenia anillo. */
      settle() {
        const p = w.__kbd.pending;
        w.__kbd.pending = null;
        if (!p) return null;
        const ring = p.ringNow || p.cands.some((c) => sig(c.n) !== c.s);
        w.__kbd.detail = p.cands.map((c) => `${c.n.tagName.toLowerCase()}: ${c.s}  ->  ${sig(c.n)}`);
        return ring;
      },
      /** Describe el elemento enfocado y deja pendiente su medida. */
      snap() {
        const el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body || el === document.documentElement) return null;
        if (!el.dataset.kbd) el.dataset.kbd = String(++seq);
        const info = {
          id: el.dataset.kbd, tag: el.tagName.toLowerCase(), name: name(el), tabIndex: el.tabIndex,
          inScope: !!el.closest('main, [role="dialog"], [role="alertdialog"]'),
          inDialog: !!el.closest('[role="dialog"], [role="alertdialog"]'),
        };
        const cands = candidates(el);
        // anillo ya visible en el propio elemento o en un contenedor suyo (etiqueta con :has(:focus-visible))
        const ringNow = cands.some((n) => (n === el || n.contains(el)) && (hasRingShadow(n) || (n === el && !sig(n).startsWith('no-outline'))));
        w.__kbd.pending = { id: info.id, ringNow, cands: cands.map((n) => ({ n, s: sig(n) })) };
        return info;
      },
    };
  });
}

/** Pulsa una tecla y devuelve la parada de foco resultante (o null si el foco salio del documento). */
async function press(page: Page, key: string): Promise<{ stop: Stop | null; prevRing: boolean | null; detail?: string[] }> {
  await page.keyboard.press(key);
  return page.evaluate(() => {
    const k = (window as any).__kbd;
    const prevRing = k.settle();
    return { stop: k.snap(), prevRing, detail: k.detail as string[] };
  }) as Promise<{ stop: Stop | null; prevRing: boolean | null; detail?: string[] }>;
}

/** Marca la parada actual (tras enfocar a mano) para empezar a medir desde ahi. */
async function startAt(page: Page, loc: Locator): Promise<Stop> {
  await installProbe(page);
  await loc.focus();
  // un primer Tab+Shift+Tab pasa el modo de entrada a «teclado» (:focus-visible) sin cambiar de elemento
  const stop = await page.evaluate(() => { const k = (window as any).__kbd; k.settle(); return k.snap(); });
  expect(stop, 'el elemento inicial no se pudo enfocar').not.toBeNull();
  return stop as Stop;
}

interface Walk {
  stops: Stop[];
  /** Paradas dentro del alcance (main/dialogo) sin anillo visible. */
  noRing: Stop[];
}

/**
 * Pulsa Tab `n` veces desde la parada actual. Comprueba que ninguna parada se repite dos veces seguidas
 * (trampa) y devuelve las paradas con la medida del anillo ya cerrada.
 */
async function tabForward(page: Page, first: Stop, n: number): Promise<Walk> {
  const stops: Stop[] = [{ ...first, ring: null }];
  for (let i = 0; i < n; i++) {
    const { stop, prevRing, detail } = await press(page, 'Tab');
    stops[stops.length - 1].ring = prevRing;
    // KBD_DEBUG=1 imprime cada parada (y, si no tiene anillo, el estilo antes/despues de cada candidato)
    if (process.env.KBD_DEBUG) {
      const prev = stops[stops.length - 1];
      console.log(`[kbd] ${prev.tag} «${prev.name}» ring=${prevRing}${prevRing === false ? `\n   ${(detail || []).join('\n   ')}` : ''}`);
    }
    if (!stop) break; // el foco salio del documento (barra del navegador): no hay trampa
    const last = stops[stops.length - 1];
    expect(stop.id, `trampa de teclado: «${stop.name}» recibe el foco dos veces seguidas`).not.toBe(last.id);
    stops.push({ ...stop, ring: null });
  }
  // Cierra la ultima medida moviendo el foco una vez mas
  const { prevRing } = await press(page, 'Tab');
  stops[stops.length - 1].ring = prevRing;
  // Los destinos con tabindex=-1 (titulo o contenedor del dialogo) se enfocan por codigo, no con Tab: no necesitan anillo
  return { stops, noRing: stops.filter((s) => s.inScope && s.tabIndex >= 0 && s.ring === false) };
}

const names = (w: Walk) => w.stops.map((s) => s.name);
const showNoRing = (w: Walk) => w.noRing.map((s) => `${s.tag} «${s.name}»`).join('; ');

// ---------------------------------------------------------------------------
// Listado
// ---------------------------------------------------------------------------

test.describe('teclado: listado /empleos', () => {
  test('barra de busqueda, pills y filas: anillo visible, sin trampas y Shift+Tab simetrico', async ({ context, page }) => {
    await setupPublic(context);
    await page.goto('/empleos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(8, { timeout: 60_000 });

    const search = page.locator('#jf-q');
    const first = await startAt(page, search);
    const walk = await tabForward(page, first, 40);

    // Recorre, por este orden, el buscador, la ciudad, el boton Buscar, las pills y las filas
    const n = names(walk);
    expect(n.some((s) => /Buscar/.test(s)), 'boton Buscar').toBe(true);
    for (const pill of ['Categoría', 'Tipo de contrato', 'Jornada', 'Modalidad', 'Salario']) {
      expect(n.some((s) => s.startsWith(pill)), `pill ${pill}`).toBe(true);
    }
    expect(n.filter((s) => /Oferta de prueba/.test(s)).length, 'filas de oferta').toBeGreaterThanOrEqual(8);
    expect(walk.noRing, `sin anillo de foco: ${showNoRing(walk)}`).toEqual([]);

    // Shift+Tab desde la 4.ª parada vuelve a la 3.ª, y asi hasta la primera
    await startAt(page, page.locator(`[data-kbd="${walk.stops[4].id}"]`));
    for (let i = 3; i >= 1; i--) {
      const { stop } = await press(page, 'Shift+Tab');
      expect(stop?.id, `Shift+Tab debe volver a «${walk.stops[i].name}»`).toBe(walk.stops[i].id);
    }
  });

  test('una pill se abre con Intro, las flechas mueven la opcion, Intro la elige y Escape devuelve el foco a la pill', async ({ context, page }) => {
    await setupPublic(context);
    await page.goto('/empleos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(8, { timeout: 60_000 });

    const pill = page.getByRole('button', { name: 'Categoría' });
    await startAt(page, pill);
    await page.keyboard.press('Enter');
    const list = page.getByRole('listbox', { name: 'Categoría' });
    await expect(list).toBeVisible();
    await expect(pill).toHaveAttribute('aria-expanded', 'true');
    // el foco entra en la lista
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="listbox"]'))).toBe(true);

    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Escape');
    await expect(list).toHaveCount(0);
    await expect(pill).toBeFocused();

    // Intro sobre una opcion la elige y el filtro llega a la URL
    await page.keyboard.press('Enter');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/cat=/);
  });

  test('Intro sobre una fila abre la ficha en su URL canonica con pais', async ({ context, page }) => {
    await setupPublic(context);
    await page.goto('/empleos', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 3 })).toHaveCount(8, { timeout: 60_000 });
    await startAt(page, page.getByRole('link', { name: /Oferta de prueba 1$/ }).first());
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/es\/ofertas\/oferta-de-prueba-1-00000001/);
  });
});

// ---------------------------------------------------------------------------
// Ficha y modal de inscripcion
// ---------------------------------------------------------------------------

test.describe('teclado: ficha e inscripcion', () => {
  test('la ficha llega a Inscribirme y Guardar con anillo visible; Guardar responde a Intro', async ({ context, page }) => {
    await setupPublic(context, { session: true });
    await page.goto(CANON, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });

    const first = await startAt(page, page.getByRole('link', { name: /Volver|Back/ }).first());
    const walk = await tabForward(page, first, 30);
    const n = names(walk);
    expect(n.some((s) => /^Inscribirme/.test(s)), 'Inscribirme').toBe(true);
    expect(n.some((s) => /^Guardar oferta/.test(s)), 'Guardar').toBe(true);
    expect(walk.noRing, `sin anillo de foco: ${showNoRing(walk)}`).toEqual([]);

    const save = page.getByRole('button', { name: 'Guardar oferta' }).first();
    await startAt(page, save);
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: 'Oferta guardada' }).first()).toHaveAttribute('aria-pressed', 'true');
  });

  test('modal de inscripcion: foco atrapado, anillo en todo, Escape cierra y devuelve el foco a Inscribirme', async ({ context, page }) => {
    await setupPublic(context, { session: true });
    await page.goto(CANON, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });

    const opener = page.getByRole('button', { name: 'Inscribirme' }).first();
    const openerStop = await startAt(page, opener);
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Esto es lo que verá la empresa')).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);

    // Rellena con teclado lo imprescindible para que haya mas controles (radios, casillas)
    await installProbe(page);
    const first = (await page.evaluate(() => (window as any).__kbd.snap())) as Stop;
    const walk = await tabForward(page, first, 36);
    // Foco atrapado: TODA parada esta dentro del dialogo, ida...
    expect(walk.stops.every((s) => s.inDialog), `el foco salio del dialogo: ${walk.stops.filter((s) => !s.inDialog).map((s) => s.name).join('; ')}`).toBe(true);
    expect(walk.noRing, `sin anillo de foco: ${showNoRing(walk)}`).toEqual([]);
    expect(new Set(walk.stops.map((s) => s.id)).size, 'el ciclo recorre varios controles').toBeGreaterThanOrEqual(6);

    // ...y vuelta
    for (let i = 0; i < 12; i++) {
      const { stop } = await press(page, 'Shift+Tab');
      expect(stop?.inDialog, 'Shift+Tab no debe sacar el foco del dialogo').toBe(true);
    }

    // Escape cierra y el foco vuelve al boton que lo abrio
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => (document.activeElement as HTMLElement | null)?.dataset.kbd)).toBe(openerStop.id);
  });

  test('con el teclado se puede responder y enviar la inscripcion', async ({ context, page }) => {
    await setupPublic(context, { session: true });
    const calls: string[] = [];
    page.on('request', (r) => { const m = new URL(r.url()).pathname.match(/\/rpc\/(.+)$/); if (m && r.method() === 'POST') calls.push(m[1]); });
    await page.goto(CANON, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'Enfermera UCI', level: 1 })).toBeVisible({ timeout: 60_000 });
    await startAt(page, page.getByRole('button', { name: 'Inscribirme' }).first());
    await page.keyboard.press('Enter');
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Esto es lo que verá la empresa')).toBeVisible({ timeout: 60_000 });

    // Radios y casillas: se marcan con la barra espaciadora tras enfocarlos con Tab
    for (const label of ['Tarde', 'Sí']) {
      const radio = dialog.getByLabel(label, { exact: true });
      await radio.focus();
      await page.keyboard.press('Space');
      await expect(radio).toBeChecked();
    }
    for (const label of [/Acepto las condiciones para candidatos/, 'Confirmo que los datos de mi perfil son verdaderos.']) {
      const box = dialog.getByLabel(label);
      await box.focus();
      await page.keyboard.press('Space');
      await expect(box).toBeChecked();
    }
    const send = dialog.getByRole('button', { name: 'Enviar inscripción' });
    await send.focus();
    await page.keyboard.press('Enter');
    await expect(dialog.getByText('Inscripción enviada')).toBeVisible();
    await expect.poll(() => calls.includes('apply_to_job')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Asistente de ofertas (empresa)
// ---------------------------------------------------------------------------

const USER_ID = '00000000-0000-4000-8000-0000000000f1';
const COMPANY_ID = '00000000-0000-4000-8000-0000000000c1';
const WIZ_JOB_ID = '00000000-0000-4000-8000-0000000000a1';
const COMPANY_PROFILE = { id: USER_ID, email: 'rrhh@empresa-test.example', full_name: 'Persona RRHH', role: 'employer', plan: 'free', wizard_completed: true, first_login_completed: true };
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*', 'content-type': 'application/json' };
const reply = (route: Route, status: number, body: unknown) => route.fulfill({ status, headers: CORS, body: JSON.stringify(body) });

function wizardJob(): Row {
  return {
    id: WIZ_JOB_ID, company_id: COMPANY_ID, status: 'DRAFT', title: 'Dependiente/a de tienda', slug: null, department: null,
    employment_type: 'FULL_TIME', experience_level: 'JUNIOR', work_mode: 'ONSITE', location_city: 'Madrid', location_state: null, location_country: 'ES', is_remote: false,
    description: `<p>${'Buscamos una persona para atender a clientes en nuestra tienda. '.repeat(6)}</p>`,
    responsibilities: ['Atender al público'], requirements: [], nice_to_have: [], benefits: ['Seguro médico'], required_skills: ['Atención al cliente'], optional_skills: [],
    salary_min: 1200, salary_max: 1500, salary_currency: 'EUR', salary_period: 'MONTHLY', show_salary: true,
    application_deadline: new Date(Date.now() + 30 * 86400000).toISOString(), published_at: null, closed_at: null,
    country_code: 'ES', category: 'RETAIL', category2: null, vacancies: 1, contract_types: ['INDEFINITE'], schedule: 'FULL_TIME', duration: null,
    start_date: null, start_immediate: true, salary_mode: 'RANGE', education_min: null, experience_years: 1, languages: [], cover_letter_mode: 'NONE', allowed_countries: null,
    notify_emails: [], notify_frequency: 'DAILY', review_reason: null, views_count: 0, applications_count: 0,
    created_at: '2026-10-01T10:00:00Z', updated_at: '2026-10-01T10:00:00Z',
  };
}

async function setupWizard(page: Page) {
  await installInitState(page.context(), { sessionProfile: COMPANY_PROFILE, language: 'es', theme: 'light' });
  await page.route('**/*', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue();
    if (!url.hostname.endsWith('.supabase.co')) return route.abort();
    if (req.method() === 'OPTIONS') return reply(route, 200, 'ok');
    const path = url.pathname;
    if (path.startsWith('/auth/v1/user')) return reply(route, 200, buildFakeSession(COMPANY_PROFILE).user);
    if (path.startsWith('/auth/v1/')) return reply(route, 200, {});
    if (path.startsWith('/rest/v1/rpc/')) {
      const fn = path.replace('/rest/v1/rpc/', '');
      return reply(route, 200, fn === 'documentos_pendientes' ? [] : fn === 'get_job_questions_for_company' ? [] : null);
    }
    if (path === '/rest/v1/company_users') return reply(route, 200, [{ id: 'cu-1', company_id: COMPANY_ID, user_id: USER_ID, role: 'OWNER' }]);
    if (path === '/rest/v1/companies_full') {
      return reply(route, 200, [{ id: COMPANY_ID, company_name: 'Empresa Prueba', legal_name: 'Empresa Prueba, S.L.', tax_id: 'B67799247', company_email: 'rrhh@empresa-test.example', status: 'APPROVED', credit_balance: 0, total_credits_purchased: 0, total_credits_used: 0, country_code: 'ES', created_at: '2026-10-01T00:00:00Z', updated_at: '2026-10-01T00:00:00Z' }]);
    }
    if (path === '/rest/v1/companies') return reply(route, 200, [{ id: COMPANY_ID, company_name: 'Empresa Prueba', logo_url: null }]);
    if (path === '/rest/v1/profiles_full') return reply(route, 200, [COMPANY_PROFILE]);
    if (path === '/rest/v1/countries') return reply(route, 200, [{ code: 'ES', name_es: 'España', name_en: 'Spain', currency: 'EUR', active: true }]);
    if (path === '/rest/v1/job_postings') {
      if (req.method() === 'GET') {
        const idEq = url.searchParams.get('id');
        if (idEq?.startsWith('eq.')) return reply(route, 200, idEq.slice(3) === WIZ_JOB_ID ? [wizardJob()] : []);
        return reply(route, 200, [wizardJob()]);
      }
      return reply(route, 200, [{ id: WIZ_JOB_ID, status: 'DRAFT' }]);
    }
    if (path.startsWith('/rest/v1/')) return reply(route, req.method() === 'POST' ? 201 : 200, req.method() === 'POST' ? null : []);
    return reply(route, 200, {});
  });
}

test.describe('teclado: asistente de ofertas', () => {
  test('la barra de pasos se recorre con Tab, cada paso tiene anillo y Intro cambia de paso', async ({ page }) => {
    await setupWizard(page);
    await page.goto(`/company/jobs/edit/${WIZ_JOB_ID}?paso=5`);
    const bar = page.getByRole('navigation', { name: /Paso 5 de 5/ });
    await expect(bar).toBeVisible({ timeout: 90_000 });

    const steps = bar.getByRole('button');
    await expect(steps).toHaveCount(5);
    const first = await startAt(page, steps.first());
    const walk = await tabForward(page, first, 4);
    expect(names(walk).slice(0, 5).every((s) => /^Paso \d de 5/.test(s)), `orden de la barra: ${names(walk).slice(0, 5).join(' | ')}`).toBe(true);
    expect(walk.noRing, `sin anillo de foco: ${showNoRing(walk)}`).toEqual([]);

    // Shift+Tab vuelve al paso anterior
    await startAt(page, steps.nth(3));
    const back = await press(page, 'Shift+Tab');
    expect(back.stop?.name).toMatch(/^Paso 3 de 5/);

    // Intro sobre el paso 2 lo abre
    await steps.nth(1).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Condiciones y compensación', level: 2 })).toBeVisible();
    // la barra cambia su nombre accesible al de su nuevo paso («Paso 2 de 5»)
    await expect(page.getByRole('navigation', { name: /Paso 2 de 5/ }).getByRole('button').nth(1)).toHaveAttribute('aria-current', 'step');
  });

  test('los campos y botones de un paso tambien muestran anillo y no atrapan el foco', async ({ page }) => {
    await setupWizard(page);
    await page.goto(`/company/jobs/edit/${WIZ_JOB_ID}?paso=1`);
    const bar = page.getByRole('navigation', { name: /Paso 1 de 5/ });
    await expect(bar).toBeVisible({ timeout: 90_000 });
    const first = await startAt(page, bar.getByRole('button').first());
    const walk = await tabForward(page, first, 30);
    expect(walk.stops.length).toBeGreaterThan(10);
    expect(walk.noRing, `sin anillo de foco: ${showNoRing(walk)}`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Puerta de aceptacion de condiciones
// ---------------------------------------------------------------------------

test.describe('teclado: puerta de condiciones (LegalGate)', () => {
  const pending = [{
    documento_id: LEGAL_DOC.id, tipo: 'terminos_candidato', version: '1.1', idioma: 'es',
    titulo: 'Condiciones de registro y uso – Candidatos', texto: '1. Titular. Nueva versión.',
    audiencia: 'candidato', casillas_obligatorias: ['acepto_condiciones_privacidad', 'datos_verdaderos'],
    borrador: false, vigente_desde: '2026-10-29T00:00:00+00:00',
  }];

  test('Tab recorre texto, casillas y botones con anillo; se acepta solo con teclado', async ({ context, page }) => {
    await setupPublic(context, { session: true, rpc: { documentos_pendientes: pending, registrar_aceptacion: ['00000000-0000-4000-8000-0000000000e1'] } });
    await page.goto('/dashboard');
    const dialog = page.getByRole('dialog', { name: 'Acepta las condiciones para continuar' });
    await expect(dialog).toBeVisible({ timeout: 60_000 });

    // El foco empieza en el titulo del dialogo (tabIndex -1): el primer Tab llega al primer control
    await expect.poll(() => page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    await installProbe(page);
    const first = (await page.evaluate(() => (window as any).__kbd.snap())) as Stop;
    const walk = await tabForward(page, first, 12);
    const n = names(walk);
    expect(n.some((s) => /Descargar|Download/.test(s)), 'descargar').toBe(true);
    // «Aceptar y continuar» esta desactivado hasta marcar las casillas: Tab lo salta (no es una trampa)
    expect(n.some((s) => /Aceptar y continuar/.test(s)), 'el boton desactivado no recibe el foco').toBe(false);
    expect(walk.noRing, `sin anillo de foco: ${showNoRing(walk)}`).toEqual([]);

    // Aceptar con teclado
    for (const id of ['#gate-acepto_condiciones_privacidad', '#gate-datos_verdaderos']) {
      await page.locator(id).focus();
      await page.keyboard.press('Space');
      await expect(page.locator(id)).toBeChecked();
    }
    const accept = dialog.getByRole('button', { name: 'Aceptar y continuar' });
    await expect(accept).toBeEnabled();
    // Desde la ultima casilla, Tab llega al boton (Cerrar sesion va antes en pantallas anchas, o despues en moviles)
    await page.locator('#gate-datos_verdaderos').focus();
    await installProbe(page);
    let reached = false;
    for (let i = 0; i < 6 && !reached; i++) {
      const { stop } = await press(page, 'Tab');
      reached = /Aceptar y continuar/.test(stop?.name || '');
    }
    expect(reached, 'Tab alcanza el boton Aceptar y continuar').toBe(true);
    await page.keyboard.press('Enter');
    await expect(dialog).toHaveCount(0);
  });

  test('el desplegable de opcionales se abre con Intro y sus casillas tienen anillo', async ({ context, page }) => {
    await setupPublic(context, { session: true, rpc: { documentos_pendientes: pending, registrar_aceptacion: ['x'] } });
    await page.goto('/dashboard');
    const dialog = page.getByRole('dialog', { name: 'Acepta las condiciones para continuar' });
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    const summary = dialog.locator('summary');
    const first = await startAt(page, summary);
    await page.keyboard.press('Enter');
    await expect(dialog.getByTestId('gate-optional')).toHaveAttribute('open', '');
    const walk = await tabForward(page, first, 5);
    expect(walk.stops.some((s) => s.tag === 'input'), 'las casillas opcionales son alcanzables').toBe(true);
    expect(walk.noRing, `sin anillo de foco: ${showNoRing(walk)}`).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Autocomprobacion de la sonda (que el test no pase «en vacio»)
// ---------------------------------------------------------------------------

test.describe('teclado: la sonda distingue anillo y no-anillo', () => {
  test('detecta un enlace sin anillo, uno con el anillo nativo y uno con ring de Tailwind', async ({ page }) => {
    await page.setContent(`
      <main>
        <a id="a" href="#a" style="outline:none">sin anillo</a>
        <a id="b" href="#b">anillo nativo</a>
        <a id="c" href="#c" style="outline:none" onfocus="this.style.boxShadow='0 0 0 2px rgb(37, 99, 235)'" onblur="this.style.boxShadow='none'">anillo de sombra</a>
        <button id="d" style="outline:none">fin</button>
      </main>`);
    await page.locator('#a').focus();
    await installProbe(page);
    await page.evaluate(() => { const k = (window as any).__kbd; k.settle(); k.snap(); });
    const rings: Array<boolean | null> = [];
    for (let i = 0; i < 3; i++) rings.push((await press(page, 'Tab')).prevRing);
    expect(rings).toEqual([false, true, true]);
  });
});
