-- ============================================================================
-- SCRIPT PARA VERIFICAR CALIDAD DE CONTENIDO DE PERFILES
-- Extrae toda la información de perfiles profesionales para revisión de calidad
-- Útil para verificar traducciones ES-EN y contenido de CV
-- ============================================================================

-- ====================
-- 1. INFORMACIÓN BÁSICA DE PERFIL
-- ====================
SELECT
    '========================================' as separator,
    'PERFIL BÁSICO' as section,
    '========================================' as separator2,
    p.id,
    p.full_name,
    p.headline,
    p.summary,
    p.location,
    p.country_code,
    p.email,
    p.gender,
    p.plan,
    p.role,
    p.template,
    p.linkedin_url,
    p.availability,
    p.job_type,
    p.remote_preference,
    p.willing_to_relocate,
    p.created_at,
    p.updated_at
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY p.created_at DESC;

-- ====================
-- 2. EXPERIENCIAS PROFESIONALES
-- ====================
SELECT
    '========================================' as separator,
    'EXPERIENCIAS' as section,
    '========================================' as separator2,
    p.full_name,
    e.company_name,
    e.position,
    e.start_date,
    e.end_date,
    e.is_current,
    e.location,
    e.employment_type,
    e.description,
    e.achievements,
    e.created_at
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, e.start_date DESC;

-- ====================
-- 3. EDUCACIÓN
-- ====================
SELECT
    '========================================' as separator,
    'EDUCACIÓN' as section,
    '========================================' as separator2,
    p.full_name,
    ed.institution_name,
    ed.degree,
    ed.field_of_study,
    ed.start_date,
    ed.end_date,
    ed.grade,
    ed.description,
    ed.created_at
FROM public.education ed
JOIN public.profiles p ON ed.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, ed.start_date DESC;

-- ====================
-- 4. HABILIDADES (SKILLS)
-- ====================
SELECT
    '========================================' as separator,
    'HABILIDADES' as section,
    '========================================' as separator2,
    p.full_name,
    s.name as skill_name,
    s.level,
    s.years_of_experience,
    s.category,
    s.created_at
FROM public.skills s
JOIN public.profiles p ON s.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, s.level DESC, s.years_of_experience DESC;

-- ====================
-- 5. IDIOMAS
-- ====================
SELECT
    '========================================' as separator,
    'IDIOMAS' as section,
    '========================================' as separator2,
    p.full_name,
    l.name as language_name,
    l.level,
    l.is_native,
    l.created_at
FROM public.languages l
JOIN public.profiles p ON l.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, l.is_native DESC, l.level DESC;

-- ====================
-- 6. CERTIFICACIONES Y PORTFOLIO
-- ====================
SELECT
    '========================================' as separator,
    'CERTIFICACIONES Y PORTFOLIO' as section,
    '========================================' as separator2,
    p.full_name,
    pi.type,
    pi.title,
    pi.description,
    pi.issuer,
    pi.issue_date,
    pi.credential_url,
    pi.verified,
    pi.created_at
FROM public.portfolio_items pi
JOIN public.profiles p ON pi.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, pi.type, pi.issue_date DESC;

-- ====================
-- 7. STAMPS (VERIFICACIONES)
-- ====================
SELECT
    '========================================' as separator,
    'STAMPS/VERIFICACIONES' as section,
    '========================================' as separator2,
    p.full_name,
    st.type,
    st.status,
    st.evidence,
    st.verified_at,
    st.created_at
FROM public.stamps st
JOIN public.profiles p ON st.profile_id = p.id
WHERE p.role = 'professional'
ORDER BY p.full_name, st.type;

-- ====================
-- 8. RESUMEN DE COMPLETITUD DE PERFILES
-- ====================
SELECT
    '========================================' as separator,
    'RESUMEN DE COMPLETITUD' as section,
    '========================================' as separator2,
    p.full_name,
    p.headline,
    CASE WHEN p.summary IS NOT NULL AND LENGTH(p.summary) > 100 THEN '✓' ELSE '✗' END as has_quality_summary,
    LENGTH(p.summary) as summary_length,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiences_count,
    (SELECT COUNT(*) FROM education WHERE profile_id = p.id) as education_count,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills_count,
    (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) as languages_count,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id) as certifications_count,
    (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') as verified_stamps_count,
    CASE WHEN p.avatar_url IS NOT NULL AND p.avatar_url != '' THEN '✓' ELSE '✗' END as has_avatar,
    p.wizard_completed,
    p.first_login_completed
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY p.created_at DESC;

-- ====================
-- 9. ANÁLISIS DE CALIDAD DE CONTENIDO
-- ====================
SELECT
    '========================================' as separator,
    'ANÁLISIS DE CALIDAD' as section,
    '========================================' as separator2,
    p.full_name,
    p.headline,
    -- Summary quality checks
    CASE
        WHEN p.summary IS NULL THEN '✗ Sin summary'
        WHEN LENGTH(p.summary) < 100 THEN '⚠ Summary muy corto'
        WHEN LENGTH(p.summary) > 1000 THEN '⚠ Summary muy largo'
        ELSE '✓ Summary adecuado'
    END as summary_quality,
    LENGTH(p.summary) as summary_chars,
    -- Experience quality
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp_count,
    CASE
        WHEN (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) = 0 THEN '✗ Sin experiencias'
        WHEN (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) < 3 THEN '⚠ Pocas experiencias'
        ELSE '✓ Experiencias adecuadas'
    END as experience_quality,
    -- Education quality
    (SELECT COUNT(*) FROM education WHERE profile_id = p.id) as edu_count,
    CASE
        WHEN (SELECT COUNT(*) FROM education WHERE profile_id = p.id) = 0 THEN '✗ Sin educación'
        WHEN (SELECT COUNT(*) FROM education WHERE profile_id = p.id) < 2 THEN '⚠ Poca educación'
        ELSE '✓ Educación adecuada'
    END as education_quality,
    -- Skills quality
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills_count,
    CASE
        WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) = 0 THEN '✗ Sin skills'
        WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) < 8 THEN '⚠ Pocos skills'
        ELSE '✓ Skills adecuados'
    END as skills_quality,
    -- Certifications quality
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as cert_count,
    CASE
        WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') = 0 THEN '✗ Sin certificaciones'
        WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') < 3 THEN '⚠ Pocas certificaciones'
        ELSE '✓ Certificaciones adecuadas'
    END as certifications_quality,
    -- Overall profile score
    CASE
        WHEN p.avatar_url IS NULL OR p.avatar_url = '' THEN 0 ELSE 10
    END +
    CASE
        WHEN p.summary IS NOT NULL AND LENGTH(p.summary) > 200 THEN 15 ELSE 0
    END +
    CASE
        WHEN (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) >= 4 THEN 20 ELSE 0
    END +
    CASE
        WHEN (SELECT COUNT(*) FROM education WHERE profile_id = p.id) >= 3 THEN 15 ELSE 0
    END +
    CASE
        WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) >= 12 THEN 15 ELSE 0
    END +
    CASE
        WHEN (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) >= 2 THEN 10 ELSE 0
    END +
    CASE
        WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') >= 4 THEN 15 ELSE 0
    END as profile_quality_score
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY profile_quality_score DESC;

