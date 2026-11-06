-- =============================================================================
-- Bolsa de empleo, fase 2 (#7): ofertas con revision, estados, historial,
-- denuncias, caducidad, listado publico por pais y slug limpio
-- =============================================================================
--
-- ORDEN: 20261029_legal_aceptaciones_idioma.sql (fase 1)
--        -> ESTA (20261030)
--        -> 20261031_candidaturas_fase3.sql.
-- No depende de la fase 1: crea `countries` y `email_outbox` con
-- CREATE TABLE IF NOT EXISTS (definicion comun) y las siembra con
-- ON CONFLICT DO NOTHING, de modo que da igual quien llegue primero.
-- Aditiva y reaplicable (IF NOT EXISTS / CREATE OR REPLACE / DROP IF EXISTS).
--
-- ESTADO ANTES (comprobado en produccion el 29/10/2026, solo lectura)
--   - job_postings: 0 filas. CHECK de status: DRAFT, PUBLISHED, PAUSED, CLOSED,
--     FILLED. Publicar costaba 30 creditos (publish_job_posting) y el trigger
--     trg_job_postings_proteger_publicacion forzaba credits_cost = 30.
--   - La politica publica deja a anon leer TODAS las columnas de job_postings.
--   - get_job_posting_detail solo existia en produccion (no estaba en el repo).
--   - generate_job_posting_slug quita las tildes sin transliterar
--     («Gestion» -> «gestin») y no anade id.
--
-- QUE HACE
--   1. countries (SELECT publico, escritura admin) + semilla; email_outbox
--      (solo service_role). Ningun correo sale de aqui: solo se ENCOLA.
--   2. job_postings: columnas nuevas (ADD COLUMN IF NOT EXISTS), CHECK de
--      status ampliado (AI_REVIEW, MANUAL_REVIEW, REJECTED, EXPIRED + los
--      actuales), credits_cost por defecto 0.
--   3. job_posting_status_history: la llena un trigger; nadie escribe a mano.
--   4. job_reports: denuncias (INSERT autenticado, lectura/gestion admin).
--      A las 3 denuncias abiertas distintas una oferta PUBLISHED vuelve a
--      AI_REVIEW.
--   5. Trigger de proteccion reescrito (job_postings_proteger_publicacion):
--      - credits_cost siempre 0 (para cualquier rol).
--      - Un miembro de empresa solo puede INSERTAR en DRAFT y solo puede ir a
--        PUBLISHED con PAUSED -> PUBLISHED sobre una oferta ya publicada antes
--        y cuyo titulo/descripcion sean los que se aprobaron. Nunca puede
--        poner AI_REVIEW, MANUAL_REVIEW, REJECTED ni EXPIRED, ni salir de una
--        revision.
--      - Si una oferta PUBLISHED cambia titulo o descripcion, vuelve a
--        AI_REVIEW (reviewed_text_hash guarda el texto aprobado; tambien cubre
--        editar durante una pausa).
--      - Solo service_role, admin y las RPC SECURITY DEFINER pasan a
--        PUBLISHED / MANUAL_REVIEW / REJECTED / EXPIRED.
--   6. RPC: submit_job_for_review, moderar_oferta, expire_job_postings,
--      search_public_jobs_v2; publish_job_posting redefinida SIN cobro;
--      get_job_posting_detail versionada (columnas antiguas + nuevas al final).
--   7. Slug: job_slugify() (transliteracion manual, sin depender de la
--      extension unaccent) + id corto al final. Los slugs ya publicados no
--      se tocan.
--   8. Privilegios: anon pierde SELECT de tabla en job_postings y recibe SELECT
--      por columna (lista blanca); las columnas privadas nuevas y created_by,
--      credits_cost y metadata quedan cerradas. Se elimina la politica de
--      UPDATE redundante que dejaba editar tambien a los VIEWER.
--   9. Si existe pg_cron, programa expire_job_postings() cada dia (03:15 UTC).
--
-- QUIEN LLAMA A QUE
--   submit_job_for_review(uuid) ............ authenticated (miembro de empresa)
--   publish_job_posting(uuid,uuid,uuid,int)  authenticated (misma firma; ahora
--                                            equivale a enviar a revision)
--   moderar_oferta(uuid,text,text) ......... admin o service_role
--   expire_job_postings() .................. service_role / cron (no anon ni
--                                            authenticated)
--   search_public_jobs_v2(...), get_job_posting_detail(varchar) ... anon + authenticated
--
-- AVISO PARA EL FRONTEND (leer antes de desplegar)
--   - anon ya NO puede hacer select('*') sobre job_postings: hay que pedir
--     columnas explicitas (las del sitemap, slug/updated_at/published_at, siguen
--     bien). Listar y ficha publicos: search_public_jobs_v2 y
--     get_job_posting_detail.
--   - authenticated conserva el SELECT de tabla (los paneles actuales usan
--     select('*')), de modo que notify_emails y review_reason de ofertas
--     PUBLISHED siguen siendo legibles por un usuario con sesion. Seguimiento:
--     cuando el frontend pida columnas explicitas, repetir el REVOKE para
--     authenticated y dar a los miembros una vista de empresa.
--   - Las ofertas ya no se publican con un UPDATE de status: se envian con
--     submit_job_for_review y las publica la revision (moderar_oferta).
--
-- COMPROBACIONES TRAS APLICAR (la propia migracion aborta si fallan las dos
-- primeras)
--   select has_column_privilege('anon','public.job_postings','notify_emails','SELECT');  -- false
--   select count(*) from pg_policies where tablename='job_postings';
--   select status from job_postings limit 1;  -- nada que migrar: hay 0 filas
--
-- VUELTA ATRAS (en este orden; no hay datos que perder hoy)
--   select cron.unschedule('expire-job-postings');                 -- si se programo
--   drop function if exists public.search_public_jobs_v2(text,text,text,text,text,numeric,int,text,text,int,int);
--   drop function if exists public.moderar_oferta(uuid,text,text);
--   drop function if exists public.submit_job_for_review(uuid);
--   drop function if exists public.expire_job_postings();
--   drop trigger  if exists trg_job_postings_historial_upd on public.job_postings;
--   drop trigger  if exists trg_job_postings_historial_ins on public.job_postings;
--   -- restaurar publish_job_posting y job_postings_proteger_publicacion desde
--   -- 20261007_seguridad_empresas.sql / pg_get_functiondef de la copia previa,
--   -- y get_job_posting_detail sin las columnas del final.
--   -- Las tablas nuevas y las columnas se pueden dejar (son inertes).
--   grant select on public.job_postings to anon;                   -- reabre la lectura
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. countries y email_outbox (definicion comun a las tres fases)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.countries (
  code    text PRIMARY KEY,
  name_es text NOT NULL,
  name_en text NOT NULL,
  currency text NOT NULL,
  active  boolean NOT NULL DEFAULT true
);
ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Solo si nadie (otra fase) ha puesto ya politicas: evita duplicarlas.
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'countries') THEN
    CREATE POLICY countries_select_publico ON public.countries
      FOR SELECT TO anon, authenticated USING (true);
    CREATE POLICY countries_admin_escribe ON public.countries
      FOR ALL TO authenticated
      USING (public.current_user_is_admin())
      WITH CHECK (public.current_user_is_admin());
  END IF;
