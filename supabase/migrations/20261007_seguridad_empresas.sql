-- =============================================================================
-- Módulo de empresas: RPC SECURITY DEFINER y políticas RLS sin suplantación
-- =============================================================================
--
-- PROBLEMA (seguridad)
--   Supabase concede EXECUTE por defecto a anon y authenticated en el esquema
--   public y las funciones SECURITY DEFINER ignoran RLS. En el módulo de
--   empresas:
--
--   a) approve_company / reject_company / adjust_company_credits
--      (20251230_create_company_rpc_functions.sql) comprobaban que el admin
--      era `p_admin_id`, un parámetro que manda el cliente. Cualquiera (también
--      anon, sin sesión) podía pasar el id de un admin y aprobar empresas o
--      darse créditos.
--   b) consume_company_credits (vigente: 20251230_credit_consumption_helpers.sql),
--      unlock_profile_for_company, download_cv_for_company,
--      send_initial_company_message (mismo fichero), publish_job_posting y
--      update_application_status (20251230_job_postings_rpc_functions.sql)
--      confiaban en `p_user_id`: bastaba el id de un miembro de una empresa
--      para gastar sus créditos, publicar ofertas o cambiar candidaturas.
--   c) track_job_posting_view (GRANT a anon) atribuía la visita a cualquier
--      `p_profile_id`. get_saved_jobs / is_job_saved
--      (20260106_create_saved_job_postings.sql) devolvían las ofertas guardadas
--      de cualquier perfil. get_activity_stats
--      (20260105_create_user_activity_tracking.sql) daba a cualquiera (anon
--      incluido, comprobado en producción) los registros y logins por día.
--   d) companies: "Anyone can register companies" (20251230_fix_recursion_final.sql:30)
--      WITH CHECK (true): el alta podía llegar ya con status 'APPROVED' y
--      credit_balance arbitrario. Y una política UPDATE de propietario (si
--      existe en la BD) dejaría cambiar status / créditos.
--   e) company_users: "Users can join companies" (user_id = auth.uid()):
--      cualquiera se daba de alta como OWNER de cualquier empresa.
--   f) company_activity_log: "System can insert activity log" WITH CHECK (true)
--      (20251230_create_company_activity_tables.sql:212).
--   g) analytics_views / analytics_clicks / analytics_leads: INSERT abierto
--      (creado desde el dashboard, ver 20260730_analytics_rls_and_manager_access.sql):
--      se podían inflar visitas/clics/leads de cualquier id, también de
--      perfiles no publicados.
--   h) La RPC `increment(row_id, table_name, column_name)` que llamaba
--      components/pages/JobDetailPage.tsx no está en las migraciones, pero
--      EXISTE en producción y anon puede ejecutarla (GET /rpc/increment con una
--      tabla inexistente responde 42P01 "relation public.<tabla> does not
--      exist": compone el nombre de tabla dinámicamente).
--   Además, revisando esas mismas funciones y tablas:
--   i) job_postings: un miembro podía crear la oferta ya en 'PUBLISHED' o
--      pasarla de 'DRAFT' a 'PUBLISHED' con un UPDATE directo (o poner
--      credits_cost = 0) y saltarse el cobro de publish_job_posting.
--   j) company_profile_views ("Company members can insert profile views") y
--      company_conversations (company_conversations_insert_policy) admitían
--      INSERT directo: desbloquear un perfil o abrir conversación sin pagar.
--   k) company_conversations / company_messages: las políticas del lado del
--      candidato (profiles_*_policy, 20251230_create_company_messages.sql)
--      solo comprobaban que el perfil existiera y fuera visible. Con perfiles
--      públicos eso es "cualquiera, también anon": leer las conversaciones de
--      empresas con candidatos y escribir mensajes como si fuera el candidato.
--   Y tres fallos funcionales en las RPC que se recrean aquí (comprobados con
--   GET contra el esquema de producción): unlock_profile_for_company insertaba
--   company_profile_views.credits_used, send_initial_company_message insertaba
--   company_contacts.contact_type / contacted_by / credits_used y
--   download_cv_for_company company_exports.profile_id / format / exported_by:
--   esas columnas no existen, así que desbloquear un perfil o abrir una
--   conversación fallaba siempre. Además company_conversations.company_user_id
--   referencia company_users(id) y se le pasaba el id de auth.
--
-- QUÉ HACE
--   0. Helpers (SECURITY DEFINER, SET search_path = public):
--        current_user_is_admin() .......... misma definición que
--                                           20261005_proteger_datos_profiles.sql.
--        assert_caller_is_admin() ......... 42501 'NOT_ADMIN' salvo admin,
--                                           service_role o conexión sin JWT.
--        is_company_member(empresa, roles)  auth.uid() es miembro (con rol).
--        company_owner_signup_allowed(empresa)  auth.uid() creó la empresa y
--                                           aún no tiene miembros.
--        company_users_insert_allowed(...)  reglas de alta en company_users.
--        is_public_profile(perfil) ........ perfil publicado (mismo criterio
--                                           que la política de profiles:
--                                           slug, no oculto, no suspendido).
--      Se reutiliza assert_caller_matches_user (20261005_rpc_validar_usuario.sql).
--   1. companies:
--        - columna created_by (auth.uid() de quien registra; NULL en las antiguas).
--        - trigger BEFORE INSERT OR UPDATE trg_companies_proteger_campos
--          (SECURITY INVOKER a propósito: mira current_user, que dentro de
--          las RPC SECURITY DEFINER es su propietario y no 'authenticated'):
--            INSERT de anon/authenticated no admin: status 'PENDING' (lo que
--              ya manda CompanyRegistrationPage), credit_balance 0,
--              total_credits_* 0, verified_at/verified_by/rejection_reason/
--              admin_notes NULL, created_by = auth.uid().
--            UPDATE de anon/authenticated no admin: 42501 'PROTECTED_FIELD'
--              si cambia status, créditos, verificación, notas o created_by.
--          Pasan: admins, service_role, conexiones sin JWT y las RPC SECURITY
--          DEFINER (approve_company, consume_company_credits, publish_job_posting...).
--        - política SELECT "Miembros y creador ven su empresa": el registro
--          hace insert().select() y el panel de empresa lee su fila; en las
--          migraciones solo quedaban admin y empresas APPROVED.
--   2. company_users: se borran TODAS las políticas INSERT (NOTICE con su
--      definición) y se crean una permisiva y otra RESTRICTIVE (para acotar
--      también las FOR ALL que pudiera haber) con company_users_insert_allowed:
--        - admin: sí.
--        - alta como OWNER de sí mismo: solo quien creó la empresa
--          (companies.created_by) y si no tiene miembros (flujo de registro).
--        - el resto: OWNER/ADMIN de esa empresa, invited_by NULL o él mismo;
--          solo un OWNER puede dar de alta a otro OWNER
--          (CompanyTeamPage invita como ADMIN / MEMBER / VIEWER).
--   3. company_activity_log: se borran las políticas INSERT y se crea
--      "Miembros registran actividad de su empresa": miembro de company_id y
--      user_id NULL o auth.uid() (o admin). Los triggers SECURITY DEFINER no
--      pasan por RLS.
--   4. company_profile_views / company_conversations: sin INSERT directo; se
--      crean solo desde unlock_profile_for_company / send_initial_company_message.
--      company_conversations y company_messages del lado del candidato: solo
--      el propio perfil (o su gestor) lee y responde; marcar como leído, solo
--      miembros de la empresa o el candidato, y un trigger
--      (trg_company_messages_solo_marcar_leido) impide cambiar por UPDATE algo
--      que no sea is_read / read_at. Del lado de la empresa las políticas se
--      recrean explícitas con is_company_member (TO authenticated) y el
--      sender_id de un mensaje de empresa tiene que ser el company_users.id
--      de quien escribe. company_message_credits: sin INSERT directo.
--   5. job_postings: trigger BEFORE INSERT OR UPDATE trg_job_postings_proteger_publicacion
--      (misma lógica de confianza que el de companies). anon/authenticated no
--      admin: no pueden crear la oferta en 'PUBLISHED' ni pasarla a
--      'PUBLISHED' si nunca se publicó (published_at NULL); no cambian
--      credits_cost (30 al crear), published_at, views_count ni
--      applications_count. Volver a PUBLISHED sin pagar solo desde PAUSED con
--      published_at (reanudar, JobPostingsManagementPage); desde DRAFT /
--      CLOSED / EXPIRED hay que pasar por publish_job_posting.
--   6. analytics_*: política RESTRICTIVE de INSERT (se suma a la que haya):
--      profile_id de un perfil publicado y, si la tabla tiene viewer_id (en
--      producción hoy no), viewer_id NULL o auth.uid(). La visita anónima al
--      CV público (hooks/useAnalytics.ts) sigue funcionando.
--   7. RPC recreadas con SET search_path = public:
--        approve_company / reject_company / adjust_company_credits: MISMA
--          firma; p_admin_id se IGNORA (se mantiene para no romper llamadas):
--          admin = assert_caller_is_admin(); verified_by / created_by =
--          auth.uid() (o p_admin_id solo en contextos de confianza sin uid).
--        consume_company_credits: assert_caller_matches_user(p_user_id) +
--          mismo cuerpo. Solo interna (la llaman las RPC de abajo): sin
--          EXECUTE para anon ni authenticated.
--        unlock_profile_for_company / download_cv_for_company /
--          send_initial_company_message: assert_caller_matches_user +
--          miembro de la empresa SIEMPRE (antes solo al cobrar), y columnas
--          reales de company_profile_views / company_contacts /
--          company_exports (el coste va en metadata). p_credit_cost se ignora:
--          se registra lo cobrado de verdad. Mensajes y conversación usan el
--          id de company_users (como CompanyMessagesPage y la FK).
--        publish_job_posting / update_application_status:
--          assert_caller_matches_user(p_user_id) + mismo cuerpo.
--        track_job_posting_view: MISMA firma; p_profile_id se IGNORA, el
--          perfil es auth.uid() (NULL si anónimo o sin fila en profiles); una
--          visita por usuario autenticado y día. Sigue concedida a anon.
--        get_saved_jobs / is_job_saved: solo el propio perfil o su gestor
--          (assert_caller_matches_user(p_profile_id, false, true)).
--        get_activity_stats: solo admin.
--        Todas: REVOKE EXECUTE FROM PUBLIC, anon (salvo track_job_posting_view).
--      Los errores de autorización salen con SQLSTATE 42501 (PostgREST -> 403).
--   8. increment: REVOKE EXECUTE a PUBLIC, anon y authenticated en todas sus
--      sobrecargas (si existe). El frontend ya no la usa: JobDetailPage llama
--      a track_job_posting_view. Para eliminarla del todo, en el SQL editor:
--        select oid::regprocedure, prosecdef, proacl
--          from pg_proc where proname = 'increment'
--           and pronamespace = 'public'::regnamespace;
--        -- revisar que nada más la usa y, por cada fila:
--        drop function public.increment(<firma que salga arriba>);
--
--   Quién llama a estas RPC hoy (todas con el id del usuario de la sesión):
--     components/admin/CompanyManagementSection.tsx (approve/reject),
--     components/company/CompanyProfileViewPage.tsx (unlock, send message),
--     components/company/JobPostingsManagementPage.tsx (publish),
--     components/company/JobApplicationsPage.tsx (update_application_status),
--     components/dashboard/opportunities/SavedJobsTab.tsx (get_saved_jobs con
--       el perfil del dashboard: propio o gestionado),
--     components/pages/JobDetailPage.tsx (track_job_posting_view).
--     adjust_company_credits, download_cv_for_company, is_job_saved,
--     get_activity_stats: sin llamadas en el repo.
--
--   NO resuelve (queda anotado):
--     - CreditsManagementPage "compra" créditos con un UPDATE directo de
--       companies.credit_balance (simulación sin pasarela). Ahora da 42501:
--       comprar créditos tiene que ir por Stripe + webhook (service_role).
--     - Las inserciones de company_activity_log del frontend mandan
--       `created_by`, columna que no existe (fallaban ya antes, en silencio).
--     - "Public can view approved companies basic info" expone a anon todas
--       las columnas de las empresas APPROVED (signup_ip, admin_notes, URLs de
--       documentos...). Cerrarlo exige seleccionar columnas en el frontend.
--
-- ORDEN DE DESPLIEGUE
--   1. Antes: 20261005_rpc_validar_usuario.sql (assert_caller_matches_user) y
--      20261005_proteger_datos_profiles.sql. Esta migración aborta si falta el
--      helper.
--   2. Esta migración. Es compatible con el frontend actual salvo la llamada
--      a `increment` de JobDetailPage (que deja de contar visitas: no rompe
--      nada) y la compra simulada de créditos.
--   3. Frontend (JobDetailPage usa track_job_posting_view; mensajes de error
--      403 en las pantallas de empresa).
--
-- CÓMO REVERTIR (NO recomendado: reabre los agujeros)
--   DROP TRIGGER IF EXISTS trg_companies_proteger_campos ON public.companies;
--   DROP TRIGGER IF EXISTS trg_job_postings_proteger_publicacion ON public.job_postings;
--   DROP FUNCTION IF EXISTS public.companies_proteger_campos();
--   DROP FUNCTION IF EXISTS public.job_postings_proteger_publicacion();
--   DROP TRIGGER IF EXISTS trg_company_messages_solo_marcar_leido ON public.company_messages;
--   DROP FUNCTION IF EXISTS public.company_messages_solo_marcar_leido();
--   DROP POLICY IF EXISTS "Miembros y creador ven su empresa" ON public.companies;
--   DROP POLICY IF EXISTS "Altas en company_users" ON public.company_users;
--   DROP POLICY IF EXISTS "Altas en company_users (restrictiva)" ON public.company_users;
--   CREATE POLICY "Users can join companies" ON public.company_users
--     FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
--   DROP POLICY IF EXISTS "Miembros registran actividad de su empresa" ON public.company_activity_log;
--   CREATE POLICY "System can insert activity log" ON public.company_activity_log
--     FOR INSERT TO authenticated WITH CHECK (true);
--   DROP POLICY IF EXISTS "Insercion coherente" ON public.analytics_views;   (y clicks, leads)
--   Políticas de company_profile_views / company_conversations / company_messages /
--   company_message_credits:
--     volver a ejecutar sus CREATE POLICY de 20251230_create_company_activity_tables.sql
--     y 20251230_create_company_messages.sql.
--   RPC: volver a ejecutar 20251230_create_company_rpc_functions.sql,
--     20251230_credit_consumption_helpers.sql, 20251230_job_postings_rpc_functions.sql,
--     20260106_create_saved_job_postings.sql y la función de
--     20260105_create_user_activity_tracking.sql, con sus GRANT.
--   increment: GRANT EXECUTE ON FUNCTION public.increment(<firma>) TO anon, authenticated;
--   La columna companies.created_by puede quedarse (no molesta).
--
-- Idempotente: se puede ejecutar varias veces.
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.assert_caller_matches_user(uuid, boolean, boolean)') IS NULL THEN
    RAISE EXCEPTION 'Falta public.assert_caller_matches_user: aplicar antes 20261005_rpc_validar_usuario.sql';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 0. Helpers
