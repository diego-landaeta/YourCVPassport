-- =============================================================================
-- Bolsa de empleo: pendientes de cierre (29/10/2026)
--   A. Aviso de 15 días antes de que entre en vigor una versión nueva de las
--      condiciones legales (antelación obligatoria, aviso en la app y cola de
--      correo).
--   B. Casillas opcionales del registro (perfil público, Google, empresas,
--      novedades) guardadas en el perfil, en una columna PRIVADA.
-- =============================================================================
--
-- ORDEN: va DESPUÉS de 20261029 (fase 1) y 20261030 (fase 2: email_outbox y
-- _outbox_enqueue). No depende de 20261031 ni de 20261032, pero se prueba
-- encadenada con ellas.
--   20261028_cerrar_email_queue.sql
--   20261029_legal_aceptaciones_idioma.sql
--   20261030_ofertas_fase2.sql
--   20261031_candidaturas_fase3.sql
--   20261032_correcciones_auditoria.sql
--   20261033_pendientes_bolsa.sql            (ESTA)
--   20261034_programacion_cron.sql           (aplicable por separado)
-- Reaplicable: CREATE OR REPLACE / ADD ... IF NOT EXISTS / DROP ... IF EXISTS.
-- Producción hoy no tiene documentos_legales (las migraciones 29-32 no están
-- aplicadas) ni empresas, ofertas o candidaturas: no hay datos que migrar.
--
-- QUÉ HACE
--   A. AVISO DE 15 DÍAS
--      1. Política "documentos_legales_select_proximas": un usuario con sesión
--         (authenticated) puede LEER las versiones futuras que no son borrador y
--         entran en vigor dentro de los próximos 15 días. Hasta ahora solo veía
--         la vigente y las que ya había aceptado. anon sigue sin ver nada futuro.
--      2. Trigger documentos_legales_antelacion: una versión NUEVA de un tipo
--         con requiere_aceptacion = true no puede tener vigente_desde anterior a
--         now() + 15 días. Excepciones: (a) es la primera versión de ese
--         tipo/idioma; (b) la crea service_role con p_urgente = true en
--         legal_publicar_version (marca la sesión con app.legal_urgente = 'on');
--         (c) la fila ya existe (la semilla de 20261029 se puede reaplicar). Vale
--         también para un UPDATE que adelante vigente_desde: no se puede
--         «acortar» el plazo de una versión ya publicada.
--      3. legal_aviso_proximo() (authenticated): filas {tipo, version, idioma,
--         titulo, vigente_desde, dias_restantes} de las versiones futuras (<= 15
--         días, no borrador) que le aplican al usuario (misma audiencia e idioma
--         que documentos_pendientes()) y que aún NO ha aceptado. Una por tipo
--         (la que entra antes en vigor). La app la consulta al entrar.
--      4. legal_encolar_aviso(p_tipo, p_version) (admin o service_role): encola
--         en email_outbox un correo kind 'legal_version_notice' por usuario
--         afectado que no haya aceptado ya esa versión: candidatos (role
--         professional) para terminos_candidato, miembros de empresa o role
--         employer para terminos_empleador, y ambos para 'privacidad' (audiencia
--         'todos', igual que la puerta de aceptación). Idioma del correo = el de
--         registro del usuario (si hay texto en él) y, si no, español: si la
--         versión aún no existe en su idioma, ese usuario NO se avisa todavía
--         (se le avisa al repetir la llamada cuando se publique su traducción).
--         Idempotente (payload.dedupe_key = 'legal:<tipo>:<version>' + correo).
--         Procesa un máximo de 5000 por llamada y devuelve cuántos encoló: si
--         devuelve 5000 conviene repetirla hasta que devuelva menos. Prioridad 6
--         (detrás de los avisos de estado y seguridad, 4-5: un aviso masivo no
--         debe retrasar «tu candidatura ha cambiado»). Nunca envía correo: solo
--         encola (cupo de Brevo compartido).
--      5. legal_publicar_version(p_tipo, p_version, p_idioma, p_titulo, p_texto,
--         p_vigente_desde, p_casillas, p_urgente) (solo admin; p_urgente solo
--         service_role): valida, exige la antelación de 15 días, inserta la
--         versión (borrador = false; audiencia y requiere_aceptacion salen del
--         tipo) y llama a legal_encolar_aviso. Si p_casillas es NULL hereda las
--         casillas obligatorias de la versión anterior del mismo tipo/idioma.
--         Devuelve jsonb {id, tipo, version, idioma, vigente_desde, encolados,
--         puede_haber_mas}.
--      Nota: registrar_aceptacion solo acepta la versión VIGENTE, así que el
--      aviso es informativo; el usuario acepta cuando entra en vigor (como hasta
--      ahora, vía documentos_pendientes()).
--   B. CASILLAS OPCIONALES
--      6. profiles.consent_prefs jsonb NOT NULL DEFAULT '{}' y
--         profiles.consent_prefs_updated_at: columnas PRIVADAS (no se conceden a
--         anon ni a authenticated: 20261006 solo concede una lista cerrada de
--         columnas). Se leen por profiles_full, y solo el dueño o un admin ven el
--         valor (un gestor, que sí ve el resto de la fila, recibe NULL).
--      7. Trigger profiles_proteger_consent_prefs: un usuario no puede escribir
--         esas columnas con UPDATE/INSERT directo (el UPDATE de tabla sigue
--         concedido); solo la RPC, un admin o service_role.
--      8. save_consent_prefs(p_prefs jsonb) (authenticated): solo las claves
--         perfil_publico, aparecer_google, empresas_contacto y alertas_novedades,
--         con valor true/false; fusiona con lo ya guardado, anota la fecha y
--         devuelve el objeto completo. NO cambia profile_hidden ni search_blocked
--         (eso lo decidirá una persona más adelante) ni crea alertas.
--
-- COMPROBACIONES ANTES DE APLICAR (SQL editor)
--   select to_regclass('public.documentos_legales'), to_regclass('public.email_outbox'),
--          to_regprocedure('public._outbox_enqueue(text,text,jsonb,text,integer,timestamptz,text)');
--                                                     -- los tres NOT NULL (si no, aplicar 29 y 30)
--   select column_name from information_schema.columns
--    where table_schema = 'public' and table_name = 'profiles'
--      and column_name in ('registro_idioma', 'consent_prefs');   -- registro_idioma sí; consent_prefs no (o ya aplicada)
--
-- DESPUÉS DE APLICAR
--   select polname from pg_policy where polrelid = 'public.documentos_legales'::regclass;
--          -- incluye documentos_legales_select_proximas
--   select tgname from pg_trigger where tgrelid = 'public.documentos_legales'::regclass and not tgisinternal;
--          -- incluye trg_documentos_legales_antelacion
--   -- como usuario con sesión: select * from public.legal_aviso_proximo();   -- vacío si no hay versión próxima
--   -- como usuario con sesión: select public.save_consent_prefs('{"alertas_novedades": true}');
--
-- CÓMO REVERTIR
--   DROP FUNCTION public.legal_publicar_version(text, text, text, text, text, timestamptz, text[], boolean);
--   DROP FUNCTION public.legal_encolar_aviso(text, text);
--   DROP FUNCTION public.legal_aviso_proximo();
--   DROP FUNCTION public._legal_idioma_destino(text, text);
--   DROP TRIGGER trg_documentos_legales_antelacion ON public.documentos_legales;
--   DROP FUNCTION public.documentos_legales_antelacion();
--   DROP POLICY "documentos_legales_select_proximas" ON public.documentos_legales;
--   DROP FUNCTION public.save_consent_prefs(jsonb);
--   DROP TRIGGER trg_profiles_proteger_consent_prefs ON public.profiles;
--   DROP FUNCTION public.profiles_proteger_consent_prefs();
--   -- recrear profiles_full SIN las dos columnas nuevas (la definición de
--   -- 20261029, sección 9): CREATE OR REPLACE no puede quitar columnas, hay que
--   -- DROP VIEW + CREATE VIEW (WITH security_barrier) + REVOKE/GRANT como allí.
--   ALTER TABLE public.profiles DROP COLUMN consent_prefs, DROP COLUMN consent_prefs_updated_at;
--   -- los correos legal_version_notice ya encolados: delete from public.email_outbox
--   --   where kind = 'legal_version_notice' and sent_at is null;
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
    'public.profiles', 'public.company_users', 'public.documentos_legales',
    'public.aceptaciones', 'public.email_outbox', 'public.profiles_full'
  ] LOOP
    IF to_regclass(v_obj) IS NULL THEN
      v_missing := v_missing || v_obj;
    END IF;
  END LOOP;
  IF to_regprocedure('public.current_user_is_admin()') IS NULL THEN
    v_missing := v_missing || 'public.current_user_is_admin()';
  END IF;
  IF to_regprocedure('public.documento_legal_vigente(uuid)') IS NULL THEN
    v_missing := v_missing || 'public.documento_legal_vigente(uuid)';
  END IF;
  IF to_regprocedure('public._outbox_enqueue(text,text,jsonb,text,integer,timestamptz,text)') IS NULL THEN
    v_missing := v_missing || 'public._outbox_enqueue(...) (20261030)';
  END IF;
  IF to_regclass('auth.users') IS NULL THEN
    v_missing := v_missing || 'auth.users';
  END IF;
  IF to_regclass('public.profiles') IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'registro_idioma') THEN
    v_missing := v_missing || 'profiles.registro_idioma (20261029)';
  END IF;
  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION 'ABORTADO: faltan objetos de las migraciones 20261029-20261030: %', array_to_string(v_missing, ', ');
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 1. A. Aviso de 15 días: política de lectura de las versiones próximas
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "documentos_legales_select_proximas" ON public.documentos_legales;
CREATE POLICY "documentos_legales_select_proximas" ON public.documentos_legales
  FOR SELECT TO authenticated
  USING (
    borrador = false
    AND vigente_desde > now()
    AND vigente_desde <= now() + interval '15 days'
  );

