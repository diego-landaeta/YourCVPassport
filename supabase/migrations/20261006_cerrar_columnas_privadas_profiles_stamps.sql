-- =============================================================================
-- profiles y stamps (2/2): cerrar la lectura de columnas privadas
-- =============================================================================
--
-- APLICAR DESPUÉS DE DESPLEGAR EL FRONTEND NUEVO Y LAS EDGE FUNCTIONS.
-- Requiere 20261005_proteger_datos_profiles.sql y
-- 20261005_proteger_evidencia_stamps.sql ya aplicadas.
--
-- PROBLEMA (seguridad, auditoría 2026-10-05, C1 y A1)
--   La RLS filtra filas, no columnas: cualquier visitante (anon) o usuario
--   registrado (authenticated) que pudiera ver una fila de profiles veía TODAS
--   sus columnas (email, phone, plan, salario, managed_by, moderación...), y
--   lo mismo con `stamps.evidence` (emails, nº de documento...).
--
-- QUÉ HACE
--   1. Comprobación previa (aborta la migración si falla): ninguna política
--      RLS de OTRA tabla puede leer una columna privada de profiles, porque las
--      subconsultas de las políticas se evalúan con los privilegios de quien
--      consulta y, tras el REVOKE, esa tabla empezaría a dar 42501 (permission
--      denied) a anon/authenticated. Las conocidas (analytics_* con managed_by)
--      ya se reescribieron en la fase 1. Avisos (WARNING, no aborta) para
--      funciones SECURITY INVOKER y vistas security_invoker que mencionen
--      profiles y una columna privada: revisarlas.
--   2. profiles, privilegios por columna para anon y authenticated:
--        REVOKE SELECT ON profiles; GRANT SELECT (<columnas públicas>).
--      Columnas públicas (las que se ven en el CV público, la comunidad y la
--      búsqueda de talento): id, full_name, name, headline, summary, slug,
--      handle, title, meta_title, meta_description, template, template_color,
--      availability, location, country_code, gender, avatar_url, banner_url,
--      linkedin_url, github_url, portfolio_url, website_url, twitter_url,
--      instagram_url, youtube_url, behance_url, dribbble_url,
--      job_seeking_status, job_type, open_to_remote, remote, remote_preference,
--      work_mode, willing_to_relocate, preferred_locations,
--      show_verified_credentials, show_connect_links, show_qr_code,
--      show_availability_badge, is_open_to_messages, wizard_completed,
--      is_premium, is_active, profile_hidden, role, created_at, updated_at.
--      Privadas (solo vía la vista profiles_full o service_role): email, phone,
--      plan, salary_min, salary_max, salary_currency, managed_by,
--      suspension_reason, suspended_until, search_blocked, messages_blocked,
--      slug_validation_error, last_slug_changed_at, dashboard_tour_completed,
--      first_login_completed, y cualquier columna que no esté en la lista
--      pública (se cierra por defecto; sale en un NOTICE).
--      Notas:
--        - `role` sigue siendo legible: ~25 políticas RLS de otras tablas
--          (incluidas las públicas de skills/languages, que filtran
--          role != 'admin') y la búsqueda de talento lo leen. Quitarlo exige
--          reescribir esas políticas con current_user_is_admin(); queda como
--          fase siguiente. Con la fase 1 nadie puede CAMBIAR su role.
--        - is_active / profile_hidden: las filas visibles para terceros ya
--          cumplen is_active y NOT profile_hidden, así que no revelan nada; los
--          scripts SEO filtran por ellas.
--        - gender: lo usa la corrección de género de las traducciones del CV
--          público (el texto traducido ya lo revela).
--      Las escrituras no cambian (UPDATE/INSERT siguen concedidos; la RLS y el
--      trigger de la fase 1 deciden). anon pierde INSERT/UPDATE/DELETE en
--      profiles (nunca tuvo política que se lo permitiera).
--   3. stamps: se eliminan las políticas SELECT públicas (las que no dependen
--      de auth.uid(): "Public can view verified stamps", "Public can view
--      verified certifications" y cualquier otra equivalente creada a mano;
--      salen en NOTICE). Quedan: propietario, admin y gestor (FOR ALL). Lo
--      público se lee de la vista public_stamps (fase 1).
--      REVOKE ALL ON stamps FROM anon.
--
-- ORDEN DE DESPLIEGUE
--   1. 20261005_proteger_datos_profiles.sql + 20261005_proteger_evidencia_stamps.sql
--   2. Edge Functions + frontend nuevos.
--   3. ESTA migración.
--   Si se aplica con el frontend antiguo: el dashboard deja de cargar el perfil
--   propio (select('*') en profiles -> 42501) y los CV públicos piden columnas
--   privadas -> error. NO aplicar antes del paso 2.
--
-- ANTES DE APLICAR (SQL editor):
--   select tablename, policyname, cmd, roles, qual, with_check from pg_policies
--    where schemaname = 'public' and tablename in ('profiles', 'stamps')
--    order by tablename, cmd, policyname;
--   -- Políticas de otras tablas que leen profiles (la migración aborta si
--   -- alguna usa una columna privada):
--   select tablename, policyname, qual, with_check from pg_policies
--    where schemaname = 'public' and tablename <> 'profiles'
--      and (qual ilike '%profiles%' or with_check ilike '%profiles%');
--
-- CÓMO REVERTIR (reabre C1/A1)
--   GRANT SELECT ON public.profiles TO anon, authenticated;
--   GRANT INSERT, UPDATE, DELETE ON public.profiles TO anon;
--   GRANT SELECT ON public.stamps TO anon;
--   CREATE POLICY "Public can view verified stamps" ON public.stamps
--     FOR SELECT TO authenticated, anon USING (status = 'VERIFIED');
--
-- Idempotente.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Comprobación previa
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_private text[] := ARRAY[
    'email', 'phone', 'plan', 'salary_min', 'salary_max', 'salary_currency',
    'managed_by', 'suspension_reason', 'suspended_until', 'search_blocked',
    'messages_blocked', 'slug_validation_error', 'last_slug_changed_at',
    'dashboard_tour_completed', 'first_login_completed'
  ];
  r record;
  v_alias text;
  v_col text;
  v_hits text[] := '{}';
