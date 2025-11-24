-- =============================================
-- DIAGNÓSTICO: Ver exactamente qué está pasando
-- =============================================

-- PASO 1: Ver todos los leads
SELECT
    '📋 LEADS EN LA BASE DE DATOS' as status,
    id,
    profile_id,
    sender_email,
    sender_name,
    subject,
    created_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 10;

-- PASO 2: Ver todos los mensajes
SELECT
    '💬 MENSAJES EN LA BASE DE DATOS' as status,
    id,
    lead_id,
    sender_id,
    sender_name,
    content,
    created_at
FROM public.messages
ORDER BY created_at DESC
LIMIT 10;

-- PASO 3: Ver qué muestra conversation_summaries
SELECT
    '👁️ CONVERSATION_SUMMARIES (LO QUE VE EL FRONTEND)' as status,
    lead_id,
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    subject,
    last_message,
    message_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC
LIMIT 10;

-- PASO 4: Ver usuarios en auth.users
SELECT
    '👤 USUARIOS REGISTRADOS' as status,
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- PASO 5: Verificar si el WHERE EXISTS funciona
SELECT
    '🔍 LEADS CON SENDER_EMAIL QUE EXISTE EN AUTH.USERS' as status,
    l.id,
    l.sender_email,
    l.sender_name,
    l.subject,
    (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1) as user_id_found
FROM public.leads l
WHERE EXISTS (
    SELECT 1 FROM auth.users u WHERE u.email = l.sender_email
)
ORDER BY l.created_at DESC;
