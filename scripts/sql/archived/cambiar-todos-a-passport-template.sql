-- ============================================================================
-- CAMBIAR TODOS LOS TUTORES ISEIH A PASSPORT TEMPLATE
-- ============================================================================

-- Actualizar TODOS los perfiles con email @iseih.edu a passport
UPDATE public.profiles
SET
    template = 'passport',
    updated_at = NOW()
WHERE email LIKE '%@iseih.edu';

-- Actualizar también los 10 tutores ISEIH por nombre (por si tienen emails diferentes)
UPDATE public.profiles
SET
    template = 'passport',
    updated_at = NOW()
WHERE full_name IN (
    'Rebecca Anderson',
    'Karen White',
    'Paul Henderson',
    'Jessica Porter',
    'Alex Martinez',
    'Diana Russell',
    'Michelle Chang',
    'Robert Kim',
    'Catherine Adams',
    'Mark Davidson'
);

-- VERIFICACIÓN: Ver todos los tutores ISEIH con su template
SELECT
    full_name,
    email,
    template,
    CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN '✅' ELSE '❌' END as foto
FROM public.profiles
WHERE email LIKE '%@iseih.edu'
   OR full_name IN (
       'Rebecca Anderson',
       'Karen White',
       'Paul Henderson',
       'Jessica Porter',
       'Alex Martinez',
       'Diana Russell',
       'Michelle Chang',
       'Robert Kim',
       'Catherine Adams',
       'Mark Davidson'
   )
ORDER BY full_name;

-- Resultado esperado: Todos deben mostrar template = 'passport'