-- -----------------------------------------------------------------------------

-- Misma definición que 20261005_proteger_datos_profiles.sql (no depender del orden)
CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT lower(p.role) = 'admin' FROM public.profiles p WHERE p.id = auth.uid()),
    false
  );
$$;
REVOKE ALL ON FUNCTION public.current_user_is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_is_admin() TO authenticated, service_role;

-- Admin, service_role o conexión sin JWT (SQL editor, cron). Mismo criterio de
-- confianza que assert_caller_matches_user.
CREATE OR REPLACE FUNCTION public.assert_caller_is_admin()
RETURNS void
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := COALESCE(auth.role(), '');
BEGIN
  IF v_role NOT IN ('anon', 'authenticated') THEN
    RETURN;
  END IF;
  IF v_role = 'authenticated' AND public.current_user_is_admin() THEN
    RETURN;
  END IF;
  RAISE EXCEPTION 'NOT_ADMIN: solo un administrador puede hacer esto'
    USING ERRCODE = '42501';
END;
$$;
REVOKE ALL ON FUNCTION public.assert_caller_is_admin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assert_caller_is_admin() TO service_role;

COMMENT ON FUNCTION public.assert_caller_is_admin() IS
'Interna. Lanza 42501 NOT_ADMIN si el JWT es anon o authenticated sin role admin. service_role y conexiones sin JWT pasan.';

