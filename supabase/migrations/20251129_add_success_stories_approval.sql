-- Migration: Add user_id and approved fields to success_stories table
-- Date: 2025-11-29
-- Description: Allow users to submit success stories from their dashboard with admin approval workflow

-- Add new columns to success_stories table
ALTER TABLE success_stories
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_success_stories_user_id ON success_stories(user_id);
CREATE INDEX IF NOT EXISTS idx_success_stories_approved ON success_stories(approved);

-- Update RLS policies
ALTER TABLE success_stories ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can view approved stories
DROP POLICY IF EXISTS "Anyone can view approved success stories" ON success_stories;
CREATE POLICY "Anyone can view approved success stories"
ON success_stories
FOR SELECT
USING (approved = TRUE);

-- Policy: Authenticated users can view their own stories (approved or not)
DROP POLICY IF EXISTS "Users can view their own success stories" ON success_stories;
CREATE POLICY "Users can view their own success stories"
ON success_stories
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert their own stories
DROP POLICY IF EXISTS "Users can insert their own success stories" ON success_stories;
CREATE POLICY "Users can insert their own success stories"
ON success_stories
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own unapproved stories
DROP POLICY IF EXISTS "Users can update their own unapproved stories" ON success_stories;
CREATE POLICY "Users can update their own unapproved stories"
ON success_stories
FOR UPDATE
USING (auth.uid() = user_id AND approved = FALSE);

-- Policy: Users can delete their own unapproved stories
DROP POLICY IF EXISTS "Users can delete their own unapproved stories" ON success_stories;
CREATE POLICY "Users can delete their own unapproved stories"
ON success_stories
FOR DELETE
USING (auth.uid() = user_id AND approved = FALSE);

-- Policy: Admins can do everything (check profiles table for admin role)
DROP POLICY IF EXISTS "Admins can do everything with success stories" ON success_stories;
CREATE POLICY "Admins can do everything with success stories"
ON success_stories
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add comment to table
COMMENT ON COLUMN success_stories.user_id IS 'User who submitted this success story';
COMMENT ON COLUMN success_stories.approved IS 'Whether this story has been approved by an admin';
COMMENT ON COLUMN success_stories.submitted_at IS 'When this story was initially submitted';
