-- ============================================================================
-- SEED: 4 perfiles de RELLENO para los verticales de IA
-- Date: 2026-09-14
-- Template: passport
-- Brand color: #0052FF — el mismo que usan los otros 65 perfiles de relleno
--              de la plataforma, para que queden agrupados y sean distinguibles
--              de los perfiles reales (ISEIE #1E40AF, PsikoAprende #0D9488,
--              Fono Aprende #720EEC, Aleix #0369A1, Arantxa #6D5FA8).
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- ⚠️  ESTOS PERFILES NO CORRESPONDEN A PERSONAS REALES.
--     Son contenido de relleno solicitado para poblar los verticales de IA
--     (medico IA, abogado IA, sexologia, psicologist.ai). En consecuencia:
--       · NO llevan número de colegiado, de licencia ni de registro. Inventar
--         uno es riesgoso: podría coincidir con el de un profesional real y
--         atribuirle credenciales sanitarias o jurídicas que no ha emitido.
--       · NO llevan stamps ni marcas de verificación.
--       · Los centros de trabajo son genéricos o descriptivos, nunca empresas
--         reales identificables, para no atribuirles empleados ficticios.
--     Si en algún momento se sustituyen por profesionales reales, rehacer el
--     perfil entero desde su documentación, no editar estos por encima.
--
-- ⚠️  auth.users creados el 14/09/2026 con los UUID reales indicados abajo.
--     Emails: <slug>@yourcvpassport.com
-- ============================================================================

DO $$
DECLARE
  p1 CONSTANT UUID := '9d3c783e-ad3a-4d10-ad61-086b46368fb1';  -- UUID real: Aryana Acevedo
  p2 CONSTANT UUID := '3376c88b-64fe-440b-bcd2-1130eb0bc2fe';  -- UUID real: Leonardo Muñoz
  p3 CONSTANT UUID := '726a1b7c-7ed5-477b-b6f7-5a012a227917';  -- UUID real: Carla Carrullo
  p4 CONSTANT UUID := '8e5c30a4-b1f1-4445-a54b-40c391840a7d';  -- UUID real: Andrés Acosta
BEGIN

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 0: CLEANUP (idempotente)
-- ═══════════════════════════════════════════════════════════════════════
DELETE FROM portfolio_items WHERE profile_id IN (p1, p2, p3, p4);
DELETE FROM skills          WHERE profile_id IN (p1, p2, p3, p4);
DELETE FROM languages       WHERE profile_id IN (p1, p2, p3, p4);
DELETE FROM education       WHERE profile_id IN (p1, p2, p3, p4);
DELETE FROM experiences     WHERE profile_id IN (p1, p2, p3, p4);

-- ═══════════════════════════════════════════════════════════════════════
-- 1. ARYANA ACEVEDO · Análisis Clínicos · vertical "Médico IA"
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Aryana Acevedo',
  headline = 'Especialista en Análisis Clínicos · Revisora médica de contenidos de salud · Validación clínica de sistemas de IA',
  summary = 'Especialista en Análisis Clínicos cuya trayectoria combina el laboratorio hospitalario con la revisión médica de contenidos divulgativos y asistenciales. Su trabajo diario consiste en interpretar resultados analíticos dentro del contexto clínico completo del paciente y en trasladar esa interpretación a un lenguaje que otros profesionales y los propios pacientes puedan utilizar para tomar decisiones. En los últimos años ha orientado buena parte de su actividad a la revisión clínica de sistemas asistidos por inteligencia artificial: validación de la corrección médica de las respuestas, detección de afirmaciones no sustentadas por la evidencia, revisión de los límites de la herramienta y definición de los avisos de derivación a consulta presencial. Defiende un principio sencillo pero exigente: un sistema de IA aplicado a salud sólo es aceptable si sabe reconocer lo que no puede responder y deriva al profesional adecuado. Su formación de base es el Grado en Medicina, con especialización posterior en Análisis Clínicos, y la completa con el Diplomado en Epidemiología de ISEIE Innovation School y con formación específica en metodología de la investigación, lectura crítica de la evidencia y bioestadística aplicada, herramientas que aplica tanto a la validación de resultados de laboratorio como a la revisión de contenidos de salud.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0052FF',
  location = 'Madrid, España', country_code = 'ES',
  slug = 'aryana-acevedo', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Aryana Acevedo · Especialista en Análisis Clínicos y revisora médica',
  meta_description = 'Especialista en Análisis Clínicos. Interpretación de pruebas de laboratorio, revisión médica de contenidos de salud y validación clínica de sistemas asistidos por inteligencia artificial.'
WHERE id = p1;

INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p1, 'Proyectos de salud digital', 'Revisora médica - Validación clínica de sistemas de IA', '2023-03-15', NULL, true, 'Revisión médica de contenidos y de sistemas de orientación en salud asistidos por inteligencia artificial. Validación de la corrección clínica de las respuestas generadas, verificación del respaldo en evidencia, detección de afirmaciones no sustentadas y revisión de los sesgos de interpretación más habituales. Definición de los límites de uso de la herramienta y de los criterios de derivación a consulta presencial, así como de los avisos que debe mostrar el sistema ante signos de alarma.', 1),
  (p1, 'Laboratorio de Análisis Clínicos hospitalario', 'Facultativa Especialista en Análisis Clínicos', '2018-06-15', NULL, true, 'Facultativa en el servicio de análisis clínicos: validación facultativa de resultados, interpretación integrada con el contexto clínico del paciente e informe de las pruebas de bioquímica, hematología, inmunología y microbiología. Interconsulta con los servicios peticionarios para orientar el algoritmo diagnóstico y evitar pruebas redundantes. Participación en el control de calidad interno y externo del laboratorio y en la revisión periódica de los valores de referencia. Etapa iniciada tras completar la formación especializada de cuatro años, con rotaciones por bioquímica clínica, hematología, inmunología, microbiología y genética.', 2);

INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p1, 'ISEIE Innovation School', 'Diplomado en Epidemiología', 'Epidemiología y Salud Pública', '2019-02-15', '2019-11-15', 1),
  (p1, 'Universidad pública española', 'Grado en Medicina', 'Medicina', '2007-09-15', '2013-06-15', 2);

INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p1, 'Interpretación de pruebas de laboratorio', 'EXPERT', 1),
  (p1, 'Validación facultativa de resultados analíticos', 'EXPERT', 2),
  (p1, 'Correlación clínico-analítica', 'EXPERT', 3),
  (p1, 'Bioquímica clínica', 'EXPERT', 4),
  (p1, 'Hematología de laboratorio', 'ADVANCED', 5),
  (p1, 'Inmunología y microbiología diagnóstica', 'ADVANCED', 6),
  (p1, 'Revisión médica de contenidos de salud', 'EXPERT', 7),
  (p1, 'Validación clínica de sistemas de IA', 'ADVANCED', 8),
  (p1, 'Lectura crítica de la evidencia científica', 'ADVANCED', 9),
  (p1, 'Bioestadística aplicada', 'ADVANCED', 10),
  (p1, 'Control de calidad de laboratorio', 'ADVANCED', 11),
  (p1, 'Comunicación de resultados a pacientes y profesionales', 'ADVANCED', 12);

INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p1, 'Castellano', 'Native', true, 1),
  (p1, 'Inglés', 'B2', false, 2);

INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES
  (p1, 'Protocolo de Validación Clínica para Asistentes de Salud', 'Marco de revisión para sistemas de orientación en salud asistidos por IA: criterios de corrección clínica, verificación del respaldo en evidencia, detección de afirmaciones no sustentadas y definición de los umbrales de derivación a consulta presencial.', 'PROJECT', ARRAY['Validación Clínica','IA en Salud','Seguridad del Paciente'], 1),
  (p1, 'Guía de Interpretación de Analíticas para Atención Primaria', 'Material de apoyo para la lectura integrada de pruebas de laboratorio en el contexto clínico del paciente, orientado a evitar pruebas redundantes y a ordenar el algoritmo diagnóstico.', 'PROJECT', ARRAY['Laboratorio Clínico','Atención Primaria','Formación'], 2),
  (p1, 'Revisión Médica de Contenidos Divulgativos de Salud', 'Proceso sistemático de revisión de contenidos de salud dirigidos al público general: verificación de la evidencia, corrección de sesgos de interpretación y control del lenguaje de riesgo.', 'PROJECT', ARRAY['Divulgación','Evidencia Científica','Revisión Médica'], 3);

INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p1, 'Lectura Crítica de la Evidencia Científica', 'Formación continuada en metodología de la investigación', 'CERTIFICATION', 100),
  (p1, 'Bioestadística Aplicada a las Ciencias de la Salud', 'Formación de posgrado', 'CERTIFICATION', 101),
  (p1, 'Control de Calidad en el Laboratorio Clínico', 'Formación continuada', 'CERTIFICATION', 102);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. LEONARDO MUÑOZ · Derecho mercantil + IA · vertical "Abogado IA"
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Leonardo Muñoz',
  headline = 'Abogado mercantil · Derecho societario y contractual · Regulación de inteligencia artificial y cumplimiento normativo',
  summary = 'Abogado mercantilista centrado en el asesoramiento a empresas tecnológicas, con una especialización creciente en el marco regulatorio de la inteligencia artificial. Su práctica habitual cubre el derecho societario —constitución, pactos de socios, operaciones sobre participaciones, órganos de administración— y la contratación mercantil, con especial atención a los contratos de licencia de software, prestación de servicios tecnológicos y tratamiento de datos. Sobre esa base ha construido una segunda línea de trabajo que hoy ocupa buena parte de su actividad: acompañar a empresas que desarrollan o incorporan sistemas de inteligencia artificial en su adaptación al Reglamento Europeo de Inteligencia Artificial, la clasificación de sus sistemas por nivel de riesgo, las obligaciones de transparencia frente al usuario, la asignación de responsabilidad por decisiones automatizadas y la articulación de todo ello con el RGPD. Trabaja de forma habitual junto a equipos de producto y de ingeniería, partiendo de una convicción: el cumplimiento normativo se diseña dentro del producto desde el principio, y no se añade como una capa de documentación al final del desarrollo.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0052FF',
  location = 'Barcelona, España', country_code = 'ES',
  slug = 'leonardo-munoz', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Leonardo Muñoz · Abogado mercantil · Regulación de inteligencia artificial',
  meta_description = 'Abogado mercantilista especializado en derecho societario y contratación tecnológica. Asesoramiento en el Reglamento Europeo de IA, gestión del riesgo regulatorio, transparencia algorítmica y protección de datos.'
WHERE id = p2;

INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p2, 'Despacho propio de asesoramiento mercantil y tecnológico', 'Abogado - Derecho mercantil y regulación de IA', '2021-01-15', NULL, true, 'Asesoramiento jurídico a empresas tecnológicas y startups en derecho societario y contratación mercantil: constitución de sociedades, pactos de socios, rondas de financiación, acuerdos de licencia de software y contratos de prestación de servicios tecnológicos. Línea específica de trabajo en regulación de inteligencia artificial: clasificación de sistemas por nivel de riesgo conforme al Reglamento Europeo de IA, obligaciones de transparencia e información al usuario, análisis de responsabilidad por decisiones automatizadas y encaje con la normativa de protección de datos. Elaboración de políticas de uso, términos y condiciones y documentación de cumplimiento para productos basados en IA.', 1),
  (p2, 'Despacho de abogados de ámbito mercantil', 'Abogado del departamento mercantil', '2016-09-15', '2020-12-15', false, 'Ejercicio en el departamento mercantil: asesoramiento societario recurrente, secretaría de consejos de administración, operaciones de compraventa de participaciones, due diligence legal y redacción y negociación de contratos mercantiles. Asistencia a clientes en litigios societarios y contractuales en coordinación con el área procesal.', 2);

INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p2, 'ISEIE Innovation School', 'Máster en Derecho Digital', 'Derecho Digital, Protección de Datos e Inteligencia Artificial', '2020-09-15', '2021-07-15', 1),
  (p2, 'Universidad española', 'Máster Universitario de Acceso a la Abogacía', 'Ejercicio de la Abogacía', '2014-09-15', '2016-06-15', 2),
  (p2, 'Universidad española', 'Grado en Derecho', 'Derecho', '2010-09-15', '2014-06-15', 3);

INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p2, 'Derecho mercantil y societario', 'EXPERT', 1),
  (p2, 'Contratación mercantil y tecnológica', 'EXPERT', 2),
  (p2, 'Reglamento Europeo de Inteligencia Artificial (AI Act)', 'ADVANCED', 3),
  (p2, 'Gobernanza y gestión del riesgo algorítmico', 'ADVANCED', 4),
  (p2, 'Protección de datos y RGPD', 'ADVANCED', 5),
  (p2, 'Responsabilidad por decisiones automatizadas', 'ADVANCED', 6),
  (p2, 'Pactos de socios y operaciones societarias', 'EXPERT', 7),
  (p2, 'Licencias de software y propiedad intelectual', 'ADVANCED', 8),
  (p2, 'Due diligence legal', 'ADVANCED', 9),
  (p2, 'Cumplimiento normativo (compliance)', 'ADVANCED', 10),
  (p2, 'Asesoramiento a startups tecnológicas', 'EXPERT', 11),
  (p2, 'Negociación contractual', 'ADVANCED', 12);

INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p2, 'Castellano', 'Native', true, 1),
  (p2, 'Inglés', 'C1', false, 2);

INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES
  (p2, 'Marco de Cumplimiento del AI Act para Empresas Tecnológicas', 'Metodología de adaptación al Reglamento Europeo de Inteligencia Artificial: clasificación de sistemas por nivel de riesgo, mapa de obligaciones aplicables, documentación técnica exigible y encaje con el RGPD.', 'PROJECT', ARRAY['AI Act','Compliance','Regulación'], 1),
  (p2, 'Modelo Contractual para Licencias de Software con IA', 'Articulado tipo para contratos de licencia y prestación de servicios sobre productos con componentes de inteligencia artificial: alcance de uso, propiedad de los datos de entrenamiento, garantías y reparto de responsabilidad.', 'PROJECT', ARRAY['Contratación','Propiedad Intelectual','IA'], 2),
  (p2, 'Programa de Gobernanza Algorítmica Corporativa', 'Diseño del gobierno interno de los sistemas automatizados: asignación de responsabilidad sobre las decisiones algorítmicas, trazabilidad, deberes de transparencia frente al usuario y protocolo de revisión.', 'PROJECT', ARRAY['Gobernanza','Riesgo Algorítmico','RGPD'], 3);

INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p2, 'Programa de especialización en Reglamento Europeo de IA', 'Formación continuada en derecho digital', 'CERTIFICATION', 100),
  (p2, 'Delegado de Protección de Datos (DPD)', 'Formación de especialización en protección de datos', 'CERTIFICATION', 101),
  (p2, 'Compliance penal corporativo', 'Formación de posgrado', 'CERTIFICATION', 102);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. CARLA CARRULLO · Sexología clínica · vertical "Sexología"
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Carla Carrullo',
  headline = 'Psicóloga sanitaria especializada en sexología clínica · Terapia de pareja y salud sexual',
  summary = 'Psicóloga sanitaria especializada en sexología clínica y terapia de pareja. Su consulta se centra en las dificultades sexuales que afectan al bienestar y a la vida en pareja: deseo sexual hipoactivo, dolor durante las relaciones, dificultades de excitación y de orgasmo, disfunción eréctil y eyaculación precoz, además del acompañamiento en las etapas vitales que modifican la sexualidad, como el posparto, la menopausia o la enfermedad crónica. Trabaja también con parejas en conflicto relacional, comunicación y gestión de acuerdos, y acompaña procesos de identidad y orientación sexual desde un enfoque afirmativo y libre de juicio. Su marco de trabajo combina la terapia cognitivo-conductual con el modelo sexológico clásico de reeducación y focalización sensorial, incorporando psicoeducación en todos los procesos: buena parte de las consultas mejoran cuando la persona recibe información veraz sobre el funcionamiento de la respuesta sexual y puede desmontar creencias erróneas interiorizadas. Dedica también parte de su actividad a la divulgación rigurosa en salud sexual, convencida de que la desinformación es uno de los principales factores de sufrimiento en este ámbito.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0052FF',
  location = 'Valencia, España', country_code = 'ES',
  slug = 'carla-carrullo', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Carla Carrullo · Psicóloga sanitaria · Sexología clínica y terapia de pareja',
  meta_description = 'Psicóloga sanitaria especializada en sexología clínica. Terapia de pareja, dificultades sexuales, salud sexual y acompañamiento afirmativo en identidad y orientación.'
