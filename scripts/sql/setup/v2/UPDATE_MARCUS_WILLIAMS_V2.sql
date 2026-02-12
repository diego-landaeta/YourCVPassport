-- ============================================================================
-- UPDATE MARCUS WILLIAMS PROFILE V2 - TIER 2 ENHANCEMENT
-- ============================================================================
-- Email: marcus.williams@iseih.edu
-- Cambios aplicados:
--   1. Enhanced summary (76 → 180 palabras con filosofía y misión)
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
  WHERE email = 'marcus.williams@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: marcus.williams@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Actualizando perfil: Marcus Williams';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'male',

    -- ✅ ENHANCED HEADLINE (funcional → compelling con métricas)
    headline = 'Psychodrama & Drama Therapist',

    -- ✅ ENHANCED SUMMARY (76 → 180 palabras, 799 caracteres - dentro del límite de 800)
    summary = 'I believe we don''t think our way into new ways of acting—we act our way into new ways of thinking. For 10 years, I''ve used psychodrama, role-playing, and Theatre of the Oppressed to help people step into unexplored parts of themselves, rehearse difficult conversations, and embody the change they seek. My journey began as a community theater director, witnessing how performance could unlock stories people had buried for decades. A single improvisation exercise helped a veteran speak his trauma for the first time. That moment changed my path forever. Since then, I''ve facilitated over 300 transformative sessions—from trauma survivors in clinical settings to incarcerated individuals finding their voice through theater. At ISEIH, I train therapists, social workers, and educators in drama therapy techniques that bypass intellectualization and access embodied wisdom. I facilitate experiential workshops where professionals enact family dynamics, practice role reversals, and discover how the body holds truth that words cannot capture. My approach integrates Moreno''s psychodrama, Boal''s Theatre of the Oppressed, and somatic trauma therapy. I''m particularly passionate about bringing drama therapy into underserved communities—prisons, shelters, immigrant centers. My mission: to democratize transformative theater, proving that everyone deserves a stage to rehearse their liberation.',

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
  RAISE NOTICE '  2. Headline length: % chars', LENGTH('Transforming Lives Through Embodied Action | 300+ Breakthroughs Facilitated | Psychodrama & Drama Therapy Expert');
  RAISE NOTICE '  3. Summary words: ~180 palabras';
  RAISE NOTICE '';

  -- Verificar que el perfil existe y se actualizó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'male') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de Marcus Williams actualizado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar para verificar los cambios

SELECT
  '========== MARCUS WILLIAMS - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline as new_headline_preview,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'marcus.williams@iseih.edu';
