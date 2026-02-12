-- COMPLETE PRIYA SHARMA V2 - TIER 1 | priya.sharma@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='priya.sharma@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Ayurvedic Practitioner & Wellness Consultant',
    summary='I believe Ayurveda offers a complete science of life—teaching us to live in harmony with our unique constitution, the seasons, and the rhythms of nature for radiant health and longevity. For 12 years, I''ve practiced Ayurvedic medicine, guiding 600+ clients to heal chronic conditions through personalized diet, herbal remedies, daily rhythms, and lifestyle aligned with their dosha. My approach honors ancient wisdom while adapting to modern life. My journey began in India, where I grew up surrounded by Ayurvedic traditions. My grandmother treated family ailments with kitchen spices and seasonal routines that I later learned were sophisticated Ayurvedic protocols. After formal training in Kerala, I moved to the West and witnessed how Ayurveda could address the chronic stress, digestive disorders, and hormonal imbalances epidemic in modern life. At ISEIH, I teach healthcare practitioners Ayurvedic fundamentals: dosha theory, constitutional assessment, herbal medicine, and dietary therapy. I bridge traditional knowledge with evidence-based practice, showing how Ayurveda complements modern medicine. My mission: to make authentic Ayurveda accessible beyond wellness trends.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 180+ practitioners in Ayurvedic medicine','Developed comprehensive dosha-based curriculum','98% student satisfaction','Specialized in digestive and hormonal health'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['600+ Ayurvedic consultations','85% client health improvement rate','Specialized in chronic digestive disorders and women''s health','4.9/5 client satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Practitioner%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Ayurveda Foundations for Western Practitioners','Comprehensive training introducing Western healthcare providers to Ayurvedic medicine. Covers dosha theory, constitutional assessment, dietary therapy, and herbal protocols.',
   'PROJECT',ARRAY['Ayurveda','Holistic Health','Professional Education'],true,1,'2020-01-01'),
  (v_user_id,'Seasonal Wellness Programs','Four seasonal programs teaching participants to align diet, lifestyle, and self-care with natural rhythms for optimal health. Integrates Ayurvedic wisdom with modern science.',
   'PROJECT',ARRAY['Ayurveda','Seasonal Living','Wellness'],true,2,'2019-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Community Health Center - Ayurvedic Consultant','Provide pro-bono Ayurvedic consultations at community health clinic serving low-income populations. Make traditional wellness wisdom accessible to all.',
   'COLLABORATION',ARRAY['Pro-Bono','Community Health','Access'],4,'2018-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','priya.sharma@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Ayurvedic Medicine'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED',jsonb_build_object('languages',ARRAY['English','Hindi']),'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ PRIYA SHARMA COMPLETED';
END $$;
