-- ============================================================
-- Script para configurar datos de prueba para empresa y vacantes
-- ============================================================
-- Usuario empresa: aacdb690-791c-4036-b4ea-57e91663dd0a
-- Usuario candidato: dbf18bf8-13e0-4113-8eea-d323e8fbc9eb
-- ============================================================

-- ===========================================
-- PASO 1: Verificar que el usuario tiene empresa
-- ===========================================
SELECT
  cu.user_id,
  cu.role,
  c.id as company_id,
  c.company_name,
  c.status,
  c.credit_balance
FROM company_users cu
JOIN companies c ON cu.company_id = c.id
WHERE cu.user_id = 'aacdb690-791c-4036-b4ea-57e91663dd0a';

-- ===========================================
-- PASO 2: Dar créditos a la empresa (500 créditos de inicio)
-- ===========================================
-- Primero actualizamos el balance
UPDATE companies
SET
  credit_balance = credit_balance + 500,
  total_credits_purchased = total_credits_purchased + 500,
  status = 'APPROVED', -- Aseguramos que esté aprobada
  verified_at = COALESCE(verified_at, NOW())
WHERE id IN (
  SELECT company_id FROM company_users
  WHERE user_id = 'aacdb690-791c-4036-b4ea-57e91663dd0a'
);

-- Registramos la transacción en el historial
INSERT INTO company_credits_history (
  company_id,
  amount,
  balance_after,
  transaction_type,
  description,
  created_at
)
SELECT
  cu.company_id,
  500,
  c.credit_balance,
  'ADMIN_ADJUSTMENT',
  'Créditos iniciales de prueba para testing',
  NOW()
FROM company_users cu
JOIN companies c ON cu.company_id = c.id
WHERE cu.user_id = 'aacdb690-791c-4036-b4ea-57e91663dd0a';

-- ===========================================
-- PASO 3: Verificar que el candidato tiene perfil
-- ===========================================
-- NOTA: En profiles, el id ES el user_id (mismo UUID de auth.users)
SELECT id, full_name, headline, slug
FROM profiles
WHERE id = 'dbf18bf8-13e0-4113-8eea-d323e8fbc9eb';

-- ===========================================
-- PASO 4: Crear una vacante de prueba
-- ===========================================
INSERT INTO job_postings (
  id,
  company_id,
  created_by,
  title,
  slug,
  department,
  employment_type,
  work_mode,
  experience_level,
  location_city,
  location_country,
  is_remote,
  description,
  responsibilities,
  requirements,
  nice_to_have,
  benefits,
  required_skills,
  optional_skills,
  salary_min,
  salary_max,
  salary_currency,
  salary_period,
  show_salary,
  status,
  published_at,
  views_count,
  applications_count
)
SELECT
  gen_random_uuid(),
  cu.company_id,
  'aacdb690-791c-4036-b4ea-57e91663dd0a',
  'Desarrollador Full Stack Senior',
  'desarrollador-full-stack-senior-' || substr(gen_random_uuid()::text, 1, 8),
  'Tecnología',
  'FULL_TIME',
  'HYBRID',
  'SENIOR',
  'Madrid',
  'ES',
  false,
  'Buscamos un desarrollador Full Stack Senior para unirse a nuestro equipo de innovación.

El candidato ideal tendrá experiencia sólida en desarrollo frontend con React y backend con Node.js, además de conocimientos en bases de datos SQL y NoSQL.

Trabajarás en proyectos desafiantes con las últimas tecnologías, en un ambiente colaborativo y con oportunidades de crecimiento profesional.

