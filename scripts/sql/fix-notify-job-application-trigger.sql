-- ============================================================
-- FIX: Corregir función notify_new_job_application
-- ============================================================
-- El error es: column c.name does not exist
-- Corrección: c.name -> c.company_name, c.contact_email -> c.company_email
-- ============================================================

-- EJECUTA ESTO:
CREATE OR REPLACE FUNCTION public.notify_new_job_application()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_company_email TEXT;
  v_company_name TEXT;
  v_job_title TEXT;
  v_candidate_name TEXT;
  v_candidate_email TEXT;
BEGIN
  -- Get company info (CORREGIDO: company_name y company_email)
  SELECT c.company_name, c.company_email
  INTO v_company_name, v_company_email
  FROM companies c
  WHERE c.id = NEW.company_id;

  -- Get job title
  SELECT title INTO v_job_title
  FROM job_postings
  WHERE id = NEW.job_posting_id;

  -- Get candidate info
  SELECT full_name, email
  INTO v_candidate_name, v_candidate_email
  FROM profiles
  WHERE id = NEW.profile_id;

  -- Send email to company (si existe la función send_job_application_email)
  IF v_company_email IS NOT NULL THEN
    BEGIN
      PERFORM send_job_application_email(
        'new-job-application',
        v_company_email,
        v_company_name,
        jsonb_build_object(
          'companyName', v_company_name,
          'jobTitle', v_job_title,
          'candidateName', v_candidate_name,
          'candidateEmail', v_candidate_email,
          'matchScore', COALESCE(NEW.match_score, 0),
          'applicationDate', NOW(),
          'applicationUrl', 'https://yourcvpassport.com/company/jobs/applications'
        )
      );
    EXCEPTION WHEN undefined_function THEN
      -- Si la función de email no existe, solo loguear
      RAISE NOTICE 'Nueva aplicación de % para %', v_candidate_name, v_job_title;
    END;
  END IF;

  RETURN NEW;
END;
$function$;
