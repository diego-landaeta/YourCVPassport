-- =============================================
-- Add POLL and EVENT content types + poll votes table
-- =============================================

-- 1. Update CHECK constraint on content_type
ALTER TABLE public.feed_posts DROP CONSTRAINT IF EXISTS feed_posts_content_type_check;
ALTER TABLE public.feed_posts ADD CONSTRAINT feed_posts_content_type_check
  CHECK (content_type IN (
    'TEXT', 'IMAGE', 'ACHIEVEMENT', 'MILESTONE',
    'JOB_UPDATE', 'PROFILE_COMPLETE', 'POLL', 'EVENT'
  ));

-- 2. Poll votes table
CREATE TABLE IF NOT EXISTS public.feed_poll_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    option_index INTEGER NOT NULL CHECK (option_index >= 0 AND option_index < 4),
    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_poll_votes_post ON public.feed_poll_votes(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_poll_votes_user ON public.feed_poll_votes(user_id);

-- RLS
ALTER TABLE public.feed_poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view poll votes"
ON public.feed_poll_votes FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can vote on polls"
ON public.feed_poll_votes FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own vote"
ON public.feed_poll_votes FOR DELETE
TO authenticated
USING (user_id = auth.uid());

COMMENT ON TABLE public.feed_poll_votes IS 'Per-user votes on poll posts';

-- 3. RPC to aggregate poll vote counts by option
CREATE OR REPLACE FUNCTION public.get_poll_vote_counts(poll_post_ids UUID[])
RETURNS TABLE(post_id UUID, option_index INTEGER, count BIGINT)
LANGUAGE sql STABLE
AS $$
  SELECT v.post_id, v.option_index, COUNT(*)::BIGINT as count
  FROM public.feed_poll_votes v
  WHERE v.post_id = ANY(poll_post_ids)
  GROUP BY v.post_id, v.option_index;
$$;
