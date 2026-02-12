-- COMPLETE MICHELLE CHANG V2 - TIER 1 | michelle.chang@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='michelle.chang@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Reiki Master Teacher',
    summary='I believe healing energy flows where intention and presence meet—that we are all capable of channeling universal life force to facilitate healing in ourselves and others. For 14 years, I''ve practiced and taught Reiki, guiding 500+ students to access their innate healing abilities and supporting 1,000+ clients in their healing journeys. My path to Reiki began during my mother''s cancer treatment, when conventional medicine addressed the tumor but left her spirit depleted. A Reiki practitioner restored something medicine couldn''t—her sense of peace and inner resource. Witnessing that transformation, I trained to Reiki Master level. At ISEIH, I teach healthcare professionals to integrate Reiki into clinical settings—hospitals, hospices, mental health practices—providing evidence for its benefits and addressing skepticism with respect and research. My approach honors traditional Japanese Reiki lineage while adapting to modern healthcare contexts. I''m passionate about Reiki accessibility and training practitioners who embody its principles: compassion, presence, and respect for each person''s healing journey.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 500+ Reiki practitioners globally','Developed hospital-based Reiki protocols','98% student satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['1,000+ Reiki sessions','Specialized in cancer support and end-of-life care','Integrated Reiki in 5 hospitals'] WHERE profile_id=v_user_id AND position LIKE '%Master%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Hospital Reiki Integration Program','Training program for integrating Reiki into clinical settings with evidence-based protocols.',
   'PROJECT',ARRAY['Reiki','Healthcare Integration'],true,1,'2019-01-01'),
  (v_user_id,'Cancer Support Reiki Protocol','Specialized Reiki protocols for oncology patients addressing treatment side effects and emotional well-being.',
   'PROJECT',ARRAY['Reiki','Cancer Support'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Research Collaborator - Reiki Outcomes Study','Co-authored research on Reiki efficacy for anxiety and pain management published in integrative medicine journals.',
   'COLLABORATION',ARRAY['Research','Evidence-Based'],4,'2017-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED','{"email":"michelle.chang@iseih.edu"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED','{"degree":"Reiki Master"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ MICHELLE CHANG COMPLETED';
END $$;
