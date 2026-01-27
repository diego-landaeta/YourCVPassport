-- Add public read policy for stamps to allow talent search to show verified badges
-- This only exposes stamps with status VERIFIED for public profiles

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can view verified stamps for public profiles" ON public.stamps;

-- Create policy to allow reading verified stamps for public profiles
CREATE POLICY "Public can view verified stamps for public profiles"
ON public.stamps FOR SELECT
USING (
  status = 'VERIFIED'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = stamps.profile_id
    AND profiles.is_public = true
  )
);

-- Add comment explaining the policy
COMMENT ON POLICY "Public can view verified stamps for public profiles" ON public.stamps
IS 'Allows anyone to see verified stamps for public profiles, used for talent search priority sorting and verification badges';
