-- =====================================================
-- CREATE COMPLETE PROFILE: DAVID CHEN
-- Mindful Eating and Habit Change Tutor - ISEIH
-- Email: david.chen@iseih.edu
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Find existing user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'david.chen@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please create in Supabase Auth first.';
  END IF;

  RAISE NOTICE '👤 Creating complete profile for David Chen...';
  RAISE NOTICE 'UUID: %', v_user_id;

  -- =====================================================
  -- 1. UPDATE MAIN PROFILE
  -- =====================================================

  UPDATE profiles SET
    full_name = 'David Chen',
    headline = 'Mindful Eating and Habit Change Tutor',
    title = 'Health Psychology and Nutritional Coaching Specialist',
    summary = 'Health psychologist specialized in mindful eating and behavior change with over 7 years of experience helping people develop a healthy relationship with food. Expert in corporate wellness program design and holistic health coaching. Facilitates workshops and courses on mindful eating, combining positive psychology with practical habit change strategies to transform people''s relationship with nutrition and self-care.',
    location = 'San Francisco, CA',
    country_code = 'US',
    slug = 'david-chen-mindful-eating-tutor',
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
  (v_user_id, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Mindful Eating and Habit Change Tutor', '2023-09-01', NULL, true, 'PART_TIME',
  'Specialized instructor in mindful eating and food behavior psychology. Guides students in developing skills to facilitate healthy habit change processes and mindful eating. Designs modules on healthy relationships with food and supervises clinical practice in holistic coaching. Develops applied research on the effectiveness of mindful eating interventions across different populations.',
  ARRAY[
    'Design of 6 curriculum modules in mindful eating psychology',
    'Supervision of over 40 students in health coaching practice',
    'Implementation of experiential methodologies in meditation and self-awareness',
    'Creation of food habit assessment protocols adopted institutionally',
    '96% student satisfaction in course evaluations'
  ], 'Madrid, Spain (Remote)', 1, true, NOW(), NULL),

  -- Experience 2: Private Online Practice
  (v_user_id, 'Private Health Coaching Practice', 'Independent Health Coach', '2021-03-01', '2023-08-31', false, 'FREELANCE',
  'Private health coaching practice specialized in mindful eating and weight management from a holistic approach. Individual and group sessions to develop healthy relationships with food. Application of positive psychology and behavior change principles. Personalized follow-up with continuous adjustments based on client progress.',
  ARRAY[
    'Attended over 120 clients in food habit change processes',
    'Development of personalized 12-week "Mindful Transformation" program',
    '95% satisfaction rate in 6-month follow-ups',
    'Average 50% reduction in emotional eating episodes',
    'Creation of digital resources and self-monitoring tools'
  ], 'San Francisco, CA (Online)', 2, true, NOW(), NULL),

  -- Experience 3: Corporate Wellness Consulting (Current)
  (v_user_id, 'Wellness Works Consulting', 'Corporate Wellness Facilitator', '2019-01-01', NULL, true, 'FREELANCE',
  'Design and implementation of wellness programs for technology companies in Silicon Valley. Specialization in mindful eating, stress management, and creating healthy organizational cultures. Facilitation of interactive workshops on mindful eating and self-care. Impact evaluation of programs on health and productivity indicators.',
  ARRAY[
    'Implementation of wellness programs in 15+ tech companies',
    'Facilitation of "Mindful Lunch" workshops with participation of over 500 employees',
    'Design of mindful nutrition strategies for high-pressure environments',
    '40% reduction in burnout indices related to eating',
    '35% improvement in energy and concentration reported by participants'
  ], 'San Francisco, CA', 3, true, NOW(), NULL),

  -- Experience 4: SF Wellness Center
  (v_user_id, 'San Francisco Wellness Center', 'Health Coach', '2017-06-01', '2021-02-28', false, 'FULL_TIME',
  'Health coach at integrated holistic health center. Worked with patients in weight loss programs, type 2 diabetes management, and eating disorders, using a mindful eating approach. Collaboration with multidisciplinary team of nutritionists, psychologists, and physicians. Facilitation of therapeutic groups and educational workshops.',
  ARRAY[
    'Coordination of group mindful eating programs for 200+ participants',
    'Collaboration with nutritionists and psychologists on integrated treatment plans',
    'Development of mindful cooking and healthy shopping workshops',
    'Recognition as "Coach of the Year 2020" at the center',
    '82% program completion rate with sustained improvements'
  ], 'San Francisco, CA', 4, true, NOW(), NULL);

  RAISE NOTICE '✅ 4 experiencias profesionales creadas';

  -- =====================================================
  -- 4. EDUCATION
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES

  -- Education 1: M.A. at SF State
  (v_user_id, 'San Francisco State University', 'Master of Arts (M.A.)', 'Health Psychology', '2014-09-01', '2016-05-31', false, 'GPA 3.9/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),

  -- Education 2: B.A. at UC Berkeley
  (v_user_id, 'University of California, Berkeley', 'Bachelor of Arts (B.A.)', 'Psychology', '2008-09-01', '2012-05-31', false, 'GPA 3.7/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),

  -- Education 3: IIN Certification
  (v_user_id, 'Institute for Integrative Nutrition (IIN)', 'Health Coaching Certification', 'Integrative Health Coaching', '2016-09-01', '2017-05-31', false, 'AADP and ICHWC accredited certification', 3, true, NOW(), NULL);

  RAISE NOTICE '✅ 3 títulos educativos creados';

  -- =====================================================
  -- 5. SKILLS
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
  (v_user_id, 'Mindful Eating', 'EXPERT', 7, 'Therapeutic Specialization', 1),
  (v_user_id, 'Health Coaching', 'EXPERT', 7, 'Coaching', 2),
  (v_user_id, 'Positive Psychology', 'ADVANCED', 6, 'Psychology', 3),
  (v_user_id, 'Behavior Change', 'EXPERT', 7, 'Psychology', 4),
  (v_user_id, 'Corporate Wellness', 'ADVANCED', 5, 'Organizational Wellness', 5),
  (v_user_id, 'Guided Meditation', 'ADVANCED', 5, 'Mindfulness', 6),
  (v_user_id, 'Wellness Program Design', 'EXPERT', 6, 'Program Development', 7),
  (v_user_id, 'Cognitive-Behavioral Therapy', 'ADVANCED', 5, 'Therapeutic Methodologies', 8),
  (v_user_id, 'Intuitive Nutrition', 'ADVANCED', 6, 'Nutrition', 9),
  (v_user_id, 'Group Facilitation', 'EXPERT', 7, 'Facilitation', 10),
  (v_user_id, 'Stress Management', 'ADVANCED', 6, 'Self-Care', 11),
  (v_user_id, 'Motivational Interviewing', 'ADVANCED', 5, 'Coaching Techniques', 12),
  (v_user_id, 'Health Education', 'EXPERT', 7, 'Education', 13),
  (v_user_id, 'Therapeutic Communication', 'ADVANCED', 7, 'Communication', 14),
  (v_user_id, 'Eating Disorder Prevention', 'ADVANCED', 4, 'Mental Health', 15);

  RAISE NOTICE '✅ 15 habilidades creadas';

  -- =====================================================
  -- 6. LANGUAGES
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (v_user_id, 'English', 'Native', true, 1),
  (v_user_id, 'Spanish', 'B2', false, 2);

  RAISE NOTICE '✅ 2 idiomas agregados';

  -- =====================================================
  -- 7. CERTIFICATIONS (Portfolio Items)
  -- =====================================================
INSERT INTO portfolio_items (profile_id, type, title, description, issuer, issue_date, credential_id, credential_url, verified, sort_order)
VALUES
(
  v_user_id,
  'CERTIFICATION',
  'Certified Health Coach (CHC)',
  'Professional certification in integrative health coaching granted by the Institute for Integrative Nutrition, accredited by AADP (American Association of Drugless Practitioners) and ICHWC (International Consortium for Health & Wellness Coaching).',
  'Institute for Integrative Nutrition',
  '2017-05-15',
  'IIN-CHC-2017-5892',
  'https://www.integrativenutrition.com',
  true,
  1
),
(
  v_user_id,
  'CERTIFICATION',
  'Mindful Eating Facilitator',
  'Specialized certification in mindful eating program facilitation granted by The Center for Mindful Eating. Training in MB-EAT protocol (Mindfulness-Based Eating Awareness Training).',
  'The Center for Mindful Eating',
  '2018-08-20',
  'TCME-MEF-2018-341',
  'https://www.thecenterformindfuleating.org',
  true,
  2
),
(
  v_user_id,
  'CERTIFICATION',
  'Behavior Change Specialist (BCS)',
  'Certification in evidence-based behavior change strategies, granted by American Council on Exercise. Specialization in motivational interviewing techniques and goal setting.',
  'American Council on Exercise',
  '2019-11-10',
  'ACE-BCS-2019-7743',
  'https://www.acefitness.org',
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
  'Online Course "Mindful Eating"',
  '8-week program designed to help people transform their relationship with food through mindful eating practices. Includes instructional videos, guided meditations, journaling exercises, and live group coaching sessions. Over 300 students have completed the program with significant results in reducing emotional eating and improving body satisfaction.',
  'https://mindfuleatingsf.com/curso',
  ARRAY['Mindful Eating', 'Online Courses', 'Health Coaching', 'Habit Change'],
  true,
  1
),
(
  v_user_id,
  'PROJECT',
  'Corporate Workshops "Mindful Lunch Break"',
  '90-minute interactive workshop series designed for Silicon Valley tech companies. The workshops teach mindful eating techniques applicable during work hours, helping reduce stress and improve energy. Implemented in 15+ companies including startups and corporations, with over 500 participants and average evaluations of 4.8/5.',
  NULL,
  ARRAY['Corporate Wellness', 'Workshops', 'Mindfulness', 'Productivity'],
  true,
  2
),
(
  v_user_id,
  'PROJECT',
  'Digital Guide "21 Days of Healthy Habits"',
  'Interactive digital resource that guides users through 21 days of behavior change challenges based on behavioral science. Includes daily action plan, progress tracker, mindful recipes, and emotional management techniques. Downloaded by over 1,200 people with 67% completion rate.',
  'https://mindfuleatingsf.com/21-dias',
  ARRAY['Habit Change', 'Digital Resources', 'Self-Care'],
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
  'Guest Columnist - "Holistic Health Daily" Blog',
  'Regular collaboration with leading holistic health blog, publishing monthly articles on mindful eating, nutrition psychology, and practical habit change strategies. Articles reach an audience of over 50,000 monthly readers.',
  ARRAY['Outreach', 'Writing', 'Public Education']::text[],
  1
),
(
  v_user_id,
  'COLLABORATION',
  'Speaker - Annual Health Coaching Conference 2022',
  'Keynote presentation on "Integrating Mindful Eating in Health Coaching Practice" at the National Health Coaching Conference in San Diego. Attendance of over 300 health professionals and certified coaches.',
  ARRAY['Conferences', 'Professional Leadership', 'Continuing Education']::text[],
  2
),
(
  v_user_id,
  'COLLABORATION',
  'Recurring Guest - Wellness and Psychology Podcasts',
  'Participation as expert guest on popular wellness podcasts including "The Wellness Show", "Mind Body Health", and "Psychology of Eating". Topics: mindful eating, behavior change, and mental health related to eating.',
  ARRAY['Podcasts', 'Outreach', 'Digital Media']::text[],
  3
);

  RAISE NOTICE '✅ 3 colaboraciones agregadas';

  -- =====================================================
  -- 10. VERIFICATION STAMPS
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Email verification
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "david.chen@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Identity verification
  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Passport", "document_number": "****8901", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Education verification
  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "M.A.", "institution": "San Francisco State University", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Employment verification
  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Mindful Eating and Habit Change Tutor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Language verification
  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)", "Spanish (B2)"], "verified_method": "manual_admin"}'::jsonb,
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
  RAISE NOTICE '✅ PERFIL DE DAVID CHEN CREADO EXITOSAMENTE';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE 'Nombre: David Chen';
  RAISE NOTICE 'Email: david.chen@iseih.edu';
  RAISE NOTICE 'Posición: Tutor de Mindful Eating y Cambio de Hábitos';
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
  'DAVID CHEN - VERIFICACIÓN COMPLETA' as usuario,
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
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'david.chen@iseih.edu')
GROUP BY p.id, p.full_name, p.headline, p.template;
