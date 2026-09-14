-- ============================================================================
-- SEED: Director Académico ISEIE #20 · Juan Pablo Rodríguez González (Medicina)
-- Date: 2026-07-09
-- Source: https://iseie.com/director/juan-pablo-rodriguez-gonzalez/ + LinkedIn
-- Template: passport (mismo que el resto de directores ISEIE)
-- Brand color: #1E40AF (ISEIE navy blue)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Auth user creado en Supabase Dashboard con email juan.pablo.rodriguez@iseie.com
-- UUID: d4a15672-412f-400e-b36f-846fa5c1b2ca
--
-- ⚠️  PENDIENTE: avatar_url queda NULL hasta que ISEIE publique la foto.
--     Cuando esté disponible, ejecutar:
--       UPDATE profiles
--       SET avatar_url = 'https://iseie.com/wp-content/uploads/YYYY/MM/Juan-Pablo-Rodriguez-Gonzalez.webp'
--       WHERE id = 'd4a15672-412f-400e-b36f-846fa5c1b2ca';
-- ============================================================================

DO $$
DECLARE
  p20 CONSTANT UUID := 'd4a15672-412f-400e-b36f-846fa5c1b2ca';  -- Juan Pablo Rodríguez González
BEGIN

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 0: CLEANUP (idempotente)
-- ═══════════════════════════════════════════════════════════════════════
DELETE FROM portfolio_items WHERE profile_id = p20;
DELETE FROM skills          WHERE profile_id = p20;
DELETE FROM languages       WHERE profile_id = p20;
DELETE FROM education       WHERE profile_id = p20;
DELETE FROM experiences     WHERE profile_id = p20;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: PROFILE
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Dr. Juan Pablo Rodríguez González',
  headline = 'Médico Epidemiólogo · Residente MIR de Medicina Familiar y Comunitaria (Complejo Asistencial Universitario de Burgos) · Doble Especialización UNAB en Epidemiología y en Seguridad y Salud en el Trabajo · Docente en Grupo Colombiano de Emergencias (8+ años) · Investigador en eMPODERA-T y REPERC-AP · Director del Diplomado en Epidemiología ISEIE Innovation School',
  summary = 'Médico Epidemiólogo con trayectoria clínica, docente e investigadora consolidada en Colombia y actualmente ampliada en España a través de la Residencia MIR. Su perfil reúne una combinación poco habitual: triple especialización médica —Medicina Familiar y Comunitaria (en curso), Epidemiología, y Seguridad y Salud en el Trabajo— junto a más de ocho años continuados de docencia clínica en emergencias médicas, participación en proyectos de investigación en atención primaria y experiencia directa en la respuesta sanitaria a la pandemia COVID-19 desde la atención domiciliaria y la telemedicina. Su formación de grado se desarrolla íntegramente en la Fundación Universitaria Sanitas (Unisanitas, Bogotá), donde cursa Medicina entre julio de 2012 y julio de 2020 (8 años). Inmediatamente después inicia el itinerario de especialización en la Universidad Autónoma de Bucaramanga (UNAB), con dos titulaciones consecutivas: Especialista en Epidemiología (jul 2020 - sept 2021) y Especialista en Seguridad y Salud en el Trabajo (oct 2021 - sept 2022). Complementa esa etapa con el Diplomado en Salud Materna por la propia UNAB (marzo 2022). Su itinerario formativo culmina —de momento— con la Residencia MIR en Medicina Familiar y Comunitaria que cursa desde agosto de 2025 en el Complejo Asistencial Universitario de Burgos, centro de referencia en Castilla y León para la formación de médicos residentes, donde ejerce a jornada completa y presencial. Su carrera asistencial en Colombia se articula en torno a Clínica Eusalud (Bogotá, Distrito Capital), donde acumula casi 3 años continuados: primero como Médico a jornada parcial (enero - octubre 2022, 10 meses) y a continuación como Coordinador Médico a jornada completa en modalidad híbrida (octubre 2022 - noviembre 2024, 2 años 2 meses). Desde la coordinación médica lideró procesos de auditoría clínica interna, seguimiento epidemiológico institucional, gestión de casos médicos complejos y gestión integral de la atención al paciente, definiendo protocolos internos y coordinando equipos multidisciplinares. Previamente ejerció como Médico a jornada completa en Proyectar Salud IPS (Bogotá, agosto 2020 - septiembre 2021, 1 año 2 meses) en modalidad híbrida, etapa en la que participó de forma directa en la respuesta sanitaria a la pandemia COVID-19 mediante atención domiciliaria, seguimiento clínico de pacientes positivos y consulta telemática — una experiencia que le proporciona una comprensión pragmática del impacto operativo de una crisis epidemiológica sobre los sistemas de salud. Su vertiente docente es una de las columnas más largas y sostenidas de su carrera: durante más de 8 años continuados (junio 2016 - octubre 2024, 8 años 5 meses) ejerció como Médico Docente en el Grupo Colombiano de Emergencias (Bogotá, modalidad temporal e híbrida), donde impartió programas certificados de reanimación cardiopulmonar básica y avanzada (RCP-B y RCP-A), reanimación pediátrica y neonatal, y cuidados críticos y de terapia intensiva, con dominio pedagógico directo del entrenamiento por competencias en escenarios de alta presión. En el plano investigador ha estado vinculado a dos proyectos científicos: eMPODERA-T, centrado en la efectividad y coste-efectividad de comunidades virtuales de práctica como herramienta para el empoderamiento de pacientes con enfermedades crónicas, y REPERC-AP, orientado al análisis del manejo terapéutico de la enfermedad renal crónica (ERC) desde la atención primaria. Complementa su producción académica con participaciones como ponente en congresos científicos y como organizador de eventos universitarios en el ámbito de la epidemiología y la salud pública. En ISEIE Innovation School dirige el Diplomado en Epidemiología, donde convergen las tres facetas que definen su carrera: la mirada del médico asistencial que ha coordinado servicios sanitarios, la del docente que ha formado a cientos de sanitarios en emergencias médicas, y la del investigador que ha trabajado sobre atención primaria y enfermedad crónica desde una perspectiva de salud poblacional.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Burgos, España / Bogotá, Colombia', country_code = 'ES',
  slug = 'juan-pablo-rodriguez', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Dr. Juan Pablo Rodríguez · MIR MFyC H. Burgos · Doble Especialista UNAB · Docente GCE 8+ años · ISEIE',
  meta_description = 'Médico Epidemiólogo. Residente MIR de Medicina Familiar y Comunitaria en el Complejo Asistencial Universitario de Burgos. Triple especialización: MFyC (en curso), Epidemiología y SST por UNAB. MD Unisanitas. Ex-Coordinador Médico Clínica Eusalud (Bogotá). 8+ años como docente en Grupo Colombiano de Emergencias. Investigador en eMPODERA-T y REPERC-AP. Director del Diplomado en Epidemiología de ISEIE Innovation School.',
  avatar_url = NULL,  -- ⚠️ Pendiente: URL de iseie.com/wp-content/uploads/...
  linkedin_url = 'https://www.linkedin.com/in/juan-pablo-rodriguez-ba8501225/'
