-- ============================================================================
-- SEED: Aleix Mabres Seoane · Ingeniero de Proyectos de Automatización Industrial
-- Date: 2026-08-17
-- Source: CV en PDF aportado por el propio interesado (AleixCV+Proyectos.pdf)
-- Template: passport (mismo que el resto de perfiles del proyecto)
-- Brand color: #0369A1 (azul acero — perfil independiente, no ISEIE #1E40AF
--              ni PsikoAprende #0D9488)
-- Safe to re-run: cleanup DELETEs make INSERTs idempotent
--
-- Auth user creado en Supabase Dashboard.
-- UUID: 57d205ec-b345-4367-80c2-240c89dd641e
--
-- NOTAS DE CRITERIO (ver POST-DEPLOYMENT NOTES al final):
--  · El CV no nombra a las empresas de los puestos 1, 2 y 3: se describen por
--    sector, tal y como aparecen en el original.
--  · El CV sólo aporta AÑOS. Los meses de inicio/fin son una interpretación
--    conservadora para evitar solapamientos en la línea temporal.
--  · Teléfono y dirección postal NO se publican (privacidad). Sólo municipio.
-- ============================================================================

DO $$
DECLARE
  p CONSTANT UUID := '57d205ec-b345-4367-80c2-240c89dd641e';  -- Aleix Mabres Seoane
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
  full_name = 'Aleix Mabres Seoane',
  headline = 'Ingeniero de Proyectos de Automatización Industrial · PCS7, STEP7 y TIA Portal Unified · Puestas en marcha internacionales',
  summary = 'Ingeniero de automatización industrial con más de 14 años de trayectoria continuada en el control de procesos, desde el diseño y montaje de cuadros eléctricos hasta la dirección técnica de proyectos llave en mano con decenas de miles de señales. Su perfil combina dos cosas que rara vez van juntas: profundidad real en el ecosistema Siemens de gama alta —PCS7, STEP7, TIA Portal, TIA Portal Unified, SIMIT, WinCC, WinCC OA— y experiencia de campo en puesta en marcha "on site" en seis países, trabajando directamente en planta hasta las pruebas de integración y aceptación con el cliente. Su formación arranca en el Grado Superior en Automoción (Monlau, 2005-2007) y se consolida con la Diplomatura en Ingeniería Técnica Electrónica por la EUETIB - Escola Universitària d''Enginyeria Tècnica Industrial de Barcelona, adscrita a la Universitat Politècnica de Catalunya (2007-2011). Esa etapa universitaria la compagina con una beca en SIEMENS (Cornellà, 2010-2011), en el departamento de climatización de edificios, donde toca ya la parte comercial y técnica del negocio: gestión de pedidos y stock, oferta de material, configuración de controladores Synco, esquemas eléctricos y atención al cliente. Entre 2011 y 2013 ejerce como Técnico en una empresa dedicada a la automatización de procesos industriales, maquinaria y diseño y montaje de cuadros eléctricos, una etapa formativa clave en la que cubre el ciclo completo: programación de PLC Siemens con STEP7 y PCS7, PLC Rockwell con RSLogix, configuración de sistemas SCADA, diseño y programación de pantallas táctiles, esquemas eléctricos con AutoCAD Electrical y EPLAN, y el propio montaje físico del cuadro. De esa época son dos proyectos sobre infraestructura pública de Barcelona —la línea de reciclaje de vidrio y un nuevo módulo de cogeneración de energía en el vertedero de Barcelona, ambos con PCS7— junto a la automatización de una máquina de detección de metales en tejidos y una planta de transformación de sangre de cerdo en harinas con STEP7 y FactoryTalk. En 2014 pasa como Ingeniero de Automatización a un fabricante de transportadores para centros logísticos, donde suma la vertiente de documentación y especificación técnica y funcional de proyecto, y pone en marcha almacenes inteligentes para dos operadores de referencia en alimentación y decoración del hogar. Desde 2015 y hasta la actualidad ejerce como Ingeniero de Proyectos en una empresa de informática industrial, orientada principalmente a los sectores químico, farmacéutico y alimentario, donde su alcance se amplía a la totalidad del ciclo del proyecto: estudio y colaboración en el desarrollo de especificaciones funcionales, programación de PLC Siemens con STEP7 y PCS7 en todos sus lenguajes (SCL, KOP, SFC, CFC), modificación y creación de elementos de librería propios siguiendo el estándar PCS7, configuración desde cero de herramientas como SIMATIC BATCH y SIMATIC ENERGY, programación de PLC Allen-Bradley con RSLogix, sistemas SCADA con trazabilidad de producción sobre base de datos, diseño y programación de HMI (TIA Portal, WinCC flexible, FactoryTalk), configuración de variadores, comunicaciones entre PLC vía Ethernet y Modbus, y programación de bloques Safety con PCS7 y STEP7. Una especialidad diferencial de esta etapa es el uso de SIMIT para construir gemelos virtuales de planta: simular el proceso antes de pisar la fábrica permite validar el software, reducir drásticamente la ventana de parada en las puestas en marcha y formar a los operarios sobre una planta virtual antes de que la real arranque. Su cartera de proyectos es marcadamente internacional y de proceso continuo: una desaladora de agua en Sohar (Omán) con más de 12.000 señales sobre PCS7; papeleras en Rouen (Francia) y en Surazh (Rusia), esta última implantada con simulación previa en SIMIT para minimizar el tiempo de parada; una planta farmacéutica en Bangladesh para fabricación de sueros con STEP7 y WinCC flexible; recuperación de energía en una planta de motores en Daventry (Reino Unido) con TIA Portal; y una cabina de captación de agua para una desaladora en Chile con TIA Portal Unified. En el mercado nacional acumula una nueva línea de producción de chocolate en polvo con trazabilidad por SIMATIC BATCH, una línea de sueros para una farmacéutica de primer nivel con Wonderware, una planta química con SIMATIC BATCH y SIMATIC ENERGY para control de consumos, el gemelo virtual de una fábrica de gelatina, el control de hornos de secado de pintura ignífuga para vigas de construcción y la automatización de una freidora industrial de comida preparada con TIA Portal Unified. El patrón que recorre toda su carrera es el mismo: desarrollo del software en oficina, viaje a casa del cliente y semanas de puesta en marcha en planta hasta dejar el proceso corriendo y aceptado.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0369A1',
  location = 'Castellví de Rosanes, Barcelona, España', country_code = 'ES',
  slug = 'aleix-mabres', is_active = true,
  job_seeking_status = 'PASSIVE', is_open_to_messages = true,
  wizard_completed = true, first_login_completed = true, dashboard_tour_completed = true,
  meta_title = 'Aleix Mabres · Ingeniero de Automatización Industrial · PCS7 y TIA Portal',
  meta_description = 'Ingeniero de Automatización Industrial con +14 años en PCS7, STEP7, TIA Portal Unified, SIMIT y SCADA. Puestas en marcha en Omán, Rusia, Francia, Bangladesh y Chile.'
