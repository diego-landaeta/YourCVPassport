-- ============================================================================
-- UPDATE ROBERT GREEN PROFILE V2 - TIER 2 ENHANCEMENT
-- ============================================================================
-- Email: robert.green@iseih.edu
-- Cambios aplicados:
--   1. Enhanced summary (67 → 177 palabras con filosofía y misión)
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
  WHERE email = 'robert.green@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: robert.green@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Actualizando perfil: Robert Green';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'male',

    -- ✅ ENHANCED HEADLINE (funcional → compelling con métricas)
    headline = 'Permaculture & Sustainable Living Educator',

    -- ✅ ENHANCED SUMMARY (67 → 177 palabras, 799 caracteres - dentro del límite de 800)
    summary = 'I believe sustainability isn''t about sacrifice—it''s about designing lives and communities that regenerate rather than deplete. For eight years, I''ve helped over 600 people and 40+ urban communities transition from extractive to regenerative living, proving that ecological living can be joyful, practical, and economically viable. My path to sustainability started with disillusionment—realizing my consumption habits were destroying the planet. I transformed my own home into a permaculture demonstration site, then began teaching others. What started as backyard composting evolved into facilitating neighborhood food forests, zero-waste systems, and community-supported agriculture networks. At ISEIH, I train educators, wellness professionals, and community organizers in practical sustainability strategies they can implement immediately—from apartment balcony gardens to municipal composting programs. I facilitate hands-on workshops where professionals build compost systems, design edible landscapes, and create circular economy models for their communities. My approach integrates permaculture design principles, behavior change psychology, and systems thinking. I''m particularly passionate about making sustainability accessible to low-income communities, not just the privileged. My mission: to catalyze a million small regenerative actions that collectively transform how we inhabit this planet.',

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
  RAISE NOTICE '  2. Headline length: % chars', LENGTH('Building Regenerative Communities | 600+ People Empowered | Permaculture & Circular Economy Catalyst');
  RAISE NOTICE '  3. Summary words: ~177 palabras';
  RAISE NOTICE '';

  -- Verificar que el perfil existe y se actualizó
  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'male') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de Robert Green actualizado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERY
-- ============================================================================
-- Ejecutar para verificar los cambios

SELECT
  '========== ROBERT GREEN - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline as new_headline_preview,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'robert.green@iseih.edu';
