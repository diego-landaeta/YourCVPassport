/**
 * Auditoria de la bolsa (F8, F9, F12, F13) con Supabase mockeado. Nada sale a produccion.
 *
 *  - F8: «Quitar valoracion» envia p_clear_rating=true (con rating = null la RPC no borra).
 *  - F9: correos con plantilla «Descartado» y «Te llamamos» desde el panel de la candidatura:
 *    confirmacion, RPC send_application_message, estado enviado y error de «ya enviado».
 *  - F12: «Descargar condiciones» en el panel del candidato.
 *  - F13: el panel de administracion usa los estados REALES (MAYUSCULAS) de job_applications (guardia estatica).
 *
 *   QA_PORT=5440 npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/candidaturas-auditoria.local.spec.ts --project=chromium
 */
import { test, expect, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADMIN_ID, SAFE_CONTEXT_OPTIONS, installInitState, makeProfiles, mockSupabase, type Row } from './helpers/supabaseMock';

const HERE = path.dirname(fileURLToPath(import.meta.url));

test.use(SAFE_CONTEXT_OPTIONS);
test.describe.configure({ timeout: 150_000 });

const DAY = 86400_000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const COMPANY_ID = uuid(900);
const EMP_USER = uuid(901);
const JOB: Row = { id: uuid(910), company_id: COMPANY_ID, title: 'Enfermera/o UCI', location_city: 'Madrid' };
const APP_NEW = uuid(1000);
const APP_RATED = uuid(1001);

function app(id: string, i: number, over: Row = {}): Row {
  return {
    id, created_at: ago(1), updated_at: ago(1), job_posting_id: JOB.id, profile_id: uuid(1100 + i), company_id: COMPANY_ID, status: 'NEW',
    cover_letter: null, answers: {}, viewed_by_company: false, viewed_at: null, internal_notes: null, rating: null, match_score: 80,
    perfil_copia: {
      version: 1, captured_at: ago(1),
      profile: { full_name: i === 0 ? 'Lucía Fernández' : 'Javier Santos', headline: 'Enfermera', location: 'Madrid', summary: 'Resumen.', slug: `perfil-${i}`, avatar_url: null },
      contact: { email: `candidato${i}@example.test`, phone: null },
      experiences: [], education: [], skills: [{ name: 'UCI' }], languages: [],
    },
    consent_at: ago(1), consent_doc_version: '1.0', descartada_auto: false, metadata: null,
    ...over,
  };
}

async function setupCompany(context: BrowserContext, page: Page, rpcOver: Record<string, unknown> = {}) {
  const profile = { id: EMP_USER, email: 'rrhh@hospital-norte.example', full_name: 'Persona RRHH', role: 'employer', plan: 'free', wizard_completed: true, first_login_completed: true };
  await installInitState(context, { sessionProfile: profile, language: 'es', theme: 'light' });
  const rpcCalls: Record<string, any[]> = {};
  page.on('request', (req) => {
    const m = new URL(req.url()).pathname.match(/\/rest\/v1\/rpc\/(.+)$/);
    if (m && req.method() === 'POST') (rpcCalls[m[1]] ||= []).push(JSON.parse(req.postData() || '{}'));
  });
  await mockSupabase(context, {
    profiles: [profile],
    company_users: [{ id: uuid(902), company_id: COMPANY_ID, user_id: EMP_USER, role: 'OWNER' }],
    companies: [{ id: COMPANY_ID, company_name: 'Hospital Universitario Norte', legal_name: 'Hospital Universitario Norte, S.A.', tax_id: 'A11111111', company_email: 'rrhh@hospital-norte.example', status: 'APPROVED', credit_balance: 0, total_credits_purchased: 0, total_credits_used: 0, country_code: 'ES', logo_url: null, created_at: ago(90), updated_at: ago(90) }],
    job_applications: [app(APP_NEW, 0), app(APP_RATED, 1, { rating: 3 })],
    job_postings: [JOB],
    countries: [{ code: 'ES', name_es: 'España', name_en: 'Spain', currency: 'EUR', active: true }],
  }, {
    rpc: {
      documentos_pendientes: [],
      get_job_questions_for_company: [],
      get_application_history: [],
      ...rpcOver,
    },
  });
  return rpcCalls;
}

