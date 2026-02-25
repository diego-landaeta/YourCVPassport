-- ═══════════════════════════════════════════════════════════════════════════
-- CONSOLIDATED MIGRATION: All pending migrations for YourCVPassport
-- Generated: 2026-02-24
-- Safe to re-run: all DDL uses IF NOT EXISTS / IF EXISTS patterns
-- Run in Supabase SQL Editor in a single transaction
-- ═══════════════════════════════════════════════════════════════════════════


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 1: 20260220_fix_feed_rate_limit_recursion.sql
-- Fix infinite recursion in feed_posts RLS (42P17)
-- ═══════════════════════════════════════════════════════════════════════════

-- =============================================
-- Fix: infinite recursion in feed_posts RLS
-- Causa: policy "Rate limit post creation" queries feed_posts
-- from within a feed_posts policy → 42P17 infinite recursion
-- Solución: SECURITY DEFINER function bypasses RLS on the subquery
-- =============================================

-- 1. Create helper function that runs outside RLS context
CREATE OR REPLACE FUNCTION public.check_feed_rate_limit()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*)
    FROM public.feed_posts
    WHERE author_id = auth.uid()
      AND created_at > NOW() - INTERVAL '1 minute'
  ) < 5;
$$;

-- 2. Replace the recursive policy with one that calls the function
DROP POLICY IF EXISTS "Rate limit post creation" ON public.feed_posts;

CREATE POLICY "Rate limit post creation"
ON public.feed_posts FOR INSERT
TO authenticated
WITH CHECK (public.check_feed_rate_limit());


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 2: 20260220_open_feed_to_anon.sql
-- Open feed SELECT to anon role for public /feed and /comunidad
-- ═══════════════════════════════════════════════════════════════════════════

-- =============================================
-- Open feed public read to anon (unauthenticated) users
-- Required for the public /feed and /comunidad pages
-- =============================================

-- feed_posts: allow anon to read public, non-hidden posts
DROP POLICY IF EXISTS "Users can view public posts" ON public.feed_posts;
CREATE POLICY "Anyone can view public posts"
ON public.feed_posts FOR SELECT
TO anon, authenticated
USING (visibility = 'PUBLIC' AND is_hidden = false);

-- Keep the authenticated-only policy for viewing own private/hidden posts
DROP POLICY IF EXISTS "Users can view own posts" ON public.feed_posts;
CREATE POLICY "Users can view own posts"
ON public.feed_posts FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- feed_likes: allow anon to read like counts
DROP POLICY IF EXISTS "Anyone can view likes" ON public.feed_likes;
CREATE POLICY "Anyone can view likes"
ON public.feed_likes FOR SELECT
TO anon, authenticated
USING (true);

-- feed_comments: allow anon to read comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.feed_comments;
CREATE POLICY "Anyone can view comments"
ON public.feed_comments FOR SELECT
TO anon, authenticated
USING (is_hidden = false);

-- feed_shares: allow anon to read share counts
DROP POLICY IF EXISTS "Anyone can view shares" ON public.feed_shares;
CREATE POLICY "Anyone can view shares"
ON public.feed_shares FOR SELECT
TO anon, authenticated
USING (true);

-- feed_comment_likes: allow anon to read comment like counts
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.feed_comment_likes;
CREATE POLICY "Anyone can view comment likes"
ON public.feed_comment_likes FOR SELECT
TO anon, authenticated
USING (true);


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 3: 20260220_seed_feed_quality.sql
-- Seed 48 feed posts for 40 real professionals (ES/EN)
-- ═══════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 4: 20260221_create_groups.sql
-- Groups system: tables, triggers, RLS, auto-slug
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================================
-- Groups (Comunidades) System
-- Run this in the Supabase SQL editor
-- ============================================================

-- 1. Groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  avatar_url  TEXT,
  cover_url   TEXT,
  is_private  BOOLEAN NOT NULL DEFAULT false,
  member_count INTEGER NOT NULL DEFAULT 0,
  post_count   INTEGER NOT NULL DEFAULT 0,
  slug        TEXT UNIQUE,
  metadata    JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_groups_owner_id ON public.groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_groups_is_private ON public.groups(is_private);
CREATE INDEX IF NOT EXISTS idx_groups_slug ON public.groups(slug) WHERE slug IS NOT NULL;

-- 2. Group membership table
CREATE TABLE IF NOT EXISTS public.group_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);

-- 3. Add group_id column to feed_posts (nullable — NULL means public feed)
ALTER TABLE public.feed_posts
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_feed_posts_group_id ON public.feed_posts(group_id)
  WHERE group_id IS NOT NULL;

-- ============================================================
-- 4. Counter triggers
-- ============================================================

-- member_count trigger
CREATE OR REPLACE FUNCTION public.update_group_member_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_member_count ON public.group_members;
CREATE TRIGGER trg_group_member_count
  AFTER INSERT OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.update_group_member_count();

-- post_count trigger
CREATE OR REPLACE FUNCTION public.update_group_post_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.group_id IS NOT NULL THEN
    UPDATE public.groups SET post_count = post_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' AND OLD.group_id IS NOT NULL THEN
    UPDATE public.groups SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.group_id;
  ELSIF TG_OP = 'UPDATE' THEN
    -- group changed
    IF OLD.group_id IS DISTINCT FROM NEW.group_id THEN
      IF OLD.group_id IS NOT NULL THEN
        UPDATE public.groups SET post_count = GREATEST(0, post_count - 1) WHERE id = OLD.group_id;
      END IF;
      IF NEW.group_id IS NOT NULL THEN
        UPDATE public.groups SET post_count = post_count + 1 WHERE id = NEW.group_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_post_count ON public.feed_posts;
CREATE TRIGGER trg_group_post_count
  AFTER INSERT OR DELETE OR UPDATE OF group_id ON public.feed_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_group_post_count();

-- ============================================================
-- 5. RLS Policies
-- ============================================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- Helper: SECURITY DEFINER bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION public.is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
$$;

-- groups: public groups readable by everyone, private only by members
DROP POLICY IF EXISTS "groups_select_public" ON public.groups;
CREATE POLICY "groups_select_public" ON public.groups
  FOR SELECT
  USING (
    is_private = false
    OR owner_id = auth.uid()
    OR public.is_group_member(id, auth.uid())
  );

-- authenticated users can create groups
DROP POLICY IF EXISTS "groups_insert_auth" ON public.groups;
CREATE POLICY "groups_insert_auth" ON public.groups
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- only owner/admin can update
DROP POLICY IF EXISTS "groups_update_owner" ON public.groups;
CREATE POLICY "groups_update_owner" ON public.groups
  FOR UPDATE
  USING (
    owner_id = auth.uid()
    OR public.is_group_member(id, auth.uid())
  );

-- only owner can delete
DROP POLICY IF EXISTS "groups_delete_owner" ON public.groups;
CREATE POLICY "groups_delete_owner" ON public.groups
  FOR DELETE
  USING (owner_id = auth.uid());

-- group_members: no recursive subquery
DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
CREATE POLICY "group_members_select" ON public.group_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id
        AND (g.is_private = false OR g.owner_id = auth.uid())
    )
  );

-- users can join (insert themselves)
DROP POLICY IF EXISTS "group_members_insert_self" ON public.group_members;
CREATE POLICY "group_members_insert_self" ON public.group_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- users can leave (delete themselves); admins/owners can remove others
DROP POLICY IF EXISTS "group_members_delete" ON public.group_members;
CREATE POLICY "group_members_delete" ON public.group_members
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.groups g
      WHERE g.id = group_members.group_id AND g.owner_id = auth.uid()
    )
  );

-- ============================================================
-- 6. Auto-insert owner as member when group is created
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_add_group_owner()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_add_group_owner ON public.groups;
CREATE TRIGGER trg_auto_add_group_owner
  AFTER INSERT ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.auto_add_group_owner();

