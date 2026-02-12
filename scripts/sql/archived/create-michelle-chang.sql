-- ============================================================================
-- CREAR MICHELLE CHANG - REIKI AND ENERGY WORK
-- ============================================================================
-- UUID: f30db5f9-0807-4d48-aa76-de4b6d7278da
-- Email: michelle.chang@iseih.edu
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';
DELETE FROM public.skills WHERE profile_id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';
DELETE FROM public.experiences WHERE profile_id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Michelle Chang',
    headline = 'Reiki Master Teacher Specializing in Energy Healing and Holistic Wellness',
    summary = 'Usui Reiki Master Teacher with 10 years of experience practicing and teaching energy healing modalities. Certified in Reiki and Healing Touch with extensive client practice. Passionate about demystifying energy work and teaching concrete techniques with realistic expectations for complementary care.',
    role = 'professional',
    plan = 'free',
    email = 'michelle.chang@iseih.edu',
    phone = '+1-602-555-0107',
    location = 'Phoenix, Arizona, USA',
    linkedin_url = 'https://linkedin.com/in/michellechang-reiki',
    portfolio_url = 'https://michellechangenergy.com',
    wizard_completed = true,
    slug = 'michelle-chang',
    template = 'passport',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';

-- PASO 3: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('f30db5f9-0807-4d48-aa76-de4b6d7278da',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Reiki and Energy Healing Instructor',
 '2019-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching Reiki and energy healing modalities to healthcare professionals and wellness practitioners. Developing curriculum that presents energy work practices with clear techniques and realistic expectations.',
 ARRAY['Reiki instruction', 'Energy healing education', 'Practical technique teaching', 'Professional training programs'],
 'Remote', 1, true, NOW(), NULL::uuid),

('f30db5f9-0807-4d48-aa76-de4b6d7278da',
 'Private Energy Healing Practice',
 'Reiki Master Practitioner',
 '2018-01-01'::date, NULL::date, true, 'FREELANCE',
 'Providing Reiki and energy healing sessions as complementary therapy. Teaching Reiki classes and attunements at all levels. Specializing in integrating energy work with other holistic modalities.',
 ARRAY['Reiki sessions', 'Reiki attunements', 'Energy healing treatments', 'Client education', 'Multi-level Reiki training'],
 'Phoenix, AZ', 2, true, NOW(), NULL::uuid),

('f30db5f9-0807-4d48-aa76-de4b6d7278da',
 'Wellness Center',
 'Reiki Practitioner',
 '2014-06-01'::date, '2017-12-31'::date, false, 'PART_TIME',
 'Provided Reiki and Healing Touch sessions in integrative wellness setting. Worked alongside other holistic practitioners offering complementary energy-based therapies.',
 ARRAY['Reiki sessions', 'Healing Touch therapy', 'Client consultations', 'Wellness center collaboration', 'Energy assessment'],
 'Phoenix, AZ', 3, true, NOW(), NULL::uuid),

('f30db5f9-0807-4d48-aa76-de4b6d7278da',
 'Reiki Training Center',
 'Reiki Training and Certification',
 '2013-01-01'::date, '2014-05-31'::date, false, 'INTERNSHIP',
 'Completed comprehensive Reiki training through Master Teacher level. Received attunements, practiced technique, and studied energy healing theory and applications.',
 ARRAY['Reiki Level I, II, III training', 'Master Teacher attunement', 'Technique practice', 'Energy healing theory'],
 'Phoenix, AZ', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Reiki Healing', 'EXPERT', 10, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Usui Reiki', 'EXPERT', 10, 'Specialization'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Energy Healing', 'EXPERT', 10, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Healing Touch', 'ADVANCED', 8, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Reiki Teaching', 'EXPERT', 8, 'Education'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Reiki Attunements', 'EXPERT', 8, 'Education'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Energy Assessment', 'ADVANCED', 10, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Chakra Balancing', 'ADVANCED', 9, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Holistic Wellness', 'ADVANCED', 10, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Complementary Therapy', 'EXPERT', 10, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Energy Medicine', 'ADVANCED', 9, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Stress Reduction', 'ADVANCED', 10, 'Specialization'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Relaxation Techniques', 'EXPERT', 10, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Patient Education', 'EXPERT', 10, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Integrative Health', 'ADVANCED', 9, 'Clinical Practice');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'CERTIFICATION', 'Usui Reiki Master/Teacher', 'International Center for Reiki Training', '2014-05-01'::date,
 'Master Teacher level certification in Usui Reiki system of natural healing, including all attunements, advanced techniques, and teaching methodology.'),

('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'CERTIFICATION', 'Certified Healing Touch Practitioner', 'Healing Touch Program', '2016-03-01'::date,
 'Professional certification in Healing Touch energy therapy, including multiple techniques, clinical applications, and energy field assessment.'),

('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'CERTIFICATION', 'Energy Medicine Practitioner', 'Energy Medicine Institute', '2018-09-01'::date,
 'Comprehensive training in energy medicine principles, multiple energy healing modalities, and integration with holistic health practices.'),

('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'CERTIFICATION', 'Holistic Health Foundations', 'Prescott College', '2013-12-01'::date,
 'Bachelor degree in Holistic Health covering multiple wellness modalities, complementary therapies, and integrative health principles.');

-- VERIFICACIÓN FINAL
SELECT
    'Michelle Chang - LISTO' as status,
    p.full_name, p.role, p.wizard_completed, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';
