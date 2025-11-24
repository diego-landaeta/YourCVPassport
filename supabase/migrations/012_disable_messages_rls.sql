-- =============================================
-- Deshabilitar RLS en la tabla messages
-- =============================================
-- Esto permite que los usuarios anónimos puedan crear mensajes
-- cuando envían un lead desde el formulario de contacto

-- Eliminar todas las políticas de messages
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.messages;

-- Deshabilitar RLS
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;

-- Verificación
DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'messages' AND relnamespace = 'public'::regnamespace
    INTO rls_enabled;

    SELECT COUNT(*)
    FROM pg_policies
    WHERE tablename = 'messages' AND schemaname = 'public'
    INTO policy_count;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '    CONFIGURACIÓN RLS PARA TABLA MESSAGES          ';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '';

    IF NOT rls_enabled THEN
        RAISE NOTICE '✅ RLS está DESHABILITADO en messages';
    ELSE
        RAISE WARNING '⚠ RLS todavía está habilitado en messages';
    END IF;

    RAISE NOTICE '📊 Políticas restantes: %', policy_count;

    IF policy_count = 0 THEN
        RAISE NOTICE '✅ Todas las políticas fueron eliminadas';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '🎉 Configuración completada!';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
END $$;
