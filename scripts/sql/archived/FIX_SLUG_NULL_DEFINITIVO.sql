-- ========================================
-- FIX DEFINITIVO: Asignación de Slug SOLO al completar wizard
-- Fecha: 2026-01-09
-- ========================================
-- PROBLEMA: Los usuarios reciben slugs automáticos (UUID o user-xxxxx) al registrarse
-- SOLUCIÓN: El slug debe ser NULL hasta que el usuario complete el wizard
-- ========================================

-- ========================================
-- PASO 1: ELIMINAR el trigger on_profiles_created_sync_email
-- ========================================
-- Este trigger ejecutaba un UPDATE después de cada INSERT que asignaba:
-- slug = COALESCE(NEW.slug, 'user-' || substring(NEW.id::text from 1 for 8))

-- Primero, verificar si existe
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_profiles_created_sync_email'
    ) THEN
        RAISE NOTICE '✓ Trigger on_profiles_created_sync_email ENCONTRADO - será ELIMINADO';
    ELSE
        RAISE NOTICE 'ℹ Trigger on_profiles_created_sync_email NO EXISTE (ya fue eliminado)';
    END IF;
END $$;

-- ELIMINAR el trigger completamente
DROP TRIGGER IF EXISTS on_profiles_created_sync_email ON public.profiles;

-- ELIMINAR la función asociada
DROP FUNCTION IF EXISTS public.on_profiles_created_sync_email();

DO $$
BEGIN
    RAISE NOTICE '✓ Trigger y función on_profiles_created_sync_email ELIMINADOS';
END $$;

-- ========================================
-- PASO 2: CREAR trigger de prevención de slugs automáticos
-- ========================================

CREATE OR REPLACE FUNCTION public.prevent_auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevenir SOLO slugs auto-generados:
  -- 1. UUID completo: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  -- 2. Formato user-hex: user-8b75703f (8+ caracteres hexadecimales)
  -- 3. Slug igual al ID del usuario

  -- ✅ PERMITIR slugs personalizados: "juan-perez-desarrollador", "mi-cv-profesional"
  -- ❌ BLOQUEAR slugs automáticos: "user-8b75703f", UUIDs

  IF NEW.slug IS NOT NULL AND (
    -- UUID completo
    NEW.slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR
    -- Formato user-[hex] (solo caracteres hexadecimales)
    NEW.slug ~ '^user-[0-9a-f]{8,}$'
    OR
    -- Slug igual al ID
    NEW.slug = NEW.id::text
  ) THEN
    NEW.slug := NULL;
    RAISE NOTICE 'AUTO-SLUG BLOQUEADO para usuario %. Slug: "%" establecido a NULL', NEW.id, COALESCE(OLD.slug, NEW.slug);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS prevent_auto_slug_trigger ON public.profiles;

-- Crear trigger BEFORE INSERT OR UPDATE
CREATE TRIGGER prevent_auto_slug_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_auto_slug();

DO $$
BEGIN
    RAISE NOTICE '✓ Trigger prevent_auto_slug_trigger CREADO y ACTIVO';
END $$;

-- ========================================
-- PASO 3: LIMPIAR slugs automáticos existentes
-- ========================================

-- Contar cuántos perfiles tienen slugs automáticos
DO $$
DECLARE
    affected_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO affected_count
    FROM public.profiles
    WHERE (
        -- UUID
        slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        OR
        -- user-hex
        slug ~ '^user-[0-9a-f]{8,}$'
    );

    RAISE NOTICE 'ℹ Perfiles con slugs automáticos encontrados: %', affected_count;
END $$;

-- LIMPIAR slugs automáticos (establecer a NULL)
UPDATE public.profiles
SET slug = NULL
WHERE (
    -- UUID
    slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR
    -- user-hex
    slug ~ '^user-[0-9a-f]{8,}$'
)
-- Solo limpiar perfiles que NO completaron el wizard
-- (si completaron el wizard, es posible que hayan elegido ese slug a propósito)
AND template IS NULL;

-- Contar cuántos fueron limpiados
DO $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cleaned_count
    FROM public.profiles
    WHERE slug IS NULL AND template IS NULL;

    RAISE NOTICE '✓ Perfiles limpiados (slug = NULL): %', cleaned_count;
END $$;

-- ========================================
-- PASO 4: VERIFICACIÓN
-- ========================================

-- Mostrar todos los triggers en la tabla profiles
SELECT
    '═══ TRIGGERS EN profiles ═══' AS info,
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
        WHEN 'O' THEN '✓ ENABLED'
        WHEN 'D' THEN '✗ DISABLED'
        ELSE 'OTHER'
    END AS status,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- Verificar que NO quedan slugs automáticos en perfiles incompletos
SELECT
    '═══ VERIFICACIÓN: Slugs automáticos en perfiles incompletos ═══' AS info,
    COUNT(*) AS count,
    CASE
        WHEN COUNT(*) = 0 THEN '✓ NINGUNO (CORRECTO)'
        ELSE '✗ ATENCIÓN: Aún hay slugs automáticos'
    END AS status
FROM public.profiles
WHERE (
    slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR slug ~ '^user-[0-9a-f]{8,}$'
)
AND template IS NULL;

-- Mostrar perfiles con slug NULL (deben completar wizard)
SELECT
    '═══ Perfiles sin slug (deben completar wizard) ═══' AS info,
    COUNT(*) AS count
FROM public.profiles
WHERE slug IS NULL;

-- Mostrar perfiles con slugs personalizados válidos
SELECT
    '═══ Perfiles con slugs personalizados ═══' AS info,
    COUNT(*) AS count
FROM public.profiles
WHERE slug IS NOT NULL
  AND slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND slug !~ '^user-[0-9a-f]{8,}$';

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ✓ Trigger on_profiles_created_sync_email ELIMINADO
-- ✓ Trigger prevent_auto_slug_trigger CREADO y ACTIVO
-- ✓ Slugs automáticos limpiados en perfiles incompletos
-- ✓ Nuevos usuarios se registrarán con slug = NULL
-- ✓ Usuarios completarán wizard y crearán su slug personalizado en el paso de Finalización
-- ========================================
