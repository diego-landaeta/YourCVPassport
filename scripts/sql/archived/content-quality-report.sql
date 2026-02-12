-- ============================================================================
-- REPORTE DE CALIDAD DE CONTENIDO PARA REVISIÓN
-- Genera un reporte legible para verificar calidad de redacción y traducción
-- ============================================================================

-- EJECUTAR CADA SECCIÓN POR SEPARADO PARA MEJOR LEGIBILIDAD

-- ====================
-- SECCIÓN 1: PERFIL COMPLETO POR USUARIO
-- ====================
-- Cambia el email aquí para ver un perfil específico
DO $$
DECLARE
    target_email TEXT := 'nicole.taylor@iseih.edu'; -- CAMBIAR SEGÚN NECESIDAD
    profile_record RECORD;
BEGIN
    FOR profile_record IN
        SELECT
            '================================' as separator,
            'PERFIL COMPLETO: ' || full_name as title,
            '================================' as separator2,
            full_name,
            headline,
            email,
            location,
            country_code,
            gender,
            plan,
            linkedin_url,
            availability,
            summary
        FROM public.profiles
        WHERE email = target_email
    LOOP
        RAISE NOTICE '% %', profile_record.separator, '';
        RAISE NOTICE '% %', profile_record.title, '';
        RAISE NOTICE '% %', profile_record.separator2, '';
        RAISE NOTICE 'Nombre: %', profile_record.full_name;
        RAISE NOTICE 'Headline: %', profile_record.headline;
        RAISE NOTICE 'Email: %', profile_record.email;
        RAISE NOTICE 'Ubicación: %', profile_record.location;
        RAISE NOTICE 'País: %', profile_record.country_code;
        RAISE NOTICE 'Género: %', profile_record.gender;
        RAISE NOTICE 'Plan: %', profile_record.plan;
        RAISE NOTICE 'LinkedIn: %', profile_record.linkedin_url;
        RAISE NOTICE 'Disponibilidad: %', profile_record.availability;
        RAISE NOTICE '';
        RAISE NOTICE 'SUMMARY:';
        RAISE NOTICE '%', profile_record.summary;
        RAISE NOTICE '';
    END LOOP;
END $$;

-- ====================
-- SECCIÓN 2: REPORTE GENERAL DE TODOS LOS PERFILES
-- ====================
SELECT
    '🔍 REPORTE GENERAL DE CALIDAD' as reporte,
    COUNT(*) as total_perfiles,
    COUNT(*) FILTER (WHERE avatar_url IS NOT NULL AND avatar_url != '') as con_foto,
    COUNT(*) FILTER (WHERE avatar_url IS NULL OR avatar_url = '') as sin_foto,
    ROUND(AVG(LENGTH(summary))) as promedio_chars_summary,
    MIN(LENGTH(summary)) as min_chars_summary,
    MAX(LENGTH(summary)) as max_chars_summary
FROM public.profiles
WHERE role = 'professional';

