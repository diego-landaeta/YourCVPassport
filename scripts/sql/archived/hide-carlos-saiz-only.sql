-- ============================================================================
-- OCULTAR CARLOS SAIZ - SOLO ESTO
-- ============================================================================

UPDATE public.profiles
SET
    role = 'archived',
    profile_hidden = true
WHERE full_name LIKE '%Carlos%Saiz%';

-- Verificar que se ocultó
SELECT id, full_name, email, role, profile_hidden
FROM public.profiles
WHERE full_name LIKE '%Carlos%Saiz%';
