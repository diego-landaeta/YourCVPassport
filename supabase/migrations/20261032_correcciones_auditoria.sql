-- =============================================================================
-- Bolsa de empleo: correcciones de la auditoría del 29/10/2026
-- =============================================================================
--
-- ORDEN: va DESPUÉS de las cuatro anteriores y no edita ninguna.
--   20261028_cerrar_email_queue.sql
--   20261029_legal_aceptaciones_idioma.sql   (fase 1)
--   20261030_ofertas_fase2.sql               (fase 2)
--   20261031_candidaturas_fase3.sql          (fase 3 + alertas)
--   20261032_correcciones_auditoria.sql      (ESTA)
-- Reaplicable: CREATE OR REPLACE / ADD ... IF NOT EXISTS / DROP ... IF EXISTS.
-- Producción hoy tiene 0 empresas, 0 ofertas y 0 candidaturas: no hay datos que
-- migrar; aun así todo es aditivo salvo las firmas que se reemplazan (abajo).
--
-- QUÉ HACE (entre paréntesis, el hallazgo de la auditoría)
--   S1  apply_to_job exige tener aceptada la versión VIGENTE de terminos_candidato
--       y _job_submit (publicar / enviar a revisión) la de terminos_empleador.
--       Misma lógica que documentos_pendientes() (idioma de registro, si no
--       español; coincidencia por tipo + versión). Si no existe ningún documento
--       vigente de ese tipo, NO se exige (para no bloquear si faltan textos).
--       Error con prefijo ACCEPTANCE_REQUIRED.
--   S2  job_moderation_hash(uuid): md5 de TODOS los campos moderados (título,
--       descripción, requisitos, responsabilidades, beneficios, deseable,
--       habilidades, application_url/email/instructions y departamento),
--       normalizados. get_job_moderation_hash(uuid): RPC solo admin/service_role.
--       moderar_oferta(..., p_expected_hash): si al PUBLICAR el hash actual no es
--       el esperado -> HASH_MISMATCH y la oferta se queda en revisión. El trigger
--       de protección devuelve a AI_REVIEW cualquier cambio de un miembro en
--       CUALQUIERA de esos campos sobre una oferta PUBLISHED (y reanudar una
--       PAUSED cuyo texto cambió); reviewed_text_hash se calcula con la nueva
--       función al aprobar.
--   S4  set_my_birth_date(date): único camino para fijar la fecha de nacimiento
--       de un usuario que no la tiene (OAuth, cuentas antiguas). Devuelve
--       {status: ok | underage | invalid | already_set}; la edad se calcula en UTC
--       en el servidor; un menor de 16 NO se guarda. apply_to_job y _job_submit
--       devuelven UNDERAGE si la fecha guardada es menor de 16. Un trigger impide
--       que un usuario (no admin) escriba profiles.fecha_nacimiento a mano.
--   S5  registrar_aceptacion: la IP sale de cf-connecting-ip, luego x-real-ip y,
--       si no, del ÚLTIMO elemento de x-forwarded-for (el que añade el proxy de
--       confianza; el primero lo controla el cliente). Guarda además el
--       `contexto` y, en contexto 'registro', la hora que declaró el alta
--       (app_metadata.registro_aceptacion.aceptado_en) en la columna nueva
--       aceptaciones.aceptado_declarado_en. La IP y la hora de la fila (created_at)
--       son las del PRIMER ACCESO CON SESIÓN, no las del alta: es lo que prueba esa
--       fila; la hora del alta queda en aceptado_declarado_en.
--   S7  CHECK char_length(description) <= 30000 (NOT VALID si hubiera filas
--       antiguas) y el trigger rechaza títulos de más de 100 caracteres al salir
--       de DRAFT (TITLE_TOO_LONG).
--   S8  job_posting_questions: solo OWNER / ADMIN / MEMBER escriben (un VIEWER no);
--       no se pueden borrar ni modificar preguntas con respuestas (solo ocultarlas
--       con is_active = false, columna nueva); en ofertas PUBLISHED / PAUSED no se
--       tocan las preguntas (QUESTIONS_LOCKED: pasar a borrador y reenviar a
--       revisión). Las ocultas no salen en el público ni en apply_to_job.
--   F2  Política SELECT de admin en job_postings y job_posting_questions (la cola de
--       revisión). job_applications ya tenía «Admin lee candidaturas».
--   F3  El CHECK de question_type admite NUMBER.
--   F4  El cierre de una oferta puede ser como máximo now() + 61 días (antes se medía
--       desde published_at: «Renovar» y editar una publicada antigua fallaban con
--       DEADLINE_TOO_FAR).
--   F5  search_public_jobs_v2: una oferta REMOTE sin allowed_countries (NULL o
--       vacío) sale en CUALQUIER país.
--   F6  search_public_jobs_v2 gana p_max_experience_years (ofertas que piden <= X
--       años o ninguno). Se elimina la firma de 11 argumentos y se crea la de 12.
--   F8  update_application_status gana p_clear_rating (borra la valoración; antes
--       rating = NULL no borraba por el coalesce). La vista my_job_applications
--       muestra una NOT_QUALIFIED abierta por la empresa como SENT, nunca VIEWED.
--   F9  send_application_message(application_id, 'rejected' | 'interview'): encola
--       en email_outbox (kind application_message) el correo al candidato; solo
--       OWNER/ADMIN/MEMBER de la empresa; máx. 1 por candidatura y plantilla cada
--       24 h; queda en el historial de la candidatura como una fila con
--       from_status = to_status y la anotación `message:<plantilla>` (columna nueva
--       job_application_status_history.note; la lee la empresa/admin por la tabla,
--       y get_application_history la sigue ocultando al candidato).
--   Columnas nuevas: email_outbox.last_error, aceptaciones.aceptado_declarado_en,
--       job_posting_questions.is_active, job_application_status_history.note.
--
-- FIRMAS QUE CAMBIAN (se borra la anterior para no dejar dos sobrecargas: PostgREST
-- no sabría cuál llamar)
--   moderar_oferta(uuid,text,text)                      -> (uuid,text,text,text)
--   update_application_status(uuid,uuid,uuid,varchar,text,int) -> (..., int, boolean)
--   search_public_jobs_v2(11 argumentos)                -> 12 argumentos
--
-- ERRORES NUEVOS (prefijo al principio del mensaje)
--   ACCEPTANCE_REQUIRED, UNDERAGE, HASH_MISMATCH, TITLE_TOO_LONG, QUESTIONS_LOCKED,
--   QUESTION_HAS_ANSWERS, INVALID_TEMPLATE, MESSAGE_ALREADY_SENT.
--
-- COMPROBACIONES ANTES DE APLICAR (SQL editor; la propia migración aborta si
-- faltan las anteriores)
--   select to_regclass('public.aceptaciones'), to_regclass('public.email_outbox');  -- no NULL
--   select count(*) from public.job_postings where char_length(description) > 30000; -- 0
--   select count(*) from public.job_postings where status in ('PUBLISHED','PAUSED');  -- hoy 0
--
-- DESPUÉS DE APLICAR
--   select public.get_job_moderation_hash(id) from public.job_postings limit 1; -- como admin
--   select count(*) from pg_proc where proname = 'moderar_oferta';              -- 1
--   select count(*) from pg_proc where proname = 'search_public_jobs_v2';       -- 1
--
-- VUELTA ATRÁS (en este orden)
--   drop function if exists public.search_public_jobs_v2(text,text,text,text,text,numeric,int,text,text,int,int,int);
--     y volver a ejecutar el CREATE de la sección 12 de 20261030_ofertas_fase2.sql
--   drop function if exists public.moderar_oferta(uuid,text,text,text);
--     y volver a ejecutar la sección 10 de 20261030_ofertas_fase2.sql
--   drop function if exists public.update_application_status(uuid,uuid,uuid,varchar,text,int,boolean);
--     y la sección 9 de 20261031_candidaturas_fase3.sql
--   drop function if exists public.send_application_message(uuid,text);
--   drop function if exists public.set_my_birth_date(date);
--   drop function if exists public.get_job_moderation_hash(uuid), public.job_moderation_hash(uuid);
--   drop trigger if exists trg_profiles_proteger_fecha_nacimiento on public.profiles;
--   drop trigger if exists trg_job_posting_questions_proteger on public.job_posting_questions;
--   alter table public.job_postings drop constraint if exists job_postings_description_max_length;
--   Volver a ejecutar las secciones de 20261029/30/31 que redefinen
--   registrar_aceptacion, apply_to_job, _job_submit y
--   job_postings_proteger_publicacion. Las columnas nuevas se pueden dejar (inertes).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Comprobación previa
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_missing text[] := '{}';
  v_obj text;
