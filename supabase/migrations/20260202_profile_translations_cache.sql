-- Profile Translations Cache
-- Stores translated profile content to avoid repeated API calls

CREATE TABLE IF NOT EXISTS profile_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_language VARCHAR(5) NOT NULL, -- 'es' or 'en'

    -- Translated content (JSON with all translated fields)
    translated_content JSONB NOT NULL,

    -- Hash of source content to detect changes
    source_content_hash VARCHAR(64) NOT NULL,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: one translation per profile per language
    UNIQUE(profile_id, target_language)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_profile_translations_lookup
ON profile_translations(profile_id, target_language);

-- Index for cleanup of old translations
CREATE INDEX IF NOT EXISTS idx_profile_translations_updated
ON profile_translations(updated_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_translations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_profile_translations_updated_at ON profile_translations;
CREATE TRIGGER trigger_profile_translations_updated_at
    BEFORE UPDATE ON profile_translations
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_translations_updated_at();

-- Enable RLS
ALTER TABLE profile_translations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read translations (public profiles)
CREATE POLICY "Anyone can read profile translations"
ON profile_translations FOR SELECT
USING (true);

-- Policy: Anyone can insert translations (for caching by any visitor)
-- This is safe because translations are derived from public profile data
CREATE POLICY "Anyone can insert profile translations"
ON profile_translations FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can update translations (for refreshing cache)
CREATE POLICY "Anyone can update profile translations"
ON profile_translations FOR UPDATE
USING (true);

-- Policy: Only admins can delete translations (via service role or admin)
CREATE POLICY "Service role can delete translations"
ON profile_translations FOR DELETE
TO service_role
USING (true);

COMMENT ON TABLE profile_translations IS 'Cache for translated profile content to reduce API translation calls';
