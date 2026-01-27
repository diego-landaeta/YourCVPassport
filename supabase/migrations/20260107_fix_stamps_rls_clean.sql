-- =====================================================
-- CLEAN AND FIX STAMPS RLS POLICIES
-- =====================================================

-- Enable RLS on stamps table
ALTER TABLE public.stamps ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view their own stamps" ON public.stamps;
DROP POLICY IF EXISTS "Admins can view all stamps" ON public.stamps;
DROP POLICY IF EXISTS "Users can insert their own stamps" ON public.stamps;
DROP POLICY IF EXISTS "Admins can insert stamps" ON public.stamps;
DROP POLICY IF EXISTS "Admins can update stamps" ON public.stamps;
DROP POLICY IF EXISTS "Admins can delete stamps" ON public.stamps;
DROP POLICY IF EXISTS "Admins can update any stamp" ON public.stamps;
DROP POLICY IF EXISTS "Admins can delete any stamp" ON public.stamps;
DROP POLICY IF EXISTS "Public can view verified stamps" ON public.stamps;
DROP POLICY IF EXISTS "Public can view verified stamps for public profiles" ON public.stamps;
DROP POLICY IF EXISTS "Users can create own stamps" ON public.stamps;
DROP POLICY IF EXISTS "Users can create their own stamps" ON public.stamps;
DROP POLICY IF EXISTS "Users can delete their own pending stamps" ON public.stamps;
DROP POLICY IF EXISTS "Users can update own pending stamps" ON public.stamps;
DROP POLICY IF EXISTS "Users can update their own stamps" ON public.stamps;
DROP POLICY IF EXISTS "Users can view own stamps" ON public.stamps;

-- Create clean, simple policies

-- 1. SELECT: Users can view their own stamps
CREATE POLICY "Users can view their own stamps"
ON public.stamps FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

-- 2. SELECT: Admins can view all stamps
CREATE POLICY "Admins can view all stamps"
ON public.stamps FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- 3. INSERT: Users can insert their own stamps
CREATE POLICY "Users can insert their own stamps"
ON public.stamps FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- 4. INSERT: Admins can insert any stamps
CREATE POLICY "Admins can insert stamps"
ON public.stamps FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- 5. UPDATE: Admins can update any stamp
CREATE POLICY "Admins can update stamps"
ON public.stamps FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- 6. DELETE: Admins can delete any stamp
CREATE POLICY "Admins can delete stamps"
ON public.stamps FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- Verify final policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'stamps'
ORDER BY cmd, policyname;
