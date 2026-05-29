-- ============================================================================
-- SEED: 19 Directores Académicos ISEIE Innovation School
-- Date: 2026-05-19
-- Source: https://iseie.com/wp-json/iseie/v1/directores
-- Template: passport (mismo que el resto de tutores del proyecto, p.ej. seed PsikoAprende)
-- Brand color: #1E40AF (ISEIE navy blue) — diferencia visual frente a otros tutores
--              (PsikoAprende usa #0D9488 teal)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- ⚠️  PRE-REQUISITE: Create 19 auth.users in Supabase Dashboard BEFORE running this script.
--                   Replace placeholder UUIDs (p1..p19) below with the real Supabase auth.user IDs.
--                   Suggested emails: <slug>@iseie.com  (e.g., ramon.miralles@iseie.com)
-- ============================================================================

DO $$
DECLARE
  -- ⚠️  REPLACE these placeholder UUIDs with real Supabase auth.user IDs after creating users in Dashboard.
  -- Derecho
  p1  CONSTANT UUID := 'f8a1e55a-1572-4d3f-9348-9989af3c4061';  -- Ramón Miralles López
  -- Educación
  p2  CONSTANT UUID := '2d6f13da-5ce5-4c29-8b46-f96f577bb3ac';  -- Mildreth Plata López
  -- Medicina
  p3  CONSTANT UUID := '2933f409-0bbf-4d19-8074-cfc7ba1cdfc6';  -- Alberto Jurado Arévalo
  p4  CONSTANT UUID := 'e53fb6d7-0cec-4e45-830c-f6fb3c3f6a75';  -- Cristina Moreno Martín
  p5  CONSTANT UUID := '5f59379c-da7b-4b91-94f1-f6d32499ba98';  -- Irene Pulido García
  p6  CONSTANT UUID := '1589aaa2-3e85-4cd5-a52e-50907c6a3453';  -- Elena María Granados Alarcón
  p7  CONSTANT UUID := 'aa6ef41d-520a-4466-9f79-04ef64f0d9a0';  -- Iria Graña Somoza
  p8  CONSTANT UUID := 'bcb0d8df-f0c0-4bc0-a557-fb29275af6f1';  -- Julia Bovis Benavides
  p9  CONSTANT UUID := '33b59635-78af-44da-ba87-3bf11658f84f';  -- Lidia Isabel de Sus Martínez
  p10 CONSTANT UUID := 'f3089b0f-d898-42b7-87ce-dd2a7c3c2737';  -- Luz Marina Zuluaga Ríos
  p11 CONSTANT UUID := '96014025-0a05-4e22-9a53-a987091e8c37';  -- María Dolores Flores Romero
  p12 CONSTANT UUID := '45430e9a-f744-40da-a202-4891bfd05265';  -- María Pedreira Pernas
  p13 CONSTANT UUID := '15d74abe-2d51-4000-8325-631ca23c7763';  -- Miguel Ángel Vega Maqueda
  p14 CONSTANT UUID := '1201690c-2df1-4fc5-b740-f5c2b57bb52c';  -- Rosa Inmaculada Monje López
  p15 CONSTANT UUID := '50203956-3ebc-4980-8cf3-f8a4c247f983';  -- Rubén Broncano Martínez
  p16 CONSTANT UUID := '69a488bc-d49f-4371-ae6f-9382636aaf4d';  -- Susana Lucas Ballesteros
  p17 CONSTANT UUID := '7d9d4550-2232-4de9-a834-22826a7fbfef';  -- Yacnira Loreleis Martínez Bazán
  -- Odontología
  p18 CONSTANT UUID := 'b3087edc-df7d-4f68-bdaa-3345be01957d';  -- María Josep Albert López
  p19 CONSTANT UUID := '2e36dffa-ea8c-4c46-9046-734a6e7b601f';  -- Luis David Romero García

BEGIN

-- STAGE 1: AUTH.USERS — Created manually via Supabase Dashboard
-- Users already exist (created by admin), skip to profile updates.

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: PROFILES
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Ramón Miralles López (Derecho)
UPDATE profiles SET
  full_name = 'Ramón Miralles López',
  headline = 'Socio en ECIJA · Privacidad, Ciberseguridad y Compliance Digital',
  summary = 'Socio de Privacidad, Ciberseguridad y Corporate Compliance en ECIJA Barcelona desde mayo 2024, con más de 35 años de experiencia continuada en el sector de las Tecnologías de la Información y la Comunicación (TIC). Su trayectoria reúne una combinación poco habitual: profundo background técnico en TIC + especialización jurídica en privacidad, ciberseguridad y compliance digital. Antes de incorporarse a ECIJA, fue durante 6 años Socio Director de ECIX GROUP Cataluña y Abogado Especialista en Privacidad, Riesgo y Ciberseguridad / LegalTech / Ciberderecho (abr 2018 - may 2024), donde dirigió la oficina de ECIX en Barcelona, diseñó nuevas líneas de negocio y metodologías de trabajo, y estructuró equipos especializados. El núcleo institucional de su trayectoria son los 14 años 7 meses como Coordinador d''Auditoria i Seguretat de la Informació en la Autoritat Catalana de Protecció de Dades (APDCAT) entre octubre 2003 y abril 2018, donde diseñó y coordinó la ejecución de los Planes de Auditoría de la Agencia, ejerció actuación preventiva en materia de protección de datos personales, dio soporte a inspecciones y proporcionó soporte técnico en seguridad de la información a todas las áreas. Su carrera previa en el sector público y privado de las TIC incluye: Responsable del Departamento de Tecnología del Ajuntament de Barcelona (2002-2003); Responsable de Consultoría en Secartys / División de e-security de GyD Ibérica (2001-2002); Responsable de Aseguramiento de la Información en el CTTI - Centre de Telecomunicacions i Tecnologies de la Informació de la Generalitat de Catalunya (1999-2001), donde implantó infraestructuras de clave pública, certificados digitales y firma electrónica para la administración electrónica catalana; 11 años en la Generalitat de Catalunya (1988-1998) como Responsable de la Unitat de Mitjans Informàtics de Difussió d''Informació (gencat.cat), Responsable de l''Àrea de Videotex y Responsable del Gabinet d''Informàtica Judicial (proyecto PRAOJ de informatización de oficinas judiciales); y sus inicios como Implantador d''Aplicacions Judicials en SEINTEX, S.A. desde 1985. Fue Vocal de la Comisión de Transformación Digital del Il·lustre Col·legi de l''Advocacia de Barcelona (ICAB) entre febrero 2018 y junio 2020. En el plano docente compagina su práctica jurídica con dos roles universitarios activos: Profesor del Curso Superior de Delegado en Protección de Datos del Instituto Universitario de Investigación Ortega y Gasset (IUIOG) desde octubre 2018, y Docente invitado del módulo "Derecho de las TIC" en el Máster en Propiedad Intelectual e Industrial de OBS Business School desde octubre 2015 (10+ años). Su práctica jurídica actual cubre asesoramiento a empresas tecnológicas en adaptación al Reglamento General de Protección de Datos (RGPD), normativa europea de servicios digitales (DSA, DMA), regulación europea sobre inteligencia artificial (AI Act), directivas de ciberseguridad NIS2 y DORA, compliance penal corporativo y estándares ESG digital. En ISEIE Innovation School dirige el Máster en Derecho Digital.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Barcelona, Cataluña, España', country_code = 'ES',
  slug = 'ramon-miralles', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Socio ECIJA Barcelona · +35 años en TIC · Ex-APDCAT 15 años · Profesor IUIOG y OBS · ISEIE',
  meta_description = 'Socio de Privacidad, Ciberseguridad y Corporate Compliance en ECIJA Barcelona. +35 años en el sector TIC. 15 años como Coordinador d''Auditoria i Seguretat de la Informació en APDCAT. Profesor del Instituto Ortega y Gasset y OBS Business School. Director del Máster en Derecho Digital de ISEIE Innovation School.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2025/10/Ramon-Miralles-Lopez.webp',
  linkedin_url = 'https://www.linkedin.com/in/ramonmiralles'
WHERE id = p1;

-- 2. Mildreth Plata López (Educación)
UPDATE profiles SET
  full_name = 'Dra. Mildreth Plata López',
  headline = 'Doctora en Educación (Cum Laude, Universitat Jaume I) · Directora Facultad de Educación ISEIE Innovation School · Fundadora de MildrethTech · Innovadora en EdTech',
  summary = 'Doctora en Educación por la Universitat Jaume I de Castellón, con calificación Sobresaliente Cum Laude (marzo 2023). Su tesis doctoral, "Aprendizaje servicio basado en el arte: estudio de caso para la transformación social", se desarrolló dentro del Grupo de Investigación MEICRI de la UJI. Posteriormente continuó su trayectoria académica como Investigadora Postdoctoral en la misma universidad (mayo 2023 - julio 2025). Su formación universitaria reúne cinco titulaciones: Doctorado en Educación (UJI), Máster Avanzado en Educación Primaria por la Universidad Complutense de Madrid (2012-2015), Magíster en Administración y Supervisión Educativa por la Universidad Externado de Colombia (1999-2001), Especialización en Informática para la Gestión del Talento Humano y Edumática (2001-2003) y Licenciatura en Básica Primaria con énfasis en Estética por UNIMINUTO Colombia (1992-1996). Cuenta además con certificación de Labora - Servicio Valenciano para el Empleo en Dinamización de Proyectos Culturales (520 horas). Su trayectoria docente abarca más de 30 años entre Colombia y España: desde 1992 ejerció como profesora de primaria, artes plásticas e informática en Bogotá (Colegio Agustiniano, Corporación Educativa ASED, Secretaría de Educación Distrital), donde llegó a ser Directora y Orientadora de un centro educativo de jóvenes y adultos. En España ha desarrollado su trayectoria académica e investigadora en la Universitat Jaume I y en proyectos formativos para el cierre de la brecha digital. Es Fundadora de MildrethTech, proyecto propio donde combina inteligencia artificial y educación. Compatibiliza la dirección académica en ISEIE Innovation School con su rol como Formadora en la Brecha Digital en ILUNION (Castellón, desde septiembre 2025) y como Profesora y Formadora Técnica en Brecha Digital en Adecco (desde mayo 2024). Como Directora de la Facultad de Educación de ISEIE Innovation School supervisa cuatro programas: Máster en Tecnología Educativa, Máster en Innovación Educativa, Diplomado en Innovación Educativa y Curso de Tecnologías Educativas.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Castellón, Comunidad Valenciana, España', country_code = 'ES',
  slug = 'mildreth-plata', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Doctora en Educación (Cum Laude UJI) · Directora ISEIE · MildrethTech',
  meta_description = 'Doctora en Educación Cum Laude (Universitat Jaume I). Investigadora Postdoctoral. 5 titulaciones universitarias. 30+ años de docencia entre Colombia y España. Fundadora de MildrethTech. Directora de la Facultad de Educación de ISEIE Innovation School.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/02/foto-corporativa.webp',
  linkedin_url = 'https://www.linkedin.com/in/mildreth-plata-lópez'
WHERE id = p2;

-- 3. Alberto Jurado Arévalo (Medicina)
UPDATE profiles SET
  full_name = 'Alberto Jurado Arévalo',
  headline = 'Médico Psiquiatra (Hospital Universitario de Jaén) · Director Médico ADVAN HAIR - Advanced Hair Institute · Docente UNIR · Profesor ISEIE Innovation School',
  summary = 'Médico Psiquiatra en el Hospital Universitario de Jaén (Servicio Andaluz de Salud) tras completar su Especialidad MIR de Psiquiatría en el SAS (julio 2021 - julio 2025, 4 años). Graduado en Medicina por la Universitat Autònoma de Barcelona (UAB, 2011-2017). Su trayectoria profesional se construye sobre una base previa de más de 16 años como enfermero en hospitales y servicios sanitarios públicos: Diplomado Universitario en Enfermería por la Universidad de Huelva (2005-2008), con experiencia como enfermero en el Hospital Universitario Gregorio Marañón (Urgencias y Onco-Hematología), Hospital Carlos III (UCI/Reanimación y Medicina Interna), Empresa Pública Hospital Alto Guadalquivir, SESCAM Hospital La Mancha Centro (UCI y Reanimación) y Servicio Andaluz de Salud en Dispositivos de Cuidados Críticos y Urgencias (DCCU). Su formación de posgrado es extensa: Máster en Dirección y Gestión Sanitaria por UNIR (2023), Máster en Psicoterapia - Terapias de Tercera Generación por UNIR (2024), Máster of Science en Valoración Médica del Daño Corporal por ediae / Universidad de Granada (2024-2025), Máster en Tricología y Cirugía Capilar y Máster en Medicina Estética por UDIMA (2019-2020), Máster de Urgencias, Emergencias y Catástrofes por la Universidad CEU Cardenal Herrera (2021), Máster en Urgencias, Emergencias y Cuidados Críticos por la Universidad Europea (2009-2010), Cualificación Universitaria en Misiones HEMS (Helicopter Emergency Medical Services) por la Universidad de Zaragoza (2012) y Experto en Prescripción Enfermera por la Escuela de Ciencias de la Salud de la UCM (2011). En paralelo a su práctica psiquiátrica hospitalaria es Director Médico autónomo en ADVAN HAIR - Advanced Hair Institute (desde octubre 2025), donde lidera procedimientos de trasplante capilar y medicina estética. Mantiene una vocación humanitaria continuada con más de 24 años como voluntario de Cruz Roja Española (desde mayo 2002), donde ha ejercido como enfermero y médico voluntario. Compatibiliza su práctica clínica con la docencia universitaria en la UNIR (desde marzo 2026, en remoto). En ISEIE Innovation School ejerce como Profesor y Director Académico del Máster en Trasplante Capilar, el Diplomado en Medicina Estética y el Curso de Medicina Estética.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Jaén, Andalucía, España', country_code = 'ES',
  slug = 'alberto-jurado', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Médico Psiquiatra HUJ · Director Médico ADVAN HAIR · Docente UNIR · Profesor ISEIE',
  meta_description = 'Médico Psiquiatra en el Hospital Universitario de Jaén. MIR Psiquiatría (SAS). Director Médico ADVAN HAIR. 8+ Másters universitarios. 24 años voluntario Cruz Roja. Profesor y Director Académico de programas de Medicina Estética y Trasplante Capilar en ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/03/Foto-profesional-alberto-jurado-2.png',
  linkedin_url = 'https://www.linkedin.com/in/alberto-jurado-ar%C3%A9valo-8ab4bb47'
WHERE id = p3;

-- 4. Cristina Moreno Martín (Medicina)
UPDATE profiles SET
  full_name = 'Dra. Cristina Moreno Martín',
  headline = 'Odontóloga · Especialista en Medicina Hiperbárica',
  summary = 'Odontóloga especialista en Medicina Hiperbárica. Licenciada en Odontología por la Universidad Alfonso X El Sabio, ha completado cuatro Másters complementarios: Medicina Hiperbárica, Medicina Subacuática, Medicina Estética y Neurociencia y Dolor. Esta formación multidisciplinar le permite abordar la salud del paciente integrando salud bucodental, oxigenoterapia hiperbárica, medicina del buceo y abordaje neurocientífico del dolor. Como Directora Clínica de una Unidad de Oxigenación Hiperbárica privada, aplica protocolos con cámaras monoplaza para indicaciones diversas: heridas crónicas, pie diabético, sordera súbita, secuelas oncológicas y patologías neurológicas. Coordina equipos médicos, técnicos y de enfermería, y mantiene en paralelo práctica odontológica privada que integra con la medicina hiperbárica en casos seleccionados. En ISEIE Innovation School dirige el Máster y el Diplomado en Medicina Hiperbárica.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'España', country_code = 'ES',
  slug = 'cristina-moreno', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Dirección Clínica Unidad HBOT · 4 Másters · ISEIE',
  meta_description = 'Odontóloga (UAX) y especialista en Medicina Hiperbárica. 4 Másters: Hiperbárica, Subacuática, Estética y Neurociencia del Dolor. Directora del Máster y Diplomado en Medicina Hiperbárica de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/03/foto-corporativa-2-1024x988.png',
  portfolio_url = 'https://www.instagram.com/mc_hiperbarica'
WHERE id = p4;

-- 5. Irene Pulido García (Medicina)
UPDATE profiles SET
  full_name = 'Irene Pulido García',
  headline = 'Neuropsicóloga y Psicogerontóloga · Col. COPC 30325',
  summary = 'Neuropsicóloga y Psicogerontóloga clínica colegiada en el Col·legi Oficial de Psicologia de Catalunya (COPC, nº 30325). Graduada en Psicología por la Universitat de València (2017-2021) y con doble Máster Oficial: Máster Oficial en Psicogerontología por la Universitat de Barcelona (2021-2022, Nota 9) y Máster Oficial en Neuropsicología por la Universitat Oberta de Catalunya (2022-2024, Nota 9). Su formación se complementa con un Curso en Acompañamiento y Gestión de Procesos de Duelo del Consorci Generalitat de Catalunya (Nota 10), formación en Primeros Auxilios Psicológicos por la Universitat Autònoma de Barcelona, y certificaciones en Intervención en Alteraciones de Conducta en la Tercera Edad, Terapia con Animales y Terapia con Muñecas para Trastorno Neurocognitivo Mayor. Actualmente cursa también el Grado en Nutrición Humana y Dietética en la UOC (desde octubre 2025). Ejerce como Neuropsicóloga a jornada completa en la Alzheimer Catalunya Fundació (Barcelona, desde mayo 2024), donde realiza evaluación neuropsicológica, aplicación de pruebas estandarizadas e intervención clínica en demencias y enfermedades neurodegenerativas. Su trayectoria docente universitaria incluye su rol como Profesora Asociada de Psicobiología en la Universitat de Barcelona (septiembre 2023 - septiembre 2024). Su experiencia clínica previa abarca trabajo como Psicogerontóloga en Ronda de Dalt Residencial (julio 2022 - mayo 2024), Psicóloga en FIATC Residencias y prácticas en el Hospital Sant Joan de Déu Barcelona. Cuenta con certificación oficial Cambridge B1 (mayo 2022). En ISEIE Innovation School dirige el Máster Profesional en Neuropsicología y Logopedia Clínica.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Barcelona, Cataluña, España', country_code = 'ES',
  slug = 'irene-pulido', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Col. COPC 30325 · Neuropsicóloga Alzheimer Catalunya · Prof. Asoc. UB',
  meta_description = 'Neuropsicóloga colegiada (COPC nº 30325). Trabaja en Alzheimer Catalunya Fundació. Profesora Asociada de Psicobiología en la Universitat de Barcelona. Doble Máster Oficial (UB + UOC). Directora del Máster en Neuropsicología y Logopedia Clínica de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2025/10/Dra.-Irene-Pulido-Garcia.webp',
  linkedin_url = 'https://www.linkedin.com/in/irene-pulido-garc%C3%ADa-94549419a/'
WHERE id = p5;

-- 6. Elena María Granados Alarcón (Medicina)
UPDATE profiles SET
  full_name = 'Elena María Granados Alarcón',
  headline = 'F.E.A. Alergología · Médico Estético',
  summary = 'Médica con doble vertiente profesional: Facultativo Especialista de Área (F.E.A.) en Alergología e Inmunología Clínica en hospitales de referencia de Madrid (Hospital Ruber Juan Bravo y Hospital Vithas Internacional), Alergóloga Infantil en MontePediatras (jornada parcial, desde noviembre 2023), y Médico Estético en Clínica Betancourt, con dedicación específica a dermatología y antiaging. Graduada en Medicina por la Universidad Complutense de Madrid (2012-2018) y especialista en Alergología tras completar la Residencia MIR de 4 años en el Hospital Universitario Ramón y Cajal (mayo 2019 - mayo 2023), uno de los hospitales con mayor prestigio en formación MIR en España. Durante su residencia trabajó en una amplia variedad de consultas, tanto pediátricas como de adultos, así como en el Hospital de Día de Alergología. Su formación de posgrado incluye dos Másters por la Universidad a Distancia de Madrid (UDIMA): Máster en Medicina Estética, Nutrición y Antienvejecimiento (abril 2022 - enero 2023) y Máster en Medicina Estética con énfasis en Nutrición, Obesidad y Microbiota (enero - septiembre 2024). Completó también un programa de Model United Nations en la University of Pennsylvania (junio - agosto 2012). Cuenta con el Certificado del 14th EAACI/UEMS Knowledge Examination in Allergology and Clinical Immunology, otorgado por la European Academy of Allergy and Clinical Immunology (septiembre 2022). Su trayectoria hospitalaria incluye también una etapa como Alergóloga en el Hospital Universitario La Paz (mayo 2024 - marzo 2025) y un contrato temporal como Alergóloga en el Hospital Universitario Ramón y Cajal (octubre - noviembre 2023). Su práctica en medicina estética se ha desarrollado en múltiples clínicas privadas de Madrid: Aesthetic Hub, CLINICA CONSTANZA, Grupostop y Sapphira Privé. Es co-autora del estudio "A Prospective Validation of a Diagnostic Algorithm for Hypersensitivity Reactions to COVID-19 Vaccines". En ISEIE Innovation School dirige el Máster en Dermatología y Antiaging y el Máster en Medicina Estética.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Madrid, Comunidad de Madrid, España', country_code = 'ES',
  slug = 'elena-granados', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Alergóloga Ruber Juan Bravo · Alergóloga Infantil MontePediatras · ISEIE',
  meta_description = 'Médico Adjunto de Alergología en Complejo Hospitalario Ruber Juan Bravo. MIR Alergología en Hospital Ramón y Cajal (4 años). Doble Máster UDIMA. Certificación 14th EAACI/UEMS. Directora del Máster en Dermatología y Antiaging y del Máster en Medicina Estética de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/02/foto-corporativa-1-904x1024.webp',
  linkedin_url = 'https://www.linkedin.com/in/elena-granados-alarc%C3%B3n',
  portfolio_url = 'https://www.instagram.com/draelenagranados'
WHERE id = p6;

-- 7. Iria Graña Somoza (Medicina)
UPDATE profiles SET
  full_name = 'Iria Graña Somoza',
  headline = 'Podóloga Pediátrica',
  summary = 'Podóloga pediátrica con formación universitaria reciente y doble titulación sanitaria. Grado en Podología por la Universidade da Coruña (2019-2023) y Máster en Podología Pediátrica por la Universitat de Barcelona (2023-2024). Cuenta también con un Ciclo Formativo de Grado Superior en Anatomía Patológica y Citodiagnóstico por CPR Aloya (2016-2018), lo que le da una base diagnóstica adicional poco habitual en podología. Su formación se completa con cursos internacionales en Calzado y Biomecánica Infantil (0-8 años) e Interpretación de RMN, TC y Rx por la World Academy of Podiatry Science, y certificación B1 de Inglés en Ciencias de la Salud por la Universidad Internacional Menéndez Pelayo (UIMP). Actualmente cursa también el Grado en Psicología por la UNED. Ejerce como Podóloga en ILLA DE SALUT DE SILS SL (Sils y Blanes, Cataluña), atendiendo quiropodias, biomecánica, podología pediátrica y pacientes diabéticos. Previamente trabajó como podóloga autónoma en FISIONAVIA (Galicia). Compagina su práctica clínica con más de ocho años de experiencia continuada como apoyo educativo a niños de 6 a 14 años, vertiente que refuerza su perfil pediátrico y su capacidad de comunicación con familias. En ISEIE Innovation School dirige el Máster en Podología Avanzada.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Vigo, Galicia / Cataluña, España', country_code = 'ES',
  slug = 'iria-grana', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Podóloga Pediátrica · UDC + Máster UB · ISEIE',
  meta_description = 'Grado en Podología (Universidade da Coruña). Máster en Podología Pediátrica (Universitat de Barcelona). FP en Anatomía Patológica y Citodiagnóstico. Podóloga en ILLA DE SALUT DE SILS. Directora del Máster en Podología Avanzada de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/04/FOTO-PROFESIONAL-790x1024.png',
  linkedin_url = 'https://www.linkedin.com/in/iria-gra%C3%B1a-1a03a629a'
WHERE id = p7;

-- 8. Julia Bovis Benavides (Medicina)
UPDATE profiles SET
  full_name = 'Julia Bovis Benavides',
  headline = 'más de 10 años en Optometría Clínica · Directora Técnica Multiópticas Bovis Vision · Especialista en Contactología Avanzada y Control de Miopía',
  summary = 'Óptico-optometrista graduada por la Universidad de Alicante con más de 10 años de práctica clínica continuada, especializada en control de la progresión de miopía en población infantil y adaptación de lentes de contacto complejas. Su formación de posgrado incluye estudios avanzados en lentes esclerales, ortoqueratología (Orto-K) y queratocono, esta última cursada con David Piñero y Joaquín Fernández, además de certificación oficial de Coopervision en MiSight 1 day para control de miopía. Esta formación le permite adaptar lentes esclerales en córneas irregulares, manejar queratocono no quirúrgico y aplicar protocolos clínicos de control de miopía pediátrica. Como Directora Técnica y Optometrista Principal de Multiópticas Bovis Vision dirige el centro óptico, lidera la formación continua del personal, diseña protocolos clínicos internos y supervisa la atención de los pacientes complejos. Colabora como voluntaria con la Fundación Jorge Alió en programas de prevención de la ceguera. En ISEIE Innovation School dirige el Máster en Optometría Clínica.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Alicante, España', country_code = 'ES',
  slug = 'julia-bovis', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Óptico-Optometrista · Contactología y Control de Miopía',
  meta_description = 'Óptico-optometrista (U. Alicante) con más de 10 años. Especialista en lentes esclerales, ortoqueratología, queratocono y control de miopía. Directora del Máster en Optometría Clínica de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/04/foto-profesional-1.png',
  portfolio_url = 'https://www.instagram.com/juliabovis/'
WHERE id = p8;

-- 9. Lidia Isabel de Sus Martínez (Medicina)
UPDATE profiles SET
  full_name = 'Dra. Lidia de Sus Martínez',
  headline = 'Doctora Cum Laude · Especialista en Biomecánica y Nutrición',
  summary = 'Doctora en Ciencias de la Salud y del Deporte por la Universidad de Zaragoza con mención Sobresaliente Cum Laude (2020-2024). Su tesis doctoral, "Pie Plano Infantil, Índice de Masa Corporal y Herramientas Diagnósticas", está accesible en el fichero central de Tesis Doctorales de España (TESEO) del Ministerio de Educación y en el Repositorio Institucional Zaguan de la Universidad de Zaragoza. Su formación universitaria reúne además: Grado en Medicina Podológica (Podología) por la Universidad Miguel Hernández de Elche (2006-2009), Diplomatura en Nutrición Humana y Dietética por la Universidad de Zaragoza (2003-2006), Máster en Bioética por la Universitat de València (2019-2020) y Experto Universitario en Pie Diabético por la Universidad de Extremadura (2012-2013). Cuenta también con la certificación oficial C1 de Inglés por la Escuela Oficial de Idiomas (EOI) de Zaragoza. Es Doctora-fundadora de Podoestudio (Zaragoza), clínica especializada en Podología y Biomecánica, donde ejerce desde enero 2009 (más de 17 años de práctica clínica continuada). Su enfoque integra podología general, estudios biomecánicos y diseño de plantillas personalizadas 100% digitales. Desde diciembre 2024 ejerce también como Investigadora y Docente en Ciencias de la Salud vinculada a la Universidad de Zaragoza y como formadora independiente (modalidad híbrida), con líneas de investigación originales sobre biomecánica del pie infantil e Índice de Masa Corporal (IMC). Su producción científica incluye publicaciones académicas en revistas indexadas en Journal Citation Reports (JCR) y colaboración como revisora científica en la Revista Española de Salud Pública del Ministerio de Sanidad. Cuenta con experiencia docente universitaria, diseño de módulos e-learning, manejo de plataformas LMS (Moodle, Canvas, Blackboard) y dirección de Trabajos Fin de Máster. En ISEIE Innovation School dirige el Máster en Obesidad y el Curso de Dietética y Nutrición.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Zaragoza, Aragón, España', country_code = 'ES',
  slug = 'lidia-de-sus', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Doctora Cum Laude (U. Zaragoza) · Biomecánica · Podoestudio · ISEIE',
  meta_description = 'Doctora en Ciencias de la Salud Cum Laude (U. Zaragoza). Tesis sobre Pie Plano Infantil e IMC (accesible en TESEO). Grado Podología (UMH Elche). Diplomatura Nutrición (UZ). Máster Bioética (UV). Experta Pie Diabético (UEX). 17+ años en Podoestudio. Directora del Máster en Obesidad de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/04/lidia-foto-profesional.png',
  linkedin_url = 'https://www.linkedin.com/in/lidia-de-sus-7900771a8/'
WHERE id = p9;

-- 10. Luz Marina Zuluaga Ríos (Medicina)
UPDATE profiles SET
  full_name = 'Dra. Luz Marina Zuluaga Ríos',
  headline = 'Médica Cirujana · Fellow en Cirugía de Pie Diabético (UCM)',
  summary = 'Médica cirujana con más de 6 años de práctica clínica en cirugía de pie diabético y enfermedad vascular periférica. Su formación incluye el Fellow en Cirugía de Pie Diabético de la Universidad Complutense de Madrid, especialización en Rehabilitación Cardiopulmonar y formación en ecografía clínica vascular y rehabilitación pulmonar. Trayectoria clínica internacional: rehabilitación cardiopulmonar en la Fundación Favaloro y el Hospital María Ferrer (Argentina), práctica quirúrgica actual en el Hospital San Juan de Dios de Cartago (Colombia) y vinculación docente con la Universidad Complutense de Madrid. Ejerce como Profesora Catedrática en las áreas de Morfofisiología y Farmacología en la UCM, donde forma a estudiantes de medicina y participa en investigación con cursos y congresos internacionales. Su perfil combina práctica quirúrgica vascular activa, docencia universitaria y carrera internacional desarrollada entre Argentina, Colombia y España. En ISEIE Innovation School dirige el Curso de Podología Pediátrica, donde aporta su experiencia en abordaje multidisciplinar del pie y biomecánica.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Madrid, España / Cartago, Colombia', country_code = 'ES',
  slug = 'luz-marina-zuluaga', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Cirujana · Fellow Pie Diabético UCM · Catedrática UCM',
  meta_description = 'Doctora Cirujana. Fellow en Cirugía de Pie Diabético (UCM). Profesora Catedrática en Morfofisiología y Farmacología (UCM). Experiencia clínica internacional Argentina-Colombia-España. Directora del Curso de Podología Pediátrica de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2025/12/FOTO-CORPORATIVA-1-1024x986.jpeg',
  portfolio_url = 'https://www.instagram.com/luzmarinazuluagarios.md'
WHERE id = p10;

-- 11. María Dolores Flores Romero (Medicina — origen químico)
UPDATE profiles SET
  full_name = 'María Dolores Flores Romero',
  headline = 'Licenciada en Química · Especialista en Dermocosmética',
  summary = 'Licenciada en Química por la Universidad de Sevilla (2002-2008) con doble especialización de posgrado: Máster Universitario en Profesorado de Educación Secundaria y Bachillerato (MAES) por la Universidad de Sevilla (2009-2010) y Máster en Dermocosmética y Formulación por la Universidad a Distancia de Madrid (UDIMA, oct 2023 - mayo 2024). Su trayectoria profesional combina tres vertientes complementarias. (1) Vertiente docente reglada: desde noviembre 2017 (más de 8 años) ejerce como Profesora en la Delegación de Educación de la Junta de Andalucía y como Docente de Secundaria y Bachillerato en el sistema público andaluz; en paralelo es Profesora de Ciencias en el Colegio Sagrada Familia de Dos Hermanas desde septiembre 2015 (más de 10 años), donde imparte materias científicas en secundaria. Su experiencia docente abarca Matemáticas, Ciencias Naturales, Biología y Geología, Física y Química, Tecnología y Proyecto Integrado en distintos niveles de ESO y Bachillerato. (2) Vertiente industrial - control de calidad: actualmente ejerce como Quality Assurance Specialist en CODEXSA Geotecnia y Control de Calidad. Su experiencia previa incluye Responsable del Departamento de Calidad en OVOPAK (2011-2013), con implantación de Normas ISO, BRC e IFS, gestión de reclamaciones y control fisicoquímico, biológico e instrumental de la producción en laboratorio; y Analista de Laboratorio en Beer&Food / Heineken España (2009). (3) Vertiente investigadora: fue Investigadora Predoctoral en el grupo de investigación de la Dra. Carmen Ortiz Mellet (Catedrática de Universidad) en el Departamento de Química Orgánica de la Facultad de Química de la Universidad de Sevilla (2011). Es coautora de la publicación científica "Síntesis de Hetarilén Aminopolioles como precursores de moléculas bioactivas" presentada en el II Congreso de Estudiantes de Química (2007). Fue también Becaria del Servicio de Prevención de Riesgos Laborales de la Universidad de Sevilla (2010). En ISEIE Innovation School dirige el Máster en Tratamiento Integral del Acné, el Curso de Tratamiento del Acné y el Curso de Micropigmentación.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Sevilla, Andalucía, España', country_code = 'ES',
  slug = 'maria-dolores-flores', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Química U. Sevilla · MAES · Máster Dermocosmética UDIMA · Profesora Junta Andalucía',
  meta_description = 'Licenciada en Química (Universidad de Sevilla). MAES (U. Sevilla). Máster en Dermocosmética y Formulación (UDIMA). Quality Assurance en CODEXSA. Profesora oficial Junta de Andalucía y Colegio Sagrada Familia (10+ años). Investigadora predoctoral US. Directora del Máster en Tratamiento Integral del Acné de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/03/Foto-corporativa-maria-765x1024.png',
  linkedin_url = 'https://www.linkedin.com/in/maria-dolores-flores-romero-b015a8b8'
WHERE id = p11;

-- 12. María Pedreira Pernas (Medicina — Enfermería Galicia)
UPDATE profiles SET
  full_name = 'María Pedreira Pernas',
  headline = 'Enfermera Familia y Comunitaria · Sergas',
  summary = 'Enfermera Especialista en Familia y Comunitaria (EFyC) con más de 26 años de servicio continuado en el Servizo Galego de Saúde (Sergas), donde ejerce a jornada completa en La Coruña desde junio 2000. Su trabajo abarca asistencia sanitaria comunitaria, acción comunitaria, cuidado integral del paciente y liderazgo de equipos en el ámbito de la enfermería de Atención Primaria gallega. Su trayectoria asistencial incluye también su rol como Coordinadora de Enfermería en las Urgencias Sanitarias de Galicia, donde es responsable de la gestión del personal sanitario y la mejora continua de procesos operativos asistenciales. Compatibiliza su práctica asistencial con una trayectoria docente extensa: desde septiembre 2024 ejerce como Profesora Funcionaria en educación secundaria en La Coruña, y desde septiembre 2010 (más de 15 años) compagina docencia a jornada parcial en distintos centros formativos del sector salud, impartiendo Documentación Sanitaria, Anatomía Patológica, Dietética e Higiene Bucodental. Su formación reúne la Licenciatura en Enfermería, el Máster en Dirección Médica y Gestión Clínica y el Máster en Prevención de Riesgos Laborales. Diseña e imparte programas de formación continua para personal sanitario en urgencias y emergencias, Soporte Vital Básico y Avanzado (SVB/SVA) y nutrición aplicada a la enfermería. En ISEIE Innovation School dirige el Curso de Auxiliar de Enfermería y el Curso Paramédico.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'La Coruña, Galicia, España', country_code = 'ES',
  slug = 'maria-pedreira', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Enfermera Familia y Comunitaria (Sergas) · Profesora Funcionaria · ISEIE',
  meta_description = 'Enfermera Especialista en Familia y Comunitaria con 26+ años en Sergas (La Coruña). Profesora funcionaria en Secundaria. Doble Máster en Dirección Médica y en Prevención de Riesgos Laborales. Directora del Curso de Auxiliar de Enfermería y del Curso Paramédico de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/02/imagen-corporativa-1024x683.webp',
  linkedin_url = 'https://www.linkedin.com/in/maria-pedreira-pedreira-24644229'
WHERE id = p12;

-- 13. Miguel Ángel Vega Maqueda (Medicina)
UPDATE profiles SET
  full_name = 'Miguel Ángel Vega Maqueda',
  headline = 'Biólogo (U. Sevilla) · Embriólogo Clínico formado en H. Virgen del Rocío · Máster en Reproducción Humana Asistida (CFP U. Sevilla) · más de 20 años en entornos hospitalarios',
  summary = 'Embriólogo clínico con perfil dual de laboratorio y atención al paciente. Licenciado en Biología por la Universidad de Sevilla (2012) y Máster en Reproducción Humana Asistida por el Centro de Formación Permanente de la Universidad de Sevilla (2023-2024). Completó formación especializada en la Unidad de Reproducción Asistida del Hospital Universitario Virgen del Rocío de Sevilla, donde perfeccionó competencias en fecundación in vitro (FIV/ICSI), criobiología y manejo avanzado de gametos. Su formación continua incluye preservación de embriones y diagnóstico genético preimplantacional (DGP/PGT). Compagina su trayectoria en laboratorio con más de 19 años de práctica clínica como Técnico en Cuidados Auxiliares de Enfermería en unidades hospitalarias del Servicio Andaluz de Salud, experiencia que le aporta una visión integral del paciente y del trabajo en equipos multidisciplinares. Esta combinación entre técnica de laboratorio y cuidado clínico humanizado es la base desde la que dirige, en ISEIE Innovation School, el Máster en Reproducción Asistida Avanzada.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Sevilla, España', country_code = 'ES',
  slug = 'miguel-angel-vega', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Embriólogo Clínico · Virgen del Rocío · Director Máster ISEIE',
  meta_description = 'Biólogo (U. Sevilla) y embriólogo clínico. Máster en Reproducción Humana Asistida (CFP U. Sevilla). Formación especializada en H. Virgen del Rocío. más de 20 años en entornos hospitalarios. Director del Máster en Reproducción Asistida Avanzada de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/03/foto-corporativa-miguel-1024x909.png',
  linkedin_url = NULL  -- URL original devolvía 404; pendiente de confirmar
WHERE id = p13;

-- 14. Rosa Inmaculada Monje López (Medicina)
UPDATE profiles SET
  full_name = 'Rosa Inmaculada Monje López',
  headline = 'Bióloga y Nutricionista · Especialista en Microbiota',
  summary = 'Bióloga y nutricionista-dietista con perfil científico, clínico, pedagógico y de gestión sanitaria. Su formación reúne cuatro titulaciones complementarias: Licenciatura en Ciencias Biológicas, Grado en Nutrición y Dietética por la Universidad Isabel I de Castilla, Máster en Nutrición y Dietética Humanas y Máster en Microbiota Humana. Esta combinación le permite abordar la nutrición desde su base biológica (fisiología, fisiopatología y microbiota intestinal) hasta su aplicación clínica en poblaciones específicas. Su trayectoria profesional cubre cuatro frentes: docencia como profesora en la Escuela ESTENA en Fisiología Humana, Nutrición aplicada a patologías, Fisiopatología y Biología; práctica clínica como nutricionista en la Fundación Natzaret, donde diseña menús adaptados para niños y adolescentes con condiciones específicas; gestión hospitalaria previa como Supervisora de Calidad en el Hospital de Manacor (implementación de sistemas de calidad ISO y procesos de higiene clínica) y como Responsable de Calidad en Sercool Insular S.A.; y proyecto profesional propio de consulta nutricional online (nutricionintegrativa.online) con enfoque integrativo que combina nutrición clínica, microbiota y biología. En ISEIE Innovation School dirige el Diplomado en Nutrición Bariátrica, el Curso de Nutrición Bariátrica y el Curso de Nutrición.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'España', country_code = 'ES',
  slug = 'rosa-monje', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Bióloga y Nutricionista · Microbiota · 3 programas ISEIE',
  meta_description = 'Bióloga, Grado en Nutrición (U. Isabel I), Máster en Microbiota Humana, Máster en Nutrición Humana. Profesora ESTENA. Ex-Supervisora de Calidad H. Manacor. Directora del Diplomado y 2 Cursos de Nutrición de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/03/foto-corporativa-rosa.png',
  portfolio_url = 'https://nutricionintegrativa.online/'
WHERE id = p14;

-- 15. Rubén Broncano Martínez (Medicina)
UPDATE profiles SET
  full_name = 'Rubén Broncano Martínez',
  headline = 'Psicólogo · Psicología Empresarial desde el Psicoanálisis',
  summary = 'Psicólogo y psicoterapeuta especializado en psicología empresarial pensada desde el psicoanálisis y en psicoterapia lógico-racional. Licenciado en Psicología (especialidad Psicología Educativa) por la Universitat de Girona (1996-2001). Psicólogo Colegiado nº 12813. Su práctica profesional combina tres frentes complementarios: (1) Psicólogo Empresarial en Psicología Empresarial Online en España y Presencial en Barcelona (autónomo desde julio 2025, modalidad híbrida), donde aborda absentismo laboral, rotación en las empresas y resolución de conflictos internos desde un enfoque psicoanalítico aplicado al ámbito organizacional. (2) Psicólogo en consulta privada online desde enero 2023 (3+ años), atendiendo pacientes a nivel mundial en idioma español. (3) Director de la Academia de Pensamiento Libre (Granollers, Cataluña) desde diciembre 2021 (4+ años), entidad propia desde la que imparte cursos de Pensamiento Contemporáneo, Historia, Filosofía y Economía Clásica, Psicología y Psicoanálisis. Combina su práctica clínica con una carrera como autor y conferenciante: es autor de "Manuscritos de Psicoanálisis" (Editorial Círculo Rojo, 2022) y "Psicoanálisis del Juego de la Oca" (Amazon), y participa regularmente como ponente en eventos del ámbito de la salud mental. En 2025 completa el Therapist International Psychoanalysis Training. Su práctica clínica como psicólogo cuenta también con colaboraciones en las principales mutuas privadas de salud de España (Sanitas, Aegon, Caser, Cigna, DKV y Adeslas). En ISEIE Innovation School dirige el Máster, el Diplomado y el Curso de Psicología Bariátrica.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Riells i Viabrea, Cataluña, España', country_code = 'ES',
  slug = 'ruben-broncano', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Col. 12813 · Psicología Empresarial desde el Psicoanálisis · Director Academia · ISEIE',
  meta_description = 'Psicólogo Colegiado nº 12813. Universitat de Girona. Especialista en Psicología Empresarial pensada desde el Psicoanálisis. Director de la Academia de Pensamiento Libre (Granollers). Autor de 2 libros. Director del Máster, Diplomado y Curso de Psicología Bariátrica de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/02/foto-corporativa-ruben-746x1024.webp',
  linkedin_url = 'https://www.linkedin.com/in/rub%C3%A9n-broncano-mart%C3%ADnez-b69a0a80',
  portfolio_url = 'https://www.instagram.com/rubenbroncano/'
WHERE id = p15;

-- 16. Susana Lucas Ballesteros (Medicina — Wellness)
UPDATE profiles SET
  full_name = 'Susana Lucas Ballesteros',
  headline = 'Experta Wellness & Luxury Hospitality · Fundadora Wellnity Studio',
  summary = 'Profesional con más de 20 años de experiencia en el sector wellness y hospitality de lujo, con trayectoria continuada en hoteles 5 estrellas de marcas internacionales. CEO y Fundadora de Wellnity Studio (autónomo desde 2025), su empresa actual dedicada a la guía de personas y parejas en el fortalecimiento de su conexión y bienestar a través de la terapia, el tacto y la palabra. Previamente fundó y dirigió The Wellness Team - Formación de Alto Rendimiento para Spas (2018-2025, 7 años), empresa orientada al desarrollo estratégico y operativo de negocios en el sector wellness. Su trayectoria como Spa Manager incluye seis hoteles de lujo: SUITOPIA HOTEL en Calpe (jul 2022 - jun 2025, 3 años), VIVOOD Landscape Hotels en Benimantell (2022), InterContinental Mar Menor Golf Resort & Spa (2015-2016), Hospes Alicante (2013-2015, donde lideró la reapertura del Spa), Hilton Buenavista Toledo como Spa Coordinator (2011-2013) y Hesperia Lanzarote como Terapeuta Manual (2009-2011). En 2004 fundó su primera empresa propia, B&B Estética Natural y Terapias Manuales (Murcia, 2004-2008). Desde noviembre 2023 ejerce como Tutora del Programa Superior en Wellness & Spa en CESAE Business&Tourism School (2+ años). Su formación técnica reúne las principales disciplinas terapéuticas del wellness por la Escuela de Terapias Manuales de Murcia (2005-2006): Diplomada en Quiromasaje, Masaje Deportivo, Reflexología Podal, Drenaje Linfático, Quiropráctica y Masaje Tailandés/On-site. Cuenta también con formación en Formador de Formadores por Euroinnova International (2015), Community Manager por Mamis Digitales (2018), Curso "El ABC del Copywriting" por la Escuela de Copywriting de Maïder Tomasena (2019), y cursa actualmente Psicología en la UNED desde octubre 2022. Cuenta con más de 3.000 seguidores en LinkedIn. En ISEIE Innovation School dirige el Curso de Auxiliar de Podología, el Curso de Reflexología Podal y el Curso Auxiliar de Estética.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Murcia, Región de Murcia, España', country_code = 'ES',
  slug = 'susana-lucas', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Wellness & Luxury Hospitality · Fundadora Wellnity Studio · Tutora CESAE · ISEIE',
  meta_description = 'Experta Wellness & Luxury Hospitality con más de 20 años en hoteles 5★. CEO Wellnity Studio. Ex-Spa Manager en InterContinental Mar Menor, Hilton Buenavista, Hospes Alicante, SUITOPIA, VIVOOD y Hesperia Lanzarote. Tutora CESAE Business&Tourism School. Directora de 3 cursos en ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/02/foto-corporativa-susana-1-904x1024.webp',
  linkedin_url = 'https://www.linkedin.com/in/susana-lucas',
  portfolio_url = 'https://www.instagram.com/susanalucas.wellnity/'
WHERE id = p16;

-- 17. Yacnira Loreleis Martínez Bazán (Medicina)
UPDATE profiles SET
  full_name = 'Dra. Yacnira Martínez',
  headline = 'Médica Anestesióloga · Hospital Virgen de la Peña',
  summary = 'Médica especialista en Anestesiología y Reanimación desde el año 2001. Doctora en Medicina por el Instituto Superior de Ciencias Médicas de Santiago de Cuba (1988-1994), Especialista de Primer Grado en Anestesiología y Reanimación por el Instituto de Ciencias Médicas de Santiago de Cuba (1996-2000) y Máster en Urgencias Médicas por la Universidad de Ciencias Médicas de Granma (2007-2010). Cuenta también con un Máster en Anestesiología y Reanimación y Tratamiento del Dolor cursado en España. Actualmente ejerce como Anestesista a jornada completa en el Hospital Virgen de la Peña (Servicio Canario de Salud, Fuerteventura) desde septiembre 2021, con casi 5 años en este centro. Su trayectoria como médico anestesiólogo se extiende por casi tres décadas continuadas desde noviembre 1996. Su práctica anestésica cubre anestesia regional, anestesia general, soporte vital básico, manejo perioperatorio del paciente quirúrgico, manejo de vía aérea, reanimación cardiopulmonar y atención hospitalaria especializada. Ostenta categoría de Profesora Universitaria Auxiliar e Investigadora Auxiliar, con más de 20 publicaciones científicas en revistas cubanas y extranjeras. Su trayectoria institucional incluye su rol como Ex-Presidenta del Capítulo Granma de la Sociedad Cubana de Anestesiología y Reanimación, donde coordinó actividades formativas regionales y participó en la política científica de la especialidad. Su formación continua añade cursos específicos en hipertensión arterial, cuidados paliativos, uso de antibióticos, reanimación neonatal y anestesia en cirugía ortopédica. En ISEIE Innovation School dirige el Máster en Anestesiología y Reanimación.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Puerto del Rosario, Canarias, España', country_code = 'ES',
  slug = 'yacnira-martinez', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Anestesista Hospital Virgen de la Peña (Fuerteventura) · Profesora Universitaria · ISEIE',
  meta_description = 'Médica especialista en Anestesiología y Reanimación desde 2001. Doctora en Medicina (Cuba). Máster en Urgencias Médicas (UCM Granma). Anestesista en el Hospital Virgen de la Peña (Fuerteventura). Profesora Universitaria Auxiliar e Investigadora. +20 publicaciones científicas. Directora del Máster en Anestesiología y Reanimación de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/02/foto-corporativa-yanic-683x1024.webp',
  linkedin_url = 'https://www.linkedin.com/in/yacnira-martinez-29751650/'
WHERE id = p17;

-- 18. Dra. María Josep Albert López (Odontología)
UPDATE profiles SET
  full_name = 'Dra. María Josep Albert López',
  headline = 'Odontóloga · Periodoncia, Implantología y Estética Facial',
  summary = 'Odontóloga especializada en tratamientos integrales que combinan periodoncia, estética dental, implantología y estética facial. Su formación es de raíz universitaria: Licenciatura en Odontología por la Universidad Católica de Valencia "San Vicente Mártir" (UCV), Máster Universitario en Periodoncia, Osteointegración y Periimplantología en la misma universidad, y Postgrado en Estética Facial por la Sociedad Española de Medicina Estética (SEME). Como Co-Directora de la Clínica Albert y Barber (Valencia) lidera junto con su socio profesional un centro que integra odontología avanzada y estética facial en un mismo espacio asistencial. Su práctica clínica cubre cirugía periodontal, injertos de tejido blando, regeneración ósea, osteointegración e implantes dentales, tratamientos de la sonrisa gingival, ortodoncia estética y tratamientos estéticos faciales (toxina botulínica, rellenos con ácido hialurónico, diseño digital de sonrisa). Ejerce como Profesora Asociada en la Facultad de Odontología de la Universidad Católica de Valencia, donde realizó su Licenciatura y Máster. Participa regularmente como ponente en formaciones y congresos del sector y cuenta con verificación pública en Top Doctors España. En ISEIE Innovation School dirige el Máster en Odontología Digital.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Valencia, España', country_code = 'ES',
  slug = 'maria-josep-albert', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Odontóloga · Periodoncia y Estética Facial · UCV',
  meta_description = 'Licenciada en Odontología (UCV). Máster en Periodoncia, Osteointegración y Periimplantología. Top Doctors España. Directora del Máster en Odontología Digital de ISEIE.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2024/12/Maria-josep-albert-1007x1024.webp',
  portfolio_url = 'https://www.dramariajosepalbert.com/'
WHERE id = p18;

-- 19. Luis David Romero García (Odontología)
UPDATE profiles SET
  full_name = 'Luis David Romero García',
  headline = 'Odontólogo y Perito Odontológico Forense · Universitat de València',
  summary = 'Profesional de la Odontología y la Medicina Forense con trayectoria clínica internacional de más de 25 años entre México, España y Canadá. Apasionado por la Odontología y la Medicina Forense, combina experiencia como odontólogo, cirujano oral y perito forense. Su enfoque integra soluciones clínicas a sus pacientes y contribución al ámbito judicial con rigor y precisión científica. Formación universitaria multinacional: Bachelor of Dentistry, Bachelor of Surgery (MBBS) por la Universidad Nacional Autónoma de México (UNAM, 1997-2001), Diploma in Oral Diagnosis por la UAM Universidad Autónoma Metropolitana (2003-2004) bajo el Dr. Adalberto Mosqueda Taylor, Bachelor of Dental Surgery (BDS) y Master of Science in Dental Surgery (MSc DS) por la Universidad Europea (2012-2013, con Recognition of Studies in European Union que homologó sus títulos mexicanos), Posgrado en Medicina Forense por la Universitat de València (enero 2024 - julio 2025) y Master of Formación Permanente en Medicina Forense por la Universitat de València (octubre 2024). Su trayectoria clínica abarca más de 25 años desde sus inicios como Certified Dental Assistant en Harvard Dental Clinics of Mexico (1998-2001) e Investigador en Preventive Dentistry de la University of Toronto (Canadá, 2000), con tesina "Pit and Fissure Sealants Analysis: In Vitro Study using a Scanning Electron Microscope (SEM)". Fue Clinic Director Owner de su propia Clínica Dental Dr. Romero (México, 2001-2006), Clinical Director de Expansión Vitaldent (Madrid, 2008-2009) y Associate Dentist en Clínicas Unidental (Madrid, 2007-2008). En el Centro de Diagnóstico Ibiza (2013-2022, 9 años 5 meses) ejerció como Dentistry y Oral Surgeon con responsabilidades adicionales como Assistant Manager, Radiological Equipment Director, CBCT and Oral Diagnosis y Assistant Manager of MRI. Actualmente compagina cuatro roles activos: Director Académico del Curso de Odontología Forense en ISEIE Innovation School (desde septiembre 2025); Perito Especializado vinculado a la Universitat de València (desde enero 2024) ofreciendo servicios de peritaje forense en evaluaciones dentales, identificación mediante registros odontológicos, estimación de edad y análisis de lesiones (accidentes laborales, siniestros, casos judiciales), con disponibilidad para mutuas, aseguradoras y entidades judiciales; Asesor y Experto en Acreditaciones de Competencias Profesionales de Sanidad para la Comunidad de Madrid (desde mayo 2023, 3 años); y Dentistry autónomo en Clínica D Dental (Santa Eulària des Riu, Ibiza) desde enero 2021. Su práctica clínica especializada cubre cirugía oral y maxilofacial, implantología dental (13 validaciones), tecnología dental, restauración dental, endodoncias, laser dentistry, radiología dental (CBCT) y atención sanitaria integral. Es autor del estudio sobre Fluoruros y Efectos Neurotóxicos en Niños y ha participado en el Congreso Internacional de Gerodontología 2013.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#1E40AF',
  location = 'Dénia, Comunidad Valenciana, España', country_code = 'ES',
  slug = 'luis-david-romero', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Director Académico ISEIE · Perito Forense U. València · Odontólogo · 25+ años entre México y España',
  meta_description = 'Director Académico Curso Odontología Forense ISEIE Innovation School. Perito Especializado Universitat de València. Odontólogo (UNAM + Universidad Europea). Posgrado Medicina Forense U. València. 25+ años trayectoria internacional. Asesor Acreditaciones Sanitarias Comunidad de Madrid.',
  avatar_url = 'https://iseie.com/wp-content/uploads/2026/02/foto-corporativa-Luis-David-Romero-Garcia-746x1024.webp',
  linkedin_url = 'https://www.linkedin.com/in/luis-david-romero/'
WHERE id = p19;

-- ═══════════════════════════════════════════════════════════════════════
-- CLEANUP: Delete existing data to make script re-runnable
-- ═══════════════════════════════════════════════════════════════════════
DELETE FROM portfolio_items WHERE profile_id IN (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19);
DELETE FROM skills WHERE profile_id IN (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19);
DELETE FROM languages WHERE profile_id IN (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19);
DELETE FROM education WHERE profile_id IN (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19);
DELETE FROM experiences WHERE profile_id IN (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13,p14,p15,p16,p17,p18,p19);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Ramón Miralles López
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p1, 'ISEIE Innovation School', 'Director Académico - Máster en Derecho Digital', '2024-01-01', NULL, true, 'Dirección académica del Máster en Derecho Digital de ISEIE Innovation School. Diseño curricular alineado con la actualidad normativa europea: RGPD, NIS2, DORA, AI Act y Reglamento de Servicios Digitales. Selección y coordinación del cuerpo docente, asegurando perfiles de práctica real en bufetes y empresas. Tutorización de Trabajos Fin de Máster con orientación a casos reales del mercado. Revisión continua de contenidos para reflejar la actualidad regulatoria europea.', 1),
  (p1, 'ECIJA & Asociados Abogados Barcelona SL', 'Socio de Privacidad, Ciberseguridad y Corporate Compliance · Jornada completa', '2024-05-01', NULL, true, 'Socio de Privacidad, Ciberseguridad y Corporate Compliance en ECIJA Barcelona desde mayo 2024 (presencial, Barcelona). Lidera la asesoría jurídica a empresas tecnológicas en adaptación al RGPD, normativa europea de servicios digitales (DSA, DMA), regulación europea sobre inteligencia artificial (AI Act), directivas de ciberseguridad NIS2 y DORA, compliance penal corporativo y estándares ESG digital.', 2),
  (p1, 'Instituto Universitario de Investigación Ortega y Gasset (IUIOG)', 'Profesor · Curso Superior de Delegado en Protección de Datos', '2018-10-01', NULL, true, 'Profesor en el Curso Superior de Delegado en Protección de Datos del Instituto Universitario de Investigación Ortega y Gasset (IUIOG) desde octubre 2018 (7+ años). Docencia universitaria especializada en formación de Delegados de Protección de Datos (DPO).', 3),
  (p1, 'OBS Business School', 'Docente Invitado · Profesor "Derecho de las TIC"', '2015-10-01', NULL, true, 'Docente Invitado en OBS Business School desde octubre 2015 (10+ años). Imparte el módulo "Derecho de las TIC" en el Máster en Propiedad Intelectual e Industrial. Docencia continuada especializada en derecho aplicado a las tecnologías de la información y la comunicación.', 4),
  (p1, 'ECIX Group', 'Socio Director ECIX Group Cataluña · Abogado Especialista en Privacidad, Riesgo y Ciberseguridad / LegalTech / Ciberderecho', '2018-04-01', '2024-05-31', false, 'Socio Director en ECIX Group Cataluña durante 6 años 2 meses. Dirección de la oficina de ECIX en Barcelona, organización y estructuración de la oficina, orientación a equipos de trabajo especializados. En paralelo ejerció como Abogado Especialista en Privacidad, Riesgo y Ciberseguridad, LegalTech y Ciberderecho: diseño de nuevas líneas de negocio y servicios, diseño e implantación de nuevas metodologías de trabajo.', 5),
  (p1, 'Il·lustre Col·legi de l''Advocacia de Barcelona (ICAB)', 'Vocal de la Comisión de Transformación Digital', '2018-02-01', '2020-06-30', false, 'Vocal de la Comisión de Transformación Digital del Il·lustre Col·legi de l''Advocacia de Barcelona (ICAB) durante 2 años 5 meses.', 6),
  (p1, 'Autoritat Catalana de Protecció de Dades (APDCAT)', 'Coordinador d''Auditoria i Seguretat de la Informació', '2003-10-01', '2018-04-30', false, '14 años 7 meses como Coordinador d''Auditoria i Seguretat de la Informació en la Autoritat Catalana de Protecció de Dades (APDCAT), la autoridad de protección de datos catalana. Funciones: diseño y coordinación de la ejecución de los Planes de Auditoría de la Agencia, actuación preventiva en materia de protección de datos de carácter personal, soporte de auditoría de sistemas de información al área de inspección de la Agencia y soporte técnico en seguridad de la información al resto de áreas.', 7),
  (p1, 'Ajuntament de Barcelona', 'Responsable del Departamento de Tecnología', '2002-10-01', '2003-11-30', false, 'Definición y evolución del modelo tecnológico de los sistemas de información e infraestructuras técnicas del Ajuntament de Barcelona. Técnica de sistemas, seguridad y soporte a la producción y desarrollo.', 8),
  (p1, 'Secartys · División de e-security de GyD Ibérica', 'Responsable de Consultoría', '2001-11-01', '2002-10-31', false, 'Responsable de Consultoría en e-security en GyD Ibérica durante 1 año.', 9),
  (p1, 'CTTI - Centre de Telecomunicacions i Tecnologies de la Informació (Generalitat de Catalunya)', 'Responsable Asseguramient de la Informació', '1999-01-01', '2001-10-31', false, 'Responsable de Aseguramiento de la Información en el CTTI de la Generalitat de Catalunya durante 2 años 10 meses. Consultoría Internet e implantación de infraestructuras de clave pública (PKI) de la Generalitat: tecnología y políticas relacionadas con certificados digitales y firma electrónica. Administración electrónica.', 10),
  (p1, 'Generalitat de Catalunya - Centre Informàtic', 'Responsable de la Unitat de Mitjans Informàtics de Difussió d''Informació', '1995-01-01', '1998-12-31', false, '4 años como Responsable de la Unitat de Mitjans Informàtics de Difussió d''Informació de la Generalitat de Catalunya. Diseño, mantenimiento, desarrollo y explotación de las infraestructuras Internet de la Generalitat de Catalunya (gencat.cat). Sistemas multimedia, autoservicio y Servicaixa para la difusión de información.', 11),
  (p1, 'Generalitat de Catalunya - Centre Informàtic', 'Responsable de l''Àrea de Videotex', '1990-01-01', '1994-12-31', false, '5 años como Responsable de l''Àrea de Videotex del Centre Informàtic de la Generalitat de Catalunya. Diseño, mantenimiento, desarrollo y explotación de las infraestructuras videotex de la Generalitat.', 12),
  (p1, 'Generalitat de Catalunya - Departament de Justícia', 'Responsable del Gabinet d''Informàtica Judicial', '1988-01-01', '1989-12-31', false, '2 años como Responsable del Gabinet d''Informàtica Judicial en el Departament de Justícia de la Generalitat de Catalunya. Soporte a la implantación y mantenimiento del proyecto PRAOJ de informatización de oficinas judiciales de la Generalitat de Catalunya.', 13),
  (p1, 'SEINTEX, S.A.', 'Implantador d''Aplicacions Judicials', '1985-09-01', '1987-12-31', false, 'Primera etapa profesional (2 años 4 meses): Implantador de Aplicaciones Judiciales en SEINTEX, S.A. desde septiembre 1985.', 14);

