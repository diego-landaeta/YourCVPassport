-- Verificar cuántas skills tienen los perfiles de prueba
-- Ejecuta esto en Supabase SQL Editor

-- Contar skills por perfil
SELECT
  p.full_name,
  COUNT(s.id) as total_skills,
  ARRAY_AGG(s.name ORDER BY s.name) as skill_names
FROM profiles p
LEFT JOIN skills s ON s.profile_id = p.id
WHERE p.full_name IN (
  'Emily Harper',
  'David Chen',
  'Rachel Stevens',
  'Jennifer Martinez',
  'Michael Thompson',
  'Lisa Morrison',
  'Marcus Williams',
  'Robert Green',
  'Sarah Bennett'
)
GROUP BY p.id, p.full_name
ORDER BY p.full_name;

-- Ver todos los perfiles y sus conteos de skills
SELECT
  p.full_name,
  p.headline,
  COUNT(s.id) as total_skills
FROM profiles p
LEFT JOIN skills s ON s.profile_id = p.id
WHERE p.full_name IS NOT NULL
  AND p.headline IS NOT NULL
  AND p.role != 'admin'
GROUP BY p.id, p.full_name, p.headline
ORDER BY total_skills DESC
LIMIT 20;
