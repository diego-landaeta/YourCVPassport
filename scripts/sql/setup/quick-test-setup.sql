-- =====================================================
-- QUICK TEST SETUP - Una sola ejecución
-- =====================================================
-- Este script crea automáticamente todo usando tu email
-- =====================================================

-- INSTRUCCIONES:
-- 1. Reemplaza 'tu-email@ejemplo.com' con tu email real
-- 2. Ejecuta todo este script de una vez
-- 3. Listo para testear!

DO $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_job_id UUID;
BEGIN
  -- Obtener tu user_id basado en email
  -- ⚠️ CAMBIA ESTE EMAIL POR EL TUYO
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'test@dev.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado. Cambia el email en el script.';
  END IF;

  RAISE NOTICE 'Usuario encontrado: %', v_user_id;

  -- Crear empresa
  INSERT INTO companies (
    id, name, legal_name, tax_id, industry, company_size,
    description, website, logo_url, status, credits_balance,
    created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    'Tech Innovators SA',
    'Tech Innovators Sociedad Anónima',
    'B12345678',
    'Tecnología',
    '51-200',
    'Empresa líder en desarrollo de software y soluciones tecnológicas innovadoras.',
    'https://techinnovators.example.com',
    'https://ui-avatars.com/api/?name=Tech+Innovators&background=2563eb&color=fff&size=200',
    'APPROVED',
    500,
    NOW(),
    NOW()
  ) RETURNING id INTO v_company_id;

  RAISE NOTICE 'Empresa creada: %', v_company_id;

  -- Asignar usuario como OWNER
  INSERT INTO company_users (company_id, user_id, role, created_at)
  VALUES (v_company_id, v_user_id, 'OWNER', NOW());

  -- Registrar créditos
  INSERT INTO company_credits_history (
    company_id, amount, transaction_type, description, created_at
  ) VALUES (
    v_company_id, 500, 'ADMIN_ADJUSTMENT',
    'Créditos iniciales para testing', NOW()
  );

  -- Vacante 1: Senior React Developer
  INSERT INTO job_postings (
    company_id, created_by, title, slug, department,
    employment_type, work_mode, experience_level,
    location_country, is_remote, description,
    responsibilities, requirements, nice_to_have, benefits,
    required_skills, optional_skills,
    salary_min, salary_max, salary_currency, salary_period, show_salary,
    application_deadline, status, created_at, updated_at
  ) VALUES (
    v_company_id, v_user_id,
    'Senior React Developer',
    'senior-react-developer-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'Ingeniería',
    'FULL_TIME', 'REMOTE', 'SENIOR',
    'ES', true,
    'Desarrollador React Senior para proyectos innovadores con las últimas tecnologías.',
    ARRAY['Desarrollar aplicaciones React', 'Mentorizar equipo', 'Code reviews'],
    ARRAY['5+ años React/TypeScript', 'Testing', 'State management'],
    ARRAY['Next.js', 'Node.js', 'GraphQL'],
    ARRAY['100% remoto', '30 días vacaciones', 'Formación continua'],
    ARRAY['React', 'TypeScript', 'JavaScript', 'CSS'],
    ARRAY['Next.js', 'Node.js', 'GraphQL'],
    45000, 65000, 'EUR', 'YEARLY', true,
    (NOW() + INTERVAL '30 days')::date,
    'DRAFT', NOW(), NOW()
  ) RETURNING id INTO v_job_id;

  RAISE NOTICE 'Vacante 1 creada: %', v_job_id;

  -- Vacante 2: DevOps Engineer (salario a convenir)
  INSERT INTO job_postings (
    company_id, created_by, title, slug, department,
    employment_type, work_mode, experience_level,
    location_city, location_country, is_remote,
    description, responsibilities, requirements, benefits,
    required_skills, optional_skills,
    salary_currency, salary_period, show_salary,
    application_deadline, status, created_at, updated_at
  ) VALUES (
    v_company_id, v_user_id,
    'DevOps Engineer',
    'devops-engineer-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'Infraestructura',
    'FULL_TIME', 'HYBRID', 'MID',
    'Madrid', 'ES', false,
    'Ingeniero DevOps para optimizar infraestructura cloud y CI/CD.',
    ARRAY['Gestionar AWS/Azure', 'CI/CD pipelines', 'Automatización'],
    ARRAY['3+ años DevOps', 'Kubernetes', 'Docker', 'CI/CD'],
    ARRAY['Híbrido flexible', 'Formación cloud', 'Equipo moderno'],
    ARRAY['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    ARRAY['Terraform', 'Ansible', 'Python'],
    'EUR', 'YEARLY', false,
    (NOW() + INTERVAL '45 days')::date,
    'DRAFT', NOW(), NOW()
  ) RETURNING id INTO v_job_id;

  RAISE NOTICE 'Vacante 2 creada: %', v_job_id;

  -- Vacante 3: UX/UI Designer
  INSERT INTO job_postings (
    company_id, created_by, title, slug, department,
    employment_type, work_mode, experience_level,
    location_country, is_remote,
    description, responsibilities, requirements, benefits,
    required_skills, optional_skills,
    salary_currency, salary_period, show_salary,
    status, created_at, updated_at
  ) VALUES (
    v_company_id, v_user_id,
    'UX/UI Designer',
    'ux-ui-designer-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    'Diseño',
    'FULL_TIME', 'REMOTE', 'JUNIOR',
    'ES', true,
    'Diseñador UX/UI creativo para crear experiencias digitales intuitivas.',
    ARRAY['Wireframes y prototipos', 'Interfaces responsive', 'User research'],
    ARRAY['2+ años UX/UI', 'Portfolio web/móvil', 'Figma/Sketch'],
    ARRAY['100% remoto', 'Horario flexible', 'Herramientas incluidas'],
    ARRAY['Figma', 'UI Design', 'UX Design', 'Prototyping'],
    ARRAY['Sketch', 'Adobe XD', 'HTML/CSS'],
    'EUR', 'YEARLY', false,
    'DRAFT', NOW(), NOW()
  ) RETURNING id INTO v_job_id;

  RAISE NOTICE 'Vacante 3 creada: %', v_job_id;

  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Setup completado exitosamente!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Company ID: %', v_company_id;
  RAISE NOTICE 'Créditos: 500';
  RAISE NOTICE 'Vacantes creadas: 3 (DRAFT)';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos pasos:';
  RAISE NOTICE '1. Ve a /company/dashboard';
  RAISE NOTICE '2. Clic en "Publicar Vacante"';
  RAISE NOTICE '3. O edita las vacantes creadas en /company/jobs';
  RAISE NOTICE '========================================';

END $$;

-- Verificar todo
SELECT
  c.name as empresa,
  c.credits_balance as creditos,
  c.status as estado,
  COUNT(jp.id) as vacantes_creadas
FROM companies c
LEFT JOIN job_postings jp ON jp.company_id = c.id
WHERE c.name = 'Tech Innovators SA'
GROUP BY c.id, c.name, c.credits_balance, c.status;
