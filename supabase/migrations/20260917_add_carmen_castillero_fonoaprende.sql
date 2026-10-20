-- ============================================================================
-- SEED: Carmen Castillero Romero · Logopeda · Voz y Neurologopedia · Fono Aprende
-- Date: 2026-09-17
-- Source: https://fonoaprende.com/instructores/carmen-castillero-romero/
-- Template: passport · Brand color: #720EEC (Fono Aprende)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
-- auth.user creado el 17/09/2026 · carmen.castillero@fonoaprende.com
-- ============================================================================

DO $$
DECLARE
  p CONSTANT UUID := '56d0fbbc-ad51-4a02-8e0f-f4e97b36902e';  -- Carmen Castillero Romero
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
  full_name = 'Carmen Castillero Romero',
  headline = 'Logopeda especialista en Voz Profesional y Neurologopedia · Hospital de Manises · Docente en Instituto Fono Aprende',
  summary = 'Logopeda con más de diez años de ejercicio repartidos entre el hospital público, la clínica privada y la docencia universitaria, y con una especialización doble que marca su perfil: la voz profesional y la intervención neurológica. Graduada en Logopedia por la Universitat de València, construyó su especialización en voz en dos etapas complementarias: el Máster en Voz de la Escola de Patologia del Llenguatge del Hospital de la Santa Creu i Sant Pau de Barcelona, una de las escuelas de referencia del país en la materia, y un postgrado en especialización, rehabilitación y perfeccionamiento de la voz profesional hablada y cantada. Esa formación la habilita para trabajar con quienes usan la voz como herramienta de trabajo —docentes, cantantes, actores, profesionales de la comunicación— donde el objetivo no es sólo eliminar la patología sino devolver un rendimiento vocal sostenible. Su segunda vertiente es la neurológica: Máster en Neurologopedia por la Universidad de Vic y postgrado en Rehabilitación Cognitiva por ISEP, formación que aplica en la intervención con pacientes con daño neurológico y en logopedia geriátrica. Desde 2020 ocupa plaza fija como logopeda en el Hospital de Manises, y antes pasó por el Consorcio Hospital Provincial de Castellón, el Hospital IMED y la Asociación Parkinson Valencia, además de dirigir el servicio de logopedia del Centro Médico Fivasa y mantener consulta privada durante seis años. Esa combinación de hospital público, entidad de pacientes y práctica privada le da una visión poco habitual del recorrido real de un paciente. Su actividad docente es igualmente extensa: ha impartido en el Máster de Terapia Miofuncional de ISEP, en un Máster de Neurociencia Cognitiva y en el Grado de la Universitat de València, y ha participado como ponente en el Congreso Internacional AELFA-IF, la principal cita científica de la logopedia en España. En el Instituto Fono Aprende dirige el Diplomado en Rehabilitación y Terapia Vocal Avanzada.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#720EEC',
  location = 'Valencia, España', country_code = 'ES',
  slug = 'carmen-castillero', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Carmen Castillero Romero · Logopeda · Voz Profesional y Neurologopedia',
  meta_description = 'Logopeda con más de 10 años de experiencia, especialista en voz profesional hablada y cantada y en neurologopedia. Plaza fija en el Hospital de Manises. Docente universitaria y en Instituto Fono Aprende.'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- EXPERIENCES · sólo "desde 2020" está fechado en la fuente (ver nota 2)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'Hospital de Manises', 'Logopeda - Plaza fija', '2020-01-15', NULL, true, 'Logopeda con plaza fija en el Hospital de Manises desde 2020. Evaluación e intervención logopédica hospitalaria, con especial dedicación a la patología vocal y a la rehabilitación del paciente con daño neurológico. Trabajo coordinado con los servicios de otorrinolaringología, neurología y rehabilitación.', 1),
  (p, 'Instituto Fono Aprende', 'Docente - Diplomado en Rehabilitación y Terapia Vocal Avanzada', '2025-09-15', NULL, true, 'Dirección e impartición del Diplomado en Rehabilitación y Terapia Vocal Avanzada del Instituto Fono Aprende: programa online de diez módulos y seis meses de duración, centrado en la evaluación y el tratamiento de la patología vocal y en la rehabilitación de la voz profesional.', 2),
  (p, 'Asociación Parkinson Valencia', 'Logopeda - Intervención en enfermedad de Parkinson', '2016-01-15', '2019-12-15', false, 'Intervención logopédica con personas con enfermedad de Parkinson: trabajo sobre la disartria, la intensidad y la proyección vocal, y la deglución, dentro de un abordaje de mantenimiento funcional a largo plazo y en coordinación con el resto del equipo de la asociación.', 3),
  (p, 'Centro Médico Fivasa', 'Directora del servicio de logopedia', '2015-01-15', '2019-12-15', false, 'Dirección del servicio de logopedia del centro: organización de la actividad asistencial, definición de los protocolos de evaluación e intervención y coordinación con el resto de especialidades del centro médico.', 4),
  (p, 'Consorcio Hospital Provincial de Castellón · Hospital IMED', 'Logopeda - Ámbito hospitalario', '2014-01-15', '2019-12-15', false, 'Actividad logopédica hospitalaria en el Consorcio Hospital Provincial de Castellón y en el Hospital IMED, con intervención en patología vocal, trastornos neurológicos del lenguaje y del habla, y disfagia.', 5),
  (p, 'Consulta privada de logopedia', 'Logopeda - Consulta privada', '2014-01-15', '2020-01-15', false, 'Seis años de consulta privada, compaginada con la actividad hospitalaria. Atención a profesionales de la voz —docentes, cantantes, actores— y a pacientes con secuelas neurológicas del lenguaje y la comunicación.', 6),
  (p, 'Docencia universitaria y de posgrado', 'Docente invitada', '2016-01-15', NULL, true, 'Docencia en el Máster de Terapia Miofuncional de ISEP, en un Máster de Neurociencia Cognitiva y en el Grado de Logopedia de la Universitat de València. Ponente en el Congreso Internacional AELFA-IF, principal cita científica de la logopedia en España.', 7);

