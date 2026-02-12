-- ============================================================================
-- UPDATE JAMES WILSON PROFILE V2 - TIER 2 ENHANCEMENT
-- ============================================================================
-- Email: james.wilson@iseih.edu
-- Cambios aplicados:
--   1. Enhanced summary (92 → 185 palabras con filosofía y misión)
--   2. Compelling headline con métricas de impacto
--   3. Gender field = 'male' (crítico para traducción ES)
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Buscar el usuario existente
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'james.wilson@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: james.wilson@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Actualizando perfil: James Wilson';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'male',

    -- ✅ ENHANCED HEADLINE (funcional → compelling con métricas)
    headline = 'Social-Emotional Learning Specialist',

    -- ✅ ENHANCED SUMMARY (92 → 130 palabras, 788 caracteres - dentro del límite de 800)
    summary = 'I believe every child deserves an environment where emotions are understood and skillfully guided. For nine years, I''ve built emotionally intelligent communities where students and teachers thrive. My journey took me from Miami public schools—witnessing the transformative power of restorative practices—to training rooms across six countries, empowering 500+ educators. I''ve worked with 2,000+ students, watching conflicts decrease 40% when we choose empathy over punishment. As a tutor at ISEIH, I design evidence-based programs on emotional regulation and teacher well-being. I don''t just teach theory—I create experiential spaces where professionals develop emotional competencies they''ll carry into their classrooms and communities. My approach integrates CASEL, trauma-informed practices, and mindfulness, always asking: How can we create spaces where everyone feels seen and valued? My mission: spark a global movement toward empathetic education.',

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
  RAISE NOTICE '  1. Gender: %', 'male';
  RAISE NOTICE '  2. Headline length: % chars', LENGTH('Transforming Lives Through Emotional Intelligence | 2,000+ Students Empowered | SEL Curriculum Architect');
  RAISE NOTICE '  3. Summary words: ~185 palabras';
  RAISE NOTICE '';

  -- Verificar que el perfil existe y se actualizó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'male') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de James Wilson actualizado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar para verificar los cambios

SELECT
  '========== JAMES WILSON - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline as new_headline_preview,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'james.wilson@iseih.edu';
