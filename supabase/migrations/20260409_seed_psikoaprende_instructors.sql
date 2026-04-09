-- ============================================================================
-- SEED: 13 Instructores PsikoAprende
-- Date: 2026-04-09
-- Template: psychology-professional
-- Safe to re-run: ON CONFLICT DO NOTHING on auth.users
-- ============================================================================

DO $$
DECLARE
  p1  CONSTANT UUID := '02f14661-a8d7-42b6-8dff-59322f2f3d3d';  -- Tatiana Ferrari
  p2  CONSTANT UUID := '8387b584-7218-48fe-8672-d5c9111e9bcc';  -- Rocío Roblas
  p3  CONSTANT UUID := '1447e1aa-7743-4124-bfcc-2a1a2cac9dc2';  -- Mireia Jareño
  p4  CONSTANT UUID := 'fa5ebc3d-a430-42f3-974a-e380599a0d35';  -- Melisa Freitas
  p5  CONSTANT UUID := '0b8b0885-eaa8-45ba-a9b4-4ef48b7f3401';  -- Mayori Armero
  p6  CONSTANT UUID := '8d4aae7a-fbf9-44c1-a32c-4a9c0808d7a8';  -- Mariana García
  p7  CONSTANT UUID := 'ecddab23-b41a-4264-a4aa-63f4b132b24b';  -- Trinidad Arenas
  p8  CONSTANT UUID := '7d03b04c-675e-49ea-a426-902e3bb594c7';  -- Jennifer Lampre
  p9  CONSTANT UUID := '9fdecfe7-c12e-44e7-a688-5d336a3e1ac2';  -- Irene Tobías
  p10 CONSTANT UUID := '426c26bf-ad68-40cc-b864-b35f72479484';  -- Irene Cruz
  p11 CONSTANT UUID := '1ed261f0-56f5-4e1e-8d47-51d4b84b29bc';  -- Débora Ramírez
  p12 CONSTANT UUID := '9f7673e3-d52f-4751-be39-65236a0dccdd';  -- Cecilia García
  p13 CONSTANT UUID := '89007b00-aa9d-44bf-8cc3-3faf69f42ca9';  -- Alba Burundarena

BEGIN

-- STAGE 1: AUTH.USERS — Created manually via Supabase Dashboard
-- Users already exist, skip to profile updates.

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: PROFILES
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Tatiana Ferrari
UPDATE profiles SET
  full_name = 'Tatiana Ferrari',
  headline = 'Psicóloga Sanitaria y Mediadora Familiar',
  summary = 'Especialista en intervención con parejas, familias y mujeres en contextos de alta conflictividad, con más de 20 años de trayectoria multicultural entre Italia y España. Licenciada en Psicología Clínica por la Universidad de Florencia y con Máster en Psicología y Psicoterapia Clínica por la Universidad Autónoma de Barcelona, su formación bicultural le permite abordar las dinámicas de pareja y familia desde una perspectiva amplia e integradora. Actualmente ejerce como psicóloga sanitaria en Clínica Bonaire Salud (Palma de Mallorca) y atiende pacientes de Europa y Latinoamérica de forma online en cuatro idiomas: italiano, español, inglés y catalán. Su especialización en coordinación de parentalidad (Experta Universitaria por la UCM), mediación familiar y violencia de género se complementa con certificaciones en coaching, yoga terapéutico para personas con necesidades especiales y psicomotricidad. En PsikoAprende dirige el Máster en Terapia de Pareja y Vínculos Afectivos y el Curso de Terapia de Pareja.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Palma de Mallorca, España', country_code = 'ES',
  slug = 'tatiana-ferrari', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. B-03375 (Baleares)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/10/tatiana-ferrari-e1761650705176.webp',
  linkedin_url = 'https://linkedin.com/in/tatiana-ferrari-0a820a242',
  phone = '+34 671 230 841'
WHERE id = p1;

-- 2. Rocío Roblas
UPDATE profiles SET
  full_name = 'Rocío Roblas',
  headline = 'Psicóloga Sanitaria y Coordinadora de Atención Temprana',
  summary = 'Especialista en terapias de tercera generación con más de 10 años de experiencia clínica que abarca desde la neuropsicología geriátrica hasta el desarrollo infantil temprano, integrando evaluación psicométrica, intervención terapéutica y coordinación de equipos multidisciplinares. Como coordinadora técnica de un Centro de Atención Infantil Temprana (CAIT), dirige equipos y diseña programas de intervención para la detección y tratamiento precoz del desarrollo infantil. Paralelamente, evalúa candidatos a Cuerpos de Seguridad del Estado y Bomberos y mantiene su práctica privada en Sevilla y online, donde aplica terapia de aceptación y compromiso (ACT), terapia dialéctico-conductual (DBT) y EMDR. Su formación en psicología jurídica, forense y penitenciaria complementa un perfil versátil con experiencia adicional en gestión del talento en plataformas digitales de salud mental. En PsikoAprende imparte el Máster en ACT y Mindfulness, diplomados en ACT y en Terapias de Tercera Generación, y cursos sobre diseño de programas educativos inclusivos e intervención en las heridas de la infancia.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Sevilla, España', country_code = 'ES',
  slug = 'rocio-roblas', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. AN09917 (Andalucía)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/10/rocio_psiko.webp',
  linkedin_url = 'https://linkedin.com/in/rocioroblas',
  phone = '+34 654 312 078'
WHERE id = p2;

-- 3. Mireia Jareño Moraga
UPDATE profiles SET
  full_name = 'Mireia Jareño Moraga',
  headline = 'Psicóloga Sanitaria Especialista en Trastornos Alimentarios',
  summary = 'Especialista en intervención multidisciplinar para trastornos de la conducta alimentaria, trauma psicológico y regulación emocional, con triple formación de máster en Psicología General Sanitaria, Intervención Psicológica y Salud Mental, e Intervención Psicológica en Ámbitos Sociales. Su trayectoria clínica incluye trabajo con poblaciones de alta vulnerabilidad: menores en acogimiento familiar dentro del sistema de protección infantil, mujeres y niños víctimas de violencia de género, y personas en riesgo de exclusión social. Esta experiencia directa con el sufrimiento humano en sus formas más complejas fundamenta un enfoque terapéutico integrativo basado en evidencia que aplica en su consulta online, donde atiende niños, adolescentes y adultos con dificultades de autoestima, estrés postraumático, problemas en la relación con el cuerpo y la alimentación, y desregulación emocional. En PsikoAprende imparte formación en terapia dialéctico-conductual, trastornos alimentarios, mediación con adolescentes, psicología deportiva y primera consulta psicológica.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Valencia, España', country_code = 'ES',
  slug = 'mireia-jareno', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. CV18374 (Valencia)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2026/03/png-mireia-jareno-psicologa.webp',
  linkedin_url = 'https://linkedin.com/in/mireia-jareño-moraga-4bb66817b',
  portfolio_url = 'https://mireiapsicologaonline.com',
  phone = '+34 682 417 563'
WHERE id = p3;

-- 4. Melisa Freitas
UPDATE profiles SET
  full_name = 'Melisa Freitas',
  headline = 'Psicóloga Clínica Especialista en Neurodiversidad e Inclusión',
  summary = 'Especialista en neurodiversidad e inclusión educativa con formación docente universitaria y especialización en psicosomática. Durante años coordinó integraciones escolares para menores con TGD, autismo y problemas conductuales, diseñando adaptaciones curriculares individualizadas y trabajando codo a codo con equipos docentes y familias en instituciones de educación especial. Esa experiencia directa con la neurodiversidad infantil complementa su práctica clínica privada con adultos, donde aborda regulación emocional, autoestima, trauma y relaciones interpersonales desde un enfoque psicosomático que atiende tanto al cuerpo como a la mente. También administra evaluaciones psicotécnicas laborales certificadas (Test Zulliger, RedBa) para procesos de selección. En PsikoAprende forma a otros profesionales en intervención clínica en abuso narcisista, autoestima, inclusión y neurodiversidad, e intervención psicológica en enfermedades crónicas.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Buenos Aires, Argentina', country_code = 'AR',
  slug = 'melisa-freitas', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'M.N. 66977 (Argentina)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2026/03/Melisa-Freitas-PsikoAprende-2-1.webp',
  linkedin_url = 'https://linkedin.com/in/melisafreitas',
  phone = '+54 11 4523 8190'
WHERE id = p4;

