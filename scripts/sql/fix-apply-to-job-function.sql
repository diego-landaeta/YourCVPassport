-- ============================================================
-- FIX: Error "record v_profile has no field experience_level"
-- ============================================================
-- El problema: profiles no tiene el campo experience_level
-- Solución: Simplificar calculate_job_match_score para no depender
-- de campos que pueden no existir en profiles
-- ============================================================

-- EJECUTA ESTO EN SUPABASE SQL EDITOR:

-- =====================================================
-- FUNCTION: Calculate Match Score (FIXED)
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_job_match_score(
    p_job_posting_id UUID,
    p_profile_id UUID
) RETURNS INTEGER AS $$
DECLARE
    v_score INTEGER := 0;
    v_job RECORD;
    v_matching_skills INTEGER;
    v_total_required_skills INTEGER;
    v_profile_skills TEXT[];
    v_profile_location TEXT;
    v_profile_quality INTEGER;
BEGIN
    -- Get job posting data
    SELECT * INTO v_job FROM job_postings WHERE id = p_job_posting_id;
    IF NOT FOUND THEN
        RETURN 0;
    END IF;

    -- Check if profile exists
    IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = p_profile_id) THEN
        RETURN 0;
    END IF;

    -- Get profile location and quality score
    SELECT
        COALESCE(location, ''),
        COALESCE(profile_quality_score, 50)
    INTO v_profile_location, v_profile_quality
    FROM profiles WHERE id = p_profile_id;

    -- Extract all skills from profile JSONB safely
    BEGIN
        SELECT ARRAY(
            SELECT DISTINCT jsonb_array_elements_text(skills->'all')
            FROM profiles WHERE id = p_profile_id
            AND skills IS NOT NULL
            AND skills->'all' IS NOT NULL
        ) INTO v_profile_skills;
    EXCEPTION WHEN OTHERS THEN
        v_profile_skills := ARRAY[]::TEXT[];
    END;

    -- Score 1: Matching required skills (50 points max)
    IF v_job.required_skills IS NOT NULL AND array_length(v_job.required_skills, 1) > 0 THEN
        v_total_required_skills := array_length(v_job.required_skills, 1);

        SELECT COUNT(*) INTO v_matching_skills
        FROM unnest(v_job.required_skills) AS required_skill
        WHERE LOWER(required_skill) = ANY(
            SELECT LOWER(s) FROM unnest(v_profile_skills) AS s
        );

        IF v_total_required_skills > 0 THEN
            v_score := v_score + ((v_matching_skills * 50) / v_total_required_skills);
        END IF;
    ELSE
        -- If no required skills specified, give base score
        v_score := v_score + 25;
    END IF;

    -- Score 2: Location match (25 points)
    IF v_job.is_remote = true THEN
        v_score := v_score + 25; -- Remote jobs match everyone
    ELSIF v_job.work_mode = 'HYBRID' THEN
        v_score := v_score + 20; -- Hybrid is flexible
    ELSIF v_profile_location != '' AND v_job.location_city IS NOT NULL THEN
        -- Check if profile location contains job city
        IF v_profile_location ILIKE '%' || v_job.location_city || '%' THEN
            v_score := v_score + 25;
        ELSIF v_job.location_country IS NOT NULL AND v_profile_location ILIKE '%' || v_job.location_country || '%' THEN
            v_score := v_score + 15; -- Same country gets partial points
        ELSE
            v_score := v_score + 10;
        END IF;
    ELSE
        v_score := v_score + 15; -- Base score if location not specified
    END IF;

    -- Score 3: Profile completeness (25 points)
    -- Higher quality profiles get better match scores
    v_score := v_score + (v_profile_quality / 4); -- Max 25 points (100/4)

    -- Ensure score is between 0 and 100
    RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FUNCTION: Apply to Job (SIMPLIFIED - no email dependency)
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
    v_application_id UUID;
BEGIN
    -- Verify job posting exists and is published
    IF NOT EXISTS (
        SELECT 1 FROM job_postings
        WHERE id = p_job_posting_id
        AND status = 'PUBLISHED'
        AND (application_deadline IS NULL OR application_deadline > NOW())
    ) THEN
        RAISE EXCEPTION 'Job not available';
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
        RAISE EXCEPTION 'Already applied';
    END IF;

    -- Get company_id and job details
    SELECT company_id, title INTO v_company_id, v_job_title
    FROM job_postings WHERE id = p_job_posting_id;

    -- Calculate match score (now safe)
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
    SET applications_count = COALESCE(applications_count, 0) + 1
    WHERE id = p_job_posting_id;

    RETURN jsonb_build_object(
        'success', true,
        'application_id', v_application_id,
        'match_score', v_match_score,
        'message', 'Application submitted successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION calculate_job_match_score TO authenticated;
GRANT EXECUTE ON FUNCTION apply_to_job TO authenticated;

-- Verification
SELECT 'apply_to_job function fixed successfully!' as status;
