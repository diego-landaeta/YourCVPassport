-- Script to fix role and plan confusion in profiles table
-- Run this in your Supabase SQL editor

-- 1. Check current state - See what roles and plans exist
SELECT
  role,
  plan,
  COUNT(*) as count
FROM profiles
GROUP BY role, plan
ORDER BY role, plan;

-- 2. Check the constraint
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles'
  AND con.conname LIKE '%plan%';

-- 3. Fix incorrect roles (change 'professional' to 'user')
UPDATE profiles
SET role = 'user',
    updated_at = NOW()
WHERE role = 'professional';

-- 4. Set default plan to 'Free' for any profiles without a plan
UPDATE profiles
SET plan = 'Free',
    updated_at = NOW()
WHERE plan IS NULL OR plan = '';

-- 5. Fix any invalid plan values
-- Only 'Free', 'Pro', and 'Premium' are valid
UPDATE profiles
SET plan = 'Free',
    updated_at = NOW()
WHERE plan NOT IN ('Free', 'Pro', 'Premium');

-- 6. Verify the fix
SELECT
  id,
  full_name,
  email,
  role,
  plan,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 20;

-- 7. Show statistics after fix
SELECT
  'Role Distribution' as metric,
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role

UNION ALL

SELECT
  'Plan Distribution' as metric,
  plan,
  COUNT(*) as count
FROM profiles
GROUP BY plan;
