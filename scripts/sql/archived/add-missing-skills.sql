-- ============================================================================
-- AGREGAR SKILLS FALTANTES
-- Objetivo: Todos los perfiles deben tener mínimo 12 skills
-- ============================================================================

-- ====================
-- Christopher Barnes (10 → 12 skills)
-- ====================
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Physical Therapy' as name,
    'EXPERT' as level,
    10 as years_of_experience,
    'Clinical Practice' as category
FROM public.profiles
WHERE full_name = 'Christopher Barnes'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Physical Therapy'
  );

INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Movement Assessment' as name,
    'EXPERT' as level,
    10 as years_of_experience,
    'Clinical Practice' as category
FROM public.profiles
WHERE full_name = 'Christopher Barnes'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Movement Assessment'
  );

-- ====================
-- Linda Zhang (10 → 12 skills)
-- ====================
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Herbal Medicine' as name,
    'EXPERT' as level,
    11 as years_of_experience,
    'Traditional Medicine' as category
FROM public.profiles
WHERE full_name = 'Linda Zhang'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Herbal Medicine'
  );

INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Pulse Diagnosis' as name,
    'ADVANCED' as level,
    11 as years_of_experience,
    'Traditional Medicine' as category
FROM public.profiles
WHERE full_name = 'Linda Zhang'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Pulse Diagnosis'
  );

-- ====================
-- Priya Sharma (10 → 12 skills)
-- ====================
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Dosha Assessment' as name,
    'EXPERT' as level,
    13 as years_of_experience,
    'Ayurveda' as category
FROM public.profiles
WHERE full_name = 'Priya Sharma'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Dosha Assessment'
  );

INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Panchakarma' as name,
    'ADVANCED' as level,
    10 as years_of_experience,
    'Ayurveda' as category
FROM public.profiles
WHERE full_name = 'Priya Sharma'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Panchakarma'
  );

-- ====================
-- Marta Ruiz Serrano (8 → 12 skills) - SI ES TUTOR ISEIH
-- ====================
-- Nota: Verificar si Marta Ruiz Serrano debe ser tutor ISEIH
-- Si NO es tutor ISEIH, considerar cambiar su role a 'archived'

INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'HVAC Systems Design' as name,
    'EXPERT' as level,
    8 as years_of_experience,
    'Engineering' as category
FROM public.profiles
WHERE full_name = 'Marta Ruiz Serrano'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'HVAC Systems Design'
  );

INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Energy Efficiency Analysis' as name,
    'ADVANCED' as level,
    7 as years_of_experience,
    'Engineering' as category
FROM public.profiles
WHERE full_name = 'Marta Ruiz Serrano'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Energy Efficiency Analysis'
  );

INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'Thermal Load Calculations' as name,
    'EXPERT' as level,
    8 as years_of_experience,
    'Engineering' as category
FROM public.profiles
WHERE full_name = 'Marta Ruiz Serrano'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'Thermal Load Calculations'
  );

INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT
    id as profile_id,
    'RITE Compliance' as name,
    'EXPERT' as level,
    8 as years_of_experience,
    'Engineering' as category
FROM public.profiles
WHERE full_name = 'Marta Ruiz Serrano'
  AND NOT EXISTS (
    SELECT 1 FROM public.skills
    WHERE profile_id = profiles.id AND name = 'RITE Compliance'
  );

-- ====================
-- VERIFICACIÓN
-- ====================
SELECT
    p.full_name,
    COUNT(*) as total_skills,
    string_agg(s.name, ', ' ORDER BY s.name) as skills_list
FROM public.profiles p
LEFT JOIN public.skills s ON s.profile_id = p.id
WHERE p.full_name IN ('Christopher Barnes', 'Linda Zhang', 'Priya Sharma', 'Marta Ruiz Serrano')
GROUP BY p.id, p.full_name
ORDER BY p.full_name;

-- Resultado esperado: todos con >= 12 skills