WHERE id = p;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p, 'Empresa de informática industrial (sectores químico, farmacéutico y alimentario)', 'Ingeniero de Proyectos de Automatización', '2015-01-15', NULL, true, 'Responsable técnico de proyectos de automatización y control de proceso, principalmente para los sectores químico, farmacéutico y alimentario, cubriendo el ciclo completo desde la ingeniería de detalle hasta la aceptación en planta. Estudio y colaboración en el desarrollo de especificaciones funcionales junto al cliente. Programación de PLC Siemens con STEP7 y PCS7 en sus distintos lenguajes (SCL, KOP, SFC y CFC), incluyendo la modificación y creación de elementos de librería propios siguiendo el estándar PCS7 para mantener la homogeneidad y la mantenibilidad del proyecto. Configuración desde cero y explotación de herramientas del entorno PCS7 como SIMATIC BATCH, para gestión de recetas y trazabilidad de lote, y SIMATIC ENERGY, para control y contabilidad de consumos energéticos. Programación de PLC Allen-Bradley con RSLogix en sus distintos lenguajes. Configuración de sistemas SCADA con trazabilidad de la producción sobre bases de datos. Diseño y programación de pantallas táctiles y HMI con TIA Portal, WinCC flexible y FactoryTalk. Configuración de variadores de frecuencia y de comunicaciones entre PLC vía Ethernet y Modbus. Programación de bloques y lógica Safety con PCS7 y STEP7. Configuración de sistemas de simulación con SIMIT para reproducir la planta virtualmente, lo que permite validar el software antes de pisar la fábrica y formar a los operarios sobre una planta simulada. Puestas en marcha "on site" en casa del cliente hasta pruebas de integración y aceptación. Entre los proyectos más relevantes de esta etapa: una desaladora de agua con más de 12.000 señales en Sohar (Omán) con PCS7; las papeleras de Rouen (Francia) y de Surazh (Rusia), esta última implantada con simulación previa en SIMIT para minimizar la parada de producción; una planta farmacéutica de sueros en Bangladesh con STEP7 y WinCC flexible; el aprovechamiento de la energía generada por una fábrica de motores en Daventry (Reino Unido) con TIA Portal; una cabina de captación de agua para una desaladora en Chile con TIA Portal Unified; una nueva línea de chocolate en polvo con trazabilidad por SIMATIC BATCH; una línea de sueros para una farmacéutica de referencia con Wonderware; una planta química con SIMATIC BATCH y SIMATIC ENERGY para control de consumos; el gemelo virtual de una fábrica de gelatina con SIMIT; la trazabilidad de producción de una fábrica de pienso animal con Movicon; el control de hornos de secado de pintura ignífuga para vigas de construcción con WinCC; y una freidora industrial de comida preparada con TIA Portal Unified.', 1),
  (p, 'Fabricante de transportadores para centros logísticos', 'Ingeniero de Automatización', '2014-01-15', '2014-12-15', false, 'Automatización de sistemas de transporte y almacenaje automático para centros logísticos. Programación de PLC Siemens con STEP7, elaboración de especificaciones técnicas y funcionales y documentación de proyecto, programación de HMI con WinCC y puestas en marcha "on site" hasta pruebas de integración y aceptación. Como proyectos destacados, la puesta en marcha de almacenes inteligentes para dos empresas de referencia: una del sector de la alimentación y otra del sector de la decoración del hogar.', 2),
  (p, 'Empresa de automatización de procesos industriales, maquinaria y cuadros eléctricos', 'Técnico de Automatización y Control', '2011-07-15', '2013-12-15', false, 'Etapa de ciclo completo: del esquema eléctrico y el montaje físico del cuadro hasta la programación del PLC y el SCADA que lo gobierna. Programación de PLC Siemens con STEP7 y PCS7 y de PLC Rockwell con RSLogix. Configuración de sistemas SCADA y diseño y programación de pantallas táctiles. Realización de esquemas eléctricos con AutoCAD Electrical y EPLAN, y diseño y montaje de cuadros eléctricos. Puestas en marcha "on site" hasta pruebas de integración y aceptación. Proyectos destacados sobre infraestructura pública y proceso industrial: la línea de reciclaje de vidrio y un nuevo módulo de cogeneración de energía en el vertedero de Barcelona, ambos con PCS7; una máquina de detección de metales en tejidos de limpieza del hogar con STEP7 y WinCC flexible; y una planta de transformación de sangre de cerdo en harinas con STEP7 y FactoryTalk.', 3),
  (p, 'SIEMENS', 'Becario - Departamento de Climatización de Edificios (Cornellà)', '2010-01-15', '2011-06-15', false, 'Beca en el departamento de climatización de edificios de SIEMENS en Cornellà, compaginada con los estudios de Ingeniería Técnica Electrónica. Gestión de pedidos y de stock, oferta de material a cliente, configuración de controladores Synco de regulación climática, realización de esquemas eléctricos y atención al cliente.', 4);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p, 'EUETIB - Escola Universitària d''Enginyeria Tècnica Industrial de Barcelona (Universitat Politècnica de Catalunya)', 'Diplomatura en Ingeniería Técnica', 'Electrónica Industrial', '2007-09-15', '2011-06-15', 1),
  (p, 'Monlau', 'Grado Superior de Formación Profesional', 'Automoción', '2005-09-15', '2007-06-15', 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p, 'SIMATIC PCS7 (DCS)', 'EXPERT', 1),
  (p, 'SIMATIC STEP7', 'EXPERT', 2),
  (p, 'TIA Portal y TIA Portal Unified', 'EXPERT', 3),
  (p, 'Lenguajes de programación PLC: SCL, KOP, SFC y CFC', 'EXPERT', 4),
  (p, 'SIMIT - Simulación de planta y gemelo virtual', 'EXPERT', 5),
  (p, 'SIMATIC BATCH - Recetas y trazabilidad de lote', 'EXPERT', 6),
  (p, 'SIMATIC ENERGY - Control y contabilidad de consumos', 'ADVANCED', 7),
  (p, 'WinCC y WinCC flexible', 'EXPERT', 8),
  (p, 'WinCC OA', 'ADVANCED', 9),
  (p, 'Librerías PCS7 - Creación y modificación bajo estándar', 'EXPERT', 10),
  (p, 'Programación Safety (PCS7 y STEP7)', 'ADVANCED', 11),
  (p, 'Allen-Bradley RSLogix 5000', 'ADVANCED', 12),
  (p, 'FactoryTalk', 'ADVANCED', 13),
  (p, 'Wonderware', 'ADVANCED', 14),
  (p, 'Movicon (SCADA sobre Visual Basic)', 'ADVANCED', 15),
  (p, 'SCADA con trazabilidad de producción sobre base de datos', 'EXPERT', 16),
  (p, 'Diseño y programación de HMI y pantallas táctiles', 'EXPERT', 17),
  (p, 'Comunicaciones industriales (Ethernet y Modbus)', 'ADVANCED', 18),
  (p, 'Configuración de variadores de frecuencia', 'ADVANCED', 19),
  (p, 'Puestas en marcha "on site" (pruebas de integración y aceptación)', 'EXPERT', 20),
  (p, 'Desarrollo de especificaciones funcionales', 'ADVANCED', 21),
  (p, 'EPLAN', 'ADVANCED', 22),
  (p, 'AutoCAD y AutoCAD Electrical', 'ADVANCED', 23),
  (p, 'Diseño y montaje de cuadros eléctricos', 'ADVANCED', 24),
  (p, 'SQL Server', 'ADVANCED', 25),
  (p, 'Visual Studio', 'INTERMEDIATE', 26);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p, 'Castellano', 'Native', true, 1),
  (p, 'Catalán', 'Native', true, 2),
  (p, 'Inglés', 'B1', false, 3);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO ITEMS (proyectos más relevantes)