-- ====================
-- SECCIÓN 3: LISTADO RÁPIDO DE CALIDAD POR PERFIL
-- ====================
SELECT
    full_name,
    SUBSTRING(headline, 1, 40) as headline_short,
    CASE WHEN avatar_url IS NOT NULL THEN '✓' ELSE '✗' END as foto,
    LENGTH(summary) as sum_len,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM education WHERE profile_id = p.id) as edu,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) as lang,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as cert,
    -- Scoring
    (
        CASE WHEN avatar_url IS NOT NULL THEN 10 ELSE 0 END +
        CASE WHEN LENGTH(summary) >= 300 THEN 20 ELSE 0 END +
        ((SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) * 5) +
        ((SELECT COUNT(*) FROM education WHERE profile_id = p.id) * 5) +
        ((SELECT COUNT(*) FROM skills WHERE profile_id = p.id) * 1) +
        ((SELECT COUNT(*) FROM languages WHERE profile_id = p.id) * 5) +
        ((SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') * 3)
    ) as score
FROM public.profiles p
WHERE role = 'professional'
ORDER BY score DESC;

-- ====================
-- SECCIÓN 4: REVISIÓN DE SUMMARIES (TRADUCCIÓN)
-- ====================
SELECT
    '📝 SUMMARIES PARA REVISIÓN DE REDACCIÓN' as seccion,
    full_name,
    '---' as separator,
    summary,
    '---' as separator2,
    LENGTH(summary) as caracteres,
    LENGTH(summary) - LENGTH(REPLACE(summary, ' ', '')) + 1 as palabras_aprox,
    LENGTH(summary) - LENGTH(REPLACE(summary, '.', '')) as num_oraciones_aprox
FROM public.profiles
WHERE role = 'professional'
  AND summary IS NOT NULL
ORDER BY full_name;

-- ====================
-- SECCIÓN 5: REVISIÓN DE EXPERIENCIAS (DESCRIPTIONS)
-- ====================
SELECT
    '💼 EXPERIENCIAS - DESCRIPTIONS PARA REVISIÓN' as seccion,
    p.full_name,
    e.company_name,
    e.position,
    '---' as separator,
    e.description,
    '---' as separator2,
    LENGTH(e.description) as caracteres
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, e.start_date DESC;

-- ====================
-- SECCIÓN 6: REVISIÓN DE ACHIEVEMENTS
-- ====================
SELECT
    '🏆 ACHIEVEMENTS PARA REVISIÓN' as seccion,
    p.full_name,
    e.company_name,
    e.position,
    UNNEST(e.achievements) as achievement,
    LENGTH(UNNEST(e.achievements)) as caracteres
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'
  AND e.achievements IS NOT NULL
ORDER BY p.full_name, e.start_date DESC;

-- ====================
-- SECCIÓN 7: REVISIÓN DE EDUCACIÓN (DESCRIPTIONS)
-- ====================
SELECT
    '🎓 EDUCACIÓN - DESCRIPTIONS PARA REVISIÓN' as seccion,
    p.full_name,
    ed.institution_name,
    ed.degree,
    ed.field_of_study,
    '---' as separator,
    ed.description,
    '---' as separator2,
    LENGTH(ed.description) as caracteres
FROM public.education ed
JOIN public.profiles p ON ed.profile_id = p.id
WHERE p.role = 'professional'
  AND ed.description IS NOT NULL
ORDER BY p.full_name, ed.start_date DESC;

-- ====================
-- SECCIÓN 8: REVISIÓN DE CERTIFICACIONES (DESCRIPTIONS)
-- ====================
SELECT
    '📜 CERTIFICACIONES - DESCRIPTIONS PARA REVISIÓN' as seccion,
    p.full_name,
    pi.title,
    pi.issuer,
    '---' as separator,
    pi.description,
    '---' as separator2,
    LENGTH(pi.description) as caracteres
FROM public.portfolio_items pi
JOIN public.profiles p ON pi.profile_id = p.id
WHERE p.role = 'professional'
  AND pi.type = 'CERTIFICATION'
  AND pi.description IS NOT NULL
ORDER BY p.full_name, pi.issue_date DESC;

-- ====================
-- SECCIÓN 9: PROBLEMAS POTENCIALES DE REDACCIÓN
-- ====================
SELECT
    '⚠️ PROBLEMAS POTENCIALES DETECTADOS' as seccion,
    p.full_name,
    issue_type,
    issue_detail
FROM public.profiles p
CROSS JOIN LATERAL (
    SELECT 'Summary muy corto' as issue_type, 'Solo ' || LENGTH(p.summary) || ' caracteres' as issue_detail
    WHERE LENGTH(p.summary) < 200
    UNION ALL
    SELECT 'Summary muy largo' as issue_type, LENGTH(p.summary) || ' caracteres - considerar reducir' as issue_detail
    WHERE LENGTH(p.summary) > 1200
    UNION ALL
    SELECT 'Pocas experiencias' as issue_type, (SELECT COUNT(*)::text FROM experiences WHERE profile_id = p.id) || ' experiencias - mínimo recomendado: 4' as issue_detail
    WHERE (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) < 4
    UNION ALL
    SELECT 'Poca educación' as issue_type, (SELECT COUNT(*)::text FROM education WHERE profile_id = p.id) || ' educaciones - mínimo recomendado: 3' as issue_detail
    WHERE (SELECT COUNT(*) FROM education WHERE profile_id = p.id) < 3
    UNION ALL
    SELECT 'Pocos skills' as issue_type, (SELECT COUNT(*)::text FROM skills WHERE profile_id = p.id) || ' skills - mínimo recomendado: 12' as issue_detail
    WHERE (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) < 12
    UNION ALL
    SELECT 'Pocas certificaciones' as issue_type, (SELECT COUNT(*)::text FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') || ' certificaciones - mínimo recomendado: 4' as issue_detail
    WHERE (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') < 4
) issues
WHERE p.role = 'professional'
ORDER BY p.full_name, issue_type;

-- ====================
-- SECCIÓN 10: ESTADÍSTICAS DE CONTENIDO
-- ====================
SELECT
    '📊 ESTADÍSTICAS GENERALES DE CONTENIDO' as seccion,
    'Summaries' as tipo_contenido,
    COUNT(*) as total,
    ROUND(AVG(LENGTH(summary))) as promedio_caracteres,
    MIN(LENGTH(summary)) as minimo_caracteres,
    MAX(LENGTH(summary)) as maximo_caracteres
FROM public.profiles
WHERE role = 'professional' AND summary IS NOT NULL
UNION ALL
SELECT
    '📊 ESTADÍSTICAS GENERALES DE CONTENIDO',
    'Experience Descriptions',
    COUNT(*),
    ROUND(AVG(LENGTH(description))),
    MIN(LENGTH(description)),
    MAX(LENGTH(description))
FROM public.experiences
WHERE description IS NOT NULL
UNION ALL
SELECT
    '📊 ESTADÍSTICAS GENERALES DE CONTENIDO',
    'Education Descriptions',
    COUNT(*),
    ROUND(AVG(LENGTH(description))),
    MIN(LENGTH(description)),
    MAX(LENGTH(description))
FROM public.education
WHERE description IS NOT NULL
UNION ALL
SELECT
    '📊 ESTADÍSTICAS GENERALES DE CONTENIDO',
    'Certification Descriptions',
    COUNT(*),
    ROUND(AVG(LENGTH(description))),
    MIN(LENGTH(description)),
    MAX(LENGTH(description))
FROM public.portfolio_items
WHERE type = 'CERTIFICATION' AND description IS NOT NULL;

-- ====================
-- SECCIÓN 11: EXPORTAR TODO EL CONTENIDO DE UN PERFIL
-- ====================
-- Para exportar todo el contenido de un perfil específico para revisión manual
-- Cambia el email según necesites

WITH profile_data AS (
    SELECT id, full_name, headline, summary, location, email
    FROM public.profiles
    WHERE email = 'richard.hamilton@iseih.edu' -- CAMBIAR SEGÚN NECESIDAD
)
SELECT
    'PERFIL COMPLETO: ' || pd.full_name as section,
    '========================' as separator,
    'BASIC INFO' as subsection,
    jsonb_pretty(jsonb_build_object(
        'full_name', pd.full_name,
        'headline', pd.headline,
        'summary', pd.summary,
        'location', pd.location,
        'email', pd.email
    )) as content
FROM profile_data pd
UNION ALL
SELECT
    'PERFIL COMPLETO: ' || pd.full_name,
    '========================',
    'EXPERIENCES',
    jsonb_pretty(jsonb_agg(jsonb_build_object(
        'company', e.company_name,
        'position', e.position,
        'dates', e.start_date || ' to ' || COALESCE(e.end_date::text, 'Present'),
        'description', e.description,
        'achievements', e.achievements
    ) ORDER BY e.start_date DESC))
FROM profile_data pd
LEFT JOIN public.experiences e ON e.profile_id = pd.id
GROUP BY pd.full_name
UNION ALL
SELECT
    'PERFIL COMPLETO: ' || pd.full_name,
    '========================',
    'EDUCATION',
    jsonb_pretty(jsonb_agg(jsonb_build_object(
        'institution', ed.institution_name,
        'degree', ed.degree,
        'field', ed.field_of_study,
        'dates', ed.start_date || ' to ' || COALESCE(ed.end_date::text, 'Present'),
        'description', ed.description
    ) ORDER BY ed.start_date DESC))
FROM profile_data pd
LEFT JOIN public.education ed ON ed.profile_id = pd.id
GROUP BY pd.full_name
UNION ALL
SELECT
    'PERFIL COMPLETO: ' || pd.full_name,
    '========================',
    'CERTIFICATIONS',
    jsonb_pretty(jsonb_agg(jsonb_build_object(
        'title', pi.title,
        'issuer', pi.issuer,
        'description', pi.description,
        'issue_date', pi.issue_date
    ) ORDER BY pi.issue_date DESC))
FROM profile_data pd
LEFT JOIN public.portfolio_items pi ON pi.profile_id = pd.id AND pi.type = 'CERTIFICATION'
GROUP BY pd.full_name;
