-- ============================================================================
-- QUICK QUALITY CHECK - Verificación Rápida de Calidad
-- Ejecuta este script para ver un resumen rápido de todos los perfiles
-- ============================================================================

-- 📊 RESUMEN GENERAL
SELECT
    '=' AS "════════════════════════════════════════════════════════════════",
    '📊 RESUMEN GENERAL DE PERFILES' AS "REPORTE"
UNION ALL
SELECT
    '=' AS "════════════════════════════════════════════════════════════════",
    '' AS ""
UNION ALL
SELECT
    'Total Perfiles:' AS "Métrica",
    COUNT(*)::text AS "Valor"
FROM profiles WHERE role = 'professional'
UNION ALL
SELECT
    'Con Foto:',
    COUNT(*)::text
FROM profiles WHERE role = 'professional' AND avatar_url IS NOT NULL AND avatar_url != ''
UNION ALL
SELECT
    'Sin Foto:',
    COUNT(*)::text
FROM profiles WHERE role = 'professional' AND (avatar_url IS NULL OR avatar_url = '')
UNION ALL
SELECT
    'Promedio Longitud Summary:',
    ROUND(AVG(LENGTH(summary)))::text || ' chars'
FROM profiles WHERE role = 'professional' AND summary IS NOT NULL;

-- 🎯 SCORING POR PERFIL
SELECT
    '=' AS "════════════════════════════════════════════════════════════════",
    '🎯 QUALITY SCORE POR PERFIL' AS "REPORTE"
UNION ALL
SELECT '=' AS "════════════════════════════════════════════════════════════════", '';

