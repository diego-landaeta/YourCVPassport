-- =====================================================
-- VERIFY STAMPS FOR CURRENT USER
-- Run this to see stamps for a specific user
-- =====================================================

-- Replace this UUID with the actual logged-in user's UUID
-- You can find it in the browser console or auth state

-- For Laura Martínez Vidal
SELECT
  'LAURA MARTINEZ' as user_name,
  id,
  type,
  status,
  evidence,
  verified_at,
  created_at
FROM stamps
WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
ORDER BY created_at DESC;

-- For Javier Torres Gimeno
SELECT
  'JAVIER TORRES' as user_name,
  id,
  type,
  status,
  evidence,
  verified_at,
  created_at
FROM stamps
WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d'
ORDER BY created_at DESC;

-- Check RLS policies on stamps table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'stamps';
