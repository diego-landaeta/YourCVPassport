-- =============================================
-- SOLUCIÓN FINAL: Vista que no duplica lead_id
-- =============================================

-- Eliminar vista existente
DROP VIEW IF EXISTS public.conversation_summaries CASCADE;

-- Crear vista SIMPLE sin UNION
-- Cada lead aparece UNA VEZ, y los filtros se hacen en el frontend
CREATE VIEW public.conversation_summaries AS
SELECT
    l.id AS lead_id,
    -- El sender es quien envió el lead (su email está en sender_email)
    COALESCE(
        (SELECT u.id FROM auth.users u WHERE u.email = l.sender_email LIMIT 1),
        (SELECT id FROM auth.users LIMIT 1)
    ) AS sender_id,
    COALESCE(l.sender_name, 'Usuario') AS sender_name,
    -- El recipient es el dueño del perfil
    l.profile_id AS recipient_id,
    COALESCE(p.full_name, p.email, 'Usuario') AS recipient_name,
    'INQUIRY' AS lead_type,
    COALESCE(l.subject, 'Sin asunto') AS subject,
    COALESCE(l.status, 'new') AS status,
    -- Último mensaje
    (
        SELECT m.content
        FROM public.messages m
        WHERE m.lead_id = l.id
        ORDER BY m.created_at DESC
        LIMIT 1
    ) AS last_message,
    -- Fecha del último mensaje o creación del lead
    COALESCE(
        (
            SELECT m.created_at
            FROM public.messages m
            WHERE m.lead_id = l.id
            ORDER BY m.created_at DESC
            LIMIT 1
        ),
        l.created_at
    ) AS last_message_at,
    -- Mensajes no leídos para el recipient
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
        AND m.is_read = FALSE
        AND m.sender_id != l.profile_id
    ) AS unread_count,
    -- Total de mensajes
    (
        SELECT COUNT(*)
        FROM public.messages m
        WHERE m.lead_id = l.id
    ) AS message_count
FROM public.leads l
LEFT JOIN public.profiles p ON p.id = l.profile_id;

-- Verificar
SELECT
    '✅ VISTA RECREADA SIN DUPLICADOS' as status,
    COUNT(*) as total_conversaciones
FROM public.conversation_summaries;

-- Mostrar algunas conversaciones
SELECT
    lead_id,
    sender_id,
    sender_name,
    recipient_id,
    recipient_name,
    subject,
    message_count
FROM public.conversation_summaries
ORDER BY last_message_at DESC
LIMIT 10;
