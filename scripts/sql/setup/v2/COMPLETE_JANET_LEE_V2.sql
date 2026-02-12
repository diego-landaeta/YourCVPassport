-- COMPLETE JANET LEE V2 - TIER 1 | janet.lee@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='janet.lee@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Gerontology Specialist & Elder Care Advocate',
    summary='I believe aging is not decline but transformation—that later life can be a time of profound meaning, connection, and contribution when elders receive dignified, person-centered care. For 15 years, I''ve specialized in gerontology and elder advocacy, training 400+ caregivers and healthcare professionals to provide care that honors autonomy, respects wisdom, and preserves dignity. My work challenges ageist assumptions that diminish elders. My journey began caring for my father through Alzheimer''s. Watching the healthcare system treat him as a problem instead of a person radicalized me. I studied gerontology and dedicated my career to transforming elder care from custodial warehousing to relationship-centered support that sees the whole person. At ISEIH, I train professionals in person-centered dementia care, trauma-informed elder support, and advocacy skills for navigating complex healthcare systems. I teach how to communicate with elders experiencing cognitive decline, manage behavioral expressions with compassion, and support families through difficult transitions. My mission: to create a world where elders are honored, not hidden.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 400+ professionals in person-centered elder care','Developed dementia care best practices curriculum','97% student satisfaction','Specialized in trauma-informed gerontology'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Provided care consultation for 150+ families','Reduced behavioral incidents by 60% through person-centered approaches','4.9/5 family satisfaction rating'] WHERE profile_id=v_user_id AND position LIKE '%Specialist%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Person-Centered Dementia Care Training','Comprehensive training teaching caregivers to understand dementia from the elder''s perspective. Focuses on validation, sensory approaches, and preserving dignity through all stages.',
   'PROJECT',ARRAY['Dementia','Elder Care','Person-Centered Care'],true,1,'2019-01-01'),
  (v_user_id,'Family Caregiver Support Program','6-week program providing emotional support, practical skills, and resources for family members caring for aging loved ones. Reduces caregiver burnout and isolation.',
   'PROJECT',ARRAY['Family Support','Caregiver Training','Elder Care'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Elder Advocacy Network Coordinator','Coordinate regional network advocating for elder rights, quality care standards, and policy reform. Connect families with resources and legal support.',
   'COLLABORATION',ARRAY['Advocacy','Policy','Community'],4,'2017-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','janet.lee@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Gerontology'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ JANET LEE COMPLETED';
END $$;
