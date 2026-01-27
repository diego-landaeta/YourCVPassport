-- ============================================
-- PASO 1: Eliminar política antigua de SKILLS
-- Copia y ejecuta SOLO esto primero
-- ============================================

DROP POLICY IF EXISTS "Public can view skills of public profiles" ON public.skills;
DROP POLICY IF EXISTS "Public can view skills of searchable profiles" ON public.skills;

-- ============================================
-- PASO 2: Crear nueva política de SKILLS
-- Copia y ejecuta esto después del Paso 1
-- ============================================

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

-- ============================================
-- PASO 3: Eliminar política antigua de LANGUAGES
-- Copia y ejecuta esto después del Paso 2
-- ============================================

DROP POLICY IF EXISTS "Public can view languages of public profiles" ON public.languages;
DROP POLICY IF EXISTS "Public can view languages of searchable profiles" ON public.languages;

-- ============================================
-- PASO 4: Crear nueva política de LANGUAGES
-- Copia y ejecuta esto después del Paso 3
-- ============================================

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

-- ============================================
-- ✅ LISTO! Ahora prueba la página /companies/search
-- ============================================
