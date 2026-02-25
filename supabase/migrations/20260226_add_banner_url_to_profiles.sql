-- Add banner_url column to profiles for customizable feed profile banners
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT NULL;

-- Allow users to update their own banner
COMMENT ON COLUMN profiles.banner_url IS 'URL for the user feed profile banner image';
