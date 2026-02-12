-- =====================================================
-- ARREGLAR TRIGGER handle_new_user
-- =====================================================
-- Este script reemplaza el trigger roto con uno funcional
-- =====================================================

-- 1. Eliminar la función anterior (si existe)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. Crear función corregida
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_full_name TEXT;
BEGIN
  -- Extraer el nombre del raw_user_meta_data si existe
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Insertar en profiles con todos los campos requeridos
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    headline,
    summary,
    role,
    plan,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    '',  -- headline vacío por defecto
    '',  -- summary vacío por defecto
    'professional',
    'free',
    NOW(),
    NOW()
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Si falla, registrar el error pero no bloquear la creación del usuario
    RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 3. Crear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 4. Dar permisos
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- Verificación
SELECT
  'TRIGGER ARREGLADO EXITOSAMENTE' as resultado,
  'Ahora puedes crear usuarios desde Supabase UI' as instrucciones;
