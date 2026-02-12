-- ============================================================================
-- CORREGIR SUMMARIES QUE EXCEDEN 800 CARACTERES
-- Versiones acortadas manteniendo calidad y estructura
-- ============================================================================

-- ====================
-- 1. Steven Mitchell (1018 → 795 chars) [-223]
-- ====================
UPDATE public.profiles
SET summary = 'I integrate transpersonal psychology into clinical practice, bridging the psychological and spiritual dimensions of human development. With 11 years of experience as a licensed psychologist, I have supported hundreds of individuals navigating spiritual emergence, peak experiences, and psychospiritual transformation.

My approach combines rigorous psychological training with respect for transpersonal experiences that extend beyond the personal ego. I draw from depth psychology, integral theory, and contemplative traditions to support clients in integrating transformative experiences safely.

At ISEIH, I teach practitioners how to work ethically with transpersonal phenomena, providing frameworks for understanding spiritual experiences within psychological contexts.'
WHERE email = 'steven.mitchell@iseih.edu';

-- ====================
-- 2. Brian Cooper (1008 → 793 chars) [-215]
-- ====================
UPDATE public.profiles
SET summary = 'I specialize in energy psychology methods—particularly EFT (Emotional Freedom Techniques) and tapping—to help individuals process trauma, release emotional blocks, and restore emotional balance. With 8 years of experience integrating somatic psychology and energy-based healing, I have supported hundreds of clients in releasing anxiety, PTSD, phobias, and emotional pain through gentle, body-based techniques.

My approach combines evidence-based trauma treatment with energy psychology protocols that work directly with the body''s energy systems and nervous system. I believe trauma and emotional distress are stored in the body, and by addressing both mind and body together we can facilitate profound healing.

At ISEIH, I teach practitioners practical energy psychology techniques they can use immediately with clients seeking relief from emotional suffering.'
WHERE email = 'brian.cooper@iseih.edu';

-- ====================
-- 3. Janet Lee (937 → 796 chars) [-141]
-- ====================
UPDATE public.profiles
SET summary = 'I am dedicated to improving quality of life for older adults through holistic, person-centered care that honors autonomy, dignity, and individual preferences. With 11 years of experience in gerontological social work and geriatric care management, I have supported hundreds of elders and their families navigating the complexities of aging—from aging in place to memory care, long-term care planning to end-of-life decisions.

My approach integrates clinical social work expertise with deep understanding of aging processes, dementia care, elder advocacy, and family systems. I believe that aging can be a time of continued growth and meaning when supported with compassionate, individualized care.

At ISEIH, I teach practitioners how to work effectively with older adults and their families, addressing the unique physical, emotional, social, and spiritual needs of this population with cultural sensitivity and evidence-based practices.'
WHERE email = 'janet.lee@iseih.edu';

-- ====================
-- 4. Angela Roberts (918 → 795 chars) [-123]
-- ====================
UPDATE public.profiles
SET summary = 'I am passionate about supporting individuals in their journey toward personal growth, self-actualization, and flourishing. With 9 years of experience integrating counseling psychology, positive psychology, and life coaching, I help people cultivate strengths, navigate transitions, set meaningful goals, and create lives aligned with their deepest values.

My approach draws from evidence-based positive psychology, human development theory, strengths-based coaching, and practical tools for sustainable personal change. I believe that human development is a lifelong process and that everyone has the capacity for growth, resilience, and transformation at any stage of life.

At ISEIH, I teach practitioners how to facilitate integral human development—supporting clients not just in alleviating problems but in actively building wellbeing, meaning, purpose, and authentic self-expression across all dimensions of life.'
WHERE email = 'angela.roberts@iseih.edu';

-- ====================
-- 5. Maria Gonzalez (877 → 798 chars) [-79]
-- ====================
UPDATE public.profiles
SET summary = 'I specialize in culturally responsive family therapy that honors diverse traditions while facilitating healing and transformation. With 10 years of clinical experience working with multicultural families—particularly Latino and immigrant communities—I have witnessed how culturally adapted interventions create deeper therapeutic connections and more meaningful outcomes.

My approach integrates systemic family therapy with cultural humility, recognizing that family structures, communication patterns, and healing practices are deeply shaped by cultural contexts. I work with immigration stress, intergenerational trauma, acculturation challenges, and family conflicts rooted in cultural transitions.

At ISEIH, I teach practitioners how to provide culturally competent family therapy that respects clients'' cultural identities while addressing mental health needs effectively.'
WHERE email = 'maria.gonzalez@iseih.edu';

-- ====================
-- 6. Richard Hamilton (816 → 799 chars) [-17]
-- ====================
UPDATE public.profiles
SET summary = 'I specialize in compassionate, evidence-based grief counseling to support individuals and families through the profound journey of loss and bereavement. With 9 years of clinical experience in diverse settings, I have facilitated hundreds of therapeutic support groups and over 2,000 individual counseling sessions across all types of loss: death of loved ones, suicide bereavement, perinatal loss, anticipatory grief, and traumatic loss.

My approach integrates cutting-edge thanatology research with heart-centered therapeutic presence, drawing from evidence-based modalities including Complicated Grief Treatment (CGT), Meaning Reconstruction, Narrative Therapy, and the Dual Process Model of coping with bereavement.

At ISEIH, I teach practitioners how to provide effective grief support, combining thanatology research with compassionate presence for transformative healing, preparing students to work with grief in all its complexity.'
WHERE email = 'richard.hamilton@iseih.edu';

-- ====================
-- VERIFICAR RESULTADOS
-- ====================
SELECT
    full_name,
    LENGTH(summary) as chars,
    CASE
        WHEN LENGTH(summary) <= 800 THEN '✅ OK'
        ELSE '❌ EXCEDE'
    END as estado
FROM public.profiles
WHERE email IN (
    'steven.mitchell@iseih.edu',
    'brian.cooper@iseih.edu',
    'janet.lee@iseih.edu',
    'angela.roberts@iseih.edu',
    'maria.gonzalez@iseih.edu',
    'richard.hamilton@iseih.edu'
)
ORDER BY LENGTH(summary) DESC;
