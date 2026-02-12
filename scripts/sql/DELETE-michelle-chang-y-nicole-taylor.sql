-- ============================================================================
-- ELIMINAR COMPLETAMENTE MICHELLE CHANG Y NICOLE TAYLOR
-- ============================================================================
-- Elimina TODOS los perfiles y datos asociados de estos 2 tutores
-- Para empezar limpio desde cero
-- ============================================================================

-- ============================================================================
-- PASO 1: ELIMINAR MICHELLE CHANG (TODOS LOS PERFILES)
-- ============================================================================

-- Eliminar por email (todos los perfiles con ese email)
DELETE FROM public.portfolio_items
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'michelle.chang@iseih.edu');

DELETE FROM public.skills
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'michelle.chang@iseih.edu');

DELETE FROM public.experiences
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'michelle.chang@iseih.edu');

DELETE FROM public.education
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'michelle.chang@iseih.edu');

DELETE FROM public.languages
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'michelle.chang@iseih.edu');

DELETE FROM public.stamps
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'michelle.chang@iseih.edu');

-- NO eliminamos el perfil de la tabla profiles, solo limpiamos sus datos
-- Porque el UUID pertenece a un usuario en auth.users

-- ============================================================================
-- PASO 2: ELIMINAR NICOLE TAYLOR (TODOS LOS PERFILES)
-- ============================================================================

DELETE FROM public.portfolio_items
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'nicole.taylor@iseih.edu');

DELETE FROM public.skills
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'nicole.taylor@iseih.edu');

DELETE FROM public.experiences
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'nicole.taylor@iseih.edu');

DELETE FROM public.education
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'nicole.taylor@iseih.edu');

DELETE FROM public.languages
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'nicole.taylor@iseih.edu');

DELETE FROM public.stamps
WHERE profile_id IN (SELECT id FROM profiles WHERE email = 'nicole.taylor@iseih.edu');

-- ============================================================================
-- PASO 3: RESETEAR PERFILES A ESTADO INICIAL
-- ============================================================================

-- Resetear Michelle Chang (UUID correcto: b214d6b0-d516-4446-9d40-4b4bcd17678c)
UPDATE public.profiles
SET
    full_name = NULL,
    headline = NULL,
    summary = NULL,
    slug = NULL,
    template = 'passport',
    wizard_completed = false,
    role = 'professional',
    updated_at = NOW()
WHERE id = 'b214d6b0-d516-4446-9d40-4b4bcd17678c';

-- Resetear Nicole Taylor (UUID: f30db5f9-0807-4d48-aa76-de4b6d7278da)
UPDATE public.profiles
SET
    full_name = NULL,
    headline = NULL,
    summary = NULL,
    slug = NULL,
    template = 'passport',
    wizard_completed = false,
    role = 'professional',
    updated_at = NOW()
WHERE id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT
    '========== PERFILES LIMPIADOS ==========' as info;

-- Verificar Michelle Chang
SELECT
    id as uuid,
    email,
    full_name,
    slug,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = profiles.id) as items
FROM profiles
WHERE email = 'michelle.chang@iseih.edu'
   OR id = 'b214d6b0-d516-4446-9d40-4b4bcd17678c'
ORDER BY email;

-- Verificar Nicole Taylor
SELECT
    id as uuid,
    email,
    full_name,
    slug,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = profiles.id) as items
FROM profiles
WHERE email = 'nicole.taylor@iseih.edu'
   OR id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da'
ORDER BY email;

-- RESULTADO ESPERADO:
-- Todos los contadores deben ser 0 (exp: 0, skills: 0, items: 0)
-- full_name, headline, summary, slug deben ser NULL
-- Listos para crear desde cero
