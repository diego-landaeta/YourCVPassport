-- ============================================================
-- Enhance Groups & Channels
-- 1. Add distinct cover_url + avatar_url to ALL existing groups/channels
-- 2. Create 4 new groups with covers, members and posts
-- 3. Create 3 new channels with covers, members and posts
-- Safe to re-run (IF NOT EXISTS + ON CONFLICT)
-- ============================================================

-- ════════════════════════════════════════════════════════════════
-- PART 1: Add cover images to groups/channels that are missing them
-- ════════════════════════════════════════════════════════════════

-- Original 3 seed groups (from 20260221) — force update in case slug-based migration missed them
UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=200&q=80'
WHERE name = 'Tutors & Mentors Pro' AND cover_url IS NULL;

UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&q=80'
WHERE name = 'Devs & Conscious Tech' AND cover_url IS NULL;

UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&q=80'
WHERE name LIKE '%Bienestar Hol%' AND cover_url IS NULL;

-- Career Development & Coaching
UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=200&q=80'
WHERE name = 'Career Development & Coaching' AND cover_url IS NULL;

-- Liderazgo & Gestión de Equipos
UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&q=80'
WHERE name = 'Liderazgo & Gestión de Equipos' AND cover_url IS NULL;

-- Remote Work & Digital Nomads (in case the first migration didn't match)
UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=200&q=80'
WHERE name = 'Remote Work & Digital Nomads' AND cover_url IS NULL;

-- Channels from 20260226_more_channels.sql
UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=200&q=80'
WHERE name = 'Tendencias Salariales 2026' AND cover_url IS NULL;

UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&q=80'
WHERE name = 'Data & Analytics' AND cover_url IS NULL;

UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1556761175-4b46a572b786?w=200&q=80'
WHERE name = 'Founders & Emprendedores' AND cover_url IS NULL;

UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1585076641399-5c06d1b3365f?w=200&q=80'
WHERE name = 'Remote First' AND cover_url IS NULL;

UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1581291518633-83b4eef1d2fa?w=200&q=80'
WHERE name = 'Diseño & UX' AND cover_url IS NULL;

UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=200&q=80'
WHERE name = 'Tech Latinoamérica' AND cover_url IS NULL;

-- Original 3 channels (from 20260221) — force update
UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&q=80'
WHERE name LIKE '%Novedades%' AND metadata->>'type' = 'channel' AND cover_url IS NULL;

UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=200&q=80'
WHERE name LIKE '%AI at Work%' AND cover_url IS NULL;

UPDATE public.groups SET
  cover_url  = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&q=80'
WHERE name LIKE '%Oportunidades%' AND cover_url IS NULL;


-- ════════════════════════════════════════════════════════════════
-- PART 2: Create 4 new groups
-- ════════════════════════════════════════════════════════════════

-- ── Group: Women in Tech & Leadership ─────────────────────────
DO $$
DECLARE
  v_gid UUID;
  v_owner UUID;
  v_member UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Women in Tech & Leadership') THEN
    RAISE NOTICE 'Group "Women in Tech & Leadership" already exists — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Amanda Rodriguez' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Amanda Rodriguez not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, metadata, cover_url, avatar_url)
  VALUES (
    v_owner,
    'Women in Tech & Leadership',
    'A community for women in technology and leadership. Career strategies, visibility, mentorship, and honest conversations about the challenges we navigate.',
    'women-in-tech-leadership',
    false,
    '{"type": "group", "seed_enhance": "true"}'::jsonb,
    'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80',
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&q=80'
  ) RETURNING id INTO v_gid;

  FOR v_member IN (
    SELECT id FROM profiles WHERE full_name IN (
      'Emily Harper','Jessica Porter','Sarah Bennett','Angela Roberts',
      'Lisa Morrison','Jennifer Martinez','Rachel Stevens','Linda Zhang',
      'Priya Sharma','Patricia Coleman','Margaret Sullivan','Karen White'
    ) LIMIT 12
  ) LOOP
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_gid, v_member, 'member') ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, comments_count, created_at)
  VALUES
  (v_owner, v_gid,
   E'Welcome to Women in Tech & Leadership 💜\n\nI created this space because I was tired of panels about "women in tech" run by men.\n\nThis group is by us, for us, about the real stuff:\n→ Navigating visibility without performing\n→ Salary negotiation — the gender gap doesn''t close itself\n→ Building your personal board of advisors\n→ Leadership styles that don''t require becoming someone else\n→ Allyship — what it actually looks like vs. what companies put on slides\n\nNo corporate platitudes. Real conversations between professionals who get it.\n\nIntroduce yourself: what''s the biggest professional challenge you''re navigating right now?',
   'TEXT', 'PUBLIC', false, 89, 23, NOW() - INTERVAL '8 days'),

  (v_owner, v_gid,
   E'The salary transparency conversation we need to have\n\nI''ll go first: I make $95,000 as a Marketing Director in a Series B startup, fully remote.\n\nWhen I found out a male colleague in a similar role was making $118,000, I negotiated. Got to $108,000. Progress, but the gap started at hire.\n\nWhat I''ve learned:\n→ Always negotiate the first offer. Always.\n→ Ask for the salary band BEFORE giving your number\n→ "What''s the budget for this role?" is a perfectly professional question\n→ Document your impact in numbers — quarterly, not annually\n\nWho else is willing to share? Transparency is how we close the gap.',
   'TEXT', 'PUBLIC', false, 134, 31, NOW() - INTERVAL '5 days'),

  (v_owner, v_gid,
   E'Event: "Negotiation Lab for Women in Tech"\n\nA 90-minute hands-on session where we practice:\n→ Salary negotiation scripts\n→ How to counter "we don''t have budget"\n→ Promotion conversations with difficult managers\n→ Role-playing with real scenarios from the group\n\nLed by me + two HR directors who''ve been on the other side of the table.\n\nFree. Women and non-binary professionals welcome.',
   'EVENT', 'PUBLIC', false, 67, 18, NOW() - INTERVAL '2 days');

  UPDATE groups SET post_count = 3, member_count = 13 WHERE id = v_gid;