-- Orden: internacionales y de mayor envergadura primero.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, description, type, url, sort_order) VALUES
  (p, 'Desaladora de agua en Sohar (Omán) - +12.000 señales', 'Desarrollo de la aplicación PCS7 y puesta en marcha de una planta desaladora de agua con más de 12.000 señales de proceso. El proyecto de mayor envergadura de su trayectoria por volumen de señalización y criticidad del suministro.', 'PROJECT', NULL, 1),
  (p, 'Papelera en Surazh (Rusia) - PCS7 con simulación previa en SIMIT', 'Implantación de modificaciones y puesta en marcha de programa con PCS7 para una fábrica de papel en Surazh. Uso de SIMIT para simular la planta y validar los cambios antes de ir a campo, reduciendo al mínimo la ventana de parada de producción.', 'PROJECT', NULL, 2),
  (p, 'Papelera en Rouen (Francia) - PCS7', 'Implantación de modificaciones y puesta en marcha de programa con PCS7 para una fábrica de papel en Rouen.', 'PROJECT', NULL, 3),
  (p, 'Planta farmacéutica de sueros en Bangladesh - STEP7 + WinCC flexible', 'Desarrollo de software con STEP7 y aplicación SCADA con WinCC flexible para una planta farmacéutica destinada a la fabricación de suero para personas.', 'PROJECT', NULL, 4),
  (p, 'Recuperación de energía en planta de motores en Daventry (Reino Unido) - TIA Portal', 'Desarrollo de aplicación con TIA Portal para aprovechar la energía generada por una empresa fabricante de motores en Daventry, Inglaterra.', 'PROJECT', NULL, 5),
  (p, 'Cabina de captación de agua para desaladora (Chile) - TIA Portal Unified', 'Desarrollo de aplicación con TIA Portal Unified para el control de una cabina de captación de agua integrada en una planta desaladora en Chile.', 'PROJECT', NULL, 6),
  (p, 'Nueva línea de chocolate en polvo - PCS7 + SIMATIC BATCH', 'Desarrollo de aplicación PCS7 y puesta en marcha de una nueva línea de producción con trazabilidad completa mediante SIMATIC BATCH para una fábrica de chocolate en polvo.', 'PROJECT', NULL, 7),
  (p, 'Línea de producción de sueros para farmacéutica de referencia - STEP7 + Wonderware', 'Desarrollo de software con STEP7, aplicación SCADA con Wonderware y puesta en marcha de una nueva línea de producción de sueros para una farmacéutica de primer nivel.', 'PROJECT', NULL, 8),
  (p, 'Planta química - PCS7 con SIMATIC BATCH y SIMATIC ENERGY', 'Desarrollo de aplicación PCS7 y puesta en marcha de una planta química, integrando SIMATIC BATCH para la gestión de recetas y SIMATIC ENERGY para el control y contabilidad de consumos energéticos.', 'PROJECT', NULL, 9),
  (p, 'Gemelo virtual de fábrica de gelatina - SIMIT', 'Desarrollo de un programa SIMIT para simular por completo una fábrica de gelatina, permitiendo validar el software y minimizar los tiempos de puesta en marcha en planta.', 'PROJECT', NULL, 10),
  (p, 'Trazabilidad de producción en fábrica de pienso animal - STEP7 + Movicon', 'Desarrollo de software con STEP7 y aplicación SCADA con Movicon incorporando sistema de trazabilidad de la producción para una empresa dedicada a la fabricación de pienso para animales.', 'PROJECT', NULL, 11),
  (p, 'Hornos de secado de pintura ignífuga para vigas de construcción - STEP7 + WinCC', 'Programación con STEP7 y aplicación SCADA con WinCC para el control de hornos especiales destinados al secado de la pintura ignífuga de vigas empleadas en construcción.', 'PROJECT', NULL, 12),
  (p, 'Freidora industrial de comida preparada - TIA Portal Unified', 'Desarrollo de aplicación con TIA Portal Unified para el control de una freidora industrial destinada a la elaboración de comida preparada.', 'PROJECT', NULL, 13),
  (p, 'Línea de reciclaje de vidrio - Vertedero de Barcelona (PCS7)', 'Desarrollo de software con PCS7 para incorporar la línea de reciclaje de vidrio en el vertedero de Barcelona.', 'PROJECT', NULL, 14),
  (p, 'Módulo de cogeneración de energía - Vertedero de Barcelona (PCS7)', 'Desarrollo de software con PCS7 para añadir un módulo adicional de cogeneración de energía en el vertedero de Barcelona.', 'PROJECT', NULL, 15),
  (p, 'Planta de transformación de sangre de cerdo en harinas - STEP7 + FactoryTalk', 'Desarrollo de software con STEP7 y aplicación SCADA con FactoryTalk para una empresa dedicada a la transformación de sangre de cerdo en harinas.', 'PROJECT', NULL, 16),
  (p, 'Máquina de detección de metales en tejidos - STEP7 + WinCC flexible', 'Desarrollo de software con STEP7 e interfaz de usuario con WinCC flexible para una máquina de detección de metales en tejidos utilizados en limpieza del hogar.', 'PROJECT', NULL, 17),
  (p, 'Almacén inteligente para operador del sector alimentación', 'Puesta en marcha de un almacén automático inteligente para una empresa de referencia del sector de la alimentación, dentro de proyectos de transporte y almacenaje para centros logísticos.', 'PROJECT', NULL, 18),
  (p, 'Almacén inteligente para operador del sector decoración del hogar', 'Puesta en marcha de un almacén automático inteligente para una empresa de referencia del sector de la decoración del hogar.', 'PROJECT', NULL, 19);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 8: CERTIFICATIONS (as portfolio_items type=CERTIFICATION)
