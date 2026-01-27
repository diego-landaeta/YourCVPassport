-- ========================================
-- MIGRATION: Add Length Constraints to Name and Headline
-- Date: 2026-01-09
-- ========================================
-- PROPÓSITO:
--   Agregar constraints de longitud máxima a full_name y headline
--   para prevenir que se guarden valores muy largos
-- ========================================

-- ========================================
-- PASO 1: Agregar constraint a full_name
-- ========================================
-- Máximo 50 caracteres para el nombre completo

-- Primero, verificar si hay datos que excedan el límite
SELECT
  '═══ VERIFICACIÓN PRE-CONSTRAINT ═══' AS info,
  COUNT(*) FILTER (WHERE LENGTH(full_name) > 50) AS nombres_muy_largos,
  COUNT(*) FILTER (WHERE LENGTH(headline) > 150) AS headlines_muy_largos
FROM public.profiles;

-- Limpiar datos que excedan el límite (truncar a 50 caracteres)
UPDATE public.profiles
SET full_name = LEFT(full_name, 50)
WHERE LENGTH(full_name) > 50;

-- Limpiar headlines que excedan el límite (truncar a 150 caracteres)
UPDATE public.profiles
SET headline = LEFT(headline, 150)
WHERE LENGTH(headline) > 150;

-- Agregar constraint a full_name
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS full_name_length_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT full_name_length_check
  CHECK (LENGTH(full_name) <= 50);

-- ========================================
-- PASO 2: Agregar constraint a headline
-- ========================================
-- Máximo 150 caracteres para el título profesional

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS headline_length_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT headline_length_check
  CHECK (LENGTH(headline) <= 150);

-- ========================================
-- PASO 3: Verificación
-- ========================================

-- Mostrar constraints creados
SELECT
  '═══ CONSTRAINTS CREADOS ═══' AS info,
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND conname IN ('full_name_length_check', 'headline_length_check');

-- Test de inserción - Intentar insertar nombre muy largo (debe fallar)
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  long_name text := REPEAT('A', 51);  -- 51 caracteres (excede el límite)
  test_succeeded boolean := false;
BEGIN
  BEGIN
    -- Intentar insertar con nombre muy largo
    INSERT INTO public.profiles (id, full_name, email, role, plan)
    VALUES (test_user_id, long_name, 'test@example.com', 'professional', 'Free');

    test_succeeded := true;
  EXCEPTION
    WHEN check_violation THEN
      RAISE NOTICE '✅ CORRECTO: Constraint bloqueó nombre muy largo (51 caracteres)';
  END;

  IF test_succeeded THEN
    RAISE WARNING '❌ ERROR: El constraint NO bloqueó el nombre muy largo!';
    -- Limpiar
    DELETE FROM public.profiles WHERE id = test_user_id;
  END IF;
END $$;

-- Test de inserción válida - Debe funcionar
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
  valid_name text := 'Juan Pérez García';  -- 18 caracteres (válido)
  valid_headline text := 'Senior Software Engineer specialized in React';  -- 48 caracteres (válido)
BEGIN
  -- Insertar con valores válidos
  INSERT INTO public.profiles (id, full_name, headline, email, role, plan)
  VALUES (test_user_id, valid_name, valid_headline, 'test-valid@example.com', 'professional', 'Free');

  RAISE NOTICE '✅ CORRECTO: Valores válidos insertados correctamente';

  -- Limpiar
  DELETE FROM public.profiles WHERE id = test_user_id;
END $$;

-- ========================================
-- DOCUMENTACIÓN
-- ========================================

COMMENT ON CONSTRAINT full_name_length_check ON public.profiles IS
'Asegura que el nombre completo no exceda 50 caracteres.
Previene nombres excesivamente largos que podrían causar problemas de UI.';

COMMENT ON CONSTRAINT headline_length_check ON public.profiles IS
'Asegura que el título profesional no exceda 150 caracteres.
Previene títulos excesivamente largos que podrían causar problemas de UI.';

-- ========================================
-- RESULTADO ESPERADO
-- ========================================
-- ✅ full_name: máximo 50 caracteres
-- ✅ headline: máximo 150 caracteres
-- ✅ Base de datos rechaza intentos de insertar/actualizar valores que excedan estos límites
-- ✅ Frontend ya tiene validación (maxLength en inputs + validación Zod)
-- ✅ Doble protección: cliente + servidor
-- ========================================
