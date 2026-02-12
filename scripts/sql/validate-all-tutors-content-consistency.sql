-- ============================================================================
-- VALIDAR COHERENCIA DE CONTENIDO DE TODOS LOS TUTORES ISEIH
-- ============================================================================
-- Este script verifica que UUID, Email, Nombre y Contenido sean coherentes
-- ============================================================================

-- ====================
-- PASO 1: VERIFICAR UUID vs EMAIL vs NOMBRE
-- ====================
SELECT
    '========== VERIFICACIÓN UUID-EMAIL-NOMBRE ==========' as seccion;

SELECT
    id as uuid,
    full_name,
    email,
    CASE
        WHEN full_name = 'Michelle Chang' AND id != 'b214d6b0-d516-4446-9d40-4b4bcd17678c' THEN '❌ UUID INCORRECTO'
        WHEN full_name = 'Nicole Taylor' AND id != 'f30db5f9-0807-4d48-aa76-de4b6d7278da' THEN '❌ UUID INCORRECTO'
        WHEN email = 'michelle.chang@iseih.edu' AND id != 'b214d6b0-d516-4446-9d40-4b4bcd17678c' THEN '❌ UUID INCORRECTO'
        WHEN email = 'nicole.taylor@iseih.edu' AND id != 'f30db5f9-0807-4d48-aa76-de4b6d7278da' THEN '❌ UUID INCORRECTO'
        ELSE '✅ OK'
    END as uuid_status
FROM profiles
WHERE role = 'professional'
ORDER BY uuid_status DESC, full_name;

-- ====================
-- PASO 2: VERIFICAR HEADLINE vs ESPECIALIDAD
-- ====================
SELECT
    '========== VERIFICACIÓN HEADLINE-ESPECIALIDAD ==========' as seccion;

SELECT
    full_name,
    headline,
    email,
    CASE
        -- Michelle Chang debe tener Reiki en headline
        WHEN full_name = 'Michelle Chang' AND (headline NOT LIKE '%Reiki%' AND headline NOT LIKE '%Energy%')
            THEN '❌ INCOHERENTE: Falta Reiki/Energy'

        -- Nicole Taylor debe tener Dance o Movement en headline
        WHEN full_name = 'Nicole Taylor' AND (headline NOT LIKE '%Dance%' AND headline NOT LIKE '%Movement%')
            THEN '❌ INCOHERENTE: Falta Dance/Movement'

        -- Rebecca Anderson debe tener Naturopath
        WHEN full_name = 'Rebecca Anderson' AND headline NOT LIKE '%Naturopath%'
            THEN '❌ INCOHERENTE: Falta Naturopath'

        -- Karen White debe tener Nutrition
        WHEN full_name = 'Karen White' AND headline NOT LIKE '%Nutrition%'
            THEN '❌ INCOHERENTE: Falta Nutrition'

        -- Paul Henderson debe tener Herbal o Herbalist
        WHEN full_name = 'Paul Henderson' AND (headline NOT LIKE '%Herbal%' AND headline NOT LIKE '%Herbalist%')
            THEN '❌ INCOHERENTE: Falta Herbal'

        -- Brian Cooper debe tener Energy Psychology o EFT
        WHEN full_name = 'Brian Cooper' AND (headline NOT LIKE '%Energy%' AND headline NOT LIKE '%EFT%')
            THEN '❌ INCOHERENTE: Falta Energy Psychology'

        -- Linda Zhang debe tener Acupuncture o TCM
        WHEN full_name = 'Linda Zhang' AND (headline NOT LIKE '%Acupuncture%' AND headline NOT LIKE '%TCM%')
            THEN '❌ INCOHERENTE: Falta Acupuncture/TCM'

        -- Christopher Barnes debe tener Movement o Physical
        WHEN full_name = 'Christopher Barnes' AND (headline NOT LIKE '%Movement%' AND headline NOT LIKE '%Physical%')
            THEN '❌ INCOHERENTE: Falta Movement/Physical'

        -- Priya Sharma debe tener Ayurveda
        WHEN full_name = 'Priya Sharma' AND headline NOT LIKE '%Ayurveda%'
            THEN '❌ INCOHERENTE: Falta Ayurveda'

        ELSE '✅ COHERENTE'
    END as headline_consistency
FROM profiles
WHERE role = 'professional'
ORDER BY headline_consistency DESC, full_name;

-- ====================
-- PASO 3: VERIFICAR SKILLS vs ESPECIALIDAD
-- ====================
SELECT
    '========== VERIFICACIÓN SKILLS-ESPECIALIDAD ==========' as seccion;

SELECT
    p.full_name,
    (SELECT string_agg(name, ', ' ORDER BY name) FROM skills WHERE profile_id = p.id LIMIT 8) as top_8_skills,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as total_skills,
    CASE
        -- Michelle Chang debe tener skills de Reiki
        WHEN p.full_name = 'Michelle Chang' AND NOT EXISTS (
            SELECT 1 FROM skills WHERE profile_id = p.id AND name LIKE '%Reiki%'
        ) THEN '❌ INCOHERENTE: Sin skills de Reiki'

        -- Nicole Taylor debe tener skills de Dance/Movement
        WHEN p.full_name = 'Nicole Taylor' AND NOT EXISTS (
            SELECT 1 FROM skills WHERE profile_id = p.id AND (name LIKE '%Dance%' OR name LIKE '%Movement%')
        ) THEN '❌ INCOHERENTE: Sin skills de Dance/Movement'

        -- Verificar cantidad mínima de skills
        WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) < 12
            THEN '⚠️ POCOS SKILLS: ' || (SELECT COUNT(*) FROM skills WHERE profile_id = p.id)::text

        ELSE '✅ COHERENTE'
    END as skills_consistency
