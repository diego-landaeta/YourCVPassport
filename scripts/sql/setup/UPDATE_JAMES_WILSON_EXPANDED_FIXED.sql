-- =====================================================
-- ACTUALIZAR JAMES WILSON - VERSIÓN EXPANDIDA (CORREGIDA)
-- =====================================================
-- Expande el perfil con mucha más información y cambia plantilla
-- Solo usa campos que existen en la tabla profiles
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
  v_cert_id_1 UUID;
  v_cert_id_2 UUID;
  v_cert_id_3 UUID;
  v_cert_id_4 UUID;
  v_cert_id_5 UUID;
BEGIN

  -- Buscar el usuario
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'james.wilson@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;

  RAISE NOTICE '🔄 Actualizando James Wilson con información expandida...';

  -- =====================================================
  -- PASO 1: Actualizar perfil con más información
  -- =====================================================

  UPDATE profiles SET
    full_name = 'James Wilson',
    email = 'james.wilson@iseih.edu',
    headline = 'Especialista en Educación Emocional | Coach Certificado en Inteligencia Emocional | Formador de Educadores',
    title = 'Tutor de Educación Emocional y Especialista en SEL',
    summary = 'Educador apasionado con más de 12 años de experiencia transformando vidas a través del aprendizaje socioemocional (SEL). Me especializo en desarrollar programas innovadores que ayudan a niños, adolescentes y adultos a construir inteligencia emocional, resiliencia y habilidades interpersonales sólidas.

Mi enfoque combina investigación basada en evidencia con estrategias prácticas y accesibles. He trabajado con más de 50 instituciones educativas, capacitando a más de 2,000 docentes y alcanzando indirectamente a más de 15,000 estudiantes.

Como tutor en ISEIH, diseño y facilito cursos sobre regulación emocional, prácticas restaurativas y bienestar docente. También colaboro con ONGs, escribo sobre crianza consciente y asesoro proyectos de tecnología educativa enfocados en salud mental.

