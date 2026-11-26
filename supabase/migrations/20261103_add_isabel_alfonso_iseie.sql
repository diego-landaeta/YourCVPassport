-- ============================================================================
-- SEED: Directora ISEIE · Isabel Alfonso Pérez (Negocios · Estilo Personal y Asesoría de Imagen)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS»)
--   · https://iseie.com/director/isabel-alfonso-perez/
--   · LinkedIn https://www.linkedin.com/in/isabelalfonsoperez (03/11/2026: puestos, fechas, formación,
--   ·   premio y web de su consultora)
--   · Vídeo de presentación del diplomado (canal oficial de ISEIE): https://youtu.be/m9YOiKc3ZCI
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: directora y tutora de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/09/DSC04988_1.jpg-scaled.jpeg, subido a profile-assets/avatars/ el 03/11/2026.
-- Datos personales: el CV trae DNI y correo personal. NO se publican (tampoco el correo de su empresa).
-- La Licenciatura en Derecho (Universidad de Sevilla, 1991-1996) sale de LinkedIn; el CV no la menciona.
-- Premio: I Premios al Emprendimiento y Liderazgo Femenino de Huelva, 12/12/2024 (jueves, como dice su
-- publicación), compartido con su socia en Imagen Personal Asesores.
-- Fecha de ISEIE: aproximada (septiembre de 2026, cuando se publicó su ficha en iseie.com).
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       isabel.alfonso@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'isabel-alfonso';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Isabel Alfonso Pérez
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'isabel.alfonso@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario isabel.alfonso@iseie.com en auth.users. Crearlo antes de ejecutar.';
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
  full_name = 'Isabel Alfonso Pérez',
  headline = 'Asesora de imagen profesional y presencia ejecutiva · Socia fundadora de Imagen Personal Asesores · Directora del Diplomado de Imagen de ISEIE',
  summary = 'Asesora de imagen profesional especializada en presencia ejecutiva, marca personal, comunicación no verbal y protocolo de empresa. En 2020 fundó Imagen Personal Asesores (Huelva), donde trabaja con directivos, emprendedores y portavoces desde la percepción y los códigos profesionales. Diseña y dirige programas formativos de imagen, comunicación y liderazgo con la Universidad de Huelva, la Diputación de Huelva, la Fundación Tres Culturas del Mediterráneo y Cruz Roja. Es vicepresidenta del Club de Marketing Social de Huelva y columnista de Huelva Información. Licenciada en Derecho por la Universidad de Sevilla, se formó como asesora de imagen (EDM), en comunicación no verbal (UNED) y en protocolo de empresa. En ISEIE dirige y tutoriza el Diplomado en Estilo Personal y Asesoría de Imagen.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Huelva, Andalucía, España', country_code = 'ES',
  slug = 'isabel-alfonso', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Isabel Alfonso · Asesora de imagen profesional · ISEIE',
  meta_description = 'Asesora de imagen profesional, comunicación no verbal y protocolo. Socia fundadora de Imagen Personal Asesores (Huelva). Directora en ISEIE.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/ac9b8f98-f271-4bea-8770-2705def5eb38-1793719270235.jpg',
  linkedin_url = 'https://www.linkedin.com/in/isabelalfonsoperez',
  portfolio_url = 'https://imagenpersonalasesores.com'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Directora y tutora · Diplomado en Estilo Personal y Asesoría de Imagen', '2026-09-01', NULL, true, 'Dirige y tutoriza el diplomado (en remoto) con una visión integral: identidad profesional coherente, comunicación efectiva e imagen estratégica adaptada a cada contexto, para que el alumnado aprenda a gestionar su presencia y su marca personal.', 1),
  (p, 'Imagen Personal Asesores', 'Socia fundadora y directora · Asesora de imagen profesional', '2020-01-01', NULL, true, 'Consultora de imagen profesional en Huelva. Asesoramiento integral en imagen, comunicación no verbal y protocolo para líderes, directivos, emprendedores y portavoces; consultorías personalizadas, formación para empresas y talleres presenciales y online. Diseño y dirección de programas formativos como «Estrategias de imagen y comunicación efectivas», el taller de marca personal y el proyecto Despega Jóvenes.', 2),
  (p, 'Club de Marketing Social de Huelva (MKS Huelva)', 'Vicepresidenta', '2024-06-01', NULL, true, 'Vicepresidenta del club de marketing social de Huelva.', 3),
  (p, 'Huelva Información', 'Colaboradora · Tribuna MKS', '2024-07-01', NULL, true, 'Artículos de opinión sobre imagen profesional, comunicación y hablar en público en la sección Tribuna MKS.', 4);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'Escuela Internacional de Protocolo y Eventos', 'Especialista', 'Protocolo de empresa', '2023-01-01', '2023-12-31', 1),
  (p, 'UNED · Universidad Nacional de Educación a Distancia', 'Formación universitaria', 'Gestión de la comunicación no verbal', '2022-01-01', '2023-12-31', 2),
  (p, 'EDM · Escuela de Diseño y Moda', 'Técnico', 'Asesoría de imagen personal y corporativa', '2018-01-01', '2019-12-31', 3),
  (p, 'Universidad de Sevilla', 'Licenciatura', 'Derecho', '1991-09-01', '1996-06-30', 4);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Español', 'Native', true, 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Asesoría de imagen profesional', 'EXPERT', 1),
  (p, 'Presencia ejecutiva', 'EXPERT', 2),
  (p, 'Comunicación no verbal', 'EXPERT', 3),
  (p, 'Marca personal', 'EXPERT', 4),
  (p, 'Protocolo de empresa', 'ADVANCED', 5),
  (p, 'Semiótica del vestuario', 'ADVANCED', 6),
  (p, 'Colorimetría aplicada', 'ADVANCED', 7),
  (p, 'Diseño de programas formativos', 'ADVANCED', 8),
  (p, 'Hablar en público', 'ADVANCED', 9),
  (p, 'Imagen corporativa y uniformidad', 'ADVANCED', 10),
  (p, 'Desarrollo de liderazgo', 'ADVANCED', 11),
  (p, 'Selección por competencias', 'INTERMEDIATE', 12);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Diplomado en Estilo Personal y Asesoría de Imagen', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/diplomados/diplomado-en-estilo-personal-y-asesoria-de-imagen/', 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6b: PORTFOLIO · vídeos
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Presentación del Diplomado en Estilo Personal y Asesoría de Imagen', 'Vídeo de presentación en el canal de ISEIE Innovation School.', 'VIDEO', 'https://youtu.be/m9YOiKc3ZCI', 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6d: PORTFOLIO · premios y reconocimientos
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p, 'Premio al Proyecto Innovador Femenino', 'I Premios al Emprendimiento y Liderazgo Femenino de Huelva (diciembre de 2024), compartido con su socia en Imagen Personal Asesores.', 'OTHER', 31);

END $$;
