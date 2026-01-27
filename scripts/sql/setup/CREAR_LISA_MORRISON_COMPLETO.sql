-- =====================================================
-- COMPLETE CREATION SCRIPT: LISA MORRISON, ATR
-- Art Therapy Tutor - ISEIH
-- =====================================================
-- This script creates the complete profile for Lisa Morrison
-- including experiences, education, skills, languages,
-- certifications, projects, collaborations and stamps
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_cert_id_1 UUID;
  v_cert_id_2 UUID;
BEGIN

  -- =====================================================
  -- 0. GET USER UUID
  -- =====================================================
  -- Change this email to the actual user created in Auth
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'lisa.morrison@iseih.edu'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email lisa.morrison@iseih.edu not found. Create in Auth first.';
  END IF;

  RAISE NOTICE '🔍 User found: %', v_user_id;

  -- =====================================================
  -- 1. UPDATE MAIN PROFILE
  -- =====================================================

  UPDATE profiles SET
    full_name = 'Lisa Morrison',
    headline = 'Art Therapy Tutor',
    title = 'Registered Art Therapist (ATR) and Professional Counselor',
    summary = 'Art therapist with 11 years of clinical experience specialized in adolescents and young adults. Develops creative programs for the expression of complex emotions using visual arts, expressive therapy, and trauma-informed care techniques. As a tutor at ISEIH, trains professionals in accessible expressive methodologies that can be integrated into diverse therapeutic contexts. Clinical supervisor for graduate students and collaborator in community art programs and museums.',
    location = 'Washington, DC',
    country_code = 'US',
    slug = 'lisa-morrison-art-therapy-tutor',
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
  (v_user_id, 'ISEIH - Higher Institute of Innovative Holistic Studies', 'Art Therapy Tutor', '2023-01-01', NULL, true, 'PART_TIME',
  'Training in expressive methodologies and supervision of practical workshops. Coordination of the therapeutic creativity program and competency assessment. Design of experiential activities for the development of artistic facilitation skills in students.',
  ARRAY[
    'Training in art therapy and expressive therapy techniques',
    'Supervision of practical workshops with students',
    'Coordination of therapeutic creativity program',
    'Development of educational materials on art therapy'
  ], 'Washington, DC, USA', 1, true, NOW(), NULL),

  -- Experience 2: Art Therapy Institute Instructor
  (v_user_id, 'Art Therapy Institute', 'Training Instructor', '2020-01-01', '2023-12-31', false, 'FULL_TIME',
  'Training of art therapists in expressive techniques and supervision of clinical practices. Development and updating of academic curriculum. Training in therapeutic art assessment, intervention techniques, and professional ethics.',
  ARRAY[
    'Training of art therapists in expressive techniques',
    'Clinical supervision of professional practices',
    'Development and updating of academic curriculum',
    'Trained over 200 professionals in 3 years'
  ], 'Washington, DC, USA', 2, true, NOW(), NULL),

  -- Experience 3: Private Art Therapist (current)
  (v_user_id, 'Creative Healing Studio', 'Private Art Therapist', '2018-01-01', NULL, true, 'FREELANCE',
  'Individual therapy and group workshops using visual arts for trauma processing and anxiety management. Design of personalized interventions using painting, collage, sculpture, and mixed media adapted to each client''s needs.',
  ARRAY[
    'Individual therapy with adolescents and young adults',
    'Facilitation of group art therapy workshops',
    'Specialized interventions in trauma and anxiety',
    'Served over 150 individual clients'
  ], 'Washington, DC, USA', 3, true, NOW(), NULL),

  -- Experience 4: Youth Mental Health Center Art Therapist
  (v_user_id, 'Youth Mental Health Center', 'Art Therapist', '2013-06-01', '2018-12-31', false, 'FULL_TIME',
  'Clinical intervention with at-risk adolescents. Facilitation of artistic expression groups for self-esteem strengthening. Work with populations diagnosed with depression, anxiety, trauma, and eating disorders using art therapy techniques.',
  ARRAY[
    'Clinical intervention with at-risk adolescents',
    'Artistic expression groups for self-esteem',
    'Specialized work in trauma, anxiety, and depression',
    'Served over 300 adolescents in 5 years'
  ], 'Washington, DC, USA', 4, true, NOW(), NULL);

  RAISE NOTICE '✅ 4 work experiences created';

  -- =====================================================
  -- 4. EDUCATION (2 degrees)
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES

  (v_user_id, 'George Washington University', 'M.A. in Art Therapy', 'Art Therapy', '2011-09-01', '2013-05-31', false, 'Summa Cum Laude', 1, true, NOW(), NULL),
  (v_user_id, 'Rhode Island School of Design', 'B.F.A. in Fine Arts', 'Fine Arts', '2005-09-01', '2009-05-31', false, 'Cum Laude', 2, true, NOW(), NULL);

  RAISE NOTICE '✅ 2 academic degrees added';

  -- =====================================================
  -- 5. SKILLS (15 skills)
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
  (v_user_id, 'Art Therapy', 'EXPERT', 11, 'Creative Therapies', 1),
  (v_user_id, 'Expressive Therapy', 'EXPERT', 11, 'Therapeutic Modalities', 2),
  (v_user_id, 'Youth Mental Health', 'EXPERT', 11, 'Clinical Populations', 3),
  (v_user_id, 'Workshop Facilitation', 'EXPERT', 8, 'Facilitation', 4),
  (v_user_id, 'Therapeutic Creativity', 'EXPERT', 11, 'Creative Techniques', 5),
  (v_user_id, 'Trauma Therapy', 'ADVANCED', 9, 'Clinical Intervention', 6),
  (v_user_id, 'Therapeutic Painting Techniques', 'EXPERT', 11, 'Artistic Media', 7),
  (v_user_id, 'Therapeutic Collage', 'EXPERT', 11, 'Artistic Media', 8),
  (v_user_id, 'Sculpture and Modeling', 'ADVANCED', 10, 'Artistic Media', 9),
  (v_user_id, 'Clinical Supervision', 'ADVANCED', 5, 'Professional Training', 10),
  (v_user_id, 'Art Therapy Assessment', 'ADVANCED', 8, 'Clinical Assessment', 11),
  (v_user_id, 'Working with Adolescents', 'EXPERT', 11, 'Clinical Populations', 12),
  (v_user_id, 'Anxiety Management', 'ADVANCED', 10, 'Clinical Intervention', 13),
  (v_user_id, 'Program Development', 'ADVANCED', 7, 'Intervention Design', 14),
  (v_user_id, 'Group Therapy', 'EXPERT', 11, 'Therapeutic Modalities', 15);

  RAISE NOTICE '✅ 15 skills created';

  -- =====================================================
  -- 6. LANGUAGES
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (v_user_id, 'English', 'Native', true, 1),
  (v_user_id, 'French', 'A2', false, 2);

  RAISE NOTICE '✅ 2 languages added';

  -- =====================================================
  -- 7. CERTIFICATIONS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, expiry_date, credential_id, credential_url, description, verified, sort_order) VALUES

  -- Certification 1: ATR
  (v_user_id, 'CERTIFICATION',
   'Registered Art Therapist (ATR)',
   'Art Therapy Credentials Board (ATCB)',
   '2013-06', NULL, 'ATR-2013-LM456',
   'https://www.atcb.org/credentials/verify/LM456',
   'Professional credential certifying competence in the practice of art therapy with clinical populations. Requires master''s degree in Art Therapy, 1,000 hours of supervised direct client contact, and 100 hours of supervision by a registered art therapist.',
   true, 1),

  -- Certification 2: LPC
  (v_user_id, 'CERTIFICATION',
   'Licensed Professional Counselor (LPC)',
   'DC Board of Professional Counseling',
   '2015-03', '2027-03', 'LPC-DC-2015-789',
   'https://doh.dc.gov/node/155262',
   'Professional license for the practice of counseling in the District of Columbia. Accredits competence in assessment, diagnosis, and treatment of mental and emotional disorders. Requires master''s degree in counseling or related field, 3,000 hours of supervised experience, and national examination.',
   true, 2);

  RAISE NOTICE '✅ 2 certifications created';

  -- Capture certification IDs to create stamps
  SELECT id INTO v_cert_id_1 FROM portfolio_items WHERE profile_id = v_user_id AND type = 'CERTIFICATION' AND title LIKE '%Registered Art%' LIMIT 1;
  SELECT id INTO v_cert_id_2 FROM portfolio_items WHERE profile_id = v_user_id AND type = 'CERTIFICATION' AND title LIKE '%Professional Counselor%' LIMIT 1;

  -- =====================================================
  -- 8. PROJECTS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, featured, sort_order, created_at) VALUES

  -- Project 1: Murals of Hope
  (v_user_id,
   'Murals of Hope Project - Collaborative Public Art',
   'Collaborative public art initiative with youth in recovery from addiction and trauma. Project funded by the Washington DC city council to beautify community spaces while facilitating emotional healing. 25 youth ages 15-22 participated over 6 months. Created 3 large-format murals (20x10 meters each) in public schools and community centers. The process included weekly workshops on collaborative design, mural techniques, and reflection circles on identity and resilience. Impact: The murals remain as symbols of hope in the community. Participants reported 75% improvement in self-esteem and sense of community belonging. Media coverage in Washington Post and exhibition in community gallery.',
   'PROJECT',
   'https://dcartscouncil.org/murales-esperanza',
   ARRAY['Public Art', 'Community Art Therapy', 'At-Risk Youth', 'Murals', 'Collective Healing'],
   true, 3, '2022-03-01'),

  -- Project 2: Expressive Techniques Manual
  (v_user_id,
   'Expressive Techniques Manual for School Counselors',
   'Publication of a practical guide to art therapy exercises designed specifically for school counselors without formal training in art therapy. The manual includes 50 activities adaptable to different ages and school contexts. Content: Drawing techniques, collage, sculpture with accessible materials, therapeutic photography, and creative journaling. Each activity includes therapeutic objectives, necessary materials, step-by-step instructions, and emotional processing guides. Distribution: 5,000 copies distributed free to public schools in DC, Maryland, and Virginia. Translated into Spanish. Available in downloadable PDF format. Adopted by 150+ schools as a social-emotional support resource.',
   'PROJECT',
   'https://creativehealingstudio.org/manual-tecnicas',
   ARRAY['Art Therapy', 'Education', 'Pedagogical Resources', 'School Mental Health', 'Publication'],
   true, 4, '2020-08-01'),

  -- Project 3: Hidden Voices Exhibition
  (v_user_id,
   'Hidden Voices Exhibition - Art and Mental Health',
   'Organization and curation of an art exhibition created by mental health patients to raise awareness about mental illnesses and reduce stigma. The exhibition presented works by 30 artist-patients in diverse media: painting, sculpture, photography, and mixed media. Held at the DC Arts Center with over 2,000 visitors in 4 weeks. Each work included an artist''s statement about their creative process and relationship with their mental health experience. Discussion panel with mental health professionals, artists, and family members. Impact: Coverage in local media (Washington City Paper, WAMU). Sale of 15 works with funds donated to mental health organizations. Visitor testimonials reporting greater understanding and empathy toward people with mental illnesses.',
   'PROJECT',
   'https://dcartscenter.org/voces-ocultas-2019',
   ARRAY['Art Therapy', 'Art Exhibition', 'Mental Health', 'Awareness', 'Curation'],
   true, 5, '2019-05-01');

  RAISE NOTICE '✅ 3 projects added';

  -- =====================================================
  -- 9. COLLABORATIONS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES

  -- Collaboration 1: American Art Therapy Association
  (v_user_id,
   'Active Member - American Art Therapy Association (AATA)',
   'Active participation in the most important professional art therapy association in the United States. Regular attendance at annual conferences, contribution to working groups on professional ethics and practice standards. Presentation of workshops at national conferences: Art Therapy with Adolescents in Crisis (2021), Collage Techniques for Trauma Processing (2019), Clinical Supervision in Art Therapy (2022). Contribution to AATA publications: Article on trauma-informed care in art therapy published in Art Therapy Journal (2020). Reviewer of proposals for annual conferences. Mentor to art therapy students.',
   'COLLABORATION',
   ARRAY['AATA', 'Professional Association', 'Conferences', 'Publications', 'Mentorship'],
   6),

  -- Collaboration 2: Museum Workshops
  (v_user_id,
   'Collaborator - Art and Wellness Workshops in Local Museums',
   'Collaboration with Washington DC museums to develop art-based wellness programs for the general public. Design and facilitation of monthly workshops at National Gallery of Art, Hirshhorn Museum, and Smithsonian American Art Museum. Programs developed: Mindfulness through Art (contemplation of works + artistic creation), Art for Stress Reduction (therapeutic painting workshops), Creativity and Connection (intergenerational workshops). Participation: Over 1,000 participants in 3 years. Positive evaluations with 92% satisfaction. Coverage on museum blogs and social media. Recognition from museums for innovation in community programs.',
   'COLLABORATION',
   ARRAY['Museums', 'Art and Wellness', 'Public Workshops', 'Mindfulness', 'Community'],
   7),

  -- Collaboration 3: Clinical Supervision
  (v_user_id,
   'Clinical Supervisor - Graduate Students in Art Therapy',
   'Clinical supervision of master''s students in art therapy completing their required practice hours for professional certification. Work with students from George Washington University and Marywood University. Weekly individual and group supervision. Review of clinical cases, development of intervention skills, professional ethics, and therapist self-care. Assessment of clinical competencies and preparation for ATR certification exam. Has supervised 25 students since 2018. ATR exam pass rate: 100%. Students report high satisfaction with supervision and professional preparation. Recognition from universities for excellence in clinical supervision.',
   'COLLABORATION',
   ARRAY['Clinical Supervision', 'Professional Training', 'Graduate Education', 'Mentorship', 'Certification'],
   8);

  RAISE NOTICE '✅ 3 collaborations added';

  -- =====================================================
  -- 10. VERIFICATION STAMPS
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Basic stamps (5)
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "lisa.morrison@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Driver License", "document_number": "****4567LM", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "M.A. in Art Therapy", "institution": "George Washington University", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Art Therapy Tutor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)", "French (A2)"], "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  -- Certification stamps (2)
  (v_user_id, 'CERTIFICATION', 'VERIFIED',
   jsonb_build_object(
     'certification_title', 'Registered Art Therapist (ATR)',
     'certification_id', v_cert_id_1::text,
     'verified_method', 'manual_admin',
     'verification_notes', 'ATR credential verified by ATCB'
   ),
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'CERTIFICATION', 'VERIFIED',
   jsonb_build_object(
     'certification_title', 'Licensed Professional Counselor (LPC)',
     'certification_id', v_cert_id_2::text,
     'verified_method', 'manual_admin',
     'verification_notes', 'LPC license verified by DC Board'
   ),
   'Admin Manual Review', NOW(), NOW());

  RAISE NOTICE '✅ 7 verification stamps created';

  -- =====================================================
  -- FINAL SUMMARY
  -- =====================================================

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LISA MORRISON PROFILE CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE 'Slug: lisa-morrison-art-therapy-tutor';
  RAISE NOTICE 'Template: passport (#0052FF)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 SUMMARY:';
  RAISE NOTICE '  - 4 Work experiences';
  RAISE NOTICE '  - 2 Academic degrees';
  RAISE NOTICE '  - 15 Skills';
  RAISE NOTICE '  - 2 Languages';
  RAISE NOTICE '  - 2 Certifications';
  RAISE NOTICE '  - 3 Featured projects';
  RAISE NOTICE '  - 3 Collaborations';
  RAISE NOTICE '  - 7 Verification stamps';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Profile URL:';
  RAISE NOTICE 'https://yourcvpassport.com/cv/lisa-morrison-art-therapy-tutor';
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
WHERE p.full_name = 'Lisa Morrison';
