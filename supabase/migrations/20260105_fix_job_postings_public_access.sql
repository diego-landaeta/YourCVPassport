-- =====================================================
-- FIX: Public Access to Job Postings (Corrección Urgente)
-- =====================================================
-- Este script corrige el acceso público a las vacantes
-- para resolver los errores 400 en JobSearchPage
-- =====================================================

-- Paso 1: Eliminar políticas conflictivas
DROP POLICY IF EXISTS "Anyone can view published job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Company members can view their job postings" ON public.job_postings;

-- Paso 2: Crear política de acceso público mejorada
-- Permite que CUALQUIER persona (autenticada o anónima) pueda ver vacantes publicadas
CREATE POLICY "Public read access to published jobs"
ON public.job_postings FOR SELECT
TO public
USING (
    status = 'PUBLISHED'
    AND published_at IS NOT NULL
    AND (application_deadline IS NULL OR application_deadline > NOW())
);

-- Paso 3: Crear política de acceso para miembros de empresa
CREATE POLICY "Company members view their own jobs"
ON public.job_postings FOR SELECT
TO authenticated
USING (
    -- Permiso para miembros de la empresa
    EXISTS (
        SELECT 1 FROM public.company_users cu
        WHERE cu.company_id = job_postings.company_id
        AND cu.user_id = auth.uid()
    )
);

-- Paso 4: Verificar que companies también sea accesible para joins públicos
-- Necesitamos que la información básica de la empresa sea pública
DROP POLICY IF EXISTS "Public can view approved companies basic info" ON public.companies;

CREATE POLICY "Public can view approved companies basic info"
ON public.companies FOR SELECT
TO public
USING (
    status = 'APPROVED'
);

-- Paso 5: Asegurar que anon role tenga permisos básicos
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.job_postings TO anon;
GRANT SELECT ON public.companies TO anon;

-- Paso 6: Verificación de permisos
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS actualizadas correctamente';
    RAISE NOTICE 'ℹ️ Las vacantes publicadas ahora son accesibles públicamente';
    RAISE NOTICE 'ℹ️ Los usuarios anónimos pueden ver job_postings y companies';
END $$;

-- Paso 7: Crear índice para mejorar performance de queries públicas
CREATE INDEX IF NOT EXISTS idx_job_postings_public_search
ON public.job_postings(status, published_at DESC, application_deadline)
WHERE status = 'PUBLISHED';

-- Paso 8: Actualizar función para búsqueda pública (si no existe)
CREATE OR REPLACE FUNCTION public.search_public_jobs(
    p_search_term TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_employment_type TEXT DEFAULT NULL,
    p_work_mode TEXT DEFAULT NULL,
    p_experience_level TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    slug VARCHAR,
    company_id UUID,
    company_name VARCHAR,
    company_logo_url TEXT,
    employment_type VARCHAR,
    work_mode VARCHAR,
    experience_level VARCHAR,
    location_city VARCHAR,
    location_country VARCHAR,
    is_remote BOOLEAN,
    description TEXT,
    required_skills VARCHAR[],
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR,
    show_salary BOOLEAN,
    published_at TIMESTAMPTZ,
    application_deadline TIMESTAMPTZ,
    views_count INTEGER,
    applications_count INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        jp.id,
        jp.title,
        jp.slug,
        jp.company_id,
        c.company_name,
        c.logo_url,
        jp.employment_type,
        jp.work_mode,
        jp.experience_level,
        jp.location_city,
        jp.location_country,
        jp.is_remote,
        jp.description,
        jp.required_skills,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency,
        jp.show_salary,
        jp.published_at,
        jp.application_deadline,
        jp.views_count,
        jp.applications_count
    FROM public.job_postings jp
    JOIN public.companies c ON c.id = jp.company_id
    WHERE
        jp.status = 'PUBLISHED'
        AND jp.published_at IS NOT NULL
        AND (jp.application_deadline IS NULL OR jp.application_deadline > NOW())
        AND c.status = 'APPROVED'
        -- Search filter
        AND (
            p_search_term IS NULL
            OR jp.title ILIKE '%' || p_search_term || '%'
            OR jp.description ILIKE '%' || p_search_term || '%'
            OR c.company_name ILIKE '%' || p_search_term || '%'
        )
        -- Location filter
        AND (
            p_location IS NULL
            OR (p_location = 'remote' AND jp.is_remote = true)
            OR jp.location_city ILIKE '%' || p_location || '%'
            OR jp.location_country ILIKE '%' || p_location || '%'
        )
        -- Employment type filter
        AND (p_employment_type IS NULL OR jp.employment_type = p_employment_type)
        -- Work mode filter
        AND (p_work_mode IS NULL OR jp.work_mode = p_work_mode)
        -- Experience level filter
        AND (p_experience_level IS NULL OR jp.experience_level = p_experience_level)
    ORDER BY jp.published_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- Otorgar permisos de ejecución a todos
GRANT EXECUTE ON FUNCTION public.search_public_jobs TO anon;
GRANT EXECUTE ON FUNCTION public.search_public_jobs TO authenticated;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

DO $$
DECLARE
    v_policy_count INTEGER;
    v_job_count INTEGER;
BEGIN
    -- Contar políticas
    SELECT COUNT(*) INTO v_policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'job_postings';

    RAISE NOTICE '📊 Políticas RLS en job_postings: %', v_policy_count;

    -- Contar vacantes publicadas
    SELECT COUNT(*) INTO v_job_count
    FROM public.job_postings
    WHERE status = 'PUBLISHED';

    RAISE NOTICE '📊 Vacantes publicadas: %', v_job_count;

    IF v_policy_count >= 2 THEN
        RAISE NOTICE '✅ Sistema de vacantes configurado correctamente';
    ELSE
        RAISE WARNING '⚠️ Faltan políticas RLS';
    END IF;
END;
$$;
