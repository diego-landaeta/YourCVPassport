-- =====================================================
-- ACTUALIZAR UBICACIONES USUARIOS DEMO
-- =====================================================
-- Marta, Javier y Laura necesitan ubicaciones

-- 1. MARTA RUIZ SERRANO - Ingeniera de Energías Renovables
UPDATE profiles
SET
  location = 'Madrid, España',
  country_code = 'ES',
  updated_at = NOW()
WHERE id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b';

-- 2. JAVIER TORRES GIMENO - Ingeniero Industrial HVAC
UPDATE profiles
SET
  location = 'Barcelona, España',
  country_code = 'ES',
  updated_at = NOW()
WHERE id = 'a826c47c-0d50-47da-aab3-4dfb71da709d';

-- 3. LAURA MARTÍNEZ VIDAL - Arquitecto Técnico
UPDATE profiles
SET
  location = 'Sevilla, España',
  country_code = 'ES',
  updated_at = NOW()
WHERE id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';

-- Verificación
SELECT
  full_name,
  headline,
  location,
  country_code
FROM profiles
WHERE id IN (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
);