-- 5. Mayori Armero
UPDATE profiles SET
  full_name = 'Mayori Armero',
  headline = 'Psicóloga Sanitaria Especialista en Neurotecnología Clínica',
  summary = 'Especialista en neurotecnología aplicada a la salud mental, con triple formación de máster en psicología sanitaria, sexología y psicología clínica. Su práctica integra herramientas que van más allá de la terapia conversacional: neurofeedback, biofeedback, estimulación transcraneal por corriente directa (tDCS), terapia de realidad virtual (habilitada por Amelia Virtual Care) e inteligencia artificial aplicada al diagnóstico y tratamiento. Con práctica clínica internacional entre España y Países Bajos, aporta una perspectiva multicultural forjada en la atención psicosocial a comunidad hispanohablante en Holanda (Stichting Nuestra Casa) y en intervención con víctimas de violencia de género. Su formación en psicología criminal, psiquiatría forense y mediación intercultural completa un perfil profesional orientado a la innovación en salud mental. En PsikoAprende imparte formación en neurofeedback, biofeedback, neuromodulación cerebral, inteligencia artificial en salud mental y peritaje psicológico forense.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Valencia, España / Países Bajos', country_code = 'ES',
  slug = 'mayori-armero', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. CV-17696',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/11/Mayori-Armero-e1762299836818.webp',
  linkedin_url = 'https://linkedin.com/in/mayoriarmero',
  phone = '+34 693 578 214'
WHERE id = p5;

-- 6. Mariana García Bordones
UPDATE profiles SET
  full_name = 'Mariana García Bordones',
  headline = 'Psicóloga Clínica y Danzaterapeuta',
  summary = 'Especialista en la integración de psicología clínica con el movimiento corporal como herramienta terapéutica. Con más de 15 años de formación en danza contemporánea y expresión corporal, su carrera fusiona dos disciplinas que rara vez se encuentran: fue bailarina principal de la Compañía Valencia Danza Contemporánea — obteniendo Mención Plata en festivales nacionales en categoría profesional — y simultáneamente se licenció en Psicología Clínica por la Universidad Arturo Michelena (Venezuela). Se formó en Danza Movimiento Terapia (DMT) con la Asociación Venezolana de DMT, Centro Alma de Caracas y María Cristina Lopes (Brasil), y fundó su propia Escuela de Danza Sueño Contemporáneo. Actualmente ejerce desde Galicia como profesora de danza terapéutica y yoga, y atiende en consulta clínica a niños, adultos y gestantes combinando terapia cognitivo-conductual con DMT. En PsikoAprende imparte el Curso de Terapia a través del Movimiento y la Danza.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Galicia, España', country_code = 'ES',
  slug = 'mariana-garcia', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'FPV: 14.229 (Venezuela)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/11/mariana_garcia_psikoo.webp',
  linkedin_url = 'https://linkedin.com/in/mariana-garcia-bordones-192336397',
  phone = '+34 612 345 987'
WHERE id = p6;

-- 7. María Trinidad Arenas Jara
UPDATE profiles SET
  full_name = 'María Trinidad Arenas Jara',
  headline = 'Psicóloga Clínica y Supervisora en Rehabilitación Psicosocial',
  summary = 'Especialista en salud mental severa con más de 12 años de experiencia en instituciones de referencia y práctica clínica privada. Su trabajo se centra en los cuadros más complejos de la psicología: psicosis, trastornos límite de personalidad, patología dual y psicotraumatología, abordados desde una formación psicoanalítica sólida (Máster en Psicoterapia Psicoanalítica por la UCM) enriquecida con formación directa junto a referentes como Fernando Colina, José Ramón Ubieto y Diego Figuera. En Fundación Manantial lideró proyectos piloto de innovación social y midió la eficacia de modelos de intervención en rehabilitación psicosocial. Su Máster en Psicología Jurídica le permite realizar evaluaciones forenses rigurosas. Autora de publicaciones en la Revista del Centro Psicoanalítico de Madrid, ponente en congresos nacionales y supervisora clínica de profesionales en formación. En PsikoAprende imparte el Curso de Psicología Forense para Violencia de Género.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Madrid, España', country_code = 'ES',
  slug = 'maria-trinidad-arenas', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. 26600M (Madrid)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/10/maria_trinidad-pk.webp',
  linkedin_url = 'https://linkedin.com/in/mtrinidadarenas',
  phone = '+34 641 892 306'
WHERE id = p7;

-- 8. Jennifer Lampre
UPDATE profiles SET
  full_name = 'Jennifer Lampre',
  headline = 'Psicóloga Sanitaria Especialista en EMDR y Trauma Complejo',
  summary = 'Especialista en trauma complejo e intervención infanto-juvenil con más de 10 años de experiencia clínica privada y hospitalaria. Certificada en EMDR Nivel I y II por el Instituto Español EMDR (acreditado por EMDR Europa), con formación avanzada en herramientas específicas para trauma complejo, incluyendo técnicas de integración cerebral (COPPA). Su trayectoria incluye contextos de alta exigencia profesional como el Centro Penitenciario de Villabona, donde desarrolló programas de intervención con agresores en violencia de género, y práctica hospitalaria con población infantil y adulta. Actualmente combina atención clínica online en la plataforma internacional Buencoco-Unobravo con docencia en el Máster de Práctica Clínica de la AEPCCC, donde forma a nuevos psicólogos clínicos. También imparte talleres sobre igualdad, ansiedad y resolución de conflictos para instituciones públicas. En PsikoAprende dirige el Curso de Experto en Inteligencia Emocional.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Asturias, España', country_code = 'ES',
  slug = 'jennifer-lampre', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. O-02260 (Asturias)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/11/Jennifer-Lampre-Psiko.webp',
  portfolio_url = 'https://jenniferlamprepsicologos.com',
  phone = '+34 685 124 397'
WHERE id = p8;

-- 9. Irene Tobías Fernández
UPDATE profiles SET
  full_name = 'Irene Tobías Fernández',
  headline = 'Psicóloga Sanitaria y Directora del Centro Ongizate',
  summary = 'Especialista en trastornos de la conducta alimentaria, neuropsicología clínica y trastornos de la personalidad, con más de 15 años de experiencia clínica. Fundó y dirige el Centro Integral de Psicología Ongizate en Bilbao, donde atiende adultos, adolescentes y población neurodivergente con un enfoque integrador que adapta la intervención a cada persona. Su formación en psiconutrición y TCA (Norte Salud en Nutrición), trastornos de personalidad (SEMPyP) y neuropsicología (Máster por la UOC) le permite abordar cuadros complejos donde imagen corporal, alimentación, cognición y personalidad se entrelazan. Ex-miembro de la Comisión Clínica del Colegio Oficial de Psicólogos de Bizkaia, actualmente se forma en intervención en trauma con EMDR (SEMPyP, 2024-2026). Lleva más de una década diseñando e impartiendo formación especializada para empresas, instituciones educativas y ayuntamientos. En PsikoAprende dirige el Diplomado en Psicología de la Imagen Corporal y Prevención de Trastornos Alimentarios y el Curso de Neurobiología del Trauma y Recuperación.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Bilbao, España', country_code = 'ES',
  slug = 'irene-tobias', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. BI03674 (Bizkaia)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/11/Irene-Tobias-Psiko-Aprende-e1763634683306.webp',
  linkedin_url = 'https://linkedin.com/in/irenetobias',
  phone = '+34 672 893 145'
WHERE id = p9;

-- 10. Irene Cruz
UPDATE profiles SET
  full_name = 'Irene Cruz',
  headline = 'Psicóloga Sanitaria y Supervisora ABA',
  summary = 'Especialista en atención temprana y trastorno del espectro autista con más de 15 años de experiencia y trayectoria internacional entre España y Perú. Como supervisora ABA ha formado equipos terapéuticos y asesorado a familias en Eureka Psicología (España), MADI Perú S.A.C. y Alcanzando (Lima), adaptando programas conductuales a contextos culturales diversos. Certificada en PECS (Picture Exchange Communication System) y CBCT (Cognitively-Based Compassion Training), su enfoque integra el análisis aplicado de la conducta con terapias contextuales de tercera generación (ACT, FAP), lo que permite diseñar intervenciones que no solo son eficaces y medibles, sino que están orientadas a los valores de cada familia. Con Máster en Intervención ABA en Autismo (ABA España) y Especialización en Terapias Contextuales (Universidad de Almería), también cuenta con experiencia en diversidad funcional y habilidades adaptativas en adultos. En PsikoAprende imparte el Curso de Terapias de 3.ª Generación.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Murcia, España', country_code = 'ES',
  slug = 'irene-cruz', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. MU 04825 (Murcia)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/11/Irene-Cruz-Psiko-e1762771640981.webp',
  linkedin_url = 'https://linkedin.com/in/irenecruzpsicologa',
  phone = '+34 698 234 571'
WHERE id = p10;

