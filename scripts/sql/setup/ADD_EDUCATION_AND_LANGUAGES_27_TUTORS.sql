-- ============================================================================
-- ADD EDUCATION & LANGUAGES FOR 27 TUTORS MISSING THIS DATA
-- ============================================================================
-- TIER 1 Phase 2B (10 tutors) + TIER 3 (16 tutors) + Nicole Taylor (1)
-- Format matches TIER 2 existing scripts (CREAR_*_COMPLETO.sql)
-- SAFE: Deletes existing education/languages before inserting to avoid duplicates
-- ============================================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- ================================================================
  -- 1. REBECCA ANDERSON - Naturopathic Physician
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'rebecca.anderson@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Bastyr University', 'Doctor of Naturopathic Medicine (ND)', 'Naturopathic Medicine and Botanical Therapeutics', '2010-09-01', '2014-06-30', false, 'Summa Cum Laude (GPA 3.92/4.0)', 1, true, NOW(), NULL),
    (v_user_id, 'University of Washington', 'B.S. in Biology', 'Biology with emphasis in Biochemistry', '2006-09-01', '2010-05-30', false, 'Magna Cum Laude (GPA 3.80/4.0)', 2, true, NOW(), NULL),
    (v_user_id, 'Institute for Functional Medicine', 'Certified Practitioner (IFMCP)', 'Functional Medicine', '2015-01-01', '2015-12-31', false, 'Certification with Distinction', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Spanish', 'A2', false, 2);

    RAISE NOTICE '✅ Rebecca Anderson - education & languages added';
  END IF;

  -- ================================================================
  -- 2. KAREN WHITE - Certified Nutritionist
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'karen.white@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'University of Bridgeport', 'M.S. in Nutrition', 'Functional Nutrition and Clinical Dietetics', '2012-09-01', '2014-06-30', false, 'GPA 3.88/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of Connecticut', 'B.S. in Nutritional Sciences', 'Nutritional Sciences and Food Chemistry', '2008-09-01', '2012-05-30', false, 'GPA 3.75/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'American Nutrition Association', 'Certified Nutrition Specialist (CNS)', 'Clinical and Functional Nutrition', '2015-01-01', '2015-08-31', false, 'Board Certified', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'French', 'A2', false, 2);

    RAISE NOTICE '✅ Karen White - education & languages added';
  END IF;

  -- ================================================================
  -- 3. PAUL HENDERSON - Registered Herbalist
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'paul.henderson@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Maryland University of Integrative Health', 'M.S. in Herbal Medicine', 'Clinical Herbalism and Phytochemistry', '2011-09-01', '2013-06-30', false, 'GPA 3.90/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of Georgia', 'B.S. in Botany', 'Botany and Plant Biology', '2007-09-01', '2011-05-30', false, 'GPA 3.72/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'American Herbalists Guild', 'Registered Herbalist (RH)', 'Clinical Herbalism and Botanical Medicine', '2014-01-01', '2014-12-31', false, 'Professional Registration', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Spanish', 'A2', false, 2);

    RAISE NOTICE '✅ Paul Henderson - education & languages added';
  END IF;

  -- ================================================================
  -- 4. JESSICA PORTER - Biofeedback Specialist
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'jessica.porter@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Saybrook University', 'M.A. in Mind-Body Medicine', 'Psychophysiology and Biofeedback', '2013-09-01', '2015-06-30', false, 'GPA 3.87/4.0 - Magna Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of North Carolina', 'B.S. in Psychology', 'Psychology with Neuroscience emphasis', '2009-09-01', '2013-05-30', false, 'GPA 3.70/4.0 - Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Biofeedback Certification International Alliance', 'Board Certified in Biofeedback (BCB)', 'Clinical Biofeedback and HRV Training', '2016-01-01', '2016-06-30', false, 'BCIA Board Certified', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Spanish', 'A2', false, 2);

    RAISE NOTICE '✅ Jessica Porter - education & languages added';
  END IF;

  -- ================================================================
  -- 5. ALEX MARTINEZ - AI in Healthcare Specialist (bilingual)
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'alex.martinez@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Stanford University', 'M.S. in Biomedical Informatics', 'Clinical AI and Machine Learning in Healthcare', '2015-09-01', '2017-06-30', false, 'GPA 3.91/4.0 - With Distinction', 1, true, NOW(), NULL),
    (v_user_id, 'University of Texas at Austin', 'B.S. in Computer Science', 'Computer Science with Healthcare Applications', '2011-09-01', '2015-05-30', false, 'GPA 3.82/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'MIT Professional Education', 'Certificate in AI Ethics', 'Artificial Intelligence Ethics and Governance', '2018-06-01', '2018-08-31', false, 'Professional Certificate', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Spanish', 'C2', false, 2);

    RAISE NOTICE '✅ Alex Martinez - education & languages added';
  END IF;

  -- ================================================================
  -- 6. DIANA RUSSELL - Licensed Massage Therapist
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'diana.russell@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'National Holistic Institute', 'Diploma in Advanced Massage Therapy', 'Clinical Massage Therapy and Myofascial Release', '2009-09-01', '2011-06-30', false, 'Top of Class - Honors', 1, true, NOW(), NULL),
    (v_user_id, 'San Francisco State University', 'B.S. in Kinesiology', 'Kinesiology and Human Movement Sciences', '2005-09-01', '2009-05-30', false, 'GPA 3.68/4.0 - Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Upledger Institute', 'CranioSacral Therapy Certification', 'CranioSacral Therapy Techniques I & II', '2012-01-01', '2012-12-31', false, 'Certified Practitioner', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Italian', 'A2', false, 2);

    RAISE NOTICE '✅ Diana Russell - education & languages added';
  END IF;

  -- ================================================================
  -- 7. MICHELLE CHANG - Reiki Master Teacher
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'michelle.chang@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Prescott College', 'B.A. in Holistic Health', 'Holistic Health and Integrative Wellness', '2006-09-01', '2010-05-30', false, 'GPA 3.78/4.0 - Magna Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'International Center for Reiki Training', 'Usui Reiki Master/Teacher Certification', 'Traditional Japanese Reiki Healing', '2011-01-01', '2012-06-30', false, 'Master Level Certification', 2, true, NOW(), NULL),
    (v_user_id, 'Healing Touch Program', 'Certified Healing Touch Practitioner', 'Energy Medicine and Biofield Therapies', '2013-01-01', '2013-12-31', false, 'Certified Practitioner', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'Mandarin Chinese', 'Native', true, 1),
    (v_user_id, 'English', 'C1', false, 2);

    RAISE NOTICE '✅ Michelle Chang - education & languages added';
  END IF;

  -- ================================================================
  -- 8. ROBERT KIM - Acupressure & Asian Bodywork Therapist (Korean heritage)
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'robert.kim@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Pacific College of Health and Science', 'M.S. in Traditional Oriental Medicine', 'Traditional Chinese Medicine and Asian Bodywork', '2008-09-01', '2012-06-30', false, 'GPA 3.89/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of California, Los Angeles', 'B.S. in Physiological Science', 'Physiological Science and Human Biology', '2004-09-01', '2008-05-30', false, 'GPA 3.74/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Jin Shin Do Foundation', 'Authorized Jin Shin Do Practitioner', 'Acupressure and Meridian Therapy', '2013-01-01', '2013-12-31', false, 'Authorized Practitioner', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'Korean', 'Native', true, 1),
    (v_user_id, 'English', 'C1', false, 2);

    RAISE NOTICE '✅ Robert Kim - education & languages added';
  END IF;

  -- ================================================================
  -- 9. CATHERINE ADAMS - Licensed Marriage & Family Therapist
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'catherine.adams@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Alliant International University', 'M.A. in Marriage and Family Therapy', 'Couples Therapy and Attachment-Based Approaches', '2010-09-01', '2012-06-30', false, 'GPA 3.93/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of California, Berkeley', 'B.A. in Psychology', 'Psychology with Clinical emphasis', '2006-09-01', '2010-05-30', false, 'GPA 3.81/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'International Centre for Excellence in Emotionally Focused Therapy', 'Certified EFT Therapist', 'Emotionally Focused Couples Therapy', '2014-01-01', '2015-06-30', false, 'Certified Therapist', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Spanish', 'B1', false, 2);

    RAISE NOTICE '✅ Catherine Adams - education & languages added';
  END IF;

  -- ================================================================
  -- 10. MARK DAVIDSON - Nonviolent Communication Trainer
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'mark.davidson@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'George Mason University', 'M.S. in Conflict Analysis and Resolution', 'Conflict Resolution and Restorative Justice', '2011-09-01', '2013-06-30', false, 'GPA 3.86/4.0 - Magna Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of Virginia', 'B.A. in Communication Studies', 'Communication and Interpersonal Dynamics', '2007-09-01', '2011-05-30', false, 'GPA 3.71/4.0 - Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Center for Nonviolent Communication', 'Certified NVC Trainer', 'Nonviolent Communication Facilitation', '2014-01-01', '2015-12-31', false, 'CNVC Certified Trainer', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Spanish', 'B1', false, 2);

    RAISE NOTICE '✅ Mark Davidson - education & languages added';
  END IF;

  -- ================================================================
  -- 11. AMANDA RODRIGUEZ - Conscious Leadership Coach
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'amanda.rodriguez@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Georgetown University', 'M.A. in Leadership Studies', 'Organizational Leadership and Executive Coaching', '2012-09-01', '2014-06-30', false, 'GPA 3.88/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of Miami', 'B.A. in Psychology', 'Organizational Psychology and Business', '2008-09-01', '2012-05-30', false, 'GPA 3.76/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Conscious Leadership Group', 'Certified Conscious Leadership Coach', 'Mindful Leadership and Systemic Thinking', '2015-01-01', '2015-12-31', false, 'Professional Certification', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'Spanish', 'Native', true, 1),
    (v_user_id, 'English', 'C1', false, 2);

    RAISE NOTICE '✅ Amanda Rodriguez - education & languages added';
  END IF;

  -- ================================================================
  -- 12. ANGELA ROBERTS - Personal Growth & Life Design Coach
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'angela.roberts@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'University of Pennsylvania', 'M.A. in Applied Positive Psychology', 'Positive Psychology and Human Flourishing', '2009-09-01', '2011-06-30', false, 'GPA 3.90/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'Boston University', 'B.A. in Psychology', 'Psychology and Behavioral Sciences', '2005-09-01', '2009-05-30', false, 'GPA 3.73/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'International Coaching Federation', 'Professional Certified Coach (PCC)', 'Life Coaching and Personal Development', '2012-01-01', '2013-06-30', false, 'ICF Professional Certified', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'French', 'A2', false, 2);

    RAISE NOTICE '✅ Angela Roberts - education & languages added';
  END IF;

  -- ================================================================
  -- 13. BRIAN COOPER - Energy Psychology Practitioner (EFT)
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'brian.cooper@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Saybrook University', 'M.A. in Clinical Psychology', 'Mind-Body Medicine and Energy Psychology', '2011-09-01', '2013-06-30', false, 'GPA 3.84/4.0 - Magna Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of Michigan', 'B.S. in Psychology', 'Psychology with Neuroscience emphasis', '2007-09-01', '2011-05-30', false, 'GPA 3.69/4.0 - Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Association for Comprehensive Energy Psychology', 'Certified Energy Practitioner (CEP)', 'Emotional Freedom Techniques and Energy Psychology', '2014-01-01', '2014-12-31', false, 'ACEP Certified', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'German', 'A2', false, 2);

    RAISE NOTICE '✅ Brian Cooper - education & languages added';
  END IF;

  -- ================================================================
  -- 14. CHRISTOPHER BARNES - Movement Therapist & Somatic Educator
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'christopher.barnes@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Naropa University', 'M.A. in Somatic Psychology', 'Somatic Movement Therapy and Body-Mind Integration', '2010-09-01', '2012-06-30', false, 'GPA 3.87/4.0 - Magna Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'Ohio State University', 'B.S. in Kinesiology', 'Human Movement Science and Motor Behavior', '2006-09-01', '2010-05-30', false, 'GPA 3.74/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Somatic Experiencing International', 'Somatic Experiencing Practitioner (SEP)', 'Trauma Resolution through Somatic Methods', '2013-01-01', '2015-06-30', false, 'Certified Practitioner', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Portuguese', 'A2', false, 2);

    RAISE NOTICE '✅ Christopher Barnes - education & languages added';
  END IF;

  -- ================================================================
  -- 15. DANIEL FOSTER - Research Methodologist & Data Analyst
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'daniel.foster@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Columbia University', 'Ph.D. in Research Methods', 'Applied Statistics and Research Design', '2007-09-01', '2012-06-30', false, 'Dissertation with Distinction', 1, true, NOW(), NULL),
    (v_user_id, 'University of Wisconsin-Madison', 'M.S. in Statistics', 'Biostatistics and Quantitative Methods', '2005-09-01', '2007-05-30', false, 'GPA 3.92/4.0 - Summa Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Cornell University', 'B.A. in Mathematics', 'Mathematics and Statistical Sciences', '2001-09-01', '2005-05-30', false, 'GPA 3.80/4.0 - Magna Cum Laude', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'French', 'B1', false, 2);

    RAISE NOTICE '✅ Daniel Foster - education & languages added';
  END IF;

  -- ================================================================
  -- 16. ELIZABETH MORGAN - End-of-Life Doula & Palliative Care Specialist
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'elizabeth.morgan@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Smith College', 'M.S.W. in Clinical Social Work', 'Palliative Care and End-of-Life Support', '2007-09-01', '2009-06-30', false, 'GPA 3.91/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of Vermont', 'B.A. in Social Work', 'Social Work and Community Health', '2003-09-01', '2007-05-30', false, 'GPA 3.77/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'International End of Life Doula Association', 'Certified End-of-Life Doula', 'Death Doula Training and Vigil Planning', '2010-01-01', '2010-12-31', false, 'INELDA Certified', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Spanish', 'A2', false, 2);

    RAISE NOTICE '✅ Elizabeth Morgan - education & languages added';
  END IF;

  -- ================================================================
  -- 17. JANET LEE - Gerontology Specialist & Elder Care Advocate
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'janet.lee@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'University of Southern California', 'M.S. in Gerontology', 'Gerontology and Aging Services Administration', '2006-09-01', '2008-06-30', false, 'GPA 3.93/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of California, Irvine', 'B.A. in Psychology', 'Developmental Psychology and Aging', '2002-09-01', '2006-05-30', false, 'GPA 3.79/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'National Council of Certified Dementia Practitioners', 'Certified Dementia Practitioner (CDP)', 'Person-Centered Dementia Care', '2009-01-01', '2009-12-31', false, 'CDP Certified', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'Korean', 'Native', true, 1),
    (v_user_id, 'English', 'C1', false, 2);

    RAISE NOTICE '✅ Janet Lee - education & languages added';
  END IF;

  -- ================================================================
  -- 18. KEVIN PARK - Conscious Entrepreneurship Coach
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'kevin.park@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Babson College', 'MBA in Entrepreneurship', 'Social Entrepreneurship and Impact Investing', '2009-09-01', '2011-06-30', false, 'GPA 3.85/4.0 - With Distinction', 1, true, NOW(), NULL),
    (v_user_id, 'University of California, San Diego', 'B.A. in Economics', 'Economics and Sustainable Business', '2005-09-01', '2009-05-30', false, 'GPA 3.72/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Presencing Institute (MIT)', 'Certificate in Theory U', 'Leading Profound Change and Social Innovation', '2012-01-01', '2012-12-31', false, 'Professional Certificate', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Korean', 'B1', false, 2);

    RAISE NOTICE '✅ Kevin Park - education & languages added';
  END IF;

  -- ================================================================
  -- 19. LINDA ZHANG - Licensed Acupuncturist & TCM Practitioner (from Beijing)
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'linda.zhang@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Beijing University of Chinese Medicine', 'B.Med. in Traditional Chinese Medicine', 'Acupuncture, Herbal Medicine, and TCM Diagnostics', '2002-09-01', '2007-06-30', false, 'Top 5% of Class', 1, true, NOW(), NULL),
    (v_user_id, 'Oregon College of Oriental Medicine', 'M.Ac. in Acupuncture', 'Clinical Acupuncture and Integrative East-West Medicine', '2008-09-01', '2011-06-30', false, 'GPA 3.94/4.0 - Summa Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'National Certification Commission for Acupuncture (NCCAOM)', 'Diplomate in Acupuncture', 'Licensed Acupuncturist (LAc)', '2011-09-01', '2012-03-31', false, 'Board Certified', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'Mandarin Chinese', 'Native', true, 1),
    (v_user_id, 'English', 'C2', false, 2);

    RAISE NOTICE '✅ Linda Zhang - education & languages added';
  END IF;

  -- ================================================================
  -- 20. MARGARET SULLIVAN - Contemplative Practices Teacher
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'margaret.sullivan@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Naropa University', 'M.A. in Contemplative Education', 'Contemplative Studies and Mindfulness Pedagogy', '2003-09-01', '2005-06-30', false, 'GPA 3.95/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of Massachusetts Amherst', 'B.A. in Religious Studies', 'Comparative Religion and Eastern Philosophy', '1999-09-01', '2003-05-30', false, 'GPA 3.82/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Spirit Rock Meditation Center', 'Mindfulness Teacher Certification', 'Vipassana Meditation and Buddhist Psychology', '2006-01-01', '2008-12-31', false, 'Authorized Teacher', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Sanskrit', 'A2', false, 2);

    RAISE NOTICE '✅ Margaret Sullivan - education & languages added';
  END IF;

  -- ================================================================
  -- 21. MARIA GONZALEZ - Culturally Responsive Family Therapist (first-gen immigrant)
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'maria.gonzalez@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Pepperdine University', 'M.A. in Clinical Psychology', 'Marriage and Family Therapy with Multicultural emphasis', '2008-09-01', '2010-06-30', false, 'GPA 3.89/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of Arizona', 'B.A. in Psychology', 'Psychology and Latin American Studies', '2004-09-01', '2008-05-30', false, 'GPA 3.75/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Ackerman Institute for the Family', 'Certificate in Culturally Responsive Family Therapy', 'Multicultural and Immigrant Family Systems', '2011-01-01', '2012-06-30', false, 'Advanced Certificate', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'Spanish', 'Native', true, 1),
    (v_user_id, 'English', 'C2', false, 2);

    RAISE NOTICE '✅ Maria Gonzalez - education & languages added';
  END IF;

  -- ================================================================
  -- 22. PATRICIA COLEMAN - Qualitative Research Methodologist
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'patricia.coleman@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'University of Illinois at Urbana-Champaign', 'Ph.D. in Qualitative Research Methods', 'Qualitative Inquiry and Interpretive Methodologies', '2006-09-01', '2011-06-30', false, 'Dissertation with Honors', 1, true, NOW(), NULL),
    (v_user_id, 'DePaul University', 'M.A. in Sociology', 'Social Research and Community Studies', '2004-09-01', '2006-05-30', false, 'GPA 3.91/4.0 - Summa Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Northwestern University', 'B.A. in Anthropology', 'Cultural Anthropology and Ethnography', '2000-09-01', '2004-05-30', false, 'GPA 3.78/4.0 - Magna Cum Laude', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'French', 'B1', false, 2);

    RAISE NOTICE '✅ Patricia Coleman - education & languages added';
  END IF;

  -- ================================================================
  -- 23. PRIYA SHARMA - Ayurvedic Practitioner (from India)
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'priya.sharma@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Kerala Ayurveda Academy', 'B.A.M.S. (Bachelor of Ayurvedic Medicine and Surgery)', 'Ayurvedic Medicine, Panchakarma, and Dravyaguna', '2005-09-01', '2011-06-30', false, 'First Class with Distinction', 1, true, NOW(), NULL),
    (v_user_id, 'Bastyr University', 'Certificate in Ayurvedic Sciences', 'Clinical Ayurveda for Western Practice', '2012-09-01', '2013-06-30', false, 'Professional Certification', 2, true, NOW(), NULL),
    (v_user_id, 'National Ayurvedic Medical Association', 'NAMA Professional Member Certification', 'Ayurvedic Health Counselor', '2014-01-01', '2014-12-31', false, 'NAMA Certified', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'Hindi', 'Native', true, 1),
    (v_user_id, 'English', 'C2', false, 2),
    (v_user_id, 'Sanskrit', 'B1', false, 3);

    RAISE NOTICE '✅ Priya Sharma - education & languages added';
  END IF;

  -- ================================================================
  -- 24. RICHARD HAMILTON - Grief Counselor & Bereavement Specialist
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'richard.hamilton@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Boston College', 'M.A. in Pastoral Counseling', 'Grief Counseling and Bereavement Support', '2005-09-01', '2007-06-30', false, 'GPA 3.90/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of Maryland', 'B.A. in Psychology', 'Clinical Psychology and Human Development', '2001-09-01', '2005-05-30', false, 'GPA 3.74/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Association for Death Education and Counseling', 'Certified Thanatologist (CT)', 'Death, Dying, and Bereavement Studies', '2008-01-01', '2008-12-31', false, 'ADEC Certified', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Spanish', 'A2', false, 2);

    RAISE NOTICE '✅ Richard Hamilton - education & languages added';
  END IF;

  -- ================================================================
  -- 25. STEVEN MITCHELL - Transpersonal Psychologist
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'steven.mitchell@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Sofia University (formerly ITP)', 'Ph.D. in Transpersonal Psychology', 'Transpersonal Psychology and Non-Ordinary States of Consciousness', '2006-09-01', '2011-06-30', false, 'Dissertation with Distinction', 1, true, NOW(), NULL),
    (v_user_id, 'California Institute of Integral Studies', 'M.A. in Counseling Psychology', 'Integral and Transpersonal Counseling', '2004-09-01', '2006-05-30', false, 'GPA 3.88/4.0 - Summa Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'University of Colorado Boulder', 'B.A. in Philosophy', 'Philosophy of Mind and Consciousness Studies', '2000-09-01', '2004-05-30', false, 'GPA 3.76/4.0 - Magna Cum Laude', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'Portuguese', 'A2', false, 2);

    RAISE NOTICE '✅ Steven Mitchell - education & languages added';
  END IF;

  -- ================================================================
  -- 26. THOMAS RIVERA - Perennial Philosophy Scholar (multilingual)
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'thomas.rivera@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Harvard Divinity School', 'Ph.D. in Comparative Religion', 'Comparative Mysticism and Perennial Philosophy', '2003-09-01', '2008-06-30', false, 'Dissertation with Highest Honors', 1, true, NOW(), NULL),
    (v_user_id, 'University of Chicago', 'M.A. in Religious Studies', 'World Religions and Interfaith Dialogue', '2001-09-01', '2003-05-30', false, 'GPA 3.94/4.0 - Summa Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Georgetown University', 'B.A. in Theology and Philosophy', 'Theology, Philosophy, and Ethics', '1997-09-01', '2001-05-30', false, 'GPA 3.85/4.0 - Magna Cum Laude', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'Spanish', 'Native', true, 1),
    (v_user_id, 'English', 'C1', false, 2),
    (v_user_id, 'Sanskrit', 'B1', false, 3);

    RAISE NOTICE '✅ Thomas Rivera - education & languages added';
  END IF;

  -- ================================================================
  -- 27. NICOLE TAYLOR - Dance/Movement Therapist (Portland, OR)
  -- ================================================================
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'nicole.taylor@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    DELETE FROM education WHERE profile_id = v_user_id;
    DELETE FROM languages WHERE profile_id = v_user_id;

    INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES
    (v_user_id, 'Pratt Institute', 'M.A. in Dance/Movement Therapy', 'Dance/Movement Therapy and Somatic Psychology', '2010-09-01', '2012-06-30', false, 'GPA 3.88/4.0 - Summa Cum Laude', 1, true, NOW(), NULL),
    (v_user_id, 'University of Oregon', 'B.F.A. in Dance', 'Contemporary Dance and Choreography', '2006-09-01', '2010-05-30', false, 'GPA 3.71/4.0 - Cum Laude', 2, true, NOW(), NULL),
    (v_user_id, 'Somatic Experiencing International', 'Somatic Experiencing Practitioner (SEP)', 'Trauma Resolution through Movement and Body Awareness', '2013-01-01', '2015-06-30', false, 'Certified Practitioner', 3, true, NOW(), NULL);

    INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
    (v_user_id, 'English', 'Native', true, 1),
    (v_user_id, 'French', 'A2', false, 2);

    RAISE NOTICE '✅ Nicole Taylor - education & languages added';
  END IF;

  -- ================================================================
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE '✅ COMPLETE: Education & Languages added for 27 tutors';
  RAISE NOTICE '============================================';

END $$;

-- ============================================================================
-- VERIFICATION QUERY: Check education and languages counts for all tutors
-- ============================================================================
SELECT
  p.full_name,
  p.email,
  (SELECT COUNT(*) FROM education WHERE profile_id = p.id) as education_count,
  (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) as languages_count,
  CASE
    WHEN (SELECT COUNT(*) FROM education WHERE profile_id = p.id) = 0 THEN '❌ NO EDUCATION'
    WHEN (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) = 0 THEN '❌ NO LANGUAGES'
    ELSE '✅ COMPLETE'
  END as status
FROM profiles p
WHERE p.email LIKE '%@iseih.edu'
ORDER BY
  CASE
    WHEN (SELECT COUNT(*) FROM education WHERE profile_id = p.id) = 0 THEN 1
    WHEN (SELECT COUNT(*) FROM languages WHERE profile_id = p.id) = 0 THEN 2
    ELSE 3
  END,
  p.full_name;