FROM profiles p
WHERE role = 'professional'
ORDER BY skills_consistency DESC, full_name;

-- ====================
-- PASO 4: VERIFICAR DUPLICADOS DE EMAIL/NOMBRE
-- ====================
SELECT
    '========== VERIFICACIÓN DUPLICADOS ==========' as seccion;

SELECT
    email,
    COUNT(*) as cantidad_perfiles,
    string_agg(full_name, ', ') as nombres,
    string_agg(id::text, ', ') as uuids,
    CASE
        WHEN COUNT(*) > 1 THEN '❌ EMAIL DUPLICADO'
        ELSE '✅ OK'
    END as status
FROM profiles
WHERE role = 'professional'
GROUP BY email
HAVING COUNT(*) > 1
UNION ALL
SELECT
    full_name as email,
    COUNT(*) as cantidad_perfiles,
    string_agg(email, ', ') as nombres,
    string_agg(id::text, ', ') as uuids,
    CASE
        WHEN COUNT(*) > 1 THEN '❌ NOMBRE DUPLICADO'
        ELSE '✅ OK'
    END as status
FROM profiles
WHERE role = 'professional'
GROUP BY full_name
HAVING COUNT(*) > 1;

-- ====================
-- PASO 5: VERIFICAR SLUGS DUPLICADOS
-- ====================
SELECT
    '========== VERIFICACIÓN SLUGS DUPLICADOS ==========' as seccion;

SELECT
    slug,
    COUNT(*) as cantidad,
    string_agg(full_name, ', ') as nombres,
    string_agg(id::text, ', ') as uuids,
    CASE
        WHEN COUNT(*) > 1 THEN '❌ SLUG DUPLICADO'
        ELSE '✅ OK'
    END as status
FROM profiles
WHERE role = 'professional' AND slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;

-- ====================
-- PASO 6: RESUMEN EJECUTIVO
-- ====================
SELECT
    '========== RESUMEN EJECUTIVO ==========' as seccion;

SELECT
    COUNT(*) FILTER (WHERE
        (full_name = 'Michelle Chang' AND id = 'b214d6b0-d516-4446-9d40-4b4bcd17678c') OR
        (full_name = 'Nicole Taylor' AND id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da') OR
        (full_name NOT IN ('Michelle Chang', 'Nicole Taylor'))
    ) as perfiles_con_uuid_correcto,

    COUNT(*) FILTER (WHERE
        (full_name = 'Michelle Chang' AND id != 'b214d6b0-d516-4446-9d40-4b4bcd17678c') OR
        (full_name = 'Nicole Taylor' AND id != 'f30db5f9-0807-4d48-aa76-de4b6d7278da')
    ) as perfiles_con_uuid_incorrecto,

    COUNT(*) FILTER (WHERE
        (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) < 12
    ) as perfiles_con_pocos_skills,

    COUNT(*) FILTER (WHERE
        (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) < 4
    ) as perfiles_con_pocas_experiencias,

    COUNT(*) as total_perfiles

FROM profiles
WHERE role = 'professional';

-- ====================
-- PASO 7: LISTAR PERFILES PROBLEMÁTICOS
-- ====================
SELECT
    '========== PERFILES QUE REQUIEREN ATENCIÓN ==========' as seccion;

SELECT
    full_name,
    email,
    id as uuid,
    slug,
    CASE
        WHEN full_name = 'Michelle Chang' AND id != 'b214d6b0-d516-4446-9d40-4b4bcd17678c' THEN '❌ UUID INCORRECTO'
        WHEN full_name = 'Nicole Taylor' AND id != 'f30db5f9-0807-4d48-aa76-de4b6d7278da' THEN '❌ UUID INCORRECTO'
        WHEN (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) < 12 THEN '⚠️ POCOS SKILLS'
        WHEN (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) < 4 THEN '⚠️ POCAS EXPERIENCIAS'
        WHEN LENGTH(headline) < 30 THEN '⚠️ HEADLINE CORTO'
        WHEN LENGTH(summary) < 200 THEN '⚠️ SUMMARY CORTO'
        ELSE '✅ OK'
    END as problema
FROM profiles
WHERE role = 'professional'
  AND (
    (full_name = 'Michelle Chang' AND id != 'b214d6b0-d516-4446-9d40-4b4bcd17678c') OR
    (full_name = 'Nicole Taylor' AND id != 'f30db5f9-0807-4d48-aa76-de4b6d7278da') OR
    (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) < 12 OR
    (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) < 4 OR
    LENGTH(headline) < 30 OR
    LENGTH(summary) < 200
  )
ORDER BY problema, full_name;
