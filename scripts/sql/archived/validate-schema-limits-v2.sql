-- ============================================================================
-- VALIDAR LÍMITES DEL SCHEMA V2.0 - LÍMITES ACTUALIZADOS
-- Verifica que los datos cumplan con los NUEVOS límites (2026-02-12)
-- ============================================================================

-- 🎯 NUEVOS LÍMITES DEL SCHEMA:
-- - summary: MAX 800 caracteres (antes: 500)
-- - headline: MAX 150 caracteres
-- - full_name: MAX 50 caracteres
-- - achievements: MAX 200 caracteres por achievement (antes: 100)
-- - experience.description: MAX 800 caracteres (NUEVO)
-- - experience.position: MAX 100 caracteres (NUEVO)
-- - experience.company_name: MAX 100 caracteres (NUEVO)
-- - education.description: MAX 600 caracteres (NUEVO)
-- - education.institution_name: MAX 100 caracteres (NUEVO)
-- - education.degree: MAX 100 caracteres (NUEVO)
-- - education.field_of_study: MAX 100 caracteres (NUEVO)
-- - portfolio.title: MAX 150 caracteres (NUEVO)
-- - portfolio.description: MAX 500 caracteres (NUEVO)

-- ====================
-- 1. VERIFICAR SUMMARIES (LÍMITE: 800 CARACTERES)
-- ====================
SELECT
    '✅ SUMMARIES - LÍMITE: 800 CARACTERES' AS "VALIDACIÓN",
    '================================================' AS "separator"
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) FILTER (WHERE LENGTH(summary) > 800) = 0 THEN '✓ Todos los summaries OK'
        ELSE '❌ ' || COUNT(*) FILTER (WHERE LENGTH(summary) > 800)::text || ' summaries exceden límite'
    END AS "Resultado",
    '' AS ""
FROM public.profiles
WHERE role = 'professional';

SELECT
    full_name AS "Nombre",
    LENGTH(summary)::text || ' / 800 chars' AS "Longitud",
    CASE
        WHEN LENGTH(summary) > 800 THEN '❌ EXCEDE LÍMITE'
        WHEN LENGTH(summary) > 750 THEN '⚠️ CERCA DEL LÍMITE (>750)'
        WHEN LENGTH(summary) > 700 THEN '⚠️ Cerca del límite (>700)'
        ELSE '✅ OK'
    END AS "Estado"
FROM public.profiles
WHERE role = 'professional'
  AND summary IS NOT NULL
ORDER BY LENGTH(summary) DESC;

-- ====================
-- 2. VERIFICAR ACHIEVEMENTS (LÍMITE: 200 CARACTERES)
-- ====================
SELECT
    '✅ ACHIEVEMENTS - LÍMITE: 200 CARACTERES' AS "VALIDACIÓN",
    '================================================' AS "separator"
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) = 0 THEN '✓ Todos los achievements OK'
        ELSE '❌ ' || COUNT(*)::text || ' achievements exceden límite'
    END AS "Resultado",
    '' AS ""
FROM (
    SELECT LENGTH(achievement) as len
    FROM public.experiences e
    JOIN public.profiles p ON e.profile_id = p.id
    CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
    WHERE p.role = 'professional'
      AND LENGTH(achievement) > 200
) violations;

SELECT
    p.full_name AS "Nombre",
    SUBSTRING(e.company_name, 1, 30) AS "Empresa",
    LENGTH(achievement)::text || ' / 200' AS "Chars",
    CASE
        WHEN LENGTH(achievement) > 200 THEN '❌ EXCEDE'
        WHEN LENGTH(achievement) > 190 THEN '⚠️ CERCA'
        ELSE '✅ OK'
    END AS "Estado",
    SUBSTRING(achievement, 1, 80) || '...' AS "Preview"
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
WHERE p.role = 'professional'
ORDER BY LENGTH(achievement) DESC
LIMIT 20;

