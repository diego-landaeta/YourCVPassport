-- Add user moderation fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS profile_hidden BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS search_blocked BOOLEAN DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS messages_blocked BOOLEAN DEFAULT false NOT NULL;

-- Add indexes for quick filtering
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_suspended_until ON public.profiles(suspended_until) WHERE suspended_until IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_profile_hidden ON public.profiles(profile_hidden) WHERE profile_hidden = true;
CREATE INDEX IF NOT EXISTS idx_profiles_search_blocked ON public.profiles(search_blocked) WHERE search_blocked = true;

-- Add comments explaining the columns
COMMENT ON COLUMN public.profiles.is_active IS 'Whether the user account is active. False means suspended.';
COMMENT ON COLUMN public.profiles.suspension_reason IS 'Reason for suspension if is_active is false';
COMMENT ON COLUMN public.profiles.suspended_until IS 'Date when suspension expires. NULL means permanent suspension.';
COMMENT ON COLUMN public.profiles.profile_hidden IS 'If true, profile is hidden from public view';
COMMENT ON COLUMN public.profiles.search_blocked IS 'If true, profile does not appear in search results';
COMMENT ON COLUMN public.profiles.messages_blocked IS 'If true, user cannot send or receive messages';

-- Function to auto-reactivate users after suspension expires
CREATE OR REPLACE FUNCTION auto_reactivate_expired_suspensions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.profiles
  SET
    is_active = true,
    suspension_reason = NULL,
    suspended_until = NULL
  WHERE
    is_active = false
    AND suspended_until IS NOT NULL
    AND suspended_until <= NOW();
END;
$$;

-- This function can be called by a cron job or trigger
-- For now, you can call it manually or set up pg_cron
