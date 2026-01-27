-- ========================================
-- VERIFICAR HABILIDADES EXISTENTES Y SU TRADUCIBILIDAD
-- ========================================
-- Este script analiza todas las habilidades en la BD
-- y muestra cuáles pueden traducirse y cuáles no
-- ========================================

-- PASO 1: Ver todas las habilidades únicas en el sistema
SELECT
  s.name AS "Habilidad Original",
  COUNT(*) AS "Veces Usada",
  COUNT(DISTINCT s.profile_id) AS "Usuarios",
  CASE
    -- Habilidades EN → ES traducibles (muestra comunes)
    WHEN s.name IN ('Leadership', 'Team Management', 'Communication', 'Problem Solving',
                    'Web Development', 'Mobile Development', 'Backend Development',
                    'UI/UX Design', 'Graphic Design', 'Prototyping',
                    'Digital Marketing', 'Content Strategy', 'Social Media Marketing',
                    'Data Analysis', 'Machine Learning', 'Data Visualization',
                    'Project Management', 'Strategic Planning', 'Business Development')
    THEN '✅ Traducible EN→ES'

    -- Habilidades ES → EN traducibles (muestra comunes)
    WHEN s.name IN ('Liderazgo', 'Gestión de Equipos', 'Comunicación', 'Resolución de Problemas',
                    'Desarrollo Web', 'Desarrollo Móvil', 'Desarrollo Backend',
                    'Diseño UI/UX', 'Diseño Gráfico', 'Prototipado',
                    'Marketing Digital', 'Estrategia de Contenido', 'Marketing en Redes Sociales',
                    'Análisis de Datos', 'Aprendizaje Automático', 'Visualización de Datos',
                    'Gestión de Proyectos', 'Planificación Estratégica', 'Desarrollo de Negocios')
    THEN '✅ Traducible ES→EN'

    -- Habilidades universales (sin traducción, son iguales en ambos idiomas)
    WHEN s.name IN ('JavaScript', 'TypeScript', 'React', 'Python', 'Java', 'Node.js',
                    'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes',
                    'Git', 'GitHub', 'SEO', 'SEM', 'CRM', 'API')
    THEN '🌐 Universal (sin traducción)'

    ELSE '⚠️ Personalizada (sin traducción disponible)'
  END AS "Estado de Traducción"
FROM skills s
GROUP BY s.name
ORDER BY COUNT(*) DESC, s.name;

-- ========================================
-- PASO 2: Resumen por categoría de traducibilidad
-- ========================================
WITH skill_translation_status AS (
  SELECT
    CASE
      WHEN s.name IN ('Leadership', 'Team Management', 'Communication', 'Problem Solving',
                      'Web Development', 'Mobile Development', 'Backend Development',
                      'UI/UX Design', 'Graphic Design', 'Prototyping',
                      'Digital Marketing', 'Content Strategy', 'Social Media Marketing',
                      'Data Analysis', 'Machine Learning', 'Data Visualization',
                      'Project Management', 'Strategic Planning', 'Business Development')
      THEN 'Traducible EN→ES'

      WHEN s.name IN ('Liderazgo', 'Gestión de Equipos', 'Comunicación', 'Resolución de Problemas',
                      'Desarrollo Web', 'Desarrollo Móvil', 'Desarrollo Backend',
                      'Diseño UI/UX', 'Diseño Gráfico', 'Prototipado',
                      'Marketing Digital', 'Estrategia de Contenido', 'Marketing en Redes Sociales',
                      'Análisis de Datos', 'Aprendizaje Automático', 'Visualización de Datos',
                      'Gestión de Proyectos', 'Planificación Estratégica', 'Desarrollo de Negocios')
      THEN 'Traducible ES→EN'

      WHEN s.name IN ('JavaScript', 'TypeScript', 'React', 'Python', 'Java', 'Node.js',
                      'SQL', 'MongoDB', 'PostgreSQL', 'Docker', 'Kubernetes',
                      'Git', 'GitHub', 'SEO', 'SEM', 'CRM', 'API')
      THEN 'Universal'

      ELSE 'Personalizada'
    END AS category
  FROM skills s
)
SELECT
  category AS "Categoría",
  COUNT(*) AS "Cantidad de Habilidades",
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) AS "Porcentaje %"
FROM skill_translation_status
GROUP BY category
ORDER BY COUNT(*) DESC;

