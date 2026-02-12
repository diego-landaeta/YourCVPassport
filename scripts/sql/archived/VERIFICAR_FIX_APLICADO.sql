-- ========================================
-- VERIFICAR SI EL FIX SE APLICÓ CORRECTAMENTE
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- VER EL CÓDIGO ACTUAL de la función on_profiles_created_sync_email
SELECT pg_get_functiondef(p.oid) AS codigo_funcion
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname = 'on_profiles_created_sync_email';

-- Si el código contiene 'user-' o 'slug' → EL FIX NO SE APLICÓ
-- Si el código SOLO menciona 'email' → EL FIX SÍ SE APLICÓ
