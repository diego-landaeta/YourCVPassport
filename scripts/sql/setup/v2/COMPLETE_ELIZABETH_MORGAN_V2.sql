-- COMPLETE ELIZABETH MORGAN V2 - TIER 1 | elizabeth.morgan@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='elizabeth.morgan@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='End-of-Life Doula & Palliative Care Specialist',
    summary='I believe death is not a medical failure but a sacred passage that deserves presence, dignity, and compassionate accompaniment. For 14 years, I''ve served as an end-of-life doula, supporting 200+ individuals and families through the dying process with practical care, emotional support, and spiritual presence. My work transforms the experience of dying from something to be feared into something to be honored. My calling began when my grandmother died alone in a sterile hospital, disconnected from family and rushed through her final hours. I vowed that no one I could reach would die that way. I trained as a death doula and palliative care specialist, learning to hold space for life''s most profound transition. At ISEIH, I train healthcare professionals, chaplains, and aspiring doulas in end-of-life care: pain management, advance care planning, family support, grief companioning, and the art of being present with dying. I teach how to navigate medical systems while centering the person''s wishes and dignity. My mission: to transform how we die—returning death to a human, sacred experience.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 150+ end-of-life doulas and care professionals','Developed comprehensive palliative care curriculum','98% student satisfaction','Specialized in trauma-informed dying processes'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Supported 200+ individuals and families through death transition','Facilitated advance care planning for 120+ patients','100% family satisfaction in post-death surveys'] WHERE profile_id=v_user_id AND position LIKE '%Doula%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Sacred Dying Training Program','6-month intensive training aspiring death doulas in practical care, emotional support, spiritual accompaniment, and navigating medical systems with dignity-centered advocacy.',
   'PROJECT',ARRAY['End-of-Life','Palliative Care','Training'],true,1,'2019-01-01'),
  (v_user_id,'Advance Care Planning Workshops','Community workshops helping individuals clarify end-of-life wishes, complete advance directives, and communicate preferences to loved ones. Reduces family conflict and ensures dignity.',
   'PROJECT',ARRAY['Advance Care Planning','Community Education','Death Literacy'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Hospice Volunteer Coordinator','Train and support volunteer doulas providing free companionship to dying individuals without family. Create presence for those facing death alone.',
   'COLLABORATION',ARRAY['Pro-Bono','Hospice','Volunteer Management'],4,'2016-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','elizabeth.morgan@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Death Doula Certification'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ ELIZABETH MORGAN COMPLETED';
END $$;
