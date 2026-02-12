-- COMPLETE MARGARET SULLIVAN V2 - TIER 1 | margaret.sullivan@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='margaret.sullivan@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Contemplative Practices Teacher',
    summary='I believe contemplative practice is not an escape from life but a way of being fully present to it—cultivating awareness, compassion, and equanimity that transform how we relate to ourselves, others, and the world. For 18 years, I''ve taught meditation, contemplative inquiry, and mindfulness-based practices to 800+ students, helping them develop inner resources for navigating life''s challenges with grace and wisdom. My journey began in crisis. After a devastating loss, I discovered Buddhist meditation and experienced firsthand how contemplative practice could hold suffering without being consumed by it. That personal transformation became my life''s work. I trained intensively in multiple contemplative traditions—Zen, Vipassana, contemplative Christianity, and secular mindfulness—learning to teach practices that are accessible, non-dogmatic, and deeply transformative. At ISEIH, I train teachers, therapists, and coaches in contemplative pedagogy: how to guide meditation, facilitate inquiry, create conditions for insight, and integrate contemplative practices ethically into professional work. My mission: to make contemplative wisdom accessible to all, regardless of religious background.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 300+ contemplative practice teachers','Developed secular contemplative curriculum','97% student satisfaction','20,000+ hours personal practice experience'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Led 500+ meditation retreats and workshops','800+ individual students in contemplative practices','Specialized in grief, trauma, and difficult emotions'] WHERE profile_id=v_user_id AND position LIKE '%Teacher%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Contemplative Practices Teacher Training','10-month intensive training aspiring teachers in meditation guidance, contemplative inquiry, and ethical practice. Includes personal practice deepening and teaching practicum.',
   'PROJECT',ARRAY['Meditation','Contemplative Practices','Teacher Training'],true,1,'2019-01-01'),
  (v_user_id,'Mindfulness for Grief and Loss','8-week program teaching contemplative practices for navigating grief, loss, and difficult transitions. Combines meditation with compassion practices and somatic awareness.',
   'PROJECT',ARRAY['Grief','Mindfulness','Loss'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Prison Meditation Program Facilitator','Volunteer meditation teacher in correctional facilities, offering contemplative practices to incarcerated individuals. Create conditions for inner freedom despite external confinement.',
   'COLLABORATION',ARRAY['Pro-Bono','Criminal Justice','Access'],4,'2015-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','margaret.sullivan@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Contemplative Studies'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ MARGARET SULLIVAN COMPLETED';
END $$;
