-- Script to fix the profiles_plan_check constraint issue
-- Run this in your Supabase SQL Editor

-- Step 1: Check current constraint definition
SELECT
  con.conname AS constraint_name,
  pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'profiles'
  AND con.conname = 'profiles_plan_check';

-- Step 2: Drop the existing constraint if it exists
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- Step 3: Fix all existing data before adding new constraint
-- First, fix roles (change 'professional' to 'user')
UPDATE profiles
SET role = 'user'
WHERE role = 'professional' OR role NOT IN ('user', 'admin');

-- Set default 'Free' plan for NULL or empty plans
UPDATE profiles
SET plan = 'Free'
WHERE plan IS NULL OR plan = '' OR plan NOT IN ('Free', 'Pro', 'Premium');

-- Step 4: Add the new constraint that allows NULL temporarily
ALTER TABLE profiles
ADD CONSTRAINT profiles_plan_check
CHECK (plan IS NULL OR plan IN ('Free', 'Pro', 'Premium'));

-- Step 5: Now set all NULL plans to 'Free'
UPDATE profiles
SET plan = 'Free'
WHERE plan IS NULL;

-- Step 6: Make the constraint stricter (not allow NULL)
ALTER TABLE profiles
DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE profiles
ADD CONSTRAINT profiles_plan_check
CHECK (plan IN ('Free', 'Pro', 'Premium'));

-- Step 7: Verify the results
SELECT
  'Total Profiles' as info,
  COUNT(*)::text as count
FROM profiles

UNION ALL

SELECT
  'Role: ' || role as info,
  COUNT(*)::text as count
FROM profiles
GROUP BY role

UNION ALL

SELECT
  'Plan: ' || plan as info,
  COUNT(*)::text as count
FROM profiles
GROUP BY plan;

-- Step 8: Show sample of fixed data
SELECT
  id,
  full_name,
  email,
  role,
  plan,
  created_at
FROM profiles
ORDER BY created_at DESC
LIMIT 10;