-- ====================
-- 3. VERIFICAR EXPERIENCE DESCRIPTIONS (LÍMITE: 800 CARACTERES)
-- ====================
SELECT
    '✅ EXPERIENCE DESCRIPTIONS - LÍMITE: 800 CARACTERES' AS "VALIDACIÓN",
    '================================================' AS "separator"
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) FILTER (WHERE LENGTH(description) > 800) = 0 THEN '✓ Todas las descriptions OK'
        ELSE '⚠️ ' || COUNT(*) FILTER (WHERE LENGTH(description) > 800)::text || ' descriptions exceden límite'
    END AS "Resultado",
    '' AS ""
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'
  AND e.description IS NOT NULL;

SELECT
    p.full_name AS "Nombre",
    SUBSTRING(e.company_name, 1, 30) AS "Empresa",
    LENGTH(e.description)::text || ' / 800' AS "Chars",
    CASE
        WHEN LENGTH(e.description) > 800 THEN '❌ EXCEDE'
        WHEN LENGTH(e.description) > 750 THEN '⚠️ CERCA'
        ELSE '✅ OK'
    END AS "Estado"
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'
  AND e.description IS NOT NULL
ORDER BY LENGTH(e.description) DESC
LIMIT 10;

-- ====================
-- 4. VERIFICAR EDUCATION DESCRIPTIONS (LÍMITE: 600 CARACTERES)
-- ====================
SELECT
    '✅ EDUCATION DESCRIPTIONS - LÍMITE: 600 CARACTERES' AS "VALIDACIÓN",
    '================================================' AS "separator"
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) FILTER (WHERE LENGTH(description) > 600) = 0 THEN '✓ Todas las descriptions OK'
        ELSE '⚠️ ' || COUNT(*) FILTER (WHERE LENGTH(description) > 600)::text || ' descriptions exceden límite'
    END AS "Resultado",
    '' AS ""
FROM public.education ed
JOIN public.profiles p ON ed.profile_id = p.id
WHERE p.role = 'professional'
  AND ed.description IS NOT NULL;

SELECT
    p.full_name AS "Nombre",
    SUBSTRING(ed.institution_name, 1, 30) AS "Institución",
    LENGTH(ed.description)::text || ' / 600' AS "Chars",
    CASE
        WHEN LENGTH(ed.description) > 600 THEN '❌ EXCEDE'
        WHEN LENGTH(ed.description) > 550 THEN '⚠️ CERCA'
        ELSE '✅ OK'
    END AS "Estado"
FROM public.education ed
JOIN public.profiles p ON ed.profile_id = p.id
WHERE p.role = 'professional'
  AND ed.description IS NOT NULL
ORDER BY LENGTH(ed.description) DESC
LIMIT 10;

-- ====================
-- 5. VERIFICAR CERTIFICATION DESCRIPTIONS (LÍMITE: 500 CARACTERES)
-- ====================
SELECT
    '✅ CERTIFICATION DESCRIPTIONS - LÍMITE: 500 CARACTERES' AS "VALIDACIÓN",
    '================================================' AS "separator"
UNION ALL
SELECT
    CASE
        WHEN COUNT(*) FILTER (WHERE LENGTH(description) > 500) = 0 THEN '✓ Todas las descriptions OK'
        ELSE '⚠️ ' || COUNT(*) FILTER (WHERE LENGTH(description) > 500)::text || ' descriptions exceden límite'
    END AS "Resultado",
    '' AS ""
FROM public.portfolio_items pi
JOIN public.profiles p ON pi.profile_id = p.id
WHERE p.role = 'professional'
  AND pi.type = 'CERTIFICATION'
  AND pi.description IS NOT NULL;

SELECT
    p.full_name AS "Nombre",
    SUBSTRING(pi.title, 1, 40) AS "Certificación",
    LENGTH(pi.description)::text || ' / 500' AS "Chars",
    CASE
        WHEN LENGTH(pi.description) > 500 THEN '❌ EXCEDE'
        WHEN LENGTH(pi.description) > 480 THEN '⚠️ CERCA'
        ELSE '✅ OK'
    END AS "Estado"
