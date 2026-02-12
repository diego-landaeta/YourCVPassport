-- =====================================================
-- SETUP COMPLETO DE USUARIOS DEMO CON CERTIFICACIONES
-- =====================================================
-- Este script configura 3 usuarios demo con:
-- 1. Stamps de verificación (EMAIL, IDENTITY, EDUCATION, EMPLOYMENT, LANGUAGE)
-- 2. Certificaciones profesionales relevantes
-- 3. Stamps de verificación de certificaciones (CERTIFICATION)
-- =====================================================
-- USUARIOS:
-- - Marta Ruiz Serrano (Ingeniera de Energías Renovables)
-- - Javier Torres Gimeno (Ingeniero Industrial HVAC)
-- - Laura Martínez Vidal (Arquitecto Técnico)
-- =====================================================

\echo ''
\echo '🚀 INICIANDO SETUP DE USUARIOS DEMO'
\echo ''

\echo '======================================================'
\echo 'PASO 0: Verificar Migraciones Requeridas'
\echo '======================================================'

-- Ejecutar verificación de migraciones
\i 00_VERIFICAR_MIGRACIONES.sql

\echo ''
\echo '======================================================'
\echo 'PASO 1: Agregar Stamps de Verificación Básicos'
\echo '======================================================'

-- Marta Ruiz Serrano - Stamps básicos
\i update-marta-complete-stamps.sql

-- Javier Torres Gimeno - Stamps básicos
\i update-javier-complete-stamps.sql

-- Laura Martínez Vidal - Stamps básicos
\i update-laura-complete-stamps.sql

\echo ''
\echo '======================================================'
\echo 'PASO 2: Agregar Certificaciones Profesionales'
\echo '======================================================'

-- Agregar certificaciones y sus stamps de verificación
\i add-certifications-demo-users.sql

\echo ''
\echo '======================================================'
\echo 'RESUMEN FINAL - VERIFICACIÓN'
\echo '======================================================'

-- Resumen completo por usuario
SELECT
  '📊 RESUMEN POR USUARIO' as seccion,
  p.full_name as nombre,
  p.headline as profesion,
  COUNT(DISTINCT s.id) as total_stamps,
  COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'VERIFIED') as stamps_verificados,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'CERTIFICATION') as certificaciones
FROM profiles p
LEFT JOIN stamps s ON s.profile_id = p.id
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id AND pi.type = 'CERTIFICATION'
WHERE p.id IN (
  'e379dca2-0b33-45b4-864a-ba9204e0ab4b',  -- Marta
  'a826c47c-0d50-47da-aab3-4dfb71da709d',  -- Javier
  'bb6fad0f-0973-4e9a-abfc-dbaf7bd6100e'   -- Laura
)
GROUP BY p.id, p.full_name, p.headline
ORDER BY p.full_name;

\echo ''
\echo '✅ SETUP COMPLETADO EXITOSAMENTE'
\echo ''
