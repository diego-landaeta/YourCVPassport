-- =============================================================================
-- companies (1/2): vista completa para miembros / creador / admin
-- =============================================================================
--
-- PROBLEMA (seguridad)
--   La política "Public can view approved companies basic info"
--   (20260105_fix_job_postings_public_access.sql:40) es
--     FOR SELECT TO public USING (status = 'APPROVED')
--   y la RLS filtra filas, no columnas. Con la anon key pública,
--   GET /rest/v1/companies?select=* devuelve de TODA empresa aprobada:
--     - tax_id, company_email, company_phone;
--     - tax_document_url, verification_document_url;
--     - admin_notes, rejection_reason, verified_by, verified_at;
--     - credit_balance, total_credits_purchased, total_credits_used;
--     - la dirección completa (address_*), signup_ip, metadata, created_by...
--   Lo mismo para cualquier usuario autenticado que no sea de la empresa.
--
-- ESTA MIGRACIÓN ES LA FASE 1 (ADITIVA). No quita ninguna columna a
-- anon/authenticated, así que el frontend actual sigue funcionando. Las
-- columnas privadas se cierran en la FASE 2:
--   20261009b_cerrar_columnas_privadas_companies.sql
-- que se aplica DESPUÉS de desplegar el frontend nuevo (que ya no pide esas
-- columnas a `companies`, sino a la vista `companies_full` que crea esta).
--
-- QUÉ HACE
--   1. Vista public.companies_full: TODAS las columnas de companies, pero solo
--      de las filas que el usuario puede ver completas:
--        - las empresas de las que es miembro (public.is_company_member(id));
--        - la que registró él (created_by = auth.uid()), aunque aún no tenga
--          miembros (registro: insert en companies y luego en company_users);
--        - todas, si es admin (public.current_user_is_admin()).
--      Mismo patrón que profiles_full (20261005_proteger_datos_profiles.sql):
--      se ejecuta con los permisos del propietario (no security_invoker) y
--      filtra explícitamente; security_barrier evita que filtros del cliente
--      con funciones "leaky" vean filas ajenas. Solo SELECT y solo para
--      authenticated (sin INSERT/UPDATE: una vista simple sería actualizable y
--      se saltaría la RLS y el trigger de campos protegidos). Las escrituras
--      siguen yendo a la tabla companies (RLS + trg_companies_proteger_campos).
--      OJO: la vista expande c.* al crearse. Si se añade una columna nueva a
--      companies, volver a ejecutar esta migración (o recrear la vista).
--
--   Lecturas del frontend tras este cambio:
--     - Públicas (ofertas, candidaturas, recomendaciones, admin de ofertas):
--       solo id, company_name y logo_url de `companies` (embeds desde
--       job_postings: hooks/useJobApplications.ts,
--       components/dashboard/opportunities/RecommendedJobsTab.tsx,
--       components/admin/JobApplicationsManagement.tsx,
--       components/admin/JobPostingsManagement.tsx).
--     - Miembros / creador / admin (AuthContext, CompanyProtectedRoute,
--       CreditsManagementPage, CompaniesViewSection, CompanyManagementSection,
--       AdminDashboard): `companies_full` con columnas explícitas
--       (lib/companyColumns.ts).
--     - Las RPC SECURITY DEFINER (get_job_posting_detail, search_public_jobs,
--       get_job_board_listings, get_saved_jobs...) leen la tabla como su
--       propietario: no les afecta.
--     - Edge Function company-registration-email: service_role, no le afecta.
--
-- ORDEN DE DESPLIEGUE
--   1. Antes: 20261005_proteger_datos_profiles.sql y
--      20261007_seguridad_empresas.sql (current_user_is_admin,
--      is_company_member y la columna companies.created_by). Esta migración
--      aborta si falta alguno.
--   2. Esta migración (aditiva, compatible con el frontend actual).
--   3. Frontend nuevo (lee companies_full).
--   4. 20261009b_cerrar_columnas_privadas_companies.sql (fase 2).
--
-- CÓMO REVERTIR
--   DROP VIEW IF EXISTS public.companies_full;
--   (Solo si la fase 2 NO está aplicada o se ha revertido antes: el frontend
--   nuevo lee companies_full y fallaría.)
--
-- Idempotente: se puede ejecutar varias veces.
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.current_user_is_admin()') IS NULL THEN
    RAISE EXCEPTION 'Falta public.current_user_is_admin(): aplicar antes 20261005_proteger_datos_profiles.sql';
  END IF;
  IF to_regprocedure('public.is_company_member(uuid, text[])') IS NULL THEN
    RAISE EXCEPTION 'Falta public.is_company_member(uuid, text[]): aplicar antes 20261007_seguridad_empresas.sql';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute
    WHERE attrelid = 'public.companies'::regclass
      AND attname = 'created_by' AND NOT attisdropped
  ) THEN
    RAISE EXCEPTION 'Falta companies.created_by: aplicar antes 20261007_seguridad_empresas.sql';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Vista con todas las columnas para miembros / creador / admin
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.companies_full;

CREATE VIEW public.companies_full
WITH (security_barrier = true)
AS
SELECT c.*
FROM public.companies c
WHERE c.created_by = auth.uid()
   OR public.is_company_member(c.id)
   OR public.current_user_is_admin();

COMMENT ON VIEW public.companies_full IS
'Todas las columnas de companies, solo de las empresas de las que auth.uid() es miembro o creador, o todas si es admin. Solo lectura.';

REVOKE ALL ON public.companies_full FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.companies_full TO authenticated, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
