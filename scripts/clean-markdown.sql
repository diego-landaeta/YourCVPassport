-- Script para limpiar markdown (**) de experiencias existentes
-- Ejecutar en Supabase SQL Editor

-- Paso 1: Limpiar descripciones
UPDATE experiences
SET description = REPLACE(description, '**', '')
WHERE description LIKE '%**%';

-- Paso 2: Limpiar achievements (array de strings)
-- PostgreSQL requiere una función para transformar arrays
UPDATE experiences
SET achievements = (
  SELECT array_agg(REPLACE(elem, '**', ''))
  FROM unnest(experiences.achievements) AS elem
)
WHERE achievements IS NOT NULL
  AND array_length(achievements, 1) > 0
  AND EXISTS (
    SELECT 1
    FROM unnest(achievements) AS elem
    WHERE elem LIKE '%**%'
  );

-- Paso 3: Verificar cambios
SELECT
  id,
  position,
  company_name,
  description,
  achievements
FROM experiences
ORDER BY updated_at DESC
LIMIT 10;