async function openDrawer(page: Page, who: RegExp) {
  await page.goto('/company/jobs/applications', { waitUntil: 'domcontentloaded' });
  await page.getByRole('heading', { level: 1, name: 'Candidaturas recibidas' }).waitFor({ timeout: 90_000 });
  await page.getByRole('button', { name: who }).first().click();
  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();
  return drawer;
}

test.describe('panel de la empresa', () => {
  test('F8: «Quitar valoración» envía p_clear_rating=true', async ({ context, page }) => {
    const rpcCalls = await setupCompany(context, page);
    const drawer = await openDrawer(page, /Abrir candidatura de Javier/);
    await drawer.getByRole('button', { name: 'Quitar valoración' }).click();
    await drawer.getByRole('button', { name: 'Guardar notas' }).click();
    await expect.poll(() => rpcCalls.update_application_status?.length ?? 0).toBe(1);
    expect(rpcCalls.update_application_status[0]).toMatchObject({
      p_application_id: APP_RATED, p_company_id: COMPANY_ID, p_rating: null, p_clear_rating: true,
    });
  });

  test('F8: guardar sin tocar la valoración NO envía p_clear_rating', async ({ context, page }) => {
    const rpcCalls = await setupCompany(context, page);
    const drawer = await openDrawer(page, /Abrir candidatura de Javier/);
    await drawer.getByRole('button', { name: 'Guardar notas' }).click();
    await expect.poll(() => rpcCalls.update_application_status?.length ?? 0).toBe(1);
    expect(rpcCalls.update_application_status[0].p_rating).toBe(3);
    expect(rpcCalls.update_application_status[0]).not.toHaveProperty('p_clear_rating');
  });

  test('F9: «Descartado» pide confirmación, llama a send_application_message y queda como enviado', async ({ context, page }) => {
    const rpcCalls = await setupCompany(context, page, { send_application_message: { success: true, queued: true } });
    const drawer = await openDrawer(page, /Abrir candidatura de Lucía/);

    // Cancelar no envía nada
    await drawer.getByRole('button', { name: 'Enviar «Te llamamos»' }).click();
    await expect(drawer.getByRole('alertdialog')).toContainText('¿Enviar el correo «Te llamamos»?');
    await drawer.getByRole('button', { name: 'Cancelar' }).click();
    await expect(drawer.getByRole('alertdialog')).toHaveCount(0);
    expect(rpcCalls.send_application_message).toBeUndefined();

    await drawer.getByRole('button', { name: 'Enviar «Descartado»' }).click();
    await expect(drawer.getByRole('alertdialog')).toContainText('¿Enviar el correo «Descartado»?');
    await expect(drawer.getByRole('alertdialog')).toContainText('Enfermera/o UCI');
    await drawer.getByRole('button', { name: 'Sí, enviar' }).click();

    await expect.poll(() => rpcCalls.send_application_message?.length ?? 0).toBe(1);
    expect(rpcCalls.send_application_message[0]).toEqual({ p_application_id: APP_NEW, p_template: 'rejected' });
    // Estado enviado: el botón queda desactivado con «Enviado»; la otra plantilla sigue disponible
    const sent = drawer.getByRole('button', { name: /Descartado.*Enviado/ });
    await expect(sent).toBeVisible();
    await expect(sent).toBeDisabled();
    await expect(drawer.getByRole('button', { name: 'Enviar «Te llamamos»' })).toBeEnabled();
  });

  test('F9: MESSAGE_ALREADY_SENT se explica', async ({ context, page }) => {
    await setupCompany(context, page);
    await page.route('**/rest/v1/rpc/send_application_message', (route) => route.fulfill({
      status: 400, contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({ code: 'P0001', message: 'MESSAGE_ALREADY_SENT: ya se envió esa plantilla a este candidato en las últimas 24 horas' }),
    }));
    const drawer = await openDrawer(page, /Abrir candidatura de Lucía/);
    await drawer.getByRole('button', { name: 'Enviar «Te llamamos»' }).click();
    await drawer.getByRole('button', { name: 'Sí, enviar' }).click();
    await expect(drawer.getByText('Ya enviaste este mensaje a este candidato en las últimas 24 horas.')).toBeVisible();
  });

  test('F9: un mensaje enviado en las últimas 24 h (historial) aparece ya como enviado', async ({ context, page }) => {
    await setupCompany(context, page, {
      get_application_history: [
        { from_status: null, to_status: 'NEW', changed_by_role: 'CANDIDATE', created_at: ago(2), note: null },
        { from_status: 'NEW', to_status: 'NEW', changed_by_role: 'COMPANY', created_at: new Date(Date.now() - 3600_000).toISOString(), note: 'message:interview' },
      ],
    });
    const drawer = await openDrawer(page, /Abrir candidatura de Lucía/);
    await expect(drawer.getByRole('button', { name: /Te llamamos.*Enviado/ })).toBeDisabled();
    await expect(drawer.getByText('Correo «Te llamamos» enviado')).toBeVisible();
  });
});