-- 2. Mildreth Plata López
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p2, 'ISEIE Innovation School', 'Directora Académica - Facultad de Educación · Máster en Tecnología Educativa e Innovación Educativa', '2025-06-01', NULL, true, 'Directora Académica del Máster en Tecnología Educativa e Innovación Educativa de ISEIE Innovation School (modalidad remota). Acompaña al estudiantado y a profesionales en su proceso de formación y transformación digital en el ámbito educativo. Da la bienvenida e introduce cada módulo formativo, guiando a los participantes con una visión clara y estructurada. Representa el programa en los canales institucionales (web, materiales formativos y recursos de apoyo) fortaleciendo su identidad académica. Como Directora de la Facultad de Educación supervisa cuatro programas: Máster en Tecnología Educativa, Máster en Innovación Educativa, Diplomado en Innovación Educativa y Curso de Tecnologías Educativas.', 1),
  (p2, 'ILUNION', 'Formadora en la Brecha Digital', '2025-09-01', NULL, true, 'Formadora en programas de cierre de brecha digital en Castellón. Desarrollo de competencias digitales en programas de formación que incluyen: búsqueda eficiente de información por Internet, gestión del día a día desde el móvil e introducción a la inteligencia artificial, promoviendo las competencias clave para la inclusión digital de personas en situación de vulnerabilidad.', 2),
  (p2, 'Adecco', 'Profesora Brecha Digital · Formadora Técnica', '2024-05-01', NULL, true, 'Profesora y Formadora Técnica en programas de Brecha Digital en Adecco (modalidad híbrida, Castellón). Educadora con sólida experiencia en cerrar la brecha digital a través de la enseñanza y metodologías innovadoras e inclusivas; especializada en facilitar el acceso y el uso efectivo de la tecnología a personas en riesgo de exclusión. Diseño e impartición de programas en Competencias Digitales y Formación por Competencias. Inclusión social, gestión de proyectos web y capacitación docente.', 3),
  (p2, 'MildrethTech', 'Fundadora · IA y Educación', '2023-01-01', NULL, true, 'Fundadora del proyecto propio MildrethTech, donde combina inteligencia artificial y educación para transformar procesos de aprendizaje. Desarrollo de propuestas formativas, divulgación y consultoría en EdTech inclusiva.', 4),
  (p2, 'Universitat Jaume I (UJI)', 'Investigadora Postdoctoral', '2023-05-01', '2025-07-31', false, 'Investigadora Postdoctoral en la Universitat Jaume I tras la defensa de tesis con calificación Sobresaliente Cum Laude. Continuación de la línea de investigación iniciada con el doctorado: aprendizaje servicio, transformación social y educación inclusiva mediada por tecnología. Integración en el Grupo de Investigación MEICRI.', 5),
  (p2, 'El CEAMAR - Centro de Prevención al Mayor (Generalitat Valenciana)', 'Investigadora e Instructora de Nuevas Tecnologías', '2024-03-01', '2025-06-30', false, 'Investigación e instrucción en el Centro de Prevención al Mayor (CEAMAR), centro dependiente de la Generalitat Valenciana en Castellón. Enseñanza de las nuevas tecnologías al colectivo de personas mayores. Diseño de programas formativos adaptados a las necesidades específicas del colectivo y a la prevención de la exclusión digital.', 6),
  (p2, 'Grupo Euroformac', 'Profesora de Informática · Alfabetización Digital a la Mujer Rural', '2023-02-01', '2023-04-30', false, 'Profesora de informática en el programa Alfabetización Digital a la Mujer Rural en la zona de Castellón. Capacitación a mujeres en entornos rurales para el uso efectivo de tecnologías digitales.', 7),
  (p2, 'Casal Jove de Burriana', 'Dinamizadora de Proyectos Culturales (Prácticas)', '2021-01-01', '2021-07-31', false, 'Prácticas de dinamización de proyectos culturales en el Casal Jove de Burriana (Borriana, Comunidad Valenciana). Total: 90 horas. Sistematización y gestión de servicios culturales.', 8),
  (p2, 'Universitat Jaume I (UJI)', 'Investigadora Educativa - Grupo MEICRI (FP Dual)', '2019-02-01', '2019-10-31', false, 'Integrante del grupo de investigación MEICRI en la Universitat Jaume I. Participación activa en investigaciones del momento. Análisis y redacción de artículos científicos. Modalidad de Formación Profesional Dual.', 9),
  (p2, 'Secretaría de Educación Distrital de Bogotá', 'Profesora de Artes Plásticas', '1999-04-01', '2016-05-31', false, 'Más de 17 años como profesora de artes plásticas en el sistema público de educación de Bogotá (Colombia). Diseño curricular del área artística, desarrollo de proyectos creativos con el alumnado y aplicación de la educación artística como vehículo de transformación social.', 10),
  (p2, 'ASED - Asociación Educativa Bogotá', 'Directora y Orientadora · Profesora de Informática', '2002-01-01', '2012-09-30', false, 'Directora y Orientadora del Centro Educativo de Jóvenes y Adultos (ASED, Bogotá, Colombia) durante más de 10 años. Orientación académica y psicológica del alumnado, descubriendo las asignaturas que mejor encajan para su vida laboral. Desarrollo de habilidades cívicas y competencias ciudadanas. Gestión de proyectos empresariales inclusivos, proyectos de investigación y proyectos de vida. Trabajo de las operaciones mentales y funciones cognitivas del alumnado para descubrir sus talentos. Compatibilizado con la docencia de informática (asesoría de programas Office y redes sociales).', 11),
  (p2, 'Colegio Agustiniano (Bogotá)', 'Profesora de Primaria y Artes Plásticas', '1992-01-01', '1999-04-30', false, 'Primera etapa profesional como profesora de primaria en el Colegio Agustiniano (Bogotá, Colombia). Tutora de los grados 1, 2, 3, 4 y 5 durante 7 años. Profesora de artes plásticas en los grados 3, 4 y 5.', 12);