-- companies.created_by (lo necesitan los helpers de abajo)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.companies.created_by IS
'Usuario que registró la empresa (lo fija el trigger trg_companies_proteger_campos). NULL en empresas anteriores a 2026-10.';

CREATE OR REPLACE FUNCTION public.is_company_member(p_company_id uuid, p_roles text[] DEFAULT NULL)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = p_company_id
      AND cu.user_id = auth.uid()
      AND (p_roles IS NULL OR cu.role = ANY (p_roles))
  );
$$;
REVOKE ALL ON FUNCTION public.is_company_member(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_member(uuid, text[]) TO authenticated, service_role;

COMMENT ON FUNCTION public.is_company_member(uuid, text[]) IS
'true si auth.uid() es miembro de la empresa (y, si se indica, con uno de esos roles). Sin recursión de RLS.';

CREATE OR REPLACE FUNCTION public.company_owner_signup_allowed(p_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.companies c
       WHERE c.id = p_company_id AND c.created_by = auth.uid()
     )
     AND NOT EXISTS (
       SELECT 1 FROM public.company_users cu WHERE cu.company_id = p_company_id
     );
$$;
REVOKE ALL ON FUNCTION public.company_owner_signup_allowed(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_owner_signup_allowed(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.company_users_insert_allowed(
  p_company_id uuid,
  p_user_id uuid,
  p_role text,
  p_invited_by uuid
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN false;
  END IF;

  IF public.current_user_is_admin() THEN
    RETURN true;
  END IF;

  -- Registro: quien creó la empresa se da de alta como OWNER (primer miembro)
  IF p_user_id = v_uid
     AND p_role = 'OWNER'
     AND (p_invited_by IS NULL OR p_invited_by = v_uid)
     AND public.company_owner_signup_allowed(p_company_id) THEN
    RETURN true;
  END IF;

  -- Invitaciones: OWNER/ADMIN de la empresa, firmadas por él mismo
  IF p_invited_by IS NOT NULL AND p_invited_by <> v_uid THEN
    RETURN false;
  END IF;
  IF p_role = 'OWNER' THEN
    RETURN public.is_company_member(p_company_id, ARRAY['OWNER']);
  END IF;
  RETURN public.is_company_member(p_company_id, ARRAY['OWNER', 'ADMIN']);
END;
$$;
REVOKE ALL ON FUNCTION public.company_users_insert_allowed(uuid, uuid, text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_users_insert_allowed(uuid, uuid, text, uuid) TO authenticated, service_role;

-- Perfil publicado: mismo criterio que "Perfiles publicados visibles para todos"
CREATE OR REPLACE FUNCTION public.is_public_profile(p_profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = p_profile_id
      AND p.slug IS NOT NULL
      AND p.profile_hidden IS NOT TRUE
      AND p.is_active IS NOT FALSE
  );
$$;
REVOKE ALL ON FUNCTION public.is_public_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_public_profile(uuid) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.is_public_profile(uuid) IS
'true si el perfil está publicado (slug, no oculto, no suspendido). Solo dice sí/no.';

-- -----------------------------------------------------------------------------
-- 1. companies
-- -----------------------------------------------------------------------------
-- SECURITY INVOKER a propósito: current_user es 'authenticated'/'anon' en una
-- escritura directa por PostgREST y el propietario dentro de una RPC SECURITY
-- DEFINER (que ya valida a quien llama).
CREATE OR REPLACE FUNCTION public.companies_proteger_campos()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF current_user = 'authenticated' AND public.current_user_is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.status := 'PENDING';
    NEW.credit_balance := 0;
    NEW.total_credits_purchased := 0;
    NEW.total_credits_used := 0;
    NEW.verified_at := NULL;
    NEW.verified_by := NULL;
    NEW.rejection_reason := NULL;
    NEW.admin_notes := NULL;
    NEW.created_by := auth.uid();
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status
     OR NEW.verified_at IS DISTINCT FROM OLD.verified_at
     OR NEW.verified_by IS DISTINCT FROM OLD.verified_by
     OR NEW.rejection_reason IS DISTINCT FROM OLD.rejection_reason
     OR NEW.admin_notes IS DISTINCT FROM OLD.admin_notes THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: el estado y la verificación de la empresa solo los cambia un admin'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.credit_balance IS DISTINCT FROM OLD.credit_balance
     OR NEW.total_credits_purchased IS DISTINCT FROM OLD.total_credits_purchased
     OR NEW.total_credits_used IS DISTINCT FROM OLD.total_credits_used THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: los créditos solo cambian por compra verificada, consumo o ajuste de un admin'
      USING ERRCODE = '42501';
  END IF;
  IF NEW.created_by IS DISTINCT FROM OLD.created_by THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: created_by no se puede cambiar' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.companies_proteger_campos() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_companies_proteger_campos ON public.companies;
CREATE TRIGGER trg_companies_proteger_campos
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.companies_proteger_campos();

DROP POLICY IF EXISTS "Miembros y creador ven su empresa" ON public.companies;
CREATE POLICY "Miembros y creador ven su empresa"
  ON public.companies FOR SELECT
  TO authenticated
  USING (created_by = auth.uid() OR public.is_company_member(id));

-- -----------------------------------------------------------------------------
-- 2. company_users: altas
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, permissive, roles::text AS roles, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_users' AND cmd = 'INSERT'
      AND policyname NOT IN ('Altas en company_users', 'Altas en company_users (restrictiva)')
  LOOP
    RAISE NOTICE 'company_users: se elimina la política INSERT "%" (%, roles %, WITH CHECK %)',
      r.policyname, r.permissive, r.roles, r.with_check;
    EXECUTE format('DROP POLICY %I ON public.company_users', r.policyname);
  END LOOP;

  FOR r IN
    SELECT policyname, roles::text AS roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_users' AND cmd = 'ALL'
  LOOP
    RAISE NOTICE 'company_users: política FOR ALL "%" (roles %, USING %, WITH CHECK %): sus INSERT quedan acotados por la política restrictiva',
      r.policyname, r.roles, r.qual, r.with_check;
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Altas en company_users" ON public.company_users;
CREATE POLICY "Altas en company_users"
  ON public.company_users FOR INSERT
  TO authenticated
  WITH CHECK (public.company_users_insert_allowed(company_id, user_id, role, invited_by));

DROP POLICY IF EXISTS "Altas en company_users (restrictiva)" ON public.company_users;
CREATE POLICY "Altas en company_users (restrictiva)"
  ON public.company_users AS RESTRICTIVE FOR INSERT
  TO authenticated
  WITH CHECK (public.company_users_insert_allowed(company_id, user_id, role, invited_by));

-- -----------------------------------------------------------------------------
-- 3. company_activity_log
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, roles::text AS roles, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'company_activity_log' AND cmd = 'INSERT'
      AND policyname <> 'Miembros registran actividad de su empresa'
  LOOP
    RAISE NOTICE 'company_activity_log: se elimina la política INSERT "%" (roles %, WITH CHECK %)',
      r.policyname, r.roles, r.with_check;
    EXECUTE format('DROP POLICY %I ON public.company_activity_log', r.policyname);
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Miembros registran actividad de su empresa" ON public.company_activity_log;
CREATE POLICY "Miembros registran actividad de su empresa"
  ON public.company_activity_log FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.is_company_member(company_id) AND (user_id IS NULL OR user_id = auth.uid()))
    OR public.current_user_is_admin()
  );

-- -----------------------------------------------------------------------------
-- 4. Desbloqueos, conversaciones y mensajes
-- -----------------------------------------------------------------------------
-- Desbloquear un perfil o abrir conversación solo a través de las RPC que cobran.
DROP POLICY IF EXISTS "Company members can insert profile views" ON public.company_profile_views;
DROP POLICY IF EXISTS company_conversations_insert_policy ON public.company_conversations;

-- Lado del candidato: solo su propio perfil (o el gestor del perfil).
DROP POLICY IF EXISTS profiles_conversations_select_policy ON public.company_conversations;
CREATE POLICY profiles_conversations_select_policy
  ON public.company_conversations FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid() OR public.is_managed_profile(profile_id));

DROP POLICY IF EXISTS profiles_messages_select_policy ON public.company_messages;
CREATE POLICY profiles_messages_select_policy
  ON public.company_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_conversations cc
      WHERE cc.id = company_messages.conversation_id
        AND (cc.profile_id = auth.uid() OR public.is_managed_profile(cc.profile_id))
    )
  );

