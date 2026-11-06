-- ============================================================================
-- SEED: Director ISEIE · Dr. Yiro Nakamura Cardemil (Medicina · Cirugía de Columna Vertebral)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS»)
--   · https://iseie.com/director/yiro-nakamura-cardemil/ (misma bio que el CV)
--   · LinkedIn https://www.linkedin.com/in/yiro-nakamura-cardemil-3b752b114 (03/11/2026: puestos, fechas,
--   ·   formación y colegiación)
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: director y tutor de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/09/FOTO-YIRO-NAKAMURA.png, subido a profile-assets/avatars/ el 03/11/2026.
-- Datos personales: el CV trae DNI y correo personal. NO se publican. Tampoco los números de colegiado.
-- OJO «Barcelona»: la bio habla de «instituciones hospitalarias de referencia en Barcelona», pero la
-- jefatura de servicio y el Hospital Dr. Luis Razetti están en Barcelona (Anzoátegui, VENEZUELA). En
-- Barcelona (España) es fellow en Sant Pau (desde sept. 2025, sin vinculación laboral) y doctorando
-- en la UAB (desde mar. 2026). Se escribe así para no inducir a error.
-- Fecha de ISEIE: aproximada (septiembre de 2026, cuando se publicó su ficha en iseie.com).
-- LinkedIn marca como actuales los puestos en Venezuela y el fellowship de Northwestern (desde 2019):
-- se respetan tal cual. Confirmar con él si siguen vigentes.
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       yiro.nakamura@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'yiro-nakamura';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Dr. Yiro Nakamura Cardemil
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'yiro.nakamura@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario yiro.nakamura@iseie.com en auth.users. Crearlo antes de ejecutar.';
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
  full_name = 'Dr. Yiro Nakamura Cardemil',
  headline = 'Neurocirujano · Base de cráneo, hipófisis y columna mínimamente invasiva · Fellow en Sant Pau · Director del Máster de Columna de ISEIE',
  summary = 'Neurocirujano especializado en cirugía de base de cráneo e hipófisis, columna vertebral mínimamente invasiva y neuroendoscopia. Desde 2025 es fellow clínico-quirúrgico de base de cráneo e hipófisis en el Hospital de la Santa Creu i Sant Pau de Barcelona y, desde 2026, doctorando en Cirugía en la Universitat Autònoma de Barcelona. Se formó en Neurocirugía y Cirugía de Columna en la Universidad de Oriente y el Hospital Universitario Dr. Luis Razetti de Barcelona (Venezuela) con Magna Cum Laude, e hizo un fellowship en microneurocirugía y base de cráneo en Northwestern (Chicago). En Venezuela es jefe del Servicio de Neurocirugía del Hospital Dr. Domingo Guzmán Lander y profesor en la Universidad de Oriente. En ISEIE dirige y tutoriza el Máster en Cirugía de Columna Vertebral.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Barcelona, Cataluña, España', country_code = 'ES',
  slug = 'yiro-nakamura', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Dr. Yiro Nakamura · Neurocirujano de columna · ISEIE',
  meta_description = 'Neurocirujano experto en base de cráneo, hipófisis y columna mínimamente invasiva. Fellow en Sant Pau. Director del Máster de Columna de ISEIE.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/d1a92cfd-8961-4de7-a550-7c7cdde52d39-1793719275517.jpg',
  linkedin_url = 'https://www.linkedin.com/in/yiro-nakamura-cardemil-3b752b114'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Director y tutor · Máster en Cirugía de Columna Vertebral', '2026-09-01', NULL, true, 'Dirige y tutoriza el Máster en Cirugía de Columna Vertebral (en remoto) desde su experiencia quirúrgica en columna, neuroendoscopia y técnicas mínimamente invasivas, y desde su trayectoria docente en neuroanatomía y técnica quirúrgica.', 1),
  (p, 'Hospital de la Santa Creu i Sant Pau', 'Fellow clínico-quirúrgico en base de cráneo e hipófisis', '2025-09-01', NULL, true, 'Fellowship presencial en Barcelona en cirugía de base de cráneo e hipófisis, a cargo del jefe del servicio, sin vinculación laboral con el hospital. Desde marzo de 2026 es además doctoral fellow.', 2),
  (p, 'Hospital Dr. Domingo Guzmán Lander (IVSS Las Garzas)', 'Jefe del Servicio de Neurocirugía', '2020-12-01', NULL, true, 'Jefe del Servicio de Neurocirugía a jornada completa en Lechería (Anzoátegui, Venezuela): neurocirugía, cirugía de columna vertebral y de nervios periféricos.', 3),
  (p, 'Hospital IVSS Dr. Domingo Luciani', 'Neurocirujano de plantilla', '2025-03-01', NULL, true, 'Neurocirujano del Instituto Venezolano de los Seguros Sociales en Caracas.', 4),
  (p, 'Hospital Universitario Dr. Luis Razetti', 'Especialista adjunto en Neurocirugía', '2017-01-01', NULL, true, 'Adjunto de Neurocirugía a jornada completa en Barcelona (Anzoátegui, Venezuela), con incorporación directa al terminar la residencia como número uno de su promoción. Cirugía de tumores cerebrales, base de cráneo, columna y neuroendoscopia.', 5),
  (p, 'Universidad de Oriente (Venezuela)', 'Profesor universitario de pregrado y posgrado', '2016-01-01', NULL, true, 'Profesor del área clínica de la Escuela de Medicina y del posgrado de Neurocirugía. Desde 2005 colabora como preparador docente en las cátedras de Anatomía, Neuroanatomía y Fisiopatología.', 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'Universitat Autònoma de Barcelona', 'Doctorado (en curso)', 'Cirugía y Ciencias Morfológicas', '2026-03-01', NULL, 1),
  (p, 'Northwestern University · Northwestern Memorial Hospital (Chicago)', 'Fellowship', 'Microneurocirugía, base de cráneo endoscópica y neurovascular', '2019-01-01', NULL, 2),
  (p, 'Universidad de Oriente · Hospital Universitario Dr. Luis Razetti', 'Especialización (Magna Cum Laude)', 'Neurocirugía y Cirugía de Columna Vertebral', '2012-01-01', '2016-12-31', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Español', 'Native', true, 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Neurocirugía', 'EXPERT', 1),
  (p, 'Cirugía de base de cráneo', 'EXPERT', 2),
  (p, 'Cirugía de hipófisis endoscópica transesfenoidal', 'EXPERT', 3),
  (p, 'Cirugía de columna mínimamente invasiva', 'EXPERT', 4),
  (p, 'Neuroendoscopia', 'EXPERT', 5),
  (p, 'Tumores cerebrales', 'ADVANCED', 6),
  (p, 'Neurotrauma', 'ADVANCED', 7),
  (p, 'Neuralgia del trigémino y espasmo hemifacial', 'ADVANCED', 8),
  (p, 'Microneurocirugía', 'ADVANCED', 9),
  (p, 'Docencia en neuroanatomía', 'ADVANCED', 10),
  (p, 'Gestión sanitaria', 'ADVANCED', 11),
  (p, 'Investigación clínica', 'INTERMEDIATE', 12);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Máster en Cirugía de Columna Vertebral', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/master-en-cirugia-en-columna-vertebral/', 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO · certificados y formación complementaria
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, issue_date, expiry_date, type, sort_order) VALUES
  (p, 'Colegiado médico en España', 'Col·legi de Metges', '2025-10', NULL, 'CERTIFICATION', 11),
  (p, 'Título de Neurocirujano', 'Universidad de Oriente (Venezuela)', '2016-11', NULL, 'CERTIFICATION', 12);

END $$;
