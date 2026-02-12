-- ============================================================================
-- FIX REBECCA ROLE Y OCULTAR CARLOS DEFINITIVAMENTE
-- ============================================================================

-- PASO 1: Arreglar el role de Rebecca Anderson a 'company'
UPDATE public.profiles
SET
    role = 'company',
    updated_at = NOW()
WHERE id = '54701b32-af6e-4923-846d-8a04fad249a8';

-- PASO 2: Ocultar Carlos Saiz definitivamente
UPDATE public.profiles
SET
    role = 'archived',
    profile_hidden = true,
    updated_at = NOW()
WHERE full_name LIKE '%Carlos%Saiz%';

-- PASO 3: Verificar Rebecca Anderson
SELECT
    'Rebecca Anderson' as perfil,
    id,
    full_name,
    role,
    email,
    LENGTH(summary) as summary_chars,
    LENGTH(headline) as headline_chars
FROM public.profiles
WHERE id = '54701b32-af6e-4923-846d-8a04fad249a8';

-- PASO 4: Verificar Carlos Saiz está oculto
SELECT
    'Carlos Saiz - Debe estar archived' as perfil,
    full_name,
    role,
    profile_hidden
FROM public.profiles
WHERE full_name LIKE '%Carlos%Saiz%';

-- PASO 5: Verificar que Rebecca tiene todos sus datos
SELECT
    'Datos completos de Rebecca' as verificacion,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = '54701b32-af6e-4923-846d-8a04fad249a8') as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = '54701b32-af6e-4923-846d-8a04fad249a8') as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = '54701b32-af6e-4923-846d-8a04fad249a8' AND type = 'CERTIFICATION') as certs;

-- PASO 6: Ver todos los perfiles que aparecerán en /companies/search
SELECT
    full_name,
    email,
    role,
    LENGTH(headline) as headline_len,
    profile_hidden
FROM public.profiles
WHERE role = 'company' AND (profile_hidden = false OR profile_hidden IS NULL)
ORDER BY full_name;
