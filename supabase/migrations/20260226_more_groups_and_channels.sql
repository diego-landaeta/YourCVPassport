-- ============================================================
-- MORE GROUPS & CHANNELS — Feb 26, 2026
-- Adds 5 new groups + 4 new channels with cover images and posts
-- ============================================================

DO $$
DECLARE
  -- Reuse existing demo users as owners
  james   UUID;
  alex_m  UUID;
  priya   UUID;
  laura   UUID;
  david   UUID;
  emily   UUID;
  marcus  UUID;
  sarah   UUID;
  rachel  UUID;
  lisa    UUID;
  jennifer UUID;
  robert  UUID;
  -- Group/channel IDs
  v_g1 UUID; v_g2 UUID; v_g3 UUID; v_g4 UUID; v_g5 UUID;
  v_c1 UUID; v_c2 UUID; v_c3 UUID; v_c4 UUID;
BEGIN
  -- Get existing demo users
  SELECT id INTO james   FROM auth.users WHERE email = 'james.wilson@example.com';
  SELECT id INTO alex_m  FROM auth.users WHERE email = 'alex.martinez@example.com';
  SELECT id INTO priya   FROM auth.users WHERE email = 'priya.sharma@example.com';
  SELECT id INTO laura   FROM auth.users WHERE email = 'laura.demo@yourcvpassport.com';
  SELECT id INTO david   FROM auth.users WHERE email = 'david.chen@example.com';
  SELECT id INTO emily   FROM auth.users WHERE email = 'emily.harper@example.com';
  SELECT id INTO marcus  FROM auth.users WHERE email = 'marcus.williams@example.com';
  SELECT id INTO sarah   FROM auth.users WHERE email = 'sarah.bennett@example.com';
  SELECT id INTO rachel  FROM auth.users WHERE email = 'rachel.stevens@example.com';
  SELECT id INTO lisa    FROM auth.users WHERE email = 'lisa.morrison@example.com';
  SELECT id INTO jennifer FROM auth.users WHERE email = 'jennifer.martinez@example.com';
  SELECT id INTO robert  FROM auth.users WHERE email = 'robert.green@example.com';

  IF james IS NULL OR alex_m IS NULL THEN
    RAISE NOTICE 'Demo users not found — skipping seed';
    RETURN;
  END IF;

  -- ============================================================
  -- NEW GROUPS (5)
  -- ============================================================

  -- Group 1: Marketing & Growth
  INSERT INTO public.groups (owner_id, name, description, is_private, metadata, cover_url, avatar_url)
  VALUES (
    COALESCE(emily, james),
    'Marketing & Growth',
    E'Estrategias de marketing digital, growth hacking, SEO, contenido y branding personal. Comparte campañas, resultados y aprendizajes.',
    false,
    '{"type": "group"}'::jsonb,
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=200&h=200&fit=crop'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_g1;

  -- Group 2: Finanzas Personales & Inversiones
  INSERT INTO public.groups (owner_id, name, description, is_private, metadata, cover_url, avatar_url)
  VALUES (
    COALESCE(marcus, james),
    'Finanzas Personales & Inversiones',
    E'Educación financiera, inversiones, ahorro inteligente y planificación para el futuro. Comparte tips y recursos.',
    false,
    '{"type": "group"}'::jsonb,
    'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=200&h=200&fit=crop'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_g2;

  -- Group 3: Padres & Madres Profesionales
  INSERT INTO public.groups (owner_id, name, description, is_private, metadata, cover_url, avatar_url)
  VALUES (
    COALESCE(rachel, james),
    'Padres & Madres Profesionales',
    E'Un espacio seguro para profesionales que equilibran la paternidad/maternidad con sus carreras. Consejos, apoyo y networking.',
    false,
    '{"type": "group"}'::jsonb,
    'https://images.unsplash.com/photo-1536640712-4d4c36ff0e4e?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=200&h=200&fit=crop'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_g3;

  -- Group 4: Cybersecurity & Privacy
  INSERT INTO public.groups (owner_id, name, description, is_private, metadata, cover_url, avatar_url)
  VALUES (
    COALESCE(david, james),
    'Cybersecurity & Privacy',
    E'Seguridad informática, protección de datos, ethical hacking y mejores prácticas de privacidad digital. Para profesionales y curiosos.',
    false,
    '{"type": "group"}'::jsonb,
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=200&h=200&fit=crop'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_g4;

  -- Group 5: Migración & Trabajar en el Extranjero
  INSERT INTO public.groups (owner_id, name, description, is_private, metadata, cover_url, avatar_url)
  VALUES (
    COALESCE(lisa, james),
    'Migración & Trabajar en el Extranjero',
    E'Para profesionales que han emigrado o planean hacerlo. Visas de trabajo, homologación de títulos, adaptación cultural y oportunidades internacionales.',
    false,
    '{"type": "group"}'::jsonb,
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=200&h=200&fit=crop'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_g5;

  -- ============================================================
  -- NEW CHANNELS (4)
  -- ============================================================

  -- Channel 1: Recursos Gratuitos
  INSERT INTO public.groups (owner_id, name, description, is_private, metadata, cover_url, avatar_url)
  VALUES (
    COALESCE(laura, james),
    'Recursos Gratuitos',
    E'Cursos, herramientas, plantillas y recursos gratuitos para impulsar tu carrera profesional.',
    false,
    '{"type": "channel"}'::jsonb,
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=200&h=200&fit=crop'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_c1;

  -- Channel 2: Noticias del Mercado Laboral
  INSERT INTO public.groups (owner_id, name, description, is_private, metadata, cover_url, avatar_url)
  VALUES (
    COALESCE(james, laura),
    'Noticias del Mercado Laboral',
    E'Las últimas noticias sobre el mercado laboral global: despidos, contrataciones masivas, nuevas regulaciones y tendencias.',
    false,
    '{"type": "channel"}'::jsonb,
    'https://images.unsplash.com/photo-1504711434969-e33886168d5c?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=200&h=200&fit=crop'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_c2;

  -- Channel 3: English Corner
  INSERT INTO public.groups (owner_id, name, description, is_private, metadata, cover_url, avatar_url)
  VALUES (
    COALESCE(priya, james),
    'English Corner',
    E'Daily tips, vocabulary, and exercises to improve your professional English. Perfect for non-native speakers in tech and business.',
    false,
    '{"type": "channel"}'::jsonb,
    'https://images.unsplash.com/photo-1543109740-4bdb38fda756?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=200&h=200&fit=crop'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_c3;

  -- Channel 4: Inspiración & Motivación
  INSERT INTO public.groups (owner_id, name, description, is_private, metadata, cover_url, avatar_url)
  VALUES (
    COALESCE(sarah, james),
    'Inspiración & Motivación',
    E'Frases, historias de éxito, lecciones aprendidas y motivación diaria para impulsar tu carrera y bienestar.',
    false,
    '{"type": "channel"}'::jsonb,
    'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&h=300&fit=crop',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=200&h=200&fit=crop'
  )
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_c4;

  -- ============================================================
  -- ADD MEMBERS + POSTS FOR NEW GROUPS
  -- ============================================================

  -- ── Marketing & Growth ──
  IF v_g1 IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_g1, COALESCE(emily, james), 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO group_members (group_id, user_id, role)
    SELECT v_g1, u, 'member' FROM unnest(ARRAY[james, alex_m, priya, marcus, sarah, rachel, david]) AS u
    WHERE u IS NOT NULL ON CONFLICT DO NOTHING;

    INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
    VALUES
    (COALESCE(emily, james), v_g1,
     E'📊 5 herramientas gratuitas de SEO que todo profesional debería conocer:\n\n1. Google Search Console — el básico indispensable\n2. Ubersuggest — análisis de keywords\n3. AnswerThePublic — ideas de contenido\n4. PageSpeed Insights — rendimiento web\n5. Canva — diseño rápido para redes\n\n¿Cuál es tu favorita? ¿Agregarían alguna?',
     'TEXT', 'PUBLIC', false, 87, 920, NOW() - INTERVAL '2 days'),
    (COALESCE(marcus, james), v_g1,
     E'🎯 El error más común en marketing de contenidos: publicar sin estrategia.\n\nAntes de crear contenido, responde:\n• ¿Para quién es?\n• ¿Qué problema resuelve?\n• ¿Dónde lo distribuyo?\n• ¿Cómo mido el éxito?\n\nContenido sin estrategia = ruido. Contenido con estrategia = resultados.',
     'TEXT', 'PUBLIC', false, 65, 710, NOW() - INTERVAL '4 days'),
    (COALESCE(alex_m, james), v_g1,
     E'💡 Caso de estudio: Cómo una startup Latam pasó de 0 a 10K usuarios en 3 meses.\n\nEstrategia:\n1. Contenido educativo en LinkedIn (2 posts/día)\n2. Partnerships con micro-influencers del nicho\n3. Webinars gratuitos quincenales\n4. Email nurturing con valor real\n\nCosto total: menos de $500 USD. El growth no siempre es caro. 🚀',
     'TEXT', 'PUBLIC', false, 112, 1340, NOW() - INTERVAL '1 day');

    UPDATE public.groups SET member_count = 8, post_count = 3 WHERE id = v_g1;
  END IF;

  -- ── Finanzas Personales & Inversiones ──
  IF v_g2 IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_g2, COALESCE(marcus, james), 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO group_members (group_id, user_id, role)
    SELECT v_g2, u, 'member' FROM unnest(ARRAY[james, emily, priya, laura, david, rachel, lisa]) AS u
    WHERE u IS NOT NULL ON CONFLICT DO NOTHING;

    INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
    VALUES
    (COALESCE(marcus, james), v_g2,
     E'📈 Regla del 50/30/20 actualizada para 2026:\n\n50% necesidades (vivienda, comida, transporte)\n30% deseos (entretenimiento, suscripciones, viajes)\n20% ahorro e inversión\n\nPero ojo: si ganas en USD y vives en Latam, puedes invertir más del 20%. La ventaja del arbitraje geográfico es real.\n\n¿Cómo distribuyen ustedes sus ingresos?',
     'TEXT', 'PUBLIC', false, 94, 1050, NOW() - INTERVAL '3 days'),
    (COALESCE(david, james), v_g2,
     E'🏦 ETFs para principiantes — mi experiencia después de 2 años:\n\n• VOO (S&P 500): rentabilidad promedio 10% anual\n• VTI (Total Stock Market): más diversificado\n• VXUS (Internacional): para no depender solo de USA\n\nEmpecé con $50/mes. Hoy invierto $300/mes. La constancia es más importante que la cantidad.',
     'TEXT', 'PUBLIC', false, 78, 890, NOW() - INTERVAL '5 days');

    UPDATE public.groups SET member_count = 8, post_count = 2 WHERE id = v_g2;
  END IF;

  -- ── Padres & Madres Profesionales ──
  IF v_g3 IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_g3, COALESCE(rachel, james), 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO group_members (group_id, user_id, role)
    SELECT v_g3, u, 'member' FROM unnest(ARRAY[james, emily, priya, laura, sarah, lisa, jennifer]) AS u
    WHERE u IS NOT NULL ON CONFLICT DO NOTHING;

    INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
    VALUES
    (COALESCE(rachel, james), v_g3,
     E'🍼 ¿Cómo manejan el horario de trabajo con niños pequeños?\n\nYo tengo una regla: de 8-12 modo profundo (mientras los niños están en guardería). 12-15 tiempo familiar. 15-18 reuniones y tareas livianas.\n\nNo es perfecto, pero funciona 4 de 5 días. ¡Compartan sus estrategias!',
     'TEXT', 'PUBLIC', false, 156, 1800, NOW() - INTERVAL '1 day'),
    (COALESCE(lisa, james), v_g3,
     E'💪 Recordatorio para padres/madres que trabajan:\n\n• No tienes que ser perfecto/a en todo\n• Pedir ayuda es inteligente, no débil\n• Tu carrera no compite con tu familia\n• Los niños necesitan padres presentes, no perfectos\n\nEstamos haciendo lo mejor que podemos. Y eso es suficiente. ❤️',
     'TEXT', 'PUBLIC', false, 203, 2100, NOW() - INTERVAL '3 days');

    UPDATE public.groups SET member_count = 8, post_count = 2 WHERE id = v_g3;
  END IF;

  -- ── Cybersecurity & Privacy ──
  IF v_g4 IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_g4, COALESCE(david, james), 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO group_members (group_id, user_id, role)
    SELECT v_g4, u, 'member' FROM unnest(ARRAY[james, alex_m, marcus, robert, emily]) AS u
    WHERE u IS NOT NULL ON CONFLICT DO NOTHING;

    INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
    VALUES
    (COALESCE(david, james), v_g4,
     E'🔒 Checklist de seguridad digital personal 2026:\n\n✅ Password manager (Bitwarden, 1Password)\n✅ 2FA en TODAS las cuentas importantes\n✅ VPN para WiFi público\n✅ Revisar permisos de apps cada 3 meses\n✅ Backup encriptado mensual\n✅ No reusar contraseñas NUNCA\n\n¿Cuántos puntos cumples? Se honesto 😄',
     'TEXT', 'PUBLIC', false, 67, 780, NOW() - INTERVAL '2 days'),
    (COALESCE(alex_m, james), v_g4,
     E'⚠️ PSA: Nuevo tipo de phishing usando AI generativa.\n\nEstán usando clones de voz y deepfakes para hacerse pasar por CEOs y pedir transferencias urgentes. Ya hay casos confirmados en Latam.\n\nProtección:\n1. Siempre verificar por un segundo canal\n2. Crear una palabra clave secreta con tu equipo\n3. Desconfiar de la urgencia\n\nCompartan con sus equipos.',
     'TEXT', 'PUBLIC', false, 89, 1200, NOW() - INTERVAL '4 days');

    UPDATE public.groups SET member_count = 6, post_count = 2 WHERE id = v_g4;
  END IF;

  -- ── Migración & Trabajar en el Extranjero ──
  IF v_g5 IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_g5, COALESCE(lisa, james), 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO group_members (group_id, user_id, role)
    SELECT v_g5, u, 'member' FROM unnest(ARRAY[james, priya, laura, sarah, jennifer, robert, alex_m, emily, marcus]) AS u
    WHERE u IS NOT NULL ON CONFLICT DO NOTHING;

    INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
    VALUES
    (COALESCE(lisa, james), v_g5,
     E'🌍 Guía rápida: Visas de trabajo más accesibles en 2026\n\n🇪🇸 España — visa nómada digital (ingresos >€2.520/mes)\n🇵🇹 Portugal — D7 passive income o D8 digital nomad\n🇩🇪 Alemania — Chancenkarte (basada en puntos)\n🇨🇦 Canadá — Express Entry (si tienes IELTS 7+)\n🇦🇪 Emiratos — freelancer visa desde $500\n\n¿Alguien ha tramitado alguna de estas? ¿Cómo fue su experiencia?',
     'TEXT', 'PUBLIC', false, 178, 2300, NOW() - INTERVAL '1 day'),
    (COALESCE(priya, james), v_g5,
     E'🗺️ Mi experiencia migrando de India a España como profesional tech:\n\n• El proceso tardó 4 meses (visa + mudanza)\n• Lo más difícil: homologar mi título universitario\n• Lo más fácil: encontrar comunidad de expats\n• Lo que nadie te dice: la burocracia es lenta pero funciona\n\nEl cambio valió la pena. Si están considerándolo, pregunten lo que quieran.',
     'TEXT', 'PUBLIC', false, 134, 1650, NOW() - INTERVAL '3 days'),
    (COALESCE(jennifer, james), v_g5,
     E'📋 Documentos esenciales que DEBES apostillar antes de emigrar:\n\n1. Título universitario\n2. Certificado de antecedentes penales\n3. Acta de nacimiento\n4. Certificado de matrimonio (si aplica)\n5. Historial laboral / cartas de recomendación\n\nTip: haz copias físicas Y digitales certificadas. Yo perdí un documento y tuve que repetir todo el proceso.',
     'TEXT', 'PUBLIC', false, 95, 1100, NOW() - INTERVAL '5 days');

    UPDATE public.groups SET member_count = 10, post_count = 3 WHERE id = v_g5;
  END IF;

  -- ============================================================
  -- ADD POSTS FOR NEW CHANNELS
  -- ============================================================

  -- ── Recursos Gratuitos ──
  IF v_c1 IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_c1, COALESCE(laura, james), 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO group_members (group_id, user_id, role)
    SELECT v_c1, u, 'member' FROM unnest(ARRAY[james, alex_m, priya, emily, marcus, sarah, rachel, david, lisa, jennifer]) AS u
    WHERE u IS NOT NULL ON CONFLICT DO NOTHING;

    INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
    VALUES
    (COALESCE(laura, james), v_c1,
     E'🎓 Cursos GRATIS con certificado — Febrero 2026\n\n📌 Google — Certificado de Ciberseguridad (Coursera)\n📌 IBM — AI Foundations for Business (edX)\n📌 HarvardX — CS50 Introduction to Computer Science\n📌 Meta — Marketing Analytics Professional Certificate\n📌 Microsoft — Azure Fundamentals (AZ-900)\n\nTodos gratuitos para auditar. Certificados opcionalmente pagos.\n\n¡Guarda este post y compártelo! 📚',
     'TEXT', 'PUBLIC', false, 234, 3200, NOW() - INTERVAL '1 day'),
    (COALESCE(laura, james), v_c1,
     E'🛠️ Herramientas gratuitas para mejorar tu CV:\n\n• YourCVPassport — tu CV profesional online (obvio 😉)\n• Grammarly Free — corrección de textos en inglés\n• Hemingway Editor — simplifica tu escritura\n• Canva — diseño de CVs visuales\n• Jobscan — optimiza tu CV para ATS\n\nRecuerda: un buen CV abre puertas. Un CV optimizado las derriba.',
     'TEXT', 'PUBLIC', false, 167, 2100, NOW() - INTERVAL '3 days'),
    (COALESCE(laura, james), v_c1,
     E'📖 5 libros gratuitos que cambiaron mi carrera (todos en PDF legal):\n\n1. "The Lean Startup" — Eric Ries (summary gratuito oficial)\n2. "Eloquent JavaScript" — Marijn Haverbeke (eloquentjavascript.net)\n3. "The Art of Leadership" — libro abierto de Stanford\n4. "Think Python" — Allen B. Downey (Green Tea Press)\n5. "Data Science from Scratch" — capítulos gratuitos de O''Reilly\n\n¿Conocen otros? Compartan en comentarios 👇',
     'TEXT', 'PUBLIC', false, 189, 2500, NOW() - INTERVAL '5 days');

    UPDATE public.groups SET member_count = 11, post_count = 3 WHERE id = v_c1;
  END IF;

  -- ── Noticias del Mercado Laboral ──
  IF v_c2 IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_c2, COALESCE(james, laura), 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO group_members (group_id, user_id, role)
    SELECT v_c2, u, 'member' FROM unnest(ARRAY[alex_m, priya, laura, emily, marcus, sarah, david, rachel]) AS u
    WHERE u IS NOT NULL ON CONFLICT DO NOTHING;

    INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
    VALUES
    (COALESCE(james, laura), v_c2,
     E'📰 Resumen semanal del mercado laboral — Semana 8, 2026\n\n🟢 Contrataciones:\n• Microsoft anuncia 5,000 posiciones en AI/ML\n• Mercado Libre abre 1,200 vacantes en Latam\n• Salesforce contrata 800 personas en servicios\n\n🔴 Ajustes:\n• Startup fintech reduce 15% de plantilla\n• Empresa de crypto cierra operaciones en 3 países\n\n📊 Tendencia: demanda de AI engineers +40% vs 2025',
     'TEXT', 'PUBLIC', false, 156, 2800, NOW() - INTERVAL '1 day'),
    (COALESCE(james, laura), v_c2,
     E'💰 Informe de salarios tech Latam — Q1 2026:\n\n🇲🇽 México:\n• Senior Dev: $35-55k USD\n• Data Engineer: $40-60k USD\n\n🇧🇷 Brasil:\n• Senior Dev: $30-50k USD\n• Product Manager: $35-55k USD\n\n🇦🇷 Argentina:\n• Senior Dev: $25-45k USD (remoto USD)\n• DevOps: $30-50k USD\n\n🇨🇴 Colombia:\n• Senior Dev: $28-48k USD\n• UX Designer: $22-38k USD\n\nFuente: compilación de Glassdoor, Levels.fyi y encuesta propia.',
     'TEXT', 'PUBLIC', false, 198, 3500, NOW() - INTERVAL '4 days');

    UPDATE public.groups SET member_count = 9, post_count = 2 WHERE id = v_c2;
  END IF;

  -- ── English Corner ──
  IF v_c3 IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_c3, COALESCE(priya, james), 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO group_members (group_id, user_id, role)
    SELECT v_c3, u, 'member' FROM unnest(ARRAY[james, laura, emily, marcus, sarah, lisa, jennifer, rachel, alex_m]) AS u
    WHERE u IS NOT NULL ON CONFLICT DO NOTHING;

    INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
    VALUES
    (COALESCE(priya, james), v_c3,
     E'🗣️ Word of the Day: LEVERAGE\n\nAs a verb: "We can leverage our existing network to find clients."\nAs a noun: "Having bilingual skills gives you leverage in negotiations."\n\nCommon mistake: "I want to leverage my experience" ✅\nNOT: "I want to apalancate my experience" ❌\n\nTry using this word in a sentence in the comments! 👇',
     'TEXT', 'PUBLIC', false, 78, 890, NOW() - INTERVAL '1 day'),
    (COALESCE(priya, james), v_c3,
     E'📧 Professional Email Templates:\n\nFollowing up after an interview:\n\n"Dear [Name],\n\nThank you for taking the time to speak with me about the [Position] role. I enjoyed learning about [specific topic discussed] and am very excited about the opportunity to contribute to [Company].\n\nPlease don''t hesitate to reach out if you need any additional information.\n\nBest regards,\n[Your name]"\n\nSave this for later! 📌',
     'TEXT', 'PUBLIC', false, 145, 1650, NOW() - INTERVAL '3 days'),
    (COALESCE(priya, james), v_c3,
     E'🎯 Common mistakes in job interviews (in English):\n\n❌ "I am very good in teamwork"\n✅ "I excel at teamwork" / "I''m a strong team player"\n\n❌ "I have experience since 5 years"\n✅ "I have 5 years of experience"\n\n❌ "I am interesting in this position"\n✅ "I am interested in this position"\n\n❌ "My actual company is..."\n✅ "My current company is..." (actual ≠ actual in English!)',
     'TEXT', 'PUBLIC', false, 112, 1300, NOW() - INTERVAL '5 days');

    UPDATE public.groups SET member_count = 10, post_count = 3 WHERE id = v_c3;
  END IF;

  -- ── Inspiración & Motivación ──
  IF v_c4 IS NOT NULL THEN
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_c4, COALESCE(sarah, james), 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO group_members (group_id, user_id, role)
    SELECT v_c4, u, 'member' FROM unnest(ARRAY[james, priya, laura, emily, rachel, lisa, jennifer, marcus, alex_m, david]) AS u
    WHERE u IS NOT NULL ON CONFLICT DO NOTHING;

    INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
    VALUES
    (COALESCE(sarah, james), v_c4,
     E'✨ No necesitas tener todo resuelto para empezar.\n\nNo necesitas el CV perfecto para aplicar.\nNo necesitas el portfolio completo para mostrar tu trabajo.\nNo necesitas el inglés perfecto para hablar.\n\nLo que necesitas: empezar. Hoy. Con lo que tienes.\n\nEl mejor momento era ayer. El segundo mejor momento es ahora.',
     'TEXT', 'PUBLIC', false, 267, 3800, NOW() - INTERVAL '1 day'),
    (COALESCE(sarah, james), v_c4,
     E'💎 5 lecciones que aprendí después de ser rechazada en 47 entrevistas:\n\n1. El rechazo no es personal — es compatibilidad\n2. Cada "no" te acerca al "sí" correcto\n3. Pide feedback siempre — es oro puro\n4. Tu valor no lo define un algoritmo ATS\n5. La persistencia vence al talento cuando el talento no persiste\n\nHoy lidero un equipo de 12 personas. No te rindas. 🚀',
     'TEXT', 'PUBLIC', false, 312, 4200, NOW() - INTERVAL '3 days'),
    (COALESCE(sarah, james), v_c4,
     E'🌅 Lunes de gratitud profesional:\n\nAgradezco...\n• El trabajo que tengo (o la búsqueda que me enseña)\n• Las habilidades que he desarrollado\n• Las personas que me han ayudado\n• Los errores de los que aprendí\n• La oportunidad de seguir creciendo\n\n¿Por qué estás agradecido/a hoy? 👇',
     'TEXT', 'PUBLIC', false, 189, 2600, NOW() - INTERVAL '6 days');

    UPDATE public.groups SET member_count = 11, post_count = 3 WHERE id = v_c4;
  END IF;

  RAISE NOTICE '✅ Seed complete: 5 new groups + 4 new channels with posts';

END $$;