-- 3. Alberto Jurado Arévalo
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p3, 'ISEIE Innovation School', 'Profesor y Director Académico - Medicina Estética y Trasplante Capilar', '2026-03-01', NULL, true, 'Profesor y Director Académico del Máster en Trasplante Capilar, el Diplomado en Medicina Estética y el Curso de Medicina Estética en ISEIE Innovation School (modalidad remota, jornada parcial). Diseño curricular con foco en técnicas FUE/DHI, manejo de complicaciones y abordaje integral del paciente capilar. Selección del cuerpo docente con perfil clínico activo. Revisión continua de protocolos y contenidos clínicos. Supervisión de prácticas y tutorización académica.', 1),
  (p3, 'Hospital Universitario de Jaén (Servicio Andaluz de Salud)', 'Médico Psiquiatra · Jornada completa', '2025-07-01', NULL, true, 'Médico Psiquiatra en el Hospital Universitario de Jaén tras completar su Especialidad MIR de Psiquiatría en el Servicio Andaluz de Salud. Atención clínica psiquiátrica hospitalaria. Manejo del paciente con patología mental compleja, valoración diagnóstica integral, prescripción farmacológica y abordaje psicoterapéutico. Coordinación con equipos multidisciplinares (psicología, trabajo social, enfermería de salud mental).', 2),
  (p3, 'ADVAN HAIR - Advanced Hair Institute', 'Director Médico · Autónomo', '2025-10-01', NULL, true, 'Director Médico de ADVAN HAIR - Advanced Hair Institute. Liderazgo clínico del centro especializado en trasplante capilar y medicina estética. Atención directa de casos complejos en tricología y estética facial. Diseño de protocolos quirúrgicos y de seguimiento postoperatorio.', 3),
  (p3, 'UNIR-Universidad Internacional de La Rioja', 'Docente · Jornada parcial · En remoto', '2026-03-01', NULL, true, 'Docencia universitaria en remoto en la Universidad Internacional de La Rioja. Formación de futuros profesionales sanitarios desde su experiencia clínica multidisciplinar en psiquiatría, medicina estética y dirección sanitaria.', 4),
  (p3, 'Cruz Roja Española', 'Voluntario · Enfermero y Médico', '2002-05-01', NULL, true, 'Más de 24 años de voluntariado continuado en Cruz Roja Española. Inicialmente como voluntario (desde mayo 2002) y posteriormente como enfermero y médico voluntario (desde junio 2008). Atención sanitaria en eventos, operativos de emergencia y dispositivos asistenciales de la entidad.', 5),
  (p3, 'Servicio Andaluz de Salud (SAS)', 'Médico Residente Psiquiatría (MIR)', '2021-07-01', '2025-07-31', false, 'Especialidad MIR en Psiquiatría en el Servicio Andaluz de Salud (Jaén) durante 4 años. Formación reglada hospitalaria con rotaciones en unidades de hospitalización, consultas externas, hospital de día, interconsulta y urgencias psiquiátricas. Investigación médica en líneas asociadas a la especialidad.', 6),
  (p3, 'ADVAN HAIR - Advanced Hair Institute (etapa anterior)', 'Director Médico · Autónomo', '2021-03-01', '2021-07-31', false, 'Primera etapa como Director Médico de ADVAN HAIR antes del inicio del MIR. Dirección clínica del centro de trasplante capilar y medicina estética. Investigación médica y medicina estética.', 7),
  (p3, 'Asistencia Los Angeles', 'Médico · Jornada completa', '2021-05-01', '2021-07-31', false, 'Médico en Asistencia Los Angeles. Servicios médicos de emergencia.', 8),
  (p3, 'Centro Médico Estético New Image', 'Médico Estético · Cirujano Capilar', '2020-10-01', '2021-07-31', false, 'Práctica clínica en medicina estética y cirugía capilar en Jaén. Procedimientos de tricología, estética facial y cirugía capilar.', 9),
  (p3, 'Servicio Andaluz de Salud (SAS) - Andújar', 'Médico · Dispositivo de Cuidados Críticos y Urgencias (DCCU)', '2018-03-01', '2021-05-31', false, 'Médico en Dispositivo de Cuidados Críticos y Urgencias del SAS en Andújar (Jaén). Atención de urgencias prehospitalarias y hospitalarias. Servicios médicos de emergencia.', 10),
  (p3, 'Empresa Pública Hospital Alto Guadalquivir (Jaén)', 'Enfermero (DUE)', '2014-06-01', '2016-10-31', false, 'Enfermero Diplomado Universitario en Empresa Pública Hospital Alto Guadalquivir (Andújar, Jaén). Atención de enfermería en distintos servicios hospitalarios.', 11),
  (p3, 'Hospital Universitario Gregorio Marañón (Madrid)', 'Enfermero · URGENCIAS y ONCO-HEMATOLOGÍA', '2011-12-01', '2012-09-30', false, 'Enfermero en el Hospital Universitario Gregorio Marañón (Madrid). Trabajo en Urgencias (julio-septiembre 2012) y en la Unidad de Onco-Hematología (diciembre 2011 - enero 2012).', 12),
  (p3, 'Hospital Carlos III (Madrid)', 'Enfermero · UCI/Reanimación/UCMA · Medicina Interna', '2011-01-01', '2011-10-31', false, 'Enfermero en el Hospital Carlos III (Madrid). Trabajo en UCI / Reanimación / UCMA (enero-septiembre 2011, 9 meses) y posteriormente en Medicina Interna (septiembre-octubre 2011).', 13),
  (p3, 'SESCAM Hospital La Mancha Centro', 'Enfermero · UCI y REANIMACIÓN', '2009-01-01', '2009-12-31', false, 'Enfermero en el Hospital La Mancha Centro (Alcázar de San Juan, SESCAM). Trabajo en UCI (9 meses) y Reanimación (1 mes).', 14);

-- 4. Cristina Moreno Martín
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p4, 'Unidad de Oxigenación Hiperbárica', 'Dirección Clínica', '2018-01-01', NULL, true, 'Responsable clínica de la unidad: protocolos, indicaciones y seguimiento del paciente. Aplicación de oxigenoterapia hiperbárica en patologías diversas (heridas crónicas, pie diabético, sordera súbita, secuelas oncológicas). Coordinación de equipos médicos, técnicos y de enfermería. Trabajo en entorno clínico privado con cámaras hiperbáricas monoplaza.', 1),
  (p4, 'Consulta Odontológica Privada', 'Odontóloga', '2015-01-01', NULL, true, 'Práctica odontológica clínica privada en paralelo a la dirección de la Unidad HBOT. Atención odontológica general: prevención, conservadora, endodoncia y prótesis. Integración de tratamientos odontológicos con medicina hiperbárica en casos seleccionados (cirugía oral compleja, complicaciones postquirúrgicas, pacientes oncológicos con secuelas mandibulares). Coordinación interdisciplinar entre la consulta odontológica y la unidad hiperbárica para abordaje completo del paciente.', 2),
  (p4, 'ISEIE Innovation School', 'Directora Académica - Medicina Hiperbárica', '2024-01-01', NULL, true, 'Dirección académica del Máster y Diplomado en Medicina Hiperbárica de ISEIE Innovation School. Diseño curricular completo del programa: bases fisiológicas, indicaciones clínicas, protocolos terapéuticos, seguridad operacional de cámaras y manejo de complicaciones. Selección de cuerpo docente con perfil clínico activo en unidades HBOT. Coordinación académica y supervisión de prácticas clínicas. Tutorización de alumnos. Revisión continua de contenidos en función de la evidencia científica más actualizada en oxigenoterapia hiperbárica.', 3);

-- 5. Irene Pulido García
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p5, 'ISEIE Innovation School', 'Directora Académica - Máster en Neuropsicología y Logopedia Clínica', '2024-01-01', NULL, true, 'Dirección y coordinación académica del Máster Profesional en Neuropsicología y Logopedia Clínica de ISEIE Innovation School. Diseño curricular completo: evaluación neuropsicológica, intervención en demencias, rehabilitación cognitiva, abordaje logopédico de trastornos del lenguaje y trabajo con familias. Selección y coordinación del cuerpo docente con experiencia clínica activa. Tutorización de Trabajos Fin de Máster.', 1),
  (p5, 'Alzheimer Catalunya Fundació', 'Neuropsicóloga · Jornada completa', '2024-05-01', NULL, true, 'Neuropsicóloga clínica en Alzheimer Catalunya Fundació (Barcelona), una de las fundaciones de referencia en España en el abordaje de la enfermedad de Alzheimer y otras demencias. Evaluación neuropsicológica con baterías estandarizadas, aplicación de pruebas neuropsicológicas, diagnóstico diferencial de deterioro cognitivo y demencias, e intervención clínica en enfermedades neurodegenerativas. Trabajo terapéutico con pacientes y familias.', 2),
  (p5, 'Universitat de Barcelona', 'Profesora Asociada de Psicobiología', '2023-09-01', '2024-09-30', false, 'Profesora Asociada del área de Psicobiología en la Universitat de Barcelona (jornada parcial). Docencia universitaria en bases biológicas de la conducta y del comportamiento humano. Tutorización del alumnado.', 3),
  (p5, 'Ronda de Dalt Residencial', 'Psicogerontóloga · Jornada completa', '2022-07-01', '2024-05-31', false, 'Psicogerontóloga a jornada completa en residencia geriátrica de Barcelona. Atención psicogerontológica a residentes con demencias y trastornos neurocognitivos. Diseño e implementación de programas individualizados de estimulación cognitiva y rehabilitación. Acompañamiento a familias y cuidadores.', 4),
  (p5, 'FIATC Residencias', 'Psicóloga · Jornada parcial', '2022-03-01', '2022-06-30', false, 'Psicóloga en FIATC Residencias (Barcelona). Atención psicológica a residentes en entorno geriátrico.', 5),
  (p5, 'Hospital Sant Joan de Déu Barcelona', 'Estudiante en Prácticas · Psicología', '2020-10-01', '2021-05-31', false, 'Prácticas clínicas durante el Grado en Psicología en el Hospital Sant Joan de Déu de Barcelona, hospital pediátrico de referencia en Cataluña.', 6);

