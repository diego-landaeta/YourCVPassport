-- ============================================================================
-- VALIDAR LÍMITES DEL SCHEMA
-- Verifica que los datos cumplan con los límites definidos en profileSchemas.ts
-- ============================================================================

-- 🚨 LÍMITES CRÍTICOS DEL SCHEMA:
-- - summary: MAX 500 caracteres
-- - headline: MAX 150 caracteres
-- - full_name: MAX 50 caracteres
-- - achievements: MAX 100 caracteres por achievement

-- ====================
-- 1. VERIFICAR SUMMARIES (LÍMITE: 500 CARACTERES)
-- ====================
SELECT
    '🚨 SUMMARIES QUE EXCEDEN 500 CARACTERES' AS "PROBLEMA",
    '================================================' AS "separator"
UNION ALL
SELECT
    full_name AS "Nombre",
    LENGTH(summary)::text || ' / 500 chars' AS "Longitud (EXCEDE LÍMITE)"
FROM public.profiles
WHERE role = 'professional'
  AND LENGTH(summary) > 500
ORDER BY LENGTH(summary) DESC;

-- ====================
-- 2. VERIFICAR HEADLINES (LÍMITE: 150 CARACTERES)
-- ====================
SELECT
    '🚨 HEADLINES QUE EXCEDEN 150 CARACTERES' AS "PROBLEMA",
    '================================================' AS "separator"
UNION ALL
SELECT
    full_name AS "Nombre",
    LENGTH(headline)::text || ' / 150 chars' AS "Longitud (EXCEDE LÍMITE)"
FROM public.profiles
WHERE role = 'professional'
  AND LENGTH(headline) > 150
ORDER BY LENGTH(headline) DESC;

-- ====================
-- 3. VERIFICAR FULL_NAME (LÍMITE: 50 CARACTERES)
-- ====================
SELECT
    '🚨 FULL_NAME QUE EXCEDEN 50 CARACTERES' AS "PROBLEMA",
    '================================================' AS "separator"
UNION ALL
SELECT
    full_name AS "Nombre",
    LENGTH(full_name)::text || ' / 50 chars' AS "Longitud (EXCEDE LÍMITE)"
FROM public.profiles
WHERE role = 'professional'
  AND LENGTH(full_name) > 50
ORDER BY LENGTH(full_name) DESC;

-- ====================
-- 4. VERIFICAR ACHIEVEMENTS (LÍMITE: 100 CARACTERES POR ACHIEVEMENT)
-- ====================
SELECT
    '🚨 ACHIEVEMENTS QUE EXCEDEN 100 CARACTERES' AS "PROBLEMA",
    '================================================' AS "separator"
UNION ALL
SELECT
    p.full_name || ' - ' || e.company_name AS "Perfil / Empresa",
    LENGTH(achievement)::text || ' / 100 chars - ' || SUBSTRING(achievement, 1, 80) || '...' AS "Achievement (EXCEDE LÍMITE)"
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
WHERE p.role = 'professional'
  AND LENGTH(achievement) > 100
ORDER BY LENGTH(achievement) DESC;

-- ====================
-- 5. RESUMEN DE VIOLACIONES DE LÍMITES
-- ====================
SELECT
    '📊 RESUMEN DE VIOLACIONES' AS "REPORTE",
    '================================================' AS "separator"
UNION ALL
SELECT
    'Summaries > 500 chars:' AS "Tipo de Violación",
    COUNT(*)::text AS "Cantidad"
FROM public.profiles
WHERE role = 'professional' AND LENGTH(summary) > 500
UNION ALL
SELECT
    'Headlines > 150 chars:',
    COUNT(*)::text
FROM public.profiles
WHERE role = 'professional' AND LENGTH(headline) > 150
UNION ALL
SELECT
    'Full Names > 50 chars:',
    COUNT(*)::text
FROM public.profiles
WHERE role = 'professional' AND LENGTH(full_name) > 50
UNION ALL
SELECT
    'Achievements > 100 chars:',
    COUNT(*)::text
FROM (
    SELECT p.id
    FROM public.experiences e
    JOIN public.profiles p ON e.profile_id = p.id
    CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
    WHERE p.role = 'professional' AND LENGTH(achievement) > 100
) AS violations;

-- ====================
-- 6. DETALLE DE TODOS LOS SUMMARIES CON SU LONGITUD
-- ====================
SELECT
    '📝 TODOS LOS SUMMARIES (LÍMITE: 500 CHARS)' AS "REPORTE",
    '================================================' AS "separator"
UNION ALL
SELECT
    full_name AS "Nombre",
    LENGTH(summary)::text || ' / 500' AS "Caracteres",
    CASE
        WHEN LENGTH(summary) > 500 THEN '❌ EXCEDE LÍMITE'
        WHEN LENGTH(summary) > 450 THEN '⚠️ CERCA DEL LÍMITE'
        ELSE '✅ OK'
    END AS "Estado",
    SUBSTRING(summary, 1, 100) || '...' AS "Preview"
