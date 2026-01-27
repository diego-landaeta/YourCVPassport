-- =====================================================
-- CREATE COMPLETE PROFILE: EMILY HARPER
-- Ecopsychology Tutor - ISEIH
-- Email: emily.harper@iseih.edu
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Find existing user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'emily.harper@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please create in Supabase Auth first.';
  END IF;

  RAISE NOTICE '👤 Creating complete profile for Emily Harper...';
  RAISE NOTICE 'UUID: %', v_user_id;

  -- =====================================================
  -- 1. UPDATE MAIN PROFILE
  -- =====================================================

  UPDATE profiles SET
    full_name = 'Emily Harper',
    headline = 'Ecopsychology Tutor',
    title = 'Ecotherapy and Nature Connection Specialist',
    summary = 'Emily combines her scientific background with nature-based therapeutic approaches. For 9 years she has developed programs that help people heal their relationship with the environment and themselves. As a tutor at ISEIH, she trains professionals in ecopsychology and design of nature-based therapeutic interventions. Facilitates immersion retreats and teaches how to integrate ecotherapy into existing wellness practices.',
    location = 'Portland, OR',
    country_code = 'US',
    slug = 'emily-harper-ecopsychology-tutor',
    template = 'passport',
    template_color = '#0052FF',
    show_verified_credentials = true,
    show_connect_links = true,
    show_qr_code = true,
    plan = 'free',
    role = 'professional',
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Perfil principal actualizado';

  -- =====================================================
  -- 2. CLEAN EXISTING DATA
  -- =====================================================

  DELETE FROM experiences WHERE profile_id = v_user_id;
  DELETE FROM education WHERE profile_id = v_user_id;
  DELETE FROM skills WHERE profile_id = v_user_id;
  DELETE FROM languages WHERE profile_id = v_user_id;
  DELETE FROM portfolio_items WHERE profile_id = v_user_id;
  DELETE FROM stamps WHERE profile_id = v_user_id;

  RAISE NOTICE '🧹 Datos anteriores eliminados';

  -- =====================================================
  -- 3. PROFESSIONAL EXPERIENCES
  -- =====================================================

  INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, employment_type, description, achievements, location, sort_order, verified, verified_at, verified_by) VALUES

  -- Experience 1: ISEIH (Current)
  (v_user_id, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Ecopsychology Tutor', '2023-01-01', NULL, true, 'FULL_TIME',
  'Specialized instructor in nature-based therapy and design of ecopsychological interventions for mental health professionals. Teaches training in ecotherapy, therapeutic forest bathing, and ecological anxiety management. Supervises research projects on psychological benefits of nature contact. Develops methodologies to integrate ecopsychological practices in diverse therapeutic contexts.',
  ARRAY[
    'Design of 7 curriculum modules in ecopsychology and nature therapy',
    'Supervision of over 50 students in ecotherapy practice',
    'Implementation of experiential methodologies for nature immersion',
    'Creation of ecopsychological intervention protocols adopted by 12 centers',
    '97% student satisfaction in course evaluations'
  ], 'Madrid, Spain (Remote)', 1, true, NOW(), NULL),

  -- Experience 2: Environmental Wellness Consultant
  (v_user_id, 'Private Ecotherapy Practice', 'Environmental Wellness Consultant', '2020-01-01', NULL, true, 'FREELANCE',
  'Consulting organizations to implement wellness programs based on nature contact. Design of environmental reconnection strategies for corporate teams and mental health centers. Development of personalized ecotherapeutic interventions for stress management, ecological anxiety, and burnout. Impact evaluation of programs on psychological wellbeing and nature connection.',
  ARRAY[
    'Implementation of ecotherapy programs in 10+ organizations',
    'Design of forest bathing protocols adapted to urban contexts',
    'Consulting 30+ professionals on integrating ecotherapy in clinical practice',
    '45% reduction in burnout symptoms among program participants',
    '94% client satisfaction in 6-month follow-ups'
  ], 'Portland, OR, USA', 2, true, NOW(), NULL),

  -- Experience 3: Nature Reconnection Institute
  (v_user_id, 'Nature Reconnection Institute', 'Reconnection Programs Facilitator', '2018-01-01', '2023-12-31', false, 'PART_TIME',
  'Leadership of nature immersion retreats and workshops focused on stress and anxiety reduction. Facilitation of forest bathing experiences, nature meditation, and ecological connection practices. Development of educational curriculum on therapeutic benefits of nature contact. Coordination of 3-7 day residential retreats with groups of 15-20 participants.',
  ARRAY[
    'Facilitation of 40+ nature immersion retreats for over 600 participants',
    'Development of "Deep Forest Therapy" methodology implemented institutionally',
    'Design of safety and emotional containment protocols in nature retreats',
    'Average 60% reduction in perceived stress levels post-retreat',
    '96% satisfaction rate in participant evaluations'
  ], 'Portland, OR, USA', 3, true, NOW(), NULL),

  -- Experience 4: Oregon State Parks
  (v_user_id, 'Oregon State Parks', 'Environmental Educator', '2015-06-01', '2019-12-31', false, 'FULL_TIME',
  'Development and implementation of interpretive educational programs for visitors of all ages at Oregon state parks. Design of experiential environmental education activities. Facilitation of guided hikes, nature workshops, and school programs. Creation of educational materials on local ecosystems and conservation. Training of staff and volunteers in environmental interpretation.',
  ARRAY[
    'Development of 15 interpretive educational programs reaching 5,000+ annual visitors',
    'Facilitation of over 200 guided hikes and nature workshops',
    'Creation of educational curriculum on Pacific Northwest biodiversity',
    'Training of 25 volunteers in environmental education techniques',
    'Recognition as "Educator of the Year 2018" by Oregon State Parks'
  ], 'Portland, OR, USA', 4, true, NOW(), NULL);

  RAISE NOTICE '✅ 4 experiencias profesionales creadas';

  -- =====================================================
  -- 4. EDUCATION
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES

  -- Education 1: M.S. at University of Oregon
  (v_user_id, 'University of Oregon', 'Master of Science (M.S.)', 'Environmental Studies', '2013-09-01', '2015-05-31', false, 'GPA 3.85/4.0 - Magna Cum Laude', 1, true, NOW(), NULL),

  -- Education 2: B.S. at Colorado State
  (v_user_id, 'Colorado State University', 'Bachelor of Science (B.S.)', 'Biology', '2007-09-01', '2011-05-31', false, 'GPA 3.7/4.0 - Cum Laude', 2, true, NOW(), NULL),

  -- Education 3: Ecotherapy Certification
  (v_user_id, 'International Ecotherapy Society', 'Ecotherapy Certification', 'Ecopsychology and Nature Therapies', '2016-09-01', '2017-05-31', false, 'Accredited professional certification', 3, true, NOW(), NULL);

  RAISE NOTICE '✅ 3 títulos educativos creados';

  -- =====================================================
  -- 5. SKILLS
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
  (v_user_id, 'Ecopsychology', 'EXPERT', 9, 'Therapeutic Specialization', 1),
  (v_user_id, 'Forest Therapy', 'EXPERT', 8, 'Nature Therapies', 2),
  (v_user_id, 'Environmental Education', 'EXPERT', 9, 'Education', 3),
  (v_user_id, 'Group Facilitation', 'EXPERT', 8, 'Facilitation', 4),
  (v_user_id, 'Retreat Design', 'ADVANCED', 6, 'Program Development', 5),
  (v_user_id, 'Mindfulness in Nature', 'EXPERT', 7, 'Mindfulness', 6),
  (v_user_id, 'Ecological Anxiety Management', 'ADVANCED', 5, 'Environmental Mental Health', 7),
  (v_user_id, 'Conservation Biology', 'ADVANCED', 10, 'Environmental Sciences', 8),
  (v_user_id, 'Environmental Interpretation', 'EXPERT', 9, 'Education', 9),
  (v_user_id, 'Nature Reconnection Practices', 'EXPERT', 8, 'Nature Therapies', 10),
  (v_user_id, 'Deep Ecology', 'ADVANCED', 6, 'Environmental Philosophy', 11),
  (v_user_id, 'Nature Experience Design', 'EXPERT', 8, 'Program Development', 12),
  (v_user_id, 'Trauma-Informed Nature Therapy', 'ADVANCED', 4, 'Therapeutic Methodologies', 13),
  (v_user_id, 'Sustainability Communication', 'ADVANCED', 7, 'Communication', 14),
  (v_user_id, 'Ecological Dialogue Facilitation', 'ADVANCED', 6, 'Facilitation', 15);

  RAISE NOTICE '✅ 15 habilidades creadas';

  -- =====================================================
  -- 6. LANGUAGES
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (v_user_id, 'English', 'Native', true, 1),
  (v_user_id, 'Spanish', 'A2', false, 2);

  RAISE NOTICE '✅ 2 idiomas agregados';

  -- =====================================================
  -- 7. CERTIFICATIONS (Portfolio Items)
  -- =====================================================
