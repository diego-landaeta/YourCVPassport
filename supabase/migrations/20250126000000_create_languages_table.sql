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

-- Add RLS policies
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own languages
CREATE POLICY "Users can view own languages"
  ON public.languages
  FOR SELECT
  USING (auth.uid() = profile_id);

-- Policy: Users can insert their own languages
CREATE POLICY "Users can insert own languages"
  ON public.languages
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can update their own languages
CREATE POLICY "Users can update own languages"
  ON public.languages
  FOR UPDATE
  USING (auth.uid() = profile_id);

-- Policy: Users can delete their own languages
CREATE POLICY "Users can delete own languages"
  ON public.languages
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_languages_profile_id ON public.languages(profile_id);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_languages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER languages_updated_at
  BEFORE UPDATE ON public.languages
  FOR EACH ROW
  EXECUTE FUNCTION update_languages_updated_at();
