-- ========================================
-- SOLUCIÓN DEFINITIVA: Orden de Triggers y Limpieza de Slugs
-- ========================================
-- PROBLEMA: Los triggers se ejecutan en orden alfabético
-- SOLUCIÓN: Renombrar prevent_auto_slug_trigger para que se ejecute AL FINAL
-- ========================================

-- PASO 1: Renombrar prevent_auto_slug_trigger para que se ejecute ÚLTIMO
-- Los triggers BEFORE INSERT se ejecutan en orden alfabético:
-- 1. normalize_profile_role_trigger
-- 2. on_profile_before_insert_sync_email
-- 3. prevent_auto_slug_trigger  <-- necesita ser el último
-- 4. validate_slug_trigger

-- Solución: Renombrar a "zzz_prevent_auto_slug_trigger" para que sea el último alfabéticamente

DROP TRIGGER IF EXISTS prevent_auto_slug_trigger ON public.profiles;
DROP TRIGGER IF EXISTS zzz_prevent_auto_slug_trigger ON public.profiles;

CREATE TRIGGER zzz_prevent_auto_slug_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_auto_slug();

-- PASO 2: Verificar que la función prevent_auto_slug existe y está correcta
SELECT
    'Función prevent_auto_slug' AS verificacion,
    CASE
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'prevent_auto_slug')
        THEN '✅ EXISTE'
        ELSE '❌ NO EXISTE'
    END AS estado;

-- PASO 3: Deshabilitar solo triggers de usuario (NO los del sistema)
-- No usar ALTER TABLE ... DISABLE TRIGGER ALL porque afecta triggers del sistema
-- En su lugar, deshabilitamos solo los triggers específicos que pueden interferir
ALTER TABLE public.profiles DISABLE TRIGGER validate_slug_trigger;
ALTER TABLE public.profiles DISABLE TRIGGER zzz_prevent_auto_slug_trigger;

-- PASO 4: Contar slugs automáticos ANTES de limpiar
DO $$
DECLARE
    count_before INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_before
    FROM public.profiles
    WHERE slug ~ '^user-[0-9a-f]{8,}$'
       OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    RAISE NOTICE '📊 Slugs automáticos encontrados: %', count_before;
END $$;

-- PASO 5: Limpiar slugs automáticos
UPDATE public.profiles
SET slug = NULL,
    slug_validation_error = NULL
WHERE slug ~ '^user-[0-9a-f]{8,}$'
   OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- PASO 6: Contar slugs automáticos DESPUÉS de limpiar
DO $$
DECLARE
    count_after INTEGER;
BEGIN
    SELECT COUNT(*) INTO count_after
    FROM public.profiles
    WHERE slug ~ '^user-[0-9a-f]{8,}$'
       OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

    RAISE NOTICE '✅ Slugs automáticos después de limpiar: % (debe ser 0)', count_after;
END $$;

-- PASO 7: Reactivar los triggers que deshabilitamos
ALTER TABLE public.profiles ENABLE TRIGGER validate_slug_trigger;
ALTER TABLE public.profiles ENABLE TRIGGER zzz_prevent_auto_slug_trigger;

-- PASO 8: Verificar el nuevo orden de triggers
SELECT
    '🔍 ORDEN DE TRIGGERS (alfabético)' AS info,
    ROW_NUMBER() OVER (ORDER BY t.tgname) AS orden,
    t.tgname AS trigger_name,
    CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END AS timing,
    CASE
        WHEN (t.tgtype::int & 4) > 0 AND (t.tgtype::int & 16) > 0 THEN 'INSERT OR UPDATE'
        WHEN (t.tgtype::int & 4) > 0 THEN 'INSERT'
        WHEN (t.tgtype::int & 16) > 0 THEN 'UPDATE'
        ELSE 'OTHER'
    END AS events,
    CASE t.tgenabled
        WHEN 'O' THEN '✅ ENABLED'
        WHEN 'D' THEN '❌ DISABLED'
        ELSE 'OTHER'
    END AS status
FROM pg_trigger t
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
  AND (t.tgtype::int & 66) = 2  -- Solo BEFORE triggers
ORDER BY t.tgname;

-- PASO 9: Estadísticas finales
SELECT
    'Perfiles sin slug (deben completar wizard)' AS categoria,
    COUNT(*) AS cantidad
FROM public.profiles
WHERE slug IS NULL

UNION ALL

SELECT
    'Perfiles con slug personalizado válido' AS categoria,
    COUNT(*) AS cantidad
FROM public.profiles
WHERE slug IS NOT NULL
  AND slug !~ '^user-[0-9a-f]{8,}$'
  AND slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'

UNION ALL

SELECT
    '❌ Slugs automáticos que NO debieran existir' AS categoria,
    COUNT(*) AS cantidad
FROM public.profiles
WHERE slug ~ '^user-[0-9a-f]{8,}$'
   OR slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ✅ Trigger zzz_prevent_auto_slug_trigger se ejecuta ÚLTIMO (orden alfabético)
-- ✅ Todos los slugs automáticos limpiados (count = 0)
-- ✅ Triggers reactivados
-- ✅ Nuevos usuarios tendrán slug = NULL al registrarse
-- ========================================
