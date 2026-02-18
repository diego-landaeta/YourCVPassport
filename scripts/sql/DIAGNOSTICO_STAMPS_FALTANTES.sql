-- ============================================================================
-- DIAGNÓSTICO: TUTORES ISEIH CON STAMPS FALTANTES
-- ============================================================================
-- Ejecutar en Supabase SQL Editor
-- Identifica qué tutores no tienen verificaciones (stamps)
-- ============================================================================

-- QUERY 1: RESUMEN - Stamps por tutor
SELECT
  '========== STAMPS POR TUTOR ==========' as section,
  p.full_name,
  p.email,
  p.gender,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') as total_stamps,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED' AND type = 'EMAIL') as email_stamp,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED' AND type = 'IDENTITY') as identity_stamp,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED' AND type = 'EDUCATION') as education_stamp,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED' AND type = 'EMPLOYMENT') as employment_stamp,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED' AND type = 'LANGUAGE') as language_stamp,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED' AND type = 'CERTIFICATION') as certification_stamps,
  CASE
    WHEN (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') = 0 THEN '❌ SIN STAMPS'
    WHEN (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') < 5 THEN '⚠️ INCOMPLETO'
    ELSE '✅ OK'
  END as status
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
  AND p.role = 'professional'
ORDER BY total_stamps ASC, p.full_name;

-- QUERY 2: TUTORES SIN NINGÚN STAMP
SELECT
  '========== TUTORES SIN STAMPS ==========' as section,
  p.full_name,
  p.email,
  p.id as uuid,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certifications_disponibles,
  (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiences_count,
  (SELECT COUNT(*) FROM education WHERE profile_id = p.id) as education_count
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
  AND p.role = 'professional'
  AND NOT EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED')
ORDER BY p.full_name;

-- QUERY 3: TUTORES CON STAMPS INCOMPLETOS (tienen algunos pero no todos los básicos)
SELECT
  '========== STAMPS INCOMPLETOS ==========' as section,
  p.full_name,
  p.email,
  CASE WHEN EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND type = 'EMAIL' AND status = 'VERIFIED') THEN '✅' ELSE '❌' END as email,
  CASE WHEN EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND type = 'IDENTITY' AND status = 'VERIFIED') THEN '✅' ELSE '❌' END as identity,
  CASE WHEN EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND type = 'EDUCATION' AND status = 'VERIFIED') THEN '✅' ELSE '❌' END as education,
  CASE WHEN EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND type = 'EMPLOYMENT' AND status = 'VERIFIED') THEN '✅' ELSE '❌' END as employment,
  CASE WHEN EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND type = 'LANGUAGE' AND status = 'VERIFIED') THEN '✅' ELSE '❌' END as language,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND type = 'CERTIFICATION' AND status = 'VERIFIED') as cert_stamps,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as cert_total,
  CASE
    WHEN (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND type = 'CERTIFICATION' AND status = 'VERIFIED') <
         (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION')
    THEN '⚠️ Faltan cert stamps'
    ELSE '✅'
  END as cert_status
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
  AND p.role = 'professional'
  AND (
    NOT EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND type = 'EMAIL' AND status = 'VERIFIED')
    OR NOT EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND type = 'IDENTITY' AND status = 'VERIFIED')
    OR NOT EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND type = 'EDUCATION' AND status = 'VERIFIED')
    OR NOT EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND type = 'EMPLOYMENT' AND status = 'VERIFIED')
    OR NOT EXISTS (SELECT 1 FROM stamps WHERE profile_id = p.id AND type = 'LANGUAGE' AND status = 'VERIFIED')
    OR (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND type = 'CERTIFICATION' AND status = 'VERIFIED') <
       (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION')
  )
ORDER BY p.full_name;

-- QUERY 4: RESUMEN ESTADÍSTICO
SELECT
  '========== RESUMEN ==========' as section,
  COUNT(*) as total_tutores,
  COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM stamps s WHERE s.profile_id = p.id AND s.status = 'VERIFIED') = 0) as sin_stamps,
  COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM stamps s WHERE s.profile_id = p.id AND s.status = 'VERIFIED') BETWEEN 1 AND 4) as stamps_incompletos,
  COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM stamps s WHERE s.profile_id = p.id AND s.status = 'VERIFIED') >= 5) as stamps_ok,
  COUNT(*) FILTER (WHERE p.gender IS NULL) as sin_gender
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
  AND p.role = 'professional';
