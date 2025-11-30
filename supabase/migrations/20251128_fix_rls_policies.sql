-- Fix RLS policies for profiles table to allow updates

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by slug" ON public.profiles;

-- Create policy for viewing own profile
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

-- Create policy for inserting own profile
CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Create policy for updating own profile (FIXED)
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Create policy for public profiles viewable by slug
CREATE POLICY "Public profiles are viewable by slug"
    ON public.profiles FOR SELECT
    USING (slug IS NOT NULL);
