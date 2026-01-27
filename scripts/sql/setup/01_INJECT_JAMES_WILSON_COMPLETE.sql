-- =====================================================
-- PROFESIONAL 1: JAMES WILSON
-- Tutor de Educación Emocional
-- =====================================================
-- Email: james.wilson@iseih.edu
-- Teléfono: +1 305 555 0106
-- Ubicación: Miami, FL, USA
-- =====================================================
-- CONTENIDO COMPLETO:
-- ✅ Perfil principal con toda la información
-- ✅ 4 Experiencias laborales
-- ✅ 2 Formación académica
-- ✅ 6 Habilidades
-- ✅ 2 Idiomas
-- ✅ 3 Proyectos destacados
-- ✅ 3 Colaboraciones
-- ✅ 3 Certificaciones profesionales
-- ✅ 5 Stamps de verificación (EMAIL, EDUCATION, EMPLOYMENT, LANGUAGE, CERTIFICATION)
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_cert_id_1 UUID;
  v_cert_id_2 UUID;
  v_cert_id_3 UUID;
BEGIN

  -- =====================================================
  -- PASO 1: CREAR USUARIO EN AUTH (si no existe)
  -- =====================================================

  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'james.wilson@iseih.edu';

  IF v_user_id IS NULL THEN
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
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'james.wilson@iseih.edu',
      crypt('TempPassword123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object('full_name', 'James Wilson'),
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE '✅ Usuario creado en auth.users: %', v_user_id;
  ELSE
    RAISE NOTICE '⚠️  Usuario ya existe, usando ID: %', v_user_id;
  END IF;

  -- =====================================================
  -- PASO 2: CREAR PERFIL PRINCIPAL
  -- =====================================================

  INSERT INTO profiles (
    id,
    full_name,
    email,
    headline,
    title,
    summary,
    location,
    country_code,
    linkedin_url,
    slug,
    template,
    template_color,
    role,
    plan,
    show_verified_credentials,
    show_connect_links,
    show_qr_code,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'James Wilson',
    'james.wilson@iseih.edu',
    'Tutor de Educación Emocional',
    'Tutor de Educación Emocional',
    'James se dedica a enseñar habilidades socioemocionales a educadores y padres. Con 9 años de experiencia, ha desarrollado programas prácticos que ayudan a niños y adolescentes a desarrollar inteligencia emocional. Su enfoque es directo, basado en evidencia y fácil de implementar.',
    'Miami, FL, USA',
    'US',
    null,
    'james-wilson-educacion-emocional',
    'professional-blue',
    '#2563eb',
    'professional',
    'pro',
    true,
    true,
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    headline = EXCLUDED.headline,
    summary = EXCLUDED.summary,
    updated_at = NOW();

  RAISE NOTICE '✅ Perfil principal creado';

  -- =====================================================
  -- PASO 3: EXPERIENCIAS LABORALES
  -- =====================================================

  -- Experiencia 1: Tutor de Educación Emocional (2023 - Actualidad)
  INSERT INTO experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    description, location, employment_type, sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Tutor de Educación Emocional',
    '2023-01-01', NULL, true,
    'Docencia sobre desarrollo de la inteligencia emocional en el aula y estrategias de regulación para educadores.',
    'Miami, FL, USA',
    'FULL_TIME', 1, NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Experiencia 2: Desarrollador de Currículos (2020 - Actualidad)
  INSERT INTO experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    description, location, employment_type, sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'SEL Solutions',
    'Desarrollador de Currículos',
    '2020-01-01', '2023-12-31', false,
    'Creación de materiales didácticos y guías para la implementación de aprendizaje socioemocional en escuelas.',
    'Remote',
    'FULL_TIME', 2, NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Experiencia 3: Formador Independiente (2019 - Actualidad)
  INSERT INTO experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    description, location, employment_type, sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'EQ Training',
    'Formador Independiente',
    '2019-01-01', '2023-12-31', false,
    'Talleres corporativos y educativos sobre empatía, comunicación y manejo del estrés.',
    'Remote',
    'FREELANCE', 3, NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Experiencia 4: Coordinador SEL (2015 - 2019)
  INSERT INTO experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    description, location, employment_type, sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'Florida Public Schools',
    'Coordinador SEL',
    '2015-01-01', '2019-12-31', false,
    'Implementación distrital de programas de aprendizaje socioemocional y capacitación docente.',
    'Miami, FL, USA',
    'FULL_TIME', 4, NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 4 experiencias laborales creadas';

  -- =====================================================
  -- PASO 4: FORMACIÓN ACADÉMICA
  -- =====================================================

  -- Educación 1: M.A. en Educación Socioemocional (2015)
  INSERT INTO education (
    profile_id, institution_name, degree, field_of_study,
    start_date, end_date, is_current, sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'Lesley University',
    'M.A.', 'Educación Socioemocional',
    '2013-09-01', '2015-06-30', false, 1, NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Educación 2: B.S. en Psicología Educativa (2011)
  INSERT INTO education (
    profile_id, institution_name, degree, field_of_study,
    start_date, end_date, is_current, sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'University of Florida',
    'B.S.', 'Psicología Educativa',
    '2009-09-01', '2011-06-30', false, 2, NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 2 títulos académicos creados';

  -- =====================================================
  -- PASO 5: HABILIDADES
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, category, sort_order, created_at, updated_at)
  VALUES
    (v_user_id, 'Inteligencia Emocional', 'EXPERT', 'Social-Emotional Learning', 1, NOW(), NOW()),
    (v_user_id, 'Aprendizaje Socioemocional (SEL)', 'EXPERT', 'Teaching', 2, NOW(), NOW()),
    (v_user_id, 'Prácticas Restaurativas', 'ADVANCED', 'Conflict Resolution', 3, NOW(), NOW()),
    (v_user_id, 'Capacitación Docente', 'ADVANCED', 'Professional Development', 4, NOW(), NOW()),
    (v_user_id, 'Diseño Curricular', 'ADVANCED', 'Curriculum Design', 5, NOW(), NOW()),
    (v_user_id, 'Resolución de Conflictos', 'ADVANCED', 'Conflict Resolution', 6, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 6 habilidades creadas';

  -- =====================================================
  -- PASO 6: IDIOMAS
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order, created_at, updated_at)
  VALUES
    (v_user_id, 'Inglés', 'NATIVE', true, 1, NOW(), NOW()),
    (v_user_id, 'Español', 'B2', false, 2, NOW(), NOW())
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 2 idiomas creados';

  -- =====================================================
  -- PASO 7: PROYECTOS DESTACADOS
  -- =====================================================

  -- Proyecto 1: Programa 'Aulas Empáticas' (2022)
  INSERT INTO portfolio_items (
    profile_id, title, description, type, tags, featured,
    sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'Programa ''Aulas Empáticas''',
    'Piloto exitoso en 10 escuelas para reducir el bullying mediante círculos restaurativos.',
    'PROJECT',
    ARRAY['SEL', 'Prácticas Restaurativas', 'Bullying Prevention'],
    true, 1, '2022-01-01', NOW()
  ) ON CONFLICT DO NOTHING;

  -- Proyecto 2: App 'Emotion Check-in' (2021)
  INSERT INTO portfolio_items (
    profile_id, title, description, type, tags, featured,
    sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'App ''Emotion Check-in''',
    'Asesoría pedagógica para una aplicación móvil de registro emocional para adolescentes.',
    'PROJECT',
    ARRAY['Tech Consulting', 'Adolescents', 'Mental Health'],
    true, 2, '2021-01-01', NOW()
  ) ON CONFLICT DO NOTHING;

  -- Proyecto 3: Simposio de Bienestar Docente (2020)
  INSERT INTO portfolio_items (
    profile_id, title, description, type, tags, featured,
    sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'Simposio de Bienestar Docente',
    'Evento virtual enfocado en la salud mental de los profesores durante la pandemia.',
    'PROJECT',
    ARRAY['Teacher Wellness', 'Mental Health', 'Virtual Event'],
    true, 3, '2020-01-01', NOW()
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 3 proyectos destacados creados';

  -- =====================================================
  -- PASO 8: COLABORACIONES
  -- =====================================================

  -- Colaboración 1: Blog sobre crianza e inteligencia emocional
  INSERT INTO portfolio_items (
    profile_id, title, description, type, tags, featured,
    sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'Autor de blog sobre crianza e inteligencia emocional',
    'Artículos mensuales sobre desarrollo emocional infantil y familiar.',
    'COLLABORATION',
    ARRAY['Writing', 'Parenting', 'Emotional Intelligence'],
    false, 4, NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Colaboración 2: Consultor para ONGs de educación
  INSERT INTO portfolio_items (
    profile_id, title, description, type, tags, featured,
    sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'Consultor para ONGs de educación',
    'Asesoramiento en programas de educación emocional para organizaciones sin fines de lucro.',
    'COLLABORATION',
    ARRAY['NGO', 'Consulting', 'Education'],
    false, 5, NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Colaboración 3: Orador TEDx sobre empatía en la educación
  INSERT INTO portfolio_items (
    profile_id, title, description, type, tags, featured,
    sort_order, created_at, updated_at
  ) VALUES (
    v_user_id,
    'Orador TEDx sobre empatía en la educación',
    'Conferencia sobre la importancia de la empatía en el sistema educativo moderno.',
    'COLLABORATION',
    ARRAY['Public Speaking', 'TEDx', 'Empathy'],
    false, 6, NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ 3 colaboraciones creadas';

  -- =====================================================
  -- PASO 9: CERTIFICACIONES PROFESIONALES
  -- =====================================================

  -- Certificación 1: Social Emotional Learning Specialist
  INSERT INTO portfolio_items (
    profile_id, type, title, issuer, issue_date, credential_id, credential_url,
    description, verified, sort_order
  ) VALUES (
    v_user_id,
    'CERTIFICATION',
    'Social Emotional Learning Specialist',
    'CASEL - Collaborative for Academic, Social, and Emotional Learning',
    '2020-06-01',
    'CASEL-SEL-2020-JW789',
    'https://casel.org/verify/CASEL-SEL-2020-JW789',
    'Certificación oficial en aprendizaje socioemocional para educadores, incluyendo diseño curricular y evaluación de programas SEL.',
    true, 7
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO v_cert_id_1;

  -- Certificación 2: Certified Emotional Intelligence Coach
  INSERT INTO portfolio_items (
    profile_id, type, title, issuer, issue_date, credential_id, credential_url,
    description, verified, sort_order
  ) VALUES (
    v_user_id,
    'CERTIFICATION',
    'Certified Emotional Intelligence Coach',
    'EQ-i 2.0 Certification',
    '2019-03-15',
    'EQI-COACH-2019-JW456',
    'https://eqi.org/verify/EQI-COACH-2019-JW456',
    'Certificación profesional para coaching en inteligencia emocional utilizando el modelo EQ-i 2.0.',
    true, 8
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO v_cert_id_2;

  -- Certificación 3: Restorative Practices Facilitator
  INSERT INTO portfolio_items (
    profile_id, type, title, issuer, issue_date, credential_id,
    description, verified, sort_order
  ) VALUES (
    v_user_id,
    'CERTIFICATION',
    'Restorative Practices Facilitator',
    'International Institute for Restorative Practices (IIRP)',
    '2018-09-10',
    'IIRP-RPF-2018-JW234',
    'Certificación en facilitación de círculos restaurativos y resolución de conflictos en entornos educativos.',
    true, 9
  ) ON CONFLICT DO NOTHING
  RETURNING id INTO v_cert_id_3;

  RAISE NOTICE '✅ 3 certificaciones profesionales creadas';

  -- =====================================================
  -- PASO 10: STAMPS DE VERIFICACIÓN
  -- =====================================================

  -- Stamp 1: EMAIL VERIFICATION
  INSERT INTO stamps (
    profile_id, type, status, evidence, provider, verified_at, created_at
  ) VALUES (
    v_user_id, 'EMAIL', 'VERIFIED',
    jsonb_build_object(
      'email', 'james.wilson@iseih.edu',
      'verified_method', 'manual_admin'
    ),
    'ISEIH Admin', NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Stamp 2: EDUCATION VERIFICATION
  INSERT INTO stamps (
    profile_id, type, status, evidence, provider, verified_at, created_at
  ) VALUES (
    v_user_id, 'EDUCATION', 'VERIFIED',
    jsonb_build_object(
      'degree', 'M.A. en Educación Socioemocional',
      'institution', 'Lesley University',
      'verified_method', 'manual_admin'
    ),
    'ISEIH Admin', NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Stamp 3: EMPLOYMENT VERIFICATION
  INSERT INTO stamps (
    profile_id, type, status, evidence, provider, verified_at, created_at
  ) VALUES (
    v_user_id, 'EMPLOYMENT', 'VERIFIED',
    jsonb_build_object(
      'position', 'Tutor de Educación Emocional',
      'company', 'ISEIH',
      'verified_method', 'manual_admin'
    ),
    'ISEIH Admin', NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Stamp 4: LANGUAGE VERIFICATION
  INSERT INTO stamps (
    profile_id, type, status, evidence, provider, verified_at, created_at
  ) VALUES (
    v_user_id, 'LANGUAGE', 'VERIFIED',
    jsonb_build_object(
      'languages', ARRAY['Inglés (Native)', 'Español (B2)'],
      'verified_method', 'manual_admin'
    ),
    'ISEIH Admin', NOW(), NOW()
  ) ON CONFLICT DO NOTHING;

  -- Stamps de CERTIFICACIÓN (uno por cada certificación)
  IF v_cert_id_1 IS NOT NULL THEN
    INSERT INTO stamps (
      profile_id, type, status, entity_id, entity_type, evidence, provider, verified_at, created_at
    ) VALUES (
      v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_1::text, 'CERTIFICATION',
      jsonb_build_object(
        'certification_title', 'Social Emotional Learning Specialist',
        'verified_method', 'manual_admin',
        'verification_notes', 'Certificación verificada mediante documentación oficial de CASEL'
      ),
      'ISEIH Admin', NOW(), NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;

  IF v_cert_id_2 IS NOT NULL THEN
    INSERT INTO stamps (
      profile_id, type, status, entity_id, entity_type, evidence, provider, verified_at, created_at
    ) VALUES (
      v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_2::text, 'CERTIFICATION',
      jsonb_build_object(
        'certification_title', 'Certified Emotional Intelligence Coach',
        'verified_method', 'manual_admin',
        'verification_notes', 'Certificación verificada mediante EQ-i 2.0'
      ),
      'ISEIH Admin', NOW(), NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;

  IF v_cert_id_3 IS NOT NULL THEN
    INSERT INTO stamps (
      profile_id, type, status, entity_id, entity_type, evidence, provider, verified_at, created_at
    ) VALUES (
      v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_3::text, 'CERTIFICATION',
      jsonb_build_object(
        'certification_title', 'Restorative Practices Facilitator',
        'verified_method', 'manual_admin',
        'verification_notes', 'Certificación verificada mediante documentación de IIRP'
      ),
      'ISEIH Admin', NOW(), NOW()
    ) ON CONFLICT DO NOTHING;
  END IF;

  RAISE NOTICE '✅ Stamps de verificación creados (EMAIL, EDUCATION, EMPLOYMENT, LANGUAGE, 3x CERTIFICATION)';

  -- =====================================================
  -- RESUMEN FINAL
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '======================================================';
  RAISE NOTICE '✅ JAMES WILSON CREADO EXITOSAMENTE';
  RAISE NOTICE '======================================================';
  RAISE NOTICE 'Profile ID: %', v_user_id;
  RAISE NOTICE 'Email: james.wilson@iseih.edu';
  RAISE NOTICE 'Slug: james-wilson-educacion-emocional';
  RAISE NOTICE '';
  RAISE NOTICE 'CONTENIDO CREADO:';
  RAISE NOTICE '- ✅ Perfil principal';
  RAISE NOTICE '- ✅ 4 experiencias laborales';
  RAISE NOTICE '- ✅ 2 títulos académicos';
  RAISE NOTICE '- ✅ 6 habilidades';
  RAISE NOTICE '- ✅ 2 idiomas';
  RAISE NOTICE '- ✅ 3 proyectos destacados';
  RAISE NOTICE '- ✅ 3 colaboraciones';
  RAISE NOTICE '- ✅ 3 certificaciones profesionales verificadas';
  RAISE NOTICE '- ✅ 7 stamps de verificación total';
  RAISE NOTICE '';
  RAISE NOTICE 'URL del perfil: /cv/james-wilson-educacion-emocional';
  RAISE NOTICE '======================================================';

END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT
  p.full_name as "Nombre",
  p.headline as "Profesión",
  p.location as "Ubicación",
  p.slug as "URL Slug",
  COUNT(DISTINCT e.id) as "Experiencias",
  COUNT(DISTINCT ed.id) as "Educación",
  COUNT(DISTINCT s.id) as "Skills",
  COUNT(DISTINCT l.id) as "Idiomas",
  COUNT(DISTINCT po.id) FILTER (WHERE po.type = 'PROJECT') as "Proyectos",
  COUNT(DISTINCT po.id) FILTER (WHERE po.type = 'COLLABORATION') as "Colaboraciones",
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'CERTIFICATION') as "Certificaciones",
  COUNT(DISTINCT st.id) as "Stamps Total"
FROM profiles p
LEFT JOIN experiences e ON e.profile_id = p.id
LEFT JOIN education ed ON ed.profile_id = p.id
LEFT JOIN skills s ON s.profile_id = p.id
LEFT JOIN languages l ON l.profile_id = p.id
LEFT JOIN portfolio_items po ON po.profile_id = p.id AND po.type IN ('PROJECT', 'COLLABORATION')
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id AND pi.type = 'CERTIFICATION'
LEFT JOIN stamps st ON st.profile_id = p.id
WHERE p.email = 'james.wilson@iseih.edu'
GROUP BY p.id, p.full_name, p.headline, p.location, p.slug;
