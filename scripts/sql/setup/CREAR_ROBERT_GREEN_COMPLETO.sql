-- =====================================================
-- CREAR PERFIL COMPLETO DE ROBERT GREEN
-- Sustainable Living Tutor - ISEIH
-- Email: robert.green@iseih.edu
-- =====================================================
-- Based on provided CV
-- Third ISEIH professional
-- =====================================================

DO $$
DECLARE
  v_user_id UUID;
BEGIN

  -- Buscar el usuario existente
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'robert.green@iseih.edu';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado. Por favor crear primero en Supabase Auth.';
  END IF;

  RAISE NOTICE '👤 Creando perfil completo para Robert Green...';
  RAISE NOTICE 'UUID: %', v_user_id;

  -- =====================================================
  -- 1. ACTUALIZAR PERFIL PRINCIPAL
  -- =====================================================

  UPDATE profiles SET
    full_name = 'Robert Green',
    headline = 'Sustainable Living and Permaculture Tutor',
    title = 'Ecological Transition and Circular Economy Specialist',
    summary = 'Sustainability specialist with 8 years of experience helping communities and individuals adopt more conscious and ecological lifestyles. I have worked with 40+ urban communities and trained 600+ people in permaculture, waste reduction, and circular economy. As a tutor at ISEIH, I teach practical strategies for transitioning toward regenerative homes and communities. My approach: achievable changes that generate real impact in urban and rural environments.',
    location = 'Seattle, WA',
    country_code = 'US',
    slug = 'robert-green-sustainable-living',
    template = 'passport',
    template_color = '#0052FF',
    show_verified_credentials = true,
    show_connect_links = true,
    show_qr_code = true,
    plan = 'free',
    role = 'professional',
    updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE '✅ Perfil principal actualizado';

  -- =====================================================
  -- 2. LIMPIAR DATOS EXISTENTES
  -- =====================================================

  DELETE FROM experiences WHERE profile_id = v_user_id;
  DELETE FROM education WHERE profile_id = v_user_id;
  DELETE FROM skills WHERE profile_id = v_user_id;
  DELETE FROM languages WHERE profile_id = v_user_id;
  DELETE FROM portfolio_items WHERE profile_id = v_user_id;
  DELETE FROM stamps WHERE profile_id = v_user_id;

  RAISE NOTICE '🧹 Datos anteriores eliminados';

  -- =====================================================
  -- 3. EXPERIENCIAS PROFESIONALES
  -- =====================================================

  INSERT INTO experiences (profile_id, company_name, position, start_date, end_date, is_current, employment_type, description, achievements, location, sort_order, verified, verified_at, verified_by) VALUES

  -- Experience 1: ISEIH (Current)
  (v_user_id, 'ISEIH - Institute for Advanced Studies in Human Innovation', 'Sustainable Living Tutor', '2023-01-01', NULL, true, 'FULL_TIME',
  'Design and delivery of courses on permaculture principles, zero-waste transition, circular economy, and domestic sustainability for students and professionals. Mentoring in personal and community ecological transition projects. Development of educational resources on urban gardens, composting, plastic reduction, conscious consumption, and home renewable energy. Advising students in designing action plans for regenerative homes and communities. Facilitation of experiential workshops on food cultivation, seed preservation, and object repair.',
  ARRAY[
    'Design of 6 educational programs on domestic sustainability implemented in 8 countries',
    'Training of over 180 students with average 97% satisfaction',
    'Mentoring in 40+ personal and family ecological transition projects',
    'Creation of Regenerative Home program adopted by ISEIH as flagship course',
    'Development of 25+ downloadable guides on urban permaculture and zero-waste living'
  ], 'Seattle, WA, USA', 1, true, NOW(), NULL),

  -- Experience 2: Green Living Solutions (Current - Consulting)
  (v_user_id, 'Green Living Solutions', 'Independent Sustainability Consultant', '2020-03-01', NULL, true, 'FREELANCE',
  'Specialized sustainability consulting for homes and small businesses seeking to reduce their environmental impact. Sustainability audits evaluating energy consumption, waste management, carbon footprint, and water consumption. Design of personalized composting, vermicomposting, and waste reduction systems adapted to urban context. Advising on transition to domestic renewable energies (solar, wind). Development of action plans for zero-waste homes with quarterly progress tracking.',
  ARRAY[
    'Consulting for 85+ homes and 25 small businesses in sustainable transition',
    'Average 60% reduction in client waste generation within 12 months',
    'Design of 40+ urban composting systems functioning successfully',
    'Average 35% energy savings in advised homes',
    'Publication of 12 documented success stories on sustainability blog'
  ], 'Remote', 2, true, NOW(), NULL),

  -- Experience 3: Seattle Community Gardens
  (v_user_id, 'Seattle Community Gardens Network', 'Urban Permaculture Instructor', '2018-01-01', NULL, true, 'PART_TIME',
  'Delivery of practical workshops on organic urban cultivation, resilient system design in small spaces, and community garden construction. Teaching permaculture principles applied to urban balconies, patios, and community gardens. Training in regenerative agriculture techniques: composting, mulching, crop rotation, companion planting, and biological pest control. Mentoring community groups in creating school and neighborhood gardens.',
  ARRAY[
    'Facilitation of over 120 urban permaculture workshops with 1,800+ participants',
    'Advisory in design of 18 active community gardens in Seattle',
    'Training of 200+ people who started their own urban gardens',
    'Creation of Permaculture in Small Spaces course with permanent waiting list',
    'Recognition as Outstanding Community Educator by the city in 2021'
  ], 'Seattle, WA, USA', 3, true, NOW(), NULL),

  -- Experience 4: City of Seattle Sustainability Programs
  (v_user_id, 'City of Seattle - Department of Sustainability', 'Community Sustainability Coordinator', '2016-06-01', '2020-02-28', false, 'FULL_TIME',
  'Management of municipal community initiatives for carbon footprint reduction and circular economy promotion. Coordination of Seattle Zero Waste program with over 5,000 participants. Development of educational campaigns on recycling, mandatory composting, and single-use plastic reduction. Organization of community exchange, repair, and reuse events. Collaboration with schools to implement environmental education programs. Impact measurement and quarterly reporting of community sustainability metrics.',
  ARRAY[
    'Coordination of program with 5,000+ participating households reducing waste by 45%',
    'Organization of 24 circular economy community events with 8,000+ attendees',
    'Implementation of mandatory composting in 12 pilot neighborhoods',
    'Reduction of 1,200 tons of waste sent to landfill over 4 years',
    'Creation of partnerships with 30+ community organizations for sustainability'
  ], 'Seattle, WA, USA', 4, true, NOW(), NULL),

  -- Experience 5: EcoVillage Transition Consulting
  (v_user_id, 'EcoVillage Transition Consulting', 'Sustainable Transition Consultant', '2013-09-01', '2016-05-31', false, 'FREELANCE',
  'Consulting for ecovillages and intentional communities in transition toward comprehensive sustainability. Design of community permaculture systems, water management, renewable energies, and natural construction. Facilitation of community decision-making processes on sustainability. Training of residents in organic cultivation techniques, food preservation, and regenerative community living.',
  ARRAY[
    'Consulting for 8 ecovillages in United States and Canada',
    'Design of 5 complete community permaculture systems functioning successfully',
    'Facilitation of 40+ workshops on sustainable community living',
    'Support in community transition toward 80% food self-sufficiency'
  ], 'Remote', 5, true, NOW(), NULL);

  RAISE NOTICE '✅ 5 experiencias profesionales creadas';

  -- =====================================================
  -- 4. EDUCACIÓN
  -- =====================================================

  INSERT INTO education (profile_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, sort_order, verified, verified_at, verified_by) VALUES

  -- Education 1: Masters at University of Washington
  (v_user_id, 'University of Washington', 'M.A. in Sustainable Development', 'Sustainable Development and Environmental Policy', '2014-09-01', '2016-06-30', false, 'GPA 3.88/4.0 - Cum Laude', 1, true, NOW(), NULL),

  -- Education 2: Bachelors at University of Vermont
  (v_user_id, 'University of Vermont', 'B.A. in Environmental Sciences', 'Environmental Science and Ecology', '2008-09-01', '2012-05-30', false, 'GPA 3.75/4.0 - Magna Cum Laude', 2, true, NOW(), NULL),

  -- Education 3: Permaculture Design Certificate
  (v_user_id, 'Permaculture Institute', 'Permaculture Design Certificate (PDC)', 'Intensive Permaculture Design Certification', '2013-06-01', '2013-08-31', false, 'Complete Certification - 72 hours', 3, true, NOW(), NULL);

  RAISE NOTICE '✅ 3 títulos educativos creados';

  -- =====================================================
  -- 5. HABILIDADES
  -- =====================================================

  INSERT INTO skills (profile_id, name, level, years_of_experience, category, sort_order) VALUES
  (v_user_id, 'Urban Permaculture', 'EXPERT', 10, 'Sustainable Agriculture', 1),
  (v_user_id, 'Domestic Sustainability', 'EXPERT', 8, 'Sustainable Living', 2),
  (v_user_id, 'Zero-Waste Management', 'EXPERT', 8, 'Circular Economy', 3),
  (v_user_id, 'Circular Economy', 'EXPERT', 7, 'Sustainability', 4),
  (v_user_id, 'Community Education', 'EXPERT', 8, 'Environmental Education', 5),
  (v_user_id, 'Environmental Auditing', 'ADVANCED', 5, 'Consulting', 6),
  (v_user_id, 'Composting and Vermicomposting', 'EXPERT', 10, 'Organic Management', 7),
  (v_user_id, 'Urban Garden Design', 'EXPERT', 10, 'Urban Agriculture', 8),
  (v_user_id, 'Domestic Renewable Energy', 'ADVANCED', 6, 'Energy', 9),
  (v_user_id, 'Natural Construction', 'ADVANCED', 5, 'Bio-construction', 10),
  (v_user_id, 'Water Conservation', 'ADVANCED', 7, 'Natural Resources', 11),
  (v_user_id, 'Regenerative Agriculture', 'EXPERT', 9, 'Permaculture', 12),
  (v_user_id, 'Conscious Consumption', 'EXPERT', 8, 'Lifestyle', 13),
  (v_user_id, 'Food Preservation', 'ADVANCED', 6, 'Self-sufficiency', 14),
  (v_user_id, 'Resilient Systems Design', 'EXPERT', 10, 'Systems Thinking', 15);

  RAISE NOTICE '✅ 15 habilidades creadas';

  -- =====================================================
  -- 6. IDIOMAS
  -- =====================================================

  INSERT INTO languages (profile_id, name, level, is_native, sort_order) VALUES
  (v_user_id, 'English', 'Native', true, 1),
  (v_user_id, 'Spanish', 'B1', false, 2);

  RAISE NOTICE '✅ 2 idiomas agregados';

  -- =====================================================
  -- 7. CERTIFICACIONES (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, type, title, issuer, issue_date, expiry_date, credential_id, credential_url, description, verified, sort_order) VALUES

  -- Certification 1: Permaculture Design
  (v_user_id, 'CERTIFICATION',
   'Permaculture Design Certificate (PDC)',
   'Permaculture Institute - USA',
   '2013-08', NULL, 'PDC-2013-RG567',
   'https://permaculture.org/verify/RG567',
   'Intensive 72-hour certification in permaculture design that accredits competencies in natural pattern observation, regenerative system design, permanent agriculture, water management, soil design, and creation of resilient productive ecosystems. Includes advanced theory and field practice in farm design, urban gardens, and self-sufficiency systems.',
   true, 1),

  -- Certification 2: Green Building
  (v_user_id, 'CERTIFICATION',
   'Green Building Professional (GBP) Certificate',
   'U.S. Green Building Council (USGBC)',
   '2017-05', '2027-05', 'LEED-GBP-2017-432',
   'https://www.usgbc.org/credentials/RG432',
   'Professional certification in sustainable construction and green buildings that accredits knowledge in energy efficiency, sustainable materials, indoor environmental quality, water management, and healthy space design. Includes LEED certification fundamentals, green construction strategies, and building environmental impact assessment.',
   true, 2),

  -- Certification 3: Sustainability Educator
  (v_user_id, 'CERTIFICATION',
   'Certified Sustainability Educator (CSE)',
   'Association for the Advancement of Sustainability in Higher Education (AASHE)',
   '2019-03', '2029-03', 'AASHE-CSE-2019-789',
   'https://www.aashe.org/verify/789',
   'Certification as sustainability educator that validates competencies to design and deliver educational programs on sustainability, climate change, circular economy, and ecological transition. Includes pedagogy for transformative education, experiential learning experience design, and evaluation of environmental educational program impact.',
   true, 3);

  RAISE NOTICE '✅ 3 certificaciones creadas';

  -- =====================================================
  -- 8. PROYECTOS (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, url, tags, featured, sort_order, created_at) VALUES

  -- Project 1: Edible Neighborhoods
  (v_user_id,
   'Edible Neighborhoods Project - Public Food Gardens',
   'Community project implementing food gardens in underutilized public spaces in Seattle, transforming abandoned areas into productive community gardens accessible to all neighbors. Implemented in 8 Seattle neighborhoods (2021-2022), the project created 12 community gardens with over 150 edible plant species: fruit trees, aromatics, perennial and annual vegetables. More than 300 families actively participate in maintenance and harvest. Results: Production of 4 tons of organic food distributed free of charge. 85% of participants reported improved access to fresh food. 30% reduction in urban heat island in intervened areas. Creation of 40+ temporary community jobs. Recognized by the city as Community Project of the Year 2022. Replicated in 5 additional cities in the region.',
   'PROJECT',
   'https://iseih.edu/edible-neighborhoods',
   ARRAY['Urban Permaculture', 'Food Security', 'Public Spaces', 'Community', 'Urban Agriculture'],
   true, 4, '2022-01-01'),

  -- Project 2: Zero Waste Home Manual
  (v_user_id,
   'Zero Waste Home Manual - Practical Family Guide',
   'Complete 120-page step-by-step guide for families wanting to transition toward a zero-waste lifestyle. The manual covers all areas of the home with practical strategies, homemade recipes, and sustainable alternatives. Content: 8 chapters on waste-free kitchen, zero-waste bathroom, ecological cleaning, conscious shopping, sustainable clothing management, home composting, repair and reuse, and minimalist mindset. Includes 50+ homemade product recipes (detergents, cosmetics, preserves) and checklists. The manual has been downloaded over 15,000 times since its 2021 publication. Available free in English and Spanish. Over 2,000 families have reported over 70% reduction in waste generation after following the guide for 6 months. Cited in 20+ sustainability publications and specialized blogs. Used as reference material in 8 universities.',
   'PROJECT',
   'https://zerowastehome.guide',
   ARRAY['Zero Waste', 'Waste Reduction', 'Practical Guide', 'Domestic Sustainability', 'Circular Economy'],
   true, 5, '2021-01-01'),

  -- Project 3: Circular Economy Fair
  (v_user_id,
   'Circular Economy Fair - Annual Community Event',
   'Annual community event organized since 2019 that connects artisans, repairers, and neighbors to promote local reuse, repair, and circular economy. The fair includes repair workshops, free object exchange, second-hand item sales, and educational booths. The 2022 event gathered over 1,500 attendees in a single day. Activities: 25 workshops (electronics repair, sewing, carpentry, bicycle repair), free exchange zone (600+ objects exchanged), 40 used item vendors, and 15 environmental organizations. Quantified results: Repair of 200+ objects that avoided landfill. Exchange or sale of 1,800+ items extending their useful life. Estimated 8 tons of waste avoided. 92% of attendees committed to repairing more and buying less new. The event has inspired similar fairs in 12 US cities. Funded by local sponsors and the city of Seattle.',
   'PROJECT',
   'https://circularfair.seattle',
   ARRAY['Circular Economy', 'Reuse', 'Repair', 'Community', 'Sustainable Event'],
   true, 6, '2019-11-01');

  RAISE NOTICE '✅ 3 proyectos agregados';

  -- =====================================================
  -- 9. COLABORACIONES (Portfolio Items)
  -- =====================================================

  INSERT INTO portfolio_items (profile_id, title, description, type, tags, sort_order) VALUES

  -- Collaboration 1: Sustainable Living Blog
  (v_user_id,
   'Monthly Columnist - Sustainable Living Within Reach Blog',
   'Monthly contributor since 2017 on specialized blog in practical domestic sustainability with over 80,000 monthly readers. Publication of articles on urban permaculture, waste reduction, conscious consumption, and accessible ecological transition for urban families. Over 70 published articles on topics such as: balcony gardens, apartment composting, homemade cleaning products, applied minimalism, zero-waste cooking, and sustainable parenting. Articles include step-by-step photographs, material lists, and practical tips. The 10 most-read articles exceed 50,000 views each. Articles shared by organizations like Zero Waste Alliance, Permaculture Network, and Green Living Magazine. The column has created an active community of 8,000+ people practicing sustainable living who share their achievements and ask questions.',
   'COLLABORATION',
   ARRAY['Blog', 'Sustainability', 'Outreach', 'Permaculture', 'Zero Waste'],
   7),

  -- Collaboration 2: School Gardens Advisor
  (v_user_id,
   'Volunteer Advisor - School Gardens Program',
   'Pro-bono consulting since 2018 to Seattle public schools in implementing educational school gardens. Working with teachers, students, and families to design, build, and maintain gardens that serve as living classrooms for teaching science, mathematics, nutrition, and ecology. I have advised 15 elementary and secondary schools in creating gardens from scratch. The program includes: space design, selection of appropriate plants for the climate, raised bed construction, irrigation systems, school composting, and integrated educational curriculum. Results: All 15 school gardens are active and productive after 2-5 years. Over 2,000 students have participated in garden classes. 85% of schools report improvement in understanding of natural sciences and nutrition. Several schools have incorporated garden harvests into school cafeterias. The program has been recognized by the district as a model for experiential environmental education.',
   'COLLABORATION',
   ARRAY['Education', 'School Gardens', 'Volunteering', 'Children', 'Educational Agriculture'],
   8),

  -- Collaboration 3: Eco-construction Festival Workshop Leader
  (v_user_id,
   'Guest Workshop Leader - Eco-construction Festivals',
   'Guest facilitator at eco-construction and sustainable living festivals and gatherings in the Pacific Northwest region since 2016. Delivery of practical workshops on natural material construction, bioclimatic design, and domestic self-sufficiency systems. I have participated in 18 major festivals including: Northwest EcoBuilding Guild Festival, Cascadia Permaculture Convergence, and Seattle Green Festival. Workshops taught: earth construction, green roofs, rainwater harvesting systems, and passive solar design. Each workshop includes practical demonstrations where participants build functional prototypes. Over 800 people have attended my workshops at these events. 60% of participants report having applied learned techniques in their own projects. The workshops are exchange spaces where I learn as much as I teach, connecting with other professionals and eco-construction enthusiasts.',
   'COLLABORATION',
   ARRAY['Eco-construction', 'Workshops', 'Festivals', 'Natural Construction', 'Experiential Education'],
   9);

  RAISE NOTICE '✅ 3 colaboraciones agregadas';

  -- =====================================================
  -- 10. STAMPS DE VERIFICACIÓN
  -- =====================================================

  INSERT INTO stamps (profile_id, type, status, evidence, provider, verified_at, created_at) VALUES

  -- Email verification
  (v_user_id, 'EMAIL', 'VERIFIED',
   '{"email": "robert.green@iseih.edu", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Identity verification
  (v_user_id, 'IDENTITY', 'VERIFIED',
   '{"document_type": "Passport", "document_number": "****0104", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Education verification
  (v_user_id, 'EDUCATION', 'VERIFIED',
   '{"degree": "M.A. in Sustainable Development", "institution": "University of Washington", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Employment verification
  (v_user_id, 'EMPLOYMENT', 'VERIFIED',
   '{"position": "Sustainable Living Tutor", "company": "ISEIH", "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW()),

  -- Language verification
  (v_user_id, 'LANGUAGE', 'VERIFIED',
   '{"languages": ["English (Native)", "Spanish (B1)"], "verified_method": "manual_admin"}'::jsonb,
   'manual', NOW(), NOW());

  RAISE NOTICE '✅ 5 stamps básicos creados';

  -- Stamps de certificaciones (uno por cada certificación)
  INSERT INTO stamps (
    profile_id, type, status, entity_type,
    evidence, provider, verified_at, created_at
  )
  SELECT
    v_user_id, 'CERTIFICATION', 'VERIFIED', 'CERTIFICATION',
    jsonb_build_object(
      'certification_title', title,
      'verified_method', 'manual_admin',
      'verification_notes', 'Certificación verificada mediante documentación oficial'
    ),
    'Admin Manual Review', NOW(), NOW()
  FROM portfolio_items
  WHERE profile_id = v_user_id AND type = 'CERTIFICATION';

  RAISE NOTICE '✅ Stamps de certificaciones creados';

  -- =====================================================
  -- RESUMEN FINAL
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '✅ ROBERT GREEN PROFILE SUCCESSFULLY CREATED';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE 'Name: Robert Green';
  RAISE NOTICE 'Email: robert.green@iseih.edu';
  RAISE NOTICE 'Position: Sustainable Living Tutor';
  RAISE NOTICE 'Template: passport (#0052FF)';
  RAISE NOTICE '';
  RAISE NOTICE 'STATISTICS:';
  RAISE NOTICE '- Experiences: 5';
  RAISE NOTICE '- Education: 3 titles';
  RAISE NOTICE '- Skills: 15';
  RAISE NOTICE '- Languages: 2';
  RAISE NOTICE '- Certifications: 3';
  RAISE NOTICE '- Projects: 3';
  RAISE NOTICE '- Collaborations: 3';
  RAISE NOTICE '- Verified stamps: 8';
  RAISE NOTICE '══════════════════════════════════════════════════════';
  RAISE NOTICE '';

END $$;

-- =====================================================
-- VERIFICACIÓN FINAL
-- =====================================================

SELECT
  'ROBERT GREEN - COMPLETE VERIFICATION' as usuario,
  p.full_name,
  p.headline,
  p.template,
  COUNT(DISTINCT e.id) as experiencias,
  COUNT(DISTINCT ed.id) as educacion,
  COUNT(DISTINCT sk.id) as habilidades,
  COUNT(DISTINCT l.id) as idiomas,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'CERTIFICATION') as certificaciones,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'PROJECT') as proyectos,
  COUNT(DISTINCT pi.id) FILTER (WHERE pi.type = 'COLLABORATION') as colaboraciones,
  COUNT(DISTINCT s.id) as stamps_verificados
FROM profiles p
LEFT JOIN experiences e ON e.profile_id = p.id
LEFT JOIN education ed ON ed.profile_id = p.id
LEFT JOIN skills sk ON sk.profile_id = p.id
LEFT JOIN languages l ON l.profile_id = p.id
LEFT JOIN portfolio_items pi ON pi.profile_id = p.id
LEFT JOIN stamps s ON s.profile_id = p.id AND s.status = 'VERIFIED'
WHERE p.email = 'robert.green@iseih.edu'
GROUP BY p.id, p.full_name, p.headline, p.template;
