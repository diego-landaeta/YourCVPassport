-- ============================================================================
-- SEED: Directora ISEIE · Brigitte Blandin Labory (Negocios · Coaching y Coach Ontológico)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS»): dos fichas, Curso de Coaching y Curso Coach Ontológico
--   · https://iseie.com/director/brigitte-blandin-labory/
--   · LinkedIn https://www.linkedin.com/in/brigitteblandin (03/11/2026: puestos, fechas, formación,
--   ·   credencial ICF e idiomas)
--   · Vídeos de presentación de los dos cursos (canal oficial de ISEIE)
--   · Web https://brigitteblandin.com (03/11/2026): libros y Máster en Coaching y Neurociencia para el Desarrollo Humano reconocido por EUNEIZ
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: directora y tutora de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/07/Foto-de-perfil.webp, subido a profile-assets/avatars/ el 03/11/2026.
-- Credencial ICF ACC: expedida en jul. 2020 y CADUCADA en jul. 2023 según LinkedIn. Se publica con su
-- fecha de caducidad y no se la presenta como coach ICF en vigor. Si la ha renovado, actualizar.
-- Se omiten frases de marketing de LinkedIn que no se pueden comprobar («+40 % de productividad»,
-- «única formadora certificada en castellano a nivel internacional», «más de X coaches»).
-- La bio habla de «empresas multinacionales»; LinkedIn muestra trabajo por cuenta propia. Se describe
-- como coaching ejecutivo para empresas, sin afirmar nombres ni tamaños.
-- Fecha de ISEIE: aproximada (julio de 2026, cuando se publicó su ficha en iseie.com).
-- Su web no menciona la credencial ICF: se mantiene como caducada (jul. 2023) según LinkedIn.
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       brigitte.blandin@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'brigitte-blandin';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Brigitte Blandin Labory
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'brigitte.blandin@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario brigitte.blandin@iseie.com en auth.users. Crearlo antes de ejecutar.';
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
  full_name = 'Brigitte Blandin Labory',
  headline = 'Farmacéutica y coach ejecutiva · Neurociencia aplicada al coaching y al liderazgo · Directora de los cursos de Coaching de ISEIE',
  summary = 'Farmacéutica y coach especializada en neurociencia aplicada al coaching, el liderazgo y la inteligencia emocional. Desde 2020 es coach ejecutiva y formadora en liderazgo de directivos y equipos. Desde 2025 dirige su propia formación en Valencia, con un Máster en Coaching y Neurociencia reconocido por la Universidad EUNEIZ, y es autora de los libros «Cree en ti, ¡porque tú lo vales!» y «ClaraMENTE». Antes fue formadora del NeuroChange Method, gerente en España de Life in Balance Careers y coach de salud, y dirigió una parafarmacia. Es licenciada en Farmacia por la Universitat de València, con posgrado en Coaching, PNL y Liderazgo (ENEB). En ISEIE dirige y tutoriza el Curso de Coaching y el Curso Coach Ontológico.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Valencia, Comunidad Valenciana, España', country_code = 'ES',
  slug = 'brigitte-blandin', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Brigitte Blandin · Coach ejecutiva y neurociencia · ISEIE',
  meta_description = 'Farmacéutica y coach ejecutiva especializada en neurociencia aplicada al coaching y al liderazgo. Directora de los cursos de Coaching de ISEIE.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/f87bf920-d510-4e2f-bda5-1832e7205130-1793719265505.jpg',
  linkedin_url = 'https://www.linkedin.com/in/brigitteblandin'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Directora y tutora · Curso de Coaching y Curso Coach Ontológico', '2026-07-01', NULL, true, 'Dirige y tutoriza dos cursos (en remoto). Conecta la neurociencia con la práctica del coaching y con los principios del coaching ontológico, con herramientas prácticas para la transformación personal y profesional del alumnado.', 1),
  (p, 'Brigitte Blandin · Formación en Coaching y Neurociencia', 'Directora', '2025-08-01', NULL, true, 'Dirige su propia formación en coaching y neurociencia aplicada para profesionales del desarrollo personal, desde Valencia: el Máster en Coaching y Neurociencia para el Desarrollo Humano, reconocido por la Universidad de Vitoria-Gasteiz EUNEIZ, sesiones individuales y su método RESPIRA.', 2),
  (p, 'Autónoma', 'Coach ejecutiva y formadora en liderazgo', '2020-01-01', NULL, true, 'Coaching ejecutivo y de equipos para directivos y mandos intermedios: liderazgo, comunicación efectiva y gestión del estrés, con un enfoque basado en neurociencia aplicada.', 3),
  (p, 'Life in Balance Careers', 'Formadora en neurociencia · NeuroChange Method', '2021-06-01', '2025-12-31', false, 'Formación y certificación de coaches en el NeuroChange Method, metodología de neurociencia aplicada al coaching.', 4),
  (p, 'Life in Balance Careers', 'Gerente nacional en España', '2020-10-01', '2025-12-31', false, 'Responsable en España de los programas de formación profesional de la organización.', 5),
  (p, 'Zeesne', 'Mentora de coaches', '2024-06-01', '2025-12-31', false, 'Mentoría de coaches en remoto: formación y liderazgo.', 6),
  (p, 'BB Nature Salud', 'Coach de salud', '2015-01-01', '2025-12-31', false, 'Más de 250 horas de sesiones individuales y grupales de coaching de salud y bienestar en la Comunidad Valenciana.', 7),
  (p, 'Parafarmacia Pharmaservice', 'Gerente', '2009-09-01', '2015-02-28', false, 'Gestión de la parafarmacia y consejo a los clientes.', 8);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'Coaching Fusión', 'Programa de coaching acreditado por ICF', 'Coaching individual y grupal', '2019-01-01', '2020-12-31', 1),
  (p, 'Salutis', 'Formación', 'Coaching de salud', '2019-01-01', '2019-12-31', 2),
  (p, 'ENEB · Escuela de Negocios Europea de Barcelona', 'Posgrado', 'Coaching, PNL y Liderazgo de Equipos', '2018-01-01', '2019-12-31', 3),
  (p, 'Universitat de València', 'Licenciatura', 'Farmacia', '1997-09-01', '2002-06-30', 4);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Español', 'Native', true, 1),
  (p, 'Inglés', 'C1', false, 2),
  (p, 'Valenciano', 'B1', false, 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Coaching ejecutivo', 'EXPERT', 1),
  (p, 'Neurociencia aplicada al coaching', 'EXPERT', 2),
  (p, 'Formación de coaches', 'EXPERT', 3),
  (p, 'Liderazgo', 'ADVANCED', 4),
  (p, 'Inteligencia emocional', 'ADVANCED', 5),
  (p, 'Gestión del estrés', 'ADVANCED', 6),
  (p, 'Coaching de equipos', 'ADVANCED', 7),
  (p, 'Coaching de salud', 'ADVANCED', 8),
  (p, 'Acompañamiento al cambio', 'ADVANCED', 9),
  (p, 'PNL', 'ADVANCED', 10),
  (p, 'Comunicación efectiva', 'ADVANCED', 11),
  (p, 'Hablar en público', 'ADVANCED', 12);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Curso de Coaching', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/coaching/', 1),
  (p, 'Curso Coach Ontológico', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/coach-ontologico/', 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6b: PORTFOLIO · vídeos
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Presentación del Curso de Coaching', 'Vídeo de presentación en el canal de ISEIE Innovation School.', 'VIDEO', 'https://youtu.be/n0vaSLj1NPQ', 6),
  (p, 'Presentación del Curso Coach Ontológico', 'Vídeo de presentación en el canal de ISEIE Innovation School.', 'VIDEO', 'https://youtu.be/ACpYuFP5cIU', 7);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6c: PORTFOLIO · publicaciones
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p, 'Cree en ti, ¡porque tú lo vales!', 'Libro.', 'WRITING', 21),
  (p, 'ClaraMENTE', 'Libro.', 'WRITING', 22);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO · certificados y formación complementaria
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, issue_date, expiry_date, type, sort_order) VALUES
  (p, 'Associate Certified Coach (ACC)', 'International Coaching Federation (ICF)', '2020-07', '2023-07', 'CERTIFICATION', 11);

END $$;
