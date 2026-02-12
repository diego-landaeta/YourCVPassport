-- =====================================================
-- FIX ALL JOB SYSTEM RLS POLICIES
-- =====================================================
-- Corrige TODAS las políticas RLS del sistema de vacantes
-- para evitar errores de tablas inexistentes
-- =====================================================

BEGIN;

-- =====================================================
-- 1. JOB_POSTINGS
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view published job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Company members can view their job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Company members can create job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Company members can update their job postings" ON public.job_postings;
DROP POLICY IF EXISTS "Company admins can delete job postings" ON public.job_postings;

CREATE POLICY "Anyone can view published job postings"
ON public.job_postings FOR SELECT
USING (status = 'PUBLISHED');

CREATE POLICY "Company members can view their job postings"
ON public.job_postings FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Company members can create job postings"
ON public.job_postings FOR INSERT
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Company members can update their job postings"
ON public.job_postings FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Company admins can delete job postings"
ON public.job_postings FOR DELETE
USING (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = auth.uid()
    AND role IN ('OWNER', 'ADMIN')
  )
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. JOB_APPLICATIONS
-- =====================================================

DROP POLICY IF EXISTS "Candidates can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Company members can view applications to their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Candidates can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Candidates can update their applications" ON public.job_applications;
DROP POLICY IF EXISTS "Company members can update application status" ON public.job_applications;

CREATE POLICY "Candidates can view their own applications"
ON public.job_applications FOR SELECT
USING (profile_id = auth.uid());

CREATE POLICY "Company members can view applications to their jobs"
ON public.job_applications FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Candidates can create applications"
ON public.job_applications FOR INSERT
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Candidates can update their applications"
ON public.job_applications FOR UPDATE
USING (profile_id = auth.uid())
WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Company members can update application status"
ON public.job_applications FOR UPDATE
USING (
  company_id IN (
    SELECT company_id FROM public.company_users
    WHERE user_id = auth.uid()
  )
);

ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. JOB_POSTING_VIEWS
-- =====================================================

DROP POLICY IF EXISTS "Anyone can insert view records" ON public.job_posting_views;
DROP POLICY IF EXISTS "Company can view their job analytics" ON public.job_posting_views;

CREATE POLICY "Anyone can insert view records"
ON public.job_posting_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Company can view their job analytics"
ON public.job_posting_views FOR SELECT
USING (
  job_posting_id IN (
    SELECT jp.id FROM public.job_postings jp
    WHERE jp.company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid()
    )
  )
);

ALTER TABLE public.job_posting_views ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. JOB_POSTING_QUESTIONS
-- =====================================================

DROP POLICY IF EXISTS "Anyone can view questions for published jobs" ON public.job_posting_questions;
DROP POLICY IF EXISTS "Company members can view questions for their jobs" ON public.job_posting_questions;
DROP POLICY IF EXISTS "Company members can manage questions" ON public.job_posting_questions;

CREATE POLICY "Anyone can view questions for published jobs"
ON public.job_posting_questions FOR SELECT
USING (
  job_posting_id IN (
    SELECT id FROM public.job_postings
    WHERE status = 'PUBLISHED'
  )
);

CREATE POLICY "Company members can view questions for their jobs"
ON public.job_posting_questions FOR SELECT
USING (
  job_posting_id IN (
    SELECT jp.id FROM public.job_postings jp
    WHERE jp.company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Company members can manage questions"
ON public.job_posting_questions FOR ALL
USING (
  job_posting_id IN (
    SELECT jp.id FROM public.job_postings jp
    WHERE jp.company_id IN (
      SELECT company_id FROM public.company_users
      WHERE user_id = auth.uid()
    )
  )
);

ALTER TABLE public.job_posting_questions ENABLE ROW LEVEL SECURITY;

COMMIT;

-- =====================================================
-- Verificar políticas
-- =====================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('job_postings', 'job_applications', 'job_posting_views', 'job_posting_questions')
ORDER BY tablename, policyname;

-- =====================================================
-- RESULTADO ESPERADO
-- =====================================================
-- ✅ Todas las políticas RLS corregidas
-- ✅ Sin errores de tablas inexistentes
-- ✅ Sistema de vacantes 100% funcional