Ofrecemos:
- Trabajo híbrido (2-3 días en oficina)
- Salario competitivo
- Formación continua
- Ambiente de trabajo dinámico',
  ARRAY[
    'Desarrollar y mantener aplicaciones web full stack',
    'Colaborar con el equipo de diseño para implementar interfaces de usuario',
    'Participar en code reviews y mentorizar desarrolladores junior',
    'Proponer e implementar mejoras técnicas',
    'Documentar código y procesos técnicos'
  ],
  ARRAY[
    '5+ años de experiencia en desarrollo web',
    'Dominio de React, TypeScript y Node.js',
    'Experiencia con bases de datos PostgreSQL',
    'Conocimientos de arquitectura de software',
    'Nivel de inglés B2 o superior'
  ],
  ARRAY[
    'Experiencia con AWS o GCP',
    'Conocimientos de Docker y Kubernetes',
    'Experiencia con metodologías ágiles',
    'Contribuciones a proyectos open source'
  ],
  ARRAY[
    'Salario competitivo entre 45.000€ y 60.000€',
    'Trabajo híbrido flexible',
    '23 días de vacaciones + festivos',
    'Formación y certificaciones pagadas',
    'Seguro médico privado',
    'Bonus por rendimiento'
  ],
  ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git'],
  ARRAY['AWS', 'Docker', 'GraphQL', 'Redis'],
  45000,
  60000,
  'EUR',
  'YEARLY',
  true,
  'PUBLISHED',
  NOW(),
  15,
  0
FROM company_users cu
WHERE cu.user_id = 'aacdb690-791c-4036-b4ea-57e91663dd0a'
LIMIT 1;

-- ===========================================
-- PASO 5: Crear otra vacante (UX Designer)
-- ===========================================
INSERT INTO job_postings (
  id,
  company_id,
  created_by,
  title,
  slug,
  department,
  employment_type,
  work_mode,
  experience_level,
  location_city,
  location_country,
  is_remote,
  description,
  responsibilities,
  requirements,
  nice_to_have,
  benefits,
  required_skills,
  optional_skills,
  salary_min,
  salary_max,
  salary_currency,
  salary_period,
  show_salary,
  status,
  published_at,
  views_count,
  applications_count
)
SELECT
  gen_random_uuid(),
  cu.company_id,
  'aacdb690-791c-4036-b4ea-57e91663dd0a',
  'UX/UI Designer',
  'ux-ui-designer-' || substr(gen_random_uuid()::text, 1, 8),
  'Diseño',
  'FULL_TIME',
  'REMOTE',
  'MID',
  'Barcelona',
  'ES',
  true,
  'Estamos buscando un UX/UI Designer creativo y apasionado para diseñar experiencias digitales excepcionales.

Serás responsable de todo el proceso de diseño, desde la investigación de usuarios hasta la entrega de diseños finales de alta fidelidad.

Buscamos alguien con ojo para el detalle, empatía por los usuarios y capacidad de trabajar en equipo.',
  ARRAY[
    'Realizar investigación de usuarios y análisis de necesidades',
    'Crear wireframes, prototipos y diseños de alta fidelidad',
    'Colaborar con desarrolladores para asegurar la implementación correcta',
    'Mantener y evolucionar el sistema de diseño',
    'Presentar y defender decisiones de diseño'
  ],
  ARRAY[
    '3+ años de experiencia en diseño UX/UI',
    'Dominio de Figma y herramientas de prototipado',
    'Portfolio sólido con casos de estudio',
    'Conocimientos de accesibilidad web (WCAG)',
    'Español nativo, inglés B2+'
  ],
  ARRAY[
    'Experiencia con design systems',
    'Conocimientos de HTML/CSS',
    'Experiencia en startups o productos digitales',
    'Certificaciones en UX'
  ],
  ARRAY[
    'Trabajo 100% remoto',
    'Horario flexible',
    'Equipamiento de trabajo',
    'Presupuesto para formación',
    'Días de salud mental'
  ],
  ARRAY['Figma', 'UX Research', 'Prototyping', 'Design Systems', 'User Testing'],
  ARRAY['HTML', 'CSS', 'Sketch', 'Adobe XD'],
  35000,
  48000,
  'EUR',
  'YEARLY',
  true,
  'PUBLISHED',
  NOW(),
  8,
  0
FROM company_users cu
WHERE cu.user_id = 'aacdb690-791c-4036-b4ea-57e91663dd0a'
LIMIT 1;