END $$;


-- ── Group: Creativos & Freelancers ────────────────────────────
DO $$
DECLARE
  v_gid UUID;
  v_owner UUID;
  v_member UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Creativos & Freelancers') THEN
    RAISE NOTICE 'Group "Creativos & Freelancers" already exists — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Robert Green' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Robert Green not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, metadata, cover_url, avatar_url)
  VALUES (
    v_owner,
    'Creativos & Freelancers',
    'Para diseñadores, escritores, fotógrafos, videógrafos y creativos freelance. Portfolio, clientes, precios, contratos y la vida independiente.',
    'creativos-freelancers',
    false,
    '{"type": "group", "seed_enhance": "true"}'::jsonb,
    'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&q=80',
    'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=200&q=80'
  ) RETURNING id INTO v_gid;

  FOR v_member IN (
    SELECT id FROM profiles WHERE full_name IN (
      'Emily Harper','Mark Davidson','Michelle Chang','Diana Russell',
      'Karen White','Nicole Taylor','Brian Cooper','Steven Mitchell'
    ) LIMIT 8
  ) LOOP
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_gid, v_member, 'member') ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, comments_count, created_at)
  VALUES
  (v_owner, v_gid,
   E'Creativos & Freelancers — bienvenidos 🎨\n\nLlevo 4 años como freelance y los primeros 2 fueron un desastre porque nadie me enseñó la parte de negocio.\n\nEste grupo es para hablar de lo que no se enseña en la escuela de diseño:\n→ Cómo ponerle precio a tu trabajo (sin subestimarte)\n→ Contratos que te protegen\n→ Clientes problemáticos y cómo filtrarlos\n→ Portfolio que convierte, no solo bonito\n→ Flujo de caja irregular — cómo sobrevivir los meses vacíos\n\nSi eres creativo y trabajas por tu cuenta, este es tu espacio.\n\n¿En qué fase estás? Cuéntanos.',
   'TEXT', 'PUBLIC', false, 72, 19, NOW() - INTERVAL '7 days'),

  (v_owner, v_gid,
   E'La guía definitiva de precios para freelancers creativos\n\nDespués de 200+ proyectos, esto es lo que sé sobre pricing:\n\nNUNCA cobres por hora. Razones:\n→ Penaliza tu eficiencia (cuanto mejor eres, menos cobras)\n→ El cliente se enfoca en el reloj, no en el resultado\n→ No refleja el valor que generas\n\nCobra por proyecto con scope definido:\n→ Branding básico: 2.000–5.000€\n→ Landing page con copy: 1.500–4.000€\n→ Social media kit (10 piezas): 800–2.000€\n→ Vídeo corporativo (60s): 3.000–8.000€\n\nY siempre: 50% upfront. Sin excepciones.\n\n¿Cuáles son vuestras tarifas? Compartamos datos reales.',
   'TEXT', 'PUBLIC', false, 118, 27, NOW() - INTERVAL '4 days'),

  (v_owner, v_gid,
   E'Reto del mes: mejora tu portfolio en 7 días 🏆\n\nUna tarea por día:\n\nDía 1: Elimina los 3 proyectos más débiles\nDía 2: Reescribe un caso de estudio con el formato: Problema → Solución → Resultado\nDía 3: Añade métricas a al menos 2 proyectos\nDía 4: Actualiza tu foto y bio\nDía 5: Pide un testimonial a un cliente reciente\nDía 6: Revisa la velocidad de carga y mobile\nDía 7: Comparte tu portfolio aquí — feedback gratuito del grupo\n\n¿Quién se apunta? Comenten "IN" y lo hacemos juntos.',
   'TEXT', 'PUBLIC', false, 93, 34, NOW() - INTERVAL '1 day');

  UPDATE groups SET post_count = 3, member_count = 9 WHERE id = v_gid;
