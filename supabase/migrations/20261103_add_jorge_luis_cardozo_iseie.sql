-- ============================================================================
-- SEED: Director ISEIE · Dr. Jorge Luis Cardozo (Medicina · Uroginecología y Suelo Pélvico)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS»)
--   · https://iseie.com/director/jorge-luis-cardozo/ (misma bio que el CV)
--   · LinkedIn https://www.linkedin.com/in/jorge-luis-cardozo-211b52192 (03/11/2026: todos los puestos
--   ·   con fechas, formación, idiomas y la web de PelviArt)
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: director y tutor de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/09/IMG_3118-1-scaled.jpeg, subido a profile-assets/avatars/ el 03/11/2026.
-- Datos personales: el CV trae DNI, correo personal y nacionalidades. NO se publican.
-- Fecha de ISEIE: aproximada (septiembre de 2026, cuando se publicó su ficha en iseie.com).
-- Se omite el puesto genérico «Urólogo · Autónomo» de LinkedIn (sin centro ni descripción).
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       jorge.cardozo@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'jorge-luis-cardozo';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Dr. Jorge Luis Cardozo
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'jorge.cardozo@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario jorge.cardozo@iseie.com en auth.users. Crearlo antes de ejecutar.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 0: CLEANUP (idempotente)
-- ═══════════════════════════════════════════════════════════════════════
DELETE FROM portfolio_items WHERE profile_id = p;
DELETE FROM skills          WHERE profile_id = p;
DELETE FROM languages       WHERE profile_id = p;
DELETE FROM education       WHERE profile_id = p;
DELETE FROM experiences     WHERE profile_id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 1: PROFILE
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Dr. Jorge Luis Cardozo',
  headline = 'Médico urólogo · Urología funcional, urodinamia y suelo pélvico · Fellow en Andrología en Fundació Puigvert · Director del Diplomado de ISEIE',
  summary = 'Médico urólogo especializado en urología funcional, neuro-urología, suelo pélvico e incontinencia urinaria, con formación médica homologada en España. Desde 2026 es Fellow en Andrología en la Fundació Puigvert de Barcelona. Es cofundador y director médico de PelviArt, centro interdisciplinar de salud pélvica en Buenos Aires, y cofundador de Urodinamic, centro de diagnóstico urodinámico. Forma parte de la Unidad de Piso Pélvico e Incontinencia del Hospital Nacional Posadas y fue jefe de la sección de urología funcional y urodinamia del IMAC. Se formó como urólogo en la UBA y el Hospital Tornú, donde fue jefe de residentes, y tiene el Máster en Urología Funcional, Femenina y Urodinamia de la Universidad de Salamanca. En ISEIE dirige y tutoriza el Diplomado en Uroginecología y Suelo Pélvico.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Barcelona, Cataluña, España', country_code = 'ES',
  slug = 'jorge-luis-cardozo', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Dr. Jorge Luis Cardozo · Urólogo · Suelo pélvico · ISEIE',
  meta_description = 'Urólogo experto en urología funcional, urodinamia y suelo pélvico. Fellow en Fundació Puigvert y director médico de PelviArt. Director en ISEIE.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/c4c7c989-84c9-4e9b-a1b4-eade430370c5-1793719271034.jpg',
  linkedin_url = 'https://www.linkedin.com/in/jorge-luis-cardozo-211b52192',
  portfolio_url = 'https://pelviart.com'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Director y tutor · Diplomado en Uroginecología y Suelo Pélvico', '2026-09-01', NULL, true, 'Dirige y tutoriza el Diplomado en Uroginecología y Suelo Pélvico (en remoto), con un enfoque clínico: evaluación funcional, diagnóstico avanzado y tratamiento integral de las patologías del suelo pélvico. Aporta su experiencia en docencia universitaria, investigación clínica y formación de residentes.', 1),
  (p, 'Fundació Puigvert', 'Fellow en Andrología', '2026-08-01', NULL, true, 'Fellowship a jornada completa y presencial en Barcelona: andrología, cirugía funcional y cirugía reconstructiva.', 2),
  (p, 'Centro Médico PelviArt', 'Cofundador, director médico y urólogo', '2022-06-01', NULL, true, 'Centro interdisciplinar de Buenos Aires especializado en urología funcional, suelo pélvico, andrología y salud sexual masculina: disfunción eréctil, trastornos miccionales, urodinamia y abordajes diagnósticos y terapéuticos avanzados.', 3),
  (p, 'Urodinamic', 'Cofundador', '2019-08-01', NULL, true, 'Centro privado de Buenos Aires especializado en el diagnóstico urodinámico.', 4),
  (p, 'Hospital Nacional Alejandro Posadas', 'Urólogo · Unidad de Piso Pélvico e Incontinencia', '2019-05-01', NULL, true, 'Urólogo de la Unidad de Piso Pélvico e Incontinencia del Servicio de Urología (Morón, Gran Buenos Aires): estudios urodinámicos, evaluación de trastornos miccionales y cirugía funcional.', 5),
  (p, 'Casa Hospital San Juan de Dios', 'Urólogo · Uroginecología y piso pélvico', '2022-03-01', '2023-05-31', false, 'Uroginecología y piso pélvico a jornada parcial en Castelar (Provincia de Buenos Aires).', 6),
  (p, 'IMAC · Instituto Médico de Alta Complejidad', 'Urólogo · Jefe de sección de urología funcional y urodinamia', '2016-06-01', '2023-01-31', false, 'Jefe de la sección de urología funcional y urodinamia durante casi siete años, en Buenos Aires.', 7),
  (p, 'OSPeTV', 'Urólogo', '2018-08-01', '2023-01-31', false, 'Consulta de urología a jornada parcial en Buenos Aires.', 8),
  (p, 'TV Salud', 'Urólogo', '2019-05-01', '2023-02-28', false, 'Consulta de urología en Buenos Aires.', 9),
  (p, 'Urosalud', 'Urólogo · Sección de urodinamia', '2015-08-01', '2019-04-30', false, 'Encargado de los estudios urodinámicos.', 10),
  (p, 'Hospital General de Agudos Dr. E. Tornú', 'Jefe de residentes de Urología', '2018-06-01', '2019-05-31', false, 'Coordinación y formación de los residentes del servicio de Urología.', 11),
  (p, 'Hospital General de Agudos Dr. E. Tornú', 'Médico residente de Urología', '2014-06-01', '2018-05-31', false, 'Residencia de Urología del Gobierno de la Ciudad de Buenos Aires.', 12),
  (p, 'Fundació Puigvert', 'Médico urólogo rotante', '2018-01-01', '2018-02-28', false, 'Rotaciones en Barcelona por la sección de incontinencia y disfunciones miccionales y por la de cirugía reconstructiva genital.', 13);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'Universidad de Salamanca', 'Máster', 'Urología Funcional, Urología Femenina y Urodinamia', '2021-03-01', '2021-12-31', 1),
  (p, 'SAUMB', 'Diplomatura', 'Ecografía en medicina interna', '2021-03-01', '2021-12-31', 2),
  (p, 'Hospital Nacional Alejandro Posadas', 'Fellowship', 'Urología funcional y piso pélvico', '2019-01-01', '2020-12-31', 3),
  (p, 'Universidad de Buenos Aires', 'Especialista (posgrado universitario)', 'Urología', '2016-01-01', '2018-12-31', 4),
  (p, 'Gobierno de la Ciudad de Buenos Aires · Hospital Tornú', 'Residencia médica', 'Urología', '2014-06-01', '2018-05-31', 5),
  (p, 'Universidad de Buenos Aires', 'Título de Médico', 'Medicina', '2006-01-01', '2013-12-31', 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Español', 'Native', true, 1),
  (p, 'Inglés', 'C1', false, 2),
  (p, 'Italiano', 'C1', false, 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Urología funcional', 'EXPERT', 1),
  (p, 'Urodinamia', 'EXPERT', 2),
  (p, 'Suelo pélvico', 'EXPERT', 3),
  (p, 'Incontinencia urinaria', 'EXPERT', 4),
  (p, 'Uroginecología', 'EXPERT', 5),
  (p, 'Neuro-urología', 'ADVANCED', 6),
  (p, 'Andrología', 'ADVANCED', 7),
  (p, 'Ecografía del suelo pélvico', 'ADVANCED', 8),
  (p, 'Cirugía funcional y reconstructiva', 'ADVANCED', 9),
  (p, 'Cirugía laparoscópica', 'ADVANCED', 10),
  (p, 'Dirección médica', 'ADVANCED', 11),
  (p, 'Formación de residentes', 'ADVANCED', 12);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Diplomado en Uroginecología y Suelo Pélvico', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/diplomados/diplomado-en-uroginecologia-y-suelo-pelvico/', 1);

END $$;
