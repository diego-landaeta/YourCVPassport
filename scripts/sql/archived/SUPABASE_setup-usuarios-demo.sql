-- =====================================================
-- SETUP COMPLETO DE USUARIOS DEMO - VERSIÓN SUPABASE
-- =====================================================
-- Ejecutar directamente en Supabase SQL Editor
-- =====================================================

-- =====================================================
-- PASO 0: Deshabilitar Rate Limit Temporalmente
-- =====================================================
-- El rate limit impide insertar múltiples stamps del mismo tipo
-- Lo deshabilitamos solo para este setup inicial

ALTER TABLE stamps DISABLE TRIGGER enforce_stamp_rate_limit;

-- =====================================================
-- PARTE 1: STAMPS BÁSICOS - MARTA RUIZ SERRANO
-- =====================================================

INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
VALUES
  ('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'EMAIL', 'VERIFIED',
   '{"email": "marta.ruiz@example.com", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'IDENTITY', 'VERIFIED',
   '{"document_type": "DNI", "document_number": "****789M", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'EDUCATION', 'VERIFIED',
   '{"degree": "Grado en Ingeniería de Energías Renovables", "institution": "Universidad Politécnica de Valencia", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Ingeniera de Instalaciones Térmicas", "company": "Empresa de Energías Renovables", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'LANGUAGE', 'VERIFIED',
   '{"languages": ["Español (Native)", "Inglés (C1)", "Alemán (B1)"], "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 2: STAMPS BÁSICOS - JAVIER TORRES GIMENO
-- =====================================================

INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
VALUES
  ('a826c47c-0d50-47da-aab3-4dfb71da709d', 'EMAIL', 'VERIFIED',
   '{"email": "javier.torres@example.com", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('a826c47c-0d50-47da-aab3-4dfb71da709d', 'IDENTITY', 'VERIFIED',
   '{"document_type": "DNI", "document_number": "****123J", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('a826c47c-0d50-47da-aab3-4dfb71da709d', 'EDUCATION', 'VERIFIED',
   '{"degree": "Grado en Ingeniería Industrial", "institution": "Universidad Politécnica de Madrid", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('a826c47c-0d50-47da-aab3-4dfb71da709d', 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Ingeniero HVAC Senior", "company": "Empresa de Climatización Industrial", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('a826c47c-0d50-47da-aab3-4dfb71da709d', 'LANGUAGE', 'VERIFIED',
   '{"languages": ["Español (Native)", "Inglés (B2)", "Francés (A2)"], "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 3: STAMPS BÁSICOS - LAURA MARTÍNEZ VIDAL
-- =====================================================

INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
VALUES
  ('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'EMAIL', 'VERIFIED',
   '{"email": "laura.martinez@example.com", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'IDENTITY', 'VERIFIED',
   '{"document_type": "DNI", "document_number": "****456L", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'EDUCATION', 'VERIFIED',
   '{"degree": "Grado en Arquitectura Técnica", "institution": "Universidad de Sevilla", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Directora de Ejecución de Obra", "company": "Constructora Residencial S.L.", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  ('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'LANGUAGE', 'VERIFIED',
   '{"languages": ["Español (Native)", "Inglés (C1)", "Portugués (B1)"], "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 4: CERTIFICACIONES - MARTA RUIZ SERRANO
-- =====================================================

INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, expiry_date, credential_id, credential_url, description, verified, sort_order)
VALUES
  ('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'CERTIFICATION',
   'Instalador de Energía Solar Fotovoltaica',
   'IDAE - Instituto para la Diversificación y Ahorro de la Energía',
   '2023-03', '2028-03', 'IDAE-FV-2023-0456',
   'https://www.idae.es/verificacion/certificado/IDAE-FV-2023-0456',
   'Certificación oficial para el diseño e instalación de sistemas de energía solar fotovoltaica en edificios residenciales y comerciales.',
   true, 1),
  ('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'CERTIFICATION',
   'Técnico Certificado en Instalaciones Térmicas (RITE)',
   'Ministerio de Industria, Energía y Turismo',
   '2022-09', NULL, 'RITE-2022-7845',
   'https://www.minetur.gob.es/verificacion/RITE-2022-7845',
   'Certificación oficial para el diseño, cálculo, instalación y mantenimiento de instalaciones térmicas según el Reglamento de Instalaciones Térmicas en Edificios.',
   true, 2),
  ('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'CERTIFICATION',
   'Certificador de Eficiencia Energética de Edificios',
   'Colegio Oficial de Ingenieros Industriales',
   '2021-06', '2026-06', 'CEE-2021-3421', NULL,
   'Habilitación profesional para la emisión de certificados de eficiencia energética en edificios existentes y de nueva construcción.',
   true, 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 5: CERTIFICACIONES - JAVIER TORRES GIMENO
-- =====================================================

INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, expiry_date, credential_id, credential_url, description, verified, sort_order)
VALUES
  ('a826c47c-0d50-47da-aab3-4dfb71da709d', 'CERTIFICATION',
   'Profesional Certificado en Diseño de Sistemas HVAC',
   'ASHRAE - American Society of Heating, Refrigerating and Air-Conditioning Engineers',
   '2022-11', '2027-11', 'ASHRAE-HVAC-2022-8934',
   'https://www.ashrae.org/professional-development/certification/verify/8934',
   'Certificación internacional en diseño, cálculo e implementación de sistemas de climatización HVAC para edificios industriales y comerciales.',
   true, 1),
  ('a826c47c-0d50-47da-aab3-4dfb71da709d', 'CERTIFICATION',
   'Frigorista Oficial - Categoría 1',
   'Ministerio de Industria, Energía y Turismo',
   '2020-05', NULL, 'FRIG-CAT1-2020-5672',
   'https://www.minetur.gob.es/verificacion/frigorista/5672',
   'Certificación oficial para la manipulación de equipos frigoríficos y sistemas de refrigeración industrial con todos los tipos de refrigerantes.',
   true, 2),
  ('a826c47c-0d50-47da-aab3-4dfb71da709d', 'CERTIFICATION',
   'Especialista en Normativa RITE y CTE',
   'Colegio Oficial de Ingenieros Industriales',
   '2021-03', NULL, 'RITE-CTE-2021-9023', NULL,
   'Formación avanzada en el Reglamento de Instalaciones Térmicas en Edificios (RITE) y Código Técnico de la Edificación (CTE) para instalaciones térmicas industriales.',
   true, 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 6: CERTIFICACIONES - LAURA MARTÍNEZ VIDAL
-- =====================================================

INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, expiry_date, credential_id, credential_url, description, verified, sort_order)
VALUES
  ('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'CERTIFICATION',
   'Lean Construction Practitioner',
   'Lean Construction Institute (LCI)',
   '2023-01', '2026-01', 'LCI-LCP-2023-4567',
   'https://www.leanconstruction.org/verify/LCI-LCP-2023-4567',
   'Certificación internacional en metodologías Lean Construction para la optimización de procesos constructivos y reducción de desperdicios en obra.',
   true, 1),
  ('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'CERTIFICATION',
   'Director de Ejecución de Obras Certificado',
   'Colegio Oficial de Aparejadores y Arquitectos Técnicos',
   '2020-09', NULL, 'DEO-2020-7823',
   'https://www.coaat.es/verificacion/deo/7823',
   'Certificación profesional para la dirección de ejecución de obras en edificación residencial y comercial, garantizando el cumplimiento del CTE.',
   true, 2),
  ('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'CERTIFICATION',
   'BIM Manager Certified Professional',
   'buildingSMART International',
   '2022-06', '2027-06', 'bSI-BIM-MGR-2022-3421',
   'https://www.buildingsmart.org/certification/verify/3421',
   'Certificación internacional en gestión BIM para la coordinación de proyectos de construcción utilizando metodología Building Information Modeling.',
   true, 3)
ON CONFLICT DO NOTHING;

-- =====================================================
-- PARTE 7: STAMPS DE CERTIFICACIONES
-- =====================================================

DO $$
DECLARE
  cert_id TEXT;
  profile_uuid UUID;
  cert_title TEXT;
BEGIN
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
    INSERT INTO stamps (
      profile_id, type, status, entity_id, entity_type,
      evidence, provider, verified_at, created_at
    ) VALUES (
      profile_uuid, 'CERTIFICATION', 'VERIFIED', cert_id, 'CERTIFICATION',
      jsonb_build_object(
        'certification_title', cert_title,
        'verified_method', 'manual_admin',
        'verification_notes', 'Certificación verificada mediante documentación oficial'
      ),
      'Admin Manual Review', NOW(), NOW()
    ) ON CONFLICT DO NOTHING;
  END LOOP;
END $$;

-- =====================================================
-- RESUMEN FINAL
-- =====================================================

SELECT
  'RESUMEN POR USUARIO' as seccion,
  p.full_name as nombre,
  p.headline as profesion,
  COUNT(DISTINCT s.id) as total_stamps,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'VERIFIED') as stamps_verificados,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'CERTIFICATION') as certificaciones
FROM profiles p
LEFT JOIN stamps s ON s.profile_id = p.id
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id AND pi.type = 'CERTIFICATION'
WHERE p.id IN (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',
  'a826c47c-0d50-47da-aab3-4dfb71da709d',
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'
)
GROUP BY p.id, p.full_name, p.headline
ORDER BY p.full_name;
