-- ========================================
-- FIX: Modificar validate_profile_slug para NO generar slugs automáticos
-- ========================================
-- PROBLEMA: validate_profile_slug genera slugs automáticos cuando slug es NULL o inválido
-- SOLUCIÓN: Solo validar slugs proporcionados por el usuario, permitir NULL
-- ========================================

CREATE OR REPLACE FUNCTION public.validate_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_slug text;
  v_reason text;
BEGIN
  -- ✅ PERMITIR slug NULL - usuarios sin slug (no completaron wizard)
  IF NEW.slug IS NULL THEN
    NEW.slug_validation_error := NULL;
    RETURN NEW;
  END IF;

  -- Normalizar slug
  v_slug := lower(trim(NEW.slug));
  v_reason := NULL;

  -- Validar que no esté vacío
  IF v_slug = '' THEN
    RAISE EXCEPTION 'El slug no puede estar vacío. Use NULL si el usuario no ha completado el wizard.';
  END IF;

  -- Validar longitud
  IF length(v_slug) < 3 OR length(v_slug) > 50 THEN
    RAISE EXCEPTION 'El slug debe tener entre 3 y 50 caracteres';
  END IF;

  -- Validar caracteres permitidos (solo letras minúsculas, números y guiones)
  IF v_slug !~ '^[a-z0-9-]+$' THEN
    RAISE EXCEPTION 'El slug solo puede contener letras minúsculas, números y guiones';
  END IF;

  -- Validar que no tenga guiones consecutivos
  IF v_slug ~ '--' THEN
    RAISE EXCEPTION 'El slug no puede contener guiones consecutivos';
  END IF;

  -- Validar que no comience o termine con guión
  IF v_slug ~ '^-' OR v_slug ~ '-$' THEN
    RAISE EXCEPTION 'El slug no puede comenzar o terminar con guión';
  END IF;

  -- ✅ CRÍTICO: Prevenir slugs auto-generados (UUID o user-hex)
  IF v_slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    RAISE EXCEPTION 'No se permiten slugs en formato UUID';
  END IF;

  IF v_slug ~ '^user-[0-9a-f]{8,}$' THEN
    RAISE EXCEPTION 'No se permiten slugs auto-generados (user-xxxxxxxx)';
  END IF;

  -- Validar que el slug sea único
  IF EXISTS (SELECT 1 FROM public.profiles WHERE slug = v_slug AND id IS DISTINCT FROM NEW.id) THEN
    RAISE EXCEPTION 'Este slug ya está en uso. Por favor elige otro.';
  END IF;

  -- ✅ Todo válido - asignar slug normalizado
  NEW.slug := v_slug;
  NEW.slug_validation_error := NULL;

  RETURN NEW;
END;
$function$;

-- ========================================
-- VERIFICACIÓN
-- ========================================

-- Ver la nueva definición de la función
SELECT
    '✅ Función validate_profile_slug actualizada' AS status,
    pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
WHERE p.proname = 'validate_profile_slug';

-- Ver que el trigger sigue activo
SELECT
    '✅ Trigger validate_slug_trigger' AS status,
    t.tgname AS trigger_name,
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'OTHER'
    END AS trigger_status
FROM pg_trigger t
WHERE t.tgname = 'validate_slug_trigger'
  AND t.tgrelid = 'public.profiles'::regclass;

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ✅ Slug NULL permitido (usuarios sin wizard completado)
-- ✅ Slugs personalizados validados correctamente
-- ❌ Slugs automáticos rechazados con error
-- ✅ No más generación automática de slugs
-- ========================================
