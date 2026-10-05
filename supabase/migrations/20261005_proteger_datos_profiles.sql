-- =============================================================================
-- profiles (1/2): filas visibles, vista completa para propietario/gestor/admin
-- y bloqueo de escalada de privilegios (role / plan / managed_by / moderación)
-- =============================================================================
--
-- PROBLEMA (seguridad, auditoría 2026-10-05, C1 + escalada)
--   a) Con la anon key pública, GET /rest/v1/profiles?select=* devolvía las 117
--      filas con sus 61 columnas: email, phone, plan, salario, managed_by,
--      motivo de suspensión... Además se veían filas con slug NULL y con
--      profile_hidden = true: en la BD hay una política SELECT creada desde el
--      dashboard (no está en el repo) más permisiva que la del repo
--      ("Public profiles are viewable by slug", 20251128_fix_rls_policies.sql:24).
--   b) "Users can update their own profile" (USING auth.uid() = id, sin WITH
--      CHECK por columnas) dejaba a cualquier usuario cambiarse su propio
--      role ('admin'), plan ('enterprise'), managed_by, o levantarse una
--      suspensión (is_active, profile_hidden, search_blocked...). La política
--      INSERT permitía crear la propia fila ya con role = 'admin'.
--
-- ESTA MIGRACIÓN ES LA FASE 1 (ADITIVA). No quita todavía ninguna columna a
-- anon/authenticated, así que el frontend actual sigue funcionando. Las
-- columnas privadas se cierran en la FASE 2:
--   20261006_cerrar_columnas_privadas_profiles_stamps.sql
-- que se aplica DESPUÉS de desplegar el frontend nuevo (que ya no pide esas
-- columnas a `profiles`, sino a la vista `profiles_full` que crea esta).
--
-- QUÉ HACE
--   1. public.current_user_is_admin(): SECURITY DEFINER, devuelve true solo si
--      el perfil de auth.uid() tiene role 'admin' (COALESCE: anon, sin fila o
--      role NULL -> false; nunca NULL).
--   2. Columna generada profiles.is_premium (plan distinto de free). Es lo
--      único del plan que la web muestra en público (insignia "Premium" y orden
--      en la búsqueda de talento); el plan exacto deja de ser público en la
--      fase 2. GENERATED ALWAYS: nadie puede escribirla.
--   3. Políticas SELECT de profiles, recreadas desde cero:
--        - Se BORRAN TODAS las políticas SELECT existentes en profiles (incluida
--          la creada desde el dashboard; su definición sale en un NOTICE).
--        - "Perfiles publicados visibles para todos" (anon y authenticated):
--            slug IS NOT NULL AND profile_hidden IS NOT TRUE
--            AND is_active IS NOT FALSE
--          (mismo criterio que server.mjs y scripts/generate-sitemap.mjs para
--          publicar un perfil: con URL, no oculto por moderación, no suspendido).
--        - "Users can view their own profile"    auth.uid() = id
--        - "Managers can view managed profiles"  managed_by = auth.uid()
--        - "Admins can view all profiles"        current_user_is_admin()
--      Las políticas FOR ALL que existan no se tocan (se listan en un WARNING).
--   4. Vista public.profiles_full: TODAS las columnas, pero solo de las filas
--      que el usuario puede ver completas: la suya, las que gestiona y todas si
--      es admin. Las empresas NO ven email/teléfono de candidatos por esta vía:
--      company_profile_views ("desbloqueo") admite INSERT directo de cualquier
--      miembro de empresa sin gastar créditos, y job_applications deja a la
--      empresa cambiar profile_id (UPDATE sin WITH CHECK), así que basar el
--      acceso en esas tablas permitiría recolectar emails de cualquiera. El
--      módulo de empresa ya fallaba (pide columnas que no existen: cv_url,
--      profile_picture_url, professional_title); el contacto con candidatos
--      queda pendiente de una RPC específica. Se ejecuta con los permisos
--      del propietario (no security_invoker) y filtra explícitamente;
--      security_barrier evita que filtros del cliente con funciones "leaky" vean
--      filas ajenas. Solo SELECT y solo para authenticated (sin INSERT/UPDATE:
--      una vista simple sería actualizable y se saltaría la RLS).
--      Las escrituras siguen yendo a la tabla profiles.
--      OJO: la vista expande p.* al crearse. Si se añade una columna nueva a
--      profiles, volver a ejecutar esta migración (o recrear la vista).
--   5. Trigger BEFORE INSERT OR UPDATE trg_profiles_bloquear_campos_protegidos:
--      si quien escribe es anon/authenticated y NO es admin:
--        - UPDATE: no puede cambiar role, plan, managed_by, is_active,
--          suspension_reason, suspended_until, profile_hidden, search_blocked,
--          messages_blocked (error 42501).
--        - INSERT: role solo NULL/'professional'/'employer', plan NULL/'free',
--          managed_by NULL, sin moderación (error 42501).
--      Pasan sin restricción: service_role (Edge Functions, webhook de pagos),
--      conexiones sin JWT (SQL editor, cron, trigger de alta de auth.users) y
--      admins (panel de admin: ProfilesManagement cambia plan/role,
--      UserModeration suspende/oculta, RPC admin_grant_enterprise_plan).
--      Se ejecuta después de normalize_profile_role (orden alfabético), así que
--      compara el role ya normalizado.
--   6. Las 3 políticas "Manager can read managed profile ..." de analytics_*
--      (20260730_analytics_rls_and_manager_access.sql) leían profiles.managed_by
--      dentro de la política; pasan a usar public.is_managed_profile(profile_id)
--      (SECURITY DEFINER, ya existente). Mismo resultado; necesario para poder
--      retirar managed_by a authenticated en la fase 2.
--
--   7. RPC public.company_find_user_by_email(company_id, email): para invitar a
--      un usuario al equipo de una empresa (CompanyTeamPage buscaba profiles
--      por email). Solo OWNER/ADMIN de esa empresa; devuelve solo el id.
--
--   Lecturas del frontend (inventario completo en el informe de la tarea):
--     - Públicas (perfil /cv/:slug, comunidad, feed, búsqueda de talento,
--       grupos, notificaciones, SEO): columnas explícitas de la lista pública
--       (lib/publicProfileColumns.ts), contra `profiles`.
--     - Propias/gestor/admin (AuthContext, editor, dashboard, panel de admin,
--       panel de gestor): `profiles_full`.
--
-- ORDEN DE DESPLIEGUE
--   1. Esta migración + 20261005_proteger_evidencia_stamps.sql (aditivas).
--   2. Edge Functions (ai-cv-assistant, ai-optimize-description leen el plan de
--      profiles_full; translate-profile y get-public-profile, columnas públicas).
--   3. Frontend.
--   4. 20261006_cerrar_columnas_privadas_profiles_stamps.sql (fase 2).
--   Esta migración es compatible con el frontend actual: solo cambia QUÉ filas
--   ve cada uno (deja de verse lo oculto/suspendido/sin slug ajeno) y bloquea
--   la escalada.
--
-- ANTES DE APLICAR (SQL editor), revisar lo que hay:
--   select policyname, cmd, roles, qual, with_check
--     from pg_policies where schemaname = 'public' and tablename = 'profiles'
--    order by cmd, policyname;
--   Si aparece una política FOR ALL con USING (true) o similar, decidir antes
--   qué hacer con ella (esta migración no la toca y seguiría abriendo filas).
--
-- CÓMO REVERTIR (NO recomendado: reabre la escalada)
--   DROP TRIGGER IF EXISTS trg_profiles_bloquear_campos_protegidos ON public.profiles;
--   DROP FUNCTION IF EXISTS public.profiles_bloquear_campos_protegidos();
--   DROP VIEW IF EXISTS public.profiles_full;
--   DROP POLICY IF EXISTS "Perfiles publicados visibles para todos" ON public.profiles;
--   DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
--   CREATE POLICY "Public profiles are viewable by slug" ON public.profiles
--     FOR SELECT USING (slug IS NOT NULL);
--   (la política del dashboard se puede recrear con la definición del NOTICE)
--   ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_premium;
--   DROP FUNCTION IF EXISTS public.company_find_user_by_email(uuid, text);
--   Políticas de analytics: volver a ejecutar 20260730_analytics_rls_and_manager_access.sql.
--
-- Idempotente: se puede ejecutar varias veces.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. ¿El usuario actual es admin?
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER: lee profiles sin pasar por su RLS (se usa dentro de las
-- políticas de la propia tabla: sin esto habría recursión).
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

