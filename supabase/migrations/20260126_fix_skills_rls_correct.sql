-- Fix skills RLS policy to match talent search visibility logic
-- Skills should be visible for profiles that appear in talent search:
-- - Have full_name and headline
-- - Are not admin users

-- Drop the old restrictive policies
DROP POLICY IF EXISTS "Public can view skills of public profiles" ON public.skills;

-- Create a policy that matches the talent search logic
-- Skills are viewable if the profile has basic info and isn't an admin
CREATE POLICY "Public can view skills of searchable profiles"
    ON public.skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = skills.profile_id
            AND profiles.full_name IS NOT NULL
            AND profiles.full_name != ''
            AND profiles.headline IS NOT NULL
            AND profiles.headline != ''
            AND profiles.role != 'admin'
        )
    );

-- Apply the same fix to languages table
DROP POLICY IF EXISTS "Public can view languages of public profiles" ON public.languages;

CREATE POLICY "Public can view languages of searchable profiles"
    ON public.languages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = languages.profile_id
            AND profiles.full_name IS NOT NULL
            AND profiles.full_name != ''
            AND profiles.headline IS NOT NULL
            AND profiles.headline != ''
            AND profiles.role != 'admin'
        )
    );

-- Add comments explaining the policies
COMMENT ON POLICY "Public can view skills of searchable profiles" ON public.skills
IS 'Allows viewing skills for profiles that appear in talent search (have name/headline, are not admin)';

COMMENT ON POLICY "Public can view languages of searchable profiles" ON public.languages
IS 'Allows viewing languages for profiles that appear in talent search (have name/headline, are not admin)';