END $$;


-- ── Group: Educación & Aprendizaje Permanente ──────────────────
DO $$
DECLARE
  v_gid UUID;
  v_owner UUID;
  v_member UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Educación & Aprendizaje Permanente') THEN
    RAISE NOTICE 'Group "Educación & Aprendizaje Permanente" already exists — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Laura Martínez Vidal' LIMIT 1;
  IF v_owner IS NULL THEN
    SELECT id INTO v_owner FROM profiles WHERE full_name LIKE 'Laura M%' LIMIT 1;
  END IF;
  IF v_owner IS NULL THEN RAISE NOTICE 'Laura not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, metadata, cover_url, avatar_url)
  VALUES (
    v_owner,
    'Educación & Aprendizaje Permanente',
    'Para docentes, formadores y curiosos del aprendizaje. Metodologías, herramientas, experiencias de aula y reflexiones sobre cómo enseñamos y aprendemos en 2026.',
    'educacion-aprendizaje',
    false,
    '{"type": "group", "seed_enhance": "true"}'::jsonb,
    'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80',
    'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=200&q=80'
  ) RETURNING id INTO v_gid;

  FOR v_member IN (
    SELECT id FROM profiles WHERE full_name IN (
      'James Wilson','Sarah Bennett','Marta García','Margaret Sullivan',
      'Thomas Rivera','Angela Roberts','Marcus Williams','Jennifer Martinez',
      'Javier López','Mark Davidson'
    ) LIMIT 10
  ) LOOP
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_gid, v_member, 'member') ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, comments_count, created_at)
  VALUES
  (v_owner, v_gid,
   E'Bienvenidos a Educación & Aprendizaje Permanente 📚\n\nCreé este grupo porque creo que la educación es el motor invisible de todo lo demás.\n\nAquí hablamos de:\n→ Metodologías que funcionan (y las que no tanto)\n→ Herramientas digitales para el aula — sin hype, con experiencia\n→ La formación de adultos y aprendizaje a lo largo de la vida\n→ Cómo la IA está cambiando la forma en que enseñamos\n→ El bienestar del docente — porque no se puede dar lo que no se tiene\n\nDocentes, formadores, facilitadores, tutores, coaches educativos: este es vuestro espacio.\n\nPregunta para arrancar: ¿cuál es la mayor frustración que tenéis como educadores hoy?',
   'TEXT', 'PUBLIC', false, 67, 21, NOW() - INTERVAL '6 days'),

  (v_owner, v_gid,
   E'5 herramientas gratuitas que han cambiado mi aula en 2026\n\n1. Notion para estudiantes — organización de proyectos colaborativos. Reemplazó Google Docs.\n2. Excalidraw — pizarra visual en tiempo real. Perfecto para brainstorming grupal.\n3. Anki (flashcards con repetición espaciada) — para vocabulario, fechas, fórmulas.\n4. Loom — los alumnos entregan reflexiones en vídeo de 3 min. Cambia la dinámica.\n5. Claude/ChatGPT como "compañero de estudio" — los estudiantes formulan preguntas y analizan las respuestas críticamente.\n\nLa clave: ninguna herramienta sustituye la relación pedagógica. Pero la potencia.\n\n¿Cuáles usáis vosotros?',
   'TEXT', 'PUBLIC', false, 89, 17, NOW() - INTERVAL '3 days'),

  (v_owner, v_gid,
   E'Taller online: "IA en el aula — usos éticos y prácticos"\n\nTaller de 2 horas sobre cómo integrar herramientas de IA en la enseñanza sin perder el sentido pedagógico.\n\nContenido:\n→ ¿Qué puede hacer la IA por un docente? (y qué no debería)\n→ Diseño de actividades con IA como recurso\n→ Evaluar el trabajo de un alumno que usó IA — criterios reales\n→ Política de uso de IA en el aula: ejemplos que funcionan\n\nGratuito para miembros del grupo. Plazas limitadas.',
   'EVENT', 'PUBLIC', false, 54, 12, NOW() - INTERVAL '1 day');

  UPDATE groups SET post_count = 3, member_count = 11 WHERE id = v_gid;
