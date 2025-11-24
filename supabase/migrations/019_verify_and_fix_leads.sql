-- =============================================
-- Verificar y corregir estructura de tabla leads
-- =============================================

-- PASO 1: Ver estructura actual de la tabla leads
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'leads'
ORDER BY ordinal_position;

-- PASO 2: Verificar si existe recipient_id o profile_id
DO $$
BEGIN
    -- Si existe recipient_id pero NO profile_id, renombrar
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'recipient_id'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'profile_id'
    ) THEN
        ALTER TABLE public.leads RENAME COLUMN recipient_id TO profile_id;
        RAISE NOTICE '✓ Columna renombrada: recipient_id → profile_id';

    -- Si NO existe ninguna, agregarla
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'leads'
        AND column_name = 'profile_id'
    ) THEN
        ALTER TABLE public.leads ADD COLUMN profile_id UUID NOT NULL REFERENCES auth.users(id);
        RAISE NOTICE '✓ Columna profile_id creada';

    ELSE
        RAISE NOTICE '✓ Columna profile_id ya existe';
    END IF;
END $$;

-- PASO 3: Verificar estado final
SELECT
    '📊 ESTRUCTURA FINAL' as status,
    COUNT(*) FILTER (WHERE column_name = 'profile_id') as tiene_profile_id,
    COUNT(*) FILTER (WHERE column_name = 'recipient_id') as tiene_recipient_id
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'leads';
