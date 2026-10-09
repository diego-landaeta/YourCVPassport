-- =============================================================================
-- companies (2/2): cerrar la lectura de columnas privadas
-- =============================================================================
--
-- APLICAR DESPUÉS DE DESPLEGAR EL FRONTEND NUEVO.
-- Requiere 20261009_proteger_datos_companies.sql ya aplicada (vista
-- companies_full) y, antes, 20261007_seguridad_empresas.sql.
--
-- PROBLEMA (seguridad)
--   "Public can view approved companies basic info"
--   (20260105_fix_job_postings_public_access.sql:40) deja a anon y a cualquier
--   usuario autenticado ver las filas de las empresas APPROVED, y la RLS no
--   filtra columnas: se leían tax_id, company_email, company_phone, las URLs
--   de los documentos de verificación, admin_notes, rejection_reason,
--   verified_by, los créditos, la dirección completa, signup_ip...
--
-- QUÉ HACE
--   1. Comprobación previa (aborta la migración si falla):
--        - existe la vista companies_full (fase 1);
--        - ninguna política RLS de OTRA tabla lee una columna privada de
--          companies: las subconsultas de las políticas se evalúan con los
--          privilegios de quien consulta y, tras el REVOKE, esa tabla
--          empezaría a dar 42501 (permission denied) a anon/authenticated.
--          Hoy no hay ninguna en el repo.
--      Avisos (WARNING, no aborta) para funciones SECURITY INVOKER y vistas
--      security_invoker que mencionen companies y una columna privada.
--   2. companies, privilegios por columna para anon y authenticated:
--        REVOKE SELECT ON companies; GRANT SELECT (id, company_name, logo_url).
--      Columnas públicas: las únicas que leen quienes no son de la empresa,
--      siempre como embed desde job_postings / job_applications:
--        id ............ clave del embed (job_postings.company_id = companies.id)
--                        y de los filtros .eq('id', ...) de los UPDATE.
--        company_name .. nombre en ofertas, candidaturas y recomendaciones.
--        logo_url ...... logo en esas mismas tarjetas.
--      Todo lo demás (incluido status, created_at y cualquier columna que se
--      añada en el futuro) queda cerrado: solo vía la vista companies_full
--      (miembros, creador, admin) o service_role. Las columnas cerradas salen
--      en un NOTICE.
--      Notas:
--        - Las políticas RLS de la propia tabla (p. ej. USING (status =
--          'APPROVED')) siguen funcionando: PostgreSQL no comprueba
--          privilegios de columna en las expresiones de las políticas de la
--          tabla consultada.
--        - INSERT / UPDATE siguen concedidos a authenticated (la RLS y
--          trg_companies_proteger_campos deciden). Un insert().select() o
--          update().select() solo puede pedir columnas públicas: el registro
--          (CompanyRegistrationPage) pide .select('id').
--        - anon pierde INSERT/UPDATE/DELETE en companies (el alta exige
--          sesión: el trigger fija created_by = auth.uid()).
--
-- ORDEN DE DESPLIEGUE
--   1. 20261009_proteger_datos_companies.sql (fase 1, aditiva).
--   2. Frontend nuevo (lee companies_full con columnas explícitas).
--   3. ESTA migración.
--   Si se aplica con el frontend antiguo: el panel de empresa no carga su
--   empresa (select('*') en companies -> 42501), el registro falla al leer la
--   fila recién creada y el panel de admin de empresas queda vacío. NO aplicar
--   antes del paso 2.
--
-- ANTES DE APLICAR (SQL editor):
--   select policyname, cmd, roles, qual, with_check from pg_policies
--    where schemaname = 'public' and tablename = 'companies'
--    order by cmd, policyname;
--   -- Políticas de otras tablas que leen companies (la migración aborta si
--   -- alguna usa una columna privada):
--   select tablename, policyname, qual, with_check from pg_policies
--    where schemaname = 'public' and tablename <> 'companies'
--      and (qual ilike '%companies%' or with_check ilike '%companies%');
--
-- CÓMO REVERTIR (reabre la exposición)
--   GRANT SELECT ON public.companies TO anon, authenticated;
--   GRANT INSERT, UPDATE, DELETE ON public.companies TO anon;
--   NOTIFY pgrst, 'reload schema';
--
-- Idempotente.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Comprobación previa
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_public text[] := ARRAY['id', 'company_name', 'logo_url'];
  v_private text[];
  r record;
  v_alias text;
  v_col text;
  v_hits text[] := '{}';
