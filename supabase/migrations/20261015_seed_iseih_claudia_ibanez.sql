-- ============================================================================
-- SEED: Claudia Ibáñez Jiménez · Psicóloga · Psicoterapeuta integrativa · ISEIH
-- Date: 2026-10-15
-- Source: CV aportado por ISEIH (PDF, una página). Es la única fuente del
--         contenido. La colaboración docente con ISEIH desde octubre de 2026
--         consta en la documentación interna de ISEIH; de ella NO se publica
--         ningún dato (ni identificación, ni contacto, ni condiciones).
-- Template: passport · Brand color: #6B46C1 (ISEIH, mismo criterio que
--           20260917_seed_iseih_instructores.sql)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
-- auth.user: se crea ANTES de esta migración con el UUID indicado abajo
--            (claudia.ibanez@iseih.com, mismo patrón nombre.apellido@iseih.com).
--            Si el auth.user no existe, el UPDATE no hace nada y los INSERT
--            fallan por la FK de profile_id: no hay escritura a medias.
--
-- ⚠️  ÁMBITO REGULADO. Es psicóloga (Grado en Psicología, UCM), pero el Máster
--     en Psicología General Sanitaria está EN CURSO: todavía no tiene la
--     habilitación para la actividad sanitaria. El perfil NO la presenta como
--     psicóloga sanitaria ni como habilitada para la práctica clínica. Ver
--     notas al final.
-- ============================================================================

DO $$
DECLARE
  p CONSTANT UUID := 'e203428a-2dcd-4289-8926-74657ff84ab3';  -- Claudia Ibáñez Jiménez
BEGIN

DELETE FROM portfolio_items WHERE profile_id = p;
DELETE FROM skills          WHERE profile_id = p;
DELETE FROM languages       WHERE profile_id = p;
DELETE FROM education       WHERE profile_id = p;
DELETE FROM experiences     WHERE profile_id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- PROFILE
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Claudia Ibáñez Jiménez',
  headline = 'Psicóloga · Psicoterapeuta integrativa con enfoque transpersonal · Neurodivergencia, trauma e identidad · Docente en ISEIH',
  summary = 'Psicóloga graduada por la Universidad Complutense de Madrid que trabaja desde un enfoque integrativo y transpersonal, centrado en el propósito, el liderazgo consciente y la transformación identitaria. Acompaña a personas neurodivergentes, sensibles y creativas a salir de la sobreadaptación y de las dinámicas autodestructivas para reconectar con sus dones, habitar vínculos más auténticos y ocupar su lugar. Desde 2019 desarrolla un proyecto propio de acompañamiento terapéutico individual y grupal, en el que también diseña y conduce dinámicas formativas. Sus áreas de especialización son la neurodivergencia en adolescentes y adultos, los trastornos de la conducta alimentaria, los trastornos de ansiedad, el trauma complejo y el trauma del desarrollo, y la integración identitaria y el desarrollo del self. Además del Grado en Psicología, cursó en la misma universidad el Máster en Inteligencia Emocional e Intervención en Emociones y Salud, y ha completado su formación con tres programas de experto: en psicoterapia integradora, trauma y apego con EMDR (Grupo NB Psicología), en mindfulness y gestión emocional según el programa de reducción de estrés basado en mindfulness, MBSR (Nirakara - Instituto Europeo de Psicología Positiva), y en life coaching (Crearte Coaching). Actualmente cursa el Máster en Psicología General Sanitaria en UNIE Universidad. Su recorrido incluye experiencia en la Unidad del Dolor del Hospital 12 de Octubre (2019), en la Fundación Adictos en Recuperación (2019-2021) y en el Centro de Atención, Rehabilitación y Reinserción para Mujeres Maltratadas (2020). Entre sus fortalezas destacan la escucha profunda, la sensibilidad, el liderazgo y la comunicación oral. Desde octubre de 2026 colabora como docente con ISEIH.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#6B46C1',
  location = 'España', country_code = 'ES',
  slug = 'claudia-ibanez', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Claudia Ibáñez Jiménez · Psicóloga · Psicoterapeuta integrativa · ISEIH',
  meta_description = 'Psicóloga por la Universidad Complutense de Madrid con enfoque integrativo y transpersonal. Acompaña a personas neurodivergentes, sensibles y creativas. Formación en trauma y apego con EMDR, mindfulness (MBSR) y life coaching. Docente en ISEIH.',
  instagram_url = 'https://www.instagram.com/claudiaibanez.psic/'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- EXPERIENCES · el CV sólo da años: meses estimados (ver nota 4)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Docente colaboradora', '2026-10-15', NULL, true, 'Colaboración docente con ISEIH desde octubre de 2026 dentro de su oferta formativa. Aporta su experiencia en acompañamiento terapéutico individual y grupal, su trabajo con personas neurodivergentes, sensibles y creativas, y su práctica en el diseño y la conducción de dinámicas formativas.', 1),
  (p, 'Proyecto propio de acompañamiento terapéutico', 'Psicoterapeuta integrativa - Acompañamiento individual y grupal', '2019-01-15', NULL, true, 'Proyecto propio, activo desde 2019, de acompañamiento terapéutico individual y grupal y de dinámicas formativas. Trabaja desde un enfoque integrativo y transpersonal, centrado en el propósito, el liderazgo consciente y la transformación identitaria, con personas neurodivergentes, sensibles y creativas: salir de la sobreadaptación y de las dinámicas autodestructivas, reconectar con los propios dones y construir vínculos más auténticos.', 2),
  (p, 'Fundación Adictos en Recuperación (FAER)', 'Psicología - Ámbito de las adicciones', '2019-01-15', '2021-12-15', false, 'Experiencia entre 2019 y 2021 en la Fundación Adictos en Recuperación, entidad dedicada a la recuperación de personas con adicciones.', 3),
  (p, 'Centro de Atención, Rehabilitación y Reinserción para Mujeres Maltratadas (CARRMM)', 'Psicología - Atención a mujeres que han sufrido maltrato', '2020-01-15', '2020-12-15', false, 'Experiencia en 2020 en un centro dedicado a la atención, la rehabilitación y la reinserción de mujeres que han sufrido maltrato.', 4),
  (p, 'Hospital 12 de Octubre (Madrid) - Unidad del Dolor', 'Psicología - Unidad del Dolor', '2019-01-15', '2019-12-15', false, 'Experiencia en 2019 en la Unidad del Dolor del Hospital 12 de Octubre, servicio hospitalario especializado en el tratamiento del dolor.', 5);