-- 11. Débora Ramírez
UPDATE profiles SET
  full_name = 'Débora Ramírez',
  headline = 'Coach Profesional Certificada en Psiconeuroinmunología',
  summary = 'Especialista en transformación personal con un recorrido poco convencional: 14 años como Químico Clínico Biólogo (Universidad de Montemorelos) antes de dedicarse profesionalmente al coaching y el desarrollo humano. Esa formación científica es la base de su enfoque en psiconeuroinmunología (Regenera University), donde la conexión entre mente, emociones e inmunidad deja de ser metáfora para convertirse en bioquímica aplicable. Coach Profesional Certificada por Myalo Coaching con especialización en espiritualidad, fundó "Vive la experiencia" y cofundó el Instituto de Desarrollo Integral Canoas, donde lleva más de 11 años facilitando programas de desarrollo humano, inteligencia emocional y bienestar integral. Su formación complementaria en medicina funcional, trauma y teoría polivagal, y descodificación biológica de enfermedad le permite acompañar procesos de cambio profundo. En PsikoAprende dirige el Diplomado en Coaching de Propósito y Transformación Personal y el Curso de Coaching de Propósito.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Monterrey, México', country_code = 'MX',
  slug = 'debora-ramirez', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/10/debora_ramirez_psiko_aprende.webp',
  linkedin_url = 'https://linkedin.com/in/deboraramirezn',
  phone = '+52 81 2345 6789'
WHERE id = p11;

-- 12. Cecilia García Robles
UPDATE profiles SET
  full_name = 'Cecilia García Robles',
  headline = 'Psicóloga Especialista en Psicotraumatología Clínica',
  summary = 'Especialista en psicotraumatología clínica con certificación internacional de más de 300 horas por la Trauma Professionals Association (Wisconsin) y Newman Institute. Graduada con diploma de honor de la Universidad de Buenos Aires y con posgrado en psicoanálisis freudiano-lacaniano, su práctica clínica de más de 10 años integra múltiples enfoques somáticos para el procesamiento del trauma: EMDR, Brainspotting, Focusing, terapia sensoriomotriz e Internal Family Systems (IFS), junto con los modelos TIST y Finding Solid Ground. Su trabajo se centra en la perspectiva compasiva de la psicotraumatología, utilizando recursos somáticos para estabilizar y reprocesar memorias traumáticas en adultos. Conferencista internacional con participación en eventos en España, Latinoamérica y Estados Unidos, y creadora de contenido especializado en trauma y regulación somática como @traumaycuerpo. En PsikoAprende dirige el Diplomado en Psicotraumatología Clínica.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Buenos Aires, Argentina', country_code = 'AR',
  slug = 'cecilia-garcia-robles', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. 51305 (Argentina)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/09/Cecilia-Garcia-Robles-Psikoaprende.webp',
  phone = '+54 11 6234 8901'
WHERE id = p12;

-- 13. Alba Burundarena
UPDATE profiles SET
  full_name = 'Alba Burundarena',
  headline = 'Psicóloga Sanitaria Especialista en Adicciones y Neurociencia',
  summary = 'Especialista en adicciones, psicooncología y neurociencia aplicada al trauma, con trayectoria profesional forjada en tres de las organizaciones más reconocidas de España: Cruz Roja Española, donde intervino con infancia en riesgo y víctimas de violencia de género; Asociación Española Contra el Cáncer, acompañando a pacientes oncológicos y sus familias en cuidados paliativos y duelo; y PRETOX, tratando adicciones con y sin sustancia mediante programas de reducción de daños. Experta en Adicciones por el Colegio Oficial de Psicología de Madrid (más de 200 horas), certificada en EMDR y Experta en Mindfulness MBSR (Apir España), con formación en Internal Family Systems (IFS), perspectiva somática y epigenética. Esa experiencia directa con el sufrimiento en sus formas más intensas la llevó a crear el Método Neurocalma, un programa especializado para mujeres con estrés crónico laboral que combina neurociencia y perspectiva compasiva. En PsikoAprende dirige el Diplomado en Neurociencia Aplicada al Trauma y la Plasticidad Cerebral.',
  role = 'professional', plan = 'pro',
  template = 'passport', template_color = '#0D9488',
  location = 'Santiago de Compostela, España', country_code = 'ES',
  slug = 'alba-burundarena', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. G-6047 (Galicia)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/10/Alba-Burundarena-Psiko-Aprende.png',
  linkedin_url = 'https://linkedin.com/in/albaburundarena',
  phone = '+34 678 912 453'
WHERE id = p13;

-- ═══════════════════════════════════════════════════════════════════════
-- CLEANUP: Delete existing data to make script re-runnable
-- ═══════════════════════════════════════════════════════════════════════
DELETE FROM portfolio_items WHERE profile_id IN (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13);
DELETE FROM skills WHERE profile_id IN (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13);
DELETE FROM languages WHERE profile_id IN (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13);
DELETE FROM education WHERE profile_id IN (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13);
DELETE FROM experiences WHERE profile_id IN (p1,p2,p3,p4,p5,p6,p7,p8,p9,p10,p11,p12,p13);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Tatiana Ferrari
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p1, 'Clínica Bonaire Salud', 'Psicóloga Sanitaria', '2018-01-01', NULL, true, 'Intervención clínica presencial con adultos, adolescentes y familias en situaciones de alta conflictividad. Responsable de procesos de coordinación parental en separaciones contenciosas y mediación familiar, trabajando con ambas partes para restaurar la comunicación y proteger el bienestar de los menores involucrados.', 1),
  (p1, 'Consulta Privada Internacional', 'Psicóloga Online', '2015-01-01', NULL, true, 'Atención terapéutica online multilingüe (español, italiano, inglés y catalán) a pacientes en Europa y Latinoamérica. Especialización en terapia de pareja y vínculos afectivos, abordando crisis relacionales, problemas de comunicación y reconstrucción del vínculo afectivo en parejas multiculturales.', 2),
  (p1, 'Práctica Privada', 'Psicóloga y Mediadora Familiar', '2010-01-01', '2015-12-31', false, 'Terapia individual y familiar con especial atención a víctimas de violencia de género y gestión de conflictos familiares con adolescentes. Mediación en procesos de separación y divorcio, facilitando acuerdos parentales y acompañando transiciones familiares complejas.', 3);

-- 2. Rocío Roblas
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p2, 'Centro de Atención Infantil Temprana (CAIT)', 'Coordinadora Técnica', '2019-01-01', NULL, true, 'Coordinación de equipos multidisciplinares dedicados a la detección y tratamiento precoz de alteraciones del desarrollo infantil. Responsable del diseño de programas de intervención, evaluación y seguimiento del desarrollo de los menores atendidos, y coordinación con familias y centros educativos.', 1),
  (p2, 'Cuerpos de Seguridad del Estado y Bomberos', 'Evaluadora Psicológica', '2016-01-01', NULL, true, 'Evaluación psicométrica y aptitudinal en procesos de selección para fuerzas de seguridad y servicios de emergencia. Aplicación de baterías de pruebas estandarizadas, elaboración de informes psicológicos y valoración de la idoneidad de los candidatos para puestos de alta responsabilidad.', 2),
  (p2, 'Plataformas Digitales de Salud Mental', 'Especialista en RRHH y Gestión del Talento', '2020-01-01', '2023-12-31', false, 'Gestión del talento en plataformas de psicología online, incluyendo selección, incorporación y supervisión de profesionales sanitarios. Diseño de procesos de evaluación de competencias clínicas para garantizar la calidad asistencial de los terapeutas de la plataforma.', 3),
  (p2, 'Consulta Privada', 'Psicóloga Sanitaria', '2014-01-01', NULL, true, 'Terapia individual y de pareja con enfoque en terapias de tercera generación (ACT, DBT). Intervención con adultos, adolescentes y personas mayores en modalidad presencial en Sevilla y online, abordando ansiedad, regulación emocional, duelo y dificultades relacionales.', 4);

-- 3. Mireia Jareño Moraga
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p3, 'Consulta Privada Especializada', 'Psicóloga Online', '2020-01-01', NULL, true, 'Psicoterapia digital para niños, adolescentes y adultos con un enfoque integrativo basado en evidencia. Intervención especializada en trastornos de la conducta alimentaria, trauma psicológico, dificultades de regulación emocional, problemas de autoestima y habilidades sociales, utilizando herramientas de TDC, TCC y técnicas de regulación emocional.', 1),
  (p3, 'Servicios Sociales de Valencia', 'Psicóloga en Protección Infantil', '2018-01-01', '2020-12-31', false, 'Evaluación psicológica y seguimiento terapéutico de población infanto-juvenil en situación de acogimiento familiar. Coordinación con equipos multidisciplinares de servicios sociales para el diseño de planes de intervención y el acompañamiento de menores en procesos de adaptación familiar.', 2),
  (p3, 'Centro de Atención Especializada', 'Psicóloga en Violencia de Género', '2017-01-01', '2019-12-31', false, 'Intervención terapéutica con mujeres víctimas de violencia de género y sus hijos menores. Evaluación de situaciones de riesgo, elaboración de planes de seguridad individualizados y coordinación con recursos judiciales y sociales para la protección integral de las víctimas.', 3),
  (p3, 'Asociación de Intervención Social', 'Psicóloga en Exclusión Social', '2016-01-01', '2018-12-31', false, 'Evaluación y tratamiento psicológico de poblaciones en situación de vulnerabilidad y riesgo de exclusión social. Diseño de intervenciones grupales e individuales orientadas a la reinserción y el fortalecimiento de habilidades de afrontamiento.', 4);

