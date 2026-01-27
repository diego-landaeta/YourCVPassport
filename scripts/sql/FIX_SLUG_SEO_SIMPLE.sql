-- ========================================
-- FIX SIMPLE Y DIRECTO: Prevenir Asignación Automática de Slugs
-- Ejecutar en Supabase SQL Editor
-- Fecha: 2026-01-09
-- ========================================

-- PASO 1: Corregir la función on_profiles_created_sync_email
-- Esta función SOLO debe sincronizar el email, NO el slug
-- ========================================
CREATE OR REPLACE FUNCTION public.on_profiles_created_sync_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- SOLO sincronizar email, NO tocar slug
  IF NEW.id IS NOT NULL THEN
    UPDATE profiles
    SET email = (SELECT email FROM auth.users WHERE id = NEW.id LIMIT 1)
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- PASO 2: Crear función para prevenir slugs automáticos
-- ========================================
CREATE OR REPLACE FUNCTION public.prevent_auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevenir slugs auto-generados (UUID o user-xxxxxxxx)
  IF NEW.slug IS NOT NULL AND (
    NEW.slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR NEW.slug ~ '^user-[0-9a-f]{8,}$'
    OR NEW.slug = NEW.id::text
  ) THEN
    NEW.slug := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- PASO 3: Crear trigger
-- ========================================
DROP TRIGGER IF EXISTS prevent_auto_slug_trigger ON public.profiles;

CREATE TRIGGER prevent_auto_slug_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_auto_slug();

-- PASO 4: Limpiar slugs auto-generados de usuarios sin template
-- ========================================
UPDATE public.profiles
SET slug = NULL
WHERE (
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR slug ~ '^user-[0-9a-f]{8,}$'
)
AND template IS NULL;

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver triggers activos
SELECT
    t.tgname AS trigger_name,
    p.proname AS function_name,
    CASE t.tgenabled WHEN 'O' THEN 'ENABLED' ELSE 'DISABLED' END AS status
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Contar perfiles afectados
SELECT
    COUNT(*) FILTER (WHERE slug IS NULL AND template IS NULL) AS usuarios_sin_completar_wizard,
    COUNT(*) FILTER (WHERE slug IS NOT NULL AND template IS NOT NULL) AS usuarios_con_cv_completo
FROM public.profiles;
