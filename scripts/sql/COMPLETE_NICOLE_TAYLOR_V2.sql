-- COMPLETE NICOLE TAYLOR V2 - SPECIAL | nicole.taylor@iseih.edu | female
-- ============================================================================
-- Nicole Taylor fue creada con CREATE-nicole-taylor-LIMPIO.sql pero le faltaban:
-- 1. Gender
-- 2. Summary expandido (~160 palabras)
-- 3. Headline mejorado
-- 4. Projects (2)
-- 5. Collaborations (1)
-- 6. Stamps (5 básicos + certificaciones)
-- 7. Achievements en experiencias
-- ============================================================================

DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='nicole.taylor@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado: nicole.taylor@iseih.edu'; END IF;

  -- =========================================================================
  -- 1. UPDATE PROFILE - Gender, Headline, Summary
  -- =========================================================================
  UPDATE profiles SET
    gender = 'female',
    headline = 'Registered Dance/Movement Therapist and Somatic Psychology Specialist',
    summary = 'I believe the body holds wisdom that words cannot always express—that movement is a gateway to healing, self-discovery, and transformation. For 11 years, I''ve guided individuals through trauma recovery, emotional processing, and personal growth using dance/movement therapy and somatic approaches. My journey began on the stage, but shifted when I witnessed how improvised movement helped a trauma survivor reconnect with her body for the first time in years. That moment changed everything. I trained as a Registered Dance/Movement Therapist and Somatic Experiencing Practitioner, integrating Laban Movement Analysis with trauma-informed care. At ISEIH, I teach therapists to read the body''s language—to understand what posture, gesture, and breath reveal about a person''s inner world. I''ve facilitated 650+ individual and group sessions, created movement protocols adopted by 8 mental health clinics, and trained 45+ students in somatic practice. My approach honors each person''s unique movement vocabulary while providing clinically grounded interventions. My mission: to help healers trust the body as a therapeutic instrument.',
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Profile updated (gender, headline, summary)';

  -- =========================================================================
  -- 2. ACHIEVEMENTS en experiencias existentes
  -- =========================================================================
  UPDATE experiences SET achievements = ARRAY[
    'Developed 6 comprehensive curriculum modules in dance/movement therapy',
    'Supervised over 45 students in somatic practice and clinical applications',
    'Implemented experiential learning methods using movement-based techniques',
    'Created trauma-informed movement protocols adopted by 8 mental health clinics',
    'Achieved 98% student satisfaction in course evaluations'
  ] WHERE profile_id = v_user_id AND position LIKE '%Instructor%';

  UPDATE experiences SET achievements = ARRAY[
    'Facilitated over 250 individual dance/movement therapy sessions',
    'Led weekly therapeutic movement groups with 15-20 participants',
    'Developed "Movement for Healing" 12-week structured program',
    'Achieved 85% client improvement in somatic awareness measures'
  ] WHERE profile_id = v_user_id AND position LIKE '%Registered Dance%';

  UPDATE experiences SET achievements = ARRAY[
    'Conducted over 400 DMT sessions using trauma-informed approaches',
    'Co-facilitated women''s trauma recovery group for 3 consecutive years',
    'Developed movement assessment protocols for clinical intake process',
    'Trained clinical staff in basic somatic awareness techniques'
  ] WHERE profile_id = v_user_id AND position LIKE '%Dance/Movement Therapist%' AND company_name LIKE '%Portland%';

  UPDATE experiences SET achievements = ARRAY[
    'Completed 700+ clinical hours in dance/movement therapy practice',
    'Received specialized training in movement-based assessment techniques',
    'Developed therapeutic intervention skills across diverse populations'
  ] WHERE profile_id = v_user_id AND position LIKE '%Internship%';

  RAISE NOTICE '✅ Achievements added to experiences';

  -- =========================================================================
  -- 3. PROJECTS
  -- =========================================================================
  -- Limpiar projects existentes para evitar duplicados
  DELETE FROM portfolio_items
  WHERE profile_id = v_user_id AND type = 'PROJECT';

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, featured, sort_order, created_at) VALUES
  (v_user_id,
   'Movement for Healing: Trauma Recovery Through Dance',
   'A 12-week structured dance/movement therapy program designed for trauma survivors. The program integrates Authentic Movement, Laban Movement Analysis, and Somatic Experiencing to help participants reconnect with their bodies safely. Piloted with 60+ participants across 3 mental health clinics in Portland. Results showed 85% improvement in somatic awareness and 72% reduction in trauma-related avoidance behaviors. The curriculum has been adopted by 4 additional treatment centers.',
   'PROJECT', ARRAY['Dance Therapy', 'Trauma Recovery', 'Somatic Psychology', 'Program Design'], true, 1, '2020-01-01'),

  (v_user_id,
   'Body Speaks: Movement Assessment Protocol for Clinical Settings',
   'Developed a standardized movement assessment protocol that enables mental health clinicians to observe and interpret clients'' movement patterns as part of the therapeutic intake process. The protocol includes a 40-item movement observation checklist, video training modules, and clinical documentation templates. Currently used by 8 mental health clinics and featured in the American Dance Therapy Association quarterly journal.',
   'PROJECT', ARRAY['Clinical Assessment', 'Movement Analysis', 'Training', 'Protocol Development'], true, 2, '2019-01-01');

  RAISE NOTICE '✅ 2 projects added';

  -- =========================================================================
  -- 4. COLLABORATIONS
  -- =========================================================================
  DELETE FROM portfolio_items
  WHERE profile_id = v_user_id AND type = 'COLLABORATION';

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order, created_at) VALUES
  (v_user_id,
   'ADTA Research Committee - Somatic Approaches in Trauma Treatment',
   'Active member of the American Dance Therapy Association Research Committee, contributing to a multi-site study examining the efficacy of dance/movement therapy for PTSD. Responsible for designing movement intervention protocols and training research therapists. Co-authored 2 peer-reviewed publications on body-based trauma treatment outcomes.',
   'COLLABORATION', ARRAY['Research', 'ADTA', 'Trauma Treatment', 'Evidence-Based'], 4, '2018-01-01');

  RAISE NOTICE '✅ 1 collaboration added';

  -- =========================================================================
  -- 5. STAMPS DE VERIFICACIÓN
  -- =========================================================================
  -- Limpiar stamps existentes para evitar duplicados
  DELETE FROM stamps WHERE profile_id = v_user_id;

  -- 5 stamps básicos
  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES
  (v_user_id, 'EMAIL', 'VERIFIED',
   jsonb_build_object('email', 'nicole.taylor@iseih.edu', 'verified_method', 'manual_admin'),
   'manual', NOW(), NOW()),
  (v_user_id, 'IDENTITY', 'VERIFIED',
   jsonb_build_object('document_type', 'Passport', 'verified_method', 'manual_admin'),
   'manual', NOW(), NOW()),
  (v_user_id, 'EDUCATION', 'VERIFIED',
   jsonb_build_object('degree', 'M.A. in Dance/Movement Therapy', 'institution', 'Pratt Institute', 'verified_method', 'manual_admin'),
   'manual', NOW(), NOW()),
  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   jsonb_build_object('position', 'Dance/Movement Therapy Instructor', 'company', 'ISEIH', 'verified_method', 'manual_admin'),
   'manual', NOW(), NOW()),
  (v_user_id, 'LANGUAGE', 'VERIFIED',
   jsonb_build_object('languages', ARRAY['English (Native)', 'French (A2)'], 'verified_method', 'manual_admin'),
   'manual', NOW(), NOW());

  RAISE NOTICE '✅ 5 basic stamps added';

  -- Stamps de certificaciones
  INSERT INTO stamps (profile_id, type, status, entity_type, evidence, provider, verified_at, created_at)
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

  RAISE NOTICE '✅ Certification stamps added';

  -- =========================================================================
  -- RESUMEN FINAL
  -- =========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ NICOLE TAYLOR V2 COMPLETED';
  RAISE NOTICE '══════════════════════════════════════════════════════';

END $$;

-- VERIFICACIÓN
SELECT
  '========== NICOLE TAYLOR - RESULTADO ==========' as status,
  p.full_name,
  p.gender,
  LENGTH(p.headline) as headline_len,
  LENGTH(p.summary) as summary_len,
  (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiences,
  (SELECT COUNT(*) FROM education WHERE profile_id = p.id) as education,
  (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
  (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) as languages,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certifications,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'PROJECT') as projects,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'COLLABORATION') as collaborations,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') as stamps
FROM profiles p
WHERE p.email = 'nicole.taylor@iseih.edu';
