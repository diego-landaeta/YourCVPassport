-- =====================================================
-- SAVED JOB POSTINGS - BOOKMARK SYSTEM
-- =====================================================
-- This migration creates the saved job postings system that allows
-- users to bookmark interesting job vacancies for later review

-- =====================================================
-- TABLE: saved_job_postings (Vacantes Guardadas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.saved_job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Relations
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,

    -- User notes (optional)
    notes TEXT,

    -- Metadata
    viewed_count INTEGER DEFAULT 0, -- How many times user viewed this saved job
    last_viewed_at TIMESTAMPTZ,

    -- Constraints
    UNIQUE(profile_id, job_posting_id) -- User can only save a job once
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_saved_jobs_profile_id
    ON public.saved_job_postings(profile_id);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_posting_id
    ON public.saved_job_postings(job_posting_id);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_created_at
    ON public.saved_job_postings(created_at DESC);

-- Composite index for efficient lookup
CREATE INDEX IF NOT EXISTS idx_saved_jobs_profile_job
    ON public.saved_job_postings(profile_id, job_posting_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.saved_job_postings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Users can view their own saved jobs" ON public.saved_job_postings;
DROP POLICY IF EXISTS "Users can save job postings" ON public.saved_job_postings;
DROP POLICY IF EXISTS "Users can update their own saved jobs" ON public.saved_job_postings;
DROP POLICY IF EXISTS "Users can unsave job postings" ON public.saved_job_postings;

-- Users can view their own saved jobs
CREATE POLICY "Users can view their own saved jobs"
    ON public.saved_job_postings
    FOR SELECT
    USING (auth.uid() = profile_id);

-- Users can save jobs (INSERT)
CREATE POLICY "Users can save job postings"
    ON public.saved_job_postings
    FOR INSERT
    WITH CHECK (auth.uid() = profile_id);

-- Users can update their own saved jobs (notes, viewed count)
CREATE POLICY "Users can update their own saved jobs"
    ON public.saved_job_postings
    FOR UPDATE
    USING (auth.uid() = profile_id)
    WITH CHECK (auth.uid() = profile_id);

-- Users can unsave jobs (DELETE)
CREATE POLICY "Users can unsave job postings"
    ON public.saved_job_postings
    FOR DELETE
    USING (auth.uid() = profile_id);

-- =====================================================
-- UPDATED_AT TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_saved_job_postings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists (for idempotency)
DROP TRIGGER IF EXISTS trigger_update_saved_job_postings_updated_at ON public.saved_job_postings;

CREATE TRIGGER trigger_update_saved_job_postings_updated_at
    BEFORE UPDATE ON public.saved_job_postings
    FOR EACH ROW
    EXECUTE FUNCTION update_saved_job_postings_updated_at();

-- =====================================================
-- RPC FUNCTION: Check if job is saved
-- =====================================================
-- Drop existing function (for idempotency)
DROP FUNCTION IF EXISTS is_job_saved(UUID, UUID);

CREATE OR REPLACE FUNCTION is_job_saved(
    p_profile_id UUID,
    p_job_posting_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if the job is saved by this user
    SELECT EXISTS (
        SELECT 1
        FROM public.saved_job_postings
        WHERE profile_id = p_profile_id
        AND job_posting_id = p_job_posting_id
    ) INTO v_exists;

    RETURN v_exists;
END;
$$;

-- =====================================================
-- RPC FUNCTION: Toggle save status
-- =====================================================
-- Drop existing function (for idempotency)
DROP FUNCTION IF EXISTS toggle_job_save(UUID);

CREATE OR REPLACE FUNCTION toggle_job_save(
    p_job_posting_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_profile_id UUID;
    v_exists BOOLEAN;
    v_saved_id UUID;
BEGIN
    -- Get the calling user's profile_id
    v_profile_id := auth.uid();

    IF v_profile_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if already saved
    SELECT EXISTS (
        SELECT 1
        FROM public.saved_job_postings
        WHERE profile_id = v_profile_id
        AND job_posting_id = p_job_posting_id
    ) INTO v_exists;

    IF v_exists THEN
        -- Unsave (delete)
        DELETE FROM public.saved_job_postings
        WHERE profile_id = v_profile_id
        AND job_posting_id = p_job_posting_id;

        RETURN jsonb_build_object(
            'success', true,
            'saved', false,
            'message', 'Job unsaved successfully'
        );
    ELSE
        -- Save (insert)
        INSERT INTO public.saved_job_postings (profile_id, job_posting_id)
        VALUES (v_profile_id, p_job_posting_id)
        RETURNING id INTO v_saved_id;

        RETURN jsonb_build_object(
            'success', true,
            'saved', true,
            'saved_id', v_saved_id,
            'message', 'Job saved successfully'
        );
    END IF;
END;
$$;

-- =====================================================
-- RPC FUNCTION: Get saved jobs with details
-- =====================================================
-- Drop existing function (for idempotency)
DROP FUNCTION IF EXISTS get_saved_jobs(UUID, INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION get_saved_jobs(
    p_profile_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    saved_id UUID,
    saved_at TIMESTAMPTZ,
    notes TEXT,
    job_id UUID,
    job_title VARCHAR,
    job_slug VARCHAR,
    company_name VARCHAR,
    company_logo_url TEXT,
    location_city VARCHAR,
    location_country VARCHAR,
    is_remote BOOLEAN,
    employment_type VARCHAR,
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sjp.id AS saved_id,
        sjp.created_at AS saved_at,
        sjp.notes,
        jp.id AS job_id,
        jp.title AS job_title,
        jp.slug AS job_slug,
        c.company_name,
        c.logo_url AS company_logo_url,
        jp.location_city,
        jp.location_country,
        jp.is_remote,
        jp.employment_type,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency
    FROM public.saved_job_postings sjp
    INNER JOIN public.job_postings jp ON sjp.job_posting_id = jp.id
    INNER JOIN public.companies c ON jp.company_id = c.id
    WHERE sjp.profile_id = p_profile_id
    AND jp.status = 'PUBLISHED' -- Only show published jobs
    ORDER BY sjp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.saved_job_postings IS 'Stores job postings saved/bookmarked by users for later review';
COMMENT ON COLUMN public.saved_job_postings.notes IS 'Optional personal notes about why user saved this job';
COMMENT ON COLUMN public.saved_job_postings.viewed_count IS 'Number of times user has viewed this saved job';
COMMENT ON FUNCTION is_job_saved IS 'Checks if a job posting is saved by a specific user';
COMMENT ON FUNCTION toggle_job_save IS 'Saves or unsaves a job posting (toggle)';
COMMENT ON FUNCTION get_saved_jobs IS 'Retrieves all saved jobs for a user with job and company details';
