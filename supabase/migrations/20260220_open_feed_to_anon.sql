-- =============================================
-- Open feed public read to anon (unauthenticated) users
-- Required for the public /feed and /comunidad pages
-- =============================================

-- feed_posts: allow anon to read public, non-hidden posts
DROP POLICY IF EXISTS "Users can view public posts" ON public.feed_posts;
CREATE POLICY "Anyone can view public posts"
ON public.feed_posts FOR SELECT
TO anon, authenticated
USING (visibility = 'PUBLIC' AND is_hidden = false);

-- Keep the authenticated-only policy for viewing own private/hidden posts
DROP POLICY IF EXISTS "Users can view own posts" ON public.feed_posts;
CREATE POLICY "Users can view own posts"
ON public.feed_posts FOR SELECT
TO authenticated
USING (author_id = auth.uid());

-- feed_likes: allow anon to read like counts
DROP POLICY IF EXISTS "Anyone can view likes" ON public.feed_likes;
CREATE POLICY "Anyone can view likes"
ON public.feed_likes FOR SELECT
TO anon, authenticated
USING (true);

-- feed_comments: allow anon to read comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.feed_comments;
CREATE POLICY "Anyone can view comments"
ON public.feed_comments FOR SELECT
TO anon, authenticated
USING (is_hidden = false);

-- feed_shares: allow anon to read share counts
DROP POLICY IF EXISTS "Anyone can view shares" ON public.feed_shares;
CREATE POLICY "Anyone can view shares"
ON public.feed_shares FOR SELECT
TO anon, authenticated
USING (true);

-- feed_comment_likes: allow anon to read comment like counts
DROP POLICY IF EXISTS "Anyone can view comment likes" ON public.feed_comment_likes;
CREATE POLICY "Anyone can view comment likes"
ON public.feed_comment_likes FOR SELECT
TO anon, authenticated
USING (true);
