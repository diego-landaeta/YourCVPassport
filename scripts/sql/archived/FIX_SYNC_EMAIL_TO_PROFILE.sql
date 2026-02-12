-- ========================================
-- FIX DEFINITIVO: Corregir función sync_email_to_profile
-- Esta es la CUARTA fuente de asignación automática de slugs
-- ========================================

-- Ver el código actual de la función
SELECT pg_get_functiondef(p.oid) AS current_function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'sync_email_to_profile'
  AND n.nspname = 'public';

-- REEMPLAZAR la función para que NO asigne slugs
CREATE OR REPLACE FUNCTION public.sync_email_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- ✅ Solo sincronizar email desde auth.users
  -- ❌ NO tocar el slug bajo ninguna circunstancia
  UPDATE profiles
  SET email = (SELECT email FROM auth.users WHERE id = NEW.id LIMIT 1)
  -- ❌ REMOVIDO: slug = COALESCE(NEW.slug, 'user-' || substring(NEW.id::text from 1 for 8))
  WHERE id = NEW.id;

  RETURN NEW;
END;
$function$;

-- Limpiar el slug del usuario a@dev.com
UPDATE public.profiles
SET slug = NULL
WHERE email = 'a@dev.com' AND template IS NULL;

-- Verificar que a@dev.com ahora tenga slug = NULL
SELECT
    id,
    full_name,
    email,
    slug,
    template,
    CASE
        WHEN slug IS NULL THEN '✅ CORRECTO (slug = NULL)'
        WHEN slug ~ '^user-[0-9a-f]{8,}$' THEN '❌ AUTO-SLUG DETECTADO'
        ELSE 'SLUG PERSONALIZADO'
    END AS slug_status
FROM public.profiles
WHERE email = 'a@dev.com';

-- ========================================
-- DESPUÉS DE EJECUTAR:
-- 1. Crear un NUEVO usuario de prueba (ej: final-test@dev.com)
-- 2. Verificar que el nuevo usuario tenga slug = NULL
-- ========================================
