-- =====================================================
-- COMPLETE PROFILE CREATION: RACHEL STEVENS, RD
-- Holistic Nutrition Tutor - ISEIH
-- Email: rachel.stevens@iseih.edu
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Find existing user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'rachel.stevens@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please create first in Supabase Auth.';
  END IF;

  RAISE NOTICE '👤 Creating complete profile for Rachel Stevens...';
  RAISE NOTICE 'UUID: %', v_user_id;

  -- =====================================================
  -- 1. UPDATE MAIN PROFILE
  -- =====================================================

  UPDATE profiles SET
    full_name = 'Rachel Stevens',
    headline = 'Holistic Nutrition Tutor',
    title = 'Registered Dietitian and Functional Nutrition Specialist',
    summary = 'Registered dietitian with 10 years of experience combining clinical nutrition with holistic and functional approaches. Specialized in preventive nutrition, mindful eating, and personalized plan design that integrates emotional, cultural, and lifestyle aspects. As a tutor at ISEIH, trains professionals in integrative nutrition methodologies. Facilitates workshops on gut-brain connection and collaborates with food technology for wellness.',
    location = 'Chicago, IL',
    country_code = 'US',
    slug = 'rachel-stevens-holistic-nutrition',
    template = 'passport',
    template_color = '#0052FF',
    show_verified_credentials = true,
    show_connect_links = true,
    show_qr_code = true,
    plan = 'free',
    role = 'professional',
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Main profile updated';

  -- =====================================================
  -- 2. CLEAN EXISTING DATA
  -- =====================================================

  DELETE FROM experiences WHERE profile_id = v_user_id;
  DELETE FROM education WHERE profile_id = v_user_id;
  DELETE FROM skills WHERE profile_id = v_user_id;
  DELETE FROM languages WHERE profile_id = v_user_id;
  DELETE FROM portfolio_items WHERE profile_id = v_user_id;
  DELETE FROM stamps WHERE profile_id = v_user_id;

  RAISE NOTICE '🧹 Previous data deleted';

  -- =====================================================
  -- 3. PROFESSIONAL EXPERIENCES
  -- =====================================================

  INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, employment_type, description, achievements, location, sort_order, verified, verified_at, verified_by) VALUES

  -- Experience 1: ISEIH (Current)
  (v_user_id, 'ISEIH - Higher Institute of Innovative Holistic Studies', 'Holistic Nutrition Tutor', '2023-01-01', NULL, true, 'FULL_TIME',
  'Faculty in graduate programs in Holistic and Integrative Nutrition. Designs curricula on functional nutrition, mindful eating, and gut-emotion connection. Supervises student research projects on diet impact on mental health. Coordinates collaborations with functional medicine clinics. Develops educational resources on preventive and therapeutic nutrition.',
  ARRAY[
    'Design of 10 curricular modules in functional nutrition and integrative medicine',
    'Direction of 50+ master''s thesis projects on nutritional interventions',
    'Implementation of real clinical case methodology in teaching',
    'Creation of holistic nutritional assessment protocols adopted internationally',
    '98% student satisfaction in course evaluations'
  ], 'Madrid, Spain', 1, true, NOW(), NULL),

  -- Experience 2: Whole Life Nutrition (Current)
  (v_user_id, 'Whole Life Nutrition', 'Private Holistic Nutrition Consultant', '2019-01-01', NULL, true, 'FREELANCE',
  'Comprehensive nutritional counseling for chronic disease prevention. Development of personalized nutrition and wellness strategies considering emotional, cultural, and lifestyle factors. Application of functional medicine principles to identify roots of nutritional imbalances. Client education in mindful and sustainable nutrition. Continuous follow-up with personalized adjustments.',
  ARRAY[
    'Care to over 200 clients with significant improvements in health markers',
    'Development of personalized functional nutrition protocols for 15+ conditions',
    '85% long-term adherence rate to nutritional plans',
    'Average 40% reduction in digestive symptoms in IBS clients',
    '96% client satisfaction according to follow-up surveys'
  ], 'Chicago, IL, USA', 2, true, NOW(), NULL),

  -- Experience 3: Mindful Eating Institute (Current)
  (v_user_id, 'Mindful Eating Institute', 'Workshop Instructor', '2018-01-01', NULL, true, 'PART_TIME',
  'Facilitation of educational programs on mindful eating and healthy cooking for community and corporate groups. Teaching mindfulness techniques applied to food relationships. Development of experiential activities to reconnect with hunger and satiety signals. Creation of accessible educational resources on evidence-based nutrition.',
  ARRAY[
    'Facilitation of over 150 workshops with total attendance of 2,000+ participants',
    'Development of 8-week Eating Mindfully program implemented in 20 organizations',
    'Creation of therapeutic cooking curriculum for stress management',
    '93% participant satisfaction with sustained changes in eating habits',
    'Collaboration with tech companies for nutritional wellness programs'
  ], 'Chicago, IL, USA', 3, true, NOW(), NULL),

  -- Experience 4: Chicago Community Hospital
  (v_user_id, 'Chicago Community Hospital', 'Clinical Nutritionist', '2015-01-01', '2019-12-31', false, 'FULL_TIME',
  'Nutritional care to hospitalized patients, including nutritional status assessment and dietary education for medical discharge. Collaboration with multidisciplinary teams in intensive care, oncology, and cardiology units. Development of therapeutic nutrition plans for acute and chronic medical conditions. Education of patients and families on medical nutrition.',
  ARRAY[
    'Nutritional care to over 500 hospitalized patients annually',
    'Implementation of nutritional support protocols in ICU with 30% improvement in outcomes',
    'Development of bilingual educational materials for diabetic patients',
    'Coordination with 50+ physicians for nutrition therapy optimization',
    'Recognition as Dietitian of the Year 2018 by the hospital'
  ], 'Chicago, IL, USA', 4, true, NOW(), NULL);

  RAISE NOTICE '✅ 4 professional experiences created';

  -- =====================================================
  -- 4. EDUCATION
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES

  -- Education 1: M.S. at University of Illinois at Chicago
  (v_user_id, 'University of Illinois at Chicago', 'Master of Science (M.S.)', 'Clinical Nutrition', '2013-08-01', '2015-05-01', false, 'GPA 3.92/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),

  -- Education 2: B.S. at Penn State University
  (v_user_id, 'Penn State University', 'Bachelor of Science (B.S.)', 'Nutrition Sciences', '2007-08-01', '2011-05-01', false, 'GPA 3.78/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),

  -- Education 3: Certification at Functional Medicine University
  (v_user_id, 'Functional Medicine University', 'Advanced Certification', 'Functional Nutrition', '2017-01-01', '2017-12-31', false, 'Certification with Distinction', 3, true, NOW(), NULL);

  RAISE NOTICE '✅ 3 educational degrees created';

  -- =====================================================
  -- 5. SKILLS
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
  (v_user_id, 'Holistic Nutrition', 'EXPERT', 10, 'Integrative Nutrition', 1),
  (v_user_id, 'Mindful Eating', 'EXPERT', 8, 'Mindfulness and Nutrition', 2),
  (v_user_id, 'Functional Nutrition', 'EXPERT', 7, 'Functional Medicine', 3),
  (v_user_id, 'Personalized Dietary Planning', 'EXPERT', 10, 'Nutritional Consulting', 4),
  (v_user_id, 'Integrative Health', 'EXPERT', 8, 'Holistic Health', 5),
  (v_user_id, 'Nutritional Education', 'EXPERT', 10, 'Health Education', 6),
  (v_user_id, 'Clinical Nutrition', 'EXPERT', 10, 'Clinical Practice', 7),
  (v_user_id, 'Gut-Brain Connection', 'ADVANCED', 6, 'Nutritional Neuroscience', 8),
  (v_user_id, 'Preventive Nutrition', 'EXPERT', 9, 'Disease Prevention', 9),
  (v_user_id, 'Nutritional Assessment', 'EXPERT', 10, 'Clinical Assessment', 10),
  (v_user_id, 'Chronic Disease Management', 'ADVANCED', 8, 'Therapeutic Nutrition', 11),
  (v_user_id, 'Therapeutic Cooking', 'ADVANCED', 7, 'Culinary Education', 12),
  (v_user_id, 'Emotional Nutrition', 'ADVANCED', 6, 'Food Psychology', 13),
  (v_user_id, 'Functional Supplementation', 'ADVANCED', 7, 'Functional Medicine', 14),
  (v_user_id, 'Nutritional Communication', 'EXPERT', 9, 'Science Communication', 15);

  RAISE NOTICE '✅ 15 skills created';

  -- =====================================================
  -- 6. LANGUAGES
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (v_user_id, 'English', 'Native', true, 1),
  (v_user_id, 'Spanish', 'B2', false, 2);

  RAISE NOTICE '✅ 2 languages added';

  -- =====================================================
  -- 7. CERTIFICATIONS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, expiry_date, credential_id, credential_url, description, verified, sort_order) VALUES

  -- Certification 1: Registered Dietitian (RD)
  (v_user_id, 'CERTIFICATION',
   'Registered Dietitian (RD)',
   'Commission on Dietetic Registration',
   '2015-06', '2026-06', 'RD-IL-87456',
   'https://www.cdrnet.org/certifications',
   'National registered dietitian certification granted by the Academy of Nutrition and Dietetics. Accredits professional competence in nutritional assessment, medical nutrition therapy, dietary education, and evidence-based clinical practice. Requires formal education, supervised practice, and national examination.',
   true, 1),

  -- Certification 2: Certified Nutrition Specialist (CNS)
  (v_user_id, 'CERTIFICATION',
   'Certified Nutrition Specialist (CNS)',
   'Board for Certification of Nutrition Specialists',
   '2018-03', NULL, 'CNS-2018-3421',
   'https://theboardforcns.org/verify',
   'Advanced certification in specialized nutrition granted by the BCNS. Accredits mastery in human nutrition, nutritional biochemistry, physiology, and advanced clinical practice. Recognizes specialization in individualized nutritional assessment, nutritional therapy, and disease prevention through nutrition.',
   true, 2),

  -- Certification 3: Integrative Health Coach
  (v_user_id, 'CERTIFICATION',
   'Integrative Health Coach',
   'Duke Integrative Medicine',
   '2019-09', NULL, 'IHC-DUKE-2019-892',
   'https://dukeintegrativemedicine.org/health-coaching',
   'Certification in integrative health coaching granted by Duke University. Training in motivational interviewing, behavior change, goal setting, and holistic accompaniment. Enables guiding clients in health habit and lifestyle transformation processes.',
   true, 3);

  RAISE NOTICE '✅ 3 certifications created';

  -- =====================================================
  -- 8. PROJECTS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, featured, sort_order, created_at) VALUES

  -- Project 1: Gut and Emotion Protocol
  (v_user_id,
   'Gut and Emotion Protocol - Clinical Guide',
   'Development of comprehensive clinical guide for professionals on the gut-brain connection and its impact on mental health. Integrates scientific evidence on microbiota, intestinal neurotransmitters, inflammation, and emotional health. Includes assessment protocols, specific nutritional strategies, supplementation recommendations, and mindful eating techniques. Review of 200+ scientific studies and clinical cases. Adopted by 50+ integrative health professionals. Presented at the International Congress of Functional Medicine 2022. Translated into 3 languages.',
   'PROJECT',
   'https://wholenutrition.com/gut-emotion-protocol',
   ARRAY['Microbiota', 'Mental Health', 'Functional Medicine', 'Clinical Guide', 'Neuroscience'],
   true, 4, '2022-01-01'),

  -- Project 2: Healthy Urban Gardens
  (v_user_id,
   'Healthy Urban Gardens - Community Initiative',
   'Coordination of community initiative to improve access to fresh food in underserved areas of Chicago. Creation of urban gardens in 8 neighborhoods with workshops on cultivation, harvest, and food preparation. Training of 120 residents in urban gardening, nutrition, and healthy cooking. Distribution of over 5,000 pounds of fresh produce to low-income families. Collaboration with local schools for children''s nutrition education. Recognized by the City of Chicago as Community Impact Project 2021. Model replicated in 3 additional cities.',
   'PROJECT',
   NULL,
   ARRAY['Food Security', 'Community Health', 'Urban Agriculture', 'Nutritional Education'],
   true, 5, '2021-01-01'),

  -- Project 3: Healing Foods Webinar
  (v_user_id,
   'Healing Foods Webinar - Online Educational Series',
   'Creation and presentation of online educational series on functional nutrition with over 1,000 views. 12 monthly episodes on medicinal, anti-inflammatory, and neuroprotective foods. Topics: superfoods, adaptogens, brain nutrition, fermented foods, healthy fats, phytochemicals. Interactive format with live Q&A sessions. Average rating: 4.9/5. Over 300 active participants. Downloadable resources including recipes, shopping lists, and preparation guides. Recordings available on educational platform.',
   'PROJECT',
   'https://youtube.com/healingfoodswebinar',
   ARRAY['Online Education', 'Functional Nutrition', 'Medicinal Foods', 'Webinar', 'Outreach'],
   true, 6, '2020-01-01');

  RAISE NOTICE '✅ 3 projects added';

  -- =====================================================
  -- 9. COLLABORATIONS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES

  -- Collaboration 1: Nutrition Today
  (v_user_id,
   'Guest Writer - Nutrition Today Magazine',
   'Regular contribution as guest author in specialized scientific nutrition magazine with Q2 impact factor. Publication of review articles on integrative nutrition, mindful eating, and functional medicine. Published articles: Mindful Eating: Evidence-Based Approach (2022), Gut-Brain Axis in Mental Health (2021), Functional Nutrition in Chronic Disease Prevention (2020). Over 2,000 accumulated citations. Articles shared by international professional associations. Peer reviewer for scientific articles since 2021.',
   'COLLABORATION',
   ARRAY['Scientific Publication', 'Academic Writing', 'Outreach', 'Research'],
   7),

  -- Collaboration 2: Functional Medicine
  (v_user_id,
   'Speaker at Functional Medicine and Integrative Nutrition Summits',
   'Regular presentations at national and international conferences on functional nutrition and integrative medicine. Has presented at 12 events since 2017 with audiences of 200-1,000 professionals. Topics: functional nutrition protocols, microbiota assessment, nutrition in mental health, genetics-based dietary personalization. 4-8 hour practical workshops with clinical cases. Recognized as Emerging Leader in Functional Nutrition by IFM in 2020. Recurring guest on Functional Medicine Radio podcast.',
   'COLLABORATION',
   ARRAY['Conferences', 'Functional Medicine', 'Public Speaking', 'Professional Leadership'],
   8),

  -- Collaboration 3: FoodTech Startups
  (v_user_id,
   'Wellness Advisor - Food Technology Startups',
   'Pro-bono consulting for food technology startups focused on health and wellness. Advisory on product development, nutritional validation, and consumer education strategies. Collaboration with 5 startups: meal planning apps, healthy meal kit services, nutritional coaching platforms. Review of educational content and nutritional recommendation algorithms. Contribution to the success of 2 startups that reached Series A. Mentorship of entrepreneurs at FoodTech Accelerator Chicago.',
   'COLLABORATION',
   ARRAY['Startups', 'Food Technology', 'Innovation', 'Mentorship', 'Pro-Bono'],
   9);

  RAISE NOTICE '✅ 3 collaborations added';

  -- =====================================================
  -- 10. VERIFICATION STAMPS
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Email verification
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "rachel.stevens@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Identity verification
  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Passport", "document_number": "****8910", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Education verification
  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "M.S. in Clinical Nutrition", "institution": "University of Illinois at Chicago", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Employment verification
  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Holistic Nutrition Tutor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Language verification
  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)", "Spanish (B2)"], "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW());

  RAISE NOTICE '✅ 5 basic stamps created';

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

  RAISE NOTICE '✅ Certification stamps created';

  -- =====================================================
  -- FINAL SUMMARY
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ RACHEL STEVENS PROFILE CREATED SUCCESSFULLY';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE 'Name: Rachel Stevens, RD';
  RAISE NOTICE 'Email: rachel.stevens@iseih.edu';
  RAISE NOTICE 'Position: Holistic Nutrition Tutor';
  RAISE NOTICE 'Template: passport (#0052FF)';
  RAISE NOTICE '';
  RAISE NOTICE 'STATISTICS:';
  RAISE NOTICE '- Experiences: 4';
  RAISE NOTICE '- Education: 3 degrees';
  RAISE NOTICE '- Skills: 15';
  RAISE NOTICE '- Languages: 2';
  RAISE NOTICE '- Certifications: 3';
  RAISE NOTICE '- Projects: 3';
  RAISE NOTICE '- Collaborations: 3';
  RAISE NOTICE '- Verified stamps: 8';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';

END $$;

-- =====================================================
-- FINAL VERIFICATION
-- =====================================================

SELECT
  'RACHEL STEVENS - COMPLETE VERIFICATION' as user,
  p.full_name,
  p.headline,
  p.template,
  COUNT(DISTINCT e.id) as experiences,
  COUNT(DISTINCT ed.id) as education,
  COUNT(DISTINCT sk.id) as skills,
  COUNT(DISTINCT l.id) as languages,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'CERTIFICATION') as certifications,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'PROJECT') as projects,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'COLLABORATION') as collaborations,
  COUNT(DISTINCT s.id) as verified_stamps
FROM profiles p
LEFT JOIN experiences e ON e.profile_id = p.id
LEFT JOIN education ed ON ed.profile_id = p.id
LEFT JOIN skills sk ON sk.profile_id = p.id
LEFT JOIN languages l ON l.profile_id = p.id
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id
LEFT JOIN stamps s ON s.profile_id = p.id AND s.status = 'VERIFIED'
WHERE p.email = 'rachel.stevens@iseih.edu'
GROUP BY p.id, p.full_name, p.headline, p.template;