END $$;

REVOKE ALL ON public.countries FROM anon, authenticated;
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.countries TO authenticated;  -- la RLS limita a admin

INSERT INTO public.countries (code, name_es, name_en, currency) VALUES
  ('ES','España','Spain','EUR'),
  ('MX','México','Mexico','MXN'),
  ('AR','Argentina','Argentina','ARS'),
  ('CL','Chile','Chile','CLP'),
  ('CO','Colombia','Colombia','COP'),
  ('PE','Perú','Peru','PEN'),
  ('EC','Ecuador','Ecuador','USD'),
  ('UY','Uruguay','Uruguay','UYU'),
  ('PY','Paraguay','Paraguay','PYG'),
  ('BO','Bolivia','Bolivia','BOB'),
  ('VE','Venezuela','Venezuela','VES'),
  ('CR','Costa Rica','Costa Rica','CRC'),
  ('PA','Panamá','Panama','USD'),
  ('DO','República Dominicana','Dominican Republic','DOP'),
  ('GT','Guatemala','Guatemala','GTQ'),
  ('HN','Honduras','Honduras','HNL'),
  ('SV','El Salvador','El Salvador','USD'),
  ('NI','Nicaragua','Nicaragua','NIO'),
  ('CU','Cuba','Cuba','CUP'),
  ('PR','Puerto Rico','Puerto Rico','USD'),
  ('GQ','Guinea Ecuatorial','Equatorial Guinea','XAF'),
  ('DE','Alemania','Germany','EUR'),
  ('FR','Francia','France','EUR'),
  ('IT','Italia','Italy','EUR'),
  ('PT','Portugal','Portugal','EUR'),
  ('GB','Reino Unido','United Kingdom','GBP'),
  ('IE','Irlanda','Ireland','EUR'),
  ('NL','Países Bajos','Netherlands','EUR'),
  ('BE','Bélgica','Belgium','EUR'),
  ('CH','Suiza','Switzerland','CHF'),
  ('AT','Austria','Austria','EUR'),
  ('PL','Polonia','Poland','PLN'),
  ('SE','Suecia','Sweden','SEK'),
  ('NO','Noruega','Norway','NOK'),
  ('DK','Dinamarca','Denmark','DKK'),
  ('FI','Finlandia','Finland','EUR'),
  ('GR','Grecia','Greece','EUR'),
  ('RO','Rumanía','Romania','RON'),
  ('CZ','Chequia','Czechia','CZK'),
  ('HU','Hungría','Hungary','HUF')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.email_outbox (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       text NOT NULL,
  to_email   text NOT NULL,
  payload    jsonb NOT NULL DEFAULT '{}'::jsonb,
  lang       text NOT NULL DEFAULT 'es',
  priority   integer NOT NULL DEFAULT 5,
  send_after timestamptz NOT NULL DEFAULT now(),
  sent_at    timestamptz,
  attempts   integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;  -- sin politicas: solo service_role (BYPASSRLS)
REVOKE ALL ON public.email_outbox FROM PUBLIC, anon, authenticated;
CREATE INDEX IF NOT EXISTS email_outbox_pending_idx
  ON public.email_outbox (send_after) WHERE sent_at IS NULL;
-- Idempotencia de los avisos encolados desde SQL: misma clave + destinatario = una fila.
CREATE UNIQUE INDEX IF NOT EXISTS email_outbox_dedupe_key
  ON public.email_outbox ((payload->>'dedupe_key'), to_email)
  WHERE (payload->>'dedupe_key') IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 2. job_postings: columnas nuevas y estados
-- -----------------------------------------------------------------------------
-- PUBLICAS (las lee el listado y la ficha)
ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS country_code text REFERENCES public.countries(code),
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS category2 text,
  ADD COLUMN IF NOT EXISTS vacancies integer NOT NULL DEFAULT 1 CHECK (vacancies >= 1),
  ADD COLUMN IF NOT EXISTS contract_types text[]
    CHECK (contract_types IS NULL OR contract_types <@ ARRAY['INDEFINITE','TEMPORARY','PROJECT','INTERNSHIP','TRAINING','FREELANCE','VOLUNTEER']::text[]),
  ADD COLUMN IF NOT EXISTS schedule text CHECK (schedule IS NULL OR schedule IN ('FULL_TIME','PART_TIME','HOURLY')),
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS start_date date,
  ADD COLUMN IF NOT EXISTS start_immediate boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS salary_mode text CHECK (salary_mode IS NULL OR salary_mode IN ('RANGE','FROM','UP_TO','EXACT')),
  ADD COLUMN IF NOT EXISTS education_min text,
  ADD COLUMN IF NOT EXISTS experience_years integer CHECK (experience_years IS NULL OR experience_years >= 0),
  ADD COLUMN IF NOT EXISTS languages jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(languages) = 'array'),
  ADD COLUMN IF NOT EXISTS cover_letter_mode text NOT NULL DEFAULT 'NONE' CHECK (cover_letter_mode IN ('NONE','OPTIONAL','REQUIRED')),
  ADD COLUMN IF NOT EXISTS allowed_countries text[];

