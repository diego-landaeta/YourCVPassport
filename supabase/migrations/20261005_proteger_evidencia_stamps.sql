-- =============================================================================
-- stamps (1/2): vista pública sin evidencias + vistas de resumen con RLS
-- =============================================================================
--
-- PROBLEMA (seguridad, auditoría 2026-10-05, A1 y M4)
--   A1. GET /rest/v1/stamps con la anon key devolvía los 524 sellos VERIFIED con
--       TODAS sus columnas. `evidence` contiene emails (69 sellos), números de
--       documento de identidad parcialmente enmascarados (21), nombre completo,
--       notas de verificación, empresa/puesto... También admin_notes y
--       verified_by (id del admin que verificó).
--       Políticas responsables:
--         "Public can view verified stamps"          (20260112_fix_admin_stamps_access.sql:87)
--         "Public can view verified certifications"  (20260122_enable_certification_verification.sql:55)
--   M4. Las vistas stamps_summary y stamp_request_availability se recrearon en
--       20260107_remove_phone_final.sql sin security_invoker: se ejecutan con
--       los permisos del propietario y se saltan la RLS de stamps. anon leía los
--       contadores (pendientes, rechazados, intentos) de todos los perfiles.
--
-- ESTA MIGRACIÓN ES LA FASE 1 (ADITIVA). Las políticas públicas de stamps se
-- eliminan en la fase 2 (20261006_cerrar_columnas_privadas_profiles_stamps.sql),
-- después de desplegar el frontend que ya lee `public_stamps`.
--
-- QUÉ HACE
--   1. Vista public.public_stamps: solo sellos VERIFIED de perfiles publicados
--      (mismo criterio que la política pública de profiles: slug, no oculto, no
--      suspendido) y solo columnas públicas:
--        id, profile_id, type, status, provider, created_at, verified_at,
--        expires_at, entity_id, entity_type, metadata
--      Fuera: evidence, admin_notes, verified_by.
--      `metadata` se mantiene porque components/PublicStampBadges.tsx muestra
--      metadata.certification_name en el perfil público (hoy vacío en los 524).
--      Se ejecuta con los permisos del propietario (filtra explícitamente) y es
--      de solo lectura (SELECT para anon y authenticated).
--      Lectores (frontend nuevo): ProfileViewPage, VerifiedStampsBadge,
--      búsqueda de talento (CompanyTalentSearchPage, AdvancedTalentSearchPage,
--      useTalentSearch). Las pantallas del propio usuario, del gestor y del
--      admin siguen leyendo `stamps` (RLS: propietario / gestor / admin).
--   2. M4: stamps_summary y stamp_request_availability pasan a
--      security_invoker = true (aplican la RLS de stamps de quien consulta) y
--      se retiran a anon. El frontend solo las consulta para el perfil propio
--      (components/dashboard/StampsSection.tsx y StampsVerificationCodeModal.tsx,
--      .eq('profile_id', <perfil del dashboard>)), que la RLS sigue dejando ver
--      (propietario o gestor). No dependen de saltarse la RLS.
--
-- ORDEN DE DESPLIEGUE
--   1. Esta migración (junto con 20261005_proteger_datos_profiles.sql).
--   2. Frontend.
--   3. 20261006_cerrar_columnas_privadas_profiles_stamps.sql.
--   Compatible con el frontend actual (solo añade una vista; las vistas de
--   resumen siguen devolviendo lo mismo al propietario).
--
-- ANTES DE APLICAR (SQL editor), revisar:
--   select policyname, cmd, roles, qual from pg_policies
--    where schemaname = 'public' and tablename = 'stamps' order by cmd, policyname;
--
-- CÓMO REVERTIR
--   DROP VIEW IF EXISTS public.public_stamps;
--   ALTER VIEW public.stamps_summary RESET (security_invoker);
--   ALTER VIEW public.stamp_request_availability RESET (security_invoker);
--   GRANT SELECT ON public.stamps_summary, public.stamp_request_availability TO anon;
--
-- Idempotente.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Vista pública de sellos
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS public.public_stamps;

CREATE VIEW public.public_stamps
WITH (security_barrier = true)
AS
SELECT
  s.id,
  s.profile_id,
  s.type,
  s.status,
  s.provider,
  s.created_at,
  s.verified_at,
  s.expires_at,
  s.entity_id,
  s.entity_type,
  s.metadata
FROM public.stamps s
WHERE s.status = 'VERIFIED'
  AND EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = s.profile_id
      AND p.slug IS NOT NULL
      AND p.profile_hidden IS NOT TRUE
      AND p.is_active IS NOT FALSE
  );

COMMENT ON VIEW public.public_stamps IS
'Sellos VERIFIED de perfiles publicados, sin evidence/admin_notes/verified_by. Solo lectura.';

REVOKE ALL ON public.public_stamps FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.public_stamps TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 2. Vistas de resumen con la RLS de quien consulta (M4)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.stamps_summary') IS NOT NULL THEN
    ALTER VIEW public.stamps_summary SET (security_invoker = true);
    REVOKE ALL ON public.stamps_summary FROM PUBLIC, anon;
    GRANT SELECT ON public.stamps_summary TO authenticated, service_role;
  END IF;
  IF to_regclass('public.stamp_request_availability') IS NOT NULL THEN
    ALTER VIEW public.stamp_request_availability SET (security_invoker = true);
    REVOKE ALL ON public.stamp_request_availability FROM PUBLIC, anon;
    GRANT SELECT ON public.stamp_request_availability TO authenticated, service_role;
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
