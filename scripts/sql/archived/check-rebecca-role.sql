-- Verificar el role actual de Rebecca Anderson
SELECT
    id,
    full_name,
    email,
    role,
    profile_hidden,
    LENGTH(headline) as headline_len,
    LENGTH(summary) as summary_len
FROM public.profiles
WHERE id = '54701b32-af6e-4923-846d-8a04fad249a8';