-- ========================================
-- PASO 3: Habilidades por usuario con estado de traducción
-- ========================================
SELECT
  p.email AS "Usuario",
  p.full_name AS "Nombre Completo",
  s.name AS "Habilidad",
  s.level AS "Nivel",
  CASE
    WHEN s.name IN ('Leadership', 'Team Management', 'Communication', 'Problem Solving',
                    'Web Development', 'UI/UX Design', 'Digital Marketing', 'Data Analysis')
    THEN '✅ Se traduce a español'

    WHEN s.name IN ('Liderazgo', 'Gestión de Equipos', 'Comunicación', 'Resolución de Problemas',
                    'Desarrollo Web', 'Diseño UI/UX', 'Marketing Digital', 'Análisis de Datos')
    THEN '✅ Se traduce a inglés'

    WHEN s.name IN ('JavaScript', 'React', 'Python', 'SEO', 'Git')
    THEN '🌐 Universal'

    ELSE '⚠️ Sin traducción'
  END AS "Estado"
FROM skills s
JOIN profiles p ON s.profile_id = p.id
ORDER BY p.email, s.created_at;

-- ========================================
-- PASO 4: Usuarios sin habilidades traducibles
-- ========================================
WITH user_skills_status AS (
  SELECT
    p.id,
    p.email,
    p.full_name,
    COUNT(s.id) AS total_skills,
    COUNT(CASE
      WHEN s.name IN ('Leadership', 'Team Management', 'Communication', 'Problem Solving',
                      'Web Development', 'Mobile Development', 'Backend Development',
                      'UI/UX Design', 'Graphic Design', 'Prototyping',
                      'Digital Marketing', 'Content Strategy', 'Social Media Marketing',
                      'Data Analysis', 'Machine Learning', 'Data Visualization',
                      'Liderazgo', 'Gestión de Equipos', 'Comunicación', 'Resolución de Problemas',
                      'Desarrollo Web', 'Desarrollo Móvil', 'Desarrollo Backend',
                      'Diseño UI/UX', 'Diseño Gráfico', 'Prototipado',
                      'Marketing Digital', 'Estrategia de Contenido', 'Marketing en Redes Sociales',
                      'Análisis de Datos', 'Aprendizaje Automático', 'Visualización de Datos')
      THEN 1
    END) AS translatable_skills
  FROM profiles p
  LEFT JOIN skills s ON p.id = s.profile_id
  GROUP BY p.id, p.email, p.full_name
)
SELECT
  email AS "Usuario",
  full_name AS "Nombre",
  total_skills AS "Total Habilidades",
  translatable_skills AS "Habilidades Traducibles",
  (total_skills - translatable_skills) AS "Habilidades Personalizadas",
  CASE
    WHEN total_skills = 0 THEN '❌ Sin habilidades'
    WHEN translatable_skills = 0 THEN '⚠️ Solo habilidades personalizadas'
    WHEN translatable_skills = total_skills THEN '✅ Todas traducibles'
    ELSE '✅ Mix de traducibles y personalizadas'
  END AS "Estado"
FROM user_skills_status
WHERE total_skills > 0
ORDER BY total_skills DESC;

-- ========================================
-- PASO 5: Ejemplo de traducción EN ↔ ES
-- ========================================
SELECT
  'Leadership' AS "Original (EN)",
  'Liderazgo' AS "Traducción (ES)"
UNION ALL
SELECT 'Team Management', 'Gestión de Equipos'
UNION ALL
SELECT 'Web Development', 'Desarrollo Web'
UNION ALL
SELECT 'UI/UX Design', 'Diseño UI/UX'
UNION ALL
SELECT 'Digital Marketing', 'Marketing Digital'
UNION ALL
SELECT 'Data Analysis', 'Análisis de Datos'
UNION ALL
SELECT 'Problem Solving', 'Resolución de Problemas'
UNION ALL
SELECT 'Communication', 'Comunicación';

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
/*
🔄 TRADUCCIÓN AUTOMÁTICA EN FRONTEND:
- El sistema traduce automáticamente en el navegador
- No se modifica la base de datos
- Las habilidades mantienen su nombre original en BD
- La traducción es solo de visualización

✅ BENEFICIOS:
- Preserva la intención original del usuario
- Compatible con habilidades personalizadas
- Funciona en tiempo real al cambiar idioma
- No requiere migraciones de datos

📋 HABILIDADES SOPORTADAS:
- 286+ habilidades predefinidas con traducciones
- Categorías: Tech, Soft Skills, Design, Marketing, Data, Business, etc.
- Ver archivo: utils/skillsTranslation.ts
*/
