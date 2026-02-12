-- ============================================================================
-- ACTUALIZAR FOTO DE PERFIL DE UN TUTOR
-- ============================================================================
-- Template para actualizar el avatar_url de un tutor ISEIH
-- ============================================================================

-- EJEMPLO DE USO:
-- Reemplaza 'TUTOR_EMAIL' con el email del tutor
-- Reemplaza 'URL_DE_LA_FOTO' con la URL completa de la foto subida

-- ============================================================================
-- OPCIÓN 1: Actualizar por EMAIL
-- ============================================================================

UPDATE public.profiles
SET
    avatar_url = 'URL_DE_LA_FOTO',
    updated_at = NOW()
WHERE email = 'TUTOR_EMAIL@iseih.edu'
  AND role = 'professional';

-- Verificar actualización
SELECT
    full_name,
    email,
    avatar_url,
    updated_at
FROM profiles
WHERE email = 'TUTOR_EMAIL@iseih.edu';

-- ============================================================================
-- OPCIÓN 2: Actualizar por UUID
-- ============================================================================

-- UPDATE public.profiles
-- SET
--     avatar_url = 'URL_DE_LA_FOTO',
--     updated_at = NOW()
-- WHERE id = 'UUID_DEL_TUTOR';

-- ============================================================================
-- EJEMPLOS CONCRETOS
-- ============================================================================

-- Michelle Chang (UUID: 7fe0c1a6-39ed-46ad-9388-116a3a0fb429)
-- UPDATE public.profiles
-- SET
--     avatar_url = 'https://tu-bucket.supabase.co/storage/v1/object/public/avatars/michelle-chang.jpg',
--     updated_at = NOW()
-- WHERE id = '7fe0c1a6-39ed-46ad-9388-116a3a0fb429';

-- Nicole Taylor (UUID: 1b90b431-de09-4b75-af6a-c94975b68746)
-- UPDATE public.profiles
-- SET
--     avatar_url = 'https://tu-bucket.supabase.co/storage/v1/object/public/avatars/nicole-taylor.jpg',
--     updated_at = NOW()
-- WHERE id = '1b90b431-de09-4b75-af6a-c94975b68746';

-- ============================================================================
-- ACTUALIZACIÓN MASIVA (múltiples tutores a la vez)
-- ============================================================================

-- UPDATE public.profiles
-- SET avatar_url =
--     CASE email
--         WHEN 'michelle.chang@iseih.edu' THEN 'https://url-foto-michelle.jpg'
--         WHEN 'nicole.taylor@iseih.edu' THEN 'https://url-foto-nicole.jpg'
--         WHEN 'otro.tutor@iseih.edu' THEN 'https://url-foto-otro.jpg'
--     END,
--     updated_at = NOW()
-- WHERE email IN (
--     'michelle.chang@iseih.edu',
--     'nicole.taylor@iseih.edu',
--     'otro.tutor@iseih.edu'
-- );
