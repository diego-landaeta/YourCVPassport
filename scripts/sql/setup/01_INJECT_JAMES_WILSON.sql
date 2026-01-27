-- ============================================================================
-- PROFESIONAL 1: JAMES WILSON
-- Tutor de Educación Emocional
-- ============================================================================
-- Ubicación: Miami, FL, USA
-- Email: james.wilson@iseih.edu
-- Teléfono: +1 305 555 0106
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
  v_profile_id UUID;
BEGIN
  RAISE NOTICE '============================================';
  RAISE NOTICE '👤 CREANDO PERFIL: JAMES WILSON';
  RAISE NOTICE '============================================';

  -- ========================================================================
  -- 1. CREAR USUARIO EN AUTH (si no existe)
  -- ========================================================================

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
      jsonb_build_object(
        'full_name', 'James Wilson',
        'avatar_url', null
      ),
      'authenticated',
      'authenticated'
    )
    RETURNING id INTO v_user_id;

    RAISE NOTICE '✅ Usuario creado en auth.users: %', v_user_id;
  ELSE
    RAISE NOTICE '⚠️  Usuario ya existe: %', v_user_id;
  END IF;

  v_profile_id := v_user_id;

  -- ========================================================================
  -- 2. CREAR PERFIL PRINCIPAL
  -- ========================================================================

  INSERT INTO profiles (
    id,
    full_name,
    email,
    headline,
    title,
    summary,
    location,
    country_code,
    phone,
    linkedin_url,
    github_url,
    portfolio_url,
    slug,
    template,
    template_color,
    role,
    plan,
    show_verified_credentials,
    show_connect_links,
    show_qr_code,
    show_availability_badge,
    availability,
    job_seeking_status,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'James Wilson',
    'james.wilson@iseih.edu',
    'Tutor de Educación Emocional',
    'Tutor de Educación Emocional',
    'James se dedica a enseñar habilidades socioemocionales a educadores y padres. Con 9 años de experiencia, ha desarrollado programas prácticos que ayudan a niños y adolescentes a desarrollar inteligencia emocional. Su enfoque es directo, basado en evidencia y fácil de implementar.',
    'Miami, FL, USA',
    'US',
    '+1 305 555 0106',
    null,
    null,
    null,
    'james-wilson-educacion-emocional',
    'professional-blue',
    '#2563eb',
    'professional',
    'pro',
    true,
    true,
    true,
    false,
    'Disponible para consultoría',
    'OPEN',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    headline = EXCLUDED.headline,
    summary = EXCLUDED.summary,
    updated_at = NOW();

  RAISE NOTICE '✅ Perfil principal creado';

  -- ========================================================================
  -- 3. EXPERIENCIAS LABORALES (4 experiencias)
  -- ========================================================================

  -- Experiencia 1: Tutor de Educación Emocional (Actual)
  INSERT INTO experiences (
    profile_id,
    company_name,
    position,
    start_date,
    end_date,
    is_current,
    description,
    location,
    employment_type,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Tutor de Educación Emocional',
    '2023-01-01',
    NULL,
    true,
    'Docencia sobre desarrollo de la inteligencia emocional en el aula y estrategias de regulación para educadores.',
    'Miami, FL, USA',
    'FULL_TIME',
    1,
    NOW(),
    NOW()
  );

  -- Experiencia 2: Desarrollador de Currículos
  INSERT INTO experiences (
    profile_id,
    company_name,
    position,
    start_date,
    end_date,
    is_current,
    description,
    location,
    employment_type,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'SEL Solutions',
    'Desarrollador de Currículos',
    '2020-01-01',
    '2023-12-31',
    false,
    'Creación de materiales didácticos y guías para la implementación de aprendizaje socioemocional en escuelas.',
    'Remote',
    'FULL_TIME',
    2,
    NOW(),
    NOW()
  );

  -- Experiencia 3: Formador Independiente
  INSERT INTO experiences (
    profile_id,
    company_name,
    position,
    start_date,
    end_date,
    is_current,
    description,
    location,
    employment_type,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'EQ Training',
    'Formador Independiente',
    '2019-01-01',
    '2023-12-31',
    false,
    'Talleres corporativos y educativos sobre empatía, comunicación y manejo del estrés.',
    'Remote',
    'FREELANCE',
    3,
    NOW(),
    NOW()
  );

  -- Experiencia 4: Coordinador SEL
  INSERT INTO experiences (
    profile_id,
    company_name,
    position,
    start_date,
    end_date,
    is_current,
    description,
    location,
    employment_type,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'Florida Public Schools',
    'Coordinador SEL',
    '2015-01-01',
    '2019-12-31',
    false,
    'Implementación distrital de programas de aprendizaje socioemocional y capacitación docente.',
    'Miami, FL, USA',
    'FULL_TIME',
    4,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ 4 experiencias laborales creadas';

  -- ========================================================================
  -- 4. FORMACIÓN ACADÉMICA (2 títulos)
  -- ========================================================================

  -- Educación 1: M.A. en Educación Socioemocional
  INSERT INTO education (
    profile_id,
    institution_name,
    degree,
    field_of_study,
    start_date,
    end_date,
    is_current,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'Lesley University',
    'M.A.',
    'Educación Socioemocional',
    '2013-09-01',
    '2015-06-30',
    false,
    1,
    NOW(),
    NOW()
  );

  -- Educación 2: B.S. en Psicología Educativa
  INSERT INTO education (
    profile_id,
    institution_name,
    degree,
    field_of_study,
    start_date,
    end_date,
    is_current,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'University of Florida',
    'B.S.',
    'Psicología Educativa',
    '2009-09-01',
    '2011-06-30',
    false,
    2,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ 2 títulos académicos creados';

  -- ========================================================================
  -- 5. HABILIDADES (6 habilidades)
  -- ========================================================================

  INSERT INTO skills (profile_id, name, level, category, sort_order, created_at, updated_at)
  VALUES
    (v_profile_id, 'Inteligencia Emocional', 'EXPERT', 'Social-Emotional Learning', 1, NOW(), NOW()),
    (v_profile_id, 'Aprendizaje Socioemocional (SEL)', 'EXPERT', 'Teaching', 2, NOW(), NOW()),
    (v_profile_id, 'Prácticas Restaurativas', 'ADVANCED', 'Conflict Resolution', 3, NOW(), NOW()),
    (v_profile_id, 'Capacitación Docente', 'ADVANCED', 'Professional Development', 4, NOW(), NOW()),
    (v_profile_id, 'Diseño Curricular', 'ADVANCED', 'Curriculum Design', 5, NOW(), NOW()),
    (v_profile_id, 'Resolución de Conflictos', 'ADVANCED', 'Conflict Resolution', 6, NOW(), NOW());

  RAISE NOTICE '✅ 6 habilidades creadas';

  -- ========================================================================
  -- 6. IDIOMAS (2 idiomas)
  -- ========================================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order, created_at, updated_at)
  VALUES
    (v_profile_id, 'Inglés', 'NATIVE', true, 1, NOW(), NOW()),
    (v_profile_id, 'Español', 'B2', false, 2, NOW(), NOW());

  RAISE NOTICE '✅ 2 idiomas creados';

  -- ========================================================================
  -- 7. PROYECTOS DESTACADOS (3 proyectos)
  -- ========================================================================

  -- Proyecto 1: Programa 'Aulas Empáticas'
  INSERT INTO portfolio_items (
    profile_id,
    title,
    description,
    type,
    tags,
    featured,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'Programa ''Aulas Empáticas''',
    'Piloto exitoso en 10 escuelas para reducir el bullying mediante círculos restaurativos.',
    'PROJECT',
    ARRAY['SEL', 'Prácticas Restaurativas', 'Bullying Prevention'],
    true,
    1,
    '2022-01-01',
    NOW()
  );

  -- Proyecto 2: App 'Emotion Check-in'
  INSERT INTO portfolio_items (
    profile_id,
    title,
    description,
    type,
    tags,
    featured,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'App ''Emotion Check-in''',
    'Asesoría pedagógica para una aplicación móvil de registro emocional para adolescentes.',
    'PROJECT',
    ARRAY['Tech Consulting', 'Adolescents', 'Mental Health'],
    true,
    2,
    '2021-01-01',
    NOW()
  );

  -- Proyecto 3: Simposio de Bienestar Docente
  INSERT INTO portfolio_items (
    profile_id,
    title,
    description,
    type,
    tags,
    featured,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'Simposio de Bienestar Docente',
    'Evento virtual enfocado en la salud mental de los profesores durante la pandemia.',
    'PROJECT',
    ARRAY['Teacher Wellness', 'Mental Health', 'Virtual Event'],
    true,
    3,
    '2020-01-01',
    NOW()
  );

  RAISE NOTICE '✅ 3 proyectos destacados creados';

  -- ========================================================================
  -- 8. COLABORACIONES (3 colaboraciones)
  -- ========================================================================

  -- Colaboración 1: Blog
  INSERT INTO portfolio_items (
    profile_id,
    title,
    description,
    type,
    tags,
    featured,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'Autor de blog sobre crianza e inteligencia emocional',
    'Artículos mensuales sobre desarrollo emocional infantil y familiar.',
    'COLLABORATION',
    ARRAY['Writing', 'Parenting', 'Emotional Intelligence'],
    false,
    4,
    NOW(),
    NOW()
  );

  -- Colaboración 2: ONGs
  INSERT INTO portfolio_items (
    profile_id,
    title,
    description,
    type,
    tags,
    featured,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'Consultor para ONGs de educación',
    'Asesoramiento en programas de educación emocional para organizaciones sin fines de lucro.',
    'COLLABORATION',
    ARRAY['NGO', 'Consulting', 'Education'],
    false,
    5,
    NOW(),
    NOW()
  );

  -- Colaboración 3: TEDx
  INSERT INTO portfolio_items (
    profile_id,
    title,
    description,
    type,
    tags,
    featured,
    sort_order,
    created_at,
    updated_at
  ) VALUES (
    v_profile_id,
    'Orador TEDx sobre empatía en la educación',
    'Conferencia sobre la importancia de la empatía en el sistema educativo moderno.',
    'COLLABORATION',
    ARRAY['Public Speaking', 'TEDx', 'Empathy'],
    false,
    6,
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ 3 colaboraciones creadas';

  -- ========================================================================
  -- 9. CERTIFICACIONES/STAMPS (4 certificaciones)
  -- ========================================================================

  -- Stamp 1: Social Emotional Learning Specialist
  INSERT INTO stamps (
    profile_id,
    type,
    status,
    evidence,
    provider,
    verified_at,
    created_at
  ) VALUES (
    v_profile_id,
    'CERTIFICATION',
    'VERIFIED',
    jsonb_build_object(
      'name', 'Social Emotional Learning Specialist',
      'issuer', 'CASEL',
      'issue_date', '2020-06-01',
      'credential_url', 'https://casel.org/verify/james-wilson'
    ),
    'CASEL',
    NOW(),
    NOW()
  );

  -- Stamp 2: Certified Emotional Intelligence Coach
  INSERT INTO stamps (
    profile_id,
    type,
    status,
    evidence,
    provider,
    verified_at,
    created_at
  ) VALUES (
    v_profile_id,
    'CERTIFICATION',
    'VERIFIED',
    jsonb_build_object(
      'name', 'Certified Emotional Intelligence Coach',
      'issuer', 'EQ-i 2.0',
      'issue_date', '2019-03-15',
      'credential_url', 'https://eqi.org/verify/james-wilson'
    ),
    'EQ-i',
    NOW(),
    NOW()
  );

  -- Stamp 3: Restorative Practices Facilitator
  INSERT INTO stamps (
    profile_id,
    type,
    status,
    evidence,
    provider,
    verified_at,
    created_at
  ) VALUES (
    v_profile_id,
    'CERTIFICATION',
    'VERIFIED',
    jsonb_build_object(
      'name', 'Restorative Practices Facilitator',
      'issuer', 'International Institute for Restorative Practices',
      'issue_date', '2018-09-10'
    ),
    'IIRP',
    NOW(),
    NOW()
  );

  -- Stamp 4: Email Verificado
  INSERT INTO stamps (
    profile_id,
    type,
    status,
    evidence,
    provider,
    verified_at,
    created_at
  ) VALUES (
    v_profile_id,
    'EMAIL',
    'VERIFIED',
    jsonb_build_object('email', 'james.wilson@iseih.edu'),
    'ISEIH',
    NOW(),
    NOW()
  );

  RAISE NOTICE '✅ 4 certificaciones/stamps creados';

  -- ========================================================================
  -- RESUMEN FINAL
  -- ========================================================================

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ JAMES WILSON CREADO EXITOSAMENTE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Profile ID: %', v_profile_id;
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
  RAISE NOTICE '- ✅ 4 certificaciones verificadas';
  RAISE NOTICE '';
  RAISE NOTICE 'URL del perfil:';
  RAISE NOTICE '🔗 /cv/james-wilson-educacion-emocional';
  RAISE NOTICE '============================================';

END $$;

-- Verificación final
SELECT
  p.full_name,
  p.headline,
  p.location,
  p.slug,
  COUNT(DISTINCT e.id) as experiencias,
  COUNT(DISTINCT ed.id) as educacion,
  COUNT(DISTINCT s.id) as skills,
  COUNT(DISTINCT l.id) as idiomas,
  COUNT(DISTINCT st.id) as stamps,
  COUNT(DISTINCT po.id) as portfolio_total
FROM profiles p
LEFT JOIN experiences e ON e.profile_id = p.id
LEFT JOIN education ed ON ed.profile_id = p.id
LEFT JOIN skills s ON s.profile_id = p.id
LEFT JOIN languages l ON l.profile_id = p.id
LEFT JOIN stamps st ON st.profile_id = p.id
LEFT JOIN portfolio_items po ON po.profile_id = p.id
WHERE p.email = 'james.wilson@iseih.edu'
GROUP BY p.id, p.full_name, p.headline, p.location, p.slug;
