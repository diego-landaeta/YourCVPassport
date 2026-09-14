-- ============================================================================
-- SEED: Antonio Uclés Cruz · Ingeniero HVAC · Tutor ICTESS
-- Date: 2026-09-14
-- Source: https://www.linkedin.com/in/antoniouclescruz (revisado el 14/09/2026)
--         Única fuente disponible: no hay ficha publicada en ictess.com ni CV.
-- Template: passport
-- Brand color: #B45309 (ámbar oscuro). ICTESS usa como corporativo el amarillo
--              #FFCF34, inservible como acento sobre blanco (contraste 1.6:1);
--              su azul #21397D quedaría casi idéntico al de ISEIE (#1E40AF).
--              ⚠️ PENDIENTE DE VALIDACIÓN por el responsable de marca.
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- ⚠️  auth.user creado el 14/09/2026 con el UUID real indicado abajo.
--     Email: antonio.ucles@ictess.com
-- ============================================================================

DO $$
DECLARE
  p CONSTANT UUID := '351e963c-8497-4ada-934a-f62645490f44';  -- UUID real: Antonio Uclés Cruz
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
  full_name = 'Antonio Uclés Cruz',
  headline = 'International Key Account Manager en Daikin Europe · Ingeniero mecánico especializado en refrigeración y climatización · MBA · Proyectos HVAC en EMEA',
  summary = 'Ingeniero mecánico especializado en refrigeración y aire acondicionado, con trece años de trayectoria continuada en el sector HVAC recorridos de abajo arriba: de la reparación de maquinaria de climatización y la gestión de proyectos como autónomo, a la dirección de un departamento de ingeniería, y de ahí a la gestión internacional de grandes cuentas en el mayor fabricante mundial de climatización. Esa progresión completa es lo que define su perfil: conoce el producto desde el taller y la obra, y lo negocia desde la mesa comercial. Comenzó en 2013 como responsable de equipo para proyectos HVAC en régimen freelance, seis años y ocho meses en los que asumió la gestión económica y de personal de los proyectos y la reparación de maquinaria de aire acondicionado, compaginándolo con sus estudios de ingeniería. En 2019 entró como HVAC engineer en ALITER Climatización y Frío Industrial, ocupándose de la elaboración de planos as-built y del control técnico y económico de las instalaciones. En marzo de 2020 dio el salto a la dirección: durante casi tres años fue Head of Engineering Department en Abessis Building & Shopfitting, en la Comunidad Valenciana, donde lideró un equipo y supervisó la totalidad de los proyectos de ingeniería del departamento. Desde enero de 2023 trabaja en Daikin Europe, con base en Bruselas. Primero como International Project Manager durante dos años y medio, dando soporte técnico a los Key Account Managers internacionales, coordinando proyectos y liderando equipos por toda la región EMEA con presupuestos de entre un millón y cien millones de euros. Desde junio de 2025 es International Key Account Manager, responsable de la gestión estratégica de cuentas internacionales de HVAC en EMEA. Su formación combina el Grado en Ingeniería Mecánica por la Universitat Politècnica de València, con especialización en refrigeración y aire acondicionado y un cuarto curso realizado como Erasmus en el Instituto Superior Técnico de Lisboa, con un MBA en Business Administration por la Universitat de València, la titulación que articula su giro desde la ingeniería pura hacia la dirección comercial y de proyectos. Domina el inglés, el español y el portugués, y maneja herramientas de diseño y simulación como AutoCAD, Autodesk Inventor, MATLAB, Simulink y Simio.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#B45309',
  location = 'Bruselas, Bélgica', country_code = 'BE',
  slug = 'antonio-ucles', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Antonio Uclés Cruz · International Key Account Manager HVAC · Daikin Europe',
  meta_description = 'Ingeniero mecánico especializado en refrigeración y climatización con 13 años en HVAC. International Key Account Manager en Daikin Europe (EMEA), MBA por la Universitat de València. Tutor en ICTESS.',
  linkedin_url = 'https://www.linkedin.com/in/antoniouclescruz'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EXPERIENCES · todas con fechas REALES de LinkedIn
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'Daikin Europe', 'International Key Account Manager - HVAC EMEA', '2025-06-15', NULL, true, 'Gestión estratégica de cuentas internacionales de climatización (HVAC) en toda la región EMEA para Daikin Europe, con base en Bruselas y en modalidad presencial. Responsable de la relación con grandes cuentas internacionales, de su captación y retención, y de la negociación comercial. Continuidad natural de su etapa previa como International Project Manager en la misma compañía, ahora desde el lado de la dirección comercial.', 1),
  (p, 'Daikin Europe', 'International Project Manager - EMEA', '2023-01-15', '2025-06-15', false, 'Dos años y medio dando soporte técnico a los International Key Account Managers y garantizando la correcta ejecución de todas las actividades asociadas. Coordinación de proyectos y liderazgo de equipos multifuncionales por toda la región EMEA, con gestión de presupuestos comprendidos entre un millón y cien millones de euros. Etapa que combina la responsabilidad técnica sobre el proyecto con la coordinación de equipos repartidos en varios países.', 2),
  (p, 'Abessis Building & Shopfitting', 'Head of Engineering Department', '2020-03-15', '2023-01-15', false, 'Casi tres años al frente del departamento de ingeniería (Comunidad Valenciana). Dirección de un equipo de tres personas y supervisión de la totalidad de los proyectos de ingeniería del departamento. Responsabilidad sobre la planificación, el desarrollo técnico y la entrega de los proyectos, además de negociación y desarrollo de negocio.', 3),
  (p, 'ALITER Climatización y Frío Industrial (Aliter Soluciones Energéticas)', 'HVAC Engineer', '2019-09-15', '2020-03-15', false, 'Ingeniero de climatización y frío industrial. Elaboración de planos as-built, control técnico y económico de las instalaciones, puesta en marcha de equipos y trabajo sobre sistemas de bomba de calor.', 4),
  (p, 'Profesional independiente (freelance)', 'Team Manager - Proyectos HVAC', '2013-01-15', '2019-08-15', false, 'Seis años y ocho meses como responsable de equipo en proyectos de climatización en régimen freelance, en Valencia. Gestión económica y de personal de los proyectos, y reparación de maquinaria de aire acondicionado. Etapa de base técnica que compaginó con su formación en ingeniería y que le da un conocimiento de campo poco habitual en perfiles que acaban en gestión internacional de cuentas.', 5);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: EDUCATION · años reales de LinkedIn (mes estimado: ver nota 3)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'Universitat de València', 'Máster en Business Administration (MBA)', 'Business Administration', '2020-09-15', '2021-07-15', 1),
  (p, 'Universitat Politècnica de València (UPV)', 'Grado en Ingeniería Mecánica - Especialización en refrigeración y aire acondicionado', 'Ingeniería Mecánica · Refrigeración y Climatización', '2015-09-15', '2020-06-15', 2),
  (p, 'Instituto Superior Técnico (Lisboa)', 'Ingeniería Mecánica - Curso Erasmus', 'Ingeniería Mecánica', '2018-09-15', '2019-06-15', 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS (de sus 41 aptitudes de LinkedIn; se descartan las
-- genéricas sin valor informativo y las de idioma, que van en STAGE 6)
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'Climatización y sistemas HVAC', 'EXPERT', 1),
  (p, 'Refrigeración y frío industrial', 'EXPERT', 2),
  (p, 'Bombas de calor', 'ADVANCED', 3),
  (p, 'Ingeniería mecánica', 'EXPERT', 4),
  (p, 'Puesta en marcha de instalaciones (Project Commissioning)', 'EXPERT', 5),
  (p, 'Gestión de proyectos internacionales', 'EXPERT', 6),
  (p, 'Gestión de grandes cuentas (Key Account Management)', 'EXPERT', 7),
  (p, 'Captación y retención de grandes cuentas', 'EXPERT', 8),
  (p, 'Ventas internacionales', 'EXPERT', 9),
  (p, 'Dirección comercial', 'ADVANCED', 10),
  (p, 'Negociación comercial y contractual', 'EXPERT', 11),
  (p, 'Estrategia de negocio', 'ADVANCED', 12),
  (p, 'Desarrollo de negocio', 'ADVANCED', 13),
  (p, 'Liderazgo de equipos multifuncionales', 'EXPERT', 14),
  (p, 'Dirección de departamento de ingeniería', 'ADVANCED', 15),
  (p, 'Control técnico y económico de proyectos', 'EXPERT', 16),
  (p, 'Gestión de presupuestos de 1M€ a 100M€', 'ADVANCED', 17),
  (p, 'Optimización de procesos', 'ADVANCED', 18),
  (p, 'Orientación al cliente', 'ADVANCED', 19),
  (p, 'Desarrollo de personas', 'ADVANCED', 20),
  (p, 'AutoCAD y planos as-built', 'ADVANCED', 21),
  (p, 'Autodesk Inventor', 'ADVANCED', 22),
  (p, 'MATLAB y Simulink', 'ADVANCED', 23),
  (p, 'Simio (simulación de procesos)', 'INTERMEDIATE', 24),
  (p, 'Microsoft Office (Excel, PowerPoint, Word)', 'ADVANCED', 25);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: LANGUAGES