-- ===========================================
-- PASO 6: Crear aplicación del candidato a la vacante
-- ===========================================
INSERT INTO job_applications (
  id,
  job_posting_id,
  profile_id,
  company_id,
  status,
  cover_letter,
  viewed_by_company,
  match_score,
  created_at
)
SELECT
  gen_random_uuid(),
  jp.id,
  p.id,
  jp.company_id,
  'NEW',
  'Estimado equipo de selección,

Me dirijo a ustedes para expresar mi interés en la posición de Desarrollador Full Stack Senior que han publicado.

Cuento con más de 6 años de experiencia en desarrollo web, trabajando con tecnologías como React, TypeScript, Node.js y PostgreSQL - exactamente las que mencionan en los requisitos.

En mi rol actual he liderado proyectos de migración a arquitecturas modernas y he implementado mejoras que redujeron los tiempos de carga en un 40%. También he mentorizado a desarrolladores junior y participado activamente en la definición de estándares de código.

Me atrae especialmente su enfoque en la innovación y el ambiente colaborativo que describen. Creo que mi experiencia y mi pasión por crear soluciones técnicas de calidad serían un gran aporte para su equipo.

Quedo a su disposición para ampliar cualquier información.

Saludos cordiales',
  false,
  85,
  NOW() - INTERVAL '2 hours'
FROM job_postings jp
CROSS JOIN profiles p
WHERE jp.title = 'Desarrollador Full Stack Senior'
  AND p.id = 'dbf18bf8-13e0-4113-8eea-d323e8fbc9eb'
LIMIT 1;

-- Actualizar contador de aplicaciones
UPDATE job_postings
SET applications_count = applications_count + 1
WHERE title = 'Desarrollador Full Stack Senior'
  AND company_id IN (
    SELECT company_id FROM company_users
    WHERE user_id = 'aacdb690-791c-4036-b4ea-57e91663dd0a'
  );

-- ===========================================
-- PASO 7: Verificaciones finales
-- ===========================================

-- Verificar créditos de la empresa
SELECT
  c.company_name,
  c.status,
  c.credit_balance,
  c.total_credits_purchased
FROM companies c
JOIN company_users cu ON c.id = cu.company_id
WHERE cu.user_id = 'aacdb690-791c-4036-b4ea-57e91663dd0a';

-- Verificar vacantes creadas
SELECT
  jp.id,
  jp.title,
  jp.status,
  jp.employment_type,
  jp.work_mode,
  jp.applications_count,
  jp.published_at
FROM job_postings jp
JOIN company_users cu ON jp.company_id = cu.company_id
WHERE cu.user_id = 'aacdb690-791c-4036-b4ea-57e91663dd0a';

-- Verificar aplicación del candidato
SELECT
  ja.id,
  ja.status,
  ja.match_score,
  jp.title as job_title,
  p.full_name as candidate_name,
  ja.created_at
FROM job_applications ja
JOIN job_postings jp ON ja.job_posting_id = jp.id
JOIN profiles p ON ja.profile_id = p.id
WHERE p.id = 'dbf18bf8-13e0-4113-8eea-d323e8fbc9eb';

-- Ver historial de créditos
SELECT
  cch.amount,
  cch.balance_after,
  cch.transaction_type,
  cch.description,
  cch.created_at
FROM company_credits_history cch
JOIN company_users cu ON cch.company_id = cu.company_id
WHERE cu.user_id = 'aacdb690-791c-4036-b4ea-57e91663dd0a'
ORDER BY cch.created_at DESC;

-- ============================================================
-- RESUMEN DE LO QUE HACE ESTE SCRIPT:
-- ============================================================
-- 1. Verifica que el usuario tiene una empresa asociada
-- 2. Agrega 500 créditos a la empresa y la marca como APPROVED
-- 3. Crea 2 vacantes publicadas:
--    - Desarrollador Full Stack Senior (híbrido, Madrid)
--    - UX/UI Designer (remoto, Barcelona)
-- 4. Crea una aplicación del candidato a la vacante de Full Stack
-- 5. Muestra verificaciones de todo lo creado
-- ============================================================
