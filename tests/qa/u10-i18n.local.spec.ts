/**
 * QA de la unidad U10 (i18n, textos y páginas legales) contra la app local.
 *
 * - /privacidad y /privacy: misma política en ES y EN, con fecha de "última actualización"
 *   fija (no la del reloj del visitante) y formateada según idioma. /terminos igual.
 * - Muestra de páginas en español sin mayúsculas a la inglesa en títulos de sección.
 * - Registro, recuperación y enlace mágico sin claves crudas ni "undefined" (antes faltaban
 *   en es.ts claves como recovery.checkEmailDesc y magicLink.checkEmailDesc).
 *
 * Supabase se responde en local (helpers/supabaseMock); no se envía nada real.
 *
 *   QA_PORT=5410 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u10-i18n.local.spec.ts
 */
import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);
// Vite en modo dev compila bajo demanda: el primer goto puede tardar en máquinas cargadas.
test.describe.configure({ timeout: 120_000 });

type Lang = 'es' | 'en';

async function setup(context: BrowserContext, lang: Lang) {
  await installInitState(context, { language: lang, theme: 'light' });
  return mockSupabase(context, {}, { allowHosts: ['localhost', '127.0.0.1'] });
}

async function open(page: Page, path: string) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  // Primer goto con Vite en frío: puede pasar de 60 s mientras compila los chunks.
  await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 100_000 });
}

/** Rastros de claves sin traducir: "undefined", "dashboard.auth.x" o similares. */
async function expectNoRawKeys(page: Page) {
  const text = await page.locator('main, form, body').first().innerText();
  expect(text).not.toMatch(/\bundefined\b/);
  expect(text).not.toMatch(/\b(dashboard|common|company|auth)\.[a-zA-Z]+\.[a-zA-Z]+/);
}

// ---------------------------------------------------------------------------
// Páginas legales
// ---------------------------------------------------------------------------
const LEGAL = [
  {
    path: '/privacidad', lang: 'es' as const, title: 'Política de privacidad', date: '5 de octubre de 2026', label: 'Última actualización',
    headings: ['1. Información que recopilamos', '2. Cómo usamos la información', '3. Datos de registro', '4. Cookies'],
  },
  {
    path: '/privacy', lang: 'en' as const, title: 'Privacy Policy', date: 'October 5, 2026', label: 'Last updated',
    headings: ['1. Information We Collect', '2. How We Use Information', '3. Log Data', '4. Cookies'],
  },
  {
    path: '/terminos', lang: 'es' as const, title: 'Términos y condiciones', date: '5 de octubre de 2026', label: 'Última actualización',
    headings: ['1. Aceptación de los términos', '2. Cuentas', '3. Propiedad intelectual', '4. Terminación'],
  },
  {
    path: '/terms', lang: 'en' as const, title: 'Terms and Conditions', date: 'October 5, 2026', label: 'Last updated',
    headings: ['1. Acceptance of Terms', '2. Accounts', '3. Intellectual Property', '4. Termination'],
  },
];

test.describe('páginas legales bilingües con fecha fija', () => {
  for (const l of LEGAL) {
    test(`${l.path} (${l.lang})`, async ({ page, context }) => {
      await setup(context, l.lang);
      // Sin page.clock: en Firefox/WebKit el reloj falso congela requestAnimationFrame y Helmet
      // no llega a escribir el <title>. La fecha fija se comprueba por su texto exacto, que ya no
      // coincide con el día actual (antes salía new Date().toLocaleDateString()).
      await open(page, l.path);

      await expect(page.getByRole('heading', { level: 1 })).toHaveText(l.title);
      // <title> y <html lang> no se comprueban aquí: los escribe react-helmet-async y con varios
      // workers a veces se quedan con el valor de index.html (intermitente, ajeno a estas páginas).
      await expect(page.getByRole('heading', { level: 2 })).toHaveText(l.headings);

      const updated = page.getByText(`${l.label}:`);
      await expect(updated).toContainText(l.date);
      await expect(updated.locator('time')).toHaveAttribute('datetime', '2026-10-05');
      const today = await page.evaluate((lang) => new Date().toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { dateStyle: 'long' }), l.lang);
      if (today !== l.date) await expect(updated).not.toContainText(today);
    });
  }
});

