-- ============================================================================
-- SEED: Directora ISEIE · Dra. Marina Areny Balagueró (Psicología · Curso de Psicología)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS»)
--   · https://iseie.com/director/marina-areny-balaguero/ (misma bio que el CV)
--   · LinkedIn https://www.linkedin.com/in/marina-areny-balaguero-b45b8b29 (03/11/2026: puestos, fechas,
--   ·   formación, publicaciones, acreditación COPC y web de MÒUU)
--   · Vídeo de presentación del curso (canal oficial de ISEIE): https://youtu.be/n1k2YI-vB8g
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: directora y tutora de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/09/WhatsApp-Image-2026-09-17-at-3.31.47-PM.jpeg, subido a profile-assets/avatars/ el 03/11/2026.
-- Acreditación COPC sin fecha en las fuentes: certificación sin fecha.
-- Fecha de ISEIE: julio de 2026, según su LinkedIn.
-- Se omiten de LinkedIn las aptitudes «Sanación pránica» y «Curación»: no son clínicas y chocan con
-- el enfoque basado en la evidencia de su propio perfil.
-- Máster en Neurociencias: LinkedIn lo pone en la Universitat de Barcelona en el encabezado, pero el
-- detalle dice Instituto de Altos Estudios Universitarios / Univ. Internacional Miguel de Cervantes.
-- Se usa el detalle, que es más preciso. Confirmar con ella.
-- Se omiten puestos sin relación con la psicología clínica (recepción en un laboratorio, monitora de tiempo libre).
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       marina.areny@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'marina-areny';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Dra. Marina Areny Balagueró
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'marina.areny@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario marina.areny@iseie.com en auth.users. Crearlo antes de ejecutar.';
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
  full_name = 'Dra. Marina Areny Balagueró',
  headline = 'Doctora en Psicología Clínica (UAB) · Neuropsicóloga infantil acreditada por el COPC · Docente en UNIR · Directora del Curso de Psicología de ISEIE',
  summary = 'Psicóloga clínica y neuropsicóloga, doctora en Psicología Clínica y de la Salud por la Universitat Autònoma de Barcelona, con tesis sobre la toma de decisiones en pacientes con daño cerebral adquirido. Neuropsicóloga infantil acreditada por el COPC. Desde 2013 dirige MÒUU Autosuperat, en Sabadell, y desde 2019 es docente en UNIR, donde dirige TFM del Máster en Neuropsicología. Trabajó diez años como neuropsicóloga en la Fundació AVAN (estimulación y rehabilitación cognitiva) y se formó en el Institut Guttmann, primero como psicóloga residente y después en su servicio privado de neuropsicología. Tiene másteres en neuropsicología y en investigación en psicología clínica por la UAB y ha publicado sobre daño cerebral y toma de decisiones. En ISEIE dirige y tutoriza el Curso de Psicología.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Barcelona, Cataluña, España', country_code = 'ES',
  slug = 'marina-areny', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Dra. Marina Areny · Neuropsicóloga clínica · ISEIE',
  meta_description = 'Doctora en Psicología Clínica (UAB) y neuropsicóloga infantil acreditada por el COPC. Docente en UNIR. Directora del Curso de Psicología de ISEIE.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/583f5c7a-faea-414a-b67b-d9a92b5b3a5b-1793719273253.jpg',
  linkedin_url = 'https://www.linkedin.com/in/marina-areny-balaguero-b45b8b29',
  portfolio_url = 'https://www.mouuautosuperat.info'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Directora y tutora · Curso de Psicología', '2026-07-01', NULL, true, 'Dirige y tutoriza el Curso de Psicología (en remoto) desde la neuropsicología clínica y las neurociencias aplicadas: evaluación cognitiva, rehabilitación neuropsicológica y abordaje integral del funcionamiento cerebral, con rigor científico y práctica basada en la evidencia.', 1),
  (p, 'UNIR · Universidad Internacional de La Rioja', 'Profesora · Directora de TFM', '2019-05-01', NULL, true, 'Docente en remoto. Directora de Trabajos Fin de Máster del Máster en Neuropsicología, tutora de la asignatura «TIC y Neurociencia» y creadora de la asignatura «TIC como desarrollo emocional» del Máster en Educación Emocional.', 2),
  (p, 'MÒUU Autosuperat', 'Directora', '2013-11-01', NULL, true, 'Dirige su propio centro en Sabadell. Incluye estimulación cognitiva a domicilio y formación.', 3),
  (p, 'Fundació Privada AVAN', 'Neuropsicóloga', '2009-01-01', '2019-07-31', false, 'Más de diez años a jornada parcial en Sabadell: estimulación y rehabilitación cognitiva de pacientes con enfermedades neurológicas, programación y gestión del programa NPT y coordinación del programa ANEM (2009-2013).', 4),
  (p, 'Institut Guttmann', 'Neuropsicóloga · Servicio privado de neuropsicología', '2011-09-01', '2014-09-30', false, 'Neuropsicóloga del servicio privado del hospital de neurorrehabilitación, con estimulación cognitiva a domicilio en Barcelona.', 5),
  (p, 'Hospital de Día Sant Jordi (Terrassa)', 'Becaria de investigación', '2010-01-01', '2011-12-31', false, 'Beca de investigación de 20 horas semanales.', 6),
  (p, 'Institut Guttmann', 'Psicóloga residente', '2008-01-01', '2010-12-31', false, 'Residencia en neuropsicología en el hospital de neurorrehabilitación (25 horas semanales).', 7);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'Universitat Autònoma de Barcelona', 'Doctorado', 'Psicología Clínica y de la Salud', '2013-09-01', '2016-10-31', 1),
  (p, 'INEFOC', 'Especialización', 'Neuropsicología infantil', '2013-01-01', '2015-12-31', 2),
  (p, 'Universitat Autònoma de Barcelona', 'Máster Oficial', 'Investigación en Psicología Clínica y de la Salud', '2011-09-01', '2012-08-31', 3),
  (p, 'Universitat Autònoma de Barcelona · Hospital del Mar', 'Máster', 'Neuropsicología y Neurología de la Conducta', '2008-09-01', '2010-07-31', 4),
  (p, 'IAEU · Universidad Internacional Miguel de Cervantes', 'Máster de Especialista', 'Neurociencias', '2008-09-01', '2009-07-31', 5),
  (p, 'Blanquerna · Universitat Ramon Llull', 'Licenciatura', 'Psicología', '2004-09-01', '2008-06-30', 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Catalán', 'Native', true, 1),
  (p, 'Español', 'Native', true, 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Neuropsicología clínica', 'EXPERT', 1),
  (p, 'Evaluación neuropsicológica', 'EXPERT', 2),
  (p, 'Rehabilitación cognitiva', 'EXPERT', 3),
  (p, 'Estimulación cognitiva', 'EXPERT', 4),
  (p, 'Daño cerebral adquirido', 'EXPERT', 5),
  (p, 'Neuropsicología infantil', 'ADVANCED', 6),
  (p, 'Demencias', 'ADVANCED', 7),
  (p, 'Trastornos del neurodesarrollo', 'ADVANCED', 8),
  (p, 'Investigación clínica', 'ADVANCED', 9),
  (p, 'Dirección de TFM', 'ADVANCED', 10),
  (p, 'Docencia universitaria online', 'ADVANCED', 11),
  (p, 'Coaching', 'INTERMEDIATE', 12);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Curso de Psicología', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/psicologia/', 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6b: PORTFOLIO · vídeos
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Presentación del Curso de Psicología', 'Vídeo de presentación en el canal de ISEIE Innovation School.', 'VIDEO', 'https://youtu.be/n1k2YI-vB8g', 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6c: PORTFOLIO · publicaciones
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p, 'Relación entre búsqueda de sensaciones y la toma de decisiones en pacientes con daño cerebral adquirido', 'Psicología: Avances de la Disciplina, vol. 10, n.º 1, pp. 25-33 (2016).', 'WRITING', 21),
  (p, 'Balloon Analogue Risk Task to assess decision-making in Acquired Brain Injury', 'International Journal of Psychological Research, vol. 9, n.º 1 (2016).', 'WRITING', 22),
  (p, 'Influencia de la memoria de trabajo y la flexibilidad cognitiva en la ejecución de la tarea Balloon Analogue Risk Task', 'Psicología: Avances de la Disciplina (2015).', 'WRITING', 23);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO · certificados y formación complementaria
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, issue_date, expiry_date, type, sort_order) VALUES
  (p, 'Neuropsicóloga infantil acreditada', 'Col·legi Oficial de Psicologia de Catalunya (COPC)', NULL, NULL, 'CERTIFICATION', 11);

END $$;
