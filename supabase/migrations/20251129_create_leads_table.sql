-- Migration: Create leads table
-- Date: 2025-11-29
-- Description: Create leads table to track profile visitor contacts and messages

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Lead information
  sender_name VARCHAR(255) NOT NULL,
  sender_email VARCHAR(255) NOT NULL,
  sender_phone VARCHAR(50),
  sender_company VARCHAR(255),
  message TEXT,

  -- Profile owner (recipient of the lead)
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN ('NEW', 'READ', 'CONTACTED', 'ARCHIVED')),

  -- Additional metadata
  source VARCHAR(100), -- e.g., 'cv_page', 'contact_button'
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_recipient_id ON leads(recipient_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_recipient_status ON leads(recipient_id, status);

-- Enable RLS
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Anyone can insert leads (public can submit contact forms)
DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
CREATE POLICY "Anyone can insert leads"
ON leads
FOR INSERT
WITH CHECK (true);

-- Users can view their own leads
DROP POLICY IF EXISTS "Users can view their own leads" ON leads;
CREATE POLICY "Users can view their own leads"
ON leads
FOR SELECT
USING (auth.uid() = leads.recipient_id);

-- Users can update their own leads (mark as read, contacted, etc.)
DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
CREATE POLICY "Users can update their own leads"
ON leads
FOR UPDATE
USING (auth.uid() = leads.recipient_id);

-- Users can delete their own leads
DROP POLICY IF EXISTS "Users can delete their own leads" ON leads;
CREATE POLICY "Users can delete their own leads"
ON leads
FOR DELETE
USING (auth.uid() = leads.recipient_id);

-- Admins can do everything
DROP POLICY IF EXISTS "Admins can do everything with leads" ON leads;
CREATE POLICY "Admins can do everything with leads"
ON leads
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Add table and column comments
COMMENT ON TABLE leads IS 'Stores contact requests and messages from profile visitors';
COMMENT ON COLUMN leads.recipient_id IS 'Profile owner who receives this lead';
COMMENT ON COLUMN leads.status IS 'Current status of the lead (NEW, READ, CONTACTED, ARCHIVED)';
COMMENT ON COLUMN leads.source IS 'Source of the lead submission';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_leads_updated_at_trigger ON leads;
CREATE TRIGGER update_leads_updated_at_trigger
BEFORE UPDATE ON leads
FOR EACH ROW
EXECUTE FUNCTION update_leads_updated_at();
