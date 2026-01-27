-- =====================================================
-- COMPLETE CREATION SCRIPT: MARCUS WILLIAMS
-- Therapeutic Theater Tutor - ISEIH
-- =====================================================
-- This script creates the complete profile of Marcus Williams
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
  -- Change this email for the real user created in Auth
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'marcus.williams@iseih.edu'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email marcus.williams@iseih.edu not found. Create first in Auth.';
  END IF;

  RAISE NOTICE '🔍 User found: %', v_user_id;

  -- =====================================================
  -- 1. UPDATE MAIN PROFILE
  -- =====================================================

  UPDATE profiles SET
    full_name = 'Marcus Williams',
    headline = 'Therapeutic Theater Tutor',
    title = 'Psychodrama and Creative Therapies Specialist',
    summary = 'Expert in theatrical techniques and psychodrama with 10 years of experience creating safe spaces for personal exploration and change. Specialized in drama therapy, therapeutic role-playing, and Theatre of the Oppressed applied to clinical and community contexts. As a tutor at ISEIH, I train professionals in therapeutic action methods. I facilitate workshops for organizations in conflict resolution and team building. Consultant in arts programs in prisons and community centers.',
    location = 'Brooklyn, NY',
    country_code = 'US',
    slug = 'marcus-williams-therapeutic-theater',
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
  (v_user_id, 'ISEIH - Institute for Advanced Studies in Human Innovation', 'Therapeutic Theater Tutor', '2023-01-01', NULL, true, 'PART_TIME',
  'Direction of psychodrama laboratories. Teaching action and role-playing techniques applied to clinical and social contexts. Design of experiential experiences for development of therapeutic competencies in students.',
  ARRAY[
    'Direction of practical psychodrama laboratories',
    'Teaching clinical and social role-playing techniques',
    'Design of experiential experiences for students',
    'Development of didactic materials on drama therapy'
  ], 'Brooklyn, NY, USA', 1, true, NOW(), NULL),

  -- Experience 2: Instructor NY Drama Therapy Center
  (v_user_id, 'NY Drama Therapy Center', 'Psychodrama Instructor', '2021-01-01', '2023-12-31', false, 'FULL_TIME',
  'Teaching action methods for mental health professionals. Clinical supervision of practice groups. Development of training programs in psychodrama techniques applied to diverse therapeutic contexts.',
  ARRAY[
    'Training professionals in therapeutic action methods',
    'Clinical supervision of practice groups',
    'Development of psychodrama training programs',
    'Training of over 150 therapists in 2 years'
  ], 'New York, NY, USA', 2, true, NOW(), NULL),

  -- Experience 3: Independent Facilitator
  (v_user_id, 'ACT FOR CHANGE', 'Independent Facilitator', '2020-01-01', NULL, true, 'FREELANCE',
  'Delivery of therapeutic theater workshops for organizations, focusing on conflict resolution and team building. Design of theatrical interventions for organizational development and conflict transformation.',
  ARRAY[
    'Facilitation of organizational therapeutic theater workshops',
    'Design of interventions for conflict resolution',
    'Team building through role-playing techniques',
    'Work with over 30 organizations and 500+ participants'
  ], 'Brooklyn, NY, USA', 3, true, NOW(), NULL),

  -- Experience 4: Drama Therapist
  (v_user_id, 'Brooklyn Community Center', 'Drama Therapist', '2014-06-01', '2020-12-31', false, 'FULL_TIME',
  'Development of theater programs for diverse populations, fostering social connection and creative expression. Work with at-risk communities, trauma survivors, and marginalized groups using drama therapy techniques.',
  ARRAY[
    'Development of community theater programs',
    'Work with diverse and at-risk populations',
    'Facilitation of safe spaces for creative expression',
    'Care for over 800 participants in 6 years'
  ], 'Brooklyn, NY, USA', 4, true, NOW(), NULL);

  RAISE NOTICE '✅ 4 work experiences created';

  -- =====================================================
  -- 4. EDUCATION (3 degrees)
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES

  (v_user_id, 'New York University', 'M.A. in Drama Therapy', 'Drama Therapy', '2012-09-01', '2014-05-31', false, 'Cum Laude', 1, true, NOW(), NULL),
  (v_user_id, 'University of Southern California', 'B.A. in Theater', 'Theater and Performing Arts', '2006-09-01', '2010-05-31', false, 'Magna Cum Laude', 2, true, NOW(), NULL),
  (v_user_id, 'American Society of Group Psychotherapy', 'Psychodrama Certification', 'Psychodrama and Group Therapy', '2015-01-01', '2016-12-31', false, 'Certified', 3, true, NOW(), NULL);

  RAISE NOTICE '✅ 3 academic degrees added';

  -- =====================================================
  -- 5. SKILLS (15 skills)
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
  (v_user_id, 'Drama Therapy', 'EXPERT', 10, 'Creative Therapies', 1),
  (v_user_id, 'Psychodrama', 'EXPERT', 8, 'Therapeutic Techniques', 2),
  (v_user_id, 'Group Therapy', 'EXPERT', 10, 'Therapeutic Modalities', 3),
  (v_user_id, 'Body Expression', 'ADVANCED', 10, 'Action Techniques', 4),
  (v_user_id, 'Creative Facilitation', 'EXPERT', 9, 'Facilitation', 5),
  (v_user_id, 'Conflict Resolution', 'ADVANCED', 6, 'Mediation', 6),
  (v_user_id, 'Therapeutic Role-Playing', 'EXPERT', 10, 'Action Techniques', 7),
  (v_user_id, 'Theatre of the Oppressed', 'ADVANCED', 7, 'Social Theatre', 8),
  (v_user_id, 'Action Techniques', 'EXPERT', 10, 'Experiential Methods', 9),
  (v_user_id, 'Clinical Supervision', 'ADVANCED', 5, 'Professional Training', 10),
  (v_user_id, 'Trauma Work', 'ADVANCED', 8, 'Clinical Intervention', 11),
  (v_user_id, 'Therapeutic Improvisation', 'EXPERT', 10, 'Creative Techniques', 12),
  (v_user_id, 'Team Building', 'ADVANCED', 6, 'Organizational Development', 13),
  (v_user_id, 'Program Development', 'ADVANCED', 8, 'Intervention Design', 14),
  (v_user_id, 'Expressive Therapies', 'EXPERT', 10, 'Arts Therapy', 15);

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

  -- Certification 1: RDT
  (v_user_id, 'CERTIFICATION',
   'Registered Drama Therapist (RDT)',
   'North American Drama Therapy Association (NADTA)',
   '2014-06', NULL, 'RDT-2014-MW789',
   'https://www.nadta.org/credentials/verify/MW789',
   'Professional credential that certifies competence in drama therapy practice with clinical and community populations. Requires master''s degree in Drama Therapy, 1,500 hours of supervised clinical practice, and approval of national certification exam.',
   true, 1),

  -- Certification 2: Psychodrama
  (v_user_id, 'CERTIFICATION',
   'Certified Practitioner of Psychodrama',
   'American Society of Group Psychotherapy (ASGPP)',
   '2016-09', NULL, 'CP-ASGPP-2016-567',
   'https://www.asgpp.org/verify/CP-567',
   'Professional psychodrama certification that accredits competence in directing psychodrama, sociodrama, and action technique sessions for therapeutic and educational contexts. Requires 780 hours of theoretical-practical training and clinical supervision.',
   true, 2);

  RAISE NOTICE '✅ 2 certifications created';

  -- Capture certification IDs to create stamps
  SELECT id INTO v_cert_id_1 FROM portfolio_items WHERE profile_id = v_user_id AND type = 'CERTIFICATION' AND title LIKE '%Registered Drama%' LIMIT 1;
  SELECT id INTO v_cert_id_2 FROM portfolio_items WHERE profile_id = v_user_id AND type = 'CERTIFICATION' AND title LIKE '%Psychodrama%' LIMIT 1;

  -- =====================================================
  -- 8. PROJECTS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, featured, sort_order, created_at) VALUES

  -- Project 1: Theatre of Life
  (v_user_id,
   'Play Theatre of Life - Therapeutic Community Production',
   'Therapeutic theater production written and performed by community members about resilience stories. Six-month creation process with 25 participants of diverse ages and backgrounds. Performances held at 5 Brooklyn community centers with total audiences of over 800 people. The play addresses themes of immigration, identity, overcoming adversity, and community building. Methodology: Using Playback Theatre and Theatre of the Oppressed techniques, participants co-created scenes based on their real experiences. The process included weekly workshops on writing, improvisation, rehearsals, and group reflection on emerging themes.',
   'PROJECT',
   'https://brooklyncommunitycenter.org/teatro-de-la-vida',
   ARRAY['Community Theater', 'Playback Theatre', 'Theatre of the Oppressed', 'Resilience', 'Personal Narrative'],
   true, 3, '2023-03-01'),

  -- Project 2: Scenarios of Change Workshop
  (v_user_id,
   'Workshop Scenarios of Change - Theatre of the Oppressed for Activists',
   'Series of intensive workshops using Theatre of the Oppressed techniques for social activists working on racial justice, immigrant rights, and educational equity. Held over 8 weekends with 40 participants from 15 different social organizations. Workshops included Forum Theatre, Image Theatre, and Legislative Theatre techniques to address oppression situations and explore collective action strategies. Results: 12 public Forum Theatre presentations in schools and community centers, reaching over 600 spectator-participants. Creation of facilitation manual distributed to 25 organizations.',
   'PROJECT',
   'https://actforchange.org/escenarios-de-cambio',
   ARRAY['Theatre of the Oppressed', 'Social Activism', 'Social Justice', 'Forum Theatre', 'Popular Education'],
   true, 4, '2022-01-01'),

  -- Project 3: Acting Change Podcast
  (v_user_id,
   'Podcast Acting Change - Conversations on Creative Therapies',
   'Interview program with leaders in the field of creative therapies and psychodrama. Deep exploration of theories, techniques, and practical applications of drama therapy, art therapy, music therapy, and dance therapy. Twenty episodes published to date with international guests including Dr. Robert Landy (NYU), Dr. Renée Emunah (CIIS), and Theatre of the Oppressed pioneers. Over 15,000 cumulative downloads. Format: 45-60 minute interviews exploring each guest''s professional trajectory, their theoretical contributions, and practical technique demonstrations. Each episode includes downloadable resources for listeners.',
   'PROJECT',
   'https://actuandoelcambio.podcast.com',
   ARRAY['Podcast', 'Drama Therapy', 'Creative Therapies', 'Interviews', 'Professional Education'],
   true, 5, '2021-05-01');

  RAISE NOTICE '✅ 3 projects added';

  -- =====================================================
  -- 9. COLLABORATIONS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES

  -- Collaboration 1: NADTA Conference
  (v_user_id,
   'Presenter - Annual NADTA Conference',
   'Recurring presenter at the annual North American Drama Therapy Association conference. I have facilitated experiential workshops and presented research on psychodrama applications in community contexts. Topics presented: Psychodrama and Racial Trauma (2022), Theatre of the Oppressed in Community Centers (2020), Role-Playing for Empathy Development (2018). Active participation in panels on diversity, equity, and inclusion in the drama therapy field. Contribution to training of over 300 drama therapy professionals internationally.',
   'COLLABORATION',
   ARRAY['NADTA', 'Conferences', 'Professional Training', 'Drama Therapy', 'Research'],
   6),

  -- Collaboration 2: Prison Programs
  (v_user_id,
   'Consultant - Arts in Prison Programs',
   'Pro-bono consulting for organizations developing therapeutic arts programs in correctional facilities. Design of safety protocols, facilitator training, and curriculum development adapted to criminal justice contexts. Work with 3 organizations: Prison Arts Coalition, Arts for Justice, and Rehabilitation Through the Arts. Training of 20 facilitators and support in designing 5 new programs reaching over 200 incarcerated individuals. Focus on trauma-informed care techniques, trust building, and use of theater as rehabilitation and social reintegration tool.',
   'COLLABORATION',
   ARRAY['Pro-Bono', 'Criminal Justice', 'Arts in Prisons', 'Consulting', 'Trauma-Informed Care'],
   7),

  -- Collaboration 3: Theater Schools
  (v_user_id,
   'Collaborator - Social Inclusion Programs in Theater Schools',
   'Collaboration with theater schools and universities to develop social inclusion programs using applied theater methodologies. Workshop design for underrepresented populations and training of theater students in community facilitation techniques. Partner institutions: Juilliard Community Engagement, Brooklyn College Theatre Dept., and LaGuardia Performing Arts Center. Over 100 theater students trained in community facilitation. Programs developed include theater workshops for older adults, at-risk youth, people with disabilities, and immigrant communities. Focus on accessibility, equity, and social justice in performing arts.',
   'COLLABORATION',
   ARRAY['Applied Theater', 'Social Inclusion', 'University Training', 'Accessibility', 'Equity'],
   8);

  RAISE NOTICE '✅ 3 collaborations added';

  -- =====================================================
  -- 10. VERIFICATION STAMPS
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Basic stamps (5)
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "marcus.williams@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Passport", "document_number": "****5678MW", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "M.A. in Drama Therapy", "institution": "New York University", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Therapeutic Theater Tutor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)", "Spanish (B2)"], "verified_method": "manual_admin"}'::jsonb,
   'Admin Manual Review', NOW(), NOW()),

  -- Certification stamps (2)
  (v_user_id, 'CERTIFICATION', 'VERIFIED',
   jsonb_build_object(
     'certification_title', 'Registered Drama Therapist (RDT)',
     'certification_id', v_cert_id_1::text,
     'verified_method', 'manual_admin',
     'verification_notes', 'NADTA professional credential verified'
   ),
   'Admin Manual Review', NOW(), NOW()),

  (v_user_id, 'CERTIFICATION', 'VERIFIED',
   jsonb_build_object(
     'certification_title', 'Certified Practitioner of Psychodrama',
     'certification_id', v_cert_id_2::text,
     'verified_method', 'manual_admin',
     'verification_notes', 'ASGPP certification verified'
   ),
   'Admin Manual Review', NOW(), NOW());

  RAISE NOTICE '✅ 7 verification stamps created';

  -- =====================================================
  -- FINAL SUMMARY
  -- =====================================================

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ MARCUS WILLIAMS PROFILE CREATED';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UUID: %', v_user_id;
  RAISE NOTICE 'Slug: marcus-williams-therapeutic-theater';
  RAISE NOTICE 'Template: passport (#0052FF)';
  RAISE NOTICE '';
  RAISE NOTICE '📊 SUMMARY:';
  RAISE NOTICE '  - 4 Work experiences';
  RAISE NOTICE '  - 3 Academic degrees';
  RAISE NOTICE '  - 15 Skills';
  RAISE NOTICE '  - 2 Languages';
  RAISE NOTICE '  - 2 Certifications';
  RAISE NOTICE '  - 3 Featured projects';
  RAISE NOTICE '  - 3 Collaborations';
  RAISE NOTICE '  - 7 Verification stamps';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Profile URL:';
  RAISE NOTICE 'https://yourcvpassport.com/cv/marcus-williams-therapeutic-theater';
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
WHERE p.full_name = 'Marcus Williams';
