-- ============================================================================
-- EXTENDER HEADLINES CORTOS - 13 TUTORES ISEIH
-- ============================================================================
-- Estos 13 tutores tienen headlines < 30 caracteres
-- Se extienden a 40-60 caracteres manteniendo su especialidad
-- ============================================================================

-- 1. Amanda Rodriguez - Conscious Leadership
UPDATE public.profiles
SET
    headline = 'Conscious Leadership Coach and Personal Development Facilitator',
    updated_at = NOW()
WHERE email = 'amanda.rodriguez@iseih.edu';

-- 2. Brian Cooper - Energy Psychology
UPDATE public.profiles
SET
    headline = 'Energy Psychology Specialist in EFT and Trauma Healing',
    updated_at = NOW()
WHERE email = 'brian.cooper@iseih.edu';

-- 3. Christopher Barnes - Movement Therapies
UPDATE public.profiles
SET
    headline = 'Movement Therapist Specializing in Somatic Approaches',
    updated_at = NOW()
WHERE email = 'christopher.barnes@iseih.edu';

-- 4. Daniel Foster - Data Analysis
UPDATE public.profiles
SET
    headline = 'Data Analysis and Research Methodology Specialist',
    updated_at = NOW()
WHERE email = 'daniel.foster@iseih.edu';

-- 5. Elizabeth Morgan - End-of-Life Care
UPDATE public.profiles
SET
    headline = 'End-of-Life Care Specialist and Hospice Social Worker',
    updated_at = NOW()
WHERE email = 'elizabeth.morgan@iseih.edu';

-- 6. James Wilson - Emotional Education
UPDATE public.profiles
SET
    headline = 'Emotional Education Specialist and Youth Development Expert',
    updated_at = NOW()
WHERE email = 'james.wilson@iseih.edu';

-- 7. Marcus Williams - Drama Therapy
UPDATE public.profiles
SET
    headline = 'Registered Drama Therapist and Expressive Arts Facilitator',
    updated_at = NOW()
WHERE email = 'marcus.williams@iseih.edu';

-- 8. Margaret Sullivan - Contemplative Practices
UPDATE public.profiles
SET
    headline = 'Contemplative Practices Teacher and Meditation Facilitator',
    updated_at = NOW()
WHERE email = 'margaret.sullivan@iseih.edu';

-- 9. Michael Thompson - Addictions & Recovery
UPDATE public.profiles
SET
    headline = 'Addiction Counselor and Recovery Support Specialist',
    updated_at = NOW()
WHERE email = 'michael.thompson@iseih.edu';

-- 10. Patricia Coleman - Research Methodology
UPDATE public.profiles
SET
    headline = 'Research Methodology Expert and Qualitative Analysis Specialist',
    updated_at = NOW()
WHERE email = 'patricia.coleman@iseih.edu';

-- 11. Rachel Stevens - Holistic Nutrition
UPDATE public.profiles
SET
    headline = 'Holistic Nutritionist and Functional Wellness Consultant',
    updated_at = NOW()
WHERE email = 'rachel.stevens@iseih.edu';

-- 12. Richard Hamilton - Grief Counseling
UPDATE public.profiles
SET
    headline = 'Grief Counselor Specializing in Bereavement Support',
    updated_at = NOW()
WHERE email = 'richard.hamilton@iseih.edu';

-- 13. Thomas Rivera - Perennial Philosophies
UPDATE public.profiles
SET
    headline = 'Perennial Philosophy Scholar and Contemplative Studies Expert',
    updated_at = NOW()
WHERE email = 'thomas.rivera@iseih.edu';

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
SELECT
    full_name,
    LENGTH(headline) as chars,
    headline,
    CASE
        WHEN LENGTH(headline) >= 30 THEN '✅ OK'
        ELSE '❌ AÚN CORTO'
    END as status
FROM public.profiles
WHERE email IN (
    'amanda.rodriguez@iseih.edu',
    'brian.cooper@iseih.edu',
    'christopher.barnes@iseih.edu',
    'daniel.foster@iseih.edu',
    'elizabeth.morgan@iseih.edu',
    'james.wilson@iseih.edu',
    'marcus.williams@iseih.edu',
    'margaret.sullivan@iseih.edu',
    'michael.thompson@iseih.edu',
    'patricia.coleman@iseih.edu',
    'rachel.stevens@iseih.edu',
    'richard.hamilton@iseih.edu',
    'thomas.rivera@iseih.edu'
)
ORDER BY chars, full_name;

-- RESULTADO ESPERADO: Todos con chars >= 30 y status = '✅ OK'
