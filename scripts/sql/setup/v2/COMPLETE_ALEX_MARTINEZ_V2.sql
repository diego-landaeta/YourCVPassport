-- ============================================================================
-- COMPLETE ALEX MARTINEZ PROFILE V2 - TIER 1 TRANSFORMATION
-- Email: alex.martinez@iseih.edu | Gender: male | Summary: ~160 palabras
-- ============================================================================

DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'alex.martinez@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;

  UPDATE profiles SET
    gender = 'male',
    headline = 'AI in Healthcare Specialist',
    summary = 'I believe artificial intelligence will transform healthcare—not by replacing human care, but by augmenting clinical decision-making, personalizing treatment, and democratizing access to medical expertise. For six years, I''ve bridged technology and medicine, developing AI tools that have supported clinical decisions for 10,000+ patients across 15 healthcare institutions. My journey began as a software engineer who watched my diabetic mother struggle with treatment optimization. I realized AI could analyze patterns in her data that even specialists missed. That insight launched my mission. I teach healthcare professionals at ISEIH how to evaluate, implement, and ethically deploy AI tools—from diagnostic algorithms to predictive analytics—without needing to become programmers. My curriculum covers machine learning basics, clinical validation, algorithmic bias detection, and human-centered AI design. I''m passionate about AI equity, ensuring these tools serve underserved populations, not just wealthy health systems. My mission: to prepare healthcare for the AI revolution while preserving the irreplaceable human elements of healing—empathy, intuition, and presence.',
    updated_at = NOW()
  WHERE id = v_user_id;

  -- ACHIEVEMENTS (pattern shortened for space)
  UPDATE experiences SET achievements = ARRAY['Developed AI ethics curriculum used by 100+ health tech professionals','Consulted on 8 clinical AI deployments with patient safety focus','Published 5 articles on AI in healthcare journals','Maintained 94% student satisfaction'] WHERE profile_id = v_user_id AND position = 'AI in Healthcare Instructor';
  UPDATE experiences SET achievements = ARRAY['Led development of predictive analytics tools serving 15 hospitals','Built diabetes management AI supporting 5,000+ patients','Reduced hospital readmissions by 18% through AI-powered risk stratification'] WHERE profile_id = v_user_id AND position LIKE '%Health Tech Consultant%';
  UPDATE experiences SET achievements = ARRAY['Developed machine learning models for 12 healthcare applications','Specialized in NLP for clinical documentation and diagnostic support'] WHERE profile_id = v_user_id AND position LIKE '%Machine Learning Engineer%';
  UPDATE experiences SET achievements = ARRAY['Completed 300+ hours ML training focused on healthcare applications'] WHERE profile_id = v_user_id AND position LIKE '%AI Research%';

  -- PROJECTS
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, featured, sort_order, created_at) VALUES
  (v_user_id,'AI Ethics in Healthcare Toolkit','Comprehensive guide for evaluating AI tools in clinical settings. Covers bias detection, clinical validation, patient safety, and ethical deployment. Used by 100+ healthcare organizations.',
   'PROJECT',ARRAY['AI Ethics','Healthcare','Clinical Validation'],true,1,'2021-01-01'),
  (v_user_id,'Diabetes AI Management Platform','Machine learning platform analyzing glucose patterns, predicting hypo/hyperglycemia, and personalizing treatment recommendations. Supports 5,000+ patients across 15 clinics.',
   'PROJECT',ARRAY['AI','Diabetes','Predictive Analytics'],true,2,'2020-03-01'),
  (v_user_id,'Healthcare AI Literacy Course','8-week program teaching clinicians to evaluate AI tools without programming knowledge. Trained 200+ physicians, nurses, and administrators.',
   'PROJECT',ARRAY['Education','AI Literacy','Healthcare'],true,3,'2019-06-01');

  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order, created_at) VALUES
  (v_user_id,'Advisory Board - Healthcare AI Standards Consortium','Contribute expertise on clinical validation and ethical AI deployment. Help develop industry standards for healthcare AI safety and efficacy.',
   'COLLABORATION',ARRAY['Standards','Advisory Board','AI Safety'],4,'2020-01-01'),
  (v_user_id,'Research Partner - Medical AI Ethics Institute','Co-author research on algorithmic bias in clinical decision support. Published 3 peer-reviewed papers on AI fairness in healthcare.',
   'COLLABORATION',ARRAY['Research','AI Ethics','Publications'],5,'2019-01-01'),
  (v_user_id,'Pro-Bono Consultant - Community Health AI Project','Provide free AI consulting to safety-net hospitals. Help implement AI tools improving care for underserved populations.',
   'COLLABORATION',ARRAY['Pro-Bono','Community Health','Health Equity'],6,'2018-06-01');

  -- STAMPS
  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED','{"email":"alex.martinez@iseih.edu"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{"document_type":"Passport"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED','{"degree":"AI & Machine Learning"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{"position":"AI in Healthcare Instructor"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{"languages":["English","Spanish"]}'::jsonb,'manual',NOW(),NOW());

  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',
    jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';

  RAISE NOTICE '✅ ALEX MARTINEZ COMPLETED';
END $$;
