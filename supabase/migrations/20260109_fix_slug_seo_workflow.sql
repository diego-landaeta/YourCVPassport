-- ========================================
-- MIGRATION: Fix SEO - Slugs Only After Wizard Completion
-- Date: 2026-01-09
-- ========================================
-- PROBLEMA:
--   Los usuarios reciben slugs automáticamente al registrarse (user-xxxxx o UUID)
--   Esto crea URLs vacías que afectan el SEO negativamente
--
-- SOLUCIÓN:
--   1. Slugs deben ser NULL hasta que el usuario COMPLETE el wizard
--   2. Slugs se asignan SOLO en el paso de finalización del wizard
--   3. Ningún trigger/función debe auto-asignar slugs
-- ========================================

-- ========================================
-- PASO 1: Corregir on_profiles_created_sync_email
-- ========================================
-- Esta función sincroniza el email de auth.users
-- PERO NO DEBE TOCAR EL SLUG
CREATE OR REPLACE FUNCTION public.on_profiles_created_sync_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- SOLO sincronizar email desde auth.users
  -- ❌ NO tocar slug, dejarlo NULL hasta que el usuario complete el wizard
  IF NEW.id IS NOT NULL THEN
    UPDATE profiles
    SET email = (SELECT email FROM auth.users WHERE id = NEW.id LIMIT 1)
    -- ❌ REMOVIDO: slug = COALESCE(NEW.slug, 'user-' || substring(NEW.id::text from 1 for 8))
    -- ❌ REMOVIDO: Cualquier asignación automática de slug
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- ========================================
-- PASO 2: Trigger para prevenir slugs automáticos
-- ========================================
-- Este trigger intercepta ANTES de INSERT/UPDATE y bloquea slugs auto-generados
CREATE OR REPLACE FUNCTION public.prevent_auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- SOLO prevenir slugs que son CLARAMENTE AUTO-GENERADOS:
  -- 1. UUID completo: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  -- 2. user-xxxxxx: formato "user-" seguido SOLO de caracteres hexadecimales (8+)
  -- 3. Slug exactamente igual al ID del usuario

  -- ✅ PERMITIR slugs personalizados (ej: "juan-perez-desarrollador")
  -- ❌ BLOQUEAR slugs automáticos (ej: "user-8b75703f", UUIDs)

  IF NEW.slug IS NOT NULL AND (
    -- UUID completo
    NEW.slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR
    -- Formato user- seguido SOLO de hex (8+ caracteres)
    -- Captura "user-8b75703f" pero NO "user-juan-perez"
    NEW.slug ~ '^user-[0-9a-f]{8,}$'
    OR
    -- Slug igual al ID
    NEW.slug = NEW.id::text
  ) THEN
    -- Bloquear slug automático, establecer a NULL
    NEW.slug := NULL;
    RAISE NOTICE 'SEO Protection: Auto-slug BLOCKED for user %. Slug was auto-generated, set to NULL. User must choose URL in wizard finalization step.', NEW.id;
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

-- ========================================
-- PASO 3: Limpiar slugs auto-generados existentes
-- ========================================
-- Solo para perfiles que NO completaron el wizard (template = NULL)
UPDATE public.profiles
SET slug = NULL
WHERE (
  -- UUID format
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR
  -- user-hex format
  slug ~ '^user-[0-9a-f]{8,}$'
)
AND template IS NULL;  -- Solo usuarios que no completaron wizard

-- ========================================
-- PASO 4: Verificación
-- ========================================

-- 4.1: Verificar que los triggers están activos
DO $$
DECLARE
    trigger_count int;
    trigger_enabled text;
BEGIN
    SELECT COUNT(*), MAX(CASE t.tgenabled WHEN 'O' THEN 'ENABLED' ELSE 'DISABLED' END)
    INTO trigger_count, trigger_enabled
    FROM pg_trigger t
    WHERE tgname = 'prevent_auto_slug_trigger'
      AND t.tgrelid = 'public.profiles'::regclass;

    IF trigger_count = 0 THEN
        RAISE EXCEPTION 'ERROR: prevent_auto_slug_trigger no existe!';
    END IF;

    IF trigger_enabled != 'ENABLED' THEN
        RAISE EXCEPTION 'ERROR: prevent_auto_slug_trigger no está habilitado!';
    END IF;

    RAISE NOTICE '✅ Trigger prevent_auto_slug_trigger está ACTIVO';
END $$;

-- 4.2: Mostrar todos los triggers en profiles
SELECT
    t.tgname AS trigger_name,
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
    CASE t.tgenabled
        WHEN 'O' THEN 'ENABLED'
        WHEN 'D' THEN 'DISABLED'
        ELSE 'OTHER'
    END AS status,
    p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 4.3: Test de inserción (para verificar que NO se asigna slug)
DO $$
DECLARE
    test_id uuid := gen_random_uuid();
    result_slug text;
BEGIN
    -- Insertar perfil de prueba
    INSERT INTO public.profiles (id, full_name, email, role, plan)
    VALUES (
        test_id,
        'SEO Test User',
        'seo-test-' || substring(test_id::text from 1 for 8) || '@dev.com',
        'professional',
        'Free'
    )
    RETURNING slug INTO result_slug;

    -- Verificar resultado
    IF result_slug IS NULL THEN
        RAISE NOTICE '✅ CORRECTO: Slug es NULL para nuevo usuario (no se auto-asignó)';
    ELSE
        RAISE WARNING '❌ ERROR: Slug fue auto-asignado como "%". Revisar triggers!', result_slug;
    END IF;

    -- Limpiar
    DELETE FROM public.profiles WHERE id = test_id;
END $$;

-- 4.4: Contar perfiles afectados por la limpieza
SELECT
    COUNT(*) FILTER (WHERE slug IS NULL AND template IS NULL) AS perfiles_sin_slug_sin_wizard,
    COUNT(*) FILTER (WHERE slug IS NOT NULL AND template IS NOT NULL) AS perfiles_completos_con_slug,
    COUNT(*) FILTER (WHERE slug IS NULL AND template IS NOT NULL) AS perfiles_completos_sin_slug
FROM public.profiles;

-- ========================================
-- DOCUMENTACIÓN
-- ========================================

COMMENT ON FUNCTION public.prevent_auto_slug() IS
'SEO Protection: Previene la asignación automática de slugs en formato UUID o user-hex.
Los usuarios deben elegir su URL personalizada al completar el wizard de finalización.
Esto evita crear URLs vacías que afecten el SEO.';

COMMENT ON FUNCTION public.on_profiles_created_sync_email() IS
'Sincroniza el email desde auth.users a profiles.email después de la inserción.
NO debe tocar el campo slug - los slugs se asignan SOLO cuando el usuario completa el wizard.';

-- ========================================
-- FLUJO CORRECTO POST-MIGRACIÓN
-- ========================================
-- 1. Usuario se registra → slug = NULL
-- 2. Usuario completa pasos 1-3 del wizard → slug = NULL
-- 3. Usuario llega a finalización (paso 4):
--    - Selecciona template
--    - Crea su URL personalizada (ej: "maria-garcia-diseñadora")
--    - Sistema valida disponibilidad
--    - Se guarda template + slug personalizado
-- 4. Usuario tiene URL pública: yourcvpassport.com/cv/maria-garcia-diseñadora
-- 5. Usuario puede cambiar URL cada 3 meses desde Display Settings
-- ========================================