WHERE id = p3;

INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p3, 'Consulta privada de psicología y sexología', 'Psicóloga sanitaria - Sexología clínica y terapia de pareja', '2019-09-15', NULL, true, 'Consulta propia de psicología sanitaria orientada a la sexología clínica. Evaluación y tratamiento de las principales dificultades sexuales en consulta individual y de pareja: deseo sexual hipoactivo, dolor coital, dificultades de excitación y orgasmo, disfunción eréctil y eyaculación precoz. Terapia de pareja centrada en la comunicación, el conflicto relacional y la negociación de acuerdos. Acompañamiento afirmativo en procesos de identidad y orientación sexual. Coordinación con ginecología, urología y medicina de familia cuando el cuadro tiene un componente orgánico que requiere valoración médica.', 1),
  (p3, 'Centro de psicología y terapia familiar', 'Psicóloga - Área de pareja y sexualidad', '2016-09-15', '2019-08-15', false, 'Atención psicológica en centro multidisciplinar dentro del área de pareja y sexualidad. Terapia individual y de pareja, diseño y conducción de talleres grupales de educación sexual y afectiva, y coordinación con el resto del equipo terapéutico del centro.', 2);

INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p3, 'Universidad española', 'Máster en Sexología Clínica y Terapia de Pareja', 'Sexología Clínica', '2017-09-15', '2018-07-15', 1),
  (p3, 'Universidad española', 'Máster en Psicología General Sanitaria', 'Psicología General Sanitaria', '2014-09-15', '2016-06-15', 2),
  (p3, 'Universidad española', 'Grado en Psicología', 'Psicología', '2010-09-15', '2014-06-15', 3);

INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p3, 'Sexología clínica', 'EXPERT', 1),
  (p3, 'Terapia de pareja', 'EXPERT', 2),
  (p3, 'Tratamiento del deseo sexual hipoactivo', 'EXPERT', 3),
  (p3, 'Dolor coital y dificultades de penetración', 'ADVANCED', 4),
  (p3, 'Disfunción eréctil y eyaculación precoz', 'ADVANCED', 5),
  (p3, 'Focalización sensorial y reeducación sexual', 'EXPERT', 6),
  (p3, 'Terapia cognitivo-conductual', 'EXPERT', 7),
  (p3, 'Psicoeducación en salud sexual', 'EXPERT', 8),
  (p3, 'Acompañamiento afirmativo en identidad y orientación', 'ADVANCED', 9),
  (p3, 'Sexualidad en posparto, menopausia y enfermedad crónica', 'ADVANCED', 10),
  (p3, 'Comunicación y negociación de acuerdos en pareja', 'ADVANCED', 11),
  (p3, 'Divulgación rigurosa en salud sexual', 'ADVANCED', 12);

INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p3, 'Castellano', 'Native', true, 1),
  (p3, 'Inglés', 'B2', false, 2);

INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES
  (p3, 'Programa de Terapia Sexual Breve para Parejas', 'Protocolo estructurado de intervención en dificultades sexuales de pareja, combinando terapia cognitivo-conductual, focalización sensorial y psicoeducación, con objetivos por sesión y evaluación de resultados.', 'PROJECT', ARRAY['Terapia de Pareja','Sexología','Protocolo Clínico'], 1),
  (p3, 'Talleres de Educación Sexual y Afectiva', 'Diseño e impartición de talleres grupales de educación sexual y afectiva, orientados a desmontar creencias erróneas sobre la respuesta sexual y a prevenir el sufrimiento derivado de la desinformación.', 'PROJECT', ARRAY['Educación Sexual','Talleres','Prevención'], 2),
  (p3, 'Guía de Salud Sexual en Posparto y Menopausia', 'Material de acompañamiento para las etapas vitales que modifican la sexualidad, con pautas de adaptación, señales que requieren valoración médica y criterios de derivación a ginecología.', 'PROJECT', ARRAY['Salud Sexual','Posparto','Menopausia'], 3);

INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p3, 'Terapia Sexual y Focalización Sensorial', 'Formación de especialización en sexología', 'CERTIFICATION', 100),
  (p3, 'Terapia de Pareja de Orientación Integradora', 'Formación de posgrado', 'CERTIFICATION', 101),
  (p3, 'Atención Afirmativa a la Diversidad Sexual y de Género', 'Formación continuada', 'CERTIFICATION', 102);

-- ═══════════════════════════════════════════════════════════════════════
-- 4. ANDRÉS ACOSTA · Psicología + IA · vertical "psychologist.ai"
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Andres Acosta',
  headline = 'Psychologist - Human-AI Interaction - Clinical oversight of mental health conversational assistants',
  summary = 'Psychologist whose career sits at the intersection of clinical practice and the design and supervision of conversational systems applied to mental health. The starting point is the consulting room: years of cognitive behavioural therapy with adults, working with anxiety, mood disorders, work-related stress and difficulties in emotional regulation. That clinical grounding is what underpins his second line of work, the supervision of conversational assistants for emotional support, where he handles the decisions that determine whether a tool of this kind helps or harms: designing the protocols for detecting suicide risk and for urgent referral to a human professional, setting explicit boundaries on what the system must not do, reviewing the tone and framing of its responses, and systematically evaluating the cases where the model exceeds its competence or reinforces a maladaptive belief held by the user. He holds a clear position on this ground: a conversational system can be useful as psychoeducational support, as companionship between sessions or as a first orienting contact, but it does not replace a therapeutic process, and any product that suggests otherwise creates real risk for the user. His profile is completed with training in research methodology and in the evaluation of psychological interventions.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0052FF',
  location = 'London, United Kingdom', country_code = 'GB',
  slug = 'andres-acosta', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Andres Acosta - Psychologist - Human-AI Interaction and Digital Mental Health',
  meta_description = 'Psychologist specialising in the clinical oversight of mental health conversational assistants: risk protocols, tool boundaries, referral to human professionals and evaluation of human-AI interaction.'
WHERE id = p4;

INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p4, 'Digital mental health projects', 'Psychologist - Clinical oversight of conversational assistants', '2022-06-15', NULL, true, 'Clinical supervision of AI-based conversational assistants for emotional support. Design of risk detection protocols covering suicidal ideation, self-harm, violence and acute decompensation, together with the escalation pathways to a human professional and to emergency services. Explicit definition of the boundaries of the tool and of the situations in which it must stop the conversation and refer. Systematic review of transcripts to detect responses that exceed the competence of the system, reinforce maladaptive beliefs or suggest a therapeutic bond that does not exist. Drafting of the disclosures and framing the user must receive about what the tool is and what it is not.', 1),
  (p4, 'Private psychology practice', 'Psychologist - Cognitive behavioural therapy with adults', '2017-01-15', NULL, true, 'Psychology practice with an adult population from a cognitive behavioural approach. Assessment and intervention in anxiety disorders, mood disorders, work-related stress and burnout, and difficulties in emotional regulation. Design of goal-based treatment plans, progress monitoring with standardised measures and relapse prevention work.', 2),
  (p4, 'Psychological care centre', 'Psychologist - Clinical team', '2014-09-15', '2016-12-15', false, 'Psychological care within a multidisciplinary team. Assessment, diagnosis and individual intervention, case coordination with the rest of the team and participation in group programmes for anxiety and stress management.', 3);

INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p4, 'UK university', 'MSc in Research Methods in Behavioural Sciences', 'Research Methods and Evaluation of Interventions', '2019-09-15', '2020-07-15', 1),
  (p4, 'UK university', 'MSc in Clinical Psychology', 'Clinical Psychology', '2012-09-15', '2014-06-15', 2),
  (p4, 'UK university', 'BSc (Hons) in Psychology', 'Psychology', '2008-09-15', '2012-06-15', 3);

INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p4, 'Cognitive behavioural therapy', 'EXPERT', 1),
  (p4, 'Assessment and intervention in anxiety and mood disorders', 'EXPERT', 2),
  (p4, 'Suicide risk detection and management protocols', 'EXPERT', 3),
  (p4, 'Clinical oversight of conversational assistants', 'ADVANCED', 4),
  (p4, 'Design of referral pathways to human professionals', 'ADVANCED', 5),
  (p4, 'Human-AI interaction in mental health', 'ADVANCED', 6),
  (p4, 'Defining boundaries and framing of digital tools', 'ADVANCED', 7),
  (p4, 'Emotional regulation', 'EXPERT', 8),
  (p4, 'Work-related stress and burnout', 'ADVANCED', 9),
  (p4, 'Assessment with standardised measures', 'ADVANCED', 10),
  (p4, 'Research methodology in behavioural sciences', 'ADVANCED', 11),
  (p4, 'Relapse prevention', 'ADVANCED', 12);

INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p4, 'English', 'Native', true, 1),
  (p4, 'Spanish', 'B2', false, 2);

INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES
  (p4, 'Risk Detection Protocol for Conversational Assistants', 'Detection and response system for suicidal ideation, self-harm, violence or acute decompensation in AI conversations, with escalation pathways to a human professional and to emergency services.', 'PROJECT', ARRAY['Suicide Risk','Digital Mental Health','Protocol'], 1),
  (p4, 'Ethical Boundaries Framework for AI in Mental Health', 'Explicit definition of what a conversational assistant must not do: the framing the user receives, prevention of a simulated therapeutic bond, and review of responses that reinforce maladaptive beliefs.', 'PROJECT', ARRAY['Ethics','AI','Mental Health'], 2),
  (p4, 'Anxiety and Work Stress Management Programme', 'Structured cognitive behavioural intervention for anxiety, work-related stress and burnout, with measurable goals, follow-up through standardised scales and a relapse prevention module.', 'PROJECT', ARRAY['CBT','Anxiety','Burnout'], 3);

INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p4, 'Suicide Prevention and Intervention', 'Specialist clinical training', 'CERTIFICATION', 100),
  (p4, 'Applied Cognitive Behavioural Therapy', 'Postgraduate training', 'CERTIFICATION', 101),
  (p4, 'Ethics and Digital Mental Health', 'Continuing professional development', 'CERTIFICATION', 102);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. URLs públicas previstas:
--      /cv/aryana-acevedo · /cv/leonardo-munoz
--      /cv/carla-carrullo · /cv/andres-acosta
-- 2. Sin avatar: no hay foto asociada a estos perfiles. Si se les asigna una,
--    NO usar fotografías de personas reales ni retratos generados que imiten
--    a alguien identificable.
-- 3. Todas las fechas en día 15 por el bug de formatDate() (ver la migración
--    de Aleix Mabres): con día 1 el mes se muestra retrasado en zonas UTC+X.
-- 4. degree y position llevan texto descriptivo largo a propósito: la plantilla
--    no renderiza field_of_study y la caché de traducción degrada los términos
--    de una sola palabra (ver notas de la migración de Arantxa Saiz).
-- 5. Las instituciones se dejan deliberadamente genéricas ("Universidad
--    española", "Despacho de abogados de ámbito mercantil"). Poner nombres
--    reales atribuiría titulaciones y contratos ficticios a centros existentes.
-- 6. Las certificaciones tampoco llevan emisor real por el mismo motivo, y
--    ninguna incluye número de credencial.
-- 7. job_seeking_status = 'NOT_LOOKING' en los cuatro: no son perfiles de
--    búsqueda de empleo y así no se muestra la tarjeta de disponibilidad.
-- ============================================================================