WHERE id = p20;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p20, 'ISEIE Innovation School', 'Director Académico - Diplomado en Epidemiología', '2025-01-01', NULL, true, 'Dirección académica del Diplomado en Epidemiología de ISEIE Innovation School (modalidad remota). Diseño curricular con foco en epidemiología clínica, vigilancia en salud pública, análisis de datos epidemiológicos y aplicación práctica en atención primaria. Selección y coordinación del cuerpo docente con perfil clínico e investigador activo. Tutorización académica de alumnos y supervisión de casos prácticos. Revisión continua de contenidos alineados con la evidencia científica más reciente en epidemiología y salud poblacional.', 1),
  (p20, 'Complejo Asistencial Universitario de Burgos', 'Médico Residente de Medicina Familiar y Comunitaria (MIR) · Jornada completa · Presencial', '2025-08-01', NULL, true, 'Residencia MIR en Medicina Familiar y Comunitaria en el Complejo Asistencial Universitario de Burgos (Castilla y León, España), uno de los centros públicos de referencia en la comunidad para la formación de médicos residentes. Formación reglada hospitalaria y extrahospitalaria con rotaciones por servicios hospitalarios, centros de salud, urgencias, atención domiciliaria y unidades de apoyo comunitario.', 2),
  (p20, 'Grupo Colombiano de Emergencias', 'Médico Docente · Contrato temporal · Modalidad híbrida', '2016-06-01', '2024-10-31', false, 'Más de 8 años continuados (8 años 5 meses) como Médico Docente en Grupo Colombiano de Emergencias (Bogotá, Distrito Capital). Impartición de programas certificados de reanimación cardiopulmonar básica (RCP-B) y avanzada (RCP-A), reanimación pediátrica y neonatal, y cuidados críticos y de terapia intensiva. Formación por competencias con simulación clínica de alta fidelidad, entrenamiento en escenarios de alta presión y evaluación por criterios. Coordinación con otros docentes y participación en el diseño de contenidos formativos.', 3),
  (p20, 'Clínica Eusalud', 'Coordinador Médico · Jornada completa · Modalidad híbrida', '2022-10-01', '2024-11-30', false, 'Coordinador Médico en Clínica Eusalud (Bogotá, Distrito Capital) durante 2 años 2 meses. Liderazgo de procesos de auditoría clínica interna, seguimiento epidemiológico institucional, gestión de casos médicos complejos, gestión integral de la atención al paciente y coordinación de equipos multidisciplinares. Definición de protocolos internos, indicadores de calidad asistencial y planes de mejora continua. Aptitudes validadas: gestión de casos médicos, gestión de atención al paciente, gestión de grupos médicos y coordinación de centros médicos.', 4),
  (p20, 'Clínica Eusalud', 'Médico · Jornada parcial', '2022-01-01', '2022-10-31', false, 'Etapa clínica inicial en Clínica Eusalud (Bogotá) durante 10 meses como Médico en jornada parcial, previa a la promoción a Coordinador Médico. Atención clínica ambulatoria y hospitalaria en el marco de un grupo médico.', 5),
  (p20, 'Proyectar Salud IPS', 'Médico · Jornada completa · Modalidad híbrida', '2020-08-01', '2021-09-30', false, 'Médico a jornada completa en Proyectar Salud IPS (Bogotá, Distrito Capital) durante 1 año 2 meses. Participación directa en la respuesta sanitaria a la pandemia COVID-19: atención domiciliaria a pacientes con sospecha o confirmación de infección, seguimiento clínico ambulatorio, consulta telemática y coordinación con equipos de salud pública. Experiencia práctica en el manejo operativo de una crisis epidemiológica sobre el sistema de salud colombiano.', 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p20, 'Complejo Asistencial Universitario de Burgos (SACyL)', 'Residencia MIR (en curso)', 'Medicina Familiar y Comunitaria', '2025-08-01', NULL, 1),
  (p20, 'Universidad Autónoma de Bucaramanga (UNAB)', 'Especialista', 'Seguridad y Salud en el Trabajo', '2021-10-01', '2022-09-30', 2),
  (p20, 'Universidad Autónoma de Bucaramanga (UNAB)', 'Especialista', 'Epidemiología', '2020-07-01', '2021-09-30', 3),
  (p20, 'Fundación Universitaria Sanitas (Unisanitas)', 'Médico (MD)', 'Medicina General', '2012-07-01', '2020-07-31', 4),
  (p20, 'Universidad Autónoma de Bucaramanga (UNAB)', 'Diplomado', 'Salud Materna', '2022-01-01', '2022-03-31', 5);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p20, 'Epidemiología Clínica y Salud Pública', 'EXPERT', 1),
  (p20, 'Vigilancia Epidemiológica y Seguimiento Institucional', 'EXPERT', 2),
  (p20, 'Coordinación Médica y Auditoría Clínica Interna', 'EXPERT', 3),
  (p20, 'Gestión de Casos Médicos Complejos', 'EXPERT', 4),
  (p20, 'Gestión de Atención al Paciente', 'EXPERT', 5),
  (p20, 'Seguridad y Salud en el Trabajo (SST)', 'EXPERT', 6),
  (p20, 'Reanimación Cardiopulmonar Básica y Avanzada (RCP-B / RCP-A)', 'EXPERT', 7),
  (p20, 'Reanimación Pediátrica y Neonatal', 'EXPERT', 8),
  (p20, 'Cuidados Críticos y Terapia Intensiva', 'ADVANCED', 9),
  (p20, 'Medicina Familiar y Comunitaria', 'ADVANCED', 10),
  (p20, 'Atención Primaria y Enfermedad Crónica', 'ADVANCED', 11),
  (p20, 'Telemedicina y Atención Domiciliaria', 'ADVANCED', 12),
  (p20, 'Respuesta Sanitaria a COVID-19', 'EXPERT', 13),
  (p20, 'Docencia Clínica en Emergencias Médicas (8+ años)', 'EXPERT', 14),
  (p20, 'Investigación en Atención Primaria', 'ADVANCED', 15),
  (p20, 'Coordinación de Equipos Multidisciplinares', 'ADVANCED', 16),
  (p20, 'Salud Materna', 'ADVANCED', 17);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p20, 'Español', 'Native', true, 1),
  (p20, 'Inglés', 'B2', false, 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO ITEMS (Programas dirigidos + hitos profesionales)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p20, 'Diplomado en Epidemiología', 'Programa de dirección académica en ISEIE Innovation School — Epidemiología clínica, vigilancia en salud pública y aplicación a la atención primaria.', 'OTHER', 'https://iseie.com/diplomados/epidemiologia/', 1),
  (p20, 'Investigación eMPODERA-T', 'Participación en el estudio eMPODERA-T sobre la efectividad y coste-efectividad de comunidades virtuales de práctica para el empoderamiento de personas con enfermedades crónicas.', 'PROJECT', NULL, 2),
  (p20, 'Investigación REPERC-AP', 'Participación en el estudio REPERC-AP, orientado al análisis del manejo terapéutico de la enfermedad renal crónica (ERC) desde la atención primaria.', 'PROJECT', NULL, 3),
  (p20, 'Docencia clínica en Grupo Colombiano de Emergencias (8+ años)', 'Más de 8 años como Médico Docente en RCP-B, RCP-A, reanimación pediátrica y neonatal, y cuidados críticos.', 'PROJECT', NULL, 4),
  (p20, 'Coordinación Médica en Clínica Eusalud', 'Coordinador Médico en Bogotá (2022-2024). Liderazgo de auditoría clínica, seguimiento epidemiológico y gestión de casos complejos.', 'PROJECT', NULL, 5),
  (p20, 'Residencia MIR de Medicina Familiar y Comunitaria - H. Universitario de Burgos', 'Residente MIR de MFyC en el Complejo Asistencial Universitario de Burgos (Castilla y León, España) desde agosto 2025.', 'PROJECT', NULL, 6);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 8: CERTIFICATIONS (as portfolio_items type=CERTIFICATION)
