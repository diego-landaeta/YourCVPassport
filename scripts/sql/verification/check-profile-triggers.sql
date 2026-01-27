-- Verificar si hay triggers o funciones que crean perfiles automáticamente
-- Ejecuta esto en Supabase SQL Editor para ver qué está creando los slugs UUID

-- 1. Ver todos los triggers en la tabla profiles
SELECT
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_table = 'profiles'
ORDER BY trigger_name;

-- 2. Ver todas las funciones que mencionan 'profiles' o 'slug'
SELECT
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (routine_definition ILIKE '%profiles%' OR routine_definition ILIKE '%slug%')
ORDER BY routine_name;

-- 3. Ver la definición de la tabla profiles
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Ver políticas RLS que podrían estar insertando datos
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
