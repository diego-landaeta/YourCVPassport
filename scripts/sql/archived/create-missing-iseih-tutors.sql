-- ============================================================================
-- CREAR 10 PERFILES FALTANTES DE TUTORES ISEIH
-- Incluye: profiles, experiences, skills, certifications
-- ============================================================================

-- NOTA IMPORTANTE:
-- Este script asume que user_id puede ser NULL temporalmente
-- Si user_id es requerido, necesitarás crear usuarios en Supabase Auth primero

-- ============================================================================
-- 1. DR. REBECCA ANDERSON - NATUROPATHY
-- ============================================================================

-- Insertar perfil base
INSERT INTO public.profiles (
    full_name, headline, summary, role,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    'Rebecca Anderson',
    'Naturopathic Doctor Specializing in Evidence-Based Natural Medicine',
    'Licensed Naturopathic Doctor with 11 years of clinical experience integrating conventional diagnostics with evidence-based natural therapies. Specialized in botanical medicine and functional medicine approaches to chronic conditions. Passionate about teaching rigorous, practical naturopathic principles to healthcare professionals.',
    'professional',
    'rebecca.anderson@iseih.edu',
    '+1-206-555-0101',
    'Seattle, Washington, USA',
    'https://linkedin.com/in/rebeccaanderson-nd',
    'https://rebeccaandersonnd.com'
) ON CONFLICT (email) DO NOTHING;

-- Insertar experiencias
WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Rebecca Anderson' LIMIT 1
)
INSERT INTO public.experiences (profile_id, title, company, location, start_date, end_date, description, currently_working)
SELECT
    id,
    'Naturopathic Medicine Instructor',
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Remote',
    '2020-01',
    NULL,
    'Teaching foundational naturopathic principles and evidence-based natural therapies to healthcare professionals. Developing curriculum that bridges traditional naturopathic wisdom with modern scientific understanding.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Naturopathic Doctor - Private Practice',
    'Anderson Natural Health Clinic',
    'Seattle, WA',
    '2018-01',
    NULL,
    'Providing comprehensive naturopathic care with focus on chronic disease management, digestive health, and hormonal balance. Utilizing botanical medicine, clinical nutrition, and lifestyle counseling.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Naturopathic Physician',
    'Seattle Integrative Medicine',
    'Seattle, WA',
    '2013-06',
    '2018-12',
    'Delivered naturopathic care in collaborative integrative setting. Specialized in botanical medicine prescriptions, IV nutrient therapy, and functional medicine testing for complex chronic conditions.',
    false
FROM profile_data
UNION ALL
SELECT
    id,
    'Clinical Intern',
    'Bastyr Center for Natural Health',
    'Seattle, WA',
    '2012-01',
    '2013-05',
    'Completed over 1,200 clinical training hours providing naturopathic care under supervision. Gained extensive experience in case management, botanical medicine, and patient education.',
    false
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
    '2013-06',
    'Full licensure to practice naturopathic medicine in Washington State, including prescriptive authority for botanical medicines and minor office procedures.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Botanical Medicine Certificate',
    'Bastyr University',
    '2013-05',
    'Advanced training in botanical medicine including pharmacognosy, herbal formulation, and clinical applications of medicinal plants.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Functional Medicine Practitioner',
    'Institute for Functional Medicine',
    '2015-09',
    'Comprehensive training in functional medicine approach to chronic disease, including advanced diagnostics and personalized treatment protocols.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'IV Nutrient Therapy Certification',
    'American Association of Naturopathic Physicians',
    '2014-03',
    'Specialized training in intravenous nutrient therapy including protocol design, safety procedures, and clinical applications.'
FROM profile_data;

-- ============================================================================
-- 2. KAREN WHITE - HOLISTIC NUTRITION
-- ============================================================================

