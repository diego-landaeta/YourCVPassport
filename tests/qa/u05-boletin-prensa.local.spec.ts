/**
 * U5: boletin del blog y contacto de prensa contra la Edge Function newsletter-contact.
 *
 * App local con Supabase mockeado (helpers/supabaseMock) y la funcion respondida con
 * page.route: no sale nada a Brevo ni a produccion. Se comprueba en ES/EN:
 *   - exito (mensaje en role=status, formulario limpio), estado "Enviando" con el
 *     boton deshabilitado y el cuerpo que se envia (accion, idioma, honeypot vacio);
 *   - error con reintento (role=alert);
 *   - NOT_CONFIGURED y fallo de red: mailto de respaldo;
 *   - nunca alert() ni navegacion fuera de la pagina.
 *
 *   QA_PORT=5405 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/u05-boletin-prensa.local.spec.ts
 */
import { test, expect as baseExpect, type Page, type BrowserContext, type Route } from '@playwright/test';
import { SAFE_CONTEXT_OPTIONS, installInitState, mockSupabase } from './helpers/supabaseMock';

test.use(SAFE_CONTEXT_OPTIONS);
// Con los 4 navegadores en paralelo WebKit tarda a veces mas de 10 s en pintar el
// resultado del envio: margen extra solo en este spec.
const expect = baseExpect.configure({ timeout: 20_000 });

type Lang = 'es' | 'en';
const FN = '**/functions/v1/newsletter-contact';

const BLOG = { es: '/recursos/blog', en: '/resources/blog' } as const;
const PRESS = { es: '/nosotros/prensa', en: '/about/press' } as const;

const T = {
  es: {
    emailBox: 'Tu dirección de correo', subscribe: 'Suscribirse', sending: 'Enviando…',
    subOk: 'Revisa tu correo para confirmar la suscripción.', confirmed: 'Suscripción confirmada',
    subFail: 'No hemos podido completar la suscripción.', subNotConf: 'La suscripción automática no está disponible ahora mismo.',
    network: 'No hay conexión con el servidor.', invalid: 'El correo no es válido', rate: 'Demasiados intentos',
    retry: 'Reintentar',
    name: 'Nombre Completo', outlet: 'Medio de Comunicación', email: 'Correo Electrónico', message: 'Mensaje',
    send: 'Enviar Consulta', pressOk: 'Mensaje enviado. Hemos recibido tu consulta.', pressFail: 'No hemos podido enviar tu mensaje.',
    pressNotConf: 'El envío automático no está disponible ahora mismo.', mailSubject: 'Consulta%20de%20prensa',
  },
  en: {
    emailBox: 'Your email address', subscribe: 'Subscribe', sending: 'Sending…',
    subOk: 'Check your email to confirm your subscription.', confirmed: 'Subscription confirmed',
    subFail: 'We could not complete your subscription.', subNotConf: 'Automatic sign-up is not available right now.',
    network: 'Could not reach the server.', invalid: 'The email address is not valid', rate: 'Too many attempts',
    retry: 'Try again',
    name: 'Full Name', outlet: 'Media Outlet', email: 'Email', message: 'Message',
    send: 'Send Inquiry', pressOk: 'Message sent. We have received your inquiry.', pressFail: 'We could not send your message.',
    pressNotConf: 'Automatic sending is not available right now.', mailSubject: 'Press%20inquiry',
  },
} as const;

type Reply = { status: number; body?: unknown } | 'abort';

interface FnMock {
  calls: Record<string, unknown>[];
  /** Respuestas en orden; la ultima se repite. */
  replies: Reply[];
  /** Si se define, la respuesta espera a que se resuelva (estado "Enviando"). */
  gate: Promise<void> | null;
}

async function setup(context: BrowserContext, page: Page, lang: Lang, replies: Reply[]): Promise<FnMock> {
  await installInitState(context, { language: lang, theme: 'light' });
  await mockSupabase(context, { blog_posts: [] });
  const mock: FnMock = { calls: [], replies, gate: null };
  // page.route tiene prioridad sobre el router del contexto.
  await page.route(FN, async (route: Route) => {
    const req = route.request();
    const cors = { 'access-control-allow-origin': '*' };
    if (req.method() === 'OPTIONS') {
      return route.fulfill({ status: 204, headers: { ...cors, 'access-control-allow-headers': req.headers()['access-control-request-headers'] || 'authorization,apikey,content-type,x-client-info', 'access-control-allow-methods': 'POST, OPTIONS' } });
    }
    mock.calls.push(JSON.parse(req.postData() || 'null'));
    const reply = mock.replies[Math.min(mock.calls.length - 1, mock.replies.length - 1)];
    if (mock.gate) await mock.gate;
    if (reply === 'abort') return route.abort('connectionfailed');
    return route.fulfill({ status: reply.status, contentType: 'application/json', headers: cors, body: JSON.stringify(reply.body ?? {}) });
  });
  const dialogs: string[] = [];
  page.on('dialog', d => { dialogs.push(d.message()); d.dismiss().catch(() => {}); });
  (mock as any).dialogs = dialogs;
  return mock;
}