FROM public.profiles
WHERE role = 'professional'
  AND summary IS NOT NULL
ORDER BY LENGTH(summary) DESC;

-- ====================
-- 7. DETALLE DE TODOS LOS ACHIEVEMENTS CON SU LONGITUD
-- ====================
SELECT
    '🏆 TODOS LOS ACHIEVEMENTS (LÍMITE: 100 CHARS)' AS "REPORTE",
    '================================================' AS "separator"
UNION ALL
SELECT
    p.full_name AS "Nombre",
    e.company_name AS "Empresa",
    LENGTH(achievement)::text || ' / 100' AS "Caracteres",
    CASE
        WHEN LENGTH(achievement) > 100 THEN '❌ EXCEDE LÍMITE'
        WHEN LENGTH(achievement) > 90 THEN '⚠️ CERCA DEL LÍMITE'
        ELSE '✅ OK'
    END AS "Estado",
    SUBSTRING(achievement, 1, 80) || '...' AS "Achievement Preview"
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
WHERE p.role = 'professional'
ORDER BY LENGTH(achievement) DESC;

-- ====================
-- 8. ESTADÍSTICAS GENERALES DE LONGITUDES
-- ====================
SELECT
    '📊 ESTADÍSTICAS DE LONGITUDES' AS "REPORTE",
    '================================================' AS "separator"
UNION ALL
SELECT
    'Summary - Promedio:' AS "Campo",
    ROUND(AVG(LENGTH(summary)))::text || ' chars' AS "Valor"
FROM public.profiles WHERE role = 'professional' AND summary IS NOT NULL
UNION ALL
SELECT
    'Summary - Máximo:',
    MAX(LENGTH(summary))::text || ' chars (LÍMITE: 500)'
FROM public.profiles WHERE role = 'professional' AND summary IS NOT NULL
UNION ALL
SELECT
    'Summary - Mínimo:',
    MIN(LENGTH(summary))::text || ' chars'
FROM public.profiles WHERE role = 'professional' AND summary IS NOT NULL
UNION ALL
SELECT
    'Headline - Promedio:',
    ROUND(AVG(LENGTH(headline)))::text || ' chars'
FROM public.profiles WHERE role = 'professional' AND headline IS NOT NULL
UNION ALL
SELECT
    'Headline - Máximo:',
    MAX(LENGTH(headline))::text || ' chars (LÍMITE: 150)'
FROM public.profiles WHERE role = 'professional' AND headline IS NOT NULL
UNION ALL
SELECT
    'Achievement - Promedio:',
    ROUND(AVG(LENGTH(achievement)))::text || ' chars'
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
WHERE p.role = 'professional'
UNION ALL
SELECT
    'Achievement - Máximo:',
    MAX(LENGTH(achievement))::text || ' chars (LÍMITE: 100)'
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
WHERE p.role = 'professional';

-- ====================
-- 9. EXPORTAR SUMMARIES QUE NECESITAN ACORTARSE
-- ====================
SELECT
    '✂️ SUMMARIES PARA ACORTAR' AS "REPORTE",
    '================================================' AS "separator"
UNION ALL
SELECT
    full_name AS "Nombre",
    LENGTH(summary)::text || ' chars → REDUCIR A 500' AS "Acción Necesaria",
    '---SUMMARY ORIGINAL---' AS "Separador",
    summary AS "Contenido Original"
FROM public.profiles
WHERE role = 'professional'
  AND LENGTH(summary) > 500
ORDER BY LENGTH(summary) DESC;

-- ====================
-- 10. CONTAR PERFILES QUE PASARÍAN VALIDACIÓN
-- ====================
SELECT
    '✅ VALIDACIÓN GENERAL' AS "REPORTE",
    '================================================' AS "separator"
UNION ALL
SELECT
    'Total Perfiles:' AS "Métrica",
    COUNT(*)::text AS "Valor"
FROM public.profiles WHERE role = 'professional'
UNION ALL
SELECT
    'Perfiles que PASAN validación:',
    COUNT(*)::text || ' ✅'
FROM public.profiles p
WHERE role = 'professional'
  AND LENGTH(p.summary) <= 500
  AND LENGTH(p.headline) <= 150
  AND LENGTH(p.full_name) <= 50
  AND NOT EXISTS (
    SELECT 1 FROM experiences e
    CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
    WHERE e.profile_id = p.id AND LENGTH(achievement) > 100
  )
UNION ALL
SELECT
    'Perfiles que FALLAN validación:',
    COUNT(*)::text || ' ❌'
FROM public.profiles p
WHERE role = 'professional'
  AND (
    LENGTH(p.summary) > 500
    OR LENGTH(p.headline) > 150
    OR LENGTH(p.full_name) > 50
    OR EXISTS (
      SELECT 1 FROM experiences e
      CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
      WHERE e.profile_id = p.id AND LENGTH(achievement) > 100
    )
  );
