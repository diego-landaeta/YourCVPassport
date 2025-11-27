-- Script to create languages table in Supabase
-- Run this in your Supabase SQL Editor

-- Drop existing table if needed (CAUTION: This will delete all data)
-- DROP TABLE IF EXISTS public.languages CASCADE;

-- Create languages table
CREATE TABLE IF NOT EXISTS public.languages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level TEXT NOT NULL,
  percentage INTEGER CHECK (percentage >= 0 AND percentage <= 100),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can insert own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can update own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can delete own languages" ON public.languages;

-- Create RLS policies
CREATE POLICY "Users can view own languages"
  ON public.languages
  FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own languages"
  ON public.languages
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own languages"
  ON public.languages
  FOR UPDATE
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can delete own languages"
  ON public.languages
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_languages_profile_id ON public.languages(profile_id);

-- Create or replace trigger function
CREATE OR REPLACE FUNCTION update_languages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS languages_updated_at ON public.languages;

-- Create trigger
CREATE TRIGGER languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION update_languages_updated_at();

-- Verify table was created
SELECT 'Languages table created successfully!' AS status;
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'languages'
ORDER BY ordinal_position;