-- ⚠️ Su LinkedIn declara 4 idiomas pero la sección no se ha podido desplegar.
--    Se cargan los 3 que aparecen validados en sus aptitudes. El cuarto queda
--    PENDIENTE (probable francés o valenciano; no se inventa). Ver nota 4.
--    Los niveles son estimados: LinkedIn no los muestra en las aptitudes.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Castellano', 'Native', true, 1),
  (p, 'Inglés', 'C1', false, 2),
  (p, 'Portugués', 'B2', false, 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 8: CERTIFICATIONS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES
  (p, 'Gestión de Grandes Cuentas HVAC en EMEA', 'Gestión estratégica de cuentas internacionales de climatización en la región EMEA para Daikin Europe: captación y retención de grandes cuentas, negociación comercial y coordinación con los equipos técnicos de cada país.', 'PROJECT', ARRAY['Key Account Management','HVAC','EMEA'], 1),
  (p, 'Dirección de Proyectos Internacionales de 1M€ a 100M€', 'Coordinación de proyectos y liderazgo de equipos multifuncionales por toda la región EMEA, con responsabilidad sobre presupuestos de entre uno y cien millones de euros y soporte técnico a los Key Account Managers internacionales.', 'PROJECT', ARRAY['Project Management','Presupuestos','Equipos Internacionales'], 2),
  (p, 'Dirección del Departamento de Ingeniería en Abessis', 'Liderazgo del departamento de ingeniería durante casi tres años: supervisión de la totalidad de los proyectos, gestión de un equipo de tres personas y responsabilidad sobre planificación, desarrollo técnico y entrega.', 'PROJECT', ARRAY['Dirección de Ingeniería','Liderazgo','Proyectos'], 3),
  (p, 'Proyectos HVAC como Profesional Independiente', 'Seis años y ocho meses gestionando proyectos de climatización en régimen freelance: control económico y de personal, ejecución en obra y reparación de maquinaria de aire acondicionado.', 'PROJECT', ARRAY['HVAC','Freelance','Gestión de Obra'], 4);

INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p, 'Cultivating a Growth Mindset', 'LinkedIn · febrero 2023', 'CERTIFICATION', 100),
  (p, 'Dan Ariely on Making Decisions', 'LinkedIn · enero 2023', 'CERTIFICATION', 101),
  (p, 'Erasmus en Instituto Superior Técnico de Lisboa', 'Cuarto curso de Ingeniería Mecánica · 2018-2019', 'CERTIFICATION', 102);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. URL pública prevista: https://yourcvpassport.com/cv/antonio-ucles
