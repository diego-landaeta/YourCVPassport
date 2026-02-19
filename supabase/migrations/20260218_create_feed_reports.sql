-- Feed Reports Table
-- Allows users to report inappropriate posts for moderation review

CREATE TABLE IF NOT EXISTS feed_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES feed_posts(id) ON DELETE CASCADE,
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'inappropriate', 'misinformation', 'other')),
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Prevent duplicate reports from same user for same post
  UNIQUE(post_id, reported_by)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feed_reports_post_id ON feed_reports(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_reports_status ON feed_reports(status);
CREATE INDEX IF NOT EXISTS idx_feed_reports_reported_by ON feed_reports(reported_by);

-- RLS
ALTER TABLE feed_reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports (one per post)
CREATE POLICY "Users can create reports"
  ON feed_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON feed_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

-- Admins can view and manage all reports
CREATE POLICY "Admins can manage all reports"
  ON feed_reports FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