BEGIN
  IF to_regclass('public.companies_full') IS NULL THEN
    RAISE EXCEPTION 'ABORTADO: falta la vista public.companies_full. Aplicar antes 20261009_proteger_datos_companies.sql y desplegar el frontend nuevo.';
  END IF;

  SELECT array_agg(a.attname::text ORDER BY a.attnum)
    INTO v_private
  FROM pg_attribute a
  WHERE a.attrelid = 'public.companies'::regclass
    AND a.attnum > 0 AND NOT a.attisdropped
    AND NOT (a.attname = ANY (v_public));

  -- Políticas de otras tablas
  FOR r IN
    SELECT tablename, policyname,
           COALESCE(qual, '') || ' ' || COALESCE(with_check, '') AS expr
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename <> 'companies'
  LOOP
    IF r.expr !~* '\mcompanies\M' THEN
      CONTINUE;
    END IF;
    FOR v_alias IN
      SELECT 'companies'
      UNION
      SELECT (regexp_matches(r.expr, '\mcompanies\s+(?:as\s+)?([a-z_][a-z0-9_]*)', 'gi'))[1]
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
    RAISE EXCEPTION 'ABORTADO: políticas que leen columnas privadas de companies (reescribirlas con una función SECURITY DEFINER antes de aplicar): %',
      array_to_string(v_hits, '; ');
  END IF;

  -- Funciones SECURITY INVOKER (solo aviso)
  FOR r IN
    SELECT p.proname
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND NOT p.prosecdef
      AND p.prosrc ~* '\mcompanies\M'
      AND p.prosrc ~* ('\m(' || array_to_string(v_private, '|') || ')\M')
  LOOP
    RAISE WARNING 'Función SECURITY INVOKER public.% menciona companies y una columna privada: si la ejecuta anon/authenticated sobre companies fallará con 42501. Revisar.', r.proname;
  END LOOP;

  -- Vistas security_invoker (solo aviso)
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'v'
      AND COALESCE(c.reloptions::text, '') ILIKE '%security_invoker=true%'
      AND pg_get_viewdef(c.oid) ~* '\mcompanies\M'
      AND pg_get_viewdef(c.oid) ~* ('\m(' || array_to_string(v_private, '|') || ')\M')
  LOOP
    RAISE WARNING 'Vista security_invoker public.% menciona companies y una columna privada. Revisar.', r.relname;
  END LOOP;
END $$;

-- -----------------------------------------------------------------------------
-- 2. companies: privilegios por columna
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_public text[] := ARRAY['id', 'company_name', 'logo_url'];
  v_grant text[];
  v_closed text[];
BEGIN
  SELECT array_agg(quote_ident(a.attname) ORDER BY a.attnum)
    INTO v_grant
  FROM pg_attribute a
  WHERE a.attrelid = 'public.companies'::regclass
    AND a.attnum > 0 AND NOT a.attisdropped
    AND a.attname = ANY (v_public);

  SELECT array_agg(a.attname::text ORDER BY a.attnum)
    INTO v_closed
  FROM pg_attribute a
  WHERE a.attrelid = 'public.companies'::regclass
    AND a.attnum > 0 AND NOT a.attisdropped
    AND NOT (a.attname = ANY (v_public));

  -- REVOKE a nivel de tabla también quita los privilegios por columna previos.
  REVOKE SELECT ON public.companies FROM PUBLIC, anon, authenticated;
  EXECUTE format('GRANT SELECT (%s) ON public.companies TO anon, authenticated',
                 array_to_string(v_grant, ', '));

  RAISE NOTICE 'companies: columnas legibles por anon/authenticated: %', array_to_string(v_grant, ', ');
  RAISE NOTICE 'companies: columnas cerradas (solo companies_full / service_role): %', array_to_string(v_closed, ', ');
END $$;

REVOKE INSERT, UPDATE, DELETE ON public.companies FROM anon;

COMMIT;

NOTIFY pgrst, 'reload schema';
