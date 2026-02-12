-- ============================================================================
-- VALIDACIÓN DETALLADA DE PERFILES
-- Compatible con Supabase - Sin errores de sintaxis
-- ============================================================================

-- ====================
-- 1. SUMMARIES (límite: 800 caracteres)
-- ====================
SELECT
    full_name,
    LENGTH(summary) as chars,
    CASE
        WHEN LENGTH(summary) > 800 THEN '❌ EXCEDE'
        WHEN LENGTH(summary) > 750 THEN '⚠️ CERCA'
        ELSE '✅ OK'
    END as estado
FROM public.profiles
WHERE role = 'professional'
  AND summary IS NOT NULL
ORDER BY LENGTH(summary) DESC;

-- ====================
-- 2. ACHIEVEMENTS (límite: 200 caracteres)
-- ====================
SELECT
    p.full_name,
    e.company_name,
    LENGTH(achievement) as chars,
    CASE
        WHEN LENGTH(achievement) > 200 THEN '❌ EXCEDE'
        WHEN LENGTH(achievement) > 190 THEN '⚠️ CERCA'
        ELSE '✅ OK'
    END as estado,
    SUBSTRING(achievement, 1, 80) || '...' as preview
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
WHERE p.role = 'professional'
ORDER BY LENGTH(achievement) DESC
LIMIT 30;

-- ====================
-- 3. EXPERIENCE DESCRIPTIONS (límite: 800 caracteres)
-- ====================
SELECT
    p.full_name,
    e.company_name,
    LENGTH(e.description) as chars,
    CASE
        WHEN LENGTH(e.description) > 800 THEN '❌ EXCEDE'
        WHEN LENGTH(e.description) > 750 THEN '⚠️ CERCA'
        ELSE '✅ OK'
    END as estado
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'
  AND e.description IS NOT NULL
ORDER BY LENGTH(e.description) DESC;

-- ====================
-- 4. EDUCATION DESCRIPTIONS (límite: 600 caracteres)
-- ====================
SELECT
    p.full_name,
    ed.institution_name,
    LENGTH(ed.description) as chars,
    CASE
        WHEN LENGTH(ed.description) > 600 THEN '❌ EXCEDE'
        WHEN LENGTH(ed.description) > 550 THEN '⚠️ CERCA'
        ELSE '✅ OK'
    END as estado
FROM public.education ed
JOIN public.profiles p ON ed.profile_id = p.id
WHERE p.role = 'professional'
  AND ed.description IS NOT NULL
ORDER BY LENGTH(ed.description) DESC;

-- ====================
-- 5. CERTIFICATION DESCRIPTIONS (límite: 500 caracteres)
-- ====================
SELECT
    p.full_name,
    pi.title,
    LENGTH(pi.description) as chars,
    CASE
        WHEN LENGTH(pi.description) > 500 THEN '❌ EXCEDE'
        WHEN LENGTH(pi.description) > 480 THEN '⚠️ CERCA'
        ELSE '✅ OK'
    END as estado
FROM public.portfolio_items pi
JOIN public.profiles p ON pi.profile_id = p.id
WHERE p.role = 'professional'
  AND pi.type = 'CERTIFICATION'
  AND pi.description IS NOT NULL
ORDER BY LENGTH(pi.description) DESC;

-- ====================
-- 6. VALIDACIÓN COMPLETA POR PERFIL
-- ====================
SELECT
    p.full_name,
    CASE WHEN LENGTH(p.summary) <= 800 THEN '✓' ELSE '✗' END as summary_ok,
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM experiences e
            CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
            WHERE e.profile_id = p.id AND LENGTH(achievement) > 200
        ) THEN '✓' ELSE '✗'
    END as achievements_ok,
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM experiences e
            WHERE e.profile_id = p.id AND LENGTH(e.description) > 800
        ) THEN '✓' ELSE '✗'
    END as exp_desc_ok,
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM education ed
            WHERE ed.profile_id = p.id AND LENGTH(ed.description) > 600
        ) THEN '✓' ELSE '✗'
    END as edu_desc_ok,
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM portfolio_items pi
            WHERE pi.profile_id = p.id AND pi.type = 'CERTIFICATION' AND LENGTH(pi.description) > 500
        ) THEN '✓' ELSE '✗'
    END as cert_desc_ok,
    CASE
        WHEN LENGTH(p.summary) <= 800
        AND NOT EXISTS (
            SELECT 1 FROM experiences e
            CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
            WHERE e.profile_id = p.id AND LENGTH(achievement) > 200
        )
        AND NOT EXISTS (
            SELECT 1 FROM experiences e
            WHERE e.profile_id = p.id AND LENGTH(e.description) > 800
        )
        AND NOT EXISTS (
            SELECT 1 FROM education ed
            WHERE ed.profile_id = p.id AND LENGTH(ed.description) > 600
        )
        AND NOT EXISTS (
            SELECT 1 FROM portfolio_items pi
            WHERE pi.profile_id = p.id AND pi.type = 'CERTIFICATION' AND LENGTH(pi.description) > 500
        )
        THEN '✅ PASA'
        ELSE '❌ FALLA'
    END as estado_final
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY estado_final DESC, p.full_name;
