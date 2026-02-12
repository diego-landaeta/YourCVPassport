-- ============================================================================
-- OCULTAR PERFIL DE CARLOS SAIZ
-- El perfil no se elimina, solo se oculta cambiando el role
-- ============================================================================

-- Cambiar role de 'professional' a 'archived' para que no aparezca en listas públicas
UPDATE public.profiles
SET role = 'archived'
WHERE full_name = 'Carlos Saiz';

-- Verificar el cambio
SELECT full_name, role, email, summary
FROM public.profiles
WHERE full_name = 'Carlos Saiz';
