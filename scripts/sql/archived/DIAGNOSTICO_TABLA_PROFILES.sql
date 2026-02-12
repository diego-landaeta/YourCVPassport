-- =====================================================
-- DIAGNÓSTICO: Estructura de la tabla PROFILES
-- =====================================================
-- Ejecuta esto en Supabase SQL Editor para ver
-- qué columnas tiene realmente tu tabla profiles
-- =====================================================

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

-- Ver un registro de ejemplo (si existe)
SELECT *
FROM profiles
LIMIT 1;
