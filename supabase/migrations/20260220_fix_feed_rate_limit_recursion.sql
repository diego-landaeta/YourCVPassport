-- =============================================
-- Fix: infinite recursion in feed_posts RLS
-- Causa: policy "Rate limit post creation" queries feed_posts
-- from within a feed_posts policy → 42P17 infinite recursion
-- Solución: SECURITY DEFINER function bypasses RLS on the subquery
-- =============================================

-- 1. Create helper function that runs outside RLS context
CREATE OR REPLACE FUNCTION public.check_feed_rate_limit()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*)
    FROM public.feed_posts
    WHERE author_id = auth.uid()
      AND created_at > NOW() - INTERVAL '1 minute'
  ) < 5;
$$;

-- 2. Replace the recursive policy with one that calls the function
DROP POLICY IF EXISTS "Rate limit post creation" ON public.feed_posts;

CREATE POLICY "Rate limit post creation"
ON public.feed_posts FOR INSERT
TO authenticated
WITH CHECK (public.check_feed_rate_limit());
