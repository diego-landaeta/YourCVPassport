-- ============================================================
-- More Channels — Explore tab content
-- Adds 6 new channels (not auto-joined, so they appear in Explore)
-- Each with 3 posts of varied types: TEXT, MILESTONE/ACHIEVEMENT, POLL/EVENT
-- Run after 20260221_seed_groups_content.sql
-- ============================================================


-- ── Channel 1: Tendencias Salariales 2026 (ES) ──────────────
DO $$
DECLARE
  v_ch   UUID;
  v_owner UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Tendencias Salariales 2026') THEN
    RAISE NOTICE 'Canal "Tendencias Salariales 2026" ya existe — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Jennifer Martinez' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Jennifer Martinez not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, member_count, post_count, metadata)
  VALUES (
    v_owner,
    'Tendencias Salariales 2026',
    'Datos reales sobre salarios, compensación y mercado laboral en España y Latam. Benchmarks, encuestas y análisis sin filtros.',
    'tendencias-salariales-2026',
    false, 312, 0,
    '{"type": "channel", "seed_channels_v1": "true"}'::jsonb
  ) RETURNING id INTO v_ch;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_ch, v_owner, 'owner') ON CONFLICT DO NOTHING;

  -- Post 1: TEXT
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'📊 Salarios Tech en España 2026 — datos reales\n\nAnalizamos más de 4.200 ofertas publicadas en Q1 2026:\n\n→ Frontend Senior: 48.000–62.000 €\n→ Backend Senior: 50.000–68.000 €\n→ Data Scientist: 52.000–70.000 €\n→ Product Manager: 55.000–75.000 €\n→ DevOps / SRE: 58.000–80.000 €\n\nVariables que más impactan:\n• Stack tecnológico (cloud > on-premise)\n• Inglés profesional (+12% de media)\n• Empresa con producto propio vs consultora (hasta 18k de diferencia)\n\nFuente: LinkedIn, InfoJobs, Glassdoor + datos propios YourCVPassport.',
    'TEXT', 'PUBLIC', false, 143, 1820, NOW() - INTERVAL '8 days'
  );

  -- Post 2: MILESTONE
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'🏆 Hito: 50% de las ofertas tech en España ya incluyen salario\n\nHace 3 años era el 22%. La ley de transparencia salarial de la UE empieza a funcionar.\n\nLo que cambia para los candidatos:\n→ Puedes negociar desde datos, no desde intuición\n→ El "¿cuánto cobras actualmente?" pierde relevancia\n→ Brechas por género empiezan a ser visibles\n\nLo que aún falla: el 50% restante sigue usando rangos tan amplios que no dicen nada (30.000–90.000 €, os conocemos). Seguimos.',
    'MILESTONE', 'PUBLIC', false, 89, 1120, NOW() - INTERVAL '5 days'
  );

  -- Post 3: POLL
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, metadata, created_at)
  VALUES (
    v_owner, v_ch,
    E'¿Recibes el salario que mereces?',
    'POLL', 'PUBLIC', false, 0, 430,
    jsonb_build_object('poll', jsonb_build_object(
      'question', '¿Crees que tu salario refleja tu valor de mercado?',
      'options', jsonb_build_array(
        'Sí, estoy bien compensado/a',
        'Creo que debería ganar más',
        'No lo sé — nunca lo comparé',
        'Estoy negociando ahora mismo'
      ),
      'duration', '1w',
      'expires_at', (NOW() + INTERVAL '7 days')::TEXT
    )),
    NOW() - INTERVAL '2 days'
  );

  UPDATE groups SET post_count = 3 WHERE id = v_ch;
END $$;