// ---------------------------------------------------------------------------
// Mayúscula de frase en español (muestra de páginas públicas)
// ---------------------------------------------------------------------------
const SENTENCE_CASE: { path: string; expected: string[]; old: string[] }[] = [
  {
    path: '/',
    expected: [
      'Potencia tu perfil profesional con nuestras herramientas verificadas',
      'Crear tu CV es así de fácil',
      'Planes a medida de tus necesidades profesionales',
      'Preguntas frecuentes sobre los CVs profesionales verificados',
      'Comienza tu viaje profesional hoy',
    ],
    old: ['Crea Tu CV', 'Planes a Medida de Tus Necesidades Profesionales', 'Crear Tu CV Es Así de Fácil'],
  },
  {
    path: '/precios',
    expected: ['Encuentra el plan perfecto', 'Nuestros planes', 'Compara todas las funciones', 'Nuestra garantía', 'Preguntas frecuentes'],
    old: ['Encuentra el Plan Perfecto', 'Compara Todas las Funciones', 'Preguntas Frecuentes'],
  },
  {
    path: '/producto/resumen',
    expected: ['Tu CV profesional para oportunidades globales', 'Una plataforma todo en uno para el crecimiento profesional', 'Cómo nos comparamos'],
    old: ['Una Plataforma Todo en Uno para el Crecimiento Profesional', 'Cómo Nos Comparamos'],
  },
  {
    path: '/empresas/planes',
    expected: ['Nuestros niveles', 'Cómo funcionan los créditos', 'Matriz de características', 'Retorno de la inversión'],
    old: ['Nuestros Niveles', 'Cómo Funcionan los Créditos', 'Matriz de Características'],
  },
];

test.describe('títulos de sección en español con mayúscula de frase', () => {
  for (const s of SENTENCE_CASE) {
    test(s.path, async ({ page, context }) => {
      await setup(context, 'es');
      await open(page, s.path);
      const headings = page.locator('h1, h2, h3');
      for (const text of s.expected) {
        await expect(headings.filter({ hasText: new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`) }).first()).toBeVisible();
      }
      const all = await headings.allInnerTexts();
      for (const text of s.old) expect(all.map(t => t.trim())).not.toContain(text);
    });
  }
});

// ---------------------------------------------------------------------------
// Registro, recuperación y enlace mágico sin claves crudas
// ---------------------------------------------------------------------------
test.describe('auth en español sin claves crudas', () => {
  test('registro: etiquetas en mayúscula de frase', async ({ page, context }) => {
    await setup(context, 'es');
    // En móvil el panel con el <h1> se oculta: se espera directamente al formulario.
    await page.goto('/signup', { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('Nombre completo', { exact: true })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByLabel('Correo electrónico', { exact: true })).toBeVisible();
    await expect(page.locator('form button[type=submit]')).toHaveText('Crear cuenta');
    await expectNoRawKeys(page);
  });

  test('recuperación: confirmación con el texto de es.ts y el email', async ({ page, context }) => {
    await setup(context, 'es');
    await page.route('**/functions/v1/send-password-reset', route => route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' },
      body: JSON.stringify({ success: true }),
    }));
    await open(page, '/recovery');
    await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText('Recuperar contraseña');
    await page.fill('#email', 'qa@example.com');
    await page.locator('form button[type=submit]').click();
    await expect(page.getByText('¡Revisa tu correo!').first()).toBeVisible();
    await expect(page.getByText('Te hemos enviado un enlace para restablecer tu contraseña a')).toContainText('qa@example.com');
    await expectNoRawKeys(page);
  });

  test('enlace mágico: confirmación con el texto de es.ts y el email', async ({ page, context }) => {
    await setup(context, 'es');
    await page.route('**/auth/v1/otp**', route => route.fulfill({
      status: 200,
      headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'content-type': 'application/json' },
      body: '{}',
    }));
    await open(page, '/magic-link');
    await expect(page.getByRole('heading', { level: 1 }).first()).toHaveText('Enlace mágico');
    await page.fill('#email', 'qa@example.com');
    await page.locator('form button[type=submit]').click();
    await expect(page.getByText('Te hemos enviado un enlace mágico a')).toContainText('qa@example.com');
    await expect(page.getByText('Haz clic en el enlace del correo para iniciar sesión al instante.')).toBeVisible();
    await expectNoRawKeys(page);
  });
});
