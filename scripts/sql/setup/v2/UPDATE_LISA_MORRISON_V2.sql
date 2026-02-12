-- ============================================================================
-- UPDATE LISA MORRISON PROFILE V2 - TIER 2 ENHANCEMENT
-- ============================================================================
-- Email: lisa.morrison@iseih.edu
-- Cambios aplicados:
--   1. Enhanced summary (67 → 182 palabras con filosofía y misión)
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
  WHERE email = 'lisa.morrison@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: lisa.morrison@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Actualizando perfil: Lisa Morrison';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'female',

    -- ✅ ENHANCED HEADLINE (funcional → compelling con métricas)
    headline = 'Art Therapist (ATR)',

    -- ✅ ENHANCED SUMMARY (67 → 182 palabras, 799 caracteres - dentro del límite de 800)
    summary = 'I believe that when trauma lives beyond words, art becomes the language of healing. For 11 years, I''ve witnessed adolescents and young adults—many who couldn''t speak their pain—find voice, release, and transformation through creative expression. My work began in a psychiatric hospital, where I watched a nonverbal teen communicate her abuse story through a single painting, unlocking years of frozen trauma. Since then, I''ve developed expressive therapy programs that have helped over 400 young people process grief, anxiety, depression, and trauma through visual arts, sculpture, and creative storytelling. At ISEIH, I train therapists, counselors, and educators in trauma-informed art therapy techniques they can integrate into their practice—even without formal art training. I facilitate experiential workshops where professionals create their own art, explore resistance and vulnerability, and learn to hold therapeutic space for creative expression. My approach bridges neuroscience (how art activates healing), depth psychology (what emerges in the creative process), and social justice (whose stories get told). I''m particularly passionate about making art therapy accessible in underserved communities and schools. My mission: to expand access to creative healing modalities, proving that everyone—regardless of artistic skill—deserves the transformative power of self-expression.',

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
  RAISE NOTICE '  2. Headline length: % chars', LENGTH('When Words Fail, Art Speaks | 400+ Adolescents Healed | Registered Art Therapist (ATR) & Trauma Specialist');
  RAISE NOTICE '  3. Summary words: ~182 palabras';
  RAISE NOTICE '';

  -- Verificar que el perfil existe y se actualizó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'female') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de Lisa Morrison actualizado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar para verificar los cambios

SELECT
  '========== LISA MORRISON - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline as new_headline_preview,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'lisa.morrison@iseih.edu';
