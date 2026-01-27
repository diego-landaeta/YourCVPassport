-- Improve check_feature_limit function to handle -1 as "not available"
-- This prevents features with -1 limit from showing as "unlimited"

CREATE OR REPLACE FUNCTION public.check_feature_limit(
    p_user_id UUID,
    p_feature_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan TEXT;
    v_limit INTEGER;
    v_current_usage INTEGER;
    v_can_use BOOLEAN;
    v_can_use_ai BOOLEAN;
BEGIN
    -- Get user's plan
    SELECT COALESCE(plan, 'free') INTO v_plan
    FROM public.profiles
    WHERE id = p_user_id;

    -- Get plan limits
    SELECT
        CASE p_feature_type
            WHEN 'ats_export' THEN ats_exports_per_month
            WHEN 'ai_request' THEN ai_requests_per_month
            WHEN 'stamp_request' THEN stamps_per_month
            ELSE 0
        END,
        can_use_ai
    INTO v_limit, v_can_use_ai
    FROM public.plan_limits
    WHERE plan_name = v_plan;

    -- Special check for AI - must have can_use_ai = true
    -- This check MUST come BEFORE the unlimited check
    IF p_feature_type = 'ai_request' AND NOT v_can_use_ai THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'plan', v_plan,
            'limit', 0,
            'used', 0,
            'remaining', 0,
            'reason', 'AI features are not available on your plan'
        );
    END IF;

    -- If limit is -1, feature is explicitly not available (different from 0 = unlimited)
    IF v_limit = -1 THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'plan', v_plan,
            'limit', 0,
            'used', 0,
            'remaining', 0,
            'reason', 'Feature not available on your plan'
        );
    END IF;

    -- If limit is 0, it's unlimited
    IF v_limit = 0 THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'plan', v_plan,
            'limit', 'unlimited',
            'used', get_monthly_usage(p_user_id, p_feature_type),
            'remaining', 'unlimited'
        );
    END IF;

    -- Get current usage
    v_current_usage := get_monthly_usage(p_user_id, p_feature_type);

    -- Check if under limit
    v_can_use := v_current_usage < v_limit;

    RETURN jsonb_build_object(
        'allowed', v_can_use,
        'plan', v_plan,
        'limit', v_limit,
        'used', v_current_usage,
        'remaining', GREATEST(0, v_limit - v_current_usage),
        'reason', CASE WHEN NOT v_can_use THEN 'Monthly limit reached' ELSE NULL END
    );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.check_feature_limit(UUID, TEXT) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.check_feature_limit IS 'Checks if user can use a feature. -1 = not available, 0 = unlimited, >0 = limited';