-- 6. Elena María Granados Alarcón
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p6, 'ISEIE Innovation School', 'Directora Académica - Dermatología, Antiaging y Medicina Estética', '2024-01-01', NULL, true, 'Dirección académica simultánea de dos programas de posgrado en ISEIE Innovation School: Máster en Dermatología y Antiaging y Máster en Medicina Estética. Diseño curricular de ambos con visión integradora alergología-inmunología-dermatología-estética. Coordinación del cuerpo docente. Supervisión académica y de prácticas. Tutorización de TFM.', 1),
  (p6, 'Hospital Ruber Juan Bravo (Complejo Hospitalario)', 'F.E.A. Alergología · Médico Adjunto', '2025-01-01', NULL, true, 'Facultativo Especialista de Área de Alergología en el Hospital Ruber Juan Bravo - Complejo Hospitalario (Madrid). Diagnóstico y seguimiento de pacientes con patología alérgica compleja: respiratoria (rinitis, asma), cutánea (dermatitis atópica, urticaria) y alimentaria. Inmunoterapia y manejo de urgencias alergológicas. Atención hospitalaria y consultas especializadas.', 2),
  (p6, 'Hospital Vithas Internacional', 'F.E.A. Alergología', '2025-01-01', NULL, true, 'Facultativo Especialista de Área de Alergología en el Hospital Vithas Internacional (Madrid). Consulta hospitalaria de alergología con coordinación interdisciplinar con dermatología, neumología, ORL y digestivo en pacientes con comorbilidad. Manejo de pacientes con alergia alimentaria compleja y anafilaxia. Aplicación de protocolos hospitalarios de inmunoterapia.', 3),
  (p6, 'Clínica Betancourt', 'Médico Estético', '2023-01-01', NULL, true, 'Médico Estético en Clínica Betancourt. Práctica clínica en medicina estética facial avanzada con dedicación específica a dermatología y antiaging. Procedimientos: toxina botulínica (manejo de tercio superior), rellenos con ácido hialurónico por tercios faciales, bioestimulación (vitaminas, exosomas, PRP), hilos tensores y peelings químicos. Abordaje integral del envejecimiento cutáneo combinando perspectiva alergológica/inmunológica.', 4),
  (p6, 'MontePediatras', 'Alergóloga Infantil · Jornada parcial', '2023-11-01', NULL, true, 'Alergóloga infantil en MontePediatras (Madrid, presencial, jornada parcial). Atención clínica especializada en pacientes pediátricos con patología alérgica: alergia alimentaria, dermatitis atópica, asma infantil, rinitis y reacciones de hipersensibilidad. Trabajo coordinado con el equipo de pediatría.', 5),
  (p6, 'Hospital Universitario La Paz (SaludMadrid)', 'Alergóloga', '2024-05-01', '2025-03-31', false, 'Alergóloga en el Hospital Universitario La Paz (SaludMadrid), uno de los hospitales públicos de referencia en España. Consulta hospitalaria de alergología.', 6),
  (p6, 'Hospital Universitario Ramón y Cajal', 'Alergóloga · Contrato temporal', '2023-10-01', '2023-11-30', false, 'Contrato temporal como Alergóloga en el Hospital Universitario Ramón y Cajal (Madrid) tras la finalización de su MIR.', 7),
  (p6, 'Hospital Universitario Ramón y Cajal', 'Residente Alergología (MIR) · Jornada completa', '2019-05-01', '2023-05-31', false, 'Especialidad MIR en Alergología en el Hospital Universitario Ramón y Cajal (Madrid) durante 4 años y 1 mes. Formación reglada en consultas pediátricas y de adultos, así como en el Hospital de Día de Alergología. Investigación, formación continua y atención hospitalaria. Coautoría del estudio "A Prospective Validation of a Diagnostic Algorithm for Hypersensitivity Reactions to COVID-19 Vaccines".', 8),
  (p6, 'Aesthetic Hub', 'Médico Estético · Autónomo', '2024-06-01', '2025-03-31', false, 'Médico estético en Aesthetic Hub (Madrid, presencial). Procedimientos de medicina estética facial.', 9),
  (p6, 'Sapphira Privé', 'Médico Estético · Autónomo', '2023-09-01', '2024-06-30', false, 'Médico estético en Sapphira Privé (Madrid, presencial). Tratamientos de medicina estética facial avanzada.', 10),
  (p6, 'Grupostop', 'Médico Estético · Autónomo', '2023-01-01', '2024-07-31', false, 'Médico estético en Grupostop durante 1 año y 7 meses. Procedimientos de medicina estética facial.', 11),
  (p6, 'Clínica de Asma y Alergia Dres. Ojeda', 'Alergóloga · Jornada parcial', '2023-06-01', '2024-06-30', false, 'Alergóloga en la Clínica de Asma y Alergia Dres. Ojeda (Madrid, presencial). Consultas especializadas en patología alérgica.', 12),
  (p6, 'CLINICA CONSTANZA', 'Médico Estético · Autónomo', '2024-01-01', '2024-07-31', false, 'Médico estético en Clínica Constanza. Procedimientos de medicina estética facial.', 13);

-- 7. Iria Graña Somoza
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p7, 'ISEIE Innovation School', 'Directora Académica - Máster en Podología Avanzada', '2025-01-01', NULL, true, 'Dirección académica del Máster en Podología Avanzada de ISEIE Innovation School. Diseño curricular con foco en biomecánica del pie y podología pediátrica. Selección y coordinación del cuerpo docente. Tutorización de alumnos y supervisión de prácticas. Alineación de contenidos con la investigación y evidencia científica más reciente.', 1),
  (p7, 'ILLA DE SALUT DE SILS SL', 'Podóloga · Jornada completa', '2026-05-01', NULL, true, 'Podóloga en los centros médicos de Sils y Blanes (Girona, Cataluña). Práctica clínica en quiropodias, biomecánica, podología pediátrica y atención a pacientes diabéticos. Exploración podológica integral, diseño y adaptación de plantillas y ortesis, procedimientos quiropodológicos y asesoramiento a familias.', 2),
  (p7, 'FISIONAVIA', 'Podóloga · Autónoma', '2025-11-01', '2026-03-31', false, 'Práctica clínica autónoma en podología general y pediátrica en Galicia. Quiropodologia, biomecánica y atención podológica integral.', 3),
  (p7, 'Profesional independiente', 'Apoyo Educativo a Niños de 6 a 14 años', '2017-10-01', '2026-04-30', false, 'Más de ocho años de experiencia continuada como apoyo educativo a niños de entre 6 y 14 años. Refuerzo escolar individualizado, acompañamiento pedagógico y comunicación con familias. Vertiente que ha consolidado su capacidad de comunicación con público infantil, clave en su práctica podológica pediátrica.', 4),
  (p7, 'Clínica PodoSalud', 'Prácticas Clínicas Extracurriculares', '2022-09-01', '2023-06-30', false, 'Prácticas clínicas extracurriculares avanzadas durante el último año del Grado en Podología. Atención clínica supervisada por podólogos senior. Refuerzo de habilidades en exploración biomecánica y procedimientos quiropodológicos. Manejo de plataformas digitales de gestión de pacientes e historias clínicas electrónicas.', 5),
  (p7, 'Sector retail y servicios (Vans, McDonald''s, VICIO, Wonderbox, El Corte Inglés, Grupo Dia, Arenal Perfumerías)', 'Etapa previa - Atención al Cliente y Ventas', '2018-09-01', '2025-11-30', false, 'Etapa previa al ejercicio podológico, simultaneada con los estudios universitarios. Experiencia en distintos sectores: atención al cliente y ventas en moda (Vans), restauración (McDonald''s, VICIO, Nación Pizza & Pasta), retail (El Corte Inglés, Grupo Día, Arenal Perfumerías) y promoción (Wonderbox). Desarrolló habilidades transferibles al ámbito clínico: comunicación con público diverso, orientación al cliente, trabajo bajo presión y gestión de situaciones complejas.', 6),
  (p7, 'Eventos deportivos y festivales', 'Auxiliar Sanitaria y de Seguridad', '2018-04-01', '2019-01-31', false, 'Auxiliar de seguridad y sanitaria en eventos deportivos, festivales y conciertos en Vigo. Primera experiencia en ámbito sanitario antes del grado en Podología.', 7);

-- 8. Julia Bovis Benavides
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p8, 'Multiópticas Bovis Vision', 'Directora Técnica y Optometrista Principal', '2015-01-01', NULL, true, 'Dirección técnica del centro óptico. Supervisión integral de la atención al paciente. Implementación de técnicas avanzadas en adaptación de lentes de contacto (esclerales, multifocales, ortoqueratología). Aplicación de protocolos de control de progresión de miopía. Manejo de pacientes con queratocono y córneas irregulares. Responsabilidad de la formación continua del personal. Diseño de protocolos clínicos y aseguramiento de la calidad asistencial.', 1),
  (p8, 'Fundación Jorge Alió - Prevención de la Ceguera', 'Optometrista Voluntaria', '2014-01-01', NULL, true, 'Colaboración voluntaria en los programas de prevención de la ceguera de la Fundación Jorge Alió, una de las fundaciones oftalmológicas de mayor proyección internacional en España. Atención optométrica a niños y adultos mayores en situación de riesgo: cribado visual, detección temprana de patología ocular, refracción y adaptación de ayudas ópticas. Compromiso social con la salud visual de poblaciones vulnerables y campañas educativas en salud ocular.', 2),
  (p8, 'ISEIE Innovation School', 'Directora Académica - Máster en Optometría Clínica', '2024-01-01', NULL, true, 'Dirección académica del Máster en Optometría Clínica de ISEIE Innovation School. Diseño curricular completo con enfoque en contactología avanzada (lentes esclerales, multifocales, Orto-K), control de progresión de miopía con protocolos clínicos actualizados, manejo de queratocono y córneas irregulares, y patología corneal. Selección y coordinación del cuerpo docente con perfil clínico activo. Tutorización académica de los alumnos. Supervisión de prácticas clínicas. Revisión continua de contenidos en función de la evidencia científica más reciente en optometría clínica.', 3);

-- 9. Lidia Isabel de Sus Martínez
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p9, 'ISEIE Innovation School', 'Directora Académica - Máster en Obesidad y Curso de Dietética y Nutrición', '2024-01-01', NULL, true, 'Dirección académica simultánea del Máster en Obesidad y del Curso de Dietética y Nutrición de ISEIE Innovation School. Diseño curricular con visión integradora: nutrición clínica, salud metabólica, bioética, salud musculoesquelética y abordaje psicológico-conductual. Selección y coordinación del cuerpo docente. Tutorización de Trabajos Fin de Máster.', 1),
  (p9, 'Podoestudio - Clínica de Podología y Biomecánica (Zaragoza)', 'Doctora-Fundadora · Directora Clínica', '2009-01-01', NULL, true, 'Doctora-fundadora del centro Podoestudio (Zaragoza), clínica especializada en Podología y Biomecánica. Más de 17 años de práctica clínica continuada en consulta de Podología Integral. Atención clínica directa, estudios biomecánicos, podología general, podología pediátrica, pie diabético, uñas encarnadas y diseño con personalización de plantillas 100% digitales mediante análisis digital de la marcha. Gestión integral del centro.', 2),
  (p9, 'Universidad de Zaragoza · Formación Independiente', 'Investigadora y Docente en Ciencias de la Salud · Profesional Independiente', '2024-12-01', NULL, true, 'Investigadora y Docente en Ciencias de la Salud vinculada a la Universidad de Zaragoza y como formadora independiente (modalidad híbrida, Zaragoza). Investigación original sobre biomecánica del pie infantil e Índice de Masa Corporal (IMC). Docencia universitaria, redacción de textos científicos y publicaciones académicas. Diseño de módulos e-learning. Aplicación de medicina basada en pruebas.', 3),
  (p9, 'Universidad de Zaragoza y entornos académicos', 'Investigadora · Publicaciones Científicas y Revisión por Pares', '2015-01-01', NULL, true, 'Producción científica continuada con publicaciones académicas en revistas indexadas en Journal Citation Reports (JCR). Colaboración como revisora científica en la Revista Española de Salud Pública del Ministerio de Sanidad. Líneas de investigación: biomecánica del pie infantil, impacto del IMC en salud musculoesquelética y metabólica, abordaje multidisciplinar de la obesidad y protocolos clínicos basados en evidencia. Comunicaciones en congresos científicos.', 4);

-- 10. Luz Marina Zuluaga Ríos
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p10, 'Hospital San Juan de Dios - Cartago (Colombia)', 'Médico Cirujano', '2020-01-01', NULL, true, 'Práctica médica y quirúrgica en cirugía de pie diabético y enfermedad vascular periférica. Atención clínica integral de pacientes con patología cardiovascular, pulmonar y metabólica. Manejo perioperatorio del paciente diabético complejo. Trabajo en hospital de referencia regional en el Valle del Cauca colombiano con enfoque multidisciplinar (medicina interna, vascular, endocrinología, rehabilitación).', 1),
  (p10, 'Universidad Complutense de Madrid', 'Profesora Catedrática', '2019-01-01', NULL, true, 'Docencia universitaria de pregrado en la Facultad de Medicina de la Universidad Complutense de Madrid, una de las facultades de medicina de referencia en España. Áreas: Morfofisiología (anatomía, histología, fisiología) y Farmacología clínica. Formación de futuros médicos en las bases biológicas de la medicina. Participación en líneas de investigación clínica y publicaciones científicas. Tutorización de alumnos de pregrado y posgrado.', 2),
  (p10, 'Universidad Complutense de Madrid', 'Fellow en Cirugía de Pie Diabético', '2017-01-01', '2018-12-31', false, 'Programa de especialización (Fellow) en Cirugía de Pie Diabético en la Universidad Complutense de Madrid, una de las escuelas de referencia mundial en la patología del pie diabético. Formación intensiva en abordaje quirúrgico de la úlcera diabética, revascularización del miembro inferior, salvamento de extremidad y manejo perioperatorio del paciente diabético complejo. Trabajo en equipo multidisciplinar (vascular, traumatología, endocrinología, rehabilitación).', 3),
  (p10, 'Fundación Favaloro / Hospital María Ferrer (Argentina)', 'Rehabilitación Cardiopulmonar', '2013-01-01', '2016-12-31', false, 'Experiencia clínica en rehabilitación cardiopulmonar en dos hospitales argentinos de alta complejidad: la Fundación Favaloro (institución cardiovascular de referencia mundial fundada por el Dr. René Favaloro) y el Hospital de Rehabilitación Respiratoria María Ferrer. Atención de pacientes críticos en Unidades de Terapia Intensiva con patología cardiovascular y respiratoria. Diseño de programas de rehabilitación cardiopulmonar individualizados.', 4),
  (p10, 'ISEIE Innovation School', 'Directora Académica - Curso de Podología Pediátrica', '2024-01-01', NULL, true, 'Dirección académica del Curso de Podología Pediátrica de ISEIE Innovation School. Diseño curricular y aporte de visión médica al abordaje multidisciplinar del pie infantil: biomecánica, perspectiva vascular, neurológica y metabólica. Selección y coordinación del cuerpo docente. Supervisión académica de prácticas. Tutorización de alumnos.', 5);

-- 11. María Dolores Flores Romero
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p11, 'ISEIE Innovation School', 'Directora Académica - Tratamiento del Acné y Micropigmentación', '2024-01-01', NULL, true, 'Dirección académica simultánea de tres programas en ISEIE Innovation School: Máster en Tratamiento Integral del Acné, Curso de Tratamiento del Acné y Curso de Micropigmentación. Diseño curricular desde una perspectiva integradora: química aplicada, formulación dermocosmética, fisiopatología cutánea y abordaje clínico-estético. Selección y coordinación del cuerpo docente. Supervisión académica.', 1),
  (p11, 'CODEXSA Geotecnia y Control de Calidad', 'Quality Assurance Specialist', '2024-01-01', NULL, true, 'Quality Assurance Specialist en CODEXSA Geotecnia y Control de Calidad. Aplicación de su experiencia química y de control de calidad al sector de geotecnia.', 2),
  (p11, 'Delegación de Educación · Junta de Andalucía', 'Profesora', '2017-11-01', NULL, true, 'Profesora en la Delegación de Educación de la Junta de Andalucía (Sevilla y alrededores). Docencia oficial en el sistema educativo público andaluz.', 3),
  (p11, 'Junta de Andalucía', 'Docente Secundaria y Bachillerato', '2017-01-01', NULL, true, 'Docente oficial de Secundaria y Bachillerato en el sistema público de la Junta de Andalucía. Imparte materias científicas según currículo oficial.', 4),
  (p11, 'Colegio Sagrada Familia (Dos Hermanas, Sevilla)', 'Profesora de Ciencias - Secundaria', '2015-09-01', NULL, true, 'Profesora de Ciencias en educación secundaria en el Colegio Sagrada Familia (Dos Hermanas). Docencia continuada desde septiembre 2015 (más de 10 años).', 5),
  (p11, 'Colegio Concertado La Inmaculada (Morón de la Frontera, Sevilla)', 'Profesora de Ciencias', '2014-09-01', '2015-03-31', false, 'Profesora de Matemáticas (1º ESO), Ciencias Naturales (1º y 2º ESO), Biología y Geología (3º ESO), Física y Química (3º y 4º ESO), Tecnología (2º y 3º ESO) y Proyecto Integrado (4º ESO).', 6),
  (p11, 'OVOPAK', 'Responsable del Departamento de Calidad', '2011-07-01', '2013-09-30', false, 'Responsable del Departamento de Calidad en OVOPAK (Sevilla) durante 2 años y 3 meses. Funciones: gestión de calidad e implantación de Normas ISO, BRC e IFS; gestión de reclamaciones de clientes; formación continua de operarios; control fisicoquímico, biológico e instrumental de la producción en laboratorio.', 7),
  (p11, 'Universidad de Sevilla - Facultad de Química', 'Investigadora Predoctoral · Grupo Dra. Carmen Ortiz Mellet', '2011-03-01', '2011-10-31', false, 'Investigadora Predoctoral en el grupo de investigación de la Dra. Carmen Ortiz Mellet (Catedrática de Universidad), Departamento de Química Orgánica de la Facultad de Química de la Universidad de Sevilla. Coautora de la publicación "Síntesis de Hetarilén Aminopolioles como precursores de moléculas bioactivas".', 8),
  (p11, 'Universidad de Sevilla', 'Becaria - Servicio de Prevención de Riesgos Laborales', '2010-01-01', '2010-06-30', false, 'Beca concedida por la Universidad de Sevilla para realizar tareas de Prevención de Riesgos Laborales en dependencias de la Universidad.', 9),
  (p11, 'Beer&Food · HEINEKEN España', 'Analista de Laboratorio · Controller', '2009-01-01', '2009-12-31', false, 'Analista de Laboratorio en Beer&Food / Heineken España (Sevilla). Control fisicoquímico, biológico e instrumental de la producción (cerveza). Control de calidad y trazabilidad. Posteriormente Controller en HEINEKEN España.', 10),
  (p11, 'AulaForum Academia', 'Docente Secundaria y Bachillerato', '2009-01-01', '2010-12-31', false, 'Docencia en academia de refuerzo y preparación para Secundaria y Bachillerato durante 1 año.', 11);

-- 12. María Pedreira Pernas
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p12, 'ISEIE Innovation School', 'Directora Académica - Curso de Auxiliar de Enfermería y Curso Paramédico', '2024-01-01', NULL, true, 'Dirección académica del Curso de Auxiliar de Enfermería y del Curso Paramédico en ISEIE Innovation School. Diseño curricular completo de ambos programas: bases anatómicas y fisiológicas, técnicas asistenciales, soporte vital, atención al paciente crítico, comunicación con paciente y familia, ética profesional. Selección y coordinación del cuerpo docente. Tutorización del alumnado.', 1),
  (p12, 'Sergas - Servizo Galego de Saúde', 'Enfermera Familia y Comunitaria · Jornada completa', '2000-06-01', NULL, true, 'Más de 26 años como Enfermera Especialista en Familia y Comunitaria (EFyC) a jornada completa en el Servizo Galego de Saúde en La Coruña. Asistencia sanitaria comunitaria, acción comunitaria, cuidado integral del paciente y trabajo en equipos multidisciplinares de Atención Primaria. Aplicación de protocolos clínicos, educación sanitaria a pacientes y familias, seguimiento de patología crónica y atención a poblaciones vulnerables.', 2),
  (p12, 'Educación Secundaria (Funcionaria)', 'Profesora Funcionaria', '2024-09-01', NULL, true, 'Profesora Funcionaria en educación secundaria en La Coruña desde septiembre 2024. Docencia oficial reglada en el sistema público gallego.', 3),
  (p12, 'Varios Centros Formativos', 'Profesora · Jornada parcial', '2010-09-01', NULL, true, 'Más de 15 años de docencia continuada en jornada parcial en distintos centros formativos. Compatibilizada con la práctica asistencial en Sergas. Imparte programas de formación continua para personal sanitario en urgencias y emergencias, Soporte Vital Básico (SVB) y Soporte Vital Avanzado (SVA), reanimación cardiopulmonar y nutrición aplicada a la enfermería. Asignaturas: Documentación Sanitaria, Anatomía Patológica, Dietética e Higiene Bucodental.', 4),
  (p12, 'Urgencias Sanitarias de Galicia (Servizo Galego de Saúde)', 'Coordinadora de Enfermería', '2015-01-01', NULL, true, 'Coordinadora de Enfermería en las Urgencias Sanitarias de Galicia. Responsable de la gestión del personal sanitario y la mejora continua de procesos operativos asistenciales en el sistema de urgencias gallego.', 5);

-- 13. Miguel Ángel Vega Maqueda
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p13, 'Servicio Andaluz de Salud (SAS) - Unidades hospitalarias', 'Técnico en Cuidados Auxiliares de Enfermería (TCAE)', '2005-01-01', NULL, true, 'más de 20 años de práctica clínica continuada como TCAE en unidades hospitalarias del Servicio Andaluz de Salud. Funciones asistenciales: cuidados básicos del paciente, higiene y movilización, apoyo en procedimientos médicos y quirúrgicos, preparación de material clínico, esterilización, manejo de muestras biológicas. Trabajo en equipos multidisciplinares (enfermería, medicina, técnicos especialistas). Experiencia transversal con paciente hospitalizado en unidades diversas. Visión integral del funcionamiento real de la unidad médica y del proceso reproductivo desde la perspectiva del paciente. Capacidad excepcional de acompañamiento emocional en procesos médicos complejos.', 1),
  (p13, 'Hospital Universitario Virgen del Rocío (Sevilla)', 'Formación especializada - Reproducción Asistida', '2023-09-01', '2024-06-30', false, 'Formación especializada en la Unidad de Reproducción Asistida del Hospital Universitario Virgen del Rocío de Sevilla, una de las unidades de reproducción de mayor prestigio en España. Perfeccionamiento de competencias técnicas en: fecundación in vitro convencional (FIV) e inyección intracitoplasmática de espermatozoides (ICSI), criobiología y vitrificación de gametos y embriones, manejo avanzado de muestras seminales y oocitos, preparación de medios de cultivo, control de calidad del laboratorio FIV. Práctica en entorno hospitalario de alta complejidad y exposición a casos clínicos diversos.', 2),
  (p13, 'ISEIE Innovation School', 'Director Académico - Reproducción Asistida Avanzada', '2025-01-01', NULL, true, 'Creación, coordinación y dirección del Máster en Reproducción Asistida Avanzada de ISEIE Innovation School. Diseño curricular completo del programa con foco en tres dimensiones: excelencia técnica de laboratorio (FIV/ICSI, criobiología, DGP), humanización del tratamiento (acompañamiento emocional del paciente) y ética profesional. Selección y coordinación del cuerpo docente con perfil clínico-investigador. Tutorización y supervisión académica. Diseño de prácticas en entornos clínicos reales. Revisión continua de contenidos en función de la evidencia científica más reciente en reproducción humana asistida.', 3);

-- 14. Rosa Inmaculada Monje López
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p14, 'Escuela ESTENA', 'Profesora Titular', '2018-01-01', NULL, true, 'Docencia continuada en la Escuela ESTENA. Asignaturas impartidas: Fisiología Humana, Nutrición aplicada a patologías, Fisiopatología y Biología. Diseño de materiales docentes y unidades didácticas integrando bases biológicas y aplicación clínica. Coordinación pedagógica del área. Tutorización del alumnado en proyectos académicos. Evaluación continua y diseño de pruebas que reflejen la transferencia real a la práctica nutricional.', 1),
  (p14, 'Fundación Natzaret', 'Nutricionista', '2018-01-01', NULL, true, 'Nutricionista clínica en la Fundación Natzaret, entidad de atención a menores en situación de vulnerabilidad. Elaboración de menús saludables adaptados a niños y adolescentes con condiciones específicas (alergias e intolerancias alimentarias, diabetes infantil, trastornos digestivos, problemas de peso). Evaluación nutricional periódica de los menores y seguimiento individualizado. Educación nutricional grupal e individual. Coordinación interdisciplinar con equipos educativos, psicológicos y sanitarios.', 2),
  (p14, 'Nutrición Integrativa (proyecto propio)', 'Fundadora y Nutricionista Online', '2020-01-01', NULL, true, 'Fundadora y responsable clínica del proyecto Nutrición Integrativa (nutricionintegrativa.online). Consulta nutricional 100% online a nivel nacional e internacional. Enfoque integrativo basado en evidencia que combina nutrición clínica, ciencia de la microbiota intestinal y bases biológicas. Diseño de planes nutricionales personalizados para patologías digestivas, sobrepeso/obesidad, salud hormonal y bienestar global. Divulgación científica de calidad en su canal propio.', 3),
  (p14, 'Hospital de Manacor', 'Supervisora de Calidad Hospitalaria', '2010-01-01', '2017-12-31', false, 'Supervisora de Calidad en el Hospital de Manacor (Mallorca) durante más de 7 años. Implementación y mantenimiento de sistemas de calidad sanitaria. Responsable de procesos de higiene hospitalaria. Aplicación, auditoría interna y certificación de normativa ISO. Coordinación con servicios clínicos para asegurar el cumplimiento de protocolos de seguridad del paciente. Formación interna del personal sanitario en estándares de calidad.', 4),
  (p14, 'Sercool Insular S.A.', 'Responsable de Calidad', '2008-01-01', '2010-12-31', false, 'Responsable de Calidad en Sercool Insular S.A. (Baleares). Gestión integral de procesos clave de calidad. Implementación y mantenimiento de normativa ISO. Auditorías internas y externas. Documentación regulatoria. Formación del personal en estándares y procedimientos. Reporte directo a dirección operativa.', 5),
  (p14, 'ISEIE Innovation School', 'Directora Académica - Nutrición y Nutrición Bariátrica', '2024-01-01', NULL, true, 'Dirección académica simultánea de tres programas en ISEIE Innovation School: Diplomado en Nutrición Bariátrica, Curso de Nutrición Bariátrica y Curso de Nutrición. Diseño curricular con visión integradora poco habitual: biología, nutrición clínica, microbiota y abordaje del paciente bariátrico. Selección y coordinación del cuerpo docente. Tutorización académica. Supervisión de prácticas. Aporte de su perspectiva multidisciplinar (científica, clínica y de gestión sanitaria) al programa formativo.', 6);

