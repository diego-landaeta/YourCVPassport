-- ============================================================================
-- EJECUTAR TODOS LOS 9 TUTORES ISEIH FALTANTES
-- ============================================================================
-- Este script ejecuta todos los 9 tutores en orden
-- IMPORTANTE: Ejecuta esto en Supabase SQL Editor
-- Tiempo estimado: 2-3 minutos
-- ============================================================================

-- TUTOR 1: Karen White - Holistic Nutrition
\i create-karen-white.sql

-- TUTOR 2: Paul Henderson - Herbal Medicine
\i create-paul-henderson.sql

-- TUTOR 3: Jessica Porter - Biofeedback
\i create-jessica-porter.sql

-- TUTOR 4: Alex Martinez - AI in Health
\i create-alex-martinez.sql

-- TUTOR 5: Diana Russell - Massage Therapy
\i create-diana-russell.sql

-- TUTOR 6: Michelle Chang - Reiki
\i create-michelle-chang.sql

-- TUTOR 7: Robert Kim - Acupressure
\i create-robert-kim.sql

-- TUTOR 8: Catherine Adams - Couples Therapy
\i create-catherine-adams.sql

-- TUTOR 9: Mark Davidson - Nonviolent Communication
\i create-mark-davidson.sql

-- ============================================================================
-- VERIFICACIÓN FINAL: Ver todos los tutores creados
-- ============================================================================
SELECT
    full_name,
    email,
    role,
    wizard_completed,
    slug,
    template,
    LENGTH(headline) as headline_len,
    (SELECT COUNT(*) FROM experiences WHERE profile_id = profiles.id) as exp,
    (SELECT COUNT(*) FROM skills WHERE profile_id = profiles.id) as skills,
    (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = profiles.id) as certs
FROM public.profiles
WHERE id IN (
    '0bfd1ef4-c6b0-451c-8637-77b534e6e9a1',  -- Karen White
    '36c177f5-19f4-47c7-85c7-05507347e702',  -- Paul Henderson
    '55333d11-13c8-43b8-942b-cb1e75d0b812',  -- Jessica Porter
    '099840cc-a99c-480d-8fd9-fba5ecd5a4a6',  -- Alex Martinez
    '636e9e4d-4873-4114-8949-376a8d0f24bc',  -- Diana Russell
    'f30db5f9-0807-4d48-aa76-de4b6d7278da',  -- Michelle Chang
    '9fdf9c06-9f69-47de-bd73-7f2a2fb4d5da',  -- Robert Kim
    'ce98b4d3-9e58-4f38-98be-8e4fd94d6b15',  -- Catherine Adams
    '707aa7e3-b891-485c-b4e6-618625713565'   -- Mark Davidson
)
ORDER BY full_name;

-- ============================================================================
-- ESPERADO:
-- ============================================================================
-- 9 tutores creados
-- Todos con:
--   - role = 'professional'
--   - wizard_completed = true
--   - slug existe
--   - template = 'ModernProfessional'
--   - headline_len >= 30
--   - exp = 4
--   - skills = 15
--   - certs = 4
-- ============================================================================
