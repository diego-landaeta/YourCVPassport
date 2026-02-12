-- COMPLETE ANGELA ROBERTS V2 - TIER 1 | angela.roberts@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='angela.roberts@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Personal Growth & Life Design Coach',
    summary='I believe every person has untapped potential waiting to be discovered—that transformation happens when we align our daily choices with our deepest values and boldest dreams. For 12 years, I''ve coached 300+ individuals through major life transitions, helping them clarify purpose, overcome limiting beliefs, and design lives of meaning and fulfillment. My journey into coaching began after my own quarter-life crisis—a successful corporate career that left me empty. Through deep self-inquiry, I discovered my true calling: helping others navigate the messy, beautiful process of becoming who they''re meant to be. At ISEIH, I train coaches in evidence-based personal growth methodologies: values clarification, goal-setting frameworks, and accountability systems that actually work. I teach how to hold space for clients'' transformation without imposing your own agenda. I''m passionate about integrating positive psychology, neuroscience, and contemplative practices into practical tools for sustainable change. My mission: to empower individuals to create lives they don''t need to escape from.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Coached 300+ clients through major life transitions','Developed evidence-based life design curriculum','98% client goal achievement rate','Specialized in values clarification and purpose discovery'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Facilitated 150+ personal growth workshops','Created sustainable change frameworks','Average client satisfaction: 4.9/5'] WHERE profile_id=v_user_id AND position LIKE '%Coach%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Life Design Intensive','8-week program guiding participants through deep values clarification, vision crafting, and strategic action planning. Combines coaching, reflection exercises, and peer accountability.',
   'PROJECT',ARRAY['Life Coaching','Personal Development','Goal Setting'],true,1,'2020-01-01'),
  (v_user_id,'Limiting Beliefs Workshop Series','Transformational workshops helping participants identify and release unconscious patterns blocking their growth. Integrates CBT, somatic practices, and positive psychology.',
   'PROJECT',ARRAY['Psychology','Personal Growth','Mindset'],true,2,'2019-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Pro-Bono Career Transition Coaching','Volunteer coach for professionals navigating unemployment and career pivots. Provide support, accountability, and practical strategies for reinvention.',
   'COLLABORATION',ARRAY['Pro-Bono','Career Development'],4,'2018-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','angela.roberts@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Life Coaching Certification'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ ANGELA ROBERTS COMPLETED';
END $$;
