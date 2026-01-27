-- =====================================================
-- COMPLETE PROFILE CREATION: JENNIFER MARTINEZ
-- Group and Family Therapy Tutor - ISEIH
-- Email: jennifer.martinez@iseih.edu
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Find existing user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'jennifer.martinez@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found. Please create first in Supabase Auth.';
  END IF;

  RAISE NOTICE '👤 Creating complete profile for Jennifer Martinez...';
  RAISE NOTICE 'UUID: %', v_user_id;

  -- =====================================================
  -- 1. UPDATE MAIN PROFILE
  -- =====================================================

  UPDATE profiles SET
    full_name = 'Jennifer Martinez',
    headline = 'Group and Family Therapy Tutor',
    title = 'Systemic Family Therapy Specialist',
    summary = 'Clinical social worker with 10 years of experience specialized in family therapy and group dynamics. Expert in support systems for families affected by addictions, intergenerational trauma, and family recovery processes. As a tutor at ISEIH, trains professionals in systemic intervention methodologies and therapeutic group facilitation. Facilitates workshops on family communication and collaborates with community organizations in mental health programs.',
    location = 'Austin, TX',
    country_code = 'US',
    slug = 'jennifer-martinez-family-therapist',
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
  (v_user_id, 'ISEIH - Higher Institute of Innovative Holistic Studies', 'Group and Family Therapy Tutor', '2023-01-01', NULL, true, 'FULL_TIME',
  'Faculty in graduate programs in Systemic Family Therapy and Therapeutic Group Facilitation. Designs curricula integrating systems theory, family communication techniques, and group facilitation methodologies. Supervises clinical practice of students with families in crisis and coordinates collaborations with mental health institutions. Develops applied research on effectiveness of systemic interventions in multicultural contexts.',
  ARRAY[
    'Design of 8 specialized curricular modules on intergenerational trauma',
    'Clinical supervision of over 100 cases of families in recovery processes',
    'Implementation of experiential methodologies of role-playing and family sculpture',
    'Creation of educational resources on group dynamics adopted in 5 countries',
    '97% student satisfaction in course evaluations'
  ], 'Madrid, Spain', 1, true, NOW(), NULL),

  -- Experience 2: Texas Clinical Social Work Institute
  (v_user_id, 'Texas Clinical Social Work Institute', 'Senior Family Therapist', '2020-01-01', '2023-12-31', false, 'FULL_TIME',
  'Provided systemic family therapy to families affected by addictions, trauma, and relational conflicts. Specialized in structural and narrative models of family intervention. Coordination with multidisciplinary teams of mental health, addictions, and child protection. Facilitation of multifamily groups and supervision of junior therapists. Development of evidence-based evaluation and intervention protocols.',
  ARRAY[
    'Therapeutic care to over 85 families with 78% completion rate',
    'Development of family assessment protocols implemented institutionally',
    'Weekly facilitation of multifamily groups with average of 15 families',
    'Clinical supervision of 6 junior therapists in training',
    '65% reduction in reported family conflicts after intervention'
  ], 'Austin, TX, USA', 2, true, NOW(), NULL),

  -- Experience 3: Family Recovery Network (Current)
  (v_user_id, 'Family Recovery Network', 'Therapeutic Group Facilitator', '2016-01-01', NULL, true, 'PART_TIME',
  'Facilitates weekly groups for family members of people in addiction recovery. Provides education on codependency, healthy boundaries, and self-care in addiction contexts. Development of evidence-based educational curriculum on nonviolent communication and coping strategies. Coordination of support network among families for post-treatment continuity.',
  ARRAY[
    'Facilitation of over 300 group sessions with continuous participation of 20-25 families',
    'Development of 12-week educational curriculum on boundaries and self-care',
    'Organization of monthly workshops with average attendance of 35 participants',
    'Creation of mutual support network among 80+ families for follow-up',
    '94% participant satisfaction in impact evaluations'
  ], 'Austin, TX, USA', 3, true, NOW(), NULL),

  -- Experience 4: Austin Community Health Center
  (v_user_id, 'Austin Community Health Center', 'Clinical Social Worker', '2014-01-01', '2019-12-31', false, 'FULL_TIME',
  'Worked with vulnerable populations providing case management services, crisis intervention, and brief therapy. Specialization in bilingual Latino families with advanced cultural competence. Coordination with schools, child protection agencies, and community services. Provision of trauma-informed services in contexts of social vulnerability. Rights advocacy and connection with community resources.',
  ARRAY[
    'Management of 60+ complex cases with multiple risk factors',
    'Family crisis intervention with average response time of 24 hours',
    'Provision of bilingual English-Spanish services with 100% of Latino families',
    'Active collaboration with 15+ community and school agencies',
    'Successful connection of 85% of families with long-term services'
  ], 'Austin, TX, USA', 4, true, NOW(), NULL);

  RAISE NOTICE '✅ 4 professional experiences created';

  -- =====================================================
  -- 4. EDUCATION
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES

  -- Education 1: M.S.W. at UT Austin
  (v_user_id, 'University of Texas at Austin', 'Master of Social Work (M.S.W.)', 'Clinical Social Work', '2012-08-01', '2014-05-01', false, 'GPA 3.88/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),

  -- Education 2: B.A. at Texas State
  (v_user_id, 'Texas State University', 'Bachelor of Arts (B.A.)', 'Sociology', '2006-08-01', '2010-05-01', false, 'GPA 3.75/4.0 - Magna Cum Laude', 2, true, NOW(), NULL);

  RAISE NOTICE '✅ 2 educational degrees created';

  -- =====================================================
  -- 5. SKILLS
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
  (v_user_id, 'Systemic Family Therapy', 'EXPERT', 10, 'Family Therapy', 1),
  (v_user_id, 'Therapeutic Group Facilitation', 'EXPERT', 8, 'Facilitation', 2),
  (v_user_id, 'Clinical Social Work', 'EXPERT', 10, 'Social Work', 3),
  (v_user_id, 'Family Systemic Intervention', 'EXPERT', 9, 'Family Therapy', 4),
  (v_user_id, 'Narrative Therapy', 'ADVANCED', 7, 'Therapeutic Methodologies', 5),
  (v_user_id, 'Family Crisis Management', 'EXPERT', 10, 'Crisis Intervention', 6),
  (v_user_id, 'Nonviolent Communication', 'ADVANCED', 8, 'Communication', 7),
  (v_user_id, 'Family Systems Theory', 'EXPERT', 10, 'Theoretical Foundations', 8),
  (v_user_id, 'Intergenerational Trauma', 'ADVANCED', 6, 'Trauma and Recovery', 9),
  (v_user_id, 'Codependency and Boundaries', 'EXPERT', 8, 'Addictions and Family', 10),
  (v_user_id, 'Bilingual Clinical Practice', 'EXPERT', 10, 'Cultural Competence', 11),
  (v_user_id, 'Cultural Competence', 'EXPERT', 10, 'Diversity and Inclusion', 12),
  (v_user_id, 'Family Assessment', 'ADVANCED', 9, 'Assessment', 13),
  (v_user_id, 'Family Psychoeducation', 'EXPERT', 8, 'Therapeutic Education', 14),
  (v_user_id, 'Addiction Work', 'ADVANCED', 10, 'Addictions and Family', 15);

  RAISE NOTICE '✅ 15 skills created';

  -- =====================================================
  -- 6. LANGUAGES
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (v_user_id, 'English', 'Native', true, 1),
  (v_user_id, 'Spanish', 'C2', false, 2);

  RAISE NOTICE '✅ 2 languages added';

  -- =====================================================
  -- 7. CERTIFICATIONS (Portfolio Items)
  -- =====================================================
INSERT INTO portfolio_items (profile_id, type, title, description, issuer, issue_date, credential_id, credential_url, verified, sort_order)
VALUES
(
  v_user_id,
  'CERTIFICATION',
  'Licensed Master Social Worker (LMSW)',
  'Master Social Worker license issued by the State of Texas. Authorizes supervised clinical practice with individuals, families, and groups.',
  'Texas State Board of Social Worker Examiners',
  '2014-06-01',
  'LMSW-TX-98234',
  'https://www.bhec.texas.gov/verify-a-license/index.html',
  true,
  1
),
(
  v_user_id,
  'CERTIFICATION',
  'Therapeutic Group Facilitation Certification',
  'Advanced training in group facilitation techniques, group dynamics, conflict management, and therapeutic cohesion.',
  'American Group Psychotherapy Association (AGPA)',
  '2017-03-01',
  'AGPA-GTF-2017-456',
  'https://www.agpa.org/home/practice-resources/group-therapy-training',
  true,
  2
),
(
  v_user_id,
  'CERTIFICATION',
  'Family Systems Therapy Training',
  'Intensive 200-hour program in theory and practice of systemic family therapy, including structural, strategic, and narrative models.',
  'Bowen Center for the Study of the Family',
  '2016-09-01',
  'BCFS-FST-2016-189',
  'https://www.thebowencenter.org/training-programs',
  true,
  3
);

  RAISE NOTICE '✅ 3 certifications created';

  -- =====================================================
  -- 8. PROJECTS (Portfolio Items)
  -- =====================================================
INSERT INTO portfolio_items (profile_id, type, title, description, url, tags, featured, sort_order)
VALUES
(
  v_user_id,
  'PROJECT',
  'United Families Program',
  'Development and implementation of a 12-week family intervention program for families affected by addictions. Integrates multifamily therapy, psychoeducation, and communication skills development. Served 45 families with 82% retention rate and significant improvements in family cohesion and conflict reduction.',
  'https://familyrecoverynetwork.org/familias-unidas',
  ARRAY['Family Therapy', 'Addictions', 'Group Intervention', 'Psychoeducation'],
  true,
  1
),
(
  v_user_id,
  'PROJECT',
  'Group Facilitation Manual for Families',
  'Creation of a 150-page practical manual for family support group facilitators. Includes facilitation techniques, experiential activities, management of difficult dynamics, and psychoeducation resources. Used by 30+ facilitators in Texas.',
  NULL,
  ARRAY['Group Facilitation', 'Professional Education', 'Therapeutic Resources'],
  true,
  2
),
(
  v_user_id,
  'PROJECT',
  'Bilingual Community Mental Health Initiative',
  'Coordinated culturally adapted mental health services for Latino families in Austin. Developed bilingual educational materials, trained community workers, and facilitated workshops on mental health stigma, service access, and family care. Impacted over 200 families.',
  NULL,
  ARRAY['Community Mental Health', 'Cultural Competence', 'Bilingual Services'],
  false,
  3
);

  RAISE NOTICE '✅ 3 projects added';

  -- =====================================================
  -- 9. COLLABORATIONS (Portfolio Items)
  -- =====================================================
INSERT INTO portfolio_items (profile_id, type, title, description, tags, sort_order)
VALUES
(
  v_user_id,
  'COLLABORATION',
  'National Speaker at NASW',
  'Regularly presents at National Association of Social Workers conferences on topics of family therapy, work with Latino communities, and group facilitation. Has presented at 8 state and national conferences since 2016.',
  ARRAY['Conferences', 'Social Work', 'Professional Leadership']::text[],
  1
),
(
  v_user_id,
  'COLLABORATION',
  'Volunteer at Family Shelters',
  'Offers pro-bono brief family therapy services and family strengthening workshops at shelters for homeless individuals and domestic violence victims. Continuous monthly commitment since 2015.',
  ARRAY['Community Service', 'Vulnerable Populations', 'Pro-Bono Therapy']::text[],
  2
),
(
  v_user_id,
  'COLLABORATION',
  'Co-host of Families in Balance Podcast',
  'Co-hosts a bimonthly podcast on healthy family dynamics, effective communication, and conscious parenting. Over 50 episodes published with 5,000+ monthly listeners.',
  ARRAY['Outreach', 'Public Education', 'Digital Media']::text[],
  3
);

  RAISE NOTICE '✅ 3 collaborations added';

  -- =====================================================
  -- 10. VERIFICATION STAMPS
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Email verification
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "jennifer.martinez@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Identity verification
  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Passport", "document_number": "****4567", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Education verification
  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "M.S.W.", "institution": "University of Texas at Austin", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Employment verification
  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Group and Family Therapy Tutor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Language verification
  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)", "Spanish (C2)"], "verified_method": "manual_admin"}'::jsonb,
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
  RAISE NOTICE '✅ JENNIFER MARTINEZ PROFILE CREATED SUCCESSFULLY';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE 'Name: Jennifer Martinez';
  RAISE NOTICE 'Email: jennifer.martinez@iseih.edu';
  RAISE NOTICE 'Position: Group and Family Therapy Tutor';
  RAISE NOTICE 'Template: passport (#0052FF)';
  RAISE NOTICE '';
  RAISE NOTICE 'STATISTICS:';
  RAISE NOTICE '- Experiences: 4';
  RAISE NOTICE '- Education: 2 degrees';
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
  'JENNIFER MARTINEZ - COMPLETE VERIFICATION' as user,
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
WHERE p.email = 'jennifer.martinez@iseih.edu'
GROUP BY p.id, p.full_name, p.headline, p.template;
