-- ============================================================
-- More Groups & Feed Content
-- Adds 3 new groups + posts + public feed posts
-- Run in Supabase SQL editor after 20260221_create_groups.sql
-- ============================================================

-- ── Group 1: Career Development & Coaching ───────────────────
DO $$
DECLARE
  v_group_id  UUID;
  v_owner     UUID;
  v_member    UUID;
BEGIN
  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Rachel Stevens' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Rachel Stevens not found, skipping'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, is_private, metadata)
  VALUES (
    v_owner,
    'Career Development & Coaching',
    'Strategies, tools and real talk for career growth. Goal setting, coaching, promotions, pivots — all welcome.',
    false, '{}'::jsonb
  ) RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id, role) VALUES (v_group_id, v_owner, 'owner') ON CONFLICT DO NOTHING;

  FOR v_member IN (
    SELECT id FROM profiles
    WHERE full_name IN ('James Wilson','Emily Harper','David Chen','Jennifer Martinez','Sarah Bennett','Michael Thompson','Linda Zhang')
    LIMIT 7
  ) LOOP
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_group_id, v_member, 'member') ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, comments_count, created_at) VALUES

  (v_owner, v_group_id,
   E'Welcome to Career Development & Coaching! \U0001F680\n\nThis is your space to talk about career growth — the real stuff. Not just the wins, but the pivots, the setbacks, the "I have no idea what I''m doing" moments.\n\nI started this group because I kept having the same 1-on-1 conversations with friends and mentees, and realized we all needed a shared space for this. Expect posts about:\n• Goal setting that actually works\n• How to navigate promotions (and rejections)\n• Career pivots — when and how\n• Coaching frameworks you can use today\n\nIntroduce yourself below! What''s the career challenge you''re working through right now?',
   'TEXT', 'PUBLIC', false, 67, 14, NOW() - INTERVAL '6 days'),

  (v_owner, v_group_id,
   E'The "5-Year Plan" trap — and what to do instead\n\nEvery career coach asks: "Where do you see yourself in 5 years?" Honest answer? Most of us don''t know. And that''s okay.\n\nWhat works better:\n\n1. Define your 90-day focus — what one skill, project, or relationship matters most right now?\n2. Identify your non-negotiables — values and conditions you won''t compromise on\n3. Keep a "possibilities list" — roles or paths you''re curious about, without commitment\n4. Review quarterly — the world moves fast; your plan should too\n\nA 5-year plan gives you direction. A 90-day focus gives you traction.\n\nWhat''s your current 90-day career focus?',
   'TEXT', 'PUBLIC', false, 89, 21, NOW() - INTERVAL '4 days'),

  (v_owner, v_group_id,
   E'How to ask for a promotion without it feeling awkward\n\nMost people wait too long. They hope their manager will notice their work. Spoiler: that rarely happens.\n\nA framework that works:\n\nSix weeks before:\n- Document your wins with numbers and impact\n- Identify the gap between your role and the next level\n- Talk to peers who''ve been promoted recently\n\nThe conversation:\n- Open with "I''d love to talk about my growth here"\n- Share impact with specifics\n- Ask: "What would you need to see to support my promotion?"\n\nAfter:\n- Put the criteria in writing\n- Check in monthly on progress\n\nHas anyone successfully navigated this recently? What worked?',
   'TEXT', 'PUBLIC', false, 112, 18, NOW() - INTERVAL '2 days'),

  (v_owner, v_group_id,
   E'Live Session: "Career Pivot Playbook" — Join us!\n\nI''m hosting a live 60-minute session for everyone thinking about switching roles, industries, or career direction.\n\nWe''ll cover:\n• How to assess if a pivot is right for you\n• Transferable skills you''re probably undervaluing\n• How to tell your story in interviews after a pivot\n• Q&A — bring your real situations\n\nDate: ' || TO_CHAR(NOW() + INTERVAL '12 days', 'Mon DD, YYYY') || E'\nTime: 6:00 PM CET / 12:00 PM EST\nFree to join — link in comments\n\nDrop a hand emoji if you''re coming!',
   'EVENT', 'PUBLIC', false, 78, 24, NOW() - INTERVAL '12 hours');

  -- POLL (separate INSERT to include metadata)
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, comments_count, metadata, created_at)
  VALUES (
    (SELECT id FROM profiles WHERE full_name = 'James Wilson' LIMIT 1), v_group_id,
    E'Quick career check-in: what''s your biggest blocker right now?',
    'POLL', 'PUBLIC', false, 44, 6,
    jsonb_build_object('poll', jsonb_build_object(
      'question', 'What''s your biggest career blocker right now?',
      'options', jsonb_build_array('Unclear direction / next steps', 'Lack of time and bandwidth', 'Confidence and self-doubt', 'Not enough mentorship or guidance')
    )),
    NOW() - INTERVAL '1 day'
  );

  UPDATE groups SET post_count = 5, member_count = 8 WHERE id = v_group_id;
