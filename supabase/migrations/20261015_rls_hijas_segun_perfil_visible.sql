-- Datos del CV visibles solo si el perfil lo es (auditoría del 15/10/2026, M1).
--
-- Problema: education, experiences, skills, languages, portfolio_items y
-- certifications tenían políticas SELECT con `true` («... viewable by everyone»).
-- Cualquiera con la clave anon (pública, va en el bundle) leía el CV completo de
-- perfiles ocultos (profile_hidden), suspendidos (is_active = false) o sin publicar.
-- Comprobado en vivo con 2 perfiles ocultos.
--
-- Arreglo: una sola política de lectura por tabla, «el perfil padre es visible para
-- quien consulta». La subconsulta a profiles se evalúa con el RLS de profiles, así que
-- hereda sus reglas sin repetirlas:
--   - anon y cualquiera: perfiles publicados (slug, no ocultos, activos);
--   - el propio usuario: su perfil aunque no esté publicado (asistente);
--   - admin: todos (current_user_is_admin());
--   - gestor: los perfiles que gestiona (managed_by).
-- Las políticas de escritura («Managers manage ...» y las del dueño) no cambian.
-- Las Edge Functions usan service_role y no se ven afectadas.
--
-- Comprobación tras aplicar (con la clave anon):
--   GET /rest/v1/education?profile_id=eq.<id de perfil oculto>  -> []
--   GET /rest/v1/education?profile_id=eq.<id de perfil publicado> -> filas

BEGIN;

DO $$
DECLARE
  t text;
  pol record;
BEGIN
  FOREACH t IN ARRAY ARRAY['education', 'experiences', 'skills', 'languages', 'portfolio_items', 'certifications'] LOOP
    -- Fuera las políticas SELECT abiertas o parciales (las de ALL se quedan).
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t AND cmd = 'SELECT'
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', pol.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = %I.profile_id))',
      t || '_visible_si_el_perfil_lo_es', t, t
    );
  END LOOP;
END $$;

COMMIT;