-- sort_order >= 10 para no chocar con los items del STAGE 7.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p20, 'Médico (MD) - Grado en Medicina', 'Fundación Universitaria Sanitas (Unisanitas) · 2012-2020', 'CERTIFICATION', 10),
  (p20, 'Especialista en Epidemiología', 'Universidad Autónoma de Bucaramanga (UNAB) · 2020-2021', 'CERTIFICATION', 11),
  (p20, 'Especialista en Seguridad y Salud en el Trabajo', 'Universidad Autónoma de Bucaramanga (UNAB) · 2021-2022', 'CERTIFICATION', 12),
  (p20, 'Diplomado en Salud Materna', 'Universidad Autónoma de Bucaramanga (UNAB) · marzo 2022', 'CERTIFICATION', 13),
  (p20, 'Residente MIR - Medicina Familiar y Comunitaria (en curso)', 'Complejo Asistencial Universitario de Burgos (SACyL) · desde agosto 2025', 'CERTIFICATION', 14),
  (p20, 'Formación e Impartición - RCP Básica y Avanzada, Reanimación Pediátrica y Neonatal, Cuidados Críticos', 'Grupo Colombiano de Emergencias · 2016-2024 (8+ años como docente)', 'CERTIFICATION', 15);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. Verify in /tutores o /directores listing que aparece con headline correcto.
--    URL pública: https://yourcvpassport.com/cv/juan-pablo-rodriguez
-- 2. slug = 'juan-pablo-rodriguez' encaja con el patrón ISEIE
--    (https://iseie.com/director/juan-pablo-rodriguez-gonzalez/).
-- 3. country_code = 'ES' porque su etapa actual (residencia MIR ~4 años en
--    Burgos) transcurre en España — mismo criterio aplicado a Luz Marina
--    Zuluaga (p10) que tiene doble ubicación Madrid/Colombia.
-- 4. avatar_url queda NULL hasta que ISEIE publique la foto en
--    wp-content/uploads/. Actualizar con un UPDATE puntual (ver cabecera).
-- 5. Los proyectos eMPODERA-T y REPERC-AP se incluyen porque están mencionados
--    explícitamente en la bio oficial de ISEIE.
-- ============================================================================
