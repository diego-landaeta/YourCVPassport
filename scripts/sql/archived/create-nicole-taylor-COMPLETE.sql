-- ============================================================================
-- CREAR NICOLE TAYLOR - DANCE/MOVEMENT THERAPY
-- ============================================================================
-- UUID: f30db5f9-0807-4d48-aa76-de4b6d7278da
-- Email: nicole.taylor@iseih.edu
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';
DELETE FROM public.skills WHERE profile_id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';
DELETE FROM public.experiences WHERE profile_id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Nicole Taylor',
    headline = 'Dance/Movement Therapist and Somatic Psychology Specialist',
    summary = 'Registered Dance/Movement Therapist with 11 years of experience using embodied movement practices for healing and personal growth. Expert in trauma-informed movement therapy, somatic psychology, and expressive arts. Passionate about teaching therapists how to integrate body-centered approaches with traditional psychotherapy for holistic healing.',
    role = 'professional',
    plan = 'free',
    email = 'nicole.taylor@iseih.edu',
    phone = '+1-503-555-0125',
    location = 'Portland, Oregon, USA',
    linkedin_url = 'https://linkedin.com/in/nicoletaylor-dmt',
    portfolio_url = 'https://nicoletaylordmt.com',
    wizard_completed = true,
    slug = 'nicole-taylor',
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
 'Dance/Movement Therapy Instructor',
 '2020-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching dance/movement therapy and somatic approaches to mental health professionals. Training students in body-centered assessment, movement observation, and therapeutic movement interventions. Developing curriculum that integrates dance therapy with trauma-informed care.',
 ARRAY['Developed 6 curriculum modules in dance/movement therapy', 'Supervised 45+ students in somatic practice', 'Implemented experiential learning with movement-based techniques', 'Created trauma-informed movement protocols adopted by 8 clinics', '98% student satisfaction in course evaluations'],
 'Remote', 1, true, NOW(), NULL::uuid),

('f30db5f9-0807-4d48-aa76-de4b6d7278da',
 'Private Dance Therapy Practice',
 'Registered Dance/Movement Therapist',
 '2018-01-01'::date, NULL::date, true, 'FREELANCE',
 'Providing individual and group dance/movement therapy for trauma recovery, anxiety, depression, and personal growth. Utilizing Authentic Movement, Laban Movement Analysis, and somatic experiencing. Specializing in helping clients reconnect with their bodies and process emotional experiences through movement.',
 ARRAY['Facilitated 250+ individual DMT sessions', 'Led weekly therapeutic movement groups (15-20 participants)', 'Developed "Movement for Healing" 12-week program', '85% client improvement in somatic awareness measures', '92% client satisfaction in 6-month follow-ups'],
 'Portland, OR', 2, true, NOW(), NULL::uuid),

('f30db5f9-0807-4d48-aa76-de4b6d7278da',
 'Portland Mental Health Center',
 'Dance/Movement Therapist',
 '2014-06-01'::date, '2017-12-31'::date, false, 'FULL_TIME',
 'Delivered dance/movement therapy in outpatient mental health setting. Worked with diverse populations including trauma survivors, eating disorder clients, and individuals with anxiety/depression. Collaborated with multidisciplinary team including psychologists, social workers, and art therapists.',
 ARRAY['Conducted 400+ DMT sessions with trauma-informed approach', 'Co-facilitated women''s trauma recovery group for 3 years', 'Developed movement assessment protocols for clinical use', 'Trained clinical staff in basic somatic awareness techniques', 'Presented DMT research at 2 national conferences'],
 'Portland, OR', 3, true, NOW(), NULL::uuid),

('f30db5f9-0807-4d48-aa76-de4b6d7278da',
 'Columbia College Chicago',
 'Dance/Movement Therapy Internship',
 '2013-01-01'::date, '2014-05-31'::date, false, 'INTERNSHIP',
 'Completed 700+ hours clinical dance/movement therapy training under supervision. Practiced movement assessment, therapeutic intervention, and documentation. Worked with children, adolescents, and adults in various clinical settings.',
 ARRAY['700+ clinical hours in DMT practice', 'Movement-based assessment training', 'Therapeutic intervention development', 'Clinical documentation and case analysis'],
 'Chicago, IL', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Dance/Movement Therapy', 'EXPERT', 11, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Somatic Psychology', 'EXPERT', 10, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Movement Analysis', 'EXPERT', 11, 'Assessment'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Laban Movement Analysis', 'ADVANCED', 9, 'Assessment Method'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Authentic Movement', 'EXPERT', 10, 'Therapeutic Modality'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Trauma-Informed Movement', 'EXPERT', 9, 'Specialization'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Body-Mind Connection', 'EXPERT', 11, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Expressive Arts Therapy', 'ADVANCED', 8, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Movement Assessment', 'EXPERT', 11, 'Assessment'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Somatic Experiencing', 'ADVANCED', 7, 'Therapeutic Approach'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Group Facilitation', 'EXPERT', 10, 'Group Work'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Nonverbal Communication', 'EXPERT', 11, 'Clinical Skills'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Creative Arts Therapies', 'ADVANCED', 9, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Therapeutic Movement', 'EXPERT', 11, 'Clinical Practice'),
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'Dance Improvisation', 'ADVANCED', 11, 'Technique');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'CERTIFICATION', 'Registered Dance/Movement Therapist (R-DMT)', 'American Dance Therapy Association', '2014-06-01'::date,
 'Professional registration as Dance/Movement Therapist demonstrating completion of graduate training, supervised clinical hours, and competency in dance/movement therapy practice.'),

('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'CERTIFICATION', 'Licensed Professional Counselor (LPC)', 'Oregon Board of Licensed Professional Counselors and Therapists', '2015-03-01'::date,
 'State licensure to practice mental health counseling in Oregon, demonstrating clinical competency and adherence to ethical standards.'),

('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'CERTIFICATION', 'Somatic Experiencing Practitioner (SEP)', 'Somatic Experiencing Trauma Institute', '2017-09-01'::date,
 'Certification in Somatic Experiencing approach to trauma resolution, including three-year training program in body-based trauma healing.'),

('f30db5f9-0807-4d48-aa76-de4b6d7278da', 'CERTIFICATION', 'Laban Certified Movement Analyst (LCMA)', 'Laban/Bartenieff Institute of Movement Studies', '2016-11-01'::date,
 'Professional certification in Laban Movement Analysis, including comprehensive training in movement observation, analysis, and application to therapy and education.');

-- VERIFICACIÓN FINAL
SELECT
    'Nicole Taylor - LISTO' as status,
    p.id as uuid,
    p.full_name, p.email, p.role, p.wizard_completed, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = 'f30db5f9-0807-4d48-aa76-de4b6d7278da';

-- RESULTADO ESPERADO:
-- uuid: f30db5f9-0807-4d48-aa76-de4b6d7278da
-- full_name: Nicole Taylor
-- email: nicole.taylor@iseih.edu
-- headline: Dance/Movement Therapist...
-- exp: 4, skills: 15, certs: 4
