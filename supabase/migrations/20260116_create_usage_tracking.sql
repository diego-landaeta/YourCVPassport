-- ============================================================================
-- USAGE TRACKING SYSTEM
-- Tracks feature usage per user for enforcing plan limits
-- ============================================================================

-- Usage tracking table - records each usage event
CREATE TABLE IF NOT EXISTS public.usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    feature_type TEXT NOT NULL CHECK (feature_type IN (
        'ats_export',      -- PDF/DOCX exports
        'ai_request',      -- AI text generation
        'stamp_request',   -- Stamp verification requests
        'profile_view'     -- Profile views (for analytics)
    )),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb  -- Additional context (template used, etc.)
);

-- Index for efficient queries by user and feature type
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature
    ON public.usage_tracking(user_id, feature_type);

-- Index for time-based queries (monthly resets)
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at
    ON public.usage_tracking(created_at);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_feature_date
    ON public.usage_tracking(user_id, feature_type, created_at DESC);

-- ============================================================================
-- PLAN LIMITS CONFIGURATION
-- Defines limits for each plan
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.plan_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name TEXT NOT NULL UNIQUE CHECK (plan_name IN ('free', 'basic', 'pro', 'enterprise')),
    ats_exports_per_month INTEGER NOT NULL DEFAULT 0,      -- 0 = unlimited
    ai_requests_per_month INTEGER NOT NULL DEFAULT 0,      -- 0 = unlimited
    stamps_per_month INTEGER NOT NULL DEFAULT 0,           -- 0 = unlimited
    can_use_ai BOOLEAN NOT NULL DEFAULT false,
    can_use_premium_templates BOOLEAN NOT NULL DEFAULT false,
    can_remove_branding BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default plan limits
INSERT INTO public.plan_limits (plan_name, ats_exports_per_month, ai_requests_per_month, stamps_per_month, can_use_ai, can_use_premium_templates, can_remove_branding)
VALUES
    ('free', 1, 0, 3, false, false, false),           -- 1 export/month, NO AI, 3 stamps
    ('basic', 5, 20, 10, true, false, false),         -- 5 exports, 20 AI, 10 stamps
    ('pro', 0, 0, 0, true, true, true),               -- Unlimited all
    ('enterprise', 0, 0, 0, true, true, true)         -- Unlimited all
ON CONFLICT (plan_name) DO UPDATE SET
    ats_exports_per_month = EXCLUDED.ats_exports_per_month,
    ai_requests_per_month = EXCLUDED.ai_requests_per_month,
    stamps_per_month = EXCLUDED.stamps_per_month,
    can_use_ai = EXCLUDED.can_use_ai,
    can_use_premium_templates = EXCLUDED.can_use_premium_templates,
    can_remove_branding = EXCLUDED.can_remove_branding,
    updated_at = NOW();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
DROP POLICY IF EXISTS "Users can view own usage" ON public.usage_tracking;
CREATE POLICY "Users can view own usage" ON public.usage_tracking
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own usage (system also needs this)
DROP POLICY IF EXISTS "Users can insert own usage" ON public.usage_tracking;
CREATE POLICY "Users can insert own usage" ON public.usage_tracking
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Plan limits are readable by all authenticated users
DROP POLICY IF EXISTS "Plan limits are readable by all" ON public.plan_limits;
CREATE POLICY "Plan limits are readable by all" ON public.plan_limits
    FOR SELECT USING (true);

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get usage count for current month
CREATE OR REPLACE FUNCTION public.get_monthly_usage(
    p_user_id UUID,
    p_feature_type TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    usage_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO usage_count
    FROM public.usage_tracking
    WHERE user_id = p_user_id
      AND feature_type = p_feature_type
      AND created_at >= date_trunc('month', NOW())
      AND created_at < date_trunc('month', NOW()) + INTERVAL '1 month';

    RETURN COALESCE(usage_count, 0);
END;
$$;

-- Function to check if user can use a feature
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

    -- Special check for AI - must have can_use_ai = true
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

-- Function to record usage (with limit check)
CREATE OR REPLACE FUNCTION public.record_usage(
    p_user_id UUID,
    p_feature_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_check_result JSONB;
BEGIN
    -- First check if allowed
    v_check_result := check_feature_limit(p_user_id, p_feature_type);

    -- If not allowed, return error
    IF NOT (v_check_result->>'allowed')::boolean THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', COALESCE(v_check_result->>'reason', 'Usage limit exceeded'),
            'details', v_check_result
        );
    END IF;

    -- Record the usage
    INSERT INTO public.usage_tracking (user_id, feature_type, metadata)
    VALUES (p_user_id, p_feature_type, p_metadata);

    -- Return updated status
    RETURN jsonb_build_object(
        'success', true,
        'details', check_feature_limit(p_user_id, p_feature_type)
    );
END;
$$;

-- Function to get all usage stats for a user
CREATE OR REPLACE FUNCTION public.get_usage_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_plan TEXT;
    v_limits RECORD;
BEGIN
    -- Get user's plan
    SELECT COALESCE(plan, 'free') INTO v_plan
    FROM public.profiles
    WHERE id = p_user_id;

    -- Get plan limits
    SELECT * INTO v_limits
    FROM public.plan_limits
    WHERE plan_name = v_plan;

    RETURN jsonb_build_object(
        'plan', v_plan,
        'ats_export', check_feature_limit(p_user_id, 'ats_export'),
        'ai_request', check_feature_limit(p_user_id, 'ai_request'),
        'stamp_request', check_feature_limit(p_user_id, 'stamp_request'),
        'features', jsonb_build_object(
            'can_use_ai', v_limits.can_use_ai,
            'can_use_premium_templates', v_limits.can_use_premium_templates,
            'can_remove_branding', v_limits.can_remove_branding
        ),
        'period_start', date_trunc('month', NOW()),
        'period_end', date_trunc('month', NOW()) + INTERVAL '1 month'
    );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_monthly_usage(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_feature_limit(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_usage(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_usage_stats(UUID) TO authenticated;

-- Comments
COMMENT ON TABLE public.usage_tracking IS 'Tracks feature usage per user for enforcing plan limits';
COMMENT ON TABLE public.plan_limits IS 'Defines feature limits for each subscription plan';
COMMENT ON FUNCTION public.check_feature_limit IS 'Checks if user can use a feature based on their plan limits';
COMMENT ON FUNCTION public.record_usage IS 'Records a usage event and checks limits';
COMMENT ON FUNCTION public.get_usage_stats IS 'Gets all usage statistics for a user';
