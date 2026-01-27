-- =====================================================
-- VERIFICACIÓN RÁPIDA DEL SISTEMA DE VACANTES
-- =====================================================
-- Copia y pega este script completo en Supabase SQL Editor
-- =====================================================

\echo '===================='
\echo 'VERIFICACIÓN RÁPIDA'
\echo '===================='

-- 1. Verificar funciones RPC críticas
\echo ''
\echo '1. VERIFICANDO FUNCIONES RPC...'

SELECT
  CASE
    WHEN COUNT(*) = 4 THEN '✅ Las 4 funciones RPC existen'
    ELSE '❌ FALTAN ' || (4 - COUNT(*))::text || ' funciones RPC'
  END as resultado
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_job_match_score',
    'publish_job_posting',
    'apply_to_job',
    'update_application_status'
  );

-- Listar funciones encontradas
SELECT
  routine_name as funcion,
  '✅' as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'calculate_job_match_score',
    'publish_job_posting',
    'apply_to_job',
    'update_application_status'
  )
ORDER BY routine_name;

-- 2. Verificar políticas RLS
\echo ''
\echo '2. VERIFICANDO POLÍTICAS RLS...'

SELECT
  tablename,
  COUNT(*) as num_policies,
  CASE
    WHEN COUNT(*) >= 2 THEN '✅ OK'
    ELSE '⚠️ Pocas políticas'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('job_postings', 'job_applications')
GROUP BY tablename
ORDER BY tablename;

-- 3. Verificar empresas y créditos
\echo ''
\echo '3. VERIFICANDO EMPRESAS...'

SELECT
  id,
  name,
  status,
  credit_balance,
  CASE
    WHEN status = 'APPROVED' AND credit_balance >= 30 THEN '✅ Puede publicar'
    WHEN status = 'APPROVED' AND credit_balance < 30 THEN '⚠️ Sin créditos suficientes'
    ELSE '❌ No aprobada'
  END as estado
FROM companies
ORDER BY created_at DESC
LIMIT 5;

-- 4. Verificar vacantes
\echo ''
\echo '4. VERIFICANDO VACANTES...'

SELECT
  status,
  COUNT(*) as cantidad
FROM job_postings
GROUP BY status
ORDER BY status;

-- 5. Verificar aplicaciones
\echo ''
\echo '5. VERIFICANDO APLICACIONES...'

SELECT
  COUNT(*) as total_aplicaciones,
  COUNT(DISTINCT company_id) as empresas_con_aplicaciones,
  COUNT(DISTINCT profile_id) as candidatos_unicos,
  ROUND(AVG(match_score), 0) as match_score_promedio
FROM job_applications;

-- 6. Test de lectura pública (esto NO debe fallar)
\echo ''
\echo '6. TESTEANDO ACCESO PÚBLICO...'

SELECT
  CASE
    WHEN COUNT(*) > 0 THEN '✅ Vacantes públicas accesibles: ' || COUNT(*)::text
    WHEN EXISTS (SELECT 1 FROM job_postings WHERE status = 'PUBLISHED') THEN '⚠️ Hay vacantes publicadas pero no son visibles públicamente'
    ELSE 'ℹ️ No hay vacantes publicadas aún'
  END as resultado
FROM job_postings
WHERE status = 'PUBLISHED';

-- 7. Verificar triggers de email
\echo ''
\echo '7. VERIFICANDO TRIGGERS DE EMAIL...'

SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  '✅' as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('on_new_job_application', 'on_application_status_change')
ORDER BY event_object_table, trigger_name;

-- 8. Verificar tabla de cola de emails
\echo ''
\echo '8. VERIFICANDO COLA DE EMAILS...'

SELECT
  CASE
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_queue')
    THEN '✅ Tabla email_queue existe'
    ELSE 'ℹ️ Tabla email_queue no existe (opcional)'
  END as resultado;

-- 9. Resumen final
\echo ''
\echo '9. RESUMEN FINAL...'
\echo ''

SELECT
  'Funciones RPC' as componente,
  (SELECT COUNT(*)::text FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name IN ('calculate_job_match_score', 'publish_job_posting', 'apply_to_job', 'update_application_status')
  ) || '/4' as estado,
  CASE
    WHEN (SELECT COUNT(*) FROM information_schema.routines
          WHERE routine_schema = 'public'
          AND routine_name IN ('calculate_job_match_score', 'publish_job_posting', 'apply_to_job', 'update_application_status')) = 4
    THEN '✅'
    ELSE '❌'
  END as status
UNION ALL
SELECT
  'Empresas aprobadas' as componente,
  COUNT(*)::text as estado,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END as status
FROM companies WHERE status = 'APPROVED'
UNION ALL
SELECT
  'Empresas con créditos' as componente,
  COUNT(*)::text as estado,
  CASE WHEN COUNT(*) > 0 THEN '✅' ELSE '⚠️' END as status
FROM companies WHERE status = 'APPROVED' AND credit_balance >= 30
UNION ALL
SELECT
  'Vacantes publicadas' as componente,
  COUNT(*)::text as estado,
  CASE
    WHEN COUNT(*) > 0 THEN '✅'
    ELSE 'ℹ️'
  END as status
FROM job_postings WHERE status = 'PUBLISHED'
UNION ALL
SELECT
  'Triggers de email' as componente,
  COUNT(*)::text || '/2' as estado,
  CASE
    WHEN COUNT(*) >= 2 THEN '✅'
    WHEN COUNT(*) = 1 THEN '⚠️'
    ELSE 'ℹ️'
  END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('on_new_job_application', 'on_application_status_change');

-- =====================================================
-- INSTRUCCIONES SEGÚN RESULTADOS
-- =====================================================
/*

INTERPRETACIÓN DE RESULTADOS:

❌ Si "Funciones RPC" muestra menos de 4:
   → Ejecuta: RPC_FUNCTIONS_TO_EXECUTE.sql

❌ Si hay errores como "companies_i_name does not exist":
   → Ejecuta: fix-all-job-tables-rls.sql

⚠️ Si "Empresas con créditos" es 0:
   → Opción A: Ejecuta quick-test-setup.sql (edita tu email primero)
   → Opción B: Crea empresa manualmente y dale créditos

ℹ️ Si "Vacantes publicadas" es 0:
   → Normal si es primera vez, puedes crear vacantes desde /company/jobs/new

ℹ️ Si "Triggers de email" es 0 o 1:
   → Ejecuta: setup-email-notifications.sql (opcional)

*/

-- =====================================================
-- SIGUIENTE PASO RECOMENDADO
-- =====================================================
\echo ''
\echo '====================='
\echo 'SIGUIENTE PASO:'
\echo '====================='
\echo ''
\echo 'Si todo tiene ✅:'
\echo '  → Puedes empezar a probar el sistema'
\echo '  → Ve a /company/jobs/new para crear una vacante'
\echo ''
\echo 'Si hay ❌:'
\echo '  → Lee las instrucciones arriba'
\echo '  → Ejecuta los scripts necesarios'
\echo '  → Vuelve a ejecutar esta verificación'
\echo ''
