-- Add plan field to profiles table if it doesn't exist
-- This migration ensures that users have a subscription plan field

DO $$
BEGIN
    -- Add plan column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'plan'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN plan text DEFAULT 'free' CHECK (plan IN ('free', 'basic', 'pro', 'enterprise'));

        COMMENT ON COLUMN public.profiles.plan IS 'User subscription plan: free, basic, pro, or enterprise';
    END IF;
END $$;

-- Set default plan for existing users without a plan
UPDATE public.profiles
SET plan = 'free'
WHERE plan IS NULL;

-- Create index on plan field for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);