DROP POLICY IF EXISTS profiles_messages_insert_policy ON public.company_messages;
CREATE POLICY profiles_messages_insert_policy
  ON public.company_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_type = 'talent'
    AND EXISTS (
      SELECT 1 FROM public.company_conversations cc
      WHERE cc.id = company_messages.conversation_id
        AND cc.profile_id = company_messages.sender_id
        AND (cc.profile_id = auth.uid() OR public.is_managed_profile(cc.profile_id))
    )
  );

DROP POLICY IF EXISTS messages_update_read_policy ON public.company_messages;
CREATE POLICY messages_update_read_policy
  ON public.company_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_conversations cc
      WHERE cc.id = company_messages.conversation_id
        AND (
          public.is_company_member(cc.company_id)
          OR cc.profile_id = auth.uid()
          OR public.is_managed_profile(cc.profile_id)
        )
    )
  );

-- Lado de la empresa: las políticas originales solo comprobaban que la empresa
-- tuviera miembros (EXISTS company_users ... sin user_id = auth.uid()) y no
-- llevaban TO. Hoy las acota la RLS de company_users ("Users can view own
-- memberships"), pero cualquier política SELECT más amplia en company_users las
-- abriría. Se recrean explícitas: solo miembros de la empresa.
DROP POLICY IF EXISTS company_conversations_select_policy ON public.company_conversations;
CREATE POLICY company_conversations_select_policy
  ON public.company_conversations FOR SELECT
  TO authenticated
  USING (public.is_company_member(company_id));

DROP POLICY IF EXISTS company_conversations_update_policy ON public.company_conversations;
CREATE POLICY company_conversations_update_policy
  ON public.company_conversations FOR UPDATE
  TO authenticated
  USING (public.is_company_member(company_id))
  WITH CHECK (public.is_company_member(company_id));

DROP POLICY IF EXISTS company_messages_select_policy ON public.company_messages;
CREATE POLICY company_messages_select_policy
  ON public.company_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.company_conversations cc
      WHERE cc.id = company_messages.conversation_id
        AND public.is_company_member(cc.company_id)
    )
  );

