-- =====================================================
-- JOB POSTINGS SYSTEM - CORE TABLES
-- =====================================================
-- This migration creates the job posting system that allows
-- companies to publish job vacancies and receive applications

-- =====================================================
-- TABLE 1: job_postings (Vacantes de Empleo)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Relación con empresa
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),

    -- Información básica
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(250) UNIQUE, -- Para URLs amigables: /jobs/senior-react-developer-madrid-123

    -- Detalles de la posición
    department VARCHAR(100),
    employment_type VARCHAR(50) CHECK (employment_type IN (
        'FULL_TIME', 'PART_TIME', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP', 'FREELANCE'
    )),
    work_mode VARCHAR(50) CHECK (work_mode IN ('REMOTE', 'ONSITE', 'HYBRID')),
    experience_level VARCHAR(50) CHECK (experience_level IN (
        'ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD', 'EXECUTIVE'
    )),

    -- Ubicación
    location_city VARCHAR(100),
    location_state VARCHAR(100),
    location_country VARCHAR(2), -- ISO country code
    is_remote BOOLEAN DEFAULT false,

    -- Descripción (HTML sanitizado)
    description TEXT NOT NULL,
    responsibilities TEXT[], -- Array de responsabilidades
    requirements TEXT[], -- Array de requisitos
    nice_to_have TEXT[], -- Requisitos opcionales
    benefits TEXT[], -- Beneficios

    -- Habilidades requeridas
    required_skills VARCHAR(100)[], -- ['React', 'TypeScript', 'Node.js']
    optional_skills VARCHAR(100)[],

    -- Salario (opcional, puede ser privado)
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(3) DEFAULT 'USD',
    salary_period VARCHAR(20) CHECK (salary_period IN ('HOURLY', 'MONTHLY', 'YEARLY')),
    show_salary BOOLEAN DEFAULT false,

    -- Configuración de aplicación
    application_deadline TIMESTAMPTZ,
    application_email VARCHAR(255), -- Email alternativo para recibir aplicaciones
    application_url TEXT, -- URL externa (ej: LinkedIn, Indeed)
    application_instructions TEXT,

    -- Estado y visibilidad
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT',      -- Borrador, no visible
        'PUBLISHED',  -- Publicada, visible para candidatos
        'PAUSED',     -- Pausada temporalmente
        'CLOSED',     -- Cerrada, no acepta más aplicaciones
        'FILLED'      -- Posición ocupada
    )),
    published_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,

    -- SEO
    meta_title VARCHAR(200),
    meta_description TEXT,

    -- Estadísticas
    views_count INTEGER DEFAULT 0,
    applications_count INTEGER DEFAULT 0,

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    -- Créditos
    credits_cost INTEGER DEFAULT 30, -- Costo en créditos para publicar

    CONSTRAINT valid_salary_range CHECK (
        salary_max IS NULL OR salary_min IS NULL OR salary_max >= salary_min
    ),
    CONSTRAINT valid_deadline CHECK (
        application_deadline IS NULL OR application_deadline > created_at
    )
);

-- =====================================================
-- TABLE 2: job_applications (Aplicaciones a Vacantes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.job_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Relaciones
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,

    -- Estado de la aplicación
    status VARCHAR(50) DEFAULT 'NEW' CHECK (status IN (
        'NEW',              -- Nueva aplicación, sin revisar
        'REVIEWING',        -- En revisión
        'SHORTLISTED',      -- Pre-seleccionado
        'INTERVIEW',        -- En proceso de entrevistas
        'OFFER',            -- Oferta enviada
        'HIRED',            -- Contratado
        'REJECTED',         -- Rechazado
        'WITHDRAWN'         -- Candidato retiró su aplicación
    )),

    -- Información de la aplicación
    cover_letter TEXT,
    resume_url TEXT, -- URL del CV si subió uno diferente
    answers JSONB DEFAULT '{}'::jsonb, -- Respuestas a preguntas personalizadas

    -- Tracking
    viewed_by_company BOOLEAN DEFAULT false,
    viewed_at TIMESTAMPTZ,
    viewed_by UUID REFERENCES auth.users(id),

    -- Notas internas de la empresa (no visibles para candidato)
    internal_notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),

    -- Match score (calculado automáticamente 0-100)
    match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),

    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,

    UNIQUE(job_posting_id, profile_id) -- Un candidato solo puede aplicar una vez por vacante
);

