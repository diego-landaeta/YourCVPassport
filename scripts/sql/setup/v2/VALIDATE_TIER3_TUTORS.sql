-- ============================================================================
-- VALIDATION SCRIPT - ASSESS 16 TIER 3 TUTORS
-- ============================================================================
-- Evalúa el estado actual de cada perfil para categorizar como:
--   TIER 1 (incomplete): Necesita achievements, projects, collaborations, stamps
--   TIER 2 (needs enhancement): Tiene estructura pero summary/headline débil
-- ============================================================================

-- Query 1: RESUMEN GENERAL
SELECT
  '========== TIER 3 TUTORS - GENERAL OVERVIEW ==========' as section,
  p.full_name,
  p.email,
  p.gender,
  LENGTH(p.headline) as headline_len,
  LENGTH(p.summary) as summary_len,
  (SELECT COUNT(*) FROM experiences WHERE profile_id = p.id) as experiences_count,
  (SELECT COUNT(*) FROM skills WHERE profile_id = p.id) as skills_count,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'CERTIFICATION') as certs_count,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'PROJECT') as projects_count,
  (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'COLLABORATION') as collabs_count,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') as stamps_count
FROM profiles p
WHERE p.email IN (
  'amanda.rodriguez@iseih.edu',
  'angela.roberts@iseih.edu',
  'brian.cooper@iseih.edu',
  'christopher.barnes@iseih.edu',
  'daniel.foster@iseih.edu',
  'elizabeth.morgan@iseih.edu',
  'janet.lee@iseih.edu',
  'kevin.park@iseih.edu',
  'linda.zhang@iseih.edu',
  'margaret.sullivan@iseih.edu',
  'maria.gonzalez@iseih.edu',
  'patricia.coleman@iseih.edu',
  'priya.sharma@iseih.edu',
  'richard.hamilton@iseih.edu',
  'steven.mitchell@iseih.edu',
  'thomas.rivera@iseih.edu'
)
ORDER BY p.full_name;

-- Query 2: ACHIEVEMENTS STATUS (¿Las experiencias tienen achievements arrays?)
SELECT
  '========== EXPERIENCES WITH ACHIEVEMENTS ==========' as section,
  p.full_name,
  e.company_name,
  e.position,
  CASE
    WHEN e.achievements IS NULL THEN 'NO ACHIEVEMENTS'
    WHEN array_length(e.achievements, 1) IS NULL THEN 'EMPTY ARRAY'
    ELSE array_length(e.achievements, 1)::text || ' achievements'
  END as achievements_status
FROM profiles p
JOIN experiences e ON e.profile_id = p.id
WHERE p.email IN (
  'amanda.rodriguez@iseih.edu','angela.roberts@iseih.edu','brian.cooper@iseih.edu',
  'christopher.barnes@iseih.edu','daniel.foster@iseih.edu','elizabeth.morgan@iseih.edu',
  'janet.lee@iseih.edu','kevin.park@iseih.edu','linda.zhang@iseih.edu',
  'margaret.sullivan@iseih.edu','maria.gonzalez@iseih.edu','patricia.coleman@iseih.edu',
  'priya.sharma@iseih.edu','richard.hamilton@iseih.edu','steven.mitchell@iseih.edu',
  'thomas.rivera@iseih.edu'
)
ORDER BY p.full_name, e.sort_order;