END $$;


-- ── Group 2: Liderazgo & Gestión de Equipos ──────────────────
DO $$
DECLARE
  v_group_id  UUID;
  v_owner     UUID;
  v_member    UUID;
BEGIN
  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Marcus Williams' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Marcus Williams not found, skipping'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, is_private, metadata)
  VALUES (
    v_owner,
    'Liderazgo & Gestión de Equipos',
    'Espacio para líderes, managers y coordinadores. Compartimos experiencias, desafíos y estrategias de gestión efectiva.',
    false, '{}'::jsonb
  ) RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id, role) VALUES (v_group_id, v_owner, 'owner') ON CONFLICT DO NOTHING;

  FOR v_member IN (
    SELECT id FROM profiles
    WHERE full_name IN ('Javier López','Marta García','Priya Sharma','Robert Green','Patricia Coleman','Thomas Rivera','Laura Martínez Vidal')
    LIMIT 7
  ) LOOP
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_group_id, v_member, 'member') ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, comments_count, created_at) VALUES

  (v_owner, v_group_id,
   E'Bienvenidos a Liderazgo & Gestión de Equipos\n\nCreé este grupo porque los foros de liderazgo suelen estar llenos de teoría bonita pero poco aplicable.\n\nAquí vamos a hablar de lo real: el equipo que no cumple deadlines, la conversación difícil con un colaborador, el manager que tampoco sabe liderar bien...\n\nEmpiezo yo: ¿cuál fue el mayor error que cometiste al liderar un equipo por primera vez?\n\nYo lideré con micromanagement durante 3 meses hasta que alguien me lo dijo directamente. Fue incómodo pero necesario.',
   'TEXT', 'PUBLIC', false, 58, 19, NOW() - INTERVAL '7 days'),

  (v_owner, v_group_id,
   E'El problema con las reuniones de equipo (y cómo arreglarlo)\n\nEncuesta informal con mis últimos 3 equipos: el 70% considera que la mitad de sus reuniones son innecesarias.\n\nEl problema raíz: reunimos personas para compartir información, cuando deberíamos reunirnos para tomar decisiones.\n\nMi protocolo actual:\n\nAntes:\n→ Agenda con el objetivo (no lista de temas)\n→ Material enviado 24h antes\n→ Cada asistente sabe qué se espera de él\n\nDurante:\n→ No se reportan resultados oralmente — se discuten excepciones\n→ Se salen cuando ya no son necesarios\n\nDespués:\n→ Resumen con decisiones en menos de 24h\n→ Cada acción tiene dueño y fecha\n\nResultado: pasé de 10h semanales a 4h. ¿Qué cambios habéis hecho en vuestras reuniones?',
   'TEXT', 'PUBLIC', false, 134, 27, NOW() - INTERVAL '5 days'),

  (v_owner, v_group_id,
   E'Cómo dar feedback que la gente realmente recibe\n\nEl feedback es el superpoder del liderazgo. Y el más difícil de ejercer bien.\n\nError más común: dar feedback sobre la persona, no sobre el comportamiento.\n\nMal: "Eres desorganizado"\nBien: "En las últimas dos entregas, los documentos llegaron sin la sección de resumen ejecutivo. ¿Qué pasó?"\n\nEl modelo que uso:\n\nSituación → qué observé específicamente\nImpacto → qué consecuencia tuvo\nPregunta → qué ocurrió desde su perspectiva\n\nLa pregunta es clave. A veces hay contexto que no tienes.\n\n¿Cuál es vuestra mayor dificultad al dar feedback?',
   'TEXT', 'PUBLIC', false, 97, 22, NOW() - INTERVAL '3 days'),

  (v_owner, v_group_id,
   E'Sesión grupal: "Conversaciones difíciles en el trabajo"\n\nNos reunimos para practicar conversaciones que todos evitamos:\n• Hablar de rendimiento bajo con un colaborador\n• Dar malas noticias\n• Manejar conflictos entre miembros del equipo\n• Decirle "no" a tu propio manager\n\nFecha: ' || TO_CHAR(NOW() + INTERVAL '14 days', 'DD de Mon, YYYY') || E'\nHora: 18:00 CET\nFormato: cases reales + role-playing + discusión\n\n¿Os apuntáis? Comentad con el tipo de conversación que más queréis practicar.',
   'EVENT', 'PUBLIC', false, 53, 17, NOW() - INTERVAL '6 hours');

  -- POLL (separate INSERT to include metadata)
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, comments_count, metadata, created_at)
  VALUES (
    v_owner, v_group_id,
    E'¿Cuál es el mayor desafío en tu rol de liderazgo actualmente?',
    'POLL', 'PUBLIC', false, 61, 8,
    jsonb_build_object('poll', jsonb_build_object(
      'question', '¿Cuál es tu mayor desafío como líder ahora mismo?',
      'options', jsonb_build_array('Dar feedback difícil', 'Gestionar bajo rendimiento', 'Alinear expectativas con superiores', 'Mantener la motivación del equipo')
    )),
    NOW() - INTERVAL '1 day'
  );

  UPDATE groups SET post_count = 5, member_count = 8 WHERE id = v_group_id;
