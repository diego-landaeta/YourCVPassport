-- Verificación completa de Rebecca Anderson
SELECT
    'Rebecca Anderson - Verificación' as check_name,
    p.full_name,
    p.email,
    LENGTH(p.summary) as summary_chars,
    LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs,
    CASE
        WHEN LENGTH(p.summary) > 200 AND LENGTH(p.summary) <= 800
             AND LENGTH(p.headline) >= 30
             AND (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) >= 3
             AND (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) >= 12
             AND (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') >= 3
        THEN '✅ EXCELENTE'
        ELSE '⚠️ REVISAR'
    END as calidad
FROM public.profiles p
WHERE p.full_name = 'Rebecca Anderson';
