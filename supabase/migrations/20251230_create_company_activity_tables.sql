-- Create company activity and tracking tables

-- Table: company_profile_views (track when companies view profiles)
CREATE TABLE IF NOT EXISTS public.company_profile_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(company_id, profile_id) -- Prevent duplicate views
);

-- Table: company_contacts (track contact requests sent to profiles)
CREATE TABLE IF NOT EXISTS public.company_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sent_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(50) DEFAULT 'SENT' CHECK (status IN ('SENT', 'READ', 'REPLIED', 'IGNORED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    replied_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Table: company_saved_searches (saved search queries)
CREATE TABLE IF NOT EXISTS public.company_saved_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    search_name VARCHAR(255) NOT NULL,
    search_filters JSONB NOT NULL,
    alert_enabled BOOLEAN DEFAULT false,
    alert_frequency VARCHAR(50) DEFAULT 'DAILY' CHECK (alert_frequency IN ('REALTIME', 'DAILY', 'WEEKLY', 'MONTHLY')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_run_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Table: company_activity_log (general activity tracking)
CREATE TABLE IF NOT EXISTS public.company_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
        'profile_view', 'contact_sent', 'credit_purchase', 'export',
        'search_saved', 'search_deleted', 'member_added', 'member_removed',
        'settings_updated', 'company_approved', 'company_rejected'
    )),
    description TEXT NOT NULL,
    reference_id UUID, -- Links to profile_id, contact_id, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Table: company_exports (track profile data exports)
CREATE TABLE IF NOT EXISTS public.company_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    export_type VARCHAR(50) DEFAULT 'CSV' CHECK (export_type IN ('CSV', 'EXCEL', 'PDF')),
    profile_count INTEGER NOT NULL,
    search_filters JSONB,
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'COMPLETED', 'FAILED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'), -- File auto-delete after 7 days
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX idx_profile_views_company ON public.company_profile_views(company_id);
CREATE INDEX idx_profile_views_profile ON public.company_profile_views(profile_id);
CREATE INDEX idx_profile_views_created_at ON public.company_profile_views(created_at DESC);

CREATE INDEX idx_contacts_company ON public.company_contacts(company_id);
CREATE INDEX idx_contacts_profile ON public.company_contacts(profile_id);
CREATE INDEX idx_contacts_status ON public.company_contacts(status);
CREATE INDEX idx_contacts_created_at ON public.company_contacts(created_at DESC);

CREATE INDEX idx_saved_searches_company ON public.company_saved_searches(company_id);
CREATE INDEX idx_saved_searches_created_at ON public.company_saved_searches(created_at DESC);

CREATE INDEX idx_activity_log_company ON public.company_activity_log(company_id);
CREATE INDEX idx_activity_log_type ON public.company_activity_log(activity_type);
CREATE INDEX idx_activity_log_created_at ON public.company_activity_log(created_at DESC);

CREATE INDEX idx_exports_company ON public.company_exports(company_id);
CREATE INDEX idx_exports_status ON public.company_exports(status);
CREATE INDEX idx_exports_created_at ON public.company_exports(created_at DESC);

-- Enable RLS
ALTER TABLE public.company_profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Company members can view their company's data

-- Profile Views
CREATE POLICY "Company members can view their profile views"
ON public.company_profile_views FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Company members can insert profile views"
ON public.company_profile_views FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
    AND viewed_by = auth.uid()
);

-- Contacts
CREATE POLICY "Company members can view their contacts"
ON public.company_contacts FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Company members can send contacts"
ON public.company_contacts FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
    AND sent_by = auth.uid()
);

CREATE POLICY "Company members can update their contacts"
ON public.company_contacts FOR UPDATE
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
);

-- Saved Searches
CREATE POLICY "Company members can view their saved searches"
ON public.company_saved_searches FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Company members can create saved searches"
ON public.company_saved_searches FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

CREATE POLICY "Company members can update saved searches"
ON public.company_saved_searches FOR UPDATE
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Company members can delete saved searches"
ON public.company_saved_searches FOR DELETE
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
);

