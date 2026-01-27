-- =====================================================
-- DIAGNÓSTICO DEL SISTEMA DE VACANTES
-- =====================================================
-- Este script verifica el estado completo del sistema
-- y detecta problemas
-- =====================================================

-- 1. Verificar que las tablas existen
-- =====================================================
SELECT 'Tablas existentes:' as info;

SELECT
  table_name,
  CASE
    WHEN table_name IN (
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
    ) THEN '✅ Existe'
    ELSE '❌ No existe'
  END as status
FROM (
  VALUES
    ('job_postings'),
    ('job_applications'),
    ('job_posting_views'),
    ('job_posting_questions'),
    ('companies'),
    ('company_users')
) AS t(table_name);

-- 2. Verificar RLS habilitado
-- =====================================================
SELECT 'RLS Status:' as info;

SELECT
  tablename,
  CASE
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('job_postings', 'job_applications', 'job_posting_views', 'job_posting_questions')
ORDER BY tablename;

-- 3. Verificar políticas RLS
-- =====================================================
SELECT 'Políticas RLS:' as info;

SELECT
  tablename,
  COUNT(*) as num_policies,
  STRING_AGG(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('job_postings', 'job_applications', 'job_posting_views', 'job_posting_questions')
GROUP BY tablename
ORDER BY tablename;

-- 4. Verificar funciones RPC
-- =====================================================
SELECT 'Funciones RPC:' as info;

SELECT
  routine_name,
  CASE
    WHEN routine_name IN (
      'calculate_job_match_score',
      'publish_job_posting',
      'apply_to_job',
      'update_application_status'
    ) THEN '✅ Existe'
    ELSE '⚠️ Inesperada'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%job%'
ORDER BY routine_name;

-- 5. Verificar índices
-- =====================================================
SELECT 'Índices:' as info;

SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('job_postings', 'job_applications', 'job_posting_views', 'job_posting_questions')
ORDER BY tablename, indexname;

-- 6. Contar registros
-- =====================================================
SELECT 'Datos en tablas:' as info;

SELECT
  'companies' as table_name,
  COUNT(*) as count
FROM companies
UNION ALL
SELECT
  'job_postings' as table_name,
  COUNT(*) as count
FROM job_postings
UNION ALL
SELECT
  'job_applications' as table_name,
  COUNT(*) as count
FROM job_applications
UNION ALL
SELECT
  'job_posting_views' as table_name,
  COUNT(*) as count
FROM job_posting_views;

-- 7. Verificar si hay vacantes publicadas
-- =====================================================
SELECT 'Vacantes por estado:' as info;

SELECT
  status,
  COUNT(*) as count
FROM job_postings
GROUP BY status
ORDER BY status;

-- 8. Verificar permisos de lectura anónima
-- =====================================================
SELECT 'Probando consulta pública (debería funcionar):' as info;

SET ROLE anon;

SELECT
  id,
  title,
  slug,
  status,
  company_id
FROM job_postings
WHERE status = 'PUBLISHED'
LIMIT 5;

RESET ROLE;

-- 9. Detectar problemas comunes
-- =====================================================
SELECT 'Diagnóstico de problemas:' as info;

SELECT
  'Sin funciones RPC' as problema,
  '❌ CRÍTICO' as severidad
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.routines
  WHERE routine_schema = 'public'
    AND routine_name = 'publish_job_posting'
)
UNION ALL
SELECT
  'job_postings sin RLS' as problema,
  '❌ CRÍTICO' as severidad
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'job_postings'
  AND rowsecurity = false
UNION ALL
SELECT
  'Sin políticas en job_postings' as problema,
  '⚠️ ADVERTENCIA' as severidad
WHERE (
  SELECT COUNT(*) FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'job_postings'
) = 0
UNION ALL
SELECT
  'Sin vacantes de prueba' as problema,
  'ℹ️ INFO' as severidad
WHERE (SELECT COUNT(*) FROM job_postings) = 0;

-- =====================================================
-- INSTRUCCIONES SEGÚN RESULTADOS
-- =====================================================
/*
Si ves errores:

❌ "job_postings does not exist"
   → Ejecuta: EXECUTE_THESE_MIGRATIONS.sql

❌ "companies_i_name does not exist"
   → Ejecuta: fix-all-job-tables-rls.sql

❌ "function publish_job_posting does not exist"
   → Ejecuta: RPC_FUNCTIONS_TO_EXECUTE.sql

⚠️ "Sin políticas en job_postings"
   → Ejecuta: fix-all-job-tables-rls.sql

ℹ️ "Sin vacantes de prueba"
   → Ejecuta: quick-test-setup.sql (cambia tu email primero)
*/
