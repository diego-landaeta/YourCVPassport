-- ============================================================================
-- SEED: Directora ISEIE · Clàudia Millán Cruella (Podología · Podología Infantil)
-- Date: 2026-11-03
-- Sources:
--   · CV entregado a ISEIE (Drive «DIRECTORES CURSOS»)
--   · https://iseie.com/director/claudia-millan-cruella/ (misma bio que el CV)
--   · LinkedIn https://www.linkedin.com/in/claudia-millan-cruella-2b72a91b6 (03/11/2026: casi vacío;
--   ·   solo confirma «Podóloga en Illa de Salut de Sils SL» y Taradell, Cataluña)
--   · Vídeo de presentación del diplomado (canal oficial de ISEIE): https://youtu.be/f6IolMzo8pM
--   · Doctoralia: podóloga en Polimèdic Blanes (Grup Creu Groga), especialidad podología dermatológica
-- Template: passport · Brand color: #1E40AF (el del resto de directores ISEIE)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Límites del editor (schemas/profileSchemas.ts): headline ≤150, summary ≤800,
-- descripciones ≤800. Se respetan para que el perfil se pueda editar después.
-- Solo entran en experiencia/formación/certificados los datos con fecha real
-- (el editor exige fecha de inicio). Lo que no tiene fecha va en el resumen.
--
-- Cargo confirmado el 03/11/2026: directora y tutora de su programa en ISEIE (como todos los directores ISEIE).
-- Foto: recorte cuadrado 600x600 (centrado en la cara) de https://iseie.com/wp-content/uploads/2026/09/IMG_3138-scaled.jpg, subido a profile-assets/avatars/ el 03/11/2026.
-- Titulaciones y cursos sin fecha en las fuentes: van como certificaciones sin fecha (la plantilla passport las pinta limpias; en Experiencia/Formación saldrían como « - Actualidad»).
-- Datos personales: el CV trae DNI y correo personal. NO se publican.
-- El Instagram del CV (@clinicabadapeus) es de una clínica, con 38 seguidores y 2 publicaciones: no se enlaza.
-- Fecha de ISEIE: aproximada (septiembre de 2026, cuando se publicó su ficha en iseie.com).
-- PENDIENTE pedirle: desde cuándo está en Illa de Salut de Sils y en qué otros centros ha
-- trabajado (con fechas), años del Grado y del Máster en la UB, fechas de los cursos e idiomas
-- (¿catalán?). Con eso se completan experiencia, formación y certificados.
-- No se publica el centro de Banyoles que sale en buscadores: la ficha de FIATC da 404 y no se puede confirmar.
--
-- ⚠️  PREREQUISITO: crear antes el usuario en Auth (el trigger genera la fila
--     de profiles). Se localiza por email y aborta si no existe:
--       claudia.millan@iseie.com
--
-- Vuelta atrás: UPDATE profiles SET is_active = false WHERE slug = 'claudia-millan';
-- (ocultar, no borrar, como en 20261007_ocultar_antonio_ucles)
-- ============================================================================

DO $$
DECLARE
  p UUID;  -- Clàudia Millán Cruella
BEGIN

SELECT id INTO p FROM auth.users WHERE email = 'claudia.millan@iseie.com';
IF p IS NULL THEN
  RAISE EXCEPTION 'Falta el usuario claudia.millan@iseie.com en auth.users. Crearlo antes de ejecutar.';
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
  full_name = 'Clàudia Millán Cruella',
  headline = 'Podóloga pediátrica · Grado y Máster en Podología Pediátrica por la Universitat de Barcelona · Directora del Diplomado en Podología Infantil de ISEIE',
  summary = 'Podóloga especializada en podología pediátrica: evalúa, previene y trata las alteraciones del pie durante el crecimiento, con una mirada global a su desarrollo motor. Es graduada en Podología y tiene un Máster en Podología Pediátrica, ambos por la Universitat de Barcelona. Trabaja en clínicas de Girona como Illa de Salut de Sils y Polimèdic Blanes (Grup Creu Groga), donde hace estudios biomecánicos, soportes plantares y tratamientos podológicos a niños y adultos. Su práctica incluye quiropodias, ortesis de silicona, curas postquirúrgicas y atención al pie diabético. Se ha formado en pie plano y pie cavo infantil, dermatología pediátrica y farmacología clínica aplicada a la podología (Consejo General de Podología). En ISEIE dirige y tutoriza el Diplomado en Podología Infantil.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Taradell, Barcelona, Cataluña, España', country_code = 'ES',
  slug = 'claudia-millan', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Clàudia Millán Cruella · Podóloga pediátrica · ISEIE',
  meta_description = 'Podóloga especializada en podología pediátrica, con Grado y Máster por la Universitat de Barcelona. Directora del Diplomado en Podología Infantil de ISEIE.',
  avatar_url = 'https://djehzlzombqrzzuchcef.supabase.co/storage/v1/object/public/profile-assets/avatars/2b7a1612-df4f-48eb-931b-82ddfc2e8048-1793719267584.jpg',
  linkedin_url = 'https://www.linkedin.com/in/claudia-millan-cruella-2b72a91b6'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIE Innovation School', 'Directora y tutora · Diplomado en Podología Infantil', '2026-09-01', NULL, true, 'Dirige y tutoriza el Diplomado en Podología Infantil (en remoto). Orienta al alumnado en la evaluación, la prevención y la intervención podológica en la población pediátrica, desde la experiencia clínica y el conocimiento biomecánico del desarrollo infantil.', 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Español', 'Native', true, 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Podología pediátrica', 'EXPERT', 1),
  (p, 'Valoración biomecánica', 'EXPERT', 2),
  (p, 'Soportes plantares', 'EXPERT', 3),
  (p, 'Pie plano y pie cavo infantil', 'ADVANCED', 4),
  (p, 'Desarrollo motor infantil', 'ADVANCED', 5),
  (p, 'Quiropodología', 'ADVANCED', 6),
  (p, 'Ortesis de silicona', 'ADVANCED', 7),
  (p, 'Curas postquirúrgicas', 'ADVANCED', 8),
  (p, 'Pie diabético', 'ADVANCED', 9),
  (p, 'Dermatología pediátrica', 'INTERMEDIATE', 10),
  (p, 'Farmacología aplicada a la podología', 'INTERMEDIATE', 11),
  (p, 'Podología dermatológica', 'ADVANCED', 12);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: PORTFOLIO · programas que dirige en ISEIE
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Diplomado en Podología Infantil', 'Programa que dirige en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/diplomados/diplomado-en-podologia-infantil/', 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6b: PORTFOLIO · vídeos
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Presentación del Diplomado en Podología Infantil', 'Vídeo de presentación en el canal de ISEIE Innovation School.', 'VIDEO', 'https://youtu.be/f6IolMzo8pM', 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO · certificados y formación complementaria
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, issue_date, expiry_date, type, sort_order) VALUES
  (p, 'Máster en Podología Pediátrica', 'Universitat de Barcelona', NULL, NULL, 'CERTIFICATION', 11),
  (p, 'Grado en Podología', 'Universitat de Barcelona', NULL, NULL, 'CERTIFICATION', 12),
  (p, 'Farmacología clínica aplicada a la podología', 'Consejo General de Colegios Oficiales de Podólogos', NULL, NULL, 'CERTIFICATION', 13),
  (p, 'Pie plano infantil, pie cavo infantil y dermatología pediátrica', 'Cursos de especialización', NULL, NULL, 'CERTIFICATION', 14);

END $$;
