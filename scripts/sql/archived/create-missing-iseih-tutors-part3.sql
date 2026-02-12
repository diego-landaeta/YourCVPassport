-- ============================================================================
-- CREAR 10 PERFILES FALTANTES DE TUTORES ISEIH - PARTE 3 (FINAL)
-- Tutores 7-10: Michelle Chang, Robert Kim, Catherine Adams, Mark Davidson
-- ============================================================================

-- ============================================================================
-- 7. MICHELLE CHANG - REIKI & ENERGY WORK
-- ============================================================================

INSERT INTO public.profiles (
    user_id, full_name, headline, summary, role,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    NULL,
    'Michelle Chang',
    'Reiki Master Teacher and Certified Energy Medicine Practitioner',
    'Reiki Master Teacher with 10 years of practice and teaching experience. Specialized in demystifying energy work and teaching concrete, practical techniques. Expert in creating realistic expectations and teaching Reiki as a complementary healing modality.',
    'professional',
    'michelle.chang@iseih.edu',
    '+1-602-555-0107',
    'Phoenix, Arizona, USA',
    'https://linkedin.com/in/michellechang-reiki',
    'https://changenergymedicine.com'
) ON CONFLICT (email) DO NOTHING;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Michelle Chang' LIMIT 1
)
INSERT INTO public.experiences (profile_id, title, company, location, start_date, end_date, description, currently_working)
SELECT
    id,
    'Reiki and Energy Work Instructor',
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Remote',
    '2019-01',
    NULL,
    'Teaching Reiki healing and energy medicine fundamentals. Training professionals in traditional Usui Reiki methods, Healing Touch techniques, and ethical energy work practices.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Energy Medicine Practitioner',
    'Chang Energy Healing',
    'Phoenix, AZ',
    '2018-01',
    NULL,
    'Providing Reiki sessions and energy healing work. Offering Reiki training courses from Level 1 through Master/Teacher level. Creating accessible, grounded approaches to energy medicine.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Reiki Practitioner',
    'Desert Wellness Center',
    'Phoenix, AZ',
    '2014-06',
    '2017-12',
    'Delivered Reiki sessions in multidisciplinary wellness center. Worked alongside massage therapists, acupuncturists, and counselors providing complementary energy work.',
    false
FROM profile_data
UNION ALL
SELECT
    id,
    'Holistic Health Educator',
    'Phoenix Community College Continuing Education',
    'Phoenix, AZ',
    '2015-01',
    '2018-12',
    'Taught introduction to holistic health and wellness courses. Introduced students to various complementary modalities including energy medicine, meditation, and stress reduction.',
    false
FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Michelle Chang' LIMIT 1
)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT id, 'Reiki Healing', 'EXPERT', 10, 'Energy Work' FROM profile_data
UNION ALL SELECT id, 'Energy Medicine', 'EXPERT', 10, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Healing Touch', 'ADVANCED', 8, 'Energy Work' FROM profile_data
UNION ALL SELECT id, 'Usui Reiki', 'EXPERT', 10, 'Reiki Systems' FROM profile_data
UNION ALL SELECT id, 'Reiki Teaching', 'EXPERT', 8, 'Education' FROM profile_data
UNION ALL SELECT id, 'Energy Assessment', 'ADVANCED', 10, 'Assessment' FROM profile_data
UNION ALL SELECT id, 'Chakra Balancing', 'ADVANCED', 10, 'Energy Work' FROM profile_data
UNION ALL SELECT id, 'Complementary Therapy Integration', 'ADVANCED', 9, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Client Education', 'EXPERT', 10, 'Professional Skills' FROM profile_data
UNION ALL SELECT id, 'Holistic Health Education', 'ADVANCED', 9, 'Education' FROM profile_data
UNION ALL SELECT id, 'Stress Reduction Techniques', 'ADVANCED', 10, 'Wellness' FROM profile_data
UNION ALL SELECT id, 'Meditation Facilitation', 'ADVANCED', 9, 'Wellness' FROM profile_data
UNION ALL SELECT id, 'Ethical Energy Work Practice', 'EXPERT', 10, 'Professional Ethics' FROM profile_data
UNION ALL SELECT id, 'Wellness Program Development', 'ADVANCED', 7, 'Program Design' FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Michelle Chang' LIMIT 1
)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id,
    'CERTIFICATION',
    'Usui Reiki Master/Teacher',
    'International Center for Reiki Training',
    '2014-08',
    'Complete Usui Reiki training through Master/Teacher level, including traditional Japanese Reiki methods and teaching certification.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Certified Healing Touch Practitioner',
    'Healing Touch Program',
    '2016-05',
    'Comprehensive training in Healing Touch energy therapy including multiple techniques and protocols for various health conditions.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Energy Medicine Practitioner',
    'Energy Medicine Institute',
    '2017-11',
    'Professional certification in energy medicine principles, energy anatomy, and clinical application of energy healing techniques.'
