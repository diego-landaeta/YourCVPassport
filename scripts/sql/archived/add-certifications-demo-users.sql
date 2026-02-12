-- =====================================================
-- ADD PROFESSIONAL CERTIFICATIONS TO DEMO USERS
-- =====================================================
-- Adds portfolio certifications and verification stamps
-- for Marta, Javier, and Laura
-- =====================================================

-- =====================================================
-- 1. MARTA RUIZ SERRANO
-- Ingeniera de Energías Renovables
-- UUID: e379dca2-0b33-45b4-864a-ba9204e0ab4b
-- =====================================================

-- Certification 1: Instalador de Energía Solar Fotovoltaica
INSERT INTO portfolio_items (
  profile_id,
  type,
  title,
  issuer,
  issue_date,
  expiry_date,
  credential_id,
  credential_url,
  description,
  image_url,
  verified,
  sort_order
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'CERTIFICATION',
  'Instalador de Energía Solar Fotovoltaica',
  'IDAE - Instituto para la Diversificación y Ahorro de la Energía',
  '2023-03',
  '2028-03',
  'IDAE-FV-2023-0456',
  'https://www.idae.es/verificacion/certificado/IDAE-FV-2023-0456',
  'Certificación oficial para el diseño e instalación de sistemas de energía solar fotovoltaica en edificios residenciales y comerciales.',
  NULL,
  true,
  1
) ON CONFLICT DO NOTHING;

-- Certification 2: Técnico en Instalaciones Térmicas (RITE)
INSERT INTO portfolio_items (
  profile_id,
  type,
  title,
  issuer,
  issue_date,
  credential_id,
  credential_url,
  description,
  verified,
  sort_order
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'CERTIFICATION',
  'Técnico Certificado en Instalaciones Térmicas (RITE)',
  'Ministerio de Industria, Energía y Turismo',
  '2022-09',
  'RITE-2022-7845',
  'https://www.minetur.gob.es/verificacion/RITE-2022-7845',
  'Certificación oficial para el diseño, cálculo, instalación y mantenimiento de instalaciones térmicas según el Reglamento de Instalaciones Térmicas en Edificios.',
  true,
  2
) ON CONFLICT DO NOTHING;

