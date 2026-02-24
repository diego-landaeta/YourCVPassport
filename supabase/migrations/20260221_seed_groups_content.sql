-- ============================================================
-- Seed: Grupos & Canales — Contenido Rico + Promociones en Feed
-- Idioma: Laura/Javier/Marta → ES | resto → EN
-- Incluye posts en el feed público donde miembros promocionan sus grupos
-- Safe to re-run: metadata->>'seed_groups' = 'true'
-- ============================================================

DO $$
DECLARE
  -- Real profile UUIDs
  laura     CONSTANT UUID := 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'; -- [ES]
  javier    CONSTANT UUID := 'a826c47c-0d50-47da-aab3-4dfb71da709d'; -- [ES]
  marta     CONSTANT UUID := 'e379dca2-0b33-45b4-864a-ba9204e0ab4b'; -- [ES]
  james     CONSTANT UUID := '8d93820f-beb7-4eb8-8a3c-8e7efa6a6665'; -- [EN]
  sarah     CONSTANT UUID := 'a2b0d3d3-488f-429a-9b2f-a4e0a78e55a9'; -- [EN]
  marcus    CONSTANT UUID := '8343e9aa-cc89-4273-9386-581883592a67'; -- [EN]
  lisa      CONSTANT UUID := '97d188d3-a038-4726-bb7e-59e13814123a'; -- [EN]
  jennifer  CONSTANT UUID := '0da0dcfa-82dc-43df-a5f8-adaee989c690'; -- [EN]
  rachel    CONSTANT UUID := '3f40d45b-ad4e-43a9-a88b-a822a56cc7d3'; -- [EN]
  david     CONSTANT UUID := '206de10c-1322-491b-ac79-c4de3886ca0d'; -- [EN]
  emily     CONSTANT UUID := 'c9e55b0e-efff-4f43-b0ce-3d99868ce3d8'; -- [EN]
  amanda    CONSTANT UUID := '3d0d18fd-2b12-4fd5-b5c4-b6635fa3f52e'; -- [EN]
  kevin     CONSTANT UUID := '86a7ec23-2fe8-4a60-afe3-45e61e906b54'; -- [EN]
  margaret  CONSTANT UUID := 'e4f2dcf3-6264-46d0-970c-65592c87a9c4'; -- [EN]
  thomas    CONSTANT UUID := 'c2eec942-9fb8-4bc5-a208-db9958438d51'; -- [EN]
  patricia  CONSTANT UUID := 'e23b0890-fb78-4ab5-85fc-613e56b68aba'; -- [EN]
  daniel    CONSTANT UUID := 'd0961de8-508e-4870-864e-65b833bfafb0'; -- [EN]
  linda     CONSTANT UUID := '8068213e-0e53-48c7-b9f5-ccd631865484'; -- [EN]
  priya     CONSTANT UUID := 'efb2e93a-1ad5-4f0d-a948-daa763d5a2d4'; -- [EN]
  chris     CONSTANT UUID := 'c0cde1c6-9391-4e6e-933c-d29332068a01'; -- [EN]
  steven    CONSTANT UUID := '83de70ef-0504-4f9d-b45c-d1f35eef9535'; -- [EN]
  angela    CONSTANT UUID := 'c1889bbe-f828-41dc-83f6-b844f1e74d49'; -- [EN]
  brian     CONSTANT UUID := 'dab1878e-f2dc-451c-9753-392c91ac4aa3'; -- [EN]
  rebecca   CONSTANT UUID := '54701b32-af6e-4923-846d-8a04fad249a8'; -- [EN]
  karen     CONSTANT UUID := '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1'; -- [EN]
  jessica   CONSTANT UUID := '55333d11-13c8-43b8-942b-cb1e75d0b812'; -- [EN]
  alex_m    CONSTANT UUID := '099840cc-a99c-480d-8fd9-fba5ecd5a4a6'; -- [EN]
  diana     CONSTANT UUID := '636e9e4d-4873-4114-8949-376a8d0f24bc'; -- [EN]
  robert_k  CONSTANT UUID := '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da'; -- [EN]
  mark      CONSTANT UUID := '707aa7e3-b891-485c-b4e6-618625713565'; -- [EN]
  michelle  CONSTANT UUID := '7fe0c1a6-39ed-46ad-9388-116a3a0fb429'; -- [EN]
  nicole    CONSTANT UUID := '1b90b431-de09-4b75-af6a-c94975b68746'; -- [EN]

  -- Group IDs
  grp_tutores      UUID;
  grp_devs         UUID;
  grp_wellness     UUID;
  ch_novedades     UUID;
  ch_ia            UUID;
  ch_oportunidades UUID;

  -- Posts — grp_tutores (gp1–gp7)
  gp1  UUID; gp2  UUID; gp3  UUID; gp4  UUID; gp5  UUID;
  gp6  UUID; gp7  UUID;
  -- Posts — grp_devs (gp8–gp13)
  gp8  UUID; gp9  UUID; gp10 UUID; gp11 UUID; gp12 UUID; gp13 UUID;
  -- Posts — grp_wellness (gp14–gp20)
  gp14 UUID; gp15 UUID; gp16 UUID; gp17 UUID; gp18 UUID; gp19 UUID; gp20 UUID;

  -- Posts — ch_novedades (cp1–cp7)
  cp1  UUID; cp2  UUID; cp3  UUID; cp4  UUID; cp5  UUID; cp6  UUID; cp7  UUID;
  -- Posts — ch_ia (cp8–cp15)
  cp8  UUID; cp9  UUID; cp10 UUID; cp11 UUID; cp12 UUID; cp13 UUID; cp14 UUID; cp15 UUID;
  -- Posts — ch_oportunidades (cp16–cp23)
  cp16 UUID; cp17 UUID; cp18 UUID; cp19 UUID; cp20 UUID; cp21 UUID; cp22 UUID; cp23 UUID;

  -- Posts — feed público, miembros promocionan grupos (fp1–fp8)
  fp1  UUID; fp2  UUID; fp3  UUID; fp4  UUID;
  fp5  UUID; fp6  UUID; fp7  UUID; fp8  UUID;

