-- =====================================================
-- COMPLETE STAMPS UPDATE FOR MARTA RUIZ SERRANO
-- Ingeniera de Energías Renovables
-- UUID: e379dca2-0b33-45b4-864a-ba9204e0ab4b
-- =====================================================
-- Includes: EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE, CERTIFICATION
-- =====================================================

-- Clear previous stamps (optional - uncomment if needed)
-- DELETE FROM stamps WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b';

-- EMAIL VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'EMAIL', 'VERIFIED',
  '{"email": "marta.ruiz@example.com", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- IDENTITY VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'IDENTITY', 'VERIFIED',
  '{"document_type": "DNI", "document_number": "****789M", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- EDUCATION VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'EDUCATION', 'VERIFIED',
  '{"degree": "Grado en Ingeniería de Energías Renovables", "institution": "Universidad Politécnica de Valencia", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- EMPLOYMENT VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'EMPLOYMENT', 'VERIFIED',
  '{"position": "Ingeniera de Instalaciones Térmicas", "company": "Empresa de Energías Renovables", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- LANGUAGE VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'LANGUAGE', 'VERIFIED',
  '{"languages": ["Español (Native)", "Inglés (C1)", "Alemán (B1)"], "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- VERIFICATION SUMMARY
SELECT
  'MARTA RUIZ SERRANO - STAMPS' as usuario,
  type::text,
  status,
  verified_at
FROM stamps
WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b'
ORDER BY created_at DESC;
