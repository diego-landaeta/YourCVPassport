-- Clean UUID slugs from incomplete profiles
-- Este script limpia los slugs UUID que fueron asignados automáticamente
-- a usuarios que no han completado el wizard de perfil

-- IMPORTANTE: Solo elimina slugs que son UUIDs (formato 8-4-4-4-12)
-- NO toca slugs personalizados que los usuarios hayan creado

-- Actualizar profiles con slug UUID a NULL si no tienen template
-- (template = NULL indica que no completaron el wizard)
UPDATE public.profiles
SET slug = NULL
WHERE
  -- Solo slugs que son UUIDs (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  -- Y no tienen template (no completaron wizard)
  AND template IS NULL;

-- Log del resultado
DO $$
DECLARE
  affected_rows INT;
BEGIN
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Limpiados % slugs UUID de perfiles incompletos', affected_rows;
END $$;
