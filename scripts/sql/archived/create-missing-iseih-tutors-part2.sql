-- ============================================================================
-- CREAR 10 PERFILES FALTANTES DE TUTORES ISEIH - PARTE 2
-- Tutores 4-10: Jessica Porter, Alex Martinez, Diana Russell, Michelle Chang,
--               Robert Kim, Catherine Adams, Mark Davidson
-- ============================================================================

-- ============================================================================
-- 4. JESSICA PORTER - BIOFEEDBACK & WELLNESS TECHNOLOGY
-- ============================================================================

INSERT INTO public.profiles (
    user_id, full_name, headline, summary, role,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    NULL,
    'Jessica Porter',
    'Board Certified Biofeedback Specialist and Wellness Technology Consultant',
    'Board Certified Biofeedback specialist with 8 years integrating technology with wellness practices. Expert in using biofeedback devices and wearables to train self-regulation and optimize health. Passionate about teaching practical applications of emerging wellness technologies.',
    'professional',
    'jessica.porter@iseih.edu',
    '+1-612-555-0104',
    'Minneapolis, Minnesota, USA',
    'https://linkedin.com/in/jessicaporter-bcb',
    'https://jessicaporterbio.com'
) ON CONFLICT (email) DO NOTHING;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Jessica Porter' LIMIT 1
)
INSERT INTO public.experiences (profile_id, title, company, location, start_date, end_date, description, currently_working)
SELECT
    id,
    'Wellness Technology Instructor',
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Remote',
    '2021-01',
    NULL,
    'Teaching healthcare professionals how to leverage biofeedback and wellness technology. Covering practical applications of HRV training, wearable devices, and emerging health tech tools.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Independent Wellness Technology Consultant',
    'Porter Tech Wellness',
    'Minneapolis, MN',
    '2020-01',
    NULL,
    'Consulting with wellness practitioners and clinics on integrating technology into practice. Specializing in biofeedback setup, wearable integration, and digital health tool selection.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Biofeedback Specialist',
    'Minneapolis Pain Management Clinic',
    'Minneapolis, MN',
    '2016-06',
    '2019-12',
    'Provided biofeedback therapy for chronic pain patients. Utilized HRV biofeedback, EMG, and thermal biofeedback for stress reduction and pain management training.',
    false
FROM profile_data
UNION ALL
SELECT
    id,
    'Clinical Research Coordinator',
    'University of Minnesota Health Informatics Lab',
    'Minneapolis, MN',
    '2016-01',
    '2016-05',
    'Coordinated research projects on health technology applications. Managed data collection using wearable devices and mobile health applications.',
    false
FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Jessica Porter' LIMIT 1
)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT id, 'Biofeedback Therapy', 'EXPERT', 8, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Heart Rate Variability (HRV) Training', 'EXPERT', 8, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Wearable Technology', 'ADVANCED', 6, 'Technology' FROM profile_data
UNION ALL SELECT id, 'Health Informatics', 'ADVANCED', 8, 'Technology' FROM profile_data
UNION ALL SELECT id, 'EMG Biofeedback', 'ADVANCED', 7, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Thermal Biofeedback', 'ADVANCED', 7, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Stress Management Technology', 'EXPERT', 8, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Digital Health Tools', 'ADVANCED', 6, 'Technology' FROM profile_data
UNION ALL SELECT id, 'HeartMath Techniques', 'EXPERT', 5, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Pain Management Protocols', 'ADVANCED', 7, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Self-Regulation Training', 'EXPERT', 8, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Technology Integration', 'ADVANCED', 6, 'Consulting' FROM profile_data
UNION ALL SELECT id, 'Wellness Tech Consulting', 'ADVANCED', 4, 'Consulting' FROM profile_data
UNION ALL SELECT id, 'Patient Education Technology', 'ADVANCED', 8, 'Education' FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Jessica Porter' LIMIT 1
)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id,
    'CERTIFICATION',
    'Board Certified in Biofeedback (BCB)',
    'Biofeedback Certification International Alliance (BCIA)',
    '2017-03',
    'Board certification in biofeedback demonstrating mastery of psychophysiological principles, biofeedback instrumentation, and clinical application protocols.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'HeartMath Certified Practitioner',
    'HeartMath Institute',
    '2017-09',
    'Certification in HeartMath coherence training techniques and HRV biofeedback for stress management and performance optimization.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Wellness Technology Consultant',
    'Digital Health Certification Collaborative',
    '2020-06',
    'Professional certification in evaluating, implementing, and optimizing digital health and wellness technologies for clinical and personal use.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Certified Health IT Professional',
    'HIMSS',
    '2016-11',
    'Certification in health information technology fundamentals, data management, and technology implementation in healthcare settings.'