END $$;


-- ── Group: Mental Health & Wellbeing at Work ──────────────────
DO $$
DECLARE
  v_gid UUID;
  v_owner UUID;
  v_member UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Mental Health & Wellbeing at Work') THEN
    RAISE NOTICE 'Group "Mental Health & Wellbeing at Work" already exists — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Rebecca Anderson' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Rebecca Anderson not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, metadata, cover_url, avatar_url)
  VALUES (
    v_owner,
    'Mental Health & Wellbeing at Work',
    'Honest conversations about mental health in professional environments. Burnout, boundaries, therapy, self-care strategies, and building healthier workplaces.',
    'mental-health-work',
    false,
    '{"type": "group", "seed_enhance": "true"}'::jsonb,
    'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80',
    'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?w=200&q=80'
  ) RETURNING id INTO v_gid;

  FOR v_member IN (
    SELECT id FROM profiles WHERE full_name IN (
      'Jessica Porter','Rachel Stevens','Priya Sharma','Diana Russell',
      'David Chen','Christopher Barnes','Lisa Morrison','Karen White',
      'Linda Zhang','Emily Harper'
    ) LIMIT 10
  ) LOOP
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_gid, v_member, 'member') ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, comments_count, created_at)
  VALUES
  (v_owner, v_gid,
   E'Welcome to Mental Health & Wellbeing at Work 🧠\n\nI created this group because we spend most of our waking hours working — and most workplaces still treat mental health as an HR checkbox rather than a genuine priority.\n\nThis is a safe space to talk about:\n→ Burnout — recognizing it before it arrives, not after\n→ Setting boundaries without guilt\n→ Therapy as a professional tool (not a weakness)\n→ How to build a mentally healthy team culture\n→ The reality of high-performing AND sustainable work\n\nNo toxic positivity. No "just meditate more." Real conversations from real professionals.\n\nWho''s here? Share one thing you''re doing right now to protect your mental health at work.',
   'TEXT', 'PUBLIC', false, 112, 29, NOW() - INTERVAL '9 days'),

  (v_owner, v_gid,
   E'The burnout early warning system I wish I''d had\n\nI burned out hard 2 years ago. Here are the signs I missed:\n\n→ "I''m fine" on repeat — when nobody asked\n→ Sunday dread that starts on Friday evening\n→ Inbox anxiety — the red badge feels like a personal attack\n→ Physical: jaw clenching, insomnia, frequent illness\n→ Cynicism disguised as humor: "this meeting could have been an email" stops being a joke\n→ Doing more, delivering less — effort without output\n\nWhat I do now:\n→ Weekly check-in with myself (5 min journaling: energy, mood, resentment level)\n→ Monthly therapy — non-negotiable\n→ Quarterly "what am I tolerating?" audit\n→ Hard boundary: no Slack after 7pm\n\nPrevention is infinitely cheaper than recovery. I know because I paid the recovery cost.\n\nWhat''s your early warning sign?',
   'TEXT', 'PUBLIC', false, 178, 42, NOW() - INTERVAL '5 days'),

  (v_owner, v_gid,
   E'How to actually say "no" at work without damaging your career\n\nThe myth: saying no makes you look uncommitted.\nThe reality: saying yes to everything is how you become the person who burns out and leaves.\n\nScripts that work:\n\n→ "I can take that on, but I''d need to deprioritize X. Which matters more?"\n→ "I don''t have the bandwidth this week. Can we revisit next sprint?"\n→ "I want to do this well, so I''d rather say no than deliver something mediocre."\n→ "That sounds important. Who else on the team might be a good fit?"\n\nThe secret: every "no" should include a clear alternative or timeline.\n\nManagers worth working for respect honest capacity more than heroic overcommitment.\n\nWhat''s the hardest "no" you''ve had to give at work?',
   'TEXT', 'PUBLIC', false, 156, 38, NOW() - INTERVAL '2 days');

  UPDATE groups SET post_count = 3, member_count = 11 WHERE id = v_gid;