END $$;


-- ── Group 3: Remote Work & Digital Nomads ────────────────────
DO $$
DECLARE
  v_group_id  UUID;
  v_owner     UUID;
  v_member    UUID;
BEGIN
  SELECT id INTO v_owner FROM profiles WHERE full_name = 'David Chen' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'David Chen not found, skipping'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, is_private, metadata)
  VALUES (
    v_owner,
    'Remote Work & Digital Nomads',
    'For professionals working remotely — from home offices to co-working spaces around the world. Tools, routines, async communication and work-life balance.',
    false, '{}'::jsonb
  ) RETURNING id INTO v_group_id;

  INSERT INTO group_members (group_id, user_id, role) VALUES (v_group_id, v_owner, 'owner') ON CONFLICT DO NOTHING;

  FOR v_member IN (
    SELECT id FROM profiles
    WHERE full_name IN ('Alex Martinez','Emily Harper','Kevin Park','Angela Roberts','Christopher Barnes','Elizabeth Morgan','Steven Mitchell')
    LIMIT 7
  ) LOOP
    INSERT INTO group_members (group_id, user_id, role) VALUES (v_group_id, v_member, 'member') ON CONFLICT DO NOTHING;
  END LOOP;

  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, comments_count, created_at) VALUES

  (v_owner, v_group_id,
   E'Welcome to Remote Work & Digital Nomads!\n\nI''ve been working remotely for 6 years — from San Francisco, Bali, Lisbon, and currently from a co-working space in Mexico City.\n\nThis group is for everyone navigating the remote life: the freedom, the isolation, the blurry work-life lines, the incredible productivity, the Zoom fatigue.\n\nCome with your setups, struggles, favorite tools, and honest takes. No corporate fluff.\n\nTo kick things off: where are you working from right now, and what''s one thing about your remote setup that''s made the biggest difference?',
   'TEXT', 'PUBLIC', false, 73, 22, NOW() - INTERVAL '8 days'),

  (v_owner, v_group_id,
   E'My remote work setup after 6 years of iteration\n\nPeople ask me constantly what gear I use. The honest list — what actually made a difference:\n\nNon-negotiables:\n• External monitor (even a cheap 24" one) — game changer for focus\n• Mechanical keyboard — sounds dramatic but reduces RSI significantly\n• A dedicated workspace, even if it''s just a corner\n• Good headphones with ANC — for blocking noise, not music\n\nThe software layer:\n• Notion for personal knowledge management\n• Loom for async video updates (replaces 30% of my meetings)\n• Cron calendar — helps me time-block properly\n• 1Password — non-negotiable on public WiFi\n\nThe underrated one: a plant in view. Greenery reduces cognitive fatigue. I know it sounds silly.\n\nWhat''s the one thing in your remote setup you''d never give up?',
   'TEXT', 'PUBLIC', false, 156, 34, NOW() - INTERVAL '6 days'),

  (v_owner, v_group_id,
   E'Async communication is a skill — and most remote teams are bad at it\n\nBeing remote doesn''t mean you''re good at async. Most people just do synchronous work at different times and call it remote.\n\nActual async means:\n\nWriting for the reader, not the writer:\n→ Don''t send "do you have a minute?" — just ask the actual question\n→ Include context: who needs to know, why it matters, what decision is needed\n→ Specify response deadline\n\nUsing the right medium:\n→ Quick yes/no → Slack/Teams\n→ Complex update → Loom video or written doc\n→ Sensitive feedback → sync call, never async\n\nDefaulting to over-communication:\n→ Your teammates can''t see your face — they need more info than you think\n→ Document decisions publicly, even small ones\n\nThe teams that thrive remotely write well and respect each other''s time. It''s a culture, not a tool.\n\nWhat''s your biggest async challenge?',
   'TEXT', 'PUBLIC', false, 118, 29, NOW() - INTERVAL '4 days'),

  (v_owner, v_group_id,
   E'Virtual Coffee & Co-work Session\n\nSometimes you just need to work alongside other humans. Join us for a low-key 2-hour virtual co-working session.\n\nHow it works:\n• Hop in at any point in the 2 hours\n• Camera optional, mics off while working\n• 15-min casual chat at the start\n• Optional share-out at the end: what did you get done?\n\nDate: ' || TO_CHAR(NOW() + INTERVAL '10 days', 'Mon DD, YYYY') || E'\nTime: 10:00 AM CET / 9:00 AM GMT\nLink in comments\n\nBringing coffee — drop yours below!',
   'EVENT', 'PUBLIC', false, 44, 19, NOW() - INTERVAL '3 hours');

  -- POLL (separate INSERT to include metadata)
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, comments_count, metadata, created_at)
  VALUES (
    (SELECT id FROM profiles WHERE full_name = 'Emily Harper' LIMIT 1), v_group_id,
    E'What''s your current remote work situation?',
    'POLL', 'PUBLIC', false, 82, 11,
    jsonb_build_object('poll', jsonb_build_object(
      'question', 'What''s your current remote work setup?',
      'options', jsonb_build_array('Fully remote, same time zone as team', 'Fully remote, distributed globally', 'Hybrid (part office, part home)', 'Digital nomad — I move regularly')
    )),
    NOW() - INTERVAL '2 days'
  );

  UPDATE groups SET post_count = 5, member_count = 8 WHERE id = v_group_id;
