/**
 * Migración 20261015_rls_hijas_segun_perfil_visible.sql en PGlite (Postgres en memoria).
 *
 * Reproduce primero la fuga (anon lee la educación de un perfil oculto), aplica la
 * migración dos veces (idempotencia) y comprueba que las tablas del CV siguen al perfil:
 * - anon solo ve las filas de perfiles publicados (no ocultos, no suspendidos, con slug);
 * - el dueño ve las suyas aunque su perfil no esté publicado;
 * - el admin las ve todas y el gestor las de sus perfiles gestionados.
 *
 * Las políticas de profiles son copia de las de producción (pg_policies, 15/10/2026).
 * No toca ninguna BD real. Solo corre en el proyecto chromium (no usa navegador).
 *
 *   npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/db-cv-visible.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { SupabaseBd, leerMigracion, describirError } from './helpers/pgliteSupabase';

const MIGRACION = '20261015_rls_hijas_segun_perfil_visible.sql';
const TABLAS = ['education', 'experiences', 'skills', 'languages', 'portfolio_items', 'certifications'];

const U = {
  PUBLICADO: '00000000-0000-0000-0000-000000000001',
  OCULTO: '00000000-0000-0000-0000-000000000002',
  SUSPENDIDO: '00000000-0000-0000-0000-000000000003',
  SIN_SLUG: '00000000-0000-0000-0000-000000000004',
  GESTIONADO: '00000000-0000-0000-0000-000000000005',
  ADMIN: '00000000-0000-0000-0000-0000000000ad',
  GESTOR: '00000000-0000-0000-0000-0000000000e5',
};

let bd: SupabaseBd;

test.describe.serial('BD: los datos del CV solo se ven si el perfil es visible', () => {
  test.beforeAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    bd = await SupabaseBd.crear();
    const ids = Object.values(U);
    await bd.exec(`
      CREATE TABLE public.profiles (
        id uuid PRIMARY KEY REFERENCES auth.users(id),
        role text DEFAULT 'professional',
        slug text,
        profile_hidden boolean,
        is_active boolean,
        managed_by uuid
      );
      INSERT INTO auth.users VALUES ${ids.map((id, i) => `('${id}', 'u${i}@x')`).join(', ')};
      INSERT INTO public.profiles (id, role, slug, profile_hidden, is_active, managed_by) VALUES
        ('${U.PUBLICADO}', 'professional', 'publicado', false, true, null),
        ('${U.OCULTO}', 'professional', 'oculto', true, true, null),
        ('${U.SUSPENDIDO}', 'professional', 'suspendido', false, false, null),
        ('${U.SIN_SLUG}', 'professional', null, null, null, null),
        ('${U.GESTIONADO}', 'professional', 'gestionado', true, true, '${U.GESTOR}'),
        ('${U.ADMIN}', 'admin', null, null, null, null),
        ('${U.GESTOR}', 'profile_manager', null, null, null, null);
    `);
    // current_user_is_admin(): misma definición que 20261005_proteger_datos_profiles.sql
    const pd = leerMigracion('20261005_proteger_datos_profiles.sql');
    await bd.exec(pd.slice(
      pd.indexOf('CREATE OR REPLACE FUNCTION public.current_user_is_admin()'),
      pd.indexOf('COMMENT ON FUNCTION public.current_user_is_admin()'),
    ));
    // Políticas SELECT de profiles en producción.
    await bd.exec(`
      ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
      GRANT SELECT ON public.profiles TO anon, authenticated;
      CREATE POLICY "Perfiles publicados visibles para todos" ON public.profiles FOR SELECT TO anon, authenticated
        USING (slug IS NOT NULL AND profile_hidden IS NOT TRUE AND is_active IS NOT FALSE);
      CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
      CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.current_user_is_admin());
      CREATE POLICY "Managers can view managed profiles" ON public.profiles FOR SELECT TO authenticated USING (managed_by = auth.uid());
    `);
    // Tablas del CV con la política abierta que hay hoy en producción.
    for (const t of TABLAS) {
      await bd.exec(`
        CREATE TABLE public.${t} (id serial PRIMARY KEY, profile_id uuid REFERENCES public.profiles(id));
        ALTER TABLE public.${t} ENABLE ROW LEVEL SECURITY;
        GRANT SELECT ON public.${t} TO anon, authenticated;
        CREATE POLICY "${t} viewable by everyone" ON public.${t} FOR SELECT USING (true);
        INSERT INTO public.${t} (profile_id) SELECT id FROM public.profiles WHERE role = 'professional';
      `);
    }
  });

  test.afterAll(async () => {
    await bd?.cerrar();
  });

  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Prueba de BD en Node: basta con un proyecto');
  });

  const visibles = async (tabla: string, role: 'anon' | 'authenticated', sub: string | null) => {
    const r = await bd.as<{ profile_id: string }>(role, sub, `SELECT profile_id FROM public.${tabla} ORDER BY profile_id`);
    expect(r.error, describirError(r)).toBeFalsy();
    return (r.rows ?? []).map(x => x.profile_id);
  };

  test('antes: anon lee el CV de perfiles ocultos, suspendidos y sin publicar', async () => {
    expect(await visibles('education', 'anon', null)).toEqual([U.PUBLICADO, U.OCULTO, U.SUSPENDIDO, U.SIN_SLUG, U.GESTIONADO]);
  });

  test('la migración se aplica dos veces sin error', async () => {
    await bd.aplicarMigracion(MIGRACION);
    await bd.aplicarMigracion(MIGRACION);
  });

  for (const t of TABLAS) {
    test(`${t}: cada rol ve lo que le corresponde`, async () => {
      expect(await visibles(t, 'anon', null)).toEqual([U.PUBLICADO]);
      expect(await visibles(t, 'authenticated', U.PUBLICADO)).toEqual([U.PUBLICADO]);
      // El dueño ve lo suyo aunque esté oculto o sin publicar (asistente).
      expect(await visibles(t, 'authenticated', U.OCULTO)).toEqual([U.PUBLICADO, U.OCULTO]);
      expect(await visibles(t, 'authenticated', U.SIN_SLUG)).toEqual([U.PUBLICADO, U.SIN_SLUG]);
      expect(await visibles(t, 'authenticated', U.ADMIN)).toEqual([U.PUBLICADO, U.OCULTO, U.SUSPENDIDO, U.SIN_SLUG, U.GESTIONADO]);
      expect(await visibles(t, 'authenticated', U.GESTOR)).toEqual([U.PUBLICADO, U.GESTIONADO]);
    });
  }
});
