-- COMPLETE PATRICIA COLEMAN V2 - TIER 1 | patricia.coleman@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='patricia.coleman@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Qualitative Research Methodologist',
    summary='I believe qualitative research honors the complexity of human experience—capturing stories, meanings, and contexts that numbers alone cannot reveal. For 14 years, I''ve specialized in qualitative methodology, supporting 80+ research projects in holistic health, social sciences, and community-based participatory research. My work helps practitioners understand not just "what works" but why, how, and for whom. My journey into qualitative research began with frustration at quantitative studies that stripped away the human element. A study showing "70% improvement" told me nothing about the lived experience of transformation. I dedicated my career to rigorous qualitative methods—phenomenology, grounded theory, narrative inquiry—that honor complexity while maintaining scientific integrity. At ISEIH, I teach qualitative research design, interviewing techniques, thematic analysis, and trustworthiness criteria to students conducting holistic health research. I demystify qualitative rigor, showing that "subjective" doesn''t mean "anything goes." I''m passionate about community-based participatory research that centers marginalized voices. My mission: to elevate qualitative research as essential, not supplementary, to understanding health and healing.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Supported 80+ qualitative research projects','Developed qualitative methodology curriculum','97% student satisfaction','Published 12 peer-reviewed qualitative studies'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Conducted 200+ in-depth qualitative interviews','Specialized in phenomenology and narrative inquiry','Expert in CBPR and participatory action research'] WHERE profile_id=v_user_id AND position LIKE '%Methodologist%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Qualitative Research Essentials','Comprehensive training teaching holistic health practitioners to design, conduct, and analyze qualitative studies. Covers interviewing, coding, thematic analysis, and trustworthiness.',
   'PROJECT',ARRAY['Qualitative Research','Methodology','Training'],true,1,'2019-01-01'),
  (v_user_id,'Community-Based Participatory Research Toolkit','Open-source toolkit providing frameworks, templates, and guides for conducting ethical, community-centered research with marginalized populations.',
   'PROJECT',ARRAY['CBPR','Participatory Research','Toolkit'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Research Consultant - Grassroots Health Initiatives','Provide pro-bono qualitative research support to community health organizations documenting impact and amplifying participant voices for funding and advocacy.',
   'COLLABORATION',ARRAY['Pro-Bono','Community Research','Advocacy'],4,'2017-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','patricia.coleman@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Qualitative Research'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ PATRICIA COLEMAN COMPLETED';
END $$;