-- ── Channel 2: Data & Analytics (EN) ────────────────────────
DO $$
DECLARE
  v_ch   UUID;
  v_owner UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Data & Analytics') THEN
    RAISE NOTICE 'Canal "Data & Analytics" ya existe — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'David Chen' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'David Chen not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, member_count, post_count, metadata)
  VALUES (
    v_owner,
    'Data & Analytics',
    'Trends, tools and real-world applications of data science, analytics, BI, and ML. No hype — just what actually works in 2026.',
    'data-analytics-hub',
    false, 489, 0,
    '{"type": "channel", "seed_channels_v1": "true"}'::jsonb
  ) RETURNING id INTO v_ch;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_ch, v_owner, 'owner') ON CONFLICT DO NOTHING;

  -- Post 1: TEXT
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'The data skills employers actually want in 2026\n\nBased on 3.000+ job postings analyzed this quarter:\n\n#1 SQL — still #1. Always #1.\n#2 Python (pandas, polars, dbt)\n#3 dbt + data modeling fundamentals\n#4 Cloud data stacks (Snowflake, BigQuery, Redshift)\n#5 AI/LLM APIs for data enrichment (new this year)\n\nWhat fell out of the top 10:\n→ Tableau (being replaced by Looker/Metabase)\n→ Excel as a primary tool (finally)\n\nWhat this means for you: the data engineer and analytics engineer roles are merging. If you only know one side, it''s time to learn the other.',
    'TEXT', 'PUBLIC', false, 178, 2340, NOW() - INTERVAL '6 days'
  );

  -- Post 2: TEXT (tool of the week)
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'Tool of the week: DuckDB\n\nIf you work with data and haven''t tried DuckDB yet, stop what you''re doing.\n\nWhat it is: an in-process SQL OLAP engine — think SQLite but for analytics.\n\nWhy it matters:\n→ Runs locally, no server needed\n→ Reads Parquet, CSV, JSON natively\n→ Faster than pandas for most analytics workloads\n→ Works inside Python notebooks\n\nPerfect for:\n• Quick ad-hoc analysis without spinning up a warehouse\n• Data validation pipelines\n• Local prototyping before production\n\nFree, open source, and getting better every week.',
    'TEXT', 'PUBLIC', false, 94, 1450, NOW() - INTERVAL '3 days'
  );

  -- Post 3: EVENT
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, metadata, created_at)
  VALUES (
    v_owner, v_ch,
    E'📅 Live: "From Analyst to Data Engineer" — career transition panel\n\nThree professionals who made the switch. Real stories, real numbers, real advice.\n\n→ What skills actually transfer\n→ How to talk about the transition in interviews\n→ Building your first data pipeline as a "non-engineer"\n→ Salaries before and after\n\nFree for all followers. Bring your questions.',
    'EVENT', 'PUBLIC', false, 67, 890,
    jsonb_build_object('event', jsonb_build_object(
      'title', 'From Analyst to Data Engineer — Career Panel',
      'date', TO_CHAR(NOW() + INTERVAL '10 days', 'YYYY-MM-DD'),
      'time', '17:00',
      'location', 'Online — Zoom',
      'link', 'https://yourcvpassport.com/eventos/analyst-to-data-engineer'
    )),
    NOW() - INTERVAL '1 day'
  );

  UPDATE groups SET post_count = 3 WHERE id = v_ch;
END $$;


