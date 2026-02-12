-- COMPLETE MARK DAVIDSON V2 - TIER 1 | mark.davidson@iseih.edu | male
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='mark.davidson@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='male', headline='Nonviolent Communication Trainer',
    summary='I believe every conflict contains a conversation trying to happen—that beneath anger, blame, and defensiveness live unmet needs and unspoken longings. For 10 years, I''ve taught Nonviolent Communication (NVC) to 600+ people across organizations, schools, and conflict zones, proving that how we speak can either escalate violence or cultivate connection. My journey into NVC began after my own anger destroyed a relationship I cherished. In my desperation, I discovered Marshall Rosenberg''s work and learned that my rage was really grief, fear, and a desperate need for understanding. Learning to speak from needs instead of judgments transformed every relationship in my life. At ISEIH, I train educators, therapists, and mediators in NVC principles: observations without evaluation, feelings without blame, needs without demands, requests without coercion. I facilitate practice sessions where professionals learn to stay present with conflict instead of fleeing or fighting. I''m passionate about bringing NVC to prisons, schools, and communities torn by violence. My mission: to spread a language of compassion that can heal one conversation at a time.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 600+ professionals in NVC across 12 countries','Developed conflict transformation curriculum','98% student satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Facilitated 200+ NVC workshops in schools, prisons, and organizations','Specialized in restorative justice and mediation','Conflict resolution success rate: 75%'] WHERE profile_id=v_user_id AND position LIKE '%Trainer%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'NVC in Schools Program','Comprehensive program teaching educators and students conflict resolution through compassionate communication.',
   'PROJECT',ARRAY['NVC','Education','Conflict Resolution'],true,1,'2019-01-01'),
  (v_user_id,'Restorative Justice NVC Protocols','Evidence-based protocols integrating NVC into restorative justice practices for criminal justice and educational settings.',
   'PROJECT',ARRAY['Restorative Justice','NVC','Mediation'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Volunteer Facilitator - Prison NVC Program','Teach NVC to incarcerated individuals, facilitating healing conversations and conflict transformation in correctional facilities.',
   'COLLABORATION',ARRAY['Pro-Bono','Criminal Justice','NVC'],4,'2016-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED','{"email":"mark.davidson@iseih.edu"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED','{"degree":"NVC Certification"}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ MARK DAVIDSON COMPLETED';
END $$;
