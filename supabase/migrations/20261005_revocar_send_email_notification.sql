-- =============================================================================
-- send_email_notification(): solo la pueden usar los triggers y RPC internas
-- =============================================================================
--
-- PROBLEMA (seguridad, auditoría 2026-10-05, A4 / C2)
--   public.send_email_notification(p_to_email, p_template, p_data)
--   (20251230_email_notifications.sql:6) es SECURITY DEFINER y llama a la Edge
--   Function `send-email` con la service_role key y el destinatario que se le
--   pase. Supabase concede EXECUTE por defecto a anon y authenticated, así que
--   cualquiera con la anon key podía hacer
--     POST /rest/v1/rpc/send_email_notification
--   y mandar correos con plantillas de YourCVPassport a cualquier dirección
--   desde noreply@yourcvpassport.com. Cerrar solo la Edge Function (que ahora
--   exige service_role) no basta: esta función ya la llama con service_role.
--
-- QUÉ HACE
--   REVOKE EXECUTE a PUBLIC, anon y authenticated. Quién la usa (todas
--   SECURITY DEFINER, se ejecutan como su propietario y no necesitan el
--   permiso del usuario):
--     - triggers de 20251230_email_notifications.sql: notify_company_approved,
--       notify_company_rejected, notify_new_message, notify_team_member_added,
--       notify_low_credits, notify_credit_purchase;
--     - RPC apply_to_job y update_application_status
--       (20251230_job_postings_rpc_functions.sql).
--   El frontend no la llama (grep: sin .rpc('send_email_notification')).
--   service_role la conserva.
--
-- ORDEN DE DESPLIEGUE
--   Independiente. Se puede aplicar en cualquier momento.
--
-- CÓMO REVERTIR (reabre el relay de correo)
--   GRANT EXECUTE ON FUNCTION public.send_email_notification(text, text, jsonb)
--     TO anon, authenticated;
--
-- Idempotente.
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.send_email_notification(text, text, jsonb)') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.send_email_notification(text, text, jsonb) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.send_email_notification(text, text, jsonb) TO service_role;
  ELSE
    RAISE NOTICE 'public.send_email_notification(text, text, jsonb) no existe: nada que hacer';
  END IF;
END $$;

COMMIT;
