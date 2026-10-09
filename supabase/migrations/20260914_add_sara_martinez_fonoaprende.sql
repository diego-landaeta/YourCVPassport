-- ============================================================================
-- SEED: Sara Martínez Ruiz · Logopeda pediátrica y neonatal · Fono Aprende
-- Date: 2026-09-14
-- Sources: https://fonoaprende.com/instructores/sara-martinez-ruiz/ (FUENTE
--            PRINCIPAL: bio literal de la ficha oficial)
--          + https://logopedia-martinez.webnode.es (su propia web: nº de
--            colegiada, especialidades ampliadas, servicios y Máster en
--            Lactancia Materna). Complementa, no contradice.
-- Template: passport
-- Brand color: #720EEC (morado corporativo de fonoaprende.com)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- ⚠️  auth.user creado el 14/09/2026 con el UUID real indicado abajo.
--     Email: sara.martinez@fonoaprende.com
-- ============================================================================

DO $$
DECLARE
  p CONSTANT UUID := 'c8aac72f-c315-405d-a95a-268c685399e8';  -- UUID real: Sara Martínez Ruiz
BEGIN

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 0: CLEANUP (idempotente)
-- ═══════════════════════════════════════════════════════════════════════
DELETE FROM portfolio_items WHERE profile_id = p;
DELETE FROM skills          WHERE profile_id = p;
DELETE FROM languages       WHERE profile_id = p;
DELETE FROM education       WHERE profile_id = p;
DELETE FROM experiences     WHERE profile_id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: PROFILE
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Sara Martínez Ruiz',
  headline = 'Logopeda pediátrica y neonatal · Colegiada 39/0285L · Lactancia materna y alimentación complementaria · Motricidad orofacial y terapia miofuncional',
  summary = 'Logopeda pediátrica y neonatal especializada en lactancia materna y alimentación complementaria, un nicho poco cubierto dentro de la profesión y que exige intervenir en la ventana más temprana del desarrollo. Su trabajo se centra en la evaluación, el diagnóstico y la intervención en las áreas del lenguaje, el habla, la comunicación y las funciones orales no verbales, con una atención especial a los primeros años de vida, aunque su práctica abarca también población adulta. Es Graduada en Logopedia por las Escuelas Universitarias Gimbernat-Cantabria y Máster en Orientación e Inserción Laboral de Personas con Discapacidad por Euroinnova Business School, formación que le aporta una mirada sobre la discapacidad que va más allá de la sesión clínica y alcanza la autonomía y la inclusión real de la persona. Su trabajo de fin de grado fue un estudio experimental longitudinal sobre el aprendizaje de la lectoescritura en niños sordos sin lenguaje, una línea de investigación exigente que anticipa el perfil técnico que desarrollaría después. Comenzó su trayectoria como responsable del área de logopedia en la Clínica MG María Gutiérrez y desde 2020 dirige el Centro Logopedia Martínez, donde compagina la práctica clínica con la elaboración de informes, los talleres grupales y el asesoramiento a familias, a otros profesionales y a centros educativos. Su centro trabaja con un protocolo definido —entrevista inicial, evaluación mediante test estandarizados y no estandarizados y observación directa, plan de intervención individualizado con objetivos y temporalización, y evaluación final con plan de mantenimiento— y ofrece atención a domicilio para favorecer la generalización de los resultados en el entorno natural del paciente. Ha completado una amplia formación especializada en motricidad orofacial, terapia miofuncional, logopedia neonatal, lactancia materna, alimentación complementaria y rehabilitación tras frenectomía en bebés, además de atención temprana, comunicación aumentativa y alternativa, tartamudez, respirador oral y electroestimulación aplicada a la logopedia. Su cartera clínica incluye alteraciones del habla y del lenguaje, trastorno del espectro autista, implante coclear, síndrome de Williams, disfagia, daño cerebral y afasia. Como docente del Instituto Fono Aprende imparte cuatro programas, dos de ellos másteres: Logopedia Forense y Pericial, y Disfagia y Trastornos de la Deglución, junto a los cursos de Intervención Centrada en la Familia en Atención Temprana y de Estimulación Temprana del Lenguaje.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#720EEC',
  location = 'Cantabria, España', country_code = 'ES',
  slug = 'sara-martinez', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Sara Martínez Ruiz · Logopeda pediátrica y neonatal · Lactancia materna',
  meta_description = 'Logopeda colegiada 39/0285L, pediátrica y neonatal, especializada en lactancia materna, alimentación complementaria, motricidad orofacial y terapia miofuncional. Directora del Centro Logopedia Martínez y docente en Instituto Fono Aprende.',
  portfolio_url = 'https://logopedia-martinez.webnode.es'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EXPERIENCES
