-- ============================================================================
-- AGREGAR CERTIFICACIONES FALTANTES
-- Objetivo: Todos los perfiles deben tener mínimo 3 certificaciones
-- ============================================================================

-- ====================
-- Daniel Foster (2 → 3+ certs) - Data Analysis
-- ====================
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id as profile_id,
    'CERTIFICATION' as type,
    'Advanced Statistical Methods in Health Research' as title,
    'American Statistical Association' as issuer,
    '2019-06' as issue_date,
    'Advanced certification in statistical analysis methods specifically designed for health and wellness research applications.' as description
FROM public.profiles
WHERE full_name = 'Daniel Foster'
  AND NOT EXISTS (
    SELECT 1 FROM public.portfolio_items
    WHERE profile_id = profiles.id
      AND type = 'CERTIFICATION'
      AND title = 'Advanced Statistical Methods in Health Research'
  );

-- ====================
-- Lisa Morrison (2 → 3+ certs) - Art Therapy
-- ====================
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id as profile_id,
    'CERTIFICATION' as type,
    'Trauma-Informed Expressive Arts Therapy' as title,
    'Expressive Arts Therapy Association' as issuer,
    '2018-08' as issue_date,
    'Specialized training in using expressive arts modalities with trauma survivors, integrating safety protocols and therapeutic containment.' as description
FROM public.profiles
WHERE full_name = 'Lisa Morrison'
  AND NOT EXISTS (
    SELECT 1 FROM public.portfolio_items
    WHERE profile_id = profiles.id
      AND type = 'CERTIFICATION'
      AND title = 'Trauma-Informed Expressive Arts Therapy'
  );

-- ====================
-- Marcus Williams (2 → 3+ certs) - Drama Therapy
-- ====================
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id as profile_id,
    'CERTIFICATION' as type,
    'Theatre of the Oppressed Facilitator Training' as title,
    'Theatre of the Oppressed NYC' as issuer,
    '2017-05' as issue_date,
    'Comprehensive training in facilitating Theatre of the Oppressed workshops for community development and social change.' as description
FROM public.profiles
WHERE full_name = 'Marcus Williams'
  AND NOT EXISTS (
    SELECT 1 FROM public.portfolio_items
    WHERE profile_id = profiles.id
      AND type = 'CERTIFICATION'
      AND title = 'Theatre of the Oppressed Facilitator Training'
  );

-- ====================
-- Patricia Coleman (2 → 3+ certs) - Research Methodology
-- ====================
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id as profile_id,
    'CERTIFICATION' as type,
    'Qualitative Research Methods in Health Sciences' as title,
    'Sage Research Methods' as issuer,
    '2018-09' as issue_date,
    'Advanced certification in qualitative research methodologies including grounded theory, phenomenology, and narrative analysis for health research.' as description
FROM public.profiles
WHERE full_name = 'Patricia Coleman'
  AND NOT EXISTS (
    SELECT 1 FROM public.portfolio_items
    WHERE profile_id = profiles.id
      AND type = 'CERTIFICATION'
      AND title = 'Qualitative Research Methods in Health Sciences'
  );

-- ====================
-- Thomas Rivera (2 → 3+ certs) - Perennial Philosophies
-- ====================
INSERT INTO public.portfolio_items (profile_id, type, title, issuer, issue_date, description)
SELECT
    id as profile_id,
    'CERTIFICATION' as type,
    'Philosophy for Life Facilitator Certification' as title,
    'Modern Stoicism Organization' as issuer,
    '2017-11' as issue_date,
    'Training in facilitating philosophical inquiry groups and applying ancient wisdom traditions to contemporary life challenges.' as description
FROM public.profiles
WHERE full_name = 'Thomas Rivera'
  AND NOT EXISTS (
    SELECT 1 FROM public.portfolio_items
    WHERE profile_id = profiles.id
      AND type = 'CERTIFICATION'
      AND title = 'Philosophy for Life Facilitator Certification'
  );

-- ====================
-- VERIFICACIÓN
-- ====================
SELECT
    p.full_name,
    COUNT(*) as total_certifications,
    string_agg(pi.title, ' | ' ORDER BY pi.issue_date DESC) as certifications_list
FROM public.profiles p
LEFT JOIN public.portfolio_items pi ON pi.profile_id = p.id AND pi.type = 'CERTIFICATION'
WHERE p.full_name IN ('Daniel Foster', 'Lisa Morrison', 'Marcus Williams', 'Patricia Coleman', 'Thomas Rivera')
GROUP BY p.id, p.full_name
ORDER BY p.full_name;

-- Resultado esperado: todos con >= 3 certificaciones
