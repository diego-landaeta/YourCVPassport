-- ============================================================================
-- CREAR ROBERT KIM - ACUPRESSURE AND ASIAN BODYWORK
-- ============================================================================
-- UUID: 9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da
-- Email: robert.kim@iseih.edu
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da';
DELETE FROM public.skills WHERE profile_id = '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da';
DELETE FROM public.experiences WHERE profile_id = '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Robert Kim',
    headline = 'Certified Asian Bodywork Therapist Specializing in Acupressure Techniques',
    summary = 'Certified Asian Bodywork Therapist with 9 years of experience integrating Traditional Chinese Medicine principles with manual therapy. Specialized in acupressure, shiatsu, and reflexology techniques. Passionate about teaching accessible acupressure methods that can be integrated into various therapeutic practices.',
    role = 'professional',
    plan = 'free',
    email = 'robert.kim@iseih.edu',
    phone = '+1-415-555-0108',
    location = 'San Francisco, California, USA',
    linkedin_url = 'https://linkedin.com/in/robertkim-abt',
    portfolio_url = 'https://robertkimacupressure.com',
    wizard_completed = true,
    slug = 'robert-kim',
    template = 'passport',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da';

-- PASO 3: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Acupressure Techniques Instructor',
 '2020-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching acupressure and Asian bodywork techniques to wellness professionals. Developing curriculum covering acupressure points, meridian theory, and practical application methods.',
 ARRAY['Acupressure technique instruction', 'Meridian theory teaching', 'Point location training', 'Clinical applications'],
 'Remote', 1, true, NOW(), NULL::uuid),

('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da',
 'Private Asian Bodywork Practice',
 'Certified Asian Bodywork Therapist',
 '2019-01-01'::date, NULL::date, true, 'FREELANCE',
 'Providing acupressure, shiatsu, and reflexology treatments to clients. Applying Traditional Chinese Medicine meridian theory and point selection for various health concerns.',
 ARRAY['Acupressure sessions', 'Shiatsu therapy', 'Reflexology treatments', 'TCM assessment', 'Client education'],
 'San Francisco, CA', 2, true, NOW(), NULL::uuid),

('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da',
 'Traditional Chinese Medicine Clinic',
 'Asian Bodywork Therapist',
 '2015-06-01'::date, '2018-12-31'::date, false, 'FULL_TIME',
 'Provided acupressure therapy in TCM clinical setting working alongside acupuncturists. Specialized in using acupressure points for pain relief, stress reduction, and energy balancing.',
 ARRAY['Acupressure therapy', 'TCM clinic collaboration', 'Pain management protocols', 'Stress reduction techniques', 'Energy assessment'],
 'San Francisco, CA', 3, true, NOW(), NULL::uuid),

('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da',
 'American College of Traditional Chinese Medicine',
 'Asian Bodywork Therapy Training',
 '2014-09-01'::date, '2015-05-31'::date, false, 'INTERNSHIP',
 'Completed comprehensive training in Asian Bodywork Therapy including acupressure, meridian theory, TCM foundations, and clinical practice hours.',
 ARRAY['Asian Bodywork fundamentals', 'TCM theory training', 'Acupressure techniques', 'Clinical practice hours'],
 'San Francisco, CA', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Acupressure', 'EXPERT', 9, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Asian Bodywork Therapy', 'EXPERT', 9, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Shiatsu', 'ADVANCED', 8, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Reflexology', 'ADVANCED', 8, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Meridian Theory', 'EXPERT', 9, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'TCM Point Location', 'EXPERT', 9, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Chinese Medicine Theory', 'ADVANCED', 9, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Energy Assessment', 'ADVANCED', 9, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Pain Management', 'ADVANCED', 8, 'Specialization'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Stress Reduction', 'ADVANCED', 9, 'Specialization'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Manual Therapy', 'EXPERT', 9, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Trigger Point Therapy', 'ADVANCED', 7, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Holistic Assessment', 'ADVANCED', 9, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Patient Education', 'EXPERT', 9, 'Clinical Practice'),
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'Integrative Bodywork', 'ADVANCED', 8, 'Clinical Practice');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'CERTIFICATION', 'Certified Asian Bodywork Therapist', 'American Organization for Bodywork Therapies of Asia', '2015-06-01'::date,
 'Professional certification in Asian Bodywork Therapy including comprehensive training in acupressure, meridian theory, and TCM-based manual therapy.'),

('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'CERTIFICATION', 'Shiatsu Practitioner', 'Shiatsu School of America', '2016-09-01'::date,
 'Advanced certification in Shiatsu therapy including technique mastery, meridian assessment, and therapeutic applications of Japanese bodywork.'),

('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'CERTIFICATION', 'Reflexology Certification', 'American Reflexology Certification Board', '2017-03-01'::date,
 'Professional certification in reflexology covering foot, hand, and ear reflexology techniques and therapeutic applications.'),

('9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da', 'CERTIFICATION', 'Traditional Chinese Medicine Foundations', 'American College of Traditional Chinese Medicine', '2015-05-01'::date,
 'Comprehensive training in TCM theory, meridian system, point locations, and energetic assessment for bodywork applications.');

-- VERIFICACIÓN FINAL
SELECT
    'Robert Kim - LISTO' as status,
    p.full_name, p.role, p.wizard_completed, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da';
