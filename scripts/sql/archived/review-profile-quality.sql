-- ============================================================================
-- REVISIÓN DE CALIDAD DE PERFILES PARA CV
-- Ejecutar sección por sección en Supabase
-- ============================================================================

-- ====================
-- PASO 1: RESUMEN GENERAL DE COMPLETITUD
-- ====================
SELECT
    p.full_name as "Nombre",
    CASE WHEN p.avatar_url IS NOT NULL THEN '✅' ELSE '❌' END as "Foto",
    CASE WHEN p.summary IS NOT NULL AND LENGTH(p.summary) > 100 THEN '✅ ' || LENGTH(p.summary) ELSE '❌' END as "Summary",
    CASE WHEN p.headline IS NOT NULL AND LENGTH(p.headline) > 20 THEN '✅ ' || LENGTH(p.headline) ELSE '⚠️ ' || COALESCE(LENGTH(p.headline)::text, '0') END as "Headline",
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as "Exp",
    (SELECT SUM(array_length(achievements, 1)) FROM experiences WHERE profile_id = p.id) as "Achiev",
    (SELECT COUNT(*) FROM education WHERE profile_id = p.id) as "Edu",
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as "Skills",
    (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) as "Lang",
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as "Certs",
    (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id) as "Stamps"
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY p.full_name;

-- ====================
-- PASO 2: INFORMACIÓN BÁSICA COMPLETA
-- ====================
SELECT
    full_name as "Nombre",
    email as "Email",
    headline as "Headline",
    location as "Ubicación",
    portfolio_url as "Portfolio",
    linkedin_url as "LinkedIn",
    LENGTH(summary) as "Summary Chars",
    LEFT(summary, 200) || '...' as "Summary Preview"
FROM public.profiles
WHERE role = 'professional'
ORDER BY full_name;

-- ====================
-- PASO 3: DETALLE DE EXPERIENCIAS
-- ====================
SELECT
    p.full_name as "Nombre",
    e.position as "Cargo",
    e.company_name as "Empresa",
    TO_CHAR(e.start_date, 'YYYY-MM') as "Desde",
    COALESCE(TO_CHAR(e.end_date, 'YYYY-MM'), 'Actual') as "Hasta",
    LENGTH(e.description) as "Desc Chars",
    array_length(e.achievements, 1) as "# Achiev",
    LEFT(e.description, 150) || '...' as "Descripción Preview"
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, e.start_date DESC;

-- ====================
-- PASO 4: ACHIEVEMENTS INDIVIDUALES (Top 20 más largos)
-- ====================
SELECT
    p.full_name as "Nombre",
    e.company_name as "Empresa",
    LENGTH(achievement) as "Chars",
    achievement as "Achievement"
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
CROSS JOIN LATERAL UNNEST(e.achievements) AS achievement
WHERE p.role = 'professional'
ORDER BY LENGTH(achievement) DESC
LIMIT 20;

-- ====================
-- PASO 5: EDUCACIÓN
-- ====================
SELECT
    p.full_name as "Nombre",
    ed.degree as "Título",
    ed.institution_name as "Institución",
    ed.field_of_study as "Campo",
    TO_CHAR(ed.start_date, 'YYYY') as "Desde",
    COALESCE(TO_CHAR(ed.end_date, 'YYYY'), 'Actual') as "Hasta",
    LENGTH(ed.description) as "Desc Chars"
FROM public.education ed
JOIN public.profiles p ON ed.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, ed.start_date DESC;

-- ====================
-- PASO 6: SKILLS POR PERFIL
-- ====================
SELECT
    p.full_name as "Nombre",
    COUNT(*) as "Total Skills",
    SUM(CASE WHEN s.level = 'Expert' THEN 1 ELSE 0 END) as "Expert",
    SUM(CASE WHEN s.level = 'Advanced' THEN 1 ELSE 0 END) as "Advanced",
    SUM(CASE WHEN s.level = 'Intermediate' THEN 1 ELSE 0 END) as "Intermediate",
    string_agg(s.name, ', ' ORDER BY s.level DESC, s.name) as "Skills List"
FROM public.skills s
JOIN public.profiles p ON s.profile_id = p.id
WHERE p.role = 'professional'
GROUP BY p.id, p.full_name
ORDER BY p.full_name;

-- ====================
-- PASO 7: IDIOMAS
-- ====================
SELECT
    p.full_name as "Nombre",
    string_agg(l.name || ' (' || l.level || ')', ', ' ORDER BY
        CASE l.level
            WHEN 'NATIVE' THEN 1
            WHEN 'C2' THEN 2
            WHEN 'C1' THEN 3
            WHEN 'B2' THEN 4
            WHEN 'B1' THEN 5
            WHEN 'A2' THEN 6
            WHEN 'A1' THEN 7
        END
    ) as "Idiomas"
FROM public.languages l
JOIN public.profiles p ON l.profile_id = p.id
WHERE p.role = 'professional'
GROUP BY p.id, p.full_name
ORDER BY p.full_name;

-- ====================
-- PASO 8: CERTIFICACIONES
-- ====================
SELECT
    p.full_name as "Nombre",
    pi.title as "Certificación",
    pi.issuer as "Emisor",
    LEFT(pi.issue_date, 7) as "Fecha",
    LENGTH(pi.description) as "Desc Chars",
    LEFT(pi.description, 100) || '...' as "Descripción Preview"
FROM public.portfolio_items pi
JOIN public.profiles p ON pi.profile_id = p.id
WHERE p.role = 'professional'
  AND pi.type = 'CERTIFICATION'
ORDER BY p.full_name, pi.issue_date DESC NULLS LAST;

-- ====================
-- PASO 9: VERIFICACIÓN DE CALIDAD - PROBLEMAS POTENCIALES
-- ====================
SELECT
    p.full_name as "Nombre",
    CASE
        WHEN p.summary IS NULL OR LENGTH(p.summary) < 200 THEN '⚠️ Summary muy corto'
        WHEN LENGTH(p.summary) > 800 THEN '❌ Summary excede límite'
        ELSE '✅ Summary OK'
    END as "Summary",
    CASE
        WHEN p.headline IS NULL OR LENGTH(p.headline) < 30 THEN '⚠️ Headline muy corto'
        WHEN LENGTH(p.headline) > 150 THEN '❌ Headline excede límite'
        ELSE '✅ Headline OK'
    END as "Headline",
    CASE
        WHEN (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) < 3 THEN '⚠️ Pocas experiencias'
        WHEN (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) >= 4 THEN '✅ Buena cantidad'
        ELSE '✓ Aceptable'
    END as "Experiencias",
    CASE
        WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) < 8 THEN '⚠️ Pocos skills'
        WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) >= 12 THEN '✅ Buena cantidad'
        ELSE '✓ Aceptable'
    END as "Skills",
    CASE
        WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') < 3 THEN '⚠️ Pocas certificaciones'
        WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') >= 5 THEN '✅ Buena cantidad'
        ELSE '✓ Aceptable'
    END as "Certificaciones",
    CASE
        WHEN p.avatar_url IS NULL THEN '❌ Sin foto'
        ELSE '✅ Con foto'
    END as "Foto"
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY p.full_name;

-- ====================
-- PASO 10: SUMMARIES COMPLETOS PARA REVISIÓN MANUAL
-- ====================
SELECT
    '========================' as separador,
    full_name || ' (' || LENGTH(summary) || ' chars)' as perfil,
    '========================' as separador2,
    summary as contenido,
    '' as blank
FROM public.profiles
WHERE role = 'professional'
ORDER BY full_name;
