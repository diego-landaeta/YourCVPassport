-- ============================================================================
-- EXTRAER TODA LA INFORMACIÓN DE PERFILES PROFESIONALES
-- Para verificar calidad de contenido para CV
-- ============================================================================

-- ====================
-- 1. INFORMACIÓN BÁSICA Y SUMMARY
-- ====================
SELECT
    '==================== PERFIL: ' || full_name || ' ====================' as seccion,
    '' as blank1,
    '📧 EMAIL: ' || email as email,
    '👤 NOMBRE: ' || full_name as nombre,
    '💼 HEADLINE: ' || COALESCE(headline, 'NO TIENE') as headline,
    '📝 LOCATION: ' || COALESCE(location, 'NO TIENE') as ubicacion,
    '🌐 PORTFOLIO: ' || COALESCE(portfolio_url, 'NO TIENE') as portfolio,
    '💼 LINKEDIN: ' || COALESCE(linkedin_url, 'NO TIENE') as linkedin,
    '' as blank2,
    '📄 SUMMARY (' || LENGTH(summary) || ' chars):' as summary_header,
    summary as summary_content,
    '' as blank3
FROM public.profiles
WHERE role = 'professional'
ORDER BY full_name;

-- ====================
-- 2. EXPERIENCIAS CON ACHIEVEMENTS
-- ====================
SELECT
    p.full_name,
    '---' as separador,
    '💼 EXPERIENCIA #' || ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY e.start_date DESC) as num_exp,
    e.position as cargo,
    e.company_name as empresa,
    TO_CHAR(e.start_date, 'YYYY-MM') || ' - ' ||
    COALESCE(TO_CHAR(e.end_date, 'YYYY-MM'), 'Presente') as periodo,
    'Descripción (' || COALESCE(LENGTH(e.description), 0) || ' chars): ' || COALESCE(e.description, 'SIN DESCRIPCIÓN') as descripcion,
    '' as blank,
    '✅ ACHIEVEMENTS (' || COALESCE(array_length(e.achievements, 1), 0) || '):' as achievements_header,
    CASE
        WHEN e.achievements IS NOT NULL AND array_length(e.achievements, 1) > 0 THEN
            (SELECT string_agg('  • ' || ach || ' (' || LENGTH(ach) || ' chars)', E'\n' ORDER BY ordinality)
             FROM unnest(e.achievements) WITH ORDINALITY AS t(ach, ordinality))
        ELSE '  (Sin achievements)'
    END as achievements_list,
    '' as blank2
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, e.start_date DESC;

-- ====================
-- 3. EDUCACIÓN
-- ====================
SELECT
    p.full_name,
    '---' as separador,
    '🎓 EDUCACIÓN #' || ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY ed.start_date DESC) as num_edu,
    ed.degree as titulo,
    ed.institution_name as institucion,
    TO_CHAR(ed.start_date, 'YYYY') || ' - ' ||
    COALESCE(TO_CHAR(ed.end_date, 'YYYY'), 'Presente') as periodo,
    COALESCE(ed.field_of_study, 'N/A') as campo_estudio,
    'Descripción (' || COALESCE(LENGTH(ed.description), 0) || ' chars): ' || COALESCE(ed.description, 'SIN DESCRIPCIÓN') as descripcion,
    '' as blank
FROM public.education ed
JOIN public.profiles p ON ed.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, ed.start_date DESC;

-- ====================
-- 4. SKILLS
-- ====================
SELECT
    p.full_name,
    '---' as separador,
    '🔧 SKILLS (' || COUNT(*) || ' total):' as skills_header,
    string_agg(
        '  • ' || s.name || ' - ' || s.level ||
        CASE WHEN s.years_of_experience IS NOT NULL
             THEN ' (' || s.years_of_experience || ' años)'
             ELSE ''
        END,
        E'\n'
        ORDER BY s.level DESC, s.name
    ) as skills_list,
    '' as blank
FROM public.skills s
JOIN public.profiles p ON s.profile_id = p.id
WHERE p.role = 'professional'
GROUP BY p.id, p.full_name
ORDER BY p.full_name;

