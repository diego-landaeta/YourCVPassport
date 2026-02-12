-- ============================================================================
-- CREAR CATHERINE ADAMS - COUPLES THERAPY
-- ============================================================================
-- UUID: ce98b4d3-9e58-4f38-98be-8e4fd94d6b15
-- Email: catherine.adams@iseih.edu
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = 'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15';
DELETE FROM public.skills WHERE profile_id = 'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15';
DELETE FROM public.experiences WHERE profile_id = 'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Catherine Adams',
    headline = 'Licensed Marriage and Family Therapist Specializing in Relationship Dynamics',
    summary = 'Licensed Marriage and Family Therapist with 10 years of experience helping couples improve communication and deepen intimacy. Certified in Gottman Method and Imago Relationship Therapy. Passionate about teaching evidence-based communication skills that transform relationships and help couples build lasting connections.',
    role = 'professional',
    plan = 'free',
    email = 'catherine.adams@iseih.edu',
    phone = '+1-503-555-0109',
    location = 'Portland, Oregon, USA',
    linkedin_url = 'https://linkedin.com/in/catherineadams-lmft',
    portfolio_url = 'https://catherineadamstherapy.com',
    wizard_completed = true,
    slug = 'catherine-adams',
    template = 'passport',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = 'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15';

-- PASO 3: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Couples Therapy Instructor',
 '2020-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching relationship therapy and conscious communication techniques to therapists and wellness professionals. Developing curriculum based on evidence-based methods for improving couple dynamics.',
 ARRAY['Couples therapy instruction', 'Communication skills training', 'Relationship dynamics education', 'Evidence-based methods teaching'],
 'Remote', 1, true, NOW(), NULL::uuid),

('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15',
 'Private Therapy Practice',
 'Marriage and Family Therapist',
 '2019-01-01'::date, NULL::date, true, 'FREELANCE',
 'Providing couples therapy and relationship counseling in private practice. Specializing in communication patterns, conflict resolution, and intimacy deepening using Gottman Method and Imago approaches.',
 ARRAY['Couples therapy sessions', 'Communication pattern analysis', 'Conflict resolution coaching', 'Intimacy work', 'Relationship workshops'],
 'Portland, OR', 2, true, NOW(), NULL::uuid),

('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15',
 'Family Therapy Clinic',
 'Licensed Marriage and Family Therapist',
 '2014-06-01'::date, '2018-12-31'::date, false, 'FULL_TIME',
 'Provided couples and family therapy in clinical setting. Used evidence-based approaches including Gottman Method for relationship improvement. Facilitated couples communication workshops.',
 ARRAY['Couples therapy', 'Family systems therapy', 'Gottman Method application', 'Communication workshops', 'Clinical supervision'],
 'Portland, OR', 3, true, NOW(), NULL::uuid),

('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15',
 'University of Oregon Graduate Program',
 'LMFT Clinical Internship',
 '2013-09-01'::date, '2014-05-31'::date, false, 'INTERNSHIP',
 'Completed clinical hours working with couples and families under supervision. Gained foundational experience in relationship therapy, assessment, and therapeutic intervention.',
 ARRAY['Clinical therapy hours', 'Couples assessment', 'Therapeutic intervention', 'Clinical supervision'],
 'Portland, OR', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Couples Therapy', 'EXPERT', 10, 'Clinical Practice'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Gottman Method', 'EXPERT', 8, 'Specialization'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Imago Relationship Therapy', 'ADVANCED', 7, 'Specialization'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Communication Skills Training', 'EXPERT', 10, 'Clinical Practice'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Conflict Resolution', 'EXPERT', 10, 'Clinical Practice'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Marriage Therapy', 'EXPERT', 10, 'Clinical Practice'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Family Systems Therapy', 'ADVANCED', 9, 'Clinical Practice'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Intimacy Counseling', 'ADVANCED', 9, 'Specialization'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Relationship Assessment', 'EXPERT', 10, 'Clinical Practice'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Attachment Theory', 'ADVANCED', 9, 'Clinical Practice'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Emotionally Focused Therapy', 'ADVANCED', 8, 'Clinical Practice'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Workshop Facilitation', 'EXPERT', 8, 'Education'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Relationship Education', 'EXPERT', 10, 'Education'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Clinical Supervision', 'ADVANCED', 6, 'Clinical Practice'),
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'Evidence-Based Practice', 'EXPERT', 10, 'Clinical Practice');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'CERTIFICATION', 'Licensed Marriage and Family Therapist', 'Oregon Board of Licensed Professional Counselors and Therapists', '2014-06-01'::date,
 'State licensure to practice marriage and family therapy with comprehensive training in couples therapy, family systems, and clinical practice.'),

('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'CERTIFICATION', 'Gottman Method Couples Therapist', 'The Gottman Institute', '2016-09-01'::date,
 'Professional certification in Gottman Method Couples Therapy, an evidence-based approach to relationship improvement based on decades of research.'),

('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'CERTIFICATION', 'Imago Relationship Therapy Practitioner', 'Imago Relationships International', '2018-03-01'::date,
 'Certification in Imago Relationship Therapy approach for helping couples understand relationship patterns and create conscious partnerships.'),

('ce98b4d3-9e58-4f38-98be-8e4fd94d6b15', 'CERTIFICATION', 'Clinical Supervisor', 'American Association for Marriage and Family Therapy', '2019-11-01'::date,
 'Approved supervisor certification for providing clinical supervision to marriage and family therapy students and associates.');

-- VERIFICACIÓN FINAL
SELECT
    'Catherine Adams - LISTO' as status,
    p.full_name, p.role, p.wizard_completed, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = 'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15';
