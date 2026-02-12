-- ========================================
-- FIX: Actualizar Slugs de Usuarios USA
-- Date: 2026-01-26
-- ========================================
-- Actualiza los slugs de usuarios de USA que tienen headline incluido
-- para que solo contengan nombre y apellido
-- ========================================

-- ========================================
-- PASO 1: Instalar extensión unaccent (si no existe)
-- ========================================
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ========================================
-- PASO 2: Identificar usuarios de USA con slugs largos
-- ========================================
SELECT
    id,
    full_name,
    headline,
    slug,
    location,
    country_code,
    CHAR_LENGTH(slug) as slug_length,
    ARRAY_LENGTH(string_to_array(slug, '-'), 1) as slug_parts
FROM profiles
WHERE slug IS NOT NULL
  AND template IS NOT NULL
  AND (country_code = 'US' OR location LIKE '%,%')  -- USA users
  AND (
    -- Slug muy largo (probablemente tiene headline)
    CHAR_LENGTH(slug) > 30
    OR
    -- Slug tiene muchas partes (más de 3, probablemente incluye headline)
    ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
  )
ORDER BY full_name;

-- ========================================
-- PASO 3: Funciones de sanitización
-- ========================================

-- Función para limpiar texto y crear slug
CREATE OR REPLACE FUNCTION sanitize_slug(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
    result TEXT;
BEGIN
    result := LOWER(text_input);
    result := unaccent(result);
    result := regexp_replace(result, '\s+', '-', 'g');
    result := regexp_replace(result, '[^a-z0-9-]', '', 'g');
    result := regexp_replace(result, '-+', '-', 'g');
    result := regexp_replace(result, '^-+|-+$', '', 'g');
    result := SUBSTRING(result, 1, 50);
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Función para generar slug único con sufijo
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

        IF counter > 100 THEN
            RETURN base_slug || '-' || gen_random_uuid()::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PASO 4: Preview de cambios para usuarios de USA
-- ========================================
WITH usa_users AS (
    SELECT
        id,
        full_name,
        headline,
        slug as old_slug,
        location,
        sanitize_slug(full_name) as base_new_slug
    FROM profiles
    WHERE slug IS NOT NULL
      AND template IS NOT NULL
      AND full_name IS NOT NULL
      AND (country_code = 'US' OR location LIKE '%,%')
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
        location,
        base_new_slug,
        generate_unique_slug(base_new_slug, id) as new_slug
    FROM usa_users
)
SELECT
    full_name,
    location,
    old_slug,
    new_slug,
    CASE
        WHEN new_slug = old_slug THEN '❌ Sin cambio'
        WHEN new_slug LIKE base_new_slug || '-%' THEN '⚠️  Sufijo (duplicado)'
        ELSE '✅ Actualizado'
    END as status
FROM new_slugs
ORDER BY full_name;

-- ========================================
-- PASO 5: Aplicar corrección SOLO a usuarios de USA
-- ========================================
-- ⚠️ ADVERTENCIA: Esto modificará las URLs de los usuarios
-- Descomentar para ejecutar

DO $$
DECLARE
    affected_record RECORD;
    new_slug TEXT;
    rows_updated INT := 0;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Iniciando actualización de slugs para usuarios de USA';
    RAISE NOTICE '========================================';

    -- Recorrer usuarios de USA con slugs largos
    FOR affected_record IN (
        SELECT
            id,
            full_name,
            slug as old_slug,
            location
        FROM profiles
        WHERE slug IS NOT NULL
          AND template IS NOT NULL
          AND full_name IS NOT NULL
          AND (country_code = 'US' OR location LIKE '%,%')
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

            RAISE NOTICE '✅ %, %: % → %',
                affected_record.full_name,
                affected_record.location,
                affected_record.old_slug,
                new_slug;
        ELSE
            RAISE NOTICE '⏭️  % ya tiene slug correcto: %',
                affected_record.full_name,
                affected_record.old_slug;
        END IF;
    END LOOP;

    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Total usuarios USA actualizados: %', rows_updated;
    RAISE NOTICE '========================================';
END $$;

-- ========================================
-- PASO 6: Verificación de usuarios de USA
-- ========================================

-- Verificar que no quedan slugs largos en usuarios de USA
SELECT
    COUNT(*) as usa_users_con_slugs_largos
FROM profiles
WHERE slug IS NOT NULL
  AND template IS NOT NULL
  AND (country_code = 'US' OR location LIKE '%,%')
  AND (
    CHAR_LENGTH(slug) > 30
    OR ARRAY_LENGTH(string_to_array(slug, '-'), 1) > 3
  );

-- Listar todos los usuarios de USA y sus slugs actualizados
SELECT
    full_name,
    slug,
    location,
    CHAR_LENGTH(slug) as slug_length
FROM profiles
WHERE (country_code = 'US' OR location LIKE '%,%')
  AND slug IS NOT NULL
  AND template IS NOT NULL
ORDER BY full_name;

-- ========================================
-- PASO 7: Verificar duplicados globales
-- ========================================
SELECT
    slug,
    COUNT(*) as count,
    string_agg(full_name, ', ') as users
FROM profiles
WHERE slug IS NOT NULL
GROUP BY slug
HAVING COUNT(*) > 1;

-- ========================================
-- Ejemplos de cambios esperados:
-- ========================================
-- emily-harper-ecopsychology-and-nature → emily-harper
-- david-chen-mindful-eating-tutor → david-chen
-- rachel-stevens-holistic-nutrition → rachel-stevens
-- jennifer-martinez-systemic-family → jennifer-martinez
-- michael-thompson-certified-addiction → michael-thompson
-- lisa-morrison-registered-art-therapist → lisa-morrison
-- marcus-williams-therapeutic-theater → marcus-williams
-- robert-green-sustainable-living → robert-green
-- sarah-bennett-alternative-pedagogies → sarah-bennett
-- james-wilson-social-emotional-learning → james-wilson
-- ========================================