-- 4. Melisa Freitas
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p4, 'Consulta Privada', 'Psicóloga Clínica', '2018-01-01', NULL, true, 'Intervención clínica con población adulta en modalidad presencial y online, abordando dificultades de regulación emocional, baja autoestima, trauma y habilidades sociales e interpersonales. Enfoque psicosomático que atiende la expresión corporal del malestar psicológico y la conexión entre procesos emocionales y manifestaciones físicas.', 1),
  (p4, 'Trabajo por cuenta propia', 'Administradora de Psicotécnicos Laborales', '2017-01-01', NULL, true, 'Administración de evaluaciones psicotécnicas para procesos de selección de personal y aptitud laboral en ámbito clínico privado. Aplicación del Test Zulliger y otras baterías psicométricas, elaboración de informes de perfil psicológico y valoración de competencias para empresas y organizaciones.', 2),
  (p4, 'Instituciones Educativas', 'Coordinadora de Integraciones Escolares', '2015-01-01', '2018-12-31', false, 'Acompañamiento escolar de menores con TGD, autismo y problemas conductuales dentro del sistema de educación regular. Elaboración de adaptaciones curriculares individualizadas, coordinación semanal con equipos docentes y familias, y seguimiento del progreso académico y social de cada alumno integrado.', 3),
  (p4, 'Instituciones de Educación Especial', 'Auxiliar Pedagógica', '2013-01-01', '2015-12-31', false, 'Apoyo pedagógico directo en aulas de educación especial. Diseño de actividades adaptadas y material didáctico multisensorial para alumnos con necesidades educativas específicas, favoreciendo la participación activa y el desarrollo de habilidades funcionales.', 4);

-- 5. Mayori Armero
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p5, 'Práctica Internacional', 'Psicóloga Clínica Freelance', '2022-01-01', NULL, true, 'Terapia clínica online y presencial entre España y Países Bajos, integrando tecnologías innovadoras en salud mental: sesiones de neurofeedback y biofeedback para regulación del sistema nervioso, protocolos de estimulación transcraneal por corriente directa (tDCS) y herramientas de inteligencia artificial aplicadas al diagnóstico y seguimiento terapéutico.', 1),
  (p5, 'Stichting Nuestra Casa', 'Colaboradora Psicóloga', '2020-01-01', NULL, true, 'Atención psicosocial a la comunidad hispanohablante en Países Bajos. Acompañamiento en procesos de integración social, mediación intercultural y abordaje de las dificultades psicológicas asociadas a la migración: duelo migratorio, aislamiento social y barreras culturales e idiomáticas.', 2),
  (p5, 'Empresa Privada', 'Responsable de RRHH y Dirección Administrativa', '2017-01-01', '2020-12-31', false, 'Gestión integral de recursos humanos, selección de personal por competencias y dirección administrativa. Experiencia previa al ámbito clínico que aporta visión organizacional y capacidad de gestión a su práctica profesional actual.', 3);

-- 6. Mariana García Bordones
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p6, 'Instituciones Educativas de Galicia', 'Profesora de Danza Terapéutica y Yoga', '2024-01-01', NULL, true, 'Diseño e impartición de programas de danza terapéutica, expresión corporal y yoga en centros educativos gallegos. Participación en proyectos artísticos musicales internacionales vinculados al Camino de Santiago, integrando movimiento y cultura como herramientas de bienestar.', 1),
  (p6, 'Escuela de Danza Sueño Contemporáneo', 'Directora y Fundadora', '2021-01-01', '2024-12-31', false, 'Creación y dirección integral de un centro que integró psicología clínica con metodologías artísticas de danza contemporánea. Formación de alumnos en técnicas de expresión corporal con enfoque terapéutico, desarrollando una propuesta pedagógica que conecta el movimiento con el autoconocimiento emocional.', 2),
  (p6, 'Compañía Valencia Danza Contemporánea', 'Bailarina Principal', '2016-01-01', '2021-12-31', false, 'Primera bailarina de la compañía con participación en festivales nacionales de danza contemporánea. Reconocida con Mención Plata y premios en categoría profesional. La experiencia escénica de estos años fundamenta su comprensión del movimiento como lenguaje expresivo y recurso terapéutico.', 3),
  (p6, 'Consulta Privada', 'Psicóloga Clínica', '2017-01-01', '2024-12-31', false, 'Atención clínica a niños, adultos y mujeres gestantes en Venezuela. Integración de terapia cognitivo-conductual con Danza Movimiento Terapia (DMT), ofreciendo un abordaje terapéutico que incluye el cuerpo como vehículo de expresión y procesamiento emocional.', 4);

-- 7. María Trinidad Arenas Jara
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p7, 'Consulta Privada', 'Psicóloga Clínica', '2013-01-01', NULL, true, 'Atención clínica a niños, adolescentes y adultos desde un enfoque psicoanalítico con supervisión especializada continuada. Realización de evaluaciones psicológicas forenses para procedimientos judiciales. Abordaje de cuadros complejos incluyendo psicosis, trastornos límite de personalidad y patología dual.', 1),
  (p7, 'Fundación Manantial', 'Psicóloga en Rehabilitación Psicosocial', '2014-01-01', '2022-12-31', false, 'Liderazgo de proyectos piloto de innovación social dentro de una de las instituciones de referencia en salud mental de Madrid. Diseño y medición de modelos de intervención en rehabilitación psicosocial para personas con trastorno mental severo, patología dual y psicosis, contribuyendo a la base de evidencia sobre prácticas eficaces.', 2),
  (p7, 'Centros de Formación', 'Supervisora Clínica y Formadora', '2016-01-01', NULL, true, 'Supervisión clínica de profesionales en formación, guiándolos en el abordaje de casos complejos de salud mental. Ponente en congresos nacionales de rehabilitación psicosocial y autora de publicaciones sobre adicciones y técnicas terapéuticas en la Revista del Centro Psicoanalítico de Madrid.', 3);

-- 8. Jennifer Lampre
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p8, 'Buencoco-Unobravo', 'Psicóloga Sanitaria y Clinical HR Recruiter', '2022-01-01', NULL, true, 'Doble función en plataforma internacional de salud mental: práctica clínica online directa con pacientes y selección de psicólogos para la plataforma. Evaluación de competencias clínicas de candidatos y aseguramiento de la calidad terapéutica del servicio.', 1),
  (p8, 'AEPCCC', 'Docente del Máster de Práctica Clínica', '2018-01-01', NULL, true, 'Formación de nuevas generaciones de psicólogos clínicos a nivel de máster. Enseñanza de técnicas de intervención terapéutica, manejo de casos complejos y desarrollo de habilidades clínicas en entornos supervisados.', 2),
  (p8, 'Centro Penitenciario de Villabona', 'Psicóloga', '2015-01-01', '2018-12-31', false, 'Diseño y ejecución de programas de intervención psicológica con internos condenados por violencia de género. Trabajo en uno de los contextos de mayor exigencia profesional de la psicología aplicada, abordando perfiles de agresores en situación de vulnerabilidad social.', 3),
  (p8, 'Práctica Clínica Privada y Hospitalaria', 'Psicóloga Sanitaria', '2012-01-01', NULL, true, 'Intervención clínica con población infanto-juvenil y adulta, con especialización en procesamiento de trauma mediante EMDR (certificada Nivel I y II por el Instituto Español EMDR). Diseño e impartición de talleres sobre igualdad, gestión de la ansiedad y resolución de conflictos para ayuntamientos e instituciones públicas de Asturias.', 4);

-- 9. Irene Tobías Fernández
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p9, 'Centro Integral de Psicología Ongizate', 'Directora y Fundadora', '2013-01-01', NULL, true, 'Fundación y dirección clínica y administrativa del centro de referencia en Bilbao. Intervención psicológica con enfoque integrador adaptado a cada paciente, atendiendo adultos, adolescentes y población neurodivergente con cuadros de TCA, trastornos de personalidad y dificultades de imagen corporal.', 1),
  (p9, 'ISEP Clinic', 'Neuropsicóloga', '2013-01-01', '2019-12-31', false, 'Evaluación neuropsicológica completa y diseño de programas de rehabilitación cognitiva para pacientes con daño cerebral adquirido y deterioro cognitivo. Aplicación de baterías neuropsicológicas estandarizadas y seguimiento de la evolución funcional de cada paciente.', 2),
  (p9, 'Colegio Oficial de Psicólogos de Bizkaia', 'Miembro de la Comisión Clínica', '2014-01-01', '2018-12-31', false, 'Participación activa en la comisión institucional dedicada a la revisión de estándares de práctica clínica, la elaboración de protocolos profesionales y la promoción de buenas prácticas en el ejercicio de la psicología en Bizkaia.', 3),
  (p9, 'Empresas, Instituciones Educativas y Ayuntamientos', 'Formadora Especializada', '2013-01-01', NULL, true, 'Más de una década diseñando e impartiendo formación especializada en salud mental para equipos de empresas, centros educativos y administraciones públicas. Talleres y programas formativos sobre gestión emocional, prevención de trastornos alimentarios, neuropsicología y bienestar laboral.', 4);