END $$;


-- ════════════════════════════════════════════════════════════════
-- PART 3: Create 3 new channels
-- ════════════════════════════════════════════════════════════════

-- ── Channel: Entrevistas & CV Tips (ES) ──────────────────────
DO $$
DECLARE
  v_ch UUID;
  v_owner UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Entrevistas & CV Tips') THEN
    RAISE NOTICE 'Canal "Entrevistas & CV Tips" already exists — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Sarah Bennett' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Sarah Bennett not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, member_count, post_count, metadata, cover_url, avatar_url)
  VALUES (
    v_owner,
    'Entrevistas & CV Tips',
    'Tips prácticos para entrevistas de trabajo y optimización de CV. Cada semana: preguntas reales de entrevistas, errores comunes y estrategias que funcionan.',
    'entrevistas-cv-tips',
    false, 445, 0,
    '{"type": "channel", "seed_enhance": "true"}'::jsonb,
    'https://images.unsplash.com/photo-1565688534245-05d6b5be184a?w=800&q=80',
    'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=200&q=80'
  ) RETURNING id INTO v_ch;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_ch, v_owner, 'owner') ON CONFLICT DO NOTHING;

  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES
  (v_owner, v_ch,
   E'🎯 Las 5 preguntas de entrevista que más eliminan candidatos en 2026\n\n1. "Cuéntame sobre un fracaso profesional y qué aprendiste."\n→ Error: decir que no has fracasado. Todos lo hemos hecho.\n→ Acierto: ser honesto, mostrar reflexión y cambio de comportamiento.\n\n2. "¿Por qué quieres dejar tu trabajo actual?"\n→ Error: hablar mal de tu empresa o jefe.\n→ Acierto: enfocarte en lo que buscas, no en lo que huyes.\n\n3. "¿Cuál es tu expectativa salarial?"\n→ Error: dar un número sin investigar.\n→ Acierto: "He visto que el rango de mercado para este rol es X–Y. ¿Está alineado con lo que tenéis presupuestado?"\n\n4. "¿Dónde te ves en 3 años?"\n→ Error: decir algo genérico o "en tu puesto."\n→ Acierto: mostrar ambición alineada con la empresa.\n\n5. "¿Tienes alguna pregunta para nosotros?"\n→ Error: decir no.\n→ Acierto: "¿Qué distingue a la persona que tiene éxito en este rol de la que no?"',
   'TEXT', 'PUBLIC', false, 198, 2870, NOW() - INTERVAL '6 days'),

  (v_owner, v_ch,
   E'El error más costoso en tu CV: el resumen genérico\n\nEl 80% de los CVs que reviso empiezan así:\n\n❌ "Profesional con más de X años de experiencia orientado a resultados en el sector tecnológico."\n\nEso no dice nada. No te diferencia. Y el reclutador lo ha leído 40 veces hoy.\n\n✅ Un buen resumen en 2026:\n\n"Diseñadora de producto con 6 años especializándome en B2B SaaS para fintech. Mi mejor trabajo: rediseñar el onboarding de [Empresa], reduciendo el time-to-value de 14 a 3 días. Busco un equipo donde el diseño tenga voz en las decisiones de producto."\n\nEspecífico. Con impacto medible. Con lo que buscas.\n\n¿Queréis que revise vuestro resumen? Dejadlo en comentarios.',
   'TEXT', 'PUBLIC', false, 234, 3450, NOW() - INTERVAL '3 days'),

  (v_owner, v_ch,
   E'¿Cuál es tu mayor miedo en las entrevistas?',
   'POLL', 'PUBLIC', false, 0, 1230,
   NOW() - INTERVAL '1 day');

  -- Fix the poll metadata
  UPDATE feed_posts SET metadata = jsonb_build_object(
    'seed_enhance', 'true',
    'poll', jsonb_build_object(
      'question', '¿Qué parte de una entrevista te genera más ansiedad?',
      'options', jsonb_build_array(
        'La pregunta sobre salario',
        'Hablar de mis debilidades',
        'Preguntas técnicas / case study',
        'La conversación final con el manager'
      ),
      'duration', '1w',
      'expires_at', (NOW() + INTERVAL '7 days')::TEXT
    )
  ) WHERE group_id = v_ch AND content_type = 'POLL';

  UPDATE groups SET post_count = 3 WHERE id = v_ch;
