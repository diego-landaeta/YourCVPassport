-- Cierra funciones SECURITY DEFINER que cualquiera podía ejecutar con la clave anon
-- (pública, va en el bundle) y la lectura abierta de verification_tokens.
-- Auditoría del 15/10/2026, comprobado en vivo:
--   - 75 funciones SECURITY DEFINER ejecutables por anon. Las admin_* sí comprueban
--     el rol dentro; estas no comprueban nada y son las peligrosas:
--       delete_stamp_documents(uuid)        borra los documentos de cualquier sello
--       get_document_url(text, int)         URL firmada de cualquier documento privado
--       send_job_application_email(...)     envía correos a cualquier dirección
--       create_notification(...)            notificaciones falsas a cualquier usuario
--       get_analytics_*(uuid, ...)          analíticas de cualquier perfil
--       get_profile_cv_versions(uuid), get_or_create_verification_token(uuid),
--       auto_reactivate_expired_suspensions()
--     Ninguna se llama desde la app (grep en components/hooks/lib/services/functions):
--     solo desde disparadores. Pasan a ser solo de servidor (service_role).
--   - verification_tokens: política SELECT `true` (cualquiera leía todos los tokens).
--     La verificación pública usa get_stamp_by_token (SECURITY DEFINER), que no
--     necesita esa política.
--
-- Los disparadores siguen funcionando: Postgres no comprueba EXECUTE al disparar un
-- trigger. Los tres disparadores SECURITY INVOKER que llaman a funciones cerradas
-- (cleanup_stamp_documents, notify_new_job_application, notify_application_status_change)
-- pasan a SECURITY DEFINER para que el usuario que hace el INSERT/UPDATE no necesite
-- permiso sobre ellas.
--
-- Idempotente. Probado primero dentro de BEGIN ... ROLLBACK contra la BD real.

BEGIN;

-- 1. Disparadores que llaman a funciones que se cierran.
ALTER FUNCTION public.cleanup_stamp_documents() SECURITY DEFINER;
ALTER FUNCTION public.cleanup_stamp_documents() SET search_path = public, extensions;
ALTER FUNCTION public.notify_new_job_application() SECURITY DEFINER;
ALTER FUNCTION public.notify_new_job_application() SET search_path = public, extensions;
ALTER FUNCTION public.notify_application_status_change() SECURITY DEFINER;
ALTER FUNCTION public.notify_application_status_change() SET search_path = public, extensions;

DO $$
DECLARE
  f record;
  solo_servidor text[] := ARRAY[
    'delete_stamp_documents', 'get_document_url', 'send_job_application_email', 'create_notification',
    'get_analytics_cta_clicks', 'get_analytics_devices', 'get_analytics_summary', 'get_analytics_timeseries',
    'get_analytics_top_cities', 'get_analytics_top_countries', 'get_analytics_traffic_sources',
    'get_profile_cv_versions', 'get_or_create_verification_token', 'auto_reactivate_expired_suspensions'];
  solo_con_sesion text[] := ARRAY[
    'admin_bulk_update_plan', 'admin_delete_user_complete', 'admin_get_activity_logs', 'admin_get_all_users',
    'admin_get_inactive_users', 'admin_get_recent_activity', 'admin_get_system_stats', 'admin_get_template_stats',
    'admin_get_user_details', 'admin_get_users_by_plan', 'admin_log_activity', 'admin_search_users',
    'admin_update_user_plan', 'admin_update_user_role', 'apply_to_job', 'toggle_job_save', 'duplicate_cv_version',
    'get_company_team_members', 'mark_all_notifications_read', 'mark_messages_as_read', 'mark_notification_read',
    'delete_user_by_id', 'verify_stamp', 'reject_stamp', 'check_feed_rate_limit', 'get_cv_version_stats'];
BEGIN
  -- 2. Solo servidor: fuera anon y authenticated (y PUBLIC, que lo heredan).
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
           WHERE p.pronamespace = 'public'::regnamespace AND p.proname = ANY (solo_servidor) LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;

  -- 3. Solo con sesión: fuera anon (las admin_* comprueban además el rol dentro).
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
           WHERE p.pronamespace = 'public'::regnamespace AND p.proname = ANY (solo_con_sesion) LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role', f.sig);
  END LOOP;

  -- 4. Funciones de disparador SECURITY DEFINER: nadie las llama por la API.
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
           WHERE p.pronamespace = 'public'::regnamespace AND p.prosecdef AND p.prorettype = 'trigger'::regtype LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
  END LOOP;
END $$;

-- 5. verification_tokens: sin lectura abierta. El dueño ve los tokens de sus sellos.
DROP POLICY IF EXISTS "Public can view verification tokens" ON public.verification_tokens;
DROP POLICY IF EXISTS "Owners can view tokens of own stamps" ON public.verification_tokens;
CREATE POLICY "Owners can view tokens of own stamps" ON public.verification_tokens
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stamps s WHERE s.id = verification_tokens.stamp_id AND s.profile_id = auth.uid()));

COMMIT;
