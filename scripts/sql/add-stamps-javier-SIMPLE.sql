-- =====================================================
-- ADD VERIFICATION STAMPS FOR JAVIER TORRES GIMENO
-- SIMPLIFIED VERSION - Only EMAIL and PHONE (the allowed types)
-- UUID: a826c47c-0d50-47da-aab3-4dfb71da709d
-- =====================================================

-- Clear previous stamps for this user
DELETE FROM stamps WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d';

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
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'EMAIL',
  'VERIFIED',
  '{"email": "javier.torres@example.com", "verified_method": "manual_admin"}'::jsonb,
  'manual',
  NOW(),
  NOW()
);

-- PHONE VERIFICATION STAMP
INSERT INTO stamps (
  profile_id,
  type,
  status,
  evidence,
  provider,
  verified_at,
  created_at
) VALUES (
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'PHONE',
  'VERIFIED',
  '{"phone": "+34-XXX-XXX-XXX", "verified_method": "manual_admin"}'::jsonb,
  'manual',
  NOW(),
  NOW()
);

-- Verificar stamps insertados
SELECT
  id,
  type,
  status,
  evidence,
  verified_at,
  created_at
FROM stamps
WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d'
ORDER BY created_at DESC;
