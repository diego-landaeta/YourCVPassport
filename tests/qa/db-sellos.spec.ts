/**
 * Migración 20261008_stamps_insert_solo_pendiente.sql en PGlite (Postgres en memoria).
 *
 * Reproduce primero el hueco (un usuario se inserta un sello VERIFIED), aplica la
 * migración dos veces (idempotencia) y comprueba que:
 * - un usuario solo crea sellos PENDING de su propio perfil (el trigger fuerza PENDING);
 * - anon no inserta;
 * - admin y service_role (Edge Functions) siguen creando sellos VERIFIED;
 * - un usuario no puede pasar su sello a VERIFIED por UPDATE.
 *
 * Se aplican las migraciones reales de stamps del repo. No toca ninguna BD real.
 * Solo corre en el proyecto chromium (no usa navegador).
 *
 *   npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/db-sellos.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { SupabaseBd, denegado, describirError, leerMigracion, type Rol } from './helpers/pgliteSupabase';

const MIGRACION = '20261008_stamps_insert_solo_pendiente.sql';

const U = {
  A: '00000000-0000-0000-0000-00000000000a',
  B: '00000000-0000-0000-0000-00000000000b',
  ADMIN: '00000000-0000-0000-0000-0000000000ad',
};

let bd: SupabaseBd;

test.describe.serial('BD: stamps solo admite sellos PENDING de usuarios', () => {
  test.beforeAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    bd = await SupabaseBd.crear();
    await bd.exec(`
      CREATE TABLE public.profiles (id uuid PRIMARY KEY REFERENCES auth.users(id), role text DEFAULT 'professional');
      INSERT INTO auth.users VALUES ('${U.A}', 'a@x'), ('${U.B}', 'b@x'), ('${U.ADMIN}', 'ad@x');
      INSERT INTO public.profiles VALUES ('${U.A}', 'professional'), ('${U.B}', 'professional'), ('${U.ADMIN}', 'admin');
    `);
    for (const f of ['20251127_setup_verification.sql', '20260107_fix_stamps_rls_clean.sql', '20260112_fix_admin_stamps_access.sql']) {
      await bd.aplicarMigracion(f);
    }
    // current_user_is_admin(): misma definición que 20261005_proteger_datos_profiles.sql
    const pd = leerMigracion('20261005_proteger_datos_profiles.sql');
    await bd.exec(pd.slice(
      pd.indexOf('CREATE OR REPLACE FUNCTION public.current_user_is_admin()'),
      pd.indexOf('COMMENT ON FUNCTION public.current_user_is_admin()'),
    ));
  });

  test.afterAll(async () => {
    await bd?.cerrar();
  });

  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Prueba de BD en Node: basta con un proyecto');
  });

  const ins = (role: Rol, sub: string | null, profileId: string, status: string, type = 'EMAIL') =>
    bd.as<{ status: string; verified_at: Date | null }>(role, sub,
      `INSERT INTO public.stamps (profile_id, type, status, verified_at)
       VALUES ($1, $2, $3, CASE WHEN $3 = 'VERIFIED' THEN now() END) RETURNING status, verified_at`,
      [profileId, type, status]);

  test('ANTES: un usuario se inserta un sello VERIFIED (hueco reproducido)', async () => {
    const r = await ins('authenticated', U.A, U.A, 'VERIFIED');
    expect(r.error, describirError(r)).toBeNull();
    expect(r.rows?.[0]?.status).toBe('VERIFIED');
  });

  test('la migración es idempotente (aplicada dos veces)', async () => {
    expect(await bd.probarMigracion(MIGRACION), 'primera pasada').toBeNull();
    expect(await bd.probarMigracion(MIGRACION), 'segunda pasada').toBeNull();
  });

  test('usuario pide VERIFIED -> queda PENDING sin verified_at', async () => {
    const r = await ins('authenticated', U.A, U.A, 'VERIFIED', 'PHONE');
    expect(r.error, describirError(r)).toBeNull();
    expect(r.rows?.[0]?.status).toBe('PENDING');
    expect(r.rows?.[0]?.verified_at).toBeNull();
  });

  test('usuario crea un sello PENDING (flujo normal)', async () => {
    const r = await ins('authenticated', U.A, U.A, 'PENDING', 'EMAIL');
    expect(r.error, describirError(r)).toBeNull();
    expect(r.rows?.[0]?.status).toBe('PENDING');
  });

  test('usuario no crea sellos de otro perfil', async () => {
    const r = await ins('authenticated', U.A, U.B, 'PENDING', 'EMAIL');
    expect(denegado(r), describirError(r)).toBe(true);
  });

  test('anon no inserta sellos', async () => {
    const r = await ins('anon', null, U.A, 'VERIFIED', 'EMAIL');
    expect(denegado(r), describirError(r)).toBe(true);
  });

  test('admin sí crea un sello VERIFIED para otro perfil', async () => {
    const r = await ins('authenticated', U.ADMIN, U.B, 'VERIFIED', 'PHONE');
    expect(r.error, describirError(r)).toBeNull();
    expect(r.rows?.[0]?.status).toBe('VERIFIED');
  });

  test('service_role (Edge Functions) sí crea un sello VERIFIED', async () => {
    const r = await ins('service_role', null, U.B, 'VERIFIED', 'EMAIL');
    expect(r.error, describirError(r)).toBeNull();
    expect(r.rows?.[0]?.status).toBe('VERIFIED');
  });

  test('usuario no puede pasar su sello a VERIFIED por UPDATE', async () => {
    const r = await bd.user(U.A, `UPDATE public.stamps SET status = 'VERIFIED' WHERE profile_id = $1 RETURNING id`, [U.A]);
    expect(r.error, describirError(r)).toBeNull();
    expect(r.rows).toHaveLength(0);
  });

  test('A solo conserva el sello VERIFIED creado ANTES de la migración', async () => {
    const v = await bd.una<{ n: number }>(`SELECT count(*)::int n FROM public.stamps WHERE profile_id = $1 AND status = 'VERIFIED'`, [U.A]);
    expect(v?.n).toBe(1);
  });
});
