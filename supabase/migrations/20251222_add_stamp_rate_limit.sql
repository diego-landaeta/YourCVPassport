-- Add rate limiting for stamp requests: 1 request per stamp type every 3 days
-- For external provider verifications (EMAIL, PHONE): max 4 total attempts
-- This migration adds tracking and validation for stamp request frequency

-- Create a function to check if user can request a specific stamp type
CREATE OR REPLACE FUNCTION public.can_request_stamp(
  p_profile_id uuid,
  p_stamp_type text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_request_date timestamp with time zone;
  days_since_last_request interval;
  total_attempts integer;
  max_external_attempts constant integer := 4;
BEGIN
  -- For external provider verifications (EMAIL, PHONE), check total attempts limit
  IF p_stamp_type IN ('EMAIL', 'PHONE') THEN
    SELECT COUNT(*) INTO total_attempts
    FROM public.stamps
    WHERE profile_id = p_profile_id
      AND type = p_stamp_type;

    -- If user has reached maximum attempts, deny request
    IF total_attempts >= max_external_attempts THEN
      RETURN false;
    END IF;
  END IF;

  -- Get the most recent stamp request of this type for this user
  SELECT created_at INTO last_request_date
  FROM public.stamps
  WHERE profile_id = p_profile_id
    AND type = p_stamp_type
  ORDER BY created_at DESC
  LIMIT 1;

  -- If no previous request exists, allow the request
  IF last_request_date IS NULL THEN
    RETURN true;
  END IF;

  -- Calculate time since last request
  days_since_last_request := now() - last_request_date;

  -- Allow request if more than 3 days have passed
  RETURN days_since_last_request >= interval '3 days';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.can_request_stamp(uuid, text) TO authenticated;

-- Create a view to show when users can next request each stamp type
CREATE OR REPLACE VIEW public.stamp_request_availability AS
SELECT
  s.profile_id,
  s.type,
  s.created_at as last_request_at,
  s.created_at + interval '3 days' as next_available_at,
  CASE
    WHEN s.created_at + interval '3 days' <= now() THEN true
    ELSE false
  END as can_request_now,
  EXTRACT(epoch FROM (s.created_at + interval '3 days' - now())) / 86400 as days_until_available,
  s.total_attempts,
  CASE
    WHEN s.type IN ('EMAIL', 'PHONE') THEN 4 - s.total_attempts
    ELSE NULL
  END as remaining_attempts
FROM (
  SELECT DISTINCT ON (profile_id, type)
    profile_id,
    type,
    created_at,
    COUNT(*) OVER (PARTITION BY profile_id, type) as total_attempts
  FROM public.stamps
  ORDER BY profile_id, type, created_at DESC
) s;

-- Enable RLS on the view
ALTER VIEW public.stamp_request_availability SET (security_invoker = true);

-- Grant select permission to authenticated users on their own data
GRANT SELECT ON public.stamp_request_availability TO authenticated;

-- Add a policy check trigger to prevent requests within 3 days and enforce attempt limits
CREATE OR REPLACE FUNCTION public.check_stamp_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  total_attempts integer;
  last_request_date timestamp with time zone;
  days_since_last interval;
BEGIN
  -- For external provider verifications (EMAIL, PHONE), check total attempts limit
  IF NEW.type IN ('EMAIL', 'PHONE') THEN
    SELECT COUNT(*) INTO total_attempts
    FROM public.stamps
    WHERE profile_id = NEW.profile_id
      AND type = NEW.type;

    IF total_attempts >= 4 THEN
      RAISE EXCEPTION 'Has alcanzado el límite máximo de 4 intentos de verificación de %. No puedes solicitar más verificaciones de este tipo.', NEW.type
        USING ERRCODE = 'P0002';
    END IF;
  END IF;

  -- Check 3-day rate limit for all stamp types
  SELECT created_at INTO last_request_date
  FROM public.stamps
  WHERE profile_id = NEW.profile_id
    AND type = NEW.type
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_request_date IS NOT NULL THEN
    days_since_last := now() - last_request_date;

    IF days_since_last < interval '3 days' THEN
      RAISE EXCEPTION 'Solo puedes solicitar una verificación de % cada 3 días. Por favor, espera antes de solicitar nuevamente.', NEW.type
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS enforce_stamp_rate_limit ON public.stamps;
CREATE TRIGGER enforce_stamp_rate_limit
  BEFORE INSERT ON public.stamps
  FOR EACH ROW
  EXECUTE FUNCTION public.check_stamp_rate_limit();

-- Add comment explaining the rate limit
COMMENT ON FUNCTION public.can_request_stamp IS 'Checks if a user can request a specific stamp type (allows 1 request per type every 3 days, max 4 total attempts for EMAIL/PHONE)';
COMMENT ON VIEW public.stamp_request_availability IS 'Shows when users can next request each stamp type and remaining attempts for external verifications';
COMMENT ON FUNCTION public.check_stamp_rate_limit IS 'Trigger function that enforces 3-day rate limit and attempt limits (max 4 for EMAIL/PHONE) on stamp requests';
