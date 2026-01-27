-- =====================================================
-- COMPLETE STAMPS UPDATE FOR JAVIER TORRES GIMENO
-- Ingeniero Industrial | Especialista en HVAC
-- UUID: a826c47c-0d50-47da-aab3-4dfb71da709d
-- =====================================================
-- Includes: EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE
-- =====================================================

-- Clear previous stamps (optional - uncomment if needed)
-- DELETE FROM stamps WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d';

-- EMAIL VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'EMAIL', 'VERIFIED',
  '{"email": "javier.torres@example.com", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- IDENTITY VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'IDENTITY', 'VERIFIED',
  '{"document_type": "DNI", "document_number": "****123J", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- EDUCATION VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'EDUCATION', 'VERIFIED',
  '{"degree": "Grado en Ingeniería Industrial", "institution": "Universidad Politécnica de Madrid", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- EMPLOYMENT VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'EMPLOYMENT', 'VERIFIED',
  '{"position": "Ingeniero HVAC Senior", "company": "Empresa de Climatización Industrial", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- LANGUAGE VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'LANGUAGE', 'VERIFIED',
  '{"languages": ["Español (Native)", "Inglés (B2)", "Francés (A2)"], "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- VERIFICATION SUMMARY
SELECT
  'JAVIER TORRES GIMENO - STAMPS' as usuario,
  type::text,
  status,
  verified_at
FROM stamps
WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d'
ORDER BY created_at DESC;