BEGIN
  FOREACH v_obj IN ARRAY ARRAY[
    'public.profiles', 'public.companies', 'public.company_users', 'public.job_postings',
    'public.job_posting_questions', 'public.job_applications', 'public.job_application_status_history',
    'public.documentos_legales', 'public.aceptaciones', 'public.email_outbox'
  ] LOOP
    IF to_regclass(v_obj) IS NULL THEN
      v_missing := v_missing || v_obj;
    END IF;
  END LOOP;
  IF to_regprocedure('public.apply_to_job(uuid,uuid,text,jsonb,boolean,text)') IS NULL THEN
    v_missing := v_missing || 'public.apply_to_job (20261031)';
  END IF;
  IF to_regprocedure('public._job_submit(uuid,uuid,integer)') IS NULL THEN
    v_missing := v_missing || 'public._job_submit (20261030)';
  END IF;
  IF to_regprocedure('public.jobs_enqueue_email(text,text,jsonb,text,integer,timestamptz)') IS NULL THEN
    v_missing := v_missing || 'public.jobs_enqueue_email (20261031)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'fecha_nacimiento') THEN
    v_missing := v_missing || 'profiles.fecha_nacimiento (20261029)';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = 'public' AND table_name = 'job_postings' AND column_name = 'reviewed_text_hash') THEN
    v_missing := v_missing || 'job_postings.reviewed_text_hash (20261030)';
  END IF;
  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION 'ABORTADO: faltan objetos de las migraciones 20261029-20261031: %', array_to_string(v_missing, ', ');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. Columnas nuevas
-- -----------------------------------------------------------------------------
ALTER TABLE public.email_outbox
  ADD COLUMN IF NOT EXISTS last_error text;
COMMENT ON COLUMN public.email_outbox.last_error IS
'Último error del envío (send-outbox). NULL si nunca falló o ya salió.';

ALTER TABLE public.aceptaciones
  ADD COLUMN IF NOT EXISTS aceptado_declarado_en timestamptz;
COMMENT ON COLUMN public.aceptaciones.aceptado_declarado_en IS
'Hora que declaró el alta (app_metadata.registro_aceptacion.aceptado_en, escrita por la Edge signup con service_role). Solo en contexto registro. created_at e ip son los del primer acceso con sesión.';

ALTER TABLE public.job_posting_questions
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN public.job_posting_questions.is_active IS
'false = pregunta oculta: no se muestra ni se evalúa en nuevas inscripciones. Es la única forma de retirar una pregunta que ya tiene respuestas.';
-- (el GRANT de columna a anon/authenticated va en la sección 8)

ALTER TABLE public.job_application_status_history
  ADD COLUMN IF NOT EXISTS note text;
COMMENT ON COLUMN public.job_application_status_history.note IS
'Anotación de un evento que no cambia el estado (from_status = to_status), p. ej. message:rejected. Solo la ven empresa y admin.';

-- -----------------------------------------------------------------------------
-- 2. S4: edad. Utilidad, RPC set_my_birth_date y protección de la columna
-- -----------------------------------------------------------------------------
-- Edad en años cumplidos, calculada con la fecha UTC del servidor.
CREATE OR REPLACE FUNCTION public._edad_utc(p_birth date)
RETURNS integer
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT CASE WHEN p_birth IS NULL THEN NULL
              ELSE date_part('year', age((now() AT TIME ZONE 'UTC')::date, p_birth))::integer END;
$$;
REVOKE ALL ON FUNCTION public._edad_utc(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._edad_utc(date) TO service_role;

CREATE OR REPLACE FUNCTION public.set_my_birth_date(p_birth_date date)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid     uuid := auth.uid();
  v_current date;
  v_today   date := (now() AT TIME ZONE 'UTC')::date;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: inicia sesión' USING ERRCODE = '42501';
  END IF;

  SELECT p.fecha_nacimiento INTO v_current
    FROM public.profiles p WHERE p.id = v_uid FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND: no tienes perfil' USING ERRCODE = 'P0002';
  END IF;

  -- Una fecha ya guardada no se cambia por aquí (la corrige soporte).
  IF v_current IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'already_set');
  END IF;

  IF p_birth_date IS NULL OR p_birth_date < DATE '1900-01-01' OR p_birth_date > v_today THEN
    RETURN jsonb_build_object('status', 'invalid');
  END IF;

  -- Menor de 16: se informa, pero NO se guarda el dato.
  IF public._edad_utc(p_birth_date) < 16 THEN
    RETURN jsonb_build_object('status', 'underage');
  END IF;

  UPDATE public.profiles SET fecha_nacimiento = p_birth_date WHERE id = v_uid;
  RETURN jsonb_build_object('status', 'ok');
