-- Drop the old level check constraint if it exists
ALTER TABLE languages
DROP CONSTRAINT IF EXISTS languages_level_check;

-- Add percentage and is_native fields to languages table
ALTER TABLE languages
ADD COLUMN IF NOT EXISTS percentage INTEGER;

ALTER TABLE languages
ADD COLUMN IF NOT EXISTS is_native BOOLEAN DEFAULT false;

-- Add NEW check constraint for level that includes 'Native'
ALTER TABLE languages
ADD CONSTRAINT languages_level_check
CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native'));

-- Add check constraint for percentage
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'languages_percentage_check'
  ) THEN
    ALTER TABLE languages
    ADD CONSTRAINT languages_percentage_check
    CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100));
  END IF;
END $$;

-- Create index for native languages for faster queries
CREATE INDEX IF NOT EXISTS idx_languages_is_native
ON languages(profile_id, is_native)
WHERE is_native = true;

-- Update existing records to set is_native based on level
UPDATE languages
SET is_native = true
WHERE level = 'Native' AND is_native IS NULL;

-- Set default percentage for native languages
UPDATE languages
SET percentage = 100
WHERE is_native = true AND percentage IS NULL;
