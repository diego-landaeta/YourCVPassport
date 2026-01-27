-- RPC Function: Approve Company
CREATE OR REPLACE FUNCTION public.approve_company(
    p_company_id UUID,
    p_admin_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_company_email VARCHAR(255);
    v_company_name VARCHAR(255);
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can approve companies';
    END IF;

    -- Update company status
    UPDATE public.companies
    SET
        status = 'APPROVED',
        verified_at = NOW(),
        verified_by = p_admin_id,
        admin_notes = COALESCE(p_notes, admin_notes)
    WHERE id = p_company_id
    RETURNING company_email, company_name INTO v_company_email, v_company_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found';
    END IF;

    v_result := jsonb_build_object(
        'success', TRUE,
        'company_id', p_company_id,
        'company_email', v_company_email,
        'company_name', v_company_name
    );

    RETURN v_result;
END;
$$;

-- RPC Function: Reject Company
CREATE OR REPLACE FUNCTION public.reject_company(
    p_company_id UUID,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_company_email VARCHAR(255);
    v_company_name VARCHAR(255);
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can reject companies';
    END IF;

    -- Require rejection reason
    IF p_reason IS NULL OR LENGTH(TRIM(p_reason)) = 0 THEN
        RAISE EXCEPTION 'Rejection reason is required';
    END IF;

    -- Update company status
    UPDATE public.companies
    SET
        status = 'REJECTED',
        verified_at = NOW(),
        verified_by = p_admin_id,
        rejection_reason = p_reason
    WHERE id = p_company_id
    RETURNING company_email, company_name INTO v_company_email, v_company_name;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found';
    END IF;

    v_result := jsonb_build_object(
        'success', TRUE,
        'company_id', p_company_id,
        'company_email', v_company_email,
        'company_name', v_company_name,
        'reason', p_reason
    );

    RETURN v_result;
END;
$$;

-- RPC Function: Adjust Credits (Admin Only)
CREATE OR REPLACE FUNCTION public.adjust_company_credits(
    p_company_id UUID,
    p_admin_id UUID,
    p_amount INTEGER, -- Can be positive or negative
    p_description TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_balance INTEGER;
    v_result JSONB;
BEGIN
    -- Check if caller is admin
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = p_admin_id AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can adjust credits';
    END IF;

    -- Update company balance
    UPDATE public.companies
    SET
        credit_balance = credit_balance + p_amount,
        updated_at = NOW()
    WHERE id = p_company_id
    RETURNING credit_balance INTO v_new_balance;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Company not found';
    END IF;

    -- Prevent negative balance
    IF v_new_balance < 0 THEN
        RAISE EXCEPTION 'Insufficient credits: Cannot result in negative balance';
    END IF;

    -- Log transaction
    INSERT INTO public.company_credits_history (
        company_id, amount, balance_after, transaction_type,
        description, created_by
    ) VALUES (
        p_company_id, p_amount, v_new_balance, 'ADMIN_ADJUSTMENT',
        p_description, p_admin_id
    );

    v_result := jsonb_build_object(
        'success', TRUE,
        'company_id', p_company_id,
        'new_balance', v_new_balance,
        'amount_adjusted', p_amount
    );

    RETURN v_result;
END;
$$;

-- RPC Function: Consume Credits (For Actions)
CREATE OR REPLACE FUNCTION public.consume_company_credits(
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

    -- Get credit cost for action (will be created in later migration)
    -- For now, use default values
    CASE p_action_type
        WHEN 'PROFILE_UNLOCK' THEN v_credits_required := 10;
        WHEN 'PROFILE_CONTACT' THEN v_credits_required := 5;
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
        -- Check why it failed
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_company TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_company TO authenticated;
GRANT EXECUTE ON FUNCTION public.adjust_company_credits TO authenticated;
GRANT EXECUTE ON FUNCTION public.consume_company_credits TO authenticated;

-- Comments
COMMENT ON FUNCTION public.approve_company IS 'Admin approves a company registration';
COMMENT ON FUNCTION public.reject_company IS 'Admin rejects a company registration with reason';
COMMENT ON FUNCTION public.adjust_company_credits IS 'Admin manually adjusts company credit balance';
COMMENT ON FUNCTION public.consume_company_credits IS 'Deduct credits when company performs an action';
