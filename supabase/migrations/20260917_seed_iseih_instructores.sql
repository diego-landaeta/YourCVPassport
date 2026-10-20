-- ============================================================================
-- SEED: 3 instructores de ISEIH · Instituto Superior de Estudios Innovadores Holísticos
-- Date: 2026-09-17
-- Sources: fichas oficiales de iseih.com/instructores/
-- Template: passport
-- Brand color: #6B46C1 — morado secundario de iseih.com. Se descarta su morado
--              principal (#9333EA) porque queda casi idéntico al #720EEC de
--              Fono Aprende y al #6B21A8 de Adriana; #6B46C1 mantiene la
--              identidad morada de la marca y sigue siendo distinguible.
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
-- auth.users creados el 17/09/2026 con los UUID indicados abajo (@iseih.com)
--
-- ⚠️  ÁMBITOS NO REGULADOS. Dos de los tres perfiles trabajan en disciplinas
--     que en España NO son profesiones sanitarias regladas (naturopatía,
--     medicina tradicional china, hipnoterapia, PNI, coaching). El contenido
--     se redacta para reflejar con exactitud lo que cada uno es, sin sugerir
--     habilitación sanitaria que no existe. Ver notas al final.
-- ============================================================================

DO $$
DECLARE
  p1 CONSTANT UUID := '8bcf165f-77ca-494f-9fe3-74a0d61ff5b5';  -- Cintia A. Gutiérrez Peña
  p2 CONSTANT UUID := 'b539dad0-6b8f-41bf-ac0a-4f7d34292060';  -- David Sánchez Ibáñez
  p3 CONSTANT UUID := '8affd433-43ef-41ed-bac7-1c29255676ef';  -- Lola Hernández
BEGIN

DELETE FROM portfolio_items WHERE profile_id IN (p1, p2, p3);
DELETE FROM skills          WHERE profile_id IN (p1, p2, p3);
DELETE FROM languages       WHERE profile_id IN (p1, p2, p3);
DELETE FROM education       WHERE profile_id IN (p1, p2, p3);
DELETE FROM experiences     WHERE profile_id IN (p1, p2, p3);

-- ═══════════════════════════════════════════════════════════════════════
-- 1. CINTIA A. GUTIÉRREZ PEÑA · Psicología + Danza Movimiento Terapia
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Cintia A. Gutiérrez Peña',
  headline = 'Psicóloga y Danza Movimiento Terapeuta · Intervención corporal en TEA · Psicomotricidad infantil · Docente en ISEIH',
  summary = 'Psicóloga y danza movimiento terapeuta cuya práctica se sitúa en el cruce entre la psicología clínica y el trabajo con el cuerpo como vía de acceso a lo que la palabra no alcanza. Su formación de base es la Licenciatura en Psicología por la Universidad Autónoma de Ciudad Juárez (México), y su especialización llegó con la Maestría en Danza Movimiento Terapia por la Universitat Autònoma de Barcelona, una de las pocas formaciones universitarias de esta disciplina en el ámbito hispanohablante. Sobre esa base ha sumado posgrados en Psicología Clínica y Psicoterapia, en Arte y Cuerpo y en Pedagogía para el proceso creativo de las artes, además de formación en Somatic Experiencing, el abordaje del trauma desde la regulación corporal. Su trabajo clínico se ha centrado en la intervención con personas diagnosticadas de Trastorno del Espectro Autista, donde el movimiento ofrece un canal de comunicación y regulación que no depende del lenguaje verbal, y en la psicomotricidad infantil, que ejerce en Barcelona. Es una práctica que exige leer el cuerpo con la misma atención con la que otros leen el discurso: el ritmo, la tensión, la distancia y la calidad del movimiento como material de trabajo. Mantiene además una línea de investigación y producción académica poco habitual en este campo: es autora de la investigación "Danzando Salud", presentada en congresos internacionales de México, Brasil y Estados Unidos, y del artículo "Videodanza: territorio de movimiento y memorias", que explora el vídeo como soporte de la memoria corporal. En ISEIH dirige el Diplomado en Danza Terapia y Expresión Corporal, donde traslada esa doble mirada -la clínica y la artística- a la formación de otros profesionales.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#6B46C1',
  location = 'Barcelona, España', country_code = 'ES',
  slug = 'cintia-gutierrez', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Cintia A. Gutiérrez Peña · Psicóloga y Danza Movimiento Terapeuta · ISEIH',
  meta_description = 'Psicóloga y danza movimiento terapeuta con Maestría por la UAB. Intervención corporal con personas con TEA, psicomotricidad infantil y formación en Somatic Experiencing. Directora del Diplomado en Danza Terapia y Expresión Corporal de ISEIH.'
WHERE id = p1;

INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p1, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Docente - Diplomado en Danza Terapia y Expresión Corporal', '2026-01-15', NULL, true, 'Dirección e impartición del Diplomado en Danza Terapia y Expresión Corporal de ISEIH. Diseño de los contenidos sobre fundamentos de la danza movimiento terapia, lectura del movimiento, encuadre de la sesión y aplicación a poblaciones específicas, con especial atención al trabajo con personas con Trastorno del Espectro Autista.', 1),
  (p1, 'Práctica clínica en danza movimiento terapia', 'Danza Movimiento Terapeuta - Intervención en TEA', '2018-01-15', NULL, true, 'Intervención con personas diagnosticadas de Trastorno del Espectro Autista a través del movimiento como canal de comunicación y regulación no verbal. Trabajo sobre el ritmo, la tensión corporal, la distancia interpersonal y la calidad del movimiento, con encuadre terapéutico y objetivos individualizados por persona.', 2),
  (p1, 'Centros de atención infantil (Barcelona)', 'Monitora de psicomotricidad infantil', '2016-09-15', NULL, true, 'Sesiones de psicomotricidad con población infantil en Barcelona: desarrollo del esquema corporal, regulación, juego motor y expresión, acompañando el desarrollo psicomotor desde la observación del movimiento espontáneo del niño.', 3);

INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p1, 'Universitat Autònoma de Barcelona', 'Maestría en Danza Movimiento Terapia', 'Danza Movimiento Terapia', '2015-09-15', '2017-07-15', 1),
  (p1, 'Formación de posgrado', 'Posgrado en Psicología Clínica y Psicoterapia', 'Psicología Clínica y Psicoterapia', '2013-09-15', '2014-07-15', 2),
  (p1, 'Universidad Autónoma de Ciudad Juárez (México)', 'Licenciatura en Psicología', 'Psicología', '2007-09-15', '2012-06-15', 3);

INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p1, 'Danza Movimiento Terapia', 'EXPERT', 1),
  (p1, 'Intervención corporal en Trastorno del Espectro Autista', 'EXPERT', 2),
  (p1, 'Psicomotricidad infantil', 'EXPERT', 3),
  (p1, 'Psicoterapia', 'ADVANCED', 4),
  (p1, 'Somatic Experiencing y abordaje corporal del trauma', 'ADVANCED', 5),
  (p1, 'Expresión corporal', 'EXPERT', 6),
  (p1, 'Lectura y análisis del movimiento', 'EXPERT', 7),
  (p1, 'Comunicación no verbal', 'EXPERT', 8),
  (p1, 'Arte y cuerpo aplicados a la terapia', 'ADVANCED', 9),
  (p1, 'Pedagogía del proceso creativo', 'ADVANCED', 10),
  (p1, 'Investigación y comunicación en congresos', 'ADVANCED', 11),
  (p1, 'Videodanza', 'ADVANCED', 12),
  (p1, 'Docencia y formación de profesionales', 'ADVANCED', 13);

INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p1, 'Castellano', 'Native', true, 1);

INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES
  (p1, 'Investigación "Danzando Salud"', 'Investigación propia sobre danza y salud, presentada en congresos internacionales de México, Brasil y Estados Unidos.', 'PROJECT', ARRAY['Investigación','Danza Terapia','Congresos'], 1),
  (p1, 'Artículo "Videodanza: territorio de movimiento y memorias"', 'Publicación que explora la videodanza como soporte de la memoria corporal y como herramienta de trabajo expresivo.', 'PROJECT', ARRAY['Publicación','Videodanza','Memoria Corporal'], 2),
  (p1, 'Diplomado en Danza Terapia y Expresión Corporal', 'Programa de ISEIH que dirige: fundamentos de la danza movimiento terapia, lectura del movimiento, encuadre de sesión y aplicación a poblaciones específicas.', 'PROJECT', ARRAY['Formación','Danza Terapia','Diplomado'], 3);

INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p1, 'Formación en Somatic Experiencing', 'Abordaje corporal del trauma · formación especializada', 'CERTIFICATION', 100),
  (p1, 'Posgrado en Arte y Cuerpo', 'Formación de posgrado', 'CERTIFICATION', 101),
  (p1, 'Posgrado en Pedagogía para el Proceso Creativo de las Artes', 'Formación de posgrado', 'CERTIFICATION', 102);

-- ═══════════════════════════════════════════════════════════════════════
-- 2. DAVID SÁNCHEZ IBÁÑEZ · Naturopatía, MTC y dirección de centros
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'David Sánchez Ibáñez',
  headline = 'Naturópata y practicante de Medicina Tradicional China · Director de centro y grupo empresarial · Docente en ISEIH',
  summary = 'Naturópata y practicante de Medicina Tradicional China con una trayectoria que combina la consulta con la dirección de empresas: más de veinticuatro años al frente de equipos y proyectos en el sector del bienestar. Desde 2010 dirige el David Centre de Massatges i Teràpies en Vilanova i la Geltrú, y desde 2012 es Director General del Grupo Obbarahouse, responsabilidad que suma a su práctica la gestión de estructura, equipos y desarrollo de negocio. Su formación se ha construido sobre disciplinas del ámbito de las terapias naturales y complementarias: Diploma en Medicina Tradicional China por el Beijing International Acupuncture Training Center, Diploma de Calidad en MTCI otorgado por la Fundación Europea de Medicina Tradicional China, Diplomado en Hipnoterapia y sus Aplicaciones por EUDES Universitas, y Técnico en Masaje y Terapias Alternativas por Kinetena, además de formación en osteopatía china, acupuntura, posturología, hipnosis y programación neurolingüística. A ello suma un Título Universitario en Adicciones por la Universidad Antonio de Nebrija, la única de sus titulaciones de procedencia universitaria. Está inscrito como naturópata con el registro nº 1348-048 y como practicante de Medicina Tradicional China con el nº 1161-12913, ambos de entidades asociativas del sector, y figura en la Federación y Sociedad de Medicina Tradicional China y en el Observatorio de Medicina Tradicional China y Acupuntura. Ejerce también como mentor y tutor de prácticas acreditado en centros de formación, una faceta que le ha llevado de forma natural a la docencia: en ISEIH dirige el Máster en Naturopatía Clínica y Medicina Biológica Integral y el Máster en Coaching Holístico y Life Coaching.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#6B46C1',
  location = 'Vilanova i la Geltrú, Barcelona, España', country_code = 'ES',
  slug = 'david-sanchez-ibanez', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'David Sánchez Ibáñez · Naturopatía y Medicina Tradicional China · ISEIH',
  meta_description = 'Naturópata y practicante de Medicina Tradicional China. Director del David Centre de Massatges i Teràpies desde 2010 y del Grupo Obbarahouse desde 2012. Director del Máster en Naturopatía Clínica y del Máster en Coaching Holístico de ISEIH.'
WHERE id = p2;

INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p2, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Docente - Naturopatía Clínica y Coaching Holístico', '2026-01-15', NULL, true, 'Dirección e impartición de dos programas de ISEIH: el Máster en Naturopatía Clínica y Medicina Biológica Integral y el Máster en Coaching Holístico y Life Coaching. Diseño de contenidos y acompañamiento del alumnado, apoyado en su experiencia previa como mentor y tutor de prácticas acreditado en centros de formación.', 1),
  (p2, 'Grupo Obbarahouse', 'Director General', '2012-01-15', NULL, true, 'Dirección general del Grupo Obbarahouse desde 2012: estrategia, gestión de equipos, estructura organizativa y desarrollo de negocio. Responsabilidad ejecutiva sobre la marcha del grupo, que compagina con la actividad de consulta y con la docencia.', 2),
  (p2, 'David Centre de Massatges i Teràpies', 'Director y terapeuta', '2010-01-15', NULL, true, 'Fundación y dirección del centro en Vilanova i la Geltrú desde 2010. Consulta de naturopatía y Medicina Tradicional China, con técnicas de acupuntura, osteopatía china, masaje, posturología e hipnosis. Organización del centro, del equipo y de la relación con los clientes, además de la acogida de alumnado en prácticas como centro formador.', 3);

INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p2, 'Universidad Antonio de Nebrija', 'Título Universitario en Adicciones', 'Adicciones', '2018-09-15', '2019-07-15', 1),
  (p2, 'Beijing International Acupuncture Training Center', 'Diploma en Medicina Tradicional China', 'Medicina Tradicional China y Acupuntura', '2012-01-15', '2013-06-15', 2),
  (p2, 'EUDES Universitas', 'Diplomado en Hipnoterapia y sus Aplicaciones', 'Hipnoterapia', '2014-09-15', '2015-06-15', 3),
  (p2, 'Kinetena', 'Técnico en Masaje y Terapias Alternativas', 'Masaje y Terapias Manuales', '2008-09-15', '2010-06-15', 4);

INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p2, 'Naturopatía', 'EXPERT', 1),
  (p2, 'Medicina Tradicional China', 'EXPERT', 2),
  (p2, 'Acupuntura', 'EXPERT', 3),
  (p2, 'Osteopatía china', 'ADVANCED', 4),
  (p2, 'Masaje y terapias manuales', 'EXPERT', 5),
  (p2, 'Posturología', 'ADVANCED', 6),
  (p2, 'Hipnosis y hipnoterapia', 'ADVANCED', 7),
  (p2, 'Programación neurolingüística (PNL)', 'ADVANCED', 8),
  (p2, 'Coaching holístico y life coaching', 'EXPERT', 9),
  (p2, 'Abordaje de las adicciones', 'ADVANCED', 10),
  (p2, 'Dirección de centros y equipos', 'EXPERT', 11),
  (p2, 'Dirección general y desarrollo de negocio', 'EXPERT', 12),
  (p2, 'Mentoría y tutorización de prácticas', 'ADVANCED', 13),
  (p2, 'Docencia y formación de profesionales', 'ADVANCED', 14);

INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p2, 'Castellano', 'Native', true, 1),
  (p2, 'Catalán', 'Native', true, 2);

INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES
  (p2, 'Máster en Naturopatía Clínica y Medicina Biológica Integral', 'Programa de ISEIH que dirige, centrado en el abordaje naturopático y en los fundamentos de la medicina biológica integral.', 'PROJECT', ARRAY['Naturopatía','Máster','Formación'], 1),
  (p2, 'Máster en Coaching Holístico y Life Coaching', 'Programa de ISEIH que dirige, orientado al acompañamiento de procesos de cambio personal desde una perspectiva integradora.', 'PROJECT', ARRAY['Coaching','Máster','Formación'], 2),
  (p2, 'David Centre de Massatges i Teràpies', 'Centro propio en Vilanova i la Geltrú desde 2010, con consulta de naturopatía y Medicina Tradicional China y acogida de alumnado en prácticas.', 'PROJECT', ARRAY['Centro Propio','MTC','Prácticas'], 3);

INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p2, 'Registro de Naturópata nº 1348-048', 'Registro de entidad asociativa del sector (no colegiación sanitaria oficial)', 'CERTIFICATION', 100),
  (p2, 'Registro de Practicante en Medicina Tradicional China nº 1161-12913', 'Registro de entidad asociativa del sector (no colegiación sanitaria oficial)', 'CERTIFICATION', 101),
  (p2, 'Diploma de Calidad en MTCI', 'Fundación Europea de Medicina Tradicional China', 'CERTIFICATION', 102),
  (p2, 'Miembro de la Federación y Sociedad de Medicina Tradicional China', 'Federación y Sociedad de Medicina Tradicional China', 'CERTIFICATION', 103),
  (p2, 'Miembro del Observatorio de Medicina Tradicional China y Acupuntura', 'Observatorio de Medicina Tradicional China y Acupuntura', 'CERTIFICATION', 104),
  (p2, 'Mentor de prácticas acreditado', 'Acreditación como centro y mentor de prácticas formativas', 'CERTIFICATION', 105);

-- ═══════════════════════════════════════════════════════════════════════
-- 3. LOLA HERNÁNDEZ · Dietética y Psiconeuroinmunología
-- ═══════════════════════════════════════════════════════════════════════
UPDATE profiles SET
  full_name = 'Lola Hernández',
  headline = 'Técnico Superior en Dietética · Asesoramiento nutricional con enfoque en Psiconeuroinmunología · Docente en ISEIH',
  summary = 'Técnico Superior en Dietética con una orientación muy definida hacia la psiconeuroinmunología, el enfoque que estudia cómo se relacionan el sistema nervioso, el inmunitario y el endocrino, y cómo la alimentación y los hábitos influyen en ese equilibrio. Ejerce desde 2021 en su propia consulta, NutriPsicoSalud, donde acompaña procesos de cambio de hábitos alimentarios atendiendo al contexto completo de la persona: descanso, estrés, ritmo de vida y sintomatología digestiva. Su formación posterior al título oficial se ha dirigido por entero a esa especialización: Máster en Nutrición Clínica Avanzada y especialización en Psiconeuroinmunología, ambos por la Fundación Vivo Sano, formación en salud cronobiológica por ESI, y cursos específicos en fitoterapia del aparato digestivo, trastornos del sueño, ansiedad y estrés, y salud hormonal femenina y suplementación. Las áreas en las que concentra su trabajo son el metabolismo y la composición corporal, la salud digestiva, el soporte al sistema inmunitario, la regulación hormonal femenina y la relación entre alimentación y salud mental. Su método parte de una idea sencilla: un cambio de hábitos sostenible se construye sobre la comprensión de por qué se come como se come, y no sobre una pauta cerrada que la persona no puede mantener. En ISEIH imparte tres programas -el Máster en Psiconeuroinmunoendocrinología Integrativa, el Diplomado en Nutrición Natural y Salud Integrativa y el Curso en Coaching Nutricional y Cambio de Hábitos- y divulga sobre nutrición y PNI a través de su proyecto NutriPsicoSalud.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#6B46C1',
  location = 'España', country_code = 'ES',
  slug = 'lola-hernandez', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Lola Hernández · Dietética y Psiconeuroinmunología · NutriPsicoSalud · ISEIH',
  meta_description = 'Técnico Superior en Dietética especializada en psiconeuroinmunología. Asesoramiento nutricional en salud digestiva, metabolismo, regulación hormonal femenina y cambio de hábitos. Docente del Máster en PNIE de ISEIH.',
  portfolio_url = 'https://nutripsicosalud.es'
WHERE id = p3;

INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p3, 'ISEIH - Instituto Superior de Estudios Innovadores Holísticos', 'Docente - PNIE, nutrición natural y coaching nutricional', '2026-01-15', NULL, true, 'Impartición de tres programas de ISEIH: el Máster en Psiconeuroinmunoendocrinología Integrativa, el Diplomado en Nutrición Natural y Salud Integrativa y el Curso en Coaching Nutricional y Cambio de Hábitos. Diseño de contenidos sobre la relación entre alimentación, descanso, estrés y regulación hormonal, y sobre las herramientas de acompañamiento en el cambio de hábitos.', 1),
  (p3, 'NutriPsicoSalud', 'Consulta propia - Asesoramiento nutricional con enfoque PNI', '2021-01-15', NULL, true, 'Consulta propia de asesoramiento nutricional desde 2021, con enfoque de psiconeuroinmunología. Acompañamiento en procesos de cambio de hábitos alimentarios atendiendo al contexto completo de la persona: descanso, estrés, ritmo de vida y sintomatología digestiva. Áreas principales de trabajo: metabolismo y composición corporal, salud digestiva, soporte inmunitario, regulación hormonal femenina y relación entre alimentación y salud mental. Divulgación sobre nutrición y PNI a través del propio proyecto.', 2);

INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p3, 'Fundación Vivo Sano', 'Máster en Nutrición Clínica Avanzada', 'Nutrición Clínica', '2021-09-15', '2022-07-15', 1),
  (p3, 'Formación profesional de grado superior', 'Técnico Superior en Dietética', 'Dietética y Nutrición', '2018-09-15', '2020-06-15', 2);

INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p3, 'Psiconeuroinmunología (PNI) aplicada a la nutrición', 'EXPERT', 1),
  (p3, 'Asesoramiento nutricional y planificación dietética', 'EXPERT', 2),
  (p3, 'Salud digestiva', 'EXPERT', 3),
  (p3, 'Metabolismo y composición corporal', 'ADVANCED', 4),
  (p3, 'Regulación hormonal femenina y salud de la mujer', 'ADVANCED', 5),
  (p3, 'Soporte al sistema inmunitario', 'ADVANCED', 6),
  (p3, 'Salud cronobiológica y descanso', 'ADVANCED', 7),
  (p3, 'Fitoterapia del aparato digestivo', 'ADVANCED', 8),
  (p3, 'Suplementación', 'ADVANCED', 9),
  (p3, 'Alimentación y salud mental', 'ADVANCED', 10),
  (p3, 'Coaching nutricional y cambio de hábitos', 'EXPERT', 11),
  (p3, 'Divulgación en nutrición y salud integrativa', 'ADVANCED', 12);

INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p3, 'Castellano', 'Native', true, 1);

INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, sort_order) VALUES
  (p3, 'NutriPsicoSalud', 'Consulta y proyecto divulgativo propio sobre nutrición con enfoque de psiconeuroinmunología, activo desde 2021.', 'PROJECT', 'https://nutripsicosalud.es', ARRAY['Consulta Propia','PNI','Divulgación'], 1),
  (p3, 'Máster en Psiconeuroinmunoendocrinología Integrativa (PNIE)', 'Programa de ISEIH en el que imparte docencia, sobre la relación entre los sistemas nervioso, inmunitario y endocrino y su abordaje desde la alimentación y los hábitos.', 'PROJECT', NULL, ARRAY['PNIE','Máster','Formación'], 2),
  (p3, 'Diplomado en Nutrición Natural y Salud Integrativa', 'Programa de ISEIH centrado en alimentación natural y en un abordaje integrativo de la salud.', 'PROJECT', NULL, ARRAY['Nutrición','Diplomado','Formación'], 3),
  (p3, 'Curso en Coaching Nutricional y Cambio de Hábitos', 'Programa de ISEIH sobre las herramientas de acompañamiento que hacen sostenible un cambio de hábitos alimentarios.', 'PROJECT', NULL, ARRAY['Coaching Nutricional','Hábitos','Curso'], 4);

INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p3, 'Especialización en Psiconeuroinmunología (PNI)', 'Fundación Vivo Sano', 'CERTIFICATION', 100),
  (p3, 'Especialización en Salud Cronobiológica', 'ESI', 'CERTIFICATION', 101),
  (p3, 'Fitoterapia del Aparato Digestivo', 'Formación especializada', 'CERTIFICATION', 102),
  (p3, 'Trastornos del Sueño, Ansiedad y Estrés', 'Formación especializada', 'CERTIFICATION', 103),
  (p3, 'Salud de la Mujer y Suplementación', 'Formación especializada', 'CERTIFICATION', 104);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. URLs: /cv/cintia-gutierrez · /cv/david-sanchez-ibanez · /cv/lola-hernandez
--    Fotos tomadas de sus fichas oficiales de iseih.com y subidas al bucket.
--
-- 2. ⚠️  DAVID SÁNCHEZ: sus dos números de registro (naturópata 1348-048 y
--    practicante de MTC 1161-12913) se publican identificando que proceden de
--    ENTIDADES ASOCIATIVAS DEL SECTOR, no de un colegio profesional. En España
--    ni la naturopatía ni la MTC son profesiones sanitarias regladas, y un
--    número suelto junto a un perfil de salud se lee como colegiación oficial
--    (compárese con la colegiada 39/0285L de Sara Martínez, que sí lo es).
--    NO retirar esa aclaración del campo issuer.
--
-- 3. ⚠️  LOLA HERNÁNDEZ: su ficha de ISEIH la denomina "dietista-nutricionista",
--    pero su titulación es Técnico en Nutrición y Dietética (FP). En España
--    "dietista-nutricionista" es profesión sanitaria regulada que exige el
--    Grado en Nutrición Humana y Dietética, de modo que usar ese título sin el
--    grado constituiría intrusismo. Se publica como "Técnico Superior en
--    Dietética" y su actividad se describe como ASESORAMIENTO NUTRICIONAL, no
--    como acto clínico ni diagnóstico. Su ficha menciona además formación en
--    "diagnóstico y análisis clínico": no se recoge como competencia, porque
--    un técnico en dietética no diagnostica. Si ISEIH pide revertirlo, hay que
--    hablarlo antes: el riesgo recae sobre ella.
--
-- 4. FECHAS ESTIMADAS. Las fichas de ISEIH no aportan casi ninguna fecha.
--    Confirmadas: David en su centro desde 2010 y en Obbarahouse desde 2012;
--    Lola en consulta desde 2021. Todo lo demás es reconstrucción coherente
--    con la antigüedad declarada y debe validarse con cada uno:
--      · Cintia: licenciatura 2007-2012, posgrado 2013-2014, maestría UAB
--        2015-2017, psicomotricidad desde 2016, danzaterapia desde 2018
--      · David: Kinetena 2008-2010, MTC Beijing 2012-2013, hipnoterapia
--        2014-2015, Nebrija 2018-2019
--      · Lola: FP 2018-2020, máster Vivo Sano 2021-2022
--      · Docencia en ISEIH: 01/2026 para los tres (sin fecha en la fuente)
--
-- 5. Ninguna de las fichas declara idiomas. Sólo se carga castellano, y catalán
--    en David por ejercer en Vilanova i la Geltrú con centro de nombre catalán.
--    Pendiente de confirmar con ellos.
--
-- 6. Lola no tiene ciudad en su ficha: location queda como 'España' hasta saberla.
--
-- 7. Fechas en día 15 por el bug de formatDate() (ver migración de Aleix).
-- 8. degree y position con texto descriptivo largo a propósito: la plantilla no
--    renderiza field_of_study y la caché de traducción degrada los términos de
--    una sola palabra (ver notas de la migración de Arantxa Saiz).
-- ============================================================================
