-- =============================================
-- Verificar conversaciones específicas para Tster
-- =============================================

-- Ver el ID del usuario Tster
SELECT
    '👤 ID DE TSTER' as info,
    id as user_id,
    email
FROM auth.users
WHERE email = 'tester@dev.com';

-- Ver TODAS las conversaciones de la vista
SELECT
    '📋 TODAS LAS CONVERSACIONES' as info,
    lead_id,
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    subject,
    message_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC;

-- Simular el filtro exacto que usa el frontend para Tster
SELECT
    '🔍 FILTRO FRONTEND PARA TSTER' as info,
    *
FROM public.conversation_summaries
WHERE
    sender_id = (SELECT id FROM auth.users WHERE email = 'tester@dev.com')
    OR
    recipient_id = (SELECT id FROM auth.users WHERE email = 'tester@dev.com')
ORDER BY last_message_at DESC;

-- Ver si hay algún problema con el profile
SELECT
    '👥 PROFILE DE TSTER' as info,
    p.id as profile_id,
    p.email as profile_email,
    u.id as user_id,
    u.email as user_email,
    CASE WHEN p.id = u.id THEN '✅ COINCIDEN' ELSE '❌ NO COINCIDEN' END as match_status
FROM public.profiles p
JOIN auth.users u ON u.email = 'tester@dev.com'
WHERE p.email = 'tester@dev.com' OR p.id = u.id;
