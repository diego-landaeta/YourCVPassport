-- ========================================
-- DEMO: Inyectar Habilidades Traducibles
-- ========================================
-- Este script añade habilidades de ejemplo en INGLÉS
-- que se traducirán automáticamente al cambiar a ESPAÑOL
-- ========================================

-- NOTA: Reemplaza 'YOUR_USER_ID' con el ID del usuario de prueba
-- Puedes obtenerlo con: SELECT id, email FROM auth.users LIMIT 5;

DO $$
DECLARE
  v_user_id uuid := 'YOUR_USER_ID'; -- 👈 CAMBIAR ESTO
  v_profile_id uuid;
BEGIN
  -- Verificar que el usuario existe
  SELECT id INTO v_profile_id FROM profiles WHERE id = v_user_id;

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado. Por favor actualiza v_user_id con un ID válido.';
  END IF;

  -- Limpiar habilidades existentes para este demo
  DELETE FROM skills WHERE profile_id = v_profile_id;

  -- ========================================
  -- CATEGORÍA: Programming & Tech
  -- ========================================
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_profile_id, 'JavaScript', 'EXPERT', 95, NOW(), NOW()),
    (v_profile_id, 'React', 'ADVANCED', 90, NOW(), NOW()),
    (v_profile_id, 'Python', 'INTERMEDIATE', 75, NOW(), NOW()),
    (v_profile_id, 'Web Development', 'ADVANCED', 85, NOW(), NOW()), -- → "Desarrollo Web"
    (v_profile_id, 'Backend Development', 'INTERMEDIATE', 70, NOW(), NOW()); -- → "Desarrollo Backend"

  -- ========================================
  -- CATEGORÍA: Soft Skills
  -- ========================================
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_profile_id, 'Leadership', 'ADVANCED', 85, NOW(), NOW()), -- → "Liderazgo"
    (v_profile_id, 'Team Management', 'ADVANCED', 80, NOW(), NOW()), -- → "Gestión de Equipos"
    (v_profile_id, 'Communication', 'EXPERT', 90, NOW(), NOW()), -- → "Comunicación"
    (v_profile_id, 'Problem Solving', 'ADVANCED', 85, NOW(), NOW()), -- → "Resolución de Problemas"
    (v_profile_id, 'Critical Thinking', 'INTERMEDIATE', 75, NOW(), NOW()); -- → "Pensamiento Crítico"

  -- ========================================
  -- CATEGORÍA: Design & Creative
  -- ========================================
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_profile_id, 'UI/UX Design', 'ADVANCED', 80, NOW(), NOW()), -- → "Diseño UI/UX"
    (v_profile_id, 'Graphic Design', 'INTERMEDIATE', 70, NOW(), NOW()), -- → "Diseño Gráfico"
    (v_profile_id, 'Prototyping', 'INTERMEDIATE', 65, NOW(), NOW()); -- → "Prototipado"

  -- ========================================
  -- CATEGORÍA: Marketing & Sales
  -- ========================================
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_profile_id, 'Digital Marketing', 'ADVANCED', 85, NOW(), NOW()), -- → "Marketing Digital"
    (v_profile_id, 'SEO', 'INTERMEDIATE', 70, NOW(), NOW()), -- → "SEO" (universal)
    (v_profile_id, 'Content Strategy', 'ADVANCED', 80, NOW(), NOW()), -- → "Estrategia de Contenido"
    (v_profile_id, 'Social Media Marketing', 'INTERMEDIATE', 75, NOW(), NOW()); -- → "Marketing en Redes Sociales"

  -- ========================================
  -- CATEGORÍA: Data & Analytics
  -- ========================================
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_profile_id, 'Data Analysis', 'ADVANCED', 85, NOW(), NOW()), -- → "Análisis de Datos"
    (v_profile_id, 'Machine Learning', 'INTERMEDIATE', 70, NOW(), NOW()), -- → "Aprendizaje Automático"
    (v_profile_id, 'Data Visualization', 'INTERMEDIATE', 75, NOW(), NOW()); -- → "Visualización de Datos"

  -- ========================================
  -- HABILIDAD PERSONALIZADA (Sin traducción)
  -- ========================================
  INSERT INTO skills (profile_id, name, level, percentage, created_at, updated_at)
  VALUES
    (v_profile_id, 'Custom Framework XYZ', 'EXPERT', 95, NOW(), NOW()); -- No se traduce

  RAISE NOTICE '✅ Se han inyectado 21 habilidades de ejemplo con traducciones';
  RAISE NOTICE '🔄 Cambia el idioma de la interfaz para ver las traducciones';
  RAISE NOTICE '📋 Total de skills: %', (SELECT COUNT(*) FROM skills WHERE profile_id = v_profile_id);

END $$;

-- ========================================
-- VERIFICACIÓN
-- ========================================
-- Ejecuta esto después para ver las habilidades:
-- SELECT name, level, percentage FROM skills WHERE profile_id = 'YOUR_USER_ID' ORDER BY created_at;

-- ========================================
-- EJEMPLOS DE TRADUCCIÓN
-- ========================================
/*
INGLÉS → ESPAÑOL:
- Leadership → Liderazgo
- Team Management → Gestión de Equipos
- Web Development → Desarrollo Web
- UI/UX Design → Diseño UI/UX
- Data Analysis → Análisis de Datos
- Problem Solving → Resolución de Problemas
- Digital Marketing → Marketing Digital
- Machine Learning → Aprendizaje Automático

PERMANECEN IGUALES (Universales):
- JavaScript
- React
- Python
- SEO
- Custom Framework XYZ (personalizada)
*/
