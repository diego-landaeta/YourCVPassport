-- COMPLETE STEVEN MITCHELL V2 - TIER 1 | steven.mitchell@iseih.edu | male
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='steven.mitchell@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='male', headline='Transpersonal Psychologist',
    summary='I believe human consciousness extends far beyond the ego—that our deepest healing and greatest potential lie in transpersonal experiences that connect us to something larger than our individual selves. For 14 years, I''ve practiced transpersonal psychology, supporting 250+ clients in exploring non-ordinary states of consciousness, spiritual emergence, and transformative experiences that conventional psychology pathologizes or ignores. My work honors the full spectrum of human experience. My journey began with a spontaneous spiritual awakening that left me terrified and isolated—traditional therapists had no framework for what I was experiencing. When I discovered transpersonal psychology, I finally found a map for consciousness that included mystical states, psychedelic experiences, and spiritual crisis. I trained to guide others through these territories. At ISEIH, I teach mental health professionals to recognize and support spiritual emergence, work with non-ordinary states, integrate psychedelic experiences, and distinguish spiritual crisis from psychosis. I help practitioners develop frameworks that honor transcendent experiences. My mission: to bring transpersonal perspectives into mainstream mental health.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 180+ therapists in transpersonal psychology','Developed spiritual emergence curriculum','96% student satisfaction','Specialized in psychedelic integration and mystical experiences'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Supported 250+ clients through spiritual emergence','Specialized in psychedelic integration and non-ordinary states','Facilitated 60+ holotropic breathwork sessions'] WHERE profile_id=v_user_id AND position LIKE '%Psychologist%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Transpersonal Psychology Foundations','Comprehensive training introducing mental health professionals to transpersonal theory, spiritual emergence, altered states, and integration practices beyond conventional psychology.',
   'PROJECT',ARRAY['Transpersonal Psychology','Spiritual Emergence','Professional Training'],true,1,'2019-01-01'),
  (v_user_id,'Psychedelic Integration Support Program','Specialized program helping individuals integrate psychedelic experiences into daily life. Provides psychological support, meaning-making, and practical integration strategies.',
   'PROJECT',ARRAY['Psychedelic Integration','Harm Reduction','Support'],true,2,'2020-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Spiritual Emergency Network Volunteer','Provide crisis support to individuals experiencing spiritual emergencies. Help them navigate non-ordinary states with resources, referrals, and skilled presence.',
   'COLLABORATION',ARRAY['Pro-Bono','Crisis Support','Spiritual Emergence'],4,'2017-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','steven.mitchell@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Transpersonal Psychology'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ STEVEN MITCHELL COMPLETED';
END $$;