COMMENT ON FUNCTION public.current_user_is_admin() IS
'true si el perfil de auth.uid() tiene role admin. Nunca NULL (anon / sin fila / role NULL -> false).';

-- -----------------------------------------------------------------------------
-- 2. is_premium (lo único público del plan)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean
  GENERATED ALWAYS AS (COALESCE(lower(plan), 'free') NOT IN ('free', '')) STORED;

COMMENT ON COLUMN public.profiles.is_premium IS
'Generada: plan distinto de free. Pública (insignia Premium y orden en la búsqueda). El plan exacto es privado.';

-- -----------------------------------------------------------------------------
-- 3. Políticas SELECT de profiles
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, roles::text AS roles, qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'SELECT'
  LOOP
    RAISE NOTICE 'profiles: se elimina la política SELECT "%" (roles %, USING %)', r.policyname, r.roles, r.qual;
    EXECUTE format('DROP POLICY %I ON public.profiles', r.policyname);
  END LOOP;

  FOR r IN
    SELECT policyname, roles::text AS roles, qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'profiles' AND cmd = 'ALL'
  LOOP
    RAISE WARNING 'profiles: hay una política FOR ALL "%" (roles %, USING %). No se toca: revisar que no abra filas.', r.policyname, r.roles, r.qual;
  END LOOP;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Perfiles publicados visibles para todos"
  ON public.profiles FOR SELECT
  TO anon, authenticated
  USING (slug IS NOT NULL AND profile_hidden IS NOT TRUE AND is_active IS NOT FALSE);

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Managers can view managed profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (managed_by = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.current_user_is_admin());