SELECT
    ROW_NUMBER() OVER (ORDER BY (
        CASE WHEN avatar_url IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN LENGTH(summary) >= 300 THEN 20 ELSE 0 END +
        ((SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) * 5) +
        ((SELECT COUNT(*) FROM education WHERE profile_id = p.id) * 5) +
        ((SELECT COUNT(*) FROM skills WHERE profile_id = p.id) * 1) +
        ((SELECT COUNT(*) FROM languages WHERE profile_id = p.id) * 5) +
        ((SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') * 3)
    ) DESC)::text AS "#",
    full_name AS "Nombre",
    CASE WHEN avatar_url IS NOT NULL THEN '✓' ELSE '✗' END AS "📷",
    LENGTH(summary)::text AS "Sum",
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id)::text AS "Exp",
    (SELECT COUNT(*) FROM education WHERE profile_id = p.id)::text AS "Edu",
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id)::text AS "Skl",
    (SELECT COUNT(*) FROM languages WHERE profile_id = p.id)::text AS "Lng",
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION')::text AS "Crt",
    (
        CASE WHEN avatar_url IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN LENGTH(summary) >= 300 THEN 20 ELSE 0 END +
        ((SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) * 5) +
        ((SELECT COUNT(*) FROM education WHERE profile_id = p.id) * 5) +
        ((SELECT COUNT(*) FROM skills WHERE profile_id = p.id) * 1) +
        ((SELECT COUNT(*) FROM languages WHERE profile_id = p.id) * 5) +
        ((SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') * 3)
    )::text AS "Score",
    CASE
        WHEN (
            CASE WHEN avatar_url IS NOT NULL THEN 10 ELSE 0 END +
            CASE WHEN LENGTH(summary) >= 300 THEN 20 ELSE 0 END +
            ((SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) * 5) +
            ((SELECT COUNT(*) FROM education WHERE profile_id = p.id) * 5) +
            ((SELECT COUNT(*) FROM skills WHERE profile_id = p.id) * 1) +
            ((SELECT COUNT(*) FROM languages WHERE profile_id = p.id) * 5) +
            ((SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') * 3)
        ) >= 91 THEN '🌟'
        WHEN (
            CASE WHEN avatar_url IS NOT NULL THEN 10 ELSE 0 END +
            CASE WHEN LENGTH(summary) >= 300 THEN 20 ELSE 0 END +
            ((SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) * 5) +
            ((SELECT COUNT(*) FROM education WHERE profile_id = p.id) * 5) +
            ((SELECT COUNT(*) FROM skills WHERE profile_id = p.id) * 1) +
            ((SELECT COUNT(*) FROM languages WHERE profile_id = p.id) * 5) +
            ((SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') * 3)
        ) >= 61 THEN '✅'
        WHEN (
            CASE WHEN avatar_url IS NOT NULL THEN 10 ELSE 0 END +
            CASE WHEN LENGTH(summary) >= 300 THEN 20 ELSE 0 END +
            ((SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) * 5) +
            ((SELECT COUNT(*) FROM education WHERE profile_id = p.id) * 5) +
            ((SELECT COUNT(*) FROM skills WHERE profile_id = p.id) * 1) +
            ((SELECT COUNT(*) FROM languages WHERE profile_id = p.id) * 5) +
            ((SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') * 3)
        ) >= 31 THEN '⚠️'
        ELSE '❌'
    END AS "Status"
FROM public.profiles p
WHERE role = 'professional'
ORDER BY "Score" DESC;

-- ⚠️ TOP PROBLEMAS
SELECT
    '=' AS "════════════════════════════════════════════════════════════════",
    '⚠️ TOP 10 PERFILES CON MÁS PROBLEMAS' AS "REPORTE"
UNION ALL
SELECT '=' AS "════════════════════════════════════════════════════════════════", '';

SELECT
    p.full_name AS "Nombre",
    COUNT(*)::text AS "# Problemas",
    STRING_AGG(
        SUBSTRING(issue_type, 1, 20),
        ', '
        ORDER BY issue_type
    ) AS "Problemas Principales"
FROM public.profiles p
CROSS JOIN LATERAL (
    SELECT 'Sin foto' as issue_type WHERE p.avatar_url IS NULL OR p.avatar_url = ''
    UNION ALL
    SELECT 'Summary corto' WHERE LENGTH(p.summary) < 200
    UNION ALL
    SELECT 'Pocas exp' WHERE (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) < 4
    UNION ALL
    SELECT 'Poca edu' WHERE (SELECT COUNT(*) FROM education WHERE profile_id = p.id) < 3
    UNION ALL
    SELECT 'Pocos skills' WHERE (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) < 12
    UNION ALL
    SELECT 'Pocos idiomas' WHERE (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) < 2
    UNION ALL
    SELECT 'Pocas cert' WHERE (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') < 4
) issues
WHERE p.role = 'professional'
GROUP BY p.full_name
ORDER BY COUNT(*) DESC
LIMIT 10;

-- 📝 CONTENIDO PARA REVISIÓN
SELECT
    '=' AS "════════════════════════════════════════════════════════════════",
    '📝 SUMMARIES QUE NECESITAN REVISIÓN' AS "REPORTE"
UNION ALL
SELECT '=' AS "════════════════════════════════════════════════════════════════", '';

SELECT
    full_name AS "Nombre",
    LENGTH(summary)::text AS "Caracteres",
    CASE
        WHEN LENGTH(summary) < 200 THEN '⚠️ Muy corto'
        WHEN LENGTH(summary) > 1000 THEN '⚠️ Muy largo'
        ELSE '✓ OK'
    END AS "Estado",
    SUBSTRING(summary, 1, 80) || '...' AS "Preview"
FROM public.profiles
WHERE role = 'professional'
  AND summary IS NOT NULL
ORDER BY LENGTH(summary);

-- 🏆 ACHIEVEMENTS QUE NECESITAN REVISIÓN
SELECT
    '=' AS "════════════════════════════════════════════════════════════════",
    '🏆 ACHIEVEMENTS MUY CORTOS O LARGOS' AS "REPORTE"
UNION ALL
SELECT '=' AS "════════════════════════════════════════════════════════════════", '';

SELECT
    p.full_name AS "Nombre",
    e.company_name AS "Empresa",
    LENGTH(achievement)::text AS "Chars",
    CASE
        WHEN LENGTH(achievement) < 40 THEN '⚠️ Muy corto'
        WHEN LENGTH(achievement) > 250 THEN '⚠️ Muy largo'
        ELSE '✓ OK'
    END AS "Estado",
    SUBSTRING(achievement, 1, 60) || '...' AS "Achievement"
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
WHERE p.role = 'professional'
  AND (LENGTH(achievement) < 40 OR LENGTH(achievement) > 250)
ORDER BY p.full_name, LENGTH(achievement);

-- 🌍 LEYENDA
SELECT
    '=' AS "════════════════════════════════════════════════════════════════",
    '🌍 LEYENDA' AS "REPORTE"
UNION ALL
SELECT '=' AS "════════════════════════════════════════════════════════════════", ''
UNION ALL
SELECT '📷' AS "Símbolo", 'Tiene foto de perfil' AS "Significado"
UNION ALL
SELECT 'Sum', 'Caracteres en Summary'
UNION ALL
SELECT 'Exp', 'Número de Experiencias'
UNION ALL
SELECT 'Edu', 'Número de Educaciones'
UNION ALL
SELECT 'Skl', 'Número de Skills'
UNION ALL
SELECT 'Lng', 'Número de Idiomas'
UNION ALL
SELECT 'Crt', 'Número de Certificaciones'
UNION ALL
SELECT 'Score', 'Puntaje Total de Calidad'
UNION ALL
SELECT '', ''
UNION ALL
SELECT '🌟' AS "Status", '91+ puntos - Excelente'
UNION ALL
SELECT '✅', '61-90 puntos - Bueno'
UNION ALL
SELECT '⚠️', '31-60 puntos - Básico'
UNION ALL
SELECT '❌', '0-30 puntos - Incompleto';