INSERT INTO portfolio_items (profile_id, type, title, description, issuer, issue_date, credential_id, credential_url, verified, sort_order)
VALUES
(
  v_user_id,
  'CERTIFICATION',
  'Certified Ecotherapist',
  'Professional certification in ecotherapy granted by the International Ecotherapy Society. Comprehensive training in theory and practice of nature-based therapeutic interventions, including forest bathing, horticultural therapy, and ecological reconnection practices.',
  'International Ecotherapy Society',
  '2017-05-20',
  'IES-CE-2017-892',
  'https://www.ecotherapysociety.org',
  true,
  1
),
(
  v_user_id,
  'CERTIFICATION',
  'Nature-Based Wellness Facilitator',
  'Specialized certification in facilitation of nature-based wellness programs. Training in retreat design, group facilitation in natural settings, and emotional process management in nature contexts.',
  'Association for Nature and Forest Therapy',
  '2018-09-15',
  'ANFT-NBWF-2018-456',
  'https://www.natureandforesttherapy.org',
  true,
  2
),
(
  v_user_id,
  'CERTIFICATION',
  'Environmental Education Specialist',
  'Specialized environmental education certification granted by North American Association for Environmental Education. Specialization in environmental interpretation methodologies, educational program design, and impact evaluation.',
  'North American Association for Environmental Education',
  '2016-06-10',
  'NAAEE-EES-2016-723',
  'https://www.naaee.org',
  true,
  3
);

  RAISE NOTICE '✅ 3 certificaciones creadas';

  -- =====================================================
  -- 8. PROJECTS (Portfolio Items)
  -- =====================================================
