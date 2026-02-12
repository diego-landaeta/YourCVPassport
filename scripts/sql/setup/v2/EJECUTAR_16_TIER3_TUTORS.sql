-- ============================================================================
-- EJECUTAR LOS 16 TIER 3 TUTORS COMPLETOS
-- ============================================================================
-- Este script ejecuta la completación de los 16 tutores Tier 3
-- Cada tutor recibe: gender, headline, summary (~160 palabras), achievements,
-- projects (2), collaborations (1), y stamps (5-8)
-- ============================================================================

-- 1. AMANDA RODRIGUEZ - Conscious Leadership
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='amanda.rodriguez@iseih.edu';
  IF v_user_id IS NULL THEN RAISE NOTICE 'SKIP: amanda.rodriguez no encontrado'; RETURN; END IF;
  UPDATE profiles SET gender='female', headline='Conscious Leadership Coach',
    summary='I believe leadership is not about authority—it''s about presence, integrity, and the courage to lead from your highest self. For 9 years, I''ve coached 150+ leaders to move from reactive management to conscious leadership, where decisions align with values and organizations thrive through authentic connection. My approach integrates mindfulness, emotional intelligence, and systemic thinking to help leaders cultivate awareness, communicate authentically, and create cultures of trust. I work with executives, founders, and changemakers navigating complex challenges—mergers, cultural transformation, ethical dilemmas—helping them lead with wisdom instead of ego. At ISEIH, I train coaches and consultants in conscious leadership frameworks, teaching them to facilitate transformational conversations that shift how leaders see themselves and their impact. I''m passionate about bringing contemplative practices into the boardroom, proving that self-awareness and compassion are not soft skills—they''re strategic necessities. My mission: to cultivate a generation of leaders who serve the collective good.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Coached 150+ leaders in conscious leadership practices','Developed transformational leadership curriculum','Facilitated 40+ executive retreats','96% client satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Supported 80+ organizational transformations','Specialized in values-based decision making and authentic communication','Reduced leadership turnover by 35% in client organizations'] WHERE profile_id=v_user_id AND position LIKE '%Coach%';
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Conscious Leadership Training Program','12-week intensive program teaching leaders presence-based decision making, authentic communication, and systemic awareness. Participants develop mindfulness practices and learn to lead from values instead of fear.','PROJECT',ARRAY['Leadership','Mindfulness','Organizational Development'],true,1,'2020-01-01'),
  (v_user_id,'Mindful Organizations Initiative','Consulting program helping organizations integrate contemplative practices into leadership culture. Includes executive coaching, team facilitation, and systemic change support.','PROJECT',ARRAY['Mindfulness','Consulting','Cultural Transformation'],true,2,'2019-01-01');
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Leadership Circle Facilitator','Monthly conscious leadership circles for executives exploring authentic leadership practices. Create safe spaces for vulnerability, peer coaching, and collective wisdom.','COLLABORATION',ARRAY['Community','Leadership Development'],4,'2018-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED','{\"email\":\"amanda.rodriguez@iseih.edu\"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED','{\"degree\":\"Leadership Coaching\"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ Amanda Rodriguez completed';
END $$;

-- 2. ANGELA ROBERTS - Personal Growth
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='angela.roberts@iseih.edu';
  IF v_user_id IS NULL THEN RAISE NOTICE 'SKIP: angela.roberts no encontrado'; RETURN; END IF;
  UPDATE profiles SET gender='female', headline='Personal Growth & Life Design Coach',
    summary='I believe every person has untapped potential waiting to be discovered—that transformation happens when we align our daily choices with our deepest values and boldest dreams. For 12 years, I''ve coached 300+ individuals through major life transitions, helping them clarify purpose, overcome limiting beliefs, and design lives of meaning and fulfillment. My journey into coaching began after my own quarter-life crisis—a successful corporate career that left me empty. Through deep self-inquiry, I discovered my true calling: helping others navigate the messy, beautiful process of becoming who they''re meant to be. At ISEIH, I train coaches in evidence-based personal growth methodologies: values clarification, goal-setting frameworks, and accountability systems that actually work. I teach how to hold space for clients'' transformation without imposing your own agenda. I''m passionate about integrating positive psychology, neuroscience, and contemplative practices into practical tools for sustainable change. My mission: to empower individuals to create lives they don''t need to escape from.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Coached 300+ clients through major life transitions','Developed evidence-based life design curriculum','98% client goal achievement rate','Specialized in values clarification and purpose discovery'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Facilitated 150+ personal growth workshops','Created sustainable change frameworks','Average client satisfaction: 4.9/5'] WHERE profile_id=v_user_id AND position LIKE '%Coach%';
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Life Design Intensive','8-week program guiding participants through deep values clarification, vision crafting, and strategic action planning. Combines coaching, reflection exercises, and peer accountability.','PROJECT',ARRAY['Life Coaching','Personal Development','Goal Setting'],true,1,'2020-01-01'),
  (v_user_id,'Limiting Beliefs Workshop Series','Transformational workshops helping participants identify and release unconscious patterns blocking their growth. Integrates CBT, somatic practices, and positive psychology.','PROJECT',ARRAY['Psychology','Personal Growth','Mindset'],true,2,'2019-01-01');
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Pro-Bono Career Transition Coaching','Volunteer coach for professionals navigating unemployment and career pivots. Provide support, accountability, and practical strategies for reinvention.','COLLABORATION',ARRAY['Pro-Bono','Career Development'],4,'2018-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED','{\"email\":\"angela.roberts@iseih.edu\"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED','{\"degree\":\"Life Coaching Certification\"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ Angela Roberts completed';
END $$;

-- NOTA: Continúa con los 14 restantes...
-- Los scripts individuales están en:
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

-- Para ejecutar todos, usa los scripts individuales en Supabase SQL Editor
-- uno por uno, o ejecuta este consolidado expandido con los 14 restantes.
