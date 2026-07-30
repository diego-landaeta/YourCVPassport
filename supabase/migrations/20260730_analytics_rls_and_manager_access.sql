-- ============================================================================
-- El gestor no puede leer la analitica de los perfiles que administra
-- Fecha: 2026-07-30
--
-- DIAGNOSTICO (verificado contra la base de datos, no deducido del codigo)
--
--   Los datos EXISTEN y el registro FUNCIONA:
--     analytics_views   707 filas
--     analytics_clicks   34 filas
--     De ellas, 30 visitas repartidas en 15 perfiles gestionados.
--     Ultima visita registrada: 2026-07-30 19:34 UTC.
--
--   El INSERT ya esta permitido (WITH CHECK (true) en analytics_views,
--   analytics_clicks y analytics_leads). No hay nada que arreglar ahi.
--
--   El problema es el SELECT. La politica vigente es:
--     analytics_views_user_read : USING (auth.uid() = profile_id OR is_admin())
--
--   Es decir: solo el DUEÑO del perfil o un admin. Un gestor consulta perfiles
--   cuyo profiles.managed_by = auth.uid(), pero cuyo id NO es su auth.uid(), asi
--   que RLS le filtra el 100% de las filas.
--
--   Y lo hace en silencio: PostgREST devuelve 200 con 0 filas, sin error. Por eso
--   desde el panel parecia que las tablas estaban vacias.
--
-- QUE HACE
--   Añade al SELECT el caso del gestor, sin tocar ni el INSERT ni el acceso
--   existente del dueño y del admin.
--
-- Segura de re-ejecutar: los DROP llevan IF EXISTS.
-- ============================================================================

-- analytics_views ------------------------------------------------------------
DROP POLICY IF EXISTS "Manager can read managed profile views" ON public.analytics_views;

CREATE POLICY "Manager can read managed profile views"
  ON public.analytics_views FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = analytics_views.profile_id
        AND p.managed_by = auth.uid()
    )
  );

-- analytics_clicks -----------------------------------------------------------
DROP POLICY IF EXISTS "Manager can read managed profile clicks" ON public.analytics_clicks;

CREATE POLICY "Manager can read managed profile clicks"
  ON public.analytics_clicks FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = analytics_clicks.profile_id
        AND p.managed_by = auth.uid()
    )
  );

-- analytics_leads ------------------------------------------------------------
-- Aqui la politica vigente es FOR ALL, asi que se añade solo SELECT: el gestor
-- lee los contactos de sus tutores, pero no los modifica.
DROP POLICY IF EXISTS "Manager can read managed profile leads" ON public.analytics_leads;

CREATE POLICY "Manager can read managed profile leads"
  ON public.analytics_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = analytics_leads.profile_id
        AND p.managed_by = auth.uid()
    )
  );

-- Indices para las consultas del panel ---------------------------------------
-- El panel filtra por profile_id IN (...) y por rango de viewed_at.
CREATE INDEX IF NOT EXISTS idx_analytics_views_profile_viewed
  ON public.analytics_views (profile_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_clicks_profile
  ON public.analytics_clicks (profile_id);

-- ============================================================================
-- COMPROBACION tras aplicar
--   Entrar en /manager/analiticas como gestor: deberian aparecer 30 visitas
--   repartidas en 15 de los 19 tutores.
-- ============================================================================
