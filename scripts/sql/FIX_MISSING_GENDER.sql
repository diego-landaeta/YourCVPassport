-- ============================================================================
-- FIX MISSING GENDER FOR ISEIH TUTORS
-- ============================================================================
-- Step 1: Diagnose which tutors are missing gender
-- Step 2: Update based on known names
-- ============================================================================

-- STEP 1: DIAGNÓSTICO - Ver tutores sin género
SELECT
  p.full_name,
  p.email,
  p.gender,
  CASE
    WHEN p.gender IS NULL THEN '❌ MISSING'
    ELSE '✅ ' || p.gender
  END as gender_status
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
ORDER BY p.gender NULLS FIRST, p.full_name;

-- STEP 2: CORREGIR - Asignar género basado en nombres
-- Female names
UPDATE profiles SET gender = 'female' WHERE email LIKE '%@iseih.edu' AND gender IS NULL AND (
  full_name ILIKE 'Sarah%' OR
  full_name ILIKE 'Emily%' OR
  full_name ILIKE 'Jennifer%' OR
  full_name ILIKE 'Lisa%' OR
  full_name ILIKE 'Rachel%' OR
  full_name ILIKE 'Nicole%' OR
  full_name ILIKE 'Rebecca%' OR
  full_name ILIKE 'Priya%' OR
  full_name ILIKE 'Patricia%' OR
  full_name ILIKE 'Michelle%' OR
  full_name ILIKE 'Maria%' OR
  full_name ILIKE 'Margaret%' OR
  full_name ILIKE 'Linda%' OR
  full_name ILIKE 'Karen%' OR
  full_name ILIKE 'Jessica%' OR
  full_name ILIKE 'Janet%' OR
  full_name ILIKE 'Elizabeth%' OR
  full_name ILIKE 'Diana%' OR
  full_name ILIKE 'Catherine%' OR
  full_name ILIKE 'Angela%' OR
  full_name ILIKE 'Amanda%'
);

-- Male names
UPDATE profiles SET gender = 'male' WHERE email LIKE '%@iseih.edu' AND gender IS NULL AND (
  full_name ILIKE 'James%' OR
  full_name ILIKE 'David%' OR
  full_name ILIKE 'Michael%' OR
  full_name ILIKE 'Robert%' OR
  full_name ILIKE 'Marcus%' OR
  full_name ILIKE 'Christopher%' OR
  full_name ILIKE 'Thomas%' OR
  full_name ILIKE 'Steven%' OR
  full_name ILIKE 'Richard%' OR
  full_name ILIKE 'Paul%' OR
  full_name ILIKE 'Mark%' OR
  full_name ILIKE 'Kevin%' OR
  full_name ILIKE 'Daniel%' OR
  full_name ILIKE 'Brian%' OR
  full_name ILIKE 'Alex%'
);

-- STEP 3: VERIFICAR - Confirmar que todos tienen género
SELECT
  p.full_name,
  p.gender,
  CASE
    WHEN p.gender IS NULL THEN '❌ STILL MISSING'
    ELSE '✅ ' || p.gender
  END as status
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
ORDER BY p.gender NULLS FIRST, p.full_name;