INSERT INTO public.profiles (
    user_id, full_name, headline, summary, role,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    NULL,
    'Karen White',
    'Certified Nutritionist Specializing in Functional and Holistic Nutrition',
    'Certified Nutritionist with 9 years of clinical experience in functional and holistic nutrition. Specialized in using food and targeted supplementation to address root causes of health imbalances. Expert in individualized nutritional assessment and personalized protocol development.',
    'professional',
    'karen.white@iseih.edu',
    '+1-203-555-0102',
    'Connecticut, USA',
    'https://linkedin.com/in/karenwhite-cn',
    'https://karenwhitenutrition.com'
) ON CONFLICT (email) DO NOTHING;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Karen White' LIMIT 1
)
INSERT INTO public.experiences (profile_id, title, company, location, start_date, end_date, description, currently_working)
SELECT
    id,
    'Holistic Nutrition Instructor',
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Remote',
    '2020-01',
    NULL,
    'Teaching orthomolecular nutrition and functional nutritional assessment. Educating professionals on individualized nutrition protocols and clinical application of functional testing.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Private Nutrition Consultant',
    'White Nutrition Consulting',
    'Connecticut, USA',
    '2019-01',
    NULL,
    'Providing personalized holistic nutrition consultations with focus on functional nutrition principles. Specializing in gut health, autoimmune conditions, and metabolic optimization.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Clinical Nutritionist',
    'Bridgeport Integrative Medicine Center',
    'Bridgeport, CT',
    '2015-06',
    '2018-12',
    'Delivered clinical nutrition services in integrative medicine setting. Conducted comprehensive nutritional assessments, functional testing interpretation, and personalized nutrition protocol development.',
    false
FROM profile_data
UNION ALL
SELECT
    id,
    'Nutrition Educator',
    'Community Wellness Center',
    'Connecticut',
    '2015-01',
    '2015-05',
    'Developed and facilitated nutrition education workshops for diverse community populations. Created accessible nutrition materials and group programs.',
    false
FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Karen White' LIMIT 1
)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT id, 'Functional Nutrition', 'EXPERT', 7, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Clinical Nutrition', 'EXPERT', 9, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Nutritional Assessment', 'EXPERT', 9, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Orthomolecular Nutrition', 'ADVANCED', 6, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Gut Health Protocols', 'EXPERT', 8, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'GAPS Protocol', 'ADVANCED', 5, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Supplement Protocol Design', 'EXPERT', 9, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Autoimmune Nutrition', 'ADVANCED', 7, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Metabolic Health', 'ADVANCED', 8, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Functional Testing Interpretation', 'EXPERT', 7, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Personalized Nutrition', 'EXPERT', 9, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Nutrition Education', 'ADVANCED', 9, 'Education' FROM profile_data
UNION ALL SELECT id, 'Holistic Health Coaching', 'ADVANCED', 9, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Dietary Protocol Development', 'EXPERT', 9, 'Clinical Practice' FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Karen White' LIMIT 1
)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id,
    'CERTIFICATION',
    'Certified Nutritionist (CN)',
    'American Nutrition Association',
    '2015-06',
    'Professional certification in clinical nutrition with emphasis on evidence-based nutritional therapeutics and individualized nutrition planning.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Functional Nutrition Counselor',
    'Functional Nutrition Alliance',
    '2017-03',
    'Advanced training in functional nutrition assessment, bioindividual nutrition protocols, and functional testing interpretation.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Certified GAPS Practitioner',
    'GAPS Training',
    '2018-09',
    'Specialized certification in Gut and Psychology Syndrome protocol for addressing gut-brain health connection through nutrition.'
FROM profile_data;

-- ============================================================================
-- 3. PAUL HENDERSON - HERBAL MEDICINE
-- ============================================================================

