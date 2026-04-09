-- ============================================================================
-- SEED: 13 Instructores PsikoAprende
-- Date: 2026-04-09
-- Template: psychology-professional
-- Safe to re-run: ON CONFLICT DO NOTHING on auth.users
-- ============================================================================

DO $$
DECLARE
  p1  CONSTANT UUID := 'a0b1c2d3-pk01-4000-8000-psikoaprende1';
  p2  CONSTANT UUID := 'a0b1c2d3-pk02-4000-8000-psikoaprende2';
  p3  CONSTANT UUID := 'a0b1c2d3-pk03-4000-8000-psikoaprende3';
  p4  CONSTANT UUID := 'a0b1c2d3-pk04-4000-8000-psikoaprende4';
  p5  CONSTANT UUID := 'a0b1c2d3-pk05-4000-8000-psikoaprende5';
  p6  CONSTANT UUID := 'a0b1c2d3-pk06-4000-8000-psikoaprende6';
  p7  CONSTANT UUID := 'a0b1c2d3-pk07-4000-8000-psikoaprende7';
  p8  CONSTANT UUID := 'a0b1c2d3-pk08-4000-8000-psikoaprende8';
  p9  CONSTANT UUID := 'a0b1c2d3-pk09-4000-8000-psikoaprende9';
  p10 CONSTANT UUID := 'a0b1c2d3-pk10-4000-8000-psikoaprend10';
  p11 CONSTANT UUID := 'a0b1c2d3-pk11-4000-8000-psikoaprend11';
  p12 CONSTANT UUID := 'a0b1c2d3-pk12-4000-8000-psikoaprend12';
  p13 CONSTANT UUID := 'a0b1c2d3-pk13-4000-8000-psikoaprend13';

BEGIN

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 1: AUTH.USERS
-- ═══════════════════════════════════════════════════════════════════════

INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, aud, role) VALUES
  (p1,  'tatiana.ferrari@psikoaprende.com',    crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Tatiana Ferrari"}'::jsonb,             NOW() - INTERVAL '200 days', NOW(), 'authenticated', 'authenticated'),
  (p2,  'rocio.roblas@psikoaprende.com',       crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Rocío Roblas"}'::jsonb,                NOW() - INTERVAL '195 days', NOW(), 'authenticated', 'authenticated'),
  (p3,  'mireia.jareno@psikoaprende.com',      crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Mireia Jareño Moraga"}'::jsonb,        NOW() - INTERVAL '190 days', NOW(), 'authenticated', 'authenticated'),
  (p4,  'melisa.freitas@psikoaprende.com',     crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Melisa Freitas"}'::jsonb,              NOW() - INTERVAL '185 days', NOW(), 'authenticated', 'authenticated'),
  (p5,  'mayori.armero@psikoaprende.com',      crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Mayori Armero"}'::jsonb,               NOW() - INTERVAL '180 days', NOW(), 'authenticated', 'authenticated'),
  (p6,  'mariana.garcia@psikoaprende.com',     crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Mariana García Bordones"}'::jsonb,     NOW() - INTERVAL '175 days', NOW(), 'authenticated', 'authenticated'),
  (p7,  'trinidad.arenas@psikoaprende.com',    crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"María Trinidad Arenas Jara"}'::jsonb,  NOW() - INTERVAL '170 days', NOW(), 'authenticated', 'authenticated'),
  (p8,  'jennifer.lampre@psikoaprende.com',    crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Jennifer Lampre"}'::jsonb,             NOW() - INTERVAL '165 days', NOW(), 'authenticated', 'authenticated'),
  (p9,  'irene.tobias@psikoaprende.com',       crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Irene Tobías Fernández"}'::jsonb,      NOW() - INTERVAL '160 days', NOW(), 'authenticated', 'authenticated'),
  (p10, 'irene.cruz@psikoaprende.com',         crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Irene Cruz"}'::jsonb,                  NOW() - INTERVAL '155 days', NOW(), 'authenticated', 'authenticated'),
  (p11, 'debora.ramirez@psikoaprende.com',     crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Débora Ramírez"}'::jsonb,              NOW() - INTERVAL '150 days', NOW(), 'authenticated', 'authenticated'),
  (p12, 'cecilia.garcia@psikoaprende.com',     crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Cecilia García Robles"}'::jsonb,       NOW() - INTERVAL '145 days', NOW(), 'authenticated', 'authenticated'),
  (p13, 'alba.burundarena@psikoaprende.com',   crypt('PsikoDemo2026!', gen_salt('bf')), NOW(), '{"provider":"email","providers":["email"]}'::jsonb, '{"full_name":"Alba Burundarena"}'::jsonb,            NOW() - INTERVAL '140 days', NOW(), 'authenticated', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 2: PROFILES
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Tatiana Ferrari
UPDATE profiles SET
  full_name = 'Tatiana Ferrari',
  headline = 'Psicóloga Sanitaria · Terapia de Pareja y Mediación Familiar',
  summary = 'Psicóloga Sanitaria con más de 20 años de trayectoria profesional multicultural, formada en Italia y España. Especializada en terapia de pareja, mediación familiar y coordinación de parentalidad, con amplia experiencia clínica en intervención con mujeres, adolescentes y familias en contextos de alta conflictividad y violencia de género. Combina psicoterapia clínica presencial en Palma de Mallorca con consulta online internacional, ofreciendo atención terapéutica en italiano, español, inglés y catalán. Docente en PsikoAprende del Máster en Terapia de Pareja y Vínculos Afectivos.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga Sanitaria · Terapias de Tercera Generación (ACT, DBT)',
  summary = 'Psicóloga Sanitaria con más de 10 años de experiencia multidisciplinar, especializada en terapias de tercera generación (ACT, DBT). Coordinadora técnica en un Centro de Atención Infantil Temprana y evaluadora psicológica para Cuerpos de Seguridad del Estado y Bomberos. Formación avanzada en EMDR, trauma y apego, neuropsicología infantil y psicología forense. Combina práctica clínica privada — presencial en Sevilla y online — con gestión del talento en plataformas digitales de salud mental. Docente en PsikoAprende del Máster en ACT y Mindfulness y de diplomados en terapias de tercera generación.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga Sanitaria · Especialista en TCA y Terapia Dialéctico-Conductual',
  summary = 'Psicóloga Sanitaria con triple formación de máster en Psicología General Sanitaria (Universidad Europea), Intervención Psicológica y Salud Mental (UDIMA) e Intervención Psicológica en Ámbitos Sociales (Universidad de Valencia). Especializada en trastornos de la conducta alimentaria, trauma, regulación emocional y terapia dialéctico-conductual. Experiencia profesional en protección infantil con menores en acogimiento familiar, intervención con víctimas de violencia de género y atención a poblaciones en riesgo de exclusión social. Ofrece psicoterapia online con enfoque integrativo basado en evidencia. Docente en PsikoAprende de cursos en TDC, TCA, mediación con adolescentes y psicología deportiva.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga Clínica · Neurodiversidad, Inclusión Educativa y Psicosomática',
  summary = 'Psicóloga clínica graduada de la Universidad del Salvador (Argentina) con formación docente universitaria y especialización en psicosomática. Trayectoria profesional en inclusión educativa y neurodiversidad: coordinación de integraciones escolares para menores con TGD, autismo y problemas conductuales, elaboración de adaptaciones curriculares y trabajo en instituciones de educación especial. En práctica clínica privada, aborda regulación emocional, autoestima, trauma y relaciones interpersonales en población adulta. Administradora certificada de psicotécnicos laborales (Test Zulliger, RedBa). Docente en PsikoAprende de cursos sobre intervención en abuso narcisista, autoestima, inclusión y neurodiversidad, e intervención en enfermedades crónicas.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga Sanitaria · Neurotecnología e IA Aplicada a Salud Mental',
  summary = 'Psicóloga Sanitaria con triple formación de máster en Psicología General Sanitaria (Universidad Europea), Sexología y Terapia Sexual, y Psicología Clínica y Técnicas de Intervención Terapéutica (EUDES Universitas). Perfil profesional innovador especializado en neurotecnología aplicada a la salud mental: neurofeedback, biofeedback, estimulación transcraneal por corriente directa (tDCS) e inteligencia artificial. Práctica clínica internacional entre España y Países Bajos, con experiencia en intervención con víctimas de violencia de género, mediación intercultural y psicología forense. Colaboradora de Stichting Nuestra Casa (Países Bajos) en atención psicosocial a comunidad hispanohablante. Habilitada en Terapia de Realidad Virtual (Amelia Virtual Care). Docente en PsikoAprende de cursos en neurofeedback, biofeedback, tDCS, IA aplicada a salud mental y peritaje forense.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga Clínica · Danza Movimiento Terapia (DMT)',
  summary = 'Psicóloga clínica licenciada por la Universidad Arturo Michelena (Venezuela) y bailarina profesional con más de 15 años de formación continua en danza contemporánea y expresión corporal. Perfil profesional que integra psicología clínica con Danza Movimiento Terapia (DMT), formada por la Asociación Venezolana de DMT, Centro Alma de Caracas y María Cristina Lopes (Brasil). Ex-bailarina principal de la Compañía Valencia Danza Contemporánea con reconocimientos en festivales nacionales (Mención Plata en categoría profesional). Fundadora de la Escuela de Danza Sueño Contemporáneo en Venezuela. Actualmente profesora de danza terapéutica y yoga en instituciones educativas de Galicia, España, con experiencia clínica en atención a niños, adultos y gestantes mediante TCC y DMT. Docente en PsikoAprende del Curso de Terapia a través del Movimiento y la Danza.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga Clínica · Salud Mental Severa y Psicoterapia Psicoanalítica',
  summary = 'Psicóloga clínica con más de 12 años de experiencia en instituciones de referencia y práctica privada. Licenciada por la Universidad Complutense de Madrid con especialidad clínica, Máster en Psicoterapia Psicoanalítica (UCM) y Máster en Psicología Jurídica (Universidad Internacional de Valencia). Especializada en salud mental severa, patología dual, psicosis y trastornos límite de personalidad, con formación avanzada junto a referentes como Fernando Colina, José Ramón Ubieto y Diego Figuera. Trayectoria en Fundación Manantial liderando proyectos piloto de innovación social y medición de modelos de intervención. Autora de publicaciones en la Revista del Centro Psicoanalítico de Madrid, ponente en congresos nacionales de rehabilitación psicosocial y supervisora clínica. Docente en PsikoAprende del Curso de Psicología Forense para Violencia de Género.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga Sanitaria · EMDR y Trauma Infanto-Juvenil',
  summary = 'Psicóloga Sanitaria con más de 10 años de experiencia en práctica clínica privada y hospitalaria. Licenciada por la Universidad de Oviedo con formación de máster en Práctica Clínica en Salud Mental (AEPCCC), Psicología Infantil y Adolescente, y Coaching e Inteligencia Emocional Infantil y Adolescente (ESNECA). Certificada en EMDR Nivel I y II por el Instituto Español EMDR (acreditado por EMDR Europa), con formación avanzada en trauma complejo. Experiencia profesional en el Centro Penitenciario de Villabona con programas de intervención con agresores en violencia de género. Actualmente combina práctica clínica en Buencoco-Unobravo con docencia en el Máster de Práctica Clínica de la AEPCCC. Docente en PsikoAprende del Curso de Experto en Inteligencia Emocional.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga Sanitaria | Directora de Centro Ongizate | Especialista en TCA, Neuropsicología y Trauma',
  summary = 'Psicóloga con habilitación sanitaria y más de 15 años de experiencia clínica. Licenciada por la Universidad de Deusto, Máster en Psicología Clínica Infanto-Juvenil (ISEP) y Máster en Neuropsicología (UOC). Directora y fundadora del Centro Integral de Psicología Ongizate en Bilbao, con enfoque integrador en atención a adultos, adolescentes y población neurodivergente. Especializada en trastornos de la conducta alimentaria y psiconutrición (Norte Salud en Nutrición), trastornos de la personalidad (SEMPyP) y neuropsicología clínica. Actualmente cursando formación en Clínica e Intervención en Trauma con EMDR (SEMPyP, 2024-2026). Ex-miembro de la Comisión Clínica del Colegio Oficial de Psicólogos de Bizkaia (2014-2018). Más de una década como formadora para empresas, instituciones educativas y ayuntamientos. Docente en PsikoAprende del Diplomado en Psicología de la Imagen Corporal y del Curso de Neurobiología del Trauma.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga Sanitaria | +15 años en Autismo y Atención Temprana | Supervisora ABA Internacional',
  summary = 'Psicóloga Sanitaria con más de 15 años de experiencia especializada en atención temprana y trastorno del espectro autista. Licenciada por la Universidad de Almería, Máster en Psicología General Sanitaria (Universidad de Almería) y Máster en Intervención ABA en Autismo y otros Trastornos del Desarrollo (ABA España). Supervisora ABA con trayectoria internacional: supervisión de programas conductuales en España (Eureka Psicología) y Perú (MADI Perú S.A.C. y Alcanzando, Lima), formando equipos terapéuticos y asesorando a familias. Certificada en PECS (Picture Exchange Communication System) y CBCT (Cognitively-Based Compassion Training). Integra análisis aplicado de la conducta con terapias contextuales de tercera generación (ACT, FAP) para diseñar intervenciones eficaces, medibles y orientadas a valores. Docente en PsikoAprende del Curso de Terapias de 3.ª Generación.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Coach Profesional Certificada | Químico Clínico | Psiconeuroinmunología y Transformación Personal',
  summary = 'Coach Profesional Certificada por Myalo Coaching con formación científica como Químico Clínico Biólogo (Universidad de Montemorelos) y más de 25 años de trayectoria profesional. Especializada en psiconeuroinmunología (Regenera University, 2024), desarrollo humano y educación holística (Universidad Iberoamericana). Fundadora de "Vive la experiencia" y cofundadora del Instituto de Desarrollo Integral Canoas con más de 11 años de actividad. Formación complementaria en medicina funcional, trauma y teoría polivagal, neurobiología del amor y relaciones, y descodificación biológica de enfermedad. Integra una base científica sólida con coaching de transformación personal, facilitación grupal y desarrollo espiritual. Docente en PsikoAprende del Diplomado en Coaching de Propósito y Transformación Personal y del Curso de Coaching de Propósito.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga | Especialista en Psicotraumatología Clínica | EMDR, Brainspotting e IFS | Conferencista Internacional',
  summary = 'Psicóloga graduada con diploma de honor de la Universidad de Buenos Aires. Especialista en psicotraumatología con certificación internacional de más de 300 horas por la Trauma Professionals Association (Wisconsin) y Newman Institute (CPT-I, CPT-II, CPT-III). Formación de posgrado en psicoanálisis freudiano-lacaniano en clínica de adultos. Certificada internacionalmente en EMDR, Brainspotting y Focusing, con formación avanzada en terapia sensoriomotriz, Internal Family Systems (IFS), modelo TIST y Finding Solid Ground. Más de 10 años de práctica clínica privada con adultos, integrando recursos somáticos para la estabilización y procesamiento de memorias traumáticas. Conferencista internacional en España, Latinoamérica y Estados Unidos. Creadora de contenido especializado en trauma y regulación somática (@traumaycuerpo). Docente en PsikoAprende del Diplomado en Psicotraumatología Clínica.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
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
  headline = 'Psicóloga Sanitaria | Neurociencia, Trauma y Adicciones | Creadora del Método Neurocalma',
  summary = 'Psicóloga Sanitaria graduada de la Universidade de Santiago de Compostela con Máster en Psicología General Sanitaria (UNED). Trayectoria profesional en organizaciones de referencia: Cruz Roja Española (intervención con infancia en riesgo y víctimas de violencia de género), Asociación Española Contra el Cáncer (psicooncología y cuidados paliativos) y PRETOX (tratamiento ambulatorio de adicciones con y sin sustancia, reducción de daños). Experta en Adicciones por el Colegio Oficial de Psicología de Madrid (más de 200 horas). Certificada en EMDR, Experta en Mindfulness MBSR (Apir España) y formada en Internal Family Systems (IFS), perspectiva somática y epigenética. Creadora del Método Neurocalma, programa especializado para mujeres con estrés crónico laboral. Docente en PsikoAprende del Diplomado en Neurociencia Aplicada al Trauma y la Plasticidad Cerebral.',
  role = 'professional', plan = 'pro',
  template = 'psychology-professional', template_color = '#0D9488',
  location = 'Santiago de Compostela, España', country_code = 'ES',
  slug = 'alba-burundarena', is_active = true,
  job_seeking_status = 'NOT_LOOKING', is_open_to_messages = false,
  meta_title = 'Col. G-6047 (Galicia)',
  avatar_url = 'https://psikoaprende.com/wp-content/uploads/2025/10/Alba-Burundarena-Psiko-Aprende.png',
  linkedin_url = 'https://linkedin.com/in/albaburundarena',
  phone = '+34 678 912 453'
WHERE id = p13;

-- ═══════════════════════════════════════════════════════════════════════
-- STAGE 3: EXPERIENCES
-- ═══════════════════════════════════════════════════════════════════════

-- 1. Tatiana Ferrari
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p1, 'Clínica Bonaire Salud, Palma de Mallorca', 'Psicóloga Sanitaria', '2018-01-01', NULL, true, 'Intervención clínica presencial con adultos, adolescentes y familias. Coordinación parental en procesos de separación de alta conflictividad y mediación familiar.', 1),
  (p1, 'Consulta Privada Internacional', 'Psicóloga Online', '2015-01-01', NULL, true, 'Atención terapéutica online en español, italiano e inglés a pacientes en Europa y Latinoamérica. Especialización en terapia de pareja y vínculos afectivos.', 2),
  (p1, 'Práctica Privada, Barcelona', 'Psicóloga y Mediadora Familiar', '2010-01-01', '2015-12-31', false, 'Terapia individual y familiar. Atención a víctimas de violencia de género. Gestión de conflictos familiares con adolescentes.', 3);

-- 2. Rocío Roblas
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p2, 'Centro de Atención Infantil Temprana (CAIT)', 'Coordinadora Técnica', '2019-01-01', NULL, true, 'Coordinación de equipos multidisciplinares en atención temprana. Evaluación y seguimiento de desarrollo infantil. Diseño de programas de intervención.', 1),
  (p2, 'Cuerpos de Seguridad del Estado y Bomberos', 'Evaluadora Psicológica', '2016-01-01', NULL, true, 'Evaluación psicométrica y aptitudinal para procesos de selección de fuerzas de seguridad y servicios de emergencia.', 2),
  (p2, 'Plataformas Digitales de Salud Mental', 'Especialista en RRHH y Gestión del Talento', '2020-01-01', '2023-12-31', false, 'Gestión del talento en plataformas de psicología online. Selección y supervisión de profesionales sanitarios.', 3),
  (p2, 'Práctica Privada', 'Psicóloga Sanitaria', '2014-01-01', NULL, true, 'Terapia individual y de pareja. Intervención con adultos, adolescentes y personas mayores. Modalidad presencial y online.', 4);

-- 3. Mireia Jareño Moraga
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p3, 'Consulta Privada Especializada', 'Psicóloga Online', '2020-01-01', NULL, true, 'Psicoterapia online para niños, adolescentes y adultos. Intervención especializada en trastornos de la conducta alimentaria, trauma, regulación emocional y autoestima.', 1),
  (p3, 'Servicios Sociales, Valencia', 'Psicóloga en Protección Infantil', '2018-01-01', '2020-12-31', false, 'Evaluación y tratamiento de población infanto-juvenil en acogimiento familiar. Coordinación con equipos multidisciplinares y servicios sociales.', 2),
  (p3, 'Centro de Atención Especializada', 'Psicóloga en Violencia de Género', '2017-01-01', '2019-12-31', false, 'Intervención con víctimas de violencia de género y sus hijos. Evaluación de riesgo y diseño de planes de seguridad.', 3),
  (p3, 'Asociación de Intervención Social', 'Psicóloga en Exclusión Social', '2016-01-01', '2018-12-31', false, 'Evaluación y tratamiento de poblaciones vulnerables en riesgo de exclusión social.', 4);

-- 4. Melisa Freitas
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p4, 'Consulta Privada', 'Psicóloga Clínica', '2018-01-01', NULL, true, 'Intervención clínica con adultos en regulación emocional, autoestima, trauma y habilidades sociales. Modalidad presencial y online.', 1),
  (p4, 'Freelance', 'Administradora de Psicotécnicos Laborales', '2017-01-01', NULL, true, 'Evaluación psicotécnica para procesos de selección y aptitud laboral en ámbito clínico privado.', 2),
  (p4, 'Instituciones Educativas', 'Coordinadora de Integraciones Escolares', '2015-01-01', '2018-12-31', false, 'Acompañamiento escolar de menores con TGD, autismo y problemas conductuales. Elaboración de adaptaciones curriculares y coordinación con equipos docentes.', 3),
  (p4, 'Instituciones de Educación Especial', 'Auxiliar Pedagógica', '2013-01-01', '2015-12-31', false, 'Apoyo pedagógico en aulas de educación especial. Diseño de actividades adaptadas para alumnos con necesidades educativas específicas.', 4);

-- 5. Mayori Armero
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p5, 'Práctica Internacional, España y Países Bajos', 'Psicóloga Freelance', '2022-01-01', NULL, true, 'Terapia clínica online y presencial. Implementación de tecnologías innovadoras en salud mental: neurofeedback, biofeedback y estimulación cerebral no invasiva (tDCS).', 1),
  (p5, 'Stichting Nuestra Casa, Países Bajos', 'Colaboradora Psicóloga', '2020-01-01', NULL, true, 'Atención psicosocial a comunidad hispanohablante. Integración social y mediación intercultural.', 2),
  (p5, 'Sector Privado', 'Responsable de RRHH y Dirección Administrativa', '2017-01-01', '2020-12-31', false, 'Gestión de recursos humanos, selección de personal y dirección administrativa.', 3);

-- 6. Mariana García Bordones
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p6, 'Instituciones Educativas, Galicia, España', 'Profesora de Danza Terapéutica y Yoga', '2024-01-01', NULL, true, 'Docencia en danza terapéutica, expresión corporal y yoga. Participación en proyectos musicales internacionales en el Camino de Santiago.', 1),
  (p6, 'Escuela de Danza Sueño Contemporáneo, Venezuela', 'Directora y Fundadora', '2021-01-01', '2024-12-31', false, 'Dirección integral del centro, integrando psicología clínica con metodologías artísticas. Formación de alumnos en danza contemporánea terapéutica.', 2),
  (p6, 'Compañía Valencia Danza Contemporánea, Venezuela', 'Bailarina Principal', '2016-01-01', '2021-12-31', false, 'Participación en festivales nacionales con Mención Plata y premios en categoría profesional.', 3),
  (p6, 'Consulta Privada, Venezuela', 'Psicóloga Clínica', '2017-01-01', '2024-12-31', false, 'Atención clínica a niños, adultos y gestantes. Terapia cognitivo-conductual y Danza Movimiento Terapia.', 4);

-- 7. María Trinidad Arenas Jara
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p7, 'Consulta Privada, Madrid', 'Psicóloga Clínica', '2013-01-01', NULL, true, 'Atención clínica a niños, adolescentes y adultos. Psicoterapia psicoanalítica con supervisión especializada. Evaluación psicológica forense.', 1),
  (p7, 'Fundación Manantial, Madrid', 'Psicóloga en Rehabilitación Psicosocial', '2014-01-01', '2022-12-31', false, 'Liderazgo de proyectos piloto de innovación social. Medición de modelos de intervención en salud mental. Trabajo con patología dual y psicosis.', 2),
  (p7, 'Varios centros, Madrid', 'Supervisora Clínica y Formadora', '2016-01-01', NULL, true, 'Supervisión de profesionales en formación. Ponencias en congresos nacionales de rehabilitación psicosocial.', 3);

-- 8. Jennifer Lampre
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p8, 'Buencoco-Unobravo', 'Psicóloga Sanitaria y Clinical HR Recruiter', '2022-01-01', NULL, true, 'Práctica clínica online combinada con gestión del talento en plataforma internacional de salud mental.', 1),
  (p8, 'Máster de Práctica Clínica, AEPCCC', 'Docente', '2018-01-01', NULL, true, 'Formación de psicólogos en práctica clínica y salud mental.', 2),
  (p8, 'Centro Penitenciario de Villabona, Asturias', 'Psicóloga', '2015-01-01', '2018-12-31', false, 'Programas de intervención con agresores en violencia de género. Trabajo en contextos de vulnerabilidad social.', 3),
  (p8, 'Práctica Clínica Privada y Hospitalaria', 'Psicóloga Sanitaria', '2012-01-01', NULL, true, 'Intervención con población infanto-juvenil y adulta. Especialización en trauma con EMDR. Talleres sobre igualdad, ansiedad y resolución de conflictos para instituciones públicas.', 4);

-- 9. Irene Tobías Fernández
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p9, 'Centro Integral de Psicología Ongizate, Bilbao', 'Directora y Fundadora', '2013-01-01', NULL, true, 'Dirección clínica y administrativa. Intervención psicológica con enfoque integrador. Atención a adultos, adolescentes y población neurodivergente.', 1),
  (p9, 'ISEP Clinic', 'Neuropsicóloga', '2013-01-01', '2019-12-31', false, 'Evaluación y rehabilitación neuropsicológica. Trabajo con daño cerebral adquirido y deterioro cognitivo.', 2),
  (p9, 'Colegio Oficial de Psicólogos de Bizkaia', 'Miembro Comisión Clínica', '2014-01-01', '2018-12-31', false, 'Participación en comisión institucional sobre práctica clínica y estándares profesionales.', 3),
  (p9, 'Empresas, Instituciones Educativas y Ayuntamientos', 'Formadora', '2013-01-01', NULL, true, 'Más de una década diseñando e impartiendo formación especializada en salud mental.', 4);

-- 10. Irene Cruz
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p10, 'Eureka Psicología, España', 'Supervisora ABA', '2022-01-01', NULL, true, 'Supervisión de intervenciones conductuales con menores con TEA. Formación a equipos terapéuticos y familias.', 1),
  (p10, 'MADI Perú S.A.C., Lima', 'Supervisora ABA', '2019-01-01', '2022-12-31', false, 'Supervisión internacional de programas ABA. Formación a equipos multiculturales y asesoramiento a familias.', 2),
  (p10, 'Alcanzando, Lima', 'Psicóloga Especialista en Conducta (PEC)', '2018-01-01', '2019-12-31', false, 'Diseño e implementación de programas de intervención multiculturales para niños con TEA.', 3),
  (p10, 'Unidad de Estancia Diurna OLYAL, España', 'Psicóloga', '2014-01-01', '2018-12-31', false, 'Intervención con personas con diversidad funcional. Programas de habilidades adaptativas.', 4),
  (p10, 'Varios centros, España', 'Supervisora de Atención Temprana', '2010-01-01', '2014-12-31', false, 'Supervisión de intervenciones a profesionales de atención temprana.', 5);

-- 11. Débora Ramírez
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p11, '"Vive la experiencia"', 'Fundadora y CEO', '2018-01-01', NULL, true, 'Programas integrales para desarrollo emocional, físico y espiritual. Coaching individual y grupal. Facilitación de procesos de transformación personal.', 1),
  (p11, 'Instituto de Desarrollo Integral Canoas', 'Socia Fundadora y Maestra', '2013-01-01', NULL, true, 'Más de 11 años diseñando y facilitando programas de desarrollo humano. Formación en inteligencia emocional y bienestar integral.', 2),
  (p11, 'Práctica Profesional', 'Químico Clínico Biólogo', '1999-01-01', '2013-12-31', false, 'Análisis clínicos y diagnóstico de laboratorio. Base científica que fundamenta su enfoque en psiconeuroinmunología.', 3);

-- 12. Cecilia García Robles
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p12, 'Consultorio Privado, Buenos Aires', 'Psicóloga Clínica', '2013-01-01', NULL, true, 'Atención a adultos con enfoque en psicotraumatología. Integración de recursos somáticos para estabilización y procesamiento de memorias traumáticas.', 1),
  (p12, 'Eventos y Congresos', 'Conferencista Internacional', '2018-01-01', NULL, true, 'Ponencias y talleres sobre trauma, EMDR y enfoques somáticos en España, Latinoamérica y Estados Unidos.', 2),
  (p12, 'Publicaciones y Cursos', 'Formadora y Escritora', '2016-01-01', NULL, true, 'Diseño e impartición de formaciones especializadas en psicotraumatología. Publicaciones sobre trauma y cuerpo.', 3),
  (p12, '@traumaycuerpo en Instagram', 'Divulgadora', '2019-01-01', NULL, true, 'Creación de contenido especializado en trauma y regulación somática con amplia comunidad de seguidores.', 4);

-- 13. Alba Burundarena
INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, description, sort_order) VALUES
  (p13, 'Práctica Privada', 'Psicóloga Clínica Online', '2022-01-01', NULL, true, 'Enfoque integrador informado en trauma y apego. Creación y aplicación del Método Neurocalma para mujeres con estrés crónico laboral.', 1),
  (p13, 'PRETOX', 'Psicóloga en Adicciones', '2021-01-01', '2023-12-31', false, 'Tratamiento ambulatorio de adicciones con y sin sustancia. Programas de reducción de daños y mantenimiento con metadona.', 2),
  (p13, 'Asociación Española Contra el Cáncer', 'Psicóloga en Psicooncología', '2020-01-01', '2021-12-31', false, 'Acompañamiento psicológico a pacientes oncológicos y familiares. Cuidados paliativos y duelo.', 3),
  (p13, 'Cruz Roja Española', 'Técnico Psicosocial', '2018-01-01', '2020-12-31', false, 'Intervención con infancia en riesgo, víctimas de violencia de género y personas en situación de exclusión social.', 4);

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
