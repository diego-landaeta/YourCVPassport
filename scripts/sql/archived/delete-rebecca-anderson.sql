-- Eliminar el perfil incorrecto de Rebecca Anderson
-- IMPORTANTE: Ejecutar este script ANTES de volver a crear el perfil

-- Primero eliminar datos relacionados (por si acaso)
DELETE FROM public.portfolio_items
WHERE profile_id = (SELECT id FROM public.profiles WHERE email = 'rebecca.anderson@iseih.edu');

DELETE FROM public.skills
WHERE profile_id = (SELECT id FROM public.profiles WHERE email = 'rebecca.anderson@iseih.edu');

DELETE FROM public.experiences
WHERE profile_id = (SELECT id FROM public.profiles WHERE email = 'rebecca.anderson@iseih.edu');

-- Finalmente eliminar el perfil
DELETE FROM public.profiles
WHERE email = 'rebecca.anderson@iseih.edu';

-- Verificar que se eliminó
SELECT COUNT(*) as perfiles_restantes
FROM public.profiles
WHERE email = 'rebecca.anderson@iseih.edu';
-- Debería retornar 0
