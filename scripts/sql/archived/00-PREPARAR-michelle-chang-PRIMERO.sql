-- ============================================================================
-- PREPARACIÓN: EJECUTAR ANTES DE FIX-michelle-chang-uuid-CORRECTED.sql
-- ============================================================================
-- Este script soluciona el conflicto de slug duplicado
-- PROBLEMA: El slug 'michelle-chang' ya está en uso por otro perfil
-- SOLUCIÓN: Limpiar/resetear slugs de Michelle Chang en todos los perfiles
-- ============================================================================

-- PASO 1: Identificar todos los perfiles de Michelle Chang
SELECT
    '========== PERFILES DE MICHELLE CHANG ENCONTRADOS ==========' as info;

SELECT
    id,
    full_name,
    email,
    slug,
    CASE
        WHEN id = 'b214d6b0-d516-4446-9d40-4b4bcd17678c' THEN '✅ UUID CORRECTO'
        ELSE '❌ UUID INCORRECTO'
    END as uuid_status
FROM profiles
WHERE full_name LIKE '%Michelle%Chang%' OR email LIKE '%michelle.chang%';

-- PASO 2: Limpiar slug de todos los perfiles de Michelle Chang
-- (Para evitar conflicto al asignar el slug correcto después)
UPDATE profiles
SET
    slug = NULL,
    updated_at = NOW()
WHERE full_name LIKE '%Michelle%Chang%' OR email LIKE '%michelle.chang%';

-- PASO 3: Verificar que el slug 'michelle-chang' quedó liberado
SELECT
    '========== VERIFICACIÓN: SLUG LIBERADO ==========' as info;

SELECT
    id,
    full_name,
    email,
    slug,
    CASE
        WHEN slug = 'michelle-chang' THEN '❌ AÚN EN USO'
        WHEN slug IS NULL THEN '✅ SLUG LIBERADO'
        ELSE '⚠️ OTRO SLUG: ' || slug
    END as slug_status
FROM profiles
WHERE full_name LIKE '%Michelle%Chang%' OR email LIKE '%michelle.chang%';

-- PASO 4: Información sobre qué hacer después
SELECT
    '========== SIGUIENTE PASO ==========' as info,
    'Ahora ejecuta: FIX-michelle-chang-uuid-CORRECTED.sql' as accion;

-- RESULTADO ESPERADO:
-- Todos los perfiles de Michelle Chang tendrán slug = NULL
-- El slug 'michelle-chang' estará disponible
-- El script FIX-michelle-chang-uuid-CORRECTED.sql podrá ejecutarse sin error