FROM profile_data;

-- ============================================================================
-- 5. ALEX MARTINEZ - AI IN HOLISTIC HEALTH
-- ============================================================================

INSERT INTO public.profiles (
    user_id, full_name, headline, summary, role,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    NULL,
    'Alex Martinez',
    'Health Technology Consultant Specializing in AI and Digital Wellness Tools',
    'Health technology consultant with 7 years bridging wellness and technology. Expert in practical applications of AI, apps, and digital platforms for holistic health professionals. Specialized in helping practitioners leverage digital tools while maintaining human-centered care.',
    'professional',
    'alex.martinez@iseih.edu',
    '+1-602-555-0105',
    'Phoenix, Arizona, USA',
    'https://linkedin.com/in/alexmartinez-healthtech',
    'https://alexmartinezhealthtech.com'
) ON CONFLICT (email) DO NOTHING;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Alex Martinez' LIMIT 1
)
INSERT INTO public.experiences (profile_id, title, company, location, start_date, end_date, description, currently_working)
SELECT
    id,
    'Digital Health Tools Instructor',
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Remote',
    '2021-01',
    NULL,
    'Teaching wellness professionals how to integrate AI and digital tools into practice. Covering practical applications, ethical considerations, and maintaining therapeutic relationships in digital age.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Technology Consultant for Wellness Startups',
    'Martinez Health Tech Consulting',
    'Phoenix, AZ',
    '2020-01',
    NULL,
    'Advising wellness startups on product development, UX design, and technology implementation. Bridging gap between traditional wellness approaches and modern digital solutions.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Software Developer',
    'MindCare Digital Health',
    'Phoenix, AZ',
    '2017-06',
    '2019-12',
    'Developed mental health and wellness applications. Created user-friendly interfaces for meditation apps, mood tracking tools, and therapeutic chatbots powered by AI.',
    false
FROM profile_data
UNION ALL
SELECT
    id,
    'Junior Developer',
    'Tech Solutions Inc',
    'Irvine, CA',
    '2013-08',
    '2017-05',
    'Software development for various web and mobile applications. Gained foundational programming skills and project management experience.',
    false
FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Alex Martinez' LIMIT 1
)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT id, 'Health Technology Consulting', 'EXPERT', 7, 'Consulting' FROM profile_data
UNION ALL SELECT id, 'AI Applications in Health', 'ADVANCED', 5, 'Technology' FROM profile_data
UNION ALL SELECT id, 'Digital Health Tools', 'EXPERT', 7, 'Technology' FROM profile_data
UNION ALL SELECT id, 'UX Design for Healthcare', 'ADVANCED', 7, 'Design' FROM profile_data
UNION ALL SELECT id, 'Software Development', 'ADVANCED', 10, 'Technology' FROM profile_data
UNION ALL SELECT id, 'Mobile Health Apps', 'EXPERT', 7, 'Technology' FROM profile_data
UNION ALL SELECT id, 'Wellness Platform Integration', 'ADVANCED', 4, 'Technology' FROM profile_data
UNION ALL SELECT id, 'Digital Health Strategy', 'ADVANCED', 4, 'Consulting' FROM profile_data
UNION ALL SELECT id, 'Telehealth Implementation', 'ADVANCED', 4, 'Technology' FROM profile_data
UNION ALL SELECT id, 'Data Privacy in Health Tech', 'ADVANCED', 7, 'Compliance' FROM profile_data
UNION ALL SELECT id, 'Technology Training', 'ADVANCED', 3, 'Education' FROM profile_data
UNION ALL SELECT id, 'Product Development', 'ADVANCED', 6, 'Technology' FROM profile_data
UNION ALL SELECT id, 'Startup Advising', 'ADVANCED', 4, 'Consulting' FROM profile_data
UNION ALL SELECT id, 'Digital Therapeutics', 'ADVANCED', 5, 'Technology' FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Alex Martinez' LIMIT 1
)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id,
    'CERTIFICATION',
    'Certified Health IT Professional',
    'HIMSS',
    '2018-04',
    'Professional certification in health information technology, digital health tools, and technology implementation in healthcare environments.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Digital Health Coach',
    'Digital Health Institute',
    '2019-07',
    'Certification in coaching individuals and professionals on effective use of digital health technologies and wellness applications.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'UX Design for Healthcare',
    'Nielsen Norman Group',
    '2018-11',
    'Specialized training in user experience design principles for healthcare applications, focusing on accessibility and patient-centered design.'
FROM profile_data;

-- ============================================================================
-- 6. DIANA RUSSELL - MASSAGE THERAPY
-- ============================================================================

