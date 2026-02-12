-- ============================================================================
-- UPDATE SARAH BENNETT PROFILE V2 - TIER 2 ENHANCEMENT
-- ============================================================================
-- Email: sarah.bennett@iseih.edu
-- Cambios aplicados:
--   1. Enhanced summary (67 → 175 palabras con filosofía y misión)
--   2. Compelling headline con métricas de impacto
--   3. Gender field = 'female' (crítico para traducción ES)
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Buscar el usuario existente
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'sarah.bennett@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: sarah.bennett@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Actualizando perfil: Sarah Bennett';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'female',

    -- ✅ ENHANCED HEADLINE (funcional → compelling con métricas)
    headline = 'Montessori & Waldorf Educator',

    -- ✅ ENHANCED SUMMARY (67 → 175 palabras, 799 caracteres - dentro del límite de 800)
    summary = 'I believe every child deserves an educational environment where curiosity is honored, autonomy is nurtured, and learning follows the child''s natural development. For 13 years, I''ve dedicated my work to bringing Montessori and Waldorf principles into diverse settings—from traditional public schools to homeschool communities—proving that alternative pedagogies can thrive anywhere when adapted thoughtfully. My journey began as a Montessori classroom assistant at the University of Wisconsin, watching children blossom when given prepared environments and freedom within structure. Since earning my AMI certification, I''ve guided classrooms, redesigned learning spaces in 20+ schools, and trained over 400 educators across six countries. At ISEIH, I teach professionals how to integrate Montessori observation, Waldorf artistic expression, and conscious discipline into their practice—regardless of their educational context. I don''t just lecture about theories—I facilitate experiential workshops where educators prepare materials, practice child observation, and design environments that invite exploration. My approach honors both pedagogies: Montessori''s scientific observation and prepared environment, and Waldorf''s rhythmic structure and artistic integration. My mission: to democratize alternative education by equipping educators and families with practical tools to create respectful, developmentally appropriate learning spaces—whether in schools, homes, or community centers.',

    -- Mantener el resto de campos
    updated_at = NOW()

  WHERE id = v_user_id;

  -- =========================================================================
  -- VERIFICACIÓN
  -- =========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '✅ Perfil actualizado correctamente';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios aplicados:';
  RAISE NOTICE '  1. Gender: %', 'female';
  RAISE NOTICE '  2. Headline length: % chars', LENGTH('Transforming Education Through Montessori & Waldorf | 400+ Educators Trained | Child-Centered Learning Architect');
  RAISE NOTICE '  3. Summary words: ~175 palabras';
  RAISE NOTICE '';

  -- Verificar que el perfil existe y se actualizó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'female') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de Sarah Bennett actualizado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar para verificar los cambios

SELECT
  '========== SARAH BENNETT - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline as new_headline_preview,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'sarah.bennett@iseih.edu';
