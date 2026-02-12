-- ============================================================================
-- TEMPLATE: CREAR TUTOR ISEIH
-- ============================================================================
-- INSTRUCCIONES:
-- 1. Reemplazar todos los [PLACEHOLDERS] con valores reales
-- 2. Verificar que el UUID existe en auth.users antes de ejecutar
-- 3. Ajustar número de experiencias, skills, y certificaciones según necesidad
-- 4. Ejecutar script completo en Supabase SQL Editor
-- 5. Verificar resultado final
-- ============================================================================

-- PASO 1: Eliminar datos existentes (si es re-ejecución)
DELETE FROM public.portfolio_items WHERE profile_id = '[UUID]';
DELETE FROM public.skills WHERE profile_id = '[UUID]';
DELETE FROM public.experiences WHERE profile_id = '[UUID]';

-- PASO 2: Actualizar perfil base
UPDATE public.profiles
SET
    full_name = '[NOMBRE COMPLETO]',
    headline = '[HEADLINE DE 30+ CARACTERES - Ej: Naturopathic Doctor Specializing in Evidence-Based Natural Medicine]',
    summary = '[SUMMARY DE 200-800 CARACTERES: Experiencia + especialización + enfoque + pasión]',
    role = 'professional',
    plan = 'free',
    email = '[email@iseih.edu]',
    phone = '[+1-XXX-XXX-XXXX]',
    location = '[Ciudad, Estado, País]',
    linkedin_url = '[https://linkedin.com/in/...]',
    portfolio_url = '[https://...]',
    wizard_completed = true,
    slug = '[nombre-apellido-en-minusculas]',
    template = 'ModernProfessional',
    profile_hidden = false,
    updated_at = NOW()
WHERE id = '[UUID]';

-- PASO 3: Insertar experiencias (MÍNIMO 4)
INSERT INTO public.experiences (
    profile_id,
    company_name,
    position,
    start_date,
    end_date,
    is_current,
    employment_type,
    description,
    achievements,
    location,
    sort_order,
    verified,
    verified_at,
    verified_by
) VALUES
-- Experiencia 1 (más reciente)
('[UUID]',
 '[Nombre de la empresa/institución 1]',
 '[Título del puesto 1]',
 '[YYYY-MM-DD]'::date,
 NULL::date,  -- Si es trabajo actual
 true,        -- is_current: true si es trabajo actual
 'PART_TIME', -- FULL_TIME, PART_TIME, FREELANCE, INTERNSHIP
 '[Descripción del puesto 1 - qué hace actualmente]',
 ARRAY['[Achievement 1]', '[Achievement 2]', '[Achievement 3]'],
 '[Ubicación 1]',
 1,
 true,
 NOW(),
 NULL::uuid),

-- Experiencia 2
('[UUID]',
 '[Nombre de la empresa/institución 2]',
 '[Título del puesto 2]',
 '[YYYY-MM-DD]'::date,
 NULL::date,  -- o '[YYYY-MM-DD]'::date si terminó
 true,        -- is_current: true/false
 'FREELANCE', -- Ajustar según tipo
 '[Descripción del puesto 2]',
 ARRAY['[Achievement 1]', '[Achievement 2]', '[Achievement 3]'],
 '[Ubicación 2]',
 2,
 true,
 NOW(),
 NULL::uuid),

-- Experiencia 3
('[UUID]',
 '[Nombre de la empresa/institución 3]',
 '[Título del puesto 3]',
 '[YYYY-MM-DD]'::date,
 '[YYYY-MM-DD]'::date,
 false,
 'FULL_TIME',
 '[Descripción del puesto 3]',
 ARRAY['[Achievement 1]', '[Achievement 2]', '[Achievement 3]', '[Achievement 4]'],
 '[Ubicación 3]',
 3,
 true,
 NOW(),
 NULL::uuid),

-- Experiencia 4
('[UUID]',
 '[Nombre de la empresa/institución 4]',
 '[Título del puesto 4]',
 '[YYYY-MM-DD]'::date,
 '[YYYY-MM-DD]'::date,
 false,
 'INTERNSHIP',
 '[Descripción del puesto 4]',
 ARRAY['[Achievement 1]', '[Achievement 2]', '[Achievement 3]'],
 '[Ubicación 4]',
 4,
 true,
 NOW(),
 NULL::uuid);

