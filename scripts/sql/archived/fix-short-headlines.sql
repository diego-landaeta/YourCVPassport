-- ============================================================================
-- EXTENDER HEADLINES CORTOS
-- Objetivo: Todos los headlines deben tener mínimo 30 caracteres
-- ============================================================================

-- Priya Sharma (14 → 66 chars)
UPDATE public.profiles
SET headline = 'Ayurvedic Medicine Practitioner and Traditional Wellness Educator'
WHERE full_name = 'Priya Sharma';

-- Janet Lee (16 → 57 chars)
UPDATE public.profiles
SET headline = 'Gerontological Social Worker Specializing in Elder Care'
WHERE full_name = 'Janet Lee';

-- Lisa Morrison (17 → 58 chars)
UPDATE public.profiles
SET headline = 'Registered Art Therapist for Adolescents and Young Adults'
WHERE full_name = 'Lisa Morrison';

-- Emily Harper (19 → 54 chars)
UPDATE public.profiles
SET headline = 'Ecopsychologist and Nature-Based Wellness Facilitator'
WHERE full_name = 'Emily Harper';

-- ====================
-- VERIFICACIÓN
-- ====================
SELECT full_name, LENGTH(headline) as chars, headline
FROM public.profiles
WHERE full_name IN ('Priya Sharma', 'Janet Lee', 'Lisa Morrison', 'Emily Harper')
ORDER BY full_name;