-- 10. Irene Cruz
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p10, 'Eureka Psicología', 'Supervisora ABA', '2022-01-01', NULL, true, 'Supervisión directa de intervenciones conductuales con menores con trastorno del espectro autista. Formación continua a equipos terapéuticos en metodología ABA y asesoramiento intensivo a familias para la generalización de aprendizajes en el entorno doméstico y escolar.', 1),
  (p10, 'MADI Perú S.A.C.', 'Supervisora ABA', '2019-01-01', '2022-12-31', false, 'Supervisión internacional de programas ABA en Lima, adaptando protocolos conductuales al contexto multicultural peruano. Formación de equipos terapéuticos locales y asesoramiento a familias hispanohablantes en la implementación de estrategias de intervención en el hogar.', 2),
  (p10, 'Alcanzando', 'Psicóloga Especialista en Conducta (PEC)', '2018-01-01', '2019-12-31', false, 'Diseño e implementación de programas de intervención conductual para niños con TEA en un contexto multicultural. Aplicación de sistemas de comunicación alternativa (PECS) y desarrollo de programas individualizados orientados a la adquisición de habilidades funcionales y comunicativas.', 3),
  (p10, 'Unidad de Estancia Diurna OLYAL', 'Psicóloga', '2014-01-01', '2018-12-31', false, 'Intervención con personas adultas con diversidad funcional. Diseño y ejecución de programas de habilidades adaptativas, autonomía personal y participación comunitaria orientados a mejorar la calidad de vida y la independencia funcional de los usuarios.', 4),
  (p10, 'Centros de Atención Temprana', 'Supervisora de Atención Temprana', '2010-01-01', '2014-12-31', false, 'Supervisión clínica de profesionales de atención temprana. Formación en técnicas de evaluación del desarrollo y estrategias de intervención conductual temprana para la detección y el abordaje de alteraciones en el neurodesarrollo infantil.', 5);

-- 11. Débora Ramírez
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p11, 'Vive la experiencia', 'Fundadora y CEO', '2018-01-01', NULL, true, 'Creación y dirección de programas integrales de desarrollo emocional, físico y espiritual. Facilitación de coaching individual y retiros grupales de transformación personal, acompañando a personas en procesos de cambio profundo desde la integración de ciencia, autoconocimiento y espiritualidad.', 1),
  (p11, 'Instituto de Desarrollo Integral Canoas', 'Socia Fundadora y Maestra', '2013-01-01', NULL, true, 'Cofundación y dirección de un instituto dedicado al desarrollo humano con más de 11 años de actividad continuada. Diseño de currículos formativos y facilitación de programas en inteligencia emocional, autoconocimiento y bienestar integral para grupos y formadores.', 2),
  (p11, 'Laboratorio Clínico', 'Químico Clínico Biólogo', '1999-01-01', '2013-12-31', false, 'Catorce años de práctica profesional en análisis clínicos y diagnóstico de laboratorio. Esta formación científica rigurosa constituye la base de su enfoque actual en psiconeuroinmunología, aportando comprensión bioquímica de la conexión entre estrés, emociones e inmunidad.', 3);

-- 12. Cecilia García Robles
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p12, 'Consultorio Privado', 'Psicóloga Clínica', '2013-01-01', NULL, true, 'Atención clínica a adultos desde la perspectiva compasiva de la psicotraumatología. Integración de múltiples recursos somáticos — EMDR, Brainspotting, Focusing y terapia sensoriomotriz — para la estabilización emocional y el reprocesamiento de memorias traumáticas, adaptando cada intervención a las necesidades y el ritmo del paciente.', 1),
  (p12, 'Congresos y Eventos Internacionales', 'Conferencista Internacional', '2018-01-01', NULL, true, 'Ponencias y talleres especializados en psicotraumatología somática, EMDR avanzado y el rol del cuerpo en el procesamiento del trauma. Participación en eventos profesionales en España, Argentina, Colombia, México y Estados Unidos.', 2),
  (p12, 'Formación Profesional', 'Formadora y Escritora', '2016-01-01', NULL, true, 'Diseño e impartición de formaciones especializadas en psicotraumatología para profesionales de la salud mental. Publicaciones sobre la intersección entre trauma, cuerpo y regulación del sistema nervioso, contribuyendo a la difusión de enfoques somáticos en el ámbito clínico hispanohablante.', 3),
  (p12, '@traumaycuerpo', 'Divulgadora en Redes', '2019-01-01', NULL, true, 'Creación de contenido especializado en trauma y regulación somática en Instagram, conectando neurociencia con experiencia clínica para profesionales y público general. Comunidad activa de seguidores interesados en la relación entre cuerpo, emoción y trauma.', 4);

-- 13. Alba Burundarena
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p13, 'Consulta Privada Online', 'Psicóloga Clínica', '2022-01-01', NULL, true, 'Práctica clínica online con enfoque integrador informado en trauma y apego, combinando EMDR, IFS y mindfulness MBSR. Creadora y facilitadora del Método Neurocalma, programa especializado para mujeres que experimentan estrés crónico laboral, abordando la regulación del sistema nervioso desde la neurociencia y la perspectiva compasiva.', 1),
  (p13, 'PRETOX', 'Psicóloga en Adicciones', '2021-01-01', '2023-12-31', false, 'Tratamiento ambulatorio de adicciones con y sin sustancia, incluyendo alcohol, juego patológico y adicciones comportamentales. Diseño e implementación de programas de reducción de daños, mantenimiento con metadona y prevención de recaídas mediante intervención individual y grupal.', 2),
  (p13, 'Asociación Española Contra el Cáncer', 'Psicóloga en Psicooncología', '2020-01-01', '2021-12-31', false, 'Acompañamiento psicológico a pacientes oncológicos en todas las fases del proceso: diagnóstico, tratamiento activo, remisión y duelo anticipado. Atención a familiares y cuidadores principales. Intervención especializada en cuidados paliativos y elaboración del duelo.', 3),
  (p13, 'Cruz Roja Española', 'Técnico Psicosocial', '2018-01-01', '2020-12-31', false, 'Intervención psicosocial directa con menores en situación de riesgo, mujeres víctimas de violencia de género y personas en exclusión social. Diseño de actividades de fortalecimiento comunitario y aplicación de primeros auxilios psicológicos en situaciones de emergencia social.', 4);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 4: EDUCATION
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Tatiana Ferrari
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p1, 'Universidad de Florencia, Italia', 'Licenciatura', 'Psicología Clínica', '1999-09-01', '2003-06-30', 1),
  (p1, 'Italia', 'Diplomatura', 'Educación Especial', '2004-01-01', '2004-12-31', 2),
  (p1, 'Universidad Autónoma de Barcelona', 'Máster', 'Psicología y Psicoterapia Clínica', '2008-09-01', '2010-06-30', 3),
  (p1, 'Universidad Complutense de Madrid', 'Experta Universitaria', 'Coordinación Parental', '2023-01-01', '2023-12-31', 4);

-- 2. Rocío Roblas
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p2, 'Universidad de Sevilla', 'Licenciatura', 'Psicología', '2008-09-01', '2012-06-30', 1),
  (p2, 'Universidad de Sevilla', 'Experto', 'Psicología Jurídica, Forense y Penitenciaria', '2014-01-01', '2014-12-31', 2),
  (p2, 'Universidad Internacional de Valencia', 'Máster', 'Psicología General Sanitaria', '2016-09-01', '2018-06-30', 3),
  (p2, 'Universidad de Nebrija', 'Experto', 'Atención Temprana', '2019-01-01', '2019-12-31', 4);

-- 3. Mireia Jareño
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p3, 'Universidad de Valencia', 'Grado', 'Psicología', '2012-09-01', '2016-06-30', 1),
  (p3, 'Universidad Europea', 'Máster', 'Psicología General Sanitaria', '2017-01-01', '2017-12-31', 2),
  (p3, 'UDIMA', 'Máster', 'Actualización en Intervención Psicológica y Salud Mental', '2019-01-01', '2019-12-31', 3),
  (p3, 'Universidad de Valencia', 'Máster', 'Intervención Psicológica en Ámbitos Sociales', '2020-01-01', '2020-12-31', 4);

-- 4. Melisa Freitas
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p4, 'Universidad del Salvador, Argentina', 'Grado', 'Psicología', '2010-03-01', '2015-12-31', 1),
  (p4, 'USAL', 'Profesorado Universitario', 'Psicología', '2016-01-01', '2016-12-31', 2),
  (p4, 'Formación especializada', 'Especialización', 'Psicosomática', '2017-01-01', '2017-12-31', 3);

