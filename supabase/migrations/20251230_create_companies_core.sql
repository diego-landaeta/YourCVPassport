-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Basic Information
    company_name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(100) NOT NULL UNIQUE, -- CIF/NIF
    company_email VARCHAR(255) NOT NULL UNIQUE,
    company_phone VARCHAR(50),
    website_url VARCHAR(500),

    -- Address
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(100),
    address_country VARCHAR(2), -- ISO country code
    address_postal VARCHAR(20),

    -- Company Details
    industry VARCHAR(100),
    company_size VARCHAR(50) CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    description TEXT,
    logo_url TEXT,

    -- Verification Documents (stored in Supabase Storage)
    tax_document_url TEXT, -- CIF/NIF document
    verification_document_url TEXT, -- Business license or similar

    -- Admin Verification
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED')),
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id),
    rejection_reason TEXT,
    admin_notes TEXT,

    -- Credits
    credit_balance INTEGER DEFAULT 0 NOT NULL,
    total_credits_purchased INTEGER DEFAULT 0,
    total_credits_used INTEGER DEFAULT 0,

    -- Metadata
    signup_ip VARCHAR(45),
    last_login_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Create company_users table (junction for multi-user companies)
CREATE TABLE IF NOT EXISTS public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'MEMBER' CHECK (role IN ('OWNER', 'ADMIN', 'MEMBER', 'VIEWER')),
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

-- Create company_credits_history table
CREATE TABLE IF NOT EXISTS public.company_credits_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive for add, negative for deduct
    balance_after INTEGER NOT NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
        'PURCHASE', 'ADMIN_ADJUSTMENT', 'REFUND',
        'PROFILE_VIEW', 'PROFILE_CONTACT', 'SEARCH_EXPORT', 'PROFILE_UNLOCK'
    )),
    reference_id UUID, -- Links to payment, lead, export, etc.
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_companies_status ON public.companies(status);
CREATE INDEX idx_companies_tax_id ON public.companies(tax_id);
CREATE INDEX idx_companies_email ON public.companies(company_email);
CREATE INDEX idx_company_users_company ON public.company_users(company_id);
CREATE INDEX idx_company_users_user ON public.company_users(user_id);
CREATE INDEX idx_credits_history_company ON public.company_credits_history(company_id);
CREATE INDEX idx_credits_history_created_at ON public.company_credits_history(created_at DESC);

-- RLS Policies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_credits_history ENABLE ROW LEVEL SECURITY;

-- Companies: Users can view their own company if they're a member
CREATE POLICY "Company members can view their company"
ON public.companies FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = companies.id
        AND company_users.user_id = auth.uid()
    )
);

-- Companies: Only owners/admins can update (and only if approved)
CREATE POLICY "Company owners/admins can update"
ON public.companies FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = companies.id
        AND company_users.user_id = auth.uid()
        AND company_users.role IN ('OWNER', 'ADMIN')
    )
);

-- Companies: Anyone authenticated can insert (for registration)
CREATE POLICY "Anyone authenticated can register company"
ON public.companies FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Companies: Admins can do everything
CREATE POLICY "Admins can manage all companies"
ON public.companies FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Company Users: Members can view other members
CREATE POLICY "Company members can view other members"
ON public.company_users FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
);

-- Company Users: Anyone authenticated can insert (for registration as OWNER)
CREATE POLICY "Anyone authenticated can join as owner"
ON public.company_users FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND user_id = auth.uid()
    AND role = 'OWNER'
);

-- Company Users: Owners/Admins can manage members
CREATE POLICY "Company owners/admins can manage members"
ON public.company_users FOR ALL
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
        AND role IN ('OWNER', 'ADMIN')
    )
);

-- Company Users: Admins can view all
CREATE POLICY "Admins can view all company users"
ON public.company_users FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Credits History: Company members can view their company's history
CREATE POLICY "Company members can view credit history"
ON public.company_credits_history FOR SELECT
USING (
    company_id IN (
        SELECT company_id FROM public.company_users
        WHERE user_id = auth.uid()
    )
);

-- Credits History: Admins can view all
CREATE POLICY "Admins can view all credit history"
ON public.company_credits_history FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Triggers
CREATE OR REPLACE FUNCTION update_companies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_companies_updated_at_trigger
BEFORE UPDATE ON public.companies
FOR EACH ROW
EXECUTE FUNCTION update_companies_updated_at();

-- Comments
COMMENT ON TABLE public.companies IS 'Registered companies with verification status and credit balance';
COMMENT ON TABLE public.company_users IS 'Junction table for multi-user company access';
COMMENT ON TABLE public.company_credits_history IS 'Audit log for all credit transactions';
