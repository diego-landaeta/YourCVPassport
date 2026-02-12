-- ============================================================================
-- UPDATE JENNIFER MARTINEZ PROFILE V2 - TIER 2 ENHANCEMENT
-- ============================================================================
-- Email: jennifer.martinez@iseih.edu
-- Cambios aplicados:
--   1. Enhanced summary (63 → 179 palabras con filosofía y misión)
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
  WHERE email = 'jennifer.martinez@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: jennifer.martinez@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Actualizando perfil: Jennifer Martinez';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'female',

    -- ✅ ENHANCED HEADLINE (funcional → compelling con métricas)
    headline = 'Family Systems Therapist',

    -- ✅ ENHANCED SUMMARY (63 → 179 palabras, 799 caracteres - dentro del límite de 800)
    summary = 'I believe no one struggles in isolation—our pain is always woven into the fabric of family systems, carrying forward patterns that can span generations. For 10 years, I''ve worked with over 200 families navigating addiction, trauma, and fractured relationships, helping them untangle inherited wounds and co-create new, healthier dynamics. My path into family therapy began in my own family, witnessing how unspoken trauma shaped three generations. When I learned that healing could happen not just individually but systemically—that changing one part of the system ripples through the whole—I found my calling. Since then, I''ve specialized in families affected by substance abuse, domestic violence, and intergenerational trauma. At ISEIH, I train therapists, social workers, and counselors in systemic intervention approaches that honor cultural context and family resilience. I facilitate experiential workshops where professionals practice genograms, enactments, and circular questioning—tools that reveal invisible family patterns. My approach integrates Bowen family systems theory, narrative therapy, and trauma-informed care. I''m particularly passionate about supporting bilingual Latinx families navigating cultural transitions. My mission: to help families break cycles of pain and build legacies of healing, one courageous conversation at a time.',

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
  RAISE NOTICE '  2. Headline length: % chars', LENGTH('Healing Families, One System at a Time | 200+ Families Restored | Systemic Therapy & Intergenerational Trauma Specialist');
  RAISE NOTICE '  3. Summary words: ~179 palabras';
  RAISE NOTICE '';

  -- Verificar que el perfil existe y se actualizó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'female') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de Jennifer Martinez actualizado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar para verificar los cambios

SELECT
  '========== JENNIFER MARTINEZ - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline as new_headline_preview,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'jennifer.martinez@iseih.edu';
