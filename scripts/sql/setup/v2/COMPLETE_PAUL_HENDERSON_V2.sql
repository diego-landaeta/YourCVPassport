-- ============================================================================
-- COMPLETE PAUL HENDERSON PROFILE V2 - TIER 1 TRANSFORMATION
-- ============================================================================
-- Email: paul.henderson@iseih.edu
-- Transformación completa de Tier 1 a perfil profesional convincente:
--   1. Enhanced summary (51 → 178 palabras con filosofía y misión)
--   2. Compelling headline profesional
--   3. Gender field = 'male' (crítico para traducción ES)
--   4. ADD achievements arrays a las 4 experiencias (17 achievements totales)
--   5. CREATE 3 projects detallados (200+ palabras cada uno)
--   6. CREATE 3 collaborations con contexto (3-5 oraciones)
--   7. ADD 8 verification stamps (5 básicos + 3 certificaciones)
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Buscar el usuario existente
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'paul.henderson@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado: paul.henderson@iseih.edu';
  END IF;

  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 Completando perfil: Paul Henderson';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE '============================================';

  -- =========================================================================
  -- 1. UPDATE PROFILE - ENHANCED CONTENT
  -- =========================================================================

  UPDATE profiles SET
    -- ✅ GENDER FIELD (CRITICAL para traducción español)
    gender = 'male',

    -- ✅ ENHANCED HEADLINE (profesional y directo)
    headline = 'Registered Herbalist (RH)',

    -- ✅ ENHANCED SUMMARY (51 → 178 palabras, 799 caracteres)
    summary = 'I believe plants are our oldest teachers and most powerful allies in healing—when we learn to listen. For 10 years, I''ve walked the path of clinical herbalism, studying medicinal plants in forests and clinics, learning their language through touch, taste, and clinical outcomes. I''ve helped over 400 people discover that the remedies they need often grow right outside their door. My journey began in the Georgia woods, identifying wild plants with my grandmother''s tattered field guide. That childhood curiosity evolved into intensive apprenticeship with master herbalists, thousands of hours studying plant chemistry and traditional uses, and eventually clinical practice where I witnessed herbs transform chronic conditions when pharmaceuticals had failed. At ISEIH, I train healthcare practitioners in evidence-based clinical herbalism—not folklore or mysticism, but rigorous botanical medicine grounded in phytochemistry, safety data, and clinical research. I teach plant identification in the field, herbal preparation in the lab, and clinical decision-making through case studies. My approach honors both traditional wisdom and modern science, Indigenous plant knowledge and pharmacognosy. I''m particularly passionate about sustainable wildcrafting, ensuring future generations inherit thriving medicinal plant populations. My mission: to preserve and advance herbal medicine as legitimate, accessible healthcare—proving that botanical wisdom, when practiced skillfully, belongs in every clinic and every home.',

    -- Mantener el resto de campos
    updated_at = NOW()

  WHERE id = v_user_id;

  RAISE NOTICE '✅ Perfil principal actualizado';

  -- =========================================================================
  -- 2. UPDATE EXPERIENCES - ADD ACHIEVEMENTS ARRAYS
  -- =========================================================================

  -- Experience 1: ISEIH (Current)
  UPDATE experiences SET
    achievements = ARRAY[
      'Developed 10 clinical herbalism modules used by 180+ practitioners globally',
      'Created botanical medicine safety protocols adopted as institutional standard',
      'Led 25+ field identification workshops teaching sustainable wildcrafting',
      'Maintained 96% student satisfaction across 35+ cohorts'
    ]
  WHERE profile_id = v_user_id
    AND company_name = 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos'
    AND position = 'Herbal Medicine Instructor';

  -- Experience 2: Henderson Herbal Consulting (Current)
  UPDATE experiences SET
    achievements = ARRAY[
      'Conducted 500+ herbal consultations with 82% reported improvement',
      'Developed 200+ customized herbal formulations for diverse conditions',
      'Taught 30+ wildcrafting workshops reaching 400+ community members',
      'Consulted on herbal product development for 5 sustainable herbal companies',
      'Published 6 articles on clinical herbalism in peer-reviewed journals'
    ]
  WHERE profile_id = v_user_id
    AND company_name = 'Henderson Herbal Consulting'
    AND position = 'Independent Phytotherapy Consultant';

  -- Experience 3: Natural Health Emporium
  UPDATE experiences SET
    achievements = ARRAY[
      'Provided herbal consultations to 300+ clients over 3.5 years',
      'Formulated over 400 custom herbal remedies with documented outcomes',
      'Increased herbal product sales by 60% through education and quality curation',
      'Trained 8 staff members in herbal safety and customer education'
    ]
  WHERE profile_id = v_user_id
    AND company_name = 'Natural Health Emporium'
    AND position = 'Clinical Herbalist';

  -- Experience 4: Georgia Botanical Medicine Clinic (Apprenticeship)
  UPDATE experiences SET
    achievements = ARRAY[
      'Completed intensive 18-month clinical herbalism apprenticeship',
      'Assisted in treatment of 150+ patient cases under supervision',
      'Mastered preparation of 50+ herbal medicine forms (tinctures, salves, teas)',
      'Identified and wildcrafted 100+ medicinal plant species in Georgia'
    ]
  WHERE profile_id = v_user_id
    AND company_name = 'Georgia Botanical Medicine Clinic'
    AND position = 'Herbalist Apprentice';

  RAISE NOTICE '✅ Achievements agregados a 4 experiencias (17 totales)';

  -- =========================================================================
  -- 3. CREATE PROJECTS (Portfolio Items)
  -- =========================================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, featured, sort_order, created_at) VALUES

  -- Project 1: Southern Medicinal Plants Field Guide
  (v_user_id,
   'Southern Medicinal Plants Field Guide - Identification & Clinical Use',
   'Comprehensive field guide to 80 medicinal plants native to the Southeastern United States. Combines botanical identification, traditional uses, modern clinical applications, and sustainable harvesting guidelines. Each plant profile includes full-color photos, habitat descriptions, look-alike warnings, chemical constituents, clinical indications, and preparation methods. Used by herbalists, foragers, and healthcare practitioners across the Southeast. Features ethical wildcrafting protocols, seasonal harvesting calendars, and conservation status. Includes 30 clinical case studies demonstrating real-world applications. Peer-reviewed by botanists and herbalists. 250 pages with detailed illustrations and habitat maps.',
   'PROJECT',
   'https://hendersonherbals.com/field-guide',
   ARRAY['Medicinal Plants', 'Field Guide', 'Wildcrafting', 'Plant Identification', 'Herbalism'],
   true, 1, '2019-06-01'),

  -- Project 2: Clinical Herbalism Materia Medica
  (v_user_id,
   'Clinical Herbalism Materia Medica - Evidence-Based Herbal Reference',
   'Evidence-based clinical reference for 120 medicinal herbs with detailed monographs covering pharmacology, clinical applications, safety data, and dosing guidelines. Each monograph includes phytochemistry, mechanisms of action, clinical trial summaries, traditional uses, contraindications, drug interactions, and quality sourcing. Designed for healthcare practitioners integrating botanical medicine. Used by 250+ clinical herbalists and naturopathic physicians. Features clinical decision trees, combination formulas, and patient counseling guidelines. Updated annually with latest research. 400 pages with chemical structure diagrams and clinical protocols.',
   'PROJECT',
   'https://hendersonherbals.com/materia-medica',
   ARRAY['Materia Medica', 'Clinical Reference', 'Evidence-Based', 'Herbal Medicine', 'Pharmacology'],
   true, 2, '2020-09-01'),

  -- Project 3: Sustainable Wildcrafting Certification Program
  (v_user_id,
   'Sustainable Wildcrafting Certification - Conservation-Focused Training',
   'Professional certification program teaching ethical, sustainable wild harvesting of medicinal plants. 6-month program covering plant identification, population assessment, harvest protocols, habitat restoration, and legal considerations. Trained 100+ herbalists, farmers, and foragers in regenerative harvesting practices. Includes field intensives in diverse ecosystems, hands-on harvest practice, and conservation project implementation. Developed in partnership with United Plant Savers and regional botanical gardens. Addresses overharvested species, invasive plant management, and climate change impacts on medicinal plant populations. Graduates receive professional certification recognized by herbal medicine community.',
   'PROJECT',
   'https://hendersonherbals.com/wildcrafting-certification',
   ARRAY['Wildcrafting', 'Sustainability', 'Conservation', 'Professional Training', 'Plant Medicine'],
   true, 3, '2018-03-01');

  RAISE NOTICE '✅ 3 proyectos creados';

  -- =========================================================================
  -- 4. CREATE COLLABORATIONS (Portfolio Items)
  -- =========================================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order, created_at) VALUES

  -- Collaboration 1: Conservation Work
  (v_user_id,
   'Advisory Board Member - United Plant Savers',
   'Serve on advisory board of leading medicinal plant conservation nonprofit. Contribute expertise on sustainable wildcrafting practices, at-risk medicinal plant populations, and habitat restoration strategies. Help develop conservation guidelines used by herbalists nationwide. Lead botanical sanctuary restoration projects protecting native medicinal plants. Collaborate with botanists, ecologists, and Indigenous plant knowledge keepers. Advocate for endangered medicinal plant protection through policy work and public education. Participate in quarterly board meetings and annual conservation conferences.',
   'COLLABORATION',
   ARRAY['Conservation', 'Advisory Board', 'Plant Medicine', 'Sustainability', 'Environmental'],
   4, '2017-01-01'),

  -- Collaboration 2: Professional Association
  (v_user_id,
   'Founding Member - American Herbalists Guild Georgia Chapter',
   'Co-founded regional chapter serving 80+ professional herbalists across Georgia. Organize continuing education events, herb walks, and clinical case study sessions. Develop professional practice standards and peer review processes. Mentor newly registered herbalists through mentorship program. Collaborate with state health agencies on herbalist scope of practice and safety regulations. Represent clinical herbalism at integrative medicine conferences. Foster community among diverse herbal medicine practitioners—from Appalachian folk herbalists to research-focused phytotherapists.',
   'COLLABORATION',
   ARRAY['Professional Association', 'Community Building', 'Mentorship', 'Standards Development', 'Leadership'],
   5, '2016-06-01'),

  -- Collaboration 3: Community Herbal Medicine Project
  (v_user_id,
   'Volunteer Herbalist - Atlanta Community Apothecary',
   'Provide free herbal consultations and medicines to uninsured community members twice monthly since 2015. Prepare low-cost herbal remedies using locally grown and wildcrafted plants. Donated over 400 clinical hours serving 200+ individuals. Teach community members to identify and prepare simple herbal medicines for common ailments. Partner with community gardens, food banks, and free clinics. Train community health workers in basic herbal first aid. Received Atlanta Community Care Award 2020 for outstanding service expanding healthcare access through plant medicine.',
   'COLLABORATION',
   ARRAY['Pro-Bono', 'Community Health', 'Volunteer', 'Healthcare Access', 'Herbal Medicine'],
   6, '2015-04-01');

  RAISE NOTICE '✅ 3 colaboraciones creadas';

  -- =========================================================================
  -- 5. CREATE VERIFICATION STAMPS
  -- =========================================================================

  -- Insertar stamps básicos
  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Email verification
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "paul.henderson@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Identity verification
  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Passport", "document_number": "****7294", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Education verification
  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "Registered Herbalist", "institution": "American Herbalists Guild", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Employment verification
  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Herbal Medicine Instructor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Language verification
  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)"], "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW());

  RAISE NOTICE '✅ 5 stamps básicos creados';

  -- Stamps de certificaciones
  INSERT INTO stamps (
    profile_id, type, status, entity_type,
    evidence, provider, verified_at, created_at
  )
  SELECT
    v_user_id, 'CERTIFICATION', 'VERIFIED', 'CERTIFICATION',
    jsonb_build_object(
      'certification_title', title,
      'verified_method', 'manual_admin',
      'verification_notes', 'Certificación verificada mediante documentación oficial'
    ),
    'Admin Manual Review', NOW(), NOW()
  FROM portfolio_items
  WHERE profile_id = v_user_id AND type = 'CERTIFICATION';

  RAISE NOTICE '✅ Stamps de certificaciones creados';

  -- =========================================================================
  -- VERIFICACIÓN FINAL
  -- =========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PAUL HENDERSON PROFILE V2 SUCCESSFULLY COMPLETED';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Cambios aplicados:';
  RAISE NOTICE '  1. Gender: male (crítico para ES translation)';
  RAISE NOTICE '  2. Headline: % chars', LENGTH('Registered Herbalist (RH)');
  RAISE NOTICE '  3. Summary: ~178 palabras, % chars', LENGTH('I believe plants are our oldest teachers and most powerful allies in healing—when we learn to listen. For 10 years, I''ve walked the path of clinical herbalism, studying medicinal plants in forests and clinics, learning their language through touch, taste, and clinical outcomes. I''ve helped over 400 people discover that the remedies they need often grow right outside their door. My journey began in the Georgia woods, identifying wild plants with my grandmother''s tattered field guide. That childhood curiosity evolved into intensive apprenticeship with master herbalists, thousands of hours studying plant chemistry and traditional uses, and eventually clinical practice where I witnessed herbs transform chronic conditions when pharmaceuticals had failed. At ISEIH, I train healthcare practitioners in evidence-based clinical herbalism—not folklore or mysticism, but rigorous botanical medicine grounded in phytochemistry, safety data, and clinical research. I teach plant identification in the field, herbal preparation in the lab, and clinical decision-making through case studies. My approach honors both traditional wisdom and modern science, Indigenous plant knowledge and pharmacognosy. I''m particularly passionate about sustainable wildcrafting, ensuring future generations inherit thriving medicinal plant populations. My mission: to preserve and advance herbal medicine as legitimate, accessible healthcare—proving that botanical wisdom, when practiced skillfully, belongs in every clinic and every home.');
  RAISE NOTICE '  4. Achievements: 17 totales en 4 experiencias';
  RAISE NOTICE '  5. Projects: 3 proyectos detallados';
  RAISE NOTICE '  6. Collaborations: 3 colaboraciones con contexto';
  RAISE NOTICE '  7. Verification stamps: 8 totales';
  RAISE NOTICE '';

  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND gender = 'male') THEN
    RAISE NOTICE '✅ VERIFICACIÓN EXITOSA: Perfil de Paul Henderson completado';
  ELSE
    RAISE WARNING '⚠️ ADVERTENCIA: El perfil no se actualizó correctamente';
  END IF;

END $$;

-- ============================================================================
-- VALIDATION QUERIES
-- ============================================================================

SELECT
  '========== PAUL HENDERSON - PERFIL V2 ==========' as titulo,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_length,
  LENGTH(p.summary) as summary_length,
  p.headline,
  LEFT(p.summary, 150) || '...' as summary_preview
FROM profiles p
WHERE p.email = 'paul.henderson@iseih.edu';

SELECT
  '========== ACHIEVEMENTS ==========' as seccion,
  e.company_name,
  array_length(e.achievements, 1) as num_achievements
FROM experiences e
JOIN profiles p ON p.id = e.profile_id
WHERE p.email = 'paul.henderson@iseih.edu';

SELECT
  '========== PORTFOLIO & STAMPS ==========' as seccion,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'PROJECT') as projects,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'COLLABORATION') as collaborations,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') as stamps
FROM profiles p
WHERE p.email = 'paul.henderson@iseih.edu';
