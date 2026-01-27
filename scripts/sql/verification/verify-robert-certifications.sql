-- =====================================================
-- VERIFICACIÓN RÁPIDA: Certificaciones de Robert Green
-- =====================================================

-- 1. Verificar que el usuario Robert Green existe
SELECT
  'PERFIL' as tipo,
  id,
  full_name,
  headline,
  slug,
  template
FROM profiles
WHERE full_name ILIKE '%robert%green%'
   OR slug ILIKE '%robert%green%';

-- 2. Verificar certificaciones en portfolio_items
SELECT
  'CERTIFICACIONES' as tipo,
  COUNT(*) as total,
  string_agg(title, ' | ') as certificaciones
FROM portfolio_items
WHERE profile_id IN (
  SELECT id FROM profiles
  WHERE full_name ILIKE '%robert%green%'
     OR slug ILIKE '%robert%green%'
)
AND type = 'CERTIFICATION';

-- 3. Ver detalles completos de certificaciones
SELECT
  type,
  title,
  issuer,
  issue_date,
  expiry_date,
  credential_id,
  verified,
  sort_order,
  created_at
FROM portfolio_items
WHERE profile_id IN (
  SELECT id FROM profiles
  WHERE full_name ILIKE '%robert%green%'
     OR slug ILIKE '%robert%green%'
)
AND type = 'CERTIFICATION'
ORDER BY sort_order;

-- 4. Verificar stamps de certificaciones
SELECT
  'STAMPS CERTIFICACIONES' as tipo,
  COUNT(*) as total_stamps,
  string_agg(
    COALESCE(evidence->>'certification_title', 'Sin título'),
    ' | '
  ) as stamps_certificaciones
FROM stamps
WHERE profile_id IN (
  SELECT id FROM profiles
  WHERE full_name ILIKE '%robert%green%'
     OR slug ILIKE '%robert%green%'
)
AND type = 'CERTIFICATION';

-- 5. Ver todos los portfolio_items de Robert (para debug)
SELECT
  type,
  title,
  CASE
    WHEN type = 'CERTIFICATION' THEN issuer
    WHEN type = 'PROJECT' THEN url
    WHEN type = 'COLLABORATION' THEN description
  END as detalles,
  sort_order
FROM portfolio_items
WHERE profile_id IN (
  SELECT id FROM profiles
  WHERE full_name ILIKE '%robert%green%'
     OR slug ILIKE '%robert%green%'
)
ORDER BY type, sort_order;
