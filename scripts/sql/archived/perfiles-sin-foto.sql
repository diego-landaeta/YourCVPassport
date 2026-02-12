-- ============================================================================
-- PERFILES SIN FOTO (EXCLUYENDO LOS QUE YA TIENEN)
-- ============================================================================
-- Lista de perfiles profesionales sin avatar_url
-- EXCLUYENDO: Linda Zhang, Daniel Foster, Priya Sharma, Christopher Barnes,
--             Nicole Taylor, Elizabeth Morgan, Richard Hamilton, Maria Gonzalez,
--             Janet Lee, Steven Mitchell, Angela Roberts, Brian Cooper
-- ============================================================================

SELECT
    full_name,
    email,
    template,
    avatar_url
FROM public.profiles
WHERE role = 'professional'
  AND full_name NOT IN (
    'Linda Zhang',
    'Daniel Foster',
    'Priya Sharma',
    'Christopher Barnes',
    'Nicole Taylor',
    'Elizabeth Morgan',
    'Richard Hamilton',
    'Maria Gonzalez',
    'Janet Lee',
    'Steven Mitchell',
    'Angela Roberts',
    'Brian Cooper'
  )
  AND (avatar_url IS NULL OR avatar_url = '')
ORDER BY full_name;

-- ============================================================================
-- NOTA: Estos perfiles necesitan que subas una foto manualmente
-- Después de subir, actualiza el avatar_url con:
-- UPDATE public.profiles SET avatar_url = 'URL_AQUI' WHERE id = 'UUID_AQUI';
-- ============================================================================
