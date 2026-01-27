-- =====================================================
-- ADD VERIFICATION STAMPS FOR LAURA MARTÍNEZ VIDAL
-- SIMPLIFIED VERSION - Only EMAIL and PHONE (the allowed types)
-- UUID: bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e
-- =====================================================

-- Clear previous stamps for this user
DELETE FROM stamps WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';

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
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  'EMAIL',
  'VERIFIED',
  '{"email": "laura.martinez@example.com", "verified_method": "manual_admin"}'::jsonb,
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
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
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
WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
ORDER BY created_at DESC;
