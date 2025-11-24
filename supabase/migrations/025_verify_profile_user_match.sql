-- =============================================
-- Verificar que profiles.id = auth.users.id
-- =============================================

-- Ver relación entre usuarios y profiles
SELECT
    '🔍 VERIFICACIÓN USER <-> PROFILE' as info,
    u.id as user_id,
    u.email as user_email,
    p.id as profile_id,
    p.email as profile_email,
    p.full_name,
    CASE
        WHEN u.id = p.id THEN '✅ COINCIDEN'
        ELSE '❌ NO COINCIDEN'
    END as match_status
FROM auth.users u
FULL OUTER JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC NULLS LAST;

-- Ver qué ID está usando MessagingView para filtrar
-- Para el usuario tester@dev.com
SELECT
    '📊 CONVERSACIONES PARA TESTER (usando profile.id)' as info,
    cs.*
FROM public.conversation_summaries cs
WHERE
    cs.sender_id = (SELECT id FROM public.profiles WHERE email = 'tester@dev.com')
    OR
    cs.recipient_id = (SELECT id FROM public.profiles WHERE email = 'tester@dev.com');

-- Ver conversaciones usando auth.users.id
SELECT
    '📊 CONVERSACIONES PARA TESTER (usando user.id)' as info,
    cs.*
FROM public.conversation_summaries cs
WHERE
    cs.sender_id = (SELECT id FROM auth.users WHERE email = 'tester@dev.com')
    OR
    cs.recipient_id = (SELECT id FROM auth.users WHERE email = 'tester@dev.com');
