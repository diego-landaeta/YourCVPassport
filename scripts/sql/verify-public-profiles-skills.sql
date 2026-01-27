-- Verificar qué perfiles aparecen en búsqueda de talentos y tienen skills
-- Ejecutar en Supabase SQL Editor

-- 1. Ver perfiles que aparecen en búsqueda (con name y headline)
SELECT
  full_name,
  headline,
  slug,
  role,
  COUNT(s.id) as skill_count
FROM profiles p
LEFT JOIN skills s ON s.profile_id = p.id
WHERE p.full_name IS NOT NULL
  AND p.full_name != ''
  AND p.headline IS NOT NULL
  AND p.headline != ''
  AND p.role != 'admin'
GROUP BY p.id, p.full_name, p.headline, p.slug, p.role
ORDER BY skill_count DESC
LIMIT 20;

-- 2. Específicamente Emily Harper, David Chen, Rachel Stevens
SELECT
  p.full_name,
  p.headline,
  p.slug,
  p.role,
  COUNT(s.id) as skill_count,
  ARRAY_AGG(s.name ORDER BY s.name) as skills
FROM profiles p
LEFT JOIN skills s ON s.profile_id = p.id
WHERE p.full_name IN ('Emily Harper', 'David Chen', 'Rachel Stevens')
GROUP BY p.id, p.full_name, p.headline, p.slug, p.role;

-- 3. Contar perfiles con/sin skills
SELECT
  has_skills,
  COUNT(*) as profile_count
FROM (
  SELECT
    p.id,
    CASE
      WHEN COUNT(s.id) > 0 THEN 'Con skills'
      ELSE 'Sin skills'
    END as has_skills
  FROM profiles p
  LEFT JOIN skills s ON s.profile_id = p.id
  WHERE p.full_name IS NOT NULL
    AND p.full_name != ''
    AND p.headline IS NOT NULL
    AND p.headline != ''
    AND p.role != 'admin'
  GROUP BY p.id
) subquery
GROUP BY has_skills;

-- 4. Ver todos los perfiles de prueba con sus skills
SELECT
  p.full_name,
  COUNT(s.id) as skill_count
FROM profiles p
LEFT JOIN skills s ON s.profile_id = p.id
WHERE p.full_name IN (
  'Emily Harper', 'David Chen', 'Rachel Stevens',
  'Jennifer Martinez', 'Michael Thompson', 'Lisa Morrison',
  'Marcus Williams', 'Robert Green', 'Sarah Bennett'
)
GROUP BY p.id, p.full_name
ORDER BY p.full_name;
