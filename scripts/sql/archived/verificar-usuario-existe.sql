-- ============================================================================
-- VERIFICAR QUE USUARIO EXISTE EN AUTH.USERS
-- ============================================================================
-- Ejecuta esto ANTES de crear un perfil para evitar errores de FK constraint
-- Reemplaza el UUID con el del usuario que quieres verificar
-- ============================================================================

-- Verificar si existe en auth.users
SELECT
    'Usuario en auth.users' as tabla,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users
WHERE id = '[UUID-AQUI]';

-- Verificar si existe perfil
SELECT
    'Perfil en public.profiles' as tabla,
    id,
    full_name,
    email,
    role,
    wizard_completed,
    slug,
    template
FROM public.profiles
WHERE id = '[UUID-AQUI]';

-- ============================================================================
-- INTERPRETACIÓN DE RESULTADOS:
-- ============================================================================
-- Si auth.users retorna 0 filas:
--   ❌ El usuario NO existe. Necesitas crearlo primero o usar otro UUID.
--
-- Si auth.users retorna 1 fila:
--   ✅ El usuario existe. Puedes proceder a crear/actualizar el perfil.
--
-- Si public.profiles retorna 0 filas:
--   ⚠️  El perfil NO existe. El UPDATE fallará, necesitas hacer INSERT.
--   O mejor: usar ON CONFLICT en el UPDATE, o simplemente el perfil se creará automáticamente.
--
-- Si public.profiles retorna 1 fila:
--   ✅ El perfil existe. El UPDATE funcionará correctamente.
-- ============================================================================
