-- ========================================
-- FIX DEFINITIVO: ELIMINAR EL TRIGGER PROBLEMÁTICO
-- ========================================
-- El trigger on_profiles_created_sync_email está causando que se asignen
-- slugs automáticamente DESPUÉS del INSERT mediante un UPDATE
--
-- SOLUCIÓN: Eliminar completamente ese trigger y mover la sincronización
-- de email a otro lugar
-- ========================================

-- PASO 1: Ver qué trigger está causando el problema
SELECT
    t.tgname,
    p.proname,
    CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END AS timing
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
  AND p.proname = 'on_profiles_created_sync_email';

-- PASO 2: ELIMINAR COMPLETAMENTE el trigger problemático
DROP TRIGGER IF EXISTS on_profiles_created_sync_email ON public.profiles;

-- PASO 3: ELIMINAR la función (ya no la necesitamos)
DROP FUNCTION IF EXISTS public.on_profiles_created_sync_email();

-- PASO 4: Verificar que el trigger fue eliminado
SELECT
    COUNT(*) as triggers_remaining
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
  AND p.proname = 'on_profiles_created_sync_email';
-- Debe retornar 0

-- PASO 5: Limpiar TODOS los slugs automáticos existentes
UPDATE public.profiles
SET slug = NULL
WHERE slug ~ '^user-[0-9a-f]{8,}$';

-- PASO 6: Verificar limpieza
SELECT COUNT(*) as slugs_automaticos_restantes
FROM public.profiles
WHERE slug ~ '^user-[0-9a-f]{8,}$';
-- Debe retornar 0

-- ========================================
-- VERIFICACIÓN FINAL
-- ========================================
-- Ver todos los triggers que quedan en profiles
SELECT
    t.tgname AS trigger_name,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal;
