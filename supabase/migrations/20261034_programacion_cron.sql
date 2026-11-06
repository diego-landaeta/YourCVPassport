-- =============================================================================
-- Bolsa de empleo: programación automática (pg_cron + pg_net + vault)
-- =============================================================================
--
-- ORDEN: aplicable POR SEPARADO y en cualquier momento después de que las Edge
-- Functions estén desplegadas y el secreto creado (ver «ANTES DE APLICAR»). No
-- toca ninguna tabla de la bolsa. Pensada para ir después de 20261033.
--
-- QUÉ HACE
--   1. Habilita pg_net (ya instalada en producción) y pg_cron (NO instalada hoy:
--      se habilita aquí con CREATE EXTENSION; está disponible, v1.6.4).
--   2. public.bolsa_llamar_funcion(p_nombre text, p_cuerpo jsonb DEFAULT '{}'):
--      SECURITY DEFINER. Lee el secreto 'bolsa_cron_secret' de
--      vault.decrypted_secrets y hace un POST (net.http_post) a
--      https://djehzlzombqrzzuchcef.supabase.co/functions/v1/<p_nombre> con la
--      cabecera x-cron-secret. El secreto NO está en esta migración ni en el
--      repositorio: vive solo en el vault de Supabase (y, con el mismo valor, en
--      el secreto de entorno CRON_SECRET de las Edge Functions). Solo acepta
--      tres nombres de función (moderate-job-posting, send-outbox,
--      expire-job-postings): no se puede usar para llamar a otra cosa. Si el
--      secreto no existe en el vault (o tiene menos de 16 caracteres) NO llama a
--      nada y falla con BOLSA_CRON_SECRET_AUSENTE: el fallo queda visible en
--      cron.job_run_details en vez de silenciarse. EXECUTE revocado a PUBLIC,
--      anon, authenticated y service_role: solo la ejecuta el propio cron (rol
--      postgres) o quien administre la base.
--   3. cron.schedule (se desprograma antes cada trabajo por su nombre, así que se
--      puede reaplicar sin duplicar). También se desprograma, si existe, el
--      trabajo 'expire-job-postings' que 20261030 crea cuando pg_cron está
--      presente (03:15 UTC, llamaba a public.expire_job_postings() directamente):
--      lo sustituye bolsa-caducidad, que llama a la Edge Function, la cual
--      ejecuta ese mismo RPC. Así no caduca dos veces ni hay dos horarios.
--        bolsa-moderacion  */5 * * * *   moderate-job-posting
--        bolsa-correos     */5 * * * *   send-outbox
--        bolsa-caducidad   10 3 * * *    expire-job-postings   (03:10 UTC)
--        bolsa-alertas     0 7 * * *     send-outbox {"alerts":true} (07:00 UTC)
--
-- ANTES DE APLICAR (el secreto se crea FUERA del repositorio, a mano, una vez)
--   1. Generar un valor aleatorio largo (p. ej. `openssl rand -hex 32`) y NO
--      pegarlo en ningún fichero ni en el chat.
--   2. Guardarlo en el vault (SQL editor de Supabase):
--        select vault.create_secret('<el valor>', 'bolsa_cron_secret');
--      Para rotarlo: select vault.update_secret(id, '<nuevo valor>') sobre la
--      fila de vault.secrets con ese nombre, y actualizar CRON_SECRET igual.
--   3. Poner el MISMO valor en las Edge Functions:
--        supabase secrets set CRON_SECRET=<el valor>
--      y tener desplegadas moderate-job-posting, send-outbox y
--      expire-job-postings con la versión que acepta x-cron-secret.
--   4. OJO con la verificación de JWT: este cron NO envía Authorization. Si las
--      tres funciones se desplegaron CON verificación de JWT (el valor por
--      defecto), el gateway de Supabase rechazará la llamada con 401 antes de
--      que la función compruebe x-cron-secret. Desplegarlas con
--      `--no-verify-jwt` (es seguro: la propia función exige el secreto, en
--      tiempo constante, y nunca lo acepta si CRON_SECRET no está configurado).
--   5. Comprobaciones:
--        select name, created_at from vault.secrets where name = 'bolsa_cron_secret';  -- 1 fila (no se lee el valor)
--        select extname from pg_extension where extname in ('pg_cron', 'pg_net');      -- pg_net (y pg_cron tras aplicar)
--
-- DESPUÉS DE APLICAR
--   select jobid, jobname, schedule, command, active from cron.job where jobname like 'bolsa-%' order by jobname;
--     -- 4 filas: bolsa-alertas, bolsa-caducidad, bolsa-correos, bolsa-moderacion
--   -- Última ejecución de cada trabajo (status = 'succeeded'; si es 'failed', el mensaje dice por qué):
--   select j.jobname, d.status, d.return_message, d.start_time
--     from cron.job_run_details d join cron.job j using (jobid)
--    where j.jobname like 'bolsa-%' order by d.start_time desc limit 12;
--   -- Respuestas HTTP de las Edge Functions (status_code 200 esperado):
--   select id, status_code, left(content, 120) as respuesta, created from net._http_response order by created desc limit 10;
--
-- PARAR / CÓMO REVERTIR
--   select cron.unschedule('bolsa-moderacion'); select cron.unschedule('bolsa-correos');
--   select cron.unschedule('bolsa-caducidad');  select cron.unschedule('bolsa-alertas');
--   (y, si se quiere recuperar el trabajo directo de 20261030:
--    select cron.schedule('expire-job-postings', '15 3 * * *', 'select public.expire_job_postings()');)
--   DROP FUNCTION public.bolsa_llamar_funcion(text, jsonb);
--   (pg_cron y pg_net se dejan instaladas; el secreto del vault, si se quiere
--    borrar: delete from vault.secrets where name = 'bolsa_cron_secret';)
--
-- Reaplicable: CREATE EXTENSION IF NOT EXISTS, CREATE OR REPLACE y desprogramar
-- por nombre antes de programar.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Extensiones (solo se crean si su esquema aún no existe)
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regnamespace('net') IS NULL THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_net';
  END IF;
  IF to_regnamespace('cron') IS NULL THEN
    EXECUTE 'CREATE EXTENSION IF NOT EXISTS pg_cron';
  END IF;
  IF to_regnamespace('vault') IS NULL THEN
    RAISE EXCEPTION 'ABORTADO: falta el esquema vault (extensión supabase_vault). Actívala en el panel de Supabase (Database > Extensions) y vuelve a aplicar.';
  END IF;
  IF to_regnamespace('cron') IS NULL OR to_regnamespace('net') IS NULL THEN
    RAISE EXCEPTION 'ABORTADO: pg_cron o pg_net no se han podido habilitar';
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Función que llama a una Edge Function con el secreto del vault
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
  IF p_nombre IS NULL OR p_nombre NOT IN ('moderate-job-posting', 'send-outbox', 'expire-job-postings') THEN
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
'Llama (POST, pg_net) a una Edge Function de la bolsa con la cabecera x-cron-secret leída del vault (bolsa_cron_secret). Solo moderate-job-posting, send-outbox y expire-job-postings. Sin secreto no llama y falla (BOLSA_CRON_SECRET_AUSENTE). La ejecuta pg_cron; nadie con sesión puede.';