-- 15. Rubén Broncano Martínez
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p15, 'ISEIE Innovation School', 'Director Académico - Máster, Diplomado y Curso de Psicología Bariátrica', '2024-01-01', NULL, true, 'Dirección académica simultánea de tres programas de Psicología Bariátrica en ISEIE Innovation School: Máster, Diplomado y Curso. Diseño curricular con foco en abordaje psicoanalítico de los trastornos del comportamiento alimentario, intervención psicológica en cirugía bariátrica, regulación emocional, psicoeducación y prevención de recaídas. Selección y coordinación del cuerpo docente. Tutorización académica.', 1),
  (p15, 'Psicología Empresarial Online (España) / Presencial (Barcelona)', 'Psicólogo Empresarial · Autónomo · Híbrido', '2025-07-01', NULL, true, 'Psicólogo Empresarial autónomo en consulta híbrida (online en España, presencial en Barcelona). Abordaje desde el psicoanálisis aplicado al ámbito organizacional: absentismo laboral, rotación en las empresas, resolución de conflictos internos, motivación de equipos, contratación laboral y selección de personal mediante plataformas sociales. Aplicación de tests psicotécnicos y entrevistas motivacionales.', 2),
  (p15, 'Academia de Pensamiento Libre (Granollers)', 'Director · Profesional Independiente', '2021-12-01', NULL, true, 'Director y fundador de la Academia de Pensamiento Libre (Granollers, Cataluña). Más de 4 años dirigiendo una entidad propia desde la que se imparten cursos de Pensamiento Contemporáneo, Historia, Filosofía y Economía Clásica, Psicología y Psicoanálisis. Atención psicológica a nivel mundial en idioma español.', 3),
  (p15, 'Consulta Privada Online', 'Psicólogo · Profesional Independiente · En Remoto', '2023-01-01', NULL, true, 'Psicólogo en consulta privada online desde Riells i Viabrea (Cataluña), atendiendo a pacientes a nivel mundial en idioma español. Abordaje psicoanalítico y de psicoterapia lógico-racional. Colaboraciones con las principales mutuas privadas de salud de España: Sanitas, Aegon, Caser, Cigna, DKV y Adeslas.', 4),
  (p15, 'Editorial Círculo Rojo / Amazon', 'Autor y Conferenciante', '2022-01-01', NULL, true, 'Autor de "Manuscritos de Psicoanálisis" (Editorial Círculo Rojo, 2022) y de "Psicoanálisis del Juego de la Oca" (Amazon). Ponente regular en eventos del ámbito de la salud mental: conferencias, mesas redondas, formaciones online. Divulgación continuada en redes sociales especializadas (1.453+ seguidores en LinkedIn).', 5);

-- 16. Susana Lucas Ballesteros
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p16, 'ISEIE Innovation School', 'Directora Académica - Reflexología, Auxiliar de Estética y Auxiliar de Podología', '2024-01-01', NULL, true, 'Dirección académica simultánea de tres cursos en ISEIE Innovation School: Curso de Auxiliar de Podología, Curso de Reflexología Podal y Curso Auxiliar de Estética. Diseño curricular con visión hospitality y sanitaria. Selección y coordinación del cuerpo docente. Tutorización académica del alumnado.', 1),
  (p16, 'Wellnity Studio', 'CEO y Fundadora · Autónomo', '2025-01-01', NULL, true, 'CEO y Fundadora de Wellnity Studio (modalidad híbrida, España). Mentora de profesionales wellness. Guía a personas y parejas a fortalecer su conexión y bienestar a través de un enfoque que une la terapia, el tacto y la palabra. Wellnity Space es la plataforma para escalar negocios wellness con herramientas, cursos y comunidad. Estrategia de marca, consultoría estratégica y desarrollo de negocio en el sector bienestar.', 2),
  (p16, 'CESAE Business&Tourism School', 'Tutora · Programa Superior en Wellness & Spa', '2023-11-01', NULL, true, 'Tutora del Programa Superior en Wellness & Spa de CESAE Business&Tourism School (profesional independiente). Mentoría profesional, seguimiento de proyectos y formación en programas de bienestar y gestión de spa. Más de 2 años acompañando a profesionales en su formación especializada.', 3),
  (p16, 'SUITOPIA HOTEL SL (Calpe, 5★)', 'Spa Manager · Jornada completa', '2022-07-01', '2025-06-30', false, 'Spa Manager en SUITOPIA HOTEL SL (Calpe, Comunidad Valenciana) durante 3 años. Lideró la dirección y coordinación integral de departamentos de bienestar, con el objetivo de crear experiencias memorables y fomentar un profundo sentido de bienestar en los clientes.', 4),
  (p16, 'The Wellness Team - Formación Alto Rendimiento para Spas', 'CEO y Fundadora', '2018-01-01', '2025-06-30', false, 'CEO y Fundadora de The Wellness Team durante 7 años (2018-2025). Empresa dedicada a formación de alto rendimiento para spas. Lideró el desarrollo estratégico y operativo de negocios en el sector del bienestar, lo que le brindó una profunda comprensión del cliente y del ecosistema del bienestar.', 5),
  (p16, 'VIVOOD Landscape Hotels (5★)', 'Spa Manager · Jornada completa', '2022-03-01', '2022-07-31', false, 'Spa Manager en VIVOOD Landscape Hotels (Benimantell, Comunidad Valenciana) durante 5 meses. Gestión integral del Spa de un hotel-resort 5 estrellas reconocido por su arquitectura y filosofía de paisaje.', 6),
  (p16, 'InterContinental Mar Menor Golf Resort & Spa (5★)', 'Spa Manager', '2015-12-01', '2016-12-31', false, 'Spa Manager en el Hotel InterContinental Mar Menor (Murcia) durante 1 año. Dirección y coordinación del Departamento Wellness: captación, recepción y fidelización de clientes; definición y puesta en marcha de protocolos generales de gestión de reservas, terapeutas y recepcionistas; protocolos de control y gestión de caja; auditorías de calidad según estándares de la marca; control de escandallos y stock; estudio y realización de menú de tratamientos y servicios; control de presupuesto, compras y aparatología; análisis y puesta en marcha de ofertas y acciones de marketing (intervención en programas de radio); gestión de quejas; formación del equipo en técnicas y protocolos de masaje, tratamientos faciales y corporales; coaching motivacional y trabajo en equipo.', 7),
  (p16, 'Hospes Alicante (5★)', 'Spa Manager', '2013-02-01', '2015-02-28', false, 'Spa Manager en Hospes Alicante durante 2 años. Dirección del departamento Wellness del Hotel. Reapertura y puesta en marcha de acciones para el nuevo funcionamiento del Spa. Captación, recepción y fidelización de clientes. Definición y puesta en marcha de protocolos generales de gestión de reservas y labor de terapeutas. Auditorías de calidad según estándares de la marca. Control de escandallos, stock, presupuesto. Análisis y puesta en marcha de acciones de marketing. Gestión de quejas. Formación del equipo. Coaching motivacional.', 8),
  (p16, 'Hilton Buenavista Toledo (5★)', 'Spa Coordinator y Terapeuta', '2011-01-01', '2013-01-31', false, 'Spa Coordinator y Terapeuta en el Hotel Hilton Buenavista Toledo (5 estrellas) durante 2 años. Liderazgo en Experiencias de Gran Lujo: contribuyó activamente a la dirección y coordinación del Departamento Wellness, asegurando la fluidez operativa y la calidad de los servicios. Fidelización y atención a Clientes VIP. Formación y empoderamiento de equipos en técnicas avanzadas y protocolos. Gestión de agenda y protocolos. Actuó como "Manager on Duty", aportando una visión integral en la dirección general del hotel durante fines de semana.', 9),
  (p16, 'Hesperia Lanzarote (5★)', 'Terapeuta Manual', '2009-04-01', '2011-03-31', false, 'Terapeuta Manual en el Hotel Hesperia Lanzarote durante 2 años. Aplicación de técnicas manuales: quiromasaje, masaje deportivo, reflexología podal, drenaje linfático y masaje tailandés.', 10),
  (p16, 'B&B Estética Natural y Terapias Manuales', 'CEO y Fundadora · Autónomo', '2004-01-01', '2008-12-31', false, 'Primer emprendimiento propio: CEO y Fundadora de B&B Estética Natural y Terapias Manuales en Murcia durante 5 años (2004-2008). Práctica clínica directa, gestión integral del centro y atención al cliente.', 11);

-- 17. Yacnira Loreleis Martínez Bazán
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p17, 'ISEIE Innovation School', 'Directora Académica - Máster en Anestesiología y Reanimación', '2024-01-01', NULL, true, 'Dirección académica del Máster en Anestesiología y Reanimación de ISEIE Innovation School. Diseño curricular: bases farmacológicas, técnicas de anestesia general y regional, manejo perioperatorio, reanimación avanzada, manejo de vía aérea, anestesia en subespecialidades. Selección y coordinación del cuerpo docente.', 1),
  (p17, 'Hospital Virgen de la Peña - Servicio Canario de Salud', 'Anestesista · Jornada completa', '2021-09-01', NULL, true, 'Anestesista a jornada completa en el Hospital Virgen de la Peña (Fuerteventura, Servicio Canario de Salud). Práctica anestésica completa: anestesia regional, anestesia general, soporte vital básico, manejo perioperatorio del paciente quirúrgico, manejo de vía aérea, reanimación cardiopulmonar. Atención hospitalaria especializada en quirófano y unidades postoperatorias.', 2),
  (p17, 'Carrera Médica como Anestesióloga (Cuba y España)', 'Médico Anestesiólogo · Especialista en Anestesiología y Reanimación', '1996-11-01', NULL, true, 'Casi 30 años de trayectoria continuada como médico anestesiólogo desde noviembre 1996. Especialista en Anestesiología y Reanimación desde el año 2001 (tras finalizar su Especialidad en Cuba). Práctica clínica en hospitales de Cuba y España. Profesora Universitaria con categoría Auxiliar e Investigadora Auxiliar.', 3),
  (p17, 'Sociedad Cubana de Anestesiología y Reanimación', 'Ex-Presidenta del Capítulo Granma', '2015-01-01', '2020-12-31', false, 'Liderazgo durante 5 años del Capítulo Granma de la Sociedad Cubana de Anestesiología y Reanimación, sociedad científica nacional. Representación institucional de la especialidad. Coordinación de actividades formativas regionales: cursos, talleres, jornadas. Participación en política científica de la especialidad a nivel nacional. Organización de congresos y eventos científicos regionales.', 4),
  (p17, 'Universidad de Ciencias Médicas de Granma (Cuba)', 'Profesora Universitaria Auxiliar · Investigadora Auxiliar', '2010-01-01', NULL, true, 'Profesora Universitaria con categoría Auxiliar e Investigadora Auxiliar en la Universidad de Ciencias Médicas de Granma. Docencia universitaria en programas de formación médica especializada. Tutorización de residentes y profesionales en formación.', 5),
  (p17, 'Producción Científica - Revistas Cubanas y Extranjeras', 'Autora Científica', '2010-01-01', NULL, true, 'Más de 20 publicaciones científicas en revistas cubanas y extranjeras del ámbito de la anestesiología y reanimación. Comunicaciones científicas en congresos nacionales e internacionales: SEDAR (Sociedad Española de Anestesiología), Congresos Cubanos de Anestesiología y eventos panamericanos de la especialidad.', 6);

-- 18. Dra. María Josep Albert López
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p18, 'Clínica Albert y Barber (Valencia)', 'Co-directora - Odontología Avanzada y Estética Facial', '2017-01-01', NULL, true, 'Co-dirección clínica de la Clínica Albert y Barber (Valencia), centro de referencia que integra odontología avanzada y estética facial en un mismo espacio asistencial. Atención clínica integral del paciente combinando periodoncia, osteointegración e implantes dentales, estética dental, ortodoncia y estética facial. Procedimientos quirúrgicos: cirugía periodontal, injertos de tejido blando, regeneración ósea, implantes dentales. Tratamientos estéticos faciales: toxina botulínica, rellenos con ácido hialurónico, diseño digital de sonrisa (DSD). Coordinación del equipo clínico y desarrollo del proyecto de marca de la clínica.', 1),
  (p18, 'Universidad Católica de Valencia "San Vicente Mártir" (UCV)', 'Profesora Asociada', '2016-01-01', NULL, true, 'Profesora Asociada en la Facultad de Odontología de la Universidad Católica de Valencia (UCV), donde realizó su Licenciatura y su Máster en Periodoncia. Docencia universitaria en áreas de periodoncia, cirugía oral y estética dental. Formación de futuros profesionales con visión clínica y rigor académico. Supervisión de prácticas clínicas en el ámbito universitario. Tutorización de alumnos en pregrado y posgrado.', 2),
  (p18, 'Congresos y Formaciones del Sector', 'Ponente Especializada en Estética Facial y Odontología', '2018-01-01', NULL, true, 'Participación regular como ponente en formaciones y congresos del sector odontológico y de medicina estética facial. Charlas técnicas sobre periodoncia estética, sonrisa gingival, integración odontología-estética facial y diseño digital de sonrisa (DSD). Visibilidad en la comunidad profesional reflejada en su verificación como Top Doctors España. Networking activo con la comunidad odontológica y de medicina estética nacional.', 3),
  (p18, 'ISEIE Innovation School', 'Directora Académica - Máster en Odontología Digital', '2024-01-01', NULL, true, 'Dirección académica del Máster en Odontología Digital de ISEIE Innovation School. Diseño curricular del programa con foco en: flujo de trabajo digital completo (escáner intraoral, CAD/CAM, cirugía guiada por ordenador), diseño digital de sonrisa (DSD), planificación digital de implantes, prótesis CAD/CAM. Coordinación del cuerpo docente con perfil clínico activo en odontología digital. Supervisión académica y de prácticas. Tutorización del alumnado. Revisión continua de contenidos en función de la innovación tecnológica del sector.', 4);

-- 19. Luis David Romero García
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p19, 'ISEIE Innovation School', 'Director Académico - Curso de Odontología Forense · Profesional Independiente · En Remoto', '2025-09-01', NULL, true, 'Director Académico del Curso de Odontología Forense en ISEIE Innovation School (modalidad remota, Comunidad de Madrid). Diseño curricular completo del programa: identificación odontológica de víctimas, valoración de lesiones bucodentales en casos de violencia, análisis de marcas de mordedura, estimación de edad por desarrollo dental, peritaje odontológico judicial. Selección del cuerpo docente con perfil pericial activo. Coordinación académica.', 1),
  (p19, 'Universitat de València', 'Perito Especializado · Profesional Independiente', '2024-01-01', NULL, true, 'Perito Especializado vinculado a la Universitat de València. Odontólogo colegiado con formación especializada en Medicina Forense a través del Máster de Formación Permanente en la Universitat de València. Ofrece servicios de peritaje forense en evaluaciones dentales, identificación mediante registros odontológicos, estimación de edad y análisis de lesiones relacionadas con accidentes laborales, siniestros personales o casos judiciales. Comprometido con la precisión y el rigor científico para apoyar procesos legales e investigaciones. Disponible para colaboraciones con mutuas, aseguradoras y entidades judiciales en España.', 2),
  (p19, 'Comunidad de Madrid', 'Asesor y Experto en Acreditaciones de Competencias Profesionales de Sanidad', '2023-05-01', NULL, true, 'Profesional especializado en el asesoramiento y la acreditación de competencias profesionales en el sector de la sanidad, con enfoque específico en la Comunidad de Madrid. Guía a profesionales y organizaciones para que cumplan con los estándares de calidad y certificación exigidos, optimizando sus habilidades y asegurando la excelencia en la práctica sanitaria. Combina experiencia técnica con compromiso por facilitar procesos de acreditación efectivos y adaptados a las necesidades del ámbito de la salud.', 3),
  (p19, 'Clínica D Dental', 'Dentistry · Autónomo', '2021-01-01', NULL, true, 'Dentistry en Clínica D Dental (Santa Eulària des Riu, Islas Baleares) como autónomo desde enero 2021. Práctica clínica integral en odontología general y cirugía oral: endodoncias, cirugía oral ambulatoria, implantología dental, restauración dental y odontología conservadora.', 4),
  (p19, 'Centro de Diagnóstico Ibiza', 'Dentistry, Oral Surgeon · Assistant Manager · Radiological Equipment Director', '2013-06-01', '2022-10-31', false, 'Práctica clínica continuada durante 9 años 5 meses en el Centro de Diagnóstico Ibiza. Roles: Bachelor of Dental Surgery, Master of Science in Dental Surgery, Assistant Manager, Radiological Equipment Director, CBCT and Oral Diagnosis, Assistant Manager of MRI. Atención odontológica general y especializada, cirugía oral, diagnóstico radiológico avanzado mediante CBCT (Cone Beam CT) y MRI dental, imágenes médicas y diagnóstico oral.', 5),
  (p19, 'Expansión Vitaldent', 'Clinical Director · Madrid', '2008-01-01', '2009-12-31', false, 'Clinical Director en Expansión Vitaldent (Madrid). Management clinic durante 2 años: dirección clínica, supervisión del equipo y operación de la clínica dental.', 6),
  (p19, 'Clínicas Unidental', 'Associate Dentist · Madrid', '2007-01-01', '2008-12-31', false, 'Associate Dentist en Clínicas Unidental (Madrid). Management clinic durante 2 años.', 7),
  (p19, 'Clínica Dental Dr. Romero', 'Dentist, Oral Surgeon · Clinic Director / Owner · México', '2001-01-01', '2006-08-31', false, 'Clínica propia: Clinic Director y Owner de la Clínica Dental Dr. Romero (Naucalpan de Juárez, México) durante más de 5 años. Atención clínica integral, cirugía oral, endodoncias y dirección clínica del centro.', 8),
  (p19, 'Clínica Dental México', 'Oral Surgeon · México', '2003-01-01', '2003-12-31', false, 'Oral Surgeon en Clínica Dental México (México DF) durante 1 año. Práctica de cirugía oral con base en Bachelor of Dentistry y Bachelor of Surgery.', 9),
  (p19, 'Clínica Privada Londres', 'General Dentistry · México DF', '2001-01-01', '2003-12-31', false, 'General Dentistry en Clínica Privada Londres (México DF) durante 3 años. Práctica clínica con base en MBBS (Bachelor of Medicine, Bachelor of Surgery).', 10),
  (p19, 'Harvard Dental Clinics of Mexico', 'Certified Dental Assistant - Orthodontic Area', '1998-01-01', '2001-06-30', false, 'Certified Dental Assistant en Harvard Dental Clinics of Mexico (Naucalpan de Juárez) durante 3 años 6 meses. Asistencia clínica en el área de Ortodoncia.', 11),
  (p19, 'University of Toronto (Canadá)', 'Investigador · Academic Unit of Biological and Diagnostic Sciences - Preventive Dentistry', '2000-01-01', '2000-07-31', false, 'Investigador en la Academic Unit of Biological and Diagnostic Sciences en Preventive Dentistry de la University of Toronto (Canadá) durante 7 meses. Tesina: "Pit and Fissure Sealants Analysis: In Vitro Study using a Scanning Electron Microscope (SEM)" / "Análisis de Selladores y Fisuras: Estudio In Vitro con Microscopio Electrónico de Barrido".', 12);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Ramón Miralles López
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p1, 'Universitat de Barcelona', 'Formación Universitaria', 'Derecho · Privacidad · Ciberseguridad · Compliance', '1985-09-01', NULL, 1);

-- 2. Mildreth Plata López
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p2, 'Universitat Jaume I (UJI)', 'Doctorado (Sobresaliente Cum Laude)', 'Educación · Gestión de la Investigación Educativa · Tesis: "Aprendizaje servicio basado en el arte: estudio de caso para la transformación social" (Grupo MEICRI)', '2017-09-01', '2023-03-31', 1),
  (p2, 'Universidad Complutense de Madrid (UCM)', 'Máster Avanzado', 'Educación Primaria · Nota final: 7,72', '2012-09-01', '2015-06-30', 2),
  (p2, 'Universidad Externado de Colombia', 'Magíster', 'Administración y Supervisión Educativa · Dirección y/o Coordinación de Centros Educativos', '1999-01-01', '2001-12-31', 3),
  (p2, 'Universidad (Colombia)', 'Especialización', 'Informática para la Gestión del Talento Humano y Edumática con énfasis en Comunicación Electrónica', '2001-01-01', '2003-12-31', 4),
  (p2, 'UNIMINUTO Colombia', 'Licenciatura', 'Básica Primaria con énfasis en Estética · Artes Plásticas', '1992-01-01', '1996-12-31', 5),
  (p2, 'Labora - Servicio Valenciano para el Empleo', 'Certificación Profesional (520 horas)', 'Dinamización de Proyectos Culturales · Gestión de Recursos Humanos (FCC99/2020/109/12)', '2021-01-01', '2021-12-31', 6);

-- 3. Alberto Jurado Arévalo
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p3, 'Universitat Autònoma de Barcelona (UAB)', 'Medical Degree (Grado en Medicina)', 'Medicina', '2011-09-01', '2017-06-30', 1),
  (p3, 'Universidad de Huelva', 'Diplomado Universitario', 'Enfermería', '2005-09-01', '2008-06-30', 2),
  (p3, 'UNIR - Universidad Internacional de La Rioja', 'Máster Universitario', 'Psicoterapia: Terapias de Tercera Generación', '2024-11-01', NULL, 3),
  (p3, 'UNIR - Universidad Internacional de La Rioja', 'Máster Universitario', 'Dirección y Gestión Sanitaria', '2023-11-01', NULL, 4),
  (p3, 'ediae - Escuela de Dirección y Altos Estudios de Cámara Granada / Universidad de Granada', 'Master of Science (MS)', 'Valoración Médica del Daño Corporal', '2024-11-01', '2025-11-30', 5),
  (p3, 'Universidad CEU Cardenal Herrera', 'Máster', 'Urgencias, Emergencias y Catástrofes', '2021-01-01', '2021-12-31', 6),
  (p3, 'UDIMA - Universidad a Distancia de Madrid · en colaboración con Centro Internacional de Estudios de Postgrado (CIEP) - Córdoba', 'Máster', 'Tricología y Cirugía Capilar', '2019-09-01', '2020-12-31', 7),
  (p3, 'UDIMA - Universidad a Distancia de Madrid · en colaboración con Centro Internacional de Estudios de Postgrado (CIEP) - Córdoba', 'Máster', 'Medicina Estética', '2019-09-01', '2020-12-31', 8),
  (p3, 'Universidad Europea', 'Máster', 'Urgencias, Emergencias y Cuidados Críticos', '2009-09-01', '2010-06-30', 9),
  (p3, 'Universidad Europea', 'Experto Universitario', 'Urgencias y Emergencias Extrahospitalarias', '2009-09-01', '2010-06-30', 10),
  (p3, 'Universidad de Zaragoza', 'Cualificación Universitaria', 'Misiones HEMS (Helicopter Emergency Medical Services) - INAER', '2012-01-01', '2012-12-31', 11),
  (p3, 'Escuela de Ciencias de la Salud - Universidad Complutense de Madrid', 'Experto Universitario', 'Prescripción Enfermera', '2011-01-01', '2011-12-31', 12);

-- 4. Cristina Moreno Martín
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p4, 'Universidad Alfonso X El Sabio (UAX)', 'Licenciatura', 'Odontología', '2005-09-01', '2010-06-30', 1),
  (p4, 'Comité Coordinador de Centros de Medicina Hiperbárica (CCCMH)', 'Máster', 'Medicina Hiperbárica', '2012-01-01', '2013-12-31', 2),
  (p4, 'Sociedad Española de Medicina Subacuática e Hiperbárica (SEMSHI)', 'Máster', 'Medicina Subacuática', '2013-01-01', '2014-12-31', 3),
  (p4, 'Universidad Católica San Antonio de Murcia (UCAM)', 'Máster', 'Medicina Estética', '2014-01-01', '2015-12-31', 4),
  (p4, 'Universidad Internacional Menéndez Pelayo (UIMP)', 'Máster', 'Neurociencia y Dolor', '2016-01-01', '2017-12-31', 5);

-- 5. Irene Pulido García
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p5, 'Universitat Oberta de Catalunya (UOC)', 'Máster Oficial (Nota 9)', 'Neuropsicología · Neurociencia', '2022-10-01', '2024-10-31', 1),
  (p5, 'Universitat de Barcelona (UB)', 'Máster Oficial (Nota 9)', 'Psicogerontología · Psicología Clínica', '2021-10-01', '2022-09-30', 2),
  (p5, 'Universitat de València', 'Graduada', 'Psicología (Psicología de la Salud / Médica)', '2017-09-01', '2021-06-30', 3),
  (p5, 'Consorci Generalitat de Catalunya', 'Curso (Nota 10)', 'Acompañamiento y Gestión de Procesos de Duelo · Psicología Clínica Aplicada', '2022-09-01', '2022-10-31', 4),
  (p5, 'Universitat Autònoma de Barcelona (UAB)', 'Curso', 'Primeros Auxilios Psicológicos', '2020-02-01', '2021-05-31', 5),
  (p5, 'Universitat Oberta de Catalunya (UOC)', 'Grado (en curso)', 'Nutrición Humana y Dietética · Health and Wellness', '2025-10-01', NULL, 6),
  (p5, 'IES Balafia', 'Bachillerato (Nota 8)', 'Ciencias de la Salud', '2015-09-01', '2017-06-30', 7),
  (p5, 'Formación Laboral Integral', 'Certificado', 'Intervención y Abordaje de las Alteraciones de Conducta en la Tercera Edad', '2022-01-01', '2022-12-31', 8),
  (p5, 'Formación Laboral Integral', 'Certificado', 'Terapia con Animales', '2022-01-01', '2022-12-31', 9),
  (p5, 'Formación Laboral Integral', 'Certificado', 'Terapia con Muñecas (Trastorno Neurocognitivo Mayor)', '2022-01-01', '2022-12-31', 10),
  (p5, 'Technology2050 - Espais Cardioprotegits de Catalunya', 'Certificat', 'Suport Vital Bàsic i ús de DESA/DEA - Sanidad Comunitaria y Medicina Preventiva', '2022-01-01', '2022-12-31', 11);

