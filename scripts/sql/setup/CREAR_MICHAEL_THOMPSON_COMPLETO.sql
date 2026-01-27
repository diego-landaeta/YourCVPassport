-- =====================================================
-- COMPLETE CREATION SCRIPT: MICHAEL THOMPSON
-- Addictions and Recovery Tutor - ISEIH
-- =====================================================
-- This script creates the complete profile for Michael Thompson
-- including experiences, education, skills, languages,
-- certifications, projects, collaborations and stamps
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_cert_id_1 UUID;
  v_cert_id_2 UUID;
  v_cert_id_3 UUID;
BEGIN

  -- =====================================================
  -- 0. GET USER UUID
  -- =====================================================
  -- Change this email to the actual user created in Auth
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'michael.thompson@iseih.edu'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email michael.thompson@iseih.edu not found. Create in Auth first.';
  END IF;

  RAISE NOTICE '🔍 User found: %', v_user_id;

  -- =====================================================
  -- 1. UPDATE MAIN PROFILE
  -- =====================================================

  UPDATE profiles SET
    full_name = 'Michael Thompson',
    headline = 'Addictions and Recovery Tutor',
    title = 'Certified Addiction Counselor (CAC-II)',
    summary = 'Specialist with 11 years of experience in recovery processes and mental health. Expert in integrating traditional therapies with holistic approaches such as mindfulness and emotional regulation. As a tutor at ISEIH, trains professionals in implementing complementary methods in clinical practice. Facilitates online conscious recovery programs and provides strategic consulting for clinics specialized in addictions and integrative mental health.',
    location = 'Phoenix, AZ',
    country_code = 'US',
    slug = 'michael-thompson-addictions-recovery-tutor',
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
  -- 2. CLEAN PREVIOUS DATA
  -- =====================================================

  DELETE FROM experiences WHERE profile_id = v_user_id;
  DELETE FROM education WHERE profile_id = v_user_id;
  DELETE FROM skills WHERE profile_id = v_user_id;
  DELETE FROM languages WHERE profile_id = v_user_id;
  DELETE FROM portfolio_items WHERE profile_id = v_user_id;
  DELETE FROM stamps WHERE profile_id = v_user_id;

  RAISE NOTICE '🗑️  Previous data deleted';

  -- =====================================================
  -- 3. WORK EXPERIENCE (4 positions)
  -- =====================================================

  INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, employment_type, description, achievements, location, sort_order, verified, verified_at, verified_by) VALUES

  -- Experience 1: ISEIH Tutor (current)
  (v_user_id, 'ISEIH - Higher Institute of Innovative Holistic Studies', 'Addictions and Recovery Tutor', '2023-01-01', NULL, true, 'PART_TIME',
  'Academic supervision of students and development of educational modules on mindfulness applied to recovery. Facilitation of web seminars and personalized mentoring in integrative clinical practices for addictions.',
  ARRAY[
    'Academic supervision of students in recovery',
    'Development of modules on mindfulness and addictions',
    'Facilitation of web seminars on holistic approaches',
    'Personalized mentoring in clinical practices'
  ], 'Phoenix, AZ, USA', 1, true, NOW(), NULL),

  -- Experience 2: Independent Tutor
  (v_user_id, 'Private Practice', 'Independent Tutor (Holistic Programs)', '2022-01-01', '2023-12-31', false, 'FREELANCE',
  'Design and delivery of recovery programs integrating mindfulness and emotional regulation. Strategic consulting for clinics on implementing complementary therapies. Online training for professionals in holistic approaches.',
  ARRAY[
    'Design of holistic recovery programs',
    'Consulting for clinics on complementary therapies',
    'Online training of professionals',
    'Served over 200 professional consultants'
  ], 'Phoenix, AZ, USA', 2, true, NOW(), NULL),

  -- Experience 3: New Beginnings Coordinator
  (v_user_id, 'New Beginnings Clinic', 'Recovery Programs Coordinator', '2018-01-01', '2022-12-31', false, 'FULL_TIME',
  'Supervision of therapeutic teams and development of personalized treatment plans. Implementation of support groups and specific relapse prevention workshops. Coordination of comprehensive care for residential and outpatient patients.',
  ARRAY[
    'Supervision of multidisciplinary therapeutic teams',
    'Development of personalized treatment plans',
    'Implementation of structured support groups',
    'Coordination of care for 150+ annual patients'
  ], 'Phoenix, AZ, USA', 3, true, NOW(), NULL),

  -- Experience 4: Desert Hope Counselor
  (v_user_id, 'Desert Hope Treatment Center', 'Addiction Counselor', '2013-06-01', '2018-12-31', false, 'FULL_TIME',
  'Direct care to patients in residential rehabilitation. Facilitation of group and individual therapy under cognitive-behavioral model. Crisis management and family intervention. Intensive work with patients in 30, 60, and 90-day programs.',
  ARRAY[
    'Direct care to patients in residential rehabilitation',
    'Facilitation of group and individual therapy (CBT)',
    'Crisis management and family intervention',
    'Served over 400 patients in 5 years'
  ], 'Phoenix, AZ, USA', 4, true, NOW(), NULL);

  RAISE NOTICE '✅ 4 work experiences created';

  -- =====================================================
  -- 4. EDUCATION (3 degrees)
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES

  (v_user_id, 'Arizona State University', 'M.A. in Clinical Counseling', 'Clinical Counseling', '2010-09-01', '2012-05-31', false, 'Cum Laude', 1, true, NOW(), NULL),
  (v_user_id, 'University of New Mexico', 'B.S. in Psychology', 'Psychology', '2004-09-01', '2008-05-31', false, 'Magna Cum Laude', 2, true, NOW(), NULL),
  (v_user_id, 'NAADAC', 'Certification in Addiction Counseling', 'Addiction Counseling', '2012-09-01', '2013-06-30', false, 'Certified', 3, true, NOW(), NULL);

  RAISE NOTICE '✅ 3 academic degrees added';

  -- =====================================================
  -- 5. SKILLS (15 skills)
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
  (v_user_id, 'Addiction Counseling', 'EXPERT', 11, 'Addictions', 1),
  (v_user_id, 'Mindfulness', 'EXPERT', 8, 'Holistic Approaches', 2),
  (v_user_id, 'Emotional Regulation', 'ADVANCED', 9, 'Therapeutic Techniques', 3),
  (v_user_id, 'Crisis Intervention', 'EXPERT', 11, 'Clinical Intervention', 4),
  (v_user_id, 'Group Therapy', 'EXPERT', 11, 'Therapeutic Modalities', 5),
  (v_user_id, 'Online Training', 'ADVANCED', 4, 'Education', 6),
  (v_user_id, 'Holistic Approach', 'EXPERT', 8, 'Integrative Approaches', 7),
  (v_user_id, 'Relapse Prevention (MBRP)', 'EXPERT', 7, 'Prevention', 8),
  (v_user_id, 'Cognitive-Behavioral Therapy', 'ADVANCED', 11, 'Traditional Therapies', 9),
  (v_user_id, 'Family Intervention', 'ADVANCED', 9, 'Family Therapy', 10),
  (v_user_id, 'Program Design', 'ADVANCED', 6, 'Intervention Development', 11),
  (v_user_id, 'Clinical Supervision', 'ADVANCED', 5, 'Professional Training', 12),
  (v_user_id, 'Individual Therapy', 'EXPERT', 11, 'Therapeutic Modalities', 13),
  (v_user_id, 'Crisis Management', 'EXPERT', 11, 'Emergency Intervention', 14),
  (v_user_id, 'Integrative Mental Health', 'ADVANCED', 8, 'Integrative Approaches', 15);

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

  -- Certification 1: CAC-II
  (v_user_id, 'CERTIFICATION',
   'Certified Addiction Counselor (CAC-II)',
   'NAADAC - The Association for Addiction Professionals',
   '2013-06', NULL, 'CAC-II-2013-MT678',
   'https://www.naadac.org/credentials/verify/MT678',
   'Advanced-level professional credential in addiction counseling. Certifies competence in assessment, diagnosis, treatment planning, individual and group counseling, case management, and relapse prevention. Requires master''s degree in related field, 6,000 hours of supervised experience, and passing national examination.',
   true, 1),

  -- Certification 2: MBRP
  (v_user_id, 'CERTIFICATION',
   'Mindfulness-Based Relapse Prevention (MBRP) Facilitator',
   'University of Washington Addictive Behaviors Research Center',
   '2016-08', NULL, 'MBRP-FAC-2016-456',
   'https://www.mindfulrp.com/verify/456',
   'Certification as facilitator of MBRP programs that integrate mindfulness meditation with evidence-based relapse prevention. Intensive training in 8-week MBRP protocol, meditation practices, and group facilitation skills. Requires 40 hours of training and practical supervision.',
   true, 2),

  -- Certification 3: Crisis Intervention
  (v_user_id, 'CERTIFICATION',
   'Crisis Intervention Specialist',
   'Crisis Prevention Institute (CPI)',
   '2014-03', '2026-03', 'CPI-CIS-2014-789',
   'https://www.crisisprevention.com/verify/789',
   'Certification in specialized intervention for mental health and addiction crises. Training in de-escalation techniques, suicide risk assessment, acute intoxication intervention, and safety protocols. Requires 32 hours of training and recertification every 2 years.',
   true, 3);

  RAISE NOTICE '✅ 3 certifications created';

  -- Capture certification IDs to create stamps
  SELECT id INTO v_cert_id_1 FROM portfolio_items WHERE profile_id = v_user_id AND type = 'CERTIFICATION' AND title LIKE '%Addiction Counselor%' LIMIT 1;
  SELECT id INTO v_cert_id_2 FROM portfolio_items WHERE profile_id = v_user_id AND type = 'CERTIFICATION' AND title LIKE '%Mindfulness-Based%' LIMIT 1;
  SELECT id INTO v_cert_id_3 FROM portfolio_items WHERE profile_id = v_user_id AND type = 'CERTIFICATION' AND title LIKE '%Crisis Intervention%' LIMIT 1;

  -- =====================================================
  -- 8. PROJECTS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, featured, sort_order, created_at) VALUES

  -- Project 1: Conscious Recovery Online Program
  (v_user_id,
   'Conscious Recovery Online Program - Digital Course',
   '12-week digital course integrating mindfulness and CBT for relapse prevention. Designed for people in recovery and professionals seeking self-care tools. Over 500 active students since its launch in 2023. Content: 12 weekly modules with videos, guided meditations, emotional regulation exercises, relapse prevention tools, and monthly live sessions. Includes private online support group and downloadable resources. Results: 87% program completion rate. 92% of participants report improvement in emotional regulation skills. 78% maintain sobriety 6 months post-program. Testimonials highlight the accessibility and flexibility of the online format.',
   'PROJECT',
   'https://recuperacionconsciente.com',
   ARRAY['Mindfulness', 'Recovery', 'Relapse Prevention', 'Online Course', 'CBT'],
   true, 3, '2023-01-01'),

  -- Project 2: Clinical Protocols Restructuring
  (v_user_id,
   'Clinical Crisis Protocols Restructuring - New Beginnings',
   'Complete redesign of crisis intervention protocols for New Beginnings Clinic, reducing critical incidents by 40%. Project led during 2020 in response to increased crises during the COVID-19 pandemic. Methodology: Analysis of 2 years of critical incidents, literature review on best practices, interviews with therapeutic team, and design of escalated intervention protocols according to risk level. Implementation: Training of 25 clinical team members. Creation of decision flowcharts. Establishment of early warning system. Monthly crisis drills. Quarterly effectiveness evaluation. Impact: 40% reduction in critical incidents. 55% improvement in response times. Increased confidence of therapeutic team in crisis management.',
   'PROJECT',
   'https://newbeginningsclinic.org/protocolos-crisis',
   ARRAY['Crisis Intervention', 'Clinical Protocols', 'Risk Management', 'Quality Improvement', 'Training'],
   true, 4, '2020-03-01'),

  -- Project 3: Integrative Mental Health Symposium
  (v_user_id,
   'Integrative Mental Health Symposium - Regional Event',
   'Organization of regional event bringing together psychiatrists and holistic therapists to create referral networks and interdisciplinary collaboration. Held in Phoenix, AZ in 2019 with over 150 attending professionals. Objective: Reduce the gap between conventional medicine and complementary therapies in mental health and addictions. Foster respectful dialogue between different approaches. Create professional directory for collaborative referrals. Program: 2 days with panel discussions, collaborative case presentations, experiential workshops on mindfulness and yoga, and structured networking. Guest speakers: psychiatrists specialized in integrative medicine, addiction counselors, and holistic therapists. Results: Creation of Arizona Integrative Mental Health Network with 80+ professionals. Collaborative referral protocol adopted by 12 clinics. Annual follow-up with subsequent symposiums.',
   'PROJECT',
   'https://integrativehealth-az.org/simposio-2019',
   ARRAY['Integrative Mental Health', 'Regional Event', 'Interdisciplinary Collaboration', 'Networking', 'Holistic Medicine'],
   true, 5, '2019-10-01');

  RAISE NOTICE '✅ 3 projects added';

  -- =====================================================
  -- 9. COLLABORATIONS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES

  -- Collaboration 1: Psychology Today Articles
  (v_user_id,
   'Contributing Author - Psychology Today on Mindfulness and Addictions',
   'Contributing author on Psychology Today since 2018, publishing articles on the intersection between mindfulness, emotional regulation, and addiction recovery. Over 15 published articles with 50,000+ monthly readers. Topics: Mindfulness-based relapse prevention, craving management, emotional regulation in recovery, overcoming shame and guilt, and mind-body connection in healing. Impact: Articles shared by NAADAC, SAMHSA, and recovery organizations. Multiple invitations to podcasts and conferences based on articles. Reader feedback reporting practical application of shared techniques.',
   'COLLABORATION',
   ARRAY['Psychology Today', 'Writing', 'Mindfulness', 'Addictions', 'Outreach'],
   6),

  -- Collaboration 2: Conference Speaker
  (v_user_id,
   'Speaker - Conferences on Mental Health and Workplace Wellness',
   'Guest speaker at corporate conferences and occupational health events on burnout prevention, stress management, and mental wellness in work environments. Over 20 presentations since 2017. Organizations: Fortune 500 companies, professional associations, human resources conferences, and corporate wellness events. Audiences of 50-500 people. Content: Experiential workshops on mindfulness applied to work, emotional regulation techniques for high-pressure environments, prevention of stress-related addictions, and sustainable self-care for professionals. Feedback: 95% average satisfaction. Multiple repeat hires. Implementation of corporate mindfulness programs based on presentations.',
   'COLLABORATION',
   ARRAY['Conferences', 'Occupational Health', 'Burnout', 'Corporate Mindfulness', 'Wellness'],
   7),

  -- Collaboration 3: Meditation Apps Consultant
  (v_user_id,
   'Consultant - Meditation Apps Focused on Sobriety',
   'Consulting for technology startups developing meditation and mindfulness applications specifically designed for people in recovery. Advisory on content design, clinical validation, and ethical considerations. Projects: Collaboration with 3 different apps since 2019. Review of guided meditation content, design of crisis support features, and validation of responsible marketing messages. Impact: Apps reaching over 100,000 combined downloads. Clinically validated content reducing risk of counterproductive messages. User feedback highlighting content relevance for recovery.',
   'COLLABORATION',
   ARRAY['Technology', 'Apps', 'Meditation', 'Sobriety', 'Consulting'],
   8);

  RAISE NOTICE '✅ 3 collaborations added';

  -- =====================================================
  -- 10. VERIFICATION STAMPS
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Basic stamps (5)
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "michael.thompson@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Driver License", "document_number": "****6789MT", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "M.A. in Clinical Counseling", "institution": "Arizona State University", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Addictions and Recovery Tutor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)", "Spanish (B2)"], "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  -- Certification stamps (3)
  (v_user_id, 'CERTIFICATION', 'VERIFIED',
   jsonb_build_object(
     'certification_title', 'Certified Addiction Counselor (CAC-II)',
     'certification_id', v_cert_id_1::text,
     'verified_method', 'manual_admin',
     'verification_notes', 'CAC-II credential verified by NAADAC'
   ),
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'CERTIFICATION', 'VERIFIED',
   jsonb_build_object(
     'certification_title', 'Mindfulness-Based Relapse Prevention (MBRP) Facilitator',
     'certification_id', v_cert_id_2::text,
     'verified_method', 'manual_admin',
     'verification_notes', 'MBRP certification verified by UW'
   ),
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'CERTIFICATION', 'VERIFIED',
   jsonb_build_object(
     'certification_title', 'Crisis Intervention Specialist',
     'certification_id', v_cert_id_3::text,
     'verified_method', 'manual_admin',
     'verification_notes', 'CPI certification verified'
   ),
   'Admin Manual Review', NOW(), NOW());

  RAISE NOTICE '✅ 8 verification stamps created';

  -- =====================================================
  -- FINAL SUMMARY
  -- =====================================================

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MICHAEL THOMPSON PROFILE CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE 'Slug: michael-thompson-addictions-recovery-tutor';
  RAISE NOTICE 'Template: passport (#0052FF)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 SUMMARY:';
  RAISE NOTICE '  - 4 Work experiences';
  RAISE NOTICE '  - 3 Academic degrees';
  RAISE NOTICE '  - 15 Skills';
  RAISE NOTICE '  - 2 Languages';
  RAISE NOTICE '  - 3 Certifications';
  RAISE NOTICE '  - 3 Featured projects';
  RAISE NOTICE '  - 3 Collaborations';
  RAISE NOTICE '  - 8 Verification stamps';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Profile URL:';
  RAISE NOTICE 'https://yourcvpassport.com/cv/michael-thompson-addictions-recovery-tutor';
  RAISE NOTICE '========================================';

END $$;

-- Final verification
SELECT
  'FINAL VERIFICATION' as section,
  p.full_name as name,
  p.headline as profession,
  (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiences,
  (SELECT COUNT(*) FROM education WHERE profile_id = p.id) as education,
  (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
  (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) as languages,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certifications,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'PROJECT') as projects,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'COLLABORATION') as collaborations,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') as verified_stamps
FROM profiles p
WHERE p.full_name = 'Michael Thompson';
