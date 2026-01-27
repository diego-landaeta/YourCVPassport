-- Verificar políticas RLS de la tabla skills
-- Ejecuta esto en Supabase SQL Editor

-- Ver todas las políticas de la tabla skills
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
WHERE tablename = 'skills';

-- Ver si RLS está habilitado
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename = 'skills';

-- Test: Intentar leer skills de un perfil específico
-- Reemplaza 'profile_id_here' con un ID real de la tabla anterior
SELECT COUNT(*) as total_skills, profile_id
FROM skills
WHERE profile_id IN (
  SELECT id FROM profiles
  WHERE full_name = 'Emily Harper'
  LIMIT 1
)
GROUP BY profile_id;
