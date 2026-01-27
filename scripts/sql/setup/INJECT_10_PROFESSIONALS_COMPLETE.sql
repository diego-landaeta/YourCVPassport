-- ============================================================================
-- INYECCIÓN COMPLETA DE 10 PROFESIONALES HOLÍSTICOS PARA ISEIH
-- ============================================================================
-- Este script crea 10 perfiles profesionales completos con:
-- - Perfil básico (profiles)
-- - Experiencias laborales (experiences)
-- - Formación académica (education)
-- - Habilidades (skills)
-- - Idiomas (languages)
-- - Certificaciones (stamps)
-- - Proyectos destacados (portfolio_items)
-- - Colaboraciones (portfolio_items tipo COLLABORATION)
-- ============================================================================

-- IMPORTANTE: Ejecutar este script en Supabase SQL Editor
-- NO ejecutar en producción sin revisión previa

DO $$
DECLARE
  -- IDs de perfiles que vamos a crear
  v_james_id UUID;
  v_sarah_id UUID;
  v_robert_id UUID;
  v_emily_id UUID;
  v_marcus_id UUID;
  v_lisa_id UUID;
  v_david_id UUID;
  v_rachel_id UUID;
  v_jennifer_id UUID;
  v_michael_id UUID;

BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '🚀 INICIANDO INYECCIÓN DE 10 PROFESIONALES';
  RAISE NOTICE '============================================';

  -- ========================================================================
  -- 1. JAMES WILSON - Tutor de Educación Emocional
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '👤 Creando perfil: James Wilson';

  -- Crear usuario en auth si no existe
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_user_meta_data,
    role
  )
  SELECT
    gen_random_uuid(),
    'james.wilson@iseih.edu',
    crypt('TempPassword123!', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    jsonb_build_object('full_name', 'James Wilson'),
    'authenticated'
  WHERE NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'james.wilson@iseih.edu'
  )
  RETURNING id INTO v_james_id;

  -- Si el usuario ya existía, obtener su ID
  IF v_james_id IS NULL THEN
    SELECT id INTO v_james_id FROM auth.users WHERE email = 'james.wilson@iseih.edu';
  END IF;

  -- Crear perfil
  INSERT INTO profiles (
    id,
    full_name,
    email,
    headline,
    title,
    summary,
    location,
    slug,
    template,
    role,
    plan,
    show_verified_credentials,
    created_at,
    updated_at
  ) VALUES (
    v_james_id,
    'James Wilson',
    'james.wilson@iseih.edu',
    'Tutor de Educación Emocional',
    'Tutor de Educación Emocional',
    'James se dedica a enseñar habilidades socioemocionales a educadores y padres. Con 9 años de experiencia, ha desarrollado programas prácticos que ayudan a niños y adolescentes a desarrollar inteligencia emocional. Su enfoque es directo, basado en evidencia y fácil de implementar.',
    'Miami, FL, USA',
    'james-wilson-educacion-emocional',
    'professional-blue',
    'professional',
    'pro',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    headline = EXCLUDED.headline,
    summary = EXCLUDED.summary,
    updated_at = NOW();

  -- Experiencias laborales
  INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, location, employment_type, sort_order)
  VALUES
    -- Tutor de Educación Emocional (Actual)
    (v_james_id, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Tutor de Educación Emocional', '2023-01-01', NULL, true,
     'Docencia sobre desarrollo de la inteligencia emocional en el aula y estrategias de regulación para educadores.',
     'Miami, FL, USA', 'FULL_TIME', 1),

    -- Desarrollador de Currículos
    (v_james_id, 'SEL Solutions', 'Desarrollador de Currículos', '2020-01-01', '2023-12-31', false,
     'Creación de materiales didácticos y guías para la implementación de aprendizaje socioemocional en escuelas.',
     'Remote', 'FULL_TIME', 2),

    -- Formador Independiente
    (v_james_id, 'EQ Training', 'Formador Independiente', '2019-01-01', '2023-12-31', false,
     'Talleres corporativos y educativos sobre empatía, comunicación y manejo del estrés.',
     'Remote', 'FREELANCE', 3),

    -- Coordinador SEL
    (v_james_id, 'Florida Public Schools', 'Coordinador SEL', '2015-01-01', '2019-12-31', false,
     'Implementación distrital de programas de aprendizaje socioemocional y capacitación docente.',
     'Miami, FL, USA', 'FULL_TIME', 4);

  -- Formación académica
  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, sort_order)
  VALUES
    (v_james_id, 'Lesley University', 'M.A.', 'Educación Socioemocional', '2013-09-01', '2015-06-30', false, 1),
    (v_james_id, 'University of Florida', 'B.S.', 'Psicología Educativa', '2009-09-01', '2011-06-30', false, 2);

  -- Habilidades
  INSERT INTO skills (profile_id, name, level, category, sort_order)
  VALUES
    (v_james_id, 'Inteligencia Emocional', 'EXPERT', 'Social-Emotional Learning', 1),
    (v_james_id, 'Aprendizaje Socioemocional (SEL)', 'EXPERT', 'Teaching', 2),
    (v_james_id, 'Prácticas Restaurativas', 'ADVANCED', 'Conflict Resolution', 3),
    (v_james_id, 'Capacitación Docente', 'ADVANCED', 'Professional Development', 4),
    (v_james_id, 'Diseño Curricular', 'ADVANCED', 'Curriculum Design', 5),
    (v_james_id, 'Resolución de Conflictos', 'ADVANCED', 'Conflict Resolution', 6);

  -- Idiomas
  INSERT INTO languages (profile_id, name, level, is_native, sort_order)
  VALUES
    (v_james_id, 'Inglés', 'Native', true, 1),
    (v_james_id, 'Español', 'B2', false, 2);

  -- Proyectos destacados (portfolio_items)
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, featured, sort_order, created_at)
  VALUES
    (v_james_id, 'Programa ''Aulas Empáticas''',
     'Piloto exitoso en 10 escuelas para reducir el bullying mediante círculos restaurativos.',
     'PROJECT', ARRAY['SEL', 'Prácticas Restaurativas', 'Bullying Prevention'], true, 1, '2022-01-01'),

    (v_james_id, 'App ''Emotion Check-in''',
     'Asesoría pedagógica para una aplicación móvil de registro emocional para adolescentes.',
     'PROJECT', ARRAY['Tech Consulting', 'Adolescents', 'Mental Health'], true, 2, '2021-01-01'),

    (v_james_id, 'Simposio de Bienestar Docente',
     'Evento virtual enfocado en la salud mental de los profesores durante la pandemia.',
     'PROJECT', ARRAY['Teacher Wellness', 'Mental Health', 'Virtual Event'], true, 3, '2020-01-01');

  -- Colaboraciones
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order, created_at)
  VALUES
    (v_james_id, 'Autor de blog sobre crianza e inteligencia emocional',
     'Artículos mensuales sobre desarrollo emocional infantil y familiar.',
     'COLLABORATION', ARRAY['Writing', 'Parenting', 'Emotional Intelligence'], 1, NOW()),

    (v_james_id, 'Consultor para ONGs de educación',
     'Asesoramiento en programas de educación emocional para organizaciones sin fines de lucro.',
     'COLLABORATION', ARRAY['NGO', 'Consulting', 'Education'], 2, NOW()),

    (v_james_id, 'Orador TEDx sobre empatía en la educación',
     'Conferencia sobre la importancia de la empatía en el sistema educativo moderno.',
     'COLLABORATION', ARRAY['Public Speaking', 'TEDx', 'Empathy'], 3, NOW());

  -- Certificaciones/Stamps
  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
  VALUES
    (v_james_id, 'CERTIFICATION', 'VERIFIED',
     jsonb_build_object(
       'name', 'Social Emotional Learning Specialist',
       'issuer', 'CASEL',
       'issue_date', '2020-06-01',
       'credential_url', 'https://casel.org/verify/james-wilson'
     ),
     'CASEL', NOW(), NOW()),

    (v_james_id, 'CERTIFICATION', 'VERIFIED',
     jsonb_build_object(
       'name', 'Certified Emotional Intelligence Coach',
       'issuer', 'EQ-i 2.0',
       'issue_date', '2019-03-15',
       'credential_url', 'https://eqi.org/verify/james-wilson'
     ),
     'EQ-i', NOW(), NOW()),

    (v_james_id, 'CERTIFICATION', 'VERIFIED',
     jsonb_build_object(
       'name', 'Restorative Practices Facilitator',
       'issuer', 'International Institute for Restorative Practices',
       'issue_date', '2018-09-10'
     ),
     'IIRP', NOW(), NOW()),

    (v_james_id, 'EMAIL', 'VERIFIED',
     jsonb_build_object('email', 'james.wilson@iseih.edu'),
     'ISEIH', NOW(), NOW());

  RAISE NOTICE '✅ James Wilson creado exitosamente';

  -- ========================================================================
  -- 2. SARAH BENNETT - Tutora de Pedagogía Montessori y Waldorf
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '👤 Creando perfil: Sarah Bennett';

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, role)
  SELECT gen_random_uuid(), 'sarah.bennett@iseih.edu', crypt('TempPassword123!', gen_salt('bf')), NOW(), NOW(), NOW(),
         jsonb_build_object('full_name', 'Sarah Bennett'), 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'sarah.bennett@iseih.edu')
  RETURNING id INTO v_sarah_id;

  IF v_sarah_id IS NULL THEN
    SELECT id INTO v_sarah_id FROM auth.users WHERE email = 'sarah.bennett@iseih.edu';
  END IF;

  INSERT INTO profiles (id, full_name, email, headline, title, summary, location, slug, template, role, plan, show_verified_credentials, created_at, updated_at)
  VALUES (
    v_sarah_id, 'Sarah Bennett', 'sarah.bennett@iseih.edu',
    'Tutora de Pedagogía Montessori y Waldorf',
    'Tutora de Pedagogía Montessori y Waldorf',
    'Sarah tiene 13 años de experiencia en educación alternativa, trabajando directamente con niños y formando educadores. Se especializa en crear ambientes de aprendizaje respetuosos que honren el desarrollo natural de cada niño. Enseña principios prácticos de pedagogías alternativas aplicables en diversos contextos educativos.',
    'Madison, WI, USA',
    'sarah-bennett-montessori-waldorf',
    'elegant-minimal',
    'professional',
    'pro',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = NOW();

  -- Experiencias
  INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, location, employment_type, sort_order)
  VALUES
    (v_sarah_id, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Tutora de Pedagogía Alternativa', '2023-01-01', NULL, true,
     'Formación docente en filosofías Montessori y Waldorf. Supervisión de prácticas educativas innovadoras.',
     'Madison, WI, USA', 'FULL_TIME', 1),

    (v_sarah_id, 'Holistic Education Network', 'Formadora de Educadores', '2021-01-01', '2023-12-31', false,
     'Capacitación intensiva para maestros en transición hacia metodologías activas y respetuosas.',
     'Remote', 'FULL_TIME', 2),

    (v_sarah_id, 'Alternative Schools Alliance', 'Consultora Educativa', '2016-01-01', '2021-12-31', false,
     'Asesoramiento en diseño curricular y preparación de ambientes para nuevas escuelas alternativas.',
     'Remote', 'CONTRACT', 3),

    (v_sarah_id, 'Madison Private School', 'Maestra Montessori', '2011-01-01', '2016-12-31', false,
     'Guía de aula en nivel primario, implementando el currículo Montessori completo.',
     'Madison, WI, USA', 'FULL_TIME', 4);

  -- Educación
  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, sort_order)
  VALUES
    (v_sarah_id, 'Bank Street College of Education', 'M.Ed.', 'Educación Alternativa', '2011-09-01', '2013-06-30', false, 1),
    (v_sarah_id, 'University of Wisconsin-Madison', 'B.A.', 'Desarrollo Infantil', '2007-09-01', '2009-06-30', false, 2),
    (v_sarah_id, 'Montessori Institute', 'Certificación Montessori (AMI)', 'Montessori Education (Ages 6-12)', '2011-01-01', '2011-12-31', false, 3);

  -- Habilidades
  INSERT INTO skills (profile_id, name, level, category, sort_order)
  VALUES
    (v_sarah_id, 'Pedagogía Montessori', 'EXPERT', 'Teaching Methods', 1),
    (v_sarah_id, 'Pedagogía Waldorf', 'EXPERT', 'Teaching Methods', 2),
    (v_sarah_id, 'Diseño de Ambientes', 'ADVANCED', 'Learning Environment Design', 3),
    (v_sarah_id, 'Desarrollo Infantil', 'ADVANCED', 'Child Development', 4),
    (v_sarah_id, 'Formación Docente', 'ADVANCED', 'Teacher Training', 5),
    (v_sarah_id, 'Disciplina Consciente', 'ADVANCED', 'Positive Discipline', 6);

  -- Idiomas
  INSERT INTO languages (profile_id, name, level, is_native, sort_order)
  VALUES
    (v_sarah_id, 'Inglés', 'Native', true, 1),
    (v_sarah_id, 'Alemán', 'A2', false, 2);

  -- Proyectos destacados
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, featured, sort_order, created_at)
  VALUES
    (v_sarah_id, 'Ambientes que Educan',
     'Rediseño de aulas en 5 escuelas públicas para incorporar principios Montessori.',
     'PROJECT', ARRAY['Montessori', 'School Design', 'Public Schools'], true, 1, '2022-01-01'),

    (v_sarah_id, 'Curso ''Montessori en Casa''',
     'Programa online para padres sobre cómo adaptar el hogar para fomentar la autonomía infantil.',
     'PROJECT', ARRAY['Montessori', 'Parenting', 'Online Course'], true, 2, '2020-01-01'),

    (v_sarah_id, 'Congreso de Educación Viva',
     'Presentación sobre la integración de arte y naturaleza en el currículo Waldorf.',
     'PROJECT', ARRAY['Waldorf', 'Public Speaking', 'Conference'], true, 3, '2019-01-01');

  -- Colaboraciones
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order, created_at)
  VALUES
    (v_sarah_id, 'Miembro de la American Montessori Society',
     'Participación activa en la comunidad profesional Montessori.',
     'COLLABORATION', ARRAY['Professional Association', 'Montessori', 'Networking'], 1, NOW()),

    (v_sarah_id, 'Mentora para nuevos maestros en formación',
     'Acompañamiento y supervisión de practicantes de pedagogías alternativas.',
     'COLLABORATION', ARRAY['Mentorship', 'Teacher Training'], 2, NOW()),

    (v_sarah_id, 'Colaboradora en podcast sobre crianza respetuosa',
     'Entrevistas y episodios sobre educación Montessori y Waldorf.',
     'COLLABORATION', ARRAY['Podcast', 'Parenting', 'Education'], 3, NOW());

  -- Stamps
  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
  VALUES
    (v_sarah_id, 'CERTIFICATION', 'VERIFIED',
     jsonb_build_object(
       'name', 'AMI Montessori Teacher Certification',
       'issuer', 'Association Montessori Internationale',
       'issue_date', '2011-12-15'
     ),
     'AMI', NOW(), NOW()),

    (v_sarah_id, 'CERTIFICATION', 'VERIFIED',
     jsonb_build_object(
       'name', 'Waldorf Early Childhood Educator',
       'issuer', 'Waldorf Early Childhood Association',
       'issue_date', '2015-06-20'
     ),
     'WECAN', NOW(), NOW()),

    (v_sarah_id, 'CERTIFICATION', 'VERIFIED',
     jsonb_build_object(
       'name', 'Conscious Discipline Instructor',
       'issuer', 'Conscious Discipline',
       'issue_date', '2017-03-10'
     ),
     'Conscious Discipline', NOW(), NOW()),

    (v_sarah_id, 'EMAIL', 'VERIFIED',
     jsonb_build_object('email', 'sarah.bennett@iseih.edu'),
     'ISEIH', NOW(), NOW());

  RAISE NOTICE '✅ Sarah Bennett creada exitosamente';

  -- ========================================================================
  -- 3. ROBERT GREEN - Tutor de Vida Sostenible
  -- ========================================================================
  RAISE NOTICE '';
  RAISE NOTICE '👤 Creando perfil: Robert Green';

  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, role)
  SELECT gen_random_uuid(), 'robert.green@iseih.edu', crypt('TempPassword123!', gen_salt('bf')), NOW(), NOW(), NOW(),
         jsonb_build_object('full_name', 'Robert Green'), 'authenticated'
  WHERE NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'robert.green@iseih.edu')
  RETURNING id INTO v_robert_id;

  IF v_robert_id IS NULL THEN
    SELECT id INTO v_robert_id FROM auth.users WHERE email = 'robert.green@iseih.edu';
  END IF;

  INSERT INTO profiles (id, full_name, email, headline, title, summary, location, slug, template, role, plan, show_verified_credentials, created_at, updated_at)
  VALUES (
    v_robert_id, 'Robert Green', 'robert.green@iseih.edu',
    'Tutor de Vida Sostenible',
    'Tutor de Vida Sostenible',
    'Robert tiene 8 años de experiencia ayudando a comunidades y personas a adoptar estilos de vida más sostenibles. Su enfoque práctico se centra en cambios alcanzables que generan impacto real. Comparte estrategias concretas para vivir de manera más consciente y ecológica en entornos urbanos y rurales.',
    'Seattle, WA, USA',
    'robert-green-vida-sostenible',
    'green-minimal',
    'professional',
    'pro',
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, updated_at = NOW();

  -- Experiencias
  INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, location, employment_type, sort_order)
  VALUES
    (v_robert_id, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Tutor de Vida Sostenible', '2023-01-01', NULL, true,
     'Enseñanza de principios de permacultura y estrategias de sostenibilidad doméstica. Mentoría en proyectos de transición ecológica.',
     'Seattle, WA, USA', 'FULL_TIME', 1),

    (v_robert_id, 'Green Living Solutions', 'Consultor Independiente', '2020-01-01', '2023-12-31', false,
     'Auditorías de sostenibilidad para hogares y pequeñas empresas. Diseño de sistemas de compostaje y reducción de residuos.',
     'Seattle, WA, USA', 'FREELANCE', 2),

    (v_robert_id, 'Seattle Community Gardens', 'Instructor de Permacultura Urbana', '2018-01-01', '2023-12-31', false,
     'Impartición de talleres prácticos sobre cultivo urbano y diseño de sistemas resilientes en pequeños espacios.',
     'Seattle, WA, USA', 'PART_TIME', 3),

    (v_robert_id, 'City of Seattle Programs', 'Coordinador de Sostenibilidad', '2016-01-01', '2020-12-31', false,
     'Gestión de iniciativas comunitarias para la reducción de la huella de carbono y promoción de la economía circular.',
     'Seattle, WA, USA', 'FULL_TIME', 4);

  -- Educación
  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, sort_order)
  VALUES
    (v_robert_id, 'University of Washington', 'M.A.', 'Desarrollo Sostenible', '2014-09-01', '2016-06-30', false, 1),
    (v_robert_id, 'University of Vermont', 'B.A.', 'Ciencias Ambientales', '2010-09-01', '2012-06-30', false, 2);

  -- Habilidades
  INSERT INTO skills (profile_id, name, level, category, sort_order)
  VALUES
    (v_robert_id, 'Permacultura Urbana', 'EXPERT', 'Sustainable Living', 1),
    (v_robert_id, 'Sostenibilidad Doméstica', 'EXPERT', 'Sustainable Living', 2),
    (v_robert_id, 'Gestión de Residuos', 'ADVANCED', 'Waste Management', 3),
    (v_robert_id, 'Economía Circular', 'ADVANCED', 'Sustainability', 4),
    (v_robert_id, 'Educación Comunitaria', 'ADVANCED', 'Community Engagement', 5),
    (v_robert_id, 'Auditoría Ambiental', 'ADVANCED', 'Environmental Assessment', 6);

  -- Idiomas
  INSERT INTO languages (profile_id, name, level, is_native, sort_order)
  VALUES
    (v_robert_id, 'Inglés', 'Native', true, 1);

  -- Proyectos destacados
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, featured, sort_order, created_at)
  VALUES
    (v_robert_id, 'Proyecto ''Barrios Comestibles''',
     'Implementación de jardines de alimentos en espacios públicos subutilizados de Seattle.',
     'PROJECT', ARRAY['Urban Agriculture', 'Community Gardens', 'Food Security'], true, 1, '2022-01-01'),

    (v_robert_id, 'Manual de Hogar Residuo Cero',
     'Guía paso a paso para familias que desean transicionar hacia un estilo de vida zero-waste.',
     'PROJECT', ARRAY['Zero Waste', 'Guidebook', 'Sustainable Living'], true, 2, '2021-01-01'),

    (v_robert_id, 'Feria de Economía Circular',
     'Evento comunitario conectando artesanos, reparadores y vecinos para fomentar la reutilización.',
     'PROJECT', ARRAY['Circular Economy', 'Community Event', 'Sustainability'], true, 3, '2019-01-01');

  -- Colaboraciones
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order, created_at)
  VALUES
    (v_robert_id, 'Asesor voluntario para huertos escolares',
     'Apoyo técnico para escuelas que implementan huertos educativos.',
     'COLLABORATION', ARRAY['Volunteering', 'Education', 'Urban Agriculture'], 1, NOW()),

    (v_robert_id, 'Columnista mensual en blog de vida sostenible',
     'Artículos sobre sostenibilidad práctica y permacultura urbana.',
     'COLLABORATION', ARRAY['Writing', 'Blogging', 'Sustainability'], 2, NOW()),

    (v_robert_id, 'Tallerista en festivales de eco-construcción',
     'Talleres sobre construcción sostenible y vida en comunidad.',
     'COLLABORATION', ARRAY['Workshops', 'Eco-construction', 'Festivals'], 3, NOW());

  -- Stamps
  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
  VALUES
    (v_robert_id, 'CERTIFICATION', 'VERIFIED',
     jsonb_build_object(
       'name', 'Permaculture Design Certificate',
       'issuer', 'Permaculture Institute',
       'issue_date', '2016-08-20'
     ),
     'Permaculture Institute', NOW(), NOW()),

    (v_robert_id, 'CERTIFICATION', 'VERIFIED',
     jsonb_build_object(
       'name', 'Green Building Professional',
       'issuer', 'USGBC',
       'issue_date', '2018-05-12'
     ),
     'USGBC', NOW(), NOW()),

    (v_robert_id, 'CERTIFICATION', 'VERIFIED',
     jsonb_build_object(
       'name', 'Sustainability Educator',
       'issuer', 'Green Education Foundation',
       'issue_date', '2019-11-30'
     ),
     'GEF', NOW(), NOW()),

    (v_robert_id, 'EMAIL', 'VERIFIED',
     jsonb_build_object('email', 'robert.green@iseih.edu'),
     'ISEIH', NOW(), NOW());

  RAISE NOTICE '✅ Robert Green creado exitosamente';

  -- ========================================================================
  -- CONTINUARÁ CON LOS OTROS 7 PROFESIONALES...
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ PARTE 1 COMPLETADA (3/10 profesionales)';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'IDs creados:';
  RAISE NOTICE '- James Wilson: %', v_james_id;
  RAISE NOTICE '- Sarah Bennett: %', v_sarah_id;
  RAISE NOTICE '- Robert Green: %', v_robert_id;
  RAISE NOTICE '';
  RAISE NOTICE '⏳ Ejecuta el siguiente archivo para continuar...';
  RAISE NOTICE '============================================';

END $$;

-- Verificar lo que se creó
SELECT
  p.full_name,
  p.headline,
  p.location,
  COUNT(DISTINCT e.id) as experiencias,
  COUNT(DISTINCT ed.id) as educacion,
  COUNT(DISTINCT s.id) as skills,
  COUNT(DISTINCT l.id) as idiomas,
  COUNT(DISTINCT st.id) as stamps,
  COUNT(DISTINCT po.id) as proyectos
FROM profiles p
LEFT JOIN experiences e ON e.profile_id = p.id
LEFT JOIN education ed ON ed.profile_id = p.id
LEFT JOIN skills s ON s.profile_id = p.id
LEFT JOIN languages l ON l.profile_id = p.id
LEFT JOIN stamps st ON st.profile_id = p.id
LEFT JOIN portfolio_items po ON po.profile_id = p.id
WHERE p.email IN (
  'james.wilson@iseih.edu',
  'sarah.bennett@iseih.edu',
  'robert.green@iseih.edu'
)
GROUP BY p.id, p.full_name, p.headline, p.location
ORDER BY p.full_name;
