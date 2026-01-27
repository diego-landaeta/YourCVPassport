-- =====================================================
-- CREAR PERFIL COMPLETO DE JAMES WILSON
-- Tutor de Educación Emocional - ISEIH
-- Email: james.wilson@iseih.edu
-- =====================================================
-- Basado en estructura de Marta Ruiz Serrano
-- Información del CV proporcionado en PDF
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Buscar el usuario existente
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'james.wilson@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado. Por favor crear primero en Supabase Auth.';
  END IF;

  RAISE NOTICE '👤 Creando perfil completo para James Wilson...';
  RAISE NOTICE 'UUID: %', v_user_id;

  -- =====================================================
  -- 1. ACTUALIZAR PERFIL PRINCIPAL
  -- =====================================================

  UPDATE profiles SET
    full_name = 'James Wilson',
    headline = 'Emotional Education Tutor',
    title = 'Social-Emotional Learning Specialist',
    summary = 'Educator with 9 years of experience in social-emotional development, specialized in emotional intelligence, restorative practices, and SEL curriculum design. I have worked with 2,000+ students and trained 500+ teachers. As a tutor at ISEIH, I design programs on emotional regulation and teacher well-being. I also collaborate with NGOs and advise EdTech projects on mental health. My mission: to create empathetic educational communities where educators and students thrive.',
    location = 'Miami, FL',
    country_code = 'US',
    slug = 'james-wilson-emotional-education-tutor',
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
  -- 2. LIMPIAR DATOS EXISTENTES
  -- =====================================================

  DELETE FROM experiences WHERE profile_id = v_user_id;
  DELETE FROM education WHERE profile_id = v_user_id;
  DELETE FROM skills WHERE profile_id = v_user_id;
  DELETE FROM languages WHERE profile_id = v_user_id;
  DELETE FROM portfolio_items WHERE profile_id = v_user_id;
  DELETE FROM stamps WHERE profile_id = v_user_id;

  RAISE NOTICE '🧹 Datos anteriores eliminados';

  -- =====================================================
  -- 3. EXPERIENCIAS PROFESIONALES
  -- =====================================================

  INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, employment_type, description, achievements, location, sort_order, verified, verified_at, verified_by) VALUES

  -- Experience 1: ISEIH (Current)
  (v_user_id, 'ISEIH - Institute for Advanced Studies in Human Innovation', 'Emotional Education Tutor', '2023-01-01', NULL, true, 'FULL_TIME',
  'Design and delivery of emotional intelligence and social-emotional skills workshops for university students and professionals. Development of SEL curricular programs adapted to multicultural contexts. Individual and group counseling for emotional competency development. Facilitation of restorative dialogue spaces for conflict resolution. Coordination with teaching team to integrate SEL across all subjects. Continuous evaluation of emotional and academic impact of interventions.',
  ARRAY[
    'Design of 12 SEL curricular programs implemented in 6 countries',
    'Facilitation of over 150 workshops with 96% satisfaction rate',
    '40% reduction in student conflicts through restorative practices',
    'Personalized counseling to over 300 students',
    'Creation of Empathetic Classroom ISEIH model adopted institutionally'
  ], 'Miami, FL, USA', 1, true, NOW(), NULL),

  -- Experience 2: SEL Solutions (Current - Consulting)
  (v_user_id, 'SEL Solutions', 'Social-Emotional Learning Consultant', '2020-03-01', NULL, true, 'FREELANCE',
  'Specialized consulting for educational institutions in implementing evidence-based SEL programs. Assessment of emotional needs and design of intervention strategies. Training teaching teams in emotional teaching methodologies. Development of didactic materials and pedagogical resources for teaching social-emotional skills. Support in school cultural transformation processes toward more empathetic environments.',
  ARRAY[
    'Consulting at 18 educational institutions in the United States and Latin America',
    'Training of over 500 teachers in SEL methodologies',
    'Development of 25+ CASEL-certified didactic resources',
    'Average 35% increase in assessed emotional competencies',
    'Publication of 8 articles in specialized emotional education journals'
  ], 'Remote', 2, true, NOW(), NULL),

  -- Experience 3: EQ Training Institute
  (v_user_id, 'EQ Training Institute', 'Emotional Intelligence Training Facilitator', '2019-06-01', NULL, true, 'PART_TIME',
  'Facilitation of emotional intelligence workshops and seminars for companies, non-profit organizations, and schools. Design of customized training programs according to each organization''s needs. Individual and group coaching for emotional competency development in educational leaders. Emotional intelligence assessment using validated tools (EQ-i 2.0, MSCEIT). Applied research on the impact of EI on academic and work performance.',
  ARRAY[
    'Facilitation of over 200 EI workshops with 94% average satisfaction',
    'Certified coaching for 80+ educational leaders',
    'Development of EQ for Executives program implemented in 12 school districts',
    'Certification of 150+ professionals in applied Emotional Intelligence',
    'Collaboration on longitudinal research on EI and academic performance'
  ], 'Miami, FL, USA', 3, true, NOW(), NULL),

  -- Experience 4: Florida Public Schools
  (v_user_id, 'Miami-Dade County Public Schools', 'Social-Emotional Education Teacher', '2015-08-01', '2019-05-31', false, 'FULL_TIME',
  'Teaching social-emotional skills to high school students in multicultural and multilingual contexts. Implementation of CASEL framework for social-emotional learning in the classroom. Creation of safe spaces for dialogue, emotional expression, and peaceful conflict resolution. Coordination of peer mediation program and restorative circles. Collaboration with families to promote comprehensive emotional development of students. Design of behavior management strategies based on emotional understanding.',
  ARRAY[
    'Direct teaching to over 800 high school students for 4 years',
    'Successful implementation of CASEL framework in 6 different courses',
    '50% reduction in suspensions through restorative practices',
    'Creation of Peer Emotional Mediators program with 40 trained students',
    'Recognition as Innovative Teacher of the Year in 2018'
  ], 'Miami, FL, USA', 4, true, NOW(), NULL),

  -- Experience 5: Community Wellness Center
  (v_user_id, 'Community Wellness Center', 'Emotional Support Group Facilitator', '2016-01-01', '2019-12-31', false, 'PART_TIME',
  'Facilitation of emotional support groups for adolescents in vulnerable situations. Application of emotional intelligence and mindfulness techniques for managing anxiety, stress, and trauma. Coordination with psychologists and social workers for comprehensive care. Design of experiential activities and group dynamics for developing emotional regulation skills.',
  ARRAY[
    'Facilitation of 120+ group sessions with over 200 adolescents',
    '60% reduction in anxiety reports among regular participants',
    'Design of experiential activities manual used by other facilitators',
    'Interdisciplinary collaboration with 15 mental health professionals'
  ], 'Miami, FL, USA', 5, true, NOW(), NULL);

  RAISE NOTICE '✅ 5 experiencias profesionales creadas';

  -- =====================================================
  -- 4. EDUCACIÓN
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES

  -- Education 1: Masters at Lesley University
  (v_user_id, 'Lesley University', 'M.A. in Social-Emotional Education', 'Social-Emotional Education and Human Development', '2013-09-01', '2015-06-30', false, 'Summa Cum Laude (GPA 3.95/4.0)', 1, true, NOW(), NULL),

  -- Education 2: Bachelors at University of Florida
  (v_user_id, 'University of Florida', 'B.S. in Educational Psychology', 'Educational and Developmental Psychology', '2007-08-01', '2011-05-30', false, 'Magna Cum Laude (GPA 3.82/4.0)', 2, true, NOW(), NULL),

  -- Education 3: Additional Specialization
  (v_user_id, 'Yale Center for Emotional Intelligence', 'Advanced Certification in Emotional Intelligence', 'RULER Approach for Educators', '2017-06-01', '2017-08-31', false, 'Certification with Distinction', 3, true, NOW(), NULL);

  RAISE NOTICE '✅ 3 títulos educativos creados';

  -- =====================================================
  -- 5. HABILIDADES
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
  (v_user_id, 'Emotional Intelligence', 'EXPERT', 9, 'Social-Emotional Competencies', 1),
  (v_user_id, 'Social Emotional Learning (SEL)', 'EXPERT', 9, 'Educational Methodologies', 2),
  (v_user_id, 'Restorative Practices', 'EXPERT', 8, 'Conflict Resolution', 3),
  (v_user_id, 'Teacher Training', 'EXPERT', 7, 'Professional Development', 4),
  (v_user_id, 'SEL Curriculum Design', 'EXPERT', 7, 'Educational Design', 5),
  (v_user_id, 'Conflict Resolution', 'EXPERT', 9, 'Mediation', 6),
  (v_user_id, 'Emotional Coaching', 'ADVANCED', 5, 'Personal Development', 7),
  (v_user_id, 'Mindfulness for Educators', 'ADVANCED', 6, 'Teacher Well-being', 8),
  (v_user_id, 'Emotional Assessment (EQ-i 2.0)', 'ADVANCED', 5, 'Assessment', 9),
  (v_user_id, 'Group Facilitation', 'EXPERT', 9, 'Facilitation', 10),
  (v_user_id, 'Trauma-Informed Teaching', 'ADVANCED', 4, 'Pedagogy', 11),
  (v_user_id, 'Nonviolent Communication (NVC)', 'ADVANCED', 6, 'Communication', 12),
  (v_user_id, 'CASEL Framework', 'EXPERT', 8, 'Educational Frameworks', 13),
  (v_user_id, 'Didactic Resource Development', 'ADVANCED', 7, 'Materials Design', 14),
  (v_user_id, 'Empathetic Educational Leadership', 'ADVANCED', 5, 'Leadership', 15);

  RAISE NOTICE '✅ 15 habilidades creadas';

  -- =====================================================
  -- 6. IDIOMAS
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (v_user_id, 'English', 'Native', true, 1),
  (v_user_id, 'Spanish', 'C2', false, 2);

  RAISE NOTICE '✅ 2 idiomas agregados';

  -- =====================================================
  -- 7. CERTIFICACIONES (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, expiry_date, credential_id, credential_url, description, verified, sort_order) VALUES

  -- Certification 1: SEL Specialist
  (v_user_id, 'CERTIFICATION',
   'SEL Specialist - International Certification',
   'CASEL - Collaborative for Academic, Social, and Emotional Learning',
   '2022-09', '2027-09', 'CASEL-SEL-2022-7845',
   'https://casel.org/verify/7845',
   'International Social-Emotional Learning specialist certification awarded by CASEL, the world-leading organization in SEL. Accredits advanced competence in designing, implementing, and evaluating evidence-based SEL programs in diverse educational contexts. Includes mastery of the CASEL 5 competencies framework and curricular integration strategies.',
   true, 1),

  -- Certification 2: EQ Coach
  (v_user_id, 'CERTIFICATION',
   'Certified Emotional Intelligence Coach',
   'Six Seconds - The Emotional Intelligence Network',
   '2021-03', '2026-03', 'SS-EQC-2021-3421',
   'https://www.6seconds.org/verify/3421',
   'Professional Emotional Intelligence Coaching certification that accredits the ability to facilitate emotional competency development through individual and group coaching processes. Includes use of scientifically validated EQ assessments and design of personalized emotional development plans.',
   true, 2),

  -- Certification 3: Restorative Practices
  (v_user_id, 'CERTIFICATION',
   'Restorative Practices Facilitator Certificate',
   'International Institute for Restorative Practices (IIRP)',
   '2020-11', NULL, 'IIRP-RPF-2020-8934',
   'https://www.iirp.edu/verify/8934',
   'International certification that accredits competencies in facilitating restorative practices for building educational communities, conflict resolution, and relational harm repair. Includes restorative circles, mediation, and formal conferences following IIRP international standards.',
   true, 3);

  RAISE NOTICE '✅ 3 certificaciones creadas';

  -- =====================================================
  -- 8. PROYECTOS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, featured, sort_order, created_at) VALUES

  -- Project 1: Empathetic Classrooms Program
  (v_user_id,
   'Empathetic Classrooms Program - Educational Transformation',
   'Comprehensive program for transforming traditional classrooms into empathetic and emotionally safe spaces. Implemented in 15 Miami-Dade schools with over 3,000 benefited students. Includes teacher training, physical environment design, daily emotional routines, and emotional climate assessment. Results: 45% improvement in school climate, 60% reduction in bullying, 35% increase in academic performance. Recognized by the district as Innovative Program of the Year 2023. Key components: Teacher training (30 hrs), weekly restorative circles, peer mediation, quarterly emotional impact assessment.',
   'PROJECT',
   'https://iseih.edu/aulas-empaticas',
   ARRAY['SEL', 'Curriculum Design', 'Teacher Training', 'Impact Evaluation', 'Restorative Practices'],
   true, 4, '2022-01-01'),

  -- Project 2: Emotion Check-in App
  (v_user_id,
   'Emotion Check-in App - EdTech Pedagogical Consulting',
   'Comprehensive pedagogical consulting for EdTech startup developing emotional check-in mobile application for high school students (12-18 years). SEL competency framework design, educational content validation, and educator guide development. The app reached over 5,000 active users in 40 schools during the first year. Average rating: 4.7/5 on App Store. Awarded at EdTech Innovation Challenge 2021. My role: Lead SEL Content Advisor (10-month contract). Includes daily emotional check-ins, pattern identification, early alerts, and self-regulation resources.',
   'PROJECT',
   'https://emotioncheck-in.app',
   ARRAY['EdTech', 'SEL', 'Mobile App', 'Mental Health', 'Data Analytics'],
   true, 5, '2020-06-01'),

  -- Project 3: Teacher Well-being Symposium
  (v_user_id,
   'International Symposium: Teacher Well-being in Times of Crisis',
   'Co-organizer and lead facilitator of international virtual symposium with over 500 educators from 12 countries during COVID-19 pandemic. 3-day event with 20 workshops on self-care, stress management, resilience, and burnout prevention. Guest speakers: Dr. Marc Brackett (Yale Center for Emotional Intelligence), Dr. Tina Payne Bryson, and CASEL leaders. Results: 96% of participants reported greater clarity on self-care strategies. Publication of proceedings with 35 presentations. Creation of International Network of Educators for Emotional Well-being with 800+ active members.',
   'PROJECT',
   'https://teacherwellnesssummit2020.org',
   ARRAY['Teacher Wellness', 'Mental Health', 'COVID-19', 'Virtual Event', 'International'],
   true, 6, '2020-11-01');

  RAISE NOTICE '✅ 3 proyectos agregados';

  -- =====================================================
  -- 9. COLABORACIONES (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES

  -- Collaboration 1: SEL Educational Blog
  (v_user_id,
   'Contributing Author - Emotional Education in Action Blog',
   'Monthly contributing author on specialized emotional education blog with over 50,000 monthly readers since 2018. Publication of articles on practical SEL strategies, success stories, recent research, and downloadable resources for educators. Over 60 published articles. Articles shared by international organizations such as CASEL, ASCD, and Edutopia. The 5 most-read articles exceed 100,000 views each. Topics: restorative practices, classroom mindfulness, bullying prevention, teacher well-being, and emotional competency development.',
   'COLLABORATION',
   ARRAY['Blog', 'SEL', 'Content Creation', 'Educational Writing'],
   7),

  -- Collaboration 2: NGO Consulting
  (v_user_id,
   'Pro-Bono Consultant - Children with Voice NGO',
   'Pro-bono consulting for NGO dedicated to protecting vulnerable children''s rights. Design and implementation of emotional education programs for children and adolescents in social risk situations. Training of social educator teams in trauma-informed care strategies, restorative practices, and emotional first aid. Direct support in 8 reception centers with over 300 benefited children. Development of emotional activities manual adapted to social vulnerability contexts. Monthly supervision of complex cases.',
   'COLLABORATION',
   ARRAY['Pro-Bono', 'NGO', 'Vulnerable Children', 'Trauma-Informed Care', 'Social Work'],
   8),

  -- Collaboration 3: TEDx Speaker
  (v_user_id,
   'TEDx Speaker - Why Empathy is the 21st Century Skill',
   'TEDx talk about the critical importance of cultivating empathy in the modern educational system as a response to social polarization, bullying, and the youth mental health crisis. Presentation of scientific evidence on the impact of SEL on academic performance, mental health, and comprehensive student development. Over 250,000 YouTube views. Translated into 8 languages by international volunteers. Used as an educational resource in over 50 universities and teacher training programs. Invited to replicate the talk at 12 additional international educational events.',
   'COLLABORATION',
   ARRAY['TEDx', 'Public Speaking', 'Empathy', 'Keynote', 'Viral Content'],
   9);

  RAISE NOTICE '✅ 3 colaboraciones agregadas';

  -- =====================================================
  -- 10. STAMPS DE VERIFICACIÓN
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Email verification
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "james.wilson@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Identity verification
  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Passport", "document_number": "****2106", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Education verification
  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "M.A. in Social-Emotional Education", "institution": "Lesley University", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Employment verification
  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Emotional Education Tutor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Language verification
  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)", "Spanish (C2)"], "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW());

  RAISE NOTICE '✅ 5 stamps básicos creados';

  -- Stamps de certificaciones (uno por cada certificación)
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

  -- =====================================================
  -- RESUMEN FINAL
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ JAMES WILSON PROFILE SUCCESSFULLY CREATED';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE 'Name: James Wilson';
  RAISE NOTICE 'Email: james.wilson@iseih.edu';
  RAISE NOTICE 'Position: Emotional Education Tutor';
  RAISE NOTICE 'Template: passport (#0052FF)';
  RAISE NOTICE '';
  RAISE NOTICE 'STATISTICS:';
  RAISE NOTICE '- Experiences: 5';
  RAISE NOTICE '- Education: 3 titles';
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
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT
  'JAMES WILSON - COMPLETE VERIFICATION' as usuario,
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
WHERE p.email = 'james.wilson@iseih.edu'
GROUP BY p.id, p.full_name, p.headline, p.template;
