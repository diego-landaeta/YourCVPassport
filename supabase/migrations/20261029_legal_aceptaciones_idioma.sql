-- =============================================================================
-- Bolsa de empleo, fase 1 (#6): condiciones legales con aceptación registrada,
-- idioma de registro, fecha de nacimiento, datos de contacto de empresa,
-- revisiones de IA de empresas y tabla de países
-- =============================================================================
--
-- ORDEN: primera de las migraciones de la bolsa de empleo.
--   20261029_legal_aceptaciones_idioma.sql   (ESTA, fase 1)
--   20261030_ofertas_fase2.sql
--   20261031_candidaturas_fase3.sql
--
-- QUÉ HACE
--   1. countries: tabla común de países y moneda (definición compartida con las
--      fases 2 y 3: CREATE TABLE IF NOT EXISTS). 40 países: los 21 de habla
--      hispana y 19 de Europa. SELECT público; escritura solo admin.
--   2. documentos_legales: textos legales versionados (terminos_candidato,
--      terminos_empleador, privacidad, cookies) por idioma (es / en).
--      Lectura pública SOLO de la versión vigente de cada (tipo, idioma);
--      un usuario además ve las versiones que ya aceptó. Escritura solo admin.
--      Una versión que ya está en vigor no se puede editar (texto, versión...):
--      se publica una versión nueva. Semilla v1.0 (es y en), vigente desde
--      2026-10-29, marcada `borrador = true`: texto genérico breve pendiente de
--      revisión por abogado.
--   3. aceptaciones: registro de aceptaciones. SOLO se escribe con la RPC
--      registrar_aceptacion (SECURITY DEFINER); la IP y el navegador salen de
--      las cabeceras de la petición (cf-connecting-ip, x-forwarded-for,
--      user-agent), NUNCA de un argumento del cliente. Un trigger impide
--      UPDATE, DELETE y TRUNCATE (única excepción: poner a NULL user_id /
--      oferta_id / company_id cuando se borra la cuenta, la oferta o la
--      empresa; la fila y la copia del correo se conservan como prueba).
--      Cada usuario ve las suyas; el admin ve todas.
--   4. documentos_pendientes(): versiones vigentes que el usuario aún no ha
--      aceptado (en su idioma de registro; si no hay texto en él, español).
--      Es lo que debe consultar la «puerta» de aceptación al entrar. NO se
--      inserta ninguna aceptación para los usuarios existentes: a ellos se les
--      pide aceptar al entrar por primera vez, vía esta función.
--   5. profiles: columnas PRIVADAS registro_idioma y fecha_nacimiento. No se
--      conceden a anon ni a authenticated (el cierre por columnas de
--      20261006 deja fuera todo lo que no esté en su lista pública); se leen
--      desde profiles_full (la propia fila, el gestor o el admin).
--   6. companies: country_code (-> countries), idioma, contact_name,
--      contact_position (también privadas: companies_full) y nuevo CHECK de
--      company_size (1-10, 11-50, 51-250, 250+). El correo y el teléfono de
--      contacto siguen siendo company_email / company_phone.
--   7. company_ai_reviews: resultado y motivos de la revisión con IA de cada
--      empresa. Solo lectura para admin; escribe service_role.
--   8. handle_new_user: además de lo que ya hacía, guarda el idioma
--      (raw_user_meta_data: registro_idioma | idioma | lang) y la fecha de
--      nacimiento (fecha_nacimiento, formato AAAA-MM-DD). Un valor mal
--      formado se ignora (NULL): nunca puede impedir el alta del perfil.
--   9. profiles_full y companies_full se recrean con CREATE OR REPLACE VIEW,
--      con las columnas nuevas AL FINAL (mantienen security_barrier y los
--      GRANT: solo SELECT para authenticated).
--
-- COMPROBACIONES ANTES DE APLICAR (SQL editor)
--   select to_regclass('public.documentos_legales'), to_regclass('public.aceptaciones'),
--          to_regclass('public.countries');                 -- los tres NULL (o ya aplicada)
--   select count(*) from public.companies;                   -- hoy 0
--   select company_size, count(*) from public.companies group by 1; -- si hubiera
--        filas con 51-200 / 201-500 / 501-1000 / 1000+ se convierten (ver 6).
--   select pg_get_functiondef('public.handle_new_user'::regproc); -- debe coincidir
--        con la de 20260109_fix_email_as_name.sql (sin cambios posteriores).
--
-- DESPUÉS DE APLICAR
--   select count(*) from public.documentos_legales;          -- 8
--   select count(*) from public.countries;                   -- 40
--   select count(*) from public.aceptaciones;                -- 0 (no se aplica a nadie)
--
-- CÓMO REVERTIR (solo si todavía no hay aceptaciones reales: borrarlas es
-- precisamente lo que esta migración impide)
--   CREATE OR REPLACE FUNCTION public.handle_new_user() ... -- la de 20260109_fix_email_as_name.sql
--   DROP TABLE public.company_ai_reviews;
--   ALTER TABLE public.companies DROP COLUMN country_code, DROP COLUMN idioma,
--     DROP COLUMN contact_name, DROP COLUMN contact_position;
--   (y restaurar companies_company_size_check con los valores antiguos)
--   ALTER TABLE public.profiles DROP COLUMN registro_idioma, DROP COLUMN fecha_nacimiento;
--   (antes, volver a crear profiles_full y companies_full sin esas columnas:
--    CREATE OR REPLACE no puede quitar columnas, hay que DROP + CREATE + GRANT)
--   DROP FUNCTION public.registrar_aceptacion(uuid[], jsonb, text, uuid, uuid);
--   DROP FUNCTION public.documentos_pendientes();
--   DROP TABLE public.aceptaciones; DROP TABLE public.documentos_legales;
--   DROP FUNCTION public.documento_legal_vigente(uuid);
--   countries se deja (la usan las fases 2 y 3).
--
-- Idempotente: se puede ejecutar varias veces.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 0. Comprobación previa: objetos de los que depende
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_missing text[] := '{}';
  v_obj text;
BEGIN
  FOREACH v_obj IN ARRAY ARRAY[
    'public.profiles', 'public.companies', 'public.company_users',
    'public.job_postings', 'public.profiles_full', 'public.companies_full'
  ] LOOP
    IF to_regclass(v_obj) IS NULL THEN
      v_missing := v_missing || v_obj;
    END IF;
  END LOOP;
  IF to_regclass('auth.users') IS NULL THEN
    v_missing := v_missing || 'auth.users';
  END IF;
  IF to_regprocedure('public.current_user_is_admin()') IS NULL THEN
    v_missing := v_missing || 'public.current_user_is_admin()';
  END IF;
  IF to_regprocedure('public.is_company_member(uuid,text[])') IS NULL THEN
    v_missing := v_missing || 'public.is_company_member(uuid,text[])';
  END IF;
  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION 'ABORTADO: faltan objetos de los que depende esta migración (aplicar antes 20261005_proteger_datos_profiles.sql y 20261009_proteger_datos_companies.sql): %',
      array_to_string(v_missing, ', ');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. countries (definición común a las fases 1, 2 y 3)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.countries (
  code text PRIMARY KEY,
  name_es text NOT NULL,
  name_en text NOT NULL,
  currency text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.countries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "countries_select_publico" ON public.countries;
CREATE POLICY "countries_select_publico" ON public.countries
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "countries_admin_escribe" ON public.countries;
CREATE POLICY "countries_admin_escribe" ON public.countries
  FOR ALL TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

REVOKE ALL ON public.countries FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.countries TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.countries TO authenticated;
GRANT ALL ON public.countries TO service_role;

COMMENT ON TABLE public.countries IS
'Países en los que opera la bolsa de empleo y su moneda local. Lectura pública; escribe solo un admin.';

INSERT INTO public.countries (code, name_es, name_en, currency) VALUES
  -- Habla hispana (21)
  ('ES', 'España', 'Spain', 'EUR'),
  ('MX', 'México', 'Mexico', 'MXN'),
  ('AR', 'Argentina', 'Argentina', 'ARS'),
  ('CL', 'Chile', 'Chile', 'CLP'),
  ('CO', 'Colombia', 'Colombia', 'COP'),
  ('PE', 'Perú', 'Peru', 'PEN'),
  ('EC', 'Ecuador', 'Ecuador', 'USD'),
  ('UY', 'Uruguay', 'Uruguay', 'UYU'),
  ('PY', 'Paraguay', 'Paraguay', 'PYG'),
  ('BO', 'Bolivia', 'Bolivia', 'BOB'),
  ('VE', 'Venezuela', 'Venezuela', 'VES'),
  ('CR', 'Costa Rica', 'Costa Rica', 'CRC'),
  ('PA', 'Panamá', 'Panama', 'USD'),
  ('DO', 'República Dominicana', 'Dominican Republic', 'DOP'),
  ('GT', 'Guatemala', 'Guatemala', 'GTQ'),
  ('HN', 'Honduras', 'Honduras', 'HNL'),
  ('SV', 'El Salvador', 'El Salvador', 'USD'),
  ('NI', 'Nicaragua', 'Nicaragua', 'NIO'),
  ('CU', 'Cuba', 'Cuba', 'CUP'),
  ('PR', 'Puerto Rico', 'Puerto Rico', 'USD'),
  ('GQ', 'Guinea Ecuatorial', 'Equatorial Guinea', 'XAF'),
  -- Europa (19)
  ('DE', 'Alemania', 'Germany', 'EUR'),
  ('FR', 'Francia', 'France', 'EUR'),
  ('IT', 'Italia', 'Italy', 'EUR'),
  ('PT', 'Portugal', 'Portugal', 'EUR'),
  ('GB', 'Reino Unido', 'United Kingdom', 'GBP'),
  ('IE', 'Irlanda', 'Ireland', 'EUR'),
  ('NL', 'Países Bajos', 'Netherlands', 'EUR'),
  ('BE', 'Bélgica', 'Belgium', 'EUR'),
  ('CH', 'Suiza', 'Switzerland', 'CHF'),
  ('AT', 'Austria', 'Austria', 'EUR'),
  ('PL', 'Polonia', 'Poland', 'PLN'),
  ('SE', 'Suecia', 'Sweden', 'SEK'),
  ('NO', 'Noruega', 'Norway', 'NOK'),
  ('DK', 'Dinamarca', 'Denmark', 'DKK'),
  ('FI', 'Finlandia', 'Finland', 'EUR'),
  ('GR', 'Grecia', 'Greece', 'EUR'),
  ('RO', 'Rumanía', 'Romania', 'RON'),
  ('CZ', 'Chequia', 'Czechia', 'CZK'),
  ('HU', 'Hungría', 'Hungary', 'HUF')
ON CONFLICT (code) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 1b. profiles: idioma de registro y fecha de nacimiento (PRIVADAS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS registro_idioma text
    CHECK (registro_idioma IS NULL OR registro_idioma ~ '^[a-z]{2,3}$'),
  ADD COLUMN IF NOT EXISTS fecha_nacimiento date
    CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento >= DATE '1900-01-01');

-- No se hace GRANT SELECT de estas columnas: 20261006 solo concede a
-- anon/authenticated una lista cerrada de columnas públicas. Se leen desde
-- profiles_full. (Por si algún entorno aún tuviera SELECT a nivel de tabla:)
DO $$
BEGIN
  IF has_table_privilege('anon', 'public.profiles', 'SELECT')
     OR has_table_privilege('authenticated', 'public.profiles', 'SELECT') THEN
    RAISE WARNING 'profiles tiene SELECT a nivel de tabla para anon/authenticated: registro_idioma y fecha_nacimiento serían legibles. Aplicar 20261006_cerrar_columnas_privadas_profiles_stamps.sql.';
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.registro_idioma IS
'Idioma (ISO 639-1, minúsculas) con el que se registró el usuario. Privada: se lee por profiles_full.';
COMMENT ON COLUMN public.profiles.fecha_nacimiento IS
'Fecha de nacimiento declarada en el registro (control de edad: <16 no, 16-18 con tutor). Dato personal PRIVADO: se lee por profiles_full.';

-- -----------------------------------------------------------------------------
-- 1c. companies: país, idioma, contacto y company_size
-- -----------------------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS country_code text REFERENCES public.countries(code),
  ADD COLUMN IF NOT EXISTS idioma text
    CHECK (idioma IS NULL OR idioma ~ '^[a-z]{2,3}$'),
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS contact_position text;

COMMENT ON COLUMN public.companies.country_code IS
'País de la empresa (countries.code). Obligatorio en el formulario; la columna admite NULL por las empresas anteriores.';

-- Primero se quita el CHECK antiguo: sus valores no admiten los tramos nuevos y el UPDATE de abajo fallaria
-- con cualquier empresa existente de 51-200, 201-500, 501-1000 o 1000+ (hallazgo de la prueba integrada).
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_company_size_check;

-- Equivalencia de los tramos antiguos con los nuevos.
UPDATE public.companies SET company_size = '51-250'
 WHERE company_size = '51-200';
UPDATE public.companies SET company_size = '250+'
 WHERE company_size IN ('201-500', '501-1000', '1000+');

ALTER TABLE public.companies ADD CONSTRAINT companies_company_size_check
  CHECK (company_size IS NULL OR (company_size)::text = ANY (ARRAY['1-10', '11-50', '51-250', '250+']));

-- -----------------------------------------------------------------------------
-- 2. documentos_legales
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documentos_legales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo text NOT NULL
    CHECK (tipo IN ('terminos_candidato', 'terminos_empleador', 'privacidad', 'cookies')),
  version text NOT NULL CHECK (length(version) BETWEEN 1 AND 20),
  idioma text NOT NULL CHECK (idioma ~ '^[a-z]{2,3}$'),
  titulo text NOT NULL,
  texto text NOT NULL,
  -- A quién se le exige: 'todos', 'candidato' (role professional) o
  -- 'empleador' (miembro de una empresa o role employer).
  audiencia text NOT NULL DEFAULT 'todos'
    CHECK (audiencia IN ('todos', 'candidato', 'empleador')),
  -- false = informativo (p. ej. cookies): no aparece en documentos_pendientes.
  requiere_aceptacion boolean NOT NULL DEFAULT true,
  -- Claves de `casillas` que deben venir a true en registrar_aceptacion.
  casillas_obligatorias text[] NOT NULL DEFAULT '{}',
  -- true = texto provisional pendiente de revisión por un abogado.
  borrador boolean NOT NULL DEFAULT true,
  vigente_desde timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tipo, version, idioma)
);

