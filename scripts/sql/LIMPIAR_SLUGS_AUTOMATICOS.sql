-- ========================================
-- LIMPIAR todos los slugs automáticos existentes
-- ========================================

-- Ver cuántos hay antes de limpiar
SELECT
    'ANTES de limpiar' AS momento,
    COUNT(*) AS total_slugs_automaticos
FROM public.profiles
WHERE slug ~ '^user-[0-9a-f]{8,}$'
   OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Limpiar slugs automáticos
UPDATE public.profiles
SET slug = NULL,
    slug_validation_error = NULL
WHERE slug ~ '^user-[0-9a-f]{8,}$'
   OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Ver cuántos quedan después de limpiar
SELECT
    'DESPUÉS de limpiar' AS momento,
    COUNT(*) AS total_slugs_automaticos
FROM public.profiles
WHERE slug ~ '^user-[0-9a-f]{8,}$'
   OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Ver estadísticas finales
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
