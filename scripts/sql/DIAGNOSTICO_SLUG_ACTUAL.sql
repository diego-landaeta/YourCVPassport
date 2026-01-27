-- ========================================
-- DIAGNÓSTICO COMPLETO: FUENTE DE ASIGNACIÓN AUTOMÁTICA DE SLUGS
-- Fecha: 2026-01-09
-- ========================================
-- Este script identifica TODAS las posibles fuentes de asignación automática de slugs

-- 1. VERIFICAR TRIGGERS ACTIVOS EN LA TABLA PROFILES
-- ========================================
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
        WHEN 'R' THEN 'REPLICA'
        WHEN 'A' THEN 'ALWAYS'
        ELSE 'UNKNOWN'
    END AS status,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 2. VER CÓDIGO COMPLETO DE TODAS LAS FUNCIONES QUE MENCIONAN 'slug'
-- ========================================
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND (
    pg_get_functiondef(p.oid) ILIKE '%slug%'
    OR p.proname ILIKE '%slug%'
    OR p.proname ILIKE '%profile%'
  )
ORDER BY p.proname;

-- 3. VERIFICAR SI HAY DEFAULT VALUE EN LA COLUMNA SLUG
-- ========================================
SELECT
    column_name,
    column_default,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'slug';

-- 4. VERIFICAR POLÍTICAS RLS QUE PUEDAN MODIFICAR SLUG
-- ========================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd AS command,
    qual AS using_expression,
    with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 5. BUSCAR CUALQUIER CÓDIGO SQL QUE ASIGNE 'user-'
-- ========================================
SELECT
    p.proname AS function_name,
    CASE
        WHEN pg_get_functiondef(p.oid) ILIKE '%user-%' THEN 'CONTIENE user-'
        ELSE 'No contiene'
    END AS contains_user_prefix
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%user-%'
ORDER BY p.proname;

-- 6. TEST: INSERTAR PERFIL DE PRUEBA DIRECTO
-- ========================================
-- Este test nos dice si el problema está en la BD o en la app
-- Si retorna slug = NULL → el problema está en el código de la app
-- Si retorna slug = 'user-xxxxxxxx' o UUID → el problema está en la BD

DO $$
DECLARE
    test_id uuid := gen_random_uuid();
    result_slug text;
BEGIN
    -- Insertar perfil de prueba
    INSERT INTO public.profiles (id, full_name, email, role, plan)
    VALUES (
        test_id,
        'Test Diagnostic User',
        'diagnostic-test-' || test_id::text || '@dev.com',
        'professional',
        'Free'
    )
    RETURNING slug INTO result_slug;

    -- Mostrar resultado
    RAISE NOTICE '========================================';
    RAISE NOTICE 'TEST DE INSERCIÓN DIRECTA';
    RAISE NOTICE 'ID insertado: %', test_id;
    RAISE NOTICE 'Slug resultante: %', COALESCE(result_slug, 'NULL');
    RAISE NOTICE '========================================';

    IF result_slug IS NULL THEN
        RAISE NOTICE '✅ CORRECTO: El slug es NULL, la BD no está auto-asignando';
        RAISE NOTICE 'El problema debe estar en el código de la aplicación';
    ELSIF result_slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        RAISE NOTICE '❌ ERROR: El slug es un UUID (%), la BD está auto-asignando', result_slug;
        RAISE NOTICE 'Revisar triggers y funciones que modifican slug';
    ELSIF result_slug ~ '^user-' THEN
        RAISE NOTICE '❌ ERROR: El slug tiene formato user- (%), la BD está auto-asignando', result_slug;
        RAISE NOTICE 'Probablemente on_profiles_created_sync_email o similar';
    ELSE
        RAISE NOTICE '⚠️ INESPERADO: Slug = %, revisar manualmente', result_slug;
    END IF;

    -- Limpiar el registro de prueba
    DELETE FROM public.profiles WHERE id = test_id;
    RAISE NOTICE 'Registro de prueba eliminado';
END $$;

-- 7. VERIFICAR USUARIOS RECIENTES CON SLUGS AUTO-GENERADOS
-- ========================================
SELECT
    id,
    full_name,
    email,
    slug,
    template,
    created_at,
    CASE
        WHEN slug IS NULL THEN '✅ NULL (correcto)'
        WHEN slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN '❌ UUID auto-generado'
        WHEN slug ~ '^user-[0-9a-f]{8,}$' THEN '❌ user-hex auto-generado'
        ELSE '✅ Slug personalizado'
    END AS slug_status
FROM public.profiles
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 20;

-- 8. RESUMEN DE SLUGS EN EL SISTEMA
-- ========================================
SELECT
    COUNT(*) AS total_profiles,
    COUNT(slug) AS profiles_with_slug,
    COUNT(*) FILTER (WHERE slug IS NULL) AS null_slugs,
    COUNT(*) FILTER (WHERE slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') AS uuid_slugs,
    COUNT(*) FILTER (WHERE slug ~ '^user-[0-9a-f]{8,}$') AS user_hex_slugs,
    COUNT(*) FILTER (WHERE template IS NULL) AS incomplete_wizards
FROM public.profiles;