CREATE INDEX IF NOT EXISTS documentos_legales_tipo_idioma_idx
  ON public.documentos_legales (tipo, idioma, vigente_desde DESC);

ALTER TABLE public.documentos_legales ENABLE ROW LEVEL SECURITY;

-- ¿Es esta la versión en vigor de su (tipo, idioma)? SECURITY DEFINER para poder
-- usarla dentro de las políticas de la propia tabla sin recursión.
CREATE OR REPLACE FUNCTION public.documento_legal_vigente(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documentos_legales d
    WHERE d.id = p_id
      AND d.vigente_desde <= now()
      AND NOT EXISTS (
        SELECT 1
        FROM public.documentos_legales n
        WHERE n.tipo = d.tipo
          AND n.idioma = d.idioma
          AND n.vigente_desde <= now()
          AND n.vigente_desde > d.vigente_desde
      )
  );
$$;

REVOKE ALL ON FUNCTION public.documento_legal_vigente(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.documento_legal_vigente(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "documentos_legales_select_vigentes" ON public.documentos_legales;
CREATE POLICY "documentos_legales_select_vigentes" ON public.documentos_legales
  FOR SELECT TO anon, authenticated
  USING (public.documento_legal_vigente(id));

-- (la política "documentos_legales_select_aceptados", que lee aceptaciones, se
--  crea en la sección 3, después de esa tabla)

DROP POLICY IF EXISTS "documentos_legales_admin_escribe" ON public.documentos_legales;
CREATE POLICY "documentos_legales_admin_escribe" ON public.documentos_legales
  FOR ALL TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

REVOKE ALL ON public.documentos_legales FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.documentos_legales TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.documentos_legales TO authenticated;
GRANT ALL ON public.documentos_legales TO service_role;

COMMENT ON TABLE public.documentos_legales IS
'Textos legales versionados por idioma. Lectura pública solo de la versión vigente. Una versión ya en vigor no se edita: se publica otra.';

-- Una versión en vigor es inmutable (es lo que firmó el usuario).
CREATE OR REPLACE FUNCTION public.documentos_legales_proteger()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.vigente_desde <= now() THEN
      RAISE EXCEPTION 'DOCUMENTO_EN_VIGOR: una versión ya en vigor no se borra; publica una versión nueva'
        USING ERRCODE = '42501';
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.vigente_desde <= now()
     AND (NEW.tipo IS DISTINCT FROM OLD.tipo
       OR NEW.version IS DISTINCT FROM OLD.version
       OR NEW.idioma IS DISTINCT FROM OLD.idioma
       OR NEW.titulo IS DISTINCT FROM OLD.titulo
       OR NEW.texto IS DISTINCT FROM OLD.texto
       OR NEW.audiencia IS DISTINCT FROM OLD.audiencia
       OR NEW.requiere_aceptacion IS DISTINCT FROM OLD.requiere_aceptacion
       OR NEW.casillas_obligatorias IS DISTINCT FROM OLD.casillas_obligatorias
       OR NEW.vigente_desde IS DISTINCT FROM OLD.vigente_desde) THEN
    RAISE EXCEPTION 'DOCUMENTO_EN_VIGOR: una versión ya en vigor no se edita; publica una versión nueva'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.documentos_legales_proteger() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_documentos_legales_proteger ON public.documentos_legales;
CREATE TRIGGER trg_documentos_legales_proteger
  BEFORE UPDATE OR DELETE ON public.documentos_legales
  FOR EACH ROW EXECUTE FUNCTION public.documentos_legales_proteger();

-- -----------------------------------------------------------------------------
-- 3. aceptaciones
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.aceptaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- SET NULL: borrar una cuenta no puede bloquearse ni borrar la prueba.
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email text,                       -- copia del correo en el momento
  documento_id uuid NOT NULL REFERENCES public.documentos_legales(id) ON DELETE RESTRICT,
  tipo text NOT NULL,                    -- copia de documentos_legales.tipo
  version text NOT NULL,                 -- copia de documentos_legales.version
  casillas jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip inet,                               -- SIEMPRE de las cabeceras del servidor
  user_agent text,                       -- idem
  contexto text NOT NULL
    CHECK (contexto IN ('registro', 'inscripcion', 'publicacion', 'nueva_version')),
  oferta_id uuid REFERENCES public.job_postings(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS aceptaciones_user_tipo_version_idx
  ON public.aceptaciones (user_id, tipo, version);
CREATE INDEX IF NOT EXISTS aceptaciones_documento_idx
  ON public.aceptaciones (documento_id);

ALTER TABLE public.aceptaciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "aceptaciones_select_propias" ON public.aceptaciones;
CREATE POLICY "aceptaciones_select_propias" ON public.aceptaciones
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Un usuario puede leer las versiones de documentos que ya aceptó (aunque ya no
-- estén vigentes), p. ej. para descargarlas desde su panel.
DROP POLICY IF EXISTS "documentos_legales_select_aceptados" ON public.documentos_legales;
CREATE POLICY "documentos_legales_select_aceptados" ON public.documentos_legales
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.aceptaciones a
    WHERE a.documento_id = documentos_legales.id AND a.user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "aceptaciones_select_admin" ON public.aceptaciones;
CREATE POLICY "aceptaciones_select_admin" ON public.aceptaciones
  FOR SELECT TO authenticated
  USING (public.current_user_is_admin());

-- Sin políticas de INSERT/UPDATE/DELETE y sin privilegios: solo la RPC escribe.
REVOKE ALL ON public.aceptaciones FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON public.aceptaciones TO authenticated;
GRANT SELECT, INSERT ON public.aceptaciones TO service_role;

COMMENT ON TABLE public.aceptaciones IS
'Registro inmutable de aceptaciones legales. Se escribe solo con registrar_aceptacion(); IP y navegador los toma el servidor.';

-- Inmutabilidad: ni UPDATE ni DELETE ni TRUNCATE. Única excepción: anonimizar la
-- referencia (user_id / oferta_id / company_id -> NULL) al borrar la cuenta, la
-- oferta o la empresa (acciones ON DELETE SET NULL de las claves foráneas).
CREATE OR REPLACE FUNCTION public.aceptaciones_inmutable()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF (to_jsonb(NEW) - 'user_id' - 'oferta_id' - 'company_id')
         = (to_jsonb(OLD) - 'user_id' - 'oferta_id' - 'company_id')
       AND (NEW.user_id IS NULL OR NEW.user_id IS NOT DISTINCT FROM OLD.user_id)
       AND (NEW.oferta_id IS NULL OR NEW.oferta_id IS NOT DISTINCT FROM OLD.oferta_id)
       AND (NEW.company_id IS NULL OR NEW.company_id IS NOT DISTINCT FROM OLD.company_id) THEN
      RETURN NEW;
    END IF;
  END IF;
  RAISE EXCEPTION 'ACEPTACION_INMUTABLE: las aceptaciones no se modifican ni se borran (% en aceptaciones)', TG_OP
    USING ERRCODE = '42501';
END;
$$;

REVOKE ALL ON FUNCTION public.aceptaciones_inmutable() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_aceptaciones_inmutable ON public.aceptaciones;
CREATE TRIGGER trg_aceptaciones_inmutable
  BEFORE UPDATE OR DELETE ON public.aceptaciones
  FOR EACH ROW EXECUTE FUNCTION public.aceptaciones_inmutable();

DROP TRIGGER IF EXISTS trg_aceptaciones_no_truncate ON public.aceptaciones;
CREATE TRIGGER trg_aceptaciones_no_truncate
  BEFORE TRUNCATE ON public.aceptaciones
  FOR EACH STATEMENT EXECUTE FUNCTION public.aceptaciones_inmutable();

-- RPC de registro. El cliente NO puede enviar IP ni navegador.
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
  v_raw_ip text;
  v_ip inet;
  v_ua text;
  v_doc record;
  v_clave text;
  v_ids uuid[] := '{}';
  v_new uuid;
  v_oferta_company uuid;
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
  BEGIN
    v_headers := NULLIF(current_setting('request.headers', true), '')::json;
  EXCEPTION WHEN OTHERS THEN
    v_headers := NULL;
  END;
  v_raw_ip := COALESCE(
    NULLIF(btrim(v_headers->>'cf-connecting-ip'), ''),
    NULLIF(btrim(split_part(COALESCE(v_headers->>'x-forwarded-for', ''), ',', 1)), '')
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
      (user_id, user_email, documento_id, tipo, version, casillas, ip, user_agent, contexto, oferta_id, company_id)
    VALUES
      (v_uid, v_email, v_doc.id, v_doc.tipo, v_doc.version, p_casillas, v_ip, v_ua, p_contexto, p_oferta_id, p_company_id)
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
'Registra la aceptación (una fila por documento) del usuario autenticado. Valida que el documento sea la versión vigente y que las casillas obligatorias vengan a true. IP y navegador se toman de request.headers, nunca del cliente. Devuelve los ids creados.';

-- Versiones vigentes que el usuario todavía no ha aceptado.
CREATE OR REPLACE FUNCTION public.documentos_pendientes()
RETURNS TABLE (
  documento_id uuid,
  tipo text,
  version text,
  idioma text,
  titulo text,
  texto text,
  audiencia text,
  casillas_obligatorias text[],
  borrador boolean,
  vigente_desde timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT d.id, d.tipo, d.version, d.idioma, d.titulo, d.texto, d.audiencia,
         d.casillas_obligatorias, d.borrador, d.vigente_desde
  FROM (SELECT auth.uid() AS uid) u
  LEFT JOIN public.profiles p ON p.id = u.uid
  CROSS JOIN LATERAL (
    SELECT x.*
    FROM (
      SELECT dl.*,
             row_number() OVER (
               PARTITION BY dl.tipo
               ORDER BY (dl.idioma = COALESCE(lower(p.registro_idioma), 'es')) DESC,
                        (dl.idioma = 'es') DESC,
                        dl.idioma
             ) AS rn
      FROM public.documentos_legales dl
      WHERE dl.requiere_aceptacion
        AND public.documento_legal_vigente(dl.id)
    ) x
    WHERE x.rn = 1
  ) d
  WHERE u.uid IS NOT NULL
    AND (
      d.audiencia = 'todos'
      OR (d.audiencia = 'candidato' AND COALESCE(lower(p.role), 'professional') = 'professional')
      OR (d.audiencia = 'empleador' AND (
            lower(p.role) = 'employer'
            OR EXISTS (SELECT 1 FROM public.company_users cu WHERE cu.user_id = u.uid)))
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.aceptaciones a
      WHERE a.user_id = u.uid AND a.tipo = d.tipo AND a.version = d.version
    )
  ORDER BY d.tipo;
$$;

REVOKE ALL ON FUNCTION public.documentos_pendientes() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.documentos_pendientes() TO authenticated, service_role;

COMMENT ON FUNCTION public.documentos_pendientes() IS
'Documentos legales vigentes (uno por tipo, en el idioma de registro del usuario o español) que el usuario autenticado aún no ha aceptado. Vacío si no hay sesión.';

-- -----------------------------------------------------------------------------
-- 4. Semilla v1.0 (borrador pendiente de abogado). Vigente desde 2026-10-29.
--    No inserta aceptaciones: los usuarios existentes pasan por
--    documentos_pendientes() en su siguiente acceso.
-- -----------------------------------------------------------------------------
INSERT INTO public.documentos_legales
  (tipo, version, idioma, titulo, texto, audiencia, requiere_aceptacion, casillas_obligatorias, borrador, vigente_desde)
VALUES
('terminos_candidato', '1.0', 'es', 'Condiciones de registro y uso – Candidatos',
$txt$BORRADOR v1.0 – texto genérico provisional, pendiente de revisión por un abogado.

1. Titular. YourCVPassport es un servicio de ISEIE Innovation School, S.L. (CIF B67799247), Av. Aragón 30, 5º, 46021 Valencia. Contacto: support@yourcvpassport.com.
2. Objeto. Estas condiciones regulan el registro y el uso de la plataforma por parte de personas que buscan empleo (candidatos): creación de su CV/pasaporte profesional, consulta de ofertas e inscripción en ellas.
3. Edad. Es necesario tener al menos 16 años. Entre 16 y 18 años se requiere la autorización de padres o tutores.
4. Datos veraces. El candidato declara que los datos de su perfil son verdaderos y se compromete a mantenerlos actualizados.
5. Uso. Queda prohibido el uso fraudulento, la suplantación de identidad y la publicación de contenido ilícito. La plataforma puede suspender cuentas que incumplan estas condiciones.
6. Inscripción en ofertas. Al inscribirse, el candidato autoriza que la empresa de la oferta acceda a los datos de su perfil con la única finalidad de la selección.
7. Datos personales. El tratamiento de los datos se rige por la Política de Privacidad.
8. Cambios. Las nuevas versiones se avisarán con al menos 15 días de antelación; hasta aceptarlas el candidato no podrá inscribirse en ofertas.
9. Descarga. El candidato puede descargar estas condiciones desde su panel.$txt$,
'candidato', true, ARRAY['acepto_condiciones_privacidad', 'datos_verdaderos'], true, '2026-10-29 00:00:00+00'),

('terminos_candidato', '1.0', 'en', 'Registration and Terms of Use – Candidates',
$txt$DRAFT v1.0 – generic provisional text, pending review by a lawyer.

1. Provider. YourCVPassport is a service of ISEIE Innovation School, S.L. (tax ID B67799247), Av. Aragón 30, 5º, 46021 Valencia, Spain. Contact: support@yourcvpassport.com.
2. Purpose. These terms govern registration and use of the platform by job seekers (candidates): creating a professional CV/passport, browsing job offers and applying to them.
3. Age. You must be at least 16 years old. Between 16 and 18, authorisation from parents or guardians is required.
4. Truthful data. The candidate declares that the data in their profile is true and undertakes to keep it up to date.
5. Use. Fraudulent use, impersonation and unlawful content are forbidden. The platform may suspend accounts that breach these terms.
6. Applications. By applying, the candidate allows the employer of the job offer to access their profile data for the sole purpose of selection.
7. Personal data. Data processing is governed by the Privacy Policy.
8. Changes. New versions will be notified at least 15 days in advance; until accepted, the candidate will not be able to apply to job offers.
9. Download. Candidates can download these terms from their dashboard.$txt$,
'candidato', true, ARRAY['acepto_condiciones_privacidad', 'datos_verdaderos'], true, '2026-10-29 00:00:00+00'),

('terminos_empleador', '1.0', 'es', 'Condiciones de registro y uso – Empleadores',
$txt$BORRADOR v1.0 – texto genérico provisional, pendiente de revisión por un abogado.

1. Titular. YourCVPassport es un servicio de ISEIE Innovation School, S.L. (CIF B67799247), Av. Aragón 30, 5º, 46021 Valencia. Contacto: support@yourcvpassport.com.
2. Objeto. Estas condiciones regulan el registro de empresas y la publicación de ofertas de empleo, así como el acceso a las candidaturas recibidas.
3. Representación. Quien registra a la empresa declara tener poder o autorización suficiente para hacerlo y para aceptar estas condiciones en su nombre.
4. Ofertas. Solo pueden publicarse ofertas reales, lícitas y no discriminatorias. La plataforma puede revisar, rechazar, retirar o caducar ofertas.
5. Verificación. La cuenta de empresa se verifica antes de poder publicar. Hasta entonces solo puede preparar borradores.
6. Datos de candidatos. La empresa solo puede usar los datos de los candidatos para el proceso de selección de la oferta a la que se han inscrito y actúa como encargada del tratamiento en los términos del Anexo I (encargo del tratamiento).
7. Publicar es gratuito por ahora. La plataforma puede introducir planes de pago avisando con antelación.
8. Cambios. Las nuevas versiones se avisarán con al menos 15 días de antelación; hasta aceptarlas la empresa no podrá publicar ofertas.$txt$,
'empleador', true, ARRAY['poder_representacion', 'ofertas_reales_no_discriminatorias', 'anexo_encargo_tratamiento'], true, '2026-10-29 00:00:00+00'),

('terminos_empleador', '1.0', 'en', 'Registration and Terms of Use – Employers',
$txt$DRAFT v1.0 – generic provisional text, pending review by a lawyer.

1. Provider. YourCVPassport is a service of ISEIE Innovation School, S.L. (tax ID B67799247), Av. Aragón 30, 5º, 46021 Valencia, Spain. Contact: support@yourcvpassport.com.
2. Purpose. These terms govern company registration, publication of job offers and access to the applications received.
3. Authority. The person registering the company declares having sufficient power or authorisation to do so and to accept these terms on its behalf.
4. Offers. Only genuine, lawful and non-discriminatory job offers may be published. The platform may review, reject, withdraw or expire offers.
5. Verification. The company account is verified before it can publish. Until then it can only prepare drafts.
6. Candidate data. The company may only use candidate data for the selection process of the offer they applied to, and acts as data processor under Annex I (data processing agreement).
7. Publishing is free for now. The platform may introduce paid plans with prior notice.
8. Changes. New versions will be notified at least 15 days in advance; until accepted, the company will not be able to publish offers.$txt$,
'empleador', true, ARRAY['poder_representacion', 'ofertas_reales_no_discriminatorias', 'anexo_encargo_tratamiento'], true, '2026-10-29 00:00:00+00'),

('privacidad', '1.0', 'es', 'Política de Privacidad',
$txt$BORRADOR v1.0 – texto genérico provisional, pendiente de revisión por un abogado.

Responsable: ISEIE Innovation School, S.L. (CIF B67799247), Av. Aragón 30, 5º, 46021 Valencia. Contacto y ejercicio de derechos: support@yourcvpassport.com.
Datos que tratamos: los que aportas al registrarte y al completar tu perfil, tu actividad en la plataforma y los datos técnicos de la conexión (IP y navegador) para registrar tus aceptaciones.
Finalidades: prestar el servicio, gestionar tu CV y tus candidaturas, verificar empresas, enviar avisos del servicio y, solo si lo autorizas, comunicaciones opcionales.
Base jurídica: ejecución del servicio, interés legítimo en la seguridad y consentimiento para lo opcional.
Destinatarios: las empresas a las que te inscribes y proveedores que prestan servicios técnicos. No vendemos tus datos.
Conservación: mientras mantengas la cuenta y, después, durante los plazos legales. El registro de aceptaciones se conserva como prueba.
Derechos: acceso, rectificación, supresión, oposición, limitación y portabilidad; y reclamación ante la autoridad de control.$txt$,
'todos', true, '{}', true, '2026-10-29 00:00:00+00'),

('privacidad', '1.0', 'en', 'Privacy Policy',
$txt$DRAFT v1.0 – generic provisional text, pending review by a lawyer.

Controller: ISEIE Innovation School, S.L. (tax ID B67799247), Av. Aragón 30, 5º, 46021 Valencia, Spain. Contact and exercise of rights: support@yourcvpassport.com.
Data we process: what you provide when registering and completing your profile, your activity on the platform and technical connection data (IP and browser) to record your acceptances.
Purposes: providing the service, managing your CV and applications, verifying companies, sending service notices and, only if you allow it, optional communications.
Legal basis: performance of the service, legitimate interest in security, and consent for optional items.
Recipients: the companies you apply to and providers of technical services. We do not sell your data.
Retention: while you keep your account and, afterwards, for legal periods. The acceptance log is kept as evidence.
Rights: access, rectification, erasure, objection, restriction and portability; and the right to complain to the supervisory authority.$txt$,
'todos', true, '{}', true, '2026-10-29 00:00:00+00'),

('cookies', '1.0', 'es', 'Política de Cookies',
$txt$BORRADOR v1.0 – texto genérico provisional, pendiente de revisión por un abogado.

Usamos cookies y almacenamiento local técnicos necesarios para iniciar sesión, recordar tu idioma y mantener la seguridad. Con tu consentimiento, también cookies de medición. Puedes cambiar tu elección o borrarlas desde tu navegador. Contacto: support@yourcvpassport.com.$txt$,
'todos', false, '{}', true, '2026-10-29 00:00:00+00'),

('cookies', '1.0', 'en', 'Cookie Policy',
$txt$DRAFT v1.0 – generic provisional text, pending review by a lawyer.

We use technical cookies and local storage that are necessary to sign in, remember your language and keep the service secure. With your consent, we also use measurement cookies. You can change your choice or delete them from your browser. Contact: support@yourcvpassport.com.$txt$,
'todos', false, '{}', true, '2026-10-29 00:00:00+00')
ON CONFLICT (tipo, version, idioma) DO NOTHING;

-- -----------------------------------------------------------------------------
-- 7. company_ai_reviews (solo admin lee; escribe service_role)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.company_ai_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  -- ok = sin incidencias; dudosa = pasa a revisión manual; error = la revisión
  -- falló (también a revisión manual).
  resultado text NOT NULL CHECK (resultado IN ('ok', 'dudosa', 'error')),
  motivos jsonb NOT NULL DEFAULT '[]'::jsonb,
  proveedor text,
  modelo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS company_ai_reviews_company_idx
  ON public.company_ai_reviews (company_id, created_at DESC);

ALTER TABLE public.company_ai_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_ai_reviews_select_admin" ON public.company_ai_reviews;
CREATE POLICY "company_ai_reviews_select_admin" ON public.company_ai_reviews
  FOR SELECT TO authenticated
  USING (public.current_user_is_admin());

REVOKE ALL ON public.company_ai_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.company_ai_reviews TO authenticated;
GRANT ALL ON public.company_ai_reviews TO service_role;

COMMENT ON TABLE public.company_ai_reviews IS
'Revisiones con IA del registro de empresas. Solo admin lee; escribe la Edge Function con service_role. Ante fallo o duda la empresa queda PENDING (revisión manual).';

-- -----------------------------------------------------------------------------
-- 8. handle_new_user: añade idioma y fecha de nacimiento
--    (resto idéntico a la definición de producción a 29/10/2026)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_full_name TEXT;
  user_lang TEXT;
  user_birth DATE;
BEGIN
  -- Extraer el nombre del raw_user_meta_data si existe
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Idioma de registro (es, en...): solo el primer subtag, en minúsculas. Si
  -- viene mal formado se ignora: nunca debe impedir crear el perfil.
  user_lang := lower(split_part(btrim(COALESCE(
    NEW.raw_user_meta_data->>'registro_idioma',
    NEW.raw_user_meta_data->>'idioma',
    NEW.raw_user_meta_data->>'lang',
    ''
  )), '-', 1));
  IF user_lang !~ '^[a-z]{2,3}$' THEN
    user_lang := NULL;
  END IF;

  -- Fecha de nacimiento (AAAA-MM-DD). Mal formada o fuera de rango -> NULL.
  BEGIN
    user_birth := (NEW.raw_user_meta_data->>'fecha_nacimiento')::date;
    IF user_birth < DATE '1900-01-01' OR user_birth > CURRENT_DATE THEN
      user_birth := NULL;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    user_birth := NULL;
  END;

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
    updated_at,
    registro_idioma,
    fecha_nacimiento
  ) VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    '',  -- headline vacío por defecto
    '',  -- summary vacío por defecto
    'professional',
    'free',
    NOW(),
    NOW(),
    user_lang,
    user_birth
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, registrar el error pero no bloquear la creación del usuario
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- -----------------------------------------------------------------------------
-- 9. Vistas: columnas nuevas AL FINAL (CREATE OR REPLACE conserva los GRANT)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.profiles_full
WITH (security_barrier = true) AS
SELECT
  p.id, p.full_name, p.headline, p.summary, p.slug, p.meta_title,
  p.meta_description, p.template, p.template_color, p.availability, p.location,
  p.phone, p.linkedin_url, p.github_url, p.gender, p.portfolio_url,
  p.job_seeking_status, p.avatar_url, p.open_to_remote, p.website_url,
  p.twitter_url, p.instagram_url, p.youtube_url, p.behance_url, p.dribbble_url,
  p.job_type, p.willing_to_relocate, p.preferred_locations,
  p.slug_validation_error, p.email, p.name, p.role, p.plan, p.handle, p.title,
  p.remote_preference, p.salary_min, p.salary_max, p.salary_currency,
  p.created_at, p.updated_at, p.show_verified_credentials, p.show_connect_links,
  p.show_qr_code, p.show_availability_badge, p.country_code, p.remote,
  p.work_mode, p.last_slug_changed_at, p.dashboard_tour_completed,
  p.first_login_completed, p.wizard_completed, p.is_active, p.suspension_reason,
  p.suspended_until, p.profile_hidden, p.search_blocked, p.messages_blocked,
  p.banner_url, p.is_open_to_messages, p.managed_by, p.is_premium,
  -- nuevas (fase 1 de la bolsa de empleo)
  p.registro_idioma, p.fecha_nacimiento
FROM public.profiles p
WHERE p.id = auth.uid()
   OR p.managed_by = auth.uid()
   OR public.current_user_is_admin();

CREATE OR REPLACE VIEW public.companies_full
WITH (security_barrier = true) AS
SELECT
  c.id, c.created_at, c.updated_at, c.company_name, c.legal_name, c.tax_id,
  c.company_email, c.company_phone, c.website_url, c.address_street,
  c.address_city, c.address_state, c.address_country, c.address_postal,
  c.industry, c.company_size, c.description, c.logo_url, c.tax_document_url,
  c.verification_document_url, c.status, c.verified_at, c.verified_by,
  c.rejection_reason, c.admin_notes, c.credit_balance, c.total_credits_purchased,
  c.total_credits_used, c.signup_ip, c.last_login_at, c.metadata, c.website,
  c.created_by,
  -- nuevas (fase 1 de la bolsa de empleo)
  c.country_code, c.idioma, c.contact_name, c.contact_position
FROM public.companies c
WHERE c.created_by = auth.uid()
   OR public.is_company_member(c.id)
   OR public.current_user_is_admin();

-- Solo lectura y solo para usuarios con sesión (como antes).
REVOKE ALL ON public.profiles_full FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles_full TO authenticated;
GRANT ALL ON public.profiles_full TO service_role;

REVOKE ALL ON public.companies_full FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.companies_full TO authenticated;
GRANT ALL ON public.companies_full TO service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
