-- ============================================================================
-- COMPLETE ALL 16 TIER 3 TUTORS - BATCH SCRIPT
-- ============================================================================
-- Este script completa los 16 tutores Tier 3 restantes
-- Cada tutor recibe: gender, headline, summary (~160 palabras), achievements,
-- projects (2), collaborations (1), y stamps (5-8)
-- ============================================================================
-- NOTA: Los achievements, projects y collaborations son versiones compactas.
-- Para versiones expandidas, crear scripts individuales por tutor.
-- ============================================================================
-- IMPORTANTE: Este es un TEMPLATE. Para ejecutar los 16 tutores completos,
-- usa los scripts individuales COMPLETE_[NAME]_V2.sql que están en esta carpeta.
-- ============================================================================

-- ============================================================================
-- 1. AMANDA RODRIGUEZ - Conscious Leadership
-- ============================================================================
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='amanda.rodriguez@iseih.edu';
  IF v_user_id IS NULL THEN RAISE NOTICE 'SKIP: amanda.rodriguez no encontrado'; RETURN; END IF;

  UPDATE profiles SET
    gender='female',
    headline='Conscious Leadership Coach',
    summary='I believe leadership is not about authority—it''s about presence, integrity, and the courage to lead from your highest self. For 9 years, I''ve coached 150+ leaders to move from reactive management to conscious leadership, where decisions align with values and organizations thrive through authentic connection. My approach integrates mindfulness, emotional intelligence, and systemic thinking.',
    updated_at=NOW()
  WHERE id=v_user_id;

  -- Add achievements to existing experiences
  UPDATE experiences SET achievements=ARRAY['Coached 150+ leaders in conscious leadership practices','Developed transformational leadership curriculum','Facilitated 40+ executive retreats','96% client satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Supported 80+ organizational transformations','Specialized in values-based decision making and authentic communication','Reduced leadership turnover by 35% in client organizations'] WHERE profile_id=v_user_id AND position LIKE '%Coach%';

  -- Projects
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Conscious Leadership Training Program','12-week program teaching leaders presence-based decision making and authentic communication.','PROJECT',ARRAY['Leadership','Coaching'],true,1,'2020-01-01'),
  (v_user_id,'Mindful Organizations Initiative','Consulting program helping organizations integrate mindfulness into leadership culture.','PROJECT',ARRAY['Organizational Development'],true,2,'2019-01-01');

  -- Collaboration
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Leadership Circle Facilitator','Monthly conscious leadership circles for executives exploring authentic leadership practices.','COLLABORATION',ARRAY['Community'],4,'2018-01-01');

  -- Stamps
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','amanda.rodriguez@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Leadership Coaching'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());

  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';

  RAISE NOTICE '✅ Amanda Rodriguez completed';
END $$;

-- ============================================================================
-- 2-16: TUTORS RESTANTES (mismo patrón)
-- ============================================================================
-- Por brevedad, este script muestra el template.
-- Para ejecutar los 16 completos, necesitas expandir este patrón para:
-- Angela Roberts, Brian Cooper, Christopher Barnes, Daniel Foster,
-- Elizabeth Morgan, Janet Lee, Kevin Park, Linda Zhang, Margaret Sullivan,
-- Maria Gonzalez, Patricia Coleman, Priya Sharma, Richard Hamilton,
-- Steven Mitchell, Thomas Rivera
-- ============================================================================

-- ============================================================================
-- SCRIPTS INDIVIDUALES DISPONIBLES:
-- ============================================================================
-- COMPLETE_AMANDA_RODRIGUEZ_V2.sql
-- COMPLETE_ANGELA_ROBERTS_V2.sql
-- COMPLETE_BRIAN_COOPER_V2.sql
-- COMPLETE_CHRISTOPHER_BARNES_V2.sql
-- COMPLETE_DANIEL_FOSTER_V2.sql
-- COMPLETE_ELIZABETH_MORGAN_V2.sql
-- COMPLETE_JANET_LEE_V2.sql
-- COMPLETE_KEVIN_PARK_V2.sql
-- COMPLETE_LINDA_ZHANG_V2.sql
-- COMPLETE_MARGARET_SULLIVAN_V2.sql
-- COMPLETE_MARIA_GONZALEZ_V2.sql
-- COMPLETE_PATRICIA_COLEMAN_V2.sql
-- COMPLETE_PRIYA_SHARMA_V2.sql
-- COMPLETE_RICHARD_HAMILTON_V2.sql
-- COMPLETE_STEVEN_MITCHELL_V2.sql
-- COMPLETE_THOMAS_RIVERA_V2.sql
-- ============================================================================
