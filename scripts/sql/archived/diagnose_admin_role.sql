-- =====================================================
-- DIAGNOSTICAR ROLES DE ADMIN
-- =====================================================

-- Paso 1: Ver todos los roles que existen
SELECT 
    role,
    COUNT(*) as count
FROM profiles
GROUP BY role;

-- Paso 2: Ver usuarios que son admin (diferentes variaciones)
SELECT 
    id,
    full_name,
    email,
    role,
    created_at
FROM profiles
WHERE 
    role IN ('admin', 'ADMIN', 'Admin')
    OR role ILIKE '%admin%'
ORDER BY created_at;

-- Paso 3: Ver el tipo de dato de la columna role
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
    AND column_name = 'role';

-- Paso 4: Verificar la política actual para admins
SELECT
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'stamps'
    AND policyname LIKE '%admin%';
