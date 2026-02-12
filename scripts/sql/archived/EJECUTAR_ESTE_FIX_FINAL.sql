-- ========================================
-- FIX DEFINITIVO: Eliminar TODAS las fuentes de auto-generación de slugs
-- ========================================
-- Este script debe ejecutarse en Supabase Dashboard > SQL Editor
-- ========================================

-- PASO 1: Encontrar TODOS los triggers en la tabla profiles
SELECT
    'Trigger encontrado: ' || t.tgname || ' en tabla ' || c.relname AS info,
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
    p.proname AS function_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'OTHER'
    END AS status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE c.relname = 'profiles'
  AND n.nspname = 'public'
  AND NOT t.tgisinternal;

-- PASO 2: Ver el código de la función on_profiles_created_sync_email
SELECT pg_get_functiondef(p.oid)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'on_profiles_created_sync_email'
  AND n.nspname = 'public';

-- PASO 3: REEMPLAZAR la función para que NO asigne slug
CREATE OR REPLACE FUNCTION public.on_profiles_created_sync_email()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Solo sincronizar el email, NO tocar el slug
  IF NEW.id IS NOT NULL THEN
    UPDATE profiles
    SET email = (SELECT email FROM auth.users WHERE id = NEW.id LIMIT 1)
    -- ❌ REMOVIDO COMPLETAMENTE: slug assignment
    -- Antes: slug = COALESCE(NEW.slug, 'user-' || substring(NEW.id::text from 1 for 8))
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- PASO 4: Verificar que el trigger prevent_auto_slug existe y está habilitado
SELECT
    tgname,
    CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS timing,
    CASE
        WHEN (t.tgtype::int & 4) > 0 AND (t.tgtype::int & 16) > 0 THEN 'INSERT OR UPDATE'
        WHEN (t.tgtype::int & 4) > 0 THEN 'INSERT'
        WHEN (t.tgtype::int & 16) > 0 THEN 'UPDATE'
        ELSE 'OTHER'
    END AS events,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED ✅'
        WHEN 'D' THEN 'DISABLED ❌'
        ELSE 'OTHER'
    END AS status
FROM pg_trigger t
WHERE tgname = 'prevent_auto_slug_trigger'
  AND t.tgrelid = 'public.profiles'::regclass;

-- PASO 5: Limpiar slugs auto-generados existentes de usuarios incompletos
UPDATE public.profiles
SET slug = NULL
WHERE (
  -- UUID completo
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR
  -- Formato user-xxxxxxxx (solo hex)
  slug ~ '^user-[0-9a-f]{8,}$'
)
AND template IS NULL;  -- Solo usuarios que NO han completado el wizard

-- PASO 6: Verificación final - NO debe haber slugs auto-generados en perfiles incompletos
SELECT
  id,
  full_name,
  email,
  slug,
  template,
  CASE
    WHEN slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '❌ UUID DETECTED'
    WHEN slug ~ '^user-[0-9a-f]{8,}$' THEN '❌ AUTO-SLUG DETECTED'
    WHEN slug IS NULL THEN '✅ NULL (CORRECTO)'
    ELSE '✅ CUSTOM SLUG'
  END AS slug_status
FROM public.profiles
WHERE template IS NULL  -- Usuarios incompletos
ORDER BY created_at DESC
LIMIT 20;

-- ========================================
-- INSTRUCCIONES:
-- ========================================
-- 1. Ejecuta este script completo en Supabase Dashboard > SQL Editor
-- 2. Verifica que:
--    - La función on_profiles_created_sync_email fue actualizada
--    - El trigger prevent_auto_slug_trigger está ENABLED
--    - NO hay slugs auto-generados en perfiles incompletos
-- 3. Crea un usuario de prueba nuevo
-- 4. Verifica que el nuevo usuario tiene slug = NULL
-- ========================================
