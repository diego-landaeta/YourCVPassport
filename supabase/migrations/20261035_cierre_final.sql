-- =============================================================================
-- Bolsa de empleo: cierre final (auditoría de aceptación, 30/10/2026)
-- =============================================================================
--
-- ORDEN: va DESPUÉS de 20261028 .. 20261034 (toca funciones y tablas de 29-34).
-- Aplicable de una vez y reaplicable (CREATE OR REPLACE, DROP ... IF EXISTS,
-- ON CONFLICT DO NOTHING). Hechos de producción: 0 empresas, 0 ofertas y 0
-- candidaturas, así que no hay datos que migrar. pg_net está instalado; pg_cron
-- lo habilita 20261034 (esta migración solo programa si el esquema cron existe).
--
-- QUÉ HACE (S-1 .. S-9)
--   S-1  Moderación inmediata. Trigger AFTER INSERT/UPDATE en job_postings: al
--        quedar una oferta en AI_REVIEW llama, dentro de un bloque
--        EXCEPTION WHEN OTHERS THEN NULL, a
--        bolsa_llamar_funcion('moderate-job-posting', {"job_id": ...}). Si falta
--        pg_net, el secreto del vault o falla la red, el envío de la oferta NO se
--        rompe; el cron de cada 5 minutos (bolsa-moderacion) sigue de red de
--        seguridad.
--   S-2  job_posting_questions_proteger ya no lanza QUESTIONS_LOCKED ni
--        QUESTION_HAS_ANSWERS en un UPDATE que no cambia nada (editar el salario
--        o el cierre de una oferta publicada con preguntas hacía que el asistente
--        reescribiese las preguntas iguales y fallase). Cualquier cambio real
--        sigue bloqueado.
--   S-3  country_code (minúsculas) en el payload de TODOS los correos de oferta
--        (job_published, job_expiring, job_expired, job_rejected, job_reported,
--        job_manual_review, application_*, application_message, application_digest
--        y los que vengan): lo añade un trigger BEFORE INSERT en email_outbox a
--        partir de job_id / job_posting_id / application_id del payload. Un
--        country_code que ya venga se respeta (normalizado a minúsculas).
--   S-4  Resumen diario real. queue_application_digests() (solo service_role)
--        encola UN correo application_digest por oferta y destinatario con las
--        candidaturas nuevas del tramo 08:00 UTC -> 08:00 UTC (sin el correo del
--        candidato). Idempotente por dedupe_key. apply_to_job solo encola el aviso
--        individual application_received_company si la frecuencia de la oferta es
--        inmediata (EACH); con DAILY lo recoge el resumen.
--   S-5  Alertas: unsubscribe_token uuid; unsubscribe_job_alerts(p_token) para
--        anon (baja con un clic desde el correo); hasta 5 alertas por perfil
--        (se quita el UNIQUE por perfil y un trigger limita a 5); una alerta nueva
--        sin ningún filtro (la de la casilla alertas_novedades) toma el país del
--        perfil; queue_job_alerts() mete en el payload hasta 8 ofertas
--        {title, slug, country_code, company_name, ...} y el unsubscribe_token.
--   S-6  search_public_jobs_v2 con p_sort ('recent' | 'affinity'). 'affinity'
--        ordena por la puntuación de get_recommended_jobs (jobs_score_job) y solo
--        con sesión de candidato con perfil; sin sesión cae a 'recent'.
--   S-7  Tipo de documento condiciones_publicacion (audiencia empleador): CHECK de
--        documentos_legales ampliado, semilla v1.0 es/en (BORRADOR pendiente de
--        abogado), legal_publicar_version / legal_encolar_aviso lo aceptan y
--        _job_submit exige la aceptación de ese tipo SOLO si existe una versión
--        vigente (si no existe, no se exige). terminos_empleador sigue siendo el
--        del registro de empresa. NOTA: la semilla `cookies` de la BD
--        (20261029) es solo informativa (requiere_aceptacion = false); el texto
--        que manda es la página /politica-de-cookies del frontend.
--   S-8  Programación: bolsa_llamar_funcion acepta también company-review-ai; se
--        programan bolsa-empresas (cada 10 min, {"sweep":true}) y bolsa-resumenes
--        (diario 08:00 UTC, send-outbox {"digests":true}).
--   S-9  company_duplicate_hint(p_tax_id, p_company_email) (authenticated):
--        {tax_id_taken, email_taken} sin revelar de quién, para avisar antes de
--        insertar. No cambia el esquema.
--
-- COMPROBACIONES ANTES
--   select proname from pg_proc where pronamespace='public'::regnamespace
--     and proname in ('_outbox_enqueue','jobs_job_notify_emails','jobs_score_job','legal_encolar_aviso',
--                     'bolsa_llamar_funcion','_aceptacion_pendiente');   -- 6 filas
--   (la migración aborta con un mensaje claro si falta alguna de 29-34)
--
-- COMPROBACIONES DESPUÉS
--   select jobname, schedule from cron.job where jobname like 'bolsa-%' order by 1;  -- 6 filas
--   select tgname from pg_trigger where tgrelid='public.job_postings'::regclass and tgname like 'trg_job_postings_moderacion%';
--   select count(*) from public.documentos_legales where tipo='condiciones_publicacion';  -- 2
--   select proargnames from pg_proc where proname='search_public_jobs_v2';               -- incluye p_sort
--
-- VUELTA ATRÁS (en este orden; nada de esto borra datos de usuarios)
--   drop trigger if exists trg_job_postings_moderacion_ins on public.job_postings;
--   drop trigger if exists trg_job_postings_moderacion_upd on public.job_postings;
--   drop trigger if exists trg_email_outbox_country_code on public.email_outbox;
--   drop trigger if exists trg_job_alert_subscriptions_tope on public.job_alert_subscriptions;
--   select cron.unschedule('bolsa-empresas'); select cron.unschedule('bolsa-resumenes');
--   drop function public.queue_application_digests(); drop function public.unsubscribe_job_alerts(uuid);
--   drop function public.company_duplicate_hint(text, text);
--   (search_public_jobs_v2: re-aplicar su definición de 20261032; apply_to_job,
--    _job_submit, job_posting_questions_proteger, queue_job_alerts,
--    legal_publicar_version, legal_encolar_aviso y bolsa_llamar_funcion: re-aplicar
--    las de 20261032 / 20261031 / 20261033 / 20261034 respectivamente.)
--   La columna unsubscribe_token y las filas de condiciones_publicacion pueden
--   quedarse (no estorban). El UNIQUE por perfil de job_alert_subscriptions solo se
--   puede recrear si ningún perfil tiene ya varias alertas.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Requisitos: las migraciones 29-34 tienen que estar aplicadas
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_missing text := '';
BEGIN
  IF to_regprocedure('public._outbox_enqueue(text,text,jsonb,text,integer,timestamptz,text)') IS NULL THEN v_missing := v_missing || ' _outbox_enqueue(20261030);'; END IF;
  IF to_regprocedure('public.jobs_enqueue_email(text,text,jsonb,text,integer,timestamptz)') IS NULL THEN v_missing := v_missing || ' jobs_enqueue_email(20261031);'; END IF;
  IF to_regprocedure('public.jobs_job_notify_emails(jsonb,text)') IS NULL THEN v_missing := v_missing || ' jobs_job_notify_emails(20261031);'; END IF;
  IF to_regprocedure('public.jobs_score_job(jsonb,jsonb)') IS NULL THEN v_missing := v_missing || ' jobs_score_job(20261031);'; END IF;
  IF to_regprocedure('public.jobs_profile_match_inputs(uuid)') IS NULL THEN v_missing := v_missing || ' jobs_profile_match_inputs(20261031);'; END IF;
  IF to_regprocedure('public._aceptacion_pendiente(uuid,text)') IS NULL THEN v_missing := v_missing || ' _aceptacion_pendiente(20261032);'; END IF;
  IF to_regprocedure('public.legal_encolar_aviso(text,text)') IS NULL THEN v_missing := v_missing || ' legal_encolar_aviso(20261033);'; END IF;
  IF to_regprocedure('public.legal_publicar_version(text,text,text,text,text,timestamptz,text[],boolean)') IS NULL THEN v_missing := v_missing || ' legal_publicar_version(20261033);'; END IF;
  IF to_regclass('public.job_alert_subscriptions') IS NULL THEN v_missing := v_missing || ' job_alert_subscriptions(20261031);'; END IF;
  IF to_regclass('public.email_outbox') IS NULL THEN v_missing := v_missing || ' email_outbox(20261030);'; END IF;
  IF v_missing <> '' THEN
    RAISE EXCEPTION 'ABORTADO: faltan piezas de migraciones anteriores (aplica 20261028..20261034 antes):%', v_missing;
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. S-2: preguntas de una oferta publicada. Un UPDATE sin cambios no es un cambio.
--    (resto idéntico a 20261032_correcciones_auditoria.sql, sección 8)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.job_posting_questions_proteger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_priv   boolean;
  v_status text;
  v_job_id uuid;
