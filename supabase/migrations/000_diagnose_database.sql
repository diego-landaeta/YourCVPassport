-- =============================================
-- Diagnóstico de Base de Datos - YourCVPassport
-- =============================================
-- Ejecuta este script PRIMERO para ver qué falta en tu base de datos
-- Los resultados te dirán exactamente qué necesitas corregir

-- =============================================
-- 1. Verificar si existe la tabla 'leads'
-- =============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'leads'
    ) THEN
        RAISE NOTICE '✅ Tabla "leads" existe';
    ELSE
        RAISE WARNING '❌ Tabla "leads" NO existe - necesitas crearla primero';
    END IF;
END $$;

-- =============================================
-- 2. Verificar columnas de la tabla 'leads'
-- =============================================
DO $$
DECLARE
    has_recipient_id BOOLEAN;
    has_profile_id BOOLEAN;
    column_list TEXT;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'leads') THEN

        -- Verificar recipient_id
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'recipient_id'
        ) INTO has_recipient_id;

        -- Verificar profile_id
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'profile_id'
        ) INTO has_profile_id;

        -- Obtener lista de columnas
        SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads'
        INTO column_list;

        RAISE NOTICE '';
        RAISE NOTICE '📋 Columnas en tabla "leads": %', column_list;
        RAISE NOTICE '';

        IF has_recipient_id THEN
            RAISE NOTICE '✅ Columna "recipient_id" existe en leads';
        ELSIF has_profile_id THEN
            RAISE NOTICE '⚠️  Columna "profile_id" existe pero debería llamarse "recipient_id"';
            RAISE NOTICE '   Acción sugerida: Renombrar profile_id a recipient_id';
        ELSE
            RAISE WARNING '❌ Columna "recipient_id" NO existe en leads';
            RAISE NOTICE '   Acción sugerida: Agregar columna recipient_id';
        END IF;
    END IF;
END $$;

-- =============================================
-- 3. Verificar si existe la tabla 'messages'
-- =============================================
DO $$
DECLARE
    msg_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'messages'
    ) THEN
        SELECT COUNT(*) FROM public.messages INTO msg_count;
        RAISE NOTICE '✅ Tabla "messages" existe (% mensajes)', msg_count;
    ELSE
        RAISE WARNING '❌ Tabla "messages" NO existe - se creará con el script de migración';
    END IF;
END $$;

-- =============================================
-- 4. Verificar si existe la vista 'conversation_summaries'
-- =============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.views
        WHERE table_schema = 'public' AND table_name = 'conversation_summaries'
    ) THEN
        RAISE NOTICE '✅ Vista "conversation_summaries" existe';
    ELSE
        RAISE WARNING '❌ Vista "conversation_summaries" NO existe - se creará con el script de migración';
    END IF;
END $$;

-- =============================================
-- 5. Verificar si existe la tabla 'profiles'
-- =============================================
DO $$
DECLARE
    profile_count INTEGER;
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'profiles'
    ) THEN
        SELECT COUNT(*) FROM public.profiles INTO profile_count;
        RAISE NOTICE '✅ Tabla "profiles" existe (% perfiles)', profile_count;
    ELSE
        RAISE WARNING '❌ Tabla "profiles" NO existe - la vista conversation_summaries la necesita';
    END IF;
END $$;

-- =============================================
-- 6. Verificar políticas RLS
-- =============================================
DO $$
DECLARE
    rls_enabled BOOLEAN;
    policy_count INTEGER;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'messages') THEN

        -- Verificar si RLS está habilitado
        SELECT relrowsecurity
        FROM pg_class
        WHERE relname = 'messages' AND relnamespace = 'public'::regnamespace
        INTO rls_enabled;

        -- Contar políticas
        SELECT COUNT(*)
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'messages'
        INTO policy_count;

        IF rls_enabled THEN
            RAISE NOTICE '✅ RLS habilitado en "messages" (% políticas)', policy_count;
        ELSE
            RAISE WARNING '❌ RLS NO habilitado en "messages"';
        END IF;
    END IF;
END $$;

-- =============================================
-- 7. Verificar Realtime
-- =============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
    ) THEN
        RAISE NOTICE '✅ Realtime habilitado para "messages"';
    ELSE
        RAISE WARNING '❌ Realtime NO habilitado para "messages"';
    END IF;
END $$;

-- =============================================
-- RESUMEN
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE 'DIAGNÓSTICO COMPLETADO';
    RAISE NOTICE '═══════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE '📝 SIGUIENTE PASO:';
    RAISE NOTICE '   1. Revisa los mensajes de arriba';
    RAISE NOTICE '   2. Si hay ❌, ejecuta: 002_fix_leads_and_messaging.sql';
    RAISE NOTICE '   3. Si todo tiene ✅, tu base de datos está lista';
    RAISE NOTICE '';
END $$;