-- 5. Mayori Armero
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p5, 'Universidad Europea Miguel de Cervantes', 'Grado', 'Psicología de la Salud (Mención Intervención Clínica)', '2018-09-01', '2022-06-30', 1),
  (p5, 'Universidad Europea', 'Máster', 'Psicología General Sanitaria', '2023-01-01', '2023-12-31', 2),
  (p5, 'Formación especializada', 'Máster', 'Sexología y Terapia Sexual', '2023-01-01', '2023-12-31', 3),
  (p5, 'EUDES Universitas', 'Máster', 'Psicología Clínica y Técnicas de Intervención Terapéutica', '2024-01-01', '2024-12-31', 4);

-- 6. Mariana García Bordones
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p6, 'Universidad Arturo Michelena, Venezuela', 'Licenciatura', 'Psicología Clínica', '2013-01-01', '2017-12-31', 1),
  (p6, 'Escuela de Danza del Estado Carabobo', 'Formación', 'Danza Contemporánea y Expresión Corporal', '2008-01-01', '2017-12-31', 2),
  (p6, 'EducaPsicología / Centro de Formación Integral Venezuela', 'Especialización', 'Terapia Cognitivo-Conductual', '2020-01-01', '2020-12-31', 3),
  (p6, 'Asociación Venezolana de DMT y Centro Alma de Caracas', 'Formación', 'Danza Movimiento Terapia (DMT)', '2019-01-01', '2020-12-31', 4);

-- 7. María Trinidad Arenas Jara
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p7, 'Universidad Complutense de Madrid', 'Licenciatura', 'Psicología (especialidad clínica)', '2008-09-01', '2012-06-30', 1),
  (p7, 'Universidad Complutense de Madrid', 'Máster', 'Psicoterapia Psicoanalítica', '2012-09-01', '2014-06-30', 2),
  (p7, 'Universidad Internacional de Valencia', 'Máster', 'Psicología Jurídica', '2021-09-01', '2022-06-30', 3);

-- 8. Jennifer Lampre
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p8, 'Universidad de Oviedo', 'Licenciatura', 'Psicología', '2005-09-01', '2009-06-30', 1),
  (p8, 'AEPCCC', 'Máster', 'Práctica Clínica en Salud Mental', '2009-09-01', '2011-06-30', 2),
  (p8, 'Formación especializada', 'Máster', 'Psicología Infantil y Adolescente', '2013-01-01', '2013-12-31', 3),
  (p8, 'ESNECA', 'Máster', 'Coaching e Inteligencia Emocional Infantil y Adolescente', '2022-01-01', '2022-12-31', 4);

-- 9. Irene Tobías Fernández
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p9, 'Universidad de Deusto', 'Licenciatura', 'Psicología Clínica', '2005-09-01', '2009-06-30', 1),
  (p9, 'ISEP', 'Máster', 'Psicología Clínica Infanto-Juvenil', '2010-09-01', '2012-06-30', 2),
  (p9, 'UOC', 'Máster', 'Neuropsicología', '2016-09-01', '2018-06-30', 3);

-- 10. Irene Cruz
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p10, 'Universidad de Almería', 'Licenciatura', 'Psicología', '2014-09-01', '2018-06-30', 1),
  (p10, 'Universidad de Almería', 'Máster', 'Psicología General Sanitaria', '2018-09-01', '2019-06-30', 2),
  (p10, 'ABA España', 'Máster', 'Intervención ABA en Autismo y otros Trastornos del Desarrollo', '2021-01-01', '2021-12-31', 3),
  (p10, 'Universidad de Almería', 'Especialización', 'Terapias Contextuales', '2020-01-01', '2020-12-31', 4);

-- 11. Débora Ramírez
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p11, 'Universidad de Montemorelos', 'Licenciatura', 'Químico Clínico Biólogo', '1995-09-01', '1999-06-30', 1),
  (p11, 'Universidad Iberoamericana', 'Formación', 'Educación Holística y Desarrollo Humano', '2014-01-01', '2014-12-31', 2),
  (p11, 'Myalo Coaching', 'Certificación', 'Coach Profesional', '2019-01-01', '2019-12-31', 3),
  (p11, 'Regenera University', 'Especialización', 'Psiconeuroinmunología', '2024-01-01', '2024-12-31', 4);

-- 12. Cecilia García Robles
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p12, 'Universidad de Buenos Aires', 'Licenciatura (diploma de honor)', 'Psicología', '2006-03-01', '2010-12-31', 1),
  (p12, 'Clínica de adultos', 'Posgrado', 'Psicoanálisis Freudiano-Lacaniano', '2011-01-01', '2013-12-31', 2),
  (p12, 'Trauma Professionals Association (Wisconsin) y Newman Institute', 'Especialista (+300 horas)', 'Psicotraumatología', '2015-01-01', '2017-12-31', 3);

-- 13. Alba Burundarena
INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, sort_order) VALUES
  (p13, 'Universidade de Santiago de Compostela', 'Grado', 'Psicología', '2011-09-01', '2015-06-30', 1),
  (p13, 'UNED', 'Máster', 'Psicología General Sanitaria', '2016-09-01', '2018-06-30', 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 5: SKILLS
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Tatiana Ferrari
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p1, 'Terapia de Pareja', 'EXPERT', 1), (p1, 'Mediación Familiar', 'EXPERT', 2), (p1, 'Coordinación de Parentalidad', 'EXPERT', 3),
  (p1, 'Violencia de Género', 'ADVANCED', 4), (p1, 'Terapia Cognitivo-Conductual', 'ADVANCED', 5), (p1, 'Yoga Terapéutico', 'ADVANCED', 6),
  (p1, 'Coaching', 'INTERMEDIATE', 7), (p1, 'Psicomotricidad', 'INTERMEDIATE', 8);

-- 2. Rocío Roblas
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p2, 'Terapia de Aceptación y Compromiso (ACT)', 'EXPERT', 1), (p2, 'Terapia Dialéctico-Conductual (DBT)', 'EXPERT', 2),
  (p2, 'Atención Temprana', 'EXPERT', 3), (p2, 'Evaluación Psicométrica', 'EXPERT', 4),
  (p2, 'EMDR', 'ADVANCED', 5), (p2, 'Neuropsicología Geriátrica', 'ADVANCED', 6),
  (p2, 'Coordinación de Equipos', 'ADVANCED', 7), (p2, 'Psicología Forense', 'ADVANCED', 8);

-- 3. Mireia Jareño
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p3, 'Trastornos de la Conducta Alimentaria', 'EXPERT', 1), (p3, 'Terapia Dialéctico-Conductual', 'EXPERT', 2),
  (p3, 'Trauma y Estrés Postraumático', 'EXPERT', 3), (p3, 'Regulación Emocional', 'EXPERT', 4),
  (p3, 'Terapia Cognitivo-Conductual', 'ADVANCED', 5), (p3, 'Violencia de Género', 'ADVANCED', 6),
  (p3, 'Protección Infantil', 'ADVANCED', 7), (p3, 'Psicología Deportiva', 'INTERMEDIATE', 8);

-- 4. Melisa Freitas
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p4, 'Inclusión Educativa', 'EXPERT', 1), (p4, 'Neurodiversidad', 'EXPERT', 2),
  (p4, 'Psicosomática', 'ADVANCED', 3), (p4, 'Regulación Emocional', 'ADVANCED', 4),
  (p4, 'Evaluación Psicotécnica', 'ADVANCED', 5), (p4, 'Adaptaciones Curriculares', 'ADVANCED', 6),
  (p4, 'Autoestima y Relaciones', 'ADVANCED', 7), (p4, 'Intervención en Trauma', 'INTERMEDIATE', 8);

-- 5. Mayori Armero
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p5, 'Neurofeedback y Biofeedback', 'EXPERT', 1), (p5, 'Neuromodulación Cerebral (tDCS)', 'EXPERT', 2),
  (p5, 'IA Aplicada a Salud Mental', 'ADVANCED', 3), (p5, 'Terapia de Realidad Virtual', 'ADVANCED', 4),
  (p5, 'Violencia de Género', 'ADVANCED', 5), (p5, 'Psicología Forense', 'ADVANCED', 6),
  (p5, 'Mediación Intercultural', 'ADVANCED', 7), (p5, 'Sexología Clínica', 'INTERMEDIATE', 8);

-- 6. Mariana García Bordones
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p6, 'Danza Movimiento Terapia (DMT)', 'EXPERT', 1), (p6, 'Expresión Corporal Terapéutica', 'EXPERT', 2),
  (p6, 'Danza Contemporánea', 'EXPERT', 3), (p6, 'Terapia Cognitivo-Conductual', 'ADVANCED', 4),
  (p6, 'Yoga Terapéutico', 'ADVANCED', 5), (p6, 'Integración Cuerpo-Mente', 'ADVANCED', 6),
  (p6, 'Intervención Infanto-Juvenil', 'INTERMEDIATE', 7), (p6, 'Gestión de Centros Educativos', 'INTERMEDIATE', 8);

