-- COMPLETE CATHERINE ADAMS V2 - TIER 1 | catherine.adams@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='catherine.adams@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Licensed Marriage & Family Therapist (LMFT)',
    summary='I believe every relationship crisis is also an invitation—to heal old wounds, break destructive patterns, and create the partnership both people truly long for. For 11 years, I''ve sat with couples in their most vulnerable moments, helping 250+ partnerships navigate infidelity, communication breakdowns, and disconnection to rebuild trust, intimacy, and shared purpose. My work is deeply personal—I nearly lost my own marriage before discovering Emotionally Focused Therapy transformed not just how we fought, but how we loved. That transformation fuels my practice. At ISEIH, I train therapists in evidence-based couples therapy: EFT, Gottman Method, and trauma-informed relational work. I teach how to create safety, identify attachment patterns, and facilitate the vulnerable conversations that heal. My approach integrates neuroscience of bonding with practical communication skills. I''m passionate about supporting diverse partnerships—interfaith, intercultural, LGBTQ+, non-monogamous—with culturally responsive care. My mission: to help couples move from pain to partnership.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 180+ therapists in EFT and Gottman Method','Developed couples therapy training curriculum','96% student satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Provided therapy to 250+ couples','70% success rate in relationship satisfaction improvement','Specialized in infidelity recovery and attachment repair'] WHERE profile_id=v_user_id AND position LIKE '%Therapist%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Attachment Repair in Couples Therapy','Training program teaching therapists to identify and heal attachment injuries in intimate relationships.',
   'PROJECT',ARRAY['Couples Therapy','Attachment','EFT'],true,1,'2019-01-01'),
  (v_user_id,'Infidelity Recovery Protocol','Evidence-based therapeutic protocol for couples healing from betrayal and rebuilding trust.',
   'PROJECT',ARRAY['Infidelity','Couples Therapy','Trust'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'LGBTQ+ Affirming Couples Therapy Network','Co-founded professional network providing culturally competent couples therapy training and resources.',
   'COLLABORATION',ARRAY['LGBTQ+','Cultural Competence','Network'],4,'2017-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED','{"email":"catherine.adams@iseih.edu"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED','{"degree":"LMFT"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ CATHERINE ADAMS COMPLETED';
END $$;