-- ═══════════════════════════════════════════════════════════════════════
-- EDUCATION · ⚠️ fechas estimadas: la fuente no aporta ninguna (nota 2)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'Universidad de Vic', 'Máster en Neurologopedia', 'Neurologopedia', '2018-09-15', '2019-07-15', 1),
  (p, 'Escola de Patologia del Llenguatge - Hospital de la Santa Creu i Sant Pau (Barcelona)', 'Máster en Voz', 'Patología y Rehabilitación de la Voz', '2015-09-15', '2016-07-15', 2),
  (p, 'Universitat de València', 'Grado en Logopedia', 'Logopedia', '2009-09-15', '2013-06-15', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Rehabilitación de la voz profesional hablada y cantada', 'EXPERT', 1),
  (p, 'Evaluación y tratamiento de la patología vocal', 'EXPERT', 2),
  (p, 'Higiene y reeducación vocal', 'EXPERT', 3),
  (p, 'Neurologopedia', 'EXPERT', 4),
  (p, 'Rehabilitación cognitiva', 'ADVANCED', 5),
  (p, 'Intervención en enfermedad de Parkinson (disartria y voz)', 'EXPERT', 6),
  (p, 'Logopedia geriátrica', 'ADVANCED', 7),
  (p, 'Disfagia y trastornos de la deglución', 'ADVANCED', 8),
  (p, 'Afasia y trastornos neurológicos del lenguaje', 'ADVANCED', 9),
  (p, 'Terapia miofuncional', 'ADVANCED', 10),
  (p, 'Logopedia hospitalaria', 'EXPERT', 11),
  (p, 'Coordinación con otorrinolaringología y neurología', 'ADVANCED', 12),
  (p, 'Dirección de servicios de logopedia', 'ADVANCED', 13),
  (p, 'Docencia universitaria y de posgrado', 'EXPERT', 14),
  (p, 'Comunicación científica y ponencias en congresos', 'ADVANCED', 15);

-- ═══════════════════════════════════════════════════════════════════════
-- LANGUAGES · ⚠️ la fuente no declara idiomas. Sólo castellano (nota 3)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Castellano', 'Native', true, 1);

-- ═══════════════════════════════════════════════════════════════════════
-- PORTFOLIO (PROJECT)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, sort_order) VALUES
  (p, 'Diplomado en Rehabilitación y Terapia Vocal Avanzada', 'Programa online de diez módulos y seis meses que dirige en el Instituto Fono Aprende: evaluación de la patología vocal, técnicas de rehabilitación y trabajo con la voz profesional hablada y cantada.', 'PROJECT', 'https://fonoaprende.com/instructores/carmen-castillero-romero/', ARRAY['Voz','Formación online','Diplomado'], 1),
  (p, 'Programa de voz para profesionales de la comunicación', 'Línea de trabajo con quienes usan la voz como herramienta laboral -docentes, cantantes, actores-, orientada a la recuperación funcional y a un rendimiento vocal sostenible en el tiempo.', 'PROJECT', NULL, ARRAY['Voz Profesional','Prevención','Rehabilitación'], 2),
  (p, 'Intervención logopédica en enfermedad de Parkinson', 'Trabajo continuado con la Asociación Parkinson Valencia sobre disartria, intensidad y proyección vocal y deglución, con enfoque de mantenimiento funcional a largo plazo.', 'PROJECT', NULL, ARRAY['Parkinson','Disartria','Deglución'], 3),
  (p, 'Ponencia en el Congreso Internacional AELFA-IF', 'Participación como ponente en el congreso de la Asociación Española de Logopedia, Foniatría y Audiología, principal cita científica de la profesión en España.', 'PROJECT', NULL, ARRAY['Congreso','Divulgación Científica'], 4);

