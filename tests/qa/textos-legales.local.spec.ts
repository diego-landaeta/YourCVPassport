/**
 * Textos legales v2.0 de la bolsa de empleo (issue #10), con Supabase MOCKEADO:
 *
 *  1. Aviso legal (/aviso-legal y /legal-notice): datos del titular, aviso de borrador, enlaces a
 *     privacidad, condiciones y cookies, enlace en el pie y sin desbordamiento a 390 px.
 *  2. Política de cookies con el aviso de borrador.
 *  3. Los borradores de lib/legalDrafts.ts se leen bien con LegalTextBody (títulos en negrita,
 *     apartados sangrados y UN solo #anexo en las condiciones de empleador).
 *  4. Admin: «Cargar el borrador preparado» rellena versión, título y texto, avisa de que es un
 *     borrador y NO deja publicarlo (ni llama a legal_publicar_version).
 *
 * Capturas opcionales: QA_SHOTS=<carpeta> guarda cada página a 1440 y 390 px en claro y oscuro.
 *
 *   QA_PORT=5446 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/textos-legales.local.spec.ts --project=chromium
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import path from 'node:path';
import { ADMIN_ID, installInitState, makeProfiles, mockSupabase, SAFE_CONTEXT_OPTIONS, type Row } from './helpers/supabaseMock';
import { LEGAL_DRAFTS, LEGAL_DRAFT_VERSION } from '../../lib/legalDrafts';

test.use(SAFE_CONTEXT_OPTIONS);
test.describe.configure({ timeout: 120_000 });

const SHOTS = process.env.QA_SHOTS || '';

async function boot(context: BrowserContext, o: { admin?: boolean; lang?: 'es' | 'en'; theme?: 'light' | 'dark'; db?: Record<string, Row[]> } = {}) {
  const profiles = makeProfiles(4);
  const admin = profiles.find((p) => p.id === ADMIN_ID)!;
  await installInitState(context, { sessionProfile: o.admin ? admin : null, language: o.lang ?? 'es', theme: o.theme ?? 'light' });
  return mockSupabase(context, { profiles, ...(o.db || {}) }, { rpc: { legal_aviso_proximo: [] } });
}

/** Sin scroll horizontal del documento. */
async function noHorizontalOverflow(page: Page) {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over).toBeLessThanOrEqual(1);
}

/** Capturas a 1440 y 390 en el tema ya cargado (solo con QA_SHOTS). */
async function shots(page: Page, name: string) {
  if (!SHOTS) return;
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    await noHorizontalOverflow(page);
    await page.screenshot({ path: path.join(SHOTS, `${name}-${width}.png`), fullPage: true });
  }
}

const docRow = (tipo: string, idioma: 'es' | 'en'): Row => {
  const d = (LEGAL_DRAFTS as Record<string, Record<string, { titulo: string; texto: string }>>)[tipo][idioma];
  return {
    id: `${tipo}-${idioma}`, tipo, version: LEGAL_DRAFT_VERSION, idioma, titulo: d.titulo, texto: d.texto,
    audiencia: tipo === 'privacidad' ? 'todos' : tipo === 'terminos_candidato' ? 'candidato' : 'empleador',
    requiere_aceptacion: true, casillas_obligatorias: [], borrador: true,
    vigente_desde: '2026-10-29T00:00:00Z', created_at: '2026-10-29T00:00:00Z',
  };
};
const ALL_DOCS = (): Row[] => (['privacidad', 'terminos_candidato', 'terminos_empleador', 'condiciones_publicacion'] as const)
  .flatMap((t) => [docRow(t, 'es'), docRow(t, 'en')]);

test.describe('aviso legal', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`es (${theme}): titular, borrador, enlaces y pie`, async ({ context, page }) => {
      await boot(context, { theme });
      await page.goto('/aviso-legal');
      await expect(page.getByRole('heading', { level: 1, name: 'Aviso legal' })).toBeVisible({ timeout: 60_000 });
      await expect(page.getByRole('note').filter({ hasText: 'Borrador pendiente de revisión legal.' })).toBeVisible();
      const owner = page.locator('dl');
      await expect(owner).toContainText('YourCVPassport');
      // Lo que falta en LEGAL_ENTITY no se pinta (ni filas vacías ni marcas)
      await expect(owner).not.toContainText('CONFIRMAR');
      await expect(page.locator('body')).not.toContainText(/iseie/i);
      await expect(owner.getByRole('link', { name: 'support@yourcvpassport.com' })).toHaveAttribute('href', 'mailto:support@yourcvpassport.com');
      await expect(page.getByRole('link', { name: 'Política de privacidad' }).first()).toHaveAttribute('href', '/privacidad');
      await expect(page.getByRole('link', { name: 'Política de cookies' }).first()).toHaveAttribute('href', '/politica-de-cookies');
      await expect(page.locator('footer').getByRole('link', { name: 'Aviso legal' })).toHaveAttribute('href', '/aviso-legal');
      await shots(page, `aviso-legal-es-${theme}`);
    });
  }

  test('en: /legal-notice', async ({ context, page }) => {
    await boot(context, { lang: 'en' });
    await page.goto('/legal-notice');
    await expect(page.getByRole('heading', { level: 1, name: 'Legal notice' })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Draft pending legal review.')).toBeVisible();
    await expect(page.locator('dl')).toContainText('support@yourcvpassport.com');
    await expect(page.locator('body')).not.toContainText(/iseie|to be confirmed/i);
    await expect(page.locator('footer').getByRole('link', { name: 'Legal notice' })).toHaveAttribute('href', '/legal-notice');
    await page.setViewportSize({ width: 390, height: 900 });
    await noHorizontalOverflow(page);
  });
});

