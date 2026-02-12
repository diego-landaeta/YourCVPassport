-- =====================================================
-- DIAGNÓSTICO: Ver constraints de la tabla PROFILES
-- =====================================================

-- Ver todos los constraints de profiles
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
ORDER BY conname;

-- Ver específicamente el constraint de plan
SELECT
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname = 'profiles_plan_check';

-- Ver si hay un ENUM para plan
SELECT
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%plan%'
ORDER BY e.enumsortorder;

-- Ver la estructura de la columna plan
SELECT
  column_name,
  data_type,
  udt_name,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'plan';
