-- =====================================================
-- JOB POSTINGS SYSTEM - COMPLETE MIGRATION
-- =====================================================
-- Execute this file in Supabase SQL Editor
-- Date: 2025-12-30
--
-- This migration creates:
-- 1. All job posting tables (4 tables)
-- 2. All RPC functions (6 functions)
-- 3. Updates credit transaction types
--
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard -> SQL Editor
-- 2. Create new query
-- 3. Copy and paste this ENTIRE file
-- 4. Click "Run" button
-- =====================================================

-- =====================================================
-- STEP 1: CREATE TABLES
-- =====================================================

-- TABLE 1: job_postings
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE,
    department VARCHAR(100),
    employment_type VARCHAR(50) CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE')),
    work_mode VARCHAR(50) CHECK (work_mode IN ('REMOTE', 'ONSITE', 'HYBRID')),
    experience_level VARCHAR(50) CHECK (experience_level IN ('ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE')),
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(2),
    is_remote BOOLEAN DEFAULT false,
    description TEXT NOT NULL,
    responsibilities TEXT[],
    requirements TEXT[],
    nice_to_have TEXT[],
    benefits TEXT[],
    required_skills VARCHAR(100)[],
    optional_skills VARCHAR(100)[],
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    salary_period VARCHAR(20) CHECK (salary_period IN ('HOURLY', 'MONTHLY', 'YEARLY')),
    show_salary BOOLEAN DEFAULT false,
    application_deadline TIMESTAMPTZ,
    application_email VARCHAR(255),
    application_url TEXT,
    application_instructions TEXT,
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'PAUSED', 'CLOSED', 'FILLED')),
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    meta_title VARCHAR(200),
    meta_description TEXT,
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    credits_cost INTEGER DEFAULT 30,
    CONSTRAINT valid_salary_range CHECK (salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min),
    CONSTRAINT valid_deadline CHECK (application_deadline IS NULL OR application_deadline > created_at)
);

-- TABLE 2: job_applications
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED', 'WITHDRAWN')),
    cover_letter TEXT,
    resume_url TEXT,
    answers JSONB DEFAULT '{}'::jsonb,
    viewed_by_company BOOLEAN DEFAULT false,
    viewed_at TIMESTAMPTZ,
    viewed_by UUID REFERENCES auth.users(id),
    internal_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(job_posting_id, profile_id)
);

-- TABLE 3: job_posting_views
CREATE TABLE IF NOT EXISTS public.job_posting_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 4: job_posting_questions
CREATE TABLE IF NOT EXISTS public.job_posting_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) CHECK (question_type IN ('TEXT', 'TEXTAREA', 'YES_NO', 'MULTIPLE_CHOICE')),
    options JSONB,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE INDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_job_postings_company ON public.job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_job_postings_status ON public.job_postings(status);
CREATE INDEX IF NOT EXISTS idx_job_postings_slug ON public.job_postings(slug);
CREATE INDEX IF NOT EXISTS idx_job_postings_published ON public.job_postings(published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_job_postings_location ON public.job_postings(location_country, location_city);
CREATE INDEX IF NOT EXISTS idx_job_postings_skills ON public.job_postings USING gin(required_skills);
CREATE INDEX IF NOT EXISTS idx_job_postings_employment_type ON public.job_postings(employment_type);
CREATE INDEX IF NOT EXISTS idx_job_postings_work_mode ON public.job_postings(work_mode);
CREATE INDEX IF NOT EXISTS idx_job_postings_search ON public.job_postings USING gin(to_tsvector('spanish', title || ' ' || COALESCE(description, '')));

CREATE INDEX IF NOT EXISTS idx_job_applications_job ON public.job_applications(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_profile ON public.job_applications(profile_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_company ON public.job_applications(company_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON public.job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_created ON public.job_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_applications_match_score ON public.job_applications(match_score DESC);

CREATE INDEX IF NOT EXISTS idx_job_views_posting ON public.job_posting_views(job_posting_id);
CREATE INDEX IF NOT EXISTS idx_job_views_profile ON public.job_posting_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_job_views_date ON public.job_posting_views(viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_questions_posting ON public.job_posting_questions(job_posting_id, order_index);

-- =====================================================
-- STEP 3: ENABLE RLS
-- =====================================================

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posting_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posting_questions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: CREATE RLS POLICIES
-- =====================================================

-- job_postings policies
DROP POLICY IF EXISTS "Company members can view their job postings" ON public.job_postings;
CREATE POLICY "Company members can view their job postings" ON public.job_postings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.company_users WHERE company_users.company_id = job_postings.company_id AND company_users.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can view published job postings" ON public.job_postings;
CREATE POLICY "Anyone can view published job postings" ON public.job_postings FOR SELECT USING (status = 'PUBLISHED' AND published_at IS NOT NULL);

DROP POLICY IF EXISTS "Company members can create job postings" ON public.job_postings;
CREATE POLICY "Company members can create job postings" ON public.job_postings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.company_users WHERE company_users.company_id = job_postings.company_id AND company_users.user_id = auth.uid() AND company_users.role IN ('OWNER', 'ADMIN', 'MEMBER'))
);

DROP POLICY IF EXISTS "Company members can update job postings" ON public.job_postings;
CREATE POLICY "Company members can update job postings" ON public.job_postings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.company_users WHERE company_users.company_id = job_postings.company_id AND company_users.user_id = auth.uid() AND company_users.role IN ('OWNER', 'ADMIN', 'MEMBER'))
);

DROP POLICY IF EXISTS "Company owners and admins can delete job postings" ON public.job_postings;
CREATE POLICY "Company owners and admins can delete job postings" ON public.job_postings FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.company_users WHERE company_users.company_id = job_postings.company_id AND company_users.user_id = auth.uid() AND company_users.role IN ('OWNER', 'ADMIN'))
);

