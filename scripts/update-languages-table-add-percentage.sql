-- Script to update existing languages table to add percentage column
-- Run this in your Supabase SQL Editor

-- Add percentage column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'languages' AND column_name = 'percentage'
  ) THEN
    ALTER TABLE public.languages
    ADD COLUMN percentage INTEGER CHECK (percentage >= 0 AND percentage <= 100);
  END IF;
END $$;

-- Add sort_order column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'languages' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE public.languages
    ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;
END $$;

-- Verify columns were added
SELECT 'Update completed successfully!' AS status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'languages'
ORDER BY ordinal_position;
