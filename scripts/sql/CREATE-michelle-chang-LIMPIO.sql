-- ============================================================================
-- CREAR MICHELLE CHANG DESDE CERO - LIMPIO
-- ============================================================================
-- UUID: 7fe0c1a6-39ed-46ad-9388-116a3a0fb429
-- Email: michelle.chang@iseih.edu
-- Especialidad: Reiki & Energy Work
-- ============================================================================

-- PASO 1: Actualizar perfil base
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
WHERE id = '7fe0c1a6-39ed-46ad-9388-116a3a0fb429';

-- PASO 2: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Reiki and Energy Healing Instructor',
 '2019-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching Reiki and energy healing modalities to healthcare professionals and wellness practitioners. Developing curriculum that presents energy work practices with clear techniques and realistic expectations.',
 ARRAY['Developed comprehensive Reiki curriculum for healthcare professionals', 'Trained over 60 students in Reiki Level I through Master Teacher', 'Created evidence-based approach to teaching energy healing', 'Achieved 97% student satisfaction in course evaluations', 'Published 3 articles on integrating Reiki with conventional healthcare'],
 'Remote', 1, true, NOW(), NULL::uuid),

('7fe0c1a6-39ed-46ad-9388-116a3a0fb429',
 'Private Energy Healing Practice',
 'Reiki Master Practitioner',
 '2018-01-01'::date, NULL::date, true, 'FREELANCE',
 'Providing Reiki and energy healing sessions as complementary therapy. Teaching Reiki classes and attunements at all levels. Specializing in integrating energy work with other holistic modalities.',
 ARRAY['Conducted over 500 individual Reiki sessions', 'Taught 15+ Reiki certification courses (Level I-III)', 'Provided Reiki attunements to 80+ students', 'Collaborated with massage therapists and acupuncturists', '92% client satisfaction rate in follow-up surveys'],
 'Phoenix, AZ', 2, true, NOW(), NULL::uuid),

('7fe0c1a6-39ed-46ad-9388-116a3a0fb429',
 'Desert Wellness Center',
 'Reiki Practitioner',
 '2014-06-01'::date, '2017-12-31'::date, false, 'PART_TIME',
 'Provided Reiki and Healing Touch sessions in integrative wellness setting. Worked alongside other holistic practitioners offering complementary energy-based therapies.',
 ARRAY['Delivered 300+ Reiki and Healing Touch sessions', 'Integrated energy work with massage and bodywork treatments', 'Educated clients on energy healing principles', 'Participated in multidisciplinary care team meetings', 'Developed client wellness plans incorporating energy healing'],
 'Phoenix, AZ', 3, true, NOW(), NULL::uuid),

('7fe0c1a6-39ed-46ad-9388-116a3a0fb429',
 'International Center for Reiki Training',
 'Reiki Training and Certification',
 '2013-01-01'::date, '2014-05-31'::date, false, 'INTERNSHIP',
 'Completed comprehensive Reiki training through Master Teacher level. Received attunements, practiced technique, and studied energy healing theory and applications.',
 ARRAY['Completed Reiki Level I, II, and III training', 'Received Master Teacher attunement and certification', 'Practiced 200+ hours of supervised Reiki sessions', 'Studied traditional Japanese Reiki methods', 'Completed advanced energy healing techniques training'],
 'Phoenix, AZ', 4, true, NOW(), NULL::uuid);

-- PASO 3: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Reiki Healing', 'EXPERT', 10, 'Clinical Practice'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Usui Reiki', 'EXPERT', 10, 'Specialization'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Energy Healing', 'EXPERT', 10, 'Clinical Practice'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Healing Touch', 'ADVANCED', 8, 'Clinical Practice'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Reiki Teaching', 'EXPERT', 8, 'Education'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Reiki Attunements', 'EXPERT', 8, 'Education'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Energy Assessment', 'ADVANCED', 10, 'Clinical Practice'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Chakra Balancing', 'ADVANCED', 9, 'Clinical Practice'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Holistic Wellness', 'ADVANCED', 10, 'Clinical Practice'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Complementary Therapy', 'EXPERT', 10, 'Clinical Practice'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Energy Medicine', 'ADVANCED', 9, 'Clinical Practice'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Stress Reduction', 'ADVANCED', 10, 'Specialization'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Relaxation Techniques', 'EXPERT', 10, 'Clinical Practice'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Patient Education', 'EXPERT', 10, 'Clinical Practice'),
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'Integrative Health', 'ADVANCED', 9, 'Clinical Practice');

-- PASO 4: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'CERTIFICATION', 'Usui Reiki Master/Teacher', 'International Center for Reiki Training', '2014-05-01'::date,
 'Master Teacher level certification in Usui Reiki system of natural healing, including all attunements, advanced techniques, and teaching methodology.'),

('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'CERTIFICATION', 'Certified Healing Touch Practitioner', 'Healing Touch Program', '2016-03-01'::date,
 'Professional certification in Healing Touch energy therapy, including multiple techniques, clinical applications, and energy field assessment.'),

('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'CERTIFICATION', 'Energy Medicine Practitioner', 'Energy Medicine Institute', '2018-09-01'::date,
 'Comprehensive training in energy medicine principles, multiple energy healing modalities, and integration with holistic health practices.'),

('7fe0c1a6-39ed-46ad-9388-116a3a0fb429', 'CERTIFICATION', 'Holistic Health Foundations', 'Prescott College', '2013-12-01'::date,
 'Bachelor degree in Holistic Health covering multiple wellness modalities, complementary therapies, and integrative health principles.');

-- VERIFICACIÓN FINAL
SELECT
    '========== MICHELLE CHANG CREADO ==========' as status,
    p.id as uuid,
    p.full_name, p.email, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '7fe0c1a6-39ed-46ad-9388-116a3a0fb429';

-- RESULTADO ESPERADO:
-- uuid: 7fe0c1a6-39ed-46ad-9388-116a3a0fb429
-- full_name: Michelle Chang
-- email: michelle.chang@iseih.edu
-- slug: michelle-chang
-- exp: 4, skills: 15, certs: 4
