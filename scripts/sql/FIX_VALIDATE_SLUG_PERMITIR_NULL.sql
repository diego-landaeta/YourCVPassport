-- ========================================
-- FIX URGENTE: validate_profile_slug debe permitir NULL sin errores
-- ========================================

CREATE OR REPLACE FUNCTION public.validate_profile_slug()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  v_slug text;
BEGIN
  -- ✅ CRÍTICO: PERMITIR slug NULL - usuarios sin slug (no completaron wizard)
  -- NO lanzar ninguna excepción, simplemente retornar
  IF NEW.slug IS NULL THEN
    NEW.slug_validation_error := NULL;
    RETURN NEW;
  END IF;

  -- Normalizar slug
  v_slug := lower(trim(NEW.slug));

  -- Si después de normalizar queda vacío, establecer a NULL
  IF v_slug = '' THEN
    NEW.slug := NULL;
    NEW.slug_validation_error := NULL;
    RETURN NEW;
  END IF;

  -- ✅ CRÍTICO: Prevenir slugs auto-generados SILENCIOSAMENTE (sin errores)
  -- En lugar de RAISE EXCEPTION, simplemente establecer a NULL
  IF v_slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
    -- Slug es UUID, establecer a NULL
    NEW.slug := NULL;
    NEW.slug_validation_error := 'auto_generated_uuid';
    RETURN NEW;
  END IF;

  IF v_slug ~ '^user-[0-9a-f]{8,}$' THEN
    -- Slug es user-hex, establecer a NULL
    NEW.slug := NULL;
    NEW.slug_validation_error := 'auto_generated_user_hex';
    RETURN NEW;
  END IF;

  -- Validar longitud (3-50 caracteres)
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

-- Verificar que la función fue actualizada
SELECT
    '✅ Función validate_profile_slug actualizada' AS status,
    'Ahora permite slug NULL sin errores' AS cambio;
