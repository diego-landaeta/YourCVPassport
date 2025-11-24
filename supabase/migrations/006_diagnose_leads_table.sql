-- =============================================
-- Diagnóstico de la tabla leads
-- =============================================
-- Este script verifica el estado actual de la tabla leads

DO $$
DECLARE
    table_exists BOOLEAN;
    profile_id_exists BOOLEAN;
    rls_enabled BOOLEAN;
    policy_count INTEGER;
    column_info TEXT;
    policy_info TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '         DIAGNÓSTICO DE LA TABLA LEADS             ';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '';

    -- 1. Verificar si la tabla existe
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'leads'
    ) INTO table_exists;

    IF table_exists THEN
        RAISE NOTICE '✓ Tabla "leads" existe';
    ELSE
        RAISE WARNING '✗ Tabla "leads" NO existe';
        RETURN;
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '--- COLUMNAS DE LA TABLA ---';

    -- 2. Listar todas las columnas
    FOR column_info IN
        SELECT
            column_name || ' (' || data_type ||
            CASE
                WHEN is_nullable = 'NO' THEN ', NOT NULL'
                ELSE ''
            END || ')'
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'leads'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  %', column_info;
    END LOOP;

    -- 3. Verificar columna profile_id específicamente
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'profile_id'
    ) INTO profile_id_exists;

    RAISE NOTICE '';
    IF profile_id_exists THEN
        RAISE NOTICE '✓ Columna "profile_id" existe';
    ELSE
        RAISE WARNING '✗ Columna "profile_id" NO existe';
    END IF;

    -- 4. Verificar RLS
    SELECT relrowsecurity
    FROM pg_class
    WHERE relname = 'leads' AND relnamespace = 'public'::regnamespace
    INTO rls_enabled;

    RAISE NOTICE '';
    IF rls_enabled THEN
        RAISE NOTICE '✓ RLS está HABILITADO';
    ELSE
        RAISE NOTICE '✗ RLS está DESHABILITADO';
    END IF;

    -- 5. Listar políticas
    SELECT COUNT(*)
    FROM pg_policies
    WHERE tablename = 'leads' AND schemaname = 'public'
    INTO policy_count;

    RAISE NOTICE '';
    RAISE NOTICE '--- POLÍTICAS RLS (Total: %) ---', policy_count;

    IF policy_count > 0 THEN
        FOR policy_info IN
            SELECT
                '  • ' || policyname || ' (' || cmd || ')'
            FROM pg_policies
            WHERE tablename = 'leads' AND schemaname = 'public'
            ORDER BY policyname
        LOOP
            RAISE NOTICE '%', policy_info;
        END LOOP;
    ELSE
        RAISE NOTICE '  (sin políticas)';
    END IF;

    -- 6. Verificar foreign keys
    RAISE NOTICE '';
    RAISE NOTICE '--- FOREIGN KEYS ---';

    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.constraint_column_usage ccu
            ON tc.constraint_name = ccu.constraint_name
        WHERE tc.table_schema = 'public'
        AND tc.table_name = 'leads'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND ccu.column_name = 'profile_id'
    ) THEN
        RAISE NOTICE '  ✓ Foreign key en profile_id configurado';
    ELSE
        RAISE NOTICE '  ✗ NO hay foreign key en profile_id';
    END IF;

    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '         FIN DEL DIAGNÓSTICO                       ';
    RAISE NOTICE '═══════════════════════════════════════════════════';
    RAISE NOTICE '';

END $$;