-- Query 3: CATEGORIZACIÓN (Tier 1 vs Tier 2)
SELECT * FROM (
  SELECT
    '========== TIER CATEGORIZATION ==========' as section,
    p.full_name,
    p.email,
    CASE
      -- TIER 1: Falta estructura fundamental
      WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'PROJECT') = 0 THEN 'TIER 1 - INCOMPLETE'
      WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'COLLABORATION') = 0 THEN 'TIER 1 - INCOMPLETE'
      WHEN (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') = 0 THEN 'TIER 1 - INCOMPLETE'
      WHEN NOT EXISTS (
        SELECT 1 FROM experiences
        WHERE profile_id = p.id
        AND achievements IS NOT NULL
        AND array_length(achievements, 1) > 0
      ) THEN 'TIER 1 - INCOMPLETE'
      -- TIER 2: Tiene estructura pero necesita enhancement
      WHEN p.gender IS NULL THEN 'TIER 2 - NEEDS ENHANCEMENT (missing gender)'
      WHEN LENGTH(p.summary) < 500 THEN 'TIER 2 - NEEDS ENHANCEMENT (summary too short)'
      WHEN LENGTH(p.headline) < 20 THEN 'TIER 2 - NEEDS ENHANCEMENT (headline too short)'
      ELSE 'COMPLETE - NO ACTION NEEDED'
    END as tier_status,
    LENGTH(p.summary) as summary_chars,
    p.gender as gender_set
  FROM profiles p
  WHERE p.email IN (
    'amanda.rodriguez@iseih.edu','angela.roberts@iseih.edu','brian.cooper@iseih.edu',
    'christopher.barnes@iseih.edu','daniel.foster@iseih.edu','elizabeth.morgan@iseih.edu',
    'janet.lee@iseih.edu','kevin.park@iseih.edu','linda.zhang@iseih.edu',
    'margaret.sullivan@iseih.edu','maria.gonzalez@iseih.edu','patricia.coleman@iseih.edu',
    'priya.sharma@iseih.edu','richard.hamilton@iseih.edu','steven.mitchell@iseih.edu',
    'thomas.rivera@iseih.edu'
  )
) sub
ORDER BY
  CASE
    WHEN tier_status LIKE 'TIER 1%' THEN 1
    WHEN tier_status LIKE 'TIER 2%' THEN 2
    ELSE 3
  END,
  full_name;

-- Query 4: SUMMARY DE ACCIONES REQUERIDAS
SELECT
  '========== ACTION SUMMARY ==========' as section,
  COUNT(*) FILTER (WHERE tier_status LIKE 'TIER 1%') as tier1_count,
  COUNT(*) FILTER (WHERE tier_status LIKE 'TIER 2%') as tier2_count,
  COUNT(*) FILTER (WHERE tier_status = 'COMPLETE - NO ACTION NEEDED') as complete_count,
  COUNT(*) as total_tutors
FROM (
  SELECT
    CASE
      WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'PROJECT') = 0 THEN 'TIER 1 - INCOMPLETE'
      WHEN (SELECT COUNT(*) FROM portfolio_items WHERE profile_id = p.id AND type = 'COLLABORATION') = 0 THEN 'TIER 1 - INCOMPLETE'
      WHEN (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') = 0 THEN 'TIER 1 - INCOMPLETE'
      WHEN NOT EXISTS (SELECT 1 FROM experiences WHERE profile_id = p.id AND achievements IS NOT NULL AND array_length(achievements, 1) > 0) THEN 'TIER 1 - INCOMPLETE'
      WHEN p.gender IS NULL THEN 'TIER 2 - NEEDS ENHANCEMENT'
      WHEN LENGTH(p.summary) < 500 THEN 'TIER 2 - NEEDS ENHANCEMENT'
      WHEN LENGTH(p.headline) < 20 THEN 'TIER 2 - NEEDS ENHANCEMENT'
      ELSE 'COMPLETE - NO ACTION NEEDED'
    END as tier_status
  FROM profiles p
  WHERE p.email IN (
    'amanda.rodriguez@iseih.edu','angela.roberts@iseih.edu','brian.cooper@iseih.edu',
    'christopher.barnes@iseih.edu','daniel.foster@iseih.edu','elizabeth.morgan@iseih.edu',
    'janet.lee@iseih.edu','kevin.park@iseih.edu','linda.zhang@iseih.edu',
    'margaret.sullivan@iseih.edu','maria.gonzalez@iseih.edu','patricia.coleman@iseih.edu',
    'priya.sharma@iseih.edu','richard.hamilton@iseih.edu','steven.mitchell@iseih.edu',
    'thomas.rivera@iseih.edu'
  )
) sub;
