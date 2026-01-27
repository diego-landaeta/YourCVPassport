-- =====================================================
-- COMPLETAR PERFIL DE JAMES WILSON
-- =====================================================
-- INSTRUCCIONES:
-- 1. Primero crea el usuario manualmente en Supabase:
--    - Email: james.wilson@iseih.edu
--    - Password: TempPassword123!
--    - Auto Confirm User: SÍ (marcado)
-- 2. Luego ejecuta este script
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_cert_1 UUID;
  v_cert_2 UUID;
  v_cert_3 UUID;
BEGIN

  -- Buscar el usuario por email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'james.wilson@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado. Primero créalo en Supabase UI: james.wilson@iseih.edu';
  END IF;

  RAISE NOTICE '✅ Usuario encontrado: %', v_user_id;

  -- Actualizar perfil (que el trigger ya creó)
  UPDATE profiles SET
    full_name = 'James Wilson',
    headline = 'Tutor de Educación Emocional',
    title = 'Tutor de Educación Emocional',
    summary = 'James se dedica a enseñar habilidades socioemocionales a educadores y padres. Con 9 años de experiencia, ha desarrollado programas prácticos que ayudan a niños y adolescentes a desarrollar inteligencia emocional.',
    location = 'Miami, FL, USA',
    country_code = 'US',
    slug = 'james-wilson-educacion-emocional',
    template = 'professional-blue',
    template_color = '#2563eb'
  WHERE id = v_user_id;

  -- Limpiar datos anteriores
  DELETE FROM experiences WHERE profile_id = v_user_id;
  DELETE FROM education WHERE profile_id = v_user_id;
  DELETE FROM skills WHERE profile_id = v_user_id;
  DELETE FROM languages WHERE profile_id = v_user_id;
  DELETE FROM portfolio_items WHERE profile_id = v_user_id;
  DELETE FROM stamps WHERE profile_id = v_user_id;

  -- Experiencias
  INSERT INTO experiences (profile_id, company_name, position, start_date, is_current, description, location, employment_type, sort_order)
  VALUES
    (v_user_id, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Tutor de Educación Emocional', '2023-01-01', true, 'Docencia sobre desarrollo de la inteligencia emocional en el aula.', 'Miami, FL, USA', 'FULL_TIME', 1),
    (v_user_id, 'SEL Solutions', 'Desarrollador de Currículos', '2020-01-01', false, 'Creación de materiales didácticos para SEL.', 'Remote', 'FULL_TIME', 2),
    (v_user_id, 'EQ Training', 'Formador Independiente', '2019-01-01', false, 'Talleres sobre empatía.', 'Remote', 'FREELANCE', 3),
    (v_user_id, 'Florida Public Schools', 'Coordinador SEL', '2015-01-01', false, 'Implementación de programas SEL.', 'Miami, FL, USA', 'FULL_TIME', 4);

  -- Educación
  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order)
  VALUES
    (v_user_id, 'Lesley University', 'M.A.', 'Educación Socioemocional', '2013-09-01', '2015-06-30', 1),
    (v_user_id, 'University of Florida', 'B.S.', 'Psicología Educativa', '2009-09-01', '2011-06-30', 2);

  -- Habilidades
  INSERT INTO skills (profile_id, name, level, category, sort_order)
  VALUES
    (v_user_id, 'Inteligencia Emocional', 'EXPERT', 'Social-Emotional Learning', 1),
    (v_user_id, 'Aprendizaje Socioemocional (SEL)', 'EXPERT', 'Teaching', 2),
    (v_user_id, 'Prácticas Restaurativas', 'ADVANCED', 'Conflict Resolution', 3),
    (v_user_id, 'Capacitación Docente', 'ADVANCED', 'Professional Development', 4),
    (v_user_id, 'Diseño Curricular', 'ADVANCED', 'Curriculum Design', 5),
    (v_user_id, 'Resolución de Conflictos', 'ADVANCED', 'Conflict Resolution', 6);

  -- Idiomas
  INSERT INTO languages (profile_id, name, level, is_native, sort_order)
  VALUES
    (v_user_id, 'Inglés', 'Native', true, 1),
    (v_user_id, 'Español', 'B2', false, 2);

  -- Portfolio
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, featured, sort_order, created_at)
  VALUES
    (v_user_id, 'Programa Aulas Empáticas', 'Piloto exitoso en 10 escuelas.', 'PROJECT', ARRAY['SEL', 'Prácticas Restaurativas'], true, 1, '2022-01-01'),
    (v_user_id, 'App Emotion Check-in', 'Asesoría para app móvil.', 'PROJECT', ARRAY['Tech', 'Mental Health'], true, 2, '2021-01-01'),
    (v_user_id, 'Simposio Bienestar Docente', 'Evento virtual.', 'PROJECT', ARRAY['Teacher Wellness'], true, 3, '2020-01-01'),
    (v_user_id, 'Blog sobre crianza', 'Artículos mensuales.', 'COLLABORATION', ARRAY['Writing'], 4),
    (v_user_id, 'Consultor ONGs', 'Asesoramiento.', 'COLLABORATION', ARRAY['NGO'], 5),
    (v_user_id, 'Orador TEDx', 'Conferencia sobre empatía.', 'COLLABORATION', ARRAY['TEDx'], 6);

  -- Certificaciones
  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, credential_url, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'Social Emotional Learning Specialist', 'CASEL', '2020-06-01', 'CASEL-SEL-2020-JW789', 'https://casel.org/verify/CASEL-SEL-2020-JW789', true, 7)
  RETURNING id INTO v_cert_1;

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, credential_url, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'Certified Emotional Intelligence Coach', 'EQ-i 2.0', '2019-03-15', 'EQI-COACH-2019-JW456', 'https://eqi.org/verify/EQI-COACH-2019-JW456', true, 8)
  RETURNING id INTO v_cert_2;

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'Restorative Practices Facilitator', 'IIRP', '2018-09-10', 'IIRP-RPF-2018-JW234', true, 9)
  RETURNING id INTO v_cert_3;

  -- Stamps
  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at)
  VALUES
    (v_user_id, 'EMAIL', 'VERIFIED', '{"email":"james.wilson@iseih.edu"}'::jsonb, 'ISEIH Admin', NOW()),
    (v_user_id, 'EDUCATION', 'VERIFIED', '{"degree":"M.A. Educación Socioemocional"}'::jsonb, 'ISEIH Admin', NOW()),
    (v_user_id, 'EMPLOYMENT', 'VERIFIED', '{"company":"ISEIH"}'::jsonb, 'ISEIH Admin', NOW()),
    (v_user_id, 'LANGUAGE', 'VERIFIED', '{"languages":["Inglés","Español"]}'::jsonb, 'ISEIH Admin', NOW());

  -- Stamps de certificaciones
  INSERT INTO stamps (profile_id, type, status, entity_id, entity_type, evidence, provider, verified_at)
  VALUES
    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_1::text, 'CERTIFICATION', '{"certification_title":"SEL Specialist"}'::jsonb, 'ISEIH Admin', NOW()),
    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_2::text, 'CERTIFICATION', '{"certification_title":"EQ Coach"}'::jsonb, 'ISEIH Admin', NOW()),
    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_3::text, 'CERTIFICATION', '{"certification_title":"Restorative Practices"}'::jsonb, 'ISEIH Admin', NOW());

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE '✅ JAMES WILSON COMPLETADO EXITOSAMENTE';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE 'Email: james.wilson@iseih.edu';
  RAISE NOTICE 'URL: /cv/james-wilson-educacion-emocional';
  RAISE NOTICE '';

END $$;
