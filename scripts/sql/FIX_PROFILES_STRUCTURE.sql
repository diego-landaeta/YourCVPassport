-- =====================================================
-- FIX: Estructura de la tabla PROFILES
-- =====================================================
-- Este script verifica y corrige la estructura de profiles
-- agregando la columna full_name si no existe
-- =====================================================

-- PASO 1: Verificar si la tabla profiles existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'profiles'
  ) THEN
    RAISE EXCEPTION 'La tabla profiles NO existe. Debes crearla primero.';
  ELSE
    RAISE NOTICE '✅ La tabla profiles existe';
  END IF;
END $$;

-- PASO 2: Verificar si la columna full_name existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'full_name'
  ) THEN
    RAISE NOTICE '⚠️  La columna full_name NO existe. Será creada...';

    -- Agregar la columna full_name
    ALTER TABLE public.profiles
    ADD COLUMN full_name TEXT;

    RAISE NOTICE '✅ Columna full_name creada';

    -- Si existe una columna 'name', copiar los datos
    IF EXISTS (
      SELECT FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'name'
    ) THEN
      UPDATE public.profiles
      SET full_name = name
      WHERE full_name IS NULL AND name IS NOT NULL;

      RAISE NOTICE '✅ Datos copiados de la columna "name" a "full_name"';
    END IF;

  ELSE
    RAISE NOTICE '✅ La columna full_name ya existe';
  END IF;
END $$;

-- PASO 3: Hacer full_name NOT NULL con valor por defecto
ALTER TABLE public.profiles
ALTER COLUMN full_name SET DEFAULT '';

-- Actualizar registros NULL
UPDATE public.profiles
SET full_name = COALESCE(email, 'Usuario')
WHERE full_name IS NULL OR full_name = '';

-- Ahora hacer la columna NOT NULL
ALTER TABLE public.profiles
ALTER COLUMN full_name SET NOT NULL;

RAISE NOTICE '✅ Columna full_name configurada como NOT NULL';

-- PASO 4: Verificar otras columnas importantes
DO $$
DECLARE
  columnas_faltantes TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Verificar headline
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'headline'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN headline TEXT DEFAULT '';
    columnas_faltantes := array_append(columnas_faltantes, 'headline');
  END IF;

  -- Verificar summary
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'summary'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN summary TEXT DEFAULT '';
    columnas_faltantes := array_append(columnas_faltantes, 'summary');
  END IF;

  -- Verificar location
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'location'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN location TEXT;
    columnas_faltantes := array_append(columnas_faltantes, 'location');
  END IF;

  -- Verificar country_code
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'country_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN country_code TEXT;
    columnas_faltantes := array_append(columnas_faltantes, 'country_code');
  END IF;

  -- Verificar slug
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN slug TEXT UNIQUE;
    columnas_faltantes := array_append(columnas_faltantes, 'slug');
  END IF;

  -- Verificar template
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'template'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN template TEXT DEFAULT 'professional-blue';
    columnas_faltantes := array_append(columnas_faltantes, 'template');
  END IF;

  -- Verificar template_color
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'template_color'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN template_color TEXT DEFAULT '#2563eb';
    columnas_faltantes := array_append(columnas_faltantes, 'template_color');
  END IF;

  -- Verificar show_verified_credentials
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'show_verified_credentials'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN show_verified_credentials BOOLEAN DEFAULT true;
    columnas_faltantes := array_append(columnas_faltantes, 'show_verified_credentials');
  END IF;

  -- Verificar show_connect_links
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'show_connect_links'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN show_connect_links BOOLEAN DEFAULT true;
    columnas_faltantes := array_append(columnas_faltantes, 'show_connect_links');
  END IF;

  -- Verificar show_qr_code
  IF NOT EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'show_qr_code'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN show_qr_code BOOLEAN DEFAULT true;
    columnas_faltantes := array_append(columnas_faltantes, 'show_qr_code');
  END IF;

  IF array_length(columnas_faltantes, 1) > 0 THEN
    RAISE NOTICE '✅ Columnas agregadas: %', array_to_string(columnas_faltantes, ', ');
  ELSE
    RAISE NOTICE '✅ Todas las columnas necesarias ya existen';
  END IF;
END $$;

-- PASO 5: Verificación final
SELECT
  '═══ ESTRUCTURA DE LA TABLA PROFILES ═══' AS info,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Verificar que ahora funciona
SELECT '✅ ESTRUCTURA CORREGIDA - Ahora puedes ejecutar el script de James Wilson' AS resultado;