END $$;


-- ── Public Feed Posts (no group) ─────────────────────────────
DO $$
DECLARE v_author UUID;
BEGIN

  -- ACHIEVEMENT 1
  SELECT id INTO v_author FROM profiles WHERE full_name = 'Jennifer Martinez' LIMIT 1;
  IF v_author IS NOT NULL THEN
    INSERT INTO feed_posts (author_id, content, content_type, achievement_type, visibility, is_hidden, likes_count, comments_count, created_at)
    VALUES (v_author,
      E'Just passed the PMP certification exam on my first try!\n\nHonestly didn''t think I''d make it — I had 3 weeks to prepare while managing two active projects at work.\n\nWhat helped:\n→ Rita Mulcahy''s book (non-negotiable)\n→ Joseph Phillips'' Udemy course\n→ 200 practice questions per day in the last week\n→ My team covering for me during study leave — thank you\n\nIf you''re considering it: just start. The certification is hard but the frameworks are genuinely useful in daily work.\n\nOn to the next one. What certifications are you pursuing this year?',
      'ACHIEVEMENT', 'CERTIFICATION', 'PUBLIC', false, 234, 41, NOW() - INTERVAL '3 days');
  END IF;

  -- ACHIEVEMENT 2
  SELECT id INTO v_author FROM profiles WHERE full_name = 'Steven Mitchell' LIMIT 1;
  IF v_author IS NOT NULL THEN
    INSERT INTO feed_posts (author_id, content, content_type, achievement_type, visibility, is_hidden, likes_count, comments_count, created_at)
    VALUES (v_author,
      E'After 14 months of work, our product just hit 10,000 active users.\n\nWhen we launched, we had 12. I remember stressing about getting to 100.\n\nWhat we learned:\n• Talk to users obsessively, especially the ones who churned\n• The feature people ask for is rarely the problem they actually have\n• Ship ugly, learn fast, iterate\n• Build in public — our community grew 3x faster once we started sharing progress openly\n\nGrateful for the team, the early adopters, and everyone who gave feedback.\n\nIf you''re building something — keep going. The compounding is real.',
      'ACHIEVEMENT', 'MILESTONE', 'PUBLIC', false, 312, 57, NOW() - INTERVAL '5 days');
  END IF;

  -- TEXT 1
  SELECT id INTO v_author FROM profiles WHERE full_name = 'Lisa Morrison' LIMIT 1;
  IF v_author IS NOT NULL THEN
    INSERT INTO feed_posts (author_id, content, content_type, visibility, is_hidden, likes_count, comments_count, created_at)
    VALUES (v_author,
      E'Unpopular opinion: your LinkedIn profile is working against you.\n\nMost profiles read like a job description. Bullet points of responsibilities, generic buzzwords, and a summary that sounds like it was written by committee.\n\nWhat actually works:\n\n1. Lead with your value, not your title — "I help SaaS companies reduce churn by fixing onboarding UX" beats "Senior UX Designer at TechCorp"\n\n2. Write your about section in first person — "I" not your name — it sounds human\n\n3. Use your experience entries to tell the story of impact, not just tasks\n\n4. Engage with people — a dormant profile with 500 connections does less than an active one with 50\n\n5. A professional headshot matters more than you think\n\nI''ve helped 30+ professionals revamp their profiles in the last year. The patterns are consistent.\n\nWhat''s the one thing you''d change about your profile if you had an hour?',
      'TEXT', 'PUBLIC', false, 178, 46, NOW() - INTERVAL '2 days');
  END IF;

  -- TEXT 2
  SELECT id INTO v_author FROM profiles WHERE full_name = 'Robert Green' LIMIT 1;
  IF v_author IS NOT NULL THEN
    INSERT INTO feed_posts (author_id, content, content_type, visibility, is_hidden, likes_count, comments_count, created_at)
    VALUES (v_author,
      E'Things I wish someone had told me in my first year as a freelancer.\n\nYear 1 was a rollercoaster. Here''s the condensed version:\n\nOn pricing:\nDouble what you think you should charge. You''re factoring in your time, but not your expertise, your reliability, or the value of the output.\n\nOn clients:\nThe cheapest clients create the most work. Scope creep, late payments, revision loops. The premium clients who pay well usually have clearer briefs.\n\nOn contracts:\nEvery. Single. Job. Even for friends. Especially for friends.\n\nOn slow periods:\nThey will come. Keep 3 months of expenses in reserve before going full freelance, not after.\n\nOn saying no:\nEvery "yes" to a bad project is a "no" to a better one that might show up.\n\nYear 4 now. Still learning, but the foundations are solid.\n\nAnyone else freelancing? What would you add?',
      'TEXT', 'PUBLIC', false, 203, 38, NOW() - INTERVAL '1 day');
  END IF;

  -- MILESTONE
  SELECT id INTO v_author FROM profiles WHERE full_name = 'Amanda Rodriguez' LIMIT 1;
  IF v_author IS NOT NULL THEN
    INSERT INTO feed_posts (author_id, content, content_type, achievement_type, visibility, is_hidden, likes_count, comments_count, created_at)
    VALUES (v_author,
      E'5 years ago today I left a stable corporate job to bet on myself.\n\nPeople said I was crazy. The economy wasn''t great, I had no savings cushion, and my business plan was two pages in a Google Doc.\n\nToday: a team of 7, clients in 4 countries, and work I''m genuinely proud of.\n\nIt wasn''t linear. There were months I wasn''t sure I could make payroll. Months I missed the security of a salary. Moments I second-guessed everything.\n\nBut here''s what I know now: the risk of staying where you don''t belong is higher than the risk of building something new.\n\nTo everyone thinking about making a leap — you probably already know the answer. You''re just waiting for permission.\n\nThis is it.',
      'MILESTONE', 'WORK_ANNIVERSARY', 'PUBLIC', false, 445, 73, NOW() - INTERVAL '4 days');
  END IF;

  -- JOB_UPDATE
  SELECT id INTO v_author FROM profiles WHERE full_name = 'Brian Cooper' LIMIT 1;
  IF v_author IS NOT NULL THEN
    INSERT INTO feed_posts (author_id, content, content_type, visibility, is_hidden, likes_count, comments_count, created_at)
    VALUES (v_author,
      E'Open to opportunities — but being intentional about it.\n\nAfter 4 years at my current company, I''m starting to explore what''s next. Not in a panic, just thoughtfully.\n\nWhat I''m looking for:\n→ Product or engineering leadership role\n→ Company between Series A and Series C\n→ Domain: healthcare tech, edtech, or fintech\n→ Remote-first culture (not remote-tolerated)\n\nWhat I bring:\n→ Track record of shipping 0-to-1 products\n→ Experience managing cross-functional teams of 8-15\n→ Strong technical background — former engineer, still write code\n\nIf anything comes to mind in your org or network, I''d be grateful. Happy to grab a coffee call.\n\nDM or connect here. Thank you.',
      'JOB_UPDATE', 'PUBLIC', false, 167, 29, NOW() - INTERVAL '6 hours');
  END IF;

END $$;
