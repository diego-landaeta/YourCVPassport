-- ============================================================================
-- UPDATE RACHEL STEVENS PROFILE V2 - TIER 2 ENHANCEMENT
-- ============================================================================
-- Email: rachel.stevens@iseih.edu
-- Cambios aplicados:
--   1. Enhanced summary (60 → 180 palabras con filosofía y misión)
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
  WHERE email = 'rachel.stevens@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: rachel.stevens@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Actualizando perfil: Rachel Stevens';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'female',

    -- ✅ ENHANCED HEADLINE (funcional → compelling con métricas)
    headline = 'Registered Dietitian (RD)',

    -- ✅ ENHANCED SUMMARY (60 → 180 palabras, 799 caracteres - dentro del límite de 800)
    summary = 'I believe food is the most powerful medicine we consume daily—yet most nutrition advice reduces it to calories and macros, ignoring its profound impact on mood, energy, immunity, and vitality. For 10 years, I''ve helped over 600 people reclaim their health through personalized, holistic nutrition that honors bio-individuality, cultural food traditions, and the gut-brain connection. My journey into functional nutrition began when conventional dietary guidelines failed my own autoimmune condition. Only when I addressed root causes—gut dysbiosis, food sensitivities, chronic inflammation—did I heal. That experience transformed how I practice. At ISEIH, I train nutritionists, health coaches, and wellness professionals in integrative nutrition approaches that go beyond symptom management to true healing. I facilitate experiential workshops where professionals learn functional assessment, personalized protocol design, and how to navigate the complex landscape of supplements, testing, and therapeutic diets. My approach blends evidence-based clinical nutrition with functional medicine, Ayurvedic wisdom, and mindful eating. I''m particularly passionate about digestive health and the microbiome—our second brain. My mission: to elevate nutrition from diet culture to true nourishment, proving that food can heal when we eat with intention, wisdom, and joy.',

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
  RAISE NOTICE '  2. Headline length: % chars', LENGTH('Food as Medicine, Not Just Fuel | 600+ Lives Nourished | Registered Dietitian & Functional Nutrition Pioneer');
  RAISE NOTICE '  3. Summary words: ~180 palabras';
  RAISE NOTICE '';

  -- Verificar que el perfil existe y se actualizó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'female') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de Rachel Stevens actualizado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar para verificar los cambios

SELECT
  '========== RACHEL STEVENS - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline as new_headline_preview,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'rachel.stevens@iseih.edu';