-- 6. Elena María Granados Alarcón
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p6, 'Universidad Complutense de Madrid (UCM)', 'Grado', 'Medicina', '2012-09-01', '2018-05-31', 1),
  (p6, 'Hospital Universitario Ramón y Cajal', 'Residencia MIR', 'Alergología (4 años)', '2019-05-01', '2023-05-31', 2),
  (p6, 'UDIMA - Universidad a Distancia de Madrid', 'Máster', 'Medicina Estética, Nutrición y Antienvejecimiento', '2022-04-01', '2023-01-31', 3),
  (p6, 'UDIMA - Universidad a Distancia de Madrid', 'Máster', 'Medicina Estética · Nutrición, Obesidad y Microbiota', '2024-01-01', '2024-09-30', 4),
  (p6, 'University of Pennsylvania', 'Programa Internacional', 'Model United Nations', '2012-06-01', '2012-08-31', 5),
  (p6, 'EAACI/UEMS - European Academy of Allergy and Clinical Immunology', 'Certificación', '14th EAACI/UEMS Knowledge Examination in Allergology and Clinical Immunology', '2022-09-01', '2022-09-30', 6);

-- 7. Iria Graña Somoza
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p7, 'Universitat de Barcelona', 'Máster', 'Podología Pediátrica', '2023-09-01', '2024-06-30', 1),
  (p7, 'Universidade da Coruña', 'Grado', 'Podología', '2019-09-01', '2023-09-30', 2),
  (p7, 'CPR Aloya', 'Ciclo Formativo de Grado Superior (FP)', 'Anatomía Patológica y Citodiagnóstico', '2016-09-01', '2018-12-31', 3),
  (p7, 'World Academy of Podiatry Science', 'Curso (online)', 'Calzado y Biomecánica Infantil de 0 a 8 años', '2023-08-01', '2023-11-30', 4),
  (p7, 'World Academy of Podiatry Science', 'Curso (online)', 'Interpretación de RMN, TC y Rx', '2023-08-01', '2023-11-30', 5),
  (p7, 'Universidad Internacional Menéndez Pelayo (UIMP)', 'Certificación', 'B1 Inglés con Especialidad en Ciencias de la Salud', '2017-07-01', '2017-07-31', 6),
  (p7, 'Universidad Nacional de Educación a Distancia (UNED)', 'Grado (en curso)', 'Psicología', '2024-09-01', NULL, 7);

-- 8. Julia Bovis Benavides
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p8, 'Universidad de Alicante', 'Grado', 'Óptica y Optometría', '2009-09-01', '2013-06-30', 1),
  (p8, 'Colegio Nacional de Ópticos-Optometristas (CNOO)', 'Estudios avanzados', 'Lentes Esclerales', '2015-01-01', '2016-12-31', 2),
  (p8, 'Universidad Europea de Madrid', 'Estudios avanzados', 'Ortoqueratología (Orto-K)', '2016-01-01', '2017-12-31', 3),
  (p8, 'Formación especializada con David Piñero y Joaquín Fernández', 'Cursos de especialización', 'Queratocono', '2017-01-01', '2019-12-31', 4),
  (p8, 'Coopervision', 'Formación avanzada certificada', 'Control de Miopía con MiSight 1 day', '2020-01-01', '2021-12-31', 5);

-- 9. Lidia Isabel de Sus Martínez
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p9, 'Universidad de Zaragoza', 'Doctorado (Doctor of Medicine - MD, Sobresaliente Cum Laude)', 'Ciencias de la Salud y del Deporte · Tesis: "Pie Plano Infantil, Índice de Masa Corporal y Herramientas Diagnósticas" (accesible en TESEO y en el Repositorio Zaguan de la UZ)', '2020-09-01', '2024-11-30', 1),
  (p9, 'Universidad Miguel Hernández de Elche', 'Grado', 'Medicina Podológica · Podología', '2006-09-01', '2009-06-30', 2),
  (p9, 'Universidad de Zaragoza', 'Diplomatura', 'Nutrición Humana y Dietética', '2003-09-01', '2006-06-30', 3),
  (p9, 'Universitat de València', 'Máster', 'Bioética', '2019-09-01', '2020-06-30', 4),
  (p9, 'Universidad de Extremadura', 'Experto Universitario', 'Pie Diabético', '2012-09-01', '2013-06-30', 5),
  (p9, 'Escuela Oficial de Idiomas (EOI) de Zaragoza', 'Certificación', 'Inglés - Nivel C1', '2012-09-01', '2015-06-30', 6);

-- 10. Luz Marina Zuluaga Ríos
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p10, 'Universidad del Valle (Colombia)', 'Grado', 'Medicina y Cirugía', '2007-01-01', '2013-12-31', 1),
  (p10, 'Universidad Complutense de Madrid', 'Fellow', 'Cirugía de Pie Diabético', '2017-01-01', '2018-12-31', 2),
  (p10, 'Fundación Favaloro (Buenos Aires)', 'Especialización', 'Rehabilitación Cardiopulmonar', '2014-01-01', '2016-12-31', 3),
  (p10, 'Formación continua especializada', 'Curso', 'Ecografía Clínica Vascular', '2018-01-01', '2018-12-31', 4);

-- 11. María Dolores Flores Romero
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p11, 'Universidad de Sevilla', 'Licenciatura', 'Química · Actividades: Teatro - miembro de la Compañía Sevillana de Zarzuela', '2002-09-01', '2008-06-30', 1),
  (p11, 'Universidad de Sevilla', 'Máster Universitario', 'Profesorado de Educación Secundaria y Bachillerato (MAES)', '2009-09-01', '2010-06-30', 2),
  (p11, 'Universidad a Distancia de Madrid (UDIMA)', 'Máster', 'Dermocosmética y Formulación', '2023-10-01', '2024-05-31', 3);

-- 12. María Pedreira Pernas
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p12, 'Universidad de Santiago de Compostela', 'Licenciatura', 'Enfermería', '2002-09-01', '2007-06-30', 1),
  (p12, 'Universidad a Distancia de Madrid (UDIMA)', 'Máster', 'Prevención de Riesgos Laborales', '2010-01-01', '2011-12-31', 2),
  (p12, 'Escuela Nacional de Sanidad - Instituto de Salud Carlos III', 'Máster', 'Dirección Médica y Gestión Clínica', '2014-01-01', '2015-12-31', 3);

-- 13. Miguel Ángel Vega Maqueda
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p13, 'Universidad de Sevilla', 'Licenciatura', 'Biología', '2005-09-01', '2012-06-30', 1),
  (p13, 'Centro de Formación Permanente - Universidad de Sevilla', 'Máster', 'Reproducción Humana Asistida', '2023-09-01', '2024-06-30', 2),
  (p13, 'Hospital Universitario Virgen del Rocío (Sevilla)', 'Formación especializada', 'Unidad de Reproducción Asistida', '2023-09-01', '2024-06-30', 3),
  (p13, 'Junta de Andalucía - Formación Profesional Reglada', 'FP Grado Superior', 'Cuidados Auxiliares de Enfermería (TCAE)', '2003-09-01', '2005-06-30', 4);

-- 14. Rosa Inmaculada Monje López
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p14, 'Universitat de les Illes Balears (UIB)', 'Licenciatura', 'Ciencias Biológicas', '1998-09-01', '2003-06-30', 1),
  (p14, 'Universidad Isabel I de Castilla', 'Grado', 'Nutrición y Dietética', '2014-09-01', '2018-06-30', 2),
  (p14, 'Universidad Isabel I de Castilla', 'Máster', 'Nutrición y Dietética Humanas', '2018-01-01', '2019-12-31', 3),
  (p14, 'Universidad Católica San Antonio de Murcia (UCAM)', 'Máster', 'Microbiota Humana', '2020-01-01', '2021-12-31', 4);

-- 15. Rubén Broncano Martínez
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p15, 'Universitat de Girona', 'Licenciatura', 'Psicología · Especialidad Psicología Educativa', '1996-09-01', '2001-06-30', 1),
  (p15, 'Therapist International Psychoanalysis Training', 'Graduado', 'Psicoanálisis Internacional', '2024-01-01', '2025-06-30', 2),
  (p15, 'Academia de Pensamiento Libre', 'Cursos Especializados', 'Pensamiento Contemporáneo, Historia, Filosofía y Economía Clásica, Psicología y Psicoanálisis', '2021-12-01', NULL, 3);

-- 16. Susana Lucas Ballesteros
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p16, 'Universidad Nacional de Educación a Distancia (UNED)', 'Grado (en curso)', 'Psicología', '2022-10-01', NULL, 1),
  (p16, 'Escuela de Terapias Manuales de Murcia', 'Diplomada · Terapeuta Manual', 'Quiromasaje · Masaje Deportivo · Reflexología Podal · Quiropráctica · Drenaje Linfático · Masaje On-site · Masaje Tailandés', '2005-01-01', '2006-12-31', 2),
  (p16, 'Euroinnova International Online Education', 'Curso', 'Formador de Formadores', '2015-01-01', '2015-12-31', 3),
  (p16, 'Mamis Digitales - Metodología Estima', 'Curso', 'Community Manager (Estudio, Segmentación, Timing, Implementación, Medición, Amplificación)', '2018-01-01', '2018-12-31', 4),
  (p16, 'Escuela de Copywriting de Maïder Tomasena', 'Curso', 'El ABC del Copywriting · Escritura Persuasiva · Marketing de Contenidos', '2019-01-01', '2019-04-30', 5);

-- 17. Yacnira Loreleis Martínez Bazán
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p17, 'Instituto Superior de Ciencias Médicas de Santiago de Cuba', 'Doctora en Medicina', 'Medicina', '1988-09-01', '1994-07-31', 1),
  (p17, 'Instituto de Ciencias Médicas de Santiago de Cuba · Hospital Universitario Carlos Manuel de Céspedes', 'Especialista de Primer Grado', 'Anestesiología y Reanimación · Formación hospitalaria en H.U. Carlos Manuel de Céspedes', '1996-11-01', '2000-11-30', 2),
  (p17, 'Universidad de Ciencias Médicas de Granma', 'Máster', 'Urgencias Médicas', '2007-01-01', '2010-05-31', 3),
  (p17, 'Universidad española (Máster Internacional)', 'Máster', 'Anestesiología y Reanimación y Tratamiento del Dolor', '2018-01-01', '2020-12-31', 4);

-- 18. Dra. María Josep Albert López
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p18, 'Universidad Católica de Valencia "San Vicente Mártir" (UCV)', 'Licenciatura', 'Odontología', '2005-09-01', '2010-06-30', 1),
  (p18, 'Universidad Católica de Valencia "San Vicente Mártir" (UCV)', 'Máster Universitario', 'Periodoncia, Osteointegración y Periimplantología', '2011-09-01', '2014-06-30', 2),
  (p18, 'Sociedad Española de Medicina Estética (SEME)', 'Postgrado', 'Estética Facial', '2015-01-01', '2016-12-31', 3);

-- 19. Luis David Romero García
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p19, 'Universitat de València', 'Posgrado en Medicina Forense', 'Medicina · Formación especializada en el área de la Medicina Legal · Aptitudes: Legal, Peritaje, Odontología Forense', '2024-01-01', '2025-07-31', 1),
  (p19, 'Universitat de València', 'Master''s degree · Máster de Formación Permanente', 'MEDICINA FORENSE · Ejercicio de la pericia privada ante Tribunales de Justicia, asesoría a despachos de abogados, peritaje en órganos de mediación, labor docente e investigadora', '2024-10-01', NULL, 2),
  (p19, 'Universidad Europea', 'Bachelor of Dental Surgery (BDS) · Master of Science in Dental Surgery (MSc DS)', 'Dentistry · Recognition of Studies in European Union (homologación europea)', '2012-01-01', '2013-12-31', 3),
  (p19, 'UAM - Universidad Autónoma Metropolitana', 'Diploma in Oral Diagnosis', 'Dentistry · bajo Dr. Adalberto Mosqueda Taylor · Aptitudes: Patología, Histología', '2003-01-01', '2004-12-31', 4),
  (p19, 'Universidad Nacional Autónoma de México (UNAM)', 'Bachelor of Dentistry · Bachelor of Surgery (MBBS)', 'Advanced/Graduate Dentistry and Oral Sciences · Cirujano Dentista', '1997-01-01', '2001-12-31', 5);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Ramón Miralles López
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p1, 'RGPD y Protección de Datos', 'EXPERT', 1),
  (p1, 'Ciberseguridad Jurídica', 'EXPERT', 2),
  (p1, 'Corporate Compliance', 'EXPERT', 3),
  (p1, 'Auditoría de Sistemas de Información', 'EXPERT', 4),
  (p1, 'Seguridad de la Información', 'EXPERT', 5),
  (p1, 'Derecho Digital · Ciberderecho', 'EXPERT', 6),
  (p1, 'LegalTech', 'EXPERT', 7),
  (p1, 'AI Act y Gobernanza de IA', 'ADVANCED', 8),
  (p1, 'NIS2 y DORA', 'ADVANCED', 9),
  (p1, 'DSA y DMA (Reglamento de Servicios Digitales)', 'ADVANCED', 10),
  (p1, 'Compliance Penal Corporativo', 'ADVANCED', 11),
  (p1, 'ESG Legal y Sostenibilidad Digital', 'ADVANCED', 12),
  (p1, 'Infraestructuras de Clave Pública (PKI) y Firma Electrónica', 'EXPERT', 13),
  (p1, 'Administración Electrónica', 'EXPERT', 14),
  (p1, 'Sistemas de Información y Tecnologías TIC', 'EXPERT', 15),
  (p1, 'Derecho de las TIC', 'EXPERT', 16),
  (p1, 'Asesoría Estratégica a Comités de Dirección', 'EXPERT', 17),
  (p1, 'Dirección y Gestión de Equipos Jurídicos', 'EXPERT', 18),
  (p1, 'Docencia Universitaria', 'EXPERT', 19),
  (p1, 'Transformación Digital', 'ADVANCED', 20);

-- 2. Mildreth Plata López
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p2, 'Innovación Educativa', 'EXPERT', 1), (p2, 'Tecnología Educativa (EdTech)', 'EXPERT', 2),
  (p2, 'Investigación Educativa', 'EXPERT', 3), (p2, 'Investigación Tecnológica', 'EXPERT', 4),
  (p2, 'Competencias Digitales', 'EXPERT', 5),
  (p2, 'Brecha Digital · Inclusión Digital', 'EXPERT', 6),
  (p2, 'Capacitación Docente', 'EXPERT', 7),
  (p2, 'Formación por Competencias', 'EXPERT', 8),
  (p2, 'Inteligencia Artificial Aplicada a la Educación', 'ADVANCED', 9),
  (p2, 'Acción Comunitaria · Inclusión Social', 'EXPERT', 10),
  (p2, 'Diseño y Gestión de Proyectos Educativos', 'EXPERT', 11),
  (p2, 'Dirección y Coordinación de Centros Educativos', 'EXPERT', 12),
  (p2, 'Enseñanza Superior', 'EXPERT', 13),
  (p2, 'Educación Primaria', 'EXPERT', 14),
  (p2, 'Orientación Educativa', 'ADVANCED', 15),
  (p2, 'Liderazgo y Trabajo en Equipo', 'EXPERT', 16),
  (p2, 'Gestión de Proyectos Web', 'ADVANCED', 17),
  (p2, 'Evaluación del Profesorado', 'ADVANCED', 18),
  (p2, 'Diseños de Investigación', 'ADVANCED', 19),
  (p2, 'Aprendizaje Servicio (ApS)', 'EXPERT', 20),
  (p2, 'Diversidad e Inclusión', 'EXPERT', 21),
  (p2, 'Microsoft Excel · Office', 'ADVANCED', 22),
  (p2, 'Pedagogía', 'EXPERT', 23),
  (p2, 'Resolución Creativa de Problemas', 'ADVANCED', 24);

-- 3. Alberto Jurado Arévalo
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p3, 'Psiquiatría Clínica', 'EXPERT', 1),
  (p3, 'Medicina Estética', 'EXPERT', 2),
  (p3, 'Trasplante Capilar y Tricología', 'EXPERT', 3),
  (p3, 'Microcirugía Capilar (FUE/DHI)', 'EXPERT', 4),
  (p3, 'Urgencias y Emergencias Médicas', 'EXPERT', 5),
  (p3, 'Servicios Médicos de Emergencia', 'EXPERT', 6),
  (p3, 'Cuidados Intensivos y Reanimación', 'EXPERT', 7),
  (p3, 'Dirección Médica Clínica Privada', 'ADVANCED', 8),
  (p3, 'Dirección y Gestión Sanitaria', 'ADVANCED', 9),
  (p3, 'Psicoterapia (Terapias de Tercera Generación)', 'ADVANCED', 10),
  (p3, 'Valoración Médica del Daño Corporal', 'ADVANCED', 11),
  (p3, 'Misiones HEMS (Helicopter Emergency Medical Services)', 'INTERMEDIATE', 12),
  (p3, 'Toxina Botulínica y Rellenos', 'ADVANCED', 13),
  (p3, 'Investigación Médica', 'ADVANCED', 14),
  (p3, 'Enfermería Hospitalaria (UCI, Urgencias, Onco-Hematología)', 'EXPERT', 15),
  (p3, 'Prescripción Enfermera', 'ADVANCED', 16),
  (p3, 'Salud', 'EXPERT', 17),
  (p3, 'Voluntariado Sanitario (Cruz Roja)', 'EXPERT', 18),
  (p3, 'Docencia Universitaria', 'ADVANCED', 19);

-- 4. Cristina Moreno Martín
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p4, 'Medicina Hiperbárica (HBOT)', 'EXPERT', 1), (p4, 'Cámaras Hiperbáricas Monoplaza', 'EXPERT', 2),
  (p4, 'Medicina Subacuática', 'EXPERT', 3), (p4, 'Dirección Clínica Unidad HBOT', 'EXPERT', 4),
  (p4, 'Odontología Clínica', 'ADVANCED', 5), (p4, 'Medicina Estética', 'ADVANCED', 6),
  (p4, 'Neurociencia del Dolor', 'ADVANCED', 7), (p4, 'Coordinación Multidisciplinar', 'ADVANCED', 8);

-- 5. Irene Pulido García
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p5, 'Evaluación Neuropsicológica', 'EXPERT', 1),
  (p5, 'Pruebas Neuropsicológicas', 'EXPERT', 2),
  (p5, 'Neuropsicología Clínica', 'EXPERT', 3),
  (p5, 'Psicogerontología', 'EXPERT', 4),
  (p5, 'Demencias y Enfermedades Neurodegenerativas (Alzheimer)', 'EXPERT', 5),
  (p5, 'Estimulación y Rehabilitación Cognitiva', 'ADVANCED', 6),
  (p5, 'Atención Psicológica en Residencias Geriátricas', 'EXPERT', 7),
  (p5, 'Acompañamiento en Procesos de Duelo', 'ADVANCED', 8),
  (p5, 'Primeros Auxilios Psicológicos', 'ADVANCED', 9),
  (p5, 'Terapia No Farmacológica (Animales, Muñecas)', 'ADVANCED', 10),
  (p5, 'Intervención en Alteraciones de Conducta - Tercera Edad', 'ADVANCED', 11),
  (p5, 'Docencia Universitaria en Psicobiología', 'ADVANCED', 12),
  (p5, 'Soporte Vital Básico (SVB) y DESA/DEA', 'INTERMEDIATE', 13),
  (p5, 'Trabajo con Familias y Cuidadores', 'ADVANCED', 14),
  (p5, 'Orientación para el Desarrollo de Carrera Profesional', 'ADVANCED', 15),
  (p5, 'Diversidad e Inclusión', 'ADVANCED', 16);

-- 6. Elena María Granados Alarcón
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p6, 'Alergología Clínica', 'EXPERT', 1),
  (p6, 'Alergología Pediátrica', 'EXPERT', 2),
  (p6, 'Medicina Estética', 'EXPERT', 3),
  (p6, 'Medicina Hospitalaria', 'EXPERT', 4),
  (p6, 'Consultas Médicas Especializadas', 'EXPERT', 5),
  (p6, 'Inmunología Clínica', 'EXPERT', 6),
  (p6, 'Inmunoterapia Específica', 'ADVANCED', 7),
  (p6, 'Manejo de Anafilaxia y Urgencias Alergológicas', 'ADVANCED', 8),
  (p6, 'Dermatitis Atópica y Patología Cutánea Alérgica', 'ADVANCED', 9),
  (p6, 'Asma y Rinitis Alérgica', 'ADVANCED', 10),
  (p6, 'Alergia Alimentaria Compleja', 'ADVANCED', 11),
  (p6, 'Investigación Clínica (Coautoría científica)', 'ADVANCED', 12),
  (p6, 'Formación Continua', 'EXPERT', 13),
  (p6, 'Medicina', 'EXPERT', 14),
  (p6, 'Nutrición, Obesidad y Microbiota', 'ADVANCED', 15),
  (p6, 'Antiaging y Dermocosmética', 'ADVANCED', 16),
  (p6, 'Inglés', 'ADVANCED', 17);

-- 7. Iria Graña Somoza
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p7, 'Podología Pediátrica', 'EXPERT', 1), (p7, 'Biomecánica', 'EXPERT', 2),
  (p7, 'Quiropodologia', 'EXPERT', 3),
  (p7, 'Ortopodología', 'ADVANCED', 4),
  (p7, 'Valoración Muscular', 'ADVANCED', 5),
  (p7, 'Pediatría', 'ADVANCED', 6),
  (p7, 'Calzado y Biomecánica Infantil (0-8 años)', 'ADVANCED', 7),
  (p7, 'Interpretación de RMN, TC y Rx', 'ADVANCED', 8),
  (p7, 'Atención a Pacientes Diabéticos', 'INTERMEDIATE', 9),
  (p7, 'Anatomía Patológica y Citodiagnóstico (FP)', 'ADVANCED', 10),
  (p7, 'Exploración Podológica Completa', 'ADVANCED', 11),
  (p7, 'Diseño y Adaptación de Plantillas Personalizadas', 'ADVANCED', 12),
  (p7, 'Atención al Paciente Pediátrico y Comunicación con Familias', 'EXPERT', 13),
  (p7, 'Apoyo Educativo a Niños (6-14 años)', 'EXPERT', 14),
  (p7, 'Dirección Académica de Programas Formativos', 'INTERMEDIATE', 15),
  (p7, 'Inglés Sanitario (B1 UIMP)', 'INTERMEDIATE', 16);

-- 8. Julia Bovis Benavides
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p8, 'Optometría Clínica', 'EXPERT', 1), (p8, 'Contactología Avanzada', 'EXPERT', 2),
  (p8, 'Lentes de Contacto Esclerales', 'EXPERT', 3), (p8, 'Ortoqueratología (Orto-K)', 'EXPERT', 4),
  (p8, 'Lentes Multifocales', 'EXPERT', 5), (p8, 'Control de Progresión de Miopía', 'EXPERT', 6),
  (p8, 'Queratocono y Córneas Irregulares', 'ADVANCED', 7), (p8, 'Refracción Avanzada', 'ADVANCED', 8),
  (p8, 'Dirección Técnica de Centro Óptico', 'ADVANCED', 9), (p8, 'Formación Continua de Equipos', 'ADVANCED', 10);

-- 9. Lidia Isabel de Sus Martínez
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p9, 'Biomecánica', 'EXPERT', 1),
  (p9, 'Podología Clínica', 'EXPERT', 2),
  (p9, 'Análisis Digital de la Marcha', 'EXPERT', 3),
  (p9, 'Plantillas Personalizadas 100% Digitales', 'EXPERT', 4),
  (p9, 'Pie Diabético', 'EXPERT', 5),
  (p9, 'Podología Pediátrica', 'EXPERT', 6),
  (p9, 'Uñas Encarnadas', 'ADVANCED', 7),
  (p9, 'Nutrición Clínica', 'EXPERT', 8),
  (p9, 'Nutrición Deportiva', 'EXPERT', 9),
  (p9, 'Investigación Clínica (JCR)', 'EXPERT', 10),
  (p9, 'Publicaciones Académicas', 'EXPERT', 11),
  (p9, 'Redacción de Textos Científicos', 'EXPERT', 12),
  (p9, 'Medicina Basada en Pruebas', 'EXPERT', 13),
  (p9, 'Bioética', 'EXPERT', 14),
  (p9, 'Docencia Universitaria', 'EXPERT', 15),
  (p9, 'Módulos de e-learning', 'EXPERT', 16),
  (p9, 'Revisión por Pares Científica', 'ADVANCED', 17),
  (p9, 'Salud y Bienestar', 'EXPERT', 18),
  (p9, 'Inglés (C1 - EOI)', 'ADVANCED', 19);

-- 10. Luz Marina Zuluaga Ríos
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p10, 'Cirugía de Pie Diabético', 'EXPERT', 1), (p10, 'Enfermedad Vascular Periférica', 'EXPERT', 2),
  (p10, 'Rehabilitación Cardiopulmonar', 'EXPERT', 3), (p10, 'Cuidados Intensivos (UTI)', 'ADVANCED', 4),
  (p10, 'Ecografía Clínica Vascular', 'ADVANCED', 5), (p10, 'Docencia Universitaria (Morfofisiología, Farmacología)', 'ADVANCED', 6),
  (p10, 'Manejo del Paciente Crítico', 'ADVANCED', 7), (p10, 'Práctica Clínica Internacional', 'ADVANCED', 8);

