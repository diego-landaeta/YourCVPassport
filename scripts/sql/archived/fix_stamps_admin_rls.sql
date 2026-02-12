-- =====================================================
-- FIX: Permitir que ADMINS vean TODOS los stamps
-- =====================================================

-- Paso 1: Verificar políticas actuales
SELECT
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'stamps';

-- Paso 2: Crear política para que ADMINS puedan ver TODOS los stamps
-- (sin importar el profile_id)

-- Primero, eliminar la política si ya existe
DROP POLICY IF EXISTS "Admins can view all stamps" ON stamps;

-- Crear nueva política para admins
CREATE POLICY "Admins can view all stamps"
ON stamps
FOR SELECT
TO authenticated
USING (
  -- Permitir si el usuario es admin
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
  OR
  -- O si es el dueño del stamp
  auth.uid() = profile_id
);

-- Paso 3: Verificar que la política se creó
SELECT
  policyname,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'stamps'
AND policyname = 'Admins can view all stamps';

-- Paso 4: Probar que funciona - contar stamps pendientes
-- (Ejecuta esto logueado como admin)
SELECT
  COUNT(*) as pending_stamps
FROM stamps
WHERE status = 'PENDING';
