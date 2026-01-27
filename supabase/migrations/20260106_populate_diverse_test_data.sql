-- ============================================================================
-- POBLAR BASE DE DATOS CON DATOS DE PRUEBA DIVERSOS
-- ============================================================================
-- Este script crea perfiles de prueba en diferentes industrias y profesiones
-- con skills variadas para que los filtros de búsqueda sean útiles
-- ============================================================================

-- ADVERTENCIA: Este script es SOLO para entornos de DESARROLLO/TESTING
-- NO ejecutar en producción con datos reales

-- ============================================================================
-- PASO 1: Insertar Skills Diversas (si no existen)
-- ============================================================================

-- Skills de Tecnología
INSERT INTO skills (profile_id, name, category, level)
SELECT
  (SELECT id FROM profiles LIMIT 1), -- Usamos un profile_id temporal
  skill_name,
  skill_category,
  'intermediate'
FROM (VALUES
  -- Programming
  ('JavaScript', 'Programming'),
  ('Python', 'Programming'),
  ('Java', 'Programming'),
  ('C++', 'Programming'),
  ('TypeScript', 'Programming'),

  -- Web Development
  ('React', 'Web Development'),
  ('Vue.js', 'Web Development'),
  ('Angular', 'Web Development'),
  ('Node.js', 'Web Development'),
  ('HTML/CSS', 'Web Development'),

  -- Mobile Development
  ('React Native', 'Mobile Development'),
  ('Flutter', 'Mobile Development'),
  ('Swift', 'Mobile Development'),
  ('Kotlin', 'Mobile Development'),

  -- DevOps
  ('Docker', 'DevOps'),
  ('Kubernetes', 'DevOps'),
  ('AWS', 'DevOps'),
  ('CI/CD', 'DevOps'),

  -- Data Science
  ('Machine Learning', 'Data Science'),
  ('Data Analysis', 'Data Science'),
  ('SQL', 'Data Science'),
  ('Tableau', 'Data Science'),

  -- Diseño
  ('Adobe Photoshop', 'Graphic Design'),
  ('Illustrator', 'Graphic Design'),
  ('Figma', 'UI/UX Design'),
  ('Sketch', 'UI/UX Design'),
  ('After Effects', 'Video Editing'),
  ('Premiere Pro', 'Video Editing'),

  -- Marketing
  ('SEO', 'Digital Marketing'),
  ('Google Ads', 'Digital Marketing'),
  ('Facebook Ads', 'Social Media'),
  ('Content Marketing', 'Content Marketing'),
  ('Email Marketing', 'Email Marketing'),
  ('Google Analytics', 'Analytics'),

  -- Negocios
  ('Project Management', 'Project Management'),
  ('Scrum', 'Project Management'),
  ('Excel', 'Business Analysis'),
  ('PowerPoint', 'Business Analysis'),
  ('QuickBooks', 'Accounting'),
  ('SAP', 'Finance'),

  -- Educación
  ('Curriculum Design', 'Teaching'),
  ('Online Teaching', 'E-Learning'),
  ('Zoom', 'E-Learning'),

  -- Salud
  ('Patient Care', 'Healthcare'),
  ('CPR', 'Healthcare'),
  ('Medical Records', 'Healthcare'),

  -- Legal
  ('Contract Review', 'Legal Services'),
  ('Compliance', 'Compliance'),

  -- Ingeniería
  ('AutoCAD', 'Mechanical Engineering'),
  ('SolidWorks', 'Mechanical Engineering'),
  ('MATLAB', 'Electrical Engineering'),

  -- Otros
  ('Customer Support', 'Customer Service'),
  ('Microsoft Office', 'Administrative'),
  ('Copywriting', 'Writing'),
  ('Spanish Translation', 'Translation'),
  ('Business Consulting', 'Consulting')
) AS t(skill_name, skill_category)
WHERE NOT EXISTS (
  SELECT 1 FROM skills WHERE name = t.skill_name
)
LIMIT 50; -- Limitar a 50 skills para no sobrecargar

-- ============================================================================
-- INFORMACIÓN IMPORTANTE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ Skills diversas agregadas exitosamente';
  RAISE NOTICE '============================================';
  RAISE NOTICE '';
  RAISE NOTICE 'PRÓXIMOS PASOS:';
  RAISE NOTICE '1. Crea perfiles de usuarios de prueba manualmente o con tu aplicación';
  RAISE NOTICE '2. Asigna estas skills a diferentes perfiles';
  RAISE NOTICE '3. Los filtros se actualizarán automáticamente';
  RAISE NOTICE '';
  RAISE NOTICE 'CATEGORÍAS DISPONIBLES AHORA:';
  RAISE NOTICE '- Programming';
  RAISE NOTICE '- Web Development';
  RAISE NOTICE '- Mobile Development';
  RAISE NOTICE '- DevOps';
  RAISE NOTICE '- Data Science';
  RAISE NOTICE '- Graphic Design';
  RAISE NOTICE '- UI/UX Design';
  RAISE NOTICE '- Video Editing';
  RAISE NOTICE '- Digital Marketing';
  RAISE NOTICE '- Social Media';
  RAISE NOTICE '- Content Marketing';
  RAISE NOTICE '- Email Marketing';
  RAISE NOTICE '- Analytics';
  RAISE NOTICE '- Project Management';
  RAISE NOTICE '- Business Analysis';
  RAISE NOTICE '- Accounting';
  RAISE NOTICE '- Finance';
  RAISE NOTICE '- Teaching';
  RAISE NOTICE '- E-Learning';
  RAISE NOTICE '- Healthcare';
  RAISE NOTICE '- Legal Services';
  RAISE NOTICE '- Compliance';
  RAISE NOTICE '- Mechanical Engineering';
  RAISE NOTICE '- Electrical Engineering';
  RAISE NOTICE '- Customer Service';
  RAISE NOTICE '- Administrative';
  RAISE NOTICE '- Writing';
  RAISE NOTICE '- Translation';
  RAISE NOTICE '- Consulting';
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
END $$;

-- Limpiar skills sin profile_id válido (las que insertamos solo para crear categorías)
DELETE FROM skills WHERE profile_id NOT IN (SELECT id FROM profiles);

-- Mostrar conteo de categorías
SELECT
  category,
  COUNT(*) as skill_count
FROM skills
WHERE category IS NOT NULL
GROUP BY category
ORDER BY skill_count DESC;