-- Activity Log
CREATE POLICY "Company members can view their activity log"
ON public.company_activity_log FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "System can insert activity log"
ON public.company_activity_log FOR INSERT
TO authenticated
WITH CHECK (true); -- Will be controlled by application logic

-- Exports
CREATE POLICY "Company members can view their exports"
ON public.company_exports FOR SELECT
TO authenticated
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Company members can create exports"
ON public.company_exports FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
);

-- Admin policies
CREATE POLICY "Admins can view all profile views"
ON public.company_profile_views FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can view all contacts"
ON public.company_contacts FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can view all activity logs"
ON public.company_activity_log FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can view all exports"
ON public.company_exports FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Triggers
CREATE OR REPLACE FUNCTION update_saved_searches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_saved_searches_updated_at_trigger
BEFORE UPDATE ON public.company_saved_searches
FOR EACH ROW
EXECUTE FUNCTION update_saved_searches_updated_at();

-- Function to auto-create activity log entries
CREATE OR REPLACE FUNCTION log_company_activity()
RETURNS TRIGGER AS $$
DECLARE
    v_company_id UUID;
    v_description TEXT;
    v_activity_type VARCHAR(50);
BEGIN
    -- Determine activity type and description based on table
    IF TG_TABLE_NAME = 'company_profile_views' THEN
        v_company_id := NEW.company_id;
        v_activity_type := 'profile_view';
        v_description := 'Viewed a profile';

    ELSIF TG_TABLE_NAME = 'company_contacts' THEN
        v_company_id := NEW.company_id;
        v_activity_type := 'contact_sent';
        v_description := 'Sent a contact request';

    ELSIF TG_TABLE_NAME = 'company_exports' THEN
        v_company_id := NEW.company_id;
        v_activity_type := 'export';
        v_description := format('Created %s export with %s profiles', NEW.export_type, NEW.profile_count);

    ELSIF TG_TABLE_NAME = 'company_saved_searches' AND TG_OP = 'INSERT' THEN
        v_company_id := NEW.company_id;
        v_activity_type := 'search_saved';
        v_description := format('Saved search: %s', NEW.search_name);

    ELSIF TG_TABLE_NAME = 'company_credits_history' AND NEW.transaction_type = 'PURCHASE' THEN
        v_company_id := NEW.company_id;
        v_activity_type := 'credit_purchase';
        v_description := format('Purchased %s credits', NEW.amount);
    ELSE
        RETURN NEW; -- Skip if not a tracked activity
    END IF;

    -- Insert activity log
    INSERT INTO public.company_activity_log (
        company_id, user_id, activity_type, description, reference_id
    ) VALUES (
        v_company_id,
        auth.uid(),
        v_activity_type,
        v_description,
        NEW.id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for auto-logging
CREATE TRIGGER log_profile_view_activity
AFTER INSERT ON public.company_profile_views
FOR EACH ROW
EXECUTE FUNCTION log_company_activity();

CREATE TRIGGER log_contact_activity
AFTER INSERT ON public.company_contacts
FOR EACH ROW
EXECUTE FUNCTION log_company_activity();

CREATE TRIGGER log_export_activity
AFTER INSERT ON public.company_exports
FOR EACH ROW
EXECUTE FUNCTION log_company_activity();

CREATE TRIGGER log_saved_search_activity
AFTER INSERT ON public.company_saved_searches
FOR EACH ROW
EXECUTE FUNCTION log_company_activity();

CREATE TRIGGER log_credit_purchase_activity
AFTER INSERT ON public.company_credits_history
FOR EACH ROW
WHEN (NEW.transaction_type = 'PURCHASE')
EXECUTE FUNCTION log_company_activity();

-- Comments
COMMENT ON TABLE public.company_profile_views IS 'Tracks which profiles companies have viewed';
COMMENT ON TABLE public.company_contacts IS 'Contact requests sent by companies to profiles';
COMMENT ON TABLE public.company_saved_searches IS 'Saved search queries with optional alerts';
COMMENT ON TABLE public.company_activity_log IS 'General activity log for companies';
COMMENT ON TABLE public.company_exports IS 'Profile data exports created by companies';
