-- ============================================================
-- MESSAGES TABLE + CONTACT PREFERENCES
-- Feb 26, 2026
-- Creates the messages table (for lead conversations) and
-- adds is_open_to_messages to profiles for opt-out.
-- ============================================================

-- ── 1. Add is_open_to_messages to profiles ──
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_open_to_messages BOOLEAN DEFAULT true;

COMMENT ON COLUMN profiles.is_open_to_messages
  IS 'Whether the user accepts direct messages from other users. Tutors and professionals can disable this.';

-- ── 2. Ensure leads table has all required columns ──
-- The original migration may have been incomplete in the actual DB.
DO $$
BEGIN
  -- Core columns that may be missing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'recipient_id') THEN
    ALTER TABLE leads ADD COLUMN recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'sender_id') THEN
    ALTER TABLE leads ADD COLUMN sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'sender_name') THEN
    ALTER TABLE leads ADD COLUMN sender_name TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'sender_email') THEN
    ALTER TABLE leads ADD COLUMN sender_email TEXT DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'sender_company') THEN
    ALTER TABLE leads ADD COLUMN sender_company TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'message') THEN
    ALTER TABLE leads ADD COLUMN message TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'status') THEN
    ALTER TABLE leads ADD COLUMN status TEXT DEFAULT 'NEW';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'source') THEN
    ALTER TABLE leads ADD COLUMN source TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'metadata') THEN
    ALTER TABLE leads ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
  -- Extended columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'lead_type') THEN
    ALTER TABLE leads ADD COLUMN lead_type TEXT DEFAULT 'contact';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'subject') THEN
    ALTER TABLE leads ADD COLUMN subject TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'position_offered') THEN
    ALTER TABLE leads ADD COLUMN position_offered TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'salary_range') THEN
    ALTER TABLE leads ADD COLUMN salary_range TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'location') THEN
    ALTER TABLE leads ADD COLUMN location TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'last_message_at') THEN
    ALTER TABLE leads ADD COLUMN last_message_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'recipient_name') THEN
    ALTER TABLE leads ADD COLUMN recipient_name TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'company_name') THEN
    ALTER TABLE leads ADD COLUMN company_name TEXT;
  END IF;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_leads_recipient_id ON leads(recipient_id);
CREATE INDEX IF NOT EXISTS idx_leads_sender_id ON leads(sender_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_last_message ON leads(last_message_at DESC NULLS LAST);

-- Ensure RLS is enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Base RLS policies for leads (idempotent)
DROP POLICY IF EXISTS "Users can view their own received leads" ON leads;
CREATE POLICY "Users can view their own received leads"
ON leads FOR SELECT
USING (auth.uid() = leads.recipient_id);

DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
CREATE POLICY "Anyone can insert leads"
ON leads FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own leads" ON leads;
CREATE POLICY "Users can update their own leads"
ON leads FOR UPDATE
USING (auth.uid() = leads.recipient_id);

-- ── 3. Create messages table (for lead conversations) ──
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_messages_lead_id ON messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = false;

-- RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations (sender or recipient of the lead)
DROP POLICY IF EXISTS "Users can view their conversation messages" ON messages;
CREATE POLICY "Users can view their conversation messages"
ON messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = messages.lead_id
    AND (leads.recipient_id = auth.uid() OR leads.sender_id = auth.uid())
  )
);

-- Users can insert messages in their conversations
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON messages;
CREATE POLICY "Users can send messages in their conversations"
ON messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = messages.lead_id
    AND (leads.recipient_id = auth.uid() OR leads.sender_id = auth.uid())
  )
);

-- Users can mark messages as read
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;
CREATE POLICY "Users can mark messages as read"
ON messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM leads
    WHERE leads.id = messages.lead_id
    AND (leads.recipient_id = auth.uid() OR leads.sender_id = auth.uid())
  )
);

-- ── 4. Trigger: update leads.last_message_at on new message ──
CREATE OR REPLACE FUNCTION update_lead_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE leads SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_lead_on_message ON messages;
CREATE TRIGGER trigger_update_lead_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_lead_last_message();

-- ── 5. Helper: get unread message count for a user ──
CREATE OR REPLACE FUNCTION get_user_unread_messages_count(p_user_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(COUNT(*)::INTEGER, 0)
  FROM messages m
  JOIN leads l ON l.id = m.lead_id
  WHERE l.recipient_id = p_user_id
    AND m.sender_id != p_user_id
    AND m.is_read = false;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ── 6. Update leads RLS: allow sender to view their own sent leads ──
DROP POLICY IF EXISTS "Senders can view their own leads" ON leads;
CREATE POLICY "Senders can view their own leads"
ON leads FOR SELECT
USING (auth.uid() = leads.sender_id);
