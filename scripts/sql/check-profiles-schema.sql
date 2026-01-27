-- Verificar qué columnas existen en la tabla profiles
-- Ejecutar en Supabase SQL Editor

-- Ver todas las columnas de la tabla profiles
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;
