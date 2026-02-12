-- Verificar qué políticas RLS están activas AHORA en skills y languages
-- Ejecuta esto en Supabase SQL Editor

-- 1. Ver políticas actuales en la tabla SKILLS
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'skills' AND schemaname = 'public';

-- 2. Ver políticas actuales en la tabla LANGUAGES
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'languages' AND schemaname = 'public';

-- 3. Probar si puedes leer skills de Emily Harper
SELECT COUNT(*) as total_skills
FROM skills
WHERE profile_id IN (
  SELECT id FROM profiles WHERE full_name = 'Emily Harper'
);

-- Si este COUNT es 0, significa que la política RLS está bloqueando el acceso
-- Si es 15, significa que la política funciona correctamente
