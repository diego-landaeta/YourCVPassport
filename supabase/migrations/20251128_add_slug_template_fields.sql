-- Add slug and template fields to profiles table if they don't exist

-- Add slug column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='slug') THEN
        ALTER TABLE public.profiles ADD COLUMN slug text UNIQUE;
        -- Create index for faster slug lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles(slug);
    END IF;
END $$;

-- Add template column
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='template') THEN
        ALTER TABLE public.profiles ADD COLUMN template text;
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Add created_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at timestamp with time zone DEFAULT now();
    END IF;
END $$;

-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace RLS policies for profiles table
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Public profiles are viewable by slug" ON public.profiles;
CREATE POLICY "Public profiles are viewable by slug"
    ON public.profiles FOR SELECT
    USING (slug IS NOT NULL);