-- ====================
-- 5. IDIOMAS
-- ====================
SELECT
    p.full_name,
    '---' as separador,
    '🌍 IDIOMAS (' || COUNT(*) || ' total):' as languages_header,
    string_agg(
        '  • ' || l.name || ' - ' || l.level,
        E'\n'
        ORDER BY
            CASE l.level
                WHEN 'NATIVE' THEN 1
                WHEN 'C2' THEN 2
                WHEN 'C1' THEN 3
                WHEN 'B2' THEN 4
                WHEN 'B1' THEN 5
                WHEN 'A2' THEN 6
                WHEN 'A1' THEN 7
            END,
            l.name
    ) as languages_list,
    '' as blank
FROM public.languages l
JOIN public.profiles p ON l.profile_id = p.id
WHERE p.role = 'professional'
GROUP BY p.id, p.full_name
ORDER BY p.full_name;

-- ====================
-- 6. CERTIFICACIONES
-- ====================
SELECT
    p.full_name,
    '---' as separador,
    '📜 CERTIFICACIÓN #' || ROW_NUMBER() OVER (PARTITION BY p.id ORDER BY pi.issue_date DESC NULLS LAST) as num_cert,
    pi.title as titulo,
    COALESCE(pi.issuer, 'N/A') as emisor,
    COALESCE(LEFT(pi.issue_date, 7), 'Sin fecha') as fecha,
    COALESCE(pi.credential_id, 'N/A') as credential,
    'Descripción (' || COALESCE(LENGTH(pi.description), 0) || ' chars): ' || COALESCE(pi.description, 'SIN DESCRIPCIÓN') as descripcion,
    '' as blank
FROM public.portfolio_items pi
JOIN public.profiles p ON pi.profile_id = p.id
WHERE p.role = 'professional'
  AND pi.type = 'CERTIFICATION'
ORDER BY p.full_name, pi.issue_date DESC NULLS LAST;

-- ====================
-- 7. STAMPS (SELLOS DE VERIFICACIÓN)
-- ====================
SELECT
    p.full_name,
    '---' as separador,
    '⭐ STAMPS (' || COUNT(*) || ' total):' as stamps_header,
    string_agg(
        '  • ' || s.type || ' - ' || s.status ||
        CASE WHEN s.verified_at IS NOT NULL
             THEN ' (verificado: ' || TO_CHAR(s.verified_at, 'YYYY-MM-DD') || ')'
             ELSE ''
        END,
        E'\n'
        ORDER BY s.type
    ) as stamps_list,
    '' as blank
FROM public.stamps s
JOIN public.profiles p ON s.profile_id = p.id
WHERE p.role = 'professional'
GROUP BY p.id, p.full_name
ORDER BY p.full_name;

-- ====================
-- 8. RESUMEN DE COMPLETITUD
-- ====================
SELECT
    p.full_name,
    '---' as separador,
    CASE WHEN p.summary IS NOT NULL AND LENGTH(p.summary) > 100 THEN '✅' ELSE '❌' END || ' Summary' as tiene_summary,
    CASE WHEN p.headline IS NOT NULL THEN '✅' ELSE '❌' END || ' Headline' as tiene_headline,
    CASE WHEN p.location IS NOT NULL THEN '✅' ELSE '❌' END || ' Location' as tiene_location,
    '📊 ' || COALESCE((SELECT COUNT(*) FROM experiences WHERE profile_id = p.id), 0) || ' experiencias' as cant_exp,
    '🎓 ' || COALESCE((SELECT COUNT(*) FROM education WHERE profile_id = p.id), 0) || ' educación' as cant_edu,
    '🔧 ' || COALESCE((SELECT COUNT(*) FROM skills WHERE profile_id = p.id), 0) || ' skills' as cant_skills,
    '🌍 ' || COALESCE((SELECT COUNT(*) FROM languages WHERE profile_id = p.id), 0) || ' idiomas' as cant_lang,
    '📜 ' || COALESCE((SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION'), 0) || ' certificaciones' as cant_certs,
    '⭐ ' || COALESCE((SELECT COUNT(*) FROM stamps WHERE profile_id = p.id), 0) || ' stamps' as cant_stamps,
    '' as blank
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY p.full_name;
