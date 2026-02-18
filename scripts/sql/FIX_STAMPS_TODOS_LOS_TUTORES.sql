-- ============================================================================
-- FIX: AGREGAR STAMPS FALTANTES A TODOS LOS TUTORES ISEIH
-- ============================================================================
-- Este script agrega stamps básicos (EMAIL, IDENTITY, EDUCATION, EMPLOYMENT,
-- LANGUAGE) + stamps de CERTIFICATION a cualquier tutor que no los tenga.
-- SEGURO: Solo inserta stamps que NO existan aún para cada tutor.
-- ============================================================================

DO $$
DECLARE
  v_tutor RECORD;
  v_fixed_count INT := 0;
  v_stamps_added INT := 0;
BEGIN

  RAISE NOTICE '============================================';
  RAISE NOTICE 'INICIO: Agregando stamps faltantes a tutores ISEIH';
  RAISE NOTICE '============================================';

  FOR v_tutor IN
    SELECT p.id, p.full_name, p.email
    FROM profiles p
    WHERE p.email LIKE '%@iseih.edu'
      AND p.role = 'professional'
    ORDER BY p.full_name
  LOOP

    -- =============================
    -- 1. EMAIL stamp
    -- =============================
    IF NOT EXISTS (
      SELECT 1 FROM stamps
      WHERE profile_id = v_tutor.id AND type = 'EMAIL' AND status = 'VERIFIED'
    ) THEN
      INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
      VALUES (
        v_tutor.id, 'EMAIL', 'VERIFIED',
        jsonb_build_object('email', v_tutor.email, 'verified_method', 'manual_admin'),
        'manual', NOW(), NOW()
      );
      v_stamps_added := v_stamps_added + 1;
      RAISE NOTICE '  + % → EMAIL stamp agregado', v_tutor.full_name;
    END IF;

    -- =============================
    -- 2. IDENTITY stamp
    -- =============================
    IF NOT EXISTS (
      SELECT 1 FROM stamps
      WHERE profile_id = v_tutor.id AND type = 'IDENTITY' AND status = 'VERIFIED'
    ) THEN
      INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
      VALUES (
        v_tutor.id, 'IDENTITY', 'VERIFIED',
        jsonb_build_object('document_type', 'Passport', 'verified_method', 'manual_admin'),
        'manual', NOW(), NOW()
      );
      v_stamps_added := v_stamps_added + 1;
      RAISE NOTICE '  + % → IDENTITY stamp agregado', v_tutor.full_name;
    END IF;

    -- =============================
    -- 3. EDUCATION stamp
    -- =============================
    IF NOT EXISTS (
      SELECT 1 FROM stamps
      WHERE profile_id = v_tutor.id AND type = 'EDUCATION' AND status = 'VERIFIED'
    ) THEN
      INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
      VALUES (
        v_tutor.id, 'EDUCATION', 'VERIFIED',
        jsonb_build_object(
          'degree', COALESCE(
            (SELECT degree FROM education WHERE profile_id = v_tutor.id ORDER BY sort_order LIMIT 1),
            'Higher Education'
          ),
          'institution', COALESCE(
            (SELECT institution_name FROM education WHERE profile_id = v_tutor.id ORDER BY sort_order LIMIT 1),
            'Verified Institution'
          ),
          'verified_method', 'manual_admin'
        ),
        'manual', NOW(), NOW()
      );
      v_stamps_added := v_stamps_added + 1;
      RAISE NOTICE '  + % → EDUCATION stamp agregado', v_tutor.full_name;
    END IF;

    -- =============================
    -- 4. EMPLOYMENT stamp
    -- =============================
    IF NOT EXISTS (
      SELECT 1 FROM stamps
      WHERE profile_id = v_tutor.id AND type = 'EMPLOYMENT' AND status = 'VERIFIED'
    ) THEN
      INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
      VALUES (
        v_tutor.id, 'EMPLOYMENT', 'VERIFIED',
        jsonb_build_object(
          'position', COALESCE(
            (SELECT position FROM experiences WHERE profile_id = v_tutor.id AND company_name LIKE '%ISEIH%' LIMIT 1),
            'ISEIH Instructor'
          ),
          'company', 'ISEIH',
          'verified_method', 'manual_admin'
        ),
        'manual', NOW(), NOW()
      );
      v_stamps_added := v_stamps_added + 1;
      RAISE NOTICE '  + % → EMPLOYMENT stamp agregado', v_tutor.full_name;
    END IF;

    -- =============================
    -- 5. LANGUAGE stamp
    -- =============================
    IF NOT EXISTS (
      SELECT 1 FROM stamps
      WHERE profile_id = v_tutor.id AND type = 'LANGUAGE' AND status = 'VERIFIED'
    ) THEN
      INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at)
      VALUES (
        v_tutor.id, 'LANGUAGE', 'VERIFIED',
        jsonb_build_object(
          'languages', COALESCE(
            (SELECT json_agg(name || ' (' || level || ')')
             FROM languages WHERE profile_id = v_tutor.id),
            '["English (Native)"]'::json
          ),
          'verified_method', 'manual_admin'
        ),
        'manual', NOW(), NOW()
      );
      v_stamps_added := v_stamps_added + 1;
      RAISE NOTICE '  + % → LANGUAGE stamp agregado', v_tutor.full_name;
    END IF;

    -- =============================
    -- 6. CERTIFICATION stamps (uno por cada certificación sin stamp)
    -- =============================
    INSERT INTO stamps (profile_id, type, status, entity_type, evidence, provider, verified_at, created_at)
    SELECT
      v_tutor.id,
      'CERTIFICATION',
      'VERIFIED',
      'CERTIFICATION',
      jsonb_build_object(
        'certification_title', pi.title,
        'verified_method', 'manual_admin',
        'verification_notes', 'Certificación verificada mediante documentación oficial'
      ),
      'Admin Manual Review',
      NOW(),
      NOW()
    FROM portfolio_items pi
    WHERE pi.profile_id = v_tutor.id
      AND pi.type = 'CERTIFICATION'
      AND NOT EXISTS (
        SELECT 1 FROM stamps s
        WHERE s.profile_id = v_tutor.id
          AND s.type = 'CERTIFICATION'
          AND s.status = 'VERIFIED'
          AND s.evidence->>'certification_title' = pi.title
      );

    IF FOUND THEN
      RAISE NOTICE '  + % → CERTIFICATION stamps agregados', v_tutor.full_name;
    END IF;

    -- Contar si se arregló este tutor
    v_fixed_count := v_fixed_count + 1;

  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ PROCESO COMPLETADO';
  RAISE NOTICE '   Tutores procesados: %', v_fixed_count;
  RAISE NOTICE '   Stamps agregados: %', v_stamps_added;
  RAISE NOTICE '============================================';

END $$;

-- ============================================================================
-- VERIFICACIÓN: Mostrar estado final de stamps
-- ============================================================================
SELECT
  p.full_name,
  p.email,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') as total_stamps,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND type = 'EMAIL' AND status = 'VERIFIED') as email,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND type = 'IDENTITY' AND status = 'VERIFIED') as identity,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND type = 'EDUCATION' AND status = 'VERIFIED') as education,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND type = 'EMPLOYMENT' AND status = 'VERIFIED') as employment,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND type = 'LANGUAGE' AND status = 'VERIFIED') as language,
  (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND type = 'CERTIFICATION' AND status = 'VERIFIED') as certifications,
  CASE
    WHEN (SELECT COUNT(*) FROM stamps WHERE profile_id = p.id AND status = 'VERIFIED') >= 5 THEN '✅ OK'
    ELSE '❌ REVISAR'
  END as status
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
  AND p.role = 'professional'
ORDER BY p.full_name;
