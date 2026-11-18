-- =============================================================================
-- Bolsa de empleo, fase 3 (#8) y alertas de la fase 4 (#9): candidaturas
-- =============================================================================
--
-- ORDEN
--   Después de 20261029_legal_aceptaciones_idioma.sql (fase 1) y
--   20261030_ofertas_fase2.sql (fase 2). Es aditiva y reaplicable (IF NOT EXISTS,
--   CREATE OR REPLACE, DROP ... IF EXISTS). No depende de columnas de la fase 2:
--   las que lee de job_postings / profiles / companies y quizá aún no existan
--   (category, country_code, languages, education_min, experience_years,
--   notify_emails, notify_frequency, cover_letter_mode, registro_idioma, idioma)
--   se leen con to_jsonb(fila)->>'columna', que devuelve NULL si no están.
--   Requiere (ya en producción): is_company_member, current_user_is_admin,
--   assert_caller_matches_user, companies, company_users, profiles, experiences,
--   education, skills, languages.
--
-- ESTADO REAL DE PRODUCCIÓN (leído el 29/10/2026, 0 empresas, 0 ofertas, 0
-- candidaturas: no hay datos que migrar)
--   - El candidato podía hacer UPDATE de CUALQUIER columna de su candidatura
--     (status, rating, internal_notes) e INSERT directo sin pasar por
--     apply_to_job; veía internal_notes y rating con select *.
--   - La política de UPDATE de empresa no tenía WITH CHECK (podía cambiar
--     profile_id).
--   - authenticated tenía TRUNCATE/DELETE/INSERT/UPDATE sobre job_applications.
--   - apply_to_job llamaba a calculate_job_match_score, que lee columnas que no
--     existen (profiles.experience_level, profiles.profile_quality_score): el
--     RPC fallaba SIEMPRE. Hoy nadie puede inscribirse.
--   - Los triggers on_new_job_application / on_application_status_change
--     llamaban a send_job_application_email -> Edge Function inexistente (y
--     leían companies.name, que no existe).
--   - El frontend busca "Already applied" / "Job not available" y la RPC lanzaba
--     otros textos. Ahora el mensaje lleva un código estable al principio
--     («ALREADY_APPLIED: Already applied ...») que casa con ambos.
--
-- QUÉ HACE
--   1. email_outbox (CREATE TABLE IF NOT EXISTS; definición común a las tres
--      fases) con RLS solo service_role. NADA envía correos: todo se encola.
--   2. job_applications: columnas perfil_copia jsonb, consent_at,
--      consent_doc_version, descartada_auto; CHECK de status + NOT_QUALIFIED
--      (conserva los 8 actuales).
--   3. job_posting_questions: is_knockout, expected_answer (privada: solo la
--      empresa la lee, por get_job_questions_for_company) y tope de 5 preguntas
--      por oferta (trigger).
--   4. job_application_status_history: la llena un trigger (alta y cambio de
--      status). Nadie escribe directo. El candidato la lee con
--      get_application_history (con NOT_QUALIFIED enmascarado como NEW).
--   5. Seguridad de job_applications: sin INSERT/DELETE/TRUNCATE directo, UPDATE
--      por columnas solo para empresa (status, internal_notes, rating,
--      updated_at), WITH CHECK que impide cambiar profile_id, job_posting_id y
--      company_id, trigger de protección, el candidato lee SOLO por la vista
--      my_job_applications (sin internal_notes, rating, perfil_copia ni
--      descartada_auto) y cambia de estado SOLO con withdraw_application.
--      Triggers y funciones notify_* retirados.
--   6. RPC: apply_to_job (reescrita), update_application_status (reescrita),
--      withdraw_application, mark_application_viewed, preview_application_profile,
--      get_application_history, get_job_questions_for_company,
--      get_recommended_jobs; calculate_job_match_score pasa a ser un envoltorio
--      de la nueva puntuación (arregla el fallo y deja de ser pública).
--   7. job_alert_subscriptions (el dueño gestiona la suya) y queue_job_alerts()
--      (solo service_role / cron; idempotente; encola en email_outbox).
--
-- QUÉ NO HACE
--   - No envía correos (cupo de Brevo agotado). Los consume un worker con
--     service_role que lea email_outbox donde sent_at IS NULL y send_after <= now().
--   - No toca job_postings, profiles ni companies (salvo applications_count).
--
-- COMPROBACIONES (SQL editor, tras aplicar)
--   select count(*) from pg_policies where tablename = 'job_applications';  -- 4 (2 lectura + 2 update)
--   select grantee, privilege_type from information_schema.role_table_grants
--    where table_name = 'job_applications' and grantee in ('anon','authenticated');
--      -- anon: nada. authenticated: SELECT (y UPDATE por columnas).
--   select tgname from pg_trigger where tgrelid = 'public.job_applications'::regclass
--    and not tgisinternal;  -- sin on_new_job_application / on_application_status_change
--
-- CÓMO REVERTIR
--   Las tablas nuevas se pueden soltar (DROP TABLE job_alert_subscriptions,
--   job_application_status_history, email_outbox si nadie más la usa). Para
--   reabrir la seguridad anterior hay que recrear a mano las políticas
--   «Candidates can create/update applications» (no recomendable). Las
--   columnas añadidas pueden quedarse. Las versiones anteriores de apply_to_job
--   y update_application_status están en 20261007_seguridad_empresas.sql (la
--   segunda) y en producción (la primera; su definición se leyó con
--   pg_get_functiondef antes de reescribirla).
--
-- NOTAS PARA EL FRONTEND (también en el informe)
--   - apply_to_job(p_job_posting_id, p_profile_id DEFAULT NULL, p_cover_letter,
--     p_answers, p_consent, p_consent_doc_version). Exige p_consent = true.
--   - El candidato lee sus candidaturas de la vista my_job_applications (no de
--     job_applications): AllJobsTab, RecommendedJobsTab, JobDetailPage,
--     useJobApplications (y su suscripción realtime) deben cambiar de tabla.
--   - job_posting_questions: anon y authenticated ya no pueden hacer select *;
--     hay que pedir columnas (id, job_posting_id, question_text, question_type,
--     options, is_required, order_index, created_at, is_knockout). expected_answer
--     solo con get_job_questions_for_company(p_job_posting_id).
--   - La empresa marca «vista» con mark_application_viewed (el UPDATE directo
--     de viewed_* ya no está permitido).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 0. Utilidades internas (solo las llaman otras funciones SECURITY DEFINER)
-- -----------------------------------------------------------------------------

-- Texto normalizado para comparar: minúsculas, sin tildes, sin espacios sobrantes.
CREATE OR REPLACE FUNCTION public.jobs_norm(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(btrim(translate(coalesce(p_text, ''),
    'áàäâãéèëêíìïîóòöôõúùüûñÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑ',
    'aaaaaeeeeiiiiooooouuuunAAAAAEEEEIIIIOOOOOUUUUN')));
$$;

-- Nivel de estudios 0..5 a partir de un texto libre (título, campo o código).
CREATE OR REPLACE FUNCTION public.jobs_edu_level(p_text text)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.jobs_norm(p_text) = '' THEN 0
    WHEN public.jobs_norm(p_text) ~ '^(none|ninguno|ninguna|sin estudios|no requerido|any)$' THEN 0
    WHEN public.jobs_norm(p_text) ~ 'doctor|phd|ph\.d' THEN 5
    WHEN public.jobs_norm(p_text) ~ 'master|msc|mba|posgrado|postgrado|maestria|magister|especializacion|especialista' THEN 4
    WHEN public.jobs_norm(p_text) ~ 'grado|bachelor|licenciatura|licenciad|ingenier|universit|degree|arquitect|bsc|diplomatura|college' THEN 3
    WHEN public.jobs_norm(p_text) ~ 'tecnic|tecnolog|formacion profesional|ciclo|vocational|associate|\mfp\M|diplom|certificate|certificado' THEN 2
    ELSE 1
  END;
$$;

-- Clave de idioma (es, en, fr...) desde nombre en español/inglés o código.
CREATE OR REPLACE FUNCTION public.jobs_lang_key(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.jobs_norm(p_text) IN ('es','spa','spanish','espanol','castellano','spanish (spain)') THEN 'es'
    WHEN public.jobs_norm(p_text) IN ('en','eng','english','ingles') THEN 'en'
    WHEN public.jobs_norm(p_text) IN ('fr','fra','french','frances') THEN 'fr'
    WHEN public.jobs_norm(p_text) IN ('de','deu','german','aleman') THEN 'de'
    WHEN public.jobs_norm(p_text) IN ('it','ita','italian','italiano') THEN 'it'
    WHEN public.jobs_norm(p_text) IN ('pt','por','portuguese','portugues') THEN 'pt'
    WHEN public.jobs_norm(p_text) IN ('ca','cat','catalan') THEN 'ca'
    ELSE public.jobs_norm(p_text)
  END;
$$;

-- Nivel de idioma 0..6 (A1..C2, nativo) desde el texto libre del nivel.
CREATE OR REPLACE FUNCTION public.jobs_lang_rank(p_level text, p_native boolean DEFAULT false, p_pct int DEFAULT NULL)
RETURNS int
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN coalesce(p_native, false) THEN 6
    WHEN public.jobs_norm(p_level) ~ 'nativ|bilingu|materna|mother' THEN 6
    WHEN public.jobs_norm(p_level) ~ '^c2' THEN 6
    WHEN public.jobs_norm(p_level) ~ '^c1' THEN 5
    WHEN public.jobs_norm(p_level) ~ '^b2' THEN 4
    WHEN public.jobs_norm(p_level) ~ '^b1' THEN 3
    WHEN public.jobs_norm(p_level) ~ '^a2' THEN 2
    WHEN public.jobs_norm(p_level) ~ '^a1' THEN 1
    WHEN public.jobs_norm(p_level) ~ 'fluent|fluido|avanzado|advanced|proficien' THEN 5
    WHEN public.jobs_norm(p_level) ~ 'upper|intermedio alto|intermedio-alto' THEN 4
    WHEN public.jobs_norm(p_level) ~ 'intermedi|medio|conversational|conversacional' THEN 3
    WHEN public.jobs_norm(p_level) ~ 'elemental|elementary|basico|basic|principiante|beginner' THEN 2
    WHEN p_pct IS NOT NULL THEN greatest(1, least(6, ceil(p_pct / 17.0)::int))
    ELSE 3
  END;
$$;

REVOKE ALL ON FUNCTION public.jobs_norm(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.jobs_edu_level(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.jobs_lang_key(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.jobs_lang_rank(text, boolean, int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_norm(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.jobs_edu_level(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.jobs_lang_key(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.jobs_lang_rank(text, boolean, int) TO service_role;


-- -----------------------------------------------------------------------------
-- 1. email_outbox (definición común a las tres fases)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_outbox (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind        text NOT NULL,
  to_email    text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  lang        text NOT NULL DEFAULT 'es',
  priority    integer NOT NULL DEFAULT 5,
  send_after  timestamptz NOT NULL DEFAULT now(),
  sent_at     timestamptz,
  attempts    integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.email_outbox FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_outbox TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'email_outbox'
  ) THEN
    CREATE POLICY "email_outbox solo service_role" ON public.email_outbox
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS email_outbox_pendientes_idx
  ON public.email_outbox (send_after, priority)
  WHERE sent_at IS NULL;

COMMENT ON TABLE public.email_outbox IS
'Cola de correos pendientes. Nada la envía todavía (cupo de Brevo agotado): un worker con service_role leerá sent_at IS NULL AND send_after <= now(). Solo service_role.';

-- Encola un correo. Solo la llaman funciones SECURITY DEFINER de este fichero.
CREATE OR REPLACE FUNCTION public.jobs_enqueue_email(
  p_kind text,
  p_to text,
  p_payload jsonb,
  p_lang text DEFAULT 'es',
  p_priority int DEFAULT 5,
  p_send_after timestamptz DEFAULT now()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_to IS NULL OR btrim(p_to) = '' THEN
    RETURN;
  END IF;
  INSERT INTO public.email_outbox (kind, to_email, payload, lang, priority, send_after)
  VALUES (
    p_kind,
    lower(btrim(p_to)),
    coalesce(p_payload, '{}'::jsonb),
    lower(left(coalesce(nullif(btrim(p_lang), ''), 'es'), 2)),
    coalesce(p_priority, 5),
    coalesce(p_send_after, now())
  );
END;
$$;
REVOKE ALL ON FUNCTION public.jobs_enqueue_email(text, text, jsonb, text, int, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_enqueue_email(text, text, jsonb, text, int, timestamptz) TO service_role;


-- -----------------------------------------------------------------------------
-- 2. job_applications: columnas nuevas y estado NOT_QUALIFIED
-- -----------------------------------------------------------------------------
ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS perfil_copia jsonb,
  ADD COLUMN IF NOT EXISTS consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS consent_doc_version text,
  ADD COLUMN IF NOT EXISTS descartada_auto boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.job_applications.perfil_copia IS
'Copia fija del perfil en el momento de inscribirse (perfil público, contacto, experiencias, formación, habilidades e idiomas). La empresa ve esto, no el perfil vivo. Inmutable.';
COMMENT ON COLUMN public.job_applications.consent_at IS
'Cuándo el candidato consintió ceder su perfil a la empresa de esta oferta.';
COMMENT ON COLUMN public.job_applications.consent_doc_version IS
'Versión del documento legal aceptado en ese momento (la que envíe el frontend).';
COMMENT ON COLUMN public.job_applications.descartada_auto IS
'true si el sistema la pasó a NOT_QUALIFIED por una pregunta imprescindible (knockout). El candidato no lo ve.';

ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_status_check
  CHECK ((status)::text = ANY (ARRAY[
    'NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED',
    'REJECTED', 'WITHDRAWN', 'NOT_QUALIFIED'
  ]::text[]));

CREATE INDEX IF NOT EXISTS job_applications_profile_idx ON public.job_applications (profile_id);
CREATE INDEX IF NOT EXISTS job_applications_company_status_idx ON public.job_applications (company_id, status);


-- -----------------------------------------------------------------------------
-- 3. job_posting_questions: knockout, respuesta esperada y tope de 5
-- -----------------------------------------------------------------------------
ALTER TABLE public.job_posting_questions
  ADD COLUMN IF NOT EXISTS is_knockout boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS expected_answer text;

COMMENT ON COLUMN public.job_posting_questions.is_knockout IS
'Pregunta imprescindible: si la respuesta no cumple expected_answer, la candidatura pasa a NOT_QUALIFIED. Cuenta como obligatoria.';
COMMENT ON COLUMN public.job_posting_questions.expected_answer IS
'Respuesta que cumple el requisito (PRIVADA: anon y authenticated no pueden leerla). YES_NO: YES/NO. Texto o lista: valores aceptados separados por |. Numérica: un mínimo («3») o con operador («>=3», «<=5», «=2»).';

ALTER TABLE public.job_posting_questions DROP CONSTRAINT IF EXISTS job_posting_questions_knockout_expected_check;
ALTER TABLE public.job_posting_questions ADD CONSTRAINT job_posting_questions_knockout_expected_check
  CHECK (NOT is_knockout OR (expected_answer IS NOT NULL AND btrim(expected_answer) <> ''));

CREATE OR REPLACE FUNCTION public.job_posting_questions_tope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('jpq:' || NEW.job_posting_id::text));
  IF (SELECT count(*) FROM public.job_posting_questions q
       WHERE q.job_posting_id = NEW.job_posting_id AND q.id <> NEW.id) >= 5 THEN
    RAISE EXCEPTION 'MAX_QUESTIONS_REACHED: una oferta admite como máximo 5 preguntas'
      USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.job_posting_questions_tope() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_posting_questions_tope ON public.job_posting_questions;
CREATE TRIGGER trg_job_posting_questions_tope
  BEFORE INSERT OR UPDATE OF job_posting_id ON public.job_posting_questions
  FOR EACH ROW EXECUTE FUNCTION public.job_posting_questions_tope();

-- expected_answer privada: privilegios por columna (la RLS filtra filas, no columnas).
REVOKE ALL ON public.job_posting_questions FROM PUBLIC, anon, authenticated;
GRANT SELECT (id, job_posting_id, question_text, question_type, options, is_required, order_index, created_at, is_knockout)
  ON public.job_posting_questions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.job_posting_questions TO authenticated;
-- (las políticas existentes siguen mandando: solo miembros de la empresa escriben)

-- La empresa (o un admin) lee las preguntas completas, con expected_answer.
CREATE OR REPLACE FUNCTION public.get_job_questions_for_company(p_job_posting_id uuid)
RETURNS SETOF public.job_posting_questions
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_company uuid;
BEGIN
  SELECT company_id INTO v_company FROM public.job_postings WHERE id = p_job_posting_id;
  IF v_company IS NULL
     OR NOT (public.is_company_member(v_company) OR public.current_user_is_admin()) THEN
    RAISE EXCEPTION 'UNAUTHORIZED: no perteneces a la empresa de esta oferta'
      USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT q.* FROM public.job_posting_questions q
     WHERE q.job_posting_id = p_job_posting_id
     ORDER BY q.order_index, q.created_at;
END;
$$;
REVOKE ALL ON FUNCTION public.get_job_questions_for_company(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_job_questions_for_company(uuid) TO authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 4. Historial de estados de candidatura (sin escritura directa)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_application_status_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  from_status     varchar(50),
  to_status       varchar(50) NOT NULL,
  changed_by      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  changed_by_role text NOT NULL DEFAULT 'SYSTEM'
    CHECK (changed_by_role IN ('SYSTEM', 'CANDIDATE', 'COMPANY', 'ADMIN')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_application_status_history_app_idx
  ON public.job_application_status_history (application_id, created_at);

ALTER TABLE public.job_application_status_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_application_status_history FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.job_application_status_history TO authenticated;
GRANT ALL ON public.job_application_status_history TO service_role;

DROP POLICY IF EXISTS "Empresa y admin leen el historial" ON public.job_application_status_history;
CREATE POLICY "Empresa y admin leen el historial" ON public.job_application_status_history
  FOR SELECT TO authenticated
  USING (
    public.current_user_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.job_applications ja
       WHERE ja.id = job_application_status_history.application_id
         AND public.is_company_member(ja.company_id)
    )
  );
-- No hay políticas de escritura ni grants de INSERT/UPDATE/DELETE: solo el trigger.

COMMENT ON TABLE public.job_application_status_history IS
'Historial de estados de cada candidatura. Lo llena el trigger trg_job_application_status_history (alta y cambio de status); sin escritura directa. El candidato lo lee por get_application_history.';

CREATE OR REPLACE FUNCTION public.job_application_status_history_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_role text;
  v_email text;
  v_name text;
  v_lang text;
  v_title text;
  v_company text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.job_application_status_history
      (application_id, from_status, to_status, changed_by, changed_by_role)
    VALUES (
      NEW.id, NULL, NEW.status,
      CASE WHEN NEW.status = 'NOT_QUALIFIED' THEN NULL ELSE NEW.profile_id END,
      CASE WHEN NEW.status = 'NOT_QUALIFIED' THEN 'SYSTEM' ELSE 'CANDIDATE' END
    );
    RETURN NEW;
  END IF;

  IF OLD.status IS NOT DISTINCT FROM NEW.status THEN
    RETURN NEW;
  END IF;

  v_role := CASE
    WHEN v_uid IS NULL THEN 'SYSTEM'
    WHEN v_uid = NEW.profile_id THEN 'CANDIDATE'
    WHEN public.is_company_member(NEW.company_id) THEN 'COMPANY'
    WHEN public.current_user_is_admin() THEN 'ADMIN'
    ELSE 'SYSTEM'
  END;

  INSERT INTO public.job_application_status_history
    (application_id, from_status, to_status, changed_by, changed_by_role)
  VALUES (NEW.id, OLD.status, NEW.status, v_uid, v_role);

  -- Aviso al candidato (cola, no envío): preseleccionada, entrevista,
  -- descartada o contratada. «Vista», NOT_QUALIFIED y retirada no avisan.
  IF v_role IN ('COMPANY', 'ADMIN')
     AND NEW.status IN ('SHORTLISTED', 'INTERVIEW', 'REJECTED', 'HIRED') THEN
    SELECT p.email, p.full_name, to_jsonb(p)->>'registro_idioma'
      INTO v_email, v_name, v_lang
      FROM public.profiles p WHERE p.id = NEW.profile_id;
    SELECT jp.title, c.company_name INTO v_title, v_company
      FROM public.job_postings jp
      JOIN public.companies c ON c.id = jp.company_id
     WHERE jp.id = NEW.job_posting_id;

    PERFORM public.jobs_enqueue_email(
      'application_status_candidate', v_email,
      jsonb_build_object(
        'application_id', NEW.id,
        'job_posting_id', NEW.job_posting_id,
        'job_title', v_title,
        'company_name', v_company,
        'candidate_name', v_name,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      v_lang, 4, now());
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.job_application_status_history_fn() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_application_status_history_ins ON public.job_applications;
CREATE TRIGGER trg_job_application_status_history_ins
  AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.job_application_status_history_fn();

DROP TRIGGER IF EXISTS trg_job_application_status_history ON public.job_applications;
CREATE TRIGGER trg_job_application_status_history
  AFTER UPDATE OF status ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.job_application_status_history_fn();


-- -----------------------------------------------------------------------------
-- 5. Seguridad de job_applications
-- -----------------------------------------------------------------------------

-- 5.1 Triggers de correo muertos (Edge Function inexistente; leían companies.name)
DROP TRIGGER IF EXISTS on_application_status_change ON public.job_applications;
DROP TRIGGER IF EXISTS on_new_job_application ON public.job_applications;
DROP FUNCTION IF EXISTS public.notify_application_status_change();
DROP FUNCTION IF EXISTS public.notify_new_job_application();

-- 5.2 Privilegios: solo lo mínimo. El candidato no toca la tabla.
REVOKE ALL ON public.job_applications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.job_applications TO authenticated;
GRANT UPDATE (status, internal_notes, rating, updated_at) ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;

-- 5.3 Políticas: se eliminan TODAS las actuales y se crean las mínimas.
DROP POLICY IF EXISTS "Candidates can create applications" ON public.job_applications;
DROP POLICY IF EXISTS "Candidates can update their applications" ON public.job_applications;
DROP POLICY IF EXISTS "Candidates can view their applications" ON public.job_applications;
DROP POLICY IF EXISTS "Candidates can view their own applications" ON public.job_applications;
DROP POLICY IF EXISTS "Company members can update application status" ON public.job_applications;
DROP POLICY IF EXISTS "Company members can view applications" ON public.job_applications;
DROP POLICY IF EXISTS "Company members can view applications to their jobs" ON public.job_applications;
DROP POLICY IF EXISTS "Empresa lee sus candidaturas" ON public.job_applications;
DROP POLICY IF EXISTS "Admin lee candidaturas" ON public.job_applications;
DROP POLICY IF EXISTS "Empresa actualiza sus candidaturas" ON public.job_applications;
DROP POLICY IF EXISTS "Admin actualiza candidaturas" ON public.job_applications;

-- Comprueba, con la fila ANTIGUA, que el UPDATE no cambia quién, qué oferta ni qué
-- empresa (un WITH CHECK normal no ve OLD).
CREATE OR REPLACE FUNCTION public.job_application_identity_unchanged(
  p_id uuid, p_profile_id uuid, p_job_posting_id uuid, p_company_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.job_applications ja
     WHERE ja.id = p_id
       AND ja.profile_id = p_profile_id
       AND ja.job_posting_id = p_job_posting_id
       AND ja.company_id = p_company_id
  );
$$;
REVOKE ALL ON FUNCTION public.job_application_identity_unchanged(uuid, uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.job_application_identity_unchanged(uuid, uuid, uuid, uuid) TO authenticated, service_role;

CREATE POLICY "Empresa lee sus candidaturas" ON public.job_applications
  FOR SELECT TO authenticated
  USING (public.is_company_member(company_id));

CREATE POLICY "Admin lee candidaturas" ON public.job_applications
  FOR SELECT TO authenticated
  USING (public.current_user_is_admin());

CREATE POLICY "Empresa actualiza sus candidaturas" ON public.job_applications
  FOR UPDATE TO authenticated
  USING (public.is_company_member(company_id, ARRAY['OWNER', 'ADMIN', 'MEMBER']))
  WITH CHECK (
    public.is_company_member(company_id, ARRAY['OWNER', 'ADMIN', 'MEMBER'])
    AND public.job_application_identity_unchanged(id, profile_id, job_posting_id, company_id)
  );

CREATE POLICY "Admin actualiza candidaturas" ON public.job_applications
  FOR UPDATE TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- 5.4 Trigger de protección (defensa en profundidad si alguien reabre los grants)
CREATE OR REPLACE FUNCTION public.job_applications_proteger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- service_role, SECURITY DEFINER (mismo dueño) y conexiones directas pasan.
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF current_user = 'authenticated' AND public.current_user_is_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.profile_id IS DISTINCT FROM OLD.profile_id
     OR NEW.job_posting_id IS DISTINCT FROM OLD.job_posting_id
     OR NEW.company_id IS DISTINCT FROM OLD.company_id
     OR NEW.perfil_copia IS DISTINCT FROM OLD.perfil_copia
     OR NEW.answers IS DISTINCT FROM OLD.answers
     OR NEW.cover_letter IS DISTINCT FROM OLD.cover_letter
     OR NEW.consent_at IS DISTINCT FROM OLD.consent_at
     OR NEW.consent_doc_version IS DISTINCT FROM OLD.consent_doc_version
     OR NEW.descartada_auto IS DISTINCT FROM OLD.descartada_auto
     OR NEW.match_score IS DISTINCT FROM OLD.match_score
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: identidad, respuestas, consentimiento y copia del perfil de una candidatura no se editan'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF OLD.status = 'WITHDRAWN' THEN
      RAISE EXCEPTION 'APPLICATION_WITHDRAWN: la candidatura está retirada'
        USING ERRCODE = '42501';
    END IF;
    IF NEW.status = 'WITHDRAWN' THEN
      RAISE EXCEPTION 'WITHDRAW_ONLY_BY_CANDIDATE: solo el candidato se retira, con withdraw_application'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.job_applications_proteger() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_applications_proteger ON public.job_applications;
CREATE TRIGGER trg_job_applications_proteger
  BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.job_applications_proteger();

-- 5.5 Vista del candidato: sin internal_notes, rating, perfil_copia ni
-- descartada_auto; NOT_QUALIFIED se le muestra como NEW («Enviada»).
-- Corre con los privilegios del dueño (security_invoker = false) y filtra por
-- auth.uid(); incluye lo mínimo de la oferta y la empresa para no depender de
-- que la oferta siga publicada.
CREATE OR REPLACE VIEW public.my_job_applications AS
SELECT
  ja.id,
  ja.created_at,
  ja.updated_at,
  ja.job_posting_id,
  ja.profile_id,
  ja.company_id,
  (CASE WHEN ja.status = 'NOT_QUALIFIED' THEN 'NEW' ELSE ja.status END)::varchar(50) AS status,
  (CASE
     WHEN ja.status = 'WITHDRAWN' THEN 'WITHDRAWN'
     WHEN ja.status = 'HIRED' THEN 'SELECTED'
     WHEN ja.status = 'REJECTED' THEN 'NOT_SELECTED'
     WHEN ja.status IN ('REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFER') THEN 'IN_PROGRESS'
     WHEN coalesce(ja.viewed_by_company, false) THEN 'VIEWED'
     ELSE 'SENT'
   END)::text AS candidate_status,
  ja.cover_letter,
  ja.resume_url,
  ja.answers,
  ja.viewed_by_company,
  ja.viewed_at,
  ja.match_score,
  ja.consent_at,
  ja.consent_doc_version,
  jp.title::text AS job_title,
  jp.slug::text AS job_slug,
  jp.status::text AS job_status,
  c.company_name::text AS company_name,
  c.logo_url::text AS company_logo_url
FROM public.job_applications ja
LEFT JOIN public.job_postings jp ON jp.id = ja.job_posting_id
LEFT JOIN public.companies c ON c.id = ja.company_id
WHERE ja.profile_id = auth.uid();

REVOKE ALL ON public.my_job_applications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.my_job_applications TO authenticated, service_role;

COMMENT ON VIEW public.my_job_applications IS
'Candidaturas del usuario autenticado, sin notas internas ni valoración. candidate_status: SENT, VIEWED, IN_PROGRESS, NOT_SELECTED, SELECTED, WITHDRAWN.';


-- -----------------------------------------------------------------------------
-- 6. Copia del perfil y puntuación de afinidad
-- -----------------------------------------------------------------------------

-- Copia fija: perfil público + contacto + experiencias + formación + habilidades + idiomas.
CREATE OR REPLACE FUNCTION public.jobs_profile_snapshot(p_profile_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'version', 1,
    'captured_at', now(),
    'profile', jsonb_build_object(
      'id', p.id, 'full_name', p.full_name, 'headline', p.headline,
      'summary', p.summary, 'slug', p.slug, 'avatar_url', p.avatar_url,
      'location', p.location, 'country_code', p.country_code,
      'linkedin_url', p.linkedin_url, 'github_url', p.github_url,
      'portfolio_url', p.portfolio_url, 'website_url', p.website_url,
      'job_seeking_status', p.job_seeking_status, 'availability', p.availability,
      'job_type', p.job_type, 'work_mode', p.work_mode,
      'open_to_remote', p.open_to_remote, 'willing_to_relocate', p.willing_to_relocate,
      'preferred_locations', p.preferred_locations
    ),
    'contact', jsonb_build_object('email', p.email, 'phone', p.phone),
    'experiences', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'company_name', e.company_name, 'position', e.position,
        'start_date', e.start_date, 'end_date', e.end_date, 'is_current', e.is_current,
        'location', e.location, 'employment_type', e.employment_type,
        'description', e.description, 'achievements', e.achievements,
        'verified', e.verified
      ) ORDER BY e.sort_order, e.start_date DESC NULLS LAST)
      FROM public.experiences e WHERE e.profile_id = p.id), '[]'::jsonb),
    'education', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'institution_name', d.institution_name, 'degree', d.degree,
        'field_of_study', d.field_of_study, 'start_date', d.start_date,
        'end_date', d.end_date, 'is_current', d.is_current, 'grade', d.grade,
        'description', d.description, 'verified', d.verified
      ) ORDER BY d.sort_order, d.start_date DESC NULLS LAST)
      FROM public.education d WHERE d.profile_id = p.id), '[]'::jsonb),
    'skills', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'name', s.name, 'level', s.level, 'years_of_experience', s.years_of_experience,
        'category', s.category
      ) ORDER BY s.sort_order, s.name)
      FROM public.skills s WHERE s.profile_id = p.id), '[]'::jsonb),
    'languages', coalesce((
      SELECT jsonb_agg(jsonb_build_object(
        'name', l.name, 'level', l.level, 'is_native', l.is_native
      ) ORDER BY l.sort_order, l.name)
      FROM public.languages l WHERE l.profile_id = p.id), '[]'::jsonb)
  )
  FROM public.profiles p
  WHERE p.id = p_profile_id;
$$;
REVOKE ALL ON FUNCTION public.jobs_profile_snapshot(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_profile_snapshot(uuid) TO service_role;

-- Lo que falta en el perfil, para avisar antes de enviar.
CREATE OR REPLACE FUNCTION public.jobs_profile_gaps(p_snapshot jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT coalesce(jsonb_agg(g), '[]'::jsonb) FROM (
    SELECT 'NO_HEADLINE'  AS g WHERE coalesce(p_snapshot#>>'{profile,headline}', '') = ''
    UNION ALL SELECT 'NO_SUMMARY'    WHERE coalesce(p_snapshot#>>'{profile,summary}', '') = ''
    UNION ALL SELECT 'NO_EXPERIENCE' WHERE jsonb_array_length(coalesce(p_snapshot->'experiences', '[]')) = 0
    UNION ALL SELECT 'NO_EDUCATION'  WHERE jsonb_array_length(coalesce(p_snapshot->'education', '[]')) = 0
    UNION ALL SELECT 'NO_SKILLS'     WHERE jsonb_array_length(coalesce(p_snapshot->'skills', '[]')) = 0
    UNION ALL SELECT 'NO_LANGUAGES'  WHERE jsonb_array_length(coalesce(p_snapshot->'languages', '[]')) = 0
  ) x;
$$;
REVOKE ALL ON FUNCTION public.jobs_profile_gaps(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_profile_gaps(jsonb) TO service_role;

-- Vista previa para el modal de inscripción: la copia que se enviaría y sus huecos.
CREATE OR REPLACE FUNCTION public.preview_application_profile()
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_snapshot jsonb;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: inicia sesión' USING ERRCODE = '42501';
  END IF;
  v_snapshot := public.jobs_profile_snapshot(auth.uid());
  IF v_snapshot IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND: no tienes perfil' USING ERRCODE = 'P0002';
  END IF;
  RETURN jsonb_build_object('profile', v_snapshot, 'gaps', public.jobs_profile_gaps(v_snapshot));
END;
$$;
REVOKE ALL ON FUNCTION public.preview_application_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.preview_application_profile() TO authenticated, service_role;

-- Datos del perfil que puntúan: habilidades, años, estudios, idiomas y país.
CREATE OR REPLACE FUNCTION public.jobs_profile_match_inputs(p_profile_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'skills', coalesce((
      SELECT jsonb_agg(DISTINCT public.jobs_norm(s.name))
        FROM public.skills s WHERE s.profile_id = p.id AND btrim(coalesce(s.name, '')) <> ''), '[]'::jsonb),
    'years', coalesce((
      SELECT sum(greatest(0, coalesce(e.end_date, current_date) - e.start_date)) / 365.25
        FROM public.experiences e WHERE e.profile_id = p.id AND e.start_date IS NOT NULL), 0),
    'edu', coalesce((
      SELECT max(public.jobs_edu_level(coalesce(d.degree, '') || ' ' || coalesce(d.field_of_study, '')))
        FROM public.education d WHERE d.profile_id = p.id), 0),
    'langs', coalesce((
      SELECT jsonb_object_agg(k, r) FROM (
        SELECT public.jobs_lang_key(l.name) AS k,
               max(public.jobs_lang_rank(l.level, l.is_native, l.percentage)) AS r
          FROM public.languages l WHERE l.profile_id = p.id GROUP BY 1) q), '{}'::jsonb),
    'country', upper(btrim(coalesce(p.country_code, ''))),
    'flexible', coalesce(p.open_to_remote, false) OR coalesce(p.willing_to_relocate, false)
  )
  FROM public.profiles p
  WHERE p.id = p_profile_id;
$$;
REVOKE ALL ON FUNCTION public.jobs_profile_match_inputs(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_profile_match_inputs(uuid) TO service_role;

-- Puntúa (0..100) una oferta (to_jsonb de la fila) frente a los datos del perfil.
--   habilidades 40 · experiencia 20 · estudios 15 · idiomas 15 · ubicación 10
-- Lo que la oferta no pide puntúa la mitad (neutro), no cero ni todo.
CREATE OR REPLACE FUNCTION public.jobs_score_job(p_job jsonb, p_in jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_skills text[];
  v_req text[];
  v_opt text[];
  v_req_hit int; v_opt_hit int;
  s_skills numeric; s_exp numeric; s_edu numeric; s_lang numeric; s_loc numeric;
  v_years numeric := coalesce((p_in->>'years')::numeric, 0);
  v_need numeric;
  v_edu_need int; v_edu int := coalesce((p_in->>'edu')::int, 0);
  v_langs jsonb := coalesce(p_in->'langs', '{}'::jsonb);
  v_jl jsonb := p_job->'languages';
  v_total int := 0; v_hit numeric := 0; v_n int := 0;
  v_key text; v_rank int; v_item jsonb; v_job_country text;
BEGIN
  SELECT coalesce(array_agg(x), '{}') INTO v_skills FROM jsonb_array_elements_text(coalesce(p_in->'skills', '[]'::jsonb)) x;

  -- Habilidades (40)
  SELECT coalesce(array_agg(public.jobs_norm(x)), '{}') INTO v_req
    FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(p_job->'required_skills') = 'array' THEN p_job->'required_skills' ELSE '[]'::jsonb END) x;
  SELECT coalesce(array_agg(public.jobs_norm(x)), '{}') INTO v_opt
    FROM jsonb_array_elements_text(CASE WHEN jsonb_typeof(p_job->'optional_skills') = 'array' THEN p_job->'optional_skills' ELSE '[]'::jsonb END) x;
  v_req_hit := (SELECT count(*) FROM unnest(v_req) r WHERE r = ANY (v_skills));
  v_opt_hit := (SELECT count(*) FROM unnest(v_opt) r WHERE r = ANY (v_skills));
  IF cardinality(v_req) > 0 AND cardinality(v_opt) > 0 THEN
    s_skills := 30.0 * v_req_hit / cardinality(v_req) + 10.0 * v_opt_hit / cardinality(v_opt);
  ELSIF cardinality(v_req) > 0 THEN
    s_skills := 40.0 * v_req_hit / cardinality(v_req);
  ELSIF cardinality(v_opt) > 0 THEN
    s_skills := 40.0 * v_opt_hit / cardinality(v_opt);
  ELSE
    s_skills := 20;
  END IF;

  -- Experiencia (20): años pedidos o, si no, los que implica el nivel
  v_need := CASE
    WHEN substring(coalesce(p_job->>'experience_years', '') from '^\d+(\.\d+)?') IS NOT NULL
      THEN substring(p_job->>'experience_years' from '^\d+(\.\d+)?')::numeric
    ELSE CASE p_job->>'experience_level'
      WHEN 'ENTRY' THEN 0 WHEN 'JUNIOR' THEN 1 WHEN 'MID' THEN 3
      WHEN 'SENIOR' THEN 5 WHEN 'LEAD' THEN 8 WHEN 'EXECUTIVE' THEN 10 ELSE NULL END
  END;
  IF v_need IS NULL THEN
    s_exp := 10;
  ELSIF v_need <= 0 THEN
    s_exp := 20;
  ELSE
    s_exp := 20.0 * least(1, v_years / v_need);
  END IF;

  -- Estudios (15)
  v_edu_need := public.jobs_edu_level(p_job->>'education_min');
  IF coalesce(p_job->>'education_min', '') = '' THEN
    s_edu := 8;
  ELSIF v_edu_need <= 0 THEN
    s_edu := 15;
  ELSE
    s_edu := 15.0 * least(1, v_edu::numeric / v_edu_need);
  END IF;

  -- Idiomas (15): la oferta pide [{language|name|code|lang, level|nivel}], {es:"B2"} o ["en"]
  v_n := CASE jsonb_typeof(v_jl)
    WHEN 'array' THEN jsonb_array_length(v_jl)
    WHEN 'object' THEN (SELECT count(*) FROM jsonb_object_keys(v_jl))::int
    ELSE 0 END;
  IF v_n = 0 THEN
    s_lang := 8;
  ELSE
    IF jsonb_typeof(v_jl) = 'object' THEN
      FOR v_key, v_item IN SELECT key, value FROM jsonb_each(v_jl) LOOP
        v_rank := coalesce((v_langs->>public.jobs_lang_key(v_key))::int, 0);
        v_hit := v_hit + CASE WHEN v_rank = 0 THEN 0 ELSE least(1.0,
          v_rank::numeric / greatest(1, public.jobs_lang_rank(trim(both '"' from v_item::text), false, NULL))) END;
      END LOOP;
    ELSE
      FOR v_item IN SELECT value FROM jsonb_array_elements(v_jl) LOOP
        v_key := public.jobs_lang_key(CASE WHEN jsonb_typeof(v_item) = 'object'
          THEN coalesce(v_item->>'language', v_item->>'name', v_item->>'code', v_item->>'lang')
          ELSE trim(both '"' from v_item::text) END);
        v_rank := coalesce((v_langs->>v_key)::int, 0);
        v_hit := v_hit + CASE WHEN v_rank = 0 THEN 0 ELSE least(1.0,
          v_rank::numeric / greatest(1, CASE WHEN jsonb_typeof(v_item) = 'object'
            THEN public.jobs_lang_rank(coalesce(v_item->>'level', v_item->>'nivel'), false, NULL) ELSE 1 END)) END;
      END LOOP;
    END IF;
    s_lang := 15.0 * v_hit / v_n;
  END IF;

  -- Ubicación (10)
  v_job_country := upper(btrim(coalesce(p_job->>'country_code', p_job->>'location_country', '')));
  IF coalesce((p_job->>'is_remote')::boolean, false) OR p_job->>'work_mode' = 'REMOTE' THEN
    s_loc := 10;
  ELSIF coalesce(p_in->>'country', '') <> '' AND v_job_country = p_in->>'country' THEN
    s_loc := 10;
  ELSIF coalesce(p_in->>'country', '') = '' OR v_job_country = '' THEN
    s_loc := 5;
  ELSIF coalesce((p_in->>'flexible')::boolean, false) THEN
    s_loc := 5;
  ELSE
    s_loc := 2;
  END IF;

  v_total := least(100, greatest(0, round(s_skills + s_exp + s_edu + s_lang + s_loc)::int));
  RETURN jsonb_build_object(
    'skills', round(s_skills)::int, 'experience', round(s_exp)::int,
    'education', round(s_edu)::int, 'languages', round(s_lang)::int,
    'location', round(s_loc)::int, 'total', v_total);
END;
$$;
REVOKE ALL ON FUNCTION public.jobs_score_job(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_score_job(jsonb, jsonb) TO service_role;

-- calculate_job_match_score: la anterior fallaba (columnas inexistentes) y
-- cualquiera, incluso anon, podía puntuar a cualquier perfil. Ahora delega y solo
-- puntúa al propio llamador (o service_role).
CREATE OR REPLACE FUNCTION public.calculate_job_match_score(p_job_posting_id uuid, p_profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.job_postings%ROWTYPE;
  v_in jsonb;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() IS DISTINCT FROM p_profile_id THEN
    RETURN 0;
  END IF;
  SELECT * INTO v_job FROM public.job_postings WHERE id = p_job_posting_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  v_in := public.jobs_profile_match_inputs(p_profile_id);
  IF v_in IS NULL THEN RETURN 0; END IF;
  RETURN (public.jobs_score_job(to_jsonb(v_job), v_in)->>'total')::int;
END;
$$;
REVOKE ALL ON FUNCTION public.calculate_job_match_score(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_job_match_score(uuid, uuid) TO authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 7. Preguntas de filtrado: ¿cumple la respuesta?
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.jobs_answer_meets(p_type text, p_expected text, p_answer text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_t text := upper(coalesce(p_type, ''));
  v_exp text := public.jobs_norm(p_expected);
  v_ans text := public.jobs_norm(p_answer);
  v_op text; v_num numeric; v_val numeric; v_m text[];
  v_alt text; v_part text;
BEGIN
  IF v_exp = '' THEN
    RETURN true;  -- sin criterio: no descarta
  END IF;

  IF v_t = 'YES_NO' THEN
    RETURN (CASE WHEN v_ans IN ('yes', 'y', 'si', 'true', '1', 'sí') THEN 'yes'
                 WHEN v_ans IN ('no', 'n', 'false', '0') THEN 'no' ELSE v_ans END)
         = (CASE WHEN v_exp IN ('yes', 'y', 'si', 'true', '1', 'sí') THEN 'yes'
                 WHEN v_exp IN ('no', 'n', 'false', '0') THEN 'no' ELSE v_exp END);
  END IF;

  IF v_t LIKE '%NUM%' THEN
    v_m := regexp_match(btrim(p_expected), '^\s*(>=|<=|>|<|=)?\s*(-?\d+(?:[.,]\d+)?)\s*$');
    IF v_m IS NULL OR btrim(coalesce(p_answer, '')) !~ '^-?\d+([.,]\d+)?$' THEN
      RETURN false;
    END IF;
    v_op := coalesce(v_m[1], '>=');
    v_num := replace(v_m[2], ',', '.')::numeric;
    v_val := replace(btrim(p_answer), ',', '.')::numeric;
    RETURN CASE v_op WHEN '>=' THEN v_val >= v_num WHEN '<=' THEN v_val <= v_num
                     WHEN '>' THEN v_val > v_num WHEN '<' THEN v_val < v_num ELSE v_val = v_num END;
  END IF;

  -- Texto, lista, opción múltiple: la respuesta (o alguna de las marcadas, separadas por |)
  -- debe estar entre las aceptadas (separadas por |).
  FOREACH v_part IN ARRAY string_to_array(v_ans, '|') LOOP
    FOREACH v_alt IN ARRAY string_to_array(v_exp, '|') LOOP
      IF btrim(v_part) = btrim(v_alt) AND btrim(v_part) <> '' THEN
        RETURN true;
      END IF;
    END LOOP;
  END LOOP;
  RETURN false;
END;
$$;
REVOKE ALL ON FUNCTION public.jobs_answer_meets(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_answer_meets(text, text, text) TO service_role;

-- Destinatarios del aviso de la empresa: notify_emails de la oferta (fase 2) o el
-- correo de la empresa.
CREATE OR REPLACE FUNCTION public.jobs_job_notify_emails(p_job jsonb, p_company_email text)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT coalesce(nullif(ARRAY(
    SELECT DISTINCT lower(btrim(e))
      FROM jsonb_array_elements_text(
        CASE WHEN jsonb_typeof(p_job->'notify_emails') = 'array' THEN p_job->'notify_emails' ELSE '[]'::jsonb END) e
     WHERE btrim(e) ~ '^[^@[:space:]]+@[^@[:space:]]+$'), '{}'),
    CASE WHEN btrim(coalesce(p_company_email, '')) ~ '^[^@[:space:]]+@[^@[:space:]]+$'
         THEN ARRAY[lower(btrim(p_company_email))] ELSE '{}'::text[] END);
$$;
REVOKE ALL ON FUNCTION public.jobs_job_notify_emails(jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.jobs_job_notify_emails(jsonb, text) TO service_role;


-- -----------------------------------------------------------------------------
-- 8. apply_to_job (reescrita)
-- -----------------------------------------------------------------------------
-- Antes: apply_to_job(uuid, uuid, text, jsonb). Se elimina para no dejar dos
-- sobrecargas (PostgREST no sabría cuál llamar).
DROP FUNCTION IF EXISTS public.apply_to_job(uuid, uuid, text, jsonb);

CREATE OR REPLACE FUNCTION public.apply_to_job(
  p_job_posting_id uuid,
  p_profile_id uuid DEFAULT NULL,
  p_cover_letter text DEFAULT NULL,
  p_answers jsonb DEFAULT '{}'::jsonb,
  p_consent boolean DEFAULT false,
  p_consent_doc_version text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_job public.job_postings%ROWTYPE;
  v_company public.companies%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_q record;
  v_val jsonb;
  v_txt text;
  v_answers jsonb := '{}'::jsonb;
  v_failed uuid[] := '{}';
  v_snapshot jsonb;
  v_gaps jsonb;
  v_score jsonb;
  v_match int;
  v_status text;
  v_app_id uuid;
  v_cover text;
  v_mode text;
  v_job_json jsonb;
  v_to text;
  v_digest boolean;
  v_when timestamptz;
BEGIN
  -- Sesión
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: inicia sesión para inscribirte' USING ERRCODE = '42501';
  END IF;
  IF p_profile_id IS NOT NULL AND p_profile_id IS DISTINCT FROM v_uid THEN
    RAISE EXCEPTION 'UNAUTHORIZED: solo puedes inscribirte con tu propio perfil' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'UNAUTHORIZED: no tienes perfil' USING ERRCODE = '42501';
  END IF;

  p_answers := coalesce(p_answers, '{}'::jsonb);
  IF jsonb_typeof(p_answers) <> 'object' OR octet_length(p_answers::text) > 20000 THEN
    RAISE EXCEPTION 'INVALID_ANSWERS: respuestas no válidas';
  END IF;

  -- Oferta publicada, vigente y de una empresa verificada. Se bloquea la fila
  -- para serializar inscripciones y el contador.
  SELECT * INTO v_job FROM public.job_postings WHERE id = p_job_posting_id FOR UPDATE;
  IF NOT FOUND
     OR v_job.status <> 'PUBLISHED'
     OR (v_job.application_deadline IS NOT NULL AND v_job.application_deadline <= now()) THEN
    RAISE EXCEPTION 'JOB_NOT_AVAILABLE: Job not available' USING ERRCODE = 'P0001';
  END IF;
  SELECT * INTO v_company FROM public.companies WHERE id = v_job.company_id;
  IF NOT FOUND OR v_company.status <> 'APPROVED' THEN
    RAISE EXCEPTION 'JOB_NOT_AVAILABLE: Job not available' USING ERRCODE = 'P0001';
  END IF;

  -- Duplicado
  IF EXISTS (
    SELECT 1 FROM public.job_applications
     WHERE job_posting_id = p_job_posting_id AND profile_id = v_uid
  ) THEN
    RAISE EXCEPTION 'ALREADY_APPLIED: Already applied to this job' USING ERRCODE = 'P0001';
  END IF;

  -- Consentimiento para ceder el perfil a la empresa
  IF p_consent IS NOT TRUE THEN
    RAISE EXCEPTION 'CONSENT_REQUIRED: debes aceptar ceder tu perfil a la empresa' USING ERRCODE = 'P0001';
  END IF;

  -- Carta de presentación
  v_job_json := to_jsonb(v_job);
  v_mode := upper(coalesce(v_job_json->>'cover_letter_mode', ''));
  v_cover := nullif(btrim(p_cover_letter), '');
  IF length(coalesce(v_cover, '')) > 10000 THEN
    RAISE EXCEPTION 'COVER_LETTER_TOO_LONG: la carta es demasiado larga' USING ERRCODE = 'P0001';
  END IF;
  IF v_mode IN ('NO', 'NONE', 'NOT_ALLOWED') THEN
    v_cover := NULL;
  ELSIF v_mode IN ('REQUIRED', 'OBLIGATORIA', 'MANDATORY') AND v_cover IS NULL THEN
    RAISE EXCEPTION 'COVER_LETTER_REQUIRED: esta oferta exige carta de presentación' USING ERRCODE = 'P0001';
  END IF;

  -- Preguntas: obligatorias (is_required o imprescindibles) y knockout
  FOR v_q IN
    SELECT * FROM public.job_posting_questions
     WHERE job_posting_id = p_job_posting_id
     ORDER BY order_index, created_at
  LOOP
    v_val := p_answers -> v_q.id::text;
    v_txt := CASE jsonb_typeof(v_val)
      WHEN 'string' THEN btrim(v_val #>> '{}')
      WHEN 'array' THEN (SELECT string_agg(btrim(x), '|') FROM jsonb_array_elements_text(v_val) x WHERE btrim(x) <> '')
      WHEN 'number' THEN v_val #>> '{}'
      WHEN 'boolean' THEN v_val #>> '{}'
      ELSE NULL END;
    IF v_txt = '' THEN v_txt := NULL; END IF;

    IF v_txt IS NULL THEN
      IF coalesce(v_q.is_required, false) OR v_q.is_knockout THEN
        RAISE EXCEPTION 'REQUIRED_QUESTION_MISSING: falta responder "%"', left(v_q.question_text, 80)
          USING ERRCODE = 'P0001', DETAIL = v_q.id::text;
      END IF;
      CONTINUE;
    END IF;

    v_answers := v_answers || jsonb_build_object(v_q.id::text, v_val);
    IF v_q.is_knockout AND NOT public.jobs_answer_meets(v_q.question_type, v_q.expected_answer, v_txt) THEN
      v_failed := v_failed || v_q.id;
    END IF;
  END LOOP;

  -- Copia del perfil y afinidad
  v_snapshot := public.jobs_profile_snapshot(v_uid);
  v_gaps := public.jobs_profile_gaps(v_snapshot);
  v_score := public.jobs_score_job(v_job_json, public.jobs_profile_match_inputs(v_uid));
  v_match := (v_score->>'total')::int;
  v_status := CASE WHEN cardinality(v_failed) > 0 THEN 'NOT_QUALIFIED' ELSE 'NEW' END;

  BEGIN
    INSERT INTO public.job_applications (
      job_posting_id, profile_id, company_id, cover_letter, answers, match_score,
      status, perfil_copia, consent_at, consent_doc_version, descartada_auto, metadata
    ) VALUES (
      p_job_posting_id, v_uid, v_job.company_id, v_cover, v_answers, v_match,
      v_status, v_snapshot, now(), left(p_consent_doc_version, 50), v_status = 'NOT_QUALIFIED',
      CASE WHEN cardinality(v_failed) > 0
           THEN jsonb_build_object('failed_questions', to_jsonb(v_failed), 'score', v_score)
           ELSE jsonb_build_object('score', v_score) END
    ) RETURNING id INTO v_app_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'ALREADY_APPLIED: Already applied to this job' USING ERRCODE = 'P0001';
  END;
  -- (el historial lo escribe el trigger de alta)

  UPDATE public.job_postings
     SET applications_count = coalesce(applications_count, 0) + 1
   WHERE id = p_job_posting_id;

  -- Avisos en la cola (nada se envía desde aquí)
  PERFORM public.jobs_enqueue_email(
    'application_received_candidate', v_profile.email,
    jsonb_build_object(
      'application_id', v_app_id, 'job_posting_id', p_job_posting_id,
      'job_title', v_job.title, 'company_name', v_company.company_name,
      'candidate_name', v_profile.full_name),
    to_jsonb(v_profile)->>'registro_idioma', 5, now());

  -- A la empresa no se le avisa de lo que el sistema descarta por requisitos.
  IF v_status = 'NEW' THEN
    v_digest := lower(coalesce(v_job_json->>'notify_frequency', '')) ~ '^(daily|diari|digest|resumen)';
    v_when := CASE WHEN v_digest
      THEN (date_trunc('day', now() AT TIME ZONE 'UTC') + interval '1 day 8 hours') AT TIME ZONE 'UTC'
      ELSE now() END;
    FOREACH v_to IN ARRAY public.jobs_job_notify_emails(v_job_json, v_company.company_email) LOOP
      PERFORM public.jobs_enqueue_email(
        'application_received_company', v_to,
        jsonb_build_object(
          'application_id', v_app_id, 'job_posting_id', p_job_posting_id,
          'job_title', v_job.title, 'company_id', v_job.company_id,
          'candidate_name', v_profile.full_name, 'match_score', v_match,
          'digest', v_digest),
        to_jsonb(v_company)->>'idioma', CASE WHEN v_digest THEN 8 ELSE 5 END, v_when);
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', v_app_id,
    'match_score', v_match,
    'warnings', v_gaps
  );
END;
$$;
REVOKE ALL ON FUNCTION public.apply_to_job(uuid, uuid, text, jsonb, boolean, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_to_job(uuid, uuid, text, jsonb, boolean, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.apply_to_job(uuid, uuid, text, jsonb, boolean, text) IS
'Inscribe al usuario autenticado en una oferta PUBLISHED, vigente y de empresa APPROVED. Exige consentimiento, responde las preguntas obligatorias, guarda la copia del perfil, descarta a NOT_QUALIFIED si falla una pregunta knockout y encola los avisos. Errores con código al inicio del mensaje: AUTH_REQUIRED, UNAUTHORIZED, JOB_NOT_AVAILABLE, ALREADY_APPLIED, CONSENT_REQUIRED, REQUIRED_QUESTION_MISSING, COVER_LETTER_REQUIRED, COVER_LETTER_TOO_LONG, INVALID_ANSWERS.';


-- -----------------------------------------------------------------------------
-- 9. update_application_status (reescrita), withdraw, vista de la empresa, historial
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_application_status(
  p_application_id uuid,
  p_company_id uuid,
  p_user_id uuid,
  p_new_status character varying,
  p_internal_notes text DEFAULT NULL,
  p_rating integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_status varchar(50);
  v_new_status varchar(50);
BEGIN
  PERFORM public.assert_caller_matches_user(p_user_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.company_users
     WHERE company_id = p_company_id
       AND user_id = p_user_id
       AND role IN ('OWNER', 'ADMIN', 'MEMBER')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not authorized to update applications for this company'
      USING ERRCODE = '42501';
  END IF;

  SELECT status INTO v_old_status
    FROM public.job_applications
   WHERE id = p_application_id AND company_id = p_company_id
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found or does not belong to this company';
  END IF;

  IF v_old_status = 'WITHDRAWN' THEN
    RAISE EXCEPTION 'APPLICATION_WITHDRAWN: el candidato retiró su candidatura' USING ERRCODE = 'P0001';
  END IF;

  v_new_status := coalesce(p_new_status, v_old_status);
  IF v_new_status <> v_old_status
     AND v_new_status NOT IN ('NEW', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED') THEN
    RAISE EXCEPTION 'INVALID_STATUS: estado no permitido (%)', v_new_status USING ERRCODE = 'P0001';
  END IF;
  IF p_rating IS NOT NULL AND (p_rating < 1 OR p_rating > 5) THEN
    RAISE EXCEPTION 'INVALID_RATING: la valoración va de 1 a 5' USING ERRCODE = 'P0001';
  END IF;

  -- El historial y el aviso al candidato (cola) los pone el trigger de status.
  UPDATE public.job_applications
     SET status = v_new_status,
         internal_notes = coalesce(p_internal_notes, internal_notes),
         rating = coalesce(p_rating, rating),
         viewed_by_company = true,
         viewed_at = coalesce(viewed_at, now()),
         viewed_by = coalesce(viewed_by, p_user_id),
         updated_at = now()
   WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'old_status', v_old_status,
    'new_status', v_new_status
  );
END;
$$;
REVOKE ALL ON FUNCTION public.update_application_status(uuid, uuid, uuid, character varying, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_application_status(uuid, uuid, uuid, character varying, text, integer) TO authenticated, service_role;

-- El candidato se retira (único cambio de estado que puede hacer).
CREATE OR REPLACE FUNCTION public.withdraw_application(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_app public.job_applications%ROWTYPE;
  v_job_status text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: inicia sesión' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_app FROM public.job_applications
   WHERE id = p_id AND profile_id = v_uid
   FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND: candidatura no encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF v_app.status = 'WITHDRAWN' THEN
    RAISE EXCEPTION 'ALREADY_WITHDRAWN: ya la retiraste' USING ERRCODE = 'P0001';
  END IF;
  IF v_app.status IN ('HIRED', 'REJECTED') THEN
    RAISE EXCEPTION 'CANNOT_WITHDRAW: el proceso ya terminó' USING ERRCODE = 'P0001';
  END IF;

  SELECT status INTO v_job_status FROM public.job_postings WHERE id = v_app.job_posting_id;
  IF v_job_status IN ('CLOSED', 'FILLED', 'EXPIRED') THEN
    RAISE EXCEPTION 'JOB_CLOSED: la oferta ya está cerrada' USING ERRCODE = 'P0001';
  END IF;

  UPDATE public.job_applications SET status = 'WITHDRAWN', updated_at = now() WHERE id = p_id;

  RETURN jsonb_build_object('success', true, 'application_id', p_id, 'status', 'WITHDRAWN');
END;
$$;
REVOKE ALL ON FUNCTION public.withdraw_application(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.withdraw_application(uuid) TO authenticated, service_role;

-- La empresa abre la candidatura: marca «vista» (idempotente, no cambia el estado).
CREATE OR REPLACE FUNCTION public.mark_application_viewed(p_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_company uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: inicia sesión' USING ERRCODE = '42501';
  END IF;
  SELECT company_id INTO v_company FROM public.job_applications WHERE id = p_id;
  IF v_company IS NULL OR NOT public.is_company_member(v_company) THEN
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND: candidatura no encontrada' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.job_applications
     SET viewed_by_company = true,
         viewed_at = coalesce(viewed_at, now()),
         viewed_by = coalesce(viewed_by, v_uid)
   WHERE id = p_id AND viewed_by_company IS NOT TRUE;

  RETURN jsonb_build_object('success', true, 'application_id', p_id, 'viewed', true);
END;
$$;
REVOKE ALL ON FUNCTION public.mark_application_viewed(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_application_viewed(uuid) TO authenticated, service_role;

-- Historial: la empresa/admin lo ve tal cual; el candidato, con NOT_QUALIFIED como NEW.
CREATE OR REPLACE FUNCTION public.get_application_history(p_application_id uuid)
RETURNS TABLE (from_status text, to_status text, changed_by_role text, created_at timestamptz)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_profile uuid;
  v_company uuid;
  v_masked boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: inicia sesión' USING ERRCODE = '42501';
  END IF;
  SELECT ja.profile_id, ja.company_id INTO v_profile, v_company
    FROM public.job_applications ja WHERE ja.id = p_application_id;
  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND: candidatura no encontrada' USING ERRCODE = 'P0002';
  END IF;

  IF public.is_company_member(v_company) OR public.current_user_is_admin() THEN
    v_masked := false;
  ELSIF v_profile = v_uid THEN
    v_masked := true;
  ELSE
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND: candidatura no encontrada' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
    SELECT x.f, x.t, x.r, x.c FROM (
      SELECT (CASE WHEN v_masked AND h.from_status = 'NOT_QUALIFIED' THEN 'NEW' ELSE h.from_status END)::text AS f,
             (CASE WHEN v_masked AND h.to_status = 'NOT_QUALIFIED' THEN 'NEW' ELSE h.to_status END)::text AS t,
             h.changed_by_role AS r,
             h.created_at AS c,
             h.id AS i
        FROM public.job_application_status_history h
       WHERE h.application_id = p_application_id
    ) x
    WHERE NOT (v_masked AND x.f IS NOT DISTINCT FROM x.t)
    ORDER BY x.c, x.i;
END;
$$;
REVOKE ALL ON FUNCTION public.get_application_history(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_application_history(uuid) TO authenticated, service_role;


-- -----------------------------------------------------------------------------
-- 10. get_recommended_jobs: ofertas más afines al perfil del llamador
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_recommended_jobs(p_limit int DEFAULT 20)
RETURNS TABLE (
  job_posting_id uuid,
  title text,
  slug text,
  company_id uuid,
  company_name text,
  company_logo_url text,
  location_city text,
  location_country text,
  is_remote boolean,
  work_mode text,
  employment_type text,
  salary_min int,
  salary_max int,
  salary_currency text,
  published_at timestamptz,
  application_deadline timestamptz,
  match_score int,
  match_breakdown jsonb,
  already_applied boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_in jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: inicia sesión' USING ERRCODE = '42501';
  END IF;
  v_in := public.jobs_profile_match_inputs(v_uid);
  IF v_in IS NULL THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND: no tienes perfil' USING ERRCODE = 'P0002';
  END IF;

  RETURN QUERY
  WITH cand AS (
    SELECT jp.*, to_jsonb(jp) AS j, c.company_name AS c_name, c.logo_url AS c_logo
      FROM public.job_postings jp
      JOIN public.companies c ON c.id = jp.company_id
     WHERE jp.status = 'PUBLISHED'
       AND jp.published_at IS NOT NULL
       AND (jp.application_deadline IS NULL OR jp.application_deadline > now())
       AND c.status = 'APPROVED'
     ORDER BY jp.published_at DESC
     LIMIT 500
  ), scored AS (
    SELECT cand.*, public.jobs_score_job(cand.j, v_in) AS s FROM cand
  )
  SELECT sc.id, sc.title::text, sc.slug::text, sc.company_id, sc.c_name::text, sc.c_logo::text,
         sc.location_city::text, sc.location_country::text, sc.is_remote, sc.work_mode::text,
         sc.employment_type::text, sc.salary_min, sc.salary_max, sc.salary_currency::text,
         sc.published_at, sc.application_deadline,
         (sc.s->>'total')::int, sc.s,
         EXISTS (SELECT 1 FROM public.job_applications a
                  WHERE a.job_posting_id = sc.id AND a.profile_id = v_uid)
    FROM scored sc
   ORDER BY (sc.s->>'total')::int DESC, sc.published_at DESC, sc.id
   LIMIT least(greatest(coalesce(p_limit, 20), 1), 100);
END;
$$;
REVOKE ALL ON FUNCTION public.get_recommended_jobs(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_recommended_jobs(int) TO authenticated, service_role;

COMMENT ON FUNCTION public.get_recommended_jobs(int) IS
'Ofertas PUBLISHED de empresas APPROVED ordenadas por afinidad (0-100) con el perfil del llamador: habilidades 40, experiencia 20, estudios 15, idiomas 15, ubicación 10. match_breakdown detalla cada parte.';


-- -----------------------------------------------------------------------------
-- 11. Alertas de ofertas (fase 4)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_alert_subscriptions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id    uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  categories    text[] NOT NULL DEFAULT '{}',
  country       text,
  keywords      text[] NOT NULL DEFAULT '{}',
  frequency     text NOT NULL DEFAULT 'WEEKLY' CHECK (frequency IN ('DAILY', 'WEEKLY')),
  active        boolean NOT NULL DEFAULT true,
  opted_in_at   timestamptz NOT NULL DEFAULT now(),
  last_sent_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.job_alert_subscriptions IS
'Alertas de ofertas de un candidato (una por perfil). active = casilla marcada. last_sent_at = última vez que queue_job_alerts encoló un aviso (no hay envío real todavía).';

ALTER TABLE public.job_alert_subscriptions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_alert_subscriptions FROM PUBLIC, anon, authenticated;
GRANT SELECT, DELETE ON public.job_alert_subscriptions TO authenticated;
GRANT INSERT (profile_id, categories, country, keywords, frequency, active) ON public.job_alert_subscriptions TO authenticated;
GRANT UPDATE (categories, country, keywords, frequency, active) ON public.job_alert_subscriptions TO authenticated;
GRANT ALL ON public.job_alert_subscriptions TO service_role;

DROP POLICY IF EXISTS "Dueño gestiona su alerta" ON public.job_alert_subscriptions;
CREATE POLICY "Dueño gestiona su alerta" ON public.job_alert_subscriptions
  FOR ALL TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

CREATE OR REPLACE FUNCTION public.job_alert_subscriptions_touch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    NEW.updated_at := now();
    IF NEW.active AND NOT OLD.active THEN
      NEW.opted_in_at := now();
      NEW.last_sent_at := NULL;
    END IF;
  END IF;
  NEW.categories := coalesce(NEW.categories, '{}');
  NEW.keywords := coalesce(NEW.keywords, '{}');
  IF cardinality(NEW.categories) > 20 OR cardinality(NEW.keywords) > 20 THEN
    RAISE EXCEPTION 'TOO_MANY_FILTERS: máximo 20 categorías y 20 palabras' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.job_alert_subscriptions_touch() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_alert_subscriptions_touch ON public.job_alert_subscriptions;
CREATE TRIGGER trg_job_alert_subscriptions_touch
  BEFORE INSERT OR UPDATE ON public.job_alert_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.job_alert_subscriptions_touch();

-- Encola un aviso por suscriptor con ofertas nuevas desde el último. Idempotente:
-- tras encolar fija last_sent_at, así que una segunda llamada seguida no repite
-- (DAILY espera 23 h, WEEKLY 6 días y 23 h). Devuelve cuántos avisos encoló.
-- Solo service_role / conexión directa (cron). No envía nada.
CREATE OR REPLACE FUNCTION public.queue_job_alerts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_queued int := 0;
  s record;
  v_since timestamptz;
  v_cats text[];
  v_total int;
  v_jobs jsonb;
BEGIN
  IF auth.role() IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'FORBIDDEN: solo service_role' USING ERRCODE = '42501';
  END IF;

  FOR s IN
    SELECT sub.*, p.email AS p_email, to_jsonb(p)->>'registro_idioma' AS p_lang
      FROM public.job_alert_subscriptions sub
      JOIN public.profiles p ON p.id = sub.profile_id
     WHERE sub.active
       AND btrim(coalesce(p.email, '')) <> ''
       AND coalesce(p.is_active, true)
       AND (sub.last_sent_at IS NULL
            OR sub.last_sent_at <= now() - CASE sub.frequency
                 WHEN 'DAILY' THEN interval '23 hours' ELSE interval '6 days 23 hours' END)
     ORDER BY sub.id
       FOR UPDATE OF sub SKIP LOCKED
  LOOP
    v_since := coalesce(s.last_sent_at, s.opted_in_at);
    v_cats := ARRAY(SELECT lower(btrim(x)) FROM unnest(s.categories) x WHERE btrim(x) <> '');

    WITH m AS (
      SELECT jp.id, jp.title, jp.slug, jp.published_at, c.company_name,
             coalesce(to_jsonb(jp)->>'country_code', jp.location_country) AS country
        FROM public.job_postings jp
        JOIN public.companies c ON c.id = jp.company_id
       WHERE jp.status = 'PUBLISHED'
         AND jp.published_at IS NOT NULL
         AND jp.published_at > v_since AND jp.published_at <= now()
         AND (jp.application_deadline IS NULL OR jp.application_deadline > now())
         AND c.status = 'APPROVED'
         AND (cardinality(v_cats) = 0
              OR lower(btrim(coalesce(to_jsonb(jp)->>'category', jp.department, ''))) = ANY (v_cats)
              OR lower(btrim(coalesce(to_jsonb(jp)->>'category2', ''))) = ANY (v_cats))
         AND (coalesce(btrim(s.country), '') = ''
              OR upper(btrim(coalesce(to_jsonb(jp)->>'country_code', jp.location_country, ''))) = upper(btrim(s.country)))
         AND (cardinality(s.keywords) = 0 OR EXISTS (
               SELECT 1 FROM unnest(s.keywords) k
                WHERE btrim(k) <> ''
                  AND strpos(public.jobs_norm(jp.title || ' ' || coalesce(jp.description, '')), public.jobs_norm(k)) > 0))
    )
    SELECT (SELECT count(*) FROM m),
           (SELECT coalesce(jsonb_agg(jsonb_build_object(
                     'id', t.id, 'title', t.title, 'slug', t.slug,
                     'company_name', t.company_name, 'country', t.country,
                     'published_at', t.published_at) ORDER BY t.published_at DESC), '[]'::jsonb)
              FROM (SELECT * FROM m ORDER BY published_at DESC LIMIT 10) t)
      INTO v_total, v_jobs;

    IF v_total > 0 THEN
      PERFORM public.jobs_enqueue_email(
        'job_alert', s.p_email,
        jsonb_build_object(
          'profile_id', s.profile_id, 'frequency', s.frequency,
          'total', v_total, 'jobs', v_jobs,
          'period_from', v_since, 'period_to', now()),
        s.p_lang, 9, now());
      UPDATE public.job_alert_subscriptions SET last_sent_at = now() WHERE id = s.id;
      v_queued := v_queued + 1;
    END IF;
  END LOOP;

  RETURN v_queued;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_job_alerts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_job_alerts() TO service_role;

COMMENT ON FUNCTION public.queue_job_alerts() IS
'Encola en email_outbox un aviso por suscripción activa con ofertas nuevas (por categoría, país y palabras). Idempotente. Llamar desde cron o una Edge Function con service_role. No envía.';
