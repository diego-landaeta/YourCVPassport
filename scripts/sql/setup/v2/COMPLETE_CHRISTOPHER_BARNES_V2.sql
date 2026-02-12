-- COMPLETE CHRISTOPHER BARNES V2 - TIER 1 | christopher.barnes@iseih.edu | male
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='christopher.barnes@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='male', headline='Movement Therapist & Somatic Educator',
    summary='I believe the body is not just a vehicle for the mind—it''s an intelligent system that holds wisdom, memory, and the key to healing. For 11 years, I''ve practiced movement-based therapies, helping 400+ clients reconnect with their bodies through somatic education, dance therapy, and therapeutic movement. My work addresses chronic pain, trauma, and disconnection through embodied practices that restore natural, joyful movement. My journey began as a dancer whose career ended with injury. In my recovery, I discovered that my body had been moving in patterns of compensation and control for years. Learning to move authentically—listening to my body instead of dominating it—transformed not just my physicality but my entire relationship with myself. At ISEIH, I train therapists, movement educators, and bodyworkers in somatic principles: interoception, fascia awareness, developmental movement patterns, and trauma-informed touch. I teach how to facilitate embodied healing, not just physical rehabilitation. My mission: to help people reclaim the joy, freedom, and wisdom of their bodies.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 180+ practitioners in somatic movement therapy','Developed embodied healing curriculum','96% student satisfaction','Specialized in trauma-informed movement practices'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['400+ somatic therapy sessions','70% reduction in chronic pain symptoms','Specialized in post-trauma body reconnection'] WHERE profile_id=v_user_id AND position LIKE '%Therapist%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Somatic Trauma Release Program','6-month program teaching trauma survivors to release stored stress through gentle, body-led movement practices. Integrates somatic experiencing, dance therapy, and fascia release.',
   'PROJECT',ARRAY['Somatic Therapy','Trauma','Movement'],true,1,'2020-01-01'),
  (v_user_id,'Embodied Awareness Training','Professional development program teaching therapists to cultivate somatic intelligence and presence. Includes practices for interoception, grounding, and embodied listening.',
   'PROJECT',ARRAY['Somatic Education','Professional Training','Mindfulness'],true,2,'2019-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Movement Medicine Community Classes','Facilitate weekly community classes offering accessible movement therapy for people with chronic pain, trauma, and body disconnection. Sliding scale/donation-based.',
   'COLLABORATION',ARRAY['Community','Pro-Bono','Accessibility'],4,'2018-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','christopher.barnes@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Movement Therapy'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ CHRISTOPHER BARNES COMPLETED';
END $$;
