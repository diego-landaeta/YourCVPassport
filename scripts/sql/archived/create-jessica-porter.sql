-- ============================================================================
-- CREAR JESSICA PORTER - BIOFEEDBACK AND WELLNESS TECHNOLOGY
-- ============================================================================
-- UUID: 55333d11-13c8-43b8-942b-cb1e75d0b812
-- Email: jessica.porter@iseih.edu
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = '55333d11-13c8-43b8-942b-cb1e75d0b812';
DELETE FROM public.skills WHERE profile_id = '55333d11-13c8-43b8-942b-cb1e75d0b812';
DELETE FROM public.experiences WHERE profile_id = '55333d11-13c8-43b8-942b-cb1e75d0b812';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Jessica Porter',
    headline = 'Biofeedback Specialist Integrating Technology with Wellness Practices',
    summary = 'Board Certified Biofeedback Specialist with 8 years of experience integrating wellness technology with holistic health practices. Specialized in using biofeedback devices and wearables for self-regulation training. Passionate about teaching professionals how to leverage emerging technologies to improve health outcomes.',
    role = 'professional',
    plan = 'free',
    email = 'jessica.porter@iseih.edu',
    phone = '+1-612-555-0104',
    location = 'Minneapolis, Minnesota, USA',
    linkedin_url = 'https://linkedin.com/in/jessicaporter-biofeedback',
    portfolio_url = 'https://jessicaporterwellness.com',
    wizard_completed = true,
    slug = 'jessica-porter',
    template = 'passport',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = '55333d11-13c8-43b8-942b-cb1e75d0b812';

-- PASO 3: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('55333d11-13c8-43b8-942b-cb1e75d0b812',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Wellness Technology Instructor',
 '2021-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching healthcare professionals how to integrate biofeedback and wellness technology into their practices. Developing curriculum on digital health tools and self-regulation techniques.',
 ARRAY['Biofeedback technology instruction', 'Wearable device integration', 'Digital health tools training', 'Self-regulation techniques'],
 'Remote', 1, true, NOW(), NULL::uuid),

('55333d11-13c8-43b8-942b-cb1e75d0b812',
 'Wellness Technology Consulting',
 'Independent Biofeedback Consultant',
 '2020-01-01'::date, NULL::date, true, 'FREELANCE',
 'Consulting with wellness professionals on implementing biofeedback and health technology solutions. Specializing in device selection, training protocols, and client self-regulation programs.',
 ARRAY['Technology implementation consulting', 'Biofeedback protocol design', 'Professional training programs', 'Device selection guidance', 'Client self-regulation training'],
 'Minneapolis, MN', 2, true, NOW(), NULL::uuid),

('55333d11-13c8-43b8-942b-cb1e75d0b812',
 'Pain Management Clinic',
 'Biofeedback Specialist',
 '2016-06-01'::date, '2019-12-31'::date, false, 'FULL_TIME',
 'Provided biofeedback therapy for chronic pain management using HRV, EMG, and thermal biofeedback. Trained patients in self-regulation techniques and physiological awareness.',
 ARRAY['Biofeedback therapy sessions', 'HRV training', 'EMG biofeedback', 'Thermal biofeedback', 'Patient self-regulation training', 'Pain management protocols'],
 'Minneapolis, MN', 3, true, NOW(), NULL::uuid),

('55333d11-13c8-43b8-942b-cb1e75d0b812',
 'University Health Informatics Department',
 'Health Technology Research Assistant',
 '2014-09-01'::date, '2016-05-31'::date, false, 'PART_TIME',
 'Assisted with research on health informatics and wearable technology applications. Gained experience in data analysis, technology evaluation, and wellness technology integration.',
 ARRAY['Health technology research', 'Data analysis', 'Wearable device evaluation', 'Technology integration studies'],
 'Minneapolis, MN', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Biofeedback Therapy', 'EXPERT', 8, 'Clinical Practice'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'HRV Biofeedback', 'EXPERT', 8, 'Specialization'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'EMG Biofeedback', 'ADVANCED', 7, 'Clinical Practice'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Wellness Technology', 'EXPERT', 8, 'Clinical Practice'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Wearable Devices', 'ADVANCED', 6, 'Technology'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Self-Regulation Training', 'EXPERT', 8, 'Clinical Practice'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Health Informatics', 'ADVANCED', 8, 'Technology'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Stress Management Technology', 'ADVANCED', 7, 'Specialization'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Physiological Monitoring', 'EXPERT', 8, 'Clinical Practice'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Digital Health Tools', 'ADVANCED', 6, 'Technology'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Pain Management', 'ADVANCED', 7, 'Clinical Practice'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'HeartMath Techniques', 'ADVANCED', 6, 'Specialization'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Technology Integration', 'EXPERT', 8, 'Technology'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Patient Education', 'EXPERT', 8, 'Clinical Practice'),
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'Data Analysis', 'ADVANCED', 8, 'Technology');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('55333d11-13c8-43b8-942b-cb1e75d0b812', 'CERTIFICATION', 'Board Certified in Biofeedback', 'Biofeedback Certification International Alliance', '2017-03-01'::date,
 'Professional board certification in biofeedback with comprehensive training in multiple biofeedback modalities, self-regulation techniques, and clinical applications.'),

('55333d11-13c8-43b8-942b-cb1e75d0b812', 'CERTIFICATION', 'HeartMath Certified Practitioner', 'HeartMath Institute', '2018-06-01'::date,
 'Certification in HeartMath techniques for heart rate variability training, stress management, and emotional self-regulation using biofeedback technology.'),

('55333d11-13c8-43b8-942b-cb1e75d0b812', 'CERTIFICATION', 'Wearable Technology Consultant', 'Digital Health Institute', '2019-09-01'::date,
 'Specialized training in evaluating, selecting, and implementing wearable health technology devices for clinical and wellness applications.'),

('55333d11-13c8-43b8-942b-cb1e75d0b812', 'CERTIFICATION', 'Health Informatics Professional', 'American Health Information Management Association', '2016-12-01'::date,
 'Professional certification in health informatics covering data management, technology integration, and digital health applications.');

-- VERIFICACIÓN FINAL
SELECT
    'Jessica Porter - LISTO' as status,
    p.full_name, p.role, p.wizard_completed, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '55333d11-13c8-43b8-942b-cb1e75d0b812';
