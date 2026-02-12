-- ========================================
-- VERIFICACIÓN: Comprobar que el fix se aplicó correctamente
-- ========================================

-- 1. Verificar que el trigger problemático NO existe
SELECT
    '1️⃣ Verificar trigger on_profiles_created_sync_email' AS test,
    CASE
        WHEN COUNT(*) = 0 THEN '✅ ELIMINADO (correcto)'
        ELSE '❌ AÚN EXISTE (problema)'
    END AS resultado
FROM pg_trigger
WHERE tgname = 'on_profiles_created_sync_email';

-- 2. Verificar que el trigger de protección SÍ existe
SELECT
    '2️⃣ Verificar trigger prevent_auto_slug_trigger' AS test,
    CASE
        WHEN COUNT(*) > 0 THEN '✅ EXISTE (correcto)'
        ELSE '❌ NO EXISTE (problema)'
    END AS resultado
FROM pg_trigger
WHERE tgname = 'prevent_auto_slug_trigger';

-- 3. Ver TODOS los triggers en la tabla profiles
SELECT
    '3️⃣ TODOS LOS TRIGGERS en profiles' AS seccion,
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
        WHEN (t.tgtype::int & 8) > 0 THEN 'DELETE'
        ELSE 'OTHER'
    END AS events,
    CASE t.tgenabled
        WHEN 'O' THEN '✅ ENABLED'
        WHEN 'D' THEN '❌ DISABLED'
        ELSE 'OTHER'
    END AS status
FROM pg_trigger t
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 4. Contar perfiles con slugs automáticos (UUID o user-hex)
SELECT
    '4️⃣ Perfiles con slugs automáticos (deben ser 0)' AS test,
    COUNT(*) AS count,
    CASE
        WHEN COUNT(*) = 0 THEN '✅ NINGUNO (correcto)'
        ELSE '❌ AÚN HAY SLUGS AUTO-GENERADOS'
    END AS resultado
FROM public.profiles
WHERE (
    slug ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    OR slug ~ '^user-[0-9a-f]{8,}$'
)
AND template IS NULL;

-- 5. Contar perfiles SIN slug (deben completar wizard)
SELECT
    '5️⃣ Perfiles sin slug (deben completar wizard)' AS test,
    COUNT(*) AS count
FROM public.profiles
WHERE slug IS NULL;

-- 6. Contar perfiles con slugs personalizados
SELECT
    '6️⃣ Perfiles con slugs personalizados válidos' AS test,
    COUNT(*) AS count
FROM public.profiles
WHERE slug IS NOT NULL
  AND slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND slug !~ '^user-[0-9a-f]{8,}$';

-- 7. Mostrar algunos ejemplos de perfiles sin slug
SELECT
    '7️⃣ Ejemplos de perfiles sin slug (primeros 5)' AS seccion,
    id,
    full_name,
    email,
    slug,
    template,
    created_at
FROM public.profiles
WHERE slug IS NULL
ORDER BY created_at DESC
LIMIT 5;

-- 8. Mostrar algunos ejemplos de perfiles con slug personalizado
SELECT
    '8️⃣ Ejemplos de perfiles con slug personalizado (primeros 5)' AS seccion,
    id,
    full_name,
    slug,
    template,
    created_at
FROM public.profiles
WHERE slug IS NOT NULL
  AND slug !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
  AND slug !~ '^user-[0-9a-f]{8,}$'
ORDER BY created_at DESC
LIMIT 5;
