/**
 * Migraciones de companies en PGlite (Postgres en memoria):
 * - 20261009_proteger_datos_companies.sql (fase 1): vista companies_full para
 *   miembros, creador y admin; aditiva, el frontend antiguo sigue funcionando.
 * - 20261009b_cerrar_columnas_privadas_companies.sql (fase 2): anon y authenticated
 *   solo leen id, company_name y logo_url de la tabla; anon sin escritura.
 *
 * Se aplican las migraciones REALES del módulo de empresas en orden, se reproduce
 * la fuga (ANTES), se comprueban los abortos de seguridad de la fase 2, la
 * idempotencia y el acceso de anon, usuario ajeno, miembros, creador, admin,
 * service_role, embeds de PostgREST y RPC SECURITY DEFINER.
 * No toca ninguna BD real. Solo corre en el proyecto chromium (no usa navegador).
 *
 *   npx playwright test -c tests/qa/playwright.qa.config.ts tests/qa/db-empresas.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { SupabaseBd, denegado, describirError, leerMigracion, type Resultado } from './helpers/pgliteSupabase';

const FASE1 = '20261009_proteger_datos_companies.sql';
const FASE2 = '20261009b_cerrar_columnas_privadas_companies.sql';

const U = {
  ADMIN: '00000000-0000-0000-0000-0000000000ad',
  A: '00000000-0000-0000-0000-00000000000a',       // candidata pública
  HIDDEN: '00000000-0000-0000-0000-0000000000e4',  // perfil oculto
  MGR: '00000000-0000-0000-0000-0000000000e1',
  MANAGED: '00000000-0000-0000-0000-0000000000e2',
  REC: '00000000-0000-0000-0000-0000000000c1',     // OWNER de ACME
  REC2: '00000000-0000-0000-0000-0000000000c2',    // MEMBER de ACME
  RADM: '00000000-0000-0000-0000-0000000000c4',    // ADMIN de ACME
  OUT: '00000000-0000-0000-0000-0000000000c3',     // atacante autenticado
  NEWCO: '00000000-0000-0000-0000-0000000000f1',   // registra empresa nueva
  NEW2: '00000000-0000-0000-0000-0000000000f2',    // invitado
};
const ACME = '22222222-2222-2222-2222-222222222222';
const PEND = '33333333-3333-3333-3333-333333333333';
const JOB_PUB = '44444444-4444-4444-4444-444444444441';
const JOB_DRAFT = '44444444-4444-4444-4444-444444444442';
const APP1 = '55555555-5555-5555-5555-555555555551';

// Columnas de public.profiles en producción (tipos inferidos de un GET a PostgREST;
// null = siempre null en los datos, tipo fijado a mano).
const PROFILE_COLS: Record<string, string> = {
  id: 'uuid', full_name: 'text', headline: 'text', summary: 'text', slug: 'text',
  meta_title: 'text', meta_description: 'text', template: 'text', template_color: 'text',
  availability: 'text', location: 'text', phone: 'text', linkedin_url: 'text', github_url: 'text',
  gender: 'text', portfolio_url: 'text', job_seeking_status: 'text', avatar_url: 'text',
  open_to_remote: 'boolean', website_url: 'text', twitter_url: 'text', instagram_url: 'text',
  youtube_url: 'text', behance_url: 'text', dribbble_url: 'text', job_type: 'text[]',
  willing_to_relocate: 'boolean', preferred_locations: 'text[]', slug_validation_error: 'text',
  email: 'text', name: 'text', role: 'text', plan: 'text', handle: 'text', title: 'text',
  remote_preference: 'text', salary_min: 'numeric', salary_max: 'numeric', salary_currency: 'text',
  created_at: 'timestamptz', updated_at: 'timestamptz', show_verified_credentials: 'boolean',
  show_connect_links: 'boolean', show_qr_code: 'boolean', show_availability_badge: 'boolean',
  country_code: 'text', remote: 'boolean', work_mode: 'text', last_slug_changed_at: 'timestamptz',
  dashboard_tour_completed: 'boolean', first_login_completed: 'boolean', wizard_completed: 'boolean',
  is_active: 'boolean', suspension_reason: 'text', suspended_until: 'timestamptz',
  profile_hidden: 'boolean', search_blocked: 'boolean', messages_blocked: 'boolean',
  banner_url: 'text', is_open_to_messages: 'boolean', managed_by: 'uuid',
};

function profileColDef(c: string, tipo: string): string {
  if (c === 'id') return 'id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE';
  if (c === 'slug') return 'slug text UNIQUE';
  if (c === 'role') return "role text DEFAULT 'professional'";
  if (c === 'is_active') return 'is_active boolean DEFAULT true NOT NULL';
  if (['profile_hidden', 'search_blocked', 'messages_blocked'].includes(c)) return `${c} boolean DEFAULT false NOT NULL`;
  if (c === 'managed_by') return 'managed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL';
  if (c === 'created_at' || c === 'updated_at') return `${c} timestamptz DEFAULT now()`;
  return `${c} ${tipo}`;
}

const BASE_SQL = `
CREATE TABLE public.profiles (${Object.entries(PROFILE_COLS).map(([c, t]) => profileColDef(c, t)).join(',\n  ')});
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

-- analytics (creadas desde el dashboard): INSERT abierto como en producción
CREATE TABLE public.analytics_views (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid, visitor_id text, user_agent text, referrer text, viewed_at timestamptz DEFAULT now());
CREATE TABLE public.analytics_clicks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid, visitor_id text, cta_type text, cta_label text, created_at timestamptz DEFAULT now());
CREATE TABLE public.analytics_leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), profile_id uuid, name text, email text, company text, message text, source text, status text);
ALTER TABLE public.analytics_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY analytics_views_insert ON public.analytics_views FOR INSERT WITH CHECK (true);
CREATE POLICY analytics_clicks_insert ON public.analytics_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY analytics_leads_all ON public.analytics_leads FOR ALL USING (auth.uid() = profile_id) WITH CHECK (true);
CREATE POLICY analytics_leads_insert ON public.analytics_leads FOR INSERT WITH CHECK (true);

-- leads (para 20261005_cerrar_politicas_abiertas.sql)
CREATE TABLE public.leads (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), sender_id uuid, profile_id uuid);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- send_email_notification (la real llama a net.http_post): stub
CREATE FUNCTION public.send_email_notification(p_to_email text, p_template text, p_data jsonb) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN; END $$;

-- increment: creada a mano en producción (no está en el repo). Reproducción con
-- el comportamiento observado (nombre de tabla dinámico, anon puede ejecutarla).
CREATE FUNCTION public.increment(row_id uuid, table_name text, column_name text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  EXECUTE format('UPDATE public.%I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', table_name, column_name, column_name) USING row_id;
END $$;
`;

// Migraciones del módulo de empresas (y dependencias) en orden de despliegue.
const CADENA = [
  '20251230_create_companies_core.sql',
  '20251230_update_credits_transaction_types.sql',
  '20251230_create_company_activity_tables.sql',
  '20251230_create_company_messages.sql',
  '20251230_create_job_postings.sql',
  '20251230_create_company_rpc_functions.sql',
  '20251230_credit_consumption_helpers.sql',
  '20251230_job_postings_rpc_functions.sql',
  '20251230_fix_company_rls_policies.sql',
  '20251230_fix_recursion_final.sql',
  '20260105_fix_job_postings_public_access.sql',
  '20260105_create_user_activity_tracking.sql',
  '20260105_fix_company_team_rls_v4_TYPES.sql',
  '20260106_create_saved_job_postings.sql',
  '20260730_analytics_rls_and_manager_access.sql',
  '20261005_proteger_datos_profiles.sql',
  '20261005_cerrar_politicas_abiertas.sql',
  '20261005_revocar_send_email_notification.sql',
];

const PUBLICAS = ['id', 'company_name', 'logo_url'];

let bd: SupabaseBd;
let allCols: string[] = [];
let PRIVADAS: string[] = [];
let NEWID: string | undefined;

const anon = (sql: string, p?: unknown[]) => bd.anon(sql, p);
const user = (id: string, sql: string, p?: unknown[]) => bd.user(id, sql, p);
const ok = (r: Resultado) => expect(r.error, describirError(r)).toBeNull();
const esDenegado = (r: Resultado) => expect(denegado(r), describirError(r)).toBe(true);

const privilegiosColumna = async () => (await bd.su(`SELECT grantee, privilege_type, column_name FROM information_schema.column_privileges
  WHERE table_schema = 'public' AND table_name = 'companies' AND grantee IN ('anon', 'authenticated') AND privilege_type = 'SELECT'
  ORDER BY 1, 3`)).rows!.map((x) => `${x.grantee}.${x.column_name}`).join(',');

test.describe.serial('BD: columnas privadas de companies (fases 1 y 2)', () => {
  test.beforeAll(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') return;
    bd = await SupabaseBd.crear();
    await bd.exec(BASE_SQL);

    // is_managed_profile (20260301): solo la función
    const gestor = leerMigracion('20260301_add_profile_manager_role.sql');
    await bd.exec(gestor.slice(gestor.indexOf('CREATE OR REPLACE FUNCTION public.is_managed_profile'), gestor.indexOf('-- 4. Políticas en profiles')));

    for (const f of CADENA) await bd.aplicarMigracion(f);

    // assert_caller_matches_user (solo el helper de 20261005_rpc_validar_usuario.sql)
    const rpc = leerMigracion('20261005_rpc_validar_usuario.sql');
    await bd.exec(rpc.slice(rpc.indexOf('CREATE OR REPLACE FUNCTION public.assert_caller_matches_user'), rpc.indexOf('-- 2. Uso y límites del plan')).replace(/-- -+\s*$/, ''));

    // Política UPDATE de propietario (existió en 20251230_create_companies_core.sql;
    // se simula para comprobar el trigger aunque en producción no estuviera).
    await bd.exec(`CREATE POLICY "Owners update company (simulada)" ON public.companies FOR UPDATE TO authenticated
      USING (EXISTS (SELECT 1 FROM public.company_users cu WHERE cu.company_id = companies.id AND cu.user_id = auth.uid() AND cu.role IN ('OWNER','ADMIN')));`);

    // Datos
    for (const [k, id] of Object.entries(U)) await bd.su('INSERT INTO auth.users (id, email) VALUES ($1, $2)', [id, k.toLowerCase() + '@t']);
    await bd.exec(`
      INSERT INTO profiles (id, full_name, slug, role, email) VALUES
       ('${U.ADMIN}', 'Admin', 'admin', 'admin', 'admin@x.test'),
       ('${U.A}', 'Ana', 'ana', 'professional', 'ana@x.test'),
       ('${U.HIDDEN}', 'Oculto', 'oculto', 'professional', 'h@x.test'),
       ('${U.MGR}', 'Gestor', 'gestor', 'profile_manager', 'm@x.test'),
       ('${U.MANAGED}', 'Gestionado', 'gestionado', 'professional', 'g@x.test'),
       ('${U.REC}', 'Rec', NULL, 'employer', 'rec@x.test'),
       ('${U.REC2}', 'Rec2', NULL, 'employer', 'rec2@x.test'),
       ('${U.RADM}', 'RecAdm', NULL, 'employer', 'radm@x.test'),
       ('${U.OUT}', 'Out', NULL, 'employer', 'out@x.test'),
       ('${U.NEWCO}', 'NewCo', NULL, 'employer', 'newco@x.test'),
       ('${U.NEW2}', 'New2', NULL, 'professional', 'new2@x.test');
      INSERT INTO companies (id, company_name, legal_name, tax_id, company_email, company_phone, status, credit_balance, admin_notes, tax_document_url, address_street, logo_url) VALUES
       ('${ACME}', 'ACME', 'ACME SL', 'B1', 'acme@x.test', '+34 600', 'APPROVED', 100, 'nota interna', 'tax/acme.pdf', 'Calle 1', 'https://logo/acme.png'),
       ('${PEND}', 'Pend', 'Pend SL', 'B2', 'pend@x.test', NULL, 'PENDING', 0, NULL, NULL, NULL, NULL);
      INSERT INTO company_users (company_id, user_id, role) VALUES
       ('${ACME}', '${U.REC}', 'OWNER'), ('${ACME}', '${U.REC2}', 'MEMBER'), ('${ACME}', '${U.RADM}', 'ADMIN');
      INSERT INTO job_postings (id, company_id, created_by, title, description, status, published_at) VALUES
       ('${JOB_PUB}', '${ACME}', '${U.REC}', 'Pub', 'd', 'PUBLISHED', now()),
       ('${JOB_DRAFT}', '${ACME}', '${U.REC}', 'Draft', 'd', 'DRAFT', NULL);
      INSERT INTO job_applications (id, job_posting_id, profile_id, company_id) VALUES ('${APP1}', '${JOB_PUB}', '${U.A}', '${ACME}');
      INSERT INTO saved_job_postings (profile_id, job_posting_id) VALUES ('${U.A}', '${JOB_PUB}');
    `);

    // 20261007 (seguridad de empresas): helpers, created_by, "Miembros y creador ven su empresa"
    await bd.aplicarMigracion('20261007_seguridad_empresas.sql');

    allCols = (await bd.su(`SELECT attname FROM pg_attribute WHERE attrelid = 'public.companies'::regclass AND attnum > 0 AND NOT attisdropped ORDER BY attnum`))
      .rows!.map((x) => x.attname as string);
    PRIVADAS = allCols.filter((c) => !PUBLICAS.includes(c));
  });

  test.afterAll(async () => {
    await bd?.cerrar();
  });

  test.beforeEach(async ({}, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium', 'Prueba de BD en Node: basta con un proyecto');
  });

  // ---------------------------------------------------------------------------
  // ANTES de las migraciones: la fuga existe
  // ---------------------------------------------------------------------------
  test('ANTES: anon lee tax_id / email / notas / créditos de las empresas aprobadas', async () => {
    const r = await anon(`SELECT tax_id, company_email, admin_notes, credit_balance FROM companies`);
    ok(r);
    expect(r.rows).toHaveLength(1);
    expect(r.rows![0].tax_id).toBe('B1');
  });

  test('ANTES: un usuario ajeno lee tax_document_url de ACME', async () => {
    const r = await user(U.OUT, `SELECT tax_document_url FROM companies WHERE id = $1`, [ACME]);
    ok(r);
    expect(r.rows?.[0]?.tax_document_url).toBe('tax/acme.pdf');
  });

  // ---------------------------------------------------------------------------
  // Migraciones: abortos de seguridad e idempotencia
  // ---------------------------------------------------------------------------
  test('fase 2 sin la vista companies_full aborta', async () => {
    const e = await bd.probarMigracion(FASE2);
    expect(e, 'no abortó').not.toBeNull();
    expect(e!.message).toMatch(/companies_full/);
  });

  test('...y tras ese aborto no ha cambiado nada (rollback)', async () => {
    ok(await anon(`SELECT tax_id FROM companies`));
  });

  for (const pasada of [1, 2]) {
    test(`fase 1 aplicada (pasada ${pasada})`, async () => {
      const e = await bd.probarMigracion(FASE1);
      expect(e?.message ?? null).toBeNull();
    });
  }

  test('fase 1 sola: select(*) de companies sigue funcionando (frontend antiguo)', async () => {
    const r = await user(U.REC, `SELECT * FROM companies WHERE id = $1`, [ACME]);
    ok(r);
    expect(r.rows).toHaveLength(1);
  });

  test('fase 1 sola: el miembro ya lee companies_full (frontend nuevo)', async () => {
    const r = await user(U.REC, `SELECT * FROM companies_full`);
    ok(r);
    expect(r.rows).toHaveLength(1);
  });

  test('fase 2 aborta si una política de otra tabla lee companies.status', async () => {
    ok(await bd.su(`CREATE POLICY "qa politica mala" ON public.job_postings FOR SELECT TO anon
      USING (EXISTS (SELECT 1 FROM public.companies c WHERE c.id = job_postings.company_id AND c.status = 'APPROVED'))`));
    try {
      const e = await bd.probarMigracion(FASE2);
      expect(e, 'no abortó').not.toBeNull();
      expect(e!.message).toMatch(/ABORTADO[\s\S]*job_postings[\s\S]*status/);
    } finally {
      await bd.su(`DROP POLICY "qa politica mala" ON public.job_postings`);
    }
  });

  for (const pasada of [1, 2]) {
    test(`fase 2 aplicada (pasada ${pasada})`, async () => {
      const e = await bd.probarMigracion(FASE2);
      expect(e?.message ?? null).toBeNull();
    });
  }

  let privilegiosAntes = '';
  test('fase 1 re-ejecutada después de la fase 2', async () => {
    privilegiosAntes = await privilegiosColumna();
    const e = await bd.probarMigracion(FASE1);
    expect(e?.message ?? null).toBeNull();
  });

  test('idempotente: mismos privilegios de columna tras re-ejecutar (solo id, company_name, logo_url)', async () => {
    const despues = await privilegiosColumna();
    expect(despues).toBe(privilegiosAntes);
    expect(despues).toBe('anon.company_name,anon.id,anon.logo_url,authenticated.company_name,authenticated.id,authenticated.logo_url');
  });

  test('permisos: sin SELECT de tabla; anon sin escritura; authenticated conserva INSERT/UPDATE; companies_full solo SELECT para authenticated', async () => {
    const p = await bd.una(`SELECT
      has_table_privilege('anon', 'public.companies', 'SELECT') a_sel, has_table_privilege('authenticated', 'public.companies', 'SELECT') u_sel,
      has_table_privilege('anon', 'public.companies', 'INSERT') a_ins, has_table_privilege('anon', 'public.companies', 'UPDATE') a_upd,
      has_table_privilege('authenticated', 'public.companies', 'INSERT') u_ins, has_table_privilege('authenticated', 'public.companies', 'UPDATE') u_upd,
      has_table_privilege('anon', 'public.companies_full', 'SELECT') a_full, has_table_privilege('authenticated', 'public.companies_full', 'SELECT') u_full,
      has_table_privilege('authenticated', 'public.companies_full', 'INSERT') u_full_ins, has_table_privilege('authenticated', 'public.companies_full', 'UPDATE') u_full_upd`);
    expect(p).toEqual({
      a_sel: false, u_sel: false, a_ins: false, a_upd: false, u_ins: true, u_upd: true,
      a_full: false, u_full: true, u_full_ins: false, u_full_upd: false,
    });
  });

  // ---------------------------------------------------------------------------
  // anon y usuario ajeno
  // ---------------------------------------------------------------------------
  for (const quien of ['anon', 'ajeno'] as const) {
    const run = (sql: string, p?: unknown[]) => (quien === 'anon' ? anon(sql, p) : user(U.OUT, sql, p));

    test(`${quien}: ninguna columna privada legible`, async () => {
      expect(PRIVADAS.length).toBeGreaterThan(0);
      const legibles: string[] = [];
      for (const c of PRIVADAS) {
        if (!denegado(await run(`SELECT ${c} FROM companies`))) legibles.push(c);
      }
      expect(legibles, `de ${PRIVADAS.length} columnas privadas`).toEqual([]);
    });

    test(`${quien}: select * de companies -> 42501`, async () => {
      esDenegado(await run(`SELECT * FROM companies`));
    });

    test(`${quien}: lee id, company_name y logo_url solo de empresas aprobadas`, async () => {
      const r = await run(`SELECT id, company_name, logo_url FROM companies ORDER BY company_name`);
      ok(r);
      expect(r.rows).toEqual([{ id: ACME, company_name: 'ACME', logo_url: 'https://logo/acme.png' }]);
    });

    test(`${quien}: count sobre id (select('id', {head:true}))`, async () => {
      const r = await run(`SELECT count(id)::int n FROM companies`);
      ok(r);
      expect(r.rows![0].n).toBe(1);
    });

    test(`${quien}: no puede filtrar por una columna privada (oráculo)`, async () => {
      esDenegado(await run(`SELECT id FROM companies WHERE tax_id = 'B1'`));
    });

    if (quien === 'anon') {
      test('anon: companies_full -> 42501', async () => {
        esDenegado(await run(`SELECT * FROM companies_full`));
      });
    } else {
      test('ajeno: companies_full sin filas', async () => {
        const r = await run(`SELECT * FROM companies_full`);
        ok(r);
        expect(r.rows).toHaveLength(0);
      });
    }
  }

  // Embeds tal y como los genera PostgREST (subconsulta lateral con las columnas pedidas)
  test('embed job_postings -> companies(id, company_name, logo_url) como anon', async () => {
    const r = await anon(`SELECT jp.id, jp.title, row_to_json(c.*) AS company
      FROM job_postings jp
      LEFT JOIN LATERAL (SELECT companies.id, companies.company_name, companies.logo_url FROM companies WHERE companies.id = jp.company_id) c ON true
      WHERE jp.status = 'PUBLISHED'`);
    ok(r);
    expect(r.rows).toHaveLength(1);
    expect(r.rows![0].company?.company_name).toBe('ACME');
  });

  test('embed companies!inner (RecommendedJobsTab) como anon', async () => {
    const r = await anon(`SELECT jp.id, c.company_name FROM job_postings jp
      INNER JOIN LATERAL (SELECT companies.id, companies.company_name, companies.logo_url FROM companies WHERE companies.id = jp.company_id) c ON true
      WHERE jp.status = 'PUBLISHED'`);
    ok(r);
    expect(r.rows).toHaveLength(1);
    expect(r.rows![0].company_name).toBe('ACME');
  });

  test('embed job_applications -> job_postings -> companies (useJobApplications) como candidata', async () => {
    const r = await user(U.A, `SELECT ja.id, row_to_json(j.*) AS job_posting FROM job_applications ja
      LEFT JOIN LATERAL (SELECT jp.id, jp.title, jp.company_id, row_to_json(c.*) AS company FROM job_postings jp
        LEFT JOIN LATERAL (SELECT companies.id, companies.company_name, companies.logo_url FROM companies WHERE companies.id = jp.company_id) c ON true
        WHERE jp.id = ja.job_posting_id) j ON true
      WHERE ja.profile_id = $1`, [U.A]);
    ok(r);
    expect(r.rows![0]?.job_posting?.company?.company_name).toBe('ACME');
  });

  test('embed pidiendo tax_id como anon -> 42501', async () => {
    esDenegado(await anon(`SELECT jp.id, row_to_json(c.*) AS company FROM job_postings jp
      LEFT JOIN LATERAL (SELECT companies.id, companies.tax_id FROM companies WHERE companies.id = jp.company_id) c ON true`));
  });

  // RPC SECURITY DEFINER (no les afecta)
  test('RPC search_public_jobs (anon) sigue devolviendo company_name', async () => {
    const r = await anon(`SELECT company_name FROM search_public_jobs(NULL, NULL, NULL, NULL, NULL, 50, 0)`);
    ok(r);
    expect(r.rows![0]?.company_name).toBe('ACME');
  });

  test('RPC get_job_board_listings (anon) sigue funcionando', async () => {
    const r = await anon(`SELECT * FROM get_job_board_listings()`);
    ok(r);
    expect(r.rows!.length).toBeGreaterThanOrEqual(1);
  });

  test('RPC get_saved_jobs (candidata) sigue funcionando', async () => {
    const r = await user(U.A, `SELECT * FROM get_saved_jobs($1)`, [U.A]);
    ok(r);
    expect(r.rows).toHaveLength(1);
  });

  // ---------------------------------------------------------------------------
  // Miembros, creador, admin
  // ---------------------------------------------------------------------------
  for (const [quien, id] of [['OWNER', U.REC], ['MEMBER', U.REC2], ['ADMIN de la empresa', U.RADM]] as const) {
    test(`${quien}: companies_full completa de su empresa (y solo esa)`, async () => {
      const r = await user(id, `SELECT * FROM companies_full`);
      ok(r);
      expect(r.rows).toHaveLength(1);
      const row = r.rows![0];
      expect(row).toMatchObject({ id: ACME, tax_id: 'B1', admin_notes: 'nota interna', credit_balance: 100 });
      expect(Object.keys(row)).toHaveLength(allCols.length);
    });

    test(`${quien}: select * de la tabla companies -> 42501 (el frontend usa companies_full)`, async () => {
      esDenegado(await user(id, `SELECT * FROM companies WHERE id = $1`, [ACME]));
    });
  }

  test('OWNER: credit_balance desde companies_full (CreditsManagementPage)', async () => {
    const r = await user(U.REC, `SELECT credit_balance FROM companies_full WHERE id = $1`, [ACME]);
    ok(r);
    expect(r.rows![0]?.credit_balance).toBe(100);
  });

  test('OWNER: UPDATE de un campo libre en companies (sin RETURNING) funciona', async () => {
    ok(await user(U.REC, `UPDATE companies SET description = 'nueva' WHERE id = $1`, [ACME]));
    expect((await bd.una(`SELECT description FROM companies WHERE id = $1`, [ACME]))?.description).toBe('nueva');
  });

  test('OWNER: update().select() de columnas privadas -> 42501', async () => {
    esDenegado(await user(U.REC, `UPDATE companies SET description = 'x' WHERE id = $1 RETURNING *`, [ACME]));
  });

  test('OWNER: el trigger sigue bloqueando credit_balance', async () => {
    esDenegado(await user(U.REC, `UPDATE companies SET credit_balance = 999 WHERE id = $1`, [ACME]));
  });

  test('OWNER: filtrar companies_full no revela filas ajenas', async () => {
    const r = await user(U.REC, `SELECT * FROM companies_full WHERE public.is_company_member(id) = false`);
    ok(r);
    expect(r.rows).toHaveLength(0);
  });

  // Creador: registro (insert().select('id')) y lectura antes de darse de alta como OWNER
  test('registro con insert().select() (todas las columnas) -> 42501', async () => {
    esDenegado(await user(U.NEWCO, `INSERT INTO companies (company_name, legal_name, tax_id, company_email, status)
      VALUES ('NewCo', 'NewCo SL', 'B9', 'new@x.test', 'APPROVED') RETURNING *`));
  });

  test("registro con insert().select('id') funciona (CompanyRegistrationPage)", async () => {
    const r = await user(U.NEWCO, `INSERT INTO companies (company_name, legal_name, tax_id, company_email, status)
      VALUES ('NewCo', 'NewCo SL', 'B9', 'new@x.test', 'APPROVED') RETURNING id`);
    ok(r);
    NEWID = r.rows?.[0]?.id;
    expect(NEWID).toBeTruthy();
  });

  test('creador: ve su empresa en companies_full sin ser aún miembro (status PENDING por el trigger)', async () => {
    const r = await user(U.NEWCO, `SELECT id, status, tax_id, created_by FROM companies_full`);
    ok(r);
    expect(r.rows).toEqual([{ id: NEWID, status: 'PENDING', tax_id: 'B9', created_by: U.NEWCO }]);
  });

  test('creador: alta como OWNER sigue funcionando', async () => {
    ok(await user(U.NEWCO, `INSERT INTO company_users (company_id, user_id, role) VALUES ($1, $2, 'OWNER')`, [NEWID, U.NEWCO]));
  });

  test('ajeno: no ve la empresa nueva en companies_full', async () => {
    const r = await user(U.OUT, `SELECT * FROM companies_full WHERE id = $1`, [NEWID]);
    ok(r);
    expect(r.rows).toHaveLength(0);
  });

  test('anon: sin INSERT en companies', async () => {
    esDenegado(await anon(`INSERT INTO companies (company_name, legal_name, tax_id, company_email) VALUES ('X', 'X', 'BX', 'x@x.test')`));
  });

  // Admin de la plataforma
  test('admin: companies_full con todas las empresas y columnas', async () => {
    const r = await user(U.ADMIN, `SELECT * FROM companies_full ORDER BY company_name`);
    ok(r);
    expect(r.rows).toHaveLength(3);
    expect(Object.keys(r.rows![0])).toHaveLength(allCols.length);
    expect(r.rows!.some((x) => x.id === PEND && x.company_email === 'pend@x.test')).toBe(true);
  });

  test('admin: count de este mes sobre companies_full (AdminDashboard)', async () => {
    const r = await user(U.ADMIN, `SELECT count(id)::int n FROM companies_full WHERE created_at >= date_trunc('month', now())`);
    ok(r);
    expect(r.rows![0].n).toBe(3);
  });

  test('admin: count total sobre companies.id (AdminDashboard)', async () => {
    const r = await user(U.ADMIN, `SELECT count(id)::int n FROM companies`);
    ok(r);
    expect(r.rows![0].n).toBe(3);
  });

  test('admin: búsqueda por email/CIF + company_users sobre companies_full (CompanyManagementSection)', async () => {
    const r = await user(U.ADMIN, `SELECT c.id, c.status, (SELECT json_agg(cu.*) FROM company_users cu WHERE cu.company_id = c.id) AS company_users
      FROM companies_full c WHERE c.company_name ILIKE '%acme%' OR c.company_email ILIKE '%acme%' OR c.tax_id ILIKE '%acme%'`);
    ok(r);
    expect(r.rows).toHaveLength(1);
    expect(r.rows![0].company_users).toHaveLength(3);
  });

  test('admin: select * de la tabla también da 42501 (el panel usa companies_full)', async () => {
    esDenegado(await user(U.ADMIN, `SELECT * FROM companies`));
  });

  test('service_role (Edge Functions): sigue leyendo todas las columnas de companies', async () => {
    const r = await bd.svc(`SELECT tax_id FROM companies WHERE id = $1`, [ACME]);
    ok(r);
    expect(r.rows![0]?.tax_id).toBe('B1');
  });

  test('service_role sin sub: companies_full sin filas (usa la tabla)', async () => {
    const r = await bd.svc(`SELECT count(*)::int n FROM companies_full`);
    ok(r);
    expect(r.rows![0].n).toBe(0);
  });

  // RPC SECURITY DEFINER de empresa (lee credit_balance como propietario)
  test('RPC publish_job_posting (OWNER) sigue funcionando con las columnas cerradas', async () => {
    ok(await user(U.REC, `SELECT publish_job_posting($1, $2, $3, 30)`, [JOB_DRAFT, ACME, U.REC]));
  });
});
