-- =============================================================================
-- stamps: un usuario solo puede crear sellos PENDING (no autoverificarse)
-- =============================================================================
--
-- PROBLEMA (seguridad, revisión de integración 2026-10-06)
--   La política "Users can insert their own stamps"
--   (20260112_fix_admin_stamps_access.sql:79) solo comprueba
--   auth.uid() = profile_id. Cualquier usuario podía hacer
--     POST /rest/v1/stamps {profile_id: <su id>, type: 'EMAIL', status: 'VERIFIED'}
--   y lucir un sello verificado sin pasar por la verificación. El sello sale
--   en su CV público (vista public_stamps) y cuenta en búsquedas y ranking.
--
-- QUÉ HACE
--   1. Trigger BEFORE INSERT que, para un usuario autenticado que no es admin,
--      fuerza status = 'PENDING' y verified_at = NULL. No depende de qué otras
--      políticas INSERT existan en producción (las permisivas se suman con OR).
--   2. La política de usuario exige además status = 'PENDING' (defensa en
--      profundidad; con el trigger siempre se cumple).
--   Quién sigue pudiendo crear sellos verificados:
--     - service_role (Edge Functions de verificación, _shared/stampVerification.ts):
--       auth.uid() es NULL y la RLS no aplica.
--     - admins ("Admins can insert stamps" y current_user_is_admin()).
--   El frontend solo inserta PENDING (StampsUploadModal); los usuarios no tienen
--   política UPDATE sobre stamps (20260107_fix_stamps_rls_clean.sql).
--
-- ORDEN DE DESPLIEGUE
--   Después de 20261005_proteger_datos_profiles.sql (current_user_is_admin).
--   Compatible con el frontend actual y con el nuevo.
--
-- ANTES DE APLICAR (SQL editor), revisar sellos que ya pudieran estar
-- autoverificados (verificados sin verified_at ni datos de verificación):
--   select id, profile_id, type, created_at from public.stamps
--    where status = 'VERIFIED' and verified_at is null order by created_at desc;
--
-- CÓMO REVERTIR (reabre la autoverificación)
--   DROP TRIGGER IF EXISTS trg_stamps_forzar_pendiente ON public.stamps;
--   DROP FUNCTION IF EXISTS public.stamps_forzar_pendiente();
--   DROP POLICY IF EXISTS "Users can insert their own stamps" ON public.stamps;
--   CREATE POLICY "Users can insert their own stamps" ON public.stamps
--     FOR INSERT TO authenticated WITH CHECK (auth.uid() = profile_id);
--
-- Idempotente.
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.current_user_is_admin()') IS NULL THEN
    RAISE EXCEPTION 'Falta public.current_user_is_admin(): aplicar antes 20261005_proteger_datos_profiles.sql';
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.stamps_forzar_pendiente()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- auth.uid() NULL: service_role, triggers internos o SQL editor
  IF auth.uid() IS NOT NULL AND NOT public.current_user_is_admin() THEN
    NEW.status := 'PENDING';
    NEW.verified_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.stamps_forzar_pendiente() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_stamps_forzar_pendiente ON public.stamps;
CREATE TRIGGER trg_stamps_forzar_pendiente
  BEFORE INSERT ON public.stamps
  FOR EACH ROW EXECUTE FUNCTION public.stamps_forzar_pendiente();

DROP POLICY IF EXISTS "Users can insert their own stamps" ON public.stamps;
CREATE POLICY "Users can insert their own stamps"
  ON public.stamps FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id AND status = 'PENDING');

-- Otras políticas INSERT no previstas (creadas a mano en el dashboard): solo aviso,
-- el trigger ya las neutraliza.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname, roles, with_check FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'stamps' AND cmd IN ('INSERT', 'ALL')
       AND policyname NOT IN ('Users can insert their own stamps', 'Admins can insert stamps')
  LOOP
    RAISE WARNING 'stamps: política INSERT no prevista "%" (roles %, WITH CHECK %)', r.policyname, r.roles, r.with_check;
  END LOOP;
END $$;

COMMIT;
