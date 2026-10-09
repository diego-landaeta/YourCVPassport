-- ============================================================================
-- SEED: Clara Hilares Vargas · Logopeda y Consultora en Neuroeducación e IA
-- Date: 2026-09-14
-- Sources: https://fonoaprende.com/instructores/clara-hilares-vargas/ (bio literal)
--          + LinkedIn https://www.linkedin.com/in/clara-hilares-79521766
--            (revisado el 14/09/2026; de ahí salen las fechas reales de CPAL,
--             la residencia en Cataluña, los idiomas y el detalle formativo)
-- Template: passport
-- Brand color: #720EEC (morado corporativo de fonoaprende.com)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- ⚠️  auth.user creado el 14/09/2026 con el UUID real indicado abajo.
--     Email: clara.hilares@fonoaprende.com
-- ============================================================================

DO $$
DECLARE
  p CONSTANT UUID := 'edcf5e30-5947-44bd-bee4-7bcd7e599ed4';  -- UUID real: Clara Hilares Vargas
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
  full_name = 'Clara Hilares Vargas',
  headline = 'Logopeda y Consultora en Neuroeducación e Inteligencia Artificial aplicada a la Educación · Motricidad orofacial y neurodesarrollo infantil · Diseño de aprendizaje digital',
  summary = 'Logopeda con casi diez años de ejercicio clínico continuado y una segunda etapa profesional orientada a la neuroeducación, el aprendizaje digital y la inteligencia artificial aplicada a la educación. Su trayectoria tiene, por tanto, dos capas que se sostienen mutuamente: la clínica, que le da el criterio sobre cómo se desarrolla y se altera la comunicación humana, y la tecnológica-educativa, que le permite trasladar ese criterio al diseño de experiencias formativas. Durante casi diez años, entre noviembre de 2012 y septiembre de 2022, ejerció como Especialista en el CPAL, Centro Peruano de Audición, Lenguaje y Aprendizaje de Lima, institución de referencia en el ámbito hispanohablante. Allí concentró su práctica en la motricidad orofacial y en el diseño de programas individualizados, atendiendo cuadros de disfagia, apraxia del habla, afasia, trastornos de la articulación y trastornos del espectro autista, siempre dentro de equipos interdisciplinarios junto a psicólogos, terapeutas ocupacionales, fisioterapeutas, neuropediatras, docentes y familias. Su formación de base es la Licenciatura en Terapia de Lenguaje, con título homologado en España, y sobre ella ha acumulado una especialización sostenida: especialista en Motricidad Orofacial y especialista en Autismo, además de una Maestría en Neurociencia por la Universidad Nacional Mayor de San Marcos —la universidad decana de América— y una Maestría en Neurociencia y Educación Virtual por Broward International University, que es la bisagra entre sus dos vertientes. Ha completado también formación específica en inteligencia artificial aplicada al puesto de trabajo. Hoy trabaja como consultora en neuroeducación e inteligencia artificial aplicada a la educación, diseñando experiencias de aprendizaje digital y proyectos de e-learning, e imparte docencia en el Instituto Fono Aprende, donde dirige el Curso de Higiene y Prevención de Lesiones Vocales. Su práctica profesional se fundamenta en cuatro pilares explícitos: la atención temprana, el respeto al ritmo evolutivo de cada niño, la evidencia científica y la participación activa de la familia como agente principal del desarrollo. Defiende una intervención basada en fortalezas, orientada a la autonomía, la comunicación funcional y la inclusión real del niño en los contextos de su vida cotidiana. Reside en Cataluña y su perfil lingüístico es poco habitual: hablante nativa de quechua además de castellano, con competencia básica en catalán, inglés y portugués.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#720EEC',
  location = 'Sant Vicenç dels Horts, Barcelona, España', country_code = 'ES',
  slug = 'clara-hilares', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Clara Hilares Vargas · Logopeda y Consultora en Neuroeducación e IA Educativa',
  meta_description = 'Logopeda con casi 10 años en CPAL (Lima) especializada en motricidad orofacial, disfagia, apraxia y afasia. Consultora en neuroeducación e inteligencia artificial aplicada a la educación. Docente en Instituto Fono Aprende.',
  linkedin_url = 'https://www.linkedin.com/in/clara-hilares-79521766'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EXPERIENCES
