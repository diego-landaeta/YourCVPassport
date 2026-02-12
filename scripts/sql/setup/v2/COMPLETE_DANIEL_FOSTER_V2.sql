-- COMPLETE DANIEL FOSTER V2 - TIER 1 | daniel.foster@iseih.edu | male
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='daniel.foster@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='male', headline='Research Methodologist & Data Analyst',
    summary='I believe rigorous research is the foundation of effective holistic practice—that intuition and evidence are not opposites but partners in discovering what truly works. For 13 years, I''ve supported 100+ research projects in integrative health, helping practitioners design studies, analyze data, and translate findings into actionable insights. My work bridges the gap between clinical practice and scientific validation. My journey into research methodology began with frustration: brilliant holistic practitioners whose work lacked credibility because they couldn''t prove efficacy. I dedicated my career to making rigorous research accessible to non-academics, teaching them to design studies, collect meaningful data, and communicate findings professionally. At ISEIH, I teach research design, statistical analysis, and evidence-based practice to holistic health students. I demystify research methods, showing that good science doesn''t require a PhD—just curiosity, integrity, and systematic thinking. I''m passionate about mixed-methods research that honors both quantitative outcomes and qualitative human experience. My mission: to elevate holistic health through credible, rigorous research.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Supported 100+ research projects in integrative health','Developed accessible research methodology curriculum','95% student satisfaction','Published 15+ peer-reviewed articles'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Statistical analysis for 60+ clinical studies','Specialized in mixed-methods and outcomes research','Grant writing support: $2M+ funding secured'] WHERE profile_id=v_user_id AND position LIKE '%Analyst%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Research Essentials for Holistic Practitioners','12-week course teaching holistic health practitioners to design studies, collect data, and communicate findings. Includes IRB preparation and grant writing basics.',
   'PROJECT',ARRAY['Research Methods','Evidence-Based Practice','Education'],true,1,'2019-01-01'),
  (v_user_id,'Outcomes Measurement Toolkit','Open-source toolkit providing validated assessment tools for holistic health practitioners. Includes survey instruments, data collection templates, and analysis guides.',
   'PROJECT',ARRAY['Research Tools','Open Source','Outcomes'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Pro-Bono Research Consultant - Small Nonprofits','Provide free research design and statistical analysis support to underfunded nonprofits conducting health intervention research. Help them prove impact.',
   'COLLABORATION',ARRAY['Pro-Bono','Nonprofit','Research Support'],4,'2017-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','daniel.foster@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Research Methodology'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ DANIEL FOSTER COMPLETED';
END $$;
