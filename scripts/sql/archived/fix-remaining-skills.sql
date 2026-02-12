-- ============================================================================
-- AGREGAR SKILL FALTANTE A 3 PERFILES (11 → 12 skills)
-- Corrección adicional para alcanzar el mínimo de 12 skills
-- ============================================================================

-- ====================
-- Christopher Barnes (11 → 12 skills)
-- ====================
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Biomechanics Assessment' as name,
    'EXPERT' as level,
    10 as years_of_experience,
    'Clinical Practice' as category
FROM public.profiles
WHERE full_name = 'Christopher Barnes'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Biomechanics Assessment'
  );

-- ====================
-- Linda Zhang (11 → 12 skills)
-- ====================
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Qi Gong Therapy' as name,
    'ADVANCED' as level,
    11 as years_of_experience,
    'Traditional Medicine' as category
FROM public.profiles
WHERE full_name = 'Linda Zhang'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Qi Gong Therapy'
  );

-- ====================
-- Priya Sharma (11 → 12 skills)
-- ====================
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Marma Therapy' as name,
    'ADVANCED' as level,
    10 as years_of_experience,
    'Ayurveda' as category
FROM public.profiles
WHERE full_name = 'Priya Sharma'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Marma Therapy'
  );

-- ====================
-- VERIFICACIÓN
-- ====================
SELECT
    p.full_name,
    COUNT(*) as total_skills,
    CASE
        WHEN COUNT(*) >= 12 THEN '✅ CORRECTO'
        ELSE '⚠️ Necesita más skills'
    END as estado
FROM public.profiles p
LEFT JOIN public.skills s ON s.profile_id = p.id
WHERE p.full_name IN ('Christopher Barnes', 'Linda Zhang', 'Priya Sharma')
GROUP BY p.id, p.full_name
ORDER BY p.full_name;

-- Resultado esperado: todos con 12 skills y estado "✅ CORRECTO"