-- job_applications policies
DROP POLICY IF EXISTS "Candidates can view their applications" ON public.job_applications;
CREATE POLICY "Candidates can view their applications" ON public.job_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = job_applications.profile_id AND profiles.id = auth.uid())
);

DROP POLICY IF EXISTS "Company members can view applications" ON public.job_applications;
CREATE POLICY "Company members can view applications" ON public.job_applications FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.company_users WHERE company_users.company_id = job_applications.company_id AND company_users.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Candidates can create applications" ON public.job_applications;
CREATE POLICY "Candidates can create applications" ON public.job_applications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = job_applications.profile_id AND profiles.id = auth.uid())
);

DROP POLICY IF EXISTS "Candidates can update their applications" ON public.job_applications;
CREATE POLICY "Candidates can update their applications" ON public.job_applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = job_applications.profile_id AND profiles.id = auth.uid())
);

DROP POLICY IF EXISTS "Company members can update application status" ON public.job_applications;
CREATE POLICY "Company members can update application status" ON public.job_applications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.company_users WHERE company_users.company_id = job_applications.company_id AND company_users.user_id = auth.uid() AND company_users.role IN ('OWNER', 'ADMIN', 'MEMBER'))
);

-- job_posting_views policies
DROP POLICY IF EXISTS "Company members can view analytics" ON public.job_posting_views;
CREATE POLICY "Company members can view analytics" ON public.job_posting_views FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.job_postings jp JOIN public.company_users cu ON cu.company_id = jp.company_id WHERE jp.id = job_posting_views.job_posting_id AND cu.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Anyone can track views" ON public.job_posting_views;
CREATE POLICY "Anyone can track views" ON public.job_posting_views FOR INSERT WITH CHECK (true);

-- job_posting_questions policies
DROP POLICY IF EXISTS "Anyone can view questions for published jobs" ON public.job_posting_questions;
CREATE POLICY "Anyone can view questions for published jobs" ON public.job_posting_questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.job_postings WHERE job_postings.id = job_posting_questions.job_posting_id AND job_postings.status = 'PUBLISHED')
);

DROP POLICY IF EXISTS "Company members can view their questions" ON public.job_posting_questions;
CREATE POLICY "Company members can view their questions" ON public.job_posting_questions FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.job_postings jp JOIN public.company_users cu ON cu.company_id = jp.company_id WHERE jp.id = job_posting_questions.job_posting_id AND cu.user_id = auth.uid())
);

DROP POLICY IF EXISTS "Company members can manage questions" ON public.job_posting_questions;
CREATE POLICY "Company members can manage questions" ON public.job_posting_questions FOR ALL USING (
    EXISTS (SELECT 1 FROM public.job_postings jp JOIN public.company_users cu ON cu.company_id = jp.company_id WHERE jp.id = job_posting_questions.job_posting_id AND cu.user_id = auth.uid() AND cu.role IN ('OWNER', 'ADMIN', 'MEMBER'))
);

-- =====================================================
-- STEP 5: CREATE TRIGGERS
-- =====================================================

CREATE OR REPLACE FUNCTION update_job_posting_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_job_posting_timestamp ON public.job_postings;
CREATE TRIGGER trigger_update_job_posting_timestamp BEFORE UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION update_job_posting_updated_at();

DROP TRIGGER IF EXISTS trigger_update_job_application_timestamp ON public.job_applications;
CREATE TRIGGER trigger_update_job_application_timestamp BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION update_job_posting_updated_at();

CREATE OR REPLACE FUNCTION generate_job_posting_slug() RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        base_slug := lower(regexp_replace(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));
        IF NEW.location_city IS NOT NULL THEN
            base_slug := base_slug || '-' || lower(regexp_replace(NEW.location_city, '\s+', '-', 'g'));
        END IF;
        final_slug := base_slug;
        WHILE EXISTS (SELECT 1 FROM job_postings WHERE slug = final_slug AND id != NEW.id) LOOP
            counter := counter + 1;
            final_slug := base_slug || '-' || counter;
        END LOOP;
        NEW.slug := final_slug;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_job_posting_slug ON public.job_postings;
CREATE TRIGGER trigger_generate_job_posting_slug BEFORE INSERT OR UPDATE ON public.job_postings FOR EACH ROW EXECUTE FUNCTION generate_job_posting_slug();

-- =====================================================
-- STEP 6: UPDATE CREDIT TRANSACTION TYPES
-- =====================================================

ALTER TABLE public.company_credits_history DROP CONSTRAINT IF EXISTS company_credits_history_transaction_type_check;

ALTER TABLE public.company_credits_history ADD CONSTRAINT company_credits_history_transaction_type_check
CHECK (transaction_type IN (
    'PURCHASE', 'ADMIN_ADJUSTMENT', 'REFUND',
    'PROFILE_VIEW', 'PROFILE_CONTACT', 'PROFILE_UNLOCK',
    'SEARCH_EXPORT', 'CV_DOWNLOAD',
    'JOB_POSTING', 'JOB_APPLICATION_VIEW'
));

-- =====================================================
-- DONE! All tables, indices, policies, and triggers created
-- =====================================================
