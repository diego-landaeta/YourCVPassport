-- COMPLETE MARIA GONZALEZ V2 - TIER 1 | maria.gonzalez@iseih.edu | female
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email='maria.gonzalez@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado'; END IF;
  UPDATE profiles SET gender='female', headline='Culturally Responsive Family Therapist',
    summary='I believe healing happens in context—that effective therapy must honor the cultural, familial, and spiritual frameworks that shape how people understand themselves and their struggles. For 13 years, I''ve practiced culturally responsive family therapy, supporting 250+ families navigate intergenerational conflict, acculturation stress, and systemic challenges while preserving cultural identity and family bonds. My work bridges worlds. As a first-generation immigrant, I lived the tension between honoring my family''s values and forging my own path in a new culture. That personal experience taught me that families don''t need to choose between tradition and change—they need skilled support navigating both. I trained in structural and narrative family therapy, always asking: How does culture shape this family''s story? At ISEIH, I teach therapists to work with immigrant and multicultural families, addressing language barriers, cultural humility, acculturation dynamics, and intergenerational trauma. I help practitioners recognize their own cultural assumptions and develop genuine competence beyond superficial diversity training. My mission: to make family therapy truly accessible across cultures.',
    updated_at=NOW() WHERE id=v_user_id;
  UPDATE experiences SET achievements=ARRAY['Trained 200+ therapists in culturally responsive practice','Developed multicultural family therapy curriculum','96% student satisfaction','Specialized in immigrant family systems'] WHERE profile_id=v_user_id AND position LIKE '%Instructor%';
  UPDATE experiences SET achievements=ARRAY['Provided therapy to 250+ immigrant and multicultural families','Fluent therapeutic services in English and Spanish','85% family cohesion improvement rate'] WHERE profile_id=v_user_id AND position LIKE '%Therapist%';
  -- PROJECTS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,featured,sort_order,created_at) VALUES
  (v_user_id,'Culturally Responsive Family Therapy Training','Comprehensive program teaching therapists to work effectively with immigrant and multicultural families. Addresses acculturation, intergenerational conflict, and cultural humility.',
   'PROJECT',ARRAY['Family Therapy','Cultural Competence','Immigration'],true,1,'2020-01-01'),
  (v_user_id,'Bilingual Therapy Resources Library','Open-access library of culturally adapted therapeutic tools, assessment instruments, and psychoeducational materials in English and Spanish for family therapists.',
   'PROJECT',ARRAY['Bilingual Resources','Cultural Adaptation','Open Access'],true,2,'2019-01-01');
  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id,title,description,type,tags,sort_order,created_at) VALUES
  (v_user_id,'Immigrant Family Support Network','Co-founded community network providing free family therapy, legal referrals, and resource navigation for recently arrived immigrant families facing acculturation challenges.',
   'COLLABORATION',ARRAY['Pro-Bono','Immigration','Community'],4,'2018-01-01');
  INSERT INTO stamps (profile_id,type,status,evidence,provider,verified_at,created_at) VALUES
  (v_user_id,'EMAIL','VERIFIED',jsonb_build_object('email','maria.gonzalez@iseih.edu'),'manual',NOW(),NOW()),
  (v_user_id,'IDENTITY','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'EDUCATION','VERIFIED',jsonb_build_object('degree','Family Therapy'),'manual',NOW(),NOW()),
  (v_user_id,'EMPLOYMENT','VERIFIED','{}'::jsonb,'manual',NOW(),NOW()),
  (v_user_id,'LANGUAGE','VERIFIED',jsonb_build_object('languages',ARRAY['English','Spanish']),'manual',NOW(),NOW());
  INSERT INTO stamps (profile_id,type,status,entity_type,evidence,provider,verified_at,created_at)
  SELECT v_user_id,'CERTIFICATION','VERIFIED','CERTIFICATION',jsonb_build_object('certification_title',title),'Admin',NOW(),NOW()
  FROM portfolio_items WHERE profile_id=v_user_id AND type='CERTIFICATION';
  RAISE NOTICE '✅ MARIA GONZALEZ COMPLETED';
END $$;
