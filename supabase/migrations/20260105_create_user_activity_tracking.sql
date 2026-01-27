-- Create user_activity_logs table for tracking user actions
CREATE TABLE IF NOT EXISTS public.user_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON public.user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_activity_type ON public.user_activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON public.user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_created ON public.user_activity_logs(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_activity_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own activity logs
CREATE POLICY "Users can view own activity logs"
    ON public.user_activity_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Admins can view all activity logs
CREATE POLICY "Admins can view all activity logs"
    ON public.user_activity_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Policy: Allow system to insert activity logs (authenticated users)
CREATE POLICY "Allow authenticated users to insert activity logs"
    ON public.user_activity_logs
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to log user activity
CREATE OR REPLACE FUNCTION public.log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.user_activity_logs (
        user_id,
        activity_type,
        metadata
    ) VALUES (
        p_user_id,
        p_activity_type,
        p_metadata
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- Function to get activity stats for date range
CREATE OR REPLACE FUNCTION public.get_activity_stats(
    p_start_date TIMESTAMPTZ,
    p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
    activity_date DATE,
    logins BIGINT,
    registrations BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            p_start_date::date,
            p_end_date::date,
            '1 day'::interval
        )::date AS activity_date
    ),
    login_counts AS (
        SELECT
            created_at::date AS activity_date,
            COUNT(*) AS count
        FROM public.user_activity_logs
        WHERE activity_type = 'login'
        AND created_at BETWEEN p_start_date AND p_end_date
        GROUP BY created_at::date
    ),
    registration_counts AS (
        SELECT
            created_at::date AS activity_date,
            COUNT(*) AS count
        FROM public.profiles
        WHERE created_at BETWEEN p_start_date AND p_end_date
        GROUP BY created_at::date
    )
    SELECT
        ds.activity_date,
        COALESCE(lc.count, 0) AS logins,
        COALESCE(rc.count, 0) AS registrations
    FROM date_series ds
    LEFT JOIN login_counts lc ON ds.activity_date = lc.activity_date
    LEFT JOIN registration_counts rc ON ds.activity_date = rc.activity_date
    ORDER BY ds.activity_date;
END;
$$;

-- Grant permissions
GRANT SELECT, INSERT ON public.user_activity_logs TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_user_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_activity_stats TO authenticated;

-- Add comment
COMMENT ON TABLE public.user_activity_logs IS 'Tracks user activity including logins, registrations, and other actions';
COMMENT ON FUNCTION public.log_user_activity IS 'Logs a user activity event';
COMMENT ON FUNCTION public.get_activity_stats IS 'Gets aggregated activity statistics for a date range';
