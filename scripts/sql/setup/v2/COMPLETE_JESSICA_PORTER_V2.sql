-- ============================================================================
-- COMPLETE JESSICA PORTER PROFILE V2 - TIER 1 TRANSFORMATION
-- ============================================================================
-- Email: jessica.porter@iseih.edu
-- Summary: ~160 palabras (más breve, igual convincente)
-- Gender: female | Achievements: 17 | Projects: 3 | Collaborations: 3 | Stamps: 8
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  SELECT id INTO v_user_id FROM auth.users WHERE email = 'jessica.porter@iseih.edu';
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Usuario no encontrado: jessica.porter@iseih.edu'; END IF;

  RAISE NOTICE '👤 Completando perfil: Jessica Porter';

  -- UPDATE PROFILE
  UPDATE profiles SET
    gender = 'female',
    headline = 'Biofeedback Specialist',
    summary = 'I believe the body speaks in signals we''ve forgotten how to hear—heart rate variability, muscle tension, skin conductance—each revealing pathways to self-regulation and healing. For eight years, I''ve used biofeedback technology to help 350+ people learn to control stress responses, manage chronic pain, and optimize performance by making the invisible visible. My journey began during my own struggle with anxiety and migraines. When pharmaceuticals offered only side effects, I discovered biofeedback—watching my physiology in real-time, learning to shift nervous system patterns through awareness alone. That transformation ignited my mission. At ISEIH, I train healthcare practitioners in biofeedback protocols for stress, pain, anxiety, ADHD, and peak performance. I teach the science of psychophysiology, hands-on sensor placement, protocol design, and client coaching. My approach integrates heart rate variability training, neurofeedback principles, and mindfulness-based stress reduction. I''m particularly passionate about making biofeedback accessible beyond clinical settings—teaching people to become experts in their own nervous system. My mission: to democratize biofeedback as a tool for self-mastery, proving that with awareness and practice, we can rewire our stress responses.',
    updated_at = NOW()
  WHERE id = v_user_id;

  -- ACHIEVEMENTS
  UPDATE experiences SET achievements = ARRAY[
    'Developed 8 biofeedback training modules used by 120+ practitioners',
    'Created clinical protocols for stress, pain, and performance optimization',
    'Trained professionals in HRV, EMG, and temperature biofeedback modalities',
    'Maintained 95% student satisfaction across 28 cohorts'
  ] WHERE profile_id = v_user_id AND position = 'Biofeedback Instructor';

  UPDATE experiences SET achievements = ARRAY[
    'Conducted 400+ biofeedback sessions with 87% client improvement rate',
    'Specialized in chronic pain, anxiety, migraine, and peak performance',
    'Achieved average client satisfaction of 4.8/5 across 150+ reviews',
    'Published 4 case studies in biofeedback journals'
  ] WHERE profile_id = v_user_id AND position = 'Biofeedback Practitioner';

  UPDATE experiences SET achievements = ARRAY[
    'Provided biofeedback services to 250+ clients over 4 years',
    'Integrated biofeedback with psychotherapy for anxiety and trauma',
    'Pioneered HRV training protocols for stress resilience',
    'Co-led 12 stress management workshops combining biofeedback and CBT'
  ] WHERE profile_id = v_user_id AND position = 'Clinical Biofeedback Therapist';

  UPDATE experiences SET achievements = ARRAY[
    'Completed 200+ supervised biofeedback training hours',
    'Assisted in treatment of 80+ client cases',
    'Mastered 5 biofeedback modalities: HRV, EMG, temperature, GSR, respiration'
  ] WHERE profile_id = v_user_id AND position = 'Biofeedback Intern';

  RAISE NOTICE '✅ Achievements: 17 totales';

  -- PROJECTS
  INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, featured, sort_order, created_at) VALUES
  (v_user_id, 'Stress Mastery Program - 6-Week Biofeedback Training',
   'Comprehensive stress resilience program using heart rate variability biofeedback. Teaches clients to regulate nervous system responses through real-time physiological feedback. 6-week protocol includes HRV assessment, personalized training sessions, home practice with portable devices, and stress resilience coaching. Completed by 150+ clients with 85% reporting significant stress reduction. Includes client workbooks, practice protocols, and device recommendations. Featured in Journal of Applied Psychophysiology 2021. Program addresses chronic stress, anxiety, insomnia, and burnout prevention.',
   'PROJECT', 'https://jessicaporter-biofeedback.com/stress-mastery',
   ARRAY['Biofeedback', 'HRV Training', 'Stress Management', 'Nervous System', 'Self-Regulation'], true, 1, '2020-01-01'),

  (v_user_id, 'Chronic Pain Biofeedback Protocol - Clinical Toolkit',
   'Evidence-based biofeedback protocols for chronic pain management. Covers EMG biofeedback for muscle tension, temperature training for circulation, and HRV for pain-related stress. Includes protocols for fibromyalgia, tension headaches, TMJ, and chronic back pain. Used by 80+ pain management practitioners. Features assessment guides, sensor placement diagrams, session-by-session protocols, and home practice exercises. Integrates pain neuroscience education with biofeedback training. 120 pages with client handouts and case examples.',
   'PROJECT', 'https://jessicaporter-biofeedback.com/pain-protocol',
   ARRAY['Chronic Pain', 'EMG Biofeedback', 'Pain Management', 'Clinical Protocol'], true, 2, '2021-03-01'),

  (v_user_id, 'Peak Performance Biofeedback - Athlete & Executive Training',
   'Biofeedback training program for optimal performance under pressure. Teaches athletes, executives, and performers to access flow states, manage performance anxiety, and optimize arousal levels. 8-week program combines HRV training, respiratory biofeedback, and mental rehearsal techniques. Trained 60+ high performers including college athletes, business leaders, and musicians. Includes pre/post performance assessments, personalized training protocols, and competition/presentation preparation strategies. Integrates sport psychology principles with psychophysiological training.',
   'PROJECT', 'https://jessicaporter-biofeedback.com/peak-performance',
   ARRAY['Peak Performance', 'Sports Psychology', 'Flow State', 'Executive Coaching'], true, 3, '2019-06-01');

  RAISE NOTICE '✅ Projects: 3';

  -- COLLABORATIONS
  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order, created_at) VALUES
  (v_user_id, 'Research Collaborator - Biofeedback Research Institute',
   'Contribute client outcome data to ongoing biofeedback efficacy research. Co-authored 2 peer-reviewed publications on HRV biofeedback for anxiety and chronic pain in journals including Applied Psychophysiology and Biofeedback. Research focus: psychophysiological mechanisms of biofeedback training and predictors of treatment response. Participate in quarterly research meetings and annual conference presentations. Work cited in clinical practice guidelines for biofeedback practitioners.',
   'COLLABORATION', ARRAY['Research', 'Publications', 'Evidence-Based', 'Clinical Outcomes'], 4, '2018-01-01'),

  (v_user_id, 'Board Member - Biofeedback Certification International Alliance',
   'Serve on professional standards committee developing certification requirements for biofeedback practitioners. Contribute expertise in clinical training standards, ethical practice guidelines, and continuing education requirements. Mentor practitioners preparing for board certification. Represent profession at integrative healthcare conferences. Advocate for biofeedback recognition in insurance reimbursement and scope of practice regulations.',
   'COLLABORATION', ARRAY['Professional Association', 'Certification', 'Standards', 'Mentorship'], 5, '2019-01-01'),

  (v_user_id, 'Volunteer Clinician - Veterans Stress Recovery Program',
   'Provide pro-bono biofeedback training to veterans with PTSD and stress-related conditions. Donated 250+ clinical hours serving 60+ veterans since 2017. Specialize in HRV training for emotional regulation and sleep improvement. Partner with VA hospitals and veteran service organizations. Train peer support specialists in basic stress management techniques. Received Community Service Award from Veterans Foundation 2020.',
   'COLLABORATION', ARRAY['Pro-Bono', 'Veterans Health', 'PTSD', 'Community Service'], 6, '2017-06-01');

  RAISE NOTICE '✅ Collaborations: 3';

  -- STAMPS
  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES
  (v_user_id, 'EMAIL', 'VERIFIED', '{"email": "jessica.porter@iseih.edu", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  (v_user_id, 'IDENTITY', 'VERIFIED', '{"document_type": "Passport", "document_number": "****8451", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  (v_user_id, 'EDUCATION', 'VERIFIED', '{"degree": "Biofeedback Certification", "institution": "BCIA", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  (v_user_id, 'EMPLOYMENT', 'VERIFIED', '{"position": "Biofeedback Instructor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW()),
  (v_user_id, 'LANGUAGE', 'VERIFIED', '{"languages": ["English (Native)"], "verified_method": "manual_admin"}'::jsonb, 'manual', NOW(), NOW());

  INSERT INTO stamps (profile_id, type, status, entity_type, evidence, provider, verified_at, created_at)
  SELECT v_user_id, 'CERTIFICATION', 'VERIFIED', 'CERTIFICATION',
    jsonb_build_object('certification_title', title, 'verified_method', 'manual_admin'),
    'Admin Manual Review', NOW(), NOW()
  FROM portfolio_items WHERE profile_id = v_user_id AND type = 'CERTIFICATION';

  RAISE NOTICE '✅ Stamps: 8 totales';
  RAISE NOTICE '✅ JESSICA PORTER PROFILE V2 COMPLETED';

END $$;
