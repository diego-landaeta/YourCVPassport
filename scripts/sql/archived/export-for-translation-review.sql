-- ============================================================================
-- EXPORTAR CONTENIDO PARA REVISIÓN DE TRADUCCIÓN
-- Formato limpio y estructurado para verificar calidad de redacción ES-EN
-- ============================================================================

-- ====================
-- OPCIÓN 1: EXPORTAR TODO EL CONTENIDO TEXTUAL POR PERFIL
-- ====================
SELECT
    p.full_name AS "Nombre",
    p.email AS "Email",
    '---HEADLINE---' AS "Sección",
    p.headline AS "Contenido"
FROM public.profiles p
WHERE p.role = 'professional'

UNION ALL

SELECT
    p.full_name,
    p.email,
    '---SUMMARY---',
    p.summary
FROM public.profiles p
WHERE p.role = 'professional' AND p.summary IS NOT NULL

UNION ALL

SELECT
    p.full_name,
    p.email,
    '---EXPERIENCE: ' || e.company_name || ' - ' || e.position || '---',
    e.description
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional' AND e.description IS NOT NULL

UNION ALL

SELECT
    p.full_name,
    p.email,
    '---ACHIEVEMENT: ' || e.company_name || ' - ' || e.position || '---',
    UNNEST(e.achievements)
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional' AND e.achievements IS NOT NULL

UNION ALL

SELECT
    p.full_name,
    p.email,
    '---EDUCATION: ' || ed.degree || ' - ' || ed.institution_name || '---',
    ed.description
FROM public.education ed
JOIN public.profiles p ON ed.profile_id = p.id
WHERE p.role = 'professional' AND ed.description IS NOT NULL

UNION ALL

SELECT
    p.full_name,
    p.email,
    '---CERTIFICATION: ' || pi.title || '---',
    pi.description
FROM public.portfolio_items pi
JOIN public.profiles p ON pi.profile_id = p.id
WHERE p.role = 'professional' AND pi.type = 'CERTIFICATION' AND pi.description IS NOT NULL

ORDER BY 1, 2, 3;

-- ====================
-- OPCIÓN 2: FORMATO CSV PARA EXPORTAR A EXCEL/SHEETS
-- ====================
COPY (
    SELECT
        p.full_name,
        p.email,
        'HEADLINE' as content_type,
        p.headline as content,
        LENGTH(p.headline) as char_count,
        NULL as parent_context
    FROM public.profiles p
    WHERE p.role = 'professional'

    UNION ALL

    SELECT
        p.full_name,
        p.email,
        'SUMMARY',
        p.summary,
        LENGTH(p.summary),
        NULL
    FROM public.profiles p
    WHERE p.role = 'professional' AND p.summary IS NOT NULL

    UNION ALL

    SELECT
        p.full_name,
        p.email,
        'EXPERIENCE_DESCRIPTION',
        e.description,
        LENGTH(e.description),
        e.company_name || ' - ' || e.position
    FROM public.experiences e
    JOIN public.profiles p ON e.profile_id = p.id
    WHERE p.role = 'professional' AND e.description IS NOT NULL

    UNION ALL

    SELECT
        p.full_name,
        p.email,
        'ACHIEVEMENT',
        UNNEST(e.achievements),
        LENGTH(UNNEST(e.achievements)),
        e.company_name || ' - ' || e.position
    FROM public.experiences e
    JOIN public.profiles p ON e.profile_id = p.id
    WHERE p.role = 'professional' AND e.achievements IS NOT NULL

    UNION ALL

    SELECT
        p.full_name,
        p.email,
        'EDUCATION_DESCRIPTION',
        ed.description,
        LENGTH(ed.description),
        ed.degree || ' - ' || ed.institution_name
    FROM public.education ed
    JOIN public.profiles p ON ed.profile_id = p.id
    WHERE p.role = 'professional' AND ed.description IS NOT NULL

    UNION ALL

    SELECT
        p.full_name,
        p.email,
        'CERTIFICATION_DESCRIPTION',
        pi.description,
        LENGTH(pi.description),
        pi.title || ' - ' || pi.issuer
    FROM public.portfolio_items pi
    JOIN public.profiles p ON pi.profile_id = p.id
    WHERE p.role = 'professional' AND pi.type = 'CERTIFICATION' AND pi.description IS NOT NULL

    ORDER BY 1, 3
) TO '/tmp/content_for_translation_review.csv' WITH CSV HEADER;

-- ====================
-- OPCIÓN 3: REPORTE INDIVIDUAL POR PERFIL (FORMATO MARKDOWN)
-- ====================
-- Ejecuta cambiando el email para cada perfil que quieras revisar

DO $$
DECLARE
    target_email TEXT := 'richard.hamilton@iseih.edu'; -- CAMBIAR AQUÍ
    rec RECORD;
    exp_rec RECORD;
    edu_rec RECORD;
    cert_rec RECORD;
