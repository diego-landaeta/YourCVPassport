-- Add last_slug_changed_at field to track when user last changed their slug
-- This is used to enforce 90-day restriction on slug updates

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='last_slug_changed_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_slug_changed_at timestamp with time zone;

        -- Set initial value for existing profiles with slugs to current time
        -- This ensures existing users won't be able to change immediately
        UPDATE public.profiles
        SET last_slug_changed_at = now()
        WHERE slug IS NOT NULL AND last_slug_changed_at IS NULL;

        -- Create index for faster queries
        CREATE INDEX IF NOT EXISTS idx_profiles_last_slug_changed ON public.profiles(last_slug_changed_at);
    END IF;
END $$;
