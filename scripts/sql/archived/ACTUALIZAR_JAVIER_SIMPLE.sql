-- =====================================================
-- ACTUALIZAR SOLO EXPERIENCIA, EDUCACIÓN Y HABILIDADES DE JAVIER
-- UUID: a826c47c-0d50-47da-aab3-4dfb71da709d
-- =====================================================

DELETE FROM experiences WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d';
DELETE FROM education WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d';
DELETE FROM skills WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d';

-- Experiencias (5 posiciones del CV real)
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, employment_type, description, achievements, location, sort_order, verified, verified_at, verified_by) VALUES
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'SOLVENIC', 'Ingeniero Senior de Transición Energética & Eficiencia Industrial', '2023-10-01', NULL, true, 'FULL_TIME',
'Dirección técnica de proyectos integrales de eficiencia energética industrial, automatización de sistemas y transición hacia energías renovables para clientes multinacionales. Auditorías energéticas multisitio en complejos industriales, identificando ahorros potenciales >€2M/año mediante optimización de sistemas térmicos, eléctricos y de refrigeración.',
ARRAY[
  'Auditorías energéticas multisitio con ahorros >€2M/año',
  'Implantación de Gemelos Digitales para monitorización energética IoT/BMS',
  'Asesoramiento en legalidades energéticas (RITE, RSIF, APQ) e ISO 50001',
  'Liderazgo de equipos multidisciplinarios en soluciones de climatización',
  'Sistemas de recuperación de energía residual y bombas de calor alta eficiencia'
], 'Barcelona, España', 1, true, NOW(), NULL),

('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Industrial Clima Solutions Global', 'Responsable de Ingeniería HVAC & Utilities', '2018-07-01', '2023-10-31', false, 'FULL_TIME',
'Dirección técnica de proyectos EPC de instalaciones térmicas en logística (>100,000 m²) y pharma con salas blancas ISO 7, dimensionamiento de chillers magnéticos, sistemas NH3 y vapor. Implementación de sistemas de monitorización energética (COP/EER) mediante Gemelos Digitales.',
ARRAY[
  'Proyectos EPC de instalaciones térmicas logística >100,000 m²',
  'Dimensionamiento de chillers magnéticos y sistemas NH3',
  'Implementación de Gemelos Digitales mejorando eficiencia 25-35%',
  'Gestión integral de legalidades (RITE, RSIF, APQ)',
  'Presupuestos superiores a €5M con optimización de OPEX'
], 'Barcelona, España', 2, true, NOW(), NULL),

('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Green Audit Consultores', 'Consultor Energético Senior & Auditor', '2015-09-01', '2018-06-30', false, 'FULL_TIME',
'Auditorías energéticas en industria intensiva (papelera, química), identificando ahorros >€2M/año mediante optimización de sistemas térmicos. Diseño de hibridación de calderas con bombas de calor de alta temperatura y solar térmica, reduciendo consumo de gas natural 30-40%.',
ARRAY[
  'Auditorías energéticas en industria intensiva con ahorros >€2M/año',
  'Hibridación calderas con bombas de calor AT reduciendo gas 30-40%',
  'Gestión de subvenciones IDAE y simulaciones TRNSYS',
  'Asesoramiento en normativa RITE/RSIF',
  'Estrategias de descarbonización industrial a largo plazo'
], 'Barcelona, España', 3, true, NOW(), NULL),

('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Fábrica Automotriz Zona Franca', 'Ingeniero de Fiabilidad y Mantenimiento', '2013-01-01', '2015-08-31', false, 'FULL_TIME',
'Optimización de mantenimiento preventivo/predictivo de servicios generales (torres de refrigeración, aire comprimido, climatización). Implantación de sistema GMAO SAP PM y digitalización de Órdenes de Trabajo, reduciendo downtime no planificado 35%.',
ARRAY[
  'Optimización de mantenimiento preventivo/predictivo',
  'Implantación de sistema GMAO SAP PM reduciendo downtime 35%',
  'Liderazgo en mejora continua (TPM, RCM) y análisis RCA',
  'Análisis energético de líneas con cálculo de consumo por unidad'
], 'Barcelona, España', 4, true, NOW(), NULL),

('a826c47c-0d50-47da-aab3-4dfb71da709d', 'SEAT Martorell', 'Ingeniero Junior de Procesos', '2012-01-01', '2013-12-31', false, 'FULL_TIME',
'Optimización de líneas de producción en chapistería con análisis de KPIs energéticos por vehículo (EnPIs). Soporte en proyectos piloto de recuperación de calor residual en hornos de pintura. Estandarización de procesos operativos y documentación técnica de sistemas de utilidades.',
ARRAY[
  'Optimización de líneas de producción con análisis de KPIs energéticos',
  'Proyectos piloto de recuperación de calor residual',
  'Estandarización de procesos operativos y documentación técnica'
], 'Barcelona, España', 5, true, NOW(), NULL);

-- Educación (3 títulos del CV real)
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Universitat Politècnica de Catalunya (UPC) - ETSEIB', 'Máster Universitario en Ingeniería Industrial', 'Ingeniería Industrial', '2011-09-01', '2013-06-30', false, 'Sobresaliente', 1, true, NOW(), NULL),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Universitat Politècnica de Catalunya (UPC)', 'Grado en Ingeniería en Tecnologías Industriales', 'Ingeniería en Tecnologías Industriales', '2007-09-01', '2011-06-30', false, 'Notable', 2, true, NOW(), NULL),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Colegio de Ingenieros Industriales de Catalunya', 'Postgrado en Auditorías Energéticas y Mercado Eléctrico', 'Auditorías Energéticas', '2016-01-01', '2016-12-31', false, 'Excelente', 3, true, NOW(), NULL);

-- Habilidades (del CV real)
INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Diseño HVAC Industrial', 'EXPERT', 12, 'Sistemas & Ingeniería', 1),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Chillers & Refrigeración', 'EXPERT', 10, 'Sistemas & Ingeniería', 2),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Sistemas Térmicos', 'EXPERT', 12, 'Sistemas & Ingeniería', 3),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Bombas de Calor AT', 'EXPERT', 8, 'Sistemas & Ingeniería', 4),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Gemelos Digitales (IoT)', 'ADVANCED', 6, 'Sistemas & Ingeniería', 5),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Trigeneración', 'ADVANCED', 5, 'Sistemas & Ingeniería', 6),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Auditorías Energéticas', 'EXPERT', 10, 'Metodologías', 7),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'ISO 50001', 'ADVANCED', 8, 'Metodologías', 8),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'RITE / RSIF / APQ', 'EXPERT', 12, 'Metodologías', 9),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Lean Manufacturing', 'ADVANCED', 7, 'Metodologías', 10),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'SAP PM / GMAO', 'ADVANCED', 6, 'Herramientas', 11),
('a826c47c-0d50-47da-aab3-4dfb71da709d', 'Simulación TRNSYS', 'INTERMEDIATE', 5, 'Herramientas', 12);

-- Verificación
SELECT '✅ ACTUALIZADO' as resultado,
  (SELECT COUNT(*) FROM experiences WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d') as experiencias,
  (SELECT COUNT(*) FROM education WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d') as educacion,
  (SELECT COUNT(*) FROM skills WHERE profile_id = 'a826c47c-0d50-47da-aab3-4dfb71da709d') as habilidades;