-- Certification 3: Certificado de Eficiencia Energética de Edificios
INSERT INTO portfolio_items (
  profile_id,
  type,
  title,
  issuer,
  issue_date,
  expiry_date,
  credential_id,
  credential_url,
  description,
  verified,
  sort_order
) VALUES (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'CERTIFICATION',
  'Certificador de Eficiencia Energética de Edificios',
  'Colegio Oficial de Ingenieros Industriales',
  '2021-06',
  '2026-06',
  'CEE-2021-3421',
  NULL,
  'Habilitación profesional para la emisión de certificados de eficiencia energética en edificios existentes y de nueva construcción.',
  true,
  3
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. JAVIER TORRES GIMENO
-- Ingeniero Industrial | Especialista en HVAC
-- UUID: a826c47c-0d50-47da-aab3-4dfb71da709d
-- =====================================================

-- Certification 1: Certificado Profesional en Sistemas HVAC
INSERT INTO portfolio_items (
  profile_id,
  type,
  title,
  issuer,
  issue_date,
  expiry_date,
  credential_id,
  credential_url,
  description,
  verified,
  sort_order
) VALUES (
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'CERTIFICATION',
  'Profesional Certificado en Diseño de Sistemas HVAC',
  'ASHRAE - American Society of Heating, Refrigerating and Air-Conditioning Engineers',
  '2022-11',
  '2027-11',
  'ASHRAE-HVAC-2022-8934',
  'https://www.ashrae.org/professional-development/certification/verify/8934',
  'Certificación internacional en diseño, cálculo e implementación de sistemas de climatización HVAC para edificios industriales y comerciales.',
  true,
  1
) ON CONFLICT DO NOTHING;

-- Certification 2: Frigorista Certificado
INSERT INTO portfolio_items (
  profile_id,
  type,
  title,
  issuer,
  issue_date,
  credential_id,
  credential_url,
  description,
  verified,
  sort_order
) VALUES (
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'CERTIFICATION',
  'Frigorista Oficial - Categoría 1',
  'Ministerio de Industria, Energía y Turismo',
  '2020-05',
  'FRIG-CAT1-2020-5672',
  'https://www.minetur.gob.es/verificacion/frigorista/5672',
  'Certificación oficial para la manipulación de equipos frigoríficos y sistemas de refrigeración industrial con todos los tipos de refrigerantes.',
  true,
  2
) ON CONFLICT DO NOTHING;

-- Certification 3: Normativa RITE Avanzada
INSERT INTO portfolio_items (
  profile_id,
  type,
  title,
  issuer,
  issue_date,
  credential_id,
  description,
  verified,
  sort_order
) VALUES (
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'CERTIFICATION',
  'Especialista en Normativa RITE y CTE',
  'Colegio Oficial de Ingenieros Industriales',
  '2021-03',
  'RITE-CTE-2021-9023',
  'Formación avanzada en el Reglamento de Instalaciones Térmicas en Edificios (RITE) y Código Técnico de la Edificación (CTE) para instalaciones térmicas industriales.',
  true,
  3
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. LAURA MARTÍNEZ VIDAL
-- Arquitecto Técnico | Especialista en obra residencial y comercial
-- UUID: bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e
-- =====================================================

-- Certification 1: Lean Construction Practitioner
INSERT INTO portfolio_items (
  profile_id,
  type,
  title,
  issuer,
  issue_date,
  expiry_date,
  credential_id,
  credential_url,
  description,
  verified,
  sort_order
) VALUES (
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  'CERTIFICATION',
  'Lean Construction Practitioner',
  'Lean Construction Institute (LCI)',
  '2023-01',
  '2026-01',
  'LCI-LCP-2023-4567',
  'https://www.leanconstruction.org/verify/LCI-LCP-2023-4567',
  'Certificación internacional en metodologías Lean Construction para la optimización de procesos constructivos y reducción de desperdicios en obra.',
  true,
  1
) ON CONFLICT DO NOTHING;

-- Certification 2: Dirección de Ejecución de Obras
INSERT INTO portfolio_items (
  profile_id,
  type,
  title,
  issuer,
  issue_date,
  credential_id,
  credential_url,
  description,
  verified,
  sort_order
) VALUES (
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  'CERTIFICATION',
  'Director de Ejecución de Obras Certificado',
  'Colegio Oficial de Aparejadores y Arquitectos Técnicos',
  '2020-09',
  'DEO-2020-7823',
  'https://www.coaat.es/verificacion/deo/7823',
  'Certificación profesional para la dirección de ejecución de obras en edificación residencial y comercial, garantizando el cumplimiento del CTE.',
  true,
  2
) ON CONFLICT DO NOTHING;

-- Certification 3: BIM Manager Certified
INSERT INTO portfolio_items (
  profile_id,
  type,
  title,
  issuer,
  issue_date,
  expiry_date,
  credential_id,
  credential_url,
  description,
  verified,
  sort_order
) VALUES (
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e',
  'CERTIFICATION',
  'BIM Manager Certified Professional',
  'buildingSMART International',
  '2022-06',
  '2027-06',
  'bSI-BIM-MGR-2022-3421',
  'https://www.buildingsmart.org/certification/verify/3421',
  'Certificación internacional en gestión BIM para la coordinación de proyectos de construcción utilizando metodología Building Information Modeling.',
  true,
  3
) ON CONFLICT DO NOTHING;

-- =====================================================
-- ADD CERTIFICATION VERIFICATION STAMPS
-- =====================================================

-- Get portfolio_items IDs for creating stamps
DO $$
DECLARE
  cert_id TEXT;
  profile_uuid UUID;
  cert_title TEXT;
BEGIN
  -- Loop through all certifications we just inserted
  FOR cert_id, profile_uuid, cert_title IN
    SELECT id::text, profile_id, title
    FROM portfolio_items
    WHERE type = 'CERTIFICATION'
    AND profile_id IN (
      'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
      'a826c47c-0d50-47da-aab3-4dfb71da709d',
      'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
    )
  LOOP
    -- Insert verification stamp for each certification
    INSERT INTO stamps (
      profile_id,
      type,
      status,
      entity_id,
      entity_type,
      evidence,
      provider,
      verified_at,
      created_at
    ) VALUES (
      profile_uuid,
      'CERTIFICATION',
      'VERIFIED',
      cert_id,
      'CERTIFICATION',
      jsonb_build_object(
        'certification_title', cert_title,
        'verified_method', 'manual_admin',
        'verification_notes', 'Certificación verificada mediante documentación oficial'
      ),
      'Admin Manual Review',
      NOW(),
      NOW()
    ) ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Added verification stamp for certification: % (Profile: %)', cert_title, profile_uuid;
  END LOOP;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Show all certifications added
SELECT
  'CERTIFICATIONS ADDED' as section,
  p.full_name,
  pi.title as certification,
  pi.issuer,
  pi.issue_date,
  pi.verified,
  pi.credential_id
FROM portfolio_items pi
JOIN profiles p ON pi.profile_id = p.id
WHERE pi.type = 'CERTIFICATION'
AND pi.profile_id IN (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
)
ORDER BY p.full_name, pi.sort_order;

-- Show certification stamps
SELECT
  'CERTIFICATION STAMPS' as section,
  p.full_name,
  s.type,
  s.status,
  s.entity_id,
  s.verified_at
FROM stamps s
JOIN profiles p ON s.profile_id = p.id
WHERE s.type = 'CERTIFICATION'
AND s.profile_id IN (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
)
ORDER BY p.full_name, s.created_at;

-- Summary by user
SELECT
  'SUMMARY BY USER' as section,
  p.full_name,
  COUNT(DISTINCT pi.id) as total_certifications,
  COUNT(DISTINCT s.id) FILTER (WHERE s.type = 'CERTIFICATION') as verified_certifications
FROM profiles p
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id AND pi.type = 'CERTIFICATION'
LEFT JOIN stamps s ON s.profile_id = p.id AND s.type = 'CERTIFICATION'
WHERE p.id IN (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
)
GROUP BY p.id, p.full_name
ORDER BY p.full_name;
