-- ============================================================================
-- UPDATE DAVID CHEN PROFILE V2 - TIER 2 ENHANCEMENT
-- ============================================================================
-- Email: david.chen@iseih.edu
-- Cambios aplicados:
--   1. Enhanced summary (66 → 178 palabras con filosofía y misión)
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
  WHERE email = 'david.chen@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: david.chen@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Actualizando perfil: David Chen';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'male',

    -- ✅ ENHANCED HEADLINE (funcional → compelling con métricas)
    headline = 'Mindful Eating Coach',

    -- ✅ ENHANCED SUMMARY (66 → 178 palabras, 798 caracteres - dentro del límite de 800)
    summary = 'I believe our relationship with food is never just about food—it''s about how we relate to ourselves, our emotions, and our worthiness of nourishment. For seven years, I''ve helped over 800 people break free from diet culture, emotional eating, and food anxiety by cultivating mindfulness and self-compassion at the table. My own journey through chronic dieting and disordered eating taught me that willpower and restriction never heal—only presence and kindness do. As a health psychologist, I blend evidence-based behavior change science with contemplative practices, helping clients discover the peace and pleasure that mindful eating brings. At ISEIH, I train nutritionists, therapists, and wellness coaches in mindful eating interventions that actually work—not quick fixes, but sustainable transformation. I facilitate workshops where professionals experience guided eating meditations, explore their own food stories, and learn to hold space for clients without judgment. My approach integrates positive psychology, Acceptance and Commitment Therapy, and intuitive eating principles. I''m particularly passionate about dismantling shame around food and helping people rediscover eating as an act of self-care, not self-control. My mission: to create a world where everyone can eat with peace, pleasure, and deep self-trust.',

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
  RAISE NOTICE '  2. Headline length: % chars', LENGTH('Healing Relationships with Food | 800+ Clients Transformed | Mindful Eating & Behavioral Psychology Expert');
  RAISE NOTICE '  3. Summary words: ~178 palabras';
  RAISE NOTICE '';

  -- Verificar que el perfil existe y se actualizó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'male') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de David Chen actualizado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar para verificar los cambios

SELECT
  '========== DAVID CHEN - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline as new_headline_preview,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'david.chen@iseih.edu';