-- ── Channel 3: Founders & Emprendedores (ES) ─────────────────
DO $$
DECLARE
  v_ch   UUID;
  v_owner UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Founders & Emprendedores') THEN
    RAISE NOTICE 'Canal "Founders & Emprendedores" ya existe — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Marcus Williams' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Marcus Williams not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, member_count, post_count, metadata)
  VALUES (
    v_owner,
    'Founders & Emprendedores',
    'Para quienes construyen algo desde cero. Startups, freelance, side projects — lessons learned, sin adornos.',
    'founders-emprendedores',
    false, 267, 0,
    '{"type": "channel", "seed_channels_v1": "true"}'::jsonb
  ) RETURNING id INTO v_ch;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_ch, v_owner, 'owner') ON CONFLICT DO NOTHING;

  -- Post 1: TEXT
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'Lo que nadie te dice sobre emprender siendo empleado\n\nLlevas meses pensando en lanzar algo. Tienes la idea, las ganas. Pero también hipoteca, familia, y un trabajo que te come 9 horas diarias.\n\nLa trampa: esperar al "momento perfecto" para dejar tu trabajo antes de empezar.\n\nLo que funciona en realidad:\n\n1. Construye mientras tienes ingresos — los primeros 6 meses son los más frágiles\n2. Fija un criterio de salida — "cuando llegue a X en MRR, doy el paso"\n3. Protege tu energía creativa — trabaja en tu proyecto los fines de semana, no entre las 22:00 y las 2:00\n4. Habla con tu pareja / familia antes, no después\n\nEl mejor momento para emprender es cuando todavía tienes red de seguridad.',
    'TEXT', 'PUBLIC', false, 156, 1980, NOW() - INTERVAL '7 days'
  );

  -- Post 2: MILESTONE
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'Milestone: 50 empresas nacidas desde perfiles YourCVPassport 🚀\n\nEsta semana llegamos a 50 fundadores que declararon en sus perfiles haber lanzado su empresa mientras estaban activos en la plataforma.\n\nNo es un número enorme. Pero cada uno representa:\n→ Una conversación en la comunidad que cambió algo\n→ Un perfil que convenció a un cofundador o inversor\n→ Una historia que empezó aquí\n\nSi eres uno de ellos, escríbenos — tu historia se merece el canal.',
    'MILESTONE', 'PUBLIC', false, 112, 1340, NOW() - INTERVAL '4 days'
  );

  -- Post 3: POLL
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, metadata, created_at)
  VALUES (
    v_owner, v_ch,
    E'Una pregunta para los emprendedores del canal:',
    'POLL', 'PUBLIC', false, 0, 520,
    jsonb_build_object('poll', jsonb_build_object(
      'question', '¿En qué fase está tu proyecto ahora mismo?',
      'options', jsonb_build_array(
        'Idea / validación inicial',
        'Construyendo el MVP',
        'Primeros clientes o ingresos',
        'Buscando financiación o equipo'
      ),
      'duration', '1w',
      'expires_at', (NOW() + INTERVAL '7 days')::TEXT
    )),
    NOW() - INTERVAL '18 hours'
  );

  UPDATE groups SET post_count = 3 WHERE id = v_ch;
END $$;


-- ── Channel 4: Remote First (EN) ─────────────────────────────
DO $$
DECLARE
  v_ch   UUID;
  v_owner UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Remote First') THEN
    RAISE NOTICE 'Canal "Remote First" ya existe — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Alex Martinez' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Alex Martinez not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, member_count, post_count, metadata)
  VALUES (
    v_owner,
    'Remote First',
    'The future of work is distributed. Remote jobs, async tools, productivity strategies, and stories from professionals working from anywhere.',
    'remote-first',
    false, 534, 0,
    '{"type": "channel", "seed_channels_v1": "true"}'::jsonb
  ) RETURNING id INTO v_ch;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_ch, v_owner, 'owner') ON CONFLICT DO NOTHING;

  -- Post 1: TEXT
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'The "return to office" backlash by the numbers\n\nNew research from Q1 2026 (n=12.000 professionals):\n\n→ 71% of workers required to RTO 3+ days are actively job hunting\n→ Companies with full remote options have 40% less voluntary attrition\n→ Hybrid "2 days in office" is the retention sweet spot for most sectors\n→ Exception: early-stage startups where collaboration density matters most\n\nThe irony: companies enforcing RTO to "improve culture" are accelerating the loss of their best people — those with the most options.\n\nThe data is clear. The debate isn''t really about productivity. It''s about control.',
    'TEXT', 'PUBLIC', false, 234, 3120, NOW() - INTERVAL '5 days'
  );

  -- Post 2: TEXT (job picks)
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'Remote job picks this week — curated & salary-transparent\n\n🇪🇺 Backend Engineer (Python) — €55–70k — Fintech, fully remote EU\n🌍 Product Designer — $70–90k — B2B SaaS, async-first team\n🇪🇸 Data Analyst (SQL/Python) — 40–52k € — EdTech, remote Spain\n🌎 Customer Success Manager (Spanish) — $50–65k — US startup, LATAM team\n🇦🇷 Frontend Dev (React) — USD 3–5k/month — remote LATAM\n\nNo recruiter middlemen — direct applications only. Drop a 💼 if you want more of these weekly.',
    'TEXT', 'PUBLIC', false, 189, 2890, NOW() - INTERVAL '3 days'
  );

  -- Post 3: EVENT
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, metadata, created_at)
  VALUES (
    v_owner, v_ch,
    E'📅 "Land Your First Remote Job" — Live Workshop\n\nFor professionals transitioning to remote for the first time:\n\n→ Where remote jobs are actually posted (not LinkedIn first)\n→ How to write a profile that signals "remote-ready"\n→ Async communication skills companies look for\n→ Time zones, overlap hours — how to negotiate\n→ Red flags in remote job postings\n\nFree workshop, 90 minutes. Recording available for all followers.',
    'EVENT', 'PUBLIC', false, 78, 1230,
    jsonb_build_object('event', jsonb_build_object(
      'title', 'Land Your First Remote Job — Live Workshop',
      'date', TO_CHAR(NOW() + INTERVAL '6 days', 'YYYY-MM-DD'),
      'time', '19:00',
      'location', 'Online — Zoom',
      'link', 'https://yourcvpassport.com/eventos/first-remote-job'
    )),
    NOW() - INTERVAL '1 day'
  );

  UPDATE groups SET post_count = 3 WHERE id = v_ch;
