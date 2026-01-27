-- ========================================
-- FIX DEFINITIVO Y FINAL - Ejecutar en Supabase Dashboard
-- ========================================

-- PASO 1: Ver el código ACTUAL de la función on_profiles_created_sync_email
SELECT pg_get_functiondef(p.oid) AS function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'on_profiles_created_sync_email'
  AND n.nspname = 'public';

-- PASO 2: REEMPLAZAR la función para que NO asigne slugs
CREATE OR REPLACE FUNCTION public.on_profiles_created_sync_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- ✅ Solo sincronizar email desde auth.users
  -- ❌ NO tocar el slug bajo ninguna circunstancia
  IF NEW.id IS NOT NULL THEN
    UPDATE profiles
    SET email = (SELECT email FROM auth.users WHERE id = NEW.id LIMIT 1)
    -- REMOVIDO COMPLETAMENTE: slug = COALESCE(NEW.slug, 'user-' || substring(NEW.id::text from 1 for 8))
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- PASO 3: HABILITAR el trigger on_profiles_created_sync_email
ALTER TABLE public.profiles ENABLE TRIGGER on_profiles_created_sync_email;

-- PASO 4: Verificar que el trigger prevent_auto_slug_trigger existe
DROP TRIGGER IF EXISTS prevent_auto_slug_trigger ON public.profiles;

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

CREATE TRIGGER prevent_auto_slug_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_auto_slug();

-- PASO 5: Limpiar el slug del usuario nose@dev.com y otros usuarios afectados
UPDATE public.profiles
SET slug = NULL
WHERE (
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR
  slug ~ '^user-[0-9a-f]{8,}$'
)
AND template IS NULL;

-- PASO 6: VERIFICACIÓN FINAL - Mostrar todos los triggers
SELECT
    t.tgname AS trigger_name,
    CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS timing,
    CASE
        WHEN (t.tgtype::int & 4) > 0 AND (t.tgtype::int & 16) > 0 THEN 'INSERT OR UPDATE'
        WHEN (t.tgtype::int & 4) > 0 THEN 'INSERT'
        WHEN (t.tgtype::int & 16) > 0 THEN 'UPDATE'
        WHEN (t.tgtype::int & 8) > 0 THEN 'DELETE'
        ELSE 'OTHER'
    END AS events,
    CASE t.tgenabled
        WHEN 'O' THEN '✅ ENABLED'
        WHEN 'D' THEN '❌ DISABLED'
        ELSE 'OTHER'
    END AS status,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- PASO 7: Verificar estado del usuario nose@dev.com
SELECT
    id,
    full_name,
    email,
    slug,
    template,
    CASE
        WHEN slug IS NULL THEN '✅ CORRECTO (NULL)'
        WHEN slug ~ '^user-[0-9a-f]{8,}$' THEN '❌ AUTO-SLUG DETECTADO'
        ELSE '✅ CUSTOM SLUG'
    END AS slug_status
FROM public.profiles
WHERE email = 'nose@dev.com';

-- ========================================
-- DESPUÉS DE EJECUTAR ESTE SCRIPT:
-- 1. Verificar que ambos triggers muestren "✅ ENABLED"
-- 2. Verificar que nose@dev.com tenga slug = NULL
-- 3. Crear un NUEVO usuario de prueba
-- 4. Verificar que el nuevo usuario tenga slug = NULL
-- ========================================
