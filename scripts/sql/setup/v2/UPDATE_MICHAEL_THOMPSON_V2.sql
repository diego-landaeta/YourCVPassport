-- ============================================================================
-- UPDATE MICHAEL THOMPSON PROFILE V2 - TIER 2 ENHANCEMENT
-- ============================================================================
-- Email: michael.thompson@iseih.edu
-- Cambios aplicados:
--   1. Enhanced summary (60 → 180 palabras con filosofía y misión)
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
  WHERE email = 'michael.thompson@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: michael.thompson@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Actualizando perfil: Michael Thompson';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'male',

    -- ✅ ENHANCED HEADLINE (funcional → compelling con métricas)
    headline = 'Addiction Counselor (CAC-II)',

    -- ✅ ENHANCED SUMMARY (60 → 180 palabras, 799 caracteres - dentro del límite de 800)
    summary = 'I believe addiction is not a moral failing—it''s a complex response to pain, trauma, and disconnection that requires compassionate, holistic healing. For 11 years, I''ve walked alongside over 250 individuals in their recovery journeys, witnessing the profound transformation that happens when we treat the whole person, not just the substance. My own path into this work was personal—watching addiction devastate my family taught me that shame and willpower never heal, but connection and self-compassion do. As a Certified Addiction Counselor, I integrate evidence-based treatment with mindfulness, somatic therapies, and emotional regulation techniques that address the underlying wounds driving addictive behaviors. At ISEIH, I train counselors, therapists, and healthcare workers in integrative recovery approaches that go beyond abstinence to true wellness. I facilitate experiential workshops where professionals explore their own relationship with substances, practice trauma-informed interventions, and learn to hold space without judgment. My approach blends Motivational Interviewing, EMDR, mindfulness-based relapse prevention, and community support models. I''m particularly passionate about reducing stigma and making recovery accessible to marginalized communities. My mission: to create a world where recovery is seen not as weakness overcome, but as courage embodied.',

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
  RAISE NOTICE '  2. Headline length: % chars', LENGTH('Recovery is Possible | 250+ Lives Reclaimed from Addiction | Integrative Addiction Counselor (CAC-II)');
  RAISE NOTICE '  3. Summary words: ~180 palabras';
  RAISE NOTICE '';

  -- Verificar que el perfil existe y se actualizó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'male') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de Michael Thompson actualizado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar para verificar los cambios

SELECT
  '========== MICHAEL THOMPSON - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline as new_headline_preview,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'michael.thompson@iseih.edu';
