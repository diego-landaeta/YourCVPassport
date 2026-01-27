-- =====================================================
-- JOB POSTINGS - RPC FUNCTIONS
-- =====================================================

-- =====================================================
-- FUNCTION 1: Calculate Match Score between job and candidate
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_job_match_score(
    p_job_posting_id UUID,
    p_profile_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_job RECORD;
    v_profile RECORD;
    v_matching_skills INTEGER;
    v_total_required_skills INTEGER;
    v_profile_skills TEXT[];
BEGIN
    -- Get job posting data
    SELECT * INTO v_job FROM job_postings WHERE id = p_job_posting_id;
    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Get profile data
    SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Extract all skills from profile JSONB
    SELECT ARRAY(
        SELECT DISTINCT jsonb_array_elements_text(skills->'all')
        FROM profiles WHERE id = p_profile_id
    ) INTO v_profile_skills;

    -- Score 1: Matching required skills (40 points max)
    IF v_job.required_skills IS NOT NULL AND array_length(v_job.required_skills, 1) > 0 THEN
        v_total_required_skills := array_length(v_job.required_skills, 1);

        SELECT COUNT(*) INTO v_matching_skills
        FROM unnest(v_job.required_skills) AS required_skill
        WHERE required_skill = ANY(v_profile_skills);

        v_score := v_score + ((v_matching_skills * 40) / v_total_required_skills);
    ELSE
        -- If no required skills specified, give base score
        v_score := v_score + 20;
    END IF;

    -- Score 2: Experience level match (20 points)
    IF v_profile.experience_level IS NOT NULL AND v_job.experience_level IS NOT NULL THEN
        IF v_profile.experience_level = v_job.experience_level THEN
            v_score := v_score + 20;
        -- Over-qualified candidates still get partial points
        ELSIF v_profile.experience_level = 'SENIOR' AND v_job.experience_level = 'MID' THEN
            v_score := v_score + 15;
        ELSIF v_profile.experience_level = 'LEAD' AND v_job.experience_level IN ('SENIOR', 'MID') THEN
            v_score := v_score + 15;
        ELSIF v_profile.experience_level = 'MID' AND v_job.experience_level = 'JUNIOR' THEN
            v_score := v_score + 15;
        -- Under-qualified candidates get fewer points
        ELSIF v_profile.experience_level = 'JUNIOR' AND v_job.experience_level = 'MID' THEN
            v_score := v_score + 10;
        ELSIF v_profile.experience_level = 'MID' AND v_job.experience_level = 'SENIOR' THEN
            v_score := v_score + 10;
        END IF;
    ELSE
        v_score := v_score + 10; -- Base score if no experience level specified
    END IF;

    -- Score 3: Location match (20 points)
    IF v_job.is_remote = true THEN
        v_score := v_score + 20; -- Remote jobs match everyone
    ELSIF v_job.work_mode = 'HYBRID' THEN
        v_score := v_score + 15; -- Hybrid is flexible
    ELSIF v_profile.location IS NOT NULL AND v_job.location_city IS NOT NULL THEN
        -- Check if profile location contains job city
        IF v_profile.location ILIKE '%' || v_job.location_city || '%' THEN
            v_score := v_score + 20;
        ELSIF v_profile.location ILIKE '%' || v_job.location_country || '%' THEN
            v_score := v_score + 10; -- Same country gets partial points
        END IF;
    ELSE
        v_score := v_score + 5; -- Base score if location not specified
    END IF;

    -- Score 4: Profile completeness (20 points)
    -- Higher quality profiles get better match scores
    IF v_profile.profile_quality_score IS NOT NULL THEN
        v_score := v_score + (v_profile.profile_quality_score / 5); -- Max 20 points (100/5)
    ELSE
        v_score := v_score + 10; -- Base score
    END IF;

    -- Ensure score is between 0 and 100
    RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION 2: Publish Job Posting (consumes credits)
-- =====================================================

CREATE OR REPLACE FUNCTION publish_job_posting(
    p_job_posting_id UUID,
    p_company_id UUID,
    p_user_id UUID,
    p_duration_days INTEGER DEFAULT 30
) RETURNS JSONB AS $$
DECLARE
    v_credits_required INTEGER;
    v_new_balance INTEGER;
    v_job RECORD;
BEGIN
    -- Verify user is member of company
    IF NOT EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = p_company_id
        AND user_id = p_user_id
        AND role IN ('OWNER', 'ADMIN', 'MEMBER')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not authorized to publish job postings for this company';
    END IF;

    -- Get job posting and verify ownership
    SELECT * INTO v_job FROM job_postings
    WHERE id = p_job_posting_id AND company_id = p_company_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job posting not found or does not belong to this company';
    END IF;

    -- Get credits cost (default 30)
    v_credits_required := COALESCE(v_job.credits_cost, 30);

    -- Consume credits
    UPDATE companies
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
            FROM companies WHERE id = p_company_id;

            IF v_company_status != 'APPROVED' THEN
                RAISE EXCEPTION 'Company is not approved (status: %)', v_company_status;
            ELSIF v_current_balance < v_credits_required THEN
                RAISE EXCEPTION 'Insufficient credits: Need %, have %', v_credits_required, v_current_balance;
            ELSE
                RAISE EXCEPTION 'Company not found';
            END IF;
        END;
    END IF;

    -- Log credit transaction
    INSERT INTO company_credits_history (
        company_id, amount, balance_after, transaction_type,
        reference_id, description, created_by
    ) VALUES (
        p_company_id, -v_credits_required, v_new_balance, 'JOB_POSTING',
        p_job_posting_id,
        format('Published job posting: %s', v_job.title),
        p_user_id
    );

    -- Update job posting status
    UPDATE job_postings
    SET
        status = 'PUBLISHED',
        published_at = NOW(),
        application_deadline = CASE
            WHEN application_deadline IS NULL
            THEN NOW() + (p_duration_days || ' days')::INTERVAL
            ELSE application_deadline
        END,
        updated_at = NOW()
    WHERE id = p_job_posting_id;

    RETURN jsonb_build_object(
        'success', true,
        'credits_used', v_credits_required,
        'new_balance', v_new_balance,
        'published_at', NOW(),
        'application_deadline', NOW() + (p_duration_days || ' days')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION 3: Apply to Job Posting
-- =====================================================

CREATE OR REPLACE FUNCTION apply_to_job(
    p_job_posting_id UUID,
    p_profile_id UUID,
    p_cover_letter TEXT DEFAULT NULL,
    p_answers JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
    v_company_id UUID;
    v_match_score INTEGER;
    v_job_title TEXT;
    v_company_email TEXT;
    v_candidate_name TEXT;
    v_application_id UUID;
BEGIN
    -- Verify job posting exists and is published
    IF NOT EXISTS (
        SELECT 1 FROM job_postings
        WHERE id = p_job_posting_id
        AND status = 'PUBLISHED'
        AND (application_deadline IS NULL OR application_deadline > NOW())
    ) THEN
        RAISE EXCEPTION 'Job posting not found, not published, or deadline has passed';
    END IF;

    -- Verify profile belongs to current user
    IF NOT EXISTS (
        SELECT 1 FROM profiles
        WHERE id = p_profile_id AND id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Profile does not belong to current user';
    END IF;

    -- Check if already applied
    IF EXISTS (
        SELECT 1 FROM job_applications
        WHERE job_posting_id = p_job_posting_id AND profile_id = p_profile_id
    ) THEN
        RAISE EXCEPTION 'You have already applied to this job posting';
    END IF;

    -- Get company_id and job details
    SELECT company_id, title INTO v_company_id, v_job_title
    FROM job_postings WHERE id = p_job_posting_id;

    -- Get candidate name
    SELECT full_name INTO v_candidate_name FROM profiles WHERE id = p_profile_id;

    -- Get company email for notification
    SELECT company_email INTO v_company_email FROM companies WHERE id = v_company_id;

    -- Calculate match score
    v_match_score := calculate_job_match_score(p_job_posting_id, p_profile_id);

    -- Create application
    INSERT INTO job_applications (
        job_posting_id, profile_id, company_id,
        cover_letter, answers, match_score, status
    ) VALUES (
        p_job_posting_id, p_profile_id, v_company_id,
        p_cover_letter, p_answers, v_match_score, 'NEW'
    ) RETURNING id INTO v_application_id;

    -- Update application counter on job posting
    UPDATE job_postings
    SET applications_count = applications_count + 1
    WHERE id = p_job_posting_id;

    -- Send notification email to company
    PERFORM send_email_notification(
        v_company_email,
        'new-job-application',
        jsonb_build_object(
            'jobTitle', v_job_title,
            'candidateName', v_candidate_name,
            'matchScore', v_match_score,
            'applicationUrl', current_setting('app.settings.app_url', true) || '/company/jobs/' || p_job_posting_id::text || '/applications'
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'application_id', v_application_id,
        'match_score', v_match_score,
        'message', 'Application submitted successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION 4: Update Application Status
-- =====================================================

CREATE OR REPLACE FUNCTION update_application_status(
    p_application_id UUID,
    p_company_id UUID,
    p_user_id UUID,
    p_new_status VARCHAR(50),
    p_internal_notes TEXT DEFAULT NULL,
    p_rating INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_old_status VARCHAR(50);
    v_candidate_email TEXT;
    v_candidate_name TEXT;
    v_job_title TEXT;
BEGIN
    -- Verify user is member of company
    IF NOT EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = p_company_id
        AND user_id = p_user_id
        AND role IN ('OWNER', 'ADMIN', 'MEMBER')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not authorized to update applications for this company';
    END IF;

    -- Verify application belongs to company
    IF NOT EXISTS (
        SELECT 1 FROM job_applications
        WHERE id = p_application_id AND company_id = p_company_id
    ) THEN
        RAISE EXCEPTION 'Application not found or does not belong to this company';
    END IF;

    -- Get current status and candidate info
    SELECT
        ja.status,
        p.email,
        p.full_name,
        jp.title
    INTO v_old_status, v_candidate_email, v_candidate_name, v_job_title
    FROM job_applications ja
    JOIN profiles p ON p.id = ja.profile_id
    JOIN job_postings jp ON jp.id = ja.job_posting_id
    WHERE ja.id = p_application_id;

    -- Update application
    UPDATE job_applications
    SET
        status = p_new_status,
        internal_notes = COALESCE(p_internal_notes, internal_notes),
        rating = COALESCE(p_rating, rating),
        viewed_by_company = true,
        viewed_at = CASE WHEN viewed_at IS NULL THEN NOW() ELSE viewed_at END,
        viewed_by = CASE WHEN viewed_by IS NULL THEN p_user_id ELSE viewed_by END,
        updated_at = NOW()
    WHERE id = p_application_id;

    -- Send notification to candidate if status changed significantly
    IF v_old_status != p_new_status AND p_new_status IN ('INTERVIEW', 'OFFER', 'HIRED', 'REJECTED') THEN
        PERFORM send_email_notification(
            v_candidate_email,
            'application-status-update',
            jsonb_build_object(
                'candidateName', v_candidate_name,
                'jobTitle', v_job_title,
                'newStatus', p_new_status,
                'oldStatus', v_old_status,
                'applicationUrl', current_setting('app.settings.app_url', true) || '/dashboard/applications'
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'application_id', p_application_id,
        'old_status', v_old_status,
        'new_status', p_new_status
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION 5: Track Job Posting View
-- =====================================================

CREATE OR REPLACE FUNCTION track_job_posting_view(
    p_job_posting_id UUID,
    p_profile_id UUID DEFAULT NULL,
    p_ip_address VARCHAR(45) DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_view_id UUID;
BEGIN
    -- Verify job posting exists and is published
    IF NOT EXISTS (
        SELECT 1 FROM job_postings
        WHERE id = p_job_posting_id AND status = 'PUBLISHED'
    ) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Job posting not found or not published');
    END IF;

    -- Insert view tracking
    INSERT INTO job_posting_views (
        job_posting_id, profile_id, ip_address, user_agent, viewed_at
    ) VALUES (
        p_job_posting_id, p_profile_id, p_ip_address, p_user_agent, NOW()
    )
    ON CONFLICT DO NOTHING -- Avoid duplicate tracking same day
    RETURNING id INTO v_view_id;

    -- Update views counter on job posting
    IF v_view_id IS NOT NULL THEN
        UPDATE job_postings
        SET views_count = views_count + 1
        WHERE id = p_job_posting_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'view_id', v_view_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION 6: Get Job Board Listings (Public)
-- =====================================================

CREATE OR REPLACE FUNCTION get_job_board_listings(
    p_search_keywords TEXT DEFAULT NULL,
    p_location_country VARCHAR(2) DEFAULT NULL,
    p_location_city VARCHAR(100) DEFAULT NULL,
    p_employment_type VARCHAR(50) DEFAULT NULL,
    p_work_mode VARCHAR(50) DEFAULT NULL,
    p_experience_level VARCHAR(50) DEFAULT NULL,
    p_required_skills VARCHAR(100)[] DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    id UUID,
    title VARCHAR(200),
    slug VARCHAR(250),
    company_name VARCHAR(255),
    company_logo TEXT,
    location_city VARCHAR(100),
    location_country VARCHAR(2),
    is_remote BOOLEAN,
    employment_type VARCHAR(50),
    work_mode VARCHAR(50),
    experience_level VARCHAR(50),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3),
    show_salary BOOLEAN,
    required_skills VARCHAR(100)[],
    published_at TIMESTAMPTZ,
    applications_count INTEGER,
    views_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        jp.id,
        jp.title,
        jp.slug,
        c.company_name,
        c.logo_url,
        jp.location_city,
        jp.location_country,
        jp.is_remote,
        jp.employment_type,
        jp.work_mode,
        jp.experience_level,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency,
        jp.show_salary,
        jp.required_skills,
        jp.published_at,
        jp.applications_count,
        jp.views_count
    FROM job_postings jp
    JOIN companies c ON c.id = jp.company_id
    WHERE
        jp.status = 'PUBLISHED'
        AND (jp.application_deadline IS NULL OR jp.application_deadline > NOW())
        AND (p_search_keywords IS NULL OR
             to_tsvector('spanish', jp.title || ' ' || jp.description) @@ plainto_tsquery('spanish', p_search_keywords))
        AND (p_location_country IS NULL OR jp.location_country = p_location_country OR jp.is_remote = true)
        AND (p_location_city IS NULL OR jp.location_city ILIKE '%' || p_location_city || '%' OR jp.is_remote = true)
        AND (p_employment_type IS NULL OR jp.employment_type = p_employment_type)
        AND (p_work_mode IS NULL OR jp.work_mode = p_work_mode)
        AND (p_experience_level IS NULL OR jp.experience_level = p_experience_level)
        AND (p_required_skills IS NULL OR jp.required_skills && p_required_skills) -- Array overlap
    ORDER BY jp.published_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANT EXECUTE PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION calculate_job_match_score TO authenticated;
GRANT EXECUTE ON FUNCTION publish_job_posting TO authenticated;
GRANT EXECUTE ON FUNCTION apply_to_job TO authenticated;
GRANT EXECUTE ON FUNCTION update_application_status TO authenticated;
GRANT EXECUTE ON FUNCTION track_job_posting_view TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_job_board_listings TO authenticated, anon;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION calculate_job_match_score IS 'Calculate match score (0-100) between job posting and candidate profile';
COMMENT ON FUNCTION publish_job_posting IS 'Publish a job posting and consume company credits';
COMMENT ON FUNCTION apply_to_job IS 'Submit a job application as a candidate';
COMMENT ON FUNCTION update_application_status IS 'Update application status (company only)';
COMMENT ON FUNCTION track_job_posting_view IS 'Track view analytics for job postings';
COMMENT ON FUNCTION get_job_board_listings IS 'Get filtered list of published job postings for job board';