test('politica de cookies: aviso de borrador y responsable', async ({ context, page }) => {
  await boot(context);
  await page.goto('/politica-de-cookies');
  await expect(page.getByRole('heading', { level: 1, name: 'Política de cookies' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('note').filter({ hasText: 'Borrador pendiente de revisión legal.' })).toBeVisible();
  await expect(page.getByText(/Responsable: YourCVPassport \(/)).toBeVisible();
});

test.describe('borradores v2.0 en las paginas legales', () => {
  for (const theme of ['light', 'dark'] as const) {
    test(`privacidad y condiciones (${theme})`, async ({ context, page }) => {
      await boot(context, { theme, db: { documentos_legales: ALL_DOCS() } });

      await page.goto('/privacidad');
      await expect(page.getByRole('heading', { level: 1, name: 'Política de Privacidad' })).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText(`Borrador v${LEGAL_DRAFT_VERSION}`)).toBeVisible();
      await expect(page.locator('strong', { hasText: '1. Responsable del tratamiento.' })).toBeVisible();
      await expect(page.getByText(/Agencia Española de Protección de Datos/)).toBeVisible();
      // La línea «BORRADOR…» no se pinta como párrafo (va como aviso aparte)
      await expect(page.locator('p', { hasText: /^BORRADOR v/ })).toHaveCount(0);
      await shots(page, `privacidad-es-${theme}`);

      await page.goto('/terminos?tipo=empleador');
      await expect(page.getByRole('heading', { level: 1, name: 'Condiciones de registro y uso – Empleadores' })).toBeVisible({ timeout: 60_000 });
      await expect(page.locator('[id="anexo"]')).toHaveCount(1);
      await expect(page.locator('#anexo')).toContainText('ANEXO I. Encargo del tratamiento');
      await shots(page, `terminos-empleador-es-${theme}`);
    });
  }

  test('en: privacy policy', async ({ context, page }) => {
    await boot(context, { lang: 'en', db: { documentos_legales: ALL_DOCS() } });
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1, name: 'Privacy Policy' })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('strong', { hasText: '1. Data controller.' })).toBeVisible();
    await expect(page.getByText(/Spanish Data Protection Agency/)).toBeVisible();
  });
});

test.describe('admin: cargar el borrador preparado', () => {
  test('rellena el formulario, avisa y no deja publicar un borrador', async ({ context, page }) => {
    const rpcCalls: string[] = [];
    page.on('request', (req) => {
      const m = new URL(req.url()).pathname.match(/\/rest\/v1\/rpc\/(.+)$/);
      if (m && req.method() === 'POST') rpcCalls.push(m[1]);
    });
    await boot(context, { admin: true, db: { documentos_legales: ALL_DOCS().filter((r) => r.tipo !== 'privacidad').map((r) => ({ ...r, version: '1.0' })) } });
    await page.goto('/admin');
    await page.getByRole('button', { name: /Condiciones legales/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Condiciones legales', level: 2 })).toBeVisible({ timeout: 60_000 });

    await page.getByRole('button', { name: 'Nueva versión' }).click();
    await page.locator('#legal-tipo').selectOption('privacidad');
    await page.getByTestId('legal-load-prepared').click();
    await expect(page.locator('#legal-version')).toHaveValue(LEGAL_DRAFT_VERSION);
    await expect(page.locator('#legal-titulo')).toHaveValue('Política de Privacidad');
    await expect(page.locator('#legal-texto')).toHaveValue(/^BORRADOR v2.1/);
    await expect(page.getByTestId('legal-draft-note')).toBeVisible();

    await page.getByRole('button', { name: 'Vista previa' }).click();
    await expect(page.getByTestId('legal-preview').locator('strong', { hasText: '13. Con quién compartimos tus datos.' })).toBeVisible();
    await shots(page, 'admin-borrador-preview');

    await page.getByRole('button', { name: 'Revisar y publicar' }).click();
    await expect(page.getByText(/El texto sigue siendo un borrador/)).toBeVisible();
    await expect(page.getByTestId('legal-confirm')).toHaveCount(0);

    // Quitar la línea BORRADOR no basta: faltan el NIF y el domicilio del titular
    const texto = await page.locator('#legal-texto').inputValue();
    await page.locator('#legal-texto').fill(texto.split('\n').slice(1).join('\n'));
    await page.getByRole('button', { name: 'Revisar y publicar' }).click();
    await expect(page.getByText(/El texto sigue siendo un borrador/)).toBeVisible();
    expect(rpcCalls.filter((f) => f === 'legal_publicar_version')).toHaveLength(0);

    // En inglés también hay borrador preparado
    await page.locator('#legal-idioma').selectOption('en');
    await page.getByTestId('legal-load-prepared').click();
    await expect(page.locator('#legal-texto')).toHaveValue(/^DRAFT v2.1/);
  });
});
