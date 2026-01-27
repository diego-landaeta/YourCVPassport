-- =====================================================
-- FIX: Acceso de ADMIN a todos los stamps
-- Fecha: 12 enero 2026
-- Problema: Admins no pueden ver stamps de otros usuarios
-- Solución: Actualizar políticas RLS para soportar 'admin' y 'ADMIN'
-- =====================================================

-- Paso 1: Verificar políticas actuales
DO $$
BEGIN
  RAISE NOTICE 'Verificando políticas existentes en tabla stamps...';
END $$;

-- Paso 2: Eliminar política antigua si existe
DROP POLICY IF EXISTS "Admins can view all stamps" ON public.stamps;

-- Paso 3: Crear nueva política que soporte ambos formatos de rol
CREATE POLICY "Admins can view all stamps"
ON public.stamps FOR SELECT
TO authenticated
USING (
  -- Permitir si el usuario es admin (case-insensitive)
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND LOWER(role) = 'admin'
  )
);

-- Paso 4: También actualizar las demás políticas de admin para consistencia

-- UPDATE policy
DROP POLICY IF EXISTS "Admins can update stamps" ON public.stamps;
CREATE POLICY "Admins can update stamps"
ON public.stamps FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND LOWER(role) = 'admin'
  )
);

-- DELETE policy
DROP POLICY IF EXISTS "Admins can delete stamps" ON public.stamps;
CREATE POLICY "Admins can delete stamps"
ON public.stamps FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND LOWER(role) = 'admin'
  )
);

-- INSERT policy
DROP POLICY IF EXISTS "Admins can insert stamps" ON public.stamps;
CREATE POLICY "Admins can insert stamps"
ON public.stamps FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND LOWER(role) = 'admin'
  )
);

-- Paso 5: Asegurar que también existe la política para usuarios normales
DROP POLICY IF EXISTS "Users can view their own stamps" ON public.stamps;
CREATE POLICY "Users can view their own stamps"
ON public.stamps FOR SELECT
TO authenticated
USING (auth.uid() = profile_id);

DROP POLICY IF EXISTS "Users can insert their own stamps" ON public.stamps;
CREATE POLICY "Users can insert their own stamps"
ON public.stamps FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = profile_id);

-- Paso 6: Agregar política para que el público pueda ver stamps VERIFIED
-- (necesario para mostrar badges de verificación en perfiles públicos)
DROP POLICY IF EXISTS "Public can view verified stamps" ON public.stamps;
CREATE POLICY "Public can view verified stamps"
ON public.stamps FOR SELECT
TO authenticated, anon
USING (status = 'VERIFIED');

-- Paso 7: Verificar que las políticas se crearon correctamente
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'stamps';

  RAISE NOTICE 'Total de políticas RLS en tabla stamps: %', policy_count;

  IF policy_count >= 7 THEN
    RAISE NOTICE '✅ Políticas RLS configuradas correctamente';
  ELSE
    RAISE WARNING '⚠️  Número inesperado de políticas. Esperado: 7, Encontrado: %', policy_count;
  END IF;
END $$;

-- Paso 8: Mostrar todas las políticas creadas
SELECT
  policyname,
  cmd as operation,
  roles,
  CASE
    WHEN policyname LIKE '%Admin%' THEN '🔐 Admin'
    WHEN policyname LIKE '%User%' THEN '👤 User'
    WHEN policyname LIKE '%Public%' THEN '🌍 Public'
    ELSE '❓ Other'
  END as policy_type
FROM pg_policies
WHERE tablename = 'stamps'
ORDER BY cmd, policyname;
