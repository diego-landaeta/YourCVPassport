-- Verificar si el usuario existe en auth.users
SELECT id, email FROM auth.users WHERE id = '54701b32-af6e-4923-846d-8a04fad249a8';

-- Verificar si existe perfil con ese ID
SELECT id, full_name, email FROM public.profiles WHERE id = '54701b32-af6e-4923-846d-8a04fad249a8';