-- sender_id del lado empresa = company_users.id del que escribe (como
-- CompanyMessagesPage y send_initial_company_message).
DROP POLICY IF EXISTS company_messages_insert_policy ON public.company_messages;
CREATE POLICY company_messages_insert_policy
  ON public.company_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_type = 'company'
    AND EXISTS (
      SELECT 1
      FROM public.company_conversations cc
      JOIN public.company_users cu ON cu.company_id = cc.company_id
      WHERE cc.id = company_messages.conversation_id
        AND cu.user_id = auth.uid()
        AND cu.id = company_messages.sender_id
    )
  );

DO $$
BEGIN
  IF to_regclass('public.company_message_credits') IS NOT NULL THEN
    DROP POLICY IF EXISTS company_message_credits_select_policy ON public.company_message_credits;
    CREATE POLICY company_message_credits_select_policy
      ON public.company_message_credits FOR SELECT
      TO authenticated
      USING (public.is_company_member(company_id));
    -- Sin INSERT directo: no lo usa el frontend.
    DROP POLICY IF EXISTS company_message_credits_insert_policy ON public.company_message_credits;
  END IF;
END $$;

-- La política UPDATE de company_messages existe para marcar como leído: un
-- trigger impide que, por esa vía, se cambie el texto, el remitente o la
-- conversación de un mensaje (anon/authenticated no admin).
CREATE OR REPLACE FUNCTION public.company_messages_solo_marcar_leido()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF current_user = 'authenticated' AND public.current_user_is_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.message IS DISTINCT FROM OLD.message
     OR NEW.sender_type IS DISTINCT FROM OLD.sender_type
     OR NEW.sender_id IS DISTINCT FROM OLD.sender_id
     OR NEW.conversation_id IS DISTINCT FROM OLD.conversation_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.attachments IS DISTINCT FROM OLD.attachments THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: de un mensaje solo se puede cambiar is_read / read_at'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.company_messages_solo_marcar_leido() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_company_messages_solo_marcar_leido ON public.company_messages;
CREATE TRIGGER trg_company_messages_solo_marcar_leido
  BEFORE UPDATE ON public.company_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.company_messages_solo_marcar_leido();

-- -----------------------------------------------------------------------------
-- 5. job_postings: publicar solo pagando
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.job_postings_proteger_publicacion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF current_user = 'authenticated' AND public.current_user_is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'PUBLISHED' THEN
      RAISE EXCEPTION 'PUBLISH_REQUIRES_CREDITS: crea la oferta como borrador y publícala con publish_job_posting'
        USING ERRCODE = '42501';
    END IF;
    NEW.published_at := NULL;
    NEW.views_count := 0;
    NEW.applications_count := 0;
    NEW.credits_cost := 30;
    RETURN NEW;
  END IF;

  IF NEW.credits_cost IS DISTINCT FROM OLD.credits_cost
     OR NEW.published_at IS DISTINCT FROM OLD.published_at
     OR NEW.views_count IS DISTINCT FROM OLD.views_count
     OR NEW.applications_count IS DISTINCT FROM OLD.applications_count THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: coste, fecha de publicación y contadores de la oferta no se editan'
      USING ERRCODE = '42501';
  END IF;
  -- Volver a PUBLISHED sin pagar solo para reanudar una oferta pausada que ya
  -- se pagó. Desde DRAFT / CLOSED / EXPIRED (p. ej. tras reescribirla en el
  -- editor, que la deja en DRAFT) hay que pasar por publish_job_posting.
  IF NEW.status = 'PUBLISHED'
     AND OLD.status IS DISTINCT FROM 'PUBLISHED'
     AND NOT (OLD.status = 'PAUSED' AND OLD.published_at IS NOT NULL) THEN
    RAISE EXCEPTION 'PUBLISH_REQUIRES_CREDITS: publica la oferta con publish_job_posting'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.job_postings_proteger_publicacion() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_postings_proteger_publicacion ON public.job_postings;
CREATE TRIGGER trg_job_postings_proteger_publicacion
  BEFORE INSERT OR UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.job_postings_proteger_publicacion();

-- -----------------------------------------------------------------------------
-- 6. analytics_*: inserciones coherentes
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  v_check text;
BEGIN
  FOREACH t IN ARRAY ARRAY['analytics_views', 'analytics_clicks', 'analytics_leads'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      RAISE NOTICE '% no existe: se omite', t;
      CONTINUE;
    END IF;
    v_check := 'public.is_public_profile(profile_id)';
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = t AND column_name = 'viewer_id'
    ) THEN
      v_check := v_check || ' AND (viewer_id IS NULL OR viewer_id = auth.uid())';
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Insercion coherente', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR INSERT TO anon, authenticated WITH CHECK (%s)',
      'Insercion coherente', t, v_check);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 7. RPC
-- -----------------------------------------------------------------------------

-- approve_company: p_admin_id se ignora (se mantiene la firma)
CREATE OR REPLACE FUNCTION public.approve_company(
    p_company_id UUID,
    p_admin_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin UUID := COALESCE(auth.uid(), p_admin_id);
    v_company_email VARCHAR(255);
    v_company_name VARCHAR(255);
BEGIN
    PERFORM public.assert_caller_is_admin();

    UPDATE public.companies
    SET
        status = 'APPROVED',
        verified_at = NOW(),
        verified_by = v_admin,
        admin_notes = COALESCE(p_notes, admin_notes)
    WHERE id = p_company_id
    RETURNING company_email, company_name INTO v_company_email, v_company_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found';
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'company_id', p_company_id,
        'company_email', v_company_email,
        'company_name', v_company_name
    );
END;
$$;

-- reject_company: p_admin_id se ignora
CREATE OR REPLACE FUNCTION public.reject_company(
    p_company_id UUID,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin UUID := COALESCE(auth.uid(), p_admin_id);
    v_company_email VARCHAR(255);
    v_company_name VARCHAR(255);
BEGIN
    PERFORM public.assert_caller_is_admin();

    IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) = 0 THEN
        RAISE EXCEPTION 'Rejection reason is required';
    END IF;

    UPDATE public.companies
    SET
        status = 'REJECTED',
        verified_at = NOW(),
        verified_by = v_admin,
        rejection_reason = p_reason
    WHERE id = p_company_id
    RETURNING company_email, company_name INTO v_company_email, v_company_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found';
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'company_id', p_company_id,
        'company_email', v_company_email,
        'company_name', v_company_name,
        'reason', p_reason
    );
END;
$$;

