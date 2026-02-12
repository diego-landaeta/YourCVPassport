-- ========================================
-- EJECUTAR ESTE SCRIPT COMPLETO EN SUPABASE
-- ========================================

-- PASO 1: Ver el código actual de prevent_auto_slug
SELECT pg_get_functiondef(p.oid) AS current_prevent_auto_slug_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'prevent_auto_slug'
  AND n.nspname = 'public';

-- PASO 2: Ver el código de sync_email_to_profile_before (puede ser el que asigna slugs)
SELECT p.proname AS function_name, pg_get_functiondef(p.oid) AS function_code
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgname = 'on_profile_before_insert_sync_email'
  AND t.tgrelid = 'public.profiles'::regclass;

-- PASO 3: ACTUALIZAR la función prevent_auto_slug con el código correcto
CREATE OR REPLACE FUNCTION public.prevent_auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- SOLO prevenir slugs AUTO-GENERADOS
  IF NEW.slug IS NOT NULL AND (
    -- UUID completo
    NEW.slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR
    -- user-xxxxxxxx (solo hex, 8+ caracteres)
    NEW.slug ~ '^user-[0-9a-f]{8,}$'
    OR
    -- Slug igual al ID
    NEW.slug = NEW.id::text
  ) THEN
    NEW.slug := NULL;
    RAISE NOTICE 'Auto-slug BLOCKED for user %. Setting slug to NULL.', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 4: Limpiar slugs auto-generados de usuarios incompletos
UPDATE public.profiles
SET slug = NULL
WHERE (
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR
  slug ~ '^user-[0-9a-f]{8,}$'
)
AND template IS NULL;

-- PASO 5: Verificar el estado de nose@dev.com
SELECT
    id,
    full_name,
    email,
    slug,
    template,
    created_at,
    CASE
        WHEN slug IS NULL THEN '✅ CORRECTO (slug = NULL)'
        WHEN slug ~ '^user-[0-9a-f]{8,}$' THEN '❌ AUTO-SLUG DETECTADO'
        ELSE 'SLUG PERSONALIZADO'
    END AS slug_status
FROM public.profiles
WHERE email = 'nose@dev.com';

-- PASO 6: Contar cuántos perfiles tienen slugs auto-generados
SELECT
    COUNT(*) FILTER (WHERE slug ~ '^user-[0-9a-f]{8,}$' AND template IS NULL) AS auto_slugs_incompletos,
    COUNT(*) FILTER (WHERE slug IS NULL AND template IS NULL) AS sin_slug_incompletos,
    COUNT(*) FILTER (WHERE slug IS NOT NULL AND template IS NOT NULL) AS con_slug_completados
FROM public.profiles;

-- ========================================
-- DESPUÉS DE EJECUTAR:
-- 1. Revisa los resultados del PASO 1 y PASO 2 (código de funciones)
-- 2. Verifica que nose@dev.com tenga slug = NULL (PASO 5)
-- 3. CREA UN NUEVO USUARIO DE PRUEBA
-- 4. Verifica que el nuevo usuario tenga slug = NULL
-- ========================================
