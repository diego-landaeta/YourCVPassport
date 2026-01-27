-- =====================================================
-- PROFESIONAL 1: JAMES WILSON (VERSIÓN SEGURA)
-- Tutor de Educación Emocional
-- =====================================================
-- Esta versión evita conflictos con triggers y constraints
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_profile_exists BOOLEAN;
  v_cert_id_1 UUID;
  v_cert_id_2 UUID;
  v_cert_id_3 UUID;
BEGIN

  RAISE NOTICE '🚀 Iniciando creación de James Wilson...';

  -- =====================================================
  -- PASO 1: Verificar/Crear usuario en auth.users
  -- =====================================================

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'james.wilson@iseih.edu';

  IF v_user_id IS NULL THEN
    -- Crear nuevo usuario
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      aud,
      role
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'james.wilson@iseih.edu',
      crypt('TempPassword123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"James Wilson"}',
      'authenticated',
      'authenticated'
    );

    RAISE NOTICE '✅ Usuario creado en auth.users: %', v_user_id;
  ELSE
    RAISE NOTICE '✅ Usuario ya existe: %', v_user_id;
  END IF;

  -- =====================================================
  -- PASO 2: Verificar si el perfil ya existe
  -- =====================================================

  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = v_user_id) INTO v_profile_exists;

  IF v_profile_exists THEN
    RAISE NOTICE '⚠️  El perfil ya existe. Actualizando datos...';

    -- Actualizar perfil existente
    UPDATE profiles SET
      full_name = 'James Wilson',
      email = 'james.wilson@iseih.edu',
      headline = 'Tutor de Educación Emocional',
      title = 'Tutor de Educación Emocional',
      summary = 'James se dedica a enseñar habilidades socioemocionales a educadores y padres. Con 9 años de experiencia, ha desarrollado programas prácticos que ayudan a niños y adolescentes a desarrollar inteligencia emocional. Su enfoque es directo, basado en evidencia y fácil de implementar.',
      location = 'Miami, FL, USA',
      country_code = 'US',
      slug = 'james-wilson-educacion-emocional',
      template = 'professional-blue',
      template_color = '#2563eb',
      role = 'professional',
      plan = 'free',
      show_verified_credentials = true,
      show_connect_links = true,
      show_qr_code = true,
      updated_at = NOW()
    WHERE id = v_user_id;

  ELSE
    RAISE NOTICE '✅ Creando nuevo perfil...';

    -- Insertar nuevo perfil con solo campos requeridos primero
    INSERT INTO profiles (
      id,
      email,
      role,
      plan
    ) VALUES (
      v_user_id,
      'james.wilson@iseih.edu',
      'professional',
      'free'
    );

    -- Luego actualizar con el resto de campos
    UPDATE profiles SET
      full_name = 'James Wilson',
      headline = 'Tutor de Educación Emocional',
      title = 'Tutor de Educación Emocional',
      summary = 'James se dedica a enseñar habilidades socioemocionales a educadores y padres. Con 9 años de experiencia, ha desarrollado programas prácticos que ayudan a niños y adolescentes a desarrollar inteligencia emocional. Su enfoque es directo, basado en evidencia y fácil de implementar.',
      location = 'Miami, FL, USA',
      country_code = 'US',
      slug = 'james-wilson-educacion-emocional',
      template = 'professional-blue',
      template_color = '#2563eb',
      show_verified_credentials = true,
      show_connect_links = true,
      show_qr_code = true,
      updated_at = NOW()
    WHERE id = v_user_id;
  END IF;

  RAISE NOTICE '✅ Perfil creado/actualizado';

  -- =====================================================
  -- PASO 3: EXPERIENCIAS LABORALES
  -- =====================================================

  INSERT INTO experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    description, location, employment_type, sort_order
  ) VALUES
    (v_user_id, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Tutor de Educación Emocional',
     '2023-01-01', NULL, true,
     'Docencia sobre desarrollo de la inteligencia emocional en el aula y estrategias de regulación para educadores.',
     'Miami, FL, USA', 'FULL_TIME', 1),

    (v_user_id, 'SEL Solutions', 'Desarrollador de Currículos',
     '2020-01-01', '2023-12-31', false,
     'Creación de materiales didácticos y guías para la implementación de aprendizaje socioemocional en escuelas.',
     'Remote', 'FULL_TIME', 2),

    (v_user_id, 'EQ Training', 'Formador Independiente',
     '2019-01-01', '2023-12-31', false,
     'Talleres corporativos y educativos sobre empatía, comunicación y manejo del estrés.',
     'Remote', 'FREELANCE', 3),

    (v_user_id, 'Florida Public Schools', 'Coordinador SEL',
     '2015-01-01', '2019-12-31', false,
     'Implementación distrital de programas de aprendizaje socioemocional y capacitación docente.',
     'Miami, FL, USA', 'FULL_TIME', 4)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 4 experiencias laborales';

  -- =====================================================
  -- PASO 4: FORMACIÓN ACADÉMICA
  -- =====================================================

  INSERT INTO education (
    profile_id, institution_name, degree, field_of_study,
    start_date, end_date, is_current, sort_order
  ) VALUES
    (v_user_id, 'Lesley University', 'M.A.', 'Educación Socioemocional',
     '2013-09-01', '2015-06-30', false, 1),

    (v_user_id, 'University of Florida', 'B.S.', 'Psicología Educativa',
     '2009-09-01', '2011-06-30', false, 2)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 2 títulos académicos';

  -- =====================================================
  -- PASO 5: HABILIDADES
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, category, sort_order)
  VALUES
    (v_user_id, 'Inteligencia Emocional', 'EXPERT', 'Social-Emotional Learning', 1),
    (v_user_id, 'Aprendizaje Socioemocional (SEL)', 'EXPERT', 'Teaching', 2),
    (v_user_id, 'Prácticas Restaurativas', 'ADVANCED', 'Conflict Resolution', 3),
    (v_user_id, 'Capacitación Docente', 'ADVANCED', 'Professional Development', 4),
    (v_user_id, 'Diseño Curricular', 'ADVANCED', 'Curriculum Design', 5),
    (v_user_id, 'Resolución de Conflictos', 'ADVANCED', 'Conflict Resolution', 6)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 6 habilidades';

  -- =====================================================
  -- PASO 6: IDIOMAS
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order)
  VALUES
    (v_user_id, 'Inglés', 'Native', true, 1),
    (v_user_id, 'Español', 'B2', false, 2)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 2 idiomas';

  -- =====================================================
  -- PASO 7: PROYECTOS DESTACADOS
  -- =====================================================

  INSERT INTO portfolio_items (
    profile_id, title, description, type, tags, featured, sort_order, created_at
  ) VALUES
    (v_user_id, 'Programa ''Aulas Empáticas''',
     'Piloto exitoso en 10 escuelas para reducir el bullying mediante círculos restaurativos.',
     'PROJECT', ARRAY['SEL', 'Prácticas Restaurativas', 'Bullying Prevention'], true, 1, '2022-01-01'),

    (v_user_id, 'App ''Emotion Check-in''',
     'Asesoría pedagógica para una aplicación móvil de registro emocional para adolescentes.',
     'PROJECT', ARRAY['Tech Consulting', 'Adolescents', 'Mental Health'], true, 2, '2021-01-01'),

    (v_user_id, 'Simposio de Bienestar Docente',
     'Evento virtual enfocado en la salud mental de los profesores durante la pandemia.',
     'PROJECT', ARRAY['Teacher Wellness', 'Mental Health', 'Virtual Event'], true, 3, '2020-01-01')
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 3 proyectos';

  -- =====================================================
  -- PASO 8: COLABORACIONES
  -- =====================================================

  INSERT INTO portfolio_items (
    profile_id, title, description, type, tags, featured, sort_order
  ) VALUES
    (v_user_id, 'Autor de blog sobre crianza e inteligencia emocional',
     'Artículos mensuales sobre desarrollo emocional infantil y familiar.',
     'COLLABORATION', ARRAY['Writing', 'Parenting', 'Emotional Intelligence'], false, 4),

    (v_user_id, 'Consultor para ONGs de educación',
     'Asesoramiento en programas de educación emocional para organizaciones sin fines de lucro.',
     'COLLABORATION', ARRAY['NGO', 'Consulting', 'Education'], false, 5),

    (v_user_id, 'Orador TEDx sobre empatía en la educación',
     'Conferencia sobre la importancia de la empatía en el sistema educativo moderno.',
     'COLLABORATION', ARRAY['Public Speaking', 'TEDx', 'Empathy'], false, 6)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 3 colaboraciones';

  -- =====================================================
  -- PASO 9: CERTIFICACIONES
  -- =====================================================

  INSERT INTO portfolio_items (
    profile_id, type, title, issuer, issue_date, credential_id, credential_url,
    description, verified, sort_order
  ) VALUES
    (v_user_id, 'CERTIFICATION', 'Social Emotional Learning Specialist',
     'CASEL - Collaborative for Academic, Social, and Emotional Learning', '2020-06-01',
     'CASEL-SEL-2020-JW789', 'https://casel.org/verify/CASEL-SEL-2020-JW789',
     'Certificación oficial en aprendizaje socioemocional para educadores.', true, 7)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cert_id_1;

  INSERT INTO portfolio_items (
    profile_id, type, title, issuer, issue_date, credential_id, credential_url,
    description, verified, sort_order
  ) VALUES
    (v_user_id, 'CERTIFICATION', 'Certified Emotional Intelligence Coach',
     'EQ-i 2.0 Certification', '2019-03-15',
     'EQI-COACH-2019-JW456', 'https://eqi.org/verify/EQI-COACH-2019-JW456',
     'Certificación profesional para coaching en inteligencia emocional.', true, 8)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cert_id_2;

  INSERT INTO portfolio_items (
    profile_id, type, title, issuer, issue_date, credential_id,
    description, verified, sort_order
  ) VALUES
    (v_user_id, 'CERTIFICATION', 'Restorative Practices Facilitator',
     'International Institute for Restorative Practices (IIRP)', '2018-09-10',
     'IIRP-RPF-2018-JW234',
     'Certificación en facilitación de círculos restaurativos.', true, 9)
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cert_id_3;

  RAISE NOTICE '✅ 3 certificaciones';

  -- =====================================================
  -- PASO 10: STAMPS DE VERIFICACIÓN
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at)
  VALUES
    (v_user_id, 'EMAIL', 'VERIFIED',
     '{"email":"james.wilson@iseih.edu","verified_method":"manual_admin"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'EDUCATION', 'VERIFIED',
     '{"degree":"M.A. en Educación Socioemocional","institution":"Lesley University"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'EMPLOYMENT', 'VERIFIED',
     '{"position":"Tutor de Educación Emocional","company":"ISEIH"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'LANGUAGE', 'VERIFIED',
     '{"languages":["Inglés (Native)","Español (B2)"]}'::jsonb,
     'ISEIH Admin', NOW())
  ON CONFLICT DO NOTHING;

  -- Stamps de certificaciones
  IF v_cert_id_1 IS NOT NULL THEN
    INSERT INTO stamps (profile_id, type, status, entity_id, entity_type, evidence, provider, verified_at)
    VALUES (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_1::text, 'CERTIFICATION',
            '{"certification_title":"Social Emotional Learning Specialist"}'::jsonb,
            'ISEIH Admin', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_cert_id_2 IS NOT NULL THEN
    INSERT INTO stamps (profile_id, type, status, entity_id, entity_type, evidence, provider, verified_at)
    VALUES (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_2::text, 'CERTIFICATION',
            '{"certification_title":"Certified Emotional Intelligence Coach"}'::jsonb,
            'ISEIH Admin', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  IF v_cert_id_3 IS NOT NULL THEN
    INSERT INTO stamps (profile_id, type, status, entity_id, entity_type, evidence, provider, verified_at)
    VALUES (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_3::text, 'CERTIFICATION',
            '{"certification_title":"Restorative Practices Facilitator"}'::jsonb,
            'ISEIH Admin', NOW())
    ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE '✅ Stamps de verificación';

  -- =====================================================
  -- RESUMEN
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE '✅ JAMES WILSON CREADO EXITOSAMENTE';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE 'ID: %', v_user_id;
  RAISE NOTICE 'Email: james.wilson@iseih.edu';
  RAISE NOTICE 'URL: /cv/james-wilson-educacion-emocional';
  RAISE NOTICE '';

END $$;

-- Verificación
SELECT
  p.full_name,
  p.headline,
  COUNT(DISTINCT e.id) as experiencias,
  COUNT(DISTINCT ed.id) as educacion,
  COUNT(DISTINCT s.id) as skills,
  COUNT(DISTINCT l.id) as idiomas,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'CERTIFICATION') as certificaciones,
  COUNT(DISTINCT st.id) as stamps
FROM profiles p
LEFT JOIN experiences e ON e.profile_id = p.id
LEFT JOIN education ed ON ed.profile_id = p.id
LEFT JOIN skills s ON s.profile_id = p.id
LEFT JOIN languages l ON l.profile_id = p.id
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id
LEFT JOIN stamps st ON st.profile_id = p.id
WHERE p.email = 'james.wilson@iseih.edu'
GROUP BY p.id, p.full_name, p.headline;
