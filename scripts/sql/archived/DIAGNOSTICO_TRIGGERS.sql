-- =====================================================
-- DIAGNÓSTICO: Ver triggers de la tabla PROFILES
-- =====================================================

-- Ver todos los triggers en profiles
SELECT
  tgname AS trigger_name,
  tgtype AS trigger_type,
  tgenabled AS enabled,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.profiles'::regclass
ORDER BY tgname;

-- Ver específicamente triggers que se ejecuten en INSERT
SELECT
  t.tgname AS trigger_name,
  CASE
    WHEN t.tgtype::integer & 2 = 2 THEN 'BEFORE'
    WHEN t.tgtype::integer & 64 = 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS trigger_timing,
  CASE
    WHEN t.tgtype::integer & 4 = 4 THEN 'INSERT'
    WHEN t.tgtype::integer & 8 = 8 THEN 'DELETE'
    WHEN t.tgtype::integer & 16 = 16 THEN 'UPDATE'
  END AS trigger_event,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgrelid = 'public.profiles'::regclass
  AND t.tgtype::integer & 4 = 4  -- Solo triggers de INSERT
ORDER BY tgname;