-- -----------------------------------------------------------------------------
-- 3. Trabajos programados (se desprograman por nombre antes de crearlos)
-- -----------------------------------------------------------------------------
DO $$
DECLARE
  v_nombre text;
BEGIN
  FOREACH v_nombre IN ARRAY ARRAY['bolsa-moderacion', 'bolsa-correos', 'bolsa-caducidad', 'bolsa-alertas', 'expire-job-postings'] LOOP
    IF EXISTS (SELECT 1 FROM cron.job j WHERE j.jobname = v_nombre) THEN
      PERFORM cron.unschedule(v_nombre);
    END IF;
  END LOOP;

  PERFORM cron.schedule('bolsa-moderacion', '*/5 * * * *',
    $cmd$select public.bolsa_llamar_funcion('moderate-job-posting')$cmd$);
  PERFORM cron.schedule('bolsa-correos', '*/5 * * * *',
    $cmd$select public.bolsa_llamar_funcion('send-outbox')$cmd$);
  PERFORM cron.schedule('bolsa-caducidad', '10 3 * * *',
    $cmd$select public.bolsa_llamar_funcion('expire-job-postings')$cmd$);
  PERFORM cron.schedule('bolsa-alertas', '0 7 * * *',
    $cmd$select public.bolsa_llamar_funcion('send-outbox', '{"alerts":true}'::jsonb)$cmd$);
END $$;

COMMIT;