END $$;


-- ── Channel: Productivity & Focus (EN) ──────────────────────
DO $$
DECLARE
  v_ch UUID;
  v_owner UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Productivity & Focus') THEN
    RAISE NOTICE 'Canal "Productivity & Focus" already exists — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Kevin Park' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Kevin Park not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, member_count, post_count, metadata, cover_url, avatar_url)
  VALUES (
    v_owner,
    'Productivity & Focus',
    'Evidence-based productivity strategies. Deep work, time management, cognitive load, habits and systems for professionals who want to work smarter, not harder.',
    'productivity-focus',
    false, 387, 0,
    '{"type": "channel", "seed_enhance": "true"}'::jsonb,
    'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80',
    'https://images.unsplash.com/photo-1507925921958-8a62f3d1a50d?w=200&q=80'
  ) RETURNING id INTO v_ch;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_ch, v_owner, 'owner') ON CONFLICT DO NOTHING;

  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES
  (v_owner, v_ch,
   E'The science of deep work in 2026 — updated\n\nCal Newport wrote Deep Work in 2016. Ten years later, the core principles hold. What''s changed:\n\nWhat works:\n→ Time-blocking: still the most effective single technique\n→ 90-minute focus blocks aligned with ultradian rhythms\n→ "Shutdown ritual" — a defined end to your workday\n→ One creative task per day (not five)\n\nWhat''s new:\n→ AI as a focus tool — delegating shallow tasks to LLMs frees cognitive bandwidth\n→ "Attention residue" research got stronger — task-switching costs 23 min to recover\n→ Phones out of the room (not just silenced) increases focus by 26%\n\nWhat I stopped doing:\n→ Pomodoro — too many interruptions for complex work\n→ To-do lists without time blocks — they generate anxiety, not action\n→ "Inbox zero" as a goal — it''s someone else''s priority queue, not mine\n\nWhat''s your #1 focus strategy?',
   'TEXT', 'PUBLIC', false, 187, 2560, NOW() - INTERVAL '7 days'),

  (v_owner, v_ch,
   E'My actual daily routine (not the idealized version)\n\nPeople love sharing perfect routines. Here''s my real one:\n\n6:30 — Wake up. No phone for 30 min (this one is real and non-negotiable)\n7:00 — Coffee + 15 min reading (book, not news)\n7:30 — Deep work block #1 (most important task of the day)\n9:00 — Break: walk outside\n9:30 — Meetings and communication\n11:30 — Deep work block #2\n13:00 — Lunch away from the screen\n14:00 — Admin, emails, lightweight tasks\n15:30 — Final focus block (if energy allows; skip if not)\n17:00 — Shutdown ritual: review tomorrow, close all tabs, done\n18:00+ — Exercise, cook, read. No Slack.\n\nKey insight: the routine isn''t about optimization. It''s about having defaults so you don''t spend energy deciding what to do next.\n\nWhat does your actual (not ideal) routine look like?',
   'TEXT', 'PUBLIC', false, 156, 2130, NOW() - INTERVAL '4 days'),

  (v_owner, v_ch,
   E'Tool of the month: Sunsama\n\nAfter trying Todoist, Notion, Things 3, TickTick, and Linear for personal task management... I settled on Sunsama.\n\nWhy it works for me:\n→ Daily planning ritual forces you to commit to realistic goals\n→ Time-boxing built-in (not just a list)\n→ Integrates with calendar, Slack, Linear, email\n→ "Focus mode" that shows only the current task\n→ Weekly review with actual data on how you spent your time\n\nWhat it won''t do: make you productive if you don''t have clear priorities. No tool can.\n\nThe best system is the one you actually use consistently.',
   'TEXT', 'PUBLIC', false, 112, 1780, NOW() - INTERVAL '1 day');

  UPDATE groups SET post_count = 3 WHERE id = v_ch;
END $$;


