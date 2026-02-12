-- ============================================================================
-- TUTOR #1: DR. REBECCA ANDERSON - NATUROPATHY
-- ============================================================================

-- Insertar perfil base
INSERT INTO public.profiles (
    id,
    full_name, headline, summary, role, plan,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    '54701b32-af6e-4923-846d-8a04fad249a8',
    'Rebecca Anderson',
    'Naturopathic Doctor Specializing in Evidence-Based Natural Medicine',
    'Licensed Naturopathic Doctor with 11 years of clinical experience integrating conventional diagnostics with evidence-based natural therapies. Specialized in botanical medicine and functional medicine approaches to chronic conditions. Passionate about teaching rigorous, practical naturopathic principles to healthcare professionals.',
    'company',
    'free',
    'rebecca.anderson@iseih.edu',
    '+1-206-555-0101',
    'Seattle, Washington, USA',
    'https://linkedin.com/in/rebeccaanderson-nd',
    'https://rebeccaandersonnd.com'
) ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    headline = EXCLUDED.headline,
    summary = EXCLUDED.summary,
    updated_at = NOW();

-- Insertar experiencias
WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Rebecca Anderson' LIMIT 1
)
INSERT INTO public.experiences (profile_id, company_name, position, start_date, end_date, is_current, employment_type, description, achievements, location, sort_order, verified, verified_at, verified_by)
SELECT
    id,
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Naturopathic Medicine Instructor',
    '2020-01-01'::date,
    NULL::date,
    true,
    'PART_TIME',
    'Teaching foundational naturopathic principles and evidence-based natural therapies to healthcare professionals. Developing curriculum that bridges traditional naturopathic wisdom with modern scientific understanding.',
    ARRAY['Teaching naturopathic medicine principles', 'Curriculum development for healthcare professionals', 'Evidence-based natural therapy education'],
    'Remote',
    1,
    true,
    NOW(),
    NULL::uuid
FROM profile_data
UNION ALL
SELECT
    id,
    'Anderson Natural Health Clinic',
    'Naturopathic Doctor - Private Practice',
    '2018-01-01'::date,
    NULL::date,
    true,
    'FREELANCE',
    'Providing comprehensive naturopathic care with focus on chronic disease management, digestive health, and hormonal balance. Utilizing botanical medicine, clinical nutrition, and lifestyle counseling.',
    ARRAY['Chronic disease management', 'Digestive health treatment', 'Hormonal balance therapy', 'Botanical medicine prescriptions', 'Clinical nutrition counseling'],
    'Seattle, WA',
    2,
    true,
    NOW(),
    NULL::uuid
FROM profile_data
UNION ALL
SELECT
    id,
    'Seattle Integrative Medicine',
    'Naturopathic Physician',
    '2013-06-01'::date,
    '2018-12-31'::date,
    false,
    'FULL_TIME',
    'Delivered naturopathic care in collaborative integrative setting. Specialized in botanical medicine prescriptions, IV nutrient therapy, and functional medicine testing for complex chronic conditions.',
    ARRAY['Botanical medicine prescriptions', 'IV nutrient therapy administration', 'Functional medicine testing', 'Chronic condition management', 'Integrative care collaboration'],
    'Seattle, WA',
    3,
    true,
    NOW(),
    NULL::uuid
FROM profile_data
UNION ALL
SELECT
    id,
    'Bastyr Center for Natural Health',
    'Clinical Intern',
    '2012-01-01'::date,
    '2013-05-31'::date,
    false,
    'INTERNSHIP',
    'Completed over 1,200 clinical training hours providing naturopathic care under supervision. Gained extensive experience in case management, botanical medicine, and patient education.',
    ARRAY['1,200+ clinical training hours', 'Patient case management', 'Botanical medicine application', 'Patient education and counseling'],
    'Seattle, WA',
    4,
    true,
    NOW(),
    NULL::uuid
FROM profile_data;

-- Insertar skills
WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Rebecca Anderson' LIMIT 1
)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT id, 'Botanical Medicine', 'EXPERT', 11, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Functional Medicine', 'EXPERT', 8, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Clinical Nutrition', 'EXPERT', 11, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Naturopathic Diagnosis', 'EXPERT', 11, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Chronic Disease Management', 'ADVANCED', 10, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Herbal Medicine Formulation', 'EXPERT', 11, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'IV Nutrient Therapy', 'ADVANCED', 7, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Digestive Health', 'EXPERT', 10, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Hormonal Balance', 'ADVANCED', 9, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Lifestyle Counseling', 'ADVANCED', 11, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Patient Education', 'EXPERT', 11, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Curriculum Development', 'ADVANCED', 4, 'Education' FROM profile_data
UNION ALL SELECT id, 'Evidence-Based Medicine', 'ADVANCED', 11, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Integrative Health', 'EXPERT', 10, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Natural Therapeutics', 'EXPERT', 11, 'Clinical Practice' FROM profile_data;

-- Insertar certificaciones
WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Rebecca Anderson' LIMIT 1
)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id,
    'CERTIFICATION',
    'Licensed Naturopathic Doctor',
    'Washington State Department of Health',
    '2013-06-01'::date,
    'Full licensure to practice naturopathic medicine in Washington State, including prescriptive authority for botanical medicines and minor office procedures.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Botanical Medicine Certificate',
    'Bastyr University',
    '2013-05-01'::date,
    'Advanced training in botanical medicine including pharmacognosy, herbal formulation, and clinical applications of medicinal plants.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Functional Medicine Practitioner',
    'Institute for Functional Medicine',
    '2015-09-01'::date,
    'Comprehensive training in functional medicine approach to chronic disease, including advanced diagnostics and personalized treatment protocols.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'IV Nutrient Therapy Certification',
    'American Association of Naturopathic Physicians',
    '2014-03-01'::date,
    'Specialized training in intravenous nutrient therapy including protocol design, safety procedures, and clinical applications.'
FROM profile_data;

-- Verificación
SELECT
    'Rebecca Anderson - Verificación' as check_name,
    p.full_name,
    LENGTH(p.summary) as summary_chars,
    LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs,
    CASE
        WHEN LENGTH(p.summary) > 200 AND LENGTH(p.summary) <= 800
             AND LENGTH(p.headline) >= 30
             AND (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) >= 3
             AND (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) >= 12
             AND (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') >= 3
        THEN '✅ EXCELENTE'
        ELSE '⚠️ REVISAR'
    END as calidad
FROM public.profiles p
WHERE p.full_name = 'Rebecca Anderson';

-- Resultado esperado:
-- full_name: Rebecca Anderson
-- summary_chars: 343
-- headline_chars: 69
-- experiencias: 4
-- skills: 15
-- certs: 4
-- calidad: ✅ EXCELENTE
