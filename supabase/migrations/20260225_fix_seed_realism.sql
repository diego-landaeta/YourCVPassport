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
