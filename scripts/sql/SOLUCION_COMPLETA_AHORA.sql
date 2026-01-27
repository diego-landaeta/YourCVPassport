-- ============================================
-- EJECUTAR TODO ESTO DE UNA VEZ
-- Copia TODO y ejecuta en Supabase SQL Editor
-- ============================================

-- Paso 1: Eliminar políticas antiguas
DROP POLICY IF EXISTS "Public can view skills of public profiles" ON public.skills;
DROP POLICY IF EXISTS "Public can view skills of searchable profiles" ON public.skills;
DROP POLICY IF EXISTS "Public can view languages of public profiles" ON public.languages;
DROP POLICY IF EXISTS "Public can view languages of searchable profiles" ON public.languages;

-- Paso 2: Crear políticas nuevas para SKILLS
CREATE POLICY "Public can view skills of searchable profiles"
    ON public.skills FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = skills.profile_id
            AND profiles.full_name IS NOT NULL
            AND profiles.full_name != ''
            AND profiles.headline IS NOT NULL
            AND profiles.headline != ''
            AND profiles.role != 'admin'
        )
    );

-- Paso 3: Crear políticas nuevas para LANGUAGES
CREATE POLICY "Public can view languages of searchable profiles"
    ON public.languages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = languages.profile_id
            AND profiles.full_name IS NOT NULL
            AND profiles.full_name != ''
            AND profiles.headline IS NOT NULL
            AND profiles.headline != ''
            AND profiles.role != 'admin'
        )
    );

-- Paso 4: Verificar que funcionó
SELECT COUNT(*) as skills_emily_harper
FROM skills
WHERE profile_id IN (
  SELECT id FROM profiles WHERE full_name = 'Emily Harper'
);

-- Deberías ver 15 en el resultado
-- Si ves 0, hay un problema con las políticas
-- Si ves 15, las políticas funcionan correctamente ✅
