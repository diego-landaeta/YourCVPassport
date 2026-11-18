-- ============================================================================
-- SEED: Directora ISEIE · Carmen Teresa Arends Fonseca (Odontología · Odontología Geriátrica)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS»)
--   · https://iseie.com/director/master-odontologia-geriatrica/ (ficha de iseie.com)
--   · LinkedIn https://www.linkedin.com/in/odcarmenarends (03/11/2026: formación con fechas y puestos en Madrid)
--   · Vídeo de presentación del máster (canal oficial de ISEIE): https://youtu.be/1l6IR1LtUl4
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: directora y tutora de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/06/foto-corporativa.webp, subido a profile-assets/avatars/ el 03/11/2026.
-- Titulaciones y cursos sin fecha en las fuentes: van como certificaciones sin fecha (la plantilla passport las pinta limpias; en Experiencia/Formación saldrían como « - Actualidad»).
-- Ninguna fuente documenta formación o experiencia específica en odontología geriátrica: no se le
-- atribuye esa especialidad. Igual que con Luz Marina Zuluaga (20260519), la asignación al máster es
-- decisión académica de ISEIE.
-- Su práctica clínica como odontóloga rehabilitadora y su docencia (Anatomía Humana, Oclusión Dental)
-- no tienen centros ni fechas en ninguna fuente: van solo en el resumen. PENDIENTE pedírselos.
-- No consta si su título está homologado en España: no se afirma que ejerza la odontología en España.
-- Fecha de ISEIE: aproximada (junio de 2026, cuando se publicó su ficha en iseie.com).
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       carmen.arends@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'carmen-arends';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Carmen Teresa Arends Fonseca
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'carmen.arends@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario carmen.arends@iseie.com en auth.users. Crearlo antes de ejecutar.';
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
  full_name = 'Carmen Teresa Arends Fonseca',
  headline = 'Odontóloga · Rehabilitación oral y Prostodoncia (UNICOC) · Docente universitaria · Directora del Máster en Odontología Geriátrica de ISEIE',
  summary = 'Odontóloga especializada en rehabilitación oral y prostodoncia, con experiencia clínica, docencia universitaria y una etapa más reciente en el sector comercial sanitario. Es odontóloga por la Universidad del Zulia y especialista en Prostodoncia por UNICOC. Ha trabajado como odontóloga rehabilitadora en varias clínicas y como profesora universitaria de Anatomía Humana y de Oclusión Dental. En Madrid fue asesora comercial en Vitaldent, donde trabajó la captación y fidelización de pacientes, y desde 2024 es visitadora médica en Sercómex Pharma. Se ha formado como visitadora médica y en marketing digital sanitario. En ISEIE dirige y tutoriza el Máster en Odontología Geriátrica, centrado en la salud oral del adulto mayor.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Madrid, Comunidad de Madrid, España', country_code = 'ES',
  slug = 'carmen-arends', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Carmen Arends · Odontóloga y prostodoncista · ISEIE',
  meta_description = 'Odontóloga especializada en rehabilitación oral y prostodoncia (UNICOC). Directora del Máster en Odontología Geriátrica de ISEIE Innovation School.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/57d6176f-be6a-463e-a2f5-15cbcaec2338-1793719266769.jpg',
  linkedin_url = 'https://www.linkedin.com/in/odcarmenarends'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Directora y tutora · Máster en Odontología Geriátrica', '2026-06-01', NULL, true, 'Dirige y tutoriza el Máster en Odontología Geriátrica (en remoto), con una visión integral del cuidado odontológico del adulto mayor desde la rehabilitación oral y la prostodoncia.', 1),
  (p, 'Sercómex Pharma', 'Visitadora médica', '2024-04-01', NULL, true, 'Representante de ventas médicas a jornada parcial y en formato híbrido en Las Rozas de Madrid.', 2),
  (p, 'Vitaldent', 'Asesora comercial', '2023-12-01', '2024-03-31', false, 'Asesoría comercial en una clínica dental de Madrid: atención al paciente y estrategias de captación y fidelización.', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'Universidad Latinoamericana', 'Formación', 'Visitador médico', '2023-01-01', '2023-12-31', 1),
  (p, 'UNICOC · Institución Universitaria Colegios de Colombia', 'Especialización', 'Prostodoncia', '2012-01-01', '2015-12-31', 2),
  (p, 'Universidad del Zulia', 'Título de Odontóloga', 'Odontología', '2004-01-01', '2008-12-31', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Español', 'Native', true, 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Rehabilitación oral', 'EXPERT', 1),
  (p, 'Prostodoncia', 'EXPERT', 2),
  (p, 'Oclusión dental', 'ADVANCED', 3),
  (p, 'Odontología general', 'ADVANCED', 4),
  (p, 'Anatomía humana', 'ADVANCED', 5),
  (p, 'Docencia universitaria', 'ADVANCED', 6),
  (p, 'Visita médica', 'ADVANCED', 7),
  (p, 'Venta farmacéutica', 'ADVANCED', 8),
  (p, 'Marketing digital sanitario', 'INTERMEDIATE', 9),
  (p, 'Captación y fidelización de pacientes', 'ADVANCED', 10),
  (p, 'Atención al paciente', 'ADVANCED', 11);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Máster en Odontología Geriátrica', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/master-en-odontologia-geriatrica/', 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6b: PORTFOLIO · vídeos
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Presentación del Máster en Odontología Geriátrica', 'Vídeo de presentación en el canal de ISEIE Innovation School.', 'VIDEO', 'https://youtu.be/1l6IR1LtUl4', 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO · certificados y formación complementaria
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, issue_date, expiry_date, type, sort_order) VALUES
  (p, 'Marketing digital sanitario', 'Semana del Marketing Digital Sanitario (Marta Basterra)', NULL, NULL, 'CERTIFICATION', 11);

END $$;
