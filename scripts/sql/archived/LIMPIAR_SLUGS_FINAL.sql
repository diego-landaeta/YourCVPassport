-- ========================================
-- LIMPIAR slugs automáticos - DESHABILITANDO TRIGGERS
-- ========================================

-- PASO 1: Deshabilitar el trigger validate_slug_trigger temporalmente
ALTER TABLE public.profiles DISABLE TRIGGER validate_slug_trigger;

-- PASO 2: Ver cuántos slugs automáticos hay antes de limpiar
SELECT
    'ANTES de limpiar' AS momento,
    COUNT(*) AS total_slugs_automaticos
FROM public.profiles
WHERE slug ~ '^user-[0-9a-f]{8,}$'
   OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- PASO 3: Limpiar slugs automáticos
UPDATE public.profiles
SET slug = NULL,
    slug_validation_error = NULL
WHERE slug ~ '^user-[0-9a-f]{8,}$'
   OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- PASO 4: Reactivar el trigger validate_slug_trigger
ALTER TABLE public.profiles ENABLE TRIGGER validate_slug_trigger;

-- PASO 5: Verificar que no quedan slugs automáticos
SELECT
    'DESPUÉS de limpiar' AS momento,
    COUNT(*) AS total_slugs_automaticos
FROM public.profiles
WHERE slug ~ '^user-[0-9a-f]{8,}$'
   OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- PASO 6: Estadísticas finales
SELECT
    'Total perfiles sin slug (deben completar wizard)' AS categoria,
    COUNT(*) AS cantidad
FROM public.profiles
WHERE slug IS NULL

UNION ALL

SELECT
    'Total perfiles con slug personalizado válido' AS categoria,
    COUNT(*) AS cantidad
FROM public.profiles
WHERE slug IS NOT NULL
  AND slug !~ '^user-[0-9a-f]{8,}$'
  AND slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- PASO 7: Verificar que el trigger está activo de nuevo
SELECT
    'Estado del trigger validate_slug_trigger' AS verificacion,
    CASE t.tgenabled
        WHEN 'O' THEN '✅ ENABLED'
        WHEN 'D' THEN '❌ DISABLED'
        ELSE 'OTHER'
    END AS status
FROM pg_trigger t
WHERE t.tgname = 'validate_slug_trigger'
  AND t.tgrelid = 'public.profiles'::regclass;
