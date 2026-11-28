-- =============================================================================
-- profiles: quitar la política "allow_all" (FOR ALL, USING true, WITH CHECK true)
-- =============================================================================
--
-- PROBLEMA (seguridad, 2026-10-07)
--   En producción existía, creada desde el dashboard (no está en el repo), la
--   política "allow_all" FOR ALL TO public USING (true) WITH CHECK (true).
--   Cualquiera con la anon key podía leer, modificar y borrar cualquier fila de
--   profiles, y anulaba las políticas SELECT de 20261005_proteger_datos_profiles
--   (que a propósito no toca las FOR ALL): los perfiles ocultos seguían visibles.
--
-- QUÉ HACE
--   1. DROP POLICY "allow_all".
--   2. Lo que solo cubría allow_all y sí se usa: el panel de admin actualiza
--      perfiles ajenos (UserModeration, ProfilesManagement). Se crean
--      "Admins can update all profiles" y "Admins can delete profiles" con
--      public.current_user_is_admin() (de 20261005_proteger_datos_profiles).
--   Lo demás ya tiene su política: INSERT propio, UPDATE propio y del gestor,
--   SELECT público/propio/gestor/admin. Las Edge Functions usan service_role.
--
-- REQUIERE: 20261005_proteger_datos_profiles.sql aplicada antes.
--
-- REVERTIR (NO recomendado: reabre la tabla entera a anon)
--   CREATE POLICY allow_all ON public.profiles FOR ALL USING (true) WITH CHECK (true);
--
-- Idempotente.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS allow_all ON public.profiles;

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.current_user_is_admin());

COMMIT;

NOTIFY pgrst, 'reload schema';
