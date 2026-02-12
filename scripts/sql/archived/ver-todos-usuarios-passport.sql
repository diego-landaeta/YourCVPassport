-- ============================================================================
-- VER TODOS LOS USUARIOS CON TEMPLATE 'passport'
-- ============================================================================

SELECT
    full_name,
    email,
    template,
    role,
    CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN '✅ Con foto' ELSE '❌ Sin foto' END as foto_status,
    avatar_url
FROM public.profiles
WHERE template = 'passport'
ORDER BY full_name;

-- Ver resumen de cuántos perfiles tienen cada template
SELECT
    template,
    COUNT(*) as cantidad,
    COUNT(CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 1 END) as con_foto,
    COUNT(CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN 1 END) as sin_foto
FROM public.profiles
WHERE role = 'professional'
GROUP BY template
ORDER BY cantidad DESC;
