-- COMPLETE THOMAS RIVERA V2 - TIER 1 | thomas.rivera@iseih.edu | male
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='thomas.rivera@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='male', headline='Perennial Philosophy Scholar & Teacher',
    summary='I believe the world''s spiritual traditions share a common core of wisdom—the Perennial Philosophy—that transcends cultural differences and offers universal truths about consciousness, ethics, and the nature of reality. For 18 years, I''ve studied and taught comparative mysticism, helping 500+ students discover the golden thread connecting Sufism, Vedanta, Christian mysticism, Buddhism, and indigenous wisdom traditions. My work reveals unity beneath apparent diversity. My journey began as a graduate student studying world religions academically, feeling disconnected from the living wisdom they contained. A sabbatical in India changed everything—I practiced with Vedanta teachers, Sufi masters, and Buddhist monks, discovering direct experience of what I had only studied intellectually. I returned committed to teaching not about spirituality but from it. At ISEIH, I teach comparative mysticism, perennial philosophy, and contemplative approaches to religious studies. I help students move beyond relativism and fundamentalism to recognize universal patterns in mystical experience across traditions. I''m passionate about interfaith dialogue grounded in shared contemplative practice. My mission: to reveal the deep unity underlying spiritual diversity.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Taught 500+ students in perennial philosophy and comparative mysticism','Developed interfaith contemplative curriculum','98% student satisfaction','Published 2 books on perennial wisdom traditions'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['20+ years personal practice across multiple traditions','Facilitated 100+ interfaith dialogue sessions','Specialized in mystical experience and contemplative epistemology'] WHERE profile_id=v_user_id AND position LIKE '%Scholar%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Perennial Wisdom Intensive','9-month journey through world mystical traditions exploring universal themes: non-dual awareness, love mysticism, contemplative practice, and transformation. Combines study with practice.',
   'PROJECT',ARRAY['Perennial Philosophy','Mysticism','Comparative Religion'],true,1,'2019-01-01'),
  (v_user_id,'Interfaith Contemplative Practice Groups','Monthly practice groups bringing together practitioners from diverse traditions for shared meditation, dialogue, and discovery of common ground through direct experience.',
   'PROJECT',ARRAY['Interfaith','Contemplative Practice','Dialogue'],true,2,'2018-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Council for Parliament of World Religions - Facilitator','Facilitate interfaith dialogue sessions at global interfaith gatherings. Create space for deep listening across religious divides and discovery of shared wisdom.',
   'COLLABORATION',ARRAY['Interfaith','Global','Facilitation'],4,'2016-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','thomas.rivera@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Religious Studies, PhD'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED',jsonb_build_object('languages',ARRAY['English','Spanish','Sanskrit']),'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ THOMAS RIVERA COMPLETED';
END $$;