-- CPAL lleva fechas REALES de LinkedIn (nov 2012 - sept 2022, 9 a 11 m).
-- Las otras dos son estimadas: ver nota 3.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'Consultoría en Neuroeducación e Inteligencia Artificial aplicada a la Educación', 'Consultora - Neuroeducación, IA educativa y aprendizaje digital', '2022-10-15', NULL, true, 'Consultoría en neuroeducación e inteligencia artificial aplicada a la educación. Diseño de experiencias de aprendizaje digital y de proyectos de e-learning, integrando ciencia cognitiva, tecnología educativa e inteligencia artificial. El criterio clínico acumulado en casi diez años de logopedia es el que sostiene el diseño instruccional: cómo se adquiere el lenguaje, cómo se sostiene la atención y qué condiciones necesita un aprendizaje para consolidarse.', 1),
  (p, 'Instituto Fono Aprende', 'Docente - Voz y prevención de lesiones vocales', '2025-10-15', NULL, true, 'Docente del Instituto Fono Aprende, centro de formación online especializado en logopedia con campus en España, Perú, México, Colombia, Chile y Argentina. Imparte el Curso de Higiene y Prevención de Lesiones Vocales, programa online orientado al cuidado de la voz y a la prevención de la patología vocal. Su maestría en educación virtual le aporta el soporte metodológico para el diseño y la impartición de formación en entorno digital.', 2),
  (p, 'CPAL - Centro Peruano de Audición, Lenguaje y Aprendizaje (Lima, Perú)', 'Especialista en Logopedia - Jornada parcial', '2012-11-15', '2022-09-15', false, 'Casi diez años (9 años y 11 meses) como Especialista en el CPAL, institución de referencia en el ámbito hispanohablante para la atención de las alteraciones de la audición, el lenguaje y el aprendizaje. Práctica centrada en la motricidad orofacial y en el diseño de programas individualizados para cada paciente, con intervención en disfagia, apraxia del habla, afasia, trastornos de la articulación y trastornos del espectro autista. Planificación de tratamientos y trabajo sistemático en equipo interdisciplinar junto a psicólogos, terapeutas ocupacionales, fisioterapeutas, neuropediatras y docentes, con implicación directa de las familias en el proceso terapéutico.', 3),
  (p, 'Centro Especializado en Terapias Integrales Aleyo', 'Directora', '2018-01-15', '2022-09-15', false, 'Dirección del Centro Especializado en Terapias Integrales Aleyo, dedicado a la atención de niños y sus familias, compaginada con la jornada parcial en CPAL. Coordinación de los equipos de atención temprana y supervisión de la calidad asistencial de los servicios prestados, definiendo criterios de intervención y velando por la coherencia metodológica del centro.', 4);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: EDUCATION (titulaciones principales)
-- Las especializaciones y cursos van en CERTIFICATIONS para no duplicar.
-- ⚠️ Fechas estimadas: LinkedIn lista los estudios SIN fechas. Ver nota 3.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'BIU - Broward International University', 'Maestría en Neurociencia y Educación Virtual', 'Neurociencia y Educación Virtual', '2021-01-15', '2022-06-15', 1),
  (p, 'Universidad Nacional Mayor de San Marcos', 'Maestría en Neurociencia', 'Neurociencia', '2017-03-15', '2019-06-15', 2),
  (p, 'Universidad Nacional Federico Villarreal', 'Licenciada en Terapia de Lenguaje (título homologado en España)', 'Terapia de Lenguaje / Logopedia', '2006-03-15', '2011-12-15', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS (clínicas primero, luego la vertiente educativa/digital)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Motricidad orofacial', 'EXPERT', 1),
  (p, 'Disfagia y trastornos de la deglución', 'EXPERT', 2),
  (p, 'Apraxia del habla', 'EXPERT', 3),
  (p, 'Afasia y rehabilitación del lenguaje', 'ADVANCED', 4),
  (p, 'Trastornos de la articulación', 'EXPERT', 5),
  (p, 'Trastorno del Espectro Autista (TEA)', 'ADVANCED', 6),
  (p, 'Planificación de tratamientos logopédicos', 'EXPERT', 7),
  (p, 'Diseño de programas de intervención individualizados', 'EXPERT', 8),
  (p, 'Atención y estimulación temprana', 'EXPERT', 9),
  (p, 'Neurodesarrollo infantil', 'EXPERT', 10),
  (p, 'Trabajo en equipo interdisciplinar', 'EXPERT', 11),
  (p, 'Intervención centrada en la familia', 'ADVANCED', 12),
  (p, 'Higiene y prevención de lesiones vocales', 'ADVANCED', 13),
  (p, 'Neurociencia aplicada a la educación', 'EXPERT', 14),
  (p, 'Neuroeducación', 'EXPERT', 15),
  (p, 'Inteligencia artificial aplicada a la educación', 'ADVANCED', 16),
  (p, 'Diseño de experiencias de aprendizaje digital', 'ADVANCED', 17),
  (p, 'E-learning y educación virtual', 'ADVANCED', 18),
  (p, 'Competencias digitales', 'ADVANCED', 19),
  (p, 'Dirección y coordinación de centros de terapia', 'ADVANCED', 20),
  (p, 'Práctica basada en la evidencia', 'ADVANCED', 21);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: LANGUAGES (declarados en su LinkedIn)
-- "Competencia básica" se mapea a A2; "bilingüe o nativa" a Native.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Castellano', 'Native', true, 1),
  (p, 'Quechua', 'Native', true, 2),
  (p, 'Catalán', 'A2', false, 3),
  (p, 'Inglés', 'A2', false, 4),
  (p, 'Portugués', 'A2', false, 5);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 8: CERTIFICATIONS (especializaciones y cursos; no se repiten las
-- titulaciones que ya salen en la sección Educación de la plantilla)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, sort_order) VALUES
  (p, 'Curso de Higiene y Prevención de Lesiones Vocales', 'Programa online del Instituto Fono Aprende dirigido por ella: cuidado de la voz, factores de riesgo de la patología vocal y pautas de prevención para profesionales que usan la voz como herramienta de trabajo.', 'PROJECT', 'https://fonoaprende.com/instructores/clara-hilares-vargas/', ARRAY['Voz','Prevención','Formación online'], 1),
  (p, 'Programa de Intervención en Motricidad Orofacial', 'Línea de trabajo desarrollada durante casi diez años en CPAL: evaluación de las funciones orofaciales y diseño de programas individualizados en disfagia, apraxia del habla y trastornos de la articulación.', 'PROJECT', NULL, ARRAY['Motricidad Orofacial','Disfagia','Intervención Individualizada'], 2),
  (p, 'Diseño de Experiencias de Aprendizaje Digital con IA', 'Consultoría en neuroeducación: diseño de formación digital que integra ciencia cognitiva, tecnología educativa e inteligencia artificial, aplicando criterios de atención, carga cognitiva y consolidación del aprendizaje.', 'PROJECT', NULL, ARRAY['Neuroeducación','E-learning','Inteligencia Artificial'], 3);

INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p, 'Especialización en Motricidad Orofacial', 'CEFAC', 'CERTIFICATION', 100),
  (p, 'Especialización en Autismo', 'Pontificia Universidad Católica del Perú (PUCP)', 'CERTIFICATION', 101),
  (p, 'Especialización en Estimulación Temprana', 'Universidad Ricardo Palma', 'CERTIFICATION', 102),
  (p, 'Título de Logopeda homologado en España', 'Homologación de la Licenciatura en Terapia de Lenguaje (UNFV)', 'CERTIFICATION', 103),
  (p, 'Inteligencia Artificial aplicada al puesto de trabajo', 'Grupo Aspasia · junio 2026', 'CERTIFICATION', 104),
  (p, 'Ciclo Formativo de Grado Superior en Administración y Finanzas', 'Institut Tremp', 'CERTIFICATION', 105);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. URL pública prevista: https://yourcvpassport.com/cv/clara-hilares
-- 2. avatar_url no se toca aquí. Foto descargada de su ficha oficial
--    (fonoaprende.com/wp-content/uploads/2026/08/clara-hilares-vargas.png,
--    337x421 px); se sube con el script de avatar adaptado a su UUID.
-- 3. FECHAS. Sólo CPAL tiene fechas confirmadas (LinkedIn: nov 2012 - sept 2022,
--    9 años 11 meses). El resto son estimaciones a validar con ella:
--      · Licenciatura en Terapia de Lenguaje  2006-2011  (estimado)
--      · Maestría Neurociencia UNMSM          2017-2019  (estimado)
--      · Maestría BIU Neurociencia y Ed. Virtual 2021-2022 (estimado)
--      · Centro Aleyo                         2018-2022  (estimado; la bio de
--        Fono Aprende dice que lo dirigió "en paralelo" a CPAL)
--      · Consultoría neuroeducación/IA        desde 2022 (tras salir de CPAL)
--      · Instituto Fono Aprende               desde 10/2025 (fecha de su curso)
-- 4. CRITERIO DE FUENTES: manda la ficha oficial de Fono Aprende. LinkedIn
--    sólo aporta lo que la ficha no recoge y no contradice (fechas de CPAL,
--    residencia, idiomas y matiz clínico: disfagia, apraxia, afasia,
--    articulación). Motivo: los perfiles de LinkedIn suelen estar sin
--    actualizar, y el de Clara lo está —no lista la UNFV entre sus 8 estudios
--    ni recoge el Centro Aleyo—. Discrepancias resueltas así:
--      · Motricidad Orofacial -> CEFAC          (LinkedIn decía CPAL)
--      · Autismo              -> PUCP           (LinkedIn decía CPAL)
--      · Estimulación Temprana-> U. Ricardo Palma (no figura en LinkedIn)
--      · Licenciatura         -> Universidad Nacional Federico Villarreal
--                                (no figura en LinkedIn)
--      · Centro Aleyo         -> se mantiene    (no figura en LinkedIn)
-- 5. UBICACIÓN CORREGIDA: reside en Sant Vicenç dels Horts (Barcelona),
--    country_code 'ES'. La versión anterior de esta migración la situaba en
--    Perú por inferencia a partir de su formación; su LinkedIn lo desmiente.
-- 6. No consta número de colegiada. Pendiente de ella.
-- 7. Fechas en día 15 por el bug de formatDate() (ver migración de Aleix Mabres).
-- 8. degree y position con texto descriptivo largo a propósito: la plantilla no
--    renderiza field_of_study y la caché de traducción degrada los términos de
--    una sola palabra (ver notas de la migración de Arantxa Saiz).
-- 9. job_seeking_status = 'NOT_LOOKING' e is_open_to_messages = false:
--    confirmado por el usuario, no está buscando empleo.
-- ============================================================================
