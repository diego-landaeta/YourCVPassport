-- ============================================================================
-- CREAR NICOLE TAYLOR DESDE CERO - LIMPIO
-- ============================================================================
-- UUID: 1b90b431-de09-4b75-af6a-c94975b68746
-- Email: nicole.taylor@iseih.edu
-- Especialidad: Dance/Movement Therapy
-- ============================================================================

-- PASO 1: Actualizar perfil base
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
WHERE id = '1b90b431-de09-4b75-af6a-c94975b68746';

-- PASO 2: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('1b90b431-de09-4b75-af6a-c94975b68746',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Dance/Movement Therapy Instructor',
 '2020-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching dance/movement therapy and somatic approaches to mental health professionals. Training students in body-centered assessment, movement observation, and therapeutic movement interventions. Developing curriculum that integrates dance therapy with trauma-informed care.',
 ARRAY['Developed 6 comprehensive curriculum modules in dance/movement therapy', 'Supervised over 45 students in somatic practice and clinical applications', 'Implemented experiential learning methods using movement-based techniques', 'Created trauma-informed movement protocols adopted by 8 mental health clinics', 'Achieved 98% student satisfaction in course evaluations'],
 'Remote', 1, true, NOW(), NULL::uuid),

('1b90b431-de09-4b75-af6a-c94975b68746',
 'Private Dance Therapy Practice',
 'Registered Dance/Movement Therapist',
 '2018-01-01'::date, NULL::date, true, 'FREELANCE',
 'Providing individual and group dance/movement therapy for trauma recovery, anxiety, depression, and personal growth. Utilizing Authentic Movement, Laban Movement Analysis, and somatic experiencing. Specializing in helping clients reconnect with their bodies and process emotional experiences through movement.',
 ARRAY['Facilitated over 250 individual dance/movement therapy sessions', 'Led weekly therapeutic movement groups with 15-20 participants', 'Developed "Movement for Healing" 12-week structured program', 'Achieved 85% client improvement in somatic awareness measures', 'Maintained 92% client satisfaction rate in 6-month follow-ups'],
 'Portland, OR', 2, true, NOW(), NULL::uuid),

('1b90b431-de09-4b75-af6a-c94975b68746',
 'Portland Mental Health Center',
 'Dance/Movement Therapist',
 '2014-06-01'::date, '2017-12-31'::date, false, 'FULL_TIME',
 'Delivered dance/movement therapy in outpatient mental health setting. Worked with diverse populations including trauma survivors, eating disorder clients, and individuals with anxiety and depression. Collaborated with multidisciplinary team including psychologists, social workers, and art therapists.',
 ARRAY['Conducted over 400 DMT sessions using trauma-informed approaches', 'Co-facilitated women''s trauma recovery group for 3 consecutive years', 'Developed movement assessment protocols for clinical intake process', 'Trained clinical staff in basic somatic awareness techniques', 'Presented DMT research findings at 2 national conferences'],
 'Portland, OR', 3, true, NOW(), NULL::uuid),

('1b90b431-de09-4b75-af6a-c94975b68746',
 'Columbia College Chicago',
 'Dance/Movement Therapy Clinical Internship',
 '2013-01-01'::date, '2014-05-31'::date, false, 'INTERNSHIP',
 'Completed 700+ hours of supervised clinical dance/movement therapy training. Practiced movement assessment, therapeutic intervention, and clinical documentation. Worked with children, adolescents, and adults in various clinical settings including hospitals and community centers.',
 ARRAY['Completed 700+ clinical hours in dance/movement therapy practice', 'Received training in movement-based assessment techniques', 'Developed therapeutic intervention skills across diverse populations', 'Practiced clinical documentation and case analysis', 'Gained experience in hospital, school, and community settings'],
 'Chicago, IL', 4, true, NOW(), NULL::uuid);

-- PASO 3: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('1b90b431-de09-4b75-af6a-c94975b68746', 'Dance/Movement Therapy', 'EXPERT', 11, 'Clinical Practice'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Somatic Psychology', 'EXPERT', 10, 'Clinical Practice'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Movement Analysis', 'EXPERT', 11, 'Assessment'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Laban Movement Analysis', 'ADVANCED', 9, 'Assessment Method'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Authentic Movement', 'EXPERT', 10, 'Therapeutic Modality'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Trauma-Informed Movement', 'EXPERT', 9, 'Specialization'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Body-Mind Connection', 'EXPERT', 11, 'Clinical Practice'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Expressive Arts Therapy', 'ADVANCED', 8, 'Clinical Practice'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Movement Assessment', 'EXPERT', 11, 'Assessment'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Somatic Experiencing', 'ADVANCED', 7, 'Therapeutic Approach'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Group Facilitation', 'EXPERT', 10, 'Group Work'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Nonverbal Communication', 'EXPERT', 11, 'Clinical Skills'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Creative Arts Therapies', 'ADVANCED', 9, 'Clinical Practice'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Therapeutic Movement', 'EXPERT', 11, 'Clinical Practice'),
('1b90b431-de09-4b75-af6a-c94975b68746', 'Dance Improvisation', 'ADVANCED', 11, 'Technique');

-- PASO 4: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('1b90b431-de09-4b75-af6a-c94975b68746', 'CERTIFICATION', 'Registered Dance/Movement Therapist (R-DMT)', 'American Dance Therapy Association', '2014-06-01'::date,
 'Professional registration as Dance/Movement Therapist demonstrating completion of graduate training, supervised clinical hours, and competency in dance/movement therapy practice.'),

('1b90b431-de09-4b75-af6a-c94975b68746', 'CERTIFICATION', 'Licensed Professional Counselor (LPC)', 'Oregon Board of Licensed Professional Counselors and Therapists', '2015-03-01'::date,
 'State licensure to practice mental health counseling in Oregon, demonstrating clinical competency and adherence to ethical standards.'),

('1b90b431-de09-4b75-af6a-c94975b68746', 'CERTIFICATION', 'Somatic Experiencing Practitioner (SEP)', 'Somatic Experiencing Trauma Institute', '2017-09-01'::date,
 'Certification in Somatic Experiencing approach to trauma resolution, including three-year training program in body-based trauma healing.'),

('1b90b431-de09-4b75-af6a-c94975b68746', 'CERTIFICATION', 'Laban Certified Movement Analyst (LCMA)', 'Laban/Bartenieff Institute of Movement Studies', '2016-11-01'::date,
 'Professional certification in Laban Movement Analysis, including comprehensive training in movement observation, analysis, and application to therapy and education.');

-- VERIFICACIÓN FINAL
SELECT
    '========== NICOLE TAYLOR CREADO ==========' as status,
    p.id as uuid,
    p.full_name, p.email, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '1b90b431-de09-4b75-af6a-c94975b68746';

-- RESULTADO ESPERADO:
-- uuid: 1b90b431-de09-4b75-af6a-c94975b68746
-- full_name: Nicole Taylor
-- email: nicole.taylor@iseih.edu
-- slug: nicole-taylor
-- exp: 4, skills: 15, certs: 4
