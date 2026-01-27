-- ============================================================
-- SETUP: Funciones de créditos para empresas
-- ============================================================
-- Ejecutar ANTES del script de datos de prueba
-- Este script crea las funciones RPC necesarias para el sistema de créditos
-- ============================================================

-- ===========================================
-- PASO 1: Crear tabla company_profile_views si no existe
-- ===========================================
CREATE TABLE IF NOT EXISTS public.company_profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_by UUID REFERENCES auth.users(id),
    credits_used INTEGER DEFAULT 0,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, profile_id)
);

-- RLS para company_profile_views
ALTER TABLE public.company_profile_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view their profile views" ON public.company_profile_views;
CREATE POLICY "Company members can view their profile views"
ON public.company_profile_views FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = company_profile_views.company_id
        AND company_users.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Company members can insert profile views" ON public.company_profile_views;
CREATE POLICY "Company members can insert profile views"
ON public.company_profile_views FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = company_profile_views.company_id
        AND company_users.user_id = auth.uid()
    )
);

-- ===========================================
-- PASO 2: Crear tabla company_exports si no existe
-- ===========================================
CREATE TABLE IF NOT EXISTS public.company_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    export_type VARCHAR(50) DEFAULT 'cv_download',
    format VARCHAR(20) DEFAULT 'pdf',
    exported_by UUID REFERENCES auth.users(id),
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.company_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Company members can view their exports" ON public.company_exports;
CREATE POLICY "Company members can view their exports"
ON public.company_exports FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = company_exports.company_id
        AND company_users.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Company members can create exports" ON public.company_exports;
CREATE POLICY "Company members can create exports"
ON public.company_exports FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = company_exports.company_id
        AND company_users.user_id = auth.uid()
    )
);

-- ===========================================
-- PASO 3: Función consume_company_credits
-- ===========================================
CREATE OR REPLACE FUNCTION consume_company_credits(
    p_company_id UUID,
    p_user_id UUID,
    p_action_type VARCHAR(50),
    p_profile_id UUID DEFAULT NULL,
    p_reference_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_credits_required INTEGER;
    v_new_balance INTEGER;
    v_result JSONB;
BEGIN
    -- Check if user is member of company
    IF NOT EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_id = p_company_id AND user_id = p_user_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not a member of this company';
    END IF;

    -- Get credit cost for action
    CASE p_action_type
        WHEN 'PROFILE_UNLOCK' THEN v_credits_required := 5;
        WHEN 'PROFILE_CONTACT' THEN v_credits_required := 3;
        WHEN 'CV_DOWNLOAD' THEN v_credits_required := 5;
        WHEN 'PROFILE_VIEW' THEN v_credits_required := 0;
        ELSE v_credits_required := 1;
    END CASE;

    -- Check and update balance
    UPDATE public.companies
    SET
        credit_balance = credit_balance - v_credits_required,
        total_credits_used = total_credits_used + v_credits_required,
        updated_at = NOW()
    WHERE id = p_company_id
        AND credit_balance >= v_credits_required
        AND status = 'APPROVED'
    RETURNING credit_balance INTO v_new_balance;

    IF NOT FOUND THEN
        DECLARE
            v_company_status VARCHAR(50);
            v_current_balance INTEGER;
        BEGIN
            SELECT status, credit_balance INTO v_company_status, v_current_balance
            FROM public.companies WHERE id = p_company_id;

            IF v_company_status != 'APPROVED' THEN
                RAISE EXCEPTION 'Company is not approved (status: %)', v_company_status;
            ELSIF v_current_balance < v_credits_required THEN
                RAISE EXCEPTION 'Insufficient credits: Need %, have %', v_credits_required, v_current_balance;
            ELSE
                RAISE EXCEPTION 'Company not found';
            END IF;
        END;
    END IF;

    -- Log transaction
    INSERT INTO public.company_credits_history (
        company_id, amount, balance_after, transaction_type,
        reference_id, description, created_by
    ) VALUES (
        p_company_id, -v_credits_required, v_new_balance, p_action_type,
        p_reference_id,
        format('Action: %s on profile %s', p_action_type, COALESCE(p_profile_id::TEXT, 'N/A')),
        p_user_id
    );

    v_result := jsonb_build_object(
        'success', TRUE,
        'credits_consumed', v_credits_required,
        'new_balance', v_new_balance
    );

    RETURN v_result;
END;
$$;

-- ===========================================
-- PASO 4: Función unlock_profile_for_company
-- ===========================================
CREATE OR REPLACE FUNCTION unlock_profile_for_company(
  p_company_id UUID,
  p_profile_id UUID,
  p_credit_cost INTEGER,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
  v_already_viewed BOOLEAN;
BEGIN
  -- Check if profile was already unlocked by this company
  SELECT EXISTS(
    SELECT 1 FROM company_profile_views
    WHERE company_id = p_company_id
      AND profile_id = p_profile_id
  ) INTO v_already_viewed;

  -- If already viewed, just return success
  IF v_already_viewed THEN
    RETURN jsonb_build_object(
      'success', TRUE,
      'message', 'Profile already unlocked',
      'credits_consumed', 0
    );
  END IF;

  -- Consume credits
  PERFORM consume_company_credits(
    p_company_id,
    p_user_id,
    'PROFILE_UNLOCK',
    p_profile_id,
    NULL
  );

  -- Record profile view
  INSERT INTO company_profile_views (
    company_id,
    profile_id,
    viewed_by,
    credits_used
  ) VALUES (
    p_company_id,
    p_profile_id,
    p_user_id,
    p_credit_cost
  );

  -- Get new balance
  SELECT credit_balance INTO v_new_balance
  FROM companies
  WHERE id = p_company_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', 'Profile unlocked successfully',
    'credits_consumed', p_credit_cost,
    'new_balance', v_new_balance
  );
END;
$$;

-- ===========================================
-- PASO 5: Función download_cv_for_company
-- ===========================================
CREATE OR REPLACE FUNCTION download_cv_for_company(
  p_company_id UUID,
  p_profile_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance INTEGER;
  v_already_downloaded BOOLEAN;
  v_credit_cost INTEGER := 5;
BEGIN
  -- Check if CV was already downloaded by this company
  SELECT EXISTS(
    SELECT 1 FROM company_exports
    WHERE company_id = p_company_id
      AND profile_id = p_profile_id
  ) INTO v_already_downloaded;

  -- Only charge for first download
  IF NOT v_already_downloaded THEN
    -- Consume credits
    PERFORM consume_company_credits(
      p_company_id,
      p_user_id,
      'CV_DOWNLOAD',
      p_profile_id,
      NULL
    );
  END IF;

  -- Record export
  INSERT INTO company_exports (
    company_id,
    profile_id,
    export_type,
    format,
    exported_by,
    credits_used
  ) VALUES (
    p_company_id,
    p_profile_id,
    'cv_download',
    'pdf',
    p_user_id,
    CASE WHEN v_already_downloaded THEN 0 ELSE v_credit_cost END
  );

  -- Get new balance
  SELECT credit_balance INTO v_new_balance
  FROM companies
  WHERE id = p_company_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'message', CASE
      WHEN v_already_downloaded THEN 'CV downloaded (free - already downloaded before)'
      ELSE 'CV downloaded successfully'
    END,
    'credits_consumed', CASE WHEN v_already_downloaded THEN 0 ELSE v_credit_cost END,
    'new_balance', v_new_balance
  );
END;
$$;

-- ===========================================
-- PASO 6: Crear tablas de mensajería si no existen
-- ===========================================
CREATE TABLE IF NOT EXISTS public.company_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject TEXT,
    company_user_id UUID REFERENCES auth.users(id),
    credits_used INTEGER DEFAULT 0,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.company_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.company_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('company', 'candidate')),
    sender_id UUID REFERENCES auth.users(id),
    message TEXT NOT NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.company_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_type VARCHAR(50) DEFAULT 'message',
    message TEXT,
    contacted_by UUID REFERENCES auth.users(id),
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para tablas de mensajería
ALTER TABLE public.company_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;

