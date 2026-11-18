-- ============================================================================
-- SEED: Directora ISEIE · Elena Lafuente Sánchez (Farmacia · Cosmética y Dermofarmacia)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS», 28/10/2026)
--   · https://iseie.com/director/elena-lafuente-sanchez/ (misma bio que el CV)
--   · LinkedIn https://www.linkedin.com/in/elenalafuentesanchez (revisado el 03/11/2026: fechas, ubicación, idiomas)
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: directora y tutora de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/10/foto-de-perfil-1.jpeg, subido a profile-assets/avatars/ el 03/11/2026.
-- Datos personales: el CV trae DNI y correo personal. NO se publican.
-- Fecha de ISEIE: aproximada (octubre de 2026, cuando se publicó su ficha y su foto en
-- iseie.com). Ni el CV ni LinkedIn la indican.
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       elena.lafuente@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'elena-lafuente';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Elena Lafuente Sánchez
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'elena.lafuente@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario elena.lafuente@iseie.com en auth.users. Crearlo antes de ejecutar.';
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
  full_name = 'Elena Lafuente Sánchez',
  headline = 'Farmacéutica titular · Dermofarmacia y Formulación Cosmética · Directora del Máster en Cosmética y Dermofarmacia de ISEIE',
  summary = 'Farmacéutica con más de 20 años entre la oficina de farmacia y la industria. Desde 2022 es titular de su farmacia en León, centrada en dermofarmacia, fitoterapia y suplementación: evalúa cada producto y recomienda según la evidencia científica. Divulga sobre el cuidado de la piel como La Botica de Vega. Antes pasó más de quince años en la industria: en Arkopharma formó a farmacéuticos y técnicos y coordinó una red de dietistas-nutricionistas, y fue especialista de producto en Zambon. Licenciada en Farmacia por la Universidad de Salamanca, con másteres en Dermofarmacia y Formulación Cosmética (UNIR) y en Biotecnología, y Experta Universitaria en Nutrición, Dietética y Fitoterapia (UNED). En ISEIE dirige y tutoriza el Diplomado y el Máster en Cosmética y Dermofarmacia.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'León, Castilla y León, España', country_code = 'ES',
  slug = 'elena-lafuente', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Elena Lafuente · Farmacéutica y Dermofarmacia · ISEIE',
  meta_description = 'Farmacéutica titular en León con más de 20 años en farmacia e industria (Arkopharma, Zambon). Directora del Máster en Cosmética y Dermofarmacia de ISEIE.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/084764f1-e2b8-4291-a841-a0d3966ac840-1793719269351.jpg',
  linkedin_url = 'https://www.linkedin.com/in/elenalafuentesanchez'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Directora y tutora · Diplomado y Máster en Cosmética y Dermofarmacia', '2026-10-01', NULL, true, 'Dirige y tutoriza el Diplomado y el Máster en Cosmética y Dermofarmacia (en remoto). Conecta los contenidos con situaciones reales de la farmacia y de la industria: análisis crítico de productos y de su formulación, asesoramiento dermocosmético personalizado y comunicación rigurosa con el paciente.', 1),
  (p, 'Farmacia Elena Lafuente Sánchez', 'Farmacéutica titular', '2022-03-01', NULL, true, 'Titular de su propia oficina de farmacia en León. Atención, asesoramiento y gestión farmacéutica, con dedicación especial a la dermofarmacia, la fitoterapia y la suplementación: análisis de las necesidades de cada persona y evaluación de productos para recomendar con fundamento. Divulga contenidos de salud y cuidado de la piel en sus canales digitales con el nombre de La Botica de Vega.', 2),
  (p, 'Zambon', 'Especialista de producto', '2019-05-01', '2021-11-30', false, 'Especialista de producto del laboratorio en la zona de León (Castilla y León).', 3),
  (p, 'Arkopharma', 'Especialista de producto / Coordinadora de área', '2007-03-01', '2019-04-30', false, 'Doce años en el laboratorio cubriendo León, Asturias, Valladolid, Burgos, Salamanca, Palencia y Zamora. Formación de farmacéuticos y técnicos de farmacia, organización de cursos y conferencias para profesionales y coordinación de una red de dietistas-nutricionistas.', 4),
  (p, 'Mölnlycke Health Care', 'Delegada comercial', '2005-10-01', '2007-02-28', false, 'Representación y comunicación con profesionales sanitarios en Madrid.', 5),
  (p, 'Grupo Juste', 'Product Manager', '2004-06-01', '2005-10-31', false, 'Gestión de producto en Madrid. Participación en estudios de mercado y en los planes de lanzamiento de productos biotecnológicos.', 6),
  (p, 'Farmacia Crisanto Martín', 'Farmacéutica', '2002-10-01', '2003-03-31', false, 'Primera etapa profesional en oficina de farmacia, en Salamanca.', 7);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'UNIR · Universidad Internacional de La Rioja', 'Máster', 'Dermofarmacia y Formulación Cosmética', '2022-02-01', '2022-12-31', 1),
  (p, 'UNED · Universidad Nacional de Educación a Distancia', 'Experto Universitario', 'Nutrición, Dietética y Fitoterapia en Medicina Familiar y Comunitaria', '2009-01-01', '2009-12-31', 2),
  (p, 'Áliter, Escuela Internacional de Negocios (Madrid)', 'Máster', 'Biotecnología', '2003-01-01', '2004-12-31', 3),
  (p, 'Universidad de Salamanca', 'Licenciatura', 'Farmacia', '1996-09-01', '2003-06-30', 4);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Español', 'Native', true, 1),
  (p, 'Inglés', 'C1', false, 2),
  (p, 'Italiano', 'A2', false, 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Dermofarmacia', 'EXPERT', 1),
  (p, 'Asesoramiento dermocosmético', 'EXPERT', 2),
  (p, 'Formulación cosmética', 'ADVANCED', 3),
  (p, 'Gestión de oficina de farmacia', 'EXPERT', 4),
  (p, 'Industria farmacéutica', 'EXPERT', 5),
  (p, 'Formación de profesionales sanitarios', 'EXPERT', 6),
  (p, 'Fitoterapia y suplementación', 'ADVANCED', 7),
  (p, 'Nutrición y dietética', 'ADVANCED', 8),
  (p, 'Biotecnología', 'ADVANCED', 9),
  (p, 'Marketing de producto', 'ADVANCED', 10),
  (p, 'Coordinación de equipos', 'ADVANCED', 11),
  (p, 'Divulgación científica', 'ADVANCED', 12);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Máster en Cosmética y Dermofarmacia', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/cosmetica-y-dermofarmacia/', 1),
  (p, 'Diplomado en Cosmética y Dermofarmacia', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/diplomados/cosmetica-y-dermofarmacia/', 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO · certificados y formación complementaria
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, issue_date, expiry_date, type, sort_order) VALUES
  (p, 'Fundamentos de la Terapéutica Medicamentosa', 'Consejo General de Colegios Oficiales de Farmacéuticos', '2011', NULL, 'CERTIFICATION', 11),
  (p, 'El Medicamento y la Industria Farmacéutica: del Diseño Molecular a la Farmacia', 'Consejo General de Colegios Oficiales de Farmacéuticos', '2011', NULL, 'CERTIFICATION', 12),
  (p, 'Biotecnología y Biofármacos', 'Consejo General de Colegios Oficiales de Farmacéuticos', '2010', NULL, 'CERTIFICATION', 13),
  (p, 'Técnicas de Marketing', 'Cámara de Comercio de Madrid', '2004', NULL, 'CERTIFICATION', 14);

END $$;
