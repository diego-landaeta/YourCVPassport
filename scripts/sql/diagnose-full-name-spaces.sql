-- ========================================
-- DIAGNÓSTICO: Problema con espacios múltiples en full_name
-- ========================================
-- Este script diagnostica por qué full_name solo permite un espacio

-- 1. Ver todos los constraints en la columna full_name
SELECT
  '═══ CONSTRAINTS EN PROFILES.FULL_NAME ═══' AS info,
  conname AS constraint_name,
  contype AS constraint_type,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname LIKE '%full_name%'
ORDER BY conname;

-- 2. Ver todos los triggers en la tabla profiles
SELECT
  '═══ TRIGGERS EN PROFILES ═══' AS info,
  t.tgname AS trigger_name,
  CASE t.tgtype::int & 66
    WHEN 2 THEN 'BEFORE'
    WHEN 64 THEN 'INSTEAD OF'
    ELSE 'AFTER'
  END AS timing,
  CASE
    WHEN (t.tgtype::int & 4) > 0 AND (t.tgtype::int & 16) > 0 THEN 'INSERT OR UPDATE'
    WHEN (t.tgtype::int & 4) > 0 THEN 'INSERT'
    WHEN (t.tgtype::int & 16) > 0 THEN 'UPDATE'
    WHEN (t.tgtype::int & 8) > 0 THEN 'DELETE'
    ELSE 'OTHER'
  END AS events,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE t.tgrelid = 'public.profiles'::regclass
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- 3. Ver funciones que podrían estar modificando full_name
SELECT
  '═══ FUNCIONES QUE REFERENCIAN FULL_NAME ═══' AS info,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS arguments,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE pg_get_functiondef(p.oid) ILIKE '%full_name%'
  AND n.nspname = 'public'
ORDER BY p.proname;

-- 4. Test de inserción con espacios múltiples
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  test_name_one_space text := 'Juan Pérez';
  test_name_two_spaces text := 'Juan  Pérez';  -- Dos espacios
  test_name_three_spaces text := 'Juan   Pérez';  -- Tres espacios
  result_name text;
BEGIN
  -- Test 1: Un espacio (debería funcionar)
  BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, plan)
    VALUES (test_user_id, test_name_one_space, 'test-one-space@test.com', 'professional', 'Free')
    RETURNING full_name INTO result_name;

    IF result_name = test_name_one_space THEN
      RAISE NOTICE '✅ Test 1 PASSED: Un espacio guardado correctamente: "%"', result_name;
    ELSE
      RAISE WARNING '❌ Test 1 FAILED: Esperado "%" pero se guardó "%"', test_name_one_space, result_name;
    END IF;

    DELETE FROM public.profiles WHERE id = test_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Test 1 FAILED con error: %', SQLERRM;
    DELETE FROM public.profiles WHERE id = test_user_id;
  END;

  -- Test 2: Dos espacios
  test_user_id := gen_random_uuid();
  BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, plan)
    VALUES (test_user_id, test_name_two_spaces, 'test-two-spaces@test.com', 'professional', 'Free')
    RETURNING full_name INTO result_name;

    IF result_name = test_name_two_spaces THEN
      RAISE NOTICE '✅ Test 2 PASSED: Dos espacios guardados correctamente: "%"', result_name;
    ELSE
      RAISE WARNING '❌ Test 2 FAILED: Esperado "%" pero se guardó "%"', test_name_two_spaces, result_name;
    END IF;

    DELETE FROM public.profiles WHERE id = test_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Test 2 FAILED con error: %', SQLERRM;
    DELETE FROM public.profiles WHERE id = test_user_id;
  END;

  -- Test 3: Tres espacios
  test_user_id := gen_random_uuid();
  BEGIN
    INSERT INTO public.profiles (id, full_name, email, role, plan)
    VALUES (test_user_id, test_name_three_spaces, 'test-three-spaces@test.com', 'professional', 'Free')
    RETURNING full_name INTO result_name;

    IF result_name = test_name_three_spaces THEN
      RAISE NOTICE '✅ Test 3 PASSED: Tres espacios guardados correctamente: "%"', result_name;
    ELSE
      RAISE WARNING '❌ Test 3 FAILED: Esperado "%" pero se guardó "%"', test_name_three_spaces, result_name;
    END IF;

    DELETE FROM public.profiles WHERE id = test_user_id;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '❌ Test 3 FAILED con error: %', SQLERRM;
    DELETE FROM public.profiles WHERE id = test_user_id;
  END;

END $$;

-- 5. Mostrar perfiles existentes con múltiples espacios
SELECT
  '═══ PERFILES CON ESPACIOS MÚLTIPLES ═══' AS info,
  id,
  full_name,
  LENGTH(full_name) AS length,
  LENGTH(REGEXP_REPLACE(full_name, '\s+', ' ', 'g')) AS length_if_normalized,
  CASE
    WHEN full_name ~ '\s{2,}' THEN 'SÍ (tiene espacios múltiples)'
    ELSE 'NO (solo espacios simples)'
  END AS has_multiple_spaces
FROM public.profiles
WHERE full_name IS NOT NULL
LIMIT 10;
