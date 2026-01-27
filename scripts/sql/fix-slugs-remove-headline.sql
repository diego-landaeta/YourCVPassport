-- ========================================
-- FIX: Eliminar Headline de Slugs Existentes
-- Date: 2026-01-26
-- ========================================
-- PROBLEMA:
--   Algunos usuarios tienen slugs que incluyen su headline/profesión
--   Ejemplo: "emily-harper-ecopsychology-tutor"
--   Debería ser solo: "emily-harper"
--
-- SOLUCIÓN:
--   1. Identificar slugs que probablemente tienen headline (muy largos)
--   2. Regenerar slug usando solo full_name
--   3. Manejar duplicados agregando sufijo numérico (-2, -3, etc.)
-- ========================================

-- ========================================
-- PASO 1: Identificar usuarios afectados
-- ========================================
-- Mostrar todos los slugs que probablemente tienen headline
SELECT
    id,
    full_name,
    headline,
    slug,
    CHAR_LENGTH(slug) as slug_length,
    ARRAY_LENGTH(string_to_array(slug, '-'), 1) as slug_parts
FROM profiles
WHERE slug IS NOT NULL
  AND template IS NOT NULL  -- Solo perfiles completos
  AND (
    -- Slug muy largo (probablemente tiene headline)
    CHAR_LENGTH(slug) > 30
    OR
    -- Slug tiene muchos guiones (más de 2, probablemente incluye headline)
    ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
  )
ORDER BY slug_length DESC;

