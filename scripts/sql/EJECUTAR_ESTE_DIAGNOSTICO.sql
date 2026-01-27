-- ========================================
-- DIAGNÓSTICO RÁPIDO: ¿QUÉ ESTÁ ASIGNANDO SLUGS AUTOMÁTICAMENTE?
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- PASO 1: Ver qué trigger está asignando el slug
-- ========================================
SELECT
    t.tgname AS "Trigger",
    p.proname AS "Función",
    CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END AS "Momento",
    CASE
        WHEN (t.tgtype::int & 4) > 0 THEN 'INSERT'
        WHEN (t.tgtype::int & 16) > 0 THEN 'UPDATE'
        ELSE 'INSERT/UPDATE'
    END AS "Evento"
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal;

-- PASO 2: Ver el código de la función on_profiles_created_sync_email
-- Esta es la función sospechosa que probablemente está asignando slugs
-- ========================================
SELECT pg_get_functiondef(p.oid) AS "Código de on_profiles_created_sync_email"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'on_profiles_created_sync_email';

-- PASO 3: Ver si hay código con 'user-' (formato de slug automático)
-- ========================================
SELECT
    p.proname AS "Función con user-",
    SUBSTRING(pg_get_functiondef(p.oid) FROM 'user-[^'']+') AS "Fragmento"
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%user-%'
ORDER BY p.proname;

-- PASO 4: TEST DEFINITIVO - Insertar usuario y ver qué slug recibe
-- ========================================
DO $$
DECLARE
    test_id uuid := gen_random_uuid();
    result_slug text;
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, plan)
    VALUES (
        test_id,
        'Test Usuario',
        'test-' || substring(test_id::text from 1 for 8) || '@test.com',
        'professional',
        'Free'
    )
    RETURNING slug INTO result_slug;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'RESULTADO DEL TEST:';
    RAISE NOTICE 'Slug recibido: %', COALESCE(result_slug, 'NULL');

    IF result_slug IS NULL THEN
        RAISE NOTICE '✅ CORRECTO - La BD NO asigna slugs automáticamente';
    ELSIF result_slug ~ '^user-' THEN
        RAISE NOTICE '❌ ERROR - La BD SÍ asigna slugs con formato: %', result_slug;
        RAISE NOTICE 'Revisar función: on_profiles_created_sync_email';
    ELSE
        RAISE NOTICE '❌ ERROR - Slug inesperado: %', result_slug;
    END IF;
    RAISE NOTICE '========================================';

    DELETE FROM public.profiles WHERE id = test_id;
END $$;