END $$;


-- ── Channel 5: Diseño & UX (ES) ──────────────────────────────
DO $$
DECLARE
  v_ch   UUID;
  v_owner UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Diseño & UX') THEN
    RAISE NOTICE 'Canal "Diseño & UX" ya existe — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Emily Harper' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Emily Harper not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, member_count, post_count, metadata)
  VALUES (
    v_owner,
    'Diseño & UX',
    'Tendencias de diseño, UX research, product design y creatividad aplicada al trabajo. Recursos, inspiración y crítica honesta.',
    'diseno-ux',
    false, 378, 0,
    '{"type": "channel", "seed_channels_v1": "true"}'::jsonb
  ) RETURNING id INTO v_ch;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_ch, v_owner, 'owner') ON CONFLICT DO NOTHING;

  -- Post 1: TEXT
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'Tendencias UX que están definiendo 2026\n\nDespués de revisar más de 80 lanzamientos de producto en Q1, estos son los patrones que se repiten:\n\n1. Spatial computing UI — interfaces pensadas para gafas + móvil simultáneamente\n2. Micro-personalización — UI que se adapta al comportamiento individual, no al segmento\n3. Honesty patterns — diseño que comunica las limitaciones del producto (anti-dark patterns)\n4. Voice-first secondary — el input de voz como segunda opción, no el primero\n5. Dense information displays — usuarios avanzados quieren más datos visibles, menos clics\n\nEl diseño "más es menos" está siendo cuestionado por usuarios que ya saben exactamente lo que buscan.',
    'TEXT', 'PUBLIC', false, 167, 2100, NOW() - INTERVAL '9 days'
  );

  -- Post 2: TEXT (portfolio advice)
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'Tu portfolio no es una galería — es una narrativa\n\nEl error más común en portfolios de diseñadores: 12 proyectos bonitos sin contexto.\n\nLo que un hiring manager quiere ver:\n\n→ El problema → no solo el resultado\n→ Tu proceso de decisión → ¿por qué ese diseño y no otro?\n→ Métricas de impacto → "mejoró la conversión un 18%", no "diseñé una landing"\n→ Cómo colaboraste → con PMs, devs, stakeholders\n\nUn portfolio con 3 casos de estudio bien documentados supera a uno con 15 screenshots sin historia.\n\n¿Construyendo tu portfolio ahora? Comparte el link — feedback gratis.',
    'TEXT', 'PUBLIC', false, 203, 2760, NOW() - INTERVAL '4 days'
  );

  -- Post 3: POLL
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, metadata, created_at)
  VALUES (
    v_owner, v_ch,
    E'¿Con qué herramienta diseñas principalmente en 2026?',
    'POLL', 'PUBLIC', false, 0, 690,
    jsonb_build_object('poll', jsonb_build_object(
      'question', '¿Cuál es tu herramienta de diseño principal actualmente?',
      'options', jsonb_build_array(
        'Figma',
        'Framer',
        'Adobe XD / Sketch',
        'Otro (comenta abajo)'
      ),
      'duration', '1w',
      'expires_at', (NOW() + INTERVAL '7 days')::TEXT
    )),
    NOW() - INTERVAL '2 days'
  );

  UPDATE groups SET post_count = 3 WHERE id = v_ch;
