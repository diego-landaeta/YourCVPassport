-- =====================================================
-- VERIFICACIÓN DE MIGRACIONES ANTES DE SETUP DEMO
-- =====================================================
-- Este script verifica que todas las migraciones necesarias
-- estén aplicadas antes de ejecutar el setup de usuarios demo
-- =====================================================

\echo '======================================================'
\echo '🔍 VERIFICANDO MIGRACIONES REQUERIDAS'
\echo '======================================================'

-- =====================================================
-- CHECK 1: Verificar tipo CERTIFICATION en stamp_type enum
-- =====================================================
\echo ''
\echo '1️⃣ Verificando tipo CERTIFICATION en stamp_type enum...'

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_enum
        WHERE enumtypid = 'stamp_type'::regtype
        AND enumlabel = 'CERTIFICATION'
    ) THEN
        RAISE NOTICE '   ✅ CERTIFICATION encontrado en stamp_type enum';
    ELSE
        RAISE EXCEPTION '   ❌ ERROR: CERTIFICATION no existe en stamp_type enum. Ejecutar: 20260122_add_certification_stamp_type.sql';
    END IF;
END $$;

-- =====================================================
-- CHECK 2: Verificar columnas en portfolio_items
-- =====================================================
\echo ''
\echo '2️⃣ Verificando columnas de certificaciones en portfolio_items...'

DO $$
DECLARE
    columnas_faltantes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Verificar cada columna requerida
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_items' AND column_name = 'type') THEN
        columnas_faltantes := array_append(columnas_faltantes, 'type');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_items' AND column_name = 'issuer') THEN
        columnas_faltantes := array_append(columnas_faltantes, 'issuer');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_items' AND column_name = 'issue_date') THEN
        columnas_faltantes := array_append(columnas_faltantes, 'issue_date');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_items' AND column_name = 'verified') THEN
        columnas_faltantes := array_append(columnas_faltantes, 'verified');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'portfolio_items' AND column_name = 'credential_id') THEN
        columnas_faltantes := array_append(columnas_faltantes, 'credential_id');
    END IF;

    IF array_length(columnas_faltantes, 1) > 0 THEN
        RAISE EXCEPTION '   ❌ ERROR: Columnas faltantes en portfolio_items: %. Ejecutar: 20260122_update_portfolio_items_for_certifications.sql', array_to_string(columnas_faltantes, ', ');
    ELSE
        RAISE NOTICE '   ✅ Todas las columnas necesarias existen en portfolio_items';
    END IF;
END $$;

-- =====================================================
-- CHECK 3: Verificar constraint de tipo en portfolio_items
-- =====================================================
\echo ''
\echo '3️⃣ Verificando constraint de tipo en portfolio_items...'

DO $$
DECLARE
    constraint_def TEXT;
BEGIN
    SELECT pg_get_constraintdef(oid) INTO constraint_def
    FROM pg_constraint
    WHERE conrelid = 'portfolio_items'::regclass
    AND conname = 'portfolio_items_type_check';

    IF constraint_def IS NULL THEN
        RAISE EXCEPTION '   ❌ ERROR: Constraint portfolio_items_type_check no existe. Ejecutar: 20260122_update_portfolio_items_for_certifications.sql';
    ELSIF constraint_def LIKE '%CERTIFICATION%' AND constraint_def LIKE '%COLLABORATION%' THEN
        RAISE NOTICE '   ✅ Constraint incluye CERTIFICATION y COLLABORATION';
    ELSE
        RAISE EXCEPTION '   ❌ ERROR: Constraint no incluye CERTIFICATION o COLLABORATION. Ejecutar: 20260122_update_portfolio_items_for_certifications.sql';
    END IF;
END $$;

-- =====================================================
-- CHECK 4: Verificar columnas entity_id y entity_type en stamps
-- =====================================================
\echo ''
\echo '4️⃣ Verificando columnas entity_id y entity_type en stamps...'

DO $$
DECLARE
    columnas_faltantes TEXT[] := ARRAY[]::TEXT[];
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'entity_id') THEN
        columnas_faltantes := array_append(columnas_faltantes, 'entity_id');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stamps' AND column_name = 'entity_type') THEN
        columnas_faltantes := array_append(columnas_faltantes, 'entity_type');
    END IF;

    IF array_length(columnas_faltantes, 1) > 0 THEN
        RAISE EXCEPTION '   ❌ ERROR: Columnas faltantes en stamps: %. Ejecutar: 20260122_enable_certification_verification.sql', array_to_string(columnas_faltantes, ', ');
    ELSE
        RAISE NOTICE '   ✅ Columnas entity_id y entity_type existen en stamps';
    END IF;
END $$;

-- =====================================================
-- CHECK 5: Verificar políticas RLS para certificaciones
-- =====================================================
\echo ''
\echo '5️⃣ Verificando políticas RLS...'

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'stamps'
    AND (policyname LIKE '%certification%' OR policyname LIKE '%admin%');

    IF policy_count > 0 THEN
        RAISE NOTICE '   ✅ Políticas RLS para stamps encontradas (% políticas)', policy_count;
    ELSE
        RAISE WARNING '   ⚠️  No se encontraron políticas RLS específicas. Puede ser normal si usan políticas genéricas.';
    END IF;
END $$;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================
\echo ''
\echo '======================================================'
\echo '✅ VERIFICACIÓN COMPLETADA EXITOSAMENTE'
\echo '======================================================'
\echo ''
\echo '🎯 Todas las migraciones necesarias están aplicadas.'
\echo '✅ Puedes ejecutar el setup de usuarios demo con seguridad:'
\echo '   psql -f EJECUTAR_SETUP_USUARIOS_DEMO.sql'
\echo ''
\echo '======================================================'

-- Mostrar tipos de stamp disponibles
\echo ''
\echo '📋 Tipos de stamp disponibles:'
SELECT enumlabel as stamp_type
FROM pg_enum
WHERE enumtypid = 'stamp_type'::regtype
ORDER BY enumsortorder;

-- Mostrar constraint de portfolio_items
\echo ''
\echo '📋 Constraint de tipo en portfolio_items:'
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'portfolio_items'::regclass
AND conname = 'portfolio_items_type_check';
