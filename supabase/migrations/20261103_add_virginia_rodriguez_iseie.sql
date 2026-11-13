-- ============================================================================
-- SEED: Directora ISEIE · Virginia Rodríguez Ramos (Podología · Biomecánica y Ortesis Plantar)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS»)
--   · https://iseie.com/director/virginia-rodriguez-ramos/ (misma bio que el CV)
--   · Diario de Ferrol, 28/06/2024: Bio-Zen «dirigida por la podóloga Virginia Rodríguez Ramos», abierta en 2017
--   · Doctoralia (perfil de Narón): Clínica de Fisioterapia Calaza; Universidad de Coruña; especialista en podología infantil y biomecánica deportiva
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: directora y tutora de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/09/foto-cv.jpeg, subido a profile-assets/avatars/ el 03/11/2026.
-- Titulaciones y cursos sin fecha en las fuentes: van como certificaciones sin fecha (la plantilla passport las pinta limpias; en Experiencia/Formación saldrían como « - Actualidad»).
-- Datos personales: el CV trae DNI y correo personal. NO se publican.
-- LinkedIn: la hoja pone «Virginiatodriguezramos» (no existe). Hay dos cuentas casi vacías
-- («Podóloga en Bio-Zen Narón», sin más datos) y no se sabe cuál es la suya: no se enlaza.
-- Fecha de ISEIE: aproximada (septiembre de 2026, cuando se publicó su ficha en iseie.com).
-- Bio-Zen: abrió en 2017 (Diario de Ferrol); se pone 2017-01-01 porque solo se sabe el año.
-- Doctoralia cita francés e inglés sin nivel: no se publican idiomas que no tengan nivel.
-- PENDIENTE pedirle: años de la diplomatura/grado y de Clínica Calaza, y fechas de las colaboraciones con clubes.
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       virginia.rodriguez@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'virginia-rodriguez';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Virginia Rodríguez Ramos
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'virginia.rodriguez@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario virginia.rodriguez@iseie.com en auth.users. Crearlo antes de ejecutar.';
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
  full_name = 'Virginia Rodríguez Ramos',
  headline = 'Podóloga · Responsable de Biomecánica en Bio-Zen (Narón) · Podología deportiva e infantil · Directora del Diplomado en Ortesis Plantar de ISEIE',
  summary = 'Podóloga especializada en biomecánica, podología deportiva y podología infantil. Analiza la función del aparato locomotor y la pisada para diseñar tratamientos personalizados con ortesis plantares. Dirige Bio-Zen, su clínica de podología en Narón, desde que abrió en 2017, y es responsable de su área de biomecánica. Antes trabajó en clínicas y centros de rehabilitación, como la Clínica de Fisioterapia Calaza. En podología deportiva ha colaborado con el BAXI Ferrol (Liga Endesa), O Parrulo Ferrol (LNFS), Náutico de Narón Triatlón y Cidade de Narón Fútbol Sala en la prevención y el seguimiento de lesiones. Diplomada en Podología por la Universidade da Coruña y tutora de prácticas clínicas. En ISEIE dirige y tutoriza el Diplomado en Evaluación Biomecánica y Ortesis Plantar.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Narón, A Coruña, Galicia, España', country_code = 'ES',
  slug = 'virginia-rodriguez', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Virginia Rodríguez · Podóloga · Biomecánica · ISEIE',
  meta_description = 'Podóloga experta en biomecánica, podología deportiva e infantil y ortesis plantares. Responsable de Biomecánica en Bio-Zen (Narón). Directora en ISEIE.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/831e212f-98b9-4ed9-b398-9adb9467ef3e-1793719274117.jpg',
  linkedin_url = NULL
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Directora y tutora · Diplomado en Evaluación Biomecánica y Ortesis Plantar', '2026-09-01', NULL, true, 'Dirige y tutoriza el Diplomado en Evaluación Biomecánica y Ortesis Plantar (en remoto), con un enfoque práctico: análisis de la marcha, valoración funcional del pie y tratamiento personalizado con ortesis plantares. Aporta su experiencia clínica y en biomecánica deportiva.', 1),
  (p, 'Bio-Zen Narón', 'Directora y podóloga · Responsable de biomecánica', '2017-01-01', NULL, true, 'Dirige la clínica de podología y fisioterapia de Narón desde su apertura en 2017 y lidera su área de biomecánica: estudios de la pisada, análisis del gesto deportivo con plantillas sensorizadas y ortesis plantares a medida. Podología infantil con énfasis en la prevención y podología deportiva con equipos y deportistas de la comarca.', 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Español', 'Native', true, 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Biomecánica del aparato locomotor', 'EXPERT', 1),
  (p, 'Análisis de la marcha y de la pisada', 'EXPERT', 2),
  (p, 'Ortesis plantares a medida', 'EXPERT', 3),
  (p, 'Podología deportiva', 'EXPERT', 4),
  (p, 'Podología infantil', 'ADVANCED', 5),
  (p, 'Exploración biomecánica y postural', 'ADVANCED', 6),
  (p, 'Baropodometría', 'ADVANCED', 7),
  (p, 'Ortesis digitales', 'ADVANCED', 8),
  (p, 'Quiropodología', 'ADVANCED', 9),
  (p, 'Readaptación de lesiones', 'ADVANCED', 10),
  (p, 'Coordinación de equipos clínicos', 'ADVANCED', 11),
  (p, 'Tutoría de prácticas clínicas', 'ADVANCED', 12);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Diplomado en Evaluación Biomecánica y Ortesis Plantar', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/diplomados/diplomado-en-evaluacion-biomecanica-y-ortesis-plantar/', 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO · certificados y formación complementaria
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, issue_date, expiry_date, type, sort_order) VALUES
  (p, 'Diplomatura en Podología', 'Universidade da Coruña', NULL, NULL, 'CERTIFICATION', 11),
  (p, 'Biomecánica del aparato locomotor, baropodometría y exploración biomecánica y postural', 'Formación complementaria', NULL, NULL, 'CERTIFICATION', 12),
  (p, 'Ortesiología, ortesis digitales y readaptación de lesiones', 'Formación complementaria', NULL, NULL, 'CERTIFICATION', 13);

END $$;
