-- Prevenir asignación automática de slug en perfiles nuevos
-- Este trigger intercepta INSERTs en la tabla profiles y fuerza slug a NULL

-- Función que se ejecuta ANTES de insertar un perfil
CREATE OR REPLACE FUNCTION public.prevent_auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el slug es un UUID (formato: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
  -- O si el slug es igual al user ID, establecerlo a NULL
  IF NEW.slug IS NOT NULL AND (
    NEW.slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR NEW.slug = NEW.id::text
  ) THEN
    NEW.slug := NULL;
    RAISE NOTICE 'Auto-slug prevented for user %. Slug set to NULL.', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger que se ejecuta ANTES de cada INSERT en profiles
DROP TRIGGER IF EXISTS prevent_auto_slug_trigger ON public.profiles;
CREATE TRIGGER prevent_auto_slug_trigger
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_auto_slug();

-- Comentario explicativo
COMMENT ON FUNCTION public.prevent_auto_slug() IS
'Previene la asignación automática de slugs UUID al crear perfiles. Los usuarios deben crear su URL personalizada en el wizard de finalización.';
