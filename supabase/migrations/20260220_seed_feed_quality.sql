-- =============================================
-- Quality Feed Seed Data — v3
-- Personalized content for all 40 real professionals
-- Bilingual: Laura/Javier/Marta → ES | everyone else → EN
-- Safe to re-run: deletes previous seed first
-- =============================================

DO $$
DECLARE
  -- ── Spanish professionals ─────────────────────────────────────────────
  laura     CONSTANT UUID := 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'; -- Laura Martínez Vidal
  javier    CONSTANT UUID := 'a826c47c-0d50-47da-aab3-4dfb71da709d'; -- Javier Torres Gimeno
  marta     CONSTANT UUID := 'e379dca2-0b33-45b4-864a-ba9204e0ab4b'; -- Marta Ruiz Serrano

  -- ── English educators / specialists ──────────────────────────────────
  james     CONSTANT UUID := '8d93820f-beb7-4eb8-8a3c-8e7efa6a6665'; -- James Wilson (SEL)
  sarah     CONSTANT UUID := 'a2b0d3d3-488f-429a-9b2f-a4e0a78e55a9'; -- Sarah Bennett (Montessori/Waldorf)
  robert_g  CONSTANT UUID := '9a3e27d1-f1da-49cb-bb95-cf29319df39c'; -- Robert Green (Permaculture)
  marcus    CONSTANT UUID := '8343e9aa-cc89-4273-9386-581883592a67'; -- Marcus Williams (Psychodrama)
  lisa      CONSTANT UUID := '97d188d3-a038-4726-bb7e-59e13814123a'; -- Lisa Morrison (Art Therapist)
  michael   CONSTANT UUID := '2ac9f2e0-0293-4fae-a4f0-af388f32cedf'; -- Michael Thompson (Addiction)
  jennifer  CONSTANT UUID := '0da0dcfa-82dc-43df-a5f8-adaee989c690'; -- Jennifer Martinez (Family Systems)
  rachel    CONSTANT UUID := '3f40d45b-ad4e-43a9-a88b-a822a56cc7d3'; -- Rachel Stevens (Dietitian)
  david     CONSTANT UUID := '206de10c-1322-491b-ac79-c4de3886ca0d'; -- David Chen (Mindful Eating)
  emily     CONSTANT UUID := 'c9e55b0e-efff-4f43-b0ce-3d99868ce3d8'; -- Emily Harper (Ecopsychology)
  amanda    CONSTANT UUID := '3d0d18fd-2b12-4fd5-b5c4-b6635fa3f52e'; -- Amanda Rodriguez (Leadership)
  kevin     CONSTANT UUID := '86a7ec23-2fe8-4a60-afe3-45e61e906b54'; -- Kevin Park (Entrepreneurship)
  margaret  CONSTANT UUID := 'e4f2dcf3-6264-46d0-970c-65592c87a9c4'; -- Margaret Sullivan (Contemplative)
  thomas    CONSTANT UUID := 'c2eec942-9fb8-4bc5-a208-db9958438d51'; -- Thomas Rivera (Perennial Philosophy)
  patricia  CONSTANT UUID := 'e23b0890-fb78-4ab5-85fc-613e56b68aba'; -- Patricia Coleman (Qualitative Research)
  daniel    CONSTANT UUID := 'd0961de8-508e-4870-864e-65b833bfafb0'; -- Daniel Foster (Research/Data)
  linda     CONSTANT UUID := '8068213e-0e53-48c7-b9f5-ccd631865484'; -- Linda Zhang (Acupuncture/TCM)
  priya     CONSTANT UUID := 'efb2e93a-1ad5-4f0d-a948-daa763d5a2d4'; -- Priya Sharma (Ayurveda)
  chris     CONSTANT UUID := 'c0cde1c6-9391-4e6e-933c-d29332068a01'; -- Christopher Barnes (Movement/Somatic)
  elizabeth CONSTANT UUID := '43d2d0bd-e9fa-4c54-8f60-3f014121841e'; -- Elizabeth Morgan (End-of-Life)
  richard   CONSTANT UUID := '9c5139ed-3d1d-49c9-9eba-69d88b6f4e19'; -- Richard Hamilton (Grief)
  maria_g   CONSTANT UUID := '11ff7f82-a2dd-4499-aea6-c10ee3dee219'; -- Maria Gonzalez (Family Therapy)
  janet     CONSTANT UUID := 'ddc5f45f-f707-4f37-a90d-c7ec2ea0ba98'; -- Janet Lee (Gerontology)
  steven    CONSTANT UUID := '83de70ef-0504-4f9d-b45c-d1f35eef9535'; -- Steven Mitchell (Transpersonal)
  angela    CONSTANT UUID := 'c1889bbe-f828-41dc-83f6-b844f1e74d49'; -- Angela Roberts (Life Design)
  brian     CONSTANT UUID := 'dab1878e-f2dc-451c-9753-392c91ac4aa3'; -- Brian Cooper (EFT)
  rebecca   CONSTANT UUID := '54701b32-af6e-4923-846d-8a04fad249a8'; -- Rebecca Anderson (Naturopathic)
  karen     CONSTANT UUID := '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1'; -- Karen White (Nutritionist)
  paul      CONSTANT UUID := '36c177f5-19f4-47c7-85c7-05507347e702'; -- Paul Henderson (Herbalist)
  jessica   CONSTANT UUID := '55333d11-13c8-43b8-942b-cb1e75d0b812'; -- Jessica Porter (Biofeedback)
  alex_m    CONSTANT UUID := '099840cc-a99c-480d-8fd9-fba5ecd5a4a6'; -- Alex Martinez (AI in Healthcare)
  diana     CONSTANT UUID := '636e9e4d-4873-4114-8949-376a8d0f24bc'; -- Diana Russell (Massage)
  robert_k  CONSTANT UUID := '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da'; -- Robert Kim (Acupressure)
  catherine CONSTANT UUID := 'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15'; -- Catherine Adams (LMFT)
  mark      CONSTANT UUID := '707aa7e3-b891-485c-b4e6-618625713565'; -- Mark Davidson (NVC)
  michelle  CONSTANT UUID := '7fe0c1a6-39ed-46ad-9388-116a3a0fb429'; -- Michelle Chang (Reiki)
  nicole    CONSTANT UUID := '1b90b431-de09-4b75-af6a-c94975b68746'; -- Nicole Taylor (Dance/Movement)

  -- Post IDs
  p1  UUID; p2  UUID; p3  UUID; p4  UUID; p5  UUID;
  p6  UUID; p7  UUID; p8  UUID; p9  UUID; p10 UUID;
  p11 UUID; p12 UUID; p13 UUID; p14 UUID; p15 UUID;
  p16 UUID; p17 UUID; p18 UUID; p19 UUID; p20 UUID;
  p21 UUID; p22 UUID; p23 UUID; p24 UUID; p25 UUID;
  p26 UUID; p27 UUID; p28 UUID; p29 UUID; p30 UUID;
  p31 UUID; p32 UUID; p33 UUID; p34 UUID; p35 UUID;
  p36 UUID; p37 UUID; p38 UUID; p39 UUID; p40 UUID;
  p41 UUID; p42 UUID; p43 UUID; p44 UUID; p45 UUID;
  p46 UUID; p47 UUID; p48 UUID;

  -- Comment threading
  c1 UUID; c2 UUID; c3 UUID; c4 UUID; c5 UUID;

