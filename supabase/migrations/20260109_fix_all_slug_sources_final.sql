-- ========================================
-- MIGRATION: Fix ALL sources of automatic slug generation
-- Date: 2026-01-09
-- ========================================
-- This migration:
-- 1. Updates on_profiles_created_sync_email to NOT assign slugs
-- 2. Ensures prevent_auto_slug_trigger exists and is enabled
-- 3. Cleans existing auto-generated slugs
-- ========================================

-- STEP 1: Fix the on_profiles_created_sync_email function
-- This function was setting slug = 'user-' || substring(NEW.id::text from 1 for 8)
CREATE OR REPLACE FUNCTION public.on_profiles_created_sync_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Only sync email from auth.users, DO NOT touch slug
  IF NEW.id IS NOT NULL THEN
    UPDATE profiles
    SET email = (SELECT email FROM auth.users WHERE id = NEW.id LIMIT 1)
    -- ❌ REMOVED: slug assignment
    -- Previous code: slug = COALESCE(NEW.slug, 'user-' || substring(NEW.id::text from 1 for 8))
    -- This was causing automatic slug generation on every new user registration
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$;

-- STEP 2: Ensure the prevent_auto_slug function exists with correct logic
CREATE OR REPLACE FUNCTION public.prevent_auto_slug()
RETURNS TRIGGER AS $$
BEGIN
  -- ONLY prevent slugs that are clearly AUTO-GENERATED:
  -- 1. Full UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  -- 2. user-xxxxxx: format "user-" followed ONLY by hexadecimal characters (8+)
  -- 3. Slug exactly equal to user ID

  -- ✅ ALLOW custom slugs (e.g., "juan-perez-desarrollador", "mi-cv-profesional")
  -- ❌ BLOCK automatic slugs (e.g., "user-8b75703f", UUIDs)

  IF NEW.slug IS NOT NULL AND (
    -- Full UUID (only numbers and letters a-f in UUID format)
    NEW.slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR
    -- Format user- followed ONLY by hex (8 or more characters)
    -- This captures "user-8b75703f" but NOT "user-juan-perez"
    NEW.slug ~ '^user-[0-9a-f]{8,}$'
    OR
    -- Slug exactly equal to ID
    NEW.slug = NEW.id::text
  ) THEN
    -- Only block automatic slugs, set to NULL
    NEW.slug := NULL;
    RAISE NOTICE 'Auto-slug BLOCKED for user %. Slug was: %, set to NULL.', NEW.id, COALESCE(OLD.slug, NEW.slug);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Ensure the trigger exists and is enabled
DROP TRIGGER IF EXISTS prevent_auto_slug_trigger ON public.profiles;

CREATE TRIGGER prevent_auto_slug_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_auto_slug();

-- STEP 4: Clean existing auto-generated slugs from incomplete profiles
UPDATE public.profiles
SET slug = NULL
WHERE (
  -- UUID format
  slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  OR
  -- user-hex format
  slug ~ '^user-[0-9a-f]{8,}$'
)
AND template IS NULL;  -- Only users who haven't completed wizard

-- STEP 5: Verification - Show all triggers on profiles table
SELECT
    'Trigger Verification:' AS check_type,
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
    END AS status
FROM pg_trigger t
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;
