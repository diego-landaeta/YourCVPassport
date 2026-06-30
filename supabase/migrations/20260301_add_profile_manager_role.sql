-- ============================================================================
-- Rol "profile_manager": usuario gestor que crea y administra varios perfiles
-- profesionales (perfiles GESTIONADOS, sin login propio de la persona).
--
-- Un perfil gestionado es un profile normal (role='professional') cuyo campo
-- managed_by apunta al auth.uid() del gestor. El gestor puede leer/escribir
-- ese perfil y todas sus subtablas del CV, igual que un usuario sobre el suyo.
-- ============================================================================

-- 1. Permitir el nuevo valor en el CHECK de profiles.role -----------------------
--    (El nombre del constraint puede variar; lo localizamos y reemplazamos.)
DO $$
DECLARE
  cname text;
BEGIN
  SELECT conname INTO cname
  FROM pg_constraint
  WHERE conrelid = 'public.profiles'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%role%';

  IF cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.profiles DROP CONSTRAINT %I', cname);
  END IF;
END $$;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('professional', 'employer', 'admin', 'profile_manager'));

-- 2. Columna managed_by ---------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS managed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_managed_by ON public.profiles(managed_by);

COMMENT ON COLUMN public.profiles.managed_by IS
  'auth.uid() del profile_manager que gestiona este perfil. NULL = perfil de usuario normal.';

-- 3. Helper: ¿el perfil indicado lo gestiona el usuario actual? ------------------
--    SECURITY DEFINER para que el SELECT interno no dispare RLS (evita recursión
--    al usarse dentro de las políticas de la propia tabla profiles).
CREATE OR REPLACE FUNCTION public.is_managed_profile(target_profile_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = target_profile_id
      AND p.managed_by = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_managed_profile(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.is_managed_profile(uuid) TO authenticated;

-- 4. Políticas en profiles para el gestor --------------------------------------
DROP POLICY IF EXISTS "Managers can view managed profiles" ON public.profiles;
CREATE POLICY "Managers can view managed profiles"
  ON public.profiles FOR SELECT
  USING (managed_by = auth.uid());

DROP POLICY IF EXISTS "Managers can update managed profiles" ON public.profiles;
CREATE POLICY "Managers can update managed profiles"
  ON public.profiles FOR UPDATE
  USING (managed_by = auth.uid())
  WITH CHECK (managed_by = auth.uid());

-- 5. Políticas FOR ALL en las subtablas del CV ---------------------------------
--    El gestor obtiene control total (SELECT/INSERT/UPDATE/DELETE) sobre las
--    filas cuyo profile_id pertenece a un perfil que él gestiona.
DO $$
DECLARE
  tbl text;
  cv_tables text[] := ARRAY[
    'experiences',
    'education',
    'skills',
    'languages',
    'portfolio_items',
    'visas',
    'certifications',
    'stamps',
    'recommendations',
    'cv_versions'
  ];
BEGIN
  FOREACH tbl IN ARRAY cv_tables LOOP
    -- Solo si la tabla existe en este entorno
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tbl
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',
        'Managers manage managed profile ' || tbl, tbl);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL '
        || 'USING (public.is_managed_profile(profile_id)) '
        || 'WITH CHECK (public.is_managed_profile(profile_id))',
        'Managers manage managed profile ' || tbl, tbl);
    END IF;
  END LOOP;
END $$;