BEGIN

  -- ─────────────────────────────────────────
  -- 0. Remove previous seed data (cascades to likes/comments/shares/votes)
  -- ─────────────────────────────────────────
  DELETE FROM public.feed_posts WHERE metadata->>'seed' = 'true';

  -- ══════════════════════════════════════════════════════════════════════
  -- TEXT POSTS — one per professional, content tied to their specialty
  -- ══════════════════════════════════════════════════════════════════════

  -- p1 [ES] Laura Martínez — Obra residencial
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (laura,
    'En 2026, cada proyecto de obra residencial que arranca viene con la misma pregunta del cliente: ¿cómo lo hacemos más eficiente energéticamente sin disparar el presupuesto?

Mi respuesta siempre es la misma: empieza por el análisis térmico antes de elegir ningún material. El 80% de las decisiones que se toman en fase de diseño afectan al comportamiento energético del edificio durante los próximos 30 años. Cambiarlas después cuesta 5 veces más.

Lo que estoy viendo este año: los clientes llegan mucho más informados. Saben qué es el certificado energético, la diferencia entre aislamiento por el interior o el exterior. Eso hace el trabajo técnico más interesante y más honesto.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '2 hours') RETURNING id INTO p1;

  -- p2 [ES] Javier Torres — Instalaciones térmicas RITE
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (javier,
    'La actualización de la normativa RITE sigue generando dudas en proyectos de instalaciones existentes. Un punto que veo mal interpretado constantemente: el rendimiento estacional del sistema, no el rendimiento en condiciones nominales, es lo que determina si la instalación cumple.

Dos instalaciones con el mismo equipo pueden cumplir o no dependiendo de cómo esté dimensionado el circuito hidráulico, el tipo de emisores y el control. No es solo el equipo: es el sistema completo.

Si estáis trabajando en alguna legalización o reforma y tenéis dudas sobre el cálculo, encantado de orientaros.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '5 hours') RETURNING id INTO p2;

  -- p3 [ES] Marta Ruiz — Eficiencia energética
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (marta,
    'Acabo de cerrar un proyecto de rehabilitación energética en un edificio de viviendas de los años 70. Resultado: reducción del 61% en la demanda de calefacción y salto de etiqueta energética de E a B.

Lo que más valoro de este trabajo: no es solo ahorro económico para los propietarios, es calidad de vida. Viviendas que en invierno llegaban a 14°C sin calefacción ahora mantienen 20°C con un sistema que consume la mitad.

Queda mucho parque edificatorio en España con los mismos problemas. Hay trabajo para rato.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '8 hours') RETURNING id INTO p3;

  -- p4 [EN] James Wilson — Social-Emotional Learning
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (james,
    'The most persistent misconception about Social-Emotional Learning: that it takes time away from academics.

The research tells a different story. A 2024 meta-analysis of 250+ SEL programs showed consistent academic gains alongside social-emotional outcomes. Students who can regulate their emotions, resolve conflict constructively, and collaborate don''t learn less — they learn more effectively.

The real question isn''t whether to teach SEL. It''s how to make it genuinely part of daily classroom culture rather than a Friday afternoon add-on.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '11 hours') RETURNING id INTO p4;

  -- p5 [EN] Sarah Bennett — Montessori & Waldorf
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (sarah,
    'People often ask me: "Montessori or Waldorf — which is better?" The honest answer: it depends on the child.

Montessori works beautifully for children who are self-directed, detail-oriented, and thrive with concrete materials and freedom within structure. Waldorf resonates with children who flourish through storytelling, rhythm, and artistic expression.

What both share: a deep respect for the child as a whole person, not a vessel to fill with content. That principle doesn''t need a label — it can live in any classroom.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '14 hours') RETURNING id INTO p5;

  -- p6 [EN] Robert Green — Permaculture
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (robert_g,
    'Finished installing a 200m² food forest with a family in rural Andalucía. 14 tree species, 8 shrub layers, groundcover plants, all designed around a central water-harvesting swale.

They went from a degraded monoculture field to a productive, self-maintaining ecosystem in one planting season. In 5 years, this will produce most of their fruit, nuts, and medicinal herbs.

Permaculture isn''t idealistic — it''s intensely practical. It just thinks in decades, not quarters.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '1 day') RETURNING id INTO p6;

  -- p7 [EN] Marcus Williams — Psychodrama
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (marcus,
    'Something I''ve observed in 12 years of psychodrama practice: the moment a client embodies a role — actually stands up, moves, speaks as the other person — insight deepens faster than 20 sessions of talking about it.

The body holds what the mind rationalizes away. Drama therapy doesn''t just talk about the experience. It re-enters it, safely, with the group as witness.

It''s not theater. It''s one of the most evidence-supported modalities we have for trauma, grief, and relational repair.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '1 day 3 hours') RETURNING id INTO p7;

  -- p8 [EN] Lisa Morrison — Art Therapy
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (lisa,
    'A client recently told me: "I couldn''t say it, but I could paint it."

That''s art therapy in one sentence. When language fails — because the experience is pre-verbal, because words feel too exposing, because the emotion doesn''t have a name yet — image-making creates a bridge.

The product (the artwork) matters less than the process. We''re not making art. We''re making space.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '1 day 6 hours') RETURNING id INTO p8;

  -- p9 [EN] Michael Thompson — Addiction Counseling
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (michael,
    'Something the field of addiction counseling has been slow to fully accept: shame is not a treatment. It''s a relapse trigger.

Every clinical approach that leans on guilt, confrontation, and moral framing as primary tools has worse outcomes than approaches built on autonomy, self-compassion, and genuine connection.

People in recovery don''t need more evidence that they''ve failed themselves. They need the experience — often for the first time — of being genuinely seen without judgment.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '1 day 10 hours') RETURNING id INTO p9;

  -- p10 [EN] Jennifer Martinez — Family Systems
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (jennifer,
    'Family systems therapy starts from a premise most people find surprising: the "identified patient" — the family member presenting the problem — is often the one most sensitive to what the whole system is struggling with.

When a teenager acts out, an adult withdraws, or a child develops symptoms, the question isn''t just "what''s wrong with this person?" It''s "what is this person expressing that the system can''t yet say directly?"

That reframe changes everything about how the work unfolds.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '1 day 14 hours') RETURNING id INTO p10;

  -- p11 [EN] Rachel Stevens — Dietitian
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (rachel,
    'The most common nutrition mistake I see: optimizing for the wrong variable.

People track calories, macros, micros — and completely ignore food quality, meal timing relative to their schedule, or how stress affects digestion and nutrient absorption.

I''ve worked with clients who were "eating perfectly" by every metric and feeling terrible. And clients eating simply, intuitively, and thriving.

Nutrition science is real. But a protocol that ignores the person applying it isn''t a good protocol.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '2 days') RETURNING id INTO p11;

  -- p12 [EN] David Chen — Mindful Eating
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (david,
    'Mindful eating isn''t a diet. It''s not slower eating or chewing 30 times.

It''s learning to distinguish physical hunger from emotional hunger. Noticing the difference between eating to nourish and eating to cope. Rebuilding trust with your body after years of external rules overriding internal signals.

That''s a deeper practice than any meal plan. And it produces lasting change that meal plans rarely do.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '2 days 4 hours') RETURNING id INTO p12;

  -- p13 [EN] Emily Harper — Ecopsychology
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (emily,
    'Ecopsychology takes the ecological crisis personally — not metaphorically, literally.

The research is consistent: regular time in nature reduces cortisol, improves attention, strengthens immune function. But more than that — there''s a relational dimension. A sense of belonging to something larger than the self.

In a culture of disconnection and screen saturation, nature-based therapy isn''t alternative. It''s returning to something fundamental.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '2 days 8 hours') RETURNING id INTO p13;

  -- p14 [EN] Amanda Rodriguez — Conscious Leadership
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (amanda,
    'The leaders who change organizations aren''t always the most technically skilled. They''re the ones who''ve done enough inner work to not lead from their wounds.

A leader unconsciously running a scarcity narrative creates competition within the team. One who hasn''t resolved their need for approval will struggle to give hard feedback. One afraid of conflict lets problems fester until they explode.

Conscious leadership isn''t soft. It''s the hardest — and most leveraged — work a leader can do.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '2 days 12 hours') RETURNING id INTO p14;

  -- p15 [EN] Kevin Park — Conscious Entrepreneurship
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (kevin,
    'There''s a version of entrepreneurship that burns people out in 3 years and leaves a trail of broken relationships.

And there''s a version built on clarity of purpose, sustainable energy, and alignment between personal values and business decisions.

The difference isn''t market conditions or luck. It''s whether the founder has done the internal work to know what they''re actually building — and why. Business strategy built on unexamined ego is strategy built on sand.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '2 days 16 hours') RETURNING id INTO p15;

  -- p16 [EN] Margaret Sullivan — Contemplative Practices
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (margaret,
    'Every contemplative tradition I''ve studied — Buddhist, Christian mystical, Sufi, Indigenous — converges on something the modern mind resists: stillness is not empty. It''s where depth lives.

We''ve built a culture that treats busyness as virtue and silence as waste. The practices I teach aren''t about escaping the world. They''re about developing the inner capacity to meet it without being swept away.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '3 days') RETURNING id INTO p16;

  -- p17 [EN] Thomas Rivera — Perennial Philosophy
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (thomas,
    'What Aldous Huxley called the "Perennial Philosophy" — the common core across mystical traditions — keeps drawing new students for a reason: the questions it addresses don''t go away.

Who am I beyond my conditioned personality? What is consciousness? How do I live ethically in a fragmented world?

These aren''t abstract questions. The people most at peace with them tend to make better decisions, build better relationships, and suffer less — not because life gets easier, but because their relationship to difficulty changes.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '3 days 4 hours') RETURNING id INTO p17;

  -- p18 [EN] Patricia Coleman — Qualitative Research
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (patricia,
    'A recurring critique of qualitative research: "but is it generalizable?"

This misunderstands what qualitative methodology is for. It''s not designed to produce statistical generalizability. It''s designed to produce transferability — rich, contextualized understanding that readers can assess for relevance to their own situation.

A single in-depth case study can illuminate a phenomenon in ways a dataset of 10,000 survey responses never will. Different questions require different tools.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '3 days 8 hours') RETURNING id INTO p18;

  -- p19 [EN] Daniel Foster — Research & Data
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (daniel,
    'The most dangerous phrase in data analysis: "the data shows."

Data doesn''t show anything on its own. Someone made decisions about what to collect, how to clean it, which variables to include, what model to run, and how to frame the output. Every one of those decisions is a choice — and each can introduce bias.

Good data literacy isn''t just reading charts. It''s asking: who made these choices, and what assumptions are embedded in them?',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '3 days 12 hours') RETURNING id INTO p19;

  -- p20 [EN] Linda Zhang — Acupuncture & TCM
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (linda,
    'In TCM, we don''t treat diagnoses. We treat people.

Two patients can present with identical Western diagnoses — say, chronic insomnia — and receive completely different treatments, because their patterns are different. One might be a Heart Yin deficiency pattern; another, Liver Qi stagnation.

This isn''t mysticism. It''s a sophisticated system for individualizing treatment that took 2,500 years to develop. Modern research is beginning to validate what practitioners have observed clinically for millennia.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '3 days 16 hours') RETURNING id INTO p20;

  -- p21 [EN] Priya Sharma — Ayurveda
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (priya,
    'Ayurveda''s most misunderstood concept: Prakriti (constitution) is not a personality test. It''s a functional map of how your body processes, metabolizes, and responds to stress.

Knowing your Prakriti doesn''t tell you who you are. It tells you what your body needs to maintain balance — which foods support your digestion, which rhythms suit your nervous system, which seasons require extra care.

It''s highly practical. And it personalizes health guidance in ways that generic wellness advice never can.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '4 days') RETURNING id INTO p21;

  -- p22 [EN] Christopher Barnes — Movement & Somatic
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (chris,
    'Somatic education starts from a premise Western medicine is slowly rediscovering: the body isn''t just a vehicle for the brain. It''s a site of intelligence, memory, and habitual pattern.

The tension a client carries in their jaw, the collapsed chest, the held breath — these aren''t incidental. They''re organized responses to experience. And they can be reorganized through movement, attention, and touch.

This is why working with the body — not just talking about it — produces change that talk therapy alone often can''t reach.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '4 days 4 hours') RETURNING id INTO p22;

  -- p23 [EN] Elizabeth Morgan — End-of-Life Doula
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (elizabeth,
    'The dying process is one of the most profound experiences a human being goes through. And yet our culture has largely removed it from everyday life — outsourced to institutions, made invisible, treated as a problem to manage rather than a passage to witness.

An end-of-life doula doesn''t make dying easier. We make it less alone. We help individuals and families prepare, process, and be present in ways the medical system — however skilled — isn''t designed to provide.

This work changes everyone who does it. You stop taking the ordinary for granted.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '4 days 8 hours') RETURNING id INTO p23;

  -- p24 [EN] Richard Hamilton — Grief Counselor
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (richard,
    'The grief timeline doesn''t exist. There is no stage you should be in by month three, no point at which grief "should" be done.

Grief is the price of love. Its depth is proportional to the depth of the attachment. And it doesn''t follow a linear path — it spirals. You can be functioning well years after a loss, and be brought to your knees by a smell, a song, a Tuesday morning that looks like the Tuesdays you used to share.

The goal of grief counseling isn''t to end grief. It''s to help it become something you carry rather than something that carries you.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '4 days 12 hours') RETURNING id INTO p24;

  -- p25 [EN] Maria Gonzalez — Culturally Responsive Family Therapy
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (maria_g,
    'Culturally responsive therapy isn''t a specialty add-on. It''s foundational competence.

A therapeutic framework developed within a specific cultural context — assumptions about the individual vs. the collective, appropriate emotional expression, the meaning of family — doesn''t travel neutrally across cultures. Applied uncritically, it can pathologize what is healthy within the client''s context.

The most important question I ask in a first session isn''t "what''s the problem?" It''s "how does your family understand what''s happening?"',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '4 days 16 hours') RETURNING id INTO p25;

  -- p26 [EN] Janet Lee — Gerontology & Elder Care
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (janet,
    'We''re in the middle of the largest demographic shift in human history. By 2030, for the first time, people over 65 will outnumber children under 5 globally. Our systems — healthcare, housing, financial, social — are nowhere near ready.

Gerontology isn''t about managing decline. It''s about supporting flourishing across the full arc of a human life. That requires rethinking what "aging well" means: not just extending years, but expanding the conditions for meaning, dignity, and connection in the later decades.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '5 days') RETURNING id INTO p26;

  -- p27 [EN] Steven Mitchell — Transpersonal Psychology
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (steven,
    'Transpersonal psychology occupies a unique position: it takes human experience seriously beyond the ego, without abandoning rigorous psychological inquiry.

Peak experiences, states of expanded consciousness, spiritual emergencies, near-death experiences — these aren''t pathology. They''re among the most significant experiences people have, and they deserve a framework that can hold them thoughtfully.

Grof, Maslow, Wilber built part of that framework. We''re still building it.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '5 days 4 hours') RETURNING id INTO p27;

  -- p28 [EN] Angela Roberts — Life Design Coach
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (angela,
    'Most people arrive at life design coaching with the same presenting question: "What should I do with my life?"

But the more useful question is usually: "What kind of person am I becoming — and is that person living a life that''s actually mine?"

We spend enormous energy optimizing careers, relationships, and productivity systems while the foundational question of authorship goes unexamined. Design starts with the designer, not the design.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '5 days 8 hours') RETURNING id INTO p28;

  -- p29 [EN] Brian Cooper — EFT
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (brian,
    'EFT (Emotional Freedom Techniques) often gets dismissed because the mechanism looks strange: tapping on acupressure points while holding a distressing thought in mind.

But the research base has grown substantially. Multiple RCTs show significant reductions in PTSD symptoms, anxiety, and phobias — often faster than conventional CBT approaches.

The proposed mechanism (stimulating acupoints while activating a fear memory disrupts its emotional charge) is neurologically plausible. You don''t have to believe in meridians for the technique to work.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '5 days 12 hours') RETURNING id INTO p29;

  -- p30 [EN] Rebecca Anderson — Naturopathic
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (rebecca,
    'Naturopathic medicine''s core principle — vis medicatrix naturae, the healing power of nature — isn''t mystical. It''s an observation about biological systems: given the right conditions, organisms tend toward repair and balance.

The clinical question becomes: what conditions are needed? And what''s blocking them?

Sometimes that''s nutritional deficiency. Sometimes chronic stress. Sometimes environmental toxin load. Naturopathic assessment tries to identify root causes rather than suppress symptoms — asking a different set of questions first.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '5 days 16 hours') RETURNING id INTO p30;

  -- p31 [EN] Paul Henderson — Herbalist
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (paul,
    'Western herbal medicine is often framed as "natural," but that framing obscures something important: plants contain bioactive compounds with real pharmacological effects.

St. John''s Wort inhibits cytochrome P450 enzymes and can significantly alter the metabolism of prescription medications. Licorice root affects cortisol and can raise blood pressure. Kava interacts with benzodiazepines.

Effective clinical herbalism requires the same rigor as pharmacology — because that''s functionally what it is. "Natural" is not the same as "safe in all contexts."',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '6 days') RETURNING id INTO p31;

  -- p32 [EN] Jessica Porter — Biofeedback
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (jessica,
    'Biofeedback gives people something most wellness modalities don''t: real-time, objective data about their own physiology.

When a client can see their heart rate variability respond to slow-paced breathing, or watch their skin conductance rise with a stressful thought, the abstract concept of "stress response" becomes concrete and immediately actionable.

The most powerful session I run regularly is the first one — when someone discovers they can actually influence their own nervous system. That discovery changes their relationship to stress permanently.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '6 days 4 hours') RETURNING id INTO p32;

  -- p33 [EN] Alex Martinez — AI in Healthcare
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (alex_m,
    'The honest state of AI in healthcare in 2026: impressive in specific, well-defined tasks. Not ready to practice medicine.

AI is outperforming radiologists on specific imaging datasets. Accelerating drug discovery. Improving clinical documentation efficiency enormously.

What it can''t do: navigate the ambiguity of a complex patient who doesn''t fit the training distribution. Understand what a patient''s facial expression means in context. Make judgment calls integrating clinical data with human nuance.

The best clinical AI implementations augment the clinician — they don''t replace the clinical relationship.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '6 days 8 hours') RETURNING id INTO p33;

  -- p34 [EN] Diana Russell — Massage Therapy
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (diana,
    'One of the most evidence-supported effects of therapeutic massage is the one clients feel most immediately: nervous system regulation.

Within 10-15 minutes of skilled soft tissue work, most clients shift from sympathetic dominance (stress response) to parasympathetic activity (rest and repair). Heart rate slows. Breathing deepens. Muscle tone decreases.

For clients living in chronic stress — which in 2026 is most of them — regular bodywork is basic maintenance for a system under constant load. Not a luxury.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '6 days 12 hours') RETURNING id INTO p34;

  -- p35 [EN] Robert Kim — Acupressure & Asian Bodywork
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (robert_k,
    'Acupressure and acupuncture work with the same point locations and therapeutic principles — the difference is the tool: pressure vs. needle.

What this means clinically: acupressure is accessible in ways acupuncture isn''t. Clients can learn self-care protocols for common patterns — headaches, digestive discomfort, insomnia, anxiety — and apply them between sessions.

Teaching clients to work with their own bodies is, to me, the highest form of the practice. The goal is their autonomy, not their dependency.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '7 days') RETURNING id INTO p35;

  -- p36 [EN] Catherine Adams — LMFT
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (catherine,
    'Couples who come to therapy arrive with a presenting conflict: money, parenting, intimacy, communication. Rarely is the presenting conflict the actual conflict.

Underneath the surface argument is almost always a deeper question: Do you see me? Do I matter to you? Am I safe with you?

Good couples therapy doesn''t resolve the surface argument. It changes the emotional environment in which the argument happens. That''s the work.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '7 days 4 hours') RETURNING id INTO p36;

  -- p37 [EN] Mark Davidson — Nonviolent Communication
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (mark,
    'NVC''s most counterintuitive teaching: the more specific you are about your needs, the less people feel burdened by them.

Vague complaints ("you never listen") create defensiveness. Clear observations + feelings + needs + requests create connection. "When you check your phone during dinner, I feel lonely because connection matters to me. Would you be willing to put it away for this meal?"

It sounds simple. It takes years to do naturally. But every step toward it reduces unnecessary suffering.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '7 days 8 hours') RETURNING id INTO p37;

  -- p38 [EN] Michelle Chang — Reiki
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (michelle,
    'I understand the skepticism about Reiki. I had it myself before training.

What changed my mind: 15 years watching what happens to clients on the table. Not dramatic events — quiet shifts. A body held tight releasing. A mind that was racing finding stillness. A person who arrived defended leaving open.

Whether the mechanism is biofield energy, the relaxation response, or deep human presence — something real is happening. And whatever it is, it consistently supports healing.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '7 days 12 hours') RETURNING id INTO p38;

  -- p39 [EN] Nicole Taylor — Dance/Movement Therapy
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (nicole,
    'Dance/movement therapy isn''t about dancing well. It''s not even about dancing in any conventional sense.

It''s about the intelligence that lives in movement — the way posture encodes history, the way gesture reveals what words conceal, the way rhythmic movement co-regulates the nervous system in ways verbal therapy can''t always reach.

I work with people who''ve been told their whole lives that their bodies were problems to manage. DMT invites them to discover that their body is, and always was, a resource.',
    'TEXT', 'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '7 days 16 hours') RETURNING id INTO p39;

  -- ══════════════════════════════════════════════════════════════════════
  -- ACHIEVEMENT / MILESTONE posts
  -- ══════════════════════════════════════════════════════════════════════

  -- p40 [ES] Marta — project milestone
  INSERT INTO public.feed_posts (
    author_id, content, content_type, achievement_type, achievement_data,
    visibility, metadata, created_at
  ) VALUES (
    marta,
    '¡Proyecto finalizado! Rehabilitación energética de edificio residencial plurifamiliar en Valencia — de calificación E a B. Un proceso de 14 meses desde el diagnóstico hasta la recepción de obra. Orgullosa del equipo y del resultado.',
    'ACHIEVEMENT', 'milestone_experience',
    '{"years": 10, "field": "eficiencia energética"}',
    'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '4 hours'
  ) RETURNING id INTO p40;

  -- p41 [EN] James — new certification (Trauma-Informed SEL)
  INSERT INTO public.feed_posts (
    author_id, content, content_type, achievement_type, achievement_data,
    visibility, metadata, created_at
  ) VALUES (
    james,
    'Just completed advanced training in Trauma-Informed SEL practices. The intersection of trauma awareness and social-emotional learning is where the most important work in schools is happening right now. Excited to bring this into my classroom work.',
    'ACHIEVEMENT', 'new_certification',
    '{"certification_name": "Trauma-Informed SEL Practitioner", "issuer": "CASEL Institute"}',
    'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '9 hours'
  ) RETURNING id INTO p41;

  -- p42 [EN] Amanda — got_hired
  INSERT INTO public.feed_posts (
    author_id, content, content_type, achievement_type, achievement_data,
    visibility, metadata, created_at
  ) VALUES (
    amanda,
    'Thrilled to announce I''m joining Conscious Capital as Lead Leadership Development Coach. Working with purpose-driven organizations to build leadership capacity from the inside out. This is the work I was built for.',
    'ACHIEVEMENT', 'got_hired',
    '{"company_name": "Conscious Capital", "position": "Lead Leadership Development Coach"}',
    'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '6 hours'
  ) RETURNING id INTO p42;

  -- p43 [EN] Alex — milestone
  INSERT INTO public.feed_posts (
    author_id, content, content_type, achievement_type, achievement_data,
    visibility, metadata, created_at
  ) VALUES (
    alex_m,
    '100 healthcare organizations now using the AI implementation frameworks I developed. When I started this work 4 years ago, most clinical teams saw AI as a threat. Today, most see it as a tool — with appropriate skepticism. That mindset shift is the real milestone.',
    'MILESTONE', 'network_milestone',
    '{"connections": 100, "context": "healthcare organizations"}',
    'PUBLIC', '{"seed": "true"}', NOW() - INTERVAL '1 day 8 hours'
  ) RETURNING id INTO p43;

  -- ══════════════════════════════════════════════════════════════════════
  -- POLL posts
  -- ══════════════════════════════════════════════════════════════════════

  -- p44 [EN] James — SEL barriers poll
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (james,
    'For educators and school counselors: what''s the biggest barrier to implementing SEL effectively in your school?',
    'POLL', 'PUBLIC',
    jsonb_build_object(
      'seed', 'true',
      'poll', jsonb_build_object(
        'question', 'Biggest barrier to effective SEL implementation?',
        'options', jsonb_build_array(
          'Lack of dedicated time in the schedule',
          'Insufficient teacher training',
          'Limited administrative support',
          'Measuring outcomes is too complex'
        ),
        'duration', '1w',
        'expires_at', (NOW() + INTERVAL '7 days')::TEXT
      )
    ),
    NOW() - INTERVAL '3 hours'
  ) RETURNING id INTO p44;

  -- p45 [ES] Laura — energy efficiency poll
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (laura,
    'Para los que trabajáis en obra residencial: ¿cuál es el mayor freno en vuestros proyectos de eficiencia energética?',
    'POLL', 'PUBLIC',
    jsonb_build_object(
      'seed', 'true',
      'poll', jsonb_build_object(
        'question', '¿Cuál es el mayor freno en proyectos de eficiencia energética residencial?',
        'options', jsonb_build_array(
          'Presupuesto del cliente',
          'Desconocimiento de las ayudas disponibles',
          'Plazos de las administraciones',
          'Falta de industrialización del proceso'
        ),
        'duration', '1w',
        'expires_at', (NOW() + INTERVAL '7 days')::TEXT
      )
    ),
    NOW() - INTERVAL '7 hours'
  ) RETURNING id INTO p45;

  -- p46 [EN] Alex — AI in healthcare poll
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (alex_m,
    'For healthcare professionals: what''s your current level of comfort with AI-assisted clinical decision support tools?',
    'POLL', 'PUBLIC',
    jsonb_build_object(
      'seed', 'true',
      'poll', jsonb_build_object(
        'question', 'How comfortable are you with AI-assisted clinical decision support?',
        'options', jsonb_build_array(
          'Very comfortable — using it regularly',
          'Cautiously interested — exploring options',
          'Skeptical but watching the evidence',
          'Not comfortable — prefer traditional methods'
        ),
        'duration', '3d',
        'expires_at', (NOW() + INTERVAL '3 days')::TEXT
      )
    ),
    NOW() - INTERVAL '10 hours'
  ) RETURNING id INTO p46;

  -- ══════════════════════════════════════════════════════════════════════
  -- EVENT posts
  -- ══════════════════════════════════════════════════════════════════════

  -- p47 [EN] Amanda — Conscious Leadership Intensive
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (amanda,
    'Conscious Leadership Intensive — 2-day in-person workshop. We go deep on the inner work: identifying leadership shadows, building psychological safety, leading from values rather than fear. Small groups (max 12). Madrid, April 5–6.',
    'EVENT', 'PUBLIC',
    jsonb_build_object(
      'seed', 'true',
      'event', jsonb_build_object(
        'title', 'Conscious Leadership Intensive',
        'date', '2026-04-05',
        'time', '09:00',
        'location', 'Madrid — La Casa Encendida',
        'link', 'https://yourcvpassport.com/eventos/conscious-leadership-intensive'
      )
    ),
    NOW() - INTERVAL '2 days 6 hours'
  ) RETURNING id INTO p47;

  -- p48 [ES] Marta — Webinar certificado energético
  INSERT INTO public.feed_posts (author_id, content, content_type, visibility, metadata, created_at)
  VALUES (marta,
    'Webinar gratuito — Claves para entender el certificado de eficiencia energética y cómo mejorarlo sin obra mayor. Especialmente útil para propietarios, administradores de fincas y técnicos que quieren orientar mejor a sus clientes.',
    'EVENT', 'PUBLIC',
    jsonb_build_object(
      'seed', 'true',
      'event', jsonb_build_object(
        'title', 'Certificado energético: claves para entenderlo y mejorarlo',
        'date', '2026-03-12',
        'time', '17:00',
        'location', 'Online — Google Meet',
        'link', 'https://yourcvpassport.com/eventos/certificado-energetico-webinar'
      )
    ),
    NOW() - INTERVAL '3 days 10 hours'
  ) RETURNING id INTO p48;

  -- ══════════════════════════════════════════════════════════════════════
  -- LIKES — distributed across posts, no self-likes
  -- ══════════════════════════════════════════════════════════════════════

  INSERT INTO public.feed_likes (post_id, user_id, reaction_type) VALUES
    (p1,  james,    'INSIGHTFUL'), (p1,  javier,   'LIKE'),      (p1,  sarah,    'INSIGHTFUL'),
    (p1,  emily,    'LIKE'),       (p1,  marta,    'CELEBRATE'),
    (p2,  laura,    'INSIGHTFUL'), (p2,  marta,    'INSIGHTFUL'), (p2,  james,    'LIKE'),
    (p2,  daniel,   'INSIGHTFUL'), (p2,  jessica,  'LIKE'),
    (p3,  laura,    'CELEBRATE'),  (p3,  javier,   'CELEBRATE'),  (p3,  james,    'LIKE'),
    (p3,  amanda,   'CELEBRATE'),  (p3,  kevin,    'LIKE'),
    (p4,  sarah,    'INSIGHTFUL'), (p4,  jennifer, 'INSIGHTFUL'), (p4,  marcus,   'LIKE'),
    (p4,  angela,   'INSIGHTFUL'), (p4,  margaret, 'LIKE'),
    (p5,  james,    'INSIGHTFUL'), (p5,  emily,    'LIKE'),       (p5,  jennifer, 'INSIGHTFUL'),
    (p5,  margaret, 'LIKE'),       (p5,  thomas,   'INSIGHTFUL'),
    (p6,  emily,    'CELEBRATE'),  (p6,  priya,    'LIKE'),       (p6,  marta,    'INSIGHTFUL'),
    (p6,  paul,     'CELEBRATE'),  (p6,  rebecca,  'LIKE'),
    (p7,  lisa,     'INSIGHTFUL'), (p7,  jennifer, 'LIKE'),       (p7,  michael,  'INSIGHTFUL'),
    (p7,  angela,   'LIKE'),       (p7,  steven,   'INSIGHTFUL'),
    (p8,  marcus,   'LOVE'),       (p8,  emily,    'LOVE'),       (p8,  jennifer, 'LIKE'),
    (p8,  angela,   'LOVE'),       (p8,  nicole,   'INSIGHTFUL'),
    (p9,  jennifer, 'INSIGHTFUL'), (p9,  angela,   'SUPPORT'),    (p9,  richard,  'INSIGHTFUL'),
    (p9,  marcus,   'LIKE'),       (p9,  catherine,'SUPPORT'),
    (p10, michael,  'INSIGHTFUL'), (p10, maria_g,  'LIKE'),       (p10, catherine,'INSIGHTFUL'),
    (p10, james,    'LIKE'),       (p10, angela,   'INSIGHTFUL'),
    (p11, david,    'INSIGHTFUL'), (p11, priya,    'LIKE'),       (p11, karen,    'INSIGHTFUL'),
    (p11, rebecca,  'LIKE'),       (p11, linda,    'INSIGHTFUL'),
    (p12, rachel,   'INSIGHTFUL'), (p12, karen,    'LIKE'),       (p12, priya,    'INSIGHTFUL'),
    (p12, emily,    'LIKE'),       (p12, angela,   'INSIGHTFUL'),
    (p13, robert_g, 'CELEBRATE'),  (p13, chris,    'LOVE'),       (p13, margaret, 'INSIGHTFUL'),
    (p13, priya,    'LIKE'),       (p13, thomas,   'INSIGHTFUL'),
    (p14, kevin,    'INSIGHTFUL'), (p14, angela,   'INSIGHTFUL'), (p14, james,    'LIKE'),
    (p14, patricia, 'INSIGHTFUL'), (p14, daniel,   'LIKE'),
    (p15, amanda,   'INSIGHTFUL'), (p15, angela,   'LIKE'),       (p15, james,    'INSIGHTFUL'),
    (p15, patricia, 'LIKE'),       (p15, daniel,   'INSIGHTFUL'),
    (p16, thomas,   'INSIGHTFUL'), (p16, steven,   'LIKE'),       (p16, emily,    'INSIGHTFUL'),
    (p16, angela,   'LOVE'),       (p16, priya,    'INSIGHTFUL'),
    (p17, margaret, 'INSIGHTFUL'), (p17, steven,   'LIKE'),       (p17, emily,    'INSIGHTFUL'),
    (p17, angela,   'LOVE'),       (p17, priya,    'LIKE'),
    (p18, daniel,   'INSIGHTFUL'), (p18, james,    'LIKE'),       (p18, angela,   'INSIGHTFUL'),
    (p18, kevin,    'LIKE'),       (p18, alex_m,   'INSIGHTFUL'),
    (p19, patricia, 'INSIGHTFUL'), (p19, james,    'LIKE'),       (p19, alex_m,   'INSIGHTFUL'),
    (p19, jessica,  'LIKE'),       (p19, amanda,   'INSIGHTFUL'),
    (p20, priya,    'INSIGHTFUL'), (p20, robert_k, 'LIKE'),       (p20, rebecca,  'INSIGHTFUL'),
    (p20, david,    'LIKE'),       (p20, chris,    'INSIGHTFUL'),
    (p21, linda,    'INSIGHTFUL'), (p21, robert_k, 'LIKE'),       (p21, david,    'INSIGHTFUL'),
    (p21, rachel,   'LIKE'),       (p21, emily,    'INSIGHTFUL'),
    (p22, nicole,   'INSIGHTFUL'), (p22, lisa,     'LOVE'),       (p22, marcus,   'INSIGHTFUL'),
    (p22, diana,    'LIKE'),       (p22, emily,    'LIKE'),
    (p23, richard,  'SUPPORT'),    (p23, janet,    'INSIGHTFUL'), (p23, steven,   'LIKE'),
    (p23, margaret, 'SUPPORT'),    (p23, angela,   'LOVE'),
    (p24, elizabeth,'SUPPORT'),    (p24, maria_g,  'SUPPORT'),    (p24, janet,    'LIKE'),
    (p24, angela,   'LOVE'),       (p24, jennifer, 'SUPPORT'),
    (p25, jennifer, 'INSIGHTFUL'), (p25, james,    'LIKE'),       (p25, angela,   'INSIGHTFUL'),
    (p25, catherine,'INSIGHTFUL'), (p25, michael,  'LIKE'),
    (p26, elizabeth,'INSIGHTFUL'), (p26, richard,  'LIKE'),       (p26, angela,   'INSIGHTFUL'),
    (p26, james,    'LIKE'),       (p26, steven,   'INSIGHTFUL'),
    (p27, margaret, 'INSIGHTFUL'), (p27, thomas,   'LIKE'),       (p27, emily,    'INSIGHTFUL'),
    (p27, priya,    'LIKE'),       (p27, angela,   'INSIGHTFUL'),
    (p28, kevin,    'INSIGHTFUL'), (p28, amanda,   'LIKE'),       (p28, james,    'INSIGHTFUL'),
    (p28, patricia, 'LIKE'),       (p28, daniel,   'INSIGHTFUL'),
    (p29, jessica,  'INSIGHTFUL'), (p29, rachel,   'LIKE'),       (p29, michael,  'INSIGHTFUL'),
    (p29, angela,   'LIKE'),       (p29, jennifer, 'INSIGHTFUL'),
    (p30, paul,     'INSIGHTFUL'), (p30, karen,    'LIKE'),       (p30, linda,    'INSIGHTFUL'),
    (p30, priya,    'LIKE'),       (p30, rachel,   'INSIGHTFUL'),
    (p31, rebecca,  'INSIGHTFUL'), (p31, karen,    'LIKE'),       (p31, linda,    'INSIGHTFUL'),
    (p31, rachel,   'LIKE'),       (p31, priya,    'INSIGHTFUL'),
    (p32, alex_m,   'INSIGHTFUL'), (p32, daniel,   'LIKE'),       (p32, michael,  'INSIGHTFUL'),
    (p32, brian,    'LIKE'),       (p32, rachel,   'INSIGHTFUL'),
    (p33, daniel,   'INSIGHTFUL'), (p33, james,    'INSIGHTFUL'), (p33, rachel,   'LIKE'),
    (p33, kevin,    'INSIGHTFUL'), (p33, jessica,  'LIKE'),
    (p34, chris,    'LIKE'),       (p34, robert_k, 'LIKE'),       (p34, rachel,   'INSIGHTFUL'),
    (p34, emily,    'LIKE'),       (p34, priya,    'INSIGHTFUL'),
    (p35, linda,    'INSIGHTFUL'), (p35, priya,    'LIKE'),       (p35, chris,    'LIKE'),
    (p35, rebecca,  'INSIGHTFUL'), (p35, diana,    'INSIGHTFUL'),
    (p36, jennifer, 'INSIGHTFUL'), (p36, maria_g,  'LIKE'),       (p36, angela,   'INSIGHTFUL'),
    (p36, michael,  'LIKE'),       (p36, richard,  'INSIGHTFUL'),
    (p37, jennifer, 'INSIGHTFUL'), (p37, angela,   'LOVE'),       (p37, kevin,    'INSIGHTFUL'),
    (p37, james,    'LIKE'),       (p37, catherine,'INSIGHTFUL'),
    (p38, priya,    'LIKE'),       (p38, margaret, 'INSIGHTFUL'), (p38, emily,    'LIKE'),
    (p38, chris,    'INSIGHTFUL'), (p38, angela,   'LOVE'),
    (p39, lisa,     'LOVE'),       (p39, marcus,   'LIKE'),       (p39, emily,    'LOVE'),
    (p39, diana,    'INSIGHTFUL'), (p39, chris,    'INSIGHTFUL'),
    -- achievements & milestones
    (p40, laura,    'CELEBRATE'),  (p40, javier,   'CELEBRATE'),  (p40, james,    'LIKE'),
    (p41, sarah,    'CELEBRATE'),  (p41, jennifer, 'LIKE'),       (p41, marcus,   'CELEBRATE'),
    (p42, kevin,    'CELEBRATE'),  (p42, angela,   'LIKE'),       (p42, james,    'CELEBRATE'),
    (p43, daniel,   'CELEBRATE'),  (p43, jessica,  'LIKE'),       (p43, james,    'CELEBRATE'),
    -- polls
    (p44, sarah,    'LIKE'),       (p44, jennifer, 'LIKE'),       (p44, marcus,   'LIKE'),
    (p45, javier,   'LIKE'),       (p45, marta,    'LIKE'),       (p45, emily,    'LIKE'),
    (p46, daniel,   'INSIGHTFUL'), (p46, jessica,  'LIKE'),       (p46, rachel,   'INSIGHTFUL'),
    -- events
    (p47, kevin,    'CELEBRATE'),  (p47, angela,   'LIKE'),       (p47, james,    'CELEBRATE'),
    (p47, patricia, 'LIKE'),
    (p48, laura,    'LIKE'),       (p48, javier,   'CELEBRATE'),  (p48, james,    'LIKE')
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- ══════════════════════════════════════════════════════════════════════
  -- COMMENTS (with threading on key posts)
  -- ══════════════════════════════════════════════════════════════════════

  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p1, javier, 'Totalmente de acuerdo Laura. El análisis previo es lo que marca la diferencia entre una reforma que cumple en papel y una que funciona de verdad.')
  RETURNING id INTO c1;
  INSERT INTO public.feed_comments (post_id, author_id, content, parent_id) VALUES
    (p1, laura, 'Y cuando el cliente viene ya informado, la conversación técnica es mucho más productiva. Se saltan la fase de convencimiento.', c1);

  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p4, sarah, 'The evidence is so clear, and yet the "it''s taking time from real learning" pushback persists. SEL IS the infrastructure for learning — not a supplement to it.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p4, jennifer, 'What you describe as a "Friday afternoon add-on" is exactly what happens when SEL is seen as a program rather than a way of being in the classroom.');

  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p7, lisa, 'The embodiment point is everything. Talk therapy can intellectualize an experience indefinitely. Drama therapy forces you to actually inhabit it. Completely different quality of insight.')
  RETURNING id INTO c2;
  INSERT INTO public.feed_comments (post_id, author_id, content, parent_id) VALUES
    (p7, marcus, 'And the group as witness changes the experience further. Being seen in your vulnerability — not just describing it — is where the real movement happens.', c2);

  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p9, jennifer, 'The shame-as-treatment model persists partly because it matches a moral framework that''s more comfortable than the clinical evidence. Confronting that is part of the work.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p9, angela, 'This applies beyond addiction. Shame is a contraction response — it closes the person down. And a closed person can''t take in new information or make meaningful change.');

  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p14, kevin, 'The "leading from wounds" frame is one I use constantly with clients. The most common shadow I see: unresolved need for control masquerading as high standards.')
  RETURNING id INTO c3;
  INSERT INTO public.feed_comments (post_id, author_id, content, parent_id) VALUES
    (p14, amanda, 'That shadow usually developed for completely good reasons — in a context where control was the only way to stay safe. The work isn''t to eliminate it. It''s to give it a seat at the table rather than the wheel.', c3);

  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p19, alex_m, 'This is the core problem with how AI outputs are communicated in healthcare. "The model predicts X" sounds like a fact. It''s a probability estimate generated by a system that can''t explain its own reasoning.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p19, jessica, 'The assumption embedding is what most non-researchers miss. The framing of a question, the choice of what to exclude from the dataset — these aren''t neutral decisions.');

  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p23, richard, 'The institutionalization of dying has also profoundly changed how we grieve. When death happens away from the home, removed from daily life, people arrive at grief with far less preparation.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p23, janet, 'Palliative care teams are stretched thin — having doulas who can hold the human dimensions that the medical team can''t always attend to changes outcomes for families significantly.');

  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p33, daniel, 'The distribution shift problem is the one I worry about most. A model trained on data from well-resourced academic medical centers doesn''t perform the same way in community health settings. The equity implications compound.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p33, jessica, 'The documentation efficiency point is real. I''ve seen clinicians reclaim 45-60 minutes per day from administrative work with AI scribing. That time going back into patient contact is a genuine win.');

  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p37, jennifer, 'Specificity changes everything. Vague needs feel like demands because the other person has to guess. Clear needs feel like invitations because there''s a concrete response available.')
  RETURNING id INTO c4;
  INSERT INTO public.feed_comments (post_id, author_id, content, parent_id) VALUES
    (p37, mark, 'Exactly. And the request step must be genuinely requestable — not a demand in disguise. The test: can the other person say no without consequence? If not, it''s not NVC.', c4);

  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p47, kevin, 'Already registered. The "leading from fear vs values" distinction is one I return to constantly in my own coaching work. Looking forward to going deep on it.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p48, javier, 'Muy necesario este webinar. El certificado energético sigue siendo un misterio para la mayoría de propietarios. Lo comparto en mis grupos de instaladores.');

  -- ── Additional comments to fill remaining posts ──────────────────

  -- p2 [ES] Javier — RITE
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p2, laura, 'Muy buen apunte Javier. Lo del rendimiento estacional lo explico siempre en mis proyectos y cuesta que llegue, especialmente a los clientes que solo miran la etiqueta del equipo.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p2, marta, 'Y hay que tener en cuenta que la zona climática cambia el cálculo bastante. No es lo mismo dimensionar para Bilbao que para Sevilla.');

  -- p3 [ES] Marta — rehabilitación energética
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p3, javier, '¡Enhorabuena Marta! ¿Qué solución usaste para la envolvente? ¿SATE o fachada ventilada?')
  RETURNING id INTO c5;
  INSERT INTO public.feed_comments (post_id, author_id, content, parent_id) VALUES
    (p3, marta, 'SATE con lana mineral de 14cm. En ese edificio la fachada ventilada no era viable por normativa urbanística del municipio.', c5);
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p3, laura, 'Ese 61% de reducción en demanda de calefacción es de los mejores resultados que he visto en plurifamiliar de los 70. ¿Cuál fue la inversión media por vivienda?');

  -- p5 [EN] Sarah — Montessori/Waldorf
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p5, james, 'The "vessel to fill" framing is still the dominant model in most standardized curricula — the child as recipient rather than participant. What you describe is a fundamentally different relationship to learning.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p5, margaret, 'What both share about respecting the whole child resonates with contemplative education. The question is always: are we educating for performance, or for flourishing?');

  -- p6 [EN] Robert Green — Permaculture
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p6, emily, 'This is such a hopeful example. I use food forests as a case study in my nature-based therapy work — there''s something profound about watching a degraded landscape come back to life.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p6, priya, 'The "thinking in decades" point is key. Most of our systems optimize for next quarter. Permaculture is radical because it optimizes for the next generation.');

  -- p8 [EN] Lisa — Art Therapy
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p8, marcus, 'The image vs. word distinction is fundamental. I see the same thing in psychodrama — the moment someone moves rather than describes, a different kind of knowing becomes available.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p8, nicole, 'This resonates deeply with dance/movement work too. The body finds expression that language can''t always hold. Different modalities, same underlying truth.');

  -- p10 [EN] Jennifer — Family Systems
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p10, catherine, 'The "identified patient" reframe is one of the most powerful shifts to introduce early in treatment. It moves the question from blame to curiosity immediately.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p10, maria_g, 'Especially important in cultural contexts where family loyalty is high — naming what the symptom might be protecting can open doors that direct confrontation closes.');

  -- p11 [EN] Rachel — Dietitian
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p11, david, 'The stress-digestion connection is massively underappreciated. You can eat the "right" foods and absorb almost none of it if your nervous system is in fight-or-flight.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p11, karen, 'I''ve started integrating more conversation about lifestyle and stress before even looking at a food log. The food is often not the root issue.');

  -- p12 [EN] David — Mindful Eating
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p12, rachel, 'The emotional vs. physical hunger distinction takes real time to rebuild. Years of diet-culture conditioning around hunger rules don''t undo themselves quickly.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p12, karen, 'Body trust is the piece most nutrition interventions skip entirely. Without it, even the best eating plan becomes another set of external rules to obey or rebel against.');

  -- p13 [EN] Emily — Ecopsychology
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p13, robert_g, 'What I try to cultivate in permaculture education too — not just "use nature efficiently" but "belong to nature again." Different language, same orientation.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p13, margaret, 'The attention restoration research has been robust for decades. And yet we keep designing schools, offices, and healthcare facilities without a single window or plant.');

  -- p15 [EN] Kevin — Entrepreneurship
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p15, amanda, 'The unexamined ego as foundation is so precise. I see it in leadership coaching constantly — brilliant strategy built on a foundation that hasn''t been looked at. It eventually cracks.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p15, angela, 'The founders who avoid burnout are almost always the ones who built self-awareness into the work from the beginning, not as an afterthought at year three.');

  -- p16 [EN] Margaret — Contemplative Practices
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p16, thomas, 'The resistance to stillness is a cultural, not a personal problem. We''ve systematically devalued interiority. Contemplative practice is one of the few things that insists it matters.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p16, steven, 'What you describe as "inner capacity to meet difficulty without being swept away" is what transpersonal psychology calls equanimity. It''s trainable. That''s the radical news.');

  -- p17 [EN] Thomas — Perennial Philosophy
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p17, margaret, 'The practical consequences of sitting with those questions is what most philosophy courses miss. Answering "what is consciousness?" changes how you move through an ordinary Tuesday.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p17, steven, 'What draws me to transpersonal work is exactly this — the questions you mention don''t have answers in the ordinary sense, but living with them well transforms the one asking.');

  -- p18 [EN] Patricia — Qualitative Research
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p18, daniel, 'The transferability vs. generalizability distinction is one I spend a lot of time on with quantitative colleagues. Both are valid — they answer different questions. The problem is applying one''s criteria to the other.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p18, alex_m, 'In healthcare AI evaluation I see this constantly. People dismiss qualitative research on implementations because it''s "not generalizable." But understanding why something fails in context requires exactly this kind of work.');

  -- p20 [EN] Linda — TCM
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p20, priya, 'Ayurveda arrives at something very similar from a different direction. Pattern differentiation — constitution, season, emotional state — is exactly how Ayurvedic assessment works too.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p20, robert_k, 'The 2,500 years of clinical observation framing is important. It''s not anecdote — it''s a systematic empirical tradition that predates randomized controlled trials by millennia.');

  -- p21 [EN] Priya — Ayurveda
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p21, linda, 'TCM has a similar issue with people treating constitutional diagnosis as identity rather than as a functional guide to what their body needs right now. The map is not the territory.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p21, david, 'The "personalizing what generic wellness advice can''t" point resonates with mindful eating too. The most persistent mistake is applying universal rules to individual bodies.');

  -- p22 [EN] Christopher — Somatic
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p22, nicole, 'The "organized responses to experience" framing is so precise. That''s the same understanding DMT works with — the body''s movement patterns are a history, not a limitation.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p22, diana, 'Regular bodywork makes this visible too. The amount of held tension people are unaware of until skilled hands offer an alternative — it''s remarkable how much we normalize carrying.');

  -- p24 [EN] Richard — Grief
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p24, elizabeth, 'The spiral model of grief is so much more honest than the stage model. I use it in end-of-life work with families — helping them understand they''re not going backwards when grief resurfaces.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p24, angela, 'Grief literacy is one of the most missing capacities in modern culture. We don''t know how to be with our own grief, and we''re even less equipped to be with someone else''s.');

  -- p25 [EN] Maria — Culturally Responsive
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p25, jennifer, '"How does your family understand what''s happening?" immediately makes the cultural frame visible and positions the therapist as learner rather than expert. That shift changes the whole dynamic.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p25, michael, 'I see the pathologizing of cultural difference in addiction treatment constantly. Approaches developed for one population imposed on another without adaptation. The outcomes show it.');

  -- p26 [EN] Janet — Gerontology
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p26, elizabeth, 'The "flourishing vs. managing decline" reframe is everything. Most elder care is organized around deficit — what people can no longer do. Very few systems are organized around what''s still possible and meaningful.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p26, richard, 'The loneliness epidemic in aging populations is one of the biggest public health crises we have. And it''s almost entirely addressable — it''s not a medical problem, it''s a social design problem.');

  -- p27 [EN] Steven — Transpersonal
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p27, margaret, 'We have the practices. We''re still developing the language to make them legible in clinical and academic contexts. That translation work is essential.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p27, thomas, 'Grof''s work on non-ordinary states is still underappreciated in mainstream psychology. The clinical implications of taking that territory seriously are enormous.');

  -- p28 [EN] Angela — Life Design
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p28, kevin, 'The authorship question is the one I return to most in entrepreneurship coaching. Most founders are building something. Far fewer have asked who is doing the building.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p28, amanda, 'What you describe as "a life that''s actually mine" is often the first thing people have to grieve in this work — realizing how much of what they''ve built was for someone else''s approval.');

  -- p29 [EN] Brian — EFT
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p29, jessica, 'The biofeedback data I see during tapping sessions is consistent — something is happening physiologically, whatever the mechanism. Heart rate variability shifts are measurable and repeatable.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p29, michael, 'I''ve incorporated tapping protocols into addiction counseling with meaningful results, particularly for managing cravings in early recovery. The speed of effect is notable.');

  -- p30 [EN] Rebecca — Naturopathic
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p30, paul, 'When someone presents with chronic inflammation, the question isn''t only "what''s the most effective anti-inflammatory?" It''s "what''s sustaining the inflammatory process?" Root cause first.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p30, karen, 'The "different questions first" framing is important. It''s not that conventional medicine''s questions are wrong — it''s that they''re often the second set of questions, not the first.');

  -- p31 [EN] Paul — Herbalist
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p31, rebecca, 'The rigor point is so important and often missing from public discourse. Interactions with pharmaceuticals are real and sometimes serious. Practitioners need to know pharmacology to practice safely.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p31, linda, 'The St. John''s Wort cytochrome P450 interaction is one I address in every patient consult who''s on hormonal contraception or immunosuppressants. It''s not a niche concern.');

  -- p32 [EN] Jessica — Biofeedback
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p32, brian, 'That first session discovery — realizing you can influence your own nervous system — is something I see in EFT work too. From passive sufferer to active participant in your own regulation.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p32, alex_m, 'The real-time data piece is what differentiates biofeedback from most modalities. Making the abstract concrete accelerates change significantly. We see the same effect in clinical AI decision tools.');

  -- p34 [EN] Diana — Massage
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p34, chris, 'The parasympathetic shift you describe is something I track in somatic sessions too. There''s a moment when the breath deepens and the tissue quality changes — the nervous system has decided it''s safe.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p34, robert_k, 'Regular bodywork also changes how people interpret physical sensation. Clients who''ve worked with their bodies consistently start to notice stress accumulating before it becomes a crisis.');

  -- p35 [EN] Robert Kim — Acupressure
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p35, linda, 'Teaching self-care protocols is something I do with every patient too. The goal is never dependency on the practitioner — it''s giving people tools they can use between sessions and eventually without them.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p35, diana, 'The autonomy goal is what distinguishes good therapeutic work from maintenance work. Are we building the client''s capacity, or creating a practice they need indefinitely?');

  -- p36 [EN] Catherine — LMFT
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p36, jennifer, 'The "emotional environment" framing is one I use in family systems work too. The content of the argument is almost irrelevant. The relational field in which it happens is everything.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p36, maria_g, '"Do you see me?" is so universal across cultures. The specific expression changes, but the underlying need for recognition is constant. That''s where the real work lives.');

  -- p38 [EN] Michelle — Reiki
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p38, margaret, 'What you describe as "deep human presence" may be the most undervalued therapeutic variable across all modalities. The quality of attention a practitioner brings changes the room.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p38, priya, 'Ayurvedic touch practices carry a similar philosophy — the intention and state of the practitioner is part of the treatment. The research on therapeutic presence is growing and it''s consistent.');

  -- p39 [EN] Nicole — Dance/Movement
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p39, chris, 'The "body as resource" reframe is what somatic education works toward too. So many people arrive with a fundamentally adversarial relationship to their own physicality. Transforming that is the real work.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p39, lisa, 'What you describe about posture encoding history is something I see in art therapy too — the way someone holds a brush, the pressure they apply. The body is always telling its story.');

  -- p40 [ES] Marta achievement
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p40, javier, '¡Felicidades Marta! 14 meses de proyecto y ese resultado es para enmarcar. ¿Habéis documentado el proceso para publicación técnica?');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p40, laura, '¡Enhorabuena! De E a B en plurifamiliar de los 70 no es nada sencillo. Ese 61% de reducción en demanda de calefacción es un logro enorme.');

  -- p41 [EN] James achievement
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p41, sarah, 'Congratulations James! Trauma-informed SEL is where the field needs to go. The overlap between adverse childhood experiences and social-emotional development is too significant to address separately.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p41, jennifer, 'The trauma lens changes how you read student behavior completely. A child who "won''t comply" looks very different when you ask what happened to them rather than what''s wrong with them.');

  -- p42 [EN] Amanda achievement
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p42, kevin, 'Congratulations Amanda! The combination of purpose-driven mission and real leadership development capacity is exactly what organizations need. You''re going to do great work there.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p42, angela, 'So well deserved. The inner work you bring to leadership coaching is rare. Looking forward to hearing about what you build.');

  -- p43 [EN] Alex milestone
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p43, daniel, 'The mindset shift from threat to tool is the real milestone — you''re right. The implementation follows naturally from there. Congratulations on 100 organizations.');
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p43, jessica, 'What a meaningful number. The healthcare AI space needs more people focused on responsible implementation. The enthusiasm often runs well ahead of the evidence.');

  -- p44 [EN] James poll
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p44, jennifer, 'Voted "Lack of dedicated time." It''s a chicken-and-egg problem — there''s no time because SEL isn''t seen as essential, and it''s not seen as essential because it hasn''t had time to show results.');

  -- p45 [ES] Laura poll
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p45, marta, 'Los plazos de las administraciones me parecen el freno más sistemático. Puedes tener cliente motivado, presupuesto y técnico disponible — y el proceso se para 6 meses esperando resolución de subvención.');

  -- p46 [EN] Alex poll
  INSERT INTO public.feed_comments (post_id, author_id, content) VALUES
    (p46, daniel, 'Voted cautiously interested. The tooling is improving fast enough that last year''s skepticism needs to be revisited regularly. I update my position on this every 6 months.');

  -- ══════════════════════════════════════════════════════════════════════
  -- SHARES / REPOSTS
  -- ══════════════════════════════════════════════════════════════════════

  INSERT INTO public.feed_shares (original_post_id, shared_by, share_type, share_comment) VALUES
    (p4,  jennifer,  'REPOST', NULL),
    (p8,  nicole,    'QUOTE',  'The image vs. word distinction is everything. Some experiences simply don''t fit language — and forcing them to often diminishes them.'),
    (p9,  catherine, 'REPOST', NULL),
    (p14, kevin,     'REPOST', NULL),
    (p19, alex_m,    'QUOTE',  'Every dashboard has choices baked in that the reader never sees. Data literacy is about making those choices visible.'),
    (p22, nicole,    'REPOST', NULL),
    (p23, richard,   'REPOST', NULL),
    (p24, elizabeth, 'REPOST', NULL),
    (p33, jessica,   'QUOTE',  'The distribution shift problem deserves its own curriculum in every clinical AI training.'),
    (p37, jennifer,  'REPOST', NULL)
  ON CONFLICT DO NOTHING;

  -- ══════════════════════════════════════════════════════════════════════
  -- POLL VOTES
  -- ══════════════════════════════════════════════════════════════════════

  INSERT INTO public.feed_poll_votes (post_id, user_id, option_index) VALUES
    -- p44 SEL barriers (0=schedule, 1=training, 2=admin, 3=measuring)
    (p44, sarah,    1),
    (p44, jennifer, 0),
    (p44, marcus,   2),
    (p44, angela,   0),
    -- p45 energy efficiency barriers (0=budget, 1=subsidies, 2=admin, 3=industrialization)
    (p45, javier,   0),
    (p45, marta,    1),
    (p45, emily,    2),
    -- p46 AI comfort (0=using, 1=exploring, 2=skeptical, 3=not comfortable)
    (p46, alex_m,   0),
    (p46, daniel,   1),
    (p46, jessica,  1),
    (p46, rachel,   2)
  ON CONFLICT (post_id, user_id) DO NOTHING;

  RAISE NOTICE 'Quality seed v3 — 48 posts for 40 real professionals (ES/EN), engagement inserted.';

END $$;
