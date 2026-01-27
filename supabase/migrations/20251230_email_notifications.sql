-- Migration: Email Notifications System
-- Created: 2025-12-30
-- Description: Triggers and functions to send automated emails via Edge Function

-- Function to send email via Edge Function
CREATE OR REPLACE FUNCTION send_email_notification(
  p_to_email TEXT,
  p_template TEXT,
  p_data JSONB
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call Edge Function to send email (async, fire-and-forget)
  PERFORM
    net.http_post(
      url := current_setting('app.settings.supabase_url') || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
      ),
      body := jsonb_build_object(
        'to', p_to_email,
        'template', p_template,
        'data', p_data
      )
    );
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main transaction
    RAISE WARNING 'Failed to send email: %', SQLERRM;
END;
$$;

-- Trigger: Send email when company is approved
CREATE OR REPLACE FUNCTION notify_company_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dashboard_url TEXT;
BEGIN
  -- Only send if status changed to APPROVED
  IF NEW.status = 'APPROVED' AND (OLD.status IS NULL OR OLD.status != 'APPROVED') THEN
    v_dashboard_url := current_setting('app.settings.app_url', true) || '/company/dashboard';

    PERFORM send_email_notification(
      NEW.company_email,
      'company-approved',
      jsonb_build_object(
        'companyName', NEW.company_name,
        'dashboardUrl', v_dashboard_url,
        'welcomeCredits', 10,
        'adminNotes', NEW.admin_notes
      )
    );

    -- Add welcome credits
    UPDATE companies
    SET credit_balance = credit_balance + 10
    WHERE id = NEW.id;

    -- Log the welcome credits
    INSERT INTO company_credits_history (
      company_id,
      amount,
      balance_after,
      transaction_type,
      description,
      created_by
    ) VALUES (
      NEW.id,
      10,
      NEW.credit_balance + 10,
      'ADMIN_ADJUSTMENT',
      'Welcome bonus - Company approved',
      NEW.verified_by
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_company_approved
  AFTER UPDATE ON companies
  FOR EACH ROW
  WHEN (NEW.status = 'APPROVED' AND (OLD.status IS DISTINCT FROM 'APPROVED'))
  EXECUTE FUNCTION notify_company_approved();

-- Trigger: Send email when company is rejected
CREATE OR REPLACE FUNCTION notify_company_rejected()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'REJECTED' AND (OLD.status IS NULL OR OLD.status != 'REJECTED') THEN
    PERFORM send_email_notification(
      NEW.company_email,
      'company-rejected',
      jsonb_build_object(
        'companyName', NEW.company_name,
        'reason', NEW.rejection_reason
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_company_rejected
  AFTER UPDATE ON companies
  FOR EACH ROW
  WHEN (NEW.status = 'REJECTED' AND (OLD.status IS DISTINCT FROM 'REJECTED'))
  EXECUTE FUNCTION notify_company_rejected();

-- Trigger: Send email on new message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation company_conversations%ROWTYPE;
  v_profile profiles%ROWTYPE;
  v_company companies%ROWTYPE;
  v_recipient_email TEXT;
  v_sender_name TEXT;
  v_conversation_url TEXT;
  v_app_url TEXT;
BEGIN
  -- Get conversation details
  SELECT * INTO v_conversation
  FROM company_conversations
  WHERE id = NEW.conversation_id;

  v_app_url := current_setting('app.settings.app_url', true);

  -- Determine recipient based on sender type
  IF NEW.sender_type = 'company' THEN
    -- Message from company to talent
    SELECT * INTO v_profile
    FROM profiles
    WHERE id = v_conversation.profile_id;

    SELECT * INTO v_company
    FROM companies
    WHERE id = v_conversation.company_id;

    v_recipient_email := v_profile.email;
    v_sender_name := v_company.company_name;
    v_conversation_url := v_app_url || '/dashboard/leads?conversation=' || NEW.conversation_id;
  ELSE
    -- Message from talent to company
    SELECT * INTO v_company
    FROM companies
    WHERE id = v_conversation.company_id;

    SELECT * INTO v_profile
    FROM profiles
    WHERE id = v_conversation.profile_id;

    v_recipient_email := v_company.company_email;
    v_sender_name := COALESCE(v_profile.full_name, v_profile.email);
    v_conversation_url := v_app_url || '/company/messages?conversation=' || NEW.conversation_id;
  END IF;

  -- Send email notification
  PERFORM send_email_notification(
    v_recipient_email,
    'new-message',
    jsonb_build_object(
      'senderName', v_sender_name,
      'messagePreview', LEFT(NEW.message, 200),
      'sentAt', NEW.created_at,
      'conversationUrl', v_conversation_url,
      'unsubscribeUrl', v_app_url || '/settings/notifications'
    )
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_new_message
  AFTER INSERT ON company_messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- Trigger: Send email when team member is added
CREATE OR REPLACE FUNCTION notify_team_member_added()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company companies%ROWTYPE;
  v_user_profile profiles%ROWTYPE;
  v_inviter_profile profiles%ROWTYPE;
  v_dashboard_url TEXT;
BEGIN
  -- Only for new members (not on update)
  IF TG_OP = 'INSERT' THEN
    SELECT * INTO v_company
    FROM companies
    WHERE id = NEW.company_id;

    SELECT * INTO v_user_profile
    FROM profiles
    WHERE id = NEW.user_id;

    IF NEW.invited_by IS NOT NULL THEN
      SELECT * INTO v_inviter_profile
      FROM profiles
      WHERE id = NEW.invited_by;
    END IF;

    v_dashboard_url := current_setting('app.settings.app_url', true) || '/company/dashboard';

    PERFORM send_email_notification(
      v_user_profile.email,
      'welcome-team-member',
      jsonb_build_object(
        'userName', COALESCE(v_user_profile.full_name, v_user_profile.email),
        'companyName', v_company.company_name,
        'role', NEW.role,
        'invitedBy', COALESCE(v_inviter_profile.full_name, v_inviter_profile.email, 'el administrador'),
        'dashboardUrl', v_dashboard_url
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_team_member_added
  AFTER INSERT ON company_users
  FOR EACH ROW
  EXECUTE FUNCTION notify_team_member_added();

-- Trigger: Send email when credits are low (< 10)
CREATE OR REPLACE FUNCTION notify_low_credits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_purchase_url TEXT;
BEGIN
  -- Check if credits dropped below threshold
  IF NEW.credit_balance < 10 AND (OLD.credit_balance IS NULL OR OLD.credit_balance >= 10) THEN
    v_purchase_url := current_setting('app.settings.app_url', true) || '/company/credits';

    PERFORM send_email_notification(
      NEW.company_email,
      'low-credits',
      jsonb_build_object(
        'companyName', NEW.company_name,
        'creditsRemaining', NEW.credit_balance,
        'purchaseUrl', v_purchase_url
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_low_credits
  AFTER UPDATE ON companies
  FOR EACH ROW
  WHEN (NEW.credit_balance < 10 AND (OLD.credit_balance IS NULL OR OLD.credit_balance >= 10))
  EXECUTE FUNCTION notify_low_credits();

-- Trigger: Send email on credit purchase
CREATE OR REPLACE FUNCTION notify_credit_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_company companies%ROWTYPE;
  v_dashboard_url TEXT;
BEGIN
  -- Only for purchases (positive amounts)
  IF NEW.transaction_type = 'PURCHASE' AND NEW.amount > 0 THEN
    SELECT * INTO v_company
    FROM companies
    WHERE id = NEW.company_id;

    v_dashboard_url := current_setting('app.settings.app_url', true) || '/company/dashboard';

    PERFORM send_email_notification(
      v_company.company_email,
      'credit-purchase',
      jsonb_build_object(
        'companyName', v_company.company_name,
        'credits', NEW.amount,
        'price', (NEW.metadata->>'price')::numeric,
        'packageName', NEW.description,
        'newBalance', NEW.balance_after,
        'purchaseDate', NEW.created_at,
        'transactionId', NEW.id,
        'dashboardUrl', v_dashboard_url
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_credit_purchase
  AFTER INSERT ON company_credits_history
  FOR EACH ROW
  WHEN (NEW.transaction_type = 'PURCHASE' AND NEW.amount > 0)
  EXECUTE FUNCTION notify_credit_purchase();

-- Comments
COMMENT ON FUNCTION send_email_notification IS 'Sends email via Edge Function (async)';
COMMENT ON FUNCTION notify_company_approved IS 'Sends welcome email when company is approved';
COMMENT ON FUNCTION notify_company_rejected IS 'Sends notification when company is rejected';
COMMENT ON FUNCTION notify_new_message IS 'Sends email on new message in conversation';
COMMENT ON FUNCTION notify_team_member_added IS 'Welcomes new team members via email';
COMMENT ON FUNCTION notify_low_credits IS 'Alerts when credits are running low';
COMMENT ON FUNCTION notify_credit_purchase IS 'Confirms credit purchase via email';
