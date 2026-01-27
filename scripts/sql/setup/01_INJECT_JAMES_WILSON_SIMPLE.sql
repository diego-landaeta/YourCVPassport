-- =====================================================
-- JAMES WILSON - VERSIÓN SIMPLE (Sin crear en auth.users)
-- =====================================================
-- Esta versión evita el trigger automático
-- Solo crea el perfil directamente
-- =====================================================

DO $$
DECLARE
  v_profile_id UUID := 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'; -- ID fijo para James Wilson
  v_cert_id_1 UUID;
  v_cert_id_2 UUID;
  v_cert_id_3 UUID;
BEGIN

  RAISE NOTICE '🚀 Creando James Wilson...';

  -- =====================================================
  -- PASO 1: Crear/Actualizar PERFIL directamente
  -- =====================================================

  -- Intentar insertar
  INSERT INTO profiles (
    id,
    full_name,
    email,
    headline,
    summary,
    location,
    country_code,
    slug,
    template,
    template_color,
    role,
    plan
  ) VALUES (
    v_profile_id,
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
    'free'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    headline = EXCLUDED.headline,
    summary = EXCLUDED.summary,
    location = EXCLUDED.location,
    updated_at = NOW();

  RAISE NOTICE '✅ Perfil creado';

  -- =====================================================
  -- PASO 2: EXPERIENCIAS
  -- =====================================================

  DELETE FROM experiences WHERE profile_id = v_profile_id;

  INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, location, employment_type, sort_order)
  VALUES
    (v_profile_id, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Tutor de Educación Emocional',
     '2023-01-01', NULL, true, 'Docencia sobre desarrollo de la inteligencia emocional en el aula.',
     'Miami, FL, USA', 'FULL_TIME', 1),
    (v_profile_id, 'SEL Solutions', 'Desarrollador de Currículos',
     '2020-01-01', '2023-12-31', false, 'Creación de materiales didácticos para SEL.',
     'Remote', 'FULL_TIME', 2),
    (v_profile_id, 'EQ Training', 'Formador Independiente',
     '2019-01-01', '2023-12-31', false, 'Talleres sobre empatía y manejo del estrés.',
     'Remote', 'FREELANCE', 3),
    (v_profile_id, 'Florida Public Schools', 'Coordinador SEL',
     '2015-01-01', '2019-12-31', false, 'Implementación distrital de programas SEL.',
     'Miami, FL, USA', 'FULL_TIME', 4);

  RAISE NOTICE '✅ 4 experiencias';

  -- =====================================================
  -- PASO 3: EDUCACIÓN
  -- =====================================================

  DELETE FROM education WHERE profile_id = v_profile_id;

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, sort_order)
  VALUES
    (v_profile_id, 'Lesley University', 'M.A.', 'Educación Socioemocional', '2013-09-01', '2015-06-30', false, 1),
    (v_profile_id, 'University of Florida', 'B.S.', 'Psicología Educativa', '2009-09-01', '2011-06-30', false, 2);

  RAISE NOTICE '✅ 2 títulos';

  -- =====================================================
  -- PASO 4: HABILIDADES
  -- =====================================================

  DELETE FROM skills WHERE profile_id = v_profile_id;

  INSERT INTO skills (profile_id, name, level, category, sort_order)
  VALUES
    (v_profile_id, 'Inteligencia Emocional', 'EXPERT', 'Social-Emotional Learning', 1),
    (v_profile_id, 'Aprendizaje Socioemocional (SEL)', 'EXPERT', 'Teaching', 2),
    (v_profile_id, 'Prácticas Restaurativas', 'ADVANCED', 'Conflict Resolution', 3),
    (v_profile_id, 'Capacitación Docente', 'ADVANCED', 'Professional Development', 4),
    (v_profile_id, 'Diseño Curricular', 'ADVANCED', 'Curriculum Design', 5),
    (v_profile_id, 'Resolución de Conflictos', 'ADVANCED', 'Conflict Resolution', 6);

  RAISE NOTICE '✅ 6 habilidades';

  -- =====================================================
  -- PASO 5: IDIOMAS
  -- =====================================================

  DELETE FROM languages WHERE profile_id = v_profile_id;

  INSERT INTO languages (profile_id, name, level, is_native, sort_order)
  VALUES
    (v_profile_id, 'Inglés', 'NATIVE', true, 1),
    (v_profile_id, 'Español', 'B2', false, 2);

  RAISE NOTICE '✅ 2 idiomas';

  -- =====================================================
  -- PASO 6: PORTFOLIO (Proyectos y Colaboraciones)
  -- =====================================================

  DELETE FROM portfolio_items WHERE profile_id = v_profile_id;

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, featured, sort_order, created_at)
  VALUES
    (v_profile_id, 'Programa Aulas Empáticas',
     'Piloto exitoso en 10 escuelas para reducir el bullying.',
     'PROJECT', ARRAY['SEL', 'Prácticas Restaurativas'], true, 1, '2022-01-01'),
    (v_profile_id, 'App Emotion Check-in',
     'Asesoría para aplicación móvil de registro emocional.',
     'PROJECT', ARRAY['Tech Consulting', 'Mental Health'], true, 2, '2021-01-01'),
    (v_profile_id, 'Simposio de Bienestar Docente',
     'Evento virtual sobre salud mental de profesores.',
     'PROJECT', ARRAY['Teacher Wellness', 'Mental Health'], true, 3, '2020-01-01');

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order)
  VALUES
    (v_profile_id, 'Autor de blog sobre crianza',
     'Artículos mensuales sobre desarrollo emocional.',
     'COLLABORATION', ARRAY['Writing', 'Parenting'], 4),
    (v_profile_id, 'Consultor para ONGs',
     'Asesoramiento en programas de educación emocional.',
     'COLLABORATION', ARRAY['NGO', 'Consulting'], 5),
    (v_profile_id, 'Orador TEDx',
     'Conferencia sobre empatía en la educación.',
     'COLLABORATION', ARRAY['Public Speaking', 'TEDx'], 6);

  -- Certificaciones
  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, credential_url, description, verified, sort_order)
  VALUES
    (v_profile_id, 'CERTIFICATION', 'Social Emotional Learning Specialist',
     'CASEL', '2020-06-01', 'CASEL-SEL-2020-JW789',
     'https://casel.org/verify/CASEL-SEL-2020-JW789',
     'Certificación en aprendizaje socioemocional.', true, 7)
  RETURNING id INTO v_cert_id_1;

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, credential_url, description, verified, sort_order)
  VALUES
    (v_profile_id, 'CERTIFICATION', 'Certified Emotional Intelligence Coach',
     'EQ-i 2.0', '2019-03-15', 'EQI-COACH-2019-JW456',
     'https://eqi.org/verify/EQI-COACH-2019-JW456',
     'Coaching en inteligencia emocional.', true, 8)
  RETURNING id INTO v_cert_id_2;

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, description, verified, sort_order)
  VALUES
    (v_profile_id, 'CERTIFICATION', 'Restorative Practices Facilitator',
     'IIRP', '2018-09-10', 'IIRP-RPF-2018-JW234',
     'Facilitación de círculos restaurativos.', true, 9)
  RETURNING id INTO v_cert_id_3;

  RAISE NOTICE '✅ Portfolio completo';

  -- =====================================================
  -- PASO 7: STAMPS
  -- =====================================================

  DELETE FROM stamps WHERE profile_id = v_profile_id;

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at)
  VALUES
    (v_profile_id, 'EMAIL', 'VERIFIED',
     '{"email":"james.wilson@iseih.edu"}'::jsonb, 'ISEIH Admin', NOW()),
    (v_profile_id, 'EDUCATION', 'VERIFIED',
     '{"degree":"M.A. en Educación Socioemocional"}'::jsonb, 'ISEIH Admin', NOW()),
    (v_profile_id, 'EMPLOYMENT', 'VERIFIED',
     '{"position":"Tutor de Educación Emocional"}'::jsonb, 'ISEIH Admin', NOW()),
    (v_profile_id, 'LANGUAGE', 'VERIFIED',
     '{"languages":["Inglés","Español"]}'::jsonb, 'ISEIH Admin', NOW());

  -- Stamps de certificaciones
  INSERT INTO stamps (profile_id, type, status, entity_id, entity_type, evidence, provider, verified_at)
  VALUES
    (v_profile_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_1::text, 'CERTIFICATION',
     '{"certification_title":"SEL Specialist"}'::jsonb, 'ISEIH Admin', NOW()),
    (v_profile_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_2::text, 'CERTIFICATION',
     '{"certification_title":"EQ Coach"}'::jsonb, 'ISEIH Admin', NOW()),
    (v_profile_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_3::text, 'CERTIFICATION',
     '{"certification_title":"Restorative Practices"}'::jsonb, 'ISEIH Admin', NOW());

  RAISE NOTICE '✅ Stamps creados';

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE '✅ JAMES WILSON CREADO';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE 'ID: %', v_profile_id;
  RAISE NOTICE 'URL: /cv/james-wilson-educacion-emocional';

END $$;

-- Verificar
SELECT
  p.full_name,
  p.headline,
  p.email,
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
WHERE p.id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
GROUP BY p.id, p.full_name, p.headline, p.email;
