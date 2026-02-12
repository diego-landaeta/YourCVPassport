-- ============================================================================
-- ACTUALIZAR ROLE DE REBECCA A 'company' - SOLO ESTO
-- ============================================================================

UPDATE public.profiles
SET role = 'company'
WHERE id = '54701b32-af6e-4923-846d-8a04fad249a8';

-- Verificar que se actualizó
SELECT id, full_name, email, role
FROM public.profiles
WHERE id = '54701b32-af6e-4923-846d-8a04fad249a8';
