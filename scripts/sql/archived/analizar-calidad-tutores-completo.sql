-- ============================================================================
-- ANÁLISIS COMPLETO DE CALIDAD DE CONTENIDO - TUTORES ISEIH
-- ============================================================================
-- Este script analiza TODOS los tutores y muestra qué les falta para tener
-- un CV de CALIDAD PROFESIONAL
-- ============================================================================

-- PASO 1: Ver TODOS los tutores ISEIH con métricas de calidad
SELECT
    p.full_name,
    p.email,
    p.role,
    p.template,
    p.wizard_completed,
    p.slug,

    -- Métricas de texto
    LENGTH(p.headline) as headline_chars,
    LENGTH(p.summary) as summary_chars,

    -- Contadores
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as total_experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as total_skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as total_certificaciones,

    -- Achievements totales de todas las experiencias
    (SELECT SUM(array_length(achievements, 1))
     FROM experiences
     WHERE profile_id = p.id AND achievements IS NOT NULL) as total_achievements,

    -- Calidad general
    CASE
        WHEN LENGTH(p.headline) >= 30
         AND LENGTH(p.summary) >= 200
         AND (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) >= 4
         AND (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) >= 12
         AND (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') >= 3
        THEN '✅ COMPLETO'
        ELSE '⚠️ INCOMPLETO'
    END as calidad_general

FROM public.profiles p
WHERE p.email LIKE '%@iseih.edu'
   OR p.full_name IN (
       'Rebecca Anderson',
       'Karen White',
       'Paul Henderson',
       'Jessica Porter',
       'Alex Martinez',
       'Diana Russell',
       'Michelle Chang',
       'Robert Kim',
       'Catherine Adams',
       'Mark Davidson'
   )
ORDER BY calidad_general DESC, p.full_name;

-- ============================================================================
-- PASO 2: DETALLES DE QUÉ FALTA EN CADA TUTOR INCOMPLETO
-- ============================================================================
SELECT
    p.full_name,

    -- ¿Qué le falta?
    CASE WHEN LENGTH(p.headline) < 30 THEN '❌ Headline corto (' || LENGTH(p.headline) || ' chars)' ELSE '✅ Headline OK' END as check_headline,
    CASE WHEN LENGTH(p.summary) < 200 THEN '❌ Summary corto (' || LENGTH(p.summary) || ' chars)' ELSE '✅ Summary OK' END as check_summary,
    CASE WHEN (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) < 4 THEN '❌ Pocas experiencias (' || (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) || ')' ELSE '✅ Experiencias OK' END as check_experiencias,
    CASE WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) < 12 THEN '❌ Pocos skills (' || (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) || ')' ELSE '✅ Skills OK' END as check_skills,
    CASE WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') < 3 THEN '❌ Pocas certificaciones (' || (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') || ')' ELSE '✅ Certificaciones OK' END as check_certificaciones,

    -- Achievements
    CASE WHEN (SELECT SUM(array_length(achievements, 1)) FROM experiences WHERE profile_id = p.id AND achievements IS NOT NULL) < 16 THEN '⚠️ Pocos achievements (' || COALESCE((SELECT SUM(array_length(achievements, 1)) FROM experiences WHERE profile_id = p.id AND achievements IS NOT NULL), 0) || ')' ELSE '✅ Achievements OK' END as check_achievements

