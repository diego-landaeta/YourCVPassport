-- Migration: Create company messages and conversations system
-- Created: 2025-12-30
-- Description: Allows companies to send messages to talent profiles with credit-based system

-- Create conversations table
CREATE TABLE IF NOT EXISTS company_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'blocked')),
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Metadata
  credits_used INTEGER NOT NULL DEFAULT 0,
  company_user_id UUID REFERENCES company_users(id) ON DELETE SET NULL,

  -- Unique conversation per company-profile pair
  UNIQUE(company_id, profile_id)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS company_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES company_conversations(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('company', 'talent')),
  sender_id UUID NOT NULL, -- company_user_id or profile_id depending on sender_type
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Attachments (optional)
  attachments JSONB DEFAULT '[]'::jsonb
);

-- Create message credits log
CREATE TABLE IF NOT EXISTS company_message_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES company_conversations(id) ON DELETE SET NULL,
  credits_used INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'initial_contact', 'message_sent'
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES company_users(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX idx_company_conversations_company_id ON company_conversations(company_id);
CREATE INDEX idx_company_conversations_profile_id ON company_conversations(profile_id);
CREATE INDEX idx_company_conversations_status ON company_conversations(status);
CREATE INDEX idx_company_conversations_last_message ON company_conversations(last_message_at DESC);

CREATE INDEX idx_company_messages_conversation_id ON company_messages(conversation_id);
CREATE INDEX idx_company_messages_created_at ON company_messages(created_at DESC);
CREATE INDEX idx_company_messages_is_read ON company_messages(is_read) WHERE is_read = FALSE;

CREATE INDEX idx_company_message_credits_company_id ON company_message_credits(company_id);
CREATE INDEX idx_company_message_credits_created_at ON company_message_credits(created_at DESC);

-- Update trigger for conversations
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE company_conversations
  SET
    last_message_at = NEW.created_at,
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON company_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- RLS Policies
ALTER TABLE company_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_message_credits ENABLE ROW LEVEL SECURITY;

-- Companies can view their own conversations
CREATE POLICY company_conversations_select_policy ON company_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_conversations.company_id
    )
  );

-- Companies can insert conversations (with credit check handled by app)
CREATE POLICY company_conversations_insert_policy ON company_conversations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_conversations.company_id
    )
  );

-- Companies can update their own conversations
CREATE POLICY company_conversations_update_policy ON company_conversations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_conversations.company_id
    )
  );

-- Profiles can view conversations where they are the recipient
CREATE POLICY profiles_conversations_select_policy ON company_conversations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = company_conversations.profile_id
    )
  );

-- Messages: Companies can view messages in their conversations
CREATE POLICY company_messages_select_policy ON company_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_conversations cc
      INNER JOIN company_users cu ON cu.company_id = cc.company_id
      WHERE cc.id = company_messages.conversation_id
    )
  );

-- Messages: Companies can insert messages
CREATE POLICY company_messages_insert_policy ON company_messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'company' AND
    EXISTS (
      SELECT 1 FROM company_conversations cc
      INNER JOIN company_users cu ON cu.company_id = cc.company_id
      WHERE cc.id = company_messages.conversation_id
    )
  );

-- Messages: Profiles can view their messages
CREATE POLICY profiles_messages_select_policy ON company_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_conversations cc
      INNER JOIN profiles p ON p.id = cc.profile_id
      WHERE cc.id = company_messages.conversation_id
    )
  );

-- Messages: Profiles can insert replies
CREATE POLICY profiles_messages_insert_policy ON company_messages
  FOR INSERT
  WITH CHECK (
    sender_type = 'talent' AND
    EXISTS (
      SELECT 1 FROM company_conversations cc
      INNER JOIN profiles p ON p.id = cc.profile_id
      WHERE cc.id = company_messages.conversation_id
    )
  );

-- Messages: Allow updating read status
CREATE POLICY messages_update_read_policy ON company_messages
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM company_conversations cc
      WHERE cc.id = company_messages.conversation_id
        AND (
          EXISTS (SELECT 1 FROM company_users cu WHERE cu.company_id = cc.company_id)
          OR EXISTS (SELECT 1 FROM profiles p WHERE p.id = cc.profile_id)
        )
    )
  );

-- Credit logs: Companies can view their own credit usage
CREATE POLICY company_message_credits_select_policy ON company_message_credits
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_message_credits.company_id
    )
  );

-- Credit logs: System can insert (handled by app logic)
CREATE POLICY company_message_credits_insert_policy ON company_message_credits
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_users cu
      WHERE cu.company_id = company_message_credits.company_id
    )
  );

-- Function to get unread message count for a company
CREATE OR REPLACE FUNCTION get_company_unread_messages_count(p_company_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM company_messages cm
  INNER JOIN company_conversations cc ON cm.conversation_id = cc.id
  WHERE cc.company_id = p_company_id
    AND cm.sender_type = 'talent'
    AND cm.is_read = FALSE;
$$ LANGUAGE SQL STABLE;

-- Function to get unread message count for a profile
CREATE OR REPLACE FUNCTION get_profile_unread_messages_count(p_profile_id UUID)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM company_messages cm
  INNER JOIN company_conversations cc ON cm.conversation_id = cc.id
  WHERE cc.profile_id = p_profile_id
    AND cm.sender_type = 'company'
    AND cm.is_read = FALSE;
$$ LANGUAGE SQL STABLE;

-- Comments
COMMENT ON TABLE company_conversations IS 'Conversations between companies and talent profiles';
COMMENT ON TABLE company_messages IS 'Messages within company-talent conversations';
COMMENT ON TABLE company_message_credits IS 'Log of credits used for messaging';
COMMENT ON COLUMN company_conversations.credits_used IS 'Total credits consumed in this conversation';
COMMENT ON COLUMN company_messages.sender_type IS 'Either company or talent';
