-- =============================================
-- Feed: Storage bucket + post rate limiting
-- =============================================

-- 1. Create feed-images storage bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'feed-images',
  'feed-images',
  true,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies (drop if exist to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload feed images" ON storage.objects;
CREATE POLICY "Authenticated users can upload feed images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'feed-images');

DROP POLICY IF EXISTS "Anyone can view feed images" ON storage.objects;
CREATE POLICY "Anyone can view feed images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'feed-images');

DROP POLICY IF EXISTS "Users can delete own feed images" ON storage.objects;
CREATE POLICY "Users can delete own feed images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'feed-images' AND (storage.foldername(name))[1] = auth.uid()::TEXT);

-- 3. Rate limit: max 5 posts per minute per user (RLS policy)
DROP POLICY IF EXISTS "Rate limit post creation" ON public.feed_posts;
CREATE POLICY "Rate limit post creation"
ON public.feed_posts FOR INSERT
TO authenticated
WITH CHECK (
  (
    SELECT COUNT(*)
    FROM public.feed_posts
    WHERE author_id = auth.uid()
      AND created_at > NOW() - INTERVAL '1 minute'
  ) < 5
);
