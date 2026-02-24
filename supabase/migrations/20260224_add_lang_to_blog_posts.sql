-- Add lang column to blog_posts for bilingual content support
-- Run this in Supabase SQL Editor

ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS lang VARCHAR(2) DEFAULT 'es';

-- Add index for fast lang filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_lang ON blog_posts(lang);

-- Backfill any existing posts without a lang
UPDATE blog_posts SET lang = 'es' WHERE lang IS NULL;