-- PASO 4: Insertar skills (MÍNIMO 12-15)
INSERT INTO public.skills (profile_id, name, level, years_of_experience, category) VALUES
('[UUID]', '[Skill 1]', 'EXPERT', 11, '[Categoría 1]'),
('[UUID]', '[Skill 2]', 'EXPERT', 10, '[Categoría 1]'),
('[UUID]', '[Skill 3]', 'EXPERT', 9, '[Categoría 1]'),
('[UUID]', '[Skill 4]', 'ADVANCED', 8, '[Categoría 2]'),
('[UUID]', '[Skill 5]', 'ADVANCED', 7, '[Categoría 2]'),
('[UUID]', '[Skill 6]', 'ADVANCED', 6, '[Categoría 2]'),
('[UUID]', '[Skill 7]', 'ADVANCED', 5, '[Categoría 3]'),
('[UUID]', '[Skill 8]', 'ADVANCED', 5, '[Categoría 3]'),
('[UUID]', '[Skill 9]', 'INTERMEDIATE', 4, '[Categoría 4]'),
('[UUID]', '[Skill 10]', 'INTERMEDIATE', 4, '[Categoría 4]'),
('[UUID]', '[Skill 11]', 'INTERMEDIATE', 3, '[Categoría 5]'),
('[UUID]', '[Skill 12]', 'INTERMEDIATE', 3, '[Categoría 5]'),
('[UUID]', '[Skill 13]', 'ADVANCED', 6, '[Categoría 6]'),
('[UUID]', '[Skill 14]', 'EXPERT', 10, '[Categoría 1]'),
('[UUID]', '[Skill 15]', 'EXPERT', 9, '[Categoría 1]');

-- PASO 5: Insertar certificaciones (MÍNIMO 3-4)
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description) VALUES
('[UUID]',
 'CERTIFICATION',
 '[Nombre de la certificación 1]',
 '[Institución emisora 1]',
 '[YYYY-MM-DD]'::date,
 '[Descripción de la certificación 1 - qué cubre, qué autoriza]'),

('[UUID]',
 'CERTIFICATION',
 '[Nombre de la certificación 2]',
 '[Institución emisora 2]',
 '[YYYY-MM-DD]'::date,
 '[Descripción de la certificación 2]'),

('[UUID]',
 'CERTIFICATION',
 '[Nombre de la certificación 3]',
 '[Institución emisora 3]',
 '[YYYY-MM-DD]'::date,
 '[Descripción de la certificación 3]'),

('[UUID]',
 'CERTIFICATION',
 '[Nombre de la certificación 4]',
 '[Institución emisora 4]',
 '[YYYY-MM-DD]'::date,
 '[Descripción de la certificación 4]');

-- PASO 6: VERIFICACIÓN FINAL
SELECT
    '[NOMBRE] - LISTO' as status,
    p.full_name,
    p.role,
    p.wizard_completed,
    p.slug,
    p.template,
    p.profile_hidden,
    LENGTH(p.summary) as summary_chars,
    LENGTH(p.headline) as headline_chars,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiencias,
    (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs
FROM public.profiles p
WHERE p.id = '[UUID]';

-- ============================================================================
-- CHECKLIST POST-EJECUCIÓN:
-- ============================================================================
-- [ ] Verificación retorna datos completos
-- [ ] role = 'professional'
-- [ ] wizard_completed = true
-- [ ] slug existe (ej: 'nombre-apellido')
-- [ ] template = 'ModernProfessional'
-- [ ] profile_hidden = false
-- [ ] summary_chars entre 200-800
-- [ ] headline_chars >= 30
-- [ ] experiencias >= 4
-- [ ] skills >= 12
-- [ ] certs >= 3
-- [ ] Refrescar https://yourcvpassport.com/companies/search con Ctrl+F5
-- [ ] Perfil aparece en la lista
-- ============================================================================