INSERT INTO portfolio_items (profile_id, type, title, description, url, tags, featured, sort_order)
VALUES
(
  v_user_id,
  'PROJECT',
  'Retreat "Healing with the Forest"',
  'Design and facilitation of a 3-day immersive retreat integrating forest bathing and psychology in ancient Pacific Northwest forests. The retreat combines mindfulness practices in nature, outdoor group therapy sessions, and ecological reconnection rituals. Attended by 45 participants with significant results in anxiety reduction (65%) and increased psychological wellbeing.',
  NULL,
  ARRAY['Ecotherapy', 'Nature Retreats', 'Forest Bathing', 'Group Therapy'],
  true,
  1
),
(
  v_user_id,
  'PROJECT',
  'Urban Ecotherapy Guide',
  'Publication of 120-page practical manual for therapists working in urban environments. The guide includes ecotherapy protocols adapted to urban parks, community gardens, and small green spaces. Offers urban forest bathing techniques, accessible nature meditations, and ecological reconnection strategies in city contexts. Used by 50+ therapists in 8 cities.',
  'https://urbanecoguide.org',
  ARRAY['Ecotherapy', 'Professional Resources', 'Therapeutic Education', 'Urban Nature'],
  true,
  2
),
(
  v_user_id,
  'PROJECT',
  'Workshop "Ecological Anxiety"',
  'Series of 8 online workshops to address eco-anxiety in young activists and environmental professionals. The workshops integrate psychoeducation on climate anxiety, emotional regulation techniques, nature connection practices, and ecological resilience building. 80 participants with 55% reduction in ecological anxiety symptoms and improved climate action capacity.',
  NULL,
  ARRAY['Ecological Anxiety', 'Environmental Mental Health', 'Online Workshops', 'Young Activists'],
  false,
  3
);

  RAISE NOTICE '✅ 3 proyectos agregados';

  -- =====================================================
  -- 9. COLLABORATIONS (Portfolio Items)
  -- =====================================================
