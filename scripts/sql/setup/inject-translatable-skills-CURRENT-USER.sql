-- ========================================
-- INYECTAR HABILIDADES TRADUCIBLES AL USUARIO ACTUAL
-- ========================================
-- Este script obtiene automáticamente el usuario logueado
-- y le añade 21 habilidades de ejemplo traducibles
-- ========================================

DO $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_skills_count int;
BEGIN
  -- Obtener el primer usuario de la tabla profiles (el más reciente)
  SELECT id, email INTO v_user_id, v_user_email
  FROM profiles
  ORDER BY created_at DESC
  LIMIT 1;

  -- Verificar que existe un usuario
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró ningún usuario en la base de datos. Por favor crea un usuario primero.';
  END IF;

  RAISE NOTICE '========================================';
  RAISE NOTICE '📧 Usuario encontrado: %', v_user_email;
  RAISE NOTICE '🆔 User ID: %', v_user_id;
  RAISE NOTICE '========================================';

  -- Contar habilidades actuales
  SELECT COUNT(*) INTO v_skills_count FROM skills WHERE profile_id = v_user_id;
  RAISE NOTICE '📊 Habilidades actuales: %', v_skills_count;

  -- Preguntar si desea eliminar las existentes (comentar/descomentar según necesidad)
  -- DELETE FROM skills WHERE profile_id = v_user_id;
  -- RAISE NOTICE '🗑️  Habilidades anteriores eliminadas';

  -- ========================================
  -- CATEGORÍA: Programming & Tech
  -- ========================================
  RAISE NOTICE '💻 Inyectando habilidades de Programming & Tech...';
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_user_id, 'JavaScript', 'EXPERT', 95, NOW(), NOW()),
    (v_user_id, 'React', 'ADVANCED', 90, NOW(), NOW()),
    (v_user_id, 'Python', 'INTERMEDIATE', 75, NOW(), NOW()),
    (v_user_id, 'Web Development', 'ADVANCED', 85, NOW(), NOW()), -- → "Desarrollo Web"
    (v_user_id, 'Backend Development', 'INTERMEDIATE', 70, NOW(), NOW()) -- → "Desarrollo Backend"
  ON CONFLICT (profile_id, name) DO NOTHING;

  -- ========================================
  -- CATEGORÍA: Soft Skills
  -- ========================================
  RAISE NOTICE '🤝 Inyectando Soft Skills...';
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_user_id, 'Leadership', 'ADVANCED', 85, NOW(), NOW()), -- → "Liderazgo"
    (v_user_id, 'Team Management', 'ADVANCED', 80, NOW(), NOW()), -- → "Gestión de Equipos"
    (v_user_id, 'Communication', 'EXPERT', 90, NOW(), NOW()), -- → "Comunicación"
    (v_user_id, 'Problem Solving', 'ADVANCED', 85, NOW(), NOW()), -- → "Resolución de Problemas"
    (v_user_id, 'Critical Thinking', 'INTERMEDIATE', 75, NOW(), NOW()) -- → "Pensamiento Crítico"
  ON CONFLICT (profile_id, name) DO NOTHING;

  -- ========================================
  -- CATEGORÍA: Design & Creative
  -- ========================================
  RAISE NOTICE '🎨 Inyectando habilidades de Design & Creative...';
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_user_id, 'UI/UX Design', 'ADVANCED', 80, NOW(), NOW()), -- → "Diseño UI/UX"
    (v_user_id, 'Graphic Design', 'INTERMEDIATE', 70, NOW(), NOW()), -- → "Diseño Gráfico"
    (v_user_id, 'Prototyping', 'INTERMEDIATE', 65, NOW(), NOW()) -- → "Prototipado"
  ON CONFLICT (profile_id, name) DO NOTHING;

  -- ========================================
  -- CATEGORÍA: Marketing & Sales
  -- ========================================
  RAISE NOTICE '📈 Inyectando habilidades de Marketing & Sales...';
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_user_id, 'Digital Marketing', 'ADVANCED', 85, NOW(), NOW()), -- → "Marketing Digital"
    (v_user_id, 'SEO', 'INTERMEDIATE', 70, NOW(), NOW()), -- → "SEO" (universal)
    (v_user_id, 'Content Strategy', 'ADVANCED', 80, NOW(), NOW()), -- → "Estrategia de Contenido"
    (v_user_id, 'Social Media Marketing', 'INTERMEDIATE', 75, NOW(), NOW()) -- → "Marketing en Redes Sociales"
  ON CONFLICT (profile_id, name) DO NOTHING;

  -- ========================================
  -- CATEGORÍA: Data & Analytics
  -- ========================================
  RAISE NOTICE '📊 Inyectando habilidades de Data & Analytics...';
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_user_id, 'Data Analysis', 'ADVANCED', 85, NOW(), NOW()), -- → "Análisis de Datos"
    (v_user_id, 'Machine Learning', 'INTERMEDIATE', 70, NOW(), NOW()), -- → "Aprendizaje Automático"
    (v_user_id, 'Data Visualization', 'INTERMEDIATE', 75, NOW(), NOW()) -- → "Visualización de Datos"
  ON CONFLICT (profile_id, name) DO NOTHING;

  -- ========================================
  -- HABILIDAD PERSONALIZADA (Sin traducción)
  -- ========================================
  RAISE NOTICE '⚙️ Inyectando habilidad personalizada...';
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_user_id, 'Custom Framework XYZ', 'EXPERT', 95, NOW(), NOW()) -- No se traduce
  ON CONFLICT (profile_id, name) DO NOTHING;

  -- Contar habilidades finales
  SELECT COUNT(*) INTO v_skills_count FROM skills WHERE profile_id = v_user_id;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ ¡Inyección completada!';
  RAISE NOTICE '📋 Total de habilidades: %', v_skills_count;
  RAISE NOTICE '🔄 Cambia el idioma en la app para ver las traducciones';
  RAISE NOTICE '========================================';

END $$;

-- ========================================
-- VERIFICACIÓN RÁPIDA
-- ========================================
-- Ver todas las habilidades inyectadas:
SELECT
  p.email,
  s.name,
  s.level,
  s.percentage
FROM skills s
JOIN profiles p ON s.profile_id = p.id
ORDER BY p.created_at DESC, s.created_at DESC
LIMIT 25;
