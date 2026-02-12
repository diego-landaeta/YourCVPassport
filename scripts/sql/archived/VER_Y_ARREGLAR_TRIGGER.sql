-- =====================================================
-- DIAGNÓSTICO Y ARREGLO DEL TRIGGER handle_new_user
-- =====================================================

-- 1. Ver el código del trigger
SELECT
  'FUNCIÓN handle_new_user()' as info,
  pg_get_functiondef(oid) as definicion
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 2. Ver qué triggers están activos en auth.users
SELECT
  'TRIGGERS EN auth.users' as info,
  tgname as trigger_name,
  tgenabled as enabled,
  proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'auth.users'::regclass
ORDER BY tgname;

-- 3. Ver la estructura de la tabla profiles
SELECT
  'ESTRUCTURA DE profiles' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
  AND table_schema = 'public'
ORDER BY ordinal_position;