INSERT INTO portfolio_items (profile_id, type, title, description, tags, sort_order)
VALUES
(
  v_user_id,
  'COLLABORATION',
  'Member of the International Ecotherapy Society',
  'Active member of the International Ecotherapy Society since 2017. Contribution to the development of professional ecotherapy standards, participation in certification committees, and collaboration on research regarding the effectiveness of ecopsychological interventions. Presentation at annual conference on urban ecotherapy.',
  ARRAY['Professional Associations', 'Leadership', 'Standards Development']::text[],
  1
),
(
  v_user_id,
  'COLLABORATION',
  'Contributor to Environmental Psychology Journals',
  'Regular collaboration with academic and professional environmental psychology journals. Publication of articles on ecotherapy, ecological anxiety, and psychological benefits of nature contact. Co-author of 5 articles in Ecopsychology Journal and 3 in Journal of Environmental Psychology.',
  ARRAY['Publications', 'Research', 'Scientific Outreach']::text[],
  2
),
(
  v_user_id,
  'COLLABORATION',
  'Speaker at Planetary Health Congresses',
  'Invited speaker at national and international congresses on planetary health, ecopsychology, and nature therapies. Presentations on integrating ecotherapy in mental health, climate anxiety management, and nature-based intervention design. Participation in 6 conferences since 2018.',
  ARRAY['Conferences', 'Professional Education', 'Thought Leadership']::text[],
  3
);

  RAISE NOTICE '✅ 3 colaboraciones agregadas';

  -- =====================================================
  -- 10. VERIFICATION STAMPS
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Email verification
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "emily.harper@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Identity verification
  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Passport", "document_number": "****5503", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Education verification
  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "M.S.", "institution": "University of Oregon", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Employment verification
  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Ecopsychology Tutor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Language verification
  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)", "Spanish (Basic)"], "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW());

  RAISE NOTICE '✅ 5 stamps básicos creados';

  -- Certification stamps (one per certification)
  INSERT INTO stamps (
    profile_id, type, status, entity_type,
    evidence, provider, verified_at, created_at
  )
  SELECT
    v_user_id, 'CERTIFICATION', 'VERIFIED', 'CERTIFICATION',
    jsonb_build_object(
      'certification_title', title,
      'verified_method', 'manual_admin',
      'verification_notes', 'Certification verified through official documentation'
    ),
    'Admin Manual Review', NOW(), NOW()
  FROM portfolio_items
  WHERE profile_id = v_user_id AND type = 'CERTIFICATION';

  RAISE NOTICE '✅ Stamps de certificaciones creados';

  -- =====================================================
  -- FINAL SUMMARY
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ PERFIL DE EMILY HARPER CREADO EXITOSAMENTE';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE 'Nombre: Emily Harper';
  RAISE NOTICE 'Email: emily.harper@iseih.edu';
  RAISE NOTICE 'Posición: Tutora de Ecopsicología';
  RAISE NOTICE 'Template: passport (#0052FF)';
  RAISE NOTICE '';
  RAISE NOTICE 'ESTADÍSTICAS:';
  RAISE NOTICE '- Experiencias: 4';
  RAISE NOTICE '- Educación: 3 títulos';
  RAISE NOTICE '- Habilidades: 15';
  RAISE NOTICE '- Idiomas: 2';
  RAISE NOTICE '- Certificaciones: 3';
  RAISE NOTICE '- Proyectos: 3';
  RAISE NOTICE '- Colaboraciones: 3';
  RAISE NOTICE '- Stamps verificados: 8';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';

END $$;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

SELECT
  'EMILY HARPER - VERIFICACIÓN COMPLETA' as usuario,
  p.full_name,
  p.headline,
  p.template,
  COUNT(DISTINCT e.id) as experiencias,
  COUNT(DISTINCT ed.id) as educacion,
  COUNT(DISTINCT sk.id) as habilidades,
  COUNT(DISTINCT l.id) as idiomas,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'CERTIFICATION') as certificaciones,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'PROJECT') as proyectos,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'COLLABORATION') as colaboraciones,
  COUNT(DISTINCT s.id) as stamps_verificados
FROM profiles p
LEFT JOIN experiences e ON e.profile_id = p.id
LEFT JOIN education ed ON ed.profile_id = p.id
LEFT JOIN skills sk ON sk.profile_id = p.id
LEFT JOIN languages l ON l.profile_id = p.id
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id
LEFT JOIN stamps s ON s.profile_id = p.id AND s.status = 'VERIFIED'
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'emily.harper@iseih.edu')
GROUP BY p.id, p.full_name, p.headline, p.template;
