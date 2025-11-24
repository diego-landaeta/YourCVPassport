-- =============================================
-- DIAGNÓSTICO SIMPLE Y EFECTIVO
-- =============================================

-- Ver todos los leads
SELECT
    '📋 LEADS' as info,
    id,
    profile_id,
    sender_email,
    sender_name,
    subject
FROM public.leads
ORDER BY created_at DESC;

-- Ver todos los usuarios
SELECT
    '👤 USUARIOS' as info,
    id,
    email
FROM auth.users
ORDER BY created_at DESC;

-- Ver qué devuelve conversation_summaries
SELECT
    '💬 CONVERSATION_SUMMARIES' as info,
    lead_id,
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    subject,
    message_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC;

-- Ver profiles
SELECT
    '👥 PROFILES' as info,
    id,
    full_name,
    email
FROM public.profiles
ORDER BY created_at DESC;