-- ====================
-- 10. DETECCIÓN DE PROBLEMAS DE CONTENIDO
-- ====================
SELECT
    '========================================' as separator,
    'PROBLEMAS DETECTADOS' as section,
    '========================================' as separator2,
    p.full_name,
    p.email,
    ARRAY_AGG(DISTINCT issue) as issues_found
FROM public.profiles p
CROSS JOIN LATERAL (
    SELECT 'Sin foto de perfil' as issue WHERE p.avatar_url IS NULL OR p.avatar_url = ''
    UNION ALL
    SELECT 'Summary vacío' WHERE p.summary IS NULL OR LENGTH(p.summary) = 0
    UNION ALL
    SELECT 'Summary muy corto (< 200 chars)' WHERE p.summary IS NOT NULL AND LENGTH(p.summary) < 200
    UNION ALL
    SELECT 'Sin headline' WHERE p.headline IS NULL OR LENGTH(p.headline) = 0
    UNION ALL
    SELECT 'Sin experiencias' WHERE (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) = 0
    UNION ALL
    SELECT 'Pocas experiencias (< 3)' WHERE (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) < 3
    UNION ALL
    SELECT 'Sin educación' WHERE (SELECT COUNT(*) FROM education WHERE profile_id = p.id) = 0
    UNION ALL
    SELECT 'Sin skills' WHERE (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) = 0
    UNION ALL
    SELECT 'Pocos skills (< 10)' WHERE (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) < 10
    UNION ALL
    SELECT 'Sin idiomas' WHERE (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) = 0
    UNION ALL
    SELECT 'Sin certificaciones' WHERE (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') = 0
    UNION ALL
    SELECT 'Pocas certificaciones (< 4)' WHERE (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') < 4
    UNION ALL
    SELECT 'Sin stamps verificados' WHERE (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') = 0
    UNION ALL
    SELECT 'Sin ubicación' WHERE p.location IS NULL OR LENGTH(p.location) = 0
) issues
WHERE p.role = 'professional'
GROUP BY p.full_name, p.email
ORDER BY COUNT(*) DESC;

-- ====================
-- 11. CONTENIDO PARA REVISIÓN DE TRADUCCIÓN
-- ====================
-- Summary completo para revisión
SELECT
    '========================================' as separator,
    'SUMMARIES PARA REVISIÓN DE TRADUCCIÓN' as section,
    '========================================' as separator2,
    full_name,
    headline,
    summary,
    LENGTH(summary) as char_count,
    LENGTH(summary) - LENGTH(REPLACE(summary, ' ', '')) + 1 as word_count_estimate
FROM public.profiles
WHERE role = 'professional'
  AND summary IS NOT NULL
ORDER BY full_name;

-- Experience descriptions para revisión
SELECT
    '========================================' as separator,
    'DESCRIPTIONS DE EXPERIENCIAS PARA REVISIÓN' as section,
    '========================================' as separator2,
    p.full_name,
    e.company_name,
    e.position,
    e.description,
    LENGTH(e.description) as char_count
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'
  AND e.description IS NOT NULL
ORDER BY p.full_name, e.start_date DESC;

-- ====================
-- 12. VERIFICACIÓN DE ACHIEVEMENTS ESPECÍFICOS
-- ====================
SELECT
    '========================================' as separator,
    'ACHIEVEMENTS POR EXPERIENCIA' as section,
    '========================================' as separator2,
    p.full_name,
    e.company_name,
    e.position,
    e.achievements,
    ARRAY_LENGTH(e.achievements, 1) as achievements_count
FROM public.experiences e
JOIN public.profiles p ON e.profile_id = p.id
WHERE p.role = 'professional'
  AND e.achievements IS NOT NULL
ORDER BY p.full_name, e.start_date DESC;