-- ═══════════════════════════════════════════════════════════════════════
-- EDUCATION · ⚠️ fechas estimadas: el CV no fecha ningún estudio (nota 4)
-- Sólo titulaciones universitarias. Los tres programas de experto van como
-- CERTIFICATION, identificados como formación no reglada (nota 3).
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, sort_order) VALUES
  (p, 'UNIE Universidad', 'Máster en Psicología General Sanitaria (cursando)', 'Psicología General Sanitaria', '2025-09-15', NULL, true, 1),
  (p, 'Universidad Complutense de Madrid', 'Máster en Inteligencia Emocional e Intervención en Emociones y Salud', 'Inteligencia Emocional', '2019-09-15', '2020-06-15', false, 2),
  (p, 'Universidad Complutense de Madrid', 'Grado en Psicología', 'Psicología', '2015-09-15', '2019-06-15', false, 3);

-- ═══════════════════════════════════════════════════════════════════════
-- SKILLS · especialidades y fortalezas del CV + formación complementaria
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Acompañamiento terapéutico individual y grupal', 'EXPERT', 1),
  (p, 'Psicoterapia integrativa y transpersonal', 'ADVANCED', 2),
  (p, 'Neurodivergencia en adolescentes y adultos', 'ADVANCED', 3),
  (p, 'Trastornos de la conducta alimentaria', 'ADVANCED', 4),
  (p, 'Trastornos de ansiedad', 'ADVANCED', 5),
  (p, 'Trauma complejo y trauma del desarrollo', 'ADVANCED', 6),
  (p, 'Integración identitaria y desarrollo del self', 'ADVANCED', 7),
  (p, 'Trauma y apego (formación en EMDR)', 'ADVANCED', 8),
  (p, 'Mindfulness y gestión emocional (MBSR)', 'ADVANCED', 9),
  (p, 'Inteligencia emocional', 'ADVANCED', 10),
  (p, 'Life coaching', 'ADVANCED', 11),
  (p, 'Propósito y liderazgo consciente', 'ADVANCED', 12),
  (p, 'Diseño y conducción de dinámicas formativas y grupales', 'ADVANCED', 13),
  (p, 'Escucha profunda', 'EXPERT', 14),
  (p, 'Comunicación y oratoria', 'ADVANCED', 15);

-- ═══════════════════════════════════════════════════════════════════════
-- LANGUAGES · ⚠️ el CV no declara idiomas. Sólo castellano (nota 5)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Castellano', 'Native', true, 1);

-- ═══════════════════════════════════════════════════════════════════════
-- PORTFOLIO (PROJECT)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, sort_order) VALUES
  (p, 'Proyecto propio de acompañamiento terapéutico', 'Proyecto propio, activo desde 2019, de acompañamiento individual y grupal y de dinámicas formativas, con enfoque integrativo y transpersonal y dirigido a personas neurodivergentes, sensibles y creativas.', 'PROJECT', 'https://www.instagram.com/claudiaibanez.psic/', ARRAY['Proyecto Propio','Acompañamiento','Dinámicas Formativas'], 1),
  (p, 'Docencia en ISEIH', 'Colaboración docente con ISEIH desde octubre de 2026, centrada en el acompañamiento terapéutico, el trabajo con personas neurodivergentes y la facilitación de grupos.', 'PROJECT', NULL, ARRAY['Docencia','ISEIH','Formación'], 2);