-- ── Channel: Sostenibilidad & Impacto Social (ES) ──────────
DO $$
DECLARE
  v_ch UUID;
  v_owner UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Sostenibilidad & Impacto Social') THEN
    RAISE NOTICE 'Canal "Sostenibilidad & Impacto Social" already exists — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Thomas Rivera' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Thomas Rivera not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, member_count, post_count, metadata, cover_url, avatar_url)
  VALUES (
    v_owner,
    'Sostenibilidad & Impacto Social',
    'Profesionales que trabajan por un mundo mejor: ESG, economía circular, emprendimiento social, ODS y carreras con propósito.',
    'sostenibilidad-impacto',
    false, 298, 0,
    '{"type": "channel", "seed_enhance": "true"}'::jsonb,
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=200&q=80'
  ) RETURNING id INTO v_ch;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_ch, v_owner, 'owner') ON CONFLICT DO NOTHING;

  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES
  (v_owner, v_ch,
   E'Carreras con impacto: dónde trabajar si te importa el planeta\n\nNo todos los trabajos con propósito están en ONGs. En 2026, el sector privado necesita talento ESG urgentemente:\n\n→ Chief Sustainability Officer — las empresas del IBEX 35 ya lo exigen\n→ Analista ESG — fondos de inversión contratando activamente\n→ Diseñador de economía circular — manufactura y retail\n→ Consultor de huella de carbono — obligatorio para CSRD en la UE\n→ Comunicación de impacto — storytelling que no sea greenwashing\n\nEl reto: mucho "purpose-washing" en las ofertas. Cómo distinguir lo real de lo cosmético:\n→ ¿Tiene la empresa un informe ESG público y auditado?\n→ ¿El rol reporta al CEO o está enterrado 4 niveles abajo?\n→ ¿Hay presupuesto real o solo buenas intenciones?\n\nSi trabajas en sostenibilidad, cuéntanos: ¿cómo encontraste tu camino?',
   'TEXT', 'PUBLIC', false, 134, 1890, NOW() - INTERVAL '8 days'),

  (v_owner, v_ch,
   E'Los ODS que más empleo están generando en 2026\n\nAnálisis de ofertas de trabajo vinculadas a los Objetivos de Desarrollo Sostenible:\n\n🥇 ODS 13 (Acción climática) — 34% de las ofertas ESG\n🥈 ODS 7 (Energía asequible y no contaminante) — 22%\n🥉 ODS 12 (Producción y consumo responsables) — 18%\n📊 ODS 3 (Salud y bienestar) — 14%\n📊 ODS 4 (Educación de calidad) — 12%\n\nEl sector energético lidera en volumen. Pero las oportunidades más interesantes están en la intersección: tech + sostenibilidad, finanzas + impacto, datos + medio ambiente.\n\nEl futuro no es elegir entre impacto y carrera. Es ambas cosas.',
   'TEXT', 'PUBLIC', false, 98, 1450, NOW() - INTERVAL '4 days'),

  (v_owner, v_ch,
   E'📅 Mesa redonda: "Del propósito al empleo — cómo construir una carrera en sostenibilidad"\n\n3 profesionales que hicieron la transición:\n→ De consultoría estratégica a CSO de empresa renovable\n→ De marketing digital a comunicación de impacto en ONG\n→ De ingeniería a analista ESG en fondo de inversión\n\nPreguntas reales, sin guión. Trae la tuya.',
   'EVENT', 'PUBLIC', false, 67, 980,
   NOW() - INTERVAL '1 day');

  -- Set event metadata
  UPDATE feed_posts SET metadata = jsonb_build_object(
    'seed_enhance', 'true',
    'event', jsonb_build_object(
      'title', 'Del propósito al empleo — carrera en sostenibilidad',
      'date', TO_CHAR(NOW() + INTERVAL '12 days', 'YYYY-MM-DD'),
      'time', '18:00',
      'location', 'Online — Zoom',
      'link', 'https://yourcvpassport.com/eventos/carrera-sostenibilidad'
    )
  ) WHERE group_id = v_ch AND content_type = 'EVENT';

  UPDATE groups SET post_count = 3 WHERE id = v_ch;
END $$;


-- ════════════════════════════════════════════════════════════════
-- PART 4: Add likes to new content for realism
-- ════════════════════════════════════════════════════════════════