END $$;


-- ── Channel 6: Tech Latinoamérica (ES) ──────────────────────
DO $$
DECLARE
  v_ch   UUID;
  v_owner UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM groups WHERE name = 'Tech Latinoamérica') THEN
    RAISE NOTICE 'Canal "Tech Latinoamérica" ya existe — skip';
    RETURN;
  END IF;

  SELECT id INTO v_owner FROM profiles WHERE full_name = 'Priya Sharma' LIMIT 1;
  IF v_owner IS NULL THEN RAISE NOTICE 'Priya Sharma not found — skip'; RETURN; END IF;

  INSERT INTO groups (owner_id, name, description, slug, is_private, member_count, post_count, metadata)
  VALUES (
    v_owner,
    'Tech Latinoamérica',
    'El ecosistema tech de Latam en tiempo real: startups, inversión, talento y oportunidades desde Buenos Aires hasta Ciudad de México.',
    'tech-latinoamerica',
    false, 621, 0,
    '{"type": "channel", "seed_channels_v1": "true"}'::jsonb
  ) RETURNING id INTO v_ch;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_ch, v_owner, 'owner') ON CONFLICT DO NOTHING;

  -- Post 1: TEXT
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'El ecosistema tech Latam en 2026 — estado actual\n\nLatam sigue siendo una de las regiones con mayor crecimiento en empleo tech global. Datos del Q1 2026:\n\n🇧🇷 Brasil: líder en fintechs y agritech. São Paulo consolida su posición como hub regional.\n🇲🇽 México: crecimiento acelerado en nearshoring para EE.UU. Monterrey y CDMX compiten por el talento.\n🇦🇷 Argentina: el talento más demandado internacionalmente. Brain drain real, pero también salarios más competitivos en USD.\n🇨🇴 Colombia: Bogotá emerge como hub para startups de salud digital y edtech.\n🇨🇱 Chile: el ecosistema de VC más maduro de la región.\n\nEl mayor desafío: retener el talento que se forma cuando el mercado global puede contratarlo en remoto.',
    'TEXT', 'PUBLIC', false, 198, 2680, NOW() - INTERVAL '7 days'
  );

  -- Post 2: TEXT (job picks)
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, created_at)
  VALUES (
    v_owner, v_ch,
    E'💼 Startups Latam contratando remote — curación de la semana\n\n🇧🇷 Nubank — Senior Backend Engineer — $90–130k USD\n🇲🇽 Clip — Product Manager — $60–80k USD + equity\n🇦🇷 Mercado Libre — Data Engineer — $70–100k USD\n🇨🇴 Rappi — Frontend React — $50–70k USD\n🌎 Remote-first startup Latam — Full Stack (Node+React) — $40–60k USD\n\nTodas con salario visible. Curación semanal todos los martes — sigue el canal para no perderte nada.',
    'TEXT', 'PUBLIC', false, 145, 1890, NOW() - INTERVAL '3 days'
  );

  -- Post 3: EVENT
  INSERT INTO feed_posts (author_id, group_id, content, content_type, visibility, is_hidden, likes_count, views_count, metadata, created_at)
  VALUES (
    v_owner, v_ch,
    E'🎙️ Panel: "Construir una carrera tech desde Latam"\n\nCuatro profesionales que lo han hecho:\n→ Dev argentino trabajando remote para empresa en EE.UU.\n→ PM colombiana que pasó de agencia local a startup europea\n→ Fundador brasileño que cerró su primera ronda seed\n→ Diseñadora mexicana con portfolio y clientes globales\n\nSin guión. Solo preguntas reales del canal.',
    'EVENT', 'PUBLIC', false, 89, 1120,
    jsonb_build_object('event', jsonb_build_object(
      'title', 'Construir una carrera tech desde Latam',
      'date', TO_CHAR(NOW() + INTERVAL '14 days', 'YYYY-MM-DD'),
      'time', '18:00',
      'location', 'Online — Zoom',
      'link', 'https://yourcvpassport.com/eventos/carrera-tech-latam'
    )),
    NOW() - INTERVAL '5 days'
  );

  UPDATE groups SET post_count = 3 WHERE id = v_ch;
END $$;