-- 2. SIN AVATAR: no se ha descargado su foto de LinkedIn. Pedírsela a él o a
--    ICTESS; no se descarga de LinkedIn sin su consentimiento.
-- 3. FECHAS: las de experiencia son EXACTAS (LinkedIn las publica al mes).
--    En educación LinkedIn sólo da el año; el mes (septiembre inicio / junio
--    o julio fin) es la convención de curso académico español, estimada.
-- 4. ⚠️  IDIOMAS INCOMPLETOS: su LinkedIn indica "Idiomas (4)" pero esa sección
--    no aparece desplegada en las capturas disponibles. Se cargan los tres que
--    figuran validados entre sus aptitudes (inglés 3 validaciones, español 1,
--    portugués 1). Falta el cuarto: dado que reside en Bruselas y estudió en
--    Valencia, lo más probable es francés o valenciano, pero NO se inventa.
--    Los NIVELES (C1/B2) son estimaciones razonables a partir de su recorrido
--    profesional, no datos declarados. Confirmar ambos extremos con él.
-- 5. ENCAJE CON ICTESS: el instituto (Instituto de Ciencias y Tecnologías para
--    la Eficiencia y Sostenibilidad) imparte formación técnica online en
--    energía, climatización y refrigeración, instalaciones industriales, venta
--    técnica y gestión de proyectos. Su perfil encaja en tres de esas áreas.
--    ⚠️ Este seed NO le da de alta como tutor en ictess.com: eso es un alta en
--    la web del instituto, ajena a este repositorio.
-- 6. COLOR PENDIENTE: #B45309 es una propuesta. El corporativo de ICTESS es el
--    amarillo #FFCF34, que como acento sobre blanco es ilegible (1.6:1).
-- 7. country_code = 'BE' porque su etapa actual (Daikin Europe) es en Bruselas,
--    mismo criterio aplicado a otros perfiles con doble ubicación.
-- 8. Fechas en día 15 por el bug de formatDate() (ver migración de Aleix Mabres).
-- 9. degree y position con texto descriptivo largo a propósito: la plantilla no
--    renderiza field_of_study y la caché de traducción degrada los términos de
--    una sola palabra (ver notas de la migración de Arantxa Saiz).
-- ============================================================================