-- adjust_company_credits: p_admin_id se ignora
CREATE OR REPLACE FUNCTION public.adjust_company_credits(
    p_company_id UUID,
    p_admin_id UUID,
    p_amount INTEGER,
    p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin UUID := COALESCE(auth.uid(), p_admin_id);
    v_new_balance INTEGER;
BEGIN
    PERFORM public.assert_caller_is_admin();

    UPDATE public.companies
    SET
        credit_balance = credit_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_company_id
    RETURNING credit_balance INTO v_new_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found';
    END IF;

    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits: Cannot result in negative balance';
    END IF;

    INSERT INTO public.company_credits_history (
        company_id, amount, balance_after, transaction_type,
        description, created_by
    ) VALUES (
        p_company_id, p_amount, v_new_balance, 'ADMIN_ADJUSTMENT',
        p_description, v_admin
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'company_id', p_company_id,
        'new_balance', v_new_balance,
        'amount_adjusted', p_amount
    );
END;
$$;

-- consume_company_credits (cuerpo vigente: 20251230_credit_consumption_helpers.sql)
CREATE OR REPLACE FUNCTION public.consume_company_credits(
    p_company_id UUID,
    p_user_id UUID,
    p_action_type VARCHAR(50),
    p_profile_id UUID DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_credits_required INTEGER;
    v_new_balance INTEGER;
    v_company_status VARCHAR(50);
    v_current_balance INTEGER;
BEGIN
    PERFORM public.assert_caller_matches_user(p_user_id);

    IF NOT EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_id = p_company_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not a member of this company'
            USING ERRCODE = '42501';
    END IF;

    CASE p_action_type
        WHEN 'PROFILE_UNLOCK' THEN v_credits_required := 5;
        WHEN 'PROFILE_CONTACT' THEN v_credits_required := 3;
        WHEN 'CV_DOWNLOAD' THEN v_credits_required := 5;
        WHEN 'PROFILE_VIEW' THEN v_credits_required := 0;
        ELSE v_credits_required := 1;
    END CASE;

    UPDATE public.companies
    SET
        credit_balance = credit_balance - v_credits_required,
        total_credits_used = total_credits_used + v_credits_required,
        updated_at = NOW()
    WHERE id = p_company_id
        AND credit_balance >= v_credits_required
        AND status = 'APPROVED'
    RETURNING credit_balance INTO v_new_balance;

    IF NOT FOUND THEN
        SELECT status, credit_balance INTO v_company_status, v_current_balance
        FROM public.companies WHERE id = p_company_id;

        IF v_company_status != 'APPROVED' THEN
            RAISE EXCEPTION 'Company is not approved (status: %)', v_company_status;
        ELSIF v_current_balance < v_credits_required THEN
            RAISE EXCEPTION 'Insufficient credits: Need %, have %', v_credits_required, v_current_balance;
        ELSE
            RAISE EXCEPTION 'Company not found';
        END IF;
    END IF;

    INSERT INTO public.company_credits_history (
        company_id, amount, balance_after, transaction_type,
        reference_id, description, created_by
    ) VALUES (
        p_company_id, -v_credits_required, v_new_balance, p_action_type,
        p_reference_id,
        format('Action: %s on profile %s', p_action_type, COALESCE(p_profile_id::TEXT, 'N/A')),
        p_user_id
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'credits_consumed', v_credits_required,
        'new_balance', v_new_balance
    );
END;
$$;

-- unlock_profile_for_company: columnas reales de company_profile_views
CREATE OR REPLACE FUNCTION public.unlock_profile_for_company(
  p_company_id UUID,
  p_profile_id UUID,
  p_credit_cost INTEGER,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charge JSONB;
  v_consumed INTEGER;
BEGIN
  PERFORM public.assert_caller_matches_user(p_user_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_id = p_company_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not a member of this company'
      USING ERRCODE = '42501';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.company_profile_views
    WHERE company_id = p_company_id AND profile_id = p_profile_id
  ) THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'Profile already unlocked',
      'credits_consumed', 0
    );
  END IF;

  v_charge := public.consume_company_credits(p_company_id, p_user_id, 'PROFILE_UNLOCK', p_profile_id, NULL);
  v_consumed := (v_charge ->> 'credits_consumed')::INTEGER;

  -- UNIQUE (company_id, profile_id): si dos peticiones compiten, la segunda
  -- falla aquí y se deshace también su cobro.
  INSERT INTO public.company_profile_views (company_id, profile_id, viewed_by, metadata)
  VALUES (p_company_id, p_profile_id, p_user_id, jsonb_build_object('credits_used', v_consumed));

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Profile unlocked successfully',
    'credits_consumed', v_consumed,
    'new_balance', (v_charge ->> 'new_balance')::INTEGER
  );
END;
$$;

-- download_cv_for_company: columnas reales de company_exports
CREATE OR REPLACE FUNCTION public.download_cv_for_company(
  p_company_id UUID,
  p_profile_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_downloaded BOOLEAN;
  v_charge JSONB;
  v_consumed INTEGER := 0;
  v_new_balance INTEGER;
BEGIN
  PERFORM public.assert_caller_matches_user(p_user_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_id = p_company_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not a member of this company'
      USING ERRCODE = '42501';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.company_exports
    WHERE company_id = p_company_id
      AND metadata ->> 'kind' = 'cv_download'
      AND metadata ->> 'profile_id' = p_profile_id::TEXT
  ) INTO v_already_downloaded;

  IF NOT v_already_downloaded THEN
    v_charge := public.consume_company_credits(p_company_id, p_user_id, 'CV_DOWNLOAD', p_profile_id, NULL);
    v_consumed := (v_charge ->> 'credits_consumed')::INTEGER;
  END IF;

  INSERT INTO public.company_exports (
    company_id, created_by, export_type, profile_count, status, completed_at, metadata
  ) VALUES (
    p_company_id, p_user_id, 'PDF', 1, 'COMPLETED', NOW(),
    jsonb_build_object('kind', 'cv_download', 'profile_id', p_profile_id, 'credits_used', v_consumed)
  );

  SELECT credit_balance INTO v_new_balance FROM public.companies WHERE id = p_company_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', CASE
      WHEN v_already_downloaded THEN 'CV downloaded (free - already downloaded before)'
      ELSE 'CV downloaded successfully'
    END,
    'credits_consumed', v_consumed,
    'new_balance', v_new_balance
  );
END;
$$;

-- send_initial_company_message: columnas reales y company_users.id
CREATE OR REPLACE FUNCTION public.send_initial_company_message(
  p_company_id UUID,
  p_profile_id UUID,
  p_subject TEXT,
  p_message TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company_user_id UUID;
  v_conversation_id UUID;
  v_message_id UUID;
  v_is_new_conversation BOOLEAN;
  v_charge JSONB;
  v_consumed INTEGER := 0;
  v_new_balance INTEGER;
BEGIN
  PERFORM public.assert_caller_matches_user(p_user_id);

  SELECT id INTO v_company_user_id
  FROM public.company_users
  WHERE company_id = p_company_id AND user_id = p_user_id;

  IF v_company_user_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: User is not a member of this company'
      USING ERRCODE = '42501';
  END IF;

  SELECT id INTO v_conversation_id
  FROM public.company_conversations
  WHERE company_id = p_company_id AND profile_id = p_profile_id;

  v_is_new_conversation := (v_conversation_id IS NULL);

  IF v_is_new_conversation THEN
    v_charge := public.consume_company_credits(p_company_id, p_user_id, 'PROFILE_CONTACT', p_profile_id, NULL);
    v_consumed := (v_charge ->> 'credits_consumed')::INTEGER;

    INSERT INTO public.company_conversations (
      company_id, profile_id, subject, company_user_id, credits_used
    ) VALUES (
      p_company_id, p_profile_id, p_subject, v_company_user_id, v_consumed
    ) RETURNING id INTO v_conversation_id;

    INSERT INTO public.company_contacts (
      company_id, profile_id, sent_by, message, metadata
    ) VALUES (
      p_company_id, p_profile_id, p_user_id, p_message,
      jsonb_build_object('credits_used', v_consumed, 'conversation_id', v_conversation_id)
    );
  END IF;

  INSERT INTO public.company_messages (
    conversation_id, sender_type, sender_id, message
  ) VALUES (
    v_conversation_id, 'company', v_company_user_id, p_message
  ) RETURNING id INTO v_message_id;

  SELECT credit_balance INTO v_new_balance FROM public.companies WHERE id = p_company_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'conversation_id', v_conversation_id,
    'message_id', v_message_id,
    'is_new_conversation', v_is_new_conversation,
    'credits_consumed', v_consumed,
    'new_balance', v_new_balance
  );
END;
$$;

-- publish_job_posting (cuerpo de 20251230_job_postings_rpc_functions.sql)
CREATE OR REPLACE FUNCTION public.publish_job_posting(
    p_job_posting_id UUID,
    p_company_id UUID,
    p_user_id UUID,
    p_duration_days INTEGER DEFAULT 30
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_credits_required INTEGER;
    v_new_balance INTEGER;
    v_job RECORD;
    v_company_status VARCHAR(50);
    v_current_balance INTEGER;
BEGIN
    PERFORM public.assert_caller_matches_user(p_user_id);

    IF NOT EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = p_company_id
        AND user_id = p_user_id
        AND role IN ('OWNER', 'ADMIN', 'MEMBER')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not authorized to publish job postings for this company'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_job FROM job_postings
    WHERE id = p_job_posting_id AND company_id = p_company_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job posting not found or does not belong to this company';
    END IF;

    v_credits_required := COALESCE(v_job.credits_cost, 30);

    UPDATE companies
    SET
        credit_balance = credit_balance - v_credits_required,
        total_credits_used = total_credits_used + v_credits_required,
        updated_at = NOW()
    WHERE id = p_company_id
        AND credit_balance >= v_credits_required
        AND status = 'APPROVED'
    RETURNING credit_balance INTO v_new_balance;

    IF NOT FOUND THEN
        SELECT status, credit_balance INTO v_company_status, v_current_balance
        FROM companies WHERE id = p_company_id;

        IF v_company_status != 'APPROVED' THEN
            RAISE EXCEPTION 'Company is not approved (status: %)', v_company_status;
        ELSIF v_current_balance < v_credits_required THEN
            RAISE EXCEPTION 'Insufficient credits: Need %, have %', v_credits_required, v_current_balance;
        ELSE
            RAISE EXCEPTION 'Company not found';
        END IF;
    END IF;

    INSERT INTO company_credits_history (
        company_id, amount, balance_after, transaction_type,
        reference_id, description, created_by
    ) VALUES (
        p_company_id, -v_credits_required, v_new_balance, 'JOB_POSTING',
        p_job_posting_id,
        format('Published job posting: %s', v_job.title),
        p_user_id
    );

    UPDATE job_postings
    SET
        status = 'PUBLISHED',
        published_at = NOW(),
        application_deadline = CASE
            WHEN application_deadline IS NULL
            THEN NOW() + (p_duration_days || ' days')::INTERVAL
            ELSE application_deadline
        END,
        updated_at = NOW()
    WHERE id = p_job_posting_id;

    RETURN jsonb_build_object(
        'success', true,
        'credits_used', v_credits_required,
        'new_balance', v_new_balance,
        'published_at', NOW(),
        'application_deadline', NOW() + (p_duration_days || ' days')::INTERVAL
    );
END;
$$;

-- update_application_status (cuerpo de 20251230_job_postings_rpc_functions.sql)
CREATE OR REPLACE FUNCTION public.update_application_status(
    p_application_id UUID,
    p_company_id UUID,
    p_user_id UUID,
    p_new_status VARCHAR(50),
    p_internal_notes TEXT DEFAULT NULL,
    p_rating INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_old_status VARCHAR(50);
    v_candidate_email TEXT;
    v_candidate_name TEXT;
    v_job_title TEXT;
BEGIN
    PERFORM public.assert_caller_matches_user(p_user_id);

    IF NOT EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = p_company_id
        AND user_id = p_user_id
        AND role IN ('OWNER', 'ADMIN', 'MEMBER')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not authorized to update applications for this company'
            USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM job_applications
        WHERE id = p_application_id AND company_id = p_company_id
    ) THEN
        RAISE EXCEPTION 'Application not found or does not belong to this company';
    END IF;

    SELECT
        ja.status,
        p.email,
        p.full_name,
        jp.title
    INTO v_old_status, v_candidate_email, v_candidate_name, v_job_title
    FROM job_applications ja
    JOIN profiles p ON p.id = ja.profile_id
    JOIN job_postings jp ON jp.id = ja.job_posting_id
    WHERE ja.id = p_application_id;

    UPDATE job_applications
    SET
        status = p_new_status,
        internal_notes = COALESCE(p_internal_notes, internal_notes),
        rating = COALESCE(p_rating, rating),
        viewed_by_company = true,
        viewed_at = CASE WHEN viewed_at IS NULL THEN NOW() ELSE viewed_at END,
        viewed_by = CASE WHEN viewed_by IS NULL THEN p_user_id ELSE viewed_by END,
        updated_at = NOW()
    WHERE id = p_application_id;

    IF v_old_status != p_new_status AND p_new_status IN ('INTERVIEW', 'OFFER', 'HIRED', 'REJECTED') THEN
        PERFORM send_email_notification(
            v_candidate_email,
            'application-status-update',
            jsonb_build_object(
                'candidateName', v_candidate_name,
                'jobTitle', v_job_title,
                'newStatus', p_new_status,
                'oldStatus', v_old_status,
                'applicationUrl', current_setting('app.settings.app_url', true) || '/dashboard/applications'
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'application_id', p_application_id,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
END;
$$;

-- track_job_posting_view: p_profile_id se ignora; el perfil es auth.uid()
CREATE OR REPLACE FUNCTION public.track_job_posting_view(
    p_job_posting_id UUID,
    p_profile_id UUID DEFAULT NULL,
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_profile_id UUID;
    v_view_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM job_postings
        WHERE id = p_job_posting_id AND status = 'PUBLISHED'
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Job posting not found or not published');
    END IF;

    -- Solo el propio usuario y solo si tiene fila en profiles (FK)
    SELECT p.id INTO v_profile_id FROM profiles p WHERE p.id = auth.uid();

    -- Una visita por usuario autenticado y día
    IF v_profile_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM job_posting_views
        WHERE job_posting_id = p_job_posting_id
          AND profile_id = v_profile_id
          AND viewed_at >= date_trunc('day', NOW())
    ) THEN
        RETURN jsonb_build_object('success', true, 'view_id', NULL);
    END IF;

    INSERT INTO job_posting_views (
        job_posting_id, profile_id, ip_address, user_agent, viewed_at
    ) VALUES (
        p_job_posting_id, v_profile_id, LEFT(p_ip_address, 45), LEFT(p_user_agent, 500), NOW()
    )
    RETURNING id INTO v_view_id;

    UPDATE job_postings
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_job_posting_id;

    RETURN jsonb_build_object('success', true, 'view_id', v_view_id);
END;
$$;

-- is_job_saved: solo el propio perfil o su gestor
CREATE OR REPLACE FUNCTION public.is_job_saved(
    p_profile_id UUID,
    p_job_posting_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.assert_caller_matches_user(p_profile_id, false, true);

    RETURN EXISTS (
        SELECT 1
        FROM public.saved_job_postings
        WHERE profile_id = p_profile_id
        AND job_posting_id = p_job_posting_id
    );
END;
$$;

-- get_saved_jobs: solo el propio perfil o su gestor
CREATE OR REPLACE FUNCTION public.get_saved_jobs(
    p_profile_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    saved_id UUID,
    saved_at TIMESTAMPTZ,
    notes TEXT,
    job_id UUID,
    job_title VARCHAR,
    job_slug VARCHAR,
    company_name VARCHAR,
    company_logo_url TEXT,
    location_city VARCHAR,
    location_country VARCHAR,
    is_remote BOOLEAN,
    employment_type VARCHAR,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.assert_caller_matches_user(p_profile_id, false, true);

    RETURN QUERY
    SELECT
        sjp.id AS saved_id,
        sjp.created_at AS saved_at,
        sjp.notes,
        jp.id AS job_id,
        jp.title AS job_title,
        jp.slug AS job_slug,
        c.company_name,
        c.logo_url AS company_logo_url,
        jp.location_city,
        jp.location_country,
        jp.is_remote,
        jp.employment_type,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency
    FROM public.saved_job_postings sjp
    INNER JOIN public.job_postings jp ON sjp.job_posting_id = jp.id
    INNER JOIN public.companies c ON jp.company_id = c.id
    WHERE sjp.profile_id = p_profile_id
    AND jp.status = 'PUBLISHED'
    ORDER BY sjp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- get_activity_stats: solo admin
CREATE OR REPLACE FUNCTION public.get_activity_stats(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    activity_date DATE,
    logins BIGINT,
    registrations BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    PERFORM public.assert_caller_is_admin();

    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            p_start_date::date,
            p_end_date::date,
            '1 day'::interval
        )::date AS activity_date
    ),
    login_counts AS (
        SELECT
            created_at::date AS activity_date,
            COUNT(*) AS count
        FROM public.user_activity_logs
        WHERE activity_type = 'login'
        AND created_at BETWEEN p_start_date AND p_end_date
        GROUP BY created_at::date
    ),
    registration_counts AS (
        SELECT
            created_at::date AS activity_date,
            COUNT(*) AS count
        FROM public.profiles
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY created_at::date
    )
    SELECT
        ds.activity_date,
        COALESCE(lc.count, 0) AS logins,
        COALESCE(rc.count, 0) AS registrations
    FROM date_series ds
    LEFT JOIN login_counts lc ON ds.activity_date = lc.activity_date
    LEFT JOIN registration_counts rc ON ds.activity_date = rc.activity_date
    ORDER BY ds.activity_date;
END;
$$;

-- Permisos
REVOKE ALL ON FUNCTION public.approve_company(UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reject_company(UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.adjust_company_credits(UUID, UUID, INTEGER, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.consume_company_credits(UUID, UUID, VARCHAR, UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.unlock_profile_for_company(UUID, UUID, INTEGER, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.download_cv_for_company(UUID, UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.send_initial_company_message(UUID, UUID, TEXT, TEXT, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.publish_job_posting(UUID, UUID, UUID, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.update_application_status(UUID, UUID, UUID, VARCHAR, TEXT, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.track_job_posting_view(UUID, UUID, VARCHAR, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_job_saved(UUID, UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_saved_jobs(UUID, INTEGER, INTEGER) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_activity_stats(TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.approve_company(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reject_company(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.adjust_company_credits(UUID, UUID, INTEGER, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.consume_company_credits(UUID, UUID, VARCHAR, UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.unlock_profile_for_company(UUID, UUID, INTEGER, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.download_cv_for_company(UUID, UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.send_initial_company_message(UUID, UUID, TEXT, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.publish_job_posting(UUID, UUID, UUID, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_application_status(UUID, UUID, UUID, VARCHAR, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.track_job_posting_view(UUID, UUID, VARCHAR, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_job_saved(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_saved_jobs(UUID, INTEGER, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_activity_stats(TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated, service_role;

COMMENT ON FUNCTION public.approve_company(UUID, UUID, TEXT) IS
'Admin aprueba una empresa. Admin = auth.uid() con role admin; p_admin_id se ignora (compatibilidad).';
COMMENT ON FUNCTION public.reject_company(UUID, UUID, TEXT) IS
'Admin rechaza una empresa con motivo. p_admin_id se ignora (compatibilidad).';
COMMENT ON FUNCTION public.adjust_company_credits(UUID, UUID, INTEGER, TEXT) IS
'Admin ajusta créditos de una empresa. p_admin_id se ignora (compatibilidad).';
COMMENT ON FUNCTION public.consume_company_credits(UUID, UUID, VARCHAR, UUID, UUID) IS
'Interna: descuenta créditos. p_user_id debe ser auth.uid() y miembro de la empresa.';
COMMENT ON FUNCTION public.track_job_posting_view(UUID, UUID, VARCHAR, TEXT) IS
'Registra una visita a una oferta publicada. El perfil es auth.uid() (p_profile_id se ignora).';

-- -----------------------------------------------------------------------------
-- 8. increment (creada a mano en producción, no está en las migraciones)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig, p.prosecdef
    FROM pg_proc p
    WHERE p.pronamespace = 'public'::regnamespace
      AND p.proname = 'increment'
  LOOP
    RAISE NOTICE 'increment: se retira EXECUTE a PUBLIC/anon/authenticated en % (security definer: %)', r.sig, r.prosecdef;
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.sig);
  END LOOP;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
