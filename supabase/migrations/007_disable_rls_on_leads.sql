-- =============================================
-- YourCVPassport - Deshabilitar RLS en leads
-- =============================================
-- Este script deshabilita RLS en la tabla leads para permitir
-- que cualquiera pueda insertar leads (formulario de contacto público)
-- y que los usuarios autenticados puedan ver solo sus propios leads
-- mediante filtros en el código de la aplicación

-- =============================================
-- PASO 1: Eliminar todas las políticas existentes
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
-- PASO 2: Deshabilitar RLS en la tabla leads
-- =============================================

ALTER TABLE public.leads DISABLE ROW LEVEL SECURITY;

-- =============================================
-- VERIFICACIÓN FINAL
-- =============================================

DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    -- Verificar que RLS está deshabilitado
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'leads' AND relnamespace = 'public'::regnamespace
    INTO rls_enabled;

    -- Contar políticas restantes
    SELECT COUNT(*)
    FROM pg_policies
    WHERE tablename = 'leads' AND schemaname = 'public'
    INTO policy_count;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '    CONFIGURACIÓN RLS PARA TABLA LEADS             ';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '';

    IF NOT rls_enabled THEN
        RAISE NOTICE '✅ RLS está DESHABILITADO (correcto para formulario público)';
    ELSE
        RAISE WARNING '⚠ RLS todavía está habilitado';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '📊 Políticas restantes: %', policy_count;

    IF policy_count = 0 THEN
        RAISE NOTICE '✅ Todas las políticas fueron eliminadas';
    ELSE
        RAISE WARNING '⚠ Todavía hay % políticas activas', policy_count;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '🎉 Configuración completada!';
    RAISE NOTICE '';
    RAISE NOTICE 'NOTA: Con RLS deshabilitado, la tabla "leads" acepta';
    RAISE NOTICE 'inserciones de usuarios anónimos (formulario público).';
    RAISE NOTICE 'El acceso de lectura debe ser controlado por la aplicación';
    RAISE NOTICE 'usando filtros en las consultas (profile_id = auth.uid()).';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';

END $$;