Mi misión es crear comunidades educativas más empáticas, inclusivas y emocionalmente inteligentes, donde tanto educadores como estudiantes puedan prosperar.',
    location = 'Miami, FL, USA',
    country_code = 'US',
    slug = 'james-wilson-educacion-emocional',
    template = 'passport',
    template_color = '#0052FF',
    show_verified_credentials = true,
    show_connect_links = true,
    show_qr_code = true,
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Perfil actualizado con plantilla passport';

  -- =====================================================
  -- PASO 2: Limpiar datos anteriores
  -- =====================================================

  DELETE FROM experiences WHERE profile_id = v_user_id;
  DELETE FROM education WHERE profile_id = v_user_id;
  DELETE FROM skills WHERE profile_id = v_user_id;
  DELETE FROM languages WHERE profile_id = v_user_id;
  DELETE FROM portfolio_items WHERE profile_id = v_user_id;
  DELETE FROM stamps WHERE profile_id = v_user_id;

  -- =====================================================
  -- PASO 3: EXPERIENCIAS EXPANDIDAS (8 posiciones)
  -- =====================================================

  INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, location, employment_type, sort_order)
  VALUES
    (v_user_id, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Tutor de Educación Emocional y Especialista en SEL',
     '2023-01-01', NULL, true,
     'Diseño e imparto cursos sobre inteligencia emocional, prácticas restaurativas y bienestar docente para educadores en formación. Desarrollo materiales pedagógicos innovadores y facilito talleres experienciales.

• Diseñé 5 cursos completos sobre SEL que han sido tomados por más de 400 estudiantes
• Implementé metodología de círculos restaurativos en el programa institucional
• Coordino el proyecto de investigación "Impacto del SEL en educadores noveles"
• Mentorizo a 15 estudiantes de posgrado en sus proyectos de tesis sobre educación emocional',
     'Miami, FL, USA', 'FULL_TIME', 1),

    (v_user_id, 'SEL Solutions', 'Desarrollador Senior de Currículos',
     '2020-01-01', '2022-12-31', false,
     'Lideré el equipo de diseño curricular para programas de aprendizaje socioemocional K-12. Creé materiales alineados con el marco CASEL para más de 30 distritos escolares.

• Desarrollé el currículo "Emocionalmente Competentes" adoptado por 15 escuelas
• Coordiné equipo de 8 diseñadores instruccionales
• Facilité 40+ sesiones de desarrollo profesional para 600 docentes
• Aumenté la tasa de implementación de SEL en un 65% en escuelas participantes',
     'Remote', 'FULL_TIME', 2),

    (v_user_id, 'EQ Training Consultancy', 'Formador Independiente y Coach Certificado',
     '2019-01-01', '2023-12-31', false,
     'Ofrecí talleres corporativos y educativos sobre inteligencia emocional, comunicación efectiva y manejo del estrés para organizaciones públicas y privadas.

• Facilité 85+ talleres para más de 1,200 participantes
• Coaching individual a 45 líderes educativos y empresariales
• Desarrollé programa "EQ for Leaders" con 95% de satisfacción
• Clientes incluyen: Amazon, Miami-Dade Schools, United Way',
     'Remote', 'FREELANCE', 3),

    (v_user_id, 'Florida Public Schools District', 'Coordinador SEL y Bienestar Estudiantil',
     '2015-01-01', '2019-12-31', false,
     'Coordiné la implementación distrital de programas de aprendizaje socioemocional para 42 escuelas (K-12). Supervisé la capacitación de docentes y el monitoreo de impacto.

• Implementé programa SEL que alcanzó a 18,000 estudiantes
• Capacité a 450 docentes en competencias socioemocionales
• Reduje incidentes disciplinarios en un 35% en escuelas piloto
• Establecí red de "SEL Champions" con 60 líderes escolares
• Obtuve grant federal de $250,000 para expansión del programa',
     'Miami, FL, USA', 'FULL_TIME', 4),

    (v_user_id, 'Mindful Schools Initiative', 'Facilitador de Mindfulness',
     '2016-06-01', '2019-05-31', false,
     'Facilitador certificado de prácticas de mindfulness para niños y adolescentes. Introduje meditación y técnicas de atención plena en 12 escuelas del sur de Florida.

• Facilité sesiones semanales de mindfulness para 300+ estudiantes
• Capacité a 80 docentes en prácticas contemplativas en el aula
• Diseñé programa "Mindful Moments" de 5 minutos para uso diario
• Medí reducción del 40% en ansiedad auto-reportada por estudiantes',
     'Miami, FL, USA', 'PART_TIME', 5),

    (v_user_id, 'The Collaboration Project', 'Especialista en Resolución de Conflictos',
     '2014-01-01', '2016-12-31', false,
     'Implementé programas de mediación entre pares y prácticas restaurativas en escuelas secundarias. Capacité a estudiantes como mediadores y facilitadores de círculos de paz.

• Formé a 120 estudiantes mediadores en 8 escuelas
• Resolví más de 200 conflictos estudiantiles mediante mediación
• Reduje suspensiones en un 28% en escuelas participantes
• Presenté resultados en conferencia nacional de Justicia Restaurativa',
     'Fort Lauderdale, FL, USA', 'FULL_TIME', 6),

    (v_user_id, 'Boys & Girls Clubs of America', 'Coordinador de Programas Juveniles',
     '2012-06-01', '2014-12-31', false,
     'Coordiné programas after-school enfocados en desarrollo socioemocional para jóvenes de 10-18 años en comunidades vulnerables.

• Supervisé 4 clubes con 250 jóvenes participantes
• Diseñé talleres de habilidades para la vida y liderazgo juvenil
• Implementé programa de mentoría que emparejó a 60 jóvenes con mentores
• Aumenté retención de participantes en un 45%',
     'Miami, FL, USA', 'FULL_TIME', 7),

    (v_user_id, 'Crisis Text Line', 'Consejero Voluntario de Crisis',
     '2017-01-01', '2020-12-31', false,
     'Voluntario certificado brindando apoyo emocional a jóvenes en crisis a través de mensajes de texto. Completé más de 300 horas de servicio voluntario.

• Atendí 200+ conversaciones de crisis con jóvenes
• Especialización en ansiedad, depresión y bullying
• Completé entrenamiento avanzado en prevención de suicidio
• Reconocido como "Outstanding Volunteer 2019"',
     'Remote', 'PART_TIME', 8);

  RAISE NOTICE '✅ 8 experiencias agregadas';

  -- =====================================================
  -- PASO 4: EDUCACIÓN (3 títulos)
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, description, grade, sort_order)
  VALUES
    (v_user_id, 'Lesley University', 'M.A.', 'Educación Socioemocional y Desarrollo Humano', '2013-09-01', '2015-06-30', false,
     'Tesis: "El Impacto de Prácticas Restaurativas en el Clima Escolar en Escuelas Secundarias Urbanas". Investigación cuantitativa con 500 estudiantes que demostró reducción del 42% en suspensiones.

Cursos destacados: Neurociencia del Aprendizaje Emocional, Diseño de Currículos SEL, Liderazgo para el Cambio Educativo.',
     'GPA 3.9/4.0', 1),

    (v_user_id, 'University of Florida', 'B.S.', 'Psicología Educativa', '2009-09-01', '2013-05-30', false,
     'Minor en Desarrollo Infantil. Proyecto final: Programa piloto de mentoría emocional para estudiantes de primer año.

Presidente de la Asociación Estudiantil de Psicología. Beca de Mérito Académico (4 años).',
     'Magna Cum Laude', 2),

    (v_user_id, 'Yale University - Online', 'Certificado Profesional', 'The Science of Well-Being and Positive Psychology', '2018-01-15', '2018-06-30', false,
     'Programa intensivo de 6 meses sobre psicología positiva aplicada, investigación de la felicidad y bienestar, y diseño de intervenciones basadas en evidencia.',
     'Certificate of Distinction', 3);

  RAISE NOTICE '✅ 3 títulos educativos';

  -- =====================================================
  -- PASO 5: HABILIDADES EXPANDIDAS (15 habilidades)
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, category, sort_order)
  VALUES
    -- Core SEL Skills
    (v_user_id, 'Aprendizaje Socioemocional (SEL)', 'EXPERT', 'Social-Emotional Learning', 1),
    (v_user_id, 'Inteligencia Emocional', 'EXPERT', 'Social-Emotional Learning', 2),
    (v_user_id, 'Prácticas Restaurativas', 'EXPERT', 'Conflict Resolution', 3),
    (v_user_id, 'Mindfulness y Meditación', 'ADVANCED', 'Wellness', 4),

    -- Facilitación y Formación
    (v_user_id, 'Capacitación Docente', 'EXPERT', 'Professional Development', 5),
    (v_user_id, 'Diseño Curricular', 'EXPERT', 'Curriculum Design', 6),
    (v_user_id, 'Facilitación de Talleres', 'EXPERT', 'Training & Development', 7),
    (v_user_id, 'Coaching Educativo', 'ADVANCED', 'Coaching & Mentoring', 8),

    -- Resolución y Comunicación
    (v_user_id, 'Resolución de Conflictos', 'EXPERT', 'Conflict Resolution', 9),
    (v_user_id, 'Mediación entre Pares', 'ADVANCED', 'Conflict Resolution', 10),
    (v_user_id, 'Comunicación No Violenta', 'ADVANCED', 'Communication', 11),

    -- Bienestar y Salud Mental
    (v_user_id, 'Prevención de Bullying', 'ADVANCED', 'Student Welfare', 12),
    (v_user_id, 'Trauma-Informed Practices', 'ADVANCED', 'Mental Health', 13),
    (v_user_id, 'Bienestar Docente', 'ADVANCED', 'Teacher Wellness', 14),
    (v_user_id, 'Primeros Auxilios Psicológicos', 'INTERMEDIATE', 'Crisis Intervention', 15);

  RAISE NOTICE '✅ 15 habilidades';

  -- =====================================================
  -- PASO 6: IDIOMAS (3 idiomas)
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order)
  VALUES
    (v_user_id, 'Inglés', 'Native', true, 1),
    (v_user_id, 'Español', 'B2', false, 2),
    (v_user_id, 'Francés', 'A2', false, 3);

  RAISE NOTICE '✅ 3 idiomas';

  -- =====================================================
  -- PASO 7: PORTFOLIO EXPANDIDO (10 proyectos)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, featured, sort_order, created_at)
  VALUES
    (v_user_id, 'Programa "Aulas Empáticas" - Piloto Distrital',
     'Programa piloto implementado en 10 escuelas secundarias para reducir el bullying mediante círculos restaurativos y desarrollo de empatía. Redujo incidentes de acoso en un 52% y mejoró el clima escolar según encuestas pre-post.

Componentes: Formación docente (20 hrs), círculos semanales con estudiantes, mediación entre pares, y participación familiar. Financiado por grant de $180,000.

Resultados publicados en Journal of School Psychology.',
     'PROJECT', 'https://empathicclassrooms.org', ARRAY['SEL', 'Prácticas Restaurativas', 'Bullying Prevention', 'Research'], true, 1, '2022-01-01'),

    (v_user_id, 'App "Emotion Check-in" - Consultoría Pedagógica',
     'Asesoría pedagógica integral para startup EdTech desarrollando aplicación móvil de registro emocional para adolescentes (13-18 años). Diseñé framework de competencias SEL, validé contenido educativo y desarrollé guía para educadores.

La app alcanzó 15,000 usuarios en primer año y obtuvo calificación 4.7/5 en App Store.

Mi rol: Asesor Principal de Contenido SEL (contrato de 8 meses).',
     'PROJECT', 'https://emotioncheck.app', ARRAY['EdTech', 'Adolescents', 'Mental Health', 'App Development'], true, 2, '2021-06-01'),

    (v_user_id, 'Simposio Virtual "Bienestar Docente en Tiempos de Crisis"',
     'Co-organizador y facilitador principal de simposio virtual internacional con 800 educadores de 15 países durante la pandemia COVID-19. Evento de 3 días con 18 talleres sobre autocuidado, manejo del estrés y resiliencia.

Speakers invitados: Dr. Marc Brackett (Yale), Dra. Tina Payne Bryson, y líderes de CASEL.

Evaluación: 96% de participantes reportó mayor claridad sobre estrategias de autocuidado.',
     'PROJECT', 'https://teacherwellnesssummit2020.org', ARRAY['Teacher Wellness', 'Mental Health', 'COVID-19', 'Virtual Event'], true, 3, '2020-11-01'),

    (v_user_id, 'Currículo "SEL en Acción" - Programa K-5',
     'Currículo completo de aprendizaje socioemocional para primaria (Kinder-5to grado) desarrollado para SEL Solutions. Incluye 180 lecciones alineadas con marco CASEL, evaluaciones formativas, y guía para familias.

Adoptado por 22 escuelas en 5 distritos. Incluye versión en español.

Materiales: Guía del maestro (300 páginas), actividades estudiantiles, videos animados, y dashboard de progreso.',
     'PROJECT', 'https://selaction.org', ARRAY['Curriculum Design', 'Elementary Education', 'CASEL Framework'], true, 4, '2021-01-01'),

    (v_user_id, 'Investigación: "Impacto del Mindfulness en Ansiedad Estudiantil"',
     'Estudio cuasi-experimental evaluando el impacto de intervención de mindfulness (8 semanas) en reducción de ansiedad en estudiantes de secundaria (n=156).

Resultados: Reducción significativa en ansiedad (d=0.68) y mejora en regulación emocional. Publicado en Mindfulness Journal (2019).

Presentado en conferencia AERA 2019.',
     'PROJECT', 'https://doi.org/10.1007/mindfulness-2019', ARRAY['Research', 'Mindfulness', 'Student Anxiety', 'Publication'], false, 5, '2019-04-01');

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order)
  VALUES
    (v_user_id, 'Columnista en "Parenting with Purpose" Blog',
     'Autor mensual de artículos sobre crianza consciente, desarrollo emocional infantil y educación en casa. Más de 50 artículos publicados alcanzando 200,000+ lectores.',
     'COLLABORATION', ARRAY['Writing', 'Parenting', 'Emotional Intelligence', 'Blog'], 6),

    (v_user_id, 'Consultor para ONGs de Educación en América Latina',
     'Asesoramiento pro-bono a 4 organizaciones sin fines de lucro en Colombia, Perú y México para implementar programas de educación emocional en comunidades vulnerables. Facilitación virtual de talleres para educadores comunitarios.',
     'COLLABORATION', ARRAY['NGO', 'International', 'Latin America', 'Pro Bono'], 7),

    (v_user_id, 'Speaker TEDx: "Por qué la Empatía es la Habilidad del Siglo XXI"',
     'Conferencia TEDx sobre la importancia de cultivar empatía en el sistema educativo moderno. Alcance: 85,000+ visualizaciones en YouTube. Invitado a replicar charla en 5 eventos educativos adicionales.',
     'COLLABORATION', ARRAY['Public Speaking', 'TEDx', 'Empathy', 'Keynote'], 8),

    (v_user_id, 'Co-autor: "Toolkit de Prácticas Restaurativas para Educadores"',
     'Colaboración con International Institute for Restorative Practices para desarrollar kit de herramientas práctico. Distribuido gratuitamente a 3,000+ educadores. Disponible en inglés y español.',
     'COLLABORATION', ARRAY['Restorative Practices', 'Toolkit', 'Free Resource', 'IIRP'], 9),

    (v_user_id, 'Mentor en Programa "Future SEL Leaders"',
     'Mentor de 6 educadores emergentes en programa de liderazgo SEL de 12 meses. Sesiones mensuales 1:1, observación de práctica y retroalimentación. 100% de mentees reportó transformación significativa en su práctica.',
     'COLLABORATION', ARRAY['Mentoring', 'Leadership Development', 'Emerging Leaders'], 10);

  RAISE NOTICE '✅ 10 proyectos y colaboraciones';

  -- =====================================================
  -- PASO 8: CERTIFICACIONES EXPANDIDAS (5 certificaciones)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, credential_url, description, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'Social Emotional Learning Specialist',
     'CASEL - Collaborative for Academic, Social, and Emotional Learning', '2020-06-01',
     'CASEL-SEL-2020-JW789', 'https://casel.org/verify/CASEL-SEL-2020-JW789',
     'Certificación oficial en diseño, implementación y evaluación de programas de aprendizaje socioemocional basados en el marco CASEL de 5 competencias. Incluye 40 horas de formación teórica y 80 horas de práctica supervisada.',
     true, 11)
  RETURNING id INTO v_cert_id_1;

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, credential_url, description, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'Certified Emotional Intelligence Coach (EQ-i 2.0)',
     'Multi-Health Systems - EQ-i 2.0 Certification', '2019-03-15',
     'EQI-COACH-2019-JW456', 'https://mhs.com/verify/EQI-COACH-2019-JW456',
     'Certificación profesional para administrar, interpretar y utilizar la evaluación EQ-i 2.0 en procesos de coaching individual y grupal. Autorizado para brindar coaching en desarrollo de inteligencia emocional.',
     true, 12)
  RETURNING id INTO v_cert_id_2;

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, description, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'Restorative Practices Facilitator',
     'International Institute for Restorative Practices (IIRP)', '2018-09-10',
     'IIRP-RPF-2018-JW234',
     'Certificación avanzada en facilitación de círculos restaurativos, conferencias formales y prácticas restaurativas informales. Incluye entrenamiento en resolución de conflictos, mediación y construcción de comunidad.',
     true, 13)
  RETURNING id INTO v_cert_id_3;

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, credential_url, description, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'Mindfulness-Based Stress Reduction (MBSR) Teacher',
     'Center for Mindfulness - University of Massachusetts', '2017-05-20',
     'CFM-MBSR-2017-JW891', 'https://umassmed.edu/cfm/verify/JW891',
     'Formación intensiva de 7 días para enseñar el programa MBSR desarrollado por Jon Kabat-Zinn. Incluye práctica personal intensiva de meditación (200+ horas) y supervisión de enseñanza.',
     true, 14)
  RETURNING id INTO v_cert_id_4;

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, credential_id, description, verified, sort_order)
  VALUES
    (v_user_id, 'CERTIFICATION', 'Trauma-Informed Care Practitioner',
     'National Council for Mental Wellbeing', '2021-02-10',
     'NCMW-TIC-2021-JW567',
     'Certificación en prácticas informadas por trauma para entornos educativos. Enfoque en reconocer signos de trauma, crear ambientes seguros y utilizar estrategias de apoyo sensibles al trauma.',
     true, 15)
  RETURNING id INTO v_cert_id_5;

  RAISE NOTICE '✅ 5 certificaciones';

  -- =====================================================
  -- PASO 9: STAMPS DE VERIFICACIÓN (11 stamps)
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at)
  VALUES
    (v_user_id, 'EMAIL', 'VERIFIED',
     '{"email":"james.wilson@iseih.edu","verified_method":"manual_admin","verified_date":"2024-01-15"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'EDUCATION', 'VERIFIED',
     '{"degree":"M.A. en Educación Socioemocional","institution":"Lesley University","graduation_year":"2015"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'EDUCATION', 'VERIFIED',
     '{"degree":"B.S. en Psicología Educativa","institution":"University of Florida","graduation_year":"2013"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'EMPLOYMENT', 'VERIFIED',
     '{"position":"Tutor de Educación Emocional","company":"ISEIH","start_date":"2023-01-01","status":"current"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'EMPLOYMENT', 'VERIFIED',
     '{"position":"Desarrollador Senior de Currículos","company":"SEL Solutions","years":"2020-2022"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'LANGUAGE', 'VERIFIED',
     '{"languages":["Inglés (Native)","Español (B2)","Francés (A2)"]}'::jsonb,
     'ISEIH Admin', NOW());

  -- Stamps de certificaciones
  INSERT INTO stamps (profile_id, type, status, entity_id, entity_type, evidence, provider, verified_at)
  VALUES
    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_1::text, 'CERTIFICATION',
     '{"certification_title":"Social Emotional Learning Specialist","issuer":"CASEL","issue_date":"2020-06-01"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_2::text, 'CERTIFICATION',
     '{"certification_title":"Certified Emotional Intelligence Coach","issuer":"MHS EQ-i 2.0","issue_date":"2019-03-15"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_3::text, 'CERTIFICATION',
     '{"certification_title":"Restorative Practices Facilitator","issuer":"IIRP","issue_date":"2018-09-10"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_4::text, 'CERTIFICATION',
     '{"certification_title":"MBSR Teacher","issuer":"UMass Center for Mindfulness","issue_date":"2017-05-20"}'::jsonb,
     'ISEIH Admin', NOW()),

    (v_user_id, 'CERTIFICATION', 'VERIFIED', v_cert_id_5::text, 'CERTIFICATION',
     '{"certification_title":"Trauma-Informed Care Practitioner","issuer":"National Council","issue_date":"2021-02-10"}'::jsonb,
     'ISEIH Admin', NOW());

  RAISE NOTICE '✅ 11 stamps creados';

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE '✅ JAMES WILSON ACTUALIZADO CON INFORMACIÓN EXPANDIDA';
  RAISE NOTICE '══════════════════════════════════════════════════';
  RAISE NOTICE 'Plantilla cambiada a: passport (azul)';
  RAISE NOTICE 'Contenido expandido:';
  RAISE NOTICE '  • 8 experiencias laborales';
  RAISE NOTICE '  • 3 títulos educativos';
  RAISE NOTICE '  • 15 habilidades';
  RAISE NOTICE '  • 3 idiomas';
  RAISE NOTICE '  • 10 proyectos/colaboraciones';
  RAISE NOTICE '  • 5 certificaciones';
  RAISE NOTICE '  • 11 stamps de verificación';
  RAISE NOTICE '';
  RAISE NOTICE 'URL: /cv/james-wilson-educacion-emocional';
  RAISE NOTICE '';

END $$;

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

SELECT
  p.full_name,
  p.headline,
  p.template,
  p.email,
  p.plan,
  COUNT(DISTINCT e.id) as experiencias,
  COUNT(DISTINCT ed.id) as educacion,
  COUNT(DISTINCT s.id) as skills,
  COUNT(DISTINCT l.id) as idiomas,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type IN ('PROJECT', 'COLLABORATION')) as portfolio,
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
GROUP BY p.id, p.full_name, p.headline, p.template, p.email, p.plan;
