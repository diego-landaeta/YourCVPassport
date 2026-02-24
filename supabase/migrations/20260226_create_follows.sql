-- =============================================
-- Follow System
-- =============================================

CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Who is following
    follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Who is being followed
    following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Prevent self-follow and duplicate follows
    CONSTRAINT no_self_follow CHECK (follower_id != following_id),
    UNIQUE(follower_id, following_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_follows_follower ON public.follows(follower_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id, created_at DESC);

-- RLS
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see follows
CREATE POLICY "Anyone can view follows"
ON public.follows FOR SELECT
TO authenticated
USING (true);

-- Users can only follow as themselves
CREATE POLICY "Users can follow others"
ON public.follows FOR INSERT
TO authenticated
WITH CHECK (follower_id = auth.uid());

-- Users can only unfollow their own follows
CREATE POLICY "Users can unfollow"
ON public.follows FOR DELETE
TO authenticated
USING (follower_id = auth.uid());

-- Add 'follow' to feed_notifications type check
-- (Must alter the existing constraint)
DO $$
BEGIN
    ALTER TABLE public.feed_notifications DROP CONSTRAINT IF EXISTS feed_notifications_type_check;
    ALTER TABLE public.feed_notifications ADD CONSTRAINT feed_notifications_type_check
        CHECK (type IN ('reaction', 'comment', 'reply', 'mention', 'repost', 'follow'));
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not update feed_notifications type constraint: %', SQLERRM;
END $$;

COMMENT ON TABLE public.follows IS 'Follow system for user-to-user social connections';
