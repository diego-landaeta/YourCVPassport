-- Add preferences fields to profiles table if they don't exist

-- Job preferences
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='job_type') THEN
        ALTER TABLE public.profiles ADD COLUMN job_type text[];
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='availability') THEN
        ALTER TABLE public.profiles ADD COLUMN availability text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='salary_min') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_min integer;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='salary_max') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_max integer;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='salary_currency') THEN
        ALTER TABLE public.profiles ADD COLUMN salary_currency text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='remote_preference') THEN
        ALTER TABLE public.profiles ADD COLUMN remote_preference text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='willing_to_relocate') THEN
        ALTER TABLE public.profiles ADD COLUMN willing_to_relocate boolean DEFAULT false;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='preferred_locations') THEN
        ALTER TABLE public.profiles ADD COLUMN preferred_locations text[];
    END IF;
END $$;

-- Add constraints for specific enums (optional but recommended for data integrity)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_availability_check'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_availability_check
        CHECK (availability IS NULL OR availability IN ('immediate', '2-weeks', '1-month', '2-months', 'not-looking'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'profiles_remote_preference_check'
    ) THEN
        ALTER TABLE public.profiles
        ADD CONSTRAINT profiles_remote_preference_check
        CHECK (remote_preference IS NULL OR remote_preference IN ('remote', 'hybrid', 'on-site', 'flexible'));
    END IF;
END $$;
