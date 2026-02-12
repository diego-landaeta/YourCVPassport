-- ============================================================================
-- CREAR MARK DAVIDSON - NONVIOLENT COMMUNICATION
-- ============================================================================
-- UUID: 707aa7e3-b891-485c-b4e6-618625713565
-- Email: mark.davidson@iseih.edu
-- ============================================================================

-- PASO 1: Eliminar datos existentes
DELETE FROM public.portfolio_items WHERE profile_id = '707aa7e3-b891-485c-b4e6-618625713565';
DELETE FROM public.skills WHERE profile_id = '707aa7e3-b891-485c-b4e6-618625713565';
DELETE FROM public.experiences WHERE profile_id = '707aa7e3-b891-485c-b4e6-618625713565';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = 'Mark Davidson',
    headline = 'Certified Nonviolent Communication Trainer and Conflict Resolution Specialist',
    summary = 'Certified Nonviolent Communication Trainer with 9 years of experience teaching empathetic communication and conflict resolution. Specialized in facilitating NVC processes in communities, schools, and organizations. Passionate about helping people communicate with empathy and authenticity even in difficult situations.',
    role = 'professional',
    plan = 'free',
    email = 'mark.davidson@iseih.edu',
    phone = '+1-503-555-0110',
    location = 'Portland, Oregon, USA',
    linkedin_url = 'https://linkedin.com/in/markdavidson-nvc',
    portfolio_url = 'https://markdavidsonnvc.com',
    wizard_completed = true,
    slug = 'mark-davidson',
    template = 'passport',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = '707aa7e3-b891-485c-b4e6-618625713565';

-- PASO 3: Insertar experiencias
INSERT INTO public.experiences (
    profile_id, company_name, position, start_date, end_date, is_current,
    employment_type, description, achievements, location, sort_order,
    verified, verified_at, verified_by
) VALUES
('707aa7e3-b891-485c-b4e6-618625713565',
 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos',
 'Nonviolent Communication Instructor',
 '2020-01-01'::date, NULL::date, true, 'PART_TIME',
 'Teaching Nonviolent Communication principles and practices to wellness professionals and therapists. Developing curriculum that makes NVC accessible and applicable to various professional contexts.',
 ARRAY['NVC instruction', 'Empathetic communication training', 'Conflict resolution education', 'Professional skill development'],
 'Remote', 1, true, NOW(), NULL::uuid),

('707aa7e3-b891-485c-b4e6-618625713565',
 'Conscious Communication Training',
 'Independent NVC Trainer and Mediator',
 '2019-01-01'::date, NULL::date, true, 'FREELANCE',
 'Facilitating Nonviolent Communication workshops, mediation sessions, and conflict resolution processes. Working with individuals, couples, organizations, and community groups to develop empathetic communication skills.',
 ARRAY['NVC workshops', 'Mediation facilitation', 'Conflict resolution', 'Organizational training', 'Community facilitation'],
 'Portland, OR', 2, true, NOW(), NULL::uuid),

('707aa7e3-b891-485c-b4e6-618625713565',
 'Community Mediation Center',
 'Community Mediator',
 '2015-06-01'::date, '2018-12-31'::date, false, 'FULL_TIME',
 'Facilitated community mediation processes using NVC and restorative justice principles. Mediated conflicts in schools, neighborhoods, and community organizations.',
 ARRAY['Community mediation', 'Restorative justice facilitation', 'School conflict resolution', 'Neighborhood dispute mediation', 'Group facilitation'],
 'Portland, OR', 3, true, NOW(), NULL::uuid),

('707aa7e3-b891-485c-b4e6-618625713565',
 'Portland State University',
 'Conflict Resolution Graduate Program',
 '2013-09-01'::date, '2015-05-31'::date, false, 'INTERNSHIP',
 'Completed graduate training in conflict resolution and peace studies. Gained foundational experience in mediation, facilitation, and communication theory.',
 ARRAY['Conflict resolution theory', 'Mediation training', 'Facilitation skills', 'Communication studies'],
 'Portland, OR', 4, true, NOW(), NULL::uuid);

-- PASO 4: Insertar skills
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('707aa7e3-b891-485c-b4e6-618625713565', 'Nonviolent Communication', 'EXPERT', 9, 'Clinical Practice'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Conflict Resolution', 'EXPERT', 9, 'Clinical Practice'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Mediation', 'EXPERT', 9, 'Clinical Practice'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Empathetic Communication', 'EXPERT', 9, 'Clinical Practice'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Restorative Justice', 'ADVANCED', 8, 'Specialization'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Workshop Facilitation', 'EXPERT', 9, 'Education'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Group Facilitation', 'EXPERT', 9, 'Clinical Practice'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Active Listening', 'EXPERT', 9, 'Clinical Practice'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Needs-Based Communication', 'EXPERT', 9, 'Clinical Practice'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Community Building', 'ADVANCED', 8, 'Clinical Practice'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Organizational Training', 'ADVANCED', 7, 'Education'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Compassionate Communication', 'EXPERT', 9, 'Clinical Practice'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Emotional Intelligence', 'ADVANCED', 8, 'Clinical Practice'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Peace Education', 'ADVANCED', 9, 'Education'),
('707aa7e3-b891-485c-b4e6-618625713565', 'Interpersonal Communication', 'EXPERT', 9, 'Clinical Practice');

-- PASO 5: Insertar certificaciones
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('707aa7e3-b891-485c-b4e6-618625713565', 'CERTIFICATION', 'Certified Nonviolent Communication Trainer', 'Center for Nonviolent Communication', '2016-06-01'::date,
 'Professional certification to train others in Nonviolent Communication, including comprehensive mastery of NVC principles, facilitation skills, and training methodology.'),

('707aa7e3-b891-485c-b4e6-618625713565', 'CERTIFICATION', 'Certified Mediator', 'Oregon Mediation Association', '2015-09-01'::date,
 'Professional certification in mediation with training in conflict resolution processes, mediation ethics, and facilitation techniques.'),

('707aa7e3-b891-485c-b4e6-618625713565', 'CERTIFICATION', 'Restorative Justice Facilitator', 'Restorative Justice International', '2017-03-01'::date,
 'Certification in restorative justice practices including circle processes, community conferencing, and restorative approaches to conflict.'),

('707aa7e3-b891-485c-b4e6-618625713565', 'CERTIFICATION', 'Master of Arts in Conflict Resolution', 'Portland State University', '2015-05-01'::date,
 'Graduate degree in conflict resolution covering mediation theory, peace studies, communication, and practical conflict intervention skills.');

-- VERIFICACIÓN FINAL
SELECT
    'Mark Davidson - LISTO' as status,
    p.full_name, p.role, p.wizard_completed, p.slug, p.template,
    LENGTH(p.summary) as summary_chars, LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '707aa7e3-b891-485c-b4e6-618625713565';