INSERT INTO public.profiles (
    user_id, full_name, headline, summary, role,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    NULL,
    'Paul Henderson',
    'Registered Herbalist and Clinical Herbal Medicine Practitioner',
    'Registered Herbalist with 10 years of experience in clinical herbal medicine. Combines botanical knowledge with clinical application of medicinal plants. Expert in safe and effective use of herbs for common conditions, herbal formulation, and sustainable wildcrafting practices.',
    'professional',
    'paul.henderson@iseih.edu',
    '+1-404-555-0103',
    'Atlanta, Georgia, USA',
    'https://linkedin.com/in/paulhenderson-rh',
    'https://hendersonherbals.com'
) ON CONFLICT (email) DO NOTHING;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Paul Henderson' LIMIT 1
)
INSERT INTO public.experiences (profile_id, title, company, location, start_date, end_date, description, currently_working)
SELECT
    id,
    'Herbal Medicine Instructor',
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Remote',
    '2019-01',
    NULL,
    'Teaching clinical herbalism and botanical medicine. Educating professionals on plant identification, herbal preparation methods, safety considerations, and clinical applications of medicinal herbs.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Independent Phytotherapy Consultant',
    'Henderson Herbal Consulting',
    'Atlanta, GA',
    '2018-01',
    NULL,
    'Providing herbal consultations and education. Developing customized herbal protocols, teaching wildcrafting workshops, and consulting on sustainable herbal product development.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Clinical Herbalist',
    'Natural Health Emporium',
    'Atlanta, GA',
    '2014-06',
    '2017-12',
    'Provided clinical herbal consultations in natural health store setting. Formulated custom herbal remedies, educated customers on safe herb use, and managed quality herbal product selection.',
    false
FROM profile_data
UNION ALL
SELECT
    id,
    'Herbalist Apprentice',
    'Georgia Botanical Medicine Clinic',
    'Atlanta, GA',
    '2013-01',
    '2014-05',
    'Completed intensive clinical herbalism apprenticeship. Learned plant identification, herbal preparation, clinical assessment, and traditional herbal formulation methods.',
    false
FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Paul Henderson' LIMIT 1
)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT id, 'Clinical Herbalism', 'EXPERT', 10, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Plant Identification', 'EXPERT', 14, 'Botanical Knowledge' FROM profile_data
UNION ALL SELECT id, 'Herbal Formulation', 'EXPERT', 10, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Botanical Medicine', 'EXPERT', 10, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Wildcrafting', 'EXPERT', 12, 'Plant Harvesting' FROM profile_data
UNION ALL SELECT id, 'Herbal Preparation Methods', 'EXPERT', 10, 'Pharmacy' FROM profile_data
UNION ALL SELECT id, 'Tincture Making', 'EXPERT', 10, 'Pharmacy' FROM profile_data
UNION ALL SELECT id, 'Herb-Drug Interactions', 'ADVANCED', 10, 'Safety' FROM profile_data
UNION ALL SELECT id, 'Medicinal Plant Chemistry', 'ADVANCED', 10, 'Botanical Knowledge' FROM profile_data
UNION ALL SELECT id, 'Sustainable Harvesting', 'EXPERT', 12, 'Environmental' FROM profile_data
UNION ALL SELECT id, 'Herbal Safety Protocols', 'EXPERT', 10, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Traditional Herbal Medicine', 'ADVANCED', 11, 'Historical Knowledge' FROM profile_data
UNION ALL SELECT id, 'Botanical Pharmacognosy', 'ADVANCED', 10, 'Scientific Knowledge' FROM profile_data
UNION ALL SELECT id, 'Herbal Education', 'ADVANCED', 7, 'Education' FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Paul Henderson' LIMIT 1
)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id,
    'CERTIFICATION',
    'Registered Herbalist (RH-AHG)',
    'American Herbalists Guild',
    '2016-05',
    'Professional registration as clinical herbalist demonstrating extensive training and clinical experience in botanical medicine practice.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Clinical Herbalist Certificate',
    'Maryland University of Integrative Health',
    '2016-03',
    'Advanced clinical herbalism training including materia medica, herbal therapeutics, case analysis, and clinical formulation strategies.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Wildcrafting Certification',
    'United Plant Savers',
    '2015-07',
    'Specialized training in sustainable wildcrafting practices, ethical plant harvesting, and medicinal plant conservation.'
FROM profile_data;

-- Continúa en siguiente mensaje debido a límite de longitud...
