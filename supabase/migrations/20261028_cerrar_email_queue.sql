-- ============================================================================
-- Cerrar public.email_queue (28/10/2026, hallazgo del QA del 29/10)
--
-- Hallazgo (comprobado en produccion, solo lectura): `email_queue` es la unica
-- tabla de `public` con RLS desactivada y `anon` tenia SELECT/INSERT/UPDATE/
-- DELETE/TRUNCATE. Con la clave publica, `GET /rest/v1/email_queue` devuelve 200.
-- Ademas `queue_email_notification()` (no SECURITY DEFINER) era ejecutable por
-- anon y authenticated. Hoy la tabla esta vacia y nada la consume (la Edge
-- Function `send-email` se retiro el 08/10), asi que no hay datos expuestos,
-- pero cualquiera podia leer, escribir o vaciar la cola.
--
-- Que hace: activa RLS, quita todos los permisos a anon y authenticated y deja
-- solo a service_role. Sin politicas: el cliente no la ve. Retira la ejecucion
-- publica de queue_email_notification.
--
-- Orden: independiente; puede aplicarse sola y antes que el resto.
-- Comprobacion posterior:
--   GET /rest/v1/email_queue con la clave publica -> 401/403 (permission denied).
--   select relrowsecurity from pg_class where relname = 'email_queue'; -> true
-- Vuelta atras (no recomendada, reabre el hueco):
--   ALTER TABLE public.email_queue DISABLE ROW LEVEL SECURITY;
--   GRANT ALL ON public.email_queue TO anon, authenticated;
-- ============================================================================

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.email_queue FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.email_queue TO service_role;

REVOKE ALL ON FUNCTION public.queue_email_notification(text, text, text, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.queue_email_notification(text, text, text, jsonb) TO service_role;