BEGIN
  -- Políticas de otras tablas
  FOR r IN
    SELECT tablename, policyname,
           COALESCE(qual, '') || ' ' || COALESCE(with_check, '') AS expr
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename <> 'profiles'
  LOOP
    IF r.expr !~* '\mprofiles\M' THEN
      CONTINUE;
    END IF;
    FOR v_alias IN
      SELECT 'profiles'
      UNION
      SELECT (regexp_matches(r.expr, '\mprofiles\s+(?:as\s+)?([a-z_][a-z0-9_]*)', 'gi'))[1]
    LOOP
      IF lower(v_alias) IN ('where', 'on', 'join', 'left', 'right', 'inner', 'cross',
                            'group', 'order', 'limit', 'union', 'and', 'or') THEN
        CONTINUE;
      END IF;
      FOREACH v_col IN ARRAY v_private LOOP
        IF r.expr ~* ('\m' || v_alias || '\.' || v_col || '\M') THEN
          v_hits := v_hits || format('%s / "%s" lee %s.%s', r.tablename, r.policyname, v_alias, v_col);
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  IF array_length(v_hits, 1) > 0 THEN
    RAISE EXCEPTION 'ABORTADO: políticas que leen columnas privadas de profiles (reescribirlas con una función SECURITY DEFINER antes de aplicar): %',
      array_to_string(v_hits, '; ');
  END IF;

  -- Funciones SECURITY INVOKER (solo aviso)
  FOR r IN
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND NOT p.prosecdef
      AND p.prosrc ~* '\mprofiles\M'
      AND p.prosrc ~* ('\m(' || array_to_string(v_private, '|') || ')\M')
  LOOP
    RAISE WARNING 'Función SECURITY INVOKER public.% menciona profiles y una columna privada: si la ejecuta anon/authenticated sobre profiles fallará con 42501. Revisar.', r.proname;
  END LOOP;

  -- Vistas security_invoker (solo aviso)
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'v'
      AND COALESCE(c.reloptions::text, '') ILIKE '%security_invoker=true%'
      AND pg_get_viewdef(c.oid) ~* '\mprofiles\M'
      AND pg_get_viewdef(c.oid) ~* ('\m(' || array_to_string(v_private, '|') || ')\M')
  LOOP
    RAISE WARNING 'Vista security_invoker public.% menciona profiles y una columna privada. Revisar.', r.relname;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2. profiles: privilegios por columna
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_public text[] := ARRAY[
    'id', 'full_name', 'name', 'headline', 'summary', 'slug', 'handle', 'title',
    'meta_title', 'meta_description', 'template', 'template_color',
    'availability', 'location', 'country_code', 'gender', 'avatar_url',
    'banner_url', 'linkedin_url', 'github_url', 'portfolio_url', 'website_url',
    'twitter_url', 'instagram_url', 'youtube_url', 'behance_url', 'dribbble_url',
    'job_seeking_status', 'job_type', 'open_to_remote', 'remote',
    'remote_preference', 'work_mode', 'willing_to_relocate',
    'preferred_locations', 'show_verified_credentials', 'show_connect_links',
    'show_qr_code', 'show_availability_badge', 'is_open_to_messages',
    'wizard_completed', 'is_premium', 'is_active', 'profile_hidden', 'role',
    'created_at', 'updated_at'
  ];
  v_grant text[];
  v_closed text[];
BEGIN
  SELECT array_agg(quote_ident(a.attname) ORDER BY a.attnum)
    INTO v_grant
  FROM pg_attribute a
  WHERE a.attrelid = 'public.profiles'::regclass
    AND a.attnum > 0 AND NOT a.attisdropped
    AND a.attname = ANY (v_public);

  SELECT array_agg(a.attname::text ORDER BY a.attnum)
    INTO v_closed
  FROM pg_attribute a
  WHERE a.attrelid = 'public.profiles'::regclass
    AND a.attnum > 0 AND NOT a.attisdropped
    AND NOT (a.attname = ANY (v_public));

  -- REVOKE a nivel de tabla también quita los privilegios por columna previos.
  REVOKE SELECT ON public.profiles FROM PUBLIC, anon, authenticated;
  EXECUTE format('GRANT SELECT (%s) ON public.profiles TO anon, authenticated',
                 array_to_string(v_grant, ', '));

  RAISE NOTICE 'profiles: columnas legibles por anon/authenticated: %', array_to_string(v_grant, ', ');
  RAISE NOTICE 'profiles: columnas cerradas (solo profiles_full / service_role): %', array_to_string(v_closed, ', ');
END $$;

REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon;

-- -----------------------------------------------------------------------------
-- 3. stamps: sin lectura pública directa
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT policyname, roles::text AS roles, qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'stamps' AND cmd = 'SELECT'
      AND COALESCE(qual, '') !~* 'auth\.uid\(\)'
      AND COALESCE(qual, '') !~* 'is_managed_profile|current_user_is_admin'
  LOOP
    RAISE NOTICE 'stamps: se elimina la política SELECT pública "%" (roles %, USING %)', r.policyname, r.roles, r.qual;
    EXECUTE format('DROP POLICY %I ON public.stamps', r.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.stamps FROM anon;

COMMIT;

NOTIFY pgrst, 'reload schema';
