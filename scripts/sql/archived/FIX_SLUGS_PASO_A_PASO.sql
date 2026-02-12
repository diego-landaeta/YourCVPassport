-- ========================================
-- PASO A PASO: Fix de slugs automáticos
-- Ejecuta cada sección UNA POR UNA y revisa los resultados
-- ========================================

-- ============ SECCIÓN 1: DIAGNÓSTICO ============
-- Ejecuta esto primero para ver qué triggers existen

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
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'OTHER'
    END AS status,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Copia los resultados y pégalos aquí como comentario para referencia
-- Triggers encontrados:
--
--


-- ============ SECCIÓN 2: CREAR TRIGGER DE PREVENCIÓN ============
-- Ejecuta esta sección completa

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

-- Verificar que se creó correctamente
SELECT 'Trigger prevent_auto_slug_trigger creado' AS resultado;


-- ============ SECCIÓN 3: LIMPIAR SLUGS EXISTENTES ============
-- Ejecuta esta sección para limpiar slugs auto-generados

UPDATE public.profiles
SET slug = NULL
WHERE (
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR
  slug ~ '^user-[0-9a-f]{8,}$'
)
AND template IS NULL;

-- Ver cuántos perfiles se limpiaron
SELECT
    COUNT(*) AS perfiles_limpiados,
    'Slugs auto-generados eliminados de perfiles incompletos' AS descripcion
FROM public.profiles
WHERE slug IS NULL AND template IS NULL;


-- ============ SECCIÓN 4: VERIFICAR USUARIO nose@dev.com ============
-- Ejecuta para ver el estado del usuario

SELECT
    id,
    full_name,
    email,
    slug,
    template,
    CASE
        WHEN slug IS NULL THEN '✅ CORRECTO (NULL)'
        WHEN slug ~ '^user-[0-9a-f]{8,}$' THEN '❌ AUTO-SLUG DETECTADO'
        ELSE 'SLUG PERSONALIZADO'
    END AS slug_status
FROM public.profiles
WHERE email = 'nose@dev.com';


-- ============ SECCIÓN 5: VERIFICACIÓN FINAL ============
-- Ejecuta para ver todos los triggers activos

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


-- ========================================
-- INSTRUCCIONES:
-- 1. Ejecuta SECCIÓN 1 (diagnóstico)
-- 2. Copia los resultados aquí
-- 3. Ejecuta SECCIÓN 2 (crear trigger prevención)
-- 4. Ejecuta SECCIÓN 3 (limpiar slugs)
-- 5. Ejecuta SECCIÓN 4 (verificar nose@dev.com)
-- 6. Ejecuta SECCIÓN 5 (verificación final)
-- 7. CREAR NUEVO USUARIO DE PRUEBA
-- 8. Verificar que el nuevo usuario tenga slug = NULL
-- ========================================
