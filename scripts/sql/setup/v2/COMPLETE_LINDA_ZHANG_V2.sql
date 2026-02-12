-- COMPLETE LINDA ZHANG V2 - TIER 1 | linda.zhang@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='linda.zhang@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Licensed Acupuncturist (LAc) & TCM Practitioner',
    summary='I believe Traditional Chinese Medicine offers a complete system of healing that addresses root causes, not just symptoms—restoring balance to body, mind, and spirit through meridian therapy, herbal medicine, and lifestyle guidance. For 16 years, I''ve practiced acupuncture and TCM, treating 1,200+ patients with conditions ranging from chronic pain to hormonal imbalances, infertility, and digestive disorders. My work bridges ancient wisdom with modern clinical practice. My journey began in Beijing, where I grew up watching my grandfather practice TCM in our family clinic. I learned meridian theory, tongue diagnosis, and pulse reading before I could write. That traditional apprenticeship gave me a depth of understanding that formal education alone cannot provide. After immigrating to the US, I became licensed and dedicated myself to making TCM accessible and credible in Western healthcare. At ISEIH, I train healthcare practitioners in TCM fundamentals: meridian theory, five-element diagnosis, acupuncture point location, and herbal medicine safety. I teach the philosophy underlying the techniques, not just mechanical point protocols. My mission: to preserve authentic TCM while proving its clinical efficacy.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 250+ practitioners in TCM and acupuncture','Developed comprehensive meridian theory curriculum','98% student satisfaction','Published research on acupuncture for pain management'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['1,200+ acupuncture treatments','85% symptom improvement rate','Specialized in fertility, pain, and digestive health','4.9/5 patient satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Acupuncturist%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'TCM Fundamentals for Western Practitioners','Comprehensive training introducing Western healthcare providers to Traditional Chinese Medicine. Covers meridian theory, diagnosis, treatment principles, and integration strategies.',
   'PROJECT',ARRAY['TCM','Acupuncture','Professional Education'],true,1,'2019-01-01'),
  (v_user_id,'Acupuncture for Chronic Pain Protocol','Evidence-based clinical protocol using acupuncture for chronic pain conditions. Integrates TCM diagnosis with modern pain science and neurophysiology.',
   'PROJECT',ARRAY['Acupuncture','Pain Management','Clinical Protocol'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Integrative Medicine Clinic - Volunteer Acupuncturist','Provide pro-bono acupuncture services at community health clinic serving uninsured patients. Make TCM accessible regardless of ability to pay.',
   'COLLABORATION',ARRAY['Pro-Bono','Community Health','Access'],4,'2017-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','linda.zhang@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','LAc, TCM'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED',jsonb_build_object('languages',ARRAY['English','Mandarin']),'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ LINDA ZHANG COMPLETED';
END $$;
