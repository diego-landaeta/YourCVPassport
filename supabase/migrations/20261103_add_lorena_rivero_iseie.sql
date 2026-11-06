-- ============================================================================
-- SEED: Directora ISEIE · Lorena Rivero Moriano (Enfermería · Instrumentación Quirúrgica)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS»): fechas de Clínica Baviera (dic. 2017) y de la supervisión (jun. 2023)
--   · https://iseie.com/director/lorena-rivero-moriano/ (misma bio que el CV)
--   · LinkedIn https://www.linkedin.com/in/lorena-rivero-moriano-35a26286 (03/11/2026: confirma Clínica Baviera, Madrid)
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: directora y tutora de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/10/WhatsApp-Image-2026-10-01-at-7.20.06-AM.jpeg, subido a profile-assets/avatars/ el 03/11/2026.
-- Titulaciones y cursos sin fecha en las fuentes: van como certificaciones sin fecha (la plantilla passport las pinta limpias; en Experiencia/Formación saldrían como « - Actualidad»).
-- Datos personales: el CV trae DNI y correo personal. NO se publican.
-- Fechas: LinkedIn pone Clínica Baviera desde sept. de 2018; el CV, desde dic. de 2017. Se usa el CV
-- (es más reciente y lo entregó ella a ISEIE).
-- Fecha de ISEIE: aproximada (octubre de 2026, cuando se publicó su ficha en iseie.com).
-- PENDIENTE pedirle: años en La Paz, La Princesa y Gregorio Marañón, y años de la Diplomatura (UCM),
-- la adaptación al Grado (UAX), el Máster en Urgencias y Emergencias (URJC) y el Experto en
-- Quirófano (UCM). Con eso se completan experiencia y formación (hoy solo están en el resumen).
-- Experiencia 2013 en la sanidad pública de Madrid: LinkedIn («enfermera · Comunidad de Madrid · 2013»).
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       lorena.rivero@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'lorena-rivero';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Lorena Rivero Moriano
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'lorena.rivero@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario lorena.rivero@iseie.com en auth.users. Crearlo antes de ejecutar.';
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
  full_name = 'Lorena Rivero Moriano',
  headline = 'Enfermera instrumentista y supervisora de quirófano en Clínica Baviera · Máster en Urgencias (URJC) · Directora del Curso de Instrumentación de ISEIE',
  summary = 'Enfermera con experiencia en cirugía, instrumentación oftalmológica, cuidados críticos, urgencias y reanimación. Desde diciembre de 2017 es enfermera instrumentista de cirugía oftalmológica en Clínica Baviera (Madrid) y, desde junio de 2023, también supervisora de quirófano. Antes trabajó en el Hospital Universitario La Paz, el Hospital Universitario de La Princesa y el Gregorio Marañón: quirófano de urgencias, reanimación, UCI de adultos, pediátrica y neonatal, urgencias y unidad del dolor. Diplomada en Enfermería por la Complutense y con adaptación al Grado (UAX), tiene el Máster Universitario en Urgencias y Emergencias de la Universidad Rey Juan Carlos (con mención honorífica) y el Experto en Quirófano de la Complutense. En ISEIE dirige y tutoriza el Curso de Instrumentación Quirúrgica.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Madrid, Comunidad de Madrid, España', country_code = 'ES',
  slug = 'lorena-rivero', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Lorena Rivero · Enfermera instrumentista · Quirófano · ISEIE',
  meta_description = 'Enfermera instrumentista y supervisora de quirófano en Clínica Baviera. Máster en Urgencias y Emergencias. Directora del Curso de Instrumentación de ISEIE.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/c65b2c7e-5200-4f34-a4c4-0ea7fa7e73a2-1793719271881.jpg',
  linkedin_url = 'https://www.linkedin.com/in/lorena-rivero-moriano-35a26286'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Directora y tutora · Curso de Instrumentación Quirúrgica', '2026-10-01', NULL, true, 'Dirige y tutoriza el Curso de Instrumentación Quirúrgica (en remoto). Acerca al alumnado a la realidad del quirófano desde su experiencia hospitalaria y como instrumentista y supervisora: preparación técnica, coordinación del equipo y seguridad del paciente en la atención perioperatoria.', 1),
  (p, 'Clínica Baviera', 'Supervisora de quirófano', '2023-06-01', NULL, true, 'Supervisión del quirófano de cirugía oftalmológica en Madrid: organización del bloque quirúrgico y coordinación del equipo de enfermería, compaginada con la instrumentación.', 2),
  (p, 'Clínica Baviera', 'Enfermera instrumentista de cirugía oftalmológica', '2017-12-01', NULL, true, 'Enfermera instrumentista en cirugía oftalmológica a jornada completa, en Madrid.', 3),
  (p, 'Sanidad pública de la Comunidad de Madrid', 'Enfermera', '2013-01-01', '2013-12-31', false, 'Enfermera en hospitales públicos de Madrid.', 4);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Español', 'Native', true, 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Instrumentación quirúrgica', 'EXPERT', 1),
  (p, 'Cirugía oftalmológica', 'EXPERT', 2),
  (p, 'Supervisión de quirófano', 'EXPERT', 3),
  (p, 'Enfermería perioperatoria', 'EXPERT', 4),
  (p, 'Seguridad del paciente quirúrgico', 'EXPERT', 5),
  (p, 'Urgencias y emergencias', 'ADVANCED', 6),
  (p, 'Cuidados intensivos', 'ADVANCED', 7),
  (p, 'Reanimación', 'ADVANCED', 8),
  (p, 'Cuidados intensivos neonatales y pediátricos', 'ADVANCED', 9),
  (p, 'Unidad del dolor', 'INTERMEDIATE', 10),
  (p, 'Coordinación de equipos de enfermería', 'ADVANCED', 11);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Curso de Instrumentación Quirúrgica', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/instrumentacion-quirurgica/', 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO · certificados y formación complementaria
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, issue_date, expiry_date, type, sort_order) VALUES
  (p, 'Máster Universitario en Urgencias y Emergencias (mención honorífica)', 'Universidad Rey Juan Carlos', NULL, NULL, 'CERTIFICATION', 11),
  (p, 'Experto en Quirófano', 'Universidad Complutense de Madrid', NULL, NULL, 'CERTIFICATION', 12),
  (p, 'Adaptación al Grado en Enfermería', 'Universidad Alfonso X el Sabio', NULL, NULL, 'CERTIFICATION', 13),
  (p, 'Diplomatura en Enfermería', 'Universidad Complutense de Madrid', NULL, NULL, 'CERTIFICATION', 14);

END $$;