-- -----------------------------------------------------------------------------
-- 2. A. Antelación mínima de 15 días para una versión nueva
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.documentos_legales_antelacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Un usuario con sesión que no es admin no puede escribir aquí de todos modos:
  -- se deja pasar para que la política RLS (y no esta regla) lo rechace con 42501.
  IF auth.uid() IS NOT NULL AND NOT COALESCE(public.current_user_is_admin(), false) THEN
    RETURN NEW;
  END IF;

  -- UPDATE: solo importa si cambia la fecha o la obligación de aceptar.
  IF TG_OP = 'UPDATE'
     AND NEW.vigente_desde IS NOT DISTINCT FROM OLD.vigente_desde
     AND NEW.requiere_aceptacion IS NOT DISTINCT FROM OLD.requiere_aceptacion THEN
    RETURN NEW;
  END IF;

  -- Informativos (cookies) o con plazo suficiente: sin restricción.
  IF NOT NEW.requiere_aceptacion OR NEW.vigente_desde >= now() + interval '15 days' THEN
    RETURN NEW;
  END IF;

  -- La misma clave ya existe (reaplicar la semilla: el INSERT acabará en
  -- ON CONFLICT DO NOTHING o en un error de clave duplicada, no en una versión nueva).
  IF EXISTS (
       SELECT 1 FROM public.documentos_legales d
        WHERE d.tipo = NEW.tipo AND d.version = NEW.version AND d.idioma = NEW.idioma
          AND d.id IS DISTINCT FROM NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Primera versión de ese tipo e idioma: no hay a quién avisar.
  IF NOT EXISTS (
       SELECT 1 FROM public.documentos_legales d
        WHERE d.tipo = NEW.tipo AND d.idioma = NEW.idioma
          AND d.id IS DISTINCT FROM NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Urgencia: solo el servicio (service_role) y solo a través de legal_publicar_version.
  IF COALESCE(auth.role(), '') = 'service_role'
     AND COALESCE(current_setting('app.legal_urgente', true), '') = 'on' THEN
    RETURN NEW;
  END IF;

  RAISE EXCEPTION 'ANTELACION_INSUFICIENTE: una versión nueva de % debe entrar en vigor al menos 15 días después de publicarse (vigente_desde >= %)',
    NEW.tipo, to_char((now() + interval '15 days') AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI"Z"')
    USING ERRCODE = '22023';
END;
$$;
REVOKE ALL ON FUNCTION public.documentos_legales_antelacion() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_documentos_legales_antelacion ON public.documentos_legales;
CREATE TRIGGER trg_documentos_legales_antelacion
  BEFORE INSERT OR UPDATE OF vigente_desde, requiere_aceptacion ON public.documentos_legales
  FOR EACH ROW EXECUTE FUNCTION public.documentos_legales_antelacion();

-- -----------------------------------------------------------------------------
-- 3. A. Idioma de destino de un usuario para un tipo de documento
--    (su idioma de registro si ese tipo tiene algún texto en él; si no, español)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._legal_idioma_destino(p_tipo text, p_lang text)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM public.documentos_legales d
                  WHERE d.tipo = p_tipo AND d.idioma = lower(COALESCE(NULLIF(btrim(p_lang), ''), 'es')))
      THEN lower(COALESCE(NULLIF(btrim(p_lang), ''), 'es'))
    ELSE 'es'
  END;
$$;
REVOKE ALL ON FUNCTION public._legal_idioma_destino(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._legal_idioma_destino(text, text) TO service_role;

-- -----------------------------------------------------------------------------
-- 4. A. legal_aviso_proximo(): lo que el usuario debe saber que viene
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.legal_aviso_proximo()
RETURNS TABLE (
  tipo text,
  version text,
  idioma text,
  titulo text,
  vigente_desde timestamptz,
  dias_restantes integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT x.tipo, x.version, x.idioma, x.titulo, x.vigente_desde, x.dias
  FROM (SELECT auth.uid() AS uid) u
  LEFT JOIN public.profiles p ON p.id = u.uid
  CROSS JOIN LATERAL (
    SELECT d.tipo, d.version, d.idioma, d.titulo, d.vigente_desde,
           greatest(0, ceil(extract(epoch FROM (d.vigente_desde - now())) / 86400))::integer AS dias,
           row_number() OVER (PARTITION BY d.tipo ORDER BY d.vigente_desde, d.version) AS rn
    FROM public.documentos_legales d
    WHERE d.requiere_aceptacion
      AND d.borrador = false
      AND d.vigente_desde > now()
      AND d.vigente_desde <= now() + interval '15 days'
      AND d.idioma = public._legal_idioma_destino(d.tipo, p.registro_idioma)
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
  ) x
  WHERE u.uid IS NOT NULL AND x.rn = 1
  ORDER BY x.vigente_desde, x.tipo;
$$;
REVOKE ALL ON FUNCTION public.legal_aviso_proximo() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.legal_aviso_proximo() TO authenticated, service_role;
COMMENT ON FUNCTION public.legal_aviso_proximo() IS
'Versiones de condiciones legales que entran en vigor en los próximos 15 días (no borrador) y que el usuario autenticado aún no ha aceptado: una por tipo, en su idioma de registro o español. dias_restantes redondea hacia arriba. Vacío sin sesión.';

-- -----------------------------------------------------------------------------
-- 5. A. legal_encolar_aviso(): correos de aviso a los usuarios afectados
-- -----------------------------------------------------------------------------
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
  IF p_tipo IS NULL OR p_tipo NOT IN ('terminos_candidato', 'terminos_empleador', 'privacidad', 'cookies') THEN
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

-- -----------------------------------------------------------------------------
-- 6. A. legal_publicar_version(): publicar una versión con antelación y avisar
-- -----------------------------------------------------------------------------
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

  IF v_tipo NOT IN ('terminos_candidato', 'terminos_empleador', 'privacidad', 'cookies') THEN
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

-- -----------------------------------------------------------------------------
-- 7. B. Casillas opcionales del registro: columnas privadas en profiles
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS consent_prefs jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS consent_prefs_updated_at timestamptz;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_consent_prefs_object_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_consent_prefs_object_check
  CHECK (jsonb_typeof(consent_prefs) = 'object');

COMMENT ON COLUMN public.profiles.consent_prefs IS
'Casillas opcionales elegidas por el usuario (perfil_publico, aparecer_google, empresas_contacto, alertas_novedades: true/false). PRIVADA: no se concede a anon ni authenticated; se lee por profiles_full (dueño/admin). Se escribe solo con save_consent_prefs(). No cambia profile_hidden ni search_blocked.';
COMMENT ON COLUMN public.profiles.consent_prefs_updated_at IS
'Fecha de la última vez que el usuario guardó sus casillas opcionales (save_consent_prefs). PRIVADA.';

-- Un usuario no puede escribir las columnas con UPDATE/INSERT directo: solo la RPC
-- (SECURITY DEFINER), un admin o service_role.
CREATE OR REPLACE FUNCTION public.profiles_proteger_consent_prefs()
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
  IF (TG_OP = 'INSERT'
        AND (NEW.consent_prefs IS DISTINCT FROM '{}'::jsonb OR NEW.consent_prefs_updated_at IS NOT NULL))
     OR (TG_OP = 'UPDATE'
        AND (NEW.consent_prefs IS DISTINCT FROM OLD.consent_prefs
          OR NEW.consent_prefs_updated_at IS DISTINCT FROM OLD.consent_prefs_updated_at)) THEN
    RAISE EXCEPTION 'PROTECTED_FIELD: las casillas opcionales solo se guardan con save_consent_prefs'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.profiles_proteger_consent_prefs() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_profiles_proteger_consent_prefs ON public.profiles;
CREATE TRIGGER trg_profiles_proteger_consent_prefs
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_proteger_consent_prefs();

-- -----------------------------------------------------------------------------
-- 8. B. save_consent_prefs()
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_consent_prefs(p_prefs jsonb)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_key text;
  v_val jsonb;
  v_new jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'AUTH_REQUIRED: inicia sesión' USING ERRCODE = '42501';
  END IF;
  IF p_prefs IS NULL OR jsonb_typeof(p_prefs) <> 'object' OR p_prefs = '{}'::jsonb THEN
    RAISE EXCEPTION 'CONSENT_PREFS_INVALID: envía un objeto {clave: true|false} con al menos una clave' USING ERRCODE = '22023';
  END IF;
  FOR v_key, v_val IN SELECT e.key, e.value FROM jsonb_each(p_prefs) e LOOP
    IF v_key NOT IN ('perfil_publico', 'aparecer_google', 'empresas_contacto', 'alertas_novedades') THEN
      RAISE EXCEPTION 'CONSENT_PREFS_INVALID: clave no permitida (%)', left(v_key, 40) USING ERRCODE = '22023';
    END IF;
    IF jsonb_typeof(v_val) <> 'boolean' THEN
      RAISE EXCEPTION 'CONSENT_PREFS_INVALID: % debe ser true o false', v_key USING ERRCODE = '22023';
    END IF;
  END LOOP;

  UPDATE public.profiles
     SET consent_prefs = consent_prefs || p_prefs,
         consent_prefs_updated_at = now()
   WHERE id = v_uid
  RETURNING consent_prefs INTO v_new;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'PROFILE_NOT_FOUND: no tienes perfil' USING ERRCODE = 'P0002';
  END IF;
  RETURN v_new;
END;
$$;
REVOKE ALL ON FUNCTION public.save_consent_prefs(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_consent_prefs(jsonb) TO authenticated, service_role;
COMMENT ON FUNCTION public.save_consent_prefs(jsonb) IS
'Guarda las casillas opcionales del usuario autenticado (solo perfil_publico, aparecer_google, empresas_contacto, alertas_novedades; valores true/false), fusionadas con las anteriores. Anota la fecha. Devuelve el objeto completo. NO cambia profile_hidden ni search_blocked.';

-- -----------------------------------------------------------------------------
-- 9. B. profiles_full: columnas nuevas AL FINAL; el valor solo lo ve el dueño o un admin
--    (resto idéntico a 20261029, sección 9; conserva security_barrier y los GRANT)
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
  -- fase 1 de la bolsa de empleo (20261029)
  p.registro_idioma, p.fecha_nacimiento,
  -- pendientes de la bolsa (ESTA): solo el dueño o un admin ven el valor
  CASE WHEN p.id = auth.uid() OR public.current_user_is_admin() THEN p.consent_prefs END AS consent_prefs,
  CASE WHEN p.id = auth.uid() OR public.current_user_is_admin() THEN p.consent_prefs_updated_at END AS consent_prefs_updated_at
FROM public.profiles p
WHERE p.id = auth.uid()
   OR p.managed_by = auth.uid()
   OR public.current_user_is_admin();

REVOKE ALL ON public.profiles_full FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles_full TO authenticated;
GRANT ALL ON public.profiles_full TO service_role;

-- Comprobación final: las columnas nuevas no pueden quedar legibles por anon/authenticated.
DO $$
BEGIN
  IF has_column_privilege('anon', 'public.profiles', 'consent_prefs', 'SELECT')
     OR has_column_privilege('authenticated', 'public.profiles', 'consent_prefs', 'SELECT') THEN
    RAISE EXCEPTION 'profiles.consent_prefs es legible por anon/authenticated: aplicar 20261006_cerrar_columnas_privadas_profiles_stamps.sql antes que esta migración';
  END IF;
END $$;

COMMIT;

NOTIFY pgrst, 'reload schema';