-- -----------------------------------------------------------------------------
-- 4. Vista con todas las columnas para propietario / gestor / admin / empresa
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.profiles_full;

CREATE VIEW public.profiles_full
WITH (security_barrier = true)
AS
SELECT p.*
FROM public.profiles p
WHERE p.id = auth.uid()
   OR p.managed_by = auth.uid()
   OR public.current_user_is_admin();

COMMENT ON VIEW public.profiles_full IS
'Todas las columnas de profiles, solo filas propias, gestionadas, o todas si es admin. Solo lectura.';

REVOKE ALL ON public.profiles_full FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles_full TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 5. Bloqueo de escalada de privilegios
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.profiles_bloquear_campos_protegidos()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text := COALESCE(auth.role(), '');
BEGIN
  -- Contextos de confianza: service_role (Edge Functions / webhooks) y sin JWT
  -- (SQL editor, cron, trigger de alta en auth.users).
  IF v_role NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  -- Admin (panel de admin y RPC admin_*): puede cambiar cualquier campo.
  IF public.current_user_is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NOT NULL AND NEW.role NOT IN ('professional', 'employer') THEN
      RAISE EXCEPTION 'PROTECTED_FIELD: no puedes crear tu perfil con role %', NEW.role
        USING ERRCODE = '42501';
    END IF;
    IF COALESCE(lower(NEW.plan), 'free') <> 'free' THEN
      RAISE EXCEPTION 'PROTECTED_FIELD: no puedes crear tu perfil con plan %', NEW.plan
        USING ERRCODE = '42501';
    END IF;
    IF NEW.managed_by IS NOT NULL
       OR NEW.is_active IS FALSE
       OR NEW.profile_hidden IS TRUE
       OR NEW.search_blocked IS TRUE
       OR NEW.messages_blocked IS TRUE
       OR NEW.suspension_reason IS NOT NULL
       OR NEW.suspended_until IS NOT NULL THEN
      RAISE EXCEPTION 'PROTECTED_FIELD: managed_by y los campos de moderación solo los asigna un admin'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: role solo lo cambia un admin' USING ERRCODE = '42501';
  END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: plan solo lo cambia un admin o el sistema de pagos' USING ERRCODE = '42501';
  END IF;
  IF NEW.managed_by IS DISTINCT FROM OLD.managed_by THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: managed_by solo lo cambia un admin' USING ERRCODE = '42501';
  END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason
     OR NEW.suspended_until IS DISTINCT FROM OLD.suspended_until
     OR NEW.profile_hidden IS DISTINCT FROM OLD.profile_hidden
     OR NEW.search_blocked IS DISTINCT FROM OLD.search_blocked
     OR NEW.messages_blocked IS DISTINCT FROM OLD.messages_blocked THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: los campos de moderación solo los cambia un admin' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.profiles_bloquear_campos_protegidos() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_bloquear_campos_protegidos ON public.profiles;
CREATE TRIGGER trg_profiles_bloquear_campos_protegidos
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.profiles_bloquear_campos_protegidos();

-- -----------------------------------------------------------------------------
-- 6. Políticas de analytics del gestor sin leer profiles.managed_by
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  t text;
  pol text;
BEGIN
  FOREACH t IN ARRAY ARRAY['analytics_views', 'analytics_clicks', 'analytics_leads'] LOOP
    IF to_regclass('public.' || t) IS NULL THEN
      CONTINUE;
    END IF;
    pol := CASE t
      WHEN 'analytics_views'  THEN 'Manager can read managed profile views'
      WHEN 'analytics_clicks' THEN 'Manager can read managed profile clicks'
      ELSE 'Manager can read managed profile leads'
    END;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol, t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated '
      || 'USING (public.is_managed_profile(profile_id))', pol, t);
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 7. Buscar usuario por email para invitarlo al equipo de una empresa
-- -----------------------------------------------------------------------------
-- components/company/CompanyTeamPage.tsx buscaba `profiles` por email. Con email
-- privado (fase 2) esa consulta da 42501. Esta RPC solo responde a OWNER/ADMIN
-- de la empresa indicada y devuelve el id (o NULL), nunca el email ni otros datos.
CREATE OR REPLACE FUNCTION public.company_find_user_by_email(p_company_id uuid, p_email text)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.company_users cu
    WHERE cu.company_id = p_company_id
      AND cu.user_id = auth.uid()
      AND cu.role IN ('OWNER', 'ADMIN')
  ) THEN
    RAISE EXCEPTION 'NOT_COMPANY_ADMIN: solo OWNER/ADMIN de la empresa' USING ERRCODE = '42501';
  END IF;

  SELECT p.id INTO v_id
  FROM public.profiles p
  WHERE lower(p.email) = lower(trim(p_email))
  LIMIT 1;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.company_find_user_by_email(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_find_user_by_email(uuid, text) TO authenticated, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
