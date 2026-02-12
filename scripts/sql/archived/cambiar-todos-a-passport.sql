-- ============================================================================
-- CAMBIAR TODOS LOS PERFILES PROFESIONALES A TEMPLATE 'passport'
-- ============================================================================

-- Actualizar TODOS los perfiles profesionales a passport
UPDATE public.profiles
SET
    template = 'passport',
    updated_at = NOW()
WHERE role = 'professional';

-- VERIFICACIÓN: Ver cuántos perfiles hay por template ahora
SELECT
    template,
    COUNT(*) as cantidad,
    COUNT(CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 1 END) as con_foto,
    COUNT(CASE WHEN avatar_url IS NULL OR avatar_url = '' THEN 1 END) as sin_foto
FROM public.profiles
WHERE role = 'professional'
GROUP BY template
ORDER BY cantidad DESC;

-- Resultado esperado: Solo debería aparecer 'passport' con 40 perfiles totales
