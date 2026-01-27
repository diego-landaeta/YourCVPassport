-- Create company_settings table for storing company configuration preferences
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Notifications
    email_notifications BOOLEAN DEFAULT true,
    new_matches_alert BOOLEAN DEFAULT true,
    credit_low_alert BOOLEAN DEFAULT true,
    weekly_summary BOOLEAN DEFAULT true,

    -- Privacy
    profile_visibility VARCHAR(20) DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'verified_only')),
    allow_direct_messages BOOLEAN DEFAULT true,

    -- Search Preferences
    auto_save_searches BOOLEAN DEFAULT true,
    match_threshold INTEGER DEFAULT 70 CHECK (match_threshold >= 0 AND match_threshold <= 100),

    -- Billing
    auto_recharge_enabled BOOLEAN DEFAULT false,
    auto_recharge_threshold INTEGER DEFAULT 10 CHECK (auto_recharge_threshold >= 0),
    auto_recharge_amount INTEGER DEFAULT 50 CHECK (auto_recharge_amount > 0),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Ensure one settings record per company
    UNIQUE(company_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_company_settings_company_id ON public.company_settings(company_id);

-- Enable RLS
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Company users can view their company's settings
CREATE POLICY "Company users can view own company settings"
    ON public.company_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.company_users
            WHERE company_users.company_id = company_settings.company_id
            AND company_users.user_id = auth.uid()
        )
    );

-- Policy: Company users can insert their company's settings
CREATE POLICY "Company users can insert own company settings"
    ON public.company_settings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_users
            WHERE company_users.company_id = company_settings.company_id
            AND company_users.user_id = auth.uid()
        )
    );

-- Policy: Only OWNER and ADMIN roles can update settings
CREATE POLICY "Company owners and admins can update settings"
    ON public.company_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.company_users
            WHERE company_users.company_id = company_settings.company_id
            AND company_users.user_id = auth.uid()
            AND company_users.role IN ('OWNER', 'ADMIN')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_users
            WHERE company_users.company_id = company_settings.company_id
            AND company_users.user_id = auth.uid()
            AND company_users.role IN ('OWNER', 'ADMIN')
        )
    );

-- Policy: Admins can view all settings
CREATE POLICY "Admins can view all settings"
    ON public.company_settings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid()
            AND role = 'admin'
        )
    );

-- Function to automatically create default settings when a company is created
CREATE OR REPLACE FUNCTION public.create_default_company_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.company_settings (company_id)
    VALUES (NEW.id)
    ON CONFLICT (company_id) DO NOTHING;

    RETURN NEW;
END;
$$;

-- Trigger to create default settings for new companies
CREATE TRIGGER on_company_created_create_settings
    AFTER INSERT ON public.companies
    FOR EACH ROW
    EXECUTE FUNCTION public.create_default_company_settings();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_company_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Trigger to update updated_at on settings change
CREATE TRIGGER on_company_settings_updated
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_company_settings_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.company_settings TO authenticated;

-- Add comments
COMMENT ON TABLE public.company_settings IS 'Stores configuration preferences for companies including notifications, privacy, search, and billing settings';
COMMENT ON COLUMN public.company_settings.profile_visibility IS 'Controls who can view the company profile: public (everyone), verified_only (only verified users), private (no one)';
COMMENT ON COLUMN public.company_settings.match_threshold IS 'Minimum match percentage (0-100) for talent search results';
