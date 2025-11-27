-- Migration: Fix remote_preference constraint and data
-- Step 1: First, let's see what values currently exist
-- Step 2: Update any invalid values to NULL or a valid option
-- Step 3: Then update the constraint

-- Step 1: Check current values (optional, for information)
-- SELECT DISTINCT remote_preference FROM profiles WHERE remote_preference IS NOT NULL;

-- Step 2: Update any rows that might have invalid values
-- Set invalid values to NULL (you can change this to a default like 'flexible' if preferred)
UPDATE profiles 
SET remote_preference = NULL 
WHERE remote_preference NOT IN ('remote', 'hybrid', 'on-site', 'flexible')
  OR remote_preference IS NULL;

-- Step 3: Drop the existing constraint
ALTER TABLE profiles 
  DROP CONSTRAINT IF EXISTS profiles_remote_preference_check;

-- Step 4: Add the updated constraint with 'flexible' included
ALTER TABLE profiles 
  ADD CONSTRAINT profiles_remote_preference_check 
  CHECK (remote_preference IS NULL OR remote_preference IN ('remote', 'hybrid', 'on-site', 'flexible'));

-- Verify the constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
  AND conname = 'profiles_remote_preference_check';
