-- =====================================================
-- ACTUALIZAR SOLO EXPERIENCIA, EDUCACIÓN Y HABILIDADES DE MARTA
-- UUID: e379dca2-0b33-45b4-864a-ba9204e0ab4b
-- =====================================================

DELETE FROM experiences WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b';
DELETE FROM education WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b';
DELETE FROM skills WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b';

-- Experiencias (4 posiciones del CV real)
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, employment_type, description, achievements, location, sort_order, verified, verified_at, verified_by) VALUES
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Solvenic Energy Group', 'Head of Renewable Engineering', '2020-01-01', NULL, true, 'FULL_TIME',
'Liderazgo técnico de cartera >500 MW. Ingeniería de detalle de plantas FV y hibridación con almacenamiento. Gestión de interconexión (REE) y puntos de acceso. Dirección de I+D en hidrógeno y agrivoltaica. Supervisión de construcción y Commissioning, asegurando PR y disponibilidad garantizada.',
ARRAY[
  'Liderazgo técnico de cartera >500 MW',
  'Ingeniería de detalle de plantas FV y hibridación con almacenamiento',
  'Gestión de interconexión (REE) y puntos de acceso',
  'Dirección de I+D en hidrógeno verde y agrivoltaica',
  'Supervisión de construcción y Commissioning garantizando PR'
], 'Madrid, España', 1, true, NOW(), NULL),

('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Ecoenergy Solutions', 'Senior Project Manager - Renovables', '2017-06-01', '2019-12-31', false, 'FULL_TIME',
'Gestión de autoconsumo industrial EPC y PPA. Auditorías energéticas en sector terciario y diseño de medidas de ahorro. Desarrollo de herramientas de dimensionado de baterías. Tramitación de subvenciones y licencias.',
ARRAY[
  'Gestión integral de proyectos EPC y PPA de autoconsumo industrial',
  'Auditorías energéticas en sector terciario',
  'Desarrollo de herramientas de dimensionado de sistemas BESS',
  'Tramitación de subvenciones y licencias'
], 'Madrid, España', 2, true, NOW(), NULL),

('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Iberrenovables Engineering', 'Ingeniera de Diseño de Instalaciones', '2015-09-01', '2017-05-31', false, 'FULL_TIME',
'Ingeniería de detalle para solar térmica y biomasa. Cálculo de cargas y redes de calor (District Heating). Elaboración de memorias, planos (Revit MEP) y pliegos.',
ARRAY[
  'Ingeniería de detalle para solar térmica y biomasa',
  'Cálculo de cargas y diseño de redes District Heating',
  'Elaboración de memorias técnicas y planos Revit MEP'
], 'Madrid, España', 3, true, NOW(), NULL),

('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'CENER', 'Investigadora en Tecnologías Solares (R&D)', '2014-06-01', '2015-08-31', false, 'FULL_TIME',
'Investigación en concentración solar y nuevos materiales (H2020). Ensayos de caracterización de captadores (ISO 9806). Análisis de datos experimentales, modelado matemático y publicación de papers científicos.',
ARRAY[
  'Investigación en concentración solar (H2020)',
  'Ensayos de caracterización (ISO 9806)',
  'Modelado matemático y publicación científica'
], 'Navarra, España', 4, true, NOW(), NULL);

-- Educación (3 títulos del CV real)
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'EOI - Escuela de Organización Industrial', 'Máster Internacional en Ingeniería de Energías Renovables', 'Ingeniería de Energías Renovables', '2016-09-01', '2017-06-30', false, 'Sobresaliente', 1, true, NOW(), NULL),
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Universidad Carlos III de Madrid', 'Grado en Ingeniería de la Energía', 'Ingeniería de la Energía', '2011-09-01', '2015-06-30', false, 'Notable', 2, true, NOW(), NULL),
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Club Español de la Energía (ENERCLUB)', 'Especialización en Mercados Energéticos', 'Mercados Energéticos', '2018-01-01', '2018-12-31', false, 'Excelente', 3, true, NOW(), NULL);

-- Habilidades (del CV real)
INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Energía Solar Fotovoltaica', 'EXPERT', 10, 'Energías Renovables', 1),
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Almacenamiento (BESS)', 'EXPERT', 7, 'Almacenamiento', 2),
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Hidrógeno Verde', 'ADVANCED', 5, 'Hidrógeno', 3),
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'PVSyst & Helioscope', 'EXPERT', 8, 'Software Técnico', 4),
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Mercados Energéticos', 'ADVANCED', 6, 'Mercados', 5),
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Gestión de Proyectos EPC', 'EXPERT', 8, 'Project Management', 6),
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Sostenibilidad Corporativa', 'ADVANCED', 5, 'Sostenibilidad', 7),
('e379dca2-0b33-45b4-864a-ba9204e0ab4b', 'Inglés Técnico Avanzado', 'ADVANCED', 10, 'Idiomas', 8);

-- Verificación
SELECT '✅ ACTUALIZADO' as resultado,
  (SELECT COUNT(*) FROM experiences WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b') as experiencias,
  (SELECT COUNT(*) FROM education WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b') as educacion,
  (SELECT COUNT(*) FROM skills WHERE profile_id = 'e379dca2-0b33-45b4-864a-ba9204e0ab4b') as habilidades;
