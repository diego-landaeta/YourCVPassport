-- COMPLETE ROBERT KIM V2 - TIER 1 | robert.kim@iseih.edu | male
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='robert.kim@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='male', headline='Acupressure & Asian Bodywork Therapist',
    summary='I believe the body''s meridian system is a map to healing—that by stimulating specific points, we can restore qi flow, relieve pain, and activate the body''s self-healing capacity without needles or invasive intervention. For 13 years, I''ve practiced acupressure and Asian bodywork, helping 700+ clients address pain, stress, and chronic conditions through the wisdom of Traditional Chinese Medicine. My journey began learning from my grandmother in Korea, who treated village ailments with her skilled hands and deep knowledge of pressure points. That hands-on education evolved into formal training in Jin Shin Do, Shiatsu, and Tui Na. At ISEIH, I teach healthcare practitioners meridian theory, point location, and therapeutic protocols they can integrate into their practice. I bridge ancient TCM principles with modern pain science and nervous system regulation. I''m passionate about preserving traditional Asian healing arts while making them accessible to diverse practitioners. My mission: to honor ancestral healing wisdom while proving its clinical relevance today.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 200+ practitioners in acupressure techniques','Developed TCM meridian curriculum','97% student satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['700+ acupressure sessions','Specialized in chronic pain and stress relief','4.8/5 client satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Therapist%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Acupressure for Pain Management','Clinical protocols using acupressure for chronic pain, migraines, and musculoskeletal conditions.',
   'PROJECT',ARRAY['Acupressure','Pain Management','TCM'],true,1,'2019-01-01'),
  (v_user_id,'Meridian Theory for Western Practitioners','Educational program teaching TCM meridian theory to practitioners without Asian medicine background.',
   'PROJECT',ARRAY['Meridian Theory','Education','TCM'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Board Member - Asian Bodywork Therapy Association','Serve on professional standards committee preserving traditional practices while advancing clinical recognition.',
   'COLLABORATION',ARRAY['Professional Association','Cultural Preservation'],4,'2018-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED','{"email":"robert.kim@iseih.edu"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED','{"degree":"Asian Bodywork Therapy"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{"languages":["English","Korean"]}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ ROBERT KIM COMPLETED';
END $$;
