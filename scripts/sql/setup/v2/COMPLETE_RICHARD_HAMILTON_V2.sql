-- COMPLETE RICHARD HAMILTON V2 - TIER 1 | richard.hamilton@iseih.edu | male
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='richard.hamilton@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='male', headline='Grief Counselor & Bereavement Specialist',
    summary='I believe grief is not a problem to be solved but a sacred process to be honored—that healing happens not by "getting over" loss but by integrating it into a life transformed by love and absence. For 16 years, I''ve specialized in grief counseling, supporting 300+ individuals and families through the devastating terrain of loss: death of loved ones, miscarriage, divorce, and life transitions that shatter our sense of self. My work creates space for grief to unfold at its own pace. My journey into grief work began with my son''s death. In my desperation, I encountered a grief counselor who didn''t try to fix me or rush my pain—she simply held space for my shattering. That presence saved my life. I trained to offer others what I received: skilled, compassionate companioning through the wilderness of grief. At ISEIH, I teach therapists, chaplains, and healthcare professionals how to support the grieving: understanding grief theories, recognizing complicated grief, facilitating meaning-making, and creating rituals that honor loss. My mission: to transform how we accompany the bereaved.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 200+ professionals in grief counseling','Developed comprehensive bereavement support curriculum','97% student satisfaction','Specialized in traumatic loss and parental grief'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Supported 300+ individuals through grief and loss','Facilitated 80+ bereavement support groups','Specialized in child loss, traumatic death, and ambiguous loss'] WHERE profile_id=v_user_id AND position LIKE '%Counselor%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Grief Counseling Essentials Training','Comprehensive program teaching helping professionals to companion the bereaved. Covers grief theories, intervention strategies, self-care, and creating healing rituals.',
   'PROJECT',ARRAY['Grief Counseling','Bereavement','Professional Training'],true,1,'2019-01-01'),
  (v_user_id,'Bereaved Parents Support Groups','Ongoing support groups for parents who have lost children, providing safe space for shared grief, meaning-making, and continuing bonds. 12-week cycles.',
   'PROJECT',ARRAY['Parental Grief','Support Groups','Peer Support'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Hospice Volunteer Grief Counselor','Provide pro-bono grief counseling to hospice families navigating anticipatory grief and bereavement. Offer support through death and beyond.',
   'COLLABORATION',ARRAY['Pro-Bono','Hospice','Bereavement'],4,'2015-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','richard.hamilton@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Grief Counseling'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ RICHARD HAMILTON COMPLETED';
END $$;
