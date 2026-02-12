-- ============================================================================
-- VERIFICAR 9 TUTORES ISEIH
-- ============================================================================
-- Ejecuta esto ANTES y DESPUÉS de crear los tutores para comparar
-- ============================================================================

-- PASO 1: Ver cuántos tutores ISEIH existen actualmente
SELECT COUNT(*) as total_tutores_iseih
FROM public.profiles
WHERE email LIKE '%@iseih.edu';

-- PASO 2: Ver tutores ISEIH que ya existen
SELECT
    full_name,
    email,
    role,
    wizard_completed,
    slug,
    template,
    LENGTH(headline) as headline_len
FROM public.profiles
WHERE email LIKE '%@iseih.edu'
ORDER BY full_name;

-- PASO 3: Verificar los 9 UUIDs específicos
SELECT
    'UUID Check' as tipo,
    full_name,
    email,
    CASE WHEN id IN (
        '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1',  -- Karen
        '36c177f5-19f4-47c7-85c7-05507347e702',  -- Paul
        '55333d11-13c8-43b8-942b-cb1e75d0b812',  -- Jessica
        '099840cc-a99c-480d-8fd9-fba5ecd5a4a6',  -- Alex
        '636e9e4d-4873-4114-8949-376a8d0f24bc',  -- Diana
        'f30db5f9-0807-4d48-aa76-de4b6d7278da',  -- Michelle
        '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da',  -- Robert
        'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15',  -- Catherine
        '707aa7e3-b891-485c-b4e6-618625713565'   -- Mark
    ) THEN 'EXISTE' ELSE 'NO EXISTE' END as status
FROM public.profiles
WHERE id IN (
    '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1',
    '36c177f5-19f4-47c7-85c7-05507347e702',
    '55333d11-13c8-43b8-942b-cb1e75d0b812',
    '099840cc-a99c-480d-8fd9-fba5ecd5a4a6',
    '636e9e4d-4873-4114-8949-376a8d0f24bc',
    'f30db5f9-0807-4d48-aa76-de4b6d7278da',
    '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da',
    'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15',
    '707aa7e3-b891-485c-b4e6-618625713565'
)
ORDER BY full_name;

-- PASO 4: Verificación detallada de los 9 nuevos tutores
SELECT
    full_name,
    email,
    role,
    wizard_completed,
    slug,
    template,
    profile_hidden,
    LENGTH(summary) as summary_chars,
    LENGTH(headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = profiles.id AND type = 'CERTIFICATION') as certs
FROM public.profiles
WHERE id IN (
    '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1',  -- Karen White
    '36c177f5-19f4-47c7-85c7-05507347e702',  -- Paul Henderson
    '55333d11-13c8-43b8-942b-cb1e75d0b812',  -- Jessica Porter
    '099840cc-a99c-480d-8fd9-fba5ecd5a4a6',  -- Alex Martinez
    '636e9e4d-4873-4114-8949-376a8d0f24bc',  -- Diana Russell
    'f30db5f9-0807-4d48-aa76-de4b6d7278da',  -- Michelle Chang
    '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da',  -- Robert Kim
    'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15',  -- Catherine Adams
    '707aa7e3-b891-485c-b4e6-618625713565'   -- Mark Davidson
)
ORDER BY full_name;

-- PASO 5: Validación de calidad (deben cumplir TODOS estos criterios)
SELECT
    full_name,
    CASE WHEN role = 'professional' THEN '✅' ELSE '❌' END as role_ok,
    CASE WHEN wizard_completed = true THEN '✅' ELSE '❌' END as wizard_ok,
    CASE WHEN slug IS NOT NULL THEN '✅' ELSE '❌' END as slug_ok,
    CASE WHEN template IS NOT NULL THEN '✅' ELSE '❌' END as template_ok,
    CASE WHEN LENGTH(headline) >= 30 THEN '✅' ELSE '❌' END as headline_ok,
    CASE WHEN LENGTH(summary) >= 200 THEN '✅' ELSE '❌' END as summary_ok,
    CASE WHEN (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) >= 4 THEN '✅' ELSE '❌' END as exp_ok,
    CASE WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) >= 12 THEN '✅' ELSE '❌' END as skills_ok,
    CASE WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = profiles.id AND type = 'CERTIFICATION') >= 3 THEN '✅' ELSE '❌' END as certs_ok
FROM public.profiles
WHERE id IN (
    '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1',
    '36c177f5-19f4-47c7-85c7-05507347e702',
    '55333d11-13c8-43b8-942b-cb1e75d0b812',
    '099840cc-a99c-480d-8fd9-fba5ecd5a4a6',
    '636e9e4d-4873-4114-8949-376a8d0f24bc',
    'f30db5f9-0807-4d48-aa76-de4b6d7278da',
    '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da',
    'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15',
    '707aa7e3-b891-485c-b4e6-618625713565'
)
ORDER BY full_name;

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ============================================================================
-- PASO 1: Debe mostrar cuántos tutores ISEIH hay (antes: 1, después: 10)
-- PASO 2: Lista de todos los tutores ISEIH
-- PASO 3: Verifica que los 9 UUIDs existen en profiles
-- PASO 4: Detalles completos de cada tutor
-- PASO 5: Validación de calidad - TODAS las columnas deben mostrar ✅
--
-- Si algún tutor muestra ❌ en PASO 5, hay un problema que debe corregirse
-- ============================================================================