END;
$$;
REVOKE ALL ON FUNCTION public.set_my_birth_date(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_my_birth_date(date) TO authenticated, service_role;
COMMENT ON FUNCTION public.set_my_birth_date(date) IS
'Fija la fecha de nacimiento del usuario autenticado SOLO si no tiene ninguna. Devuelve {status: ok | underage | invalid | already_set}. Edad en UTC en el servidor; un menor de 16 no se guarda.';

-- Un usuario no puede escribir fecha_nacimiento directamente (si no, saltaría
-- el control de edad): solo la RPC (SECURITY DEFINER), un admin o service_role.
CREATE OR REPLACE FUNCTION public.profiles_proteger_fecha_nacimiento()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF current_user NOT IN ('anon', 'authenticated') THEN
    RETURN NEW;
  END IF;
  IF current_user = 'authenticated' AND public.current_user_is_admin() THEN
    RETURN NEW;
  END IF;
  IF (TG_OP = 'INSERT' AND NEW.fecha_nacimiento IS NOT NULL)
     OR (TG_OP = 'UPDATE' AND NEW.fecha_nacimiento IS DISTINCT FROM OLD.fecha_nacimiento) THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: la fecha de nacimiento solo se fija con set_my_birth_date'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.profiles_proteger_fecha_nacimiento() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_proteger_fecha_nacimiento ON public.profiles;
CREATE TRIGGER trg_profiles_proteger_fecha_nacimiento
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_proteger_fecha_nacimiento();

-- -----------------------------------------------------------------------------
-- 3. S1 + S5: aceptaciones
-- -----------------------------------------------------------------------------
-- ¿Tiene el usuario pendiente de aceptar la versión vigente de un tipo? Misma
-- elección de documento que documentos_pendientes() (idioma de registro, si no
-- español) y misma comparación (tipo + versión). Sin documento vigente = false.
CREATE OR REPLACE FUNCTION public._aceptacion_pendiente(p_uid uuid, p_tipo text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM (
      SELECT dl.tipo, dl.version,
             row_number() OVER (
               ORDER BY (dl.idioma = COALESCE(lower((SELECT p.registro_idioma FROM public.profiles p WHERE p.id = p_uid)), 'es')) DESC,
                        (dl.idioma = 'es') DESC,
                        dl.idioma
             ) AS rn
      FROM public.documentos_legales dl
      WHERE dl.tipo = p_tipo
        AND dl.requiere_aceptacion
        AND public.documento_legal_vigente(dl.id)
    ) d
    WHERE d.rn = 1
      AND NOT EXISTS (
        SELECT 1 FROM public.aceptaciones a
        WHERE a.user_id = p_uid AND a.tipo = d.tipo AND a.version = d.version
      )
  );
$$;
REVOKE ALL ON FUNCTION public._aceptacion_pendiente(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._aceptacion_pendiente(uuid, text) TO service_role;

-- registrar_aceptacion con la IP bien elegida y la hora declarada del alta.
CREATE OR REPLACE FUNCTION public.registrar_aceptacion(
  p_documento_ids uuid[],
  p_casillas jsonb DEFAULT '{}'::jsonb,
  p_contexto text DEFAULT 'registro',
  p_oferta_id uuid DEFAULT NULL,
  p_company_id uuid DEFAULT NULL
)
RETURNS uuid[]
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_email text;
  v_headers json;
  v_xff text;
  v_xff_arr text[];
  v_raw_ip text;
  v_ip inet;
  v_ua text;
  v_doc record;
  v_clave text;
  v_ids uuid[] := '{}';
  v_new uuid;
  v_oferta_company uuid;
  v_declared timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'NO_AUTENTICADO: inicia sesión para aceptar las condiciones' USING ERRCODE = '28000';
  END IF;

  IF p_documento_ids IS NULL OR cardinality(p_documento_ids) = 0 OR cardinality(p_documento_ids) > 10 THEN
    RAISE EXCEPTION 'ACEPTACION_INVALIDA: indica entre 1 y 10 documentos' USING ERRCODE = '22023';
  END IF;

  IF p_contexto IS NULL OR p_contexto NOT IN ('registro', 'inscripcion', 'publicacion', 'nueva_version') THEN
    RAISE EXCEPTION 'ACEPTACION_INVALIDA: contexto no válido' USING ERRCODE = '22023';
  END IF;

  IF p_casillas IS NULL OR jsonb_typeof(p_casillas) <> 'object' THEN
    RAISE EXCEPTION 'ACEPTACION_INVALIDA: casillas debe ser un objeto {clave: true|false}' USING ERRCODE = '22023';
  END IF;
  IF EXISTS (SELECT 1 FROM jsonb_each(p_casillas) e WHERE jsonb_typeof(e.value) <> 'boolean')
     OR (SELECT count(*) FROM jsonb_object_keys(p_casillas)) > 30 THEN
    RAISE EXCEPTION 'ACEPTACION_INVALIDA: las casillas solo admiten valores true/false (máx. 30)' USING ERRCODE = '22023';
  END IF;

  -- Empresa: el usuario debe pertenecer a ella (o haberla registrado él).
  IF p_company_id IS NOT NULL THEN
    IF NOT (public.is_company_member(p_company_id)
            OR EXISTS (SELECT 1 FROM public.companies c WHERE c.id = p_company_id AND c.created_by = v_uid)) THEN
      RAISE EXCEPTION 'ACEPTACION_INVALIDA: no perteneces a esa empresa' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- Oferta: debe existir; para publicar, el usuario debe ser de la empresa de la oferta.
  IF p_oferta_id IS NOT NULL THEN
    SELECT j.company_id INTO v_oferta_company FROM public.job_postings j WHERE j.id = p_oferta_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ACEPTACION_INVALIDA: la oferta no existe' USING ERRCODE = '22023';
    END IF;
    IF p_contexto = 'publicacion' AND NOT public.is_company_member(v_oferta_company) THEN
      RAISE EXCEPTION 'ACEPTACION_INVALIDA: no perteneces a la empresa de esa oferta' USING ERRCODE = '42501';
    END IF;
  END IF;

  -- IP y navegador: SOLO de las cabeceras de la petición (PostgREST las expone
  -- en el parámetro de sesión request.headers). Nunca de un argumento.
  -- Orden de confianza de la IP: cf-connecting-ip (Cloudflare), x-real-ip y, si no,
  -- el ÚLTIMO elemento de x-forwarded-for: lo añade el proxy de confianza más
  -- cercano; el primero lo puede escribir el propio cliente.
  BEGIN
    v_headers := NULLIF(current_setting('request.headers', true), '')::json;
  EXCEPTION WHEN OTHERS THEN
    v_headers := NULL;
  END;
  v_xff := NULLIF(btrim(COALESCE(v_headers->>'x-forwarded-for', '')), '');
  IF v_xff IS NOT NULL THEN
    v_xff_arr := string_to_array(v_xff, ',');
  END IF;
  v_raw_ip := COALESCE(
    NULLIF(btrim(v_headers->>'cf-connecting-ip'), ''),
    NULLIF(btrim(v_headers->>'x-real-ip'), ''),
    CASE WHEN v_xff_arr IS NOT NULL THEN NULLIF(btrim(v_xff_arr[cardinality(v_xff_arr)]), '') END
  );
  BEGIN
    v_ip := v_raw_ip::inet;
    IF v_ip IS NOT NULL THEN
      v_ip := set_masklen(v_ip, CASE family(v_ip) WHEN 4 THEN 32 ELSE 128 END);
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_ip := NULL;
  END;
  v_ua := left(NULLIF(btrim(v_headers->>'user-agent'), ''), 500);

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = v_uid;

  -- Hora que declaró el alta (solo en contexto registro). La escribe la Edge
  -- signup con service_role en app_metadata (el usuario no puede tocarla). Se
  -- ignora si es futura, anterior a la creación de la cuenta (con margen) o no
  -- tiene formato de fecha.
  IF p_contexto = 'registro' THEN
    BEGIN
      SELECT (to_jsonb(u)->'raw_app_meta_data'->'registro_aceptacion'->>'aceptado_en')::timestamptz
        INTO v_declared
        FROM auth.users u WHERE u.id = v_uid;
      IF v_declared IS NOT NULL
         AND (v_declared > now() + interval '5 minutes'
              OR v_declared < COALESCE((SELECT (to_jsonb(u2)->>'created_at')::timestamptz FROM auth.users u2 WHERE u2.id = v_uid), now()) - interval '1 day') THEN
        v_declared := NULL;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_declared := NULL;
    END;
  END IF;

  FOR v_doc IN
    SELECT d.* FROM public.documentos_legales d
    WHERE d.id = ANY (p_documento_ids)
  LOOP
    IF NOT public.documento_legal_vigente(v_doc.id) THEN
      RAISE EXCEPTION 'DOCUMENTO_NO_VIGENTE: % % (%) no es la versión en vigor', v_doc.tipo, v_doc.version, v_doc.idioma
        USING ERRCODE = '22023';
    END IF;

    FOREACH v_clave IN ARRAY v_doc.casillas_obligatorias LOOP
      IF COALESCE((p_casillas->>v_clave)::boolean, false) IS NOT TRUE THEN
        RAISE EXCEPTION 'CASILLA_OBLIGATORIA: falta marcar "%" para aceptar %', v_clave, v_doc.tipo
          USING ERRCODE = '22023';
      END IF;
    END LOOP;

    INSERT INTO public.aceptaciones
      (user_id, user_email, documento_id, tipo, version, casillas, ip, user_agent, contexto, oferta_id, company_id, aceptado_declarado_en)
    VALUES
      (v_uid, v_email, v_doc.id, v_doc.tipo, v_doc.version, p_casillas, v_ip, v_ua, p_contexto, p_oferta_id, p_company_id, v_declared)
    RETURNING id INTO v_new;
    v_ids := v_ids || v_new;
  END LOOP;

  IF cardinality(v_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_documento_ids) x) THEN
    RAISE EXCEPTION 'DOCUMENTO_NO_ENCONTRADO: algún documento no existe' USING ERRCODE = '22023';
  END IF;

  RETURN v_ids;
END;
$$;
REVOKE ALL ON FUNCTION public.registrar_aceptacion(uuid[], jsonb, text, uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_aceptacion(uuid[], jsonb, text, uuid, uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.registrar_aceptacion(uuid[], jsonb, text, uuid, uuid) IS
'Registra la aceptación (una fila por documento) del usuario autenticado. Valida que el documento sea la versión vigente y que las casillas obligatorias vengan a true. IP y navegador salen de request.headers, nunca del cliente: cf-connecting-ip, luego x-real-ip y, si no, el ÚLTIMO elemento de x-forwarded-for (el que añade el proxy de confianza). Valor probatorio: created_at e ip son los del primer acceso con sesión (en contexto registro, la hora del alta declarada por la Edge signup queda en aceptado_declarado_en); contexto indica dónde se aceptó. Devuelve los ids creados.';

-- -----------------------------------------------------------------------------
-- 4. S2: hash de moderación
-- -----------------------------------------------------------------------------
-- Texto normalizado de un campo (cadena o lista): espacios colapsados y recortados;
-- en listas se descartan los elementos vacíos y se conserva el orden.
CREATE OR REPLACE FUNCTION public._job_norm_field(j jsonb, k text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE jsonb_typeof(j -> k)
    WHEN 'string' THEN btrim(regexp_replace(j ->> k, '\s+', ' ', 'g'))
    WHEN 'array' THEN COALESCE((
      SELECT string_agg(s.t, E'\x1e' ORDER BY s.ord)
      FROM (
        SELECT btrim(regexp_replace(a.x, '\s+', ' ', 'g')) AS t, a.ord
        FROM jsonb_array_elements_text(j -> k) WITH ORDINALITY AS a(x, ord)
      ) s
      WHERE s.t <> ''), '')
    ELSE ''
  END;
$$;

-- md5 de TODOS los campos moderados de una oferta (to_jsonb de la fila). Cada
-- campo lleva su longitud delante para que dos combinaciones distintas no puedan
-- dar la misma cadena.
CREATE OR REPLACE FUNCTION public._job_moderation_hash_json(j jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT md5(string_agg(length(f.v)::text || ':' || f.v, E'\x1f' ORDER BY u.ord))
  FROM unnest(ARRAY[
    'title', 'description', 'requirements', 'responsibilities', 'benefits', 'nice_to_have',
    'required_skills', 'optional_skills', 'application_url', 'application_email',
    'application_instructions', 'department'
  ]) WITH ORDINALITY AS u(k, ord)
  CROSS JOIN LATERAL (SELECT public._job_norm_field(j, u.k) AS v) f;
$$;
-- Puras y sin datos sensibles: las llama el trigger con el rol de quien edita (un
-- miembro con sesion: authenticated); anon no puede escribir ofertas.
REVOKE ALL ON FUNCTION public._job_norm_field(jsonb, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public._job_moderation_hash_json(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public._job_norm_field(jsonb, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public._job_moderation_hash_json(jsonb) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.job_moderation_hash(p_job_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public._job_moderation_hash_json(to_jsonb(jp)) FROM public.job_postings jp WHERE jp.id = p_job_id;
$$;
REVOKE ALL ON FUNCTION public.job_moderation_hash(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.job_moderation_hash(uuid) TO service_role;
COMMENT ON FUNCTION public.job_moderation_hash(uuid) IS
'md5 de todos los campos que revisa la moderación (título, descripción, requisitos, responsabilidades, beneficios, deseable, habilidades, application_url/email/instructions y departamento), normalizados. Interna: la lee get_job_moderation_hash.';

CREATE OR REPLACE FUNCTION public.get_job_moderation_hash(p_job_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (COALESCE(auth.role(), '') = 'service_role' OR COALESCE(public.current_user_is_admin(), false)) THEN
    RAISE EXCEPTION 'FORBIDDEN: solo un administrador o el servicio de revision puede leer el hash' USING ERRCODE = '42501';
  END IF;
  RETURN public.job_moderation_hash(p_job_id);
END;
$$;
REVOKE ALL ON FUNCTION public.get_job_moderation_hash(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_job_moderation_hash(uuid) TO authenticated, service_role;
COMMENT ON FUNCTION public.get_job_moderation_hash(uuid) IS
'Hash del texto moderado de una oferta (solo admin / service_role). La revisión lo lee al EMPEZAR y lo pasa como p_expected_hash a moderar_oferta: si la empresa editó mientras tanto, HASH_MISMATCH.';

-- -----------------------------------------------------------------------------
-- 5. Trigger de protección de ofertas (S2 + S7 + F4)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.job_postings_proteger_publicacion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_old  text;
  v_new  text;
  v_hash text;
BEGIN
  -- Publicar es gratis: el coste es siempre 0, lo escriba quien lo escriba.
  NEW.credits_cost := 0;
  v_hash := public._job_moderation_hash_json(to_jsonb(NEW));

  -- S7: un título de más de 100 caracteres no puede salir de DRAFT (para cualquier rol;
  -- las filas antiguas no se tocan si no cambian de estado ni de título).
  IF COALESCE(NEW.status, 'DRAFT') <> 'DRAFT' AND char_length(COALESCE(NEW.title, '')) > 100
     AND (TG_OP = 'INSERT' OR OLD.status = 'DRAFT' OR NEW.title IS DISTINCT FROM OLD.title) THEN
    RAISE EXCEPTION 'TITLE_TOO_LONG: el titulo no puede superar 100 caracteres'
      USING ERRCODE = '22023';
  END IF;

  -- Si cambia el cierre, el aviso de «caduca en 3 dias» vuelve a ser posible.
  IF TG_OP = 'UPDATE' AND NEW.application_deadline IS DISTINCT FROM OLD.application_deadline THEN
    NEW.expires_notice_sent_at := NULL;
  END IF;

  -- service_role, postgres y las RPC SECURITY DEFINER (current_user = propietario)
  -- y los admin con sesion: pueden mover estados.
  IF current_user NOT IN ('anon', 'authenticated')
     OR (current_user = 'authenticated' AND public.current_user_is_admin()) THEN
    IF NEW.status = 'PUBLISHED' THEN
      IF NEW.published_at IS NULL THEN
        NEW.published_at := now();
      END IF;
      NEW.reviewed_text_hash := v_hash;   -- el texto publicado por ellos queda aprobado
    END IF;
    RETURN NEW;
  END IF;

  -- ---- A partir de aqui: anon / authenticated sin ser admin ----
  IF TG_OP = 'INSERT' THEN
    IF COALESCE(NEW.status, 'DRAFT') <> 'DRAFT' THEN
      RAISE EXCEPTION 'PUBLISH_REQUIRES_REVIEW: la oferta se crea como borrador y se envia a revision con submit_job_for_review'
        USING ERRCODE = '42501';
    END IF;
    NEW.status := 'DRAFT';
    NEW.slug := NULL;                 -- lo genera el trigger de slug
    NEW.published_at := NULL;
    NEW.views_count := 0;
    NEW.applications_count := 0;
    NEW.review_reason := NULL;
    NEW.reviewed_at := NULL;
    NEW.reviewed_by := NULL;
    NEW.reviewed_text_hash := NULL;
    NEW.closed_by := NULL;
    NEW.closed_at := NULL;
    NEW.expires_notice_sent_at := NULL;
    IF NEW.application_deadline IS NOT NULL AND NEW.application_deadline > now() + interval '61 days' THEN
      RAISE EXCEPTION 'DEADLINE_TOO_FAR: el cierre no puede superar 60 dias'
        USING ERRCODE = '22023';
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.company_id IS DISTINCT FROM OLD.company_id
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.published_at IS DISTINCT FROM OLD.published_at
     OR NEW.views_count IS DISTINCT FROM OLD.views_count
     OR NEW.applications_count IS DISTINCT FROM OLD.applications_count
     OR NEW.review_reason IS DISTINCT FROM OLD.review_reason
     OR NEW.reviewed_at IS DISTINCT FROM OLD.reviewed_at
     OR NEW.reviewed_by IS DISTINCT FROM OLD.reviewed_by
     OR NEW.reviewed_text_hash IS DISTINCT FROM OLD.reviewed_text_hash THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: empresa, fecha de publicacion, contadores y datos de revision de la oferta no se editan'
      USING ERRCODE = '42501';
  END IF;
  NEW.slug := OLD.slug;
  NEW.expires_notice_sent_at := CASE
    WHEN NEW.application_deadline IS DISTINCT FROM OLD.application_deadline THEN NULL
    ELSE OLD.expires_notice_sent_at END;
  NEW.closed_by := OLD.closed_by;
  NEW.closed_at := OLD.closed_at;

  v_old := OLD.status;
  v_new := COALESCE(NEW.status, v_old);
  NEW.status := v_new;

  IF v_new IS DISTINCT FROM v_old THEN
    IF v_old IN ('AI_REVIEW', 'MANUAL_REVIEW') THEN
      RAISE EXCEPTION 'IN_REVIEW: una oferta en revision no puede cambiar de estado hasta que se resuelva'
        USING ERRCODE = '42501';
    END IF;
    IF v_new NOT IN ('DRAFT', 'PAUSED', 'CLOSED', 'FILLED', 'PUBLISHED') THEN
      RAISE EXCEPTION 'STATUS_RESERVED: el estado % solo lo fija la revision o el sistema', v_new
        USING ERRCODE = '42501';
    END IF;
    IF v_new = 'PUBLISHED' AND NOT (v_old = 'PAUSED' AND OLD.published_at IS NOT NULL) THEN
      RAISE EXCEPTION 'PUBLISH_REQUIRES_REVIEW: solo se reanuda una oferta pausada; para publicar usa submit_job_for_review'
        USING ERRCODE = '42501';
    END IF;
    IF v_new = 'PAUSED' AND v_old <> 'PUBLISHED' THEN
      RAISE EXCEPTION 'STATUS_RESERVED: solo se puede pausar una oferta publicada'
        USING ERRCODE = '42501';
    END IF;
    IF v_new = 'PUBLISHED' AND NEW.application_deadline IS NOT NULL AND NEW.application_deadline <= now() THEN
      RAISE EXCEPTION 'JOB_EXPIRED: la fecha de cierre ya paso'
        USING ERRCODE = '42501';
    END IF;
    IF v_new IN ('CLOSED', 'FILLED') THEN
      NEW.closed_at := now();
      NEW.closed_by := auth.uid();
    END IF;
  END IF;

  -- F4: el cierre se mide desde AHORA (no desde published_at): renovar una caducada
  -- o editar una publicada antigua no puede fallar por su antigüedad.
  IF NEW.application_deadline IS DISTINCT FROM OLD.application_deadline
     AND NEW.application_deadline IS NOT NULL
     AND NEW.application_deadline > now() + interval '61 days' THEN
    RAISE EXCEPTION 'DEADLINE_TOO_FAR: el cierre no puede superar 60 dias'
      USING ERRCODE = '22023';
  END IF;

  -- S2: una oferta que va a quedar PUBLISHED debe tener aprobado TODO el texto
  -- moderado. Si un miembro cambia cualquiera de esos campos sobre una publicada
  -- (o reanuda una pausada cuyo texto cambió desde la aprobación), vuelve a revisión.
  IF NEW.status = 'PUBLISHED' THEN
    IF (v_old = 'PUBLISHED' AND public._job_moderation_hash_json(to_jsonb(OLD)) IS DISTINCT FROM v_hash)
       OR (v_old = 'PAUSED' AND NEW.reviewed_text_hash IS DISTINCT FROM v_hash) THEN
      NEW.status := 'AI_REVIEW';
      PERFORM set_config('app.status_source', 'edit', true);
      PERFORM set_config('app.status_reason', 'texto de la oferta modificado', true);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.job_postings_proteger_publicacion() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_postings_proteger_publicacion ON public.job_postings;
CREATE TRIGGER trg_job_postings_proteger_publicacion
  BEFORE INSERT OR UPDATE ON public.job_postings
  FOR EACH ROW
  EXECUTE FUNCTION public.job_postings_proteger_publicacion();

-- Las ofertas PUBLISHED / PAUSED ya aprobadas con la fórmula antigua
-- (md5 de título|descripción) y sin cambios desde entonces se re-estampan con la
-- nueva, para que reanudar una pausada no las mande a revisión sin motivo.
-- Hoy no hay ninguna; no toca las que ya llevan el hash nuevo.
UPDATE public.job_postings
   SET reviewed_text_hash = public._job_moderation_hash_json(to_jsonb(job_postings))
 WHERE status IN ('PUBLISHED', 'PAUSED')
   AND reviewed_text_hash IS NOT NULL
   AND reviewed_text_hash = md5(COALESCE(title, '') || '|' || COALESCE(description, ''));

-- S7: tope de la descripción en la propia tabla (el saneador del front es cuadrático).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
                  WHERE conrelid = 'public.job_postings'::regclass
                    AND conname = 'job_postings_description_max_length') THEN
    ALTER TABLE public.job_postings
      ADD CONSTRAINT job_postings_description_max_length
      CHECK (description IS NULL OR char_length(description) <= 30000) NOT VALID;
  END IF;
  BEGIN
    ALTER TABLE public.job_postings VALIDATE CONSTRAINT job_postings_description_max_length;
  EXCEPTION WHEN check_violation THEN
    RAISE NOTICE 'Hay ofertas con descripcion de mas de 30000 caracteres: el CHECK queda NOT VALID (se aplica a lo nuevo). Recortarlas y ejecutar VALIDATE CONSTRAINT.';
  END;
END $$;

-- -----------------------------------------------------------------------------
-- 6. F2: el admin ve las ofertas (cola de revisión)
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admin lee todas las ofertas" ON public.job_postings;
CREATE POLICY "Admin lee todas las ofertas" ON public.job_postings
  FOR SELECT TO authenticated
  USING (public.current_user_is_admin());

-- -----------------------------------------------------------------------------
-- 7. S2: moderar_oferta con p_expected_hash
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.moderar_oferta(uuid, text, text);

CREATE OR REPLACE FUNCTION public.moderar_oferta(
  p_job_id uuid,
  p_decision text,
  p_motivo text DEFAULT NULL,
  p_expected_hash text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dec      text := upper(btrim(COALESCE(p_decision, '')));
  v_motivo   text := left(NULLIF(btrim(COALESCE(p_motivo, '')), ''), 1000);
  v_expected text := NULLIF(btrim(COALESCE(p_expected_hash, '')), '');
  v_uid      uuid := auth.uid();
  v_job      record;
  v_company  record;
  v_deadline timestamptz;
  v_pub_at   timestamptz;
  v_mail     text;
  v_lang     text;
BEGIN
  IF NOT (COALESCE(auth.role(), '') = 'service_role' OR COALESCE(public.current_user_is_admin(), false)) THEN
    RAISE EXCEPTION 'FORBIDDEN: solo un administrador o el servicio de revision puede moderar ofertas'
      USING ERRCODE = '42501';
  END IF;
  IF v_dec NOT IN ('PUBLISHED', 'MANUAL_REVIEW', 'REJECTED') THEN
    RAISE EXCEPTION 'INVALID_DECISION: usa PUBLISHED, MANUAL_REVIEW o REJECTED' USING ERRCODE = '22023';
  END IF;
  IF v_dec = 'REJECTED' AND v_motivo IS NULL THEN
    RAISE EXCEPTION 'MOTIVO_REQUIRED: rechazar una oferta exige un motivo' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO v_job FROM public.job_postings WHERE id = p_job_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'JOB_NOT_FOUND: la oferta no existe' USING ERRCODE = 'P0002';
  END IF;
  IF v_job.status NOT IN ('AI_REVIEW', 'MANUAL_REVIEW', 'PUBLISHED', 'REJECTED') THEN
    RAISE EXCEPTION 'INVALID_STATE: no se puede moderar una oferta en estado %', v_job.status
      USING ERRCODE = '55000';
  END IF;

  -- S2: lo que se aprueba es exactamente lo que se revisó. La fila ya está
  -- bloqueada (FOR UPDATE): la empresa no puede cambiarla entre esta comprobación
  -- y el UPDATE de abajo. La oferta se queda como estaba (en revisión).
  IF v_dec = 'PUBLISHED' AND v_expected IS NOT NULL
     AND lower(v_expected) IS DISTINCT FROM public._job_moderation_hash_json(to_jsonb(v_job)) THEN
    RAISE EXCEPTION 'HASH_MISMATCH: la oferta cambio mientras se revisaba; hay que revisarla de nuevo'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT c.id, c.status, c.company_name INTO v_company FROM public.companies c WHERE c.id = v_job.company_id;
  v_lang := public._job_company_lang(v_job.company_id);

  PERFORM set_config('app.status_source', 'moderation', true);
  PERFORM set_config('app.status_reason', COALESCE(v_motivo, ''), true);

  IF v_dec = 'PUBLISHED' THEN
    IF v_company.status IS DISTINCT FROM 'APPROVED' THEN
      RAISE EXCEPTION 'COMPANY_NOT_APPROVED: la empresa no esta verificada' USING ERRCODE = '42501';
    END IF;
    v_pub_at := COALESCE(v_job.published_at, now());
    v_deadline := CASE
      WHEN v_job.application_deadline IS NULL OR v_job.application_deadline <= now() THEN now() + interval '30 days'
      ELSE v_job.application_deadline END;
    -- (el trigger estampa reviewed_text_hash con el hash de todos los campos moderados)
    UPDATE public.job_postings
       SET status = 'PUBLISHED', published_at = v_pub_at, application_deadline = v_deadline,
           review_reason = NULL, reviewed_at = now(), reviewed_by = v_uid
     WHERE id = p_job_id;
    IF v_job.status IS DISTINCT FROM 'PUBLISHED' THEN
      FOREACH v_mail IN ARRAY public._job_notify_recipients(p_job_id) LOOP
        PERFORM public._outbox_enqueue('job_published', v_mail,
          jsonb_build_object('job_id', v_job.id, 'title', v_job.title, 'slug', v_job.slug,
                             'company_name', v_company.company_name),
          v_lang, 5, now(), 'job_published:' || v_job.id || ':' || floor(extract(epoch FROM now()))::bigint);
      END LOOP;
    END IF;

  ELSIF v_dec = 'MANUAL_REVIEW' THEN
    UPDATE public.job_postings
       SET status = 'MANUAL_REVIEW', review_reason = v_motivo, reviewed_at = now(), reviewed_by = v_uid
     WHERE id = p_job_id;
    PERFORM public._outbox_enqueue(
      'job_manual_review', 'support@yourcvpassport.com',
      jsonb_build_object('job_id', v_job.id, 'title', v_job.title, 'company_id', v_job.company_id,
                         'company_name', v_company.company_name, 'reasons', to_jsonb(COALESCE(v_motivo, ''))),
      'es', 3, now(), 'job_manual_review:' || v_job.id || ':' || floor(extract(epoch FROM now()))::bigint);

  ELSE  -- REJECTED
    UPDATE public.job_postings
       SET status = 'REJECTED', review_reason = v_motivo, reviewed_at = now(), reviewed_by = v_uid
     WHERE id = p_job_id;
    FOREACH v_mail IN ARRAY public._job_notify_recipients(p_job_id) LOOP
      PERFORM public._outbox_enqueue('job_rejected', v_mail,
        jsonb_build_object('job_id', v_job.id, 'title', v_job.title, 'company_name', v_company.company_name,
                           'reason', v_motivo),
        v_lang, 5, now(), 'job_rejected:' || v_job.id || ':' || floor(extract(epoch FROM now()))::bigint);
    END LOOP;
  END IF;

  RETURN (SELECT jsonb_build_object('job_id', jp.id, 'status', jp.status, 'published_at', jp.published_at,
                                    'application_deadline', jp.application_deadline)
          FROM public.job_postings jp WHERE jp.id = p_job_id);
END;
$$;
REVOKE ALL ON FUNCTION public.moderar_oferta(uuid, text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderar_oferta(uuid, text, text, text) TO authenticated, service_role;
COMMENT ON FUNCTION public.moderar_oferta(uuid, text, text, text) IS
'Resuelve la revisión de una oferta (admin o service_role): PUBLISHED, MANUAL_REVIEW o REJECTED. Con p_expected_hash (get_job_moderation_hash leído al empezar la revisión), publicar falla con HASH_MISMATCH si el texto moderado cambió entretanto.';

-- -----------------------------------------------------------------------------
-- 8. S8 + F3 + F2: preguntas de las ofertas
-- -----------------------------------------------------------------------------
ALTER TABLE public.job_posting_questions DROP CONSTRAINT IF EXISTS job_posting_questions_question_type_check;
ALTER TABLE public.job_posting_questions ADD CONSTRAINT job_posting_questions_question_type_check
  CHECK ((question_type)::text = ANY (ARRAY['TEXT', 'TEXTAREA', 'YES_NO', 'MULTIPLE_CHOICE', 'NUMBER']::text[]));

-- Lectura de la nueva columna para el público y los usuarios con sesión
-- (expected_answer sigue cerrada: solo get_job_questions_for_company).
GRANT SELECT (is_active) ON public.job_posting_questions TO anon, authenticated;

-- Escritura: solo OWNER / ADMIN / MEMBER (un VIEWER no). Se retiran las dos
-- políticas «FOR ALL» que dejaban escribir a cualquier miembro, VIEWER incluido.
DROP POLICY IF EXISTS "Company members can manage questions" ON public.job_posting_questions;
DROP POLICY IF EXISTS "Company members manage questions" ON public.job_posting_questions;
DROP POLICY IF EXISTS "Preguntas: miembros escriben (insert)" ON public.job_posting_questions;
DROP POLICY IF EXISTS "Preguntas: miembros escriben (update)" ON public.job_posting_questions;
DROP POLICY IF EXISTS "Preguntas: miembros escriben (delete)" ON public.job_posting_questions;

CREATE POLICY "Preguntas: miembros escriben (insert)" ON public.job_posting_questions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.job_postings jp
     WHERE jp.id = job_posting_questions.job_posting_id
       AND public.is_company_member(jp.company_id, ARRAY['OWNER', 'ADMIN', 'MEMBER'])));
CREATE POLICY "Preguntas: miembros escriben (update)" ON public.job_posting_questions
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.job_postings jp
     WHERE jp.id = job_posting_questions.job_posting_id
       AND public.is_company_member(jp.company_id, ARRAY['OWNER', 'ADMIN', 'MEMBER'])))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.job_postings jp
     WHERE jp.id = job_posting_questions.job_posting_id
       AND public.is_company_member(jp.company_id, ARRAY['OWNER', 'ADMIN', 'MEMBER'])));
CREATE POLICY "Preguntas: miembros escriben (delete)" ON public.job_posting_questions
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.job_postings jp
     WHERE jp.id = job_posting_questions.job_posting_id
       AND public.is_company_member(jp.company_id, ARRAY['OWNER', 'ADMIN', 'MEMBER'])));

-- Lectura pública: solo las preguntas activas de ofertas publicadas.
DROP POLICY IF EXISTS "Anyone can view questions for published jobs" ON public.job_posting_questions;
DROP POLICY IF EXISTS "Public can view questions of published jobs" ON public.job_posting_questions;
DROP POLICY IF EXISTS "Preguntas: lectura publica de activas" ON public.job_posting_questions;
CREATE POLICY "Preguntas: lectura publica de activas" ON public.job_posting_questions
  FOR SELECT
  USING (is_active AND job_posting_id IN (SELECT id FROM public.job_postings WHERE status = 'PUBLISHED'));
-- (los miembros siguen leyendo todas con «Company members can view questions for their jobs»)

-- F2: el admin lee las preguntas (cola de revisión).
DROP POLICY IF EXISTS "Preguntas: admin lee" ON public.job_posting_questions;
CREATE POLICY "Preguntas: admin lee" ON public.job_posting_questions
  FOR SELECT TO authenticated
  USING (public.current_user_is_admin());

-- Tope de 5 preguntas ACTIVAS por oferta (las ocultas no cuentan) y también al
-- reactivar una.
CREATE OR REPLACE FUNCTION public.job_posting_questions_tope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active THEN
    PERFORM pg_advisory_xact_lock(hashtext('jpq:' || NEW.job_posting_id::text));
    IF (SELECT count(*) FROM public.job_posting_questions q
         WHERE q.job_posting_id = NEW.job_posting_id AND q.is_active AND q.id <> NEW.id) >= 5 THEN
      RAISE EXCEPTION 'MAX_QUESTIONS_REACHED: una oferta admite como máximo 5 preguntas'
        USING ERRCODE = '23514';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.job_posting_questions_tope() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_posting_questions_tope ON public.job_posting_questions;
CREATE TRIGGER trg_job_posting_questions_tope
  BEFORE INSERT OR UPDATE OF job_posting_id, is_active ON public.job_posting_questions
  FOR EACH ROW EXECUTE FUNCTION public.job_posting_questions_tope();

-- Protección: (a) una pregunta con respuestas no se borra ni se modifica (solo se
-- oculta con is_active = false o se reordena); (b) en ofertas PUBLISHED / PAUSED
-- un miembro no toca las preguntas (debe pasar la oferta a borrador y reenviarla
-- a revisión). service_role y admin pasan (b), nunca (a). Al borrar la oferta, el
-- borrado en cascada de sus preguntas sí se permite.
-- Corre con los privilegios de quien escribe: las filas de job_applications que
-- ve son las de su empresa (RLS), que son las únicas que pueden tener respuestas
-- a preguntas de su oferta.
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
-- 9. S1 + S4: _job_submit (enviar a revisión) exige edad y aceptación
--    (resto idéntico a 20261030_ofertas_fase2.sql, sección 9)
-- -----------------------------------------------------------------------------
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
-- 10. S1 + S4 + S8: apply_to_job exige edad y aceptación; ignora preguntas ocultas
--     (resto idéntico a 20261031_candidaturas_fase3.sql, sección 8)
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
'Inscribe al usuario autenticado en una oferta PUBLISHED, vigente y de empresa APPROVED. Exige ser mayor de 16 (si hay fecha guardada), tener aceptada la versión vigente de terminos_candidato y consentimiento; responde las preguntas activas obligatorias, guarda la copia del perfil, descarta a NOT_QUALIFIED si falla una pregunta knockout y encola los avisos. Errores con código al inicio del mensaje: AUTH_REQUIRED, UNAUTHORIZED, UNDERAGE, JOB_NOT_AVAILABLE, ALREADY_APPLIED, ACCEPTANCE_REQUIRED, CONSENT_REQUIRED, REQUIRED_QUESTION_MISSING, COVER_LETTER_REQUIRED, COVER_LETTER_TOO_LONG, INVALID_ANSWERS.';

-- -----------------------------------------------------------------------------
-- 11. F8: update_application_status con p_clear_rating y vista del candidato
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.update_application_status(uuid, uuid, uuid, character varying, text, integer);

CREATE OR REPLACE FUNCTION public.update_application_status(
  p_application_id uuid,
  p_company_id uuid,
  p_user_id uuid,
  p_new_status character varying,
  p_internal_notes text DEFAULT NULL,
  p_rating integer DEFAULT NULL,
  p_clear_rating boolean DEFAULT false
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
  IF COALESCE(p_clear_rating, false) AND p_rating IS NOT NULL THEN
    RAISE EXCEPTION 'INVALID_RATING: no se puede valorar y borrar la valoración a la vez' USING ERRCODE = 'P0001';
  END IF;

  -- El historial y el aviso al candidato (cola) los pone el trigger de status.
  UPDATE public.job_applications
     SET status = v_new_status,
         internal_notes = coalesce(p_internal_notes, internal_notes),
         rating = CASE WHEN COALESCE(p_clear_rating, false) THEN NULL ELSE coalesce(p_rating, rating) END,
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
REVOKE ALL ON FUNCTION public.update_application_status(uuid, uuid, uuid, character varying, text, integer, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_application_status(uuid, uuid, uuid, character varying, text, integer, boolean) TO authenticated, service_role;
COMMENT ON FUNCTION public.update_application_status(uuid, uuid, uuid, character varying, text, integer, boolean) IS
'Cambia estado, notas y valoración de una candidatura (OWNER/ADMIN/MEMBER). p_rating null no toca la valoración; p_clear_rating = true la borra.';

-- Vista del candidato: una NOT_QUALIFIED se le muestra siempre como SENT (la
-- empresa pudo abrirla; «Vista» sería delatar el descarte automático).
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
     WHEN ja.status = 'NOT_QUALIFIED' THEN 'SENT'
     WHEN coalesce(ja.viewed_by_company, false) THEN 'VIEWED'
     ELSE 'SENT'
   END)::text AS candidate_status,
  ja.cover_letter,
  ja.resume_url,
  ja.answers,
  -- Tampoco se revela por viewed_by_company / viewed_at en una NOT_QUALIFIED.
  (CASE WHEN ja.status = 'NOT_QUALIFIED' THEN false ELSE ja.viewed_by_company END) AS viewed_by_company,
  (CASE WHEN ja.status = 'NOT_QUALIFIED' THEN NULL ELSE ja.viewed_at END) AS viewed_at,
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

-- -----------------------------------------------------------------------------
-- 12. F9: mensaje por plantilla al candidato (Descartado / Te llamamos)
-- -----------------------------------------------------------------------------
-- (get_application_history NO se toca: sigue ocultando al candidato las filas con
-- from_status = to_status, que es como queda el aviso de un mensaje enviado. La
-- empresa y el admin leen la anotación en job_application_status_history.note.)

CREATE OR REPLACE FUNCTION public.send_application_message(p_application_id uuid, p_template text)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid      uuid := auth.uid();
  v_tpl      text := lower(btrim(COALESCE(p_template, '')));
  v_app      record;
  v_email    text;
  v_lang     text;
  v_title    text;
  v_slug     text;
  v_company  text;
  v_note     text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: inicia sesión' USING ERRCODE = '42501';
  END IF;
  IF v_tpl NOT IN ('rejected', 'interview') THEN
    RAISE EXCEPTION 'INVALID_TEMPLATE: usa rejected o interview' USING ERRCODE = '22023';
  END IF;

  SELECT ja.id, ja.profile_id, ja.company_id, ja.job_posting_id, ja.status INTO v_app
    FROM public.job_applications ja WHERE ja.id = p_application_id FOR UPDATE;
  IF NOT FOUND OR NOT public.is_company_member(v_app.company_id, ARRAY['OWNER', 'ADMIN', 'MEMBER']) THEN
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND: candidatura no encontrada' USING ERRCODE = 'P0002';
  END IF;
  IF v_app.status = 'WITHDRAWN' THEN
    RAISE EXCEPTION 'APPLICATION_WITHDRAWN: el candidato retiró su candidatura' USING ERRCODE = 'P0001';
  END IF;

  v_note := 'message:' || v_tpl;
  IF EXISTS (
    SELECT 1 FROM public.job_application_status_history h
     WHERE h.application_id = p_application_id AND h.note = v_note
       AND h.created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'MESSAGE_ALREADY_SENT: ya se envió esa plantilla a este candidato en las últimas 24 horas' USING ERRCODE = 'P0001';
  END IF;

  SELECT p.email, to_jsonb(p)->>'registro_idioma' INTO v_email, v_lang
    FROM public.profiles p WHERE p.id = v_app.profile_id;
  IF btrim(COALESCE(v_email, '')) = '' THEN
    RAISE EXCEPTION 'CANDIDATE_WITHOUT_EMAIL: el candidato no tiene correo' USING ERRCODE = 'P0001';
  END IF;
  SELECT jp.title, jp.slug, c.company_name INTO v_title, v_slug, v_company
    FROM public.job_postings jp JOIN public.companies c ON c.id = jp.company_id
   WHERE jp.id = v_app.job_posting_id;

  PERFORM public.jobs_enqueue_email(
    'application_message', v_email,
    jsonb_build_object(
      'template', v_tpl, 'job_title', v_title, 'company_name', v_company, 'job_slug', v_slug,
      'application_id', p_application_id),
    v_lang, 4, now());

  INSERT INTO public.job_application_status_history
    (application_id, from_status, to_status, changed_by, changed_by_role, note)
  VALUES (p_application_id, v_app.status, v_app.status, v_uid, 'COMPANY', v_note);

  RETURN jsonb_build_object('success', true, 'application_id', p_application_id, 'template', v_tpl, 'queued', true);
END;
$$;
REVOKE ALL ON FUNCTION public.send_application_message(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_application_message(uuid, text) TO authenticated, service_role;
COMMENT ON FUNCTION public.send_application_message(uuid, text) IS
'Encola en email_outbox (kind application_message) el correo-plantilla al candidato: rejected (descartado) o interview (te llamamos). Solo OWNER/ADMIN/MEMBER de la empresa; 1 por candidatura y plantilla cada 24 h; queda en el historial. No cambia el estado de la candidatura.';

-- -----------------------------------------------------------------------------
-- 13. F5 + F6: listado público v2 (remoto sin países = cualquiera; filtro de experiencia)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.search_public_jobs_v2(text, text, text, text, text, numeric, int, text, text, int, int);

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
  p_max_experience_years integer DEFAULT NULL  -- ofertas que piden <= X años o ninguno
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
DECLARE
  v_search text := NULLIF(btrim(COALESCE(p_search, '')), '');
  v_city   text := NULLIF(btrim(COALESCE(p_city, '')), '');
  v_limit  integer := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);
  v_offset integer := GREATEST(COALESCE(p_offset, 0), 0);
  v_uid    uuid := auth.uid();
BEGIN
  IF v_search IS NOT NULL THEN
    v_search := '%' || replace(replace(replace(v_search, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;
  IF v_city IS NOT NULL THEN
    v_city := '%' || replace(replace(replace(v_city, '\', '\\'), '%', '\%'), '_', '\_') || '%';
  END IF;

  RETURN QUERY
  SELECT
    jp.id, jp.title, jp.slug, jp.company_id, c.company_name, c.logo_url,
    jp.country_code, jp.location_city, jp.work_mode, jp.is_remote,
    jp.contract_types, jp.schedule, jp.category, jp.category2, jp.vacancies,
    jp.experience_years,
    left(btrim(regexp_replace(regexp_replace(COALESCE(jp.description, ''), '<[^>]*>', ' ', 'g'), '\s+', ' ', 'g')), 280),
    CASE WHEN jp.show_salary THEN jp.salary_min END,
    CASE WHEN jp.show_salary THEN jp.salary_max END,
    CASE WHEN jp.show_salary THEN jp.salary_currency END,
    CASE WHEN jp.show_salary THEN jp.salary_period END,
    CASE WHEN jp.show_salary THEN jp.salary_mode END,
    COALESCE(jp.show_salary, false), jp.published_at, jp.application_deadline,
    (v_uid IS NOT NULL AND EXISTS (
       SELECT 1 FROM public.job_applications ja
       WHERE ja.job_posting_id = jp.id AND ja.profile_id = v_uid AND ja.status <> 'WITHDRAWN')),
    count(*) OVER ()
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
  LIMIT v_limit OFFSET v_offset;
END;
$$;
REVOKE ALL ON FUNCTION public.search_public_jobs_v2(text, text, text, text, text, numeric, int, text, text, int, int, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_jobs_v2(text, text, text, text, text, numeric, int, text, text, int, int, int)
  TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 14. Comprobaciones finales (abortan la migración si fallan)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'moderar_oferta') <> 1
     OR (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'update_application_status') <> 1
     OR (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'search_public_jobs_v2') <> 1
     OR (SELECT count(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace AND proname = 'apply_to_job') <> 1 THEN
    RAISE EXCEPTION 'quedan sobrecargas duplicadas de moderar_oferta / update_application_status / search_public_jobs_v2 / apply_to_job';
  END IF;
  IF has_function_privilege('anon', 'public.get_job_moderation_hash(uuid)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.set_my_birth_date(date)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.send_application_message(uuid,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.job_moderation_hash(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'privilegios de ejecucion demasiado abiertos en las RPC nuevas';
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
