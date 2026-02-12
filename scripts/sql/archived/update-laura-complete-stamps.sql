-- =====================================================
-- COMPLETE STAMPS UPDATE FOR LAURA MARTÍNEZ VIDAL
-- Arquitecto Técnico | Especialista en obra residencial y comercial
-- UUID: bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e
-- =====================================================
-- Includes: EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE
-- =====================================================

-- Clear previous stamps (optional - uncomment if needed)
-- DELETE FROM stamps WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';

-- EMAIL VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  'EMAIL', 'VERIFIED',
  '{"email": "laura.martinez@example.com", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- IDENTITY VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  'IDENTITY', 'VERIFIED',
  '{"document_type": "DNI", "document_number": "****456L", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- EDUCATION VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  'EDUCATION', 'VERIFIED',
  '{"degree": "Grado en Arquitectura Técnica", "institution": "Universidad de Sevilla", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- EMPLOYMENT VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  'EMPLOYMENT', 'VERIFIED',
  '{"position": "Directora de Ejecución de Obra", "company": "Constructora Residencial S.L.", "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- LANGUAGE VERIFICATION
INSERT INTO stamps (
  profile_id, type, status, evidence, provider, verified_at, created_at
) VALUES (
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  'LANGUAGE', 'VERIFIED',
  '{"languages": ["Español (Native)", "Inglés (C1)", "Portugués (B1)"], "verified_method": "manual_admin"}'::jsonb,
  'manual', NOW(), NOW()
) ON CONFLICT DO NOTHING;

-- VERIFICATION SUMMARY
SELECT
  'LAURA MARTÍNEZ VIDAL - STAMPS' as usuario,
  type::text,
  status,
  verified_at
FROM stamps
WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
ORDER BY created_at DESC;
