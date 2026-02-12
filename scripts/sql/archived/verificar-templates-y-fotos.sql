-- ============================================================================
-- VERIFICAR TEMPLATES Y FOTOS DE PERFIL
-- ============================================================================

-- PASO 1: Ver qué template usa Janet Lee
SELECT
    full_name,
    template,
    avatar_url
FROM public.profiles
WHERE full_name = 'Janet Lee';

-- PASO 2: Ver todos los templates actualmente en uso
SELECT
    template,
    COUNT(*) as cantidad
FROM public.profiles
WHERE role = 'professional'
GROUP BY template
ORDER BY cantidad DESC;

-- PASO 3: Ver perfiles SIN foto de perfil (excluyendo la lista que ya tiene foto)
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

-- PASO 4: Ver TODOS los tutores ISEIH y sus templates
SELECT
    full_name,
    email,
    template,
    CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN '✅ Tiene foto' ELSE '❌ Sin foto' END as foto_status
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

-- PASO 5: Contar perfiles con y sin foto
SELECT
    CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 'Con foto' ELSE 'Sin foto' END as estado,
    COUNT(*) as cantidad
FROM public.profiles
WHERE role = 'professional'
GROUP BY CASE WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN 'Con foto' ELSE 'Sin foto' END;
