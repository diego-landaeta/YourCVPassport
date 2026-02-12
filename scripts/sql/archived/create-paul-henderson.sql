-- ============================================================================
-- CREAR PAUL HENDERSON - HERBAL MEDICINE
-- ============================================================================
-- UUID: 36c177f5-19f4-47c7-85c7-05507347e702
-- Email: paul.henderson@iseih.edu
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = '36c177f5-19f4-47c7-85c7-05507347e702';
DELETE FROM public.skills WHERE profile_id = '36c177f5-19f4-47c7-85c7-05507347e702';
DELETE FROM public.experiences WHERE profile_id = '36c177f5-19f4-47c7-85c7-05507347e702';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Paul Henderson',
    headline = 'Clinical Herbalist Specializing in Botanical Medicine and Plant Identification',
    summary = 'Registered Herbalist with 10 years of experience practicing and teaching herbal medicine. Combines botanical knowledge with clinical application of medicinal plants. Passionate about teaching safe and effective use of herbs for common health conditions.',
    role = 'professional',
    plan = 'free',
    email = 'paul.henderson@iseih.edu',
    phone = '+1-404-555-0103',
    location = 'Atlanta, Georgia, USA',
    linkedin_url = 'https://linkedin.com/in/paulhenderson-herbalist',
    portfolio_url = 'https://paulhendersonherbalism.com',
    wizard_completed = true,
    slug = 'paul-henderson',
    template = 'passport',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = '36c177f5-19f4-47c7-85c7-05507347e702';

-- PASO 3: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('36c177f5-19f4-47c7-85c7-05507347e702',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Herbal Medicine Instructor',
 '2019-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching foundational herbal medicine principles and clinical applications. Developing curriculum covering plant identification, herbal preparation methods, and therapeutic applications.',
 ARRAY['Clinical herbalism instruction', 'Botanical identification teaching', 'Herbal preparation techniques', 'Materia medica education'],
 'Remote', 1, true, NOW(), NULL::uuid),

('36c177f5-19f4-47c7-85c7-05507347e702',
 'Private Herbal Medicine Practice',
 'Clinical Herbalist Consultant',
 '2018-01-01'::date, NULL::date, true, 'FREELANCE',
 'Providing herbal consultations and creating personalized botanical protocols. Specializing in herbal preparations, tinctures, and therapeutic herb combinations for various health conditions.',
 ARRAY['Herbal consultations', 'Custom herbal formulations', 'Tincture preparation', 'Client herbal education', 'Botanical protocol design'],
 'Atlanta, GA', 2, true, NOW(), NULL::uuid),

('36c177f5-19f4-47c7-85c7-05507347e702',
 'Natural Products Store',
 'Clinical Herbalist',
 '2014-06-01'::date, '2017-12-31'::date, false, 'FULL_TIME',
 'Provided herbal consultations and educated customers on safe and effective use of medicinal plants. Developed custom herbal formulas and managed herbal product selection.',
 ARRAY['Clinical herbal consultations', 'Customer education', 'Custom herbal formulations', 'Product selection management', 'Herb quality assessment'],
 'Atlanta, GA', 3, true, NOW(), NULL::uuid),

('36c177f5-19f4-47c7-85c7-05507347e702',
 'Botanical Garden',
 'Herbalism Apprenticeship',
 '2013-01-01'::date, '2014-05-31'::date, false, 'INTERNSHIP',
 'Completed intensive apprenticeship in plant identification, wildcrafting, and herbal preparations. Gained hands-on experience growing, harvesting, and processing medicinal plants.',
 ARRAY['Plant identification training', 'Wildcrafting techniques', 'Herbal preparation methods', 'Medicinal plant cultivation'],
 'Atlanta, GA', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('36c177f5-19f4-47c7-85c7-05507347e702', 'Clinical Herbalism', 'EXPERT', 10, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Botanical Medicine', 'EXPERT', 10, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Plant Identification', 'EXPERT', 11, 'Specialization'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Herbal Formulation', 'EXPERT', 10, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Tincture Preparation', 'EXPERT', 10, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Wildcrafting', 'ADVANCED', 9, 'Specialization'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Materia Medica', 'EXPERT', 10, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Herbal Safety', 'EXPERT', 10, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Medicinal Plant Cultivation', 'ADVANCED', 8, 'Specialization'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Herbal Therapeutics', 'EXPERT', 10, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Botanical Nomenclature', 'ADVANCED', 11, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Herbal Preparations', 'EXPERT', 10, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Phytotherapy', 'ADVANCED', 9, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Traditional Herbalism', 'ADVANCED', 10, 'Clinical Practice'),
('36c177f5-19f4-47c7-85c7-05507347e702', 'Patient Education', 'EXPERT', 10, 'Clinical Practice');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('36c177f5-19f4-47c7-85c7-05507347e702', 'CERTIFICATION', 'Registered Herbalist', 'American Herbalists Guild', '2014-09-01'::date,
 'Professional registration as clinical herbalist with comprehensive training in botanical medicine, herbal therapeutics, and safety protocols.'),

('36c177f5-19f4-47c7-85c7-05507347e702', 'CERTIFICATION', 'Clinical Herbalist Certificate', 'Maryland University of Integrative Health', '2014-05-01'::date,
 'Master-level training in clinical herbalism including plant identification, herbal formulation, materia medica, and therapeutic applications.'),

('36c177f5-19f4-47c7-85c7-05507347e702', 'CERTIFICATION', 'Wildcrafting Certification', 'United Plant Savers', '2016-06-01'::date,
 'Advanced training in ethical wildcrafting, sustainable harvesting practices, and conservation of medicinal plants in natural habitats.'),

('36c177f5-19f4-47c7-85c7-05507347e702', 'CERTIFICATION', 'Botanical Safety Practitioner', 'American Herbal Products Association', '2017-03-01'::date,
 'Specialized certification in herbal safety, contraindications, herb-drug interactions, and quality control of botanical products.');

-- VERIFICACIÓN FINAL
SELECT
    'Paul Henderson - LISTO' as status,
    p.full_name, p.role, p.wizard_completed, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '36c177f5-19f4-47c7-85c7-05507347e702';