-- Policies para company_conversations
DROP POLICY IF EXISTS "Company members can view their conversations" ON public.company_conversations;
CREATE POLICY "Company members can view their conversations"
ON public.company_conversations FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = company_conversations.company_id
        AND company_users.user_id = auth.uid()
    )
    OR profile_id = auth.uid()
);

-- ===========================================
-- PASO 7: Función send_initial_company_message
-- ===========================================
CREATE OR REPLACE FUNCTION send_initial_company_message(
  p_company_id UUID,
  p_profile_id UUID,
  p_subject TEXT,
  p_message TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id UUID;
  v_message_id UUID;
  v_new_balance INTEGER;
  v_is_new_conversation BOOLEAN;
  v_credit_cost INTEGER := 3;
BEGIN
  -- Check if conversation already exists
  SELECT id INTO v_conversation_id
  FROM company_conversations
  WHERE company_id = p_company_id
    AND profile_id = p_profile_id;

  v_is_new_conversation := (v_conversation_id IS NULL);

  -- If new conversation, create it and consume credits
  IF v_is_new_conversation THEN
    -- Consume credits for initial contact
    PERFORM consume_company_credits(
      p_company_id,
      p_user_id,
      'PROFILE_CONTACT',
      p_profile_id,
      NULL
    );

    -- Create conversation
    INSERT INTO company_conversations (
      company_id,
      profile_id,
      subject,
      company_user_id,
      credits_used
    ) VALUES (
      p_company_id,
      p_profile_id,
      p_subject,
      p_user_id,
      v_credit_cost
    ) RETURNING id INTO v_conversation_id;

    -- Record contact
    INSERT INTO company_contacts (
      company_id,
      profile_id,
      contact_type,
      message,
      contacted_by,
      credits_used
    ) VALUES (
      p_company_id,
      p_profile_id,
      'message',
      p_message,
      p_user_id,
      v_credit_cost
    );
  END IF;

  -- Create message
  INSERT INTO company_messages (
    conversation_id,
    sender_type,
    sender_id,
    message
  ) VALUES (
    v_conversation_id,
    'company',
    p_user_id,
    p_message
  ) RETURNING id INTO v_message_id;

  -- Update last_message_at
  UPDATE company_conversations
  SET last_message_at = NOW()
  WHERE id = v_conversation_id;

  -- Get new balance
  SELECT credit_balance INTO v_new_balance
  FROM companies
  WHERE id = p_company_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'conversation_id', v_conversation_id,
    'message_id', v_message_id,
    'is_new_conversation', v_is_new_conversation,
    'credits_consumed', CASE WHEN v_is_new_conversation THEN v_credit_cost ELSE 0 END,
    'new_balance', v_new_balance
  );
END;
$$;

-- ===========================================
-- PASO 8: Grant permisos
-- ===========================================
GRANT EXECUTE ON FUNCTION consume_company_credits TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_profile_for_company TO authenticated;
GRANT EXECUTE ON FUNCTION download_cv_for_company TO authenticated;
GRANT EXECUTE ON FUNCTION send_initial_company_message TO authenticated;

-- ===========================================
-- VERIFICACIÓN
-- ===========================================
SELECT 'Functions created successfully!' as status;

-- Verificar que existen
SELECT proname, proargtypes::regtype[]
FROM pg_proc
WHERE proname IN ('unlock_profile_for_company', 'download_cv_for_company', 'consume_company_credits');