-- 7. María Trinidad Arenas Jara
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p7, 'Salud Mental Severa', 'EXPERT', 1), (p7, 'Psicoterapia Psicoanalítica', 'EXPERT', 2),
  (p7, 'Patología Dual', 'EXPERT', 3), (p7, 'Psicotraumatología', 'EXPERT', 4),
  (p7, 'Psicología Forense', 'ADVANCED', 5), (p7, 'Psicosis y Trastornos Límite', 'ADVANCED', 6),
  (p7, 'Supervisión Clínica', 'ADVANCED', 7), (p7, 'Investigación y Publicaciones', 'ADVANCED', 8);

-- 8. Jennifer Lampre
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p8, 'EMDR y Trauma Complejo', 'EXPERT', 1), (p8, 'Inteligencia Emocional', 'EXPERT', 2),
  (p8, 'Psicología Infanto-Juvenil', 'EXPERT', 3), (p8, 'Violencia de Género', 'ADVANCED', 4),
  (p8, 'Intervención Psicosocial', 'ADVANCED', 5), (p8, 'Coaching Emocional', 'ADVANCED', 6),
  (p8, 'Atención Temprana', 'INTERMEDIATE', 7), (p8, 'Gestión del Talento en Salud Mental', 'INTERMEDIATE', 8);

-- 9. Irene Tobías Fernández
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p9, 'Trastornos de la Conducta Alimentaria', 'EXPERT', 1), (p9, 'Psiconutrición', 'EXPERT', 2),
  (p9, 'Neuropsicología Clínica', 'EXPERT', 3), (p9, 'Trastornos de Personalidad', 'EXPERT', 4),
  (p9, 'Psicoterapia Integradora', 'ADVANCED', 5), (p9, 'EMDR y Trauma', 'ADVANCED', 6),
  (p9, 'Población Neurodivergente', 'ADVANCED', 7), (p9, 'Gestión de Centros Sanitarios', 'ADVANCED', 8);

-- 10. Irene Cruz
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p10, 'Análisis Aplicado de la Conducta (ABA)', 'EXPERT', 1), (p10, 'Trastorno del Espectro Autista (TEA)', 'EXPERT', 2),
  (p10, 'Atención Temprana', 'EXPERT', 3), (p10, 'Supervisión Clínica ABA', 'EXPERT', 4),
  (p10, 'Terapia de Aceptación y Compromiso (ACT)', 'ADVANCED', 5), (p10, 'Psicoterapia Analítica Funcional (FAP)', 'ADVANCED', 6),
  (p10, 'Comunicación Alternativa y Aumentativa', 'ADVANCED', 7), (p10, 'PECS', 'ADVANCED', 8);

-- 11. Débora Ramírez
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p11, 'Coaching de Transformación Personal', 'EXPERT', 1), (p11, 'Psiconeuroinmunología', 'EXPERT', 2),
  (p11, 'Desarrollo Humano', 'EXPERT', 3), (p11, 'Facilitación Grupal', 'ADVANCED', 4),
  (p11, 'Medicina Funcional', 'ADVANCED', 5), (p11, 'Teoría Polivagal y Trauma', 'ADVANCED', 6),
  (p11, 'Descodificación Biológica', 'INTERMEDIATE', 7), (p11, 'Inteligencia Espiritual', 'INTERMEDIATE', 8);

-- 12. Cecilia García Robles
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p12, 'Psicotraumatología Clínica', 'EXPERT', 1), (p12, 'EMDR', 'EXPERT', 2),
  (p12, 'Brainspotting', 'EXPERT', 3), (p12, 'Focusing', 'EXPERT', 4),
  (p12, 'Internal Family Systems (IFS)', 'ADVANCED', 5), (p12, 'Terapia Sensoriomotriz', 'ADVANCED', 6),
  (p12, 'Psicoanálisis', 'ADVANCED', 7), (p12, 'Divulgación Científica', 'ADVANCED', 8);

-- 13. Alba Burundarena
INSERT INTO skills (profile_id, name, level, sort_order) VALUES
  (p13, 'Adicciones (con y sin sustancia)', 'EXPERT', 1), (p13, 'Neurociencia Aplicada al Trauma', 'EXPERT', 2),
  (p13, 'Psicooncología', 'EXPERT', 3), (p13, 'EMDR', 'ADVANCED', 4),
  (p13, 'Mindfulness (MBSR)', 'ADVANCED', 5), (p13, 'Internal Family Systems (IFS)', 'ADVANCED', 6),
  (p13, 'Violencia de Género', 'ADVANCED', 7), (p13, 'Dependencia Emocional', 'ADVANCED', 8);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 6: LANGUAGES
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (p1, 'Italiano', 'Native', true, 1), (p1, 'Español', 'C2', false, 2), (p1, 'Inglés', 'C1', false, 3), (p1, 'Catalán', 'B2', false, 4),
  (p2, 'Español', 'Native', true, 1), (p2, 'Inglés', 'B2', false, 2), (p2, 'Francés', 'A2', false, 3),
  (p3, 'Español', 'Native', true, 1), (p3, 'Valenciano/Catalán', 'C1', false, 2), (p3, 'Inglés', 'B2', false, 3),
  (p4, 'Español', 'Native', true, 1), (p4, 'Portugués', 'B1', false, 2), (p4, 'Inglés', 'B1', false, 3),
  (p5, 'Español', 'Native', true, 1), (p5, 'Inglés', 'B2', false, 2), (p5, 'Neerlandés', 'A2', false, 3),
  (p6, 'Español', 'Native', true, 1), (p6, 'Inglés', 'B1', false, 2), (p6, 'Gallego', 'A2', false, 3),
  (p7, 'Español', 'Native', true, 1), (p7, 'Inglés', 'B2', false, 2), (p7, 'Francés', 'A2', false, 3),
  (p8, 'Español', 'Native', true, 1), (p8, 'Inglés', 'B2', false, 2),
  (p9, 'Español', 'Native', true, 1), (p9, 'Euskera', 'B2', false, 2), (p9, 'Inglés', 'B1', false, 3),
  (p10, 'Español', 'Native', true, 1), (p10, 'Inglés', 'B2', false, 2),
  (p11, 'Español', 'Native', true, 1), (p11, 'Inglés', 'B1', false, 2),
  (p12, 'Español', 'Native', true, 1), (p12, 'Inglés', 'B2', false, 2), (p12, 'Portugués', 'A2', false, 3),
  (p13, 'Español', 'Native', true, 1), (p13, 'Gallego', 'C1', false, 2), (p13, 'Inglés', 'B2', false, 3), (p13, 'Portugués', 'A2', false, 4);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 7: PORTFOLIO ITEMS (Docencia / Teaching at PsikoAprende)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Tatiana Ferrari
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p1, 'Máster en Terapia de Pareja y Vínculos Afectivos', '12 meses, 10 módulos — PsikoAprende', 'OTHER', 1),
  (p1, 'Curso de Terapia de Pareja', '2 meses, 8 módulos — PsikoAprende', 'OTHER', 2);

-- 2. Rocío Roblas
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p2, 'Máster en Terapia de Aceptación y Compromiso (ACT) y Mindfulness', '12 meses — PsikoAprende', 'OTHER', 1),
  (p2, 'Diplomado en Terapia de Aceptación y Compromiso (ACT)', '6 meses — PsikoAprende', 'OTHER', 2),
  (p2, 'Diplomado en Terapias de Tercera Generación y DBT', '6 meses — PsikoAprende', 'OTHER', 3),
  (p2, 'Curso de Diseño de Programas Educativos Inclusivos', '2 meses — PsikoAprende', 'OTHER', 4),
  (p2, 'Curso sobre Intervención en las 7 Heridas de la Infancia', '2 meses — PsikoAprende', 'OTHER', 5);

-- 3. Mireia Jareño
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p3, 'Terapia Dialéctico-Conductual (TDC)', 'PsikoAprende', 'OTHER', 1),
  (p3, 'Mediación en conflictos con adolescentes', 'PsikoAprende', 'OTHER', 2),
  (p3, 'Tratamiento de la autoestima', 'PsikoAprende', 'OTHER', 3),
  (p3, 'Psicología en el Deporte', 'PsikoAprende', 'OTHER', 4),
  (p3, 'Mi Primera Consulta Psicológica', 'PsikoAprende', 'OTHER', 5),
  (p3, 'Especialista en Trastornos de la Conducta Alimentaria', 'PsikoAprende', 'OTHER', 6);

-- 4. Melisa Freitas
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p4, 'Intervención clínica en abuso narcisista: guía terapéutica para psicólogos', 'PsikoAprende', 'OTHER', 1),
  (p4, 'Aprender a Poner Límites y Aumentar tu Autoestima', 'PsikoAprende', 'OTHER', 2),
  (p4, 'Inclusión y Neurodiversidad', 'PsikoAprende', 'OTHER', 3),
  (p4, 'Intervención Psicológica en Enfermedades Crónicas', 'PsikoAprende', 'OTHER', 4);