INSERT INTO public.profiles (
    user_id, full_name, headline, summary, role,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    NULL,
    'Diana Russell',
    'Licensed Massage Therapist Specializing in Therapeutic Bodywork',
    'Licensed Massage Therapist with 12 years specializing in deep therapeutic bodywork. Expert in craniosacral therapy, myofascial release, and treating chronic pain and tension. Passionate about teaching safe, effective massage techniques with emphasis on practitioner wellness and body mechanics.',
    'professional',
    'diana.russell@iseih.edu',
    '+1-206-555-0106',
    'Seattle, Washington, USA',
    'https://linkedin.com/in/dianarussell-lmt',
    'https://russelltherapeuticmassage.com'
) ON CONFLICT (email) DO NOTHING;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Diana Russell' LIMIT 1
)
INSERT INTO public.experiences (profile_id, title, company, location, start_date, end_date, description, currently_working)
SELECT
    id,
    'Therapeutic Massage Instructor',
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Remote',
    '2019-01',
    NULL,
    'Teaching therapeutic massage techniques with emphasis on safety, efficacy, and practitioner self-care. Training professionals in deep tissue, craniosacral, and myofascial release methods.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Licensed Massage Therapist - Private Practice',
    'Russell Therapeutic Bodywork',
    'Seattle, WA',
    '2017-01',
    NULL,
    'Providing therapeutic massage specializing in chronic pain, repetitive strain injuries, and postural imbalances. Utilizing multiple modalities tailored to client needs.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Massage Therapist',
    'Seattle Medical Spa',
    'Seattle, WA',
    '2012-06',
    '2016-12',
    'Delivered therapeutic massage in medical spa setting. Worked with physicians and physical therapists treating chronic pain patients. Developed specialized protocols for complex conditions.',
    false
FROM profile_data
UNION ALL
SELECT
    id,
    'Massage Therapy Intern',
    'Cortiva Institute Clinic',
    'Seattle, WA',
    '2011-06',
    '2012-05',
    'Completed 200+ hours clinical massage practice under supervision. Gained experience with diverse populations and conditions while refining technique and therapeutic approach.',
    false
FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Diana Russell' LIMIT 1
)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT id, 'Therapeutic Massage', 'EXPERT', 12, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Deep Tissue Massage', 'EXPERT', 12, 'Modality' FROM profile_data
UNION ALL SELECT id, 'Craniosacral Therapy', 'EXPERT', 10, 'Modality' FROM profile_data
UNION ALL SELECT id, 'Myofascial Release', 'EXPERT', 8, 'Modality' FROM profile_data
UNION ALL SELECT id, 'Chronic Pain Management', 'EXPERT', 11, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Swedish Massage', 'EXPERT', 12, 'Modality' FROM profile_data
UNION ALL SELECT id, 'Trigger Point Therapy', 'ADVANCED', 11, 'Modality' FROM profile_data
UNION ALL SELECT id, 'Postural Assessment', 'ADVANCED', 10, 'Assessment' FROM profile_data
UNION ALL SELECT id, 'Sports Massage', 'ADVANCED', 9, 'Modality' FROM profile_data
UNION ALL SELECT id, 'Practitioner Body Mechanics', 'EXPERT', 12, 'Professional Skills' FROM profile_data
UNION ALL SELECT id, 'Client Communication', 'EXPERT', 12, 'Professional Skills' FROM profile_data
UNION ALL SELECT id, 'Injury Prevention', 'ADVANCED', 10, 'Clinical Knowledge' FROM profile_data
UNION ALL SELECT id, 'Anatomy and Physiology', 'EXPERT', 12, 'Clinical Knowledge' FROM profile_data
UNION ALL SELECT id, 'Massage Education', 'ADVANCED', 5, 'Education' FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Diana Russell' LIMIT 1
)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id,
    'CERTIFICATION',
    'Licensed Massage Therapist (WA State)',
    'Washington State Department of Health',
    '2012-06',
    'Full professional licensure to practice massage therapy in Washington State, demonstrating competency in therapeutic massage techniques and professional ethics.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Certified Craniosacral Therapist',
    'Upledger Institute',
    '2014-08',
    'Advanced training in craniosacral therapy including 10-step protocol, fascial release techniques, and therapeutic applications for various conditions.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Myofascial Release Certification',
    'John F. Barnes MFR',
    '2016-05',
    'Comprehensive training in John Barnes approach to myofascial release for treating chronic pain, restricted movement, and fascial dysfunction.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Advanced Deep Tissue Massage',
    'Cortiva Institute',
    '2013-11',
    'Specialized training in advanced deep tissue techniques, body mechanics for deep work, and safe application for therapeutic outcomes.'
FROM profile_data;

-- Continuará en siguiente mensaje...
