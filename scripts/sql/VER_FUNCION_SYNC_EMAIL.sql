-- ========================================
-- Ver el código de la función on_profiles_created_sync_email
-- ========================================

SELECT
    p.proname AS function_name,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'on_profiles_created_sync_email';
