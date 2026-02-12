-- ========================================
-- DIAGNÓSTICO URGENTE: ¿QUÉ ESTÁ CREANDO LOS SLUGS?
-- ========================================

-- 1. Ver si la columna slug tiene un DEFAULT VALUE
SELECT
    column_name,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND column_name = 'slug';

-- 2. Ver TODOS los triggers en profiles
SELECT
    t.tgname,
    p.proname,
    CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        ELSE 'AFTER'
    END AS timing,
    CASE
        WHEN (t.tgtype::int & 4) > 0 THEN 'INSERT'
        WHEN (t.tgtype::int & 16) > 0 THEN 'UPDATE'
        ELSE 'OTHER'
    END AS event
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal;

-- 3. Ver el código de TODAS las funciones relacionadas con profiles
SELECT
    p.proname,
    pg_get_functiondef(p.oid) AS codigo
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    p.proname ILIKE '%profile%'
    OR pg_get_functiondef(p.oid) ILIKE '%profiles%'
  )
ORDER BY p.proname;

-- 4. Hacer un TEST: Insertar directamente y ver qué slug recibe
DO $$
DECLARE
    test_id uuid := gen_random_uuid();
    result_slug text;
BEGIN
    -- Insertar SIN especificar slug
    INSERT INTO public.profiles (id, full_name, email, role, plan)
    VALUES (
        test_id,
        'Test Urgente',
        'test-urgente-' || test_id::text || '@test.com',
        'professional',
        'Free'
    )
    RETURNING slug INTO result_slug;

    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST INSERT DIRECTO';
    RAISE NOTICE 'Slug recibido inmediatamente después del INSERT: %', COALESCE(result_slug, 'NULL');

    -- Esperar un momento y volver a leer (por si un trigger AFTER lo modifica)
    PERFORM pg_sleep(0.1);

    SELECT slug INTO result_slug
    FROM public.profiles
    WHERE id = test_id;

    RAISE NOTICE 'Slug después de 0.1 segundos: %', COALESCE(result_slug, 'NULL');
    RAISE NOTICE '========================================';

    -- Limpiar
    DELETE FROM public.profiles WHERE id = test_id;

    IF result_slug IS NOT NULL THEN
        RAISE WARNING '❌ EL SLUG SE SIGUE ASIGNANDO AUTOMÁTICAMENTE: %', result_slug;
    ELSE
        RAISE NOTICE '✅ El slug es NULL (correcto)';
    END IF;
END $$;
