-- =====================================================
-- CREAR PERFIL COMPLETO DE SARAH BENNETT
-- Alternative Pedagogies Tutor - ISEIH
-- Email: sarah.bennett@iseih.edu
-- =====================================================
-- Based on provided CV
-- Second ISEIH professional
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Buscar el usuario existente
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'sarah.bennett@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado. Por favor crear primero en Supabase Auth.';
  END IF;

  RAISE NOTICE '👤 Creando perfil completo para Sarah Bennett...';
  RAISE NOTICE 'UUID: %', v_user_id;

  -- =====================================================
  -- 1. ACTUALIZAR PERFIL PRINCIPAL
  -- =====================================================

  UPDATE profiles SET
    full_name = 'Sarah Bennett',
    headline = 'Alternative Pedagogies and Child Development Tutor',
    title = 'Montessori and Waldorf Methodologies Specialist',
    summary = 'Educator specialized in alternative pedagogies with 13 years of experience working with children ages 0-12 and training educators in Montessori and Waldorf methodologies. I have designed educational environments for 20+ schools and trained 400+ educators. As a tutor at ISEIH, I teach practical principles applicable in public schools, private schools, homeschooling, and community spaces. My mission: to empower educators and families with tools to create respectful environments.',
    location = 'Madison, WI',
    country_code = 'US',
    slug = 'sarah-bennett-alternative-pedagogies',
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
  (v_user_id, 'ISEIH - Institute for Advanced Studies in Human Innovation', 'Alternative Pedagogy Tutor', '2023-01-01', NULL, true, 'FULL_TIME',
  'Design and delivery of teacher training programs in Montessori and Waldorf philosophies and methodologies for pedagogy students and practicing educators. Supervision of innovative educational practices in partner schools. Advising educators on implementing alternative pedagogy principles adapted to different cultural and educational contexts. Development of didactic materials and practical guides for applying both methodologies. Facilitation of experiential workshops on child observation, prepared environment setup, and educational materials development.',
  ARRAY[
    'Design of 8 training programs in Montessori and Waldorf pedagogies implemented in 6 countries',
    'Training of over 200 educators with average 98% satisfaction',
    'Supervision of educational practices in 15 partner alternative schools',
    'Creation of Transformative Environments program adopted by ISEIH',
    'Development of 30+ downloadable didactic resources for educators'
  ], 'Madison, WI, USA', 1, true, NOW(), NULL),

  -- Experience 2: Holistic Education Network (Current)
  (v_user_id, 'Holistic Education Network', 'Educator Trainer', '2021-01-01', NULL, true, 'FREELANCE',
  'Intensive training for teachers transitioning to active and respectful methodologies based on Montessori and Waldorf principles. Design of practical workshops on environment preparation, didactic materials, child observation, and classroom management without rewards or punishments. Accompaniment of teaching teams in pedagogical transformation processes. Individual mentoring for teachers implementing alternative pedagogies for the first time. Development of certified online courses on alternative education fundamentals.',
  ARRAY[
    'Training of over 400 educators in 8 Spanish-speaking and English-speaking countries',
    'Development of 5 certified online courses with over 1,500 enrolled students',
    'Accompaniment of 12 teaching teams in complete pedagogical transformation processes',
    'Average 85% increase in teacher confidence to implement alternative pedagogies',
    'Creation of Montessori-Waldorf Educators Network with 600+ active members'
  ], 'Remote', 2, true, NOW(), NULL),

  -- Experience 3: Alternative Schools Alliance
  (v_user_id, 'Alternative Schools Alliance', 'Educational Consultant', '2016-06-01', '2021-12-31', false, 'FREELANCE',
  'Specialized consulting in curriculum design and educational environment preparation for new alternative schools in opening process. Evaluation of existing educational programs and recommendations for integrating Montessori and Waldorf principles. Training of founding teams in educational philosophy, classroom management, and creation of respectful school communities. Design of prepared environments following AMI Montessori standards adapted to local context. Consulting in certification and accreditation processes for alternative schools.',
  ARRAY[
    'Comprehensive consulting for 18 alternative schools in opening or transformation phase',
    'Design of complete educational environments for 25+ Montessori and Waldorf classrooms',
    'Support in successful accreditation processes of 10 schools before international organizations',
    'Average 40% reduction in implementation time for alternative programs',
    'Publication of Practical Guide to Founding Alternative Schools downloaded 8,000+ times'
  ], 'Remote', 3, true, NOW(), NULL),

  -- Experience 4: Madison Private School
  (v_user_id, 'Madison Private School', 'Montessori Teacher - Primary Level', '2011-08-01', '2016-05-31', false, 'FULL_TIME',
  'Montessori classroom guide for children ages 6 to 9 (Lower Elementary), implementing complete AMI Montessori curriculum. Preparation and maintenance of prepared environment with all materials from Practical Life, Sensorial, Language, Mathematics, Geography, Biology, and History areas. Individualized scientific observation of each child to offer personalized presentations according to their developmental moment. Constant communication with families about progress and comprehensive development of their children. Mentoring of classroom assistants and teachers in training. Organization of educational trips and self-directed research projects by children.',
  ARRAY[
    'Lead Montessori classroom guide with 22-25 children for 5 consecutive academic years',
    'Successful implementation of complete AMI curriculum with exceptional evaluation results',
    '95% of families reported significant increase in autonomy, concentration, and love of learning',
    'Mentoring of 8 teachers in training who completed their Montessori practices',
    'Recognition as Exemplary Montessori Teacher by the school in 2014 and 2015'
  ], 'Madison, WI, USA', 4, true, NOW(), NULL),

  -- Experience 5: University of Wisconsin Child Development Center
  (v_user_id, 'University of Wisconsin Child Development Center', 'Montessori Classroom Assistant', '2009-09-01', '2011-07-31', false, 'PART_TIME',
  'Support to lead guide in Montessori classroom for children ages 3 to 6 (Children''s House) while completing AMI Montessori training. Preparation of educational materials and environment maintenance. Observation of child development and recording of individual progress. Supervision of independent work periods and practical life activities. Assistance in communication with families and participation in pedagogical team meetings.',
  ARRAY[
    'Assistance in Montessori classroom with 24 children for 2 years while studying AMI certification',
    'Creation of 40+ handcrafted Montessori materials to complement the environment',
    'Support in successful transition of 60+ children to Elementary level',
    'Collaboration in research on autonomy development in Montessori education'
  ], 'Madison, WI, USA', 5, true, NOW(), NULL);

  RAISE NOTICE '✅ 5 experiencias profesionales creadas';

  -- =====================================================
  -- 4. EDUCACIÓN
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES

  -- Education 1: Masters at Bank Street College
  (v_user_id, 'Bank Street College of Education', 'M.Ed. in Alternative Education', 'Progressive Pedagogies and Child Development', '2011-09-01', '2013-05-30', false, 'GPA 3.91/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),

  -- Education 2: Bachelors at University of Wisconsin
  (v_user_id, 'University of Wisconsin-Madison', 'B.A. in Child Development', 'Child Development and Family Studies', '2005-09-01', '2009-05-30', false, 'GPA 3.78/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),

  -- Education 3: Montessori AMI Certification
  (v_user_id, 'Montessori Institute', 'Montessori Certification (AMI) - Primary Level', 'Montessori Guide Training 6-12 years', '2010-01-01', '2011-06-30', false, 'Complete AMI Certification', 3, true, NOW(), NULL);

  RAISE NOTICE '✅ 3 títulos educativos creados';

  -- =====================================================
  -- 5. HABILIDADES
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
  (v_user_id, 'Montessori Pedagogy', 'EXPERT', 13, 'Educational Methodologies', 1),
  (v_user_id, 'Waldorf Pedagogy', 'EXPERT', 10, 'Educational Methodologies', 2),
  (v_user_id, 'Educational Environment Design', 'EXPERT', 13, 'Pedagogical Design', 3),
  (v_user_id, 'Child Development (0-12 years)', 'EXPERT', 15, 'Human Development', 4),
  (v_user_id, 'Teacher Training', 'EXPERT', 8, 'Professional Development', 5),
  (v_user_id, 'Conscious Discipline', 'EXPERT', 10, 'Classroom Management', 6),
  (v_user_id, 'Scientific Child Observation', 'EXPERT', 13, 'Montessori Methodology', 7),
  (v_user_id, 'Montessori Didactic Materials', 'EXPERT', 13, 'Educational Resources', 8),
  (v_user_id, 'Waldorf Arts and Crafts', 'ADVANCED', 10, 'Artistic Expression', 9),
  (v_user_id, 'Nature-Based Education', 'ADVANCED', 8, 'Waldorf Pedagogy', 10),
  (v_user_id, 'Family Communication', 'EXPERT', 13, 'Educational Relationships', 11),
  (v_user_id, 'Integrated Curriculum', 'ADVANCED', 10, 'Curriculum Design', 12),
  (v_user_id, 'Respectful Education', 'EXPERT', 13, 'Educational Philosophy', 13),
  (v_user_id, 'Educator Mentoring', 'ADVANCED', 8, 'Professional Development', 14),
  (v_user_id, 'Active Learning Spaces', 'EXPERT', 12, 'Educational Architecture', 15);

  RAISE NOTICE '✅ 15 habilidades creadas';

  -- =====================================================
  -- 6. IDIOMAS
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (v_user_id, 'English', 'Native', true, 1),
  (v_user_id, 'German', 'A2', false, 2);

  RAISE NOTICE '✅ 2 idiomas agregados';

  -- =====================================================
  -- 7. CERTIFICACIONES (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, expiry_date, credential_id, credential_url, description, verified, sort_order) VALUES

  -- Certification 1: AMI Montessori
  (v_user_id, 'CERTIFICATION',
   'AMI Montessori Teacher Certification - Primary Level',
   'Association Montessori Internationale (AMI)',
   '2011-06', NULL, 'AMI-PRIMARY-2011-SB456',
   'https://ami-global.org/verify/SB456',
   'International Montessori guide certification for Children''s House level (3-6 years) granted by AMI, the organization founded by Maria Montessori. Includes intensive 9-month theoretical training (900+ hours) in Montessori philosophy, child development, and supervised practice with presentation of all Montessori materials from Practical Life, Sensorial, Language, Mathematics, and Culture areas.',
   true, 1),

  -- Certification 2: Waldorf Early Childhood
  (v_user_id, 'CERTIFICATION',
   'Waldorf Early Childhood Educator Certificate',
   'Waldorf Early Childhood Association of North America (WECAN)',
   '2014-08', '2029-08', 'WECAN-ECE-2014-789',
   'https://waldorfearlychildhood.org/verify/789',
   'Professional certification in Waldorf pedagogy for early childhood education (0-7 years) that accredits competencies in creating warm and artistic environments, rhythmic daily development, therapeutic use of stories and songs, free play, and understanding sensory development in early childhood according to Rudolf Steiner''s anthroposophy.',
   true, 2),

  -- Certification 3: Conscious Discipline
  (v_user_id, 'CERTIFICATION',
   'Conscious Discipline Instructor Certification',
   'Conscious Discipline - Loving Guidance, Inc.',
   '2017-04', '2027-04', 'CD-INST-2017-321',
   'https://consciousdiscipline.com/verify/321',
   'Advanced certification as Conscious Discipline instructor that allows training other educators in this classroom management approach based on developmental neuroscience. Includes strategies to transform conflicts into learning opportunities, School Family construction, emotional regulation, and assertive communication with children.',
   true, 3);

  RAISE NOTICE '✅ 3 certificaciones creadas';

  -- =====================================================
  -- 8. PROYECTOS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, featured, sort_order, created_at) VALUES

  -- Project 1: Environments That Educate
  (v_user_id,
   'Environments That Educate Project - Public Schools Redesign',
   'Comprehensive consulting project to redesign 5 traditional public school classrooms incorporating Montessori principles of prepared environments, interest-based learning areas, and child accessibility. Implemented in collaboration with Madison school district. The project included spatial analysis, minor architectural redesign, selection of child-height adapted furniture, creation of individual and group work zones, and teacher training in environment maintenance. Results measured during one academic year: 65% increase in sustained concentration, 78% reduction in classroom disruptions, 55% increase in self-directed work. The 5 classrooms became models replicated by 12 additional district schools. Recognized by the School District as Innovative Project of the Year 2022.',
   'PROJECT',
   'https://iseih.edu/ambientes-que-educan',
   ARRAY['Montessori', 'Environment Design', 'Public Schools', 'Educational Innovation', 'Pedagogical Architecture'],
   true, 4, '2022-01-01'),

  -- Project 2: Montessori at Home Course
  (v_user_id,
   'Montessori at Home Online Course for Families',
   'Eight-week online educational program designed for parents who want to adapt their home following Montessori principles to foster child autonomy. Includes video tutorials, downloadable guides, and live Q&A sessions. The course covers: Montessori bedroom, bathroom, and kitchen preparation, practical life activities by age, DIY home materials, routines that foster independence, and respectful limits. Over 2,000 families have completed the course since its 2020 launch. Results reported by families: 82% saw significant improvements in child autonomy, 90% reduced daily conflicts related to routines, 75% reported greater confidence in their educational role. The course is available in English and Spanish, with adapted versions for babies (0-18 months), toddlers (18 months-3 years), and preschoolers (3-6 years).',
   'PROJECT',
   'https://montessoriencasa.com',
   ARRAY['Montessori', 'Parental Education', 'Online Course', 'Child Autonomy', 'Respectful Parenting'],
   true, 5, '2020-06-01'),

  -- Project 3: Living Education Congress
  (v_user_id,
   'Presentation: Art and Nature in Waldorf Curriculum',
   'Keynote presentation at the 2019 International Living Education Congress on the integration of art, music, movement, and nature connection in Waldorf curriculum as fundamental tools for comprehensive child development. The presentation included anthroposophical foundations of sensory development, practical examples of artistic activities by age (wet-on-wet watercolor, beeswax modeling, eurythmy), and the importance of daily and seasonal rhythm. Over 400 educators attended in person and 2,000+ watched the online broadcast. Results: The presentation inspired the creation of 8 Waldorf art workshops in conventional schools and was cited in 15 academic articles on artistic pedagogy. The video reached 85,000 views on YouTube. Includes experiential demonstration of Waldorf artistic techniques that attendees could directly experience.',
   'PROJECT',
   'https://educacionviva.org/ponencias/sarah-bennett-2019',
   ARRAY['Waldorf', 'Art in Education', 'Nature', 'International Congress', 'Artistic Pedagogy'],
   true, 6, '2019-11-01');

  RAISE NOTICE '✅ 3 proyectos agregados';

  -- =====================================================
  -- 9. COLABORACIONES (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES

  -- Collaboration 1: American Montessori Society
  (v_user_id,
   'Active Member - American Montessori Society',
   'Active AMS (American Montessori Society) membership since 2011, participating in annual conferences, regional study groups, and curriculum development committees. Regular contribution to AMS publications with articles on practical Montessori implementation in diverse contexts. Featured role as co-organizer of Wisconsin-Illinois Regional Chapter (2015-2018), coordinating 6 annual meetings of Montessori educators with practical workshops, materials exchange, and peer mentoring sessions. Participation in AMS Diversity and Inclusion Committee (2019-2021), working on adapting Montessori principles for public schools in low-income communities. Membership keeps me updated with recent research, connected with the international Montessori community, and in continuous learning.',
   'COLLABORATION',
   ARRAY['AMS', 'Montessori', 'Professional Community', 'Continuous Development'],
   7),

  -- Collaboration 2: Teacher Mentoring
  (v_user_id,
   'Mentor for Teachers in Montessori and Waldorf Training',
   'Volunteer mentoring program for new teachers completing their training in alternative pedagogies. Since 2016, I have accompanied 28 teachers in their first years of teaching practice, offering classroom observation, constructive feedback, and emotional support in implementation challenges. The program includes: initial observation of environment and teaching practice, monthly 1:1 mentoring meetings, access to resource and materials library, and accompaniment in challenging situations with families or school administration. Results: 95% of mentored teachers remain in the profession after 3 years (vs. 60% national average). 100% report that mentoring was essential for their professional development and confidence. Several of my mentees have founded their own alternative schools or become trainers of other educators.',
   'COLLABORATION',
   ARRAY['Mentoring', 'Teacher Training', 'Professional Support', 'Teacher Retention'],
   8),

  -- Collaboration 3: Respectful Parenting Podcast
  (v_user_id,
   'Frequent Contributor - Respectful and Conscious Parenting Podcast',
   'Recurring guest on Respectful and Conscious Parenting podcast (50,000+ monthly listeners) as expert in alternative pedagogies and child development. I have participated in 18 episodes since 2018 on topics such as respectful limits, child autonomy, prepared environments at home, and myths about Montessori. Most popular episodes include: Montessori is not letting the child do whatever they want (120,000 downloads), How to prepare your home according to Montessori on a budget (95,000 downloads), and Waldorf and Montessori: differences and similarities (88,000 downloads). Each episode includes audience questions answered live, practical resource recommendations, and concrete activities that families can implement immediately. The podcast has created an active community of 12,000+ families practicing conscious parenting in Spanish.',
   'COLLABORATION',
   ARRAY['Podcast', 'Respectful Parenting', 'Outreach', 'Montessori for Families'],
   9);

  RAISE NOTICE '✅ 3 colaboraciones agregadas';

  -- =====================================================
  -- 10. STAMPS DE VERIFICACIÓN
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Email verification
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "sarah.bennett@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Identity verification
  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Passport", "document_number": "****0105", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Education verification
  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "M.Ed. in Alternative Education", "institution": "Bank Street College of Education", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Employment verification
  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Alternative Pedagogy Tutor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Language verification
  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)", "German (A2)"], "verified_method": "manual_admin"}'::jsonb,
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
  RAISE NOTICE '✅ SARAH BENNETT PROFILE SUCCESSFULLY CREATED';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE 'Name: Sarah Bennett';
  RAISE NOTICE 'Email: sarah.bennett@iseih.edu';
  RAISE NOTICE 'Position: Alternative Pedagogies Tutor';
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
  'SARAH BENNETT - COMPLETE VERIFICATION' as usuario,
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
WHERE p.email = 'sarah.bennett@iseih.edu'
GROUP BY p.id, p.full_name, p.headline, p.template;
