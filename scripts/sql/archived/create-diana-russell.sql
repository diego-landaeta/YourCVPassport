-- ============================================================================
-- CREAR DIANA RUSSELL - MASSAGE THERAPY
-- ============================================================================
-- UUID: 636e9e4d-4873-4114-8949-376a8d0f24bc
-- Email: diana.russell@iseih.edu
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = '636e9e4d-4873-4114-8949-376a8d0f24bc';
DELETE FROM public.skills WHERE profile_id = '636e9e4d-4873-4114-8949-376a8d0f24bc';
DELETE FROM public.experiences WHERE profile_id = '636e9e4d-4873-4114-8949-376a8d0f24bc';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Diana Russell',
    headline = 'Licensed Massage Therapist Specializing in Therapeutic Bodywork',
    summary = 'Licensed Massage Therapist with 12 years of experience in therapeutic bodywork and manual therapy. Specialized in craniosacral therapy, myofascial release, and deep tissue work for chronic pain management. Passionate about teaching effective therapeutic massage techniques with emphasis on safety and clinical efficacy.',
    role = 'professional',
    plan = 'free',
    email = 'diana.russell@iseih.edu',
    phone = '+1-206-555-0106',
    location = 'Seattle, Washington, USA',
    linkedin_url = 'https://linkedin.com/in/dianarussell-lmt',
    portfolio_url = 'https://dianarussellmassage.com',
    wizard_completed = true,
    slug = 'diana-russell',
    template = 'passport',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = '636e9e4d-4873-4114-8949-376a8d0f24bc';

-- PASO 3: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('636e9e4d-4873-4114-8949-376a8d0f24bc',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Therapeutic Massage Instructor',
 '2019-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching therapeutic massage techniques and bodywork modalities to healthcare professionals. Developing curriculum emphasizing clinical applications, safety protocols, and effective treatment strategies.',
 ARRAY['Therapeutic massage instruction', 'Bodywork technique training', 'Safety protocol education', 'Clinical application teaching'],
 'Remote', 1, true, NOW(), NULL::uuid),

('636e9e4d-4873-4114-8949-376a8d0f24bc',
 'Private Bodywork Practice',
 'Licensed Massage Therapist',
 '2017-01-01'::date, NULL::date, true, 'FREELANCE',
 'Providing comprehensive therapeutic massage and bodywork services. Specializing in treating chronic pain, tension patterns, and movement restrictions using multiple modalities.',
 ARRAY['Therapeutic massage sessions', 'Chronic pain treatment', 'Myofascial release', 'Craniosacral therapy', 'Client education'],
 'Seattle, WA', 2, true, NOW(), NULL::uuid),

('636e9e4d-4873-4114-8949-376a8d0f24bc',
 'Medical Spa and Wellness Center',
 'Lead Massage Therapist',
 '2012-06-01'::date, '2016-12-31'::date, false, 'FULL_TIME',
 'Provided therapeutic massage in integrative medical setting. Worked collaboratively with physicians and physical therapists. Specialized in craniosacral therapy and myofascial techniques.',
 ARRAY['Therapeutic massage delivery', 'Interdisciplinary collaboration', 'Craniosacral therapy', 'Myofascial release techniques', 'Pain management protocols'],
 'Seattle, WA', 3, true, NOW(), NULL::uuid),

('636e9e4d-4873-4114-8949-376a8d0f24bc',
 'Cortiva Institute Seattle',
 'Massage Therapy Training',
 '2011-09-01'::date, '2012-05-31'::date, false, 'INTERNSHIP',
 'Completed comprehensive massage therapy training program including anatomy, physiology, multiple massage modalities, and clinical practice hours.',
 ARRAY['Massage therapy fundamentals', 'Anatomy and physiology', 'Multiple modality training', 'Clinical practice hours'],
 'Seattle, WA', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Therapeutic Massage', 'EXPERT', 12, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Craniosacral Therapy', 'EXPERT', 10, 'Specialization'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Myofascial Release', 'EXPERT', 9, 'Specialization'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Deep Tissue Massage', 'EXPERT', 12, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Chronic Pain Management', 'ADVANCED', 10, 'Specialization'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Manual Therapy', 'EXPERT', 12, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Bodywork Assessment', 'EXPERT', 12, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Trigger Point Therapy', 'ADVANCED', 11, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Sports Massage', 'ADVANCED', 10, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Postural Analysis', 'ADVANCED', 11, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Swedish Massage', 'EXPERT', 12, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Neuromuscular Therapy', 'ADVANCED', 9, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Anatomy and Kinesiology', 'EXPERT', 12, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Patient Education', 'EXPERT', 12, 'Clinical Practice'),
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'Treatment Planning', 'EXPERT', 11, 'Clinical Practice');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('636e9e4d-4873-4114-8949-376a8d0f24bc', 'CERTIFICATION', 'Licensed Massage Therapist', 'Washington State Department of Health', '2012-06-01'::date,
 'Professional state licensure to practice massage therapy in Washington, including comprehensive training in anatomy, multiple modalities, and clinical practice.'),

('636e9e4d-4873-4114-8949-376a8d0f24bc', 'CERTIFICATION', 'Certified Craniosacral Therapist', 'Upledger Institute', '2014-09-01'::date,
 'Advanced certification in craniosacral therapy including technique mastery, assessment skills, and treatment protocols for various conditions.'),

('636e9e4d-4873-4114-8949-376a8d0f24bc', 'CERTIFICATION', 'Certified in Myofascial Release', 'John F. Barnes MFR', '2016-03-01'::date,
 'Comprehensive training in myofascial release technique for treating fascial restrictions, chronic pain, and movement limitations.'),

('636e9e4d-4873-4114-8949-376a8d0f24bc', 'CERTIFICATION', 'Advanced Therapeutic Massage', 'Associated Bodywork & Massage Professionals', '2018-11-01'::date,
 'Advanced continuing education in therapeutic massage applications, clinical reasoning, and evidence-based practice for chronic conditions.');

-- VERIFICACIÓN FINAL
SELECT
    'Diana Russell - LISTO' as status,
    p.full_name, p.role, p.wizard_completed, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '636e9e4d-4873-4114-8949-376a8d0f24bc';
