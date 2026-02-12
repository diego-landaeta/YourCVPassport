-- ============================================================================
-- VERIFICACIÓN COMPLETA DE TODAS LAS CORRECCIONES
-- Ejecutar después de aplicar todos los scripts de fix
-- ============================================================================

-- ====================
-- 1. VERIFICAR CARLOS SAIZ OCULTO
-- ====================
SELECT
    '1. CARLOS SAIZ OCULTO' as verificacion,
    CASE
        WHEN COUNT(*) = 1 AND MAX(role) = 'archived' THEN '✅ CORRECTO - Oculto'
        WHEN COUNT(*) = 0 THEN '❌ ERROR - Perfil no existe'
        ELSE '❌ ERROR - Role incorrecto: ' || MAX(role)
    END as resultado
FROM public.profiles
WHERE full_name = 'Carlos Saiz';

-- ====================
-- 2. VERIFICAR HEADLINES EXTENDIDOS
-- ====================
SELECT
    '2. HEADLINES EXTENDIDOS' as verificacion,
    CASE
        WHEN MIN(LENGTH(headline)) >= 30 THEN '✅ CORRECTO - Todos >= 30 chars'
        ELSE '❌ ERROR - Algunos headlines muy cortos'
    END as resultado,
    string_agg(
        full_name || ': ' || LENGTH(headline) || ' chars',
        ' | '
        ORDER BY full_name
    ) as detalle
FROM public.profiles
WHERE full_name IN ('Priya Sharma', 'Janet Lee', 'Lisa Morrison', 'Emily Harper');

-- ====================
-- 3. VERIFICAR SKILLS AGREGADOS
-- ====================
SELECT
    '3. SKILLS AGREGADOS' as verificacion,
    CASE
        WHEN MIN(total_skills) >= 12 THEN '✅ CORRECTO - Todos >= 12 skills'
        ELSE '❌ ERROR - Algunos perfiles con < 12 skills'
    END as resultado,
    string_agg(
        full_name || ': ' || total_skills || ' skills',
        ' | '
        ORDER BY total_skills, full_name
    ) as detalle
FROM (
    SELECT
        p.full_name,
        COUNT(s.id) as total_skills
    FROM public.profiles p
    LEFT JOIN public.skills s ON s.profile_id = p.id
    WHERE p.full_name IN ('Christopher Barnes', 'Linda Zhang', 'Priya Sharma', 'Marta Ruiz Serrano')
    GROUP BY p.id, p.full_name
) skills_count;

-- ====================
-- 4. VERIFICAR CERTIFICACIONES AGREGADAS
-- ====================
SELECT
    '4. CERTIFICACIONES AGREGADAS' as verificacion,
    CASE
        WHEN MIN(total_certs) >= 3 THEN '✅ CORRECTO - Todos >= 3 certs'
        ELSE '❌ ERROR - Algunos perfiles con < 3 certs'
    END as resultado,
    string_agg(
        full_name || ': ' || total_certs || ' certs',
        ' | '
        ORDER BY total_certs, full_name
    ) as detalle
FROM (
    SELECT
        p.full_name,
        COUNT(pi.id) as total_certs
    FROM public.profiles p
    LEFT JOIN public.portfolio_items pi ON pi.profile_id = p.id AND pi.type = 'CERTIFICATION'
    WHERE p.full_name IN ('Daniel Foster', 'Lisa Morrison', 'Marcus Williams', 'Patricia Coleman', 'Thomas Rivera')
    GROUP BY p.id, p.full_name
) certs_count;

-- ====================
-- 5. RESUMEN GENERAL DE CALIDAD
-- ====================
SELECT
    '5. RESUMEN GENERAL' as verificacion,
    COUNT(*) as total_perfiles_profesionales,
    SUM(CASE WHEN LENGTH(summary) > 200 AND LENGTH(summary) <= 800 THEN 1 ELSE 0 END) as summaries_ok,
    SUM(CASE WHEN LENGTH(headline) >= 30 THEN 1 ELSE 0 END) as headlines_ok,
    ROUND(AVG(exp_count), 1) as avg_experiencias,
    ROUND(AVG(skills_count), 1) as avg_skills,
    ROUND(AVG(certs_count), 1) as avg_certificaciones
FROM (
    SELECT
        p.id,
        p.summary,
        p.headline,
        (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp_count,
        (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills_count,
        (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs_count
    FROM public.profiles p
    WHERE p.role = 'professional'
) profile_stats;

-- ====================
-- 6. LISTA COMPLETA DE PERFILES PROFESIONALES
-- ====================
SELECT
    '6. PERFILES PROFESIONALES ACTUALES' as verificacion,
    full_name,
    LENGTH(summary) as summary_chars,
    LENGTH(headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs,
    CASE
        WHEN LENGTH(summary) > 200 AND LENGTH(summary) <= 800
             AND LENGTH(headline) >= 30
             AND (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) >= 3
             AND (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) >= 12
             AND (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') >= 3
        THEN '✅ EXCELENTE'
        WHEN LENGTH(summary) > 200 AND LENGTH(summary) <= 800
             AND (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) >= 3
             AND (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) >= 10
        THEN '✓ BUENO'
        ELSE '⚠️ MEJORABLE'
    END as calidad
FROM public.profiles p
WHERE p.role = 'professional'
ORDER BY full_name;

-- ====================
-- RESULTADO ESPERADO
-- ====================
-- 1. Carlos Saiz: ✅ CORRECTO - Oculto
-- 2. Headlines: ✅ CORRECTO - Todos >= 30 chars
-- 3. Skills: ✅ CORRECTO - Todos >= 12 skills
-- 4. Certificaciones: ✅ CORRECTO - Todos >= 3 certs
-- 5. Resumen: ~31 perfiles profesionales, 100% summaries OK, 100% headlines OK
-- 6. Perfiles: Mayoría con calidad "✅ EXCELENTE"