DO $$
DECLARE
  james     CONSTANT UUID := '8d93820f-beb7-4eb8-8a3c-8e7efa6a6665';
  sarah     CONSTANT UUID := 'a2b0d3d3-488f-429a-9b2f-a4e0a78e55a9';
  emily     CONSTANT UUID := 'c9e55b0e-efff-4f43-b0ce-3d99868ce3d8';
  david     CONSTANT UUID := '206de10c-1322-491b-ac79-c4de3886ca0d';
  jennifer  CONSTANT UUID := '0da0dcfa-82dc-43df-a5f8-adaee989c690';
  rachel    CONSTANT UUID := '3f40d45b-ad4e-43a9-a88b-a822a56cc7d3';
  kevin     CONSTANT UUID := '86a7ec23-2fe8-4a60-afe3-45e61e906b54';
  angela    CONSTANT UUID := 'c1889bbe-f828-41dc-83f6-b844f1e74d49';
  jessica   CONSTANT UUID := '55333d11-13c8-43b8-942b-cb1e75d0b812';
  priya     CONSTANT UUID := 'efb2e93a-1ad5-4f0d-a948-daa763d5a2d4';
  daniel    CONSTANT UUID := 'd0961de8-508e-4870-864e-65b833bfafb0';
  marcus    CONSTANT UUID := '8343e9aa-cc89-4273-9386-581883592a67';
  linda     CONSTANT UUID := '8068213e-0e53-48c7-b9f5-ccd631865484';
  laura     CONSTANT UUID := 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';
  javier    CONSTANT UUID := 'a826c47c-0d50-47da-aab3-4dfb71da709d';
  marta     CONSTANT UUID := 'e379dca2-0b33-45b4-864a-ba9204e0ab4b';
BEGIN

  -- Women in Tech & Leadership
  INSERT INTO feed_likes (post_id, user_id, reaction_type)
  SELECT p.id, u.user_id, u.reaction_type
  FROM feed_posts p
  JOIN groups g ON g.id = p.group_id
  CROSS JOIN (VALUES
    (emily,    'CELEBRATE'::text),
    (jessica,  'LOVE'),
    (sarah,    'INSIGHTFUL'),
    (angela,   'CELEBRATE'),
    (rachel,   'LOVE'),
    (jennifer, 'INSIGHTFUL'),
    (linda,    'CELEBRATE'),
    (priya,    'LIKE')
  ) AS u(user_id, reaction_type)
  WHERE g.name = 'Women in Tech & Leadership'
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- Creativos & Freelancers
  INSERT INTO feed_likes (post_id, user_id, reaction_type)
  SELECT p.id, u.user_id, u.reaction_type
  FROM feed_posts p
  JOIN groups g ON g.id = p.group_id
  CROSS JOIN (VALUES
    (emily,   'INSIGHTFUL'::text),
    (kevin,   'LIKE'),
    (daniel,  'SUPPORT'),
    (laura,   'INSIGHTFUL'),
    (javier,  'CELEBRATE'),
    (marta,   'LIKE')
  ) AS u(user_id, reaction_type)
  WHERE g.name = 'Creativos & Freelancers'
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- Educación & Aprendizaje Permanente
  INSERT INTO feed_likes (post_id, user_id, reaction_type)
  SELECT p.id, u.user_id, u.reaction_type
  FROM feed_posts p
  JOIN groups g ON g.id = p.group_id
  CROSS JOIN (VALUES
    (james,    'CELEBRATE'::text),
    (sarah,    'INSIGHTFUL'),
    (marta,    'LOVE'),
    (javier,   'LIKE'),
    (angela,   'INSIGHTFUL'),
    (marcus,   'LIKE'),
    (jennifer, 'CELEBRATE')
  ) AS u(user_id, reaction_type)
  WHERE g.name = 'Educación & Aprendizaje Permanente'
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- Mental Health & Wellbeing at Work
  INSERT INTO feed_likes (post_id, user_id, reaction_type)
  SELECT p.id, u.user_id, u.reaction_type
  FROM feed_posts p
  JOIN groups g ON g.id = p.group_id
  CROSS JOIN (VALUES
    (jessica,  'LOVE'::text),
    (rachel,   'INSIGHTFUL'),
    (priya,    'SUPPORT'),
    (david,    'INSIGHTFUL'),
    (emily,    'LOVE'),
    (linda,    'SUPPORT'),
    (james,    'INSIGHTFUL'),
    (kevin,    'LIKE'),
    (angela,   'INSIGHTFUL')
  ) AS u(user_id, reaction_type)
  WHERE g.name = 'Mental Health & Wellbeing at Work'
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- Fix views_count for new content
  UPDATE feed_posts
  SET views_count = likes_count * (5 + floor(random() * 10)::int)
  WHERE likes_count > 3
    AND (views_count IS NULL OR views_count < likes_count);

  RAISE NOTICE 'Enhancement complete: covers added, 4 new groups + 3 new channels created with content.';

END $$;
