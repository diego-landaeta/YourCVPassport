-- Script para agregar las columnas faltantes en la tabla profiles
-- Basado en el interface Profile de types.ts

-- Agregar work_mode si no existe (availability ya existe según types.ts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'work_mode'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN work_mode TEXT;
    COMMENT ON COLUMN public.profiles.work_mode IS 'Modalidad de trabajo preferida (remote, hybrid, onsite)';
  END IF;
END $$;

COMMENT ON TABLE public.profiles IS 'Perfiles de usuario con información profesional completa';