BEGIN
  -- S-2: UPDATE que deja la fila igual (el asistente reenvía las preguntas sin
  -- tocar): no hay nada que proteger. updated_at no cuenta (otro trigger puede
  -- haberlo movido ya).
  IF TG_OP = 'UPDATE' AND (to_jsonb(NEW) - 'updated_at') IS NOT DISTINCT FROM (to_jsonb(OLD) - 'updated_at') THEN
    RETURN NEW;
  END IF;

  v_priv := current_user NOT IN ('anon', 'authenticated')
            OR (current_user = 'authenticated' AND public.current_user_is_admin());

  IF TG_OP = 'DELETE' THEN
    v_job_id := OLD.job_posting_id;
    -- Borrado en cascada de una oferta que ya no existe: se permite.
    IF NOT EXISTS (SELECT 1 FROM public.job_postings WHERE id = v_job_id) THEN
      RETURN OLD;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    v_job_id := OLD.job_posting_id;
  ELSE
    v_job_id := NEW.job_posting_id;
  END IF;

  -- (a) respuestas
  IF TG_OP = 'DELETE'
     OR (TG_OP = 'UPDATE' AND (
           NEW.question_text IS DISTINCT FROM OLD.question_text
        OR NEW.question_type IS DISTINCT FROM OLD.question_type
        OR NEW.options IS DISTINCT FROM OLD.options
        OR NEW.is_required IS DISTINCT FROM OLD.is_required
        OR NEW.is_knockout IS DISTINCT FROM OLD.is_knockout
        OR NEW.expected_answer IS DISTINCT FROM OLD.expected_answer
        OR NEW.job_posting_id IS DISTINCT FROM OLD.job_posting_id)) THEN
    IF EXISTS (SELECT 1 FROM public.job_applications ja
                WHERE ja.job_posting_id = OLD.job_posting_id AND ja.answers ? OLD.id::text) THEN
      RAISE EXCEPTION 'QUESTION_HAS_ANSWERS: una pregunta con respuestas no se borra ni se edita; ocultala (is_active = false)'
        USING ERRCODE = '23503';
    END IF;
  END IF;

  -- (b) oferta publicada o pausada
  IF NOT v_priv THEN
    SELECT jp.status INTO v_status FROM public.job_postings jp WHERE jp.id = v_job_id;
    IF v_status IN ('PUBLISHED', 'PAUSED') THEN
      RAISE EXCEPTION 'QUESTIONS_LOCKED: las preguntas de una oferta publicada no se cambian; pasala a borrador y reenviala a revision'
        USING ERRCODE = '42501';
    END IF;
    IF TG_OP = 'UPDATE' AND NEW.job_posting_id IS DISTINCT FROM OLD.job_posting_id THEN
      SELECT jp.status INTO v_status FROM public.job_postings jp WHERE jp.id = NEW.job_posting_id;
      IF v_status IN ('PUBLISHED', 'PAUSED') THEN
        RAISE EXCEPTION 'QUESTIONS_LOCKED: las preguntas de una oferta publicada no se cambian; pasala a borrador y reenviala a revision'
          USING ERRCODE = '42501';
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.job_posting_questions_proteger() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_posting_questions_proteger ON public.job_posting_questions;
CREATE TRIGGER trg_job_posting_questions_proteger
  BEFORE INSERT OR UPDATE OR DELETE ON public.job_posting_questions
  FOR EACH ROW EXECUTE FUNCTION public.job_posting_questions_proteger();

-- -----------------------------------------------------------------------------
-- 2. S-3: country_code en el payload de todo correo de oferta
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.email_outbox_country_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uuid_re constant text := '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
  v_txt     text;
  v_job     uuid;
  v_cc      text;
BEGIN
  IF NEW.payload IS NULL OR jsonb_typeof(NEW.payload) <> 'object' THEN
    RETURN NEW;
  END IF;

  -- Ya viene: se respeta, solo se normaliza a minúsculas.
  IF NULLIF(btrim(COALESCE(NEW.payload->>'country_code', '')), '') IS NOT NULL THEN
    NEW.payload := NEW.payload || jsonb_build_object('country_code', lower(btrim(NEW.payload->>'country_code')));
    RETURN NEW;
  END IF;

  v_txt := NULLIF(COALESCE(NEW.payload->>'job_id', NEW.payload->>'job_posting_id', ''), '');
  IF v_txt IS NOT NULL AND v_txt ~ v_uuid_re THEN
    v_job := v_txt::uuid;
  ELSE
    v_txt := NULLIF(COALESCE(NEW.payload->>'application_id', ''), '');
    IF v_txt IS NOT NULL AND v_txt ~ v_uuid_re THEN
      SELECT ja.job_posting_id INTO v_job FROM public.job_applications ja WHERE ja.id = v_txt::uuid;
    END IF;
  END IF;
  IF v_job IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT lower(btrim(jp.country_code)) INTO v_cc FROM public.job_postings jp WHERE jp.id = v_job;
  IF v_cc IS NOT NULL AND v_cc <> '' THEN
    NEW.payload := NEW.payload || jsonb_build_object('country_code', v_cc);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.email_outbox_country_code() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_email_outbox_country_code ON public.email_outbox;
CREATE TRIGGER trg_email_outbox_country_code
  BEFORE INSERT ON public.email_outbox
  FOR EACH ROW EXECUTE FUNCTION public.email_outbox_country_code();

COMMENT ON FUNCTION public.email_outbox_country_code() IS
'Añade country_code (minúsculas, el de la oferta) al payload de cualquier correo que lleve job_id, job_posting_id o application_id. Así las plantillas construyen la URL canónica /<cc>/ofertas/<slug> sin que cada función que encola tenga que acordarse.';

-- -----------------------------------------------------------------------------
-- 3. S-8 (parte 1): bolsa_llamar_funcion acepta también company-review-ai
--    (resto idéntico a 20261034_programacion_cron.sql, sección 2)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bolsa_llamar_funcion(
  p_nombre text,
  p_cuerpo jsonb DEFAULT '{}'::jsonb
)
RETURNS bigint
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_secret text;
  v_id     bigint;
BEGIN
  -- Lista cerrada: esta función no sirve para llamar a otra cosa.
  IF p_nombre IS NULL OR p_nombre NOT IN ('moderate-job-posting', 'send-outbox', 'expire-job-postings', 'company-review-ai') THEN
    RAISE EXCEPTION 'BOLSA_FUNCION_NO_PERMITIDA: % no es una función programable', left(COALESCE(p_nombre, 'NULL'), 60)
      USING ERRCODE = '22023';
  END IF;

  SELECT s.decrypted_secret INTO v_secret
    FROM vault.decrypted_secrets s
   WHERE s.name = 'bolsa_cron_secret'
   ORDER BY s.created_at DESC
   LIMIT 1;

  IF v_secret IS NULL OR length(v_secret) < 16 THEN
    RAISE EXCEPTION 'BOLSA_CRON_SECRET_AUSENTE: crea el secreto bolsa_cron_secret en el vault (mínimo 16 caracteres); no se llama a %', p_nombre
      USING ERRCODE = '55000';
  END IF;

  SELECT net.http_post(
           url := 'https://djehzlzombqrzzuchcef.supabase.co/functions/v1/' || p_nombre,
           body := COALESCE(p_cuerpo, '{}'::jsonb),
           headers := jsonb_build_object(
             'Content-Type', 'application/json',
             'x-cron-secret', v_secret
           ),
           timeout_milliseconds := 15000
         )
    INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.bolsa_llamar_funcion(text, jsonb) FROM PUBLIC, anon, authenticated, service_role;

COMMENT ON FUNCTION public.bolsa_llamar_funcion(text, jsonb) IS
'Llama (POST, pg_net) a una Edge Function de la bolsa con la cabecera x-cron-secret leída del vault (bolsa_cron_secret). Solo moderate-job-posting, send-outbox, expire-job-postings y company-review-ai. Sin secreto no llama y falla (BOLSA_CRON_SECRET_AUSENTE). La ejecuta pg_cron o un trigger SECURITY DEFINER; nadie con sesión puede.';

