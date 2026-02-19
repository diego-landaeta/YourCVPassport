-- =============================================
-- FEED_BOOKMARKS - Publicaciones guardadas
-- =============================================

CREATE TABLE IF NOT EXISTS public.feed_bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    post_id UUID NOT NULL REFERENCES public.feed_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

    UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feed_bookmarks_user ON public.feed_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_bookmarks_post ON public.feed_bookmarks(post_id);

-- RLS
ALTER TABLE public.feed_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
ON public.feed_bookmarks FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can add bookmarks"
ON public.feed_bookmarks FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can remove own bookmarks"
ON public.feed_bookmarks FOR DELETE
TO authenticated
USING (user_id = auth.uid());

COMMENT ON TABLE public.feed_bookmarks IS 'Publicaciones guardadas por usuarios';
