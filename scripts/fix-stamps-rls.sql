-- Fix RLS policies for stamps table to allow users to delete their own pending stamps

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own stamps" ON stamps;
DROP POLICY IF EXISTS "Users can insert their own stamps" ON stamps;
DROP POLICY IF EXISTS "Users can update their own stamps" ON stamps;
DROP POLICY IF EXISTS "Users can delete their own pending stamps" ON stamps;

-- Enable RLS on stamps table
ALTER TABLE stamps ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own stamps
CREATE POLICY "Users can view their own stamps"
ON stamps
FOR SELECT
USING (auth.uid() = profile_id);

-- Policy: Users can insert their own stamps
CREATE POLICY "Users can insert their own stamps"
ON stamps
FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can update their own stamps (only pending ones)
CREATE POLICY "Users can update their own stamps"
ON stamps
FOR UPDATE
USING (auth.uid() = profile_id AND status = 'PENDING')
WITH CHECK (auth.uid() = profile_id);

-- Policy: Users can delete their own pending stamps
CREATE POLICY "Users can delete their own pending stamps"
ON stamps
FOR DELETE
USING (auth.uid() = profile_id AND status = 'PENDING');

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'stamps';