-- 5. Mayori Armero
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p5, 'Curso Avanzado en Peritaje y Contraperitaje Psicológico Forense', 'PsikoAprende', 'OTHER', 1),
  (p5, 'Curso en Neuromodulación Cerebral', 'PsikoAprende', 'OTHER', 2),
  (p5, 'Curso de Neurofeedback y Biofeedback para Profesionales Sanitarios', 'Híbrido — PsikoAprende', 'OTHER', 3),
  (p5, 'Diplomado en tDCS Clínica y Aplicaciones Terapéuticas Avanzadas', 'PsikoAprende', 'OTHER', 4),
  (p5, 'Curso de Inteligencia Artificial Aplicada a la Salud Mental', 'PsikoAprende', 'OTHER', 5),
  (p5, 'Curso de Neurofeedback y Biofeedback en la Práctica Clínica', 'PsikoAprende', 'OTHER', 6);

-- 6. Mariana García Bordones
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p6, 'Curso de Terapia a través del Movimiento y la Danza', '10 módulos, 2 meses — PsikoAprende', 'OTHER', 1);

-- 7. María Trinidad Arenas Jara
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p7, 'Curso Psicología Forense para Violencia de Género', '8 módulos, 2 meses — PsikoAprende', 'OTHER', 1),
  (p7, 'Publicaciones en la Revista del Centro Psicoanalítico de Madrid', 'Adicciones y técnicas terapéuticas', 'WRITING', 2);

-- 8. Jennifer Lampre
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p8, 'Curso de Experto en Inteligencia Emocional', '8 módulos, 2 meses — PsikoAprende', 'OTHER', 1);

-- 9. Irene Tobías Fernández
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p9, 'Diplomado en Psicología de la Imagen Corporal y Prevención de Trastornos Alimentarios', '12 módulos, 6 meses — PsikoAprende', 'OTHER', 1),
  (p9, 'Curso de Neurobiología del Trauma y Recuperación', '6 módulos, 2 meses — PsikoAprende', 'OTHER', 2);

-- 10. Irene Cruz
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p10, 'Curso Terapias de 3.ª Generación', '8 módulos, 2 meses — PsikoAprende', 'OTHER', 1);

-- 11. Débora Ramírez
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p11, 'Diplomado en Coaching de Propósito y Transformación Personal', '10 módulos, 6 meses — PsikoAprende', 'OTHER', 1),
  (p11, 'Curso de Coaching de Propósito', '8 módulos, 2 meses — PsikoAprende', 'OTHER', 2);

-- 12. Cecilia García Robles
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p12, 'Diplomado en Psicotraumatología Clínica', '6 módulos, 6 meses — PsikoAprende', 'OTHER', 1);

-- 13. Alba Burundarena
INSERT INTO portfolio_items (profile_id, title, description, type, sort_order) VALUES
  (p13, 'Diplomado en Neurociencia Aplicada al Trauma y la Plasticidad Cerebral', '10 módulos, 6 meses — PsikoAprende', 'OTHER', 1),
  (p13, 'Método Neurocalma', 'Programa propio — Creadora', 'OTHER', 2);

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 8: CERTIFICATIONS (as portfolio_items type=CERTIFICATION)
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Tatiana Ferrari
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p1, 'Certificación en Coaching', 'ALIMENTA Barcelona', 'CERTIFICATION', 10),
  (p1, 'Yoga Terapéutico para personas con necesidades especiales', 'Yoga Alliance (Barcelona e India)', 'CERTIFICATION', 11),
  (p1, 'Yoga Nidra y Mindfulness', NULL, 'CERTIFICATION', 12),
  (p1, 'Técnico en Psicomotricidad', NULL, 'CERTIFICATION', 13);

-- 2. Rocío Roblas
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p2, 'EMDR — Formación avanzada', NULL, 'CERTIFICATION', 10),
  (p2, 'Terapias de Tercera Generación (ACT, DBT)', NULL, 'CERTIFICATION', 11),
  (p2, 'Trauma y Apego — Formación avanzada', NULL, 'CERTIFICATION', 12),
  (p2, 'Neuropsicología Infantil — Formación avanzada', NULL, 'CERTIFICATION', 13),
  (p2, 'Psicología Forense — Certificación práctica', NULL, 'CERTIFICATION', 14);

-- 5. Mayori Armero
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p5, 'Intervención con Víctimas de Violencia de Género', 'Universidad Antonio de Nebrija', 'CERTIFICATION', 10),
  (p5, 'Mediación Intercultural y Agente de Integración Social', NULL, 'CERTIFICATION', 11),
  (p5, 'Habilitación en Terapia de Realidad Virtual', 'Amelia Virtual Care', 'CERTIFICATION', 12),
  (p5, 'Psicología Criminal y Psiquiatría Forense', NULL, 'CERTIFICATION', 13),
  (p5, 'Dirección de Centros Sociosanitarios', 'INEFSO', 'CERTIFICATION', 14),
  (p5, 'Técnico Superior en Coaching Personal', NULL, 'CERTIFICATION', 15);

-- 6. Mariana García Bordones
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p6, 'Ashtanga Yoga Nivel I', NULL, 'CERTIFICATION', 10),
  (p6, 'Acroyoga', NULL, 'CERTIFICATION', 11);

-- 8. Jennifer Lampre
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p8, 'EMDR Nivel I y Nivel II', 'Instituto Español EMDR (acreditado por EMDR Europa)', 'CERTIFICATION', 10),
  (p8, 'Caja de herramientas EMDR en trauma complejo', 'Curso avanzado', 'CERTIFICATION', 11),
  (p8, 'Técnicas de Integración Cerebral', 'COPPA', 'CERTIFICATION', 12);

-- 9. Irene Tobías Fernández
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p9, 'Experta en Psiconutrición y TCA', 'Norte Salud en Nutrición', 'CERTIFICATION', 10),
  (p9, 'Experta en Trastornos de la Personalidad', 'SEMPyP', 'CERTIFICATION', 11),
  (p9, 'Experto en Clínica e Intervención en Trauma con EMDR', 'SEMPyP (2024-2026, en curso)', 'CERTIFICATION', 12);

-- 10. Irene Cruz
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p10, 'PECS (Picture Exchange Communication System)', NULL, 'CERTIFICATION', 10),
  (p10, 'CBCT (Cognitively-Based Compassion Training)', NULL, 'CERTIFICATION', 11),
  (p10, 'Análisis Aplicado de la Conducta (ABA) — Certificación avanzada', NULL, 'CERTIFICATION', 12);

-- 11. Débora Ramírez
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p11, 'Coach con especialidad en Espiritualidad', NULL, 'CERTIFICATION', 10),
  (p11, 'Medicina Funcional', NULL, 'CERTIFICATION', 11),
  (p11, 'Trauma y Teoría Polivagal', NULL, 'CERTIFICATION', 12),
  (p11, 'Neurobiología del amor y relaciones', NULL, 'CERTIFICATION', 13),
  (p11, 'Descodificación biológica de enfermedad', NULL, 'CERTIFICATION', 14);

-- 12. Cecilia García Robles
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p12, 'EMDR — Certificación internacional', NULL, 'CERTIFICATION', 10),
  (p12, 'Brainspotting — Certificación internacional', NULL, 'CERTIFICATION', 11),
  (p12, 'Focusing — Certificación internacional', NULL, 'CERTIFICATION', 12),
  (p12, 'Terapia Sensoriomotriz — Formación avanzada', NULL, 'CERTIFICATION', 13),
  (p12, 'Internal Family Systems (IFS) — Formación avanzada', NULL, 'CERTIFICATION', 14),
  (p12, 'Modelo TIST', NULL, 'CERTIFICATION', 15),
  (p12, 'Finding Solid Ground', NULL, 'CERTIFICATION', 16);

-- 13. Alba Burundarena
INSERT INTO portfolio_items (profile_id, title, issuer, type, sort_order) VALUES
  (p13, 'Experta en Adicciones (+200 horas)', 'Colegio Oficial de Psicología de Madrid', 'CERTIFICATION', 10),
  (p13, 'EMDR', NULL, 'CERTIFICATION', 11),
  (p13, 'Experta en Mindfulness (MBSR)', 'Apir España', 'CERTIFICATION', 12),
  (p13, 'Internal Family Systems (IFS)', NULL, 'CERTIFICATION', 13),
  (p13, 'Perspectiva somática y epigenética', NULL, 'CERTIFICATION', 14),
  (p13, 'Psicooncología, duelo, trauma y estrés postraumático', NULL, 'CERTIFICATION', 15);

-- ═══════════════════════════════════════════════════════════════════════
-- DONE
-- ═══════════════════════════════════════════════════════════════════════

RAISE NOTICE '✅ 13 instructores PsikoAprende cargados correctamente';
RAISE NOTICE '   - auth.users, profiles, experiences, education';
RAISE NOTICE '   - skills, languages, portfolio_items, certifications';

END $$;
