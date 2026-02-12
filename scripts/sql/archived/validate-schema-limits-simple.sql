-- ============================================================================
-- VALIDACIÓN SIMPLE DE LÍMITES DEL SCHEMA
-- Script optimizado para Supabase
-- ============================================================================

-- 🎯 LÍMITES DEL SCHEMA:
-- summary: 800 | headline: 150 | achievements: 200
-- experience.description: 800 | education.description: 600
-- certification.description: 500

-- ====================
-- RESUMEN GENERAL
-- ====================
SELECT
    'Total Perfiles' AS metrica,
    COUNT(*)::text AS valor
FROM public.profiles WHERE role = 'professional'

UNION ALL

SELECT
    'Summaries > 800 chars',
    COUNT(*) FILTER (WHERE LENGTH(summary) > 800)::text
FROM public.profiles WHERE role = 'professional'

UNION ALL

SELECT
    'Achievements > 200 chars',
    COUNT(*)::text
FROM (
    SELECT 1
    FROM public.experiences e
    JOIN public.profiles p ON e.profile_id = p.id
    CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
    WHERE p.role = 'professional' AND LENGTH(achievement) > 200
) violations

UNION ALL

SELECT
    'Experience Desc > 800',
    COUNT(*) FILTER (WHERE LENGTH(description) > 800)::text
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'

UNION ALL

SELECT
    'Education Desc > 600',
    COUNT(*) FILTER (WHERE LENGTH(description) > 600)::text
FROM public.education ed
JOIN public.profiles p ON ed.profile_id = p.id
WHERE p.role = 'professional'

UNION ALL

SELECT
    'Certification Desc > 500',
    COUNT(*) FILTER (WHERE LENGTH(description) > 500)::text
FROM public.portfolio_items pi
JOIN public.profiles p ON pi.profile_id = p.id
WHERE p.role = 'professional' AND pi.type = 'CERTIFICATION';
