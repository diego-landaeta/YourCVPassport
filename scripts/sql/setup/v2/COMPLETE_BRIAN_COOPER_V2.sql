-- COMPLETE BRIAN COOPER V2 - TIER 1 | brian.cooper@iseih.edu | male
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='brian.cooper@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='male', headline='Energy Psychology Practitioner (EFT)',
    summary='I believe our bodies hold the emotional imprints of every unresolved trauma, and that by working directly with the body''s energy system, we can release what talk therapy alone cannot reach. For 10 years, I''ve practiced Energy Psychology—particularly Emotional Freedom Techniques (EFT)—helping 500+ clients resolve anxiety, phobias, PTSD, and chronic stress through meridian-based interventions. My journey began with my own panic disorder, which resisted years of traditional therapy until I discovered EFT. Tapping on acupressure points while processing difficult emotions transformed my life. That personal healing ignited my mission to bring Energy Psychology to mainstream mental health. At ISEIH, I train therapists and coaches in evidence-based Energy Psychology protocols. I teach the science behind why tapping works—neuroplasticity, memory reconsolidation, stress response regulation—and how to integrate it ethically into clinical practice. I''m passionate about researching Energy Psychology''s mechanisms and building credibility for what many dismiss as "woo." My mission: to legitimize body-based healing in mental health.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 220+ practitioners in EFT and Energy Psychology','Developed evidence-based meridian tapping curriculum','97% student satisfaction','Published research on EFT efficacy'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['500+ EFT sessions with 85% symptom reduction','Specialized in trauma, anxiety disorders, and phobias','4.8/5 client satisfaction rating'] WHERE profile_id=v_user_id AND position LIKE '%Practitioner%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'EFT for PTSD Protocol','Evidence-based clinical protocol using Emotional Freedom Techniques for trauma resolution. Integrates exposure therapy principles with meridian tapping for safe memory reconsolidation.',
   'PROJECT',ARRAY['EFT','PTSD','Trauma'],true,1,'2019-01-01'),
  (v_user_id,'Energy Psychology Foundations Course','Comprehensive training teaching therapists to integrate meridian-based interventions into clinical practice. Covers theory, research, ethics, and practical applications.',
   'PROJECT',ARRAY['Energy Psychology','Clinical Training','Meridian Therapy'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Research Contributor - Energy Psychology Journal','Submit case studies and clinical research supporting Energy Psychology efficacy. Contribute to growing evidence base for meridian-based therapies.',
   'COLLABORATION',ARRAY['Research','Evidence-Based Practice'],4,'2017-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','brian.cooper@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','EFT Certification'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ BRIAN COOPER COMPLETED';
END $$;
