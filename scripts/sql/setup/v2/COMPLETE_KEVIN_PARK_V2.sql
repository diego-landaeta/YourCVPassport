-- COMPLETE KEVIN PARK V2 - TIER 1 | kevin.park@iseih.edu | male
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='kevin.park@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='male', headline='Conscious Entrepreneurship Coach',
    summary='I believe business can be a vehicle for healing the world—that entrepreneurship guided by consciousness creates not just wealth but meaningful impact and genuine fulfillment. For 12 years, I''ve coached 180+ conscious entrepreneurs to build profitable businesses aligned with their values, helping them navigate the tension between purpose and profit, integrity and growth. My approach integrates strategic business acumen with inner development. My journey began building a "successful" startup that made money but destroyed my health and relationships. In my burnout, I discovered conscious business principles and realized I could build differently—growing a business that served my life instead of consuming it. I sold that company and dedicated myself to helping others avoid my mistakes. At ISEIH, I teach entrepreneurship that integrates mindfulness, systems thinking, and ethical leadership. I help aspiring conscious entrepreneurs develop sustainable business models, clarify their unique contribution, and build enterprises that generate both profit and positive impact. My mission: to prove that consciousness and commerce are not contradictions.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Coached 180+ conscious entrepreneurs to profitability','Developed sustainable business model curriculum','95% client business survival rate after 3 years','Combined revenue of client businesses: $12M+'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Built and exited 2 conscious businesses','Raised $3M+ in values-aligned funding','Specialized in social enterprise and B-Corp models'] WHERE profile_id=v_user_id AND position LIKE '%Coach%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Conscious Business Accelerator','12-week intensive helping purpose-driven entrepreneurs develop business models, clarify offerings, and launch sustainably. Integrates strategy with inner work.',
   'PROJECT',ARRAY['Entrepreneurship','Business Strategy','Conscious Business'],true,1,'2020-01-01'),
  (v_user_id,'Impact Measurement Framework','Open-source framework helping social entrepreneurs measure and communicate triple-bottom-line impact: profit, people, planet. Makes impact reporting accessible.',
   'PROJECT',ARRAY['Impact Measurement','Social Enterprise','Framework'],true,2,'2019-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Mentor - Underrepresented Founders Network','Provide pro-bono mentorship to BIPOC, women, and LGBTQ+ entrepreneurs building conscious businesses. Address systemic barriers to capital and support.',
   'COLLABORATION',ARRAY['Pro-Bono','Diversity','Mentorship'],4,'2018-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','kevin.park@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Business Coaching'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ KEVIN PARK COMPLETED';
END $$;
