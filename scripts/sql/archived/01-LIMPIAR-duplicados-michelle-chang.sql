-- ============================================================================
-- LIMPIAR PERFILES DUPLICADOS DE MICHELLE CHANG
-- ============================================================================
-- PROBLEMA: Hay 2 perfiles de Michelle Chang en la base de datos
--   1. UUID b214d6b0... (CORRECTO) - nombre "michelle.chang", sin slug, pocos skills
--   2. UUID f30db5f9... (INCORRECTO) - nombre "Michelle Chang", slug correcto
--
-- SOLUCIÓN: Eliminar COMPLETAMENTE el perfil con UUID incorrecto
-- ============================================================================

-- PASO 1: Verificar perfiles duplicados
SELECT
    '========== PERFILES DE MICHELLE CHANG ENCONTRADOS ==========' as info;

SELECT
    id as uuid,
    full_name,
    email,
    slug,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) as skills,
    CASE
        WHEN id = 'b214d6b0-d516-4446-9d40-4b4bcd17678c' THEN '✅ UUID CORRECTO'
        WHEN id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da' THEN '❌ UUID INCORRECTO (debe ser Nicole Taylor)'
        ELSE '⚠️ UUID DESCONOCIDO'
    END as status
FROM profiles
WHERE email = 'michelle.chang@iseih.edu'
ORDER BY id;

-- PASO 2: ELIMINAR COMPLETAMENTE el perfil con UUID INCORRECTO
-- (Este UUID debe ser para Nicole Taylor, no Michelle Chang)

-- Eliminar portfolio items
DELETE FROM public.portfolio_items
WHERE profile_id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';

-- Eliminar skills
DELETE FROM public.skills
WHERE profile_id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';

-- Eliminar experiences
DELETE FROM public.experiences
WHERE profile_id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';

-- NOTA: NO eliminamos el perfil de la tabla profiles, solo sus datos
-- Porque este UUID pertenece a Nicole Taylor

-- PASO 3: Resetear nombre del perfil con UUID correcto
-- (Está en minúsculas "michelle.chang", debe ser "Michelle Chang")
UPDATE public.profiles
SET
    full_name = 'Michelle Chang',
    slug = NULL,
    updated_at = NOW()
WHERE id = 'b214d6b0-d516-4446-9d40-4b4bcd17678c';

-- PASO 4: Verificar limpieza
SELECT
    '========== VERIFICACIÓN POST-LIMPIEZA ==========' as info;

SELECT
    id as uuid,
    full_name,
    email,
    slug,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = profiles.id) as certs
FROM profiles
WHERE email = 'michelle.chang@iseih.edu'
   OR id IN ('b214d6b0-d516-4446-9d40-4b4bcd17678c', 'f30db5f9-0807-4d48-aa76-de4b6d7278da')
ORDER BY email, id;

-- RESULTADO ESPERADO:
-- Solo 1 perfil con email michelle.chang@iseih.edu
-- UUID: b214d6b0-d516-4446-9d40-4b4bcd17678c
-- full_name: Michelle Chang (capitalizado correctamente)
-- slug: NULL (listo para asignar)
-- exp: 0, skills: 0, certs: 0 (limpio para recargar con UUID correcto)
--
-- UUID f30db5f9... debe tener exp: 0, skills: 0, certs: 0
-- (listo para ser usado por Nicole Taylor)
