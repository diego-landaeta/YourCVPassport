-- ========================================
-- LIMPIAR EMAILS USADOS COMO NOMBRES
-- Fecha: 2026-01-09
-- ========================================
-- PROBLEMA: Algunos usuarios tienen su email en el campo full_name
-- SOLUCIÓN: Limpiar esos campos estableciéndolos a NULL
-- ========================================

-- PASO 1: Ver cuántos perfiles tienen email como nombre
SELECT
    '═══ DIAGNÓSTICO: Perfiles con email como nombre ═══' AS info,
    COUNT(*) AS total_affected
FROM public.profiles
WHERE full_name IS NOT NULL
  AND full_name LIKE '%@%';

-- PASO 2: Mostrar los casos específicos (para verificar antes de limpiar)
SELECT
    '═══ CASOS DETECTADOS ═══' AS info,
    id,
    full_name,
    email,
    created_at
FROM public.profiles
WHERE full_name IS NOT NULL
  AND full_name LIKE '%@%'
ORDER BY created_at DESC
LIMIT 10;

-- PASO 3: LIMPIAR - Establecer full_name a NULL donde sea un email
UPDATE public.profiles
SET full_name = NULL
WHERE full_name IS NOT NULL
  AND full_name LIKE '%@%';

-- PASO 4: Verificar que se limpiaron correctamente
SELECT
    '═══ VERIFICACIÓN POST-LIMPIEZA ═══' AS info,
    COUNT(*) AS remaining_with_email
FROM public.profiles
WHERE full_name IS NOT NULL
  AND full_name LIKE '%@%';

-- PASO 5: Mostrar resumen
SELECT
    '═══ RESUMEN ═══' AS info,
    COUNT(*) AS total_profiles,
    COUNT(CASE WHEN full_name IS NULL THEN 1 END) AS profiles_without_name,
    COUNT(CASE WHEN full_name IS NOT NULL AND full_name NOT LIKE '%@%' THEN 1 END) AS profiles_with_valid_name
FROM public.profiles;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ✓ Usuarios con email como nombre: limpiados (full_name = NULL)
-- ✓ Usuarios verán el mensaje correcto en el dashboard
-- ✓ Usuarios deberán agregar su nombre real
-- ========================================