const OK = { status: 200, body: { success: true } };
const err = (status: number, code: string): Reply => ({ status, body: { error: 'x', code } });

async function openBlog(page: Page, lang: Lang, search = '') {
  await page.goto(BLOG[lang] + search, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('newsletter-form')).toBeAttached({ timeout: 45_000 });
  const box = page.getByRole('textbox', { name: T[lang].emailBox });
  await box.evaluate(el => el.scrollIntoView({ block: 'center' }));
  return box;
}

async function openPress(page: Page, lang: Lang) {
  await page.goto(PRESS[lang], { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('press-form')).toBeAttached({ timeout: 45_000 });
  await page.getByTestId('press-form').evaluate(el => el.scrollIntoView({ block: 'center' }));
}

async function fillPress(page: Page, lang: Lang) {
  const t = T[lang];
  await page.getByLabel(t.name, { exact: true }).fill('QA Test');
  await page.getByLabel(t.outlet, { exact: true }).fill('QA Medio');
  await page.getByLabel(t.email, { exact: true }).fill('qa@example.com');
  await page.getByLabel(t.message, { exact: true }).fill('Prueba local, no se envia nada.');
}

for (const lang of ['es', 'en'] as const) {
  const t = T[lang];

  test.describe(`boletin (${lang})`, () => {
    test('exito: estado enviando, cuerpo correcto y mensaje de confirmacion', async ({ page, context }) => {
      const mock = await setup(context, page, lang, [OK]);
      let open!: () => void;
      mock.gate = new Promise(r => { open = r; });
      const box = await openBlog(page, lang);
      // Sin espacios alrededor: Firefox no envia un type=email asi (validacion nativa).
      // El recorte del email se prueba en el harness de la Edge Function.
      await box.fill('qa@example.com');
      await page.getByRole('button', { name: t.subscribe }).click();

      const sending = page.getByRole('button', { name: t.sending });
      await expect(sending).toBeDisabled();
      await expect(page.getByTestId('newsletter-form')).toHaveAttribute('aria-busy', 'true');
      open();

      await expect(page.getByRole('status').filter({ hasText: t.subOk })).toBeVisible();
      await expect(page.getByRole('button', { name: t.subscribe })).toBeEnabled();
      await expect(box).toHaveValue('');
      await expect(page.getByRole('alert')).toHaveCount(0);
      expect(mock.calls).toEqual([{ action: 'subscribe', email: 'qa@example.com', lang, website: '' }]);
      expect((mock as any).dialogs).toEqual([]);
      expect(new URL(page.url()).pathname).toBe(BLOG[lang]);
    });

    test('SEND_FAILED: error con mailto de respaldo y reintento que acaba en exito', async ({ page, context }) => {
      const mock = await setup(context, page, lang, [err(502, 'SEND_FAILED'), OK]);
      const box = await openBlog(page, lang);
      await box.fill('qa@example.com');
      await page.getByRole('button', { name: t.subscribe }).click();

      const alert = page.getByRole('alert').filter({ hasText: t.subFail });
      await expect(alert).toBeVisible();
      await expect(alert.getByRole('link', { name: 'support@yourcvpassport.com' }))
        .toHaveAttribute('href', /^mailto:support@yourcvpassport\.com\?subject=.+qa%40example\.com/);
      await expect(box).toHaveAttribute('aria-describedby', 'newsletter-error');
      await expect(box).toHaveValue('qa@example.com');

      await alert.getByRole('button', { name: t.retry }).click();
      await expect(page.getByRole('status').filter({ hasText: t.subOk })).toBeVisible();
      await expect(page.getByRole('alert')).toHaveCount(0);
      expect(mock.calls).toHaveLength(2);
      expect((mock as any).dialogs).toEqual([]);
    });

    test('NOT_CONFIGURED: mailto de respaldo y sin reintento', async ({ page, context }) => {
      await setup(context, page, lang, [err(503, 'NOT_CONFIGURED')]);
      const box = await openBlog(page, lang);
      await box.fill('qa@example.com');
      await page.getByRole('button', { name: t.subscribe }).click();
      const alert = page.getByRole('alert').filter({ hasText: t.subNotConf });
      await expect(alert).toBeVisible();
      await expect(alert.getByRole('link', { name: 'support@yourcvpassport.com' })).toHaveAttribute('href', /^mailto:/);
      await expect(alert.getByRole('button', { name: t.retry })).toHaveCount(0);
    });

    test('fallo de red: mailto de respaldo y reintento', async ({ page, context }) => {
      await setup(context, page, lang, ['abort']);
      const box = await openBlog(page, lang);
      await box.fill('qa@example.com');
      await page.getByRole('button', { name: t.subscribe }).click();
      const alert = page.getByRole('alert').filter({ hasText: t.network });
      await expect(alert).toBeVisible();
      await expect(alert.getByRole('link', { name: 'support@yourcvpassport.com' })).toHaveAttribute('href', /^mailto:/);
      await expect(alert.getByRole('button', { name: t.retry })).toBeVisible();
    });

    test('INVALID_INPUT y RATE_LIMITED: mensaje concreto sin mailto', async ({ page, context }) => {
      await setup(context, page, lang, [err(400, 'INVALID_INPUT'), err(429, 'RATE_LIMITED')]);
      const box = await openBlog(page, lang);
      await box.fill('qa@example.com');
      await page.getByRole('button', { name: t.subscribe }).click();
      const invalid = page.getByRole('alert').filter({ hasText: t.invalid });
      await expect(invalid).toBeVisible();
      await expect(box).toHaveAttribute('aria-invalid', 'true');
      await expect(invalid.getByRole('link')).toHaveCount(0);
      await expect(invalid.getByRole('button', { name: t.retry })).toHaveCount(0);

      await page.getByRole('button', { name: t.subscribe }).click();
      const rate = page.getByRole('alert').filter({ hasText: t.rate });
      await expect(rate).toBeVisible();
      await expect(rate.getByRole('link')).toHaveCount(0);
      await expect(rate.getByRole('button', { name: t.retry })).toBeVisible();
    });

    test('vuelta desde el enlace de confirmacion (?suscrito=1)', async ({ page, context }) => {
      await setup(context, page, lang, [OK]);
      await openBlog(page, lang, '?suscrito=1');
      await expect(page.getByRole('status').filter({ hasText: t.confirmed })).toBeVisible();
    });
  });

  test.describe(`prensa (${lang})`, () => {
    test('exito: estado enviando, cuerpo correcto, mensaje y formulario limpio', async ({ page, context }) => {
      const mock = await setup(context, page, lang, [OK]);
      let open!: () => void;
      mock.gate = new Promise(r => { open = r; });
      await openPress(page, lang);
      await fillPress(page, lang);
      await page.getByRole('button', { name: t.send }).click();

      await expect(page.getByRole('button', { name: t.sending })).toBeDisabled();
      open();

      await expect(page.getByRole('status').filter({ hasText: t.pressOk })).toBeVisible();
      await expect(page.getByLabel(t.message, { exact: true })).toHaveValue('');
      await expect(page.getByRole('alert')).toHaveCount(0);
      expect(mock.calls).toEqual([{
        action: 'press', name: 'QA Test', email: 'qa@example.com', outlet: 'QA Medio',
        message: 'Prueba local, no se envia nada.', lang, website: '',
      }]);
      expect((mock as any).dialogs).toEqual([]);
      expect(new URL(page.url()).pathname).toBe(PRESS[lang]);
    });

    test('SEND_FAILED: error con mailto a press@ y reintento que acaba en exito', async ({ page, context }) => {
      const mock = await setup(context, page, lang, [err(502, 'SEND_FAILED'), OK]);
      await openPress(page, lang);
      await fillPress(page, lang);
      await page.getByRole('button', { name: t.send }).click();

      const alert = page.getByRole('alert').filter({ hasText: t.pressFail });
      await expect(alert).toBeVisible();
      await expect(alert.getByRole('link', { name: 'press@yourcvpassport.com' }))
        .toHaveAttribute('href', new RegExp(`^mailto:press@yourcvpassport\\.com\\?subject=${t.mailSubject}%20-%20QA%20Medio&body=.+Prueba%20local`));
      await alert.getByRole('button', { name: t.retry }).click();
      await expect(page.getByRole('status').filter({ hasText: t.pressOk })).toBeVisible();
      expect(mock.calls).toHaveLength(2);
      expect((mock as any).dialogs).toEqual([]);
    });

    test('NOT_CONFIGURED y fallo de red: mailto de respaldo', async ({ page, context }) => {
      await setup(context, page, lang, [err(503, 'NOT_CONFIGURED'), 'abort']);
      await openPress(page, lang);
      await fillPress(page, lang);
      await page.getByRole('button', { name: t.send }).click();
      const notConf = page.getByRole('alert').filter({ hasText: t.pressNotConf });
      await expect(notConf).toBeVisible();
      await expect(notConf.getByRole('link', { name: 'press@yourcvpassport.com' })).toHaveAttribute('href', /^mailto:press@/);
      await expect(notConf.getByRole('button', { name: t.retry })).toHaveCount(0);

      await page.getByRole('button', { name: t.send }).click();
      const network = page.getByRole('alert').filter({ hasText: t.network });
      await expect(network).toBeVisible();
      await expect(network.getByRole('link', { name: 'press@yourcvpassport.com' })).toHaveAttribute('href', /^mailto:press@/);
      // Los datos siguen en el formulario para reintentar
      await expect(page.getByLabel(t.message, { exact: true })).toHaveValue('Prueba local, no se envia nada.');
    });
  });
}

test('el honeypot no es accesible ni enfocable', async ({ page, context }) => {
  await setup(context, page, 'es', [OK]);
  await openPress(page, 'es');
  await expect(page.getByRole('textbox', { name: 'Website' })).toHaveCount(0);
  await expect(page.locator('#press-website')).toHaveAttribute('tabindex', '-1');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
