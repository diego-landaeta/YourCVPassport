-- Fix type mismatch in get_company_team_members function
-- PostgreSQL is strict about VARCHAR vs TEXT types

DROP FUNCTION IF EXISTS public.get_company_team_members(UUID);

CREATE OR REPLACE FUNCTION public.get_company_team_members(p_company_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    company_id UUID,
    role TEXT,
    invited_by UUID,
    invited_at TIMESTAMPTZ,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ,
    email TEXT,
    full_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    -- Check if the requesting user is a member of this company
    IF NOT EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = p_company_id
        AND company_users.user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Not authorized to view this company team';
    END IF;

    -- Return team members with their profile information
    RETURN QUERY
    SELECT
        cu.id::UUID,
        cu.user_id::UUID,
        cu.company_id::UUID,
        cu.role::TEXT,
        cu.invited_by::UUID,
        cu.invited_at::TIMESTAMPTZ,
        cu.accepted_at::TIMESTAMPTZ,
        cu.created_at::TIMESTAMPTZ,
        p.email::TEXT,
        p.full_name::TEXT
    FROM public.company_users cu
    LEFT JOIN public.profiles p ON p.id = cu.user_id
    WHERE cu.company_id = p_company_id
    ORDER BY cu.created_at ASC;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_company_team_members(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION public.get_company_team_members(UUID) IS
'Returns all team members for a company with their profile information. Only accessible by company members. Uses SECURITY DEFINER to bypass RLS and avoid recursion issues. Fixed type casting to use TEXT instead of VARCHAR.';
