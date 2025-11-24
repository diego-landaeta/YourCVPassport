-- =============================================
-- Verificar a quién pertenece el profile_id del lead
-- =============================================

-- Mostrar información del perfil que recibió el lead
SELECT
    p.id as profile_id,
    p.full_name,
    p.email,
    p.role,
    u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.id = '93856aad-e6cb-49c8-b912-123389d3e2ad';

-- Mostrar todos los perfiles para comparar
SELECT
    p.id as profile_id,
    p.full_name,
    p.email,
    p.role
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 10;
