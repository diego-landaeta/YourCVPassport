-- Verificar si Rebecca Anderson existe
SELECT
    id,
    full_name,
    email,
    role,
    headline,
    LENGTH(summary) as summary_chars,
    created_at
FROM public.profiles
WHERE email = 'rebecca.anderson@iseih.edu'
   OR full_name = 'Rebecca Anderson';

-- Si existe, verificar sus datos completos
SELECT
    'Rebecca Anderson - Verificación Completa' as check_name,
    p.id,
    p.full_name,
    p.email,
    p.role,
    LENGTH(p.summary) as summary_chars,
    LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.email = 'rebecca.anderson@iseih.edu'
   OR p.full_name = 'Rebecca Anderson';
