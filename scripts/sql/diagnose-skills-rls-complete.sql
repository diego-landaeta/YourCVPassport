-- ============================================
-- DIAGNÓSTICO COMPLETO DE SKILLS RLS
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Ver si RLS está habilitado en la tabla skills
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'skills' AND schemaname = 'public';

-- 2. Ver TODAS las políticas RLS de la tabla skills
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
WHERE tablename = 'skills' AND schemaname = 'public';

-- 3. Contar skills totales en la base de datos
SELECT COUNT(*) as total_skills FROM skills;

-- 4. Ver skills por perfil (top 10)
SELECT
  p.full_name,
  p.role,
  COUNT(s.id) as skill_count
FROM profiles p
LEFT JOIN skills s ON s.profile_id = p.id
WHERE p.full_name IS NOT NULL
GROUP BY p.id, p.full_name, p.role
ORDER BY skill_count DESC
LIMIT 10;

-- 5. Ver skills de Emily Harper específicamente
SELECT
  p.full_name,
  p.id as profile_id,
  s.name as skill_name
FROM profiles p
LEFT JOIN skills s ON s.profile_id = p.id
WHERE p.full_name = 'Emily Harper'
ORDER BY s.name;

-- 6. Probar acceso público a skills (como lo haría un usuario company)
-- Esta query simula lo que hace la aplicación
SELECT
  s.profile_id,
  s.id,
  s.name
FROM skills s
WHERE s.profile_id IN (
  SELECT id FROM profiles WHERE full_name IN ('Emily Harper', 'David Chen', 'Rachel Stevens')
)
ORDER BY s.name;

-- 7. Ver permisos de la tabla skills
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'skills' AND table_schema = 'public';
