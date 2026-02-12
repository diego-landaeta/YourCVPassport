-- ============================================================================
-- CREAR KAREN WHITE - HOLISTIC NUTRITION
-- ============================================================================
-- UUID: 0bfd1ef4-c6b0-451c-8637-77b534e6e9a1
-- Email: karen.white@iseih.edu
-- ============================================================================

-- PASO 1: Eliminar datos existentes (si es re-ejecución)
DELETE FROM public.portfolio_items WHERE profile_id = '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1';
DELETE FROM public.skills WHERE profile_id = '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1';
DELETE FROM public.experiences WHERE profile_id = '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Karen White',
    headline = 'Clinical Nutritionist Specializing in Functional and Holistic Nutrition',
    summary = 'Certified Nutritionist with 9 years of experience in clinical and functional nutrition. Specialized in using food and supplements to address root causes of health imbalances. Passionate about teaching professionals how to assess individual nutritional needs and create personalized, effective protocols.',
    role = 'professional',
    plan = 'free',
    email = 'karen.white@iseih.edu',
    phone = '+1-860-555-0102',
    location = 'Connecticut, USA',
    linkedin_url = 'https://linkedin.com/in/karenwhite-cn',
    portfolio_url = 'https://karenwhitenutrition.com',
    wizard_completed = true,
    slug = 'karen-white',
    template = 'passport',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1';

-- PASO 3: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Holistic Nutrition Instructor',
 '2020-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching orthomolecular nutrition and functional nutrition principles to healthcare professionals. Developing curriculum that integrates clinical nutrition science with holistic health approaches.',
 ARRAY['Teaching functional nutrition principles', 'Orthomolecular nutrition education', 'Personalized nutrition protocol design', 'Clinical assessment techniques'],
 'Remote', 1, true, NOW(), NULL::uuid),

('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1',
 'Private Holistic Nutrition Practice',
 'Holistic Nutrition Consultant',
 '2019-01-01'::date, NULL::date, true, 'FREELANCE',
 'Providing comprehensive nutritional assessments and personalized protocols. Specializing in identifying and addressing nutritional root causes of chronic health imbalances using whole foods and targeted supplementation.',
 ARRAY['Individual nutritional assessments', 'Personalized supplement protocols', 'Functional nutrition testing interpretation', 'Root cause nutritional analysis', 'Client education and coaching'],
 'Connecticut', 2, true, NOW(), NULL::uuid),

('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1',
 'Integrative Medicine Center',
 'Clinical Nutritionist',
 '2015-06-01'::date, '2018-12-31'::date, false, 'FULL_TIME',
 'Delivered clinical nutrition services in collaborative integrative setting. Worked with physicians to create nutrition protocols for patients with chronic conditions. Specialized in functional nutrition testing and GAPS protocol implementation.',
 ARRAY['Clinical nutrition consultations', 'Functional nutrition testing', 'GAPS protocol implementation', 'Collaboration with medical team', 'Patient education programs'],
 'Connecticut', 3, true, NOW(), NULL::uuid),

('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1',
 'Hospital Dietetics Department',
 'Clinical Dietitian Internship',
 '2014-01-01'::date, '2015-05-31'::date, false, 'INTERNSHIP',
 'Completed comprehensive clinical dietetics training in hospital setting. Gained experience in medical nutrition therapy, patient assessments, and interdisciplinary healthcare collaboration.',
 ARRAY['Clinical dietetics training', 'Medical nutrition therapy', 'Patient nutritional assessments', 'Healthcare team collaboration'],
 'Connecticut', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Functional Nutrition', 'EXPERT', 9, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Clinical Nutrition Assessment', 'EXPERT', 9, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Orthomolecular Nutrition', 'ADVANCED', 7, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Nutritional Biochemistry', 'EXPERT', 9, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'GAPS Protocol', 'ADVANCED', 6, 'Specialization'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Supplement Protocol Design', 'EXPERT', 8, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Food as Medicine', 'EXPERT', 9, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Functional Testing Interpretation', 'ADVANCED', 7, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Digestive Health Nutrition', 'ADVANCED', 8, 'Specialization'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Anti-Inflammatory Nutrition', 'ADVANCED', 7, 'Specialization'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Nutritional Counseling', 'EXPERT', 9, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Personalized Nutrition', 'EXPERT', 8, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Nutrient Deficiency Analysis', 'ADVANCED', 8, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Integrative Health', 'ADVANCED', 9, 'Clinical Practice'),
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'Patient Education', 'EXPERT', 9, 'Clinical Practice');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'CERTIFICATION', 'Certified Nutritionist', 'American Nutrition Association', '2015-06-01'::date,
 'Professional certification in clinical nutrition with comprehensive training in nutritional assessment, biochemistry, and therapeutic nutrition protocols.'),

('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'CERTIFICATION', 'Functional Nutrition Counselor', 'Functional Nutrition Alliance', '2017-03-01'::date,
 'Specialized training in functional nutrition approaches, including root cause analysis, functional testing interpretation, and personalized nutrition protocols.'),

('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'CERTIFICATION', 'Certified GAPS Practitioner', 'GAPS Training', '2018-09-01'::date,
 'Comprehensive certification in Gut and Psychology Syndrome (GAPS) protocol for addressing digestive health and its connection to overall wellbeing.'),

('0bfd1ef4-c6b0-451c-8637-77b534e6e9a1', 'CERTIFICATION', 'Advanced Orthomolecular Nutrition', 'International Society for Orthomolecular Medicine', '2019-06-01'::date,
 'Advanced training in using optimal nutrition and targeted supplementation for prevention and treatment of health conditions.');

-- VERIFICACIÓN FINAL
SELECT
    'Karen White - LISTO' as status,
    p.full_name, p.role, p.wizard_completed, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1';
