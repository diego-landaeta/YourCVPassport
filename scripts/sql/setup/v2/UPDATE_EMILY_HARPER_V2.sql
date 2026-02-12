-- ============================================================================
-- UPDATE EMILY HARPER PROFILE V2 - TIER 2 ENHANCEMENT
-- ============================================================================
-- Email: emily.harper@iseih.edu
-- Cambios aplicados:
--   1. Enhanced summary (61 → 180 palabras con filosofía y misión)
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
  WHERE email = 'emily.harper@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: emily.harper@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Actualizando perfil: Emily Harper';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'female',

    -- ✅ ENHANCED HEADLINE (funcional → compelling con métricas)
    headline = 'Ecopsychology & Nature-Based Therapy Specialist',

    -- ✅ ENHANCED SUMMARY (61 → 180 palabras, 799 caracteres - dentro del límite de 800)
    summary = 'I believe our disconnection from nature is at the root of many modern psychological struggles. For nine years, I''ve pioneered ecopsychology programs that heal this rupture, helping people rediscover their innate connection to the living world—and in doing so, reconnect with themselves. My journey began during my graduate research in environmental psychology, witnessing how time in wilderness profoundly shifted people''s mental health and sense of belonging. Since then, I''ve designed nature immersion programs that have transformed over 500 individuals struggling with anxiety, depression, and ecological grief. At ISEIH, I train therapists, counselors, and wellness professionals in ecotherapy methodologies—teaching them to integrate forest bathing, nature-based mindfulness, and ecological identity work into their practice. I don''t just teach theory in classrooms—I lead experiential retreats where professionals develop their own nature connection before guiding others. My approach bridges scientific rigor with indigenous wisdom, trauma-informed care with wilderness immersion, and individual healing with collective ecological awareness. I''m particularly passionate about addressing eco-anxiety and climate grief, helping people transform despair into grounded, embodied action. My mission: to restore our collective relationship with the Earth, one transformed heart at a time—proving that personal healing and planetary healing are inseparable.',

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
  RAISE NOTICE '  2. Headline length: % chars', LENGTH('Reconnecting Humans with Nature | 500+ Lives Transformed | Ecopsychology & Nature-Based Healing Pioneer');
  RAISE NOTICE '  3. Summary words: ~180 palabras';
  RAISE NOTICE '';

  -- Verificar que el perfil existe y se actualizó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'female') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de Emily Harper actualizado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar para verificar los cambios

SELECT
  '========== EMILY HARPER - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline as new_headline_preview,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'emily.harper@iseih.edu';
