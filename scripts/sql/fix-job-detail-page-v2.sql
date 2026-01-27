-- ============================================================
-- FIX: Error 400 en página de detalle de vacante (V2)
-- ============================================================
-- Corregido: c.website no existe, usar campo correcto
-- ============================================================

-- PASO 0: Verificar columnas de companies
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'companies';

-- PASO 1: Crear tabla job_posting_views si no existe
CREATE TABLE IF NOT EXISTS public.job_posting_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address TEXT,
    user_agent TEXT
);

-- RLS para job_posting_views
ALTER TABLE public.job_posting_views ENABLE ROW LEVEL SECURITY;

-- Permitir insertar vistas a todos (públicos y autenticados)
DROP POLICY IF EXISTS "Anyone can insert job views" ON public.job_posting_views;
CREATE POLICY "Anyone can insert job views"
ON public.job_posting_views FOR INSERT
TO public
WITH CHECK (true);

-- Solo la empresa puede ver las vistas de sus vacantes
DROP POLICY IF EXISTS "Company can view their job views" ON public.job_posting_views;
CREATE POLICY "Company can view their job views"
ON public.job_posting_views FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.job_postings jp
        JOIN public.company_users cu ON cu.company_id = jp.company_id
        WHERE jp.id = job_posting_views.job_posting_id
        AND cu.user_id = auth.uid()
    )
);

-- PASO 2: Crear función para incrementar contadores
CREATE OR REPLACE FUNCTION public.increment(
    row_id UUID,
    table_name TEXT,
    column_name TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE format(
        'UPDATE public.%I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
        table_name,
        column_name,
        column_name
    ) USING row_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment TO anon;
GRANT EXECUTE ON FUNCTION public.increment TO authenticated;

-- PASO 3: Agregar columna website a companies si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'companies' AND column_name = 'website') THEN
        ALTER TABLE public.companies ADD COLUMN website TEXT;
    END IF;
END $$;

-- PASO 4: Crear función RPC para obtener detalle de vacante
-- NOTA: Usamos COALESCE para campos que pueden no existir
CREATE OR REPLACE FUNCTION public.get_job_posting_detail(p_slug VARCHAR)
RETURNS TABLE(
    id UUID,
    title VARCHAR,
    slug VARCHAR,
    company_id UUID,
    department VARCHAR,
    employment_type VARCHAR,
    work_mode VARCHAR,
    experience_level VARCHAR,
    location_city VARCHAR,
    location_state VARCHAR,
    location_country VARCHAR,
    is_remote BOOLEAN,
    description TEXT,
    responsibilities TEXT[],
    requirements TEXT[],
    nice_to_have TEXT[],
    benefits TEXT[],
    required_skills VARCHAR[],
    optional_skills VARCHAR[],
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR,
    salary_period VARCHAR,
    show_salary BOOLEAN,
    application_deadline TIMESTAMPTZ,
    application_email VARCHAR,
    application_url TEXT,
    application_instructions TEXT,
    published_at TIMESTAMPTZ,
    company_name VARCHAR,
    company_logo_url TEXT,
    company_website TEXT,
    company_description TEXT
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
        jp.department,
        jp.employment_type,
        jp.work_mode,
        jp.experience_level,
        jp.location_city,
        jp.location_state,
        jp.location_country,
        jp.is_remote,
        jp.description,
        jp.responsibilities,
        jp.requirements,
        jp.nice_to_have,
        jp.benefits,
        jp.required_skills,
        jp.optional_skills,
        jp.salary_min,
        jp.salary_max,
        jp.salary_currency,
        jp.salary_period,
        jp.show_salary,
        jp.application_deadline,
        jp.application_email,
        jp.application_url,
        jp.application_instructions,
        jp.published_at,
        c.company_name,
        c.logo_url,
        c.website,
        c.description
    FROM public.job_postings jp
    JOIN public.companies c ON c.id = jp.company_id
    WHERE
        jp.slug = p_slug
        AND jp.status = 'PUBLISHED'
        AND jp.published_at IS NOT NULL
        AND c.status = 'APPROVED';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_job_posting_detail TO anon;
GRANT EXECUTE ON FUNCTION public.get_job_posting_detail TO authenticated;

-- PASO 5: Crear tabla job_posting_questions si no existe
CREATE TABLE IF NOT EXISTS public.job_posting_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'TEXT',
    options JSONB,
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.job_posting_questions ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede ver las preguntas de vacantes publicadas
DROP POLICY IF EXISTS "Public can view questions of published jobs" ON public.job_posting_questions;
CREATE POLICY "Public can view questions of published jobs"
ON public.job_posting_questions FOR SELECT
TO public
USING (
    EXISTS (
        SELECT 1 FROM public.job_postings jp
        WHERE jp.id = job_posting_questions.job_posting_id
        AND jp.status = 'PUBLISHED'
    )
);

-- Miembros de empresa pueden gestionar preguntas
DROP POLICY IF EXISTS "Company members manage questions" ON public.job_posting_questions;
CREATE POLICY "Company members manage questions"
ON public.job_posting_questions FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.job_postings jp
        JOIN public.company_users cu ON cu.company_id = jp.company_id
        WHERE jp.id = job_posting_questions.job_posting_id
        AND cu.user_id = auth.uid()
    )
);

GRANT SELECT ON public.job_posting_questions TO anon;

-- PASO 6: Asegurar que columnas necesarias existan en job_postings
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'responsibilities') THEN
        ALTER TABLE public.job_postings ADD COLUMN responsibilities TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'requirements') THEN
        ALTER TABLE public.job_postings ADD COLUMN requirements TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'nice_to_have') THEN
        ALTER TABLE public.job_postings ADD COLUMN nice_to_have TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'benefits') THEN
        ALTER TABLE public.job_postings ADD COLUMN benefits TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'optional_skills') THEN
        ALTER TABLE public.job_postings ADD COLUMN optional_skills VARCHAR[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'salary_period') THEN
        ALTER TABLE public.job_postings ADD COLUMN salary_period VARCHAR(20) DEFAULT 'MONTHLY';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'application_email') THEN
        ALTER TABLE public.job_postings ADD COLUMN application_email VARCHAR(255);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'application_url') THEN
        ALTER TABLE public.job_postings ADD COLUMN application_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'application_instructions') THEN
        ALTER TABLE public.job_postings ADD COLUMN application_instructions TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'department') THEN
        ALTER TABLE public.job_postings ADD COLUMN department VARCHAR(100);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'job_postings' AND column_name = 'location_state') THEN
        ALTER TABLE public.job_postings ADD COLUMN location_state VARCHAR(100);
    END IF;
END $$;

-- PASO 7: Verificación
SELECT 'Job detail page fixes applied successfully!' as status;

-- Probar la función
SELECT * FROM get_job_posting_detail((SELECT slug FROM job_postings WHERE status = 'PUBLISHED' LIMIT 1));