BEGIN

  -- ── 0. Limpiar seed previo ───────────────────────────────────────
  DELETE FROM public.feed_posts WHERE metadata->>'seed_groups' = 'true';
  DELETE FROM public.groups     WHERE metadata->>'seed_groups' = 'true';

  -- ════════════════════════════════════════════════════════════════
  -- 1. GRUPOS Y CANALES
  -- ════════════════════════════════════════════════════════════════

  INSERT INTO public.groups (owner_id, name, description, is_private, metadata) VALUES (
    james, 'Tutors & Mentors Pro',
    'Community for educators, tutors and mentors sharing methodologies, resources and classroom insights. A space to learn from each other across disciplines.',
    false, '{"type": "group", "seed_groups": "true"}'
  ) RETURNING id INTO grp_tutores;

  INSERT INTO public.groups (owner_id, name, description, is_private, metadata) VALUES (
    alex_m, 'Devs & Conscious Tech',
    'For developers, engineers and tech professionals building technology with purpose, ethics and responsibility. AI, data, product.',
    false, '{"type": "group", "seed_groups": "true"}'
  ) RETURNING id INTO grp_devs;

  INSERT INTO public.groups (owner_id, name, description, is_private, metadata) VALUES (
    priya, 'Salud & Bienestar Holístico',
    'Espacio para profesionales de salud integrativa, bienestar, nutrición, movimiento y terapias complementarias. Ciencia y práctica.',
    false, '{"type": "group", "seed_groups": "true"}'
  ) RETURNING id INTO grp_wellness;

  INSERT INTO public.groups (owner_id, name, description, is_private, metadata) VALUES (
    laura, 'Novedades YourCVPassport',
    'Canal oficial con actualizaciones de la plataforma, nuevas funcionalidades, tips para optimizar tu perfil y noticias del equipo.',
    false, '{"type": "channel", "seed_groups": "true"}'
  ) RETURNING id INTO ch_novedades;

  INSERT INTO public.groups (owner_id, name, description, is_private, metadata) VALUES (
    alex_m, 'AI at Work 2026',
    'Everything about artificial intelligence applied to work: tools, trends, use cases, critical reflections. Updated weekly.',
    false, '{"type": "channel", "seed_groups": "true"}'
  ) RETURNING id INTO ch_ia;

  INSERT INTO public.groups (owner_id, name, description, is_private, metadata) VALUES (
    laura, 'Oportunidades & Reconversión Latam',
    'Ofertas, becas, programas de reconversión y oportunidades de crecimiento profesional para Latam y España. Curado semanalmente.',
    false, '{"type": "channel", "seed_groups": "true"}'
  ) RETURNING id INTO ch_oportunidades;

  -- ════════════════════════════════════════════════════════════════
  -- 2. MIEMBROS
  -- ════════════════════════════════════════════════════════════════

  INSERT INTO public.group_members (group_id, user_id, role) VALUES
    (grp_tutores, sarah,    'admin'),
    (grp_tutores, marcus,   'member'), (grp_tutores, lisa,     'member'),
    (grp_tutores, jennifer, 'member'), (grp_tutores, margaret, 'member'),
    (grp_tutores, thomas,   'member'), (grp_tutores, angela,   'member'),
    (grp_tutores, mark,     'member'), (grp_tutores, emily,    'member'),
    (grp_tutores, nicole,   'member'), (grp_tutores, patricia, 'member'),
    (grp_tutores, steven,   'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  INSERT INTO public.group_members (group_id, user_id, role) VALUES
    (grp_devs, daniel,   'admin'),
    (grp_devs, jessica,  'member'), (grp_devs, kevin,    'member'),
    (grp_devs, patricia, 'member'), (grp_devs, javier,   'member'),
    (grp_devs, laura,    'member'), (grp_devs, marta,    'member'),
    (grp_devs, brian,    'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  INSERT INTO public.group_members (group_id, user_id, role) VALUES
    (grp_wellness, linda,    'admin'),
    (grp_wellness, david,    'member'), (grp_wellness, rachel,   'member'),
    (grp_wellness, chris,    'member'), (grp_wellness, diana,    'member'),
    (grp_wellness, robert_k, 'member'), (grp_wellness, karen,    'member'),
    (grp_wellness, rebecca,  'member'), (grp_wellness, michelle, 'member'),
    (grp_wellness, emily,    'member'), (grp_wellness, brian,    'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  INSERT INTO public.group_members (group_id, user_id, role) VALUES
    (ch_novedades, james,    'admin'),
    (ch_novedades, javier,   'member'), (ch_novedades, marta,    'member'),
    (ch_novedades, alex_m,   'member'), (ch_novedades, sarah,    'member'),
    (ch_novedades, amanda,   'member'), (ch_novedades, kevin,    'member'),
    (ch_novedades, daniel,   'member'), (ch_novedades, angela,   'member'),
    (ch_novedades, priya,    'member'), (ch_novedades, emily,    'member'),
    (ch_novedades, jennifer, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  INSERT INTO public.group_members (group_id, user_id, role) VALUES
    (ch_ia, daniel,   'admin'),
    (ch_ia, jessica,  'member'), (ch_ia, james,    'member'),
    (ch_ia, kevin,    'member'), (ch_ia, javier,   'member'),
    (ch_ia, marta,    'member'), (ch_ia, laura,    'member'),
    (ch_ia, patricia, 'member'), (ch_ia, amanda,   'member'),
    (ch_ia, rachel,   'member'), (ch_ia, sarah,    'member'),
    (ch_ia, brian,    'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  INSERT INTO public.group_members (group_id, user_id, role) VALUES
    (ch_oportunidades, james,    'admin'),
    (ch_oportunidades, javier,   'member'), (ch_oportunidades, marta,    'member'),
    (ch_oportunidades, kevin,    'member'), (ch_oportunidades, angela,   'member'),
    (ch_oportunidades, emily,    'member'), (ch_oportunidades, jennifer, 'member'),
    (ch_oportunidades, sarah,    'member'), (ch_oportunidades, daniel,   'member'),
    (ch_oportunidades, patricia, 'member'), (ch_oportunidades, alex_m,   'member'),
    (ch_oportunidades, amanda,   'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════
  -- 3. POSTS — GRUPO: Tutors & Mentors Pro  [todos EN]
  -- ════════════════════════════════════════════════════════════════

  -- gp1 [EN] james — Welcome
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (james,
    'Welcome to Tutors & Mentors Pro 👋

This is a space for everyone who teaches, mentors and supports the growth of others — in classrooms, online, in companies, or informally.

A few questions to kick things off:
→ What area are you currently tutoring or mentoring in?
→ What''s your biggest challenge as a tutor/mentor in 2026?
→ What resource or methodology have you discovered recently?

Looking forward to learning from everyone here.',
    'TEXT', 'PUBLIC', grp_tutores, '{"seed_groups": "true"}', NOW() - INTERVAL '12 days') RETURNING id INTO gp1;

  -- gp2 [EN] sarah — Montessori principles for adult learners
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (sarah,
    'Something that has transformed my work as a mentor: applying Montessori principles to adult learning.

The premise is the same: the learner already has the capacity. Your job isn''t to fill an empty vessel — it''s to remove obstacles so what''s already there can flourish.

When I work with adults in career transitions, the first question I ask is: what are you already very good at? Building from strengths accelerates learning and reduces resistance to change far more than focusing on gaps.

Anyone else working with adults in transition?',
    'TEXT', 'PUBLIC', grp_tutores, '{"seed_groups": "true"}', NOW() - INTERVAL '11 days') RETURNING id INTO gp2;

  -- gp3 [EN] marcus — Psychological safety before content
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (marcus,
    'The most important variable in an effective mentoring relationship isn''t the mentor''s experience. It''s psychological safety.

A mentee who doesn''t feel safe admitting ignorance, asking "stupid" questions, or sharing failures extracts a fraction of what they could from the relationship.

Building that container of safety is the work that comes before any content. Without it, what you offer technically is processed at 30% capacity.

How do you create that safe space at the very beginning of a mentoring relationship?',
    'TEXT', 'PUBLIC', grp_tutores, '{"seed_groups": "true"}', NOW() - INTERVAL '10 days') RETURNING id INTO gp3;

  -- gp4 [EN] margaret — The educator's inner state
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (margaret,
    'Something rarely discussed in tutor training: the educator''s inner state.

Contemplative pedagogy research is clear: the quality of presence a teacher brings — their level of regulation, their capacity for attention, their equanimity — affects student learning in ways no curriculum can compensate for.

This isn''t a spiritual argument. It''s the neuroscience of emotional contagion.

Do you have personal practices you cultivate as educators — not just pedagogical tools, but ways of being?',
    'TEXT', 'PUBLIC', grp_tutores, '{"seed_groups": "true"}', NOW() - INTERVAL '9 days') RETURNING id INTO gp4;

  -- gp5 [EN] thomas — Socratic method in modern mentoring
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (thomas,
    'The Socratic method is 2,400 years old and still one of the most underused tools in mentoring.

The instinct as a mentor is to transfer knowledge — to answer questions. The Socratic move is to respond to a question with a better question. Not to be difficult, but because the right question does more for learning than the right answer.

"What do you think is blocking you here?" does more than "here''s what I would do."

"What would have to be true for this to work?" generates more insight than a direct recommendation.

The mentor''s job is to help the mentee think, not to think for them. Hard to remember in the moment. Worth the practice.',
    'TEXT', 'PUBLIC', grp_tutores, '{"seed_groups": "true"}', NOW() - INTERVAL '8 days') RETURNING id INTO gp5;

  -- gp6 [EN] angela — Feedback that actually lands
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (angela,
    'Most feedback in mentoring relationships fails not because the content is wrong but because the delivery doesn''t match what the mentee can actually receive in that moment.

A few things I''ve learned about feedback timing:

→ Feedback given when someone is in threat state (stressed, ashamed, defensive) doesn''t land — it gets stored as an attack
→ Feedback is best received right after a small win, not after a failure
→ Asking "what do you think went well / what would you do differently?" before giving feedback dramatically increases how much sticks

The goal isn''t to give good feedback. It''s to give feedback at a moment when it can be integrated.',
    'TEXT', 'PUBLIC', grp_tutores, '{"seed_groups": "true"}', NOW() - INTERVAL '7 days') RETURNING id INTO gp6;

  -- gp7 [EN] jennifer — Poll: how many do you mentor?
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (jennifer,
    'Professional curiosity for the group 👇',
    'POLL', 'PUBLIC', grp_tutores,
    jsonb_build_object(
      'seed_groups', 'true',
      'poll', jsonb_build_object(
        'question', 'How many people are you actively mentoring or tutoring simultaneously?',
        'options', jsonb_build_array('1–3 people', '4–8 people', '9–15 people', 'More than 15'),
        'duration', '1w',
        'expires_at', (NOW() + INTERVAL '7 days')::TEXT
      )
    ),
    NOW() - INTERVAL '6 days') RETURNING id INTO gp7;

  -- ════════════════════════════════════════════════════════════════
  -- 4. POSTS — GRUPO: Devs & Conscious Tech
  --    EN: alex_m, daniel, kevin, jessica  |  ES: javier
  -- ════════════════════════════════════════════════════════════════

  -- gp8 [EN] alex_m — Welcome
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (alex_m,
    'Devs & Conscious Tech is open 🛠️

This group started from a conviction: the impact of the technology we build depends almost as much on the questions we ask while designing it as on the quality of the code.

Who''s here?
→ Devs who think about the social impact of what they build
→ Product managers thinking about ethics and responsibility
→ Data people concerned about bias and privacy
→ Engineers who don''t switch off their ethical brain at work

Opening question: what project are you working on right now where the ethical or social dimension is central?',
    'TEXT', 'PUBLIC', grp_devs, '{"seed_groups": "true"}', NOW() - INTERVAL '12 days') RETURNING id INTO gp8;

  -- gp9 [EN] daniel — Bias in "neutral" datasets
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (daniel,
    'Discussion topic: bias in "neutral" datasets.

Reading a paper this week on representation in publicly available medical imaging datasets. The results aren''t surprising but remain uncomfortable: systematic underrepresentation of dark skin tones, chronic conditions in older populations, and mental health data almost exclusively from WEIRD countries (Western, Educated, Industrialized, Rich, Democratic).

A model trained on that data isn''t neutral. It amplifies what the world already has of inequality.

The question I''m left with: how many ML teams systematically review their training data composition before production?',
    'TEXT', 'PUBLIC', grp_devs, '{"seed_groups": "true"}', NOW() - INTERVAL '10 days') RETURNING id INTO gp9;

  -- gp10 [EN] kevin — Real purpose vs purpose as marketing
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (kevin,
    'Something I observe in 2026 tech founders vs. 2019: the language of purpose is everywhere. The real practice is scarce.

Signs "purpose" is marketing:
– The ethics team has no veto over product decisions
– Social impact metrics don''t appear in the board deck
– The values conversation happens at onboarding and never returns

Signs purpose is real:
– Clients or contracts have been declined for values misalignment
– There''s productive (not ignored) tension between growth and mission
– Ethics/responsibility people have real access to decisions

What other signals do you see in your organizations?',
    'TEXT', 'PUBLIC', grp_devs, '{"seed_groups": "true"}', NOW() - INTERVAL '9 days') RETURNING id INTO gp10;

  -- gp11 [EN] jessica — Wearables, biometrics and privacy
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (jessica,
    'A perspective from the health sector on biometric data privacy:

Wearables measuring HRV, temperature, sleep and stress are generating health data with clinical-grade precision. And most users have no idea who has it, how it''s used, or if consent can be revoked.

This isn''t hypothetical. HRV data can infer mental health conditions before the user has identified them. Sleep data can be used by insurers. Activity patterns are proxies for chronic diseases.

How are those of you building in wearables/digital health addressing this?',
    'TEXT', 'PUBLIC', grp_devs, '{"seed_groups": "true"}', NOW() - INTERVAL '7 days') RETURNING id INTO gp11;

  -- gp12 [ES] javier — Ser dev hispanohablante en equipos EN
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (javier,
    'Algo que pocas veces se habla en comunidades tech: la experiencia de ser hispanohablante nativo en equipos de ingeniería donde todo —código, documentación, reuniones, Slack— es en inglés.

No es solo una cuestión de idioma. Es de visibilidad.

En un standup rápido, el que habla más fluido domina la sala. En code reviews escritas, el matiz técnico que en español expresas con precisión, en inglés suena más torpe de lo que eres. En reuniones de producto, pasas de "interlocutor" a "el que entiende pero no lidera."

Lo que he aprendido:
→ Escribir mejor en inglés no es suficiente si no trabajas la confianza oral
→ Los equipos buenos nivelan esto — los malos lo usan inconscientemente como filtro
→ Tu acento no es el problema. La homogeneidad del equipo sí lo puede ser.

¿Alguien más en esta situación? ¿Qué os ha funcionado?',
    'TEXT', 'PUBLIC', grp_devs, '{"seed_groups": "true"}', NOW() - INTERVAL '5 days') RETURNING id INTO gp12;

  -- gp13 [EN] alex_m — Poll: AI tool used most
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (alex_m,
    'Which AI tool do you use most in your daily work as a dev/tech professional?',
    'POLL', 'PUBLIC', grp_devs,
    jsonb_build_object(
      'seed_groups', 'true',
      'poll', jsonb_build_object(
        'question', 'Which AI tool do you use most in your daily work?',
        'options', jsonb_build_array(
          'GitHub Copilot / Cursor',
          'Claude / ChatGPT for analysis & writing',
          'Specialized ML/data tooling',
          'None yet — still evaluating'
        ),
        'duration', '3d',
        'expires_at', (NOW() + INTERVAL '3 days')::TEXT
      )
    ),
    NOW() - INTERVAL '3 days') RETURNING id INTO gp13;

  -- ════════════════════════════════════════════════════════════════
  -- 5. POSTS — GRUPO: Salud & Bienestar Holístico  [todos EN]
  -- ════════════════════════════════════════════════════════════════

  -- gp14 [EN] priya — Welcome
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (priya,
    'Welcome to Salud & Bienestar Holístico 🌿

This is a space for integrative health professionals: nutritionists, therapists, movement specialists, traditional medicine practitioners, wellness coaches and anyone working with the whole human being.

The idea is simple: share what we learn in clinical practice, research that shifts our perspective, and the bridges between ancient traditions and modern science.

What''s your area, and what question has you thinking this month?',
    'TEXT', 'PUBLIC', grp_wellness, '{"seed_groups": "true"}', NOW() - INTERVAL '12 days') RETURNING id INTO gp14;

  -- gp15 [EN] linda — TCM and chronobiology
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (linda,
    'Something I''ve been exploring: the parallels between the circadian clock in Traditional Chinese Medicine and modern chronobiology.

In TCM, each organ has a "peak hour" of activity in the 24-hour cycle. The liver works between 1–3am; the lungs between 3–5am; the large intestine between 5–7am.

Chronobiology arrived at similar conclusions decades ago: gene expression, metabolism and hormonal rhythms follow a precise circadian pattern. "Chronotherapy" — timing treatments to the cycle — is showing significant clinical improvements.

2,500 years of clinical observation meeting molecular biology. It still fascinates me.',
    'TEXT', 'PUBLIC', grp_wellness, '{"seed_groups": "true"}', NOW() - INTERVAL '10 days') RETURNING id INTO gp15;

  -- gp16 [EN] rachel — Chronic cortisol and nutrient absorption
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (rachel,
    'Something we undervalue in nutrition work: the effect of chronic cortisol on nutrient absorption.

A patient can have a technically impeccable diet and still be deficient in magnesium, zinc or B12 because their nervous system has been in emergency mode for three years.

Chronic cortisol:
→ Depletes magnesium (compounding the stress cycle)
→ Reduces gastric acid secretion (protein absorption compromised)
→ Interferes with T4-to-T3 conversion (thyroid function)

The nutritional protocol is the second conversation. The first is: what''s sustaining this state of alert?',
    'TEXT', 'PUBLIC', grp_wellness, '{"seed_groups": "true"}', NOW() - INTERVAL '9 days') RETURNING id INTO gp16;

  -- gp17 [EN] diana — Therapeutic massage and the nervous system
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (diana,
    'What I share with patients before their first therapeutic massage session — because it changes how they receive the work:

The goal of the first 10–15 minutes isn''t to "loosen muscles." It''s to convince the nervous system it''s safe.

When the SNS is activated, tissue doesn''t yield to more pressure — it contracts more. The key isn''t force. It''s rhythm, temperature, the predictability of touch and time.

After that parasympathetic shift, 30 minutes of real work produces more change than 60 minutes fighting a system on guard.

Patience is technique, not virtue.',
    'TEXT', 'PUBLIC', grp_wellness, '{"seed_groups": "true"}', NOW() - INTERVAL '8 days') RETURNING id INTO gp17;

  -- gp18 [EN] david — The mind-gut axis in clinical practice
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (david,
    'The mind-gut axis has moved from fringe to mainstream in the last decade. What''s changed in clinical practice for those of us working with eating and digestion:

The gut produces approximately 90% of the body''s serotonin. The vagus nerve runs a two-way communication channel between brain and gut — and most of the traffic goes upward (gut to brain), not downward.

Practical implications I''ve stopped ignoring:
→ Chronic digestive complaints often precede mood disorders — not follow them
→ Emotional state at mealtime affects gastric acid secretion and motility
→ Probiotic interventions are showing consistent effects on anxiety metrics in clinical trials

This doesn''t make gastroenterology a mental health specialty. It makes the body-mind split look increasingly like the fiction it probably always was.',
    'TEXT', 'PUBLIC', grp_wellness, '{"seed_groups": "true"}', NOW() - INTERVAL '6 days') RETURNING id INTO gp18;

  -- gp19 [EN] chris — Somatic movement for desk workers
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (chris,
    'Most of what I see presented as "stretching routines for desk workers" misses the actual problem.

Tight hips and a sore neck from 8 hours of sitting aren''t primarily a flexibility problem. They''re a nervous system problem. The body has learned to hold itself that way because of sustained threat, low-grade vigilance, or simply not being given permission to release.

Passive stretching doesn''t change that pattern. Somatic movement does, because it works with the nervous system''s role in muscle tone rather than fighting it.

The most effective 10 minutes I know for desk-based tension: Pandiculation (Thomas Hanna''s work). Not because it''s magic — because it actually targets the sensory-motor loop that holds the pattern.

Happy to share a basic sequence if there''s interest.',
    'TEXT', 'PUBLIC', grp_wellness, '{"seed_groups": "true"}', NOW() - INTERVAL '4 days') RETURNING id INTO gp19;

  -- gp20 [EN] priya — Webinar event
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (priya,
    'Upcoming group webinar: "Ayurveda, TCM and Functional Nutrition — convergence points"

A conversation between Linda Zhang (TCM), Rachel Stevens (Nutrition) and myself (Ayurveda) on what our traditions and modern science say about the same things — in different languages.

Free for group members. Limited spots.',
    'EVENT', 'PUBLIC', grp_wellness,
    jsonb_build_object(
      'seed_groups', 'true',
      'event', jsonb_build_object(
        'title', 'Ayurveda, TCM & Functional Nutrition: Convergence Points',
        'date', '2026-03-15', 'time', '18:00',
        'location', 'Online — Zoom',
        'link', 'https://yourcvpassport.com/eventos/ayurveda-tcm-nutrition'
      )
    ),
    NOW() - INTERVAL '2 days') RETURNING id INTO gp20;

  -- ════════════════════════════════════════════════════════════════
  -- 6. CANAL: Novedades YourCVPassport  [laura ES | james EN | amanda EN]
  -- ════════════════════════════════════════════════════════════════

  -- cp1 [ES] laura — Lanzamiento Grupos & Canales
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (laura,
    '🆕 Grupos & Canales ya están disponibles en YourCVPassport

Ya puedes crear tu comunidad profesional, unirte a grupos de tu sector y seguir canales temáticos desde el dashboard.

¿Qué son los grupos? Comunidades donde los miembros publican, comentan y aprenden juntos. Privados o públicos.

¿Qué son los canales? Espacios curados donde el equipo o administradores publican contenido. Ideal para difundir novedades, recursos y oportunidades.

Esta es la v1 — se viene mucho más. ¿Qué grupo o canal crearías primero?',
    'TEXT', 'PUBLIC', ch_novedades, '{"seed_groups": "true"}', NOW() - INTERVAL '2 days') RETURNING id INTO cp1;

  -- cp2 [ES] laura — 5 tips perfil 2026
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (laura,
    '5 cosas que los reclutadores buscan en tu perfil YourCVPassport en 2026:

1. Resumen profesional en primera persona, con voz real (no corporativa)
2. Proyectos con resultados concretos — cifras, impacto, contexto
3. Foto profesional actualizada (aumenta las vistas x3 según nuestros datos)
4. Skills verificadas con certificaciones o proyectos vinculados
5. Disponibilidad y preferencias claras — los reclutadores odian adivinar

¿Tienes alguna de estas sin completar? El dashboard te dice exactamente qué falta.',
    'TEXT', 'PUBLIC', ch_novedades, '{"seed_groups": "true"}', NOW() - INTERVAL '6 days') RETURNING id INTO cp2;

  -- cp3 [EN] james — Success story
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (james,
    'Story of the week 🏆

A community member had been searching for work as an educator for 8 months after a career change. Updated his profile with the new builder, added his SEL certifications, and received 2 job offers within 3 weeks.

His reflection: "My previous profile was written as if I was talking to HR. The new one I wrote as if I was talking to someone who actually matters."

Small shift in perspective. Big difference.',
    'ACHIEVEMENT', 'PUBLIC', ch_novedades,
    jsonb_build_object('seed_groups', 'true', 'achievement_type', 'got_hired',
      'achievement_data', jsonb_build_object('company_name', 'Instituto Educativo Buena Vista', 'position', 'SEL Coordinator')),
    NOW() - INTERVAL '9 days') RETURNING id INTO cp3;

  -- cp4 [ES] laura — Nueva función menciones
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (laura,
    '⚡ Nueva función: menciones @usuario en el feed

Ahora puedes mencionar a cualquier miembro escribiendo @nombre. La persona recibirá una notificación.

Ideal para:
→ Dar crédito a alguien cuyo trabajo mencionas
→ Invitar a alguien a una conversación
→ Presentar a dos personas que deberían conocerse

Disponible en el feed general y en los grupos.',
    'TEXT', 'PUBLIC', ch_novedades, '{"seed_groups": "true"}', NOW() - INTERVAL '1 day') RETURNING id INTO cp4;

  -- cp5 [ES] laura — Poll roadmap Q2
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (laura,
    'Estamos priorizando el roadmap de Q2 2026. Tu voto cuenta 👇',
    'POLL', 'PUBLIC', ch_novedades,
    jsonb_build_object('seed_groups', 'true', 'poll', jsonb_build_object(
      'question', '¿Qué funcionalidad quieres ver primero en YourCVPassport?',
      'options', jsonb_build_array('Video-presentación en el perfil (30–90s)', 'Matching automático con ofertas', 'Portfolio visual con proyectos', 'Endorsements verificados de colegas'),
      'duration', '1w', 'expires_at', (NOW() + INTERVAL '7 days')::TEXT
    )),
    NOW() - INTERVAL '12 hours') RETURNING id INTO cp5;

  -- cp6 [EN] amanda — Webinar AI for interviews
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (amanda,
    'Free community webinar: "How to use AI to prepare for job interviews without sounding robotic"

We''ll cover:
→ What to ask AI models (and what not to delegate)
→ How to keep your authentic voice when AI helps you prepare
→ Practical exercises for competency-based interviews

Free and open to all members.',
    'EVENT', 'PUBLIC', ch_novedades,
    jsonb_build_object('seed_groups', 'true', 'event', jsonb_build_object(
      'title', 'AI for Interviews: Without Sounding Robotic',
      'date', '2026-03-08', 'time', '18:30',
      'location', 'Online — Google Meet',
      'link', 'https://yourcvpassport.com/eventos/ai-interviews-authentic'
    )),
    NOW() - INTERVAL '4 days') RETURNING id INTO cp6;

  -- cp7 [ES] laura — Tip: exportar CV en múltiples formatos
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (laura,
    '💡 Tip de la semana: exporta tu CV en el formato correcto según el canal

→ PDF estándar — para envío directo por email o portales que piden adjunto
→ PDF optimizado ATS — para plataformas con cribado automático (Workday, Greenhouse, Lever). Sin tablas, sin columnas, sin headers con imágenes
→ Enlace público — para LinkedIn, firma de email o cuando el reclutador pregunta "¿tienes perfil online?"

La diferencia entre CV que pasa el ATS y CV que no suele estar en el formato, no en el contenido.

En tu perfil YourCVPassport puedes exportar en los 3 formatos directamente.',
    'TEXT', 'PUBLIC', ch_novedades, '{"seed_groups": "true"}', NOW() - INTERVAL '8 days') RETURNING id INTO cp7;

  -- ════════════════════════════════════════════════════════════════
  -- 7. CANAL: AI at Work 2026  [todos EN | javier comenta en ES]
  -- ════════════════════════════════════════════════════════════════

  -- cp8 [EN] alex_m — Channel intro
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (alex_m,
    'AI at Work 2026 — what to expect here 📡

Every week:
→ AI tools worth trying (real analysis, no hype)
→ Concrete use cases by industry
→ What the research says about productivity + AI
→ Critical reflections on limits, bias and risks

Starting with the most frequent question I get: "Which AI tool should I learn first?"

My honest answer: it depends on your work. There''s no "best" — there''s the one that solves the most costly problem in your day.',
    'TEXT', 'PUBLIC', ch_ia, '{"seed_groups": "true"}', NOW() - INTERVAL '12 days') RETURNING id INTO cp8;

  -- cp9 [EN] alex_m — Claude vs ChatGPT
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (alex_m,
    'The question I get most: Claude or ChatGPT for work?

My analysis after intensive use of both:

ChatGPT:
→ Integration with more tools (plugins, images, Code Interpreter)
→ More seamless built-in web search

Claude:
→ Massive context window — analyze full 200-page documents in one pass
→ More cautious reasoning, fewer hallucinations on complex tasks
→ Better for writing that needs consistent voice and tone
→ More honest when it doesn''t know something

My current use: Claude for analysis, research and writing. ChatGPT when I need external tool integrations.

How are you using them?',
    'TEXT', 'PUBLIC', ch_ia, '{"seed_groups": "true"}', NOW() - INTERVAL '10 days') RETURNING id INTO cp9;

  -- cp10 [EN] daniel — Most underrated use of LLMs
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (daniel,
    'The most underrated use of LLMs in data teams: documentation.

We''ve had the same problem for decades: pipelines work, nobody knows why they make the decisions they do, and documentation only exists when someone forced it.

With LLMs you can:
→ Generate SQL/Python documentation with real context
→ Create data dictionaries from existing schemas
→ Write the "design decisions" that always get forgotten
→ Translate technical logic to business language for stakeholders

Not the most glamorous use. The one with highest ROI in the first month.',
    'TEXT', 'PUBLIC', ch_ia, '{"seed_groups": "true"}', NOW() - INTERVAL '8 days') RETURNING id INTO cp10;

  -- cp11 [EN] jessica — AI applied to biofeedback
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (jessica,
    'First experiences with AI applied to biofeedback data:

Using ML to identify patterns in HRV time series from chronic stress patients. Initial results:

✓ Model detects sympathetic activation 12–18 min before patient reports it subjectively
✓ Stress response profile clustering aligns well with known clinical categories
✗ False positives in high-performance athletes (their HRV patterns confuse the model)
✗ Needs at least 2 weeks of data to be useful

Provisional conclusion: valuable support tool, not a substitute for clinical evaluation.',
    'TEXT', 'PUBLIC', ch_ia, '{"seed_groups": "true"}', NOW() - INTERVAL '6 days') RETURNING id INTO cp11;

  -- cp12 [EN] kevin — AI stack for founders
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (kevin,
    'My AI stack for founders in 2026:

For thinking and writing:
→ Claude — strategic analysis, documents, nuanced writing
→ Perplexity — research with verifiable sources

For building:
→ Cursor — coding with full project context
→ v0 — rapid UI prototyping

For operations:
→ Notion AI — documentation and SOP generation
→ Otter.ai — meeting transcription and summaries

What I do NOT delegate to AI:
→ Difficult conversations with the team
→ Decisions about values and culture
→ The first draft of "our voice"

What would you add or remove?',
    'TEXT', 'PUBLIC', ch_ia, '{"seed_groups": "true"}', NOW() - INTERVAL '4 days') RETURNING id INTO cp12;

  -- cp13 [EN] daniel — Prompt engineering is overrated
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (daniel,
    'Unpopular opinion: prompt engineering as a standalone skill is overrated.

The people I see getting the most out of LLMs aren''t the ones who''ve memorized prompt frameworks. They''re the ones who:

→ Know their domain deeply (so they recognize when the model is wrong)
→ Can decompose a complex problem into well-scoped sub-questions
→ Treat the AI as a collaborator, not an oracle — they push back, iterate, test

The bottleneck isn''t knowing the right prompt. It''s knowing the right question. That''s domain expertise, critical thinking and intellectual honesty — not a new skill at all.

"Prompt engineering" will be as meaningful a credential in 3 years as "proficient in Google search" is today.',
    'TEXT', 'PUBLIC', ch_ia, '{"seed_groups": "true"}', NOW() - INTERVAL '2 days') RETURNING id INTO cp13;

  -- cp14 [EN] jessica — AI in mental health: ethical red lines
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (jessica,
    'The mental health AI space is moving faster than the ethics frameworks that should govern it. A few red lines I don''t think should be crossed, regardless of how good the technology gets:

→ AI should not be a primary point of contact for someone in active crisis. The response latency and lack of embodied presence matter enormously in those moments.

→ Emotion detection from voice/facial patterns for therapeutic purposes requires a standard of consent that most current deployments don''t meet.

→ Any AI-assisted mental health tool should make its limitations visible to the user, not bury them in terms of service.

→ The data generated in mental health contexts is among the most sensitive that exists. "We won''t sell it" isn''t sufficient — the question is who has access, under what circumstances, and how it''s secured.

I''m not anti-AI in mental health. I''m pro-thoughtfulness. The speed of deployment is outrunning the thoughtfulness.',
    'TEXT', 'PUBLIC', ch_ia, '{"seed_groups": "true"}', NOW() - INTERVAL '1 day') RETURNING id INTO cp14;

  -- cp15 [EN] alex_m — Poll: how are you using AI
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (alex_m,
    'We want to understand how professionals in this community are actually using AI 👇',
    'POLL', 'PUBLIC', ch_ia,
    jsonb_build_object('seed_groups', 'true', 'poll', jsonb_build_object(
      'question', 'What do you use AI for most in your current work?',
      'options', jsonb_build_array('Writing and communication', 'Research and information analysis', 'Code generation or review', 'Task organization and management'),
      'duration', '3d', 'expires_at', (NOW() + INTERVAL '3 days')::TEXT
    )),
    NOW() - INTERVAL '18 hours') RETURNING id INTO cp15;

  -- ════════════════════════════════════════════════════════════════
  -- 8. CANAL: Oportunidades & Reconversión Latam  [laura ES | james/kevin/angela EN]
  -- ════════════════════════════════════════════════════════════════

  -- cp16 [ES] laura — Intro canal
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (laura,
    'Canal Oportunidades & Reconversión Latam — qué encontrarás aquí 🗺️

Curación semanal de:
→ Ofertas de trabajo remotas y presenciales para Latam y España
→ Becas, bootcamps y programas con financiación
→ Programas de reconversión profesional (tech, salud, educación, datos)
→ Convocatorias de emprendimiento con impacto social
→ Eventos de networking y ferias de empleo

Criterio: solo lo que genuinamente vale la pena. Sin spam, sin relleno.',
    'TEXT', 'PUBLIC', ch_oportunidades, '{"seed_groups": "true"}', NOW() - INTERVAL '12 days') RETURNING id INTO cp16;

  -- cp17 [ES] laura — Oportunidades de la semana
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (laura,
    '📌 Oportunidades de la semana — 17 Feb 2026

TECH / DATOS:
→ Thoughtworks — Senior Data Engineer (remoto, Latam) | deadline: 28 Feb
→ Globant — ML Engineer jr-mid (Argentina/Colombia) | rolling
→ Mercado Libre — Analista de Datos, Marketplace (BsAs + remoto)

EDUCACIÓN:
→ Teach for All — programa liderazgo educativo 2026 (beca completa) | 15 Mar
→ FLACSO — maestría Tecnología Educativa (becas parciales)

SALUD / BIENESTAR:
→ Kaiser Permanente Chile — coordinador salud digital (Santiago)
→ Remote Health — coach bienestar corporativo (100% remoto, Latam)

EMPRENDIMIENTO:
→ Endeavor Latam — convocatoria scale-ups impacto social | 10 Mar',
    'TEXT', 'PUBLIC', ch_oportunidades, '{"seed_groups": "true"}', NOW() - INTERVAL '3 days') RETURNING id INTO cp17;

  -- cp18 [EN] james — Teaching fellowship
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (james,
    'A fellowship that deserves more visibility 👇

The Advanced Teacher Training Scholarship Fund: 45 full scholarships for Latam educators in:
→ Project-Based Learning design
→ Neuroscience applied to education
→ Formative assessment and feedback
→ Social-emotional and trauma-informed teaching

Format: 100% online, 6 months, in Spanish
Requirement: 3+ years of active teaching experience
Deadline: March 1, 2026',
    'TEXT', 'PUBLIC', ch_oportunidades, '{"seed_groups": "true"}', NOW() - INTERVAL '6 days') RETURNING id INTO cp18;

  -- cp19 [EN] kevin — Bootcamp with ISA
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (kevin,
    'For profiles transitioning into tech — this is worth reading.

I''m a mentor in the program and can confirm it''s legitimate.

Bootcamp Latam Tech 2026 — 200 spots with ISA (Income Share Agreement): 0% during the program, 10% of salary for 24 months once you land a job above $2,500/month.

Specializations: Full Stack Web, Data Analytics, UX/Product, Cybersecurity

Last cohort placement rate: 78% within 4 months. Not perfect, but real.

Application deadline: February 20.',
    'TEXT', 'PUBLIC', ch_oportunidades, '{"seed_groups": "true"}', NOW() - INTERVAL '4 days') RETURNING id INTO cp19;

  -- cp20 [ES] laura — Recursos: calculadora salario neto
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (laura,
    '🧮 Recurso útil que comparto con frecuencia: calculadoras de salario neto por país

Antes de negociar una oferta, siempre calcula lo que te llega realmente:

→ Argentina: calculadorasueldo.com.ar — actualizado con AFIP
→ México: sat.gob.mx (simulador ISR) — para freelance y nómina
→ Colombia: elempleo.com tiene simulador neto
→ España: hacienda.gob.es — simulador IRPF
→ Chile: sueldosnetos.cl

Un salario bruto de $3.000/mes puede ser $2.100 o $1.800 limpios dependiendo del país y del tipo de contrato. No negocies sin saber el neto.',
    'TEXT', 'PUBLIC', ch_oportunidades, '{"seed_groups": "true"}', NOW() - INTERVAL '7 days') RETURNING id INTO cp20;

  -- cp21 [EN] angela — Job fair event
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (angela,
    'YourCVPassport Job Fair & Networking — first edition

Connect directly with recruiters and founders from companies that value our community''s profiles.

→ 30+ companies (tech, health, education, social impact)
→ 7-minute speed-networking sessions per company
→ Workshops: live CV review, video interviews, LinkedIn vs YourCVPassport
→ Open networking after the event

Free for YourCVPassport members. Limited spots.',
    'EVENT', 'PUBLIC', ch_oportunidades,
    jsonb_build_object('seed_groups', 'true', 'event', jsonb_build_object(
      'title', 'YourCVPassport Job Fair & Networking — 1st Ed.',
      'date', '2026-04-18', 'time', '10:00',
      'location', 'Madrid — WeWork Castellana + online stream',
      'link', 'https://yourcvpassport.com/eventos/feria-empleo-2026'
    )),
    NOW() - INTERVAL '5 days') RETURNING id INTO cp21;

  -- cp22 [ES] laura — Cómo negociar remoto desde Latam
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (laura,
    '💬 Cómo negociar salario en un puesto remoto con empresa extranjera — lo que funciona:

1. Investiga el rango en el mercado de la empresa, no el tuyo local. Si es una empresa US, mira Levels.fyi, Glassdoor US o LinkedIn Salary de ese país.

2. No reveles tu salario actual primero. Pregunta el rango del puesto. Si insisten, da un rango — el tuyo empieza por encima de lo que aceptarías.

3. El "Latam discount" es real pero negociable. Muchas empresas lo aplican automáticamente. Puedes rebatirlo si tienes experiencia en equipos internacionales o expertise difícil de encontrar.

4. Negocia también: horario flexible, equipamiento, días libres adicionales. El total compensation importa.

5. No aceptes en el momento. Pide 48h para revisar la oferta completa. Siempre.',
    'TEXT', 'PUBLIC', ch_oportunidades, '{"seed_groups": "true"}', NOW() - INTERVAL '9 days') RETURNING id INTO cp22;

  -- cp23 [ES] laura — Poll tipo de oportunidad
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (laura,
    '¿Qué tipo de oportunidad buscas más activamente en este momento?',
    'POLL', 'PUBLIC', ch_oportunidades,
    jsonb_build_object('seed_groups', 'true', 'poll', jsonb_build_object(
      'question', '¿Qué tipo de oportunidad estás buscando principalmente?',
      'options', jsonb_build_array('Empleo (relación laboral)', 'Formación / reconversión', 'Freelance / consultoría', 'Emprendimiento / funding'),
      'duration', '1w', 'expires_at', (NOW() + INTERVAL '7 days')::TEXT
    )),
    NOW() - INTERVAL '2 days') RETURNING id INTO cp23;

  -- ════════════════════════════════════════════════════════════════
  -- 9. FEED PÚBLICO — MIEMBROS PROMOCIONAN SUS GRUPOS
  --    Estos posts NO tienen group_id — aparecen en el feed general
  -- ════════════════════════════════════════════════════════════════

  -- fp1 [EN] james — promotes grp_tutores
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (james,
    'I just launched a group on YourCVPassport for educators, tutors and mentors: Tutors & Mentors Pro.

If you teach, tutor, mentor or coach professionally — in any format, any discipline — come join us.

What we''re building: a space for serious pedagogical conversation. Not tips and hacks. The harder questions: how do we build psychological safety? What does contemplative presence bring to teaching? How do we mentor adults in transition differently?

A few of the people already in the group work in Montessori, psychodrama, SEL, transpersonal psychology, contemplative education — people who think carefully about how learning actually happens.

Link in my profile. Open to all.',
    'TEXT', 'PUBLIC', '{"seed_groups": "true"}', NOW() - INTERVAL '11 days') RETURNING id INTO fp1;

  -- fp2 [EN] alex_m — promotes grp_devs
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (alex_m,
    'Started a group for tech professionals who haven''t given up thinking about the impact of what they build: Devs & Conscious Tech.

Not a place for AI ethics theater. A place for the actual conversations that rarely happen in sprint planning:

→ How do you review your training data for bias before shipping?
→ What does it mean when your product''s ethics team has no real veto?
→ How do you build in wearables or health tech without becoming part of the surveillance infrastructure?

If you''re a dev, PM, data engineer or anyone in tech who thinks these questions matter — you''re welcome.

Group is open and public on YourCVPassport.',
    'TEXT', 'PUBLIC', '{"seed_groups": "true"}', NOW() - INTERVAL '11 days') RETURNING id INTO fp2;

  -- fp3 [EN] priya — promotes grp_wellness
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (priya,
    'For integrative health practitioners in this community: I''ve opened a group called Salud & Bienestar Holístico.

The premise: the bridges between ancient clinical traditions and modern science are more interesting than either alone.

Linda Zhang (TCM) is already in there posting about circadian parallels between Traditional Chinese Medicine and chronobiology. Rachel Stevens (Nutrition) on cortisol and nutrient absorption. Diana Russell on why nervous system regulation is the actual goal of the first 15 minutes of massage work.

If you work in integrative health — any modality — the group is public and open. Come share what you''re seeing clinically.',
    'TEXT', 'PUBLIC', '{"seed_groups": "true"}', NOW() - INTERVAL '10 days') RETURNING id INTO fp3;

  -- fp4 [ES] laura — promotes ch_novedades
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (laura,
    'Acabo de abrir el canal oficial de Novedades YourCVPassport en la plataforma.

Si quieres estar al tanto de:
→ Nuevas funcionalidades antes de que las anunciemos en redes
→ Tips semanales para optimizar tu perfil y aumentar la visibilidad
→ Webinars gratuitos de la comunidad
→ Historias reales de miembros que consiguieron trabajo con el perfil

Síguelo desde el menú de Canales en tu dashboard. Publicamos 2–3 veces por semana, sin spam.',
    'TEXT', 'PUBLIC', '{"seed_groups": "true"}', NOW() - INTERVAL '2 days') RETURNING id INTO fp4;

  -- fp5 [EN] kevin — promotes ch_ia
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (kevin,
    'If you''re trying to figure out how to actually use AI in your work — not the hype version, the real version — the AI at Work 2026 channel run by Alex Martinez is worth following.

This week alone: a breakdown of Claude vs ChatGPT for professional work (with actual use cases, not specs), a thread on why prompt engineering is overrated as a standalone skill, and a sharp set of ethical red lines for AI in mental health from Jessica Porter.

Real analysis from practitioners who use these tools daily and think carefully about what they''re doing.

Find it under Channels in your YourCVPassport dashboard.',
    'TEXT', 'PUBLIC', '{"seed_groups": "true"}', NOW() - INTERVAL '1 day') RETURNING id INTO fp5;

  -- fp6 [ES] laura — promotes ch_oportunidades
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (laura,
    'Para los que estáis buscando trabajo, en reconversión o explorando opciones: abrí el canal Oportunidades & Reconversión Latam en YourCVPassport.

Esta semana ya tiene:
→ Curación de ofertas tech, educación y salud (remoto + presencial Latam/España)
→ Beca completa para formación docente avanzada — deadline 1 de marzo
→ Bootcamp tech con financiación ISA — plazas casi llenas
→ Guía para calcular tu salario neto real antes de negociar
→ Cómo negociar salario remoto con empresa extranjera

Curación semanal, sin spam. Está en el menú de Canales del dashboard.',
    'TEXT', 'PUBLIC', '{"seed_groups": "true"}', NOW() - INTERVAL '2 days') RETURNING id INTO fp6;

  -- fp7 [EN] sarah — joins grp_tutores, mentions it publicly
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (sarah,
    'Just joined the Tutors & Mentors Pro group on YourCVPassport and already had one of the most interesting pedagogical conversations I''ve had this year.

Thomas Rivera posted about the Socratic method in mentoring — specifically why responding to a question with a better question does more than the right answer. Angela Roberts followed with a sharp framework for when feedback actually lands vs. when it gets stored as an attack.

If you work in education, tutoring, coaching or mentorship and you''re not in this group yet — it''s open and public.',
    'TEXT', 'PUBLIC', '{"seed_groups": "true"}', NOW() - INTERVAL '7 days') RETURNING id INTO fp7;

  -- fp8 [ES] javier — descubre grp_devs, lo comparte
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (javier,
    'Llevo una semana en el grupo Devs & Conscious Tech de YourCVPassport y ya ha merecido la pena.

Esta semana hubo una conversación sobre datasets médicos con sesgos sistemáticos que fue de lo más honesta que he leído en una comunidad tech. Daniel Foster planteó cuántos equipos de ML revisan la composición de sus datos de entrenamiento antes de producción. La respuesta honesta: muy pocos.

Y yo publiqué algo sobre la experiencia de ser dev hispanohablante en equipos donde todo es en inglés — tuvo más respuesta de la que esperaba. No somos los únicos viviendo eso.

El grupo es público, está en YourCVPassport bajo "Grupos".',
    'TEXT', 'PUBLIC', '{"seed_groups": "true"}', NOW() - INTERVAL '4 days') RETURNING id INTO fp8;

  -- ════════════════════════════════════════════════════════════════
  -- 10. LIKES
  -- ════════════════════════════════════════════════════════════════

  INSERT INTO public.feed_likes (post_id, user_id, reaction_type) VALUES
    -- grp_tutores
    (gp1, sarah,    'CELEBRATE'), (gp1, marcus,   'LIKE'),      (gp1, jennifer, 'LIKE'),
    (gp2, james,    'INSIGHTFUL'),(gp2, margaret, 'INSIGHTFUL'),(gp2, angela,   'LIKE'),
    (gp3, james,    'INSIGHTFUL'),(gp3, lisa,     'LIKE'),      (gp3, jennifer, 'INSIGHTFUL'),
    (gp4, james,    'INSIGHTFUL'),(gp4, steven,   'INSIGHTFUL'),(gp4, thomas,   'LOVE'),
    (gp5, james,    'INSIGHTFUL'),(gp5, sarah,    'LOVE'),      (gp5, margaret, 'INSIGHTFUL'),
    (gp5, angela,   'LIKE'),     (gp5, marcus,   'INSIGHTFUL'),
    (gp6, james,    'INSIGHTFUL'),(gp6, sarah,    'INSIGHTFUL'),(gp6, marcus,   'LIKE'),
    (gp6, jennifer, 'INSIGHTFUL'),(gp6, margaret, 'LOVE'),
    (gp7, james,    'LIKE'),      (gp7, sarah,    'LIKE'),      (gp7, angela,   'LIKE'),
    -- grp_devs
    (gp8, daniel,   'CELEBRATE'), (gp8, jessica,  'LIKE'),      (gp8, kevin,    'CELEBRATE'),
    (gp9, alex_m,   'INSIGHTFUL'),(gp9, jessica,  'INSIGHTFUL'),(gp9, kevin,    'INSIGHTFUL'),
    (gp10, alex_m,  'INSIGHTFUL'),(gp10, daniel,  'LIKE'),      (gp10, jessica, 'INSIGHTFUL'),
    (gp11, alex_m,  'INSIGHTFUL'),(gp11, daniel,  'INSIGHTFUL'),(gp11, kevin,   'INSIGHTFUL'),
    (gp12, alex_m,  'INSIGHTFUL'),(gp12, daniel,  'INSIGHTFUL'),(gp12, jessica, 'INSIGHTFUL'),
    (gp12, kevin,   'LIKE'),      (gp12, brian,   'SUPPORT'),
    (gp13, daniel,  'LIKE'),      (gp13, jessica, 'LIKE'),      (gp13, kevin,   'LIKE'),
    -- grp_wellness
    (gp14, linda,   'CELEBRATE'), (gp14, rachel,  'LIKE'),      (gp14, david,   'LIKE'),
    (gp15, priya,   'INSIGHTFUL'),(gp15, robert_k,'INSIGHTFUL'),(gp15, david,   'LIKE'),
    (gp16, priya,   'INSIGHTFUL'),(gp16, david,   'INSIGHTFUL'),(gp16, linda,   'LIKE'),
    (gp17, priya,   'LIKE'),      (gp17, rachel,  'INSIGHTFUL'),(gp17, chris,   'INSIGHTFUL'),
    (gp18, priya,   'INSIGHTFUL'),(gp18, linda,   'INSIGHTFUL'),(gp18, rachel,  'INSIGHTFUL'),
    (gp18, chris,   'LIKE'),      (gp18, rebecca, 'INSIGHTFUL'),
    (gp19, priya,   'INSIGHTFUL'),(gp19, linda,   'LIKE'),      (gp19, diana,   'INSIGHTFUL'),
    (gp19, rachel,  'LIKE'),      (gp19, david,   'INSIGHTFUL'),
    (gp20, linda,   'CELEBRATE'), (gp20, david,   'CELEBRATE'), (gp20, rachel,  'CELEBRATE'),
    -- ch_novedades
    (cp1, james,    'CELEBRATE'), (cp1, javier,   'CELEBRATE'), (cp1, alex_m,   'LIKE'),
    (cp2, james,    'INSIGHTFUL'),(cp2, marta,    'LIKE'),      (cp2, javier,   'INSIGHTFUL'),
    (cp3, sarah,    'CELEBRATE'), (cp3, jennifer, 'CELEBRATE'), (cp3, angela,   'CELEBRATE'),
    (cp4, james,    'CELEBRATE'), (cp4, daniel,   'LIKE'),      (cp4, kevin,    'LIKE'),
    (cp5, james,    'LIKE'),      (cp5, javier,   'LIKE'),      (cp5, marta,    'LIKE'),
    (cp6, james,    'CELEBRATE'), (cp6, sarah,    'LIKE'),      (cp6, jennifer, 'CELEBRATE'),
    (cp7, javier,   'INSIGHTFUL'),(cp7, marta,    'INSIGHTFUL'),(cp7, james,    'LIKE'),
    -- ch_ia
    (cp8, daniel,   'LIKE'),      (cp8, jessica,  'LIKE'),      (cp8, kevin,    'INSIGHTFUL'),
    (cp9, daniel,   'INSIGHTFUL'),(cp9, jessica,  'INSIGHTFUL'),(cp9, kevin,    'INSIGHTFUL'),
    (cp10, alex_m,  'INSIGHTFUL'),(cp10, jessica, 'LIKE'),      (cp10, kevin,   'INSIGHTFUL'),
    (cp11, alex_m,  'INSIGHTFUL'),(cp11, daniel,  'INSIGHTFUL'),(cp11, kevin,   'LIKE'),
    (cp12, alex_m,  'INSIGHTFUL'),(cp12, daniel,  'LIKE'),      (cp12, jessica, 'INSIGHTFUL'),
    (cp13, alex_m,  'INSIGHTFUL'),(cp13, jessica, 'INSIGHTFUL'),(cp13, kevin,   'INSIGHTFUL'),
    (cp13, james,   'LIKE'),      (cp13, daniel,  'INSIGHTFUL'),
    (cp14, alex_m,  'INSIGHTFUL'),(cp14, daniel,  'INSIGHTFUL'),(cp14, kevin,   'INSIGHTFUL'),
    (cp14, james,   'INSIGHTFUL'),(cp14, rachel,  'INSIGHTFUL'),
    (cp15, daniel,  'LIKE'),      (cp15, jessica, 'LIKE'),      (cp15, kevin,   'LIKE'),
    -- ch_oportunidades
    (cp16, james,   'CELEBRATE'), (cp16, javier,  'CELEBRATE'), (cp16, marta,   'LIKE'),
    (cp17, james,   'INSIGHTFUL'),(cp17, javier,  'CELEBRATE'), (cp17, marta,   'CELEBRATE'),
    (cp18, laura,   'CELEBRATE'), (cp18, sarah,   'CELEBRATE'), (cp18, angela,  'CELEBRATE'),
    (cp19, laura,   'INSIGHTFUL'),(cp19, james,   'LIKE'),      (cp19, angela,  'INSIGHTFUL'),
    (cp20, javier,  'INSIGHTFUL'),(cp20, marta,   'INSIGHTFUL'),(cp20, james,   'LIKE'),
    (cp20, kevin,   'LIKE'),      (cp20, angela,  'INSIGHTFUL'),
    (cp21, james,   'CELEBRATE'), (cp21, laura,   'CELEBRATE'), (cp21, marta,   'CELEBRATE'),
    (cp22, javier,  'INSIGHTFUL'),(cp22, marta,   'INSIGHTFUL'),(cp22, james,   'LIKE'),
    (cp22, kevin,   'INSIGHTFUL'),(cp22, angela,  'INSIGHTFUL'),
    (cp23, james,   'LIKE'),      (cp23, javier,  'LIKE'),      (cp23, kevin,   'LIKE'),
    -- feed público: promociones de grupos
    (fp1, sarah,    'CELEBRATE'), (fp1, margaret, 'LIKE'),      (fp1, marcus,   'CELEBRATE'),
    (fp1, jennifer, 'LIKE'),      (fp1, emily,    'INSIGHTFUL'),
    (fp2, daniel,   'CELEBRATE'), (fp2, jessica,  'LIKE'),      (fp2, kevin,    'CELEBRATE'),
    (fp2, javier,   'LIKE'),      (fp2, brian,    'INSIGHTFUL'),
    (fp3, linda,    'CELEBRATE'), (fp3, rachel,   'LIKE'),      (fp3, david,    'CELEBRATE'),
    (fp3, chris,    'LIKE'),      (fp3, diana,    'INSIGHTFUL'),
    (fp4, javier,   'LIKE'),      (fp4, marta,    'LIKE'),      (fp4, james,    'CELEBRATE'),
    (fp4, alex_m,   'LIKE'),
    (fp5, daniel,   'INSIGHTFUL'),(fp5, jessica,  'INSIGHTFUL'),(fp5, james,    'LIKE'),
    (fp5, javier,   'LIKE'),
    (fp6, javier,   'CELEBRATE'), (fp6, marta,    'CELEBRATE'), (fp6, james,    'LIKE'),
    (fp6, angela,   'LIKE'),
    (fp7, james,    'CELEBRATE'), (fp7, margaret, 'INSIGHTFUL'),(fp7, marcus,   'LIKE'),
    (fp7, thomas,   'LIKE'),      (fp7, angela,   'INSIGHTFUL'),
    (fp8, alex_m,   'INSIGHTFUL'),(fp8, daniel,   'LIKE'),      (fp8, jessica,  'INSIGHTFUL'),
    (fp8, kevin,    'LIKE'),      (fp8, laura,    'SUPPORT')
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════════
  -- 11. COMENTARIOS
  -- ════════════════════════════════════════════════════════════════

  -- grp_tutores
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp1, sarah,    'So glad this space exists. I''ve been running Montessori-based workshops for adults in career transition for 4 years, and peer exchange with other educators is what has grown me the most. Welcome everyone.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp1, marcus,   'Perfect framing James. Relational mentoring — where the safety of the bond sustains the learning — is what distinguishes the best tutors from the merely knowledgeable ones.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp2, james,    'The "build from strengths" approach is something I apply in SEL too. Students learn better when they feel competent from the start — not when they''re made aware of what they''re missing.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp3, sarah,    'The term I use is "secure container" and it''s the first thing I establish. Explicit agreements about confidentiality, pace and how feedback is given make all the difference.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp4, steven,   'Parker Palmer wrote brilliantly about this in "The Courage to Teach." The educator''s inner life as pedagogical space — a field that deserves far more room in teacher training.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp4, thomas,   'Students don''t primarily remember content — they remember how they felt in class. That''s determined by the teacher''s state more than the curriculum. The research is consistent.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp5, marcus,   'The Socratic move takes practice because the instinct to answer is strong. Especially when you know the answer. The discipline of asking instead is a different cognitive muscle entirely.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp5, margaret, 'This connects to contemplative pedagogy too — the question held in open attention vs. the answer delivered creates entirely different phenomenology in the learner. One opens, the other closes.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp6, james,    'The "right after a small win" timing is something I''ve noticed empirically but never articulated this clearly. Feedback after failure is often processed as evidence of what''s wrong with them, not data they can act on.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp6, sarah,    'The self-assessment step before feedback is non-negotiable in my practice. "What do you think went well?" does two things: it makes the positive salient, and it surfaces whether our perceptions align — which tells me how to calibrate the rest.');

  -- grp_devs
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp9, jessica,  'The geographic bias in health datasets is something I see constantly. The problem compounds when models get exported to contexts they were never trained on — which is almost always.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp9, kevin,    'My experience: fewer than 20% of teams systematically review training data composition before launch. Not from bad intent — it''s simply not on the standard release checklist.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp10, jessica, 'The ethics team veto signal is precise. I''ve seen ethics teams that produce reports nobody reads and have zero influence on the roadmap. Real power tells you everything.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp11, alex_m,  'The HRV-to-mental-health inference point is one of the most delicate. If the user doesn''t know the system knows, the informed consent framework collapses entirely.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp12, daniel,  'The language visibility problem is real and consistent across engineering teams. The people who shape technical direction in meetings are disproportionately fluent speakers. That''s a skill distribution problem masquerading as a merit problem.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp12, kevin,   'The best teams I''ve been in have an explicit norm: async writing is the primary communication channel, not sync meetings. That levels the playing field enormously for non-native speakers.');

  -- grp_wellness
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp15, priya,   'Fascinating Linda. In Ayurveda circadian rhythms are central — agni peaks between 10am and 2pm, which is why the main meal should be at midday. Chronobiology arrives at the same place.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp16, linda,   'Chronic cortisol also inhibits the hypothalamic-pituitary-thyroid axis. I see patients with subclinical hypothyroidism whose thyroid function improves significantly once the stress load is addressed. The root first.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp17, rachel,  '"Patience as technique" should be in every manual of bodywork. Less experienced practitioners add pressure when they meet resistance. It''s exactly the opposite of what the tissue needs.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp18, priya,   'The 90% serotonin in the gut statistic still surprises people in clinical conversations. The gut-brain relationship is bidirectional in Ayurvedic thinking too — "agni" as digestive fire has a clear emotional dimension. Modern research is catching up.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp19, diana,   'The pandiculation reference is excellent Chris. I use similar principles in massage — when I match the client''s held tension rather than fighting it, the tissue releases far more readily than under direct pressure.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (gp19, linda,   'Please share the sequence. I have several patients who would benefit from something they can do between acupuncture sessions. The self-care angle is one I want to develop more.');

  -- ch_novedades
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp1, james,    'What I like most about groups is that it allows more contextual conversations. Being able to talk about education with educators without losing the signal in the noise.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp2, javier,   'El punto del resumen en primera persona es el que más veo mal ejecutado. La gente sigue escribiendo en tercera persona o en jerga corporativa. "Profesional orientado a resultados" en 2026 es señal de perfil sin actualizar.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp4, daniel,   'Mentions are especially useful in groups for building conversations between members with complementary expertise. Good move.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp7, marta,    'Muy útil esto. Llevaba tiempo enviando el mismo PDF para todo sin pensar en el formato. El tema del ATS es algo que la mayoría de candidatos desconoce completamente.');

  -- ch_ia
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp9, daniel,   'The context window on Claude is the single most impactful capability for my work. Analyzing a 200-page document or a full codebase in one pass changes the workflow completely.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp10, alex_m,  'AI-generated documentation has one problem: it can sound plausible without being accurate if the model hallucinates about implementation details. Always requires human review, especially on business logic.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp11, daniel,  'The 2-week calibration window is important to communicate upfront. If clinicians evaluate in week one and dismiss it, they lose the real use case.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp13, jessica, 'The "know your domain deeply so you can tell when it''s wrong" point is the one I emphasize most in workshops. You can''t evaluate the output of a model you can''t evaluate on first principles.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp13, kevin,   'The Google search comparison is going to age well. "Prompt engineering certification" courses will look exactly like "internet research certification" courses look now.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp14, alex_m,  'The active crisis point is the one that should be non-negotiable across the entire mental health AI space. Response latency and the absence of embodied presence are not minor limitations in those moments.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp9, javier,   'Muy útil esta comparativa. Llevo meses usando ChatGPT para todo pero voy a probar Claude para documentación técnica. El contexto largo es clave cuando trabajas con proyectos de instalaciones complejas.');

  -- ch_oportunidades
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp17, javier,  'La de Thoughtworks me interesa. ¿Alguien sabe si el proceso de selección es muy largo? En estas consultoras suele haber 4 o 5 rondas y los plazos se alargan mucho.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp17, marta,   'Mercado Libre tiene buenas condiciones para el equipo de datos. Un compañero entró el año pasado y el nivel técnico es alto. Vale la pena postular aunque el proceso sea exigente.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp18, sarah,   'Sharing the fellowship in my educator networks. The trauma-informed teaching specialization especially — it barely exists in Spanish and the demand is enormous.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp19, angela,  'The ISA model is more equitable than upfront payment, but read the terms carefully. Is there a cap on total repayment? What happens if you take more than 12 months to land work?');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp22, javier,  'El punto del "Latam discount" es importante. He negociado dos veces con empresas US y en ambos casos el rango inicial asumía que aceptaría menos por estar en España. Tener datos del mercado del país de la empresa fue lo que cambió la negociación.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (cp22, marta,   'Guardar este post. Lo de no revelar el salario actual primero es algo que sigo viendo en consejos de RR.HH. locales y en negociación internacional es exactamente al revés.');

  -- feed público: reacciones a las promociones
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (fp1, marcus,   'Just joined. The quality of the conversation in there already is unlike anything I''ve seen in professional communities online. Thomas''s Socratic method post alone was worth it.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (fp1, jennifer, 'In. Family systems therapy and mentoring have more in common than people think — the relational container shapes what''s possible in both.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (fp2, jessica,  'The dataset bias conversation this week was exactly the kind of thing I needed to read. Joined and already shared it with my team.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (fp2, javier,   'Me apunté la semana pasada. Y publiqué sobre la experiencia de ser dev hispanohablante en equipos en inglés — tuvo más resonancia de la que esperaba. El grupo tiene conversaciones que no ocurren en otro sitio.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (fp3, rachel,   'The circadian conversation Linda and Priya had in there this week is genuinely the best clinical discussion I''ve had in any online space. Joining was a good decision.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (fp6, javier,   'Lo de la calculadora de salario neto por país es exactamente lo que necesitaba esta semana. Estaba comparando dos ofertas y los brutos no me decían nada útil.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (fp7, thomas,   'The feedback timing framework from Angela is something I''m going to use directly. The distinction between feedback after a win vs. after a failure is obvious once stated — but easy to do wrong under time pressure.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (fp8, alex_m,   'The language visibility problem is one I see in every international team I work with. Javier put words on something that usually goes unacknowledged. The best async-first teams are the most equitable ones.');

  -- ════════════════════════════════════════════════════════════════
  -- 12. VOTOS EN ENCUESTAS
  -- ════════════════════════════════════════════════════════════════

  INSERT INTO public.feed_poll_votes (post_id, user_id, option_index) VALUES
    -- gp7: how many mentor (0=1-3, 1=4-8, 2=9-15, 3=+15)
    (gp7, sarah,    0), (gp7, marcus,   1), (gp7, margaret, 0), (gp7, angela, 1),
    -- gp13: AI tool devs (0=Copilot, 1=Claude/GPT, 2=ML, 3=evaluating)
    (gp13, daniel,  0), (gp13, jessica, 1), (gp13, kevin, 1), (gp13, javier, 3),
    -- cp5: roadmap (0=video, 1=matching, 2=portfolio, 3=endorsements)
    (cp5, james, 1), (cp5, javier, 0), (cp5, marta, 2), (cp5, amanda, 3),
    -- cp15: AI use (0=writing, 1=research, 2=code, 3=tasks)
    (cp15, daniel, 2), (cp15, jessica, 0), (cp15, kevin, 2), (cp15, javier, 0),
    -- cp23: oportunidades (0=empleo, 1=formación, 2=freelance, 3=emprendimiento)
    (cp23, james, 1), (cp23, javier, 0), (cp23, angela, 2), (cp23, emily, 1)
  ON CONFLICT (post_id, user_id) DO NOTHING;

  RAISE NOTICE 'Seed completo: 6 comunidades, 48 posts en grupos/canales, 8 posts de promoción en feed público.';

END $$;
