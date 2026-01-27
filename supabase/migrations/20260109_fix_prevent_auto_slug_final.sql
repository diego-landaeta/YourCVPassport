-- FIX FINAL DEFINITIVO: Prevenir SOLO slugs automáticos, permitir slugs personalizados
-- Este trigger bloquea slugs auto-generados pero permite slugs creados por el usuario en el wizard

CREATE OR REPLACE FUNCTION public.prevent_auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- SOLO prevenir slugs que son claramente AUTO-GENERADOS:
  -- 1. UUID completo: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  -- 2. user-xxxxxx: formato user- seguido SOLO de caracteres hexadecimales
  -- 3. Slug igual al ID del usuario

  -- ✅ PERMITIR slugs personalizados (ej: "juan-perez-desarrollador", "mi-cv-profesional")
  -- ❌ BLOQUEAR slugs automáticos (ej: "user-8b75703f", UUIDs)

  IF NEW.slug IS NOT NULL AND (
    -- UUID completo (solo números y letras a-f en formato UUID)
    NEW.slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR
    -- Formato user- seguido SOLO de hex (8 caracteres o más)
    -- Esto captura "user-8b75703f" pero NO "user-juan-perez"
    NEW.slug ~ '^user-[0-9a-f]{8,}$'
    OR
    -- Slug exactamente igual al ID
    NEW.slug = NEW.id::text
  ) THEN
    -- Solo bloquear slugs automáticos, establecer a NULL
    NEW.slug := NULL;
    RAISE NOTICE 'Auto-slug BLOCKED for user %. Slug was: %, set to NULL.', NEW.id, OLD.slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar trigger anterior si existe
DROP TRIGGER IF EXISTS prevent_auto_slug_trigger ON public.profiles;

-- Crear trigger que se ejecuta ANTES de INSERT Y UPDATE
CREATE TRIGGER prevent_auto_slug_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_auto_slug();

-- Verificar que el trigger fue creado correctamente
SELECT
    tgname,
    CASE t.tgtype::int & 66
        WHEN 2 THEN 'BEFORE'
        WHEN 64 THEN 'INSTEAD OF'
        ELSE 'AFTER'
    END AS timing,
    CASE
        WHEN (t.tgtype::int & 4) > 0 AND (t.tgtype::int & 16) > 0 THEN 'INSERT OR UPDATE'
        WHEN (t.tgtype::int & 4) > 0 THEN 'INSERT'
        WHEN (t.tgtype::int & 16) > 0 THEN 'UPDATE'
        ELSE 'OTHER'
    END AS events,
    tgenabled
FROM pg_trigger t
WHERE tgname = 'prevent_auto_slug_trigger'
  AND t.tgrelid = 'public.profiles'::regclass;