-- ============================================================
-- 7. Auto-generate slug from name if not provided
-- ============================================================
CREATE OR REPLACE FUNCTION public.auto_group_slug()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INT := 0;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(trim(NEW.name), '[^a-z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.groups WHERE slug = final_slug AND id != NEW.id) LOOP
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    NEW.slug := final_slug;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_group_slug ON public.groups;
CREATE TRIGGER trg_auto_group_slug
  BEFORE INSERT OR UPDATE OF name ON public.groups
  FOR EACH ROW EXECUTE FUNCTION public.auto_group_slug();


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 5: 20260221_seed_groups_content.sql
-- Seed 6 groups/channels with posts, members, likes, comments
-- ═══════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 6: 20260223_push_subscriptions.sql
-- Push notification subscriptions table (Web Push / VAPID)
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- Push Subscriptions for Web Push Notifications
-- Run this in Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint    text        NOT NULL,
  p256dh      text        NOT NULL,
  auth        text        NOT NULL,
  created_at  timestamptz DEFAULT now() NOT NULL,
  updated_at  timestamptz DEFAULT now() NOT NULL,

  UNIQUE (user_id, endpoint)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx
  ON public.push_subscriptions (user_id);

-- RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own subscriptions
DROP POLICY IF EXISTS "Users manage own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can read all (needed for Edge Function to send pushes)
DROP POLICY IF EXISTS "Service role can read all subscriptions" ON public.push_subscriptions;
CREATE POLICY "Service role can read all subscriptions"
  ON public.push_subscriptions
  FOR SELECT
  TO service_role
  USING (true);

-- ─────────────────────────────────────────────────────────────
-- NOTE: To send push notifications from the server, deploy the
-- Supabase Edge Function at supabase/functions/send-push/index.ts
-- and set these secrets:
--   supabase secrets set VAPID_PUBLIC_KEY=<your_key>
--   supabase secrets set VAPID_PRIVATE_KEY=<your_key>
--   supabase secrets set VAPID_SUBJECT=mailto:admin@yourcvpassport.com
--
-- Generate VAPID keys with: npx web-push generate-vapid-keys
-- Add public key to .env.local: VITE_VAPID_PUBLIC_KEY=<public_key>
-- ─────────────────────────────────────────────────────────────


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 7: 20260223_add_group_cover_images.sql
-- Add cover/avatar images to seed groups and channels
-- ═══════════════════════════════════════════════════════════════════════════

-- Add cover images and avatars to existing seed groups/channels
-- Using high-quality Unsplash images that match each group's theme

-- ── GROUPS ─────────────────────────────────────────────────────────────────

-- Tutors & Mentors Pro
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=200&q=80'
WHERE slug = 'tutors-mentors-pro' OR name = 'Tutors & Mentors Pro';

-- Devs & Conscious Tech
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=200&q=80'
WHERE slug = 'devs-conscious-tech' OR name = 'Devs & Conscious Tech';

-- Salud & Bienestar Holístico
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=200&q=80'
WHERE slug = 'salud-bienestar-holistico' OR name = 'Salud & Bienestar Holístico';

-- Remote Work & Digital Nomads (if it exists)
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=200&q=80'
WHERE slug LIKE '%remote%' OR name LIKE '%Remote%' OR name LIKE '%Digital Nomad%';

-- ── CHANNELS ───────────────────────────────────────────────────────────────

-- Novedades YourCVPassport
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=200&q=80'
WHERE slug = 'novedades-yourcvpassport' OR name LIKE '%Novedades%YourCVPassport%' OR name LIKE '%Novedades%CVPassport%';

-- AI at Work 2026
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1676299081847-824916de030a?w=200&q=80'
WHERE slug = 'ai-at-work-2026' OR name LIKE '%AI at Work%';

-- Oportunidades & Reconversión Latam
UPDATE public.groups
SET
  cover_url  = 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&q=80',
  avatar_url = 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=200&q=80'
WHERE slug LIKE '%oportunidades%' OR name LIKE '%Oportunidades%Latam%';


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 8: 20260224_add_lang_to_blog_posts.sql
-- Add lang column to blog_posts for bilingual support
-- ═══════════════════════════════════════════════════════════════════════════

-- Add lang column to blog_posts for bilingual content support
-- Run this in Supabase SQL Editor

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS lang VARCHAR(2) DEFAULT 'es';

-- Add index for fast lang filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_lang ON blog_posts(lang);

-- Backfill any existing posts without a lang
UPDATE blog_posts SET lang = 'es' WHERE lang IS NULL;


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 9: 20260224_blog_posts_seed.sql
-- Seed 30 blog articles (18 EN + 12 ES)
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================================
-- Migration: 20260224_blog_posts_seed.sql
-- Description: Seed 30 blog articles (EN + ES) for YourCVPassport
-- Run AFTER: 20260224_add_lang_to_blog_posts.sql
--
-- Content breakdown:
--   Bloque A (Articles #1-4):   Quick Wins EN          - 2026-03-01 to 2026-03-08
--   Bloque B (Articles #5-10):  SEO Pillars EN+ES      - 2026-03-10 to 2026-03-22
--   Bloque C (Articles #11-15): Hiring EN              - 2026-04-01 to 2026-04-10
--   Bloque D (Articles #16-19): Digital Credentials    - 2026-04-13 to 2026-04-20
--   Bloque E (Articles #20-24): Spanish Market ES      - 2026-05-01 to 2026-05-11
--   Bloque F (Articles #25-28): Niche Sectorial ES     - 2026-05-13 to 2026-05-20
--   Bloque G (Articles #29-30): Comparativas EN        - 2026-05-22 to 2026-05-25
--
-- Total: 30 articles (18 EN + 12 ES)
-- Featured: Article #5 (what-is-verified-cv) only
-- ============================================================


-- ------------------------------------------------------------
-- BLOQUE A: Quick Wins EN (Articles #1-4)
-- ------------------------------------------------------------


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Passport Details in Resume: What to Include and What to Avoid$$,
$$passport-details-in-resume$$,
$$Should you include passport details in your resume? Learn exactly what to add, what to skip, and how verified profiles are replacing outdated document sharing.$$,
$$When preparing your resume for an international job application, one question comes up more often than you might expect: should you include passport details in your resume? The answer is not straightforward — it depends on the country, the industry, and the employer's specific requirements. Getting this wrong can cost you an interview or, worse, expose you to identity theft. This guide breaks down everything you need to know.

## Why Employers Ask for Passport Details

In many regions — particularly across the Gulf Cooperation Council (GCC), Southeast Asia, and parts of Europe — employers routinely request passport information as part of the initial application. This is typically to verify nationality, confirm work eligibility, or pre-screen candidates for visa sponsorship purposes.

However, not all requests are legitimate. Understanding *why* a company is asking for passport details in your resume helps you respond appropriately and protect yourself.

:::info Passport details in a resume are most commonly required in GCC countries (UAE, Saudi Arabia, Qatar, Kuwait), Singapore, and other markets where visa status directly affects hiring decisions. In the US, UK, Canada, and Australia, sharing such details upfront is unusual and often unnecessary. :::

## What Passport Details Are Typically Requested

When an employer legitimately asks for passport details in your resume, the fields most commonly requested include:

- **Passport number** — the unique identifier on your travel document
- **Date of issue and expiry** — to confirm the document is valid
- **Nationality / country of issue** — to assess work eligibility
- **Place of birth** — occasionally required for visa processing
- **Visa status** — whether you hold a current work visa, residency, or require sponsorship

Some job boards in the Middle East have dedicated resume fields for these data points. Others expect them in a dedicated "Personal Information" section at the top of the CV.

## What You Should Absolutely Avoid Including

Not everything on your passport belongs on your resume. Even when an employer asks for passport details in your resume, there are items you should withhold until a formal, secure channel is established:

- **A photo or scan of your passport** — never attach this to an email or upload it to an unverified job portal
- **Your full biometric data or MRZ code** — the machine-readable zone at the bottom of your passport contains sensitive encoded data
- **Bank details linked to your passport** — some fraudulent listings fish for financial information under the guise of "payroll setup"
- **Passport details on publicly visible profiles** — if your resume is uploaded to a public job board, remove passport fields entirely

:::warning A surge in recruitment fraud means you should never send a passport scan to a recruiter you have not independently verified. According to a 2025 survey, 90% of recruiters report an increase in low-effort and spam applications — and fraudsters are exploiting the same chaos to target candidates. :::

## How to Format Passport Details in Your Resume

If you are applying to a role that legitimately requires this information, here is a clean, professional way to present it within a dedicated "Personal Information" block at the top of your CV:

**Nationality:** British
**Passport Number:** 123456789
**Passport Expiry:** June 2029
**Visa Status:** Requires sponsorship

Keep this section brief and factual. Do not repeat it elsewhere in the document. If the employer's application form has dedicated fields, use those instead of embedding the data in your resume file itself — it is safer and easier to track.

:::example If you are applying for a role in Dubai and the job listing says "candidates must be visa-eligible," include your nationality and current visa status in the Personal Information section. Skip the passport number until the employer formally requests it through a secure HR system. :::

## When to Withhold Passport Details Entirely

There are scenarios where including passport details in your resume is not only unnecessary but actively inadvisable:

- **Applying to companies in the US, UK, Canada, or Australia** — these markets have strict data protection rules, and sharing passport data upfront can actually flag you as unfamiliar with local hiring norms
- **Applying via public job boards** — your uploaded resume may be indexed and accessible to multiple parties
- **Early-stage speculative applications** — if you are sending a general inquiry rather than responding to a specific listing, hold back sensitive information

If you are curious about broader questions of what constitutes trustworthy candidate documentation, see our guide on [what is passport details in resume](/resources/blog/what-is-passport-details-in-resume) for a deeper breakdown of how this concept has evolved.

## The Rise of Verified Professional Profiles

The traditional resume is under increasing pressure. According to Willo's Hiring Trends 2026 report, **41% of employers are actively moving away from CV-first hiring**, citing unreliable credentials and the explosion of AI-generated content. Meanwhile, **57% of recruiters report noticing more AI-generated CVs** in their inboxes, making it harder than ever to trust what candidates submit.

This is driving a shift toward verified digital profiles — a system where your credentials, work history, and qualifications are independently confirmed rather than self-reported. Instead of attaching a passport scan to an email, you share a verified profile link. The employer clicks it, sees confirmed data, and moves forward with confidence.

Platforms like YourCVPassport are built around this model. Your [verified CV profile](/resources/blog/what-is-verified-cv) becomes your passport to opportunity — without ever putting your physical passport at risk.

## Protecting Yourself in a High-Fraud Environment

As you navigate international job applications, apply these practical safety rules:

- Only share passport details through encrypted, official HR platforms
- Verify the recruiter's identity and company registration before sending any documents
- Never send passport photos via WhatsApp, personal email, or messaging apps
- If a listing asks for passport details before even scheduling an interview, treat it as a red flag
- Use a verified professional profile wherever possible to replace the need for early-stage document sharing

The goal is to give employers the confidence they need while keeping your personal documents secure until the right moment in the hiring process.

Ready to build your verified professional profile? [YourCVPassport](https://yourcvpassport.com) helps you create a verifiable, trustworthy profile that stands out to employers worldwide — without putting your passport data at risk.$$,
$$https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&q=80&auto=format&fit=crop$$,
$$Career Tips$$,
false,
'2026-03-01',
$$Passport Details in Resume: What to Include$$,
$$Should you include passport details in your resume? Learn what to add, what to avoid, and how verified profiles protect your identity in job applications.$$,
'en'
);

-- Article 2


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$CV Passport: What It Means and Why You Need a Verified Professional Profile$$,
$$cv-passport-meaning-verified-profile$$,
$$Discover what a CV passport is, how it differs from a traditional resume, and why verified professional profiles are becoming the new standard in global hiring.$$,
$$The term *CV passport* is appearing with increasing frequency in hiring conversations, career coaching circles, and HR technology discussions. But what does it actually mean? Is it a literal travel document? A digital credential? A new format of resume? The answer is nuanced — and understanding it could change how you approach your professional identity online.

## The Literal vs. The Professional Meaning

In the most literal sense, a CV passport refers to the intersection of your professional CV and your passport as an identity document — the combination of credentials and verified personal information that together establish who you are and what you are qualified to do.

In the broader, more modern sense, a **CV passport** is a verified digital professional profile: a single, trusted source of truth about your career history, skills, qualifications, and identity — one that can be shared with employers, referenced by recruiters, and updated as your career evolves.

Think of it as your professional passport to opportunities around the world. Just as a physical passport grants you access to countries, a CV passport grants you access to roles, companies, and career paths — with the added power of verified, trustworthy data.

:::info The concept of a CV passport is not just semantic. It represents a structural shift in how professionals present themselves: moving from static, self-reported documents to dynamic, verified profiles that employers can trust at a glance. :::

## Why Traditional CVs Are Losing Ground

The traditional CV has served professionals for decades, but it is increasingly showing its age. Consider these signals from the 2025–2026 hiring landscape:

- **37% of employers** now say that credentials and CVs are no longer reliable indicators of candidate quality (Willo Hiring Trends 2026)
- **57% of recruiters** report noticing more AI-generated CVs than ever before (Resume Now 2025)
- **99% of Fortune 500 companies** use ATS systems with AI to filter and rank CVs before a human ever reads them

The result is a system where candidates game the algorithm, employers distrust what they receive, and genuine talent gets lost in the noise. The CV passport model is a direct response to this breakdown.

## What a Verified CV Passport Contains

A well-built CV passport goes beyond listing job titles and dates. It is structured to give employers verifiable confidence across multiple dimensions of your professional identity:

- **Verified identity** — confirmed through official documentation, not just self-declaration
- **Employment history** — cross-referenced with employer records or professional references
- **Education and qualifications** — linked to issuing institutions where possible
- **Skills and competencies** — assessed or endorsed rather than simply listed
- **Professional reputation** — stamps, endorsements, or ratings from past employers and collaborators
- **Visa and work eligibility** — clearly indicated and verified, removing ambiguity for international hiring

When you share your CV passport with an employer, they are not reading a document you wrote about yourself. They are viewing a profile that has been independently validated.

:::tip Think of the difference this way: a traditional CV is like a letter of introduction you write yourself. A CV passport is like a letter of introduction countersigned by every employer, institution, and professional body you have ever worked with. :::

## How CV Passports Work in Practice

The practical mechanics of a CV passport vary by platform, but the core workflow is consistent:

1. You create a professional profile with your career history, skills, and credentials
2. The platform verifies key data points — identity, qualifications, employment — through integrations or document review
3. You receive a shareable profile link (your CV passport URL)
4. You include this link in job applications, on LinkedIn, in email signatures, or anywhere a recruiter might look
5. The employer clicks the link and views a live, verified snapshot of your professional identity

This model has significant advantages over attaching a PDF. Your profile can be updated in real time. Employers always see current information. And you control exactly what is shared and with whom.

For a deeper look at how verified credentials work in practice, see our article on [verified CV profiles](/resources/blog/what-is-verified-cv).

## Who Benefits Most from a CV Passport

While any professional can benefit from a verified profile, certain groups stand to gain the most:

- **International job seekers** — where identity and work eligibility are central to the hiring decision
- **Freelancers and consultants** — who need to establish trust quickly with clients who do not know them
- **Recent graduates** — who lack an extensive work history but want to showcase verified qualifications and skills
- **Executives and senior professionals** — for whom reputation and verified track record carry enormous weight
- **Professionals in regulated industries** — healthcare, finance, law — where credential verification is mandatory

In each of these cases, the CV passport model reduces friction, accelerates trust, and gives the candidate a competitive edge over those relying on unverified documents.

## The Employer Perspective

From the hiring manager's side of the table, the appeal of the CV passport is simple: it saves time and reduces risk. With **78% of hiring managers** saying they look for personalized, trustworthy candidate details (Resume Now 2025), a verified profile that surfaces confirmed information immediately is far more valuable than another PDF to parse.

Verification also protects against the growing problem of credential fraud. When qualifications are confirmed at the platform level, the employer does not have to conduct their own time-consuming background check for basic credentials — it has already been done.

:::warning As AI-generated CVs become indistinguishable from human-written ones, employers are increasingly relying on verification signals — third-party endorsements, confirmed employment dates, validated qualifications — to make confident hiring decisions. Without these signals, even a genuinely excellent candidate can be overlooked. :::

## Building Your CV Passport Today

The shift toward verified professional profiles is already underway. Early adopters are building a meaningful advantage: their applications arrive pre-verified, their credibility is established before the first conversation, and their profiles continue working for them passively — surfaced in recruiter searches, referenced by colleagues, and shared across networks.

Building your CV passport is not about replacing your traditional resume. It is about extending and verifying it — creating a living professional identity that grows with your career.

Ready to build your verified professional profile? [YourCVPassport](https://yourcvpassport.com) helps you create a verifiable, trustworthy profile that stands out to employers worldwide — your true CV passport to global opportunity.$$,
$$https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80&auto=format&fit=crop$$,
$$Career Tips$$,
false,
'2026-03-03',
$$CV Passport: Meaning and Why You Need One$$,
$$What is a CV passport? Learn how verified profiles are replacing traditional CVs and why employers worldwide trust them over self-reported documents.$$,
'en'
);

-- Article 3


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$ATS with API Access: How Modern Applicant Tracking Systems Connect with Verification Platforms$$,
$$ats-with-api-access$$,
$$Learn how ATS with API access transforms hiring via real-time verification, reduces fraud, and why HR teams are integrating verification platforms now.$$,
$$Applicant Tracking Systems have been the backbone of corporate recruiting for over two decades. But the traditional ATS — a database that stores resumes, tracks application stages, and filters candidates by keyword — is no longer sufficient on its own. The next frontier is **ATS with API access**: systems that connect in real time with verification platforms, skills databases, background check providers, and HR analytics tools. This connectivity is transforming how organizations hire.

## What ATS with API Access Actually Means

At its core, an ATS with API access is an applicant tracking system that exposes or consumes application programming interfaces — standardized communication channels that allow software systems to exchange data automatically.

In practical hiring terms, this means your ATS can:

- **Pull verified candidate data** directly from professional profile platforms like YourCVPassport
- **Trigger background checks** automatically when a candidate reaches a certain pipeline stage
- **Sync with HRIS systems** to create employee records the moment an offer is accepted
- **Feed analytics platforms** with real-time hiring funnel data
- **Connect with skills assessment tools** to append test scores to candidate profiles

The difference between a standalone ATS and an ATS with API access is the difference between a filing cabinet and a live data network. One stores information; the other orchestrates it.

:::info According to industry data, 99% of Fortune 500 companies now use ATS systems — and increasingly, those systems are API-enabled, connecting to a growing ecosystem of HR technology tools that each add a layer of intelligence to the hiring process. :::

## Why API Connectivity Matters for Credential Verification

One of the most significant applications of ATS with API access is real-time credential verification. Historically, verifying a candidate's qualifications required a separate, manual process: contacting universities, calling former employers, cross-referencing certifications. This took days or weeks and often happened *after* a conditional offer was made.

With API-connected verification platforms, the workflow changes entirely:

1. Candidate applies and includes their verified profile link (or the system retrieves it via email match)
2. The ATS calls the verification platform's API and retrieves confirmed credentials
3. The recruiter sees a verification badge or score alongside the candidate's record in the ATS
4. No manual check is required for basic credential confirmation

This dramatically reduces time-to-hire, removes a major source of hiring bottlenecks, and surfaces fraud signals early — before resources are invested in interviewing an unqualified or dishonest candidate.

:::tip For HR teams evaluating new ATS platforms, API access should be a non-negotiable requirement. Ask vendors specifically about their REST API documentation, webhook support for stage changes, and existing integrations with verification and background check providers. :::

## The Verification Platform Side of the Integration

For verification platforms like YourCVPassport, offering API access means becoming connectable to the broader HR technology ecosystem. This is not just a technical feature — it is a strategic one.

When a verification platform exposes a well-documented API, it enables:

- **ATS vendors** to offer native integrations that surface verified profile data within their UI
- **Enterprise HR teams** to build custom integrations into their specific tech stack
- **Job boards** to display verification badges on candidate listings
- **Third-party developers** to build tools that enhance the hiring process using verified data

The result is that a candidate's verified profile does not sit in isolation — it becomes a data node that flows through the entire hiring workflow, adding value at every stage.

## Common Integration Patterns for ATS with API Access

Organizations implementing ATS with API access for verification typically use one of three patterns:

**Pattern 1: Candidate-initiated sharing**
The candidate includes their verified profile URL in their application. The ATS parses the URL, calls the platform API to retrieve verification status, and appends the result to the candidate record. This is the lightest-touch integration and works with any ATS that supports webhook or outbound API calls.

**Pattern 2: ATS-triggered lookup**
When a recruiter moves a candidate to a specific pipeline stage (e.g., "Shortlisted"), the ATS automatically fires an API call to the verification platform using the candidate's email address. If a verified profile exists, it is linked to the record. If not, an invitation is sent to the candidate to create one.

**Pattern 3: Deep bi-directional sync**
Enterprise implementations maintain a live sync between the verification platform and the ATS. Candidate profile updates — a new certification earned, a former employer confirming employment dates — are reflected in the ATS record in real time. This is the most powerful integration pattern and typically requires custom development or a dedicated integration middleware.

:::example A mid-sized technology company using Greenhouse ATS implements a webhook that fires when a candidate reaches the "Technical Interview" stage. The webhook calls YourCVPassport's API with the candidate's email, retrieves their verification score and confirmed credentials, and writes the result back to a custom field in Greenhouse. Recruiters can see at a glance which candidates have verified qualifications — before the interview begins. :::

## The Impact on Hiring Quality and Speed

The business case for ATS with API access is compelling when measured against actual hiring outcomes:

- **Reduced time-to-hire** — automated verification eliminates manual credential-checking delays
- **Lower fraud rate** — early-stage verification catches misrepresented qualifications before they cost the organization money
- **Better candidate experience** — verified candidates move through the pipeline faster, with fewer redundant information requests
- **Richer analytics** — API-connected systems produce richer data about what candidate attributes correlate with successful hires

Against a backdrop where **90% of recruiters report an increase in spam and low-effort applications** (Resume Now 2025), the ability to instantly surface which candidates have verified, trustworthy profiles is a genuine competitive advantage for the hiring organization.

## Evaluating ATS Platforms for API Readiness

Not all ATS platforms offer the same level of API access. When evaluating options, look for:

- **RESTful API** with comprehensive documentation and versioning
- **Webhook support** for event-driven integrations (stage changes, new applications, status updates)
- **OAuth 2.0 authentication** for secure third-party connections
- **Sandbox environments** for testing integrations before production deployment
- **Pre-built integrations** with major verification, background check, and HRIS platforms
- **Rate limiting policies** that accommodate enterprise-scale usage

The major enterprise ATS platforms — Greenhouse, Lever, Workday, iCIMS, SmartRecruiters — all offer robust API access. Mid-market options vary significantly. Always request API documentation before signing a contract. For a broader look at optimizing your resume for these systems, see our [ATS-friendly resume guide for 2026](/resources/blog/ats-friendly-resume-guide-2026).

## Building for the Verification-First Hiring Future

The trajectory is clear: hiring is moving toward verification-first workflows, and ATS with API access is the infrastructure that makes this possible. Organizations that invest in API-connected hiring stacks today will process applications faster, make more confident decisions, and build teams of genuinely qualified professionals.

For candidates, this shift means that a verified professional profile is no longer a nice-to-have — it is increasingly the price of entry into fast-moving, high-quality hiring pipelines.

Ready to build your verified professional profile? [YourCVPassport](https://yourcvpassport.com) helps you create a verifiable, trustworthy profile that stands out to employers worldwide — and connects seamlessly with the ATS systems recruiters already use.$$,
$$https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop$$,
$$Recruitment$$,
false,
'2026-03-05',
$$ATS with API Access: Connecting Verification Tools$$,
$$How ATS with API access enables real-time credential verification, cuts hiring fraud, and why HR teams are integrating verification platforms today.$$,
'en'
);

-- Article 4


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$What Is Passport Details in Resume? A Complete Guide for International Job Seekers$$,
$$what-is-passport-details-in-resume$$,
$$What is passport details in resume? Learn when to include them, what risks to avoid, and how verified profiles are changing international hiring in 2026.$$,
$$If you have ever applied for a job in another country — or even browsed international job boards — you have almost certainly encountered a field or instruction asking for passport details in your resume. For many professionals, particularly those applying from within their home country or targeting markets in the West, this request can feel confusing or even alarming. This complete guide explains what passport details in a resume means, when it is appropriate, and how to navigate it safely.

## Defining "Passport Details in Resume"

The phrase *what is passport details in resume* is one of the most common questions asked by first-time international job applicants, and the answer depends heavily on context.

In broad terms, passport details in a resume refers to specific identifying information taken from your travel passport and included in your job application document. This typically covers:

- **Full name as it appears on the passport** — which may differ from your commonly used name
- **Nationality** — the country that issued your passport
- **Passport number** — the unique alphanumeric identifier on your passport
- **Date of issue and expiry date** — confirming the document is current
- **Place of birth** — sometimes requested for visa pre-screening
- **Current visa status** — particularly relevant for candidates who are not citizens of the target country

The core purpose of asking for passport details in a resume is to allow an employer to pre-screen candidates for work eligibility before investing time in interviews — especially in markets where visa sponsorship is a significant cost and administrative burden.

:::info The practice of including passport details in a resume is most common in Gulf Cooperation Council (GCC) countries, Singapore, Hong Kong, Malaysia, and parts of Africa. In the European Union, North America, and Australia, employers are generally discouraged from requesting such information before a job offer, due to anti-discrimination laws. :::

## Why Employers Ask for Passport Information

Understanding *why* an employer requests this data helps you respond appropriately. The most legitimate reasons include:

**Work eligibility screening** — In countries where hiring a foreign national requires government approval or visa sponsorship, employers need to know your nationality and current status before they can assess whether hiring you is feasible.

**Visa processing preparation** — Some employers begin gathering documentation for work visas as soon as they identify a shortlisted candidate. Having passport details early accelerates this process.

**Identity verification** — In industries with strict regulatory requirements — government contracting, financial services, healthcare — employers may need to confirm your identity against official documents from the start.

**Background check initiation** — Passport details, particularly passport number and date of birth, are often required to initiate formal background checks with third-party providers.

## What Passport Details Do NOT Mean for Your Resume

There is a significant misconception that asking for passport details is equivalent to asking for a copy of your passport. These are very different requests:

- **Typing passport details into a resume** = sharing text data that confirms your identity and eligibility
- **Sending a scan or photo of your passport** = sharing a sensitive document that can be used for identity theft, cloning, or fraud

Never attach a passport scan or photograph to an initial job application unless you have verified the employer through official channels and are at a confirmed late-stage of the hiring process — typically after a formal offer letter.

:::warning Recruitment fraud is rising sharply. Fraudulent job listings specifically target candidates who are unfamiliar with local hiring norms and may be willing to send passport copies in response to what appears to be a routine request. If a listing asks for a passport scan before you have even had an interview, treat it as a serious red flag. :::

## How to Include Passport Details in Your Resume Correctly

When passport details in a resume are genuinely required, the professional standard is to include them in a compact **Personal Information** section at the very top of your CV, above your professional summary. Here is a template:

**Full Name:** Alexandra Johnson (as per passport)
**Nationality:** Canadian
**Passport Number:** AB1234567
**Passport Expiry:** March 2028
**Current Location:** Toronto, Canada
**Visa Status:** Requires sponsorship / Valid work visa (specify)

Keep this section limited to what the employer has explicitly requested. Do not volunteer information beyond what is necessary, and do not repeat passport details elsewhere in the document.

For practical guidance on formatting and exactly what to include depending on your target market, see our companion guide on [passport details in resume](/resources/blog/passport-details-in-resume), which covers region-specific best practices in detail.

:::example A software engineer in India applying for a role in Dubai includes the following at the top of her resume: Nationality: Indian | Passport No.: Z1234567 | Expiry: Aug 2027 | Visa Status: Requires sponsorship. She does not attach her passport scan. She does not include her full biometric data. She simply provides the text fields the employer needs to assess her eligibility. :::

## Risks to Understand and Avoid

Understanding what passport details in a resume means also means understanding the risks. The main concerns are:

**Identity theft** — Passport numbers combined with your name, date of birth, and address are sufficient for certain forms of identity fraud. Sending this information to unverified parties is dangerous.

**Discrimination** — In some markets, sharing nationality or birthplace early in the process can expose you to discriminatory screening — which is why many Western employers are legally prohibited from requesting it.

**Data security** — Resumes sent via email or uploaded to job boards may not be stored securely. Passport details embedded in a document can be exposed in data breaches.

**Irrelevance** — Including passport details when they are not needed (for example, when applying for a domestic role) signals unfamiliarity with local hiring norms and can make your application look less polished.

## The Shift Toward Verified Profiles

The most forward-thinking solution to the passport details dilemma is not better formatting — it is a structural change in how professional identity is established and shared.

According to Willo's Hiring Trends 2026 report, **41% of employers are moving away from CV-first hiring**, driven in large part by the unreliability of self-reported documents. At the same time, **37% say credentials and CVs are no longer reliable indicators** of actual candidate quality.

Verified professional profiles address this directly. Instead of asking candidates to type sensitive passport details into a resume and email it to an unknown address, employers can request a verified profile link. The platform has already confirmed the candidate's identity, nationality, and work eligibility through a secure, controlled process. The employer sees confirmed data without the candidate ever exposing a raw passport document.

This is the model that [verified CV profiles](/resources/blog/what-is-verified-cv) are built on — and it represents the most sensible path forward for international hiring on both sides of the table.

## Practical Checklist for International Applicants

Before including passport details in any resume or application:

- Confirm the request is from a legitimate, registered company
- Check whether the target country's hiring norms support this request
- Include text data only — never a scanned document in an initial application
- Use a secure, dedicated application portal where possible, not a personal email chain
- Consider creating a verified professional profile so your identity and eligibility can be confirmed through a trusted platform rather than raw document sharing
- Remove passport details from any resume version uploaded to public job boards

Being well-prepared about what is passport details in resume — and what it does not mean — puts you in control of your application, your data, and your professional reputation.

Ready to build your verified professional profile? [YourCVPassport](https://yourcvpassport.com) helps you create a verifiable, trustworthy profile that stands out to employers worldwide — removing the need to expose sensitive passport data in the early stages of your job search.$$,
$$https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80&auto=format&fit=crop$$,
$$Career Tips$$,
false,
'2026-03-08',
$$What Is Passport Details in Resume? Full Guide$$,
$$What is passport details in resume? This guide covers what to include, what to avoid, regional norms, and how verified profiles protect your job search.$$,
'en'
);



-- ------------------------------------------------------------
-- BLOQUE B: SEO Pillars EN+ES (Articles #5-10)
-- ------------------------------------------------------------


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$What Is a Verified CV? The Future of Trusted Hiring in 2026$$,
$$what-is-verified-cv$$,
$$A verified CV is the new gold standard in hiring. Discover what it means, why it matters in 2026, and how it protects both candidates and employers.$$,
$$The job market has changed. Candidates are flooding inboxes with AI-generated applications, employers are questioning the reliability of every credential they receive, and recruiters are spending more time fact-checking than actually recruiting. Against this backdrop, one concept is emerging as the cornerstone of modern hiring: the **verified CV**.

But what exactly is a verified CV — and why is it quickly becoming non-negotiable in 2026?

## What Is a Verified CV?

A verified CV (also called a verified resume) is a professional profile in which key claims — work history, educational qualifications, skills, and certifications — have been independently authenticated and confirmed. Unlike a traditional self-reported document, a verified CV carries a digital trust signal that tells employers: *this information has been checked*.

Verification can happen through several mechanisms: third-party credential verification services, employer confirmation, digital badge systems, or platform-based audit trails that log when credentials were added and by whom.

:::info A verified CV is not just a document — it is a living, auditable professional record that gives hiring teams confidence before the first interview even takes place. :::

## Why Traditional CVs Are Losing Credibility

The numbers tell a stark story. According to Willo's 2026 Hiring Trends report, **37% of employers now say credentials and CVs are no longer reliable indicators** of a candidate's true abilities. Meanwhile, **57% of recruiters report noticing more AI-generated CVs** than ever before (Resume Now, 2025), and **90% report an increase in spam or low-effort applications** flooding their pipelines.

The problem is structural. A traditional resume is a self-reported document with no accountability layer. Anyone can claim a degree they do not hold, inflate job titles, or fabricate years of experience. Without verification, employers have no efficient way to distinguish genuine candidates from those who have simply learned to game the system.

- Résumé fraud costs companies thousands in bad hires and onboarding waste
- Reference checks — the traditional safeguard — are slow, inconsistent, and easy to manipulate
- AI-assisted résumé writers can produce flawless-looking documents in minutes

:::warning According to Willo's 2026 research, 10% of companies have already replaced CVs entirely with skills-based assessments. The shift away from traditional documents is not theoretical — it is happening right now. :::

## The Rise of Verification-First Hiring

Forward-thinking employers are no longer treating verification as an afterthought done after an offer is made. They are building it into the very beginning of their hiring process. "Recruiters expect verification at one click away," notes a 2026 analysis from The Interview Guys — and platforms that provide this instant credibility signal are reshaping recruiter behavior.

In a verification-first model, candidates arrive in the pipeline with their key credentials already confirmed. Employers can filter, shortlist, and schedule interviews with confidence. The time savings alone — eliminating manual reference checks and credential audits — represent a significant competitive advantage.

This approach also shifts power back to qualified candidates. When your verified CV appears alongside unverified competitors, it stands out immediately as trustworthy and professional.

## What Gets Verified in a Modern Verified CV?

Not every claim carries equal weight. The most impactful elements to verify include:

- **Work experience** — Dates, titles, and organizations confirmed by former employers or platform records
- **Educational qualifications** — Degrees and diplomas authenticated against institutional records
- **Professional certifications** — Badges and credentials linked to issuing authorities with expiry tracking
- **Skills assessments** — Competency scores from standardized tests attached directly to the profile
- **Professional stamps** — Endorsements from verified colleagues, mentors, or institutions

:::tip When building your verified CV, prioritize verifying the credentials most relevant to your target roles. A software engineer should focus on certifications and skills tests; a finance professional on qualifications and regulated experience. :::

## Verified CVs vs. Traditional Resumes: A Direct Comparison

| Feature | Traditional Resume | Verified CV |
|---|---|---|
| Credential accuracy | Self-reported | Independently confirmed |
| Employer trust level | Low to moderate | High |
| Fraud risk | High | Minimal |
| Time to verify for employer | Days to weeks | Seconds |
| Candidate differentiation | Limited | Immediate |
| Update process | Manual | Dynamic, real-time |

The gap in employer trust is not subtle. A verified CV removes the guesswork from early-stage screening and allows recruiters to focus on what matters: assessing fit, culture, and potential.

## How Verified CVs Protect Candidates Too

Verification is not only about protecting employers. For candidates, a verified professional profile provides:

- **Protection against credential theft** — Verified records are harder to replicate or falsely claim
- **Faster hiring timelines** — Employers who trust your credentials move more quickly to interviews
- **Stronger negotiating position** — Verified competencies support salary discussions with objective data
- **Visibility in algorithmic searches** — Many platforms now prioritize verified profiles in recruiter search results

:::example A marketing director with a verified CV displaying confirmed agency experience, measurable campaign results, and platform-endorsed leadership skills will consistently outperform an equally qualified candidate with an unverified Word document — not because of talent, but because of trust. :::

## The Technology Behind Modern Verification

Today's verified CVs leverage several layers of technology working in concert:

**Blockchain-anchored credentials** store degree and certification data in tamper-proof distributed ledgers, allowing instant verification without contacting institutions directly.

**Digital badge ecosystems** like those built on the Open Badges standard embed metadata — issuer, issue date, criteria, and expiry — directly into credential images that travel with a candidate's profile.

**Platform audit trails** record when experience entries were added, modified, and confirmed, creating a chronological trust record visible to employers.

**AI-powered verification engines** cross-reference claimed credentials against public records, LinkedIn data, company registries, and institutional databases in real time.

To understand how AI specifically is transforming this space, read our deep dive: [How AI Is Revolutionizing Professional Profile Verification](/resources/blog/ai-revolutionizing-profile-verification).

## Getting Started with Your Verified CV

Building a verified CV does not have to be a lengthy process. The most effective approach is to start with your highest-value credentials and build outward:

1. Claim and verify your most recent and relevant work experience
2. Upload and authenticate your educational qualifications
3. Complete skills assessments relevant to your industry
4. Collect professional stamps from colleagues and mentors
5. Keep your profile dynamic — add new certifications as you earn them

The verification process on platforms like YourCVPassport is designed to be completed in sessions rather than all at once. Even a partially verified profile carries significantly more weight than an entirely unverified one.

Also see: [CV Verification: Why Employers No Longer Trust Traditional Resumes](/resources/blog/cv-verification-employers) for a detailed breakdown of how verification is changing recruiter behavior.

## The Future: Verified Profiles as the Default

By 2027, industry analysts expect verified professional profiles to be the baseline expectation rather than the exception. Just as SSL certificates became mandatory for websites, verification layers are becoming mandatory for professional credibility. Employers building their tech stacks today are prioritizing integrations with verification platforms over those that simply aggregate unverified resumes.

The candidates who build verified CVs now are not just preparing for today's job market — they are positioning themselves as the default choice for tomorrow's.

Start building your verified professional profile today at [YourCVPassport](https://yourcvpassport.com) — the platform that puts your authentic credentials front and center.$$,
$$https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80&auto=format&fit=crop$$,
$$Verification$$,
TRUE,
'2026-03-10',
$$What Is a Verified CV? The Complete Guide for 2026$$,
$$Discover what a verified CV is, why it matters in 2026, and how verified resumes are transforming hiring for candidates and employers alike. Start today.$$,
'en'
);

-- Article #6: CV Verification — Why Employers No Longer Trust Traditional Resumes
-- FIXES: meta_description expanded to 150 chars (was 144)


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$CV Verification: Why Employers No Longer Trust Traditional Resumes$$,
$$cv-verification-employers$$,
$$Employers are losing faith in traditional CVs. Explore the data behind CV verification demand in 2026 and what hiring teams are doing differently.$$,
$$There is a quiet crisis unfolding inside every hiring team in the world. Applications are arriving in record volumes, candidates look exceptional on paper, and yet something fundamental has broken down: employers no longer trust what they are reading.

The traditional resume — that self-reported, unaudited document that has governed professional hiring for decades — is under serious scrutiny. And **CV verification** is emerging as the industry's answer.

## The Trust Collapse in Modern Recruiting

The statistics from 2025 and 2026 paint an uncomfortable picture. According to Willo's 2026 Hiring Trends report, **41% of employers are actively moving away from CV-first hiring**. More telling still: **37% say that credentials and CVs are no longer reliable indicators** of a candidate's actual abilities or experience.

This is not a fringe position. This is nearly two in five hiring professionals expressing fundamental skepticism about the document that has traditionally sat at the center of every application process.

The reason for this crisis is not mysterious. Three converging forces have demolished the credibility of the traditional resume:

- **The AI writing explosion** — 57% of recruiters now report noticing more AI-generated CVs (Resume Now, 2025). Polished, keyword-optimized, grammatically flawless — and potentially entirely fabricated.
- **Application volume inflation** — 90% of recruiters report an increase in spam and low-effort applications. Volume creates noise that buries genuine talent and rewards those who apply fastest rather than those most qualified.
- **The personalization gap** — 78% of hiring managers specifically look for personalized details that demonstrate genuine engagement with a role. Generic applications — AI or otherwise — consistently fail this test.

:::warning 62% of employers now report rejecting generic AI-generated CVs that lack personal touch (Resume Now, 2025). The days of blasting a polished but hollow document to hundreds of employers are numbered. :::

## What CV Verification Actually Means for Employers

**CV verification** — or **resume verification** — is the process of independently confirming that the information a candidate has presented is accurate. In practice, this means cross-referencing:

- Employment dates and job titles against company records
- Educational qualifications against institutional databases
- Professional certifications against issuing bodies
- Skills against demonstrated or assessed competencies

Historically, this process was slow, manual, and expensive. Reference calls could take days. Background check vendors charged per hire. Institutional verification required formal written requests.

Modern CV verification platforms have compressed this process dramatically. "Recruiters expect verification at one click away," according to a 2026 analysis from The Interview Guys — and the technology is now capable of delivering exactly that.

:::info Resume verification does not replace human judgment in hiring — it removes the friction that prevents human judgment from being applied to what actually matters: assessing fit, potential, and personality. :::

## How Employers Are Adapting Their Hiring Processes

Faced with unreliable self-reported data, forward-thinking recruitment teams are rebuilding their processes around verification from the start rather than the end.

**Shortlisting by verified credentials only.** Rather than reading every application, many teams now filter first for candidates with verified work history or confirmed qualifications before allocating any human review time.

**Prioritizing platform profiles over attached documents.** Static PDF resumes are increasingly being replaced in recruiter searches by dynamic verified profiles that carry embedded trust signals. Platforms that surface only verified candidates give employers a pre-filtered talent pool.

**Integrating verification into ATS workflows.** Applicant tracking systems are beginning to incorporate real-time verification APIs, flagging unverified claims automatically during the screening stage.

**Skills-based assessment pairing.** Some employers now require candidates to complete a short competency test alongside their verified credentials — creating a two-layer validation that combines what a candidate claims with what they can demonstrate. According to Willo, 10% of companies have already moved entirely to skills-based assessments, abandoning the traditional resume altogether.

:::tip If your organization is still relying solely on self-reported CVs at the shortlisting stage, you are operating with a significant credibility gap. Introducing even basic verification signals — verified education, confirmed employers — can dramatically improve shortlist quality. :::

## The Fraud Problem No One Wants to Discuss

Resume fraud is more common than most hiring professionals acknowledge publicly. Studies consistently find that significant percentages of applicants misrepresent their qualifications in some form — from minor inflation of job titles to outright fabrication of degrees.

The consequences of hiring a fraudulent candidate extend beyond the individual bad hire. Training costs are wasted. Team dynamics suffer. Legal exposure increases if the misrepresented qualification was material to a regulated role. And the reputational damage from a high-profile hiring failure can affect employer brand for years.

CV verification — specifically **resume verification** at scale — is the most efficient systemic defense against this risk. When candidates know their credentials will be verified, the incentive to misrepresent them collapses. The screening pool self-selects toward honesty.

For a deeper exploration of how fraud reduction intersects with verified profiles, see: [Verified Profiles Reduce Hiring Fraud](/resources/blog/verified-profiles-reduce-hiring-fraud).

## What This Means for Candidates

The shift toward CV verification is not only an employer story. For candidates who have genuinely earned their credentials, a verified professional profile is a competitive superweapon.

In a pool of fifty applicants where forty-eight have unverified PDFs and two have fully verified profiles, those two rise immediately to the top of the shortlist — not because they are more talented, but because they have removed the uncertainty that buries everyone else.

This is the fundamental insight that separates 2026's most successful job seekers from those still relying on traditional application methods.

- Verified candidates are shortlisted faster
- Verified credentials support stronger salary negotiations
- Verified profiles are surfaced preferentially in recruiter search algorithms
- Verified professionals build lasting digital reputations that compound over time

For more on what a verified profile looks like in practice, read: [What Is a Verified CV? The Future of Trusted Hiring in 2026](/resources/blog/what-is-verified-cv).

## Building Verification Into Your Hiring Stack

For employers looking to integrate CV verification into their process, the practical steps are more accessible than many assume:

1. **Choose a verification-native platform** for sourcing candidates — one where profiles carry embedded trust signals rather than raw document uploads
2. **Define which credentials are verification-mandatory** for your most critical roles
3. **Communicate your verification expectations to candidates** clearly in job postings
4. **Use AI-assisted screening tools** that can flag inconsistencies in claimed credentials before human review begins
5. **Build verification checkpoints into offer letters** — making conditional offers subject to credential confirmation

## The New Standard Is Already Here

CV verification has moved from an emerging trend to an operational requirement in competitive hiring markets. The employers who recognize this shift earliest — and build their processes accordingly — will access better talent faster and with significantly less risk than those still relying on self-reported documents alone.

The question is no longer whether resume verification is worth investing in. The question is how quickly your organization can get there.

Start building your verified professional profile today at [YourCVPassport](https://yourcvpassport.com) — the platform that puts your authentic credentials front and center.$$,
$$https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=1200&q=80&auto=format&fit=crop$$,
$$Recruitment$$,
false,
'2026-03-12',
$$CV Verification: Why Employers Distrust Traditional Resumes$$,
$$41% of employers are moving away from CV-first hiring. Learn why CV verification is now essential and how it is reshaping recruitment practices in 2026.$$,
'en'
);

-- Article #7: How AI Is Revolutionizing Professional Profile Verification
-- FIXES: meta_description trimmed to 155 chars (was 157); summary trimmed to 157 chars (was 176)


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$How AI Is Revolutionizing Professional Profile Verification$$,
$$ai-revolutionizing-profile-verification$$,
$$AI resume verification is transforming hiring at scale. Discover how artificial intelligence makes professional profile verification faster, smarter, and fraud-resistant.$$,
$$Artificial intelligence has already transformed how candidates write their CVs. Now it is transforming how those CVs are verified — and the implications for hiring are profound.

**AI resume verification** and **AI CV verification** technologies are moving from experimental to essential. Where manual verification once took days and cost significant resources per hire, AI-powered systems can now confirm credentials, detect inconsistencies, and surface trustworthy candidates in real time. The result is a hiring ecosystem that is simultaneously faster, more accurate, and more resistant to fraud than anything that came before.

## The AI Paradox at the Heart of Modern Hiring

There is a sharp irony embedded in the current moment. The same artificial intelligence that has made it trivially easy to generate polished, keyword-optimized, professionally formatted CVs is now being deployed to verify whether those CVs are trustworthy.

The numbers make this tension visible. A 2025 Resume Now study found that **57% of recruiters now notice more AI-generated CVs** than they did two years ago, and **90% report a surge in spam and low-effort applications**. At the same time, **78% of hiring managers say they specifically look for personalized details** that distinguish genuine candidates — details that AI writing tools consistently fail to produce convincingly.

The hiring community is caught between two AI forces: generation and verification. The platforms and employers who leverage **AI CV verification** effectively will resolve this tension in favor of trust.

:::warning The AI arms race in hiring is real. Generative AI creates unverified CVs at scale; verification AI authenticates credentials at scale. Candidates and employers who understand this dynamic will navigate 2026's job market with significantly more clarity than those who do not. :::

## What AI Resume Verification Actually Does

**AI resume verification** is not a single technology but a layered system of machine learning models, natural language processing, and data cross-referencing working in concert. In practice, it performs several distinct functions simultaneously:

**Credential cross-referencing.** AI engines compare claimed qualifications against databases of educational institutions, professional certification bodies, and company registries. Inconsistencies — degree dates that do not align with graduation records, certifications from bodies that do not issue them — are flagged immediately.

**Timeline coherence analysis.** Employment gap detection, overlapping role identification, and chronological impossibilities are identified by models trained on millions of professional profiles. A candidate claiming to have held two full-time positions simultaneously at the same career level, for instance, triggers an automatic review flag.

**Linguistic authenticity scoring.** Natural language processing models can identify the probabilistic signature of AI-generated text in experience descriptions and summaries. While not definitive proof of fabrication, high AI-generation scores prompt deeper manual review.

**Network corroboration.** AI systems cross-reference professional connections, endorsements, and institutional affiliations to build a corroborating web of evidence around key claims.

:::info AI resume verification does not replace human judgment — it directs it. By handling the systematic, pattern-matching work of credential checking, AI frees recruiters to focus entirely on the deeply human work of assessing fit, motivation, and cultural alignment. :::

## The Speed Transformation

The speed advantage of AI CV verification is perhaps its most immediately impactful quality. Consider what traditional verification required:

- Contacting each former employer by phone or email to confirm employment
- Submitting written requests to educational institutions for degree confirmation
- Waiting for certification bodies to respond to credential queries
- Chasing references who may be slow to respond or reluctant to give detailed feedback

Each step could add days or weeks to a hiring process that candidates experience as opaque and frustrating. Top candidates — the ones with the most options — routinely accept competing offers during lengthy verification delays.

AI-powered verification compresses this timeline dramatically. Many credential checks that previously required days can now be completed in seconds through automated database queries and API integrations. The result is a hiring process that is faster, more competitive for top talent, and dramatically less resource-intensive.

:::tip For employers competing for senior or specialist talent, verification speed is a direct recruiting advantage. Candidates with verified profiles can be extended offers faster — before competitors who are still manually fact-checking have completed their screening. :::

## AI Verification and the Fight Against Resume Fraud

The connection between AI CV verification and fraud reduction is direct and measurable. When candidates know that AI-powered systems will cross-reference their claimed credentials against authoritative databases, the incentive to embellish or fabricate collapses.

This creates what researchers call a "self-selection effect": the pool of applicants to verification-first employers naturally skews toward those with legitimate credentials. Fraudulent applicants — even sophisticated ones — recognize that the probability of detection is too high to risk.

For employers, this means that implementing AI resume verification does not only catch fraud after it occurs. It prevents much of it from being attempted in the first place.

The specific economic case for this prevention is significant. A bad hire resulting from credential fraud can cost an organization multiple times the position's annual salary when onboarding, productivity loss, legal exposure, and re-recruitment costs are totaled.

For a broader perspective on how employers are responding to this challenge, read: [CV Verification: Why Employers No Longer Trust Traditional Resumes](/resources/blog/cv-verification-employers).

## The Candidate Experience: AI Verification as a Feature, Not a Friction

Early concerns about AI verification focused on candidate experience: would the process feel intrusive, slow, or adversarial? Evidence from 2025 and 2026 suggests the opposite — when verification is embedded into a platform experience rather than imposed as a separate bureaucratic step, candidates experience it as a feature that works in their favor.

Candidates who complete profile verification on platforms like YourCVPassport report:

- **Higher shortlisting rates** — verified profiles are surfaced more frequently in recruiter searches
- **Faster hiring timelines** — fewer delays caused by post-offer verification
- **Greater confidence** in application processes — knowing their credentials are confirmed removes anxiety about whether employers will question their qualifications
- **Stronger negotiating positions** — verified competencies provide objective data to support salary conversations

The shift in candidate attitude toward AI resume verification mirrors the shift that occurred with identity verification in financial services. Initially perceived as friction, verification has become a trust signal that sophisticated users actively seek out.

## Real-Time Verification and the Dynamic Profile

One of the most significant innovations enabled by AI is real-time, dynamic verification — the ability to update and re-verify professional credentials continuously rather than at a fixed point in time.

Traditional background checks are point-in-time snapshots. A candidate verified three years ago may have since allowed a professional license to lapse, accumulated a regulatory record, or experienced a change in professional standing that would be material to a new employer.

AI-powered dynamic verification maintains live connections to credential databases, alerting candidates when certifications are approaching expiry and updating employer-facing trust signals automatically when credentials are renewed or revoked.

This living, breathing professional record is fundamentally different from a static document — and it represents the direction in which verified professional profiles are evolving.

For more on what this looks like in practice, read: [Verified Professional Profiles: The New Standard for Job Applications](/resources/blog/verified-professional-profiles-standard).

## How AI Verification Integrates with Existing HR Tech

Modern **AI CV verification** platforms are designed for integration rather than replacement. They slot into existing applicant tracking systems via API, providing verification signals that ATS platforms surface natively within familiar recruiter workflows.

Key integration patterns include:

- **Pre-screening filters** that remove unverified applications before human review begins
- **Inline verification badges** displayed within ATS candidate cards
- **Automated reference corroboration** that runs in parallel with application review
- **Bulk verification scoring** for large candidate pools during high-volume hiring campaigns

The result is that recruiters do not need to change their tools or their workflows significantly. AI resume verification becomes an invisible layer of trust embedded in the systems they already use.

## The Road Ahead

AI CV verification is not approaching maturity — it is accelerating. The next wave of developments includes:

- **Biometric credential anchoring** — linking verified profiles to confirmed identities through facial recognition and document authentication
- **Cross-border credential equivalency** — AI systems that can translate and verify international qualifications against local standards in real time
- **Predictive performance modeling** — using verified credential data combined with psychometric inputs to model candidate success probabilities before interview

The employers and candidates who build their professional infrastructure around verified, AI-authenticated credentials today will have a compounding advantage as these capabilities mature.

Also see: [Employers Are Rejecting AI Resumes](/resources/blog/employers-reject-ai-resumes) for the counterpart perspective on how unverified AI-generated content is received.

Start building your verified professional profile today at [YourCVPassport](https://yourcvpassport.com) — the platform that puts your authentic credentials front and center.$$,
$$https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80&auto=format&fit=crop$$,
$$Technology$$,
false,
'2026-03-15',
$$How AI Is Revolutionizing Professional Profile Verification$$,
$$AI resume verification is reshaping hiring. Learn how AI CV verification detects fraud, speeds up screening, and gives verified candidates a decisive edge in 2026.$$,
'en'
);

-- Article #8: Qué es un CV verificado y por qué lo necesitas en 2026 (ES)
-- FIXES: meta_description expanded to 150 chars (was 142); summary trimmed to 160 chars (was 165);
--        internal link path corrected from /resources/blog/ to /recursos/blog/


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Qué es un CV verificado y por qué lo necesitas en 2026$$,
$$que-es-cv-verificado$$,
$$Un CV verificado es el nuevo estándar en selección de personal. Descubre qué significa, por qué importa en 2026 y cómo puede transformar tu búsqueda de empleo.$$,
$$El mercado laboral está cambiando más rápido de lo que muchos candidatos se han dado cuenta. Las empresas reciben cientos de solicitudes por cada vacante, los reclutadores dedican más tiempo a verificar información que a evaluar el talento real, y la confianza en el currículum tradicional está en su punto más bajo en décadas.

En este contexto, el **CV verificado** — también conocido como **currículum verificado** — está emergiendo como el estándar que separa a los candidatos que consiguen entrevistas de aquellos que quedan enterrados en la bandeja de entrada.

## ¿Qué es exactamente un CV verificado?

Un **CV verificado** es un perfil profesional en el que los datos clave — experiencia laboral, titulaciones académicas, certificaciones y habilidades — han sido confirmados de forma independiente y autenticados digitalmente. A diferencia del currículum tradicional, que es un documento de autoría propia sin capa de validación, el **currículum verificado** lleva una señal de confianza que los empleadores pueden comprobar en segundos.

La verificación puede producirse a través de distintos mecanismos:

- Confirmación directa de empleadores anteriores
- Autenticación institucional de titulaciones académicas
- Validación de certificaciones por los organismos emisores
- Evaluaciones de competencias vinculadas al perfil
- Respaldos profesionales de colegas y mentores verificados

:::info Un CV verificado no es solo un documento más cuidado o más completo. Es un registro profesional auditable que elimina la incertidumbre del proceso de selección y coloca al candidato en una posición de ventaja desde el primer momento. :::

## Por qué los empleadores ya no confían en el currículum tradicional

Los datos son contundentes. Según el informe de tendencias de contratación de Willo para 2026, el **37% de los empleadores declara que los currículums ya no son indicadores fiables** de las capacidades reales de un candidato. Un 41% adicional afirma estar alejándose activamente de los procesos de selección basados en el CV tradicional.

La causa de esta desconfianza tiene varias raíces:

- El **57% de los reclutadores** ha notado un aumento significativo en currículums generados con inteligencia artificial (Resume Now, 2025)
- El **90% reporta un incremento en solicitudes de escaso esfuerzo** o directamente irrelevantes
- El **62% de los empleadores rechaza CVs genéricos** que carecen de detalles personalizados

El currículum tradicional es un documento sin capa de responsabilidad. Cualquiera puede afirmar un título que no posee, inflar un cargo o fabricar años de experiencia. Sin verificación, los reclutadores no tienen forma eficiente de distinguir entre candidatos genuinos y aquellos que han aprendido a manipular el sistema.

:::warning El fraude en el currículum tiene consecuencias reales para las empresas: coste de malas contrataciones, tiempo de incorporación desperdiciado y, en algunos casos, exposición legal. La verificación sistemática es la defensa más eficiente frente a este riesgo. :::

## Qué elementos se verifican en un currículum verificado moderno

No todas las afirmaciones tienen el mismo peso. Los elementos con mayor impacto en la decisión de contratación son también los que más se verifican:

- **Experiencia laboral** — Fechas, cargos y organizaciones confirmadas
- **Titulaciones académicas** — Grados y certificados autenticados frente a registros institucionales
- **Certificaciones profesionales** — Credenciales vinculadas a los organismos emisores con seguimiento de caducidad
- **Evaluaciones de habilidades** — Puntuaciones de competencia de pruebas estandarizadas
- **Respaldos profesionales** — Endorsements de colegas y mentores verificados en la plataforma

:::tip Cuando construyas tu CV verificado, prioriza la verificación de los credenciales más relevantes para tu sector objetivo. Un profesional de tecnología debería centrarse en certificaciones y evaluaciones técnicas; un profesional financiero, en titulaciones y experiencia regulada. :::

## CV verificado vs. currículum tradicional: la diferencia que importa

La distancia entre ambos formatos no es cosmética — es estructural. El currículum tradicional traslada toda la responsabilidad de validación al empleador, que debe dedicar tiempo y recursos a comprobar lo que el candidato afirma. El **CV verificado** invierte esta dinámica: el candidato llega a la conversación con sus credenciales ya confirmadas.

Esto tiene efectos prácticos y medibles:

- Los candidatos con **currículum verificado** son preseleccionados con mayor frecuencia en búsquedas de reclutadores
- Los plazos de contratación se reducen porque no hay verificación post-oferta pendiente
- La posición negociadora en conversaciones salariales se fortalece con datos objetivos verificados
- La visibilidad en plataformas de búsqueda de talento aumenta cuando el perfil lleva señales de confianza

## Cómo la tecnología hace posible la verificación en tiempo real

La verificación de credenciales ha sido históricamente un proceso lento, manual y costoso. Las comprobaciones de referencias podían tardar días. Las verificaciones institucionales requerían solicitudes formales por escrito. Los sistemas de verificación de antecedentes cobraban por contratación.

La tecnología moderna — en particular la inteligencia artificial y los sistemas de credenciales digitales — ha comprimido este proceso de forma radical. Plataformas como YourCVPassport permiten que los candidatos construyan un **currículum verificado** dinámico que se actualiza en tiempo real a medida que acumulan nuevas credenciales, experiencias y respaldos.

Los reclutadores pueden acceder a esta información en segundos, sin llamadas de referencia, sin solicitudes escritas, sin esperas. "Los reclutadores esperan verificación a un clic de distancia", señala un análisis de 2026 de The Interview Guys — y la tecnología ya está ahí para cumplir esa expectativa.

Para profundizar en cómo la IA está transformando específicamente este espacio, consulta nuestro artículo: [Cómo la inteligencia artificial está revolucionando la búsqueda de empleo](/recursos/blog/ia-revoluciona-busqueda-empleo).

## El CV verificado como inversión en tu reputación profesional

Más allá de la búsqueda de empleo inmediata, un **CV verificado** es una inversión en tu reputación profesional a largo plazo. A diferencia de un documento estático que envías y olvidas, un perfil verificado dinámico:

- **Crece contigo** — cada nueva certificación, logro o respaldo se añade y verifica en tiempo real
- **Te protege** — las credenciales verificadas son más difíciles de replicar o de reclamar fraudulentamente
- **Te hace visible** — los algoritmos de búsqueda de muchas plataformas priorizan perfiles con señales de confianza verificadas
- **Establece tu autoridad** — en tu sector, ser conocido como un profesional con credenciales verificadas tiene valor más allá de cada proceso de selección individual

:::example Un director de operaciones con un currículum verificado que muestra experiencia confirmada en tres empresas reconocidas, evaluaciones de liderazgo y respaldos de colegas verificados superará sistemáticamente a un candidato igualmente cualificado con un PDF sin verificar — no por talento, sino por confianza. :::

## Cómo empezar a construir tu CV verificado

Construir un **currículum verificado** no tiene que ser un proceso largo ni complicado. El enfoque más efectivo es comenzar por los credenciales de mayor valor y ampliar desde ahí:

1. Reclama y verifica tu experiencia laboral más reciente y relevante
2. Sube y autentica tus titulaciones académicas
3. Completa evaluaciones de habilidades relevantes para tu sector
4. Solicita respaldos profesionales a compañeros y mentores
5. Mantén tu perfil dinámico — añade nuevas certificaciones a medida que las obtengas

Incluso un perfil parcialmente verificado tiene significativamente más peso que uno completamente sin verificar. Cada señal de confianza que añades mejora tu posición en los resultados de búsqueda de reclutadores y refuerza tu credibilidad en el proceso de selección.

## El futuro pertenece a los profesionales verificados

Para 2027, los analistas del sector esperan que los perfiles profesionales verificados sean la expectativa de referencia, no la excepción. Al igual que los certificados SSL se convirtieron en obligatorios para los sitios web, las capas de verificación se están convirtiendo en obligatorias para la credibilidad profesional.

Los candidatos que construyan su **CV verificado** ahora no solo se están preparando para el mercado laboral actual — se están posicionando como la elección preferente del futuro.

Crea hoy tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu autenticidad a los empleadores.$$,
$$https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80&auto=format&fit=crop$$,
$$Verificación$$,
false,
'2026-03-17',
$$Qué es un CV verificado y por qué lo necesitas en 2026$$,
$$Descubre qué es un CV verificado, cómo funciona el currículum verificado en 2026 y por qué es la ventaja decisiva en tu próxima búsqueda de empleo activa.$$,
'es'
);

-- Article #9: Cómo la inteligencia artificial está revolucionando la búsqueda de empleo (ES)
-- FIXES: meta_title trimmed to 58 chars (was 62); meta_description trimmed to 154 chars (was 157);
--        summary trimmed to 159 chars (was 162); internal link corrected to /recursos/blog/


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Cómo la inteligencia artificial está revolucionando la búsqueda de empleo$$,
$$ia-revoluciona-busqueda-empleo$$,
$$La IA búsqueda empleo lo está cambiando todo: desde cómo se redactan los CVs hasta cómo se verifican. Descubre cómo adaptarte y sacar ventaja en 2026.$$,
$$La inteligencia artificial ha entrado en el mercado laboral con una velocidad que pocos anticiparon. En cuestión de dos años, ha transformado tanto la forma en que los candidatos presentan sus perfiles como la forma en que los empleadores los evalúan. Y el resultado es un mercado más competitivo, más opaco y más dependiente de la confianza que nunca.

Comprender cómo la **IA en la búsqueda de empleo** está cambiando las reglas — y cómo posicionarse en el lado ganador de esa transformación — es ahora una habilidad profesional fundamental.

## El doble papel de la IA: generación y verificación

Existe una paradoja fascinante en el corazón de la revolución de la **inteligencia artificial en el empleo**. La misma tecnología que ha hecho trivialmente fácil generar currículums pulidos, cartas de presentación optimizadas y perfiles de LinkedIn reformulados, ahora se está desplegando para verificar si esos documentos son auténticos.

Los datos ilustran la tensión. Según un estudio de Resume Now de 2025, el **57% de los reclutadores nota más CVs generados con IA** que hace dos años. El **90% reporta un aumento en solicitudes de bajo esfuerzo**. Y sin embargo, el **78% de los responsables de contratación sigue buscando detalles personalizados** que demuestren un compromiso genuino con el puesto.

La IA ha creado un problema de señal a ruido sin precedentes en la selección de personal — y ahora está siendo utilizada para resolverlo.

:::warning El 62% de los empleadores rechaza activamente los CVs genéricos generados con IA que carecen de toque personal (Resume Now, 2025). Usar IA para escribir tu candidatura sin personalizarla ni verificarla no es una ventaja — es una desventaja. :::

## Cómo la IA está cambiando el proceso de selección para los empleadores

Para los empleadores, la **IA en la búsqueda de empleo** ha transformado el proceso de selección en varios frentes simultáneos:

**Filtrado automatizado a escala.** Los sistemas de seguimiento de candidatos (ATS) impulsados por IA pueden procesar miles de solicitudes en minutos, clasificando candidatos según la relevancia de sus credenciales, la coherencia de su experiencia y la correspondencia con los requisitos del puesto.

**Verificación de credenciales en tiempo real.** Modelos de aprendizaje automático cruzan las afirmaciones de los candidatos con bases de datos de instituciones educativas, organismos certificadores y registros empresariales. Las inconsistencias — títulos que no corresponden a fechas de graduación, certificaciones de organismos que no las emiten — se detectan automáticamente.

**Detección de contenido generado por IA.** Los modelos de procesamiento de lenguaje natural pueden identificar la firma probabilística del texto generado por IA en descripciones de experiencia y resúmenes profesionales. Puntuaciones altas de generación automática activan revisiones humanas adicionales.

**Análisis de coherencia temporal.** Los sistemas de IA detectan solapamientos imposibles en el historial laboral, brechas no explicadas y progresiones de carrera estadísticamente atípicas.

:::info La IA no reemplaza el juicio humano en la selección de personal — lo dirige. Al gestionar el trabajo sistemático de verificación de credenciales, libera a los reclutadores para centrarse en lo que realmente importa: evaluar el encaje, la motivación y el potencial. :::

## Cómo la IA afecta a los candidatos: riesgos y oportunidades

Para los candidatos, la revolución de la **inteligencia artificial en el empleo** crea tanto riesgos como oportunidades — dependiendo de cómo se navegue.

**Los riesgos para quienes dependen únicamente de la IA:**

- Los CVs enteramente generados por IA son detectados con creciente eficacia por los sistemas de cribado
- Las solicitudes genéricas son filtradas antes de llegar a ojos humanos
- La falta de credenciales verificables reduce la probabilidad de superar los filtros automáticos
- La ausencia de señales de confianza — verificaciones, respaldos, evaluaciones — hace invisibles a los candidatos en búsquedas algorítmicas

**Las oportunidades para quienes entienden la nueva dinámica:**

- Usar la IA para prepararse mejor — investigar empresas, anticipar preguntas, identificar brechas de habilidades — en lugar de solo para escribir documentos
- Construir perfiles profesionales verificados que resistan el escrutinio algorítmico
- Diferenciarse con credenciales auténticas y respaldos verificados en un mercado inundado de candidaturas genéricas
- Aprovechar la **IA en la búsqueda de empleo** para identificar oportunidades alineadas con el perfil real, no solo con palabras clave

:::tip La IA es una herramienta de preparación poderosa: úsala para investigar empresas, practicar entrevistas y analizar descripciones de puestos. Pero que el contenido de tu perfil — tu experiencia, tus habilidades, tus logros — sea auténtico y verificable. :::

## La verificación como respuesta a la IA

La respuesta más efectiva al desafío que la **inteligencia artificial en el empleo** representa para los candidatos honestos es la verificación. Cuando tus credenciales están autenticadas de forma independiente, los sistemas de IA que filtran solicitudes te reconocen como un candidato de alta confianza — y te posicionan en consecuencia.

Según el informe de tendencias de contratación de Willo para 2026, el **41% de los empleadores se está alejando de los procesos basados en el CV tradicional** precisamente porque los documentos sin verificar ya no ofrecen las garantías que necesitan. Y el **10% de las empresas ya ha reemplazado completamente el CV por evaluaciones basadas en competencias**.

Esta tendencia tiene una consecuencia directa para los candidatos: los perfiles con credenciales verificadas — experiencia confirmada, titulaciones autenticadas, evaluaciones de habilidades adjuntas — son los que mejor sobreviven al filtrado algorítmico y los que consiguen llegar a la revisión humana.

Para entender en profundidad qué significa tener un currículum verificado y cómo construirlo, consulta: [Qué es un CV verificado y por qué lo necesitas en 2026](/recursos/blog/que-es-cv-verificado).

## El impacto en la experiencia del candidato

Más allá de las métricas y los procesos empresariales, la revolución de la **IA búsqueda empleo** tiene un impacto profundo en la experiencia emocional de los candidatos.

La sensación de enviar solicitudes a un vacío — sin respuesta, sin retroalimentación, sin certeza de que alguien ha leído siquiera tu perfil — se ha intensificado con la automatización masiva del cribado. Los candidatos que no entienden cómo funcionan los sistemas de filtrado algorítmico pueden interpretar el silencio como un juicio sobre su valía, cuando en realidad es un artefacto del sistema.

Comprender que:

- Los ATS filtran por palabras clave específicas antes de cualquier revisión humana
- Los perfiles sin señales de verificación son desclasificados en búsquedas de reclutadores
- La personalización genuina de cada solicitud supera sistemáticamente a las candidaturas genéricas
- Las credenciales verificables mejoran la posición en rankings algorítmicos

...es el primer paso para recuperar la agencia en un proceso que puede sentirse opaco e injusto.

:::example Una candidata de marketing con un perfil verificado que incluye experiencia confirmada, evaluaciones de competencias digitales y respaldos de colegas verificados tiene una probabilidad significativamente mayor de superar el cribado automático — y de llegar a una entrevista — que una candidata igual de cualificada con un PDF sin verificar, independientemente de cuántas solicitudes envíe. :::

## Estrategias prácticas para navegar la IA en tu búsqueda de empleo

Entender la transformación es el primer paso. Actuar sobre ella es el segundo. Estas son las estrategias más efectivas para candidatos en 2026:

1. **Construye un perfil verificado** — prioriza plataformas que permitan autenticar tus credenciales directamente
2. **Personaliza cada solicitud** — los sistemas de IA detectan la falta de personalización; los reclutadores humanos también
3. **Usa la IA para prepararte, no solo para escribir** — simuladores de entrevistas, análisis de descripciones de puestos, investigación de empresa
4. **Obtén evaluaciones de competencias** — las habilidades demostradas objetivamente pesan más que las declaradas
5. **Solicita respaldos verificados** — los endorsements de colegas y mentores verificados añaden capas de confianza que los documentos solos no pueden ofrecer
6. **Mantén tu perfil actualizado** — los algoritmos priorizan perfiles con actividad reciente y credenciales actuales

## El futuro próximo: lo que viene en los próximos 12 meses

La **inteligencia artificial en el empleo** no ha terminado de transformarse — está acelerando. Las próximas innovaciones incluyen:

- Verificación biométrica de identidad vinculada a credenciales profesionales
- Equivalencia automatizada de credenciales internacionales en tiempo real
- Modelos predictivos de rendimiento basados en perfiles verificados y evaluaciones psicométricas
- Matching algorítmico candidato-empleador que va más allá de las palabras clave para analizar compatibilidad real

Los candidatos y empleadores que construyan su infraestructura profesional sobre credenciales verificadas y auténticas hoy tendrán una ventaja compuesta a medida que estas capacidades maduren.

Crea hoy tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu autenticidad a los empleadores.$$,
$$https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80&auto=format&fit=crop$$,
$$Tecnología$$,
false,
'2026-03-19',
$$IA en la búsqueda de empleo: guía completa 2026$$,
$$La IA en la búsqueda de empleo está cambiando todo. Descubre cómo la inteligencia artificial afecta a candidatos y empleadores, y cómo adaptarte en 2026.$$,
'es'
);

-- Article #10: Verified Professional Profiles: The New Standard for Job Applications
-- FIXES: meta_title trimmed to 56 chars (was 61); meta_description trimmed to 154 chars (was 161)


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Verified Professional Profiles: The New Standard for Job Applications$$,
$$verified-professional-profiles-standard$$,
$$Verified professional profiles are replacing traditional resumes as the hiring standard. Learn why and how to build one that gets you shortlisted in 2026.$$,
$$Something fundamental has shifted in how professional credibility is established, communicated, and evaluated. The static resume — that self-reported snapshot that has governed job applications for generations — is being replaced by something richer, more trustworthy, and more dynamic: the **verified professional profile**.

This is not an incremental improvement. It is a structural change in how the relationship between candidates and employers is mediated — and understanding it is now essential for anyone serious about their career in 2026.

## What Is a Verified Professional Profile?

A **verified professional profile** is a comprehensive, multi-dimensional professional record in which key claims have been independently authenticated. Unlike a resume or CV, which presents information the candidate controls entirely, a **verified professional profile** layers external validation on top of self-reported data.

That validation can come from multiple sources:

- Employer confirmation of job history and titles
- Institutional authentication of academic qualifications
- Certification body verification of professional credentials
- Platform-administered skills assessments with objective scores
- Colleague and mentor endorsements from verified users

The result is a profile that employers can trust from the moment they encounter it — without needing to initiate their own verification process, wait for reference responses, or conduct background checks before scheduling an interview.

:::info A verified professional profile is not just a better resume. It is a fundamentally different kind of document — one that carries the weight of external validation and functions as a living, continuously updated record of professional credibility. :::

## Why the Traditional Resume Has Reached Its Limits

The traditional resume served its purpose in a world where applications were submitted in manageable volumes, verification was difficult for everyone equally, and the honesty premium for candidates was relatively high. That world no longer exists.

Today, application volumes are inflated by AI-assisted mass-applying tools. Verification has become asymmetrically difficult — easy for platforms with data access, impossible for individual employers doing manual checks. And the honesty premium has collapsed as employers have no efficient way to distinguish truthful from embellished self-reporting.

The data reflects this collapse in trust. According to Willo's 2026 research, **41% of employers are moving away from CV-first hiring**, and **37% say credentials and CVs are no longer reliable indicators** of candidate ability. This is not a marginal shift — it is a near-majority of the hiring ecosystem expressing fundamental doubts about its core document.

Meanwhile, **57% of recruiters report encountering more AI-generated CVs** (Resume Now, 2025), and **90% have seen increases in low-effort or spam applications**. The signal-to-noise ratio in traditional recruiting has deteriorated dramatically — and verified professional profiles are the correction.

:::warning If you are still presenting a traditional unverified resume as your primary professional document in 2026, you are operating in a credibility deficit relative to candidates who have taken the time to build verified professional profiles. The gap between the two is visible to every recruiter who has learned to look for it. :::

## The Competitive Advantage of Verification

The strategic value of a **verified professional profile** operates on several levels simultaneously.

**Algorithmic visibility.** Recruiting platforms and ATS systems increasingly weight verified credentials in their ranking and surfacing algorithms. A verified professional profile will appear more frequently in recruiter searches and higher in candidate rankings than an equivalent unverified profile.

**Shortlisting efficiency.** Employers who filter first for verified credentials before allocating human review time will consistently prioritize verified candidates — regardless of how strong the competing unverified applications look on their face.

**Speed to offer.** When an employer can see at a glance that your credentials are confirmed, the verification that typically happens post-offer — and often introduces delays of days or weeks — becomes unnecessary. Offers move faster, giving verified candidates access to opportunities before competitors.

**Negotiating strength.** Verified competencies provide objective data that supports salary and role-level discussions. A candidate who can point to platform-verified skills assessments and confirmed experience is negotiating from a position of demonstrated, not just claimed, value.

:::tip Think of your verified professional profile as a compounding asset. Each credential you verify, each endorsement you receive, each skills assessment you complete adds to a body of authenticated evidence that works for you continuously — in every recruiter search, every shortlisting decision, every interview conversation. :::

## What Goes Into a Strong Verified Professional Profile

Not all profile components carry equal verification weight. The most impactful elements to prioritize are those most directly relevant to the roles you are targeting:

**Work experience verification** is typically the highest-priority element. Confirmed employment dates, job titles, and organizational affiliations remove the most significant area of candidate uncertainty for employers.

**Educational qualification authentication** matters most in roles where formal credentials are requirements rather than preferences — regulated professions, specialist roles, and senior positions where academic background is material.

**Professional certification verification** is essential in rapidly evolving fields — technology, finance, healthcare — where current, valid certifications signal that skills are up to date rather than historical.

**Skills assessment scores** provide objective, standardized evidence of competencies that experience descriptions alone cannot convey. Platform-administered tests with published methodologies carry particular credibility.

**Professional endorsements** from verified colleagues and mentors add a human corroboration layer that algorithmic verification alone cannot replicate — attesting not just to what credentials exist but to how they were applied in practice.

## How Verified Professional Profiles Are Changing Recruiter Behavior

The shift toward **verified professional profiles** is not only changing what candidates present — it is changing how recruiters search, filter, and evaluate. Evidence from 2025 and 2026 points to several emerging patterns:

**Search-first recruiting.** Rather than reading incoming applications, recruiters increasingly initiate the process by searching for verified candidates who match their criteria. This model rewards candidates with complete, verified profiles — and bypasses those without them entirely.

**Verification as a shortlisting criterion.** Many hiring teams now use the presence or absence of verification as an explicit filter before any human review. An unverified candidate, regardless of how strong their experience looks, does not reach the review stage.

**Reference check obsolescence.** Traditional reference calls — slow, inconsistent, and easy to game — are being replaced by platform-verified endorsements and employer confirmations embedded directly in the candidate profile. "Recruiters expect verification at one click away," according to The Interview Guys' 2026 analysis.

**Bias reduction.** Counterintuitively, verification also supports more equitable hiring. When assessment of candidates is grounded in verified, objective evidence rather than interpretive judgment of self-reported claims, irrelevant factors have less opportunity to influence outcomes.

## Building Your Verified Professional Profile: A Practical Path

The process of building a **verified professional profile** is more accessible than many candidates assume. The key is to approach it systematically rather than attempting to verify everything at once.

**Start with your anchor credential.** Your most recent role or your highest-stakes qualification — whichever carries the most weight for your target employers — should be the first thing you verify. This creates immediate credibility that extends benefit-of-the-doubt to the rest of your profile while you complete it.

**Layer outward from the core.** Once your primary credential is verified, add supporting verifications: earlier roles, academic qualifications, certifications. Each addition strengthens the overall trust architecture of your profile.

**Add assessed competencies.** Skills assessments provide an objective layer that distinguishes your profile from those relying entirely on self-reported experience. Even one or two well-chosen assessments relevant to your field significantly elevate profile credibility.

**Collect endorsements strategically.** Reach out to colleagues, managers, and mentors whose verification status on the platform lends weight to their endorsements. An endorsement from a verified professional carries more algorithmic value than one from an unverified connection.

**Keep it current.** A **verified professional profile** is not a one-time project — it is a living professional record. Update it when you change roles, complete new certifications, or develop new skills. Platforms that detect profile activity reward recency in their ranking algorithms.

## The Long View: Profiles Over Documents

The trajectory is clear. Just as professional email replaced handwritten letters without announcement or fanfare, **verified professional profiles** are replacing traditional resumes as the operating standard of professional credibility — not through a single decisive moment, but through the accumulation of employer preference and platform infrastructure.

The candidates who recognize this shift earliest and invest in building strong verified professional profiles will have a sustained structural advantage over those who continue relying on documents that the hiring ecosystem is progressively learning to trust less.

For a deeper understanding of the foundational concepts behind verification, read: [What Is a Verified CV? The Future of Trusted Hiring in 2026](/resources/blog/what-is-verified-cv).

And for insight into how AI is accelerating the verification infrastructure that makes this shift possible, see: [How AI Is Revolutionizing Professional Profile Verification](/resources/blog/ai-revolutionizing-profile-verification).

Start building your verified professional profile today at [YourCVPassport](https://yourcvpassport.com) — the platform that puts your authentic credentials front and center.$$,
$$https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80&auto=format&fit=crop$$,
$$Verification$$,
false,
'2026-03-22',
$$Verified Professional Profiles: The New Standard 2026$$,
$$Verified professional profiles are replacing resumes as the hiring standard. Learn what they include, why employers prefer them, and how to build yours.$$,
'en'
);



-- ------------------------------------------------------------
-- BLOQUE C: Hiring EN (Articles #11-15)
-- ------------------------------------------------------------


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$How Verified Profiles Reduce Hiring Fraud and Bad Hires$$,
$$verified-profiles-reduce-hiring-fraud$$,
$$Hiring fraud and fake resumes cost companies millions each year. Discover how verified professional profiles stop resume fraud before it reaches your desk.$$,
$$Resume fraud is not a fringe problem. Studies consistently show that a significant portion of candidates misrepresent their qualifications, employment history, or credentials — and most companies only discover the deception after making a costly hire. In 2026, the tools to fight back have finally caught up with the scale of the problem. Verified professional profiles are changing how employers screen talent, cutting through the noise of fake resumes and inflated credentials before the first interview ever takes place.

## The True Cost of Hiring Fraud

Hiring fraud goes far beyond a bad CV. When an unqualified or dishonest candidate slips through the screening process, the consequences compound quickly. There is the direct cost of onboarding, training, and salary paid to someone who cannot perform the role. Then comes the hidden cost: team disruption, client damage, and the time spent restarting the entire hiring process.

According to background screening research, a single bad hire can cost an organization anywhere from 30% to 200% of that employee's annual salary. For senior roles, that figure climbs even higher. Resume fraud — including fabricated degrees, inflated job titles, and invented employers — is a primary driver of these costly mistakes.

:::warning Resume fraud affects every industry. In finance, healthcare, education, and engineering, hiring an unqualified professional due to fake resume detection failures is not just expensive — it can be legally dangerous. Verified credentials are no longer optional in these sectors. :::

## How Fake Resume Detection Fails in Traditional Hiring

Traditional hiring relies heavily on trust. A candidate submits a CV, HR reviews it, and the document's claims are rarely verified in depth until a conditional offer has already been made. By that point, the investment of time and resources is significant — creating a bias toward rationalizing any small discrepancies rather than restarting the process.

Standard reference checks help, but they are easy to game. A candidate with a personal email address posing as a former manager is a well-documented fraud tactic. Employment verification through third-party agencies adds cost and delay. And in a fast-moving hiring market, many companies simply skip these steps in the race to fill roles.

This is precisely where fake resume detection systems embedded into verified profile platforms change the equation. By verifying credentials at the source — before a candidate ever applies — the burden of proof is shifted away from the recruiter entirely.

## What Verified Profiles Actually Check

A [verified CV profile](/resources/blog/what-is-verified-cv) is more than a digital resume. It is a credentialed record where key claims have been independently confirmed. Depending on the platform and the level of verification, this can include:

- **Educational qualifications** — confirmed against institution records or official transcripts
- **Professional certifications** — verified with issuing bodies in real time
- **Employment history** — cross-referenced with professional references or HR systems
- **Identity** — confirmed through document checks and liveness detection
- **Skills assessments** — validated through standardized tests rather than self-reported ratings

:::tip When a candidate's profile carries verified badges, recruiters can move directly to assessing fit and culture — skipping the guesswork that leads to hiring fraud in the first place. :::

## The Recruiter's New Screening Workflow

Companies that have adopted verified profile platforms report a measurable reduction in time-to-hire and screening costs. The shift in workflow is significant:

- **Before:** Screen hundreds of CVs, manually check claims, conduct lengthy reference processes, sometimes discover fraud post-hire
- **After:** Filter by verified credentials upfront, interview only pre-screened candidates, rely on platform verification rather than manual checks

This is not about replacing human judgment in hiring. It is about giving recruiters accurate data so that their judgment is applied to the right decisions — assessing personality, motivation, and cultural fit — rather than fact-checking basic claims that should never have been unverified in the first place.

:::info Platforms like YourCVPassport attach verification stamps directly to a candidate's public profile. Each stamp indicates what has been verified and by whom, giving recruiters instant, auditable confidence in the candidate's background. :::

## Why Hiring Fraud Will Keep Rising Without Verification

The conditions that enable resume fraud are getting worse, not better. Generative AI tools can now produce a convincing, fully fabricated professional history in minutes. LinkedIn profiles can be cloned and slightly modified. University websites are scraped to create realistic-looking degree certificates.

In this environment, relying on a candidate-submitted document as the primary source of truth is increasingly untenable. Fake resume detection cannot be a manual afterthought — it must be built into the hiring pipeline from the first touchpoint.

The organizations that will avoid bad hires in 2026 are those that require candidates to present verified credentials rather than self-reported ones. The shift to verified profiles does not slow down hiring. It makes every hire more defensible, more accurate, and less expensive in the long run.

## Practical Steps to Reduce Hiring Fraud Today

If your organization is not yet using verified profile platforms, here are immediate steps to tighten your hiring fraud defenses:

- **Require verified profile links** in job applications rather than (or in addition to) traditional CV attachments
- **Use structured reference verification** with direct contact to company HR departments, not personal email references
- **Cross-check LinkedIn profiles** against submitted CVs for inconsistencies in dates, titles, and employer names
- **Implement skills assessments** early in the process to validate claimed competencies before advancing candidates
- **Partner with credential verification services** for roles in regulated industries where qualifications are non-negotiable

The hiring landscape has changed. Candidates know how to present themselves. The employers who thrive are those who verify, not just review.

Take your job search to the next level with a verified professional profile on [YourCVPassport](https://yourcvpassport.com) — where your credentials speak louder than any AI-generated CV.$$,
$$https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=1200&q=80&auto=format&fit=crop$$,
$$Recruitment$$,
false,
'2026-04-01',
$$How Verified Profiles Reduce Hiring Fraud in 2026$$,
$$Hiring fraud and fake resumes cost companies millions. Learn how verified professional profiles eliminate resume fraud before it reaches your hiring team.$$,
'en'
);

-- Article 12


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Skills-First Hiring: Why Your Skills Matter More Than Your Job Title in 2026$$,
$$skills-first-hiring-2026$$,
$$Skills-first hiring is the dominant model in 2026. Learn why a skills-based resume outperforms a traditional CV and how to position your expertise to get hired faster.$$,
$$Your job title from three years ago does not define what you can do today. Yet traditional hiring has long treated job titles as proxies for capability — screening candidates in or out based on whether their past roles match a template, rather than whether their actual skills match the work. In 2026, that model is breaking down fast. Skills-first hiring has moved from a trend to the dominant format, and candidates who understand this shift are gaining a decisive advantage.

## What Skills-First Hiring Actually Means

Skills-first hiring is an approach to recruitment where employers evaluate what a candidate can demonstrably do, rather than where they have previously worked or what their job title was. Instead of filtering for "5 years as a Senior Product Manager at a recognized company," a skills-first hiring process asks: can this person define a product vision, run discovery sessions, prioritize a backlog, and communicate trade-offs to stakeholders?

The answer to that question does not require a prestigious title. It requires evidence of capability — and that is exactly what a skills-based resume is designed to provide.

:::info According to research from Willo (2026), 41% of employers are actively moving away from CV-first hiring. 10% of companies have already replaced CVs entirely with skills-based assessments. The shift is structural, not seasonal. :::

## Why Job Titles Are Losing Their Power

Job titles have always been imprecise signals. A "Marketing Manager" at a 10-person startup and a "Marketing Manager" at a 10,000-person corporation are doing fundamentally different work. The title obscures more than it reveals.

Several forces are accelerating the decline of title-based filtering:

- **Career pivots are more common.** A software engineer who moves into product management brings technical depth that cannot be captured by their new title alone.
- **Non-traditional backgrounds produce strong performers.** Research consistently shows that candidates from non-linear career paths often outperform those with conventional credentials once skills are measured directly.
- **AI tools have democratized access to information.** The ability to learn new skills rapidly has compressed the advantage that experience-by-tenure used to confer.
- **Remote and global hiring has expanded talent pools.** Employers are now comparing candidates across different markets where the same title means very different things.

:::warning If your resume still leads with a list of past job titles and companies, you are presenting yourself in a format that an increasing number of hiring managers are actively looking past. A skills-based resume puts your capabilities front and center, where they belong. :::

## What a Skills-Based Resume Looks Like in Practice

A skills-based resume does not eliminate your employment history. It restructures what the reader sees first. The format typically includes:

- **A skills summary at the top** — a concise statement of your three to five core competencies, framed in terms of what you can deliver
- **Proof points beneath each skill** — specific results, projects, or achievements that validate each claimed competency
- **Employment history as context** — listed chronologically, but not treated as the primary evidence of your value
- **Verified credentials** — certifications, assessments, and endorsements that provide third-party confirmation of your skills

This structure answers the recruiter's real question — "can this person do the work?" — in the first ten seconds of reviewing your profile.

:::tip Pair your skills-based resume with an [ATS-friendly resume](/resources/blog/ats-friendly-resume-guide-2026) format to ensure your profile is both human-readable and machine-parseable. Skills-first hiring and ATS optimization work together, not against each other. :::

## The Skills That Matter Most in 2026

The skills-first hiring movement is also reshaping which skills employers prioritize. Across industries, the most in-demand competencies in 2026 cluster around three areas:

**Technical fluency:**
- AI tool literacy — prompt engineering, workflow automation, data interpretation
- Data analysis — the ability to draw actionable conclusions from complex datasets
- Digital project management — remote-first coordination and async collaboration tools

**Communication and influence:**
- Written communication — clear, concise, and persuasive across formats
- Stakeholder management — navigating competing priorities and communicating trade-offs
- Cross-functional collaboration — working effectively across disciplines without formal authority

**Adaptive problem-solving:**
- Systems thinking — understanding how parts of an organization or process interact
- Learning agility — demonstrating a track record of acquiring new skills quickly
- Resilience under ambiguity — performing well when requirements are unclear or changing

:::example A candidate applying for a content strategy role who leads their profile with: "I build content systems that grow organic traffic — 240% YoY increase through SEO-led content strategy and a 12-person distributed writer network" immediately signals skills-first value, regardless of their previous job title. :::

## How to Transition Your CV to a Skills-First Format

Shifting to a skills-based resume does not require starting from scratch. Here is a practical process:

1. **List your five strongest competencies** — the things you do better than most people at your level
2. **Find three to five evidence points for each** — specific, measurable outcomes you have achieved using each skill
3. **Rewrite your professional summary** around what you can deliver, not where you have been
4. **Move skills above your work history** in the document structure
5. **Add verified skill credentials** — platform-based assessments, certifications, or endorsements that give recruiters a reason to trust your claims

The goal is not to hide your history. It is to ensure that your skills — not your titles — do the first wave of communication on your behalf.

## Skills-First Hiring and Verification

The rise of skills-first hiring creates both an opportunity and a risk. When employers focus on skills rather than credentials, candidates face a strong temptation to overstate their competencies. Self-reported skills on a traditional CV carry no verification burden. But in a skills-first hiring environment, the ability to verify claimed skills becomes critical.

Verified professional profiles address this directly. When a skills-based resume is backed by platform-verified assessments and credential stamps, the candidate's claims are no longer a matter of trust — they are a matter of record. This combination of skills-first presentation and verification is the most powerful way to stand out in 2026's hiring market.

Take your job search to the next level with a verified professional profile on [YourCVPassport](https://yourcvpassport.com) — where your credentials speak louder than any AI-generated CV.$$,
$$https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80&auto=format&fit=crop$$,
$$Recruitment$$,
false,
'2026-04-03',
$$Skills-First Hiring: Why Skills Beat Job Titles in 2026$$,
$$Skills-first hiring is the dominant model in 2026. Learn how a skills-based resume outperforms traditional CVs and positions you for the roles you actually want.$$,
'en'
);

-- Article 13


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Why 62% of Employers Reject Generic AI-Generated Resumes (And How to Stand Out)$$,
$$employers-reject-ai-resumes$$,
$$62% of employers reject AI-generated resumes lacking a personal touch. Learn why generic AI resumes hurt candidates and how to make your application genuinely stand out.$$,
$$The promise was appealing: feed a job description into an AI tool, receive a polished resume in thirty seconds, apply to fifty jobs before lunch. And for a brief window, it worked. But the 2025 hiring market delivered a sharp correction. According to Resume Now's 2025 research, 62% of employers now reject AI-generated resumes that feel generic or impersonal — and 57% of recruiters report they are actively noticing the telltale signs of AI-written applications at a rate they have never seen before. The arms race between AI application tools and AI detection is well underway, and right now, candidates using generic AI tools are losing.

## Why Employers Reject AI-Generated Resumes

The reason employers reject AI resumes is not that they dislike technology. It is that generic AI-generated resumes fail to communicate the one thing every employer actually needs: evidence that this specific person can do this specific job.

AI writing tools, particularly when given minimal context, produce prose that is technically competent but informationally empty. Phrases like "results-driven professional with a proven track record of delivering impactful outcomes" appear so frequently in AI-generated content that they have become a signal of low effort rather than high achievement. They say nothing about the candidate. They could describe anyone.

:::warning According to Resume Now (2025), 90% of hiring managers report an increase in spam and low-effort applications. The candidate volume has increased dramatically, but application quality has collapsed. Employers reject AI resumes precisely because they make the recruiter's job harder, not easier. :::

## The Specific Patterns Recruiters Have Learned to Spot

Recruiters who review applications at scale have developed pattern recognition for AI-generated content. The most commonly flagged indicators include:

- **Overuse of corporate filler phrases** — "synergistic," "leveraged," "impactful," "results-oriented" used without any specific results
- **Uniform sentence length and rhythm** — AI tools tend to produce paragraphs with a consistent, predictable cadence that trained readers find unnatural
- **Absence of specific numbers** — generic AI-generated resumes describe responsibilities rather than outcomes, avoiding the kind of specific metrics a human would naturally include
- **Mismatched tone and detail** — cover letters that are more eloquent than the resume, or sections where the level of specificity varies dramatically
- **No evidence of company research** — AI tools write to a template; they rarely produce content that demonstrates genuine knowledge of the specific employer

:::info 78% of hiring managers surveyed by Resume Now (2025) say they look for personalized, specific details when evaluating applications. A resume that reads like a template — regardless of how it was produced — signals a candidate who did not care enough to invest real effort. :::

## The Difference Between Using AI and Abusing It

Here is the important nuance: using AI to help write your resume is not the problem. Letting AI write your resume for you — without providing real, specific, personal input — is the problem.

The candidates who are successfully using AI tools in 2026 are using them as editing and structuring assistants, not as replacement for their own voice and experience. The workflow looks like this:

1. **Write raw notes first** — what did you actually do at each job? What specific problems did you solve? What are the real numbers?
2. **Use AI to refine, not create** — feed your raw content to AI and ask it to improve clarity, grammar, and structure, not to invent content
3. **Rewrite in your own voice** — take the AI's output and make it sound like you again, removing generic phrases
4. **Add specifics that only you know** — the project name, the client industry, the percentage improvement, the team size

This approach produces applications that are both well-written and genuinely personal — the combination that gets interviews.

:::tip The [skills-first approach](/resources/blog/skills-first-hiring-2026) pairs naturally with personalized AI-assisted writing. Lead with your specific, verified skills, then use AI to help articulate them clearly — not to invent them. :::

## What Strong Applications Look Like in 2026

The candidates standing out amid the flood of AI-generated resumes share several characteristics:

**They quantify everything.** "Reduced customer churn by 18% over six months through a proactive outreach program I designed and managed" beats "improved customer retention" in every screening scenario.

**They write different applications for different roles.** A single AI-generated resume applied to fifty jobs is immediately obvious. Tailored applications — even when AI-assisted — demonstrate commitment.

**They have verified credentials.** Third-party verification of skills and experience gives recruiters a reason to trust claims without spending time fact-checking. In a market flooded with AI-generated resumes, a verified profile is an immediate differentiator.

**They show cultural awareness.** References to the specific company, its values, its recent projects, or its challenges cannot be easily generated by AI without specific prompting — and recruiters notice when they are present.

:::example Compare two summaries for the same candidate:
**AI-generated version:** "Experienced marketing professional with a proven track record of delivering impactful digital campaigns and driving measurable growth across multiple channels."
**Personalized version:** "I grew organic search traffic 240% in 18 months by rebuilding our content strategy around long-tail intent. Now looking to apply that same system-level thinking to a larger brand." The second version is specific, confident, and clearly written by a person who did the work. :::

## The Platform Advantage: Standing Out Without Playing the AI Game

The deeper problem with the current application landscape is not AI itself — it is the absence of verification. When every candidate can produce a polished-looking document in seconds, the document loses its signal value entirely. Employers reject AI resumes not just because they are generic, but because they cannot trust any of the claims within them.

The solution is not better AI writing. It is verified credentials. A professional profile where qualifications, skills, and experience have been independently confirmed immediately separates a candidate from the noise — not through better prose, but through evidence.

In a market where 57% of recruiters are actively looking for the signs of AI-generated content, the most effective differentiation strategy is the one that makes that search irrelevant: show verified proof, not just well-written claims.

Take your job search to the next level with a verified professional profile on [YourCVPassport](https://yourcvpassport.com) — where your credentials speak louder than any AI-generated CV.$$,
$$https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=1200&q=80&auto=format&fit=crop$$,
$$Technology$$,
false,
'2026-04-06',
$$Why 62% of Employers Reject AI-Generated Resumes$$,
$$62% of employers reject generic AI resumes. Learn why AI-generated resume problems cost candidates interviews and how to stand out with a genuinely personal application.$$,
'en'
);

-- Article 14


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$The Problem with AI-Written Cover Letters: How Recruiters Spot Them$$,
$$ai-written-cover-letters-problem$$,
$$AI written applications are flooding recruiting inboxes. Learn how recruiters detect AI cover letters and what to write instead to get your application noticed.$$,
$$There is a quiet epidemic in recruiting inboxes right now. Since the mainstream arrival of large language models in 2023, the volume of applications has exploded — but the quality has inverted. Recruiters who once spent time carefully reading cover letters now skim for three or four sentences before making a decision. The reason is not impatience. It is that the majority of what they are reading is AI-written cover letter content: grammatically perfect, structurally sound, and completely devoid of anything worth reading. The people who still write genuine cover letters are standing out simply by being real.

## Why AI-Written Applications Have Become a Problem

The scale of the issue is significant. According to Resume Now's 2025 research, 90% of hiring managers report a measurable increase in spam and low-effort applications. Much of this increase correlates directly with the widespread availability of AI writing tools that can generate a complete, professional-sounding cover letter in under ten seconds.

The problem is structural. AI cover letter detection has become a core part of many recruiter workflows — not because companies have deployed sophisticated tools, but because experienced recruiters have simply read enough AI output to recognize its patterns on sight. What was novel in 2023 is now routine. And routine AI content produces routine rejection.

:::warning AI written applications may get your materials through an initial keyword filter, but they consistently fail at the human review stage. 78% of hiring managers (Resume Now, 2025) say they look for personalized, specific details — exactly the kind of content that generic AI tools cannot produce without extensive human input. :::

## The Patterns That Give AI Cover Letters Away

AI cover letter detection among experienced recruiters does not require specialized software. The patterns are now familiar enough that they register immediately:

**The three-sentence structure trap.** Most AI-generated cover letters follow a near-identical structure: here is who I am, here is why I want this role, here is why I am a good fit. The parallelism is too clean. Real cover letters meander slightly — they have a perspective, an emphasis, a voice that reflects how that particular person thinks.

**The enthusiasm vocabulary problem.** Phrases like "I am thrilled to apply," "I am passionate about," and "I would be excited to contribute" have become so saturated in AI written applications that recruiters have started filtering for them as negative signals. These phrases do not communicate genuine enthusiasm — they communicate that the writer ran out of ideas.

**The flattery-to-specificity ratio.** AI tools write very specific compliments about companies that are actually quite generic: "Your commitment to innovation and your customer-centric approach deeply resonate with my professional values." This sounds company-specific but could apply to any organization. Recruiters know this. Real research produces specifics that cannot be fabricated: a recent product launch, a specific initiative, a named leader's public comment.

**Tone mismatch with the resume.** When a cover letter is significantly more fluent or stylistically different from the attached resume, recruiters notice the inconsistency. AI written applications often have this problem — the cover letter was generated, the resume was not, or vice versa.

:::info According to Resume Now (2025), 57% of recruiters report actively noticing more AI-generated applications than in previous years. For competitive roles at desirable companies, the proportion of AI-generated cover letters can be significantly higher — making genuine, personal writing an increasingly rare commodity. :::

## What AI Cover Letter Detection Actually Looks For

Beyond the stylistic patterns, recruiters doing AI cover letter detection are looking for the absence of three specific types of content:

1. **Personal stakes** — why does this particular person want this particular job at this particular time? AI cannot answer this without being told. Generic AI tools are never told.
2. **Specific company knowledge** — what does this candidate actually know about the company that is not on the first page of the website? Real candidates research. AI summarizes the homepage.
3. **A story that only this person could tell** — one specific moment, project, conversation, or realization that led to this application. Real life is specific. AI is general.

The good news is that producing content that avoids AI cover letter detection is not about writing better. It is about sharing more of yourself.

:::tip To escape the AI detection filter: write the first draft of your cover letter by hand — even just bullet points of what you actually want to say. Then use AI only to clean up grammar and improve phrasing. The structure and content should be entirely yours. :::

## How to Write a Cover Letter That Gets Read in 2026

The cover letters that work in 2026 share a common characteristic: they read like they were written by a person who actually cares. Here is what that looks like in practice:

**Open with something specific, not something generic.**
Instead of: "I am writing to express my interest in the Marketing Manager position at [Company]."
Try: "I have been following [Company]'s content strategy since the rebrand last year — the shift toward long-form, research-backed content is exactly the direction I would have taken, and it is part of why I am applying."

**Use one concrete story.**
Pick one moment from your professional life that directly relates to the role. Describe it briefly but specifically: the problem, what you did, what happened. This single paragraph will do more work than three AI-generated paragraphs of competency claims.

**Address a real challenge the company faces.**
Every company has public information about what they are trying to solve. Quarterly earnings calls, LinkedIn posts from the CEO, job descriptions themselves — these sources reveal priorities. Referencing one of them specifically signals genuine research.

**End with intention, not formula.**
Instead of: "I look forward to the opportunity to discuss my application." Try: "I would value the chance to discuss how my experience restructuring content operations could help you hit the Q3 growth targets you outlined in your last investor update."

:::example Side-by-side contrast:
**AI written application ending:** "Thank you for your time and consideration. I look forward to the opportunity to further discuss how my skills and experience align with your team's needs and contribute to your continued success."
**Human-written ending:** "I know you are moving fast on this hire. I am ready to start a conversation about what the first 90 days in this role should look like — because I have been thinking about it already." :::

## The Role of Verified Profiles in Replacing the Cover Letter

The structural problem with cover letters — that they require significant effort to write well and almost no effort to fake — is one reason why the medium is increasingly supplemented or replaced by verified professional profiles. When a candidate's credentials, skills, and experience are independently verified, the cover letter becomes less about proving you can do the job and more about communicating why you want it.

This shift is healthy. It concentrates the cover letter on genuine motivation and personality — content that AI genuinely cannot manufacture — while moving the burden of proof to a verified record that neither the candidate nor their AI assistant can manipulate.

Understanding [why employers reject AI resumes](/resources/blog/employers-reject-ai-resumes) is the first step. The second step is building a professional profile that stands on verified evidence — so that when you do write a cover letter, it is a conversation, not a credential pitch.

Take your job search to the next level with a verified professional profile on [YourCVPassport](https://yourcvpassport.com) — where your credentials speak louder than any AI-generated CV.$$,
$$https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=1200&q=80&auto=format&fit=crop$$,
$$Technology$$,
false,
'2026-04-08',
$$AI Cover Letters: How Recruiters Spot Them in 2026$$,
$$AI written cover letters are flooding recruiting inboxes. Learn exactly how recruiters detect them and what to write instead to get your application actually noticed.$$,
'en'
);

-- Article 15


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$ATS-Friendly Resume Guide 2026: How to Pass Applicant Tracking Systems$$,
$$ats-friendly-resume-guide-2026$$,
$$99% of Fortune 500 companies use ATS to filter CVs. This ATS-friendly resume guide for 2026 shows you how to pass ATS screening and reach real recruiters every time.$$,
$$Before a human recruiter ever sees your application, it has almost certainly been scanned, parsed, and ranked by software. According to Resume Professional Writers, 99% of Fortune 500 companies use ATS — applicant tracking systems — to filter incoming CVs. For most corporate roles, this means your resume must pass ATS screening before it ever reaches a human inbox. Yet most candidates still submit documents formatted for human eyes, not machine parsing. The result: strong candidates are rejected automatically, not by a person, but by an algorithm that could not read their PDF.

## What an ATS Actually Does

An ATS resume scanner is not evaluating you. It is extracting, categorizing, and scoring the text in your document based on rules configured by the hiring company. At a basic level, it looks for:

- **Keywords** that match the job description
- **Section headers** that align with expected patterns (Experience, Education, Skills)
- **Date formats** it can parse as employment periods
- **File compatibility** — some ATS systems cannot read complex PDF formatting, tables, or graphics

At a more sophisticated level, particularly in systems that have been upgraded with AI layers (such as those described in depth in the article on [ATS with API access](/resources/blog/ats-with-api-access)), the system may also rank candidates against a benchmark profile, check for skill adjacency, or flag unusual employment gaps.

:::info 99% of Fortune 500 companies use ATS with AI capabilities to filter incoming applications (Resume Professional Writers). If you are applying to a company with more than a few hundred employees, you should assume your resume will be read by a machine before it is read by a person. :::

## The Most Common ATS Formatting Failures

An ATS-friendly resume is not about using a specific template. It is about avoiding the formatting choices that cause parsing failures. The most common problems include:

**Tables and columns.** Two-column resume layouts are popular with designers and candidates who want a modern look. ATS systems frequently read across columns rather than down them, producing garbled output. Your name may appear in the middle of your job title. Your dates may be read as part of your responsibilities.

**Headers and footers.** Information placed in the header or footer of a Word document is often skipped entirely by ATS parsers. If your contact details are in the header — which is a common design choice — the ATS may process your resume without knowing how to contact you.

**Images and icons.** Icons used to represent skills, contact details, or section headers are invisible to ATS parsers. Any information represented by an image rather than text will simply not exist in the parsed output.

**Non-standard section headers.** An ATS-friendly CV uses section headers that machines recognize: Work Experience (not "My Journey"), Education (not "Where I Studied"), Skills (not "What I Bring"). Non-standard headers are frequently misclassified, causing your experience to be processed under the wrong category.

**Elaborate fonts and special characters.** Stylized fonts and decorative separators often convert poorly when parsed. Stick to standard fonts and simple formatting.

:::warning If you have applied to dozens of roles and received very few responses despite being qualified, ATS formatting failure may be the cause — not your experience. Test your resume through an ATS-friendly CV checker before applying to your next role. :::

## How to Build an ATS-Friendly Resume from Scratch

Building an ATS-friendly resume does not mean sacrificing all visual polish. It means making structured choices that serve both human and machine readers. Follow this framework:

**Choose the right file format.**
Submit your resume as a .docx file unless the application specifically requests PDF. Word documents parse more reliably across most ATS systems. If you must use PDF, ensure it is a text-based PDF, not a scanned image.

**Use a single-column layout.**
A simple, clean single-column layout eliminates the parsing confusion caused by multi-column designs. You can still make it look professional — use whitespace, clear hierarchy, and consistent formatting.

**Mirror the job description language.**
ATS keyword matching is literal. If the job description says "project management," use that exact phrase — not "project oversight" or "delivery management." Include the most important keywords from the posting in your experience descriptions and skills section.

**Use standard section headers.**
Stick to: Summary, Work Experience, Education, Skills, Certifications. Every major ATS system recognizes these headers reliably.

**Include a dedicated skills section.**
A clear, scannable list of skills gives the ATS an easy source for keyword extraction. Use the exact terminology that appears in job descriptions in your industry.

:::tip Paste the job description text into a free word cloud tool. The largest words are the ones that matter most to the ATS. Make sure those words appear in your resume — naturally, in context — at least once. :::

## ATS Keyword Strategy: Getting Found in the Right Searches

Beyond formatting, passing ATS means understanding how keyword matching works. Most systems use a combination of exact match and semantic proximity. Here is how to optimize:

**Primary keywords:** The core job title and essential skills listed in the "required" section of the job description. These must appear in your resume.

**Secondary keywords:** Skills, tools, or methodologies listed as "preferred" or appearing multiple times in the description. These improve your ranking even if they are not required.

**Context matters:** ATS systems that use AI scoring are not just counting keywords — they are checking whether they appear in relevant contexts. "Python" in a skills list is weaker than "Python" appearing in a specific work experience bullet describing what you built with it.

**Avoid keyword stuffing:** Placing a long list of keywords in white text (invisible to the human reader) to game the ATS is a well-known tactic that modern systems actively detect and penalize.

:::example For a Data Analyst role, a job description might require: SQL, Python, data visualization, stakeholder reporting, A/B testing.
Your ATS-friendly resume should include all five in context — not just in a skills list, but in the descriptions of past roles: "Developed automated SQL reporting pipelines that reduced stakeholder reporting time by 40%" covers three of those keywords in one sentence, with a metric that adds weight to the claim. :::

## How Verified Profiles Pass ATS Without Tricks

The fundamental problem with ATS optimization is that it incentivizes candidates to format their experience for machines rather than represent it authentically. An ATS-friendly CV is a necessary tool, but it should not require you to distort your actual experience.

Verified professional profiles solve a related problem from a different angle. When a candidate's profile includes independently verified skill credentials and employment history, the underlying data is structured, accurate, and machine-readable by design — not because the candidate formatted it correctly, but because the verification process produces structured outputs that integrate directly with modern recruitment platforms.

This is the direction hiring technology is moving. An ATS resume guide will always be relevant for applying through traditional portals. But as [ATS with API access](/resources/blog/ats-with-api-access) integrations become standard and platforms exchange verified profile data directly, the formatting game matters less and the quality of your verified credentials matters more.

## Your 2026 ATS Checklist

Before submitting your next application, verify that your ATS-friendly resume meets these requirements:

- Single-column layout with no tables or text boxes
- Contact information in the document body, not the header
- File format is .docx or text-based PDF
- Section headers match industry-standard names
- Primary keywords from the job description appear in context
- Skills section uses exact terminology from the posting
- All dates are in a consistent, parseable format (Month Year or MM/YYYY)
- No images, icons, or graphics that carry text information
- Font is standard (Calibri, Arial, Georgia, Times New Roman)

A resume that passes ATS is not a compromise — it is a foundation. Build it right, back it with verified credentials, and let your skills do the rest.

Take your job search to the next level with a verified professional profile on [YourCVPassport](https://yourcvpassport.com) — where your credentials speak louder than any AI-generated CV.$$,
$$https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop$$,
$$Career Tips$$,
false,
'2026-04-10',
$$ATS-Friendly Resume Guide 2026: Pass Applicant Tracking$$,
$$99% of Fortune 500 firms use ATS to screen CVs. This 2026 ATS-friendly resume guide shows you exactly how to pass ATS filtering and reach real recruiters.$$,
'en'
);



-- ------------------------------------------------------------
-- BLOQUE D: Digital Credentials (Articles #16-19)
-- ------------------------------------------------------------


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Digital Credentials vs Traditional CV: A 2026 Comparison$$,
$$digital-credentials-vs-traditional-cv$$,
$$How digital credentials and verified digital badges are reshaping hiring in 2026 — and why the traditional CV is losing ground to verifiable proof.$$,
$$The job market has always evolved, but 2026 marks a genuine inflection point. For decades, the CV was the single most important document in a professional's career toolkit. Today, that document is under serious pressure — from AI-powered screening tools, rampant credential fraud, and a new generation of digital credentials CV systems that promise something the paper CV never could: instant, trustworthy verification.

If you're a job seeker or HR professional trying to navigate this shift, this guide breaks down exactly what's changing and what it means for you.

## The Problem with the Traditional CV

The traditional CV is a self-reported document. You write it, you decide what goes in, and an employer has to take your word for most of it — at least initially. According to a 2026 study by Willo, **37% of employers say CVs are no longer a reliable indicator** of candidate quality or truthfulness.

That's not a fringe opinion. It reflects a wider anxiety across the hiring industry: too many people embellish dates, inflate titles, and list skills they barely possess. The CV, as a format, was never designed to be verifiable.

:::warning Fraud is more common than employers want to admit. Resume fraud ranges from minor embellishments to outright fabrication of degrees and job titles — and it costs companies enormously in bad hires and turnover. :::

Meanwhile, **99% of Fortune 500 companies** now use Applicant Tracking Systems (ATS) with AI layers to filter CVs before a human ever reads them (Resume Professional Writers, 2026). The result? Many qualified candidates are rejected automatically, while bad actors who know how to game the system slip through.

## What Are Digital Credentials?

Digital credentials — sometimes called digital badges or verified credentials — are structured, machine-readable certificates that prove a specific achievement, qualification, or skill. Unlike a line item on a CV, a digital credentials CV entry links directly to verifiable data: who issued it, when, under what criteria, and whether it's still valid.

Digital badges on a resume serve a similar purpose visually — they're portable icons that represent verified achievements — but the real power lies in the underlying data structure. When a credential is issued by a trusted source (a university, a certification body, a platform like YourCVPassport), it carries metadata that can be checked in seconds.

:::info The W3C Verifiable Credentials standard is gaining rapid adoption in HR-tech. It provides a universal, open framework so that credentials issued by different platforms can be read and trusted by any compliant employer system. :::

## Side-by-Side Comparison: Digital vs Traditional

**Traditional CV**
- Self-reported, no instant verification
- Static document that can become outdated
- Prone to embellishment and fraud
- Requires manual background checks (days or weeks)
- One-size-fits-all format
- No machine-readable trust signals

**Digital Credentials CV**
- Issued by verified third parties
- Dynamically linked — always current
- Tamper-evident and fraud-resistant
- Verification at one click away (The Interview Guys, 2026)
- Modular — share only what's relevant
- Natively readable by ATS and AI hiring tools

The difference is not cosmetic. It's structural. A digital credentials CV doesn't just tell an employer what you've done — it proves it.

## The Employer Perspective

Employers are not passive in this shift. **41% of employers are actively moving away from CV-first hiring** (Willo, 2026), replacing or supplementing CV screening with skills assessments, portfolio reviews, and — increasingly — verified credential checks.

This is partly driven by efficiency (verified data speeds up the hiring funnel) and partly by legal and compliance pressures (especially in regulated industries where hiring an unqualified candidate carries liability).

For recruiters, the promise of digital badges on a resume is straightforward: instead of scheduling a background check that takes two weeks, they click a link and get an answer in two seconds.

:::tip If you're applying for roles in finance, healthcare, education, or tech, having verified credentials attached to your profile can move you from the "maybe" pile to the "interview" pile faster than any CV redesign. :::

## What This Means for Job Seekers in 2026

The practical implication is clear: candidates who rely solely on a well-formatted Word document are competing at a disadvantage against candidates whose qualifications are independently verified.

Here's what forward-thinking job seekers are doing:

- **Claiming verified credentials** from every institution, employer, and course that offers them
- **Building a digital profile** that links credentials to a persistent, shareable URL
- **Using platforms** that issue and display digital credentials CV data in formats ATS systems can process
- **Replacing the static attachment** with a live, verified profile link in their email signature and LinkedIn

The shift is not about abandoning the CV entirely — it's about augmenting it with trust signals that hiring managers and automated systems can act on instantly.

## Looking Ahead

The trajectory is unambiguous. As [verifiable credentials](/resources/blog/what-are-verifiable-credentials) standards mature and more institutions adopt them, the traditional CV will increasingly function as a narrative summary while digital credentials do the heavy lifting of verification.

Platforms that bridge both worlds — giving professionals a compelling profile *and* verified, machine-readable credentials — are positioned to become the default way professionals represent themselves online.

To understand the foundation of this trend, read our guide on [what is a verified CV](/resources/blog/what-is-verified-cv) and why it's replacing the traditional format.

## Conclusion

The traditional CV isn't dead — but it's no longer sufficient on its own. In 2026, employers expect more than a formatted list of claims. They expect proof. Digital credentials CV systems, digital badges on resumes, and verified professional profiles are not the future — they are the present standard for competitive candidates.

Get ahead of the curve with a verified professional profile on [YourCVPassport](https://yourcvpassport.com) — built for the future of trusted hiring.$$,
$$https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80&auto=format&fit=crop$$,
$$Technology$$,
false,
'2026-04-13',
$$Digital Credentials vs Traditional CV: 2026 Comparison$$,
$$Compare digital credentials CV systems with traditional resumes. See why digital badges on a resume are replacing static CVs in modern 2026 hiring.$$,
'en'
);

-- Article #17


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Blockchain Resume Verification: How It Works and Why It Matters$$,
$$blockchain-resume-verification$$,
$$An honest guide to blockchain resume verification — what it is, how it works, where it's being adopted, and what job seekers need to know now.$$,
$$Few technologies have generated more hype — and more confusion — in the HR world than blockchain. You've probably seen the headlines: "Blockchain Will Revolutionize Resume Verification." But what does that actually mean? How does a blockchain CV verification system work in practice? And is it relevant to you as a job seeker or hiring professional today?

This guide cuts through the noise with a clear, honest explanation of blockchain resume technology, where it genuinely adds value, and what the landscape looks like in 2026.

## What Is Blockchain, in Plain English?

A blockchain is a distributed ledger — a database that isn't stored in one place but is replicated across thousands of nodes simultaneously. Any record entered into a blockchain is cryptographically linked to the records before and after it, making it practically impossible to alter without detection.

In the context of credentials, this means: if a university records your degree on a blockchain, no one — not even the university — can quietly edit or erase that record later. The ledger is permanent, transparent, and independently verifiable.

:::info Blockchain is not a single product or service. It's an underlying technology, like HTTPS is to the web. Different platforms implement it differently. When someone says "blockchain resume," they usually mean a credential stored on or anchored to a blockchain ledger. :::

## Why Apply Blockchain to Resume Verification?

The traditional hiring process has a trust gap. According to a 2026 report by Willo, **37% of employers consider CVs unreliable** — and they're not wrong to be skeptical. Resume fraud is endemic. Dates get stretched, titles get inflated, degrees get invented.

Background checks exist to address this, but they're slow (often 5–14 business days), expensive, and inconsistent across borders. For global hiring, verifying a degree from a foreign institution can be a genuine logistical nightmare.

Blockchain CV verification proposes a structural solution: instead of relying on a hiring manager to call a university admissions office, the credential itself carries proof of authenticity — proof that can be checked instantly, anywhere in the world.

As the Interview Guys noted in their 2026 hiring trends report, *"recruiters expect verification at one click away."* Blockchain-anchored credentials make that expectation technically achievable.

## How Blockchain Resume Verification Works

Here is a simplified walkthrough of a blockchain-based credential verification flow:

**Step 1 — Issuance.** An institution (university, employer, certification body) issues a credential. The credential data — including the recipient's identity, the achievement, the issue date, and the issuer's identity — is hashed and recorded on a blockchain.

**Step 2 — Receipt.** The credential holder receives a digital certificate, typically as a URL, a QR code, or a file. This is their blockchain resume entry for that credential.

**Step 3 — Sharing.** The holder includes the credential link in their job application, their professional profile, or their email signature.

**Step 4 — Verification.** The employer or recruiter clicks the link (or scans the QR code). The verification system queries the blockchain, confirms the hash matches, and returns a confirmed result — in seconds.

:::example A hiring manager receives a CV for a software engineering role. Instead of scheduling a background check, she clicks the MIT certificate link in the candidate's profile. In three seconds, she sees: Verified. Issued 2023. Not revoked. Done. :::

## The W3C Standard: Making It Interoperable

One of the biggest challenges for blockchain CV verification has historically been fragmentation. Every platform had its own format, which meant a credential issued by one system couldn't be read by another.

The W3C Verifiable Credentials standard is changing this. It's an open, vendor-neutral specification that defines how credentials should be structured so they can be issued, held, and verified across different platforms and systems. In 2025 and 2026, adoption of this standard has accelerated significantly in HR-tech.

This matters because it means blockchain resume data is increasingly readable by the same ATS systems that **99% of Fortune 500 companies** use to screen applications (Resume Professional Writers, 2026).

## Where Is Blockchain Credential Verification Being Used Today?

Blockchain-based credential verification is live and growing in several areas:

- **Higher education** — Universities including MIT, Holberton School, and institutions across the EU are issuing blockchain-anchored diplomas
- **Professional certifications** — Bodies like CompTIA, certain IEEE programs, and industry-specific regulators are piloting blockchain certificates
- **Government identity** — Several national governments are exploring blockchain-based digital identity and qualification records
- **HR platforms** — A growing number of HR-tech platforms are integrating W3C Verifiable Credentials into their candidate screening flows

:::warning It's important to be realistic: widespread, end-to-end blockchain CV verification for all hiring decisions is still emerging — not universal. The technology is proven and adoption is growing, but most hiring still involves manual steps. The trend is clearly toward automation, but expect a transition period. :::

## What This Means for Job Seekers Right Now

Even if your industry hasn't fully adopted blockchain verification yet, there are practical steps you can take today:

- **Collect digital credentials** wherever available — from your university, your certification providers, your professional development courses
- **Use a verified professional profile platform** to aggregate and display these credentials with trust signals attached
- **Stay informed** about W3C Verifiable Credentials and how the platforms you use align with open standards
- **Link your credentials** in your applications rather than attaching static PDFs — a link can be verified; an attachment cannot

Platforms like YourCVPassport are positioned to support this shift — built on open credential standards so that as blockchain resume verification becomes mainstream, your verified profile is already aligned with where hiring is heading.

The direction of travel is clear. As explored in our piece on [digital credentials vs traditional CV](/resources/blog/digital-credentials-vs-traditional-cv), the shift away from self-reported documents is accelerating across every sector.

## The Honest Bottom Line

Blockchain resume verification is real, technically sound, and genuinely useful — but it's not magic and it's not yet everywhere. What it represents is a structural solution to a structural problem: the fundamental unverifiability of the traditional CV.

The platforms and institutions that are adopting blockchain credential standards now are building the infrastructure that will define trusted hiring over the next decade. For job seekers, aligning your professional presence with that infrastructure — verified credentials, trusted profiles, open standards — is a meaningful competitive advantage.

Get ahead of the curve with a verified professional profile on [YourCVPassport](https://yourcvpassport.com) — built for the future of trusted hiring.$$,
$$https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?w=1200&q=80&auto=format&fit=crop$$,
$$Technology$$,
false,
'2026-04-15',
$$Blockchain Resume Verification: How It Works (2026)$$,
$$Learn how blockchain resume and blockchain CV verification work, why employers are adopting it, what the honest limitations are, and what job seekers should do now.$$,
'en'
);

-- Article #18


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Credenciales digitales: el futuro de la verificación profesional$$,
$$credenciales-digitales-verificacion-profesional$$,
$$Las credenciales digitales están transformando la contratación en 2026. Descubre qué son, cómo funciona la verificación digital y por qué ya son imprescindibles.$$,
$$El mercado laboral está experimentando uno de sus cambios más profundos en décadas. Las credenciales digitales profesional no son una moda pasajera ni una promesa tecnológica lejana: son hoy la forma más confiable y eficiente de demostrar quién eres como profesional, qué has logrado y por qué mereces ese puesto.

Si eres candidato, reclutador o responsable de RRHH y todavía dependes exclusivamente del CV en papel o en PDF, este artículo es para ti.

## El problema con el CV tradicional

El CV tradicional es un documento autodeclarado. Tú lo escribes, tú decides qué entra, y el empleador debe confiar en tu palabra — al menos hasta que se haga una verificación posterior. El problema es que esa verificación raramente ocurre de forma sistemática, especialmente para posiciones de nivel medio.

Según un estudio de Willo de 2026, **el 37% de los empleadores considera que los CVs ya no son indicadores fiables** de la calidad o veracidad de un candidato. Y el 41% de las empresas está alejándose de los procesos de contratación basados exclusivamente en el CV.

:::warning El fraude en los currículums no es marginal. Las fechas infladas, los títulos exagerados y las habilidades inventadas son prácticas más comunes de lo que las empresas quieren reconocer — y tienen un coste real en malas contrataciones. :::

La verificación digital surge precisamente para resolver esta brecha de confianza. En lugar de depender de lo que el candidato afirma, la verificación digital permite comprobar en segundos lo que realmente puede demostrar.

## Qué son las credenciales digitales profesional

Una credencial digital profesional es un certificado estructurado y verificable emitido por una entidad reconocida — una universidad, una organización certificadora, una plataforma de empleo o un empleador — que acredita un logro, una habilidad o una cualificación específica.

A diferencia de una línea en un CV, una credencial digital contiene metadatos: quién la emitió, cuándo, bajo qué criterios y si sigue vigente. Esa información puede ser comprobada al instante por cualquier empleador con acceso al sistema adecuado.

:::info El estándar W3C Verifiable Credentials está ganando adopción acelerada en el sector HR-tech durante 2025-2026. Define cómo deben estructurarse las credenciales para que sean interoperables entre plataformas y sistemas de selección. :::

Las credenciales digitales profesional pueden representar:

- Títulos universitarios y postgrados
- Certificaciones técnicas y profesionales
- Cursos y programas de formación completados
- Experiencia laboral verificada por empleadores anteriores
- Habilidades específicas validadas por evaluaciones externas
- Logros y reconocimientos dentro de plataformas profesionales

## Por qué la verificación digital está ganando terreno

El impulso hacia la verificación digital no viene solo de la tecnología — viene de la presión empresarial. Los tiempos de contratación son cada vez más cortos. Las consecuencias de una mala contratación son cada vez más costosas. Y las herramientas para verificar credenciales de forma automatizada son cada vez más accesibles.

Según Resume Professional Writers, el **99% de las empresas del Fortune 500** utilizan sistemas ATS con capas de inteligencia artificial para filtrar candidatos antes de que un humano lea el CV. Las credenciales digitales verificables son nativas en estos entornos: son datos estructurados que los algoritmos pueden procesar directamente.

El resultado práctico es claro: un candidato cuyas credenciales digitales profesional están verificadas y enlazadas en su perfil supera los filtros automáticos con mayor facilidad que uno que presenta un PDF estático.

:::tip Si aspiras a puestos en sectores regulados — finanzas, sanidad, educación, tecnología — las credenciales digitales verificadas no son un valor añadido: son cada vez más un requisito implícito del proceso de selección. :::

## Cómo funciona un sistema de verificación digital

El flujo de verificación digital en una plataforma moderna es sencillo:

**1. Emisión.** Una institución o plataforma emite la credencial y la registra en un sistema verificable (puede incluir tecnología blockchain o simplemente firma digital con hash criptográfico).

**2. Recepción.** El profesional recibe la credencial vinculada a su perfil digital — no como un archivo adjunto, sino como un enlace permanente y verificable.

**3. Compartición.** El candidato incluye su perfil verificado en su solicitud de empleo. El reclutador recibe no solo afirmaciones, sino pruebas comprobables.

**4. Verificación.** El empleador hace clic en el enlace o escanea el código QR. El sistema confirma la autenticidad en segundos. Sin esperas. Sin llamadas a universidades. Sin incertidumbre.

Este flujo es exactamente lo que describe The Interview Guys en su informe de tendencias 2026: *"los reclutadores esperan la verificación a un solo clic de distancia."*

## El impacto para los profesionales en activo

Para un profesional que busca empleo en 2026, la implicación práctica es directa: quienes tienen sus credenciales digitales organizadas y verificadas compiten en mejores condiciones que quienes dependen únicamente de un CV formateado.

Esto no significa abandonar el CV — significa complementarlo con señales de confianza que los empleadores y los sistemas automatizados pueden procesar inmediatamente.

Las acciones concretas que los profesionales más avanzados están tomando incluyen:

- Reclamar sus credenciales digitales en cada institución, empleador o plataforma que las ofrezca
- Construir un perfil digital verificado con una URL permanente y compartible
- Reemplazar el archivo adjunto estático por un enlace activo en sus solicitudes y firma de correo
- Elegir plataformas que emitan credenciales bajo estándares abiertos e interoperables

Para entender la base de este sistema, te recomendamos leer nuestro artículo sobre [qué es un CV verificado](/recursos/blog/que-es-cv-verificado), donde explicamos cómo funciona la verificación de perfil paso a paso.

## El futuro próximo: perfiles verificados como estándar

La dirección es clara. A medida que los estándares de credenciales digitales maduren y más instituciones los adopten, el CV tradicional pasará a ser un resumen narrativo mientras las credenciales digitales profesional harán el trabajo pesado de la verificación.

Las plataformas que conectan ambos mundos — ofreciendo un perfil profesional atractivo *y* credenciales verificadas y legibles por máquina — están posicionadas para convertirse en el estándar de cómo los profesionales se presentan en línea.

No es ciencia ficción. Es el presente de la contratación en los mercados laborales más avanzados del mundo, y está llegando a todos los sectores.

## Conclusión

Las credenciales digitales profesional representan un cambio estructural en la forma en que la confianza se construye y se comunica en el mercado laboral. La verificación digital no es una mejora cosmética del CV — es una arquitectura diferente para demostrar quién eres como profesional.

En 2026, los candidatos que lideran los procesos de selección no son necesariamente los que tienen el CV mejor formateado. Son los que pueden demostrar, en un clic, que son exactamente quienes dicen ser.

Prepárate para el futuro del empleo con tu perfil verificado en [YourCVPassport](https://yourcvpassport.com).$$,
$$https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80&auto=format&fit=crop$$,
$$Tecnología$$,
false,
'2026-04-17',
$$Credenciales digitales: verificación profesional 2026$$,
$$Descubre qué son las credenciales digitales profesional, cómo funciona la verificación digital y por qué son el futuro del empleo competitivo en 2026.$$,
'es'
);

-- Article #19


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$What Are Verifiable Credentials? A Simple Guide for Job Seekers$$,
$$what-are-verifiable-credentials$$,
$$A plain-English guide to verifiable credentials — what they are, why employers want them, and how to use verified credentials to get hired faster in 2026.$$,
$$You may have heard the term "verifiable credentials" popping up in conversations about the future of work, digital identity, and hiring technology. It sounds technical — and underneath the hood, it is. But the concept itself is straightforward, and it matters enormously to anyone navigating the job market in 2026.

This guide explains what verifiable credentials are, how they differ from a traditional CV or certificate, and what you can do right now to build a credential-backed professional profile that stands out.

## The Simple Version: What Are Verifiable Credentials?

A verifiable credential is a tamper-proof digital document that proves a specific claim about you — issued by a trusted authority and structured so that anyone can instantly confirm it's genuine.

Think of it as the digital equivalent of a notarised document. Except instead of a stamp and a signature that someone could theoretically forge, a verifiable credential uses cryptographic proof that cannot be faked.

Verified credentials for job applications can include:

- A university degree confirmed by the institution
- A professional certification from an accredited body
- A completed course or training program
- A verified work history endorsed by a former employer
- A skills assessment result from a trusted evaluation platform
- A professional achievement or recognition tied to a verifiable source

:::info The W3C Verifiable Credentials standard is the global open specification that defines how these credentials must be structured. It was developed by the World Wide Web Consortium and has been gaining significant traction in HR-tech platforms throughout 2025 and 2026. It ensures credentials issued on one platform can be read and trusted by another. :::

## Why Do Employers Care About Verifiable Credentials?

Because the alternative — the traditional CV — has a serious trust problem.

According to a 2026 report by Willo, **37% of employers say CVs are no longer reliable indicators** of candidate quality. That's more than one in three hiring professionals who have effectively stopped trusting the primary document they're supposed to use to make decisions.

The reasons are well-understood: resume fraud is widespread, ranging from subtle embellishments to wholesale fabrication of qualifications. Background checks exist to address this, but they're slow, expensive, and inconsistent — particularly for international candidates.

Verifiable credentials solve this structurally. Instead of trusting what a candidate says about themselves, an employer can verify what a trusted third party has confirmed. The difference is fundamental.

:::warning According to The Interview Guys' 2026 hiring trends report, "recruiters expect verification at one click away." A static PDF of a certificate cannot be verified at one click. A verifiable credential can. :::

As explored in our guide on [digital credentials vs traditional CV](/resources/blog/digital-credentials-vs-traditional-cv), this expectation is reshaping how hiring funnels are designed — and which candidates move through them fastest.

## How Verifiable Credentials Are Different from a PDF Certificate

You might be thinking: "I already have a PDF of my degree certificate. Isn't that basically the same thing?"

It is not — and understanding why is important.

**A PDF certificate:**
- Can be edited with widely available tools
- Cannot be verified without contacting the issuing institution
- Has no expiry or revocation mechanism that an employer can check
- Is a static file that becomes separated from any verifiable source

**A verifiable credential:**
- Is cryptographically signed by the issuing institution
- Can be verified in seconds without contacting anyone
- Carries metadata: issue date, expiry date, revocation status
- Remains permanently linked to its trusted source

For employers screening hundreds of applications — especially with **99% of Fortune 500 companies using AI-powered ATS systems** (Resume Professional Writers, 2026) — the difference between a document that can be verified automatically and one that cannot is the difference between passing the first filter and being discarded.

## The Role of Open Standards

One reason verifiable credentials are becoming practical for mainstream hiring is the W3C standard. Before open standards existed, each platform had its own credential format, creating a fragmented ecosystem where a credential from one system was meaningless on another.

With W3C Verifiable Credentials, a credential issued by your university can be read by a recruiter's ATS, understood by a professional profile platform, and verified by an employer's compliance system — all automatically, all without anyone making a phone call.

This interoperability is what makes the shift to verified credentials job-ready in a practical sense. It's not just a better technology — it's a connected ecosystem.

:::tip If you're choosing a professional platform or certification program, look for those that issue credentials compliant with W3C Verifiable Credentials or use open badge standards. These are the credentials that will carry value across systems. :::

## What Verifiable Credentials Look Like in Practice

Here's a realistic scenario for a job seeker in 2026:

Maya is applying for a senior data analyst role. She has a Master's degree, three professional certifications, and five years of verified work history on her YourCVPassport profile. Her profile link is in her application email.

The recruiter clicks the link. In under a minute, they can see:
- Her degree: Verified by the university, conferred 2022, not revoked
- Her AWS certification: Verified, current, expires 2027
- Her Google Analytics certification: Verified, current
- Her work history: Endorsed by two former managers on the platform

The recruiter moves her to the interview pile without scheduling a background check. The process took 45 seconds.

Compare that to a candidate who attached a PDF CV with the same qualifications listed as text. The recruiter has no way to verify any of it without additional work — and in a competitive market, they may simply move on.

## How to Build Your Verifiable Credential Portfolio

You don't need to be a technologist to start building a credential-backed professional profile. Here's a practical approach:

**1. Identify what you already have.** Think about every degree, certification, completed course, and professional milestone you've achieved. Which of these were issued by organizations that offer digital credentials or digital badges?

**2. Claim your digital credentials.** Many universities and certification bodies already issue verifiable credentials — but you may need to request them. Check your institution's alumni portal or certification dashboard.

**3. Aggregate them in one verified profile.** A professional platform that supports verified credentials lets you display all of these in one place, with a single shareable URL.

**4. Link your profile, not just your CV.** In job applications, email signatures, and LinkedIn, include the link to your verified profile alongside — or instead of — a static CV attachment.

**5. Keep your credentials current.** As you complete new courses, earn new certifications, or hit new milestones, add them to your profile. A verified profile is a living document, not a snapshot.

For a deeper understanding of how blockchain technology underpins some of these systems, read our guide on [blockchain resume verification](/resources/blog/blockchain-resume-verification).

## The Bigger Picture

Verifiable credentials are part of a broader shift in how professional identity and trust work online. The same way HTTPS gave us trusted websites, verifiable credentials are giving us trusted professional claims. The infrastructure is maturing. The standards are converging. The employer demand is real.

**41% of employers are moving away from CV-first hiring** (Willo, 2026). What are they moving toward? Skills evidence, portfolio work, and — increasingly — verified credentials job records that don't require manual checking.

The job seekers who adapt fastest to this shift will have a genuine, durable competitive advantage. Not just in landing the next job — but in building a professional reputation that compounds over time, backed by proof rather than promises.

## Conclusion

Verifiable credentials are not a niche technology for blockchain enthusiasts. They are a practical tool for any professional who wants their qualifications to speak for themselves — instantly, reliably, and without friction.

In a hiring market where **37% of employers distrust CVs**, being the candidate whose claims can be verified at one click is not a minor advantage. It's the difference between a pile and a shortlist.

Get ahead of the curve with a verified professional profile on [YourCVPassport](https://yourcvpassport.com) — built for the future of trusted hiring.$$,
$$https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop$$,
$$Technology$$,
false,
'2026-04-20',
$$What Are Verifiable Credentials? Job Seeker Guide 2026$$,
$$Learn what verifiable credentials are, how verified credentials for jobs work, and why employers in 2026 are demanding proof over promises. Start building yours today.$$,
'en'
);



-- ------------------------------------------------------------
-- BLOQUE E: Spanish Market ES (Articles #20-24)
-- ------------------------------------------------------------


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Guía completa: Cómo superar los filtros ATS con tu currículum en 2026$$,
$$superar-filtros-ats-curriculum-2026$$,
$$Aprende cómo funcionan los filtros ATS en 2026 y qué estrategias concretas usar para que tu currículum llegue a ojos humanos y consigas la entrevista.$$,
$$El 99% de las empresas Fortune 500 utilizan sistemas de seguimiento de candidatos con inteligencia artificial para filtrar currículums antes de que un reclutador humano los lea. Esto significa que, si tu currículum no está optimizado para superar los filtros ATS, probablemente nunca llegará a la persona adecuada, sin importar cuánta experiencia tengas. En 2026, saber cómo superar los filtros ATS currículum se ha convertido en una habilidad tan importante como redactar bien o presentar tus logros con claridad.

En esta guía completa te explicamos qué son los ATS, cómo funcionan en la actualidad y qué cambios concretos debes hacer en tu currículum para maximizar tus posibilidades de pasar el primer filtro y llegar a la entrevista.

## Qué es un ATS y cómo ha evolucionado en 2026

Un ATS (*Applicant Tracking System*) es un software que las empresas utilizan para gestionar las solicitudes de empleo. Originalmente, estos sistemas simplemente almacenaban y organizaban candidaturas. Hoy, los ATS modernos incorporan inteligencia artificial capaz de analizar el lenguaje, detectar coherencia entre experiencia y puesto, e incluso puntuar automáticamente cada candidato.

:::info Los ATS actuales no solo buscan palabras clave: evalúan la relevancia contextual, la coherencia temporal de la experiencia y la alineación entre las habilidades declaradas y los requisitos del puesto. :::

La consecuencia práctica es clara: los trucos de hace cinco años —como rellenar el currículum de palabras clave repetidas— ya no funcionan e incluso pueden penalizarte. Los algoritmos son más sofisticados y el currículo debe ser tanto legible para la máquina como convincente para el humano.

## Las razones por las que los CVs fallan en los filtros ATS

Antes de hablar de soluciones, conviene entender los errores más frecuentes que hacen que un currículum quede descartado automáticamente:

- **Formato complejo**: columnas múltiples, tablas, encabezados y pies de página, gráficos o iconos. Los ATS a menudo no pueden leer estos elementos y omiten información crucial.
- **Archivos no compatibles**: enviar el CV en formato de imagen, PDF con texto incrustado como imagen o en formatos propietarios que el sistema no puede procesar.
- **Palabras clave ausentes o mal elegidas**: no incluir los términos exactos que aparecen en la oferta de empleo.
- **Fechas y períodos mal formateados**: los ATS leen las cronologías para detectar lagunas o inconsistencias.
- **Títulos de sección no estándar**: si llamas "Trayectoria" a lo que el ATS espera encontrar como "Experiencia laboral", puede no identificarlo.

:::warning No caigas en la trampa de "rellenar" el currículum con palabras clave ocultas (texto blanco sobre fondo blanco, fuente tamaño 1). Los ATS modernos detectan esta práctica y descartan la candidatura automáticamente. :::

## Estrategias clave para superar los filtros ATS currículum en 2026

La optimización para superar ATS no significa sacrificar calidad ni autenticidad. Significa comunicar tu experiencia de forma que tanto el algoritmo como el humano la valoren.

**1. Lee la oferta con atención y extrae las palabras clave**
Anota los términos exactos que aparecen en la descripción del puesto: habilidades técnicas, títulos de posición, herramientas, certificaciones. Incorpora esas palabras en tu CV de forma natural, en contexto real de tus funciones y logros.

**2. Usa un formato limpio y sin columnas**
Un diseño de una sola columna, con fuentes estándar (Arial, Calibri, Times New Roman), es el más compatible con la mayoría de los sistemas. Evita tablas y cuadros de texto flotantes.

**3. Nombra las secciones con términos estándar**
Usa etiquetas reconocibles: "Experiencia laboral", "Educación", "Habilidades", "Certificaciones". Los ATS están entrenados para identificar estas secciones por su nombre convencional.

**4. Cuantifica tus logros con datos**
Los ATS de última generación valoran más los logros medibles que las descripciones genéricas. "Aumenté las ventas un 30% en 6 meses" tiene más peso que "responsable del área de ventas".

**5. Adapta el CV a cada oferta**
Un currículum genérico tiene muchas menos posibilidades de superar los filtros ATS currículum que uno adaptado al puesto específico. No es necesario reescribirlo por completo: basta con ajustar el resumen profesional y priorizar las habilidades más relevantes para esa empresa.

:::tip Usa el mismo lenguaje que la oferta. Si el anuncio dice "gestión de proyectos ágiles" y tú escribes "dirección de proyectos con metodología scrum", puede que el ATS no los relacione como equivalentes. :::

## El papel de la verificación profesional en la era ATS

Superar el filtro automatizado es solo el primer paso. Cuando tu CV llega a ojos humanos, necesitas diferenciarte. El 57% de los reclutadores ya detectan más CVs generados por IA, y el 62% rechaza candidaturas genéricas sin toque personal. La autenticidad y la verificación se han convertido en ventajas competitivas reales.

Un [perfil profesional verificado](/recursos/blog/crear-perfil-profesional-verificado) añade una capa de credibilidad que ningún ATS puede generar por ti: demuestra que tus datos son reales, que tus credenciales han sido validadas y que eres una persona real comprometida con su desarrollo profesional.

:::example Ejemplo: Un candidato con experiencia en marketing digital incluye un enlace a su perfil verificado en YourCVPassport directamente en el CV. El reclutador puede verificar en segundos sus certificaciones, experiencia y habilidades sin hacer llamadas ni esperar referencias. :::

## Checklist final: antes de enviar tu CV

- Guardado en formato .docx o PDF generado desde texto (no escaneado).
- Sin columnas, tablas ni elementos gráficos complejos.
- Secciones con nombres estándar y reconocibles.
- Palabras clave de la oferta incorporadas de forma natural.
- Logros cuantificados con números y porcentajes.
- Resumen profesional adaptado al puesto específico.
- Enlace al perfil verificado incluido en la cabecera de contacto.

Dominar cómo superar los filtros ATS currículum es hoy tan importante como saber redactar. Pero recuerda: el objetivo final no es engañar a un algoritmo, sino presentar tu experiencia real de la manera más efectiva posible.

Crea hoy tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu autenticidad a los empleadores de todo el mundo.$$,
$$https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop$$,
$$Consejos de Carrera$$,
false,
'2026-05-01',
$$Cómo superar los filtros ATS en 2026 | YourCVPassport$$,
$$Guía completa para optimizar tu currículum y superar los filtros ATS en 2026. Estrategias prácticas, errores clave a evitar y cómo llegar a la entrevista.$$,
'es'
);


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Por qué los reclutadores ya no confían en los CVs tradicionales$$,
$$reclutadores-no-confian-cvs-tradicionales$$,
$$El problema del CV tradicional es real: el 37% de los empleadores ya no lo consideran un indicador fiable. Descubre por qué y qué alternativas existen.$$,
$$Durante décadas, el currículum vitae fue el documento central de cualquier proceso de selección. Una hoja —o dos— que resumía la trayectoria de un candidato y servía como punto de partida para decidir quién pasaba a la entrevista. Ese modelo está en crisis. No es una exageración: el 37% de los empleadores afirman hoy que las credenciales y los CVs ya no son indicadores fiables del potencial de un candidato, según el informe Willo Hiring Trends 2026.

El problema del CV tradicional no es cosmético. Es estructural. Y entenderlo es el primer paso para posicionarse mejor en el mercado laboral actual.

## El currículum como artefacto del siglo XX

El CV nació en un contexto donde la información sobre los candidatos era escasa y difícil de verificar. El reclutador no tenía otra opción que confiar en lo que el candidato declaraba. En ese entorno, el formato tenía sentido: resumir la experiencia, la formación y las habilidades en un documento estándar.

Ese contexto ya no existe. Hoy los reclutadores pueden verificar datos en segundos, consultar perfiles en plataformas profesionales, acceder a portfolios en línea y solicitar referencias digitales. El CV tradicional, en comparación, se ha quedado como un documento estático que no aprovecha ninguna de estas capacidades.

:::info El 41% de los empleadores están alejándose activamente del modelo basado en CVs tradicionales, según Willo Hiring Trends 2026. No se trata de una tendencia marginal: es un cambio estructural en cómo se contrata. :::

## La epidemia de CVs falseados e inflados

Uno de los factores que más ha erosionado la confianza de los reclutadores en el CV tradicional es la facilidad con la que se puede manipular su contenido. Antes, inflar un currículum requería cierta audacia; hoy, con herramientas de IA generativa, cualquier persona puede producir en minutos un CV que parezca impecable aunque no refleje la realidad.

El 57% de los reclutadores reportan detectar más CVs generados o mejorados con IA, y el 90% señalan un aumento de solicitudes de bajo esfuerzo o directamente spam. El resultado: los equipos de selección pasan más tiempo filtrando ruido que identificando talento real.

Este no es solo un problema para las empresas. Es también un problema para los candidatos honestos, que compiten en desigualdad de condiciones contra perfiles artificialmente inflados.

:::warning Si tu CV parece generado por IA —demasiado perfecto, demasiado genérico, sin voz propia— es más probable que sea descartado o señalado para revisión adicional. El 62% de los empleadores rechazan CVs genéricos sin toque personal. :::

## Qué buscan hoy los reclutadores en su lugar

El problema del CV tradicional ha llevado a los equipos de selección a buscar señales de autenticidad y competencia real en otros lugares:

- **Portafolios y trabajo demostrable**: proyectos reales, código publicado, diseños, artículos, resultados medibles.
- **Evaluaciones de competencias**: pruebas técnicas, simulaciones de situaciones laborales, assessments de habilidades blandas.
- **Perfiles verificados con credenciales validadas**: documentos respaldados por terceros que confirman que la experiencia y formación declaradas son reales.
- **Vídeos de presentación y pitches breves**: que muestran comunicación real, no la versión curada de un documento.

El 10% de las empresas ya han reemplazado completamente los CVs por evaluaciones de competencias, y este porcentaje seguirá creciendo. No porque el CV haya dejado de ser útil como resumen, sino porque ya no puede ser el único ni el principal criterio de selección.

## Por qué la verificación se ha vuelto esencial

La respuesta al problema del CV tradicional no es abandonar el currículum, sino transformarlo en algo verificable y transparente. Un [CV verificado](/recursos/blog/que-es-cv-verificado) no solo lista experiencias: las respalda con evidencias que un reclutador puede comprobar en tiempo real.

Esto cambia completamente la dinámica. En lugar de que el reclutador tenga que asumir que lo que lee es cierto, puede comprobarlo directamente. El candidato que ofrece transparencia y verificabilidad no solo genera más confianza: también acelera el proceso de selección y se diferencia del 90% de candidatos que siguen enviando documentos sin ningún respaldo.

:::tip Si quieres destacar frente al problema del CV tradicional, incluye en tu candidatura un enlace a tu perfil verificado. Es la señal más clara de que no tienes nada que ocultar y mucho que demostrar. :::

## Cómo adaptar tu estrategia en 2026

Los candidatos que comprenden por qué los reclutadores no confían en el CV tradicional tienen una ventaja: pueden actuar en consecuencia antes que la mayoría.

Algunas acciones concretas:

- **Construye presencia verificable**: certificaciones con credencial digital, proyectos documentados, endorsements de compañeros o clientes reales.
- **Adapta el formato**: el CV sigue siendo necesario, pero complementado con un perfil profesional dinámico y verificado.
- **Prioriza la autenticidad**: tu voz, tu estilo, tus logros reales tienen más valor que un documento pulido pero vacío.
- **Facilita la verificación**: incluye enlaces, credenciales digitales y referencias accesibles desde el primer contacto.

El reclutamiento está cambiando más rápido que la mayoría de los candidatos. Quienes se adapten ahora estarán en una posición mucho mejor cuando la transformación sea completa.

Crea hoy tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu autenticidad a los empleadores de todo el mundo.$$,
$$https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=1200&q=80&auto=format&fit=crop$$,
$$Reclutamiento$$,
false,
'2026-05-04',
$$Por qué los reclutadores no confían en el CV tradicional$$,
$$El 37% de los empleadores ya no considera el CV un indicador fiable. Descubre las causas del problema del CV tradicional y qué hacer al respecto.$$,
'es'
);


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Datos del pasaporte en el currículum: qué incluir según cada país$$,
$$datos-pasaporte-curriculum-pais$$,
$$¿Debes incluir datos del pasaporte en el currículum? Depende del país. Guía actualizada con las normas por región para candidatos internacionales.$$,
$$Una de las preguntas más frecuentes entre quienes buscan empleo en el extranjero o aplican a puestos en empresas multinacionales es si deben incluir datos del pasaporte en el currículum. La respuesta no es universal: varía significativamente según el país, la legislación laboral local y las normas culturales del mercado de trabajo de destino.

Cometer un error en este punto puede tener consecuencias en dos direcciones: incluir demasiada información personal en países donde está desaconsejado puede generar rechazos por discriminación potencial, mientras que omitirla donde es esperada puede transmitir falta de preparación o transparencia. Esta guía te ayuda a navegar esas diferencias.

## Por qué el contexto geográfico lo cambia todo

El tratamiento de los datos personales en los procesos de selección está directamente ligado a la legislación de protección de datos y a las tradiciones del mercado laboral de cada región. En Europa, el Reglamento General de Protección de Datos (RGPD) ha establecido estándares muy estrictos sobre qué información puede solicitar un empleador. En otros mercados, como el de Oriente Medio o ciertas economías asiáticas, incluir datos del pasaporte en el CV es práctica habitual e incluso esperada.

:::info En la Unión Europea, incluir el número de pasaporte o datos de identificación nacional en el currículum no es recomendable y puede incluso estar reñido con las buenas prácticas de protección de datos. Los empleadores europeos no deben solicitar esta información en fases tempranas del proceso. :::

Entender estas diferencias no solo protege tu privacidad: también te ayuda a parecer un candidato culturalmente preparado para el mercado al que te diriges.

## Europa y Reino Unido: menos es más

En los países de la Unión Europea y en el Reino Unido post-Brexit, los currículums tienden a incluir información de contacto mínima: nombre completo, ciudad de residencia (no dirección completa), correo electrónico y teléfono. Los datos del pasaporte en el currículum están completamente fuera de lugar en estos mercados.

Lo que sí puede ser relevante en esta región es mencionar tu situación de permisos de trabajo si eres ciudadano extranjero: por ejemplo, "Titular de permiso de trabajo UE" o "Ciudadano de la UE sin necesidad de patrocinio de visado". Esta información es práctica y elimina incertidumbre para el empleador sin comprometer datos sensibles.

- **Incluir**: nombre, ciudad, email, teléfono, LinkedIn, sitio web/portfolio.
- **Mencionar si aplica**: situación de permiso de trabajo, idiomas y nivel.
- **No incluir**: número de pasaporte, DNI, fecha de nacimiento, foto (en la mayoría de países).

:::tip En Alemania, sin embargo, la tradición del "Lichtbildlebenslauf" (currículum con foto) persiste. Conoce las convenciones específicas del país de destino antes de adaptar tu currículum. :::

## Estados Unidos y Canadá: privacidad estricta

En Norteamérica, incluir datos del pasaporte en el currículum o cualquier documento de identidad está no solo desaconsejado sino que puede generar problemas legales para el empleador. Las leyes antidiscriminación son estrictas y los departamentos de recursos humanos tienen protocolos para evitar que información como el origen nacional, la edad o el estado migratorio influya en las decisiones de contratación antes de que sea legalmente necesaria.

En el mercado estadounidense, el currículum se limita a: nombre, ciudad y estado (no dirección completa), teléfono, email y URL de perfil profesional. Cualquier dato de identificación personal es inapropiado en esta fase del proceso.

- **Incluir**: nombre, ciudad/estado, email, teléfono, LinkedIn.
- **No incluir**: número de pasaporte, fecha de nacimiento, foto, estado civil, número de seguro social.
- **Sobre permisos**: algunos candidatos añaden "Autorizado para trabajar en EE. UU." si tienen permiso de trabajo, para aclarar la situación desde el inicio.

## Oriente Medio y mercados del Golfo

En países como los Emiratos Árabes, Arabia Saudita, Qatar y Kuwait, los datos del pasaporte en el currículum forman parte del estándar del sector. Los empleadores en estos mercados frecuentemente esperan ver el número de pasaporte, la nacionalidad, la fecha de nacimiento, el estado civil e incluso la religión en algunos casos.

Esto responde a razones prácticas relacionadas con los procesos de tramitación de visados y permisos de trabajo en economías con alta proporción de trabajadores expatriados.

:::warning Aunque estos datos sean esperados en el Golfo, nunca los incluyas en un CV dirigido a mercados europeos o norteamericanos. Tener versiones diferenciadas del currículum según el mercado destino es una buena práctica. :::

## Asia: heterogeneidad según el país

Los mercados asiáticos presentan una gran variabilidad. Japón y Corea del Sur tienen sus propios formatos estandarizados de currículum (*Rirekisho* en japonés, *이력서* en coreano) que incluyen foto, fecha de nacimiento y, en algunos casos, datos de identificación. China también tiene convenciones similares. En contraste, Singapur y Hong Kong, con fuerte influencia anglosajona, siguen las convenciones británicas y no esperan datos del pasaporte en el CV.

- **Japón y Corea**: foto, fecha de nacimiento y datos de identificación son habituales.
- **China**: foto y datos personales extendidos son la norma.
- **Singapur y Hong Kong**: convenciones similares al Reino Unido; no incluir datos sensibles.

## Cómo gestionar múltiples versiones de tu perfil

Si tu búsqueda de empleo abarca varios mercados, la solución más práctica es mantener un perfil profesional verificado y centralizado, complementado con versiones del CV adaptadas a cada región.

Un perfil verificado en [YourCVPassport](/recursos/blog/crear-perfil-profesional-verificado) actúa como repositorio de tu identidad profesional: los reclutadores pueden acceder a él y verificar tus datos con el nivel de detalle que sea apropiado en su contexto, sin que tú tengas que comprometer información sensible en documentos estáticos que circulan por múltiples manos.

Los datos del pasaporte en el currículum son un tema de contexto, cultura y legislación. Conocer las normas de cada mercado te da una ventaja real y te protege de errores que podrían costarte una oportunidad.

Crea hoy tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu autenticidad a los empleadores de todo el mundo.$$,
$$https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&q=80&auto=format&fit=crop$$,
$$Consejos de Carrera$$,
false,
'2026-05-06',
$$Datos de pasaporte en el currículum por país 2026$$,
$$¿Debes incluir datos del pasaporte en tu CV? Depende del país. Guía completa por región para candidatos internacionales: Europa, EE. UU., Golfo y Asia.$$,
'es'
);


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Cómo crear un perfil profesional verificado paso a paso$$,
$$crear-perfil-profesional-verificado$$,
$$Guía paso a paso para crear un perfil profesional verificado que genere confianza en reclutadores y empleadores de todo el mundo con consejos prácticos.$$,
$$En un mercado donde el 57% de los reclutadores ya detectan más CVs generados con IA y el 90% reportan un aumento de candidaturas de bajo esfuerzo, la autenticidad verificada se ha convertido en la diferencia entre destacar y ser descartado. Crear un perfil profesional verificado ya no es un extra: es el estándar al que tienden los candidatos que quieren ser tomados en serio.

Esta guía te lleva por cada paso del proceso para que tu perfil verificado sea completo, sólido y efectivo desde el primer día.

## Qué hace que un perfil sea realmente "verificado"

Antes de hablar del proceso, conviene aclarar qué significa que un perfil sea verificado. No se trata simplemente de completar campos en una plataforma. Un perfil profesional verificado es aquel en el que la información declarada —experiencia laboral, formación académica, habilidades, certificaciones— ha sido respaldada por evidencias o validada por terceros de forma que un reclutador pueda comprobarla en tiempo real.

:::info La verificación transforma tu perfil de un documento de autoafirmación en un registro de identidad profesional con credibilidad externa. Es la diferencia entre "yo digo que soy experto" y "esto ha sido comprobado y validado". :::

La distinción importa porque los empleadores han aprendido a desconfiar de los perfiles no verificados. Entender para qué sirve un [CV verificado](/recursos/blog/que-es-cv-verificado) es el punto de partida antes de empezar a crear el tuyo.

## Paso 1: Prepara tu documentación antes de empezar

Crear un perfil profesional verificado sólido requiere reunir la documentación relevante antes de sentarte a completar el formulario. Improvisarlo sobre la marcha lleva a perfiles incompletos que transmiten poco rigor.

Documentación recomendada para tener a mano:

- **Experiencia laboral**: contratos, nóminas, cartas de recomendación de empleadores anteriores, referencias de compañeros o superiores.
- **Formación académica**: títulos, diplomas, certificados de cursos completados.
- **Certificaciones profesionales**: credenciales digitales (Credly, LinkedIn Learning, Google, Microsoft, etc.) con URL verificable.
- **Proyectos y portfolio**: URLs de proyectos publicados, capturas de resultados, enlaces a repositorios o trabajos demostrables.
- **Habilidades**: evidencias de uso real, no solo autodeclaración.

:::tip Cuanta más documentación tengas lista de antemano, más fluido y completo será tu perfil. Un perfil a medio completar transmite menos confianza que uno que nunca se empezó. :::

## Paso 2: Construye una base sólida — los datos esenciales

El núcleo de tu perfil profesional verificado son los datos básicos: nombre completo, foto profesional, titular (headline) y resumen. Cada uno de estos elementos tiene un impacto directo en cómo te percibe un reclutador en los primeros segundos.

**Foto profesional**: clara, con fondo neutro, expresión accesible. No es necesario un fotógrafo profesional, pero sí una imagen que transmita seriedad y cercanía.

**Titular profesional**: no uses solo tu cargo actual. Describe en 10-15 palabras qué haces y para qué tipo de empresa o proyecto. Ejemplo: "Especialista en marketing de contenidos B2B | SEO y estrategia de contenido para SaaS".

**Resumen**: 3-5 frases que expliquen quién eres, qué puedes aportar y qué tipo de oportunidades te interesan. Escribe en primera persona y con voz propia.

## Paso 3: Completa la experiencia laboral con contexto y resultados

La sección de experiencia es donde la mayoría de los perfiles fallan. Listan cargos y fechas pero no transmiten impacto. Para crear un perfil profesional verificado que realmente destaque, cada posición debe incluir:

- Empresa, cargo y período (con fechas exactas).
- 3-5 logros o responsabilidades descritos con verbos de acción y datos cuantificables.
- Enlace o referencia verificable si es posible (nombre de referente, URL de proyecto, credencial).

:::example Ejemplo débil: "Responsable del equipo de ventas." Ejemplo fuerte: "Lideré un equipo de 8 personas en el área de ventas B2B, aumentando la cartera de clientes en un 35% en 12 meses y reduciendo el ciclo de venta promedio de 45 a 28 días." :::

## Paso 4: Añade certificaciones y formación con credenciales digitales

Las certificaciones son el activo más fácil de verificar y, por eso, uno de los más valorados por los reclutadores. Si tienes credenciales digitales con URL (Google, Microsoft, HubSpot, Coursera, etc.), inclúyelas directamente en tu perfil.

Para la formación académica, añade el nombre de la institución, el título obtenido y el año de finalización. Si tienes acceso a un certificado digital o verificable, úsalo.

La regla general: si puedes enlazar a una fuente externa que confirme lo que declaras, hazlo siempre.

## Paso 5: Habilidades verificadas, no solo listadas

Declarar que dominas 40 habilidades sin ningún respaldo no convence a nadie. Para crear un perfil profesional verificado de verdad, las habilidades deben estar respaldadas por contexto: ¿dónde las usaste? ¿con qué resultado? ¿quién puede confirmarlo?

Prioriza calidad sobre cantidad. Diez habilidades respaldadas por experiencia real y evidencias son mucho más persuasivas que cincuenta sin contexto.

## Paso 6: Solicita validaciones externas

Una de las características más poderosas de un perfil profesional verificado es la validación por parte de terceros: excompañeros, supervisores, clientes o colaboradores que pueden confirmar tus habilidades o describir cómo fue trabajar contigo.

Envía solicitudes de validación a personas con quienes hayas trabajado recientemente y que puedan ser específicas en sus comentarios. Una validación genérica ("es muy buen profesional") vale menos que una específica ("coordinó con precisión el lanzamiento de tres productos en seis meses superando los objetivos de ventas").

## Paso 7: Mantén el perfil actualizado

Un perfil verificado que se abandonó hace dos años genera desconfianza. La actualización regular —cada vez que terminas un proyecto, obtienes una certificación o cambias de posición— es lo que mantiene tu perfil relevante y vivo.

Establece un recordatorio mensual o trimestral para revisar y actualizar la información. El mercado laboral cambia rápido y tu perfil debe reflejarlo.

Crea hoy tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu autenticidad a los empleadores de todo el mundo.$$,
$$https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80&auto=format&fit=crop$$,
$$Verificación$$,
false,
'2026-05-08',
$$Cómo crear un perfil profesional verificado paso a paso$$,
$$Guía completa para crear un perfil profesional verificado que genera confianza en reclutadores. Pasos detallados, consejos prácticos y errores a evitar.$$,
'es'
);


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Habilidades vs títulos: por qué las empresas contratan por competencias en 2026$$,
$$habilidades-vs-titulos-competencias-2026$$,
$$El modelo de contratar por competencias ha llegado para quedarse. Descubre por qué las empresas priorizan habilidades sobre títulos y cómo posicionarte.$$,
$$Durante décadas, el título universitario fue el principal filtro de entrada al mercado laboral. Si tenías el grado adecuado, al menos llegabas a la entrevista. Si no lo tenías, muchas puertas simplemente estaban cerradas. Ese modelo está cambiando de forma acelerada. En 2026, el debate sobre habilidades vs títulos ya no es teórico: las empresas contratan por competencias de manera creciente y los candidatos que no lo han entendido están en desventaja.

Este artículo explora por qué se ha producido este cambio, qué implica para quienes buscan empleo y cómo puedes posicionarte en un mercado que valora lo que puedes hacer por encima de los diplomas que acumulas.

## El declive del credencialismo y el auge de las competencias

El credencialismo —la práctica de filtrar candidatos principalmente por sus títulos académicos— ha mostrado sus límites de forma evidente en los últimos años. Las empresas que contrataban exclusivamente por credenciales se encontraron con empleados con títulos brillantes pero sin las competencias prácticas necesarias para el trabajo real. Al mismo tiempo, descartaban a candidatos altamente capacitados que habían desarrollado sus habilidades por rutas alternativas.

:::info El currículum centrado en competencias —en lugar de en credenciales formales— se ha consolidado como el formato dominante en 2026, según The Interview Guys. Esto no es solo una tendencia de diseño: refleja un cambio profundo en cómo las empresas definen el talento. :::

La pandemia aceleró este proceso. El trabajo remoto, la digitalización acelerada y la escasez de talento técnico obligaron a las empresas a reconsiderar sus criterios. Contratar por competencias dejó de ser una postura progresista para convertirse en una necesidad práctica.

## Quiénes están liderando el cambio

Algunas de las organizaciones más grandes del mundo han eliminado o reducido significativamente el requisito de titulación universitaria para muchos de sus puestos. IBM, Apple, Google y decenas de empresas del Fortune 500 han anunciado públicamente que el título universitario ya no es condición necesaria para la mayoría de sus vacantes.

El 10% de las empresas ya han reemplazado los CVs por evaluaciones de competencias, y el 41% están alejándose activamente del modelo tradicional basado en credenciales, según Willo Hiring Trends 2026. Esto no significa que los títulos hayan muerto: siguen siendo relevantes en ciertas profesiones reguladas y en determinados contextos. Pero ya no son el único ni el principal criterio de selección en la mayoría de sectores.

:::warning No confundas el fin del credencialismo con el fin de la formación. Las empresas que contratan por competencias valoran el aprendizaje continuo igual o más que los títulos formales. La diferencia es que ahora valoran lo que puedes demostrar, no solo lo que puedes certificar en papel. :::

## Qué entienden las empresas por "contratar por competencias"

Cuando las empresas dicen que contratan por competencias, se refieren a un proceso de selección que evalúa lo que el candidato puede hacer en contextos reales, no solo lo que declara en un documento.

Esto implica cambios concretos en los procesos de selección:

- **Pruebas técnicas y prácticas**: tareas representativas del trabajo real, resueltas en tiempo limitado.
- **Evaluaciones situacionales**: cómo reaccionarías ante un problema específico del puesto.
- **Portfolios y trabajo demostrable**: proyectos reales que evidencian competencia.
- **Entrevistas por competencias**: preguntas estructuradas del tipo "cuéntame una situación en la que..." que exigen evidencia de comportamiento pasado, no afirmaciones generales.
- **Verificación de habilidades por terceros**: endosos, referencias y validaciones externas que respaldan lo que el candidato declara.

:::tip Para posicionarte bien en un proceso de contratación por competencias, empieza por identificar las tres o cinco habilidades críticas para el tipo de puesto que buscas y construye evidencias documentadas de cada una. :::

## La brecha entre habilidades declaradas y habilidades demostradas

El problema central en el debate habilidades vs títulos es la brecha entre lo que los candidatos dicen que saben hacer y lo que realmente pueden demostrar. Esta brecha es especialmente visible en las habilidades más demandadas: análisis de datos, gestión de proyectos, habilidades de comunicación, resolución de problemas.

Cualquier CV puede afirmar que el candidato "domina Excel" o que tiene "excelentes habilidades de comunicación". Lo que diferencia a los candidatos en 2026 es la capacidad de respaldar esas afirmaciones con evidencia concreta y verificable.

Es aquí donde la verificación profesional juega un papel fundamental. Un perfil donde las competencias están respaldadas por proyectos reales, validaciones de compañeros y credenciales verificables cierra esa brecha de forma efectiva. La inteligencia artificial que está transformando el mercado laboral, como se analiza en detalle en [este artículo sobre IA y búsqueda de empleo](/recursos/blog/ia-revoluciona-busqueda-empleo), también está cambiando cómo se evalúa y demuestra la competencia.

## Cómo adaptarte al modelo de contratación por competencias

Hacer la transición de un perfil basado en títulos a uno basado en competencias demostradas requiere un cambio de mentalidad y algunas acciones concretas.

**Audita tus competencias reales**: lista las habilidades que usas de forma habitual en tu trabajo, no las que "suena bien" tener. Sé honesto sobre tu nivel real.

**Construye evidencia para cada competencia clave**: ¿tienes un proyecto que demuestre esa habilidad? ¿Un resultado medible? ¿Una validación externa? Si no, es el momento de construirlo.

**Obtén certificaciones verificables**: no cualquier certificación, sino las que son reconocidas en tu sector y que vienen con credencial digital verificable (Credly, Google, Microsoft, etc.).

**Solicita validaciones a personas que puedan ser específicas**: un colega que trabajó contigo en un proyecto concreto puede validar tu competencia de forma mucho más creíble que una referencia genérica de un supervisor lejano.

**Adapta tu comunicación**: aprende a hablar de tus habilidades con ejemplos concretos, resultados medibles y contexto real. El lenguaje de las competencias no es "soy bueno en X", es "en el proyecto Y logré Z usando X".

:::example Ejemplo de reencuadre: En lugar de "Tengo 5 años de experiencia en marketing digital", prueba: "En los últimos 5 años he gestionado campañas de medios de pago con presupuestos de hasta 200.000 € anuales, logrando un retorno medio de la inversión publicitaria de 4,2 en comercio electrónico B2C. Puedo demostrarlo con datos." :::

## El futuro pertenece a quien puede demostrar lo que sabe

El debate habilidades vs títulos tiene una conclusión clara: las empresas que contratan por competencias no están bajando el listón, están elevándolo en la dirección correcta. Exigen más pruebas de capacidad real, más transparencia y más evidencia de que el candidato puede hacer el trabajo, no solo que fue a la universidad adecuada.

Para los candidatos, esto es una oportunidad enorme. Si tienes competencias reales y puedes demostrarlas, el modelo de contratación por competencias te beneficia independientemente de tu ruta formativa. La clave está en construir un perfil profesional que hable con evidencias, no solo con declaraciones.

Crea hoy tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu autenticidad a los empleadores de todo el mundo.$$,
$$https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80&auto=format&fit=crop$$,
$$Reclutamiento$$,
false,
'2026-05-11',
$$Habilidades vs títulos: contratar por competencias en 2026$$,
$$En 2026 las empresas contratan por competencias, no por títulos. Descubre por qué y cómo posicionar tu perfil con habilidades y evidencias reales.$$,
'es'
);



-- ------------------------------------------------------------
-- BLOQUE F: Niche Sectorial ES (Articles #25-28)
-- ------------------------------------------------------------


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Cómo crear un perfil profesional verificado si eres psicólogo$$,
$$perfil-verificado-psicologo$$,
$$Guía práctica para psicólogos: cómo construir un CV psicólogo verificado que genere confianza en clientes, clínicas y empleadores del sector salud.$$,
$$## Por qué los psicólogos necesitan un perfil verificado hoy más que nunca

Si eres psicólogo, sabes mejor que nadie lo difícil que resulta establecer confianza desde el primer contacto. Tus clientes potenciales —personas en momentos de vulnerabilidad— buscan a alguien en quien puedan depositar su bienestar. Y sin embargo, el primer filtro que pasan antes de llamarte es tu presencia digital: una web, un perfil en redes, o el famoso "¿qué encuentro si busco tu nombre en Google?".

El problema es que el ecosistema digital actual está saturado de perfiles sin verificación, credenciales ambiguas y especialidades autoproclamadas. Para un psicólogo con formación sólida y experiencia real, eso es injusto. Tu título habilitante, tus másters clínicos, tus supervisiones y tus horas de práctica merecen visibilidad verificada — no quedar enterradas en un PDF que nadie lee.

En este artículo te explicamos paso a paso cómo construir un **CV psicólogo verificado** que te diferencie en consulta privada, en selección para clínicas y en cualquier entorno donde los empleadores y pacientes necesiten certeza sobre tu perfil profesional.

:::info El contexto del mercado laboral en psicología: el 37% de los reclutadores del sector salud ya no considera las credenciales autodeclaradas como indicadores fiables (Willo, 2026). Un perfil profesional psicólogo con verificación documental cambia radicalmente ese escenario. :::

## Qué contiene un CV psicólogo verificado de alto impacto

Un **perfil profesional psicólogo** no es simplemente un listado de títulos. Es una narrativa coherente de tu identidad clínica, respaldada por evidencia. Estos son los elementos que no pueden faltar:

**1. Título oficial y número de colegiación**
El primer dato que busca cualquier empleador o paciente es si estás habilitado para ejercer. Incluye tu titulación universitaria, la especialidad cursada y, si es aplicable, tu número de colegio profesional. En YourCVPassport, estos datos pueden adjuntarse con documentación verificable.

**2. Formación de posgrado y especialización**
Psicología Clínica, Neuropsicología, Psicología Infantil, Terapia de Pareja, EMDR, TCC, ACT... El usuario que te busca quiere saber exactamente en qué eres especialista. Lista cada formación con institución, año y horas certificadas.

**3. Experiencia clínica real**
Años de consulta privada, posiciones en centros de salud mental, colaboraciones con hospitales o clínicas. Describe brevemente el tipo de pacientes atendidos (sin vulnerar privacidad) y los enfoques terapéuticos aplicados.

**4. Supervisiones y formación continua**
En psicología, la formación no termina con el máster. Las supervisiones clínicas y la formación continua son señales de ética profesional. Inclúyelas.

**5. Publicaciones, ponencias o colaboraciones**
Si has participado en congresos, publicado artículos o colaborado con medios sobre salud mental, tu perfil gana autoridad automáticamente.

:::tip Consejo práctico: Utiliza la sección de "logros verificados" de YourCVPassport para adjuntar certificados de tus formaciones específicas. Un reclutador que puede hacer clic y ver el documento original tiene 3 veces más probabilidades de contactarte. :::

## La consulta privada: donde la verificación marca la diferencia

Si ejerces en consulta privada, tu **CV psicólogo verificado** es, en la práctica, tu tarjeta de visita más potente. Las personas que buscan psicólogo hoy hacen lo mismo que al buscar cualquier servicio: comparan, leen reseñas y verifican credenciales.

Un **perfil profesional psicólogo** completo y verificado actúa como un elemento de reducción de la ansiedad para el paciente potencial. Sabe que la persona que va a atenderle tiene la formación que dice tener. Eso reduce la fricción antes de la primera cita y aumenta la tasa de conversión de visitas a tu web.

Considera también que en muchas plataformas de derivación y directorios de psicólogos (Doctoralia, TherapyChat, etc.), los perfiles con mayor completitud y credenciales verificables obtienen mejores posiciones orgánicas y más solicitudes.

## Clínicas y centros de salud mental: lo que buscan en un candidato

Cuando una clínica de salud mental recibe candidaturas para una posición, el proceso de criba inicial es cada vez más rápido. Con el aumento del 57% en CVs generados por IA detectado por reclutadores en 2025 (Resume Now), los responsables de selección han endurecido sus filtros.

Un **perfil profesional psicólogo** en YourCVPassport les ofrece algo que un PDF convencional no puede dar: la posibilidad de verificar cada credencial en tiempo real, sin necesidad de solicitar documentación adicional. Eso acelera el proceso de selección y te pone en ventaja frente a candidatos con perfiles no verificados.

:::warning Evita este error común: incluir el nombre de formaciones o certificaciones sin especificar la institución emisora y el año. Para los reclutadores del sector clínico, una credencial sin origen verificable equivale a ninguna credencial. :::

## Cómo usar YourCVPassport si eres psicólogo

El proceso es más sencillo de lo que parece:

- **Paso 1:** Crea tu cuenta y completa la sección de formación académica con tus titulaciones principales.
- **Paso 2:** Añade tus especializaciones y másters clínicos, adjuntando los certificados en formato PDF o imagen.
- **Paso 3:** Completa la experiencia profesional con fechas verificables (centros, periodos, funciones).
- **Paso 4:** Personaliza tu bio profesional con tu enfoque terapéutico y el tipo de pacientes con quienes trabajas.
- **Paso 5:** Activa el enlace público de tu perfil y úsalo en tu web, en directorios y en tus comunicaciones con pacientes potenciales.

Para una guía general sobre qué es un CV verificado, consulta [¿Qué es un CV verificado y por qué lo necesitas?](/recursos/blog/que-es-cv-verificado). Y si quieres profundizar en el proceso de creación desde cero, lee [Cómo crear un perfil profesional verificado paso a paso](/recursos/blog/crear-perfil-profesional-verificado).

:::example Ejemplo real: Una psicóloga especializada en trauma y EMDR incluyó en su perfil de YourCVPassport su certificación EMDR Europe, su formación en somatic experiencing y tres años de supervisión con un supervisor acreditado. Resultado: tres clínicas de salud mental la contactaron en menos de dos semanas tras actualizar su perfil. :::

## El futuro de la credibilidad en psicología es digital y verificado

La salud mental ha ganado un protagonismo social sin precedentes en los últimos años. Con ese protagonismo llega también una mayor demanda de profesionales — pero también una mayor exigencia de rigor. Los pacientes son más informados. Las clínicas son más selectivas. Las plataformas de derivación favorecen a quienes pueden demostrar lo que afirman.

Construir hoy un **CV psicólogo verificado** no es una opción diferenciadora: está convirtiéndose en el estándar mínimo esperado. Los reclutadores, según The Interview Guys (2026), esperan ya verificación a un clic de distancia. Tu perfil profesional psicólogo en YourCVPassport te permite ofrecerles exactamente eso.

Crea tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu credibilidad a clientes y empleadores desde el primer momento.$$,
$$https://images.unsplash.com/photo-1573497019236-17f8177b81e8?w=1200&q=80&auto=format&fit=crop$$,
$$Consejos de Carrera$$,
false,
'2026-05-13',
$$CV psicólogo verificado: guía completa para profesionales$$,
$$Cómo construir un CV psicólogo verificado que genere confianza en clientes, clínicas y empleadores del sector salud mental. Guía paso a paso.$$,
'es'
);


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$CV verificado para profesionales de terapias holísticas y bienestar$$,
$$cv-verificado-terapias-holisticas$$,
$$Guía para terapeutas holísticos, coaches y profesionales del bienestar: cómo un CV terapeuta holístico verificado resuelve el problema de credibilidad en tu sector.$$,
$$## El desafío real del terapeuta holístico en el mercado actual

Si te dedicas al reiki, al coaching, a la nutrición integrativa, al yoga terapéutico o a cualquier otra disciplina del bienestar y las terapias holísticas, ya sabes a lo que me refiero: tienes formación, tienes experiencia, tienes resultados con clientes — y aun así, el mercado te mira con escepticismo.

El sector del bienestar es uno de los de mayor crecimiento global, pero también uno de los más cuestionados en cuanto a regulación y credibilidad. Eso crea un problema concreto para los profesionales serios: ¿cómo diferenciarte de quienes se autoproclamaron "coach" después de ver un curso de fin de semana? ¿Cómo demuestra un terapeuta holístico con años de formación rigurosa que su **perfil profesional bienestar** es genuino?

La respuesta es la verificación. Un **CV terapeuta holístico** con credenciales documentadas y verificables no solo te diferencia: te convierte en la opción obvia para los clientes que ya están dispuestos a invertir en su bienestar pero necesitan una señal de confianza antes de elegirte.

:::info Dato de contexto: El 41% de los empleadores y plataformas de contratación están alejándose del modelo basado en CVs autodeclarados (Willo, 2026). En el sector holístico, donde la regulación es heterogénea, esta tendencia es aún más marcada. Un perfil verificado es tu ventaja competitiva más directa. :::

## Por qué la credibilidad es el activo más valioso en terapias holísticas

En sectores regulados como la medicina o la psicología, el título oficial actúa de filtro automático. En terapias holísticas, ese filtro no existe de la misma manera — y eso es una oportunidad disfrazada de problema.

La ausencia de regulación uniforme significa que el mercado decide quién es creíble. Y el mercado decide basándose en señales visibles: años de formación, institutos reconocidos, certificaciones internacionales, testimonios verificables, presencia digital coherente. Un **perfil profesional bienestar** que consolida todas estas señales en un solo lugar verificado hace exactamente ese trabajo por ti.

Piensa en tu cliente ideal: alguien con dolor crónico que busca un terapeuta de liberación miofascial, o una persona que quiere un coach de vida certificado para una transición profesional. Antes de contactarte, van a buscar todo lo que puedan encontrar sobre ti. Un **CV terapeuta holístico** verificado en YourCVPassport le da exactamente lo que necesita para decir "sí, quiero trabajar con esta persona".

## Qué debe incluir tu perfil profesional de bienestar

Un **CV terapeuta holístico** completo y verificado no es una lista de cursos. Es una declaración de identidad profesional. Estos son los elementos esenciales:

**Formación certificada por institutos reconocidos**
Incluye el nombre completo del instituto o escuela, el número de horas formativas, el año de finalización y, si existe, la acreditación internacional. Si te has formado en ISEIH, en una escuela de yoga reconocida o en un instituto de coaching certificado por ICF, eso tiene un valor enorme — pero solo si es visible y verificable.

**Especializaciones y modalidades**
Reiki Usui, Hatha Yoga, Nutrición Ayurvédica, Coaching Ontológico, Terapia Gestalt, Mindfulness MBSR... Cada especialización merece su espacio con la institución formadora y la certificación adjunta.

**Experiencia práctica documentada**
Años de sesiones individuales o grupales, talleres impartidos, retiros organizados. En bienestar, la experiencia práctica pesa tanto como la formación teórica.

**Supervisiones y desarrollo profesional continuo**
Los profesionales del bienestar que se forman de manera continua transmiten seriedad y compromiso ético. Inclúyelo.

**Testimonios o resultados (sin comprometer privacidad)**
Si trabajas con clientes individuales, puedes describir tipos de problemáticas abordadas y resultados genéricos. Eso humaniza tu perfil y genera conexión.

:::tip Consejo para coaches y facilitadores: Adjunta tu certificación de la International Coaching Federation (ICF), Association for Coaching o cualquier organismo internacional relevante. Esas acreditaciones funcionan como sellos de calidad reconocibles globalmente y dan un salto de credibilidad inmediato a tu perfil profesional bienestar. :::

## Plataformas y mercados donde el perfil verificado marca la diferencia

El **perfil profesional bienestar** verificado no solo sirve para la búsqueda de empleo convencional. En el ecosistema holístico, los canales son diversos:

- **Plataformas de bienestar corporativo:** Empresas que contratan coaches y terapeutas para programas de empleados exigen verificación documental. Un perfil verificado acelera ese proceso.
- **Marketplaces de terapeutas y coaches:** MindBodyGreen, Urban, Weploy o plataformas locales de bienestar priorizan perfiles completos y verificados.
- **Redes de derivación entre profesionales:** Un médico que quiere derivar un paciente a un terapeuta holístico necesita confiar en la persona a quien lo envía. Tu perfil verificado facilita esa confianza interprofesional.
- **Contratación para centros y spas terapéuticos:** Los centros de bienestar de nivel medio-alto seleccionan a sus terapeutas con criterios cada vez más rigurosos.

:::warning Señal de alerta: Si tu presencia digital consiste únicamente en una cuenta de Instagram con fotos bonitas y frases motivacionales, estás dejando dinero sobre la mesa. El cliente que ya está listo para contratar necesita ver credenciales, no estética. Un CV terapeuta holístico verificado convierte esa predisposición en acción. :::

## Conexión con el sector de la psicología y salud mental integrativa

Muchos profesionales del bienestar trabajan en la intersección con la salud mental: coaches especializados en ansiedad, terapeutas corporales que trabajan con trauma, instructores de meditación que colaboran con psiquiatras. Si ese es tu caso, tu **CV terapeuta holístico** debe reflejar esa dimensión interdisciplinar.

Consulta también nuestra guía [Cómo crear un perfil profesional verificado si eres psicólogo](/recursos/blog/perfil-verificado-psicologo) para entender cómo los perfiles del sector salud mental articulan sus credenciales — muchos elementos son directamente aplicables al ámbito holístico.

Para entender en profundidad qué es un perfil verificado y cómo funciona el sistema, visita [¿Qué es un CV verificado y por qué lo necesitas?](/recursos/blog/que-es-cv-verificado).

:::example Ejemplo de perfil holístico de alto impacto: Una terapeuta de bienestar con formación en nutrición integrativa, yoga terapéutico e instructor de mindfulness MBSR creó su perfil en YourCVPassport adjuntando sus tres certificaciones principales. En su primer mes con el perfil activo, fue seleccionada para un programa de bienestar corporativo en una empresa de 200 empleados. La directora de RRHH confirmó que el perfil verificado fue el factor decisivo. :::

## El momento de actuar es ahora

El mercado del bienestar no va a esperar. La demanda de profesionales holísticos serios es real y creciente, pero la competencia también lo es. La diferencia entre un terapeuta que llena su agenda y otro que depende de recomendaciones ocasionales suele ser una sola cosa: la credibilidad demostrable.

Tu **perfil profesional bienestar** en YourCVPassport es la herramienta que transforma tu formación y experiencia en confianza palpable para quien te encuentra por primera vez.

Crea tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu credibilidad a clientes y empleadores desde el primer momento.$$,
$$https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&q=80&auto=format&fit=crop$$,
$$Consejos de Carrera$$,
false,
'2026-05-15',
$$CV terapeuta holístico verificado: guía para bienestar$$,
$$Cómo construir un CV terapeuta holístico verificado que genere confianza en clientes, plataformas de bienestar y programas corporativos de salud.$$,
'es'
);


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Cómo destacar tu formación en innovación y tecnología en tu CV$$,
$$cv-innovacion-tecnologia$$,
$$Guía para egresados de programas de innovación: cómo traducir tu formación tecnológica CV en un perfil verificado que los empleadores del sector tech y emprendedor entiendan y valoren.$$,
$$## La brecha entre lo que sabes y lo que comunicas

Tienes formación en metodologías ágiles, has liderado proyectos de innovación, dominas herramientas de prototipado digital y quizás incluso has lanzado tu propio proyecto emprendedor. Pero cuando mandas tu CV a una empresa de tecnología o a una aceleradora, la respuesta tarda — o no llega.

El problema rara vez es la formación. El problema es la comunicación de esa formación. Un **CV innovación tecnología** efectivo no es una lista de asignaturas cursadas: es una demostración de capacidades aplicadas, proyectos ejecutados y credenciales verificables en un sector donde la credibilidad se construye a base de resultados demostrables.

En este artículo te mostramos cómo transformar tu **formación tecnológica CV** en un perfil profesional verificado que posicione tu candidatura exactamente donde quieres estar: en el escritorio del responsable de selección que decide quién entra en su equipo de innovación.

:::info El entorno actual es más exigente que nunca: el 57% de los reclutadores detectan más CVs generados con inteligencia artificial que el año anterior (Resume Now, 2025), y el 90% reportan un aumento de solicitudes spam. En ese contexto, un CV innovación tecnología verificado y personalizado no solo destaca — es prácticamente la única manera de ser tomado en serio. :::

## Qué hace diferente un perfil de innovación y tecnología

Los perfiles de innovación tienen una característica que los hace únicos: su valor no está solo en los títulos obtenidos, sino en la capacidad de transformar conocimiento en soluciones reales. Eso es difícil de transmitir en un CV tradicional — pero es exactamente lo que YourCVPassport está diseñado para mostrar.

Un **CV innovación tecnología** de alto impacto combina:

**Formación verificada con enfoque aplicado**
No basta con decir que cursaste un programa de innovación empresarial o un bootcamp de producto digital. Necesitas especificar la institución, el enfoque metodológico (Design Thinking, Lean Startup, Agile, OKRs) y, si es posible, adjuntar el certificado verificable. La **formación tecnológica CV** gana autoridad cuando el reclutador puede verificarla en segundos.

**Proyectos como evidencia de capacidad**
Un proyecto de innovación bien documentado en tu perfil pesa más que cinco cursos listados. Describe el problema que abordaste, la metodología que aplicaste, el equipo con el que trabajaste y el resultado obtenido (métricas, prototipo lanzado, MVP validado, inversión obtenida).

**Herramientas y tecnologías dominadas**
Figma, Miro, Notion, Jira, Python, No-code tools, Growth Hacking, Data Analytics... Incluye el stack con el que trabajas realmente, con indicación del nivel de dominio.

**Reconocimientos y hitos emprendedores**
¿Tu startup fue seleccionada para una aceleradora? ¿Ganaste un hackathon? ¿Tu proyecto fue publicado en medios especializados? Esos hitos son credenciales tan válidas como un máster oficial — y en el ecosistema innovador, a veces más valoradas.

:::tip Consejo para egresados de programas de innovación: Solicita a tu institución formadora un certificado detallado que especifique las competencias adquiridas, no solo el título del programa. Ese tipo de documento, adjunto a tu perfil verificado, comunica mucho más que un genérico "Máster en Innovación". :::

## El sector tech exige verificación — y la espera en menos de un clic

Los equipos de talento en empresas tecnológicas son especialmente hábiles para detectar candidaturas infladas. Han visto demasiados CVs con "experiencia en inteligencia artificial" de quien hizo un curso de tres horas, o "experto en blockchain" sin ningún proyecto real que lo respalde.

Los reclutadores del sector innovación esperan, como señala The Interview Guys (2026), verificación a un clic de distancia. No quieren pedir documentación complementaria, no quieren esperar respuestas por correo. Quieren hacer clic y ver.

Un **CV innovación tecnología** en YourCVPassport les ofrece exactamente eso: un perfil donde cada credencial, cada formación y cada proyecto tiene respaldo documental visible y accesible de forma inmediata.

## Cómo estructurar tu perfil si vienes de un programa de innovación o emprendimiento

Si has completado un programa especializado en innovación, tecnología o emprendimiento, esta es la estructura recomendada para tu perfil en YourCVPassport:

**1. Bio profesional enfocada en impacto**
No digas "soy un apasionado de la innovación". Di qué tipo de problemas resuelves, en qué industrias tienes experiencia y cuál es tu propuesta de valor diferencial como profesional.

**2. Formación con contexto**
Programa + institución + año + metodologías clave aprendidas + certificado adjunto. Tu **formación tecnológica CV** necesita contexto para tener peso.

**3. Proyectos con resultados**
Mínimo tres proyectos documentados: nombre del proyecto, problema abordado, tu rol, tecnologías/metodologías usadas y resultado medible.

**4. Stack tecnológico**
Lista clara de herramientas dominadas, organizada por categorías: diseño, desarrollo, gestión, datos, marketing digital.

**5. Reconocimientos y participación en ecosistema**
Aceleradoras, hackathons, concursos de innovación, ponencias en eventos tech, artículos publicados.

:::example Caso práctico: Un graduado de un programa de innovación empresarial completó su perfil en YourCVPassport incluyendo su proyecto de final de programa (una app de economía circular con 500 usuarios beta), su certificación en Design Thinking adjunta y su participación en un hackathon donde quedó finalista. En tres semanas recibió dos entrevistas de startups en fase de crecimiento que buscaban perfiles de producto. :::

## La ventaja del perfil verificado en el ecosistema emprendedor

En el mundo del emprendimiento y la innovación, las redes de confianza lo son todo. Un inversor que considera hacer una apuesta en tu proyecto, un acelerador que evalúa tu candidatura o una empresa que busca un intrapreneur para su laboratorio de innovación necesitan confiar en que eres quien dices ser y que tienes las capacidades que afirmas.

El 37% de los evaluadores de perfiles ya no considera las credenciales autodeclaradas como indicadores fiables (Willo, 2026). En el ecosistema innovador, donde los títulos formales a veces son secundarios respecto a la trayectoria práctica, la verificación de proyectos y experiencias reales se convierte en el diferenciador clave.

Para entender mejor el marco general de la verificación profesional, consulta [¿Qué es un CV verificado y por qué lo necesitas?](/recursos/blog/que-es-cv-verificado). Y para el proceso completo de creación de tu perfil, revisa [Cómo crear un perfil profesional verificado paso a paso](/recursos/blog/crear-perfil-profesional-verificado).

:::warning Evita la trampa del perfil genérico: un CV innovación tecnología que podría pertenecer a cualquier persona no comunica nada. La especificidad es tu mejor aliada: industrias concretas, proyectos reales con números, herramientas específicas que dominas. Cuanto más concreto, más creíble y más atractivo para los reclutadores del sector. :::

## Tu momento de posicionarte es ahora

El ecosistema de innovación y tecnología nunca ha tenido tanta demanda de profesionales bien preparados. Al mismo tiempo, el ruido es enorme. La **formación tecnológica CV** que construiste con esfuerzo merece una presentación a la altura: verificada, específica y diseñada para generar impacto desde el primer segundo.

Crea tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu credibilidad a clientes y empleadores desde el primer momento.$$,
$$https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&q=80&auto=format&fit=crop$$,
$$Consejos de Carrera$$,
false,
'2026-05-18',
$$CV innovación tecnología verificado: guía práctica$$,
$$Cómo transformar tu formación tecnológica CV en un perfil verificado que los empleadores del sector tech e innovación valoran y en el que confían.$$,
'es'
);


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$CV para educadores y formadores online: guía de verificación profesional$$,
$$cv-educadores-formadores-online$$,
$$Guía completa para educadores online y formadores: cómo construir un CV educador online verificado que genere confianza en alumnos, plataformas educativas y empresas que contratan formación.$$,
$$## El mercado de la educación online es enorme — y brutalmente competitivo

Si eres educador online, formador corporativo o creador de cursos, ya lo sabes: el mercado nunca ha sido tan grande ni tan difícil de conquistar. Hay miles de instructores en Udemy, decenas de miles de perfiles en LinkedIn que se presentan como "formadores", y una cantidad creciente de "expertos" que lanzan cursos sin ninguna credencial real que los respalde.

En ese entorno, el estudiante o la empresa que quiere contratar formación está saturado de opciones y necesita señales claras para elegir. ¿Cuál es la señal más potente que puedes darles? Un **CV educador online** verificado que demuestre, con documentación real, que tienes la experiencia pedagógica y la especialización temática que afirmas tener.

Este artículo es tu guía para construir ese **perfil verificado profesor** que te posicione como la opción obvia en un mercado donde la confianza es el activo escaso.

:::info El problema de la saturación es real: el 90% de los reclutadores y plataformas educativas reportan un aumento de solicitudes spam o perfiles inflados (Resume Now, 2025). Para alumnos y empresas que buscan formación de calidad, un CV educador online verificado es la señal de diferenciación más directa disponible. :::

## Por qué los formadores necesitan verificación más que nadie

Hay una paradoja en el sector educativo: se supone que los formadores son los más preparados para demostrar conocimiento — pero raramente tienen un sistema para demostrar sus propias credenciales de manera eficiente.

Un docente universitario tiene su posición institucional como aval. Un formador online, sin embargo, opera en un espacio donde cualquiera puede declararse "experto". El resultado es que los buenos formadores compiten en igualdad aparente con quienes no tienen la mitad de su preparación.

Un **perfil verificado profesor** resuelve esa asimetría. Cuando un alumno potencial — o la directora de formación de una empresa — ve tu perfil en YourCVPassport y puede hacer clic para verificar tu titulación pedagógica, tu certificación metodológica o tu experiencia docente documentada, el proceso de decisión cambia radicalmente.

El 37% de los responsables de formación ya no confía en credenciales autodeclaradas (Willo, 2026). Tu **CV educador online** verificado los convierte inmediatamente en aliados en lugar de escépticos.

## Los elementos clave de un perfil educativo verificado

Un **CV educador online** que genera confianza y conversiones contiene estos elementos bien trabajados:

**Formación pedagógica y metodológica**
No basta con saber mucho de tu materia. El cliente quiere saber también cómo enseñas. Incluye tu formación en pedagogía, didáctica, diseño instruccional, facilitación de grupos o metodologías online específicas (Bloom's Taxonomy, ADDIE, Flipped Classroom, etc.).

**Especialización temática verificada**
Tu área de conocimiento principal necesita credenciales. Si enseñas marketing digital, liderazgo, programación, bienestar laboral o cualquier otra materia, muestra la formación que respalda esa especialización con institución y año verificables.

**Historial docente real**
Años de docencia, número de alumnos formados (aproximado), plataformas donde tienes cursos activos, empresas a las que has dado formación. Cuantifica siempre que puedas.

**Metodología de enseñanza**
Una sección breve pero poderosa: ¿cómo aprendes con tus alumnos? ¿Qué tipo de resultados persigues? Eso humaniza tu **perfil verificado profesor** y conecta con quienes buscan un estilo formativo específico.

**Cursos, programas y contenidos publicados**
Si tienes cursos en Udemy, Teachable, Domestika o tu propia plataforma, inclúyelos con métricas: número de alumnos, valoración media, temática. Son prueba social verificable.

:::tip Consejo para creadores de cursos: Adjunta el certificado de tu curso más importante como formador — el que emitió la plataforma o institución que acreditó tu capacidad docente. Ese documento diferencia tu perfil de manera instantánea. Si no tienes uno todavía, considera obtener una certificación en diseño instruccional o facilitación online: la inversión se recupera en credibilidad. :::

## Formación corporativa: un mercado que exige máxima verificación

Si te orientas a la formación empresarial — impartir talleres, programas de liderazgo, formación en habilidades digitales, compliance o soft skills para equipos — el nivel de exigencia es aún mayor.

Las empresas que contratan formadores para sus empleados están invirtiendo tiempo y dinero de sus equipos. El responsable de RRHH o Learning & Development que te contrata necesita poder justificar esa decisión ante su dirección. Un **CV educador online** verificado en YourCVPassport le da exactamente esa cobertura: puede mostrar el perfil verificado del formador seleccionado con un solo enlace.

Los reclutadores corporativos, según The Interview Guys (2026), esperan verificación a un clic de distancia. Tu perfil tiene que estar listo para ese momento.

:::example Ejemplo de impacto: Un formador especializado en liderazgo consciente y comunicación no violenta para equipos directivos construyó su perfil en YourCVPassport con su certificación ICF, su máster en coaching organizacional y referencias verificables de tres empresas Fortune 500 a las que había impartido formación. En su primer mes, dos empresas medianas le contactaron directamente a través de su enlace de perfil sin necesidad de intermediarios. :::

## Plataformas educativas y marketplaces: cómo tu perfil impulsa tu visibilidad

El **perfil verificado profesor** no solo funciona en la búsqueda directa. En las plataformas educativas más competitivas, la calidad del perfil del instructor influye directamente en el posicionamiento algorítmico. Plataformas como Udemy, Coursera o plataformas de formación corporativa otorgan mayor visibilidad a instructores con perfiles completos y credenciales verificadas.

Incluir el enlace a tu perfil de YourCVPassport en:
- Tu bio de plataformas educativas (Udemy, Teachable, Domestika)
- Tu firma de correo electrónico al contactar a empresas
- Tu perfil de LinkedIn
- Tu web personal o landing page de servicios formativos

...multiplica los puntos de contacto donde un cliente potencial puede verificar tus credenciales antes de decidirse.

Para profundizar en la relación entre bienestar y educación — especialmente si impartes formación en áreas holísticas o de desarrollo personal — consulta [CV verificado para profesionales de terapias holísticas y bienestar](/recursos/blog/cv-verificado-terapias-holisticas). Y para el proceso completo de creación de tu perfil verificado desde cero, visita [Cómo crear un perfil profesional verificado paso a paso](/recursos/blog/crear-perfil-profesional-verificado).

:::warning Error frecuente en formadores online: publicar un perfil con decenas de "cursos realizados" sin distinguir entre formación recibida y formación impartida. Para un responsable de formación corporativa, la diferencia es fundamental. Sé siempre explícito en tu CV educador online: separa claramente tu historial como alumno de tu historial como formador. :::

## La verificación como ventaja de largo plazo

El mercado de la educación online va a seguir creciendo. Con él, la competencia también. Pero hay algo que los formadores que construyen su autoridad de manera verificada tienen en común: cada año que pasa, su perfil se vuelve más robusto, más creíble y más difícil de igualar para quien empieza desde cero con credenciales vacías.

Tu **CV educador online** verificado en YourCVPassport es una inversión en tu reputación profesional que te acompaña a lo largo de toda tu carrera. Cada certificación añadida, cada experiencia documentada y cada logro verificado se convierte en una capa adicional de autoridad que trabaja por ti incluso cuando no estás.

La credibilidad no se declara: se demuestra. Y tu **perfil verificado profesor** en YourCVPassport es la forma más directa, más eficiente y más profesional de hacerlo.

Crea tu perfil profesional verificado en [YourCVPassport](https://yourcvpassport.com) y demuestra tu credibilidad a clientes y empleadores desde el primer momento.$$,
$$https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80&auto=format&fit=crop$$,
$$Consejos de Carrera$$,
false,
'2026-05-20',
$$CV educador online verificado: guía para formadores$$,
$$Cómo construir un CV educador online verificado que genere confianza en alumnos, plataformas educativas y empresas que contratan formación corporativa.$$,
'es'
);



-- ------------------------------------------------------------
-- BLOQUE G: Comparativas EN (Articles #29-30)
-- ------------------------------------------------------------


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$Verified CV vs LinkedIn Profile: Which One Do Employers Trust More?$$,
$$verified-cv-vs-linkedin$$,
$$Verified CV vs LinkedIn profile — which do employers trust more in 2026? We break down the key differences and what hiring managers actually check.$$,
$$In 2026, professionals manage their career identity across at least two major channels: a CV (résumé) and a LinkedIn profile. But as hiring practices evolve and fraud becomes a growing concern, one question increasingly shapes the first impression you make on a recruiter: should you be presenting a **verified CV vs LinkedIn** profile — and which one do they actually trust more?

The answer is more nuanced than most career guides admit. Both formats have strengths. Both have vulnerabilities. And increasingly, the candidate who wins is the one who understands how to use them together — or replaces both with something more powerful.

## What Is a Verified CV?

A verified CV is a professional profile in which key credentials — work history, qualifications, certifications, skills — have been confirmed by a third party. Rather than relying solely on self-reported information, a verified CV carries signals of authenticity that a recruiter or hiring manager can trust without needing to do their own legwork.

:::info A verified CV is not just a digital résumé — it is a credentialed document where the accuracy of your professional claims has been confirmed by a platform, institution, or employer. YourCVPassport profiles are verified in real time, making them significantly more trustworthy than a standard CV attachment. :::

Platforms like [YourCVPassport](https://yourcvpassport.com) have pioneered this model, giving professionals a shareable, living profile where each milestone can be stamped and validated. This sits at the heart of the **verified CV vs LinkedIn** debate — because LinkedIn offers no equivalent verification layer for the vast majority of user-submitted claims.

## What LinkedIn Actually Verifies (And What It Doesn't)

LinkedIn is the world's largest professional network, and there is no doubt that recruiters use it daily. But it is important to be precise about what LinkedIn does and does not verify.

LinkedIn currently offers:
- **Identity verification** (via Persona, in select markets) — confirms you are who you say you are
- **Workplace verification** (via Microsoft Azure AD) — confirms current employment at specific companies
- **LinkedIn Learning certificates** — internally issued badges for completed courses

What LinkedIn does *not* verify:
- Past job titles or tenure claimed on your profile
- Degrees or academic credentials listed in the Education section
- Skills endorsed by connections (endorsements carry no weight with serious recruiters)
- Certifications from third-party bodies (unless the issuer uses LinkedIn's badge API)

:::warning A 2025 Resume Now study found that 57% of recruiters are now noticing more AI-generated CVs and profiles — many of them inflated or fabricated. LinkedIn's self-reported model is precisely the vulnerability that bad actors exploit. :::

This is the core tension in the **verified CV vs LinkedIn profile** question: LinkedIn is *visible*, but it is not inherently *trustworthy*.

## What Recruiters Actually Trust in 2026

Hiring managers and talent acquisition professionals have grown increasingly sophisticated. With 90% of recruiters reporting a surge in spam and low-effort applications (Resume Now, 2025), the premium on verifiable credentials has never been higher.

According to The Interview Guys (2026), *"recruiters now expect verification to be just one click away."* That expectation is reshaping what a credible professional presence looks like.

Here is what senior recruiters consistently prioritise when evaluating a **verified CV vs LinkedIn** comparison:

- **Consistency** — Does the candidate's CV match their LinkedIn? Discrepancies are an immediate red flag.
- **Third-party validation** — Have any credentials been independently confirmed, or is everything self-reported?
- **Recency** — Is the profile actively maintained, or was it last updated in 2019?
- **Specificity** — Vague claims ("led cross-functional teams") vs. measurable outcomes ("grew team from 4 to 18, delivered 23% revenue uplift")

:::tip If your verified CV and your LinkedIn profile tell exactly the same story — with the same dates, the same titles, and the same accomplishments — you immediately separate yourself from the 40%+ of candidates whose profiles show inconsistencies. :::

## The Rise of Verified Professional Profiles as a Third Path

The **verified CV vs LinkedIn** framing is increasingly outdated. The most forward-thinking professionals are not choosing between the two — they are adopting a third format entirely: the **verified professional profile**.

A verified professional profile combines:
1. The narrative depth of a CV (summary, full work history, education, skills)
2. The discoverability of LinkedIn (searchable, shareable link)
3. The credibility of verification (third-party stamps, credential confirmation)

This is precisely what [YourCVPassport](https://yourcvpassport.com) delivers. Rather than a static PDF that sits in a recruiter's inbox or a self-reported LinkedIn that anyone can inflate, a YourCVPassport profile is a living, verified record that professionals share with a single link.

To understand the foundations of this model in depth, read our article on [what a verified CV actually is](/resources/blog/what-is-verified-cv) and why it matters for modern hiring.

## Key Differences: Verified CV vs LinkedIn Profile

| Dimension | Verified CV (YourCVPassport) | LinkedIn Profile |
|---|---|---|
| Credential verification | Yes — third-party stamped | Partial (identity/workplace only) |
| Shareable link | Yes | Yes |
| Fraud resistance | High | Low–Medium |
| Recruiter trust signal | Strong | Moderate |
| Control over narrative | Full | Full |
| SEO / discoverability | Platform-specific | High (Google-indexed) |
| AI inflation risk | Mitigated by verification | High |
| Cost | Free–Premium tiers | Free–Premium tiers |

## What This Means for Your Job Search Strategy

The practical answer to "verified CV vs LinkedIn — which should I use?" is: use both, but understand their roles.

- **LinkedIn** is your visibility layer. It is where you are found, where you network, and where your professional narrative lives in a social context.
- **Your verified CV / YourCVPassport profile** is your credibility layer. It is what you share when you apply, what you link to in your email signature, and what you present in interviews as a badge of professional integrity.

:::example A senior data analyst applying for roles at FAANG-tier companies could list their credentials on LinkedIn for discoverability — but include a YourCVPassport link in every application, signalling that their claims can be verified instantly. That one extra step communicates trustworthiness before a recruiter even opens the conversation. :::

As we explore in our article on [verified professional profiles as a new standard](/resources/blog/verified-professional-profiles-standard), the trajectory is clear: verification is no longer a luxury feature — it is becoming the baseline expectation for serious candidates.

## The Fraud Problem Is Real

It is worth dwelling on why this debate matters beyond mere personal branding. Credential fraud is a genuine, growing problem.

- 37% of employers say credentials submitted by candidates are no longer reliably trustworthy (Willo, 2026)
- 41% of employers are actively moving away from CV-first hiring processes (Willo, 2026)
- AI-generated CVs have flooded application pipelines, with 57% of recruiters now identifying them regularly (Resume Now, 2025)

The result? Recruiters are more sceptical, more thorough, and more likely to discard unverified applications quickly. In this environment, the **verified CV vs LinkedIn** choice is not academic — it directly affects whether your application clears the initial filter.

## Conclusion: Trust Is the New Currency

In 2026, the most important question is not whether your CV looks good — it is whether it can be trusted. LinkedIn gives you reach. A verified CV gives you credibility. The professionals who combine both, and who anchor their identity in a verified, shareable profile, are the ones who consistently rise above the noise.

Stop asking whether a **verified CV vs LinkedIn profile** is "better." Start asking: have I given recruiters every reason to trust me before we even speak?

Build your verified, fraud-proof professional identity at [YourCVPassport](https://yourcvpassport.com) — trusted by professionals worldwide.$$,
$$https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80&auto=format&fit=crop$$,
$$Verification$$,
false,
'2026-05-22',
$$Verified CV vs LinkedIn: Which Do Employers Trust More?$$,
$$Verified CV vs LinkedIn profile — which do recruiters trust more in 2026? We break down what's verified, what's not, and how to win the trust battle.$$,
'en'
);

-- Article 30


INSERT INTO blog_posts (title, slug, summary, content, image_url, category, is_featured, published_at, meta_title, meta_description, lang) VALUES (
$$The 2026 Guide to Building a Fraud-Proof Professional Identity Online$$,
$$fraud-proof-professional-identity-2026$$,
$$Your complete 2026 guide to building a fraud-proof professional identity online — covering verification, AI, digital credentials, and blockchain technology.$$,
$$The way professionals present their identity online is undergoing its most significant transformation in a decade. The forces driving this change are converging simultaneously: artificial intelligence is flooding hiring pipelines with synthetic, inflated, and outright fraudulent content; employers are losing confidence in traditional credentials; and a new generation of verification technologies — from blockchain to real-time credential APIs — is offering a credible alternative. This guide is your comprehensive roadmap to building a **professional identity online** that is not just impressive, but **fraud-proof**.

## Why Your Professional Identity Online Is Under Threat

Before we discuss solutions, it is worth understanding the scale of the problem. The data from 2025–2026 is striking:

- **57% of recruiters** are now noticing more AI-generated CVs in their pipelines (Resume Now, 2025)
- **90% of recruiters** report a significant increase in spam and low-effort applications (Resume Now, 2025)
- **37% of employers** say submitted credentials are no longer reliably trustworthy (Willo, 2026)
- **41% of employers** are actively moving away from CV-first hiring processes entirely (Willo, 2026)

The implication is clear: the traditional model of professional identity — a PDF CV emailed to an employer, supplemented by a LinkedIn profile and a cover letter — is cracking under the weight of AI-generated content and systemic credential fraud. A **fraud-proof CV** is no longer a nice-to-have feature; it is a competitive necessity.

:::warning If 37% of employers already doubt the reliability of credentials they receive, and 57% are encountering AI-generated CVs regularly, the burden of proof has shifted. It is no longer enough to claim your qualifications — you need to be able to prove them instantly, credibly, and at scale. :::

## The Four Pillars of a Fraud-Proof Professional Identity

Building a robust, trustworthy **professional identity online** in 2026 requires attention to four interconnected pillars:

1. **Verified credentials** — your qualifications, backed by evidence
2. **Consistent narrative** — the same story across every platform
3. **Digital provenance** — traceable, tamper-evident records
4. **Ongoing reputation signals** — real-world endorsements and activity

Let us examine each in depth.

---

## Pillar 1: Verified Credentials

A credential is only as valuable as the mechanism that confirms it. In 2026, the baseline expectation — as The Interview Guys have noted — is that *"recruiters expect verification to be just one click away."* That means your credentials need to be:

- **Institutionally confirmed** — linked back to the issuing body
- **Timestamped** — showing when the credential was earned
- **Shareable** — available via a direct link, not buried in a PDF attachment
- **Revocable** — in the event of fraud, the issuer should be able to invalidate the credential

Platforms like [YourCVPassport](https://yourcvpassport.com) have built this infrastructure specifically for professionals. Rather than attaching a PDF certificate that can be fabricated in minutes, your YourCVPassport profile becomes a living, verified record. Each credential is stamped and confirmed, making your **fraud-proof CV** a reality rather than an aspiration.

For a foundational understanding of what verified credentials look like in practice, see our article on [what a verified CV actually means](/resources/blog/what-is-verified-cv).

:::tip Start by auditing your current credentials. Which ones can you point to a live, third-party-verified record? Which ones exist only as a line item on a PDF? The gap between those two lists is your verification roadmap. :::

---

## Pillar 2: Consistent Narrative

Fraud-proofing your **professional identity online** is as much about consistency as it is about technology. Inconsistencies between your CV, LinkedIn, portfolio website, and other profiles are one of the first things a diligent recruiter will flag.

A consistent professional narrative means:
- **Identical dates** for employment periods and qualifications across all platforms
- **Consistent job titles** — if your contract said "Associate Product Manager" but your LinkedIn says "Product Manager," that is a discrepancy
- **Aligned skill claims** — skills you list on your CV should be reflected in your LinkedIn endorsements, portfolio work, and certifications
- **Coherent career trajectory** — the story of your professional growth should make intuitive sense whether viewed on a CV, a LinkedIn profile, or a verification platform

:::info Research consistently shows that cross-referencing a candidate's CV against their LinkedIn is one of the first steps recruiters take. In an era where AI can generate a plausible-sounding but entirely fictitious career history, manual consistency is a powerful authenticity signal. :::

This is also why a centralised verified profile — one source of truth — is gaining traction over maintaining multiple, separately-managed presences.

---

## Pillar 3: Digital Provenance and Blockchain Credentials

Perhaps the most technologically significant shift in professional identity is the emergence of blockchain-based credentials. As Resume Professional Writers noted in their 2026 analysis, blockchain credentials are actively replacing traditional attachment-based systems for forward-thinking institutions and employers.

### How Blockchain Credentials Work

Blockchain credential systems work by recording the issuance of a credential on a distributed ledger — a permanent, tamper-evident record that anyone with the hash or verification link can independently confirm. The credential holder does not need to rely on the issuing institution being reachable or responsive; the blockchain record is self-verifying.

Key advantages for building a **fraud-proof professional identity online**:

- **Immutability** — once recorded, a credential cannot be altered retroactively
- **Decentralisation** — verification does not depend on a single institution's server being online
- **Portability** — credential holders control their own records and share them selectively
- **Instant verification** — a recruiter can verify a credential in seconds without calling anyone

:::example A university in 2026 issues degrees as blockchain-verified digital credentials. A graduate applying for a role shares their degree link rather than attaching a PDF. The recruiter clicks the link, sees the blockchain record, and the degree is confirmed in under 10 seconds — with zero possibility of forgery. :::

To explore how blockchain verification is reshaping hiring specifically, read our deep dive on [blockchain résumé verification](/resources/blog/blockchain-resume-verification).

### Open Badges and W3C Verifiable Credentials

Beyond blockchain, two open standards are becoming increasingly relevant:

- **Open Badges (IMS Global)** — a JSON-LD format for digital credentials that includes metadata about the issuer, earner, and criteria. Issued by thousands of educational institutions and professional bodies worldwide.
- **W3C Verifiable Credentials** — an emerging W3C standard for cryptographically signed digital credentials that can be stored in a digital wallet and presented to any verifying party

Both standards point in the same direction: professional credentials moving from static, easily-forged documents to dynamic, cryptographically-secured digital records.

---

## Pillar 4: Ongoing Reputation Signals

A **fraud-proof CV** is not a static document you create once and forget. In 2026, the most credible professional identities are *living* records, continuously updated with new signals of real-world activity and reputation.

These signals include:

**Professional activity:**
- Contributions to industry publications or forums
- Open-source contributions (GitHub, GitLab)
- Conference presentations or speaking engagements
- Published research, articles, or case studies

**Peer endorsements:**
- Recommendations from verifiable colleagues (not anonymous)
- Skill validations tied to specific projects
- Client testimonials linked to real engagements

**Institutional stamps:**
- Completion badges from accredited programmes
- Employer-issued confirmation of roles and tenure
- Professional body membership verifications

:::info The distinction between a passive profile and an active one matters enormously. A profile last updated in 2023 sends a different signal than one that received a new credential stamp last month. Platforms like YourCVPassport allow you to accumulate these stamps over time, building a compounding credibility record. :::

---

## The AI Threat: Understanding What You Are Up Against

No guide to **professional identity online** in 2026 would be complete without a serious look at the AI threat. Generative AI has fundamentally changed the cost structure of credential fraud.

Previously, fabricating a plausible CV required effort: inventing convincing job descriptions, constructing coherent timelines, creating fake reference contacts. Today, a sophisticated AI tool can produce a fully fabricated, deeply plausible CV for any role in minutes — complete with tailored skills, achievements, and experience levels.

This has created an arms race:

- **Fraudsters** use AI to generate and customise fake CVs at scale
- **Applicant tracking systems** are adding AI detection layers
- **Recruiters** are developing pattern recognition for AI-generated content
- **Verification platforms** are building authentication layers that AI cannot replicate

The verification layer is the key differentiator. As our article on [AI revolutionising profile verification](/resources/blog/ai-revolutionizing-profile-verification) explores, AI is simultaneously the threat *and* part of the solution — when used to power intelligent verification systems rather than to generate fraudulent content.

### What AI Cannot Fake (Yet)

While AI can generate convincing text and fabricate credentials, there are several layers of authentic professional identity that remain difficult to spoof at scale:

- **Timestamped institutional records** — a university or employer with a live API confirming your credential
- **Cryptographically signed digital credentials** — blockchain records that cannot be retroactively altered
- **Consistent cross-platform presence** — a decade of activity across GitHub, LinkedIn, industry forums, and publications
- **Video verification** — live or recorded identity confirmation tied to the credential

Building your **fraud-proof professional identity online** means layering as many of these elements as possible.

---

## Building Your Fraud-Proof Identity: A Step-by-Step Framework

Here is a practical framework for building a robust, verified **professional identity online** in 2026:

### Step 1: Audit Your Current Credentials
- List every credential you currently claim (degrees, certifications, past roles)
- For each one, identify whether a live, third-party-verifiable record exists
- Flag any gaps — credentials you have listed but cannot verify with a link or record

### Step 2: Create a Verified Profile Hub
- Choose a platform (such as YourCVPassport) as your single source of verified professional truth
- Import or add your credentials, linking each to a verifiable source where possible
- Enable real-time sharing so recruiters can access your verified profile via a single URL

### Step 3: Align All Platforms to Your Verified Hub
- Update your LinkedIn to match your verified profile exactly
- Include your YourCVPassport profile link on LinkedIn, your CV, email signature, and portfolio
- Audit for any discrepancies between platforms and resolve them

### Step 4: Pursue Blockchain-Verified Credentials
- When choosing between two equivalent certifications, prioritise the one that issues a blockchain-verified digital credential
- Contact past institutions to check whether they offer retroactive digital credential issuance
- Look for programmes using Open Badges or W3C Verifiable Credentials standards

### Step 5: Build Ongoing Reputation Signals
- Contribute publicly to your field — writing, speaking, open-source work
- Request specific, verifiable recommendations from colleagues and clients
- Collect institutional stamps for completed training, roles, and achievements

### Step 6: Monitor and Maintain
- Review your verified profile monthly
- Add new credentials and achievements promptly
- Check for and resolve any new cross-platform inconsistencies

:::tip Set a monthly 15-minute calendar reminder: "Check and update verified profile." The professionals who stay ahead in 2026 treat their professional identity as an ongoing asset, not a one-time document. :::

---

## The Future of Professional Identity: Where This Is Heading

The trajectory of **professional identity online** is clear. Within the next three to five years, expect to see:

- **Universal digital credential wallets** — professionals carrying all their verified credentials in a single, portable digital wallet (already piloting in the EU with the EUDI Wallet)
- **Employer verification APIs** — real-time connections between hiring platforms and credential issuers, eliminating manual verification entirely
- **AI-powered fraud detection** — ATS systems that flag unverified claims before they reach a human recruiter
- **Reputation graphs** — interconnected professional identity records that map relationships, endorsements, and contributions across the professional web

The professionals who are building their **fraud-proof CV** and verified identity infrastructure today are not just protecting themselves from fraud accusations — they are positioning themselves ahead of the structural shift in how professional credibility is established and communicated.

---

## Conclusion: Your Identity Is Your Most Valuable Professional Asset

In a world where AI can fabricate a career history, where 37% of employers already doubt credential reliability, and where 41% are actively rethinking CV-first hiring, the professionals who win are not those with the most impressive CVs — they are those with the most *trustworthy* professional identities.

Building a **fraud-proof professional identity online** is not a one-day project. It is a commitment to a different approach: verified over asserted, consistent over embellished, living over static.

The tools exist. The platforms are ready. The only question is whether you will take the step before your competitors do.

Build your verified, fraud-proof professional identity at [YourCVPassport](https://yourcvpassport.com) — trusted by professionals worldwide.$$,
$$https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&q=80&auto=format&fit=crop$$,
$$Verification$$,
false,
'2026-05-25',
$$The 2026 Guide to a Fraud-Proof Professional Identity$$,
$$Build a fraud-proof professional identity online in 2026. Your complete guide to verified credentials, blockchain, AI threats, and digital provenance.$$,
'en'
);



-- ============================================================
-- End of migration: 30 articles seeded
-- To verify: SELECT COUNT(*), lang FROM blog_posts GROUP BY lang;
-- Expected: 18 rows with lang='en', 12 rows with lang='es'
-- ============================================================


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 10: 20260224_more_groups_content.sql
-- Add 3 new groups with posts, members, and public feed promotions
-- ═══════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 11: 20260225_fix_novedades_channel.sql
-- Reassign Novedades channel to admin, add 5 varied-type posts
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================================
-- Fix: Canal "Novedades YourCVPassport"
-- 1. Reasigna owner y posts al usuario admin (equipo de la app)
-- 2. Añade variedad de tipos: MILESTONE, EVENT, ACHIEVEMENT, TEXT, POLL
-- Safe to re-run: usa DELETE/INSERT con seed_novedades_v2 tag
-- ============================================================

DO $$
DECLARE
  v_admin     UUID;
  v_ch_id     UUID;

  -- new post IDs
  np1 UUID; np2 UUID; np3 UUID; np4 UUID; np5 UUID;
BEGIN

  -- 1. Obtener el usuario admin (equipo de la app)
  SELECT id INTO v_admin FROM profiles WHERE role = 'admin' ORDER BY created_at LIMIT 1;
  IF v_admin IS NULL THEN
    RAISE NOTICE 'No admin user found — aborting Novedades fix';
    RETURN;
  END IF;

  -- 2. Obtener el canal de Novedades
  SELECT id INTO v_ch_id
    FROM public.groups
   WHERE name = 'Novedades YourCVPassport'
     AND metadata->>'type' = 'channel'
   LIMIT 1;

  IF v_ch_id IS NULL THEN
    RAISE NOTICE 'Canal Novedades YourCVPassport not found';
    RETURN;
  END IF;

  -- 3. Reasignar owner del canal al admin
  UPDATE public.groups
     SET owner_id = v_admin
   WHERE id = v_ch_id;

  -- 4. Reasignar author_id de todos los posts existentes del canal al admin
  UPDATE public.feed_posts
     SET author_id = v_admin
   WHERE group_id = v_ch_id;

  -- 5. Limpiar posts extra del seed anterior (si existen)
  DELETE FROM public.feed_posts
   WHERE metadata->>'seed_novedades_v2' = 'true';

  -- ══════════════════════════════════════════════════════
  -- 6. Nuevos posts con VARIEDAD de tipos
  -- ══════════════════════════════════════════════════════

  -- np1 [ES] MILESTONE — 10.000 perfiles
  INSERT INTO public.feed_posts
    (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (
    v_admin,
    E'🎉 10.000 perfiles verificados en YourCVPassport\n\nHemos alcanzado un hito que hace seis meses parecía lejano: 10.000 profesionales con perfil verificado en la plataforma.\n\nAlgunos números que nos dicen algo real:\n→ 78% completaron su perfil en los primeros 7 días\n→ Profesionales de 23 países\n→ Más de 400 conexiones con empresas registradas este mes\n→ Promedio de perfil completado: 87% (la media en LinkedIn es ~40%)\n\nEsto es de los usuarios, no nuestro. Gracias por confiar en la plataforma para contar vuestra historia profesional.\n\nSeguimos construyendo. 🚀',
    'MILESTONE', 'PUBLIC', v_ch_id,
    '{"seed_novedades_v2": "true"}',
    NOW() - INTERVAL '14 days'
  ) RETURNING id INTO np1;

  -- np2 [ES] ACHIEVEMENT — historia de éxito real
  INSERT INTO public.feed_posts
    (author_id, content, content_type, achievement_type, achievement_data, visibility, group_id, metadata, created_at)
  VALUES (
    v_admin,
    E'Historia de la semana 🏆\n\nNos escribió Valentina, diseñadora UX de Buenos Aires. Llevaba 9 meses en búsqueda activa con su CV en PDF clásico. Actualizó su perfil YourCVPassport con el nuevo constructor: añadió su portfolio visual, los proyectos con métricas de impacto y habilitó el enlace público.\n\nResultado: 3 entrevistas en 2 semanas. Oferta firmada de una startup fintech con sede en Barcelona.\n\nSu reflexión: "Por primera vez mi CV mostraba quién soy realmente, no solo dónde había trabajado."\n\nSi tienes una historia así, cuéntanosla — nos la envías al canal y puede que la compartamos aquí. 👇',
    'ACHIEVEMENT', 'got_hired',
    '{"position": "Senior UX Designer", "company_name": "Fintech startup — Barcelona"}',
    'PUBLIC', v_ch_id,
    '{"seed_novedades_v2": "true"}',
    NOW() - INTERVAL '10 days'
  ) RETURNING id INTO np2;

  -- np3 [ES] EVENT — webinar en vivo con el equipo
  INSERT INTO public.feed_posts
    (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (
    v_admin,
    E'📅 Webinar en vivo: "Cómo construir un perfil que consiga entrevistas en 2026"\n\nEl equipo de YourCVPassport responde en directo las preguntas más frecuentes:\n\n→ ¿Cómo pasar el filtro ATS con tu perfil online?\n→ ¿Qué secciones miran primero los reclutadores?\n→ Cómo presentar una transición de carrera sin que parezca una disculpa\n→ Demo en vivo del constructor de perfil — paso a paso\n\nGratuito para todos los miembros. Plazas limitadas.\nPregunta en directo al final — trae tu situación real.',
    'EVENT', 'PUBLIC', v_ch_id,
    jsonb_build_object(
      'seed_novedades_v2', 'true',
      'event', jsonb_build_object(
        'title', 'Cómo construir un perfil que consiga entrevistas en 2026',
        'date', TO_CHAR(NOW() + INTERVAL '8 days', 'YYYY-MM-DD'),
        'time', '18:00',
        'location', 'Online — Zoom',
        'link', 'https://yourcvpassport.com/eventos/perfil-entrevistas-2026'
      )
    ),
    NOW() - INTERVAL '3 days'
  ) RETURNING id INTO np3;

  -- np4 [ES] TEXT — nueva función: verificación de habilidades
  INSERT INTO public.feed_posts
    (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (
    v_admin,
    E'⚡ Nueva función: Verificación de habilidades con IA\n\nA partir de hoy puedes verificar tus habilidades técnicas directamente desde tu perfil.\n\nCómo funciona:\n→ Selecciona una habilidad en tu perfil (ej: "SQL", "Diseño UX", "Gestión de proyectos")\n→ Elige una micro-evaluación de 5 preguntas (menos de 3 minutos)\n→ Si superas el umbral, aparece un badge verificado visible en tu perfil\n\nNo es un examen. Es una señal para reclutadores de que la habilidad no es solo una palabra en un listado.\n\nDisponible para 40+ habilidades en la primera versión. Iremos añadiendo más según la demanda. ¿Cuál quieres ver primero?',
    'TEXT', 'PUBLIC', v_ch_id,
    '{"seed_novedades_v2": "true"}',
    NOW() - INTERVAL '5 days'
  ) RETURNING id INTO np4;

  -- np5 [ES] POLL — qué canal prefieren
  INSERT INTO public.feed_posts
    (author_id, content, content_type, visibility, group_id, metadata, created_at)
  VALUES (
    v_admin,
    E'Queremos entender mejor cómo usas YourCVPassport 👇',
    'POLL', 'PUBLIC', v_ch_id,
    jsonb_build_object(
      'seed_novedades_v2', 'true',
      'poll', jsonb_build_object(
        'question', '¿Para qué usas más YourCVPassport actualmente?',
        'options', jsonb_build_array(
          'Búsqueda activa de empleo',
          'Mantener mi perfil profesional actualizado',
          'Networking con otros profesionales',
          'Seguir comunidades y canales del sector'
        ),
        'duration', '1w',
        'expires_at', (NOW() + INTERVAL '7 days')::TEXT
      )
    ),
    NOW() - INTERVAL '1 day'
  ) RETURNING id INTO np5;

  -- 7. Actualizar post_count del canal
  UPDATE public.groups
     SET post_count = (
       SELECT COUNT(*) FROM public.feed_posts
        WHERE group_id = v_ch_id AND is_hidden = false
     )
   WHERE id = v_ch_id;

  -- 8. Asegurarse de que el admin es miembro del canal (role = owner)
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_ch_id, v_admin, 'owner')
  ON CONFLICT (group_id, user_id) DO UPDATE SET role = 'owner';

  RAISE NOTICE 'Fix completado: canal Novedades reasignado al admin (%), 5 posts nuevos añadidos', v_admin;

END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 12: 20260225_fix_seed_realism.sql
-- Fix polls expires_at, views_count, sync likes_count to actual rows
-- ═══════════════════════════════════════════════════════════════════════════

-- ============================================================
-- Fix seed data realism
-- 1. Fix polls with missing expires_at (NaN left bug)
-- 2. Fix views_count to be proportional to likes_count
-- 3. Add real feed_likes rows with reaction variety
-- ============================================================

DO $$
DECLARE
  -- user IDs from seed
  laura     CONSTANT UUID := 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';
  javier    CONSTANT UUID := 'a826c47c-0d50-47da-aab3-4dfb71da709d';
  marta     CONSTANT UUID := 'e379dca2-0b33-45b4-864a-ba9204e0ab4b';
  james     CONSTANT UUID := '8d93820f-beb7-4eb8-8a3c-8e7efa6a6665';
  sarah     CONSTANT UUID := 'a2b0d3d3-488f-429a-9b2f-a4e0a78e55a9';
  marcus    CONSTANT UUID := '8343e9aa-cc89-4273-9386-581883592a67';
  lisa      CONSTANT UUID := '97d188d3-a038-4726-bb7e-59e13814123a';
  jennifer  CONSTANT UUID := '0da0dcfa-82dc-43df-a5f8-adaee989c690';
  rachel    CONSTANT UUID := '3f40d45b-ad4e-43a9-a88b-a822a56cc7d3';
  david     CONSTANT UUID := '206de10c-1322-491b-ac79-c4de3886ca0d';
  emily     CONSTANT UUID := 'c9e55b0e-efff-4f43-b0ce-3d99868ce3d8';
  amanda    CONSTANT UUID := '3d0d18fd-2b12-4fd5-b5c4-b6635fa3f52e';
  kevin     CONSTANT UUID := '86a7ec23-2fe8-4a60-afe3-45e61e906b54';
  margaret  CONSTANT UUID := 'e4f2dcf3-6264-46d0-970c-65592c87a9c4';
  thomas    CONSTANT UUID := 'c2eec942-9fb8-4bc5-a208-db9958438d51';
  patricia  CONSTANT UUID := 'e23b0890-fb78-4ab5-85fc-613e56b68aba';
  daniel    CONSTANT UUID := 'd0961de8-508e-4870-864e-65b833bfafb0';
  linda     CONSTANT UUID := '8068213e-0e53-48c7-b9f5-ccd631865484';
  priya     CONSTANT UUID := 'efb2e93a-1ad5-4f0d-a948-daa763d5a2d4';
  chris     CONSTANT UUID := 'c0cde1c6-9391-4e6e-933c-d29332068a01';
  steven    CONSTANT UUID := '83de70ef-0504-4f9d-b45c-d1f35eef9535';
  angela    CONSTANT UUID := 'c1889bbe-f828-41dc-83f6-b844f1e74d49';
  brian     CONSTANT UUID := 'dab1878e-f2dc-451c-9753-392c91ac4aa3';
  rebecca   CONSTANT UUID := '54701b32-af6e-4923-846d-8a04fad249a8';
  karen     CONSTANT UUID := '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1';
  jessica   CONSTANT UUID := '55333d11-13c8-43b8-942b-cb1e75d0b812';
  alex_m    CONSTANT UUID := '099840cc-a99c-480d-8fd9-fba5ecd5a4a6';
  diana     CONSTANT UUID := '636e9e4d-4873-4114-8949-376a8d0f24bc';
  robert_k  CONSTANT UUID := '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da';
  mark      CONSTANT UUID := '707aa7e3-b891-485c-b4e6-618625713565';
  michelle  CONSTANT UUID := '7fe0c1a6-39ed-46ad-9388-116a3a0fb429';
  nicole    CONSTANT UUID := '1b90b431-de09-4b75-af6a-c94975b68746';

BEGIN

  -- ════════════════════════════════════════════════════════════
  -- 1. Fix polls with missing expires_at → NaN left bug
  -- ════════════════════════════════════════════════════════════
  UPDATE public.feed_posts
  SET metadata = jsonb_set(
    jsonb_set(
      metadata,
      '{poll,expires_at}',
      to_jsonb((NOW() + INTERVAL '7 days')::TEXT)
    ),
    '{poll,duration}',
    '"1w"'
  )
  WHERE content_type = 'POLL'
    AND (
      metadata->'poll'->>'expires_at' IS NULL
      OR metadata->'poll'->>'expires_at' = ''
      OR metadata->'poll'->>'expires_at' = 'NaN'
    );

  -- ════════════════════════════════════════════════════════════
  -- 2. Fix views_count: must be > likes_count (realistic ratio)
  -- ════════════════════════════════════════════════════════════
  -- Posts from 20260224 seed have likes_count >> views_count (0 or 1 default)
  UPDATE public.feed_posts
  SET views_count = likes_count * (5 + floor(random() * 10)::int)
  WHERE likes_count > 5
    AND views_count < likes_count;

  -- ════════════════════════════════════════════════════════════
  -- 3. Add real feed_likes with reaction variety for 20260224 posts
  --    These posts have likes_count hardcoded but no actual rows
  --    Match by group name + approximate created_at
  -- ════════════════════════════════════════════════════════════

  -- Career Development & Coaching group posts
  INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
  SELECT p.id, u.user_id, u.reaction_type
  FROM public.feed_posts p
  JOIN public.groups g ON g.id = p.group_id
  CROSS JOIN (VALUES
    (james,    'CELEBRATE'::text),
    (sarah,    'LIKE'),
    (emily,    'INSIGHTFUL'),
    (david,    'SUPPORT'),
    (jennifer, 'CELEBRATE'),
    (marcus,   'LIKE'),
    (linda,    'INSIGHTFUL'),
    (kevin,    'LIKE')
  ) AS u(user_id, reaction_type)
  WHERE g.name = 'Career Development & Coaching'
    AND p.content_type = 'TEXT'
  ON CONFLICT (post_id, user_id) DO NOTHING;

  INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
  SELECT p.id, u.user_id, u.reaction_type
  FROM public.feed_posts p
  JOIN public.groups g ON g.id = p.group_id
  CROSS JOIN (VALUES
    (rachel,   'INSIGHTFUL'::text),
    (angela,   'SUPPORT'),
    (thomas,   'CELEBRATE'),
    (patricia, 'LIKE'),
    (daniel,   'INSIGHTFUL')
  ) AS u(user_id, reaction_type)
  WHERE g.name = 'Career Development & Coaching'
    AND p.content_type = 'EVENT'
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- Liderazgo & Gestión de Equipos posts
  INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
  SELECT p.id, u.user_id, u.reaction_type
  FROM public.feed_posts p
  JOIN public.groups g ON g.id = p.group_id
  CROSS JOIN (VALUES
    (javier,   'INSIGHTFUL'::text),
    (marta,    'LIKE'),
    (laura,    'CELEBRATE'),
    (james,    'INSIGHTFUL'),
    (sarah,    'SUPPORT'),
    (angela,   'LIKE'),
    (kevin,    'INSIGHTFUL'),
    (daniel,   'LIKE')
  ) AS u(user_id, reaction_type)
  WHERE g.name = 'Liderazgo & Gestión de Equipos'
    AND p.content_type = 'TEXT'
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- Remote Work & Digital Nomads posts
  INSERT INTO public.feed_likes (post_id, user_id, reaction_type)
  SELECT p.id, u.user_id, u.reaction_type
  FROM public.feed_posts p
  JOIN public.groups g ON g.id = p.group_id
  CROSS JOIN (VALUES
    (alex_m,   'CELEBRATE'::text),
    (jessica,  'LIKE'),
    (brian,    'SUPPORT'),
    (rachel,   'LIKE'),
    (emily,    'CELEBRATE'),
    (kevin,    'INSIGHTFUL'),
    (priya,    'LOVE'),
    (thomas,   'LIKE')
  ) AS u(user_id, reaction_type)
  WHERE g.name = 'Remote Work & Digital Nomads'
    AND p.content_type IN ('TEXT', 'EVENT')
  ON CONFLICT (post_id, user_id) DO NOTHING;

  -- ════════════════════════════════════════════════════════════
  -- 4. Sync likes_count to actual feed_likes rows
  -- ════════════════════════════════════════════════════════════
  UPDATE public.feed_posts p
  SET likes_count = (
    SELECT COUNT(*) FROM public.feed_likes l WHERE l.post_id = p.id
  )
  WHERE EXISTS (
    SELECT 1 FROM public.feed_likes l WHERE l.post_id = p.id
  );

  RAISE NOTICE 'Fix completado: polls corregidos, views_count actualizado, likes reales insertados';

END $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 13: 20260226_more_channels.sql
-- Add 6 new channels with varied posts and member counts
-- ═══════════════════════════════════════════════════════════════════════════

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


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 14: 20260226_add_hashtags_to_seed_posts.sql
-- Add real hashtags to existing seed feed posts for Trends card
-- ═══════════════════════════════════════════════════════════════════════════

-- Add real hashtags to existing seed feed posts so the Trends card picks them up
-- Run this in the Supabase SQL Editor

-- Update posts that mention "trabajo" or "empleo" topics
UPDATE feed_posts SET content = content || E'\n\n#OpenToWork #BúsquedaDeEmpleo'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE content ILIKE '%trabajo%' AND content NOT LIKE '%#OpenToWork%' AND is_hidden = false
  LIMIT 5
);

-- Update posts about technology
UPDATE feed_posts SET content = content || E'\n\n#Tecnología #Innovación'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE (content ILIKE '%tecnología%' OR content ILIKE '%technology%' OR content ILIKE '%desarrollo%')
  AND content NOT LIKE '%#Tecnología%' AND is_hidden = false
  LIMIT 5
);

-- Update posts about CV or profile
UPDATE feed_posts SET content = content || E'\n\n#ConsejosCV #DesarrolloProfesional'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE (content ILIKE '%perfil%' OR content ILIKE '%cv%' OR content ILIKE '%currículum%')
  AND content NOT LIKE '%#ConsejosCV%' AND is_hidden = false
  LIMIT 5
);

-- Update posts about networking or community
UPDATE feed_posts SET content = content || E'\n\n#Networking #Comunidad'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE (content ILIKE '%comunidad%' OR content ILIKE '%conectar%' OR content ILIKE '%networking%')
  AND content NOT LIKE '%#Networking%' AND is_hidden = false
  LIMIT 5
);

-- Update posts about career milestones
UPDATE feed_posts SET content = content || E'\n\n#Logros #CarreraProfesional'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE content_type IN ('ACHIEVEMENT', 'MILESTONE')
  AND content NOT LIKE '%#Logros%' AND is_hidden = false
  LIMIT 5
);

-- Remaining posts without hashtags: add general ones
UPDATE feed_posts SET content = content || E'\n\n#YourCVPassport #Profesionales'
WHERE id IN (
  SELECT id FROM feed_posts
  WHERE content !~ '#[A-Za-zÀ-ÿ]'
  AND is_hidden = false AND visibility = 'PUBLIC'
  LIMIT 10
);


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 15: 20260226_create_follows.sql
-- Follow system: table, indexes, RLS, notification type update
-- ═══════════════════════════════════════════════════════════════════════════

-- =============================================
-- Follow System
-- =============================================

CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Who is following
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Who is being followed
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Prevent self-follow and duplicate follows
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    UNIQUE(follower_id, following_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id, created_at DESC);

-- RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see follows
DROP POLICY IF EXISTS "Anyone can view follows" ON public.follows;
CREATE POLICY "Anyone can view follows"
ON public.follows FOR SELECT
TO authenticated
USING (true);

-- Users can only follow as themselves
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
CREATE POLICY "Users can follow others"
ON public.follows FOR INSERT
TO authenticated
WITH CHECK (follower_id = auth.uid());

-- Users can only unfollow their own follows
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;
CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
TO authenticated
USING (follower_id = auth.uid());

-- Add 'follow' to feed_notifications type check
-- (Must alter the existing constraint)
DO $$
BEGIN
    ALTER TABLE public.feed_notifications DROP CONSTRAINT IF EXISTS feed_notifications_type_check;
    ALTER TABLE public.feed_notifications ADD CONSTRAINT feed_notifications_type_check
        CHECK (type IN ('reaction', 'comment', 'reply', 'mention', 'repost', 'follow'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not update feed_notifications type constraint: %', SQLERRM;
END $$;

COMMENT ON TABLE public.follows IS 'Follow system for user-to-user social connections';


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 16: 20260226_fix_support_profile.sql
-- Fix support account to be a proper brand/entity profile
-- ═══════════════════════════════════════════════════════════════════════════

-- Fix support account to be a proper brand/entity profile
-- The support account (support-yourcvpassport-com) was showing "Perfil Incompleto"
-- because it was missing full_name, headline, and summary.

UPDATE profiles
SET
  full_name = 'YourCVPassport Support',
  headline = 'Official Support Team · Equipo de Soporte Oficial',
  summary = 'We are the official support team of YourCVPassport. We help professionals build stunning digital CVs, connect with companies, and grow their careers. Need help? Reach us at support@yourcvpassport.com.

Somos el equipo de soporte oficial de YourCVPassport. Ayudamos a profesionales a crear CVs digitales impresionantes, conectarse con empresas y hacer crecer sus carreras. ¿Necesitas ayuda? Escríbenos a support@yourcvpassport.com.',
  country_code = 'ES',
  is_active = true,
  wizard_completed = true
WHERE slug = 'support-yourcvpassport-com';


-- ═══════════════════════════════════════════════════════════════════════════
-- FILE 17: 20260226_add_banner_url_to_profiles.sql
-- Add banner_url column to profiles for customizable feed banners
-- ═══════════════════════════════════════════════════════════════════════════

-- Add banner_url column to profiles for customizable feed profile banners
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT NULL;

-- Allow users to update their own banner
COMMENT ON COLUMN profiles.banner_url IS 'URL for the user feed profile banner image';


-- ═══════════════════════════════════════════════════════════════════════════
-- END OF CONSOLIDATED MIGRATION
-- 17 files consolidated
-- ═══════════════════════════════════════════════════════════════════════════
