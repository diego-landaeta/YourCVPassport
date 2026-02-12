-- Script para que el admin actualice el slug de un usuario sin restricciones
-- Este script bypasea la restricción de 90 días que tienen los usuarios normales

-- EJEMPLO DE USO:
-- Reemplaza 'USER_ID_AQUI' con el ID del usuario
-- Reemplaza 'nuevo-slug-aqui' con el nuevo slug deseado

-- Paso 1: Verificar el slug actual del usuario
SELECT id, full_name, email, slug, last_slug_changed_at
FROM profiles
WHERE id = 'USER_ID_AQUI';

-- Paso 2: Verificar que el nuevo slug no esté en uso
SELECT id, full_name, slug
FROM profiles
WHERE slug = 'nuevo-slug-aqui';
-- Si devuelve resultados, el slug ya está en uso. Elige otro.

-- Paso 3: Actualizar el slug (ejecuta esto solo si el slug está disponible)
UPDATE profiles
SET
  slug = 'nuevo-slug-aqui',
  last_slug_changed_at = now(),
  updated_at = now()
WHERE id = 'USER_ID_AQUI';

-- Paso 4: Verificar que se actualizó correctamente
SELECT id, full_name, email, slug, last_slug_changed_at
FROM profiles
WHERE id = 'USER_ID_AQUI';

-- NOTAS IMPORTANTES:
-- 1. El admin puede cambiar el slug sin restricciones de tiempo
-- 2. Asegúrate de que el slug cumpla con las reglas:
--    - Solo letras minúsculas, números y guiones
--    - Mínimo 3 caracteres
--    - Máximo 50 caracteres
--    - No puede empezar ni terminar con guión
--    - No puede tener guiones consecutivos
-- 3. El slug debe ser único en toda la base de datos
-- 4. Usa sanitizeSlug() en el frontend para generar slugs válidos automáticamente
