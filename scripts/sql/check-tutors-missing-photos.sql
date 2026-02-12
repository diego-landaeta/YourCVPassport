-- ============================================================================
-- VERIFICAR TUTORES SIN FOTO DE PERFIL
-- ============================================================================
-- Identifica tutores ISEIH que no tienen avatar_url configurado
-- ============================================================================

-- ============================================================================
-- RESUMEN: Conteo de tutores con y sin foto
-- ============================================================================

SELECT
    '========== RESUMEN FOTOS DE PERFIL ==========' as info;

SELECT
    COUNT(*) FILTER (WHERE avatar_url IS NOT NULL AND avatar_url != '') as con_foto,
    COUNT(*) FILTER (WHERE avatar_url IS NULL OR avatar_url = '') as sin_foto,
    COUNT(*) as total_tutores
FROM profiles
WHERE role = 'professional'
  AND email LIKE '%@iseih.edu';

-- ============================================================================
-- TUTORES SIN FOTO (REQUIEREN ATENCIÓN)
-- ============================================================================

SELECT
    '========== TUTORES SIN FOTO DE PERFIL ==========' as info;

SELECT
    full_name,
    email,
    slug,
    headline,
    CASE
        WHEN avatar_url IS NULL THEN '❌ NULL'
        WHEN avatar_url = '' THEN '❌ VACÍO'
        ELSE avatar_url
    END as avatar_status
FROM profiles
WHERE role = 'professional'
  AND email LIKE '%@iseih.edu'
  AND (avatar_url IS NULL OR avatar_url = '')
ORDER BY full_name;

-- ============================================================================
-- TUTORES CON FOTO (VERIFICACIÓN)
-- ============================================================================

SELECT
    '========== TUTORES CON FOTO DE PERFIL ==========' as info;

SELECT
    full_name,
    email,
    slug,
    LEFT(avatar_url, 50) || '...' as avatar_preview
FROM profiles
WHERE role = 'professional'
  AND email LIKE '%@iseih.edu'
  AND avatar_url IS NOT NULL
  AND avatar_url != ''
ORDER BY full_name;

-- ============================================================================
-- LISTADO COMPLETO: Todos los tutores con estado de foto
-- ============================================================================

SELECT
    '========== LISTADO COMPLETO DE TUTORES ==========' as info;

SELECT
    full_name,
    email,
    slug,
    headline,
    CASE
        WHEN avatar_url IS NOT NULL AND avatar_url != '' THEN '✅ CON FOTO'
        ELSE '❌ SIN FOTO'
    END as estado_foto,
    CASE
        WHEN avatar_url IS NOT NULL AND avatar_url != ''
        THEN LEFT(avatar_url, 40) || '...'
        ELSE 'PENDIENTE'
    END as avatar_info
FROM profiles
WHERE role = 'professional'
  AND email LIKE '%@iseih.edu'
ORDER BY
    CASE
        WHEN avatar_url IS NULL OR avatar_url = '' THEN 0
        ELSE 1
    END,
    full_name;

-- ============================================================================
-- EXPORTAR LISTA PARA UPLOAD (formato CSV)
-- ============================================================================

SELECT
    '========== FORMATO PARA CARGAR FOTOS ==========' as info;

-- Lista para copiar y pegar
SELECT
    full_name as nombre,
    email,
    slug,
    'PENDIENTE' as foto_subida
FROM profiles
WHERE role = 'professional'
  AND email LIKE '%@iseih.edu'
  AND (avatar_url IS NULL OR avatar_url = '')
ORDER BY full_name;
