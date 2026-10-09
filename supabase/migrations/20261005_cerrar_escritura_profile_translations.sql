-- =============================================================================
-- Cerrar la escritura pública en la caché de traducciones `profile_translations`
-- =============================================================================
--
-- PROBLEMA (seguridad)
--   20260202_profile_translations_cache.sql creó políticas INSERT/UPDATE con
--   WITH CHECK (true) / USING (true) para todos (incluido `anon`). Cualquiera
--   con la anon key pública podía escribir el JSON `translated_content` de
--   cualquier perfil y cambiar lo que ven los demás visitantes al ver ese
--   perfil en el otro idioma (envenenamiento de la caché: titular, resumen,
--   experiencia, etc.). Bastaba con poner el source_content_hash vigente, que
--   cualquiera puede calcular con los datos públicos del perfil.
--   Además la lectura era USING (true): también se leían traducciones de
--   perfiles que el lector no puede ver (p. ej. sin slug, no publicados).
--
-- QUÉ HACE
--   1. Elimina las políticas INSERT y UPDATE abiertas. Sin políticas de
--      escritura solo el service role (que ignora RLS) puede escribir. La
--      única vía de escritura es la Edge Function `translate-profile`, que
--      recibe solo { profileId, targetLanguage }, lee el perfil con la anon
--      key (lo que ve un visitante), traduce ella misma y guarda.
--   2. Lectura: solo de traducciones de perfiles que el lector puede ver según
--      la RLS de `profiles` (la subconsulta se evalúa con los permisos de quien
--      lee). Es exactamente lo que usa hoy el frontend:
--        - services/translation/cache/databaseCache.ts lee la fila del perfil
--          que se está mostrando (que ya ha podido leer de `profiles`).
--        - components/admin/TranslationCacheManagement.tsx lista la tabla con
--          un join a profiles (ya dependía de la RLS de profiles).
--   3. REVOKE INSERT/UPDATE/DELETE/TRUNCATE a anon y authenticated (defensa en
--      profundidad, por si en el futuro alguien añade una política abierta).
--   4. Borrado desde el panel de admin: RPC SECURITY DEFINER
--      admin_delete_profile_translations(...) que exige profiles.role = 'admin'.
--      (Hoy el panel hacía DELETE directo, que la RLS ya ignoraba en silencio:
--      la única política DELETE era TO service_role.)
--   Idempotente (DROP POLICY IF EXISTS / CREATE OR REPLACE).
--
-- ORDEN DE DESPLIEGUE (en ningún orden se rompe la traducción de perfiles)
--   1. supabase functions deploy translate-profile --no-verify-jwt
--   2. Esta migración.
--   3. Frontend (parche: saveCachedTranslation pide a translate-profile que
--      cachee; el panel de admin usa la función y la RPC).
--   Qué pasa en los estados intermedios:
--     - Función desplegada, migración no: todo sigue como antes.
--     - Migración aplicada, frontend antiguo: el navegador sigue traduciendo y
--       mostrando el perfil y sigue leyendo la caché; solo fallan (en silencio,
--       console.error) sus escrituras en profile_translations -> sin caché
--       compartida nueva, pero sin errores visibles.
--     - Frontend nuevo sin función desplegada: la llamada a translate-profile
--       falla, se ignora y el perfil se ve traducido igual (sin caché nueva).
--     - Frontend nuevo sin esta migración: la RPC no existe -> borrar desde el
--       panel de admin muestra error en consola; nada más.
--
-- CÓMO REVERTIR (NO recomendado: reabre el agujero)
--   DROP POLICY IF EXISTS "Profile translations readable if profile visible" ON public.profile_translations;
--   CREATE POLICY "Anyone can read profile translations" ON public.profile_translations
--     FOR SELECT USING (true);
--   CREATE POLICY "Anyone can insert profile translations" ON public.profile_translations
--     FOR INSERT WITH CHECK (true);
--   CREATE POLICY "Anyone can update profile translations" ON public.profile_translations
--     FOR UPDATE USING (true);
--   GRANT INSERT, UPDATE ON public.profile_translations TO anon, authenticated;
--   DROP FUNCTION IF EXISTS public.admin_delete_profile_translations(UUID, UUID, VARCHAR, BOOLEAN);
--
-- NOTA: las filas existentes pudieron ser manipuladas mientras la escritura
-- estuvo abierta. Para partir de una caché limpia (se vuelve a llenar sola
-- conforme se visitan perfiles, con coste de nuevas traducciones), ejecutar a
-- mano DESPUÉS de desplegar la función:
--   TRUNCATE public.profile_translations;
-- =============================================================================

BEGIN;

ALTER TABLE public.profile_translations ENABLE ROW LEVEL SECURITY;

-- 1. Fuera las políticas de escritura abiertas
DROP POLICY IF EXISTS "Anyone can insert profile translations" ON public.profile_translations;
DROP POLICY IF EXISTS "Anyone can update profile translations" ON public.profile_translations;
-- "Service role can delete translations" (TO service_role) se deja: es inocua.

-- 2. Lectura: solo si el lector puede ver el perfil
DROP POLICY IF EXISTS "Anyone can read profile translations" ON public.profile_translations;
DROP POLICY IF EXISTS "Profile translations readable if profile visible" ON public.profile_translations;
CREATE POLICY "Profile translations readable if profile visible"
  ON public.profile_translations FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = profile_translations.profile_id
    )
  );

-- 3. Sin privilegios de escritura para los roles públicos
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.profile_translations FROM anon, authenticated;
GRANT SELECT ON public.profile_translations TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_translations TO service_role;

-- 4. Borrado para el panel de admin
--    p_id ............ borra una entrada concreta (botón papelera)
--    p_profile_id .... borra las de un perfil (opcional p_target_language)
--    p_all = true .... vacía la tabla (botón "Limpiar todo")
--    Sin ninguno de los tres: error (evita vaciar la tabla por accidente).
--    Devuelve el número de filas borradas.
CREATE OR REPLACE FUNCTION public.admin_delete_profile_translations(
  p_id UUID DEFAULT NULL,
  p_profile_id UUID DEFAULT NULL,
  p_target_language VARCHAR DEFAULT NULL,
  p_all BOOLEAN DEFAULT false
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted INTEGER := 0;
BEGIN
  -- service_role y conexiones directas: confianza. anon/authenticated: solo admin.
  IF COALESCE(auth.role(), '') IN ('anon', 'authenticated') AND NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'FORBIDDEN: solo un admin puede borrar traducciones de perfiles'
      USING ERRCODE = '42501';
  END IF;

  IF p_all THEN
    DELETE FROM public.profile_translations WHERE true;
  ELSIF p_id IS NOT NULL THEN
    DELETE FROM public.profile_translations WHERE id = p_id;
  ELSIF p_profile_id IS NOT NULL THEN
    DELETE FROM public.profile_translations
     WHERE profile_id = p_profile_id
       AND (p_target_language IS NULL OR target_language = p_target_language);
  ELSE
    RAISE EXCEPTION 'INVALID_ARGUMENTS: indica p_id, p_profile_id o p_all = true'
      USING ERRCODE = '22023';
  END IF;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_delete_profile_translations(UUID, UUID, VARCHAR, BOOLEAN) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_delete_profile_translations(UUID, UUID, VARCHAR, BOOLEAN) TO authenticated, service_role;

COMMENT ON FUNCTION public.admin_delete_profile_translations(UUID, UUID, VARCHAR, BOOLEAN) IS
'Admin: borra entradas de profile_translations (por id, por perfil o todas con p_all). La escritura la hace solo la Edge Function translate-profile.';

COMMIT;
