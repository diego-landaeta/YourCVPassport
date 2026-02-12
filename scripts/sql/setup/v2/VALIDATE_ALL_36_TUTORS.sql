-- ============================================================================
-- VALIDATION SCRIPT - VERIFY ALL 36 ISEIH TUTORS
-- ============================================================================
-- Verifica que todos los tutores tengan contenido completo y de calidad
-- ============================================================================

-- Query 1: RESUMEN GENERAL DE LOS 36 TUTORES
SELECT
  '========== GENERAL OVERVIEW - ALL 36 TUTORS ==========' as section,
  p.full_name,
  p.email,
  p.role,
  p.gender,
  LENGTH(p.headline) as headline_len,
  LENGTH(p.summary) as summary_chars,
  (LENGTH(p.summary) - LENGTH(REPLACE(p.summary, ' ', '')) + 1) as summary_words,
  (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiences_count,
  (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills_count,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs_count,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'PROJECT') as projects_count,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'COLLABORATION') as collabs_count,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') as stamps_count
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
ORDER BY p.full_name;

-- Query 2: VERIFICAR ACHIEVEMENTS EN EXPERIENCIAS
SELECT
  '========== EXPERIENCES WITH ACHIEVEMENTS ==========' as section,
  p.full_name,
  e.position,
  CASE
    WHEN e.achievements IS NULL THEN '❌ NO ACHIEVEMENTS'
    WHEN array_length(e.achievements, 1) IS NULL THEN '❌ EMPTY ARRAY'
    ELSE '✅ ' || array_length(e.achievements, 1)::text || ' achievements'
  END as achievements_status
FROM profiles p
JOIN experiences e ON e.profile_id = p.id
WHERE p.email LIKE '%@iseih.edu'
ORDER BY p.full_name, e.sort_order;

-- Query 3: QUALITY CHECKS - IDENTIFICAR PROBLEMAS
SELECT * FROM (
  SELECT
    '========== QUALITY CHECKS ==========' as section,
    p.full_name,
    p.email,
    CASE
      -- Critical issues
      WHEN p.gender IS NULL THEN '❌ CRITICAL: Missing gender'
      WHEN LENGTH(p.summary) < 500 THEN '⚠️ WARNING: Summary too short (' || LENGTH(p.summary) || ' chars)'
      WHEN LENGTH(p.headline) < 15 THEN '⚠️ WARNING: Headline too short (' || LENGTH(p.headline) || ' chars)'
      WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'PROJECT') < 2 THEN '⚠️ WARNING: Less than 2 projects'
      WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'COLLABORATION') < 1 THEN '⚠️ WARNING: No collaborations'
      WHEN (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') < 5 THEN '⚠️ WARNING: Less than 5 stamps'
      WHEN NOT EXISTS (
        SELECT 1 FROM experiences
        WHERE profile_id = p.id
        AND achievements IS NOT NULL
        AND array_length(achievements, 1) > 0
      ) THEN '❌ CRITICAL: No achievements in experiences'
      ELSE '✅ COMPLETE'
    END as status,
    LENGTH(p.summary) as summary_chars,
    (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') as stamps
  FROM profiles p
  WHERE p.email LIKE '%@iseih.edu'
) sub
WHERE status != '✅ COMPLETE'
ORDER BY
  CASE
    WHEN status LIKE '❌%' THEN 1
    WHEN status LIKE '⚠️%' THEN 2
    ELSE 3
  END,
  full_name;

-- Query 4: SUMMARY STATISTICS
SELECT
  '========== SUMMARY STATISTICS ==========' as section,
  COUNT(*) as total_tutors,
  COUNT(*) FILTER (WHERE gender IS NOT NULL) as with_gender,
  COUNT(*) FILTER (WHERE LENGTH(summary) >= 500) as good_summary_length,
  COUNT(*) FILTER (WHERE LENGTH(headline) >= 15) as good_headline_length,
  COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM portfolio_items pi WHERE pi.profile_id = p.id AND pi.type = 'PROJECT') >= 2) as with_2plus_projects,
  COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM portfolio_items pi WHERE pi.profile_id = p.id AND pi.type = 'COLLABORATION') >= 1) as with_1plus_collabs,
  COUNT(*) FILTER (WHERE (SELECT COUNT(*) FROM stamps s WHERE s.profile_id = p.id AND s.status = 'VERIFIED') >= 5) as with_5plus_stamps,
  COUNT(*) FILTER (WHERE EXISTS (
    SELECT 1 FROM experiences e
    WHERE e.profile_id = p.id
    AND e.achievements IS NOT NULL
    AND array_length(e.achievements, 1) > 0
  )) as with_achievements
FROM profiles p
WHERE p.email LIKE '%@iseih.edu';

-- Query 5: TUTORS BY TIER
SELECT
  '========== TUTORS BY COMPLETION TIER ==========' as section,
  CASE
    WHEN p.email IN (
      'james.wilson@iseih.edu','sarah.bennett@iseih.edu','emily.harper@iseih.edu',
      'david.chen@iseih.edu','lisa.morrison@iseih.edu','robert.green@iseih.edu',
      'marcus.williams@iseih.edu','jennifer.martinez@iseih.edu','rachel.stevens@iseih.edu',
      'michael.thompson@iseih.edu'
    ) THEN 'TIER 2 (Enhanced)'
    WHEN p.email IN (
      'rebecca.anderson@iseih.edu','karen.white@iseih.edu','paul.henderson@iseih.edu',
      'jessica.porter@iseih.edu','alex.martinez@iseih.edu','diana.russell@iseih.edu',
      'michelle.chang@iseih.edu','robert.kim@iseih.edu','catherine.adams@iseih.edu',
      'mark.davidson@iseih.edu'
    ) THEN 'TIER 1 Phase 2B (Complete)'
    WHEN p.email IN (
      'amanda.rodriguez@iseih.edu','angela.roberts@iseih.edu','brian.cooper@iseih.edu',
      'christopher.barnes@iseih.edu','daniel.foster@iseih.edu','elizabeth.morgan@iseih.edu',
      'janet.lee@iseih.edu','kevin.park@iseih.edu','linda.zhang@iseih.edu',
      'margaret.sullivan@iseih.edu','maria.gonzalez@iseih.edu','patricia.coleman@iseih.edu',
      'priya.sharma@iseih.edu','richard.hamilton@iseih.edu','steven.mitchell@iseih.edu',
      'thomas.rivera@iseih.edu'
    ) THEN 'TIER 3 (Complete)'
    ELSE 'UNKNOWN TIER'
  END as tier,
  p.full_name,
  p.email,
  LENGTH(p.summary) as summary_chars,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') as stamps
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
ORDER BY tier, p.full_name;

-- Query 6: VERIFICAR STAMPS POR TIPO
SELECT
  '========== STAMPS BY TYPE ==========' as section,
  s.type,
  COUNT(*) as total_stamps,
  COUNT(DISTINCT s.profile_id) as tutors_with_this_stamp
FROM stamps s
JOIN profiles p ON p.id = s.profile_id
WHERE p.email LIKE '%@iseih.edu'
  AND s.status = 'VERIFIED'
GROUP BY s.type
ORDER BY s.type;