FROM public.profiles p
WHERE (p.email LIKE '%@iseih.edu'
   OR p.full_name IN (
       'Rebecca Anderson', 'Karen White', 'Paul Henderson', 'Jessica Porter', 'Alex Martinez',
       'Diana Russell', 'Michelle Chang', 'Robert Kim', 'Catherine Adams', 'Mark Davidson'
   ))
  AND (
      LENGTH(p.headline) < 30
      OR LENGTH(p.summary) < 200
      OR (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) < 4
      OR (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) < 12
      OR (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') < 3
  )
ORDER BY p.full_name;

-- ============================================================================
-- PASO 3: VER EXPERIENCIAS DE TUTORES INCOMPLETOS
-- ============================================================================
SELECT
    p.full_name,
    e.company_name,
    e.position,
    e.start_date,
    e.end_date,
    array_length(e.achievements, 1) as num_achievements,
    LENGTH(e.description) as description_length
FROM public.profiles p
LEFT JOIN experiences e ON e.profile_id = p.id
WHERE (p.email LIKE '%@iseih.edu'
   OR p.full_name IN (
       'Rebecca Anderson', 'Karen White', 'Paul Henderson', 'Jessica Porter', 'Alex Martinez',
       'Diana Russell', 'Michelle Chang', 'Robert Kim', 'Catherine Adams', 'Mark Davidson'
   ))
ORDER BY p.full_name, e.sort_order;

-- ============================================================================
-- PASO 4: VER SKILLS DE TUTORES
-- ============================================================================
SELECT
    p.full_name,
    COUNT(s.id) as total_skills,
    string_agg(s.name, ', ') as skills_list
FROM public.profiles p
LEFT JOIN skills s ON s.profile_id = p.id
WHERE (p.email LIKE '%@iseih.edu'
   OR p.full_name IN (
       'Rebecca Anderson', 'Karen White', 'Paul Henderson', 'Jessica Porter', 'Alex Martinez',
       'Diana Russell', 'Michelle Chang', 'Robert Kim', 'Catherine Adams', 'Mark Davidson'
   ))
GROUP BY p.full_name, p.id
HAVING COUNT(s.id) < 12
ORDER BY total_skills ASC, p.full_name;

-- ============================================================================
-- PASO 5: VER CERTIFICACIONES DE TUTORES
-- ============================================================================
SELECT
    p.full_name,
    COUNT(pi.id) as total_certificaciones,
    string_agg(pi.title, ' | ') as certificaciones_list
FROM public.profiles p
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id AND pi.type = 'CERTIFICATION'
WHERE (p.email LIKE '%@iseih.edu'
   OR p.full_name IN (
       'Rebecca Anderson', 'Karen White', 'Paul Henderson', 'Jessica Porter', 'Alex Martinez',
       'Diana Russell', 'Michelle Chang', 'Robert Kim', 'Catherine Adams', 'Mark Davidson'
   ))
GROUP BY p.full_name, p.id
HAVING COUNT(pi.id) < 3
ORDER BY total_certificaciones ASC, p.full_name;

-- ============================================================================
-- PASO 6: RESUMEN EJECUTIVO
-- ============================================================================
SELECT
    COUNT(*) FILTER (WHERE
        LENGTH(p.headline) >= 30
        AND LENGTH(p.summary) >= 200
        AND (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) >= 4
        AND (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) >= 12
        AND (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') >= 3
    ) as tutores_completos,

    COUNT(*) FILTER (WHERE
        LENGTH(p.headline) < 30
        OR LENGTH(p.summary) < 200
        OR (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) < 4
        OR (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) < 12
        OR (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') < 3
    ) as tutores_incompletos,

    COUNT(*) as total_tutores

FROM public.profiles p
WHERE p.email LIKE '%@iseih.edu'
   OR p.full_name IN (
       'Rebecca Anderson', 'Karen White', 'Paul Henderson', 'Jessica Porter', 'Alex Martinez',
       'Diana Russell', 'Michelle Chang', 'Robert Kim', 'Catherine Adams', 'Mark Davidson'
   );

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ============================================================================
-- PASO 1: Vista general de todos los tutores con calidad
-- PASO 2: Detalles específicos de qué falta en cada tutor incompleto
-- PASO 3: Ver experiencias existentes (para identificar cuáles ampliar)
-- PASO 4: Ver skills de tutores con menos de 12 (para agregar más)
-- PASO 5: Ver certificaciones de tutores con menos de 3 (para agregar más)
-- PASO 6: Resumen numérico: cuántos completos vs incompletos
--
-- ESTÁNDAR DE CALIDAD:
-- ✅ Headline: >= 30 caracteres
-- ✅ Summary: >= 200 caracteres
-- ✅ Experiencias: >= 4
-- ✅ Skills: >= 12
-- ✅ Certificaciones: >= 3
-- ✅ Achievements: >= 16 totales
-- ============================================================================
