-- =====================================================
-- DIAGNOSE STAMPS TABLE STRUCTURE
-- =====================================================

-- Check if stamp_type enum exists
SELECT
    'ENUM EXISTS' as check_type,
    typname as type_name,
    enumlabel as enum_value
FROM pg_type t
LEFT JOIN pg_enum e ON t.oid = e.enumtypid
WHERE typname = 'stamp_type'
ORDER BY enumsortorder;

-- Check stamps table column types
SELECT
    'COLUMN TYPE' as check_type,
    column_name,
    data_type,
    udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'stamps'
AND column_name = 'type';

-- Check constraints on stamps table
SELECT
    'CONSTRAINTS' as check_type,
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.stamps'::regclass
AND contype = 'c';