BEGIN
    -- Perfil básico
    FOR rec IN
        SELECT full_name, headline, summary
        FROM public.profiles
        WHERE email = target_email AND role = 'professional'
    LOOP
        RAISE NOTICE '# %', rec.full_name;
        RAISE NOTICE '';
        RAISE NOTICE '## Headline';
        RAISE NOTICE '%', rec.headline;
        RAISE NOTICE '';
        RAISE NOTICE '## Summary';
        RAISE NOTICE '%', rec.summary;
        RAISE NOTICE '';
    END LOOP;

    -- Experiencias
    RAISE NOTICE '## Experiences';
    RAISE NOTICE '';
    FOR exp_rec IN
        SELECT e.company_name, e.position, e.description, e.achievements
        FROM public.experiences e
        JOIN public.profiles p ON e.profile_id = p.id
        WHERE p.email = target_email
        ORDER BY e.start_date DESC
    LOOP
        RAISE NOTICE '### % - %', exp_rec.company_name, exp_rec.position;
        RAISE NOTICE '';
        RAISE NOTICE '**Description:**';
        RAISE NOTICE '%', exp_rec.description;
        RAISE NOTICE '';
        RAISE NOTICE '**Achievements:**';
        FOR i IN 1..ARRAY_LENGTH(exp_rec.achievements, 1) LOOP
            RAISE NOTICE '- %', exp_rec.achievements[i];
        END LOOP;
        RAISE NOTICE '';
    END LOOP;

    -- Educación
    RAISE NOTICE '## Education';
    RAISE NOTICE '';
    FOR edu_rec IN
        SELECT ed.institution_name, ed.degree, ed.field_of_study, ed.description
        FROM public.education ed
        JOIN public.profiles p ON ed.profile_id = p.id
        WHERE p.email = target_email
        ORDER BY ed.start_date DESC
    LOOP
        RAISE NOTICE '### % - %', edu_rec.degree, edu_rec.institution_name;
        RAISE NOTICE '';
        RAISE NOTICE '**Field:** %', edu_rec.field_of_study;
        RAISE NOTICE '';
        RAISE NOTICE '**Description:**';
        RAISE NOTICE '%', edu_rec.description;
        RAISE NOTICE '';
    END LOOP;

    -- Certificaciones
    RAISE NOTICE '## Certifications';
    RAISE NOTICE '';
    FOR cert_rec IN
        SELECT pi.title, pi.issuer, pi.description
        FROM public.portfolio_items pi
        JOIN public.profiles p ON pi.profile_id = p.id
        WHERE p.email = target_email AND pi.type = 'CERTIFICATION'
        ORDER BY pi.issue_date DESC
    LOOP
        RAISE NOTICE '### %', cert_rec.title;
        RAISE NOTICE '';
        RAISE NOTICE '**Issuer:** %', cert_rec.issuer;
        RAISE NOTICE '';
        RAISE NOTICE '**Description:**';
        RAISE NOTICE '%', cert_rec.description;
        RAISE NOTICE '';
    END LOOP;
END $$;

-- ====================
-- OPCIÓN 4: VERIFICAR PROBLEMAS DE REDACCIÓN
-- ====================
SELECT
    p.full_name,
    content_type,
    issue,
    preview,
    char_count
FROM (
    -- Summaries con problemas
    SELECT
        p.full_name,
        'SUMMARY' as content_type,
        CASE
            WHEN LENGTH(p.summary) < 200 THEN 'Demasiado corto'
            WHEN LENGTH(p.summary) > 1200 THEN 'Demasiado largo'
            WHEN p.summary LIKE '%TODO%' THEN 'Contiene TODO'
            WHEN p.summary LIKE '%FIXME%' THEN 'Contiene FIXME'
            WHEN p.summary LIKE '%XXX%' THEN 'Contiene XXX'
            ELSE 'OK'
        END as issue,
        SUBSTRING(p.summary, 1, 100) || '...' as preview,
        LENGTH(p.summary) as char_count
    FROM public.profiles p
    WHERE p.role = 'professional' AND p.summary IS NOT NULL

    UNION ALL

    -- Experience descriptions con problemas
    SELECT
        p.full_name,
        'EXPERIENCE: ' || e.company_name,
        CASE
            WHEN LENGTH(e.description) < 100 THEN 'Demasiado corto'
            WHEN LENGTH(e.description) > 800 THEN 'Demasiado largo'
            WHEN e.description LIKE '%TODO%' THEN 'Contiene TODO'
            ELSE 'OK'
        END,
        SUBSTRING(e.description, 1, 100) || '...',
        LENGTH(e.description)
    FROM public.experiences e
    JOIN public.profiles p ON e.profile_id = p.id
    WHERE p.role = 'professional' AND e.description IS NOT NULL

    UNION ALL

    -- Achievements con problemas
    SELECT
        p.full_name,
        'ACHIEVEMENT: ' || e.company_name,
        CASE
            WHEN LENGTH(UNNEST(e.achievements)) < 30 THEN 'Demasiado corto'
            WHEN LENGTH(UNNEST(e.achievements)) > 300 THEN 'Demasiado largo'
            ELSE 'OK'
        END,
        SUBSTRING(UNNEST(e.achievements), 1, 100) || '...',
        LENGTH(UNNEST(e.achievements))
    FROM public.experiences e
    JOIN public.profiles p ON e.profile_id = p.id
    WHERE p.role = 'professional' AND e.achievements IS NOT NULL
) as content_issues
WHERE issue != 'OK'
ORDER BY full_name, content_type;

-- ====================
-- OPCIÓN 5: COMPARAR LONGITUDES DE CONTENIDO
-- ====================
SELECT
    p.full_name,
    LENGTH(p.summary) as summary_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as num_experiences,
    (SELECT ROUND(AVG(LENGTH(description))) FROM experiences WHERE profile_id = p.id) as avg_exp_desc_chars,
    (SELECT COUNT(*) FROM education WHERE profile_id = p.id) as num_education,
    (SELECT ROUND(AVG(LENGTH(description))) FROM education WHERE profile_id = p.id) as avg_edu_desc_chars,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as num_certs,
    (SELECT ROUND(AVG(LENGTH(description))) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as avg_cert_desc_chars
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY p.full_name;
