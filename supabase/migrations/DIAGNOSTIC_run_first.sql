-- ============================================================
-- DIAGNOSTIC: Run this first to see what exists and what's missing
-- ============================================================

-- Check if tables exist
SELECT 'groups' AS table_name, COUNT(*) AS row_count FROM public.groups
UNION ALL
SELECT 'group_members', COUNT(*) FROM public.group_members
UNION ALL
SELECT 'feed_posts (with group_id)', COUNT(*) FROM public.feed_posts WHERE group_id IS NOT NULL
UNION ALL
SELECT 'user_follows', COUNT(*) FROM public.user_follows;

-- Check if group_id column exists on feed_posts
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'feed_posts'
  AND column_name IN ('group_id', 'views_count');

-- Check if banner_url column exists on profiles
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'banner_url';

-- Check channels specifically (metadata->>'type' = 'channel')
SELECT id, name, slug, member_count, metadata->>'type' AS group_type
FROM public.groups
WHERE metadata->>'type' = 'channel'
ORDER BY name;

-- Check RLS policies on groups
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('groups', 'group_members')
ORDER BY tablename, policyname;
