-- Text Translations Cache
-- Stores individual text translations to avoid repeated API calls
-- This cache is shared across all users for efficiency

CREATE TABLE IF NOT EXISTS text_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Hash of original text for fast lookup
    text_hash VARCHAR(16) NOT NULL,

    -- Languages
    source_lang VARCHAR(5) NOT NULL, -- 'es' or 'en'
    target_lang VARCHAR(5) NOT NULL, -- 'es' or 'en'

    -- Content
    original_text TEXT NOT NULL,
    translated_text TEXT NOT NULL,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    hit_count INTEGER DEFAULT 1, -- Track popularity for cache optimization

    -- Unique constraint: one translation per text per language pair
    UNIQUE(text_hash, source_lang, target_lang)
);

-- Index for fast lookups by hash
CREATE INDEX IF NOT EXISTS idx_text_translations_lookup
ON text_translations(text_hash, source_lang, target_lang);

-- Index for cleanup of old/unused translations
CREATE INDEX IF NOT EXISTS idx_text_translations_created
ON text_translations(created_at);

-- Enable RLS
ALTER TABLE text_translations ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read translations (public cache)
CREATE POLICY "Anyone can read text translations"
ON text_translations FOR SELECT
USING (true);

-- Policy: Anyone can insert translations (for caching by any visitor)
CREATE POLICY "Anyone can insert text translations"
ON text_translations FOR INSERT
WITH CHECK (true);

-- Policy: Anyone can update translations (for hit count)
CREATE POLICY "Anyone can update text translations"
ON text_translations FOR UPDATE
USING (true);

-- Policy: Only service role can delete (for cleanup)
CREATE POLICY "Service role can delete text translations"
ON text_translations FOR DELETE
TO service_role
USING (true);

-- Function to increment hit count on cache hit
CREATE OR REPLACE FUNCTION increment_translation_hit_count(p_text_hash VARCHAR, p_source_lang VARCHAR, p_target_lang VARCHAR)
RETURNS VOID AS $$
BEGIN
    UPDATE text_translations
    SET hit_count = hit_count + 1
    WHERE text_hash = p_text_hash
      AND source_lang = p_source_lang
      AND target_lang = p_target_lang;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE text_translations IS 'Shared cache for text translations to reduce API translation calls';
