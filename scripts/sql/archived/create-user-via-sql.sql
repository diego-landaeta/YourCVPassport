-- =====================================================
-- CREAR USUARIO VIA SQL DIRECTAMENTE
-- =====================================================
-- Si el Dashboard no te permite crear usuarios, usa este método

-- IMPORTANTE: Este script debe ejecutarse con privilegios de Service Role
-- Ejecuta esto desde el SQL Editor de Supabase Dashboard

-- Paso 1: Crear el usuario en auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  email_change_token_new,
  recovery_token
) VALUES (
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',  -- UUID fijo
  '00000000-0000-0000-0000-000000000000',  -- instance_id por defecto
  'lauvidal123@gmail.com',  -- Email
  crypt('LauraPass2024!', gen_salt('bf')),  -- Password encriptado (cámbialo después)
  NOW(),  -- Email confirmado inmediatamente
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Laura Martínez Vidal"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  email_confirmed_at = EXCLUDED.email_confirmed_at,
  updated_at = NOW();

-- Paso 2: Crear identidad en auth.identities
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  jsonb_build_object(
    'sub', 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
    'email', 'lauvidal123@gmail.com'
  ),
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id, provider) DO UPDATE SET
  updated_at = NOW();

-- Paso 3: Verificar que el usuario se creó
SELECT
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_user_meta_data->>'full_name' as full_name
FROM auth.users
WHERE id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';

-- Paso 4: Verificar que el perfil se creó automáticamente (si tienes trigger)
-- Si no existe, el script inject-laura-martinez-profile.sql lo creará
SELECT id, full_name, email, slug
FROM profiles
WHERE id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';

-- =====================================================
-- NOTAS IMPORTANTES:
-- =====================================================
-- 1. Password temporal: LauraPass2024! (cambiar después del primer login)
-- 2. Email: lauvidal123@gmail.com
-- 3. El email ya está confirmado (email_confirmed_at = NOW())
-- 4. Después de crear el usuario, ejecuta inject-laura-martinez-profile.sql
