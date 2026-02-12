-- ============================================================================
-- ARREGLAR WIZARD_COMPLETED, SLUG Y TEMPLATE
-- ============================================================================

-- PASO 1: Verificar estado actual de Rebecca y Carlos
SELECT
    full_name,
    wizard_completed,
    slug,
    template,
    role,
    profile_hidden
FROM public.profiles
WHERE id IN ('54701b32-af6e-4923-846d-8a04fad249a8', '0e52a1b1-018e-4dec-ac31-469f813d8dc8')
ORDER BY full_name;

-- PASO 2: Actualizar Rebecca Anderson para que APAREZCA
UPDATE public.profiles
SET
    wizard_completed = true,
    slug = 'rebecca-anderson',
    template = 'ModernProfessional',
    role = 'professional',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = '54701b32-af6e-4923-846d-8a04fad249a8';

-- PASO 3: Ocultar Carlos Saiz (quitar wizard_completed)
UPDATE public.profiles
SET
    wizard_completed = false,
    profile_hidden = true,
    updated_at = NOW()
WHERE id = '0e52a1b1-018e-4dec-ac31-469f813d8dc8';

-- PASO 4: Verificar que los cambios se aplicaron
SELECT
    full_name,
    wizard_completed,
    slug,
    template,
    role,
    profile_hidden
FROM public.profiles
WHERE id IN ('54701b32-af6e-4923-846d-8a04fad249a8', '0e52a1b1-018e-4dec-ac31-469f813d8dc8')
ORDER BY full_name;
