-- ========================================
-- Ver el código de TODAS las funciones de triggers en profiles
-- ========================================

-- 1. sync_email_to_profile_before
SELECT
    '=== sync_email_to_profile_before ===' AS section,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'sync_email_to_profile_before';

-- 2. sync_email_to_profile
SELECT
    '=== sync_email_to_profile ===' AS section,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'sync_email_to_profile';

-- 3. normalize_profile_role
SELECT
    '=== normalize_profile_role ===' AS section,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'normalize_profile_role';

-- 4. handle_profile_update
SELECT
    '=== handle_profile_update ===' AS section,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'handle_profile_update';

-- 5. validate_profile_slug
SELECT
    '=== validate_profile_slug ===' AS section,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'validate_profile_slug';