-- PRIVADAS (cerradas a anon en el apartado 8)
ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS notify_emails text[],
  ADD COLUMN IF NOT EXISTS notify_frequency text NOT NULL DEFAULT 'DAILY' CHECK (notify_frequency IN ('EACH','DAILY')),
  ADD COLUMN IF NOT EXISTS review_reason text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_text_hash text,
  ADD COLUMN IF NOT EXISTS closed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_notice_sent_at timestamptz;

ALTER TABLE public.job_postings ALTER COLUMN credits_cost SET DEFAULT 0;

ALTER TABLE public.job_postings DROP CONSTRAINT IF EXISTS job_postings_status_check;
ALTER TABLE public.job_postings ADD CONSTRAINT job_postings_status_check
  CHECK (status::text = ANY (ARRAY['DRAFT','AI_REVIEW','MANUAL_REVIEW','REJECTED','PUBLISHED','PAUSED','CLOSED','EXPIRED','FILLED']));

CREATE INDEX IF NOT EXISTS idx_job_postings_country_pub
  ON public.job_postings (country_code, published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_job_postings_category
  ON public.job_postings (category) WHERE status = 'PUBLISHED';
CREATE INDEX IF NOT EXISTS idx_job_postings_expiry
  ON public.job_postings (application_deadline) WHERE status IN ('PUBLISHED','PAUSED');

-- -----------------------------------------------------------------------------
-- 3. Historial de estados (solo lo escribe el trigger)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_posting_status_history (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  job_id      uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  from_status text,
  to_status   text NOT NULL,
  changed_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source      text NOT NULL DEFAULT 'direct',
  reason      text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_posting_status_history_job_idx
  ON public.job_posting_status_history (job_id, created_at);
ALTER TABLE public.job_posting_status_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_posting_status_history FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.job_posting_status_history TO authenticated;

DROP POLICY IF EXISTS "Historial: miembros y admin leen" ON public.job_posting_status_history;
CREATE POLICY "Historial: miembros y admin leen" ON public.job_posting_status_history
  FOR SELECT TO authenticated
  USING (
    public.current_user_is_admin()
    OR EXISTS (
      SELECT 1 FROM public.job_postings jp
      JOIN public.company_users cu ON cu.company_id = jp.company_id
      WHERE jp.id = job_posting_status_history.job_id AND cu.user_id = auth.uid()
    )
  );
-- Sin politicas de INSERT/UPDATE/DELETE y sin privilegios: solo el trigger.

CREATE OR REPLACE FUNCTION public.job_posting_log_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_src    text;
  v_reason text;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status IS NOT DISTINCT FROM OLD.status THEN
    RETURN NULL;
  END IF;
  v_src    := COALESCE(NULLIF(current_setting('app.status_source', true), ''), 'direct');
  v_reason := NULLIF(current_setting('app.status_reason', true), '');
  INSERT INTO public.job_posting_status_history (job_id, from_status, to_status, changed_by, source, reason)
  VALUES (NEW.id, CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE OLD.status END, NEW.status, auth.uid(), v_src, v_reason);
  -- Los ajustes son locales a la transaccion: se limpian para no contaminar
  -- otra actualizacion de la misma transaccion.
  PERFORM set_config('app.status_source', '', true);
  PERFORM set_config('app.status_reason', '', true);
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.job_posting_log_status() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_postings_historial_ins ON public.job_postings;
CREATE TRIGGER trg_job_postings_historial_ins
  AFTER INSERT ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.job_posting_log_status();

-- No es «UPDATE OF status»: el BEFORE puede cambiar status (volver a
-- AI_REVIEW) aunque el UPDATE original no lo nombre.
DROP TRIGGER IF EXISTS trg_job_postings_historial_upd ON public.job_postings;
CREATE TRIGGER trg_job_postings_historial_upd
  AFTER UPDATE ON public.job_postings
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION public.job_posting_log_status();

-- -----------------------------------------------------------------------------
-- 4. Cola de correo: ayudas internas (solo ENCOLAN, no envian)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._outbox_enqueue(
  p_kind text, p_to text, p_payload jsonb, p_lang text DEFAULT 'es',
  p_priority integer DEFAULT 5, p_send_after timestamptz DEFAULT now(),
  p_dedupe text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_to IS NULL OR p_to = '' THEN
    RETURN;
  END IF;
  INSERT INTO public.email_outbox (kind, to_email, payload, lang, priority, send_after)
  VALUES (
    p_kind, p_to,
    CASE WHEN p_dedupe IS NULL THEN COALESCE(p_payload, '{}'::jsonb)
         ELSE COALESCE(p_payload, '{}'::jsonb) || jsonb_build_object('dedupe_key', p_dedupe) END,
    COALESCE(p_lang, 'es'), p_priority, p_send_after
  )
  ON CONFLICT ((payload->>'dedupe_key'), to_email) WHERE (payload->>'dedupe_key') IS NOT NULL
  DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public._outbox_enqueue(text,text,jsonb,text,integer,timestamptz,text) FROM PUBLIC, anon, authenticated;

-- Destinatarios de los avisos de una oferta: notify_emails validos (max. 5) o,
-- si no hay, el correo de la empresa.
CREATE OR REPLACE FUNCTION public._job_notify_recipients(p_job_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job  record;
  v_out  text[] := '{}';
  v_mail text;
BEGIN
  SELECT jp.notify_emails, c.company_email INTO v_job
  FROM public.job_postings jp JOIN public.companies c ON c.id = jp.company_id
  WHERE jp.id = p_job_id;
  IF NOT FOUND THEN
    RETURN v_out;
  END IF;
  FOREACH v_mail IN ARRAY COALESCE(v_job.notify_emails, '{}') LOOP
    v_mail := lower(trim(v_mail));
    IF v_mail ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
       AND NOT (v_mail = ANY (v_out)) AND COALESCE(array_length(v_out, 1), 0) < 5 THEN
      v_out := v_out || v_mail;
    END IF;
  END LOOP;
  IF COALESCE(array_length(v_out, 1), 0) = 0 AND v_job.company_email IS NOT NULL THEN
    v_out := ARRAY[lower(trim(v_job.company_email))];
  END IF;
  RETURN v_out;
END;
$$;
REVOKE ALL ON FUNCTION public._job_notify_recipients(uuid) FROM PUBLIC, anon, authenticated;

-- Idioma de la empresa: companies.idioma lo crea la fase 1; to_jsonb tolera
-- que todavia no exista.
CREATE OR REPLACE FUNCTION public._job_company_lang(p_company_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(NULLIF(to_jsonb(c)->>'idioma', ''), 'es')
  FROM public.companies c WHERE c.id = p_company_id;
$$;
REVOKE ALL ON FUNCTION public._job_company_lang(uuid) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Slug limpio (sin tildes, con id corto) y trigger
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.job_slugify(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  -- Transliteracion manual (unaccent puede no estar disponible). Las
  -- mayusculas acentuadas se mapean a mano porque lower() depende de la locale.
  SELECT trim(both '-' FROM regexp_replace(
    lower(translate(
      replace(replace(replace(replace(replace(COALESCE(p_text, ''), 'ß', 'ss'), 'æ', 'ae'), 'Æ', 'AE'), 'œ', 'oe'), 'Œ', 'OE'),
      'àáâãäåāăąÀÁÂÃÄÅĀĂĄçćčÇĆČďđĎĐèéêëēęěÈÉÊËĒĘĚìíîïīÌÍÎÏĪłŁñńňÑŃŇòóôõöőøÒÓÔÕÖŐØùúûüūůűÙÚÛÜŪŮŰýÿÝŸžźżŽŹŻšśŠŚřŕŘŔ',
      'aaaaaaaaaAAAAAAAAAcccCCCddDDeeeeeeeEEEEEEEiiiiiIIIIIlLnnnNNNoooooooOOOOOOOuuuuuuuUUUUUUUyyYYzzzZZZssSSrrRR'
    )),
    '[^a-z0-9]+', '-', 'g'));
$$;

CREATE OR REPLACE FUNCTION public.generate_job_posting_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER   -- ve todas las filas al comprobar colisiones (la RLS ocultaria las ajenas)
SET search_path = public
AS $$
DECLARE
  v_base  text;
  v_city  text;
  v_hex   text;
  v_final text;
  v_n     integer := 8;
BEGIN
  -- Se genera al insertar sin slug o al editar una oferta que NUNCA se publico
  -- (titulo/ciudad cambian y el slug sigue siendo el provisional). Un slug ya
  -- publicado no se toca jamas.
  IF (TG_OP = 'INSERT' AND COALESCE(NEW.slug, '') = '')
     OR (TG_OP = 'UPDATE' AND (
           COALESCE(NEW.slug, '') = ''
           OR (OLD.published_at IS NULL
               AND NEW.slug IS NOT DISTINCT FROM OLD.slug
               AND (NEW.title IS DISTINCT FROM OLD.title
                    OR NEW.location_city IS DISTINCT FROM OLD.location_city))
        ))
  THEN
    v_base := left(public.job_slugify(NEW.title), 60);
    v_city := left(public.job_slugify(NEW.location_city), 30);
    IF v_base = '' THEN
      v_base := 'oferta';
    END IF;
    IF v_city <> '' THEN
      v_base := trim(both '-' FROM v_base) || '-' || trim(both '-' FROM v_city);
    END IF;
    v_hex := replace(NEW.id::text, '-', '');
    v_final := trim(both '-' FROM v_base) || '-' || substr(v_hex, 1, v_n);
    WHILE v_n < 32 AND EXISTS (SELECT 1 FROM public.job_postings WHERE slug = v_final AND id <> NEW.id) LOOP
      v_n := v_n + 4;
      v_final := trim(both '-' FROM v_base) || '-' || substr(v_hex, 1, v_n);
    END LOOP;
    NEW.slug := v_final;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.generate_job_posting_slug() FROM PUBLIC, anon, authenticated;

-- Ofertas sin publicar con el slug antiguo (sin id): se regeneran.
UPDATE public.job_postings
   SET slug = NULL
 WHERE published_at IS NULL AND slug IS NOT NULL
   AND slug !~ '-[0-9a-f]{8,32}$';

-- -----------------------------------------------------------------------------
-- 6. Trigger de proteccion de publicacion (reescrito)
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
  v_hash := md5(COALESCE(NEW.title, '') || '|' || COALESCE(NEW.description, ''));

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

  IF NEW.application_deadline IS DISTINCT FROM OLD.application_deadline
     AND NEW.application_deadline IS NOT NULL
     AND NEW.application_deadline > COALESCE(NEW.published_at, now()) + interval '61 days' THEN
    RAISE EXCEPTION 'DEADLINE_TOO_FAR: el cierre no puede superar 60 dias'
      USING ERRCODE = '22023';
  END IF;

  -- Una oferta que va a quedar PUBLISHED debe tener el texto aprobado: si se
  -- cambia titulo/descripcion (o se reanuda una pausada cuyo texto cambio),
  -- vuelve a revision en vez de quedar publicada.
  IF NEW.status = 'PUBLISHED' THEN
    IF (v_old = 'PUBLISHED' AND (NEW.title IS DISTINCT FROM OLD.title OR NEW.description IS DISTINCT FROM OLD.description))
       OR (v_old = 'PAUSED' AND NEW.reviewed_text_hash IS DISTINCT FROM v_hash) THEN
      NEW.status := 'AI_REVIEW';
      PERFORM set_config('app.status_source', 'edit', true);
      PERFORM set_config('app.status_reason', 'titulo o descripcion modificados', true);
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

UPDATE public.job_postings SET credits_cost = 0 WHERE credits_cost IS DISTINCT FROM 0;

-- La politica de UPDATE «Company members can update their job postings» deja
-- editar a cualquier fila de company_users (tambien VIEWER). Queda la de
-- OWNER/ADMIN/MEMBER.
DROP POLICY IF EXISTS "Company members can update their job postings" ON public.job_postings;

-- -----------------------------------------------------------------------------
-- 7. Denuncias
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.job_reports (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id      uuid NOT NULL REFERENCES public.job_postings(id) ON DELETE CASCADE,
  reporter_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  reason      text NOT NULL CHECK (reason IN ('SCAM','DISCRIMINATORY','MISLEADING','ADULT_ILLEGAL','DUPLICATE','OTHER')),
  details     text CHECK (details IS NULL OR char_length(details) <= 2000),
  status      text NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','REVIEWED','DISMISSED')),
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, reporter_id)
);
CREATE INDEX IF NOT EXISTS job_reports_job_idx ON public.job_reports (job_id, status);
ALTER TABLE public.job_reports ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.job_reports FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.job_reports TO authenticated;

DROP POLICY IF EXISTS "Denuncias: cualquier usuario con sesion denuncia" ON public.job_reports;
CREATE POLICY "Denuncias: cualquier usuario con sesion denuncia" ON public.job_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND status = 'OPEN'
    AND EXISTS (SELECT 1 FROM public.job_postings jp WHERE jp.id = job_reports.job_id AND jp.status = 'PUBLISHED')
  );
DROP POLICY IF EXISTS "Denuncias: admin lee" ON public.job_reports;
CREATE POLICY "Denuncias: admin lee" ON public.job_reports
  FOR SELECT TO authenticated USING (public.current_user_is_admin());
DROP POLICY IF EXISTS "Denuncias: admin gestiona" ON public.job_reports;
CREATE POLICY "Denuncias: admin gestiona" ON public.job_reports
  FOR UPDATE TO authenticated
  USING (public.current_user_is_admin()) WITH CHECK (public.current_user_is_admin());

CREATE OR REPLACE FUNCTION public.job_reports_after_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job   record;
  v_open  integer;
BEGIN
  SELECT jp.id, jp.title, jp.slug, jp.status, jp.company_id INTO v_job
  FROM public.job_postings jp WHERE jp.id = NEW.job_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  PERFORM public._outbox_enqueue(
    'job_reported', 'support@yourcvpassport.com',
    jsonb_build_object('job_id', v_job.id, 'title', v_job.title, 'slug', v_job.slug,
                       'reason', NEW.reason, 'report_id', NEW.id),
    'es', 5, now(), 'job_reported:' || NEW.id);

  SELECT count(*) INTO v_open FROM public.job_reports r
  WHERE r.job_id = NEW.job_id AND r.status = 'OPEN';
  IF v_open >= 3 AND v_job.status = 'PUBLISHED' THEN
    PERFORM set_config('app.status_source', 'report', true);
    PERFORM set_config('app.status_reason', v_open || ' denuncias abiertas', true);
    UPDATE public.job_postings SET status = 'AI_REVIEW', review_reason = v_open || ' denuncias abiertas'
    WHERE id = NEW.job_id;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.job_reports_after_insert() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_job_reports_after_insert ON public.job_reports;
CREATE TRIGGER trg_job_reports_after_insert
  AFTER INSERT ON public.job_reports
  FOR EACH ROW EXECUTE FUNCTION public.job_reports_after_insert();

-- -----------------------------------------------------------------------------
-- 8. Filtros previos baratos (no sustituyen a la IA: solo mandan a revision
--    manual lo evidente cuando la IA no esta disponible)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._job_precheck(p_title text, p_description text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_t text := lower(COALESCE(p_title, '') || ' ' || regexp_replace(COALESCE(p_description, ''), '<[^>]*>', ' ', 'g'));
  v_f text[] := '{}';
BEGIN
  IF v_t ~ '(pago|tasa|cuota|inversi.n)\s+(inicial|previ[ao]|por\s+adelantado|de\s+inscripci.n|de\s+matr.cula)'
     OR v_t ~ '(curso|kit|material)\s+de\s+pago' OR v_t ~ 'paga(r)?\s+por\s+(el|tu)\s+(puesto|empleo|trabajo)'
     OR v_t ~ '(advance\s+fee|registration\s+fee|upfront\s+payment|pay\s+to\s+apply|investment\s+required)' THEN
    v_f := array_append(v_f, 'DINERO'::text);
  END IF;
  IF v_t ~ '(whatsapp|telegram|wa\.me|t\.me|signal\s+app|bit\.ly|tinyurl)' THEN
    v_f := array_append(v_f, 'CONTACTO_EXTERNO'::text);
  END IF;
  IF v_t ~ '(multinivel|pir.mide|network\s+marketing|\mmlm\M)' THEN
    v_f := array_append(v_f, 'MULTINIVEL'::text);
  END IF;
  IF v_t ~ '(solo|s.lo|unicamente|.nicamente)\s+(hombres|mujeres)' OR v_t ~ 'only\s+(men|women)'
     OR v_t ~ 'menor(es)?\s+de\s+[0-9]+\s+a.os' OR v_t ~ 'under\s+[0-9]+\s+years'
     OR v_t ~ '(sin\s+hijos|buena\s+presencia|estado\s+civil)' THEN
    v_f := array_append(v_f, 'DISCRIMINACION'::text);
  END IF;
  IF v_t ~ '(escort|onlyfans|contenido\s+adulto|adult\s+content)' THEN
    v_f := array_append(v_f, 'ADULTO'::text);
  END IF;
  RETURN v_f;
END;
$$;
REVOKE ALL ON FUNCTION public._job_precheck(text,text) FROM PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 9. Enviar a revision (sin cobro). Nucleo comun de submit_job_for_review y
--    publish_job_posting
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
REVOKE ALL ON FUNCTION public._job_submit(uuid,uuid,integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.submit_job_for_review(p_job_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: esta funcion requiere un usuario autenticado' USING ERRCODE = '42501';
  END IF;
  RETURN public._job_submit(p_job_id, auth.uid(), 30);
END;
$$;
REVOKE ALL ON FUNCTION public.submit_job_for_review(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_job_for_review(uuid) TO authenticated, service_role;

-- Misma firma que antes. Ya NO cobra creditos y ya NO publica: envia a revision.
CREATE OR REPLACE FUNCTION public.publish_job_posting(
  p_job_posting_id uuid,
  p_company_id uuid,
  p_user_id uuid,
  p_duration_days integer DEFAULT 30
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.assert_caller_matches_user(p_user_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.company_users
    WHERE company_id = p_company_id AND user_id = p_user_id
      AND role IN ('OWNER', 'ADMIN', 'MEMBER')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: User is not authorized to publish job postings for this company'
      USING ERRCODE = '42501';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.job_postings WHERE id = p_job_posting_id AND company_id = p_company_id) THEN
    RAISE EXCEPTION 'Job posting not found or does not belong to this company';
  END IF;

  RETURN public._job_submit(p_job_posting_id, p_user_id, p_duration_days);
END;
$$;
REVOKE ALL ON FUNCTION public.publish_job_posting(uuid,uuid,uuid,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_job_posting(uuid,uuid,uuid,integer) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 10. Moderacion (admin o service_role)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.moderar_oferta(p_job_id uuid, p_decision text, p_motivo text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dec      text := upper(btrim(COALESCE(p_decision, '')));
  v_motivo   text := left(NULLIF(btrim(COALESCE(p_motivo, '')), ''), 1000);
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
REVOKE ALL ON FUNCTION public.moderar_oferta(uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.moderar_oferta(uuid,text,text) TO authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 11. Caducidad diaria (idempotente) + aviso 3 dias antes
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.expire_job_postings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r         record;
  v_mail    text;
  v_expired integer := 0;
  v_notices integer := 0;
BEGIN
  -- 1. Aviso a los 3 dias de caducar (una sola vez por fecha de cierre)
  FOR r IN
    SELECT jp.id, jp.title, jp.slug, jp.company_id, jp.application_deadline, c.company_name
    FROM public.job_postings jp JOIN public.companies c ON c.id = jp.company_id
    WHERE jp.status = 'PUBLISHED'
      AND jp.application_deadline > now()
      AND jp.application_deadline <= now() + interval '3 days'
      AND jp.expires_notice_sent_at IS NULL
    FOR UPDATE OF jp SKIP LOCKED
  LOOP
    FOREACH v_mail IN ARRAY public._job_notify_recipients(r.id) LOOP
      PERFORM public._outbox_enqueue('job_expiring', v_mail,
        jsonb_build_object('job_id', r.id, 'title', r.title, 'slug', r.slug, 'company_name', r.company_name,
                           'application_deadline', r.application_deadline),
        public._job_company_lang(r.company_id), 5, now(),
        'job_expiring:' || r.id || ':' || to_char(r.application_deadline AT TIME ZONE 'UTC', 'YYYYMMDDHH24MI'));
    END LOOP;
    UPDATE public.job_postings SET expires_notice_sent_at = now() WHERE id = r.id;
    v_notices := v_notices + 1;
  END LOOP;

  -- 2. Cierre de las vencidas
  FOR r IN
    SELECT jp.id, jp.title, jp.slug, jp.company_id, c.company_name
    FROM public.job_postings jp JOIN public.companies c ON c.id = jp.company_id
    WHERE jp.status IN ('PUBLISHED', 'PAUSED')
      AND jp.application_deadline IS NOT NULL
      AND jp.application_deadline <= now()
    FOR UPDATE OF jp SKIP LOCKED
  LOOP
    PERFORM set_config('app.status_source', 'expire', true);
    PERFORM set_config('app.status_reason', 'fecha de cierre alcanzada', true);
    UPDATE public.job_postings SET status = 'EXPIRED', closed_at = now() WHERE id = r.id;
    FOREACH v_mail IN ARRAY public._job_notify_recipients(r.id) LOOP
      PERFORM public._outbox_enqueue('job_expired', v_mail,
        jsonb_build_object('job_id', r.id, 'title', r.title, 'company_name', r.company_name),
        public._job_company_lang(r.company_id), 7, now(), 'job_expired:' || r.id);
    END LOOP;
    v_expired := v_expired + 1;
  END LOOP;

  RETURN jsonb_build_object('expired', v_expired, 'notices', v_notices);
END;
$$;
REVOKE ALL ON FUNCTION public.expire_job_postings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_job_postings() TO service_role;

-- pg_cron no esta instalado hoy en produccion: si no existe, se avisa y listo
-- (se puede llamar desde una Edge Function programada con service_role).
DO $$
BEGIN
  IF to_regnamespace('cron') IS NOT NULL THEN
    PERFORM cron.schedule('expire-job-postings', '15 3 * * *', 'select public.expire_job_postings()');
  ELSE
    RAISE NOTICE 'pg_cron no esta instalado: programa expire_job_postings() desde fuera (service_role, 1 vez al dia)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'No se pudo programar pg_cron (%): programa expire_job_postings() desde fuera', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 12. Listado publico v2 (no sustituye a search_public_jobs)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.search_public_jobs_v2(text,text,text,text,text,numeric,int,text,text,int,int);
CREATE FUNCTION public.search_public_jobs_v2(
  p_country           text    DEFAULT NULL,
  p_category          text    DEFAULT NULL,
  p_work_mode         text    DEFAULT NULL,
  p_contract          text    DEFAULT NULL,
  p_schedule          text    DEFAULT NULL,
  p_min_salary        numeric DEFAULT NULL,   -- mensual, en la moneda local del pais
  p_posted_within_days integer DEFAULT NULL,  -- 1 (24 h), 7, 30
  p_search            text    DEFAULT NULL,   -- puesto / palabra / empresa
  p_city              text    DEFAULT NULL,
  p_limit             integer DEFAULT 20,
  p_offset            integer DEFAULT 0
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
    AND (p_country IS NULL
         OR jp.country_code = upper(p_country)
         OR (jp.work_mode = 'REMOTE' AND jp.allowed_countries IS NOT NULL
             AND upper(p_country) = ANY (jp.allowed_countries)))
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
    AND (p_posted_within_days IS NULL OR jp.published_at >= now() - make_interval(days => p_posted_within_days))
    AND (v_search IS NULL
         OR jp.title ILIKE v_search OR jp.description ILIKE v_search OR c.company_name ILIKE v_search)
    AND (v_city IS NULL OR jp.location_city ILIKE v_city)
  ORDER BY jp.published_at DESC, jp.id
  LIMIT v_limit OFFSET v_offset;
END;
$$;
REVOKE ALL ON FUNCTION public.search_public_jobs_v2(text,text,text,text,text,numeric,int,text,text,int,int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_jobs_v2(text,text,text,text,text,numeric,int,text,text,int,int)
  TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 13. Ficha publica (versionada: columnas de produccion + nuevas AL FINAL)
-- -----------------------------------------------------------------------------
-- Cambia el tipo de retorno, asi que hay que borrarla y volver a darle los
-- privilegios que tenia (anon, authenticated, service_role). Cambios de
-- comportamiento: tambien devuelve ofertas CLOSED / FILLED / EXPIRED (para
-- mostrar «ya no admite candidaturas»; mira accepting_applications) y el
-- salario solo sale si show_salary.
DROP FUNCTION IF EXISTS public.get_job_posting_detail(character varying);
CREATE FUNCTION public.get_job_posting_detail(p_slug character varying)
RETURNS TABLE(
  id uuid, title character varying, slug character varying, company_id uuid, department character varying,
  employment_type character varying, work_mode character varying, experience_level character varying,
  location_city character varying, location_state character varying, location_country character varying,
  is_remote boolean, description text, responsibilities text[], requirements text[], nice_to_have text[],
  benefits text[], required_skills character varying[], optional_skills character varying[],
  salary_min integer, salary_max integer, salary_currency character varying, salary_period character varying,
  show_salary boolean, application_deadline timestamp with time zone, application_email character varying,
  application_url text, application_instructions text, published_at timestamp with time zone,
  company_name character varying, company_logo_url text, company_website text, company_description text,
  -- nuevas
  status character varying, accepting_applications boolean, closed_at timestamp with time zone,
  country_code text, category text, category2 text, vacancies integer, contract_types text[],
  schedule text, duration text, start_date date, start_immediate boolean, salary_mode text,
  education_min text, experience_years integer, languages jsonb, cover_letter_mode text,
  allowed_countries text[]
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    jp.id, jp.title, jp.slug, jp.company_id, jp.department, jp.employment_type, jp.work_mode,
    jp.experience_level, jp.location_city, jp.location_state, jp.location_country, jp.is_remote,
    jp.description, jp.responsibilities, jp.requirements, jp.nice_to_have, jp.benefits,
    jp.required_skills, jp.optional_skills,
    CASE WHEN jp.show_salary THEN jp.salary_min END,
    CASE WHEN jp.show_salary THEN jp.salary_max END,
    CASE WHEN jp.show_salary THEN jp.salary_currency END,
    CASE WHEN jp.show_salary THEN jp.salary_period END,
    jp.show_salary, jp.application_deadline, jp.application_email, jp.application_url,
    jp.application_instructions, jp.published_at,
    c.company_name, c.logo_url, c.website, c.description,
    jp.status,
    (jp.status = 'PUBLISHED' AND (jp.application_deadline IS NULL OR jp.application_deadline > now())),
    jp.closed_at, jp.country_code, jp.category, jp.category2, jp.vacancies, jp.contract_types,
    jp.schedule, jp.duration, jp.start_date, jp.start_immediate,
    CASE WHEN jp.show_salary THEN jp.salary_mode END,
    jp.education_min, jp.experience_years, jp.languages, jp.cover_letter_mode, jp.allowed_countries
  FROM public.job_postings jp
  JOIN public.companies c ON c.id = jp.company_id
  WHERE jp.slug = p_slug
    AND jp.status IN ('PUBLISHED', 'CLOSED', 'FILLED', 'EXPIRED')
    AND jp.published_at IS NOT NULL
    AND c.status = 'APPROVED';
END;
$$;
REVOKE ALL ON FUNCTION public.get_job_posting_detail(character varying) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_job_posting_detail(character varying) TO anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- 14. Privilegios de job_postings: anon solo ve una lista blanca de columnas
-- -----------------------------------------------------------------------------
-- La RLS publica sigue filtrando FILAS (PUBLISHED, con published_at y sin
-- vencer). Las expresiones de las politicas no comprueban privilegios de
-- columna, asi que las politicas de job_posting_questions siguen funcionando.
REVOKE SELECT ON public.job_postings FROM anon;
GRANT SELECT (
  id, created_at, updated_at, company_id, title, slug, department, employment_type, work_mode,
  experience_level, location_city, location_state, location_country, is_remote, description,
  responsibilities, requirements, nice_to_have, benefits, required_skills, optional_skills,
  salary_min, salary_max, salary_currency, salary_period, show_salary, application_deadline,
  application_email, application_url, application_instructions, status, published_at, closed_at,
  meta_title, meta_description, views_count, applications_count,
  country_code, category, category2, vacancies, contract_types, schedule, duration, start_date,
  start_immediate, salary_mode, education_min, experience_years, languages, cover_letter_mode,
  allowed_countries
) ON public.job_postings TO anon;
-- Cerradas a anon: created_by, credits_cost, metadata, notify_emails,
-- notify_frequency, review_reason, reviewed_at, reviewed_by, reviewed_text_hash,
-- closed_by, expires_notice_sent_at.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.job_postings FROM anon;
REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.job_postings FROM authenticated;

-- -----------------------------------------------------------------------------
-- 15. Comprobaciones finales (abortan la migracion si fallan)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF has_column_privilege('anon', 'public.job_postings', 'notify_emails', 'SELECT')
     OR has_column_privilege('anon', 'public.job_postings', 'review_reason', 'SELECT')
     OR has_column_privilege('anon', 'public.job_postings', 'created_by', 'SELECT') THEN
    RAISE EXCEPTION 'anon sigue pudiendo leer columnas privadas de job_postings';
  END IF;
  IF NOT has_column_privilege('anon', 'public.job_postings', 'slug', 'SELECT') THEN
    RAISE EXCEPTION 'anon deberia leer slug (sitemap)';
  END IF;
  IF has_table_privilege('anon', 'public.email_outbox', 'SELECT')
     OR has_table_privilege('authenticated', 'public.email_outbox', 'SELECT') THEN
    RAISE EXCEPTION 'email_outbox debe ser solo de service_role';
  END IF;
END $$;

COMMIT;
