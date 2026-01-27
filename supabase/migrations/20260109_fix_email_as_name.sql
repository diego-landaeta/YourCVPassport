-- ========================================
-- MIGRATION: Fix Email Used As Name
-- Date: 2026-01-09
-- ========================================
-- PROBLEMA:
--   El trigger handle_new_user() usa email como fallback para full_name
--   Esto hace que usuarios vean su email en lugar de un campo vacío
--
-- SOLUCIÓN:
--   1. Modificar el trigger para NO usar email como fallback (usar NULL)
--   2. Limpiar perfiles existentes que tienen email como nombre
-- ========================================

-- ========================================
-- PASO 1: Corregir handle_new_user trigger
-- ========================================
-- El trigger debe crear perfiles con full_name = NULL si no se proporciona
-- NO debe usar el email como fallback

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, slug, role, plan)
  VALUES (
    new.id,
    -- SOLO usar full_name si fue explícitamente proporcionado
    -- ❌ NO usar email como fallback
    COALESCE(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',  -- Para OAuth providers (Google, LinkedIn)
      NULL  -- ✅ Si no hay nombre, dejar NULL (el usuario lo agregará en el wizard)
    ),
    NULL,  -- slug debe ser NULL (se asigna en wizard finalization)
    'professional',  -- role por defecto
    'Free'  -- plan por defecto
  );
  RETURN new;
END;
$$;

-- Verificar que el trigger existe y está activo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'on_auth_user_created'
    AND tgrelid = 'auth.users'::regclass
  ) THEN
    RAISE NOTICE '⚠️ ADVERTENCIA: El trigger on_auth_user_created no existe. Creándolo ahora...';

    -- Crear el trigger si no existe
    EXECUTE '
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_new_user();
    ';

    RAISE NOTICE '✅ Trigger on_auth_user_created creado correctamente';
  ELSE
    RAISE NOTICE '✅ Trigger on_auth_user_created ya existe';
  END IF;
END;
$$;

-- ========================================
-- PASO 2: Limpiar perfiles con email como nombre
-- ========================================
-- Establecer full_name a NULL donde sea CLARAMENTE un email
-- ✅ SEGURO: Solo limpia emails válidos (contiene @ Y .)
-- ✅ NO afecta nombres reales que contengan @ (ej: "Juan @Desarrollador")
-- ✅ NO afecta CVs completados con nombres válidos

UPDATE public.profiles
SET full_name = NULL
WHERE full_name IS NOT NULL
  -- Debe ser un email válido: contiene @ Y punto después del @
  AND full_name ~ '^[^@]+@[^@]+\.[^@]+$'
  -- Seguridad adicional: solo limpiar perfiles SIN template (no completaron wizard)
  AND template IS NULL;

-- ========================================
-- PASO 3: Verificación
-- ========================================

-- 3.1: Mostrar estadísticas de la limpieza
SELECT
  '═══ RESUMEN POST-LIMPIEZA ═══' AS info,
  COUNT(*) AS total_profiles,
  COUNT(CASE WHEN full_name IS NULL THEN 1 END) AS profiles_without_name,
  COUNT(CASE WHEN full_name IS NOT NULL AND full_name !~ '^[^@]+@[^@]+\.[^@]+$' THEN 1 END) AS profiles_with_valid_name,
  COUNT(CASE WHEN full_name IS NOT NULL AND full_name ~ '^[^@]+@[^@]+\.[^@]+$' THEN 1 END) AS profiles_with_email_as_name,
  COUNT(CASE WHEN template IS NOT NULL THEN 1 END) AS profiles_completed_wizard
FROM public.profiles;

-- 3.2: Test de inserción - Verificar que NO se usa email como nombre
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_email text := 'test-' || substring(test_user_id::text from 1 for 8) || '@example.com';
  result_name text;
BEGIN
  -- Simular creación de usuario sin full_name en metadata
  INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    aud,
    role
  ) VALUES (
    test_user_id,
    test_email,
    crypt('test123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{}'::jsonb,  -- ❌ SIN full_name
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  );

  -- Verificar el full_name en el perfil creado
  SELECT full_name INTO result_name
  FROM public.profiles
  WHERE id = test_user_id;

  -- Validar resultado
  IF result_name IS NULL THEN
    RAISE NOTICE '✅ CORRECTO: full_name es NULL cuando no se proporciona (no usa email como fallback)';
  ELSE
    RAISE WARNING '❌ ERROR: full_name fue establecido como "%". NO debería tener valor!', result_name;
  END IF;

  -- Limpiar datos de prueba
  DELETE FROM public.profiles WHERE id = test_user_id;
  DELETE FROM auth.users WHERE id = test_user_id;
END;
$$;

-- ========================================
-- DOCUMENTACIÓN
-- ========================================

COMMENT ON FUNCTION public.handle_new_user() IS
'Crea un perfil automáticamente cuando se registra un nuevo usuario.
IMPORTANTE: Si el usuario NO proporciona full_name en el signup, el campo queda NULL.
NO se usa el email como fallback - el usuario debe completar su nombre en el wizard.';

-- ========================================
-- FLUJO CORRECTO POST-MIGRACIÓN
-- ========================================
-- 1. Usuario se registra sin proporcionar nombre → full_name = NULL
-- 2. Dashboard muestra mensaje "Completa tu perfil"
-- 3. Usuario entra al wizard y completa su nombre real
-- 4. El nombre se guarda en el paso Identity del wizard
-- ========================================