-- Sólo "desde 2020" (Centro Logopedia Martínez) es fecha confirmada.
-- El resto es estimado: ver nota 3.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'Centro Logopedia Martínez', 'Directora - Logopeda pediátrica y neonatal', '2020-01-15', NULL, true, 'Dirección del Centro Logopedia Martínez desde 2020, compaginando la práctica clínica con la elaboración de informes, los talleres grupales y el asesoramiento a familias, a otros profesionales y a centros educativos. El centro trabaja con un protocolo definido: entrevista inicial, evaluación mediante test estandarizados y no estandarizados y observación directa, plan de intervención individualizado con objetivos y temporalización, y evaluación final con plan de mantenimiento y seguimiento. Ofrece además atención a domicilio para favorecer la generalización de los resultados en el entorno natural del paciente, y un servicio de técnicas de estudio y estrategias de aprendizaje. Atención a población infantil y adulta: alteraciones del habla y del lenguaje, trastorno del espectro autista, implante coclear, síndrome de Williams, disfagia, daño cerebral y afasia.', 1),
  (p, 'Instituto Fono Aprende', 'Docente - Atención temprana, lenguaje y disfagia', '2025-07-15', NULL, true, 'Docente del Instituto Fono Aprende, centro de formación online especializado en logopedia con campus en España, Perú, México, Colombia, Chile y Argentina. Imparte cuatro programas: el Máster en Logopedia Forense y Pericial, el Máster en Disfagia y Trastornos de la Deglución, el Curso de Intervención Centrada en la Familia en Atención Temprana y el Curso de Estimulación Temprana del Lenguaje.', 2),
  (p, 'Clínica MG María Gutiérrez', 'Responsable del área de logopedia', '2017-01-15', '2019-12-15', false, 'Primera etapa profesional como responsable del área de logopedia de la clínica. Evaluación, diagnóstico e intervención logopédica, organización del área y coordinación con el resto del equipo asistencial del centro.', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: EDUCATION
-- ⚠️ Fechas estimadas: ninguna fuente las aporta. Ver nota 3.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'Formación de posgrado especializada', 'Máster en Lactancia Materna', 'Lactancia Materna y Alimentación Infantil', '2019-09-15', '2020-07-15', 1),
  (p, 'Euroinnova Business School', 'Máster en Orientación e Inserción Laboral de Personas con Discapacidad', 'Orientación e Inserción Laboral · Discapacidad', '2017-09-15', '2018-07-15', 2),
  (p, 'Escuelas Universitarias Gimbernat-Cantabria', 'Graduada en Logopedia', 'Logopedia', '2012-09-15', '2016-06-15', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Logopedia neonatal', 'EXPERT', 1),
  (p, 'Lactancia materna y agarre', 'EXPERT', 2),
  (p, 'Alimentación complementaria', 'EXPERT', 3),
  (p, 'Rehabilitación tras frenectomía en bebés', 'EXPERT', 4),
  (p, 'Motricidad orofacial', 'EXPERT', 5),
  (p, 'Terapia miofuncional', 'EXPERT', 6),
  (p, 'Funciones orales no verbales', 'EXPERT', 7),
  (p, 'Evaluación y diagnóstico logopédico', 'EXPERT', 8),
  (p, 'Atención temprana', 'EXPERT', 9),
  (p, 'Alteraciones del habla y del lenguaje', 'EXPERT', 10),
  (p, 'Trastorno del Espectro Autista (TEA)', 'ADVANCED', 11),
  (p, 'Implante coclear', 'ADVANCED', 12),
  (p, 'Síndrome de Williams', 'ADVANCED', 13),
  (p, 'Disfagia y trastornos de la deglución', 'EXPERT', 14),
  (p, 'Daño cerebral y afasia', 'ADVANCED', 15),
  (p, 'Comunicación aumentativa y alternativa (CAA)', 'ADVANCED', 16),
  (p, 'Tartamudez', 'ADVANCED', 17),
  (p, 'Respirador oral', 'ADVANCED', 18),
  (p, 'Electroestimulación aplicada a la logopedia', 'ADVANCED', 19),
  (p, 'Lectoescritura en niños sordos', 'ADVANCED', 20),
  (p, 'Elaboración de informes logopédicos', 'EXPERT', 21),
  (p, 'Asesoramiento a familias y centros educativos', 'EXPERT', 22),
  (p, 'Talleres grupales y formación', 'ADVANCED', 23),
  (p, 'Dirección de centro de logopedia', 'ADVANCED', 24);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: LANGUAGES
-- ⚠️ Ninguna fuente declara idiomas. Sólo castellano. No se inventan otros.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Castellano', 'Native', true, 1);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 8: CERTIFICATIONS (formación especializada; las titulaciones ya
-- salen en la sección Educación y no se repiten aquí)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, sort_order) VALUES
  (p, 'Máster en Disfagia y Trastornos de la Deglución', 'Programa de máster del Instituto Fono Aprende del que es docente: evaluación e intervención en los trastornos de la deglución a lo largo de todo el ciclo vital.', 'PROJECT', 'https://fonoaprende.com/instructores/sara-martinez-ruiz/', ARRAY['Disfagia','Deglución','Máster'], 1),
  (p, 'Máster en Logopedia Forense y Pericial', 'Programa de máster del Instituto Fono Aprende del que es docente: peritaje logopédico, elaboración de informes periciales y actuación del logopeda en el ámbito judicial.', 'PROJECT', 'https://fonoaprende.com/instructores/sara-martinez-ruiz/', ARRAY['Logopedia Forense','Peritaje','Máster'], 2),
  (p, 'Curso de Intervención Centrada en la Familia en Atención Temprana', 'Programa del Instituto Fono Aprende del que es docente: modelo de intervención que sitúa a la familia como agente principal del desarrollo en los primeros años de vida.', 'PROJECT', 'https://fonoaprende.com/instructores/sara-martinez-ruiz/', ARRAY['Atención Temprana','Familia','Formación online'], 3),
  (p, 'Curso de Estimulación Temprana del Lenguaje', 'Programa del Instituto Fono Aprende del que es docente: pautas de estimulación del lenguaje en las etapas iniciales del desarrollo comunicativo.', 'PROJECT', 'https://fonoaprende.com/instructores/sara-martinez-ruiz/', ARRAY['Estimulación del Lenguaje','Atención Temprana','Formación online'], 4),
  (p, 'Protocolo Clínico del Centro Logopedia Martínez', 'Circuito asistencial propio del centro: entrevista inicial, evaluación con test estandarizados y no estandarizados y observación directa, plan individualizado con objetivos y temporalización, y evaluación final con plan de mantenimiento. Incluye modalidad a domicilio para favorecer la generalización.', 'PROJECT', 'https://logopedia-martinez.webnode.es', ARRAY['Protocolo Clínico','Evaluación','Atención a Domicilio'], 5),
  (p, 'Estudio Longitudinal sobre Lectoescritura en Niños Sordos', 'Trabajo de fin de grado: estudio experimental longitudinal sobre el aprendizaje de la lectoescritura en niños sordos sin lenguaje.', 'PROJECT', NULL, ARRAY['Investigación','Lectoescritura','Sordera'], 6);

INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p, 'Logopeda colegiada - Nº Col. 39/0285L', 'Colegio Profesional de Logopedas', 'CERTIFICATION', 100),
  (p, 'Formación especializada en Motricidad Orofacial y Terapia Miofuncional', 'Formación continuada en logopedia', 'CERTIFICATION', 101),
  (p, 'Formación especializada en Logopedia Neonatal y Lactancia Materna', 'Formación continuada en logopedia', 'CERTIFICATION', 102),
  (p, 'Rehabilitación tras Frenectomía en Bebés', 'Formación continuada en logopedia', 'CERTIFICATION', 103),
  (p, 'Comunicación Aumentativa y Alternativa (CAA)', 'Formación continuada en logopedia', 'CERTIFICATION', 104),
  (p, 'Electroestimulación aplicada a la Logopedia', 'Formación continuada en logopedia', 'CERTIFICATION', 105),
  (p, 'Intervención en Tartamudez y Respirador Oral', 'Formación continuada en logopedia', 'CERTIFICATION', 106);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. URL pública prevista: https://yourcvpassport.com/cv/sara-martinez
-- 2. SIN AVATAR: su ficha de Fono Aprende no incluye fotografía (sólo hay
--    imágenes de cursos y logos) y su web tampoco publica un retrato usable.
--    Pedirle una foto o dejar el perfil sin avatar.
-- 3. FECHAS. Sólo "desde 2020" (Centro Logopedia Martínez) está confirmado.
--    El resto son estimaciones a validar con ella:
--      · Grado en Logopedia Gimbernat-Cantabria  2012-2016 (estimado)
--      · Máster Euroinnova                       2017-2018 (estimado)
--      · Máster en Lactancia Materna             2019-2020 (estimado)
--      · Clínica MG María Gutiérrez              2017-2019 (estimado; la bio
--        sólo dice que fue su primera etapa, anterior a 2020)
--      · Instituto Fono Aprende                  desde 07/2025 (fecha de
--        publicación de sus programas en la web)
-- 4. CRITERIO DE FUENTES: manda la ficha de Fono Aprende. Su web propia
--    (logopedia-martinez.webnode.es) sólo aporta lo que la ficha no recoge y
--    no la contradice:
--      · Nº de colegiada 39/0285L (dato de credibilidad, no estaba en la ficha)
--      · Máster en Lactancia Materna (la ficha lo citaba como "formación
--        especializada", la web lo titula como máster)
--      · Cartera clínica ampliada: TEA, implante coclear, síndrome de Williams,
--        disfagia, daño cerebral y afasia
--      · Protocolo de trabajo del centro y servicio a domicilio
--      · Atiende también a ADULTOS: la ficha de Fono Aprende la presenta sólo
--        como pediátrica y neonatal; su web dice "tanto en niños como en
--        adultos". Se recoge el matiz sin cambiar su posicionamiento principal.
-- 5. UBICACIÓN INFERIDA: 'Cantabria, España'. Ni la ficha ni la web indican
--    ciudad. Se deduce del prefijo 39 del número de colegiada (Cantabria) y de
--    su titulación en Gimbernat-Cantabria. CONFIRMAR y concretar municipio.
-- 6. PRIVACIDAD: su web publica el teléfono (+34) 641 581 690 y el horario de
--    atención. NO se cargan en el perfil, mismo criterio que con el resto.
--    portfolio_url sí apunta a su web, que es escaparate profesional.
-- 7. Su centro incluye a una segunda profesional, María de las Alas-Pumariño
--    Rosellón (pedagoga, Universidad de Salamanca). No se menciona en el
--    perfil por ser un tercero ajeno a esta alta.
-- 8. Fechas en día 15 por el bug de formatDate() (ver migración de Aleix Mabres).
-- 9. degree y position con texto descriptivo largo a propósito: la plantilla no
--    renderiza field_of_study y la caché de traducción degrada los términos de
--    una sola palabra (ver notas de la migración de Arantxa Saiz).
-- ============================================================================