-- -----------------------------------------------------------------------------
-- 4. S-1: moderación inmediata al pasar una oferta a AI_REVIEW
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.job_postings_moderacion_inmediata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Nada de aquí puede romper el envío de la oferta: sin pg_net, sin secreto en el
  -- vault o con la red caída se ignora y la recoge el cron de cada 5 minutos.
  BEGIN
    PERFORM public.bolsa_llamar_funcion('moderate-job-posting', jsonb_build_object('job_id', NEW.id));
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.job_postings_moderacion_inmediata() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_postings_moderacion_ins ON public.job_postings;
CREATE TRIGGER trg_job_postings_moderacion_ins
  AFTER INSERT ON public.job_postings
  FOR EACH ROW
  WHEN (NEW.status = 'AI_REVIEW')
  EXECUTE FUNCTION public.job_postings_moderacion_inmediata();

DROP TRIGGER IF EXISTS trg_job_postings_moderacion_upd ON public.job_postings;
CREATE TRIGGER trg_job_postings_moderacion_upd
  AFTER UPDATE ON public.job_postings
  FOR EACH ROW
  WHEN (NEW.status = 'AI_REVIEW' AND OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.job_postings_moderacion_inmediata();

-- -----------------------------------------------------------------------------
-- 5. S-4: avisos de candidatura. apply_to_job solo avisa al momento si la oferta
--    es de frecuencia inmediata; con resumen diario lo recoge queue_application_digests.
--    (resto idéntico a 20261032_correcciones_auditoria.sql, sección 10)
-- -----------------------------------------------------------------------------
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

  -- S4: menor de 16 (fecha ya guardada). Sin fecha no se bloquea: la pide LegalGate.
  IF v_profile.fecha_nacimiento IS NOT NULL AND public._edad_utc(v_profile.fecha_nacimiento) < 16 THEN
    RAISE EXCEPTION 'UNDERAGE: hay que tener al menos 16 años para inscribirse' USING ERRCODE = 'P0001';
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

  -- S1: condiciones de candidato vigentes aceptadas (si existe ese documento).
  -- El cliente debe llamar a registrar_aceptacion ANTES y esperar su resultado.
  IF public._aceptacion_pendiente(v_uid, 'terminos_candidato') THEN
    RAISE EXCEPTION 'ACCEPTANCE_REQUIRED: acepta las condiciones de candidato vigentes antes de inscribirte' USING ERRCODE = 'P0001';
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

  -- Preguntas ACTIVAS: obligatorias (is_required o imprescindibles) y knockout
  FOR v_q IN
    SELECT * FROM public.job_posting_questions
     WHERE job_posting_id = p_job_posting_id
       AND is_active
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
  -- S-4: el aviso individual solo sale si la oferta es de frecuencia inmediata (EACH);
  -- con resumen diario (DAILY) la candidatura la recoge queue_application_digests().
  IF v_status = 'NEW' THEN
    v_digest := lower(coalesce(v_job_json->>'notify_frequency', '')) ~ '^(daily|diari|digest|resumen)';
    IF NOT v_digest THEN
      FOREACH v_to IN ARRAY public.jobs_job_notify_emails(v_job_json, v_company.company_email) LOOP
        PERFORM public.jobs_enqueue_email(
          'application_received_company', v_to,
          jsonb_build_object(
            'application_id', v_app_id, 'job_posting_id', p_job_posting_id,
            'job_title', v_job.title, 'company_id', v_job.company_id,
            'candidate_name', v_profile.full_name, 'match_score', v_match,
            'digest', false),
          to_jsonb(v_company)->>'idioma', 5, now());
      END LOOP;
    END IF;
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
'Inscribe al usuario autenticado en una oferta PUBLISHED, vigente y de empresa APPROVED. Exige ser mayor de 16 (si hay fecha guardada), tener aceptada la versión vigente de terminos_candidato y consentimiento; responde las preguntas activas obligatorias, guarda la copia del perfil, descarta a NOT_QUALIFIED si falla una pregunta knockout y encola los avisos. Errores con código al inicio del mensaje: AUTH_REQUIRED, UNAUTHORIZED, UNDERAGE, JOB_NOT_AVAILABLE, ALREADY_APPLIED, ACCEPTANCE_REQUIRED, CONSENT_REQUIRED, REQUIRED_QUESTION_MISSING, COVER_LETTER_REQUIRED, COVER_LETTER_TOO_LONG, INVALID_ANSWERS.';

-- Resumen diario: UN correo application_digest por oferta y destinatario con las
-- candidaturas nuevas del último tramo 08:00 UTC -> 08:00 UTC (el tramo se calcula
-- de forma determinista a partir de la hora, así que llamarla dos veces el mismo
-- día no duplica). No se incluye el correo del candidato, solo su nombre. Solo
-- service_role / cron. Devuelve cuántos correos encoló. No envía nada.
CREATE OR REPLACE FUNCTION public.queue_application_digests()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_end    timestamptz;
  v_start  timestamptz;
  v_utc    timestamp := now() AT TIME ZONE 'UTC';
  v_queued integer := 0;
  v_rows   integer;
  j        record;
  v_mail   text;
  v_apps   jsonb;
  v_total  integer;
  v_payload jsonb;
BEGIN
  IF auth.role() IN ('anon', 'authenticated') THEN
    RAISE EXCEPTION 'FORBIDDEN: solo service_role' USING ERRCODE = '42501';
  END IF;

  -- Fin del tramo = el 08:00 UTC más reciente que ya pasó.
  v_end := (date_trunc('day', v_utc) + interval '8 hours') AT TIME ZONE 'UTC';
  IF v_end > now() THEN
    v_end := v_end - interval '1 day';
  END IF;
  v_start := v_end - interval '1 day';

  FOR j IN
    SELECT jp.id, jp.title, jp.slug, jp.company_id, lower(btrim(jp.country_code)) AS cc,
           to_jsonb(jp) AS jj, c.company_name, c.company_email, to_jsonb(c)->>'idioma' AS lang
      FROM public.job_postings jp
      JOIN public.companies c ON c.id = jp.company_id
     WHERE lower(coalesce(jp.notify_frequency, '')) ~ '^(daily|diari|digest|resumen)'
       AND EXISTS (SELECT 1 FROM public.job_applications ja
                    WHERE ja.job_posting_id = jp.id
                      AND ja.created_at >= v_start AND ja.created_at < v_end
                      AND NOT ja.descartada_auto)
     ORDER BY jp.id
  LOOP
    SELECT count(*)::integer,
           coalesce(jsonb_agg(jsonb_build_object(
                      'name', t.nombre,
                      'date', to_char(t.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD'),
                      'match_score', t.match_score)
                    ORDER BY t.match_score DESC NULLS LAST, t.created_at, t.id) FILTER (WHERE t.rn <= 20), '[]'::jsonb)
      INTO v_total, v_apps
      FROM (
        SELECT ja.id, ja.created_at, ja.match_score,
               -- Si el nombre guardado es un correo (altas antiguas), no se publica.
               CASE WHEN p.full_name LIKE '%@%' THEN '' ELSE coalesce(btrim(p.full_name), '') END AS nombre,
               row_number() OVER (ORDER BY ja.match_score DESC NULLS LAST, ja.created_at, ja.id) AS rn
          FROM public.job_applications ja
          LEFT JOIN public.profiles p ON p.id = ja.profile_id
         WHERE ja.job_posting_id = j.id
           AND ja.created_at >= v_start AND ja.created_at < v_end
           AND NOT ja.descartada_auto
      ) t;

    IF v_total = 0 THEN
      CONTINUE;
    END IF;

    v_payload := jsonb_build_object(
      'job_id', j.id, 'job_title', j.title, 'slug', j.slug,
      'company_id', j.company_id, 'company_name', j.company_name,
      'country_code', j.cc,
      'total', v_total, 'applications', v_apps,
      'period_from', v_start, 'period_to', v_end,
      'panel_path', '/company/jobs/applications',
      'dedupe_key', 'application_digest:' || j.id || ':' || to_char(v_end AT TIME ZONE 'UTC', 'YYYYMMDD'));

    FOREACH v_mail IN ARRAY public.jobs_job_notify_emails(j.jj, j.company_email) LOOP
      INSERT INTO public.email_outbox (kind, to_email, payload, lang, priority, send_after)
      VALUES ('application_digest', lower(btrim(v_mail)), v_payload,
              lower(left(coalesce(nullif(btrim(j.lang), ''), 'es'), 2)), 8, now())
      ON CONFLICT ((payload->>'dedupe_key'), to_email) WHERE (payload->>'dedupe_key') IS NOT NULL
      DO NOTHING;
      GET DIAGNOSTICS v_rows = ROW_COUNT;
      v_queued := v_queued + v_rows;
    END LOOP;
  END LOOP;

  RETURN v_queued;
END;
$$;
REVOKE ALL ON FUNCTION public.queue_application_digests() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_application_digests() TO service_role;

COMMENT ON FUNCTION public.queue_application_digests() IS
'Encola un correo application_digest por oferta (frecuencia DAILY) y destinatario con las candidaturas nuevas del tramo 08:00-08:00 UTC: nombre, fecha y afinidad de cada una (máx. 20), total y enlace al panel. Sin correo del candidato. Idempotente por dedupe_key. Solo service_role (cron/Edge send-outbox con {"digests":true}).';

-- -----------------------------------------------------------------------------
-- 6. S-5: alertas de ofertas
-- -----------------------------------------------------------------------------
ALTER TABLE public.job_alert_subscriptions
  ADD COLUMN IF NOT EXISTS unsubscribe_token uuid NOT NULL DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS job_alert_subscriptions_token_key
  ON public.job_alert_subscriptions (unsubscribe_token);

COMMENT ON COLUMN public.job_alert_subscriptions.unsubscribe_token IS
'Token secreto de baja (va en el enlace de cada correo de alerta). Lo lee el dueño; nadie puede escribirlo (los GRANT por columna no lo incluyen).';

-- Varias alertas por perfil: se quita el UNIQUE por perfil y se limita a 5 con un trigger.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT k.conname
      FROM pg_constraint k
     WHERE k.conrelid = 'public.job_alert_subscriptions'::regclass
       AND k.contype = 'u'
       AND k.conkey = ARRAY[(SELECT a.attnum FROM pg_attribute a
                              WHERE a.attrelid = 'public.job_alert_subscriptions'::regclass AND a.attname = 'profile_id')]
  LOOP
    EXECUTE format('ALTER TABLE public.job_alert_subscriptions DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS job_alert_subscriptions_profile_idx
  ON public.job_alert_subscriptions (profile_id);

COMMENT ON TABLE public.job_alert_subscriptions IS
'Alertas de ofertas de un candidato (hasta 5 por perfil). active = casilla marcada. last_sent_at = última vez que queue_job_alerts encoló un aviso. unsubscribe_token: baja con un clic (unsubscribe_job_alerts).';

-- Tope de 5 por perfil (con candado para que dos altas a la vez no lo sobrepasen) y
-- país por defecto: una alerta nueva SIN ningún filtro (la que crea la casilla
-- alertas_novedades del registro) toma el país del perfil, si lo tiene.
CREATE OR REPLACE FUNCTION public.job_alert_subscriptions_tope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cc text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('jas:' || NEW.profile_id::text));
  IF (SELECT count(*) FROM public.job_alert_subscriptions s WHERE s.profile_id = NEW.profile_id) >= 5 THEN
    RAISE EXCEPTION 'ALERT_LIMIT: máximo 5 alertas por perfil' USING ERRCODE = '23514';
  END IF;

  IF NULLIF(btrim(COALESCE(NEW.country, '')), '') IS NULL
     AND cardinality(COALESCE(NEW.categories, '{}')) = 0
     AND cardinality(COALESCE(NEW.keywords, '{}')) = 0 THEN
    SELECT upper(btrim(p.country_code)) INTO v_cc FROM public.profiles p WHERE p.id = NEW.profile_id;
    IF v_cc IS NOT NULL AND v_cc <> '' THEN
      NEW.country := v_cc;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.job_alert_subscriptions_tope() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_alert_subscriptions_tope ON public.job_alert_subscriptions;
CREATE TRIGGER trg_job_alert_subscriptions_tope
  BEFORE INSERT ON public.job_alert_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.job_alert_subscriptions_tope();

-- Baja con un clic desde el correo: el token es el secreto (uuid aleatorio). Devuelve
-- true si el token corresponde a una alerta (ya estuviera inactiva o no) y false si
-- no (token inventado o nulo). Ejecutable por anon: es el enlace del correo.
CREATE OR REPLACE FUNCTION public.unsubscribe_job_alerts(p_token uuid)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_token IS NULL THEN
    RETURN false;
  END IF;
  UPDATE public.job_alert_subscriptions
     SET active = false
   WHERE unsubscribe_token = p_token;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.unsubscribe_job_alerts(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_job_alerts(uuid) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.unsubscribe_job_alerts(uuid) IS
'Desactiva la alerta cuyo unsubscribe_token coincide (enlace de baja de los correos). Ejecutable por anon. true = el token existe; false = no existe.';

-- Avisos de alertas: hasta 8 ofertas con title, slug, country_code y company_name, y el token de baja.
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
             lower(btrim(coalesce(to_jsonb(jp)->>'country_code', jp.location_country, ''))) AS country
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
                     'company_name', t.company_name, 'country_code', t.country, 'country', t.country,
                     'published_at', t.published_at) ORDER BY t.published_at DESC), '[]'::jsonb)
              FROM (SELECT * FROM m ORDER BY published_at DESC LIMIT 8) t)
      INTO v_total, v_jobs;

    IF v_total > 0 THEN
      PERFORM public.jobs_enqueue_email(
        'job_alert', s.p_email,
        jsonb_build_object(
          'profile_id', s.profile_id, 'frequency', s.frequency,
          'total', v_total, 'jobs', v_jobs,
          'unsubscribe_token', s.unsubscribe_token,
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
'Encola en email_outbox un aviso por alerta activa con ofertas nuevas (por categoría, país y palabras): hasta 8 ofertas {title, slug, country_code, company_name, ...}, el total y el unsubscribe_token de la alerta. Idempotente. Llamar desde cron o una Edge Function con service_role. No envía.';

-- -----------------------------------------------------------------------------
-- 7. S-6: listado público v2 con orden «Más afines»
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.search_public_jobs_v2(text, text, text, text, text, numeric, int, text, text, int, int, int);

CREATE OR REPLACE FUNCTION public.search_public_jobs_v2(
  p_country            text    DEFAULT NULL,
  p_category           text    DEFAULT NULL,
  p_work_mode          text    DEFAULT NULL,
  p_contract           text    DEFAULT NULL,
  p_schedule           text    DEFAULT NULL,
  p_min_salary         numeric DEFAULT NULL,   -- mensual, en la moneda local del pais
  p_posted_within_days integer DEFAULT NULL,   -- 1 (24 h), 7, 30
  p_search             text    DEFAULT NULL,   -- puesto / palabra / empresa
  p_city               text    DEFAULT NULL,
  p_limit              integer DEFAULT 20,
  p_offset             integer DEFAULT 0,
  p_max_experience_years integer DEFAULT NULL, -- ofertas que piden <= X años o ninguno
  p_sort               text    DEFAULT 'recent' -- 'recent' | 'affinity' (solo con sesión de candidato)
) RETURNS TABLE (
  id uuid, title varchar, slug varchar, company_id uuid, company_name varchar, company_logo_url text,
  country_code text, location_city varchar, work_mode varchar, is_remote boolean,
  contract_types text[], schedule text, category text, category2 text, vacancies integer,
  experience_years integer, summary text,
  salary_min integer, salary_max integer, salary_currency varchar, salary_period varchar, salary_mode text,
  show_salary boolean, published_at timestamptz, application_deadline timestamptz,
  already_applied boolean, total_count bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
#variable_conflict use_column
DECLARE
  v_search text := NULLIF(btrim(COALESCE(p_search, '')), '');
  v_city   text := NULLIF(btrim(COALESCE(p_city, '')), '');
  v_limit  integer := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_uid    uuid := auth.uid();
  v_in     jsonb;
  v_aff    boolean := false;
BEGIN
  IF v_search IS NOT NULL THEN
    v_search := '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;
  IF v_city IS NOT NULL THEN
    v_city := '%' || replace(replace(replace(v_city, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  -- S-6: «Más afines» solo con sesión y perfil; en cualquier otro caso, «Más recientes».
  IF lower(btrim(COALESCE(p_sort, ''))) = 'affinity' AND v_uid IS NOT NULL THEN
    v_in := public.jobs_profile_match_inputs(v_uid);
    v_aff := v_in IS NOT NULL;
  END IF;

  RETURN QUERY
  WITH m AS (
    SELECT
      jp.id AS o_id, jp.title AS o_title, jp.slug AS o_slug, jp.company_id AS o_company_id,
      c.company_name AS o_company_name, c.logo_url AS o_logo,
      jp.country_code AS o_cc, jp.location_city AS o_city, jp.work_mode AS o_wm, jp.is_remote AS o_remote,
      jp.contract_types AS o_ct, jp.schedule AS o_sched, jp.category AS o_cat, jp.category2 AS o_cat2,
      jp.vacancies AS o_vac, jp.experience_years AS o_exp,
      left(btrim(regexp_replace(regexp_replace(COALESCE(jp.description, ''), '<[^>]*>', ' ', 'g'), '\s+', ' ', 'g')), 280) AS o_summary,
      CASE WHEN jp.show_salary THEN jp.salary_min END AS o_smin,
      CASE WHEN jp.show_salary THEN jp.salary_max END AS o_smax,
      CASE WHEN jp.show_salary THEN jp.salary_currency END AS o_scur,
      CASE WHEN jp.show_salary THEN jp.salary_period END AS o_sper,
      CASE WHEN jp.show_salary THEN jp.salary_mode END AS o_smode,
      COALESCE(jp.show_salary, false) AS o_show,
      jp.published_at AS o_pub, jp.application_deadline AS o_dead,
      (v_uid IS NOT NULL AND EXISTS (
         SELECT 1 FROM public.job_applications ja
         WHERE ja.job_posting_id = jp.id AND ja.profile_id = v_uid AND ja.status <> 'WITHDRAWN')) AS o_applied,
      count(*) OVER () AS o_total,
      CASE WHEN v_aff THEN to_jsonb(jp) END AS o_json
    FROM public.job_postings jp
    JOIN public.companies c ON c.id = jp.company_id
    WHERE jp.status = 'PUBLISHED'
      AND jp.published_at IS NOT NULL
      AND (jp.application_deadline IS NULL OR jp.application_deadline > now())
      AND c.status = 'APPROVED'
      -- F5: una oferta remota sin países permitidos (NULL o vacío) es para cualquiera.
      AND (p_country IS NULL
           OR jp.country_code = upper(p_country)
           OR (jp.work_mode = 'REMOTE'
               AND (COALESCE(cardinality(jp.allowed_countries), 0) = 0
                    OR upper(p_country) = ANY (jp.allowed_countries))))
      AND (p_category IS NULL OR jp.category = p_category OR jp.category2 = p_category)
      AND (p_work_mode IS NULL OR jp.work_mode = p_work_mode)
      AND (p_contract IS NULL OR p_contract = ANY (COALESCE(jp.contract_types, '{}')))
      AND (p_schedule IS NULL OR jp.schedule = p_schedule)
      AND (p_min_salary IS NULL OR (
            COALESCE(jp.salary_max, jp.salary_min) IS NOT NULL
            AND (CASE jp.salary_period
                   WHEN 'HOURLY' THEN COALESCE(jp.salary_max, jp.salary_min) * 160.0
                   WHEN 'YEARLY' THEN COALESCE(jp.salary_max, jp.salary_min) / 12.0
                   ELSE COALESCE(jp.salary_max, jp.salary_min)::numeric END) >= p_min_salary))
      -- F6: pide como mucho X años de experiencia (o no pide ninguna).
      AND (p_max_experience_years IS NULL
           OR jp.experience_years IS NULL
           OR jp.experience_years <= p_max_experience_years)
      AND (p_posted_within_days IS NULL OR jp.published_at >= now() - make_interval(days => p_posted_within_days))
      AND (v_search IS NULL
           OR jp.title ILIKE v_search OR jp.description ILIKE v_search OR c.company_name ILIKE v_search)
      AND (v_city IS NULL OR jp.location_city ILIKE v_city)
    ORDER BY jp.published_at DESC, jp.id
    -- «Recientes» solo necesita las primeras offset+limit; «Afines» puntúa las 500 más recientes.
    LIMIT CASE WHEN v_aff THEN 500 ELSE v_offset + v_limit END
  ), s AS (
    SELECT m.*,
           CASE WHEN v_aff THEN (public.jobs_score_job(m.o_json, v_in)->>'total')::int END AS o_score
      FROM m
  )
  SELECT s.o_id, s.o_title, s.o_slug, s.o_company_id, s.o_company_name, s.o_logo,
         s.o_cc, s.o_city, s.o_wm, s.o_remote,
         s.o_ct, s.o_sched, s.o_cat, s.o_cat2, s.o_vac, s.o_exp, s.o_summary,
         s.o_smin, s.o_smax, s.o_scur, s.o_sper, s.o_smode,
         s.o_show, s.o_pub, s.o_dead, s.o_applied, s.o_total
    FROM s
   ORDER BY s.o_score DESC NULLS LAST, s.o_pub DESC, s.o_id
   LIMIT v_limit OFFSET v_offset;
END;
$$;
REVOKE ALL ON FUNCTION public.search_public_jobs_v2(text, text, text, text, text, numeric, int, text, text, int, int, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_jobs_v2(text, text, text, text, text, numeric, int, text, text, int, int, int, text)
  TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.search_public_jobs_v2(text, text, text, text, text, numeric, int, text, text, int, int, int, text) IS
'Listado público de ofertas PUBLISHED de empresas APPROVED. p_sort = recent (por defecto, más recientes) o affinity (más afines al perfil del llamador, misma puntuación que get_recommended_jobs, sobre las 500 más recientes que cumplen los filtros); affinity sin sesión de candidato con perfil cae a recent. total_count es el total real de coincidencias.';

-- -----------------------------------------------------------------------------
-- 8. S-7: condiciones_publicacion
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT k.conname
      FROM pg_constraint k
     WHERE k.conrelid = 'public.documentos_legales'::regclass
       AND k.contype = 'c'
       AND pg_get_constraintdef(k.oid) LIKE '%terminos_candidato%'
  LOOP
    EXECUTE format('ALTER TABLE public.documentos_legales DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE public.documentos_legales ADD CONSTRAINT documentos_legales_tipo_check
  CHECK (tipo IN ('terminos_candidato', 'terminos_empleador', 'condiciones_publicacion', 'privacidad', 'cookies'));

-- Semilla v1.0 (BORRADOR pendiente de abogado). Vigente desde 2026-10-29 como el resto.
-- Es la primera versión de ese tipo e idioma, así que no necesita los 15 días de antelación.
INSERT INTO public.documentos_legales
  (tipo, version, idioma, titulo, texto, audiencia, requiere_aceptacion, casillas_obligatorias, borrador, vigente_desde)
VALUES
('condiciones_publicacion', '1.0', 'es', 'Condiciones de publicación de ofertas',
$txt$BORRADOR v1.0 – texto genérico provisional, pendiente de revisión por un abogado.

1. Quién publica. Estas condiciones las acepta quien publica ofertas en nombre de una empresa verificada en YourCVPassport (servicio de ISEIE Innovation School, S.L.). Contacto: support@yourcvpassport.com.
2. Ofertas reales. Cada oferta debe corresponder a un puesto real y disponible, con datos veraces sobre la empresa, el puesto, las condiciones y la remuneración. No se admiten ofertas simuladas, para captar datos ni duplicadas.
3. No discriminación. Las ofertas no pueden excluir ni preferir por motivos de sexo, edad, origen, religión, discapacidad, orientación sexual o cualquier otra causa discriminatoria, salvo requisito profesional legítimo y justificado.
4. Sin cobros al candidato. Ninguna oferta puede exigir pagos, depósitos ni compras a quien se inscribe.
5. Legalidad. El contenido debe cumplir la normativa laboral y de protección de datos aplicable en el país del puesto.
6. Revisión. Toda oferta pasa por una revisión automática y, si hace falta, manual antes de publicarse. La plataforma puede pedir cambios, rechazar, pausar, retirar o caducar ofertas que incumplan estas condiciones.
7. Datos de los candidatos. Los datos de quienes se inscriben solo pueden usarse para el proceso de selección de esa oferta, conforme al encargo del tratamiento aceptado en las condiciones de empleador.
8. Vigencia. Una oferta se publica por un plazo máximo de 60 días y caduca al llegar su fecha de cierre.
9. Cambios. Las nuevas versiones se avisarán con al menos 15 días de antelación; hasta aceptarlas no se podrán enviar nuevas ofertas a revisión.$txt$,
'empleador', true, ARRAY['ofertas_reales_no_discriminatorias'], true, '2026-10-29 00:00:00+00'),

('condiciones_publicacion', '1.0', 'en', 'Job posting terms',
$txt$DRAFT v1.0 – generic provisional text, pending review by a lawyer.

1. Who publishes. These terms are accepted by whoever posts job offers on behalf of a verified company on YourCVPassport (a service of ISEIE Innovation School, S.L.). Contact: support@yourcvpassport.com.
2. Real offers. Every offer must correspond to a real, available position, with truthful information about the company, the role, the conditions and the pay. Fake, data-harvesting or duplicated offers are not allowed.
3. No discrimination. Offers must not exclude or prefer anyone on grounds of sex, age, origin, religion, disability, sexual orientation or any other discriminatory reason, except for a legitimate and justified occupational requirement.
4. No charges to candidates. No offer may require payments, deposits or purchases from applicants.
5. Legality. The content must comply with the labour and data-protection rules that apply in the country of the position.
6. Review. Every offer goes through an automatic review and, if needed, a manual one before it is published. The platform may request changes, reject, pause, withdraw or expire offers that breach these terms.
7. Candidate data. The data of applicants may only be used for the selection process of that offer, under the data-processing agreement accepted in the employer terms.
8. Duration. An offer is published for a maximum of 60 days and expires on its closing date.
9. Changes. New versions will be notified at least 15 days in advance; until accepted, new offers cannot be sent for review.$txt$,
'empleador', true, ARRAY['ofertas_reales_no_discriminatorias'], true, '2026-10-29 00:00:00+00')
ON CONFLICT (tipo, version, idioma) DO NOTHING;

-- legal_encolar_aviso y legal_publicar_version aceptan el tipo nuevo (resto idéntico a 20261033, secciones 5 y 6)
CREATE OR REPLACE FUNCTION public.legal_encolar_aviso(p_tipo text, p_version text)
RETURNS integer
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dedupe text;
  v_n      integer := 0;
BEGIN
  IF NOT (COALESCE(auth.role(), '') = 'service_role' OR COALESCE(public.current_user_is_admin(), false)) THEN
    RAISE EXCEPTION 'FORBIDDEN: solo un administrador o el servicio pueden encolar avisos legales'
      USING ERRCODE = '42501';
  END IF;
  IF p_tipo IS NULL OR p_tipo NOT IN ('terminos_candidato', 'terminos_empleador', 'condiciones_publicacion', 'privacidad', 'cookies') THEN
    RAISE EXCEPTION 'LEGAL_INVALIDO: tipo de documento no válido' USING ERRCODE = '22023';
  END IF;
  IF NULLIF(btrim(COALESCE(p_version, '')), '') IS NULL THEN
    RAISE EXCEPTION 'LEGAL_INVALIDO: indica la versión' USING ERRCODE = '22023';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.documentos_legales d WHERE d.tipo = p_tipo AND d.version = p_version) THEN
    RAISE EXCEPTION 'LEGAL_NO_ENCONTRADO: no existe % versión %', p_tipo, p_version USING ERRCODE = 'P0002';
  END IF;

  v_dedupe := 'legal:' || p_tipo || ':' || p_version;

  WITH cand AS (
    SELECT DISTINCT ON (lower(COALESCE(p.email, u.email)))
           lower(COALESCE(p.email, u.email)) AS email,
           d.idioma, d.titulo, d.vigente_desde
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    CROSS JOIN LATERAL (SELECT public._legal_idioma_destino(p_tipo, p.registro_idioma) AS idm) l
    JOIN public.documentos_legales d
      ON d.tipo = p_tipo AND d.version = p_version AND d.idioma = l.idm
     AND d.requiere_aceptacion AND d.borrador = false
    WHERE p.is_active IS NOT FALSE
      AND NULLIF(btrim(COALESCE(p.email, u.email, '')), '') IS NOT NULL
      AND (
        d.audiencia = 'todos'
        OR (d.audiencia = 'candidato' AND COALESCE(lower(p.role), 'professional') = 'professional')
        OR (d.audiencia = 'empleador' AND (
              lower(p.role) = 'employer'
              OR EXISTS (SELECT 1 FROM public.company_users cu WHERE cu.user_id = p.id)))
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.aceptaciones a
        WHERE a.user_id = p.id AND a.tipo = d.tipo AND a.version = d.version
      )
      AND NOT EXISTS (
        SELECT 1 FROM public.email_outbox o
        WHERE o.payload->>'dedupe_key' = v_dedupe
          AND o.to_email = lower(COALESCE(p.email, u.email))
      )
    ORDER BY lower(COALESCE(p.email, u.email))
    LIMIT 5000
  ), ins AS (
    INSERT INTO public.email_outbox (kind, to_email, payload, lang, priority, send_after)
    SELECT 'legal_version_notice', c.email,
           jsonb_build_object(
             'tipo', p_tipo,
             'version', p_version,
             'titulo', c.titulo,
             'idioma', c.idioma,
             'vigente_desde', to_char(c.vigente_desde AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
             'dedupe_key', v_dedupe),
           c.idioma, 6, now()
    FROM cand c
    ON CONFLICT ((payload->>'dedupe_key'), to_email) WHERE (payload->>'dedupe_key') IS NOT NULL
    DO NOTHING
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_n FROM ins;

  RETURN COALESCE(v_n, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.legal_encolar_aviso(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.legal_encolar_aviso(text, text) TO authenticated, service_role;
COMMENT ON FUNCTION public.legal_encolar_aviso(text, text) IS
'Encola (email_outbox, kind legal_version_notice, prioridad 6) el aviso de una versión de condiciones a cada usuario afectado que no la haya aceptado. Solo admin o service_role. Idempotente por correo; máx. 5000 por llamada (devuelve cuántos): repetir mientras devuelva 5000. No envía nada.';

CREATE OR REPLACE FUNCTION public.legal_publicar_version(
  p_tipo text,
  p_version text,
  p_idioma text,
  p_titulo text,
  p_texto text,
  p_vigente_desde timestamptz,
  p_casillas text[] DEFAULT NULL,
  p_urgente boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_service   boolean := COALESCE(auth.role(), '') = 'service_role';
  v_tipo      text := btrim(COALESCE(p_tipo, ''));
  v_version   text := btrim(COALESCE(p_version, ''));
  v_idioma    text := lower(btrim(COALESCE(p_idioma, '')));
  v_titulo    text := btrim(COALESCE(p_titulo, ''));
  v_texto     text := btrim(COALESCE(p_texto, ''));
  v_audiencia text;
  v_requiere  boolean;
  v_casillas  text[];
  v_clave     text;
  v_primera   boolean;
  v_id        uuid;
  v_n         integer := 0;
BEGIN
  IF NOT (v_service OR COALESCE(public.current_user_is_admin(), false)) THEN
    RAISE EXCEPTION 'FORBIDDEN: solo un administrador puede publicar versiones legales'
      USING ERRCODE = '42501';
  END IF;
  IF COALESCE(p_urgente, false) AND NOT v_service THEN
    RAISE EXCEPTION 'FORBIDDEN: la publicación urgente (sin los 15 días de antelación) solo la hace el servicio'
      USING ERRCODE = '42501';
  END IF;

  IF v_tipo NOT IN ('terminos_candidato', 'terminos_empleador', 'condiciones_publicacion', 'privacidad', 'cookies') THEN
    RAISE EXCEPTION 'LEGAL_INVALIDO: tipo de documento no válido' USING ERRCODE = '22023';
  END IF;
  IF length(v_version) NOT BETWEEN 1 AND 20 THEN
    RAISE EXCEPTION 'LEGAL_INVALIDO: la versión debe tener entre 1 y 20 caracteres' USING ERRCODE = '22023';
  END IF;
  IF v_idioma !~ '^[a-z]{2,3}$' THEN
    RAISE EXCEPTION 'LEGAL_INVALIDO: idioma no válido (usa es, en...)' USING ERRCODE = '22023';
  END IF;
  IF v_titulo = '' OR length(v_titulo) > 200 THEN
    RAISE EXCEPTION 'LEGAL_INVALIDO: el título es obligatorio (máx. 200 caracteres)' USING ERRCODE = '22023';
  END IF;
  IF v_texto = '' OR length(v_texto) > 200000 THEN
    RAISE EXCEPTION 'LEGAL_INVALIDO: el texto es obligatorio (máx. 200000 caracteres)' USING ERRCODE = '22023';
  END IF;
  IF p_vigente_desde IS NULL THEN
    RAISE EXCEPTION 'LEGAL_INVALIDO: indica la fecha de entrada en vigor' USING ERRCODE = '22023';
  END IF;

  IF EXISTS (SELECT 1 FROM public.documentos_legales d
              WHERE d.tipo = v_tipo AND d.version = v_version AND d.idioma = v_idioma) THEN
    RAISE EXCEPTION 'VERSION_DUPLICADA: ya existe % % (%); publica una versión con otro número', v_tipo, v_version, v_idioma
      USING ERRCODE = '23505';
  END IF;

  v_audiencia := CASE v_tipo WHEN 'terminos_candidato' THEN 'candidato'
                             WHEN 'terminos_empleador' THEN 'empleador'
                             WHEN 'condiciones_publicacion' THEN 'empleador'
                             ELSE 'todos' END;
  v_requiere := v_tipo <> 'cookies';

  -- Casillas obligatorias: las que se pasan o, si no, las de la versión anterior.
  IF p_casillas IS NOT NULL THEN
    v_casillas := p_casillas;
  ELSE
    SELECT d.casillas_obligatorias INTO v_casillas
      FROM public.documentos_legales d
     WHERE d.tipo = v_tipo AND d.idioma = v_idioma
     ORDER BY d.vigente_desde DESC, d.created_at DESC
     LIMIT 1;
  END IF;
  v_casillas := COALESCE(v_casillas, '{}');
  IF cardinality(v_casillas) > 20 THEN
    RAISE EXCEPTION 'LEGAL_INVALIDO: demasiadas casillas obligatorias (máx. 20)' USING ERRCODE = '22023';
  END IF;
  FOREACH v_clave IN ARRAY v_casillas LOOP
    IF v_clave IS NULL OR v_clave !~ '^[a-z0-9_]{1,60}$' THEN
      RAISE EXCEPTION 'LEGAL_INVALIDO: clave de casilla no válida (a-z, 0-9 y _)' USING ERRCODE = '22023';
    END IF;
  END LOOP;

  -- Antelación (el trigger la vuelve a exigir si alguien inserta por otro camino).
  v_primera := NOT EXISTS (SELECT 1 FROM public.documentos_legales d WHERE d.tipo = v_tipo AND d.idioma = v_idioma);
  IF v_requiere AND p_vigente_desde < now() + interval '15 days'
     AND NOT v_primera AND NOT COALESCE(p_urgente, false) THEN
    RAISE EXCEPTION 'ANTELACION_INSUFICIENTE: una versión nueva de % debe entrar en vigor al menos 15 días después de publicarse (vigente_desde >= %)',
      v_tipo, to_char((now() + interval '15 days') AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"')
      USING ERRCODE = '22023';
  END IF;

  IF COALESCE(p_urgente, false) THEN
    PERFORM set_config('app.legal_urgente', 'on', true);
  END IF;

  INSERT INTO public.documentos_legales
    (tipo, version, idioma, titulo, texto, audiencia, requiere_aceptacion, casillas_obligatorias, borrador, vigente_desde)
  VALUES
    (v_tipo, v_version, v_idioma, v_titulo, v_texto, v_audiencia, v_requiere, v_casillas, false, p_vigente_desde)
  RETURNING id INTO v_id;

  PERFORM set_config('app.legal_urgente', 'off', true);

  IF v_requiere THEN
    v_n := public.legal_encolar_aviso(v_tipo, v_version);
  END IF;

  RETURN jsonb_build_object(
    'id', v_id,
    'tipo', v_tipo,
    'version', v_version,
    'idioma', v_idioma,
    'vigente_desde', p_vigente_desde,
    'encolados', v_n,
    'puede_haber_mas', v_n >= 5000
  );
END;
$$;
REVOKE ALL ON FUNCTION public.legal_publicar_version(text, text, text, text, text, timestamptz, text[], boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.legal_publicar_version(text, text, text, text, text, timestamptz, text[], boolean) TO authenticated, service_role;
COMMENT ON FUNCTION public.legal_publicar_version(text, text, text, text, text, timestamptz, text[], boolean) IS
'Publica una versión nueva de un texto legal (solo admin): exige 15 días de antelación (salvo primera versión de ese tipo/idioma o p_urgente desde service_role), la inserta como no borrador y encola el aviso a los usuarios afectados (legal_encolar_aviso). Con p_casillas NULL hereda las de la versión anterior.';

-- _job_submit: además de terminos_empleador, exige condiciones_publicacion SI hay una versión vigente.
-- (resto idéntico a 20261032_correcciones_auditoria.sql, sección 9)
CREATE OR REPLACE FUNCTION public._job_submit(p_job_id uuid, p_uid uuid, p_duration_days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job      record;
  v_company  record;
  v_err      text[] := '{}';
  v_flags    text[];
  v_new      text;
  v_text     text;
  v_deadline timestamptz;
  v_days     integer := LEAST(GREATEST(COALESCE(p_duration_days, 30), 1), 60);
  v_mail     text;
  v_birth    date;
BEGIN
  IF p_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: hace falta una sesion de usuario' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO v_job FROM public.job_postings WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (
       SELECT 1 FROM public.company_users cu
       WHERE cu.company_id = v_job.company_id AND cu.user_id = p_uid
         AND cu.role IN ('OWNER', 'ADMIN', 'MEMBER')) THEN
    RAISE EXCEPTION 'Unauthorized: la oferta no existe o no eres miembro de su empresa' USING ERRCODE = '42501';
  END IF;

  -- S4: menor de 16 (fecha ya guardada). Sin fecha no se bloquea: la pide LegalGate.
  SELECT p.fecha_nacimiento INTO v_birth FROM public.profiles p WHERE p.id = p_uid;
  IF v_birth IS NOT NULL AND public._edad_utc(v_birth) < 16 THEN
    RAISE EXCEPTION 'UNDERAGE: hay que tener al menos 16 anos para publicar ofertas' USING ERRCODE = '42501';
  END IF;

  SELECT c.id, c.status, c.company_name, c.credit_balance INTO v_company
  FROM public.companies c WHERE c.id = v_job.company_id;
  IF v_company.status IS DISTINCT FROM 'APPROVED' THEN
    RAISE EXCEPTION 'COMPANY_NOT_APPROVED: la empresa no esta verificada (estado: %)', COALESCE(v_company.status, 'desconocido')
      USING ERRCODE = '42501';
  END IF;

  IF v_job.status NOT IN ('DRAFT', 'REJECTED') THEN
    RAISE EXCEPTION 'INVALID_STATE: solo se envia a revision un borrador o una oferta rechazada (estado: %)', v_job.status
      USING ERRCODE = '55000';
  END IF;

  -- S1: condiciones de empleador vigentes aceptadas (si existe ese documento).
  IF public._aceptacion_pendiente(p_uid, 'terminos_empleador') THEN
    RAISE EXCEPTION 'ACCEPTANCE_REQUIRED: acepta las condiciones de empleador vigentes antes de enviar la oferta a revision'
      USING ERRCODE = '42501';
  END IF;

  -- S-7: condiciones de publicación vigentes aceptadas (si existe ese documento; si no, no se exige).
  IF public._aceptacion_pendiente(p_uid, 'condiciones_publicacion') THEN
    RAISE EXCEPTION 'ACCEPTANCE_REQUIRED: acepta las condiciones de publicación vigentes antes de enviar la oferta a revision'
      USING ERRCODE = '42501';
  END IF;

  -- Validaciones (se devuelven todas juntas)
  IF char_length(btrim(COALESCE(v_job.title, ''))) = 0 THEN
    v_err := array_append(v_err, 'title_required'::text);
  ELSIF char_length(v_job.title) > 100 THEN
    v_err := array_append(v_err, 'title_too_long'::text);
  END IF;
  IF char_length(regexp_replace(v_job.title, '[^[:alpha:]]', '', 'g')) >= 8
     AND v_job.title = upper(v_job.title) AND v_job.title <> lower(v_job.title) THEN
    v_err := array_append(v_err, 'title_all_caps'::text);
  END IF;
  IF v_job.title ~ '[\U0001F300-\U0001FAFF☀-➿]' THEN
    v_err := array_append(v_err, 'title_emoji'::text);
  END IF;

  v_text := btrim(regexp_replace(regexp_replace(replace(COALESCE(v_job.description, ''), '&nbsp;', ' '), '<[^>]*>', ' ', 'g'), '\s+', ' ', 'g'));
  IF char_length(v_text) < 300 THEN
    v_err := array_append(v_err, 'description_too_short'::text);
  END IF;
  IF COALESCE(v_job.description, '') ~* '(<\s*(script|iframe|object|embed)|javascript\s*:|\son[a-z]+\s*=)' THEN
    v_err := array_append(v_err, 'description_unsafe'::text);
  END IF;

  IF v_job.country_code IS NULL THEN
    v_err := array_append(v_err, 'country_required'::text);
  ELSIF NOT EXISTS (SELECT 1 FROM public.countries WHERE code = v_job.country_code AND active) THEN
    v_err := array_append(v_err, 'country_inactive'::text);
  END IF;
  IF COALESCE(btrim(v_job.category), '') = '' THEN
    v_err := array_append(v_err, 'category_required'::text);
  END IF;
  IF v_job.work_mode IS NULL THEN
    v_err := array_append(v_err, 'work_mode_required'::text);
  ELSIF v_job.work_mode IN ('ONSITE', 'HYBRID') AND COALESCE(btrim(v_job.location_city), '') = '' THEN
    v_err := array_append(v_err, 'city_required'::text);
  END IF;
  IF COALESCE(array_length(v_job.contract_types, 1), 0) = 0 THEN
    v_err := array_append(v_err, 'contract_types_required'::text);
  END IF;
  IF v_job.schedule IS NULL THEN
    v_err := array_append(v_err, 'schedule_required'::text);
  END IF;
  IF COALESCE(v_job.vacancies, 0) < 1 THEN
    v_err := array_append(v_err, 'vacancies_invalid'::text);
  END IF;

  v_deadline := COALESCE(v_job.application_deadline, now() + make_interval(days => v_days));
  IF v_deadline <= now() + interval '1 hour' THEN
    v_err := array_append(v_err, 'deadline_past'::text);
  ELSIF v_deadline > now() + interval '60 days' + interval '1 minute' THEN
    v_err := array_append(v_err, 'deadline_too_far'::text);
  END IF;

  IF array_length(v_err, 1) > 0 THEN
    RAISE EXCEPTION 'JOB_INVALID: %', array_to_string(v_err, ', ')
      USING ERRCODE = '22023', DETAIL = array_to_string(v_err, ',');
  END IF;

  v_flags := public._job_precheck(v_job.title, v_job.description);
  v_new := CASE WHEN COALESCE(array_length(v_flags, 1), 0) > 0 THEN 'MANUAL_REVIEW' ELSE 'AI_REVIEW' END;

  PERFORM set_config('app.status_source', 'submit', true);
  PERFORM set_config('app.status_reason',
    CASE WHEN v_new = 'MANUAL_REVIEW' THEN 'filtro previo: ' || array_to_string(v_flags, ', ') ELSE '' END, true);

  UPDATE public.job_postings
     SET status = v_new,
         application_deadline = v_deadline,
         credits_cost = 0,
         review_reason = CASE WHEN v_new = 'MANUAL_REVIEW' THEN 'filtro previo: ' || array_to_string(v_flags, ', ') ELSE NULL END,
         reviewed_at = NULL,
         reviewed_by = NULL
   WHERE id = p_job_id;

  -- Aviso a support@ SOLO si el filtro previo ya la manda a revision manual.
  IF v_new = 'MANUAL_REVIEW' THEN
    PERFORM public._outbox_enqueue(
      'job_manual_review', 'support@yourcvpassport.com',
      jsonb_build_object('job_id', v_job.id, 'title', v_job.title, 'company_id', v_job.company_id,
                         'company_name', v_company.company_name, 'reasons', to_jsonb(v_flags)),
      'es', 3, now(), 'job_manual_review:' || v_job.id || ':' || floor(extract(epoch FROM now()))::bigint);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'job_id', v_job.id,
    'status', v_new,
    'flags', to_jsonb(v_flags),
    'application_deadline', v_deadline,
    'credits_used', 0,
    'new_balance', v_company.credit_balance
  );
END;
$$;
REVOKE ALL ON FUNCTION public._job_submit(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 9. S-9: aviso de duplicados antes de registrar una empresa
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.company_duplicate_hint(p_tax_id text, p_company_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tax   text := upper(regexp_replace(COALESCE(p_tax_id, ''), '[[:space:].\-]', '', 'g'));
  v_mail  text := lower(btrim(COALESCE(p_company_email, '')));
  v_tax_taken  boolean := false;
  v_mail_taken boolean := false;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: inicia sesión' USING ERRCODE = '42501';
  END IF;
  IF length(v_tax) > 40 OR length(v_mail) > 255 THEN
    RAISE EXCEPTION 'INVALID_INPUT: valor demasiado largo' USING ERRCODE = '22023';
  END IF;

  IF v_tax <> '' THEN
    SELECT EXISTS (SELECT 1 FROM public.companies c
                    WHERE upper(regexp_replace(COALESCE(c.tax_id, ''), '[[:space:].\-]', '', 'g')) = v_tax)
      INTO v_tax_taken;
  END IF;
  IF v_mail <> '' THEN
    SELECT EXISTS (SELECT 1 FROM public.companies c
                    WHERE lower(btrim(COALESCE(c.company_email, ''))) = v_mail)
      INTO v_mail_taken;
  END IF;

  -- Solo dos booleanos: nunca de quién es la empresa existente.
  RETURN jsonb_build_object('tax_id_taken', v_tax_taken, 'email_taken', v_mail_taken);
END;
$$;
REVOKE ALL ON FUNCTION public.company_duplicate_hint(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.company_duplicate_hint(text, text) TO authenticated, service_role;

COMMENT ON FUNCTION public.company_duplicate_hint(text, text) IS
'Avisa, antes de insertar, si el NIF/CIF (sin espacios, puntos ni guiones, sin distinguir mayúsculas) o el correo de empresa ya están registrados. Devuelve solo {tax_id_taken, email_taken}: no revela de quién. Solo con sesión.';

-- -----------------------------------------------------------------------------
-- 10. S-8 (parte 2): trabajos programados nuevos (solo si pg_cron está habilitado)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_nombre text;
BEGIN
  IF to_regnamespace('cron') IS NULL THEN
    RAISE NOTICE 'pg_cron no está habilitado (aplica 20261034 antes): no se programan bolsa-empresas ni bolsa-resumenes';
    RETURN;
  END IF;

  FOREACH v_nombre IN ARRAY ARRAY['bolsa-empresas', 'bolsa-resumenes'] LOOP
    IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = v_nombre) THEN
      PERFORM cron.unschedule(v_nombre);
    END IF;
  END LOOP;

  PERFORM cron.schedule('bolsa-empresas', '*/10 * * * *',
    $cmd$select public.bolsa_llamar_funcion('company-review-ai', '{"sweep":true}'::jsonb)$cmd$);
  PERFORM cron.schedule('bolsa-resumenes', '0 8 * * *',
    $cmd$select public.bolsa_llamar_funcion('send-outbox', '{"digests":true}'::jsonb)$cmd$);
END $$;

-- -----------------------------------------------------------------------------
-- 11. Comprobaciones finales (abortan la migración si fallan)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'search_public_jobs_v2') <> 1
     OR (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'apply_to_job') <> 1
     OR (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'bolsa_llamar_funcion') <> 1 THEN
    RAISE EXCEPTION 'quedan sobrecargas duplicadas de search_public_jobs_v2 / apply_to_job / bolsa_llamar_funcion';
  END IF;
  IF has_function_privilege('anon', 'public.queue_application_digests()', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.queue_application_digests()', 'EXECUTE')
     OR has_function_privilege('anon', 'public.company_duplicate_hint(text,text)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.bolsa_llamar_funcion(text,jsonb)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.bolsa_llamar_funcion(text,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'privilegios de ejecucion demasiado abiertos en las RPC nuevas';
  END IF;
  IF NOT has_function_privilege('anon', 'public.unsubscribe_job_alerts(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'unsubscribe_job_alerts debe poder ejecutarla anon (enlace de baja del correo)';
  END IF;
  IF has_column_privilege('authenticated', 'public.job_alert_subscriptions', 'unsubscribe_token', 'UPDATE')
     OR has_column_privilege('authenticated', 'public.job_alert_subscriptions', 'unsubscribe_token', 'INSERT')
     OR has_table_privilege('anon', 'public.job_alert_subscriptions', 'SELECT') THEN
    RAISE EXCEPTION 'unsubscribe_token no debe poder escribirse ni leerse por anon';
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
