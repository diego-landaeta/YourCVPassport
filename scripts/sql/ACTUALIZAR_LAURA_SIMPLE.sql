-- =====================================================
-- ACTUALIZAR SOLO EXPERIENCIA, EDUCACIÓN Y HABILIDADES DE LAURA
-- UUID: bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e
-- =====================================================

DELETE FROM experiences WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';
DELETE FROM education WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';
DELETE FROM skills WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e';

-- Experiencias (5 posiciones del CV real)
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, employment_type, description, achievements, location, sort_order, verified, verified_at, verified_by) VALUES
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'SOLVENIC', 'Arquitecto Técnico & Project Manager', '2024-02-01', NULL, true, 'FULL_TIME',
'Dirección técnica y coordinación integral de proyectos de rehabilitación energética, automatización de edificios inteligentes y modernización de sistemas constructivos para clientes corporativos e institucionales. Responsable de estudios de viabilidad, planificación detallada con metodología Lean Construction, optimización de presupuestos y gestión de subcontrataciones estratégicas.',
ARRAY[
  'Dirección técnica de proyectos de rehabilitación energética y automatización',
  'Estudios de viabilidad y planificación con metodología Lean Construction',
  'Liderazgo de equipos multidisciplinarios con máximos estándares de calidad',
  'Implementación de climatización invisible (KNX) y sistemas de automatización',
  'Gestión de presupuestos y subcontrataciones estratégicas'
], 'Valencia, España', 1, true, NOW(), NULL),

('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Construcciones Levante S.A.', 'Jefa de Obra e Instalaciones Senior', '2019-02-01', '2024-01-31', false, 'FULL_TIME',
'Dirección técnica y económica de promociones residenciales de lujo con más de 80 viviendas y edificios singulares, manejando presupuestos superiores a 15 millones de euros. Gestión integral bajo certificación ISO 9001, supervisando sistemas de aerotermia centralizada, ventilación con recuperación de calor (BREEAM Very Good).',
ARRAY[
  'Dirección de promociones residenciales de lujo con presupuestos >€15M',
  'Gestión bajo certificación ISO 9001 con sistemas aerotermia y BREEAM Very Good',
  'Liderazgo operativo de más de 60 profesionales en obra',
  'Resolución proactiva de conflictos técnicos garantizando cronogramas',
  'Negociación de contratos marco y reporting a Comité de Dirección'
], 'Valencia, España', 2, true, NOW(), NULL),

('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Estudio Arquitectura 360', 'Técnico de Estudios y Licitaciones', '2016-03-01', '2019-01-31', false, 'FULL_TIME',
'Elaboración de presupuestos y licitaciones (Presto/TCQ) para obra pública y privada con énfasis en proyectos de rehabilitación integral y mejora de envolvente térmica (SATE). Estudios de viabilidad para rehabilitación integral con análisis de Ciclo de Vida (ACV).',
ARRAY[
  'Elaboración de presupuestos y licitaciones con Presto/TCQ',
  'Estudios de viabilidad con análisis de Ciclo de Vida (ACV)',
  'Planificación detallada con MsProject',
  'Gestión de residuos con estándares de sostenibilidad',
  'Selección de acabados premium y análisis de rendimiento energético'
], 'Valencia, España', 3, true, NOW(), NULL),

('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Freelance', 'Coordinadora de Seguridad y Salud (CSS)', '2015-01-01', '2016-12-31', false, 'FREELANCE',
'Gestión integral de Planes de Seguridad y Salud (PSS) en fase de ejecución con auditorías semanales y coordinación de actividades empresariales (CAE) de subcontratas. Implantación de cultura preventiva logrando índice de siniestralidad cero.',
ARRAY[
  'Gestión de Planes de Seguridad y Salud con auditorías semanales',
  'Coordinación de actividades empresariales (CAE) de subcontratas',
  'Implantación de cultura preventiva con siniestralidad cero',
  'Auditoría técnica de conformidad y documentación de seguridad'
], 'Valencia, España', 4, true, NOW(), NULL),

('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Ayuntamiento de Valencia', 'Adjunta a Dirección Facultativa', '2014-01-01', '2015-12-31', false, 'FULL_TIME',
'Supervisión técnica de obras de mantenimiento y rehabilitación del patrimonio municipal con levantamiento de planos as-built e informes de patologías estructurales. Control de certificaciones de obra y redacción de pliegos técnicos para licitaciones públicas.',
ARRAY[
  'Supervisión de obras de mantenimiento del patrimonio municipal',
  'Levantamiento de planos as-built e informes de patologías',
  'Control de certificaciones de obra',
  'Redacción de pliegos técnicos para licitaciones públicas',
  'Diagnóstico de patologías e implementación de soluciones energéticas'
], 'Valencia, España', 5, true, NOW(), NULL);

-- Educación (3 títulos del CV real)
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Universitat Politècnica de València (UPV)', 'Grado en Arquitectura Técnica y Edificación', 'Arquitectura Técnica y Edificación', '2010-09-01', '2014-06-30', false, 'Notable', 1, true, NOW(), NULL),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'UPV - Especialidad en Management', 'Máster Universitario en Gestión de la Edificación', 'Gestión de la Edificación', '2015-01-01', '2015-12-31', false, 'Sobresaliente', 2, true, NOW(), NULL),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Fundación Laboral de la Construcción', 'Postgrado en Eficiencia Energética y Sostenibilidad', 'Eficiencia Energética y Sostenibilidad', '2018-01-01', '2018-12-31', false, 'Excelente', 3, true, NOW(), NULL);

-- Habilidades (del CV real)
INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Dirección de Ejecución', 'EXPERT', 12, 'Dirección & Gestión', 1),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Lean Construction', 'ADVANCED', 6, 'Dirección & Gestión', 2),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Project Management', 'EXPERT', 10, 'Dirección & Gestión', 3),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'BIM (Revit & Navisworks)', 'ADVANCED', 7, 'Dirección & Gestión', 4),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Cost Control & Presupuesto', 'EXPERT', 10, 'Dirección & Gestión', 5),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Gestión Subcontratos', 'EXPERT', 10, 'Dirección & Gestión', 6),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Liderazgo de Equipos', 'ADVANCED', 8, 'Dirección & Gestión', 7),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Climatización Invisible (KNX)', 'ADVANCED', 5, 'Tecnologías', 8),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Sistemas de Automatización', 'ADVANCED', 5, 'Tecnologías', 9),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Geotermia & Aerotermia', 'ADVANCED', 6, 'Tecnologías', 10),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'BREEAM & Eficiencia Energética', 'ADVANCED', 7, 'Tecnologías', 11),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Patología Constructiva', 'EXPERT', 10, 'Tecnologías', 12),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Rehabilitación Integral', 'EXPERT', 9, 'Tecnologías', 13),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Seguridad y Salud en Obra', 'EXPERT', 10, 'Tecnologías', 14),
('bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e', 'Presto, TCQ, MsProject', 'EXPERT', 10, 'Herramientas', 15);

-- Verificación
SELECT '✅ ACTUALIZADO' as resultado,
  (SELECT COUNT(*) FROM experiences WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e') as experiencias,
  (SELECT COUNT(*) FROM education WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e') as educacion,
  (SELECT COUNT(*) FROM skills WHERE profile_id = 'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e') as habilidades;