test.describe('panel del candidato', () => {
  test('F12: «Descargar condiciones» descarga el texto vigente de candidato', async ({ context, page }) => {
    const [base] = makeProfiles(1);
    const profile = { ...base, id: ADMIN_ID, role: 'user', first_login_completed: true, dashboard_tour_completed: true, wizard_completed: true, full_name: 'Lucía Fernández', country_code: 'ES' };
    await installInitState(context, { sessionProfile: profile, language: 'es', theme: 'light' });
    await mockSupabase(context, {
      profiles: [profile],
      my_job_applications: [],
      saved_job_postings: [],
      job_alert_subscriptions: [],
      documentos_legales: [{
        id: uuid(7000), tipo: 'terminos_candidato', version: '1.0', idioma: 'es', titulo: 'Condiciones para candidatos',
        texto: 'Texto de prueba de las condiciones.', audiencia: 'candidato', casillas_obligatorias: ['acepto_condiciones_privacidad'],
        borrador: false, vigente_desde: '2026-10-01T00:00:00Z',
      }],
    }, { rpc: { get_recommended_jobs: [], documentos_pendientes: [] } });
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      window.history.pushState({ section: 'opportunities' }, '');
      window.dispatchEvent(new PopStateEvent('popstate', { state: { section: 'opportunities' } }));
    });
    const btn = page.getByRole('button', { name: 'Descargar condiciones' });
    await expect(btn).toBeVisible({ timeout: 90_000 });
    const [download] = await Promise.all([page.waitForEvent('download'), btn.click()]);
    expect(download.suggestedFilename()).toBe('terminos_candidato-v1.0-es.txt');
  });
});

// F13: components/admin/JobApplicationsManagement.tsx NO se puede abrir hoy desde AdminDashboard (ninguna
// tarjeta fija activeTab = 'applications'), asi que no hay navegador que lo monte: se protege el
// contrato con la base leyendo el fuente. Los estados que escribe deben ser los del CHECK de
// job_applications (MAYUSCULAS); los antiguos 'pending|reviewing|accepted|rejected' los rechaza la base.
test.describe('panel de administración (F13)', () => {
  const src = fs.readFileSync(path.resolve(HERE, '../../components/admin/JobApplicationsManagement.tsx'), 'utf8');

  test('escribe solo estados reales de job_applications y con etiqueta traducida', () => {
    const writes = [...src.matchAll(/handleUpdateStatus\([^,]+,\s*'([A-Za-z_]+)'\)/g)].map((m) => m[1]);
    expect(writes.length).toBeGreaterThan(0);
    const REAL = ['NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN', 'NOT_QUALIFIED'];
    for (const w of writes) expect(REAL, w).toContain(w);
    expect(src).not.toMatch(/'(pending|reviewing|accepted|rejected)'/);
    // Cada estado real tiene etiqueta en es y en en
    for (const st of REAL) expect(src.match(new RegExp('st_' + st + ':', 'g'))?.length, st).toBe(2);
  });
});
