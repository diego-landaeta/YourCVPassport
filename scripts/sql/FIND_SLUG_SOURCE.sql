-- ========================================
-- ENCONTRAR LA FUENTE DEL SLUG AUTOMÁTICO
-- ========================================

-- 1. Ver TODAS las funciones que mencionan 'slug' y 'user-'
SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_code
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) ILIKE '%user-%'
  AND pg_get_functiondef(p.oid) ILIKE '%slug%';

-- 2. Ver si hay un valor DEFAULT en la columna slug
SELECT
    column_name,
    column_default,
    data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'slug';

-- 3. Ver si hay políticas RLS que modifiquen slug
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 4. Hacer un INSERT de prueba DIRECTO sin pasar por la app
-- Esto nos dirá si el problema está en la base de datos o en el código de la app
INSERT INTO public.profiles (id, full_name, email, role, plan)
VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'::uuid,
    'Test Direct Insert',
    'direct-insert-test@dev.com',
    'professional',
    'Free'
)
RETURNING id, email, slug;

-- Si este INSERT retorna slug = NULL, el problema está en el CÓDIGO DE LA APP
-- Si retorna slug = 'user-xxxxxxxx', el problema está en la BASE DE DATOS