-- ═══════════════════════════════════════════════════════════════════════
-- CERTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p, 'Postgrado en Especialización, Rehabilitación y Perfeccionamiento de la Voz Profesional Hablada y Cantada', 'Formación de posgrado especializada en voz', 'CERTIFICATION', 100),
  (p, 'Postgrado en Rehabilitación Cognitiva', 'ISEP - Instituto Superior de Estudios Psicológicos', 'CERTIFICATION', 101),
  (p, 'Docencia en el Máster de Terapia Miofuncional', 'ISEP - Instituto Superior de Estudios Psicológicos', 'CERTIFICATION', 102);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. URL pública: https://yourcvpassport.com/cv/carmen-castillero
--    Foto tomada de su ficha oficial de Fono Aprende y subida al bucket.
-- 2. FECHAS. La ficha sólo fecha "desde 2020" (Hospital de Manises) y declara
--    "más de 10 años" y "6 años de consulta privada". El resto de periodos son
--    una reconstrucción coherente con esa antigüedad, NO datos confirmados:
--      · Grado UV                 2009-2013 (estimado)
--      · Castellón / IMED         2014-2019 (estimado)
--      · Consulta privada         2014-2020 (los 6 años que declara)
--      · Máster en Voz Sant Pau   2015-2016 (estimado)
--      · Centro Médico Fivasa     2015-2019 (estimado)
--      · Asoc. Parkinson Valencia 2016-2019 (estimado)
--      · Máster Neurologopedia    2018-2019 (estimado)
--      · Hospital de Manises      desde 2020 (CONFIRMADO)
--      · Instituto Fono Aprende   desde 09/2025 (fecha de su diplomado)
--    Confirmar con ella antes de dar el perfil por cerrado.
-- 3. No consta número de colegiada ni idiomas. Pendiente de ella.
-- 4. Fechas en día 15 por el bug de formatDate() (ver migración de Aleix).
-- 5. degree y position con texto descriptivo largo a propósito: la plantilla no
--    renderiza field_of_study y la caché de traducción degrada los términos de
--    una sola palabra (ver notas de la migración de Arantxa Saiz).
-- ============================================================================
