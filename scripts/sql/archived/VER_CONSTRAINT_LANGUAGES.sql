-- =====================================================
-- VER CONSTRAINT DE LANGUAGES
-- =====================================================

-- Ver el constraint de nivel de idiomas
SELECT
  'CONSTRAINT languages_level_check' as info,
  pg_get_constraintdef(oid) as definicion
FROM pg_constraint
WHERE conname = 'languages_level_check';

-- Ver estructura completa de la tabla languages
SELECT
  'ESTRUCTURA DE languages' as info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'languages'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver todos los constraints de la tabla
SELECT
  'TODOS LOS CONSTRAINTS' as info,
  conname as constraint_name,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'public.languages'::regclass;