FROM profile_data;

-- ============================================================================
-- 8. ROBERT KIM - ACUPRESSURE & ASIAN BODYWORK
-- ============================================================================

INSERT INTO public.profiles (
    user_id, full_name, headline, summary, role,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    NULL,
    'Robert Kim',
    'Certified Asian Bodywork Therapist Specializing in Acupressure and Shiatsu',
    'Certified Asian Bodywork Therapist with 9 years combining traditional Chinese medicine knowledge with manual therapy. Expert in acupressure, shiatsu, and reflexology techniques. Passionate about teaching accessible acupressure methods for self-care and professional practice.',
    'professional',
    'robert.kim@iseih.edu',
    '+1-415-555-0108',
    'San Francisco, California, USA',
    'https://linkedin.com/in/robertkim-abt',
    'https://kimacupressure.com'
) ON CONFLICT (email) DO NOTHING;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Robert Kim' LIMIT 1
)
INSERT INTO public.experiences (profile_id, title, company, location, start_date, end_date, description, currently_working)
SELECT
    id,
    'Acupressure Techniques Instructor',
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Remote',
    '2020-01',
    NULL,
    'Teaching acupressure and Asian bodywork techniques to wellness professionals. Training in TCM meridian theory, point location, and practical acupressure applications for common conditions.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Asian Bodywork Practitioner',
    'Kim Acupressure & Wellness',
    'San Francisco, CA',
    '2019-01',
    NULL,
    'Providing acupressure, shiatsu, and reflexology sessions. Treating clients with chronic pain, stress, digestive issues, and musculoskeletal tension using Asian bodywork methods.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Acupressure Therapist',
    'San Francisco Traditional Chinese Medicine Clinic',
    'San Francisco, CA',
    '2015-06',
    '2018-12',
    'Delivered acupressure therapy in collaborative TCM clinic alongside acupuncturists and herbalists. Specialized in pain management and stress reduction protocols.',
    false
FROM profile_data
UNION ALL
SELECT
    id,
    'Asian Bodywork Intern',
    'American College of Traditional Chinese Medicine Student Clinic',
    'San Francisco, CA',
    '2014-06',
    '2015-05',
    'Completed 200+ hours clinical practice in supervised Asian bodywork therapy. Gained foundational experience in client assessment and treatment planning.',
    false
FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Robert Kim' LIMIT 1
)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT id, 'Acupressure', 'EXPERT', 9, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Shiatsu', 'EXPERT', 9, 'Modality' FROM profile_data
UNION ALL SELECT id, 'Asian Bodywork Therapy', 'EXPERT', 9, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'TCM Meridian Theory', 'ADVANCED', 11, 'Traditional Medicine' FROM profile_data
UNION ALL SELECT id, 'Acupuncture Point Location', 'EXPERT', 9, 'Clinical Knowledge' FROM profile_data
UNION ALL SELECT id, 'Reflexology', 'ADVANCED', 8, 'Modality' FROM profile_data
UNION ALL SELECT id, 'Pain Management', 'ADVANCED', 9, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Stress Reduction', 'ADVANCED', 9, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Digestive Health Support', 'ADVANCED', 8, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Energy Meridian Assessment', 'ADVANCED', 9, 'Assessment' FROM profile_data
UNION ALL SELECT id, 'Self-Care Acupressure', 'EXPERT', 7, 'Patient Education' FROM profile_data
UNION ALL SELECT id, 'TCM Pattern Diagnosis', 'ADVANCED', 9, 'Clinical Knowledge' FROM profile_data
UNION ALL SELECT id, 'Manual Therapy', 'EXPERT', 9, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Wellness Education', 'ADVANCED', 9, 'Education' FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Robert Kim' LIMIT 1
)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id,
    'CERTIFICATION',
    'Certified Asian Bodywork Therapist (AOBTA)',
    'American Organization for Bodywork Therapies of Asia',
    '2015-06',
    'Professional certification in Asian bodywork therapy demonstrating competency in TCM theory and manual therapy techniques.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Shiatsu Practitioner Certificate',
    'American College of Traditional Chinese Medicine',
    '2015-05',
    'Comprehensive training in traditional Japanese shiatsu including meridian therapy, pressure techniques, and treatment protocols.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Reflexology Certification',
    'American Reflexology Certification Board',
    '2016-09',
    'Specialized certification in foot, hand, and ear reflexology for therapeutic application and wellness support.'
FROM profile_data;

-- ============================================================================
-- 9. CATHERINE ADAMS - COUPLES THERAPY
-- ============================================================================

INSERT INTO public.profiles (
    user_id, full_name, headline, summary, role,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    NULL,
    'Catherine Adams',
    'Licensed Marriage and Family Therapist Specializing in Couples Work',
    'Licensed Marriage and Family Therapist with 10 years specializing in couples therapy. Expert in Gottman Method and Imago Relationship Therapy. Passionate about teaching concrete communication skills that transform relationships and deepen intimacy.',
    'professional',
    'catherine.adams@iseih.edu',
    '+1-503-555-0109',
    'Portland, Oregon, USA',
    'https://linkedin.com/in/catherineadams-lmft',
    'https://adamscouplestherapy.com'
) ON CONFLICT (email) DO NOTHING;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Catherine Adams' LIMIT 1
)
INSERT INTO public.experiences (profile_id, title, company, location, start_date, end_date, description, currently_working)
SELECT
    id,
    'Couples Therapy Instructor',
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Remote',
    '2020-01',
    NULL,
    'Teaching evidence-based couples therapy methods including Gottman and Imago approaches. Training therapists in communication facilitation, conflict resolution, and intimacy building.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Marriage and Family Therapist',
    'Adams Relationship Center',
    'Portland, OR',
    '2019-01',
    NULL,
    'Providing couples therapy, premarital counseling, and relationship workshops. Specializing in communication repair, conflict de-escalation, and rebuilding emotional connection.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Couples Therapist',
    'Portland Family Therapy Clinic',
    'Portland, OR',
    '2014-06',
    '2018-12',
    'Delivered couples and family therapy in group practice setting. Worked with diverse couples addressing communication, infidelity, parenting conflicts, and intimacy issues.',
    false
FROM profile_data
UNION ALL
SELECT
    id,
    'Relationship Workshop Facilitator',
    'Various community centers',
    'Portland, OR',
    '2017-01',
    NULL,
    'Facilitated communication skills workshops for couples. Taught Gottman principles, active listening, and conflict resolution strategies in group format.',
    true
FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Catherine Adams' LIMIT 1
)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT id, 'Couples Therapy', 'EXPERT', 10, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Gottman Method', 'EXPERT', 8, 'Therapeutic Approach' FROM profile_data
UNION ALL SELECT id, 'Imago Relationship Therapy', 'ADVANCED', 7, 'Therapeutic Approach' FROM profile_data
UNION ALL SELECT id, 'Communication Skills Training', 'EXPERT', 10, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Conflict Resolution', 'EXPERT', 10, 'Clinical Practice' FROM profile_data
UNION ALL SELECT id, 'Intimacy Building', 'ADVANCED', 10, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Premarital Counseling', 'ADVANCED', 9, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Attachment Theory', 'ADVANCED', 10, 'Clinical Knowledge' FROM profile_data
UNION ALL SELECT id, 'Emotionally Focused Therapy', 'ADVANCED', 8, 'Therapeutic Approach' FROM profile_data
UNION ALL SELECT id, 'Relationship Assessment', 'EXPERT', 10, 'Assessment' FROM profile_data
UNION ALL SELECT id, 'Active Listening Facilitation', 'EXPERT', 10, 'Clinical Skills' FROM profile_data
UNION ALL SELECT id, 'Workshop Facilitation', 'EXPERT', 7, 'Education' FROM profile_data
UNION ALL SELECT id, 'Infidelity Recovery', 'ADVANCED', 9, 'Specialization' FROM profile_data
UNION ALL SELECT id, 'Marriage and Family Therapy', 'EXPERT', 10, 'Clinical Practice' FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Catherine Adams' LIMIT 1
)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id,
    'CERTIFICATION',
    'Licensed Marriage and Family Therapist',
    'Oregon Board of Licensed Professional Counselors and Therapists',
    '2014-06',
    'Full professional licensure to practice marriage and family therapy in Oregon, demonstrating clinical competency and ethical practice.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Gottman Method Couples Therapist',
    'The Gottman Institute',
    '2016-09',
    'Comprehensive training in research-based Gottman Method for couples therapy including assessment, intervention, and specific therapeutic protocols.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Imago Relationship Therapy Practitioner',
    'Imago Relationships International',
    '2017-06',
    'Advanced certification in Imago Relationship Therapy focusing on dialogue processes and conscious relationship principles.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Preparing for Marriage (PREP) Facilitator',
    'PREP Inc.',
    '2015-11',
    'Training to facilitate premarital education program teaching communication and conflict management skills to engaged couples.'
FROM profile_data;

-- ============================================================================
-- 10. MARK DAVIDSON - NONVIOLENT COMMUNICATION
-- ============================================================================

INSERT INTO public.profiles (
    user_id, full_name, headline, summary, role,
    email, phone, location, linkedin_url, portfolio_url
) VALUES (
    NULL,
    'Mark Davidson',
    'Certified Nonviolent Communication Trainer and Conflict Mediator',
    'Certified NVC Trainer with 9 years teaching compassionate communication and conflict resolution. Expert in facilitating difficult conversations with empathy and authenticity. Specialized in bringing NVC principles to schools, organizations, and communities.',
    'professional',
    'mark.davidson@iseih.edu',
    '+1-503-555-0110',
    'Portland, Oregon, USA',
    'https://linkedin.com/in/markdavidson-nvc',
    'https://davidsonconsciouscommunication.com'
) ON CONFLICT (email) DO NOTHING;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Mark Davidson' LIMIT 1
)
INSERT INTO public.experiences (profile_id, title, company, location, start_date, end_date, description, currently_working)
SELECT
    id,
    'Nonviolent Communication Instructor',
    'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
    'Remote',
    '2020-01',
    NULL,
    'Teaching Nonviolent Communication principles and practices. Training professionals in empathic listening, authentic expression, and compassionate conflict resolution using NVC framework.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'NVC Trainer and Mediator',
    'Davidson Conscious Communication',
    'Portland, OR',
    '2019-01',
    NULL,
    'Providing NVC training, mediation services, and conflict resolution facilitation. Working with organizations, schools, and community groups to build communication capacity.',
    true
FROM profile_data
UNION ALL
SELECT
    id,
    'Community Mediator',
    'Portland Community Mediation Center',
    'Portland, OR',
    '2015-06',
    '2018-12',
    'Mediated neighborhood disputes, family conflicts, and community disagreements. Facilitated restorative justice circles and conflict resolution processes using NVC principles.',
    false
