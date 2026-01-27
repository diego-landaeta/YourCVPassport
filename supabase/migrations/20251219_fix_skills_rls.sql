-- Fix RLS policies for skills and languages tables

-- ============================================
-- SKILLS TABLE
-- ============================================

-- Enable RLS on skills table if not already enabled
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own skills" ON public.skills;
DROP POLICY IF EXISTS "Users can insert their own skills" ON public.skills;
DROP POLICY IF EXISTS "Users can update their own skills" ON public.skills;
DROP POLICY IF EXISTS "Users can delete their own skills" ON public.skills;
DROP POLICY IF EXISTS "Public can view skills of public profiles" ON public.skills;

-- Create policy for viewing own skills
CREATE POLICY "Users can view their own skills"
    ON public.skills FOR SELECT
    USING (auth.uid() = profile_id);

-- Create policy for inserting own skills
CREATE POLICY "Users can insert their own skills"
    ON public.skills FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Create policy for updating own skills
CREATE POLICY "Users can update their own skills"
    ON public.skills FOR UPDATE
    USING (auth.uid() = profile_id);

-- Create policy for deleting own skills
CREATE POLICY "Users can delete their own skills"
    ON public.skills FOR DELETE
    USING (auth.uid() = profile_id);

-- Also allow public profiles to have their skills viewed
CREATE POLICY "Public can view skills of public profiles"
    ON public.skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = skills.profile_id
            AND profiles.slug IS NOT NULL
        )
    );

-- ============================================
-- LANGUAGES TABLE
-- ============================================

-- Enable RLS on languages table if not already enabled
ALTER TABLE public.languages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can insert their own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can update their own languages" ON public.languages;
DROP POLICY IF EXISTS "Users can delete their own languages" ON public.languages;
DROP POLICY IF EXISTS "Public can view languages of public profiles" ON public.languages;

-- Create policy for viewing own languages
CREATE POLICY "Users can view their own languages"
    ON public.languages FOR SELECT
    USING (auth.uid() = profile_id);

-- Create policy for inserting own languages
CREATE POLICY "Users can insert their own languages"
    ON public.languages FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Create policy for updating own languages
CREATE POLICY "Users can update their own languages"
    ON public.languages FOR UPDATE
    USING (auth.uid() = profile_id);

-- Create policy for deleting own languages
CREATE POLICY "Users can delete their own languages"
    ON public.languages FOR DELETE
    USING (auth.uid() = profile_id);

-- Also allow public profiles to have their languages viewed
CREATE POLICY "Public can view languages of public profiles"
    ON public.languages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = languages.profile_id
            AND profiles.slug IS NOT NULL
        )
    );
