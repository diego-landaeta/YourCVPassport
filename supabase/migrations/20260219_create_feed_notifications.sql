-- =============================================
-- Feed Notifications
-- =============================================

CREATE TABLE IF NOT EXISTS public.feed_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Who receives the notification
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Who triggered the notification
    actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    -- Type: reaction, comment, reply, mention, repost
    type TEXT NOT NULL CHECK (type IN ('reaction', 'comment', 'reply', 'mention', 'repost')),

    -- Related post (nullable for future non-post notifications)
    post_id UUID REFERENCES public.feed_posts(id) ON DELETE CASCADE,

    -- Related comment (for reply notifications)
    comment_id UUID REFERENCES public.feed_comments(id) ON DELETE CASCADE,

    -- Read status
    is_read BOOLEAN DEFAULT false NOT NULL,

    -- Prevent duplicate notifications (same actor+type+post within short time)
    UNIQUE(user_id, actor_id, type, post_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_notifications_user ON public.feed_notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_notifications_unread ON public.feed_notifications(user_id, is_read) WHERE is_read = false;

-- RLS
ALTER TABLE public.feed_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
ON public.feed_notifications FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Any authenticated user can create notifications (triggered by actions)
CREATE POLICY "Authenticated users can create notifications"
ON public.feed_notifications FOR INSERT
TO authenticated
WITH CHECK (actor_id = auth.uid() AND user_id != auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.feed_notifications FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
ON public.feed_notifications FOR DELETE
TO authenticated
USING (user_id = auth.uid());

COMMENT ON TABLE public.feed_notifications IS 'Feed notification system for reactions, comments, replies, mentions, and reposts';
