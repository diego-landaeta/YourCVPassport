-- =============================================================================
-- Acotar dos políticas INSERT abiertas (WITH CHECK (true)) sin tocar frontend
-- =============================================================================
--
-- PROBLEMA (seguridad)
--   Revisión de las políticas de escritura con WITH CHECK (true) / USING (true)
--   que siguen vigentes en las migraciones. Dos de ellas permiten suplantar a
--   otro usuario y se pueden acotar sin cambiar nada del frontend:
--
--   a) leads — "Anyone can insert leads"
--      (20251129_create_leads_table.sql:42 y
--       20260226_create_messages_and_contact_prefs.sql:90)
--      El formulario de contacto del perfil público (ProfileViewPage) es
--      anónimo por diseño, pero cualquiera podía rellenar `sender_id` con el
--      id de OTRO usuario: el mensaje aparecía en el buzón del destinatario
--      como enviado por esa persona, y a ella le salía en "mis leads enviados"
--      (política "Senders can view their own leads").
--
--   b) job_posting_views — "Anyone can track views"
--      (20251230_create_job_postings.sql:346)
--      El registro de visitas de una oferta es anónimo por diseño, pero se
--      podía atribuir una visita a cualquier `profile_id` (las empresas ven
--      quién ha visto su oferta).
--
-- QUÉ HACE
--   Recrea las dos políticas manteniendo el acceso anónimo y exigiendo que,
--   si se indica remitente/perfil, sea el usuario autenticado:
--     leads ............. sender_id IS NULL OR sender_id = auth.uid()
--     job_posting_views . profile_id IS NULL OR profile_id = auth.uid()
--   Qué manda hoy el frontend (sigue funcionando):
--     - components/pages/ProfileViewPage.tsx: sender_id = profile.id del
--       AuthContext (= auth.uid()) o null si no hay sesión.
--     - components/pages/JobDetailPage.tsx: profile_id = user.id o null.
--   Idempotente (DROP POLICY IF EXISTS).
--
--   NO se tocan aquí (requieren decidir/cambiar frontend; ver informe):
--     - companies "Users can register companies" / "Anyone can register
--       companies" (TO authenticated, WITH CHECK (true)).
--     - company_activity_log "System can insert activity log" (TO
--       authenticated, WITH CHECK (true)).
--     - analytics_views / analytics_clicks / analytics_leads (INSERT abierto,
--       creado fuera de las migraciones; es tracking anónimo por diseño).
--
-- ORDEN DE DESPLIEGUE
--   Independiente. Se puede aplicar en cualquier momento.
--
-- CÓMO REVERTIR
--   DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
--   CREATE POLICY "Anyone can insert leads" ON public.leads
--     FOR INSERT WITH CHECK (true);
--   DROP POLICY IF EXISTS "Anyone can track views" ON public.job_posting_views;
--   CREATE POLICY "Anyone can track views" ON public.job_posting_views
--     FOR INSERT WITH CHECK (true);
-- =============================================================================

BEGIN;

-- a) leads ---------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
CREATE POLICY "Anyone can insert leads"
  ON public.leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (sender_id IS NULL OR sender_id = auth.uid());

-- b) job_posting_views -----------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can track views" ON public.job_posting_views;
CREATE POLICY "Anyone can track views"
  ON public.job_posting_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (profile_id IS NULL OR profile_id = auth.uid());

COMMIT;