-- 11. María Dolores Flores Romero
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p11, 'Química', 'EXPERT', 1),
  (p11, 'Dermocosmética y Formulación', 'EXPERT', 2),
  (p11, 'Cosmetic Dermatology', 'EXPERT', 3),
  (p11, 'Control de Calidad (ISO, BRC, IFS)', 'EXPERT', 4),
  (p11, 'Control Fisicoquímico e Instrumental', 'EXPERT', 5),
  (p11, 'Control Microbiológico', 'EXPERT', 6),
  (p11, 'Quality Assurance', 'EXPERT', 7),
  (p11, 'Docencia Secundaria y Bachillerato', 'EXPERT', 8),
  (p11, 'Docencia Académica en Ciencias (Matemáticas, Biología, Física y Química, Tecnología)', 'EXPERT', 9),
  (p11, 'Investigación Predoctoral en Química Orgánica', 'ADVANCED', 10),
  (p11, 'Publicaciones Científicas', 'ADVANCED', 11),
  (p11, 'Prevención de Riesgos Laborales', 'ADVANCED', 12),
  (p11, 'Fisiopatología Cutánea del Acné', 'ADVANCED', 13),
  (p11, 'Análisis de Productos Cosméticos', 'ADVANCED', 14),
  (p11, 'CoDeSys', 'INTERMEDIATE', 15);

-- 12. María Pedreira Pernas
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p12, 'Enfermería Familia y Comunitaria (EFyC)', 'EXPERT', 1),
  (p12, 'Asistencia Sanitaria', 'EXPERT', 2),
  (p12, 'Atención Primaria', 'EXPERT', 3),
  (p12, 'Cuidado de Pacientes', 'EXPERT', 4),
  (p12, 'Acción Comunitaria', 'EXPERT', 5),
  (p12, 'Liderazgo de Equipos', 'EXPERT', 6),
  (p12, 'Enfermeros Profesionales', 'EXPERT', 7),
  (p12, 'Docencia Secundaria (Funcionaria)', 'EXPERT', 8),
  (p12, 'Docencia en Formación Continua Sanitaria', 'EXPERT', 9),
  (p12, 'Soporte Vital Básico y Avanzado (SVB/SVA)', 'ADVANCED', 10),
  (p12, 'Educación Sanitaria a Pacientes y Familias', 'EXPERT', 11),
  (p12, 'Coordinación de Equipos Sanitarios', 'ADVANCED', 12),
  (p12, 'Inglés', 'INTERMEDIATE', 13);

-- 13. Miguel Ángel Vega Maqueda
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p13, 'Embriología Clínica', 'EXPERT', 1), (p13, 'Fecundación In Vitro (FIV/ICSI)', 'EXPERT', 2),
  (p13, 'Criobiología y Vitrificación', 'EXPERT', 3), (p13, 'Andrología', 'ADVANCED', 4),
  (p13, 'Diagnóstico Genético Preimplantacional (DGP/PGT)', 'ADVANCED', 5), (p13, 'Manejo Avanzado de Gametos', 'EXPERT', 6),
  (p13, 'Cuidados Auxiliares de Enfermería (más de 19 años)', 'EXPERT', 7), (p13, 'Acompañamiento Emocional en Fertilidad', 'ADVANCED', 8),
  (p13, 'Control de Calidad Laboratorio FIV', 'ADVANCED', 9);

-- 14. Rosa Inmaculada Monje López
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p14, 'Nutrición y Dietética Humana', 'EXPERT', 1), (p14, 'Microbiota Humana', 'EXPERT', 2),
  (p14, 'Nutrición Bariátrica', 'EXPERT', 3), (p14, 'Nutrición Infantil y Adolescente', 'ADVANCED', 4),
  (p14, 'Fisiología Humana (Docencia)', 'EXPERT', 5), (p14, 'Gestión de Calidad Hospitalaria ISO', 'ADVANCED', 6),
  (p14, 'Higiene Hospitalaria', 'ADVANCED', 7), (p14, 'Nutrición Integrativa', 'ADVANCED', 8);

-- 15. Rubén Broncano Martínez
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p15, 'Psicoanálisis Clínico', 'EXPERT', 1),
  (p15, 'Psicología Empresarial', 'EXPERT', 2),
  (p15, 'Psicoterapia Lógico-Racional', 'EXPERT', 3),
  (p15, 'Psicología Bariátrica', 'EXPERT', 4),
  (p15, 'Práctica Clínica Online', 'EXPERT', 5),
  (p15, 'Liderazgo', 'EXPERT', 6),
  (p15, 'Gestión y Motivación de Equipos', 'EXPERT', 7),
  (p15, 'Selección de Personal mediante Plataformas Sociales', 'ADVANCED', 8),
  (p15, 'Tests Psicotécnicos', 'ADVANCED', 9),
  (p15, 'Entrevistas Motivacionales', 'ADVANCED', 10),
  (p15, 'Contratación Laboral', 'ADVANCED', 11),
  (p15, 'Gestor de Nóminas', 'INTERMEDIATE', 12),
  (p15, 'Autoría y Escritura Profesional', 'ADVANCED', 13),
  (p15, 'Conferencias y Ponencias', 'ADVANCED', 14),
  (p15, 'Atención en Mutuas (Sanitas, Aegon, Caser, Cigna, DKV, Adeslas)', 'ADVANCED', 15),
  (p15, 'Investigación y Desarrollo', 'ADVANCED', 16),
  (p15, 'Microsoft Office (Word, Excel, PowerPoint, Outlook)', 'ADVANCED', 17),
  (p15, 'Photoshop', 'INTERMEDIATE', 18);

-- 16. Susana Lucas Ballesteros
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p16, 'Wellness & Luxury Hospitality', 'EXPERT', 1),
  (p16, 'Gestión de Spa (Spa Manager)', 'EXPERT', 2),
  (p16, 'Gerencia de Hoteles 5★', 'EXPERT', 3),
  (p16, 'Quiromasaje', 'EXPERT', 4),
  (p16, 'Masaje Deportivo', 'EXPERT', 5),
  (p16, 'Reflexología Podal', 'EXPERT', 6),
  (p16, 'Drenaje Linfático Manual', 'EXPERT', 7),
  (p16, 'Masaje Tailandés y On-site', 'ADVANCED', 8),
  (p16, 'Quiropráctica', 'ADVANCED', 9),
  (p16, 'Atención al Cliente VIP y CRM', 'EXPERT', 10),
  (p16, 'Fidelización de Clientes', 'EXPERT', 11),
  (p16, 'Estrategia de Marca y Branding Personal', 'EXPERT', 12),
  (p16, 'Consultoría Estratégica Wellness', 'EXPERT', 13),
  (p16, 'Desarrollo de Negocio Wellness', 'EXPERT', 14),
  (p16, 'Wellness Coaching y Mentoría Profesional', 'EXPERT', 15),
  (p16, 'Diseño de Experiencia del Cliente', 'EXPERT', 16),
  (p16, 'Mindfulness y Presencia', 'ADVANCED', 17),
  (p16, 'Bienestar Corporativo (Burnout, Gestión del Estrés)', 'ADVANCED', 18),
  (p16, 'Liderazgo y Gestión de Equipos', 'EXPERT', 19),
  (p16, 'Auditoría de Calidad y Control de Procesos Hoteleros', 'ADVANCED', 20),
  (p16, 'Copywriting y Escritura Persuasiva', 'ADVANCED', 21),
  (p16, 'Marketing Digital y Gestión de Contenidos', 'ADVANCED', 22),
  (p16, 'MICROS, Microsoft Office (Excel, PowerPoint)', 'ADVANCED', 23),
  (p16, 'Cosmetología', 'ADVANCED', 24),
  (p16, 'Docencia y Formación de Formadores', 'EXPERT', 25);

-- 17. Yacnira Loreleis Martínez Bazán
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p17, 'Anestesiología', 'EXPERT', 1),
  (p17, 'Anestesia General', 'EXPERT', 2),
  (p17, 'Anestesia Regional', 'EXPERT', 3),
  (p17, 'Soporte Vital Básico (SVB)', 'EXPERT', 4),
  (p17, 'Manejo Perioperatorio', 'EXPERT', 5),
  (p17, 'Reanimación Cardiopulmonar', 'EXPERT', 6),
  (p17, 'Atención Hospitalaria', 'EXPERT', 7),
  (p17, 'Docencia Médica Universitaria', 'EXPERT', 8),
  (p17, 'Tratamiento del Dolor', 'ADVANCED', 9),
  (p17, 'Urgencias Médicas', 'EXPERT', 10),
  (p17, 'Investigación Médica Auxiliar', 'EXPERT', 11),
  (p17, 'Producción Científica (+20 publicaciones)', 'EXPERT', 12),
  (p17, 'Liderazgo en Sociedades Científicas', 'ADVANCED', 13),
  (p17, 'Manejo Avanzado de Vía Aérea', 'ADVANCED', 14),
  (p17, 'Reanimación Neonatal', 'ADVANCED', 15),
  (p17, 'Anestesia en Cirugía Ortopédica', 'ADVANCED', 16),
  (p17, 'Inglés (dominio medio)', 'INTERMEDIATE', 17);

-- 18. Dra. María Josep Albert López
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p18, 'Periodoncia', 'EXPERT', 1), (p18, 'Osteointegración e Implantes', 'EXPERT', 2),
  (p18, 'Estética Facial', 'EXPERT', 3), (p18, 'Tratamiento de la Sonrisa Gingival', 'EXPERT', 4),
  (p18, 'Cirugía Periodontal e Injertos', 'EXPERT', 5), (p18, 'Odontología Digital (CAD/CAM, Cirugía Guiada)', 'ADVANCED', 6),
  (p18, 'Rellenos Faciales y Toxina Botulínica', 'ADVANCED', 7), (p18, 'Diseño Digital de Sonrisa (DSD)', 'ADVANCED', 8),
  (p18, 'Docencia Universitaria', 'ADVANCED', 9);

-- 19. Luis David Romero García
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p19, 'Medicina Forense', 'EXPERT', 1),
  (p19, 'Peritaje Odontológico Forense', 'EXPERT', 2),
  (p19, 'Odontología', 'EXPERT', 3),
  (p19, 'Cirugía Oral y Maxilofacial', 'EXPERT', 4),
  (p19, 'Cirugía Dental', 'EXPERT', 5),
  (p19, 'Dental Implants · Implantología', 'EXPERT', 6),
  (p19, 'Dental Technology', 'EXPERT', 7),
  (p19, 'CBCT y Diagnóstico Oral (Cone Beam Computed Tomography)', 'EXPERT', 8),
  (p19, 'MRI (Magnetic Resonance Imaging) Dental', 'EXPERT', 9),
  (p19, 'Radiología Dental', 'EXPERT', 10),
  (p19, 'Endodoncias', 'EXPERT', 11),
  (p19, 'Odontología Restauradora', 'EXPERT', 12),
  (p19, 'Dental Restoration', 'EXPERT', 13),
  (p19, 'Laser Dentistry', 'ADVANCED', 14),
  (p19, 'Patología y Diagnóstico Oral', 'EXPERT', 15),
  (p19, 'Histología', 'ADVANCED', 16),
  (p19, 'Atención Dental Integral', 'EXPERT', 17),
  (p19, 'Identificación Odontológica Forense', 'EXPERT', 18),
  (p19, 'Estimación de Edad por Desarrollo Dental', 'ADVANCED', 19),
  (p19, 'Análisis de Lesiones Bucodentales (accidentes laborales, siniestros, casos judiciales)', 'EXPERT', 20),
  (p19, 'Elaboración de Informes Periciales', 'EXPERT', 21),
  (p19, 'Dental Software · Scanners', 'ADVANCED', 22),
  (p19, 'Asesoramiento y Acreditación de Competencias Profesionales Sanitarias', 'EXPERT', 23),
  (p19, 'Dirección Clínica (Clinic Director)', 'EXPERT', 24),
  (p19, 'Investigación en Odontología Preventiva', 'ADVANCED', 25),
  (p19, 'Desarrollo Curricular y Moodle', 'ADVANCED', 26),
  (p19, 'Odontopediatría', 'ADVANCED', 27),
  (p19, 'Asistencia Sanitaria', 'EXPERT', 28);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p1, 'Catalán', 'Native', true, 1), (p1, 'Español', 'Native', true, 2), (p1, 'Inglés', 'B2', false, 3),
  (p2, 'Español', 'Native', true, 1), (p2, 'Inglés', 'B2', false, 2),
  (p3, 'Español', 'Native', true, 1), (p3, 'Catalán', 'C1', false, 2), (p3, 'Inglés', 'B2', false, 3),
  (p4, 'Español', 'Native', true, 1), (p4, 'Inglés', 'B2', false, 2),
  (p5, 'Español', 'Native', true, 1), (p5, 'Catalán', 'C1', false, 2), (p5, 'Inglés', 'B1', false, 3),
  (p6, 'Español', 'Native', true, 1), (p6, 'Inglés', 'C1', false, 2),
  (p7, 'Español', 'Native', true, 1), (p7, 'Gallego', 'Native', true, 2), (p7, 'Inglés', 'B1', false, 3), (p7, 'Catalán', 'A2', false, 4),
  (p8, 'Español', 'Native', true, 1), (p8, 'Valenciano/Catalán', 'B2', false, 2), (p8, 'Inglés', 'B2', false, 3),
  (p9, 'Español', 'Native', true, 1), (p9, 'Inglés', 'C1', false, 2),
  (p10, 'Español', 'Native', true, 1), (p10, 'Inglés', 'B2', false, 2),
  (p11, 'Español', 'Native', true, 1), (p11, 'Francés', 'A2', false, 2), (p11, 'Inglés', 'B1', false, 3),
  (p12, 'Español', 'Native', true, 1), (p12, 'Gallego', 'B2', false, 2), (p12, 'Inglés', 'B1', false, 3),
  (p13, 'Español', 'Native', true, 1), (p13, 'Inglés', 'B2', false, 2),
  (p14, 'Español', 'Native', true, 1), (p14, 'Catalán', 'B2', false, 2), (p14, 'Inglés', 'B2', false, 3),
  (p15, 'Español', 'Native', true, 1), (p15, 'Catalán', 'C1', false, 2), (p15, 'Inglés', 'B1', false, 3),
  (p16, 'Español', 'Native', true, 1), (p16, 'Inglés', 'B2', false, 2),
  (p17, 'Español', 'Native', true, 1), (p17, 'Inglés', 'B2', false, 2),
  (p18, 'Español', 'Native', true, 1), (p18, 'Valenciano/Catalán', 'C1', false, 2), (p18, 'Inglés', 'B2', false, 3),
  (p19, 'Español', 'Native', true, 1), (p19, 'Inglés', 'C1', false, 2), (p19, 'Francés', 'A2', false, 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO ITEMS (Programas dirigidos en ISEIE Innovation School)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Ramón Miralles López
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p1, 'Máster en Derecho Digital', 'Programa de dirección académica en ISEIE Innovation School — Privacidad, ciberseguridad y compliance digital.', 'OTHER', 'https://iseie.com/masters/derecho-digital/', 1),
  (p1, 'Socio en ECIJA Barcelona', 'Socio de Privacidad, Ciberseguridad y Corporate Compliance en ECIJA & Asociados Abogados Barcelona desde mayo 2024.', 'PROJECT', NULL, 2),
  (p1, 'Coordinación de Auditoría y Seguridad en APDCAT (15 años)', '14 años 7 meses como Coordinador d''Auditoria i Seguretat de la Informació en la Autoritat Catalana de Protecció de Dades (2003-2018).', 'PROJECT', NULL, 3),
  (p1, 'Profesor Curso Superior Delegado en Protección de Datos - Instituto Ortega y Gasset', 'Docencia universitaria activa desde octubre 2018 (7+ años).', 'COLLABORATION', NULL, 4),
  (p1, 'Profesor "Derecho de las TIC" - Máster en Propiedad Intelectual e Industrial - OBS Business School', 'Docente invitado desde octubre 2015 (10+ años).', 'COLLABORATION', NULL, 5),
  (p1, 'Vocal Comisión Transformación Digital - ICAB (Il·lustre Col·legi de l''Advocacia de Barcelona)', 'Posición colegial en el ICAB entre 2018-2020.', 'COLLABORATION', NULL, 6),
  (p1, 'Implantación de Firma Electrónica y PKI en la Generalitat de Catalunya', 'Como Responsable de Aseguramiento de la Información en CTTI (1999-2001), participó en la implantación de las infraestructuras de clave pública de la administración electrónica catalana.', 'PROJECT', NULL, 7),
  (p1, 'gencat.cat - Diseño e Infraestructuras Internet de la Generalitat', 'Como Responsable de la Unitat de Mitjans Informàtics de Difussió d''Informació (1995-1998), diseñó y mantuvo las infraestructuras Internet de la Generalitat de Catalunya.', 'PROJECT', NULL, 8);

