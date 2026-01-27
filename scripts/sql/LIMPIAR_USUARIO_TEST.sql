-- ========================================
-- LIMPIAR USUARIO DE PRUEBA
-- Ejecutar en Supabase SQL Editor
-- ========================================

-- Paso 1: Ver el usuario testx@dev.com
SELECT id, email, slug, template, created_at
FROM public.profiles
WHERE email = 'testx@dev.com';

-- Paso 2: Limpiar su slug para que pueda probar de nuevo
UPDATE public.profiles
SET slug = NULL,
    template = NULL
WHERE email = 'testx@dev.com';

-- Paso 3: Verificar que se limpió
SELECT id, email, slug, template
FROM public.profiles
WHERE email = 'testx@dev.com';

-- Debería mostrar:
-- slug: NULL ✅
-- template: NULL ✅
