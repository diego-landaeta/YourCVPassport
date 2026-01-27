-- ========================================
-- DESHABILITAR TRIGGERS TEMPORALMENTE PARA CREAR USUARIO
-- ========================================

-- Deshabilitar los triggers que pueden estar causando el error
ALTER TABLE public.profiles DISABLE TRIGGER validate_slug_trigger;
ALTER TABLE public.profiles DISABLE TRIGGER zzz_prevent_auto_slug_trigger;

-- Verificar que están deshabilitados
SELECT
    t.tgname AS trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN '✅ ENABLED'
        WHEN 'D' THEN '❌ DISABLED'
        ELSE 'OTHER'
    END AS status
FROM pg_trigger t
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
  AND t.tgname IN ('validate_slug_trigger', 'zzz_prevent_auto_slug_trigger')
ORDER BY t.tgname;
