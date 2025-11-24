-- =============================================
-- YourCVPassport - Configurar políticas RLS para leads
-- =============================================
-- Este script configura las políticas de seguridad para permitir
-- que usuarios anónimos puedan enviar leads (formulario de contacto público)

-- =============================================
-- PASO 1: Habilitar RLS en la tabla leads
-- =============================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PASO 2: Eliminar políticas existentes
-- =============================================

DROP POLICY IF EXISTS "Users can view their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can insert leads to any profile" ON public.leads;
DROP POLICY IF EXISTS "Users can update their own leads" ON public.leads;
DROP POLICY IF EXISTS "Users can delete their own leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can view leads sent to them" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can update leads sent to them" ON public.leads;
DROP POLICY IF EXISTS "Anyone can insert leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can view their leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can update their leads" ON public.leads;
DROP POLICY IF EXISTS "Profile owners can delete their leads" ON public.leads;

-- =============================================
-- PASO 3: Crear políticas RLS para leads
-- =============================================

-- Política 1: Cualquiera puede insertar leads (usuarios anónimos pueden enviar mensajes)
-- Esto es necesario para el formulario de contacto público
CREATE POLICY "Anyone can insert leads"
ON public.leads
FOR INSERT
WITH CHECK (true);

-- Política 2: Los dueños de perfiles pueden ver los leads que les enviaron
CREATE POLICY "Profile owners can view their leads"
ON public.leads
FOR SELECT
USING (
    auth.uid() = profile_id
);

-- Política 3: Los dueños de perfiles pueden actualizar sus leads
-- (por ejemplo, marcar como leído, responder, archivar)
CREATE POLICY "Profile owners can update their leads"
ON public.leads
FOR UPDATE
USING (
    auth.uid() = profile_id
)
WITH CHECK (
    auth.uid() = profile_id
);

-- Política 4: Los dueños de perfiles pueden eliminar sus leads
CREATE POLICY "Profile owners can delete their leads"
ON public.leads
FOR DELETE
USING (
    auth.uid() = profile_id
);

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
    policy_names TEXT;
BEGIN
    -- Verificar que RLS está habilitado
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'leads' AND relnamespace = 'public'::regnamespace
    INTO rls_enabled;

    -- Contar políticas
    SELECT COUNT(*)
    FROM pg_policies
    WHERE tablename = 'leads' AND schemaname = 'public'
    INTO policy_count;

    -- Listar nombres de políticas
    SELECT string_agg(policyname, ', ' ORDER BY policyname)
    FROM pg_policies
    WHERE tablename = 'leads' AND schemaname = 'public'
    INTO policy_names;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '         VERIFICACIÓN DE POLÍTICAS RLS              ';
    RAISE NOTICE '═══════════════════════════════════════════════════';

    IF rls_enabled THEN
        RAISE NOTICE '✅ RLS está habilitado en la tabla leads';
    ELSE
        RAISE WARNING '❌ RLS NO está habilitado en la tabla leads';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '📊 Total de políticas: %', policy_count;
    RAISE NOTICE '';
    RAISE NOTICE '📋 Políticas configuradas:';
    RAISE NOTICE '   %', policy_names;
    RAISE NOTICE '';

    IF policy_count >= 4 THEN
        RAISE NOTICE '🎉 ¡Políticas RLS configuradas correctamente!';
        RAISE NOTICE '';
        RAISE NOTICE '✓ Usuarios anónimos pueden insertar leads';
        RAISE NOTICE '✓ Dueños de perfiles pueden ver sus leads';
        RAISE NOTICE '✓ Dueños de perfiles pueden actualizar sus leads';
        RAISE NOTICE '✓ Dueños de perfiles pueden eliminar sus leads';
    ELSE
        RAISE WARNING '⚠ Se esperaban al menos 4 políticas, pero solo hay %', policy_count;
    END IF;

    RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