-- ═══════════════════════════════════════════════════════════════════════
-- CERTIFICATIONS · formación de experto NO reglada (nota 3)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p, 'Experto en Psicoterapia Integradora, Trauma y Apego con EMDR', 'Grupo NB Psicología · formación especializada no reglada', 'CERTIFICATION', 100),
  (p, 'Experto en Mindfulness y Gestión Emocional - Programa de Reducción de Estrés Basado en Mindfulness (MBSR)', 'Nirakara - Instituto Europeo de Psicología Positiva · formación especializada no reglada', 'CERTIFICATION', 101),
  (p, 'Experto en Life Coaching', 'Crearte Coaching · formación especializada no reglada', 'CERTIFICATION', 102);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. URL pública: https://yourcvpassport.com/cv/claudia-ibanez
--    avatar_url NO se toca aquí: la foto (aportada por ella, distinta de la
--    del CV) se sube con scripts/upload-claudia-avatar.sh, que hace el UPDATE.
--
-- 2. ⚠️  PSICOLOGÍA SANITARIA. Tiene el Grado en Psicología, de modo que
--    "psicóloga" es correcto, pero el Máster en Psicología General Sanitaria
--    figura como "cursando". En España la actividad sanitaria de la psicología
--    (evaluación e intervención sobre problemas de salud) exige ese máster o
--    el título de especialista en Psicología Clínica (Ley 33/2011, disp. adic.
--    séptima). Por eso:
--      · NO se usa "psicóloga sanitaria", "psicóloga clínica" ni "consulta
--        sanitaria", y el máster lleva "(cursando)" en el propio degree.
--      · Su actividad se describe como ACOMPAÑAMIENTO TERAPÉUTICO, que es como
--        la define el CV, no como tratamiento ni diagnóstico.
--      · "Psicoterapeuta integrativa" es el titular de su CV. La psicoterapia
--        no es una profesión regulada en España, pero junto a TCA y trastornos
--        de ansiedad se puede leer como práctica clínica. Las especialidades se
--        recogen tal cual las nombra el CV.
--    Cuando termine el máster y obtenga la habilitación, se puede actualizar
--    el perfil (quitar "(cursando)", fecha de fin, y revisar el titular).
--    Si ISEIH pide presentarla como sanitaria antes, hay que hablarlo: el
--    riesgo recae sobre ella.
--
-- 3. FORMACIÓN NO REGLADA. Los tres programas de experto (Grupo NB Psicología,
--    Nirakara, Crearte Coaching) son formación de centros privados, no títulos
--    oficiales: van como CERTIFICATION y el issuer lo dice expresamente. NO
--    retirar esa aclaración. En particular, la formación "con EMDR" no implica
--    acreditación como terapeuta EMDR por EMDR Europe/EMDR España: no se
--    presenta así. El Máster en Inteligencia Emocional de la UCM se publica con
--    el nombre del CV; es muy probablemente un título propio de la UCM, no un
--    máster oficial: confirmarlo antes de describirlo de otra forma.
--
-- 4. FECHAS ESTIMADAS (día 15 por el bug de formatDate(), ver migración de
--    Aleix). El CV sólo da años en la experiencia y ninguna fecha en la
--    formación:
--      · Experiencia: años del CV (CONFIRMADOS); meses estimados (enero a
--        diciembre). Proyecto propio desde 2019, FAER 2019-2021, CARRMM 2020,
--        Unidad del Dolor 2019.
--      · ISEIH: desde 10/2026 (inicio de la colaboración; mes confirmado, día
--        por criterio).
--      · Grado UCM 2015-2019, Máster UCM 2019-2020 y Máster UNIE desde 09/2025:
--        ESTIMADOS (start_date es obligatorio en education). Confirmar con ella.
--
-- 5. Sin idiomas en el CV: sólo se carga castellano. Sin ciudad en el CV:
--    location queda como 'España' hasta saberla.
--
-- 6. CONTACTO. El teléfono y el correo personal del CV NO se publican.
--    is_open_to_messages = false, como el resto de instructores ISEIH.
--    Instagram profesional (@claudiaibanez.psic, publicado en su CV) se guarda
--    en instagram_url y como enlace del proyecto propio. Ojo: hoy ninguna
--    plantilla ni la ficha pública renderizan instagram_url (sólo LinkedIn,
--    GitHub y portfolio_url); no se usa portfolio_url para no rotularlo como
--    web/portfolio.
--
-- 7. Puestos en FAER, CARRMM y Unidad del Dolor: el CV sólo nombra la entidad
--    y el año, sin cargo ni funciones (por las fechas, pudieron ser prácticas
--    del grado o voluntariado). Se rotulan de forma genérica ("Psicología -
--    ...") y la descripción se limita a lo que es la entidad. Confirmar con
--    ella el tipo de vinculación; si fueron prácticas, añadirlo al position.
--
-- 8. El programa concreto que imparte en ISEIH no consta: la experiencia y el
--    proyecto de docencia se describen de forma genérica. Completar cuando se
--    sepa (patrón: 'Docente - <nombre del programa>').
--
-- 9. degree y position con texto descriptivo largo a propósito: la plantilla no
--    renderiza field_of_study y la caché de traducción degrada los términos de
--    una sola palabra (ver notas de la migración de Arantxa Saiz).
-- ============================================================================
