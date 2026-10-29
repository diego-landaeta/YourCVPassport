-- Definiciones REALES de produccion (pg_get_functiondef, 29/10/2026), leidas con prodsql.mjs. Solo lectura.

-- apply_to_job  ACL real: {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.apply_to_job(p_job_posting_id uuid, p_profile_id uuid, p_cover_letter text DEFAULT NULL::text, p_answers jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_company_id UUID;
    v_match_score INTEGER;
    v_application_id UUID;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM job_postings
        WHERE id = p_job_posting_id AND status = 'PUBLISHED'
        AND (application_deadline IS NULL OR application_deadline > NOW())
    ) THEN
        RAISE EXCEPTION 'Job not available';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = p_profile_id AND id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF EXISTS (
        SELECT 1 FROM job_applications
        WHERE job_posting_id = p_job_posting_id AND profile_id = p_profile_id
    ) THEN
        RAISE EXCEPTION 'Already applied';
    END IF;

    SELECT company_id INTO v_company_id FROM job_postings WHERE id = p_job_posting_id;
    v_match_score := calculate_job_match_score(p_job_posting_id, p_profile_id);

    INSERT INTO job_applications (
        job_posting_id, profile_id, company_id,
        cover_letter, answers, match_score, status
    ) VALUES (
        p_job_posting_id, p_profile_id, v_company_id,
        p_cover_letter, p_answers, v_match_score, 'NEW'
    ) RETURNING id INTO v_application_id;

    UPDATE job_postings
    SET applications_count = applications_count + 1
    WHERE id = p_job_posting_id;

    RETURN jsonb_build_object(
        'success', true,
        'application_id', v_application_id,
        'match_score', v_match_score
    );
END;
$function$;

-- assert_caller_matches_user  ACL real: {postgres=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.assert_caller_matches_user(p_user_id uuid, p_allow_admin boolean DEFAULT false, p_allow_manager boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_role TEXT := auth.role();
    v_uid  UUID := auth.uid();
BEGIN
    -- Edge Functions con service key
    IF v_role = 'service_role' THEN
        RETURN;
    END IF;

    -- Visitante sin sesión
    IF v_role = 'anon' THEN
        RAISE EXCEPTION 'ANON_NOT_ALLOWED: esta función requiere un usuario autenticado'
            USING ERRCODE = '42501';
    END IF;

    IF v_role = 'authenticated' THEN
        IF v_uid IS NOT NULL AND p_user_id IS NOT DISTINCT FROM v_uid THEN
            RETURN;
        END IF;

        IF p_allow_admin AND v_uid IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = v_uid AND role = 'admin'
        ) THEN
            RETURN;
        END IF;

        IF p_allow_manager AND v_uid IS NOT NULL AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = p_user_id AND managed_by = v_uid
        ) THEN
            RETURN;
        END IF;

        RAISE EXCEPTION 'USER_MISMATCH: p_user_id no corresponde al usuario autenticado'
            USING ERRCODE = '42501';
    END IF;

    -- Sin JWT (conexión directa: SQL editor, cron, migraciones): contexto de confianza
    RETURN;
END;
$function$;

-- calculate_job_match_score  ACL real: {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.calculate_job_match_score(p_job_posting_id uuid, p_profile_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_score INTEGER := 0;
    v_job RECORD;
    v_profile RECORD;
    v_matching_skills INTEGER;
    v_total_required_skills INTEGER;
    v_profile_skills TEXT[];
BEGIN
    SELECT * INTO v_job FROM job_postings WHERE id = p_job_posting_id;
    IF NOT FOUND THEN RETURN 0; END IF;

    SELECT * INTO v_profile FROM profiles WHERE id = p_profile_id;
    IF NOT FOUND THEN RETURN 0; END IF;

    -- Get profile skills from skills table
    SELECT ARRAY_AGG(DISTINCT name) INTO v_profile_skills
    FROM skills WHERE profile_id = p_profile_id;

    -- Score 1: Matching required skills (40 points)
    IF v_job.required_skills IS NOT NULL AND array_length(v_job.required_skills, 1) > 0 THEN
        v_total_required_skills := array_length(v_job.required_skills, 1);
        SELECT COUNT(*) INTO v_matching_skills
        FROM unnest(v_job.required_skills) AS required_skill
        WHERE required_skill = ANY(v_profile_skills);
        v_score := v_score + ((v_matching_skills * 40) / v_total_required_skills);
    ELSE
        v_score := v_score + 20;
    END IF;

    -- Score 2: Experience level (20 points)
    IF v_profile.experience_level IS NOT NULL AND v_job.experience_level IS NOT NULL THEN
        IF v_profile.experience_level = v_job.experience_level THEN
            v_score := v_score + 20;
        ELSIF v_profile.experience_level = 'SENIOR' AND v_job.experience_level = 'MID' THEN
            v_score := v_score + 15;
        ELSIF v_profile.experience_level = 'MID' AND v_job.experience_level = 'JUNIOR' THEN
            v_score := v_score + 15;
        ELSE
            v_score := v_score + 10;
        END IF;
    ELSE
        v_score := v_score + 10;
    END IF;

    -- Score 3: Location (20 points)
    IF v_job.is_remote = true THEN
        v_score := v_score + 20;
    ELSIF v_job.work_mode = 'HYBRID' THEN
        v_score := v_score + 15;
    ELSIF v_profile.location IS NOT NULL AND v_job.location_city IS NOT NULL THEN
        IF v_profile.location ILIKE '%' || v_job.location_city || '%' THEN
            v_score := v_score + 20;
        ELSIF v_profile.location ILIKE '%' || v_job.location_country || '%' THEN
            v_score := v_score + 10;
        END IF;
    ELSE
        v_score := v_score + 5;
    END IF;

    -- Score 4: Profile completeness (20 points)
    IF v_profile.profile_quality_score IS NOT NULL THEN
        v_score := v_score + (v_profile.profile_quality_score / 5);
    ELSE
        v_score := v_score + 10;
    END IF;

    RETURN LEAST(GREATEST(v_score, 0), 100);
END;
$function$;

-- generate_job_posting_slug  ACL real: {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.generate_job_posting_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
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
$function$;

-- get_job_posting_detail  ACL real: {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.get_job_posting_detail(p_slug character varying)
 RETURNS TABLE(id uuid, title character varying, slug character varying, company_id uuid, department character varying, employment_type character varying, work_mode character varying, experience_level character varying, location_city character varying, location_state character varying, location_country character varying, is_remote boolean, description text, responsibilities text[], requirements text[], nice_to_have text[], benefits text[], required_skills character varying[], optional_skills character varying[], salary_min integer, salary_max integer, salary_currency character varying, salary_period character varying, show_salary boolean, application_deadline timestamp with time zone, application_email character varying, application_url text, application_instructions text, published_at timestamp with time zone, company_name character varying, company_logo_url text, company_website text, company_description text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- handle_new_user  ACL real: {postgres=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Extraer el nombre del raw_user_meta_data si existe
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Insertar en profiles con todos los campos requeridos
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    headline,
    summary,
    role,
    plan,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    '',  -- headline vacío por defecto
    '',  -- summary vacío por defecto
    'professional',
    'free',
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, registrar el error pero no bloquear la creación del usuario
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- normalize_profile_role  ACL real: {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.normalize_profile_role()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    IF NEW.role IS NULL THEN
      NEW.role := NULL;
    ELSE
      CASE lower(trim(NEW.role))
        WHEN 'professional'    THEN NEW.role := 'professional';
        WHEN 'pro'             THEN NEW.role := 'professional';
        WHEN 'employer'        THEN NEW.role := 'employer';
        WHEN 'admin'           THEN NEW.role := 'admin';
        WHEN 'administrator'   THEN NEW.role := 'admin';
        WHEN 'profile_manager' THEN NEW.role := 'profile_manager';
        WHEN 'manager'         THEN NEW.role := 'profile_manager';
        ELSE
          NEW.role := NULL;
      END CASE;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- notify_application_status_change  ACL real: {postgres=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.notify_application_status_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_candidate_email TEXT;
  v_candidate_name TEXT;
  v_job_title TEXT;
  v_company_name TEXT;
BEGIN
  -- Only notify if status actually changed
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Don't notify on initial NEW status (already handled by other trigger)
  IF NEW.status = 'NEW' THEN
    RETURN NEW;
  END IF;

  -- Get candidate info
  SELECT full_name, email
  INTO v_candidate_name, v_candidate_email
  FROM profiles
  WHERE id = NEW.profile_id;

  -- Get job and company info
  SELECT jp.title, c.name
  INTO v_job_title, v_company_name
  FROM job_postings jp
  JOIN companies c ON c.id = jp.company_id
  WHERE jp.id = NEW.job_posting_id;

  -- Send email to candidate
  IF v_candidate_email IS NOT NULL THEN
    PERFORM send_job_application_email(
      'application-status-update',
      v_candidate_email,
      v_candidate_name,
      jsonb_build_object(
        'candidateName', v_candidate_name,
        'jobTitle', v_job_title,
        'companyName', v_company_name,
        'oldStatus', OLD.status,
        'newStatus', NEW.status,
        'statusLabel', CASE NEW.status
          WHEN 'REVIEWING' THEN 'En revisión'
          WHEN 'SHORTLISTED' THEN 'Preseleccionado'
          WHEN 'INTERVIEW' THEN 'Invitado a entrevista'
          WHEN 'OFFER' THEN 'Oferta enviada'
          WHEN 'HIRED' THEN 'Contratado'
          WHEN 'REJECTED' THEN 'No seleccionado'
          ELSE NEW.status
        END,
        'dashboardUrl', 'https://yourcvpassport.com/dashboard'
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- notify_new_job_application  ACL real: {postgres=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.notify_new_job_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
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

-- profiles_bloquear_campos_protegidos  ACL real: {postgres=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.profiles_bloquear_campos_protegidos()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role text := COALESCE(auth.role(), '');
BEGIN
  -- Contextos de confianza: service_role (Edge Functions / webhooks) y sin JWT
  -- (SQL editor, cron, trigger de alta en auth.users).
  IF v_role NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;

  -- Admin (panel de admin y RPC admin_*): puede cambiar cualquier campo.
  IF public.current_user_is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.role IS NOT NULL AND NEW.role NOT IN ('professional', 'employer') THEN
      RAISE EXCEPTION 'PROTECTED_FIELD: no puedes crear tu perfil con role %', NEW.role
        USING ERRCODE = '42501';
    END IF;
    IF COALESCE(lower(NEW.plan), 'free') <> 'free' THEN
      RAISE EXCEPTION 'PROTECTED_FIELD: no puedes crear tu perfil con plan %', NEW.plan
        USING ERRCODE = '42501';
    END IF;
    IF NEW.managed_by IS NOT NULL
       OR NEW.is_active IS FALSE
       OR NEW.profile_hidden IS TRUE
       OR NEW.search_blocked IS TRUE
       OR NEW.messages_blocked IS TRUE
       OR NEW.suspension_reason IS NOT NULL
       OR NEW.suspended_until IS NOT NULL THEN
      RAISE EXCEPTION 'PROTECTED_FIELD: managed_by y los campos de moderación solo los asigna un admin'
        USING ERRCODE = '42501';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: role solo lo cambia un admin' USING ERRCODE = '42501';
  END IF;
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: plan solo lo cambia un admin o el sistema de pagos' USING ERRCODE = '42501';
  END IF;
  IF NEW.managed_by IS DISTINCT FROM OLD.managed_by THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: managed_by solo lo cambia un admin' USING ERRCODE = '42501';
  END IF;
  IF NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.suspension_reason IS DISTINCT FROM OLD.suspension_reason
     OR NEW.suspended_until IS DISTINCT FROM OLD.suspended_until
     OR NEW.profile_hidden IS DISTINCT FROM OLD.profile_hidden
     OR NEW.search_blocked IS DISTINCT FROM OLD.search_blocked
     OR NEW.messages_blocked IS DISTINCT FROM OLD.messages_blocked THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: los campos de moderación solo los cambia un admin' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

-- publish_job_posting  ACL real: {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.publish_job_posting(p_job_posting_id uuid, p_company_id uuid, p_user_id uuid, p_duration_days integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_credits_required INTEGER;
    v_new_balance INTEGER;
    v_job RECORD;
    v_company_status VARCHAR(50);
    v_current_balance INTEGER;
BEGIN
    PERFORM public.assert_caller_matches_user(p_user_id);

    IF NOT EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = p_company_id
        AND user_id = p_user_id
        AND role IN ('OWNER', 'ADMIN', 'MEMBER')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not authorized to publish job postings for this company'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_job FROM job_postings
    WHERE id = p_job_posting_id AND company_id = p_company_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Job posting not found or does not belong to this company';
    END IF;

    v_credits_required := COALESCE(v_job.credits_cost, 30);

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
        SELECT status, credit_balance INTO v_company_status, v_current_balance
        FROM companies WHERE id = p_company_id;

        IF v_company_status != 'APPROVED' THEN
            RAISE EXCEPTION 'Company is not approved (status: %)', v_company_status;
        ELSIF v_current_balance < v_credits_required THEN
            RAISE EXCEPTION 'Insufficient credits: Need %, have %', v_credits_required, v_current_balance;
        ELSE
            RAISE EXCEPTION 'Company not found';
        END IF;
    END IF;

    INSERT INTO company_credits_history (
        company_id, amount, balance_after, transaction_type,
        reference_id, description, created_by
    ) VALUES (
        p_company_id, -v_credits_required, v_new_balance, 'JOB_POSTING',
        p_job_posting_id,
        format('Published job posting: %s', v_job.title),
        p_user_id
    );

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
$function$;

-- search_public_jobs  ACL real: {=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.search_public_jobs(p_search_term text DEFAULT NULL::text, p_location text DEFAULT NULL::text, p_employment_type text DEFAULT NULL::text, p_work_mode text DEFAULT NULL::text, p_experience_level text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, title character varying, slug character varying, company_id uuid, company_name character varying, company_logo_url text, employment_type character varying, work_mode character varying, experience_level character varying, location_city character varying, location_country character varying, is_remote boolean, description text, required_skills character varying[], salary_min integer, salary_max integer, salary_currency character varying, show_salary boolean, published_at timestamp with time zone, application_deadline timestamp with time zone, views_count integer, applications_count integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;

-- send_job_application_email  ACL real: {postgres=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.send_job_application_email(p_template_name text, p_recipient_email text, p_recipient_name text, p_variables jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Esta función invoca la edge function de send-email
  -- Puedes personalizarla según tu implementación de emails

  PERFORM
    net.http_post(
      url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_URL') || '/functions/v1/send-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'SUPABASE_SERVICE_ROLE_KEY')
      ),
      body := jsonb_build_object(
        'template', p_template_name,
        'to', p_recipient_email,
        'recipientName', p_recipient_name,
        'variables', p_variables
      )
    );

EXCEPTION WHEN OTHERS THEN
  -- Log error but don't fail the transaction
  RAISE NOTICE 'Error sending email: %', SQLERRM;
END;
$function$;

-- update_application_status  ACL real: {postgres=X/postgres,authenticated=X/postgres,service_role=X/postgres}
CREATE OR REPLACE FUNCTION public.update_application_status(p_application_id uuid, p_company_id uuid, p_user_id uuid, p_new_status character varying, p_internal_notes text DEFAULT NULL::text, p_rating integer DEFAULT NULL::integer)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    v_old_status VARCHAR(50);
    v_candidate_email TEXT;
    v_candidate_name TEXT;
    v_job_title TEXT;
BEGIN
    PERFORM public.assert_caller_matches_user(p_user_id);

    IF NOT EXISTS (
        SELECT 1 FROM company_users
        WHERE company_id = p_company_id
        AND user_id = p_user_id
        AND role IN ('OWNER', 'ADMIN', 'MEMBER')
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not authorized to update applications for this company'
            USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM job_applications
        WHERE id = p_application_id AND company_id = p_company_id
    ) THEN
        RAISE EXCEPTION 'Application not found or does not belong to this company';
    END IF;

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
$function$;
