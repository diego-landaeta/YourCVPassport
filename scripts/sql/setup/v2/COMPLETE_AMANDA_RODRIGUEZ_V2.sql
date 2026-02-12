-- COMPLETE AMANDA RODRIGUEZ V2 - TIER 1 | amanda.rodriguez@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='amanda.rodriguez@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Conscious Leadership Coach',
    summary='I believe leadership is not about authority—it''s about presence, integrity, and the courage to lead from your highest self. For 9 years, I''ve coached 150+ leaders to move from reactive management to conscious leadership, where decisions align with values and organizations thrive through authentic connection. My approach integrates mindfulness, emotional intelligence, and systemic thinking to help leaders cultivate awareness, communicate authentically, and create cultures of trust. I work with executives, founders, and changemakers navigating complex challenges—mergers, cultural transformation, ethical dilemmas—helping them lead with wisdom instead of ego. At ISEIH, I train coaches and consultants in conscious leadership frameworks, teaching them to facilitate transformational conversations that shift how leaders see themselves and their impact. I''m passionate about bringing contemplative practices into the boardroom, proving that self-awareness and compassion are not soft skills—they''re strategic necessities. My mission: to cultivate a generation of leaders who serve the collective good.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Coached 150+ leaders in conscious leadership practices','Developed transformational leadership curriculum','Facilitated 40+ executive retreats','96% client satisfaction'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Supported 80+ organizational transformations','Specialized in values-based decision making and authentic communication','Reduced leadership turnover by 35% in client organizations'] WHERE profile_id=v_user_id AND position LIKE '%Coach%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Conscious Leadership Training Program','12-week intensive program teaching leaders presence-based decision making, authentic communication, and systemic awareness. Participants develop mindfulness practices and learn to lead from values instead of fear.',
   'PROJECT',ARRAY['Leadership','Mindfulness','Organizational Development'],true,1,'2020-01-01'),
  (v_user_id,'Mindful Organizations Initiative','Consulting program helping organizations integrate contemplative practices into leadership culture. Includes executive coaching, team facilitation, and systemic change support.',
   'PROJECT',ARRAY['Mindfulness','Consulting','Cultural Transformation'],true,2,'2019-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Leadership Circle Facilitator','Monthly conscious leadership circles for executives exploring authentic leadership practices. Create safe spaces for vulnerability, peer coaching, and collective wisdom.',
   'COLLABORATION',ARRAY['Community','Leadership Development'],4,'2018-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','amanda.rodriguez@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Leadership Coaching'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED','{}'::jsonb,'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ AMANDA RODRIGUEZ COMPLETED';
END $$;