-- 2. Mildreth Plata López
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p2, 'Máster en Tecnología Educativa', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/tecnologia-educativa/', 1),
  (p2, 'Máster en Innovación Educativa', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/innovacion-educativa/', 2),
  (p2, 'Diplomado en Innovación Educativa', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/diplomados/innovacion-educativa/', 3),
  (p2, 'Curso Tecnologías Educativas', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/tecnologias-educativas/', 4),
  (p2, 'MildrethTech - IA y Educación', 'Fundadora del proyecto propio MildrethTech, donde combina inteligencia artificial y educación para transformar procesos de aprendizaje.', 'PROJECT', NULL, 5),
  (p2, 'Tesis Doctoral - "Aprendizaje Servicio basado en el Arte: estudio de caso para la transformación social"', 'Tesis doctoral defendida en la Universitat Jaume I (marzo 2023) con calificación Sobresaliente Cum Laude. Grupo de Investigación MEICRI.', 'WRITING', NULL, 6),
  (p2, 'Investigación postdoctoral en la Universitat Jaume I', 'Continuación de líneas de investigación en aprendizaje servicio, transformación social y educación inclusiva mediada por tecnología.', 'PROJECT', NULL, 7),
  (p2, 'Programas de Cierre de Brecha Digital (ILUNION y Adecco)', 'Formadora activa en programas de inclusión digital para personas en riesgo de exclusión en Castellón.', 'COLLABORATION', NULL, 8);

-- 3. Alberto Jurado Arévalo
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p3, 'Máster en Trasplante Capilar', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/trasplante-capilar/', 1),
  (p3, 'Diplomado en Medicina Estética', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/diplomados/medicina-estetica/', 2),
  (p3, 'Curso de Medicina Estética', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/curso-de-medicina-estetica/', 3),
  (p3, 'Práctica psiquiátrica - Hospital Universitario de Jaén', 'Médico Psiquiatra en el SAS tras completar MIR de Psiquiatría (2021-2025).', 'PROJECT', NULL, 4),
  (p3, 'Dirección Médica ADVAN HAIR - Advanced Hair Institute', 'Dirección Médica del centro especializado en trasplante capilar y medicina estética.', 'PROJECT', NULL, 5),
  (p3, 'Voluntariado Cruz Roja Española (24+ años)', 'Voluntario, enfermero y médico voluntario de Cruz Roja Española desde mayo 2002.', 'COLLABORATION', NULL, 6),
  (p3, 'Docencia universitaria - UNIR', 'Docente en la Universidad Internacional de La Rioja desde marzo 2026 (jornada parcial, remoto).', 'PROJECT', NULL, 7);

-- 4. Cristina Moreno Martín
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p4, 'Máster en Medicina Hiperbárica', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/master-en-medicina-hiperbarica/', 1),
  (p4, 'Diplomado en Medicina Hiperbárica', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/diplomados/diplomado-en-medicina-hiperbarica/', 2);

-- 5. Irene Pulido García
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p5, 'Máster Profesional en Neuropsicología y Logopedia Clínica', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/master-profesional-en-neuropsicologia-y-logopedia-clinica/', 1),
  (p5, 'Práctica clínica en Alzheimer Catalunya Fundació', 'Neuropsicóloga a jornada completa en una de las fundaciones de referencia en España en el abordaje del Alzheimer.', 'PROJECT', NULL, 2),
  (p5, 'Docencia universitaria - Psicobiología (UB)', 'Profesora Asociada de Psicobiología en la Universitat de Barcelona (2023-2024).', 'PROJECT', NULL, 3);

-- 6. Elena María Granados Alarcón
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p6, 'Máster en Dermatología y Antiaging', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/dermatologia-y-antiaging/', 1),
  (p6, 'Máster en Medicina Estética', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/master-medicina-estetica/', 2),
  (p6, 'Práctica clínica en Complejo Hospitalario Ruber Juan Bravo', 'Médico Adjunto de Alergología desde enero 2025.', 'PROJECT', NULL, 3),
  (p6, 'Alergología Pediátrica en MontePediatras', 'Alergóloga Infantil en MontePediatras (Madrid) desde noviembre 2023.', 'PROJECT', NULL, 4),
  (p6, 'Publicación científica - Diagnóstico de Hipersensibilidad a Vacunas COVID-19', '"A Prospective Validation of a Diagnostic Algorithm for Hypersensitivity Reactions to COVID-19 Vaccines" - publicación científica vinculada a su MIR en el Hospital Ramón y Cajal.', 'WRITING', NULL, 5),
  (p6, '14th EAACI/UEMS Knowledge Examination in Allergology and Clinical Immunology', 'Certificación internacional otorgada por la European Academy of Allergy and Clinical Immunology (EAACI) en septiembre 2022.', 'CERTIFICATION', NULL, 6);

-- 7. Iria Graña Somoza
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p7, 'Máster en Podología Avanzada', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/podologia-avanzada/', 1),
  (p7, 'Práctica clínica en ILLA DE SALUT DE SILS SL', 'Podóloga en los centros médicos de Sils y Blanes (Cataluña). Quiropodias, biomecánica, podología pediátrica y atención al paciente diabético.', 'PROJECT', NULL, 2),
  (p7, 'Trabajo Fin de Máster - Podología Pediátrica', 'Investigación académica en el marco del Máster en Podología Pediátrica de la Universitat de Barcelona.', 'WRITING', NULL, 3);

-- 8. Julia Bovis Benavides
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p8, 'Máster en Optometría Clínica', 'Programa de dirección académica en ISEIE Innovation School — Contactología avanzada, control de miopía, queratocono y patología corneal.', 'OTHER', 'https://iseie.com/masters/optometria-clinica/', 1),
  (p8, 'Multiópticas Bovis Vision', 'Centro óptico del que es Directora Técnica y Optometrista Principal.', 'PROJECT', NULL, 2),
  (p8, 'Voluntariado en Fundación Jorge Alió', 'Prevención de la ceguera en niños y adultos mayores.', 'COLLABORATION', 'https://www.fundacionjorgealio.org/', 3),
  (p8, 'Certificación Coopervision MiSight 1 day', 'Formación avanzada certificada en control de miopía con lentes de contacto blandas MiSight 1 day.', 'CERTIFICATION', NULL, 4);

-- 9. Lidia Isabel de Sus Martínez
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p9, 'Máster en Obesidad', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/obesidad/', 1),
  (p9, 'Curso de Dietética y Nutrición', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/dietetica-y-nutricion/', 2),
  (p9, 'Tesis Doctoral - "Pie Plano Infantil, Índice de Masa Corporal y Herramientas Diagnósticas"', 'Tesis doctoral defendida en la Universidad de Zaragoza (2024) con calificación Sobresaliente Cum Laude. Accesible en TESEO (Ministerio de Educación) y en el Repositorio Institucional Zaguan de la Universidad de Zaragoza.', 'WRITING', NULL, 3),
  (p9, 'Podoestudio - Clínica de Podología y Biomecánica', 'Doctora-fundadora del centro Podoestudio (Zaragoza). Más de 17 años de práctica clínica continuada.', 'PROJECT', NULL, 4),
  (p9, 'Publicaciones científicas JCR', 'Publicaciones académicas en revistas indexadas en Journal Citation Reports.', 'WRITING', NULL, 5),
  (p9, 'Revisora - Revista Española de Salud Pública (Ministerio de Sanidad)', 'Colaboración como revisora científica en la publicación oficial del Ministerio de Sanidad.', 'WRITING', NULL, 6);

-- 10. Luz Marina Zuluaga Ríos
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p10, 'Curso Podología Pediátrica', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/curso-podologia-pediatrica/', 1);

-- 11. María Dolores Flores Romero
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p11, 'Máster en Tratamiento del Acné', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/tratamiento-del-acne/', 1),
  (p11, 'Curso de Micropigmentación', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/curso-de-micropigmentacion/', 2),
  (p11, 'Curso de Tratamiento del Acné', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/curso-tratamiento-acne/', 3),
  (p11, 'Publicación científica - "Síntesis de Hetarilén Aminopolioles como precursores de moléculas bioactivas"', 'Publicación científica presentada en el II Congreso de Estudiantes de Química (25 de mayo de 2007). Fruto de la investigación predoctoral en el grupo de la Dra. Carmen Ortiz Mellet (Universidad de Sevilla).', 'WRITING', NULL, 4),
  (p11, 'Docencia continuada en Colegio Sagrada Familia (Dos Hermanas)', 'Profesora de Ciencias en educación secundaria desde septiembre 2015 (10+ años).', 'PROJECT', NULL, 5);

-- 12. María Pedreira Pernas
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p12, 'Curso de Auxiliar de Enfermería', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/auxiliar-de-enfermeria/', 1),
  (p12, 'Curso Paramédico', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/paramedico/', 2),
  (p12, 'Enfermería Familia y Comunitaria - Sergas (26+ años)', 'Más de 26 años como Enfermera Especialista en Familia y Comunitaria en el Servizo Galego de Saúde (La Coruña).', 'PROJECT', NULL, 3),
  (p12, 'Profesora Funcionaria - Educación Secundaria', 'Docencia funcionarial en educación secundaria en La Coruña desde septiembre 2024.', 'PROJECT', NULL, 4);

-- 13. Miguel Ángel Vega Maqueda
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p13, 'Máster en Reproducción Asistida Avanzada', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/master-en-reproduccion-asistida-avanzada/', 1);

-- 14. Rosa Inmaculada Monje López
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p14, 'Diplomado en Nutrición Bariátrica', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/diplomados/nutricion-bariatrica/', 1),
  (p14, 'Curso Nutrición Bariátrica', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/nutricion-bariatrica/', 2),
  (p14, 'Curso de Nutrición', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/curso-de-nutricion/', 3),
  (p14, 'Nutrición Integrativa - Proyecto personal', 'Consulta nutricional online y divulgación científica.', 'PROJECT', 'https://nutricionintegrativa.online/', 4);

-- 15. Rubén Broncano Martínez
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p15, 'Máster en Psicología Bariátrica', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/master-en-psicologia-bariatrica/', 1),
  (p15, 'Diplomado en Psicología Bariátrica', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/diplomados/psicologia-bariatrica/', 2),
  (p15, 'Curso Psicología Bariátrica', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/psicologia-bariatrica/', 3),
  (p15, 'Academia de Pensamiento Libre', 'Director y fundador de la Academia de Pensamiento Libre (Granollers, Cataluña). Cursos de Pensamiento Contemporáneo, Historia, Filosofía, Economía Clásica, Psicología y Psicoanálisis.', 'PROJECT', NULL, 4),
  (p15, 'Manuscritos de Psicoanálisis (libro)', 'Editorial Círculo Rojo · 2022.', 'WRITING', NULL, 5),
  (p15, 'Psicoanálisis del Juego de la Oca (libro)', 'Edición disponible en Amazon.', 'WRITING', NULL, 6),
  (p15, 'Psicoterapia lógico-racional: un puente entre el psicoanálisis y la psicología contemporánea', 'Publicación destacada en LinkedIn.', 'WRITING', NULL, 7);

-- 16. Susana Lucas Ballesteros
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p16, 'Curso de Auxiliar de Podología', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/curso-de-auxiliar-de-podologia/', 1),
  (p16, 'Curso de Reflexología Podal', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/curso-de-reflexologia-podal/', 2),
  (p16, 'Curso Auxiliar de Estética', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/curso-auxiliar-de-estetica/', 3),
  (p16, 'Wellnity Studio · Wellnity Space', 'Empresa actual propia (2025-actualidad). Plataforma para escalar negocios wellness con herramientas, cursos y comunidad.', 'PROJECT', NULL, 4),
  (p16, 'The Wellness Team - Formación Alto Rendimiento para Spas', 'Empresa propia previa (2018-2025, 7 años). Asesoría, formación y gestión integral del sector wellness.', 'PROJECT', NULL, 5),
  (p16, 'Programa Superior Wellness & Spa - CESAE Business&Tourism School', 'Tutora desde noviembre 2023.', 'COLLABORATION', NULL, 6),
  (p16, 'B&B Estética Natural y Terapias Manuales', 'Primer emprendimiento propio (Murcia, 2004-2008).', 'PROJECT', NULL, 7);

-- 17. Yacnira Loreleis Martínez Bazán
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p17, 'Máster en Anestesiología y Reanimación', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/anestesiologia-y-reanimacion/', 1),
  (p17, 'Práctica clínica - Hospital Virgen de la Peña (Servicio Canario de Salud)', 'Anestesista a jornada completa desde septiembre 2021 (Fuerteventura).', 'PROJECT', NULL, 2),
  (p17, 'Ex-Presidenta del Capítulo Granma - Sociedad Cubana de Anestesiología y Reanimación', 'Liderazgo institucional 2015-2020 en sociedad científica nacional.', 'COLLABORATION', NULL, 3),
  (p17, '+20 publicaciones científicas en revistas cubanas y extranjeras', 'Producción autoral continuada en el ámbito de la anestesiología y reanimación.', 'WRITING', NULL, 4),
  (p17, 'Profesora Universitaria Auxiliar e Investigadora Auxiliar', 'Categoría académica en la Universidad de Ciencias Médicas de Granma (Cuba).', 'PROJECT', NULL, 5);

-- 18. Dra. María Josep Albert López
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p18, 'Máster en Odontología Digital', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/masters/odontologia-digital/', 1),
  (p18, 'Clínica Albert y Barber (Valencia)', 'Co-dirección de centro de odontología avanzada y estética facial.', 'PROJECT', 'https://www.dramariajosepalbert.com/', 2),
  (p18, 'Perfil verificado en Top Doctors España', 'Verificación pública en plataforma de referencia.', 'CERTIFICATION', 'https://www.topdoctors.es/doctor/maria-josep-albert-lopez/', 3);

-- 19. Luis David Romero García
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p19, 'Curso en Odontología Forense', 'Programa de dirección académica en ISEIE Innovation School.', 'OTHER', 'https://iseie.com/cursos/curso-odontologia-forense/', 1),
  (p19, 'Perito Especializado - Universitat de València', 'Servicios de peritaje forense en evaluaciones dentales, identificación mediante registros odontológicos, estimación de edad y análisis de lesiones (accidentes laborales, siniestros, casos judiciales). Disponible para mutuas, aseguradoras y entidades judiciales en España.', 'CERTIFICATION', NULL, 2),
  (p19, 'Asesor y Experto en Acreditaciones de Competencias Profesionales de Sanidad', 'Comunidad de Madrid · mayo 2023 - actualidad.', 'CERTIFICATION', NULL, 3),
  (p19, 'Tesina "Pit and Fissure Sealants Analysis: In Vitro Study using a Scanning Electron Microscope (SEM)"', 'Investigación en la Academic Unit of Biological and Diagnostic Sciences en Preventive Dentistry de la University of Toronto (Canadá), 2000.', 'WRITING', NULL, 4),
  (p19, 'Publicación científica - "Fluoruros: Efectos Neurotóxicos en Niños"', 'Publicación científica en odontopediatría y epidemiología.', 'WRITING', NULL, 5),
  (p19, 'Congreso Internacional de Gerodontología 2013', 'Participación en congreso internacional especializado.', 'COLLABORATION', NULL, 6),
  (p19, 'Dirección Clínica - Clínica Dental Dr. Romero (México)', 'Clínica propia: Clinic Director y Owner durante más de 5 años (2001-2006) en Naucalpan de Juárez, México.', 'PROJECT', NULL, 7),
  (p19, 'Dirección Clínica - Expansión Vitaldent (Madrid)', 'Clinical Director en Expansión Vitaldent (Madrid) durante 2 años (2008-2009).', 'PROJECT', NULL, 8);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 8: CERTIFICATIONS (as portfolio_items type=CERTIFICATION)
-- Derivadas del contenido de sus bios, experiencias y educación.
-- sort_order >= 10 para no chocar con los items existentes.
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Ramón Miralles López (Derecho Digital)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p1, 'Formación Universitaria en Derecho y TIC', 'Universitat de Barcelona', 'CERTIFICATION', 10),
  (p1, 'Coordinación d''Auditoria i Seguretat de la Informació (15 años de ejercicio)', 'Autoritat Catalana de Protecció de Dades (APDCAT) · 2003-2018', 'CERTIFICATION', 11),
  (p1, 'Vocal Comisión de Transformación Digital', 'Il·lustre Col·legi de l''Advocacia de Barcelona (ICAB) · 2018-2020', 'CERTIFICATION', 12),
  (p1, 'Docente Acreditado - Curso Superior Delegado en Protección de Datos', 'Instituto Universitario de Investigación Ortega y Gasset (IUIOG) · 2018-actualidad', 'CERTIFICATION', 13),
  (p1, 'Docente Acreditado - Derecho de las TIC', 'OBS Business School · 2015-actualidad', 'CERTIFICATION', 14);

-- 2. Mildreth Plata López (Educación)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p2, 'Doctorado en Educación (Sobresaliente Cum Laude)', 'Universitat Jaume I (UJI) - marzo 2023', 'CERTIFICATION', 10),
  (p2, 'Máster Avanzado en Educación Primaria', 'Universidad Complutense de Madrid (UCM)', 'CERTIFICATION', 11),
  (p2, 'Magíster en Administración y Supervisión Educativa', 'Universidad Externado de Colombia', 'CERTIFICATION', 12),
  (p2, 'Especialización en Informática para la Gestión del Talento Humano y Edumática', 'Universidad (Colombia)', 'CERTIFICATION', 13),
  (p2, 'Licenciatura en Básica Primaria con énfasis en Estética', 'UNIMINUTO Colombia', 'CERTIFICATION', 14),
  (p2, 'Certificación Profesional en Dinamización de Proyectos Culturales (520 h)', 'Labora - Servicio Valenciano para el Empleo', 'CERTIFICATION', 15);

-- 3. Alberto Jurado Arévalo (Psiquiatría, Medicina Estética y Trasplante Capilar)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p3, 'Especialidad MIR en Psiquiatría', 'Servicio Andaluz de Salud (SAS) · 2021-2025', 'CERTIFICATION', 10),
  (p3, 'Medical Degree (Grado en Medicina)', 'Universitat Autònoma de Barcelona (UAB) · 2011-2017', 'CERTIFICATION', 11),
  (p3, 'Diplomado Universitario en Enfermería (DUE)', 'Universidad de Huelva · 2005-2008', 'CERTIFICATION', 12),
  (p3, 'Máster Universitario en Dirección y Gestión Sanitaria', 'UNIR - Universidad Internacional de La Rioja · 2023', 'CERTIFICATION', 13),
  (p3, 'Máster Universitario en Psicoterapia - Terapias de Tercera Generación', 'UNIR - Universidad Internacional de La Rioja · 2024', 'CERTIFICATION', 14),
  (p3, 'Master of Science en Valoración Médica del Daño Corporal', 'ediae - Escuela de Dirección y Altos Estudios / Universidad de Granada · 2024-2025', 'CERTIFICATION', 15),
  (p3, 'Máster en Urgencias, Emergencias y Catástrofes', 'Universidad CEU Cardenal Herrera · 2021', 'CERTIFICATION', 16),
  (p3, 'Máster en Tricología y Cirugía Capilar', 'UDIMA - Universidad a Distancia de Madrid · en colaboración con CIEP Córdoba · 2019-2020', 'CERTIFICATION', 17),
  (p3, 'Máster en Medicina Estética', 'UDIMA - Universidad a Distancia de Madrid · en colaboración con CIEP Córdoba · 2019-2020', 'CERTIFICATION', 18),
  (p3, 'Máster en Urgencias, Emergencias y Cuidados Críticos', 'Universidad Europea · 2009-2010', 'CERTIFICATION', 19),
  (p3, 'Experto Universitario en Urgencias y Emergencias Extrahospitalarias', 'Universidad Europea · 2009-2010', 'CERTIFICATION', 20),
  (p3, 'Cualificación Universitaria en Misiones HEMS (Helicopter Emergency Medical Services)', 'Universidad de Zaragoza · INAER · 2012', 'CERTIFICATION', 21),
  (p3, 'Experto Universitario en Prescripción Enfermera', 'Escuela de Ciencias de la Salud - Universidad Complutense de Madrid · 2011', 'CERTIFICATION', 22);

-- 4. Cristina Moreno Martín (Medicina Hiperbárica)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p4, 'Máster en Medicina Hiperbárica', 'Comité Coordinador de Centros de Medicina Hiperbárica (CCCMH)', 'CERTIFICATION', 10),
  (p4, 'Máster en Medicina Subacuática', 'Sociedad Española de Medicina Subacuática e Hiperbárica (SEMSHI)', 'CERTIFICATION', 11),
  (p4, 'Máster en Medicina Estética', 'Universidad Católica San Antonio de Murcia (UCAM)', 'CERTIFICATION', 12),
  (p4, 'Máster en Neurociencia y Dolor', 'Universidad Internacional Menéndez Pelayo (UIMP)', 'CERTIFICATION', 13),
  (p4, 'Operación de Cámaras Hiperbáricas Monoplaza', 'Formación técnica clínica', 'CERTIFICATION', 14);

-- 5. Irene Pulido García (Neuropsicología)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p5, 'Colegiada en el Col·legi Oficial de Psicologia de Catalunya (COPC) - Nº 30325', 'Col·legi Oficial de Psicologia de Catalunya - válido jun. 2022 a jun. 2027', 'CERTIFICATION', 10),
  (p5, 'Máster Oficial en Neuropsicología', 'Universitat Oberta de Catalunya (UOC) - Nota 9', 'CERTIFICATION', 11),
  (p5, 'Máster Oficial en Psicogerontología', 'Universitat de Barcelona (UB) - Nota 9', 'CERTIFICATION', 12),
  (p5, 'Graduada en Psicología', 'Universitat de València', 'CERTIFICATION', 13),
  (p5, 'Curso en Acompañamiento y Gestión de Procesos de Duelo', 'Consorci Generalitat de Catalunya - Nota 10', 'CERTIFICATION', 14),
  (p5, 'Preliminary English Test (B1)', 'Cambridge University Press & Assessment - mayo 2022 - ID B8030057', 'CERTIFICATION', 15),
  (p5, 'Curso en Primeros Auxilios Psicológicos', 'Universitat Autònoma de Barcelona (UAB)', 'CERTIFICATION', 16),
  (p5, 'Certificado en Intervención y Abordaje de Alteraciones de Conducta en Tercera Edad', 'Formación Laboral Integral', 'CERTIFICATION', 17),
  (p5, 'Certificado en Terapia con Animales', 'Formación Laboral Integral', 'CERTIFICATION', 18),
  (p5, 'Certificado en Terapia con Muñecas (Trastorno Neurocognitivo Mayor)', 'Formación Laboral Integral', 'CERTIFICATION', 19),
  (p5, 'Certificat en Suport Vital Bàsic i DESA/DEA', 'Technology2050 - Espais Cardioprotegits de Catalunya', 'CERTIFICATION', 20);

-- 6. Elena María Granados Alarcón (Alergología y Medicina Estética)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p6, 'Grado en Medicina', 'Universidad Complutense de Madrid (UCM) · 2012-2018', 'CERTIFICATION', 10),
  (p6, 'Residencia MIR en Alergología (4 años)', 'Hospital Universitario Ramón y Cajal · 2019-2023', 'CERTIFICATION', 11),
  (p6, 'Máster en Medicina Estética, Nutrición y Antienvejecimiento', 'UDIMA - Universidad a Distancia de Madrid · 2022-2023', 'CERTIFICATION', 12),
  (p6, 'Máster en Medicina Estética · Nutrición, Obesidad y Microbiota', 'UDIMA - Universidad a Distancia de Madrid · 2024', 'CERTIFICATION', 13),
  (p6, 'Programa Model United Nations', 'University of Pennsylvania · 2012', 'CERTIFICATION', 14);

-- 7. Iria Graña Somoza (Podología)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p7, 'Máster en Podología Pediátrica', 'Universitat de Barcelona', 'CERTIFICATION', 10),
  (p7, 'Grado en Podología', 'Universidade da Coruña', 'CERTIFICATION', 11),
  (p7, 'Ciclo Formativo de Grado Superior en Anatomía Patológica y Citodiagnóstico', 'CPR Aloya', 'CERTIFICATION', 12),
  (p7, 'Calzado y Biomecánica Infantil de 0 a 8 años', 'World Academy of Podiatry Science', 'CERTIFICATION', 13),
  (p7, 'Interpretación de RMN, TC y Rx', 'World Academy of Podiatry Science', 'CERTIFICATION', 14),
  (p7, 'B1 Inglés con Especialidad en Ciencias de la Salud', 'Universidad Internacional Menéndez Pelayo (UIMP)', 'CERTIFICATION', 15),
  (p7, 'Grado en Psicología (en curso)', 'Universidad Nacional de Educación a Distancia (UNED)', 'CERTIFICATION', 16);

-- 8. Julia Bovis Benavides (Optometría)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p8, 'Formación Avanzada en Lentes Esclerales', 'Formación de posgrado especializada', 'CERTIFICATION', 10),
  (p8, 'Certificación en Ortoqueratología (Orto-K)', 'Formación de posgrado especializada', 'CERTIFICATION', 11),
  (p8, 'Especialización en Queratocono (David Piñero / Joaquín Fernández)', 'Formación especializada', 'CERTIFICATION', 12),
  (p8, 'Adaptación de Lentes Multifocales', 'Formación clínica especializada', 'CERTIFICATION', 13);

-- 9. Lidia Isabel de Sus Martínez (Obesidad y Nutrición)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p9, 'Doctorado Sobresaliente Cum Laude en Ciencias de la Salud y del Deporte', 'Universidad de Zaragoza · 2020-2024', 'CERTIFICATION', 10),
  (p9, 'Grado en Medicina Podológica (Podología)', 'Universidad Miguel Hernández de Elche · 2006-2009', 'CERTIFICATION', 11),
  (p9, 'Diplomatura en Nutrición Humana y Dietética', 'Universidad de Zaragoza · 2003-2006', 'CERTIFICATION', 12),
  (p9, 'Máster en Bioética', 'Universitat de València · 2019-2020', 'CERTIFICATION', 13),
  (p9, 'Experto Universitario en Pie Diabético', 'Universidad de Extremadura · 2012-2013', 'CERTIFICATION', 14),
  (p9, 'Certificación Inglés Nivel C1', 'Escuela Oficial de Idiomas (EOI) de Zaragoza · 2012-2015', 'CERTIFICATION', 15),
  (p9, 'Revisora científica acreditada', 'Revista Española de Salud Pública (Ministerio de Sanidad)', 'CERTIFICATION', 16);

-- 10. Luz Marina Zuluaga Ríos (Cirugía Pie Diabético)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p10, 'Fellow en Cirugía de Pie Diabético', 'Universidad Complutense de Madrid', 'CERTIFICATION', 10),
  (p10, 'Especialización en Rehabilitación Cardiopulmonar', 'Fundación Favaloro (Buenos Aires)', 'CERTIFICATION', 11),
  (p10, 'Ecografía Clínica Vascular', 'Formación continua especializada', 'CERTIFICATION', 12),
  (p10, 'Cátedra en Morfofisiología y Farmacología', 'Universidad Complutense de Madrid', 'CERTIFICATION', 13);

-- 11. María Dolores Flores Romero (Química y Dermocosmética)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p11, 'Licenciatura en Química', 'Universidad de Sevilla · 2002-2008', 'CERTIFICATION', 10),
  (p11, 'Máster Universitario en Profesorado de Educación Secundaria y Bachillerato (MAES)', 'Universidad de Sevilla · 2009-2010', 'CERTIFICATION', 11),
  (p11, 'Máster en Dermocosmética y Formulación', 'Universidad a Distancia de Madrid (UDIMA) · oct. 2023 - mayo 2024', 'CERTIFICATION', 12),
  (p11, 'Acreditación Docente Oficial - Delegación de Educación', 'Junta de Andalucía · 2017', 'CERTIFICATION', 13),
  (p11, 'Implantación Normas ISO, BRC e IFS', 'Experiencia profesional en OVOPAK (Responsable Dpto. Calidad)', 'CERTIFICATION', 14);

-- 12. María Pedreira Pernas (Enfermería)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p12, 'Máster en Prevención de Riesgos Laborales', 'Universidad a Distancia de Madrid (UDIMA)', 'CERTIFICATION', 10),
  (p12, 'Máster en Dirección Médica y Gestión Clínica', 'Escuela Nacional de Sanidad - Instituto de Salud Carlos III', 'CERTIFICATION', 11),
  (p12, 'Soporte Vital Básico y Avanzado (SVB/SVA)', 'Formación continua en urgencias y emergencias', 'CERTIFICATION', 12),
  (p12, 'Acreditación docente en Ciclos Formativos Sanitarios', 'Sistema educativo reglado', 'CERTIFICATION', 13);

-- 13. Miguel Ángel Vega Maqueda (Reproducción Asistida)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p13, 'Máster en Reproducción Humana Asistida', 'Centro de Formación Permanente - Universidad de Sevilla', 'CERTIFICATION', 10),
  (p13, 'Formación Especializada - Unidad de Reproducción Asistida', 'Hospital Universitario Virgen del Rocío (Sevilla)', 'CERTIFICATION', 11),
  (p13, 'FP Grado Superior - Técnico en Cuidados Auxiliares de Enfermería (TCAE)', 'Junta de Andalucía - Formación Profesional Reglada', 'CERTIFICATION', 12),
  (p13, 'Vitrificación y Criobiología Aplicada a FIV', 'Formación clínica especializada', 'CERTIFICATION', 13);

-- 14. Rosa Inmaculada Monje López (Nutrición y Microbiota)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p14, 'Grado en Nutrición y Dietética', 'Universidad Isabel I de Castilla', 'CERTIFICATION', 10),
  (p14, 'Máster en Nutrición y Dietética Humanas', 'Universidad Isabel I de Castilla', 'CERTIFICATION', 11),
  (p14, 'Máster en Microbiota Humana', 'Universidad Católica San Antonio de Murcia (UCAM)', 'CERTIFICATION', 12),
  (p14, 'Gestión de Calidad Hospitalaria - Normativa ISO', 'Hospital de Manacor', 'CERTIFICATION', 13);

-- 15. Rubén Broncano Martínez (Psicología y Psicoanálisis)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p15, 'Psicólogo Colegiado nº 12813', 'Colegio Oficial de Psicología', 'CERTIFICATION', 10),
  (p15, 'Licenciatura en Psicología - Psicología Educativa', 'Universitat de Girona · 1996-2001', 'CERTIFICATION', 11),
  (p15, 'Therapist International Psychoanalysis Training', 'International Psychoanalysis Training Institute · 2025', 'CERTIFICATION', 12),
  (p15, 'Colaborador clínico acreditado en Mutuas Privadas', 'Sanitas, Aegon, Caser, Cigna, DKV y Adeslas', 'CERTIFICATION', 13),
  (p15, 'Autor publicado - "Manuscritos de Psicoanálisis"', 'Editorial Círculo Rojo · 2022', 'CERTIFICATION', 14);

-- 16. Susana Lucas Ballesteros (Wellness)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p16, 'Diplomada en Quiromasaje · Masaje Deportivo · Reflexología Podal · Drenaje Linfático · Quiropráctica · Masaje Tailandés', 'Escuela de Terapias Manuales de Murcia · 2005-2006', 'CERTIFICATION', 10),
  (p16, 'Formador de Formadores', 'Euroinnova International Online Education · 2015', 'CERTIFICATION', 11),
  (p16, 'Curso "El ABC del Copywriting" - Escritura Persuasiva y Marketing de Contenidos', 'Escuela de Copywriting de Maïder Tomasena · 2019', 'CERTIFICATION', 12),
  (p16, 'Community Manager - Metodología Estima', 'Mamis Digitales · 2018', 'CERTIFICATION', 13),
  (p16, 'Grado en Psicología (en curso)', 'Universidad Nacional de Educación a Distancia (UNED) · desde octubre 2022', 'CERTIFICATION', 14);

-- 17. Yacnira Loreleis Martínez Bazán (Anestesiología)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p17, 'Doctora en Medicina', 'Instituto Superior de Ciencias Médicas de Santiago de Cuba · 1988-1994', 'CERTIFICATION', 10),
  (p17, 'Especialista de Primer Grado en Anestesiología y Reanimación', 'Instituto de Ciencias Médicas de Santiago de Cuba · Formación hospitalaria en H.U. Carlos Manuel de Céspedes · 1996-2000', 'CERTIFICATION', 11),
  (p17, 'Máster en Urgencias Médicas', 'Universidad de Ciencias Médicas de Granma · 2007-2010', 'CERTIFICATION', 12),
  (p17, 'Máster en Anestesiología y Reanimación y Tratamiento del Dolor', 'Universidad española (Máster Internacional)', 'CERTIFICATION', 13),
  (p17, 'Categoría Universitaria Auxiliar e Investigadora Auxiliar', 'Universidad de Ciencias Médicas de Granma', 'CERTIFICATION', 14);

-- 18. Dra. María Josep Albert López (Odontología Digital y Periodoncia)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p18, 'Máster Universitario en Periodoncia, Osteointegración y Periimplantología', 'Programa de posgrado universitario', 'CERTIFICATION', 10),
  (p18, 'Postgrado en Estética Facial', 'Sociedad Española de Medicina Estética (SEME)', 'CERTIFICATION', 11),
  (p18, 'Formación en Diseño Digital de Sonrisa (DSD)', 'Formación clínica especializada', 'CERTIFICATION', 12),
  (p18, 'Cirugía Periodontal e Injertos de Tejido', 'Formación clínica especializada', 'CERTIFICATION', 13);

-- 19. Luis David Romero García (Odontología Forense)
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p19, 'Master of Formación Permanente en Medicina Forense', 'Universitat de València · octubre 2024', 'CERTIFICATION', 10),
  (p19, 'Posgrado en Medicina Forense', 'Universitat de València · enero 2024 - julio 2025', 'CERTIFICATION', 11),
  (p19, 'Bachelor of Dental Surgery (BDS) · Master of Science in Dental Surgery (MSc DS)', 'Universidad Europea · 2012-2013 · con Recognition of Studies in European Union', 'CERTIFICATION', 12),
  (p19, 'Diploma in Oral Diagnosis', 'UAM - Universidad Autónoma Metropolitana · 2003-2004 · bajo Dr. Adalberto Mosqueda Taylor', 'CERTIFICATION', 13),
  (p19, 'Bachelor of Dentistry, Bachelor of Surgery (MBBS) · Cirujano Dentista', 'Universidad Nacional Autónoma de México (UNAM) · 1997-2001', 'CERTIFICATION', 14);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. After running this migration, verify in /tutores or /directores listing
--    that the 19 profiles appear correctly with avatars and headlines.
-- 2. Profiles are set to job_seeking_status = 'NOT_LOOKING' and
--    is_open_to_messages = false (they are teachers, not jobseekers).
-- 3. Slugs follow the same pattern as the ISEIE source URL:
--    https://iseie.com/director/<slug>/
-- 4. Brand color #1E40AF mirrors ISEIE's institutional navy.
-- 5. Status of previously pending items (resolved 2026-05-19):
--    - Profile #8 (Julia Bovis Benavides): bio COMPLETED with information
--      provided directly by ISEIE — Óptico-Optometrista (U. Alicante),
--      más de 10 años, Directora Técnica de Multiópticas Bovis Vision,
--      especialista en contactología avanzada y control de miopía.
--    - Profile #10 (Luz Marina Zuluaga): bio CONFIRMED by ISEIE. The
--      mismatch between her clinical profile (cirugía pie diabético,
--      vascular, adults) and the assigned Curso de Podología Pediátrica
--      is an academic decision by ISEIE and remains as-is.
-- ============================================================================
