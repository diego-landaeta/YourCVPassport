-- ============================================================================
-- SEED: Directora ISEIE · Cristina García Torres (Medicina · Máster en Medicina Nuclear)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS»)
--   · https://iseie.com/director/cristina-garcia-torres/ (misma bio que el CV)
--   · LinkedIn https://www.linkedin.com/in/cristina-garcia-torres-30a190290 (03/11/2026: fechas de UNIR y XTART FP, ubicación)
--   · Vídeo de presentación del máster (canal oficial de ISEIE): https://youtu.be/I50_XR0MkhY
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: directora y tutora de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/09/4ffdba2f-e67a-46da-b296-818361baeb51-1.png, subido a profile-assets/avatars/ el 03/11/2026.
-- Titulaciones y cursos sin fecha en las fuentes: van como certificaciones sin fecha (la plantilla passport las pinta limpias; en Experiencia/Formación saldrían como « - Actualidad»).
-- Datos personales: el CV trae DNI y correo personal. NO se publican.
-- Slug cristina-garcia-torres: «cristina-garcia» es demasiado genérico.
-- Fecha de ISEIE: aproximada (septiembre de 2026, cuando se publicó su ficha en iseie.com).
-- PENDIENTE pedirle: universidades y años de la Licenciatura en Psicología, Magisterio y las
-- titulaciones de Mediación Comunicativa y Lengua de Signos; dónde cursa Imagen para el Diagnóstico;
-- y las universidades donde fue tutora e-learning. Con eso se completan formación y experiencia.
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       cristina.garcia.torres@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'cristina-garcia-torres';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Cristina García Torres
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'cristina.garcia.torres@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario cristina.garcia.torres@iseie.com en auth.users. Crearlo antes de ejecutar.';
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
  full_name = 'Cristina García Torres',
  headline = 'Psicóloga y educadora · Asistente pedagógica en XTART FP (Grupo UAX) · Mediación comunicativa · Directora del Máster en Medicina Nuclear de ISEIE',
  summary = 'Psicóloga, educadora y especialista en mediación comunicativa, con una trayectoria centrada en la orientación académica, la formación online y la creación de materiales didácticos accesibles. Desde 2024 es asistente pedagógica en XTART FP (Grupo UAX). Antes fue asesora académica en UNIR (2020-2024), donde orientaba y tutorizaba al alumnado. También ha sido tutora e-learning y autora de materiales universitarios, ha coordinado acciones formativas y ha trabajado con personas con diversidad funcional. Es licenciada en Psicología, ha estudiado Magisterio de Educación Infantil y tiene titulaciones superiores en Mediación Comunicativa e Interpretación de Lengua de Signos. Hoy cursa el Ciclo Superior de Imagen para el Diagnóstico. En ISEIE dirige y tutoriza el Máster en Medicina Nuclear.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Torrejón de Ardoz, Comunidad de Madrid, España', country_code = 'ES',
  slug = 'cristina-garcia-torres', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Cristina García Torres · Psicóloga y educadora · ISEIE',
  meta_description = 'Psicóloga y educadora experta en orientación académica y formación online (UNIR, XTART FP). Directora del Máster en Medicina Nuclear de ISEIE.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/247255c8-fb12-4cb7-adad-e311c7b7d8a5-1793719268532.jpg',
  linkedin_url = 'https://www.linkedin.com/in/cristina-garcia-torres-30a190290'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Directora y tutora · Máster en Medicina Nuclear', '2026-09-01', NULL, true, 'Dirige y tutoriza el Máster en Medicina Nuclear (en remoto). Aporta su experiencia en docencia virtual y en la elaboración de materiales para presentar contenidos especializados de forma clara y accesible.', 1),
  (p, 'XTART FP (Grupo UAX)', 'Asistente pedagógica', '2024-01-01', NULL, true, 'Apoyo pedagógico en el centro de Formación Profesional del Grupo Universidad Alfonso X el Sabio.', 2),
  (p, 'UNIR · Universidad Internacional de La Rioja', 'Asesora académica', '2020-09-01', '2024-01-31', false, 'Orientación académica y tutoría del alumnado a jornada completa: seguimiento de estudiantes y profesorado y soporte en la plataforma virtual.', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Español', 'Native', true, 1),
  (p, 'Lengua de signos española', 'C1', false, 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Orientación académica', 'EXPERT', 1),
  (p, 'Tutoría e-learning', 'EXPERT', 2),
  (p, 'Diseño de materiales didácticos', 'ADVANCED', 3),
  (p, 'Coordinación de acciones formativas', 'ADVANCED', 4),
  (p, 'Plataformas de formación virtual', 'ADVANCED', 5),
  (p, 'Educación inclusiva', 'ADVANCED', 6),
  (p, 'Mediación comunicativa', 'ADVANCED', 7),
  (p, 'Interpretación de lengua de signos', 'ADVANCED', 8),
  (p, 'Psicología educativa', 'ADVANCED', 9),
  (p, 'Intervención con personas con diversidad funcional', 'ADVANCED', 10),
  (p, 'Imagen para el diagnóstico', 'INTERMEDIATE', 11);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Máster en Medicina Nuclear', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/medicina-nuclear/', 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6b: PORTFOLIO · vídeos
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Presentación del Máster en Medicina Nuclear', 'Vídeo de presentación en el canal de ISEIE Innovation School.', 'VIDEO', 'https://youtu.be/I50_XR0MkhY', 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO · certificados y formación complementaria
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, issue_date, expiry_date, type, sort_order) VALUES
  (p, 'Licenciatura en Psicología', 'Titulación universitaria', NULL, NULL, 'CERTIFICATION', 11),
  (p, 'Técnico Superior en Mediación Comunicativa', 'Formación Profesional de Grado Superior', NULL, NULL, 'CERTIFICATION', 12),
  (p, 'Técnico Superior en Interpretación de Lengua de Signos', 'Formación Profesional de Grado Superior', NULL, NULL, 'CERTIFICATION', 13),
  (p, 'Magisterio de Educación Infantil (estudios)', 'Formación universitaria', NULL, NULL, 'CERTIFICATION', 14),
  (p, 'Técnico Superior en Imagen para el Diagnóstico (en curso)', 'Formación Profesional de Grado Superior', NULL, NULL, 'CERTIFICATION', 15);

END $$;