FROM profile_data
UNION ALL
SELECT
    id,
    'Conflict Resolution Educator',
    'Portland Public Schools',
    'Portland, OR',
    '2016-01',
    '2019-06',
    'Taught conflict resolution and communication skills to students and staff. Implemented restorative practices and peer mediation programs in multiple schools.',
    false
FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Mark Davidson' LIMIT 1
)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category)
SELECT id, 'Nonviolent Communication (NVC)', 'EXPERT', 9, 'Communication' FROM profile_data
UNION ALL SELECT id, 'Conflict Mediation', 'EXPERT', 9, 'Mediation' FROM profile_data
UNION ALL SELECT id, 'Empathic Listening', 'EXPERT', 9, 'Communication Skills' FROM profile_data
UNION ALL SELECT id, 'Compassionate Communication', 'EXPERT', 9, 'Communication' FROM profile_data
UNION ALL SELECT id, 'Restorative Justice', 'ADVANCED', 8, 'Conflict Resolution' FROM profile_data
UNION ALL SELECT id, 'Facilitation Skills', 'EXPERT', 9, 'Group Work' FROM profile_data
UNION ALL SELECT id, 'Conflict Resolution Training', 'EXPERT', 9, 'Education' FROM profile_data
UNION ALL SELECT id, 'Difficult Conversations', 'EXPERT', 9, 'Communication Skills' FROM profile_data
UNION ALL SELECT id, 'Needs-Based Communication', 'EXPERT', 9, 'Communication' FROM profile_data
UNION ALL SELECT id, 'Community Building', 'ADVANCED', 8, 'Community Work' FROM profile_data
UNION ALL SELECT id, 'Organizational Communication', 'ADVANCED', 7, 'Organizational Development' FROM profile_data
UNION ALL SELECT id, 'Restorative Circles', 'ADVANCED', 7, 'Group Facilitation' FROM profile_data
UNION ALL SELECT id, 'Educational Workshop Design', 'ADVANCED', 9, 'Education' FROM profile_data
UNION ALL SELECT id, 'Authentic Expression', 'EXPERT', 9, 'Communication Skills' FROM profile_data;

WITH profile_data AS (
    SELECT id FROM public.profiles WHERE full_name = 'Mark Davidson' LIMIT 1
)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id,
    'CERTIFICATION',
    'Certified Nonviolent Communication Trainer',
    'Center for Nonviolent Communication',
    '2016-08',
    'Full certification to train Nonviolent Communication worldwide, demonstrating mastery of NVC principles, practice, and teaching methodology.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Certified Mediator',
    'Oregon Mediation Association',
    '2015-10',
    'Professional mediation certification with training in conflict resolution processes, mediation ethics, and facilitation techniques.'
FROM profile_data
UNION ALL
SELECT
    id,
    'CERTIFICATION',
    'Restorative Justice Facilitator',
    'International Institute for Restorative Practices',
    '2017-04',
    'Advanced training in restorative practices including circle processes, conferencing, and implementing restorative approaches in various settings.'
FROM profile_data;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

-- Contar cuántos perfiles nuevos se crearon
SELECT
    'Total nuevos perfiles ISEIH' as verificacion,
    COUNT(*) as total
FROM public.profiles
WHERE full_name IN (
    'Rebecca Anderson',
    'Karen White',
    'Paul Henderson',
    'Jessica Porter',
    'Alex Martinez',
    'Diana Russell',
    'Michelle Chang',
    'Robert Kim',
    'Catherine Adams',
    'Mark Davidson'
);

-- Ver resumen de cada perfil creado
SELECT
    full_name,
    headline,
    LENGTH(summary) as summary_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE full_name IN (
    'Rebecca Anderson',
    'Karen White',
    'Paul Henderson',
    'Jessica Porter',
    'Alex Martinez',
    'Diana Russell',
    'Michelle Chang',
    'Robert Kim',
    'Catherine Adams',
    'Mark Davidson'
)
ORDER BY full_name;

-- Resultado esperado: 10 perfiles con 4 exp, 14 skills, 3-4 certs cada uno
