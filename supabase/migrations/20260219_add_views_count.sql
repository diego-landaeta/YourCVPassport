-- =============================================
-- Add views_count to feed_posts
-- =============================================

-- 1. Add column
ALTER TABLE public.feed_posts
ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0 NOT NULL;

-- 2. RPC to batch-increment view counts (prevents abuse with DISTINCT)
CREATE OR REPLACE FUNCTION public.increment_post_views(post_ids UUID[])
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.feed_posts
  SET views_count = views_count + 1
  WHERE id = ANY(post_ids);
END;
$$;