-- sort_order >= 100 para no chocar con los proyectos del STAGE 7.
-- ═══════════════════════════════════════════════════════════════════════
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p, 'Diplomatura en Ingeniería Técnica Electrónica', 'EUETIB - Escola Universitària d''Enginyeria Tècnica Industrial de Barcelona (UPC) · 2007-2011', 'CERTIFICATION', 100),
  (p, 'Grado Superior en Automoción', 'Monlau · 2005-2007', 'CERTIFICATION', 101),
  (p, 'Permiso de conducción B · Vehículo propio', 'DGT - Dirección General de Tráfico', 'CERTIFICATION', 102);

END $$;

-- ============================================================================
-- POST-DEPLOYMENT NOTES
-- ============================================================================
-- 1. URL pública: https://yourcvpassport.com/cv/aleix-mabres
-- 2. avatar_url NO se toca aquí: se sube la foto al bucket profile-assets con
--    scripts/upload-aleix-avatar.sh, que hace el UPDATE del campo.
-- 3. Empresas: el CV original no nombra a los empleadores de 2011-2013, 2014 y
--    2015-actualidad; se han descrito por sector, literalmente como en el CV.
--    Si el interesado autoriza los nombres reales, sustituir company_name.
-- 4. Fechas: el CV sólo aporta años. Se han fijado meses conservadores para
--    evitar solapamientos visibles en la línea temporal:
--      · Beca SIEMENS      2010-01 → 2011-06  (CV: "2010 - 2011")
--      · Técnico           2011-07 → 2013-12  (CV: "2011 - 2013")
--      · Ing. Automatiz.   2014-01 → 2014-12  (CV: "2014")
--      · Ing. Proyectos    2015-01 → actual   (CV: "2015 - Actualmente")
--    Pendiente de confirmación por el interesado.
--    ⚠️  Todas las fechas usan DÍA 15 a propósito. formatDate() en las
--    plantillas hace new Date('YYYY-MM-01'), que JS parsea como UTC medianoche;
--    al renderizar con toLocaleDateString en una zona UTC+X el resultado
--    retrocede al mes anterior ("Ene 2015" se muestra como "Dic 2014").
--    El día 15 es inmune a ese desfase en cualquier zona horaria. El bug de
--    formatDate afecta a TODOS los perfiles con fechas en día 1 y sigue vivo:
--    el arreglo de raíz sería parsear la fecha como local en las plantillas.
-- 5. Privacidad: teléfono (686.011.364), dirección postal completa y fecha de
--    nacimiento NO se publican. location queda a nivel de municipio.
-- 6. linkedin_url queda sin informar: no consta en el CV aportado.
-- 7. job_seeking_status = 'PASSIVE' e is_open_to_messages = true (perfil
--    independiente, a diferencia de los directores ISEIE que van NOT_LOOKING).
-- ============================================================================
