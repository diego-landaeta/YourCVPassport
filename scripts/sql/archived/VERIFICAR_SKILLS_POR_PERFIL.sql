-- Verificar cuántas skills tiene CADA perfil visible en la página
-- Ejecutar en Supabase SQL Editor

SELECT
  p.full_name,
  p.headline,
  COUNT(s.id) as skill_count,
  ARRAY_AGG(s.name ORDER BY s.name) as all_skills
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
GROUP BY p.id, p.full_name, p.headline
ORDER BY p.full_name;
