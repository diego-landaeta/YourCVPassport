-- Diversify Profile Summaries (ENGLISH VERSION) - Remove "I believe" pattern
-- Makes profiles look more natural and varied

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Amanda Rodriguez - Leadership Coach
  SELECT id INTO v_user_id FROM auth.users WHERE email='amanda.rodriguez@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='For 9 years, I have transformed how leaders worldwide understand leadership—not as authority, but as presence, integrity, and the courage to lead from your highest self. I have coached 150+ leaders to move from reactive management to conscious leadership, where decisions align with values and organizations thrive through authentic connection. My approach integrates mindfulness, emotional intelligence, and systemic thinking to help leaders cultivate awareness, communicate authentically, and create cultures of trust. I work with executives, founders, and changemakers navigating complex challenges—mergers, cultural transformation, ethical dilemmas—helping them lead with wisdom instead of ego. At ISEIH, I train coaches and consultants in conscious leadership frameworks, teaching them to facilitate transformational conversations that shift how leaders see themselves and their impact.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Amanda Rodriguez updated';
  END IF;

  -- Daniel Foster - Research Methodologist
  SELECT id INTO v_user_id FROM auth.users WHERE email='daniel.foster@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='What separates a brilliant holistic practice from one that transforms lives in provable ways? Rigorous research. For 13 years, I have supported 100+ research projects in integrative health, helping practitioners design studies, analyze data, and translate findings into actionable insights. My work bridges the gap between clinical practice and scientific validation. My journey began with frustration: brilliant holistic practitioners whose work lacked credibility because they could not prove efficacy. I dedicated my career to making rigorous research accessible to non-academics, teaching them to design studies, collect meaningful data, and communicate findings professionally. At ISEIH, I teach research design, statistical analysis, and evidence-based practice, demystifying research methods and showing that good science does not require a PhD—just curiosity, integrity, and systematic thinking.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Daniel Foster updated';
  END IF;

  -- Margaret Sullivan - Contemplative Practices Teacher
  SELECT id INTO v_user_id FROM auth.users WHERE email='margaret.sullivan@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Contemplative practice is not an escape from life but a way of being fully present to it. For 18 years, I have taught meditation, contemplative inquiry, and mindfulness-based practices to 800+ students, helping them develop inner resources for navigating life challenges with grace and wisdom. My journey began in crisis. After a devastating loss, I discovered Buddhist meditation and experienced firsthand how contemplative practice could hold suffering without being consumed by it. That personal transformation became my life work. I trained intensively in multiple contemplative traditions—Zen, Vipassana, contemplative Christianity, and secular mindfulness—learning to teach practices that are accessible, non-dogmatic, and deeply transformative. At ISEIH, I train teachers, therapists, and coaches in contemplative pedagogy: how to guide meditation, facilitate inquiry, and create conditions for insight.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Margaret Sullivan updated';
  END IF;

  -- Patricia Coleman - Qualitative Research Specialist
  SELECT id INTO v_user_id FROM auth.users WHERE email='patricia.coleman@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Qualitative research specialist with 13 years transforming complex human experiences into rigorous, actionable knowledge. I have completed 80+ research projects in holistic health, using innovative methodologies that honor both individual stories and emerging patterns. Qualitative research captures what numbers cannot: the richness of lived experience, the nuances of meaning, the complexities of healing. My work helps holistic practitioners document and communicate their impact in ways that resonate with both clients and institutions. At ISEIH, I teach qualitative research methods—phenomenological interviews, grounded theory, thematic analysis—guiding students through the art of listening deeply, coding meticulously, and presenting findings persuasively. My mission: to elevate qualitative research as rigorous science that honors human complexity.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Patricia Coleman updated';
  END IF;

  -- Kevin Park - Business Coach
  SELECT id INTO v_user_id FROM auth.users WHERE email='kevin.park@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='I have helped 200+ entrepreneurs build successful businesses that actually work—not just on paper, but in the messy reality of markets, finances, and sustainable growth. For 12 years as a business coach, I have guided holistic professionals from initial uncertainty to thriving ventures with clear strategy, solid metrics, and proven profitability. Holistic professionals often have a gift but struggle with the business side. My work is closing that gap. I teach practical business strategy, not theory—real financial modeling, marketing strategies that work, ethical sales systems, and operational growth. At ISEIH, I train students in holistic entrepreneurship: how to launch, scale, and sustain successful businesses while staying true to their values. I have seen too many brilliant practitioners fail not from lack of skill, but lack of business knowledge. My mission: ensuring every graduate has the tools to thrive.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Kevin Park updated';
  END IF;

  -- Thomas Rivera - Spiritual Studies Scholar
  SELECT id INTO v_user_id FROM auth.users WHERE email='thomas.rivera@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='The world spiritual traditions share a common core—but only when we look past dogmas and toward the practices, experiences, and lived transformations. My work over 15 years has explored these universal threads, helping 600+ students understand spiritual traditions with academic depth and practical relevance. I studied intensively contemplative Christianity, Buddhism, Sufism, Jewish mysticism, and Indigenous traditions, seeking patterns in how they cultivate awareness, compassion, and connection to the sacred. My approach is academically rigorous yet experientially grounded—not just studying texts, but practicing to understand how teachings transform consciousness. At ISEIH, I teach comparative religion, mysticism, and wisdom traditions, creating spaces where students can explore spirituality critically while honoring its sacredness. My passion: making spiritual wisdom accessible across religious boundaries.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Thomas Rivera updated';
  END IF;

  -- Alex Martinez - Ethics Teacher
  SELECT id INTO v_user_id FROM auth.users WHERE email='alex.martinez@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='For 10 years, I have navigated the complex waters of professional ethics in holistic health, helping 400+ professionals make decisions that honor both their clients and their deepest values. Ethics is not about memorable rules—it is about cultivating moral judgment that can navigate ambiguity, balance competing interests, and maintain integrity under pressure. My path began when I witnessed both brilliant ethical practices and harmful violations within holistic communities. I dedicated my career to raising ethical standards through rigorous education. I teach ethical frameworks—deontology, consequentialism, virtue ethics, care ethics—but also real-world cases that challenge simplistic thinking. At ISEIH, I train future professionals in ethical decision-making, professional boundaries, informed consent, and client-centered practice. My mission: ensuring every graduate can navigate ethical dilemmas with wisdom and compassion.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Alex Martinez updated';
  END IF;

  -- Angela Roberts - Clinical Supervisor
  SELECT id INTO v_user_id FROM auth.users WHERE email='angela.roberts@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Supervision is not just reviewing cases—it is cultivating reflective, ethical, effective professionals who can hold complex therapeutic work without burning out. For 15 years, I have supervised 200+ therapists-in-training, creating spaces where they can process challenging cases, explore blind spots, and develop their unique therapeutic voice. My supervision approach integrates clinical competence, personal reflection, and systemic considerations. I help supervisees see patterns in their work, recognize countertransference, develop effective interventions, and maintain ethical boundaries. But I also honor the relationality of supervision—not as hierarchy but as collaborative alliance for growth. At ISEIH, I train both future therapists and clinical supervisors, teaching the art of supervision that is challenging yet compassionate, rigorous yet relationally attuned. I have seen how good supervision prevents burnout, increases effectiveness, and deepens commitment to this sacred work.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Angela Roberts updated';
  END IF;

  -- Brian Cooper - Social Justice Advocate
  SELECT id INTO v_user_id FROM auth.users WHERE email='brian.cooper@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Healing cannot be separated from justice. For 11 years, I have worked at the intersection of holistic health and social equity, helping professionals recognize how trauma, oppression, and marginalization shape healing experiences. I have trained 350+ professionals in culturally humble, trauma-sensitive practices that center equity. My work began in underserved communities where I saw clearly how social determinants of health—poverty, racism, lack of access—create massive disparities in wellbeing. I dedicated my career to helping holistic professionals understand these realities and adapt their practices accordingly. At ISEIH, I teach cultural competence, trauma-informed practice, and social justice advocacy, challenging students to examine their own privilege and commit to systemic change. My mission: ensuring holistic healing is accessible, relevant, and transformative for all communities, especially the marginalized.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Brian Cooper updated';
  END IF;

  -- Catherine Adams - Wellness Program Designer
  SELECT id INTO v_user_id FROM auth.users WHERE email='catherine.adams@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Wellness program design specialist with 12 years transforming visions into sustainable, scalable systems. I have designed 50+ wellness programs—from weekend retreats to year-long corporate initiatives—that actually work: well-structured, participant-engaging, and results-oriented with measurable outcomes. Effective wellness does not happen by accident. It requires careful planning, understanding of behavior change theory, and systems that support sustained growth. My work helps professionals move from one-off workshops to comprehensive programs that create lasting transformation. At ISEIH, I teach program design: how to assess needs, set objectives, create curricula, facilitate learning experiences, and measure outcomes. My students learn both the art of creating meaningful content and the science of structuring effective programs. My passion: helping professionals amplify their impact through programs that change lives at scale.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Catherine Adams updated';
  END IF;

  -- Christopher Barnes - Nutrition Science Educator
  SELECT id INTO v_user_id FROM auth.users WHERE email='christopher.barnes@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='What makes nutrition so confusing? Contradictory trends, emerging science, and marketing claims that obscure truth. For 14 years, I have helped 500+ professionals and clients navigate the chaotic nutritional landscape with solid science, critical thinking, and evidence-based practical advice. My approach balances scientific rigor with traditional nutritional wisdom. I study emerging research but also honor ancestral food practices that have sustained human health for millennia. I teach students to read studies critically, recognize biases, and translate complex evidence into actionable recommendations. At ISEIH, I train future nutrition counselors in biochemistry, digestive physiology, nutrient science, and evidence-based nutritional coaching. But I also teach humility—nutritional science is young, complex, and constantly evolving. My mission: equipping professionals with tools to separate fact from fad and empower clients with solid nutritional knowledge.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Christopher Barnes updated';
  END IF;

  -- Diana Russell - Movement Therapy Specialist
  SELECT id INTO v_user_id FROM auth.users WHERE email='diana.russell@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='The body speaks when words fail. For 16 years, I have used somatic movement therapy to help 400+ clients release stored trauma, reconnect with bodily sensations, and restore vitality through conscious movement. My practice integrates Authentic Movement, Somatic Education, and trauma-informed principles to create deep and lasting healing. My journey began when I witnessed how movement could access memories and emotions that talk therapy could not touch. I trained intensively in multiple somatic modalities, learning how the body stores experience and how conscious movement can reorganize neural patterns. At ISEIH, I teach movement therapy: how to facilitate safe movement exploration, work with body memory, integrate somatic practice with psychotherapy, and create spaces where the body can tell its story. My passion: making somatic healing accessible to therapists and clients alike.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Diana Russell updated';
  END IF;

  -- Elizabeth Morgan - Mindfulness-Based Therapy
  SELECT id INTO v_user_id FROM auth.users WHERE email='elizabeth.morgan@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Therapist specializing in mindfulness-based interventions with 14 years helping clients transform their relationship with thoughts, emotions, and experience. I have trained 300+ therapists in evidence-based protocols—MBSR, MBCT, ACT—that integrate contemplative practices with modern psychotherapy. Mindfulness is not just relaxation—it is a powerful therapeutic tool backed by decades of neuroscientific research. My work helps therapists understand both the science and practice: how mindfulness regulates emotions, reduces reactivity, and creates space for conscious choices. At ISEIH, I teach mindfulness-based therapy: theory, protocols, personal practice, and ethical considerations. My students learn to facilitate mindfulness practices clinically, adapt them for diverse populations, and integrate them into their existing therapeutic frameworks. But I also emphasize personal practice—you cannot teach mindfulness without living mindfulness. My mission: elevating mindfulness-based interventions as standard of care in mental health.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Elizabeth Morgan updated';
  END IF;

  -- Janet Lee - Herbal Medicine Educator
  SELECT id INTO v_user_id FROM auth.users WHERE email='janet.lee@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='For 17 years, I have helped professionals rediscover the medicinal power of plants—not as romantic alternative but as serious, effective, evidence-based medicine. I have trained 500+ herbalists in botanical pharmacology, remedy preparation, and clinical prescribing that honors both traditional wisdom and modern research. My journey began in frustration with conventional medicine that treated symptoms without addressing root causes. I discovered herbal medicine and experienced profound healing that synthetic pharmaceuticals had not achieved. I studied intensively both herbal traditions—Traditional Chinese Medicine, Ayurveda, Western herbalism—and modern phytochemistry, learning how plant compounds interact with human physiology. At ISEIH, I teach herbal materia medica, botanical pharmacology, remedy formulation, and evidence-based clinical practice. My students learn to prescribe plants safely, effectively, and with respect for both tradition and science. My mission: restoring herbal medicine as a respected pillar of healthcare.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Janet Lee updated';
  END IF;

  -- Jessica Porter - Grief & Loss Counseling
  SELECT id INTO v_user_id FROM auth.users WHERE email='jessica.porter@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Grief is not something you "get over"—it is something you integrate. For 13 years, I have accompanied 300+ clients through the complexities of grief, loss, and transition, creating sacred spaces where pain can be held without being fixed. My practice honors that grief is as unique as the relationship lost—no timeline, no ordered stages, just the beautiful and heartbreaking messiness of loving and losing. My work began with my own devastating loss. When conventional grief therapy felt shallow and insensitive, I sought approaches that honored the complexity of grief. I studied meaning-centered therapy, complicated grief, and cross-cultural grief traditions, learning how cultures hold loss differently. At ISEIH, I train counselors in grief support: how to be present with pain, facilitate meaning integration, recognize complicated grief, and honor cultural diversity in mourning practices. My mission: creating a culture that honors grief as sacred process, not problem to solve.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Jessica Porter updated';
  END IF;

  -- Karen White - Energy Psychology
  SELECT id INTO v_user_id FROM auth.users WHERE email='karen.white@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Energy psychology specialist with 12 years integrating innovative mind-body techniques—EFT, EMDR, Energy Psychology—into effective therapeutic practice. I have helped 400+ clients release trauma, anxiety, and entrenched emotional patterns through interventions that work directly with the nervous system. Energy psychology may seem unconventional, but research backs it. My work helps therapists understand both the science—how stimulating acupressure points regulates the amygdala, how bilateral processing reorganizes traumatic memory—and practical application. At ISEIH, I teach energy psychology: trauma theory, evidence-based protocols, clinical considerations, and ethical practice. My students learn to use these powerful tools with integrity, understanding when they are appropriate and when conventional approaches are needed. I do not present energy psychology as panacea but as valuable set of tools in the therapeutic toolkit. My mission: bringing mind-body modalities into mainstream therapy.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Karen White updated';
  END IF;

  -- Linda Zhang - Cross-Cultural Communication
  SELECT id INTO v_user_id FROM auth.users WHERE email='linda.zhang@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='How do we navigate cultural differences in healing when basic concepts—mind, body, health, illness—mean fundamentally different things across diverse cultures? For 11 years, I have helped 350+ professionals develop cross-cultural competence that goes beyond surface sensitivity toward genuine understanding and culturally humble practice. My journey began navigating cultural worlds—raised between Chinese and American cultures, witnessing how each understood health differently. I studied medical anthropology, cross-cultural communication, and culturally humble practice, learning how cultural belief systems shape healing experiences. At ISEIH, I teach cross-cultural communication: how to recognize value differences, navigate language barriers, adapt practices for diverse populations, and work with interpreters and cultural mediators. But above all, I teach humility—recognizing we never "master" another culture, only become more skillful at learning and adapting. My mission: making holistic healing truly accessible across cultural boundaries.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Linda Zhang updated';
  END IF;

  -- Maria Gonzalez - Family Systems Therapy
  SELECT id INTO v_user_id FROM auth.users WHERE email='maria.gonzalez@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Families are living systems—when one member suffers, the entire system adjusts. For 15 years, I have worked with 200+ families, helping them recognize relational patterns, heal generational wounds, and create healthier dynamics. My practice integrates family systems therapy, attachment theory, and transgenerational approaches to create lasting change. My work began when I saw how individual therapy often improved symptoms but did not transform the family dynamics that maintained them. I studied intensively family systems theory—Bowen, structural, strategic, narrative—learning how patterns transmit across generations and how systemic interventions can interrupt dysfunctional cycles. At ISEIH, I train therapists in family systems practice: how to conceptualize families systemically, facilitate family sessions, work with hierarchies and boundaries, and address transgenerational trauma. My students learn to see beyond individuals toward the patterns that connect. My mission: healing families, not just individuals.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Maria Gonzalez updated';
  END IF;

  -- Mark Davidson - Mind-Body Medicine
  SELECT id INTO v_user_id FROM auth.users WHERE email='mark.davidson@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='For 16 years, I have explored the frontier where mind and body meet, helping 450+ clients and professionals understand how thoughts, emotions, and beliefs literally shape physical health. My practice integrates psychoneuroimmunology, mind-body medicine, and somatic approaches to create integral healing. The mind-body division is artificial. Decades of neuroscientific research confirm what ancient healing traditions always knew: the mind influences physical health through neural, hormonal, and immune pathways. My work helps professionals understand both the science and practice of mind-body interventions. At ISEIH, I teach mind-body medicine: psychoneuroimmunology, stress effects on health, nervous system regulation techniques, and evidence-based protocols like guided imagery, progressive relaxation, and biofeedback. My students learn to work with the mind-body unity, not as abstract concept but as tangible clinical reality. My mission: integrating mind-body medicine into mainstream healthcare.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Mark Davidson updated';
  END IF;

  -- Michelle Chang - Positive Psychology
  SELECT id INTO v_user_id FROM auth.users WHERE email='michelle.chang@iseih.edu';
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET summary='Positive psychology specialist with 10 years helping individuals and organizations thrive—not just survive. I have worked with 300+ clients and trained 150+ professionals in strengths-based interventions that cultivate wellbeing, resilience, and human flourishing. Psychology for too long focused only on pathology. Positive psychology asks: what makes life worth living? How do we cultivate meaning, engagement, positive relationships, and accomplishment? My work helps professionals integrate positive psychology interventions—strengths identification, gratitude cultivation, resilience building, purpose discovery—into their therapeutic practice. At ISEIH, I teach positive psychology: wellbeing theory, character strengths science, evidence-based interventions, and positive coaching. But I also teach balance—positive psychology does not ignore suffering but builds resources to navigate it. My students learn to help clients thrive, not just function. My mission: making positive psychology fundamental part of therapeutic practice.', updated_at=NOW() WHERE id=v_user_id;
    RAISE NOTICE '✅ Michelle Chang updated';
  END IF;

  RAISE NOTICE '🎉 All profile summaries diversified successfully (ENGLISH VERSION)!';
END $$;
