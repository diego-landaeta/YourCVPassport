-- COMPLETE DIANA RUSSELL V2 - TIER 1 | diana.russell@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='diana.russell@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Licensed Massage Therapist (LMT)',
    summary='I believe touch is our first language—the body remembers what the mind forgets, storing trauma, stress, and pain in fascia and muscle. For 12 years, I''ve practiced therapeutic massage as medicine, helping 800+ clients release chronic tension, heal injuries, and reconnect with embodied wellness. My journey began after a car accident left me with debilitating back pain. Physical therapy addressed mechanics, but massage therapy addressed the whole system—releasing not just muscle knots but emotional holding patterns. That healing transformed my path. At ISEIH, I train bodyworkers in advanced techniques: myofascial release, trigger point therapy, craniosacral work, and trauma-informed touch. I teach anatomy in motion, palpation skills, and therapeutic relationship. My approach honors both biomechanics and the body''s innate wisdom. I''m passionate about making therapeutic bodywork accessible and training practitioners who practice with presence, not just technique. My mission: to elevate massage from relaxation to recognized healthcare.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 150+ bodyworkers in trauma-informed touch','Developed myofascial release curriculum','96% student satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['800+ therapeutic massage sessions','Specialized in chronic pain and injury recovery','4.9/5 client rating'] WHERE profile_id=v_user_id AND position LIKE '%Private Practice%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Trauma-Informed Bodywork Training','Comprehensive program teaching safe touch practices for trauma survivors.',
   'PROJECT',ARRAY['Trauma-Informed','Bodywork'],true,1,'2020-01-01'),
  (v_user_id,'Chronic Pain Massage Protocol','Evidence-based massage protocols for fibromyalgia, chronic back pain, and tension headaches.',
   'PROJECT',ARRAY['Chronic Pain','Therapeutic Massage'],true,2,'2019-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Advisory Board - Massage Therapy Association','Contribute to professional standards and scope of practice development.',
   'COLLABORATION',ARRAY['Professional Standards'],4,'2019-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED','{"email":"diana.russell@iseih.edu"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED','{"degree":"LMT"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ DIANA RUSSELL COMPLETED';
END $$;
