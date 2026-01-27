-- =====================================================
-- ADD VERIFICATION STAMPS FOR MARTA RUIZ SERRANO
-- Ingeniera de Energías Renovables
-- UUID: e379dca2-0b33-45b4-864a-ba9204e0ab4b
-- =====================================================

-- Limpiar stamps previos de este usuario (opcional)
DELETE FROM stamps WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b';

-- EMAIL VERIFICATION STAMP
INSERT INTO stamps (
  profile_id,
  type,
  status,
  evidence,
  provider,
  verified_at,
  created_at
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'EMAIL',
  'VERIFIED',
  '{"email": "marta.ruiz@example.com", "verified_method": "manual_admin"}'::jsonb,
  'manual',
  NOW(),
  NOW()
);

-- IDENTITY VERIFICATION STAMP
INSERT INTO stamps (
  profile_id,
  type,
  status,
  evidence,
  provider,
  verified_at,
  created_at
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'IDENTITY',
  'VERIFIED',
  '{"document_type": "DNI", "document_number": "****789M", "verified_method": "manual_admin"}'::jsonb,
  'manual',
  NOW(),
  NOW()
);

-- EDUCATION VERIFICATION STAMP
INSERT INTO stamps (
  profile_id,
  type,
  status,
  evidence,
  provider,
  verified_at,
  created_at
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'EDUCATION',
  'VERIFIED',
  '{"degree": "Grado en Ingeniería de Energías Renovables", "institution": "Universidad Politécnica de Valencia", "verified_method": "manual_admin"}'::jsonb,
  'manual',
  NOW(),
  NOW()
);

-- EMPLOYMENT VERIFICATION STAMP
INSERT INTO stamps (
  profile_id,
  type,
  status,
  evidence,
  provider,
  verified_at,
  created_at
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'EMPLOYMENT',
  'VERIFIED',
  '{"position": "Ingeniera de Instalaciones Térmicas", "company": "Empresa de Energías Renovables", "verified_method": "manual_admin"}'::jsonb,
  'manual',
  NOW(),
  NOW()
);

-- LANGUAGE VERIFICATION STAMP
INSERT INTO stamps (
  profile_id,
  type,
  status,
  evidence,
  provider,
  verified_at,
  created_at
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'LANGUAGE',
  'VERIFIED',
  '{"languages": ["Español (Native)", "Inglés (C1)", "Alemán (B1)"], "verified_method": "manual_admin"}'::jsonb,
  'manual',
  NOW(),
  NOW()
);

-- Verificar stamps insertados
SELECT
  'STAMPS INSERTADOS' as resultado,
  id,
  type::text,
  status,
  evidence,
  verified_at,
  created_at
FROM stamps
WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b'
ORDER BY created_at DESC;

-- Resumen
SELECT
  'RESUMEN' as check_type,
  COUNT(*) as total_stamps,
  COUNT(*) FILTER (WHERE status = 'VERIFIED') as verificados,
  COUNT(*) FILTER (WHERE type = 'EMAIL') as email_stamps,
  COUNT(*) FILTER (WHERE type = 'IDENTITY') as identity_stamps,
  COUNT(*) FILTER (WHERE type = 'EDUCATION') as education_stamps,
  COUNT(*) FILTER (WHERE type = 'EMPLOYMENT') as employment_stamps,
  COUNT(*) FILTER (WHERE type = 'LANGUAGE') as language_stamps
FROM stamps
WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b';