-- ========================================
-- PASO 2: Crear función para generar slug limpio
-- ========================================
-- Esta función replica la lógica de sanitizeSlug en TypeScript
CREATE OR REPLACE FUNCTION sanitize_slug(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    result := LOWER(text_input);

    -- Normalizar caracteres acentuados
    result := unaccent(result);

    -- Reemplazar espacios con guiones
    result := regexp_replace(result, '\s+', '-', 'g');

    -- Eliminar caracteres especiales (solo dejar letras, números y guiones)
    result := regexp_replace(result, '[^a-z0-9-]', '', 'g');

    -- Eliminar guiones consecutivos
    result := regexp_replace(result, '-+', '-', 'g');

    -- Eliminar guiones al inicio y final
    result := regexp_replace(result, '^-+|-+$', '', 'g');

    -- Limitar a 50 caracteres
    result := SUBSTRING(result, 1, 50);

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASO 3: Verificar función de sanitización
-- ========================================
-- Tests de la función
SELECT
    'José García' as input,
    sanitize_slug('José García') as output;

SELECT
    'Emily Harper - Ecopsychology Tutor' as input,
    sanitize_slug('Emily Harper') as output;

SELECT
    'María José Pérez González' as input,
    sanitize_slug('María José Pérez González') as output;

-- ========================================
-- PASO 4: Función para generar slug único con sufijo
-- ========================================
CREATE OR REPLACE FUNCTION generate_unique_slug(
    base_slug TEXT,
    exclude_user_id UUID
) RETURNS TEXT AS $$
DECLARE
    test_slug TEXT;
    counter INT := 2;
    slug_exists BOOLEAN;
BEGIN
    -- Primero intentar con el slug base
    SELECT EXISTS(
        SELECT 1 FROM profiles
        WHERE slug = base_slug
        AND id != exclude_user_id
    ) INTO slug_exists;

    IF NOT slug_exists THEN
        RETURN base_slug;
    END IF;

    -- Si ya existe, agregar sufijo numérico
    LOOP
        test_slug := base_slug || '-' || counter;

        SELECT EXISTS(
            SELECT 1 FROM profiles
            WHERE slug = test_slug
            AND id != exclude_user_id
        ) INTO slug_exists;

        IF NOT slug_exists THEN
            RETURN test_slug;
        END IF;

        counter := counter + 1;

        -- Seguridad: máximo 100 intentos
        IF counter > 100 THEN
            RETURN base_slug || '-' || gen_random_uuid()::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASO 5: Preview de cambios (DRY RUN)
-- ========================================
-- Ver qué cambios se aplicarían SIN ejecutarlos
WITH affected_users AS (
    SELECT
        id,
        full_name,
        headline,
        slug as old_slug,
        sanitize_slug(full_name) as base_new_slug
    FROM profiles
    WHERE slug IS NOT NULL
      AND template IS NOT NULL
      AND full_name IS NOT NULL
      AND (
        CHAR_LENGTH(slug) > 30
        OR ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
      )
),
new_slugs AS (
    SELECT
        id,
        full_name,
        headline,
        old_slug,
        base_new_slug,
        generate_unique_slug(base_new_slug, id) as new_slug
    FROM affected_users
)
SELECT
    full_name,
    old_slug,
    new_slug,
    CASE
        WHEN new_slug = old_slug THEN '❌ No cambio'
        WHEN new_slug LIKE base_new_slug || '-%' THEN '⚠️  Con sufijo (duplicado)'
        ELSE '✅ Limpio'
    END as status
FROM new_slugs
ORDER BY full_name;

-- ========================================
-- PASO 6: Ejecutar corrección (PRODUCTION)
-- ========================================
-- ⚠️ ADVERTENCIA: Esto modificará las URLs de los usuarios
-- ⚠️ Los usuarios afectados deberán actualizar sus links compartidos
-- ⚠️ Ejecutar solo después de revisar el preview anterior

-- Comentado por seguridad - descomentar para ejecutar
/*
DO $$
DECLARE
    affected_record RECORD;
    new_slug TEXT;
    rows_updated INT := 0;
BEGIN
    -- Recorrer todos los usuarios afectados
    FOR affected_record IN (
        SELECT
            id,
            full_name,
            slug as old_slug
        FROM profiles
        WHERE slug IS NOT NULL
          AND template IS NOT NULL
          AND full_name IS NOT NULL
          AND (
            CHAR_LENGTH(slug) > 30
            OR ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
          )
    ) LOOP
        -- Generar nuevo slug limpio
        new_slug := generate_unique_slug(
            sanitize_slug(affected_record.full_name),
            affected_record.id
        );

        -- Actualizar solo si el slug cambió
        IF new_slug != affected_record.old_slug THEN
            UPDATE profiles
            SET slug = new_slug
            WHERE id = affected_record.id;

            rows_updated := rows_updated + 1;

            RAISE NOTICE 'Updated: % → %',
                affected_record.old_slug,
                new_slug;
        END IF;
    END LOOP;

    RAISE NOTICE '✅ Total usuarios actualizados: %', rows_updated;
END $$;
*/

-- ========================================
-- PASO 7: Verificación post-ejecución
-- ========================================
-- Verificar que no hay slugs largos restantes
SELECT
    COUNT(*) as slugs_largos_restantes
FROM profiles
WHERE slug IS NOT NULL
  AND template IS NOT NULL
  AND (
    CHAR_LENGTH(slug) > 30
    OR ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
  );

-- Verificar que no hay duplicados
SELECT
    slug,
    COUNT(*) as count
FROM profiles
WHERE slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;

-- ========================================
-- PASO 8: Limpiar funciones temporales (opcional)
-- ========================================
-- Descomentar si quieres eliminar las funciones después de usarlas
/*
DROP FUNCTION IF EXISTS sanitize_slug(TEXT);
DROP FUNCTION IF EXISTS generate_unique_slug(TEXT, UUID);
*/

-- ========================================
-- NOTAS IMPORTANTES
-- ========================================
-- 1. Este script asume que tienes la extensión unaccent instalada
--    Si no la tienes: CREATE EXTENSION IF NOT EXISTS unaccent;
--
-- 2. Los usuarios afectados recibirán URLs más limpias como:
--    emily-harper-ecopsychology-tutor → emily-harper
--
-- 3. Si hay duplicados, se agregará sufijo numérico:
--    john-smith (primero)
--    john-smith-2 (segundo)
--    john-smith-3 (tercero)
--
-- 4. Las URLs antiguas dejarán de funcionar - los usuarios deberán
--    actualizar sus links compartidos en redes sociales
--
-- 5. Considera comunicar este cambio a los usuarios afectados
-- ========================================
