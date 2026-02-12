-- ============================================================================
-- LIMPIAR Y CREAR REBECCA ANDERSON COMPLETO
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = '54701b32-af6e-4923-846d-8a04fad249a8';
DELETE FROM public.skills WHERE profile_id = '54701b32-af6e-4923-846d-8a04fad249a8';
DELETE FROM public.experiences WHERE profile_id = '54701b32-af6e-4923-846d-8a04fad249a8';

-- PASO 2: Actualizar perfil base con role = 'company'
UPDATE public.profiles
SET
    full_name = 'Rebecca Anderson',
    headline = 'Naturopathic Doctor Specializing in Evidence-Based Natural Medicine',
    summary = 'Licensed Naturopathic Doctor with 11 years of clinical experience integrating conventional diagnostics with evidence-based natural therapies. Specialized in botanical medicine and functional medicine approaches to chronic conditions. Passionate about teaching rigorous, practical naturopathic principles to healthcare professionals.',
    role = 'company',
    plan = 'free',
    email = 'rebecca.anderson@iseih.edu',
    phone = '+1-206-555-0101',
    location = 'Seattle, Washington, USA',
    linkedin_url = 'https://linkedin.com/in/rebeccaanderson-nd',
    portfolio_url = 'https://rebeccaandersonnd.com',
    updated_at = NOW()
WHERE id = '54701b32-af6e-4923-846d-8a04fad249a8';

-- PASO 3: Insertar experiencias
INSERT INTO public.experiences (profile_id, company_name, position, start_date, end_date, is_current, employment_type, description, achievements, location, sort_order, verified, verified_at, verified_by)
VALUES
('54701b32-af6e-4923-846d-8a04fad249a8', 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Naturopathic Medicine Instructor', '2020-01-01'::date, NULL::date, true, 'PART_TIME', 'Teaching foundational naturopathic principles and evidence-based natural therapies to healthcare professionals. Developing curriculum that bridges traditional naturopathic wisdom with modern scientific understanding.', ARRAY['Teaching naturopathic medicine principles', 'Curriculum development for healthcare professionals', 'Evidence-based natural therapy education'], 'Remote', 1, true, NOW(), NULL::uuid),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Anderson Natural Health Clinic', 'Naturopathic Doctor - Private Practice', '2018-01-01'::date, NULL::date, true, 'FREELANCE', 'Providing comprehensive naturopathic care with focus on chronic disease management, digestive health, and hormonal balance. Utilizing botanical medicine, clinical nutrition, and lifestyle counseling.', ARRAY['Chronic disease management', 'Digestive health treatment', 'Hormonal balance therapy', 'Botanical medicine prescriptions', 'Clinical nutrition counseling'], 'Seattle, WA', 2, true, NOW(), NULL::uuid),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Seattle Integrative Medicine', 'Naturopathic Physician', '2013-06-01'::date, '2018-12-31'::date, false, 'FULL_TIME', 'Delivered naturopathic care in collaborative integrative setting. Specialized in botanical medicine prescriptions, IV nutrient therapy, and functional medicine testing for complex chronic conditions.', ARRAY['Botanical medicine prescriptions', 'IV nutrient therapy administration', 'Functional medicine testing', 'Chronic condition management', 'Integrative care collaboration'], 'Seattle, WA', 3, true, NOW(), NULL::uuid),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Bastyr Center for Natural Health', 'Clinical Intern', '2012-01-01'::date, '2013-05-31'::date, false, 'INTERNSHIP', 'Completed over 1,200 clinical training hours providing naturopathic care under supervision. Gained extensive experience in case management, botanical medicine, and patient education.', ARRAY['1,200+ clinical training hours', 'Patient case management', 'Botanical medicine application', 'Patient education and counseling'], 'Seattle, WA', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('54701b32-af6e-4923-846d-8a04fad249a8', 'Botanical Medicine', 'EXPERT', 11, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Functional Medicine', 'EXPERT', 8, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Clinical Nutrition', 'EXPERT', 11, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Naturopathic Diagnosis', 'EXPERT', 11, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Chronic Disease Management', 'ADVANCED', 10, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Herbal Medicine Formulation', 'EXPERT', 11, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'IV Nutrient Therapy', 'ADVANCED', 7, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Digestive Health', 'EXPERT', 10, 'Specialization'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Hormonal Balance', 'ADVANCED', 9, 'Specialization'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Lifestyle Counseling', 'ADVANCED', 11, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Patient Education', 'EXPERT', 11, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Curriculum Development', 'ADVANCED', 4, 'Education'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Evidence-Based Medicine', 'ADVANCED', 11, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Integrative Health', 'EXPERT', 10, 'Clinical Practice'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'Natural Therapeutics', 'EXPERT', 11, 'Clinical Practice');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('54701b32-af6e-4923-846d-8a04fad249a8', 'CERTIFICATION', 'Licensed Naturopathic Doctor', 'Washington State Department of Health', '2013-06-01'::date, 'Full licensure to practice naturopathic medicine in Washington State, including prescriptive authority for botanical medicines and minor office procedures.'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'CERTIFICATION', 'Botanical Medicine Certificate', 'Bastyr University', '2013-05-01'::date, 'Advanced training in botanical medicine including pharmacognosy, herbal formulation, and clinical applications of medicinal plants.'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'CERTIFICATION', 'Functional Medicine Practitioner', 'Institute for Functional Medicine', '2015-09-01'::date, 'Comprehensive training in functional medicine approach to chronic disease, including advanced diagnostics and personalized treatment protocols.'),
('54701b32-af6e-4923-846d-8a04fad249a8', 'CERTIFICATION', 'IV Nutrient Therapy Certification', 'American Association of Naturopathic Physicians', '2014-03-01'::date, 'Specialized training in intravenous nutrient therapy including protocol design, safety procedures, and clinical applications.');

-- VERIFICACIÓN FINAL
SELECT
    'Rebecca Anderson - LISTO' as status,
    p.full_name,
    p.role,
    LENGTH(p.summary) as summary_chars,
    LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '54701b32-af6e-4923-846d-8a04fad249a8';
