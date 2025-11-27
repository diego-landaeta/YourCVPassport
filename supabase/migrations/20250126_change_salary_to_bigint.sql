-- Migration: Change salary_min and salary_max from integer to bigint
-- This allows storing larger salary values (up to 9,223,372,036,854,775,807)

ALTER TABLE profiles 
  ALTER COLUMN salary_min TYPE bigint,
  ALTER COLUMN salary_max TYPE bigint;

-- Verify the change
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('salary_min', 'salary_max');