FROM public.portfolio_items pi
JOIN public.profiles p ON pi.profile_id = p.id
WHERE p.role = 'professional'
  AND pi.type = 'CERTIFICATION'
  AND pi.description IS NOT NULL
ORDER BY LENGTH(pi.description) DESC
LIMIT 10;

-- ====================
-- 6. RESUMEN GENERAL DE VALIDACIÓN
-- ====================
SELECT
    '📊 RESUMEN GENERAL DE VALIDACIÓN' AS "REPORTE",
    '================================================' AS "separator"
UNION ALL
SELECT
    'Total Perfiles:' AS "Métrica",
    COUNT(*)::text AS "Valor"
FROM public.profiles WHERE role = 'professional'

UNION ALL
SELECT
    'Summaries > 800:',
    COUNT(*) FILTER (WHERE LENGTH(summary) > 800)::text
FROM public.profiles WHERE role = 'professional'

UNION ALL
SELECT
    'Achievements > 200:',
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
    'Experience Desc > 800:',
    COUNT(*) FILTER (WHERE LENGTH(description) > 800)::text
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'

UNION ALL
SELECT
    'Education Desc > 600:',
    COUNT(*) FILTER (WHERE LENGTH(description) > 600)::text
FROM public.education ed
JOIN public.profiles p ON ed.profile_id = p.id
WHERE p.role = 'professional'

UNION ALL
SELECT
    'Certification Desc > 500:',
    COUNT(*) FILTER (WHERE LENGTH(description) > 500)::text
FROM public.portfolio_items pi
JOIN public.profiles p ON pi.profile_id = p.id
WHERE p.role = 'professional' AND pi.type = 'CERTIFICATION';

-- ====================
-- 7. PERFILES QUE PASAN VALIDACIÓN COMPLETA
-- ====================
SELECT
    '✅ VALIDACIÓN COMPLETA POR PERFIL' AS "REPORTE",
    '================================================' AS "separator"
UNION ALL
SELECT '', '';

SELECT
    p.full_name AS "Nombre",
    CASE
        WHEN LENGTH(p.summary) <= 800 THEN '✓' ELSE '✗'
    END AS "Sum",
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM experiences e
            CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
            WHERE e.profile_id = p.id AND LENGTH(achievement) > 200
        ) THEN '✓' ELSE '✗'
    END AS "Ach",
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM experiences e
            WHERE e.profile_id = p.id AND LENGTH(e.description) > 800
        ) THEN '✓' ELSE '✗'
    END AS "ExpD",
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM education ed
            WHERE ed.profile_id = p.id AND LENGTH(ed.description) > 600
        ) THEN '✓' ELSE '✗'
    END AS "EduD",
    CASE
        WHEN NOT EXISTS (
            SELECT 1 FROM portfolio_items pi
            WHERE pi.profile_id = p.id AND pi.type = 'CERTIFICATION' AND LENGTH(pi.description) > 500
        ) THEN '✓' ELSE '✗'
    END AS "CertD",
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
    END AS "Estado Final"
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY "Estado Final" DESC, p.full_name;

-- ====================
-- LEYENDA
-- ====================
SELECT
    '================================================' AS "separator",
    '📖 LEYENDA' AS "REPORTE"
UNION ALL
SELECT '', ''
UNION ALL
SELECT 'Sum' AS "Columna", 'Summary (max 800 chars)' AS "Descripción"
UNION ALL
SELECT 'Ach', 'Achievements (max 200 chars cada uno)'
UNION ALL
SELECT 'ExpD', 'Experience Descriptions (max 800 chars)'
UNION ALL
SELECT 'EduD', 'Education Descriptions (max 600 chars)'
UNION ALL
SELECT 'CertD', 'Certification Descriptions (max 500 chars)'
UNION ALL
SELECT '', ''
UNION ALL
SELECT '✓', 'Pasa validación'
UNION ALL
SELECT '✗', 'Excede límite';
