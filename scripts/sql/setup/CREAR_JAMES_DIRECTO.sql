-- =====================================================
-- CREAR JAMES WILSON - SIN TRIGGERS
-- =====================================================
-- Desactiva el trigger, crea todo, y lo reactiva
-- =====================================================

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_cert_1 UUID;
  v_cert_2 UUID;
  v_cert_3 UUID;
BEGIN

  -- Desactivar el trigger problemático
  ALTER TABLE auth.users DISABLE TRIGGER ALL;

  RAISE NOTICE '🔧 Trigger desactivado temporalmente';

  -- Crear usuario en auth.users
  INSERT INTO auth.users (
    id, instance_id, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    'james.wilson@iseih.edu',
    crypt('TempPassword123!', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"James Wilson"}',
    'authenticated',
    'authenticated',
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Usuario creado: %', v_user_id;

  -- Crear perfil manualmente
  INSERT INTO profiles (
    id, full_name, email, headline, summary, location, country_code,
    slug, template, template_color, role, plan, created_at, updated_at
  ) VALUES (
    v_user_id,
    'James Wilson',
    'james.wilson@iseih.edu',
    'Tutor de Educación Emocional',
    'James se dedica a enseñar habilidades socioemocionales a educadores y padres. Con 9 años de experiencia, ha desarrollado programas prácticos que ayudan a niños y adolescentes a desarrollar inteligencia emocional.',
    'Miami, FL, USA',
    'US',
    'james-wilson-educacion-emocional',
    'professional-blue',
    '#2563eb',
    'professional',
    'free',
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ Perfil creado';

  -- Experiencias
  INSERT INTO experiences (profile_id, company_name, position, start_date, is_current, description, location, employment_type, sort_order)
  VALUES
    (v_user_id, 'ISEIH', 'Tutor de Educación Emocional', '2023-01-01', true, 'Docencia sobre inteligencia emocional.', 'Miami, FL', 'FULL_TIME', 1),
    (v_user_id, 'SEL Solutions', 'Desarrollador de Currículos', '2020-01-01', false, 'Materiales didácticos para SEL.', 'Remote', 'FULL_TIME', 2),
    (v_user_id, 'EQ Training', 'Formador', '2019-01-01', false, 'Talleres sobre empatía.', 'Remote', 'FREELANCE', 3),
    (v_user_id, 'Florida Schools', 'Coordinador SEL', '2015-01-01', false, 'Programas SEL distritales.', 'Miami, FL', 'FULL_TIME', 4);

  -- Educación
  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order)
  VALUES
    (v_user_id, 'Lesley University', 'M.A.', 'Educación Socioemocional', '2013-09-01', '2015-06-30', 1),
    (v_user_id, 'University of Florida', 'B.S.', 'Psicología Educativa', '2009-09-01', '2011-06-30', 2);

  -- Habilidades
  INSERT INTO skills (profile_id, name, level, category, sort_order)
  VALUES
    (v_user_id, 'Inteligencia Emocional', 'EXPERT', 'SEL', 1),
    (v_user_id, 'SEL', 'EXPERT', 'Teaching', 2),
    (v_user_id, 'Prácticas Restaurativas', 'ADVANCED', 'Conflict', 3),
    (v_user_id, 'Capacitación Docente', 'ADVANCED', 'Training', 4),
    (v_user_id, 'Diseño Curricular', 'ADVANCED', 'Design', 5),
    (v_user_id, 'Resolución de Conflictos', 'ADVANCED', 'Conflict', 6);

  -- Idiomas
  INSERT INTO languages (profile_id, name, level, is_native, sort_order)
  VALUES
    (v_user_id, 'Inglés', 'Native', true, 1),
    (v_user_id, 'Español', 'B2', false, 2);

  -- Portfolio
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, featured, sort_order, created_at)
  VALUES
    (v_user_id, 'Programa Aulas Empáticas', 'Piloto en 10 escuelas.', 'PROJECT', ARRAY['SEL'], true, 1, '2022-01-01'),
    (v_user_id, 'App Emotion Check-in', 'App móvil para adolescentes.', 'PROJECT', ARRAY['Tech'], true, 2, '2021-01-01'),
    (v_user_id, 'Simposio Bienestar Docente', 'Evento virtual.', 'PROJECT', ARRAY['Wellness'], true, 3, '2020-01-01'),
    (v_user_id, 'Blog sobre crianza', 'Artículos mensuales.', 'COLLABORATION', ARRAY['Writing'], 4),
    (v_user_id, 'Consultor ONGs', 'Asesoramiento.', 'COLLABORATION', ARRAY['NGO'], 5),
    (v_user_id, 'Orador TEDx', 'Conferencia sobre empatía.', 'COLLABORATION', ARRAY['Speaking'], 6);

  -- Certificaciones
  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, credential_url, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'SEL Specialist', 'CASEL', '2020-06-01', 'CASEL-2020', 'https://casel.org/verify', true, 7)
  RETURNING id INTO v_cert_1;

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, credential_url, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'EQ Coach', 'EQ-i 2.0', '2019-03-15', 'EQI-2019', 'https://eqi.org/verify', true, 8)
  RETURNING id INTO v_cert_2;

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'Restorative Practices', 'IIRP', '2018-09-10', 'IIRP-2018', true, 9)
  RETURNING id INTO v_cert_3;

  -- Stamps
  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at)
  VALUES
    (v_user_id, 'EMAIL', 'VERIFIED', '{"email":"james.wilson@iseih.edu"}'::jsonb, 'Admin', NOW()),
    (v_user_id, 'EDUCATION', 'VERIFIED', '{"degree":"M.A."}'::jsonb, 'Admin', NOW()),
    (v_user_id, 'EMPLOYMENT', 'VERIFIED', '{"company":"ISEIH"}'::jsonb, 'Admin', NOW()),
    (v_user_id, 'LANGUAGE', 'VERIFIED', '{"languages":["Inglés","Español"]}'::jsonb, 'Admin', NOW()),
    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_1::text, 'CERTIFICATION', '{"title":"SEL"}'::jsonb, 'Admin', NOW()),
    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_2::text, 'CERTIFICATION', '{"title":"EQ"}'::jsonb, 'Admin', NOW()),
    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_3::text, 'CERTIFICATION', '{"title":"RP"}'::jsonb, 'Admin', NOW());

  -- Reactivar trigger
  ALTER TABLE auth.users ENABLE TRIGGER ALL;

  RAISE NOTICE '✅ Trigger reactivado';
  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════';
  RAISE NOTICE '✅ JAMES WILSON CREADO';
  RAISE NOTICE '══════════════════════════════════════';
  RAISE NOTICE 'Email: james.wilson@iseih.edu';
  RAISE NOTICE 'Password: TempPassword123!';
  RAISE NOTICE 'ID: %', v_user_id;

END $$;