-- =====================================================
-- TABLE 3: job_posting_views (Tracking de vistas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.job_posting_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE 4: job_posting_questions (Preguntas personalizadas)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.job_posting_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_posting_id UUID NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) CHECK (question_type IN ('TEXT', 'TEXTAREA', 'YES_NO', 'MULTIPLE_CHOICE')),
    options JSONB, -- Para preguntas de opción múltiple ['Option 1', 'Option 2']
    is_required BOOLEAN DEFAULT false,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDICES FOR PERFORMANCE
-- =====================================================

-- job_postings indices
CREATE INDEX idx_job_postings_company ON public.job_postings(company_id);
CREATE INDEX idx_job_postings_status ON public.job_postings(status);
CREATE INDEX idx_job_postings_slug ON public.job_postings(slug);
CREATE INDEX idx_job_postings_published ON public.job_postings(published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX idx_job_postings_location ON public.job_postings(location_country, location_city);
CREATE INDEX idx_job_postings_skills ON public.job_postings USING gin(required_skills);
CREATE INDEX idx_job_postings_employment_type ON public.job_postings(employment_type);
CREATE INDEX idx_job_postings_work_mode ON public.job_postings(work_mode);

-- Full-text search index
CREATE INDEX idx_job_postings_search ON public.job_postings
USING gin(to_tsvector('spanish', title || ' ' || COALESCE(description, '')));

-- job_applications indices
CREATE INDEX idx_job_applications_job ON public.job_applications(job_posting_id);
CREATE INDEX idx_job_applications_profile ON public.job_applications(profile_id);
CREATE INDEX idx_job_applications_company ON public.job_applications(company_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_job_applications_created ON public.job_applications(created_at DESC);
CREATE INDEX idx_job_applications_match_score ON public.job_applications(match_score DESC);

-- job_posting_views indices
CREATE INDEX idx_job_views_posting ON public.job_posting_views(job_posting_id);
CREATE INDEX idx_job_views_profile ON public.job_posting_views(profile_id);
CREATE INDEX idx_job_views_date ON public.job_posting_views(viewed_at DESC);

-- job_posting_questions indices
CREATE INDEX idx_job_questions_posting ON public.job_posting_questions(job_posting_id, order_index);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posting_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_posting_questions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - job_postings
-- =====================================================

-- Company members can view their own job postings
CREATE POLICY "Company members can view their job postings"
ON public.job_postings FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = job_postings.company_id
        AND company_users.user_id = auth.uid()
    )
);

-- Anyone can view published job postings (public job board)
CREATE POLICY "Anyone can view published job postings"
ON public.job_postings FOR SELECT
USING (status = 'PUBLISHED' AND published_at IS NOT NULL);

-- Company members (OWNER, ADMIN, MEMBER) can create job postings
CREATE POLICY "Company members can create job postings"
ON public.job_postings FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = job_postings.company_id
        AND company_users.user_id = auth.uid()
        AND company_users.role IN ('OWNER', 'ADMIN', 'MEMBER')
    )
);

-- Company members (OWNER, ADMIN, MEMBER) can update their job postings
CREATE POLICY "Company members can update job postings"
ON public.job_postings FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = job_postings.company_id
        AND company_users.user_id = auth.uid()
        AND company_users.role IN ('OWNER', 'ADMIN', 'MEMBER')
    )
);

-- Company OWNER and ADMIN can delete job postings
CREATE POLICY "Company owners and admins can delete job postings"
ON public.job_postings FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = job_postings.company_id
        AND company_users.user_id = auth.uid()
        AND company_users.role IN ('OWNER', 'ADMIN')
    )
);

-- =====================================================
-- RLS POLICIES - job_applications
-- =====================================================

-- Authenticated users (candidates) can view their own applications
CREATE POLICY "Candidates can view their applications"
ON public.job_applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = job_applications.profile_id
        AND profiles.id = auth.uid()
    )
);

-- Company members can view applications to their job postings
CREATE POLICY "Company members can view applications"
ON public.job_applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = job_applications.company_id
        AND company_users.user_id = auth.uid()
    )
);

