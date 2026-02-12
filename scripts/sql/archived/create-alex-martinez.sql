-- ============================================================================
-- CREAR ALEX MARTINEZ - AI IN HOLISTIC HEALTH
-- ============================================================================
-- UUID: 099840cc-a99c-480d-8fd9-fba5ecd5a4a6
-- Email: alex.martinez@iseih.edu
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = '099840cc-a99c-480d-8fd9-fba5ecd5a4a6';
DELETE FROM public.skills WHERE profile_id = '099840cc-a99c-480d-8fd9-fba5ecd5a4a6';
DELETE FROM public.experiences WHERE profile_id = '099840cc-a99c-480d-8fd9-fba5ecd5a4a6';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Alex Martinez',
    headline = 'Health Technology Specialist Integrating AI with Holistic Wellness',
    summary = 'Health Technology Professional with 7 years of experience developing and implementing digital wellness solutions. Specialized in AI applications for holistic health practices. Passionate about teaching wellness professionals how to leverage technology and digital tools to enhance their services.',
    role = 'professional',
    plan = 'free',
    email = 'alex.martinez@iseih.edu',
    phone = '+1-602-555-0105',
    location = 'Phoenix, Arizona, USA',
    linkedin_url = 'https://linkedin.com/in/alexmartinez-healthtech',
    portfolio_url = 'https://alexmartinezhealthtech.com',
    wizard_completed = true,
    slug = 'alex-martinez',
    template = 'passport',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = '099840cc-a99c-480d-8fd9-fba5ecd5a4a6';

-- PASO 3: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Digital Health Tools Instructor',
 '2021-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching wellness professionals how to integrate AI and digital tools into their practices. Developing curriculum on health apps, online platforms, and emerging wellness technologies.',
 ARRAY['AI in wellness education', 'Digital platform training', 'Health app integration', 'Online service delivery'],
 'Remote', 1, true, NOW(), NULL::uuid),

('099840cc-a99c-480d-8fd9-fba5ecd5a4a6',
 'Wellness Technology Consulting',
 'Health Tech Consultant',
 '2020-06-01'::date, NULL::date, true, 'FREELANCE',
 'Consulting with wellness startups and holistic health practitioners on technology implementation. Specializing in app selection, digital workflow optimization, and online service delivery.',
 ARRAY['Technology consulting for wellness businesses', 'Digital workflow design', 'Platform selection guidance', 'Online service implementation', 'Tech training for practitioners'],
 'Phoenix, AZ', 2, true, NOW(), NULL::uuid),

('099840cc-a99c-480d-8fd9-fba5ecd5a4a6',
 'Mental Health App Company',
 'Health Technology Developer',
 '2017-03-01'::date, '2020-05-31'::date, false, 'FULL_TIME',
 'Developed software features for mental health and wellness mobile application. Collaborated with clinicians to create user-friendly digital tools that support therapeutic processes.',
 ARRAY['Health app development', 'User experience design', 'Clinical collaboration', 'Feature development', 'Quality assurance'],
 'Phoenix, AZ', 3, true, NOW(), NULL::uuid),

('099840cc-a99c-480d-8fd9-fba5ecd5a4a6',
 'Tech Startup',
 'Junior Software Developer',
 '2015-06-01'::date, '2017-02-28'::date, false, 'FULL_TIME',
 'Worked on web and mobile applications with focus on health and wellness sector. Gained foundational experience in software development and user-centered design.',
 ARRAY['Web application development', 'Mobile app development', 'User interface design', 'Cross-functional collaboration'],
 'Phoenix, AZ', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Health Technology', 'EXPERT', 7, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'AI in Wellness', 'ADVANCED', 5, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Digital Health Tools', 'EXPERT', 7, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Health App Development', 'ADVANCED', 6, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Software Development', 'ADVANCED', 8, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'UX Design for Healthcare', 'ADVANCED', 6, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Online Service Delivery', 'EXPERT', 5, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Digital Workflow Design', 'ADVANCED', 5, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Technology Training', 'EXPERT', 6, 'Education'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Platform Integration', 'ADVANCED', 6, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Wellness Technology Consulting', 'ADVANCED', 4, 'Consulting'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Digital Transformation', 'ADVANCED', 5, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Health Informatics', 'INTERMEDIATE', 6, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Mobile Health Apps', 'ADVANCED', 6, 'Technology'),
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'Tech Support for Practitioners', 'EXPERT', 5, 'Education');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'CERTIFICATION', 'Certified Health IT Professional', 'Healthcare Information and Management Systems Society', '2018-09-01'::date,
 'Professional certification in health information technology covering digital health systems, data security, and technology implementation in healthcare settings.'),

('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'CERTIFICATION', 'Digital Health Coach', 'Digital Health Institute', '2020-03-01'::date,
 'Certification in coaching wellness professionals on digital health tool adoption, online service delivery, and technology integration strategies.'),

('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'CERTIFICATION', 'UX Design for Healthcare', 'Nielsen Norman Group', '2019-06-01'::date,
 'Specialized training in user experience design principles specifically for healthcare and wellness applications, focusing on accessibility and user-centered design.'),

('099840cc-a99c-480d-8fd9-fba5ecd5a4a6', 'CERTIFICATION', 'AI Fundamentals for Health', 'Coursera - Stanford University', '2021-11-01'::date,
 'Comprehensive training on artificial intelligence applications in healthcare and wellness, including machine learning basics and ethical AI implementation.');

-- VERIFICACIÓN FINAL
SELECT
    'Alex Martinez - LISTO' as status,
    p.full_name, p.role, p.wizard_completed, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '099840cc-a99c-480d-8fd9-fba5ecd5a4a6';
