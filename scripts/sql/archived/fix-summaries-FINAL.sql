-- ============================================================================
-- CORREGIR SUMMARIES - VERSIÓN FINAL
-- Acortados considerando \r\n que cuentan como caracteres
-- ============================================================================

-- 1. Richard Hamilton (944 → 799 chars)
UPDATE public.profiles
SET summary = 'I specialize in compassionate, evidence-based grief counseling to support individuals and families through loss and bereavement. With 9 years of clinical experience, I have facilitated hundreds of support groups and over 2,000 counseling sessions across all types of loss: death, suicide bereavement, perinatal loss, anticipatory grief, and traumatic loss.

My approach integrates thanatology research with therapeutic presence, drawing from modalities including Complicated Grief Treatment (CGT), Meaning Reconstruction, and Narrative Therapy.

At ISEIH, I teach practitioners how to provide effective grief support, combining scientific rigor with compassionate presence for transformative healing.'
WHERE email = 'richard.hamilton@iseih.edu';

-- 2. Janet Lee (943 → 796 chars)
UPDATE public.profiles
SET summary = 'I am dedicated to improving quality of life for older adults through person-centered care that honors autonomy, dignity, and individual preferences. With 11 years of experience in gerontological social work and geriatric care management, I have supported hundreds of elders and families navigating aging—from aging in place to memory care and end-of-life decisions.

My approach integrates clinical social work with understanding of aging processes, dementia care, elder advocacy, and family systems. Aging can be a time of continued growth when supported with compassionate care.

At ISEIH, I teach practitioners how to work effectively with older adults and families, addressing physical, emotional, social, and spiritual needs with cultural sensitivity.'
WHERE email = 'janet.lee@iseih.edu';

-- 3. Angela Roberts (924 → 795 chars)
UPDATE public.profiles
SET summary = 'I am passionate about supporting individuals in their journey toward personal growth and flourishing. With 9 years of experience integrating counseling psychology, positive psychology, and life coaching, I help people cultivate strengths, navigate transitions, and create lives aligned with their deepest values.

My approach draws from evidence-based positive psychology, human development theory, and strengths-based coaching. I believe human development is a lifelong process and everyone has capacity for growth and transformation.

At ISEIH, I teach practitioners how to facilitate integral human development—supporting clients in actively building wellbeing, meaning, purpose, and authentic self-expression.'
WHERE email = 'angela.roberts@iseih.edu';

-- 4. Maria Gonzalez (883 → 798 chars)
UPDATE public.profiles
SET summary = 'I specialize in culturally responsive family therapy that honors diverse traditions while facilitating healing. With 10 years working with multicultural families—particularly Latino and immigrant communities—I have witnessed how culturally adapted interventions create deeper connections and better outcomes.

My approach integrates systemic family therapy with cultural humility, recognizing that family structures and healing practices are shaped by culture. I work with immigration stress, intergenerational trauma, and acculturation challenges.

At ISEIH, I teach practitioners how to provide culturally competent family therapy that respects clients'' cultural identities while addressing mental health needs effectively.'
WHERE email = 'maria.gonzalez@iseih.edu';

-- 5. Brian Cooper (868 → 799 chars)
UPDATE public.profiles
SET summary = 'I specialize in energy psychology—particularly EFT (Emotional Freedom Techniques) and tapping—to help individuals process trauma and restore emotional balance. With 8 years of experience, I have supported hundreds of clients in releasing anxiety, PTSD, phobias, and emotional pain through body-based techniques.

My approach combines trauma treatment with energy psychology protocols that work with the body''s energy systems and nervous system. By addressing mind and body together, we facilitate profound healing.

At ISEIH, I teach practitioners practical energy psychology techniques they can use immediately with clients seeking relief from emotional suffering.'
WHERE email = 'brian.cooper@iseih.edu';

-- 6. Steven Mitchell (777 chars) - YA ESTÁ BIEN, NO NECESITA CAMBIOS
-- No se actualiza porque ya cumple con el límite de 800 caracteres

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