-- Authenticated users with profile can create applications
CREATE POLICY "Candidates can create applications"
ON public.job_applications FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = job_applications.profile_id
        AND profiles.id = auth.uid()
    )
);

-- Candidates can update their own applications (e.g., withdraw)
CREATE POLICY "Candidates can update their applications"
ON public.job_applications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = job_applications.profile_id
        AND profiles.id = auth.uid()
    )
);

-- Company members can update application status
CREATE POLICY "Company members can update application status"
ON public.job_applications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.company_users
        WHERE company_users.company_id = job_applications.company_id
        AND company_users.user_id = auth.uid()
        AND company_users.role IN ('OWNER', 'ADMIN', 'MEMBER')
    )
);

-- =====================================================
-- RLS POLICIES - job_posting_views
-- =====================================================

-- Company members can view analytics for their postings
CREATE POLICY "Company members can view analytics"
ON public.job_posting_views FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.job_postings jp
        JOIN public.company_users cu ON cu.company_id = jp.company_id
        WHERE jp.id = job_posting_views.job_posting_id
        AND cu.user_id = auth.uid()
    )
);

-- Anyone can insert view tracking (anonymous or authenticated)
CREATE POLICY "Anyone can track views"
ON public.job_posting_views FOR INSERT
WITH CHECK (true);

-- =====================================================
-- RLS POLICIES - job_posting_questions
-- =====================================================

-- Anyone can view questions for published job postings
CREATE POLICY "Anyone can view questions for published jobs"
ON public.job_posting_questions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.job_postings
        WHERE job_postings.id = job_posting_questions.job_posting_id
        AND job_postings.status = 'PUBLISHED'
    )
);

-- Company members can view questions for their job postings
CREATE POLICY "Company members can view their questions"
ON public.job_posting_questions FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.job_postings jp
        JOIN public.company_users cu ON cu.company_id = jp.company_id
        WHERE jp.id = job_posting_questions.job_posting_id
        AND cu.user_id = auth.uid()
    )
);

-- Company members can manage questions
CREATE POLICY "Company members can manage questions"
ON public.job_posting_questions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.job_postings jp
        JOIN public.company_users cu ON cu.company_id = jp.company_id
        WHERE jp.id = job_posting_questions.job_posting_id
        AND cu.user_id = auth.uid()
        AND cu.role IN ('OWNER', 'ADMIN', 'MEMBER')
    )
);

-- =====================================================
-- TRIGGER: Update updated_at timestamp
-- =====================================================

CREATE OR REPLACE FUNCTION update_job_posting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_job_posting_timestamp
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION update_job_posting_updated_at();

CREATE TRIGGER trigger_update_job_application_timestamp
BEFORE UPDATE ON public.job_applications
FOR EACH ROW
EXECUTE FUNCTION update_job_posting_updated_at();

-- =====================================================
-- TRIGGER: Auto-generate slug from title
-- =====================================================

CREATE OR REPLACE FUNCTION generate_job_posting_slug()
RETURNS TRIGGER AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        -- Generate base slug from title
        base_slug := lower(regexp_replace(
            regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'),
            '\s+', '-', 'g'
        ));

        -- Add location if available
        IF NEW.location_city IS NOT NULL THEN
            base_slug := base_slug || '-' || lower(regexp_replace(NEW.location_city, '\s+', '-', 'g'));
        END IF;

        -- Ensure uniqueness
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

CREATE TRIGGER trigger_generate_job_posting_slug
BEFORE INSERT OR UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION generate_job_posting_slug();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.job_postings IS 'Job vacancy postings created by companies';
COMMENT ON TABLE public.job_applications IS 'Candidate applications to job postings';
COMMENT ON TABLE public.job_posting_views IS 'Analytics tracking for job posting views';
COMMENT ON TABLE public.job_posting_questions IS 'Custom screening questions for job postings';

COMMENT ON COLUMN public.job_postings.slug IS 'URL-friendly identifier for SEO (auto-generated from title)';
COMMENT ON COLUMN public.job_postings.credits_cost IS 'Credits required to publish this job posting';
COMMENT ON COLUMN public.job_applications.match_score IS 'AI-calculated match score between candidate and job (0-100)';
COMMENT ON COLUMN public.job_applications.internal_notes IS 'Private notes from company, not visible to candidate';
